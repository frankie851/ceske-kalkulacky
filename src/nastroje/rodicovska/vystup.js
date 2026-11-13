// Rodičovská pro celou rodinu – texty, tabulky a seznamy výsledku. Sdílí je build
// (rodicovska.11tydata.js) i prohlížeč (app.js), aby ukázka bez JS a živý výpočet vypadaly stejně.
// Žádné částky ani sazby tu nejsou natvrdo: všechno se bere z výsledku planRodiny a z rules.json.
// Texty tykají a jsou rodově neutrální; „matka“ a „otec“ jsou jen popisky rolí z původní aplikace.
import { kc, cislo, datum } from '../../js/format.js';
import { pridejDny, prvniDenMesice, cistaMzda, parametryMzdy } from './rodina.js';
import { TYPY } from './timeline.js';

export const NBSP = ' ';
const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const ROLE = { matka: 'matka', otec: 'otec' };
const velke = (t) => `${t.charAt(0).toUpperCase()}${t.slice(1)}`;

/** Krok posuvníku výše rodičovského příspěvku (stejný jako zaokrouhlení v navrhVyse). */
export const KROK_VYSE = 100;

/** Legenda časové osy (třídy seg-* jako v timeline.js). */
export const legenda = TYPY.map((t) => ({ klic: t.klic, nazev: t.nazev }));

export function mesicu(n) {
  if (n === 1) return '1 měsíc';
  if (n >= 2 && n <= 4) return `${n} měsíce`;
  return `${cislo(n)} měsíců`;
}

const dnu = (n) => (n === 1 ? '1 den' : n >= 2 && n <= 4 ? `${n} dny` : `${cislo(n)} dní`);

/** „březen 2030“ pro index měsíce věku dítěte (0 = měsíc narození). */
export function nazevMesice(plan, index) {
  const m = plan.mesice.find((x) => x.index === index);
  if (!m) return `${index}. měsíc dítěte`;
  return `${MESICE[m.mesic - 1]}${NBSP}${m.rok}`;
}

const nazevMesiceIso = (iso) => `${MESICE[Number(iso.slice(5, 7)) - 1]}${NBSP}${iso.slice(0, 4)}`;

/** Pravidla RP pro dítě (vekMesicu, celkem…) – z výsledku planRodiny. */
const vekMesicu = (plan) => plan.rp.vekMesicu;

/** Denní výše dávky; když dávka trvá přes 1. leden, i sazba po přepočtu (§ 22 odst. 2 ZNP). */
const zmenySazby = (info) => (info.sazby || []).filter((x, i, a) => i > 0 && x.denni !== a[i - 1].denni);
const denne = (info) => zmenySazby(info).reduce(
  (t, x) => `${t}, od 1. 1. ${x.rok} ${kc(x.denni)}`,
  `${kc(info.denni)} denně`,
);

/* ---------- karta výsledku ---------- */

export function vysledek(plan) {
  const r = plan.rp;
  const s = plan.souhrn;
  const vycerpani = r.mesicVycerpani != null ? nazevMesice(plan, r.mesicVycerpani) : null;
  const vysvetleni = vycerpani
    ? `Rodičovský příspěvek ${kc(r.celkem)} po ${kc(r.vyse)} měsíčně vystačí na ${mesicu(r.mesiceCerpani)}. Poslední výplata vychází na ${vycerpani} (${r.mesicVycerpani}. měsíc dítěte).`
    : `Rodičovský příspěvek po ${kc(r.vyse)} měsíčně se do 3 let dítěte nevyčerpá. Z ${kc(r.celkem)} rodina dostane ${kc(r.vycerpano)}.`;

  const ppmPopis = [
    plan.matka.ppm && `matka ${denne(plan.matka.ppm)}`,
    plan.otec.ppm && `otec ${denne(plan.otec.ppm)}`,
  ].filter(Boolean).join(', ');

  return {
    cislo: kc(s.davky),
    popis: 'dostane rodina na mateřské, otcovské a rodičovském příspěvku',
    vysvetleni,
    statistiky: [
      {
        hodnota: vycerpani || 'nevyčerpá se',
        popis: vycerpani
          ? `rodičovský příspěvek se vyčerpá (${kc(r.vycerpano)} za ${mesicu(r.mesiceCerpani)} čerpání)`
          : `do 3 let dítěte se z rodičovského příspěvku vyčerpá jen ${kc(r.vycerpano)}`,
        zvyraznit: Boolean(vycerpani),
      },
      { hodnota: kc(s.ppm), popis: ppmPopis ? `mateřská (${ppmPopis})` : 'mateřská (bez nároku)', zvyraznit: s.ppm > 0 },
      {
        hodnota: kc(s.otcovska),
        popis: plan.otec.otcovska ? `otcovská (${denne(plan.otec.otcovska)})` : 'otcovská (nečerpá se)',
        zvyraznit: s.otcovska > 0,
      },
      {
        hodnota: kc(r.propadne),
        popis: r.propadne > 0 ? 'propadne k 3. narozeninám dítěte' : 'propadne – nic, celá částka se vyčerpá',
        zvyraznit: false,
      },
    ],
    propadne: r.propadne > 0,
    lista: kc(s.davky),
  };
}

/* ---------- varování (vlastní texty: rodina.js vyká, web tyká) ---------- */

/**
 * @param {object} plan výsledek planRodiny
 * @param {object} zadano vstup z formuláře (před úpravami v planRodiny – kvůli kdoPpm)
 * @param {object} rules pravidla
 * @returns {{ uroven: 'pozor'|'info', titulek?: string, text: string, typ: string }[]}
 */
export function varovani(plan, zadano, rules) {
  const r = plan.rp;
  return plan.varovani.map((v) => {
    switch (v.typ) {
      case 'propadnuti': {
        const potreba = r.navrhProVycerpani;
        return {
          ...v,
          titulek: 'Část rodičovského příspěvku propadne.',
          text: `Do 3 let dítěte se vyčerpá jen ${kc(r.vycerpano)}, zbylých ${kc(r.propadne)} propadne. `
            + (potreba <= r.strop
              ? `Aby se vyčerpal celý, zvol aspoň ${kc(potreba)} měsíčně.`
              : `Ani při maximální výši ${kc(r.strop)} měsíčně se celá částka do 3 let nevyčerpá.`),
        };
      }
      case 'bezNaroku': {
        const kdo = zadano && zadano.kdoPpm in ROLE ? velke(ROLE[zadano.kdoPpm]) : 'Rodič';
        return {
          ...v,
          text: `${kdo} podle zadání nemá nárok na mateřskou (chybí příjem nebo ${cislo(rules.ppm.narokDnyPojisteni)} dní pojištění za poslední 2 roky). Počítáme bez mateřské, rodičovský příspěvek od narození.`,
        };
      }
      case 'sestinedeli':
        return { ...v, text: `Druhý rodič může převzít péči s mateřskou nejdřív od 7. týdne po porodu. Střídání proto počítáme od ${datum(plan.stridaniOd)}.` };
      case 'navratPredStridanim':
        return { ...v, text: 'Návrat do práce je dřív než střídání, takže se střídání neprojeví.' };
      case 'otcovskaSMaterskou':
        return { ...v, text: `Otcovská se ${dnu(v.dni)} kryje s mateřskou otce. Za tyto dny se vyplácí jen mateřská, otcovská se neprodlužuje (§ 48 odst. 1 písm. a) zákona o nemocenském pojištění). Chceš celou otcovskou? Nastup na ni dřív.` };
      case 'otcovskaBezNaroku':
        return { ...v, text: 'Otec podle zadání nemá příjem z nemocensky pojištěného zaměstnání, otcovskou proto nepočítáme.' };
      case 'nadStrop':
        return { ...v, text: `Zvolená výše je nad měsíčním stropem ${kc(r.strop)}. Počítáme se stropem.` };
      case 'odhadHranice': {
        const h = [plan.matka.ppm, plan.otec.ppm, plan.otec.otcovska].filter(Boolean).find((x) => x.hranice.odhad);
        const rok = h ? h.datum.slice(0, 4) : '';
        return { ...v, text: `Redukční hranice pro rok ${rok} zatím nejsou vyhlášené. Počítáme s hranicemi roku ${h ? h.hranice.rok : ''}.` };
      }
      case 'odhadMzdy': {
        const posledni = Object.keys(rules.cistaMzda).sort().pop();
        return { ...v, text: `Čistou mzdu v dalších letech odhadujeme podle sazeb roku ${posledni}.` };
      }
      default:
        return { ...v };
    }
  });
}

/* ---------- shrnutí kroků formuláře ---------- */

export function shrnutiKroku(plan, rules) {
  const v = plan.vstup;
  const p = (x) => (x > 0 ? kc(x) : 'bez příjmu');
  const kdo = { matka: 'Matka', otec: 'Otec', nikdo: 'Nikdo' }[v.kdoPpm] || 'Nikdo';
  let materska = kdo;
  if (v.kdoPpm === 'matka' && plan.ppm) materska += `, od ${datum(plan.ppm.start)}`;
  else if (v.kdoPpm === 'otec' && plan.ppm) materska += `, od ${datum(plan.ppm.start)}`;
  else materska = 'Bez mateřské';
  const otc = plan.otec.otcovska
    ? `Ano, ${datum(plan.otec.otcovska.start)} až ${datum(plan.otec.otcovska.konec)}`
    : 'Ne';
  const casti = [`${kc(plan.rp.vyse)} měsíčně`];
  casti.push(plan.stridaniOd ? `střídání od ${datum(plan.stridaniOd)}` : 'bez střídání');
  if (plan.navratOd) casti.push(`návrat od ${datum(plan.navratOd)}`);
  return {
    dite: `Termín ${datum(plan.terminPorodu)}, ${v.vicercata ? 'vícerčata' : 'jedno dítě'}`,
    prijmy: `Matka ${p(v.prijemMatka)}, otec ${p(v.prijemOtec)}`,
    materska,
    otcovska: otc,
    rp: casti.join(', '),
  };
}

/** Nápověda pod příjmem: orientační čistá mzda. */
export function napovedaPrijmu(prijem, rules) {
  const zaklad = 'Hrubý měsíční příjem, průměr za posledních 12 měsíců.';
  if (!(prijem > 0)) return zaklad;
  const pm = parametryMzdy(rules, Number(rules.meta.overeno.slice(0, 4)));
  return `${zaklad} Orientačně čistá mzda ${kc(cistaMzda(prijem, pm))} měsíčně (sazby ${pm.rok}, bez slevy na dítě).`;
}

/** Text pod posuvníkem výše rodičovského příspěvku. */
export function napovedaRp(plan, rules) {
  const r = plan.rp;
  return `Celkem ${kc(r.celkem)}, strop ${kc(r.strop)} měsíčně. Čerpání od: ${nazevMesice(plan, r.odMesice)} (${r.odMesice}. měsíc dítěte). Výši jde měnit jednou za ${mesicu(rules.rpZmenaMesicu)}.`;
}

/* ---------- tabulky ---------- */

export const sloupceMesicu = ['Měsíc', 'Dávky', 'Čisté mzdy', 'Celkem'];

export function radkyMesicu(plan) {
  return plan.mesice.map((m) => {
    let popis = `${MESICE[m.mesic - 1]} ${m.rok}`;
    if (m.index === 0) popis += ' – porod';
    else if (m.index < 0) popis += ' – před porodem';
    if (m.index === plan.rp.mesicVycerpani) popis += ' – poslední rodičovský příspěvek';
    return [popis, kc(m.davky), kc(m.mzdy), kc(m.celkem)];
  });
}

export const sloupceSouhrnu = ['Položka', 'Částka', 'Poznámka'];

export function radkySouhrnu(plan, rules) {
  const s = plan.souhrn;
  const r = plan.rp;
  const radky = [];
  if (plan.matka.ppm) radky.push(['Mateřská – matka', kc(s.ppmMatka), `${denne(plan.matka.ppm)}, nástup ${datum(plan.matka.ppm.datum)}`]);
  if (plan.otec.ppm) radky.push(['Mateřská – otec', kc(s.ppmOtec), `${denne(plan.otec.ppm)}, nástup ${datum(plan.otec.ppm.datum)}`]);
  if (!plan.matka.ppm && !plan.otec.ppm) radky.push(['Mateřská', kc(0), 'bez nároku nebo nikdo nečerpá']);
  radky.push(['Otcovská', kc(s.otcovska), plan.otec.otcovska ? `${denne(plan.otec.otcovska)}, ${cislo(rules.otcovska.dny)} dní` : 'nečerpá se']);
  radky.push(['Rodičovský příspěvek', kc(r.vycerpano), `z ${kc(r.celkem)}, po ${kc(r.vyse)} měsíčně`]);
  radky.push(['Dávky celkem', kc(s.davky), r.propadne > 0 ? `propadne ${kc(r.propadne)}` : 'nic nepropadne']);
  radky.push(['Orientační čisté mzdy', kc(s.mzdy), 'kdo zrovna pracuje, bez slevy na dítě']);
  radky.push(['Příjem rodiny za celé období', kc(s.celkem), `${nazevMesice(plan, plan.mesice[0].index)} až ${nazevMesice(plan, plan.mesice.at(-1).index)}`]);
  return radky;
}

/** Řádek „Dávky celkem“ se zvýrazní. */
export const zvyraznitSouhrn = (radky) => radky.findIndex((r) => r[0] === 'Dávky celkem');

/* ---------- jak jsme počítali ---------- */

export function jakPocitame(plan, rules) {
  const r = plan.rp;
  const radek = (nazev, info) => (info
    ? `${nazev}: rozhodné období ${cislo(info.dny)} dní, denní vyměřovací základ ${kc(info.dvz, 2)}, po redukci ${kc(info.redDvz)} (hranice ${info.hranice.rok}: ${cislo(info.hranice.h1)} / ${cislo(info.hranice.h2)} / ${cislo(info.hranice.h3)} Kč). ${cislo(rules.ppm.sazba * 100)} % z toho je ${kc(info.denni)} denně, nástup ${datum(info.datum)}.`
      + zmenySazby(info).map((x) => ` Od 1. 1. ${x.rok} se dávka přepočítá podle hranic ${x.hranice.rok} (${cislo(x.hranice.h1)} / ${cislo(x.hranice.h2)} / ${cislo(x.hranice.h3)} Kč): základ po redukci ${kc(x.redDvz)}, ${kc(x.denni)} denně (§ 22 odst. 2 zákona o nemocenském pojištění).`).join('')
    : null);
  const min = plan.vstup.vicercata ? r.minStropVicercata : r.minStrop;
  const nasobek = plan.vstup.vicercata ? `${cislo(r.nasobekVicercata)} × ` : '';
  return [
    radek('Mateřská – matka', plan.matka.ppm),
    radek('Mateřská – otec', plan.otec.ppm),
    radek('Otcovská', plan.otec.otcovska),
    plan.ppm ? `Období mateřské: ${datum(plan.ppm.start)} až ${datum(plan.ppm.konec)}.` : null,
    `Strop rodičovského příspěvku = vyšší z částek ${kc(min)} a ${nasobek}${cislo(rules.rpPodilDvz * 100)} % × ${cislo(rules.rpDnu)} × vyšší redukovaný základ rodičů k datu narození = ${kc(r.strop)} měsíčně.`,
    'Rodičovský příspěvek náleží od měsíce narození. V měsících, kdy rodina pobírá mateřskou, náleží jen rozdíl mezi zvolenou výší a mateřskou za ten měsíc, a jen když je zvolená výše vyšší (§ 30b odst. 3 zákona o státní sociální podpoře).',
    'Čerpá se nejdéle do 3 let dítěte, včetně celého měsíce 3. narozenin (§ 30b odst. 1 písm. d). Co se do té doby nevyčerpá, propadne. Zbytek menší než měsíční částka se vyplatí spolu s poslední výplatou (§ 30 odst. 6).',
    'Čistá mzda je orientační: pojistné zaměstnance a záloha na daň po slevě na poplatníka, bez daňového zvýhodnění na dítě a dalších slev.',
  ].filter(Boolean);
}

/* ---------- kontrolní seznam ---------- */

export function kontrolniSeznam(plan, rules) {
  const B = plan.terminPorodu;
  // Odkazy na úřady, kde se o dávku žádá (revize 5. 11. 2026, ROD-11: název odpovídá cíli odkazu).
  const zdrojPpm = { nazev: rules.ppm.urad.nazev, url: rules.ppm.urad.url };
  const zdrojOtc = { nazev: rules.otcovska.nazev, url: rules.otcovska.url };
  const zdrojRp = { nazev: rules.rodicovskyUrad.nazev, url: rules.rodicovskyUrad.url };
  const polozky = [];
  if (plan.ppm && plan.vstup.kdoPpm === 'matka') {
    polozky.push({
      ukol: 'Mateřská: žádost vystaví ošetřující gynekolog. Matka ji předá zaměstnavateli, dávku vyplácí ČSSZ.',
      termin: `Nástup ${datum(plan.ppm.start)}`, typ: 'doporuceny', zdroj: zdrojPpm,
    });
  }
  polozky.push({ ukol: 'Rodný list vystaví matrika podle místa narození. Dítě co nejdřív přihlas u zdravotní pojišťovny.', termin: 'Hned po porodu', typ: 'doporuceny' });
  if (plan.otec.otcovska) {
    polozky.push({
      ukol: 'Otcovská: žádost na tiskopisu ČSSZ se podává přes zaměstnavatele. Nastoupit jde do 6 týdnů od narození.',
      termin: `Nástup nejpozději ${datum(pridejDny(B, rules.otcovska.nastupDoDne))}`, typ: 'hard', zdroj: zdrojOtc,
    });
  }
  if (plan.otec.ppm) {
    polozky.push({
      ukol: 'Převzetí mateřské otcem: písemná dohoda rodičů a žádost přes zaměstnavatele. Nejdřív od 7. týdne po porodu, aspoň na 7 dní.',
      termin: `Od ${datum(plan.otec.ppm.datum)}`, typ: 'hard', zdroj: zdrojPpm,
    });
  }
  polozky.push({
    ukol: `Rodičovský příspěvek: žádost na Úřadu práce ČR (online přes portál MPSV, datovou schránkou nebo osobně). Kdo chce víc než ${kc(plan.rp.minStrop)} měsíčně, přiloží potvrzení o denním vyměřovacím základu od ČSSZ.`,
    termin: `Od: ${nazevMesiceIso(prvniDenMesice(B, plan.rp.odMesice))}`, typ: 'doporuceny', zdroj: zdrojRp,
  });
  polozky.push({
    ukol: `Výši rodičovského příspěvku jde měnit jednou za ${mesicu(rules.rpZmenaMesicu)}, na písemnou žádost a ne zpětně.`,
    termin: 'Kdykoli během čerpání', typ: 'doporuceny',
  });
  if (plan.navratOd) {
    polozky.push({
      ukol: `Návrat do práce domluv se zaměstnavatelem. Dítě mladší 2 let smí být v jeslích nebo školce nejvýš ${cislo(rules.jesleHodinMesicne)} hodin měsíčně, jinak rodičovský příspěvek zaniká.`,
      termin: `Před ${datum(plan.navratOd)}`, typ: 'doporuceny',
    });
  }
  polozky.push({ ukol: 'Daňové zvýhodnění na dítě uplatni u zaměstnavatele. V čisté mzdě tady započtené není.', termin: 'Po narození', typ: 'doporuceny' });
  polozky.push({ ukol: 'Když se narodí další dítě, nahlas to Úřadu práce. Rodičovský příspěvek na starší dítě končí, nevyčerpaný zbytek jde vyplatit jednorázově.', termin: 'Při narození dalšího dítěte', typ: 'doporuceny', zdroj: zdrojRp });
  polozky.push({
    ukol: 'Poslední měsíc čerpání rodičovského příspěvku je měsíc 3. narozenin dítěte. Co se do té doby nevyčerpá, propadne.',
    termin: `Do ${datum(pridejDny(prvniDenMesice(B, vekMesicu(plan) + 1), -1))}`, typ: 'hard',
  });
  return polozky;
}
