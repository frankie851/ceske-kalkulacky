// Ukázkový výsledek kalkulačky OSVČ 2027 spočítaný při buildu (stránka bez JS).
// Stejné moduly jako v prohlížeči: osvc.js (výpočty) a vystup.js (texty a HTML).
import fs from 'node:fs';
import { fill, formatDate } from './rules.js';
import { compare, series, chartIncomes, breakEven, osvcVars, formatPercent } from './osvc.js';
import { modelOsvc, vysledekOsvcHtml, prvniPlatba, stavyOvereni } from './vystup.js';
import { caroveGrafy, tabulkaDat } from '../../js/graf.js';
import { kc } from '../../js/format.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const o = rules.osvc2027;
const tx = o.texts;
const vars = osvcVars(rules);

// Výchozí vstup původní aplikace (60% paušál, hlavní činnost, neplátce DPH, bez dětí,
// s kontaktními platbami) a příjmy 800 000 Kč jako v test/osvc.test.js.
const vstup = {
  income: 800000,
  flatRateId: o.expenseFlatRates[1].id,
  actualExpenses: null,
  vatPayer: false,
  children: 0,
  activityId: o.activities[0].id,
  contactPayments: true,
};
const model = modelOsvc(vstup, rules);
const res = compare(vstup, rules);

// Statický graf pro stránku bez JS (s JS ho nahradí interaktivní graf z osvc-app.js)
const kompaktne = new Intl.NumberFormat('cs-CZ', { notation: 'compact', maximumFractionDigits: 1 });
const kratce = (n) => kompaktne.format(n).replace(/\s/g, ' ');
const body = series(vstup, rules, chartIncomes(vstup, rules)).filter((p) => p.income % o.chart.tableStep === 0);
const RADY = [
  { klic: 'classic', nazev: tx.chartLegendClassic, trida: 'graf-rada-1' },
  { klic: 'flat', nazev: tx.chartLegendFlat, trida: 'graf-rada-2' },
  { klic: 'eetOff', nazev: tx.chartLegendEetOff, trida: 'graf-rada-3' },
];
const fr = o.expenseFlatRates.find((f) => f.id === vstup.flatRateId);
const activity = o.activities.find((a) => a.id === vstup.activityId);
const popisGrafu = fill(tx.chartDesc, { ...vars, rate: formatPercent(fr.rate), children: vstup.children, activity: activity.label.toLowerCase() });
const be = breakEven(vstup, rules);
const zlom = be.length
  ? be.map((b) => fill(tx.chartBreakEven, { income: kc(b.income), cheaper: b.cheaper === 'flat' ? tx.cheaperFlat : tx.cheaperClassic })).join(' ')
  : tx.chartBreakEvenNone;

const vybrano = (hodnota, aktualni) => hodnota === aktualni;

export default {
  osvc: {
    vstup,
    nazev: tx.title,
    uvod: fill(tx.intro, vars),
    soukromi: tx.panelPrivacy,
    pole: {
      prijmy: { label: fill(tx.fieldIncome, vars), hodnota: String(vstup.income), napoveda: tx.fieldIncomeHelp, jednotka: rules.meta.currency },
      pausal: {
        label: tx.fieldFlatRate, napoveda: tx.fieldFlatRateHelp,
        moznosti: o.expenseFlatRates.map((f) => ({ hodnota: f.id, text: f.label, vybrano: vybrano(f.id, vstup.flatRateId) })),
      },
      vydaje: {
        legenda: tx.fieldExpenses,
        moznosti: [
          { hodnota: 'flat', text: tx.optExpensesFlat, vybrano: vstup.actualExpenses === null },
          { hodnota: 'actual', text: tx.optExpensesActual, vybrano: vstup.actualExpenses !== null },
        ],
      },
      skutecne: { label: tx.fieldActual, jednotka: rules.meta.currency },
      dph: {
        legenda: tx.fieldVat,
        moznosti: [{ hodnota: 'yes', text: tx.yes, vybrano: vstup.vatPayer }, { hodnota: 'no', text: tx.no, vybrano: !vstup.vatPayer }],
      },
      deti: { label: tx.fieldChildren, hodnota: String(vstup.children), napoveda: tx.fieldChildrenHelp },
      cinnost: {
        legenda: tx.fieldActivity,
        moznosti: o.activities.map((a) => ({ hodnota: a.id, text: a.label, vybrano: vybrano(a.id, vstup.activityId) })),
      },
      kontakt: {
        legenda: tx.fieldContact, napoveda: fill(tx.fieldContactHelp, vars),
        moznosti: [{ hodnota: 'yes', text: tx.yes, vybrano: vstup.contactPayments }, { hodnota: 'no', text: tx.no, vybrano: !vstup.contactPayments }],
      },
      spocitat: tx.calculate,
    },
    vysledek: (sprite) => vysledekOsvcHtml(model, rules, { sprite, ukazka: true }),
    lista: { cislo: model.cislo, popis: model.lista },
    graf: {
      titulek: tx.chartTitle,
      popis: popisGrafu,
      zlom,
      svg: caroveGrafy({
        titulek: tx.chartTitle,
        popis: popisGrafu,
        id: 'osvc-graf-staticky',
        rady: RADY.map((r) => ({ nazev: r.nazev, trida: r.trida, body: body.filter((p) => p[r.klic] !== null).map((p) => ({ x: p.income, y: p[r.klic] })) })),
        osaX: { popisek: tx.chartAxisX, format: kratce },
        osaY: { popisek: tx.chartAxisY, format: kratce },
      }),
      tabulka: tabulkaDat({
        caption: tx.chartTitle,
        sloupce: [tx.colIncome, ...RADY.map((r) => r.nazev)],
        radky: body.map((p) => [kc(p.income), ...RADY.map((r) => (p[r.klic] === null ? '—' : kc(p[r.klic])))]),
      }),
      tabulkaSouhrn: tx.chartTableSummary,
    },
    terminy: {
      nadpis: tx.deadlinesTitle,
      polozky: o.deadlines.map((d) => ({
        id: d.id,
        ukol: d.title,
        termin: `${rules.ui.deadlineHard}: ${formatDate(d.date)}`,
        text: fill(d.text, { date: formatDate(d.date) }),
        zdroj: { nazev: d.sourceTitle, url: d.source },
      })),
      prvniPlatba: prvniPlatba(res, rules),
      odkazyNadpis: tx.linksTitle,
      odkazy: o.links.map((l) => ({ nazev: l.title, url: l.source })),
    },
    stav: {
      disclaimer: tx.disclaimer,
      nadpis: tx.statusLabel,
      poznamka: o.verificationNote,
      polozky: stavyOvereni(rules),
    },
  },
};
