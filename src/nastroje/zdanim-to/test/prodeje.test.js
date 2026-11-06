// Kontrolní příklady prodejů (docs/zadani-zdanim-to.md). Pořadí výpočtu a hodnoty podle
// zdanim-to-overeni-2026.json (ověřeno 6. 11. 2026).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { osvobozeniProdeje, lhutaCasovehoTestu, zkontrolujProdej } from '../prodeje.js';

const rules = JSON.parse(fs.readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const cp = (nakup, prodej, prijem, naklady = 0) => ({ typ: 'cenny-papir', nakup, prodej, prijem, naklady });
const krypto = (nakup, prodej, prijem, naklady = 0, extra = {}) => ({ typ: 'kryptoaktivum', nakup, prodej, prijem, naklady, ...extra });
const emt = (nakup, prodej, prijem, naklady = 0) => ({ typ: 'emt', nakup, prodej, prijem, naklady });

test('nákup 1. 3. 2022, prodej 2. 3. 2025 → osvobozeno časovým testem', () => {
  const v = osvobozeniProdeje([cp('2022-03-01', '2025-03-02', 500000, 300000)], 2025, rules);
  assert.equal(v.polozky[0].stav, 'casovy');
  assert.equal(v.polozky[0].osvobozenoOd, '2025-03-02');
  assert.equal(v.zdanitelnyRozdil, 0);
});

test('prodej přesně po 3 letech (1. 3. 2025) časový test nesplní', () => {
  const v = osvobozeniProdeje([cp('2022-03-01', '2025-03-01', 500000, 300000)], 2025, rules);
  assert.equal(v.polozky[0].stav, 'zdanitelne');
  assert.equal(v.zdanitelnyRozdil, 200000);
});

test('lhůta od 29. 2. končí posledním dnem února', () => {
  assert.deepEqual(lhutaCasovehoTestu('2024-02-29', 3), { konec: '2027-02-28', osvobozenoOd: '2027-03-01' });
});

test('prodej po 2 letech, úhrn příjmů 80 000 Kč → osvobozeno hodnotovým testem', () => {
  const v = osvobozeniProdeje([cp('2023-06-01', '2025-06-10', 50000, 40000), cp('2023-07-01', '2025-07-10', 30000, 20000)], 2025, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['hodnotovy', 'hodnotovy']);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 80000);
  assert.equal(v.zdanitelnyRozdil, 0);
});

test('úhrn 150 000 Kč → zdanitelné, rozdíl a orientační daň', () => {
  const v = osvobozeniProdeje([cp('2023-06-01', '2025-06-10', 150000, 120000)], 2025, rules);
  assert.equal(v.polozky[0].stav, 'zdanitelne');
  assert.equal(v.zdanitelnyRozdil, 30000);
  assert.equal(v.orientacniDan, 30000 * rules.dane.sazba.hodnota);
});

test('krypto zvlášť od cenných papírů: 60 000 + 90 000 → obojí hodnotovým testem', () => {
  const v = osvobozeniProdeje([krypto('2025-01-10', '2026-02-01', 60000, 10000), cp('2025-01-10', '2026-03-01', 90000, 50000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['hodnotovy', 'hodnotovy']);
  assert.equal(v.uhrny.kryptoaktivum.uhrnProTest, 60000);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 90000);
});

test('krypto nad limit, cenné papíry pod ním → zdaní se jen krypto', () => {
  const v = osvobozeniProdeje([krypto('2025-01-10', '2026-02-01', 120000, 100000), cp('2025-01-10', '2026-03-01', 90000, 50000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['zdanitelne', 'hodnotovy']);
  assert.equal(v.uhrny.kryptoaktivum.zdanitelnyRozdil, 20000);
  assert.equal(v.zdanitelnyRozdil, 20000);
});

test('ukázka na stránce (rok 2026): ETF po 4 letech, akcie po 2 letech, krypto → zdaníš 20 000 Kč', () => {
  const v = osvobozeniProdeje([
    cp('2022-03-01', '2026-03-02', 60000, 40000),
    cp('2024-05-10', '2026-06-15', 120000, 100000),
    krypto('2025-01-20', '2026-09-01', 30000, 12000),
  ], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['casovy', 'zdanitelne', 'hodnotovy']);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 180000);
  assert.equal(v.zdanitelnyRozdil, 20000);
});

test('příjmy osvobozené časovým testem se do úhrnu počítají (podle rules); jde to přepnout', () => {
  const vstup = [cp('2020-01-01', '2026-02-01', 90000, 10000), cp('2025-01-01', '2026-03-01', 50000, 40000)];
  assert.equal(osvobozeniProdeje(vstup, 2026, rules).polozky[1].stav, 'zdanitelne');
  const r = structuredClone(rules);
  r.prodeje.hodnotovyTest.zahrnoutOsvobozeneCasovymTestem = false;
  assert.equal(osvobozeniProdeje(vstup, 2026, r).polozky[1].stav, 'hodnotovy');
});

test('zisk a ztráta stejného druhu se započtou, celkem nejméně 0', () => {
  const v = osvobozeniProdeje([cp('2025-01-01', '2026-02-01', 100000, 80000), cp('2025-01-01', '2026-03-01', 50000, 90000)], 2026, rules);
  assert.equal(v.zdanitelnyRozdil, 0);
  assert.ok(v.upozorneni.some((u) => u.id === 'ztraty'));
});

test('hodnotový test má přednost: prodej po 3 letech v úhrnu do 100 000 Kč → hodnotový', () => {
  const v = osvobozeniProdeje([cp('2020-01-01', '2026-02-01', 60000, 10000), cp('2025-01-01', '2026-03-01', 30000, 20000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['hodnotovy', 'hodnotovy']);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 90000);
});

test('úhrn nad limit kvůli prodeji po 3 letech → upozornění „nejasné“, že by bez něj prošel', () => {
  const v = osvobozeniProdeje([cp('2020-01-01', '2026-02-01', 90000, 10000), cp('2025-01-01', '2026-03-01', 50000, 40000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['casovy', 'zdanitelne']);
  const u = v.upozorneni.find((x) => x.id === 'uhrn-casovy');
  assert.equal(u.stav, 'nejasne');
  assert.equal(u.uhrn, 140000);
  assert.equal(u.uhrnBez, 50000);
  assert.equal(u.meniVysledek, true);
});

test('elektronický peněžní token do úhrnu 100 000 Kč nevstupuje a hodnotovým testem se neosvobodí', () => {
  const v = osvobozeniProdeje([emt('2025-01-01', '2026-02-01', 500000, 499000), krypto('2025-01-01', '2026-03-01', 50000, 20000)], 2026, rules);
  assert.equal(v.uhrny.kryptoaktivum.uhrnProTest, 50000);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['zdanitelne', 'hodnotovy']);
  assert.equal(v.uhrny.kryptoaktivum.zdanitelnyRozdil, 1000);
});

test('elektronický peněžní token po 3 letech → osvobozený časovým testem', () => {
  const v = osvobozeniProdeje([emt('2020-01-01', '2026-02-01', 5000, 4000)], 2026, rules);
  assert.equal(v.polozky[0].stav, 'casovy');
});

test('termínový prodej sjednaný do 3 let se časovým testem neosvobodí – krypto (zk) i cenné papíry (u)', () => {
  const v = osvobozeniProdeje([krypto('2020-01-01', '2026-02-01', 200000, 50000, { terminovy: true })], 2026, rules);
  assert.equal(v.polozky[0].stav, 'zdanitelne');
  assert.equal(v.zdanitelnyRozdil, 150000);
  const cpV = osvobozeniProdeje([{ ...cp('2020-01-01', '2026-02-01', 200000, 50000), terminovy: true }], 2026, rules);
  assert.equal(cpV.polozky[0].stav, 'zdanitelne');
  assert.equal(cpV.zdanitelnyRozdil, 150000);
});

test('elektronický peněžní token osvobozený časovým testem se počítá do limitu 40 mil. Kč (§ 4 odst. 3)', () => {
  const v = osvobozeniProdeje([emt('2020-01-01', '2026-02-01', 30000000, 30000000), krypto('2020-01-01', '2026-03-01', 20000000, 0)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['castecne', 'castecne']);
  assert.equal(v.uhrny.kryptoaktivum.limit40.uhrn, 50000000);
  assert.equal(v.zdanitelnyRozdil, 4000000);
});

test('krypto: časově osvobozené příjmy 50 mil. Kč → neosvobozeno 20 %, náklady kráceny stejně', () => {
  const v = osvobozeniProdeje([
    krypto('2020-01-01', '2026-02-01', 30000000, 6000000),
    krypto('2021-01-01', '2026-05-01', 20000000, 4000000),
  ], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['castecne', 'castecne']);
  assert.deepEqual(v.uhrny.kryptoaktivum.limit40, { uhrn: 50000000, limit: 40000000, pomer: 0.2 });
  assert.deepEqual(v.polozky[0].zdanitelnaCast, { pomer: 0.2, prijem: 6000000, naklady: 1200000, rozdil: 4800000 });
  assert.equal(v.zdanitelnyRozdil, 8000000);
  assert.equal(v.upozorneni.find((u) => u.id === 'krypto-40mil').stav, 'potvrzeno');
});

test('cenné papíry nad 40 mil. Kč: žádný horní limit', () => {
  const v = osvobozeniProdeje([cp('2020-01-01', '2026-02-01', 50000000, 10000000)], 2026, rules);
  assert.equal(v.polozky[0].stav, 'casovy');
  assert.equal(v.zdanitelnyRozdil, 0);
});

test('ztráta z krypta se neodečte od zisku z cenných papírů; záporný výsledek druhu = 0', () => {
  const v = osvobozeniProdeje([cp('2025-01-01', '2026-02-01', 150000, 100000), krypto('2025-01-01', '2026-03-01', 150000, 250000)], 2026, rules);
  assert.equal(v.uhrny['cenny-papir'].zdanitelnyRozdil, 50000);
  assert.equal(v.uhrny.kryptoaktivum.vysledek, -100000);
  assert.equal(v.uhrny.kryptoaktivum.zdanitelnyRozdil, 0);
  assert.equal(v.zdanitelnyRozdil, 50000);
  assert.ok(v.upozorneni.some((u) => u.id === 'ztraty' && u.druh === 'kryptoaktivum'));
});

test('osvobozený příjem nad 5 000 000 Kč → upozornění na oznámení (§ 38v), zdanitelný ne', () => {
  const v = osvobozeniProdeje([cp('2020-01-01', '2026-02-01', 6000000, 1000000), cp('2025-01-01', '2026-03-01', 7000000, 6000000)], 2026, rules);
  const u = v.upozorneni.find((x) => x.id === 'oznameni');
  assert.equal(u.stav, 'potvrzeno');
  assert.deepEqual(u.polozky, [{ index: 0, castka: 6000000 }]);
  const pod = osvobozeniProdeje([cp('2020-01-01', '2026-02-01', 5000000, 0)], 2026, rules);
  assert.ok(!pod.upozorneni.some((x) => x.id === 'oznameni'), 'přesně 5 000 000 Kč se neoznamuje');
});

test('krypto nad 40 mil. Kč: oznamuje se jen osvobozená část', () => {
  const v = osvobozeniProdeje([krypto('2020-01-01', '2026-02-01', 50000000, 0)], 2026, rules);
  assert.deepEqual(v.upozorneni.find((x) => x.id === 'oznameni').polozky, [{ index: 0, castka: 40000000 }]);
});

test('zdanitelné krypto → upozornění „nejasné“ na kód druhu v příloze č. 2', () => {
  const v = osvobozeniProdeje([krypto('2025-01-01', '2026-03-01', 150000, 100000)], 2026, rules);
  assert.equal(v.upozorneni.find((u) => u.id === 'kod-krypta-p2').stav, 'nejasne');
});

test('prodej mimo rok a neúplné řádky se nepočítají', () => {
  const v = osvobozeniProdeje([cp('2022-01-01', '2025-12-31', 500000), cp('', '2026-01-05', 1000), cp('2026-02-01', '2026-01-05', 1000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['mimo-rok', 'neuplne', 'neuplne']);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 0);
  assert.deepEqual(zkontrolujProdej(cp('2026-02-01', '2026-01-05', 1000), rules).map((c) => c.pole), ['prodej']);
});

test('pravidla odpovídají ověřovacímu souboru (6. 11. 2026)', () => {
  assert.equal(rules.meta.overeno, '2026-11-06');
  assert.equal(rules.prodeje.casovyTest.let, 3);
  assert.deepEqual(rules.prodeje.hodnotovyTest.limity, { 'cenny-papir': 100000, kryptoaktivum: 100000 });
  assert.equal(rules.prodeje.hodnotovyTest.spolecny, false);
  assert.equal(rules.prodeje.hodnotovyTest.zahrnuti.stav, 'nejasne');
  assert.deepEqual(rules.prodeje.limit40mil.limity, { 'cenny-papir': null, kryptoaktivum: 40000000 });
  assert.equal(rules.prodeje.krypto.ucinnostOd, '2025-02-15');
  assert.equal(rules.prodeje.typy.emt.hodnotovyTest, false);
  assert.ok(Object.values(rules.prodeje.typy).every((t) => t.terminovy === true), 'termínový prodej: § 4 odst. 1 písm. u) i zk)');
  assert.equal(rules.dane.sazba.hodnota, 0.15);
  assert.equal(rules.dane.sazba.zdroj.pravniZaklad, '§ 16 odst. 1 písm. a) ZDP');
  assert.equal(rules.prodeje.oznameni.limit, 5000000);
  assert.equal(rules.prodeje.oznameni.zdroj.pravniZaklad, '§ 38v odst. 1 ZDP');
  assert.equal(rules.prodeje.zapocteni.zapornyVysledekDruhu, 0);
  assert.equal(rules.prodeje.zapocteni.prevodZtraty, false);
});
