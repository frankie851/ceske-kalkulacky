// E2E: Slevy 2027 – průvodce po krocích nad sestaveným webem (kontrolní příklady ze zadání).
// Spuštění: npx eleventy && node --test test/e2e/slevy-2027.test.js
import { test, after, describe } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, zavri, text, vypln } from './pomocnik.mjs';

after(zavri);

const CESTA = 'dane-podnikani/slevy-2027/';

async function nadpis(page) {
  return text(page, '#krok-nadpis');
}
async function pokracovat(page) {
  const pred = await page.$eval('.bar-label', (el) => el.textContent);
  await page.click('.quiz button[type="submit"]');
  await page.waitForFunction((p) => !document.querySelector('.bar-label') || document.querySelector('.bar-label').textContent !== p
    || document.querySelector('.quiz .error-msg'), {}, pred);
}
async function zpet(page) {
  await page.click('.quiz [data-akce="zpet"]');
}
/** Klikne na dlaždici (rádio / zaškrtávátko) podle name a hodnoty. */
async function zvol(page, nazev, hodnota = 'ano') {
  await page.click(`input[name="${nazev}"][value="${hodnota}"] + label`);
}
/** Pokračuje, dokud se neukáže výsledek. */
async function dokonce(page) {
  while (!(await page.$('#vysledek'))) await pokracovat(page);
  return text(page, '#vysledek');
}
async function rocne(page, id) {
  return text(page, `tr[data-polozka="${id}"] td[data-rocne]`);
}

describe('Slevy 2027 – kontrolní příklady', () => {
  test('student 22 let po celý rok → sleva na studenta 4 020 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    assert.equal(await page.$('#slevy-bez-js'), null, 'blok bez JS se má odstranit');
    await vypln(page, '#narRok', 2005);
    await pokracovat(page);
    assert.match(await nadpis(page), /^Studuješ v roce 2027/);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'krok-nadpis', 'fokus na nadpisu kroku');
    await zvol(page, 'studuje', 'ano');
    const karta = await dokonce(page);
    assert.match(karta, /Až \d/);
    assert.match(await rocne(page, 'student'), /^4 020 Kč$/);
    assert.match(await text(page, 'tr[data-polozka="student"] th'), /Novinka 2027/);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'vysledek-nadpis');
    assert.match(await text(page, '.slevy-seznam'), /Potvrzení školy/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('dvě děti po celý rok → zvýhodnění 37 524 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1990);
    await pokracovat(page);
    await pokracovat(page);
    assert.match(await nadpis(page), /^Máš děti/);
    await page.click('[data-akce="pridat"]');
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'ditRok0');
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2018);
    await vypln(page, '#ditRok1', 2021);
    await dokonce(page);
    assert.match(await rocne(page, 'deti'), /^37 524 Kč$/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('školkovné 30 000 Kč → sleva 24 900 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1990);
    await pokracovat(page);
    await pokracovat(page);
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2023);
    await pokracovat(page);
    assert.match(await nadpis(page), /^Chodí některé dítě do školky/);
    await zvol(page, 'skolka0');
    await vypln(page, '#skolne0', '30 000');
    await dokonce(page);
    assert.match(await rocne(page, 'skolkovne'), /^24 900 Kč$/);
    assert.deepEqual(chyby, []);
    await page.close();
  });
});

// Revize 5. 11. 2026: SLV-01 (zastaralé školkovné) a SLV-02 (věk 18/26 let).
describe('Slevy 2027 – opravy podle revize', () => {
  test('SLV-01: školka zaškrtnutá u dítěte 2023, pak rok změněn na 2012 → žádné školkovné', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1990);
    await pokracovat(page);
    await pokracovat(page);
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2023);
    await pokracovat(page);
    await zvol(page, 'skolka0');
    await vypln(page, '#skolne0', '20 000');
    await pokracovat(page);
    await zpet(page);
    await zpet(page);
    assert.match(await nadpis(page), /^Máš děti/);
    await vypln(page, '#ditRok0', 2012);
    await pokracovat(page);
    assert.match(await text(page, '.quiz'), /Žádné dítě v předškolním věku/);
    await dokonce(page);
    assert.equal(await page.$('tr[data-polozka="skolkovne"]'), null);
    assert.doesNotMatch(await text(page, '#vysledek'), /školkovné/i);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('SLV-02: dítě nar. 6/2009 bez studia → zvýhodnění jen do 18 let (7 602 Kč), se studiem 15 204 Kč', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1980);
    await pokracovat(page);
    await pokracovat(page);
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2009);
    await page.select('#ditMesic0', '6');
    await dokonce(page);
    assert.match(await rocne(page, 'deti'), /^7 602 Kč$/);
    await page.close();
    const druha = await otevri(CESTA);
    await vypln(druha.page, '#narRok', 1980);
    await pokracovat(druha.page);
    await pokracovat(druha.page);
    await druha.page.click('[data-akce="pridat"]');
    await vypln(druha.page, '#ditRok0', 2009);
    await druha.page.select('#ditMesic0', '6');
    await zvol(druha.page, 'ditStuduje0');
    await dokonce(druha.page);
    assert.match(await rocne(druha.page, 'deti'), /^15 204 Kč$/);
    assert.deepEqual([...chyby, ...druha.chyby], []);
    await druha.page.close();
  });

  // Revize 5. 11. 2026, SLV-10: věk dovršený 1. dne měsíce a sleva na manžela jen ze zadaných dětí.
  test('SLV-10: dítě nar. 1. 6. 2009 bez studia → zvýhodnění za 5 měsíců (6 335 Kč)', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1980);
    await pokracovat(page);
    await pokracovat(page);
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2009);
    await page.select('#ditMesic0', '6');
    await zvol(page, 'ditPrvni0');
    await dokonce(page);
    assert.match(await rocne(page, 'deti'), /^6 335 Kč$/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('SLV-10: manžel pečuje o dítě do 3 let, ale dítě není zadané → 0 Kč a rada zadat dítě', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1990);
    while (!/^Manžel nebo manželka/.test(await nadpis(page))) await pokracovat(page);
    await zvol(page, 'maManzela', 'ano');
    await zvol(page, 'peceODite');
    assert.match(await text(page, '#slevy-formular'), /Dítě zadej i v kroku „Děti“/);
    await dokonce(page);
    assert.match(await rocne(page, 'manzel'), /^0 Kč$/);
    assert.match(await text(page, 'tr[data-polozka="manzel"]'), /zadej i v kroku „Děti“/);
    assert.deepEqual(chyby, []);
    await page.close();
  });
});

describe('Slevy 2027 – ovládání', () => {
  test('chybějící rok narození ukáže chybu u pole', async () => {
    const { page } = await otevri(CESTA);
    await pokracovat(page);
    assert.equal(await page.$eval('#narRok', (el) => el.getAttribute('aria-invalid')), 'true');
    assert.match(await text(page, '#narRok-chyba'), /Zadej rok narození/);
    assert.equal(await page.evaluate(() => document.activeElement?.id), 'narRok');
    await page.close();
  });

  test('čísla v českém zápisu: „40.000“ = 40 000 Kč, haléře → hláška u pole', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1990);
    await vypln(page, '#mzda', '50.000');
    await pokracovat(page);
    assert.equal(await page.$('#mzda-chyba'), null, '„50.000“ je platná mzda');
    for (let i = 0; i < 10 && !/^Hypotéka/.test(await nadpis(page)); i++) await pokracovat(page);
    assert.match(await nadpis(page), /^Hypotéka/);
    await vypln(page, '#uroky', '1500,50');
    await pokracovat(page);
    assert.equal(await page.$eval('#uroky', (el) => el.getAttribute('aria-invalid')), 'true');
    assert.match(await text(page, '#uroky-chyba'), /celé číslo/);
    await vypln(page, '#uroky', '40.000');
    await dokonce(page);
    assert.match(await rocne(page, 'uroky'), /odpočet 40 000 Kč$/);
    // Kontrolní seznam tyká: žádné „jste nepracovali“ ani limit opsaný natvrdo.
    assert.doesNotMatch(await text(page, '.slevy-seznam'), /\bjste\b|nepracovali/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('Zpět zachová odpovědi', async () => {
    const { page, chyby } = await otevri(CESTA);
    await vypln(page, '#narRok', 1995);
    await vypln(page, '#mzda', 32000);
    await pokracovat(page);
    await zvol(page, 'studuje', 'ano');
    await pokracovat(page);
    await page.click('[data-akce="pridat"]');
    await vypln(page, '#ditRok0', 2020);
    await zpet(page);
    assert.equal(await page.$eval('input[name="studuje"][value="ano"]', (el) => el.checked), true);
    await zpet(page);
    assert.equal(await page.$eval('#narRok', (el) => el.value), '1995');
    assert.equal(await page.$eval('#mzda', (el) => el.value), '32000');
    await pokracovat(page);
    await pokracovat(page);
    assert.equal(await page.$eval('#ditRok0', (el) => el.value), '2020');
    // Z výsledku zpět k poslední otázce a znovu na výsledek
    await dokonce(page);
    await page.click('[data-akce="upravit"]');
    assert.match(await nadpis(page), /^Máš i jiné příjmy/);
    await dokonce(page);
    assert.match(await rocne(page, 'deti'), /Kč$/);
    assert.deepEqual(chyby, []);
    await page.close();
  });

  test('bez JavaScriptu je vidět ukázkový výsledek', async () => {
    const { page } = await otevri(CESTA, { js: false });
    const ukazka = await page.$('[data-ukazka]');
    assert.ok(ukazka, 'chybí [data-ukazka]');
    assert.ok(await ukazka.isVisible());
    assert.match(await text(page, '[data-ukazka]'), /Ukázkový výsledek/);
    assert.match(await rocne(page, 'student'), /^4 020 Kč$/);
    await page.close();
  });
});
