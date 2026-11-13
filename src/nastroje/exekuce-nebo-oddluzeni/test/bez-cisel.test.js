// Sazby a částky patří jen do rules.json (revize 5. 11. 2026, DLU-01 a DLU-06): nápověda
// a výchozí hodnota pole se sazbou úroku se při změně repo sazby nesmí rozejít s pravidly.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cti = (f) => readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const rules = JSON.parse(cti('rules.json'));
// Komentáře nevadí, kontrolujeme jen kód a šablonu
const bezKomentaru = (t) => t.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '').replace(/\{#[\s\S]*?#\}/g, '');
const SOUBORY = ['ui.js', 'vystup.js', 'exekuce-nebo-oddluzeni.11tydata.js', 'index.njk'];

test('žádná sazba úroku z prodlení není zapsaná natvrdo mimo rules.json', () => {
  const sazby = new Set(rules.urokZProdleni.pololeti.map((x) => x.procenta));
  const zapisy = [...sazby].flatMap((s) => [String(s), String(s).replace('.', ',')]).filter((z) => /[.,]/.test(z)); // celá čísla (15, 12) by se pletla s limity polí
  for (const f of SOUBORY) {
    const kod = bezKomentaru(cti(f));
    for (const z of zapisy) {
      const re = new RegExp(`(?<![\\d.,])${z.replace(/[.,]/g, '[.,]')}(?![\\d]|[.,]\\d)`);
      assert.doesNotMatch(kod, re, `${f}: sazba ${z} má být z rules.json`);
    }
  }
});

test('žádné desetinné číslo ani procento zapsané natvrdo v rozhraní', () => {
  for (const f of SOUBORY) {
    const kod = bezKomentaru(cti(f));
    assert.doesNotMatch(kod, /\b\d+,\d+\b/, `${f}: desetinné číslo s čárkou`);
    assert.doesNotMatch(kod, /\d\s*%/, `${f}: procento`);
  }
});
