import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  slevaStudent,
  zvyhodneniDeti,
  skolkovne,
  slevaManzel,
  slevaInvalidita,
  odpocetStari,
  odpocetUroky,
  odpocetDary,
  uplatnitDan,
  povinnostPriznani,
  vyhodnot,
} from '../slevy.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));

const celyRok = { od: 1, do: 12 };

// --- Případy ze zadání -------------------------------------------------------

test('student 22 let po celý rok → 4 020 Kč', () => {
  const r = slevaStudent({ narozeni: { rok: 2005, mesic: 1 }, studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules);
  assert.equal(r.rocne, 4020);
  assert.equal(r.mesice, 12);
});

test('student jen od ledna do června → 2 010 Kč (6/12)', () => {
  const r = slevaStudent({ narozeni: { rok: 2005, mesic: 1 }, studium: { studuje: true, od: 1, do: 6, druh: 'vs' } }, rules);
  assert.equal(r.rocne, 2010);
  assert.equal(r.mesice, 6);
});

test('věk 27, bakalářské studium → sleva na studenta 0', () => {
  const r = slevaStudent({ narozeni: { rok: 2000, mesic: 1 }, studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules);
  assert.equal(r.rocne, 0);
});

test('2 děti po celý rok → 15 204 + 22 320 = 37 524 Kč', () => {
  const r = zvyhodneniDeti([
    { narozeni: { rok: 2018, mesic: 4 }, ...celyRok },
    { narozeni: { rok: 2021, mesic: 9 }, ...celyRok },
  ], rules);
  assert.deepEqual(r.polozky.map((p) => p.rocne), [15204, 22320]);
  assert.equal(r.rocne, 37524);
});

test('školkovné: školné 30 000 Kč → 24 900 Kč, školné 12 000 Kč → 12 000 Kč', () => {
  const nar = { rok: 2022, mesic: 5 };
  assert.equal(skolkovne([{ narozeni: nar, skolka: true, skolne: 30000 }], rules).rocne, 24900);
  assert.equal(skolkovne([{ narozeni: nar, skolka: true, skolne: 12000 }], rules).rocne, 12000);
});

test('manželka s příjmem 50 000 Kč a dítě 2 roky → 24 840 Kč; příjem 70 000 Kč → 0', () => {
  const deti = [{ narozeni: { rok: 2025, mesic: 3 }, ...celyRok }];
  assert.equal(slevaManzel({ manzel: { ma: true, prijem: 50000, peceODite: true }, deti }, rules).rocne, 24840);
  assert.equal(slevaManzel({ manzel: { ma: true, prijem: 70000, peceODite: true }, deti }, rules).rocne, 0);
});

test('vklady do DIP 60 000 Kč → odpočet 48 000 Kč', () => {
  assert.equal(odpocetStari({ dip: 60000 }, rules).odpocet, 48000);
});

// --- Hraniční případy --------------------------------------------------------

test('student dovrší 26 let v červnu → nárok leden–červen', () => {
  const r = slevaStudent({ narozeni: { rok: 2001, mesic: 6 }, studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules);
  assert.equal(r.mesice, 6);
  assert.equal(r.rocne, 2010);
});

test('doktorand v prezenčním studiu ve 27 letech → plná sleva', () => {
  const r = slevaStudent({ narozeni: { rok: 2000, mesic: 1 }, studium: { studuje: true, ...celyRok, druh: 'doktorske' } }, rules);
  assert.equal(r.rocne, 4020);
});

test('nestuduje → 0', () => {
  assert.equal(slevaStudent({ narozeni: { rok: 2005, mesic: 1 }, studium: { studuje: false } }, rules).rocne, 0);
});

test('manžel: dítě slaví 3. narozeniny v listopadu → 11/12', () => {
  const deti = [{ narozeni: { rok: 2024, mesic: 11 }, ...celyRok }];
  const r = slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti }, rules);
  assert.equal(r.mesice, 11);
  assert.equal(r.rocne, 22770);
});

test('manžel s průkazem ZTP/P → dvojnásobek', () => {
  const deti = [{ narozeni: { rok: 2025, mesic: 3 }, ...celyRok }];
  assert.equal(slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true, ztpp: true }, deti }, rules).rocne, 49680);
});

test('manžel bez péče o dítě do 3 let → 0', () => {
  const deti = [{ narozeni: { rok: 2015, mesic: 3 }, ...celyRok }];
  assert.equal(slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti }, rules).rocne, 0);
});

test('dítě s ZTP/P → dvojnásobek zvýhodnění', () => {
  const r = zvyhodneniDeti([{ narozeni: { rok: 2018, mesic: 4 }, ...celyRok, ztpp: true }], rules);
  assert.equal(r.rocne, 30408);
});

test('dítě narozené v dubnu 2027 → zvýhodnění i za měsíc narození (9/12)', () => {
  const r = zvyhodneniDeti([{ narozeni: { rok: 2027, mesic: 4 }, ...celyRok }], rules);
  assert.equal(r.rocne, 1267 * 9);
});

test('třetí dítě → 27 840 Kč', () => {
  const d = { narozeni: { rok: 2015, mesic: 1 }, ...celyRok };
  const r = zvyhodneniDeti([d, d, d], rules);
  assert.equal(r.rocne, 15204 + 22320 + 27840);
});

test('invalidita III. stupně a ZTP/P se sčítají', () => {
  const r = slevaInvalidita({ invalidita: { stupen: 3, ztpp: true } }, rules);
  assert.equal(r.reduce((s, p) => s + p.rocne, 0), 5040 + 16140);
});

test('penzijko 24 000 Kč → odpočet 3 600 Kč (nad 20 400)', () => {
  assert.equal(odpocetStari({ penzijko: 24000 }, rules).odpocet, 3600);
});

test('součet produktů na stáří nad limit → 48 000 Kč', () => {
  assert.equal(odpocetStari({ penzijko: 50400, dip: 10000, zivotni: 20000 }, rules).odpocet, 48000);
});

test('úroky z hypotéky nad limit → 150 000, stará smlouva 300 000', () => {
  assert.equal(odpocetUroky({ uroky: 200000 }, rules).odpocet, 150000);
  assert.equal(odpocetUroky({ uroky: 200000, stareSmlouva: true }, rules).odpocet, 200000);
  assert.equal(odpocetUroky({ uroky: 200000, mesice: 6 }, rules).odpocet, 75000);
});

test('dary: pod 1 000 Kč a pod 2 % → 0; strop 15 % základu daně', () => {
  assert.equal(odpocetDary({ dary: 800 }, 600000, rules).odpocet, 0);
  assert.equal(odpocetDary({ dary: 500, krev: 1 }, 600000, rules).odpocet, 3500);
  assert.equal(odpocetDary({ dary: 200000 }, 600000, rules).odpocet, 90000);
});

test('slevy sníží daň nejvýš na nulu, zbytek zvýhodnění na děti je bonus', () => {
  // mzda 20 000 × 12 = 240 000 → daň 36 000
  const r = uplatnitDan({ zakladDane: 240000, prijmyPrace: 240000, slevy: 30840 + 49680, zvyhodneni: 15204 }, rules);
  assert.equal(r.danPred, 36000);
  assert.equal(r.slevyUplatnene, 36000);
  assert.equal(r.dan, 0);
  assert.equal(r.bonus, 15204);
});

test('bonus jen při příjmu aspoň 149 400 Kč', () => {
  const r = uplatnitDan({ zakladDane: 120000, prijmyPrace: 120000, slevy: 30840, zvyhodneni: 15204 }, rules);
  assert.equal(r.bonus, 0);
  const r2 = uplatnitDan({ zakladDane: 149400, prijmyPrace: 149400, slevy: 30840, zvyhodneni: 15204 }, rules);
  assert.equal(r2.bonus, 15204);
});

test('povinné přiznání: ostatní příjmy nad 40 000 Kč nebo souběžné zaměstnání; malá DPP ne', () => {
  assert.equal(povinnostPriznani({ ostatni: 40000 }, rules).povinne, false);
  assert.equal(povinnostPriznani({ ostatni: 40001 }, rules).povinne, true);
  assert.equal(povinnostPriznani({ soubezne: 5000 }, rules).povinne, true);
  assert.equal(povinnostPriznani({ maleDohody: 30000 }, rules).povinne, false);
  assert.equal(povinnostPriznani({}, rules).povinne, false);
});

test('školkovné: dítě ve dvou domácnostech → strop 12 450 Kč, písemná dohoda jinak', () => {
  const nar = { rok: 2022, mesic: 5 };
  assert.equal(skolkovne([{ narozeni: nar, skolka: true, skolne: 30000, domacnosti: 2 }], rules).rocne, 12450);
  assert.equal(skolkovne([{ narozeni: nar, skolka: true, skolne: 30000, domacnosti: 3 }], rules).rocne, 8300);
  assert.equal(skolkovne([{ narozeni: nar, skolka: true, skolne: 30000, domacnosti: 2, dohodaStrop: 17430 }], rules).rocne, 17430);
});

test('školkovné na dvě děti se počítá pro každé zvlášť', () => {
  const nar = { rok: 2022, mesic: 5 };
  const r = skolkovne([{ narozeni: nar, skolka: true, skolne: 30000 }, { narozeni: nar, skolka: true, skolne: 8000 }], rules);
  assert.equal(r.rocne, 24900 + 8000);
});

test('daňový bonus pod 100 Kč se nevyplácí', () => {
  // daň 23 310 (155 400 × 15 %) – sleva 30 840 → 0; zvýhodnění 50 → bonus 50 < 100
  const r = uplatnitDan({ zakladDane: 155400, prijmyPrace: 155400, slevy: 30840, zvyhodneni: 50 }, rules);
  assert.equal(r.bonus, 0);
});

test('vyhodnot: student + 2 děti + DIP – součet, novinky a místo uplatnění', () => {
  const v = vyhodnot({
    narozeni: { rok: 2005, mesic: 1 },
    studium: { studuje: true, ...celyRok, druh: 'vs' },
    deti: [
      { narozeni: { rok: 2018, mesic: 4 }, ...celyRok },
      { narozeni: { rok: 2022, mesic: 9 }, ...celyRok, skolka: true, skolne: 30000 },
    ],
    stari: { dip: 60000 },
    odbory: true,
  }, rules);
  const podle = Object.fromEntries(v.polozky.map((p) => [p.id, p]));
  assert.equal(podle.student.rocne, 4020);
  assert.equal(podle.student.novinka, true);
  assert.equal(podle.student.kde, 'prohlaseni');
  assert.equal(podle.deti.rocne, 37524);
  assert.equal(podle.skolkovne.rocne, 24900);
  assert.equal(podle.skolkovne.kde, 'rocniZuctovani');
  assert.equal(podle.skolkovne.mesicne, null);
  assert.equal(podle.stari.rocne, 48000);
  assert.equal(podle.stari.uspora, 7200);
  assert.equal(podle.odbory.rocne, 0);
  assert.equal(podle.odbory.zruseno, true);
  assert.equal(v.soucetAz, 30840 + 4020 + 37524 + 24900 + 7200);
  assert.equal(v.realne, null);
});

test('vyhodnot: povinné přiznání přesune roční položky do přiznání', () => {
  const v = vyhodnot({
    narozeni: { rok: 1990, mesic: 1 },
    stari: { dip: 10000 },
    prijmy: { ostatni: 60000, maleDohody: 10000 },
  }, rules);
  assert.equal(v.priznani.povinne, true);
  assert.equal(v.polozky.find((p) => p.id === 'stari').kde, 'priznani');
});

test('vyhodnot: se mzdou spočítá reálný efekt (daň nejvýš na nulu)', () => {
  const v = vyhodnot({
    narozeni: { rok: 1990, mesic: 1 },
    mzda: { mesicne: 20000, mesice: 12 },
    deti: [{ narozeni: { rok: 2018, mesic: 4 }, ...celyRok }],
  }, rules);
  // daň 36 000 → sleva na poplatníka 30 840 → zbývá 5 160; zvýhodnění 15 204 → sleva 5 160 + bonus 10 044
  assert.equal(v.dan.bonus, 10044);
  assert.equal(v.realne, 36000 + 10044);
});
