// E2E: Bydlometr ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/bydlometr.test.js
// Kontrolní příklady ze zadání (docs/zadani.md, oddíl Bydlometr): anuita 3,5 mil. Kč / 25 let / 4,94 %
// a strop poplatku za mimořádnou splátku 500 000 Kč se 3 roky do konce fixace.
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'bydleni-energie/bydlometr/';
const castka = (t) => Number(t.replace(/[^\d−-]/g, '').replace('−', '-'));

test('refixace: 3 500 000 Kč, 25 let, 4,94 % → splátka 20 337 Kč ± 5 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#rf-zustatek', '3 500 000');
  await vypln(page, '#rf-zbyva', '25');
  await vypln(page, '#rf-sazba-banky', '4,94');
  const splatka = castka(await text(page, 'tr[data-varianta="accept"] td[data-label="Splátka"] .num'));
  assert.ok(Math.abs(splatka - 20337) <= 5, `splátka ${splatka}`);
  // Výsledek a lepivá lišta ukazují nejlevnější variantu a sedí spolu
  assert.equal(await text(page, '[data-lista-cislo]'), await text(page, '#vysledek [data-vysledek-cislo]'));
  assert.match(await text(page, '#rf-krok-1 .step-sum'), /3 500 000 Kč, 25 let/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('poplatek: mimořádná splátka 500 000 Kč, 3 roky do konce fixace → nejvýš 3 750 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#pp-castka', '500 000');
  await vypln(page, '#pp-smlouva', '2025-03-01');
  await vypln(page, '#pp-zacatek', '2025-03-01');
  await vypln(page, '#pp-konec', '2030-03-01');
  await vypln(page, '#pp-splatka', '2027-03-01');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '3 750 Kč');
  assert.match(await text(page, '[data-poplatek-duvod]'), /3 × 0,25 % = 0,75 %/);
  // Ke konci fixace je splátka zdarma
  await vypln(page, '#pp-splatka', '2030-03-01');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '0 Kč');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('nájem vs. koupě: výchozí příklad ukáže bod zvratu, graf a tabulku po letech', async () => {
  const { page, chyby } = await otevri(`${CESTA}#najem-vs-koupe`, { sirka: 1440, vyska: 900 });
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), false);
  assert.equal(await page.$eval('#panel-refixace', (el) => el.hidden), true);
  assert.match(await text(page, '#vysledek-najem-nadpis'), /^Za 20 let vychází lépe (koupě|nájem)$/);
  assert.match(await text(page, '#vysledek-najem .stats li:first-child b'), /^\d+\. rok$/);
  assert.ok(await page.$('[data-graf] svg[role="img"]'), 'graf čistého jmění');
  const legenda = await text(page, '[data-graf] .graf-legenda');
  assert.match(legenda, /Koupě/);
  assert.match(legenda, /Nájem \+ investice/);
  assert.match(legenda, /Bod zvratu: \d+\. rok/);
  assert.ok(await page.$('[data-graf] .graf-carkovana'), 'nájem je čárkovaně');
  assert.equal(await page.$$eval('[data-tabulka-let] tbody tr', (r) => r.length), 20);
  assert.equal(await text(page, '[data-lista-cislo]'), await text(page, '#vysledek-najem .stats li:first-child b'));
  // Změna vstupu přepočítá výsledek (vyšší výnos investic nahrává nájmu)
  const pred = await text(page, '#vysledek-najem [data-vysledek-vysvetleni]');
  await vypln(page, '#nk-vynos', '12');
  assert.notEqual(await text(page, '#vysledek-najem [data-vysledek-vysvetleni]'), pred);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('záložky fungují z klávesnice (šipky, Home, End) a mění hash', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const vybrana = () => page.$eval('[role="tab"][aria-selected="true"]', (el) => el.dataset.zalozka);
  const fokus = () => page.evaluate(() => document.activeElement?.dataset.zalozka);
  assert.equal(await vybrana(), 'refixace');
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), true);
  await page.focus('#zalozka-refixace');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'najem');
  assert.equal(await fokus(), 'najem');
  assert.equal(await page.$eval('#panel-najem', (el) => el.hidden), false);
  assert.equal(await page.$eval('#panel-refixace', (el) => el.hidden), true);
  assert.equal(await page.evaluate(() => location.hash), '#najem-vs-koupe');
  assert.equal(await page.$eval('#panel-najem', (el) => el.getAttribute('role')), 'tabpanel');
  await page.keyboard.press('ArrowRight');
  assert.equal(await vybrana(), 'refixace');
  await page.keyboard.press('End');
  assert.equal(await vybrana(), 'najem');
  await page.keyboard.press('Home');
  assert.equal(await vybrana(), 'refixace');
  assert.equal(await page.evaluate(() => location.hash), '#refixace');
  await page.keyboard.press('ArrowLeft');
  assert.equal(await vybrana(), 'najem');
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, BYD-03: dřív tu test ověřoval, že starý výsledek zůstane na obrazovce.
// Teď se výsledek, tabulky i zátěžový test při chybě skryjí a místo nich je hláška.
test('chybný vstup ukáže chybu u pole a skryje výsledek, po opravě se vrátí', async () => {
  const { page, chyby } = await otevri(CESTA);
  const vidno = (sel) => page.$eval(sel, (el) => el.getBoundingClientRect().height > 0 && !el.closest('[hidden]'));
  const pred = await text(page, '#vysledek [data-vysledek-cislo]');
  await vypln(page, '#rf-zustatek', 'abc');
  assert.equal(await page.$eval('#rf-zustatek-chyba', (el) => el.hidden), false);
  assert.equal(await page.$eval('#rf-zustatek', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await vidno('#vysledek'), false, 'výsledek skrytý');
  assert.equal(await vidno('[data-tabulka-variant]'), false, 'tabulka variant skrytá');
  assert.equal(await vidno('[data-tabulka-stresu]'), false, 'zátěžový test skrytý');
  assert.equal(await page.$eval('[data-neplatne="rf"]', (el) => el.getAttribute('role')), 'alert');
  assert.match(await text(page, '[data-neplatne="rf"]'), /neopravíš pole: Zbývající dluh\./);
  assert.equal(await text(page, '[data-lista-cislo]'), '–');
  await vypln(page, '#rf-zustatek', '2 800 000');
  assert.equal(await page.$eval('#rf-zustatek-chyba', (el) => el.hidden), true);
  assert.equal(await vidno('#vysledek'), true);
  assert.equal(await vidno('[data-neplatne="rf"]'), false);
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), pred);
  // Kalkulačka poplatku: chybné pole → místo částky pomlčka a hláška
  await vypln(page, '#pp-castka', 'abc');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '–');
  assert.match(await text(page, '[data-poplatek-duvod]'), /neopravíš pole: Mimořádná splátka\./);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('poplatek: starší smlouva 2021 v den konce fixace → 0 Kč; § 117a s průměrem ČNB → nejvýš 1 000 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#pp-castka', '500 000');
  await vypln(page, '#pp-smlouva', '2021-03-01');
  await vypln(page, '#pp-zacatek', '2021-03-01');
  await vypln(page, '#pp-konec', '2026-03-01');
  await vypln(page, '#pp-splatka', '2026-03-01');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '0 Kč');
  // Nová smlouva, 3 roky do konce fixace, průměr ČNB = smluvní sazba
  await vypln(page, '#pp-castka', '300 000');
  await vypln(page, '#pp-smlouva', '2025-03-01');
  await vypln(page, '#pp-zacatek', '2025-03-01');
  await vypln(page, '#pp-konec', '2030-03-01');
  await vypln(page, '#pp-splatka', '2027-03-01');
  await vypln(page, '#pp-sazba', '4,5');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '2 250 Kč');
  await vypln(page, '#pp-sazba-cnb', '4,5');
  assert.equal(await text(page, '[data-poplatek-cislo]'), '1 000 Kč');
  assert.match(await text(page, '[data-poplatek-duvod]'), /§ 117a/);
  assert.ok((await page.$$('.bm-dalsi-duvody li')).length === 5, 'další bezplatné důvody');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('nájem vs. koupě: nad limitem LTV se porovnání nepočítá (BYD-05), DTI a úspora na dani se ukážou (BYD-04)', async () => {
  const { page, chyby } = await otevri(`${CESTA}#najem-vs-koupe`, { sirka: 1440, vyska: 900 });
  const vidno = (sel) => page.$eval(sel, (el) => el.getBoundingClientRect().height > 0 && !el.closest('[hidden]'));
  assert.match(await text(page, '#vysledek-najem .stats'), /DTI \d+,\d/);
  assert.match(await text(page, '#vysledek-najem .stats'), /úspora na dani z odpočtu úroků v 1\. roce/);
  await page.select('#nk-mesto', 'brno');
  await vypln(page, '#nk-vlastni', '1 500 000');
  await vypln(page, '#nk-naklady-koupe', '12 000');
  await vypln(page, '#nk-vek', '40');
  assert.equal(await text(page, '#vysledek-najem-nadpis'), 'Na koupi chybí vlastní zdroje');
  assert.equal(await text(page, '#vysledek-najem [data-vysledek-cislo]'), '11 448 Kč');
  assert.match(await text(page, '[data-varovani]'), /LTV 80,2 %, ale limit je 80 %/);
  assert.equal(await vidno('[data-graf]'), false, 'graf skrytý');
  assert.equal(await vidno('[data-tabulka-citlivosti]'), false, 'citlivost skrytá');
  assert.equal(await vidno('#vysledek-najem .stats'), false, 'statistiky skryté');
  await vypln(page, '#nk-vek', '30');
  assert.match(await text(page, '#vysledek-najem-nadpis'), /^Za 20 let vychází lépe/);
  assert.equal(await vidno('[data-graf] svg'), true, 'graf zpět');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JavaScriptu: obě části pod sebou s ukázkovým výsledkem, bez záložek', async () => {
  const { page } = await otevri(CESTA, { js: false });
  const stav = await page.evaluate(() => {
    const vidno = (sel) => { const el = document.querySelector(sel); return !!el && el.getBoundingClientRect().height > 0; };
    return {
      refixace: vidno('#panel-refixace'),
      najem: vidno('#panel-najem'),
      zalozky: vidno('[role="tablist"]'),
      ukazky: document.querySelectorAll('[data-ukazka]').length,
      graf: vidno('[data-graf] svg'),
    };
  });
  assert.deepEqual(stav, { refixace: true, najem: true, zalozky: false, ukazky: 3, graf: true });
  assert.match(await text(page, '#vysledek [data-vysledek-cislo]'), /^\d[\d ]* Kč$/);
  assert.match(await text(page, '#vysledek-najem-nadpis'), /^Za 20 let vychází lépe/);
  assert.equal(await text(page, '[data-poplatek-cislo]'), '2 250 Kč');
  await page.close();
});
