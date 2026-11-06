// Doplňkové scénáře (5. 11. 2026): kam jde fokus po odeslání formuláře (app.js volá focus() na nadpis výsledku
// dřív, než hashchange obrazovku zobrazí) a texty v okrajových případech (dluh 0, srážka 1 Kč, mzda „23.000“).
// Spuštění: node kalkulator-dluhu-fokus.mjs → ../kalkulator-dluhu/fokus-a-okraje.json
import fs from 'node:fs';
import { spustServer, otevriProhlizec } from './prohlizec-lib.mjs';

const VYSTUP = new URL('../kalkulator-dluhu/', import.meta.url).pathname;
const srv = await spustServer('/tmp/revize/repos/kalkulator-dluhu');
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
const out = { datum: new Date().toISOString(), behy: [] };

const stav = (page) => page.evaluate(() => ({
  aktivni: document.activeElement === document.body ? 'BODY' : `${document.activeElement.tagName.toLowerCase()}#${document.activeElement.id}`,
  hash: location.hash,
  obrazovka: [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden)?.id,
}));
const texty = (page) => page.evaluate(() => Object.fromEntries(['v-zustane', 'v-srazka', 'v-vericum', 'v-nahrada', 'v-doba', 'o-splatka', 'o-delka', 'o-zaplaceno', 'o-zbytek'].map((id) => [id, document.getElementById(id).textContent.trim()])));
async function napis(page, sel, text) { await page.focus(sel); await page.evaluate((s) => { document.querySelector(s).value = ''; }, sel); await page.type(sel, text); }

for (let beh = 1; beh <= 2; beh++) {
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  const { page } = b;
  const z = { beh };
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '23 000'); await napis(page, '#dluh', '100 000');
  // odeslání klávesou Enter v poli dluhu (klávesnicový uživatel)
  await page.keyboard.press('Enter');
  z.fokusPoEnter = { t0: await stav(page) };
  await cekej(100); z.fokusPoEnter.t100 = await stav(page);
  await cekej(500); z.fokusPoEnter.t600 = await stav(page);
  // další Tab: kam se dostane uživatel klávesnice?
  await page.keyboard.press('Tab'); z.fokusPoEnter.poTabu = await stav(page);
  // odeslání myší tlačítkem Spočítat
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '23 000'); await napis(page, '#dluh', '100 000');
  await page.click('#vstup button[type=submit]');
  z.fokusPoKliku = { t0: await stav(page) }; await cekej(600); z.fokusPoKliku.t600 = await stav(page);
  await page.keyboard.press('Tab'); z.fokusPoKliku.poTabu = await stav(page);
  // chybový stav: fokus na první neplatné pole
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', ''); await napis(page, '#dluh', '');
  await page.click('#vstup button[type=submit]'); await cekej(200);
  z.fokusChyba = await stav(page);

  // okraje: dluh 0
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '23 000'); await napis(page, '#dluh', '0'); await page.click('#vstup button[type=submit]'); await cekej(400);
  z.dluh0 = { ...(await stav(page)), ...(await texty(page)) };
  // okraje: mzda 14 105 (srážka 1 Kč, věřitelé 0)
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '14 105'); await napis(page, '#dluh', '100 000'); await page.click('#vstup button[type=submit]'); await cekej(400);
  z.mzda14105 = { ...(await stav(page)), ...(await texty(page)) };
  // okraje: mzda „23.000“ (tečka jako oddělovač tisíců)
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '23.000'); await napis(page, '#dluh', '100 000'); await page.click('#vstup button[type=submit]'); await cekej(400);
  z.mzda23tecka = { ...(await stav(page)), ...(await texty(page)) };
  // okraje: dluh „150.000“ a mzda 23 000 → doba splácení z dluhu 150 Kč
  await page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await napis(page, '#mzda', '23 000'); await napis(page, '#dluh', '150.000'); await page.click('#vstup button[type=submit]'); await cekej(400);
  z.dluh150tecka = { ...(await stav(page)), ...(await texty(page)) };
  z.konzole = b.zaznam.konzole;
  out.behy.push(z);
  await b.zavri();
}
await srv.zavri();
fs.writeFileSync(VYSTUP + 'fokus-a-okraje.json', JSON.stringify(out, null, 1));
console.log(JSON.stringify(out, null, 1));
