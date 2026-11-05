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
