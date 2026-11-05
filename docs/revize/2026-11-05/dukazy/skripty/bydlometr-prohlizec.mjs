// Prohlížečové scénáře pro revizi Bydlometru (5. 11. 2026): vyplnění formulářů, čtení výsledků,
// porovnání s moduly mortgage.js/rentbuy.js, český zápis čísel (cs-CZ i en-US), chybové stavy,
// kalkulačka poplatku, XSS do polí skrytých záložek, fokus, axe ve stavu s výsledkem, živý web.
// Spuštění: node bydlometr-prohlizec.mjs            → ../bydlometr/prohlizec.json + snímky (1. běh) a 2. běh bez snímků
//           node bydlometr-prohlizec.mjs --zivy     → navíc kontrolaStranky živého webu (zivy-*.png, zivy-kontrola.json)
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, kontrolaStranky, localStorageDump, XSS } from './prohlizec-lib.mjs';

const REPO = '/tmp/revize/repos/bydlometr';
const VYSTUP = new URL('../bydlometr/', import.meta.url).pathname;
fs.mkdirSync(VYSTUP, { recursive: true });
const M = await import(`${REPO}/js/mortgage.js`);
const RB = await import(`${REPO}/js/rentbuy.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));
const kc = (n) => `${new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 0 }).format(Math.round(n))} Kč`;
const cekej = (ms) => new Promise((r) => setTimeout(r, ms));

async function napis(page, name, text) {
  const sel = `[name="${name}"]`;
  await page.focus(sel);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (String(text) !== '') await page.keyboard.type(String(text), { delay: 3 });
  await cekej(450);
}
const hodnota = (page, name) => page.$eval(`[name="${name}"]`, (el) => el.value);

const ctiRefix = (page) => page.evaluate(() => {
  const t = (s) => document.querySelector(s)?.textContent.trim() ?? null;
  const radky = [...document.querySelectorAll('#refix-table tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()).concat(tr.className));
  const stres = [...document.querySelectorAll('#stress-table tbody tr')].map((tr) => [...tr.children].map((c) => c.textContent.trim()));
  const err = document.querySelector('#refix-errors');
  return { summary: t('#refix-summary'), current: t('#refix-current'), radky, stres, chyba: err.hidden ? null : err.textContent.trim(), poznamky: [...document.querySelectorAll('#refix-notes li')].map((l) => l.textContent.trim()) };
});
const ctiFee = (page) => page.evaluate(() => ({ vysledek: document.querySelector('#fee-result').textContent.trim(), duvod: document.querySelector('#fee-reason').textContent.trim() }));
const ctiRb = (page) => page.evaluate(() => {
  const t = (s) => document.querySelector(s)?.textContent.trim() ?? null;
  const err = document.querySelector('#rb-errors');
  const sens = [...document.querySelectorAll('#sens-table tbody tr')].map((tr) => [...tr.children].map((c) => c.title || c.textContent.trim()));
  const posledni = document.querySelector('#rb-years tbody tr:last-child');
  const canvas = document.querySelector('#rb-chart');
  return {
    summary: t('#rb-summary'), chyba: err.hidden ? null : err.textContent.trim(),
    varovani: [...document.querySelectorAll('#rb-warnings p')].map((p) => p.textContent.trim()),
    kpi: [...document.querySelectorAll('#rb-kpis .kpi')].map((k) => `${k.querySelector('b').textContent} – ${k.querySelector('span').textContent}`),
    sens, posledniRok: posledni ? [...posledni.children].map((c) => c.textContent.trim()) : null,
    graf: { chartJs: typeof window.Chart !== 'undefined', canvasViditelny: !canvas.parentElement.hidden, fallback: !document.querySelector('#rb-chart-fallback').hidden, sirka: canvas.width, vyska: canvas.height },
    dan: document.querySelector('[name="propertyTaxYear"]').value, cena: document.querySelector('[name="pricePerM2"]').value, najem: document.querySelector('[name="rentPerM2"]').value,
  };
});
const fokusInfo = (page) => page.evaluate(() => {
  const el = document.activeElement; if (!el || el === document.body) return null;
  const cs = getComputedStyle(el); const wrap = el.closest('.input'); const ws = wrap ? getComputedStyle(wrap) : null;
  return { tag: el.tagName.toLowerCase(), name: el.name || el.id, outlineInput: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0, boxShadowInput: cs.boxShadow !== 'none', obalBoxShadow: ws ? ws.boxShadow !== 'none' : null, obalBorder: ws ? ws.borderColor : null };
});

async function beh(cislo, { snimky, lang = 'cs-CZ' }) {
  const srv = await spustServer(REPO);
  const b = { cislo, lang, pripady: {} };
  const otevri = async (sirka = 360, vyska = 800) => {
    const p = await otevriProhlizec({ sirka, vyska, lang });
    await p.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await cekej(400);
    return p;
  };
  const snimek = (page, nazev) => (snimky ? page.screenshot({ path: path.join(VYSTUP, nazev), fullPage: true }) : null);

  // A) Refixace – výchozí hodnoty (2 800 000 / 22 let / 2,49 % → 5,79 %, 5,05 % + 9 000, úspory 300 000, +5 let, příjem 75 000)
  {
    const p = await otevri(360, 800);
    const ui = await ctiRefix(p.page);
    const m = M.compareRefixOptions({ balance: 2800000, remainingMonths: 264, currentRate: 2.49, offeredRate: 5.79, competitorRate: 5.05, refinanceCosts: 9000, savings: 300000, extendMonths: 60, income: 75000, fixYears: 5, threshold: 0.4 }, rules);
    b.pripady.A_refix_vychozi = {
      ui, modul: { current: kc(m.currentPayment), cheapest: m.cheapest.id, options: m.options.map((o) => ({ id: o.id, splatka: kc(o.payment), uroky: kc(o.interest), celkem: kc(o.totalCost), stres: o.stress.map((s) => kc(s.payment)) })) },
      preteka360: await preteka(p.page), fokus: null,
    };
    await p.page.focus('[name="balance"]');
    b.pripady.A_refix_vychozi.fokus = await fokusInfo(p.page);
    if (snimky) { b.pripady.A_refix_vychozi.axe360 = await axe(p.page); await snimek(p.page, 'vysledek-360.png'); }
    b.pripady.A_refix_vychozi.localStorage = await localStorageDump(p.page);
    b.pripady.A_refix_vychozi.konzole = p.zaznam.konzole; b.pripady.A_refix_vychozi.chyby = p.zaznam.chyby;
    await p.zavri();
    const q = await otevri(1440, 900);
    b.pripady.A_refix_vychozi.preteka1440 = await preteka(q.page);
    await snimek(q.page, 'vysledek-1440.png');
    await q.zavri();
  }

  // B) Refixace – příklad zadání psaný po česku: 3 500 000 (mezery), 25 let, nabídka „4,94“ (čárka), konkurence „4.94“ (tečka), doba „22,5“
  {
    const p = await otevri(360, 800);
    await napis(p.page, 'balance', '3 500 000');
    await napis(p.page, 'remainingYears', '25');
    await napis(p.page, 'offeredRate', '4,94');
    await napis(p.page, 'competitorRate', '4.94');
    await napis(p.page, 'savings', '0');
    const ui = await ctiRefix(p.page);
    const m = M.annuityPayment(3500000, 4.94, 300);
    b.pripady.B_refix_zadani_cesky = { vstupy: { balance: await hodnota(p.page, 'balance'), offeredRate: await hodnota(p.page, 'offeredRate'), competitorRate: await hodnota(p.page, 'competitorRate') }, acceptSplatkaUI: ui.radky[0]?.[2], refinanceSplatkaUI: ui.radky[1]?.[2], ocekavano: kc(m), ocekavanoPresne: m, chyba: ui.chyba };
    await napis(p.page, 'remainingYears', '22,5');
    const ui2 = await ctiRefix(p.page);
    b.pripady.B_refix_zadani_cesky.doba22_5 = { pole: await hodnota(p.page, 'remainingYears'), acceptSplatkaUI: ui2.radky[0]?.[2], ocekavano: kc(M.annuityPayment(3500000, 4.94, 270)), chyba: ui2.chyba };
    await napis(p.page, 'income', '75 000,50');
    const ui3 = await ctiRefix(p.page);
    b.pripady.B_refix_zadani_cesky.prijem75000_50 = { pole: await hodnota(p.page, 'income'), podilUI: ui3.radky[0]?.[7], ocekavano: `${Math.round(M.annuityPayment(3500000, 4.94, 270) / 75000.5 * 100)} %`, chyba: ui3.chyba };
    await napis(p.page, 'balance', '1 200 000');
    await napis(p.page, 'remainingYears', '10');
    await napis(p.page, 'offeredRate', '0');
    const ui4 = await ctiRefix(p.page);
    b.pripady.B_refix_zadani_cesky.nulovaSazba = { acceptSplatkaUI: ui4.radky[0]?.[2], ocekavano: '10 000 Kč', chyba: ui4.chyba };
    await p.zavri();
  }

  // C) Chybové stavy refixace: prázdné pole, text, záporné číslo, tečky jako oddělovače tisíců, nula
  {
    const p = await otevri(360, 800);
    const stavy = {};
    for (const [nazev, pole, text] of [['prazdne', 'balance', ''], ['text', 'balance', 'abc'], ['zaporne', 'balance', '-500000'], ['tecky', 'balance', '2.800.000'], ['nula', 'balance', '0'], ['dvojita_carka', 'currentRate', '2,,49']]) {
      await napis(p.page, pole, text);
      const ui = await ctiRefix(p.page);
      stavy[nazev] = { pole: await hodnota(p.page, pole), chyba: ui.chyba, ariaInvalid: await p.page.$eval(`[name="${pole}"]`, (el) => el.getAttribute('aria-invalid')), summaryZustal: ui.summary?.slice(0, 40) };
      if (nazev === 'text') { await snimek(p.page, 'chyba-360.png'); if (snimky) stavy[nazev].axe360 = await axe(p.page); }
      await napis(p.page, pole, pole === 'balance' ? '2 800 000' : '2,49');
    }
    // doba 0,01 roku → 0 měsíců
    await napis(p.page, 'remainingYears', '0,01');
    stavy.doba0 = { chyba: (await ctiRefix(p.page)).chyba };
    b.pripady.C_refix_chyby = stavy;
    await p.zavri();
  }

  // D) Kalkulačka poplatku (details): výchozí, konec fixace, 25 % před výročím, splátka po konci fixace, starší smlouva
  {
    const p = await otevri(360, 800);
    await p.page.$eval('#fee-calc', (d) => { d.open = true; });
    const dnes = await p.page.$eval('[name="paymentDate"]', (el) => el.value);
    const d0 = await ctiFee(p.page);
    const nastavData = async (o) => {
      for (const [k, v] of Object.entries(o)) await p.page.$eval(`[name="${k}"]`, (el, val) => { el.value = val; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, v);
      await cekej(400);
    };
    const vychoziData = await p.page.evaluate(() => Object.fromEntries(['contractDate', 'fixStartDate', 'fixEndDate', 'paymentDate'].map((n) => [n, document.querySelector(`[name="${n}"]`).value])));
    const mod0 = M.prepaymentFeeFromDates({ amount: 300000, originalLoan: 3500000, ...vychoziData }, rules);
    const stavy = { vychozi: { data: vychoziData, ui: d0, modul: mod0.fee == null ? null : kc(mod0.fee) } };
    await nastavData({ paymentDate: vychoziData.fixEndDate });
    stavy.konecFixace = await ctiFee(p.page);
    await nastavData({ contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2030-06-01', paymentDate: '2026-05-20' });
    await napis(p.page, 'amount', '750 000'); await napis(p.page, 'originalLoan', '3 000 000');
    stavy.ctvrtinaPredVyrocim = await ctiFee(p.page);
    await napis(p.page, 'amount', '1 000 000');
    stavy.nadCtvrtinu = { ...(await ctiFee(p.page)), modul: kc(M.prepaymentFeeFromDates({ amount: 1000000, originalLoan: 3000000, contractDate: '2025-06-01', fixStartDate: '2025-06-01', fixEndDate: '2030-06-01', paymentDate: '2026-05-20' }, rules).fee) };
    await p.page.click('[name="freeUsed"]'); await cekej(400);
    stavy.bezplatnaVyuzita = await ctiFee(p.page);
    await p.page.click('[name="freeUsed"]'); await cekej(200);
    await nastavData({ paymentDate: '2030-06-02' });
    stavy.poKonciFixace = await ctiFee(p.page);
    await nastavData({ contractDate: '2021-03-01', fixStartDate: '2021-03-01', fixEndDate: '2026-03-01', paymentDate: '2026-02-10' });
    stavy.starsiSmlouva = await ctiFee(p.page);
    await nastavData({ contractDate: '2021-03-01', fixStartDate: '2021-03-01', fixEndDate: '2026-03-01', paymentDate: '2026-03-01' });
    stavy.starsiSmlouvaKonecFixace = await ctiFee(p.page);
    await napis(p.page, 'amount', ''); stavy.prazdnaCastka = await ctiFee(p.page);
    await napis(p.page, 'amount', '300 000');
    await nastavData({ contractDate: '2024-11-05', fixStartDate: '2024-11-05', fixEndDate: '2029-11-05', paymentDate: dnes });
    await snimek(p.page, 'poplatek-360.png');
    b.pripady.D_poplatek = stavy;
    await p.zavri();
  }

  // E) Nájem vs. koupě – výchozí Praha; změna města; chyba plochy; investiční; LTV varování (věk 40)
  {
    const p = await otevri(360, 800);
    await p.page.click('#tab-rentbuy'); await cekej(500);
    const ui = await ctiRb(p.page);
    const vstup = { area: 60, pricePerM2: 154112, rentPerM2: 462, ownFunds: 1500000, purchaseCosts: 12000, age: 32, loanYears: 30, rate: 5.79, fixYears: 5, rateAfterFix: 5.79, repairFundPerM2Month: 20, insuranceYear: 2500, propertyTaxYear: Math.round(60 * 38.43), maintenancePct: 1, horizonYears: 20, investReturn: 6, costGrowth: 2, rentGrowth: 3, priceGrowth: 4, taxRate: 0.15, deductInterest: true, investment: false };
    const m = RB.simulateRentBuy(vstup, rules);
    const last = m.years.at(-1);
    b.pripady.E_rentbuy_praha = { ui, modul: { cena: kc(m.price), uver: kc(m.loan), ltv: m.ltv, splatka: kc(m.payments.initial), najem: kc(m.initialRent), koupe20: kc(last.buyerNetWorth), najem20: kc(last.renterNetWorth), rozdil: kc(m.finalDiff), zlom: m.breakEvenYear, stredCitlivosti: kc(RB.sensitivity(vstup, rules).grid[1][1]) }, preteka360: await preteka(p.page) };
    if (snimky) { b.pripady.E_rentbuy_praha.axe360 = await axe(p.page); await snimek(p.page, 'rentbuy-360.png'); }
    // město Brno
    await p.page.select('[name="city"]', 'brno'); await cekej(500);
    const uiB = await ctiRb(p.page);
    b.pripady.E_rentbuy_brno = { cena: uiB.cena, najem: uiB.najem, dan: uiB.dan, ocekavanaDan: Math.round(60 * 14.95), kpi: uiB.kpi };
    // věk 40 → LTV 80 % překročeno
    await napis(p.page, 'age', '40');
    const uiV = await ctiRb(p.page);
    b.pripady.E_rentbuy_vek40 = { varovani: uiV.varovani, kpi: uiV.kpi, summary: uiV.summary };
    // plocha 0 → chyba; plocha „65,5“ → daň přepočtena
    await napis(p.page, 'area', '0');
    b.pripady.E_rentbuy_plocha0 = { chyba: (await ctiRb(p.page)).chyba };
    await napis(p.page, 'area', '65,5');
    const uiA = await ctiRb(p.page);
    b.pripady.E_rentbuy_plocha65_5 = { chyba: uiA.chyba, dan: uiA.dan, ocekavanaDan: Math.round(65.5 * 14.95), kpi: uiA.kpi };
    // horizont 51 → chyba; růst nájmů záporný → chyba?
    await napis(p.page, 'horizonYears', '51');
    b.pripady.E_rentbuy_horizont51 = { chyba: (await ctiRb(p.page)).chyba };
    await napis(p.page, 'horizonYears', '20');
    await napis(p.page, 'rentGrowth', '-1');
    b.pripady.E_rentbuy_rustNajmuZaporny = { chyba: (await ctiRb(p.page)).chyba };
    await napis(p.page, 'rentGrowth', '3');
    await napis(p.page, 'priceGrowth', '-2');
    b.pripady.E_rentbuy_rustCenZaporny = { chyba: (await ctiRb(p.page)).chyba, summary: (await ctiRb(p.page)).summary };
    b.pripady.E_rentbuy_localStorage = await localStorageDump(p.page);
    b.pripady.E_rentbuy_konzole = p.zaznam.konzole; b.pripady.E_rentbuy_chyby = p.zaznam.chyby;
    b.pripady.E_rentbuy_cizi = [...new Set(p.zaznam.sit.filter((r) => !r.url.startsWith(srv.url) && !r.url.startsWith('data:')).map((r) => r.url))];
    await p.zavri();
    const q = await otevri(1440, 900);
    await q.page.click('#tab-rentbuy'); await cekej(500);
    b.pripady.E_rentbuy_praha.preteka1440 = await preteka(q.page);
    await snimek(q.page, 'rentbuy-1440.png');
    await q.zavri();
  }

  // F) XSS do všech polí včetně skryté záložky a kalkulačky poplatku; klávesnice na záložkách
  {
    const p = await otevri(360, 800);
    await p.page.$eval('#fee-calc', (d) => { d.open = true; });
    const vloz = async () => {
      await p.page.evaluate((payload) => {
        document.querySelectorAll('input:not([type=checkbox]):not([type=date])').forEach((el) => { el.value = payload; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
        document.querySelectorAll('form').forEach((f) => f.requestSubmit());
      }, XSS);
      await cekej(600);
    };
    await vloz();
    const r1 = await p.page.evaluate(() => ({ img: !!document.querySelector('img[src="x"]'), chybaRefix: document.querySelector('#refix-errors').textContent.trim().slice(0, 120), fee: document.querySelector('#fee-result').textContent.trim() }));
    await p.page.click('#tab-rentbuy'); await cekej(300);
    await vloz();
    const r2 = await p.page.evaluate(() => ({ img: !!document.querySelector('img[src="x"]'), chybaRb: document.querySelector('#rb-errors').textContent.trim().slice(0, 160), html: document.body.innerHTML.includes('onerror=alert') }));
    // klávesnice: šipky mezi záložkami, hash
    await p.page.focus('#tab-rentbuy'); await p.page.keyboard.press('ArrowLeft'); await cekej(200);
    const tabInfo = await p.page.evaluate(() => ({ aktivni: document.activeElement.id, hash: location.hash, refixViditelny: !document.querySelector('#panel-refix').hidden }));
    b.pripady.F_xss = { refix: r1, rentbuy: r2, dialogy: p.zaznam.dialogy, klavesniceZalozky: tabInfo };
    await p.zavri();
  }

  // G) Chybějící JSON → chybová hláška (server bez rules.json)
  if (snimky) {
    const tmp = fs.mkdtempSync('/tmp/revize/scratch/byd-nojson-');
    for (const f of fs.readdirSync(REPO)) if (!['rules.json', '.git'].includes(f)) fs.cpSync(path.join(REPO, f), path.join(tmp, f), { recursive: true });
    const s2 = await spustServer(tmp);
    const p = await otevriProhlizec({ sirka: 360, vyska: 800, lang });
    await p.page.goto(s2.url, { waitUntil: 'networkidle0', timeout: 60000 }); await cekej(400);
    b.pripady.G_chybejici_json = await p.page.evaluate(() => ({ hlaska: document.querySelector('#load-error').textContent.trim(), skryto: document.querySelector('#load-error').hidden, summary: document.querySelector('#refix-summary').textContent }));
    await p.page.screenshot({ path: path.join(VYSTUP, 'chyba-data-360.png'), fullPage: true });
    await p.zavri(); await s2.zavri();
  }

  await srv.zavri();
  return b;
}

const vysledek = { datum: new Date().toISOString(), behy: [] };
vysledek.behy.push(await beh(1, { snimky: true, lang: 'cs-CZ' }));
vysledek.behy.push(await beh(2, { snimky: false, lang: 'cs-CZ' }));
vysledek.behy.push(await beh(3, { snimky: false, lang: 'en-US' }));
if (process.argv.includes('--zivy')) {
  const z = await kontrolaStranky({ url: 'https://frankie851.github.io/bydlometr/', vystup: VYSTUP, nazev: 'zivy' });
  vysledek.zivy = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, { preteka: v.preteka, konzole: v.konzole, chyby: v.chyby, cizi: [...new Set(v.ciziPozadavky.filter((r) => !r.url.startsWith('data:')).map((r) => r.url))], axe: v.axe, xss: v.xss, localStorage: v.localStorage }]));
}
fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
