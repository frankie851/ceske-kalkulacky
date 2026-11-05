// 2. nezávislá reprodukce: čárka v poli type=number (en-US vs. cs-CZ) a zastaralé školkovné po změně roku dítěte
import { createRequire } from 'node:module';
import { spustServer } from './prohlizec-lib.mjs';
const require = createRequire('/tmp/revize/nastroje/package.json');
const puppeteer = require('puppeteer');
const srv = await spustServer('/tmp/revize/repos/slevy-2027');
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
for (const lang of ['en-US', 'cs-CZ']) {
  const browser = await puppeteer.launch({ executablePath: '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome', headless: true, args: ['--no-sandbox', '--disable-gpu', `--lang=${lang}`], env: { ...process.env, LANG: lang === 'cs-CZ' ? 'cs_CZ.UTF-8' : 'en_US.UTF-8', LANGUAGE: lang === 'cs-CZ' ? 'cs' : 'en' } });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ 'Accept-Language': lang });
  await page.goto(srv.url, { waitUntil: 'networkidle0' });
  const napis = async (sel, t) => { await page.focus(sel); await page.evaluate((s) => { document.querySelector(s).value = ''; }, sel); await page.type(sel, String(t)); };
  const dalsi = async () => { await page.click('#dotaznik button[type=submit]'); await cekej(250); };
  await napis('#narRok', 1985); await dalsi(); await dalsi();
  await napis('#pocetDeti', 1); await cekej(150); await napis('#ditRok0', 2023); await dalsi();
  await page.click('input[name="skolka0"]');
  const vysledky = {};
  for (const t of ['1500,50', '84 512,30', '1 500', '1500.50']) { await napis('#skolne0', t); vysledky[t] = await page.evaluate(() => { const el = document.querySelector('#skolne0'); return { value: el.value, badInput: el.validity.badInput, lang: navigator.language }; }); }
  console.log(lang, JSON.stringify(vysledky));
  // zastaralé školkovné: školné 20 000, Zpět, rok dítěte 2012, dál až na výsledek
  await napis('#skolne0', 20000); await dalsi();
  await page.click('[data-akce=zpet]'); await cekej(200); await page.click('[data-akce=zpet]'); await cekej(200);
  await napis('#ditRok0', 2012); await dalsi();
  const info = await page.evaluate(() => document.querySelector('#dotaznik .info')?.textContent);
  for (let i = 0; i < 8; i += 1) { if (await page.evaluate(() => !document.querySelector('#vysledek').hidden)) break; await dalsi(); }
  const radek = await page.evaluate(() => [...document.querySelectorAll('#vysledek tbody tr')].map((tr) => tr.querySelector('td').childNodes[0].textContent.trim() + ' = ' + tr.querySelectorAll('td')[2].querySelector('.hodnota').childNodes[0].textContent.trim()).filter((s) => /umístění|zvýhodnění/i.test(s)));
  console.log(lang, 'krok školka:', info, '| výsledek:', radek.join('; '), '| Až:', await page.evaluate(() => document.querySelector('.souhrn__castka').textContent));
  await browser.close();
}
await srv.zavri();
