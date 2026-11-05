// Výpočty hypotéky: anuita, splátkový kalendář, poplatky za mimořádnou splátku, odpočet úroků,
// LTV a porovnání variant při refixaci. Bez vazby na DOM. Parametry pravidel přicházejí z rules.json.

import { formatCZK } from './format.js';

const val = (item) => (item && typeof item === 'object' && 'value' in item ? item.value : item);
const monthlyRate = (annualPct) => annualPct / 100 / 12;

function assertTerm(months) {
  if (!Number.isFinite(months) || months <= 0) throw new RangeError('Doba splácení musí být kladná.');
}

/** Měsíční anuitní splátka při měsíčním úročení (sazba / 12). */
export function annuityPayment(principal, annualRatePct, months) {
  assertTerm(months);
  if (principal <= 0) return 0;
  const r = monthlyRate(annualRatePct);
  if (r === 0) return principal / months;
  const f = (1 + r) ** months;
  return (principal * r * f) / (f - 1);
}

/** Zůstatek jistiny po k splátkách. */
export function balanceAfter(principal, annualRatePct, months, k) {
  assertTerm(months);
  if (k <= 0) return principal;
  if (k >= months || principal <= 0) return 0;
  const r = monthlyRate(annualRatePct);
  const a = annuityPayment(principal, annualRatePct, months);
  if (r === 0) return Math.max(0, principal - a * k);
  const f = (1 + r) ** k;
  return Math.max(0, principal * f - (a * (f - 1)) / r);
}

/** Celkové úroky do konce splácení. */
export function totalInterest(principal, annualRatePct, months) {
  if (principal <= 0) return 0;
  return annuityPayment(principal, annualRatePct, months) * months - principal;
}

/**
 * Splátkový kalendář: [{month, payment, interest, principal, balance}].
 * Poslední splátka dorovná zbytek, takže součet splátek jistiny = výše úvěru.
 */
export function amortizationSchedule(principal, annualRatePct, months) {
  assertTerm(months);
  const r = monthlyRate(annualRatePct);
  const a = annuityPayment(principal, annualRatePct, months);
  const rows = [];
  let balance = principal;
  for (let m = 1; m <= months; m++) {
    const interest = balance * r;
    let principalPart = a - interest;
    if (m === months || principalPart > balance) principalPart = balance;
    balance -= principalPart;
    rows.push({ month: m, payment: interest + principalPart, interest, principal: principalPart, balance: Math.abs(balance) < 1e-6 ? 0 : balance });
  }
  return rows;
}

// ---------- data ----------

function parseISO(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) throw new RangeError(`Neplatné datum: ${iso}`);
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}
const toUTC = ({ y, m, d }) => Date.UTC(y, m - 1, d);

/** Přičte měsíce; den se omezí na poslední den cílového měsíce. */
function addMonths(date, n) {
  const total = date.y * 12 + (date.m - 1) + n;
  const y = Math.floor(total / 12);
  const m = (total % 12) + 1;
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return { y, m, d: Math.min(date.d, last) };
}

/** Počet i započatých roků od data `from` do data `to` (0, pokud to ≤ from). */
export function startedYearsBetween(fromIso, toIso) {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  if (toUTC(to) <= toUTC(from)) return 0;
  let months = (to.y - from.y) * 12 + (to.m - from.m);
  if (toUTC(addMonths(from, months)) > toUTC(to)) months -= 1;
  const exact = toUTC(addMonths(from, months)) === toUTC(to);
  return exact && months % 12 === 0 ? months / 12 : Math.floor(months / 12) + 1;
}

/** Leží datum splátky v období `windowMonths` měsíců před výročím uzavření smlouvy? */
export function isInAnniversaryWindow(contractIso, paymentIso, windowMonths = 1) {
  const c = parseISO(contractIso);
  const p = parseISO(paymentIso);
  for (const y of [p.y, p.y + 1]) {
    const years = y - c.y;
    if (years < 1) continue;
    const anniversary = addMonths(c, years * 12);
    const start = addMonths(anniversary, -windowMonths);
    if (toUTC(p) >= toUTC(start) && toUTC(p) < toUTC(anniversary)) return true;
  }
  return false;
}

/** Nová pravidla (od 1. 9. 2024) platí pro smlouvy od tohoto data nebo pro fixace začaté od něj. */
export function newPrepaymentRulesApply(contractIso, fixStartIso, rules) {
  const change = toUTC(parseISO(val(rules.prepayment.lawChangeDate)));
  return toUTC(parseISO(contractIso)) >= change || (fixStartIso ? toUTC(parseISO(fixStartIso)) >= change : false);
}

/**
 * Strop náhrady za mimořádnou splátku.
 * @param {object} p
 *  amount – mimořádná splátka, originalLoan – celková (původní) výše úvěru,
 *  startedYearsToFixEnd – i započaté roky do konce fixace, atFixEnd – splátka ke konci fixace,
 *  inAnniversaryWindow – v měsíci před výročím smlouvy, freeUsedThisYear – bezplatná splátka už letos využita,
 *  newRulesApply – smlouva nebo fixace od 1. 9. 2024
 */
export function prepaymentFee(p, rules) {
  const pr = rules.prepayment;
  const amount = Math.max(0, p.amount ?? 0);
  if (p.newRulesApply === false) {
    return {
      fee: null, free: false, capped: false, chargedAmount: amount, legacyWarning: true,
      reason: 'Smlouva i současná fixace jsou starší než 1. 9. 2024 – zkontroluj smlouvu, může platit jiný výpočet.',
    };
  }
  if (p.atFixEnd && val(pr.freeAtFixEnd)) {
    return { fee: 0, free: true, capped: false, chargedAmount: 0, legacyWarning: false, reason: 'Splátka ke konci fixace je zdarma.' };
  }
  const freeLimit = p.inAnniversaryWindow && !p.freeUsedThisYear ? val(pr.freeShareOfOriginalLoan) * (p.originalLoan ?? 0) : 0;
  const charged = Math.max(0, amount - freeLimit);
  if (charged === 0) {
    return { fee: 0, free: true, capped: false, chargedAmount: 0, legacyWarning: false, reason: 'Do 25 % původní výše úvěru v měsíci před výročím smlouvy je splátka zdarma.' };
  }
  const years = Math.max(1, Math.ceil(p.startedYearsToFixEnd ?? 1));
  const uncapped = val(pr.feePerStartedYear) * years;
  const rate = Math.min(val(pr.feeCap), uncapped);
  const fee = Math.round(charged * rate * 100) / 100;
  const parts = [];
  if (freeLimit > 0) parts.push(`zdarma ${formatCZK(freeLimit)} (25 % původní výše úvěru), zbytek ${formatCZK(charged)}`);
  parts.push(`${years} × 0,25 % = ${(uncapped * 100).toFixed(2).replace('.', ',')} %${uncapped > rate ? ', strop 1 %' : ''}`);
  return {
    fee, free: false, capped: uncapped > rate, chargedAmount: charged, rate, legacyWarning: false,
    reason: `Strop náhrady: ${parts.join('; ')}. Banka smí účtovat jen skutečné náklady, může být méně.`,
  };
}

/** Totéž z kalendářních dat. */
export function prepaymentFeeFromDates(p, rules) {
  const atFixEnd = p.atFixEnd ?? (p.fixEndDate && p.paymentDate === p.fixEndDate);
  return prepaymentFee({
    amount: p.amount,
    originalLoan: p.originalLoan,
    startedYearsToFixEnd: startedYearsBetween(p.paymentDate, p.fixEndDate),
    atFixEnd,
    inAnniversaryWindow: isInAnniversaryWindow(p.contractDate, p.paymentDate, val(rules.prepayment.anniversaryWindowMonths)),
    freeUsedThisYear: !!p.freeUsedThisYear,
    newRulesApply: newPrepaymentRulesApply(p.contractDate, p.fixStartDate, rules),
  }, rules);
}

// ---------- daně a limity ----------

/** Úspora na dani z odpočtu úroků: min(úroky, limit) × sazba daně. */
export function interestDeductionSaving(interestPaid, taxRate, limit) {
  return Math.round(Math.min(Math.max(0, interestPaid), limit) * taxRate * 100) / 100;
}

/** Max. LTV podle věku (a doporučení pro investiční nemovitost). */
export function maxLtv(age, { investment = false } = {}, rules) {
  const l = rules.ltv;
  if (investment) return val(l.investment);
  return age < val(l.youngAgeLimit) ? val(l.youngApplicant) : val(l.ownHousing);
}

/** Podíl splátky na čistém příjmu a barevná úroveň (orientační, ne limit ČNB). */
export function burdenLevel(payment, income, threshold, warnMargin = 0.1) {
  if (!(income > 0)) return { ratio: NaN, level: 'unknown' };
  const ratio = payment / income;
  const level = ratio >= threshold ? 'high' : ratio >= threshold - warnMargin ? 'warn' : 'ok';
  return { ratio, level };
}

// ---------- refixace ----------

/** Splátka po další fixaci, pokud by sazba vzrostla o +1 a +2 p. b. */
export function stressTest(balance, annualRatePct, months, fixYears, deltas = [1, 2]) {
  const fixMonths = Math.round(fixYears * 12);
  if (balance <= 0 || fixMonths >= months) return [];
  const rest = balanceAfter(balance, annualRatePct, months, fixMonths);
  return deltas.map((d) => {
    const rate = Math.round((annualRatePct + d) * 100) / 100;
    return { delta: d, rate, balance: rest, payment: annuityPayment(rest, rate, months - fixMonths) };
  });
}

/**
 * Porovná varianty při konci fixace.
 * input: balance, remainingMonths, currentRate, offeredRate, competitorRate, refinanceCosts,
 *        savings, extendMonths, income, fixYears, threshold?
 */
export function compareRefixOptions(input, rules) {
  const {
    balance, remainingMonths: n, currentRate, offeredRate, competitorRate,
    refinanceCosts = 0, savings = 0, extendMonths = 0, income = 0, fixYears = 5,
  } = input;
  const threshold = input.threshold ?? val(rules.burden.threshold);
  const margin = val(rules.burden.warnMargin);
  const currentPayment = annuityPayment(balance, currentRate, n);
  const prepaid = Math.min(Math.max(0, savings), balance);

  const make = (id, label, principal, rate, months, costs, extra = {}) => {
    const payment = principal > 0 ? annuityPayment(principal, rate, months) : 0;
    const interest = principal > 0 ? totalInterest(principal, rate, months) : 0;
    return {
      id, label, rate, months, principal, payment,
      paymentChange: payment - currentPayment,
      interest, costs, totalCost: interest + costs,
      burden: burdenLevel(payment, income, threshold, margin),
      stress: principal > 0 ? stressTest(principal, rate, months, fixYears) : [],
      ...extra,
    };
  };

  const extendYears = Math.round((extendMonths / 12) * 10) / 10;
  const options = [
    make('accept', 'Přijmout nabídku banky', balance, offeredRate, n, 0),
    make('refinance', 'Refinancovat jinde', balance, competitorRate, n, refinanceCosts, {
      note: `Včetně nákladů refinancování ${formatCZK(refinanceCosts)}.`,
    }),
    make('prepay', 'Mimořádná splátka + nabídka banky', balance - prepaid, offeredRate, n, 0, {
      prepaid,
      note: `Splatí ${formatCZK(prepaid)} z úspor ke konci fixace (zdarma). Úspory pak chybí v rezervě a nevydělávají.`,
    }),
    make('extend', `Prodloužit splatnost o ${String(extendYears).replace('.', ',')} let`, balance, offeredRate, n + extendMonths, 0, {
      note: 'Nižší splátka za cenu vyšších úroků. Banka prodloužení posuzuje podle věku a příjmu.',
    }),
  ];

  const cheapest = options.reduce((best, o) => (o.totalCost < best.totalCost - 0.5 ? o : best), options[0]);
  const accept = options[0];
  const saving = accept.totalCost - cheapest.totalCost;
  let summary = `Nejlevněji vychází varianta „${cheapest.label}“: úroky a poplatky do konce splácení ${formatCZK(cheapest.totalCost)}`;
  summary += cheapest.id === 'accept' ? '.' : `, o ${formatCZK(saving)} méně než přijetí nabídky banky.`;
  if (cheapest.id === 'prepay') summary += ` Použije ale ${formatCZK(prepaid)} z úspor.`;

  return { currentPayment, options, cheapest, summary };
}
