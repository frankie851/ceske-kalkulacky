// Přepínač světlého/tmavého režimu.
// Bez JS funguje přepínač v CSS přes :has(#t-light:checked); tento modul volbu jen pamatuje
// v localStorage['spocitano-rezim'] a nastavuje data-theme na <html>. „Auto“ atribut smaže.
// Inline skript v <head> (viz eleventy.config.js) nastaví data-theme ještě před vykreslením.

export const KLIC = 'spocitano-rezim';
const PLATNE = ['light', 'dark'];

/** Převede uloženou hodnotu na režim: 'light' | 'dark' | 'auto'. */
export function normalizujRezim(hodnota) {
  return PLATNE.includes(hodnota) ? hodnota : 'auto';
}

function cti() {
  try { return normalizujRezim(window.localStorage.getItem(KLIC)); } catch { return 'auto'; }
}

function uloz(rezim) {
  try {
    if (rezim === 'auto') window.localStorage.removeItem(KLIC);
    else window.localStorage.setItem(KLIC, rezim);
  } catch { /* soukromé okno nebo zablokované úložiště: volba platí jen pro tuto stránku */ }
}

export function nastavRezim(rezim, koren = document.documentElement) {
  if (rezim === 'light' || rezim === 'dark') koren.dataset.theme = rezim;
  else delete koren.dataset.theme;
}

function init() {
  const radia = document.querySelectorAll('input[name="rezim"]');
  if (!radia.length) return;
  const rezim = cti();
  nastavRezim(rezim);
  for (const r of radia) {
    r.checked = r.value === rezim;
    r.addEventListener('change', () => {
      if (!r.checked) return;
      const novy = normalizujRezim(r.value);
      nastavRezim(novy);
      uloz(novy);
    });
  }
}

/** Před tiskem otevře sbalené bloky (např. „Odkud to víme“), aby se zdroje vytiskly. */
function otevritProTisk() {
  for (const d of document.querySelectorAll('details[data-tisk-otevrit]')) d.open = true;
}

if (typeof document !== 'undefined') {
  init();
  window.addEventListener('beforeprint', otevritProTisk);
}
