// Exekuce, nebo oddlužení? – ukázkový výsledek spočítaný při sestavení webu stejným modulem
// jako v prohlížeči. Stránka bez JavaScriptu ukáže formulář s těmito hodnotami a obě karty výsledku.
// Rok pravidel je rok z meta.overeno (deterministicky, nezávisle na dni sestavení).
import fs from 'node:fs';
import { pravidlaProRok } from './dluhy.js';
import { rokPravidel, vysledek, volbaStareSrazky, delkaPravidlo, delkaSlovy, moznostiUroku, cisloSazby, urokNapoveda, rozdilyKalkulacek } from './vystup.js';
import { cislo } from '../../js/format.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const rok = rokPravidel(rules, Number(rules.meta.overeno.slice(0, 4)));
const p = pravidlaProRok(rules, rok.rok);
// Zákonná sazba úroku z prodlení podle pololetí vzniku prodlení (rules.urokZProdleni).
// Výchozí je nejnovější pololetí; sazba se do pole doplní z pravidel, ne natvrdo.
const urokMoznosti = moznostiUroku(rules.urokZProdleni);
const vychoziUrok = urokMoznosti.find((m) => m.vybrano);

// Ukázka: čistá mzda 23 000 Kč, bez vyživovaných osob, běžný dluh, 1 exekuce, dluhy 100 000 Kč.
const vstup = {
  cistaMzda: 23000,
  osoby: 0,
  prednostni: false,
  pocetExekuci: 1,
  duchodce: false,
  stareSrazky: false,
  dluh: 100000,
  sazba: 0,
  drivejsiOdpusteni: 'ne',
};
const v = vysledek(p, vstup);
const bezna = (n) => cislo(n).replace(/ /g, ' ');

export default {
  dluhy: {
    vstup,
    rok,
    pole: {
      mzda: bezna(vstup.cistaMzda),
      osoby: String(vstup.osoby),
      exekuce: String(vstup.pocetExekuci),
      dluh: bezna(vstup.dluh),
      sazba: cisloSazby(vychoziUrok.sazba),
    },
    urokNapoveda: urokNapoveda(),
    stareSrazky: volbaStareSrazky(p),
    urokMoznosti,
    rozdily: rozdilyKalkulacek(p, rules.uredniKalkulacky, rok.rok),
    ctyriExekuce: p.minimumExekuciProDveTretiny,
    zakazLet: p.zakazOpakovaniLet,
    delkaPravidlo: delkaPravidlo(p),
    delkaRoky: delkaSlovy(p.delkaOddluzeniMesicu),
    ...v,
  },
};
