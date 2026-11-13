// Revize 5. 11. 2026, nízké nálezy SPOT-09, SPOT-10 a SPOT-12.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildQuarterGrid, profileFromCsv, normalize, POSUN_CTVRTHODIN } from '../calc.js';
import * as v from '../vystup.js';

const cti = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const pravidla = cti('../rules.json');
const tarify = cti('../tariffs.json');
const bezNbsp = (t) => String(t).replace(/[\u00a0\u202f]/g, ' ');

/* ---------- SPOT-09: měsíce bez regulovaných cen svého roku ---------- */
// Přepsáno 13. 11. 2026 (další práce, „regulované ceny po rocích“): dřív se ceny 2026 braly i pro 2025
// a test hlídal upozornění „regulovanými cenami roku 2026“ a poznámku o nezapočtené POZE 2025. Teď má
// tariffs.json sadu 2025 (starsiRoky) a hlásí se jen měsíce roku, pro který ceny ještě nemáme.

test('SPOT-09: měsíce období bez regulovaných cen svého roku se poznají', () => {
  assert.deepEqual(v.mesiceBezCen(['2025-11', '2025-12', '2026-01', '2026-10'], tarify), []);
  assert.deepEqual(v.mesiceBezCen(['2026-01', '2026-12'], tarify), []);
  assert.deepEqual(v.mesiceBezCen(['2026-12', '2027-01'], tarify), ['2027-01']);
});

test('SPOT-09: upozornění u roku bez cen vyjmenuje měsíce a rok použitých cen; POZE 2025 už jen nehlásí', () => {
  const text = bezNbsp(v.upozorneniObdobi(['2026-11', '2026-12', '2027-01', '2027-02'], tarify, '2026-06-01'));
  assert.match(text, /leden 2027 a únor 2027/);
  assert.match(text, /regulovanými cenami roku 2026/);
  const s2025 = bezNbsp(v.upozorneniObdobi(['2025-11', '2025-12', '2026-01'], tarify, '2026-06-01'));
  assert.doesNotMatch(s2025, /POZE|regulovanými cenami roku/);
  assert.equal(v.upozorneniObdobi(['2026-01', '2026-12'], tarify, '2026-06-01'), '');
  assert.equal(tarify.jinyRokCen.roky, undefined, 'poznámka o nezapočtené POZE 2025 je pryč');
});

test('SPOT-09: období dat v rules.json – upozornění vyjmenuje všechny měsíce bez cen svého roku', () => {
  const { od, do: konec } = pravidla.data;
  const grid = buildQuarterGrid(od, konec);
  const mesice = [...new Set(grid.map((q) => q.month))];
  const text = bezNbsp(v.upozorneniObdobi(mesice, tarify, '2026-06-01'));
  for (const m of v.mesiceBezCen(mesice, tarify)) assert.ok(text.includes(bezNbsp(v.nazevMesice(m))), m);
});

/* ---------- SPOT-10: krátké CSV nepřepíše roční spotřebu ---------- */

const grid = buildQuarterGrid('2025-11-01', '2026-10-31');
const tdd = normalize(grid.map(() => 1));
const csvDny = (od, dni) => {
  const rows = [];
  const zacatek = Date.UTC(+od.slice(0, 4), +od.slice(5, 7) - 1, +od.slice(8, 10));
  for (let d = 0; d < dni; d++) {
    const den = new Date(zacatek + d * 864e5).toISOString().slice(0, 10);
    for (let q = 0; q < 96; q++) {
      const hh = String(Math.floor(q / 4)).padStart(2, '0');
      const mm = String((q % 4) * 15).padStart(2, '0');
      rows.push([`${den} ${hh}:${mm}`, '0,15']);
    }
  }
  return rows;
};
const opt = { timeCol: 0, valueCol: 1, timeIsEnd: false, unit: 'kWh' };

test('SPOT-10: měření ze 2 dnů (pod minimem pokrytí) se nepoužije a nepřepíše roční spotřebu', () => {
  const r = profileFromCsv(csvDny('2026-01-05', 2), opt, grid, tdd);
  assert.ok(r.coverage < pravidla.mereni.minPokryti);
  const p = v.posudMereni(r, pravidla.mereni);
  assert.equal(p.pouzit, false);
  assert.equal(p.chyba, true);
  assert.match(bezNbsp(p.zprava), /1 % čtvrthodin/);
  assert.match(bezNbsp(p.zprava), /méně než 10 %/);
  assert.match(p.zprava, /nepoužijeme/);
});

test('SPOT-10: měření z 60 dnů se použije s upozorněním na hrubý odhad, celý rok bez upozornění', () => {
  const r = profileFromCsv(csvDny('2026-01-01', 60), opt, grid, tdd);
  assert.ok(r.coverage >= pravidla.mereni.minPokryti && r.coverage < pravidla.mereni.hrubyOdhadPod);
  const p = v.posudMereni(r, pravidla.mereni);
  assert.equal(p.pouzit, true);
  assert.equal(p.chyba, false);
  assert.match(p.zprava, /hrubý odhad/);
  assert.match(p.zprava, /doplňujeme podle typového profilu/);
  const cely = v.posudMereni({ ...r, coverage: 1, matched: grid.length }, pravidla.mereni);
  assert.equal(cely.pouzit, true);
  assert.doesNotMatch(cely.zprava, /hrubý odhad|doplňujeme/);
});

test('SPOT-10: minimum pokrytí je parametr v rules.json', () => {
  assert.equal(typeof pravidla.mereni.minPokryti, 'number');
  assert.ok(pravidla.mereni.minPokryti > 0 && pravidla.mereni.minPokryti < pravidla.mereni.hrubyOdhadPod);
});

/* ---------- SPOT-12: text posunu odpovídá kódu ---------- */

test('SPOT-12: popis posunu uvádí stejný počet čtvrthodin jako výpočet a zmiňuje optimismus', () => {
  assert.equal(POSUN_CTVRTHODIN, 16);
  const neovereno = pravidla.meta.neovereno.find((t) => t.startsWith('Posun spotřeby'));
  assert.ok(neovereno.includes(`${POSUN_CTVRTHODIN} nejlevnějších čtvrthodin`));
  assert.match(neovereno, /optimistick/);
  assert.match(neovereno, /dopředu/);
  const napoveda = pravidla.vychozi.posun.napoveda;
  assert.ok(napoveda.includes(`${POSUN_CTVRTHODIN} nejlevnějších čtvrthodin`));
  assert.match(napoveda, /optimistick/);
  assert.doesNotMatch(JSON.stringify(pravidla), /4 nejlevnějších hodin/);
});
