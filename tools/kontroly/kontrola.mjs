// Kontrola návrhů designu: přístupnost (axe), přetečení na 360 px,
// externí požadavky a povinný obsah.
// Použití:
//   node tools/kontroly/kontrola.mjs                 # všechny varianty + rozcestník + porovnání
//   node tools/kontroly/kontrola.mjs designs/a-klidna-jistota
//   node tools/kontroly/kontrola.mjs designs/index.html
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spustitProhlizec } from './prohlizec.mjs';

const { AxePuppeteer } = await import('@axe-core/puppeteer');

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DESIGNS = path.join(KOREN, 'designs');
const POVOLENE_HOSTY = new Set(['fonts.googleapis.com', 'fonts.gstatic.com']);
const STRANKY = ['index.html', 'kategorie.html', 'kalkulacka.html', 'pruvodce.html'];

const norm = (s) => s.replace(/[   ]/g, ' ').replace(/\s+/g, ' ');

// Povinné texty (viditelný text stránky) podle typu stránky
const TEXTY = {
  vse: ['Pravidla ověřena k 4. 11. 2026', 'poradenství'],
  'index.html': ['Dluhy', 'bezplatn', 'Plán48', 'Mám EET?'],
  'kategorie.html': ['Plán48', 'Penzijko kompas', 'Zdaním to?', 'Inflační kalkulačka'],
  'kalkulacka.html': ['45 600 Kč', '6 840 Kč', '2 400 Kč', '4 080 Kč', '15 600', '30 000', '48 000',
    'Návrh, zatím neschváleno', '8 160 Kč', 'money.cz'],
  'pruvodce.html': ['16 800 Kč', 'EET OFF', '1. 12. 2026', '1. 1. 2027', 'Jak', 'Hotovost', 'QR'],
};
// Zakázané texty
const ZAKAZANE = { 'pruvodce.html': ['300 000'] };

// Komponenty, které musí varianta ukázat aspoň na jedné stránce (HTML+CSS)
const KOMPONENTY = [
  ['vyhledávání (role="search")', /role=["']search["']/],
  ['input type="search"', /type=["']search["']/],
  ['chybový stav (aria-invalid)', /aria-invalid=["']true["']/],
  ['tabulka s caption', /<caption/],
  ['graf SVG s role="img"', /<svg[^>]*role=["']img["']/],
  ['tiskový styl', /@media\s+print/],
  ['prefers-reduced-motion', /prefers-reduced-motion/],
  ['prefers-color-scheme', /prefers-color-scheme:\s*dark/],
  ['přepínač režimu', /id=["']t-dark["']/],
  ['skip link / main', /<main/],
  ['štítek Návrh', /Návrh, zatím neschváleno/],
  ['kontrolní seznam', /1\.(&nbsp;|\s| )12\.(&nbsp;|\s| )2026/],
];

function seznamCilu(args) {
  const cile = [];
  const pridatSlozku = (d) => {
    for (const s of STRANKY) cile.push({ soubor: path.join(d, s), varianta: path.basename(d), stranka: s });
  };
  if (args.length === 0) {
    for (const d of fs.readdirSync(DESIGNS).filter((n) => /^[a-d]-/.test(n)).sort()) pridatSlozku(path.join(DESIGNS, d));
    for (const s of ['index.html', 'porovnani.html']) {
      const p = path.join(DESIGNS, s);
      if (fs.existsSync(p)) cile.push({ soubor: p, varianta: '_rozcestnik', stranka: s });
    }
  } else {
    for (const a of args) {
      const p = path.resolve(a);
      if (fs.statSync(p).isDirectory()) pridatSlozku(p);
      else cile.push({ soubor: p, varianta: '_soubor', stranka: path.basename(p) });
    }
  }
  return cile;
}

async function zkontrolovat(browser, cil) {
  const vysledek = { ...cil, soubor: path.relative(KOREN, cil.soubor), chyby: [], axe: {}, cizi: [], pretekani: null };
  if (!fs.existsSync(cil.soubor)) {
    vysledek.chyby.push('soubor neexistuje');
    return vysledek;
  }
  const page = await browser.newPage();
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = new URL(req.url());
    if (['file:', 'data:', 'about:', 'blob:'].includes(u.protocol) || POVOLENE_HOSTY.has(u.hostname)) req.continue();
    else { vysledek.cizi.push(req.url()); req.abort(); }
  });
  const url = pathToFileURL(cil.soubor).href;

  for (const rezim of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }]);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const r = await new AxePuppeteer(page)
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
      .analyze();
    const vazne = r.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
    vysledek.axe[rezim] = {
      vazne: vazne.map((v) => ({ id: v.id, impact: v.impact, pocet: v.nodes.length, priklad: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} :: ${n.failureSummary?.split('\n').slice(0, 2).join(' ')}`) })),
      ostatni: r.violations.filter((v) => !vazne.includes(v)).map((v) => `${v.id} (${v.impact})`),
    };
    if (vazne.length) vysledek.chyby.push(`axe ${rezim}: ${vazne.map((v) => `${v.id}×${v.nodes.length}`).join(', ')}`);
  }

  // Přetečení na 360 px (světlý režim)
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setViewport({ width: 360, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  vysledek.pretekani = await page.evaluate(() => {
    const sirka = document.documentElement.clientWidth;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const viniky = [];
    if (sw > sirka) {
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.right > sirka + 1 && r.width > 0) {
          let skryto = false;
          for (let p = el.parentElement; p; p = p.parentElement) {
            const ox = getComputedStyle(p).overflowX;
            if (ox === 'auto' || ox === 'scroll' || ox === 'hidden' || ox === 'clip') { skryto = true; break; }
          }
          if (!skryto) viniky.push(`${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.split(' ').join('.') : ''} right=${Math.round(r.right)}`);
        }
        if (viniky.length > 5) break;
      }
    }
    return { sirka, scrollWidth: sw, preteka: sw > sirka, viniky };
  });
  if (vysledek.pretekani.preteka) vysledek.chyby.push(`přetečení na 360 px: scrollWidth ${vysledek.pretekani.scrollWidth} (${vysledek.pretekani.viniky.join('; ')})`);

  // Povinný obsah (jen u stránek variant)
  if (!cil.varianta.startsWith('_')) {
    const text = norm(await page.evaluate(() => document.body.innerText));
    for (const t of [...TEXTY.vse, ...(TEXTY[cil.stranka] || [])]) {
      if (!text.includes(t)) vysledek.chyby.push(`chybí text: „${t}“`);
    }
    for (const t of ZAKAZANE[cil.stranka] || []) if (text.includes(t)) vysledek.chyby.push(`zakázaný text: „${t}“`);
    const html = fs.readFileSync(cil.soubor, 'utf8');
    if (/<script/i.test(html)) vysledek.chyby.push('stránka obsahuje <script>');
    if (!/<html[^>]*lang=["']cs["']/.test(html)) vysledek.chyby.push('chybí lang="cs"');
    const imgs = [...html.matchAll(/<img[^>]*src=["']([^"']+)["']/g)].map((m) => m[1]).filter((s) => /^https?:/.test(s));
    if (imgs.length) vysledek.chyby.push(`externí obrázky: ${imgs.join(', ')}`);
  }
  if (vysledek.cizi.length) vysledek.chyby.push(`cizí požadavky: ${[...new Set(vysledek.cizi)].join(', ')}`);
  await page.close();
  return vysledek;
}

function zkontrolovatKomponenty(slozka) {
  let vse = '';
  for (const f of fs.readdirSync(slozka)) if (/\.(html|css)$/.test(f)) vse += fs.readFileSync(path.join(slozka, f), 'utf8');
  return KOMPONENTY.filter(([, re]) => !re.test(vse)).map(([n]) => `chybí komponenta: ${n}`);
}

const args = process.argv.slice(2);
const cile = seznamCilu(args);
const browser = await spustitProhlizec();
const vysledky = [];
for (const c of cile) {
  const v = await zkontrolovat(browser, c);
  vysledky.push(v);
  console.log(`${v.chyby.length ? '✗' : '✓'} ${v.soubor}${v.chyby.length ? '\n    ' + v.chyby.join('\n    ') : ''}`);
  for (const rezim of ['light', 'dark']) for (const z of v.axe[rezim]?.vazne || []) console.log(`      [${rezim}] ${z.id}: ${z.priklad.join(' | ')}`);
}
const slozky = [...new Set(cile.filter((c) => !c.varianta.startsWith('_')).map((c) => path.dirname(c.soubor)))];
const komponenty = {};
for (const s of slozky) {
  const ch = zkontrolovatKomponenty(s);
  komponenty[path.basename(s)] = ch;
  console.log(`${ch.length ? '✗' : '✓'} komponenty ${path.basename(s)}${ch.length ? ': ' + ch.join(', ') : ''}`);
}
await browser.close();

const pocetChyb = vysledky.reduce((a, v) => a + v.chyby.length, 0) + Object.values(komponenty).reduce((a, c) => a + c.length, 0);
if (args.length === 0) {
  fs.writeFileSync(path.join(DESIGNS, 'kontrola-vysledky.json'), JSON.stringify({
    datum: new Date().toISOString(),
    souhrn: {
      stranek: vysledky.length,
      axe_vazne: vysledky.reduce((a, v) => a + (v.axe.light?.vazne.length || 0) + (v.axe.dark?.vazne.length || 0), 0),
      pretekani_360: vysledky.filter((v) => v.pretekani?.preteka).length,
      cizi_pozadavky: vysledky.reduce((a, v) => a + v.cizi.length, 0),
      chyb_celkem: pocetChyb,
    },
    komponenty,
    stranky: vysledky,
  }, null, 2));
}
console.log(pocetChyb ? `\nCELKEM CHYB: ${pocetChyb}` : '\nVšechny kontroly prošly.');
process.exit(pocetChyb ? 1 : 0);
