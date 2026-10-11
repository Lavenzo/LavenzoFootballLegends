import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';
import {Match} from '../src/match.js';
import {Ball} from '../src/ball.js';
import {aiIntent} from '../src/ai.js';
import {chooseSwitch,layoutLabels,sweptContact,distance} from '../src/gameplay.js';
function setup(){const events={};const input=new Input({addEventListener:(k,fn)=>events[k]=fn});return {input,events,match:new Match(input)};}
function isolate(match){for(const p of match.players){p.x=900;p.y=100+p.id*50;p.vx=p.vy=0;p.cooldown=10;}match.players[0].x=300;match.players[0].y=325;match.players[0].cooldown=0;Object.assign(match.ball,{owner:0,x:312,y:333,z:0});}
test('W chooses nearest available outfield teammate, excludes current and respects possession',()=>{
 const {match}=setup();const b=match.ball;Object.assign(b,{owner:null,x:300,y:180,vx:0,vy:0});
 assert.equal(chooseSwitch(match.players,0,b),1);match.selected=1;assert.notEqual(chooseSwitch(match.players,1,b),1);
 b.owner=2;assert.equal(chooseSwitch(match.players,0,b),2);
});
test('defensive switching favours the predicted interception position deterministically',()=>{
 const {match}=setup();const [current,near,interceptor]=match.players;
 Object.assign(near,{x:400,y:300});Object.assign(interceptor,{x:500,y:300});
 near.stats.speed=interceptor.stats.speed=80;Object.assign(match.ball,{owner:null,x:400,y:300,vx:300,vy:0});
 for(let i=0;i<20;i++)assert.equal(chooseSwitch(match.players,current.id,match.ball),interceptor.id);
});
test('held W and browser repeat events produce exactly one switch until release',()=>{
 const {input,events,match}=setup();const key=(repeat=false)=>events.keydown({key:'w',repeat,preventDefault(){}});
 key();match.update(.016);const selected=match.selected;
 for(let i=0;i<12;i++){key(true);match.update(.016);assert.equal(match.selected,selected);}
 events.keyup({key:'w'});key();match.update(.016);assert.notEqual(match.selected,selected);
});
test('switching replaces opposing AI momentum and movement starts on the same frame',()=>{
 const {input,match}=setup();match.ball.owner=1;match.observedOwner=1;match.players[1].vy=180;input.keys.add('arrowup');input.pressed.add('w');
 const y=match.players[1].y;match.update(.016);assert.equal(match.selected,1);assert.ok(match.players[1].y<y);
});
test('pass targeting follows held movement and AI does not read the human arrow direction',()=>{
 const {input,match}=setup();input.keys.add('arrowup');assert.equal(match.passTarget(match.players[0],'s').id,1);
 input.keys.clear();input.keys.add('arrowdown');assert.equal(match.passTarget(match.players[0],'s').id,2);
 const ai=match.players[3];ai.vx=0;ai.vy=-100;assert.equal(match.passTarget(ai,'s').id,4);
 for(const p of match.players.filter(p=>!p.keeper))assert.equal(match.passTarget(p,'s').team,p.team);
});
test('short pass travels continuously and receiving assistance collects it',()=>{
 const {match}=setup();isolate(match);const receiver=match.players[1];receiver.x=550;receiver.y=325;
 match.players[2].x=130;match.players[2].y=500;assert.ok(match.action(match.players[0],'s'));
 assert.equal(match.ball.receiver,1);const initial=match.ball.x;assert.equal(initial,312);
 let last={x:match.ball.x,y:match.ball.y},maxStep=0;
 for(let i=0;i<100&&match.ball.owner===null;i++){
  match.ball.update(.016,match.players);match.resolveReceivers();maxStep=Math.max(maxStep,distance(last,match.ball));last={x:match.ball.x,y:match.ball.y};
 }
 assert.equal(match.ball.owner,1);assert.ok(maxStep<15);assert.ok(match.ball.x<receiver.x+12);
 const x=match.ball.x;match.ball.update(.016,match.players);assert.ok(Math.abs(match.ball.x-x)<15);
});
test('an opponent in a passing lane can intercept before the assisted receiver',()=>{
 const {match}=setup();isolate(match);Object.assign(match.players[1],{x:600,y:325});Object.assign(match.players[2],{x:130,y:500});
 Object.assign(match.players[3],{x:430,y:325});match.action(match.players[0],'s');
 for(let i=0;i<90&&match.ball.owner===null;i++){match.ball.update(.016,match.players);match.resolveReceivers();}
 assert.equal(match.ball.owner,3);
});
test('cross targets an attacking runner farther than a short pass, rises and lands near its destination',()=>{
 const {match}=setup();isolate(match);Object.assign(match.players[1],{x:460,y:325});Object.assign(match.players[2],{x:710,y:350});
 const p=match.players[0];assert.equal(match.passTarget(p,'a').id,2);
 match.action(p,'s');const shortDistance=distance(match.ball,match.ball.landing);p.cooldown=0;match.ball.owner=0;
 match.action(p,'a');const landing={...match.ball.landing},flight=match.ball.flightTime;
 assert.ok(distance(match.ball,landing)>shortDistance);let peak=0;
 const steps=Math.ceil(flight/.005);for(let i=0;i<steps;i++){match.ball.update(flight/steps,match.players);peak=Math.max(peak,match.ball.z);}
 assert.ok(peak>65);assert.ok(match.ball.z<1);assert.ok(distance(match.ball,landing)<2);
});
test('aerial receivers move toward landing but cannot collect a high cross',()=>{
 const {match}=setup();isolate(match);Object.assign(match.players[1],{x:500,y:325});Object.assign(match.players[2],{x:130,y:500});
 match.action(match.players[0],'a');const p=match.players[1],intent=aiIntent(p,match);assert.ok(intent.x>0);
 Object.assign(match.ball,{x:p.x,y:p.y+8,z:100,previous:{x:p.x,y:p.y+8,z:100}});match.resolveReceivers();assert.equal(match.ball.owner,null);
});
test('shooting skill affects accuracy and power, arrows affect aim, and kick release does not teleport',()=>{
 const shot=(skill,key)=>{const {input,match}=setup();const p=match.players[0];p.cooldown=0;p.stats.shooting=skill;if(key)input.keys.add(key);
  const start={x:match.ball.x,y:match.ball.y};match.action(p,'d');assert.equal(match.ball.x,start.x);assert.equal(match.ball.y,start.y);
  return {speed:Math.hypot(match.ball.vx,match.ball.vy),aim:match.ball.vy/match.ball.vx};};
 const good=shot(100),bad=shot(1),ideal=(276-333)/(1075-362);assert.ok(good.speed>bad.speed);assert.ok(Math.abs(good.aim-ideal)<Math.abs(bad.aim-ideal));assert.ok(shot(100,'arrowdown').aim>shot(100,'arrowup').aim);
});
test('swept collisions stop fast shots and respect ball height',()=>{
 const p={x:100,y:92},b={previous:{x:20,y:100,z:0},x:180,y:100,z:0};
 assert.ok(sweptContact(b,p,27,62));b.z=150;b.previous.z=150;assert.equal(sweptContact(b,p,27,62),null);
});
test('keeper predicts shot path and reacts gradually rather than snapping',()=>{
 const {match}=setup();const p=match.players[6];Object.assign(match.ball,{owner:null,x:400,y:325,vx:-500,vy:80});
 const before=p.keeperAim;aiIntent(p,match);assert.equal(p.keeperAim,before);
 for(let i=0;i<15;i++)aiIntent(p,match);const intent=aiIntent(p,match);assert.ok(intent.y>0);assert.ok(p.keeperAim>before);assert.ok(p.keeperAim<385);
});
test('AI retains support lanes and uses separation instead of sending all teammates to the ball',()=>{
 const {match}=setup();match.ball.owner=0;const a=aiIntent(match.players[1],match),b=aiIntent(match.players[2],match);
 assert.ok(a.x>0&&b.x>0);assert.ok(a.y>0);assert.ok(b.y>0);
 match.ball.owner=null;match.ball.receiver=1;match.ball.kind='s';const support=aiIntent(match.players[2],match);assert.ok(Number.isFinite(support.x));
});
test('labels never overlap even when players occupy the same position',()=>{
 const boxes=layoutLabels([{text:'Ronaldo',x:500,y:300},{text:'Messi',x:500,y:300},{text:'Zidane',x:510,y:304}],text=>text.length*6);
 for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length;j++){const a=boxes[i],b=boxes[j];assert.ok(a.x+a.width<=b.x||b.x+b.width<=a.x||a.y+a.height<=b.y||b.y+b.height<=a.y);}
});
test('ball physics is consistent across frame rates',()=>{
 const simulate=dt=>{const ball=new Ball();ball.launch({id:0,team:0},{x:900,y:325},400,210);for(let t=0;t<1-1e-8;t+=dt)ball.update(dt,[]);return ball;};
 const a=simulate(1/30),b=simulate(1/120);assert.ok(distance(a,b)<2);assert.ok(Math.abs(a.z-b.z)<2);
});
test('passing skill reduces endpoint error for both pass types',()=>{
 for(const kind of ['s','a']){
  const endpoint=skill=>{const {match}=setup();isolate(match);Object.assign(match.players[1],{x:550,y:325});Object.assign(match.players[2],{x:130,y:500});match.players[0].stats.passing=skill;match.action(match.players[0],kind);return match.ball.landing.y;};
  assert.ok(Math.abs(endpoint(100)-333)<Math.abs(endpoint(1)-333));
 }
});
test('collision ordering gives possession to the first player along the ball path',()=>{
 const {match}=setup();isolate(match);Object.assign(match.players[1],{x:520,y:325});Object.assign(match.players[3],{x:400,y:325});
 Object.assign(match.ball,{owner:null,receiver:1,lastKicker:0,lock:0,previous:{x:350,y:333,z:0},x:580,y:333,z:0});
 match.resolveReceivers();assert.equal(match.ball.owner,3);assert.ok(match.ball.x<400);
});
test('a full autonomous match stays finite, produces shots and goals, and reaches full time',()=>{
 const {match}=setup();let shots=0;const action=match.action.bind(match);
 match.action=(p,k)=>{const released=action(p,k);if(released&&k==='d')shots++;return released;};
 // Disable human selection only for this headless endurance test, including after kickoffs.
 for(let i=0;i<14000&&match.state==='playing';i++){
  match.selected=-1;match.observedOwner=match.ball.owner;match.update(1/60);
  assert.ok(Number.isFinite(match.ball.x+match.ball.y+match.ball.z));
  for(const p of match.players)assert.ok(Number.isFinite(p.x+p.y+p.vx+p.vy));
 }
 assert.equal(match.state,'finished');assert.equal(match.time,0);assert.ok(shots>0);assert.ok(match.score[0]+match.score[1]>0);
});
