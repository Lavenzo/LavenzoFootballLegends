import test from 'node:test';
import assert from 'node:assert/strict';
import {Input} from '../src/input.js';
import {Match} from '../src/match.js';
import {updateHUD, showOverlay, createUI} from '../src/ui.js';
import { JSDOM } from 'jsdom';

const dom = new JSDOM('<!DOCTYPE html><html><body><div id="app"></div></body></html>');
global.document = dom.window.document;
global.window = dom.window;

function setup(){
 const events={};const input=new Input({addEventListener:(key,fn)=>events[key]=fn});
 const match=new Match(input);
 return {input,match,events};
}

test('TC001/TC002/TC003: Mbappé is present and renders correctly', () => {
    const {match} = setup();
    const mbappe = match.players.find(p => p.look === 'mbappe');
    assert.ok(mbappe, 'Mbappe character not found in game state');
    assert.equal(mbappe.name, 'Kylian Mbappé');
});

test('TC004/TC005/TC006/TC007/TC008/TC009: Live goal scorers UI tests', () => {
    createUI();
    const {match} = setup();
    const toggleBtn = document.querySelector('#goal-scorers-btn');
    const panel = document.querySelector('#live-goal-scorers');

    assert.ok(toggleBtn, 'Goal scorers toggle button must exist');
    assert.ok(panel, 'Goal scorers panel must exist');
    assert.equal(panel.style.display, 'none');

    toggleBtn.click();
    assert.equal(panel.style.display, 'block');

    updateHUD(match);
    assert.match(panel.innerHTML, /No goals yet/);

    match.goalHistory.push({ team: 1, name: 'Kylian Mbappé', id: 5, timeFormatted: '0:30', ownGoal: false });
    updateHUD(match);
    assert.match(panel.innerHTML, /Kylian Mbappé/);
    assert.match(panel.innerHTML, /0:30/);
});
