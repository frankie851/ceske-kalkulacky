// Nezávislý referenční výpočet pro revizi aplikace Výpověď 2026 (revize 5. 11. 2026).
// Napsáno OD NULY podle úředních pravidel; kód aplikace tu není ani importovaný.
// Zdroje (ověřeno 5. 11. 2026 na zakonyprolidi.cz, účinná znění):
//   ZP § 51 odst. 1–2 (počátek/konec výpovědní doby, 2 měsíce, 1 měsíc u § 52 písm. f)–h)) – PR-01..PR-04
//   ZP § 52 písm. a)–h) ve znění 120/2025 Sb. (d) = zdravotní nezpůsobilost bez ohledu na příčinu, e) = nejvyšší přípustná expozice) – PR-06
//   ZP § 66 odst. 2 (zrušení ve zkušební době – dnem doručení) – PR-07
//   ZP § 67 odst. 1 písm. a)–c) (1×/2×/3×: < 1 rok / ≥ 1 a < 2 roky / ≥ 2 roky), odst. 3 (12× jen u § 52 písm. e)) – PR-08, PR-10
//   ZP § 271ca odst. 1 (jednorázová náhrada 12× u § 52 písm. d) pro pracovní úraz / nemoc z povolání / její ohrožení) – PR-11
//   ZoZ § 42 odst. 4 (žádost do 3 pracovních dnů po skončení), § 43 (5/8/11 měsíců: do 52 / nad 52 do 57 / nad 57 let, věk ke dni žádosti; § 51a),
//   ZoZ § 50 odst. 3 (80/50/40 %: 2+2+zbytek do 52 let, 3+3+zbytek nad 52 let), odst. 5 (zaokrouhlení nahoru), odst. 6 (strop 0,8 × průměrná mzda) – PR-19..PR-25
//   Sdělení MPSV č. 537/2025 Sb.: průměrná mzda za 1.–3. Q 2025 = 48 171 Kč → strop 0,8 × 48 171 = 38 536,80 → 38 537 Kč – PR-24
//   Sněmovní tisk 300 (návrh, 1. čtení 16./20. 10. 2026): 65/50/45 % bez ohledu na věk, strop 0,6 × průměrná mzda (0,6 × 48 171 = 28 902,60 → 28 903 Kč) – PR-28
//   Zákon č. 245/2000 Sb. § 1–2 (svátky), zákon č. 48/1997 Sb. § 10 odst. 4–5 (oznámení zdravotní pojišťovně do 8 dnů) – PR-17
// Spuštění samostatně: node vypoved-2026-prepocet.mjs  → vypíše referenční výsledky všech případů.

export const PRUMERNA_MZDA_2025 = 48171; // sdělení 537/2025 Sb. (pro žádosti podané v roce 2026)
export const STROP_2026 = Math.round(0.8 * PRUMERNA_MZDA_2025 * 100) / 100; // 38 536,80 Kč (zaokrouhlení výsledné podpory nahoru → 38 537)
export const STROP_NAVRH_2027_ILUSTRACNE = Math.round(0.6 * PRUMERNA_MZDA_2025 * 100) / 100; // 28 902,60 Kč

// ---------- Kalendář (vlastní implementace, bez Date pro měsíční aritmetiku) ----------
export function jePrestupny(r) { return (r % 4 === 0 && r % 100 !== 0) || r % 400 === 0; }
export function dniVMesici(r, m) { return [31, jePrestupny(r) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][m - 1]; }
export function rozloz(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) throw new Error('neplatné datum ' + iso);
  const [r, me, d] = [+m[1], +m[2], +m[3]];
  if (me < 1 || me > 12 || d < 1 || d > dniVMesici(r, me)) throw new Error('neplatné datum ' + iso);
  return { r, m: me, d };
}
export function sloz(r, m, d) { return `${r}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`; }
export function plusDny(iso, n) {
  let { r, m, d } = rozloz(iso);
  while (n > 0) { d++; if (d > dniVMesici(r, m)) { d = 1; m++; if (m > 12) { m = 1; r++; } } n--; }
  while (n < 0) { d--; if (d < 1) { m--; if (m < 1) { m = 12; r--; } d = dniVMesici(r, m); } n++; }
  return sloz(r, m, d);
}
/** Den v týdnu (0 = neděle) – Zellerova kongruence, nezávisle na Date. */
export function denTydne(iso) {
  let { r, m, d } = rozloz(iso);
  if (m < 3) { m += 12; r -= 1; }
  const K = r % 100, J = Math.floor(r / 100);
  const h = (d + Math.floor(13 * (m + 1) / 5) + K + Math.floor(K / 4) + Math.floor(J / 4) + 5 * J) % 7; // 0 = sobota
  return (h + 6) % 7;
}
/** Velikonoční neděle – Gaussův algoritmus; kontrola proti známým datům 2026–2028. */
export function velikonoce(r) {
  const a = r % 19, b = r % 4, c = r % 7, k = Math.floor(r / 100), p = Math.floor((13 + 8 * k) / 25);
  const q = Math.floor(k / 4), M = (15 - p + k - q) % 30, N = (4 + k - q) % 7;
  const d = (19 * a + M) % 30, e = (2 * b + 4 * c + 6 * d + N) % 7;
  let den = 22 + d + e, mes = 3;
  if (den > 31) { den -= 31; mes = 4; }
  if (d === 29 && e === 6) { den = 19; mes = 4; }
  if (d === 28 && e === 6 && (11 * M + 11) % 30 < 19) { den = 18; mes = 4; }
  return sloz(r, mes, den);
}
const ZNAME_VELIKONOCE = { 2026: '2026-04-05', 2027: '2027-03-28', 2028: '2028-04-16' };
for (const [r, v] of Object.entries(ZNAME_VELIKONOCE)) if (velikonoce(+r) !== v) throw new Error('Velikonoce ' + r + ' nesouhlasí');
/** Svátky podle § 1 a § 2 zákona č. 245/2000 Sb. */
export function svatky(r) {
  const vn = velikonoce(r);
  return new Set([`${r}-01-01`, plusDny(vn, -2), plusDny(vn, 1), `${r}-05-01`, `${r}-05-08`, `${r}-07-05`, `${r}-07-06`,
    `${r}-09-28`, `${r}-10-28`, `${r}-11-17`, `${r}-12-24`, `${r}-12-25`, `${r}-12-26`]);
}
export function jePracovni(iso) { const dt = denTydne(iso); return dt !== 0 && dt !== 6 && !svatky(rozloz(iso).r).has(iso); }
export function ntyPracovniDenPo(iso, n) { let d = iso, z = n; while (z > 0) { d = plusDny(d, 1); if (jePracovni(d)) z--; } return d; }

// ---------- Výpovědní doba (ZP § 51) ----------
export const KRATSI_DUVODY = ['f', 'g', 'h']; // § 51 odst. 2 písm. a)
export function delkaVypovedniDoby({ kdo, duvod }) {
  if (kdo === 'zamestnavatel' && KRATSI_DUVODY.includes(duvod)) return 1;
  return 2; // § 51 odst. 2 – nejméně 2 měsíce (zaměstnanec i zaměstnavatel z a)–e))
}
/** Konec: den se stejným číslem o n měsíců později, jinak poslední den měsíce (§ 51 odst. 1). */
export function konecVypovedniDoby(doruceni, mesicu) {
  const { r, m, d } = rozloz(doruceni);
  let mm = m + mesicu, rr = r;
  while (mm > 12) { mm -= 12; rr++; }
  return sloz(rr, mm, Math.min(d, dniVMesici(rr, mm)));
}
export function konecPomeruRef({ doruceni, kdo, duvod, zkusebniDoba, konecDohody }) {
  rozloz(doruceni);
  if (zkusebniDoba) return { konec: doruceni, poznamka: '§ 66 odst. 2: dnem doručení zrušení (není-li uveden pozdější den)' };
  if (kdo === 'dohoda') return { konec: konecDohody, poznamka: 'sjednaný den' };
  if (doruceni < '2025-06-01') return { konec: konecVypovedniDoby(doruceni, delkaVypovedniDoby({ kdo, duvod })), poznamka: 'POZOR: doručení před 1. 6. 2025 – platilo staré pravidlo (běh od 1. dne následujícího měsíce), výsledek podle nového pravidla neplatí' };
  return { konec: konecVypovedniDoby(doruceni, delkaVypovedniDoby({ kdo, duvod })), poznamka: '' };
}

// ---------- Odstupné (ZP § 67) a jednorázová náhrada (§ 271ca) ----------
/**
 * @param pricina u § 52 písm. d): 'uraz' (pracovní úraz, nemoc z povolání, ohrožení nemocí z povolání) nebo 'obecna' (jiný zdravotní důvod)
 * @returns {{odstupne:number, nasobek:number, nahrada271ca:number, titul:string}}
 */
export function odstupneRef({ kdo, duvod, zkusebniDoba = false, delkaLet, prumer, pricina = 'obecna' }) {
  if (!(prumer >= 0) || !Number.isFinite(prumer)) throw new Error('průměrný výdělek musí být nezáporné číslo');
  const nic = (titul) => ({ odstupne: 0, nasobek: 0, nahrada271ca: 0, titul });
  if (zkusebniDoba) return nic('zrušení ve zkušební době – bez odstupného');
  if (kdo === 'zamestnanec') return nic('výpověď zaměstnance – bez odstupného');
  if (kdo !== 'zamestnavatel' && kdo !== 'dohoda') throw new Error('neznámá strana');
  if (['a', 'b', 'c'].includes(duvod)) {
    if (!(delkaLet >= 0)) throw new Error('délka PP musí být nezáporné číslo');
    const nasobek = delkaLet < 1 ? 1 : delkaLet < 2 ? 2 : 3; // § 67 odst. 1 písm. a)–c)
    return { odstupne: nasobek * prumer, nasobek, nahrada271ca: 0, titul: `odstupné § 67 odst. 1 písm. ${['a', 'b', 'c'][nasobek - 1]}) – ${nasobek}×` };
  }
  if (duvod === 'e') return { odstupne: 12 * prumer, nasobek: 12, nahrada271ca: 0, titul: 'odstupné § 67 odst. 3 (nejvyšší přípustná expozice) – 12×' };
  if (duvod === 'd') {
    if (pricina === 'uraz') return { odstupne: 0, nasobek: 0, nahrada271ca: 12 * prumer, titul: 'bez odstupného; jednorázová náhrada § 271ca – 12× průměrného měsíčního výdělku' };
    return nic('§ 52 písm. d) z jiných zdravotních důvodů – bez odstupného i náhrady');
  }
  return nic(`§ 52 písm. ${duvod}) / jiný důvod dohody – bez odstupného`);
}

// ---------- Podpora v nezaměstnanosti (ZoZ § 43, § 50) ----------
export function podpurciDobaRef(vek) {
  // § 43 odst. 1: do 52 let 5 měsíců; nad 52 do 57 let 8; nad 57 let 11. Věk „dosažený ke dni podání žádosti“ (§ 43 odst. 2, § 51a).
  // Hraniční den (přesně 52 / 57 let) zákon výslovně neřeší; ÚP v tabulce uvádí „52–57 let → 8 měsíců“, počítáme tedy 52 → 8, 57 → 11 a označíme jako hraniční.
  if (vek < 52) return { mesice: 5, starsi: false, hranicni: false };
  if (vek < 57) return { mesice: 8, starsi: true, hranicni: vek === 52 };
  return { mesice: 11, starsi: true, hranicni: vek === 57 };
}
export function sazbyRef(vek, mesice, varianta = 'zakon') {
  if (varianta === 'navrh') return Array.from({ length: mesice }, (_, i) => (i < 2 ? 65 : i < 4 ? 50 : 45)); // tisk 300: bez ohledu na věk
  const n = vek < 52 ? 2 : 3; // § 50 odst. 3: 2+2 (do 52 let) / 3+3 (nad 52 let)
  return Array.from({ length: mesice }, (_, i) => (i < n ? 80 : i < 2 * n ? 50 : 40));
}
export function stropProZadost(datumZadosti, varianta = 'zakon') {
  const rok = rozloz(datumZadosti).r;
  if (rok < 2026) throw new Error('žádost před rokem 2026 – jiná pravidla (65/50/45 %, 50/55 let)');
  if (varianta === 'navrh') return { strop: STROP_NAVRH_2027_ILUSTRACNE, predbezne: true, poznamka: 'návrh (tisk 300), 0,6 × průměrná mzda; ilustračně z 48 171 Kč' };
  if (rok === 2026) return { strop: STROP_2026, predbezne: false, poznamka: '0,8 × 48 171 Kč (sdělení 537/2025 Sb.)' };
  return { strop: STROP_2026, predbezne: true, poznamka: `rok ${rok}: průměrná mzda za 1.–3. Q ${rok - 1} nevyhlášena, použit strop 2026 jako předběžný` };
}
export function podporaRef({ vek, cisty, datumZadosti, varianta = 'zakon' }) {
  if (!(Number.isFinite(vek) && vek >= 0)) throw new Error('věk');
  if (!(Number.isFinite(cisty) && cisty >= 0)) throw new Error('čistý výdělek');
  const pd = podpurciDobaRef(vek);
  const { strop, predbezne, poznamka } = stropProZadost(datumZadosti, varianta);
  const mesice = sazbyRef(vek, pd.mesice, varianta).map((pct, i) => {
    const presne = cisty * pct / 100;
    const omezeno = presne > strop;
    const castka = Math.ceil(Math.round((omezeno ? strop : presne) * 100) / 100); // § 50 odst. 5: na celé koruny nahoru
    return { poradi: i + 1, pct, castka, omezeno };
  });
  return { podpurciDoba: pd.mesice, hranicni: pd.hranicni, strop: Math.ceil(strop), predbezne, poznamka, mesice, castky: mesice.map((m) => m.castka), celkem: mesice.reduce((s, m) => s + m.castka, 0) };
}

// ---------- Kontrolní seznam ----------
export function terminyRef(konec) {
  return {
    zapoctovyList: konec, // § 313 ZP: při skončení PP
    dovolena: konec, // § 222 odst. 2 ZP
    uradPrace: ntyPracovniDenPo(konec, 3), // § 42 odst. 4 ZoZ: do 3 pracovních dnů po skončení
    zdravotniPojistovnaOdDnePo: plusDny(konec, 9), // § 10 odst. 4–5 zák. 48/1997: do 8 dnů ode dne, kdy se stal OBZP (den po skončení) → den po + 8
    zdravotniPojistovnaOdKonce: plusDny(konec, 8), // přísnější čtení: 8 dnů od skončení zaměstnání
  };
}

// ---------- Případy ----------
export const PRIPADY = [
  // --- zadání: konec výpovědní doby
  { id: 'Z1', typ: 'zadání', popis: 'doručení 10. 7. 2026, zaměstnanec, 2 měsíce', druh: 'konec', vstup: { doruceni: '2026-07-10', kdo: 'zamestnanec' }, ocekavano: '2026-09-10' },
  { id: 'Z2', typ: 'zadání', popis: 'doručení 31. 12. 2026, § 52 c), 2 měsíce', druh: 'konec', vstup: { doruceni: '2026-12-31', kdo: 'zamestnavatel', duvod: 'c' }, ocekavano: '2027-02-28' },
  { id: 'Z3', typ: 'zadání', popis: '§ 52 g) → 1 měsíc (10. 7. 2026)', druh: 'konec', vstup: { doruceni: '2026-07-10', kdo: 'zamestnavatel', duvod: 'g' }, ocekavano: '2026-08-10' },
  // --- vlastní: konec výpovědní doby
  { id: 'V1', typ: 'vlastní', popis: '31. 1. 2026 + 2 měsíce → 31. 3. 2026', druh: 'konec', vstup: { doruceni: '2026-01-31', kdo: 'zamestnanec' }, ocekavano: '2026-03-31' },
  { id: 'V2', typ: 'vlastní', popis: '31. 1. 2026, § 52 f) → 1 měsíc → 28. 2. 2026', druh: 'konec', vstup: { doruceni: '2026-01-31', kdo: 'zamestnavatel', duvod: 'f' }, ocekavano: '2026-02-28' },
  { id: 'V3', typ: 'vlastní', popis: '31. 12. 2027 + 2 → 29. 2. 2028 (přestupný rok)', druh: 'konec', vstup: { doruceni: '2027-12-31', kdo: 'zamestnavatel', duvod: 'a' }, ocekavano: '2028-02-29' },
  { id: 'V4', typ: 'vlastní', popis: '29. 2. 2028 + 2 → 29. 4. 2028', druh: 'konec', vstup: { doruceni: '2028-02-29', kdo: 'zamestnanec' }, ocekavano: '2028-04-29' },
  { id: 'V5', typ: 'vlastní', popis: '30. 12. 2026 + 2 → 28. 2. 2027 (den bez protějšku)', druh: 'konec', vstup: { doruceni: '2026-12-30', kdo: 'zamestnanec' }, ocekavano: '2027-02-28' },
  { id: 'V6', typ: 'vlastní', popis: '31. 10. 2026, § 52 h) → 30. 11. 2026', druh: 'konec', vstup: { doruceni: '2026-10-31', kdo: 'zamestnavatel', duvod: 'h' }, ocekavano: '2026-11-30' },
  { id: 'V7', typ: 'vlastní', popis: '15. 11. 2026 + 2 → 15. 1. 2027 (přelom roku)', druh: 'konec', vstup: { doruceni: '2026-11-15', kdo: 'zamestnavatel', duvod: 'c' }, ocekavano: '2027-01-15' },
  { id: 'V8', typ: 'vlastní', popis: 'doručení v sobotu 5. 9. 2026 → 5. 11. 2026 (čtvrtek; víkend neposouvá)', druh: 'konec', vstup: { doruceni: '2026-09-05', kdo: 'zamestnanec' }, ocekavano: '2026-11-05' },
  { id: 'V9', typ: 'vlastní', popis: 'konec na svátek 17. 11. 2026 (doručení 17. 9. 2026) – svátek neposouvá', druh: 'konec', vstup: { doruceni: '2026-09-17', kdo: 'zamestnavatel', duvod: 'c' }, ocekavano: '2026-11-17' },
  { id: 'V10', typ: 'vlastní', popis: 'zrušení ve zkušební době 10. 7. 2026 → 10. 7. 2026', druh: 'konec', vstup: { doruceni: '2026-07-10', kdo: 'zamestnavatel', duvod: 'c', zkusebniDoba: true }, ocekavano: '2026-07-10' },
  { id: 'V11', typ: 'vlastní', popis: 'dohoda 10. 7. 2026, sjednán 31. 7. 2026', druh: 'konec', vstup: { doruceni: '2026-07-10', kdo: 'dohoda', duvod: 'c', konecDohody: '2026-07-31' }, ocekavano: '2026-07-31' },
  { id: 'V12', typ: 'vlastní', popis: 'doručení 15. 5. 2025 (před 1. 6. 2025) – staré pravidlo → 31. 7. 2025', druh: 'konec', vstup: { doruceni: '2025-05-15', kdo: 'zamestnanec' }, ocekavano: '2025-07-31 (staré pravidlo; nové by dalo 2025-07-15)' },
  { id: 'V13', typ: 'vlastní', popis: 'neplatné datum 30. 2. 2026', druh: 'konec', vstup: { doruceni: '2026-02-30', kdo: 'zamestnanec' }, ocekavano: 'chyba' },
  // --- zadání: odstupné
  { id: 'Z4', typ: 'zadání', popis: 'PP 1,5 roku, 40 000 Kč, § 52 c)', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 1.5, prumer: 40000 }, ocekavano: 80000 },
  { id: 'Z5', typ: 'zadání', popis: 'výpověď zaměstnance, 5 let, 40 000 Kč', druh: 'odstupne', vstup: { kdo: 'zamestnanec', delkaLet: 5, prumer: 40000 }, ocekavano: 0 },
  // --- vlastní: odstupné
  { id: 'O1', typ: 'vlastní', popis: 'hranice 0,99 roku × 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'a', delkaLet: 0.99, prumer: 30000 }, ocekavano: 30000 },
  { id: 'O2', typ: 'vlastní', popis: 'hranice přesně 1 rok × 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'a', delkaLet: 1, prumer: 30000 }, ocekavano: 60000 },
  { id: 'O3', typ: 'vlastní', popis: 'hranice 1,99 roku × 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'b', delkaLet: 1.99, prumer: 30000 }, ocekavano: 60000 },
  { id: 'O4', typ: 'vlastní', popis: 'hranice přesně 2 roky × 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'b', delkaLet: 2, prumer: 30000 }, ocekavano: 90000 },
  { id: 'O5', typ: 'vlastní', popis: '25 let × 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 25, prumer: 30000 }, ocekavano: 90000 },
  { id: 'O6', typ: 'vlastní', popis: 'délka 0, 30 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 0, prumer: 30000 }, ocekavano: 30000 },
  { id: 'O7', typ: 'vlastní', popis: 'hrubý 0 Kč, 3 roky', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 3, prumer: 0 }, ocekavano: 0 },
  { id: 'O8', typ: 'vlastní', popis: 'hrubý 1 234,50 Kč, 3 roky → 3 703,50', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 3, prumer: 1234.5 }, ocekavano: 3703.5 },
  { id: 'O9', typ: 'vlastní', popis: 'dohoda z důvodu § 52 c), 3 roky, 40 000', druh: 'odstupne', vstup: { kdo: 'dohoda', duvod: 'c', delkaLet: 3, prumer: 40000 }, ocekavano: 120000 },
  { id: 'O10', typ: 'vlastní', popis: 'dohoda bez organizačního důvodu („jiný“)', druh: 'odstupne', vstup: { kdo: 'dohoda', duvod: 'jiny', delkaLet: 3, prumer: 40000 }, ocekavano: 0 },
  { id: 'O11', typ: 'vlastní', popis: '§ 52 d) – obecný zdravotní důvod (NE úraz), 5 let, 40 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'd', pricina: 'obecna', delkaLet: 5, prumer: 40000 }, ocekavano: 0 },
  { id: 'O12', typ: 'vlastní', popis: '§ 52 d) – pracovní úraz / nemoc z povolání, 0,3 roku, 40 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'd', pricina: 'uraz', delkaLet: 0.3, prumer: 40000 }, ocekavano: 'odstupné 0; náhrada § 271ca 480 000' },
  { id: 'O13', typ: 'vlastní', popis: '§ 52 e) – nejvyšší přípustná expozice, 5 let, 40 000', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'e', delkaLet: 5, prumer: 40000 }, ocekavano: 480000 },
  { id: 'O14', typ: 'vlastní', popis: 'dohoda z důvodu § 52 e), 40 000', druh: 'odstupne', vstup: { kdo: 'dohoda', duvod: 'e', delkaLet: 5, prumer: 40000 }, ocekavano: 480000 },
  { id: 'O15', typ: 'vlastní', popis: '§ 52 f), g), h) → 0', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'g', delkaLet: 5, prumer: 40000 }, ocekavano: 0 },
  { id: 'O16', typ: 'vlastní', popis: 'zkušební doba, § 52 c), 0,2 roku', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', zkusebniDoba: true, delkaLet: 0.2, prumer: 40000 }, ocekavano: 0 },
  { id: 'O17', typ: 'vlastní', popis: 'záporný výdělek −1', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: 3, prumer: -1 }, ocekavano: 'chyba' },
  { id: 'O18', typ: 'vlastní', popis: 'záporná délka −1', druh: 'odstupne', vstup: { kdo: 'zamestnavatel', duvod: 'c', delkaLet: -1, prumer: 30000 }, ocekavano: 'chyba' },
  // --- zadání: podpora
  { id: 'Z6', typ: 'zadání', popis: 'věk 40, čistý 30 000, žádost 11. 9. 2026', druh: 'podpora', vstup: { vek: 40, cisty: 30000, datumZadosti: '2026-09-11' }, ocekavano: '24000,24000,15000,15000,12000 = 90000' },
  { id: 'Z7', typ: 'zadání', popis: 'věk 40, čistý 60 000, žádost 2. 3. 2026 (strop)', druh: 'podpora', vstup: { vek: 40, cisty: 60000, datumZadosti: '2026-03-02' }, ocekavano: '38537,38537,30000,30000,24000 = 161074' },
  // --- vlastní: podpora
  { id: 'P1', typ: 'vlastní', popis: 'věk 51, 30 000, 2026 → 5 měsíců', druh: 'podpora', vstup: { vek: 51, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: '5 měsíců, 90000' },
  { id: 'P2', typ: 'vlastní', popis: 'věk přesně 52, 30 000 → 8 měsíců (hraniční)', druh: 'podpora', vstup: { vek: 52, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: '8 měsíců: 24000×3, 15000×3, 12000×2 = 141000 (hraniční výklad)' },
  { id: 'P3', typ: 'vlastní', popis: 'věk 56, 30 000 → 8 měsíců', druh: 'podpora', vstup: { vek: 56, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: '8 měsíců, 141000' },
  { id: 'P4', typ: 'vlastní', popis: 'věk přesně 57, 30 000 → 11 měsíců (hraniční)', druh: 'podpora', vstup: { vek: 57, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: '11 měsíců: 24000×3, 15000×3, 12000×5 = 177000' },
  { id: 'P5', typ: 'vlastní', popis: 'věk 64, 30 000 → 11 měsíců', druh: 'podpora', vstup: { vek: 64, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: '11 měsíců, 177000' },
  { id: 'P6', typ: 'vlastní', popis: 'zaokrouhlení: 30 001 Kč', druh: 'podpora', vstup: { vek: 40, cisty: 30001, datumZadosti: '2026-06-01' }, ocekavano: '24001,24001,15001,15001,12001' },
  { id: 'P7', typ: 'vlastní', popis: 'zaokrouhlení: 12 345,67 Kč', druh: 'podpora', vstup: { vek: 40, cisty: 12345.67, datumZadosti: '2026-06-01' }, ocekavano: '9877,9877,6173,6173,4939' },
  { id: 'P8', typ: 'vlastní', popis: 'hranice stropu: čistý 48 171 Kč (80 % = 38 536,80 → 38 537, ne nad strop)', druh: 'podpora', vstup: { vek: 40, cisty: 48171, datumZadosti: '2026-06-01' }, ocekavano: '38537 (bez označení stropu), 38537, 24086, 24086, 19269' },
  { id: 'P9', typ: 'vlastní', popis: 'hranice stropu: čistý 48 172 Kč (80 % = 38 537,60 → strop)', druh: 'podpora', vstup: { vek: 40, cisty: 48172, datumZadosti: '2026-06-01' }, ocekavano: '38537 (strop), 38537, 24086, 24086, 19269' },
  { id: 'P10', typ: 'vlastní', popis: 'čistý 1 000 000 Kč, věk 60', druh: 'podpora', vstup: { vek: 60, cisty: 1000000, datumZadosti: '2026-06-01' }, ocekavano: '11 × 38537 = 423907' },
  { id: 'P11', typ: 'vlastní', popis: 'čistý 0 Kč', druh: 'podpora', vstup: { vek: 40, cisty: 0, datumZadosti: '2026-06-01' }, ocekavano: '0 (§ 51 ZoZ – násobky průměrné mzdy – aplikace neřeší)' },
  { id: 'P12', typ: 'vlastní', popis: 'žádost 31. 12. 2026 → sada 2026', druh: 'podpora', vstup: { vek: 40, cisty: 30000, datumZadosti: '2026-12-31' }, ocekavano: 'rok 2026, 90000' },
  { id: 'P13', typ: 'vlastní', popis: 'žádost 1. 1. 2027 → platný zákon (strop předběžně) + návrh', druh: 'podpora', vstup: { vek: 40, cisty: 30000, datumZadosti: '2027-01-01' }, ocekavano: 'zákon 24000,24000,15000,15000,12000 = 90000 (předběžně); návrh 19500,19500,15000,15000,13500 = 82500' },
  { id: 'P14', typ: 'vlastní', popis: 'žádost 2027, věk 40, 60 000 → návrh se stropem 28 903', druh: 'podpora', vstup: { vek: 40, cisty: 60000, datumZadosti: '2027-01-15' }, ocekavano: 'návrh 28903×4, 27000 = 142612' },
  { id: 'P15', typ: 'vlastní', popis: 'žádost 2027, věk 55, 30 000 → návrh bez věkového schématu', druh: 'podpora', vstup: { vek: 55, cisty: 30000, datumZadosti: '2027-03-01' }, ocekavano: 'zákon 8 měs. 141000; návrh 19500×2, 15000×2, 13500×4 = 123000' },
  { id: 'P16', typ: 'vlastní', popis: 'žádost 2025 → chyba (jiná pravidla)', druh: 'podpora', vstup: { vek: 40, cisty: 30000, datumZadosti: '2025-12-31' }, ocekavano: 'chyba' },
  { id: 'P17', typ: 'vlastní', popis: 'žádost 2028 → mimo rozsah', druh: 'podpora', vstup: { vek: 40, cisty: 30000, datumZadosti: '2028-03-01' }, ocekavano: 'mimo rozsah, předběžně' },
  { id: 'P18', typ: 'vlastní', popis: 'záporný věk', druh: 'podpora', vstup: { vek: -1, cisty: 30000, datumZadosti: '2026-06-01' }, ocekavano: 'chyba' },
  { id: 'P19', typ: 'vlastní', popis: 'záporný výdělek', druh: 'podpora', vstup: { vek: 40, cisty: -5, datumZadosti: '2026-06-01' }, ocekavano: 'chyba' },
  // --- vlastní: termíny kontrolního seznamu
  { id: 'K1', typ: 'vlastní', popis: 'konec čt 10. 9. 2026 → ÚP do út 15. 9. 2026; ZP do 19. 9. 2026', druh: 'terminy', vstup: { konec: '2026-09-10' }, ocekavano: 'ÚP 2026-09-15, ZP 2026-09-19 (od dne po) / 2026-09-18 (od konce)' },
  { id: 'K2', typ: 'vlastní', popis: 'konec čt 31. 12. 2026 → 1. 1. svátek, víkend → ÚP do st 6. 1. 2027', druh: 'terminy', vstup: { konec: '2026-12-31' }, ocekavano: 'ÚP 2027-01-06' },
  { id: 'K3', typ: 'vlastní', popis: 'konec čt 25. 3. 2027 (Velký pátek 26. 3., Velikonoční pondělí 29. 3.) → ÚP do čt 1. 4. 2027', druh: 'terminy', vstup: { konec: '2027-03-25' }, ocekavano: 'ÚP 2027-04-01' },
  { id: 'K4', typ: 'vlastní', popis: 'konec čt 30. 4. 2026 (1. 5. svátek pá) → ÚP do st 6. 5. 2026', druh: 'terminy', vstup: { konec: '2026-04-30' }, ocekavano: 'ÚP 2026-05-06' },
  { id: 'K5', typ: 'vlastní', popis: 'konec pá 3. 7. 2026 (5. a 6. 7. svátky ne/po) → ÚP do čt 9. 7. 2026', druh: 'terminy', vstup: { konec: '2026-07-03' }, ocekavano: 'ÚP 2026-07-09' },
  { id: 'K6', typ: 'vlastní', popis: 'konec so 4. 4. 2026 (Velikonoční pondělí 6. 4.) → ÚP do čt 9. 4. 2026', druh: 'terminy', vstup: { konec: '2026-04-04' }, ocekavano: 'ÚP 2026-04-09' },
  { id: 'K7', typ: 'vlastní', popis: 'konec po 16. 11. 2026 (17. 11. svátek út) → ÚP do pá 20. 11. 2026', druh: 'terminy', vstup: { konec: '2026-11-16' }, ocekavano: 'ÚP 2026-11-20' },
];

export function spocitejReferenci(p) {
  try {
    switch (p.druh) {
      case 'konec': { const r = konecPomeruRef(p.vstup); return r.konec + (r.poznamka ? ` (${r.poznamka})` : ''); }
      case 'odstupne': { const r = odstupneRef(p.vstup); return r.nahrada271ca ? `odstupné ${r.odstupne}; náhrada § 271ca ${r.nahrada271ca}` : `${r.odstupne} (${r.nasobek}×)`; }
      case 'podpora': {
        const z = podporaRef(p.vstup);
        let s = `${z.podpurciDoba} měs.: ${z.castky.join(',')} = ${z.celkem}${z.predbezne ? ' (strop předběžně)' : ''}${z.hranicni ? ' (hraniční věk)' : ''}`;
        if (rozloz(p.vstup.datumZadosti).r >= 2027) { const n = podporaRef({ ...p.vstup, varianta: 'navrh' }); s += ` | návrh: ${n.castky.join(',')} = ${n.celkem}`; }
        return s;
      }
      case 'terminy': { const t = terminyRef(p.vstup.konec); return `ÚP ${t.uradPrace}, ZP ${t.zdravotniPojistovnaOdDnePo} / ${t.zdravotniPojistovnaOdKonce}`; }
      default: return '?';
    }
  } catch (e) { return 'chyba: ' + e.message; }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(`Referenční výpočet Výpověď 2026 – ${new Date().toISOString()}`);
  console.log(`strop 2026 = 0,8 × ${PRUMERNA_MZDA_2025} = ${STROP_2026} → ${Math.ceil(STROP_2026)} Kč; návrh 0,6 × = ${STROP_NAVRH_2027_ILUSTRACNE} → ${Math.ceil(STROP_NAVRH_2027_ILUSTRACNE)} Kč`);
  for (const p of PRIPADY) console.log(`${p.id.padEnd(4)} ${p.popis.padEnd(70)} → ${spocitejReferenci(p)}`);
}
