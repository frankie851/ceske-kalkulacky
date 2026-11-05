// Formátování čísel, částek, procent a dat po česku (cs-CZ).
// Čistý ES modul bez závislostí – běží v prohlížeči i v Node (filtry Eleventy).
// Všechny mezery uvnitř výstupu jsou pevné (U+00A0), aby se částka nezalomila.

export const NBSP = ' ';

const cache = new Map();
function formatovac(des) {
  if (!cache.has(des)) {
    cache.set(des, new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: des, maximumFractionDigits: des }));
  }
  return cache.get(des);
}

function jeCislo(n) {
  return typeof n === 'number' && Number.isFinite(n);
}

function naCislo(n) {
  if (typeof n === 'string' && n.trim() !== '') {
    const c = Number(n.replace(/[\s  ]/g, '').replace(',', '.'));
    return Number.isFinite(c) ? c : NaN;
  }
  return typeof n === 'number' ? n : NaN;
}

/** Číslo s českým oddělovačem tisíců (pevná mezera) a desetinnou čárkou.
 *  cislo(45600) → "45 600"; cislo(0.5, 1) → "0,5"; neplatný vstup → "–" */
export function cislo(n, des = 0) {
  const c = naCislo(n);
  if (!jeCislo(c)) return '–';
  // −0 by se vypsala jako "-0"
  const hodnota = Object.is(c, -0) ? 0 : c;
  return formatovac(des).format(hodnota).replace(/[\s ]/g, NBSP).replace(/−/g, '-');
}

/** Částka v korunách: kc(45600) → "45 600 Kč" (obě mezery pevné). */
export function kc(n, des = 0) {
  const t = cislo(n, des);
  return t === '–' ? t : `${t}${NBSP}Kč`;
}

/** Procenta. Vstup je hodnota v procentech, ne podíl: procenta(15) → "15 %", procenta(0.5, 1) → "0,5 %". */
export function procenta(n, des = 0) {
  const t = cislo(n, des);
  return t === '–' ? t : `${t}${NBSP}%`;
}

/** Datum z ISO řetězce "2026-11-04" (nebo objektu Date) → "4. 11. 2026" s pevnými mezerami. */
export function datum(iso) {
  if (iso instanceof Date) {
    if (Number.isNaN(iso.getTime())) return '';
    return `${iso.getUTCDate()}.${NBSP}${iso.getUTCMonth() + 1}.${NBSP}${iso.getUTCFullYear()}`;
  }
  if (typeof iso !== 'string') return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!m) return '';
  return `${Number(m[3])}.${NBSP}${Number(m[2])}.${NBSP}${m[1]}`;
}
