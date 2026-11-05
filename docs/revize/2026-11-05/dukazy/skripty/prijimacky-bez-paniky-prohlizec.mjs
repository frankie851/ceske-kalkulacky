// Prohlížečové scénáře pro revizi „Přijímačky bez paniky“ (5. 11. 2026):
// simulátor (zadání Z3 zadané do formuláře, scénář „dva pokusy“, shoda bodů = chybový stav, XSS ve jménech),
// „Moje strategie“, český zápis čísel (cs-CZ i en-US), export .ics (skutečné stažení), klávesnice, axe, přetékání, živý web.
// Spuštění: node prijimacky-bez-paniky-prohlizec.mjs   → ../prijimacky-bez-paniky/prohlizec.json + snímky + export.ics
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, kontrolaStranky, XSS } from './prohlizec-lib.mjs';
import * as R from './prijimacky-bez-paniky-prepocet.mjs';

const REPO = '/tmp/revize/repos/prijimacky-bez-paniky';
const VYSTUP = new URL('../prijimacky-bez-paniky/', import.meta.url).pathname;
const DL = '/tmp/revize/scratch/prijimacky-bez-paniky/download';
fs.mkdirSync(VYSTUP, { recursive: true });
fs.mkdirSync(DL, { recursive: true });
const M = await import(`${REPO}/matching.js`);
const S = await import(`${REPO}/strategy.js`);
const { SCENARIOS, EXPECTED } = await import(`${REPO}/scenarios.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));

const cekej = ms => new Promise(r => setTimeout(r, ms));
const vysledek = { datum: new Date().toISOString(), commit: 'e9dd0d3', behy: [] };

const ctiSim = page => page.evaluate(() => ({
  label: document.querySelector('#round-label').textContent,
  chyba: document.querySelector('#sim-error').hidden ? null : document.querySelector('#sim-error').textContent,
  vysledky: [...document.querySelectorAll('#final .result')].map(li => li.querySelector('p').textContent),
  kol: document.querySelectorAll('#round-log .round').length,
  krokDisabled: document.querySelector('#btn-step').disabled,
  prehratDisabled: document.querySelector('#btn-play').disabled,
  prehratText: document.querySelector('#btn-play').textContent,
  skoly: [...document.querySelectorAll('#board .col:not(.pool) h3')].map(h => h.textContent),
  sloupce: [...document.querySelectorAll('#board .col:not(.pool)')].map(c => [...c.querySelectorAll('.slots')[0].querySelectorAll('.pupil, .slot-empty')].map(p => p.textContent)),
}));
const parsujVysledky = list => Object.fromEntries(list.map(t => {
  const m = /^(.*) \((-?[\d.,]+) b\.\): (?:přijat\(a\) – (.*)|v 1\. kole nepřijat\(a\))$/.exec(t);
  return m ? [m[1], m[3] ?? null] : [t, '???'];
}));
const nastavVstup = (page, sel, v) => page.evaluate((s, val) => { const el = document.querySelector(s); el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, sel, String(v));
const klikni = async (page, sel) => { await page.click(sel); await cekej(120); };
const klikniAria = async (page, label) => { await page.evaluate(l => document.querySelector(`button[aria-label="${l}"]`).click(), label); await cekej(120); };
/** Uchazeč i: nastaví body (1. číselné pole), priority (selecty) a jméno. */
async function upravUchazece(page, i, { jmeno, body, priority, tiebreak }) {
  await page.evaluate(({ i, jmeno, body, priority, tiebreak }) => {
    const card = document.querySelectorAll('#applicants-edit .card')[i];
    const fire = el => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (jmeno != null) { const el = card.querySelector('input[type=text]'); el.value = jmeno; fire(el); }
    const nums = card.querySelectorAll('input[type=number]');
    if (body != null) { nums[0].value = String(body); fire(nums[0]); }
    if (tiebreak != null) { const el = nums[nums.length - 1]; el.value = String(tiebreak); fire(el); }
    if (priority) card.querySelectorAll('select').forEach((sel, k) => { if (priority[k] !== undefined) { sel.value = priority[k]; fire(sel); } });
  }, { i, jmeno, body, priority, tiebreak });
  await cekej(80);
}
async function upravSkolu(page, i, { jmeno, kapacita }) {
  await page.evaluate(({ i, jmeno, kapacita }) => {
    const card = document.querySelectorAll('#schools-edit .card')[i];
    const fire = el => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); };
    if (kapacita != null) { const el = card.querySelector('input[type=number]'); el.value = String(kapacita); fire(el); }
    if (jmeno != null) { const el = card.querySelector('input[type=text]'); el.value = jmeno; fire(el); }
  }, { i, jmeno, kapacita });
  await cekej(80);
}
async function dohrajKroky(page, max = 12) {
  for (let k = 0; k < max; k++) {
    const s = await ctiSim(page);
    if (s.label.startsWith('Hotovo') || s.krokDisabled) return s;
    await klikni(page, '#btn-step');
  }
  return ctiSim(page);
}
async function cekejNaHotovo(page, ms = 20000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const s = await ctiSim(page); if (s.label.startsWith('Hotovo')) return s; await cekej(200); }
  return ctiSim(page);
}
const ctiStrategii = page => page.evaluate(() => ({
  radky: [...document.querySelectorAll('#strategy-out .verdict')].map(v => v.textContent.replace(/\s+/g, ' ').trim()),
  hlasky: [...document.querySelectorAll('#strategy-out .warn, #strategy-out .info')].map(p => p.textContent),
}));
async function napis(page, sel, text) {
  await page.$eval(sel, el => { el.value = ''; el.dispatchEvent(new Event('input', { bubbles: true })); });
  await page.focus(sel);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control'); await page.keyboard.press('Backspace');
  if (text !== '') await page.keyboard.type(text, { delay: 10 });
  await cekej(100);
  return page.$eval(sel, el => ({ value: el.value, valid: el.validity.valid, badInput: el.validity.badInput, rangeOverflow: el.validity.rangeOverflow, stepMismatch: el.validity.stepMismatch }));
}

async function beh(cislo, { snimky }) {
  const srv = await spustServer(REPO);
  const b = { cislo, pripady: {} };
  const otevri = async (sirka, vyska, lang) => {
    const p = await otevriProhlizec({ sirka, vyska, lang });
    await p.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await cekej(300);
    return p;
  };
  const snimek = (page, nazev) => (snimky ? page.screenshot({ path: path.join(VYSTUP, nazev), fullPage: true }) : null);

  // ---------- A) zadání Z3 zadané do formuláře: X 90 (B,A), Z 85 (B,A), Y 80 (A); kapacity 1 ----------
  for (const [sirka, vyska, jmenoSnimku] of [[360, 800, 'vysledek-360.png'], [1440, 900, 'vysledek-1440.png']]) {
    const p = await otevri(sirka, vyska);
    await klikni(p.page, '[data-scenario="body"]');
    await klikniAria(p.page, 'Odebrat školu Obchodní akademie');
    await upravSkolu(p.page, 0, { kapacita: 1 });           // Gymnázium = A, kapacita 1 (Průmyslovka = B má 1)
    for (const n of ['Filip', 'Eva', 'Dana']) await klikniAria(p.page, `Odebrat uchazeče ${n}`);
    await upravUchazece(p.page, 0, { jmeno: 'X', body: 90, priority: ['P', 'G', ''] });
    await upravUchazece(p.page, 1, { jmeno: 'Z', body: 85, priority: ['P', 'G', ''] });
    await upravUchazece(p.page, 2, { jmeno: 'Y', body: 80, priority: ['G', '', ''] });
    const pred = await ctiSim(p.page);
    const po = await dohrajKroky(p.page);
    const ui = parsujVysledky(po.vysledky);
    const vstup = [{ id: 'a1', name: 'X', score: 90, priorities: ['P', 'G'] }, { id: 'a2', name: 'Z', score: 85, priorities: ['P', 'G'] }, { id: 'a3', name: 'Y', score: 80, priorities: ['G'] }];
    const skoly = [{ id: 'G', name: 'Gymnázium', capacity: 1 }, { id: 'P', name: 'Průmyslovka', capacity: 1 }];
    const jm = sid => skoly.find(s => s.id === sid)?.name ?? null;
    const modul = Object.fromEntries(Object.entries(M.deferredAcceptance(vstup, skoly).assignment).map(([id, sid]) => [vstup.find(a => a.id === id).name, jm(sid)]));
    const muj = Object.fromEntries(Object.entries(R.odlozenePrijeti(vstup, skoly).assignment).map(([id, sid]) => [vstup.find(a => a.id === id).name, jm(sid)]));
    const kl = { pred, po, ui, modul, muj, shodaUiModul: R.stejne(ui, modul), shodaUiMuj: R.stejne(ui, muj), preteka: await preteka(p.page), konzole: p.zaznam.konzole, chyby: p.zaznam.chyby, cizi: p.zaznam.sit.filter(r => !r.url.startsWith(srv.url)).map(r => r.url) };
    if (sirka === 360) kl.axe = await axe(p.page);
    await snimek(p.page, jmenoSnimku);
    // Reset vrátí na začátek; Přehrát dojede do konce
    await klikni(p.page, '#btn-reset');
    kl.poResetu = await ctiSim(p.page);
    if (sirka === 360) {
      await klikni(p.page, '#btn-play');
      const t0 = Date.now();
      kl.prehrat = await cekejNaHotovo(p.page);
      kl.prehratTrvaniMs = Date.now() - t0;
      kl.prehratShoda = R.stejne(parsujVysledky(kl.prehrat.vysledky), modul);
      // klávesnice: fokus na Krok a Enter
      await klikni(p.page, '#btn-reset');
      await p.page.focus('#btn-step'); await p.page.keyboard.press('Enter'); await cekej(150);
      kl.klavesniceKrok = (await ctiSim(p.page)).label;
      // zamíchání pořadí v tabulce
      await klikni(p.page, '#shuffle');
      kl.zamichani = await p.page.$eval('#shuffle-note', el => el.textContent);
    }
    b.pripady[`A_Z3_${sirka}`] = kl;
    await p.zavri();
  }

  // ---------- B) scénář „Lepší výsledek ze dvou pokusů“ (zadání: 30/35 + 28/20 = 63) ----------
  {
    const p = await otevri(360, 800);
    await klikni(p.page, '[data-scenario="pokusy"]');
    const zapocte = await p.page.$$eval('#applicants-edit .card', cards => cards.map(c => ({ jmeno: c.querySelector('input[type=text]').value, pokusy: [...c.querySelectorAll('.att input')].map(i => i.value), zapocte: c.querySelector('.best')?.textContent })));
    const rezim = await p.page.$eval('#mode-attempts', el => el.checked);
    await klikni(p.page, '#btn-play');
    const po = await cekejNaHotovo(p.page);
    const ui = parsujVysledky(po.vysledky);
    const sc = SCENARIOS.find(s => s.id === 'pokusy');
    const jm = sid => sc.schools.find(s => s.id === sid)?.name ?? null;
    const modul = Object.fromEntries(Object.entries(M.deferredAcceptance(sc.applicants, sc.schools).assignment).map(([id, sid]) => [sc.applicants.find(a => a.id === id).name, jm(sid)]));
    const muj = Object.fromEntries(Object.entries(R.odlozenePrijeti(sc.applicants, sc.schools).assignment).map(([id, sid]) => [sc.applicants.find(a => a.id === id).name, jm(sid)]));
    b.pripady.B_pokusy = { rezimPokusy: rezim, zapocte, zuzka63: zapocte.find(z => z.jmeno === 'Zuzka')?.zapocte === 'Započte se: 63 b.', po, ui, modul, muj, shodaUiModul: R.stejne(ui, modul), shodaUiMuj: R.stejne(ui, muj), shodaExpected: R.stejne(M.deferredAcceptance(sc.applicants, sc.schools).assignment, EXPECTED.pokusy), preteka: await preteka(p.page), konzole: p.zaznam.konzole };
    await snimek(p.page, 'pokusy-360.png');
    // přepnutí zpět na body: body = lepší ze dvou
    await klikni(p.page, '#mode-attempts');
    b.pripady.B_pokusy.poPrepnutiNaBody = await p.page.$$eval('#applicants-edit .card', cards => cards.map(c => ({ jmeno: c.querySelector('input[type=text]').value, body: c.querySelector('input[type=number]').value })));
    await p.zavri();
  }

  // ---------- C) shoda bodů → chybový stav; rozhodovací kritérium ji vyřeší ----------
  {
    const p = await otevri(360, 800);
    await klikni(p.page, '[data-scenario="body"]');
    await upravUchazece(p.page, 1, { body: 85 }); // Bára 85 = Cyril 85, oba mají G
    const chyba = await ctiSim(p.page);
    let modulChyba = null;
    try { M.deferredAcceptance([{ id: 'a2', score: 85, priorities: ['G'] }, { id: 'a3', score: 85, priorities: ['G'] }], [{ id: 'G', capacity: 2 }]); } catch (e) { modulChyba = `${e.name}: ${e.message}`; }
    await snimek(p.page, 'chyba-360.png');
    await upravUchazece(p.page, 1, { tiebreak: 1 });
    await upravUchazece(p.page, 2, { tiebreak: 0 });
    const poKriteriu = await dohrajKroky(p.page);
    b.pripady.C_shoda = { chyba, modulChyba, chybaZobrazena: !!chyba.chyba, tlacitkaVypnuta: chyba.krokDisabled && chyba.prehratDisabled, poKriteriu: { chyba: poKriteriu.chyba, ui: parsujVysledky(poKriteriu.vysledky) }, preteka: await preteka(p.page), konzole: p.zaznam.konzole };
    // záporné / prázdné / nad maximum body v simulátoru (bez kontroly validity?)
    await klikni(p.page, '[data-scenario="body"]');
    const z = {};
    for (const [n, v] of [['prazdne', ''], ['zaporne', '-10'], ['nad100', '150'], ['desetinne', '85.5']]) {
      await upravUchazece(p.page, 0, { body: v });
      const s = await ctiSim(p.page);
      z[n] = { chyba: s.chyba, adamVPoolu: s.sloupce.flat().concat(await p.page.$$eval('#board .pool .pupil', els => els.map(e => e.textContent))).filter(t => t.startsWith('Adam')), validita: await p.page.$eval('#applicants-edit .card input[type=number]', el => ({ valid: el.validity.valid, rangeOverflow: el.validity.rangeOverflow, rangeUnderflow: el.validity.rangeUnderflow })) };
    }
    b.pripady.C_shoda.nesmyslneBody = z;
    await p.zavri();
  }

  // ---------- D) XSS ve jménech uchazeče a školy až v průběhu (výsledek, log kol) a ve strategii ----------
  {
    const p = await otevri(360, 800);
    await klikni(p.page, '[data-scenario="body"]');
    await upravSkolu(p.page, 0, { jmeno: XSS });
    await upravUchazece(p.page, 0, { jmeno: XSS });
    await dohrajKroky(p.page);
    await nastavVstup(p.page, '[name=name0]', XSS); await nastavVstup(p.page, '#exp', '60'); await nastavVstup(p.page, '[name=min0]', '50');
    await cekej(400);
    b.pripady.D_xss = { vlozenyImg: await p.page.evaluate(() => !!document.querySelector('img[src="x"]')), dialogy: p.zaznam.dialogy, textVeVysledku: await p.page.evaluate(() => [...document.querySelectorAll('#final .result p strong')].map(e => e.textContent).find(t => t.includes('<img')) ?? null), textVeStrategii: await p.page.$eval('#strategy-out', el => el.textContent.includes('<img src=x')), konzole: p.zaznam.konzole };
    await p.zavri();
  }

  // ---------- E) Moje strategie: 60 b.; Gympl 75, Průmyslovka 62, Obchodka 58 ----------
  {
    const p = await otevri(360, 800);
    await nastavVstup(p.page, '#exp', '60');
    const pouzeBody = await ctiStrategii(p.page);
    for (const [i, [n, m]] of [['Gympl', 75], ['Průmyslovka', 62], ['Obchodka', 58]].entries()) { await nastavVstup(p.page, `[name=name${i}]`, n); await nastavVstup(p.page, `[name=min${i}]`, m); }
    await cekej(200);
    const ui = await ctiStrategii(p.page);
    const modul = S.evaluateStrategy({ expected: 60, margin: 5, schools: [{ name: 'Gympl', lastMin: 75 }, { name: 'Průmyslovka', lastMin: 62 }, { name: 'Obchodka', lastMin: 58 }] });
    const muj = R.strategie({ expected: 60, schools: [{ lastMin: 75 }, { lastMin: 62 }, { lastMin: 58 }] });
    const stitky = ui.radky.map(r => /(Spíš jistota|Těsné|Riziko|Chybí údaje)$/.exec(r)?.[1]);
    const mapa = { jistota: 'Spíš jistota', tesne: 'Těsné', riziko: 'Riziko', nevim: 'Chybí údaje' };
    b.pripady.E_strategie = { pouzeBody, ui, modulKategorie: modul.schools.map(s => mapa[s.category]), mujKategorie: muj.rows.map(r => mapa[r.category]), shodaUiModul: JSON.stringify(stitky) === JSON.stringify(modul.schools.map(s => mapa[s.category])), shodaUiMuj: JSON.stringify(stitky) === JSON.stringify(muj.rows.map(r => mapa[r.category])), varovaniNoSafe: ui.hlasky.some(h => h.startsWith('Žádná škola nemá rezervu')), modulNoSafe: modul.warnings.some(w => w.id === 'no-safe'), mujNoSafe: muj.noSafe, preteka: await preteka(p.page), konzole: p.zaznam.konzole };
    b.pripady.E_strategie.axe = await axe(p.page);
    await snimek(p.page, 'strategie-360.png');
    // rezerva 10 → Obchodka (rozdíl 2) zůstává těsná; Gympl 50 → jistota
    await nastavVstup(p.page, '#margin', '10'); await nastavVstup(p.page, '[name=min0]', '50'); await cekej(150);
    b.pripady.E_strategie.rezerva10 = await ctiStrategii(p.page);
    await p.zavri();
  }

  // ---------- F) český zápis čísel: desetinná čárka a mezera, cs-CZ vs en-US ----------
  for (const lang of ['cs-CZ', 'en-US']) {
    const p = await otevri(360, 800, lang);
    const f = {};
    await nastavVstup(p.page, '[name=name0]', 'A'); await nastavVstup(p.page, '[name=min0]', '60');
    for (const [n, t] of [['62,5', '62,5'], ['62.5', '62.5'], ['1 500', '1 500'], ['150', '150'], ['-5', '-5'], ['abc', 'abc'], ['prazdne', '']]) {
      const pole = await napis(p.page, '#exp', t);
      f[n] = { pole, ui: await ctiStrategii(p.page) };
    }
    // simulátor: body 85,5 u Adama
    await klikni(p.page, '[data-scenario="body"]');
    const poleSim = await napis(p.page, '#applicants-edit .card input[type=number]', '85,5');
    f.simulator_85_5 = { pole: poleSim, adam: await p.page.$$eval('#board .pupil', els => els.map(e => e.textContent).filter(t => t.startsWith('Adam'))) };
    b.pripady[`F_cisla_${lang}`] = f;
    await p.zavri();
  }

  // ---------- G) export .ics – skutečné stažení ----------
  {
    const p = await otevri(360, 800);
    for (const f of fs.readdirSync(DL)) fs.unlinkSync(path.join(DL, f));
    const client = await p.page.createCDPSession();
    await client.send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: DL });
    await p.page.waitForFunction(() => !document.querySelector('#ics-btn').disabled, { timeout: 10000 });
    await klikni(p.page, '#g-vg'); await klikni(p.page, '#g-kons');
    const pocetVKalendari = await p.page.$$eval('#calendar .event', e => e.length);
    await klikni(p.page, '#ics-btn');
    let soubor = null;
    for (let i = 0; i < 50 && !soubor; i++) { await cekej(200); soubor = fs.readdirSync(DL).find(f => f.endsWith('.ics')); }
    const g = { pocetVKalendari, soubor, cizi: p.zaznam.sit.filter(r => !r.url.startsWith(srv.url)).map(r => r.url), odeslano: p.zaznam.sit.filter(r => r.metoda !== 'GET').length };
    if (soubor) {
      const text = fs.readFileSync(path.join(DL, soubor), 'utf8');
      if (snimky) fs.writeFileSync(path.join(VYSTUP, 'export.ics'), text);
      const k = R.zkontrolujICS(text);
      g.kontrolaRFC = { chyby: k.chyby, pocetUdalosti: k.pocetUdalosti, ocekavanoUdalosti: rules.events.filter(e => e.status !== 'unverified').length };
      g.crlf = !/[^\r]\n/.test(text) && text.endsWith('\r\n');
      g.hlavicka = text.split('\r\n').slice(0, 6);
      g.prvniUdalost = k.events[0] && Object.fromEntries(Object.entries(k.events[0]).map(([n, v]) => [n, (v.params.length ? v.params.join(';') + ':' : '') + v.value]));
      g.dtendDenPoKonci = k.events.every(e => { const id = e.UID.value.replace('@prijimacky-bez-paniky', '').replace(/-2027$/, ''); const r = rules.events.find(x => x.id === id); return r && e.DTSTART.value === r.start.replace(/-/g, '') && e.DTEND.value === R.dalsiDen(r.end ?? r.start).replace(/-/g, ''); });
      g.bajtu = Buffer.byteLength(text);
    }
    b.pripady.G_ics = g;
    await p.zavri();
  }

  // ---------- H) klávesnice: Tab projde editor simulátoru, fokus viditelný; zaškrtnutí seznamu se neukládá ----------
  {
    const p = await otevri(360, 800);
    await p.page.$eval('.checklist input', el => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
    await p.page.reload({ waitUntil: 'networkidle0' });
    b.pripady.H_ulozeni = { checklistPoReloadu: await p.page.$eval('.checklist input', el => el.checked), localStorage: await p.page.evaluate(() => localStorage.length), sessionStorage: await p.page.evaluate(() => sessionStorage.length), cookies: (await p.page.cookies()).length };
    await p.zavri();
  }

  await srv.zavri();
  return b;
}

vysledek.behy.push(await beh(1, { snimky: true }));
vysledek.behy.push(await beh(2, { snimky: false }));

// ---------- živý web ----------
try {
  const z = await kontrolaStranky({ url: 'https://frankie851.github.io/prijimacky-bez-paniky/', vystup: VYSTUP, nazev: 'zivy' });
  vysledek.zivyWeb = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, { preteka: v.preteka, cizi: v.ciziPozadavky.map(r => r.url), konzole: v.konzole, chyby: v.chyby, axe: v.axe, xss: v.xss, localStorage: v.localStorage, pozadavku: v.sit.length }]));
} catch (e) { vysledek.zivyWeb = { chyba: String(e) }; }

// ---------- shrnutí reprodukce 2× ----------
const [b1, b2] = vysledek.behy;
vysledek.shrnuti = {
  A_Z3_ui_modul_beh1: b1.pripady.A_Z3_360.shodaUiModul, A_Z3_ui_modul_beh2: b2.pripady.A_Z3_360.shodaUiModul,
  A_Z3_ui: b1.pripady.A_Z3_360.ui, A_Z3_prehrat: b1.pripady.A_Z3_360.prehratShoda && b2.pripady.A_Z3_360.prehratShoda,
  B_pokusy_ui_modul: b1.pripady.B_pokusy.shodaUiModul && b2.pripady.B_pokusy.shodaUiModul, B_zuzka63: b1.pripady.B_pokusy.zuzka63 && b2.pripady.B_pokusy.zuzka63,
  C_chyba_zobrazena: b1.pripady.C_shoda.chybaZobrazena && b2.pripady.C_shoda.chybaZobrazena,
  D_xss_img: b1.pripady.D_xss.vlozenyImg || b2.pripady.D_xss.vlozenyImg, D_dialogy: b1.pripady.D_xss.dialogy.length + b2.pripady.D_xss.dialogy.length,
  E_strategie_ui_modul: b1.pripady.E_strategie.shodaUiModul && b2.pripady.E_strategie.shodaUiModul,
  F_cs_62_5: b1.pripady['F_cisla_cs-CZ']['62,5'].pole, F_en_62_5: b1.pripady['F_cisla_en-US']['62,5'].pole,
  G_ics_chyb: [b1.pripady.G_ics.kontrolaRFC?.chyby.length, b2.pripady.G_ics.kontrolaRFC?.chyby.length],
  preteka360: [b1.pripady.A_Z3_360.preteka.preteka, b1.pripady.B_pokusy.preteka.preteka, b1.pripady.C_shoda.preteka.preteka, b1.pripady.E_strategie.preteka.preteka],
  axeSeriousCritical: [...(b1.pripady.A_Z3_360.axe ?? []), ...(b1.pripady.E_strategie.axe ?? [])].filter(a => ['serious', 'critical'].includes(a.dopad)).map(a => a.id),
};
fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek.shrnuti, null, 1));
console.log('zapsáno', path.join(VYSTUP, 'prohlizec.json'));
