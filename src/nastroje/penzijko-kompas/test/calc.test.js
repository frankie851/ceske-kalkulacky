import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import {
  statniPrispevek,
  danovyOdpocet,
  podilAkcii,
  vynosFondu,
  projekce,
  srovnaniFondu,
  dopadPoplatku,
  transformovanyFond,
  doporuceni,
} from '../calc.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const rules = JSON.parse(readFileSync(join(root, 'rules.json'), 'utf8'));
const S2026 = rules.sady['2026'];
const N2027 = rules.sady.navrh2027;
const START = { rok: 2026, mesic: 11 };

function blizko(skutecne, ocekavane, tolerance) {
  const odchylka = Math.abs(skutecne - ocekavane) / ocekavane;
  assert.ok(odchylka <= tolerance, `${skutecne} se liší od ${ocekavane} o ${(odchylka * 100).toFixed(3)} %`);
}

// --- Povinné případy ze zadání ---------------------------------------------

test('věk 35, pravidla 2026, vklad 1 700 Kč → 340 Kč/měs, 4 080 Kč/rok', () => {
  const r = statniPrispevek(S2026, { vek: 35, vklad: 1700 });
  assert.equal(r.mesicne, 340);
  assert.equal(r.rocne, 4080);
});

test('věk 35, pravidla 2026, vklad 400 Kč → 0', () => {
  const r = statniPrispevek(S2026, { vek: 35, vklad: 400 });
  assert.equal(r.mesicne, 0);
  assert.equal(r.rocne, 0);
});

test('věk 25, návrh 2027, vklad 1 700 Kč → 680 Kč/měs, 8 160 Kč/rok', () => {
  const r = statniPrispevek(N2027, { vek: 25, vklad: 1700 });
  assert.equal(r.mesicne, 680);
  assert.equal(r.rocne, 8160);
});

test('věk 10, návrh 2027, vklad 100 Kč → 40 Kč/měs', () => {
  const r = statniPrispevek(N2027, { vek: 10, vklad: 100 });
  assert.equal(r.mesicne, 40);
});

test('věk 35, vklad 3 000 Kč/měs → odpočet 15 600 Kč/rok', () => {
  const r = danovyOdpocet(S2026, { vklad: 3000 });
  assert.equal(r.rocne, 15600);
});

test('zůstatek 100 000, výnos 0 %, poplatek 1 %, bez vkladů, 10 let → cca 90 438 Kč', () => {
  const r = projekce(rules, {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'konzervativni', parametry: { sprava: 1, zhodnoceni: 0, vynos: 0 },
    sada: '2026', mesicu: 120, start: START,
  });
  blizko(r.souhrn.nominal, 90438, 0.005);
});

// --- Státní příspěvek: hranice ---------------------------------------------

test('2026: hranice 500 Kč a pásmo 20 %', () => {
  assert.equal(statniPrispevek(S2026, { vek: 40, vklad: 499 }).mesicne, 0);
  assert.equal(statniPrispevek(S2026, { vek: 40, vklad: 500 }).mesicne, 100);
  assert.equal(statniPrispevek(S2026, { vek: 40, vklad: 1000 }).mesicne, 200);
  assert.equal(statniPrispevek(S2026, { vek: 40, vklad: 5000 }).mesicne, 340);
});

test('poživatel starobního důchodu nemá nárok', () => {
  assert.equal(statniPrispevek(S2026, { vek: 66, vklad: 1700, duchodce: true }).mesicne, 0);
  assert.equal(statniPrispevek(N2027, { vek: 66, vklad: 1700, duchodce: true }).mesicne, 0);
});

test('návrh 2027: 29 let má 40 %, 30 let už 20 %', () => {
  assert.equal(statniPrispevek(N2027, { vek: 29, vklad: 1000 }).mesicne, 400);
  assert.equal(statniPrispevek(N2027, { vek: 30, vklad: 1000 }).mesicne, 200);
  assert.equal(statniPrispevek(N2027, { vek: 30, vklad: 1700 }).mesicne, 340);
});

test('návrh 2027: dospělý pod 500 Kč nemá nárok, nezletilý pod 100 Kč také ne', () => {
  assert.equal(statniPrispevek(N2027, { vek: 20, vklad: 400 }).mesicne, 0);
  assert.equal(statniPrispevek(N2027, { vek: 17, vklad: 400 }).mesicne, 160);
  assert.equal(statniPrispevek(N2027, { vek: 10, vklad: 99 }).mesicne, 0);
});

// --- Daňový odpočet ----------------------------------------------------------

test('odpočet: do 1 700 Kč nic, strop 48 000 Kč, úspora 15 %', () => {
  assert.equal(danovyOdpocet(S2026, { vklad: 1700 }).rocne, 0);
  assert.equal(danovyOdpocet(S2026, { vklad: 5700 }).rocne, 48000);
  assert.equal(danovyOdpocet(S2026, { vklad: 10000 }).rocne, 48000);
  assert.equal(danovyOdpocet(S2026, { vklad: 3000 }).uspora, 2340);
});

// --- Životní cyklus ------------------------------------------------------------

test('životní cyklus: 100 % akcií do 45, lineárně na 20 % v 65', () => {
  const c = rules.fondy.zivotniCyklus.cyklus;
  assert.equal(podilAkcii(c, 30), 1);
  assert.equal(podilAkcii(c, 45), 1);
  blizko(podilAkcii(c, 55), 0.6, 1e-9);
  blizko(podilAkcii(c, 65), 0.2, 1e-9);
  blizko(podilAkcii(c, 70), 0.2, 1e-9);
  blizko(vynosFondu(rules.fondy.zivotniCyklus, 55), 0.6 * c.vynosAkcie + 0.4 * c.vynosDluhopisy, 1e-9);
  assert.equal(vynosFondu(rules.fondy.akciovy, 55), rules.fondy.akciovy.vynos);
});

// --- Projekce ------------------------------------------------------------------

test('projekce: vklady bez výnosu a poplatků se jen sčítají, státní příspěvek se připisuje', () => {
  const r = projekce(rules, {
    zustatek: 0, vklad: 1700, zamestnavatel: 300, vek: 35,
    fond: 'konzervativni', parametry: { sprava: 0, zhodnoceni: 0, vynos: 0 },
    sada: '2026', mesicu: 12, start: START,
  });
  assert.equal(r.souhrn.vlastni, 1700 * 12);
  assert.equal(r.souhrn.zamestnavatel, 300 * 12);
  assert.equal(r.souhrn.statni, 340 * 12);
  blizko(r.souhrn.nominal, (1700 + 300 + 340) * 12, 1e-9);
  assert.ok(r.souhrn.realne < r.souhrn.nominal, 'reálná hodnota je po inflaci nižší');
});

test('projekce: v návrhu 2027 se po 30. narozeninách příspěvek sníží', () => {
  const r = projekce(rules, {
    zustatek: 0, vklad: 1700, zamestnavatel: 0, vek: 29,
    fond: 'konzervativni', parametry: { sprava: 0, zhodnoceni: 0, vynos: 0 },
    sada: 'navrh2027', mesicu: 24, start: START,
  });
  assert.equal(r.souhrn.statni, 680 * 12 + 340 * 12);
});

test('projekce: poplatek ze zhodnocení jen z kladného ročního výnosu', () => {
  const zaklad = {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'vyvazeny', sada: '2026', mesicu: 12, start: START,
  };
  const bez = projekce(rules, { ...zaklad, parametry: { sprava: 0, zhodnoceni: 0, vynos: 5 } });
  const s = projekce(rules, { ...zaklad, parametry: { sprava: 0, zhodnoceni: 15, vynos: 5 } });
  blizko(bez.souhrn.nominal, 105000, 1e-9);
  blizko(s.souhrn.nominal, 100000 + 5000 * 0.85, 1e-9);
  const ztrata = projekce(rules, { ...zaklad, parametry: { sprava: 0, zhodnoceni: 15, vynos: -5 } });
  assert.equal(ztrata.souhrn.poplatkyZhodnoceni, 0);
});

test('projekce: strop poplatků z návrhu 2027 se uplatní', () => {
  const zaklad = {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'akciovy', parametry: { sprava: 1, zhodnoceni: 15, vynos: 0 },
    mesicu: 120, start: START,
  };
  const dnes = projekce(rules, { ...zaklad, sada: '2026' });
  const navrh = projekce(rules, { ...zaklad, sada: 'navrh2027' });
  blizko(navrh.souhrn.nominal, 100000 * Math.pow(1 - 0.005 / 12, 120), 1e-9);
  assert.ok(navrh.souhrn.nominal > dnes.souhrn.nominal);
});

// Revize 5. 11. 2026, PEN-01: konec transformovaných fondů 2036 je jen v návrhu (tisk 285).
// Původní test ho čekal i v sadě „Platná pravidla 2026“.
test('projekce: s platnými pravidly 2026 zůstává transformovaný fond až do konce', () => {
  const r = projekce(rules, {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'transformovany', sada: '2026', mesicu: 12 * 15, start: { rok: 2026, mesic: 1 },
  });
  assert.equal(r.mesicePoNastupci, 0);
  assert.equal(transformovanyFond(rules, { vek: 40, sada: '2026', fond: 'transformovany', zustatek: 100000, vklad: 0 }).konci, null);
});

test('projekce: podle návrhu 2027 transformovaný fond po roce 2036 přejde do konzervativního', () => {
  const r = projekce(rules, {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'transformovany', sada: 'navrh2027', mesicu: 12 * 15, start: { rok: 2026, mesic: 1 },
  });
  // 2026–2036 (11 let) v TF, 2037–2040 (4 roky) v konzervativním fondu
  assert.equal(r.mesicePoNastupci, 48);
  assert.equal(rules.sady.navrh2027.transformovaneFondy.konci, '2036-12-31');
  const tf = projekce(rules, {
    zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40,
    fond: 'transformovany', sada: 'navrh2027', mesicu: 12 * 15, start: { rok: 2026, mesic: 1 },
    parametry: { vynos: rules.fondy.transformovany.vynos }, bezNastupce: true,
  });
  assert.ok(r.souhrn.nominal > tf.souhrn.nominal, 'konzervativní fond má vyšší předpokládaný výnos');
});

test('projekce: řada po letech začíná dnešním věkem a končí v 65', () => {
  const r = projekce(rules, {
    zustatek: 10000, vklad: 1000, zamestnavatel: 0, vek: 60,
    fond: 'vyvazeny', sada: '2026', start: START,
  });
  assert.equal(r.rada[0].vek, 60);
  assert.equal(r.rada.at(-1).vek, 65);
  assert.equal(r.rada.length, 6);
});

test('projekce: kdo je v 65 a víc, nemá co projektovat', () => {
  const r = projekce(rules, { zustatek: 50000, vklad: 0, vek: 70, fond: 'vyvazeny', sada: '2026', start: START });
  assert.equal(r.souhrn.nominal, 50000);
  assert.equal(r.rada.length, 1);
});

// --- Srovnání, poplatky, TF, doporučení ----------------------------------------

const VSTUP = {
  vek: 35, vklad: 1000, zamestnavatel: 0, zustatek: 150000,
  fond: 'transformovany', poplatky: { sprava: 0.8, zhodnoceni: 10 },
  delkaSmlouvy: 3, duchodce: false, sada: '2026', start: START,
};

test('srovnání fondů vrací všech pět typů', () => {
  const s = srovnaniFondu(rules, VSTUP);
  assert.deepEqual(Object.keys(s).sort(), Object.keys(rules.fondy).sort());
  assert.ok(s.akciovy.souhrn.nominal > s.konzervativni.souhrn.nominal);
});

test('dopad poplatků: se stropem 0,5 % je v 65 víc peněz', () => {
  const d = dopadPoplatku(rules, { ...VSTUP, fond: 'akciovy', poplatky: { sprava: 1, zhodnoceni: 15 } });
  assert.ok(d.rozdilNominal > 0);
  assert.ok(d.rozdilRealne > 0);
  assert.ok(d.rozdilRealne < d.rozdilNominal);
});

test('transformovaný fond: srovnání a poplatek 800 Kč u konkurence do 5 let', () => {
  const t = transformovanyFond(rules, VSTUP);
  assert.ok(t.prejit.souhrn.realne > t.zustat.souhrn.realne);
  assert.equal(t.poplatekKonkurence, 800);
  assert.equal(transformovanyFond(rules, { ...VSTUP, delkaSmlouvy: 5 }).poplatekKonkurence, 0);
});

test('doporučení: max. 3 kroky, seřazené podle přínosu, všechny kladné', () => {
  const d = doporuceni(rules, VSTUP);
  assert.ok(d.length > 0 && d.length <= 3);
  for (let i = 1; i < d.length; i++) assert.ok(d[i - 1].prinos >= d[i].prinos);
  for (const k of d) assert.ok(k.prinos > 0);
  const id = d.map((k) => k.id);
  // Revize 5. 11. 2026, PEN-01/PEN-07: v transformovaném fondu (1,5 %) bez konce v roce 2036
  // se navýšení vkladu v dnešních penězích nevyplatí, krok se proto nenabízí.
  assert.ok(!id.includes('vklad'));
  assert.ok(id.includes('fond'));
  assert.ok(id.includes('zamestnavatel'));
  // V účastnickém fondu se navýšení na maximální státní příspěvek nabídne.
  const u = doporuceni(rules, { ...VSTUP, fond: 'zivotniCyklus', poplatky: { sprava: 1, zhodnoceni: 15 } }).map((k) => k.id);
  assert.ok(u.includes('vklad'));
});

test('doporučení: kdo už má vše nastavené, nedostane zbytečné kroky', () => {
  const d = doporuceni(rules, {
    ...VSTUP, vklad: 1700, zamestnavatel: 1000, fond: 'zivotniCyklus',
    poplatky: { sprava: 1, zhodnoceni: 15 },
  });
  assert.equal(d.length, 0);
});

// --- Žádná čísla natvrdo -----------------------------------------------------

test('calc.js neobsahuje natvrdo částky ani sazby z pravidel', () => {
  const zdroj = readFileSync(join(root, 'calc.js'), 'utf8').replace(/\/\/.*$|\/\*[\s\S]*?\*\//gm, '');
  for (const zakazane of ['340', '680', '1700', '48000', '500', '800', '2036', '0.2', '0.4', '0.15', '0.5']) {
    const re = new RegExp(`(?<![\\w.])${zakazane.replace('.', '\\.')}(?![\\w.])`);
    assert.ok(!re.test(zdroj), `calc.js obsahuje ${zakazane}`);
  }
});
