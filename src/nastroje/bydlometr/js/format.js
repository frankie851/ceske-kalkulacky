// Formátování a čtení čísel v češtině. Bez vazby na DOM.

const czk = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 });

/** 20337.4 → „20 337 Kč“ */
export function formatCZK(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${czk.format(Math.round(value))} Kč`;
}

/** Změna se znaménkem: +1 234 Kč / −1 234 Kč */
export function formatDeltaCZK(value) {
  if (!Number.isFinite(value)) return '—';
  const r = Math.round(value);
  if (r === 0) return '0 Kč';
  return `${r > 0 ? '+' : '−'}${czk.format(Math.abs(r))} Kč`;
}

/** 0.4 → „40 %“; formatPct(5.79, 2, false) → „5,79 %“ */
export function formatPct(value, digits = 0, isShare = true) {
  if (!Number.isFinite(value)) return '—';
  const v = isShare ? value * 100 : value;
  return `${new Intl.NumberFormat('cs-CZ', { minimumFractionDigits: digits, maximumFractionDigits: digits }).format(v)} %`;
}

export function formatNumber(value, digits = 0) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: digits }).format(value);
}

/** „3 500 000“, „4,94“, „4.94“, „1 500 000 Kč“ → číslo; prázdné/neplatné → NaN */
export function parseNumber(text) {
  if (typeof text === 'number') return text;
  if (typeof text !== 'string') return NaN;
  const cleaned = text.replace(/[\s  ]/g, '').replace(/kč|%/gi, '').replace(',', '.');
  if (cleaned === '' || !/^-?\d*\.?\d+$/.test(cleaned)) return NaN;
  return Number(cleaned);
}

/** Datum ve formátu YYYY-MM-DD → „7. 10. 2026“ */
export function formatDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso ?? '');
  if (!m) return iso ?? '';
  return `${Number(m[3])}. ${Number(m[2])}. ${m[1]}`;
}
