import {FIELD as F,teams} from './data.js';
import {drawCharacter} from './characters.js';
import {layoutLabels} from './gameplay.js';
export class Renderer {
 constructor(canvas){this.canvas=canvas;this.c=canvas.getContext('2d');canvas.width=F.w;canvas.height=F.h;}
 draw(match){const c=this.c;c.clearRect(0,0,F.w,F.h);c.fillStyle='#15283c';c.fillRect(0,0,F.w,F.h);
 for(let row=0;row<3;row++)for(let i=0;i<100;i++){c.fillStyle=['#576275','#d59c66','#88b5ae','#8a88ab'][(i*7+row)%4];c.fillRect(10+i*11,7+row*13,5,6);c.fillRect(10+i*11,605+row*13,5,6);}
 c.fillStyle='#243d46';c.fillRect(40,45,1020,560);for(let i=0;i<10;i++){c.fillStyle=i%2?'#27845a':'#2b9061';c.fillRect(F.left+i*98,F.top,98,530);}
 c.strokeStyle='#e7f6dfb0';c.lineWidth=2;c.strokeRect(F.left,F.top,980,530);c.beginPath();c.moveTo(550,F.top);c.lineTo(550,F.bottom);c.stroke();c.beginPath();c.arc(550,325,77,0,Math.PI*2);c.stroke();c.fillStyle='#e7f6df';c.beginPath();c.arc(550,325,3,0,7);c.fill();
 for(const side of [0,1]){const x=side?F.right-140:F.left;c.strokeRect(x,190,140,270);c.strokeRect(side?F.right-52:F.left,259,52,132);c.beginPath();c.arc(side?930:170,325,3,0,7);c.fill();c.strokeStyle='#ffffff80';c.strokeRect(side?F.right:F.left-25,F.goalTop,25,132);for(let j=1;j<7;j++){c.beginPath();c.moveTo(side?F.right:F.left-25,F.goalTop+j*19);c.lineTo(side?F.right+25:F.left,F.goalTop+j*19);c.stroke();}c.strokeStyle='#e7f6dfb0';}
 c.font='bold 12px Arial';c.textAlign='center';c.fillStyle='#bdeed1aa';c.fillText('L A V E N Z O   •   L E G E N D S   A R E N A',550,582);
 const b=match.ball;for(let i=0;i<b.trail.length;i++){const t=b.trail[i];c.fillStyle=`rgba(255,255,255,${i/b.trail.length*.22})`;c.beginPath();c.arc(t.x,t.y-t.z,3,0,7);c.fill();}
 for(const p of [...match.players].sort((a,b)=>a.y-b.y))drawCharacter(c,p,p.id===match.selected,b.owner===p.id);
 if(b.kind==='a'&&b.landing&&b.owner===null){c.strokeStyle='#fff1a070';c.lineWidth=1.5;c.setLineDash([4,4]);c.beginPath();c.ellipse(b.landing.x,b.landing.y,17,8,0,0,Math.PI*2);c.stroke();c.setLineDash([]);}
 c.fillStyle='#002f3b60';c.beginPath();c.ellipse(b.x,b.y+6,7+b.z*.025,3+b.z*.008,0,0,7);c.fill();c.strokeStyle='#163143';c.lineWidth=1.5;c.fillStyle='#fff';c.beginPath();c.arc(b.x,b.y-b.z,6,0,7);c.fill();c.stroke();c.fillStyle='#243546';c.beginPath();c.arc(b.x,b.y-b.z,2.3,0,7);c.fill();
 c.font='bold 10px Arial';c.textAlign='center';
 const items=[match.players[match.selected],...match.players.filter(p=>p.id!==match.selected&&(p.id===b.owner||p.id===b.receiver))].map(p=>{
   const parts = p.name.split(' ');
   return {x:p.x,y:p.y,text:parts.length > 1 ? parts.slice(1).join(' ') : p.name,selected:p.id===match.selected};
 });
 for(const label of layoutLabels(items,text=>c.measureText(text).width)){c.fillStyle='#0c1c2ce8';c.fillRect(label.x,label.y,label.width,label.height);c.fillStyle=label.selected?'#ffe16a':'#fff';c.fillText(label.text,label.x+label.width/2,label.y+12);}
 if(match.messageTime>0){c.fillStyle='#0d2136db';c.fillRect(420,78,260,38);c.fillStyle=match.message==='GOAL!'?'#fff1a0':'#fff';c.font='bold 20px Arial';c.textAlign='center';c.fillText(match.message,550,104);}
 }
}
