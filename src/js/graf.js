// Grafy jako SVG řetězce – bez knihoven, běží při buildu v Node i v prohlížeči.
// Barvy jen přes třídy .graf-rada-1 … .graf-rada-5 (definované v main.css z tokenů --c-chart-*),
// žádné barevné literály ani inline styly (CSP: style-src 'self').
// Každý graf má role="img", <title>, <desc> a k tomu patří textová alternativa (tabulkaDat).
import { cislo, kc } from './format.js';

/** Escapuje text pro HTML/SVG (obsah i hodnoty atributů). */
export function esc(hodnota) {
  return String(hodnota ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slug(text) {
  return String(text ?? 'graf').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30) || 'graf';
}

let pocitadlo = 0;
function noveId(id, titulek) {
  if (id) return slug(id);
  pocitadlo += 1;
  return `graf-${slug(titulek)}-${pocitadlo}`;
}

/** Třída řady: povolené jen graf-rada-1 … graf-rada-5, jinak podle pořadí. */
function tridaRady(trida, i) {
  return /^graf-rada-[1-5]$/.test(trida || '') ? trida : `graf-rada-${(i % 5) + 1}`;
}

const zaokrouhli = (v) => Number(Number(v).toPrecision(12));
const r1 = (v) => Math.round(v * 10) / 10;

/**
 * „Hezké“ dělení osy po krocích 1-2-5 × 10^n.
 * hezkeDeleni(0, 45600) → { min: 0, max: 50000, krok: 10000, znacky: [0, 10000, …, 50000] }
 */
export function hezkeDeleni(min, max, pocet = 5) {
  let a = Number(min);
  let b = Number(max);
  if (!Number.isFinite(a) || !Number.isFinite(b)) { a = 0; b = 1; }
  if (a > b) [a, b] = [b, a];
  if (a === b) { if (a === 0) b = 1; else { a = a > 0 ? 0 : a * 2; b = b > 0 ? b * 2 : 0; } }
  const hruby = (b - a) / Math.max(1, pocet);
  const rad = 10 ** Math.floor(Math.log10(hruby));
  const n = hruby / rad;
  const krok = zaokrouhli((n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * rad);
  const od = zaokrouhli(Math.floor(a / krok) * krok);
  const po = zaokrouhli(Math.ceil(b / krok) * krok);
  const znacky = [];
  for (let v = od; v <= po + krok / 2; v += krok) znacky.push(zaokrouhli(v));
  return { min: od, max: po, krok, znacky };
}

function legenda(polozky) {
  return `<ul class="graf-legenda">${polozky.map((p) =>
    `<li><span class="graf-vzorek ${p.vzorek}" aria-hidden="true"></span><span>${esc(p.nazev)}${p.hodnota != null ? ':' : ''}</span>${p.hodnota != null ? ` <b>${esc(p.hodnota)}</b>` : ''}</li>`).join('')}</ul>`;
}

/**
 * Skládaný vodorovný pruh, typicky „využití limitu 48 000 Kč“.
 * @param {object} o
 * @param {string} o.titulek  – název grafu (<title>)
 * @param {string} [o.popis]  – slovní popis (<desc>); jinak se složí z položek
 * @param {{nazev:string, hodnota:number, trida?:string}[]} o.polozky
 * @param {number} [o.limit]  – celkový limit; zbytek se ukáže jako čárkované „volné místo“
 * @param {(n:number)=>string} [o.format=kc]
 * @param {string} [o.id]
 * @returns {string} HTML <figure class="graf graf-pruh"> se SVG, legendou a souhrnem
 */
export function skladanyPruh({ titulek, popis, polozky = [], limit, format = kc, id } = {}) {
  const gid = noveId(id, titulek);
  const kladne = polozky.map((p, i) => ({ ...p, hodnota: Math.max(0, Number(p.hodnota) || 0), trida: tridaRady(p.trida, i) }));
  const soucet = kladne.reduce((s, p) => s + p.hodnota, 0);
  const maLimit = Number.isFinite(Number(limit)) && Number(limit) > 0;
  const celkem = Math.max(maLimit ? Number(limit) : soucet, soucet) || 1;
  const volno = maLimit ? Math.max(0, Number(limit) - soucet) : 0;

  const MEZERA = 0.6; // % mezi segmenty
  const Y = 24;
  const V = 56;
  let x = 0;
  let segmenty = '';
  for (const p of kladne) {
    if (p.hodnota <= 0) continue;
    const podil = p.hodnota / celkem;
    const w = Math.max(0.8, podil * 100 - MEZERA);
    segmenty += `<g class="${p.trida}"><rect class="graf-segment" x="${r1(x)}%" y="${Y}" width="${r1(w)}%" height="${V}" rx="18"/>`;
    if (podil >= 0.5) {
      segmenty += `<text class="graf-segment-text" x="${r1(x + 2.5)}%" y="${Y + 23}">${esc(p.nazev)}</text>`;
      segmenty += `<text class="graf-segment-text" x="${r1(x + 2.5)}%" y="${Y + 43}">${esc(format(p.hodnota))}</text>`;
    } else if (podil >= 0.3) {
      segmenty += `<text class="graf-segment-text" x="${r1(x + 2.5)}%" y="${Y + 34}">${esc(format(p.hodnota))}</text>`;
    }
    segmenty += '</g>';
    x += podil * 100;
  }
  let volnoSvg = '';
  if (volno > 0) {
    const w = Math.max(1.2, (volno / celkem) * 100 - MEZERA);
    volnoSvg = `<rect class="graf-volno" x="${r1(100 - w)}%" y="${Y + 1.5}" width="${r1(w)}%" height="${V - 3}" rx="12"/>`
      + `<text class="graf-hodnota" x="100%" y="${Y + V + 30}" text-anchor="end">volné místo ${esc(format(volno))}</text>`;
  }
  const vyska = volno > 0 ? 116 : 88;
  const autoPopis = [
    ...kladne.map((p) => `${p.nazev} ${format(p.hodnota)}`),
    ...(volno > 0 ? [`volné místo v limitu ${format(volno)}`] : []),
  ].join(', ') + (maLimit ? `. Limit ${format(Number(limit))}.` : '.');

  const svg = `<svg class="graf-svg" role="img" aria-labelledby="${gid}-t ${gid}-d" width="100%" height="${vyska}">`
    + `<title id="${gid}-t">${esc(titulek)}</title><desc id="${gid}-d">${esc(popis || autoPopis)}</desc>`
    + `<text class="graf-popisek" x="0" y="14">${esc(format(0))}</text>`
    + (maLimit ? `<text class="graf-popisek" x="100%" y="14" text-anchor="end">limit ${esc(format(Number(limit)))}</text>` : '')
    + `<rect class="graf-stopa" x="0" y="${Y}" width="100%" height="${V}" rx="20"/>`
    + segmenty + volnoSvg + '</svg>';

  const leg = legenda([
    ...kladne.map((p) => ({ nazev: p.nazev, hodnota: format(p.hodnota), vzorek: p.trida })),
    ...(volno > 0 ? [{ nazev: 'Volné místo v limitu', hodnota: format(volno), vzorek: 'graf-vzorek-volno' }] : []),
  ]);
  const souhrn = maLimit ? `<p class="graf-souhrn">Dohromady ${esc(format(soucet))} z ${esc(format(Number(limit)))}.</p>` : '';
  return `<figure class="graf graf-pruh${volno > 0 ? ' graf-pruh-volno' : ''}">${svg}<figcaption>${leg}${souhrn}</figcaption></figure>`;
}

/**
 * Čárový graf (jedna nebo více řad) s hezkým dělením osy Y, mřížkou, popisky os a legendou.
 * @param {object} o
 * @param {string} o.titulek
 * @param {string} [o.popis]
 * @param {{nazev:string, body:{x:number,y:number}[], trida?:string, carkovana?:boolean, vyplnena?:boolean, zvyraznena?:boolean}[]} o.rady
 * @param {{popisek?:string, format?:(n:number)=>string}} [o.osaX]
 * @param {{popisek?:string, format?:(n:number)=>string}} [o.osaY]
 * @param {number} [o.sirka=640] – šířka v jednotkách viewBox; v prohlížeči lze předat šířku kontejneru
 * @param {number} [o.vyska=320]
 * @param {string} [o.id]
 * @returns {string} HTML <figure class="graf"> se SVG a legendou
 */
export function caroveGrafy({ titulek, popis, rady = [], osaX = {}, osaY = {}, sirka = 640, vyska = 320, id } = {}) {
  const gid = noveId(id, titulek);
  const fx = osaX.format || ((n) => cislo(n));
  const fy = osaY.format || ((n) => cislo(n));
  const vsechny = rady.flatMap((r) => (r.body || []).filter((b) => Number.isFinite(b.x) && Number.isFinite(b.y)));
  const xs = [...new Set(vsechny.map((b) => b.x))].sort((a, b) => a - b);
  const ys = vsechny.map((b) => b.y);
  const xMin = xs.length ? xs[0] : 0;
  const xMax = xs.length ? xs[xs.length - 1] : 1;
  const osaYd = hezkeDeleni(Math.min(0, ...(ys.length ? ys : [0])), Math.max(...(ys.length ? ys : [1])), 5);
  const znackyX = xs.length && xs.length <= 8 ? xs
    : hezkeDeleni(xMin, xMax, 6).znacky.filter((v) => v >= xMin && v <= xMax);

  const popiskyY = osaYd.znacky.map((v) => fy(v));
  const levy = Math.min(sirka * 0.3, 12 + Math.max(...popiskyY.map((t) => t.length)) * 7.4);
  const horni = osaY.popisek ? 30 : 14;
  const pravy = 18;
  const dolni = osaX.popisek ? 50 : 30;
  const sw = Math.max(10, sirka - levy - pravy);
  const sv = Math.max(10, vyska - horni - dolni);
  const px = (x) => r1(levy + (xMax === xMin ? sw / 2 : ((x - xMin) / (xMax - xMin)) * sw));
  const py = (y) => r1(horni + sv - ((y - osaYd.min) / (osaYd.max - osaYd.min)) * sv);

  let mrizka = '';
  osaYd.znacky.forEach((v, i) => {
    const y = py(v);
    mrizka += `<line class="graf-mrizka" x1="${r1(levy)}" y1="${y}" x2="${r1(levy + sw)}" y2="${y}"/>`;
    mrizka += `<text class="graf-popisek" x="${r1(levy - 8)}" y="${r1(y + 4)}" text-anchor="end">${esc(popiskyY[i])}</text>`;
  });
  let popiskyXSvg = '';
  for (const v of znackyX) {
    popiskyXSvg += `<text class="graf-popisek" x="${px(v)}" y="${r1(horni + sv + 20)}" text-anchor="middle">${esc(fx(v))}</text>`;
  }
  const osy = `<line class="graf-osa" x1="${r1(levy)}" y1="${py(osaYd.min)}" x2="${r1(levy + sw)}" y2="${py(osaYd.min)}"/>`
    + (osaYd.min < 0 ? `<line class="graf-osa" x1="${r1(levy)}" y1="${py(0)}" x2="${r1(levy + sw)}" y2="${py(0)}"/>` : '');
  const popiskyOs = (osaY.popisek ? `<text class="graf-popisek-osy" x="0" y="14">${esc(osaY.popisek)}</text>` : '')
    + (osaX.popisek ? `<text class="graf-popisek-osy" x="${r1(levy + sw)}" y="${r1(vyska - 6)}" text-anchor="end">${esc(osaX.popisek)}</text>` : '');

  let radySvg = '';
  rady.forEach((r, i) => {
    const body = (r.body || []).filter((b) => Number.isFinite(b.x) && Number.isFinite(b.y)).sort((a, b) => a.x - b.x);
    if (!body.length) return;
    const trida = tridaRady(r.trida, i);
    const d = body.map((b, j) => `${j ? 'L' : 'M'}${px(b.x)} ${py(b.y)}`).join(' ');
    let g = `<g class="${trida}">`;
    if (r.vyplnena) {
      const zaklad = py(Math.max(osaYd.min, 0));
      g += `<path class="graf-plocha" d="${d} L${px(body[body.length - 1].x)} ${zaklad} L${px(body[0].x)} ${zaklad} Z"/>`;
    }
    g += `<path class="graf-cara${r.carkovana ? ' graf-carkovana' : ''}${r.zvyraznena ? ' graf-zvyraznena' : ''}" d="${d}"/>`;
    if (body.length <= 24) for (const b of body) g += `<circle class="graf-bod" cx="${px(b.x)}" cy="${py(b.y)}" r="${r.zvyraznena ? 4.5 : 3.5}"/>`;
    radySvg += g + '</g>';
  });

  const autoPopis = rady.map((r) => {
    const b = (r.body || []).filter((q) => Number.isFinite(q.x) && Number.isFinite(q.y)).sort((p, q) => p.x - q.x);
    if (!b.length) return `${r.nazev}: bez dat`;
    const a = b[0];
    const z = b[b.length - 1];
    return `${r.nazev}: od ${fy(a.y)} (${fx(a.x)}) do ${fy(z.y)} (${fx(z.x)})`;
  }).join('; ') + '.';

  const svg = `<svg class="graf-svg" role="img" aria-labelledby="${gid}-t ${gid}-d" viewBox="0 0 ${sirka} ${vyska}" width="${sirka}" height="${vyska}">`
    + `<title id="${gid}-t">${esc(titulek)}</title><desc id="${gid}-d">${esc(popis || autoPopis)}</desc>`
    + mrizka + osy + popiskyXSvg + popiskyOs + radySvg + '</svg>';
  const leg = legenda(rady.map((r, i) => ({
    nazev: r.nazev,
    vzorek: `${tridaRady(r.trida, i)} graf-vzorek-cara${r.carkovana ? ' graf-vzorek-carkovana' : ''}`,
  })));
  return `<figure class="graf">${svg}<figcaption>${leg}</figcaption></figure>`;
}

/**
 * Svislý sloupcový graf.
 * @param {{titulek:string, popis?:string, polozky:{nazev:string, hodnota:number, trida?:string}[],
 *          osaY?:{popisek?:string, format?:(n:number)=>string}, sirka?:number, vyska?:number, id?:string}} o
 * @returns {string} HTML <figure class="graf">
 */
export function sloupcovyGraf({ titulek, popis, polozky = [], osaY = {}, sirka = 640, vyska = 300, id } = {}) {
  const gid = noveId(id, titulek);
  const fy = osaY.format || ((n) => cislo(n));
  const hodnoty = polozky.map((p) => Number(p.hodnota) || 0);
  const osa = hezkeDeleni(Math.min(0, ...hodnoty, 0), Math.max(...hodnoty, 0) || 1, 5);
  const popiskyY = osa.znacky.map((v) => fy(v));
  const levy = Math.min(sirka * 0.3, 12 + Math.max(...popiskyY.map((t) => t.length)) * 7.4);
  const horni = osaY.popisek ? 34 : 20;
  const dolni = 34;
  const sw = sirka - levy - 10;
  const sv = vyska - horni - dolni;
  const py = (y) => r1(horni + sv - ((y - osa.min) / (osa.max - osa.min)) * sv);
  const sloupec = sw / Math.max(1, polozky.length);
  const sirkaS = Math.min(72, sloupec * 0.6);
  let s = '';
  osa.znacky.forEach((v, i) => {
    s += `<line class="graf-mrizka" x1="${r1(levy)}" y1="${py(v)}" x2="${r1(levy + sw)}" y2="${py(v)}"/>`;
    s += `<text class="graf-popisek" x="${r1(levy - 8)}" y="${r1(py(v) + 4)}" text-anchor="end">${esc(popiskyY[i])}</text>`;
  });
  polozky.forEach((p, i) => {
    const v = hodnoty[i];
    const cx = levy + sloupec * i + sloupec / 2;
    const y0 = py(0);
    const y1 = py(v);
    s += `<g class="${tridaRady(p.trida, i)}"><rect class="graf-sloupec" x="${r1(cx - sirkaS / 2)}" y="${Math.min(y0, y1)}" width="${r1(sirkaS)}" height="${r1(Math.abs(y0 - y1))}" rx="6"/></g>`;
    s += `<text class="graf-hodnota" x="${r1(cx)}" y="${r1(Math.min(y0, y1) - 6)}" text-anchor="middle">${esc(fy(v))}</text>`;
    s += `<text class="graf-popisek" x="${r1(cx)}" y="${r1(horni + sv + 20)}" text-anchor="middle">${esc(p.nazev)}</text>`;
  });
  s += `<line class="graf-osa" x1="${r1(levy)}" y1="${py(0)}" x2="${r1(levy + sw)}" y2="${py(0)}"/>`;
  if (osaY.popisek) s += `<text class="graf-popisek-osy" x="0" y="14">${esc(osaY.popisek)}</text>`;
  const autoPopis = polozky.map((p, i) => `${p.nazev} ${fy(hodnoty[i])}`).join(', ') + '.';
  return `<figure class="graf"><svg class="graf-svg" role="img" aria-labelledby="${gid}-t ${gid}-d" viewBox="0 0 ${sirka} ${vyska}" width="${sirka}" height="${vyska}">`
    + `<title id="${gid}-t">${esc(titulek)}</title><desc id="${gid}-d">${esc(popis || autoPopis)}</desc>${s}</svg></figure>`;
}

/**
 * Tabulka jako textová alternativa ke grafu.
 * @param {{caption:string, sloupce:string[], radky:(string|number)[][], popisek?:string, stack?:boolean}} o
 *   Čísla v buňkách se naformátují funkcí cislo() a zarovnají vpravo; řetězce se jen escapují.
 *   První buňka řádku je záhlaví řádku (<th scope="row">).
 * @returns {string} HTML <div class="table-wrap" role="region" tabindex="0"><table>…
 */
export function tabulkaDat({ caption, sloupce = [], radky = [], popisek, stack = false } = {}) {
  const jeCislo = (v) => typeof v === 'number' && Number.isFinite(v);
  const bunka = (v) => (jeCislo(v) ? esc(cislo(v)) : esc(v));
  const vpravo = sloupce.map((_, i) => i > 0 && radky.length > 0 && radky.every((r) => jeCislo(r[i]) || /^[\d\s ,.−-]+(\s| )?(Kč|%)?$/.test(String(r[i] ?? ''))));
  const hlava = `<thead><tr>${sloupce.map((s, i) => `<th scope="col"${vpravo[i] ? ' class="r"' : ''}>${esc(s)}</th>`).join('')}</tr></thead>`;
  const telo = `<tbody>${radky.map((r) => `<tr>${r.map((v, i) => (i === 0
    ? `<th scope="row">${bunka(v)}</th>`
    : `<td${vpravo[i] ? ' class="r"' : ''}${stack ? ` data-label="${esc(sloupce[i])}"` : ''}>${bunka(v)}</td>`)).join('')}</tr>`).join('')}</tbody>`;
  return `<div class="table-wrap" role="region" aria-label="Tabulka: ${esc(popisek || caption)}" tabindex="0">`
    + `<table${stack ? ' class="stack-table"' : ''}><caption>${esc(caption)}</caption>${hlava}${telo}</table></div>`;
}
