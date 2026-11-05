// Kontrola sestaveného webu (_site): přístupnost (axe), přetečení na 360 px, cizí požadavky,
// chyby v konzoli, obsah bez JavaScriptu a viditelnost bezplatné pomoci v sekci Dluhy.
// Použití:
//   npm run build && npm run kontrola
//   PATH_PREFIX=/ceske-kalkulacky/ npx eleventy && PATH_PREFIX=/ceske-kalkulacky/ npm run kontrola
//   node tools/kontroly/kontrola-webu.mjs penize/plan48/    # jen vybrané stránky
import fs from 'node:fs';
import path from 'node:path';
import { spustitProhlizec } from './prohlizec.mjs';
import { spustitServer, seznamStranek, KOREN } from './server.mjs';

const { AxePuppeteer } = await import('@axe-core/puppeteer');
const prefix = process.env.PATH_PREFIX || '/';
const vybrane = process.argv.slice(2);
const stranky = vybrane.length ? vybrane : seznamStranek();
if (!stranky.length) { console.error('V _site nejsou žádné stránky – nejdřív npm run build.'); process.exit(1); }

const { zaklad, zavrit } = await spustitServer({ prefix });
const host = new URL(zaklad).host;
const browser = await spustitProhlizec();
const vysledky = [];

async function novaStranka({ js = true } = {}) {
  const page = await browser.newPage();
  await page.setJavaScriptEnabled(js);
  const zaznam = { cizi: [], konzole: [] };
  await page.setRequestInterception(true);
  page.on('request', (req) => {
    const u = new URL(req.url());
    if (u.host === host || u.protocol === 'data:' || u.protocol === 'about:' || u.protocol === 'blob:') req.continue();
    else { zaznam.cizi.push(req.url()); req.abort(); }
  });
  page.on('console', (m) => { if (m.type() === 'error') zaznam.konzole.push(m.text()); });
  page.on('pageerror', (e) => zaznam.konzole.push(String(e)));
  return { page, zaznam };
}

for (const s of stranky) {
  const url = zaklad + s;
  const v = { stranka: '/' + s, chyby: [] };
  const { page, zaznam } = await novaStranka();
  for (const rezim of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }]);
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    for (const x of r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')) {
      v.chyby.push(`axe ${rezim}: ${x.id} ×${x.nodes.length} (${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')})`);
    }
  }
  // Přepínač tmavého režimu (data-theme) – stejná kontrola kontrastu jako systémový tmavý
  await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await page.setViewport({ width: 360, height: 800 });
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await page.evaluate(() => document.fonts.ready);
  const pretek = await page.evaluate(() => {
    const w = document.documentElement.clientWidth;
    const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
    const viniky = [];
    if (sw > w) for (const el of document.querySelectorAll('body *')) {
      const r = el.getBoundingClientRect();
      if (r.right > w + 1 && r.width > 0) {
        let skryto = false;
        for (let p = el.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p).overflowX; if (o !== 'visible') { skryto = true; break; } }
        if (!skryto) viniky.push(`${el.tagName.toLowerCase()}.${String(el.className).split(' ').join('.')}`);
      }
      if (viniky.length > 4) break;
    }
    return { w, sw, viniky };
  });
  if (pretek.sw > pretek.w) v.chyby.push(`přetečení 360 px: ${pretek.sw} px (${pretek.viniky.join('; ')})`);
  // Dluhy: odkaz na bezplatnou pomoc bez posouvání (360 × 640)
  if (s.startsWith('dluhy/')) {
    await page.setViewport({ width: 360, height: 640 });
    await page.goto(url, { waitUntil: 'networkidle0' });
    const vidno = await page.evaluate(() => [...document.querySelectorAll('[data-pomoc]')].some((el) => {
      const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
    }));
    if (!vidno) v.chyby.push('Dluhy: odkaz na bezplatnou pomoc ([data-pomoc]) není vidět bez posouvání na 360 × 640');
  }
  await page.close();
  if (zaznam.cizi.length) v.chyby.push(`cizí požadavky: ${[...new Set(zaznam.cizi)].join(', ')}`);
  if (zaznam.konzole.length) v.chyby.push(`chyby v konzoli: ${[...new Set(zaznam.konzole)].slice(0, 3).join(' | ')}`);

  // Bez JavaScriptu: stránka má h1 a hlavní obsah; nástroj ukazuje ukázkový výsledek ([data-ukazka])
  const bez = await novaStranka({ js: false });
  await bez.page.setViewport({ width: 390, height: 844 });
  await bez.page.goto(url, { waitUntil: 'networkidle0' });
  const nojs = await bez.page.evaluate(() => ({
    h1: !!document.querySelector('h1')?.textContent.trim(),
    nastroj: !!document.querySelector('#pravidla'),
    ukazka: !!document.querySelector('[data-ukazka]')?.textContent.trim(),
  }));
  if (!nojs.h1) v.chyby.push('bez JS: chybí h1');
  if (nojs.nastroj && !nojs.ukazka) v.chyby.push('bez JS: nástroj neukazuje ukázkový výsledek ([data-ukazka])');
  await bez.page.close();

  vysledky.push(v);
  console.log(`${v.chyby.length ? '✗' : '✓'} /${s}${v.chyby.length ? '\n    ' + v.chyby.join('\n    ') : ''}`);
}

await browser.close();
await zavrit();
const chyb = vysledky.reduce((a, v) => a + v.chyby.length, 0);
fs.mkdirSync(path.join(KOREN, 'docs/kontroly'), { recursive: true });
if (!vybrane.length) fs.writeFileSync(path.join(KOREN, 'docs/kontroly/web-vysledky.json'), JSON.stringify({ datum: new Date().toISOString(), prefix, stranek: vysledky.length, chyb, stranky: vysledky }, null, 2));
console.log(chyb ? `\nCELKEM CHYB: ${chyb} na ${vysledky.filter((v) => v.chyby.length).length} stránkách` : `\nVšechny kontroly prošly (${vysledky.length} stránek).`);
process.exit(chyb ? 1 : 0);
