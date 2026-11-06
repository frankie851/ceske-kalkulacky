// Scénáře v prohlížeči pro revizi mam-eet (5. 11. 2026): vyplnění formulářů, výsledek, chybový stav,
// české formáty čísel, XSS do polí, axe, Tab, kontrola živého webu.
// Spuštění: node mam-eet-prohlizec.mjs   (výstup do ../mam-eet/, JSON prohlizec-scenare.json)
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, kontrolaStranky, XSS } from './prohlizec-lib.mjs';

const KOREN = '/tmp/revize/repos/mam-eet';
const VYSTUP = new URL('../mam-eet/', import.meta.url).pathname;
fs.mkdirSync(VYSTUP, { recursive: true });
const vysledek = { datum: new Date().toISOString(), eet: {}, osvc: {}, zivy: null };
const nb = (s) => (s ?? '').replace(/[  ]/g, ' ');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function klikOption(page, text) {
  const ok = await page.evaluate((t) => {
    const l = [...document.querySelectorAll('label.option')].find((x) => x.textContent.includes(t));
    if (!l) return false; l.querySelector('input').click(); return true;
  }, text);
  if (!ok) throw new Error(`volba „${text}“ nenalezena`);
}
async function klikTlacitko(page, text) {
  const ok = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t && !x.closest('[hidden]'));
    if (!b) return false; b.click(); return true;
  }, text);
  if (!ok) throw new Error(`tlačítko „${text}“ nenalezeno`);
  await sleep(150);
}
async function napis(page, selector, text) {
  await page.evaluate((s) => { const i = document.querySelector(s); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, selector);
  await page.type(selector, text, { delay: 5 });
  await sleep(100);
}
const textOf = (page, sel) => page.evaluate((s) => document.querySelector(s)?.textContent ?? null, sel);

/* ---------- Záložka Mám EET? ---------- */
async function eetScenare(url, sirka, vyska, jmeno) {
  const b = await otevriProhlizec({ sirka, vyska });
  const { page } = b;
  const z = { sirka };
  await page.goto(url, { waitUntil: 'networkidle0' });
  // Zadání Z5: OSVČ, hotovost, nic z toho, 1. pásmo, 800 000, ne, 1 jednotka → Můžeš zvolit EET OFF.
  await klikTlacitko(page, 'Začít');
  await klikOption(page, 'OSVČ'); await klikTlacitko(page, 'Další');
  await klikOption(page, 'Hotovost'); await klikTlacitko(page, 'Další');
  await klikOption(page, 'Nic z toho'); await klikTlacitko(page, 'Další');
  await klikOption(page, '1. pásmo'); await klikTlacitko(page, 'Další');
  // České zadání čísla s mezerou
  await napis(page, '#q-income', '800 000'); await klikTlacitko(page, 'Další');
  z.prijmyPrijato = await page.evaluate(() => !document.querySelector('#quiz legend')?.textContent.includes('příjmy'));
  await klikOption(page, 'Ne'); await klikTlacitko(page, 'Další');
  await napis(page, '#q-units', '1'); await klikTlacitko(page, 'Další');
  await sleep(300);
  z.verdikt = nb(await textOf(page, '.verdict h1'));
  z.verdiktSub = nb(await textOf(page, '.verdict p'));
  z.duvody = await page.evaluate(() => [...document.querySelectorAll('#result .reasons li')].map((li) => ({ text: li.querySelector('p')?.textContent, zdroj: li.querySelector('a.source')?.href })));
  z.eetOffKarta = nb(await page.evaluate(() => document.querySelector('#result .card')?.innerText));
  z.kalkulackaMoje = nb(await textOf(page, '.calc-output'));
  // Kalkulačka: vlastní pokladna 20 000, pak české formáty
  await klikOption(page, 'vlastní pokladně');
  z.kalkulacka = {};
  for (const [k, v] of [['prazdne', ''], ['20000', '20000'], ['20 000', '20 000'], ['20 000,50', '20 000,50'], ['20.000', '20.000'], ['-5000', '-5000'], ['xss', XSS]]) {
    await napis(page, '#own-cost', v);
    z.kalkulacka[k] = nb(await textOf(page, '.calc-output'));
  }
  z.xssImg = await page.evaluate(() => !!document.querySelector('img[src="x"]'));
  z.terminy = await page.evaluate(() => [...document.querySelectorAll('#checklist .deadline')].map((d) => d.textContent.trim()));
  z.preteka = await preteka(page);
  z.odkazy = await page.evaluate(() => [...document.querySelectorAll('#result a.source, #calc a.source, #checklist a.source')].map((a) => a.href));
  z.odkazyNeoficialni = z.odkazy.filter((u) => !/^https:\/\/(eet\.gov\.cz|mf\.gov\.cz|financnisprava\.gov\.cz)\//.test(u));
  await page.screenshot({ path: path.join(VYSTUP, `vysledek-eet-${jmeno}.png`), fullPage: true });
  if (sirka === 360) {
    z.axeVysledek = await axe(page);
    // Zpět na otázku příjmů a chybový stav: prázdné, desetinné, záporné, XSS
    await klikTlacitko(page, 'Zpět'); // na poslední otázku (jednotky)
    await klikTlacitko(page, 'Zpět'); await klikTlacitko(page, 'Zpět'); // blind → income
    z.chyby = {};
    for (const [k, v] of [['prazdne', ''], ['800000,50', '800000,50'], ['-1', '-1'], ['abc', 'abc'], ['xss', XSS], ['1 500', '1 500']]) {
      await napis(page, '#q-income', v); await klikTlacitko(page, 'Další');
      z.chyby[k] = { hlaska: nb(await textOf(page, '#q-income-error')), legend: nb(await textOf(page, '#quiz legend')) };
      if (k === 'prazdne') await page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
      if (k === '1 500') break;
      // pokud se posunul dál (přijato), vrať se
      if (!z.chyby[k].legend.includes('příjmy')) await klikTlacitko(page, 'Zpět');
    }
    z.xssImgDotaznik = await page.evaluate(() => !!document.querySelector('img[src="x"]'));
    z.tab = await tabulator(page, 12);
    z.localStorage = await localStorageDump(page);
    z.axeChyba = await axe(page);
  }
  z.sit = b.zaznam.sit.filter((r) => !r.url.startsWith(url)).map((r) => r.url);
  z.konzole = b.zaznam.konzole; z.dialogy = b.zaznam.dialogy; z.chybySite = b.zaznam.chyby;
  await b.zavri();
  return z;
}

/* ---------- Záložka OSVČ 2027 ---------- */
async function osvcScenare(url, sirka, vyska, jmeno) {
  const b = await otevriProhlizec({ sirka, vyska });
  const { page } = b;
  const z = { sirka };
  await page.goto(url + '#osvc', { waitUntil: 'networkidle0' });
  await sleep(300);
  z.panelViditelny = await page.evaluate(() => !document.getElementById('panel-osvc').hidden);
  z.vychoziStav = nb(await textOf(page, '#osvc-result'));
  const tabulka = async () => page.evaluate(() => [...document.querySelectorAll('table.variants tbody tr')].map((tr) => tr.innerText.replace(/[  ]/g, ' ').replace(/\s+/g, ' ').trim()));
  // O1: 800 000 (s mezerou), 60 % výchozí
  await napis(page, '#osvc-income', '800 000');
  await klikTlacitko(page, 'Spočítat');
  await sleep(300);
  z.o1 = { tabulka: await tabulka(), shrnuti: nb(await textOf(page, '#osvc-result .summary')), zaloha: nb(await textOf(page, '#osvc-first-payment')), bodZlomu: nb(await textOf(page, '.breakeven')), pasma: nb(await textOf(page, '.bands')) };
  z.o1.rozpis = await page.evaluate(() => [...document.querySelectorAll('.breakdown li')].map((li) => li.textContent.replace(/[  ]/g, ' ')));
  z.preteka1 = await preteka(page);
  await page.screenshot({ path: path.join(VYSTUP, `vysledek-osvc-${jmeno}.png`), fullPage: true });
  if (sirka === 360) z.axeVysledek = await axe(page);
  // O4: 500 000, skutečné výdaje 300 000, 2 děti
  await napis(page, '#osvc-income', '500000');
  await klikOption(page, 'Skutečnými výdaji');
  await napis(page, '#osvc-actual', '300 000');
  await napis(page, '#osvc-children', '2');
  await sleep(200);
  z.o4 = { tabulka: await tabulka(), rozpis: await page.evaluate(() => [...document.querySelectorAll('.breakdown li')].map((li) => li.textContent.replace(/[  ]/g, ' '))) };
  // O3: 1 200 000, 40 %, paušál, bez dětí
  await klikOption(page, 'Výdajovým paušálem');
  await klikOption(page, '40 %');
  await napis(page, '#osvc-children', '0');
  await napis(page, '#osvc-income', '1 200 000');
  await sleep(200);
  z.o3 = { tabulka: await tabulka() };
  // Plátce DPH
  await page.evaluate(() => { const i = document.querySelector('input[name="osvc-vat"][value="yes"]'); i.click(); });
  await sleep(200);
  z.dph = { tabulka: await tabulka() };
  await page.evaluate(() => { document.querySelector('input[name="osvc-vat"][value="no"]').click(); });
  if (sirka === 360) {
    // Neplatné vstupy bez odeslání: zůstane starý výsledek?
    await napis(page, '#osvc-income', '1500000,50');
    await sleep(200);
    z.desetinne = { bezOdeslani: { chyba: nb(await textOf(page, '#osvc-error')), tabulka: await tabulka() } };
    await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.desetinne.poOdeslani = { chyba: nb(await textOf(page, '#osvc-error')), tabulka: await tabulka() };
    await napis(page, '#osvc-income', ''); await sleep(200);
    z.prazdne = { bezOdeslani: { chyba: nb(await textOf(page, '#osvc-error')), tabulka: await tabulka() } };
    await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.prazdne.poOdeslani = { chyba: nb(await textOf(page, '#osvc-error')), tabulka: await tabulka(), fokus: await page.evaluate(() => document.activeElement?.id) };
    await page.screenshot({ path: path.join(VYSTUP, 'chyba-osvc-360.png'), fullPage: true });
    z.axeChyba = await axe(page);
    await napis(page, '#osvc-income', '-100'); await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.zaporne = { chyba: nb(await textOf(page, '#osvc-error')) };
    await napis(page, '#osvc-income', '1.200.000'); await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.tecky = { chyba: nb(await textOf(page, '#osvc-error')), tabulka: await tabulka() };
    await napis(page, '#osvc-income', '1e6'); await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.exponent = { chyba: nb(await textOf(page, '#osvc-error')), prvniRadek: (await tabulka())[0] };
    z.fokusGrafu = await page.evaluate(() => {
      const r = document.querySelector('svg.chart rect.overlay'); if (!r) return null; r.focus();
      const cs = getComputedStyle(r);
      return { aktivni: document.activeElement === r, outline: cs.outlineStyle + ' ' + cs.outlineWidth, stroke: cs.stroke + ' ' + cs.strokeWidth, role: r.getAttribute('role'), ariaLabel: r.getAttribute('aria-label') };
    });
    await napis(page, '#osvc-income', '0'); await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.nula = { chyba: nb(await textOf(page, '#osvc-error')) };
    await napis(page, '#osvc-children', '-1'); await napis(page, '#osvc-income', '800000'); await klikTlacitko(page, 'Spočítat'); await sleep(200);
    z.detiZaporne = { chyba: nb(await textOf(page, '#osvc-error')) };
    await napis(page, '#osvc-children', '0');
    // XSS do všech polí (včetně skutečných výdajů)
    await klikOption(page, 'Skutečnými výdaji');
    for (const s of ['#osvc-income', '#osvc-actual', '#osvc-children']) await napis(page, s, XSS);
    await klikTlacitko(page, 'Spočítat'); await sleep(300);
    z.xss = { img: await page.evaluate(() => !!document.querySelector('img[src="x"]')), chyba: nb(await textOf(page, '#osvc-error')) };
    await klikOption(page, 'Výdajovým paušálem');
    await page.goto(url + '#osvc', { waitUntil: 'networkidle0' });
    z.tab = await tabulator(page, 16);
    z.localStorage = await localStorageDump(page);
    // Klik na záložku Mám EET? přepne panel
    await page.click('#tab-eet'); await sleep(200);
    z.prepnutiZpet = await page.evaluate(() => ({ eet: !document.getElementById('panel-eet').hidden, osvc: document.getElementById('panel-osvc').hidden, hash: location.hash }));
  }
  z.sit = b.zaznam.sit.filter((r) => !r.url.startsWith(url)).map((r) => r.url);
  z.konzole = b.zaznam.konzole; z.dialogy = b.zaznam.dialogy; z.chybySite = b.zaznam.chyby;
  await b.zavri();
  return z;
}

const srv = await spustServer(KOREN);
try {
  vysledek.eet['360'] = await eetScenare(srv.url, 360, 800, '360');
  vysledek.eet['1440'] = await eetScenare(srv.url, 1440, 900, '1440');
  vysledek.osvc['360'] = await osvcScenare(srv.url, 360, 800, '360');
  vysledek.osvc['1440'] = await osvcScenare(srv.url, 1440, 900, '1440');
} finally { await srv.zavri(); }

// Živý web: standardní kontrola (konzole, chybějící soubory, cizí požadavky, axe, XSS) – snímky zivy-*.png.
if (!process.env.BEZ_ZIVEHO) {
  try {
    const v = await kontrolaStranky({ url: 'https://frankie851.github.io/mam-eet/', vystup: VYSTUP, nazev: 'zivy' });
    vysledek.zivy = Object.fromEntries(Object.entries(v.zobrazeni).map(([k, z]) => [k, { preteka: z.preteka, konzole: z.konzole, chyby: z.chyby, cizi: z.ciziPozadavky.map((r) => r.url), axe: z.axe, xss: z.xss, localStorage: z.localStorage }]));
  } catch (e) { vysledek.zivy = { chyba: String(e) }; }
}

fs.writeFileSync(path.join(VYSTUP, 'prohlizec-scenare.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
