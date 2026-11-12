// E2E: Spot, nebo fix? ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/spot-nebo-fix.test.js
// Očekávané částky počítáme v Node stejným modulem (vystup.js → calc.js computeVariants) nad stejnými daty
// a porovnáváme je s tím, co ukáže stránka.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';
import * as v from '../../src/nastroje/spot-nebo-fix/vystup.js';

after(zavri);

const CESTA = 'bydleni-energie/spot-nebo-fix/';
const SLOZKA = new URL('../../src/nastroje/spot-nebo-fix/', import.meta.url);
const cti = (soubor) => JSON.parse(fs.readFileSync(new URL(soubor, SLOZKA), 'utf8'));
const pravidla = cti('rules.json');
const tarify = cti('tariffs.json');
const dynamicky = cti('dynamic.json');
const D = v.pripravData({ ceny: cti('data/prices.json'), kurzy: cti('data/fx.json'), meta: cti('data/meta.json'), tarify, dynamicky });
const vychozi = v.vychoziVstup(pravidla, tarify, dynamicky);
const mezery = (t) => t.replace(/[\u00A0\u202F\u2009]/g, ' ').replace(/\s+/g, ' ').trim();

/** Očekávaný výstup pro vstup (výchozí + změny). */
function ocekavej(zmeny = {}) {
  const vstup = { ...vychozi, ...zmeny };
  const tdd = v.tridaTdd(tarify, vstup.sazba, vstup.region);
  const o = v.vystup(D, v.spocitej(D, vstup, cti(`data/tdd/${tdd}.json`).values), { tdd });
  return {
    tdd,
    nadpis: mezery(o.nadpis),
    cislo: mezery(o.cislo),
    karty: Object.fromEntries(o.karty.map((k) => [k.klic, mezery(k.castka)])),
    nejlevnejsi: o.nejlevnejsi,
  };
}

async function zobrazeno(page) {
  const karty = {};
  for (const k of ['fix', 'spot', 'dynamic']) karty[k] = await text(page, `[data-varianta="${k}"] [data-castka]`);
  const nejlevnejsi = await page.$$eval('.spot-varianta.is-best', (els) => els.map((el) => el.dataset.varianta));
  return {
    nadpis: await text(page, '#vysledek-nadpis'),
    cislo: await text(page, '#vysledek [data-vysledek-cislo]'),
    karty,
    nejlevnejsi,
  };
}

const spocitano = (page) => page.waitForFunction(() => document.querySelector('#vysledek').dataset.stav === 'hotovo', { timeout: 20000 });

test('výchozí stav: tři varianty a nejlevnější z buildu sedí s computeVariants', async () => {
  const { page, chyby } = await otevri(CESTA);
  const o = ocekavej();
  const z = await zobrazeno(page);
  assert.deepEqual(z.karty, o.karty);
  assert.equal(z.nadpis, o.nadpis);
  assert.equal(z.cislo, o.cislo);
  assert.deepEqual(z.nejlevnejsi, [o.nejlevnejsi]);
  assert.match(mezery(await page.$eval('main', (el) => el.innerText)), /Ceny z burzy do \d+\. \d+\. \d{4}/);
  assert.equal(await text(page, '[data-lista-cislo]'), o.cislo);
  assert.equal(await page.$$eval('[data-graf-mesice] svg[role="img"]', (els) => els.length), 2, 'měsíční graf (úzký a široký)');
  assert.equal(await page.$$eval('[data-graf-hodiny] svg[role="img"]', (els) => els.length), 2, 'hodinový graf');
  // Hodinový graf: jen 24 bodů na řadu, žádné tisíce bodů v SVG
  const body = await page.$$eval('[data-graf-hodiny="siroky"] .graf-bod', (els) => els.length);
  assert.ok(body <= 3 * 24, `bodů v hodinovém grafu: ${body}`);
  assert.equal(await page.$$eval('[data-tabulka-mesice] tbody tr', (els) => els.length), 13, '12 měsíců + celkem');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('změna spotřeby na 3 MWh přepočítá všechny tři varianty', async () => {
  const { page, chyby } = await otevri(CESTA);
  const pred = await zobrazeno(page);
  await vypln(page, '#mwh', '3');
  await spocitano(page);
  const o = ocekavej({ mwh: 3 });
  const z = await zobrazeno(page);
  assert.deepEqual(z.karty, o.karty);
  assert.notDeepEqual(z.karty, pred.karty);
  assert.equal(z.cislo, o.cislo);
  assert.equal(await text(page, '[data-lista-cislo]'), o.cislo);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('předvolba „Dům s tepelným čerpadlem“ načte jinou třídu TDD jen z vlastního webu', async () => {
  const { page, chyby, url } = await otevri(CESTA);
  const pozadavky = [];
  page.on('request', (r) => pozadavky.push(r.url()));
  const tc = pravidla.predvolby.find((p) => p.id === 'tc');
  await page.click('label[for="predvolba-3"]');
  await spocitano(page);
  const o = ocekavej({ sazba: tc.sazba, mwh: tc.mwh, jistic: tc.jistic });
  // Revize 5. 11. 2026, SPOT-01: D56d patří do TDD7 (příloha č. 6 vyhlášky 408/2015 Sb.), dřív TDD6.
  assert.equal(o.tdd, 'TDD7');
  assert.equal(await page.$eval('#sazba', (el) => el.value), tc.sazba);
  assert.equal(await page.$eval('#mwh', (el) => el.value), '9');
  const tdd = pozadavky.filter((u) => u.includes('/data/tdd/'));
  assert.equal(tdd.length, 1, `požadavky na TDD: ${tdd.join(', ')}`);
  assert.match(tdd[0], /\/nastroje\/spot-nebo-fix\/data\/tdd\/TDD7\.json$/);
  const host = new URL(url).host;
  assert.deepEqual(pozadavky.filter((u) => new URL(u).host !== host), [], 'žádný požadavek mimo vlastní web');
  assert.deepEqual((await zobrazeno(page)).karty, o.karty);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('posun spotřeby 20 % zlevní spot a dynamický tarif, fix nezmění', async () => {
  const { page, chyby } = await otevri(CESTA);
  const pred = await zobrazeno(page);
  await vypln(page, '#posun', '20');
  await spocitano(page);
  const o = ocekavej({ posun: 20 });
  const z = await zobrazeno(page);
  assert.deepEqual(z.karty, o.karty);
  assert.equal(z.karty.fix, pred.karty.fix);
  assert.notEqual(z.karty.spot, pred.karty.spot);
  assert.notEqual(z.karty.dynamic, pred.karty.dynamic);
  assert.equal(await text(page, '[data-posun-text]'), '20 %');
  assert.match(await text(page, '[data-varianta="spot"] [data-posun-efekt]'), /S posunem 20 % ušetříš \d/);
  assert.equal(await page.$$eval('[data-graf-hodiny="siroky"] .graf-legenda li', (els) => els.length), 3, 'křivka po posunu');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('chybná spotřeba ukáže chybu u pole a výsledek nechá', async () => {
  const { page } = await otevri(CESTA);
  const pred = await zobrazeno(page);
  await vypln(page, '#mwh', 'hodně');
  await page.waitForFunction(() => document.querySelector('#vysledek').dataset.stav === 'chyba');
  assert.equal(await page.$eval('#mwh', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.match(await text(page, '#mwh-chyba'), /číslem/);
  assert.deepEqual((await zobrazeno(page)).karty, pred.karty);
  await page.close();
});

test('bez JavaScriptu: ukázkový výsledek, grafy a datum dat z buildu', async () => {
  const { page } = await otevri(CESTA, { js: false });
  const o = ocekavej();
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.deepEqual((await zobrazeno(page)).karty, o.karty);
  assert.ok(await page.$('[data-graf-mesice] svg[role="img"]'));
  assert.match(await text(page, '#vysledek .note'), /Ceny z burzy do/);
  // Ceny jsou ve stránce kompaktně, ale bezeztrátově: po dekódování přesně data/prices.json
  const vlozene = JSON.parse(await page.$eval('#data-ceny', (el) => el.textContent));
  const ceny = cti('data/prices.json');
  assert.deepEqual(v.dekodujCeny(vlozene), Object.keys(ceny.days).sort().flatMap((d) => ceny.days[d]));
  await page.close();
});

test('po načtení stránka neposkočí: CLS < 0,05 (mobil 412 × 823, CPU 6× pomalejší)', async () => {
  const { page } = await otevri('404.html', { sirka: 412, vyska: 823 });
  await page.emulateCPUThrottling(6);
  await page.evaluateOnNewDocument(() => {
    window.__cls = 0;
    new PerformanceObserver((seznam) => {
      for (const z of seznam.getEntries()) if (!z.hadRecentInput) window.__cls += z.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(page.url().replace(/404\.html$/, CESTA), { waitUntil: 'networkidle0' });
  await page.evaluate(() => new Promise((hotovo) => setTimeout(hotovo, 1500)));
  const cls = await page.evaluate(() => window.__cls);
  assert.ok(cls < 0.05, `CLS ${cls}`);
  await page.close();
});
