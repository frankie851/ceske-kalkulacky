// Kontrolní příklady ze zadání „Dividendy ze zahraničí“ (docs/zadani.md, docs/zadani-zdanim-to.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { spocitejDividendy, ChybaDividend, jednotnyKurzZPravidel } from '../dividendy.js';

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

test('jednotný kurz: různé kurzy pro stejnou měnu → chyba', () => {
  assert.throws(
    () => spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny' }), usa(15, { zpusobKurzu: 'jednotny', kurz: 22 })], { rok: ROK }, rules),
    (e) => e.kod === 'ruzne-jednotne-kurzy',
  );
});

test('jednotný kurz za 2026 zatím nevyšel → bez ručního kurzu chyba, s ním výpočet', () => {
  assert.equal(jednotnyKurzZPravidel(rules, ROK, 'USD'), null);
  assert.throws(() => spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny', kurz: null })], { rok: ROK }, rules), (e) => e.kod === 'chybi-kurz');
  const v = spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny' }), usa(30, { zpusobKurzu: 'jednotny' })], { rok: ROK }, rules);
  assert.equal(v.zpusob, 'jednotny');
  assert.equal(v.zeme[0].zakladKc, 4600);
});

test('jednotný kurz z pravidel se použije, když je v rules', () => {
  const r = structuredClone(rules);
  r.kurzy.jednotny['2026'] = { USD: 23 };
  const v = spocitejDividendy([usa(15, { zpusobKurzu: 'jednotny', kurz: null })], { rok: ROK }, r);
  assert.equal(v.zeme[0].zakladKc, 2300);
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

test('neověřená smluvní sazba: zápočet jen do české daně a upozornění', () => {
  const v = spocitejDividendy([{ zeme: 'DE', hruba: 100, mena: 'EUR', srazeno: 26.375, kurz: 25, zpusobKurzu: 'denni' }], { rok: ROK }, rules);
  const z = v.zeme[0];
  assert.equal(z.smluvniSazba, null);
  assert.equal(z.zapocet, z.ceskaDan);
  assert.equal(z.doplatek, 0);
  assert.equal(v.upozorneni[0].id, 'smluvni-sazba');
});

test('neplatný vstup → chyba', () => {
  assert.throws(() => spocitejDividendy([usa(150)], { rok: ROK }, rules), (e) => e.kod === 'neplatny-vstup');
  assert.throws(() => spocitejDividendy([usa(15, { zeme: 'ZZ' })], { rok: ROK }, rules), (e) => e.kod === 'neplatny-vstup');
});

test('pravidla: sazba 15 %, USA 15 %, jednotný kurz 2026 null, sporná místa označená', () => {
  assert.equal(rules.dane.sazba.hodnota, 0.15);
  assert.equal(rules.dividendy.zeme.US.smluvniSazba.hodnota, 0.15);
  assert.equal(rules.kurzy.jednotny['2026'], null);
  assert.equal(rules.dividendy.umisteni.stav, 'sporne');
  for (const kod of ['DE', 'GB', 'NL', 'IE', 'FR', 'CH', 'CA']) {
    const s = rules.dividendy.zeme[kod].smluvniSazba;
    assert.ok(s.hodnota === null ? s.stav === 'neovereno' : true, kod);
  }
  // Tabulku pravidel schválil uživatel (6. 11. 2026); sporné body musí zůstat označené.
  assert.ok(rules.meta.neovereno.some((t) => /40 mil/.test(t)), 'chybí upozornění na limit 40 mil. Kč u kryptoaktiv');
  assert.ok(rules.meta.neovereno.some((t) => /§ 16a/.test(t)), 'chybí upozornění na umístění dividend v přiznání');
});
