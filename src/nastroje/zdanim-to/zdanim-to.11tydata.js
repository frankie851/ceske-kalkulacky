// Zdaním to? – ukázkové výsledky spočítané při buildu stejnými moduly jako v prohlížeči.
// Stránky bez JavaScriptu ukážou formulář s těmito hodnotami a spočítaný výsledek (data-ukazka).
// Vstupy jsou kontrolní příklady z docs/zadani-zdanim-to.md (rok podle rules.rok).
import fs from 'node:fs';
import { osvobozeniProdeje } from './prodeje.js';
import { spocitejDividendy, dostupneZpusoby } from './dividendy.js';
import { vysledekProdeju, vysledekDividend, doPole } from './vystup.js';
import { kc, procenta, datum } from '../../js/format.js';

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
const zpusoby = dostupneZpusoby(rules, rok);
const zpusob = zpusoby[0];
const rezim = rules.dividendy.rezimy.vychozi;
const vyplaty = [
  { zeme: 'US', hruba: 100, mena: 'USD', srazeno: 15, kurz: 23, zpusobKurzu: zpusob },
  { zeme: 'US', hruba: 100, mena: 'USD', srazeno: 30, kurz: 23, zpusobKurzu: zpusob },
  { zeme: 'GB', hruba: 100, mena: 'GBP', srazeno: 0, kurz: 29, zpusobKurzu: zpusob },
];
const vd = spocitejDividendy(vyplaty, { rok, rezim }, rules);

const stav = (s) => rules.stavy[s] || rules.stavy.neovereno;
const pr = rules.prodeje;
const ht = pr.hodnotovyTest;
const pct = (podil) => procenta(podil * 100);
const limityHt = Object.entries(pr.druhy).map(([k, d]) => `${d.nazev.toLowerCase()} ${kc(ht.limity[k])}`).join(', ');
const limit40 = pr.limit40mil.limity.kryptoaktivum;
const jednotny = rules.kurzy.jednotny[String(rok)];
const posledni = rules.kurzy.posledniJednotny;
const pk = rules.priznani;

export default {
  // Patička webu na stránkách nástroje (zaklad.njk → paticka({ poznamka }))
  patickaPoznamka: `Nejde o daňové poradenství. Pravidla ověřena k ${datum(rules.meta.overeno)}.`,
  zt: {
    rok,
    overeno: rules.meta.overeno,
    overitUrl: rules.overitUrl,
    typy: Object.entries(pr.typy).map(([hodnota, t]) => ({ hodnota, text: t.popis ? `${t.nazev} (${t.popis})` : t.nazev, terminovy: t.terminovy })),
    lhuta: pr.casovyTest.let,
    prodeje: {
      radky: prodeje.map((p) => ({ ...p, prijem: doPole(p.prijem), naklady: doPole(p.naklady), terminovyPole: pr.typy[p.typ].terminovy })),
      ...vysledekProdeju(vp, rules),
      // Postup výpočtu (pořadí podle zadání) se stavem a zdrojem každého kroku
      kroky: [
        { stav: stav(ht.stav), zdroj: { ...ht.zdroj, citace: null }, text: `Cenné papíry a kryptoaktiva počítáme zvlášť: dva úhrny a dva samostatné limity (${limityHt}).` },
        { stav: stav(ht.stav), zdroj: ht.zdroj, text: `Hodnotový test: když úhrn všech hrubých příjmů z prodejů daného druhu za rok nepřesáhne limit, je osvobozené všechno. Elektronické peněžní tokeny (stablecoiny typu EMT) jsou z hodnotového testu vyňaté, do úhrnu nevstupují.` },
        { stav: stav(ht.zahrnuti.stav), zdroj: ht.zahrnuti.zdroj, text: `Do úhrnu počítáme i prodeje po ${pr.casovyTest.let} letech. Zákon mluví o úhrnu bez výjimky, oficiální metodiku finanční správy jsme nenašli. Je to opatrnější varianta a ve výsledku na ni vždy upozorníme.` },
        { stav: stav(pr.casovyTest.stav), zdroj: pr.casovyTest.zdroj, text: `Jinak časový test po jednotlivých prodejích: držba přes ${pr.casovyTest.let} roky = osvobozeno.` },
        { stav: stav(pr.cennePapiry.stav), zdroj: { ...pr.cennePapiry.zdroj, pravniZaklad: '§ 4 odst. 1 písm. u) a zk) ZDP', citace: pr.krypto.terminovyCitace }, text: `U cenných papírů i kryptoaktiv se časovým testem neosvobozuje budoucí (termínový) prodej sjednaný do ${pr.casovyTest.let} let od nákupu, i když kupní smlouva vznikne až později.` },
        { stav: stav(pr.casovyTest.stav), zdroj: { ...pr.limit40mil.zdroj, pravniZaklad: '§ 4 odst. 1 písm. zj), zk) a odst. 3 ZDP', citace: null }, text: `Elektronický peněžní token: ${pr.krypto.emt}.` },
        { stav: stav(pr.limit40mil.stav), zdroj: pr.limit40mil.zdroj, text: `Jen u kryptoaktiv: časově osvobozené příjmy nad ${kc(limit40)} za rok nejsou osvobozené v poměru (úhrn − ${kc(limit40)}) / úhrn, náklady krátíme stejným poměrem. Cenné papíry: ${pr.limit40mil.cennePapiryAPodily}.` },
        { stav: stav(pr.zapocteni.stav), zdroj: pr.zapocteni.zdroj, text: 'Zisky a ztráty započítáme jen uvnitř druhu (cenné papíry zvlášť, kryptoaktiva zvlášť). Záporný výsledek druhu je 0 a ztráta se do dalších let nepřevádí.' },
        { stav: stav(pr.zapocteni.kodKryptaP2.stav), zdroj: { ...pr.zapocteni.zdroj, citace: null }, text: 'Příloha č. 2 přiznání: pro kryptoaktiva tam není samostatný kód druhu příjmu. Který kód použít, ověř v pokynech k přiznání.' },
        { stav: stav(pr.krypto.stav), zdroj: pr.krypto.zdroj, text: `Osvobození kryptoaktiv platí od ${datum(pr.krypto.ucinnostOd)} (zákon č. ${pr.krypto.zakon}): ${pr.krypto.plati}.` },
        { stav: stav(pr.cennePapiry.stav), zdroj: pr.cennePapiry.zdroj, text: `Cenné papíry: ${pr.cennePapiry.kmenovyList}; ${pr.cennePapiry.opce}. Nástroj počítá s běžnými akciemi a ETF.` },
        { stav: stav(pr.naklady.stav), zdroj: { ...pr.naklady.zdroj, citace: null }, text: pr.naklady.text },
        { stav: stav(pr.oznameni.stav), zdroj: pr.oznameni.zdroj, text: `Osvobozený příjem vyšší než ${kc(pr.oznameni.limit)} je třeba oznámit finančnímu úřadu. Kalkulačka na to upozorní u každého takového prodeje.` },
        { stav: stav(rules.dane.sazba.stav), zdroj: rules.dane.sazba.zdroj, text: `Orientační daň počítáme sazbou ${pct(rules.dane.sazba.hodnota)}. Sazbu ${rules.dane.sazba.vyssiSazba.text} nepočítáme.` },
        { stav: stav('potvrzeno'), zdroj: null, text: 'Kryptoaktiva a cenné papíry v obchodním majetku (podnikání) se osvobodit nedají. Nástroj počítá jen s osobními investicemi.' },
      ],
      naklady: pr.naklady.text,
      smena: {
        stav: stav(pr.krypto.smena.stav),
        zdroj: pr.krypto.smena.zdroj,
        neprerusuje: pr.krypto.smena.neprerusujeCasovyTest,
        poznamka: pr.krypto.smena.poznamka,
      },
    },
    dividendy: {
      zpusoby: zpusoby.map((hodnota) => ({ hodnota, text: rules.kurzy.zpusoby[hodnota].nazev, vybrano: hodnota === zpusob })),
      zpusob,
      napovedaZpusobu: rules.kurzy.zpusoby[zpusob].popis,
      jednotnyStav: jednotny ? null : {
        stav: stav('nevydan'),
        text: `Jednotný kurz za rok ${rok}: ${rules.kurzy.jednotnyPoznamka[String(rok)]}. Poslední vydaný je pokyn ${posledni.pokyn} za rok ${posledni.rok} (Finanční zpravodaj ${posledni.fz}).`,
        zdroj: posledni.zdroj,
      },
      kombinace: { stav: stav(rules.kurzy.stav), zdroj: rules.kurzy.zdroj, text: 'Za celý rok platí jedna metoda: denní kurz ČNB, nebo jednotný kurz. Kombinovat je nejde.' },
      rezimy: Object.entries(rules.dividendy.rezimy.varianty).map(([hodnota, x]) => ({ hodnota, text: x.nazev, vybrano: hodnota === rezim })),
      napovedaRezimu: `Volba platí pro všechny zahraniční příjmy z kapitálového majetku najednou: ${rules.dividendy.rezimy.podminka}.`,
      zeme: Object.entries(rules.dividendy.zeme).map(([hodnota, z]) => ({ hodnota, text: z.nazev })),
      meny: rules.dividendy.meny,
      radky: vyplaty.map((v) => ({ ...v, hruba: doPole(v.hruba), srazeno: doPole(v.srazeno), kurz: doPole(v.kurz) })),
      ...vysledekDividend(vd, rules),
      limity: pk.limity.map((l) => ({ text: l.text, pravniZaklad: l.pravniZaklad, do2026: kc(l.do2026), od2027: kc(l.od2027) })),
      priznani: { stav: stav(pk.stav), zdroj: pk.zdroj, zakon: pk.zakon, prvni: pk.prvniZdanovaciObdobi },
      dividendyVLimitu: { ...pk.dividendyVLimitu, stavInfo: stav(pk.dividendyVLimitu.stav) },
      sazba: pct(rules.dane.sazba.hodnota),
    },
  },
};
