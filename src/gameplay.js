import {FIELD as F} from './data.js';
export const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function moveDirection(p,input,selected){
 const keys=p.id===selected?input.movement():{x:0,y:0};if(keys.x||keys.y)return keys;
 const speed=Math.hypot(p.vx,p.vy);return speed>18?{x:p.vx/speed,y:p.vy/speed}:{x:p.team?-1:1,y:0};
}
export function interceptionPoint(ball,seconds=.38){return {x:clamp(ball.x+ball.vx*seconds,F.left+18,F.right-18),y:clamp(ball.y+ball.vy*seconds,F.top+18,F.bottom-18)};}
export function interceptionScore(p,ball){const t=interceptionPoint(ball),pace=95+p.stats.speed*1.15;return distance(p,t)/pace+distance(p,ball)/pace*.16;}
export function chooseSwitch(players,selected,ball){
 return players.filter(p=>p.team===0&&!p.keeper&&p.id!==selected).sort((a,b)=>{
  if(ball.owner===a.id)return -1;if(ball.owner===b.id)return 1;
  return interceptionScore(a,ball)-interceptionScore(b,ball)||a.id-b.id;
 })[0]?.id??selected;
}
export function laneRisk(p,q,players){
 const dx=q.x-p.x,dy=q.y-p.y,length2=dx*dx+dy*dy||1;
 return players.filter(r=>r.team!==p.team).reduce((risk,r)=>{
  const t=((r.x-p.x)*dx+(r.y-p.y)*dy)/length2;if(t<=.08||t>=.95)return risk;
  return risk+Math.max(0,1-Math.hypot(r.x-p.x-t*dx,r.y-p.y-t*dy)/65);
 },0);
}
export function targetScore(p,q,dir,type,players){
 const dx=q.x-p.x,dy=q.y-p.y,d=Math.hypot(dx,dy)||1,attack=p.team?-1:1;
 return (dx*dir.x+dy*dir.y)/d*(type==='a'?105:240)+dx*attack*(type==='a'?.65:.12)
 +(type==='a'?Math.min(d,480)*.35:-d*.17)-laneRisk(p,q,players)*(type==='a'?18:95);
}
export function sweptContact(ball,p,radius,maxHeight){
 const start=ball.previous??ball,dx=ball.x-start.x,dy=ball.y-start.y;
 const ox=start.x-p.x,oy=start.y-p.y-8,a=dx*dx+dy*dy,b=2*(ox*dx+oy*dy),c=ox*ox+oy*oy-radius*radius;
 let entry=0,exit=1;
 if(a<1e-9){if(c>0)return null;}
 else {const discriminant=b*b-4*a*c;if(discriminant<0)return null;const root=Math.sqrt(discriminant);
  entry=Math.max(0,(-b-root)/(2*a));exit=Math.min(1,(-b+root)/(2*a));if(entry>exit)return null;}
 const dz=ball.z-start.z;
 // A descending ball is collectable only once it actually reaches receiving height.
 if(start.z+dz*entry>maxHeight){if(dz>=0)return null;entry=Math.max(entry,(maxHeight-start.z)/dz);if(entry>exit)return null;}
 return {t:entry,x:start.x+dx*entry,y:start.y+dy*entry,z:start.z+dz*entry};
}
export function layoutLabels(items,measure){
 const boxes=[];
 for(const item of items){const width=measure(item.text)+12,height=17,x=clamp(item.x-width/2,6,F.w-width-6);
  let y=clamp(item.y+23,6,F.h-height-6),attempt=0;
  while(boxes.some(b=>x<b.x+b.width+3&&x+width+3>b.x&&y<b.y+b.height+3&&y+height+3>b.y)&&attempt++<32){y+=height+4;if(y>F.h-height-6)y=6;}
  boxes.push({...item,x,y,width,height});
 }return boxes;
}
