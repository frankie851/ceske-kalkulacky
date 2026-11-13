// Další práce po revizi 5. 11. 2026: věty z převzatého explain() (matching.js) jsou na webu
// rodově neutrální. Modul zůstává beze změny, úpravu dělá vystup.js → upravVetu().
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deferredAcceptance, explain } from '../matching.js';
import { SCENARIOS } from '../scenarios.js';
import { stavZeScenare, spust } from '../simulace.js';
import { upravVetu, vysledekHtml } from '../vystup.js';
import { rodoveTvary } from '../texty.js';

const RODOVE = /\((a|á)\)|přijat[ýá]?\b|Přijat|Nepřijat|nesplnil/;

test('explain(): přijetí, nepřijetí, nesplněné minimum i obsazená místa → bez rodových tvarů', () => {
  const skoly = [
    { id: 'A', name: 'Gymnázium', capacity: 1, minScore: 60 },
    { id: 'B', name: 'Průmyslovka', capacity: 1 },
    { id: 'C', name: 'Obchodka', capacity: 1 },
  ];
  const deti = [
    { id: 'x', name: 'Bára', score: 80, priorities: ['B', 'C'] },
    { id: 'y', name: 'Adam', score: 59.5, priorities: ['A', 'B', 'C'] },
    { id: 'z', name: 'Cyril', score: 50, priorities: ['B'] },
  ];
  const r = deferredAcceptance(deti, skoly);
  const proc = explain(r, deti, skoly);
  const puvodni = Object.values(proc).flat();
  // Test pokrývá všechny rodové věty modulu (kdyby se modul změnil, ukáže to).
  assert.ok(puvodni.some((t) => t.includes('nesplnil(a)')));
  assert.ok(puvodni.some((t) => t.startsWith('Přijat(a)')));
  assert.ok(puvodni.some((t) => t.startsWith('Nepřijat(a)')));
  assert.ok(puvodni.some((t) => t.includes('poslední přijatý')));

  const web = puvodni.map(upravVetu);
  for (const t of web) assert.doesNotMatch(t, RODOVE, t);
  assert.deepEqual(proc.y.map(upravVetu), [
    '1. priorita Gymnázium: nesplňuje kritéria (minimum 60 b., má 59,5 b.).',
    '2. priorita Průmyslovka: jediné místo obsadil někdo s lepším pořadím (poslední s místem: Bára, 80 b.; Adam má 59,5 b.).',
    'Místo na 3. prioritě: Obchodka.',
  ]);
  assert.deepEqual(proc.z.map(upravVetu), [
    '1. priorita Průmyslovka: jediné místo obsadil někdo s lepším pořadím (poslední s místem: Bára, 80 b.; Cyril má 50 b.).',
    'V tomto kole bez místa – může se hlásit do dalšího kola.',
  ]);
});

test('všechny scénáře simulátoru: vysvětlení na webu bez rodových tvarů', () => {
  for (const s of SCENARIOS) {
    const stav = stavZeScenare(s);
    const beh = spust(stav);
    if (!beh.vysledek) continue;
    assert.doesNotMatch(vysledekHtml(stav, beh, s), RODOVE, s.id);
    assert.deepEqual(rodoveTvary(Object.values(beh.proc).flat()), [], s.id);
  }
});

test('build hlídá rodové tvary z explain(): rodoveTvary() vrátí věty, které úprava nepokryla', () => {
  assert.deepEqual(rodoveTvary(['Přijat(a) na 1. prioritu: A.']), []);
  assert.deepEqual(rodoveTvary(['Nový text: zapsal(a) se.']), ['Nový text: zapsal(a) se.']);
  const data = readFileSync(new URL('../prijimacky.11tydata.js', import.meta.url), 'utf8');
  assert.match(data, /rodoveTvary\(/);
});
