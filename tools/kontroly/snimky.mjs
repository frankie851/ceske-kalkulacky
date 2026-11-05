// Snímky obrazovky všech stránek variant: desktop 1440 px a mobil 390 px (celá stránka).
// Použití:
//   node tools/kontroly/snimky.mjs                       # všechny varianty → designs/screenshots/*.png
//   node tools/kontroly/snimky.mjs designs/b-…  /cesta   # jedna varianta do jiné složky (náhled)
//   node tools/kontroly/snimky.mjs --webp                # navíc WebP výřezy pro porovnani.html
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { spustitProhlizec } from './prohlizec.mjs';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DESIGNS = path.join(KOREN, 'designs');
const STRANKY = ['index', 'kategorie', 'kalkulacka', 'pruvodce'];
const ZARIZENI = [
  { nazev: 'desktop', width: 1440, height: 900 },
  { nazev: 'mobil', width: 390, height: 844 },
];

const args = process.argv.slice(2);
const webp = args.includes('--webp');
const poz = args.filter((a) => !a.startsWith('--'));
const slozky = poz[0] ? [path.resolve(poz[0])] : fs.readdirSync(DESIGNS).filter((n) => /^[a-d]-/.test(n)).sort().map((n) => path.join(DESIGNS, n));
const vystup = poz[1] ? path.resolve(poz[1]) : path.join(DESIGNS, 'screenshots');
fs.mkdirSync(vystup, { recursive: true });
const webpDir = path.join(KOREN, 'tools/kontroly/.webp');
if (webp) fs.mkdirSync(webpDir, { recursive: true });

const browser = await spustitProhlizec();
const page = await browser.newPage();
await page.setRequestInterception(true);
page.on('request', (req) => {
  const u = new URL(req.url());
  if (['file:', 'data:', 'about:', 'blob:'].includes(u.protocol) || ['fonts.googleapis.com', 'fonts.gstatic.com'].includes(u.hostname)) req.continue();
  else req.abort();
});
// Snímky ve výchozím (světlém) režimu systému; varianta C má výchozí tmavý režim sama
await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }, { name: 'prefers-reduced-motion', value: 'reduce' }]);

for (const slozka of slozky) {
  const v = path.basename(slozka);
  for (const s of STRANKY) {
    const soubor = path.join(slozka, `${s}.html`);
    if (!fs.existsSync(soubor)) { console.log(`chybí ${soubor}`); continue; }
    for (const z of ZARIZENI) {
      await page.setViewport({ width: z.width, height: z.height, deviceScaleFactor: 1 });
      await page.goto(pathToFileURL(soubor).href, { waitUntil: 'networkidle0', timeout: 60000 });
      await page.evaluate(() => document.fonts.ready);
      const cil = path.join(vystup, `${v}-${s}-${z.nazev}.png`);
      await page.screenshot({ path: cil, fullPage: true });
      if (webp) {
        // Výřez pro porovnání: desktop první obrazovka + kus pod ní, mobil delší pás
        const vyska = z.nazev === 'desktop' ? 1800 : 2400;
        const plna = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.screenshot({
          path: path.join(webpDir, `${v}-${s}-${z.nazev}.webp`), type: 'webp', quality: 55,
          clip: { x: 0, y: 0, width: z.width, height: Math.min(vyska, plna) }, captureBeyondViewport: true,
        });
      }
      console.log(`✓ ${path.relative(KOREN, cil)}`);
    }
  }
}
await browser.close();
