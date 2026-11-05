// E2E: Bydlometr ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/bydlometr.test.js
// Kontrolní příklady ze zadání (docs/zadani.md, oddíl Bydlometr): anuita 3,5 mil. Kč / 25 let / 4,94 %
// a strop poplatku za mimořádnou splátku 500 000 Kč se 3 roky do konce fixace.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'bydleni-energie/bydlometr/';
const castka = (t) => Number(t.replace(/[^\d−-]/g, '').replace('−', '-'));

test('refixace: 3 500 000 Kč, 25 let, 4,94 % → splátka 20 337 Kč ± 5 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#rf-zustatek', '3 500 000');
  await vypln(page, '#rf-zbyva', '25');
  await vypln(page, '#rf-sazba-banky', '4,94');
  const splatka = castka(await text(page, 'tr[data-varianta="accept"] td[data-label="Splátka"] .num'));
  assert.ok(Math.abs(splatka - 20337) <= 5, `splátka ${splatka}`);
  // Výsledek a lepivá lišta ukazují nejlevnější variantu a sedí spolu
  assert.equal(await text(page, '[data-lista-cislo]'), await text(page, '#vysledek [data-vysledek-cislo]'));
  assert.match(await text(page, '#rf-krok-1 .step-sum'), /3 500 000 Kč, 25 let/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('poplatek: mimořádná splátka 500 000 Kč, 3 roky do konce fixace → nejvýš 3 750 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#pp-castka', '500 000');
  await vypln(page, '#pp-smlouva', '2025-03-01');
  await vypln(page, '#pp-zacatek', '2025-03-01');
  await vypln(page, '#pp-konec', '2030-03-01');
  await vypln(page, '#pp-splatka', '2027-03-01');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '3 750 Kč');
  assert.match(await text(page, '[data-poplatek-duvod]'), /3 × 0,25 % = 0,75 %/);
  // Ke konci fixace je splátka zdarma
  await vypln(page, '#pp-splatka', '2030-03-01');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '0 Kč');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('nájem vs. koupě: výchozí příklad ukáže bod zvratu, graf a tabulku po letech', async () => {
  const { page, chyby } = await otevri(`${CESTA}#najem-vs-koupe`, { sirka: 1440, vyska: 900 });
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), false);
  assert.equal(await page.$eval('#panel-refixace', (el) => el.hidden), true);
  assert.match(await text(page, '#vysledek-najem-nadpis'), /^Za 20 let vychází lépe (koupě|nájem)$/);
  assert.match(await text(page, '#vysledek-najem .stats li:first-child b'), /^\d+\. rok$/);
  assert.ok(await page.$('[data-graf] svg[role="img"]'), 'graf čistého jmění');
  const legenda = await text(page, '[data-graf] .graf-legenda');
  assert.match(legenda, /Koupě/);
  assert.match(legenda, /Nájem \+ investice/);
  assert.match(legenda, /Bod zvratu: \d+\. rok/);
  assert.ok(await page.$('[data-graf] .graf-carkovana'), 'nájem je čárkovaně');
  assert.equal(await page.$$eval('[data-tabulka-let] tbody tr', (r) => r.length), 20);
  assert.equal(await text(page, '[data-lista-cislo]'), await text(page, '#vysledek-najem .stats li:first-child b'));
  // Změna vstupu přepočítá výsledek (vyšší výnos investic nahrává nájmu)
  const pred = await text(page, '#vysledek-najem [data-vysledek-vysvetleni]');
  await vypln(page, '#nk-vynos', '12');
  assert.notEqual(await text(page, '#vysledek-najem [data-vysledek-vysvetleni]'), pred);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('záložky fungují z klávesnice (šipky, Home, End) a mění hash', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const vybrana = () => page.$eval('[role="tab"][aria-selected="true"]', (el) => el.dataset.zalozka);
  const fokus = () => page.evaluate(() => document.activeElement?.dataset.zalozka);
  assert.equal(await vybrana(), 'refixace');
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), true);
  await page.focus('#zalozka-refixace');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'najem');
  assert.equal(await fokus(), 'najem');
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), false);
  assert.equal(await page.$eval('#panel-refixace', (el) => el.hidden), true);
  assert.equal(await page.evaluate(() => location.hash), '#najem-vs-koupe');
  assert.equal(await page.$eval('#panel-najem', (el) => el.getAttribute('role')), 'tabpanel');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'refixace');
  await page.keyboard.press('End');
  assert.equal(await vybrana(), 'najem');
  await page.keyboard.press('Home');
  assert.equal(await vybrana(), 'refixace');
  assert.equal(await page.evaluate(() => location.hash), '#refixace');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await vybrana(), 'najem');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('chybný vstup ukáže chybu u pole a výsledek nezmění', async () => {
  const { page, chyby } = await otevri(CESTA);
  const pred = await text(page, '#vysledek [data-vysledek-cislo]');
  await vypln(page, '#rf-zustatek', 'abc');
  assert.equal(await page.$eval('#rf-zustatek-chyba', (el) => el.hidden), false);
  assert.equal(await page.$eval('#rf-zustatek', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), pred);
  await vypln(page, '#rf-zustatek', '2 800 000');
  assert.equal(await page.$eval('#rf-zustatek-chyba', (el) => el.hidden), true);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JavaScriptu: obě části pod sebou s ukázkovým výsledkem, bez záložek', async () => {
  const { page } = await otevri(CESTA, { js: false });
  const stav = await page.evaluate(() => {
    const vidno = (sel) => { const el = document.querySelector(sel); return !!el && el.getBoundingClientRect().height > 0; };
    return {
      refixace: vidno('#panel-refixace'),
      najem: vidno('#panel-najem'),
      zalozky: vidno('[role="tablist"]'),
      ukazky: document.querySelectorAll('[data-ukazka]').length,
      graf: vidno('[data-graf] svg'),
    };
  });
  assert.deepEqual(stav, { refixace: true, najem: true, zalozky: false, ukazky: 3, graf: true });
  assert.match(await text(page, '#vysledek [data-vysledek-cislo]'), /^\d[\d ]* Kč$/);
  assert.match(await text(page, '#vysledek-najem-nadpis'), /^Za 20 let vychází lépe/);
  assert.equal(await text(page, '[data-poplatek-cislo]'), '2 250 Kč');
  await page.close();
});
