// Načtení rules.json a defaults.json a práce s položkami {value, source, date, …}.
// collectItems a dataDateRange jsou čisté funkce (testovatelné v Node), loadData používá fetch.

export const isItem = (o) => o !== null && typeof o === 'object' && 'value' in o && 'source' in o;

/** Projde JSON a vrátí všechny položky se zdrojem jako [{path, item}]. */
export function collectItems(obj, path = '') {
  if (isItem(obj)) return [{ path, item: obj }];
  if (obj === null || typeof obj !== 'object') return [];
  return Object.entries(obj).flatMap(([k, v]) => (k === 'meta' ? [] : collectItems(v, path ? `${path}.${k}` : k)));
}

/** Unikátní seznam zdrojů s odkazem (pro patičku). */
export function sourceList(...jsons) {
  const seen = new Map();
  for (const { item } of jsons.flatMap((j) => collectItems(j))) {
    if (/^(předpoklad|ukázková hodnota|návrh aplikace)/i.test(item.source)) continue;
    const key = item.url || item.source;
    if (!seen.has(key)) seen.set(key, { source: item.source, url: item.url, date: item.date });
  }
  return [...seen.values()];
}

export async function loadData(base = '.') {
  const [rules, defaults] = await Promise.all(
    ['rules.json', 'defaults.json'].map(async (f) => {
      const res = await fetch(`${base}/${f}`, { cache: 'no-cache' });
      if (!res.ok) throw new Error(`Nelze načíst ${f} (${res.status})`);
      return res.json();
    }),
  );
  return { rules, defaults };
}
