// Kontrolní příklady prodejů (docs/zadani-zdanim-to.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { osvobozeniProdeje, lhutaCasovehoTestu, zkontrolujProdej } from '../prodeje.js';

const rules = JSON.parse(fs.readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const cp = (nakup, prodej, prijem, naklady = 0) => ({ typ: 'cenny-papir', nakup, prodej, prijem, naklady });
const krypto = (nakup, prodej, prijem, naklady = 0) => ({ typ: 'kryptoaktivum', nakup, prodej, prijem, naklady });

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

test('krypto nad 40 mil. Kč časově osvobozených příjmů → jen upozornění (sporné), výpočet beze změny', () => {
  const v = osvobozeniProdeje([krypto('2020-01-01', '2026-02-01', rules.prodeje.limit40mil.kryptoaktiva.hodnota + 1, 0)], 2026, rules);
  assert.equal(v.polozky[0].stav, 'casovy');
  assert.equal(v.zdanitelnyRozdil, 0);
  assert.equal(v.upozorneni[0].id, 'krypto-40mil');
  assert.equal(v.upozorneni[0].stav, 'sporne');
});

test('prodej mimo rok a neúplné řádky se nepočítají', () => {
  const v = osvobozeniProdeje([cp('2022-01-01', '2025-12-31', 500000), cp('', '2026-01-05', 1000), cp('2026-02-01', '2026-01-05', 1000)], 2026, rules);
  assert.deepEqual(v.polozky.map((p) => p.stav), ['mimo-rok', 'neuplne', 'neuplne']);
  assert.equal(v.uhrny['cenny-papir'].uhrnProTest, 0);
  assert.deepEqual(zkontrolujProdej(cp('2026-02-01', '2026-01-05', 1000)).map((c) => c.pole), ['prodej']);
});

test('pravidla: časový test 3 roky, limit 100 000 Kč, 40 mil. u cenných papírů zrušen, u krypta sporné', () => {
  assert.equal(rules.prodeje.casovyTest.let, 3);
  assert.equal(rules.prodeje.hodnotovyTest.limit, 100000);
  assert.equal(rules.prodeje.limit40mil.cennePapiry, null);
  assert.deepEqual(rules.prodeje.limit40mil.kryptoaktiva, { hodnota: 40000000, stav: 'sporne' });
});
