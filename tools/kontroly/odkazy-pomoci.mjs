// Ruční kontrola odkazů na bezplatnou dluhovou pomoc: každý odkaz otevře ve skutečném prohlížeči
// a ověří, že stránka odpoví 200, nehodí chybu skriptu a ukáže návštěvníkovi obsah.
// Samotné „200 + titulek“ nestačí: sako.justice.cz 5. 11. 2026 vracela 200 i titulek, ale
// seznam se nevykreslil (prázdná stránka). Závisí na cizích serverech, proto neběží v CI.
// Použití: npm run kontrola:odkazy
import fs from 'node:fs';
import path from 'node:path';
import { spustitProhlizec } from './prohlizec.mjs';
import { KOREN } from './server.mjs';

const cti = (p) => JSON.parse(fs.readFileSync(path.join(KOREN, p), 'utf8'));
const odkazy = [
  ...cti('src/_data/pomoc.json').odkazy.map((o) => ({ kde: 'pomoc.json', ...o })),
  ...(cti('src/nastroje/exekuce-nebo-oddluzeni/rules.json').pomoc || []).map((o) => ({ kde: 'kalkulačka dluhů', ...o })),
];
const MIN_TEXT = 300; // znaků viditelného textu na stránce

const browser = await spustitProhlizec();
let chyb = 0;
for (const url of [...new Set(odkazy.map((o) => o.url))]) {
  const page = await browser.newPage();
  const chybySkriptu = [];
  const nenactene = [];
  const host = new URL(url).hostname;
  page.on('pageerror', (e) => chybySkriptu.push(String(e).slice(0, 120)));
  // Nenačtené vlastní skripty a styly stránky = stránka se návštěvníkovi nevykreslí celá
  // (přesně to se stalo na sako.justice.cz: ERR_CONTENT_LENGTH_MISMATCH u application.js).
  page.on('requestfailed', (r) => {
    // ERR_ABORTED = prohlížeč požadavek sám zrušil (např. nepotřebné písmo ikon), stránku nerozbije.
    if (['script', 'stylesheet'].includes(r.resourceType()) && new URL(r.url()).hostname === host && r.failure()?.errorText !== 'net::ERR_ABORTED') {
      nenactene.push(`${r.url().split('/').pop().slice(0, 40)} (${r.failure()?.errorText})`);
    }
  });
  let stav = 0;
  let text = '';
  try {
    const odpoved = await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    stav = odpoved?.status() ?? 0;
    await new Promise((r) => setTimeout(r, 1500));
    text = await page.evaluate(() => document.body.innerText.replace(/\s+/g, ' ').trim());
  } catch (e) {
    chybySkriptu.push(String(e).slice(0, 120));
  }
  const potize = [];
  if (stav !== 200) potize.push(`HTTP ${stav}`);
  if (nenactene.length) potize.push(`nenačtené skripty/styly stránky: ${nenactene.slice(0, 3).join(', ')}`);
  if (text.length < MIN_TEXT) potize.push(`málo obsahu (${text.length} znaků)`);
  chyb += potize.length ? 1 : 0;
  const nazvy = odkazy.filter((o) => o.url === url).map((o) => `${o.kde}: ${o.nazev}`).join('; ');
  const varovani = chybySkriptu.length ? `\n    varování – chyby skriptu: ${chybySkriptu.slice(0, 2).join(' | ')}` : '';
  console.log(`${potize.length ? '✗' : '✓'} ${url}\n    ${nazvy}${potize.length ? '\n    ' + potize.join('\n    ') : ''}${varovani}`);
  await page.close();
}
await browser.close();
console.log(chyb ? `\nNEFUNKČNÍCH ODKAZŮ: ${chyb}` : '\nVšechny odkazy na pomoc se vykreslily s obsahem.');
process.exit(chyb ? 1 : 0);
