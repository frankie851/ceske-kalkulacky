import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { rules } from './helpers.js';
import {
  annuityPayment,
  amortizationSchedule,
  totalInterest,
  balanceAfter,
  prepaymentFee,
  prepaymentFeeFromDates,
  startedYearsBetween,
  isInAnniversaryWindow,
  newPrepaymentRulesApply,
  interestDeductionSaving,
  maxLtv,
  compareRefixOptions,
  stressTest,
  burdenLevel,
  monthsBetween,
  interestPaidInMonths,
} from '../js/mortgage.js';

const near = (actual, expected, tol, msg) =>
  assert.ok(Math.abs(actual - expected) <= tol, `${msg ?? ''} očekáváno ${expected} ± ${tol}, je ${actual}`);

describe('anuitní splátka', () => {
  test('3 500 000 Kč, 25 let, 4,94 % → 20 337 Kč ± 5 Kč (Swiss Life Hypoindex 1/2026)', () => {
    near(annuityPayment(3_500_000, 4.94, 300), 20_337, 5);
  });

  test('1 200 000 Kč, 0 %, 10 let → 10 000 Kč', () => {
    assert.equal(annuityPayment(1_200_000, 0, 120), 10_000);
  });

  test('Hypoindex 6/2026: 3 500 000 Kč, 25 let, 5,30 % → 21 077,04 Kč (přesně podle vzorce anuity)', () => {
    // a = P·r·(1+r)^n / ((1+r)^n − 1), r = 5,30 % / 12, n = 300 → 21 077,04 Kč.
    // Článek Hypoindexu uvádí 21 082 Kč – to odpovídá zaokrouhlené sazbě, ne 5,30 %.
    // Dřív test procházel jen díky toleranci ± 5 Kč (revize BYD-06).
    near(annuityPayment(3_500_000, 5.3, 300), 21_077.04, 0.005);
  });

  test('reprezentativní příklad KB: 3 200 000 Kč, 30 let, 4,59 % → měsíční splátka 16 385,50 Kč', () => {
    // Anuita × 360 = 5 898 780,41 Kč. KB uvádí „celkem splaceno“ 5 899 641,31 Kč – rozdíl 860,90 Kč
    // jsou poplatky (RPSN 4,71 %). Dřív test porovnával anuitu s částkou vč. poplatků s tolerancí 0,1 %.
    near(annuityPayment(3_200_000, 4.59, 360), 16_385.50, 0.005);
    near(annuityPayment(3_200_000, 4.59, 360) * 360, 5_899_641.31 - 860.90, 0.01);
  });

  test('nulový úvěr → 0', () => {
    assert.equal(annuityPayment(0, 5, 120), 0);
  });

  test('neplatná doba vyhodí chybu', () => {
    assert.throws(() => annuityPayment(100_000, 5, 0));
  });
});

describe('splátkový kalendář', () => {
  test('součet splátek jistiny = výše úvěru (± 1 Kč)', () => {
    for (const [p, r, n] of [[3_500_000, 4.94, 300], [1_200_000, 0, 120], [2_345_678, 6.35, 217]]) {
      const s = amortizationSchedule(p, r, n);
      assert.equal(s.length, n);
      const sum = s.reduce((a, row) => a + row.principal, 0);
      near(sum, p, 1, `úvěr ${p}:`);
      near(s.at(-1).balance, 0, 0.01, 'zůstatek na konci');
    }
  });

  test('úroky z kalendáře = Σ splátek − úvěr', () => {
    const s = amortizationSchedule(3_500_000, 4.94, 300);
    const paid = s.reduce((a, row) => a + row.payment, 0);
    near(totalInterest(3_500_000, 4.94, 300), paid - 3_500_000, 1);
  });

  test('zůstatek po k splátkách odpovídá kalendáři', () => {
    const s = amortizationSchedule(3_500_000, 4.94, 300);
    near(balanceAfter(3_500_000, 4.94, 300, 60), s[59].balance, 1);
    assert.equal(balanceAfter(3_500_000, 4.94, 300, 0), 3_500_000);
    assert.equal(balanceAfter(3_500_000, 4.94, 300, 300), 0);
  });
});

describe('poplatek za mimořádnou splátku', () => {
  const base = { amount: 500_000, originalLoan: 1_000_000, newRulesApply: true };

  test('500 000 Kč, 3 celé roky do konce fixace → 3 750 Kč', () => {
    assert.equal(prepaymentFee({ ...base, startedYearsToFixEnd: 3 }, rules).fee, 3_750);
  });

  test('500 000 Kč, 5 let do konce fixace → 5 000 Kč (strop 1 %)', () => {
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 5 }, rules);
    assert.equal(r.fee, 5_000);
    assert.equal(r.capped, true);
  });

  test('500 000 Kč ke konci fixace → 0 Kč', () => {
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 0, atFixEnd: true }, rules);
    assert.equal(r.fee, 0);
    assert.equal(r.free, true);
  });

  test('do 25 % původní výše úvěru v měsíci před výročím → 0 Kč', () => {
    const r = prepaymentFee({ amount: 250_000, originalLoan: 1_000_000, newRulesApply: true, startedYearsToFixEnd: 3, inAnniversaryWindow: true }, rules);
    assert.equal(r.fee, 0);
    assert.equal(r.free, true);
  });

  test('nad 25 % v okně před výročím → poplatek jen z přesahu', () => {
    // 400 000 − 250 000 = 150 000 × 0,75 % = 1 125
    const r = prepaymentFee({ amount: 400_000, originalLoan: 1_000_000, newRulesApply: true, startedYearsToFixEnd: 3, inAnniversaryWindow: true }, rules);
    assert.equal(r.fee, 1_125);
    assert.equal(r.chargedAmount, 150_000);
  });

  test('bezplatná splátka už letos využita → platí se z celé částky', () => {
    const r = prepaymentFee({ amount: 250_000, originalLoan: 1_000_000, newRulesApply: true, startedYearsToFixEnd: 3, inAnniversaryWindow: true, freeUsedThisYear: true }, rules);
    assert.equal(r.fee, 1_875);
  });

  test('starší smlouva i fixace → jen upozornění „zkontroluj smlouvu“', () => {
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 3, newRulesApply: false }, rules);
    assert.equal(r.fee, null);
    assert.equal(r.legacyWarning, true);
    assert.match(r.reason, /zkontroluj smlouvu/i);
  });

  test('započaté roky mezi daty', () => {
    assert.equal(startedYearsBetween('2026-01-10', '2029-01-10'), 3);
    assert.equal(startedYearsBetween('2026-01-10', '2029-01-11'), 4);
    assert.equal(startedYearsBetween('2026-01-10', '2026-03-01'), 1);
    assert.equal(startedYearsBetween('2026-01-10', '2026-01-10'), 0);
    assert.equal(startedYearsBetween('2026-01-10', '2025-01-10'), 0);
  });

  test('okno měsíc před výročím smlouvy', () => {
    assert.equal(isInAnniversaryWindow('2025-03-15', '2026-02-20', 1), true);
    assert.equal(isInAnniversaryWindow('2025-03-15', '2026-02-15', 1), true);
    assert.equal(isInAnniversaryWindow('2025-03-15', '2026-02-14', 1), false);
    assert.equal(isInAnniversaryWindow('2025-03-15', '2026-03-15', 1), false);
    assert.equal(isInAnniversaryWindow('2025-03-15', '2025-02-20', 1), false, 'před uzavřením smlouvy');
  });

  test('nová pravidla: smlouva NEBO začátek fixace od 1. 9. 2024', () => {
    assert.equal(newPrepaymentRulesApply('2024-09-01', '2024-09-01', rules), true);
    assert.equal(newPrepaymentRulesApply('2019-05-01', '2024-10-01', rules), true);
    assert.equal(newPrepaymentRulesApply('2019-05-01', '2024-05-01', rules), false);
  });

  test('výpočet z dat: 3 roky do konce fixace mimo okno → 3 750 Kč', () => {
    const r = prepaymentFeeFromDates({
      amount: 500_000, originalLoan: 3_000_000,
      contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2029-01-10', paymentDate: '2026-01-10',
    }, rules);
    assert.equal(r.fee, 3_750);
  });

  test('výpočet z dat: den konce fixace → 0 Kč', () => {
    const r = prepaymentFeeFromDates({
      amount: 500_000, originalLoan: 3_000_000,
      contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2029-01-10', paymentDate: '2029-01-10',
    }, rules);
    assert.equal(r.fee, 0);
  });

  test('výpočet z dat: 25 % v měsíci před výročím → 0 Kč', () => {
    const r = prepaymentFeeFromDates({
      amount: 750_000, originalLoan: 3_000_000,
      contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2030-06-01', paymentDate: '2026-05-20',
    }, rules);
    assert.equal(r.fee, 0);
  });
});

describe('odpočet úroků', () => {
  test('úroky 200 000 Kč/rok, sazba daně 15 % → úspora 22 500 Kč', () => {
    assert.equal(interestDeductionSaving(200_000, 0.15, rules.interestDeduction.limit.value), 22_500);
  });

  test('pod limitem se odečte vše', () => {
    assert.equal(interestDeductionSaving(100_000, 0.15, 150_000), 15_000);
  });
});

describe('LTV podle věku', () => {
  test('věk 30 → 90 %', () => assert.equal(maxLtv(30, {}, rules), 0.9));
  test('věk 40 → 80 %', () => assert.equal(maxLtv(40, {}, rules), 0.8));
  test('věk 35 → 90 %, 36 → 80 %', () => {
    assert.equal(maxLtv(35, {}, rules), 0.9);
    assert.equal(maxLtv(36, {}, rules), 0.8);
  });
  test('investiční nemovitost → 70 % (doporučení)', () => assert.equal(maxLtv(30, { investment: true }, rules), 0.7));
});

describe('refixace – varianty', () => {
  const input = {
    balance: 2_800_000,
    remainingMonths: 264,
    currentRate: 2.49,
    offeredRate: 5.79,
    competitorRate: 5.05,
    refinanceCosts: 9_000,
    savings: 300_000,
    extendMonths: 60,
    income: 75_000,
    fixYears: 5,
  };
  const res = compareRefixOptions(input, rules);
  const byId = Object.fromEntries(res.options.map((o) => [o.id, o]));

  test('obsahuje 4 varianty', () => {
    assert.deepEqual(res.options.map((o) => o.id), ['accept', 'refinance', 'prepay', 'extend']);
  });

  test('dosavadní splátka = anuita při dosavadní sazbě', () => {
    near(res.currentPayment, annuityPayment(2_800_000, 2.49, 264), 0.01);
  });

  test('přijetí nabídky: splátka a úroky', () => {
    near(byId.accept.payment, annuityPayment(2_800_000, 5.79, 264), 0.01);
    near(byId.accept.interest, totalInterest(2_800_000, 5.79, 264), 1);
    assert.equal(byId.accept.costs, 0);
  });

  test('refinancování započte náklady', () => {
    assert.equal(byId.refinance.costs, 9_000);
    near(byId.refinance.totalCost, byId.refinance.interest + 9_000, 0.01);
  });

  test('mimořádná splátka ke konci fixace: poplatek 0, nižší splátka', () => {
    assert.equal(byId.prepay.costs, 0);
    assert.equal(byId.prepay.prepaid, 300_000);
    assert.ok(byId.prepay.payment < byId.accept.payment);
  });

  test('prodloužení: nižší splátka, vyšší úroky', () => {
    assert.ok(byId.extend.payment < byId.accept.payment);
    assert.ok(byId.extend.interest > byId.accept.interest);
    assert.equal(byId.extend.months, 324);
  });

  test('nejlevnější varianta má nejnižší celkové náklady', () => {
    const min = Math.min(...res.options.map((o) => o.totalCost));
    assert.equal(res.cheapest.totalCost, min);
    assert.match(res.summary, /^Nejlevněji vychází/);
  });

  test('úspory větší než dluh splatí jen dluh', () => {
    const r = compareRefixOptions({ ...input, savings: 5_000_000 }, rules);
    const p = r.options.find((o) => o.id === 'prepay');
    assert.equal(p.prepaid, 2_800_000);
    assert.equal(p.payment, 0);
  });

  test('zátěžový test u každé varianty: +1 a +2 p. b.', () => {
    for (const o of res.options) {
      assert.equal(o.stress.length, 2);
      if (o.payment > 0) assert.ok(o.stress[0].payment > o.payment && o.stress[1].payment > o.stress[0].payment);
    }
  });
});

describe('zátěžový test a zátěž rozpočtu', () => {
  test('po fixaci se zbytek dluhu přepočte se sazbou +1 a +2 p. b.', () => {
    const st = stressTest(2_800_000, 5.79, 264, 5);
    const bal = balanceAfter(2_800_000, 5.79, 264, 60);
    near(st[0].payment, annuityPayment(bal, 6.79, 204), 0.01);
    near(st[1].payment, annuityPayment(bal, 7.79, 204), 0.01);
    assert.deepEqual(st.map((s) => s.rate), [6.79, 7.79]);
  });

  test('fixace delší než zbývající doba → bez zátěžového testu', () => {
    assert.deepEqual(stressTest(100_000, 5, 24, 5), []);
  });

  test('úrovně zátěže kolem prahu 40 %', () => {
    assert.equal(burdenLevel(20_000, 75_000, 0.4, 0.1).level, 'ok');
    assert.equal(burdenLevel(25_000, 75_000, 0.4, 0.1).level, 'warn');
    assert.equal(burdenLevel(30_000, 75_000, 0.4, 0.1).level, 'high');
    assert.equal(burdenLevel(30_000, 0, 0.4, 0.1).level, 'unknown');
  });
});

// ---------- Revize 5. 11. 2026: BYD-01 (§ 117 odst. 5 a § 117a), BYD-02 (starší smlouvy) ----------
// Zákon č. 257/2016 Sb. ve znění od 1. 9. 2024: https://www.zakonyprolidi.cz/cs/2016-257#p117
describe('BYD-01: náhrada nejvýš úrok do konce fixace a účelně vynaložené náklady (§ 117 odst. 5, § 117a)', () => {
  const base = { amount: 300_000, originalLoan: 3_500_000, newRulesApply: true };

  test('měsíc před koncem fixace, sazba 2,49 % → nejvýš úrok do konce fixace 622,50 Kč (ne 750 Kč)', () => {
    // § 117 odst. 4: 1 započatý rok × 0,25 % × 300 000 = 750 Kč
    // § 117 odst. 5: úrok z 300 000 Kč za 1 měsíc při 2,49 % = 300 000 × 0,0249 / 12 = 622,50 Kč
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 1, monthsToFixEnd: 1, contractRatePct: 2.49 }, rules);
    assert.equal(r.fee, 622.5);
    assert.equal(r.binding, 'interest');
    assert.equal(r.limits.pctCap, 750);
    assert.equal(r.limits.interestCap, 622.5);
  });

  test('průměr ČNB = smluvní sazba → úrokový rozdíl 0, náhrada nejvýš 1 000 Kč (ne 2 250 Kč)', () => {
    // § 117a odst. 1 písm. a): administrativní náklady nejvýš 1 000 Kč + úrokový rozdíl (tady 0)
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 3, monthsToFixEnd: 36, contractRatePct: 4.5, referenceRatePct: 4.5 }, rules);
    assert.equal(r.fee, 1_000);
    assert.equal(r.binding, 'costs');
  });

  test('průměr ČNB vyšší než smluvní sazba → úrokový rozdíl je záporný, náhrada nejvýš 1 000 Kč', () => {
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 3, monthsToFixEnd: 36, contractRatePct: 4.5, referenceRatePct: 5.5 }, rules);
    assert.equal(r.fee, 1_000);
  });

  test('průměr ČNB 3,5 % pod smluvní sazbou 4,5 %, 36 měsíců → platí strop § 117 odst. 4 = 2 250 Kč', () => {
    // Úrokový rozdíl podle § 117a odst. 1 písm. b)–d) a odst. 2 počítáme z mimořádné splátky jako
    // z části úvěru, ze které by se do konce fixace platil jen úrok (horní mez pro anuitní úvěr):
    // 300 000 × (4,5 % − 3,5 %) / 12 × ((1 + q)^36 − 1) / q, q = 3,5 % / 12 → 9 475 Kč.
    // Náklady podle § 117a nejvýš 1 000 + 9 475 = 10 475 Kč; úrok do konce fixace 300 000 × 4,5 % × 3 = 40 500 Kč;
    // strop odst. 4 = 3 × 0,25 % × 300 000 = 2 250 Kč. Minimum je 2 250 Kč.
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 3, monthsToFixEnd: 36, contractRatePct: 4.5, referenceRatePct: 3.5 }, rules);
    assert.equal(r.fee, 2_250);
    assert.equal(r.binding, 'pct');
    assert.equal(r.limits.interestCap, 40_500);
    const q = 0.035 / 12;
    const rozdil = 300_000 * (0.01 / 12) * (((1 + q) ** 36 - 1) / q);
    near(r.limits.costCap, 1_000 + rozdil, 0.01);
    near(r.limits.costCap, 10_475, 1);
  });

  test('malý úrokový rozdíl: 1 000 Kč + rozdíl je nižší než strop odst. 4', () => {
    // 300 000 × 0,1 % / 12 × 36 měsíců ≈ 900 Kč (+ složené úročení) → náklady ≈ 1 9xx Kč < 2 250 Kč
    const r = prepaymentFee({ ...base, startedYearsToFixEnd: 3, monthsToFixEnd: 36, contractRatePct: 4.6, referenceRatePct: 4.5 }, rules);
    assert.equal(r.binding, 'costs');
    assert.ok(r.fee > 1_000 && r.fee < 2_250, `fee ${r.fee}`);
  });

  test('bez smluvní sazby platí jen strop odst. 4 (příklady zadání se nemění)', () => {
    assert.equal(prepaymentFee({ ...base, amount: 500_000, startedYearsToFixEnd: 3 }, rules).fee, 3_750);
  });

  test('z dat: smluvní sazba 4,89 %, 3 roky do konce fixace → 3 750 Kč (úrok do konce fixace je vyšší)', () => {
    const r = prepaymentFeeFromDates({
      amount: 500_000, originalLoan: 3_000_000, contractRatePct: 4.89,
      contractDate: '2025-03-01', fixStartDate: '2025-03-01', fixEndDate: '2030-03-01', paymentDate: '2027-03-01',
    }, rules);
    assert.equal(r.fee, 3_750);
    assert.equal(r.limits.interestCap, Math.round(500_000 * 0.0489 / 12 * 36 * 100) / 100);
  });

  test('z dat: 1 měsíc před koncem fixace → měsíce do konce fixace = 1', () => {
    const r = prepaymentFeeFromDates({
      amount: 300_000, originalLoan: 3_500_000, contractRatePct: 2.49,
      contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2030-03-01', paymentDate: '2030-02-01',
    }, rules);
    assert.equal(r.fee, 622.5);
  });

  test('administrativní náklady a stropy jsou v rules.json se zdrojem', () => {
    assert.equal(rules.prepayment.adminCostCap.value, 1_000);
    assert.equal(rules.prepayment.interestCapToFixEnd.value, true);
    assert.match(rules.prepayment.adminCostCap.zdroj.pravniZaklad, /§ 117a odst. 1 písm. a\)/);
    assert.match(rules.prepayment.interestCapToFixEnd.zdroj.pravniZaklad, /§ 117 odst. 5/);
  });
});

describe('měsíce mezi daty', () => {
  test('celé měsíce a zlomek posledního', () => {
    assert.equal(monthsBetween('2026-02-01', '2026-03-01'), 1);
    assert.equal(monthsBetween('2026-11-12', '2029-11-12'), 36);
    near(monthsBetween('2026-01-01', '2026-01-16'), 15 / 31, 1e-9);
    assert.equal(monthsBetween('2026-03-01', '2026-03-01'), 0);
    assert.equal(monthsBetween('2026-03-02', '2026-03-01'), 0);
  });
});

describe('BYD-02: starší smlouvy (před 1. 9. 2024 bez nové fixace)', () => {
  test('splátka ke konci fixace → 0 Kč i podle dřívějšího znění', () => {
    const r = prepaymentFee({ amount: 500_000, originalLoan: 3_000_000, newRulesApply: false, atFixEnd: true }, rules);
    assert.equal(r.fee, 0);
    assert.equal(r.free, true);
    assert.equal(r.freeReason, 'fixEnd');
  });

  test('do 25 % celkové výše úvěru v měsíci před výročím → 0 Kč', () => {
    const r = prepaymentFee({ amount: 250_000, originalLoan: 1_000_000, newRulesApply: false, inAnniversaryWindow: true, startedYearsToFixEnd: 3 }, rules);
    assert.equal(r.fee, 0);
    assert.equal(r.freeReason, 'anniversary');
  });

  test('nad 25 % před výročím u starší smlouvy → bezplatná část se neodečte, jen upozornění', () => {
    const r = prepaymentFee({ amount: 400_000, originalLoan: 1_000_000, newRulesApply: false, inAnniversaryWindow: true, startedYearsToFixEnd: 3 }, rules);
    assert.equal(r.legacyWarning, true);
    assert.equal(r.chargedAmount, 400_000);
  });

  test('z dat: smlouva i fixace 2021, splátka v den konce fixace → 0 Kč', () => {
    const r = prepaymentFeeFromDates({
      amount: 500_000, originalLoan: 3_000_000,
      contractDate: '2021-03-01', fixStartDate: '2021-03-01', fixEndDate: '2026-03-01', paymentDate: '2026-03-01',
    }, rules);
    assert.equal(r.fee, 0);
    assert.equal(r.legacyWarning, false);
  });

  test('starší smlouva se smluvní sazbou → nejvýš úrok do konce fixace (§ 117 odst. 5 ve znění do 31. 8. 2024)', () => {
    // 500 000 × 3 % / 12 × 12 měsíců = 15 000 Kč; procentní strop pro úvěr na bydlení tehdy neplatil
    const r = prepaymentFee({ amount: 500_000, originalLoan: 3_000_000, newRulesApply: false, startedYearsToFixEnd: 1, monthsToFixEnd: 12, contractRatePct: 3 }, rules);
    assert.equal(r.legacyWarning, true);
    assert.equal(r.fee, 15_000);
    assert.match(r.reason, /zkontroluj smlouvu/i);
  });

  test('nová pravidla pro starší smlouvu až od fixace začaté PO 1. 9. 2024 (čl. XV bod 2 zákona č. 462/2023 Sb.)', () => {
    assert.equal(newPrepaymentRulesApply('2019-05-01', '2024-09-01', rules), false);
    assert.equal(newPrepaymentRulesApply('2019-05-01', '2024-09-02', rules), true);
    assert.equal(newPrepaymentRulesApply('2024-09-01', null, rules), true, 'smlouva od 1. 9. 2024');
  });

  test('další bezplatné důvody § 117 odst. 3 jsou v rules.json', () => {
    const d = rules.prepayment.otherFreeReasons.value.map((x) => x.pismeno);
    assert.deepEqual(d, ['a', 'b', 'e', 'f', 'g']);
  });
});

describe('BYD-04: DTI a úroky za rok', () => {
  const input = {
    balance: 2_800_000, remainingMonths: 264, currentRate: 2.49, offeredRate: 5.79, competitorRate: 5.05,
    refinanceCosts: 9_000, savings: 300_000, extendMonths: 60, income: 75_000, fixYears: 5,
  };

  test('DTI = dluh / roční čistý příjem: 2 800 000 / (75 000 × 12) = 3,11', () => {
    near(compareRefixOptions(input, rules).dti, 3.11, 0.01);
  });

  test('bez příjmu DTI není', () => {
    assert.equal(compareRefixOptions({ ...input, income: 0 }, rules).dti, null);
  });

  test('úroky za prvních 12 měsíců = 12 splátek − splacená jistina', () => {
    const a = annuityPayment(2_800_000, 5.79, 264);
    const ocek = 12 * a - (2_800_000 - balanceAfter(2_800_000, 5.79, 264, 12));
    near(interestPaidInMonths(2_800_000, 5.79, 264, 12), ocek, 1e-6);
    const s = amortizationSchedule(2_800_000, 5.79, 264).slice(0, 12).reduce((x, r) => x + r.interest, 0);
    near(interestPaidInMonths(2_800_000, 5.79, 264, 12), s, 0.01);
  });
});
