// E2E: Exekuce, nebo oddlužení? ve skutečném UI.
// Spuštění: npx eleventy && node --test test/e2e/dluhy.test.js
// Kontrolní příklady ze zadání (rok 2026) a z test/dluhy.test.js.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'dluhy/exekuce-nebo-oddluzeni/';
const srazka = (page) => text(page, '[data-ex-srazka]');

async function zadej(page, { mzda, dluh, osoby, exekuce, prednostni } = {}) {
  if (mzda !== undefined) await vypln(page, '#mzda', mzda);
  if (dluh !== undefined) await vypln(page, '#dluh', dluh);
  if (osoby !== undefined) await vypln(page, '#osoby', osoby);
  if (exekuce !== undefined) await vypln(page, '#exekuce', exekuce);
  if (prednostni !== undefined) await page.click(`label[for="druh-${prednostni ? 'prednostni' : 'bezne'}"]`);
}

test('23 000 Kč, běžný dluh → srážka 2 966 Kč', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '23 000', osoby: '0', prednostni: false });
  assert.equal(await srazka(page), '2 966 Kč');
  assert.equal(await text(page, '[data-ex-zustane]'), '20 034 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '20 034 Kč');
  await page.close();
});

test('50 000 Kč, přednostní dluh → srážka 25 391 Kč', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '50000', prednostni: true });
  assert.equal(await srazka(page), '25 391 Kč');
  assert.match(await text(page, '[data-rozpis]'), /dvě třetiny/);
  await page.close();
});

test('50 000 Kč, běžný dluh → srážka 14 884 Kč', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '50 000', prednostni: false });
  assert.equal(await srazka(page), '14 884 Kč');
  assert.match(await text(page, '[data-rozpis]'), /4 377 Kč/);
  await page.close();
});

test('2 vyživované osoby → nezabavitelná částka 21 153 Kč', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { osoby: '2' });
  assert.equal(await text(page, '[data-ex-nezabavitelna]'), '21 153 Kč');
  await page.close();
});

test('mzda pod nezabavitelnou částkou → srážka 0 Kč', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '12 000', exekuce: '5', prednostni: true });
  assert.equal(await srazka(page), '0 Kč');
  assert.equal(await text(page, '[data-ex-zustane]'), '12 000 Kč');
  assert.match(await text(page, '[data-ex-doba]'), /nestrhává nic/);
  await page.close();
});

test('oddlužení z 30 000 Kč a dluhu 400 000 Kč → splátka 10 598 Kč, 36 měsíců', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '30 000', dluh: '400 000', osoby: '0' });
  assert.equal(await text(page, '[data-od-splatka]'), '10 598 Kč');
  assert.match(await text(page, '[data-od-delka]'), /36 měsíců/);
  assert.equal(await text(page, '[data-od-spravce]'), '1 089 Kč');
  // opakované oddlužení trvá 60 měsíců
  await page.click('label[for="odpusteni-12az20"]');
  await vypln(page, '#dluh', '1 000 000');
  assert.match(await text(page, '[data-od-delka]'), /60 měsíců/);
  await page.close();
});

test('úrok z prodlení: pole se sazbou se ukáže a upozorní na růst dluhu', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await page.$eval('#urok-pole', (el) => el.hidden), true);
  await page.click('label[for="urok"]');
  assert.equal(await page.$eval('#urok-pole', (el) => el.hidden), false);
  await zadej(page, { mzda: '23 000', dluh: '500 000' });
  assert.match(await text(page, '[data-ex-upozorneni]'), /Dluh poroste rychleji/);
  await page.close();
});

test('chybný údaj ukáže chybu a výsledek nepřepíše', async () => {
  const { page } = await otevri(CESTA);
  await vypln(page, '#mzda', 'hodně');
  assert.equal(await page.$eval('#mzda', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await page.$eval('[data-chyby]', (el) => el.hidden), false);
  assert.equal(await srazka(page), '2 966 Kč');
  await vypln(page, '#mzda', '23 000');
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await page.close();
});

test('nic se neukládá ani nedává do adresy stránky', async () => {
  const { page } = await otevri(CESTA);
  const pred = await page.evaluate(() => ({ hash: location.hash, search: location.search }));
  await zadej(page, { mzda: '31 000', dluh: '250 000', osoby: '1', exekuce: '4', prednostni: true });
  await page.click('label[for="duchod"]');
  await page.click('label[for="urok"]');
  await vypln(page, '#sazba', '12');
  await page.focus('#mzda');
  await page.keyboard.press('Enter');
  await page.click('[data-ukaz-vysledek]');
  const po = await page.evaluate(() => ({
    hash: location.hash, search: location.search, ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie,
  }));
  assert.deepEqual({ hash: po.hash, search: po.search }, pred);
  assert.equal(po.ls, 0);
  assert.equal(po.ss, 0);
  assert.equal(po.cookie, '');
  await page.close();
});

test('žádné chyby v konzoli', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await zadej(page, { mzda: '40 000', prednostni: true });
  await page.click('label[for="odpusteni-do12"]');
  assert.equal(await page.$eval('[data-od-nelze]', (el) => el.hidden), false);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JavaScriptu stránka ukáže ukázkový výsledek obou cest', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.equal(await page.$eval('#mzda', (el) => el.value), '23 000');
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.equal(await srazka(page), '2 966 Kč');
  assert.equal(await text(page, '[data-ex-zustane]'), '20 034 Kč');
  assert.match(await text(page, '[data-ex-doba]'), /2 roky a 11 měsíců/);
  assert.equal(await text(page, '[data-od-splatka]'), '5 932 Kč');
  const karty = await page.$$eval('#vysledek article', (els) => els.map((e) => e.getBoundingClientRect().height > 0));
  assert.deepEqual(karty, [true, true]);
  // Pomoc je vidět bez posouvání i bez JS (mobilní lišta)
  const vidno = await page.evaluate(() => [...document.querySelectorAll('[data-pomoc]')].some((el) => {
    const r = el.getBoundingClientRect(); return r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight;
  }));
  assert.ok(vidno);
  await page.close();
});
