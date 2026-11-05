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

  test('Hypoindex 6/2026: 3 500 000 Kč, 25 let, 5,30 % → 21 082 Kč ± 5 Kč', () => {
    near(annuityPayment(3_500_000, 5.3, 300), 21_082, 5);
  });

  test('reprezentativní příklad KB: 3 200 000 Kč, 30 let, 4,59 % → celkem splaceno 5 899 641 Kč (vč. poplatků) ± 0,1 %', () => {
    // Celková splatná částka obsahuje i poplatky (RPSN 4,71 %), proto tolerance 0,1 %.
    near(annuityPayment(3_200_000, 4.59, 360) * 360, 5_899_641.31, 5_899.64);
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
