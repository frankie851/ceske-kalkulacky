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

import { odpovediZeStavu } from '../vystup.js';

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

// Revize 5. 11. 2026, SLV-05: § 15 odst. 7 ZDP – po měsících, ne ročně minus 20 400 Kč.
test('SLV-05: mimořádný vklad 48 000 Kč v prosinci → odpočet 46 300 Kč', () => {
  assert.equal(odpocetStari({ penzijko: 48000, penzijkoMimoradny: 48000 }, rules).odpocet, 46300);
  // 12 × 1 000 Kč + mimořádně 30 000 Kč: prosinec 31 000 Kč → 29 300 Kč
  assert.equal(odpocetStari({ penzijko: 42000, penzijkoMimoradny: 30000 }, rules).odpocet, 29300);
  assert.equal(rules.odpocty.stari.penzijkoHraniceMesicne, 1700);
});

test('penzijko 24 000 Kč → odpočet 3 600 Kč (nad 1 700 Kč měsíčně)', () => {
  assert.equal(odpocetStari({ penzijko: 24000 }, rules).odpocet, 3600);
});

test('součet produktů na stáří nad limit → 48 000 Kč', () => {
  assert.equal(odpocetStari({ penzijko: 50400, dip: 10000, zivotni: 20000 }, rules).odpocet, 48000);
});

// Revize 5. 11. 2026, SLV-04/SLV-06: vyšší limit 300 000 Kč patří k bytové potřebě obstarané
// před 1. 1. 2021 (zákon č. 386/2020 Sb., čl. IV bod 3), ne ke smlouvě. Dřív vstup „stareSmlouva“.
test('úroky z hypotéky nad limit → 150 000, bydlení pořízené před 1. 1. 2021 → 300 000', () => {
  assert.equal(odpocetUroky({ uroky: 200000 }, rules).odpocet, 150000);
  assert.equal(odpocetUroky({ uroky: 200000, bytovaPotrebaPred2021: true }, rules).odpocet, 200000);
  assert.equal(odpocetUroky({ uroky: 400000, bytovaPotrebaPred2021: true }, rules).odpocet, 300000);
  assert.equal(odpocetUroky({ uroky: 200000, mesice: 6 }, rules).odpocet, 75000);
});

test('SLV-06: byt koupený 2019, úvěr refinancovaný 2023, úroky 180 000 Kč → odečte 180 000 Kč', () => {
  // Rozhoduje, kdy bylo bydlení pořízené. Datum (nové) smlouvy se nezadává a výsledek neovlivní.
  assert.equal(odpocetUroky({ uroky: 180000, bytovaPotrebaPred2021: true }, rules).odpocet, 180000);
  // Byt pořízený v roce 2021 nebo později: jen 150 000 Kč, i kdyby smlouva byla z prosince 2020.
  assert.equal(odpocetUroky({ uroky: 180000, bytovaPotrebaPred2021: false }, rules).odpocet, 150000);
  assert.equal(rules.odpocty.uroky.limitPred2021, 300000);
  assert.match(rules.odpocty.uroky.zdroj.url, /zakonyprolidi\.cz\/cs\/2020-386/);
});

test('SLV-06: zaškrtnutí „bydlení pořízené před 1. 1. 2021“ v dotazníku dojde až do výpočtu', () => {
  const stav = {
    narozeni: { rok: '1990', mesic: 1 },
    mzda: { mesicne: '60 000', mesice: 12 },
    studium: { studuje: false, od: 1, do: 12, druh: 'vs' },
    deti: [],
    manzel: { ma: false, prijem: '', peceODite: false, ztpp: false },
    invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: '180 000', bytovaPotrebaPred2021: true },
    stari: { penzijko: '', dip: '', zivotni: '', dlouhodobaPece: '' },
    dary: { dary: '', krev: '' },
    odbory: false,
    prijmy: { maleDohody: '', soubezne: '', ostatni: '' },
  };
  const uroky = (s) => vyhodnot(odpovediZeStavu(s, rules), rules).polozky.find((p) => p.id === 'uroky').rocne;
  assert.equal(uroky(stav), 180000);
  stav.hypoteka.bytovaPotrebaPred2021 = false;
  assert.equal(uroky(stav), 150000);
});

test('dary: pod 1 000 Kč a pod 2 % → 0; strop 15 % základu daně', () => {
  assert.equal(odpocetDary({ dary: 800 }, 600000, rules).odpocet, 0);
  assert.equal(odpocetDary({ dary: 500, krev: 1 }, 600000, rules).odpocet, 3500);
  assert.equal(odpocetDary({ dary: 200000 }, 600000, rules).odpocet, 90000);
});

// § 15 odst. 1 ZDP (znění od 1. 1. 2027): úhrn nad 2 % základu daně nebo aspoň 1 000 Kč,
// v úhrnu nejvýš 15 % ze základu daně.
test('SLV-06: strop a minimum darů s jiným základem daně než 600 000 Kč', () => {
  assert.equal(rules.odpocty.dary.maxPodilZakladu, 0.15);
  assert.equal(rules.odpocty.dary.minPodilZakladu, 0.02);
  assert.equal(rules.odpocty.dary.minKc, 1000);
  // základ 360 000 Kč → strop 54 000 Kč
  assert.equal(odpocetDary({ dary: 70000 }, 360000, rules).odpocet, 54000);
  assert.equal(odpocetDary({ dary: 70000 }, 360000, rules).omezeno, true);
  assert.equal(odpocetDary({ dary: 50000 }, 360000, rules).odpocet, 50000);
  // základ 30 000 Kč: 900 Kč je víc než 2 % (600 Kč) → odečte se, i když je to pod 1 000 Kč
  assert.equal(odpocetDary({ dary: 900 }, 30000, rules).odpocet, 900);
  // a strop 15 % = 4 500 Kč
  assert.equal(odpocetDary({ dary: 6000 }, 30000, rules).odpocet, 4500);
  // základ 360 000 Kč: 900 Kč není 2 % (7 200 Kč) ani 1 000 Kč → nic
  assert.equal(odpocetDary({ dary: 900 }, 360000, rules).odpocet, 0);
});

// Revize 5. 11. 2026, SLV-08: strop 15 % se počítá ze základu daně, ne ze základu sníženého
// o odpočty na stáří a úroky (§ 15 odst. 1 ZDP: „nejvýše 15 % ze základu daně“).
test('SLV-08: ZD 600 000, stáří 48 000, úroky 150 000, dary 100 000 → dary 90 000 Kč', () => {
  const r = vyhodnot({
    narozeni: { rok: 1980, mesic: 1 },
    mzda: { mesicne: 50000, mesice: 12 },
    hypoteka: { uroky: 150000 },
    stari: { dip: 48000 },
    dary: { dary: 100000 },
  }, rules);
  assert.equal(r.zakladDane, 600000);
  const dary = r.polozky.find((p) => p.id === 'dary');
  assert.equal(dary.rocne, 90000);
  assert.equal(dary.omezeno, true);
  // Odpočty dohromady 288 000 Kč → zdaní se 312 000 Kč.
  assert.equal(r.dan.zaklad, 312000);
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

// Revize 5. 11. 2026, SLV-02: § 35c odst. 6 ZDP – zletilé dítě jen do dovršení 26 let a jen když
// se soustavně připravuje na budoucí povolání; jinak jen do 18 let. 1/12 za každý měsíc,
// na jehož počátku jsou podmínky splněny (§ 35c odst. 10).
test('SLV-02: dítě, které v roce 2027 dovrší 26 let → jen měsíce před dovršením', () => {
  const r = zvyhodneniDeti([{ narozeni: { rok: 2001, mesic: 3 }, od: 1, do: 12, studuje: true }], rules);
  assert.equal(r.rocne, 3 * 1267);
  assert.equal(rules.deti.vekMax, 26);
  assert.equal(rules.deti.vekMaxBezStudia, 18);
  assert.match(rules.deti.zdroj.pravniZaklad, /§ 35c odst\. 6/);
});

test('SLV-02: dítě, které v roce 2027 dovrší 18 let a nestuduje → jen měsíce před dovršením', () => {
  assert.equal(zvyhodneniDeti([{ narozeni: { rok: 2009, mesic: 6 }, od: 1, do: 12, studuje: false }], rules).rocne, 6 * 1267);
  assert.equal(zvyhodneniDeti([{ narozeni: { rok: 2009, mesic: 6 }, od: 1, do: 12, studuje: true }], rules).rocne, 15204);
  assert.equal(zvyhodneniDeti([{ narozeni: { rok: 2018, mesic: 4 }, od: 1, do: 12 }], rules).rocne, 15204);
});

test('SLV-02: pořadí dětí se počítá jen mezi dětmi, na které je v měsíci nárok', () => {
  // Starší dítě dovrší 26 v březnu → od dubna je mladší dítě první v pořadí.
  const r = zvyhodneniDeti([
    { narozeni: { rok: 2001, mesic: 3 }, od: 1, do: 12, studuje: true },
    { narozeni: { rok: 2018, mesic: 4 }, od: 1, do: 12 },
  ], rules);
  assert.deepEqual(r.polozky.map((p) => p.rocne), [3 * 1267, 3 * 1860 + 9 * 1267]);
});

// Revize 5. 11. 2026, SLV-01: školkovné jen pro dítě v předškolním věku, i když ve formuláři
// zůstala zaškrtnutá školka ze starší odpovědi.
test('SLV-01: školkovné se nezapočte dítěti mimo předškolní věk', () => {
  assert.equal(skolkovne([{ narozeni: { rok: 2012, mesic: 1 }, skolka: true, skolne: 20000 }], rules).rocne, 0);
  assert.equal(skolkovne([{ narozeni: { rok: 2023, mesic: 1 }, skolka: true, skolne: 20000 }], rules).rocne, 20000);
  assert.ok(Number.isInteger(rules.slevy.skolkovne.maxVekDitete));
});

test('SLV-01: převod stavu formuláře – dítě 2012 se zbylou školkou jde do výpočtu bez školky', () => {
  const stav = {
    narozeni: { rok: '1990', mesic: 1 },
    mzda: { mesicne: '', mesice: 12 },
    studium: { studuje: false, od: 1, do: 12, druh: 'vs' },
    deti: [{ narozeni: { rok: '2012', mesic: 1 }, ztpp: false, od: 1, do: 12, studuje: false, skolka: true, skolne: '20 000', dveDomacnosti: false, dohodaStrop: '' }],
    manzel: { ma: false, prijem: '', peceODite: false, ztpp: false },
    invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: '', bytovaPotrebaPred2021: false },
    stari: { penzijko: '', dip: '', zivotni: '', dlouhodobaPece: '' },
    dary: { dary: '', krev: '' },
    odbory: false,
    prijmy: { maleDohody: '', soubezne: '', ostatni: '' },
  };
  const o = odpovediZeStavu(stav, rules);
  assert.equal(o.deti[0].skolka, false);
  assert.equal(o.deti[0].skolne, 0);
  assert.equal(o.deti[0].narozeni.rok, 2012);
  stav.deti[0].narozeni.rok = '2023';
  assert.equal(odpovediZeStavu(stav, rules).deti[0].skolne, 20000);
});
