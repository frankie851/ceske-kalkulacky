// Další práce po revizi 5. 11. 2026: kontrolní seznam tyká a bere limit příjmu manžela z rules.json,
// čísla z polí se čtou sdíleným prectiCislo (jen celé koruny).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { vyhodnot } from '../slevy.js';
import { odpovediZeStavu, celeZPole } from '../vystup.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const VYKANI = /\b(jste|jsi\s+\S+l\(a\)|vás|vám|váš|vaše|vaší|můžete|budete|nepracovali|pracovali)\b|\(a\)/i;

/** Odpovědi, které v kontrolním seznamu vyvolají co nejvíc řádků. */
function plneOdpovedi(prijmy = {}) {
  return {
    narozeni: { rok: 2003, mesic: 5 },
    mzda: { mesicne: 40000, mesice: 12 },
    studium: { studuje: true, od: 1, do: 12, druh: 'vs' },
    deti: [{ narozeni: { rok: 2025, mesic: 3 }, od: 1, do: 12, ztpp: true, skolka: true, skolne: 20000, dohodaStrop: 10000 }],
    manzel: { ma: true, prijem: 0, peceODite: true, ztpp: true },
    invalidita: { stupen: 3, ztpp: true },
    hypoteka: { uroky: 50000 },
    stari: { penzijko: 30000 },
    dary: { dary: 5000, krev: 2 },
    prijmy,
  };
}

test('kontrolní seznam tyká a je rodově neutrální (bez „jste nepracovali“)', () => {
  const varianty = [
    vyhodnot({ narozeni: { rok: 1990, mesic: 1 } }, rules), // jen poplatník → volitelné roční zúčtování
    vyhodnot(plneOdpovedi(), rules), // roční zúčtování
    vyhodnot(plneOdpovedi({ ostatni: rules.priznani.limitOstatnichPrijmuZamestnance + 1 }), rules), // přiznání
  ];
  for (const v of varianty) {
    for (const veta of [...v.kontrolniSeznam.kroky, ...v.kontrolniSeznam.doklady]) {
      assert.doesNotMatch(veta, VYKANI, veta);
    }
  }
  assert.match(varianty[0].kontrolniSeznam.kroky.at(-1), /Volitelně požádat o roční zúčtování/);
});

test('limit příjmu manžela v dokladech je z rules.json (slevy.manzel.limitPrijmu), ne natvrdo', () => {
  const doklad = (r) => vyhodnot(plneOdpovedi(), r).kontrolniSeznam.doklady.find((d) => d.startsWith('Doklad o příjmech manžela'));
  assert.match(doklad(rules), /68\s000\sKč/);
  const jine = structuredClone(rules);
  jine.slevy.manzel.limitPrijmu = 70000;
  const t = doklad(jine);
  assert.match(t, /70\s000\sKč/);
  assert.doesNotMatch(t, /68\s000/);
  // Zdrojový kód modulu částku neobsahuje.
  const kod = readFileSync(new URL('../slevy.js', import.meta.url), 'utf8');
  assert.doesNotMatch(kod, /68[\s ]?000/);
});

test('limit příjmu manžela 68 000 Kč cituje § 35bb odst. 2 písm. b) ZDP ve znění od 1. 1. 2027', () => {
  const m = rules.slevy.manzel;
  assert.equal(m.limitPrijmu, 68000);
  assert.match(m.zdroj.pravniZaklad, /§ 35bb odst\. 2 písm\. a\) a b\)/);
  assert.match(m.zdroj.citace, /nemá vlastní příjem přesahující za zdaňovací období 68000 Kč/);
  assert.equal(m.zdroj.url, 'https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101#p35bb');
});

test('čísla z polí: sdílené prectiCislo, jen celé koruny', () => {
  assert.equal(celeZPole(''), 0);
  assert.equal(celeZPole('40000'), 40000);
  assert.equal(celeZPole('40 000'), 40000);
  assert.equal(celeZPole('40.000'), 40000);
  assert.equal(celeZPole('40 000 Kč'), 40000);
  assert.equal(celeZPole('1.234.567'), 1234567);
  for (const spatne of ['1500,50', '1.5', '12.50', '-5', 'abc', '1,']) {
    assert.ok(Number.isNaN(celeZPole(spatne)), `${spatne} → NaN (pole ukáže hlášku)`);
  }
});

test('stav formuláře s „40.000“ → 40 000 Kč ve výpočtu', () => {
  const stav = {
    narozeni: { rok: '1990', mesic: 1, prvni: false },
    mzda: { mesicne: '50.000', mesice: 12 },
    studium: { studuje: false, od: 1, do: 12, druh: 'vs' },
    deti: [],
    manzel: { ma: false, prijem: '', peceODite: false, ztpp: false },
    invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: '40.000', bytovaPotrebaPred2021: false },
    stari: { penzijko: '', penzijkoMimoradny: '', dip: '', zivotni: '', dlouhodobaPece: '' },
    dary: { dary: '', krev: '' },
    odbory: false,
    prijmy: { maleDohody: '', soubezne: '', ostatni: '' },
  };
  const odp = odpovediZeStavu(stav, rules);
  assert.equal(odp.hypoteka.uroky, 40000);
  assert.equal(odp.mzda.mesicne, 50000);
  const uroky = vyhodnot(odp, rules).polozky.find((p) => p.id === 'uroky');
  assert.equal(uroky.rocne, 40000);
});
