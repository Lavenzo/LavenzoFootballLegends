import './style.css';
import {Input} from './input.js';
import {Match} from './match.js';
import {Renderer} from './renderer.js';
import {createUI,updateHUD,showOverlay} from './ui.js';
import { soundManager } from './audio/SoundManager.js';
const ui=createUI(),input=new Input(),match=new Match(input),renderer=new Renderer(ui.canvas);match.state='menu';let previousState='',last=performance.now();
function play(){input.clear();match.reset();input.active=true;ui.canvas.focus();soundManager.playAmbience(true);}
function resume(){input.clear();match.state='playing';ui.canvas.focus();soundManager.resumeAmbience();}
document.querySelector('#pause').addEventListener('click',()=>{if(match.state==='playing'){match.state='paused';soundManager.pauseAmbience();}else if(match.state==='paused')resume();});
document.querySelector('#restart').addEventListener('click',play);
window.addEventListener('blur',()=>{if(match.state==='playing'){match.state='paused';soundManager.pauseAmbience();}});
function frame(now){const dt=Math.min((now-last)/1000,.035);last=now;match.update(dt);renderer.draw(match);updateHUD(match);input.active=['playing','paused'].includes(match.state);if(match.state!==previousState){if(match.state==='finished'&&previousState!=='finished'){soundManager.stopAmbience();soundManager.playWhistle();}showOverlay(ui.overlay,match.state,match,play,resume);previousState=match.state;}requestAnimationFrame(frame);}requestAnimationFrame(frame);
