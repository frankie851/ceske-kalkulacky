// Slevy 2027 – ukázkový výsledek spočítaný při buildu (stránka bez JavaScriptu).
// Stejné moduly jako v prohlížeči: slevy.js (výpočet) a vystup.js (texty a HTML).
// Funkce se volají ze šablony s URL spritu a Plánu48 (kvůli pathPrefix).
import fs from 'node:fs';
import { textyKroku, modelVysledku, vysledekHtml, seznamHtml } from './vystup.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));

// Scénář ze zadání a testů: student, v roce pravidel mu je 22 let, studuje celý rok, k tomu mzda.
// Vše odvozené z rules.json (žádné dnešní datum), takže ukázka je pořád stejná.
const odpovedi = {
  narozeni: { rok: rules.rok - 22, mesic: 1 },
  mzda: { mesicne: 25000, mesice: 12 },
  studium: { studuje: true, od: 1, do: 12, druh: 'vs' },
  deti: [],
  manzel: { ma: false, prijem: 0, peceODite: false, ztpp: false },
  invalidita: { stupen: 0, ztpp: false },
  hypoteka: { uroky: 0, stareSmlouva: false },
  stari: { penzijko: 0, dip: 0, zivotni: 0, dlouhodobaPece: 0 },
  dary: { dary: 0, krev: 0 },
  odbory: false,
  prijmy: { maleDohody: 0, soubezne: 0, ostatni: 0 },
};
const m = modelVysledku(odpovedi, rules);
const student = m.v.polozky.find((p) => p.id === 'student');
if (!student || student.rocne !== rules.slevy.student.rocne) {
  throw new Error('Slevy 2027: ukázkový student má mít plnou slevu na studenta.');
}

export default {
  slevy: {
    rok: rules.rok,
    kroky: textyKroku(rules),
    vysledek: (sprite, plan48) => vysledekHtml(m, odpovedi, rules, { sprite, plan48, ukazka: true }),
    seznam: (sprite) => seznamHtml(m, rules, { sprite, idPrefix: 'ukazka-ukol' }),
  },
};
