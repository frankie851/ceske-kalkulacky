// Nezávislý referenční výpočet náhrad za tuzemskou pracovní cestu (revize 5. 11. 2026, CES).
// Napsáno od nuly podle úředních pravidel; kód aplikace (cesty.js) se zde NEIMPORTUJE.
// Porovnání s modulem aplikace je v cestovni-prikaz-porovnani.mjs.
//
// Zdroje (všechny přečteny 5. 11. 2026 na zakonyprolidi.cz, viz rejstřík pravidla.md, oblast B):
//  - ZP § 157 odst. 4: sazba základní náhrady nejméně 1,60 Kč (jednostopá) / 5,90 Kč (osobní); s přívěsem
//    zvýšení nejméně o 15 % (PR-56, PR-57)                     https://www.zakonyprolidi.cz/cs/2006-262#p157
//  - ZP § 158 odst. 2–4: náhrada za PHM = cena × spotřebované množství; cena z dokladu, jinak průměrná cena
//    z vyhlášky; spotřeba z TP – kombinovaný provoz, jinak aritmetický průměr (PR-59)
//  - ZP § 163 odst. 1–4: stravné 155/236/370 Kč (5–12 h / >12–18 h / >18 h), krácení až 70/35/25 % za jídlo,
//    bez určení nižší hodnoty se krátí o nejvyšší; cesta spadající do 2 kalendářních dnů se posoudí dohromady,
//    je-li to výhodnější (PR-63, PR-64, PR-67, PR-68)          https://www.zakonyprolidi.cz/cs/2006-262#p163
//  - ZP § 174, § 176 odst. 1–5: veřejná sféra – rozpětí 155–185 / 236–284 / 370–442 Kč, bez určení dolní sazba,
//    krácení pevně 70/35/25 %, při 2 jídlech (5–12 h) a 3 jídlech (>12–18 h) stravné nepřísluší; § 163 odst. 1–3
//    se nepoužijí (odst. 4 tedy platí i zde) (PR-65, PR-66)    https://www.zakonyprolidi.cz/cs/2006-262#p176
//  - ZP § 183 odst. 5: částka k výplatě zaměstnanci se zaokrouhlí na celé koruny nahoru (PR-69)
//  - vyhláška č. 573/2025 Sb. § 1–4 (pro rok 2026): sazby výše; PHM benzin 95 34,70, benzin 98 39, nafta 34,10,
//    elektřina 7,20 Kč/kWh (PR-60)                              https://www.zakonyprolidi.cz/cs/2025-573
//  - vyhláška č. 78/2026 Sb.: nafta 44,50 Kč od 1. 6. 2026 (PR-61)  https://www.zakonyprolidi.cz/cs/2026-78
//  - vyhláška č. 175/2026 Sb.: benzin 95 41,80 Kč od 1. 10. 2026 (PR-62) https://www.zakonyprolidi.cz/cs/2026-175
//  - vyhláška pro rok 2027 k 5. 11. 2026 nevydána (PR-71) → rok 2027 se nepočítá.
//
// Spuštění: node cestovni-prikaz-prepocet.mjs  → vypíše vlastní výsledky všech případů (JSON na stdout).

export const REF = {
  2026: {
    sazbaKm: { osobni: 5.90, jednostope: 1.60 },
    privesNasobek: 1.15,
    stravneSoukroma: [155, 236, 370],
    stravneVerejna: [[155, 185], [236, 284], [370, 442]],
    kraceniPct: [70, 35, 25],
    phm: {
      benzin95: [['2026-01-01', 34.70], ['2026-10-01', 41.80]],
      benzin98: [['2026-01-01', 39.00]],
      nafta: [['2026-01-01', 34.10], ['2026-06-01', 44.50]],
      elektrina: [['2026-01-01', 7.20]],
    },
  },
  2027: null,
};

// --- celočíselná aritmetika v haléřích (polovina nahoru) ---
const halfUp = (citatel, jmenovatel) => {
  const q = Math.floor(citatel / jmenovatel);
  return (citatel - q * jmenovatel) * 2 >= jmenovatel ? q + 1 : q;
};
const kcNaHal = (kc) => Math.round(kc * 100);

export class RefChyba extends Error {}

function rokPravidel(datumIso) {
  const rok = Number(String(datumIso).slice(0, 4));
  if (!(rok in REF)) throw new RefChyba(`rok ${rok}: v referenci není`);
  if (REF[rok] === null) throw new RefChyba(`rok ${rok}: vyhláška nevydána – výpočet nelze provést`);
  return REF[rok];
}

/** Základní náhrada v haléřích. km na desetiny. */
export function refZakladni(km, druh, prives = false, rok = 2026) {
  if (!(Number.isFinite(km) && km >= 0)) throw new RefChyba('km musí být nezáporné číslo');
  const r = REF[rok];
  if (!(druh in r.sazbaKm)) throw new RefChyba('neznámý druh vozidla');
  const sazbaHal = kcNaHal(r.sazbaKm[druh]);
  const km10 = Math.round(km * 10);
  if (prives) {
    // § 157 odst. 4: sazba zvýšená nejméně o 15 % (5,90 × 1,15 = 6,785 Kč/km); haléře z přesného součinu
    // km10/10 × sazba × 1,15 = km10 × sazbaHal × 115 / (10 × 100), ne z předem zaokrouhlené sazby.
    return halfUp(km10 * sazbaHal * 115, 1000);
  }
  return halfUp(km10 * sazbaHal, 10);
}

/** Cena PHM v haléřích: doklad má přednost, jinak vyhlášková platná v den odjezdu. */
export function refCenaPHM(palivo, datumIso, cenaDoklad = null, rok = 2026) {
  if (cenaDoklad !== null && cenaDoklad !== undefined && cenaDoklad !== '') {
    const c = Number(cenaDoklad);
    if (!(c > 0)) throw new RefChyba('cena z dokladu musí být > 0');
    return kcNaHal(c);
  }
  const r = REF[rok];
  const obdobi = r.phm[palivo];
  if (!obdobi) throw new RefChyba('neznámé palivo');
  const den = String(datumIso).slice(0, 10);
  let cena = null;
  for (const [od, c] of obdobi) if (od <= den) cena = c;
  if (cena === null) throw new RefChyba('pro den není cena');
  return kcNaHal(cena);
}

/** Náhrada za PHM v haléřích: km × spotřeba/100 × cena (§ 158 odst. 2). */
export function refPHM(km, spotreba, cenaHal) {
  if (!(Number.isFinite(km) && km >= 0)) throw new RefChyba('km musí být nezáporné číslo');
  if (!(Number.isFinite(spotreba) && spotreba > 0)) throw new RefChyba('spotřeba musí být > 0');
  const km10 = Math.round(km * 10);
  const sp100 = Math.round(spotreba * 100);
  return halfUp(km10 * sp100 * cenaHal, 10 * 100 * 100);
}

/** Pásmo podle minut: null = pod 5 h; 0 = 5 až 12 h; 1 = déle než 12, nejdéle 18 h; 2 = déle než 18 h. */
export function refPasmo(min) {
  if (min < 300) return null;
  if (min <= 720) return 0;
  if (min <= 1080) return 1;
  return 2;
}

/** Stravné za jedno období (haléře). sfera 'soukroma' | 'verejna'. */
export function refStravneObdobi(min, jidla, { sfera, kraceniPct, stravneVerejna } = { sfera: 'soukroma' }, rok = 2026) {
  const r = REF[rok];
  const p = refPasmo(min);
  if (p === null) return 0;
  if (!Number.isInteger(jidla) || jidla < 0 || jidla > 3) throw new RefChyba('jídla 0–3');
  let zakladKc; let pct;
  if (sfera === 'verejna') {
    const [lo, hi] = r.stravneVerejna[p];
    zakladKc = stravneVerejna?.[p] ?? lo; // § 176 odst. 5: bez určení dolní sazba
    if (zakladKc < lo || zakladKc > hi) throw new RefChyba(`veřejná sféra: částka mimo rozpětí ${lo}–${hi}`);
    pct = r.kraceniPct[p]; // § 176 odst. 3: pevně
    // § 176 odst. 4: 2 jídla v pásmu 0 nebo 3 jídla v pásmu 1 → nepřísluší
    if ((p === 0 && jidla >= 2) || (p === 1 && jidla >= 3)) return 0;
  } else {
    zakladKc = r.stravneSoukroma[p];
    pct = kraceniPct?.[p] ?? r.kraceniPct[p]; // § 163 odst. 3: bez určení nižší hodnoty se krátí o nejvyšší
    if (pct < 0 || pct > r.kraceniPct[p]) throw new RefChyba('krácení nad zákonné maximum');
  }
  const zakladHal = kcNaHal(zakladKc);
  const snizeni = halfUp(zakladHal * pct * jidla, 100);
  return Math.max(0, zakladHal - snizeni);
}

// --- rozdělení cesty na kalendářní dny („nástěnný“ čas, bez vlivu letního času) ---
const RX = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const naMinuty = (s) => {
  const m = RX.exec(s);
  if (!m) throw new RefChyba('datum a čas ve tvaru YYYY-MM-DDTHH:MM');
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000;
};
const isoDen = (min) => new Date(min * 60000).toISOString().slice(0, 10);

export function refDny(odjezd, navrat) {
  const a = naMinuty(odjezd); const b = naMinuty(navrat);
  if (b <= a) throw new RefChyba('návrat musí být po odjezdu');
  const dny = [];
  let t = a;
  while (t < b) {
    const pulnoc = (Math.floor(t / 1440) + 1) * 1440;
    const konec = Math.min(pulnoc, b);
    dny.push({ datum: isoDen(t), minuty: konec - t });
    t = konec;
  }
  return dny;
}

/**
 * Stravné za celou cestu (haléře) podle § 163 / § 176.
 * jidla: { 'YYYY-MM-DD': počet }. U cesty spadající do 2 kalendářních dnů se podle § 163 odst. 4 porovná
 * oddělené posouzení dnů se společným (celková doba, všechna jídla) a vezme se výhodnější varianta.
 */
export function refStravneCesta(odjezd, navrat, jidla = {}, hlavicka = { sfera: 'soukroma' }) {
  const dny = refDny(odjezd, navrat);
  for (const d of dny) rokPravidel(d.datum); // každý den musí mít vyhlášku
  const rok = Number(dny[0].datum.slice(0, 4));
  const poDnech = dny.map((d) => refStravneObdobi(d.minuty, jidla[d.datum] ?? 0, hlavicka, rok));
  const oddelene = poDnech.reduce((s, x) => s + x, 0);
  if (dny.length !== 2) return { stravneHal: oddelene, poDnech, oddelene, spolecne: null, pouzito: 'oddělené' };
  const celkemMin = dny[0].minuty + dny[1].minuty;
  const vsechnaJidla = dny.reduce((s, d) => s + (jidla[d.datum] ?? 0), 0);
  const spolecne = refStravneObdobi(celkemMin, Math.min(3, vsechnaJidla), hlavicka, rok);
  const pouzito = spolecne > oddelene ? 'společné (§ 163 odst. 4)' : 'oddělené';
  return { stravneHal: Math.max(oddelene, spolecne), poDnech, oddelene, spolecne, pouzito };
}

/** Celá cesta: { zakladniHal, phmHal, stravneHal, celkemHal } */
export function refCesta({ odjezd, navrat, km = 0, jidla = {}, cenaDoklad = null, prives = false }, hlavicka) {
  const dny = refDny(odjezd, navrat);
  const rok = Number(dny[0].datum.slice(0, 4));
  for (const d of dny) rokPravidel(d.datum);
  let zakladniHal = 0; let phmHal = 0;
  if (km > 0) {
    const v = hlavicka.vozidlo;
    zakladniHal = refZakladni(km, v.druh, prives, rok);
    phmHal = refPHM(km, v.spotreba, refCenaPHM(v.palivo, dny[0].datum, cenaDoklad, rok));
  } else if (km !== 0) throw new RefChyba('km musí být nezáporné číslo');
  const st = refStravneCesta(odjezd, navrat, jidla, hlavicka);
  return { zakladniHal, phmHal, stravneHal: st.stravneHal, stravnePouzito: st.pouzito, celkemHal: zakladniHal + phmHal + st.stravneHal };
}

/** § 183 odst. 5: částka k výplatě nahoru na celé koruny. */
export const refKVyplate = (celkemHal) => Math.ceil(celkemHal / 100);

export const kc = (hal) => {
  const abs = Math.abs(hal); const z = hal < 0 ? '−' : '';
  const c = String(Math.floor(abs / 100)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${z}${c},${String(abs % 100).padStart(2, '0')} Kč`;
};

// ---------------------------------------------------------------------------------------------
// Případy: zadání (Z) a vlastní (V). Každý má { id, popis, vstup, ocekavano } – očekávání je ručně
// spočítané z předpisu (komentář), funkce výše ho jen potvrzují.
// ---------------------------------------------------------------------------------------------
const H = (o = {}) => ({ sfera: 'soukroma', vozidlo: { druh: 'osobni', palivo: 'benzin95', spotreba: 6 }, ...o });

export const PRIPADY = [
  // --- zadání ---
  { id: 'Z1', typ: 'zadání', popis: '100 km × 5,90 Kč → 590 Kč', ocekavanoHal: 59000,
    ref: () => refZakladni(100, 'osobni') },
  { id: 'Z2', typ: 'zadání', popis: '100 km, 6 l/100 km, benzin 95 bez dokladu (15. 3. 2026) → 6 × 34,70 = 208,20 Kč', ocekavanoHal: 20820,
    ref: () => refPHM(100, 6, refCenaPHM('benzin95', '2026-03-15')) },
  { id: 'Z3', typ: 'zadání', popis: 'cesta 13 h bez jídla, soukromá → 236 Kč', ocekavanoHal: 23600,
    ref: () => refStravneCesta('2026-03-15T06:00', '2026-03-15T19:00').stravneHal },
  { id: 'Z4', typ: 'zadání', popis: 'cesta 20 h → 370 Kč', ocekavanoHal: 37000,
    ref: () => refStravneCesta('2026-03-15T02:00', '2026-03-15T22:00').stravneHal },
  { id: 'Z5', typ: 'zadání', popis: 'cesta 4 h → 0 Kč', ocekavanoHal: 0,
    ref: () => refStravneCesta('2026-03-15T08:00', '2026-03-15T12:00').stravneHal },
  { id: 'Z6', typ: 'zadání', popis: 'elektromobil 100 km, 18 kWh/100 km bez dokladu → 18 × 7,20 = 129,60 Kč', ocekavanoHal: 12960,
    ref: () => refPHM(100, 18, refCenaPHM('elektrina', '2026-03-15')) },
  { id: 'Z7', typ: 'zadání', popis: 'cesta 10. 1. 2027, 7:00–15:00, 100 km → výpočet se nepustí (vyhláška 2027 nevyšla)', ocekavanoHal: 'chyba',
    ref: () => refCesta({ odjezd: '2027-01-10T07:00', navrat: '2027-01-10T15:00', km: 100 }, H()).celkemHal },
  { id: 'Z8', typ: 'zadání', popis: 'součet příkladů: 100 km, 6 l, benzin 95, 15. 3. 2026 6:00–19:00 → 590 + 208,20 + 236 = 1 034,20 Kč; k výplatě 1 035 Kč (§ 183 odst. 5)', ocekavanoHal: 103420,
    ref: () => refCesta({ odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 100 }, H()).celkemHal, kVyplateKc: 1035 },

  // --- hranice pásem (§ 163 odst. 1) ---
  { id: 'V1', typ: 'vlastní', popis: 'přesně 5:00 h → 155 Kč („5 až 12 hodin“)', ocekavanoHal: 15500, ref: () => refStravneObdobi(300, 0) },
  { id: 'V2', typ: 'vlastní', popis: '4:59 h → 0 Kč', ocekavanoHal: 0, ref: () => refStravneObdobi(299, 0) },
  { id: 'V3', typ: 'vlastní', popis: 'přesně 12:00 h → 155 Kč', ocekavanoHal: 15500, ref: () => refStravneObdobi(720, 0) },
  { id: 'V4', typ: 'vlastní', popis: '12:01 h → 236 Kč („déle než 12 hodin“)', ocekavanoHal: 23600, ref: () => refStravneObdobi(721, 0) },
  { id: 'V5', typ: 'vlastní', popis: 'přesně 18:00 h → 236 Kč („nejdéle však 18 hodin“)', ocekavanoHal: 23600, ref: () => refStravneObdobi(1080, 0) },
  { id: 'V6', typ: 'vlastní', popis: '18:01 h → 370 Kč', ocekavanoHal: 37000, ref: () => refStravneObdobi(1081, 0) },
  { id: 'V7', typ: 'vlastní', popis: 'celý kalendářní den 24 h (15. 3. 0:00 – 16. 3. 0:00) → 370 Kč, jeden den', ocekavanoHal: 37000,
    ref: () => refStravneCesta('2026-03-15T00:00', '2026-03-16T00:00').stravneHal },

  // --- krácení, soukromá sféra (§ 163 odst. 2, 3) ---
  { id: 'V8', typ: 'vlastní', popis: '13 h + 1 jídlo → 236 − 35 % = 153,40 Kč', ocekavanoHal: 15340, ref: () => refStravneObdobi(780, 1) },
  { id: 'V9', typ: 'vlastní', popis: '13 h + 3 jídla → 236 − 105 % → 0 Kč (ne záporné)', ocekavanoHal: 0, ref: () => refStravneObdobi(780, 3) },
  { id: 'V10', typ: 'vlastní', popis: '6 h + 1 jídlo → 155 − 70 % = 46,50 Kč', ocekavanoHal: 4650, ref: () => refStravneObdobi(360, 1) },
  { id: 'V11', typ: 'vlastní', popis: '6 h + 2 jídla → 0 Kč', ocekavanoHal: 0, ref: () => refStravneObdobi(360, 2) },
  { id: 'V12', typ: 'vlastní', popis: '20 h + 3 jídla → 370 − 75 % = 92,50 Kč', ocekavanoHal: 9250, ref: () => refStravneObdobi(1200, 3) },
  { id: 'V13', typ: 'vlastní', popis: '6 h + 1 jídlo, zaměstnavatel předem určil krácení 50 % → 77,50 Kč', ocekavanoHal: 7750,
    ref: () => refStravneObdobi(360, 1, { sfera: 'soukroma', kraceniPct: [50, 35, 25] }) },
  { id: 'V14', typ: 'vlastní', popis: 'krácení 80 % (nad zákonné maximum 70 %) → chyba', ocekavanoHal: 'chyba',
    ref: () => refStravneObdobi(360, 1, { sfera: 'soukroma', kraceniPct: [80, 35, 25] }) },

  // --- veřejná sféra (§ 176) ---
  { id: 'V15', typ: 'vlastní', popis: 'veřejná, 13 h, bez určení → dolní sazba 236 Kč', ocekavanoHal: 23600, ref: () => refStravneObdobi(780, 0, { sfera: 'verejna' }) },
  { id: 'V16', typ: 'vlastní', popis: 'veřejná, 20 h, určeno 442 Kč + 1 jídlo → 442 − 25 % = 331,50 Kč', ocekavanoHal: 33150,
    ref: () => refStravneObdobi(1200, 1, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }) },
  { id: 'V17', typ: 'vlastní', popis: 'veřejná, 6 h, 185 Kč + 2 jídla → 0 Kč (§ 176 odst. 4 písm. a))', ocekavanoHal: 0,
    ref: () => refStravneObdobi(360, 2, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }) },
  { id: 'V18', typ: 'vlastní', popis: 'veřejná, 13 h, 284 Kč + 3 jídla → 0 Kč (§ 176 odst. 4 písm. b))', ocekavanoHal: 0,
    ref: () => refStravneObdobi(780, 3, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }) },
  { id: 'V19', typ: 'vlastní', popis: 'veřejná, 6 h, určeno 200 Kč (mimo rozpětí 155–185) → chyba', ocekavanoHal: 'chyba',
    ref: () => refStravneObdobi(360, 0, { sfera: 'verejna', stravneVerejna: [200, 284, 442] }) },

  // --- cena PHM podle data (vyhl. 573/2025, 78/2026, 175/2026 Sb.) ---
  { id: 'V20', typ: 'vlastní', popis: 'benzin 95, 30. 9. 2026, 100 km, 6 l → 208,20 Kč (34,70)', ocekavanoHal: 20820, ref: () => refPHM(100, 6, refCenaPHM('benzin95', '2026-09-30')) },
  { id: 'V21', typ: 'vlastní', popis: 'benzin 95, 1. 10. 2026, 100 km, 6 l → 250,80 Kč (41,80)', ocekavanoHal: 25080, ref: () => refPHM(100, 6, refCenaPHM('benzin95', '2026-10-01')) },
  { id: 'V22', typ: 'vlastní', popis: 'nafta, 31. 5. 2026, 100 km, 5 l → 170,50 Kč (34,10)', ocekavanoHal: 17050, ref: () => refPHM(100, 5, refCenaPHM('nafta', '2026-05-31')) },
  { id: 'V23', typ: 'vlastní', popis: 'nafta, 1. 6. 2026, 100 km, 5 l → 222,50 Kč (44,50)', ocekavanoHal: 22250, ref: () => refPHM(100, 5, refCenaPHM('nafta', '2026-06-01')) },
  { id: 'V24', typ: 'vlastní', popis: 'benzin 98, 100 km, 7 l → 273,00 Kč (39)', ocekavanoHal: 27300, ref: () => refPHM(100, 7, refCenaPHM('benzin98', '2026-07-01')) },
  { id: 'V25', typ: 'vlastní', popis: 'cena z dokladu 38,90 Kč má přednost: 100 km, 6 l → 233,40 Kč', ocekavanoHal: 23340, ref: () => refPHM(100, 6, refCenaPHM('benzin95', '2026-03-15', 38.9)) },
  { id: 'V26', typ: 'vlastní', popis: 'elektřina z dokladu 6,50 Kč/kWh, 100 km, 18 kWh → 117,00 Kč', ocekavanoHal: 11700, ref: () => refPHM(100, 18, refCenaPHM('elektrina', '2026-03-15', 6.5)) },
  { id: 'V27', typ: 'vlastní', popis: 'cena z dokladu 0 → chyba', ocekavanoHal: 'chyba', ref: () => refCenaPHM('benzin95', '2026-03-15', 0) },

  // --- km, zaokrouhlení položek, jednostopé, přívěs, maximum ---
  { id: 'V28', typ: 'vlastní', popis: '12,5 km × 5,90 → 73,75 Kč', ocekavanoHal: 7375, ref: () => refZakladni(12.5, 'osobni') },
  { id: 'V29', typ: 'vlastní', popis: '33,3 km × 6,4 l × 34,70 = 73,95264 → 73,95 Kč', ocekavanoHal: 7395, ref: () => refPHM(33.3, 6.4, 3470) },
  { id: 'V30', typ: 'vlastní', popis: '0,1 km × 5 l × 41,00 = 0,205 → 0,21 Kč (polovina nahoru)', ocekavanoHal: 21, ref: () => refPHM(0.1, 5, 4100) },
  { id: 'V31', typ: 'vlastní', popis: 'jednostopé 50 km × 1,60 → 80,00 Kč', ocekavanoHal: 8000, ref: () => refZakladni(50, 'jednostope') },
  { id: 'V32', typ: 'vlastní', popis: 'přívěs: 100 km × 5,90 × 1,15 = 678,50 Kč (§ 157 odst. 4 – nejméně)', ocekavanoHal: 67850, ref: () => refZakladni(100, 'osobni', true) },
  { id: 'V33', typ: 'vlastní', popis: 'maximum: 9 999,9 km × 5,90 → 58 999,41 Kč', ocekavanoHal: 5899941, ref: () => refZakladni(9999.9, 'osobni') },
  { id: 'V34', typ: 'vlastní', popis: 'maximum PHM: 9 999,9 km × 6 l × 41,80 = 25 079,7492 → 25 079,75 Kč', ocekavanoHal: 2507975, ref: () => refPHM(9999.9, 6, 4180) },
  { id: 'V35', typ: 'vlastní', popis: 'km = 0 → bez vozidla, jen stravné (13 h) → 236 Kč', ocekavanoHal: 23600,
    ref: () => refCesta({ odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 0 }, H()).celkemHal },
  { id: 'V36', typ: 'vlastní', popis: 'km = −5 → chyba', ocekavanoHal: 'chyba', ref: () => refCesta({ odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: -5 }, H()).celkemHal },
  { id: 'V37', typ: 'vlastní', popis: 'km = NaN („abc“) → chyba', ocekavanoHal: 'chyba', ref: () => refCesta({ odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: NaN }, H()).celkemHal },
  { id: 'V38', typ: 'vlastní', popis: 'km 100, spotřeba 0 → chyba (bez spotřeby nelze PHM)', ocekavanoHal: 'chyba',
    ref: () => refCesta({ odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 100 }, H({ vozidlo: { druh: 'osobni', palivo: 'benzin95', spotreba: 0 } })).celkemHal },
  { id: 'V39', typ: 'vlastní', popis: 'návrat před odjezdem → chyba', ocekavanoHal: 'chyba', ref: () => refStravneCesta('2026-03-15T10:00', '2026-03-15T09:00').stravneHal },
  { id: 'V40', typ: 'vlastní', popis: 'prázdný odjezd → chyba', ocekavanoHal: 'chyba', ref: () => refStravneCesta('', '2026-03-15T09:00').stravneHal },

  // --- vícedenní cesty, půlnoc, § 163 odst. 4 ---
  { id: 'V41', typ: 'vlastní', popis: '3 dny: 15. 3. 14:00 – 17. 3. 10:30, 1 jídlo 16. 3. → 155 + (370 − 25 %) 277,50 + 155 = 587,50 Kč', ocekavanoHal: 58750,
    ref: () => refStravneCesta('2026-03-15T14:00', '2026-03-17T10:30', { '2026-03-16': 1 }).stravneHal },
  { id: 'V42', typ: 'vlastní', popis: 'návrat přesně o půlnoci: 15. 3. 8:00 – 16. 3. 0:00 → 16 h, jeden den → 236 Kč', ocekavanoHal: 23600,
    ref: () => refStravneCesta('2026-03-15T08:00', '2026-03-16T00:00').stravneHal },
  { id: 'V43', typ: 'vlastní', popis: 'přes půlnoc 20:00–2:00 (4 h + 2 h): odděleně 0 + 0; společně 6 h → 155 Kč (§ 163 odst. 4)', ocekavanoHal: 15500,
    ref: () => refStravneCesta('2026-03-15T20:00', '2026-03-16T02:00').stravneHal },
  { id: 'V44', typ: 'vlastní', popis: 'přes půlnoc 6:00–0:30 (18 h + 0,5 h): odděleně 236 + 0; společně 18,5 h → 370 Kč', ocekavanoHal: 37000,
    ref: () => refStravneCesta('2026-03-15T06:00', '2026-03-16T00:30').stravneHal },
  { id: 'V45', typ: 'vlastní', popis: 'přes půlnoc 22:00–11:00 (2 h + 11 h): odděleně 0 + 155; společně 13 h → 236 Kč', ocekavanoHal: 23600,
    ref: () => refStravneCesta('2026-03-15T22:00', '2026-03-16T11:00').stravneHal },
  { id: 'V46', typ: 'vlastní', popis: 'přes půlnoc 19:00–10:00 (5 h + 10 h): odděleně 155 + 155 = 310; společně 15 h → 236 → výhodnější oddělené 310 Kč', ocekavanoHal: 31000,
    ref: () => refStravneCesta('2026-03-15T19:00', '2026-03-16T10:00').stravneHal },
  { id: 'V47', typ: 'vlastní', popis: 'přes půlnoc 21:00–9:00, 1 jídlo 2. den: odděleně 0 + 46,50; společně 12 h, 1 jídlo → 46,50 → 46,50 Kč', ocekavanoHal: 4650,
    ref: () => refStravneCesta('2026-03-15T21:00', '2026-03-16T09:00', { '2026-03-16': 1 }).stravneHal },
  { id: 'V48', typ: 'vlastní', popis: 'veřejná sféra přes půlnoc 20:00–2:00 → § 163 odst. 4 platí i zde (§ 174, § 176 odst. 1 vylučuje jen odst. 1–3) → 155 Kč', ocekavanoHal: 15500,
    ref: () => refStravneCesta('2026-03-15T20:00', '2026-03-16T02:00', {}, { sfera: 'verejna' }).stravneHal },
  { id: 'V49', typ: 'vlastní', popis: 'nepřestupný rok: 28. 2. 2026 22:00 – 1. 3. 2026 4:00 (bez 29. 2.): odděleně 0 + 0; společně 6 h → 155 Kč', ocekavanoHal: 15500,
    ref: () => refStravneCesta('2026-02-28T22:00', '2026-03-01T04:00').stravneHal },
  { id: 'V50', typ: 'vlastní', popis: 'přelom roku: 31. 12. 2026 20:00 – 1. 1. 2027 8:00 → chyba (pro 2027 není vyhláška)', ocekavanoHal: 'chyba',
    ref: () => refStravneCesta('2026-12-31T20:00', '2027-01-01T08:00').stravneHal },
  { id: 'V51', typ: 'vlastní', popis: 'cesta 2025 (rok bez sazeb v aplikaci) → chyba', ocekavanoHal: 'chyba',
    ref: () => refStravneCesta('2025-12-31T06:00', '2025-12-31T19:00').stravneHal },

  // --- souhrn, § 183 odst. 5 ---
  { id: 'V52', typ: 'vlastní', popis: 'součet 2 cest 301,10 + 1 034,20 = 1 335,30 Kč → k výplatě 1 336 Kč', ocekavanoHal: 133530,
    ref: () => 30110 + 103420, kVyplateKc: 1336 },
  { id: 'V53', typ: 'vlastní', popis: 'součet přesně na koruny 1 034,00 → k výplatě 1 034 Kč (nezaokrouhluje se výš)', ocekavanoHal: 103400,
    ref: () => 103400, kVyplateKc: 1034 },

  // --- letní čas (nástěnný vs. skutečný čas) – jen informativně ---
  { id: 'V54', typ: 'vlastní', popis: '29. 3. 2026 0:30–5:30 (změna na letní čas): nástěnně 5 h → 155 Kč; skutečně uplyne 4 h → 0 Kč (reference počítá nástěnný čas stejně jako aplikace)', ocekavanoHal: 15500,
    ref: () => refStravneCesta('2026-03-29T00:30', '2026-03-29T05:30').stravneHal },
];

export function spustReferenci() {
  return PRIPADY.map((p) => {
    let vysledek;
    try { vysledek = p.ref(); } catch (e) { vysledek = `chyba: ${e.message}`; }
    const shoda = p.ocekavanoHal === 'chyba' ? String(vysledek).startsWith('chyba') : vysledek === p.ocekavanoHal;
    return { id: p.id, typ: p.typ, popis: p.popis, ocekavano: p.ocekavanoHal === 'chyba' ? 'chyba' : kc(p.ocekavanoHal),
      reference: typeof vysledek === 'number' ? kc(vysledek) : vysledek, referenceHal: vysledek, shodaSOcekavanim: shoda,
      kVyplateKc: p.kVyplateKc ? refKVyplate(typeof vysledek === 'number' ? vysledek : 0) : undefined };
  });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const v = spustReferenci();
  for (const r of v) console.log(`${r.id}\t${r.shodaSOcekavanim ? 'OK ' : 'ROZDÍL'}\t${r.reference}\t${r.popis}`);
  const spatne = v.filter((r) => !r.shodaSOcekavanim);
  console.log(`\n${v.length} případů, ruční očekávání potvrzeno u ${v.length - spatne.length}.`);
  if (spatne.length) process.exitCode = 1;
}
