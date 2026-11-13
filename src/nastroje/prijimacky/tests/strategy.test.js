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

// ---------- Okrajové větve (PRI-05) ----------

test('očekávané body bez škol → žádné řádky ani varování', () => {
  const r = evaluateStrategy({ expected: 60, schools: [] });
  assert.deepEqual(r.schools, []);
  assert.deepEqual(r.warnings, []);
});

test('tři prázdné školy → „Chybí údaje“; dnešní chování: varování no-safe, ale ne missing-min (PRI-07 neopraven)', () => {
  const r = evaluateStrategy({ expected: 60, schools: [1, 2, 3].map(() => ({ name: '', lastMin: null })) });
  assert.deepEqual(r.schools.map((s) => s.category), ['nevim', 'nevim', 'nevim']);
  assert.deepEqual(r.schools.map((s) => s.name), ['Škola 1', 'Škola 2', 'Škola 3']);
  assert.deepEqual(r.warnings.map((w) => w.id), ['no-safe']);
});

test('hranice kategorií: rozdíl = rezerva → jistota, 0 → těsné, záporný → riziko; desetinné body', () => {
  const r = evaluateStrategy({ expected: 62.5, margin: 5, schools: [
    { name: 'A', lastMin: 57.5 }, { name: 'B', lastMin: 62.5 }, { name: 'C', lastMin: 62.6 }, { name: 'D', lastMin: 60 },
  ] });
  assert.deepEqual(r.schools.map((s) => s.category), ['jistota', 'tesne', 'riziko', 'tesne']);
  assert.equal(r.schools[3].diff, 2.5);
});

test('stejná škola dvakrát → varování duplicate (bez ohledu na velikost písmen)', () => {
  const r = evaluateStrategy({ expected: 70, schools: [{ name: 'Gympl', lastMin: 50 }, { name: 'gympl', lastMin: 50 }] });
  assert.ok(r.warnings.some((w) => w.id === 'duplicate'));
});
