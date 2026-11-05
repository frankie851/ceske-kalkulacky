// Ukázkový výsledek průvodce „Mám EET?“ spočítaný při buildu (stránka bez JS).
// Stejné moduly jako v prohlížeči: rules.js (rozhodování) a vystup.js (texty a HTML).
// Funkce se volají ze šablony s URL spritu (kvůli pathPrefix): {{ eetUkazka.vysledek(sprite) | safe }}.
import fs from 'node:fs';
import { fill, uiVars } from './rules.js';
import { modelEet, vysledekEetHtml, kalkulackaHtml, seznamHtml, textOdpovedi } from './vystup.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const vars = uiVars(rules);

// Scénář ze zadání: OSVČ, hotovost a QR u pultu, paušální daň 1. pásmo, příjmy 800 000 Kč.
const odpovedi = {
  form: 'osvc',
  payments: ['cash', 'qrOnSite'],
  sector: 'none',
  flatTax: 'band1',
  income: 800000,
  blind: false,
  units: 1,
};
const model = modelEet(odpovedi, rules);
if (model.verdikt !== 'off' || model.r.eetOff.surchargeAnnual !== 16800) {
  throw new Error('Mám EET?: ukázkový scénář má vyjít „off“ s přirážkou 16 800 Kč.');
}

const moznosti = (q) => {
  if (q.type === 'yesno') return [rules.ui.yes, rules.ui.no];
  if (q.type === 'number') return null;
  return rules[q.optionsFrom].map((o) => o.label);
};

export default {
  eetUvod: fill(rules.ui.intro, vars),
  eetSoukromi: rules.meta.privacyNote,
  eetPrehled: rules.questions.map((q) => ({
    id: q.id,
    titulek: fill(q.title, vars),
    napoveda: q.help,
    moznosti: moznosti(q),
    jednotka: q.unit ?? null,
    ukazka: odpovedi[q.id] === undefined ? null : textOdpovedi(q, odpovedi[q.id], rules),
  })),
  eetUkazka: {
    verdikt: model.verdikt,
    vysledek: (sprite) => vysledekEetHtml(model, rules, { sprite, ukazka: true }),
    kalkulacka: (sprite) => kalkulackaHtml(model.r, rules, { sprite, idPrefix: 'ukazka-kalk' }),
    seznam: (sprite) => seznamHtml(model, rules, { sprite, idPrefix: 'ukazka-ukol' }),
  },
  eetPaticka: {
    disclaimer: rules.meta.disclaimer,
    web: rules.meta.officialSite,
    infolinka: rules.meta.hotline,
  },
};
