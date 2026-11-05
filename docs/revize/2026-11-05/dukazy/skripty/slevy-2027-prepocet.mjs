// Nezávislý referenční přepočet pro revizi aplikace Slevy 2027 (5. 11. 2026).
// Napsáno od nuly podle úředních pravidel z rejstříku docs/revize/2026-11-05/pravidla.md
// (ID DP-xx) a textu zákona č. 586/1992 Sb. ve znění od 1. 1. 2027 (zakonyprolidi.cz, verze 158)
// a daňového řádu (zákon č. 280/2009 Sb.). Kód aplikace zde NENÍ importován ani opsán.
// Spuštění: node slevy-2027-prepocet.mjs  → vypíše referenční hodnoty případů.
// Porovnání s modulem aplikace dělá slevy-2027-porovnani.mjs.

// --- Úřední parametry pro rok 2027 ------------------------------------------
export const P = {
  rok: 2027,
  minMzda: 24900, // DP-24: sdělení MPSV č. 171/2026 Sb.
  poplatnik: 30840, // DP-18: § 35ba odst. 1 písm. a)
  manzel: 24840, manzelZtppNasobek: 2, manzelLimitPrijmu: 68000, manzelVekDitete: 3, // DP-19: § 35bb
  inv12: 2520, inv3: 5040, ztpp: 16140, // DP-20, DP-21: § 35ba odst. 1 písm. c)–e)
  student: 4020, studentVek: 26, studentVekDoktor: 28, // DP-22: § 35bc
  skolkovneStrop: 24900, // DP-23: § 35bd (= minimální mzda)
  deti: [15204, 22320, 27840], detiZtppNasobek: 2, detiVekMax: 26, // DP-25, DP-26: § 35c odst. 1, 6, 7
  bonusNasobekMinMzdy: 6, bonusMinKc: 100, // DP-27: § 35c odst. 3, 4
  stariLimit: 48000, dpsHraniceMesicne: 1700, // DP-11, DP-12: § 15 odst. 6, 7
  urokyLimit: 150000, urokyLimitPred2021: 300000, // DP-31: § 15 odst. 4; zák. 386/2020 Sb. čl. IV
  daryMinKc: 1000, daryMinPodil: 0.02, daryMaxPodil: 0.15, krev: 3000, // DP-32: § 15 odst. 1
  priznaniOstatni: 40000, priznaniObecne: 100000, // DP-34: § 38g odst. 1, 2
  sazba: 0.15, sazbaZvysena: 0.23, prumernaMzda: 51663, // DP-29, DP-30: § 16; NV 177/2026 Sb.
};
export const HRANICE_23 = 36 * P.prumernaMzda; // 1 859 868 Kč

// --- Pomocné: věk na počátku měsíce ----------------------------------------
// Datum narození {rok, mesic, den}; není-li den znám, předpokládám 15. (ne 1.) – stejně jako aplikace.
// „Na počátku kalendářního měsíce“ = 1. den měsíce (§ 35ba odst. 3, § 35c odst. 10).
export function vekNaPocatkuMesice(nar, rok, m) {
  const den = nar.den ?? 15;
  let vek = rok - nar.rok;
  if (m < nar.mesic || (m === nar.mesic && den > 1)) vek -= 1; // narozeniny v tomto roce ještě nebyly
  return vek;
}
/** Je osoba na počátku měsíce m roku rok už na světě? */
export function naSveteNaPocatku(nar, rok, m) {
  const den = nar.den ?? 15;
  if (nar.rok !== rok) return nar.rok < rok;
  return nar.mesic < m || (nar.mesic === m && den === 1);
}
const vMesicich = (od = 1, doM = 12) => Array.from({ length: 12 }, (_, i) => i + 1).filter((m) => m >= od && m <= doM);
const kladne = (x) => (typeof x === 'number' && Number.isFinite(x) && x > 0 ? x : 0);

// --- Slevy § 35ba–35bd -------------------------------------------------------
/** Sleva na studenta: 1/12 za měsíc, na jehož počátku studuje a nedovršil 26 (prezenční doktorské 28) let. */
export function student({ nar, od = 1, do: doM = 12, doktorskePrezencni = false }) {
  const vekMax = doktorskePrezencni ? P.studentVekDoktor : P.studentVek;
  const mesice = vMesicich(od, doM).filter((m) => vekNaPocatkuMesice(nar, P.rok, m) < vekMax).length;
  return { mesice, rocne: (P.student / 12) * mesice };
}

/** Sleva na manžela: 1/12 za měsíc, na jehož počátku žije v domácnosti manžel i vlastní dítě do 3 let; příjem ≤ 68 000 Kč. */
export function manzel({ prijem = 0, deti = [], ztpp = false }) {
  if (prijem > P.manzelLimitPrijmu) return { mesice: 0, rocne: 0, duvod: 'příjem nad 68 000 Kč' };
  const mesice = vMesicich().filter((m) => deti.some((d) =>
    naSveteNaPocatku(d.nar, P.rok, m) && vekNaPocatkuMesice(d.nar, P.rok, m) < P.manzelVekDitete && m >= (d.od ?? 1) && m <= (d.do ?? 12))).length;
  const sazba = P.manzel * (ztpp ? P.manzelZtppNasobek : 1);
  return { mesice, rocne: (sazba / 12) * mesice };
}

/** Školkovné: skutečné výdaje, nejvýš minimální mzda / počet domácností (dolů) nebo písemná dohoda (nejvýš minimální mzda). */
export function skolkovne(deti) {
  let rocne = 0;
  for (const d of deti) {
    if (!d.skolka) continue;
    const strop = kladne(d.dohoda) > 0 ? Math.min(kladne(d.dohoda), P.skolkovneStrop) : Math.floor(P.skolkovneStrop / Math.max(1, d.domacnosti ?? 1));
    rocne += Math.min(kladne(d.skolne), strop);
  }
  return { rocne };
}

/** Invalidita a ZTP/P (celý rok). */
export function invalidita({ stupen = 0, ztpp = false }) {
  return (stupen === 1 || stupen === 2 ? P.inv12 : stupen === 3 ? P.inv3 : 0) + (ztpp ? P.ztpp : 0);
}

// --- Daňové zvýhodnění § 35c -------------------------------------------------
/** Za každý měsíc: děti, na které je nárok (už za měsíc narození; do dovršení 26 let; v domácnosti od–do), v pořadí seznamu. */
export function zvyhodneni(deti) {
  const naDite = deti.map(() => 0);
  for (const m of vMesicich()) {
    let poradi = 0;
    deti.forEach((d, i) => {
      const narozeno = d.nar.rok < P.rok || (d.nar.rok === P.rok && d.nar.mesic <= m);
      if (!narozeno) return;
      if (vekNaPocatkuMesice(d.nar, P.rok, m) >= P.detiVekMax) return; // § 35c odst. 6 písm. b)
      if (m < (d.od ?? 1) || m > (d.do ?? 12)) return;
      naDite[i] += (P.deti[Math.min(poradi, 2)] / 12) * (d.ztpp ? P.detiZtppNasobek : 1);
      poradi += 1;
    });
  }
  return { naDite, rocne: naDite.reduce((s, x) => s + x, 0) };
}

// --- Odpočty § 15 ------------------------------------------------------------
/** Produkty na stáří: u DPS jen část měsíčního příspěvku nad 1 700 Kč (po měsících, § 15 odst. 7); společný limit 48 000 Kč. */
export function stari({ dps = 0, dpsMesicne = null, dip = 0, zivotni = 0, pece = 0 }) {
  const mesicni = dpsMesicne ?? Array(12).fill(kladne(dps) / 12); // bez rozpisu předpokládám rovnoměrné vklady
  const dpsUznane = mesicni.reduce((s, v) => s + Math.max(0, v - P.dpsHraniceMesicne), 0);
  const celkem = dpsUznane + kladne(dip) + kladne(zivotni) + kladne(pece);
  return { celkem, odpocet: Math.min(celkem, P.stariLimit) };
}
/** Úroky: 150 000 Kč na domácnost (300 000 Kč u bytové potřeby obstarané před 1. 1. 2021), 1/12 za každý měsíc placení. */
export function uroky({ uroky: castka = 0, pred2021 = false, mesice = 12 }) {
  const limit = (pred2021 ? P.urokyLimitPred2021 : P.urokyLimit) * mesice / 12;
  return Math.min(kladne(castka), limit);
}
/** Dary: úhrn > 2 % ZD nebo ≥ 1 000 Kč; nejvýš 15 % základu daně (základ před nezdanitelnými částmi). */
export function dary({ dary: castka = 0, krev = 0 }, zakladDane = null) {
  const uhrn = kladne(castka) + kladne(krev) * P.krev;
  const splneno = uhrn >= P.daryMinKc || (zakladDane > 0 && uhrn > zakladDane * P.daryMinPodil);
  if (!splneno) return 0;
  return zakladDane > 0 ? Math.min(uhrn, Math.floor(zakladDane * P.daryMaxPodil)) : uhrn;
}

// --- Daň § 16, § 35c, daňový řád § 146 --------------------------------------
export function dan(zakladPoOdpoctech) {
  const z = Math.max(0, Math.floor(zakladPoOdpoctech / 100) * 100); // § 16 odst. 2: na celá sta dolů
  const d = Math.min(z, HRANICE_23) * P.sazba + Math.max(0, z - HRANICE_23) * P.sazbaZvysena;
  return Math.ceil(Math.round(d * 100) / 100); // § 146 odst. 1 a 3 DŘ: na 2 desetinná místa, pak na koruny nahoru
}
/** Slevy sníží daň nejvýš na nulu; zvýhodnění zbytek jako bonus (≥ 100 Kč, příjem § 6/§ 7 ≥ 6× min. mzdy). */
export function vyuctovani({ zakladDane, odpocty = 0, slevy = 0, zvyhodneni: zv = 0, prijemPrace = 0 }) {
  const danPred = dan(zakladDane - odpocty);
  const poSlevach = Math.max(0, danPred - slevy);
  const zvSleva = Math.min(poSlevach, zv);
  const zbytek = zv - zvSleva;
  const narokBonus = prijemPrace >= P.bonusNasobekMinMzdy * P.minMzda;
  const bonus = narokBonus && zbytek >= P.bonusMinKc ? zbytek : 0;
  return { danPred, dan: poSlevach - zvSleva, bonus, narokBonus };
}
/** Povinnost přiznání zaměstnance (§ 38g odst. 2): ostatní příjmy § 7–10 nad 40 000 Kč nebo souběžný plátce. */
export function priznani({ ostatni = 0, soubezne = 0 }) {
  return kladne(ostatni) > P.priznaniOstatni || kladne(soubezne) > 0;
}

// --- Termíny (§ 38k odst. 4, § 38ch odst. 1 ZDP; § 33 odst. 1, 4 a § 136 DŘ) --
function velikonocniNedele(r) { // Meeus/Jones/Butcher
  const a = r % 19, b = Math.floor(r / 100), c = r % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31), den = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(r, mes - 1, den));
}
export function jeSvatek(d) { // zákon č. 245/2000 Sb.
  const r = d.getUTCFullYear(), m = d.getUTCMonth() + 1, den = d.getUTCDate();
  const pevne = ['1-1', '5-1', '5-8', '7-5', '7-6', '9-28', '10-28', '11-17', '12-24', '12-25', '12-26'];
  if (pevne.includes(`${m}-${den}`)) return true;
  const ned = velikonocniNedele(r).getTime();
  return d.getTime() === ned - 2 * 86400000 || d.getTime() === ned + 86400000; // Velký pátek, Velikonoční pondělí
}
export function nejblizsiPracovniDen(d) {
  const x = new Date(d.getTime());
  while (x.getUTCDay() === 0 || x.getUTCDay() === 6 || jeSvatek(x)) x.setUTCDate(x.getUTCDate() + 1);
  return x;
}
/** Lhůta N měsíců po skončení zdaňovacího období (§ 33 odst. 1 DŘ: běží od 1. 1., končí 1. dne (1+N). měsíce). */
export function lhutaPriznani(rokZdanovaci, mesicu) {
  return nejblizsiPracovniDen(new Date(Date.UTC(rokZdanovaci + 1, mesicu, 1)));
}
export const iso = (d) => d.toISOString().slice(0, 10);
export function terminy(rok) {
  return {
    prohlaseni: iso(nejblizsiPracovniDen(new Date(Date.UTC(rok, 1, 15)))), // 15. 2. daného roku (§ 38k odst. 4)
    rocniZuctovani: iso(nejblizsiPracovniDen(new Date(Date.UTC(rok + 1, 1, 15)))), // 15. 2. následujícího roku (§ 38ch odst. 1)
    priznaniPapir: iso(lhutaPriznani(rok, 3)),
    priznaniElektronicky: iso(lhutaPriznani(rok, 4)),
    priznaniPoradce: iso(lhutaPriznani(rok, 6)),
  };
}

// --- Celkové vyhodnocení (stejná definice „Až“ a „reálně“ jako aplikace, ale vlastní výpočet) ---
export function cely(o) {
  const slevyPolozky = { poplatnik: P.poplatnik };
  if (o.student) slevyPolozky.student = student(o.student).rocne;
  if (o.invalidita) slevyPolozky.invalidita = invalidita(o.invalidita);
  if (o.manzel) slevyPolozky.manzel = manzel({ ...o.manzel, deti: o.deti ?? [] }).rocne;
  if ((o.deti ?? []).some((d) => d.skolka)) slevyPolozky.skolkovne = skolkovne(o.deti).rocne;
  const zv = o.deti?.length ? zvyhodneni(o.deti).rocne : 0;
  const mzdaRocne = (o.mzda ?? 0) * (o.mesice ?? 12);
  const prijemPrace = mzdaRocne + (o.prijmy?.soubezne ?? 0);
  const zakladDane = mzdaRocne > 0 ? prijemPrace + (o.prijmy?.ostatni ?? 0) : null;
  const odpocty = {};
  if (o.stari) odpocty.stari = stari(o.stari).odpocet;
  if (o.uroky) odpocty.uroky = uroky(o.uroky);
  if (o.dary) odpocty.dary = dary(o.dary, zakladDane);
  const slevyCelkem = Object.values(slevyPolozky).reduce((s, x) => s + x, 0);
  const odpoctyCelkem = Object.values(odpocty).reduce((s, x) => s + x, 0);
  const az = slevyCelkem + zv + Math.round(odpoctyCelkem * P.sazba);
  let realne = null, vyuct = null;
  if (zakladDane !== null) {
    vyuct = vyuctovani({ zakladDane, odpocty: odpoctyCelkem, slevy: slevyCelkem, zvyhodneni: zv, prijemPrace });
    realne = dan(zakladDane) - vyuct.dan + vyuct.bonus;
  }
  return { slevy: slevyPolozky, zvyhodneni: zv, odpocty, az, realne, vyuct, zakladDane, priznani: priznani(o.prijmy ?? {}) };
}

// --- Případy ------------------------------------------------------------------
const nar = (rok, mesic, den) => ({ rok, mesic, ...(den ? { den } : {}) });
export const pripady = [
  // Zadání (Kritéria hotovo)
  { id: 'Z1', zdroj: 'zadání', popis: 'student 22 let po celý rok', vstup: 'nar. 1/2005, studium 1–12, VŠ', ref: () => student({ nar: nar(2005, 1) }).rocne, ocekavano: 4020 },
  { id: 'Z2', zdroj: 'zadání', popis: 'student jen leden–červen', vstup: 'nar. 1/2005, studium 1–6', ref: () => student({ nar: nar(2005, 1), od: 1, do: 6 }).rocne, ocekavano: 2010 },
  { id: 'Z3', zdroj: 'zadání', popis: 'věk 27, bakalářské studium', vstup: 'nar. 1/2000, studium 1–12, VŠ', ref: () => student({ nar: nar(2000, 1) }).rocne, ocekavano: 0 },
  { id: 'Z4', zdroj: 'zadání', popis: '2 děti po celý rok', vstup: 'nar. 4/2018 a 9/2021', ref: () => zvyhodneni([{ nar: nar(2018, 4) }, { nar: nar(2021, 9) }]).rocne, ocekavano: 37524 },
  { id: 'Z5a', zdroj: 'zadání', popis: 'školkovné, školné 30 000 Kč', vstup: 'školné 30 000', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 30000 }]).rocne, ocekavano: 24900 },
  { id: 'Z5b', zdroj: 'zadání', popis: 'školkovné, školné 12 000 Kč', vstup: 'školné 12 000', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 12000 }]).rocne, ocekavano: 12000 },
  { id: 'Z6a', zdroj: 'zadání', popis: 'manželka příjem 50 000 Kč, dítě 2 roky', vstup: 'příjem 50 000, dítě nar. 3/2025', ref: () => manzel({ prijem: 50000, deti: [{ nar: nar(2025, 3) }] }).rocne, ocekavano: 24840 },
  { id: 'Z6b', zdroj: 'zadání', popis: 'manželka příjem 70 000 Kč', vstup: 'příjem 70 000, dítě nar. 3/2025', ref: () => manzel({ prijem: 70000, deti: [{ nar: nar(2025, 3) }] }).rocne, ocekavano: 0 },
  { id: 'Z7', zdroj: 'zadání', popis: 'vklady do DIP 60 000 Kč', vstup: 'DIP 60 000', ref: () => stari({ dip: 60000 }).odpocet, ocekavano: 48000 },
  // Vlastní hraniční případy – student
  { id: 'V1', zdroj: 'vlastní', popis: 'student dovrší 26 let v červnu 2027 (narozen po 1. dni)', vstup: 'nar. 6/2001', ref: () => student({ nar: nar(2001, 6) }).rocne },
  { id: 'V2', zdroj: 'vlastní', popis: 'student narozený 1. 6. 2001 (26 let přesně 1. 6.)', vstup: 'nar. 1. 6. 2001', ref: () => student({ nar: nar(2001, 6, 1) }).rocne },
  { id: 'V3', zdroj: 'vlastní', popis: 'doktorand prezenční, 27 let', vstup: 'nar. 1/2000, doktorské prezenční', ref: () => student({ nar: nar(2000, 1), doktorskePrezencni: true }).rocne },
  { id: 'V4', zdroj: 'vlastní', popis: 'doktorand prezenční, 28 let v březnu', vstup: 'nar. 3/1999, doktorské prezenční', ref: () => student({ nar: nar(1999, 3), doktorskePrezencni: true }).rocne },
  { id: 'V5', zdroj: 'vlastní', popis: 'doktorand kombinovaný, 27 let', vstup: 'nar. 1/2000, doktorské kombinované', ref: () => student({ nar: nar(2000, 1) }).rocne },
  { id: 'V6', zdroj: 'vlastní', popis: 'studium od 9 do 6 (od > do) – nesmyslné', vstup: 'od 9, do 6', ref: () => student({ nar: nar(2005, 1), od: 9, do: 6 }).rocne },
  // manžel
  { id: 'V7', zdroj: 'vlastní', popis: 'manžel: příjem přesně 68 000 Kč', vstup: 'příjem 68 000, dítě nar. 3/2025', ref: () => manzel({ prijem: 68000, deti: [{ nar: nar(2025, 3) }] }).rocne },
  { id: 'V8', zdroj: 'vlastní', popis: 'manžel: příjem 68 001 Kč', vstup: 'příjem 68 001', ref: () => manzel({ prijem: 68001, deti: [{ nar: nar(2025, 3) }] }).rocne },
  { id: 'V9', zdroj: 'vlastní', popis: 'manžel: dítě dovrší 3 roky v listopadu 2027', vstup: 'dítě nar. 11/2024', ref: () => manzel({ prijem: 0, deti: [{ nar: nar(2024, 11) }] }).rocne },
  { id: 'V10', zdroj: 'vlastní', popis: 'manžel: dítě narozené v dubnu 2027', vstup: 'dítě nar. 4/2027', ref: () => manzel({ prijem: 0, deti: [{ nar: nar(2027, 4) }] }).rocne },
  { id: 'V11', zdroj: 'vlastní', popis: 'manžel ZTP/P, dítě 2 roky', vstup: 'ZTP/P, dítě nar. 3/2025', ref: () => manzel({ prijem: 0, ztpp: true, deti: [{ nar: nar(2025, 3) }] }).rocne },
  { id: 'V12', zdroj: 'vlastní', popis: 'manžel: dítě 12 let (bez dítěte do 3 let)', vstup: 'dítě nar. 3/2015', ref: () => manzel({ prijem: 0, deti: [{ nar: nar(2015, 3) }] }).rocne },
  // děti
  { id: 'V13', zdroj: 'vlastní', popis: 'dítě narozené v dubnu 2027 (i za měsíc narození)', vstup: 'nar. 4/2027', ref: () => zvyhodneni([{ nar: nar(2027, 4) }]).rocne },
  { id: 'V14', zdroj: 'vlastní', popis: 'dítě ZTP/P celý rok', vstup: 'nar. 4/2018, ZTP/P', ref: () => zvyhodneni([{ nar: nar(2018, 4), ztpp: true }]).rocne },
  { id: 'V15', zdroj: 'vlastní', popis: '3 děti celý rok', vstup: '3× nar. 1/2015', ref: () => zvyhodneni([{ nar: nar(2015, 1) }, { nar: nar(2015, 1) }, { nar: nar(2015, 1) }]).rocne },
  { id: 'V16', zdroj: 'vlastní', popis: 'dítě dovrší 26 let v březnu 2027 (studuje, v domácnosti 1–12)', vstup: 'nar. 3/2001', ref: () => zvyhodneni([{ nar: nar(2001, 3) }]).rocne },
  { id: 'V17', zdroj: 'vlastní', popis: 'dítě v domácnosti jen 7–12', vstup: 'nar. 4/2018, od 7 do 12', ref: () => zvyhodneni([{ nar: nar(2018, 4), od: 7, do: 12 }]).rocne },
  // školkovné
  { id: 'V18', zdroj: 'vlastní', popis: 'školkovné, dítě ve 2 domácnostech', vstup: 'školné 30 000, 2 domácnosti', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 30000, domacnosti: 2 }]).rocne },
  { id: 'V19', zdroj: 'vlastní', popis: 'školkovné, 3 domácnosti (zaokrouhlení dolů)', vstup: 'školné 30 000, 3 domácnosti', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 30000, domacnosti: 3 }]).rocne },
  { id: 'V20', zdroj: 'vlastní', popis: 'školkovné, písemná dohoda 17 430 Kč', vstup: 'školné 30 000, dohoda 17 430', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 30000, domacnosti: 2, dohoda: 17430 }]).rocne },
  { id: 'V21', zdroj: 'vlastní', popis: 'školkovné, dohoda nad minimální mzdu (30 000)', vstup: 'školné 30 000, dohoda 30 000', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 30000, domacnosti: 2, dohoda: 30000 }]).rocne },
  { id: 'V22', zdroj: 'vlastní', popis: 'školkovné přesně 24 900 Kč', vstup: 'školné 24 900', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 24900 }]).rocne },
  { id: 'V23', zdroj: 'vlastní', popis: 'školkovné 0 Kč / záporné', vstup: 'školné 0; −5 000', ref: () => skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: 0 }]).rocne + skolkovne([{ nar: nar(2022, 5), skolka: true, skolne: -5000 }]).rocne },
  // stáří
  { id: 'V24', zdroj: 'vlastní', popis: 'penzijko 24 000 Kč/rok rovnoměrně (2 000/měs.)', vstup: 'DPS 24 000', ref: () => stari({ dps: 24000 }).odpocet },
  { id: 'V25', zdroj: 'vlastní', popis: 'penzijko 20 400 Kč/rok (1 700/měs.)', vstup: 'DPS 20 400', ref: () => stari({ dps: 20400 }).odpocet },
  { id: 'V26', zdroj: 'vlastní', popis: 'penzijko jen jednorázově v prosinci 48 000 Kč (§ 15 odst. 7 po měsících)', vstup: 'DPS 0×11, prosinec 48 000', ref: () => stari({ dpsMesicne: [...Array(11).fill(0), 48000] }).odpocet },
  { id: 'V27', zdroj: 'vlastní', popis: 'součet produktů nad limit', vstup: 'DPS 50 400, DIP 10 000, ŽP 20 000', ref: () => stari({ dps: 50400, dip: 10000, zivotni: 20000 }).odpocet },
  { id: 'V28', zdroj: 'vlastní', popis: 'DIP přesně 48 000 Kč', vstup: 'DIP 48 000', ref: () => stari({ dip: 48000 }).odpocet },
  // úroky
  { id: 'V29', zdroj: 'vlastní', popis: 'úroky 200 000 Kč, bytová potřeba od 2021', vstup: 'úroky 200 000', ref: () => uroky({ uroky: 200000 }) },
  { id: 'V30', zdroj: 'vlastní', popis: 'úroky 200 000 Kč, bytová potřeba před 2021', vstup: 'úroky 200 000, před 2021', ref: () => uroky({ uroky: 200000, pred2021: true }) },
  { id: 'V31', zdroj: 'vlastní', popis: 'úroky 100 000 Kč placené 6 měsíců', vstup: 'úroky 100 000, 6 měsíců', ref: () => uroky({ uroky: 100000, mesice: 6 }) },
  { id: 'V32', zdroj: 'vlastní', popis: 'úroky přesně 150 000 Kč', vstup: 'úroky 150 000', ref: () => uroky({ uroky: 150000 }) },
  // dary
  { id: 'V33', zdroj: 'vlastní', popis: 'dary 800 Kč (pod 1 000 i pod 2 %)', vstup: 'dary 800, ZD 600 000', ref: () => dary({ dary: 800 }, 600000) },
  { id: 'V34', zdroj: 'vlastní', popis: 'dary 500 Kč + 1 odběr krve', vstup: 'dary 500, krev 1, ZD 600 000', ref: () => dary({ dary: 500, krev: 1 }, 600000) },
  { id: 'V35', zdroj: 'vlastní', popis: 'dary 200 000 Kč, strop 15 % ZD', vstup: 'dary 200 000, ZD 600 000', ref: () => dary({ dary: 200000 }, 600000) },
  { id: 'V36', zdroj: 'vlastní', popis: 'dary 999 Kč při ZD 40 000 (nad 2 % = 800)', vstup: 'dary 999, ZD 40 000', ref: () => dary({ dary: 999 }, 40000) },
  { id: 'V37', zdroj: 'vlastní', popis: 'dary 200 000 Kč bez známého základu', vstup: 'dary 200 000, ZD neznámý', ref: () => dary({ dary: 200000 }, null) },
  { id: 'V38', zdroj: 'vlastní', popis: 'dary 100 000 při ZD 600 000, k tomu stáří 48 000 a úroky 150 000 (strop z nekráceného ZD)', vstup: 'dary 100 000, ZD 600 000, jiné odpočty 198 000', ref: () => dary({ dary: 100000 }, 600000) },
  // daň a bonus
  { id: 'V39', zdroj: 'vlastní', popis: 'daň: ZD 240 000, slevy 30 840, 1 dítě', vstup: 'mzda 20 000 × 12', ref: () => { const v = vyuctovani({ zakladDane: 240000, slevy: 30840, zvyhodneni: 15204, prijemPrace: 240000 }); return `${v.danPred}/${v.dan}/${v.bonus}`; } },
  { id: 'V40', zdroj: 'vlastní', popis: 'bonus: příjem 149 399 Kč (pod 6× min. mzdy)', vstup: 'ZD 149 399, zvýhodnění 15 204', ref: () => vyuctovani({ zakladDane: 149399, slevy: 30840, zvyhodneni: 15204, prijemPrace: 149399 }).bonus },
  { id: 'V41', zdroj: 'vlastní', popis: 'bonus: příjem přesně 149 400 Kč', vstup: 'ZD 149 400, zvýhodnění 15 204', ref: () => vyuctovani({ zakladDane: 149400, slevy: 30840, zvyhodneni: 15204, prijemPrace: 149400 }).bonus },
  { id: 'V42', zdroj: 'vlastní', popis: 'bonus pod 100 Kč se nevyplácí', vstup: 'ZD 155 400, zvýhodnění 50', ref: () => vyuctovani({ zakladDane: 155400, slevy: 30840, zvyhodneni: 50, prijemPrace: 155400 }).bonus },
  { id: 'V43', zdroj: 'vlastní', popis: 'daň v pásmu 23 %: ZD 2 000 000', vstup: 'ZD 2 000 000', ref: () => dan(2000000) },
  { id: 'V44', zdroj: 'vlastní', popis: 'zaokrouhlení základu na sta dolů: ZD 240 099', vstup: 'ZD 240 099', ref: () => dan(240099) },
  { id: 'V45', zdroj: 'vlastní', popis: 'daň při ZD 0 a záporném (odpočty > ZD)', vstup: 'ZD 10 000, odpočty 48 000', ref: () => vyuctovani({ zakladDane: 10000, odpocty: 48000, slevy: 30840 }).dan },
  // přiznání
  { id: 'V46', zdroj: 'vlastní', popis: 'přiznání: ostatní příjmy přesně 40 000 Kč', vstup: 'ostatní 40 000', ref: () => priznani({ ostatni: 40000 }) },
  { id: 'V47', zdroj: 'vlastní', popis: 'přiznání: ostatní příjmy 40 001 Kč', vstup: 'ostatní 40 001', ref: () => priznani({ ostatni: 40001 }) },
  { id: 'V48', zdroj: 'vlastní', popis: 'přiznání: souběžný zaměstnavatel 1 Kč', vstup: 'souběžné 1', ref: () => priznani({ soubezne: 1 }) },
  { id: 'V49', zdroj: 'vlastní', popis: 'přiznání: jen malé dohody 30 000 Kč', vstup: 'malé dohody 30 000', ref: () => priznani({ maleDohody: 30000 }) },
  // termíny (DP-36 až DP-38; § 33 odst. 4 DŘ; svátky zákon 245/2000 Sb.)
  { id: 'T1', zdroj: 'vlastní', popis: 'termíny za rok 2027 (prohlášení / RZ / přiznání papír / el. / poradce)', vstup: 'rok 2027', ref: () => Object.values(terminy(2027)).join(' ') },
  { id: 'T2', zdroj: 'vlastní', popis: 'termíny za rok 2026 (pro kontrolu: el. přiznání 3. 5. 2027)', vstup: 'rok 2026', ref: () => Object.values(terminy(2026)).join(' ') },
  { id: 'T3', zdroj: 'vlastní', popis: 'svátky a víkendy 2028: 1. 4. so, 1. 5. po (svátek), 1. 7. so; přestupný rok', vstup: '2028', ref: () => [new Date(Date.UTC(2028, 3, 1)).getUTCDay(), new Date(Date.UTC(2028, 4, 1)).getUTCDay(), jeSvatek(new Date(Date.UTC(2028, 4, 1))), new Date(Date.UTC(2028, 6, 1)).getUTCDay(), new Date(Date.UTC(2028, 1, 29)).getUTCDate() === 29].join(' ') },
];

// Celé scénáře (zadávané i v prohlížeči)
export const scenare = {
  A: {
    popis: 'Scénář A (prohlížeč): nar. 5/1990, mzda 45 000 × 12, 2 děti (4/2018; 3/2025 ve školce, školné 30 000), manželka příjem 50 000 s dítětem do 3 let, úroky 120 000 (od 2021), penzijko 36 000 + DIP 10 000, dary 5 000 + 2 odběry krve',
    ref: () => cely({
      mzda: 45000, mesice: 12,
      deti: [{ nar: nar(2018, 4) }, { nar: nar(2025, 3), skolka: true, skolne: 30000 }],
      manzel: { prijem: 50000 },
      uroky: { uroky: 120000 }, stari: { dps: 36000, dip: 10000 }, dary: { dary: 5000, krev: 2 }, prijmy: {},
    }),
  },
  B: {
    popis: 'Scénář B (prohlížeč): student nar. 1/2005, studium 1–6 (VŠ), mzda 25 000 × 12, DIP 60 000, ostatní příjmy 45 000 → přiznání',
    ref: () => cely({ mzda: 25000, mesice: 12, student: { nar: nar(2005, 1), od: 1, do: 6 }, stari: { dip: 60000 }, prijmy: { ostatni: 45000 } }),
  },
};

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  for (const p of pripady) console.log(`${p.id}\t${p.popis}\t→ ${p.ref()}${p.ocekavano !== undefined ? ` (zadání: ${p.ocekavano})` : ''}`);
  for (const [k, s] of Object.entries(scenare)) console.log(k, JSON.stringify(s.ref()));
}
