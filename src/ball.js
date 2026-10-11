import {FIELD as F} from './data.js';
export const GRAVITY=420;
export class Ball {
 constructor(){this.reset();}
 reset(){Object.assign(this,{x:F.w/2,y:F.h/2,z:0,vx:0,vy:0,vz:0,owner:null,lock:0,lastTeam:0,lastKicker:null,receiver:null,landing:null,kind:null,flightTime:0,releaseSerial:0,trail:[],previous:{x:F.w/2,y:F.h/2,z:0}});}
 launch(player,target,power,lift=0,options={}){
  const dx=target.x-this.x,dy=target.y-this.y,n=Math.hypot(dx,dy)||1;
  this.owner=null;this.vx=dx/n*power;this.vy=dy/n*power;this.vz=lift;this.z=Math.max(0,this.z);
  this.lock=.2;this.lastTeam=player.team;this.lastKicker=player.id;this.receiver=options.receiver??null;
  this.kind=options.kind??'shot';this.landing=options.landing??null;this.flightTime=options.flightTime??0;this.releaseSerial++;player.kick=.36;
 }
 collect(p){this.owner=p.id;this.lastTeam=p.team;this.receiver=null;this.landing=null;this.kind=null;this.z=0;this.vz=0;this.vx=p.vx;this.vy=p.vy;}
 update(dt,players){
  this.previous={x:this.x,y:this.y,z:this.z};this.lock=Math.max(0,this.lock-dt);
  if(this.owner!==null){
   const p=players[this.owner],speed=Math.hypot(p.vx,p.vy),dx=speed>12?p.vx/speed:p.face,dy=speed>12?p.vy/speed:0;
   const touch=11+Math.sin(p.anim*1.5)*(1.5+(100-p.stats.dribbling)*.025);
   const tx=p.x+dx*touch,ty=p.y+8+dy*touch,blend=1-Math.exp(-(15+p.stats.dribbling*.12)*dt);
   this.x+=(tx-this.x)*blend;this.y+=(ty-this.y)*blend;this.z=0;this.vx=p.vx;this.vy=p.vy;this.vz=0;this.trail=[];return;
  }
  const airborne=this.z>0||this.vz>0,drag=airborne?.16:.72,decay=Math.exp(-drag*dt),travel=(1-decay)/drag;
  this.x+=this.vx*travel;this.y+=this.vy*travel;this.z+=this.vz*dt-GRAVITY*dt*dt/2;this.vz-=GRAVITY*dt;
  if(this.z<=0){this.z=0;this.vz=this.vz< -85?-this.vz*.18:0;}
  this.vx*=decay;this.vy*=decay;this.flightTime=Math.max(0,this.flightTime-dt);
  if(this.y<F.top||this.y>F.bottom){this.y=Math.max(F.top,Math.min(F.bottom,this.y));this.vy*=-.6;this.receiver=null;}
  const inGoal=this.y>F.goalTop+6&&this.y<F.goalBottom-6&&this.z<48;
  if(!inGoal&&(this.x<F.left||this.x>F.right)){this.x=Math.max(F.left,Math.min(F.right,this.x));this.vx*=-.6;this.receiver=null;}
  this.trail.push({x:this.x,y:this.y,z:this.z});if(this.trail.length>12)this.trail.shift();
 }
}
