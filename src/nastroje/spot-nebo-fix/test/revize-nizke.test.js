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

/* ---------- SPOT-09: měsíce mimo rok regulovaných cen ---------- */

test('SPOT-09: měsíce období mimo rok regulovaných cen se poznají', () => {
  const mesice = ['2025-11', '2025-12', '2026-01', '2026-10'];
  assert.deepEqual(v.mesiceMimoRokCen(mesice, 2026), ['2025-11', '2025-12']);
  assert.deepEqual(v.mesiceMimoRokCen(['2026-01', '2026-12'], 2026), []);
  assert.deepEqual(v.mesiceMimoRokCen(['2026-12', '2027-01'], 2026), ['2027-01']);
});

test('SPOT-09: upozornění vyjmenuje měsíce, rok cen a u roku 2025 nenulovou POZE podle CR ERÚ 11/2024', () => {
  const text = bezNbsp(v.upozorneniObdobi(['2025-11', '2025-12', '2026-01'], tarify, '2026-06-01'));
  assert.match(text, /listopad 2025 a prosinec 2025/);
  assert.match(text, /regulovanými cenami roku 2026/);
  assert.match(text, /POZE/);
  assert.match(text, /84,70 Kč/);
  assert.equal(v.upozorneniObdobi(['2026-01', '2026-12'], tarify, '2026-06-01'), '');
  const rok2025 = tarify.jinyRokCen.roky['2025'];
  assert.equal(rok2025.poze.perAmpPhase, 84.7);
  assert.match(rok2025.zdroj.pravniZaklad, /11\/2024/);
  assert.match(rok2025.zdroj.url, /^https:\/\/eru\.gov\.cz\/.*erv132024\.pdf#page=22$/);
  assert.match(rok2025.zdroj.citace, /84,70 Kč\/A\/měsíc/);
});

test('SPOT-09: období dat v rules.json mimo rok cen → upozornění vyjmenuje všechny takové měsíce', () => {
  const { od, do: konec } = pravidla.data;
  const grid = buildQuarterGrid(od, konec);
  const mesice = [...new Set(grid.map((q) => q.month))];
  const mimo = v.mesiceMimoRokCen(mesice, tarify.year);
  // Data jsou posledních 12 celých měsíců; pokud zrovna pokrývají jen rok cen, není co hlásit.
  if (!mimo.length) return;
  const text = v.upozorneniObdobi(mesice, tarify, '2026-06-01');
  assert.ok(text.length > 0);
  for (const m of mimo) assert.ok(bezNbsp(text).includes(bezNbsp(v.nazevMesice(m))), m);
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
