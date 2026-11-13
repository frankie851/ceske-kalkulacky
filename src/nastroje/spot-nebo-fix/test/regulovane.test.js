// Revize 5. 11. 2026, střední nálezy SPOT-03, SPOT-06 a SPOT-07: regulované ceny 2026 a jejich zdroje.
// Očekávané hodnoty jsou opsané z cenového výměru ERÚ č. 14/2025 (Energetický regulační věstník 18/2025,
// https://eru.gov.cz/sites/default/files/obsah/prilohy/erv182025.pdf, část čtvrtá – sazby D), ne z tariffs.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildQuarterGrid, regulatedFor, pozeAnnual, sum } from '../calc.js';
import * as v from '../vystup.js';
import { kc } from '../../../js/format.js';

const cti = (p) => JSON.parse(readFileSync(new URL(p, import.meta.url), 'utf8'));
const tarify = cti('../tariffs.json');
const pravidla = cti('../rules.json');
const dynamicky = cti('../dynamic.json');
const close = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} ≠ ${b}`);
const grid = buildQuarterGrid('2026-01-05', '2026-01-05');

// Pásma jističe v CV 14/2025: „do 3x10 A a do 1x25 A včetně“, „nad 3x10 A do 3x16 A včetně“ … „nad 3x50 A do 3x63 A včetně“.
const JISTICE = ['1x25', '3x10', '3x16', '3x20', '3x25', '3x32', '3x40', '3x50', '3x63'];
const PASMO = { '1x25': 0, '3x10': 0, '3x16': 1, '3x20': 2, '3x25': 3, '3x32': 4, '3x40': 5, '3x50': 6, '3x63': 7 };

// CV 14/2025: [VT Kč/MWh, NT Kč/MWh | null, [8 pásem jističe Kč/měsíc]] bez DPH; strana PDF v komentáři.
const CV = {
  D02d: { // str. 32 (tištěná 31)
    cez: [2078.58, null, [102, 164, 205, 256, 327, 409, 512, 644]],
    egd: [2295.34, null, [100, 160, 200, 250, 320, 400, 500, 629]],
    pre: [1516.53, null, [87, 139, 173, 217, 277, 347, 434, 546]],
  },
  D56d: { // str. 42 (tištěná 41)
    cez: [754.77, 116.50, [222, 355, 444, 555, 710, 888, 1110, 1399]],
    egd: [749.87, 224.30, [190, 304, 380, 475, 608, 760, 950, 1196]],
    pre: [421.52, 175.20, [154, 246, 308, 385, 492, 616, 770, 970]],
  },
  D57d: { // str. 44 (tištěná 43)
    cez: [754.77, 116.50, [222, 355, 444, 555, 710, 896, 1289, 1949]],
    egd: [749.87, 224.30, [189, 302, 378, 473, 605, 764, 1098, 1619]],
    pre: [421.52, 175.20, [154, 246, 308, 385, 492, 622, 933, 1433]],
  },
  D61d: { // str. 46 (tištěná 45)
    cez: [3306.67, 116.50, [89, 143, 179, 224, 286, 358, 447, 563]],
    egd: [3367.23, 224.30, [90, 144, 179, 224, 287, 359, 449, 565]],
    pre: [2343.05, 175.20, [64, 103, 128, 161, 205, 257, 321, 404]],
  },
};
// ČEZ Distribuce, všechny sazby: VT, NT a jistič nad 3x20 A do 3x25 A (str. 30–46).
const CEZ = {
  D01d: [2666.66, null, 124], D02d: [2078.58, null, 256], D25d: [2252.45, 116.50, 269], D26d: [1202.06, 116.50, 362],
  D27d: [2252.45, 116.50, 255], D35d: [754.77, 116.50, 555], D45d: [754.77, 116.50, 555], D56d: [754.77, 116.50, 555],
  D57d: [754.77, 116.50, 555], D61d: [3306.67, 116.50, 224],
};
const STRANY = { D01d: 30, D02d: 32, D25d: 33, D26d: 34, D27d: 36, D35d: 38, D45d: 40, D56d: 42, D57d: 44, D61d: 46 };

test('SPOT-06: jističe 1× 25 A a 3× 10 A až 3× 63 A patří do pásem podle CV ERÚ 14/2025', () => {
  assert.deepEqual(tarify.breakers.map((b) => b.id), JISTICE);
  const pasma = Object.keys(tarify.distributors.cez.sazby.D02d.breaker);
  assert.equal(pasma.length, 8);
  for (const b of tarify.breakers) assert.equal(pasma.indexOf(b.tier), PASMO[b.id], b.id);
  const jistic = (id) => tarify.breakers.find((b) => b.id === id);
  assert.deepEqual([jistic('1x25').phases, jistic('1x25').amps], [1, 25]);
  assert.deepEqual([jistic('3x63').phases, jistic('3x63').amps], [3, 63]);
});

test('SPOT-06: cena za jistič a VT/NT v regulatedFor odpovídá CV ERÚ 14/2025 (D02d, D56d, D57d, D61d, tři distributoři)', () => {
  const infra = tarify.common.nonNetworkInfra.value;
  let pocet = 0;
  for (const [sazba, podleDistributora] of Object.entries(CV)) {
    for (const [d, [vt, nt, jistice]] of Object.entries(podleDistributora)) {
      for (const id of JISTICE) {
        const r = regulatedFor(tarify, grid, d, sazba, id);
        close(r.monthly, jistice[PASMO[id]] + infra);
        close(r.vt, vt);
        close(r.nt, nt ?? vt);
        assert.equal(r.ntMask === null, nt === null, `${d} ${sazba}: maska NT`);
        pocet++;
      }
    }
  }
  assert.equal(pocet, 4 * 3 * 9);
});

test('SPOT-06: ČEZ Distribuce – VT, NT a jistič 3× 25 A pro všech deset sazeb podle CV ERÚ 14/2025', () => {
  assert.deepEqual(Object.keys(tarify.sazbyInfo), Object.keys(CEZ));
  for (const [sazba, [vt, nt, jistic]] of Object.entries(CEZ)) {
    const r = regulatedFor(tarify, grid, 'cez', sazba, '3x25');
    close(r.vt, vt);
    close(r.nt, nt ?? vt);
    close(r.monthly, jistic + tarify.common.nonNetworkInfra.value);
  }
});

test('SPOT-07: zdrojem distribuce je CV ERÚ 14/2025 se stranou PDF a datem ověření', () => {
  const datumIso = /^\d{4}-\d{2}-\d{2}$/;
  for (const [d, dist] of Object.entries(tarify.distributors)) {
    const z = dist.source;
    assert.match(z.pravniZaklad, /cenový výměr ERÚ č\. 14\/2025/i, d);
    assert.match(z.url, /^https:\/\/eru\.gov\.cz\/.*erv182025\.pdf#page=\d+$/, d);
    assert.match(z.overeno, datumIso, d);
    assert.equal(z.year, 2026, d);
    // Citace obsahuje hodnoty, které jsou v datech (VT D02d a jistič 3× 25 A D02d).
    const fmt = (n) => n.toLocaleString('cs-CZ', { minimumFractionDigits: 2 }).replace(/\s/g, ' ');
    assert.ok(z.citace.includes(fmt(dist.sazby.D02d.vt)), `${d}: citace bez VT D02d`);
    assert.ok(z.citace.includes(String(dist.sazby.D02d.breaker['3x25'])), `${d}: citace bez jističe`);
    assert.deepEqual(z.stranyPdf, STRANY, d);
    // Ceník dodavatele zůstává jen jako kontrolní zdroj.
    assert.match(dist.kontrolniZdroj.url, /cez\.cz/, d);
  }
  assert.ok(pravidla.meta.zdroje.some((z) => /erv182025\.pdf/.test(z.url) && /14\/2025/.test(z.nazev)), 'rules.json meta.zdroje');
  assert.equal(pravidla.meta.overeno, '2026-11-12');
});

test('SPOT-03: tariffs.json nese datum ověření regulovaných cen a citaci nulového POZE', () => {
  assert.match(tarify.overeno, /^\d{4}-\d{2}-\d{2}$/);
  const poze = tarify.common.poze;
  assert.equal(poze.perAmpPhase, 0);
  assert.equal(poze.perMWh, 495);
  const zdroje = poze.zdroj.map((z) => z.url).join(' ');
  assert.match(zdroje, /erv192025\.pdf#page=1/); // CV ERÚ 15/2025: 8,32 → 0 Kč/A/měsíc
  assert.match(zdroje, /2012-165#p28a/); // zákon 165/2012 Sb. § 28a odst. 2: strop 495 Kč/MWh
  for (const z of poze.zdroj) { assert.ok(z.pravniZaklad && z.citace); assert.match(z.overeno, /^\d{4}-\d{2}-\d{2}$/); }
  assert.match(poze.vysvetleniNuly, /15\/2025/);
});

// Předpoklady výpočtu: řádek POZE musí ukazovat to, co se opravdu účtuje.
const D = v.pripravData({
  ceny: cti('../data/prices.json'), kurzy: cti('../data/fx.json'), meta: cti('../data/meta.json'), tarify, dynamicky,
});
const vychozi = v.vychoziVstup(pravidla, tarify, dynamicky);
const radekPoze = (o) => o.predpoklady.find((p) => /POZE/.test(p.nazev)).hodnota;

test('SPOT-03: v předpokladech je POZE 0 Kč s vysvětlením, ne 0,60 Kč/kWh', () => {
  const tdd = v.tridaTdd(tarify, vychozi.sazba, vychozi.region);
  const vyp = v.spocitej(D, vychozi, cti(`../data/tdd/${tdd}.json`).values);
  const o = v.vystup(D, vyp, { tdd });
  const radek = radekPoze(o);
  assert.match(radek, /^0\sKč – /);
  assert.doesNotMatch(radek, /Kč\/kWh/);
  assert.ok(radek.includes(tarify.common.poze.vysvetleniNuly), radek);
});

test('SPOT-03: kdyby POZE podle jističe nebylo nulové, předpoklady ukážou účtovanou roční částku', () => {
  const t = structuredClone(tarify);
  t.common.poze.perAmpPhase = 8.32; // CV 13/2025 bod (5.1.2) před změnou CV 15/2025
  const D2 = { ...D, tarify: t };
  for (const mwh of [3, 20]) {
    const vstup = { ...vychozi, mwh };
    const tdd = v.tridaTdd(t, vstup.sazba, vstup.region);
    const vyp = v.spocitej(D2, vstup, cti(`../data/tdd/${tdd}.json`).values);
    const o = v.vystup(D2, vyp, { tdd });
    const rocne = pozeAnnual(sum(vyp.cons), vyp.regulated.poze, vyp.res.months.length) * (1 + t.vat.value);
    assert.ok(rocne > 0);
    assert.equal(radekPoze(o), `${kc(rocne)} za rok`);
  }
});
