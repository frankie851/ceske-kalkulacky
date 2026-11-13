// Revize 5. 11. 2026, INF-04: čtení formulářů a směr přepočtu jsou čisté funkce ve vystup.js
// (bez DOM), takže se dají testovat v Node. ui.js je jen volá a vypisuje chyby k polím.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createSeries } from '../inflation.js';
import {
  mesicZPoli, castkaZTextu, vynosZTextu, smerPrepoctu, prohodMesice,
  vstupPrepoctu, vstupVynosu, vstupMzdy, prepocet,
} from '../vystup.js';

const close = (actual, expected, eps = 1e-4) =>
  assert.ok(Math.abs(actual - expected) < eps, `${actual} ≠ ${expected}`);
const bezNbsp = (t) => t.replace(/ /g, ' ');

// Testovací data (nejsou to data ČSÚ)
const ukazka = createSeries({ '2020-01': 100, '2020-02': 110, '2020-03': 125 });
const cpi = createSeries(JSON.parse(readFileSync(new URL('../data/cpi.json', import.meta.url), 'utf8')));

test('mesicZPoli: rok a měsíc z výběrů → RRRR-MM', () => {
  assert.equal(mesicZPoli('2005', '01'), '2005-01');
  assert.equal(mesicZPoli(2026, 9), '2026-09');
});

test('castkaZTextu: český zápis částek přes sdílené prectiCislo', () => {
  assert.deepEqual(castkaZTextu('10 000'), { hodnota: 10000, chyba: '' });
  assert.deepEqual(castkaZTextu('10.000'), { hodnota: 10000, chyba: '' });
  assert.deepEqual(castkaZTextu('1 500,50'), { hodnota: 1500.5, chyba: '' });
  assert.deepEqual(castkaZTextu('0'), { hodnota: 0, chyba: '' });
});

test('castkaZTextu: prázdné pole, písmena, záporná a nulová částka → chyba bez hodnoty', () => {
  assert.equal(castkaZTextu('').hodnota, null);
  assert.match(castkaZTextu('').chyba, /Vyplň částku/);
  assert.match(castkaZTextu('abc').chyba, /číslem/);
  assert.match(castkaZTextu('-5').chyba, /nemůže být záporná/);
  assert.equal(castkaZTextu('-5').hodnota, null);
  assert.match(castkaZTextu('0', { kladna: true }).chyba, /kladnou částku/);
});

test('vynosZTextu: 3,5 → 3,5; −100 a méně → chyba; záporný výnos nad −100 % projde', () => {
  assert.deepEqual(vynosZTextu('3,5'), { hodnota: 3.5, chyba: '' });
  assert.deepEqual(vynosZTextu('-2'), { hodnota: -2, chyba: '' });
  assert.match(vynosZTextu('-100').chyba, /větší než −100/);
  assert.match(vynosZTextu('').chyba, /Vyplň výnos/);
  assert.match(vynosZTextu('4 %').chyba, /číslem/);
});

test('smerPrepoctu: z minulosti do dneška, opačně a stejný měsíc', () => {
  assert.deepEqual(smerPrepoctu('2005-01', '2026-09'), { smer: 'dopredu', zacatek: '2005-01', konec: '2026-09', mesicu: 260 });
  assert.deepEqual(smerPrepoctu('2026-09', '2005-01'), { smer: 'zpet', zacatek: '2005-01', konec: '2026-09', mesicu: 260 });
  assert.deepEqual(smerPrepoctu('2020-02', '2020-02'), { smer: 'stejne', zacatek: '2020-02', konec: '2020-02', mesicu: 0 });
});

test('prohodMesice: tlačítko ⇄ prohodí Z měsíce a Na měsíc', () => {
  assert.deepEqual(prohodMesice({ od: '2005-01', do: '2026-09' }), { od: '2026-09', do: '2005-01' });
});

test('vstupPrepoctu: platný formulář → vstup pro prepocet(), chybný → chyba u pole', () => {
  assert.deepEqual(vstupPrepoctu({ castka: '10 000', od: '2005-01', do: '2026-09' }), {
    vstup: { castka: 10000, od: '2005-01', do: '2026-09' },
    chyby: { castka: '' },
  });
  const r = vstupPrepoctu({ castka: '', od: '2005-01', do: '2026-09' });
  assert.equal(r.vstup, null);
  assert.match(r.chyby.castka, /Vyplň částku/);
});

test('vstupVynosu a vstupMzdy: chyby u správných polí, typ výnosu výchozí p. a.', () => {
  assert.deepEqual(vstupVynosu({ urok: '4', od: '2021-09', do: '2026-09' }), {
    vstup: { urok: 4, typ: 'pa', od: '2021-09', do: '2026-09' },
    chyby: { urok: '' },
  });
  assert.equal(vstupVynosu({ urok: 'x', typ: 'celkem', od: '2021-09', do: '2026-09' }).vstup, null);
  const m = vstupMzdy({ mzdaTehdy: '40 000', mzdaTed: '0', od: '2021-09', do: '2026-09' });
  assert.equal(m.vstup, null);
  assert.equal(m.chyby['mzda-tehdy'], '');
  assert.match(m.chyby['mzda-ted'], /kladnou částku/);
  assert.deepEqual(vstupMzdy({ mzdaTehdy: '40 000', mzdaTed: '50 000', od: '2021-09', do: '2026-09' }).vstup,
    { mzdaTehdy: 40000, mzdaTed: 50000, od: '2021-09', do: '2026-09' });
});

test('prepocet obráceně: 125 Kč z března 2020 → 100 Kč v lednu 2020, ceny přitom vzrostly o 25 %', () => {
  const r = prepocet(ukazka, { castka: 125, od: '2020-03', do: '2020-01' });
  assert.equal(bezNbsp(r.cislo), '100 Kč');
  assert.equal(r.smer, 'zpet');
  assert.match(bezNbsp(r.vysvetleni), /Ceny od ledna 2020 do března 2020 vzrostly o 25,0 %/);
  assert.equal(bezNbsp(r.statistiky[0].hodnota), '+25,0 %');
});

test('prepocet leden 2005 ↔ září 2026: změna cen +98,5 %, průměrně 3,2 % ročně v obou směrech', () => {
  const tam = prepocet(cpi, { castka: 10000, od: '2005-01', do: '2026-09' });
  const zpet = prepocet(cpi, { castka: 10000, od: '2026-09', do: '2005-01' });
  assert.equal(tam.smer, 'dopredu');
  assert.equal(zpet.smer, 'zpet');
  close(tam.zmena, 0.98504);
  close(zpet.zmena, 0.98504);
  close(tam.rocne, 0.03215);
  close(zpet.rocne, 0.03215);
  assert.equal(bezNbsp(tam.cislo), '19 850 Kč');
  assert.equal(bezNbsp(zpet.cislo), '5 038 Kč');
  assert.match(bezNbsp(zpet.vysvetleni), /Ceny od ledna 2005 do září 2026 vzrostly o 98,5 % \(průměrně 3,2 % ročně\)/);
});
