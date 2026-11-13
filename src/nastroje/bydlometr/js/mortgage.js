// Výpočty hypotéky: anuita, splátkový kalendář, poplatky za mimořádnou splátku, odpočet úroků,
// LTV a porovnání variant při refixaci. Bez vazby na DOM. Parametry pravidel přicházejí z rules.json.

import { formatCZK, formatPct, formatDate } from './format.js';

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

/** Úroky zaplacené v prvních k splátkách anuity (k splátek − splacená jistina). */
export function interestPaidInMonths(principal, annualRatePct, months, k) {
  if (principal <= 0) return 0;
  const n = Math.min(Math.max(0, k), months);
  return annuityPayment(principal, annualRatePct, months) * n - (principal - balanceAfter(principal, annualRatePct, months, n));
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

/** Počet měsíců mezi daty: celé měsíce + zbylé dny jako zlomek měsíce (0, pokud to ≤ from). */
export function monthsBetween(fromIso, toIso) {
  const from = parseISO(fromIso);
  const to = parseISO(toIso);
  if (toUTC(to) <= toUTC(from)) return 0;
  let months = (to.y - from.y) * 12 + (to.m - from.m);
  if (toUTC(addMonths(from, months)) > toUTC(to)) months -= 1;
  const start = addMonths(from, months);
  const next = addMonths(from, months + 1);
  const den = 86_400_000;
  return months + Math.round((toUTC(to) - toUTC(start)) / den) / Math.round((toUTC(next) - toUTC(start)) / den);
}

/**
 * Nová pravidla (zákon č. 462/2023 Sb., účinnost 1. 9. 2024) platí pro smlouvy uzavřené od tohoto dne
 * a pro starší smlouvy od nové fixace, která začala PO tomto dni (čl. XV bod 2: „ode dne, kdy po dni
 * nabytí účinnosti … započne běžet nové období“).
 */
export function newPrepaymentRulesApply(contractIso, fixStartIso, rules) {
  const change = toUTC(parseISO(val(rules.prepayment.lawChangeDate)));
  return toUTC(parseISO(contractIso)) >= change || (fixStartIso ? toUTC(parseISO(fixStartIso)) > change : false);
}

const haler = (x) => Math.round(x * 100) / 100;

/** Úrok z částky do konce fixace, jako by se z ní platil jen úrok (horní mez pro anuitní úvěr). */
function interestToFixEnd(amount, ratePct, months) {
  return haler((amount * ratePct) / 1200 * months);
}

/**
 * Horní mez účelně vynaložených nákladů podle § 117a: administrativní náklady (nejvýš adminCap)
 * + úrokový rozdíl (smluvní − referenční úrok). Poměrnou část podle § 117a odst. 2 počítáme z předčasně
 * splacené částky jako z části úvěru, ze které se do konce fixace platí jen úrok: rozdíl je pak
 * A · (qs − qr) · ((1 + qr)^n − 1) / qr. Pro anuitní úvěr je to horní mez (vyšší splátka rozdíl jen
 * zmenší). Když průměr ČNB není nižší než smluvní sazba, rozdíl není kladný a náklady jsou nejvýš adminCap.
 */
function costsUpperBound(amount, contractPct, referencePct, months, adminCap) {
  if (!(contractPct > referencePct)) return adminCap;
  const qs = contractPct / 1200;
  const qr = referencePct / 1200;
  const factor = qr === 0 ? months : ((1 + qr) ** months - 1) / qr;
  return haler(adminCap + amount * (qs - qr) * factor);
}

/**
 * Horní hranice náhrady za mimořádnou splátku účelového úvěru na bydlení (zákon č. 257/2016 Sb.).
 * @param {object} p
 *  amount – mimořádná splátka, originalLoan – celková (původní) výše úvěru,
 *  startedYearsToFixEnd – i započaté roky do konce fixace, monthsToFixEnd – měsíce do konce fixace (i zlomek),
 *  atFixEnd – splátka ke konci fixace, inAnniversaryWindow – v měsíci před výročím smlouvy,
 *  freeUsedThisYear – bezplatná splátka už letos využita, newRulesApply – smlouva nebo fixace podle znění od 1. 9. 2024,
 *  contractRatePct – smluvní sazba (nepovinné), referenceRatePct – průměr sazeb ČNB podle § 117a (nepovinné)
 * @returns {{fee: number|null, free: boolean, freeReason: 'fixEnd'|'anniversary'|null, capped: boolean,
 *   chargedAmount: number, rate?: number, legacyWarning: boolean, binding: 'pct'|'interest'|'costs'|null,
 *   limits: {pctCap: number|null, interestCap: number|null, costCap: number|null}, reason: string}}
 */
export function prepaymentFee(p, rules) {
  const pr = rules.prepayment;
  const amount = Math.max(0, p.amount ?? 0);
  const nove = p.newRulesApply !== false;
  const podil = val(pr.freeShareOfOriginalLoan);
  const zdarma = (freeReason, reason) => ({
    fee: 0, free: true, freeReason, capped: false, chargedAmount: 0, legacyWarning: false, binding: null,
    limits: { pctCap: null, interestCap: null, costCap: null }, reason,
  });

  // Ke konci fixace: § 117 odst. 3 písm. c), d) a odst. 5 (úrok do konce fixace je nulový) – před i od 1. 9. 2024
  if (p.atFixEnd && val(pr.freeAtFixEnd)) return zdarma('fixEnd', 'Splátka ke konci fixace je zdarma.');

  // Měsíc před výročím smlouvy: § 117 odst. 3 písm. h) (dřív písm. f)
  const freeLimit = p.inAnniversaryWindow && !p.freeUsedThisYear ? podil * (p.originalLoan ?? 0) : 0;
  const freeText = `Do ${formatPct(podil)} původní výše úvěru v měsíci před výročím smlouvy je splátka zdarma.`;
  if (freeLimit > 0 && amount <= freeLimit) return zdarma('anniversary', freeText);
  // Odečíst bezplatnou část od vyšší splátky umožňuje až znění od 1. 9. 2024 (zákon č. 462/2023 Sb., čl. XIV bod 7)
  const charged = nove ? Math.max(0, amount - freeLimit) : amount;

  const months = Number.isFinite(p.monthsToFixEnd) ? Math.max(0, p.monthsToFixEnd) : null;
  const sazba = Number.isFinite(p.contractRatePct) && p.contractRatePct >= 0 ? p.contractRatePct : null;
  const interestCap = val(pr.interestCapToFixEnd) && sazba !== null && months !== null ? interestToFixEnd(charged, sazba, months) : null;

  if (!nove) {
    // Znění do 31. 8. 2024: procentní strop pro úvěr na bydlení neplatil, jen úrok do konce fixace (odst. 5)
    return {
      fee: interestCap, free: false, freeReason: null, capped: false, chargedAmount: charged, legacyWarning: true,
      binding: interestCap === null ? null : 'interest', limits: { pctCap: null, interestCap, costCap: null },
      reason: `Smlouva i současná fixace jsou starší než ${formatDate(val(pr.lawChangeDate))}. Procentní strop pro ně neplatí, náhrada je nejvýš úrok do konce fixace – zkontroluj smlouvu.`,
    };
  }

  const years = Math.max(1, Math.ceil(p.startedYearsToFixEnd ?? 1));
  const uncapped = val(pr.feePerStartedYear) * years;
  const rate = Math.min(val(pr.feeCap), uncapped);
  const pctCap = haler(charged * rate);
  const reference = Number.isFinite(p.referenceRatePct) ? p.referenceRatePct : null;
  const costCap = sazba !== null && reference !== null && months !== null
    ? costsUpperBound(charged, sazba, reference, months, val(pr.adminCostCap)) : null;

  const kandidati = [['pct', pctCap], ['interest', interestCap], ['costs', costCap]].filter(([, x]) => x !== null);
  const [binding, fee] = kandidati.reduce((a, b) => (b[1] < a[1] ? b : a));
  const parts = [];
  if (freeLimit > 0) parts.push(`zdarma ${formatCZK(freeLimit)} (${formatPct(podil)} původní výše úvěru), zbytek ${formatCZK(charged)}`);
  parts.push(`${years} × ${formatPct(val(pr.feePerStartedYear), 2)} = ${formatPct(uncapped, 2)}${uncapped > rate ? `, strop ${formatPct(val(pr.feeCap))}` : ''}`);
  if (interestCap !== null) parts.push(`úrok do konce fixace ${formatCZK(interestCap)}`);
  if (costCap !== null) parts.push(`náklady podle § 117a nejvýš ${formatCZK(costCap)}`);
  return {
    fee, free: false, freeReason: null, capped: uncapped > rate, chargedAmount: charged, rate, legacyWarning: false,
    binding, limits: { pctCap, interestCap, costCap },
    reason: `Strop náhrady: ${parts.join('; ')}. Banka smí účtovat jen skutečné náklady, může být méně.`,
  };
}

/** Totéž z kalendářních dat (p.contractRatePct a p.referenceRatePct jsou nepovinné). */
export function prepaymentFeeFromDates(p, rules) {
  const atFixEnd = p.atFixEnd ?? (p.fixEndDate && p.paymentDate === p.fixEndDate);
  return prepaymentFee({
    amount: p.amount,
    originalLoan: p.originalLoan,
    startedYearsToFixEnd: startedYearsBetween(p.paymentDate, p.fixEndDate),
    monthsToFixEnd: monthsBetween(p.paymentDate, p.fixEndDate),
    atFixEnd,
    inAnniversaryWindow: isInAnniversaryWindow(p.contractDate, p.paymentDate, val(rules.prepayment.anniversaryWindowMonths)),
    freeUsedThisYear: !!p.freeUsedThisYear,
    newRulesApply: newPrepaymentRulesApply(p.contractDate, p.fixStartDate, rules),
    contractRatePct: p.contractRatePct ?? null,
    referenceRatePct: p.referenceRatePct ?? null,
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

  const stressDeltas = rules.model ? val(rules.model.stressDeltas) : undefined;
  const make = (id, label, principal, rate, months, costs, extra = {}) => {
    const payment = principal > 0 ? annuityPayment(principal, rate, months) : 0;
    const interest = principal > 0 ? totalInterest(principal, rate, months) : 0;
    return {
      id, label, rate, months, principal, payment,
      paymentChange: payment - currentPayment,
      interest, costs, totalCost: interest + costs,
      burden: burdenLevel(payment, income, threshold, margin),
      stress: principal > 0 ? stressTest(principal, rate, months, fixYears, stressDeltas) : [],
      ...extra,
    };
  };

  const extendYears = Math.round((extendMonths / 12) * 10) / 10;
  // Mimořádná splátka bez úspor a prodloužení o 0 let by byly totéž co přijetí nabídky (revize BYD-08).
  const options = [
    make('accept', 'Přijmout nabídku banky', balance, offeredRate, n, 0),
    make('refinance', 'Refinancovat jinde', balance, competitorRate, n, refinanceCosts, {
      note: `Včetně nákladů refinancování ${formatCZK(refinanceCosts)}.`,
    }),
    prepaid > 0 && make('prepay', 'Mimořádná splátka + nabídka banky', balance - prepaid, offeredRate, n, 0, {
      prepaid,
      note: `Splatí ${formatCZK(prepaid)} z úspor ke konci fixace (zdarma). Úspory pak chybí v rezervě a nevydělávají.`,
    }),
    extendMonths > 0 && make('extend', `Prodloužit splatnost o ${String(extendYears).replace('.', ',')} let`, balance, offeredRate, n + extendMonths, 0, {
      note: 'Nižší splátka za cenu vyšších úroků. Banka prodloužení posuzuje podle věku a příjmu.',
    }),
  ].filter(Boolean);

  const cheapest = options.reduce((best, o) => (o.totalCost < best.totalCost - 0.5 ? o : best), options[0]);
  const accept = options[0];
  const saving = accept.totalCost - cheapest.totalCost;
  let summary = `Nejlevněji vychází varianta „${cheapest.label}“: úroky a poplatky do konce splácení ${formatCZK(cheapest.totalCost)}`;
  summary += cheapest.id === 'accept' ? '.' : `, o ${formatCZK(saving)} méně než přijetí nabídky banky.`;
  if (cheapest.id === 'prepay') summary += ` Použije ale ${formatCZK(prepaid)} z úspor.`;

  // DTI = dluh / čistý roční příjem (ČNB). Jen z této hypotéky, bez dalších dluhů.
  const dti = income > 0 ? balance / (12 * income) : null;

  return { currentPayment, options, cheapest, summary, dti };
}
