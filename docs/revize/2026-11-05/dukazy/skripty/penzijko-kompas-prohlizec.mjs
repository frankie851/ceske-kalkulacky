// Prohlížečové scénáře pro revizi Penzijko kompas (5. 11. 2026).
// Spuštění: node penzijko-kompas-prohlizec.mjs  → snímky a prohlizec.json do dukazy/penzijko-kompas/, kontrola živého webu do zivy-kontrola.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spustServer, otevriProhlizec, preteka, axe, tabulator, localStorageDump, zkusXss } from './prohlizec-lib.mjs';

const KOREN = '/tmp/revize/repos/penzijko-kompas';
const VYSTUP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../penzijko-kompas');
const ZIVY = 'https://frankie851.github.io/penzijko-kompas/';
fs.mkdirSync(VYSTUP, { recursive: true });

// Modul aplikace jen pro srovnání „obrazovka vs. modul“ (referenční výpočet je v penzijko-kompas-prepocet.mjs).
const calc = await import(path.join(KOREN, 'calc.js'));
const rules = JSON.parse(fs.readFileSync(path.join(KOREN, 'rules.json'), 'utf8'));
const ted = new Date();
const START = { rok: ted.getFullYear(), mesic: ted.getMonth() + 1 };

const vysledek = { datum: ted.toISOString(), start: START, scenare: {} };
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));
const cisloZTextu = (s) => Number(String(s).replace(/\s| /g, '').replace(',', '.').replace(/[^\d.-]/g, ''));

async function precti(page) {
  return page.evaluate(() => {
    const t = (sel) => document.querySelector(sel)?.textContent.replace(/\s+/g, ' ').trim() ?? null;
    const karty = [...document.querySelectorAll('#stat-karty .dlazdice')].map((k) => ({
      nazev: k.querySelector('h3')?.textContent.trim(), stitek: k.querySelector('.stitek')?.textContent.trim(),
      mesicne: k.querySelector('.velke')?.childNodes[0]?.textContent.trim(), rocne: k.querySelector('.mensi')?.textContent.trim(),
      vysvetleni: k.querySelector('.vysvetleni')?.textContent.trim(),
    }));
    const tabulka = [...document.querySelectorAll('#tabulka-fondu tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent.replace(/\s+/g, ' ').trim()));
    return {
      karty, odpocet: t('#odpocet'), hlavni: t('#hlavni-cislo'), hlavniStitek: document.querySelector('#hlavni-cislo .stitek')?.textContent.trim() ?? null,
      tabulka, poplatky: t('#poplatky-obsah'), poplatkyStitek: t('#karta-poplatky .stitek'),
      tfSkryta: document.querySelector('#karta-tf').hidden, tf: t('#tf-obsah'), tfStitky: [...document.querySelectorAll('#tf-obsah .stitek')].map((s) => s.textContent),
      kroky: [...document.querySelectorAll('#kroky li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
      predpoklady: [...document.querySelectorAll('#predpoklady li')].map((li) => li.textContent.replace(/\s+/g, ' ').trim()),
      zdroje: [...document.querySelectorAll('#zdroje a')].map((a) => ({ text: a.textContent, href: a.href, pozn: a.nextElementSibling?.textContent })),
      grafSkryty: document.querySelector('.graf-obal').hidden, grafChyba: !document.querySelector('#graf-chyba').hidden,
      chyboveHlasky: [...document.querySelectorAll('[role=alert], [aria-invalid=true], .chyba, .error, :invalid')].map((e) => e.outerHTML.slice(0, 120)),
      hodnotyPoli: Object.fromEntries([...document.querySelectorAll('#formular input[name]')].map((i) => [i.name, i.type === 'checkbox' ? i.checked : i.value])),
    };
  });
}

async function nastav(page, hodnoty) {
  await page.evaluate((h) => {
    const f = document.getElementById('formular');
    for (const [k, v] of Object.entries(h)) {
      const el = f.elements[k];
      if (!el) continue;
      if (el.type === 'checkbox') el.checked = !!v;
      else if (k === 'sada') { const r = f.querySelector(`input[name=sada][value="${v}"]`); r.checked = true; r.dispatchEvent(new Event('input', { bubbles: true })); continue; }
      else el.value = String(v);
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
  }, hodnoty);
  await cekej(300);
}

function modul(v) {
  const vstup = { ...v, start: START, poplatky: { ...v.poplatky } };
  const srov = calc.srovnaniFondu(rules, vstup);
  const stat = Object.fromEntries(Object.entries(rules.sady).map(([k, s]) => [k, calc.statniPrispevek(s, vstup)]));
  const odp = calc.danovyOdpocet(rules.sady['2026'], vstup);
  const m = srov[v.fond].souhrn;
  const out = { stat: Object.fromEntries(Object.entries(stat).map(([k, r]) => [k, { mesicne: r.mesicne, rocne: r.rocne }])), odpocetRocne: odp.rocne, uspora: odp.uspora,
    realne: Math.round(m.realne), nominal: Math.round(m.nominal), statni: Math.round(m.statni), poplatky: Math.round(m.poplatky),
    tabulka: Object.fromEntries(Object.entries(srov).map(([k, p]) => [k, { realne: Math.round(p.souhrn.realne), nominal: Math.round(p.souhrn.nominal), poplatky: Math.round(p.souhrn.poplatky) }])) };
  if (v.vek < rules.predpoklady.vekPenze) {
    const d = calc.dopadPoplatku(rules, vstup);
    out.poplatkyRozdilNominal = Math.round(d.rozdilNominal); out.poplatkyDnes = Math.round(d.dnes.souhrn.nominal); out.poplatkyStrop = Math.round(d.strop.souhrn.nominal);
    out.kroky = calc.doporuceni(rules, vstup).map((k) => ({ id: k.id, prinos: Math.round(k.prinos) }));
    if (v.fond === 'transformovany') { const t = calc.transformovanyFond(rules, vstup); out.tf = { zustat: Math.round(t.zustat.souhrn.realne), prejit: Math.round(t.prejit.souhrn.realne), rozdil: Math.round(t.rozdilRealne) }; }
  }
  return out;
}

function kontrast(hex1, hex2) {
  const lum = (h) => { const c = h.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4))); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const [a, b] = [lum(hex1), lum(hex2)].sort((x, y) => y - x);
  return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
}

// ---------------------------------------------------------------- lokální klon
const srv = await spustServer(KOREN);

// Scénář A: výchozí formulář (35, 1 000, 0, 150 000, TF 0,8 + 10, 8 let, sada 2026) – 360 i 1440
for (const [jmeno, sirka, vyska] of [['360', 360, 800], ['1440', 1440, 900]]) {
  const b = await otevriProhlizec({ sirka, vyska });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await cekej(400);
  const obr = await precti(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, `vysledek-${jmeno}.png`), fullPage: true });
  const s = { obrazovka: obr, modul: modul({ vek: 35, vklad: 1000, zamestnavatel: 0, zustatek: 150000, fond: 'transformovany', poplatky: { sprava: 0.8, zhodnoceni: 10 }, delkaSmlouvy: 8, duchodce: false, sada: '2026' }), preteka: await preteka(b.page) };
  if (jmeno === '360') {
    s.axeSvetly = await axe(b.page);
    // Tab: fokus je stylován na obalu .vstup (focus-within) – zkontroluj, zda je outline vidět na obalu
    s.tab = await tabulator(b.page, 12);
    s.fokusNaObalu = await b.page.evaluate(() => {
      const r = [];
      for (const i of document.querySelectorAll('#formular input[type=number]')) { i.focus(); const o = i.closest('.vstup'); const cs = getComputedStyle(o); r.push({ pole: i.name, outline: cs.outlineStyle, sirka: cs.outlineWidth }); }
      return r;
    });
    // přepnutí sady radiem přes skutečné kliknutí (ověření, že radio vyvolá přepočet)
    await b.page.click('#sada-prepinac label:nth-child(2)');
    await cekej(300);
    const poNavrhu = await precti(b.page);
    s.poPrepnutiNaNavrh = { hlavni: poNavrhu.hlavni, hlavniStitek: poNavrhu.hlavniStitek, tf: poNavrhu.tf, tfStitky: poNavrhu.tfStitky, kroky: poNavrhu.kroky };
    s.modulNavrh = modul({ vek: 35, vklad: 1000, zamestnavatel: 0, zustatek: 150000, fond: 'transformovany', poplatky: { sprava: 0.8, zhodnoceni: 10 }, delkaSmlouvy: 8, duchodce: false, sada: 'navrh2027' });
    await b.page.click('#sada-prepinac label:nth-child(1)');
    await cekej(300);
    // tmavý režim – axe
    await b.page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
    await cekej(500);
    s.axeTmavy = await axe(b.page);
    await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-360-tmavy.png'), fullPage: false });
    s.localStorage = await localStorageDump(b.page);
    s.xss = await zkusXss(b.page);
  }
  s.sit = b.zaznam.sit.map((r) => r.url); s.konzole = b.zaznam.konzole; s.chyby = b.zaznam.chyby; s.dialogy = b.zaznam.dialogy;
  vysledek.scenare[`A-vychozi-${jmeno}`] = s;
  await b.zavri();
}

// Scénář B: 25 let, 1 700 Kč, zaměstnavatel 500, zůstatek 0, akciový, 2 roky, návrh 2027
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await nastav(b.page, { vek: 25, vklad: 1700, zamestnavatel: 500, zustatek: 0, fond: 'akciovy', delkaSmlouvy: 2, sada: 'navrh2027' });
  await cekej(300);
  const obr = await precti(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-b-360.png'), fullPage: true });
  vysledek.scenare['B-25-akciovy-navrh'] = { obrazovka: obr, modul: modul({ vek: 25, vklad: 1700, zamestnavatel: 500, zustatek: 0, fond: 'akciovy', poplatky: { sprava: 1, zhodnoceni: 15 }, delkaSmlouvy: 2, duchodce: false, sada: 'navrh2027' }), preteka: await preteka(b.page), axe: await axe(b.page), konzole: b.zaznam.konzole };
  await b.zavri();
}

// Scénář C: česká čísla psaná klávesnicí do polí type=number („1 500“, „1500,50“, „1.500“)
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  const pokusy = {};
  for (const text of ['1 500', '1500,50', '1500.50', '1.500', '1e3']) {
    await b.page.evaluate(() => { const i = document.querySelector('input[name=vklad]'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); });
    await b.page.focus('input[name=vklad]');
    await b.page.keyboard.type(text, { delay: 20 });
    await cekej(300);
    const o = await precti(b.page);
    pokusy[text] = { hodnotaPole: o.hodnotyPoli.vklad, validity: await b.page.evaluate(() => { const i = document.querySelector('input[name=vklad]'); return { valid: i.validity.valid, badInput: i.validity.badInput, valueAsNumber: i.valueAsNumber }; }), karta2026: o.karty[0]?.mesicne, vysvetleni: o.karty[0]?.vysvetleni, chyboveHlasky: o.chyboveHlasky };
  }
  await b.page.screenshot({ path: path.join(VYSTUP, 'cisla-360.png'), fullPage: false });
  vysledek.scenare['C-ceska-cisla'] = pokusy;
  await b.zavri();
}

// Scénář D: nesmyslné vstupy (záporný vklad, věk 150, poplatek −1, prázdná pole) – jsou chybové hlášky?
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await nastav(b.page, { vklad: -500, sprava: -1, zustatek: '' });
  const o1 = await precti(b.page);
  await b.page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
  await nastav(b.page, { vek: 150, vklad: 1000, sprava: 0.8 });
  const o2 = await precti(b.page);
  await nastav(b.page, { vek: '', vklad: '' });
  const o3 = await precti(b.page);
  vysledek.scenare['D-nesmyslne-vstupy'] = {
    zapornyVkladAPoplatek: { hodnotyPoli: o1.hodnotyPoli, karta2026: o1.karty[0], poplatky: o1.poplatky, hlavni: o1.hlavni, chyboveHlasky: o1.chyboveHlasky, kroky: o1.kroky },
    vek150: { hlavni: o2.hlavni, karty: o2.karty.map((k) => k.mesicne), kroky: o2.kroky, chyboveHlasky: o2.chyboveHlasky },
    prazdnyVekAVklad: { hlavni: o3.hlavni, karty: o3.karty.map((k) => k.mesicne + ' ' + k.vysvetleni), chyboveHlasky: o3.chyboveHlasky },
    konzole: b.zaznam.konzole,
  };
  await b.zavri();
}

// Scénář E: výpadek rules.json a výpadek cdnjs (Chart.js) – chybové stavy
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.setRequestInterception(true);
  b.page.on('request', (r) => (r.url().endsWith('rules.json') ? r.abort() : r.continue()));
  await b.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await cekej(300);
  vysledek.scenare['E1-bez-rules'] = { text: await b.page.evaluate(() => document.querySelector('.rozlozeni')?.textContent.trim()), konzole: b.zaznam.konzole };
  await b.page.screenshot({ path: path.join(VYSTUP, 'chyba-rules-360.png'), fullPage: false });
  await b.zavri();

  const c = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await c.page.setRequestInterception(true);
  c.page.on('request', (r) => (r.url().includes('cdnjs.cloudflare.com') ? r.abort() : r.continue()));
  await c.page.goto(srv.url, { waitUntil: 'networkidle0' });
  await cekej(300);
  const o = await precti(c.page);
  vysledek.scenare['E2-bez-cdnjs'] = { grafSkryty: o.grafSkryty, grafChyba: o.grafChyba, hlavni: o.hlavni, tabulkaRadku: o.tabulka.length, konzole: c.zaznam.konzole.map((k) => k.text.slice(0, 120)) };
  await c.page.screenshot({ path: path.join(VYSTUP, 'graf-vypadek-360.png'), fullPage: false });
  await c.zavri();
}
await srv.zavri();

// ---------------------------------------------------------------- živý web (bez snímků navíc; konzole, chybějící soubory, cizí požadavky, shoda čísel)
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  let stav = null;
  b.page.on('response', (r) => { if (r.url() === ZIVY) stav = r.status(); });
  try {
    await b.page.goto(ZIVY, { waitUntil: 'networkidle0', timeout: 60000 });
    await cekej(500);
    const o = await precti(b.page);
    const z = { url: ZIVY, httpStav: stav, datum: new Date().toISOString(), preteka: await preteka(b.page), hlavni: o.hlavni, karty: o.karty.map((k) => k.mesicne), zdroje: o.zdroje.map((x) => x.href),
      sit: b.zaznam.sit.map((r) => r.url), cizi: [...new Set(b.zaznam.sit.map((r) => r.url).filter((u) => !u.startsWith(ZIVY)))], konzole: b.zaznam.konzole, chyby: b.zaznam.chyby, localStorage: await localStorageDump(b.page) };
    fs.writeFileSync(path.join(VYSTUP, 'zivy-kontrola.json'), JSON.stringify(z, null, 1));
    vysledek.zivy = { httpStav: stav, hlavni: o.hlavni, cizi: z.cizi, konzole: z.konzole, chyby: z.chyby };
  } catch (e) {
    vysledek.zivy = { chyba: String(e) };
  }
  await b.zavri();
}

// Kontrasty barev z styles.css (světlý/tmavý režim)
vysledek.kontrast = {
  'svetly text-3 #6f6e69 na surface-2 #f0efec (.srovnani small)': kontrast('#6f6e69', '#f0efec'),
  'svetly text-3 #6f6e69 na surface #fcfcfb (.poznamka)': kontrast('#6f6e69', '#fcfcfb'),
  'svetly text-2 #52514e na surface-2 #f0efec': kontrast('#52514e', '#f0efec'),
  'tmavy text-3 #9e9d95 na surface-2 #242422': kontrast('#9e9d95', '#242422'),
  'tmavy text-3 #9e9d95 na surface #1a1a19': kontrast('#9e9d95', '#1a1a19'),
  'stitek warn-ink #8a5a00 na warn-soft #fff3d6': kontrast('#8a5a00', '#fff3d6'),
  'stitek good #006300 na good-soft #e4f3e4': kontrast('#006300', '#e4f3e4'),
};

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
