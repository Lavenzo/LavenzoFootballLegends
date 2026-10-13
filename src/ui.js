import {setDifficulty, getDifficultyName} from './config.js';
import {teams,roster} from './data.js';
import { soundManager } from './audio/SoundManager.js';

export function createUI(){document.querySelector('#app').innerHTML=`<header><a class="brand" href="./"><span class="crest">L</span><span>LAVENZO <b>FOOTBALL LEGENDS</b></span></a><span class="phase">PHASE 01.1 · ARCADE FOOTBALL</span></header><main><div class="scoreboard"><div class="team home">${teams[0].name}</div><div class="score"><span id="home-score">0</span><span class="separator">:</span><span id="away-score">0</span></div><div class="team away">${teams[1].name}</div><div class="clock" id="clock">02:00</div><button id="pause" aria-label="Pause match">Ⅱ</button></div><div class="audio-controls" style="display:flex; align-items:center; justify-content:center; gap:10px; background:#1a2a3e; padding:8px 24px; border-left:1px solid #304055; border-right:1px solid #304055; border-bottom:1px solid #304055; margin:0 auto; max-width: 1180px;"><button id="mute-btn" aria-label="Mute audio" style="background:none; border:none; color:#a9bfd0; cursor:pointer; font-size:16px;">${soundManager.muted ? '🔇' : '🔊'}</button><input type="range" id="volume-slider" aria-label="Master volume" min="0" max="1" step="0.05" value="${soundManager.masterVolume}" style="width: 100px;"></div><div class="arena" style="position:relative;"><button id="goal-scorers-btn" style="position:absolute; top: 10px; right: 10px; background: rgba(12,28,44,0.8); color: #fff; border: 1px solid #304055; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; z-index: 10;">Goal Scorers</button><div id="live-goal-scorers" style="display:none; position:absolute; top: 40px; right: 10px; background: rgba(12,28,44,0.9); padding: 12px; border: 1px solid #243d46; color: #fff; border-radius: 4px; min-width: 200px; z-index: 10; font-size: 13px; max-height: 200px; overflow-y: auto;"></div><canvas id="pitch" aria-label="Football pitch. Use arrow keys to move, S pass, A cross, D shoot, S switch, Escape pause." tabindex="0"></canvas><section class="overlay" id="overlay"></section></div><div class="match-footer"><span id="selected">9 · Erling Haaland</span><span>3v3 + goalkeepers <i>•</i> 2-minute match</span><button id="restart">Restart match</button></div><section class="controls"><span><kbd>↑ ↓ ← →</kbd> Move</span><span><kbd>S</kbd> Pass / Switch</span><span><kbd>A</kbd> Cross</span><span><kbd>D</kbd> Shoot</span><span><kbd>Esc</kbd> Pause</span></section><section class="roster"><div class="section-label">THE LEGENDS <span>Six styles. One pitch.</span></div><div class="cards">${roster.map(p=>`<article class="player-card ${p.team?'icon':''}"><div class="card-top"><span>#${p.number}</span><span>${p.team?'WORLD ICONS':'LAVENZO LEGENDS'}</span></div><h3>${p.name}</h3><div class="stats">${Object.entries(p.stats).map(([k,v])=>`<div><span>${k}</span><b>${v}</b><div class="bar"><i style="width:${v}%"></i></div></div>`).join('')}</div></article>`).join('')}</div></section></main><footer>Original fictional teams · Stylised tributes to football legends · No official affiliation or endorsement</footer>`;
  const toggleBtn = document.querySelector('#goal-scorers-btn');
  const panel = document.querySelector('#live-goal-scorers');
  toggleBtn.addEventListener('click', () => {
    panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  });

  const muteBtn = document.querySelector('#mute-btn');
  const volumeSlider = document.querySelector('#volume-slider');

  muteBtn.addEventListener('click', () => {
    const isMuted = soundManager.toggleMute();
    muteBtn.textContent = isMuted ? '🔇' : '🔊';
  });

  volumeSlider.addEventListener('input', (e) => {
    soundManager.setVolume(parseFloat(e.target.value));
  });

  return {canvas:document.querySelector('#pitch'),overlay:document.querySelector('#overlay')};
}
export function updateHUD(match){document.querySelector('#home-score').textContent=match.score[0];document.querySelector('#away-score').textContent=match.score[1];const seconds=Math.ceil(match.time);document.querySelector('#clock').textContent=`${Math.floor(seconds/60).toString().padStart(2,'0')}:${(seconds%60).toString().padStart(2,'0')}`;const p=match.players[match.selected];document.querySelector('#selected').textContent=`${p.number} · ${p.name}`;document.querySelector('#pause').textContent=match.state==='paused'?'▶':'Ⅱ';
  const panel = document.querySelector('#live-goal-scorers');
  if(panel && panel.style.display !== 'none'){
    let html = '';
    if(!match.goalHistory || match.goalHistory.length === 0){
      html = '<span style="color:#8599ad;">No goals yet</span>';
    } else {
      for (let t = 0; t < 2; t++) {
        const teamGoals = match.goalHistory.filter(g => g.team === t);
        if (teamGoals.length > 0) {
          html += `<div style="margin-bottom: 6px;"><b style="color: #bdeed1;">${teams[t].name}</b><br>`;
          const grouped = {};
          const order = [];
          for (const g of teamGoals) {
            if (!grouped[g.name]) { grouped[g.name] = []; order.push(g.name); }
            grouped[g.name].push(g.timeFormatted);
          }
          for (const name of order) {
            html += `<span style="color: #e9f2f6;">${name} ${grouped[name].join(', ')}</span><br>`;
          }
          html += `</div>`;
        }
      }
    }
    if (panel.innerHTML !== html) panel.innerHTML = html;
  }
}
export function showOverlay(element,state,match,onPlay,onResume){element.hidden=false;if(state==='menu')element.innerHTML=`<span class="eyebrow">WELCOME TO LEGENDS ARENA</span><h1>Great players.<br><em>Your game.</em></h1><p>Take control of football's icons in a fast, colourful<br>arcade showdown. Two minutes. Everything to play for.</p><div style="margin:15px 0;"><label style="color:#8599ad; font-size:12px; margin-right:8px;">Difficulty:</label><select id="difficulty" style="background:#1a2a3e; color:#e9f2f6; border:1px solid #304055; border-radius:4px; padding:4px 8px;"><option value="easy">Easy</option><option value="normal">Normal</option><option value="hard">Hard</option></select></div><button class="primary" id="play">Play Match <span>→</span></button><small>Arrow keys to move · S / A / D to make your mark</small>`;else if(state==='paused')element.innerHTML='<span class="eyebrow">TAKE A BREATHER</span><h1>Match paused</h1><p>Your legends will be here when you’re ready.</p><button class="primary" id="resume">Resume match →</button>';else if(state==='finished'){const result=match.score[0]===match.score[1]?'Honours even.':match.score[0]>match.score[1]?'Legends victorious!':'Icons take the win.';
let historyHTML='';
if (match.goalHistory && match.goalHistory.length > 0) {
  historyHTML += '<div class="goal-history" style="margin: 15px 0; max-height: 150px; overflow-y: auto; text-align: left; background: #0c1c2c; padding: 10px; border-radius: 4px; font-size: 14px; border: 1px solid #243d46;">';
  for (let t = 0; t < 2; t++) {
    const teamGoals = match.goalHistory.filter(g => g.team === t);
    if (teamGoals.length > 0) {
      historyHTML += `<div style="margin-bottom: 8px;"><b style="color: #bdeed1;">${teams[t].name}:</b><br>`;
      const grouped = {};
      const order = [];
      for (const g of teamGoals) {
        if (!grouped[g.name]) { grouped[g.name] = []; order.push(g.name); }
        grouped[g.name].push(g.timeFormatted);
      }
      for (const name of order) {
        historyHTML += `<span style="color: #e9f2f6;">${name} ${grouped[name].join(', ')}</span><br>`;
      }
      historyHTML += `</div>`;
    }
  }
  historyHTML += '</div>';
}
element.innerHTML=`<span class="eyebrow">FULL TIME</span><h1>${result}</h1><div class="final-score">${match.score[0]} <span>:</span> ${match.score[1]}</div><p>Lavenzo Legends vs World Icons</p>${historyHTML}<button class="primary" id="play">Play again →</button>`;}else{element.hidden=true;element.innerHTML='';}element.querySelector('#play')?.addEventListener('click',onPlay);
const diffSelect = element.querySelector('#difficulty');
if(diffSelect){
  diffSelect.value = getDifficultyName();
  diffSelect.addEventListener('change', (e) => setDifficulty(e.target.value));
}
element.querySelector('#resume')?.addEventListener('click',onResume);}
