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

// DLU-06: formulář čte čísla sdíleným prectiCislo (src/js/cislo-vstup.js) – tečka jako oddělovač tisíců
test('formulář čte „23.000“ i „150.000“ jako tisíce, „23000,50“ jako desetinné číslo', async () => {
  const { page } = await otevri(CESTA);
  await zadej(page, { mzda: '23.000', dluh: '100 000', osoby: '0', prednostni: false });
  assert.equal(await srazka(page), '2 966 Kč');
  assert.equal(await text(page, '[data-ex-zustane]'), '20 034 Kč');
  await vypln(page, '#mzda', '23000,50');
  assert.equal(await srazka(page), '2 966 Kč');
  await vypln(page, '#mzda', '23 000 Kč');
  await vypln(page, '#dluh', '150.000');
  // 150 000 / 2 916 Kč měsíčně → 52 měsíců
  assert.match(await text(page, '[data-ex-doba]'), /4 roky a 4 měsíce/);
  await vypln(page, '#dluh', '1.500.000');
  assert.match(await text(page, '[data-ex-doba]'), /42 let a 11 měsíců/);
  await vypln(page, '#mzda', '-5000');
  assert.equal(await page.$eval('#mzda', (el) => el.getAttribute('aria-invalid')), 'true');
  await page.close();
});

// DLU-01: zákonná sazba podle pololetí vzniku prodlení (NV č. 351/2013 Sb., § 2 odst. 1)
test('úrok z prodlení: volba pololetí doplní sazbu z pravidel, vlastní sazba přepne na „jindy“', async () => {
  const { page } = await otevri(CESTA);
  await page.click('label[for="urok"]');
  await zadej(page, { mzda: '23 000', dluh: '100 000', osoby: '0', prednostni: false });
  await page.select('#pololeti', '2023-01-01');
  assert.equal(await page.$eval('#sazba', (el) => el.value), '15');
  assert.match(await text(page, '[data-ex-doba]'), /3 roky a 10 měsíců/);
  assert.match(await text(page, '[data-ex-upozorneni]'), /31 403 Kč/);
  await page.select('#pololeti', '2024-07-01');
  assert.equal(await page.$eval('#sazba', (el) => el.value), '12,75');
  await vypln(page, '#sazba', '9');
  assert.equal(await page.$eval('#pololeti', (el) => el.value), 'jina');
  await vypln(page, '#sazba', '11.5');
  assert.equal(await page.$eval('#sazba', (el) => el.getAttribute('aria-invalid')), null);
  await page.close();
});

// Další práce po revizi (13. 11. 2026): při chybě se karty výsledku neztlumí (nízký kontrast),
// ale skryjí a ukáže se hláška – stejně jako v Bydlometru a Rodičovské.
const viditelne = (page, sel) => page.$eval(sel, (el) => el.getClientRects().length > 0);

test('chybný údaj ukáže chybu, skryje výsledek a po opravě ho vrátí', async () => {
  const { page } = await otevri(CESTA);
  await vypln(page, '#mzda', 'hodně');
  assert.equal(await page.$eval('#mzda', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await page.$eval('[data-chyby]', (el) => el.hidden), false);
  assert.match(await text(page, '[data-chyby]'), /Do té doby výsledek neukazujeme/);
  assert.equal(await viditelne(page, '.dluhy-karty'), false, 'karty výsledku jsou skryté');
  assert.equal(await viditelne(page, '.dluhy-jak'), false, 'rozpis výpočtu je skrytý');
  assert.equal(await text(page, '[data-lista-cislo]'), '–');
  await vypln(page, '#mzda', '23 000');
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  assert.equal(await page.$eval('[data-chyby]', (el) => el.hidden), true);
  assert.equal(await viditelne(page, '.dluhy-karty'), true);
  assert.equal(await srazka(page), '2 966 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '20 034 Kč');
  await page.close();
});

test('axe ve stavu s chybou (360 px, světlý i tmavý režim): 0 serious/critical', async () => {
  const { AxePuppeteer } = await import('@axe-core/puppeteer');
  const { page, chyby } = await otevri(CESTA, { sirka: 360 });
  await vypln(page, '#mzda', 'hodně');
  await page.click('label[for="urok"]');
  await vypln(page, '#sazba', 'x');
  for (const rezim of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }]);
    await new Promise((r) => setTimeout(r, 400));
    const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    const vazne = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical')
      .map((x) => `${x.id}: ${x.nodes.slice(0, 2).map((n) => n.target.join(' ')).join(' | ')}`);
    assert.deepEqual(vazne, [], rezim);
    const preteka = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert.equal(preteka, false, `${rezim}: bez vodorovného posuvníku`);
  }
  assert.deepEqual(chyby, []);
  await page.close();
});

// Další práce po revizi (13. 11. 2026): náhrada plátci mzdy 50 Kč nenáleží u srážek nařízených
// před 1. 1. 2022 (zákon č. 286/2021 Sb., čl. II bod 3 a čl. IV body 1 a 12).
test('volba „Srážky ze mzdy byly nařízené před 1. 1. 2022“: věřitelé dostanou celou srážku', async () => {
  const { page, chyby } = await otevri(CESTA);
  await zadej(page, { mzda: '23 000', dluh: '100 000', osoby: '0', prednostni: false });
  assert.equal(await text(page, '[data-ex-vericum]'), '2 916 Kč');
  assert.match(await text(page, 'label[for="stare-srazky"]'), /Srážky ze mzdy byly nařízené před 1\. 1\. 2022/);
  await page.click('label[for="stare-srazky"]');
  assert.equal(await srazka(page), '2 966 Kč');
  assert.equal(await text(page, '[data-ex-vericum]'), '2 966 Kč');
  assert.match(await text(page, '[data-ex-doba]'), /2 roky a 10 měsíců/);
  assert.match(await text(page, '[data-ex-nahrada]'), /nic nenechá/);
  await page.click('label[for="stare-srazky"]');
  assert.equal(await text(page, '[data-ex-vericum]'), '2 916 Kč');
  assert.match(await text(page, '[data-ex-doba]'), /2 roky a 11 měsíců/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('axe s novou volbou zaškrtnutou (360 px, světlý i tmavý režim): 0 serious/critical', async () => {
  const { AxePuppeteer } = await import('@axe-core/puppeteer');
  const { page } = await otevri(CESTA, { sirka: 360 });
  await page.click('label[for="stare-srazky"]');
  for (const rezim of ['light', 'dark']) {
    await page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: rezim }]);
    await new Promise((r) => setTimeout(r, 400));
    const r = await new AxePuppeteer(page).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice']).analyze();
    const vazne = r.violations.filter((x) => x.impact === 'serious' || x.impact === 'critical').map((x) => x.id);
    assert.deepEqual(vazne, [], rezim);
  }
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
