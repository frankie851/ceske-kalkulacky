import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rules, defaults } from './helpers.js';
import { collectItems } from '../js/data.js';

const ISO = /^\d{4}-\d{2}-\d{2}$/;

for (const [name, json] of [['rules.json', rules], ['defaults.json', defaults]]) {
  test(`${name}: každá položka má hodnotu, zdroj a datum`, () => {
    const items = collectItems(json);
    assert.ok(items.length > 10, 'položky nalezeny');
    for (const { path, item } of items) {
      assert.ok('value' in item, `${path}: value`);
      assert.ok(typeof item.source === 'string' && item.source.trim(), `${path}: source`);
      assert.match(item.date, ISO, `${path}: date`);
      assert.ok(typeof item.label === 'string' && item.label.trim(), `${path}: label`);
    }
  });
}

test('defaults.json: všechna města mají cenu, nájem a daň', () => {
  for (const id of ['praha', 'brno', 'ostrava', 'cr']) {
    const c = defaults.cities[id];
    assert.ok(c.name);
    for (const k of ['pricePerM2', 'rentPerM2', 'propertyTaxPerM2Year']) assert.ok(c[k].value > 0, `${id}.${k}`);
  }
});

// Revize 5. 11. 2026, BYD-07: zákonná pravidla odkazují na úřední znění, tržní údaje jsou označené.
const UREDNI = /^https:\/\/(www\.zakonyprolidi\.cz|www\.cnb\.cz|e-sbirka\.gov\.cz)\//;

test('rules.json: zákonná pravidla (předčasné splacení, odpočet úroků, LTV, DTI) mají úřední url', () => {
  const zakonna = collectItems(rules).filter(({ path }) => /^(prepayment|interestDeduction|ltv|dti)\./.test(path));
  assert.ok(zakonna.length >= 15);
  for (const { path, item } of zakonna) {
    assert.match(item.url, UREDNI, `${path}: ${item.url}`);
    if (/^(prepayment|interestDeduction)\./.test(path)) {
      assert.ok(item.zdroj, `${path}: citace zdroj`);
      assert.ok(item.zdroj.pravniZaklad && item.zdroj.citace, `${path}: pravniZaklad a citace`);
      assert.match(item.zdroj.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/\d{4}-\d+(#p\d+[a-z]?)?$/, `${path}: url předpisu`);
    }
  }
});

test('rules.json: limit odpočtu úroků je v § 15 odst. 4, vyšší limit patří k bytové potřebě obstarané před 1. 1. 2021', () => {
  const d = rules.interestDeduction;
  assert.match(d.limit.source, /§ 15 odst\. 4/);
  assert.match(d.limit.zdroj.citace, /nesmí překročit 150000 Kč/);
  assert.match(`${d.limitPre2021.label} ${d.limitPre2021.note}`, /bytov\S+ potřeb\S+ obstaran\S+ před 1\. 1\. 2021/);
  assert.match(d.limitPre2021.zdroj.pravniZaklad, /386\/2020 Sb\., čl\. IV bod 3/);
});

test('defaults.json: správní poplatek za vklad a daň z nemovitosti podle zákona', () => {
  assert.match(defaults.refinanceCosts.cadastreFee.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/2004-634/);
  assert.match(defaults.ownership.purchaseCosts.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/2004-634/);
  for (const c of Object.values(defaults.cities)) assert.match(c.propertyTaxPerM2Year.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/1992-338/);
});

test('meta.zdroje: neúřední zdroje jsou jen tržní údaje a jsou tak označené', () => {
  for (const z of rules.meta.zdroje) {
    if (UREDNI.test(z.url)) continue;
    assert.match(`${z.nazev} ${z.poznamka ?? ''}`, /tržní údaj/i, `${z.nazev}: ${z.url}`);
    assert.doesNotMatch(z.nazev, /Zákon č\./, `${z.nazev}: zákon s neúředním odkazem`);
  }
  assert.equal(rules.meta.overeno, '2026-11-13');
});
