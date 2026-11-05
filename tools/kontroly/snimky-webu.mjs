// Snímky sestaveného webu: desktop 1440 px a mobil 390 px (celá stránka), světlý režim;
// pro vybrané stránky i tmavý režim. Výstup: docs/snimky/vlna-1/ (nebo složka z argumentu).
// Použití: npm run build && npm run snimky [-- cilova/slozka [stranka/ …]]  (bez stránek = všechny)
import fs from 'node:fs';
import path from 'node:path';
import { spustitProhlizec } from './prohlizec.mjs';
import { spustitServer, seznamStranek, KOREN } from './server.mjs';

const vystup = path.resolve(process.argv[2] || path.join(KOREN, 'docs/snimky/vlna-1'));
fs.mkdirSync(vystup, { recursive: true });
const vybrane = process.argv.slice(3);
const TMAVE = ['', 'penize/plan48/', 'penize/penzijko-kompas/', 'dane-podnikani/mam-eet/', 'dane-podnikani/mam-eet/osvc-2027/', ...vybrane];
const nazev = (s) => (s.replace(/\/$/, '').replace(/\.html$/, '').replace(/\//g, '-') || 'uvod');

const { zaklad, zavrit } = await spustitServer({ prefix: process.env.PATH_PREFIX || '/' });
const browser = await spustitProhlizec();
const page = await browser.newPage();
for (const s of (vybrane.length ? vybrane : seznamStranek())) {
  if (s === '404.html') continue;
  for (const rezim of TMAVE.includes(s) ? ['light', 'dark'] : ['light']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }, { name: 'prefers-reduced-motion', value: 'reduce' }]);
    for (const [zar, w, h] of [['desktop', 1440, 900], ['mobil', 390, 844]]) {
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(zaklad + s, { waitUntil: 'networkidle0' });
      await page.evaluate(() => document.fonts.ready);
      const soubor = path.join(vystup, `${nazev(s)}-${zar}${rezim === 'dark' ? '-tmavy' : ''}.png`);
      await page.screenshot({ path: soubor, fullPage: true });
      console.log('✓', path.relative(KOREN, soubor));
    }
  }
}
await browser.close();
await zavrit();
