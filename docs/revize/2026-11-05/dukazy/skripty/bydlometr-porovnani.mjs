// Porovnání: můj referenční výpočet (bydlometr-prepocet.mjs) vs. výpočetní moduly aplikace
// (js/mortgage.js, js/rentbuy.js z kopie klonu v /tmp/revize/scratch/bydlometr). Výstup: ../bydlometr/prepocet.txt
// Spuštění: node bydlometr-porovnani.mjs [--append]   (2. běh připojí další blok – „reprodukováno 2×“)
import fs from 'node:fs';
import * as R from './bydlometr-prepocet.mjs';

const APP = '/tmp/revize/scratch/bydlometr';
const M = await import(`${APP}/js/mortgage.js`);
const RB = await import(`${APP}/js/rentbuy.js`);
const rules = JSON.parse(fs.readFileSync(`${APP}/rules.json`, 'utf8'));
const VYSTUP = new URL('../bydlometr/prepocet.txt', import.meta.url).pathname;

const bezpecne = (f) => { try { return f(); } catch (e) { return `CHYBA: ${e.message}`; } };

// Převod mých vstupů na vstupy aplikace
const toRefix = (i) => ({ balance: i.dluh, remainingMonths: i.mesicu, currentRate: i.sazbaDosavadni, offeredRate: i.sazbaNabidka, competitorRate: i.sazbaKonkurence, refinanceCosts: i.nakladyRefi, savings: i.uspory, extendMonths: i.prodlouzeniMesicu, income: i.prijem, fixYears: i.fixLet, threshold: i.prah });
const toRb = (i) => ({ area: i.plocha, pricePerM2: i.cenaM2, rentPerM2: i.najemM2, ownFunds: i.vlastni, purchaseCosts: i.nakladyKoupe, age: i.vek, investment: !!i.investicni, rate: i.sazba, fixYears: i.fixLet, rateAfterFix: i.sazbaPoFixaci, loanYears: i.splatnostLet, priceGrowth: i.rustCen, rentGrowth: i.rustNajmu, investReturn: i.vynos, costGrowth: i.rustNakladu, repairFundPerM2Month: i.fondOprav, insuranceYear: i.pojisteni, propertyTaxYear: i.danNemovitost, maintenancePct: i.udrzbaPct, horizonYears: i.horizontLet, taxRate: i.sazbaDane, deductInterest: i.odpocet });
const sum = (rows, k) => rows.reduce((a, r) => a + r[k], 0);
const fee = (p) => M.prepaymentFee({ amount: p.castka, originalLoan: p.puvodniVyse, startedYearsToFixEnd: p.zapocate, atFixEnd: p.koncFixace, inAnniversaryWindow: p.vOkne, freeUsedThisYear: p.bezplatnaVyuzita, newRulesApply: p.nova !== false }, rules).fee;

function modul() {
  const m = {};
  const set = (nazev, f) => { m[nazev] = bezpecne(f); };
  set('anuita 3 500 000 Kč, 25 let, 4,94 %', () => M.annuityPayment(3500000, 4.94, 300));
  set('anuita 1 200 000 Kč, 0 %, 10 let', () => M.annuityPayment(1200000, 0, 120));
  set('náhrada 500 000 Kč, 3 celé roky do konce fixace', () => fee({ castka: 500000, puvodniVyse: 1000000, zapocate: 3 }));
  set('náhrada 500 000 Kč, 5 let do konce fixace (strop 1 %)', () => fee({ castka: 500000, puvodniVyse: 1000000, zapocate: 5 }));
  set('náhrada 500 000 Kč ke konci fixace', () => fee({ castka: 500000, puvodniVyse: 1000000, zapocate: 0, koncFixace: true }));
  set('náhrada 250 000 Kč (25 % z 1 000 000) měsíc před výročím', () => fee({ castka: 250000, puvodniVyse: 1000000, zapocate: 3, vOkne: true }));
  set('odpočet: úroky 200 000 Kč, sazba 15 %', () => M.interestDeductionSaving(200000, 0.15, rules.interestDeduction.limit.value));
  set('LTV věk 30', () => M.maxLtv(30, {}, rules));
  set('LTV věk 40', () => M.maxLtv(40, {}, rules));
  set('kalendář: Σ jistiny = úvěr (3 500 000 / 4,94 % / 300)', () => sum(M.amortizationSchedule(3500000, 4.94, 300), 'principal'));
  set('kalendář: Σ jistiny = úvěr (2 345 678 / 6,35 % / 217)', () => sum(M.amortizationSchedule(2345678, 6.35, 217), 'principal'));
  set('kalendář: Σ jistiny = úvěr (1 200 000 / 0 % / 120)', () => sum(M.amortizationSchedule(1200000, 0, 120), 'principal'));
  set('anuita 3 500 000 Kč, 25 let, 5,30 % (Hypoindex 6/2026)', () => M.annuityPayment(3500000, 5.3, 300));
  set('anuita 1 Kč, 1 měsíc, 5 %', () => M.annuityPayment(1, 5, 1));
  set('anuita 100 000 Kč, 1 měsíc, 12 %', () => M.annuityPayment(100000, 12, 1));
  set('anuita 0 Kč', () => M.annuityPayment(0, 5, 120));
  set('anuita záporná jistina −100 000', () => M.annuityPayment(-100000, 5, 120));
  set('anuita doba 0 měsíců', () => M.annuityPayment(100000, 5, 0));
  set('anuita doba NaN', () => M.annuityPayment(100000, 5, NaN));
  set('anuita 1 mld Kč, 40 let, 20 %', () => M.annuityPayment(1e9, 20, 480));
  set('celkové úroky 3 500 000 / 4,94 % / 300', () => M.totalInterest(3500000, 4.94, 300));
  set('zůstatek po 60 splátkách 3 500 000 / 4,94 % / 300', () => M.balanceAfter(3500000, 4.94, 300, 60));
  set('zůstatek po 60 splátkách 2 800 000 / 5,79 % / 264', () => M.balanceAfter(2800000, 5.79, 264, 60));
  const sy = (a, b) => M.startedYearsBetween(a, b);
  set('započaté roky 2026-01-10 → 2029-01-10', () => sy('2026-01-10', '2029-01-10'));
  set('započaté roky 2026-01-10 → 2029-01-11', () => sy('2026-01-10', '2029-01-11'));
  set('započaté roky 2026-01-10 → 2026-03-01', () => sy('2026-01-10', '2026-03-01'));
  set('započaté roky 2026-01-10 → 2026-01-10 (stejný den)', () => sy('2026-01-10', '2026-01-10'));
  set('započaté roky 2026-01-10 → 2025-01-10 (zpět)', () => sy('2026-01-10', '2025-01-10'));
  set('započaté roky 2028-02-29 → 2029-02-28 (přestupný)', () => sy('2028-02-29', '2029-02-28'));
  set('započaté roky 2028-02-29 → 2029-03-01 (přestupný + den)', () => sy('2028-02-29', '2029-03-01'));
  set('započaté roky 2026-12-31 → 2027-01-01 (přelom roku)', () => sy('2026-12-31', '2027-01-01'));
  set('započaté roky 2026-11-05 → 2029-11-05 (výchozí formulář)', () => sy('2026-11-05', '2029-11-05'));
  set('započaté roky 2026-11-05 → 2031-11-04', () => sy('2026-11-05', '2031-11-04'));
  const w = (a, b) => M.isInAnniversaryWindow(a, b, 1);
  set('okno: smlouva 2025-03-15, splátka 2026-02-15', () => w('2025-03-15', '2026-02-15'));
  set('okno: smlouva 2025-03-15, splátka 2026-02-14', () => w('2025-03-15', '2026-02-14'));
  set('okno: smlouva 2025-03-15, splátka 2026-03-14', () => w('2025-03-15', '2026-03-14'));
  set('okno: smlouva 2025-03-15, splátka 2026-03-15 (den výročí)', () => w('2025-03-15', '2026-03-15'));
  set('okno: smlouva 2025-12-31, splátka 2026-12-01 (přelom roku)', () => w('2025-12-31', '2026-12-01'));
  set('okno: smlouva 2025-12-31, splátka 2026-11-30', () => w('2025-12-31', '2026-11-30'));
  set('okno: smlouva 2024-03-31, splátka 2025-02-28 (únor)', () => w('2024-03-31', '2025-02-28'));
  set('okno: smlouva 2025-03-15, splátka 2025-02-20 (před smlouvou)', () => w('2025-03-15', '2025-02-20'));
  const np = (a, b) => M.newPrepaymentRulesApply(a, b, rules);
  set('nová pravidla: smlouva 2019-05-01, fixace 2024-10-01', () => np('2019-05-01', '2024-10-01'));
  set('nová pravidla: smlouva 2019-05-01, fixace 2024-05-01', () => np('2019-05-01', '2024-05-01'));
  set('nová pravidla: smlouva 2024-08-31, fixace 2024-08-31', () => np('2024-08-31', '2024-08-31'));
  set('nová pravidla: smlouva 2024-09-01', () => np('2024-09-01', null));
  set('400 000 Kč v okně, 25 % z 1 000 000 zdarma, 3 roky', () => fee({ castka: 400000, puvodniVyse: 1000000, zapocate: 3, vOkne: true }));
  set('250 000 Kč v okně, bezplatná už využita, 3 roky', () => fee({ castka: 250000, puvodniVyse: 1000000, zapocate: 3, vOkne: true, bezplatnaVyuzita: true }));
  set('500 000 Kč, 4 započaté roky', () => fee({ castka: 500000, puvodniVyse: 1000000, zapocate: 4 }));
  set('500 000 Kč, 1 započatý rok', () => fee({ castka: 500000, puvodniVyse: 1000000, zapocate: 1 }));
  set('0 Kč', () => fee({ castka: 0, puvodniVyse: 1000000, zapocate: 3 }));
  set('záporná částka −100 000 Kč', () => fee({ castka: -100000, puvodniVyse: 1000000, zapocate: 3 }));
  set('výchozí formulář: 300 000 Kč, 3 500 000, 2026-11-05 → 2029-11-05 (3 roky, mimo okno)', () => M.prepaymentFeeFromDates({ amount: 300000, originalLoan: 3500000, contractDate: '2024-11-05', fixStartDate: '2024-11-05', fixEndDate: '2029-11-05', paymentDate: '2026-11-05' }, rules).fee);
  set('odst. 5: 300 000 Kč měsíc před koncem fixace, sazba 2,49 % – strop odst. 4 vs. úrok do konce fixace', () => `odst.4 ${fee({ castka: 300000, puvodniVyse: 3500000, zapocate: 1 })}; odst.5 nepočítá`);
  set('legacy: smlouva 2021, fixace 2021 → bez čísla', () => fee({ castka: 300000, puvodniVyse: 3500000, zapocate: 3, nova: false }));
  set('úroky 100 000 Kč, 15 %', () => M.interestDeductionSaving(100000, 0.15, 150000));
  set('úroky 150 000 Kč, 23 %', () => M.interestDeductionSaving(150000, 0.23, 150000));
  set('úroky 150 001 Kč, 15 %', () => M.interestDeductionSaving(150001, 0.15, 150000));
  set('úroky 0 Kč', () => M.interestDeductionSaving(0, 0.15, 150000));
  set('úroky záporné', () => M.interestDeductionSaving(-5000, 0.15, 150000));
  set('věk 35', () => M.maxLtv(35, {}, rules));
  set('věk 36', () => M.maxLtv(36, {}, rules));
  set('věk 0', () => M.maxLtv(0, {}, rules));
  set('investiční, věk 30', () => M.maxLtv(30, { investment: true }, rules));
  set('20 000 / 75 000, práh 40 %', () => M.burdenLevel(20000, 75000, 0.4, 0.1).level);
  set('22 500 / 75 000 (přesně 30 %)', () => M.burdenLevel(22500, 75000, 0.4, 0.1).level);
  set('30 000 / 75 000 (přesně 40 %)', () => M.burdenLevel(30000, 75000, 0.4, 0.1).level);
  set('příjem 0', () => M.burdenLevel(30000, 0, 0.4, 0.1).level);
  const Rx = M.compareRefixOptions(toRefix(R.refixPriklad), rules);
  set('příklad: dosavadní splátka', () => Rx.currentPayment);
  for (const o of Rx.options) {
    set(`příklad: ${o.id} splátka`, () => o.payment);
    set(`příklad: ${o.id} úroky do konce`, () => o.interest);
    set(`příklad: ${o.id} celkem`, () => o.totalCost);
    set(`příklad: ${o.id} podíl na příjmu`, () => o.burden.ratio);
    set(`příklad: ${o.id} stres +1 p. b.`, () => o.stress[0]?.payment ?? null);
    set(`příklad: ${o.id} stres +2 p. b.`, () => o.stress[1]?.payment ?? null);
  }
  set('příklad: nejlevnější varianta', () => Rx.cheapest.id);
  const rx = (i) => M.compareRefixOptions(toRefix({ ...R.refixPriklad, ...i }), rules);
  set('úspory 5 000 000 > dluh: prepay jistina', () => rx({ uspory: 5000000 }).options[2].principal);
  set('úspory 5 000 000 > dluh: prepay splátka', () => rx({ uspory: 5000000 }).options[2].payment);
  set('prodloužení 0: extend splátka = accept', () => { const r = rx({ prodlouzeniMesicu: 0 }); return r.options[3].payment - r.options[0].payment; });
  set('fixace 30 let > zbývá 22: stres prázdný', () => rx({ fixLet: 30 }).options[0].stress.length);
  set('sazba nabídky 0 %: accept splátka', () => rx({ sazbaNabidka: 0 }).options[0].payment);
  set('příjem 0: zátěž', () => rx({ prijem: 0 }).options[0].burden.level);
  set('konkurence 4 % s náklady 9 000: nejlevnější', () => rx({ sazbaKonkurence: 4 }).cheapest.id);
  set('úspory 0: nejlevnější', () => rx({ uspory: 0 }).cheapest.id);
  set('stres: 2 800 000 / 5,79 % / 264 / fix 5 → +1', () => M.stressTest(2800000, 5.79, 264, 5)[0].payment);
  set('stres: 2 800 000 / 5,79 % / 264 / fix 5 → +2', () => M.stressTest(2800000, 5.79, 264, 5)[1].payment);
  set('stres: fix 0 let → +1 hned', () => M.stressTest(2800000, 5.79, 264, 0)[0].payment);
  const sim = (i) => RB.simulateRentBuy(toRb(i), rules);
  const F = sim(R.rbPlochy);
  set('plochý případ: úvěr', () => F.loan);
  set('plochý případ: splátka', () => F.payments.initial);
  set('plochý případ: jmění koupě rok 10', () => F.years[10].buyerNetWorth);
  set('plochý případ: jmění nájem rok 10', () => F.years[10].renterNetWorth);
  set('plochý případ: jmění koupě rok 25', () => F.years[25].buyerNetWorth);
  set('plochý případ: rok zlomu', () => F.breakEvenYear);
  set('plochý + výnos 6 %: nájem rok 1', () => sim({ ...R.rbPlochy, vynos: 6 }).years[1].renterNetWorth);
  set('plochý + růst cen 4 %: hodnota rok 5', () => sim({ ...R.rbPlochy, rustCen: 4 }).years[5].propertyValue);
  set('plochý + náklady koupě 200 000 (vlastní 800 000): zlom', () => sim({ ...R.rbPlochy, nakladyKoupe: 200000, vlastni: 800000 }).breakEvenYear);
  set('plochý, nájem 50 Kč/m², ceny −5 %, 10 let: zlom', () => sim({ ...R.rbPlochy, najemM2: 50, rustCen: -5, horizontLet: 10 }).breakEvenYear);
  set('plochý, sazba 5 → 7 po fixaci: splátka po fixaci', () => sim({ ...R.rbPlochy, sazba: 5, sazbaPoFixaci: 7 }).payments.afterFix);
  set('plochý, sazba 5 → 7: zůstatek rok 5', () => sim({ ...R.rbPlochy, sazba: 5, sazbaPoFixaci: 7 }).years[5].balance);
  set('plochý, sazba 5, 20 let: zůstatek rok 20', () => sim({ ...R.rbPlochy, sazba: 5, horizontLet: 20 }).years[20].balance);
  set('plochý, sazba 5, 20 let: úroky celkem', () => sim({ ...R.rbPlochy, sazba: 5, horizontLet: 20 }).totalInterest);
  set('plochý, sazba 5, nájem 100, odpočet: rozdíl jmění rok 1 (odpočet − bez)', () => { const a = sim({ ...R.rbPlochy, sazba: 5, najemM2: 100, odpocet: true }), b = sim({ ...R.rbPlochy, sazba: 5, najemM2: 100, odpocet: false }); return (a.years[1].buyerNetWorth - a.years[1].renterNetWorth) - (b.years[1].buyerNetWorth - b.years[1].renterNetWorth); });
  set('věk 40, vlastní 300 000: LTV ok?', () => sim({ ...R.rbPlochy, vek: 40, vlastni: 300000 }).ltvOk);
  set('věk 30, vlastní 300 000: LTV ok?', () => sim({ ...R.rbPlochy, vek: 30, vlastni: 300000 }).ltvOk);
  set('vlastní 3 500 000 > cena: úvěr', () => sim({ ...R.rbPlochy, vlastni: 3500000 }).loan);
  set('vlastní 3 500 000 > cena: portfolio kupujícího rok 0', () => sim({ ...R.rbPlochy, vlastni: 3500000 }).years[0].buyerPortfolio);
  set('vlastní 0, náklady koupě 12 000: akontace / LTV', () => { const r = sim({ ...R.rbPlochy, vlastni: 0, nakladyKoupe: 12000 }); return `${r.downPayment} / ${r.ltv}`; });
  set('horizont 1 rok: počet řádků', () => sim({ ...R.rbPlochy, horizontLet: 1 }).years.length);
  set('horizont 50 let: jmění koupě', () => sim({ ...R.rbPlochy, horizontLet: 50 }).years.at(-1).buyerNetWorth);
  const P = sim(R.rbPraha);
  set('Praha výchozí: cena', () => P.price);
  set('Praha výchozí: úvěr', () => P.loan);
  set('Praha výchozí: LTV', () => P.ltv);
  set('Praha výchozí: splátka', () => P.payments.initial);
  set('Praha výchozí: nájem 1. měsíc', () => P.initialRent);
  set('Praha výchozí: jmění koupě rok 20', () => P.years[20].buyerNetWorth);
  set('Praha výchozí: jmění nájem rok 20', () => P.years[20].renterNetWorth);
  set('Praha výchozí: rozdíl rok 20', () => P.finalDiff);
  set('Praha výchozí: rok zlomu', () => P.breakEvenYear);
  set('Praha výchozí: zůstatek rok 20', () => P.years[20].balance);
  set('Praha výchozí: hodnota bytu rok 20', () => P.years[20].propertyValue);
  set('Praha výchozí: jmění koupě rok 1', () => P.years[1].buyerNetWorth);
  set('Praha výchozí: jmění nájem rok 1', () => P.years[1].renterNetWorth);
  set('Praha investiční: LTV max / odpočet vypnut (rozdíl rok 20)', () => { const r = sim({ ...R.rbPraha, investicni: true }); return `${r.maxLtv} / ${r.finalDiff}`; });
  set('Praha sazba po fixaci 7,79 %: rozdíl rok 20', () => sim({ ...R.rbPraha, sazbaPoFixaci: 7.79 }).finalDiff);
  const B = sim(R.rbBrno);
  set('Brno věk 40, vlastní 2 000 000: LTV / max / rozdíl rok 20 / zlom', () => `${B.ltv} / ${B.maxLtv} / ${B.finalDiff} / ${B.breakEvenYear}`);
  const C = RB.sensitivity(toRb(R.rbPraha), rules);
  set('citlivost Praha: osy', () => `${C.priceGrowths.join(',')} | ${C.investReturns.join(',')}`);
  C.grid.forEach((row, i) => row.forEach((v, j) => set(`citlivost Praha [${C.priceGrowths[i]} %, ${C.investReturns[j]} %]`, () => v)));
  return m;
}

const fmt = (v) => typeof v === 'number' ? (Number.isInteger(v) ? String(v) : v.toFixed(4)) : String(v);
const shodne = (a, b) => {
  if (typeof a === 'number' && typeof b === 'number') return Math.abs(a - b) <= Math.max(0.005, Math.abs(a) * 1e-9) || (Number.isNaN(a) && Number.isNaN(b));
  if (typeof a === 'string' && typeof b === 'string') {
    const na = a.match(/-?\d+(\.\d+)?/g), nb = b.match(/-?\d+(\.\d+)?/g);
    if (na && nb && na.length === nb.length && na.length) return na.every((x, i) => Math.abs(Number(x) - Number(nb[i])) <= Math.max(0.005, Math.abs(Number(x)) * 1e-9)) && a.replace(/-?\d+(\.\d+)?/g, '#') === b.replace(/-?\d+(\.\d+)?/g, '#');
    return a === b || (a.startsWith('CHYBA') && b.startsWith('CHYBA'));
  }
  return a === b;
};

const moje = R.pripady();
const mod = modul();
let shod = 0, neshod = 0;
const radky = [];
for (const p of moje) {
  const b = mod[p.nazev];
  const ok = b === undefined ? false : shodne(p.muj, b);
  if (ok) shod++; else neshod++;
  radky.push(`${ok ? 'OK ' : 'NE '} | ${p.skupina.padEnd(8)} | ${p.nazev} | můj: ${fmt(p.muj)} | modul: ${b === undefined ? '(chybí)' : fmt(b)}`);
}
const hlavicka = `# Bydlometr – nezávislý přepočet vs. modul aplikace · ${new Date().toISOString()} · node ${process.version} · pid ${process.pid}\n# shod ${shod} / neshod ${neshod} z ${moje.length}\n`;
const text = hlavicka + radky.join('\n') + '\n\n';
if (process.argv.includes('--append')) fs.appendFileSync(VYSTUP, text); else fs.writeFileSync(VYSTUP, text);
console.log(hlavicka);
for (const r of radky.filter((x) => x.startsWith('NE'))) console.log(r);
