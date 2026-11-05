// Nezávislý referenční výpočet pro revizi „Dluhy – exekuce, nebo oddlužení?“ (5. 11. 2026).
// Napsáno od nuly podle úředních předpisů (rejstřík pravidla.md, oblast C, DS-01 až DS-29);
// kód aplikace (dluhy.js) tu není importovaný ani opsaný. Porovnání s modulem dělá
// kalkulator-dluhu-porovnani.mjs, obrazovku kalkulator-dluhu-prohlizec.mjs.
// Spuštění: node kalkulator-dluhu-prepocet.mjs   → vypíše tabulku případů na stdout.
//
// Předpisy (ověřeno 5. 11. 2026 na zakonyprolidi.cz, exekuce.justice.cz, cnb.cz):
//  - NV 595/2006 Sb. (znění od 1. 1. 2026, NV 548/2025 Sb.): § 1 odst. 1 nezabavitelná částka = 85 % součtu
//    ŽM jednotlivce + normativního nájemného (jednočlenná domácnost, obec ≥ 70 000 obyv.) + energetického
//    paušálu (jednočlenná domácnost) na povinného + ¼ na každou vyživovanou osobu; § 2 hranice 1,9násobek
//    součtu; § 3 zaokrouhlení základní částky na celé Kč nahoru; § 4 hodnoty k 1. lednu roku výplaty.
//  - ŽM jednotlivce 4 860 Kč (NV 361/2025 Sb. § 1; k 1. 1. 2026), normativní nájemné 9 430 Kč (sdělení
//    MPSV 526/2025 Sb. písm. a)), energetický paušál 2 300 Kč (zákon 151/2025 Sb. § 32 odst. 2 písm. a)).
//  - OSŘ § 279 odst. 1: zbytek po odečtení nezabavitelné částky se zaokrouhlí dolů na částku dělitelnou
//    třemi v celých Kč; běžné pohledávky 1/3, přednostní 2/3; náhrada plátce mzdy se bere z první třetiny.
//    Odst. 3: zbytek nad hranici (NV § 2) se srazí bez omezení. Odst. 4: při ≥ 4 výkonech rozhodnutí vždy
//    2/3. Odst. 5: neplatí pro poživatele starobního/invalidního 2.–3. st./sirotčího důchodu, nedosahuje-li
//    1/3 zbytku součtu hotových výdajů a odměny správce v oddlužení zvýšených o DPH.
//  - Vyhl. 485/2000 Sb. § 4d, § 4e: paušální náhrada plátce mzdy 50 Kč/měsíc, nejvýše třetina sražené
//    částky zaokrouhlená nahoru (OSŘ § 270 odst. 2).
//  - Vyhl. 313/2007 Sb. § 3 odst. 2 písm. a) 750 Kč/měsíc po schválení oddlužení, § 7 odst. 4 150 Kč/měsíc;
//    DPH 21 % (zákon 235/2004 Sb. § 47) → 1 089 Kč.
//  - IZ § 398 odst. 3 splátka v oddlužení = rozsah pro přednostní pohledávky; § 395 odst. 1 písm. b)
//    minimum = odměna správce + stejná částka věřitelům; § 395 odst. 3 zamítnutí při osvobození v posledních
//    12 letech; § 412a odst. 1 písm. b) 3 roky, odst. 3 5 let při osvobození v posledních 20 letech.
//  - NV 351/2013 Sb. § 2 odst. 1: úrok z prodlení = repo sazba ČNB k 1. dni pololetí, v němž došlo
//    k prodlení, + 8 p. b. Repo (cnb.cz, vyvoj_repo_historie.txt): 3,50 % od 9. 5. 2025, 3,75 % od 19. 6. 2026.

export const P2026 = {
  rok: 2026,
  zivotniMinimum: 4860,
  normativniNajemne: 9430,
  energetickyPausal: 2300,
  procento: 85,
  podilNaOsobu: 1 / 4,
  hraniceNasobek: 1.9,
  nahradaPlatceKc: 50,
  spravceOdmena: 750,
  spravceVydaje: 150,
  dphProcent: 21,
  delkaMesicu: 36,
  delkaOpakMesicu: 60,
  zakazLet: 12,
  opakovaniLet: 20,
  minExekuciProDveTretiny: 4,
};

// Historie 2T repo sazby ČNB (soubor vyvoj_repo_historie.txt, staženo 5. 11. 2026) – od 2022 pro příklady.
export const REPO = [
  ['2021-12-23', 3.75], ['2022-02-04', 4.5], ['2022-04-01', 5.0], ['2022-05-06', 5.75], ['2022-06-23', 7.0],
  ['2023-12-22', 6.75], ['2024-02-09', 6.25], ['2024-03-21', 5.75], ['2024-05-03', 5.25], ['2024-06-28', 4.75],
  ['2024-08-02', 4.5], ['2024-09-26', 4.25], ['2024-11-08', 4.0], ['2025-02-07', 3.75], ['2025-05-09', 3.5],
  ['2026-06-19', 3.75],
];

/** Repo sazba platná k danému dni (ISO). */
export function repoKeDni(iso) {
  let r = null;
  for (const [od, sazba] of REPO) if (od <= iso) r = sazba;
  return r;
}

/** Zákonný úrok z prodlení pro prodlení vzniklé v den `iso` (NV 351/2013 § 2 odst. 1). */
export function urokZProdleni(iso) {
  const rok = iso.slice(0, 4);
  const prvniDenPololeti = iso.slice(5, 7) <= '06' ? `${rok}-01-01` : `${rok}-07-01`;
  const repo = repoKeDni(prvniDenPololeti);
  return repo === null ? null : Math.round((repo + 8) * 100) / 100;
}

export const soucet = (p) => p.zivotniMinimum + p.normativniNajemne + p.energetickyPausal;

/** Nezabavitelná částka: 85 % součtu na povinného + ¼ z toho na každou osobu; úhrn nahoru (NV § 1, § 3). */
export function nezabavitelna(p, osoby = 0) {
  const n = Number.isFinite(osoby) && osoby > 0 ? Math.floor(osoby) : 0;
  const naPovinneho = (soucet(p) * p.procento) / 100; // 14 101,50
  const presne = naPovinneho * (1 + n * p.podilNaOsobu);
  // zaokrouhlení nahoru s ochranou proti chybě desetinných čísel (hodnoty jsou násobky 1/8 Kč)
  return Math.ceil(Math.round(presne * 1000) / 1000);
}

/** Hranice plně zabavitelného zbytku (NV § 2). */
export const hranice = (p) => Math.round(soucet(p) * p.hraniceNasobek * 100) / 100;

/** Odměna + výdaje správce měsíčně s DPH (vyhl. 313/2007 § 3 odst. 2 písm. a), § 7 odst. 4). */
export const spravceMesicne = (p) => Math.round(((p.spravceOdmena + p.spravceVydaje) * (100 + p.dphProcent)) / 100);

const dolu3 = (x) => { const c = Math.floor(x); return c - (c % 3); };

/**
 * Srážka ze mzdy při exekuci.
 * vstup: { mzda, osoby, prednostni, exekuci, duchodce }
 * Vrací dvě varianty části nad hranicí:
 *  - `literal`: zbytek se nejdřív celý zaokrouhlí dolů na dělitelnou třemi (OSŘ § 279 odst. 1 věta první),
 *    a teprve z něj se oddělí část nad hranicí (odst. 3 mluví o „zbytku vypočteném podle odstavce 1 věty první“);
 *  - `praxe`: zaokrouhlí se jen část do hranice, část nad hranicí se vezme z nezaokrouhleného zbytku
 *    (tak počítá úřední kalkulačka exekuce.justice.cz – ověřeno POSTem 5. 11. 2026, mzda 50 001 → 14 885 Kč).
 * Pro mzdy, kde je zbytek dělitelný třemi nebo nepřesahuje hranici, jsou obě varianty totožné.
 */
export function srazka(p, v) {
  const mzdaRaw = Number(v.mzda);
  const mzda = Number.isFinite(mzdaRaw) && mzdaRaw > 0 ? Math.floor(mzdaRaw) : 0; // čistá mzda v celých Kč
  const nc = nezabavitelna(p, v.osoby ?? 0);
  const zbytek = Math.max(0, mzda - nc);
  const h = hranice(p);
  const spravce = spravceMesicne(p);

  // varianta literal
  const zbytek3 = dolu3(zbytek);
  const nadLiteral = Math.max(0, zbytek3 - h);
  const doHraniceLiteral = zbytek3 - nadLiteral; // ≤ h, dělitelné třemi (h = 31 521 je dělitelné třemi)
  // varianta praxe
  const nadPraxe = Math.max(0, zbytek - h);
  const doHranicePraxe = dolu3(Math.min(zbytek, h));

  const tretina = doHranicePraxe / 3; // v obou variantách stejné, dokud je h dělitelné třemi
  const tretinaLiteral = doHraniceLiteral / 3;

  let duvod = null;
  if (v.prednostni) duvod = 'prednostni';
  else if ((v.exekuci ?? 0) >= p.minExekuciProDveTretiny) {
    const vyjimka = Boolean(v.duchodce) && tretina < spravce; // § 279 odst. 5: „nedosahuje-li“
    if (!vyjimka) duvod = 'ctyri-exekuce';
  }
  const nasobek = duvod ? 2 : 1;

  const srazkaPraxe = tretina * nasobek + nadPraxe;
  const srazkaLiteral = tretinaLiteral * nasobek + nadLiteral;
  const nahrada = (s) => (s > 0 ? Math.min(p.nahradaPlatceKc, Math.ceil(s / 3)) : 0);

  return {
    mzda, nezabavitelna: nc, zbytek, hranice: h, tretina, duvod, dveTretiny: duvod !== null,
    doHranice: doHranicePraxe, nadHranici: nadPraxe,
    srazka: srazkaPraxe, zustane: mzda - srazkaPraxe, nahrada: nahrada(srazkaPraxe), vericum: srazkaPraxe - nahrada(srazkaPraxe),
    literal: { zbytek3, doHranice: doHraniceLiteral, nadHranici: nadLiteral, srazka: srazkaLiteral, zustane: mzda - srazkaLiteral, vericum: srazkaLiteral - nahrada(srazkaLiteral) },
  };
}

/**
 * Doba splácení v exekuci: jednoduchý úrok z jistiny (OZ § 1806 – úroky z úroků jen při ujednání),
 * platba jde nejdřív na úrok, pak na jistinu (OZ § 1932). Simulace po měsících + uzavřený vzorec jako kontrola.
 */
export function dobaSplaceni({ dluh, platba, sazbaRok = 0, maxMesicu = 600 }) {
  const D = Number.isFinite(Number(dluh)) && dluh > 0 ? Number(dluh) : 0;
  const P = Number.isFinite(Number(platba)) && platba > 0 ? Number(platba) : 0;
  const r = Math.max(0, Number(sazbaRok) || 0) / 100 / 12;
  if (D === 0) return { stav: 'bez-dluhu', mesicu: 0, uroky: 0, zaplaceno: 0 };
  const urok1 = D * r;
  if (P === 0) return { stav: 'zadna-splatka', urokMesicne: urok1 };
  if (P <= urok1) return { stav: 'urok-vyssi', urokMesicne: urok1, rustZaRok: (urok1 - P) * 12 };
  let j = D, uroky = 0, zaplaceno = 0;
  for (let m = 1; m <= maxMesicu; m++) {
    const u = j * r; uroky += u;
    const naJistinu = Math.min(j, P - u);
    zaplaceno += u + naJistinu; j -= naJistinu;
    if (j <= 1e-9) {
      const vzorec = r > 0 ? Math.ceil(-Math.log(1 - (r * D) / P) / Math.log(1 + r) - 1e-9) : Math.ceil(D / P - 1e-9);
      return { stav: 'ok', mesicu: m, uroky, zaplaceno, vzorec };
    }
  }
  return { stav: 'prilis-dlouho', zbyva: j, uroky };
}

/** Oddlužení splátkovým kalendářem (IZ § 398 odst. 3, § 395, § 412a). odpusteni: 'ne' | '12az20' | 'do12' */
export function oddluzeni(p, v) {
  const s = srazka(p, { mzda: v.mzda, osoby: v.osoby, prednostni: true });
  const dluh = Number.isFinite(Number(v.dluh)) && v.dluh > 0 ? Number(v.dluh) : 0;
  const spravce = spravceMesicne(p);
  const minimum = 2 * spravce; // § 395 odst. 1 písm. b): správce v plné výši + věřitelům aspoň tolik
  const vericum = Math.max(0, s.srazka - spravce);
  const delka = v.odpusteni === '12az20' ? p.delkaOpakMesicu : p.delkaMesicu;
  const mesicu = vericum > 0 && dluh > 0 ? Math.min(delka, Math.ceil(dluh / vericum)) : delka;
  const zaplaceno = Math.min(dluh, vericum * delka);
  return {
    splatka: s.srazka, zustane: s.zustane, nezabavitelna: s.nezabavitelna, spravce, vericum, delka, mesicu,
    zaplaceno, odpusteno: dluh - zaplaceno, mira: dluh > 0 ? zaplaceno / dluh : 1, minimum,
    splnujeMinimum: s.srazka >= minimum, lzePovolit: v.odpusteni !== 'do12',
  };
}

// ---------------------------------------------------------------------------------------------
// Případy: zadání (Z), hraniční (H), doba splácení (D), oddlužení (O), vstupy (V)
const NC0 = nezabavitelna(P2026, 0); // 14 102
const H = hranice(P2026); // 31 521
export const PRIPADY = [
  { id: 'Z1', typ: 'zadání', popis: '23 000 Kč, 0 osob, běžný dluh → srážka 2 966 Kč', s: { mzda: 23000, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'Z2', typ: 'zadání', popis: '50 000 Kč, 0 osob, přednostní → 25 391 Kč', s: { mzda: 50000, osoby: 0, prednostni: true, exekuci: 1 } },
  { id: 'Z3', typ: 'zadání', popis: '50 000 Kč, běžný → 10 507 + 4 377 = 14 884 Kč', s: { mzda: 50000, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'Z4', typ: 'zadání', popis: '2 vyživované osoby → nezabavitelná částka 21 153 Kč', nc: 2 },
  { id: 'Z5', typ: 'zadání', popis: 'mzda pod nezabavitelnou částkou (12 000 Kč) → 0', s: { mzda: 12000, osoby: 0, prednostni: true, exekuci: 5 } },
  { id: 'H1', typ: 'vlastní', popis: 'nezabavitelná částka 0 / 1 / 3 osoby (úřední příklad 24 678)', nc: [0, 1, 3] },
  { id: 'H2', typ: 'vlastní', popis: `mzda přesně na nezabavitelné částce ${NC0} → 0`, s: { mzda: NC0, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'H3', typ: 'vlastní', popis: `mzda ${NC0 + 1} (zbytek 1) → 0; ${NC0 + 3} (zbytek 3) → srážka 1, náhrada 1, věřitelé 0`, s: [{ mzda: NC0 + 1, osoby: 0, prednostni: false, exekuci: 1 }, { mzda: NC0 + 3, osoby: 0, prednostni: false, exekuci: 1 }] },
  { id: 'H4', typ: 'vlastní', popis: `mzda přesně NČ + hranice = ${NC0 + H} → běžný 1/3 = 10 507, nad hranicí 0`, s: { mzda: NC0 + H, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'H5', typ: 'vlastní', popis: `mzda ${NC0 + H + 1} (zbytek 31 522, nedělitelný třemi) – literal 10 507 vs praxe 10 508`, s: { mzda: NC0 + H + 1, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'H6', typ: 'vlastní', popis: '50 001 / 50 002 Kč běžný (zbytek 35 899 / 35 900) – rozdíl variant 1–2 Kč', s: [{ mzda: 50001, osoby: 0, prednostni: false, exekuci: 1 }, { mzda: 50002, osoby: 0, prednostni: false, exekuci: 1 }] },
  { id: 'H7', typ: 'vlastní', popis: '23 000 Kč, 3 exekuce → 1/3; 4 exekuce → 2/3 (5 932)', s: [{ mzda: 23000, osoby: 0, prednostni: false, exekuci: 3 }, { mzda: 23000, osoby: 0, prednostni: false, exekuci: 4 }] },
  { id: 'H8', typ: 'vlastní', popis: 'důchodce, 4 exekuce: 16 502 Kč (třetina 800 < 1 089) → 800; 17 369 Kč (třetina = 1 089) → 2 178; 23 000 → 5 932', s: [{ mzda: 16502, osoby: 0, prednostni: false, exekuci: 4, duchodce: true }, { mzda: 17369, osoby: 0, prednostni: false, exekuci: 4, duchodce: true }, { mzda: 23000, osoby: 0, prednostni: false, exekuci: 4, duchodce: true }] },
  { id: 'H9', typ: 'vlastní', popis: 'přednostní + 4 exekuce + důchodce (16 502) → 2/3 = 1 600 (přednost má odst. 1)', s: { mzda: 16502, osoby: 0, prednostni: true, exekuci: 4, duchodce: true } },
  { id: 'H10', typ: 'vlastní', popis: '23 000 Kč, 2 osoby → zbytek 1 847 → 1 845 → 615 Kč; náhrada 50', s: { mzda: 23000, osoby: 2, prednostni: false, exekuci: 1 } },
  { id: 'H11', typ: 'vlastní', popis: 'náhrada plátce omezená třetinou: srážka 100 Kč (mzda 14 402) → náhrada 34, věřitelé 66', s: { mzda: 14402, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'H12', typ: 'vlastní', popis: 'haléře: 23 000,70 Kč → jako 23 000', s: { mzda: 23000.7, osoby: 0, prednostni: false, exekuci: 1 } },
  { id: 'H13', typ: 'vlastní', popis: 'osoby 15 (max formuláře), mzda 80 000 přednostní', s: { mzda: 80000, osoby: 15, prednostni: true, exekuci: 1 } },
  { id: 'H14', typ: 'vlastní', popis: 'velká mzda 1 000 000 Kč přednostní → 2/3 × 31 521 + zbytek', s: { mzda: 1000000, osoby: 0, prednostni: true, exekuci: 1 } },
  { id: 'V1', typ: 'vlastní', popis: 'nesmyslné vstupy: mzda 0 / −5 000 / NaN / "23 000" (text) / osoby −2 / osoby 2,5', s: [{ mzda: 0, osoby: 0 }, { mzda: -5000, osoby: 0 }, { mzda: NaN, osoby: 0 }, { mzda: '23 000', osoby: 0 }, { mzda: 23000, osoby: -2 }, { mzda: 23000, osoby: 2.5 }] },
  { id: 'D1', typ: 'vlastní', popis: '100 000 Kč / 2 916 Kč měsíčně bez úroku → 35 měsíců', d: { dluh: 100000, platba: 2916 } },
  { id: 'D2', typ: 'vlastní', popis: '100 000 Kč / 2 916 Kč, 11,75 % → vzorec vs simulace', d: { dluh: 100000, platba: 2916, sazbaRok: 11.75 } },
  { id: 'D3', typ: 'vlastní', popis: '100 000 Kč / 2 916 Kč, 15 % (prodlení od 2023) – o kolik déle než při 11,75 %', d: { dluh: 100000, platba: 2916, sazbaRok: 15 } },
  { id: 'D4', typ: 'vlastní', popis: '500 000 Kč / 2 916 Kč, 11,75 % → úrok 4 895,83 > splátka → nesplatitelné', d: { dluh: 500000, platba: 2916, sazbaRok: 11.75 } },
  { id: 'D5', typ: 'vlastní', popis: 'hranice: splátka = úrok prvního měsíce (dluh 297 855,32 × 11,75 %/12 = 2 916,50 → splátka 2 916,50)', d: { dluh: 297855.32, platba: 2916.50, sazbaRok: 11.75 } },
  { id: 'D6', typ: 'vlastní', popis: 'dluh 0; splátka 0; dluh 10 000 000 bez úroku (> 600 měsíců)', d: [{ dluh: 0, platba: 2916 }, { dluh: 50000, platba: 0 }, { dluh: 10000000, platba: 2916 }] },
  { id: 'D7', typ: 'vlastní', popis: 'Z2 na obrazovce: 1 000 000 Kč / 25 341 Kč, 11,75 %', d: { dluh: 1000000, platba: 25341, sazbaRok: 11.75 } },
  { id: 'O1', typ: 'vlastní', popis: 'oddlužení 30 000 Kč, dluh 400 000 → splátka 10 598, správce 1 089, věřitelům 9 509, 36 m', o: { mzda: 30000, osoby: 0, dluh: 400000, odpusteni: 'ne' } },
  { id: 'O2', typ: 'vlastní', popis: 'oddlužení 23 000 Kč, dluh 100 000 (Z1 na obrazovce)', o: { mzda: 23000, osoby: 0, dluh: 100000, odpusteni: 'ne' } },
  { id: 'O3', typ: 'vlastní', popis: 'minimum 2 178: mzda 17 369 (= 2 178 splní), 17 368 (2 176 nesplní)', o: [{ mzda: 17369, osoby: 0, dluh: 300000, odpusteni: 'ne' }, { mzda: 17368, osoby: 0, dluh: 300000, odpusteni: 'ne' }] },
  { id: 'O4', typ: 'vlastní', popis: 'opakované po 12–20 letech: 60 měsíců; do 12 let: nelze povolit', o: [{ mzda: 30000, osoby: 0, dluh: 1000000, odpusteni: '12az20' }, { mzda: 30000, osoby: 0, dluh: 400000, odpusteni: 'do12' }] },
  { id: 'O5', typ: 'vlastní', popis: 'malý dluh 100 000 při 50 000 Kč → 5 měsíců, nic se neodpouští', o: { mzda: 50000, osoby: 0, dluh: 100000, odpusteni: 'ne' } },
  { id: 'O6', typ: 'vlastní', popis: 'mzda pod nezabavitelnou (12 000) → splátka 0, nesplní minimum; dluh 0', o: [{ mzda: 12000, osoby: 0, dluh: 300000, odpusteni: 'ne' }, { mzda: 30000, osoby: 0, dluh: 0, odpusteni: 'ne' }] },
  { id: 'O7', typ: 'vlastní', popis: '30 % není podmínka: 20 000 Kč, dluh 2 000 000 → míra ~ 5 %, přesto 36 m', o: { mzda: 20000, osoby: 0, dluh: 2000000, odpusteni: 'ne' } },
  { id: 'U1', typ: 'vlastní', popis: 'úrok z prodlení podle data vzniku prodlení (1. 1. 2026, 1. 7. 2026, 1. 3. 2023, 1. 9. 2024, 15. 2. 2025)', u: ['2026-01-01', '2026-07-01', '2023-03-01', '2024-09-01', '2025-02-15', '2022-03-01'] },
];

export const kc = (x) => (x === null || x === undefined || Number.isNaN(x) ? '–' : new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(x) + ' Kč');

/** Spočítá všechny případy; vrací pole { id, popis, vysledky: [...] }. */
export function spocitejVse(p = P2026) {
  const out = [];
  for (const c of PRIPADY) {
    const vys = [];
    if (c.nc !== undefined) for (const n of [].concat(c.nc)) vys.push({ vstup: `${n} os.`, nezabavitelna: nezabavitelna(p, n) });
    if (c.s) for (const v of [].concat(c.s)) vys.push({ vstup: v, ...srazka(p, v) });
    if (c.d) for (const v of [].concat(c.d)) vys.push({ vstup: v, ...dobaSplaceni(v) });
    if (c.o) for (const v of [].concat(c.o)) vys.push({ vstup: v, ...oddluzeni(p, v) });
    if (c.u) for (const d of c.u) vys.push({ vstup: d, urok: urokZProdleni(d), repo: repoKeDni(d.slice(5, 7) <= '06' ? `${d.slice(0, 4)}-01-01` : `${d.slice(0, 4)}-07-01`) });
    out.push({ id: c.id, typ: c.typ, popis: c.popis, vysledky: vys });
  }
  return out;
}

if (process.argv[1] && import.meta.url.endsWith(process.argv[1].split('/').pop())) {
  console.log(`Součet ${soucet(P2026)} Kč · na povinného ${kc((soucet(P2026) * 85) / 100)} · ¼ ${kc((soucet(P2026) * 85) / 400)} · hranice ${kc(hranice(P2026))} · správce ${kc(spravceMesicne(P2026))} · minimum oddlužení ${kc(2 * spravceMesicne(P2026))}`);
  for (const c of spocitejVse()) {
    console.log(`\n[${c.id}] ${c.popis}`);
    for (const v of c.vysledky) console.log('  ', JSON.stringify(v));
  }
}
