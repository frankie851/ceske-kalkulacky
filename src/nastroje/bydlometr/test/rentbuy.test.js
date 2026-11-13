import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rules } from './helpers.js';
import { simulateRentBuy, sensitivity } from '../js/rentbuy.js';
import { annuityPayment, balanceAfter, totalInterest, interestDeductionSaving } from '../js/mortgage.js';

const near = (a, e, tol, msg) => assert.ok(Math.abs(a - e) <= tol, `${msg ?? ''} očekáváno ${e} ± ${tol}, je ${a}`);

// Jednoduchý případ bez úroků, růstů a nákladů: byt 3 mil., vlastní zdroje 600 tis., úvěr 2,4 mil. na 20 let
// → splátka 10 000 Kč; nájem 50 m² × 200 Kč = 10 000 Kč.
const flat = {
  area: 50, pricePerM2: 60_000, rentPerM2: 200,
  ownFunds: 600_000, purchaseCosts: 0, age: 30,
  rate: 0, fixYears: 5, loanYears: 20,
  priceGrowth: 0, rentGrowth: 0, investReturn: 0, costGrowth: 0,
  repairFundPerM2Month: 0, insuranceYear: 0, propertyTaxYear: 0, maintenancePct: 0,
  horizonYears: 25, taxRate: 0.15, deductInterest: false,
};

describe('nájem vs. koupě – simulace', () => {
  test('bez úroků a růstů: jmění kupujícího = splacená jistina + vlastní zdroje', () => {
    const r = simulateRentBuy(flat, rules);
    assert.equal(r.price, 3_000_000);
    assert.equal(r.loan, 2_400_000);
    near(r.payments.initial, 10_000, 1e-6);
    assert.equal(r.years.length, 26);
    assert.deepEqual([r.years[0].buyerNetWorth, r.years[0].renterNetWorth], [600_000, 600_000]);
    near(r.years[10].balance, 1_200_000, 0.01);
    near(r.years[10].buyerNetWorth, 1_800_000, 0.01);
    near(r.years[10].renterNetWorth, 600_000, 0.01);
    near(r.years[25].balance, 0, 0.01, 'po splacení');
    near(r.years[25].buyerNetWorth, 3_000_000 + 5 * 12 * 10_000, 0.01, 'byt + investovaný ušetřený nájem');
  });

  test('po splacení hypotéky kupující investuje ušetřený nájem', () => {
    const r = simulateRentBuy(flat, rules);
    // roky 21–25: kupující neplatí nic, nájemník 10 000 Kč → kupující investuje 10 000 Kč měsíčně
    near(r.years[25].buyerPortfolio, 5 * 12 * 10_000, 0.01);
  });

  test('nájemník investuje rozdíl, když je nájem levnější', () => {
    const r = simulateRentBuy({ ...flat, rentPerM2: 160 }, rules); // nájem 8 000 Kč
    near(r.years[1].renterPortfolio, 600_000 + 12 * 2_000, 0.01);
    near(r.years[1].buyerPortfolio, 0, 0.01);
  });

  test('výnos investic se úročí měsíčně (1 + r)^(1/12)', () => {
    const r = simulateRentBuy({ ...flat, investReturn: 6 }, rules);
    near(r.years[1].renterPortfolio, 600_000 * 1.06, 0.01);
  });

  test('cena nemovitosti roste o zadané procento ročně', () => {
    const r = simulateRentBuy({ ...flat, priceGrowth: 4 }, rules);
    near(r.years[5].propertyValue, 3_000_000 * 1.04 ** 5, 0.01);
  });

  test('nájem roste jednou ročně', () => {
    const r = simulateRentBuy({ ...flat, rentGrowth: 3 }, rules);
    near(r.years[1].renterOutflow, 12 * 10_000, 0.01);
    near(r.years[2].renterOutflow, 12 * 10_300, 0.01);
  });

  test('rok zlomu: koupě je od 1. roku napřed', () => {
    assert.equal(simulateRentBuy(flat, rules).breakEvenYear, 1);
  });

  test('rok zlomu: s náklady koupě se zlom posune', () => {
    const r = simulateRentBuy({ ...flat, purchaseCosts: 200_000, ownFunds: 800_000 }, rules);
    // kupující začíná o 200 000 níž, jistinu splácí 120 000 ročně → dožene v 2. roce
    assert.equal(r.breakEvenYear, 2);
  });

  test('rok zlomu: koupě se nevyplatí → null', () => {
    const r = simulateRentBuy({ ...flat, rentPerM2: 50, priceGrowth: -5, horizonYears: 10 }, rules);
    assert.equal(r.breakEvenYear, null);
    assert.ok(r.finalDiff < 0);
  });

  test('po konci fixace se splátka přepočte novou sazbou', () => {
    const base = { ...flat, rate: 5, rateAfterFix: 7 };
    const r = simulateRentBuy(base, rules);
    const n = 240;
    const bal = balanceAfter(2_400_000, 5, n, 60);
    near(r.payments.initial, annuityPayment(2_400_000, 5, n), 1e-6);
    near(r.payments.afterFix, annuityPayment(bal, 7, n - 60), 1e-6);
    near(r.years[5].balance, bal, 0.01);
  });

  test('beze změny sazby po fixaci se splatí přesně podle anuity', () => {
    const r = simulateRentBuy({ ...flat, rate: 5, horizonYears: 20 }, rules);
    near(r.years[20].balance, 0, 0.01);
    near(r.totalInterest, totalInterest(2_400_000, 5, 240), 1);
  });

  test('odpočet úroků snižuje výdaje kupujícího', () => {
    const on = simulateRentBuy({ ...flat, rate: 5, rentPerM2: 100, deductInterest: true }, rules);
    const off = simulateRentBuy({ ...flat, rate: 5, rentPerM2: 100, deductInterest: false }, rules);
    const principalY1 = 2_400_000 - balanceAfter(2_400_000, 5, 240, 12);
    const interestY1 = annuityPayment(2_400_000, 5, 240) * 12 - principalY1;
    const saving = Math.min(interestY1, 150_000) * 0.15;
    const gap = (r) => r.years[1].buyerNetWorth - r.years[1].renterNetWorth;
    near(gap(on) - gap(off), saving, 0.01, 'rozdíl jmění se zlepší o úsporu na dani');
    near(on.years[1].taxSaving, saving, 0.01);
  });

  test('náklady vlastnictví: fond oprav, pojištění, daň, údržba', () => {
    const r = simulateRentBuy({ ...flat, repairFundPerM2Month: 20, insuranceYear: 2_400, propertyTaxYear: 1_200, maintenancePct: 1 }, rules);
    // 1. rok: fond 50 × 20 × 12 = 12 000, pojištění 2 400, daň 1 200, údržba 1 % z 3 mil. = 30 000
    near(r.years[1].ownershipCosts, 12_000 + 2_400 + 1_200 + 30_000, 0.01);
  });

  test('LTV: věk 40 a 10 % vlastních zdrojů → varování', () => {
    const r = simulateRentBuy({ ...flat, age: 40, ownFunds: 300_000 }, rules);
    assert.equal(r.maxLtv, 0.8);
    assert.equal(r.ltvOk, false);
    assert.ok(r.warnings.some((w) => /LTV/.test(w)));
  });

  test('LTV: věk 30 a 10 % vlastních zdrojů → v pořádku', () => {
    const r = simulateRentBuy({ ...flat, age: 30, ownFunds: 300_000 }, rules);
    assert.equal(r.maxLtv, 0.9);
    assert.equal(r.ltvOk, true);
  });

  test('vlastní zdroje nad cenu: bez úvěru, zbytek se investuje', () => {
    const r = simulateRentBuy({ ...flat, ownFunds: 3_500_000 }, rules);
    assert.equal(r.loan, 0);
    assert.equal(r.years[0].buyerPortfolio, 500_000);
  });
});

describe('citlivost 3 × 3', () => {
  const base = { ...flat, rate: 5, priceGrowth: 4, investReturn: 6, rentPerM2: 300, horizonYears: 20 };
  const s = sensitivity(base, rules);

  test('rozměr a osy', () => {
    assert.deepEqual(s.priceGrowths, [2, 4, 6]);
    assert.deepEqual(s.investReturns, [4, 6, 8]);
    assert.equal(s.grid.length, 3);
    for (const row of s.grid) assert.equal(row.length, 3);
  });

  test('střed = základní scénář', () => {
    near(s.grid[1][1], simulateRentBuy(base, rules).finalDiff, 0.01);
  });

  test('vyšší růst cen pomáhá koupi, vyšší výnos nájmu', () => {
    for (let j = 0; j < 3; j++) assert.ok(s.grid[0][j] < s.grid[1][j] && s.grid[1][j] < s.grid[2][j]);
    for (let i = 0; i < 3; i++) assert.ok(s.grid[i][0] > s.grid[i][2]);
  });
});

// ---------- Revize 5. 11. 2026: BYD-05 (nad limitem LTV), BYD-04 (DTI, úspora na dani) ----------
describe('BYD-05: úvěr nad limitem LTV', () => {
  // Brno, 60 m² × 124 954 Kč = 7 497 240 Kč; vlastní zdroje 1 500 000 − náklady 12 000 = 1 488 000 Kč
  // → úvěr 6 009 240 Kč, LTV 80,15 %; limit 80 % → chybí 6 009 240 − 5 997 792 = 11 448 Kč.
  const brno = { ...flat, area: 60, pricePerM2: 124_954, ownFunds: 1_500_000, purchaseCosts: 12_000, age: 40, rate: 5 };

  test('věk 40: LTV 80,15 % > 80 % → ltvExceeded, hláška „80,2 %“ a chybějících 11 448 Kč', () => {
    const r = simulateRentBuy(brno, rules);
    assert.equal(r.ltvExceeded, true);
    assert.equal(Math.round(r.missingOwnFunds), 11_448);
    const w = r.warnings.find((t) => /LTV/.test(t)).replace(/[\s\u00a0\u202f]/g, ' ');
    assert.match(w, /80,2 %/);
    assert.match(w, /11 448 Kč/);
    assert.doesNotMatch(w, /LTV 80 %/);
  });

  test('těsně nad limitem se LTV v hlášce zaokrouhlí nahoru, nikdy na „80,0 %“', () => {
    // úvěr o 100 Kč nad limit 80 %: LTV 80,0033 % → „80,1 %“
    const r = simulateRentBuy({ ...flat, age: 40, ownFunds: 600_000 - 100 }, rules);
    assert.equal(r.ltvExceeded, true);
    assert.match(r.warnings.find((t) => /LTV/.test(t)), /LTV 80,1 %/);
  });

  test('věk 30 (limit 90 %) → bez překročení, bez varování', () => {
    const r = simulateRentBuy({ ...brno, age: 30 }, rules);
    assert.equal(r.ltvExceeded, false);
    assert.equal(r.missingOwnFunds, 0);
    assert.deepEqual(r.warnings, []);
  });
});

describe('BYD-04: úspora na dani a DTI v nájmu vs. koupi', () => {
  test('úspora na dani za 1. rok a celkem = interestDeductionSaving z úroků každého roku', () => {
    const r = simulateRentBuy({ ...flat, rate: 5, deductInterest: true }, rules);
    const principalY1 = 2_400_000 - balanceAfter(2_400_000, 5, 240, 12);
    const interestY1 = annuityPayment(2_400_000, 5, 240) * 12 - principalY1;
    near(r.taxSavingYear1, interestDeductionSaving(interestY1, 0.15, rules.interestDeduction.limit.value), 0.01);
    near(r.taxSavingTotal, r.years.reduce((s, y) => s + y.taxSaving, 0), 0.01);
    assert.ok(r.taxSavingTotal > r.taxSavingYear1);
  });

  test('úroky nad limit 150 000 Kč → úspora 22 500 Kč při sazbě 15 %', () => {
    // úvěr 5 mil. Kč při 7 % → úroky 1. roku přes 150 000 Kč
    const r = simulateRentBuy({ ...flat, ownFunds: 0, pricePerM2: 100_000, rate: 7, age: 30, deductInterest: true }, rules);
    assert.ok(r.years[1].interest > 150_000);
    assert.equal(r.taxSavingYear1, 22_500);
  });

  test('investiční byt → odpočet se neuplatní, úspora 0', () => {
    const r = simulateRentBuy({ ...flat, rate: 5, deductInterest: true, investment: true, ownFunds: 1_000_000 }, rules);
    assert.equal(r.taxSavingYear1, 0);
  });

  test('DTI = úvěr / roční čistý příjem (bez příjmu null)', () => {
    near(simulateRentBuy({ ...flat, income: 50_000 }, rules).dti, 2_400_000 / 600_000, 1e-9);
    assert.equal(simulateRentBuy(flat, rules).dti, null);
  });
});
