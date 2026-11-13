// Revize 5. 11. 2026: propojení formuláře (BYD-06), neplatný vstup (BYD-03), DTI a úspora na dani
// (BYD-04), úvěr nad limitem LTV (BYD-05) a texty kalkulačky poplatku (BYD-01, BYD-02) ve vystup.js.
import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rules, defaults } from './helpers.js';
import * as v from '../vystup.js';
import stranka from '../bydlometr.11tydata.js';
import { kc } from '../../../js/format.js';

const data = { pravidla: rules, defaults };
const NBSP = /[\s  ]/g;
const t = (s) => String(s).replace(NBSP, ' ');

/** Texty polí jako z formuláře: výchozí hodnoty + přepsané. */
function texty(seznam, prepis = {}, mesto) {
  const o = {};
  for (const p of seznam) o[p.id] = v.textPole(p, v.vychoziHodnota(p, data, mesto));
  return { ...o, ...prepis };
}

describe('BYD-06: čtení formuláře (zkontrolujPole)', () => {
  test('výchozí texty refixace se přečtou bez chyb a měřítko pole se použije', () => {
    const { vstup, chyby } = v.zkontrolujPole(v.POLE_REFIXACE, texty(v.POLE_REFIXACE));
    assert.deepEqual(chyby, []);
    assert.equal(vstup.balance, 2_800_000);
    assert.equal(vstup.threshold, 0.4, 'hranice 40 % → 0,4');
  });

  test('český zápis: mezery, „Kč“, tečky po tisících, desetinná čárka', () => {
    const { vstup, chyby } = v.zkontrolujPole(v.POLE_REFIXACE, texty(v.POLE_REFIXACE, {
      'rf-zustatek': '2.800.000', 'rf-sazba-dosud': '2,49', 'rf-prijem': '75 000 Kč',
    }));
    assert.deepEqual(chyby, []);
    assert.equal(vstup.balance, 2_800_000);
    assert.equal(vstup.currentRate, 2.49);
    assert.equal(vstup.income, 75_000);
  });

  test('chyby: písmena, prázdné, záporné, nula, mimo rozsah', () => {
    const { chyby } = v.zkontrolujPole(v.POLE_REFIXACE, texty(v.POLE_REFIXACE, {
      'rf-zustatek': 'abc', 'rf-sazba-dosud': '', 'rf-uspory': '-5', 'rf-fixace': '0', 'rf-prah': '150',
    }));
    const podle = Object.fromEntries(chyby.map((c) => [c.id, c.zprava]));
    assert.equal(podle['rf-zustatek'], 'Zadej číslo, bez písmen.');
    assert.equal(podle['rf-sazba-dosud'], 'Vyplň číslo.');
    assert.equal(podle['rf-uspory'], 'Číslo nemůže být záporné.');
    assert.equal(podle['rf-fixace'], 'Zadej číslo větší než 0.');
    assert.equal(podle['rf-prah'], 'Zadej číslo od 0 do 100.');
    assert.equal(chyby.find((c) => c.id === 'rf-zustatek').label, 'Zbývající dluh');
  });

  test('záporný růst cen je povolený, volitelná pole smí zůstat prázdná', () => {
    const najem = v.zkontrolujPole(v.POLE_NAJEM, texty(v.POLE_NAJEM, { 'nk-rust-cen': '-2', 'nk-prijem': '' }, 'praha'));
    assert.deepEqual(najem.chyby, []);
    assert.equal(najem.vstup.priceGrowth, -2);
    assert.equal(najem.vstup.income, null);
    const popl = v.zkontrolujPole(v.POLE_POPLATEK, texty(v.POLE_POPLATEK, { 'pp-sazba-cnb': '' }));
    assert.deepEqual(popl.chyby, []);
    assert.equal(popl.vstup.referenceRatePct, null);
  });

  test('každé pole z vystup.js je ve stránce z buildu a id se neopakují', () => {
    const vse = [...v.POLE_REFIXACE, ...v.POLE_NAJEM, ...v.POLE_POPLATEK];
    assert.equal(new Set(vse.map((p) => p.id)).size, vse.length);
    const b = stranka.bydlometr;
    const ve = [
      ...Object.values(b.refixace.kroky).flat(), ...Object.values(b.najem.kroky).flat(), ...b.poplatek.pole,
    ].map((f) => f.id);
    for (const p of vse) assert.ok(ve.includes(p.id), `${p.id} je ve formuláři`);
  });
});

describe('BYD-03: neplatný vstup skryje výsledek', () => {
  test('s chybou se výsledek neukazuje a hláška vyjmenuje pole', () => {
    assert.deepEqual(v.stavVysledku([{ label: 'Zbývající dluh' }]), {
      platny: false, zprava: 'Výsledek neukazujeme, dokud neopravíš pole: Zbývající dluh.',
    });
    assert.equal(v.stavVysledku([{ label: 'Plocha bytu' }, { label: 'Za kolik let porovnat' }]).zprava,
      'Výsledek neukazujeme, dokud neopravíš pole: Plocha bytu, Za kolik let porovnat.');
  });

  test('bez chyb je výsledek platný', () => {
    assert.deepEqual(v.stavVysledku([]), { platny: true, zprava: '' });
  });
});

describe('BYD-04: DTI a úspora na dani ve výstupu', () => {
  test('refixace: DTI 3,1 s poznámkou, že pro vlastní bydlení není limit ČNB', () => {
    const r = v.refixace(v.vychoziRefixace(data), rules);
    const dti = r.vysledek.statistiky.find((s) => /DTI/.test(s.popis));
    assert.equal(dti.hodnota, '3,1');
    assert.match(dti.popis, /ČNB/);
  });

  test('refixace: úspora na dani z úroků 1. roku, limit podle bydlení pořízeného před 1. 1. 2021', () => {
    const vstup = v.vychoziRefixace(data);
    const s150 = v.refixace({ ...vstup, pre2021: false }, rules).vysledek.statistiky.find((s) => /na dani/.test(s.popis));
    const s300 = v.refixace({ ...vstup, pre2021: true }, rules).vysledek.statistiky.find((s) => /na dani/.test(s.popis));
    // úroky 1. roku z 2,8 mil. Kč při 5,05 % (nejlevnější varianta) jsou přes 130 000 Kč, ale pod 150 000 Kč
    assert.match(t(s150.popis), /150 000 Kč/);
    assert.match(t(s300.popis), /300 000 Kč/);
    assert.ok(/^\d[\d ]* Kč$/.test(t(s150.hodnota)));
  });

  test('nájem vs. koupě: úspora na dani v 1. roce a DTI s příjmem', () => {
    const r = v.najem({ ...v.vychoziNajem(data), income: 75_000 }, rules);
    const dan = r.vysledek.statistiky.find((s) => /na dani/.test(s.popis));
    assert.equal(t(dan.hodnota), t(kc(r.surove.taxSavingYear1)));
    const uver = r.vysledek.statistiky.find((s) => /LTV/.test(s.popis));
    assert.match(uver.popis, /DTI \d+,\d/);
  });

  test('investiční byt s DTI nad 7 → upozornění na doporučení ČNB', () => {
    const r = v.najem({ ...v.vychoziNajem(data), investment: true, ownFunds: 3_000_000, income: 40_000 }, rules);
    assert.ok(r.varovani.some((x) => /DTI/.test(x) && /7/.test(x)), r.varovani.join(' | '));
  });
});

describe('BYD-05: nad limitem LTV se výsledek nepočítá', () => {
  const brno = () => ({ ...v.vychoziNajem(data), city: 'brno', pricePerM2: 124_954, ownFunds: 1_500_000, purchaseCosts: 12_000, age: 40 });

  test('Brno 60 m², věk 40 → neplatný výsledek s chybějícími vlastními zdroji, bez grafu a tabulek', () => {
    const r = v.najem(brno(), rules);
    assert.equal(r.platny, false);
    assert.match(t(r.vysledek.cislo), /^11 448 Kč$/);
    assert.match(t(r.varovani.join(' ')), /LTV 80,2 %, ale limit je 80 %/);
    assert.equal(r.graf, '');
    assert.equal(r.tabulkaLet, '');
    assert.equal(r.tabulkaCitlivosti, '');
    assert.doesNotMatch(r.vysledek.nadpis, /vychází lépe/);
  });

  test('věk 30 → výsledek se spočítá', () => {
    const r = v.najem({ ...brno(), age: 30 }, rules);
    assert.equal(r.platny, true);
    assert.match(r.vysledek.nadpis, /vychází lépe/);
  });
});

describe('BYD-01 a BYD-02: texty kalkulačky poplatku', () => {
  const zaklad = { amount: 300_000, originalLoan: 3_500_000, contractRatePct: 4.5, referenceRatePct: null, freeUsedThisYear: false };

  test('bez průměru ČNB: strop odst. 4 a připomínka, že při průměru ≥ smluvní sazbě je nejvýš 1 000 Kč', () => {
    const r = v.poplatek({ ...zaklad, contractDate: '2024-11-12', fixStartDate: '2024-11-12', fixEndDate: '2029-11-12', paymentDate: '2026-11-12' }, rules);
    assert.equal(t(r.cislo), '2 250 Kč');
    assert.match(t(r.duvod), /3 × 0,25 % = 0,75 %/);
    assert.match(t(r.duvod), /1 000 Kč/);
  });

  test('s průměrem ČNB rovným smluvní sazbě → nejvýš 1 000 Kč', () => {
    const r = v.poplatek({ ...zaklad, referenceRatePct: 4.5, contractDate: '2024-11-12', fixStartDate: '2024-11-12', fixEndDate: '2029-11-12', paymentDate: '2026-11-12' }, rules);
    assert.equal(r.popis, 'Poplatek nejvýš');
    assert.equal(t(r.cislo), '1 000 Kč');
    assert.match(r.duvod, /§ 117a/);
  });

  test('starší smlouva 2021, splátka v den konce fixace → 0 Kč, ne „Zkontroluj smlouvu“', () => {
    const r = v.poplatek({ ...zaklad, contractDate: '2021-03-01', fixStartDate: '2021-03-01', fixEndDate: '2026-03-01', paymentDate: '2026-03-01' }, rules);
    assert.equal(t(r.cislo), '0 Kč');
    assert.match(r.duvod, /ke konci fixace je zdarma/);
  });

  test('starší smlouva mimo bezplatné případy → horní mez úrokem do konce fixace a upozornění', () => {
    const r = v.poplatek({ ...zaklad, contractDate: '2021-03-01', fixStartDate: '2021-03-01', fixEndDate: '2026-03-01', paymentDate: '2025-03-01' }, rules);
    assert.equal(r.popis, 'Poplatek nejvýš');
    assert.equal(t(r.cislo), '13 500 Kč'); // 300 000 × 4,5 % / 12 × 12
    assert.match(r.duvod, /smlouv/i);
  });

  test('stránka vypíše další bezplatné důvody § 117 odst. 3 s odkazem na zákon', () => {
    const d = stranka.bydlometr.poplatek.dalsiDuvody;
    assert.equal(d.polozky.length, 5);
    assert.match(d.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/2016-257#p117$/);
  });
});
