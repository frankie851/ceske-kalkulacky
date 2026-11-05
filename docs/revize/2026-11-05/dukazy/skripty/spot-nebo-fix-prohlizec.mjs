// Scénáře v prohlížeči pro „Spot, nebo fix?“ (revize 5. 11. 2026): vyplnění formuláře, výsledek vs. modul,
// zadávání čísel (čárka, mezera) v cs-CZ i en-US, CSV (správné, chybné, XSS v hlavičce), axe a Tab ve stavu s výsledkem,
// kontrola živého webu. Snímky a prohlizec.json do ../spot-nebo-fix/.
// Spuštění: node spot-nebo-fix-prohlizec.mjs [cesta ke klonu]
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, kontrolaStranky } from './prohlizec-lib.mjs';
import { modulVarianty, kontextModulu } from './spot-nebo-fix-porovnani.mjs';

const REPO = process.argv[2] ?? '/tmp/revize/repos/spot-nebo-fix';
const OUT = new URL('../spot-nebo-fix/', import.meta.url).pathname;
const ZIVY = 'https://frankie851.github.io/spot-nebo-fix/';
fs.mkdirSync(OUT, { recursive: true });
const vysledek = { datum: new Date().toISOString(), repo: REPO, scenare: {} };
const cislo = (s) => Number(String(s).replace(/[^\d-]/g, ''));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function nastav(page, id, value, udalost = 'input') {
  await page.evaluate(({ id, value, udalost }) => { const el = document.getElementById(id); el.value = value; el.dispatchEvent(new Event(udalost, { bubbles: true })); }, { id, value, udalost });
}
async function napis(page, id, text) {
  await page.focus(`#${id}`);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.type(`#${id}`, text, { delay: 10 });
}
/** Simulace vložení ze schránky (execCommand insertText) do vyprázdněného pole. */
async function vloz(page, id, text) {
  await page.focus(`#${id}`);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  await page.evaluate((t) => document.execCommand('insertText', false, t), text);
  await page.evaluate((id) => document.getElementById(id).dispatchEvent(new Event('input', { bubbles: true })), id);
}
async function karty(page) {
  await sleep(700);
  return page.evaluate(() => ({
    summary: document.getElementById('summary').textContent,
    karty: [...document.querySelectorAll('#cards .card')].map((c) => ({
      nazev: c.querySelector('h3 span').textContent, nejlevnejsi: c.classList.contains('best'),
      celkem: c.querySelector('.total').textContent, kwh: c.querySelector('.vat').textContent,
      energie: c.querySelectorAll('dd')[0].textContent, regulovane: c.querySelectorAll('dd')[1].textContent, stale: c.querySelectorAll('dd')[2].textContent,
      posun: c.querySelector('.shift-effect')?.textContent ?? null,
    })),
    pole: Object.fromEntries(['mwh', 'fixPrice', 'spotMargin', 'fixFee', 'spotFee', 'dynBase', 'dynFee', 'shift'].map((id) => { const el = document.getElementById(id); return [id, { value: el.value, badInput: el.validity.badInput, disabled: el.disabled }]; })),
    vyber: Object.fromEntries(['household', 'distributor', 'sazba', 'breaker', 'region'].map((id) => [id, document.getElementById(id).value])),
  }));
}
function porovnej(obrazovka, modul) {
  const map = { 'Fixní cena': 'fix', Spot: 'spot', 'Dynamický tarif': 'dynamic' };
  return obrazovka.karty.map((k) => {
    const m = modul[map[k.nazev]];
    return { varianta: k.nazev, obrazovka: cislo(k.celkem), modul: Math.round(m.celkem), shoda: cislo(k.celkem) === Math.round(m.celkem),
      energie: [cislo(k.energie), Math.round(m.energie)], regulovane: [cislo(k.regulovane), Math.round(m.regulovane)], stale: [cislo(k.stale), Math.round(m.stale)] };
  });
}
async function nastavV1(page) {
  await nastav(page, 'household', 'house', 'change');
  await nastav(page, 'distributor', 'cez', 'change');
  await nastav(page, 'sazba', 'D02d', 'change');
  await nastav(page, 'breaker', '3x25', 'change');
  await napis(page, 'mwh', '3');
  await napis(page, 'fixPrice', '3000');
  await napis(page, 'spotMargin', '400');
}

const K = kontextModulu(REPO);
const modul = {
  V1: modulVarianty({ ...K, tdd: K.tdd('TDD4'), mwh: 3, distributor: 'cez', sazba: 'D02d', jistic: '3x25', fix: 3000, marze: 400 }),
  V1b: modulVarianty({ ...K, tdd: K.tdd('TDD4'), mwh: 3, distributor: 'cez', sazba: 'D02d', jistic: '3x25', fix: 3000, marze: 400, shift: 30 }),
  V2: modulVarianty({ ...K, tdd: K.tdd('TDD6'), mwh: 9, distributor: 'egd', sazba: 'D56d', jistic: '3x25', fix: 3500, marze: 400 }),
};

const srv = await spustServer(REPO);
try {
  // --- A: 360 px, V1 + posun 30 %, axe, Tab, přetékání ---
  for (const [jmeno, sirka, vyska] of [['360', 360, 800], ['1440', 1440, 900]]) {
    const b = await otevriProhlizec({ sirka, vyska });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await nastavV1(b.page);
    const o1 = await karty(b.page);
    const s = { V1: { obrazovka: o1, porovnani: porovnej(o1, modul.V1) } };
    await b.page.screenshot({ path: path.join(OUT, `vysledek-${jmeno}.png`), fullPage: true });
    s.preteka = await preteka(b.page);
    if (jmeno === '360') {
      s.axe = await axe(b.page);
      await b.page.evaluate(() => window.scrollTo(0, 0));
      s.tab = await tabulator(b.page, 18);
      await nastav(b.page, 'shift', '30', 'input');
      const o2 = await karty(b.page);
      s.V1b = { obrazovka: o2, porovnani: porovnej(o2, modul.V1b), posunPopisky: o2.karty.map((k) => k.posun), shiftOut: await b.page.$eval('#shift-out', (e) => e.textContent) };
      s.localStorage = await localStorageDump(b.page);
    }
    s.sit = { cizi: [...new Set(b.zaznam.sit.filter((r) => !r.url.startsWith(srv.url)).map((r) => r.url))], metody: [...new Set(b.zaznam.sit.map((r) => r.metoda))] };
    s.konzole = b.zaznam.konzole; s.chyby = b.zaznam.chyby; s.dialogy = b.zaznam.dialogy;
    vysledek.scenare[`V1-${jmeno}`] = s;
    await b.zavri();
  }

  // --- C: tepelné čerpadlo EG.D D56d 9 MWh, fix 3 500 (360 px) ---
  {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await nastav(b.page, 'household', 'heatpump', 'change');
    await sleep(300);
    const predvolby = await b.page.evaluate(() => ({ sazba: document.getElementById('sazba').value, mwh: document.getElementById('mwh').value, breaker: document.getElementById('breaker').value, hint: document.getElementById('household-hint').textContent }));
    await nastav(b.page, 'distributor', 'egd', 'change');
    await napis(b.page, 'fixPrice', '3500');
    await napis(b.page, 'spotMargin', '400');
    const o = await karty(b.page);
    await b.page.screenshot({ path: path.join(OUT, 'vysledek-tc-360.png'), fullPage: true });
    vysledek.scenare['V2-360'] = { predvolby, obrazovka: o, porovnani: porovnej(o, modul.V2), tddPouzity: b.zaznam.sit.filter((r) => /tdd\//.test(r.url)).map((r) => r.url.split('/').pop()), konzole: b.zaznam.konzole };
    await b.zavri();
  }

  // --- D: zadávání čísel – čárka a mezera, cs-CZ i en-US ---
  for (const lang of ['cs-CZ', 'en-US']) {
    const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await nastavV1(b.page);
    const kroky = {};
    const zaznam = async (nazev) => { const o = await karty(b.page); kroky[nazev] = { fixPrice: o.pole.fixPrice, mwh: o.pole.mwh, fix: o.karty.find((k) => k.nazev === 'Fixní cena'), nejlevnejsi: o.karty.find((k) => k.nejlevnejsi)?.nazev, summary: o.summary }; };
    await napis(b.page, 'fixPrice', '3000,50'); await zaznam('psáno 3000,50');
    if (lang === 'en-US') await b.page.screenshot({ path: path.join(OUT, 'vstup-carka-360.png'), fullPage: true });
    await napis(b.page, 'fixPrice', '3 000'); await zaznam('psáno 3 000 (mezera)');
    await vloz(b.page, 'fixPrice', '3 000'); await zaznam('vloženo ze schránky 3 000');
    await vloz(b.page, 'fixPrice', '3000,50'); await zaznam('vloženo ze schránky 3000,50');
    await napis(b.page, 'fixPrice', '0,85'); await zaznam('psáno 0,85');
    await nastav(b.page, 'fixPrice', ''); await zaznam('prázdné');
    await nastav(b.page, 'fixPrice', '-500'); await zaznam('záporné −500');
    await napis(b.page, 'fixPrice', '3000');
    await napis(b.page, 'mwh', '3,5'); await zaznam('mwh psáno 3,5');
    await nastav(b.page, 'mwh', ''); await zaznam('mwh prázdné');
    await nastav(b.page, 'mwh', '250'); await zaznam('mwh 250 (max 100)');
    kroky.chyboveHlasky = await b.page.evaluate(() => [...document.querySelectorAll('.err, [role=alert], .error, .invalid')].map((e) => e.textContent.trim()).filter(Boolean));
    vysledek.scenare[`vstup-${lang}`] = { lang: await b.page.evaluate(() => navigator.language), kroky, dialogy: b.zaznam.dialogy, konzole: b.zaznam.konzole };
    await b.zavri();
  }

  // --- E: CSV – správné s českými čárkami, chybné, XSS v hlavičce ---
  {
    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'spot-csv-'));
    const radky = ['Datum a čas;Spotřeba [kWh]'];
    for (const d of ['05.01.2026', '06.01.2026']) for (let q = 1; q <= 96; q++) { const h = Math.floor((q * 15) / 60) % 24, m = (q * 15) % 60; radky.push(`${q === 96 ? (d === '05.01.2026' ? '06.01.2026' : '07.01.2026') : d} ${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')};${(0.08 + 0.06 * Math.sin(q / 10)).toFixed(3).replace('.', ',')}`); }
    radky.push('07.01.2026 00:15;1 000,5'); // tisícová mezera + desetinná čárka (1 000,5 kWh)
    const dobry = path.join(tmp, 'mereni.csv'); fs.writeFileSync(dobry, radky.join('\r\n') + '\r\n');
    const spatny = path.join(tmp, 'spatny.csv'); fs.writeFileSync(spatny, 'toto není csv\nabc;def\n1;2;3\n');
    const xss = path.join(tmp, 'xss.csv'); fs.writeFileSync(xss, '<img src=x onerror=alert(1)>;<script>alert(2)</script>\n05.01.2026 00:15;0,25\n');
    const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await nastavV1(b.page);
    await b.page.evaluate(() => { document.getElementById('csv-box').open = true; });
    const soubor = async (p) => { const inp = await b.page.$('#csvFile'); await inp.uploadFile(p); await sleep(800); return b.page.evaluate(() => ({ status: document.getElementById('csv-status').textContent, err: document.getElementById('csv-status').classList.contains('err'), mapViditelna: !document.getElementById('csv-map').hidden, sloupce: [...document.querySelectorAll('#csvTime option')].map((o) => o.textContent), casIdx: document.getElementById('csvTime').value, hodnotaIdx: document.getElementById('csvValue').value })); };
    const e = {};
    e.dobry = await soubor(dobry);
    await b.page.click('#csvApply'); await sleep(900);
    e.dobryPouzit = await b.page.evaluate(() => ({ status: document.getElementById('csv-status').textContent, err: document.getElementById('csv-status').classList.contains('err'), mwh: document.getElementById('mwh').value, mwhDisabled: document.getElementById('mwh').disabled }));
    e.dobryKarty = (await karty(b.page)).karty.map((k) => ({ nazev: k.nazev, celkem: k.celkem, energie: k.energie }));
    // kontrola: naměřeno = součet CSV v MWh
    e.ocekavanoNamerenoMWh = radky.slice(1).reduce((s, l) => s + Number(l.split(';')[1].replace(/\s/g, '').replace(',', '.')), 0) / 1000;
    await b.page.click('#csvClear'); await sleep(500);
    e.zpet = await b.page.evaluate(() => ({ status: document.getElementById('csv-status').textContent, mwh: document.getElementById('mwh').value, mwhDisabled: document.getElementById('mwh').disabled }));
    e.spatny = await soubor(spatny);
    if (e.spatny.mapViditelna) { await b.page.click('#csvApply'); await sleep(900); e.spatnyPouzit = await b.page.evaluate(() => ({ status: document.getElementById('csv-status').textContent, err: document.getElementById('csv-status').classList.contains('err') })); }
    await b.page.screenshot({ path: path.join(OUT, 'chyba-360.png'), fullPage: true });
    e.xss = await soubor(xss);
    if (e.xss.mapViditelna) { await b.page.click('#csvApply'); await sleep(900); }
    e.xssVysledek = { dialogy: b.zaznam.dialogy, vlozenyImg: await b.page.evaluate(() => !!document.querySelector('img[src="x"]')), skriptVDom: await b.page.evaluate(() => [...document.scripts].some((s) => /alert\(2\)/.test(s.textContent))) };
    e.sit = { metody: [...new Set(b.zaznam.sit.map((r) => r.metoda))], cizi: [...new Set(b.zaznam.sit.filter((r) => !r.url.startsWith(srv.url)).map((r) => r.url))], pocetPoNahrani: b.zaznam.sit.length };
    e.konzole = b.zaznam.konzole;
    vysledek.scenare.csv = e;
    await b.zavri();
  }
} finally {
  await srv.zavri();
}

// --- F: živý web ---
try {
  const z = await kontrolaStranky({ url: ZIVY, vystup: OUT, nazev: 'zivy' });
  vysledek.scenare.zivy = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, { preteka: v.preteka, axe: v.axe, konzole: v.konzole, chyby: v.chyby, cizi: [...new Set(v.ciziPozadavky.map((r) => r.url))], xss: v.xss, localStorage: v.localStorage, pocetPozadavku: v.sit.length }]));
} catch (e) { vysledek.scenare.zivy = { chyba: String(e) }; }

fs.writeFileSync(path.join(OUT, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
for (const [k, s] of Object.entries(vysledek.scenare)) {
  console.log(`== ${k}`);
  if (s.porovnani) for (const p of s.porovnani) console.log(`  ${p.varianta}: obrazovka ${p.obrazovka} · modul ${p.modul} · ${p.shoda ? 'shoda' : 'NESHODA'}`);
  if (s.V1?.porovnani) for (const p of s.V1.porovnani) console.log(`  V1 ${p.varianta}: obrazovka ${p.obrazovka} · modul ${p.modul} · ${p.shoda ? 'shoda' : 'NESHODA'}`);
  if (s.V1b?.porovnani) for (const p of s.V1b.porovnani) console.log(`  V1b ${p.varianta}: obrazovka ${p.obrazovka} · modul ${p.modul} · ${p.shoda ? 'shoda' : 'NESHODA'} · ${s.V1b.posunPopisky.join(' | ')}`);
  if (s.preteka) console.log(`  přetéká: ${s.preteka.preteka} (${s.preteka.scrollWidth}/${s.preteka.innerWidth})`);
  if (s.axe) console.log(`  axe: ${s.axe.length} (serious/critical ${s.axe.filter((a) => ['serious', 'critical'].includes(a.dopad)).length})`, s.axe.map((a) => `${a.dopad}:${a.id}×${a.pocet}`).join(', '));
  if (s.tab) console.log(`  tab: ${s.tab.map((t) => `${t.tag}#${t.id || t.popisek.slice(0, 15)}${t.fokusViditelny ? '' : '(!fokus)'}`).join(' → ')}`);
  if (s.kroky) { console.log('  navigator.language:', s.lang); for (const [n, k] of Object.entries(s.kroky)) console.log(`  ${n}: ${JSON.stringify(k).slice(0, 300)}`); }
  if (s.predvolby) console.log('  předvolby:', JSON.stringify(s.predvolby));
  if (k === 'csv') console.log(JSON.stringify(s, null, 0).slice(0, 2500));
  if (k === 'zivy') console.log(JSON.stringify(s).slice(0, 1500));
  if (s.konzole?.length) console.log('  konzole:', JSON.stringify(s.konzole).slice(0, 300));
  if (s.sit) console.log('  síť:', JSON.stringify(s.sit));
}
