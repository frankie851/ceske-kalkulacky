// Kontrolní příklady ze zadání „Dividendy ze zahraničí“ (docs/zadani.md, docs/zadani-zdanim-to.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spocitejDividendy, ChybaDividend, jednotnyKurzZPravidel, dostupneZpusoby } from '../dividendy.js';

const rules = JSON.parse(fs.readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const ROK = 2026;
const usa = (srazeno, extra = {}) => ({ zeme: 'US', hruba: 100, mena: 'USD', srazeno, kurz: 23, zpusobKurzu: 'denni', ...extra });

test('100 USD, sraženo 15 USD (W-8BEN) → základ 2 300, daň 345, zápočet 345, doplatek 0', () => {
  const v = spocitejDividendy([usa(15)], { rok: ROK }, rules);
  const z = v.zeme[0];
  assert.equal(z.zakladKc, 2300);
  assert.equal(z.ceskaDan, 345);
  assert.equal(z.zapocet, 345);
  assert.equal(z.doplatek, 0);
  assert.equal(z.preplaceno, 0);
  assert.equal(z.w8ben, false);
  assert.equal(v.celkem.doplatek, 0);
});

test('100 USD, sraženo 30 USD (bez W-8BEN) → zápočet 345, doplatek 0, přeplaceno 345', () => {
  const z = spocitejDividendy([usa(30)], { rok: ROK }, rules).zeme[0];
  assert.equal(z.srazenoKc, 690);
  assert.equal(z.zapocet, 345);
  assert.equal(z.doplatek, 0);
  assert.equal(z.preplaceno, 345);
  assert.equal(z.w8ben, true);
});

test('100 USD ze státu bez srážky → doplatek 345', () => {
  const v = spocitejDividendy([{ zeme: 'GB', hruba: 100, mena: 'USD', srazeno: 0, kurz: 23, zpusobKurzu: 'denni' }], { rok: ROK }, rules);
  assert.equal(v.zeme[0].zapocet, 0);
  assert.equal(v.zeme[0].doplatek, 345);
  assert.equal(v.celkem.doplatek, 345);
  assert.deepEqual(v.upozorneni, [], 'bez srážky není co upozorňovat na smluvní sazbu');
});

test('kombinace jednotného a denního kurzu v jednom roce → chyba s vysvětlením', () => {
  assert.throws(
    () => spocitejDividendy([usa(15), usa(15, { zpusobKurzu: 'jednotny' })], { rok: ROK }, rules),
    (e) => e instanceof ChybaDividend && e.kod === 'kombinace-kurzu' && /nejde kombinovat/.test(e.message),
  );
});

test('jednotný kurz za 2026 zatím nevyšel → nabízí se jen denní kurz, jednotný skončí chybou', () => {
  assert.deepEqual(dostupneZpusoby(rules, ROK), ['denni']);
  assert.equal(jednotnyKurzZPravidel(rules, ROK, 'USD'), null);
  assert.throws(() => spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny' })], { rok: ROK }, rules), (e) => e.kod === 'jednotny-nevydan');
});

test('jednotný kurz z pravidel se použije, když je v rules (rok 2025: GFŘ-D-75)', () => {
  assert.deepEqual(dostupneZpusoby(rules, 2025), ['denni', 'jednotny']);
  const v = spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny', kurz: null })], { rok: 2025 }, rules);
  assert.equal(v.zeme[0].zakladKc, 2184);
});

test('jednotný kurz: různé kurzy pro stejnou měnu → chyba', () => {
  assert.throws(
    () => spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny', kurz: 21.84 }), usa(15, { zpusobKurzu: 'jednotny', kurz: 22 })], { rok: 2025 }, rules),
    (e) => e.kod === 'ruzne-jednotne-kurzy',
  );
});

test('po zemích: dvě výplaty z USA se sečtou, Velká Británie zvlášť', () => {
  const v = spocitejDividendy([usa(15), usa(30), { zeme: 'GB', hruba: 100, mena: 'GBP', srazeno: 0, kurz: 29, zpusobKurzu: 'denni' }], { rok: ROK }, rules);
  assert.equal(v.zeme.length, 2);
  const us = v.zeme.find((z) => z.zeme === 'US');
  assert.equal(us.zakladKc, 4600);
  assert.equal(us.zapocet, 690);
  assert.equal(us.preplaceno, 345);
  assert.equal(v.celkem.doplatek, 435);
});

test('Nizozemsko 10 %: sraženo 15 % → zápočet jen 10 % hrubé dividendy, zbytek přeplacen', () => {
  const v = spocitejDividendy([{ zeme: 'NL', hruba: 100, mena: 'EUR', srazeno: 15, kurz: 25, zpusobKurzu: 'denni' }], { rok: ROK }, rules);
  const z = v.zeme[0];
  assert.equal(z.smluvniSazba, 0.1);
  assert.equal(z.limitSmlouvy, 250);
  assert.equal(z.zapocet, 250);
  assert.equal(z.ceskaDan, 375);
  assert.equal(z.doplatek, 125);
  assert.equal(z.preplaceno, 125);
});

test('zápočet zvlášť za každý stát (nepřelévá se mezi státy)', () => {
  const v = spocitejDividendy([
    { zeme: 'FR', hruba: 100, mena: 'EUR', srazeno: 30, kurz: 25, zpusobKurzu: 'denni' },
    { zeme: 'DE', hruba: 100, mena: 'EUR', srazeno: 0, kurz: 25, zpusobKurzu: 'denni' },
  ], { rok: ROK }, rules);
  const fr = v.zeme.find((z) => z.zeme === 'FR');
  const de = v.zeme.find((z) => z.zeme === 'DE');
  assert.equal(fr.zapocet, 250);
  assert.equal(fr.preplaceno, 500);
  assert.equal(de.doplatek, 375);
  assert.equal(v.celkem.doplatek, 500);
});

test('režim § 16a: sazba 15 % z pravidel, zápočet jen orientačně a upozornění „nejasné“', () => {
  const v = spocitejDividendy([usa(30)], { rok: ROK, rezim: 'par16a' }, rules);
  assert.equal(v.rezim, 'par16a');
  assert.equal(v.sazba, rules.dividendy.rezimy.varianty.par16a.sazba);
  assert.equal(v.zapocetOrientacni, true);
  assert.equal(v.upozorneni[0].id, 'zapocet-16a');
  assert.equal(v.upozorneni[0].stav, 'nejasne');
  assert.equal(v.zeme[0].zapocet, 345);
  const v8 = spocitejDividendy([usa(30)], { rok: ROK }, rules);
  assert.equal(v8.rezim, 'par8');
  assert.equal(v8.zapocetOrientacni, false);
  assert.ok(!v8.upozorneni.some((u) => u.id === 'zapocet-16a'));
});

test('USA s přeplatkem → upozornění „nejasné“ k W-8BEN', () => {
  const v = spocitejDividendy([usa(30)], { rok: ROK }, rules);
  assert.equal(v.upozorneni.find((u) => u.id === 'w8ben').stav, 'nejasne');
});

test('jiná země bez smluvní sazby: zápočet jen do české daně a upozornění', () => {
  const v = spocitejDividendy([{ zeme: 'XX', hruba: 100, mena: 'EUR', srazeno: 26.375, kurz: 25, zpusobKurzu: 'denni' }], { rok: ROK }, rules);
  const z = v.zeme[0];
  assert.equal(z.smluvniSazba, null);
  assert.equal(z.zapocet, z.ceskaDan);
  assert.equal(v.upozorneni[0].id, 'smluvni-sazba');
});

test('neplatný vstup → chyba', () => {
  assert.throws(() => spocitejDividendy([usa(150)], { rok: ROK }, rules), (e) => e.kod === 'neplatny-vstup');
  assert.throws(() => spocitejDividendy([usa(15, { zeme: 'ZZ' })], { rok: ROK }, rules), (e) => e.kod === 'neplatny-vstup');
  assert.throws(() => spocitejDividendy([usa(15)], { rok: ROK, rezim: 'par99' }, rules), (e) => e.kod === 'neplatny-vstup');
});

test('pravidla odpovídají ověřovacímu souboru: smluvní sazby, jednotný kurz, limity přiznání', () => {
  const sazby = { US: 0.15, DE: 0.15, GB: 0.15, NL: 0.1, IE: 0.15, FR: 0.1, CH: 0.15, CA: 0.15 };
  for (const [kod, sazba] of Object.entries(sazby)) {
    assert.equal(rules.dividendy.zeme[kod].smluvniSazba.hodnota, sazba, kod);
    assert.equal(rules.dividendy.zeme[kod].smluvniSazba.stav, 'potvrzeno', kod);
  }
  assert.equal(rules.dividendy.zeme.US.w8ben.stav, 'nejasne');
  assert.equal(rules.dividendy.rezimy.vychozi, 'par8');
  assert.equal(rules.dividendy.rezimy.varianty.par16a.sazba, 0.15);
  assert.equal(rules.dividendy.rezimy.varianty.par16a.zapocet.stav, 'nejasne');
  assert.equal(rules.kurzy.jednotny['2026'], null);
  assert.equal(rules.kurzy.kombinovatLze, false);
  assert.deepEqual(rules.kurzy.jednotny['2025'], { USD: 21.84, EUR: 24.66, GBP: 28.8, CHF: 26.33, CAD: 15.61 });
  assert.deepEqual(rules.priznani.limity.map((l) => [l.id, l.do2026, l.od2027]), [['celkem', 50000, 100000], ['vedle-zamestnani', 20000, 40000]]);
  assert.equal(rules.priznani.dividendyVLimitu.stav, 'nejasne');
});
