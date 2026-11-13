// Revize 5. 11. 2026, nízké nálezy: citace zvýšeného stropu darů (SLV-09) a nekonzistence vstupů –
// sleva na manžela bez zadaného dítěte a narozeniny 1. dne měsíce (SLV-10).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { slevaManzel, slevaStudent, zvyhodneniDeti, vyhodnot } from '../slevy.js';
import { odpovediZeStavu, modelVysledku, vysledekHtml } from '../vystup.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const celyRok = { od: 1, do: 12 };

// --- SLV-09 ---------------------------------------------------------------------------------

test('SLV-09: zvýšený strop 30 % cituje § 1 odst. 1 zákona č. 128/2022 Sb. (ve znění zákona č. 24/2025 Sb.)', () => {
  const d = rules.odpocty.dary;
  assert.doesNotMatch(JSON.stringify(rules), /66\/2022/);
  assert.match(d.poznamka, /§ 1 odst\. 1 zákona č\. 128\/2022 Sb\./);
  assert.match(d.zvysenyStrop.pravniZaklad, /§ 1 odst\. 1 zákona č\. 128\/2022 Sb\./);
  assert.match(d.zvysenyStrop.pravniZaklad, /24\/2025 Sb\./);
  assert.equal(d.zvysenyStrop.url, 'https://www.zakonyprolidi.cz/cs/2022-128#p1');
  assert.match(d.zvysenyStrop.citace, /let 2022 až 2026/);
  assert.ok(d.zdroje.includes('zakon-128-2022'));
  assert.equal(rules.zdroje['zakon-128-2022'].url, 'https://www.zakonyprolidi.cz/cs/2022-128');
  assert.ok(rules.meta.zdroje.some((z) => z.url === 'https://www.zakonyprolidi.cz/cs/2022-128'));
  // Pro rok 2027 zvýšený strop neplatí: § 15 odst. 1 ZDP, 15 % základu daně.
  assert.equal(rules.rok, 2027);
  assert.equal(d.maxPodilZakladu, 0.15);
});

// --- SLV-10: sleva na manžela jen ze zadaných dětí ---------------------------------------------

test('SLV-10: manžel „pečuje o dítě do 3 let“, ale žádné dítě není zadané → 0 a důvod', () => {
  const r = slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [] }, rules);
  assert.equal(r.mesice, 0);
  assert.equal(r.rocne, 0);
  assert.equal(r.duvod, 'bezDitete');
});

test('SLV-10: výsledek řekne, že dítě do 3 let je třeba zadat v kroku Děti', () => {
  const odp = { narozeni: { rok: 1990, mesic: 1 }, deti: [], manzel: { ma: true, prijem: 0, peceODite: true } };
  const v = vyhodnot(odp, rules);
  const p = v.polozky.find((x) => x.id === 'manzel');
  assert.equal(p.rocne, 0);
  assert.equal(p.duvod, 'bezDitete');
  const html = vysledekHtml(modelVysledku(odp, rules), odp, rules, { sprite: '/s.svg', plan48: '/p/' });
  assert.match(html, /zadej i v kroku „Děti“/);
});

test('SLV-10: se zadaným dítětem do 3 let se sleva na manžela počítá dál', () => {
  const deti = [{ narozeni: { rok: 2025, mesic: 3 }, ...celyRok }];
  assert.equal(slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti }, rules).rocne, 24840);
});

// --- SLV-10: narozeniny 1. dne měsíce (věk dovršený na počátku měsíce) -----------------------

test('SLV-10: student narozený 1. 6. 2001 dovrší 26 let 1. 6. 2027 → nárok jen leden–květen', () => {
  const studium = { studuje: true, ...celyRok, druh: 'vs' };
  assert.equal(slevaStudent({ narozeni: { rok: 2001, mesic: 6, den: 1 }, studium }, rules).mesice, 5);
  assert.equal(slevaStudent({ narozeni: { rok: 2001, mesic: 6, den: 2 }, studium }, rules).mesice, 6);
  assert.equal(slevaStudent({ narozeni: { rok: 2001, mesic: 6 }, studium }, rules).mesice, 6);
});

test('SLV-10: dítě narozené 1. 3. 2009 bez studia dovrší 18 let 1. 3. 2027 → zvýhodnění za 2 měsíce', () => {
  const m = (den) => zvyhodneniDeti([{ narozeni: { rok: 2009, mesic: 3, den }, ...celyRok, studuje: false }], rules).polozky[0].mesice;
  assert.equal(m(1), 2);
  assert.equal(m(15), 3);
  assert.equal(m(undefined), 3);
});

test('SLV-10: dítě narozené 1. 11. 2024 má 3 roky 1. 11. 2027 → sleva na manžela za 10 měsíců', () => {
  const sleva = (den) => slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [{ narozeni: { rok: 2024, mesic: 11, den }, ...celyRok }] }, rules);
  assert.equal(sleva(1).mesice, 10);
  assert.equal(sleva(1).rocne, 20700);
  assert.equal(sleva(undefined).mesice, 11);
});

test('SLV-10: dítě narozené 1. 3. 2027 je na světě na počátku března → sleva na manžela za 10 měsíců', () => {
  const sleva = (den) => slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [{ narozeni: { rok: 2027, mesic: 3, den }, ...celyRok }] }, rules);
  assert.equal(sleva(1).mesice, 10);
  assert.equal(sleva(undefined).mesice, 9);
});

test('SLV-10: zaškrtnutí „narozeniny 1. dne v měsíci“ ve formuláři dojde do výpočtu', () => {
  const stav = {
    narozeni: { rok: '2001', mesic: 6, prvni: true },
    mzda: { mesicne: '', mesice: 12 },
    studium: { studuje: true, od: 1, do: 12, druh: 'vs' },
    deti: [{ narozeni: { rok: '2009', mesic: 3, prvni: true }, ztpp: false, od: 1, do: 12, studuje: false, skolka: false, skolne: '', dveDomacnosti: false, dohodaStrop: '' }],
    manzel: { ma: false, prijem: '', peceODite: false, ztpp: false },
    invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: '', bytovaPotrebaPred2021: false },
    stari: { penzijko: '', dip: '', zivotni: '', dlouhodobaPece: '' },
    dary: { dary: '', krev: '' },
    odbory: false,
    prijmy: { maleDohody: '', soubezne: '', ostatni: '' },
  };
  const o = odpovediZeStavu(stav, rules);
  assert.equal(o.narozeni.den, 1);
  assert.equal(o.deti[0].narozeni.den, 1);
  const v = vyhodnot(o, rules);
  assert.equal(v.polozky.find((p) => p.id === 'student').mesice, 5);
  assert.equal(v.polozky.find((p) => p.id === 'deti').rozpis[0].mesice, 2);
  stav.narozeni.prvni = false;
  assert.equal(odpovediZeStavu(stav, rules).narozeni.den, undefined);
});
