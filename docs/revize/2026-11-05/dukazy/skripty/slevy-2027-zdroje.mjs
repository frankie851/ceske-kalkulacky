// Kontrola zdrojů uvedených uživateli v patičce Slevy 2027 (rules.json → zdroje): otevře každý odkaz
// v prohlížeči (e-Sbírka se skládá až v prohlížeči, curl vrací jen kostru) a zapíše stav, titulek
// a zda stránka obsahuje očekávaný text. Výstup: ../slevy-2027/zdroje.json
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { CHROME } from './prohlizec-lib.mjs';

const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const rules = JSON.parse(fs.readFileSync('/tmp/revize/repos/slevy-2027/rules.json', 'utf8'));
const VYSTUP = new URL('../slevy-2027/', import.meta.url).pathname;

// Co má stránka obsahovat, aby odpovídala tomu, co rules.json tvrdí.
const ocekavane = {
  'zakon-180-2026': /180\/2026 Sb\..*evidenci tržeb/s,
  'zdp-2027': /586\/1992 Sb\..*daních z příjmů/s,
  'zakon-360-2025': /360\/2025 Sb\./,
  'zakon-24-2025': /24\/2025 Sb\./,
  'mpsv-171-2026': /171\/2026 Sb\./,
  'nv-164-2026': /164\/2026 Sb\./,
  'nv-177-2026': /177\/2026 Sb\./,
  'mpsv-184-2026': /184\/2026 Sb\./,
  'mpsv-186-2026': /186\/2026 Sb\./,
  'danovy-rad': /280\/2009 Sb\./,
  'fs-manzel': /manžel/i,
  'fs-dpfo-2025': /2025/,
  'fs-novinky-2026': /2026/,
  'fs-priznani-2026': /4\. května 2026|4\.\s?5\.\s?2026/,
  'duvodova-180-2026': /./,
  'fakturaonline-slevy': /školkov/i,
  'penize-student': /studenta/i,
  'pohoda-konsolidace': /konsolida/i,
};

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', `--proxy-server=${process.env.HTTPS_PROXY}`] });
const vysledky = [];
for (const [klic, z] of Object.entries(rules.zdroje)) {
  const page = await browser.newPage();
  const r = { klic, nazev: z.nazev, url: z.url };
  try {
    const resp = await page.goto(z.url, { waitUntil: 'networkidle2', timeout: 45000 });
    await new Promise((res) => setTimeout(res, 1500));
    r.stav = resp?.status() ?? null;
    r.typ = resp?.headers()['content-type'] ?? null;
    if (/pdf/.test(r.typ ?? '')) { r.text = '(PDF)'; r.odpovida = true; }
    else {
      r.titulek = await page.title();
      r.text = await page.evaluate(() => document.body?.innerText.replace(/\s+/g, ' ').slice(0, 300));
      r.odpovida = ocekavane[klic] ? ocekavane[klic].test(`${r.titulek} ${await page.evaluate(() => document.body?.innerText.slice(0, 20000))}`) : null;
    }
  } catch (e) {
    r.stav = null; r.chyba = String(e).slice(0, 160); r.odpovida = null;
  }
  vysledky.push(r);
  console.log(`${klic}\t${r.stav}\t${r.odpovida}\t${(r.titulek ?? r.chyba ?? r.text ?? '').slice(0, 90)}`);
  await page.close();
}
await browser.close();
fs.writeFileSync(path.join(VYSTUP, 'zdroje.json'), JSON.stringify({ datum: new Date().toISOString(), vysledky }, null, 1));
