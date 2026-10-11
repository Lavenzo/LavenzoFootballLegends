import {FIELD as F} from './data.js';
import {clamp,distance,interceptionPoint,interceptionScore} from './gameplay.js';
export function aiIntent(p,match){
 const b=match.ball,owner=b.owner===null?null:match.players[b.owner],attack=p.team===0?1:-1,goalX=p.team===0?F.right:F.left;
 if(p.keeper){
  if(owner===p)return {x:0,y:0,action:p.cooldown<=0?'s':undefined};
  const incoming=b.owner===null&&b.vx*attack< -60;
  if(incoming&&p.seenRelease!==b.releaseSerial){p.seenRelease=b.releaseSerial;p.keeperReaction=.14+(100-p.stats.acceleration)*.0015;}
  p.keeperReaction=Math.max(0,(p.keeperReaction??0)-match.stepDt);
  const seconds=incoming?clamp((p.x-b.x)/(b.vx||1),0,1.5):0;
  const desired=clamp(b.y+b.vy*seconds,F.goalTop+6,F.goalBottom-6);
  p.keeperAim??=325;if(!incoming||p.keeperReaction===0)p.keeperAim+=(desired-p.keeperAim)*(1-Math.exp(-(3+p.stats.acceleration*.025)*match.stepDt));
  return direction(p,{x:p.team?F.right-24:F.left+24,y:p.keeperAim},1);
 }
 if(owner===p){
  const range=Math.abs(goalX-p.x);if(range<330&&p.cooldown<=0)return {...direction(p,{x:goalX,y:325}),action:'d'};
  if(match.players.some(q=>q.team!==p.team&&!q.keeper&&distance(p,q)<58)&&p.cooldown<=0)return {...direction(p,{x:goalX,y:325}),action:'s'};
  return direction(p,{x:goalX-attack*80,y:325+(p.id%3-1)*52});
 }
 const squad=match.players.filter(q=>q.team===p.team&&!q.keeper);
 const intended=squad.find(q=>q.id===b.receiver);
 const chaser=intended??[...squad].sort((a,c)=>interceptionScore(a,b)-interceptionScore(c,b)||a.id-c.id)[0];let target;
 if(b.owner===null&&b.receiver===p.id){target=b.kind==='a'&&b.flightTime>.18?b.landing:interceptionPoint(b,.16);}
 else if(!owner||owner.team!==p.team){
  if(chaser.id===p.id)target=interceptionPoint(b,.24);
  else {const lane=160+(p.id%3)*165;target={x:clamp(b.x-attack*(140+(p.id%2)*45),130,970),y:clamp(b.y*.35+lane*.65,115,535)};}
 }else target={x:clamp(owner.x+attack*(135+(p.id%2)*95),145,955),y:155+(p.id%3)*170};
 const desired=direction(p,target??b);
 for(const q of squad){if(q.id===p.id)continue;const d=distance(p,q);if(d>0&&d<65){desired.x+=(p.x-q.x)/d*(1-d/65)*1.4;desired.y+=(p.y-q.y)/d*(1-d/65)*1.4;}}
 const n=Math.hypot(desired.x,desired.y);if(n>1){desired.x/=n;desired.y/=n;}return desired;
}
function direction(p,t,deadZone=6){const dx=t.x-p.x,dy=t.y-p.y,n=Math.hypot(dx,dy);return n<deadZone?{x:0,y:0}:{x:dx/n*Math.min(1,n/32),y:dy/n*Math.min(1,n/32)};}
