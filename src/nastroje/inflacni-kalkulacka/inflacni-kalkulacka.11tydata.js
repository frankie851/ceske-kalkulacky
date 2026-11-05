// Inflační kalkulačka – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči.
// Bez JavaScriptu stránka ukáže přepočet 10 000 Kč z ledna 2005 na poslední měsíc v datech,
// oba grafy a tabulku. Deterministické: vše se odvozuje z data/cpi.json a rules.json, ne z dnešního data.
import fs from 'node:fs';
import { createSeries } from './inflation.js';
import { cislo } from '../../js/format.js';
import * as v from './vystup.js';

const cti = (soubor) => JSON.parse(fs.readFileSync(new URL(soubor, import.meta.url), 'utf8'));
const cpi = cti('./data/cpi.json');
const pravidla = cti('./rules.json');
const series = createSeries(cpi);

// rules.json nese poslední měsíc dat kvůli štítku a zdrojům; musí sedět s data/cpi.json
// (obojí přepisuje měsíční GitHub Action .github/workflows/aktualizace-cpi.yml).
if (pravidla.data?.posledniMesic !== series.last) {
  throw new Error(`Inflační kalkulačka: rules.json data.posledniMesic (${pravidla.data?.posledniMesic}) nesedí s posledním měsícem v data/cpi.json (${series.last}).`);
}

const vstup = v.vychozi(series, pravidla);
const ukazka = v.prepocet(series, vstup.prepocet);
const g = v.grafy(series, ukazka.obdobi.od, ukazka.obdobi.do);
const pole = (n) => cislo(n).replace(/ /g, ' ');

export default {
  stitkyNavic: [`Data ČSÚ do ${v.gen(series.last)}`],
  inflace: {
    cpi,
    dataDo: v.nom(series.last),
    dataDoGen: v.gen(series.last),
    pole: {
      castka: pole(vstup.prepocet.castka),
      urok: String(vstup.vynos.urok).replace('.', ','),
      mzdaTehdy: pole(vstup.mzda.mzdaTehdy),
      mzdaTed: pole(vstup.mzda.mzdaTed),
    },
    typy: [
      { hodnota: 'pa', text: 'ročně (p. a.)', vybrano: vstup.vynos.typ === 'pa' },
      { hodnota: 'celkem', text: 'celkem za období', vybrano: vstup.vynos.typ === 'celkem' },
    ],
    mesice: {
      'prepocet-od': v.moznostiMesice(series, pravidla, vstup.prepocet.od),
      'prepocet-do': v.moznostiMesice(series, pravidla, vstup.prepocet.do),
      'vynos-od': v.moznostiMesice(series, pravidla, vstup.vynos.od),
      'vynos-do': v.moznostiMesice(series, pravidla, vstup.vynos.do),
      'mzda-od': v.moznostiMesice(series, pravidla, vstup.mzda.od),
      'mzda-do': v.moznostiMesice(series, pravidla, vstup.mzda.do),
    },
    ukazka,
    grafy: g,
  },
};
