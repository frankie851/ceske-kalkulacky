// Spot, nebo fix? – příprava dat, výpočet a texty, grafy a tabulky výsledku. Bez DOM: stejný modul
// běží při buildu (ukázkový výsledek v spot-nebo-fix.11tydata.js) i v prohlížeči (ui.js).
// Výpočty jsou v calc.js (převzato beze změny); ceny a poplatky v tariffs.json a dynamic.json,
// výchozí hodnoty a předvolby domácností v rules.json. Nic tu není natvrdo.
import {
  buildQuarterGrid, consumptionProfile, computeVariants, dynamicPctPerQuarter,
  hourlyAverage, hourlyShare, pozeAnnual, regulatedFor, sum,
} from './calc.js';
import { kc, cislo, procenta, datum } from '../../js/format.js';
import { caroveGrafy, tabulkaDat, hezkeDeleni, esc } from '../../js/graf.js';

const NBSP = ' ';
const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const MESICE_KRATCE = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

/** Tři varianty v pevném pořadí (karty i grafy). */
export const VARIANTY = [
  { klic: 'fix', nazev: 'Fixní cena', vetou: 'fixní cena', oproti: 'fixu', trida: 'graf-rada-1' },
  { klic: 'spot', nazev: 'Spot', vetou: 'spot', oproti: 'spotu', trida: 'graf-rada-2' },
  { klic: 'dynamic', nazev: 'Dynamický tarif', vetou: 'dynamický tarif', oproti: 'dynamickému tarifu', trida: 'graf-rada-3' },
];

/** Velikosti grafů: úzká verze pro mobil, široká od 560 px (přepíná CSS, žádné překreslení při načtení). */
const ROZMERY = { uzky: { sirka: 360, vyska: 280 }, siroky: { sirka: 640, vyska: 300 } };

/** "2026-03" → "březen 2026" */
export const nazevMesice = (m) => `${MESICE[Number(m.slice(5, 7)) - 1]}${NBSP}${m.slice(0, 4)}`;
const kratkyMesic = (m) => MESICE_KRATCE[Number(m.slice(5, 7)) - 1];
const kcKwh = (kcZaMwh) => `${cislo(kcZaMwh / 1000, 2)}${NBSP}Kč/kWh`;
const mwh = (n) => `${cislo(n, n < 10 ? 2 : 1)}${NBSP}MWh`;
/** Číslo do textového pole: 3.5 → "3,5", 3500 → "3 500", 163.35 → "163,35" */
export const doPole = (n) => cislo(n, Number.isInteger(n) ? 0 : 2).replace(/,00$/, '').replace(/(,\d)0$/, '$1');

/**
 * Připraví časovou mřížku, ceny, kurzy a pásma dynamického tarifu (jednou; v prohlížeči až při první změně).
 * @param {{ceny:object, kurzy:object, meta:object, tarify:object, dynamicky:object}} z data z data/*.json, tariffs.json, dynamic.json
 */
export function pripravData({ ceny, kurzy, meta, tarify, dynamicky }) {
  const grid = buildQuarterGrid(meta.from, meta.to);
  const spotEur = ceny.days ? Object.keys(ceny.days).sort().flatMap((d) => ceny.days[d]) : dekodujCeny(ceny);
  if (spotEur.length !== grid.length) throw new Error('Ceny z burzy neodpovídají období dat.');
  const fx = grid.map((q) => kurzy.rates[q.date]);
  if (fx.some((k) => !(k > 0))) throw new Error('Chybí kurz ČNB pro některý den.');
  const produkt = dynamicky.products[dynamicky.default];
  const spotKc = spotEur.map((e, i) => e * fx[i]);
  return {
    meta, tarify, produkt, grid, spotEur, fx, spotKc,
    dynPct: dynamicPctPerQuarter(grid, produkt),
    cenaPodleHodin: hourlyAverage(grid, spotKc),
    prumernaCena: sum(spotKc) / spotKc.length,
  };
}

/* ---------- kompaktní zápis cen do stránky ---------- */

// Ceny z burzy mají nejvýš dvě desetinná místa. Do stránky je vkládáme bezeztrátově a kompaktně:
// celé centy → rozdíl od předchozí čtvrthodiny → zigzag → číslice o 5 bitech (A–Z, a–f konec čísla,
// g–z, 0–9, -, _ pokračování). Místo ~225 kB JSON je to ~90 kB a stránka se načte rychleji.
const ABECEDA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

/** prices.json → { unit, from, to, pocet, kodovani, data } */
export function zakodujCeny(ceny) {
  const flat = Object.keys(ceny.days).sort().flatMap((d) => ceny.days[d]);
  let predchozi = 0;
  let data = '';
  for (const x of flat) {
    const c = Math.round(x * 100);
    if (c / 100 !== x) throw new Error(`Cena ${x} má víc než dvě desetinná místa.`);
    const d = c - predchozi;
    predchozi = c;
    let z = d >= 0 ? 2 * d : -2 * d - 1;
    while (z >= 32) { data += ABECEDA[32 + (z % 32)]; z = Math.floor(z / 32); }
    data += ABECEDA[z];
  }
  const kod = { unit: ceny.unit, from: ceny.from, to: ceny.to, pocet: flat.length, kodovani: 'centy-rozdil-b32', data };
  const zpet = dekodujCeny(kod);
  if (zpet.some((x, i) => x !== flat[i])) throw new Error('Kódování cen není bezeztrátové.');
  return kod;
}

/** Opak zakodujCeny: pole cen EUR/MWh po čtvrthodinách. */
export function dekodujCeny(kod) {
  const out = new Array(kod.pocet);
  let c = 0;
  let i = 0;
  let z = 0;
  let rad = 1;
  for (let j = 0; j < kod.data.length; j++) {
    const k = ABECEDA.indexOf(kod.data[j]);
    if (k < 0) throw new Error('Neplatný znak v datech cen.');
    z += (k % 32) * rad;
    if (k >= 32) { rad *= 32; continue; }
    c += z % 2 ? -(z + 1) / 2 : z / 2;
    out[i++] = c / 100;
    z = 0;
    rad = 1;
  }
  if (i !== kod.pocet) throw new Error('Data cen jsou neúplná.');
  return out;
}

/* ---------- upozornění a texty z JSON ---------- */

/** Doplní {klíče} v textu z rules.json nebo tariffs.json. */
const doplnit = (sablona, hodnoty) => sablona.replace(/\{(\w+)\}/g, (_, k) => String(hodnoty[k] ?? ''));

/** "a, b a c" */
const vycet = (polozky) => (polozky.length < 2 ? polozky.join('') : `${polozky.slice(0, -1).join(', ')} a ${polozky.at(-1)}`);

/** Měsíce období (RRRR-MM), které leží mimo rok regulovaných cen v tariffs.json (revize SPOT-09). */
export function mesiceMimoRokCen(mesice, rok) {
  return mesice.filter((m) => Number(m.slice(0, 4)) !== Number(rok));
}

/**
 * Upozornění, že část období počítáme s regulovanými cenami jiného roku (revize SPOT-09).
 * Text a známé rozdíly (u roku 2025 nenulová POZE podle CR ERÚ č. 11/2024) jsou v tariffs.json.
 * @returns {string} prázdný řetězec, když celé období leží v roce cen
 */
export function upozorneniObdobi(mesice, tarify, cenikOd) {
  const mimo = mesiceMimoRokCen(mesice, tarify.year);
  if (!mimo.length) return '';
  const j = tarify.jinyRokCen;
  const text = [doplnit(j.text, { mesice: vycet(mimo.map(nazevMesice)), rok: tarify.year, cenik: datum(cenikOd) })];
  for (const rok of [...new Set(mimo.map((m) => m.slice(0, 4)))]) {
    const r = j.roky[rok];
    if (r) text.push(doplnit(r.text, { pozeA: cislo(r.poze.perAmpPhase, 2), pozeMax: cislo(r.poze.perMWhMax) }));
  }
  return text.join(' ');
}

/**
 * Posoudí měření z CSV (revize SPOT-10): pod minimem pokrytí (rules.json → mereni.minPokryti) ho
 * nepoužijeme, protože by se krátký úsek přepočítal na celý rok a přepsal roční spotřebu.
 * @param {{coverage:number, interval:number, measuredMWh:number}} r výsledek profileFromCsv
 * @returns {{pouzit:boolean, chyba:boolean, zprava:string}}
 */
export function posudMereni(r, nastaveni) {
  const t = nastaveni.texty;
  const pct = r.coverage > 0 && r.coverage < 0.005 ? `méně než ${procenta(1)}` : procenta(Math.round(r.coverage * 100));
  if (r.coverage < nastaveni.minPokryti) {
    return { pouzit: false, chyba: true, zprava: doplnit(t.malo, { pct, min: procenta(nastaveni.minPokryti * 100) }) };
  }
  let zprava = doplnit(t.pouzito, { interval: r.interval, pct, mwh: cislo(r.measuredMWh, 2) });
  if (r.coverage < 1) zprava += ` ${t.doplneno}`;
  if (r.coverage < nastaveni.hrubyOdhadPod) zprava += ` ${doplnit(t.hruby, { hranice: procenta(nastaveni.hrubyOdhadPod * 100) })}`;
  return { pouzit: true, chyba: false, zprava };
}

/** Klíč souboru TDD (data/tdd/<klic>.json) pro sazbu a region. */
export function tridaTdd(tarify, sazba, region) {
  const t = tarify.sazbyInfo[sazba]?.tdd;
  if (!t) throw new Error(`Neznámá sazba ${sazba}`);
  return t === 'TDD5' ? `TDD5-${region}` : t;
}

/** Výchozí vstup z rules.json (předvolba domácnosti) a dynamic.json (ceny dynamického tarifu vč. DPH). */
export function vychoziVstup(pravidla, tarify, dynamicky) {
  const v = pravidla.vychozi;
  const p = pravidla.predvolby.find((x) => x.id === v.predvolba);
  const produkt = dynamicky.products[dynamicky.default];
  const sDph = (n) => n * (1 + tarify.vat.value);
  return {
    predvolba: p.id,
    distributor: v.distributor,
    sazba: p.sazba,
    region: tarify.distributors[v.distributor].tdd5Regions[0],
    jistic: p.jistic,
    mwh: p.mwh,
    fix: { cena: v.fix.cena, stalyPlat: v.fix.stalyPlat },
    spot: { prirazka: v.spot.prirazka, stalyPlat: v.spot.stalyPlat },
    dyn: { zaklad: Math.round(sDph(produkt.basePrice.value)), stalyPlat: Math.round(sDph(produkt.monthlyFee.value) * 100) / 100 },
    posun: v.posun.hodnota,
  };
}

/**
 * Spočítá tři varianty (s posunem i bez něj) přes computeVariants z calc.js.
 * Ceny ve vstupu jsou vč. DPH (jak je uvádějí nabídky), calc.js dostává ceny bez DPH.
 * @param {object} D        výsledek pripravData
 * @param {object} vstup    { distributor, sazba, jistic, mwh, fix:{cena, stalyPlat}, spot:{prirazka, stalyPlat}, dyn:{zaklad, stalyPlat}, posun }
 * @param {number[]} tdd    hodnoty TDD (data/tdd/<klic>.json → values)
 * @param {number[]} [mereni] vlastní spotřeba po čtvrthodinách (MWh) z CSV – nahradí TDD × roční spotřebu
 */
export function spocitej(D, vstup, tdd, mereni = null) {
  const vat = D.tarify.vat.value;
  const bez = (n) => n / (1 + vat);
  const cons = mereni || consumptionProfile(vstup.mwh, tdd);
  const regulated = regulatedFor(D.tarify, D.grid, vstup.distributor, vstup.sazba, vstup.jistic);
  const p = {
    grid: D.grid, cons, spotEur: D.spotEur, fx: D.fx, vat, regulated,
    fix: { price: bez(vstup.fix.cena), monthlyFee: bez(vstup.fix.stalyPlat) },
    spot: { margin: bez(vstup.spot.prirazka), monthlyFee: bez(vstup.spot.stalyPlat) },
    dynamic: { base: bez(vstup.dyn.zaklad), pct: D.dynPct, monthlyFee: bez(vstup.dyn.stalyPlat) },
  };
  const zaklad = computeVariants({ ...p, shiftPct: 0 });
  const res = vstup.posun ? computeVariants({ ...p, shiftPct: vstup.posun }) : zaklad;
  return { res, zaklad, cons, regulated, vstup, vat };
}

/* ---------- grafy ---------- */

/**
 * Seskupený sloupcový graf (měsíce × varianty). Stejné značky a třídy jako sloupcovyGraf z graf.js,
 * jen s více řadami vedle sebe. Hodnoty jsou v tabulce pod grafem.
 */
export function seskupeneSloupce({ titulek, popis, skupiny = [], rady = [], osaY = {}, sirka = 640, vyska = 300, id }) {
  const fy = osaY.format || ((n) => cislo(n));
  const hodnoty = rady.flatMap((r) => r.hodnoty.map((h) => Number(h) || 0));
  const osa = hezkeDeleni(0, Math.max(...hodnoty, 0) || 1, 4);
  const popiskyY = osa.znacky.map((v) => fy(v));
  const levy = Math.min(sirka * 0.3, 12 + Math.max(...popiskyY.map((t) => t.length)) * 7.4);
  const horni = osaY.popisek ? 34 : 20;
  const dolni = 30;
  const sw = sirka - levy - 6;
  const sv = vyska - horni - dolni;
  const r1 = (v) => Math.round(v * 10) / 10;
  const py = (y) => r1(horni + sv - ((y - osa.min) / (osa.max - osa.min)) * sv);
  const skupina = sw / Math.max(1, skupiny.length);
  const sirkaS = Math.min(16, (skupina * 0.78) / Math.max(1, rady.length));
  let s = '';
  osa.znacky.forEach((v, i) => {
    s += `<line class="graf-mrizka" x1="${r1(levy)}" y1="${py(v)}" x2="${r1(levy + sw)}" y2="${py(v)}"/>`;
    s += `<text class="graf-popisek" x="${r1(levy - 8)}" y="${r1(py(v) + 4)}" text-anchor="end">${esc(popiskyY[i])}</text>`;
  });
  rady.forEach((r, ri) => {
    s += `<g class="${esc(r.trida)}">`;
    r.hodnoty.forEach((h, i) => {
      const cx = levy + skupina * i + skupina / 2;
      const x = cx - (rady.length * sirkaS) / 2 + ri * sirkaS;
      const y1 = py(Math.max(0, Number(h) || 0));
      s += `<rect class="graf-sloupec" x="${r1(x + 0.5)}" y="${y1}" width="${r1(sirkaS - 1)}" height="${r1(py(0) - y1)}" rx="2"/>`;
    });
    s += '</g>';
  });
  skupiny.forEach((nazev, i) => {
    s += `<text class="graf-popisek" x="${r1(levy + skupina * i + skupina / 2)}" y="${r1(horni + sv + 20)}" text-anchor="middle">${esc(nazev)}</text>`;
  });
  s += `<line class="graf-osa" x1="${r1(levy)}" y1="${py(0)}" x2="${r1(levy + sw)}" y2="${py(0)}"/>`;
  if (osaY.popisek) s += `<text class="graf-popisek-osy" x="0" y="14">${esc(osaY.popisek)}</text>`;
  const leg = `<ul class="graf-legenda">${rady.map((r) => `<li><span class="graf-vzorek ${esc(r.trida)}" aria-hidden="true"></span><span>${esc(r.nazev)}</span></li>`).join('')}</ul>`;
  return `<figure class="graf"><svg class="graf-svg" role="img" aria-labelledby="${id}-t ${id}-d" viewBox="0 0 ${sirka} ${vyska}" width="${sirka}" height="${vyska}">`
    + `<title id="${id}-t">${esc(titulek)}</title><desc id="${id}-d">${esc(popis)}</desc>${s}</svg><figcaption>${leg}</figcaption></figure>`;
}

function grafMesicu(r, verze) {
  const { sirka, vyska } = ROZMERY[verze];
  const popis = VARIANTY.map((v) => {
    const m = r.variants[v.klic].monthly;
    const max = m.indexOf(Math.max(...m));
    return `${v.nazev}: nejvíc ${kc(m[max])} (${nazevMesice(r.months[max])})`;
  }).join('; ') + '. Hodnoty po měsících jsou v tabulce pod grafem.';
  return seskupeneSloupce({
    titulek: 'Náklady na elektřinu po měsících ve třech variantách',
    popis,
    skupiny: r.months.map(kratkyMesic),
    rady: VARIANTY.map((v) => ({ nazev: v.nazev, trida: v.trida, hodnoty: r.variants[v.klic].monthly })),
    osaY: { popisek: 'Kč za měsíc vč. DPH', format: (n) => cislo(n) },
    sirka, vyska, id: `spot-mesice-${verze}`,
  });
}

function grafHodin(D, podil, podilPoPosunu, posun, verze) {
  const { sirka, vyska } = ROZMERY[verze];
  const prumer = sum(D.cenaPodleHodin) / 24;
  const body = (rada) => rada.map((y, x) => ({ x, y }));
  const rady = [
    { nazev: 'Cena na burze', trida: 'graf-rada-1', body: body(D.cenaPodleHodin.map((c) => (c / prumer) * 100)), zvyraznena: true },
    { nazev: 'Tvoje spotřeba', trida: 'graf-rada-2', body: body(podil.map((s) => s * 24 * 100)) },
  ];
  if (posun) rady.push({ nazev: `Spotřeba po posunu ${posun} %`, trida: 'graf-rada-2', carkovana: true, body: body(podilPoPosunu.map((s) => s * 24 * 100)) });
  const hMax = (rada) => rada.indexOf(Math.max(...rada));
  const popis = `Cena na burze je nejvyšší kolem ${hMax(D.cenaPodleHodin)}. hodiny a nejnižší kolem ${D.cenaPodleHodin.indexOf(Math.min(...D.cenaPodleHodin))}. hodiny. `
    + `Nejvíc spotřebuješ kolem ${hMax(podil)}. hodiny. 100 % je průměr dne. Hodnoty jsou v tabulce pod grafem.`;
  return caroveGrafy({
    titulek: 'Cena na burze a tvoje spotřeba podle hodiny dne',
    popis, rady,
    osaX: { popisek: 'hodina dne', format: (n) => `${n}${NBSP}h` },
    osaY: { popisek: '% průměru dne', format: (n) => procenta(n) },
    sirka, vyska, id: `spot-hodiny-${verze}`,
  });
}

/* ---------- texty výsledku ---------- */

/**
 * Z výpočtu sestaví vše, co stránka ukazuje: kartu výsledku, tři varianty, lištu, grafy, tabulky a předpoklady.
 * @param {object} D   pripravData
 * @param {object} v   spocitej
 * @param {{tdd:string, mereni?:boolean}} o
 */
export function vystup(D, v, { tdd, mereni = false } = {}) {
  const { res, zaklad, vstup } = v;
  const seznam = VARIANTY.map((x) => ({ ...x, r: res.variants[x.klic], z: zaklad.variants[x.klic] }));
  const poradi = [...seznam].sort((a, b) => a.r.total - b.r.total);
  const best = poradi[0];
  const dalsi = poradi.slice(1);
  const nazevNejlevnejsi = best.vetou;

  const karty = seznam.map((x) => {
    const rozdil = x.r.total - best.r.total;
    const uspora = x.z.total - x.r.total;
    let posun = '';
    if (vstup.posun && x.klic === 'fix') posun = 'Posun spotřeby fixní cenu nemění.';
    else if (vstup.posun) posun = `S posunem ${vstup.posun}${NBSP}% ${uspora >= 0 ? 'ušetříš' : 'zaplatíš navíc'} ${kc(Math.abs(uspora))} za rok.`;
    return {
      klic: x.klic,
      nazev: x.nazev,
      nejlevnejsi: x === best,
      castka: kc(x.r.total),
      zaKwh: `${kcKwh(x.r.total / x.r.totalMWh)} vč. DPH`,
      rozdil: x === best ? 'Nejlevnější varianta' : `o ${kc(rozdil)} dráž`,
      polozky: [
        { nazev: 'Elektřina', hodnota: kc(x.r.energy) },
        { nazev: 'Distribuce a daně', hodnota: kc(x.r.regulated) },
        { nazev: 'Stálé platby', hodnota: kc(x.r.fixedFees) },
      ],
      posun,
    };
  });

  const vysvetleni = `Oproti ${dalsi[0].oproti} ušetříš ${kc(dalsi[0].r.total - best.r.total)} za rok, `
    + `oproti ${dalsi[1].oproti} ${kc(dalsi[1].r.total - best.r.total)}.`
    + (vstup.posun ? ` Počítáme s posunem ${vstup.posun}${NBSP}% spotřeby do levných hodin.` : '');

  // Hodinový profil: podíl spotřeby po hodinách (před posunem a po posunu u spotu)
  const podil = hourlyShare(D.grid, v.cons);
  const podilPoPosunu = vstup.posun ? hourlyShare(D.grid, res.variants.spot.cons) : null;
  const vazena = (cons) => { let s = 0; for (let i = 0; i < cons.length; i++) s += cons[i] * D.spotKc[i]; return s / sum(cons); };
  const tvojeCena = vazena(vstup.posun ? res.variants.spot.cons : v.cons);
  const odchylka = (tvojeCena / D.prumernaCena - 1) * 100;
  const hodinyShrnuti = `Průměrná cena na burze za období: ${kcKwh(D.prumernaCena)}. `
    + `S tvým průběhem spotřeby${vstup.posun ? ` a posunem ${vstup.posun}${NBSP}%` : ''} vychází ${kcKwh(tvojeCena)}, `
    + (Math.abs(odchylka) < 0.5 ? 'tedy skoro stejně.' : `o ${procenta(Math.abs(odchylka))} ${odchylka > 0 ? 'víc. Spotřebu máš víc v dražších hodinách.' : 'míň. Spotřebu máš víc v levnějších hodinách.'}`)
    + ' Ceny bez DPH a bez přirážky dodavatele.';

  const mwhMesice = res.months.map(() => 0);
  const indexMesice = new Map(res.months.map((m, i) => [m, i]));
  D.grid.forEach((q, i) => { mwhMesice[indexMesice.get(q.month)] += v.cons[i]; });
  const tabMesice = tabulkaDat({
    caption: 'Náklady po měsících (Kč vč. DPH)',
    popisek: 'náklady po měsících',
    stack: true,
    sloupce: ['Měsíc', 'Spotřeba (MWh)', ...VARIANTY.map((x) => x.nazev)],
    radky: [
      ...res.months.map((m, i) => [
        nazevMesice(m), cislo(mwhMesice[i], 2),
        ...VARIANTY.map((x) => kc(res.variants[x.klic].monthly[i])),
      ]),
      ['Celkem za rok', cislo(sum(v.cons), 2), ...VARIANTY.map((x) => kc(res.variants[x.klic].total))],
    ],
  });

  const tabHodiny = tabulkaDat({
    caption: 'Cena na burze a spotřeba podle hodiny dne',
    popisek: 'ceny a spotřeba podle hodiny',
    sloupce: ['Hodina', 'Cena na burze (Kč/kWh bez DPH)', 'Tvoje spotřeba (% za den)', ...(vstup.posun ? [`Po posunu ${vstup.posun} %`] : [])],
    radky: D.cenaPodleHodin.map((c, h) => [
      `${h}–${h + 1}${NBSP}h`, cislo(c / 1000, 2), procenta(podil[h] * 100, 1),
      ...(vstup.posun ? [procenta(podilPoPosunu[h] * 100, 1)] : []),
    ]),
  });

  // Předpoklady pro zvolené odběrné místo (vše vč. DPH)
  const t = D.tarify;
  const r = v.regulated;
  const sDph = (n) => n * (1 + v.vat);
  const distribuce = t.distributors[vstup.distributor];
  const breaker = t.breakers.find((b) => b.id === vstup.jistic);
  // POZE: účtuje se nižší z platby podle spotřeby a podle jističe (calc.js) – ukazujeme to, co se opravdu účtuje.
  const pozeRok = pozeAnnual(res.variants.fix.totalMWh, r.poze, res.months.length);
  const predpoklady = [
    { nazev: 'Období', hodnota: `${datum(D.meta.from)} – ${datum(D.meta.to)}, ${cislo(D.grid.length)} čtvrthodin` },
    { nazev: 'Profil spotřeby', hodnota: mereni ? 'tvoje průběhové měření z CSV' : `${tdd} (typový diagram OTE), ${mwh(sum(v.cons))} za rok` },
    { nazev: `Distribuce ${distribuce.name}, ${vstup.sazba}`, hodnota: t.distributors[vstup.distributor].sazby[vstup.sazba].nt == null
      ? `${kcKwh(sDph(r.vt))}` : `vysoký tarif ${kcKwh(sDph(r.vt))}, nízký ${kcKwh(sDph(r.nt))}` },
    { nazev: `Jistič ${breaker.label} a nesíťová infrastruktura`, hodnota: `${kc(sDph(r.monthly), 2)} měsíčně` },
    { nazev: 'Daň z elektřiny a systémové služby', hodnota: kcKwh(sDph(r.perMWh)) },
    { nazev: 'Podpora obnovitelných zdrojů (POZE)', hodnota: pozeRok > 0 ? `${kc(sDph(pozeRok))} za rok` : `${kc(0)} – ${t.common.poze.vysvetleniNuly}` },
    { nazev: `Dynamický tarif ${D.produkt.supplier}`, hodnota: `ceník od ${datum(D.produkt.validFrom)}, základní cena ${kcKwh(vstup.dyn.zaklad)}, pásma −50 až +25${NBSP}%` },
    { nazev: 'DPH', hodnota: `${procenta(v.vat * 100)}, je ve všech částkách` },
  ];
  // Revize SPOT-09: měsíce mimo rok regulovaných cen (data jsou posledních 12 celých měsíců);
  // upozornění je pod tabulkou nákladů po měsících.
  const upozorneni = upozorneniObdobi(res.months, t, D.produkt.validFrom);

  return {
    nejlevnejsi: best.klic,
    kicker: `Za posledních 12 měsíců · vč. DPH`,
    nadpis: `Nejlevnější vychází ${nazevNejlevnejsi}`,
    cislo: kc(best.r.total),
    popis: 'za rok včetně DPH',
    vysvetleni,
    karty,
    lista: { cislo: kc(best.r.total), popis: `Nejlevnější: ${nazevNejlevnejsi}, za rok` },
    oznameni: `Nejlevnější vychází ${nazevNejlevnejsi}: ${kc(best.r.total)} za rok. `
      + karty.filter((k) => !k.nejlevnejsi).map((k) => `${k.nazev} ${k.castka}`).join(', ') + '.',
    grafMesice: { uzky: grafMesicu(res, 'uzky'), siroky: grafMesicu(res, 'siroky') },
    tabulkaMesice: tabMesice,
    grafHodiny: {
      uzky: grafHodin(D, podil, podilPoPosunu, vstup.posun, 'uzky'),
      siroky: grafHodin(D, podil, podilPoPosunu, vstup.posun, 'siroky'),
    },
    tabulkaHodiny: tabHodiny,
    hodinyShrnuti,
    predpoklady,
    upozorneniObdobi: upozorneni,
    rocniMwh: sum(v.cons),
  };
}
