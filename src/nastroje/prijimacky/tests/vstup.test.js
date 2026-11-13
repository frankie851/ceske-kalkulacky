// Kontrola číselných polí (PRI-02, PRI-03) a texty strategie (PRI-04) – revize 5. 11. 2026.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kontrolaCisla, mezePoli } from '../simulace.js';
import { editorSkolHtml, editorDetiHtml, strategieHtml, upravVetu } from '../vystup.js';
import { evaluateStrategy } from '../strategy.js';

const pravidla = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const meze = mezePoli(pravidla);

test('rules.json: bodová škála jednotné zkoušky se zdrojem (2 testy po 50 bodech)', () => {
  assert.equal(pravidla.body.testMax, 50);
  assert.equal(pravidla.body.pocetTestu, 2);
  for (const z of [pravidla.body.zdroj, pravidla.body.skala]) {
    assert.ok(z.pravniZaklad && z.citace, 'zdroj má právní základ a citaci');
    assert.match(z.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/\d{4}-\d+#/);
  }
  assert.equal(meze.body.max, 100);
  assert.equal(meze.pokus.max, 50);
  assert.equal(meze.kapacita.max, pravidla.formular.kapacitaMax);
});

test('body: mimo 0–100 nebo nečitelné → chyba, prázdné = nezadáno', () => {
  for (const t of ['150', '-5', '1 500', '100,5', 'abc', '6O']) {
    assert.ok(kontrolaCisla(t, meze.body).chyba, `„${t}“ má být chyba`);
  }
  assert.deepEqual(kontrolaCisla('', meze.body), { hodnota: null });
  assert.deepEqual(kontrolaCisla('62', meze.body), { hodnota: 62 });
  assert.deepEqual(kontrolaCisla('0', meze.body), { hodnota: 0 });
  assert.deepEqual(kontrolaCisla('100', meze.body), { hodnota: 100 });
  assert.match(kontrolaCisla('150', meze.body).chyba, /0 do 100/);
});

test('desetinná čárka i tečka: „62,5“ i „62.5“ → 62,5 (nezávisle na jazyku prohlížeče)', () => {
  assert.deepEqual(kontrolaCisla('62,5', meze.body), { hodnota: 62.5 });
  assert.deepEqual(kontrolaCisla('62.5', meze.body), { hodnota: 62.5 });
  assert.deepEqual(kontrolaCisla(' 62,5 ', meze.body), { hodnota: 62.5 });
});

test('povinné body v simulátoru, pokus 0–50, počet míst celé číslo', () => {
  assert.match(kontrolaCisla('', meze.bodyPovinne).chyba, /Vyplň/);
  assert.deepEqual(kontrolaCisla('0', meze.bodyPovinne), { hodnota: 0 });
  assert.ok(kontrolaCisla('51', meze.pokus).chyba);
  assert.deepEqual(kontrolaCisla('', meze.pokus), { hodnota: null }, 'chybějící pokus (nemoc) je v pořádku');
  assert.deepEqual(kontrolaCisla('49,5', meze.pokus), { hodnota: 49.5 });
  assert.ok(kontrolaCisla('1,5', meze.kapacita).chyba);
  assert.ok(kontrolaCisla('', meze.kapacita).chyba);
  assert.ok(kontrolaCisla('-1', meze.kapacita).chyba);
  assert.ok(kontrolaCisla('51', meze.kapacita).chyba);
  assert.deepEqual(kontrolaCisla('0', meze.kapacita), { hodnota: 0 });
  assert.deepEqual(kontrolaCisla('', meze.shoda), { hodnota: null });
  assert.ok(kontrolaCisla('x', meze.shoda).chyba);
});

const STAV = {
  rezim: 'score',
  skoly: [{ id: 'A', name: 'A', capacity: 1 }],
  deti: [{ id: 'u1', name: 'Ema', score: 62.5, tiebreak: null, attempts: { cj: [30, null], m: [32.5, null] }, priorities: ['A', '', ''] }],
};

test('editor: číselná pole jsou type="text" s inputmode, ne type="number"', () => {
  const html = editorSkolHtml(STAV) + editorDetiHtml(STAV) + editorDetiHtml({ ...STAV, rezim: 'attempts' });
  assert.ok(!html.includes('type="number"'));
  assert.match(html, /id="dite-u1-body" type="text" inputmode="decimal"/);
  assert.match(html, /id="skola-A-mist" type="text" inputmode="numeric"/);
  assert.match(html, /value="62,5"/, 'desetinná čárka v hodnotě pole');
});

test('editor: chyba u pole → aria-invalid, aria-describedby a viditelná hláška s původním textem', () => {
  const chyby = new Map([['dite-u1-body', { text: 'Body jsou od 0 do 100.', hodnota: '150' }]]);
  const html = editorDetiHtml(STAV, { chyby });
  assert.match(html, /id="dite-u1-body"[^>]*value="150"[^>]*aria-invalid="true" aria-describedby="dite-u1-body-chyba"/);
  assert.match(html, /<p class="error-msg" id="dite-u1-body-chyba">.*Body jsou od 0 do 100\./);
  const bez = editorDetiHtml(STAV);
  assert.ok(!bez.includes('aria-invalid'));
  assert.match(bez, /<p class="error-msg" id="dite-u1-body-chyba" hidden>/);
});

test('strategie: desetinné body česky („o 2,5 b. nad“)', () => {
  const html = strategieHtml(evaluateStrategy({ expected: 62.5, schools: [{ name: 'A', lastMin: 60 }] }), 5, '/s.svg');
  assert.match(html, /o 2,5 b\. nad ním/);
  assert.match(html, /Loňské minimum 60 b\./);
});

test('vysvětlení z explain(): desetinná tečka → čárka, pořadí „1. priorita“ zůstane', () => {
  assert.equal(upravVetu('1. priorita A: nesplnil(a) kritéria (minimum 60 b., má 59.5 b.).'),
    '1. priorita A: nesplnil(a) kritéria (minimum 60 b., má 59,5 b.).');
});

test('PRI-04: strategie upozorňuje, že body i minimum musí být na stejné škále (jednotná zkouška)', () => {
  const njk = readFileSync(new URL('../index.njk', import.meta.url), 'utf8');
  const sekce = njk.slice(njk.indexOf('<section id="strategie"'), njk.indexOf('<section id="terminy"'));
  assert.match(sekce, /stejné škále/);
  assert.match(sekce, /jednotné zkoušky/);
  assert.match(sekce, /celkové body/);
  for (const id of ['str-ocekavane', 'str-min-']) {
    assert.match(sekce, new RegExp(`id: '${id}[^}]*chybaMisto: true`), `${id} má místo pro hlášku`);
    assert.match(sekce, new RegExp(`id: '${id}[^}]*inputmode: 'decimal'`), `${id} přijme desetinnou čárku`);
  }
});
