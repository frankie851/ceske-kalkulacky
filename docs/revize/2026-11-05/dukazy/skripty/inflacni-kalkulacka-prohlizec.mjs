// Prohlížečové scénáře pro revizi Inflační kalkulačky (5. 11. 2026): vyplnění formulářů všech tří nástrojů,
// čtení výsledků a porovnání s modulem inflation.js, český zápis čísel (cs-CZ i en-US), chybové stavy,
// měsíc bez dat, prohození měsíců, graf a tabulka, klávesnice, axe (světlý i tmavý režim), XSS, živý web.
// Spuštění: node inflacni-kalkulacka-prohlizec.mjs [1|2]   (1 = se snímky a živým webem; výstup ../inflacni-kalkulacka/prohlizec.json)
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, kontrolaStranky, zkusXss, localStorageDump } from './prohlizec-lib.mjs';

const REPO = '/tmp/revize/repos/inflacni-kalkulacka';
const LIVE = 'https://frankie851.github.io/inflacni-kalkulacka/';
const VYSTUP = new URL('../inflacni-kalkulacka/', import.meta.url).pathname;
const beh = Number(process.argv[2] ?? 1);
const snimky = beh === 1;
const inf = await import(`${REPO}/inflation.js`);
const series = inf.createSeries(JSON.parse(fs.readFileSync(`${REPO}/data/cpi.json`, 'utf8')));
const I = (m) => series.index(m);
const kc = (v) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: Math.abs(v) >= 100 ? 0 : 2 }).format(v);
const pct = (v, d = 1, s = false) => new Intl.NumberFormat('cs-CZ', { style: 'percent', minimumFractionDigits: d, maximumFractionDigits: d, signDisplay: s ? 'exceptZero' : 'auto' }).format(v);
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));

const cti = (page, tool) => page.evaluate((t) => {
  const p = document.querySelector(`#panel-${t}`);
  const q = (s) => p.querySelector(s);
  return {
    hodnota: q('[data-out="value"]').textContent.trim(), tridaHodnoty: q('[data-out="value"]').className,
    text: q('[data-out="text"]').textContent.trim(),
    poznamka: q('[data-out="note"]').hidden ? null : q('[data-out="note"]').textContent.trim(),
    panelSkryty: p.hidden, posledniData: document.querySelector('#last-data')?.textContent,
    aktivniZalozka: document.querySelector('[role="tab"][aria-selected="true"]')?.id, hash: location.hash,
  };
}, tool);
async function napis(page, tool, name, text) {
  const sel = `form[data-tool="${tool}"] [name="${name}"]`;
  await page.focus(sel);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (text !== '') await page.keyboard.type(text, { delay: 5 });
  await cekej(150);
}
const nastavMesic = (page, tool, key, m) => page.evaluate((t, k, mes) => {
  const fs_ = document.querySelector(`form[data-tool="${t}"] [data-month="${k}"]`);
  const [mSel, ySel] = fs_.querySelectorAll('select');
  ySel.value = mes.slice(0, 4); mSel.value = mes.slice(5);
  mSel.dispatchEvent(new Event('change', { bubbles: true }));
  return { mesic: mSel.value, rok: ySel.value, roky: [ySel.options[0].value, ySel.options[ySel.options.length - 1].value], pocetMesicu: mSel.options.length };
}, tool, key, m).then(async (r) => { await cekej(120); return r; });
const vyberTyp = (page, v) => page.evaluate((x) => { const s = document.querySelector('select[name="rateType"]'); s.value = x; s.dispatchEvent(new Event('change', { bubbles: true })); }, v).then(() => cekej(120));
const zalozka = async (page, tool) => { await page.click(`#tab-${tool}`); await cekej(200); };
const grafInfo = (page) => page.evaluate(() => {
  if (!window.Chart) return { chart: false };
  const y = Chart.getChart(document.getElementById('chart-yoy')), l = Chart.getChart(document.getElementById('chart-level'));
  const d = y.data.datasets[0].data;
  return { chart: true, n: y.data.labels.length, prvniPopisek: y.data.labels[0], posledniPopisek: y.data.labels.at(-1), posledniYoy: d.at(-1), nullu: d.filter((x) => x === null).length, hladinaPrvni: l.data.datasets[0].data[0], hladinaPosledni: l.data.datasets[0].data.at(-1), podtitulky: [...document.querySelectorAll('.chart-sub')].map((e) => e.textContent) };
});
const tabulka = (page) => page.evaluate(() => { document.querySelector('details.table-view').open = true; const tr = document.querySelector('#data-table tr'); return { radku: document.querySelectorAll('#data-table tr').length, prvniRadek: [...tr.children].map((td) => td.textContent) }; });

const vysledek = { beh, datum: new Date().toISOString(), pripady: {}, kontroly: {} };
const Z = (k, v) => { vysledek.pripady[k] = v; };

const srv = await spustServer(REPO);
// ---------- 360 px, cs-CZ ----------
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  const { page } = b;
  await page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
  // V1 výchozí stav: 10 000 Kč, leden 2005 → září 2026
  const v1 = inf.convert(10000, I('2005-01'), I('2026-09'));
  Z('V1_vychozi', { ui: await cti(page, 'convert'), modul: { hodnota: kc(v1), cenyO: pct(inf.cumulativeInflation(I('2005-01'), I('2026-09'))), prumerne: pct(inf.annualizedInflation(I('2005-01'), I('2026-09'), 260)) }, graf: await grafInfo(page), tabulka: await tabulka(page) });
  if (snimky) await page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
  vysledek.kontroly.preteka360_convert = await preteka(page);
  vysledek.kontroly.axe360_convert = await axe(page);
  // rozsah výběru měsíce/roku
  vysledek.kontroly.vyberObdobi = await page.evaluate(() => { const [m, y] = document.querySelectorAll('form[data-tool="convert"] [data-month="from"] select'); return { mesicu: m.options.length, roky: `${y.options[0].value} … ${y.options[y.options.length - 1].value}` }; });
  // parsování čísel
  for (const [k, t] of [['P1_1 500', '1 500'], ['P2_1500,50', '1500,50'], ['P3_10.000', '10.000'], ['P4_prazdne', ''], ['P5_-5', '-5'], ['P6_abc', 'abc']]) {
    await napis(page, 'convert', 'amount', t);
    Z(k, { vstup: t, ui: await cti(page, 'convert') });
  }
  if (snimky) await page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
  vysledek.kontroly.preteka360_chyba = await preteka(page);
  // V3: 100 Kč, září 2025 → září 2026 (ČSÚ meziročně 2,5 %)
  await napis(page, 'convert', 'amount', '100');
  await nastavMesic(page, 'convert', 'from', '2025-09'); await nastavMesic(page, 'convert', 'to', '2026-09');
  Z('V3_zari2025_zari2026', { ui: await cti(page, 'convert'), modul: { hodnota: kc(inf.convert(100, I('2025-09'), I('2026-09'))), cenyO: pct(inf.cumulativeInflation(I('2025-09'), I('2026-09'))) }, graf: await grafInfo(page), tabulka: await tabulka(page) });
  // D1: prosinec 2026 – bez dat
  const d1 = await nastavMesic(page, 'convert', 'to', '2026-12');
  Z('D1_prosinec2026', { vyber: d1, ui: await cti(page, 'convert'), modul: { hodnota: kc(inf.convert(100, I('2025-09'), I('2026-09'))) } });
  // V2: prohození (obrácený přepočet)
  await napis(page, 'convert', 'amount', '10 000');
  await nastavMesic(page, 'convert', 'from', '2005-01'); await nastavMesic(page, 'convert', 'to', '2026-09');
  await page.click('form[data-tool="convert"] [data-swap]'); await cekej(200);
  Z('V2_prohozeni', { ui: await cti(page, 'convert'), modul: { hodnota: kc(inf.convert(10000, I('2026-09'), I('2005-01'))) }, vybraneMesice: await page.evaluate(() => [...document.querySelectorAll('form[data-tool="convert"] select')].map((s) => s.value)) });
  // klávesnice na záložkách
  await page.focus('#tab-convert'); await page.keyboard.press('ArrowRight'); await cekej(150);
  vysledek.kontroly.sipkaNaZalozce = await page.evaluate(() => ({ aktivni: document.activeElement?.id, vybrana: document.querySelector('[role="tab"][aria-selected="true"]')?.id, panelReturnViditelny: !document.querySelector('#panel-return').hidden }));
  // ---- Reálný výnos ----
  await zalozka(page, 'return');
  const r1n = inf.nominalForPeriod(0.04, 60), r1i = inf.cumulativeInflation(I('2021-09'), I('2026-09')), r1 = inf.realReturn(r1n, r1i);
  Z('R1_vychozi', { ui: await cti(page, 'return'), modul: { hodnota: `${pct(inf.annualize(r1, 60), 2, true)} ročně`, nominalne: pct(r1n), ceny: pct(r1i), realne: pct(r1, 1, true) } });
  if (snimky) await page.screenshot({ path: path.join(VYSTUP, 'vynos-360.png'), fullPage: true });
  vysledek.kontroly.preteka360_return = await preteka(page);
  await vyberTyp(page, 'total'); await napis(page, 'return', 'rate', '10');
  await nastavMesic(page, 'return', 'from', '2025-09'); await nastavMesic(page, 'return', 'to', '2026-09');
  const r2 = inf.realReturn(0.10, inf.cumulativeInflation(I('2025-09'), I('2026-09')));
  Z('R2_10pct_celkem', { ui: await cti(page, 'return'), modul: { hodnota: `${pct(r2, 2, true)} za období` } });
  await napis(page, 'return', 'rate', '3,5');
  Z('R2b_3,5_carka', { ui: await cti(page, 'return'), modul: { hodnota: `${pct(inf.realReturn(0.035, inf.cumulativeInflation(I('2025-09'), I('2026-09'))), 2, true)} za období` } });
  await napis(page, 'return', 'rate', '-100');
  Z('R7_minus100', { ui: await cti(page, 'return') });
  await napis(page, 'return', 'rate', '4'); await nastavMesic(page, 'return', 'from', '2026-09'); await nastavMesic(page, 'return', 'to', '2025-09');
  Z('R8_obdobi_obracene', { ui: await cti(page, 'return') });
  // ---- Reálná mzda ----
  await zalozka(page, 'wage');
  const m1 = inf.realWageChange(30000, 45000, I('2016-09'), I('2026-09'));
  Z('M1_vychozi', { ui: await cti(page, 'wage'), modul: { hodnota: pct(m1, 2, true), stacilo: kc(inf.convert(30000, I('2016-09'), I('2026-09'))) } });
  if (snimky) await page.screenshot({ path: path.join(VYSTUP, 'mzda-360.png'), fullPage: true });
  vysledek.kontroly.preteka360_wage = await preteka(page);
  vysledek.kontroly.axe360_wage = await axe(page);
  await napis(page, 'wage', 'wageThen', '40 000'); await napis(page, 'wage', 'wageNow', '50 000');
  await nastavMesic(page, 'wage', 'from', '2025-09'); await nastavMesic(page, 'wage', 'to', '2026-09');
  const m2 = inf.realWageChange(40000, 50000, I('2025-09'), I('2026-09'));
  Z('M2_40000_50000', { ui: await cti(page, 'wage'), modul: { hodnota: pct(m2, 2, true), stacilo: kc(inf.convert(40000, I('2025-09'), I('2026-09'))) } });
  await napis(page, 'wage', 'wageThen', '0');
  Z('M5_mzda0', { ui: await cti(page, 'wage') });
  // XSS do všech polí (včetně skrytých panelů) + dialogy
  vysledek.kontroly.xss = { ...(await zkusXss(page)), dialogy: b.zaznam.dialogy, textPoXss: await cti(page, 'wage') };
  vysledek.kontroly.localStorage = await localStorageDump(page);
  vysledek.kontroly.sit360 = { pozadavky: b.zaznam.sit.map((r) => r.url), cizi: b.zaznam.sit.filter((r) => !r.url.startsWith(srv.url)).map((r) => r.url), konzole: b.zaznam.konzole, chyby: b.zaznam.chyby };
  await b.zavri();
}
// ---------- 1440 px ----------
{
  const b = await otevriProhlizec({ sirka: 1440, vyska: 900 });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
  Z('V1_1440', { ui: await cti(b.page, 'convert') });
  if (snimky) await b.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
  vysledek.kontroly.preteka1440 = await preteka(b.page);
  await zalozka(b.page, 'return'); vysledek.kontroly.preteka1440_return = await preteka(b.page);
  await zalozka(b.page, 'wage'); vysledek.kontroly.preteka1440_wage = await preteka(b.page);
  await b.zavri();
}
// ---------- en-US: desetinná čárka ----------
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800, lang: 'en-US' });
  await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
  await napis(b.page, 'convert', 'amount', '1500,50');
  Z('P2_enUS_1500,50', { ui: await cti(b.page, 'convert'), modul: { hodnota: kc(inf.convert(1500.5, I('2005-01'), I('2026-09'))) }, typPole: await b.page.$eval('[name="amount"]', (e) => e.type) });
  await zalozka(b.page, 'return'); await napis(b.page, 'return', 'rate', '3,5');
  Z('R_enUS_3,5', { ui: await cti(b.page, 'return'), hodnotaPole: await b.page.$eval('[name="rate"]', (e) => e.value) });
  await b.zavri();
}
// ---------- tmavý režim: axe ----------
{
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'dark' }]);
  await b.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
  vysledek.kontroly.axe360_dark = await axe(b.page);
  vysledek.kontroly.barvyZalozky = await b.page.evaluate(() => { const cs = getComputedStyle(document.querySelector('#tab-convert')); return { pozadi: cs.backgroundColor, pismo: cs.color, velikost: cs.fontSize, tloustka: cs.fontWeight }; });
  await b.zavri();
}
await srv.zavri();
// ---------- živý web (jen 1. běh) ----------
if (beh === 1) {
  const z = await kontrolaStranky({ url: LIVE, vystup: VYSTUP, nazev: 'zivy' });
  vysledek.zivyWeb = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, { preteka: v.preteka, konzole: v.konzole, chyby: v.chyby, cizi: [...new Set(v.ciziPozadavky.map((r) => r.url))], axe: v.axe, xss: v.xss, localStorage: v.localStorage }]));
  const b = await otevriProhlizec({ sirka: 360, vyska: 800 });
  await b.page.goto(LIVE, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
  vysledek.zivyWeb.vychoziVysledek = await cti(b.page, 'convert');
  await b.zavri();
}
const soubor = path.join(VYSTUP, 'prohlizec.json');
const vse = fs.existsSync(soubor) && beh > 1 ? JSON.parse(fs.readFileSync(soubor, 'utf8')) : [];
vse.push(vysledek);
fs.writeFileSync(soubor, JSON.stringify(vse, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
