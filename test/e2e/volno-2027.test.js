// E2E: Volno 2027 ve skutečném UI (sestavený web v _site).
// Spuštění: npx eleventy && node --test test/e2e/volno-2027.test.js
import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { otevri, text, zavri } from './pomocnik.mjs';

after(zavri);

const CESTA = 'prace-rodina/volno-2027/';
const delkyNavrhu = (page) => page.$$eval('[data-navrhy] .volno-navrh-cislo b',
  (els) => els.map((el) => Number(el.textContent.replace(/\s/g, ' ').match(/\d+/)[0])));
const radkySvatku = (page) => page.$$eval('#svatky-tabulka tbody tr',
  (trs) => trs.map((tr) => tr.textContent.replace(/[\s ]+/g, ' ').trim()));

test('seznam svátků: 26. 3. 2027 Velký pátek a 5.–6. 7. 2027', async () => {
  const { page } = await otevri(CESTA);
  const radky = await radkySvatku(page);
  assert.equal(radky.length, 13);
  assert.ok(radky.some((r) => r.startsWith('26. 3. 2027') && r.includes('pátek') && r.includes('Velký pátek')), radky.join('\n'));
  assert.ok(radky.some((r) => r.startsWith('5. 7. 2027') && r.includes('pondělí') && r.includes('Cyrila a Metoděje')));
  assert.ok(radky.some((r) => r.startsWith('6. 7. 2027') && r.includes('úterý') && r.includes('Jana Husa')));
  assert.ok(radky.some((r) => r.startsWith('24. 12. 2027') && r.includes('od 12:00 zavřeno')));
  await page.close();
});

test('1 den dovolené: mezi návrhy je blok aspoň 4 dny, nejlépe 5 dní', async () => {
  const { page } = await otevri(CESTA);
  assert.equal(await page.$eval('#dovolena-1', (el) => el.checked), true);
  const delky = await delkyNavrhu(page);
  assert.ok(delky.length >= 3);
  assert.ok(delky.some((d) => d >= 4), `délky ${delky}`);
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '5 dní volna');
  assert.match(await text(page, '#vysledek [data-vysledek-popis]'), /Velikonoce: čt 25\. 3\. – po 29\. 3\./);
  assert.equal(await text(page, '[data-lista-cislo]'), '5 dní volna');
  await page.close();
});

test('změna počtu dnů přepočítá návrhy, výsledek, lištu i kalendář', async () => {
  const { page } = await otevri(CESTA);
  const dovolenychPred = await page.$$eval('[data-kalendar] td.vk-dovolena', (els) => els.length);
  await page.click('label[for="dovolena-3"]');
  assert.equal(await text(page, '#vysledek-nadpis'), 'Kolik volna ti dá 3 dny dovolené');
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '9 dní volna');
  assert.match(await text(page, '#vysledek [data-vysledek-popis]'), /so 3\. 7\. – ne 11\. 7\./);
  assert.equal(await text(page, '[data-lista-cislo]'), '9 dní volna');
  assert.equal(await text(page, '[data-lista-popis]'), 'Za 3 dny dovolené');
  const delky = await delkyNavrhu(page);
  assert.equal(delky[0], 9);
  assert.match(await text(page, '[data-navrhy] .volno-navrh-nej'), /Vezmi si: st 7\. 7\. – pá 9\. 7\./);
  const dovolenychPo = await page.$$eval('[data-kalendar] td.vk-dovolena', (els) => els.length);
  assert.ok(dovolenychPo > dovolenychPred, `${dovolenychPred} → ${dovolenychPo}`);
  assert.equal(await page.$eval('[data-kalendar] td[data-datum="2027-07-07"]', (el) => el.classList.contains('vk-dovolena')), true);
  assert.match(await text(page, '[data-oznameni]'), /3 dny dovolené/);
  // a zpátky na 1 den
  await page.click('label[for="dovolena-1"]');
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '5 dní volna');
  await page.close();
});

test('kalendář má 12 měsíců a rozlišuje víkend, svátek a dovolenou i textem', async () => {
  const { page } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  const mesice = await page.$$eval('[data-kalendar] table.vk-mesic caption', (els) => els.map((el) => el.textContent.trim()));
  assert.equal(mesice.length, 12);
  assert.equal(mesice[0], 'Leden 2027');
  assert.equal(mesice[11], 'Prosinec 2027');
  assert.equal(await page.$$eval('[data-kalendar] td.vk-den', (els) => els.length), 365);
  assert.match(await text(page, 'td[data-datum="2027-03-26"]'), /svátek: Velký pátek/);
  assert.equal(await page.$eval('td[data-datum="2027-07-03"]', (el) => el.classList.contains('vk-vikend')), true);
  assert.match(await text(page, 'td[data-datum="2027-03-25"]'), /navržená dovolená/);
  await page.close();
});

test('žádné chyby v konzoli', async () => {
  const { page, chyby } = await otevri(CESTA, { sirka: 1440, vyska: 900 });
  for (const n of [2, 5, 4, 1]) await page.click(`label[for="dovolena-${n}"]`);
  assert.deepEqual(chyby, []);
  await page.close();
});

test('bez JS je vidět ukázka, kalendář i svátky', async () => {
  const { page } = await otevri(CESTA, { js: false });
  assert.ok(await page.$('#vysledek[data-ukazka]'));
  assert.equal(await text(page, '#vysledek [data-vysledek-cislo]'), '5 dní volna');
  assert.equal(await page.$$eval('[data-kalendar] table.vk-mesic', (els) => els.length), 12);
  assert.ok((await delkyNavrhu(page)).length >= 3);
  assert.equal((await radkySvatku(page)).length, 13);
  assert.equal(await page.$$eval('#srovnani-tabulka tbody tr', (els) => els.length), 5);
  await page.close();
});
