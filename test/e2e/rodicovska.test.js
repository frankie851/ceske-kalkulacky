// E2E: Rodičovská pro celou rodinu ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/rodicovska.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'prace-rodina/rodicovska/';
const KLIC = 'spocitano-rodicovska';
const statistika = (page, i) => text(page, `#vysledek .stats > li:nth-child(${i})`);
// Klik přes DOM: na mobilu tlačítka může zakrývat lepivá lišta
const klik = (page, sel) => page.$eval(sel, (el) => el.click());
const osa = (page) => page.$eval('[data-osa] svg', (el) => el.outerHTML);

// Dítě narozené v roce 2026 → rodičovský příspěvek 350 000 Kč
async function terminDo2026(page) {
  await vypln(page, '#termin', '2026-12-15');
}

test('RP 15 000 Kč měsíčně → 350 000 Kč vyčerpáno za 24 měsíců', async () => {
  const { page } = await otevri(CESTA);
  await terminDo2026(page);
  await vypln(page, '#rp-vyse', '15000');
  assert.equal(await text(page, '[data-rp-text]'), '15 000 Kč');
  assert.match(await statistika(page, 1), /350 000 Kč za 24 měsíců čerpání/);
  assert.match(await text(page, '#vysledek [data-vysledek-vysvetleni]'), /350 000 Kč po 15 000 Kč měsíčně vystačí na 24 měsíců/);
  assert.match(await text(page, '#tabulka-souhrnu tbody tr:nth-child(3)'), /^Rodičovský příspěvek\s*350 000 Kč/);
  assert.equal(await page.$eval('[data-rp-navrh]', (el) => el.getAttribute('aria-pressed')), 'false');
  await page.close();
});

test('mateřská z hrubé mzdy 30 000 Kč (nástup 2026): čistá mzda 24 590 Kč, 691 Kč denně, 135 436 Kč', async () => {
  const { page } = await otevri(CESTA);
  await terminDo2026(page);
  await vypln(page, '#prijem-matka', '30 000');
  assert.match(await text(page, '#prijem-matka-napoveda'), /čistá mzda 24 590 Kč/);
  assert.match(await statistika(page, 2), /^135 436 Kč\s*mateřská \(matka 691 Kč denně\)/);
  await page.close();
});

test('nevyčerpaná rodičovská → varování o propadnutí a tlačítko Vyčerpat do 3 let', async () => {
  const { page } = await otevri(CESTA);
  await terminDo2026(page);
  await vypln(page, '#rp-vyse', '8000');
  assert.match(await text(page, '[data-varovani]'), /Část rodičovského příspěvku propadne/);
  await klik(page, '[data-rp-navrh]');
  assert.doesNotMatch(await text(page, '[data-varovani]'), /propadne/);
  assert.match(await statistika(page, 4), /^0 Kč/);
  await klik(page, '[data-rp-max]');
  assert.equal(await page.$eval('[data-rp-max]', (el) => el.getAttribute('aria-pressed')), 'true');
  await page.close();
});

test('změna termínu porodu přepočítá časovou osu', async () => {
  const { page } = await otevri(CESTA);
  const pred = await osa(page);
  await vypln(page, '#termin', '2026-09-01');
  const po = await osa(page);
  assert.notEqual(po, pred);
  assert.match(po, /zář 2026<tspan class="znacka"> ★/);
  assert.match(await text(page, '#krok-dite .step-sum'), /1\. 9\. 2026/);
  await page.close();
});

test('ukládání jen na kliknutí: Uložit, Načíst uložené, Smazat', async () => {
  const { page } = await otevri(CESTA);
  const ulozeno = () => page.evaluate((k) => localStorage.getItem(k), KLIC);
  await page.evaluate((k) => localStorage.removeItem(k), KLIC);
  await page.reload({ waitUntil: 'networkidle0' });
  await vypln(page, '#prijem-otec', '61 000');
  await vypln(page, '#termin', '2026-12-15');
  assert.equal(await ulozeno(), null, 'bez kliknutí se nic neukládá');

  await klik(page, '[data-ulozeni-ulozit]');
  assert.ok(await ulozeno(), 'po Uložit existuje záznam');

  await page.reload({ waitUntil: 'networkidle0' });
  assert.notEqual(await page.$eval('#prijem-otec', (el) => el.value), '61 000', 'po načtení stránky se nic neobnovuje samo');
  await klik(page, '[data-ulozeni-nacist]');
  assert.equal(await page.$eval('#prijem-otec', (el) => el.value), '61 000');
  assert.equal(await page.$eval('#termin', (el) => el.value), '2026-12-15');

  await klik(page, '[data-ulozeni-smazat]');
  assert.equal(await ulozeno(), null, 'Smazat záznam odstraní');
  await page.close();
});

test('chybový stav jen při skutečné chybě', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await vypln(page, '#prijem-matka', '-5');
  assert.match(await text(page, '#prijem-matka-chyba'), /záporný/);
  await vypln(page, '#prijem-matka', '40 000');
  await vypln(page, '#termin', '2025-06-01');
  assert.match(await text(page, '#termin-chyba'), /Zadej termín od/);
  await vypln(page, '#termin', '2027-02-01');
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await page.close();
});

test('žádné chyby v konzoli (střídání, návrat, vícerčata, otec na mateřské)', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await page.click('label[for="vicercata-ano"]');
  await page.click('label[for="stridani-ano"]');
  await page.click('label[for="navrat-ano"]');
  await vypln(page, '#navrat-od', '10');
  await page.click('label[for="kdo-ppm-otec"]');
  await page.click('label[for="otcovska-ne"]');
  assert.ok(await page.$eval('[data-osa] svg', (el) => el.querySelectorAll('.seg-ppm-otec').length > 0));
  await page.setViewport({ width: 390, height: 844 });
  await new Promise((r) => setTimeout(r, 200));
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JavaScriptu: ukázkový výsledek a časová osa', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.match(await text(page, '#vysledek [data-vysledek-cislo]'), /\d Kč$/);
  assert.ok(await page.$('[data-osa] svg .seg-rp'));
  assert.equal(await page.$eval('[data-ulozeni]', (el) => el.hidden), true);
  await page.close();
});
