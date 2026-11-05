// Konfigurace Eleventy 3 pro web Spočítáno.
// Vstup src/, výstup _site/. Do prohlížeče Eleventy nic nepřidává; vlastní JS je v src/js/
// a v klientských modulech nástrojů (src/nastroje/<id>/*.js).
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { kc, cislo, procenta, datum } from './src/js/format.js';
import { skryteNastroje } from './src/_lib/nastroje.js';

// Jediný inline skript webu: nastaví režim (světlý/tmavý) ještě před vykreslením.
// CSP ho povoluje přes sha256 (globální data cspHash). Při změně textu se hash přepočítá sám.
export const TEMA_SKRIPT =
  'try{var r=localStorage.getItem("spocitano-rezim");if(r==="light"||r==="dark")document.documentElement.dataset.theme=r}catch(e){}';

const PISMA = [
  ['nunito', [400, 600, 700, 800]],
  ['fredoka', [500, 600]],
];

// Klientské moduly nástrojů: jen *.js, ne testy, ne data šablon (*.11tydata.js)
export function jeKlientskyModul(relCesta) {
  const p = relCesta.split(path.sep).join('/');
  if (p.split('/').some((c) => c === 'test' || c === 'tests')) return false;
  const soubor = p.split('/').pop();
  if (!soubor.includes('.')) return true; // složka
  return (soubor.endsWith('.js') || soubor.endsWith('.css')) && !soubor.endsWith('.11tydata.js') && !soubor.endsWith('.test.js');
}

/** Bezpečné JSON pro <script type="application/json">: nic nemůže ukončit značku script. */
export function bezpecnyJson(hodnota) {
  return JSON.stringify(hodnota ?? null)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

export default function (eleventyConfig) {
  // Stránky skrytých (nezveřejněných) nástrojů se bez ZOBRAZIT_SKRYTE=1 nevytvoří.
  const skryte = skryteNastroje();
  eleventyConfig.addPreprocessor('skryte-nastroje', 'njk,md,html', (data) => {
    if (data.nastroj && skryte.has(data.nastroj)) return false;
  });

  // ---------- Statické soubory ----------
  eleventyConfig.addPassthroughCopy('src/css');
  eleventyConfig.addPassthroughCopy('src/js');
  eleventyConfig.addPassthroughCopy('src/img');
  // Skryté nástroje: ani jejich JS a CSS se do veřejného webu nekopírují.
  eleventyConfig.addPassthroughCopy({ 'src/nastroje': 'nastroje' }, {
    filter: (rel) => jeKlientskyModul(rel) && !skryte.has(rel.split(path.sep).join('/').split('/')[0]),
  });

  // Veřejné datové soubory nástroje (např. velké profily spotřeby), které stránka načítá ze svého
  // webu až na vyžádání: nastroj.json → "verejneSoubory": ["data/tdd/*.json"] (cesty relativně ke složce).
  for (const slozka of fs.readdirSync('src/nastroje', { withFileTypes: true })) {
    const soubor = path.join('src/nastroje', slozka.name, 'nastroj.json');
    if (!slozka.isDirectory() || !fs.existsSync(soubor) || skryte.has(slozka.name)) continue;
    for (const vzor of JSON.parse(fs.readFileSync(soubor, 'utf8')).verejneSoubory || []) {
      eleventyConfig.addPassthroughCopy({ [`src/nastroje/${slozka.name}/${vzor}`]: `nastroje/${slozka.name}/${path.posix.dirname(vzor)}` });
    }
  }

  const pisma = {};
  for (const [rodina, rezy] of PISMA) {
    for (const rez of rezy) {
      for (const sada of ['latin', 'latin-ext']) {
        const soubor = `${rodina}-${sada}-${rez}-normal.woff2`;
        pisma[`node_modules/@fontsource/${rodina}/files/${soubor}`] = `fonts/${soubor}`;
      }
    }
  }
  eleventyConfig.addPassthroughCopy(pisma);

  // ---------- Co nezpracovávat ----------
  for (const vzor of ['designs/**', 'docs/**', 'tools/**', 'test/**', '**/test/**', 'README.md', 'prompts/**']) {
    eleventyConfig.ignores.add(vzor);
  }
  eleventyConfig.addWatchTarget('src/nastroje/**/*.json');

  // ---------- Globální data ----------
  eleventyConfig.addGlobalData('temaSkript', TEMA_SKRIPT);
  eleventyConfig.addGlobalData('cspHash', crypto.createHash('sha256').update(TEMA_SKRIPT, 'utf8').digest('base64'));

  // ---------- Filtry ----------
  eleventyConfig.addFilter('kc', (n, des = 0) => kc(n, des));
  eleventyConfig.addFilter('cislo', (n, des = 0) => cislo(n, des));
  eleventyConfig.addFilter('procenta', (n, des = 0) => procenta(n, des));
  eleventyConfig.addFilter('datum', (iso) => datum(iso));
  eleventyConfig.addFilter('json', (v) => bezpecnyJson(v));

  // Najde nástroj (nebo záložku nástroje, např. osvc-2027) podle id
  eleventyConfig.addFilter('najdiNastroj', (nastroje, id) => {
    for (const n of nastroje || []) {
      if (n.id === id) return n;
      for (const z of n.zalozky || []) if (z.id === id) return { ...n, cta: undefined, otazka: undefined, ...z, rodic: n.id };
    }
    return null;
  });
  eleventyConfig.addFilter('vKategorii', (nastroje, slug) => (nastroje || []).filter((n) => n.kategorie === slug));
  eleventyConfig.addFilter('aktivni', (nastroje) => (nastroje || []).filter((n) => n.stav === 'aktivni'));
  eleventyConfig.addFilter('najdiKategorii', (kategorie, slug) => (kategorie || []).find((k) => k.slug === slug) || null);
  // Nejnovější datum ověření pravidel mezi aktivními nástroji (ISO řetězec)
  eleventyConfig.addFilter('posledniOvereni', (nastroje) => {
    const data = (nastroje || []).map((n) => n.meta?.overeno).filter(Boolean).sort();
    return data.length ? data[data.length - 1] : null;
  });
  // Česká množná čísla: 1 nástroj, 2–4 nástroje, 5 nástrojů
  eleventyConfig.addFilter('mnozne', (n, jeden, dva, pet) => {
    const a = Math.abs(n);
    return `${n} ${a === 1 ? jeden : a >= 2 && a <= 4 ? dva : pet}`;
  });
  // Vyhledávací index s URL včetně pathPrefix (pro klientský skript)
  const urlFiltr = eleventyConfig.getFilter('url');
  eleventyConfig.addFilter('sPrefixem', (polozky) =>
    (polozky || []).map((p) => ({ ...p, url: p.url ? urlFiltr(p.url) : null })));

  return {
    dir: { input: 'src', output: '_site', includes: '_includes', data: '_data' },
    templateFormats: ['njk', 'md'],
    markdownTemplateEngine: 'njk',
    htmlTemplateEngine: 'njk',
    pathPrefix: process.env.PATH_PREFIX || '/',
  };
}
