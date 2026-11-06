// Nezávislý referenční výpočet pro revizi Inflační kalkulačky (5. 11. 2026).
// Psáno od nuly podle vzorců v zadání (docs/zadani.md, oddíl „Výpočty“) a rejstříku pravidel FD-51.
// Kód aplikace (inflation.js, app.js) se zde NEIMPORTUJE. Jediný vstup z repozitáře je datový soubor
// data/cpi.json (řada ověřená proti CSV ČSÚ v rejstříku, oblast D, a znovu ve skriptu
// inflacni-kalkulacka-data.mjs). Porovnání s modulem aplikace dělá inflacni-kalkulacka-porovnani.mjs.
// Spuštění: node inflacni-kalkulacka-prepocet.mjs            (vypíše tabulku případů)
import fs from 'node:fs';

export const REPO = process.env.INF_REPO ?? '/tmp/revize/repos/inflacni-kalkulacka';
export const CPI = JSON.parse(fs.readFileSync(`${REPO}/data/cpi.json`, 'utf8'));
export const MESICE = Object.keys(CPI).sort();
export const PRVNI = MESICE[0];
export const POSLEDNI = MESICE.at(-1);

// ---- pomocné: měsíce ----
export const ord = (m) => { const [r, mm] = m.split('-').map(Number); return r * 12 + (mm - 1); };
export const mesicu = (od, do_) => ord(do_) - ord(od);
export const idx = (m) => { if (!(m in CPI)) throw new Error(`bez dat: ${m}`); return CPI[m]; };
/** Měsíc mimo data → nejbližší dostupný (zadání: „použij poslední dostupný a napiš to“). */
export const omez = (m) => (m > POSLEDNI ? { mesic: POSLEDNI, pozn: 'po konci dat' }
  : m < PRVNI ? { mesic: PRVNI, pozn: 'před začátkem dat' } : { mesic: m, pozn: null });

// ---- vzorce přesně podle zadání ----
export const prepocet = (castka, iOd, iDo) => castka * (iDo / iOd);                 // částka × (I_cíl / I_výchozí)
export const kumulativni = (iOd, iDo) => iDo / iOd - 1;                              // I_cíl / I_výchozí − 1
export const prumernaRocni = (iOd, iDo, n) => { if (!(n > 0)) throw new Error('počet měsíců musí být > 0'); return (iDo / iOd) ** (12 / n) - 1; };
export const realnyVynos = (nominal, inflace) => (1 + nominal) / (1 + inflace) - 1;  // (1+n)/(1+i) − 1, stejné období
export const nominalZaObdobi = (pa, n) => (1 + pa) ** (n / 12) - 1;                  // README: (1+r)^(měsíce/12) − 1
export const anualizuj = (celkem, n) => { if (!(n > 0)) throw new Error('n'); return (1 + celkem) ** (12 / n) - 1; };
export const realnaMzda = (m0, m1, i0, i1) => (m1 / m0) / (i1 / i0) - 1;             // (mzda_dnes/mzda_dřív)/(I_dnes/I_dřív) − 1
/** Meziroční inflace měsíce m = I_m / I_{m−12} − 1 (ČSÚ: meziroční index). */
export const meziroc = (m) => { const p = `${Number(m.slice(0, 4)) - 1}${m.slice(4)}`; return p in CPI ? CPI[m] / CPI[p] - 1 : null; };

// ---- české zobrazení (očekávání pro obrazovku) ----
export const kc = (v) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2 }).format(v);
export const pct = (v, d = 1, znam = false) => new Intl.NumberFormat('cs-CZ', { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: znam ? 'exceptZero' : 'auto' }).format(v);
/** Jak by měl laik zapsané číslo číst: mezery = oddělovač tisíců, čárka = desetinná. Tečka je nejednoznačná (viz případ P3). */
export const ctiCislo = (s) => { const t = String(s).replace(/[\s ]/g, ''); if (t === '' || !/^-?\d+(,\d+)?$/.test(t)) return NaN; return Number(t.replace(',', '.')); };

// ---- případy ----
// druh: prepocet | vynos | mzda | omez | meziroc | parse | chyba
export const PRIPADY = [
  // Zadání – kritéria hotovo (na testovacích indexech)
  { id: 'Z1', typ: 'zadání', druh: 'prepocet', popis: 'index 100 → 125: 100 Kč → 125 Kč, kumulativní inflace 25 %', vstup: { castka: 100, iOd: 100, iDo: 125 } },
  { id: 'Z2', typ: 'zadání', druh: 'prepocet', popis: 'obrácený přepočet 125 Kč → 100 Kč', vstup: { castka: 125, iOd: 125, iDo: 100 } },
  { id: 'Z3', typ: 'zadání', druh: 'vynos', popis: 'nominální výnos 4 %, inflace 2,5 % → reálný ≈ 1,46 %', vstup: { nominal: 0.04, inflace: 0.025 } },
  { id: 'Z4', typ: 'zadání', druh: 'mzda', popis: 'mzda 40 000 → 50 000 Kč při růstu indexu o 20 % → +4,17 %', vstup: { m0: 40000, m1: 50000, i0: 100, i1: 120 } },
  { id: 'Z5', typ: 'zadání', druh: 'prepocet', popis: '24 měsíců, index 100 → 110,25 → průměrná roční inflace 5 %', vstup: { castka: 100, iOd: 100, iDo: 110.25, n: 24 } },
  // Zadání – cíl „10 000 Kč v lednu 2005 odpovídá dnes X Kč“ (i obráceně) na skutečných datech
  { id: 'V1', typ: 'zadání/data', druh: 'prepocet', popis: '10 000 Kč, leden 2005 → září 2026 (výchozí stav aplikace)', vstup: { castka: 10000, od: '2005-01', do: '2026-09' } },
  { id: 'V2', typ: 'zadání/data', druh: 'prepocet', popis: 'obráceně: 10 000 Kč, září 2026 → leden 2005', vstup: { castka: 10000, od: '2026-09', do: '2005-01' } },
  { id: 'V3', typ: 'zadání/data', druh: 'prepocet', popis: '100 Kč, září 2025 → září 2026 (porovnání s oficiální meziroční inflací ČSÚ 2,5 %, FD-52)', vstup: { castka: 100, od: '2025-09', do: '2026-09' } },
  { id: 'V4', typ: 'vlastní', druh: 'prepocet', popis: 'stejný měsíc (září 2026 → září 2026)', vstup: { castka: 1000, od: '2026-09', do: '2026-09' } },
  { id: 'V5', typ: 'vlastní', druh: 'prepocet', popis: 'celé období: 1 000 Kč, leden 1995 → září 2026 (380 měsíců)', vstup: { castka: 1000, od: '1995-01', do: '2026-09' } },
  { id: 'V6', typ: 'vlastní', druh: 'prepocet', popis: 'přelom roku: 100 Kč, listopad 2019 → únor 2020 (3 měsíce)', vstup: { castka: 100, od: '2019-11', do: '2020-02' } },
  { id: 'V7', typ: 'vlastní', druh: 'prepocet', popis: 'přestupný únor: 100 Kč, leden 2024 → březen 2024 (2 měsíce; měsíční řada na délce měsíce nezávisí)', vstup: { castka: 100, od: '2024-01', do: '2024-03' } },
  { id: 'V8', typ: 'vlastní', druh: 'prepocet', popis: '1 měsíc beze změny indexu: srpen 2026 → září 2026 (159,2 → 159,2)', vstup: { castka: 100, od: '2026-08', do: '2026-09' } },
  { id: 'V9', typ: 'vlastní', druh: 'prepocet', popis: 'inflační vlna: 1 000 Kč, leden 2022 → leden 2023', vstup: { castka: 1000, od: '2022-01', do: '2023-01' } },
  { id: 'V10', typ: 'vlastní', druh: 'prepocet', popis: 'nula: 0 Kč, leden 2005 → září 2026', vstup: { castka: 0, od: '2005-01', do: '2026-09' } },
  { id: 'V11', typ: 'vlastní', druh: 'prepocet', popis: 'velká částka 1 000 000 000 Kč, leden 1995 → září 2026', vstup: { castka: 1e9, od: '1995-01', do: '2026-09' } },
  { id: 'V12', typ: 'vlastní', druh: 'prepocet', popis: 'haléře: 99,99 Kč, prosinec 2025 → září 2026', vstup: { castka: 99.99, od: '2025-12', do: '2026-09' } },
  // Reálný výnos
  { id: 'R1', typ: 'vlastní', druh: 'vynos', popis: 'výchozí stav: 4 % p.a., září 2021 → září 2026 (60 měs.)', vstup: { sazba: 0.04, typ: 'pa', od: '2021-09', do: '2026-09' } },
  { id: 'R2', typ: 'vlastní', druh: 'vynos', popis: '10 % celkem za období, září 2025 → září 2026 (12 měs.)', vstup: { sazba: 0.10, typ: 'total', od: '2025-09', do: '2026-09' } },
  { id: 'R3', typ: 'vlastní', druh: 'vynos', popis: '2 % p.a., leden 2022 → leden 2023 (inflace 17,5 %)', vstup: { sazba: 0.02, typ: 'pa', od: '2022-01', do: '2023-01' } },
  { id: 'R4', typ: 'vlastní', druh: 'vynos', popis: '0 % p.a., září 2025 → září 2026', vstup: { sazba: 0, typ: 'pa', od: '2025-09', do: '2026-09' } },
  { id: 'R5', typ: 'vlastní', druh: 'vynos', popis: 'ztráta −50 % celkem, leden 2025 → leden 2026', vstup: { sazba: -0.5, typ: 'total', od: '2025-01', do: '2026-01' } },
  { id: 'R6', typ: 'vlastní', druh: 'vynos', popis: '6 % p.a., 1 měsíc (srpen 2026 → září 2026)', vstup: { sazba: 0.06, typ: 'pa', od: '2026-08', do: '2026-09' } },
  { id: 'R7', typ: 'vlastní', druh: 'chyba', popis: 'výnos −100 % (nesmysl) → odmítnout', vstup: { sazba: -1 } },
  { id: 'R8', typ: 'vlastní', druh: 'chyba', popis: 'období 0 měsíců (Od = Do) u výnosu → odmítnout', vstup: { od: '2026-09', do: '2026-09' } },
  // Reálná mzda
  { id: 'M1', typ: 'vlastní', druh: 'mzda', popis: 'výchozí stav: 30 000 Kč (září 2016) → 45 000 Kč (září 2026)', vstup: { m0: 30000, m1: 45000, od: '2016-09', do: '2026-09' } },
  { id: 'M2', typ: 'vlastní', druh: 'mzda', popis: '40 000 Kč (září 2025) → 50 000 Kč (září 2026)', vstup: { m0: 40000, m1: 50000, od: '2025-09', do: '2026-09' } },
  { id: 'M3', typ: 'vlastní', druh: 'mzda', popis: 'stejná mzda 30 000 → 30 000 Kč (září 2025 → září 2026)', vstup: { m0: 30000, m1: 30000, od: '2025-09', do: '2026-09' } },
  { id: 'M4', typ: 'vlastní', druh: 'mzda', popis: 'mzda 12 500 Kč (leden 2005) → 45 000 Kč (září 2026)', vstup: { m0: 12500, m1: 45000, od: '2005-01', do: '2026-09' } },
  { id: 'M5', typ: 'vlastní', druh: 'chyba', popis: 'mzda dřív 0 Kč → odmítnout (dělení nulou)', vstup: { m0: 0 } },
  // Měsíc bez dat
  { id: 'D1', typ: 'zadání', druh: 'omez', popis: 'prosinec 2026 (data končí zářím 2026) → poslední dostupný + poznámka', vstup: { mesic: '2026-12' } },
  { id: 'D2', typ: 'vlastní', druh: 'omez', popis: 'říjen 2026 (vyjde 10. 11. 2026) → září 2026 + poznámka', vstup: { mesic: '2026-10' } },
  { id: 'D3', typ: 'vlastní', druh: 'omez', popis: 'červen 1994 (před začátkem) → leden 1995', vstup: { mesic: '1994-06' } },
  { id: 'D4', typ: 'vlastní', druh: 'omez', popis: 'září 2026 (poslední měsíc) beze změny', vstup: { mesic: '2026-09' } },
  // Graf meziroční inflace – správné měsíce
  { id: 'G1', typ: 'zadání', druh: 'meziroc', popis: 'meziročně září 2026 = I(2026-09)/I(2025-09) − 1; ČSÚ 2,5 %', vstup: { mesic: '2026-09' } },
  { id: 'G2', typ: 'vlastní', druh: 'meziroc', popis: 'meziročně leden 2023 = 146,4/124,6 − 1', vstup: { mesic: '2023-01' } },
  { id: 'G3', typ: 'vlastní', druh: 'meziroc', popis: 'meziročně prosinec 1995 → bez dat o rok zpět (null)', vstup: { mesic: '1995-12' } },
  { id: 'G4', typ: 'vlastní', druh: 'meziroc', popis: 'meziročně leden 1996 = 55,1/50,6 − 1 (první měsíc s hodnotou)', vstup: { mesic: '1996-01' } },
  // Zadávání čísel po česku (očekávání: mezera = tisíce, čárka = desetinná)
  { id: 'P1', typ: 'vlastní', druh: 'parse', popis: '„1 500“ → 1 500', vstup: { text: '1 500' } },
  { id: 'P2', typ: 'vlastní', druh: 'parse', popis: '„1500,50“ → 1 500,50', vstup: { text: '1500,50' } },
  { id: 'P3', typ: 'vlastní', druh: 'parse', popis: '„10.000“ (tečka jako tisíce, běžný český zápis) → nejednoznačné; bezpečné je odmítnout nebo číst 10 000', vstup: { text: '10.000' } },
  { id: 'P4', typ: 'vlastní', druh: 'parse', popis: 'prázdné pole → žádný výsledek / výzva', vstup: { text: '' } },
  { id: 'P5', typ: 'vlastní', druh: 'parse', popis: '„-5“ → odmítnout', vstup: { text: '-5' } },
  { id: 'P6', typ: 'vlastní', druh: 'parse', popis: '„abc“ → odmítnout', vstup: { text: 'abc' } },
  { id: 'P7', typ: 'vlastní', druh: 'parse', popis: '„1 500,5“ (nezlomitelná mezera) → 1 500,5', vstup: { text: '1 500,5' } },
];

/** Spočítá případ referenčními vzorci; vrací { vystupy: {klíč: číslo|null|'chyba'}, zobrazeni: text }. */
export function spocitej(c) {
  const v = c.vstup;
  switch (c.druh) {
    case 'prepocet': {
      let iOd = v.iOd, iDo = v.iDo, n = v.n;
      if (v.od) { iOd = idx(omez(v.od).mesic); iDo = idx(omez(v.do).mesic); n = Math.abs(mesicu(omez(v.od).mesic, omez(v.do).mesic)); }
      const vysledek = prepocet(v.castka, iOd, iDo);
      const kum = kumulativni(iOd, iDo);
      // průměrná roční inflace se počítá v chronologickém směru (z dřívějšího do pozdějšího měsíce)
      const chrono = v.od && v.od > v.do ? 1 / (1 + kum) - 1 : kum;
      const prum = n > 0 ? prumernaRocni(1, 1 + chrono, n) : 0;
      return { vystupy: { vysledek, kumulativni: kum, mesicu: n ?? 0, prumRocni: prum }, zobrazeni: `${kc(vysledek)} · ceny ${chrono >= 0 ? 'vzrostly' : 'klesly'} o ${pct(Math.abs(chrono))} (průměrně ${pct(prum)} ročně)` };
    }
    case 'vynos': {
      if (v.nominal !== undefined) { const r = realnyVynos(v.nominal, v.inflace); return { vystupy: { realny: r }, zobrazeni: pct(r, 2, true) }; }
      const od = omez(v.od).mesic, do_ = omez(v.do).mesic;
      const n = mesicu(od, do_);
      const infl = kumulativni(idx(od), idx(do_));
      const nominal = v.typ === 'pa' ? nominalZaObdobi(v.sazba, n) : v.sazba;
      const realny = realnyVynos(nominal, infl);
      const realnyPa = anualizuj(realny, n);
      return { vystupy: { mesicu: n, nominal, inflace: infl, realny, realnyPa }, zobrazeni: v.typ === 'pa' ? `${pct(realnyPa, 2, true)} ročně` : `${pct(realny, 2, true)} za období` };
    }
    case 'mzda': {
      let i0 = v.i0, i1 = v.i1;
      if (v.od) { i0 = idx(omez(v.od).mesic); i1 = idx(omez(v.do).mesic); }
      const zmena = realnaMzda(v.m0, v.m1, i0, i1);
      const potreba = prepocet(v.m0, i0, i1);
      return { vystupy: { realnaZmena: zmena, nominalne: v.m1 / v.m0 - 1, ceny: kumulativni(i0, i1), potrebnaMzda: potreba }, zobrazeni: `${pct(zmena, 2, true)} · stačilo by ${kc(potreba)}` };
    }
    case 'omez': { const o = omez(v.mesic); return { vystupy: { mesic: o.mesic, poznamka: o.pozn }, zobrazeni: `${o.mesic}${o.pozn ? ` (${o.pozn} – u výsledku musí být poznámka)` : ''}` }; }
    case 'meziroc': { const r = meziroc(v.mesic); return { vystupy: { meziroc: r }, zobrazeni: r === null ? '–' : pct(r, 2) }; }
    case 'parse': { const n = ctiCislo(v.text); return { vystupy: { cislo: Number.isNaN(n) ? 'chyba' : n }, zobrazeni: Number.isNaN(n) ? 'odmítnout / výzva' : kc(n) }; }
    case 'chyba': return { vystupy: { stav: 'chyba' }, zobrazeni: 'odmítnout s hláškou' };
    default: throw new Error(c.druh);
  }
}

const f = (x) => (typeof x === 'number' ? new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 6 }).format(x) : String(x));
export const popisVystupu = (o) => Object.entries(o).map(([k, x]) => `${k}=${f(x)}`).join(', ');

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log(`# Referenční výpočet · data ${PRVNI} … ${POSLEDNI} (${MESICE.length} měsíců) · ${new Date().toISOString()}`);
  for (const c of PRIPADY) {
    const r = spocitej(c);
    console.log(`${c.id} [${c.typ}] ${c.popis}\n    vstup: ${JSON.stringify(c.vstup)}\n    výsledek: ${popisVystupu(r.vystupy)}\n    zobrazení: ${r.zobrazeni}`);
  }
}
