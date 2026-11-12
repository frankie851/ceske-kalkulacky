// Čtení čísel z formulářů v českém zápisu. Revize 5. 11. 2026: PEN-02, VYP-03, INF-03,
// EET-04, EET-14, DLU-04, SPOT-08 a „Zpracování čísel ve formulářích“ v části 3 souhrnu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { prectiCislo } from '../../src/js/cislo-vstup.js';

test('tisíce oddělené mezerou, pevnou mezerou nebo tečkou', () => {
  assert.equal(prectiCislo('40 000'), 40000);
  assert.equal(prectiCislo('40 000'), 40000);
  assert.equal(prectiCislo('40 000'), 40000);
  assert.equal(prectiCislo('40.000'), 40000);
  assert.equal(prectiCislo('1.234.567'), 1234567);
  assert.equal(prectiCislo('1.500'), 1500);
  assert.equal(prectiCislo('1.234.567,5'), 1234567.5);
});

test('desetinná čárka i tečka', () => {
  assert.equal(prectiCislo('1500,50'), 1500.5);
  assert.equal(prectiCislo('0,85'), 0.85);
  assert.equal(prectiCislo('1,5'), 1.5);
  assert.equal(prectiCislo('1.5'), 1.5);
  assert.equal(prectiCislo('0.850'), 0.85);
  assert.equal(prectiCislo('12.50'), 12.5);
});

test('prázdné → null, nesmysl → NaN', () => {
  assert.equal(prectiCislo(''), null);
  assert.equal(prectiCislo('   '), null);
  assert.equal(prectiCislo(undefined), null);
  for (const t of ['abc', '1e6', '1,2,3', '40.00.0', '12-3', '--5', ',', '.']) assert.ok(Number.isNaN(prectiCislo(t)), t);
});

test('měna na konci se ignoruje', () => {
  assert.equal(prectiCislo('23 000 Kč'), 23000);
  assert.equal(prectiCislo('23.000kč'), 23000);
});

test('znaménko: záporné číslo jen když ho pole dovolí', () => {
  assert.equal(prectiCislo('-5'), -5);
  assert.equal(prectiCislo('+5'), 5);
  assert.ok(Number.isNaN(prectiCislo('-5', { zaporne: false })));
  assert.equal(prectiCislo('-1.500'), -1500);
});
