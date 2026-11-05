// Desetinná čárka v číselných polích mam-eet ve dvou lokalizacích prohlížeče (cs-CZ, en-US).
// Aplikace používá <input type="text" inputmode="numeric"> (app.js:74, 197; osvc-app.js:104), takže by lokalizace
// neměla hrát roli – skript to ověřuje. Výstup: ../mam-eet/carka-lokalizace.txt
import fs from 'node:fs';
import { spustServer, otevriProhlizec } from './prohlizec-lib.mjs';

const KOREN = '/tmp/revize/repos/mam-eet';
const OUT = new URL('../mam-eet/carka-lokalizace.txt', import.meta.url).pathname;
const VSTUPY = ['1500,50', '0,85', '1500.50', '800 000', '1 500'];
const nb = (s) => (s ?? '').replace(/[  ]/g, ' ');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lines = [`# Desetinná čárka ve dvou lokalizacích · ${new Date().toISOString()}`, ''];

async function nastav(page, sel, text) {
  await page.evaluate((s) => { const i = document.querySelector(s); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }, sel);
  await page.type(sel, text, { delay: 5 });
  await sleep(120);
}
const klik = (page, text) => page.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === t && !x.closest('[hidden]')); b?.click(); }, text);
const volba = (page, text) => page.evaluate((t) => { const l = [...document.querySelectorAll('label.option')].find((x) => x.textContent.includes(t)); l?.querySelector('input').click(); }, text);

const srv = await spustServer(KOREN);
for (const lang of ['cs-CZ', 'en-US']) {
  const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
  const { page } = b;
  lines.push(`## ${lang}`);
  lines.push(`navigator.language v prohlížeči: ${await (async () => { await page.goto(srv.url, { waitUntil: 'networkidle0' }); return page.evaluate(() => navigator.language); })()}`);
  lines.push('| Pole (type) | Zadáno | Hodnota v poli | Hláška / výsledek |');
  lines.push('|---|---|---|---|');
  // OSVČ: roční příjmy
  await page.goto(srv.url + '#osvc', { waitUntil: 'networkidle0' });
  await sleep(200);
  const typ = await page.evaluate(() => document.querySelector('#osvc-income').type + '/' + document.querySelector('#osvc-income').inputMode);
  for (const v of VSTUPY) {
    await nastav(page, '#osvc-income', v); await klik(page, 'Spočítat'); await sleep(200);
    const val = await page.evaluate(() => document.querySelector('#osvc-income').value);
    const err = nb(await page.evaluate(() => document.querySelector('#osvc-error')?.textContent));
    const row = nb(await page.evaluate(() => document.querySelector('table.variants tbody tr')?.innerText ?? '')).replace(/\s+/g, ' ').slice(0, 70);
    lines.push(`| #osvc-income (${typ}) | ${v} | ${val} | ${err || 'bez hlášky; 1. řádek: ' + row} |`);
  }
  // OSVČ: skutečné výdaje
  await nastav(page, '#osvc-income', '500000'); await volba(page, 'Skutečnými výdaji');
  for (const v of ['300000,50', '0,85']) {
    await nastav(page, '#osvc-actual', v); await klik(page, 'Spočítat'); await sleep(200);
    lines.push(`| #osvc-actual | ${v} | ${await page.evaluate(() => document.querySelector('#osvc-actual').value)} | ${nb(await page.evaluate(() => document.querySelector('#osvc-error')?.textContent)) || 'bez hlášky'} |`);
  }
  // EET dotazník: příjmy, pak kalkulačka
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  await klik(page, 'Začít'); await sleep(100);
  for (const [o] of [['OSVČ'], ['Hotovost'], ['Nic z toho'], ['1. pásmo']]) { await volba(page, o); await klik(page, 'Další'); await sleep(120); }
  for (const v of ['800000,50', '0,85']) {
    await nastav(page, '#q-income', v); await klik(page, 'Další'); await sleep(150);
    lines.push(`| #q-income | ${v} | ${await page.evaluate(() => document.querySelector('#q-income')?.value ?? '(otázka opuštěna)')} | ${nb(await page.evaluate(() => document.querySelector('#q-income-error')?.textContent)) || 'přijato'} |`);
  }
  await nastav(page, '#q-income', '800000'); await klik(page, 'Další'); await sleep(120);
  await volba(page, 'Ne'); await klik(page, 'Další'); await sleep(120);
  await nastav(page, '#q-units', '1'); await klik(page, 'Další'); await sleep(300);
  await volba(page, 'vlastní pokladně');
  for (const v of ['20000,50', '0,85', '20.000', '20 000']) {
    await nastav(page, '#own-cost', v);
    lines.push(`| #own-cost (kalkulačka EET OFF) | ${v} | ${await page.evaluate(() => document.querySelector('#own-cost').value)} | ${nb(await page.evaluate(() => document.querySelector('.calc-output')?.textContent))} |`);
  }
  lines.push('');
  await b.zavri();
}
await srv.zavri();
fs.writeFileSync(OUT, lines.join('\n') + '\n');
console.log(lines.join('\n'));
