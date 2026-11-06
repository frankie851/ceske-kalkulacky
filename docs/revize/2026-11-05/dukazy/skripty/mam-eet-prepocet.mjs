// Nezávislý referenční přepočet pro revizi aplikace „Mám EET? + OSVČ 2027“ (frankie851/mam-eet).
// Napsáno od nuly podle úředních pravidel (rejstřík docs/revize/2026-11-05/pravidla.md, oblast A).
// V tomto souboru NENÍ importován ani použit žádný kód aplikace. Spuštění: node mam-eet-prepocet.mjs
//
// Zdroje konstant (ověřeno 5. 11. 2026 na zakonyprolidi.cz, eet.gov.cz, financnisprava.gov.cz):
//  - NV č. 177/2026 Sb. § 1: VVZ 2025 = 48 900 Kč, koeficient 1,0565 → průměrná mzda 2027 = 51 663 Kč
//    (§ 23b odst. 4 zák. 589/1992 Sb. – zaokrouhlení na celé Kč nahoru)                      [DP-30]
//  - zák. 589/1992 Sb. (ZPSZ) znění od 1. 1. 2027: § 5b odst. 1 (55 % základu), § 5b odst. 2 (roční
//    minimum = nejnižší měsíční VZ podle § 14 odst. 5 věty první NEBO DRUHÉ × počet měsíců), § 14 odst. 3
//    písm. a) (1. pásmo = nejnižší měsíční VZ zvýšený o 15 %), písm. b), c) (28 050 / 42 900 Kč),
//    § 14 odst. 5 (35 % PM; 25 % PM v roce zahájení a 2 roky poté; 11 % vedlejší), § 14 odst. 13 a
//    „VZ podle § 5 až 5c se zaokrouhlují nahoru“, § 7 odst. 1 písm. e) 29,2 %, § 7 odst. 3 (pojistné
//    nahoru), § 15a odst. 5 (max. VZ 48 × PM)                                   [DP-60, 62, 64, 66, 67, 69, 71]
//  - zák. 592/1992 Sb. (ZPZP): § 2 (13,5 %, nahoru), § 3a odst. 1 (50 %), odst. 2 (minimum = 12 × 50 % PM),
//    odst. 3 (minimum neplatí pro zaměstnance a státní pojištěnce), odst. 5 (paušál: min. VZ / 319 200 /
//    470 400 Kč), § 8 odst. 2 (záloha = 1/12 VZ × sazba)                                   [DP-61, 65, 66, 67]
//  - zák. 155/1995 Sb. § 10 odst. 2: rozhodná částka 2,4 × (VVZ × koef.), nahoru → 123 991 Kč         [DP-68]
//  - zák. 586/1992 Sb. (ZDP) znění od 1. 1. 2027: § 7 odst. 7 (paušály 80/60/40/30 % se stropy),
//    § 16 (15 % / 23 % nad 36 × PM; základ na celá sta dolů), § 35ba odst. 1 písm. a) 30 840 Kč,
//    § 35c odst. 1 (15 204 / 22 320 / 27 840), odst. 3 (bonus ≥ 100 Kč), odst. 4 (příjem § 6 nebo § 7
//    ≥ 6 × minimální mzda), § 2a odst. 1 a 5 (paušální režim, rozhodné příjmy pásem), § 2b (EET OFF),
//    § 38lk odst. 5, 7, 8 (splatnost 20. den; záloha na daň 100 / 4 963 / 9 320; přirážka 1 400 Kč)
//                                                                     [DP-18, 25, 27, 29, 39, 46–49, 57–59, 63, 70]
//  - sdělení MPSV č. 171/2026 Sb.: minimální mzda 2027 = 24 900 Kč                                    [DP-24]
//  - zák. 280/2009 Sb. (DŘ) § 146 odst. 1 (daň nahoru na celé Kč), § 33 odst. 4 (víkend → další pracovní den)
//  - zák. 180/2026 Sb. (ZoET): § 5, 6 (kontaktní platba), § 11–13 (vynětí), § 36 (účinnost 1. 1. 2027)
//                                                                                           [DP-41–45, 50]

export const KONST = {
  vvz2025: 48900,
  koef: 1.0565,
  pm: Math.ceil(48900 * 1.0565), // 51 662,85 → 51 663
  minMzda: 24900,
  soc: { sazba: 0.292, podil: 0.55, minHlavni: 0.35, minZacinajici: 0.25, minVedlejsi: 0.11, maxNasobek: 48, rozhodnaNasobek: 2.4 },
  zdr: { sazba: 0.135, podil: 0.5, minPodil: 0.5, pausalVZ2: 319200, pausalVZ3: 470400 },
  dan: { sazba: 0.15, vyssi: 0.23, nasobekPM: 36, slevaPoplatnik: 30840, deti: [15204, 22320, 27840], bonusMin: 100, bonusPrijemNasobek: 6 },
  pausaly: { p80: { sazba: 0.8, strop: 1600000 }, p60: { sazba: 0.6, strop: 1200000 }, p40: { sazba: 0.4, strop: 800000 }, p30: { sazba: 0.3, strop: 600000 } },
  pausalniDan: { danZaloha: [100, 4963, 9320], socVZ23: [28050, 42900], prirazka: 1400, maxPrijmy: 2000000 },
  eetOff: { limit: 1000000 },
  terminy: { oznameni: '2027-01-11', prvniZaloha: '2027-01-20', spusteni: '2027-01-01', mojeEet: '2026-12-01' },
};

const nahoru = (x) => Math.ceil(x - 1e-9);
const staDolu = (x) => Math.floor(x / 100 + 1e-9) * 100;

/* ---------- Odvozené parametry roku 2027 ---------- */
export function parametry() {
  const K = KONST;
  const pm = K.pm;
  const minVZMesHlavni = nahoru(pm * K.soc.minHlavni);       // 18 082,05 → 18 083
  const minVZMesZacinajici = nahoru(pm * K.soc.minZacinajici); // 12 915,75 → 12 916
  const minVZMesVedlejsi = nahoru(pm * K.soc.minVedlejsi);    // 5 682,93 → 5 683
  const zdrMinVZRocni = 12 * (pm * K.zdr.minPodil);           // 12 × 25 831,5 = 309 978 (zákon nezaokrouhluje měsíční část)
  const socPausal1VZ = nahoru(minVZMesHlavni * 1.15);         // 20 795,45 → 20 796 (§ 14 odst. 13)
  return {
    pm,
    minVZMesHlavni, minVZMesZacinajici, minVZMesVedlejsi,
    minZalohaHlavni: nahoru(minVZMesHlavni * K.soc.sazba),       // 5 280,24 → 5 281
    minZalohaZacinajici: nahoru(minVZMesZacinajici * K.soc.sazba), // 3 771,47 → 3 772
    minZalohaVedlejsi: nahoru(minVZMesVedlejsi * K.soc.sazba),   // 1 659,44 → 1 660
    socMaxVZ: pm * K.soc.maxNasobek,                             // 2 479 824
    rozhodnaCastka: nahoru(K.soc.rozhodnaNasobek * K.vvz2025 * K.koef), // 123 990,84 → 123 991
    zdrMinVZRocni,
    zdrMinZaloha: nahoru((zdrMinVZRocni / 12) * K.zdr.sazba),   // 3 487,25 → 3 488
    hranice23: pm * K.dan.nasobekPM,                             // 1 859 868
    bonusMinPrijem: K.minMzda * K.dan.bonusPrijemNasobek,        // 149 400
    socPausal1VZ,
  };
}
// Paušální zálohy po pásmech (měsíčně).
export function pausalniZalohy() {
  const p = parametry();
  const K = KONST;
  const b1 = { dan: 100, soc: nahoru(p.socPausal1VZ * K.soc.sazba), zdr: p.zdrMinZaloha };
  const b2 = { dan: 4963, soc: nahoru(28050 * K.soc.sazba), zdr: nahoru((K.zdr.pausalVZ2 / 12) * K.zdr.sazba) };
  const b3 = { dan: 9320, soc: nahoru(42900 * K.soc.sazba), zdr: nahoru((K.zdr.pausalVZ3 / 12) * K.zdr.sazba) };
  for (const b of [b1, b2, b3]) b.celkem = b.dan + b.soc + b.zdr;
  return { band1: b1, band2: b2, band3: b3 };
}

/* ---------- Klasické přiznání ---------- */
export function vydaje({ prijmy, pausal, skutecne }) {
  if (Number.isFinite(skutecne)) return skutecne;
  const f = KONST.pausaly[pausal];
  return Math.min(prijmy * f.sazba, f.strop);
}

export function danZPrijmu({ zaklad, prijmy, deti = 0 }) {
  const K = KONST.dan;
  const p = parametry();
  const zakladZaokr = staDolu(Math.max(0, zaklad));
  const nad = Math.max(0, zakladZaokr - p.hranice23);
  const danHruba = nahoru((zakladZaokr - nad) * K.sazba + nad * K.vyssi);
  const poSleve = Math.max(0, danHruba - K.slevaPoplatnik);
  let zvyhodneni = 0;
  for (let i = 0; i < deti; i++) zvyhodneni += K.deti[Math.min(i, K.deti.length - 1)];
  let dan = poSleve - zvyhodneni;
  let bonus = 0;
  if (dan < 0) {
    bonus = -dan;
    if (bonus < K.bonusMin || prijmy < p.bonusMinPrijem) bonus = 0;
    dan = bonus > 0 ? -bonus : 0;
  }
  return { zakladZaokr, nad, danHruba, poSleve, zvyhodneni, bonus, dan };
}

/** Sociální pojištění za rok. cinnost: 'hlavni' | 'zacinajici' (hlavní, 1.–3. rok) | 'vedlejsi'. */
export function socialni(zaklad, cinnost) {
  const K = KONST.soc;
  const p = parametry();
  if (cinnost === 'vedlejsi' && zaklad < p.rozhodnaCastka) {
    return { ucast: false, min: 0, vz: 0, pojistne: 0 };
  }
  const minMes = cinnost === 'vedlejsi' ? p.minVZMesVedlejsi : cinnost === 'zacinajici' ? p.minVZMesZacinajici : p.minVZMesHlavni;
  const min = 12 * minMes;
  const vz = Math.min(Math.max(nahoru(zaklad * K.podil), min), p.socMaxVZ);
  return { ucast: true, min, vz, pojistne: nahoru(vz * K.sazba) };
}

/** Zdravotní pojištění za rok. minimum: true pro OSVČ hlavní (ne zaměstnanec, ne státní pojištěnec). */
export function zdravotni(zaklad, minimumPlati) {
  const K = KONST.zdr;
  const p = parametry();
  const min = minimumPlati ? p.zdrMinVZRocni : 0;
  const vz = Math.max(nahoru(zaklad * K.podil), min);
  return { min, vz, pojistne: nahoru(vz * K.sazba) };
}

export function priznani(v) {
  const vyd = vydaje(v);
  const zaklad = Math.max(0, v.prijmy - vyd);
  const soc = socialni(zaklad, v.cinnost ?? 'hlavni');
  const zdr = zdravotni(zaklad, (v.cinnost ?? 'hlavni') !== 'vedlejsi');
  const dan = danZPrijmu({ zaklad, prijmy: v.prijmy, deti: v.deti ?? 0 });
  return { vydaje: vyd, zaklad, dan, soc, zdr, rocne: dan.dan + soc.pojistne + zdr.pojistne };
}

/* ---------- Paušální daň a EET OFF ---------- */
/** Rozhodné příjmy pásem podle § 2a odst. 5 ZDP. podil8060 / podil80 = podíl příjmů s 80/60% resp. 80% paušálem (0–1). */
export function limityPasem({ podil8060, podil80 }) {
  return {
    band1: podil80 >= 0.75 ? 2000000 : podil8060 >= 0.75 ? 1500000 : 1000000,
    band2: podil8060 >= 0.75 ? 2000000 : 1500000,
    band3: 2000000,
  };
}

export function pausalniDan(v) {
  const podil80 = v.pausal === 'p80' ? 1 : 0;
  const podil8060 = v.pausal === 'p80' || v.pausal === 'p60' ? 1 : 0;
  const lim = limityPasem({ podil8060: v.podil8060 ?? podil8060, podil80: v.podil80 ?? podil80 });
  const zalohy = pausalniZalohy();
  if (v.platceDph) return { dostupne: false, duvod: 'plátce DPH (§ 2a odst. 1 písm. a) bod 3)' };
  if (v.cinnost === 'vedlejsi' && v.zamestnanec) return { dostupne: false, duvod: 'závislá činnost (§ 2a odst. 1 písm. c)' };
  if (v.prijmy > KONST.pausalniDan.maxPrijmy) return { dostupne: false, duvod: 'příjmy nad 2 000 000 Kč' };
  const pasmo = ['band1', 'band2', 'band3'].find((b) => v.prijmy <= lim[b]);
  if (!pasmo) return { dostupne: false, duvod: 'žádné pásmo' };
  return { dostupne: true, pasmo, limity: lim, mesicne: zalohy[pasmo].celkem, rocne: 12 * zalohy[pasmo].celkem };
}

export function eetOff(v) {
  const pd = pausalniDan(v);
  if (!pd.dostupne) return { dostupne: false, duvod: pd.duvod };
  if (pd.pasmo !== 'band1') return { dostupne: false, duvod: `vychází ${pd.pasmo}, EET OFF jen 1. pásmo (§ 2b odst. 1)` };
  if (v.prijmy > KONST.eetOff.limit) return { dostupne: false, duvod: 'příjmy za předchozí rok nad 1 000 000 Kč (§ 2b odst. 1 písm. a)' };
  if (v.kontaktni === false) return { dostupne: false, duvod: 'bez kontaktních plateb nemá EET OFF smysl' };
  const mesicne = pausalniZalohy().band1.celkem + KONST.pausalniDan.prirazka;
  return { dostupne: true, mesicne, rocne: 12 * mesicne, prirazkaRocne: 12 * KONST.pausalniDan.prirazka };
}

export function porovnani(v) {
  const kl = priznani(v);
  const pd = pausalniDan(v);
  const eo = eetOff(v);
  const kand = [['pausal', pd], ['priznani', { dostupne: true, rocne: kl.rocne }], ['eetOff', eo]].filter(([, x]) => x.dostupne);
  kand.sort((a, b) => a[1].rocne - b[1].rocne);
  return { priznani: kl, pausal: pd, eetOff: eo, nejlevnejsi: kand[0][0] };
}

/* ---------- Průvodce „Mám EET?“ podle ZoET ---------- */
// Způsoby placení: kontaktní (§ 6 odst. 1, 2) vs. na dálku.
const EVIDOVANE = new Set(['cash', 'card', 'qrOnSite', 'vouchers', 'virtual', 'cheque']); // § 5 odst. 1 + § 6
const NEEVIDOVANE = new Set(['invoiceTransfer', 'online', 'cod']); // na dálku; dobírka poštovní službou § 6 odst. 2 věta druhá
const VYJMUTE_OBORY = new Set(['air', 'publicTransport', 'rail', 'postal', 'school', 'gambling', 'energy', 'water',
  'consumerCredit', 'paymentInstitution', 'finance', 'public', 'publicBenefit', 'vending', 'toilets', 'fish']); // § 11–13

export function mamEet(a) {
  if (a.form === 'none') return { verdikt: 'not', duvod: 'nepodniká (§ 7 odst. 1 ZoET – rozhodný příjem jen z podnikání)' };
  const evid = (a.payments ?? []).filter((p) => EVIDOVANE.has(p));
  const nezn = (a.payments ?? []).filter((p) => !EVIDOVANE.has(p) && !NEEVIDOVANE.has(p));
  if (nezn.length) throw new Error(`neznámý způsob platby ${nezn}`);
  if (evid.length === 0) return { verdikt: 'not', duvod: 'žádná kontaktní platba (§ 6)' };
  if (a.sector && VYJMUTE_OBORY.has(a.sector)) return { verdikt: 'not', duvod: `vynětí § 11–13 (${a.sector})` };
  if (a.form === 'osvc' && a.blind === true && a.alone === true) return { verdikt: 'not', duvod: '§ 11 odst. 4 ZoET' };
  let off = { eligible: false };
  if (a.form === 'osvc') {
    if (a.flatTax === 'band1') {
      if (!Number.isFinite(a.income)) off = { eligible: false, code: 'missingIncome' };
      else if (a.income > KONST.eetOff.limit) off = { eligible: false, code: 'overLimit' };
      else off = { eligible: true, surchargeAnnual: 12 * KONST.pausalniDan.prirazka, deadline: KONST.terminy.oznameni };
    } else if (a.flatTax && a.flatTax !== 'none') off = { eligible: false, code: 'wrongBand' };
    else off = { eligible: false, code: 'notFlatTax' };
  } else off = { eligible: false, code: 'notPerson' };
  return { verdikt: off.eligible ? 'off' : 'must', eetOff: off, mojeEet: Number.isFinite(a.units) ? a.units <= 2 : null };
}

export function kalkulackaEetOff({ mojeEet, vlastniRocne }) {
  const prirazka = 12 * KONST.pausalniDan.prirazka;
  const naklady = mojeEet ? 0 : (Number.isFinite(vlastniRocne) && vlastniRocne >= 0 ? vlastniRocne : NaN);
  if (!Number.isFinite(naklady)) return { prirazka, naklady: null, levnejsi: 'neplatný vstup' };
  return { prirazka, naklady, levnejsi: naklady < prirazka ? 'evidence' : naklady > prirazka ? 'off' : 'equal', rozdil: Math.abs(prirazka - naklady) };
}

/* ---------- Testovací případy ---------- */
export const EET_PRIPADY = [
  { id: 'Z1', popis: 'zadání: OSVČ, hotovost, bez paušální daně', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'none', blind: false, units: 1 } },
  { id: 'Z2', popis: 'zadání: jen faktury převodem', a: { form: 'osvc', payments: ['invoiceTransfer'] } },
  { id: 'Z3', popis: 'zadání: e-shop, jen platební brána', a: { form: 'po', payments: ['online'] } },
  { id: 'Z4', popis: 'zadání: kavárna, jen QR u pultu', a: { form: 'po', payments: ['qrOnSite'], sector: 'none', units: 1 } },
  { id: 'Z5', popis: 'zadání: 1. pásmo, příjmy 800 000', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 800000, blind: false, units: 1 } },
  { id: 'Z6', popis: 'zadání: 2. pásmo', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band2', blind: false, units: 1 } },
  { id: 'Z7', popis: 'zadání: 1. pásmo, příjmy 1 200 000', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 1200000, blind: false, units: 1 } },
  { id: 'E1', popis: 'vlastní: 1. pásmo, příjmy přesně 1 000 000', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 1000000, blind: false, units: 1 } },
  { id: 'E2', popis: 'vlastní: 1. pásmo, příjmy 1 000 001', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 1000001, blind: false, units: 1 } },
  { id: 'E3', popis: 'vlastní: 1. pásmo, příjmy 0', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 0, blind: false, units: 1 } },
  { id: 'E4', popis: 'vlastní: PO, hotovost, letecká doprava', a: { form: 'po', payments: ['cash'], sector: 'air' } },
  { id: 'E5', popis: 'vlastní: nevidomý bez zaměstnanců', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'none', blind: true, alone: true } },
  { id: 'E6', popis: 'vlastní: nevidomý se zaměstnanci', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'none', blind: true, alone: false, units: 1 } },
  { id: 'E7', popis: 'vlastní: PO, faktura + hotovost', a: { form: 'po', payments: ['invoiceTransfer', 'cash'], sector: 'none', units: 1 } },
  { id: 'E8', popis: 'vlastní: nepodnikám', a: { form: 'none' } },
  { id: 'E9', popis: 'vlastní: jen dobírka poštou', a: { form: 'osvc', payments: ['cod'] } },
  { id: 'E10', popis: 'vlastní: PO, karta, 3 evidenční jednotky', a: { form: 'po', payments: ['card'], sector: 'none', units: 3 } },
  { id: 'E11', popis: 'vlastní: 1. pásmo, 800 000, nevidomý se zaměstnanci (EET OFF má přednost?)', a: { form: 'osvc', payments: ['cash'], sector: 'none', flatTax: 'band1', income: 800000, blind: true, alone: false, units: 1 } },
];

export const KALK_PRIPADY = [
  { id: 'K1', popis: 'MOJE eet zdarma', v: { mojeEet: true } },
  { id: 'K2', popis: 'vlastní pokladna 20 000', v: { mojeEet: false, vlastniRocne: 20000 } },
  { id: 'K3', popis: 'vlastní pokladna 16 800', v: { mojeEet: false, vlastniRocne: 16800 } },
  { id: 'K4', popis: 'vlastní pokladna NaN („20 000,50“)', v: { mojeEet: false, vlastniRocne: NaN } },
  { id: 'K5', popis: 'vlastní pokladna 0 / prázdné', v: { mojeEet: false, vlastniRocne: 0 } },
  { id: 'K6', popis: 'vlastní pokladna −5 000', v: { mojeEet: false, vlastniRocne: -5000 } },
];

const Z = (x) => ({ prijmy: 800000, pausal: 'p60', skutecne: null, platceDph: false, deti: 0, cinnost: 'hlavni', zamestnanec: false, kontaktni: true, ...x });
export const OSVC_PRIPADY = [
  { id: 'O1', popis: 'zadání: 800 000, 60 % → paušál 1. pásmo, EET OFF', v: Z({}) },
  { id: 'O2', popis: 'zadání: plátce DPH', v: Z({ platceDph: true }) },
  { id: 'O3', popis: 'zadání: 1 200 000, 40 % → 2. pásmo, bez EET OFF', v: Z({ prijmy: 1200000, pausal: 'p40' }) },
  { id: 'O4', popis: 'zadání (E15): základ 200 000 (500 000 − 300 000), 2 děti', v: Z({ prijmy: 500000, skutecne: 300000, deti: 2 }) },
  { id: 'O5', popis: 'vlastní: 1 000 000, 40 % – hranice 1. pásma i EET OFF', v: Z({ prijmy: 1000000, pausal: 'p40' }) },
  { id: 'O6', popis: 'vlastní: 1 000 001, 40 %', v: Z({ prijmy: 1000001, pausal: 'p40' }) },
  { id: 'O7', popis: 'vlastní: 1 500 000, 60 % – 1. pásmo ano, EET OFF ne', v: Z({ prijmy: 1500000 }) },
  { id: 'O8', popis: 'vlastní: 2 000 000, 80 %', v: Z({ prijmy: 2000000, pausal: 'p80' }) },
  { id: 'O9', popis: 'vlastní: 2 000 001, 80 % – nad strop paušálu', v: Z({ prijmy: 2000001, pausal: 'p80' }) },
  { id: 'O10', popis: 'vlastní: 1 600 000, 30 % → 3. pásmo', v: Z({ prijmy: 1600000, pausal: 'p30' }) },
  { id: 'O11', popis: 'vlastní: 5 000 000, 40 % – 23 % sazba, strop výdajů', v: Z({ prijmy: 5000000, pausal: 'p40' }) },
  { id: 'O12', popis: 'vlastní: 6 000 000, 40 % – maximální VZ sociálního', v: Z({ prijmy: 6000000, pausal: 'p40' }) },
  { id: 'O13', popis: 'vlastní: vedlejší (student), 300 000, 60 % – pod rozhodnou částkou', v: Z({ prijmy: 300000, cinnost: 'vedlejsi' }) },
  { id: 'O14', popis: 'vlastní: vedlejší, zisk přesně 123 991 (rozhodná částka – „dosáhl aspoň“)', v: Z({ prijmy: 300000, skutecne: 176009, cinnost: 'vedlejsi' }) },
  { id: 'O15', popis: 'vlastní: vedlejší, zisk 123 992', v: Z({ prijmy: 300000, skutecne: 176008, cinnost: 'vedlejsi' }) },
  { id: 'O16', popis: 'vlastní: vedlejší, zisk 123 990', v: Z({ prijmy: 300000, skutecne: 176010, cinnost: 'vedlejsi' }) },
  { id: 'O17', popis: 'vlastní: vedlejší při zaměstnání, 400 000, 60 %', v: Z({ prijmy: 400000, cinnost: 'vedlejsi', zamestnanec: true }) },
  { id: 'O18', popis: 'vlastní: ZAČÍNAJÍCÍ OSVČ (25 % PM), 800 000, 60 %', v: Z({ cinnost: 'zacinajici' }) },
  { id: 'O19', popis: 'vlastní: začínající OSVČ, 600 000, 60 %, 1 dítě', v: Z({ prijmy: 600000, deti: 1, cinnost: 'zacinajici' }) },
  { id: 'O20', popis: 'vlastní: 149 400, 60 %, 1 dítě – hranice bonusu', v: Z({ prijmy: 149400, deti: 1 }) },
  { id: 'O21', popis: 'vlastní: 149 399, 60 %, 1 dítě – pod hranicí bonusu', v: Z({ prijmy: 149399, deti: 1 }) },
  { id: 'O22', popis: 'vlastní: ztráta (100 000 − 150 000), 1 dítě', v: Z({ prijmy: 100000, skutecne: 150000, deti: 1 }) },
  { id: 'O23', popis: 'vlastní: základ 300 099 – zaokrouhlení na sta', v: Z({ prijmy: 300099, skutecne: 0 }) },
  { id: 'O24', popis: 'vlastní: základ přesně 1 859 868 (hranice 23 %)', v: Z({ prijmy: 1859868, skutecne: 0 }) },
  { id: 'O25', popis: 'vlastní: základ 1 859 968 – 100 Kč nad hranicí', v: Z({ prijmy: 1859968, skutecne: 0 }) },
  { id: 'O26', popis: 'vlastní: 4 děti, 900 000, 60 %', v: Z({ prijmy: 900000, deti: 4 }) },
  { id: 'O27', popis: 'vlastní: bez kontaktních plateb, 800 000', v: Z({ kontaktni: false }) },
  { id: 'O28', popis: 'vlastní: příjmy 1 Kč', v: Z({ prijmy: 1 }) },
  { id: 'O29', popis: 'vlastní: 1 200 000 s 60 % a 40 % napůl (75% podmínka nesplněna) – limit 1. pásma 1 mil.', v: Z({ prijmy: 1200000, pausal: 'p60', podil8060: 0.5, podil80: 0 }) },
];

/* ---------- Výpis ---------- */
const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : new Intl.NumberFormat('cs-CZ').format(n) + ' Kč');

if (import.meta.url === `file://${process.argv[1]}`) {
  const p = parametry();
  const z = pausalniZalohy();
  console.log('Parametry 2027 (vlastní dopočet):');
  console.log(`  PM ${fmt(p.pm)} · min. VZ hlavní ${fmt(p.minVZMesHlavni)} (záloha ${fmt(p.minZalohaHlavni)}) · začínající ${fmt(p.minVZMesZacinajici)} (${fmt(p.minZalohaZacinajici)}) · vedlejší ${fmt(p.minVZMesVedlejsi)} (${fmt(p.minZalohaVedlejsi)})`);
  console.log(`  zdravotní min. VZ ročně ${fmt(p.zdrMinVZRocni)} · záloha ${fmt(p.zdrMinZaloha)} · rozhodná částka ${fmt(p.rozhodnaCastka)} · max VZ ${fmt(p.socMaxVZ)} · hranice 23 % ${fmt(p.hranice23)} · bonus od příjmů ${fmt(p.bonusMinPrijem)}`);
  console.log(`  paušál: 1. pásmo ${fmt(z.band1.celkem)} (${z.band1.dan}+${z.band1.soc}+${z.band1.zdr}, VZ soc. ${p.socPausal1VZ}) · 2. ${fmt(z.band2.celkem)} (${z.band2.dan}+${z.band2.soc}+${z.band2.zdr}) · 3. ${fmt(z.band3.celkem)} (${z.band3.dan}+${z.band3.soc}+${z.band3.zdr})`);
  console.log('\nMám EET?:');
  for (const c of EET_PRIPADY) { const r = mamEet(c.a); console.log(`  ${c.id} ${c.popis}: ${r.verdikt}${r.eetOff?.code ? ' (' + r.eetOff.code + ')' : ''}${r.eetOff?.eligible ? ' přirážka ' + fmt(r.eetOff.surchargeAnnual) : ''}${r.duvod ? ' – ' + r.duvod : ''}`); }
  console.log('\nKalkulačka EET OFF:');
  for (const c of KALK_PRIPADY) console.log(`  ${c.id} ${c.popis}: ${JSON.stringify(kalkulackaEetOff(c.v))}`);
  console.log('\nOSVČ 2027:');
  for (const c of OSVC_PRIPADY) {
    const r = porovnani(c.v);
    console.log(`  ${c.id} ${c.popis}:\n     přiznání ${fmt(r.priznani.rocne)} (daň ${fmt(r.priznani.dan.dan)}, soc ${fmt(r.priznani.soc.pojistne)}, zdr ${fmt(r.priznani.zdr.pojistne)}) · paušál ${r.pausal.dostupne ? r.pausal.pasmo + ' ' + fmt(r.pausal.rocne) : 'ne: ' + r.pausal.duvod} · EET OFF ${r.eetOff.dostupne ? fmt(r.eetOff.rocne) : 'ne: ' + r.eetOff.duvod} → nejlevnější ${r.nejlevnejsi}`);
  }
}
