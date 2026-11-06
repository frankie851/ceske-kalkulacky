// Prohlížečové scénáře pro revizi Plán48 (5. 11. 2026): vyplnění formuláře, čtení výsledků,
// porovnání s modulem calc.js, český zápis čísel, stav chyby, štítek návrhu, fokus, živý web.
// Spuštění: node plan48-prohlizec.mjs   (výstup: ../plan48/prohlizec.json + snímky)
import fs from 'node:fs';
import path from 'node:path';
import { spustServer, otevriProhlizec, preteka, axe, kontrolaStranky, zkusXss } from './prohlizec-lib.mjs';

const REPO = '/tmp/revize/repos/plan48';
const VYSTUP = new URL('../plan48/', import.meta.url).pathname;
fs.mkdirSync(VYSTUP, { recursive: true });
const calc = await import(`${REPO}/calc.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));

const vysledek = { datum: new Date().toISOString(), behy: [] };
const cti = (page) => page.evaluate(() => {
  const t = (s) => document.querySelector(s)?.textContent.trim() ?? null;
  return {
    prispevek: t('#v-prispevek'), prispevekPozn: t('#v-prispevek-pozn'), uspora: t('#v-uspora'), vyuzity: t('#v-vyuzity'),
    nevyuzity: t('#v-nevyuzity'), nevyuzityPozn: t('#v-nevyuzity-pozn'), akce: t('#akce-veta'), akcePozn: t('#akce-pozn'),
    limit: t('#limit-text'), stitekSady: document.querySelector('#stitek-sady')?.hidden ? null : t('#stitek-sady'),
    stitekAkce: document.querySelector('[data-stitek]')?.hidden ? null : t('[data-stitek]'),
    chyba: document.querySelector('#chyba')?.hidden ? null : t('#chyba'),
    projekce: t('#projekce-shrnuti'), poznamkaSady: t('#poznamka-sady'),
    stitekUProjekce: !!document.querySelector('.projekce .stitek-navrh:not([hidden])'),
    stitekUDlazdic: !!document.querySelector('.dlazdice .stitek-navrh:not([hidden])'),
  };
});
const kc = (n) => new Intl.NumberFormat('cs-CZ', { style: 'currency', currency: 'CZK', maximumFractionDigits: 0 }).format(Math.round(n));

async function vypln(page, hodnoty) {
  for (const [name, v] of Object.entries(hodnoty)) {
    const sel = `[name="${name}"]`;
    await page.$eval(sel, (el) => { el.value = ''; });
    await page.focus(sel);
    await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    if (String(v) !== '') await page.keyboard.type(String(v), { delay: 5 });
    await page.$eval(sel, (el) => el.dispatchEvent(new Event('input', { bubbles: true })));
  }
  await new Promise((r) => setTimeout(r, 150));
}
async function klikni(page, text) {
  await page.evaluate((t) => { for (const b of document.querySelectorAll('button')) if (b.textContent.trim() === t) { b.click(); return; } }, text);
  await new Promise((r) => setTimeout(r, 150));
}

async function beh(cislo, { snimky }) {
  const srv = await spustServer(REPO);
  const b = { cislo, pripady: {} };
  const otevri = async (sirka, vyska) => {
    const p = await otevriProhlizec({ sirka, vyska });
    await p.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    return p;
  };

  // A) zadání: DPS 5 700, věk 35, 10 měsíců za námi
  {
    const p = await otevri(360, 800);
    await vypln(p.page, { vek: 35, dps: 5700, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 });
    const ui = await cti(p.page);
    const m = calc.spocitejRok({ vek: 35, sazbaDane: 0.15, dps: 5700, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 }, rules.sady['2026']);
    b.pripady.A_dps5700 = { ui, modul: { prispevek: kc(m.statniPrispevekRocne), uspora: kc(m.uspora), vyuzity: kc(m.odpocet.vyuzity), nevyuzity: kc(m.odpocet.nevyuzity) }, preteka: await preteka(p.page), konzole: p.zaznam.konzole, chyby: p.zaznam.chyby };
    if (snimky) await p.page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
    if (snimky) b.pripady.A_dps5700.axe = await axe(p.page);
    await p.zavri();
    const q = await otevri(1440, 900);
    await vypln(q.page, { vek: 35, dps: 5700, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 });
    b.pripady.A_dps5700.preteka1440 = await preteka(q.page);
    if (snimky) await q.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
    await q.zavri();
  }

  // B) zadání: DPS 3 000 + ŽP 2 500, sazba 23 %
  {
    const p = await otevri(360, 800);
    await vypln(p.page, { vek: 40, dps: 3000, zp: 2500, mesicuProbehlo: 10 });
    const ui15 = await cti(p.page);
    await klikni(p.page, '23 %');
    const ui23 = await cti(p.page);
    const m = calc.spocitejRok({ vek: 40, sazbaDane: 0.23, dps: 3000, dip: 0, zp: 2500, zamestnavatel: 0, mesicuProbehlo: 10 }, rules.sady['2026']);
    b.pripady.B_dps3000_zp2500 = { ui15, ui23, modul23: { prispevek: kc(m.statniPrispevekRocne), uspora: kc(m.uspora), vyuzity: kc(m.odpocet.vyuzity), nevyuzity: kc(m.odpocet.nevyuzity), doplatek: m.doporuceni.odpocet } };
    await p.zavri();
  }

  // C) návrh 2027: věk 25, DPS 1 700 – štítek návrhu
  {
    const p = await otevri(360, 800);
    await klikni(p.page, 'Návrh 2027');
    await vypln(p.page, { vek: 25, dps: 1700, mesicuProbehlo: 10 });
    const ui = await cti(p.page);
    const m = calc.spocitejRok({ vek: 25, sazbaDane: 0.15, dps: 1700, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 }, rules.sady.navrh2027);
    b.pripady.C_navrh_25 = { ui, modul: { prispevek: kc(m.statniPrispevekRocne) } };
    if (snimky) await p.page.screenshot({ path: path.join(VYSTUP, 'navrh-360.png'), fullPage: true });
    // C2) návrh 2027 + prázdný věk
    await vypln(p.page, { vek: '' });
    b.pripady.C2_navrh_vek_prazdny = { ui: await cti(p.page) };
    await p.zavri();
  }

  // D) rada do 31. 12.: DPS 1 000, 10 měsíců za námi (paušální hranice 20 400)
  {
    const p = await otevri(360, 800);
    await vypln(p.page, { vek: 40, dps: 1000, mesicuProbehlo: 10 });
    const ui = await cti(p.page);
    const m = calc.spocitejRok({ vek: 40, sazbaDane: 0.15, dps: 1000, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 }, rules.sady['2026']);
    b.pripady.D_rada_dps1000 = { ui, modulDoporuceni: m.doporuceni };
    if (snimky) await p.page.screenshot({ path: path.join(VYSTUP, 'rada-360.png'), fullPage: true });
    await vypln(p.page, { dps: 0 });
    const m0 = calc.spocitejRok({ vek: 40, sazbaDane: 0.15, dps: 0, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 10 }, rules.sady['2026']);
    b.pripady.D2_rada_dps0 = { ui: await cti(p.page), modulDoporuceni: m0.doporuceni };
    await p.zavri();
  }

  // E) český zápis čísel a špatný vstup (type=number)
  {
    const p = await otevri(360, 800);
    const zkus = async (name, text) => {
      await vypln(p.page, { [name]: text });
      const hodnota = await p.page.$eval(`[name="${name}"]`, (el) => ({ value: el.value, valid: el.validity.valid, badInput: el.validity.badInput }));
      return { zadano: text, pole: hodnota, ui: await cti(p.page) };
    };
    b.pripady.E_cesky_zapis = {
      mezera: await zkus('dps', '1 500'),
      carka: await zkus('dps', '1500,50'),
      tecka: await zkus('dps', '1500.50'),
      zaporne: await zkus('dps', '-500'),
      pismena: await zkus('dps', 'abc'),
      vlozeniMezera: await (async () => {
        await p.page.$eval('[name="dps"]', (el) => { el.value = '1 500'; el.dispatchEvent(new Event('input', { bubbles: true })); });
        await new Promise((r) => setTimeout(r, 150));
        return { pole: await p.page.$eval('[name="dps"]', (el) => el.value), ui: await cti(p.page) };
      })(),
      vekVelky: await zkus('vek', '150'),
      mesicu: await zkus('mesicuProbehlo', '15'),
      xssPozdeji: await zkusXss(p.page),
    };
    await p.zavri();
  }

  // F) chybový stav: rules.json nedostupný
  {
    const p = await otevriProhlizec({ sirka: 360, vyska: 800 });
    await p.page.setRequestInterception(true);
    p.page.on('request', (r) => (r.url().endsWith('rules.json') ? r.respond({ status: 404, body: 'nic' }) : r.continue()));
    await p.page.goto(srv.url, { waitUntil: 'networkidle0', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 300));
    b.pripady.F_chyba_rules = { ui: await cti(p.page), preteka: await preteka(p.page) };
    if (snimky) await p.page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
    await p.zavri();
  }

  // G) fokus klávesnicí na číselném poli: indikátor je na obalu .vstup (focus-within)
  {
    const p = await otevri(360, 800);
    await p.page.focus('[name="dps"]');
    b.pripady.G_fokus = await p.page.evaluate(() => {
      const el = document.activeElement; const obal = el.closest('.vstup'); const cs = getComputedStyle(obal);
      return { aktivni: el.name, obalBoxShadow: cs.boxShadow, obalBorder: cs.borderColor, inputOutline: getComputedStyle(el).outlineStyle };
    });
    // Tab přes celý formulář – pořadí a to, zda má fokus viditelný indikátor (prvek nebo jeho obal)
    await p.page.evaluate(() => document.activeElement.blur());
    const poradi = [];
    for (let i = 0; i < 16; i++) {
      await p.page.keyboard.press('Tab');
      poradi.push(await p.page.evaluate(() => {
        const el = document.activeElement; if (!el || el === document.body) return null;
        const vid = (e) => { const c = getComputedStyle(e); return (c.outlineStyle !== 'none' && parseFloat(c.outlineWidth) > 0) || c.boxShadow !== 'none'; };
        return { prvek: el.name || el.id || el.textContent.trim().slice(0, 20), viditelny: vid(el) || (el.closest('.vstup') ? vid(el.closest('.vstup')) : false) };
      }));
    }
    b.pripady.G_fokus.tab = poradi.filter(Boolean);
    await p.zavri();
  }

  await srv.zavri();
  return b;
}

vysledek.behy.push(await beh(1, { snimky: true }));
vysledek.behy.push(await beh(2, { snimky: false }));

// H) živý web – standardní kontrola (síť, konzole, chybějící soubory, axe, XSS, přetékání)
try {
  const z = await kontrolaStranky({ url: 'https://frankie851.github.io/plan48/', vystup: VYSTUP, nazev: 'zivy' });
  vysledek.zivyWeb = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, { preteka: v.preteka, axe: v.axe, konzole: v.konzole, chyby: v.chyby, cizi: [...new Set(v.ciziPozadavky.map((r) => r.url))], xss: v.xss, localStorage: v.localStorage }]));
} catch (e) {
  vysledek.zivyWeb = { chyba: String(e) };
}

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));
console.log(JSON.stringify(vysledek, null, 1));
