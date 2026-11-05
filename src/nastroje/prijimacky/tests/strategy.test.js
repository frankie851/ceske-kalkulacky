import { test } from 'node:test';
import assert from 'node:assert/strict';
import { evaluateStrategy } from '../strategy.js';

test('žádná jistota → varování', () => {
  const r = evaluateStrategy({ expected: 60, schools: [
    { name: 'Gympl', lastMin: 75 }, { name: 'Průmyslovka', lastMin: 62 }, { name: 'Obchodka', lastMin: 58 },
  ] });
  assert.deepEqual(r.schools.map(s => s.category), ['riziko', 'riziko', 'tesne']);
  assert.ok(r.warnings.some(w => w.id === 'no-safe'));
});

test('jistota na 3. místě → bez varování no-safe', () => {
  const r = evaluateStrategy({ expected: 70, schools: [
    { name: 'A', lastMin: 80 }, { name: 'B', lastMin: 68 }, { name: 'C', lastMin: 50 },
  ] });
  assert.equal(r.schools[2].category, 'jistota');
  assert.ok(!r.warnings.some(w => w.id === 'no-safe'));
});

test('chybějící údaje → kategorie nevim a upozornění', () => {
  const r = evaluateStrategy({ expected: null, schools: [{ name: 'A', lastMin: 50 }, { name: '', lastMin: null }] });
  assert.equal(r.schools[0].category, 'nevim');
  assert.ok(r.warnings.some(w => w.id === 'missing-expected'));
});

test('vlastní rezerva', () => {
  const r = evaluateStrategy({ expected: 60, margin: 10, schools: [{ name: 'A', lastMin: 52 }] });
  assert.equal(r.schools[0].category, 'tesne');
});
