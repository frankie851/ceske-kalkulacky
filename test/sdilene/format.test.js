import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kc, cislo, procenta, datum, NBSP } from '../../src/js/format.js';

const n = (s) => s.replace(/ /g, NBSP);

test('cislo: oddělovač tisíců je pevná mezera', () => {
  assert.equal(cislo(45600), n('45 600'));
  assert.equal(cislo(1234567), n('1 234 567'));
  assert.equal(cislo(999), '999');
  assert.equal(cislo(0), '0');
  assert.ok(!/[  ]/.test(cislo(1234567)), 'žádná obyčejná ani úzká mezera');
});

test('cislo: desetinná čárka a zaokrouhlení', () => {
  assert.equal(cislo(0.5, 1), '0,5');
  assert.equal(cislo(1234.567, 2), n('1 234,57'));
  assert.equal(cislo(2.5), '3');
  assert.equal(cislo(-0), '0');
});

test('cislo: záporná čísla a neplatné vstupy', () => {
  assert.equal(cislo(-1500), n('-1 500'));
  assert.equal(cislo(NaN), '–');
  assert.equal(cislo(undefined), '–');
  assert.equal(cislo(null), '–');
  assert.equal(cislo('abc'), '–');
  assert.equal(cislo('45600'), n('45 600'));
});

test('kc: částka s pevnými mezerami i před Kč', () => {
  assert.equal(kc(45600), n('45 600 Kč'));
  assert.equal(kc(6840), n('6 840 Kč'));
  assert.equal(kc(0), n('0 Kč'));
  assert.equal(kc(340.5, 2), n('340,50 Kč'));
  assert.equal(kc(NaN), '–');
  assert.ok(!kc(48000).includes(' '));
});

test('procenta: vstup v procentech', () => {
  assert.equal(procenta(15), n('15 %'));
  assert.equal(procenta(0.5, 1), n('0,5 %'));
  assert.equal(procenta(40), n('40 %'));
});

test('datum: ISO → český zápis s pevnými mezerami', () => {
  assert.equal(datum('2026-11-04'), n('4. 11. 2026'));
  assert.equal(datum('2027-01-01'), n('1. 1. 2027'));
  assert.equal(datum('2026-12-31T10:00:00Z'), n('31. 12. 2026'));
  assert.equal(datum(new Date(Date.UTC(2026, 10, 4))), n('4. 11. 2026'));
  assert.equal(datum(''), '');
  assert.equal(datum('4. 11. 2026'), '');
  assert.equal(datum(null), '');
});
