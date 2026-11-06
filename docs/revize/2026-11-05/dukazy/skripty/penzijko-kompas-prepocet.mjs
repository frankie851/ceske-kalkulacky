// Nezávislý přepočet pro revizi Penzijko kompas (5. 11. 2026).
// ČÁST A: referenční výpočet od nuly podle úředních pravidel z rejstříku (pravidla.md, oblast A).
//         Nic z kódu aplikace se zde neimportuje ani nekopíruje.
// ČÁST B: teprve dole se naimportuje calc.js aplikace a spustí se se stejnými vstupy;
//         tabulka „můj výpočet vs. modul“ se zapíše do dukazy/penzijko-kompas/prepocet.txt.
// Spuštění: node penzijko-kompas-prepocet.mjs  (z libovolné složky; cesty jsou absolutní)

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = '/tmp/revize/repos/penzijko-kompas';
const VYSTUP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../penzijko-kompas/prepocet.txt');

// ----------------------------------------------------------------------------
// ČÁST A – úřední pravidla (hodnoty a zdroje: pravidla.md, ID DP-01 … DP-12, + § 61/62 ZDPS ověřené 5. 11. 2026)
// ----------------------------------------------------------------------------

// § 14 odst. 1, 2 a 4 zákona č. 427/2011 Sb. (ZDPS), znění od 1. 8. 2026 (verze 20), zakonyprolidi.cz/cs/2011-427 – DP-01..DP-03:
//  - nárok od příspěvku účastníka 500 Kč měsíčně; 500–1 699 Kč → 20 %; 1 700 Kč a více → 340 Kč
//  - pro účely výpočtu se příspěvek účastníka zaokrouhluje na celé koruny dolů (§ 14 odst. 4)
//  - § 13 odst. 1 písm. a): účastník s přiznaným starobním důchodem nárok nemá (DP-04)
const PLATNA_2026 = {
  nazev: 'platná pravidla (ZDPS § 13, § 14)',
  pasma: [{ vekMin: 0, vekMaxExkl: Infinity, minVklad: 500, sazba: 0.20, strop: 340 }],
  duchodceMaNarok: false,
  konecTF: null, // zákon žádný konec transformovaných fondů nestanoví (§ 194 ZDPS zná jen zánik povolení)
  stropPoplatku: null,
};
// Sněmovní tisk 285 (návrh „Lepší penzijko“), DP-06..DP-09: 40 % do 30. narozenin (680 Kč = 40 % × 1 700 – dopočet),
// nezletilí od 100 Kč, strop úplaty 0,5 % a bez úplaty za zhodnocení, konec TF 31. 12. 2036 → konzervativní fond.
const NAVRH_2027 = {
  nazev: 'návrh – sněmovní tisk 285',
  pasma: [
    { vekMin: 0, vekMaxExkl: 18, minVklad: 100, sazba: 0.40, strop: 680 },
    { vekMin: 18, vekMaxExkl: 30, minVklad: 500, sazba: 0.40, strop: 680 },
    { vekMin: 30, vekMaxExkl: Infinity, minVklad: 500, sazba: 0.20, strop: 340 },
  ],
  duchodceMaNarok: false,
  konecTF: 2036,
  stropPoplatku: { sprava: 0.5, zhodnoceni: 0 },
};

// § 15 odst. 6 a 7 ZDP (DP-11, DP-12): úhrn max. 48 000 Kč/rok; u DPS jen část měsíčního příspěvku nad 1 700 Kč.
const ODPOCET = { hraniceMesic: 1700, limitRok: 48000, sazbaDane: 0.15 };

// Poplatky (nejsou pravidlem rejstříku; ověřeno 5. 11. 2026 přímo v ZDPS):
//  § 60 odst. 3, 4 ZDPS: úplata za obhospodařování max. 0,4 % (povinný konzervativní) / 1 % (ostatní ÚF);
//                        úplata za zhodnocení max. 10 % / 15 %.
//  § 192 odst. 3 ZDPS: transformovaný fond max. 0,8 % z průměrné bilanční sumy + 10 % ze zisku.
//  § 61 odst. 3 ZDPS: poplatek za převod k jiné penzijní společnosti max. 800 Kč; § 62 odst. 3: po více než 60 měsících
//                     spořící doby u téže společnosti se neúčtuje.
const POPLATKY_ZAKONNE_MAX = {
  transformovany: { sprava: 0.8, zhodnoceni: 10 },
  konzervativni: { sprava: 0.4, zhodnoceni: 10 },
  vyvazeny: { sprava: 1.0, zhodnoceni: 15 },
  akciovy: { sprava: 1.0, zhodnoceni: 15 },
  zivotniCyklus: { sprava: 1.0, zhodnoceni: 15 },
};
const PREVOD_KONKURENCE = { maxPoplatek: 800, mesicuZdarma: 60 };

// Výnosy a inflace: předpoklady (nejsou pravidlem). Pro srovnání s modulem přebírám hodnoty z rules.json aplikace,
// protože jde o vstup modelu, ne o pravidlo – jinak by se výsledky nedaly porovnat. (MF model: akcie 7,5 %, dluhopisy 4,0 %,
// peněžní trh 2,5 %, inflace 2,5 % – viz zadání; aplikace má 7,0 / 4,5 / 3,0 / 1,5 %.)
const VYNOSY = { transformovany: 1.5, konzervativni: 3.0, vyvazeny: 4.5, akciovy: 7.0 };
const ZC = { plneAkcieDo: 45, konec: 65, podilNaKonci: 0.20, akcie: 7.0, dluhopisy: 3.0 };
const INFLACE = 2.5;
const VEK_PENZE = 65;

function haleru(x) { return Math.round(x * 100) / 100; }

/** Měsíční státní příspěvek podle sady; vklad = příspěvek účastníka (Kč/měs). */
export function refStatniPrispevek(sada, vek, vklad, duchodce = false) {
  if (!Number.isFinite(vklad) || vklad <= 0) return 0;
  if (duchodce && !sada.duchodceMaNarok) return 0;
  const p = sada.pasma.find((q) => vek >= q.vekMin && vek < q.vekMaxExkl);
  if (!p) return 0;
  const zaklad = Math.floor(vklad); // § 14 odst. 4 ZDPS
  if (zaklad < p.minVklad) return 0;
  return Math.min(haleru(p.sazba * zaklad), p.strop);
}

/** Roční odpočet od základu daně (§ 15 odst. 6, 7 ZDP) při rovnoměrném měsíčním vkladu. */
export function refOdpocet(vkladMesic) {
  const v = Math.max(0, vkladMesic || 0);
  const rocne = Math.min(Math.max(0, v - ODPOCET.hraniceMesic) * 12, ODPOCET.limitRok);
  return { rocne, uspora: haleru(rocne * ODPOCET.sazbaDane) };
}

function podilAkcii(vek) {
  if (vek <= ZC.plneAkcieDo) return 1;
  if (vek >= ZC.konec) return ZC.podilNaKonci;
  return 1 - ((vek - ZC.plneAkcieDo) / (ZC.konec - ZC.plneAkcieDo)) * (1 - ZC.podilNaKonci);
}
function vynosFondu(fond, vek) {
  if (fond === 'zivotniCyklus') { const s = podilAkcii(vek); return s * ZC.akcie + (1 - s) * ZC.dluhopisy; }
  return VYNOSY[fond];
}

/**
 * Referenční měsíční projekce.
 * o = { zustatek, vklad, zamestnavatel, vek, duchodce, fond, sprava (% p. a.), zhodnoceni (% z kladného ročního výnosu),
 *       vynos (přepis % p. a., volitelně), sada, mesicu (volitelně), startRok, startMesic, vkladNaZacatku (false = na konci měsíce),
 *       konecTF (přepis: null = bez konce) }
 * Model podle zadání: správa měsíčně z průměrného zůstatku v měsíci, zhodnocení jen z kladného ročního čistého výnosu.
 */
export function refProjekce(o) {
  const sada = o.sada;
  const mesicu = o.mesicu ?? Math.max(0, (VEK_PENZE - o.vek) * 12);
  const infl = INFLACE / 100;
  const strop = sada.stropPoplatku;
  const konecTF = 'konecTF' in o ? o.konecTF : sada.konecTF;
  const fondVstup = o.fond;
  const popl = (fond) => {
    const z = fond === fondVstup
      ? { sprava: o.sprava ?? POPLATKY_ZAKONNE_MAX[fond].sprava, zhodnoceni: o.zhodnoceni ?? POPLATKY_ZAKONNE_MAX[fond].zhodnoceni }
      : { ...POPLATKY_ZAKONNE_MAX[fond] };
    if (strop) { z.sprava = Math.min(z.sprava, strop.sprava); z.zhodnoceni = Math.min(z.zhodnoceni, strop.zhodnoceni); }
    return z;
  };
  let z = o.zustatek ?? 0;
  const s = { vlastni: 0, vlastniRealne: 0, statni: 0, zamestnavatel: 0, vynos: 0, sprava: 0, zhodnoceni: 0 };
  let rocniCisty = 0;
  let mesicuVNastupci = 0;
  for (let m = 0; m < mesicu; m++) {
    const rok = o.startRok + Math.floor((o.startMesic - 1 + m) / 12);
    const vek = o.vek + Math.floor(m / 12);
    let fond = fondVstup;
    if (fond === 'transformovany' && konecTF !== null && rok > konecTF) { fond = 'konzervativni'; mesicuVNastupci++; }
    const r = (o.vynos !== undefined && fond === fondVstup ? o.vynos : vynosFondu(fond, vek)) / 100;
    const rm = Math.pow(1 + r, 1 / 12) - 1;
    const p = popl(fond);
    const statni = refStatniPrispevek(sada, vek, o.vklad ?? 0, o.duchodce);
    const prisun = (o.vklad ?? 0) + (o.zamestnavatel ?? 0) + statni;
    if (o.vkladNaZacatku) z += prisun;
    const vynos = z * rm;
    const sprava = (p.sprava / 100 / 12) * ((z + z + vynos) / 2);
    z = z + vynos - sprava;
    if (!o.vkladNaZacatku) z += prisun;
    rocniCisty += vynos - sprava;
    s.vynos += vynos; s.sprava += sprava; s.vlastni += o.vklad ?? 0; s.zamestnavatel += o.zamestnavatel ?? 0; s.statni += statni;
    s.vlastniRealne += (o.vklad ?? 0) / Math.pow(1 + infl, (m + 1) / 12);
    if ((m + 1) % 12 === 0 || m === mesicu - 1) {
      const pz = (p.zhodnoceni / 100) * Math.max(0, rocniCisty);
      z -= pz; s.zhodnoceni += pz; rocniCisty = 0;
    }
  }
  const defl = Math.pow(1 + infl, mesicu / 12);
  return { nominal: z, realne: z / defl, poplatky: s.sprava + s.zhodnoceni, ...s, mesicu, mesicuVNastupci };
}

// ----------------------------------------------------------------------------
// Případy
// ----------------------------------------------------------------------------
const START = { startRok: 2026, startMesic: 11 };
const VYCHOZI = { zustatek: 150000, vklad: 1000, zamestnavatel: 0, vek: 35, fond: 'transformovany', sprava: 0.8, zhodnoceni: 10, duchodce: false, ...START };

const pripady = [];
const P = (skupina, nazev, vstup, muj) => pripady.push({ skupina, nazev, vstup, muj });

// --- Státní příspěvek: zadání
P('zadání', 'věk 35, 2026, vklad 1 700 Kč → 340 / 4 080', '35, 2026, 1 700', { mesicne: refStatniPrispevek(PLATNA_2026, 35, 1700), rocne: refStatniPrispevek(PLATNA_2026, 35, 1700) * 12 });
P('zadání', 'věk 35, 2026, vklad 400 Kč → 0', '35, 2026, 400', { mesicne: refStatniPrispevek(PLATNA_2026, 35, 400) });
P('zadání', 'věk 25, návrh 2027, vklad 1 700 Kč → 680 / 8 160', '25, návrh, 1 700', { mesicne: refStatniPrispevek(NAVRH_2027, 25, 1700), rocne: refStatniPrispevek(NAVRH_2027, 25, 1700) * 12 });
P('zadání', 'věk 10, návrh 2027, vklad 100 Kč → 40', '10, návrh, 100', { mesicne: refStatniPrispevek(NAVRH_2027, 10, 100) });
P('zadání', 'věk 35, vklad 3 000 Kč → odpočet 15 600', '3 000/měs', { rocne: refOdpocet(3000).rocne });
P('zadání', '100 000 Kč, výnos 0 %, poplatek 1 %, bez vkladů, 10 let → cca 90 438', '100 000, 0 %, 1 %, 120 měs.',
  { nominal: refProjekce({ zustatek: 100000, vklad: 0, vek: 40, fond: 'konzervativni', sprava: 1, zhodnoceni: 0, vynos: 0, sada: PLATNA_2026, mesicu: 120, ...START }).nominal });

// --- Státní příspěvek: hranice a zvláštní vstupy
for (const [vek, vklad, sada, pop] of [
  [40, 499, PLATNA_2026, '2026, 499 Kč (pod hranicí)'], [40, 500, PLATNA_2026, '2026, 500 Kč (hranice)'],
  [40, 1699, PLATNA_2026, '2026, 1 699 Kč'], [40, 1700, PLATNA_2026, '2026, 1 700 Kč'], [40, 1701, PLATNA_2026, '2026, 1 701 Kč'],
  [40, 1234.56, PLATNA_2026, '2026, 1 234,56 Kč (zaokrouhlení § 14/4: 1 234 → 246,80)'],
  [40, 0, PLATNA_2026, '2026, 0 Kč'], [40, -500, PLATNA_2026, '2026, −500 Kč (nesmysl)'], [40, 1e9, PLATNA_2026, '2026, 1 mld. Kč'],
  [17, 100, NAVRH_2027, 'návrh, 17 let, 100 Kč'], [18, 100, NAVRH_2027, 'návrh, 18 let, 100 Kč (už 500 Kč min.)'],
  [17, 400, NAVRH_2027, 'návrh, 17 let, 400 Kč'], [29, 1000, NAVRH_2027, 'návrh, 29 let, 1 000 Kč'], [30, 1000, NAVRH_2027, 'návrh, 30 let, 1 000 Kč'],
  [29, 1700, NAVRH_2027, 'návrh, 29 let, 1 700 Kč'], [29, 5000, NAVRH_2027, 'návrh, 29 let, 5 000 Kč'], [0, 100, NAVRH_2027, 'návrh, 0 let, 100 Kč'],
  [64, 1700, PLATNA_2026, '2026, 64 let, 1 700 Kč'], [70, 1700, PLATNA_2026, '2026, 70 let bez důchodu, 1 700 Kč'],
]) P('vlastní', `příspěvek: ${pop}`, `${vek} let, ${vklad} Kč`, { mesicne: refStatniPrispevek(sada, vek, vklad), _sada: sada, _vek: vek, _vklad: vklad });
P('vlastní', 'příspěvek: starobní důchodce 2026 (66, 1 700)', '66, 1 700, důchodce', { mesicne: refStatniPrispevek(PLATNA_2026, 66, 1700, true), _sada: PLATNA_2026, _vek: 66, _vklad: 1700, _duchodce: true });
P('vlastní', 'příspěvek: starobní důchodce návrh (25, 1 700, předčasný)', '25, 1 700, důchodce', { mesicne: refStatniPrispevek(NAVRH_2027, 25, 1700, true), _sada: NAVRH_2027, _vek: 25, _vklad: 1700, _duchodce: true });

// --- Odpočet
for (const [v, pop] of [[1700, '1 700 (nic)'], [1701, '1 701 → 12'], [5700, '5 700 → strop 48 000'], [10000, '10 000 → 48 000'], [0, '0'], [-100, '−100 (nesmysl)']])
  P('vlastní', `odpočet: ${pop}`, `${v} Kč/měs`, { rocne: refOdpocet(v).rocne, uspora: refOdpocet(v).uspora, _vklad: v });

// --- Projekce
const prj = (nazev, vstup, o, poznamka = '') => {
  const r = refProjekce(o);
  P('vlastní', nazev, vstup, { nominal: r.nominal, realne: r.realne, poplatky: r.poplatky, statni: r.statni, mesicuVNastupci: r.mesicuVNastupci, _o: o, _poznamka: poznamka });
};
prj('projekce: 12 měs. bez výnosu a poplatků, 1 700 + 300 zam.', '0, 1 700, 300, 35, 2026, 12 měs.', { zustatek: 0, vklad: 1700, zamestnavatel: 300, vek: 35, fond: 'konzervativni', sprava: 0, zhodnoceni: 0, vynos: 0, sada: PLATNA_2026, mesicu: 12, ...START });
prj('projekce: zhodnocení 15 % z 5 % výnosu, 12 měs.', '100 000, 5 %, 0 % + 15 %', { zustatek: 100000, vklad: 0, vek: 40, fond: 'vyvazeny', sprava: 0, zhodnoceni: 15, vynos: 5, sada: PLATNA_2026, mesicu: 12, ...START });
prj('projekce: záporný výnos −5 % → poplatek ze zhodnocení 0', '100 000, −5 %, 0 % + 15 %', { zustatek: 100000, vklad: 0, vek: 40, fond: 'vyvazeny', sprava: 0, zhodnoceni: 15, vynos: -5, sada: PLATNA_2026, mesicu: 12, ...START });
prj('projekce: návrh – strop 0,5 % na 1 % + 15 %, 120 měs., 0 % výnos', '100 000, 0 %, akciový, návrh', { zustatek: 100000, vklad: 0, vek: 40, fond: 'akciovy', sprava: 1, zhodnoceni: 15, vynos: 0, sada: NAVRH_2027, mesicu: 120, ...START });
prj('projekce: výchozí formulář (35, 1 000, 150 000, TF 0,8+10, 2026) – PODLE ZÁKONA bez konce TF', 'výchozí, 2026', { ...VYCHOZI, sada: PLATNA_2026 }, 'zákon konec TF nestanoví');
prj('projekce: výchozí formulář, TF končí 2036 (jen návrh, tisk 285)', 'výchozí, 2026 + konec TF 2036', { ...VYCHOZI, sada: PLATNA_2026, konecTF: 2036 }, 'to, co počítá aplikace i pro sadu 2026');
prj('projekce: výchozí formulář, návrh 2027 (strop 0,5 %, TF→konz. 2037)', 'výchozí, návrh', { ...VYCHOZI, sada: NAVRH_2027 });
prj('projekce: TF, 40 let, 100 000, 180 měs. od 1/2026 (test aplikace)', '100 000, TF, 2026-01, 180 měs.', { zustatek: 100000, vklad: 0, vek: 40, fond: 'transformovany', sada: PLATNA_2026, konecTF: 2036, mesicu: 180, startRok: 2026, startMesic: 1 });
prj('projekce: životní cyklus, 35 let, 1 000 Kč, 0 zůstatek, 2026', 'ŽC, 35, 1 000', { ...VYCHOZI, zustatek: 0, fond: 'zivotniCyklus', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026 });
prj('projekce: akciový, 25 let, 1 700 Kč, návrh (40 % do 30)', 'akciový, 25, 1 700, návrh', { ...VYCHOZI, zustatek: 0, vek: 25, vklad: 1700, fond: 'akciovy', sprava: 1, zhodnoceni: 15, sada: NAVRH_2027 });
prj('projekce: konzervativní, 60 let, 10 000 + 1 000 Kč, 2026 (5 let)', 'konz., 60, 1 000', { ...VYCHOZI, zustatek: 10000, vek: 60, fond: 'konzervativni', sprava: 0.4, zhodnoceni: 10, sada: PLATNA_2026 });
prj('projekce: 65 let → 0 měsíců, zůstatek beze změny', '65 let, 50 000', { ...VYCHOZI, zustatek: 50000, vek: 65, fond: 'vyvazeny', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026 });
prj('projekce: 64 let, 1 měsíc před koncem roku projekce (12 měs.)', '64 let', { ...VYCHOZI, vek: 64, fond: 'vyvazeny', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026 });
prj('projekce: nulové vklady, nulový zůstatek', 'vše 0', { ...VYCHOZI, zustatek: 0, vklad: 0, sada: PLATNA_2026 });
prj('projekce: poplatky přepsané na 0 % (uživatel smaže pole)', 'výchozí, poplatky 0', { ...VYCHOZI, sprava: 0, zhodnoceni: 0, sada: PLATNA_2026, konecTF: 2036 });
prj('projekce: důchodce 60 let, 1 700 Kč – státní příspěvek 0', 'důchodce 60', { ...VYCHOZI, vek: 60, vklad: 1700, duchodce: true, fond: 'konzervativni', sprava: 0.4, zhodnoceni: 10, sada: PLATNA_2026 });

// Citlivost na konvenci (jen můj výpočet): vklad na začátku vs. na konci měsíce; strop 0,5 % až od 1/2027.
const citlivost = [];
{
  const a = refProjekce({ ...VYCHOZI, zustatek: 0, fond: 'akciovy', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026 });
  const b = refProjekce({ ...VYCHOZI, zustatek: 0, fond: 'akciovy', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026, vkladNaZacatku: true });
  citlivost.push(`Vklad na konci měsíce (model aplikace) vs. na začátku: akciový, 35 let, 1 000 Kč/měs, 30 let: ${a.nominal.toFixed(0)} vs. ${b.nominal.toFixed(0)} Kč nominálně (rozdíl ${(b.nominal - a.nominal).toFixed(0)} Kč = ${((b.nominal / a.nominal - 1) * 100).toFixed(2)} %).`);
  const c = refProjekce({ ...VYCHOZI, sada: NAVRH_2027 });
  // strop až od 1/2027: první 2 měsíce (11/2026, 12/2026) s plnými poplatky 0,8 + 10 a 20 % příspěvkem (35 let – stejný)
  const prvni2 = refProjekce({ ...VYCHOZI, sada: PLATNA_2026, mesicu: 2 });
  const zbytek = refProjekce({ ...VYCHOZI, zustatek: prvni2.nominal, sada: NAVRH_2027, mesicu: 30 * 12 - 2, startRok: 2027, startMesic: 1 });
  citlivost.push(`Návrh 2027 uplatněný od 11/2026 (aplikace) vs. až od 1/2027: výchozí formulář ${c.nominal.toFixed(0)} vs. cca ${zbytek.nominal.toFixed(0)} Kč nominálně (rozdíl ${(c.nominal - zbytek.nominal).toFixed(0)} Kč).`);
}

// ----------------------------------------------------------------------------
// ČÁST B – teprve teď modul aplikace
// ----------------------------------------------------------------------------
const calc = await import(path.join(REPO, 'calc.js'));
const rules = JSON.parse(fs.readFileSync(path.join(REPO, 'rules.json'), 'utf8'));
const sadaKlic = (s) => (s === PLATNA_2026 ? '2026' : 'navrh2027');

function modulPro(p) {
  const m = p.muj;
  if ('_sada' in m) {
    const r = calc.statniPrispevek(rules.sady[sadaKlic(m._sada)], { vek: m._vek, vklad: m._vklad, duchodce: !!m._duchodce });
    return { mesicne: r.mesicne };
  }
  if (p.skupina === 'zadání') {
    const n = p.nazev;
    if (n.startsWith('věk 35, 2026, vklad 1 700')) { const r = calc.statniPrispevek(rules.sady['2026'], { vek: 35, vklad: 1700 }); return { mesicne: r.mesicne, rocne: r.rocne }; }
    if (n.startsWith('věk 35, 2026, vklad 400')) return { mesicne: calc.statniPrispevek(rules.sady['2026'], { vek: 35, vklad: 400 }).mesicne };
    if (n.startsWith('věk 25')) { const r = calc.statniPrispevek(rules.sady.navrh2027, { vek: 25, vklad: 1700 }); return { mesicne: r.mesicne, rocne: r.rocne }; }
    if (n.startsWith('věk 10')) return { mesicne: calc.statniPrispevek(rules.sady.navrh2027, { vek: 10, vklad: 100 }).mesicne };
    if (n.startsWith('věk 35, vklad 3 000')) return { rocne: calc.danovyOdpocet(rules.sady['2026'], { vklad: 3000 }).rocne };
    if (n.startsWith('100 000')) return { nominal: calc.projekce(rules, { zustatek: 100000, vklad: 0, zamestnavatel: 0, vek: 40, fond: 'konzervativni', parametry: { sprava: 1, zhodnoceni: 0, vynos: 0 }, sada: '2026', mesicu: 120, start: { rok: 2026, mesic: 11 } }).souhrn.nominal };
  }
  if (p.nazev.startsWith('odpočet')) { const r = calc.danovyOdpocet(rules.sady['2026'], { vklad: m._vklad }); return { rocne: r.rocne, uspora: r.uspora }; }
  if (m._o) {
    const o = m._o;
    // Klíče s undefined nepředávám: modul je spreadem přepíše (parametryFondu) a vrátí NaN – v aplikaci to nenastane, app.js posílá vždy čísla.
    const param = {};
    if (o.sprava !== undefined) param.sprava = o.sprava;
    if (o.zhodnoceni !== undefined) param.zhodnoceni = o.zhodnoceni;
    if (o.vynos !== undefined) param.vynos = o.vynos;
    const vst = { zustatek: o.zustatek, vklad: o.vklad, zamestnavatel: o.zamestnavatel ?? 0, vek: o.vek, duchodce: !!o.duchodce, fond: o.fond, parametry: param, sada: sadaKlic(o.sada), start: { rok: o.startRok, mesic: o.startMesic } };
    if (o.mesicu !== undefined) vst.mesicu = o.mesicu;
    // Modul se volá přesně tak, jak ho volá app.js (zVstupu): bez `bezNastupce`, takže konec TF 2036 uplatní u obou sad.
    const r = calc.projekce(rules, vst);
    return { nominal: r.souhrn.nominal, realne: r.souhrn.realne, poplatky: r.souhrn.poplatky, statni: r.souhrn.statni, mesicuVNastupci: r.mesicePoNastupci };
  }
  return null;
}

const fmt = (x) => (typeof x === 'number' ? (Number.isInteger(x) ? String(x) : x.toFixed(2)) : String(x));
const radky = [];
const out = (s = '') => radky.push(s);
out('# Penzijko kompas – nezávislý přepočet vs. modul aplikace (calc.js @ 7381900), 5. 11. 2026');
out('# Část A: referenční výpočet od nuly podle rejstříku pravidel (DP-01..DP-12) a ZDPS § 60–62, § 192. Část B: modul aplikace se stejnými vstupy.');
out('# Konvence referenčního modelu: měsíční krok, výnos geometricky z ročního, správa = sazba/12 × průměr zůstatku před a po výnosu,');
out('# zhodnocení = sazba × max(0, roční čistý výnos) vždy po 12 měsících od startu; vklady, příspěvek zaměstnavatele a státní příspěvek');
out('# se připisují na konci měsíce; věk v celých letech od startu; start 11/2026. Výnosy/inflace převzaty z rules.json jako předpoklad (ne pravidlo).');
out();
out('| # | Skupina | Případ | Vstup | Můj výpočet | Modul aplikace | Rozdíl | Shoda |');
out('|---|---|---|---|---|---|---|---|');
let i = 0, neshod = 0;
const vysledky = [];
for (const p of pripady) {
  i++;
  const mod = modulPro(p);
  const klice = Object.keys(p.muj).filter((k) => !k.startsWith('_'));
  const muj = klice.map((k) => `${k}=${fmt(p.muj[k])}`).join(', ');
  const mo = mod ? klice.map((k) => `${k}=${fmt(mod[k])}`).join(', ') : '—';
  let maxRel = 0, maxAbs = 0;
  if (mod) for (const k of klice) { const a = p.muj[k], b = mod[k]; const d = Math.abs(a - b); maxAbs = Math.max(maxAbs, d); maxRel = Math.max(maxRel, d / Math.max(1, Math.abs(a))); }
  const shoda = !mod ? 'n/a' : (maxAbs < 0.005 ? 'ano' : (maxRel < 0.005 ? 'ano (±0,5 %)' : 'NE'));
  if (shoda === 'NE') neshod++;
  vysledky.push({ ...p, mod, shoda });
  out(`| ${i} | ${p.skupina} | ${p.nazev}${p.muj._poznamka ? ` (${p.muj._poznamka})` : ''} | ${p.vstup} | ${muj} | ${mo} | ${fmt(maxAbs)} | ${shoda} |`);
}
out();
out(`Případů: ${pripady.length}, neshod: ${neshod}`);
out();
out('## Citlivost na konvence (jen referenční model)');
for (const c of citlivost) out('- ' + c);
out();

// Doporučení: vlastní přepočet přínosu kroků pro výchozí formulář vs. calc.doporuceni
out('## Doporučení („Co udělat“) pro výchozí formulář (35, 1 000 Kč, 150 000 Kč, TF 0,8 + 10, délka 8 let)');
for (const [sadaN, sada] of [['2026', PLATNA_2026], ['navrh2027', NAVRH_2027]]) {
  const zakl = { ...VYCHOZI, sada, konecTF: sadaN === '2026' ? null : 2036 };
  const zaklApp = { ...VYCHOZI, sada, konecTF: 2036 }; // co dělá aplikace
  const prinos = (zk, zm) => (zm.realne - zk.realne) - (zm.vlastniRealne - zk.vlastniRealne);
  const b0 = refProjekce(zakl), b0a = refProjekce(zaklApp);
  const kroky = {
    vklad: [refProjekce({ ...zakl, vklad: 1700 }), refProjekce({ ...zaklApp, vklad: 1700 })],
    fond: [refProjekce({ ...zakl, fond: 'zivotniCyklus', sprava: 1, zhodnoceni: 15 }), refProjekce({ ...zaklApp, fond: 'zivotniCyklus', sprava: 1, zhodnoceni: 15 })],
    zamestnavatel: [refProjekce({ ...zakl, zamestnavatel: 500 }), refProjekce({ ...zaklApp, zamestnavatel: 500 })],
  };
  const app = calc.doporuceni(rules, { vek: 35, vklad: 1000, zamestnavatel: 0, zustatek: 150000, fond: 'transformovany', poplatky: { sprava: 0.8, zhodnoceni: 10 }, delkaSmlouvy: 8, duchodce: false, sada: sadaN, start: { rok: 2026, mesic: 11 } });
  out(`### sada ${sadaN}`);
  out('| krok | můj přínos (zákon: TF bez konce) | můj přínos (s koncem TF 2036) | modul aplikace | pořadí modulu |');
  out('|---|---|---|---|---|');
  for (const [id, [z, za]] of Object.entries(kroky)) {
    const a = app.find((k) => k.id === id);
    out(`| ${id} | ${prinos(b0, z).toFixed(0)} | ${prinos(b0a, za).toFixed(0)} | ${a ? a.prinos.toFixed(0) : '—'} | ${a ? app.indexOf(a) + 1 : '—'} |`);
  }
}
out();
out('## Transformovaný fond – zůstat vs. přejít (výchozí formulář, reálně v 65)');
{
  const t = calc.transformovanyFond(rules, { vek: 35, vklad: 1000, zamestnavatel: 0, zustatek: 150000, fond: 'transformovany', poplatky: { sprava: 0.8, zhodnoceni: 10 }, delkaSmlouvy: 8, duchodce: false, sada: '2026', start: { rok: 2026, mesic: 11 } });
  const zustatZakon = refProjekce({ ...VYCHOZI, sada: PLATNA_2026, konecTF: null });
  const zustatApp = refProjekce({ ...VYCHOZI, sada: PLATNA_2026, konecTF: 2036 });
  const prejit = refProjekce({ ...VYCHOZI, fond: 'zivotniCyklus', sprava: 1, zhodnoceni: 15, sada: PLATNA_2026 });
  out(`- modul (sada 2026): zůstat ${t.zustat.souhrn.realne.toFixed(0)} Kč, přejít ${t.prejit.souhrn.realne.toFixed(0)} Kč, rozdíl ${t.rozdilRealne.toFixed(0)} Kč; poplatekKonkurence ${t.poplatekKonkurence} Kč (délka 8 let), konci ${t.konci}`);
  out(`- můj výpočet podle zákona (TF bez konce, 1,5 % až do 65): zůstat ${zustatZakon.realne.toFixed(0)} Kč, přejít ${prejit.realne.toFixed(0)} Kč, rozdíl ${(prejit.realne - zustatZakon.realne).toFixed(0)} Kč`);
  out(`- můj výpočet s koncem TF 2036 (návrh): zůstat ${zustatApp.realne.toFixed(0)} Kč, rozdíl ${(prejit.realne - zustatApp.realne).toFixed(0)} Kč`);
  out(`- poplatek za převod ke konkurenci: § 61 odst. 3 ZDPS max. 800 Kč, § 62 odst. 3 po více než 60 měsících spořící doby zdarma; modul: 3 roky → ${calc.transformovanyFond(rules, { vek: 35, vklad: 1000, zustatek: 0, delkaSmlouvy: 3, sada: '2026', start: { rok: 2026, mesic: 11 } }).poplatekKonkurence} Kč, 5 let → ${calc.transformovanyFond(rules, { vek: 35, vklad: 1000, zustatek: 0, delkaSmlouvy: 5, sada: '2026', start: { rok: 2026, mesic: 11 } }).poplatekKonkurence} Kč (zákon: „po více než 60 měsících“ – přesně 60 měsíců ještě může být zpoplatněno; modul při 5 letech už 0 Kč)`);
}
out();
out('## Hodnoty v rules.json vs. zákonná maxima úplat (§ 60 odst. 3–4, § 192 odst. 3 ZDPS)');
for (const [k, f] of Object.entries(rules.fondy)) {
  const z = POPLATKY_ZAKONNE_MAX[k];
  out(`- ${k}: rules.json ${f.sprava} % + ${f.zhodnoceni} % · zákonné maximum ${z.sprava} % + ${z.zhodnoceni} % · ${f.sprava <= z.sprava && f.zhodnoceni <= z.zhodnoceni ? 'v mezích (rovno maximu)' : 'NAD ZÁKONNÝM MAXIMEM'}`);
}
out(`- předpoklady.prevodKonkurence: ${rules.predpoklady.prevodKonkurence.poplatek} Kč / ${rules.predpoklady.prevodKonkurence.zdarmaPoLetech} let · zákon: max. ${PREVOD_KONKURENCE.maxPoplatek} Kč, zdarma po více než ${PREVOD_KONKURENCE.mesicuZdarma} měsících (§ 61 odst. 3, § 62 odst. 3 ZDPS)`);

fs.mkdirSync(path.dirname(VYSTUP), { recursive: true });
fs.writeFileSync(VYSTUP, radky.join('\n') + '\n');
console.log(radky.join('\n'));
console.log(`\nZapsáno: ${VYSTUP}`);
