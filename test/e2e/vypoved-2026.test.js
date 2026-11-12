// E2E: Výpověď 2026 – formulář nad sestaveným webem (kontrolní příklady ze zadání).
// Spuštění: npx eleventy && node --test test/e2e/vypoved-2026.test.js
import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, zavri, text, vypln } from './pomocnik.mjs';

after(zavri);

const CESTA = 'prace-rodina/vypoved-2026/';

async function podpora(page) {
  return page.$$eval('.vyp-podpora tbody tr:not(.vyp-soucet) td:nth-child(2)', (td) =>
    td.map((x) => x.childNodes[0].textContent.replace(/[  ]/g, ' ').trim()));
}

describe('Výpověď 2026 – kontrolní příklady', () => {
  test('doručení 10. 7. 2026, výpověď od zaměstnavatele, § 52 písm. c) → konec 10. 9. 2026', async () => {
    const { page, chyby } = await otevri(CESTA);
    assert.equal(await page.$eval('input[name="kdo"]:checked', (el) => el.value), 'zamestnavatel');
    await page.select('#duvod', 'c');
    await vypln(page, '#doruceni', '2026-07-10');
    assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '10. 9. 2026');
    assert.match(await text(page, '#vysledek .big-num-label'), /čtvrtek/i);
    assert.equal(await page.$eval('#datumZadosti', (el) => el.value), '2026-09-11', 'žádost předvyplněná na den po konci');
    assert.equal(await text(page, '[data-lista-cislo]'), '10. 9. 2026');
    assert.equal(await page.$('[data-ukazka]'), null, 'živý výsledek už není ukázka');
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('1,5 roku, průměrný výdělek 40 000 Kč, § 52 písm. c) → odstupné 80 000 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    await page.select('#duvod', 'c');
    await vypln(page, '#delka', '1,5');
    await vypln(page, '#hruby', '40 000');
    assert.match(await text(page, '#vypoved-vysledky .vyp-castka'), /^80 000 Kč$/);
    // výpověď ode mě → odstupné 0
    await page.click('#kdo-zamestnanec + label');
    assert.match(await text(page, '#vypoved-vysledky .vyp-castka'), /^0 Kč$/);
    assert.equal(await page.$eval('#duvod', (el) => el.closest('[data-pro]').hidden), true, 'důvod se u výpovědi ode mě skryje');
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('věk 40, čistý výdělek 30 000 Kč → podpora 24 000 / 24 000 / 15 000 / 15 000 / 12 000 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#doruceni', '2026-07-10');
    await vypln(page, '#vek', 40);
    await vypln(page, '#cisty', 30000);
    assert.deepEqual(await podpora(page), ['24 000 Kč', '24 000 Kč', '15 000 Kč', '15 000 Kč', '12 000 Kč']);
    assert.equal(await page.$('.vyp-podpora th:nth-child(3)'), null, 'v roce 2026 bez sloupce návrhu');
    // žádost v roce 2027 → sloupec „Pokud projde návrh“ se štítkem návrhu
    await vypln(page, '#datumZadosti', '2027-01-15');
    assert.match(await text(page, '.vyp-podpora thead'), /Pokud projde návrh/);
    assert.match(await text(page, '.vyp-navrh'), /Návrh, zatím neschváleno/);
    assert.deepEqual(chyby, []);
    await page.close();
  });
});

describe('Výpověď 2026 – ovládání', () => {
  test('dohoda ukáže sjednaný den, chybný věk ukáže chybu u pole', async () => {
    const { page, chyby } = await otevri(CESTA);
    await page.click('#kdo-dohoda + label');
    assert.equal(await page.$eval('#konecDohody', (el) => el.closest('[data-pro]').hidden), false);
    await vypln(page, '#konecDohody', '2026-12-31');
    await vypln(page, '#doruceni', '2026-12-01');
    assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '31. 12. 2026');
    await vypln(page, '#vek', 'abc');
    assert.equal(await page.$eval('#vek', (el) => el.getAttribute('aria-invalid')), 'true');
    assert.match(await text(page, '#vek-chyba'), /Zadej věk/);
    await page.click('#vypoved-formular button[type="submit"]');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'vek');
    await vypln(page, '#vek', 40);
    assert.equal(await page.$eval('#vek', (el) => el.hasAttribute('aria-invalid')), false);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('kontrolní seznam má termíny pro úřad práce a pojišťovnu', async () => {
    const { page } = await otevri(CESTA);
    await vypln(page, '#doruceni', '2026-07-10');
    const seznam = await text(page, '.vyp-seznam');
    assert.match(seznam, /Registrovat se na úřadu práce.*do 15\. 9\. 2026/);
    assert.match(seznam, /zdravotní pojištění.*do 19\. 9\. 2026/);
    await page.close();
  });

  test('bez JavaScriptu je vidět ukázkový výsledek', async () => {
    const { page } = await otevri(CESTA, { js: false });
    const ukazka = await page.$('[data-ukazka]');
    assert.ok(ukazka, 'chybí [data-ukazka]');
    assert.ok(await ukazka.isVisible());
    assert.match(await text(page, '[data-ukazka]'), /Ukázkový výsledek/);
    assert.match(await text(page, '.vyp-castka'), /^80 000 Kč$/);
    assert.deepEqual((await podpora(page)), ['24 000 Kč', '24 000 Kč', '15 000 Kč', '15 000 Kč', '12 000 Kč']);
    await page.close();
  });
});

// Revize 5. 11. 2026, VYP-03 a část 3 souhrnu: sdílené čtení čísel (src/js/cislo-vstup.js).
test('„40.000“ se čte jako 40 000 Kč, ne 40 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await page.select('#duvod', 'c');
  await vypln(page, '#delka', '1,5');
  await vypln(page, '#hruby', '40.000');
  assert.match(await text(page, '#vypoved-vysledky .vyp-castka'), /^80 000 Kč$/);
  assert.deepEqual(chyby, []);
  await page.close();
});
