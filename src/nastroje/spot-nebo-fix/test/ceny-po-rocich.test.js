// Další práce po revizi 5. 11. 2026, SPOT-09 („regulované ceny po rocích“): data jsou posledních 12 celých
// měsíců (teď 11/2025–10/2026), regulované složky se berou z cen roku, do kterého měsíc patří.
// Očekávané hodnoty 2025 jsou opsané přímo z úředních textů, ne z tariffs.json:
//   - cenové rozhodnutí ERÚ č. 12/2024 (ERV 14/2024, https://eru.gov.cz/sites/default/files/obsah/prilohy/erv142024.pdf),
//     část čtvrtá – sazby D (strana PDF v komentáři),
//   - cenové rozhodnutí ERÚ č. 11/2024 (ERV 13/2024, https://eru.gov.cz/sites/default/files/obsah/prilohy/erv132024.pdf),
//     body (3.1.1), (5.1.2), (5.2), (6.2.1.1), (6.2.1.2), (6.2.2),
//   - nařízení vlády č. 392/2015 Sb. § 1 ve znění nařízení vlády č. 248/2025 Sb. (poplatek ERÚ 4 Kč od 1. 9. 2025),
//   - zákon č. 261/2007 Sb., část 47, § 6 odst. 2 (daň z elektřiny 28,30 Kč/MWh),
//   - zákon č. 235/2004 Sb. § 47 odst. 1 písm. a) (DPH 21 %).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildQuarterGrid, computeVariants, cenyProRok, regulatedFor, regulatedByMonth, ntMaskFor } from '../calc.js';
import * as v from '../vystup.js';

const cti = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const tarify = cti('../tariffs.json');
const pravidla = cti('../rules.json');
const dynamicky = cti('../dynamic.json');
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const bezNbsp = (t) => String(t).replace(/[  ]/g, ' ');

const JISTICE = ['1x25', '3x10', '3x16', '3x20', '3x25', '3x32', '3x40', '3x50', '3x63'];
const PASMO = { '1x25': 0, '3x10': 0, '3x16': 1, '3x20': 2, '3x25': 3, '3x32': 4, '3x40': 5, '3x50': 6, '3x63': 7 };

// CR ERÚ č. 12/2024: [VT Kč/MWh, NT Kč/MWh | null, [8 pásem jističe Kč/měsíc]] bez DPH.
const CR = {
  D02d: { // str. PDF 29 (tištěná 28/42)
    cez: [2099.63, null, [98, 157, 197, 246, 315, 394, 492, 620]],
    egd: [2171.45, null, [94, 150, 188, 235, 300, 376, 470, 592]],
    pre: [1405.58, null, [83, 133, 167, 209, 267, 334, 417, 525]],
  },
  D25d: { // str. PDF 30 (tištěná 29/42)
    cez: [2267.11, 206.00, [95, 152, 190, 237, 303, 379, 474, 597]],
    egd: [2123.08, 222.64, [91, 145, 181, 227, 290, 362, 453, 571]],
    pre: [1539.98, 114.44, [76, 121, 151, 189, 242, 302, 378, 476]],
  },
  D26d: { // str. PDF 31 (tištěná 30/42)
    cez: [1046.00, 206.00, [140, 223, 279, 349, 446, 558, 698, 879]],
    egd: [958.21, 222.64, [142, 227, 283, 354, 453, 566, 708, 892]],
    pre: [739.91, 114.44, [114, 182, 227, 284, 364, 455, 569, 716]],
  },
  D01d: { // str. PDF 28 (tištěná 27/42)
    cez: [2803.18, null, [44, 70, 87, 109, 139, 174, 218, 274]],
    egd: [2694.79, null, [41, 66, 83, 104, 132, 166, 207, 261]],
    pre: [1823.39, null, [38, 61, 77, 96, 123, 154, 192, 242]],
  },
};
// VT a NT ostatních sazeb pro všechny tři distributory (str. PDF 32–41).
const VT_NT = {
  D27d: { cez: [2267.11, 206.00], egd: [2123.08, 222.64], pre: [1539.98, 114.44] },
  D35d: { cez: [721.45, 206.00], egd: [718.76, 222.64], pre: [296.85, 114.44] },
  D45d: { cez: [721.45, 206.00], egd: [718.76, 222.64], pre: [296.85, 114.44] },
  D56d: { cez: [721.45, 206.00], egd: [718.76, 222.64], pre: [296.85, 114.44] },
  D57d: { cez: [721.45, 206.00], egd: [718.76, 222.64], pre: [296.85, 114.44] },
  D61d: { cez: [3282.60, 206.00], egd: [3178.99, 222.64], pre: [2199.27, 114.44] },
};
const STRANY_2025 = { D01d: 28, D02d: 29, D25d: 30, D26d: 31, D27d: 32, D35d: 33, D45d: 35, D56d: 37, D57d: 39, D61d: 41 };

const DAN = 28.30; // zákon č. 261/2007 Sb., část 47, § 6 odst. 2
const SYS_2025 = 170.92; // CR 11/2024 bod (3.1.1)
const INFRA_2025 = 2.26 + 0.99 + 5.20 + 4; // CR 11/2024 body (6.2.1.1), (6.2.1.2), (6.2.2) + poplatek ERÚ (NV 392/2015 Sb. § 1)
const POZE_A_2025 = 84.70; // CR 11/2024 bod (5.1.2), trojfázově trojnásobek (5.2)
const POZE_MAX = 495; // CR 11/2024 bod (5.3), od 1. 10. 2025 zákon č. 165/2012 Sb. § 28a odst. 2

const grid1 = buildQuarterGrid('2025-12-01', '2025-12-01');
const ceny2025 = cenyProRok(tarify, 2025);

test('SPOT-09: sada 2025 existuje a cenyProRok ji vrátí pro rok 2025, pro 2026 aktuální ceník', () => {
  assert.equal(ceny2025.rok, 2025);
  assert.equal(ceny2025.rokCen, 2025);
  assert.equal(ceny2025.presny, true);
  const c26 = cenyProRok(tarify, 2026);
  assert.equal(c26.rokCen, 2026);
  assert.equal(c26.tarify.common.systemServices.value, tarify.common.systemServices.value);
  assert.notEqual(ceny2025.tarify.common.systemServices.value, c26.tarify.common.systemServices.value);
});

test('SPOT-09: ceny 2025 (VT, NT, jistič) v regulatedFor odpovídají CR ERÚ 12/2024 – D01d, D02d, D25d, D26d × 3 distributoři × 9 jističů', () => {
  let pocet = 0;
  for (const [sazba, podleDistributora] of Object.entries(CR)) {
    for (const [d, [vt, nt, jistice]] of Object.entries(podleDistributora)) {
      for (const id of JISTICE) {
        const r = regulatedFor(ceny2025.tarify, grid1, d, sazba, id);
        close(r.vt, vt);
        close(r.nt, nt ?? vt);
        close(r.monthly, jistice[PASMO[id]] + INFRA_2025);
        pocet++;
      }
    }
  }
  assert.equal(pocet, 4 * 3 * 9);
});

test('SPOT-09: ceny 2025 – VT a NT sazeb D27d až D61d pro ČEZ, EG.D a PRE podle CR ERÚ 12/2024', () => {
  for (const [sazba, podleDistributora] of Object.entries(VT_NT)) {
    for (const [d, [vt, nt]] of Object.entries(podleDistributora)) {
      const r = regulatedFor(ceny2025.tarify, grid1, d, sazba, '3x25');
      close(r.vt, vt);
      close(r.nt, nt);
    }
  }
});

test('SPOT-09: složky 2025 za MWh a POZE podle CR ERÚ 11/2024, zákona o dani z elektřiny a NV 392/2015 Sb.', () => {
  const r = regulatedFor(ceny2025.tarify, grid1, 'cez', 'D02d', '3x25');
  close(r.perMWh, DAN + SYS_2025);
  close(r.poze.perMWh, POZE_MAX);
  close(r.poze.monthly, POZE_A_2025 * 25 * 3);
  const r1 = regulatedFor(ceny2025.tarify, grid1, 'cez', 'D02d', '1x25');
  close(r1.poze.monthly, POZE_A_2025 * 25);
  assert.equal(ceny2025.tarify.vat.value, 0.21);
});

test('SPOT-09: zdroje 2025 mají právní základ, url s #page, citaci a datum ověření', () => {
  const s = tarify.starsiRoky['2025'];
  const datumIso = /^\d{4}-\d{2}-\d{2}$/;
  const fmt = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 2 }).replace(/\s/g, ' ');
  for (const d of ['cez', 'egd', 'pre']) {
    const z = s.distributors[d].source;
    assert.match(z.pravniZaklad, /cenové rozhodnutí ERÚ č\. 12\/2024/i, d);
    assert.match(z.url, /^https:\/\/eru\.gov\.cz\/.*erv142024\.pdf#page=\d+$/, d);
    assert.ok(z.citace.includes(fmt(CR.D02d[d][0])), `${d}: citace bez VT D02d`);
    assert.ok(z.citace.includes(String(CR.D02d[d][2][PASMO['3x25']])), `${d}: citace bez jističe 3× 25 A`);
    assert.deepEqual(z.stranyPdf, STRANY_2025, d);
    assert.match(z.overeno, datumIso);
    assert.equal(z.year, 2025);
    assert.deepEqual(Object.keys(s.distributors[d].sazby), Object.keys(tarify.sazbyInfo), d);
  }
  const c = s.common;
  const zdroje = [c.electricityTax.zdroj, c.systemServices.zdroj, ...c.nonNetworkInfra.zdroj, ...c.poze.zdroj, s.vat.zdroj];
  for (const z of zdroje) {
    assert.ok(z.pravniZaklad && z.citace, JSON.stringify(z));
    assert.match(z.url, /^https:\/\/(eru\.gov\.cz\/.*\.pdf#page=\d+|www\.zakonyprolidi\.cz\/cs\/\d{4}-\d+#\S+)$/, z.url);
    assert.match(z.overeno, datumIso);
  }
  assert.match(c.systemServices.zdroj.url, /erv132024\.pdf#page=7$/);
  assert.match(c.systemServices.zdroj.citace, /170,92 Kč\/MWh/);
  assert.match(c.poze.zdroj[0].url, /erv132024\.pdf#page=22$/);
  assert.match(c.nonNetworkInfra.zdroj.map((z) => z.url).join(' '), /2015-392#p1/);
  assert.match(c.electricityTax.zdroj.citace, /28,30 Kč\/MWh/);
});

test('SPOT-09: okna nízkého tarifu 2025 podle CR ERÚ 12/2024 (D35d 16 h, D56d 22 h), 2026 podle CV ERÚ 14/2025', () => {
  const delka = (okna) => okna.reduce((s, [od, doH]) => s + (doH - od), 0);
  const ocekavano2025 = { D25d: 8, D26d: 8, D27d: 8, D35d: 16, D45d: 20, D56d: 22, D57d: 20 };
  const nt25 = ceny2025.tarify.ntHours;
  for (const [s, h] of Object.entries(ocekavano2025)) {
    assert.equal(delka(nt25[s].workday), h, `${s} 2025`);
    assert.equal(delka(nt25[s].weekend), h, `${s} 2025 víkend`);
  }
  for (const [od, doH] of nt25.D27d.workday) assert.ok(doH <= 8 || od >= 18, `D27d ${od}–${doH}`);
  assert.deepEqual(nt25.D61d.byWeekday, { 5: [[12, 24]], 6: [[0, 24]], 0: [[0, 22]] });
  // Maska NT po měsících: prosinec 2025 podle oken 2025, leden 2026 podle oken 2026.
  const grid = buildQuarterGrid('2025-12-31', '2026-01-01');
  const r = regulatedByMonth(tarify, grid, 'cez', 'D35d', '3x25');
  const den = (datum) => grid.map((q, i) => (q.date === datum ? r.ntMask[i] : 0)).reduce((a, b) => a + b, 0) / 4;
  assert.equal(den('2025-12-31'), 16);
  assert.equal(den('2026-01-01'), 20);
  assert.deepEqual(r.ntMask.slice(0, 96), ntMaskFor(grid.slice(0, 96), nt25.D35d));
});

test('SPOT-09: prosinec 2025 se počítá s cenami 2025, leden 2026 s cenami 2026 (ručně spočtené měsíce, D02d, ČEZ, 3× 25 A)', () => {
  const grid = buildQuarterGrid('2025-12-01', '2026-01-31');
  const cons = grid.map(() => 0.0001); // 0,1 kWh za čtvrthodinu
  const regulated = regulatedByMonth(tarify, grid, 'cez', 'D02d', '3x25');
  const r = computeVariants({
    grid, cons, spotEur: grid.map(() => 0), fx: grid.map(() => 25), vat: 0.21, regulated,
    fix: { price: 0, monthlyFee: 0 }, spot: { margin: 0, monthlyFee: 0 },
    dynamic: { base: 0, pct: grid.map(() => 0), monthlyFee: 0 }, shiftPct: 0,
  });
  assert.deepEqual(r.months, ['2025-12', '2026-01']);
  const mwh = 31 * 96 * 0.0001; // prosinec i leden mají 31 dnů bez změny času
  // Prosinec 2025: distribuce D02d ČEZ 2 099,63 Kč/MWh, daň 28,30, systémové služby 170,92 Kč/MWh;
  // jistič 3× 25 A 246 Kč + nesíťová infrastruktura 2,26 + 0,99 + 5,20 + 4 Kč měsíčně;
  // POZE nižší z 495 Kč/MWh × spotřeba a 84,70 Kč × 25 A × 3 fáze.
  const prosinec = (mwh * (2099.63 + 28.30 + 170.92) + 246 + 12.45 + Math.min(mwh * 495, 84.70 * 75)) * 1.21;
  // Leden 2026: CV ERÚ 14/2025 2 078,58 Kč/MWh, daň 28,30, systémové služby 164,24 Kč/MWh (CV 13/2025);
  // jistič 256 Kč + nesíťová infrastruktura 12,87 Kč; POZE 0 Kč (CV 15/2025).
  const leden = (mwh * (2078.58 + 28.30 + 164.24) + 256 + 12.87) * 1.21;
  close(prosinec, 1318.7787, 1e-3); // ručně: (0,2976 × 2 298,85 + 258,45 + 147,312) × 1,21
  close(leden, 1143.1539, 1e-3); // ručně: (0,2976 × 2 271,12 + 268,87) × 1,21
  for (const k of ['fix', 'spot', 'dynamic']) {
    close(r.variants[k].monthly[0], prosinec, 1e-6);
    close(r.variants[k].monthly[1], leden, 1e-6);
  }
  close(r.variants.fix.poze, mwh * 495 * 1.21, 1e-9);
  assert.equal(regulated.byMonth['2025-12'].rokCen, 2025);
  assert.equal(regulated.byMonth['2026-01'].rokCen, 2026);
});

test('SPOT-09: jeden ceník (bez rozdělení po měsících) dává jiný výsledek než ceny po rocích', () => {
  const grid = buildQuarterGrid('2025-12-01', '2026-01-31');
  const cons = grid.map(() => 0.0001);
  const zaklad = {
    grid, cons, spotEur: grid.map(() => 0), fx: grid.map(() => 25), vat: 0.21,
    fix: { price: 0, monthlyFee: 0 }, spot: { margin: 0, monthlyFee: 0 },
    dynamic: { base: 0, pct: grid.map(() => 0), monthlyFee: 0 }, shiftPct: 0,
  };
  const poRocich = computeVariants({ ...zaklad, regulated: regulatedByMonth(tarify, grid, 'cez', 'D02d', '3x25') });
  const jeden = computeVariants({ ...zaklad, regulated: regulatedFor(tarify, grid, 'cez', 'D02d', '3x25') });
  close(jeden.variants.fix.monthly[1], poRocich.variants.fix.monthly[1], 1e-9); // leden 2026 stejně
  assert.ok(Math.abs(jeden.variants.fix.monthly[0] - poRocich.variants.fix.monthly[0]) > 100, 'prosinec 2025 se liší');
});

/* ---------- výstup, upozornění a přelom roku ---------- */

const D = v.pripravData({
  ceny: cti('../data/prices.json'), kurzy: cti('../data/fx.json'), meta: cti('../data/meta.json'), tarify, dynamicky,
});
const vychozi = v.vychoziVstup(pravidla, tarify, dynamicky);

test('SPOT-09: spocitej bere regulované ceny po měsících a předpoklady ukazují ceny každého roku', () => {
  const tdd = v.tridaTdd(tarify, vychozi.sazba, vychozi.region);
  const vyp = v.spocitej(D, vychozi, cti(`../data/tdd/${tdd}.json`).values);
  const o = v.vystup(D, vyp, { tdd });
  const roky = [...new Set(vyp.res.months.map((m) => m.slice(0, 4)))];
  for (const m of vyp.res.months) assert.equal(vyp.regulated.byMonth[m].rok, Number(m.slice(0, 4)), m);
  const distribuce = o.predpoklady.find((p) => p.nazev.startsWith('Distribuce')).hodnota;
  if (roky.length > 1) for (const rok of roky) assert.ok(distribuce.includes(`${rok}:`), distribuce);
});

test('SPOT-09: upozornění – měsíce bez regulovaných cen a měsíce mimo rok ceníku dynamického tarifu', () => {
  const t = bezNbsp(v.upozorneniObdobi(['2025-11', '2025-12', '2026-01'], tarify, '2026-06-01'));
  // Ceny 2025 máme, takže o regulovaných cenách se nic nehlásí; ceník dynamického tarifu je jen 2026.
  assert.doesNotMatch(t, /regulovanými cenami roku/);
  assert.match(t, /Dynamický tarif počítáme s ceníkem/);
  assert.match(t, /listopad 2025 a prosinec 2025/);
  assert.match(t, /1\. 6\. 2026/);
  assert.equal(v.upozorneniObdobi(['2026-01', '2026-12'], tarify, '2026-06-01'), '');
  assert.deepEqual(v.mesiceBezCen(['2025-11', '2026-01', '2027-01'], tarify), ['2027-01']);
  const t27 = bezNbsp(v.upozorneniObdobi(['2026-12', '2027-01'], tarify, '2026-06-01'));
  assert.match(t27, /leden 2027/);
  assert.match(t27, /regulovan\S* cen\S* roku 2026/);
});

test('SPOT-09: po přelomu roku (týdenní aktualizace posune okno do roku bez cen) výpočet funguje s posledními známými cenami', () => {
  const grid = buildQuarterGrid('2026-02-01', '2027-01-31');
  const r = regulatedByMonth(tarify, grid, 'cez', 'D02d', '3x25');
  assert.equal(r.byMonth['2027-01'].rok, 2027);
  assert.equal(r.byMonth['2027-01'].rokCen, 2026);
  assert.equal(r.byMonth['2027-01'].presny, false);
  close(r.byMonth['2027-01'].vt, r.byMonth['2026-12'].vt);
  const cons = grid.map(() => 0.0001);
  const res = computeVariants({
    grid, cons, spotEur: grid.map(() => 50), fx: grid.map(() => 25), vat: 0.21, regulated: r,
    fix: { price: 3000, monthlyFee: 100 }, spot: { margin: 300, monthlyFee: 100 },
    dynamic: { base: 3000, pct: grid.map(() => 0), monthlyFee: 100 }, shiftPct: 10,
  });
  assert.equal(res.months.length, 12);
  for (const k of ['fix', 'spot', 'dynamic']) assert.ok(Number.isFinite(res.variants[k].total) && res.variants[k].total > 0, k);
  const text = bezNbsp(v.upozorneniObdobi(res.months, tarify, '2026-06-01'));
  assert.match(text, /leden 2027/);
  // A rok před nejstarší sadou: nejbližší známý rok (nejstarší).
  assert.equal(cenyProRok(tarify, 2024).rokCen, 2025);
});

test('SPOT-09: období dat v rules.json – každý měsíc má ceny svého roku, nebo je vyjmenovaný v upozornění', () => {
  const { od, do: konec } = pravidla.data;
  const grid = buildQuarterGrid(od, konec);
  const mesice = [...new Set(grid.map((q) => q.month))];
  const bez = v.mesiceBezCen(mesice, tarify);
  const text = bezNbsp(v.upozorneniObdobi(mesice, tarify, dynamicky.products[dynamicky.default].validFrom));
  for (const m of bez) assert.ok(text.includes(bezNbsp(v.nazevMesice(m))), m);
  // Nesíťová infrastruktura 2025 (poplatek ERÚ 4 Kč) platí od 1. 9. 2025; dřívější měsíce 2025 období neobsahuje.
  const platiOd = tarify.starsiRoky['2025'].common.nonNetworkInfra.platiOd;
  assert.equal(platiOd, '2025-09-01');
  for (const m of mesice.filter((x) => x.startsWith('2025'))) assert.ok(`${m}-01` >= platiOd, m);
});

test('SPOT-09: všechny sady mají stejnou DPH (výpočet počítá s jednou sazbou)', () => {
  for (const [rok, s] of Object.entries(tarify.starsiRoky)) assert.equal(s.vat.value, tarify.vat.value, rok);
});
