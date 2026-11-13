// Přijímačky bez paniky – ukázka spočítaná při buildu stejnými moduly jako v prohlížeči.
// Bez JavaScriptu stránka ukáže scénář „Priorita nepřebíjí body“ po posledním kole (přiřazení
// a vysvětlení z matching.js), strategii pro ukázkové hodnoty a celý kalendář termínů.
// Soubor .ics se tu skládá s pevným časem (meta.overeno), nikdy s new Date().
import fs from 'node:fs';
import { SCENARIOS, EXPECTED } from './scenarios.js';
import { deferredAcceptance, explain } from './matching.js';
import { evaluateStrategy } from './strategy.js';
import { buildICS } from './ics.js';
import { stavZeScenare, spust, vyberTerminy, udalostiProIcs, casExportu, rozsahTerminu, denMesic, datumPlne } from './simulace.js';
import * as v from './vystup.js';
import { ty, neprevedeneTexty, rodoveTvary } from './texty.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));

const chybiTykani = neprevedeneTexty(pravidla, SCENARIOS);
if (chybiTykani.length) {
  console.warn(`[prijimacky] Texty bez převodu do tykání (doplň je do texty.js):\n  ${chybiTykani.join('\n  ')}`);
}

// Věty z explain() (matching.js) na webu převádí texty.js → neutralne(). Modelová třída projde všechny
// druhy vět (nesplněné minimum, plná škola, přijetí, nepřijetí); co převod nepokryje, build vypíše.
{
  const skoly = [{ id: 'A', capacity: 1, minScore: 60 }, { id: 'B', capacity: 1 }, { id: 'C', capacity: 1 }];
  const deti = [
    { id: 'x', score: 80, priorities: ['B', 'C'] },
    { id: 'y', score: 59, priorities: ['A', 'B', 'C'] },
    { id: 'z', score: 50, priorities: ['B'] },
  ];
  const vety = [
    ...Object.values(explain(deferredAcceptance(deti, skoly), deti, skoly)).flat(),
    ...SCENARIOS.flatMap((s) => Object.values(spust(stavZeScenare(s)).proc ?? {}).flat()),
  ];
  const rodove = rodoveTvary(vety);
  if (rodove.length) {
    console.warn(`[prijimacky] Věty z explain() s rodovými tvary (doplň převod do texty.js):\n  ${rodove.join('\n  ')}`);
  }
}

// ---------- Simulátor: scénář „body“ po posledním kole ----------
const scenar = SCENARIOS.find((s) => s.id === 'body');
const stav = stavZeScenare(scenar);
const beh = spust(stav);
if (!beh.vysledek || JSON.stringify(beh.vysledek.assignment) !== JSON.stringify(EXPECTED.body)) {
  throw new Error('Přijímačky: ukázkový scénář „Priorita nepřebíjí body“ nedává očekávaný výsledek.');
}
const posledni = beh.vysledek.rounds.length - 1;

// ---------- Strategie: ukázkové hodnoty ----------
const strategieVstup = {
  expected: 65,
  margin: 5,
  schools: [
    { name: 'Gymnázium', lastMin: 72 },
    { name: 'Průmyslovka', lastMin: 63 },
    { name: 'Obchodní akademie', lastMin: 55 },
  ],
};
const strategie = evaluateStrategy(strategieVstup);

// ---------- Termíny ----------
const event = (id) => {
  const e = pravidla.events.find((x) => x.id === id);
  if (!e) throw new Error(`Přijímačky: v rules.json chybí termín ${id}.`);
  return e;
};
const zdroj = (e) => ({ nazev: pravidla.sources[e.source].name, url: pravidla.sources[e.source].url });
const vsechnyTerminy = vyberTerminy(pravidla.events, ['vg', 'kons']);
const upozorneniIcs = 'Informativní pomůcka – závazné jsou informace CERMAT a škol.';
const ics = buildICS(
  udalostiProIcs(vsechnyTerminy, pravidla, { textPoznamky: ty, upozorneni: upozorneniIcs }),
  { now: casExportu(pravidla), calName: 'Přijímačky 2027' },
);

const prihlStart = event('ss-prihlasky-start');
const prihlKonec = event('ss-prihlasky-konec');
const jpz1 = event('jpz-1');
const jpz2 = event('jpz-2');
const vg1 = event('vg-1');
const vg2 = event('vg-2');
const nahr1 = event('jpz-nahr-1');
const nahr2 = event('jpz-nahr-2');
const kriteria = event('ss-kriteria');
const konsPrihl = event('kons-prihlasky');
const vysledky1 = event('vysledky-1-kolo');

const seznam = [
  { ukol: 'Konzervatoř: přihlášku podat už v listopadu. Počítá se do 2 oborů s talentovou zkouškou.', termin: rozsahTerminu(konsPrihl), typ: 'hard', zdroj: zdroj(konsPrihl) },
  { ukol: 'Vybrat až 3 obory bez talentové zkoušky (a případně až 2 s ní) a na webu školy si ověřit přesný obor a zaměření.' },
  { ukol: 'Seřadit je podle toho, kam dítě chce nejvíc, ne podle odhadu šancí.' },
  { ukol: 'Mít mezi nimi aspoň jednu rozumnou „jistotu“, nejlépe na posledním místě.' },
  { ukol: 'Přečíst kritéria přijímacího řízení každé školy: váhy bodů, školní zkoušku, vysvědčení a co rozhoduje při shodě.', termin: `Školy je zveřejní ${rozsahTerminu(kriteria)}`, typ: 'doporuceny', zdroj: zdroj(kriteria) },
  { ukol: 'Zjistit, jestli obor vyžaduje posudek o zdravotní způsobilosti, a včas ho zařídit.' },
  { ukol: 'Při nároku na úpravu podmínek u zkoušky: doporučení ze školského poradenského zařízení musí mít registrační identifikátor z DiPSy.' },
  { ukol: 'S výchovným poradcem na základní škole ověřit, jak se do přihlášky dostanou známky z vysvědčení.' },
  { ukol: 'Podat přihlášku elektronicky přes DiPSy (eObčanka, bankovní identita nebo datová schránka), nebo na papírovém tiskopisu. Na papírových přihláškách musí být všude stejné pořadí oborů. Raději s rezervou.', termin: `${denMesic(prihlStart.start)}–${datumPlne(prihlKonec.start)}`, typ: 'hard', zdroj: zdroj(prihlKonec) },
  { ukol: 'Schovat si potvrzení nebo kopii odeslané přihlášky.' },
  { ukol: 'Při nemoci v den zkoušky poslat řediteli školy písemnou omluvu do 3 pracovních dnů. Dítě pak jde na náhradní termín.', termin: `Náhradní termín ${denMesic(nahr1.start)} a ${datumPlne(nahr2.start)}`, typ: 'hard', zdroj: zdroj(nahr1) },
];

export default {
  prij: {
    scenare: SCENARIOS.map((s) => ({ hodnota: s.id, text: s.title, vybrano: s.id === scenar.id })),
    ukazka: {
      info: v.scenarInfoHtml(scenar),
      editorSkol: v.editorSkolHtml(stav),
      editorDeti: v.editorDetiHtml(stav),
      stavKola: v.stavKola(beh, posledni, true),
      tabule: v.tabuleHtml(stav, beh, posledni),
      kola: v.kolaHtml(stav, beh, posledni, true),
      vysledek: v.vysledekHtml(stav, beh, scenar),
      souhrn: v.souhrnVysledku(beh),
      kicker: `Ukázka: ${scenar.title}`,
    },
    strategie: {
      vstup: strategieVstup,
      rezervy: [3, 5, 10].map((n) => ({ hodnota: String(n), text: `${n} b.`, vybrano: n === strategieVstup.margin })),
      html: (sprite) => v.strategieHtml(strategie, strategieVstup.margin, sprite),
    },
    kalendar: v.kalendarHtml(vsechnyTerminy, pravidla),
    pocetTerminu: vsechnyTerminy.length,
    ics,
    pravidlaWeb: pravidla.rules.map((r) => ({
      id: r.id,
      nadpis: r.title,
      text: ty(r.text),
      overeno: r.status === 'confirmed',
      // PRI-09: „derived“ = plyne z úředního harmonogramu, samostatný úřední dokument to netvrdí.
      odvozeno: r.status === 'derived',
      poznamka: r.note ? ty(r.note) : '',
      stav: r.status,
      zdroj: { nazev: pravidla.sources[r.source].name, url: pravidla.sources[r.source].url },
    })),
    data: {
      jpz: `${denMesic(jpz1.start)} a ${datumPlne(jpz2.start)}`,
      vg: `${denMesic(vg1.start)} a ${datumPlne(vg2.start)}`,
      vysledky1: datumPlne(vysledky1.start),
      prihlasky: `${denMesic(prihlStart.start)}–${datumPlne(prihlKonec.start)}`,
    },
    seznam,
  },
};
