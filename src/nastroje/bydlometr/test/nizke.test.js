// Revize 5. 11. 2026, nízké nálezy: texty variant (BYD-08), nepoužité položky JSON a čísla natvrdo
// v textech (BYD-09), záporné růsty a výnos (BYD-11).
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { rules, defaults } from './helpers.js';
import * as v from '../vystup.js';

const data = { pravidla: rules, defaults };
const zdrojak = (soubor) => readFileSync(new URL(`../${soubor}`, import.meta.url), 'utf8');

/** Texty polí jako z formuláře: výchozí hodnoty + přepsané. */
function texty(seznam, prepis = {}, mesto) {
  const o = {};
  for (const p of seznam) o[p.id] = v.textPole(p, v.vychoziHodnota(p, data, mesto));
  return { ...o, ...prepis };
}

describe('BYD-08: varianta bez prodloužení nebo bez úspor se neukazuje', () => {
  test('prodloužení o 0 let → žádná varianta „Prodloužit splatnost o 0 let“', () => {
    const r = v.refixace({ ...v.vychoziRefixace(data), extendYears: 0 }, rules);
    assert.deepEqual(r.surove.options.map((o) => o.id), ['accept', 'refinance', 'prepay']);
    assert.doesNotMatch(r.tabulkaVariant + r.tabulkaStresu + r.poznamky.join(' '), /Prodloužit splatnost o 0/);
  });

  test('úspory 0 Kč → žádná varianta mimořádné splátky (byla by stejná jako nabídka banky)', () => {
    const r = v.refixace({ ...v.vychoziRefixace(data), savings: 0 }, rules);
    assert.deepEqual(r.surove.options.map((o) => o.id), ['accept', 'refinance', 'extend']);
    assert.doesNotMatch(r.poznamky.join(' '), /splatí 0/);
  });

  test('výchozí vstupy mají všechny čtyři varianty', () => {
    const r = v.refixace(v.vychoziRefixace(data), rules);
    assert.deepEqual(r.surove.options.map((o) => o.id), ['accept', 'refinance', 'prepay', 'extend']);
  });
});

/**
 * Řetězcové literály a statické části šablon ze zdrojáku (bez komentářů). Jednoduchý tokenizér:
 * zná vnořené šablony `…${…`…`…}…`, regulární výrazy v kódu nesmí obsahovat uvozovky.
 */
function retezce(src) {
  const out = [];
  const zasobnik = [];
  let kus = null;
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (zasobnik.at(-1) === 'sablona') {
      if (c === '\\') { kus += src[i + 1]; i += 2; continue; }
      if (c === '`') { out.push(kus); zasobnik.pop(); kus = null; i += 1; continue; }
      if (c === '$' && src[i + 1] === '{') { out.push(kus); kus = null; zasobnik.push('vyraz'); i += 2; continue; }
      kus += c; i += 1; continue;
    }
    if (c === '/' && src[i + 1] === '/') { const k = src.indexOf('\n', i); i = k < 0 ? src.length : k; continue; }
    if (c === '/' && src[i + 1] === '*') { i = src.indexOf('*/', i) + 2; continue; }
    if (c === "'" || c === '"') {
      let j = i + 1;
      let s = '';
      while (src[j] !== c) { if (src[j] === '\\') { s += src[j + 1]; j += 2; } else { s += src[j]; j += 1; } }
      out.push(s);
      i = j + 1;
      continue;
    }
    if (c === '`') { zasobnik.push('sablona'); kus = ''; i += 1; continue; }
    if (c === '{') { zasobnik.push('{'); i += 1; continue; }
    if (c === '}') { if (zasobnik.pop() === 'vyraz') kus = ''; i += 1; continue; }
    i += 1;
  }
  return out;
}

// Čísla, která v textu být smějí: odkazy na paragrafy a předpisy, pořadí „1. rok“, „větší než 0“
// a atribut tabindex v HTML tabulky.
const POVOLENE = [/§ \d+[a-z]?(?: odst\. \d+)?/g, /č\. \d+\/\d+ Sb\./g, /\b1\. (?:rok|roce|měsíci)\b/g, /větší než 0/g, /tabindex="0"/g];

describe('BYD-09: texty bez čísel natvrdo', () => {
  for (const soubor of ['vystup.js', 'ui.js']) {
    test(`${soubor}: v textech nejsou čísla (vše z rules.json nebo z výpočtu)`, () => {
      const lidske = retezce(zdrojak(soubor)).filter((t) => /\p{L}/u.test(t) && /\s/.test(t));
      const sCisly = lidske.filter((t) => /\d/.test(POVOLENE.reduce((x, re) => x.replace(re, ''), t)));
      assert.deepEqual(sCisly, []);
    });
  }

  test('zátěžový test a citlivost berou posuny sazby z rules.json', () => {
    const upravena = structuredClone(rules);
    upravena.model.stressDeltas.value = [1.5, 3];
    upravena.model.sensitivityDelta.value = 1;
    const r = v.refixace(v.vychoziRefixace(data), upravena);
    assert.match(r.tabulkaStresu, /Sazba \+1,5 p\. b\./);
    assert.match(r.tabulkaStresu, /Sazba \+3 p\. b\./);
    assert.match(r.uvodStresu, /o 1,5 nebo 3 procentní body/);
    const n = v.najem(v.vychoziNajem(data), upravena);
    assert.match(n.uvodCitlivosti, /o 1 procentní bod /);
    assert.match(n.tabulkaCitlivosti, /Výnos 5\s%/);
  });

  test('každá položka defaults.json a rules.json se v kódu používá', () => {
    const kod = ['vystup.js', 'ui.js', 'bydlometr.11tydata.js', 'js/mortgage.js', 'js/rentbuy.js'].map(zdrojak).join('\n');
    const nepouzite = [];
    const projdi = (o, cesta) => {
      for (const [k, x] of Object.entries(o)) {
        if (k === 'meta' || x === null || typeof x !== 'object' || Array.isArray(x)) continue;
        if ('value' in x) { if (!kod.includes(k)) nepouzite.push(`${cesta}${k}`); } else projdi(x, `${cesta}${k}.`);
      }
    };
    projdi(defaults, 'defaults:');
    projdi(rules, 'rules:');
    assert.deepEqual(nepouzite, []);
  });
});

describe('BYD-11: záporný růst cen, nájmů, nákladů i výnos investic', () => {
  test('záporné hodnoty v rozsahu z rules.json projdou u všech čtyř polí', () => {
    const { vstup, chyby } = v.zkontrolujPole(v.POLE_NAJEM, texty(v.POLE_NAJEM, {
      'nk-rust-cen': '-2', 'nk-rust-najmu': '-1', 'nk-vynos': '-3', 'nk-rust-nakladu': '-0,5',
    }, 'praha'), rules);
    assert.deepEqual(chyby, []);
    assert.equal(vstup.rentGrowth, -1);
    assert.equal(vstup.investReturn, -3);
    assert.equal(vstup.costGrowth, -0.5);
  });

  test('mimo rozsah z rules.json → chyba se stejnou hláškou u všech čtyř polí', () => {
    const { min, max } = rules.model.assumptionRange.value;
    const { chyby } = v.zkontrolujPole(v.POLE_NAJEM, texty(v.POLE_NAJEM, {
      'nk-rust-cen': String(min - 1), 'nk-rust-najmu': String(max + 1), 'nk-vynos': String(min - 5), 'nk-rust-nakladu': String(max + 5),
    }, 'praha'), rules);
    assert.deepEqual(chyby.map((c) => c.id).sort(), ['nk-rust-cen', 'nk-rust-najmu', 'nk-rust-nakladu', 'nk-vynos']);
    assert.equal(new Set(chyby.map((c) => c.zprava)).size, 1);
    assert.match(chyby[0].zprava, /^Zadej číslo od −\d+ do \d+\.$/);
  });

  test('záporný růst nájmů a výnos se ve výpočtu projeví', () => {
    const zaklad = v.vychoziNajem(data);
    const r = v.najem({ ...zaklad, rentGrowth: -1, investReturn: -1 }, rules);
    assert.equal(r.platny, true);
    assert.ok(r.surove.years.at(-1).renterNetWorth < v.najem(zaklad, rules).surove.years.at(-1).renterNetWorth);
  });

  test('kalkulačka poplatku říká, že neúčelový úvěr na bydlení nepočítá', () => {
    assert.match(zdrojak('index.njk'), /[Nn]eúčelov[^.]*§ 117 odst\. 4[^.]*nepočítá/);
  });
});
