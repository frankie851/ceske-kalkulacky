// Ukázkový výsledek Penzijko kompasu spočítaný při buildu (stránka bez JS).
// Stejné moduly jako v prohlížeči: calc.js (výpočty) a zobrazeni.js (texty a HTML).
import fs from 'node:fs';
import { vypocet, predpoklady, doPole, kratkyNazev, platnaSada, pct } from './zobrazeni.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const typicky = pravidla.fondy.transformovany;
const konecTf = Object.values(pravidla.sady).find((s) => s.transformovaneFondy).transformovaneFondy;

// Výchozí vstup z původní aplikace. Start projekce je pevný, aby byl build deterministický.
const vstup = {
  vek: 35,
  delkaSmlouvy: 8,
  vklad: 1000,
  zamestnavatel: 0,
  zustatek: 150000,
  fond: 'transformovany',
  poplatky: { sprava: typicky.sprava, zhodnoceni: typicky.zhodnoceni },
  duchodce: false,
  sada: platnaSada(pravidla),
  start: { rok: 2026, mesic: 11 },
};

const model = vypocet(pravidla, vstup);

export default {
  kompas: {
    vstup,
    pole: {
      vek: doPole(vstup.vek),
      delkaSmlouvy: doPole(vstup.delkaSmlouvy),
      vklad: doPole(vstup.vklad),
      zamestnavatel: doPole(vstup.zamestnavatel),
      zustatek: doPole(vstup.zustatek),
      sprava: doPole(vstup.poplatky.sprava),
      zhodnoceni: doPole(vstup.poplatky.zhodnoceni),
    },
    fondy: Object.entries(pravidla.fondy).map(([klic, f]) => ({
      hodnota: klic,
      text: f.nazev + (f.cyklus ? ' (strategie)' : ''),
      vybrano: klic === vstup.fond,
    })),
    sady: Object.entries(pravidla.sady).map(([klic, s]) => ({
      hodnota: klic,
      text: kratkyNazev(s),
      vybrano: klic === vstup.sada,
    })),
    tf: {
      // Konec transformovaných fondů je jen v návrhu (sněmovní tisk 285), ne v platném zákoně.
      konci: konecTf.konci,
      nastupce: pravidla.fondy[konecTf.nastupce].nazev,
      sadaNavrhu: kratkyNazev(Object.values(pravidla.sady).find((s) => s.transformovaneFondy)),
      cil: pravidla.fondy[pravidla.predpoklady.doporuceni.cilovyFond].nazev,
    },
    vekPenze: pravidla.predpoklady.vekPenze,
    prevod: pravidla.predpoklady.prevodKonkurence,
    inflace: pct(pravidla.predpoklady.inflace),
    predpoklady: predpoklady(pravidla),
    ...model,
  },
};
