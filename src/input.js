export class Input {
 constructor(target=window){this.keys=new Set();this.pressed=new Set();this.active=false;target.addEventListener('keydown',e=>{const k=e.key.toLowerCase();if(this.active&&['arrowup','arrowdown','arrowleft','arrowright','s','a','d','w','escape'].includes(k))e.preventDefault();if(!e.repeat&&!this.keys.has(k))this.pressed.add(k);this.keys.add(k);});target.addEventListener('keyup',e=>this.keys.delete(e.key.toLowerCase()));target.addEventListener('blur',()=>{this.keys.clear();this.pressed.clear();});}
 consume(k){const value=this.pressed.has(k);this.pressed.delete(k);return value;}
 movement(){let x=Number(this.keys.has('arrowright'))-Number(this.keys.has('arrowleft')),y=Number(this.keys.has('arrowdown'))-Number(this.keys.has('arrowup'));const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n};}
 clear(){this.keys.clear();this.pressed.clear();}
}
