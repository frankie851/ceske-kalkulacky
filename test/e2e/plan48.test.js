// E2E: Plán48 ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/plan48.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'penize/plan48/';
const odpocet = (page) => text(page, '#vysledek [data-vysledek-cislo]');
const statistika = (page, i) => text(page, `#vysledek .stats > li:nth-child(${i}) b`);

test('výchozí stav: DPS 3 000 + ŽP 2 500 → odpočet 45 600 Kč', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await odpocet(page), '45 600 Kč');
  assert.equal(await statistika(page, 1), '6 840 Kč');
  assert.equal(await statistika(page, 2), '4 080 Kč');
  assert.equal(await statistika(page, 3), '2 400 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '45 600 Kč');
  await page.close();
});

test('DPS 5 700, ŽP 0 → odpočet 48 000 Kč a úspora 7 200 Kč', async () => {
  const { page } = await otevri(CESTA);
  await vypln(page, '#dps', '5 700');
  await vypln(page, '#zp', '0');
  assert.equal(await odpocet(page), '48 000 Kč');
  assert.equal(await statistika(page, 1), '7 200 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '48 000 Kč');
  await page.close();
});

test('DPS 400, ŽP 0 → státní příspěvek 0 Kč', async () => {
  const { page } = await otevri(CESTA);
  await vypln(page, '#dps', '400');
  await vypln(page, '#zp', '0');
  assert.equal(await statistika(page, 2), '0 Kč');
  assert.match(await text(page, '[data-akce]'), /Zvyš vklad na penzijko/);
  await page.close();
});

test('věk 25, Návrh 2027, DPS 1 700 → 8 160 Kč ročně a štítek návrhu', async () => {
  const { page } = await otevri(CESTA);
  const stitek = '#plan48-formular [data-stitek-sady]';
  assert.equal(await page.$eval(stitek, (el) => el.hidden), true);
  await vypln(page, '#vek', '25');
  await page.click('label[for="sada-navrh2027"]');
  await vypln(page, '#dps', '1 700');
  assert.equal(await statistika(page, 2), '8 160 Kč');
  for (const sel of ['#plan48-formular [data-stitek-sady]', '#vysledek [data-stitek-sady]']) {
    const vidno = await page.$eval(sel, (el) => !el.hidden && el.getBoundingClientRect().height > 0);
    assert.ok(vidno, `štítek ${sel} je vidět`);
    assert.match(await text(page, sel), /Návrh, zatím neschváleno/);
  }
  assert.match(await text(page, '#vysledek .result-kicker'), /Návrh 2027/);
  await page.close();
});

test('chybový stav jen při skutečné chybě', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await vypln(page, '#vek', '');
  assert.equal(await page.$eval('#vek', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.match(await text(page, '#vek-chyba'), /Vyplň věk/);
  await vypln(page, '#vek', '35');
  await vypln(page, '#dip', '-100');
  assert.match(await text(page, '#dip-chyba'), /záporná/);
  await vypln(page, '#dip', '0');
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await page.close();
});

test('žádné chyby v konzoli', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await vypln(page, '#vynos', '6');
  await page.click('label[for="sazba-23"]');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JS je vidět ukázkový výsledek 45 600 Kč', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.equal(await odpocet(page), '45 600 Kč');
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  await page.close();
});

// Revize 5. 11. 2026, P48-08: štítek návrhu i u dlaždice státního příspěvku a u projekce.
test('Návrh 2027 → štítek „Návrh, zatím neschváleno“ u dlaždice příspěvku a u projekce', async () => {
  const { page, chyby } = await otevri(CESTA);
  const stitky = ['#vysledek .stats > li:nth-child(2) [data-stitek-sady]', 'section[aria-labelledby="projekce-nadpis"] [data-stitek-sady]'];
  const vidno = (s) => page.$eval(s, (el) => !el.hidden && el.getBoundingClientRect().height > 0);
  for (const s of stitky) assert.equal(await vidno(s), false, `${s} je u pravidel 2026 skrytý`);
  await page.click('label[for="sada-navrh2027"]');
  for (const s of stitky) {
    assert.ok(await vidno(s), `${s} je u návrhu vidět`);
    assert.match(await text(page, s), /Návrh, zatím neschváleno/);
  }
  // Popis dlaždice se pořád přepisuje (štítek nesmí zabrat první <span>)
  await vypln(page, '#vek', '25');
  await vypln(page, '#dps', '1 700');
  assert.match(await text(page, '#vysledek .stats > li:nth-child(2) > span:first-of-type'), /státní příspěvek za rok/);
  await page.click('label[for="sada-2026"]');
  for (const s of stitky) assert.equal(await vidno(s), false, `${s} se u pravidel 2026 zase skryje`);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, P48-01: § 15 odst. 7 ZDP – odpočet DPS po měsících.
test('DPS 1 000 Kč, 10 měsíců za námi → rada „48 000 Kč mimořádně na penzijko“, ne 55 000 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#dps', '1 000');
  await vypln(page, '#zp', '0');
  await page.select('#mesicu', '10');
  const akce = await text(page, '[data-akce]');
  assert.match(akce, /48 000 Kč/);
  assert.doesNotMatch(akce, /55 000 Kč/);
  assert.deepEqual(chyby, []);
  await page.close();
});
