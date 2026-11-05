// Inflační kalkulačka – texty, výsledky a grafy. Bez DOM: stejný modul běží při buildu
// (ukázkový výsledek v inflacni-kalkulacka.11tydata.js) i v prohlížeči (ui.js).
// Výpočty jsou v inflation.js (převzato beze změny), výchozí hodnoty v rules.json.
import {
  resolveMonth, convert, cumulativeInflation, annualizedInflation, realReturn, nominalForPeriod,
  annualize, realWageChange, monthsBetween, monthToOrdinal, ordinalToMonth, levelSeries, yoySeries,
} from './inflation.js';
import { kc, cislo, procenta } from '../../js/format.js';
import { caroveGrafy, tabulkaDat } from '../../js/graf.js';

export const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const MESICE_GEN = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
const MESICE_LOK = ['lednu', 'únoru', 'březnu', 'dubnu', 'květnu', 'červnu', 'červenci', 'srpnu', 'září', 'říjnu', 'listopadu', 'prosinci'];
const NBSP = ' ';
const MINUS = '−';

const cast = (m) => ({ rok: m.slice(0, 4), mesic: Number(m.slice(5)) - 1 });
/** "2005-01" → "leden 2005" */
export const nom = (m) => `${MESICE[cast(m).mesic]}${NBSP}${cast(m).rok}`;
/** "2005-01" → "ledna 2005" */
export const gen = (m) => `${MESICE_GEN[cast(m).mesic]}${NBSP}${cast(m).rok}`;
/** "2005-01" → "lednu 2005" */
export const lok = (m) => `${MESICE_LOK[cast(m).mesic]}${NBSP}${cast(m).rok}`;
/** Posune měsíc o celé roky: posunRoky("2026-09", -5) → "2021-09" */
export const posunRoky = (m, roky) => `${Number(m.slice(0, 4)) + roky}${m.slice(4)}`;

/** Částka v Kč; malé částky na haléře. */
export const castka = (n) => kc(n, Math.abs(n) < 100 ? 2 : 0);

/** Podíl → procenta se znaménkem: 0.0417 → "+4,17 %", −0.012 → "−1,2 %". */
export function sZnamenkem(podil, des = 1) {
  const t = procenta(Math.abs(podil * 100), des);
  if (t === '–') return t;
  const nula = Number((Math.abs(podil * 100)).toFixed(des)) === 0;
  return nula ? t : `${podil > 0 ? '+' : MINUS}${t}`;
}
/** Podíl → procenta bez znaménka (záporné s mínusem). */
const pct = (podil, des = 1) => (podil < 0 ? sZnamenkem(podil, des) : procenta(podil * 100, des));

const mnozne = (n, jeden, dva, pet) => `${n}${NBSP}${n === 1 ? jeden : n >= 2 && n <= 4 ? dva : pet}`;
/** 260 → "21 let a 8 měsíců" */
export function delka(mesicu) {
  const m = Math.abs(mesicu);
  const roky = Math.floor(m / 12);
  const zbytek = m % 12;
  const r = roky ? mnozne(roky, 'rok', 'roky', 'let') : '';
  const z = zbytek ? mnozne(zbytek, 'měsíc', 'měsíce', 'měsíců') : '';
  return [r, z].filter(Boolean).join(' a ') || '0 měsíců';
}

/** Výchozí hodnoty formulářů podle rules.json a posledního měsíce v datech. */
export function vychozi(series, pravidla) {
  const v = pravidla.vychozi;
  const zpet = (roky) => resolveMonth(series, posunRoky(series.last, -roky)).month;
  return {
    prepocet: { castka: v.prepocet.castka, od: resolveMonth(series, v.prepocet.od).month, do: series.last },
    vynos: { urok: v.vynos.urok, typ: v.vynos.typ, od: zpet(v.vynos.letZpet), do: series.last },
    mzda: { mzdaTehdy: v.mzda.mzdaTehdy, mzdaTed: v.mzda.mzdaTed, od: zpet(v.mzda.letZpet), do: series.last },
  };
}

/** Měsíce mimo data nahradí nejbližšími dostupnými a vrátí poznámky k výsledku. */
export function vyresObdobi(series, odZadany, doZadany) {
  const poznamky = [];
  const vyres = (m) => {
    const r = resolveMonth(series, m);
    if (r.clamped === 'after') poznamky.push(`Za ${nom(m)} zatím data nejsou. Počítáme s posledním dostupným měsícem (${nom(r.month)}).`);
    if (r.clamped === 'before') poznamky.push(`Data začínají měsícem ${nom(r.month)}. Počítáme s ním.`);
    return r.month;
  };
  const od = vyres(odZadany);
  const doM = vyres(doZadany);
  return { od, do: doM, poznamky: [...new Set(poznamky)] };
}

/**
 * Přepočet částky mezi dvěma měsíci.
 * @returns výsledek pro kartu: { kicker, nadpis, cislo, popis, vysvetleni, statistiky, lista, poznamky, obdobi, ton }
 */
export function prepocet(series, { castka: c, od: odZadany, do: doZadany }) {
  const { od, do: doM, poznamky } = vyresObdobi(series, odZadany, doZadany);
  const i0 = series.index(od);
  const i1 = series.index(doM);
  const vysledek = convert(c, i0, i1);
  const [a, b] = od <= doM ? [od, doM] : [doM, od];
  const mesicu = monthsBetween(a, b);
  // změna cen v chronologickém směru (i při obráceném přepočtu)
  const zmena = cumulativeInflation(series.index(a), series.index(b));
  const rocne = mesicu > 0 ? annualizedInflation(series.index(a), series.index(b), mesicu) : 0;
  const vysvetleni = od === doM
    ? 'Výchozí i cílový měsíc jsou stejné, částka se nemění.'
    : `Ceny od ${gen(a)} do ${gen(b)} ${zmena >= 0 ? 'vzrostly' : 'klesly'} o ${procenta(Math.abs(zmena) * 100, 1)} `
      + `(průměrně ${pct(rocne)} ročně). ${castka(c)} v ${lok(od)} má stejnou kupní sílu jako ${castka(vysledek)} v ${lok(doM)}.`;
  return {
    kicker: 'Přepočet peněz v čase',
    nadpis: `${castka(c)} z ${gen(od)}`,
    cislo: castka(vysledek),
    popis: `Tolik je to v ${lok(doM)}`,
    vysvetleni,
    statistiky: [
      { hodnota: sZnamenkem(zmena), popis: 'Změna cen za období' },
      { hodnota: pct(rocne), popis: 'Průměrná inflace ročně' },
      { hodnota: delka(mesicu), popis: `${nom(a)} až ${nom(b)}` },
    ],
    lista: { cislo: castka(vysledek), popis: `${castka(c)} z ${gen(od)}` },
    poznamky,
    obdobi: { od, do: doM },
    ton: null,
  };
}

/**
 * Reálný výnos: úrok p. a. (typ 'pa') nebo celkem za období (typ 'celkem'), v procentech.
 * @returns výsledek pro kartu, nebo { chyba: { pole, text } }
 */
export function vynos(series, { urok, typ, od: odZadany, do: doZadany }) {
  const { od, do: doM, poznamky } = vyresObdobi(series, odZadany, doZadany);
  const mesicu = monthsBetween(od, doM);
  if (mesicu <= 0) return { chyba: { pole: 'vynos-do', text: 'Zvol období, ve kterém je „Do“ později než „Od“.' }, poznamky, obdobi: { od, do: doM } };
  const sazba = urok / 100;
  const inflace = cumulativeInflation(series.index(od), series.index(doM));
  const rocne = typ === 'pa';
  const nominal = rocne ? nominalForPeriod(sazba, mesicu) : sazba;
  const realne = realReturn(nominal, inflace);
  const realneRocne = annualize(realne, mesicu);
  const roste = realne >= 0;
  const vysvetleni = `Za ${delka(mesicu)} (${nom(od)} až ${nom(doM)}) vzrostly peníze nominálně o ${pct(nominal)}, ceny o ${pct(inflace)}. `
    + (roste
      ? `Reálně tedy peníze rostly o ${pct(realne)} (průměrně ${pct(realneRocne, 2)} ročně).`
      : `Reálně tedy ztrácely hodnotu: ${sZnamenkem(realne)} (průměrně ${sZnamenkem(realneRocne, 2)} ročně).`);
  const cislo = rocne ? sZnamenkem(realneRocne, 2) : sZnamenkem(realne, 2);
  const popis = rocne ? 'Reálný výnos ročně, po odečtení inflace' : 'Reálný výnos za celé období';
  return {
    kicker: 'Reálný výnos',
    nadpis: roste ? 'Výnos inflaci porazil' : 'Inflace byla rychlejší',
    cislo,
    popis,
    vysvetleni,
    statistiky: [
      { hodnota: sZnamenkem(nominal), popis: 'Nominální výnos za období' },
      { hodnota: sZnamenkem(inflace), popis: 'Inflace za období' },
      { hodnota: sZnamenkem(realne), popis: 'Reálně za období', zvyraznit: roste },
    ],
    lista: { cislo, popis: rocne ? 'Reálný výnos ročně' : 'Reálný výnos za období' },
    poznamky,
    obdobi: { od, do: doM },
    ton: roste ? 'zisk' : 'ztrata',
  };
}

/** Reálná změna mzdy mezi dvěma měsíci. */
export function mzda(series, { mzdaTehdy, mzdaTed, od: odZadany, do: doZadany }) {
  const { od, do: doM, poznamky } = vyresObdobi(series, odZadany, doZadany);
  const i0 = series.index(od);
  const i1 = series.index(doM);
  const zmena = realWageChange(mzdaTehdy, mzdaTed, i0, i1);
  const potreba = convert(mzdaTehdy, i0, i1);
  const lepsi = zmena >= 0;
  const cislo = sZnamenkem(zmena, 2);
  return {
    kicker: 'Mzda a inflace',
    nadpis: lepsi ? 'Tvoje mzda reálně vzrostla' : 'Tvoje mzda reálně klesla',
    cislo,
    popis: 'Reálná změna mzdy, po odečtení inflace',
    vysvetleni: `Mzda se nominálně změnila o ${sZnamenkem(mzdaTed / mzdaTehdy - 1)}, ceny o ${sZnamenkem(cumulativeInflation(i0, i1))}. `
      + `Na stejnou kupní sílu jako ${castka(mzdaTehdy)} v ${lok(od)} by v ${lok(doM)} stačilo ${castka(potreba)}.`,
    statistiky: [
      { hodnota: sZnamenkem(mzdaTed / mzdaTehdy - 1), popis: 'Mzda nominálně' },
      { hodnota: sZnamenkem(cumulativeInflation(i0, i1)), popis: 'Ceny za období' },
      { hodnota: castka(potreba), popis: `Stejná kupní síla v ${lok(doM)}` },
    ],
    lista: { cislo, popis: 'Reálná změna mzdy' },
    poznamky,
    obdobi: { od, do: doM },
    ton: lepsi ? 'zisk' : 'ztrata',
  };
}

/** Období pro grafy: chronologicky, aspoň rok, ať je co kreslit. */
export function obdobiGrafu(series, od, doM) {
  let [a, b] = od <= doM ? [od, doM] : [doM, od];
  if (monthsBetween(a, b) < 12) a = resolveMonth(series, ordinalToMonth(monthToOrdinal(b) - 12)).month;
  return [a, b];
}

/** Osa X: u delších období v letech (popisky jen roky), u kratších v měsících. */
function osaCasu(a, b) {
  if (monthsBetween(a, b) >= 36) {
    return {
      x: (m) => Number(m.slice(0, 4)) + (Number(m.slice(5)) - 1) / 12,
      format: (x) => {
        const rok = Math.floor(x + 1e-9);
        const mesic = Math.round((x - rok) * 12) + 1;
        return mesic === 1 ? String(rok) : `${mesic}/${rok}`;
      },
    };
  }
  return {
    x: (m) => monthToOrdinal(m),
    format: (o) => { const m = ordinalToMonth(Math.round(o)); return `${Number(m.slice(5))}/${m.slice(0, 4)}`; },
  };
}

const formatProcent = (n) => procenta(n, Number.isInteger(n) ? 0 : 1);

/**
 * Grafy cenové hladiny (začátek = 100) a meziroční inflace + tabulka hodnot.
 * @returns {{ grafHladiny: string, grafInflace: string, tabulka: string, popisHladiny: string, popisInflace: string, od: string, do: string }}
 */
export function grafy(series, od, doM, { sirka = 640, vyska = 300 } = {}) {
  const [a, b] = obdobiGrafu(series, od, doM);
  const hladina = levelSeries(series, a, b);
  const mezirocne = yoySeries(series, a, b);
  const osa = osaCasu(a, b);
  const posledni = hladina[hladina.length - 1];
  const sInflaci = mezirocne.filter((p) => p.value !== null);

  const grafHladiny = caroveGrafy({
    titulek: `Cenová hladina, ${nom(a)} = 100`,
    popis: `Cenová hladina od ${nom(a)} (100) do ${nom(b)} (${cislo(posledni.value, 1)}). Co v prvním měsíci stálo 100 Kč, stálo na konci ${castka(posledni.value)}.`,
    id: 'inflace-hladina',
    sirka,
    vyska,
    rady: [{ nazev: `Cenová hladina (${nom(a)} = 100)`, body: hladina.map((p) => ({ x: osa.x(p.month), y: p.value })), trida: 'graf-rada-1', vyplnena: true, zvyraznena: true }],
    osaX: { format: osa.format },
    osaY: { popisek: 'cenová hladina', format: (n) => cislo(n) },
  });

  let popisInflace = 'Meziroční inflace po měsících: o kolik procent byly ceny vyšší než ve stejném měsíci předchozího roku.';
  let grafInflace = '';
  if (sInflaci.length) {
    const max = sInflaci.reduce((m, p) => (p.value > m.value ? p : m));
    const min = sInflaci.reduce((m, p) => (p.value < m.value ? p : m));
    popisInflace = `Meziroční inflace od ${gen(sInflaci[0].month)} do ${gen(b)}. Nejvyšší ${procenta(max.value * 100, 1)} (${nom(max.month)}), nejnižší ${pct(min.value)} (${nom(min.month)}).`;
    grafInflace = caroveGrafy({
      titulek: 'Meziroční inflace po měsících',
      popis: popisInflace,
      id: 'inflace-mezirocne',
      sirka,
      vyska,
      rady: [{ nazev: 'Meziroční inflace', body: sInflaci.map((p) => ({ x: osa.x(p.month), y: p.value * 100 })), trida: 'graf-rada-2', zvyraznena: true }],
      osaX: { format: osa.format },
      osaY: { popisek: 'meziročně v %', format: formatProcent },
    });
  }

  // Tabulka: u delších období jeden řádek za rok (stejný měsíc jako začátek) a poslední měsíc
  const delsi = monthsBetween(a, b) > 36;
  const radky = hladina
    .map((p, i) => ({ ...p, yoy: mezirocne[i].value, i }))
    .filter((p) => !delsi || p.i % 12 === 0 || p.i === hladina.length - 1)
    .map((p) => [nom(p.month), cislo(series.index(p.month), 1), cislo(p.value, 1), p.yoy === null ? '–' : pct(p.yoy)]);
  const tabulka = tabulkaDat({
    caption: delsi ? `Ceny po letech, ${nom(a)} až ${nom(b)}` : `Ceny po měsících, ${nom(a)} až ${nom(b)}`,
    popisek: 'vývoj cen za zvolené období',
    sloupce: ['Měsíc', 'Index ČSÚ (2015 = 100)', `Hladina (${nom(a)} = 100)`, 'Meziročně'],
    radky,
  });

  return {
    grafHladiny,
    grafInflace,
    tabulka,
    popisHladiny: `${nom(a)} = 100, do ${gen(b)}. Kolik stálo totéž co 100 Kč na začátku období.`,
    popisInflace,
    od: a,
    do: b,
  };
}

/** Možnosti pro výběr měsíce a roku (od prvního roku v datech po poslední). */
export function moznostiMesice(series, pravidla, vybrany) {
  const prvni = Math.max(pravidla.vychozi.prvniRok, Number(series.first.slice(0, 4)));
  const posledni = Number(series.last.slice(0, 4));
  const roky = [];
  for (let r = posledni; r >= prvni; r--) roky.push({ hodnota: String(r), text: String(r), vybrano: String(r) === vybrany.slice(0, 4) });
  const mesice = MESICE.map((m, i) => {
    const h = String(i + 1).padStart(2, '0');
    return { hodnota: h, text: m, vybrano: h === vybrany.slice(5) };
  });
  return { mesice, roky };
}
