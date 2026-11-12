// Cestovní příkaz 2027 – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči.
// Stránka bez JavaScriptu ukáže hlavičku, dvě ukázkové cesty a k nim skutečné vyúčtování.
// Deterministické: pevné cesty v roce 2026, žádné new Date().
import fs from 'node:fs';
import { PALIVA, DRUHY_VOZIDEL } from './cesty.js';
import { kc, cislo } from '../../js/format.js';
import * as v from './vystup.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const rok = v.posledniRok(pravidla);
const r = pravidla[rok];

// Dvě cesty, jejichž součet odpovídá testu „souhrn“ v cesty.test.js (1 336 Kč).
const ukazka = {
  hlavicka: {
    firma: 'Ukázka s.r.o.',
    kdo: 'Alex Novák',
    sfera: 'soukroma',
    kraceniPct: [...r.kraceniMaxPct],
    stravneVerejna: [null, null, null],
    vozidlo: { spz: '1AB 2345', druh: 'osobni', palivo: 'benzin95', spotreba: 6 },
  },
  cesty: [
    {
      id: 'u1', odjezd: `${rok}-03-15T06:00`, navrat: `${rok}-03-15T19:00`,
      odkud: 'Praha', kam: 'Plzeň a zpět', km: 100, ucel: 'Jednání s klientem', cenaDoklad: null, jidla: {},
    },
    {
      id: 'u2', odjezd: `${rok}-03-17T07:30`, navrat: `${rok}-03-17T20:30`,
      odkud: 'Praha', kam: 'Kladno a zpět', km: 18.5, ucel: 'Školení s obědem', cenaDoklad: null,
      jidla: { [`${rok}-03-17`]: { o: true } },
    },
  ],
};

const vysledek = v.vypocitej(ukazka, pravidla);
const h = ukazka.hlavicka;
const vyber = (zdroj, vybrano) => Object.entries(zdroj).map(([hodnota, x]) => ({
  hodnota, text: typeof x === 'string' ? x : x.nazev, vybrano: hodnota === vybrano,
}));

export default {
  cp: {
    ukazka,
    rok,
    overeno: pravidla.meta.overeno,
    vyhlaska: r.vyhlaska,
    urlVyhlasky: pravidla.meta.zdroje[0]?.url,
    rokyBezSazeb: v.rokyBezSazeb(pravidla).map((x) => ({ rok: x, text: v.textChybySazby(pravidla, x) })),
    // Hodnoty polí hlavičky
    pole: {
      firma: h.firma,
      kdo: h.kdo,
      spz: h.vozidlo.spz,
      spotreba: cislo(h.vozidlo.spotreba, 0),
      kraceni: h.kraceniPct.map((x) => String(x)),
    },
    sfera: [
      { hodnota: 'soukroma', text: 'Soukromá firma', vybrano: h.sfera === 'soukroma' },
      { hodnota: 'verejna', text: 'Veřejná sféra', vybrano: h.sfera === 'verejna' },
    ],
    druhy: vyber(DRUHY_VOZIDEL, h.vozidlo.druh),
    paliva: vyber(PALIVA, h.vozidlo.palivo),
    jednotka: PALIVA[h.vozidlo.palivo].jednotka,
    privesPct: pravidla.zakonik.prives.pct,
    pasma: v.PASMA,
    kraceniMax: r.kraceniMaxPct,
    verejnaRozpeti: [0, 1, 2].map((i) => `${cislo(r.stravne.verejnaMin[i])}–${kc(r.stravne.verejnaMax[i])}`),
    verejnaMin: r.stravne.verejnaMin.map((x) => String(x)),
    // Výsledek ukázky
    cislo: v.hlavniCislo(vysledek),
    popis: v.popisVysledku(vysledek),
    statistiky: v.statistiky(vysledek),
    seznam: v.seznam(vysledek, { akce: false }),
    vyuctovani: v.vyuctovani(ukazka, vysledek, pravidla),
    sazby: v.sazbyRoku(pravidla),
  },
};
