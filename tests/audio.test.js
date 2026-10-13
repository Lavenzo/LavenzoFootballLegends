import test from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { Input } from '../src/input.js';

// Setup JSDOM
const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>', {
  url: 'http://localhost/LavenzoFootballLegends/'
});
global.document = dom.window.document;
global.window = dom.window;
global.localStorage = {
  store: {},
  getItem(key) { return this.store[key] || null; },
  setItem(key, val) { this.store[key] = String(val); }
};

let playedAudio = [];
let pausedAudio = [];
class MockAudio {
  constructor(src) {
    this.src = src;
    this.volume = 1;
    this.loop = false;
    this.currentTime = 0;
    this.paused = true;
  }
  play() {
    this.paused = false;
    playedAudio.push(this);
    return Promise.resolve();
  }
  pause() {
    this.paused = true;
    pausedAudio.push(this);
  }
  cloneNode() {
    const clone = new MockAudio(this.src);
    clone.volume = this.volume;
    return clone;
  }
}
global.Audio = MockAudio;

// Must import Match and SoundManager after Audio is mocked
const { Match } = await import('../src/match.js');
const { soundManager } = await import('../src/audio/SoundManager.js');

function setup() {
  playedAudio = [];
  pausedAudio = [];
  const events = {};
  const input = new Input({ addEventListener: (key, fn) => events[key] = fn });
  const match = new Match(input);
  // Ensure audio is 'unlocked' for tests
  soundManager.audioContextAllowed = true;
  return { input, match, events };
}

test('Audio assets load with correct base paths', () => {
  setup();
  assert.ok(soundManager.sounds.ambience.src.includes('sounds/stadium-ambience.mp3'));
  assert.ok(soundManager.sounds.kick.src.includes('sounds/ball-kick.mp3'));
});

test('Match start triggers whistle', () => {
  const { match } = setup();
  // reset() calls kickoff(0), which plays whistle
  match.reset();
  const whistlePlayed = playedAudio.some(a => a.src.includes('referee-whistle'));
  assert.ok(whistlePlayed, 'Whistle should play at kickoff');
});

test('Valid kick actions trigger kick sound', () => {
  const { input, match } = setup();
  match.reset();
  match.ball.owner = 0; // Human possession
  const p = match.players[0];
  p.cooldown = 0;

  // Pass
  match.action(p, 's');
  assert.ok(playedAudio.some(a => a.src.includes('ball-kick')), 'Pass should trigger kick sound');
  playedAudio = [];

  // Cross
  match.ball.owner = 0;
  p.cooldown = 0;
  match.action(p, 'a');
  assert.ok(playedAudio.some(a => a.src.includes('ball-kick')), 'Cross should trigger kick sound');
  playedAudio = [];

  // Shoot
  match.ball.owner = 0;
  p.cooldown = 0;
  match.action(p, 'd');
  assert.ok(playedAudio.some(a => a.src.includes('ball-kick')), 'Shoot should trigger kick sound');
});

test('Goal triggers cheer', () => {
  const { match } = setup();
  match.reset();
  match.ball.owner = null;
  match.ball.x = 2000; // Force a goal
  match.ball.y = 325;
  match.update(0.1);

  const cheerPlayed = playedAudio.some(a => a.src.includes('goal-cheer'));
  assert.ok(cheerPlayed, 'Goal cheer should play on goal');
});

test('Tackle triggers tackle sound', () => {
  const { match } = setup();
  match.reset();
  match.ball.owner = 3; // CPU possession
  const cpu = match.players[3];
  const human = match.players[0];

  cpu.x = 300; cpu.y = 300; cpu.vx = 0; cpu.vy = 0;
  cpu.cooldown = 0; // The owner must have cooldown <= 0.25 to be tackled
  human.x = 300; human.y = 300; human.vx = 500; human.vy = 500; // Very high relative speed to guarantee tackle threshold
  human.cooldown = 0;

  // Advance time to pass protection duration
  match.time = 0;
  match.possessionTime = 120;

  match.resolveTackles();
  const tacklePlayed = playedAudio.some(a => a.src.includes('tackle'));
  assert.ok(tacklePlayed, 'Tackle sound should play on successful tackle');
});

test('Mute controls toggle audio', () => {
  setup();
  soundManager.muted = false;
  soundManager.updateVolumes();

  const initialVol = soundManager.sounds.ambience.volume;
  assert.ok(initialVol > 0);

  soundManager.toggleMute();
  assert.equal(soundManager.sounds.ambience.volume, 0, 'Muting should set ambience volume to 0');

  playedAudio = [];
  soundManager.playKick();
  assert.equal(playedAudio.length, 0, 'Muted effects should not play');
});
