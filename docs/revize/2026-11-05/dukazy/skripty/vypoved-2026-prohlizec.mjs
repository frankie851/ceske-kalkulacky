// Scénáře v prohlížeči pro Výpověď 2026 (revize 5. 11. 2026): vyplnění formuláře, výsledek, chybový stav,
// zadávání čísel po česku (cs-CZ i en-US), XSS i v později zobrazeném poli (dohoda), axe a přetékání ve stavu s výsledkem,
// kontrola živého webu. Výstup: ../vypoved-2026/prohlizec.json + snímky ../vypoved-2026/*.png
// Spuštění: node vypoved-2026-prohlizec.mjs [cesta-k-repu]
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, kontrolaStranky, XSS } from './prohlizec-lib.mjs';

const koren = process.argv[2] || '/tmp/revize/repos/vypoved-2026';
const vystup = new URL('../vypoved-2026/', import.meta.url).pathname;
fs.mkdirSync(vystup, { recursive: true });
const vysledek = { datum: new Date().toISOString(), koren, scenare: {} };
const snimek = (page, jmeno) => page.screenshot({ path: path.join(vystup, jmeno), fullPage: true });
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));

async function nastav(page, hodnoty) {
  // Vyplní pole jako uživatel: data přes page.evaluate (type=date), texty psaním z klávesnice.
  await page.evaluate((h) => {
    for (const [k, v] of Object.entries(h)) {
      const el = document.querySelector(`[name="${k}"]`);
      if (!el) continue;
      if (el.type === 'radio') { document.querySelector(`[name="${k}"][value="${v}"]`).click(); continue; }
      if (el.type === 'checkbox') { if (el.checked !== v) el.click(); continue; }
      if (el.tagName === 'SELECT' || el.type === 'date') { el.value = v; el.dispatchEvent(new Event('change', { bubbles: true })); continue; }
      el.value = '';
    }
  }, hodnoty);
  for (const [k, v] of Object.entries(hodnoty)) {
    const typ = await page.$eval(`[name="${k}"]`, (el) => el.type || el.tagName.toLowerCase());
    if (typ === 'text') { await page.focus(`[name="${k}"]`); await page.keyboard.type(String(v)); }
  }
}
async function odesli(page) {
  await page.click('button[type=submit]');
  await cekej(400);
  return page.evaluate(() => {
    const t = (s) => document.querySelector(s)?.textContent.trim() ?? null;
    const vysl = document.querySelector('#vysledek');
    return {
      chyby: [...document.querySelectorAll('#chyby p')].map((p) => p.textContent.trim()),
      chybyViditelne: !document.querySelector('#chyby').hidden,
      vysledekViditelny: vysl && !vysl.hidden,
      konec: t('#konec'), konecPopis: t('#konec-popis'), odstupne: t('#odstupne'), odstupnePopis: t('#odstupne-popis'),
      podporaPopis: t('#podpora-popis'),
      hlavicka: [...document.querySelectorAll('#podpora thead th')].map((x) => x.textContent.trim()),
      podpora: [...document.querySelectorAll('#podpora tbody tr')].map((tr) => [...tr.children].map((td) => td.childNodes[0]?.textContent.trim())),
      celkem: [...document.querySelectorAll('#podpora tfoot td')].map((x) => x.textContent.trim()),
      poznamky: [...document.querySelectorAll('#poznamky li')].map((x) => x.textContent.trim()),
      ukoly: [...document.querySelectorAll('#ukoly li')].map((li) => ({ nazev: li.querySelector('strong')?.textContent.trim(), termin: li.querySelector('.termin')?.textContent.trim() ?? null })),
      datumZadosti: document.querySelector('[name=datumZadosti]').value,
      hodnoty: Object.fromEntries(['delka', 'vek', 'hruby', 'cisty'].map((n) => [n, document.querySelector(`[name=${n}]`).value])),
    };
  });
}

const srv = await spustServer(koren);
const Z1 = { doruceni: '2026-07-10', kdo: 'zamestnavatel', duvod: 'c', delka: '1,5', vek: '40', hruby: '40 000', cisty: '30 000' };

// --- Scénář A: příklad ze zadání, 360 px, cs-CZ: 10. 7. 2026, § 52 c), 1,5 roku, 40 000 / 30 000, věk 40 → výsledek + snímky
for (const [jmeno, sirka, vyska] of [['360', 360, 800], ['1440', 1440, 900]]) {
  const b = await otevriProhlizec({ sirka, vyska });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await nastav(b.page, Z1);
  const r = await odesli(b.page);
  await cekej(600);
  await snimek(b.page, `vysledek-${jmeno}.png`);
  const z = { vstup: Z1, vystup: r, preteka: await preteka(b.page), konzole: b.zaznam.konzole, chyby: b.zaznam.chyby, cizi: b.zaznam.sit.filter((q) => !q.url.startsWith(srv.url) && !q.url.startsWith('data:')).map((q) => q.url) };
  if (jmeno === '360') { z.axe = await axe(b.page); z.tab = await tabulator(b.page, 40); z.localStorage = await localStorageDump(b.page); }
  vysledek.scenare[`A-zadani-${jmeno}`] = z;
  await b.zavri();
}

// --- Scénář B: 31. 12. 2026, § 52 d) (zdravotní), 5 let, 40 000 / 60 000, věk 40 → konec 28. 2. 2027, strop, „odstupné“ 12×
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const vstup = { doruceni: '2026-12-31', kdo: 'zamestnavatel', duvod: 'd', delka: '5', vek: '40', hruby: '40 000', cisty: '60 000' };
  await nastav(b.page, vstup);
  const r = await odesli(b.page);
  await cekej(600);
  await snimek(b.page, 'duvod-d-360.png');
  vysledek.scenare['B-duvod-d'] = { vstup, vystup: r, preteka: await preteka(b.page) };
  // totéž s písm. e)
  await nastav(b.page, { duvod: 'e' });
  vysledek.scenare['B-duvod-e'] = { vstup: { ...vstup, duvod: 'e' }, vystup: await odesli(b.page) };
  // a s písm. h) (zvlášť hrubé porušení § 301a → § 39 odst. 2 písm. b) ZoZ vylučuje podporu)
  await nastav(b.page, { doruceni: '2026-07-10', duvod: 'h', cisty: '30 000' });
  const rh = await odesli(b.page);
  await snimek(b.page, 'duvod-h-360.png');
  vysledek.scenare['B-duvod-h'] = { vstup: { ...vstup, doruceni: '2026-07-10', duvod: 'h', cisty: '30 000' }, vystup: rh };
  await b.zavri();
}

// --- Scénář C: žádost v roce 2027 → sloupec návrhu (tisk 300); věk 55
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const vstup = { doruceni: '2026-11-20', kdo: 'zamestnanec', delka: '3', vek: '55', hruby: '40 000', cisty: '30 000' };
  await nastav(b.page, vstup);
  const r = await odesli(b.page);
  await cekej(600);
  await snimek(b.page, 'navrh-2027-360.png');
  vysledek.scenare['C-zadost-2027'] = { vstup, vystup: r, preteka: await preteka(b.page), axe: await axe(b.page) };
  await b.zavri();
}

// --- Scénář D: chybový stav – prázdný formulář; nesmyslné vstupy; dohoda se dřívějším koncem
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const prazdny = await odesli(b.page);
  await snimek(b.page, 'chyba-360.png');
  vysledek.scenare['D-prazdny'] = { vystup: prazdny, axe: await axe(b.page) };
  await nastav(b.page, { doruceni: '2026-07-10', delka: '-1', vek: '40,5', hruby: 'abc', cisty: '-5' });
  vysledek.scenare['D-nesmysly'] = { vstup: { delka: '-1', vek: '40,5', hruby: 'abc', cisty: '-5' }, vystup: await odesli(b.page) };
  await nastav(b.page, { kdo: 'dohoda', konecDohody: '2026-07-01', delka: '3', vek: '40', hruby: '40 000', cisty: '30 000' });
  vysledek.scenare['D-dohoda-drive'] = { vstup: { doruceni: '2026-07-10', konecDohody: '2026-07-01' }, vystup: await odesli(b.page) };
  await b.zavri();
}

// --- Scénář E: zadávání čísel po česku v obou lokalizacích: „1 500“, „1500,50“, „40.000“, „40 000,50“, „1 234,50“
for (const lang of ['cs-CZ', 'en-US']) {
  const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const pokusy = {};
  for (const [jmeno, hodnoty] of [
    ['mezera 40 000', { hruby: '40 000', cisty: '30 000' }],
    ['carka 40000,50', { hruby: '40000,50', cisty: '30000,50' }],
    ['tecka tisice 40.000', { hruby: '40.000', cisty: '30.000' }],
    ['nbsp 40 000', { hruby: '40 000', cisty: '30 000' }],
    ['delka 1,5 / 1.5', { hruby: '40 000', cisty: '30 000', delka: '1.5' }],
  ]) {
    await nastav(b.page, { doruceni: '2026-07-10', kdo: 'zamestnavatel', duvod: 'c', delka: '1,5', vek: '40', ...hodnoty });
    const r = await odesli(b.page);
    pokusy[jmeno] = { hodnoty: r.hodnoty, chyby: r.chyby, odstupne: r.odstupne, podpora1: r.podpora[0]?.[1] ?? null, podporaPopis: r.podporaPopis };
  }
  vysledek.scenare[`E-cisla-${lang}`] = pokusy;
  await b.zavri();
}

// --- Scénář F: XSS do všech polí včetně pole dohody (zobrazí se až po volbě) a selectu
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await nastav(b.page, { kdo: 'dohoda' });
  await b.page.evaluate((p) => {
    document.querySelectorAll('input:not([type=checkbox]):not([type=radio]):not([type=submit])').forEach((el) => { el.value = p; el.dispatchEvent(new Event('change', { bubbles: true })); });
    const o = document.createElement('option'); o.value = p; o.textContent = p; document.querySelector('#duvod').append(o); document.querySelector('#duvod').value = p;
    document.querySelector('#formular').requestSubmit();
  }, XSS);
  await cekej(600);
  const xss1 = await b.page.evaluate(() => ({ img: !!document.querySelector('img[src="x"]'), chyby: [...document.querySelectorAll('#chyby p')].map((p) => p.textContent) }));
  // druhý pokus: platná data, ale text s XSS v číselných polích
  await nastav(b.page, { kdo: 'zamestnavatel', doruceni: '2026-07-10', delka: XSS, vek: XSS, hruby: XSS, cisty: XSS });
  const r2 = await odesli(b.page);
  await snimek(b.page, 'xss-dohoda-360.png');
  vysledek.scenare['F-xss'] = { pokus1: xss1, pokus2: { img: await b.page.evaluate(() => !!document.querySelector('img[src="x"]')), chyby: r2.chyby }, dialogy: b.zaznam.dialogy };
  await b.zavri();
}

// --- Scénář G: tisk – @media print skryje formulář; kontrolní seznam zůstane
{
  const b = await otevriProhlizec({ sirka: 1440, vyska: 900 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await nastav(b.page, Z1);
  await odesli(b.page);
  await b.page.emulateMediaType('print');
  vysledek.scenare['G-tisk'] = await b.page.evaluate(() => ({
    formularSkryt: getComputedStyle(document.querySelector('#formular')).display === 'none',
    seznamVidet: getComputedStyle(document.querySelector('#seznam')).display !== 'none',
    zdrojeVidet: getComputedStyle(document.querySelector('.paticka details > ul')).display !== 'none',
  }));
  await b.zavri();
}
await srv.zavri();

// --- Scénář H: živý web (GitHub Pages) – standardní kontrola
try {
  const zivy = await kontrolaStranky({ koren, vystup, nazev: 'zivy', url: 'https://frankie851.github.io/vypoved-2026/' });
  vysledek.scenare['H-zivy-web'] = Object.fromEntries(Object.entries(zivy.zobrazeni).map(([k, z]) => [k, { preteka: z.preteka, axe: z.axe, konzole: z.konzole, chyby: z.chyby, cizi: z.ciziPozadavky.filter((q) => !q.url.startsWith('data:')).map((q) => q.url), xss: z.xss, localStorage: z.localStorage }]));
} catch (e) { vysledek.scenare['H-zivy-web'] = { chyba: String(e) }; }

fs.writeFileSync(path.join(vystup, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
