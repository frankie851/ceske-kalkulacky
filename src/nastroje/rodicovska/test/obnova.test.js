// Revize 5. 11. 2026, ROD-14: obnova uloženého plánu z localStorage pustí do formuláře
// jen platné hodnoty (typ, rozsah, datum). Neplatné zahodí a pole si nechá výchozí hodnotu.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ocistiUlozene, mezeFormulare } from '../obnova.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const meze = mezeFormulare(rules);

test('meze formuláře jdou z rules.json', () => {
  assert.equal(meze.terminMin, '2026-01-01');
  assert.equal(meze.otcovskaMax, rules.otcovska.nastupDoDne);
  assert.equal(meze.vekMax, 35);
  assert.deepEqual([meze.ppmTydnuMin, meze.ppmTydnuMax], [rules.ppm.nastupTydnyPredMin, rules.ppm.nastupTydnyPredMax]);
});

test('platný uložený plán projde beze změny', () => {
  const data = {
    termin: '2027-04-15', 'prijem-matka': '45 000', 'prijem-otec': '0', 'ppm-tydnu': '8',
    'otcovska-od': '3', 'stridani-od': '12', 'navrat-od': '24',
    vicercata: 'ne', 'kdo-ppm': 'otec', rpVolba: 'vlastni', rpVyse: 12000,
  };
  assert.deepEqual(ocistiUlozene(data, meze), data);
});

test('neplatné datum, datum před platností pravidel a neexistující den se zahodí', () => {
  for (const termin of ['abc', '2025-12-31', '2027-02-30', '<img src=x>', 20270415]) {
    assert.equal('termin' in ocistiUlozene({ termin }, meze), false, String(termin));
  }
});

test('příjem: jen nezáporné číslo, jinak se zahodí', () => {
  for (const prijem of ['<img src=x onerror=alert(1)>', '-5000', 'NaN', '1e400', '', 40000]) {
    assert.equal('prijem-matka' in ocistiUlozene({ 'prijem-matka': prijem }, meze), false, String(prijem));
  }
  assert.equal(ocistiUlozene({ 'prijem-otec': '40.000' }, meze)['prijem-otec'], '40.000');
});

test('celá čísla mimo rozsah se zahodí', () => {
  const o = ocistiUlozene({ 'ppm-tydnu': '5', 'otcovska-od': '99', 'stridani-od': '0', 'navrat-od': '36' }, meze);
  assert.deepEqual(o, {});
  assert.deepEqual(ocistiUlozene({ 'otcovska-od': '1,5' }, meze), {});
});

test('volby přepínačů: jen text bez zvláštních znaků; výše RP jen kladné celé číslo', () => {
  const o = ocistiUlozene({ 'kdo-ppm': 'matka"><img>', vicercata: 1, rpVolba: 'hack', rpVyse: -1 }, meze);
  assert.deepEqual(o, {});
  // Výši ukládá app.js jako číslo; text nebo desetinné číslo je podvržené.
  assert.deepEqual(ocistiUlozene({ rpVolba: 'max', rpVyse: '12000' }, meze), { rpVolba: 'max' });
  assert.deepEqual(ocistiUlozene({ rpVyse: 12000.5 }, meze), {});
});

test('poškozený záznam (ne objekt) → prázdný výsledek', () => {
  for (const x of [null, 'text', 42, ['termin']]) assert.deepEqual(ocistiUlozene(x, meze), {});
});
