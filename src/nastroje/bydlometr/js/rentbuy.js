// Nájem vs. koupě: simulace po měsících. Bez vazby na DOM.
// Kupující splácí hypotéku a platí náklady vlastnictví. Nájemník platí nájem a vlastní zdroje investuje.
// Kdo má v daném měsíci nižší výdaj, investuje rozdíl. Čisté jmění:
//   kupující = hodnota bytu − zůstatek úvěru + jeho portfolio, nájemník = jeho portfolio.

import { annuityPayment, maxLtv, interestDeductionSaving } from './mortgage.js';
import { formatCZK, formatPct } from './format.js';

const val = (item) => (item && typeof item === 'object' && 'value' in item ? item.value : item);
const monthlyFactor = (annualPct) => (1 + annualPct / 100) ** (1 / 12);
/** LTV zaokrouhlené NAHORU na desetinu procenta, aby hláška nad limitem nikdy neukázala „80 %“. */
export const ltvNahoru = (ltv) => Math.ceil(ltv * 1000 - 1e-9) / 1000;

/**
 * @param {object} i vstupy (procenta jako 5 = 5 %):
 *  area, pricePerM2, rentPerM2, ownFunds, purchaseCosts, age, investment,
 *  rate, fixYears, rateAfterFix, loanYears,
 *  priceGrowth, rentGrowth, investReturn, costGrowth,
 *  repairFundPerM2Month, insuranceYear, propertyTaxYear, maintenancePct,
 *  horizonYears, taxRate, deductInterest, income (čistý měsíční příjem, nepovinné – jen pro DTI)
 */
export function simulateRentBuy(i, rules) {
  const warnings = [];
  const price = i.area * i.pricePerM2;
  const purchaseCosts = i.purchaseCosts ?? 0;
  const afterCosts = i.ownFunds - purchaseCosts;
  if (afterCosts < 0) warnings.push(`Vlastní zdroje nepokryjí ani jednorázové náklady koupě (${formatCZK(purchaseCosts)}).`);
  const down = Math.min(price, Math.max(0, afterCosts));
  const loan = price - down;
  const ltv = price > 0 ? loan / price : 0;
  const limit = maxLtv(i.age, { investment: !!i.investment }, rules);
  const ltvOk = ltv <= limit + 1e-9;
  const missingOwnFunds = ltvOk ? 0 : loan - limit * price;
  if (!ltvOk) {
    warnings.push(`Úvěr by měl LTV ${formatPct(ltvNahoru(ltv), 1)}, ale limit je ${formatPct(limit, 0)}. Na koupi chybí ${formatCZK(missingOwnFunds)} vlastních zdrojů – banka by takový úvěr neposkytla.`);
  }
  // DTI = úvěr / čistý roční příjem (ČNB); jen z této hypotéky
  const dti = i.income > 0 ? loan / (12 * i.income) : null;

  const loanMonths = Math.round(i.loanYears * 12);
  const fixMonths = Math.round(i.fixYears * 12);
  const rateAfterFix = i.rateAfterFix ?? i.rate;
  const horizon = Math.round(i.horizonYears * 12);
  const taxRate = i.taxRate ?? val(rules.interestDeduction.taxRate);
  const deductionLimit = val(rules.interestDeduction.limit);
  const deduct = i.deductInterest !== false && !i.investment;

  const gInvest = monthlyFactor(i.investReturn);
  const gPrice = monthlyFactor(i.priceGrowth);
  const baseRent = i.area * i.rentPerM2;

  let balance = loan;
  let payment = loan > 0 ? annuityPayment(loan, i.rate, loanMonths) : 0;
  const payments = { initial: payment, afterFix: payment };
  let rate = i.rate;
  let value = price;
  let buyerPortfolio = Math.max(0, afterCosts - down);
  let renterPortfolio = Math.max(0, i.ownFunds);
  let totalInterest = 0;

  const record = (year, acc) => ({
    year,
    propertyValue: value,
    balance,
    buyerPortfolio,
    renterPortfolio,
    buyerNetWorth: value - balance + buyerPortfolio,
    renterNetWorth: renterPortfolio,
    ...acc,
  });
  const emptyAcc = () => ({ buyerOutflow: 0, renterOutflow: 0, ownershipCosts: 0, interest: 0, taxSaving: 0 });
  const years = [record(0, emptyAcc())];
  let acc = emptyAcc();

  for (let m = 1; m <= horizon; m++) {
    const yearIdx = Math.floor((m - 1) / 12);
    buyerPortfolio *= gInvest;
    renterPortfolio *= gInvest;

    // Hypotéka
    let paid = 0;
    if (balance > 0 && m <= loanMonths) {
      if (m === fixMonths + 1 && fixMonths < loanMonths) {
        rate = rateAfterFix;
        payment = annuityPayment(balance, rate, loanMonths - fixMonths);
        payments.afterFix = payment;
      }
      const interest = (balance * rate) / 1200;
      let principal = payment - interest;
      if (m === loanMonths || principal > balance) principal = balance;
      balance -= principal;
      if (balance < 1e-6) balance = 0;
      paid = interest + principal;
      acc.interest += interest;
      totalInterest += interest;
    }

    // Náklady vlastnictví
    const costIndex = (1 + (i.costGrowth ?? 0) / 100) ** yearIdx;
    const ownership =
      i.area * (i.repairFundPerM2Month ?? 0) * costIndex +
      (((i.insuranceYear ?? 0) + (i.propertyTaxYear ?? 0)) / 12) * costIndex +
      ((i.maintenancePct ?? 0) / 100) * value / 12;

    // Odpočet úroků se projeví jednou ročně (roční zúčtování / daňové přiznání)
    let saving = 0;
    if (deduct && m % 12 === 0) {
      saving = interestDeductionSaving(acc.interest, taxRate, deductionLimit);
    }

    const rent = baseRent * (1 + i.rentGrowth / 100) ** yearIdx;
    const buyerOut = paid + ownership - saving;
    const diff = buyerOut - rent;
    if (diff > 0) renterPortfolio += diff;
    else buyerPortfolio -= diff;

    acc.buyerOutflow += buyerOut;
    acc.renterOutflow += rent;
    acc.ownershipCosts += ownership;
    acc.taxSaving += saving;

    value *= gPrice;

    if (m % 12 === 0 || m === horizon) {
      years.push(record(Math.ceil(m / 12), acc));
      acc = emptyAcc();
    }
  }

  const last = years.at(-1);
  const finalDiff = last.buyerNetWorth - last.renterNetWorth;
  const taxSavingYear1 = years[1]?.year === 1 && horizon >= 12 ? years[1].taxSaving : 0;
  const taxSavingTotal = years.reduce((s, y) => s + y.taxSaving, 0);
  return {
    price, loan, downPayment: down, ltv, maxLtv: limit, ltvOk, ltvExceeded: !ltvOk, missingOwnFunds, dti,
    initialRent: baseRent, payments, totalInterest, taxSavingYear1, taxSavingTotal,
    years, breakEvenYear: breakEven(years), finalDiff, warnings,
  };
}

/** První rok, od kterého je koupě trvale aspoň tak dobrá jako nájem; null, pokud v horizontu nenastane. */
function breakEven(years) {
  let candidate = null;
  for (const y of years) {
    if (y.year === 0) continue;
    if (y.buyerNetWorth >= y.renterNetWorth - 0.5) candidate ??= y.year;
    else candidate = null;
  }
  return candidate;
}

/** Citlivost: rozdíl jmění (koupě − nájem) v horizontu pro růst cen ± 2 p. b. × výnos investic ± 2 p. b. */
export function sensitivity(input, rules, deltas = [-2, 0, 2]) {
  const r2 = (x) => Math.round(x * 100) / 100;
  const priceGrowths = deltas.map((d) => r2(input.priceGrowth + d));
  const investReturns = deltas.map((d) => r2(input.investReturn + d));
  const grid = priceGrowths.map((pg) =>
    investReturns.map((ir) => simulateRentBuy({ ...input, priceGrowth: pg, investReturn: ir }, rules).finalDiff),
  );
  return { priceGrowths, investReturns, grid };
}
