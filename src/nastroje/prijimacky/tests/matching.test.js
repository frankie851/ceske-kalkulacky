import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bestOfTwo, scoreOf, rankApplicants, deferredAcceptance, explain, TieError } from '../matching.js';

const AB = [{ id: 'A', name: 'A', capacity: 1 }, { id: 'B', name: 'B', capacity: 1 }];

test('X 90 (A,B), Y 80 (A,B) → X do A, Y do B', () => {
  const r = deferredAcceptance([
    { id: 'X', score: 90, priorities: ['A', 'B'] },
    { id: 'Y', score: 80, priorities: ['A', 'B'] },
  ], AB);
  assert.deepEqual(r.assignment, { X: 'A', Y: 'B' });
});

test('X 90 (B,A), Y 80 (A,B) → X do B, Y do A', () => {
  const r = deferredAcceptance([
    { id: 'X', score: 90, priorities: ['B', 'A'] },
    { id: 'Y', score: 80, priorities: ['A', 'B'] },
  ], AB);
  assert.deepEqual(r.assignment, { X: 'B', Y: 'A' });
});

test('X 90 (B,A), Z 85 (B,A), Y 80 (A) → X do B, Z do A, Y nepřijat', () => {
  const r = deferredAcceptance([
    { id: 'X', score: 90, priorities: ['B', 'A'] },
    { id: 'Z', score: 85, priorities: ['B', 'A'] },
    { id: 'Y', score: 80, priorities: ['A'] },
  ], AB);
  assert.deepEqual(r.assignment, { X: 'B', Z: 'A', Y: null });
  const why = explain(r, [
    { id: 'X', score: 90, priorities: ['B', 'A'] },
    { id: 'Z', score: 85, priorities: ['B', 'A'] },
    { id: 'Y', name: 'Y', score: 80, priorities: ['A'] },
  ], AB);
  assert.match(why.Y.join(' '), /Z/);
});

test('čeština 30 a 35, matematika 28 a 20 → 35 + 28 = 63', () => {
  assert.equal(bestOfTwo({ cj: [30, 35], m: [28, 20] }), 63);
  assert.equal(scoreOf({ attempts: { cj: [30, 35], m: [28, 20] } }), 63);
});

test('bestOfTwo: chybějící pokus (např. nemoc) se ignoruje', () => {
  assert.equal(bestOfTwo({ cj: [null, 40], m: [25, undefined] }), 65);
  assert.equal(bestOfTwo({ cj: [], m: [] }), 0);
});

function permutations(arr) {
  if (arr.length <= 1) return [arr];
  return arr.flatMap((x, i) => permutations([...arr.slice(0, i), ...arr.slice(i + 1)]).map(p => [x, ...p]));
}

const CLASS = [
  { id: 'a', score: 88, priorities: ['G', 'S', 'P'] },
  { id: 'b', score: 92, priorities: ['S', 'G'] },
  { id: 'c', score: 70, priorities: ['G', 'P', 'S'] },
  { id: 'd', score: 75, priorities: ['G', 'S', 'P'] },
  { id: 'e', score: 60, priorities: ['S', 'P'] },
  { id: 'f', score: 81, priorities: ['P', 'G'] },
];
const SCHOOLS = [
  { id: 'G', capacity: 2 }, { id: 'S', capacity: 1 }, { id: 'P', capacity: 2 },
];

test('výsledek nezávisí na pořadí zadání uchazečů ani škol', () => {
  const ref = deferredAcceptance(CLASS, SCHOOLS);
  for (const perm of permutations(CLASS)) {
    const r = deferredAcceptance(perm, [...SCHOOLS].reverse());
    assert.deepEqual(r.assignment, ref.assignment);
    assert.deepEqual(r.rounds.length, ref.rounds.length);
  }
});

test('výsledek je stabilní: nikdo s horším pořadím nepřeskočí lepšího', () => {
  const r = deferredAcceptance(CLASS, SCHOOLS);
  const byId = Object.fromEntries(CLASS.map(a => [a.id, a]));
  for (const a of CLASS) {
    const got = r.assignment[a.id];
    const better = got === null ? a.priorities : a.priorities.slice(0, a.priorities.indexOf(got));
    for (const s of better) {
      const held = r.schools[s];
      const cap = SCHOOLS.find(x => x.id === s).capacity;
      assert.equal(held.length, cap, `${s} by měla být plná, když ji ${a.id} chtěl víc`);
      for (const h of held) assert.ok(byId[h].score > a.score, `${h} na ${s} má horší pořadí než ${a.id}`);
    }
  }
});

test('kapacita se nikdy nepřekročí a každý je nejvýš na jedné škole', () => {
  const r = deferredAcceptance(CLASS, SCHOOLS);
  for (const s of SCHOOLS) assert.ok(r.schools[s.id].length <= s.capacity);
  const all = Object.values(r.schools).flat();
  assert.equal(new Set(all).size, all.length);
});

test('shoda bodů bez rozhodovacího kritéria → chyba (škola musí určit jednoznačné pořadí)', () => {
  assert.throws(() => deferredAcceptance([
    { id: 'P', score: 80, priorities: ['A'] },
    { id: 'Q', score: 80, priorities: ['A'] },
  ], AB), TieError);
});

test('shoda bodů s rozhodovacím kritériem (tiebreak) se rozhodne', () => {
  const r = deferredAcceptance([
    { id: 'P', score: 80, tiebreak: 2, priorities: ['A'] },
    { id: 'Q', score: 80, tiebreak: 5, priorities: ['A'] },
  ], AB);
  assert.deepEqual(r.assignment, { P: null, Q: 'A' });
});

test('rankApplicants řadí sestupně podle bodů', () => {
  const ranked = rankApplicants([{ id: 'x', score: 10 }, { id: 'y', score: 30 }, { id: 'z', score: 20 }]);
  assert.deepEqual(ranked.map(a => a.id), ['y', 'z', 'x']);
});

test('neznámá škola nebo duplicitní priorita se přeskočí', () => {
  const r = deferredAcceptance([{ id: 'X', score: 50, priorities: ['NEEX', 'A', 'A'] }], AB);
  assert.deepEqual(r.assignment, { X: 'A' });
});

test('kroky: první kolo = všichni na 1. prioritu', () => {
  const r = deferredAcceptance([
    { id: 'X', score: 90, priorities: ['B', 'A'] },
    { id: 'Z', score: 85, priorities: ['B', 'A'] },
    { id: 'Y', score: 80, priorities: ['A'] },
  ], AB);
  const first = r.rounds[0];
  assert.deepEqual(first.proposals.map(p => [p.applicant, p.school, p.priority]).sort(),
    [['X', 'B', 1], ['Y', 'A', 1], ['Z', 'B', 1]]);
  assert.deepEqual(first.rejected.map(x => x.applicant), ['Z']);
  // 2. kolo: Z se hlásí na A a vytlačí Y; Y už další prioritu nemá → konec
  assert.equal(r.rounds.length, 2);
  assert.deepEqual(r.rounds[1].proposals.map(p => [p.applicant, p.school, p.priority]), [['Z', 'A', 2]]);
  assert.deepEqual(r.rounds[1].rejected.map(x => [x.applicant, x.displacedBy]), [['Y', 'Z']]);
});

// ---------- Okrajové větve (PRI-05, revize 5. 11. 2026; případy V1–V19 z přepočtu revize) ----------

test('kapacita 0: X 90 (A, B), A 0 míst, B 1 → X do B; explain: škola nemá žádné volné místo', () => {
  const skoly = [{ id: 'A', name: 'A', capacity: 0 }, { id: 'B', name: 'B', capacity: 1 }];
  const deti = [{ id: 'X', name: 'X', score: 90, priorities: ['A', 'B'] }];
  const r = deferredAcceptance(deti, skoly);
  assert.deepEqual(r.assignment, { X: 'B' });
  assert.deepEqual(r.schools.A, []);
  assert.deepEqual(r.rounds[0].rejected, [{ applicant: 'X', school: 'A', reason: 'kapacita', displacedBy: null }]);
  const why = explain(r, deti, skoly);
  assert.match(why.X[0], /1\. priorita A: škola nemá žádné volné místo/);
  assert.match(why.X.at(-1), /2\. prioritu: B/);
});

test('minScore: A minimum 60; P 59 b. (A, B), Q 60 b. (A) → P do B, Q do A; důvod „kriteria“', () => {
  const skoly = [{ id: 'A', name: 'A', capacity: 1, minScore: 60 }, { id: 'B', name: 'B', capacity: 1 }];
  const deti = [
    { id: 'P', name: 'P', score: 59, priorities: ['A', 'B'] },
    { id: 'Q', name: 'Q', score: 60, priorities: ['A'] },
  ];
  const r = deferredAcceptance(deti, skoly);
  assert.deepEqual(r.assignment, { P: 'B', Q: 'A' });
  assert.deepEqual(r.rounds[0].rejected, [{ applicant: 'P', school: 'A', reason: 'kriteria' }]);
  const why = explain(r, deti, skoly);
  assert.match(why.P[0], /minimum 60 b\., má 59 b\./);
  assert.ok(!why.Q.some((t) => /kritéria/.test(t)), 'Q minimum splnil (60 = 60)');
});

test('minScore platí i pro uchazeče s jedinou prioritou: pod minimem → nepřijat, i když je místo volné', () => {
  const skoly = [{ id: 'A', name: 'A', capacity: 3, minScore: 40 }];
  const r = deferredAcceptance([{ id: 'P', score: 39.5, priorities: ['A'] }], skoly);
  assert.deepEqual(r.assignment, { P: null });
});

test('uchazeč bez priorit → nepřijat, nikam se nehlásí; explain: nemá zadanou žádnou školu', () => {
  const deti = [{ id: 'X', name: 'X', score: 90, priorities: [] }, { id: 'Y', name: 'Y', score: 80, priorities: ['A'] }];
  const r = deferredAcceptance(deti, AB);
  assert.deepEqual(r.assignment, { X: null, Y: 'A' });
  assert.ok(r.rounds.every((rd) => rd.proposals.every((p) => p.applicant !== 'X')));
  assert.deepEqual(explain(r, deti, AB).X, ['Nemá zadanou žádnou školu.']);
});

test('uchazeč jen s prázdnými prioritami ("", neznámá škola) → nepřijat', () => {
  const r = deferredAcceptance([{ id: 'X', score: 90, priorities: ['', '', 'NEEX'] }], AB);
  assert.deepEqual(r.assignment, { X: null });
  assert.equal(r.rounds.length, 0);
});

test('škola bez uchazečů → prázdné přiřazení školy; prázdný vstup → žádná kola', () => {
  const r = deferredAcceptance([{ id: 'X', score: 50, priorities: ['A'] }], AB);
  assert.deepEqual(r.schools.B, []);
  const prazdne = deferredAcceptance([], AB);
  assert.deepEqual(prazdne.assignment, {});
  assert.deepEqual(prazdne.rounds, []);
  assert.deepEqual(prazdne.schools, { A: [], B: [] });
});

test('rankApplicants: shoda bodů bez kritéria → TieError i bez deferredAcceptance', () => {
  assert.throws(() => rankApplicants([{ id: 'p', score: 70 }, { id: 'q', score: 70 }]), TieError);
  assert.throws(() => rankApplicants([{ id: 'p', score: 70, tiebreak: 1 }, { id: 'q', score: 70, tiebreak: 1 }]), TieError);
});

test('řetězové vytlačení přes 3 školy: P→A, Q→B, R→C, S nepřijat', () => {
  const skoly = [{ id: 'A', capacity: 1 }, { id: 'B', capacity: 1 }, { id: 'C', capacity: 1 }];
  const r = deferredAcceptance([
    { id: 'P', score: 90, priorities: ['A'] },
    { id: 'Q', score: 80, priorities: ['A', 'B'] },
    { id: 'R', score: 70, priorities: ['B', 'C'] },
    { id: 'S', score: 60, priorities: ['C'] },
  ], skoly);
  assert.deepEqual(r.assignment, { P: 'A', Q: 'B', R: 'C', S: null });
  assert.equal(r.rounds.length, 3);
  assert.deepEqual(r.rounds.map((rd) => rd.rejected.map((x) => x.applicant)), [['Q'], ['R'], ['S']]);
});
