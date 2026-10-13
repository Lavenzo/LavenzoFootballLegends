import './style.css';
import {Input} from './input.js';
import {Match} from './match.js';
import {Renderer} from './renderer.js';
import {createUI,updateHUD,showOverlay} from './ui.js';
import { soundManager } from './audio/SoundManager.js';
const ui=createUI(),input=new Input(),match=new Match(input),renderer=new Renderer(ui.canvas);match.state='menu';let previousState='',last=performance.now();
import {roster} from './data.js';

let cpuDraftTimer = null;

function startDraft() {
  if (cpuDraftTimer) clearTimeout(cpuDraftTimer);
  match.state = 'draft';
  match.draftSelections = [];
  match.draftTurn = 0; // Human first
  soundManager.stopAmbience();
  soundManager.playMenuTheme();
}

function handleDraftPick(idx) {
  if (match.state !== 'draft' || match.draftTurn !== 0) return;
  const p = roster[idx];
  if (match.draftSelections.find(s => s.player.name === p.name)) return;

  soundManager.playPlayerSelect();
  match.draftSelections.push({player: p, team: 0}); // 0 for human
  match.draftTurn = 1;

  if (match.draftSelections.length < 6) {
    cpuDraftTimer = setTimeout(cpuDraftPick, 700 + Math.random() * 300);
  }
}

function cpuDraftPick() {
  if (match.state !== 'draft' || match.draftTurn !== 1) return;
  const available = roster.filter(p => !match.draftSelections.find(s => s.player.name === p.name));
  if (available.length > 0) {
    const pick = available[Math.floor(Math.random() * available.length)];
    soundManager.playPlayerSelect();
    match.draftSelections.push({player: pick, team: 1}); // 1 for CPU
    match.draftTurn = 0;
  }
}

function play(){
  input.clear();
  // Build final roster with updated team assignments
  const finalRoster = match.draftSelections.map(s => ({...s.player, team: s.team}));
  match.reset(finalRoster);
  input.active=true;
  ui.canvas.focus();
  soundManager.stopMenuTheme();
  soundManager.playAmbience(true);
}
function resume(){input.clear();match.state='playing';ui.canvas.focus();soundManager.resumeAmbience();}
document.querySelector('#pause').addEventListener('click',()=>{if(match.state==='playing'){match.state='paused';soundManager.pauseAmbience();}else if(match.state==='paused')resume();});
document.querySelector('#restart').addEventListener('click',startDraft);
window.addEventListener('blur',()=>{if(match.state==='playing'){match.state='paused';soundManager.pauseAmbience();}});
function frame(now){
  const dt=Math.min((now-last)/1000,.035);
  last=now;
  match.update(dt);
  renderer.draw(match);
  updateHUD(match);
  input.active=['playing','paused'].includes(match.state);

  // Need to force re-render overlay for draft state only when selections change
  const currentDraftCount = match.draftSelections ? match.draftSelections.length : 0;
  if (match.state !== previousState || (match.state === 'draft' && currentDraftCount !== (ui.lastDraftCount || 0))) {
    if (match.state === 'finished' && previousState !== 'finished') {
      soundManager.stopAmbience();
      soundManager.playWhistle();
    }
    showOverlay(ui.overlay,match.state,match,play,resume,handleDraftPick);

    // Bind new draft buttons if present
    const startDraftBtn = ui.overlay.querySelector('#start-draft');
    if (startDraftBtn) startDraftBtn.addEventListener('click', startDraft);

    const restartDraftBtn = ui.overlay.querySelector('#restart-draft');
    if (restartDraftBtn) restartDraftBtn.addEventListener('click', startDraft);

    previousState = match.state;
    if (match.state === 'draft') ui.lastDraftCount = currentDraftCount;
    else ui.lastDraftCount = 0;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
