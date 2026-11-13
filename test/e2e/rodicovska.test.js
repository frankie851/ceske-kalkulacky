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

// Revize 5. 11. 2026, ROD-05: zbytek 5 000 Kč se vyplatí s posledním měsícem (§ 30 odst. 6 ZSSP),
// proto 23 měsíců, ne 24 jako v zadání.
test('RP 15 000 Kč měsíčně → 350 000 Kč vyčerpáno za 23 měsíců', async () => {
  const { page } = await otevri(CESTA);
  await terminDo2026(page);
  await vypln(page, '#rp-vyse', '15000');
  assert.equal(await text(page, '[data-rp-text]'), '15 000 Kč');
  assert.match(await statistika(page, 1), /350 000 Kč za 23 měsíců čerpání/);
  assert.match(await text(page, '#vysledek [data-vysledek-vysvetleni]'), /350 000 Kč po 15 000 Kč měsíčně vystačí na 23 měsíců/);
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

// Revize 5. 11. 2026: ROD-01 (měsíc 3. narozenin), ROD-02 (souběh s mateřskou), ROD-04 (120 hodin).
test('rodičovská i v měsíci 3. narozenin, souběžně s nízkou mateřskou a limit jeslí 120 hodin', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#termin', '2026-03-15');
  await vypln(page, '#prijem-matka', '15 000');
  await page.click('label[for="otcovska-ne"]');
  await vypln(page, '#rp-vyse', '15000');
  const radky = await page.$$eval('#tabulka-mesicu tbody tr', (tr) => tr.map((r) => r.textContent.replace(/\s+/g, ' ').trim()));
  assert.match(radky.find((r) => r.startsWith('březen 2026')), /porod/);
  // březen 2026: mateřská 31 × 346 = 10 726 Kč + rozdíl rodičovské 4 274 Kč = 15 000 Kč dávek
  assert.match(radky.find((r) => r.startsWith('březen 2026')), /15 000 Kč/);
  assert.match(await text(page, '[data-jak-pocitame]'), /§ 30b odst\. 3/);
  // Poslední úkol: do konce měsíce 3. narozenin (březen 2029)
  assert.match(await text(page, '[data-kontrolni-seznam]'), /Do 31\. 3\. 2029/);
  await page.click('label[for="navrat-ano"]');
  await vypln(page, '#navrat-od', '10');
  assert.match(await text(page, '[data-varovani]'), /120 hodin/);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, ROD-07: při neplatném vstupu nesmí pod hláškou zůstat starý plán.
test('neplatný termín nebo příjem skryje starý souhrn a kontrolní seznam, oprava je vrátí', async () => {
  const { page, chyby } = await otevri(CESTA);
  const viditelne = (sel) => page.$eval(sel, (el) => el.checkVisibility());
  await vypln(page, '#termin', '2026-12-15');
  assert.equal(await viditelne('#vysledek'), true);
  assert.equal(await viditelne('[data-kontrolni-seznam]'), true);
  assert.equal(await viditelne('[data-neplatne]'), false);

  await vypln(page, '#termin', '2025-12-31');
  assert.match(await text(page, '#termin-chyba'), /Zadej termín od/);
  assert.equal(await viditelne('[data-neplatne]'), true);
  assert.match(await text(page, '[data-neplatne]'), /Oprav zvýrazněná pole/);
  for (const sel of ['#vysledek', '#tabulka-souhrnu', '[data-kontrolni-seznam]', '[data-osa]', '.lepiva-lista']) {
    assert.equal(await viditelne(sel), false, `${sel} má být skryté`);
  }

  await vypln(page, '#termin', '2027-02-01');
  assert.equal(await viditelne('[data-neplatne]'), false);
  assert.equal(await viditelne('#vysledek'), true);
  assert.equal(await viditelne('[data-kontrolni-seznam]'), true);
  assert.match(await text(page, '#krok-dite .step-sum'), /1\. 2\. 2027/);

  await vypln(page, '#prijem-matka', '-30 000');
  assert.match(await text(page, '#prijem-matka-chyba'), /záporný/);
  assert.equal(await viditelne('[data-neplatne]'), true);
  assert.equal(await viditelne('#vysledek'), false);
  await vypln(page, '#prijem-matka', '30 000');
  assert.equal(await viditelne('#vysledek'), true);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, ROD-09: § 38a odst. 4 zákona č. 187/2006 Sb. – nástup do 6 týdnů od narození.
test('otcovská od 35. a 41. dne po porodu jde zadat, 42. den ukáže chybu', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#termin', '2026-03-15');
  await vypln(page, '#prijem-otec', '30 000');
  await page.click('label[for="otcovska-ano"]');
  await vypln(page, '#otcovska-od', '35');
  assert.equal(await page.$eval('#otcovska-od', (el) => el.hasAttribute('aria-invalid')), false);
  assert.match(await text(page, '#krok-otcovska .step-sum'), /19\. 4\. 2026 až 2\. 5\. 2026/);
  await vypln(page, '#otcovska-od', '41');
  assert.match(await text(page, '#krok-otcovska .step-sum'), /25\. 4\. 2026 až 8\. 5\. 2026/);
  assert.match(await text(page, '#otcovska-od-napoveda'), /nejvýš 41/);
  await vypln(page, '#otcovska-od', '42');
  assert.match(await text(page, '#otcovska-od-chyba'), /od 0 do 41/);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Další práce po revizi (13. 11. 2026): § 38a odst. 4 věta třetí zákona č. 187/2006 Sb. – lhůta pro nástup
// na otcovskou se prodlouží o dny, kdy bylo dítě v prvních 6 týdnech v nemocnici.
test('otcovská: dítě v nemocnici 10 dní → nástup jde až 51. den po porodu', async () => {
  const { page, chyby } = await otevri(CESTA);
  await vypln(page, '#termin', '2026-03-15');
  await vypln(page, '#prijem-otec', '30 000');
  await page.click('label[for="otcovska-ano"]');
  assert.equal(await page.$eval('[data-zavisi="hospitalizace"]', (el) => el.hidden), true);
  await vypln(page, '#otcovska-od', '50');
  assert.match(await text(page, '#otcovska-od-chyba'), /od 0 do 41/);
  await page.click('label[for="hospitalizace-ano"]');
  assert.equal(await page.$eval('[data-zavisi="hospitalizace"]', (el) => el.hidden), false);
  await vypln(page, '#hospitalizace-dni', '10');
  assert.equal(await page.$eval('#otcovska-od', (el) => el.hasAttribute('aria-invalid')), false);
  assert.match(await text(page, '#krok-otcovska .step-sum'), /4\. 5\. 2026 až 17\. 5\. 2026/);
  assert.match(await text(page, '#otcovska-od-napoveda'), /nejvýš 51\..*10 dní v nemocnici/);
  assert.match(await text(page, '[data-kontrolni-seznam]'), /Nástup nejpozději 5\. 5\. 2026/);
  await vypln(page, '#otcovska-od', '52');
  assert.match(await text(page, '#otcovska-od-chyba'), /od 0 do 51/);
  await vypln(page, '#otcovska-od', '50');
  await vypln(page, '#hospitalizace-dni', '43');
  assert.match(await text(page, '#hospitalizace-dni-chyba'), /od 0 do 42/);
  assert.equal(await page.$eval('[data-neplatne]', (el) => el.hidden), false);
  await vypln(page, '#hospitalizace-dni', '10');
  // Volba „Ne“ vrátí lhůtu na 6 týdnů
  await page.click('label[for="hospitalizace-ne"]');
  assert.match(await text(page, '#otcovska-od-chyba'), /od 0 do 41/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('axe s otázkou na hospitalizaci a chybou v počtu dní (360 px, světlý i tmavý režim): 0 serious/critical', async () => {
  const { AxePuppeteer } = await import('@axe-core/puppeteer');
  const { page, chyby } = await otevri(CESTA, { sirka: 360 });
  await page.click('label[for="otcovska-ano"]');
  await page.click('label[for="hospitalizace-ano"]');
  await vypln(page, '#hospitalizace-dni', '50');
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

// Revize 5. 11. 2026, ROD-14: podvržený záznam v localStorage se do formuláře nedostane.
test('načtení poškozeného uloženého plánu: neplatné hodnoty se ignorují, žádné NaN ani chyba', async () => {
  const { page, chyby } = await otevri(CESTA);
  const vychozi = await page.$eval('#prijem-matka', (el) => el.value);
  const termin = await page.$eval('#termin', (el) => el.value);
  await page.evaluate((k) => localStorage.setItem(k, JSON.stringify({ verze: 1, ulozeno: '2026-11-13T00:00:00Z', data: {
    termin: '2020-01-01', 'prijem-matka': '<img src=x onerror=alert(1)>', 'prijem-otec': '-5', 'otcovska-od': '999',
    'kdo-ppm': '<img>', rpVolba: 'vlastni', rpVyse: 'NaN',
  } })), KLIC);
  await page.reload({ waitUntil: 'networkidle0' });
  await klik(page, '[data-ulozeni-nacist]');
  assert.equal(await page.$eval('#prijem-matka', (el) => el.value), vychozi);
  assert.equal(await page.$eval('#termin', (el) => el.value), termin);
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0, 'žádné pole v chybě');
  assert.doesNotMatch(await text(page, 'main'), /NaN/);
  assert.equal(await page.$('img[src="x"]'), null);
  await page.evaluate((k) => localStorage.removeItem(k), KLIC);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, ROD-14: předvyplněné příjmy jsou výslovně ukázka.
test('předvyplněné mzdy jsou označené jako ukázka, po přepsání označení zmizí', async () => {
  const { page, chyby } = await otevri(CESTA);
  const sel = '[data-ukazka-prijmu]';
  assert.equal(await page.$eval(sel, (el) => !el.hidden && el.getBoundingClientRect().height > 0), true);
  assert.match(await text(page, sel), /ukázka/i);
  await vypln(page, '#prijem-matka', '36 000');
  assert.equal(await page.$eval(sel, (el) => el.hidden), true);
  assert.deepEqual(chyby, []);
  await page.close();
});
