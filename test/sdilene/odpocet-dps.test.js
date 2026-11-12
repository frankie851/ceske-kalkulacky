// Odpočet příspěvků na penzijní spoření po měsících (§ 15 odst. 7 ZDP).
// Revize 5. 11. 2026: P48-01, SLV-05 a nesoulad mezi nástroji (SOUHRN, část 3).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { odpocitatelnaCastDps, rovnomerne } from '../../src/js/odpocet-dps.js';

const H = 1700;
const profil = (pravidelny, prosinecNavic = 0) => [...Array(11).fill(pravidelny), pravidelny + prosinecNavic];

test('11 × 1 000 Kč + prosinec 30 000 Kč → 28 300 Kč', () => {
  assert.equal(odpocitatelnaCastDps([...Array(11).fill(1000), 30000], H), 28300);
});

test('11 × 0 + prosinec 48 000 Kč → 46 300 Kč', () => {
  assert.equal(odpocitatelnaCastDps(profil(0, 48000), H), 46300);
});

test('11 × 1 000 Kč + prosinec 31 000 Kč → 29 300 Kč', () => {
  assert.equal(odpocitatelnaCastDps([...Array(11).fill(1000), 31000], H), 29300);
});

test('3 000 Kč jen 6 měsíců → 7 800 Kč', () => {
  assert.equal(odpocitatelnaCastDps([...Array(6).fill(3000), ...Array(6).fill(0)], H), 7800);
});

test('rovnoměrné vklady dávají totéž jako dřív roční odečet 20 400 Kč', () => {
  assert.equal(odpocitatelnaCastDps(rovnomerne(24000), H), 3600);
  assert.equal(odpocitatelnaCastDps(rovnomerne(12 * 5700), H), 48000);
  assert.equal(odpocitatelnaCastDps(rovnomerne(12 * 1700), H), 0);
});

test('hranice 0 (starobní důchodce) → od první koruny', () => {
  assert.equal(odpocitatelnaCastDps(rovnomerne(12000), 0), 12000);
});

test('neplatné a záporné vklady se počítají jako 0', () => {
  assert.equal(odpocitatelnaCastDps([NaN, -5, undefined, '2000'], H), 300);
  assert.equal(rovnomerne(0).length, 12);
});
