// Prohlížečové scénáře pro revizi Cestovní příkaz 2027 (CES, 5. 11. 2026): vyplnění hlavičky a cest,
// čtení souhrnu, chybové stavy, cesta přes půlnoc, veřejná sféra, český zápis čísel (cs-CZ i en-US),
// XSS v polích cesty, tisk do PDF (A4, 1 strana), localStorage, axe, přetékání, živý web.
// Spuštění: node cestovni-prikaz-prohlizec.mjs   (výstup: ../cestovni-prikaz/prohlizec.json + snímky + PDF)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { spustServer, otevriProhlizec, preteka, axe, kontrolaStranky, localStorageDump, XSS } from './prohlizec-lib.mjs';

const REPO = '/tmp/revize/repos/cestovni-prikaz';
const VYSTUP = new URL('../cestovni-prikaz/', import.meta.url).pathname;
fs.mkdirSync(VYSTUP, { recursive: true });
const ZIVY = 'https://frankie851.github.io/cestovni-prikaz/';

const cekej = (ms) => new Promise((r) => setTimeout(r, ms));

/** Napíše hodnotu do pole klávesnicí (jako uživatel) a vyvolá input/change. */
async function napis(page, name, text) {
  const sel = `[name="${name}"]`;
  await page.$eval(sel, (el) => { el.value = ''; });
  await page.focus(sel);
  await page.keyboard.down('Control'); await page.keyboard.press('KeyA'); await page.keyboard.up('Control');
  await page.keyboard.press('Backspace');
  if (String(text) !== '') await page.keyboard.type(String(text), { delay: 3 });
  await page.$eval(sel, (el) => { el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); });
}
/** datetime-local nelze spolehlivě „naťukat“, nastaví se hodnota a vyvolá change (aplikace poslouchá change). */
async function nastavDatum(page, name, iso) {
  await page.$eval(`[name="${name}"]`, (el, v) => { el.value = v; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); }, iso);
  await cekej(50);
}
async function zaskrtniJidlo(page, den, jidlo) {
  await page.$eval(`#jidla-dny input[data-den="${den}"][data-jidlo="${jidlo}"]`, (el) => { el.checked = true; el.dispatchEvent(new Event('change', { bubbles: true })); });
}
async function odesli(page) {
  await page.$eval('#form-cesta', (f) => f.requestSubmit());
  await cekej(200);
}
async function stavPole(page, name) {
  return page.$eval(`[name="${name}"]`, (el) => ({ value: el.value, badInput: el.validity.badInput, valid: el.validity.valid }));
}

/** Přečte souhrn (poslední řádek tabulky = poslední přidaná cesta podle data) a seznam cest. */
const cti = (page) => page.evaluate(() => {
  const t = (el) => el?.textContent.replace(/\s+/g, ' ').trim() ?? null;
  const radky = [...document.querySelectorAll('#souhrn table.tbl tbody tr:not(.detail)')].map((tr) =>
    [...tr.querySelectorAll('td')].map((td) => t(td)));
  const detaily = [...document.querySelectorAll('#souhrn table.tbl tbody tr.detail')].map((tr) => t(tr));
  const paticka = [...document.querySelectorAll('#souhrn table.tbl tfoot td')].map((td) => t(td));
  return {
    radky, detaily, paticka,
    kVyplate: t(document.querySelector('#souhrn .total strong')),
    seznam: [...document.querySelectorAll('#seznam-cest li')].map((li) => ({
      text: t(li.querySelector('.trip-main')), suma: t(li.querySelector('.trip-sum')), chyba: t(li.querySelector('.trip-main .error')), bad: li.classList.contains('bad'),
    })),
    chybaFormulare: document.querySelector('#chyba-cesty')?.hidden ? null : t(document.querySelector('#chyba-cesty')),
    upozorneni: t(document.querySelector('#upozorneni')),
    patickaWeb: t(document.querySelector('#paticka')),
    jidlaDny: t(document.querySelector('#jidla-dny')),
    tiskDisabled: document.querySelector('#btn-tisk')?.disabled,
    imgX: !!document.querySelector('img[src="x"]'),
  };
});

async function otevri(url, { sirka = 360, vyska = 800, lang = 'cs-CZ' } = {}) {
  const p = await otevriProhlizec({ sirka, vyska, lang });
  await p.page.goto(url, { waitUntil: 'networkidle0', timeout: 60000 });
  await p.page.evaluate(() => localStorage.clear());
  await p.page.reload({ waitUntil: 'networkidle0' });
  await cekej(200);
  return p;
}

async function vyplnHlavicku(page, { spotreba = '6', sfera = 'soukroma' } = {}) {
  await napis(page, 'firma', 'Testovací s.r.o.');
  await napis(page, 'zamestnanec', 'Jan Testovací');
  await napis(page, 'spz', '1AB 2345');
  await page.$eval(`input[name="sfera"][value="${sfera}"]`, (el) => { el.click(); });
  await cekej(50);
  await napis(page, 'spotreba', spotreba);
  await cekej(100);
}
async function pridejCestu(page, { odjezd, navrat, odkud = 'Brno', kam = 'Praha', km = '', ucel = 'Jednání s klientem', cenaDoklad = '', jidla = [] }) {
  await nastavDatum(page, 'odjezd', odjezd);
  await nastavDatum(page, 'navrat', navrat);
  await napis(page, 'odkud', odkud);
  await napis(page, 'kam', kam);
  await napis(page, 'ucel', ucel);
  await napis(page, 'km', km);
  await napis(page, 'cenaDoklad', cenaDoklad);
  for (const [den, j] of jidla) await zaskrtniJidlo(page, den, j);
  const pole = { km: await stavPole(page, 'km'), cenaDoklad: await stavPole(page, 'cenaDoklad') };
  await odesli(page);
  return pole;
}

const pdfStrany = (soubor) => {
  try { const m = /Pages:\s+(\d+)/.exec(execFileSync('pdfinfo', [soubor], { encoding: 'utf8' })); return m ? Number(m[1]) : null; } catch { return null; }
};

async function beh(cislo, { snimky }) {
  const srv = await spustServer(REPO);
  const b = { cislo, pripady: {} };

  // A) příklad ze zadání: 100 km, 6 l, benzin 95, 15. 3. 2026 6:00–19:00 → 590 + 208,20 + 236 = 1 034,20; k výplatě 1 035 Kč
  {
    const p = await otevri(srv.url, { sirka: 360 });
    await vyplnHlavicku(p.page);
    await pridejCestu(p.page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '100' });
    const ui = await cti(p.page);
    b.pripady.A_zadani = { ui, preteka: await preteka(p.page) };
    if (snimky) {
      await p.page.screenshot({ path: path.join(VYSTUP, 'vysledek-360.png'), fullPage: true });
      b.pripady.A_zadani.axe = await axe(p.page);
    }
    // PDF – 1 cesta (tiskový styl přes page.pdf, emulace print média)
    await p.page.emulateMediaType('print');
    const pdf1 = path.join(VYSTUP, 'vyuctovani-1-cesta.pdf');
    await p.page.pdf({ path: snimky ? pdf1 : '/tmp/revize/scratch/ces-pdf-tmp.pdf', format: 'A4', printBackground: true, preferCSSPageSize: true });
    b.pripady.A_zadani.pdfStrany1 = pdfStrany(snimky ? pdf1 : '/tmp/revize/scratch/ces-pdf-tmp.pdf');
    await p.page.emulateMediaType('screen');
    // + 2 další cesty (3 celkem) → PDF strany
    await pridejCestu(p.page, { odjezd: '2026-03-20T07:30', navrat: '2026-03-20T16:00', km: '240', kam: 'Ostrava', ucel: 'Školení' });
    await pridejCestu(p.page, { odjezd: '2026-03-25T05:00', navrat: '2026-03-26T21:00', km: '380', kam: 'Plzeň', ucel: 'Montáž', jidla: [['2026-03-26', 'o']] });
    const ui3 = await cti(p.page);
    await p.page.emulateMediaType('print');
    const pdf3 = '/tmp/revize/scratch/ces-pdf-3.pdf';
    await p.page.pdf({ path: pdf3, format: 'A4', printBackground: true, preferCSSPageSize: true });
    b.pripady.A_zadani.pdfStrany3 = pdfStrany(pdf3);
    b.pripady.A_zadani.ui3cesty = { paticka: ui3.paticka, kVyplate: ui3.kVyplate, radky: ui3.radky };
    await p.page.emulateMediaType('screen');
    b.pripady.A_zadani.localStorage = await localStorageDump(p.page);
    b.pripady.A_zadani.sit = p.zaznam.sit.map((r) => r.url).filter((u) => !u.startsWith(srv.url));
    b.pripady.A_zadani.konzole = p.zaznam.konzole; b.pripady.A_zadani.dialogy = p.zaznam.dialogy;
    await p.zavri();
  }
  // A2) totéž na 1440 px (snímek) – jen v 1. běhu
  if (snimky) {
    const p = await otevri(srv.url, { sirka: 1440, vyska: 900 });
    await vyplnHlavicku(p.page);
    await pridejCestu(p.page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '100' });
    const ui = await cti(p.page);
    b.pripady.A_zadani_1440 = { kVyplate: ui.kVyplate, radky: ui.radky, preteka: await preteka(p.page) };
    await p.page.screenshot({ path: path.join(VYSTUP, 'vysledek-1440.png'), fullPage: true });
    await p.zavri();
  }

  // B) chybové stavy: prázdný formulář; rok 2027; návrat před odjezdem; km záporné
  {
    const p = await otevri(srv.url, { sirka: 360 });
    await vyplnHlavicku(p.page);
    await odesli(p.page);
    const prazdny = (await cti(p.page)).chybaFormulare;
    await pridejCestu(p.page, { odjezd: '2026-03-15T10:00', navrat: '2026-03-15T09:00', km: '10' });
    const navratDriv = (await cti(p.page)).chybaFormulare;
    await pridejCestu(p.page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '-5' });
    const zaporne = { chyba: (await cti(p.page)).chybaFormulare, pole: await stavPole(p.page, 'km') };
    await pridejCestu(p.page, { odjezd: '2027-01-10T07:00', navrat: '2027-01-10T15:00', km: '100' });
    const ui = await cti(p.page);
    b.pripady.B_chyby = { prazdny, navratDriv, zaporne, rok2027: { seznam: ui.seznam, upozorneni: ui.upozorneni, tiskDisabled: ui.tiskDisabled, chybaFormulare: ui.chybaFormulare }, preteka: await preteka(p.page) };
    if (snimky) {
      await p.page.screenshot({ path: path.join(VYSTUP, 'chyba-360.png'), fullPage: true });
      b.pripady.B_chyby.axe = await axe(p.page);
    }
    await p.zavri();
  }

  // C) cesta přes půlnoc (soukromá sféra) 20:00–2:00 a 6:00–0:30 – § 163 odst. 4
  {
    const p = await otevri(srv.url, { sirka: 360 });
    await vyplnHlavicku(p.page);
    await pridejCestu(p.page, { odjezd: '2026-03-15T20:00', navrat: '2026-03-16T02:00', km: '' });
    await pridejCestu(p.page, { odjezd: '2026-04-10T06:00', navrat: '2026-04-11T00:30', km: '' });
    const ui = await cti(p.page);
    b.pripady.C_pulnoc = { radky: ui.radky, detaily: ui.detaily, kVyplate: ui.kVyplate, jidlaDnyNaposled: ui.jidlaDny };
    if (snimky) await p.page.screenshot({ path: path.join(VYSTUP, 'pulnoc-360.png'), fullPage: true });
    await p.zavri();
  }

  // D) veřejná sféra: 442 Kč nad 18 h + 1 večeře → 331,50; 185 Kč 5–12 h + 2 jídla → 0
  {
    const p = await otevri(srv.url, { sirka: 360 });
    await vyplnHlavicku(p.page, { sfera: 'verejna' });
    await napis(p.page, 'sv0', '185'); await napis(p.page, 'sv2', '442');
    await pridejCestu(p.page, { odjezd: '2026-03-15T02:00', navrat: '2026-03-15T22:00', km: '', jidla: [['2026-03-15', 'v']] });
    await pridejCestu(p.page, { odjezd: '2026-03-16T08:00', navrat: '2026-03-16T14:00', km: '', jidla: [['2026-03-16', 's'], ['2026-03-16', 'o']] });
    const ui = await cti(p.page);
    b.pripady.D_verejna = { radky: ui.radky, detaily: ui.detaily, kVyplate: ui.kVyplate, seznam: ui.seznam };
    await p.zavri();
  }

  // E) český zápis čísel: km „100,5“, spotřeba „6,5“, cena z dokladu „38,90“, km „1 500“ – v cs-CZ i en-US
  for (const lang of ['cs-CZ', 'en-US']) {
    const p = await otevri(srv.url, { sirka: 360, lang });
    await vyplnHlavicku(p.page, { spotreba: '6,5' });
    const spotreba = await stavPole(p.page, 'spotreba');
    const pole1 = await pridejCestu(p.page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '100,5', cenaDoklad: '38,90' });
    const ui1 = await cti(p.page);
    const pole2 = await pridejCestu(p.page, { odjezd: '2026-03-16T06:00', navrat: '2026-03-16T19:00', km: '1 500', kam: 'Ostrava' });
    const ui2 = await cti(p.page);
    b.pripady[`E_cisla_${lang}`] = {
      spotreba, cesta1: { pole: pole1, chyba: ui1.chybaFormulare, seznam: ui1.seznam, detaily: ui1.detaily },
      cesta2: { pole: pole2, chyba: ui2.chybaFormulare, seznam: ui2.seznam, radky: ui2.radky, detaily: ui2.detaily, kVyplate: ui2.kVyplate },
    };
    await p.zavri();
  }

  // F) XSS v polích cesty (objeví se v seznamu, souhrnu i tisku) + v hlavičce
  {
    const p = await otevri(srv.url, { sirka: 360 });
    await napis(p.page, 'firma', XSS); await napis(p.page, 'zamestnanec', XSS); await napis(p.page, 'spz', XSS);
    await napis(p.page, 'spotreba', '6');
    await pridejCestu(p.page, { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: '10', odkud: XSS, kam: XSS, ucel: XSS });
    await napis(p.page, 'zpet', XSS);
    await pridejCestu(p.page, { odjezd: '2026-03-16T06:00', navrat: '2026-03-16T19:00', km: '10', odkud: 'A', kam: 'B', ucel: XSS });
    await cekej(500);
    const ui = await cti(p.page);
    b.pripady.F_xss = { imgX: ui.imgX, dialogy: p.zaznam.dialogy, seznam: ui.seznam.map((s) => s.text), pageerror: p.zaznam.konzole.filter((k) => k.typ === 'pageerror') };
    await p.zavri();
  }

  await srv.zavri();
  return b;
}

const vysledek = { datum: new Date().toISOString(), behy: [] };
vysledek.behy.push(await beh(1, { snimky: true }));
vysledek.behy.push(await beh(2, { snimky: false }));

// G) živý web – standardní kontrola (snímky zivy-360/1440, axe, síť, konzole, chybějící soubory)
try {
  const z = await kontrolaStranky({ koren: REPO, vystup: VYSTUP, nazev: 'zivy', url: ZIVY });
  vysledek.zivyWeb = Object.fromEntries(Object.entries(z.zobrazeni).map(([k, v]) => [k, {
    preteka: v.preteka, axe: v.axe, konzole: v.konzole, chyby: v.chyby, ciziPozadavky: v.ciziPozadavky.filter((r) => !r.url.startsWith('data:')).map((r) => r.url), xss: v.xss,
  }]));
} catch (e) { vysledek.zivyWeb = { chyba: String(e) }; }

fs.writeFileSync(path.join(VYSTUP, 'prohlizec.json'), JSON.stringify(vysledek, null, 1));

// krátký souhrn na stdout
for (const b of vysledek.behy) {
  const A = b.pripady.A_zadani;
  console.log(`[běh ${b.cislo}] A zadání: řádek ${JSON.stringify(A.ui.radky[0])} · k výplatě ${A.ui.kVyplate} · PDF 1 cesta: ${A.pdfStrany1} str., 3 cesty: ${A.pdfStrany3} str. · přetéká ${A.preteka.preteka} · cizí požadavky ${A.sit.length} · dialogy ${A.dialogy.length}` + (A.axe ? ` · axe ${A.axe.length}` : ''));
  console.log(`[běh ${b.cislo}] B chyby: prázdný „${b.pripady.B_chyby.prazdny}“ · návrat dřív „${b.pripady.B_chyby.navratDriv}“ · km −5 „${b.pripady.B_chyby.zaporne.chyba}“ (value „${b.pripady.B_chyby.zaporne.pole.value}“) · 2027: ${JSON.stringify(b.pripady.B_chyby.rok2027.seznam[0]?.chyba)} tisk disabled ${b.pripady.B_chyby.rok2027.tiskDisabled}` + (b.pripady.B_chyby.axe ? ` · axe ${b.pripady.B_chyby.axe.length}` : ''));
  console.log(`[běh ${b.cislo}] C půlnoc: ${JSON.stringify(b.pripady.C_pulnoc.radky.map((r) => [r[0], r[5], r[6]]))}`);
  console.log(`[běh ${b.cislo}] D veřejná: ${JSON.stringify(b.pripady.D_verejna.radky.map((r) => [r[0], r[5]]))}`);
  for (const lang of ['cs-CZ', 'en-US']) {
    const E = b.pripady[`E_cisla_${lang}`];
    console.log(`[běh ${b.cislo}] E ${lang}: spotřeba „6,5“ → value „${E.spotreba.value}“ bad ${E.spotreba.badInput} · km „100,5“ → „${E.cesta1.pole.km.value}“ bad ${E.cesta1.pole.km.badInput}, doklad „38,90“ → „${E.cesta1.pole.cenaDoklad.value}“ · chyba „${E.cesta1.chyba}“ · seznam1 ${JSON.stringify(E.cesta1.seznam.map((s) => [s.text, s.suma]))}`);
    console.log(`[běh ${b.cislo}] E ${lang}: km „1 500“ → „${E.cesta2.pole.km.value}“ bad ${E.cesta2.pole.km.badInput} · chyba „${E.cesta2.chyba}“ · řádky ${JSON.stringify(E.cesta2.radky.map((r) => [r[0], r[2], r[3], r[4], r[6]]))}`);
  }
  console.log(`[běh ${b.cislo}] F XSS: img ${b.pripady.F_xss.imgX} · dialogy ${b.pripady.F_xss.dialogy.length} · pageerror ${b.pripady.F_xss.pageerror.length}`);
}
if (vysledek.zivyWeb.chyba) console.log('živý web: chyba', vysledek.zivyWeb.chyba);
else for (const [k, v] of Object.entries(vysledek.zivyWeb)) console.log(`živý web [${k}]: přetéká ${v.preteka.preteka} · axe ${v.axe?.length ?? '-'} · konzole ${v.konzole.length} ${JSON.stringify(v.konzole.map((c) => c.text.slice(0, 80)))} · chyby ${JSON.stringify(v.chyby)} · cizí ${JSON.stringify(v.ciziPozadavky)}`);
