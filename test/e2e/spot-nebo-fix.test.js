// E2E: Spot, nebo fix? ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/spot-nebo-fix.test.js
// Očekávané částky počítáme v Node stejným modulem (vystup.js → calc.js computeVariants) nad stejnými daty
// a porovnáváme je s tím, co ukáže stránka.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
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
    predpoklady: o.predpoklady.map((p) => [mezery(p.nazev), mezery(p.hodnota)]),
  };
}

async function zobrazeno(page) {
  const karty = {};
  for (const k of ['fix', 'spot', 'dynamic']) karty[k] = await text(page, `[data-varianta="${k}"] [data-castka]`);
  const nejlevnejsi = await page.$$eval('.spot-varianta.is-best', (els) => els.map((el) => el.dataset.varianta));
  const predpoklady = await page.$$eval('[data-predpoklady] > div', (els) => els.map((el) => [el.querySelector('dt').textContent, el.querySelector('dd').textContent]));
  return {
    predpoklady: predpoklady.map(([n, h]) => [mezery(n), mezery(h)]),
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

// Revize 5. 11. 2026, SPOT-06: propojení formuláře – změna jističe, distributora a sazby přepočítá výsledek
// (karty i předpoklady s cenou distribuce podle CV ERÚ 14/2025) stejně jako vystup.js v Node.
async function zmenAOver(zmeny, ocekavane) {
  const { page, chyby } = await otevri(CESTA);
  const pred = await zobrazeno(page);
  for (const [selektor, hodnota] of zmeny) {
    await vypln(page, selektor, hodnota);
    await spocitano(page);
  }
  const o = ocekavej(ocekavane);
  const z = await zobrazeno(page);
  assert.deepEqual(z.karty, o.karty);
  assert.notDeepEqual(z.karty, pred.karty);
  assert.equal(z.cislo, o.cislo);
  assert.deepEqual(z.nejlevnejsi, [o.nejlevnejsi]);
  assert.deepEqual(z.predpoklady, o.predpoklady);
  assert.notDeepEqual(z.predpoklady, pred.predpoklady);
  assert.deepEqual(chyby, []);
  return { page, o, z };
}
const predpoklad = (z, re) => z.predpoklady.find(([n]) => re.test(n));

test('SPOT-06: změna jističe na 3× 63 A přepočítá výsledek a cenu za jistič', async () => {
  const { page, z } = await zmenAOver([['#jistic', '3x63']], { jistic: '3x63' });
  // CV ERÚ 14/2025, D 02d, ČEZ, „nad 3x50 A do 3x63 A“ 644 Kč/měsíc + nesíťová infrastruktura 12,87 Kč, × 1,21 DPH
  assert.deepEqual(predpoklad(z, /^Jistič/), ['Jistič 3× 63 A a nesíťová infrastruktura', '794,81 Kč měsíčně']);
  await page.close();
});

test('SPOT-06: jistič 1× 25 A má stejnou cenu jako 3× 10 A a jiný výsledek než 3× 25 A', async () => {
  const { page, z } = await zmenAOver([['#jistic', '1x25']], { jistic: '1x25' });
  const o10 = ocekavej({ jistic: '3x10' });
  assert.equal(predpoklad(z, /^Jistič/)[1], predpoklad(o10, /^Jistič/)[1]);
  await page.close();
});

test('SPOT-06: změna distributora na PREdistribuci přepočítá výsledek a ceny distribuce', async () => {
  const { page, z } = await zmenAOver([['#distributor', 'pre']], { distributor: 'pre', region: 'P' });
  assert.match(predpoklad(z, /^Distribuce/)[0], /PREdistribuce, D02d/);
  await page.close();
});

test('SPOT-06: změna sazby na D61d přepočítá výsledek s vysokým a nízkým tarifem', async () => {
  const { page, o, z } = await zmenAOver([['#sazba', 'D61d']], { sazba: 'D61d' });
  assert.equal(o.tdd, 'TDD4');
  assert.match(predpoklad(z, /^Distribuce/)[1], /^vysoký tarif .* nízký /);
  await page.close();
});

test('SPOT-06: EG.D a sazba D56d – kombinace distributora, sazby a jističe 3× 40 A', async () => {
  const { page } = await zmenAOver([['#distributor', 'egd'], ['#sazba', 'D56d'], ['#jistic', '3x40']], { distributor: 'egd', sazba: 'D56d', jistic: '3x40', region: tarify.distributors.egd.tdd5Regions[0] });
  await page.close();
});

test('SPOT-03: předpoklady ukazují POZE 0 Kč s důvodem a datum ověření regulovaných cen', async () => {
  const { page } = await otevri(CESTA);
  const z = await zobrazeno(page);
  const poze = predpoklad(z, /POZE/)[1];
  assert.equal(poze, mezery(`0 Kč – ${tarify.common.poze.vysvetleniNuly}`));
  assert.doesNotMatch(poze, /Kč\/kWh/);
  const overeno = await text(page, '[data-regulovane-overeno]');
  const [r, m, d] = tarify.overeno.split('-').map(Number);
  assert.ok(overeno.includes(`ověřili k ${d}. ${m}. ${r}`), overeno);
  assert.match(await page.$eval('[data-regulovane-overeno] a', (el) => el.href), /erv182025\.pdf#page=30$/);
  // Po přepočtu (jiná spotřeba) zůstává POZE 0 Kč – stejně jako ve výpočtu.
  await vypln(page, '#mwh', '20');
  await spocitano(page);
  assert.equal(predpoklad(await zobrazeno(page), /POZE/)[1], poze);
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

/** CSV se čtvrthodinovým měřením (0,15 kWh) za `dni` dnů od `od`, v dočasném souboru. */
function csvSoubor(od, dni) {
  const radky = ['Čas;Spotřeba kWh'];
  const zacatek = Date.parse(`${od}T00:00:00Z`);
  for (let d = 0; d < dni; d++) {
    const den = new Date(zacatek + d * 864e5).toISOString().slice(0, 10);
    for (let q = 0; q < 96; q++) radky.push(`${den} ${String(Math.floor(q / 4)).padStart(2, '0')}:${String((q % 4) * 15).padStart(2, '0')};0,15`);
  }
  const soubor = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'spot-csv-')), `mereni-${dni}.csv`);
  fs.writeFileSync(soubor, radky.join('\n'));
  return soubor;
}

async function nahrajCsv(page, soubor) {
  await page.$eval('.spot-csv', (el) => { el.open = true; });
  await (await page.$('#csv-soubor')).uploadFile(soubor);
  await page.waitForFunction(() => !document.querySelector('[data-csv-mapovani]').hidden);
  await page.select('#csv-konec', '0');
  await page.click('[data-csv-pouzit]');
}

test('SPOT-10: měření ze 2 dnů roční spotřebu nepřepíše, 60 dnů ano a „Zpět“ vrátí zadanou hodnotu', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#mwh', '3');
  await spocitano(page);
  const pred = await zobrazeno(page);
  await nahrajCsv(page, csvSoubor('2026-01-05', 2));
  await page.waitForFunction(() => /nepoužijeme/.test(document.querySelector('[data-csv-stav]').textContent));
  assert.equal(await page.$eval('[data-csv-stav]', (el) => el.classList.contains('is-chyba')), true);
  assert.match(await text(page, '[data-csv-stav]'), /méně než 10 %/);
  assert.equal(await page.$eval('#mwh', (el) => el.value), '3');
  assert.equal(await page.$eval('#mwh', (el) => el.readOnly), false);
  assert.deepEqual((await zobrazeno(page)).karty, pred.karty);

  await nahrajCsv(page, csvSoubor('2026-01-01', 60));
  await page.waitForFunction(() => document.querySelector('#mwh').readOnly);
  assert.match(await text(page, '[data-csv-stav]'), /hrubý odhad/);
  assert.notEqual(await page.$eval('#mwh', (el) => el.value), '3');
  await page.click('[data-csv-zrusit]');
  assert.equal(await page.$eval('#mwh', (el) => el.value), '3');
  assert.equal(await page.$eval('#mwh', (el) => el.readOnly), false);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('SPOT-09: pod tabulkou po měsících je upozornění na měsíce mimo rok regulovaných cen', async () => {
  const { page } = await otevri(CESTA);
  const o = v.vystup(D, v.spocitej(D, vychozi, cti(`data/tdd/${v.tridaTdd(tarify, vychozi.sazba, vychozi.region)}.json`).values), { tdd: 'x' });
  const skryte = await page.$eval('[data-upozorneni-obdobi]', (el) => el.hidden);
  assert.equal(skryte, !o.upozorneniObdobi);
  if (o.upozorneniObdobi) {
    assert.equal(await text(page, '[data-upozorneni-obdobi-text]'), mezery(o.upozorneniObdobi));
    assert.match(await text(page, '[data-upozorneni-obdobi-text]'), new RegExp(`regulovanými cenami roku ${tarify.year}`));
  }
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
