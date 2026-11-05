// Scénáře v prohlížeči pro revizi Slevy 2027 (5. 11. 2026): vyplnění dotazníku, výsledek, kontrolní seznam,
// chybový stav, zadávání čísel po česku, XSS v pozdějších krocích, axe, Tab, přetékání, živý web.
// Spuštění: node slevy-2027-prohlizec.mjs  → snímky a prohlizec.json do ../slevy-2027/
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, CHROME, XSS } from './prohlizec-lib.mjs';
import { scenare } from './slevy-2027-prepocet.mjs';
import { scenarModul } from './slevy-2027-porovnani.mjs';

const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const KOREN = '/tmp/revize/repos/slevy-2027';
const VYSTUP = new URL('../slevy-2027/', import.meta.url).pathname;
const ZIVY = 'https://frankie851.github.io/slevy-2027/';
const M = await import(`${KOREN}/slevy.js`);
const rules = JSON.parse(fs.readFileSync(`${KOREN}/rules.json`, 'utf8'));
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
const vysl = { datum: new Date().toISOString(), commit: 'd88ba427d8f665161b10071deb45c3a26bd4ac9d' };
const kc = (s) => Number(String(s).replace(/[^\d-]/g, ''));

// --- pomocné ovládání formuláře ---------------------------------------------
/** Vyprázdní pole a napíše hodnotu klávesnicí (trojklik v poli type=number text nevybere). */
async function napis(page, sel, text) {
  await page.focus(sel);
  await page.evaluate((s) => { const el = document.querySelector(s); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }, sel);
  if (text !== '' && text !== null && text !== undefined) await page.type(sel, String(text));
}
async function zaskrtni(page, name, on) {
  const el = await page.$(`input[name="${name}"]`);
  const cur = await (await el.getProperty('checked')).jsonValue();
  if (cur !== on) await el.click();
}
const radio = (page, name, hodnota) => page.click(`input[name="${name}"][value="${hodnota}"]`);
async function nadpis(page) {
  return page.evaluate(() => {
    const d = document.querySelector('#dotaznik');
    if (d && !d.hidden) return d.querySelector('.otazka')?.textContent.trim();
    if (!document.querySelector('#vysledek').hidden) return 'VÝSLEDEK';
    if (!document.querySelector('#seznam').hidden) return 'SEZNAM';
    return null;
  });
}
async function dalsi(page) {
  const pred = await nadpis(page);
  await page.click('#dotaznik button[type="submit"]');
  await cekej(250);
  const po = await nadpis(page);
  const chyba = await page.evaluate(() => document.querySelector('#dotaznik .chyba')?.textContent.trim() ?? null);
  return { pred, po, chyba };
}
/** Kliká „Další“, dokud se neobjeví výsledek; vrací průchod kroky. */
async function doVysledku(page, max = 12) {
  const pruchod = [];
  for (let i = 0; i < max; i += 1) {
    const n = await nadpis(page);
    if (n === 'VÝSLEDEK') return pruchod;
    pruchod.push(await dalsi(page));
  }
  return pruchod;
}
async function pocetDeti(page, n) {
  await napis(page, '#pocetDeti', n);
  await cekej(150);
}
async function prectiVysledek(page) {
  const v = await page.evaluate(() => {
    const t = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? null;
    const radky = [...document.querySelectorAll('#vysledek tbody tr')].map((tr) => {
      const td = tr.querySelectorAll('td');
      return {
        nazev: td[0].childNodes[0].textContent.trim(),
        stitky: [...td[0].querySelectorAll('.stitek')].map((s) => s.textContent),
        poznamka: t(td[0].querySelector('.poznamka')),
        mesicne: td[1].querySelector('.hodnota').childNodes[0].textContent.trim(),
        rocne: td[2].querySelector('.hodnota').childNodes[0].textContent.trim(),
        odpocet: t(td[2].querySelector('.poznamka')),
        kde: t(td[3]), kdy: t(td[4]),
      };
    });
    return {
      az: t(document.querySelector('.souhrn__castka')),
      souhrn: t(document.querySelector('.souhrn')),
      info: [...document.querySelectorAll('#vysledek .info p')].map(t),
      radky,
      fokus: document.activeElement?.className ?? null,
    };
  });
  return v;
}

// Vyplnění scénáře A (viz slevy-2027-porovnani.mjs scenarModul.A)
async function vyplnA(page) {
  const kroky = [];
  await napis(page, '#narRok', 1990); await page.select('#narMesic', '5'); await napis(page, '#mzda', 45000); await napis(page, '#mzdaMesice', 12);
  kroky.push(await dalsi(page)); // 2 studium
  await radio(page, 'studuje', 'ne');
  kroky.push(await dalsi(page)); // 3 děti
  await pocetDeti(page, 2);
  await napis(page, '#ditRok0', 2018); await page.select('#ditMesic0', '4');
  await napis(page, '#ditRok1', 2025); await page.select('#ditMesic1', '3');
  kroky.push(await dalsi(page)); // 4 školka
  await zaskrtni(page, 'skolka1', true); await napis(page, '#skolne1', 30000);
  kroky.push(await dalsi(page)); // 5 manžel
  await radio(page, 'maManzela', 'ano'); await napis(page, '#manzelPrijem', 50000); await zaskrtni(page, 'peceODite', true);
  kroky.push(await dalsi(page)); // 6 invalidita
  kroky.push(await dalsi(page)); // 7 hypotéka
  await napis(page, '#uroky', 120000);
  kroky.push(await dalsi(page)); // 8 stáří
  await napis(page, '#penzijko', 36000); await napis(page, '#dip', 10000);
  kroky.push(await dalsi(page)); // 9 dary
  await napis(page, '#dary', 5000); await napis(page, '#krev', 2);
  kroky.push(await dalsi(page)); // 10 příjmy
  kroky.push(await dalsi(page)); // výsledek
  return kroky;
}
// Scénář B
async function vyplnB(page) {
  const kroky = [];
  await napis(page, '#narRok', 2005); await page.select('#narMesic', '1'); await napis(page, '#mzda', 25000);
  kroky.push(await dalsi(page));
  await radio(page, 'studuje', 'ano'); await page.select('#studOd', '1'); await page.select('#studDo', '6'); await page.select('#studDruh', 'vs');
  kroky.push(await dalsi(page)); // děti
  kroky.push(await dalsi(page)); // školka
  kroky.push(await dalsi(page)); // manžel
  kroky.push(await dalsi(page)); // invalidita
  kroky.push(await dalsi(page)); // hypotéka
  kroky.push(await dalsi(page)); // stáří
  await napis(page, '#dip', 60000);
  kroky.push(await dalsi(page)); // dary
  kroky.push(await dalsi(page)); // příjmy
  await napis(page, '#ostatni', 45000);
  kroky.push(await dalsi(page)); // výsledek
  return kroky;
}

function porovnejSObrazovkou(nazev, obrazovka, modulV, ref) {
  const podle = Object.fromEntries(modulV.polozky.map((p) => [p.nazev, p]));
  const polozky = obrazovka.radky.map((r) => {
    const m = podle[r.nazev];
    const modulRocne = m ? (m.typ === 'odpocet' ? m.uspora : m.rocne) : null;
    return { nazev: r.nazev, obrazovkaRocne: kc(r.rocne), modulRocne, obrazovkaOdpocet: r.odpocet ? kc(r.odpocet) : null, modulOdpocet: m?.typ === 'odpocet' ? m.rocne : null, shoda: kc(r.rocne) === modulRocne && (!r.odpocet || kc(r.odpocet) === m?.rocne), kde: r.kde, kdy: r.kdy, mesicne: r.mesicne, stitky: r.stitky };
  });
  const realneObr = (obrazovka.souhrn.match(/reálně dělá ([\d\s ]+) Kč/) || [])[1];
  return {
    scenar: nazev,
    az: { obrazovka: kc(obrazovka.az), modul: modulV.soucetAz, reference: ref.az, shoda: kc(obrazovka.az) === modulV.soucetAz && modulV.soucetAz === ref.az },
    realne: { obrazovka: realneObr ? kc(realneObr) : null, modul: modulV.realne, reference: ref.realne, shoda: realneObr ? kc(realneObr) === modulV.realne && modulV.realne === ref.realne : null },
    polozky, info: obrazovka.info, souhrn: obrazovka.souhrn, fokusPoVysledku: obrazovka.fokus,
  };
}

// === 1. Scénář A na 360 px: výsledek + seznam + axe + Tab + XSS + přetékání ================
const srv = await spustServer(KOREN);
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const kroky = await vyplnA(b.page);
  // přetékání formuláře v kroku s dětmi se měří dodatečně níže (krok 3)
  const obr = await prectiVysledek(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
  const modulV = M.vyhodnot(scenarModul.A, rules);
  vysl.scenarA360 = {
    kroky, preteka: await preteka(b.page), axeVysledek: await axe(b.page),
    porovnani: porovnejSObrazovkou('A', obr, modulV, scenare.A.ref()),
    tab: await tabulator(b.page, 8),
  };
  // kontrolní seznam
  await b.page.click('[data-akce="seznam"]'); await cekej(300);
  await b.page.screenshot({ path: path.join(VYSTUP, 'seznam-360.png'), fullPage: true });
  vysl.seznam360 = {
    preteka: await preteka(b.page), axe: await axe(b.page),
    text: await b.page.evaluate(() => document.querySelector('#seznam').innerText),
  };
  // zpět na výsledek → upravit odpovědi → XSS do všech polí 10. kroku
  await b.page.click('#seznam [data-akce="zpet"]'); await cekej(200);
  await b.page.click('[data-akce="upravit"]'); await cekej(200);
  vysl.xssKrok10 = { nadpis: await nadpis(b.page) };
  await b.page.evaluate((p) => { document.querySelectorAll('#dotaznik input[type=number]').forEach((el) => { el.value = p; el.dispatchEvent(new Event('input', { bubbles: true })); }); }, XSS);
  await b.page.click('#dotaznik button[type="submit"]'); await cekej(300);
  vysl.xssKrok10.poOdeslani = await nadpis(b.page);
  vysl.xssKrok10.vlozenyImg = await b.page.evaluate(() => !!document.querySelector('img[src="x"]'));
  vysl.xssKrok10.dialogy = b.zaznam.dialogy.length;
  vysl.sit360 = { pozadavky: b.zaznam.sit.map((r) => r.url), cizi: b.zaznam.sit.filter((r) => !r.url.startsWith(srv.url)).map((r) => r.url), konzole: b.zaznam.konzole, chyby: b.zaznam.chyby, localStorage: await localStorageDump(b.page), cookies: (await b.page.cookies()).length };
  await b.zavri();
}

// === 2. Scénář A na 1440 px ==================================================
{
  const b = await otevriProhlizec({ sirka: 1440, vyska: 900 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await vyplnA(b.page);
  const obr = await prectiVysledek(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
  vysl.scenarA1440 = { preteka: await preteka(b.page), az: obr.az, souhrn: obr.souhrn, radky: obr.radky.map((r) => [r.nazev, r.mesicne, r.rocne, r.odpocet, r.kde, r.kdy]), konzole: b.zaznam.konzole };
  await b.zavri();
}

// === 3. Scénář B na 360 px (student, přiznání) ================================
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const kroky = await vyplnB(b.page);
  const obr = await prectiVysledek(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek2-360.png'), fullPage: true });
  vysl.scenarB360 = { kroky, preteka: await preteka(b.page), porovnani: porovnejSObrazovkou('B', obr, M.vyhodnot(scenarModul.B, rules), scenare.B.ref()), konzole: b.zaznam.konzole };
  await b.zavri();
}

// === 4. Chybové stavy, Zpět, čísla po česku, XSS v krocích 3, 4 a 8 ==========
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  const { page } = b;
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  // 4a prázdný rok narození → chyba
  const prazdne = await dalsi(page);
  await page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
  const chybaAxe = await axe(page);
  const chybaRole = await page.evaluate(() => document.querySelector('#dotaznik .chyba')?.getAttribute('role'));
  // 4b rok 1900 (pod minimem), rok 2030 (nad maximem), záporná mzda, mzdaMesice 0 a 15
  await napis(page, '#narRok', 1900); const rok1900 = await dalsi(page);
  await napis(page, '#narRok', 2030); const rok2030 = await dalsi(page);
  await napis(page, '#narRok', 1990); await napis(page, '#mzda', -5000); await napis(page, '#mzdaMesice', 15);
  const zaporna = await dalsi(page);
  const stavPoZaporne = await page.evaluate(() => document.querySelector('.otazka').textContent);
  // 4c Zpět zachová hodnoty?
  await page.click('[data-akce="zpet"]'); await cekej(200);
  const poZpet = await page.evaluate(() => ({ rok: document.querySelector('#narRok').value, mzda: document.querySelector('#mzda').value, mesice: document.querySelector('#mzdaMesice').value }));
  vysl.chyby = { prazdne, chybaRole, chybaAxe, rok1900, rok2030, zapornaMzdaA15Mesicu: { ...zaporna, stavPoZaporne, hodnotyPoZpet: poZpet } };
  // 4d studium od > do
  await dalsi(page); await radio(page, 'studuje', 'ano'); await page.select('#studOd', '9'); await page.select('#studDo', '6');
  vysl.chyby.studiumOdDo = await dalsi(page);
  await page.select('#studOd', '1'); await page.select('#studDo', '12'); await dalsi(page); // → děti
  // 4e XSS v kroku 3: počet dětí + rok dítěte
  await pocetDeti(page, 1);
  await page.evaluate((p) => { document.querySelectorAll('#dotaznik input[type=number]').forEach((el) => { el.value = p; el.dispatchEvent(new Event('input', { bubbles: true })); }); }, XSS);
  await page.click('#dotaznik button[type="submit"]'); await cekej(300);
  vysl.xssKrok3 = { po: await nadpis(page), chyba: await page.evaluate(() => document.querySelector('#dotaznik .chyba')?.textContent ?? null), vlozenyImg: await page.evaluate(() => !!document.querySelector('img[src="x"]')), dialogy: b.zaznam.dialogy.length };
  // payload v „Počet dětí“ se přečte jako 0 dětí → dotazník postoupí; vrátit se na krok 3
  if ((await nadpis(page)) !== 'Máte děti?') { await page.click('[data-akce="zpet"]'); await cekej(200); }
  // dítě bez roku → chyba; dítě 2000 (27 let) → chyba?; 2001 → projde
  await pocetDeti(page, 1); vysl.chyby.diteBezRoku = await dalsi(page);
  await napis(page, '#ditRok0', 2000); vysl.chyby.dite2000 = await dalsi(page);
  await napis(page, '#ditRok0', 2022); await page.select('#ditMesic0', '5');
  vysl.pretekaKrokDeti = await preteka(page);
  vysl.axeKrokDeti = await axe(page);
  await dalsi(page); // → školka
  // 4f čísla po česku do školného: psaní „30 000“, „1500,50“, „1500.50“, vložení „30 000“
  const testCisla = async (jak, text) => {
    await napis(page, '#skolne0', '');
    if (jak === 'psani') await page.type('#skolne0', text);
    else await page.evaluate((t) => { document.querySelector('#skolne0').focus(); document.execCommand('insertText', false, t); }, text);
    return page.evaluate(() => { const el = document.querySelector('#skolne0'); return { value: el.value, badInput: el.validity.badInput, valueAsNumber: el.valueAsNumber }; });
  };
  vysl.cisla = {
    psani_30_000: await testCisla('psani', '30 000'),
    psani_1500_carka_50: await testCisla('psani', '1500,50'),
    psani_1500_tecka_50: await testCisla('psani', '1500.50'),
    vlozeni_30_000: await testCisla('vlozeni', '30 000'),
    vlozeni_1500_carka_50: await testCisla('vlozeni', '1500,50'),
  };
  // Co se stane po vložení „30 000“ a odeslání: školka zaškrtnutá, školné „30 000“ vložené
  await zaskrtni(page, 'skolka0', true);
  await testCisla('vlozeni', '30 000');
  await page.screenshot({ path: path.join(VYSTUP, 'cisla-360.png'), fullPage: true });
  const poOdeslaniCisel = await dalsi(page);
  // dojít na výsledek (ostatní kroky prázdné)
  vysl.cisla.pruchod = await doVysledku(page);
  const obr = await prectiVysledek(page);
  vysl.cisla.poOdeslani = { krok: poOdeslaniCisel, skolkovneNaVysledku: obr.radky.find((r) => /umístění/.test(r.nazev)) ?? '(řádek školkovného chybí)', az: obr.az };
  // XSS v kroku 8 (stáří) přes „Upravit odpovědi“ → krok 10 → Zpět → 9 → Zpět → 8
  await page.click('[data-akce="upravit"]'); await cekej(200);
  await page.click('[data-akce="zpet"]'); await cekej(200); await page.click('[data-akce="zpet"]'); await cekej(200);
  vysl.xssKrok8 = { nadpis: await nadpis(page) };
  await page.evaluate((p) => { document.querySelectorAll('#dotaznik input[type=number]').forEach((el) => { el.value = p; el.dispatchEvent(new Event('input', { bubbles: true })); }); }, XSS);
  vysl.xssKrok8.pruchod = await doVysledku(page);
  vysl.xssKrok8.po = await nadpis(page);
  vysl.xssKrok8.vlozenyImg = await page.evaluate(() => !!document.querySelector('img[src="x"]'));
  vysl.xssKrok8.dialogy = b.zaznam.dialogy.length;
  vysl.xssKrok8.konzole = b.zaznam.konzole;
  await b.zavri();
}

// === 4g. Desetinná čárka a mezera v obou lokalizacích prohlížeče (cs-CZ i en-US) ==
vysl.cislaLokalizace = {};
for (const lang of ['cs-CZ', 'en-US']) {
  // Pozn.: samotné --lang (otevriProhlizec({lang})) v tomto Chromiu lokalizaci nepřepnulo (navigator.language zůstal en-US),
  // proto se prohlížeč spouští i s proměnnými LANG/LANGUAGE – pak cs-CZ čárku přijímá.
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', `--lang=${lang}`], env: { ...process.env, LANG: lang === 'cs-CZ' ? 'cs_CZ.UTF-8' : 'en_US.UTF-8', LANGUAGE: lang === 'cs-CZ' ? 'cs' : 'en' } });
  const page = await browser.newPage();
  await page.setViewport({ width: 360, height: 800 });
  await page.setExtraHTTPHeaders({ 'Accept-Language': lang });
  const b = { page, zavri: () => browser.close() };
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  await napis(page, '#narRok', 1985); await dalsi(page); await dalsi(page);
  await pocetDeti(page, 1); await napis(page, '#ditRok0', 2023); await dalsi(page); // krok školka
  const r = { navigatorLanguage: await page.evaluate(() => navigator.language) };
  for (const [jak, text] of [['psani', '1500,50'], ['psani', '84 512,30'], ['psani', '1 500'], ['psani', '0,85'], ['vlozeni', '84 512,30'], ['vlozeni', '1 500']]) {
    await napis(page, '#skolne0', '');
    if (jak === 'psani') await page.type('#skolne0', text);
    else await page.evaluate((t) => { document.querySelector('#skolne0').focus(); document.execCommand('insertText', false, t); }, text);
    r[`${jak} „${text}“`] = await page.evaluate(() => { const el = document.querySelector('#skolne0'); return { value: el.value, badInput: el.validity.badInput }; });
  }
  // co uvidí uživatel na výsledku po „84 512,30“ ve školném (školka zaškrtnutá)
  await zaskrtni(page, 'skolka0', true); await napis(page, '#skolne0', ''); await page.type('#skolne0', '84 512,30');
  await dalsi(page); await doVysledku(page);
  const obr = await prectiVysledek(page);
  r.vysledekSkolkovne = obr.radky.find((x) => /umístění/.test(x.nazev))?.rocne ?? null;
  vysl.cislaLokalizace[lang] = r;
  await b.zavri();
}

// === 5. Zastaralý stav školky po změně roku dítěte (Zpět) ====================
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  const { page } = b;
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  await napis(page, '#narRok', 1985); await dalsi(page); await dalsi(page);
  await pocetDeti(page, 1); await napis(page, '#ditRok0', 2023); await dalsi(page);
  await zaskrtni(page, 'skolka0', true); await napis(page, '#skolne0', 20000); await dalsi(page); // manžel
  await page.click('[data-akce="zpet"]'); await cekej(200); await page.click('[data-akce="zpet"]'); await cekej(200); // zpět na děti
  await napis(page, '#ditRok0', 2012); // dítě už školní
  await dalsi(page); // školka – „žádné dítě v předškolním věku“
  const textSkolka = await page.evaluate(() => document.querySelector('#dotaznik .info')?.textContent ?? null);
  const pruchod = await doVysledku(page);
  const obr = await prectiVysledek(page);
  vysl.zastaraleSkolkovne = { pruchod, textSkolka, skolkovneNaVysledku: obr.radky.find((r) => /umístění/.test(r.nazev)) ?? null, az: obr.az };
  await b.zavri();
}
await srv.zavri();

// === 6. Živý web (přes proxy sezení) =========================================
{
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-sandbox', '--disable-gpu', `--proxy-server=${process.env.HTTPS_PROXY}`] });
  vysl.zivyWeb = {};
  for (const [jmeno, sirka, vyska] of [['360', 360, 800], ['1440', 1440, 900]]) {
    const page = await browser.newPage();
    await page.setViewport({ width: sirka, height: vyska });
    const z = { sit: [], konzole: [], chyby: [] };
    page.on('request', (r) => z.sit.push({ url: r.url(), typ: r.resourceType() }));
    page.on('response', (r) => { if (r.status() >= 400) z.chyby.push({ url: r.url(), stav: r.status() }); });
    page.on('requestfailed', (r) => z.chyby.push({ url: r.url(), chyba: r.failure()?.errorText }));
    page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) z.konzole.push({ typ: m.type(), text: m.text() }); });
    page.on('pageerror', (e) => z.konzole.push({ typ: 'pageerror', text: String(e) }));
    const resp = await page.goto(ZIVY, { waitUntil: 'networkidle0', timeout: 60000 });
    await cekej(500);
    if (jmeno === '360') await page.screenshot({ path: path.join(VYSTUP, 'zivy-360.png'), fullPage: true });
    vysl.zivyWeb[jmeno] = {
      stav: resp.status(), preteka: await preteka(page), konzole: z.konzole, chyby: z.chyby,
      cizi: z.sit.filter((r) => !r.url.startsWith(ZIVY)).map((r) => r.url),
      pozadavky: z.sit.map((r) => r.url),
      overeno: await page.evaluate(() => document.querySelector('#overeno')?.textContent),
      nadpis: await page.evaluate(() => document.querySelector('.otazka')?.textContent),
    };
    if (jmeno === '360') vysl.zivyWeb[jmeno].axe = await axe(page);
    await page.close();
  }
  await browser.close();
}

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysl, null, 1));
console.log(JSON.stringify({
  A360: { az: vysl.scenarA360.porovnani.az, realne: vysl.scenarA360.porovnani.realne, polozkyNeshoda: vysl.scenarA360.porovnani.polozky.filter((p) => !p.shoda), preteka: vysl.scenarA360.preteka.preteka, axe: vysl.scenarA360.axeVysledek.map((a) => `${a.dopad}:${a.id}×${a.pocet}`) },
  seznam: { preteka: vysl.seznam360.preteka.preteka, axe: vysl.seznam360.axe.map((a) => `${a.dopad}:${a.id}×${a.pocet}`) },
  A1440: { preteka: vysl.scenarA1440.preteka.preteka, az: vysl.scenarA1440.az },
  B360: { az: vysl.scenarB360.porovnani.az, realne: vysl.scenarB360.porovnani.realne, polozkyNeshoda: vysl.scenarB360.porovnani.polozky.filter((p) => !p.shoda), info: vysl.scenarB360.porovnani.info },
  chyby: vysl.chyby, cisla: vysl.cisla, cislaLokalizace: vysl.cislaLokalizace, xss: { k3: vysl.xssKrok3, k8: vysl.xssKrok8, k10: vysl.xssKrok10 },
  zastaraleSkolkovne: vysl.zastaraleSkolkovne,
  sit: { cizi: vysl.sit360.cizi, konzole: vysl.sit360.konzole, chyby: vysl.sit360.chyby, localStorage: vysl.sit360.localStorage, cookies: vysl.sit360.cookies },
  zivy: Object.fromEntries(Object.entries(vysl.zivyWeb).map(([k, z]) => [k, { stav: z.stav, preteka: z.preteka.preteka, konzole: z.konzole, chyby: z.chyby, cizi: z.cizi, overeno: z.overeno, axe: z.axe?.map((a) => `${a.dopad}:${a.id}×${a.pocet}`) }])),
}, null, 1));
