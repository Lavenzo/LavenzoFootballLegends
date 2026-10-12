import { getDifficulty } from './config.js';
import {makePlayers,FIELD as F} from './data.js';
import {Ball,GRAVITY} from './ball.js';
import {aiIntent} from './ai.js';
import {chooseSwitch,moveDirection,targetScore,clamp,distance,sweptContact,interceptionScore} from './gameplay.js';
export class Match {
 constructor(input){this.input=input;this.players=makePlayers();this.ball=new Ball();this.duration=180;this.stepDt=1/60;this.possessionTime=0;this.reset();}
 reset(){this.score=[0,0];this.time=this.duration;this.state='playing';this.selected=0;this.message='KICK OFF';this.messageTime=2;this.goalDelay=0;this.shotSerial=0;this.kickoff(0);}
 kickoff(team){
  const positions=[[350,325],[255,180],[255,470],[750,325],[845,180],[845,470],[84,325],[1016,325]];
  this.players.forEach((p,i)=>{[p.x,p.y]=positions[i];p.vx=p.vy=0;p.kick=0;p.cooldown=.5;p.keeperAim=325;p.keeperReaction=0;p.seenRelease=null;p.face=p.team?-1:1;});
  this.ball.reset();this.ball.owner=team?3:0;const p=this.players[this.ball.owner];this.ball.x=p.x+p.face*12;this.ball.y=p.y+8;this.ball.previous={x:this.ball.x,y:this.ball.y,z:0};this.selected=0;this.observedOwner=this.ball.owner;this.possessionTime=this.time;
 }
 selectPlayer(id){
  const p=this.players[id];if(!p||p.team!==0||id===this.selected)return;
  this.selected=id;
  // Remove the incoming AI velocity so held arrow commands take effect in this frame.
  p.vx=p.vy=0;
 }
 switchPlayer(){this.selectPlayer(chooseSwitch(this.players,this.selected,this.ball));}
 syncPossessionControl(){
  const owner=this.ball.owner;if(owner===this.observedOwner)return;
  this.observedOwner=owner;
  if(owner===null)return;
  const carrier=this.players[owner];
  if(carrier.team===0)this.selectPlayer(owner);
  else {
   const defender=this.players.filter(p=>p.team===0&&!p.keeper)
    .sort((a,b)=>interceptionScore(a,this.ball)-interceptionScore(b,this.ball)||a.id-b.id)[0];
   if(defender)this.selectPlayer(defender.id);
  }
 }
 collectBall(p){
  this.ball.collect(p);this.syncPossessionControl();
  if (p.team===0) this.possessionTime = this.time;
  else this.possessionTime = this.time; // Update for CPU as well to track duration
 }
 passScore(p,q,type='s'){
  let score = targetScore(p,q,moveDirection(p,this.input,this.selected),type,this.players);
  const config = getDifficulty();
  if (p.team === 0) score *= config.passAssistance;
  return score;
}
 passTarget(p,type){return this.players.filter(q=>q.team===p.team&&q.id!==p.id&&!q.keeper).sort((a,b)=>this.passScore(p,b,type)-this.passScore(p,a,type)||a.id-b.id)[0];}
 action(p,type){
  const b=this.ball;if(p.cooldown>0||b.owner!==p.id)return false;
  const attack=p.team?-1:1,dir=moveDirection(p,this.input,this.selected);let target,power,lift=0,options={kind:type};
  if(type==='d'){
   const spread=(100-p.stats.shooting)*1.1,error=Math.sin(++this.shotSerial*2.399963+p.id)*spread;
   const keeper=this.players.find(q=>q.keeper&&q.team!==p.team);
   const manual=p.id===this.selected&&this.input.movement().y!==0;
   const corner=manual?0:(keeper.y>=325?-49:49);
   target={x:p.team?F.left-35:F.right+35,y:clamp(325+corner+(p.y-325)*.10+dir.y*(p.id===this.selected?48:12)+error,F.goalTop-35,F.goalBottom+35)};
   power=400+p.stats.shooting*3+Math.max(0,p.vx*attack)*.25;lift=35+(100-p.stats.shooting)*.45;
  }else{
   const receiver=this.passTarget(p,type);if(!receiver)return false;
   const d=distance(p,receiver),cross=type==='a',flight=cross?clamp(d/360,.95,1.65):clamp(d/440,.25,1.15);
   const progress=cross?attack*Math.min(105,d*.22):0;
   const error=Math.sin(this.time*3+p.id)*(100-p.stats.passing)*(cross?.28:.12);
   target={x:clamp(receiver.x+receiver.vx*(cross?.25:.12)+progress,F.left+24,F.right-24),y:clamp(receiver.y+8+receiver.vy*(cross?.25:.12)+error,F.top+24,F.bottom-24)};
   const travel=Math.hypot(target.x-b.x,target.y-b.y),drag=cross?.16:.72;
   power=travel*drag/(1-Math.exp(-drag*flight));lift=cross?GRAVITY*flight/2:0;
   options={kind:type,receiver:receiver.id,landing:target,flightTime:flight};
  }
  // Release at the ball's current position, even during a receiving touch.
  const humanKick=p.team===0&&p.id===this.selected;
  b.launch(p,target,power,lift,options);p.cooldown=.5;this.observedOwner=null;
  if(humanKick&&options.receiver!==undefined)this.selectPlayer(options.receiver);
  this.message=type==='a'?'LOFTED CROSS':type==='s'?'SHORT PASS':'SHOT!';this.messageTime=.8;return true;
 }
 update(dt){
  if(this.input.consume('escape')&&['playing','paused'].includes(this.state))this.state=this.state==='paused'?'playing':'paused';if(this.state!=='playing')return;
  this.stepDt=dt;this.syncPossessionControl();this.messageTime=Math.max(0,this.messageTime-dt);
  if(this.goalDelay>0){this.goalDelay-=dt;if(this.goalDelay<=0)this.kickoff(this.nextKickoff);return;}
  this.time=Math.max(0,this.time-dt);if(this.time===0){this.state='finished';return;}
  for(const p of this.players){p.cooldown=Math.max(0,p.cooldown-dt);p.kick=Math.max(0,p.kick-dt);}
  // Consume each key once for the original actor, then transfer control before choosing movement.
  const actor=this.players[this.selected];let kicked=false;
  let s_consumed=this.input.consume('s');if(s_consumed&&actor&&!kicked){if(this.ball.owner===actor.id)kicked=this.action(actor,'s');else this.switchPlayer();}for(const key of ['a','d'])if(this.input.consume(key)&&actor&&!kicked)kicked=this.action(actor,key);
  // Fix the keyboard owner for this movement phase; all other players get only AI intentions.
  const controlled=this.selected;
  const intents=this.players.map(p=>{
   if(p.id===controlled){
    const movement = this.input.movement();
    if(movement.x===0 && movement.y===0 && this.ball.receiver===p.id && this.ball.owner===null) return aiIntent(p,this);
    return movement;
   }
   return aiIntent(p,this);
  });
  const config = getDifficulty();
  for(const p of this.players){
   const intent=intents[p.id];
   let maxSpeed=(95+p.stats.speed*1.15)*(this.ball.owner===p.id?.80+p.stats.dribbling*.0018:1);
   let acceleration=320+p.stats.acceleration*5;

   if(p.team === 0) {
     acceleration *= (config.humanAccelerationMod || 1.35); // Boost human acceleration/turning responsiveness
     maxSpeed *= (config.humanSpeedMod || 1.0);
   } else {
     acceleration *= (config.cpuAccelerationMod || 1.0);
     maxSpeed *= (config.cpuSpeedMod || 1.0);
   }

   const approach=(v,t)=>v+clamp(t-v,-acceleration*dt,acceleration*dt);
   p.vx=approach(p.vx,intent.x*maxSpeed);p.vy=approach(p.vy,intent.y*maxSpeed);
   p.x=clamp(p.x+p.vx*dt,F.left+12,F.right-12);p.y=clamp(p.y+p.vy*dt,F.top+15,F.bottom-15);
   if(Math.abs(p.vx)>5)p.face=Math.sign(p.vx);p.anim+=dt*(Math.hypot(p.vx,p.vy)>15?8+Math.hypot(p.vx,p.vy)*.025:2);
   if(p.id!==controlled&&intent.action)this.action(p,intent.action);
  }
  this.ball.update(dt,this.players);this.resolveReceivers();this.resolveTackles();const b=this.ball;
  if(b.x<F.left-7||b.x>F.right+7){const team=b.x>F.right?0:1;this.score[team]++;this.message='GOAL!';this.messageTime=2.5;this.goalDelay=2.5;this.nextKickoff=1-team;}
 }
 resolveReceivers(){
  const b=this.ball;if(b.owner!==null)return;const contacts=[];
  const config = getDifficulty();
  for(const p of this.players){
   if(p.id===b.lastKicker&&b.lock>0)continue;const assisted=b.receiver===p.id&&b.lastTeam===p.team;
   let radius=p.keeper?27:assisted?25+p.stats.dribbling*.025:19;
   if(p.team === 0 && assisted) radius *= config.passAssistance; // Boost human receiver radius
   const hit=sweptContact(b,p,radius,p.keeper?62:assisted?20:16);if(hit)contacts.push({p,hit});
  }
  contacts.sort((a,c)=>a.hit.t-c.hit.t||distance(a.p,b)-distance(c.p,b)||a.p.id-c.p.id);
  const contact=contacts[0];if(!contact)return;const {p,hit}=contact;
  // Stop on the continuous flight path, not at the receiving player's position.
  b.x=hit.x;b.y=hit.y;this.collectBall(p);
  if(p.keeper){this.message='KEEPER SAVE';this.messageTime=1.2;p.cooldown=.45;}
 }
 resolveTackles(){
  const b=this.ball;if(b.owner===null)return;const owner=this.players[b.owner];if(owner.cooldown>.25)return;
  const config = getDifficulty();
  for(const p of this.players){
   const d = distance(p,owner);

   // Handle protection and reaction times for CPU
   if(p.team !== 0 && owner.team === 0){
     if(this.possessionTime - this.time < config.humanPossessionProtection) continue;
     if(this.possessionTime - this.time < config.cpuReactionDelay) continue;
   }

   const maxDist = p.team === 0 ? config.tackleRadius : 22;
   if(p.team===owner.team||p.cooldown>0||d>maxDist)continue;

   let threshold = 40+owner.stats.strength*.5+owner.stats.dribbling*.25-p.stats.strength*.3;
   if(p.team !== 0) threshold += config.cpuTackleThresholdMod;
   else {
    threshold += config.humanTackleThresholdMod;
    threshold *= (config.cpuDribblingResistanceMod || 1.0);
   }

   const relative=Math.hypot(p.vx-owner.vx,p.vy-owner.vy);
   const successDist = p.team === 0 ? Math.max(14, config.tackleRadius * 0.75) : 14;

   if(relative>threshold || d<successDist){
    this.collectBall(p);p.cooldown=.65;owner.cooldown=.5;
    if(p.team===0){
      this.message='TACKLE!';this.messageTime=0.8;
      // Immediately give control to the tackler if they are human
      this.selectPlayer(p.id);
    }
    break;
   }else{
    // Unsuccessful tackle attempt within range
    p.cooldown = p.team === 0 ? (config.humanTackleCooldown || 0.3) : config.cpuTackleCooldown;
   }
  }
 }
}
