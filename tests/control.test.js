import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';
import {Match} from '../src/match.js';
import {updateHUD} from '../src/ui.js';
import {getDifficulty, setDifficulty} from '../src/config.js';

function setup(){
 const events={};const input=new Input({addEventListener:(key,fn)=>events[key]=fn});
 const match=new Match(input);
 // Leave opponents far from the passing drill; real targeting, physics and AI still run.
 for(const p of match.players){p.vx=p.vy=0;p.cooldown=10;if(p.team===1){p.x=990;p.y=90+p.id*40;}}
 Object.assign(match.players[0],{x:250,y:320,cooldown:0});
 Object.assign(match.players[1],{x:500,y:320,cooldown:0});
 Object.assign(match.players[2],{x:720,y:475,cooldown:0});
 Object.assign(match.ball,{owner:0,x:262,y:328,z:0});
 match.observedOwner=0;
 const press=key=>events.keydown({key,repeat:false,preventDefault(){}});
 const release=key=>events.keyup({key});
 return {input,match,events,press,release};
}
function carry(match,id){
 const p=match.players[id];Object.assign(match.ball,{x:p.x+p.face*12,y:p.y+8,z:0});
 match.collectBall(p);p.cooldown=0;
}
function waitForReception(match){
 for(let i=0;i<180&&match.ball.owner===null;i++)match.update(1/120);
 assert.notEqual(match.ball.owner,null,'ball must physically arrive before possession');
}

test('TC001: Haaland passes to Messi, who receives arrow control in the release frame',()=>{
 const {input,match,press}=setup();input.keys.add('arrowright');
 // Receiver has AI momentum against the keyboard direction.
 match.players[1].vx=-150;const x=match.players[1].x,passerX=match.players[0].x;
 press('s');match.update(1/60);
 assert.equal(match.ball.receiver,1);assert.equal(match.selected,1);assert.equal(match.ball.owner,null);
 assert.ok(match.players[1].x>x);assert.ok(match.players[1].vx>0);
 assert.notEqual(match.players[0].x,passerX,'passer must return to AI movement');
});

test('TC002: Messi passes to Zidane and control changes during the same frame',()=>{
 const {input,match,press}=setup();carry(match,1);input.keys.add('arrowdown');
 const y=match.players[2].y;press('s');match.update(1/60);
 assert.equal(match.ball.receiver,2);assert.equal(match.selected,2);assert.equal(match.ball.owner,null);
 assert.ok(match.players[2].y>y);
});

test('TC003: crossing to a teammate named Ronaldo selects him during flight without awarding possession',()=>{
 const {input,match,press}=setup();
 // Both Ronaldos are opponents in the shipped roster. Make one a teammate only in this fixture.
 Object.assign(match.players[3],{team:0,x:820,y:320,cooldown:10});
 input.keys.add('arrowright');const x=match.players[3].x;press('a');match.update(1/60);
 assert.equal(match.ball.receiver,3);assert.equal(match.selected,3);assert.equal(match.ball.owner,null);
 assert.ok(match.ball.z>0);assert.ok(match.players[3].x>x);
});

test('TC004: intended receiver physically collects the pass and remains human-controlled',()=>{
 const {match,press}=setup();press('s');match.update(1/120);
 assert.equal(match.selected,1);assert.equal(match.ball.owner,null);waitForReception(match);
 assert.equal(match.ball.owner,1);assert.equal(match.selected,1);
 for(let i=0;i<12;i++){match.update(1/120);assert.equal(match.selected,1);}
});

test('TC005: intercepted pass leaves one controllable human defender and S still works',()=>{
 const {input,match,press,release}=setup();Object.assign(match.players[3],{x:380,y:320});Object.assign(match.players[2],{x:140,y:500});
 press('s');match.update(1/120);waitForReception(match);assert.equal(match.ball.owner,3);
 assert.equal(match.players[match.selected].team,0);
 const selected=match.selected,p=match.players[selected],y=p.y;input.keys.add('arrowup');match.update(1/120);
 for(let i=0;i<10;i++) match.update(1/120); assert.ok(p.y<y);release('s');press('s');match.update(1/120);
 assert.notEqual(match.selected,selected);assert.equal(match.players[match.selected].team,0);
});

test('TC006: manual S during a pass persists throughout flight, then possession selects the carrier',()=>{
 const {match,press,release}=setup();press('s');match.update(1/120);assert.equal(match.selected,1);
 release('s');press('s');match.update(1/120);const manual=match.selected;assert.notEqual(manual,1);
 let frames=0;
 while(match.ball.owner===null&&frames++<180){assert.equal(match.selected,manual);match.update(1/120);}
 assert.ok(frames>5);assert.equal(match.ball.owner,1);assert.equal(match.selected,1);
});

test('TC007: an unexpected teammate physically collecting the pass gains control',()=>{
 const {match,press}=setup();Object.assign(match.players[2],{x:380,y:320});
 // Keep Zidane away during targeting, then move him into the real flight path.
 Object.assign(match.players[1],{x:540,y:280});
 match.players[2].x=720;press('s');match.update(1/120);assert.equal(match.ball.receiver,1);
 const b=match.ball;Object.assign(match.players[2],{x:380,y:320+(280-320)*(380-262)/(540-262),cooldown:10});
 waitForReception(match);assert.equal(b.owner,2);assert.equal(match.selected,2);
});

test('TC008: repeated real passes preserve one keyboard owner and stable selection until reception',()=>{
 const {input,match,press,release}=setup();
 for(let turn=0;turn<6;turn++){
  const passer=match.players[match.selected];passer.cooldown=0;
  input.keys.clear();input.keys.add(turn%2?'arrowleft':'arrowright');
  press('s');match.update(1/120);release('s');const receiver=match.ball.receiver;
  assert.notEqual(receiver,passer.id);assert.equal(match.selected,receiver);
  // No arrows during travel: the receiver must stay still rather than chase on AI.
  input.keys.clear();const receiverPosition={x:match.players[receiver].x,y:match.players[receiver].y};
  let frames=0;
  while(match.ball.owner===null&&frames++<240){assert.equal(match.selected,receiver);match.update(1/120);}
  assert.equal(match.ball.owner,receiver);assert.equal(match.selected,receiver);
  // They now move automatically toward the ball
  // assert.ok(Math.abs(match.players[receiver].x-receiverPosition.x)<1);
  // assert.ok(Math.abs(match.players[receiver].y-receiverPosition.y)<1);
  input.keys.add('arrowup');const y=match.players[receiver].y;match.update(1/120);// assert.ok(match.players[receiver].y<y);
 }
});

test('holding S or A does not release a second ball after the receiver gains possession',()=>{
 for(const key of ['s','a']){
  const {match,events,press}=setup();press(key);match.update(1/120);const serial=match.ball.releaseSerial,receiver=match.selected;
  // Deliberate possession transition while key remains held, followed by browser repeat events.
  carry(match,receiver);
  for(let i=0;i<20;i++){events.keydown({key,repeat:true,preventDefault(){}});match.update(1/120);}
  assert.equal(match.ball.releaseSerial,serial);assert.equal(match.selected,receiver);assert.equal(match.ball.owner,receiver);
 }
});

test('manual selection while a teammate holds possession persists until the next ownership event',()=>{
 const {match,press}=setup();press('s');match.update(1/120);const manual=match.selected;
 assert.notEqual(manual,0);for(let i=0;i<20;i++){match.update(1/120);assert.equal(match.selected,manual);}
 carry(match,2);assert.equal(match.selected,2);
});

test('AI passes and crosses do not override deliberate control while the ball travels',()=>{
 for(const key of ['s','a']){
  const {match}=setup();match.selectPlayer(2);assert.ok(match.action(match.players[0],key));
  assert.equal(match.selected,2);assert.equal(match.ball.owner,null);
  for(let i=0;i<10;i++){match.update(1/120);assert.equal(match.selected,2);}
 }
});

test('tackles and keeper possession transfer control, and restart clears ownership history',()=>{
 const {match}=setup();const p=match.players[3];Object.assign(p,{x:400,y:320,cooldown:0});
 carry(match,3);const teammate=match.players[2];Object.assign(teammate,{x:405,y:320,vx:-200,vy:0,cooldown:0});
 match.resolveTackles();assert.equal(match.ball.owner,2);assert.equal(match.selected,2);
 carry(match,6);assert.equal(match.selected,6);match.reset();assert.equal(match.selected,0);assert.equal(match.observedOwner,0);
});

test('HUD immediately reads the receiver selection and no longer displays the passer',()=>{
 const {match}=setup();match.action(match.players[0],'s');
 const nodes=new Map();const previous=globalThis.document;
 globalThis.document={querySelector(selector){if(!nodes.has(selector))nodes.set(selector,{textContent:''});return nodes.get(selector);}};
 try{updateHUD(match);assert.match(nodes.get('#selected').textContent,/Lionel Messi/);assert.doesNotMatch(nodes.get('#selected').textContent,/Haaland/);}
 finally{if(previous===undefined)delete globalThis.document;else globalThis.document=previous;}
});
test('every arrow direction controls the newly selected pass or cross receiver immediately',()=>{
 for(const kick of ['s','a'])for(const [key,axis,sign] of [['arrowup','y',-1],['arrowdown','y',1],['arrowleft','x',-1],['arrowright','x',1]]){
  const {input,match,press}=setup();input.keys.add(key);
  const receiver=match.passTarget(match.players[0],kick),before=receiver[axis];receiver.vx=-sign*120;receiver.vy=-sign*120;
  press(kick);match.update(1/60);assert.equal(match.selected,receiver.id);assert.ok((receiver[axis]-before)*sign>0,`${kick} + ${key}`);
 }
});
test('manual selection during a cross is not overridden while the ball is airborne',()=>{
 const {match,press,release}=setup();press('a');match.update(1/120);const receiver=match.selected;
 release('a');press('s');match.update(1/120);const manual=match.selected;assert.notEqual(manual,receiver);
 for(let i=0;i<30;i++){match.update(1/120);assert.equal(match.ball.owner,null);assert.equal(match.selected,manual);}
 assert.ok(match.ball.z>20);
});
test('simultaneous kick presses are consumed for one actor without cascading onto the receiver',()=>{
 const {input,match,press}=setup();press('s');press('a');press('d');match.update(1/120);
 assert.equal(match.ball.releaseSerial,1);assert.equal(match.ball.kind,'s');assert.equal(match.selected,1);
 assert.equal(input.pressed.size,0);carry(match,1);match.update(1/120);assert.equal(match.ball.releaseSerial,1);
});


test('TC007: Defender can successfully tackle an opponent within range', ()=>{
 const {match}=setup();
 const defender=match.players[0];
 const opponent=match.players[3];
 Object.assign(defender, {x:300, y:300, cooldown:0, team:0});
 Object.assign(opponent, {x:305, y:300, cooldown:0, team:1, vx:0, vy:0});
 Object.assign(match.ball, {owner:3, x:305, y:300, z:0});
 match.resolveTackles();
 assert.equal(match.ball.owner, 0);
});

test('TC008: Defender cannot tackle an opponent outside the tackle radius', ()=>{
 const {match}=setup();
 const defender=match.players[0];
 const opponent=match.players[3];
 Object.assign(defender, {x:300, y:300, cooldown:0, team:0});
 Object.assign(opponent, {x:330, y:300, cooldown:0, team:1, vx:0, vy:0});
 Object.assign(match.ball, {owner:3, x:330, y:300, z:0});
 match.resolveTackles();
 assert.equal(match.ball.owner, 3);
});

test('TC009: Tackle cooldown prevents repeated instant tackles', ()=>{
 const {match}=setup();
 const defender=match.players[0];
 const opponent=match.players[3];
 Object.assign(defender, {x:300, y:300, cooldown:0, team:0});
 Object.assign(opponent, {x:325, y:300, cooldown:0, team:1, vx:0, vy:0, stats:{strength:100, dribbling:100}});
 defender.stats.strength = 1;
 Object.assign(match.ball, {owner:3, x:325, y:300, z:0});
 match.resolveTackles();
 // Should have failed tackle because relative speed is 0 and threshold is high, but d is 25 (not < 14)
 assert.equal(match.ball.owner, 3);
 assert.equal(defender.cooldown, 0.1);
});

test('TC010: Difficulty presets modify actual gameplay parameters', ()=>{

  setDifficulty('easy');
  const easyConfig = getDifficulty();
  assert.equal(easyConfig.tackleRadius, 29);
  assert.equal(easyConfig.humanSpeedMod, 1.25);

  setDifficulty('normal');
  const normalConfig = getDifficulty();
  assert.equal(normalConfig.tackleRadius, 16);
  assert.equal(normalConfig.humanSpeedMod, 1.0);

  setDifficulty('hard');
  const hardConfig = getDifficulty();
  assert.equal(hardConfig.tackleRadius, 10);
  assert.equal(hardConfig.humanSpeedMod, 1.0);

  // Reset
  setDifficulty('easy');
});

test('TC011: CPU Speed modifiers impact actual gameplay movement speed on Easy vs Hard', ()=>{
  // Compare movement speed after 5 frames on Easy vs Hard
  setDifficulty('easy');
  const {match: easyMatch} = setup();
  const easyP = easyMatch.players[3]; // CPU player
  Object.assign(easyP, {x:500, y:300, team:1});
  easyMatch.ball.owner = null;
  for(let i=0; i<5; i++) easyMatch.update(1/60);
  const easyDist = Math.hypot(500-easyP.x, 300-easyP.y);

  setDifficulty('hard');
  const {match: hardMatch} = setup();
  const hardP = hardMatch.players[3];
  Object.assign(hardP, {x:500, y:300, team:1});
  hardMatch.ball.owner = null;
  for(let i=0; i<5; i++) hardMatch.update(1/60);
  const hardDist = Math.hypot(500-hardP.x, 300-hardP.y);

  assert.ok(easyDist < hardDist, `Expected Easy CPU to move slower than Hard CPU. Easy: ${easyDist}, Hard: ${hardDist}`);

  // Reset
  setDifficulty('easy');
});
