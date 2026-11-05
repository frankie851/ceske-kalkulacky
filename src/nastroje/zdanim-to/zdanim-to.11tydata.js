// Zdaním to? – ukázkové výsledky spočítané při buildu stejnými moduly jako v prohlížeči.
// Stránky bez JavaScriptu ukážou formulář s těmito hodnotami a spočítaný výsledek (data-ukazka).
// Vstupy jsou kontrolní příklady z docs/zadani-zdanim-to.md (rok podle rules.rok).
import fs from 'node:fs';
import { osvobozeniProdeje } from './prodeje.js';
import { spocitejDividendy } from './dividendy.js';
import { vysledekProdeju, vysledekDividend, doPole } from './vystup.js';
import { kc, procenta } from '../../js/format.js';

const rules = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const rok = rules.rok;

// Prodeje: ETF po 4 letech (časový test), akcie po 2 letech (úhrn nad limitem), krypto (hodnotový test).
const prodeje = [
  { typ: 'cenny-papir', nakup: `${rok - 4}-03-01`, prodej: `${rok}-03-02`, prijem: 60000, naklady: 40000 },
  { typ: 'cenny-papir', nakup: `${rok - 2}-05-10`, prodej: `${rok}-06-15`, prijem: 120000, naklady: 100000 },
  { typ: 'kryptoaktivum', nakup: `${rok - 1}-01-20`, prodej: `${rok}-09-01`, prijem: 30000, naklady: 12000 },
];
const vp = osvobozeniProdeje(prodeje, rok, rules);

// Dividendy (kurz 23 Kč/USD ze zadání): USA s W-8BEN, USA bez něj, Velká Británie bez srážky.
const zpusob = 'denni';
const vyplaty = [
  { zeme: 'US', hruba: 100, mena: 'USD', srazeno: 15, kurz: 23, zpusobKurzu: zpusob },
  { zeme: 'US', hruba: 100, mena: 'USD', srazeno: 30, kurz: 23, zpusobKurzu: zpusob },
  { zeme: 'GB', hruba: 100, mena: 'GBP', srazeno: 0, kurz: 29, zpusobKurzu: zpusob },
];
const vd = spocitejDividendy(vyplaty, { rok }, rules);

const stav = (s) => rules.stavy[s] || rules.stavy.neovereno;

export default {
  zt: {
    rok,
    stavPravidel: rules.meta.stavText,
    overitUrl: rules.overitUrl,
    typy: Object.entries(rules.prodeje.typy).map(([hodnota, t]) => ({ hodnota, text: t.popis ? `${t.nazev} (${t.popis})` : t.nazev })),
    prodeje: {
      radky: prodeje.map((p) => ({ ...p, prijem: doPole(p.prijem), naklady: doPole(p.naklady) })),
      ...vysledekProdeju(vp, rules),
      sporne: [
        { stav: stav(rules.prodeje.limit40mil.kryptoaktiva.stav), text: `Limit ${kc(rules.prodeje.limit40mil.kryptoaktiva.hodnota)} u kryptoaktiv: podle části zdrojů od roku ${rules.prodeje.limit40mil.zrusenoOdRoku} zůstal, jen u cenných papírů se zrušil. Do výpočtu ho nepočítáme, jen upozorníme.` },
        { stav: stav(rules.prodeje.hodnotovyTest.stavZahrnuti), text: `Do úhrnu ${kc(rules.prodeje.hodnotovyTest.limit)} počítáme i prodeje osvobozené časovým testem. Je to opatrnější varianta, výsledek může vyjít přísněji.` },
        { stav: stav(rules.prodeje.vzajemneZapocteni.stav), text: 'Zisky a ztráty z prodejů stejného druhu v roce vzájemně započítáváme.' },
        { stav: stav('shoda'), text: 'Kryptoaktiva, se kterými podnikáš, se osvobodit nedají. Nástroj počítá jen s osobními investicemi.' },
      ],
    },
    dividendy: {
      zpusoby: Object.entries(rules.kurzy.zpusoby).map(([hodnota, z]) => ({ hodnota, text: z.nazev, vybrano: hodnota === zpusob })),
      napovedaZpusobu: rules.kurzy.zpusoby[zpusob].popis,
      jednotnyStav: rules.kurzy.jednotny[String(rok)] ? null : `Jednotný kurz GFŘ za rok ${rok} zatím nevyšel (poslední je ${rules.kurzy.jednotnyStav.posledniZnamyPokyn}). Když ho zvolíš, zadej kurz ručně.`,
      zeme: Object.entries(rules.dividendy.zeme).map(([hodnota, z]) => ({ hodnota, text: z.nazev })),
      meny: rules.dividendy.meny,
      radky: vyplaty.map((v) => ({ ...v, hruba: doPole(v.hruba), srazeno: doPole(v.srazeno), kurz: doPole(v.kurz) })),
      ...vysledekDividend(vd, rules),
      limity: rules.priznani.limity.map((l) => ({ ...l, castka: kc(l.hodnota), stavInfo: stav(l.stav) })),
      dividendyVzdy: { ...rules.priznani.dividendyVzdy, stavInfo: stav(rules.priznani.dividendyVzdy.stav) },
      sazba: procenta(rules.dane.sazba.hodnota * 100),
    },
  },
};
