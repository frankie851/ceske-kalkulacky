// Texty výsledku (vystup.js): větve doby splácení, úrok z prodlení podle pololetí
// a upozornění u úředních kalkulaček. Revize 5. 11. 2026: DLU-01, DLU-03, DLU-06, DLU-07.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { pravidlaProRok } from '../dluhy.js';
import { vysledek, volbaStareSrazky, urokNapoveda, moznostiUroku, cisloSazby, rozdilyKalkulacek, delkaSlovy } from '../vystup.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const p = pravidlaProRok(rules, 2026);
const NBSP = / /g;
const bezNbsp = (t) => t.replace(NBSP, ' ');
const zaklad = { cistaMzda: 23000, osoby: 0, prednostni: false, pocetExekuci: 1, duchodce: false, dluh: 100000, sazba: 0, drivejsiOdpusteni: 'ne' };

test('doba splácení: běžný případ', () => {
  const v = vysledek(p, zaklad);
  assert.equal(bezNbsp(v.ex.doba), 'Odhad doby splácení: 2 roky a 11 měsíců.');
});

test('doba splácení: větev „prilis-dlouho“ (přes 50 let)', () => {
  const v = vysledek(p, { ...zaklad, dluh: 10000000 });
  assert.equal(v.cisla.ex.duvod, 'prilis-dlouho');
  assert.equal(v.ex.doba, 'Splácení by trvalo déle než 50 let.');
});

test('doba splácení: větev „zadna-srazka“ při srážce 0 Kč', () => {
  const v = vysledek(p, { ...zaklad, cistaMzda: 12000 });
  assert.equal(v.cisla.ex.duvod, 'zadna-srazka');
  assert.match(v.ex.doba, /nestrhává nic/);
});

test('doba splácení: větev „zadna-srazka“, když celou srážku dostane zaměstnavatel (DLU-07)', () => {
  // 14 105 Kč: srážka 1 Kč, náhrada zaměstnavateli 1 Kč, věřitelům 0 Kč
  const v = vysledek(p, { ...zaklad, cistaMzda: 14105 });
  assert.equal(v.cisla.s.srazka, 1);
  assert.equal(v.cisla.ex.duvod, 'zadna-srazka');
  assert.doesNotMatch(v.ex.doba, /50 let/);
  assert.match(v.ex.doba, /Věřitelům z této srážky nic nezbude/);
});

test('doba splácení: bez dluhu se doba nepíše jako „0 měsíců“ (DLU-07)', () => {
  const v = vysledek(p, { ...zaklad, dluh: 0 });
  assert.doesNotMatch(v.ex.doba, /0 měsíců/);
  assert.match(v.ex.doba, /Nezadali jste žádný dluh/);
});

test('doba splácení: úrok vyšší než splátka', () => {
  const v = vysledek(p, { ...zaklad, dluh: 500000, sazba: 11.75 });
  assert.equal(v.cisla.ex.duvod, 'urok-vyssi-nez-splatka');
  assert.match(v.ex.upozorneni, /Dluh poroste rychleji/);
});

test('úrok z prodlení od roku 2023 (15 %): 3 roky a 10 měsíců, úroky 31 403 Kč', () => {
  const v = vysledek(p, { ...zaklad, sazba: 15 });
  assert.equal(bezNbsp(v.ex.doba), 'Odhad doby splácení: 3 roky a 10 měsíců.');
  assert.match(bezNbsp(v.ex.upozorneni), /31 403 Kč/);
});

test('délka slovy', () => {
  assert.equal(delkaSlovy(0), '0 měsíců');
  assert.equal(delkaSlovy(1), '1 měsíc');
  assert.equal(delkaSlovy(12), '1 rok');
  assert.equal(delkaSlovy(35), '2 roky a 11 měsíců');
  assert.equal(delkaSlovy(60), '5 let');
});

// DLU-01
test('nápověda k úroku: sazba podle pololetí vzniku prodlení, žádné číslo natvrdo', () => {
  const t = urokNapoveda();
  assert.match(t, /pololetí/);
  assert.match(t, /nemění/);
  assert.doesNotMatch(t, /\d/);
});

test('volby pololetí: z rules.json, nejnovější první a vybraná, na konci vlastní sazba', () => {
  const u = rules.urokZProdleni;
  const m = moznostiUroku(u);
  assert.equal(m.length, u.pololeti.length + 1);
  const nejnovejsi = u.pololeti.at(-1);
  assert.equal(m[0].hodnota, nejnovejsi.od);
  assert.equal(m[0].sazba, nejnovejsi.procenta);
  assert.equal(m[0].vybrano, true);
  assert.equal(m.filter((x) => x.vybrano).length, 1);
  assert.equal(m.at(-1).hodnota, 'jina');
  assert.equal(m.at(-1).sazba, null);
  // Text volby říká pololetí i sazbu
  const v2023 = m.find((x) => x.hodnota === '2023-01-01');
  assert.equal(bezNbsp(v2023.text), '1. pololetí 2023: 15 %');
  const v2026 = m.find((x) => x.hodnota === '2026-07-01');
  assert.equal(bezNbsp(v2026.text), '2. pololetí 2026: 11,75 %');
});

test('sazba do pole: desetinná čárka bez zbytečných nul', () => {
  assert.equal(cisloSazby(11.75), '11,75');
  assert.equal(cisloSazby(15), '15');
  assert.equal(cisloSazby(12.5), '12,5');
});

// DLU-03
test('upozornění u úředních kalkulaček: proč mohou ukázat jiné číslo', () => {
  const r = rozdilyKalkulacek(p, rules.uredniKalkulacky, 2026);
  const k = rules.uredniKalkulacky;
  assert.ok(r.srazky.includes(`„${k.srazky.variantaOdchylna}“`));
  assert.ok(r.srazky.includes(`„${k.srazky.variantaPodleNarizeni}“`));
  assert.match(r.srazky, /životním minimem/);
  assert.match(r.srazky, /k 1\. lednu/);
  // Hranice, nad kterou jejich kalkulačka splátek ukáže víc: 14 102 + 1 × 16 590 Kč
  assert.match(bezNbsp(r.splatky), /30 692 Kč/);
  assert.match(r.splatky, /vyšší splátku/);
  for (const t of [r.srazky, r.splatky]) {
    // Vyká, krátké věty
    assert.doesNotMatch(t, /\b(máš|zvol|tvoje|tvůj|si zkontroluj)\b/i);
    for (const veta of t.split(/(?<=[.!?])\s+/)) assert.ok(veta.split(/\s+/).length <= 20, `dlouhá věta: ${veta}`);
  }
});

// DLU-09 (revize 5. 11. 2026, nízký nález): náhrada plátci mzdy nenáleží u exekucí, kde příkaz
// ke srážkám ze mzdy vydal exekutor před 1. 1. 2022 (zákon č. 286/2021 Sb., čl. IV bod 1 a 12).
test('náhrada zaměstnavateli: text říká, kdy se neplatí (DLU-09)', () => {
  const v = vysledek(p, zaklad);
  assert.equal(v.cisla.s.nahradaZamestnavateli, 50);
  const t = bezNbsp(v.ex.nahrada);
  assert.match(t, /nechá 50 Kč/);
  assert.match(t, /před 1\. 1\. 2022/);
  assert.match(t, /celou srážku/);
  assert.doesNotMatch(t, /\b(máš|tvoje|tvůj|dostaneš)\b/i);
  for (const veta of t.split(/(?<=[.!?])\s+/)) assert.ok(veta.split(/\s+/).length <= 20, `dlouhá věta: ${veta}`);
});

// Další práce po revizi (13. 11. 2026): volba „Srážky ze mzdy byly nařízené před 1. 1. 2022“
test('srážky nařízené před 1. 1. 2022: náhrada se neodečte, text a rozpis to řeknou', () => {
  const v = vysledek(p, { ...zaklad, stareSrazky: true });
  assert.equal(v.cisla.s.nahradaZamestnavateli, 0);
  assert.equal(bezNbsp(v.ex.vericum), '2 966 Kč');
  // 100 000 / 2 966 Kč měsíčně → 34 měsíců
  assert.equal(bezNbsp(v.ex.doba), 'Odhad doby splácení: 2 roky a 10 měsíců.');
  const t = bezNbsp(v.ex.nahrada);
  assert.match(t, /před 1\. 1\. 2022/);
  assert.match(t, /nic nenechá/);
  assert.match(t, /celou srážku/);
  assert.doesNotMatch(t, /\b(máš|tvoje|tvůj|dostaneš)\b/i);
  for (const veta of t.split(/(?<=[.!?])\s+/)) assert.ok(veta.split(/\s+/).length <= 20, `dlouhá věta: ${veta}`);
  assert.ok(v.rozpis.some((r) => /celou srážku/.test(r)), 'rozpis zmíní, že náhrada se neodečítá');
  assert.ok(!v.rozpis.some((r) => /nechá 50/.test(bezNbsp(r))));
});

test('popis volby o starých srážkách bere datum z pravidel a vyká', () => {
  const t = bezNbsp(volbaStareSrazky(p).label + ' ' + volbaStareSrazky(p).napoveda);
  assert.match(t, /před 1\. 1\. 2022/);
  assert.doesNotMatch(t, /\b(máš|tvoje|tvůj|zaškrtni)\b/i);
});
