// E2E: Inflační kalkulačka ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/inflacni-kalkulacka.test.js
// Kontrolní příklady ze zadání (test/inflation.test.mjs) na skutečných datech ČSÚ:
// období, kde index vzrostl přesně o 2,5 % a o 20 %, ať sedí stejná čísla jako v jednotkových testech.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';
import { realReturn, realWageChange } from '../../src/nastroje/inflacni-kalkulacka/inflation.js';

after(zavri);

const CESTA = 'penize/inflacni-kalkulacka/';
const cpi = JSON.parse(fs.readFileSync(new URL('../../src/nastroje/inflacni-kalkulacka/data/cpi.json', import.meta.url), 'utf8'));
const cislo = (page) => text(page, '#vysledek [data-vysledek-cislo]');
const procenta = (podil) => `${podil >= 0 ? '+' : '−'}${Math.abs(podil * 100).toFixed(2).replace('.', ',')} %`;

async function nastavMesic(page, id, mesic) {
  await vypln(page, `#${id}-rok`, mesic.slice(0, 4));
  await vypln(page, `#${id}-mesic`, mesic.slice(5));
}

test('výchozí stav: přepočet 10 000 Kč z ledna 2005 na poslední měsíc, grafy a tabulka', async () => {
  const { page, chyby } = await otevri(CESTA);
  const posledni = Object.keys(cpi).sort().at(-1);
  const ocekavano = Math.round(10000 * (cpi[posledni] / cpi['2005-01']));
  assert.equal((await cislo(page)).replace(/\s/g, ''), `${ocekavano}Kč`);
  assert.equal(await text(page, '[data-lista-cislo]'), await cislo(page));
  assert.ok(await page.$('[data-graf-hladiny] svg[role="img"]'), 'graf cenové hladiny');
  assert.ok(await page.$('[data-graf-inflace] svg[role="img"]'), 'graf meziroční inflace');
  assert.ok(await page.$('[data-tabulka] table'), 'tabulka hodnot');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('reálný výnos: 4 % nominálně při inflaci 2,5 % → ≈ +1,46 %', async () => {
  const od = '2009-04';
  const doM = '2011-03';
  assert.equal((cpi[doM] / cpi[od]).toFixed(6), '1.025000', 'v datech ČSÚ ceny za období vzrostly o 2,5 %');
  const { page, chyby } = await otevri(`${CESTA}#vynos`);
  assert.equal(await page.$eval('#panel-vynos', (el) => el.hidden), false);
  await vypln(page, '#urok', '4');
  await page.click('label[for="typ-celkem"]');
  await nastavMesic(page, 'vynos-od', od);
  await nastavMesic(page, 'vynos-do', doM);
  const ocekavano = procenta(realReturn(0.04, cpi[doM] / cpi[od] - 1));
  assert.equal(ocekavano, '+1,46 %');
  assert.equal(await cislo(page), '+1,46 %');
  assert.match(await text(page, '#vysledek [data-vysledek-popis]'), /za celé období/);
  assert.equal(await text(page, '[data-lista-cislo]'), '+1,46 %');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('mzda 40 000 → 50 000 Kč při růstu cen o 20 % → reálně +4,17 %', async () => {
  const od = '2002-01';
  const doM = '2010-09';
  assert.equal((cpi[doM] / cpi[od]).toFixed(6), '1.200000', 'v datech ČSÚ ceny za období vzrostly o 20 %');
  const { page, chyby } = await otevri(`${CESTA}#mzda`);
  await vypln(page, '#mzda-tehdy', '40 000');
  await vypln(page, '#mzda-ted', '50 000');
  await nastavMesic(page, 'mzda-od', od);
  await nastavMesic(page, 'mzda-do', doM);
  assert.equal(procenta(realWageChange(40000, 50000, cpi[od], cpi[doM])), '+4,17 %');
  assert.equal(await cislo(page), '+4,17 %');
  assert.match(await text(page, '#vysledek-nadpis'), /reálně vzrostla/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('měsíc bez dat: počítá s posledním dostupným a napíše to u výsledku', async () => {
  const { page } = await otevri(CESTA);
  const posledni = Object.keys(cpi).sort().at(-1);
  if (posledni.endsWith('-12')) return; // v prosinci není v posledním roce žádný pozdější měsíc
  await vypln(page, '#prepocet-do-mesic', '12');
  assert.equal(await page.$eval('[data-poznamka-obal]', (el) => el.hidden), false);
  assert.match(await text(page, '[data-poznamka]'), /zatím data nejsou/);
  await page.close();
});

test('prohození měsíců přepočítá obráceně', async () => {
  const { page } = await otevri(CESTA);
  await page.click('[data-prohodit]');
  assert.equal(await page.$eval('#prepocet-do-rok', (el) => el.value), '2005');
  const posledni = Object.keys(cpi).sort().at(-1);
  const ocekavano = Math.round(10000 * (cpi['2005-01'] / cpi[posledni]));
  assert.equal((await cislo(page)).replace(/\s/g, ''), `${ocekavano}Kč`);
  await page.close();
});

test('záložky fungují z klávesnice (šipky, Home, End) a mění hash', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const vybrana = () => page.$eval('[role="tab"][aria-selected="true"]', (el) => el.dataset.zalozka);
  const fokus = () => page.evaluate(() => document.activeElement?.dataset.zalozka);
  await page.focus('#zalozka-prepocet');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'vynos');
  assert.equal(await fokus(), 'vynos');
  assert.equal(await page.$eval('#panel-vynos', (el) => el.hidden), false);
  assert.equal(await page.$eval('#panel-prepocet', (el) => el.hidden), true);
  assert.equal(await page.evaluate(() => location.hash), '#vynos');
  assert.match(await text(page, '#vysledek .result-kicker'), /Reálný výnos/);
  await page.keyboard.press('End');
  assert.equal(await vybrana(), 'mzda');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'prepocet');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await vybrana(), 'mzda');
  await page.keyboard.press('Home');
  assert.equal(await vybrana(), 'prepocet');
  // Tab z vybrané záložky vede do panelu, ne na další záložku
  await page.keyboard.press('Tab');
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'castka');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('chybný vstup ukáže chybu u pole a výsledek nezmění', async () => {
  const { page } = await otevri(CESTA);
  const pred = await cislo(page);
  await vypln(page, '#castka', 'abc');
  assert.equal(await page.$eval('#castka', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await page.$eval('#castka-chyba', (el) => el.hidden), false);
  assert.equal(await cislo(page), pred);
  await vypln(page, '#castka', '10 000');
  assert.equal(await page.$eval('#castka-chyba', (el) => el.hidden), true);
  await page.close();
});

test('bez JavaScriptu: ukázkový výsledek, grafy a tabulka', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.match(await cislo(page), /Kč$/);
  assert.match(await text(page, '#vysledek-nadpis'), /10 000 Kč z ledna 2005/);
  assert.ok(await page.$('[data-graf-hladiny] svg'));
  assert.ok(await page.$('[data-graf-inflace] svg'));
  assert.ok(await page.$('[data-tabulka] table'));
  assert.equal(await page.$eval('[data-zalozky]', (el) => getComputedStyle(el).display), 'none');
  assert.equal(await page.$eval('#panel-prepocet', (el) => el.hidden), false);
  await page.close();
});
