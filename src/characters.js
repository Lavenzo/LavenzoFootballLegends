import {teams} from './data.js';
export function drawCharacter(c,p,selected,hasBall){
 c.save();c.translate(p.x,p.y);
 const ellipse=(x,y,rx,ry,color)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
 const line=(x,y,xx,yy,col,w)=>{c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();};
 ellipse(0,12,17*p.width,6,'#001b2470');
 if(selected){
  c.shadowColor='#ffdc55';c.shadowBlur=9;c.strokeStyle='#ffe16a';c.lineWidth=3;c.beginPath();c.ellipse(0,12,23,10,0,0,Math.PI*2);c.stroke();c.shadowBlur=0;
  c.fillStyle='#ffe16a';c.beginPath();c.moveTo(-6,-65*p.height);c.lineTo(6,-65*p.height);c.lineTo(0,-57*p.height);c.fill();
  c.strokeStyle='#142635';c.lineWidth=1;c.stroke();
 }
 c.scale(p.width,p.height);
 const speed=Math.hypot(p.vx,p.vy),moving=speed>15,phase=p.anim,run=moving?Math.sin(phase)*8:Math.sin(phase)*.6;
 const kickProgress=p.kick>0?1-p.kick/.36:0,swing=p.kick>0?Math.sin(kickProgress*Math.PI)*17:0;
 const bob=moving?Math.abs(Math.cos(phase))*2:Math.sin(phase)*.7;
 c.translate(p.vx*.009,-bob);c.rotate(moving?p.vx*.00012:0);
 const kit=p.keeper?'#b8a5ff':teams[p.team].color,dark=teams[p.team].dark;
 const stocky=p.look==='nazario',broad=p.look==='haaland'||stocky,shoulder=broad?11:9;
 // Articulated knees, shin socks and boots alternate through a running stride.
 for(const side of [-1,1]){
  const stride=run*side,kneeX=side*5+stride*.40,kneeY=4-Math.abs(stride)*.23;
  const footX=side*6+stride*.7+(side===1?p.face*swing:0),footY=12-Math.max(0,-stride)*.55-(side===1?swing*.28:0);
  line(side*5,-5,kneeX,kneeY,p.skin,stocky?6.8:5.7);line(kneeX,kneeY,footX,footY,p.skin,5);
  line(kneeX+(footX-kneeX)*.4,kneeY+(footY-kneeY)*.4,footX,footY,'#e5f5ec',4.5);
  line(footX-p.face*2,footY,footX+p.face*5,footY+1,p.look==='cristiano'?'#f0f1f5':'#122132',5);
  line(footX,footY+2,footX+p.face*5,footY+2,p.look==='messi'?'#ffcd57':kit,1.2);
 }
 // Bent elbows counter the legs; wrists and palms give a less generic silhouette.
 for(const side of [-1,1]){
  const elbowX=side*(shoulder+4),elbowY=-20+run*side*.32;
  const handX=side*(shoulder+6)-run*side*.30,handY=-13-run*side*.44-swing*.12;
  line(side*shoulder,-29,elbowX,elbowY,p.skin,4.8);line(elbowX,elbowY,handX,handY,p.skin,4.2);
  ellipse(handX,handY,2.6,3,p.keeper?'#f4faf6':p.skin);
 }
 c.fillStyle=dark;c.fillRect(-9,-11,18,8);c.fillRect(-9,-4,7,4);c.fillRect(2,-4,7,4);
 c.fillStyle=kit;c.beginPath();c.moveTo(-shoulder,-32);c.lineTo(shoulder,-32);c.lineTo(stocky?12:10,-12);c.lineTo(stocky?-12:-10,-12);c.closePath();c.fill();
 line(-shoulder,-29,-shoulder-2,-24,kit,6);line(shoulder,-29,shoulder+2,-24,kit,6);
 c.fillStyle='#ffffff20';c.fillRect(-shoulder+2,-28,4,14);c.fillStyle='#09293725';c.fillRect(shoulder-4,-27,3,14);
 line(-4,-32,0,-29,dark,2);line(0,-29,4,-32,dark,2);line(-8,-25,8,-25,'#ffffff80',1.4);
 ellipse(-5,-28,1.5,2,'#fff1a0');c.fillStyle=dark;c.font='bold 10px Arial';c.textAlign='center';c.fillText(p.number,1,-15);
 c.fillStyle=p.skin;c.fillRect(-3,-37,6,7);
 const headWidth=p.look==='messi'?7.7:stocky?9:8,headY=p.look==='zidane'?-42:-41;
 ellipse(-headWidth,headY+1,2,3,p.skin);ellipse(headWidth,headY+1,2,3,p.skin);
 ellipse(0,headY,headWidth,10,p.skin);ellipse(3,headY+2,headWidth*.68,7,'#73402718');
 if(p.look==='haaland'){
  ellipse(0,-48,8.5,5,'#e9cc77');ellipse(0,-44,7.7,7,p.skin);
  ellipse(-p.face*9,-47,4.5,4.5,'#dabb60');line(-p.face*10,-44,-p.face*12,-40,'#e9cc77',2.5);
  for(let i=-5;i<=5;i+=3)line(i,-51,i-1,-47,'#b99b4e',.7);
  line(-5,-44,-2,-44,'#c4a35d',1.3);line(2,-44,5,-44,'#c4a35d',1.3);
 }else if(p.look==='ronaldinho'){
  for(const side of [-1,1])for(let i=0;i<6;i++)ellipse(side*(7.5+Math.sin(i)*1.4),-49+i*3.1,3.5,3.8,'#211b1a');
  for(let i=-7;i<=7;i+=3)ellipse(i,-50-Math.cos(i)*1.3,3.2,3.2,'#30221c');
  c.fillStyle='#eeeddd';c.fillRect(-9,-47,18,3);line(8,-45,13,-42,'#eeeddd',1.5);
 }else if(p.look==='zidane'){
  ellipse(0,-49,7.2,2.9,'#b7815d');ellipse(0,-48,6.5,2.8,p.skin);
  line(-6,-43,-2,-44,'#564036',1.3);line(2,-44,6,-43,'#564036',1.3);
 }else if(p.look==='cristiano'){
  c.fillStyle='#211d1e';c.beginPath();c.moveTo(-8,-43);c.lineTo(-8,-50);c.lineTo(-4,-55);c.lineTo(5,-52);c.lineTo(8,-49);c.lineTo(7,-43);c.lineTo(5,-47);c.lineTo(-4,-48);c.closePath();c.fill();
  line(-5,-51,4,-50,'#534441',1.2);line(6,-48,6,-44,'#a18365',.7);
 }else if(p.look==='messi'){
  ellipse(0,-49,8,4.5,'#312722');line(-7,-48,-6,-41,'#312722',2.3);
  c.fillStyle='#402d24';c.beginPath();c.moveTo(-7,-39);c.lineTo(-6,-33);c.lineTo(0,-30);c.lineTo(6,-33);c.lineTo(7,-39);c.lineTo(4,-37);c.lineTo(0,-36);c.lineTo(-4,-37);c.fill();
  for(let i=-4;i<=4;i+=2)line(i,-34,i,-32,'#71513a',.65);
 }else if(p.look==='nazario'){
  ellipse(0,-49,8.8,2.8,'#2c2320');line(-8,-48,-8,-45,'#2c2320',1.7);line(8,-48,8,-45,'#2c2320',1.7);
  line(-5,-44,-2,-44,'#392820',1.6);line(2,-44,5,-44,'#392820',1.6);
 }else ellipse(0,-49,8,3,'#44302a');
 if(!['haaland','zidane','nazario'].includes(p.look)){line(-5,-44,-2,-44,'#34271f',1.2);line(2,-44,5,-44,'#34271f',1.2);}
 ellipse(-3.5,-41.5,1.6,1.1,'#fff6e8');ellipse(3.5,-41.5,1.6,1.1,'#fff6e8');
 ellipse(-3.3+p.face*.4,-41.5,.8,1,p.look==='haaland'?'#407a91':'#29201b');ellipse(3.7+p.face*.4,-41.5,.8,1,p.look==='haaland'?'#407a91':'#29201b');
 line(p.face*.5,-41,p.face*1.4,-38,'#a86f4d',.9);
 if(p.look==='ronaldinho'||p.look==='nazario'){ellipse(0,-35.5,3.5,1.7,'#fff2dc');line(-3,-34,3,-34,'#995838',.6);}
 else line(-2,-35,2.5,-35,'#93583e',1);
 c.restore();
}
