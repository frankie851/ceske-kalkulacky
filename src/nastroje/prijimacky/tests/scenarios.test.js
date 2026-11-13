import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { deferredAcceptance } from '../matching.js';
import { SCENARIOS, EXPECTED } from '../scenarios.js';

for (const sc of SCENARIOS) {
  test(`scénář „${sc.title}“ dává očekávaný výsledek`, () => {
    const r = deferredAcceptance(sc.applicants, sc.schools);
    assert.deepEqual(r.assignment, EXPECTED[sc.id]);
    const r2 = deferredAcceptance([...sc.applicants].reverse(), sc.schools);
    assert.deepEqual(r2.assignment, EXPECTED[sc.id]);
  });
}

test('rules.json: každá událost a pravidlo má existující zdroj a platné datum', () => {
  const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
  for (const item of [...rules.events, ...rules.rules]) {
    assert.ok(rules.sources[item.source], `${item.id}: chybí zdroj ${item.source}`);
  }
  for (const e of rules.events) assert.ok(['confirmed', 'unverified', 'tip'].includes(e.status), e.id);
  // PRI-09: pravidlo může být „derived“ (plyne z úředního harmonogramu), ale musí mít poznámku a stav v legendě.
  for (const r of rules.rules) {
    assert.ok(['confirmed', 'unverified', 'tip', 'derived'].includes(r.status), r.id);
    if (r.status === 'derived') assert.ok(r.note && rules.meta.statusLegend.derived, `${r.id}: odvozené pravidlo musí mít poznámku`);
  }
  for (const e of rules.events) {
    assert.match(e.start, /^\d{4}-\d{2}-\d{2}$/);
    if (e.end) assert.ok(e.end >= e.start, e.id);
    if (e.status !== 'confirmed') assert.ok(e.note, `${e.id}: neověřená událost musí mít poznámku`);
  }
});
