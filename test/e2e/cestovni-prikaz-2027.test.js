// E2E: Cestovní příkaz 2027 ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/cestovni-prikaz-2027.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { otevri, vypln, text, zavri } from './pomocnik.mjs';
import { spocitejCestu, souhrn } from '../../src/nastroje/cestovni-prikaz-2027/cesty.js';

after(zavri);

const CESTA = 'dane-podnikani/cestovni-prikaz-2027/';
const KLIC = 'spocitano-cestovni-prikaz';
const rules = JSON.parse(fs.readFileSync(new URL('../../src/nastroje/cestovni-prikaz-2027/rules.json', import.meta.url), 'utf8'));

const celkem = (page) => text(page, '#vysledek [data-vysledek-cislo]');
const statistika = (page, i) => text(page, `#vysledek .stats > li:nth-child(${i}) b`);
const klik = (page, sel) => page.$eval(sel, (el) => el.click());
const pocetCest = (page) => page.$$eval('[data-cp-seznam] .cp-cesta', (els) => els.length);

async function pridejCestu(page, c) {
  await vypln(page, '#odjezd', c.odjezd);
  await vypln(page, '#navrat', c.navrat);
  for (const [den, jidla] of Object.entries(c.jidla || {})) {
    for (const j of jidla) await klik(page, `#jidlo-${den}-${j}`);
  }
  await vypln(page, '#odkud', c.odkud ?? 'Praha');
  await vypln(page, '#kam', c.kam ?? 'Plzeň a zpět');
  await vypln(page, '#ucel', c.ucel ?? 'Jednání');
  await vypln(page, '#km', c.km);
  await klik(page, '[data-cp-pridat]');
}

async function nacisto(page) {
  await klik(page, '[data-cp-nacisto]');
  assert.equal(await pocetCest(page), 0);
}

test('výchozí ukázka: souhrn odpovídá testu souhrn (1 336 Kč)', async () => {
  const { page } = await otevri(CESTA);
  // Očekávání spočítané modulem ze stejných dvou ukázkových cest jako v .11tydata.js
  const ukazka = JSON.parse(await page.$eval('#cp-ukazka', (el) => el.textContent));
  const hlav = { sfera: 'soukroma', kraceniPct: ukazka.hlavicka.kraceniPct, vozidlo: ukazka.hlavicka.vozidlo };
  const vysl = ukazka.cesty.map((c) => spocitejCestu(hlav, {
    ...c, cenaDoklad: undefined, jidla: Object.fromEntries(Object.entries(c.jidla).map(([d, j]) => [d, Object.values(j).filter(Boolean).length])),
  }, rules));
  const s = souhrn(vysl);
  assert.equal(s.celkemKc, 1336);
  assert.equal(await celkem(page), '1 336 Kč');
  assert.equal(await text(page, '[data-lista-cislo]'), '1 336 Kč');
  assert.equal(await statistika(page, 1), '699,15 Kč');
  assert.equal(await pocetCest(page), 2);
  assert.match(await text(page, '[data-cp-vyuctovani] .cp-k-vyplate'), /1 336 Kč/);
  await page.close();
});

test('100 km osobním autem, 13 h → základní náhrada 590 Kč, PHM 208,20 Kč, stravné 236 Kč', async () => {
  const { page } = await otevri(CESTA);
  await nacisto(page);
  await vypln(page, '#spotreba', '6');
  await pridejCestu(page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '100' });
  assert.equal(await pocetCest(page), 1);
  assert.equal(await statistika(page, 1), '590,00 Kč');
  assert.equal(await statistika(page, 2), '208,20 Kč');
  assert.equal(await statistika(page, 3), '236,00 Kč');
  assert.equal(await celkem(page), '1 035 Kč');
  await page.close();
});

test('cesta 13 h bez jídel a bez auta → stravné 236 Kč; s obědem 153,40 Kč', async () => {
  const { page } = await otevri(CESTA);
  await nacisto(page);
  await pridejCestu(page, { odjezd: '2026-05-04T06:00', navrat: '2026-05-04T19:00', km: '0' });
  assert.equal(await statistika(page, 3), '236,00 Kč');
  assert.equal(await statistika(page, 1), '0,00 Kč');
  assert.equal(await celkem(page), '236 Kč');
  // Upravit: přidat oběd → 236 × 0,65
  await klik(page, '[data-akce="upravit"]');
  assert.equal(await page.$eval('#odjezd', (el) => el.value), '2026-05-04T06:00');
  await klik(page, '#jidlo-2026-05-04-o');
  await klik(page, '[data-cp-pridat]');
  assert.equal(await pocetCest(page), 1);
  assert.equal(await statistika(page, 3), '153,40 Kč');
  // Smazat
  await klik(page, '[data-akce="smazat"]');
  assert.equal(await pocetCest(page), 0);
  assert.equal(await celkem(page), '0 Kč');
  await page.close();
});

test('cesta v roce 2027 → srozumitelná chyba o sazbách u pole odjezdu', async () => {
  const { page } = await otevri(CESTA);
  await pridejCestu(page, { odjezd: '2027-01-10T07:00', navrat: '2027-01-10T15:00', km: '100' });
  assert.equal(await page.$eval('#odjezd', (el) => el.getAttribute('aria-invalid')), 'true');
  assert.equal(await text(page, '#odjezd-chyba'),
    'Chyba: Sazby pro rok 2027 vyjdou ve vyhlášce obvykle koncem prosince. Zatím spočítáš cesty v roce 2026.');
  assert.equal(await pocetCest(page), 2, 'cesta v roce 2027 se nepřidá');
  assert.equal(await celkem(page), '1 336 Kč');
  // Upozornění nahoře na stránce
  assert.match(await text(page, '.cp-bez-sazeb'), /Sazby pro rok 2027 zatím nejsou/);
  await page.close();
});

test('chybové stavy: návrat před odjezdem, chybějící km a údaje', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  await vypln(page, '#odjezd', '2026-03-15T10:00');
  await vypln(page, '#navrat', '2026-03-15T09:00');
  await klik(page, '[data-cp-pridat]');
  assert.match(await text(page, '#navrat-chyba'), /Návrat musí být později než odjezd/);
  assert.match(await text(page, '#km-chyba'), /Vyplň ujeté km/);
  assert.match(await text(page, '#odkud-chyba'), /Vyplň, odkud/);
  assert.equal(await pocetCest(page), 2);
  await vypln(page, '#km', '-5');
  await klik(page, '[data-cp-pridat]');
  assert.match(await text(page, '#km-chyba'), /kladné číslo/);
  // Bez spotřeby nejde cesta autem
  await vypln(page, '#spotreba', '');
  assert.match(await text(page, '#spotreba-chyba'), /Vyplň spotřebu/);
  await vypln(page, '#spotreba', '6');
  await vypln(page, '#navrat', '2026-03-15T18:00');
  await vypln(page, '#odkud', 'Praha');
  await vypln(page, '#kam', 'Brno');
  await vypln(page, '#ucel', 'Porada');
  await vypln(page, '#km', '0');
  await klik(page, '[data-cp-pridat]');
  assert.equal(await page.$$eval('.is-error', (els) => els.length), 0);
  assert.equal(await pocetCest(page), 3);
  await page.close();
});

test('ukládání jen na kliknutí: Uložit, Načíst uložené, Smazat uložené', async () => {
  const { page } = await otevri(CESTA);
  const ulozeno = () => page.evaluate((k) => localStorage.getItem(k), KLIC);
  await page.evaluate(() => localStorage.clear());
  await nacisto(page);
  await vypln(page, '#firma', 'Moje firma s.r.o.');
  await pridejCestu(page, { odjezd: '2026-06-02T08:00', navrat: '2026-06-02T15:00', km: '50' });
  assert.equal(await ulozeno(), null, 'bez kliknutí se nic neukládá');
  assert.equal(await page.evaluate(() => localStorage.length), 0);

  await klik(page, '[data-ulozeni-ulozit]');
  const z = JSON.parse(await ulozeno());
  assert.equal(z.data.hlavicka.firma, 'Moje firma s.r.o.');
  assert.equal(z.data.cesty.length, 1);

  // Po načtení stránky se nic neobnoví samo, jen na kliknutí
  await page.reload({ waitUntil: 'networkidle0' });
  assert.equal(await pocetCest(page), 2);
  await klik(page, '[data-ulozeni-nacist]');
  assert.equal(await pocetCest(page), 1);
  assert.equal(await page.$eval('#firma', (el) => el.value), 'Moje firma s.r.o.');

  await klik(page, '[data-ulozeni-smazat]');
  assert.equal(await ulozeno(), null);
  await page.close();
});

test('bez JavaScriptu: ukázkové vyúčtování a výsledek', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.ok(await page.$('[data-ukazka]'));
  assert.equal(await celkem(page), '1 336 Kč');
  assert.equal(await pocetCest(page), 2);
  assert.match(await text(page, '[data-cp-vyuctovani]'), /Vyúčtování předkládá/);
  assert.match(await text(page, '[data-cp-vyuctovani]'), /1 336 Kč/);
  await page.close();
});

test('žádné chyby v konzoli', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  await klik(page, 'label[for="sfera-verejna"]');
  await vypln(page, '#verejna2', '442');
  await vypln(page, '#palivo', 'elektrina');
  assert.match(await text(page, '#spotreba-napoveda'), /kWh\/100 km/);
  await pridejCestu(page, { odjezd: '2026-04-01T14:00', navrat: '2026-04-02T21:00', km: '120', jidla: { '2026-04-02': ['s'] } });
  assert.equal(await pocetCest(page), 3);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026: CES-01 (§ 163 odst. 4 ZP) a CES-02 (§ 157 odst. 4 ZP).
test('cesta 20:00–2:00 přes půlnoc → stravné 155 Kč posouzené dohromady', async () => {
  const { page, chyby } = await otevri(CESTA);
  await nacisto(page);
  await pridejCestu(page, { odjezd: '2026-03-15T20:00', navrat: '2026-03-16T02:00', km: '0' });
  assert.equal(await statistika(page, 3), '155,00 Kč');
  assert.match(await text(page, '[data-cp-vyuctovani]'), /posouzené dohromady za oba dny \(§ 163 odst\. 4/);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('100 km s přívěsem → základní náhrada 678,50 Kč', async () => {
  const { page, chyby } = await otevri(CESTA);
  await nacisto(page);
  await vypln(page, '#spotreba', '6');
  await klik(page, '#prives-1');
  await pridejCestu(page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '100' });
  assert.equal(await statistika(page, 1), '678,50 Kč');
  assert.match(await text(page, '[data-cp-vyuctovani]'), /\+ 15 % za přívěs/);
  // Úprava cesty zachová přívěs
  await klik(page, '[data-akce="upravit"]');
  assert.equal(await page.$eval('#prives-1', (el) => el.checked), true);
  assert.deepEqual(chyby, []);
  await page.close();
});

// Revize 5. 11. 2026, nízké nálezy: CES-10 (letní čas), CES-12 (vyšší sjednané stravné).
test('CES-10: 29. 3. 2026 0:30–5:30 trvá kvůli letnímu času 4 h → stravné nenáleží', async () => {
  const { page, chyby } = await otevri(CESTA);
  await nacisto(page);
  await vypln(page, '#odjezd', '2026-03-29T00:30');
  await vypln(page, '#navrat', '2026-03-29T05:30');
  assert.match(await text(page, '[data-cp-jidla]'), /4:00 h · pod 5 h/);
  await pridejCestu(page, { odjezd: '2026-03-29T00:30', navrat: '2026-03-29T05:30', km: '0' });
  assert.equal(await statistika(page, 3), '0,00 Kč');
  assert.deepEqual(chyby, []);
  await page.close();
});

test('CES-12: sjednané stravné 200 Kč pro 5–12 h → cesta 8 h má stravné 200 Kč; pod minimem chyba', async () => {
  const { page, chyby } = await otevri(CESTA);
  await nacisto(page);
  await vypln(page, '#sjednane0', '150');
  assert.match(await text(page, '#sjednane0-chyba'), /Nejméně 155\sKč/);
  await vypln(page, '#sjednane0', '200');
  assert.equal(await page.$eval('#sjednane0', (el) => el.getAttribute('aria-invalid')), null);
  await pridejCestu(page, { odjezd: '2026-05-04T08:00', navrat: '2026-05-04T16:00', km: '0' });
  assert.equal(await statistika(page, 3), '200,00 Kč');
  assert.match(await text(page, '[data-cp-vyuctovani]'), /Sjednané stravné/);
  assert.deepEqual(chyby, []);
  await page.close();
});
