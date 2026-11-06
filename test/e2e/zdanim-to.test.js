// E2E: Zdaním to? ve skutečném UI.
// Spuštění: npx eleventy && node --test test/e2e/zdanim-to.test.js
// Kontrolní příklady z docs/zadani-zdanim-to.md (dividendy při kurzu 23 Kč/USD, prodeje).
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const PRODEJE = 'penize/zdanim-to/';
const DIVIDENDY = 'penize/zdanim-to/dividendy/';
const stavy = (page) => page.$$eval('[data-zt-polozky] .tag', (els) => els.map((e) => e.textContent.trim()));
const bunka = (page, sloupec, radek = 1) => text(page, `[data-zt-tabulka] tbody tr:nth-child(${radek}) td:nth-of-type(${sloupec})`);

/* ---------- Prodeje ---------- */

test('prodeje: ukázka po načtení – zdaníš 20 000 Kč rozdílu', async () => {
  const { page, chyby } = await otevri(PRODEJE);
  assert.equal(await text(page, '#vysledek-nadpis'), 'Zdaníš 20 000 Kč rozdílu');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '20 000 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '20 000 Kč');
  assert.deepEqual(await stavy(page), ['Osvobozeno', 'Zdanitelné', 'Osvobozeno']);
  assert.match(await text(page, '[data-zt-polozky] li:nth-child(1) .zt-duvod'), /Časový test splněn od 2\. 3\. 2025/);
  assert.match(await text(page, '[data-zt-polozky] li:nth-child(3) .zt-duvod'), /Hodnotový test/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('prodeje: prodej po víc než 3 letech je osvobozený časovým testem', async () => {
  const { page } = await otevri(PRODEJE);
  await vypln(page, '#p2-nakup', '2022-03-01');
  await vypln(page, '#p2-prodej', '2025-03-02');
  // prodej z jiného roku se do roku 2026 nepočítá – vrátíme ho do roku 2026
  await vypln(page, '#p2-prodej', '2026-03-02');
  assert.deepEqual(await stavy(page), ['Osvobozeno', 'Osvobozeno', 'Osvobozeno']);
  assert.match(await text(page, '[data-zt-polozky] li:nth-child(2) .zt-duvod'), /Časový test splněn od 2\. 3\. 2025/);
  assert.equal(await text(page, '#vysledek-nadpis'), 'Nic nedaníš');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '0 Kč');
  await page.close();
});

test('prodeje: úhrn příjmů nad 100 000 Kč je zdanitelný, krypto zvlášť', async () => {
  const { page } = await otevri(PRODEJE);
  // krypto 30 000 Kč → hodnotový test; po zvýšení na 150 000 Kč zdanitelné
  await vypln(page, '#p3-prijem', '150 000');
  assert.deepEqual(await stavy(page), ['Osvobozeno', 'Zdanitelné', 'Zdanitelné']);
  assert.equal(await text(page, '[data-vysledek-cislo]'), '158 000 Kč');
  // akcie pod limit: cenné papíry 60 000 + 30 000 = 90 000 Kč → hodnotový test
  await vypln(page, '#p2-prijem', '30 000');
  await vypln(page, '#p2-naklady', '20 000');
  assert.equal(await text(page, '[data-zt-polozky] li:nth-child(2) .tag'), 'Osvobozeno');
  assert.match(await text(page, '[data-zt-polozky] li:nth-child(2) .zt-duvod'), /90 000 Kč, limit 100 000 Kč/);
  await page.close();
});

test('prodeje: přidání a odebrání řádku přečísluje řádky a přepočítá výsledek', async () => {
  const { page } = await otevri(PRODEJE);
  await page.click('[data-pridat]');
  assert.equal(await page.$$eval('[data-radek]', (els) => els.length), 4);
  assert.equal(await text(page, '[data-radek]:nth-child(4) legend'), 'Prodej 4');
  assert.equal(await page.evaluate(() => document.activeElement.id), 'p4-typ');
  // prázdný nový řádek nic nemění
  assert.equal(await page.$$eval('[data-zt-polozky] li', (els) => els.length), 3);
  await page.select('#p4-typ', 'kryptoaktivum');
  await vypln(page, '#p4-nakup', '2026-01-02');
  await vypln(page, '#p4-prodej', '2026-02-02');
  await vypln(page, '#p4-prijem', '80 000');
  await vypln(page, '#p4-naklady', '50 000');
  assert.equal(await page.$$eval('[data-zt-polozky] li', (els) => els.length), 4);
  // krypto 30 000 + 80 000 = 110 000 Kč → obě položky zdanitelné: 18 000 + 30 000 + akcie 20 000
  assert.equal(await text(page, '[data-vysledek-cislo]'), '68 000 Kč');
  // odebrat prodej 2 (akcie)
  await page.click('[data-radek]:nth-child(2) [data-odebrat]');
  assert.equal(await page.$$eval('[data-radek]', (els) => els.length), 3);
  assert.deepEqual(await page.$$eval('[data-radek] legend', (els) => els.map((e) => e.textContent.trim())), ['Prodej 1', 'Prodej 2', 'Prodej 3']);
  assert.equal(await page.$eval('[data-radek]:nth-child(3) [data-pole="prijem"]', (el) => el.id), 'p3-prijem');
  assert.equal(await page.$eval('label[for="p3-prijem"]', (el) => el.textContent.trim()), 'Příjem z prodeje');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '48 000 Kč');
  // poslední řádek odebrat nejde
  await page.click('[data-radek]:nth-child(3) [data-odebrat]');
  await page.click('[data-radek]:nth-child(2) [data-odebrat]');
  assert.equal(await page.$eval('[data-odebrat]', (el) => el.disabled), true);
  await page.close();
});

test('prodeje: chybné datum označí pole a položku', async () => {
  const { page } = await otevri(PRODEJE);
  await vypln(page, '#p1-prodej', '2021-01-01');
  assert.equal(await page.$eval('#p1-prodej', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await text(page, '[data-zt-polozky] li:nth-child(1) .tag'), 'Chybí údaje');
  await vypln(page, '#p1-prodej', '2026-03-02');
  assert.equal(await page.$eval('#p1-prodej', (el) => el.getAttribute('aria-invalid')), null);
  await page.close();
});

test('prodeje: bez JavaScriptu ukázkový výsledek', async () => {
  const { page } = await otevri(PRODEJE, { js: false });
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.equal(await page.$eval('#p1-nakup', (el) => el.value), '2022-03-01');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '20 000 Kč');
  assert.deepEqual(await stavy(page), ['Osvobozeno', 'Zdanitelné', 'Osvobozeno']);
  await page.close();
});

/* ---------- Dividendy ---------- */

async function jenPrvniVyplata(page) {
  await page.click('[data-radek]:nth-child(3) [data-odebrat]');
  await page.click('[data-radek]:nth-child(2) [data-odebrat]');
}

test('dividendy: ukázka po načtení – doplatíš 435 Kč, přeplaceno v USA 345 Kč', async () => {
  const { page, chyby } = await otevri(DIVIDENDY);
  assert.equal(await text(page, '#vysledek-nadpis'), 'Doplatíš 435 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '435 Kč');
  assert.match(await text(page, '[data-zt-upozorneni]'), /USA: přeplaceno v zahraničí 345 Kč/);
  assert.match(await text(page, '[data-zt-upozorneni]'), /W-8BEN/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('dividendy: 100 USD, sraženo 15 USD → základ 2 300, daň 345, zápočet 345, doplatek 0', async () => {
  const { page } = await otevri(DIVIDENDY);
  await jenPrvniVyplata(page);
  assert.equal(await bunka(page, 1), '2 300 Kč');
  assert.equal(await bunka(page, 2), '345 Kč');
  assert.equal(await bunka(page, 4), '345 Kč');
  assert.equal(await bunka(page, 5), '0 Kč');
  assert.equal(await text(page, '#vysledek-nadpis'), 'Nic nedoplácíš');
  assert.equal(await text(page, '[data-zt-upozorneni]'), '');
  await page.close();
});

test('dividendy: sraženo 30 USD (bez W-8BEN) → zápočet 345, doplatek 0, přeplaceno 345', async () => {
  const { page } = await otevri(DIVIDENDY);
  await jenPrvniVyplata(page);
  await vypln(page, '#d1-srazeno', '30');
  assert.equal(await bunka(page, 4), '345 Kč');
  assert.equal(await bunka(page, 5), '0 Kč');
  assert.equal(await bunka(page, 6), '345 Kč');
  assert.match(await text(page, '[data-zt-upozorneni]'), /přeplaceno v zahraničí 345 Kč.*W-8BEN/);
  await page.close();
});

test('dividendy: stát bez srážky → doplatíš 345 Kč', async () => {
  const { page } = await otevri(DIVIDENDY);
  await jenPrvniVyplata(page);
  await page.select('#d1-zeme', 'GB');
  await vypln(page, '#d1-srazeno', '0');
  assert.equal(await text(page, '#vysledek-nadpis'), 'Doplatíš 345 Kč');
  assert.equal(await bunka(page, 5), '345 Kč');
  assert.match(await text(page, '[data-zt-navod]'), /K doplacení zůstává 345 Kč/);
  await page.close();
});

test('dividendy: jednotný kurz musí být pro měnu stejný, jinak chyba', async () => {
  const { page } = await otevri(DIVIDENDY);
  await page.click('label[for="zpusob-jednotny"]');
  assert.equal(await page.$eval('[data-chyba]', (el) => el.hidden), true);
  assert.equal(await text(page, '#vysledek-nadpis'), 'Doplatíš 435 Kč');
  await vypln(page, '#d2-kurz', '22');
  assert.equal(await page.$eval('[data-chyba]', (el) => el.hidden), false);
  assert.match(await text(page, '[data-chyba-text]'), /stejný kurz/);
  assert.equal(await page.$eval('#d2-kurz', (el) => el.getAttribute('aria-invalid')), 'true');
  await page.click('label[for="zpusob-denni"]');
  assert.equal(await page.$eval('[data-chyba]', (el) => el.hidden), true);
  await page.close();
});

test('dividendy: přidání řádku', async () => {
  const { page } = await otevri(DIVIDENDY);
  await page.click('[data-pridat]');
  assert.equal(await text(page, '[data-radek]:nth-child(4) legend'), 'Výplata 4');
  await page.select('#d4-zeme', 'GB');
  await page.select('#d4-mena', 'GBP');
  await vypln(page, '#d4-hruba', '100');
  await vypln(page, '#d4-srazeno', '0');
  await vypln(page, '#d4-kurz', '29');
  assert.equal(await text(page, '#vysledek-nadpis'), 'Doplatíš 870 Kč');
  await page.close();
});

test('dividendy: bez JavaScriptu ukázkový výsledek', async () => {
  const { page } = await otevri(DIVIDENDY, { js: false });
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.equal(await page.$eval('#d1-kurz', (el) => el.value), '23');
  assert.equal(await text(page, '[data-vysledek-cislo]'), '435 Kč');
  assert.match(await text(page, '[data-zt-navod]'), /§ 8.*§ 16a/);
  await page.close();
});

/* ---------- Společné ---------- */

test('nic se neukládá ani nedává do adresy, 0 chyb v konzoli', async () => {
  for (const cesta of [PRODEJE, DIVIDENDY]) {
    const { page, chyby } = await otevri(cesta, { sirka: 1440, vyska: 900 });
    const pred = await page.evaluate(() => location.href);
    await page.click('[data-pridat]');
    await page.click('[data-radek]:nth-child(1) [data-odebrat]');
    const po = await page.evaluate(() => ({ href: location.href, ls: localStorage.length, ss: sessionStorage.length, cookie: document.cookie }));
    assert.equal(po.href, pred);
    assert.equal(po.ls, 0);
    assert.equal(po.ss, 0);
    assert.equal(po.cookie, '');
    assert.deepEqual(chyby, [], cesta);
    await page.close();
  }
});

test('po načtení JavaScriptu stránka neposkočí (CLS < 0,05, mobil, CPU × 6)', async () => {
  for (const cesta of [PRODEJE, DIVIDENDY]) {
    const { page } = await otevri(cesta, { sirka: 412, vyska: 823 });
    await page.emulateCPUThrottling(6);
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0;
      new PerformanceObserver((l) => {
        for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value;
      }).observe({ type: 'layout-shift', buffered: true });
    });
    await page.goto(new URL(cesta, page.url()).href, { waitUntil: 'networkidle0' });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((r) => setTimeout(r, 1000));
    const cls = await page.evaluate(() => window.__cls);
    console.log(`${cesta}: CLS ${cls.toFixed(4)}`);
    assert.ok(cls < 0.05, `${cesta}: CLS ${cls}`);
    await page.emulateCPUThrottling(1);
    await page.close();
  }
});
