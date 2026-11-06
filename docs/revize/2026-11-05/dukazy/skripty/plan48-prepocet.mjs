// Nezávislý referenční přepočet pro revizi Plán48 (5. 11. 2026).
// Napsáno od nuly podle úředních pravidel z rejstříku docs/revize/2026-11-05/pravidla.md
// (DP-01…DP-04, DP-06, DP-07, DP-11…DP-14, DP-17). Kód aplikace zde NENÍ importován.
// Porovnání s modulem aplikace dělá plan48-porovnani.mjs.
//
// Prameny:
//  - § 14 odst. 1, 2, 4 zákona č. 427/2011 Sb. (ZDPS): příspěvek účastníka 500–1 699 Kč → 20 %,
//    1 700 Kč a více → 340 Kč; příspěvek účastníka se zaokrouhluje na celé Kč dolů.
//  - § 13 odst. 1 písm. a) ZDPS: poživatel starobního důchodu nemá nárok.
//  - § 15 odst. 6 a 7 zákona č. 586/1992 Sb. (ZDP, znění od 1. 1. 2027 = beze změny proti 2026):
//    limit 48 000 Kč v úhrnu; u DPS jen část MĚSÍČNÍHO příspěvku nad 1 700 Kč.
//  - § 16 odst. 1 ZDP: sazby 15 % a 23 %.
//  - Návrh 2027 (sněmovní tisk 285): do 30 let 40 %, nezletilí od 100 Kč – jen návrh.

export const PRAVIDLA = {
  2026: {
    pasma: [{ vekOd: 0, vekDo: Infinity, minVklad: 500, sazba: 0.2, maxZaklad: 1700 }],
  },
  navrh2027: {
    pasma: [
      { vekOd: 0, vekDo: 17, minVklad: 100, sazba: 0.4, maxZaklad: 1700 },
      { vekOd: 18, vekDo: 29, minVklad: 500, sazba: 0.4, maxZaklad: 1700 },
      { vekOd: 30, vekDo: Infinity, minVklad: 500, sazba: 0.2, maxZaklad: 1700 },
    ],
  },
};
export const LIMIT_ODPOCTU = 48000; // § 15 odst. 6 ZDP
export const HRANICE_MAX_PRISPEVKU = 1700; // § 14 odst. 2 písm. b) ZDPS
export const SAZBY = { zakladni: 0.15, zvysena: 0.23 }; // § 16 odst. 1 ZDP

const kladne = (x) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : 0);

/** Státní příspěvek za jeden měsíc (bez zaokrouhlení – zákon zaokrouhlení příspěvku státu nestanoví). */
export function prispevekMesic(vkladKc, vek, sada = '2026', { duchodce = false } = {}) {
  if (duchodce) return 0; // § 13 odst. 1 písm. a) ZDPS
  const vklad = Math.floor(kladne(vkladKc)); // § 14 odst. 4 ZDPS – celé Kč dolů
  const p = PRAVIDLA[sada].pasma.find((q) => vek >= q.vekOd && vek <= q.vekDo);
  if (!p || vklad < p.minVklad) return 0;
  return p.sazba * Math.min(vklad, p.maxZaklad);
}

/** Státní příspěvek za rok při stejném měsíčním vkladu. */
export function prispevekRok(vkladKc, vek, sada = '2026', opts) {
  return 12 * prispevekMesic(vkladKc, vek, sada, opts);
}

/**
 * Odpočet podle § 15 odst. 6–7 ZDP.
 * dpsMesice: pole 12 měsíčních příspěvků účastníka na DPS (Kč) – zákon krátí KAŽDÝ měsíc zvlášť.
 * dip, zp: roční úhrn (od první koruny).
 * duchodce: výklad MF – bez státního příspěvku se nekrátí nic (DP-13).
 */
export function odpocetRok({ dpsMesice = [], dip = 0, zp = 0, duchodce = false }) {
  const dpsCast = dpsMesice.reduce((s, m) => s + Math.max(0, kladne(m) - (duchodce ? 0 : HRANICE_MAX_PRISPEVKU)), 0);
  const hruby = dpsCast + kladne(dip) + kladne(zp);
  const vyuzity = Math.min(hruby, LIMIT_ODPOCTU);
  return { dpsCast, hruby, vyuzity, nevyuzity: LIMIT_ODPOCTU - vyuzity };
}

export const uspora = (odpocet, sazba) => odpocet * sazba; // bez zaokrouhlení; daň se zaokrouhluje až v § 16 odst. 2

/**
 * Kolik je potřeba jednorázově poslat v prosinci na DPS, aby se odpočet doplnil do limitu
 * (podle zákona: prosincový příspěvek = pravidelný + mimořádný, krátí se jen o 1 700 Kč).
 * prosinecPravidelny = pravidelný vklad v prosinci po případném navýšení kvůli příspěvku.
 */
export function doplatekDpsDoLimitu({ dpsMesice, dip = 0, zp = 0, duchodce = false }) {
  const o = odpocetRok({ dpsMesice, dip, zp, duchodce });
  if (o.nevyuzity <= 0) return 0;
  const prosinec = kladne(dpsMesice[11]);
  const hranice = duchodce ? 0 : HRANICE_MAX_PRISPEVKU;
  // z prosince se už započítává max(0, prosinec − hranice); mimořádný vklad X se započte celý,
  // pokud prosinec ≥ hranice, jinak se nejdřív "dorovná" zbytek do hranice
  const chybiDoHranice = Math.max(0, hranice - prosinec);
  return o.nevyuzity + chybiDoHranice;
}

/** Měsíční profil: `probehlo` měsíců s vkladem a, zbytek s vkladem b. */
export const profil = (a, probehlo, b = a) => Array.from({ length: 12 }, (_, i) => (i < probehlo ? a : b));
/** n měsíců se stejným vkladem a (pro skládání nepravidelných profilů). */
export const mesice = (a, n) => Array.from({ length: n }, () => a);

// ---------- testovací případy (zadání + vlastní hraniční) ----------
export const PRIPADY = [
  // zadání
  { id: 'Z1', popis: 'zadání: DPS 5 700 Kč/měs', vstup: { dps: 5700 }, ocek: { odpocet: 48000, uspora15: 7200 } },
  { id: 'Z2', popis: 'zadání: DPS 3 000 + ŽP 2 500 Kč/měs', vstup: { dps: 3000, zp: 2500 }, ocek: { odpocet: 45600 } },
  { id: 'Z3', popis: 'zadání: DIP 4 000 Kč/měs', vstup: { dip: 4000 }, ocek: { odpocet: 48000 } },
  { id: 'Z4', popis: 'zadání: DPS 400 Kč/měs → příspěvek 0', vstup: { dps: 400 }, ocek: { prispevekRok: 0 } },
  { id: 'Z5', popis: 'zadání: věk 25, návrh 2027, DPS 1 700', vstup: { vek: 25, dps: 1700, sada: 'navrh2027' }, ocek: { prispevekRok: 8160 } },
  // hranice státního příspěvku 2026
  { id: 'H1', popis: 'DPS 499 Kč', vstup: { dps: 499 } },
  { id: 'H2', popis: 'DPS 500 Kč', vstup: { dps: 500 } },
  { id: 'H3', popis: 'DPS 501 Kč (zaokrouhlení)', vstup: { dps: 501 } },
  { id: 'H4', popis: 'DPS 1 699 Kč', vstup: { dps: 1699 } },
  { id: 'H5', popis: 'DPS 1 700 Kč', vstup: { dps: 1700 } },
  { id: 'H6', popis: 'DPS 1 701 Kč', vstup: { dps: 1701 } },
  { id: 'H7', popis: 'DPS 1 234,5 Kč (haléře)', vstup: { dps: 1234.5 } },
  { id: 'H8', popis: 'DPS 0, DIP 0, ŽP 0', vstup: {} },
  { id: 'H9', popis: 'záporný vklad −500', vstup: { dps: -500 } },
  { id: 'H10', popis: 'nesmyslný vstup "abc"', vstup: { dps: 'abc' } },
  { id: 'H11', popis: 'DPS 1 000 000 Kč/měs', vstup: { dps: 1000000 } },
  // odpočet
  { id: 'O1', popis: 'DPS 2 000 Kč/měs (3 600 nad hranici)', vstup: { dps: 2000 } },
  { id: 'O2', popis: 'DPS 5 700 při 23 %', vstup: { dps: 5700, sazba: 0.23 }, ocek: { uspora23: 11040 } },
  { id: 'O3', popis: 'DIP 40 000 + ŽP 30 000 ročně (strop)', vstup: { dipRocne: 40000, zpRocne: 30000 } },
  { id: 'O4', popis: 'důchodce DPS 1 000 Kč/měs (od první koruny, DP-13)', vstup: { dps: 1000, duchodce: true } },
  { id: 'O5', popis: 'důchodce DPS 1 700 – příspěvek 0', vstup: { dps: 1700, duchodce: true, vek: 66 } },
  { id: 'O6', popis: 'zaměstnavatel 2 000 neovlivní odpočet', vstup: { dps: 3000, zamestnavatel: 2000 } },
  // návrh 2027 – věkové hranice
  { id: 'N1', popis: 'návrh: 17 let, 100 Kč', vstup: { vek: 17, dps: 100, sada: 'navrh2027' } },
  { id: 'N2', popis: 'návrh: 18 let, 100 Kč', vstup: { vek: 18, dps: 100, sada: 'navrh2027' } },
  { id: 'N3', popis: 'návrh: 29 let, 1 700 Kč', vstup: { vek: 29, dps: 1700, sada: 'navrh2027' } },
  { id: 'N4', popis: 'návrh: 30 let, 1 700 Kč', vstup: { vek: 30, dps: 1700, sada: 'navrh2027' } },
  { id: 'N5', popis: 'návrh: 25 let, 3 000 Kč (strop 680)', vstup: { vek: 25, dps: 3000, sada: 'navrh2027' } },
  { id: 'N6', popis: 'návrh: věk prázdný (0) – aplikace bere pásmo 0–17', vstup: { vek: 0, dps: 1700, sada: 'navrh2027' } },
  // nepravidelné vklady – § 15 odst. 7 po měsících
  { id: 'M1', popis: '11 × 1 000 + prosinec 31 000 (mimořádných 30 000)', vstup: { dpsMesice: [...mesice(1000, 11), 31000] } },
  { id: 'M2', popis: '11 × 1 000 + prosinec 30 000 (test aplikace, úhrn 41 000)', vstup: { dpsMesice: [...mesice(1000, 11), 30000] } },
  { id: 'M3', popis: '11 × 0 + prosinec 48 000', vstup: { dpsMesice: [...mesice(0, 11), 48000] } },
  { id: 'M4', popis: '11 × 3 500 + prosinec 3 500 + 26 400 (příklad KB)', vstup: { dpsMesice: [...mesice(3500, 11), 3500 + 26400] } },
  // doporučení "Co udělat do 31. 12." – kolik poslat na DPS do limitu
  { id: 'R1', popis: 'rada: DPS 3 500/měs, 10 měsíců za námi', rada: { dps: 3500, probehlo: 10 } },
  { id: 'R2', popis: 'rada: DPS 1 000/měs, 10 měsíců za námi (navýšit na 1 700 na 2 měsíce)', rada: { dps: 1000, probehlo: 10, navysitNa: 1700 } },
  { id: 'R3', popis: 'rada: DPS 0/měs, 10 měsíců za námi', rada: { dps: 0, probehlo: 10, navysitNa: 1700 } },
  { id: 'R4', popis: 'rada: DPS 1 000/měs, 11 měsíců za námi', rada: { dps: 1000, probehlo: 11, navysitNa: 1700 } },
  { id: 'R5', popis: 'rada: důchodce DPS 1 000/měs, 10 měsíců', rada: { dps: 1000, probehlo: 10, duchodce: true } },
];

export function spocitejPripad(c) {
  const v = c.vstup ?? {};
  const vek = v.vek ?? 40;
  const sada = v.sada ?? '2026';
  const sazba = v.sazba ?? SAZBY.zakladni;
  if (c.rada) {
    const r = c.rada;
    const mesice = profil(r.dps, r.probehlo, r.navysitNa ?? r.dps);
    const o = odpocetRok({ dpsMesice: mesice, duchodce: r.duchodce });
    const doplatekDps = doplatekDpsDoLimitu({ dpsMesice: mesice, duchodce: r.duchodce });
    const pm = prispevekMesic(r.dps, vek, sada, { duchodce: r.duchodce });
    const pmMax = prispevekMesic(r.navysitNa ?? r.dps, vek, sada, { duchodce: r.duchodce });
    return {
      odpocetPoNavyseni: o.vyuzity,
      nevyuzity: o.nevyuzity,
      doplatekDipZp: o.nevyuzity,
      doplatekDps,
      ziskatePrispevek: (12 - r.probehlo) * (pmMax - pm),
      propadlo: r.probehlo * (pmMax - pm),
    };
  }
  const dpsMesice = v.dpsMesice ?? profil(v.dps ?? 0, 12);
  const dip = v.dipRocne ?? 12 * kladne(v.dip);
  const zp = v.zpRocne ?? 12 * kladne(v.zp);
  const o = odpocetRok({ dpsMesice, dip, zp, duchodce: v.duchodce });
  const pm = prispevekMesic(dpsMesice[0], vek, sada, { duchodce: v.duchodce });
  return {
    prispevekMesic: pm,
    prispevekRok: 12 * pm,
    odpocet: o.vyuzity,
    nevyuzity: o.nevyuzity,
    uspora: uspora(o.vyuzity, sazba),
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  for (const c of PRIPADY) console.log(c.id, c.popis, JSON.stringify(spocitejPripad(c)), c.ocek ? `očekáváno ${JSON.stringify(c.ocek)}` : '');
}
