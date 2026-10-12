import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';
import {Match} from '../src/match.js';
import {updateHUD, showOverlay, createUI} from '../src/ui.js';

function setup(){
 const events={};const input=new Input({addEventListener:(key,fn)=>events[key]=fn});
 const match=new Match(input);
 return {input,match,events};
}

test('TC001/TC002: Ronaldinho and other player names render correctly', () => {
    // Already fixed in renderer logic, this is just to verify the model property is there
    const {match} = setup();
    const ronaldinho = match.players.find(p => p.look === 'ronaldinho');
    assert.equal(ronaldinho.name, 'Ronaldinho');
});

test('TC003/TC004/TC005/TC006: Match duration and timer functions correctly', () => {
    const {match} = setup();
    assert.equal(match.duration, 120);
    assert.equal(match.time, 120);

    match.update(1.0);
    assert.equal(match.time, 119);

    // Pause state should not advance time
    match.state = 'paused';
    match.update(10.0);
    assert.equal(match.time, 119);

    match.reset();
    assert.equal(match.time, 120);
    assert.equal(match.goalHistory.length, 0);
});

test('TC007/TC008/TC009/TC010/TC011/TC012: Goal scorer tracking functionality', () => {
    const {match} = setup();

    // Simulate a goal by Player 0 (Haaland)
    match.ball.lastKicker = 0;
    match.ball.x = 2000; // Force a goal
    match.time = 90; // 30 seconds elapsed

    match.update(1/60);

    assert.equal(match.goalHistory.length, 1);
    assert.equal(match.goalHistory[0].name, 'Erling Haaland');
    assert.equal(match.goalHistory[0].timeFormatted, '0:30');
    assert.equal(match.goalHistory[0].team, 0);

    // Simulate another goal by same player
    match.goalDelay = 0; // reset delay to allow next goal
    match.ball.x = 2000;
    match.time = 60; // 1 min elapsed
    match.update(1/60);

    assert.equal(match.goalHistory.length, 2);
    assert.equal(match.goalHistory[1].name, 'Erling Haaland');
    assert.equal(match.goalHistory[1].timeFormatted, '1:00');

    // Test unknown scorer (own goal or missing player)
    match.goalDelay = 0;
    match.ball.lastKicker = 3; // Opponent
    match.ball.x = 2000; // Scored in opponent goal (which is 0 team)
    match.time = 30; // 1 min 30 elapsed
    match.update(1/60);

    assert.equal(match.goalHistory.length, 3);
    assert.equal(match.goalHistory[2].name, 'Cristiano Ronaldo (OG)');

    match.reset();
    assert.equal(match.goalHistory.length, 0);
});
