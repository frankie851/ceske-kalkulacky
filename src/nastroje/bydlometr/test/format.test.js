// Revize 5. 11. 2026, BYD-06: testy pro js/format.js. Formulář na webu čte čísla sdíleným
// prectiCislo (src/js/cislo-vstup.js), parseNumber zůstává pro výpočetní moduly a testy.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { parseNumber, formatCZK, formatDeltaCZK, formatPct, formatNumber, formatDate } from '../js/format.js';

const NBSP = /[\s  ]/g;
const bezMezer = (t) => t.replace(NBSP, ' ');

describe('parseNumber', () => {
  test('český zápis s mezerami, čárkou i tečkou', () => {
    assert.equal(parseNumber('3 500 000'), 3_500_000);
    assert.equal(parseNumber('3 500 000'), 3_500_000);
    assert.equal(parseNumber('4,94'), 4.94);
    assert.equal(parseNumber('4.94'), 4.94);
    assert.equal(parseNumber('1 500 000 Kč'), 1_500_000);
    assert.equal(parseNumber('22,5'), 22.5);
    assert.equal(parseNumber('1500,50'), 1500.5);
    assert.equal(parseNumber('5 %'), 5);
    assert.equal(parseNumber('-500000'), -500_000);
    assert.equal(parseNumber(42), 42);
  });

  test('nečitelné a prázdné → NaN', () => {
    for (const t of ['2.800.000', 'abc', '', '   ', '1,2,3', '--5', null, undefined, {}]) {
      assert.ok(Number.isNaN(parseNumber(t)), `${JSON.stringify(t)} → NaN`);
    }
  });
});

describe('formátování', () => {
  test('formatCZK zaokrouhlí na koruny', () => {
    assert.equal(bezMezer(formatCZK(20_337.4)), '20 337 Kč');
    assert.equal(bezMezer(formatCZK(0)), '0 Kč');
    assert.equal(formatCZK(NaN), '—');
    assert.equal(formatCZK(null), '—');
  });

  test('formatDeltaCZK se znaménkem', () => {
    assert.equal(bezMezer(formatDeltaCZK(1234)), '+1 234 Kč');
    assert.equal(bezMezer(formatDeltaCZK(-1234)), '−1 234 Kč');
    assert.equal(formatDeltaCZK(0.2), '0 Kč');
  });

  test('formatPct: podíl i procenta, desetinná místa', () => {
    assert.equal(bezMezer(formatPct(0.4)), '40 %');
    assert.equal(bezMezer(formatPct(0.8015, 1)), '80,2 %');
    assert.equal(bezMezer(formatPct(5.79, 2, false)), '5,79 %');
    assert.equal(formatPct(Infinity), '—');
  });

  test('formatNumber a formatDate', () => {
    assert.equal(bezMezer(formatNumber(1234.567, 1)), '1 234,6');
    assert.equal(formatDate('2026-10-07'), '7. 10. 2026');
    assert.equal(formatDate('zítra'), 'zítra');
  });
});
