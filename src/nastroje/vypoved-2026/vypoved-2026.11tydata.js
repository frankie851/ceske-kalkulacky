// Výpověď 2026 – ukázkový výsledek spočítaný při buildu (stránka bez JavaScriptu).
// Stejné moduly jako v prohlížeči: vypoved.js (výpočet) a vystup.js (texty a HTML).
// Vstup je odvozený z rules.json (datum doručení = datum ověření pravidel), ne z dnešního data.
import fs from 'node:fs';
import { spocitej, kartaHtml, detailyHtml, seznamHtml, denPo, DUVODY, KDO } from './vystup.js';
import { konecPomeru } from './vypoved.js';
import { cislo } from '../../js/format.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));

// Kontrolní příklady ze zadání: § 52 písm. c), 1,5 roku, hrubý 40 000 Kč, čistý 30 000 Kč, věk 40.
const doruceni = rules.meta.overeno;
const zaklad = { doruceni, kdo: 'zamestnavatel', duvod: 'c', zkusebniDoba: false };
const vstup = {
  ...zaklad,
  konecDohody: '',
  delkaLet: 1.5,
  vek: 40,
  hruby: 40000,
  cisty: 30000,
  datumZadosti: denPo(konecPomeru(zaklad, rules)),
};
const m = spocitej(vstup, rules);
if (m.od.castka !== 2 * vstup.hruby) throw new Error('Výpověď 2026: ukázka má mít odstupné 2× průměrný výdělek.');

const predchozi = rules.zakonikPrace.odstupne.predchoziPomer;
const pole = (n) => cislo(n, Number.isInteger(n) ? 0 : 1).replace(/ /g, ' ');

export default {
  vypoved: {
    pole: {
      doruceni: vstup.doruceni,
      konecDohody: '',
      delka: pole(vstup.delkaLet),
      vek: String(vstup.vek),
      hruby: pole(vstup.hruby),
      cisty: pole(vstup.cisty),
      datumZadosti: vstup.datumZadosti,
    },
    kdo: KDO.map((k) => ({ ...k, vybrano: k.hodnota === vstup.kdo })),
    duvody: DUVODY.map((d) => ({ ...d, vybrano: d.hodnota === vstup.duvod })),
    zkusebni: [{ hodnota: 'ne', text: 'Ne', vybrano: true }, { hodnota: 'ano', text: 'Ano', vybrano: false }],
    pricina: [{ hodnota: 'jine', text: 'Jiné zdravotní důvody', vybrano: true }, { hodnota: 'uraz', text: 'Pracovní úraz nebo nemoc z povolání', vybrano: false }],
    zvlastHrube: [{ hodnota: 'ne', text: 'Ne', vybrano: true }, { hodnota: 'ano', text: 'Ano', vybrano: false }],
    // § 67 odst. 2 ZP: předchozí pracovní poměr u téhož zaměstnavatele (revize 5. 11. 2026, VYP-05).
    napovedaDelka: `Ke dni skončení. Půl roku = 0,5. Započítej i předchozí pracovní poměr u stejného zaměstnavatele, když mezi nimi nebyla pauza delší než ${predchozi.mesicu} měsíců (${predchozi.zdroj.pravniZaklad.replace('zákoníku práce', 'ZP')}).`,
    nahradaDuvod: rules.zakonikPrace.nahrada271ca.duvod,
    nahradaNasobek: rules.zakonikPrace.nahrada271ca.nasobek,
    zvlastHrubeDuvody: rules.vylouceniPodpory.priZvlastHrubem.join(' '),
    konec: m.konec,
    karta: (sprite) => kartaHtml(m, { sprite, ukazka: true }),
    detaily: (sprite) => detailyHtml(m, rules, { sprite }),
    seznam: (sprite, dluhy) => seznamHtml(m, { sprite, idPrefix: 'ukol', dluhy }),
  },
};
