// Scénáře v prohlížeči pro revizi ROD (5. 11. 2026): vyplnění formuláře, výsledek, chybový stav, čísla po česku,
// XSS do později zobrazených polí, localStorage, axe na výsledku, živý web. Výstup: dukazy/rodicovska/prohlizec.json + snímky.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, XSS, CHROME } from './prohlizec-lib.mjs';

const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const KOREN = '/tmp/revize/repos/rodicovska';
const VYSTUP = '/home/user/ceske-kalkulacky/docs/revize/2026-11-05/dukazy/rodicovska';
const ZIVY = 'https://frankie851.github.io/rodicovska/';
fs.mkdirSync(VYSTUP, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const vysledek = { datum: new Date().toISOString(), scenare: {} };

async function nastav(page, hodnoty) {
  await page.evaluate((h) => {
    const f = document.getElementById('formular');
    for (const [k, v] of Object.entries(h)) {
      const el = f.elements[k]; if (!el) continue;
      if (el.type === 'checkbox') el.checked = Boolean(v); else el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, hodnoty);
  await sleep(300);
}
async function posuvnik(page, v) {
  await page.evaluate((v) => { const s = document.getElementById('rpVyse'); s.value = String(v); s.dispatchEvent(new Event('input', { bubbles: true })); }, v);
  await sleep(300);
}
async function precti(page) {
  return page.evaluate(() => {
    const dl = [...document.querySelectorAll('#souhrn .dlazdice')].map((d) => ({ nazev: d.querySelector('.nazev')?.textContent, hodnota: d.querySelector('.hodnota')?.textContent, pozn: d.querySelector('.pozn')?.textContent || '' }));
    const s = document.getElementById('rpVyse');
    return {
      souhrn: dl,
      rpInfo: document.getElementById('rpVyseInfo').textContent,
      rpText: document.getElementById('rpVyseText').textContent,
      slider: { value: s.value, min: s.min, max: s.max },
      varovani: [...document.querySelectorAll('#varovani li')].map((l) => l.textContent),
      detail: document.getElementById('detail').innerText,
      tabulka: [...document.querySelectorAll('#tabulka tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim())),
      checklist: [...document.querySelectorAll('#checklist li')].map((l) => l.textContent),
      overeno: document.getElementById('overeno').textContent,
      zdroje: [...document.querySelectorAll('#zdroje a')].map((a) => ({ text: a.textContent, href: a.href })),
      osaRadku: document.querySelectorAll('#osa g.radek').length,
    };
  });
}
const SCENAR_A = { terminPorodu: '2026-03-15', vicercata: false, prijemMatka: 30000, prijemOtec: 40000, narokMatka: true, narokOtec: true, kdoPpm: 'matka', ppmTydnuPred: 6, otcovska: false, stridani: false, navrat: false };
const SCENAR_B = { terminPorodu: '2026-06-01', vicercata: true, prijemMatka: 0, prijemOtec: 0, narokMatka: true, narokOtec: true, kdoPpm: 'nikdo', otcovska: false, stridani: false, navrat: false };
const SCENAR_C = { terminPorodu: '2026-03-15', vicercata: false, prijemMatka: 15000, prijemOtec: 0, narokMatka: true, narokOtec: false, kdoPpm: 'matka', ppmTydnuPred: 6, otcovska: false, stridani: false, navrat: false };

const srv = await spustServer(KOREN);
try {
  // ---- A: scénář ze zadání (8 000 Kč od 6. měsíce) – 2 nezávislé běhy + 1440 px ----
  for (const beh of [1, 2]) {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, SCENAR_A);
    await posuvnik(b.page, 8000);
    const data = await precti(b.page);
    const z = { data, preteka: await preteka(b.page), konzole: b.zaznam.konzole, dialogy: b.zaznam.dialogy, chyby: b.zaznam.chyby, ciziPozadavky: b.zaznam.sit.filter((r) => !r.url.startsWith(srv.url) && !r.url.startsWith('data:')) };
    if (beh === 1) {
      await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
      z.axe = await axe(b.page);
      // otevřít detaily a tabulku a znovu axe
      await b.page.evaluate(() => document.querySelectorAll('details').forEach((d) => { d.open = true; }));
      await sleep(200);
      z.axeOtevrene = await axe(b.page);
      z.pretekaOtevrene = await preteka(b.page);
    }
    vysledek.scenare[`A_beh${beh}`] = z;
    await b.zavri();
  }
  {
    const b = await otevriProhlizec({ sirka: 1440, vyska: 900 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, SCENAR_A);
    await posuvnik(b.page, 8000);
    const data = await precti(b.page);
    await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
    vysledek.scenare.A_1440 = { data, preteka: await preteka(b.page), axe: await axe(b.page), tab: await tabulator(b.page, 24), konzole: b.zaznam.konzole };
    await b.zavri();
  }

  // ---- B: vícerčata bez DVZ, maximum ----
  for (const beh of [1, 2]) {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, SCENAR_B);
    await b.page.click('#btnMax');
    await sleep(300);
    const data = await precti(b.page);
    if (beh === 1) await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek2-360.png'), fullPage: true });
    vysledek.scenare[`B_beh${beh}`] = { data, preteka: await preteka(b.page), konzole: b.zaznam.konzole };
    await b.zavri();
  }

  // ---- C: nízký příjem matky (RP během PPM) ----
  {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, SCENAR_C);
    await posuvnik(b.page, 15000);
    const data = await precti(b.page);
    vysledek.scenare.C = { data: { souhrn: data.souhrn, rpInfo: data.rpInfo, tabulka: data.tabulka.slice(0, 9), varovani: data.varovani, detail: data.detail, checklist: data.checklist } };
    await b.zavri();
  }

  // ---- D: chybové stavy (termín před 1. 1. 2026, prázdný termín, záporný příjem, prázdný příjem) ----
  {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, { ...SCENAR_A, terminPorodu: '2025-12-31' });
    const d1 = await precti(b.page);
    await b.page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
    await nastav(b.page, { terminPorodu: '' });
    const d2 = await precti(b.page);
    await nastav(b.page, { ...SCENAR_A, prijemMatka: -30000 });
    const d3 = await precti(b.page);
    const validita3 = await b.page.evaluate(() => { const el = document.getElementById('formular').elements.prijemMatka; return { value: el.value, valid: el.validity.valid, rangeUnderflow: el.validity.rangeUnderflow, hlaska: el.validationMessage }; });
    await nastav(b.page, { ...SCENAR_A, prijemMatka: '' });
    const d4 = await precti(b.page);
    vysledek.scenare.D = {
      terminPred2026: { varovani: d1.varovani, souhrnZustal: d1.souhrn.length, osaRadku: d1.osaRadku },
      terminPrazdny: { varovani: d2.varovani, osaRadku: d2.osaRadku },
      zapornyPrijem: { varovani: d3.varovani, souhrn: d3.souhrn.slice(0, 2), validita: validita3 },
      prazdnyPrijem: { varovani: d4.varovani, souhrn: d4.souhrn.slice(0, 2) },
      preteka: await preteka(b.page), konzole: b.zaznam.konzole,
    };
    await b.zavri();
  }

  // ---- E: zadávání čísel po česku („30 000“, „30000,50“) v cs-CZ i en-US ----
  for (const lang of ['cs-CZ', 'en-US']) {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, SCENAR_A);
    const vysl = {};
    for (const text of ['30 000', '30000,50', '30000.50', '1500,5']) {
      await b.page.evaluate(() => { const el = document.getElementById('formular').elements.prijemMatka; el.focus(); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
      await b.page.keyboard.type(text, { delay: 20 });
      await sleep(300);
      const stav = await b.page.evaluate(() => {
        const el = document.getElementById('formular').elements.prijemMatka;
        const det = document.getElementById('detail').innerText.match(/Mateřská – matka: [^\n]*/);
        return { value: el.value, badInput: el.validity.badInput, stepMismatch: el.validity.stepMismatch, valid: el.validity.valid, hlaska: el.validationMessage, detail: det ? det[0] : null, varovani: [...document.querySelectorAll('#varovani li')].map((l) => l.textContent) };
      });
      vysl[text] = stav;
    }
    vysledek.scenare[`E_${lang}`] = vysl;
    await b.zavri();
  }

  // ---- F: XSS do polí, která se objeví až po zapnutí (střídání, návrat), a do termínu ----
  {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    await nastav(b.page, { ...SCENAR_A, stridani: true, navrat: true });
    const r = await b.page.evaluate((p) => {
      const f = document.getElementById('formular'); const out = {};
      for (const n of ['stridaniOdMesice', 'navratOdMesice', 'otcovskaOdDne', 'terminPorodu', 'prijemOtec']) {
        const el = f.elements[n]; el.value = p; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); out[n] = el.value;
      }
      return out;
    }, XSS);
    await sleep(500);
    const img = await b.page.evaluate(() => Boolean(document.querySelector('img[src="x"]')));
    // podvržený localStorage s HTML v textových hodnotách
    await b.page.evaluate((p) => { localStorage.setItem('rodicovska-plan-v1', JSON.stringify({ terminPorodu: '2026-05-01', kdoPpm: p, prijemMatka: 30000, prijemOtec: 30000, rpVyse: p })); }, XSS);
    await b.page.reload({ waitUntil: 'networkidle0' });
    await sleep(500);
    const img2 = await b.page.evaluate(() => Boolean(document.querySelector('img[src="x"]')));
    const text2 = await precti(b.page);
    vysledek.scenare.F = { hodnotyPoVlozeni: r, vlozenyImg: img, dialogy: b.zaznam.dialogy, podvrzenyStorage: { vlozenyImg: img2, dialogy: b.zaznam.dialogy, varovani: text2.varovani, souhrn: text2.souhrn.slice(0, 4), konzole: b.zaznam.konzole } };
    await b.page.evaluate(() => localStorage.clear());
    await b.zavri();
  }

  // ---- G: localStorage – uložit, znovu načíst, smazat ----
  {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
    const pred = await localStorageDump(b.page);
    await nastav(b.page, SCENAR_A);
    await b.page.click('#btnUlozit'); await sleep(200);
    const po = await localStorageDump(b.page);
    const stavText = await b.page.evaluate(() => document.getElementById('ulozeniStav').textContent);
    await b.page.reload({ waitUntil: 'networkidle0' }); await sleep(300);
    const poReloadu = await b.page.evaluate(() => ({ stav: document.getElementById('ulozeniStav').textContent, prijemMatka: document.getElementById('formular').elements.prijemMatka.value, termin: document.getElementById('formular').elements.terminPorodu.value }));
    await b.page.click('#btnSmazat'); await sleep(200);
    const poSmazani = await localStorageDump(b.page);
    vysledek.scenare.G = { pred, po, stavText, poReloadu, poSmazani, cookies: await b.page.cookies() };
    await b.zavri();
  }
} finally {
  await srv.zavri();
}

// ---- H: živý web přes proxy sezení ----
try {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', '--lang=cs-CZ', `--proxy-server=${process.env.HTTPS_PROXY}`] });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800 });
  const zaznam = { sit: [], konzole: [], chyby: [] };
  page.on('request', (r) => zaznam.sit.push({ url: r.url(), typ: r.resourceType() }));
  page.on('response', (r) => { if (r.status() >= 400) zaznam.chyby.push({ url: r.url(), stav: r.status() }); });
  page.on('requestfailed', (r) => zaznam.chyby.push({ url: r.url(), chyba: r.failure()?.errorText }));
  page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) zaznam.konzole.push({ typ: m.type(), text: m.text() }); });
  page.on('pageerror', (e) => zaznam.konzole.push({ typ: 'pageerror', text: String(e) }));
  const odp = await page.goto(ZIVY, { waitUntil: 'networkidle0', timeout: 90000 });
  await sleep(800);
  await page.screenshot({ path: path.join(VYSTUP, 'zivy-360.png'), fullPage: true });
  const data = await precti(page);
  vysledek.scenare.H_zivy = { url: ZIVY, http: odp?.status(), preteka: await preteka(page), overeno: data.overeno, rpInfo: data.rpInfo, souhrn: data.souhrn.slice(0, 2), zdroje: data.zdroje, sit: zaznam.sit, konzole: zaznam.konzole, chyby: zaznam.chyby, ciziPozadavky: zaznam.sit.filter((r) => !r.url.startsWith(ZIVY) && !r.url.startsWith('data:')), localStorage: await localStorageDump(page), cookies: await page.cookies() };
  await browser.close();
} catch (e) {
  vysledek.scenare.H_zivy = { chyba: String(e) };
}

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log('Hotovo:', Object.keys(vysledek.scenare).join(', '));
