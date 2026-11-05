// Druhá reprodukce: desetinná čárka a mezera v polích type=number (vklad, poplatek za správu) – výchozí locale prohlížeče vs. cs-CZ.
// Spuštění: node penzijko-kompas-carka.mjs → prohlizec-carka.json, cisla-360.png
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { spustServer, CHROME, axe } from './prohlizec-lib.mjs';

const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const KOREN = '/tmp/revize/repos/penzijko-kompas';
const VYSTUP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../penzijko-kompas');
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
const srv = await spustServer(KOREN);
const out = { datum: new Date().toISOString(), locale: {} };

for (const [jmeno, args] of [['vychozi-en', []], ['cs-CZ', ['--lang=cs-CZ']]]) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', ...args] });
  const page = await browser.newPage();
  if (jmeno === 'cs-CZ') await page.setExtraHTTPHeaders({ 'Accept-Language': 'cs-CZ,cs;q=0.9' });
  await page.setViewport({ width: 360, height: 800 });
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  const r = { navigatorLanguage: await page.evaluate(() => navigator.language), pokusy: {} };
  for (const [pole, text] of [['vklad', '1500,50'], ['vklad', '1 500'], ['vklad', '1.500'], ['sprava', '0,85'], ['sprava', '0.85'], ['zustatek', '150 000,50']]) {
    await page.evaluate((p) => { const i = document.querySelector(`input[name=${p}]`); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, pole);
    await page.focus(`input[name=${pole}]`);
    await page.keyboard.type(text, { delay: 15 });
    await cekej(250);
    r.pokusy[`${pole}=${text}`] = await page.evaluate((p) => {
      const i = document.querySelector(`input[name=${p}]`);
      const t = (s) => document.querySelector(s)?.textContent.replace(/\s+/g, ' ').trim();
      return { hodnotaPole: i.value, valueAsNumber: i.valueAsNumber, valid: i.validity.valid, badInput: i.validity.badInput,
        karta2026: t('#stat-karty .dlazdice .velke'), hlavni: t('#hlavni-cislo')?.slice(0, 140), poplatky: t('#poplatky-obsah')?.slice(0, 200),
        viditelnaHlaska: !!document.querySelector('[role=alert], .chyba, .error') };
    }, pole);
    if (jmeno === 'vychozi-en' && pole === 'sprava' && text === '0,85') await page.screenshot({ path: path.join(VYSTUP, 'cisla-360.png'), fullPage: false });
    // vrať výchozí
    await page.evaluate((p) => { const i = document.querySelector(`input[name=${p}]`); i.value = { vklad: '1000', sprava: '0.8', zustatek: '150000' }[p]; i.dispatchEvent(new Event('input', { bubbles: true })); }, pole);
  }
  if (jmeno === 'vychozi-en') r.axeDruhyBeh = await axe(page);
  out.locale[jmeno] = r;
  await browser.close();
}
await srv.zavri();
fs.writeFileSync(path.join(VYSTUP, 'prohlizec-carka.json'), JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
