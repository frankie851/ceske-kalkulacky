// Nezávislý referenční výpočet pro revizi aplikace „Rodičovská pro celou rodinu“ (ROD), 5. 11. 2026.
// Napsáno od nuly podle úředních pravidel z rejstříku docs/revize/2026-11-05/pravidla.md (PR-31 až PR-55)
// a podle textů předpisů na zakonyprolidi.cz (staženo 5. 11. 2026):
//   ZNP = zákon č. 187/2006 Sb.: § 17 odst. 1 (dávka za kalendářní den nahoru na Kč), § 18 odst. 1 a 3 (DVZ, rozhodné
//   období 12 kal. měsíců, zaokrouhlení na 2 des. místa), § 21 odst. 1 písm. b), odst. 2 a 3 (redukce 100/60/30 %,
//   pásma na 2 des. místa, výsledek nahoru na Kč), § 22 odst. 2 (přepočet dávky od 1. ledna podle nových hranic),
//   § 32 odst. 1 písm. e) (otec od 7. týdne), § 33 (28/37, 22/31 týdnů), § 34 odst. 1 (nástup 8.–6. týden před porodem),
//   § 37, § 38c (70 %), § 38a odst. 4, § 38b odst. 1 (otcovská 2 týdny, nástup do 6 týdnů).
//   ZSSP = zákon č. 117/1995 Sb.: § 30 odst. 1 (350 000 / 2násobek, do 3 let), odst. 3 (15 000 Kč; 70 % × 30 × DVZ;
//   vícerčata 2násobek), odst. 6 (nižší zbytek se vyplatí s poslední měsíční částkou), § 30b odst. 1 písm. a), b), d)
//   (měsíc narození, měsíc s PPM a měsíc dovršení 3 let se počítají jako celé), § 30b odst. 3 (při PPM náleží jen rozdíl),
//   § 31 odst. 3 písm. a) (120 hodin); zákon č. 152/2026 Sb. (400 000 / 800 000 Kč pro děti narozené od 1. 1. 2027).
// Kód aplikace zde NENÍ importován ani opisován.

export const HRANICE = {
  2025: { h1: 1552, h2: 2328, h3: 4656 }, // jen pro úplnost (aplikace pokrývá narození od 1. 1. 2026)
  2026: { h1: 1633, h2: 2449, h3: 4897 }, // PR-35, sdělení MPSV č. 397/2025 Sb.
  2027: { h1: 1723, h2: 2584, h3: 5167 }, // PR-36, sdělení MPSV č. 185/2026 Sb.
};
export const RP_PRAVIDLA = [
  { od: '2026-01-01', celkem: 350000, vicercata: 700000 }, // PR-44, PR-47 (ZSSP § 30 odst. 1, 290/2025 Sb.)
  { od: '2027-01-01', celkem: 400000, vicercata: 800000 }, // PR-51 (zákon č. 152/2026 Sb.)
];
export const RP_MIN = 15000;          // PR-46, ZSSP § 30 odst. 3 písm. a)
export const RP_MIN_VICERCATA = 30000; // PR-47, ZSSP § 30 odst. 3 písm. c)
export const SAZBA = 0.7;             // PR-37
export const MZDA_2026 = { sp: 0.071, zp: 0.045, dan: 0.15, dan2: 0.23, hranice: 146901, sleva: 2570 }; // PR-52 až PR-55
export const POSLEDNI_MESIC_RP = 36;  // index měsíce (0 = měsíc narození); měsíc 3. narozenin se počítá celý (§ 30b odst. 1 písm. d))

const DEN = 86400000;
export const iso = (t) => new Date(t).toISOString().slice(0, 10);
export const cas = (s) => { const [y, m, d] = String(s).split('-').map(Number); return Date.UTC(y, m - 1, d); };
export const plusDny = (s, n) => iso(cas(s) + n * DEN);
export const prvniDen = (s, posun = 0) => { const d = new Date(cas(s)); return iso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + posun, 1)); };
export const klicMesice = (s) => String(s).slice(0, 7);
/** Aritmetické zaokrouhlení na 2 desetinná místa (haléře), s ochranou proti chybě float. */
export const na2 = (x) => Math.round(x * 100 + (x >= 0 ? 1e-7 : -1e-7)) / 100;
/** Nahoru na celé koruny (po očištění float šumu na haléře). */
export const nahoruKc = (x) => Math.ceil(na2(x));

// ---------- Nemocenské pojištění ----------

/** Počet kalendářních dnů 12 kalendářních měsíců před měsícem sociální události (ZNP § 18 odst. 3). */
export function dnyRozhodneho(datum) {
  return Math.round((cas(prvniDen(datum, 0)) - cas(prvniDen(datum, -12))) / DEN);
}

/** DVZ = vyměřovací základ za rozhodné období / počet dnů, na 2 desetinná místa (ZNP § 18 odst. 1). */
export function dvz(mesicniPrijem, dny) {
  if (!(Number(mesicniPrijem) > 0) || !(dny > 0)) return 0;
  return na2((Number(mesicniPrijem) * 12) / dny);
}

export function hraniceRoku(rok) {
  const roky = Object.keys(HRANICE).map(Number).sort((a, b) => a - b);
  const pouzity = roky.filter((r) => r <= rok).pop() ?? roky[0];
  return { ...HRANICE[pouzity], rok: pouzity, odhad: pouzity !== rok };
}

/**
 * Redukovaný DVZ pro PPM a otcovskou (ZNP § 21 odst. 1 písm. b), 2, 3):
 * 100 % do 1. hranice, 60 % mezi 1. a 2., 30 % mezi 2. a 3.; každé pásmo na 2 des. místa; součet nahoru na Kč.
 */
export function redukce(d, rok, { zaokrouhlitPasma = true } = {}) {
  if (!(d > 0)) return 0;
  const { h1, h2, h3 } = hraniceRoku(rok);
  let p1 = Math.min(d, h1);
  let p2 = 0.6 * Math.max(0, Math.min(d, h2) - h1);
  let p3 = 0.3 * Math.max(0, Math.min(d, h3) - h2);
  if (zaokrouhlitPasma) { p1 = na2(p1); p2 = na2(p2); p3 = na2(p3); }
  return nahoruKc(p1 + p2 + p3);
}

/** Dávka za kalendářní den = 70 % redukovaného DVZ, nahoru na Kč (ZNP § 17 odst. 1, § 37, § 38c). */
export const denniDavka = (red) => (red > 0 ? nahoruKc(red * SAZBA) : 0);

/**
 * Dávka (PPM nebo otcovská) rozepsaná po kalendářních měsících. Každý den se počítá s redukčními hranicemi
 * roku, do kterého den spadá (ZNP § 22 odst. 2: dávka trvající přes 1. leden se od 1. ledna přepočte).
 */
export function davkaPoMesicich({ prijem, start, dny }) {
  const dnyRO = dnyRozhodneho(start);
  const d = dvz(prijem, dnyRO);
  const mesice = new Map();
  let celkem = 0;
  const sazbyRoku = {};
  for (let i = 0; i < dny; i++) {
    const den = plusDny(start, i);
    const rok = Number(den.slice(0, 4));
    if (!sazbyRoku[rok]) { const red = redukce(d, rok); sazbyRoku[rok] = { red, denni: denniDavka(red), hranice: hraniceRoku(rok) }; }
    const s = sazbyRoku[rok];
    const k = klicMesice(den);
    const m = mesice.get(k) || { dni: 0, castka: 0 };
    m.dni++; m.castka += s.denni;
    mesice.set(k, m);
    celkem += s.denni;
  }
  return { dvz: d, dnyRO, start, konec: plusDny(start, dny - 1), dny, sazbyRoku, mesice, celkem };
}

// ---------- Rodičovský příspěvek ----------

export function pravidlaRp(datumNarozeni) {
  const platna = [...RP_PRAVIDLA].sort((a, b) => (a.od < b.od ? -1 : 1)).filter((p) => p.od <= datumNarozeni).pop();
  return platna || null;
}

/** Měsíční strop (ZSSP § 30 odst. 3): max(15 000; 70 % × 30 × vyšší redukovaný DVZ); vícerčata 2násobek obou. 21 × DVZ je celé číslo, nic se nezaokrouhluje. */
export function stropRp(redDvzRodicu, vicercata = false) {
  const nejvyssi = Math.max(0, ...redDvzRodicu.filter((x) => x > 0));
  const zDvz = Math.floor(na2(SAZBA * 30 * nejvyssi));
  return vicercata ? Math.max(RP_MIN_VICERCATA, 2 * zDvz) : Math.max(RP_MIN, zDvz);
}

/**
 * Čerpání RP po měsících věku dítěte (index 0 = měsíc narození).
 *  - do = poslední měsíc s nárokem (36 = měsíc 3. narozenin, § 30b odst. 1 písm. d)); varianta „zadání“ používá 35
 *  - ppmVMesici(i) = PPM/otcovská-nezávislá částka PPM vyplacená v měsíci i; RP náleží jen ve výši rozdílu (§ 30b odst. 3)
 *  - § 30 odst. 6: je-li zbytek po odečtení aktuální částky nižší než aktuální částka, vyplatí se spolu s ní
 */
export function cerpaniRp({ celkem, vyse, od = 0, do: posledni = POSLEDNI_MESIC_RP, ppmVMesici = () => 0, par30odst6 = true }) {
  let zbyva = celkem;
  const mesice = [];
  let mesicVycerpani = null;
  if (vyse > 0) {
    for (let i = Math.max(0, od); i <= posledni && zbyva > 0; i++) {
      const ppm = ppmVMesici(i);
      const nalezi = ppm > 0 ? Math.max(0, vyse - ppm) : vyse;
      if (nalezi <= 0) continue;
      let castka = Math.min(nalezi, zbyva);
      const poOdpoctu = zbyva - castka;
      if (par30odst6 && poOdpoctu > 0 && poOdpoctu < nalezi) castka += poOdpoctu;
      zbyva -= castka;
      mesice.push({ index: i, castka });
      if (zbyva === 0) mesicVycerpani = i;
    }
  }
  return { mesice, vycerpano: celkem - zbyva, propadne: zbyva, mesicVycerpani, pocetMesicu: mesice.length };
}

// ---------- Orientační čistá mzda (ZDP § 38h; 589/1992 Sb. § 7; 592/1992 Sb. § 2) ----------

export function cistaMzda(hruba, p = MZDA_2026) {
  if (!(hruba > 0)) return 0;
  const sp = nahoruKc(hruba * p.sp);
  const zp = nahoruKc(hruba * p.zp);
  const zaklad = hruba > 100 ? Math.ceil(hruba / 100) * 100 : Math.ceil(hruba);
  const zaloha = nahoruKc(Math.min(zaklad, p.hranice) * p.dan + Math.max(0, zaklad - p.hranice) * p.dan2);
  return Math.round(hruba - sp - zp - Math.max(0, zaloha - p.sleva));
}

// ---------- Referenční plán rodiny (jen dávky; mzdy neporovnávám) ----------

/**
 * @param v { terminPorodu, vicercata, prijemMatka, prijemOtec, narokMatka, narokOtec, kdoPpm ('matka'|'otec'|'nikdo'),
 *            ppmTydnuPred (6–8), otcovska (bool), otcovskaOdDne (0–41), rpVyse (null = navrhnout) }
 */
export function planRef(vstup) {
  const v = { vicercata: false, narokMatka: true, narokOtec: true, kdoPpm: 'matka', ppmTydnuPred: 6, otcovska: false, otcovskaOdDne: 0, rpVyse: null, ...vstup };
  const B = v.terminPorodu;
  const sestinedeli = plusDny(B, 42); // počátek 7. týdne po porodu (ZNP § 32 odst. 1 písm. e))
  const maNarok = { matka: Boolean(v.narokMatka) && Number(v.prijemMatka) > 0, otec: Boolean(v.narokOtec) && Number(v.prijemOtec) > 0 };
  const pozn = [];

  // PPM
  let ppm = null;
  let kdoPpm = v.kdoPpm;
  if (kdoPpm !== 'nikdo' && !maNarok[kdoPpm]) { pozn.push(`${kdoPpm} bez nároku na PPM`); kdoPpm = 'nikdo'; }
  if (kdoPpm === 'matka') {
    const tydnu = Math.min(8, Math.max(6, Number(v.ppmTydnuPred) || 6)); // ZNP § 34 odst. 1 písm. a)
    ppm = { kdo: 'matka', ...davkaPoMesicich({ prijem: v.prijemMatka, start: plusDny(B, -7 * tydnu), dny: 7 * (v.vicercata ? 37 : 28) }) };
  } else if (kdoPpm === 'otec') {
    ppm = { kdo: 'otec', ...davkaPoMesicich({ prijem: v.prijemOtec, start: sestinedeli, dny: 7 * (v.vicercata ? 31 : 22) }) }; // ZNP § 33 písm. c), d)
  }

  // Otcovská (nástup kterýkoli den 0–41 po porodu, ZNP § 38a odst. 4; 14 dní, § 38b odst. 1)
  let otcovska = null;
  if (v.otcovska && maNarok.otec) {
    const odDne = Math.min(41, Math.max(0, Number(v.otcovskaOdDne) || 0));
    otcovska = davkaPoMesicich({ prijem: v.prijemOtec, start: plusDny(B, odDne), dny: 14 });
  }

  // DVZ pro strop RP: „k datu narození“ (ZSSP § 30 odst. 3 písm. b)) → redukce podle hranic roku narození
  const rokB = Number(B.slice(0, 4));
  const redProRp = ['matka', 'otec'].map((kdo) => {
    if (!maNarok[kdo]) return 0;
    const prijem = kdo === 'matka' ? v.prijemMatka : v.prijemOtec;
    const d = ppm && ppm.kdo === kdo ? ppm.dvz : dvz(prijem, dnyRozhodneho(B)); // u příjemce PPM je to DVZ z PPM
    return redukce(d, rokB);
  });
  const strop = stropRp(redProRp, v.vicercata);

  // RP
  const rp = pravidlaRp(B);
  const celkem = v.vicercata ? rp.vicercata : rp.celkem;
  const ppmVMesici = (i) => {
    const k = klicMesice(prvniDen(B, i));
    return ppm && ppm.mesice.has(k) ? ppm.mesice.get(k).castka : 0;
  };
  // první měsíc, kdy by RP při zvolené výši vůbec náležel, se pro návrh výše odvodí od konce PPM (jako „měsíc po PPM“)
  const posledniMesicPpm = ppm ? [...ppm.mesice.keys()].sort().pop() : null;
  const rpOdOrientacne = posledniMesicPpm ? Math.max(0, mesicuMezi(klicMesice(B), posledniMesicPpm) + 1) : 0;
  const navrh = Math.min(strop, Math.ceil(celkem / Math.max(1, POSLEDNI_MESIC_RP - rpOdOrientacne + 1) / 100) * 100);
  let vyse = v.rpVyse == null || v.rpVyse === '' ? navrh : Number(v.rpVyse);
  if (vyse > strop) vyse = strop;
  const cerpani = cerpaniRp({ celkem, vyse, od: 0, ppmVMesici });

  return {
    terminPorodu: B, kdoPpm, ppm, otcovska, redProRp, strop, celkem, navrh, vyse, cerpani, pozn,
    ppmCelkem: ppm ? ppm.celkem : 0, otcovskaCelkem: otcovska ? otcovska.celkem : 0,
    rpPoMesicich: Object.fromEntries(cerpani.mesice.map((m) => [m.index, m.castka])),
  };
}

export function mesicuMezi(klicOd, klicDo) {
  const [y1, m1] = klicOd.split('-').map(Number); const [y2, m2] = klicDo.split('-').map(Number);
  return (y2 - y1) * 12 + (m2 - m1);
}

// ---------- Pomocné: sken rozdílu zaokrouhlení pásem (§ 21 odst. 2) ----------

export function skenPasem(rok, maxPrijem = 300000) {
  const rozdily = [];
  for (let prijem = 1; prijem <= maxPrijem; prijem++) {
    const d = dvz(prijem, 365);
    const a = redukce(d, rok, { zaokrouhlitPasma: true });
    const b = redukce(d, rok, { zaokrouhlitPasma: false });
    if (a !== b) rozdily.push({ prijem, dvz: d, sPasmy: a, bezPasem: b });
  }
  return rozdily;
}

// ---------- Samostatné spuštění: vypíše referenční hodnoty ----------

if (import.meta.url === `file://${process.argv[1]}`) {
  const f = (x) => new Intl.NumberFormat('cs-CZ').format(x);
  console.log('Referenční výpočet (bez kódu aplikace) – ukázka');
  const d = dvz(30000, 365);
  console.log(`30 000 Kč → DVZ ${d.toFixed(2)}, red. 2026 ${redukce(d, 2026)}, denní ${denniDavka(redukce(d, 2026))}`);
  console.log(`DVZ 1 000 → strop ${f(stropRp([1000]))}`);
  const c = cerpaniRp({ celkem: 350000, vyse: 15000 });
  console.log(`15 000/měs. bez DVZ → vyčerpáno ${f(c.vycerpano)} za ${c.pocetMesicu} měsíců, poslední ${f(c.mesice.at(-1).castka)} (§ 30 odst. 6)`);
  const c2 = cerpaniRp({ celkem: 350000, vyse: 8000, od: 6 });
  console.log(`8 000 od 6. měsíce → vyčerpáno ${f(c2.vycerpano)}, propadne ${f(c2.propadne)} (měsíce 6–36)`);
  const sken = skenPasem(2026);
  console.log(`sken pásem 2026: ${sken.length} rozdílů do 300 000 Kč`, sken.slice(0, 5));
}
