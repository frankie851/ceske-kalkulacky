// Revize 5. 11. 2026, ROD-11: odkazy v rules.json musí vést na úřední stránky s obsahem,
// který slibují. Zákonná pravidla odkazujeme na zakonyprolidi.cz s paragrafem.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { kontrolniSeznam } from '../vystup.js';
import { planRodiny } from '../rodina.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));

/** Všechny URL v rules.json (rekurzivně, klíč „url“). */
function vsechnyUrl(uzel, cesta = '', vysledek = []) {
  if (Array.isArray(uzel)) uzel.forEach((x, i) => vsechnyUrl(x, `${cesta}[${i}]`, vysledek));
  else if (uzel && typeof uzel === 'object') {
    for (const [k, h] of Object.entries(uzel)) {
      if (k === 'url' && typeof h === 'string') vysledek.push({ cesta: `${cesta}.${k}`, url: h });
      else vsechnyUrl(h, `${cesta}.${k}`, vysledek);
    }
  }
  return vysledek;
}

const uredni = (url) => {
  const { protocol, hostname } = new URL(url);
  return protocol === 'https:' && (hostname === 'www.zakonyprolidi.cz' || hostname.endsWith('.gov.cz'));
};

test('meta.zdroje a všechny odkazy v rules.json vedou jen na úřední domény (gov.cz, zakonyprolidi.cz)', () => {
  const neuredni = vsechnyUrl(rules).filter((u) => !uredni(u.url));
  assert.deepEqual(neuredni, []);
  for (const z of rules.meta.zdroje) assert.ok(uredni(z.url), z.url);
});

test('žádný zdroj není tisková zpráva ani stará adresa ČSSZ, která přesměruje jinam', () => {
  for (const { cesta, url } of vsechnyUrl(rules)) {
    assert.doesNotMatch(url, /tiskov|senat/i, `${cesta}: tisková zpráva místo předpisu`);
    assert.doesNotMatch(url, /cssz\.cz\/cz\/pojisteni-osvc/, `${cesta}: stránka pro OSVČ`);
    assert.notEqual(new URL(url).hostname.replace(/^www\./, ''), 'cssz.cz', `${cesta}: stará doména ČSSZ`);
  }
});

test('ČSSZ – Otcovská a ČSSZ – Peněžitá pomoc v mateřství mají přímé adresy', () => {
  assert.equal(rules.otcovska.url, 'https://www.cssz.gov.cz/web/cz/otcovska');
  const zdroj = (re) => rules.meta.zdroje.find((z) => re.test(z.nazev));
  assert.equal(zdroj(/ČSSZ – Otcovská/)?.url, 'https://www.cssz.gov.cz/web/cz/otcovska');
  assert.equal(zdroj(/ČSSZ – Peněžitá pomoc v mateřství/)?.url, 'https://www.cssz.gov.cz/web/cz/penezita-pomoc-v-materstvi');
  assert.equal(zdroj(/§ 38a/)?.url, 'https://www.zakonyprolidi.cz/cs/2006-187#p38a');
});

test('zdroje v patičce a v rules.zdroje jsou stejné', () => {
  assert.deepEqual(rules.zdroje, rules.meta.zdroje);
});

test('odkazy v kontrolním seznamu mají název, který odpovídá cíli', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'matka', otcovska: true }, rules);
  const zdroje = kontrolniSeznam(plan, rules).filter((p) => p.zdroj).map((p) => p.zdroj);
  assert.ok(zdroje.length >= 3);
  for (const z of zdroje) {
    if (/ČSSZ/.test(z.nazev)) assert.match(z.url, /^https:\/\/www\.cssz\.gov\.cz\//, z.nazev);
    if (/MPSV|ÚP ČR/.test(z.nazev)) assert.match(z.url, /^https:\/\/mpsv\.gov\.cz\//, z.nazev);
    if (/^Zákon/.test(z.nazev)) assert.match(z.url, /^https:\/\/www\.zakonyprolidi\.cz\//, z.nazev);
  }
});
