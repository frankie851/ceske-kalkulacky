// Nezávislý referenční přepočet pro „Spot, nebo fix?“ (revize 5. 11. 2026).
// Napsáno od nuly podle úředních pravidel z rejstříku docs/revize/2026-11-05/pravidla.md.
// Z aplikace se NIC neimportuje – čtou se jen její datové soubory (ceny OTE, kurzy ČNB, TDD OTE),
// jejichž vzorky rejstřík ověřil proti zdrojům (sekce Datové řady). Tarify a pásma jsou tu opsané
// z úředních zdrojů znovu (CV ERÚ 14/2025, 13/2025, 15/2025, zákon 261/2007 Sb., ceník ČEZ Prodej 1. 6. 2026).
//
// Spuštění:  node spot-nebo-fix-prepocet.mjs [cesta ke klonu]   → vypíše JSON s výsledky
// Porovnání s modulem aplikace dělá spot-nebo-fix-porovnani.mjs.
import fs from 'node:fs';
import path from 'node:path';

export const REPO = process.argv[2] && !process.argv[2].startsWith('-') ? process.argv[2] : '/tmp/revize/repos/spot-nebo-fix';

// ---------------------------------------------------------------------------
// Úřední hodnoty (rejstřík FD-30 … FD-45 + vlastní ověření 5. 11. 2026)
// ---------------------------------------------------------------------------
export const DPH = 0.21;                  // FD-30, § 47 zákona 235/2004 Sb.
export const DAN_ELEKTRINA = 28.30;       // FD-31, zákon 261/2007 Sb. část 47 § 6 odst. 2 (Kč/MWh)
export const SYSTEMOVE_SLUZBY = 164.24;   // FD-32, CV ERÚ 13/2025 bod 3.1.1 (Kč/MWh)
export const NESITOVA_INFRA = 12.87;      // FD-33, CV ERÚ 13/2025 bod 6.2 + NV 392/2015 Sb. (Kč/OM/měsíc)
export const POZE_MWH = 495;              // FD-34, ceník ČEZ / CV 13/2025 (Kč/MWh)
export const POZE_A = 0;                  // FD-34, CV ERÚ 15/2025: 0 Kč/A/měsíc → platba min(…) = 0 Kč

// CV ERÚ 14/2025 (ERV 18/2025), ceny bez DPH: VT, NT [Kč/MWh], jistič [Kč/měsíc] podle pásma.
// Pásma jističe v pořadí: do 3x10 A a do 1x25 A; 3x16; 3x20; 3x25; 3x32; 3x40; 3x50; 3x63.
export const TIERS = ['3x10|1x25', '3x16', '3x20', '3x25', '3x32', '3x40', '3x50', '3x63'];
export const DISTRIBUCE = {
  cez: {
    D02d: { vt: 2078.58, nt: null, jistic: [102, 164, 205, 256, 327, 409, 512, 644] },        // FD-35
    D25d: { vt: 2252.45, nt: 116.50, jistic: [107, 172, 215, 269, 344, 430, 537, 677] },      // FD-37
    D56d: { vt: 754.77, nt: 116.50, jistic: [222, 355, 444, 555, 710, 888, 1110, 1399] },     // FD-37 (ceník ČEZ ř. 3–12)
    D57d: { vt: 754.77, nt: 116.50, jistic: [222, 355, 444, 555, 710, 896, 1289, 1949] },     // FD-36
    D61d: { vt: 3306.67, nt: 116.50, jistic: [89, 143, 179, 224, 286, 358, 447, 563] },       // CV 14/2025 „Sazba D 61d“ (ověřeno 5. 11. 2026 z erv182025.pdf)
  },
  egd: {
    D02d: { vt: 2295.34, nt: null, jistic: [100, 160, 200, 250, 320, 400, 500, 629] },        // FD-35
    D57d: { vt: 749.87, nt: 224.30, jistic: [189, 302, 378, 473, 605, 764, 1098, 1619] },     // FD-36
    D56d: { vt: 749.87, nt: 224.30, jistic: [190, 304, 380, 475, 608, 760, 950, 1196] },      // FD-37
  },
  pre: {
    D02d: { vt: 1516.53, nt: null, jistic: [87, 139, 173, 217, 277, 347, 434, 546] },         // FD-35
    D25d: { vt: 1656.49, nt: 175.20, jistic: [80, 128, 160, 200, 256, 320, 401, 505] },       // FD-37
    D57d: { vt: 421.52, nt: 175.20, jistic: [154, 246, 308, 385, 492, 622, 933, 1433] },      // FD-36
  },
};
export const JISTICE = { '1x25': { tier: 0, A: 25, faze: 1 }, '3x10': { tier: 0, A: 10, faze: 3 }, '3x16': { tier: 1, A: 16, faze: 3 }, '3x20': { tier: 2, A: 20, faze: 3 },
  '3x25': { tier: 3, A: 25, faze: 3 }, '3x32': { tier: 4, A: 32, faze: 3 }, '3x40': { tier: 5, A: 40, faze: 3 }, '3x50': { tier: 6, A: 50, faze: 3 }, '3x63': { tier: 7, A: 63, faze: 3 } };

// Třídy TDD podle přílohy č. 6 vyhlášky č. 408/2015 Sb. (aktuální znění, ověřeno 5. 11. 2026 na zakonyprolidi.cz):
// 4 = D01d, D02d, D61d · 5 = D25d, D26d, D27d · 6 = D35d · 7 = D45d, D57d, D56d.
export const TRIDA_TDD = { D01d: 'TDD4', D02d: 'TDD4', D61d: 'TDD4', D25d: 'TDD5', D26d: 'TDD5', D27d: 'TDD5', D35d: 'TDD6', D45d: 'TDD7', D56d: 'TDD7', D57d: 'TDD7' };

// Dynamický tarif ČEZ Prodej, ceník od 1. 6. 2026 (FD-39; znovu opsáno z PDF 5. 11. 2026). Ceny vč. DPH Kč/MWh.
// Pásmo [od hodiny, do hodiny), lokální čas; „Víkendy a svátky“ platí i ve svátek. Léto = duben–září.
export const DYN_ZAKLAD_S_DPH = 3900;
export const DYN_STALA_S_DPH = 163.35;
const L = 1950, S = 3510, V = 4290, X = 4875; // −50 %, −10 %, +10 %, +25 %
export const DYN_PASMA = {
  leto: {
    pracovni: [[0, 3, S], [3, 5, L], [5, 8, X], [8, 11, V], [11, 14, L], [14, 16, V], [16, 18, S], [18, 20, X], [20, 23, V], [23, 24, S]],
    vikend: [[0, 3, S], [3, 5, L], [5, 11, V], [11, 14, L], [14, 16, V], [16, 18, S], [18, 23, V], [23, 24, S]],
  },
  zima: {
    pracovni: [[0, 3, S], [3, 5, L], [5, 8, X], [8, 11, V], [11, 14, S], [14, 16, V], [16, 18, S], [18, 20, X], [20, 23, V], [23, 24, S]],
    vikend: [[0, 3, S], [3, 5, L], [5, 11, V], [11, 14, S], [14, 16, V], [16, 18, S], [18, 23, V], [23, 24, S]],
  },
};

// ---------------------------------------------------------------------------
// Kalendář (Europe/Prague) – vlastní implementace
// ---------------------------------------------------------------------------
const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Prague', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
export function lokalni(ms) {
  const p = Object.fromEntries(fmt.formatToParts(new Date(ms)).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, hour: +p.hour % 24, minute: +p.minute };
}
export function pulnocUtc(date) {
  const [y, m, d] = date.split('-').map(Number);
  for (const off of [60, 120]) { // SEČ +1 h, SELČ +2 h
    const ms = Date.UTC(y, m - 1, d) - off * 60000;
    const l = lokalni(ms);
    if (l.date === date && l.hour === 0 && l.minute === 0) return ms;
  }
  throw new Error(`půlnoc ${date}`);
}
export const dalsiDen = (date, n = 1) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10); };
export function dny(from, to) { const out = []; for (let d = from; d <= to; d = dalsiDen(d)) out.push(d); return out; }
export const ctvrthodinVDni = (date) => Math.round((pulnocUtc(dalsiDen(date)) - pulnocUtc(date)) / 900000);

/** Velikonoční neděle – Meeus/Jones/Butcher. */
export function velikonoce(y) {
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return `${y}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
/** Zákon č. 245/2000 Sb. § 1 (státní svátky) a § 2 (ostatní svátky) – ověřeno 5. 11. 2026 na zakonyprolidi.cz. */
export function svatky(y) {
  const pevne = ['01-01', '05-08', '07-05', '07-06', '09-28', '10-28', '11-17', '05-01', '12-24', '12-25', '12-26'].map((md) => `${y}-${md}`);
  const vn = velikonoce(y);
  return new Set([...pevne, dalsiDen(vn, -2), dalsiDen(vn, 1)]);
}
const svatkyCache = new Map();
export const jeSvatek = (date) => { const y = +date.slice(0, 4); if (!svatkyCache.has(y)) svatkyCache.set(y, svatky(y)); return svatkyCache.get(y).has(date); };
export const denVTydnu = (date) => { const [y, m, d] = date.split('-').map(Number); return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); }; // 0 = neděle

/** Čtvrthodinová mřížka: { date, month, hour, minute, dow, svatek, volno } – lokální čas se počítá pro každou čtvrthodinu zvlášť. */
export function mrizka(from, to) {
  const out = [];
  for (const date of dny(from, to)) {
    const start = pulnocUtc(date), end = pulnocUtc(dalsiDen(date));
    const dow = denVTydnu(date), sv = jeSvatek(date);
    for (let ms = start; ms < end; ms += 900000) {
      const l = lokalni(ms);
      out.push({ date, month: date.slice(0, 7), hour: l.hour, minute: l.minute, dow, svatek: sv, volno: dow === 0 || dow === 6 || sv });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Data (jen soubory aplikace – vstupní datové řady)
// ---------------------------------------------------------------------------
const readJson = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));
export function nactiData(repo = REPO) {
  const meta = readJson(path.join(repo, 'data/meta.json'));
  const prices = readJson(path.join(repo, 'data/prices.json'));
  const fx = readJson(path.join(repo, 'data/fx.json'));
  const tdd = {};
  for (const f of fs.readdirSync(path.join(repo, 'data/tdd'))) if (/^TDD.*\.json$/.test(f)) tdd[f.replace('.json', '')] = readJson(path.join(repo, 'data/tdd', f)).values;
  return { meta, prices, fx, tdd };
}

// ---------------------------------------------------------------------------
// Výpočet
// ---------------------------------------------------------------------------
export const soucet = (a) => a.reduce((s, v) => s + v, 0);
export function profil(rocniMWh, tddHodnoty) { const s = soucet(tddHodnoty); return tddHodnoty.map((v) => (v / s) * rocniMWh); }

/** Maska NT: 1 = nízký tarif. okna = { pracovni: [[od,do)…], volno: [[od,do)…] } nebo funkce (q) => bool. */
export function maskaNT(grid, okna) {
  if (!okna) return grid.map(() => 0);
  if (typeof okna === 'function') return grid.map((q) => (okna(q) ? 1 : 0));
  return grid.map((q) => ((q.volno ? okna.volno : okna.pracovni).some(([a, b]) => q.hour >= a && q.hour < b) ? 1 : 0));
}
/** D61d podle CV ERÚ 14/2025: NT celoročně od pátku 12.00 do neděle 22.00 (svátky nehrají roli). */
export const oknoD61d = (q) => (q.dow === 5 && q.hour >= 12) || q.dow === 6 || (q.dow === 0 && q.hour < 22);

/** Cena dynamického tarifu vč. DPH pro čtvrthodinu podle ceníku ČEZ. */
export function dynCenaSDph(q) {
  const m = +q.month.slice(5);
  const sez = m >= 4 && m <= 9 ? DYN_PASMA.leto : DYN_PASMA.zima;
  const p = (q.volno ? sez.vikend : sez.pracovni).find(([a, b]) => q.hour >= a && q.hour < b);
  if (!p) throw new Error(`pásmo ${q.date} ${q.hour}`);
  return p[2];
}

/** Posun podílu frac denní spotřeby do k nejlevnějších čtvrthodin dne (podle popisu v patičce/README aplikace). */
export function posun(cons, cena, frac, grid, k = 16) {
  if (!frac) return cons.slice();
  const out = cons.map((v) => v * (1 - frac));
  let i = 0;
  while (i < grid.length) {
    let j = i; while (j < grid.length && grid[j].date === grid[i].date) j++;
    const idx = []; let presun = 0;
    for (let x = i; x < j; x++) { idx.push(x); presun += cons[x] * frac; }
    idx.sort((a, b) => cena[a] - cena[b] || a - b);
    const n = Math.min(k, idx.length);
    for (let t = 0; t < n; t++) out[idx[t]] += presun / n;
    i = j;
  }
  return out;
}

/**
 * Roční náklady tří variant (vč. DPH). Vstupy od uživatele jsou vč. DPH (jako ve formuláři aplikace).
 * @param {object} v { grid, cons, eur[], kurz[], distributor, sazba, jistic, okna, fixSDph, marzeSDph, poplFixSDph, poplSpotSDph, dynZakladSDph, dynStalaSDph, posunPct }
 */
export function naklady(v) {
  const { grid, cons, eur, kurz } = v;
  const dist = DISTRIBUCE[v.distributor][v.sazba];
  const jist = JISTICE[v.jistic];
  const nt = maskaNT(grid, dist.nt == null ? null : v.okna);
  const mesice = [...new Set(grid.map((q) => q.month))].length;
  const net = (x) => x / (1 + DPH);
  const spotKc = eur.map((e, i) => e * kurz[i]);
  const dynKc = grid.map((q) => net(dynCenaSDph(q)));
  const frac = Math.min(30, Math.max(0, v.posunPct || 0)) / 100;
  const consSpot = posun(cons, spotKc, frac, grid);
  const consDyn = posun(cons, dynKc, frac, grid);

  function varianta(c, jednotkova, poplatekSDph) {
    const mwh = soucet(c);
    let energie = 0, regul = 0;
    for (let i = 0; i < c.length; i++) {
      energie += c[i] * jednotkova(i);
      regul += c[i] * ((nt[i] ? dist.nt : dist.vt) + DAN_ELEKTRINA + SYSTEMOVE_SLUZBY);
    }
    const poze = Math.min(mwh * POZE_MWH, POZE_A * jist.A * jist.faze * mesice);
    const stale = mesice * (dist.jistic[jist.tier] + NESITOVA_INFRA + net(poplatekSDph));
    const k = 1 + DPH;
    return { celkem: (energie + regul + poze + stale) * k, energie: energie * k, regulovane: (regul + poze) * k, stale: stale * k, mwh };
  }
  return {
    fix: varianta(cons, () => net(v.fixSDph), v.poplFixSDph),
    spot: varianta(consSpot, (i) => spotKc[i] + net(v.marzeSDph), v.poplSpotSDph),
    dynamic: varianta(consDyn, (i) => dynKc[i] * (v.dynZakladSDph / DYN_ZAKLAD_S_DPH), v.dynStalaSDph),
  };
}

// Okna NT, která používá aplikace (tariffs.json) – zde jen jako PŘEDPOKLAD pro srovnání, protože skutečné HDO není úředně dané.
export const OKNA_APLIKACE = {
  D25d: { pracovni: [[0, 6], [13, 15]], volno: [[0, 6], [13, 15]] },
  D56d: { pracovni: [[0, 8], [9, 17], [18, 24]], volno: [[0, 8], [9, 17], [18, 24]] },
  D57d: { pracovni: [[0, 8], [9, 12], [13, 17], [18, 20], [21, 24]], volno: [[0, 8], [9, 12], [13, 17], [18, 20], [21, 24]] },
  D61d: { pracovni: [[0, 6], [22, 24]], volno: [[0, 24]] },
};

// ---------------------------------------------------------------------------
// Případy
// ---------------------------------------------------------------------------
export function pripady(repo = REPO) {
  const data = nactiData(repo);
  const grid = mrizka(data.meta.from, data.meta.to);
  const dnyData = Object.keys(data.prices.days).sort();
  const eur = dnyData.flatMap((d) => data.prices.days[d]);
  const kurz = grid.map((q) => data.fx.rates[q.date]);
  const out = [];
  const add = (id, typ, popis, vstup, muj, extra = {}) => out.push({ id, typ, popis, vstup, muj, ...extra });

  // --- Příklady ze zadání -------------------------------------------------
  add('Z1', 'zadání', 'fix: 3 MWh × (3 000 + 2 515,08) Kč/MWh, bez stálých plateb', { cons: [1.5, 1.5], cena: 3000, distribuce: 2515.08 },
    { castka: 3 * (3000 + 2515.08) });
  add('Z2', 'zadání', 'spot: 2 × 0,5 MWh, ceny 100 a 0 EUR/MWh, kurz 25 Kč/EUR → silová elektřina bez marže', { cons: [0.5, 0.5], eur: [100, 0], kurz: [25, 25] },
    { castka: 0.5 * 100 * 25 + 0.5 * 0 * 25 });
  add('Z3', 'zadání', 'dynamický tarif: celá spotřeba v pásmu −50 % → polovina základní ceny', { cons: [0.7, 0.3], zaklad: 3900, pct: -50 },
    { castka: 1 * 3900 * 0.5, pomer: 0.5 });
  add('Z4', 'zadání', 'den přechodu na letní čas 92 čtvrthodin, na zimní 100; běžný den 96', { dny: ['2026-03-29', '2026-10-25', '2025-10-26', '2026-06-15', '2027-03-28', '2027-10-31'] },
    { ctvrthodin: [92, 100, 100, 96, 92, 100], mrizkaCelkem: grid.length });
  add('Z5', 'zadání', 'roční součet normalizovaného TDD = 1 (všech 11 tříd) a délka = mřížka', { tridy: Object.keys(data.tdd).sort() },
    { soucty: Object.fromEntries(Object.keys(data.tdd).sort().map((k) => [k, soucet(profil(1, data.tdd[k]))])), delky: Object.fromEntries(Object.keys(data.tdd).sort().map((k) => [k, data.tdd[k].length])), mrizka: grid.length });

  // --- Hlavní případ pro obrazovku: ČEZ D02d 3 MWh, 3×25 A, fix 3 000, marže 400, poplatky 163,35, dyn ČEZ ---
  const V1 = { grid, eur, kurz, distributor: 'cez', sazba: 'D02d', jistic: '3x25', okna: null, fixSDph: 3000, marzeSDph: 400, poplFixSDph: 163.35, poplSpotSDph: 163.35, dynZakladSDph: 3900, dynStalaSDph: 163.35, posunPct: 0 };
  const consV1 = profil(3, data.tdd.TDD4);
  const r1 = naklady({ ...V1, cons: consV1 });
  add('V1', 'vlastní', 'ČEZ Distribuce, D02d, 3 MWh, 3×25 A, fix 3 000 Kč/MWh, marže 400, stálé platby 163,35, dyn. ČEZ 3 900/163,35 (vše vč. DPH), posun 0 %',
    { distributor: 'cez', sazba: 'D02d', mwh: 3, jistic: '3x25', fix: 3000, marze: 400, tdd: 'TDD4' }, r1, { obrazovka: true });
  add('Z6', 'zadání', 'posun 0 % nemění výsledek (V1 s posunem 0 vs. bez parametru)', { jako: 'V1' },
    { shodne: JSON.stringify(naklady({ ...V1, cons: consV1, posunPct: undefined })) === JSON.stringify(r1) });
  const r1s = { 10: naklady({ ...V1, cons: consV1, posunPct: 10 }), 30: naklady({ ...V1, cons: consV1, posunPct: 30 }), 50: naklady({ ...V1, cons: consV1, posunPct: 50 }) };
  add('Z7', 'zadání', 'posun 10/30 % nemění roční spotřebu a nezvyšuje náklady spotu ani dyn.; 50 % se ořízne na 30 %', { jako: 'V1' },
    { mwh10: r1s[10].spot.mwh, mwh30: r1s[30].spot.mwh, spot30: r1s[30].spot.celkem, dyn30: r1s[30].dynamic.celkem, spot10: r1s[10].spot.celkem, spot50rovnoSpot30: r1s[50].spot.celkem === r1s[30].spot.celkem, fix30: r1s[30].fix.celkem });
  add('V1b', 'vlastní', 'V1 s posunem 30 %', { jako: 'V1', posun: 30 }, r1s[30], { obrazovka: true });

  // --- Tepelné čerpadlo: EG.D D56d 9 MWh (výchozí typ „Dům s tepelným čerpadlem“), fix 3 500 ---
  const V2 = { grid, eur, kurz, distributor: 'egd', sazba: 'D56d', jistic: '3x25', okna: OKNA_APLIKACE.D56d, fixSDph: 3500, marzeSDph: 400, poplFixSDph: 163.35, poplSpotSDph: 163.35, dynZakladSDph: 3900, dynStalaSDph: 163.35, posunPct: 0 };
  const r2app = naklady({ ...V2, cons: profil(9, data.tdd.TDD6) }); // profil, který používá aplikace (TDD6)
  const r2law = naklady({ ...V2, cons: profil(9, data.tdd.TDD7) }); // profil podle přílohy 6 vyhl. 408/2015 Sb. (TDD7)
  add('V2', 'vlastní', 'EG.D, D56d, 9 MWh, 3×25 A, fix 3 500, marže 400 – profil TDD6 (jak mapuje aplikace), okna NT = předpoklad aplikace (22 h)',
    { distributor: 'egd', sazba: 'D56d', mwh: 9, jistic: '3x25', fix: 3500, marze: 400, tdd: 'TDD6' }, r2app, { obrazovka: true });
  add('V2z', 'vlastní', 'totéž s profilem TDD7 (třída podle přílohy 6 vyhl. 408/2015 Sb. pro D56d) – rozdíl proti V2',
    { ...{ distributor: 'egd', sazba: 'D56d', mwh: 9, jistic: '3x25', fix: 3500, marze: 400, tdd: 'TDD7' } }, r2law,
    { rozdilProtiV2: { fix: r2law.fix.celkem - r2app.fix.celkem, spot: r2law.spot.celkem - r2app.spot.celkem, dynamic: r2law.dynamic.celkem - r2app.dynamic.celkem,
      spotMinusFixApp: r2app.spot.celkem - r2app.fix.celkem, spotMinusFixLaw: r2law.spot.celkem - r2law.fix.celkem } });
  // ČEZ D57d 9 MWh – stejné srovnání pro přímotop
  const V2c = { ...V2, distributor: 'cez', sazba: 'D57d', okna: OKNA_APLIKACE.D57d };
  const r2c6 = naklady({ ...V2c, cons: profil(9, data.tdd.TDD6) }), r2c7 = naklady({ ...V2c, cons: profil(9, data.tdd.TDD7) });
  add('V2c', 'vlastní', 'ČEZ, D57d, 9 MWh, 3×25 A, fix 3 500 – TDD6 (aplikace) vs. TDD7 (vyhláška)', { distributor: 'cez', sazba: 'D57d', mwh: 9, fix: 3500, tdd: 'TDD6 vs TDD7' }, r2c6,
    { tdd7: r2c7, rozdil: { spot: r2c7.spot.celkem - r2c6.spot.celkem, dynamic: r2c7.dynamic.celkem - r2c6.dynamic.celkem, fix: r2c7.fix.celkem - r2c6.fix.celkem } });

  // --- PRE D25d TDD5-P 2 MWh, 1×25 A ---
  const V3 = { grid, eur, kurz, distributor: 'pre', sazba: 'D25d', jistic: '1x25', okna: OKNA_APLIKACE.D25d, fixSDph: 2900, marzeSDph: 300, poplFixSDph: 100, poplSpotSDph: 120, dynZakladSDph: 3900, dynStalaSDph: 163.35, posunPct: 0 };
  add('V3', 'vlastní', 'PREdistribuce, D25d (TDD5 Praha), 2 MWh, 1×25 A, fix 2 900, marže 300, poplatky 100/120', { distributor: 'pre', sazba: 'D25d', mwh: 2, jistic: '1x25', fix: 2900, marze: 300, tdd: 'TDD5-P' },
    naklady({ ...V3, cons: profil(2, data.tdd['TDD5-P']) }));

  // --- D61d: okno NT podle ERÚ vs. okno aplikace ---
  const V4 = { grid, eur, kurz, distributor: 'cez', sazba: 'D61d', jistic: '3x25', fixSDph: 3000, marzeSDph: 400, poplFixSDph: 163.35, poplSpotSDph: 163.35, dynZakladSDph: 3900, dynStalaSDph: 163.35, posunPct: 0 };
  const r4eru = naklady({ ...V4, okna: oknoD61d, cons: profil(2, data.tdd.TDD4) });       // CV 14/2025: pá 12:00 – ne 22:00, třída TDD4
  const r4app = naklady({ ...V4, okna: OKNA_APLIKACE.D61d, cons: profil(2, data.tdd.TDD7) }); // aplikace: 0–6 a 22–24 ve všední den, víkend celý, TDD7
  add('V4', 'vlastní', 'ČEZ, D61d, 2 MWh, 3×25 A, fix 3 000 – NT podle CV ERÚ 14/2025 (pá 12:00–ne 22:00) a profil TDD4 podle vyhlášky', { distributor: 'cez', sazba: 'D61d', mwh: 2, fix: 3000 }, r4eru,
    { aplikaceOknaATdd7: r4app, rozdilRegulovane: r4app.fix.regulovane - r4eru.fix.regulovane, podilNTeru: soucet(maskaNT(grid, oknoD61d)) / grid.length, podilNTapp: soucet(maskaNT(grid, OKNA_APLIKACE.D61d)) / grid.length });

  // --- Hraniční vstupy (modul; aplikace má vlastní ošetření v app.js num()) ---
  add('V5', 'vlastní', 'spotřeba 0 MWh → jen stálé platby (ČEZ D02d 3×25: 12 × (256 + 12,87 + 135) × 1,21)', { mwh: 0 },
    { fixCelkem: naklady({ ...V1, cons: profil(0, data.tdd.TDD4) }).fix.celkem, ocekavanoStale: 12 * (256 + 12.87 + 135) * 1.21 });
  add('V6', 'vlastní', 'spotřeba 100 MWh (max. formuláře) – lineární škálování energie fixu', { mwh: 100 },
    { fixEnergie: naklady({ ...V1, cons: profil(100, data.tdd.TDD4) }).fix.energie, ocekavano: 100 * 3000 });
  add('V7', 'vlastní', 'záporná spotřeba −1 MWh – modul neověřuje vstup (zjištění, ne očekávaná hodnota)', { mwh: -1 },
    { fixEnergie: naklady({ ...V1, cons: profil(-1, data.tdd.TDD4) }).fix.energie });

  // --- Dynamický tarif: pásma v den změny času a o svátku ---
  const gDst = mrizka('2026-10-25', '2026-10-25'); // 100 čtvrthodin, hodina 2 dvakrát
  const gSum = mrizka('2026-03-29', '2026-03-29'); // 92, hodina 2 chybí
  const gSv = mrizka('2026-07-06', '2026-07-06');  // pondělí, svátek → víkendová pásma, léto
  add('V8', 'vlastní', 'pásma dyn. tarifu: 25. 10. 2026 (100 čtvrthodin, 2:00 dvakrát → 3 510), 29. 3. 2026 (92), svátek 6. 7. 2026 v 6:00 → 4 290 (víkend), prac. den 7. 7. 2026 v 6:00 → 4 875',
    { dny: ['2026-10-25', '2026-03-29', '2026-07-06', '2026-07-07'] },
    { delka2510: gDst.length, hod2count: gDst.filter((q) => q.hour === 2).length, cena2510h2: [...new Set(gDst.filter((q) => q.hour === 2).map(dynCenaSDph))], delka2903: gSum.length, hod2chybi: !gSum.some((q) => q.hour === 2),
      svatek6h: dynCenaSDph(gSv.find((q) => q.hour === 6)), pracovni6h: dynCenaSDph(mrizka('2026-07-07', '2026-07-07').find((q) => q.hour === 6)), zima12h: dynCenaSDph(mrizka('2026-01-05', '2026-01-05').find((q) => q.hour === 12)), leto12h: dynCenaSDph(gSv.find((q) => q.hour === 12)) });

  // --- Přestupný rok a svátky ---
  add('V9', 'vlastní', 'přestupný rok 28. 2.–1. 3. 2028 = 3 dny = 288 čtvrthodin; 29. 2. 2028 existuje', { od: '2028-02-28', do: '2028-03-01' },
    { ctvrthodin: mrizka('2028-02-28', '2028-03-01').length, dny: dny('2028-02-28', '2028-03-01') });
  add('V10', 'vlastní', 'svátky podle zákona 245/2000 Sb. – 2026 a 2027 (Velký pátek, Velikonoční pondělí + 11 pevných)', { roky: [2026, 2027] },
    { 2026: [...svatky(2026)].sort(), 2027: [...svatky(2027)].sort(), velikonoce2026: velikonoce(2026), velikonoce2027: velikonoce(2027) });

  // --- Kurz: víkend = poslední vyhlášený (test dat) ---
  let sobotyShodne = 0, sobotyCelkem = 0, nedeleShodne = 0;
  for (const d of Object.keys(data.fx.rates)) {
    const dow = denVTydnu(d);
    if (dow === 6 && data.fx.rates[dalsiDen(d, -1)] != null) { sobotyCelkem++; if (data.fx.rates[d] === data.fx.rates[dalsiDen(d, -1)]) sobotyShodne++; }
    if (dow === 0 && data.fx.rates[dalsiDen(d, -2)] != null && data.fx.rates[d] === data.fx.rates[dalsiDen(d, -2)]) nedeleShodne++;
  }
  add('V11', 'vlastní', 'fx.json: sobota a neděle mají kurz z pátku (poslední vyhlášený)', { dnu: Object.keys(data.fx.rates).length },
    { sobotyShodne, sobotyCelkem, nedeleShodne, svatek17_11_2025: [data.fx.rates['2025-11-14'], data.fx.rates['2025-11-17']], prvniLeden2026: [data.fx.rates['2025-12-31'], data.fx.rates['2026-01-01']] });

  // --- POZE: pravidlo „nižší z obou“ s hypotetickou nenulovou platbou podle jističe ---
  add('V12', 'vlastní', 'POZE = min(MWh × 495; A × fáze × Kč/A × 12) – hypoteticky 8,32 Kč/A (hodnota 2025 v CV 13/2025 před změnou CV 15/2025)', { mwh: 3, A: 25, faze: 3, sazbaA: 8.32 },
    { poze3MWh: Math.min(3 * 495, 8.32 * 25 * 3 * 12), poze20MWh: Math.min(20 * 495, 8.32 * 25 * 3 * 12), poze2026: Math.min(3 * 495, POZE_A * 75 * 12) });

  return { grid, eur, kurz, data, pripady: out };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { pripady: p } = pripady();
  console.log(JSON.stringify(p.map(({ id, typ, popis, vstup, muj, ...rest }) => ({ id, typ, popis, vstup, muj, ...rest })), null, 1));
}
