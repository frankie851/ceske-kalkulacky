// Prohlížečové scénáře pro revizi „Dluhy – exekuce, nebo oddlužení?“ (5. 11. 2026).
// Formulář (Z1 23 000/100 000 běžný; Z2 50 000/1 000 000 přednostní s úrokem; H8 důchodce 4 exekuce), chybový stav,
// český zápis čísel (cs-CZ i en-US), XSS i v poli sazby (objeví se až po zaškrtnutí), viditelnost odkazu na pomoc
// ve výřezu 360×800 na každé obrazovce (bez fullPage), axe, Tab, přetékání, 1440 px, živý web.
// Spuštění: node kalkulator-dluhu-prohlizec.mjs → ../kalkulator-dluhu/prohlizec.json + snímky
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, kontrolaStranky, localStorageDump, XSS } from './prohlizec-lib.mjs';
import { P2026, srazka, dobaSplaceni, oddluzeni } from './kalkulator-dluhu-prepocet.mjs';

const REPO = '/tmp/revize/repos/kalkulator-dluhu';
const VYSTUP = new URL('../kalkulator-dluhu/', import.meta.url).pathname;
fs.mkdirSync(VYSTUP, { recursive: true });
const M = await import(`${REPO}/dluhy.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));
const p = M.pravidlaProRok(rules, 2026);
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
const vysledek = { datum: new Date().toISOString(), commit: 'abb6c1c', behy: [] };
const srv = await spustServer(REPO);

const ctiVysledek = (page) => page.evaluate(() => {
  const t = (id) => document.getElementById(id)?.textContent.trim() ?? null;
  const hidden = (id) => document.getElementById(id)?.hidden ?? null;
  return {
    obrazovka: [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden)?.id,
    rok: t('rok-pravidel'),
    zustane: t('v-zustane'), srazka: t('v-srazka'), vericum: t('v-vericum'), nahrada: t('v-nahrada'), doba: t('v-doba'),
    upozorneni: hidden('v-upozorneni') ? null : t('v-upozorneni'),
    rozpis: [...document.querySelectorAll('#v-rozpis li')].map((li) => li.textContent.trim()),
    oSplatka: t('o-splatka'), oZustane: t('o-zustane'), oDelka: t('o-delka'), oSpravce: t('o-spravce'), oSrovnani: t('o-srovnani'),
    oZaplaceno: t('o-zaplaceno'), oZbytek: t('o-zbytek'), oMinimum: hidden('o-minimum') ? null : t('o-minimum'), oNelze: hidden('o-nelze') ? null : t('o-nelze'),
    vyhrady: [...document.querySelectorAll('#vysledek .vyhrada')].map((e) => e.textContent.trim()),
    aktivni: document.activeElement?.id || document.activeElement?.tagName,
  };
});
const ctiChyby = (page) => page.evaluate(() => {
  const o = {};
  for (const id of ['mzda', 'osoby', 'exekuce', 'dluh', 'sazba']) {
    const el = document.getElementById(id);
    o[id] = { hlaska: document.getElementById(`${id}-chyba`).textContent, ariaInvalid: el.getAttribute('aria-invalid'), hodnota: el.value, validity: el.validity.valid };
  }
  o.aktivni = document.activeElement?.id;
  o.obrazovka = [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden)?.id;
  return o;
});
// Vymaže pole a napíše text po znacích (skutečné psaní – u type=number rozhoduje lokalizace prohlížeče, co přijme).
const napis = async (page, sel, text) => {
  await page.focus(sel);
  await page.evaluate((s) => { const el = document.querySelector(s); el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); }, sel);
  if (text !== '') await page.type(sel, text);
};
const kc0 = (x) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(x)) + ' Kč';

/** Viditelnost odkazů na pomoc ve výřezu (lišta + pruh na obrazovce) bez posouvání. */
const pomocVeVyrezu = (page) => page.evaluate(() => {
  const vp = { w: window.innerWidth, h: window.innerHeight };
  const vid = (el) => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= vp.h && r.left >= 0 && r.right <= vp.w; };
  const obr = [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden);
  return { obrazovka: obr?.id, scrollY: window.scrollY, lista: vid(document.querySelector('.lista .pomoc-odkaz')), pruh: vid(obr?.querySelector('.pomoc-pruh a')), vyrez: vp };
});

/** Klik na „Upravit údaje“ (je-li výsledek zobrazen), jinak přechod přes hash. */
async function naFormular(page) {
  const kliknuto = await page.evaluate(() => { const a = document.querySelector('#vysledek:not([hidden]) a[href="#formular"]'); if (a) { a.click(); return true; } location.hash = 'formular'; return false; });
  await cekej(200);
  return kliknuto;
}

async function vyplnOdesli(page, { mzda, osoby, druh, exekuce, duchod, dluh, odpusteni, urok, sazba }) {
  if (mzda !== undefined) await napis(page, '#mzda', mzda);
  if (osoby !== undefined) await napis(page, '#osoby', osoby);
  if (druh) await page.click(`input[name=druh][value=${druh}]`);
  if (exekuce !== undefined) await napis(page, '#exekuce', exekuce);
  if (duchod !== undefined) { const je = await page.$eval('#duchod', (e) => e.checked); if (je !== duchod) await page.click('#duchod'); }
  if (dluh !== undefined) await napis(page, '#dluh', dluh);
  if (odpusteni) await page.click(`input[name=odpusteni][value=${odpusteni}]`);
  if (urok !== undefined) { const je = await page.$eval('#urok', (e) => e.checked); if (je !== urok) await page.click('#urok'); }
  if (sazba !== undefined) await napis(page, '#sazba', sazba);
  await page.click('#vstup button[type=submit]');
  await cekej(300);
}

async function beh(cislo, lang) {
  const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
  const { page } = b;
  const z = { beh: cislo, lang, kroky: {} };
  const url = srv.url;
  await page.goto(url + '#uvod', { waitUntil: 'networkidle0', timeout: 60000 });
  await cekej(300);
  z.kroky.uvodVyrez = await pomocVeVyrezu(page);
  if (cislo === 1) await page.screenshot({ path: path.join(VYSTUP, 'vyrez-uvod-360.png'), fullPage: false });

  // Formulář
  await page.goto(url + '#formular', { waitUntil: 'networkidle0' });
  await cekej(300);
  z.kroky.formularVyrez = await pomocVeVyrezu(page);
  z.kroky.formularPreteka = await preteka(page);
  if (cislo === 1) {
    await page.screenshot({ path: path.join(VYSTUP, 'formular-360.png'), fullPage: true });
    await page.screenshot({ path: path.join(VYSTUP, 'vyrez-formular-360.png'), fullPage: false });
    z.kroky.formularAxe = await axe(page);
    await page.evaluate(() => document.querySelector('.lista .nazev').focus());
    z.kroky.formularTab = await tabulator(page, 18);
  }

  // Chybový stav: prázdný formulář
  await page.click('#vstup button[type=submit]');
  await cekej(300);
  z.kroky.chybaPrazdny = await ctiChyby(page);
  if (cislo === 1) {
    await page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
    z.kroky.chybaAxe = await axe(page);
  }
  // nesmyslné vstupy: záporná mzda, osoby 16, exekuce −1, dluh text, sazba 150 / abc
  await vyplnOdesli(page, { mzda: '-5000', osoby: '16', exekuce: '-1', dluh: 'nevím', urok: true, sazba: '150' });
  z.kroky.chybaNesmysly = await ctiChyby(page);
  await vyplnOdesli(page, { sazba: 'abc' });
  z.kroky.chybaSazbaText = (await ctiChyby(page)).sazba;

  // Z1: 23 000 / 100 000 běžný, bez úroku
  await vyplnOdesli(page, { mzda: '23 000', osoby: '0', druh: 'bezne', exekuce: '1', duchod: false, dluh: '100 000', odpusteni: 'ne', urok: false });
  await cekej(300);
  const z1 = await ctiVysledek(page);
  z.kroky.Z1 = { obrazovka: z1, ocekavano: ocekavani({ mzda: 23000, osoby: 0, prednostni: false, exekuci: 1, dluh: 100000, sazba: 0 }) };
  z.kroky.Z1.vyrez = await pomocVeVyrezu(page);
  z.kroky.Z1.preteka = await preteka(page);
  if (cislo === 1) {
    await page.screenshot({ path: path.join(VYSTUP, 'vyrez-vysledek-360.png'), fullPage: false });
    await page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
    z.kroky.vysledekAxe = await axe(page);
  }

  // Z2: 50 000 / 1 000 000 přednostní, úrok 11,75 (pole sazby bylo v kroku „nesmysly“ přepsáno, proto se zadává znovu)
  await naFormular(page);
  await vyplnOdesli(page, { mzda: '50 000', druh: 'prednostni', dluh: '1 000 000', urok: true, sazba: '11,75' });
  await cekej(300);
  const sazbaPole = await page.$eval('#sazba', (e) => e.value);
  z.kroky.Z2 = { sazbaPole, obrazovka: await ctiVysledek(page), ocekavano: ocekavani({ mzda: 50000, osoby: 0, prednostni: true, exekuci: 1, dluh: 1000000, sazba: 11.75 }) };

  // H8: důchodce, 4 exekuce, 16 502 / 50 000 běžný bez úroku → 800
  await naFormular(page);
  await vyplnOdesli(page, { mzda: '16 502', druh: 'bezne', exekuce: '4', duchod: true, dluh: '50 000', urok: false });
  await cekej(300);
  z.kroky.H8 = { obrazovka: await ctiVysledek(page), ocekavano: ocekavani({ mzda: 16502, osoby: 0, prednostni: false, exekuci: 4, duchodce: true, dluh: 50000, sazba: 0 }) };

  // Český zápis čísel
  const formaty = {};
  for (const [nazev, mzda] of [['23000,50', '23000,50'], ['23.000', '23.000'], ['23 000 Kč', '23 000 Kč'], ['1 500', '1 500'], ['23000.50', '23000.50']]) {
    await naFormular(page);
    await vyplnOdesli(page, { mzda, exekuce: '1', duchod: false, dluh: '100 000', urok: false });
    await cekej(200);
    const ch = await ctiChyby(page);
    formaty[nazev] = ch.obrazovka === 'vysledek' ? { vysledek: (({ zustane, srazka, doba, oSplatka, oMinimum }) => ({ zustane, srazka, doba, oSplatka, oMinimum }))(await ctiVysledek(page)) } : { chyba: ch.mzda.hlaska };
  }
  // desetinná čárka v sazbě (textové pole) a v poli osob (type=number) – závisí na lokalizaci
  for (const [nazev, vstup] of [['sazba 11,75', { sazba: '11,75' }], ['sazba 11.75', { sazba: '11.75' }], ['sazba 0,5', { sazba: '0,5' }]]) {
    await naFormular(page);
    await vyplnOdesli(page, { mzda: '23 000', dluh: '100 000', urok: true, ...vstup });
    await cekej(200);
    const ch = await ctiChyby(page);
    formaty[nazev] = { hodnotaPole: ch.sazba.hodnota, ...(ch.obrazovka === 'vysledek' ? { upozorneni: (await ctiVysledek(page)).upozorneni, doba: (await ctiVysledek(page)).doba } : { chyba: ch.sazba.hlaska }) };
  }
  for (const [nazev, vstup] of [['osoby 1,5', { osoby: '1,5' }], ['osoby 2', { osoby: '2' }]]) {
    await naFormular(page);
    await vyplnOdesli(page, { mzda: '23 000', dluh: '100 000', urok: false, ...vstup });
    await cekej(200);
    const ch = await ctiChyby(page);
    formaty[nazev] = { hodnotaPole: ch.osoby.hodnota, validity: ch.osoby.validity, ...(ch.obrazovka === 'vysledek' ? { srazka: (await ctiVysledek(page)).srazka, rozpis0: (await ctiVysledek(page)).rozpis[0] } : { chyba: ch.osoby.hlaska }) };
  }
  z.kroky.formaty = formaty;

  // XSS do všech polí včetně sazby (zobrazí se po zaškrtnutí úroku) a odeslání
  await naFormular(page);
  await page.evaluate(() => { const u = document.getElementById('urok'); if (!u.checked) u.click(); });
  await page.evaluate((pl) => {
    for (const id of ['mzda', 'osoby', 'exekuce', 'dluh', 'sazba']) { const el = document.getElementById(id); el.value = pl; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }
    document.getElementById('vstup').requestSubmit();
  }, XSS);
  await cekej(500);
  z.kroky.xss = { dialogy: b.zaznam.dialogy.length, vlozenyImg: await page.evaluate(() => !!document.querySelector('img[src="x"]')), hlasky: await ctiChyby(page) };
  // XSS přes hash
  await page.goto(url + '#<img src=x onerror=alert(1)>', { waitUntil: 'networkidle0' }); await cekej(300);
  z.kroky.xssHash = { obrazovka: await page.evaluate(() => [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden)?.id), dialogy: b.zaznam.dialogy.length, img: await page.evaluate(() => !!document.querySelector('img[src="x"]')) };
  // #vysledek bez výpočtu → formulář
  await page.goto(url + '#vysledek', { waitUntil: 'networkidle0' }); await page.reload({ waitUntil: 'networkidle0' }); await cekej(300);
  z.kroky.primoVysledek = await page.evaluate(() => [...document.querySelectorAll('[data-obrazovka]')].find((e) => !e.hidden)?.id);

  // Další kroky
  await page.goto(url + '#kroky', { waitUntil: 'networkidle0' }); await cekej(300);
  z.kroky.krokyVyrez = await pomocVeVyrezu(page);
  z.kroky.krokyPreteka = await preteka(page);
  if (cislo === 1) {
    await page.screenshot({ path: path.join(VYSTUP, 'vyrez-kroky-360.png'), fullPage: false });
    await page.screenshot({ path: path.join(VYSTUP, 'kroky-360.png'), fullPage: true });
    z.kroky.krokyAxe = await axe(page);
  }
  // odkaz #pomoc z lišty → sekce ve výřezu
  await page.click('.lista .pomoc-odkaz'); await cekej(400);
  z.kroky.pomocKlik = await page.evaluate(() => { const r = document.getElementById('pomoc').getBoundingClientRect(); return { top: r.top, veVyrezu: r.top < window.innerHeight && r.bottom > 0, aktivni: document.activeElement?.id }; });

  z.localStorage = await localStorageDump(page);
  z.sit = [...new Set(b.zaznam.sit.map((r) => r.url))];
  z.ciziPozadavky = b.zaznam.sit.filter((r) => !r.url.startsWith(url)).map((r) => r.url);
  z.konzole = b.zaznam.konzole;
  z.dialogy = b.zaznam.dialogy;
  await b.zavri();
  return z;
}

function ocekavani(v) {
  const moje = srazka(P2026, v);
  const mojeD = dobaSplaceni({ dluh: v.dluh, platba: moje.vericum, sazbaRok: v.sazba });
  const mojeO = oddluzeni(P2026, { mzda: v.mzda, osoby: v.osoby, dluh: v.dluh, odpusteni: 'ne' });
  const mod = M.srazka(p, { cistaMzda: v.mzda, osoby: v.osoby, prednostni: v.prednostni, pocetExekuci: v.exekuci, duchodce: v.duchodce });
  const modD = M.dobaSplaceniExekuce({ dluh: v.dluh, mesicne: mod.vericiDostanou, rocniUrokProcent: v.sazba });
  const modO = M.oddluzeni(p, { cistaMzda: v.mzda, osoby: v.osoby, dluh: v.dluh, drivejsiOdpusteni: 'ne' });
  return {
    moje: { zustane: kc0(moje.zustane), srazka: kc0(moje.srazka), vericum: kc0(moje.vericum), mesicu: mojeD.mesicu ?? mojeD.stav, uroky: mojeD.uroky !== undefined ? kc0(mojeD.uroky) : null, oSplatka: kc0(mojeO.splatka), oZustane: kc0(mojeO.zustane), oMesicu: mojeO.mesicu, oVericum: kc0(mojeO.vericum), oZaplaceno: kc0(mojeO.zaplaceno), oOdpusteno: kc0(mojeO.odpusteno) },
    modul: { zustane: kc0(mod.zustane), srazka: kc0(mod.srazka), vericum: kc0(mod.vericiDostanou), mesicu: modD.mesicu ?? modD.duvod, uroky: modD.uroky !== undefined ? kc0(modD.uroky) : null, oSplatka: kc0(modO.splatka), oZustane: kc0(modO.zustane), oMesicu: modO.mesicu, oVericum: kc0(modO.vericumMesicne), oZaplaceno: kc0(modO.zaplacenoVericum), oOdpusteno: kc0(modO.odpusteno) },
  };
}

// Běh 1 (cs-CZ), běh 2 (cs-CZ, nový prohlížeč), běh 3 (en-US – jen formáty čísel)
vysledek.behy.push(await beh(1, 'cs-CZ'));
vysledek.behy.push(await beh(2, 'cs-CZ'));
vysledek.behy.push(await beh(3, 'en-US'));

// 1440 px: výsledek Z1
{
  const b = await otevriProhlizec({ sirka: 1440, vyska: 900 });
  await b.page.goto(srv.url + '#formular', { waitUntil: 'networkidle0' }); await cekej(300);
  await vyplnOdesli(b.page, { mzda: '23 000', dluh: '100 000' }); await cekej(300);
  vysledek.sirka1440 = { preteka: await preteka(b.page), vyrez: await pomocVeVyrezu(b.page), obrazovka: (({ zustane, srazka, oSplatka }) => ({ zustane, srazka, oSplatka }))(await ctiVysledek(b.page)) };
  await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
  await b.zavri();
}
await srv.zavri();

// Živý web (GitHub Pages)
try {
  const zivy = await kontrolaStranky({ url: 'https://frankie851.github.io/kalkulator-dluhu/', vystup: VYSTUP, nazev: 'zivy' });
  vysledek.zivy = Object.fromEntries(Object.entries(zivy.zobrazeni).map(([k, z]) => [k, { preteka: z.preteka, axe: z.axe, cizi: z.ciziPozadavky, konzole: z.konzole, chyby: z.chyby, xss: z.xss, localStorage: z.localStorage, sit: z.sit.map((r) => r.url) }]));
} catch (e) { vysledek.zivy = { chyba: String(e).slice(0, 200) }; }

// e-Sbírka: co ukáže odkaz na zrušené NV 436/2022 (3 pokusy)
for (let pokus = 1; pokus <= 3 && !vysledek.esbirka; pokus++) {
  let b;
  try {
    b = await otevriProhlizec({ sirka: 1200, vyska: 900 });
    const out = {};
    for (const u of ['https://e-sbirka.gov.cz/sb/2022/436', 'https://e-sbirka.gov.cz/sb/2025/361', 'https://e-sbirka.gov.cz/sb/2006/595']) {
      await b.page.goto(u, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(2500);
      out[u] = await b.page.evaluate(() => ({ title: document.title, h1: document.querySelector('h1')?.textContent.trim().slice(0, 200), text: document.body.innerText.replace(/\s+/g, ' ').slice(0, 600) }));
    }
    vysledek.esbirka = out;
  } catch (e) { vysledek.esbirka = null; vysledek.esbirkaChyba = String(e).slice(0, 200); } finally { if (b) await b.zavri(); }
}

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
// stručný souhrn
for (const z of vysledek.behy) {
  console.log(`\n== běh ${z.beh} (${z.lang})`);
  for (const k of ['uvodVyrez', 'formularVyrez', 'krokyVyrez']) console.log(k, JSON.stringify(z.kroky[k]));
  console.log('Z1 vyrez', JSON.stringify(z.kroky.Z1.vyrez));
  for (const k of ['Z1', 'Z2', 'H8']) {
    const o = z.kroky[k].obrazovka;
    console.log(k, 'obrazovka:', o.zustane, o.srazka, o.vericum, '|', o.doba, '|', o.oSplatka, o.oZustane, o.oDelka, '|', o.oZaplaceno, '|', o.oZbytek, '| upoz:', o.upozorneni, '| min:', o.oMinimum);
    console.log(k, 'moje     :', JSON.stringify(z.kroky[k].ocekavano.moje));
    console.log(k, 'modul    :', JSON.stringify(z.kroky[k].ocekavano.modul));
  }
  console.log('chyba prázdný:', JSON.stringify(Object.fromEntries(Object.entries(z.kroky.chybaPrazdny).map(([k, v]) => [k, v?.hlaska ?? v]))));
  console.log('chyba nesmysly:', JSON.stringify(Object.fromEntries(Object.entries(z.kroky.chybaNesmysly).map(([k, v]) => [k, v?.hlaska ?? v]))), 'sazba abc:', JSON.stringify(z.kroky.chybaSazbaText));
  console.log('formáty:', JSON.stringify(z.kroky.formaty));
  console.log('xss:', JSON.stringify(z.kroky.xss.dialogy), z.kroky.xss.vlozenyImg, 'hash:', JSON.stringify(z.kroky.xssHash), 'přímo #vysledek →', z.kroky.primoVysledek);
  console.log('axe formulář/chyba/výsledek/kroky:', JSON.stringify([z.kroky.formularAxe, z.kroky.chybaAxe, z.kroky.vysledekAxe, z.kroky.krokyAxe]));
  console.log('tab:', JSON.stringify(z.kroky.formularTab?.map((t) => `${t.tag}#${t.id}${t.fokusViditelny ? '' : '(!fokus)'}`)));
  console.log('pomoc klik:', JSON.stringify(z.kroky.pomocKlik), 'localStorage:', JSON.stringify(z.localStorage), 'cizí:', JSON.stringify(z.ciziPozadavky), 'konzole:', JSON.stringify(z.konzole), 'dialogy:', z.dialogy.length);
}
console.log('\n1440:', JSON.stringify(vysledek.sirka1440));
console.log('živý:', JSON.stringify(vysledek.zivy).slice(0, 1500));
console.log('e-sbírka:', JSON.stringify(vysledek.esbirka ?? vysledek.esbirkaChyba).slice(0, 2000));
