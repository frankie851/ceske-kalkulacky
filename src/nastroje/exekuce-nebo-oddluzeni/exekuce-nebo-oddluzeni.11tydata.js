// Exekuce, nebo oddlužení? – ukázkový výsledek spočítaný při sestavení webu stejným modulem
// jako v prohlížeči. Stránka bez JavaScriptu ukáže formulář s těmito hodnotami a obě karty výsledku.
// Rok pravidel je rok z meta.overeno (deterministicky, nezávisle na dni sestavení).
import fs from 'node:fs';
import { pravidlaProRok } from './dluhy.js';
import { rokPravidel, vysledek, delkaPravidlo, delkaSlovy } from './vystup.js';
import { cislo, procenta, datum } from '../../js/format.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const rok = rokPravidel(rules, Number(rules.meta.overeno.slice(0, 4)));
const p = pravidlaProRok(rules, rok.rok);
const urok = rules.roky[String(rok.rok)].urokZProdleniProcenta;

// Ukázka: čistá mzda 23 000 Kč, bez vyživovaných osob, běžný dluh, 1 exekuce, dluhy 100 000 Kč.
const vstup = {
  cistaMzda: 23000,
  osoby: 0,
  prednostni: false,
  pocetExekuci: 1,
  duchodce: false,
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
      sazba: String(urok.hodnota).replace('.', ','),
    },
    urokNapoveda: `Úrok z prodlení platíte, když nesplácíte včas. Zákonná sazba od ${datum(urok.ucinnostOd)} je ${procenta(urok.hodnota, 2)} ročně. Ve smlouvě můžete mít jinou.`,
    ctyriExekuce: p.minimumExekuciProDveTretiny,
    zakazLet: p.zakazOpakovaniLet,
    delkaPravidlo: delkaPravidlo(p),
    delkaRoky: delkaSlovy(p.delkaOddluzeniMesicu),
    ...v,
  },
};
