// E2E: Penzijko kompas ve skutečném UI (Puppeteer nad _site).
// Spuštění: npx eleventy && node --test test/e2e/penzijko-kompas.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

const CESTA = 'penize/penzijko-kompas/';
after(zavri);

async function zvolSadu(page, klic) {
  await page.click(`label[for="sada-${klic}"]`);
}

const viditelne = (page, sel) => page.$eval(sel, (el) => {
  const r = el.getBoundingClientRect();
  return !el.closest('[hidden]') && getComputedStyle(el).display !== 'none' && r.width > 0 && r.height > 0;
});

test('věk 35, vklad 1 700, pravidla 2026 → 340 Kč měsíčně, 4 080 Kč ročně', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#vek', 35);
  await vypln(page, '#vklad', 1700);
  await zvolSadu(page, '2026');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '340 Kč');
  assert.match(await text(page, '[data-vysledek-popis]'), /4 080 Kč za rok/);
  assert.equal(await text(page, '[data-sada="2026"] [data-mesicne]'), '340 Kč');
  assert.equal(await text(page, '[data-sada="2026"] [data-rocne]'), '4 080 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '340 Kč');
  assert.equal(await viditelne(page, '[data-hlavni-navrh] .badge'), false, 'u pravidel 2026 štítek návrhu ve výsledku není');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('věk 25, návrh 2027, vklad 1 700 → 8 160 Kč ročně a štítek návrhu je vidět', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await vypln(page, '#vek', 25);
  await vypln(page, '#vklad', 1700);
  await zvolSadu(page, 'navrh2027');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '680 Kč');
  assert.match(await text(page, '[data-vysledek-popis]'), /8 160 Kč za rok/);
  assert.equal(await text(page, '[data-sada="navrh2027"] [data-rocne]'), '8 160 Kč');
  assert.equal(await text(page, '[data-sada="2026"] [data-rocne]'), '4 080 Kč');
  assert.ok(await viditelne(page, '[data-hlavni-navrh] .badge'), 'štítek návrhu ve výsledku je vidět');
  assert.equal(await text(page, '[data-hlavni-navrh] .badge'), 'Návrh, zatím neschváleno');
  assert.match(await text(page, '[data-hlavni-sada]'), /Návrh 2027/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('vklad 400 → státní příspěvek 0', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#vek', 35);
  await vypln(page, '#vklad', 400);
  assert.equal(await text(page, '[data-vysledek-cislo]'), '0 Kč');
  assert.equal(await text(page, '[data-sada="2026"] [data-rocne]'), '0 Kč');
  assert.match(await text(page, '[data-sada="2026"] [data-vysvetleni]'), /od vkladu 500 Kč/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('přepnutí fondu mění graf, tabulku i kartu transformovaného fondu', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const tvuj = () => text(page, '[data-tabulka] tr.hl th');
  const legenda = () => text(page, '[data-graf="realne"] .graf-legenda');
  const cara = () => page.$eval('[data-graf="realne"] .graf-zvyraznena', (el) => el.closest('g').getAttribute('class'));
  assert.match(await tvuj(), /^Transformovaný/);
  assert.match(await legenda(), /Transformovaný \(tvůj fond\)/);
  const caraPred = await cara();
  assert.ok(await viditelne(page, '#karta-tf h2'));

  await page.select('#fond', 'akciovy');
  assert.match(await tvuj(), /^Akciový/);
  assert.match(await legenda(), /Akciový \(tvůj fond\)/);
  assert.notEqual(await cara(), caraPred, 'zvýrazněná čára patří jinému fondu');
  assert.equal(await page.$eval('#sprava', (el) => el.value), '1');
  assert.equal(await page.$eval('#zhodnoceni', (el) => el.value), '15');
  assert.equal(await viditelne(page, '#karta-tf h2'), false, 'karta transformovaného fondu zmizí');

  // Přepínač reálně / nominálně
  assert.ok(await viditelne(page, '[data-graf="realne"] svg'));
  await page.click('label[for="zobrazeni-nominal"]');
  assert.ok(await viditelne(page, '[data-graf="nominal"] svg'));
  assert.equal(await viditelne(page, '[data-graf="realne"] svg'), false);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('neplatný vstup ukáže chybu u pole, oprava ji schová', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#vek', 'abc');
  assert.equal(await page.$eval('#vek', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.ok(await viditelne(page, '#vek-chyba'));
  await vypln(page, '#vek', '40');
  assert.equal(await page.$eval('#vek', (el) => el.hasAttribute('aria-invalid')), false);
  assert.equal(await page.$eval('#vek-chyba', (el) => el.hidden), true);
  assert.equal(await page.$$eval('.field.is-error', (els) => els.length), 0);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('stránka se načte bez chyb v konzoli', async () => {
  for (const sirka of [390, 1440]) {
    const { page, chyby } = await otevri(CESTA, { sirka, vyska: 900 });
    await vypln(page, '#vklad', 2500);
    await page.select('#fond', 'zivotniCyklus');
    await zvolSadu(page, 'navrh2027');
    await vypln(page, '#vek', 70);
    await vypln(page, '#vek', 30);
    assert.deepEqual(chyby, [], `chyby v konzoli na ${sirka} px`);
    await page.close();
  }
});

test('bez JavaScriptu je vidět ukázkový výsledek', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.ok(await page.$('[data-ukazka]'));
  assert.equal(await text(page, '[data-ukazka] [data-vysledek-cislo]'), '200 Kč');
  assert.match(await text(page, '[data-ukazka] [data-vysledek-popis]'), /2 400 Kč za rok/);
  assert.match(await text(page, '[data-ukazka] .result-kicker'), /Ukázka/);
  assert.ok(await page.$('[data-graf="realne"] svg'), 'graf je vykreslený při buildu');
  assert.equal(await page.$$eval('[data-tabulka] tbody tr', (r) => r.length), 5);
  assert.ok(await viditelne(page, '#karta-tf h2'));
  assert.ok((await page.$$('[data-kroky] li')).length > 0);
  await page.close();
});
