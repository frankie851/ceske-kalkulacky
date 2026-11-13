// Bydlometr – pole formulářů, texty, tabulky a graf výsledků. Bez DOM: stejný modul běží při buildu
// (ukázkový výsledek v bydlometr.11tydata.js) i v prohlížeči (ui.js), takže stránka po načtení JS
// nemění rozvržení, jen čísla. Výpočty jsou v js/mortgage.js a js/rentbuy.js (převzato beze změny),
// výchozí hodnoty v defaults.json, pravidla v rules.json. Žádné částky ani sazby tu nejsou natvrdo.
import { compareRefixOptions, prepaymentFeeFromDates, startedYearsBetween, newPrepaymentRulesApply, interestPaidInMonths, interestDeductionSaving } from './js/mortgage.js';
import { simulateRentBuy, sensitivity, ltvNahoru } from './js/rentbuy.js';
import { kc, cislo, procenta, datum } from '../../js/format.js';
import { prectiCislo } from '../../js/cislo-vstup.js';
import { caroveGrafy, esc } from '../../js/graf.js';

const NBSP = ' ';
const MINUS = '−';
const val = (item) => (item && typeof item === 'object' && 'value' in item ? item.value : item);

/* ---------- formátování ---------- */

/** Podíl → procenta s potřebným počtem desetinných míst: 0.0025 → „0,25 %“, 0.4 → „40 %“. */
export function podil(p) {
  const x = Math.round(p * 10000) / 100;
  return procenta(x, Number.isInteger(x) ? 0 : Number.isInteger(x * 10) ? 1 : 2);
}
/** Sazba v procentech: 5.79 → „5,79 %“. */
export const sazba = (s) => procenta(s, Number.isInteger(s) ? 0 : 2);
/** Podíl zaokrouhlený na celá procenta: 0.2345 → „23 %“. */
export const cele = (p) => procenta(Math.round(p * 100));
/** LTV nad limitem na desetinu procenta, zaokrouhlené nahoru: 0.80015 → „80,1 %“ (nikdy „80 %“). */
export const ltvNadLimitem = (ltv) => procenta(Math.round(ltvNahoru(ltv) * 1000) / 10, 1);
/** DTI na jedno desetinné místo: 3.111 → „3,1“. */
export const dtiText = (x) => cislo(Math.round(x * 10) / 10, 1);
/** Rozdíl se znaménkem: +1 234 Kč, −1 234 Kč, 0 Kč. */
export function rozdil(n) {
  const r = Math.round(n);
  if (r === 0) return kc(0);
  return `${r > 0 ? '+' : MINUS}${kc(Math.abs(r))}`;
}
/** 1 rok, 2 roky, 5 let, 2,5 roku. */
export function roky(n) {
  if (!Number.isInteger(n)) return `${cislo(n, 1)}${NBSP}roku`;
  if (n === 1) return `1${NBSP}rok`;
  if (n >= 2 && n <= 4) return `${n}${NBSP}roky`;
  return `${cislo(n)}${NBSP}let`;
}
/** Hodnota do pole formuláře: celá čísla s mezerou po tisících, desetinná s čárkou. */
export function hodnotaPole(v) {
  if (!Number.isFinite(v)) return '';
  if (Number.isInteger(v)) return cislo(v).replace(/ /g, ' ');
  return String(+v.toFixed(2)).replace('.', ',');
}
/** Miliony na ose grafu: 2 500 000 → „2,5 mil.“ */
const mil = (n) => (n === 0 ? '0' : `${cislo(n / 1e6, Math.abs(n) % 1e6 === 0 ? 0 : 1)}${NBSP}mil.`);
/** Krátký rozdíl v tabulce citlivosti: +1,2 mil. / −850 tis. */
function kratce(n) {
  const a = Math.abs(n);
  const z = n >= 0.5 ? '+' : n <= -0.5 ? MINUS : '';
  if (a >= 1e6) return `${z}${cislo(a / 1e6, 1)}${NBSP}mil.`;
  if (a >= 1000) return `${z}${cislo(Math.round(a / 1000))}${NBSP}tis.`;
  return `${z}${cislo(Math.round(a))}`;
}

/* ---------- pole formulářů ---------- */

// zdroj: "defaults:cesta" | "rules:cesta" | "mesto:klic" (položka zvoleného města).
// meritko: hodnota v poli = value × meritko (práh 0,4 → 40 %). zaporne: povolit záporné číslo.
// min/max: rozsah čísla v poli (pojistka proti překlepu). volitelne: prázdné pole = null, bez chyby.
export const POLE_REFIXACE = [
  { id: 'rf-zustatek', klic: 'balance', label: 'Zbývající dluh', jednotka: 'Kč', zdroj: 'defaults:refixExample.balance', kladne: true, krok: 1 },
  { id: 'rf-zbyva', klic: 'remainingYears', label: 'Zbývající doba splácení', jednotka: 'let', zdroj: 'defaults:refixExample.remainingYears', kladne: true, inputmode: 'decimal', krok: 1, min: 0, max: 50 },
  { id: 'rf-sazba-dosud', klic: 'currentRate', label: 'Dosavadní sazba', jednotka: '%', zdroj: 'defaults:refixExample.currentRate', inputmode: 'decimal', krok: 1 },
  { id: 'rf-prijem', klic: 'income', label: 'Čistý měsíční příjem domácnosti', jednotka: 'Kč', zdroj: 'defaults:refixExample.income', napoveda: 'Jen pro podíl splátky na příjmu.', krok: 1 },
  { id: 'rf-sazba-banky', klic: 'offeredRate', label: 'Sazba, kterou nabízí tvoje banka', jednotka: '%', zdroj: 'defaults:rates.averageOffer', inputmode: 'decimal', napoveda: 'Předvyplněná je průměrná nabídková sazba.', krok: 2 },
  { id: 'rf-fixace', klic: 'fixYears', label: 'Délka nové fixace', jednotka: 'let', zdroj: 'defaults:refixExample.fixYears', kladne: true, krok: 2 },
  { id: 'rf-sazba-jinde', klic: 'competitorRate', label: 'Sazba jiné banky', jednotka: '%', zdroj: 'defaults:rates.refinance', inputmode: 'decimal', napoveda: 'Předvyplněná je průměrná sazba refinancovaných hypoték.', krok: 2 },
  { id: 'rf-odhad', klic: 'valuation', label: 'Odhad nemovitosti', jednotka: 'Kč', zdroj: 'defaults:refinanceCosts.valuation', bezZdroje: true, napoveda: 'Banky ho při refinancování často platí. Odhad, přepiš podle nabídky.', krok: 2 },
  { id: 'rf-katastr', klic: 'cadastreFee', label: 'Katastr: vklad a výmaz zástavy', jednotka: 'Kč', zdroj: 'defaults:refinanceCosts.cadastreFee', napoveda: 'Správní poplatky za vklad nové zástavy a výmaz staré.', krok: 2 },
  { id: 'rf-ostatni', klic: 'otherCosts', label: 'Ostatní poplatky za refinancování', jednotka: 'Kč', zdroj: 'defaults:refinanceCosts.other', napoveda: 'Zpracování, čerpání a podobně.', krok: 2 },
  { id: 'rf-uspory', klic: 'savings', label: 'Úspory na mimořádnou splátku', jednotka: 'Kč', zdroj: 'defaults:refixExample.savings', napoveda: 'Ke konci fixace se dají splatit zdarma.', krok: 3 },
  { id: 'rf-prodlouzit', klic: 'extendYears', label: 'Prodloužit splatnost o', jednotka: 'let', zdroj: 'defaults:refixExample.extendYears', krok: 3 },
  { id: 'rf-prah', klic: 'threshold', label: 'Hranice zátěže rozpočtu', jednotka: '%', zdroj: 'rules:burden.threshold', meritko: 100, inputmode: 'decimal', bezZdroje: true, napoveda: 'Kolik procent příjmu smí splátka spolknout. Orientační hodnota, není to limit ČNB.', krok: 3, min: 0, max: 100 },
];

export const POLE_NAJEM = [
  { id: 'nk-plocha', klic: 'area', label: 'Plocha bytu', jednotka: 'm²', zdroj: 'defaults:rentbuyExample.area', kladne: true, inputmode: 'decimal', krok: 1 },
  { id: 'nk-cena-m2', klic: 'pricePerM2', label: 'Cena za m²', jednotka: 'Kč', zdroj: 'mesto:pricePerM2', kladne: true, krok: 1 },
  { id: 'nk-najem-m2', klic: 'rentPerM2', label: 'Nájem za m² měsíčně', jednotka: 'Kč', zdroj: 'mesto:rentPerM2', inputmode: 'decimal', krok: 1 },
  { id: 'nk-vlastni', klic: 'ownFunds', label: 'Vlastní zdroje', jednotka: 'Kč', zdroj: 'defaults:rentbuyExample.ownFunds', napoveda: 'Při koupi jdou do bytu, při nájmu se investují.', krok: 2 },
  { id: 'nk-naklady-koupe', klic: 'purchaseCosts', label: 'Jednorázové náklady koupě', jednotka: 'Kč', zdroj: 'defaults:ownership.purchaseCosts', bezZdroje: true, napoveda: 'Vklad do katastru, odhad, ověření podpisů. Bez provize realitky.', krok: 2 },
  { id: 'nk-vek', klic: 'age', label: 'Věk žadatele', jednotka: 'let', zdroj: 'defaults:rentbuyExample.age', kladne: true, krok: 2,
    napoveda: ({ pravidla: { ltv } }) => `Mladším ${val(ltv.youngAgeLimit)} let půjčí banka až ${cele(val(ltv.youngApplicant))} ceny bytu, ostatním ${cele(val(ltv.ownHousing))}.` },
  { id: 'nk-splatnost', klic: 'loanYears', label: 'Splatnost hypotéky', jednotka: 'let', zdroj: 'defaults:rentbuyExample.loanYears', kladne: true, krok: 2, min: 1, max: 50 },
  { id: 'nk-sazba', klic: 'rate', label: 'Úroková sazba', jednotka: '%', zdroj: 'defaults:rates.averageOffer', inputmode: 'decimal', krok: 2 },
  { id: 'nk-fixace', klic: 'fixYears', label: 'Fixace', jednotka: 'let', zdroj: 'defaults:rentbuyExample.fixYears', kladne: true, krok: 2 },
  { id: 'nk-prijem', klic: 'income', label: 'Čistý měsíční příjem domácnosti', jednotka: 'Kč', zdroj: 'defaults:rentbuyExample.income', volitelne: true, bezZdroje: true, napoveda: 'Nepovinné. Jen pro ukazatel DTI (úvěr k ročnímu čistému příjmu).', krok: 2 },
  { id: 'nk-sazba-po', klic: 'rateAfterFix', label: 'Sazba po skončení fixace', jednotka: '%', zdroj: 'defaults:rates.averageOffer', inputmode: 'decimal', bezZdroje: true, napoveda: 'Tvůj odhad. Platí až do konce splácení.', krok: 2 },
  { id: 'nk-fond-oprav', klic: 'repairFundPerM2Month', label: 'Fond oprav za m² měsíčně', jednotka: 'Kč', zdroj: 'defaults:ownership.repairFundPerM2Month', inputmode: 'decimal', krok: 3 },
  { id: 'nk-pojisteni', klic: 'insuranceYear', label: 'Pojištění ročně', jednotka: 'Kč', zdroj: 'defaults:ownership.insuranceYear', krok: 3 },
  { id: 'nk-dan', klic: 'propertyTaxYear', label: 'Daň z nemovitosti ročně', jednotka: 'Kč', zdroj: 'mesto:propertyTaxPerM2Year', bezZdroje: true, napoveda: 'Odhad podle města a plochy (zákon č. 338/1992 Sb.). Ověř vyhlášku své obce.', krok: 3 },
  { id: 'nk-udrzba', klic: 'maintenancePct', label: 'Údržba a opravy ročně', jednotka: '% ceny', zdroj: 'defaults:ownership.maintenancePct', inputmode: 'decimal', krok: 3 },
  { id: 'nk-rust-cen', klic: 'priceGrowth', label: 'Růst cen nemovitostí ročně', jednotka: '%', zdroj: 'defaults:assumptions.priceGrowth', inputmode: 'decimal', zaporne: true, krok: 4 },
  { id: 'nk-rust-najmu', klic: 'rentGrowth', label: 'Růst nájmů ročně', jednotka: '%', zdroj: 'defaults:assumptions.rentGrowth', inputmode: 'decimal', krok: 4 },
  { id: 'nk-vynos', klic: 'investReturn', label: 'Výnos investic ročně', jednotka: '%', zdroj: 'defaults:assumptions.investReturn', inputmode: 'decimal', krok: 4 },
  { id: 'nk-rust-nakladu', klic: 'costGrowth', label: 'Růst ostatních nákladů ročně', jednotka: '%', zdroj: 'defaults:assumptions.costGrowth', inputmode: 'decimal', krok: 4 },
  { id: 'nk-horizont', klic: 'horizonYears', label: 'Za kolik let porovnat', jednotka: 'let', zdroj: 'defaults:rentbuyExample.horizonYears', kladne: true, krok: 4, min: 1, max: 50 },
];

export const POLE_POPLATEK = [
  { id: 'pp-castka', klic: 'amount', label: 'Mimořádná splátka', jednotka: 'Kč', zdroj: 'defaults:refixExample.savings', kladne: true },
  { id: 'pp-puvodni', klic: 'originalLoan', label: 'Původní výše úvěru', jednotka: 'Kč', zdroj: 'defaults:refixExample.originalLoan', kladne: true, napoveda: ({ pravidla }) => `Z ní se počítá bezplatných ${podil(val(pravidla.prepayment.freeShareOfOriginalLoan))} před výročím smlouvy.` },
  { id: 'pp-sazba', klic: 'contractRatePct', label: 'Smluvní úroková sazba', jednotka: '%', zdroj: 'defaults:refixExample.contractRate', inputmode: 'decimal', volitelne: true, bezZdroje: true, min: 0, max: 30,
    napoveda: 'Sazba současné fixace podle smlouvy. Poplatek nesmí být vyšší než úrok do konce fixace.' },
  { id: 'pp-sazba-cnb', klic: 'referenceRatePct', label: 'Průměrná sazba ČNB pro srovnatelnou fixaci', jednotka: '%', zdroj: '', inputmode: 'decimal', volitelne: true, bezZdroje: true, min: 0, max: 30,
    napoveda: 'Nepovinné. ČNB zveřejňuje průměry podle § 117a zákona o spotřebitelském úvěru. Kterou skupinu použít, ti řekne banka.' },
];
export const DATA_POPLATKU = [
  { id: 'pp-smlouva', klic: 'contractDate', label: 'Datum uzavření smlouvy' },
  { id: 'pp-zacatek', klic: 'fixStartDate', label: 'Začátek současné fixace' },
  { id: 'pp-konec', klic: 'fixEndDate', label: 'Konec současné fixace' },
  { id: 'pp-splatka', klic: 'paymentDate', label: 'Datum mimořádné splátky' },
];

const cesta = (obj, c) => c.split('.').reduce((o, k) => (o == null ? undefined : o[k]), obj);

/** Položka {value, source, …} pro pole; u „mesto:“ z vybraného města. */
export function polozka(pole, data, mesto) {
  if (!pole.zdroj) return undefined;
  const [soubor, c] = pole.zdroj.split(':');
  if (soubor === 'mesto') return data.defaults.cities[mesto]?.[c];
  return cesta(soubor === 'rules' ? data.pravidla : data.defaults, c);
}

/** Zdroj výchozí hodnoty pod polem: „Zdroj: Swiss Life Hypoindex, říjen 2026 (k 7. 10. 2026).“ */
export function textZdroje(item) {
  if (!item || !item.source || /^(ukázková hodnota|návrh aplikace|zadání)/i.test(item.source)) return '';
  if (/^předpoklad/i.test(item.source)) {
    const s = item.short && /^předpoklad/i.test(item.short) ? item.short : 'odhad, přepiš podle sebe';
    return `${s.charAt(0).toUpperCase()}${s.slice(1)}.`;
  }
  const kratky = item.short ?? item.source.split(/ – | \(|: |; /)[0].replace(/,$/, '');
  return `Zdroj: ${kratky} (k${NBSP}${datum(item.date)}).`;
}

/** Nápověda pod polem: vlastní text a zdroj výchozí hodnoty. */
export function napovedaPole(pole, data, mesto) {
  const casti = [];
  if (pole.napoveda) casti.push(typeof pole.napoveda === 'function' ? pole.napoveda(data) : pole.napoveda);
  if (!pole.bezZdroje) {
    const z = textZdroje(polozka(pole, data, mesto));
    if (z) casti.push(z);
  }
  return casti.join(' ');
}

/** Výchozí hodnota pro výpočet (bez měřítka pole). */
export function vychoziHodnota(pole, data, mesto) {
  const v = val(polozka(pole, data, mesto));
  return v === undefined ? null : v;
}

/**
 * Přečte texty polí formuláře (čistá funkce, bez DOM). texty = { id: text }.
 * Vrací { vstup: { klic: číslo }, chyby: [{ id, label, zprava }] }. Číslo se čte sdíleným prectiCislo.
 */
export function zkontrolujPole(seznam, texty) {
  const vstup = {};
  const chyby = [];
  for (const p of seznam) {
    const n = prectiCislo(texty[p.id]);
    let zprava = '';
    if (n === null && p.volitelne) { vstup[p.klic] = null; continue; }
    if (n === null) zprava = 'Vyplň číslo.';
    else if (Number.isNaN(n)) zprava = 'Zadej číslo, bez písmen.';
    else if (n < 0 && !p.zaporne) zprava = 'Číslo nemůže být záporné.';
    else if (p.kladne && n === 0) zprava = 'Zadej číslo větší než 0.';
    else if (p.min !== undefined && p.max !== undefined && (n < p.min || n > p.max)) zprava = `Zadej číslo od ${p.min} do ${p.max}.`;
    if (zprava) chyby.push({ id: p.id, label: p.label, zprava });
    else vstup[p.klic] = n / (p.meritko || 1);
  }
  return { vstup, chyby };
}

/** Stav výsledku při chybách ve formuláři (BYD-03): s chybou se výsledek neukazuje. */
export function stavVysledku(chyby) {
  if (!chyby.length) return { platny: true, zprava: '' };
  return { platny: false, zprava: `Výsledek neukazujeme, dokud neopravíš pole: ${chyby.map((c) => c.label).join(', ')}.` };
}

/** Text do pole formuláře z hodnoty pro výpočet (práh 0,4 → „40“). */
export const textPole = (pole, hodnota) => (hodnota === null || hodnota === undefined ? '' : hodnotaPole(Math.round(hodnota * (pole.meritko || 1) * 100) / 100));

/** Daň z nemovitosti za rok: plocha × odhad na m² pro město. */
export const danZNemovitosti = (data, mesto, plocha) =>
  Math.round((Number.isFinite(plocha) ? plocha : 0) * val(data.defaults.cities[mesto].propertyTaxPerM2Year));

/* ---------- výchozí vstupy (build i prohlížeč) ---------- */

/** ISO datum posunuté o celé roky (29. 2. → 28. 2.). */
export function posunRoky(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const posledni = new Date(Date.UTC(y + n, m, 0)).getUTCDate();
  return `${y + n}-${String(m).padStart(2, '0')}-${String(Math.min(d, posledni)).padStart(2, '0')}`;
}

export function vychoziRefixace(data) {
  const v = { pre2021: false };
  for (const p of POLE_REFIXACE) v[p.klic] = vychoziHodnota(p, data);
  return v;
}

/** Kalkulačka poplatku: smlouva i fixace začaly 2 roky před ověřením pravidel, fixace na 5 let,
 *  splátka v den ověření (deterministické, nezávisí na dnešním datu). */
export function vychoziPoplatek(data) {
  const den = data.pravidla.meta.overeno;
  const zacatek = posunRoky(den, -2);
  const v = { contractDate: zacatek, fixStartDate: zacatek, fixEndDate: posunRoky(zacatek, val(data.defaults.refixExample.fixYears)), paymentDate: den, freeUsedThisYear: false };
  for (const p of POLE_POPLATEK) v[p.klic] = vychoziHodnota(p, data);
  return v;
}

export function vychoziNajem(data) {
  const mesto = val(data.defaults.rentbuyExample.city);
  const v = { city: mesto };
  for (const p of POLE_NAJEM) v[p.klic] = vychoziHodnota(p, data, mesto);
  v.propertyTaxYear = danZNemovitosti(data, mesto, v.area);
  v.taxRate = val(data.pravidla.interestDeduction.taxRate);
  v.deductInterest = true;
  v.investment = false;
  return v;
}

/** Možnosti selectů a voleb pro šablonu. */
export function moznosti(data, v) {
  const d = data.pravidla.interestDeduction;
  return {
    mesta: Object.entries(data.defaults.cities).map(([id, c]) => ({ hodnota: id, text: c.name, vybrano: id === v.city })),
    sazbyDane: [d.taxRate, d.taxRateHigh].map((s) => ({ hodnota: String(val(s)), text: podil(val(s)), vybrano: val(s) === v.taxRate })),
  };
}

/* ---------- shrnutí kroků ---------- */

export function shrnutiRefixace(v) {
  return {
    1: `${kc(v.balance)}, ${roky(v.remainingYears)}, sazba ${sazba(v.currentRate)}`,
    2: `banka ${sazba(v.offeredRate)}, jinde ${sazba(v.competitorRate)}, refinancování ${kc(v.valuation + v.cadastreFee + v.otherCosts)}`,
    3: `úspory ${kc(v.savings)}, prodloužení o ${roky(v.extendYears)}, hranice ${podil(v.threshold)}`,
  };
}

export function shrnutiNajmu(v, data) {
  const mesto = data.defaults.cities[v.city]?.name ?? '';
  return {
    1: `${mesto}, ${cislo(v.area, Number.isInteger(v.area) ? 0 : 1)}${NBSP}m², ${kc(v.pricePerM2)} za m²`,
    2: `vlastní zdroje ${kc(v.ownFunds)}, sazba ${sazba(v.rate)}, ${roky(v.loanYears)}`,
    3: `fond oprav ${kc(v.repairFundPerM2Month)}/m², daň ${kc(v.propertyTaxYear)}, údržba ${sazba(v.maintenancePct)}`,
    4: `ceny ${sazba(v.priceGrowth)}, nájmy ${sazba(v.rentGrowth)}, výnos ${sazba(v.investReturn)}, ${roky(v.horizonYears)}`,
  };
}

/* ---------- tabulky (stejné značky jako makro tabulka) ---------- */

const bunkaHtml = (b) => (b && typeof b === 'object' && 'html' in b ? b.html : esc(b));

/**
 * @param {{caption:string, popisek?:string, sloupce:string[], radky:any[][], vpravo?:number[], stack?:boolean,
 *          zvyraznit?:number, atributy?:string[], tridy?:string[][]}} t
 */
export function tabulka({ caption, popisek, sloupce, radky, vpravo = [], stack = true, zvyraznit = -1, atributy = [], tridy = [] }) {
  const r = (i) => (vpravo.includes(i) ? ' class="r"' : '');
  const hlava = `<thead><tr>${sloupce.map((s, i) => `<th scope="col"${r(i)}>${esc(s)}</th>`).join('')}</tr></thead>`;
  const telo = radky.map((radek, ri) => {
    const bunky = radek.map((b, i) => {
      if (i === 0) return `<th scope="row">${bunkaHtml(b)}</th>`;
      const t = [vpravo.includes(i) ? 'r' : '', ...(tridy[ri]?.[i] ? [tridy[ri][i]] : [])].filter(Boolean).join(' ');
      return `<td${t ? ` class="${t}"` : ''}${stack ? ` data-label="${esc(sloupce[i])}"` : ''}>${bunkaHtml(b)}</td>`;
    }).join('');
    return `<tr${ri === zvyraznit ? ' class="hl"' : ''}${atributy[ri] ? ` ${atributy[ri]}` : ''}>${bunky}</tr>`;
  }).join('');
  return `<div class="table-wrap" role="region" aria-label="Tabulka: ${esc(popisek || caption)}" tabindex="0">`
    + `<table${stack ? ' class="stack-table"' : ''}><caption>${esc(caption)}</caption>${hlava}<tbody>${telo}</tbody></table></div>`;
}

/* ---------- zátěž rozpočtu ---------- */

const UROVEN = { ok: 'v pořádku', warn: 'blízko hranice', high: 'nad hranicí', unknown: 'bez příjmu' };

function zatez(burden) {
  if (!Number.isFinite(burden.ratio)) return { html: '–' };
  return { html: `<span class="bm-zatez bm-zatez-${burden.level}">${esc(cele(burden.ratio))} <span class="bm-zatez-slovy">${UROVEN[burden.level]}</span></span>` };
}

function urovenZateze(platba, prijem, prah, okraj) {
  if (!(prijem > 0)) return { ratio: NaN, level: 'unknown' };
  const ratio = platba / prijem;
  return { ratio, level: ratio >= prah ? 'high' : ratio >= prah - okraj ? 'warn' : 'ok' };
}

/* ---------- refixace ---------- */

function nazevVarianty(o, v) {
  if (o.id === 'extend') return `Prodloužit splatnost o ${roky(Math.round(v.extendYears * 10) / 10)}`;
  if (o.id === 'prepay') return 'Mimořádně splatit a přijmout nabídku';
  return o.label;
}

function poznamkaVarianty(o) {
  if (o.id === 'refinance') return `Včetně nákladů refinancování ${kc(o.costs)}.`;
  if (o.id === 'prepay') return `Z úspor se ke konci fixace zdarma splatí ${kc(o.prepaid)}. Pak ale chybí v rezervě a nevydělávají.`;
  if (o.id === 'extend') return 'Nižší splátka za cenu vyšších úroků. Banka prodloužení posuzuje podle věku a příjmu.';
  return '';
}

/** DTI (dluh / čistý roční příjem) jen informativně: pro vlastní bydlení ČNB limit nestanovila. */
function dtiStatistika(dti, pravidla) {
  if (dti === null) return { hodnota: '–', popis: 'DTI, dluh k ročnímu čistému příjmu (příjem nezadán)', zvyraznit: false };
  return { hodnota: dtiText(dti), popis: `DTI, dluh k ročnímu čistému příjmu: ${pravidla.dti.ownHousing.short}`, zvyraznit: false };
}

/** Úspora na dani z odpočtu úroků (§ 15 odst. 3 a 4 ZDP) za 1. rok nové fixace u nejlevnější varianty. */
function danovaUspora(c, v, pravidla) {
  const d = pravidla.interestDeduction;
  const limit = val(v.pre2021 ? d.limitPre2021 : d.limit);
  const sazbaDane = val(d.taxRate);
  const uroky = c.principal > 0 ? interestPaidInMonths(c.principal, c.rate, c.months, 12) : 0;
  return {
    hodnota: kc(interestDeductionSaving(uroky, sazbaDane, limit)),
    popis: `úspora na dani z odpočtu úroků za 1. rok (${podil(sazbaDane)} z úroků ${kc(uroky)}, odpočet nejvýš ${kc(limit)} na domácnost)`,
    zvyraznit: false,
  };
}

/**
 * Porovnání variant při konci fixace a zátěžový test.
 * v: balance, remainingYears, currentRate, income, offeredRate, fixYears, competitorRate,
 *    valuation, cadastreFee, otherCosts, savings, extendYears, threshold (podíl),
 *    pre2021 (bytová potřeba obstaraná před 1. 1. 2021 → vyšší limit odpočtu úroků)
 */
export function refixace(v, pravidla) {
  const res = compareRefixOptions({
    balance: v.balance,
    remainingMonths: Math.round(v.remainingYears * 12),
    currentRate: v.currentRate,
    offeredRate: v.offeredRate,
    competitorRate: v.competitorRate,
    refinanceCosts: v.valuation + v.cadastreFee + v.otherCosts,
    savings: v.savings,
    extendMonths: Math.round(v.extendYears * 12),
    income: v.income,
    fixYears: v.fixYears,
    threshold: v.threshold,
  }, pravidla);
  const okraj = val(pravidla.burden.warnMargin);
  const { cheapest: c, options } = res;
  const prijmout = options[0];
  const uspora = prijmout.totalCost - c.totalCost;
  const nazev = (o) => nazevVarianty(o, v);
  const malym = (t) => `${t.charAt(0).toLowerCase()}${t.slice(1)}`;

  let vysvetleni = c.id === 'accept'
    ? `Úroky do konce splácení ${kc(c.totalCost)}. Ostatní varianty vycházejí dráž.`
    : `Úroky a poplatky do konce splácení ${kc(c.totalCost)}, o ${kc(uspora)} méně než při přijetí nabídky banky.`;
  if (c.id === 'prepay') vysvetleni += ` Použije ale ${kc(c.prepaid)} z úspor.`;

  const statistiky = [
    uspora > 0.5
      ? { hodnota: kc(uspora), popis: 'ušetříš do konce splácení oproti nabídce banky', zvyraznit: true }
      : { hodnota: kc(c.totalCost), popis: 'úroky do konce splácení', zvyraznit: false },
    { hodnota: rozdil(c.paymentChange), popis: `změna splátky oproti dosavadním ${kc(res.currentPayment)}`, zvyraznit: false },
    {
      hodnota: Number.isFinite(c.burden.ratio) ? cele(c.burden.ratio) : '–',
      popis: Number.isFinite(c.burden.ratio) ? `splátky z čistého příjmu, ${UROVEN[c.burden.level]} (hranice ${podil(v.threshold)})` : 'podíl na příjmu (příjem nezadán)',
      zvyraznit: c.burden.level === 'ok',
    },
    dtiStatistika(res.dti, pravidla),
    danovaUspora(c, v, pravidla),
  ];

  const nejlevnejsi = options.indexOf(c);
  const tabulkaVariant = tabulka({
    caption: 'Varianty po konci fixace',
    popisek: 'porovnání variant',
    sloupce: ['Varianta', 'Sazba', 'Splátka', 'Úroky a poplatky do konce', 'Podíl na příjmu'],
    vpravo: [1, 2, 3],
    zvyraznit: nejlevnejsi,
    atributy: options.map((o) => `data-varianta="${o.id}"`),
    radky: options.map((o, i) => [
      i === nejlevnejsi ? { html: `${esc(nazev(o))} <span class="bm-nej">nejlevnější</span>` } : nazev(o),
      sazba(o.rate),
      { html: `<span class="num">${esc(kc(o.payment))}</span><span class="bm-pod">${esc(rozdil(o.paymentChange))} oproti dnešku</span>` },
      { html: `<span class="num">${esc(kc(o.totalCost))}</span><span class="bm-pod">${o.costs > 0 ? `z toho poplatky ${esc(kc(o.costs))}` : 'bez poplatků'}</span>` },
      zatez(o.burden),
    ]),
  });

  const poznamky = [
    'Úroky do konce počítají s tím, že sazba vydrží až do konce splácení. Ve skutečnosti se po každé fixaci mění.',
    ...options.map((o) => (poznamkaVarianty(o) ? `${nazev(o)}: ${malym(poznamkaVarianty(o))}` : '')).filter(Boolean),
  ];

  const stresBunka = (s) => {
    if (!s) return { html: '–' };
    const b = urovenZateze(s.payment, v.income, v.threshold, okraj);
    return { html: `<span class="num">${esc(kc(s.payment))}</span><span class="bm-pod">při sazbě ${esc(sazba(s.rate))}</span>${Number.isFinite(b.ratio) ? ` ${zatez(b).html}` : ''}` };
  };
  const tabulkaStresu = tabulka({
    caption: 'Splátka po další fixaci',
    popisek: 'zátěžový test sazby',
    sloupce: ['Varianta', 'Splátka teď', 'Sazba +1 p. b.', 'Sazba +2 p. b.'],
    vpravo: [1],
    atributy: options.map((o) => `data-varianta="${o.id}"`),
    radky: options.map((o) => [nazev(o), kc(o.payment), stresBunka(o.stress[0]), stresBunka(o.stress[1])]),
  });

  return {
    vysledek: {
      kicker: 'Refixace hypotéky',
      nadpis: `Nejlevněji vychází: ${malym(nazev(c))}`,
      cislo: kc(c.payment),
      popis: `nová měsíční splátka (dosud ${kc(res.currentPayment)})`,
      vysvetleni,
      statistiky,
    },
    lista: { cislo: kc(c.payment), popis: `Nejlevnější splátka: ${malym(nazev(c))}` },
    tabulkaVariant,
    poznamky,
    uvodStresu: `Splátka po skončení nové fixace na ${roky(v.fixYears)}, kdyby sazba byla o 1 nebo 2 procentní body vyšší. Zbytek dluhu se pak splácí do původního konce.`,
    tabulkaStresu,
    poznamkaZateze: `Zelená: v pořádku. Žlutá: blízko hranice (do ${podil(okraj)} pod ní). Červená: nad hranicí ${podil(v.threshold)} čistého příjmu. Hranice je orientační, nejde o limit ČNB. Ukazatele DSTI a DTI jsou pro vlastní bydlení vypnuté, banky si ale bonitu posuzují samy.`,
    shrnuti: shrnutiRefixace(v),
    surove: res,
  };
}

/* ---------- poplatek za mimořádnou splátku ---------- */

/** p: amount, originalLoan, contractDate, fixStartDate, fixEndDate, paymentDate, freeUsedThisYear */
export function poplatek(p, pravidla) {
  const pr = pravidla.prepayment;
  if (p.paymentDate > p.fixEndDate) {
    return {
      popis: 'Poplatek', cislo: '–',
      duvod: 'Datum splátky je po konci fixace. Po konci fixace začíná nová, zadej její začátek a konec.',
    };
  }
  const r = prepaymentFeeFromDates(p, pravidla);
  const zmena = datum(val(pr.lawChangeDate));
  if (r.free) {
    const duvod = r.freeReason === 'fixEnd'
      ? 'Splátka ke konci fixace je zdarma.'
      : `V měsíci před výročím smlouvy je splátka do ${podil(val(pr.freeShareOfOriginalLoan))} původní výše úvěru jednou ročně zdarma.`;
    const starsi = !newPrepaymentRulesApply(p.contractDate, p.fixStartDate, pravidla);
    return { popis: 'Poplatek', cislo: kc(0), duvod: starsi ? `${duvod} Platí to i pro smlouvy a fixace před ${zmena}.` : duvod };
  }
  if (r.legacyWarning) {
    const zaklad = `Smlouva i současná fixace začaly před ${zmena}. Platí pro ně dřívější znění zákona: procentní strop neplatí, banka smí chtít jen skutečné náklady.`;
    if (r.fee === null) {
      return { popis: 'Poplatek', cislo: 'Zkontroluj smlouvu', duvod: `${zaklad} Nejvýš ale úrok do konce fixace (§ 117 odst. 5). Zadej smluvní sazbu a spočítáme ho. Zkontroluj smlouvu.` };
    }
    return { popis: 'Poplatek nejvýš', cislo: kc(r.fee), duvod: `${zaklad} Nejvýš ale úrok z této částky do konce fixace (§ 117 odst. 5). Zkontroluj smlouvu.` };
  }
  const roku = Math.max(1, startedYearsBetween(p.paymentDate, p.fixEndDate));
  const zaRok = val(pr.feePerStartedYear);
  const zdarma = Math.max(0, p.amount - r.chargedAmount);
  const admin = kc(val(pr.adminCostCap));
  let duvod = `Do konce fixace ${roku === 1 ? 'zbývá' : 'zbývají'} ${roky(roku)} (i započatý rok se počítá celý): ${roku} × ${podil(zaRok)} = ${podil(roku * zaRok)}`;
  duvod += r.capped ? `, ale nejvýš ${podil(val(pr.feeCap))}` : '';
  duvod += ` z ${kc(r.chargedAmount)}, tedy ${kc(r.limits.pctCap)}.`;
  if (zdarma > 0) duvod += ` ${kc(zdarma)} (${podil(val(pr.freeShareOfOriginalLoan))} původní výše úvěru) je v měsíci před výročím smlouvy zdarma.`;
  if (r.binding === 'interest') duvod += ` Poplatek ale nesmí přesáhnout úrok z této částky do konce fixace: ${kc(r.limits.interestCap)} (§ 117 odst. 5).`;
  if (r.limits.costCap !== null) {
    duvod += p.referenceRatePct >= p.contractRatePct
      ? ` Průměr sazeb ČNB není nižší než tvoje sazba, takže banka smí chtít jen administrativní náklady, nejvýš ${admin} (§ 117a).`
      : ` Podle průměru sazeb ČNB jsou skutečné náklady nejvýš ${kc(r.limits.costCap)}: administrativa do ${admin} a úrokový rozdíl (§ 117a).`;
  } else {
    duvod += ` Když je průměrná sazba ČNB pro srovnatelnou fixaci stejná nebo vyšší než tvoje, smí banka chtít nejvýš ${admin} (§ 117a). Doplň ji a spočítáme to přesně.`;
  }
  duvod += ' Je to zákonný strop. Banka smí účtovat jen skutečné náklady, takže může chtít méně.';
  return { popis: 'Poplatek nejvýš', cislo: kc(r.fee), duvod };
}

/** Další bezplatné případy podle § 117 odst. 3 (pro výpis pod kalkulačkou poplatku). */
export function dalsiDuvody(pravidla) {
  const d = pravidla.prepayment.otherFreeReasons;
  return {
    polozky: val(d).map((x) => ({ ...x, text: `${x.text.charAt(0).toUpperCase()}${x.text.slice(1)}` })),
    url: d.zdroj.url,
    odkaz: 'zákon č. 257/2016 Sb., § 117 odst. 3',
    poznamka: `Písmena e) a f) platí pro smlouvy uzavřené od ${datum(val(pravidla.prepayment.lawChangeDate))} a pro fixace začaté později.`,
  };
}

/* ---------- nájem vs. koupě ---------- */

/** Graf čistého jmění v čase (koupě, nájem + investice čárkovaně, bod zvratu zvýrazněný). */
export function grafNajmu(res, { sirka = 640, vyska = 320 } = {}) {
  const be = res.breakEvenYear;
  const rady = [
    { nazev: 'Koupě', body: res.years.map((y) => ({ x: y.year, y: Math.round(y.buyerNetWorth) })), trida: 'graf-rada-1' },
    { nazev: 'Nájem + investice', body: res.years.map((y) => ({ x: y.year, y: Math.round(y.renterNetWorth) })), trida: 'graf-rada-2', carkovana: true },
  ];
  if (be) {
    const y = res.years.find((r) => r.year === be);
    rady.push({ nazev: `Bod zvratu: ${be}. rok`, body: [{ x: be, y: Math.round(y.buyerNetWorth) }], trida: 'graf-rada-4', zvyraznena: true });
  }
  const n = res.years.at(-1).year;
  return caroveGrafy({
    titulek: 'Čisté jmění při koupi a při nájmu',
    popis: `Čisté jmění po letech za ${roky(n)}. Koupě na konci ${kc(res.years.at(-1).buyerNetWorth)}, nájem a investice ${kc(res.years.at(-1).renterNetWorth)}. `
      + (be ? `Koupě se začne vyplácet v ${be}. roce.` : 'Koupě se v tomto horizontu nevyplatí.'),
    rady,
    osaX: { popisek: 'rok', format: (x) => String(x) },
    osaY: { popisek: 'Kč', format: mil },
    sirka,
    vyska,
    id: 'graf-jmeni',
  });
}

export function tabulkaLet(res) {
  const radkyLet = res.years.filter((y) => y.year > 0);
  return tabulka({
    caption: 'Čisté jmění po letech',
    popisek: 'čisté jmění po letech',
    sloupce: ['Rok', 'Hodnota bytu', 'Zůstatek úvěru', 'Jmění – koupě', 'Jmění – nájem', 'Rozdíl'],
    vpravo: [1, 2, 3, 4, 5],
    zvyraznit: radkyLet.findIndex((y) => y.year === res.breakEvenYear),
    radky: radkyLet.map((y) => [
      `${y.year}. rok`, kc(y.propertyValue), kc(y.balance), kc(y.buyerNetWorth), kc(y.renterNetWorth), rozdil(y.buyerNetWorth - y.renterNetWorth),
    ]),
  });
}

export function tabulkaCitlivosti(v, pravidla) {
  const s = sensitivity(v, pravidla);
  return tabulka({
    caption: `Rozdíl čistého jmění za ${roky(v.horizonYears)} v Kč (koupě minus nájem)`,
    popisek: 'citlivost na růst cen a výnos investic',
    sloupce: ['Růst cen ročně', ...s.investReturns.map((r) => `Výnos ${sazba(r)}`)],
    vpravo: [1, 2, 3],
    stack: false,
    radky: s.priceGrowths.map((pg, i) => [sazba(pg), ...s.grid[i].map((d) => kratce(d))]),
    tridy: s.priceGrowths.map((_, i) => ['', ...s.grid[i].map((d, j) => `${d >= 0 ? 'bm-plus' : 'bm-minus'}${i === 1 && j === 1 ? ' bm-zaklad' : ''}`)]),
  });
}

/**
 * Nájem vs. koupě: výsledek, graf, tabulky.
 * v: vstupy simulateRentBuy (procenta jako 5 = 5 %) + city.
 */
export function najem(v, pravidla, rozmer = {}) {
  const res = simulateRentBuy(v, pravidla);
  const posledni = res.years.at(-1);
  const n = posledni.year;
  const be = res.breakEvenYear;
  const koupe = res.finalDiff >= 0;
  const investicni = Boolean(v.investment);
  const dtiInv = val(pravidla.dti.investment);
  const limitLtv = `${investicni ? 'doporučení ČNB ' : 'limit '}${cele(res.maxLtv)}`;

  const varovani = [];
  if (v.ownFunds < (v.purchaseCosts ?? 0)) varovani.push(`Vlastní zdroje nepokryjí ani jednorázové náklady koupě (${kc(v.purchaseCosts)}).`);
  if (res.ltvExceeded) {
    varovani.push(investicni
      ? `Úvěr by měl LTV ${ltvNadLimitem(res.ltv)}, ale ČNB u investičního bytu doporučuje nejvýš ${cele(res.maxLtv)}. Na koupi chybí ${kc(res.missingOwnFunds)} vlastních zdrojů.`
      : `Úvěr by měl LTV ${ltvNadLimitem(res.ltv)}, ale limit je ${cele(res.maxLtv)}. Na koupi chybí ${kc(res.missingOwnFunds)} vlastních zdrojů, banka by takový úvěr neposkytla.`);
  }
  if (investicni && res.dti !== null && res.dti > dtiInv) {
    varovani.push(`DTI ${dtiText(res.dti)} je nad doporučením ČNB pro investiční byt, které je nejvýš ${cislo(dtiInv)}.`);
  }

  const dtiPopis = res.dti !== null
    ? `, DTI ${dtiText(res.dti)}${investicni ? ` (doporučení ČNB nejvýš ${cislo(dtiInv)})` : ''}`
    : (investicni ? `, pro DTI zadej příjem (doporučení ČNB nejvýš ${cislo(dtiInv)})` : '');
  const ltvPopis = res.ltvExceeded ? ltvNadLimitem(res.ltv) : cele(res.ltv);

  // Úvěr nad limitem LTV: porovnání nepočítáme (BYD-05), ukážeme jen, kolik chybí
  if (res.ltvExceeded) {
    const pomlcka = (popis) => ({ hodnota: '–', popis, zvyraznit: false });
    return {
      platny: false,
      vysledek: {
        kicker: 'Nájem vs. koupě',
        nadpis: 'Na koupi chybí vlastní zdroje',
        cislo: kc(res.missingOwnFunds),
        popis: investicni ? `vlastních zdrojů chybí do doporučení ČNB (LTV nejvýš ${cele(res.maxLtv)})` : `vlastních zdrojů chybí do limitu LTV ${cele(res.maxLtv)}`,
        vysvetleni: `Úvěr ${kc(res.loan)} by byl ${ltvNadLimitem(res.ltv)} ceny bytu. Porovnání s nájmem proto nepočítáme. Přidej vlastní zdroje, nebo zmenši byt či cenu za m².`,
        statistiky: [pomlcka('bod zvratu'), { hodnota: kc(res.price), popis: 'cena bytu', zvyraznit: false },
          { hodnota: kc(res.loan), popis: `úvěr, LTV ${ltvPopis} (${limitLtv})${dtiPopis}`, zvyraznit: false }, pomlcka('splátka'), pomlcka('úspora na dani')],
      },
      lista: { cislo: kc(res.missingOwnFunds), popis: 'Na koupi chybí vlastní zdroje' },
      varovani,
      graf: '',
      tabulkaLet: '',
      tabulkaCitlivosti: '',
      uvodCitlivosti: '',
      shrnuti: null,
      surove: res,
    };
  }

  const odpocet = v.deductInterest !== false && !investicni;
  const dan = odpocet
    ? { hodnota: kc(res.taxSavingYear1), popis: `úspora na dani z odpočtu úroků v 1. roce (za ${roky(n)} celkem ${kc(res.taxSavingTotal)})`, zvyraznit: false }
    : { hodnota: kc(0), popis: investicni ? 'úspora na dani: u investičního bytu se odpočet úroků neuplatní' : 'úspora na dani: odpočet úroků je vypnutý', zvyraznit: false };

  return {
    platny: true,
    vysledek: {
      kicker: 'Nájem vs. koupě',
      nadpis: `Za ${roky(n)} vychází lépe ${koupe ? 'koupě' : 'nájem'}`,
      cislo: kc(Math.abs(res.finalDiff)),
      popis: koupe ? 'víc čistého jmění než při nájmu a investování' : 'víc čistého jmění při nájmu a investování než při koupi',
      vysvetleni: `${be ? `Koupě se začne vyplácet v ${be}. roce.` : `Koupě se za ${roky(n)} nevyplatí.`} Čisté jmění za ${roky(n)}: koupě ${kc(posledni.buyerNetWorth)}, nájem a investice ${kc(posledni.renterNetWorth)}.`,
      statistiky: [
        { hodnota: be ? `${be}. rok` : 'nenastane', popis: be ? 'bod zvratu: od něj vychází koupě aspoň tak dobře jako nájem' : `bod zvratu: v horizontu ${roky(n)} koupě nájem nedožene`, zvyraznit: Boolean(be) },
        { hodnota: kc(res.price), popis: `cena bytu (${cislo(v.area, Number.isInteger(v.area) ? 0 : 1)}${NBSP}m²)`, zvyraznit: false },
        { hodnota: kc(res.loan), popis: `úvěr, LTV ${ltvPopis} (${limitLtv})${dtiPopis}`, zvyraznit: false },
        { hodnota: kc(res.payments.initial), popis: `splátka v 1. měsíci, nájem ${kc(res.initialRent)}`, zvyraznit: false },
        dan,
      ],
    },
    lista: { cislo: be ? `${be}. rok` : 'nenastane', popis: 'Bod zvratu: koupě se začne vyplácet' },
    varovani,
    graf: grafNajmu(res, rozmer),
    tabulkaLet: tabulkaLet(res),
    tabulkaCitlivosti: tabulkaCitlivosti(v, pravidla),
    uvodCitlivosti: `Jak se změní výsledek za ${roky(n)}, když ceny bytů rostou nebo investice vynášejí o 2 procentní body víc či míň. Kladné číslo: lépe vychází koupě. Záporné: lépe vychází nájem. Zvýrazněné pole je tvoje zadání.`,
    shrnuti: null,
    surove: res,
  };
}
