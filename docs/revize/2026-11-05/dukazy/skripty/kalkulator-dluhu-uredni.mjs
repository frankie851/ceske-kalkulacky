// Druhý zdroj pro výpočty: úřední kalkulačky ministerstva spravedlnosti.
//  A) exekuce.justice.cz/vypocet-srazek-ze-mzdy/ – počítá na serveru (formulář POST), voláme přes curl
//     (jde přes proxy sezení) pro varianty „2026 výpočet od 1. 1.“ (012026) a „2026 výpočet od 1. 10.“ (102026).
//  B) insolvence.justice.cz/kalkulator-splatek/ – počítá v prohlížeči (kalkul.js); vzorec je tu přepsaný 1:1
//     z jejich skriptu (stažen 5. 11. 2026) a navíc spuštěný živě v prohlížeči (puppeteer), pokud se stránka načte.
// Spuštění: node kalkulator-dluhu-uredni.mjs → ../kalkulator-dluhu/uredni-kalkulacky.txt
import fs from 'node:fs';
import { execFileSync } from 'node:child_process';
import { P2026, srazka, oddluzeni, kc } from './kalkulator-dluhu-prepocet.mjs';
import { otevriProhlizec } from './prohlizec-lib.mjs';

const VYSTUP = new URL('../kalkulator-dluhu/', import.meta.url).pathname;
const radky = [];
const log = (s = '') => { radky.push(s); console.log(s); };
log(`# Úřední kalkulačky vs. můj výpočet · ${new Date().toISOString()}`);

// --- A) exekuce.justice.cz (POST) ---------------------------------------------------------------
function exekuceJustice({ rok, mzda, pred = 0, nepred = 100000, deti = 0, vice = 'Ne', duchod = 'Ne', nahrada = 'Ano' }) {
  const args = ['-sS', '-L', '--max-time', '60', '-A', 'Mozilla/5.0', 'https://exekuce.justice.cz/vypocet-srazek-ze-mzdy/'];
  const data = { my_year: rok, mzdacista: mzda, pred_pohl: pred, nepred_pohl: nepred, deti, manzelka: 0, viceNezTri: vice, povinnemuDuchod: duchod, duchodManzel: 'Ne', nahradaPlatceMzdy: nahrada, calculate: 'Spočítat' };
  for (const [k, v] of Object.entries(data)) args.push('--data-urlencode', `${k}=${v}`);
  const html = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 4e6 });
  const cti = (id) => { const m = html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`)); return m ? m[1].trim().replace(/\s+/g, ' ') : null; };
  const num = (s) => (s === null ? null : Number(s.replace(/[^\d,.-]/g, '').replace(',', '.')));
  return { srazka: num(cti('sem1')), exekutorovi: num(cti('sem4')), nahrada: num(cti('sem5')), zustane: num(cti('sem2')), rok: cti('sem3') };
}

const PRIPADY = [
  { popis: 'Z1 23 000 běžný', mzda: 23000, nepred: 100000, s: { mzda: 23000, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'Z2 50 000 přednostní', mzda: 50000, pred: 100000, nepred: 0, s: { mzda: 50000, osoby: 0, prednostni: true, exekuci: 1 } },
  { popis: 'Z3 50 000 běžný', mzda: 50000, nepred: 100000, s: { mzda: 50000, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'Z5 12 000 přednostní', mzda: 12000, pred: 100000, nepred: 0, s: { mzda: 12000, osoby: 0, prednostni: true, exekuci: 1 } },
  { popis: 'H7 23 000, 4 exekuce', mzda: 23000, nepred: 100000, vice: 'Ano', s: { mzda: 23000, osoby: 0, prednostni: false, exekuci: 4 } },
  { popis: 'H8 16 502, 4 exekuce, důchodce', mzda: 16502, nepred: 100000, vice: 'Ano', duchod: 'Ano', s: { mzda: 16502, osoby: 0, prednostni: false, exekuci: 4, duchodce: true } },
  { popis: 'H8 23 000, 4 exekuce, důchodce', mzda: 23000, nepred: 100000, vice: 'Ano', duchod: 'Ano', s: { mzda: 23000, osoby: 0, prednostni: false, exekuci: 4, duchodce: true } },
  { popis: 'H10 23 000, 2 osoby', mzda: 23000, deti: 2, nepred: 100000, s: { mzda: 23000, osoby: 2, prednostni: false, exekuci: 1 } },
  { popis: 'H11 14 402 (srážka 100)', mzda: 14402, nepred: 100000, s: { mzda: 14402, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'H5 45 624 (zbytek 31 522)', mzda: 45624, nepred: 100000, s: { mzda: 45624, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'H6 50 001 běžný', mzda: 50001, nepred: 100000, s: { mzda: 50001, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'H3 14 105 (zbytek 3)', mzda: 14105, nepred: 100000, s: { mzda: 14105, osoby: 0, prednostni: false, exekuci: 1 } },
  { popis: 'H14 1 000 000 přednostní', mzda: 1000000, pred: 5000000, nepred: 0, s: { mzda: 1000000, osoby: 0, prednostni: true, exekuci: 1 } },
];

log('\n## A) exekuce.justice.cz – varianta „2026 výpočet od 1. 1.“ (012026)');
log('| Případ | Úřední srážka | k exekutorovi | náhrada plátce | zůstane | Můj výpočet (praxe) srážka / věřitelům / náhrada / zůstane | Shoda |');
log('|---|---|---|---|---|---|---|');
const vysl = { jan: [], okt: [] };
for (const c of PRIPADY) {
  let u; try { u = exekuceJustice({ rok: '012026', ...c }); } catch (e) { u = { chyba: String(e).slice(0, 80) }; }
  const m = srazka(P2026, c.s);
  const shoda = u.srazka === m.srazka && u.exekutorovi === m.vericum && u.nahrada === m.nahrada && u.zustane === m.zustane;
  vysl.jan.push({ ...c, uredni: u, moje: { srazka: m.srazka, vericum: m.vericum, nahrada: m.nahrada, zustane: m.zustane }, shoda });
  log(`| ${c.popis} | ${kc(u.srazka)} | ${kc(u.exekutorovi)} | ${kc(u.nahrada)} | ${kc(u.zustane)} | ${kc(m.srazka)} / ${kc(m.vericum)} / ${kc(m.nahrada)} / ${kc(m.zustane)} | ${u.chyba ? 'chyba: ' + u.chyba : shoda ? 'ano' : 'NE'} |`);
}

log('\n## A2) exekuce.justice.cz – varianta „2026 výpočet od 1. 10.“ (102026, ŽM 5 500 Kč; výchozí volba formuláře)');
log('Moje kontrola se stejnými hodnotami: součet 5 500 + 9 430 + 2 300 = 17 230; NČ 0,85 × 17 230 = 14 645,50 → 14 646; hranice 1,9 × 17 230 = 32 737.');
const P_OKT = { ...P2026, zivotniMinimum: 5500 };
log('| Případ | Úřední srážka (od 1. 10.) | k exekutorovi | náhrada | zůstane | Můj výpočet s ŽM 5 500 | Aplikace/NV § 4 (ŽM 4 860) | Rozdíl proti aplikaci |');
log('|---|---|---|---|---|---|---|---|');
for (const c of PRIPADY.slice(0, 5)) {
  let u; try { u = exekuceJustice({ rok: '102026', ...c }); } catch (e) { u = { chyba: String(e).slice(0, 80) }; }
  const mo = srazka(P_OKT, c.s); const mj = srazka(P2026, c.s);
  vysl.okt.push({ popis: c.popis, uredni: u, mojeOkt: mo.srazka, mojeJan: mj.srazka });
  log(`| ${c.popis} | ${kc(u.srazka)} | ${kc(u.exekutorovi)} | ${kc(u.nahrada)} | ${kc(u.zustane)} | ${kc(mo.srazka)} | ${kc(mj.srazka)} | ${u.srazka === null ? '–' : kc(u.srazka - mj.srazka)} |`);
}

// --- B) insolvence.justice.cz/kalkulator-splatek/ --------------------------------------------------
// Přepis funkce kalkuluj() z https://insolvence.justice.cz/wp-content/themes/insolvence/js/kalkul.js (staženo 5. 11. 2026)
// s parametry pro rok 2026 z jejich skrytých polí: livemin 4860, flatmin 11730, koef 85/100, osoba 1/4, puvodni_vypocet_nasobeni 1.
function insolvenceKalkul({ mzdacista, deti = 0, manzelka = 0, rok = '012026' }) {
  const par = { '012026': { livemin: 4860, flatmin: 11730, cit: 85, jmen: 100, ocit: 1, ojmen: 4, nasobeni: 1 } }[rok];
  const untouch = par.livemin + par.flatmin;
  const dluznik = 1;
  const dluznikuntouch = (untouch / par.jmen) * par.cit * dluznik;
  const manzelkauntouch = (((untouch / par.jmen) * par.cit) / par.ojmen) * par.ocit * manzelka;
  const detiuntouch = (((untouch / par.jmen) * par.cit) / par.ojmen) * par.ocit * deti;
  let basicuntouch = Math.ceil(dluznikuntouch + manzelkauntouch + detiuntouch);
  if (basicuntouch > mzdacista) basicuntouch = mzdacista;
  let slozka3 = mzdacista - basicuntouch - untouch * +par.nasobeni;
  if (slozka3 < 0) slozka3 = 0;
  const slozkax = mzdacista - basicuntouch - slozka3;
  const slozka2 = slozkax % 3 === 0 ? slozkax : (slozkax - 1) % 3 === 0 ? slozkax - 1 : slozkax - 2;
  const delenec = slozka2 / 3;
  let odd = slozka3 + 2 * delenec;
  const mzdakvyp = mzdacista - odd;
  if (odd < 0) odd = 0;
  return { splatka: odd, zustane: mzdakvyp, za3roky: odd * 36, hraniceUredni: untouch * par.nasobeni };
}

log('\n## B) insolvence.justice.cz/kalkulator-splatek/ (rok 2026) – přepis jejich kalkul.js vs. můj výpočet (IZ § 398 odst. 3 = srážka pro přednostní)');
log('| Případ | Úřední splátka (přepis kalkul.js) | zůstane | Můj výpočet splátka | zůstane | Shoda | Poznámka |');
log('|---|---|---|---|---|---|---|');
const ODD = [
  { popis: 'O1 30 000, 0 os.', mzdacista: 30000, deti: 0 },
  { popis: 'O2 23 000, 0 os.', mzdacista: 23000, deti: 0 },
  { popis: 'O3 17 369, 0 os.', mzdacista: 17369, deti: 0 },
  { popis: '23 000, 2 os.', mzdacista: 23000, deti: 2 },
  { popis: 'hranice úřední 30 692 (= 14 102 + 16 590)', mzdacista: 30692, deti: 0 },
  { popis: '35 000, 0 os.', mzdacista: 35000, deti: 0 },
  { popis: 'Z2 50 000, 0 os.', mzdacista: 50000, deti: 0 },
];
const vyslB = [];
for (const c of ODD) {
  const u = insolvenceKalkul(c); const m = oddluzeni(P2026, { mzda: c.mzdacista, osoby: c.deti, dluh: 1000000, odpusteni: 'ne' });
  const shoda = u.splatka === m.splatka;
  vyslB.push({ ...c, uredni: u, moje: m.splatka, shoda });
  log(`| ${c.popis} | ${kc(u.splatka)} | ${kc(u.zustane)} | ${kc(m.splatka)} | ${kc(m.zustane)} | ${shoda ? 'ano' : 'NE'} | ${shoda ? '' : `úřední skript používá hranici 1 × 16 590 = ${kc(u.hraniceUredni)} místo 1,9 × (NV 595/2006 § 2 = 31 521 Kč)`} |`);
}

// B2) živé spuštění úřední stránky v prohlížeči (3 pokusy max)
log('\n## B2) insolvence.justice.cz živě v prohlížeči (puppeteer)');
let zive = null;
for (let pokus = 1; pokus <= 3 && !zive; pokus++) {
  let b;
  try {
    b = await otevriProhlizec({ sirka: 1200, vyska: 900 });
    await b.page.goto('https://insolvence.justice.cz/kalkulator-splatek/', { waitUntil: 'domcontentloaded', timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    zive = [];
    for (const c of [ODD[0], ODD[1], ODD[6]]) {
      const r = await b.page.evaluate(({ mzda, deti }) => {
        const y = document.getElementById('year'); y.value = '012026';
        document.getElementById('deti').value = String(deti);
        document.getElementById('mzdacista').value = String(mzda);
        if (typeof kalkuluj === 'function') kalkuluj(); // jejich funkce; tlačítko na stránce váže id, které neexistuje
        return { sem1: document.getElementById('sem1')?.textContent, sem2: document.getElementById('sem2')?.textContent, sem3: document.getElementById('sem3')?.textContent, sem4: document.getElementById('sem4')?.textContent, maKalkuluj: typeof kalkuluj === 'function' };
      }, { mzda: c.mzdacista, deti: c.deti });
      zive.push({ popis: c.popis, ...r });
      log(`- ${c.popis}: splátka „${r.sem1}“, zůstane „${r.sem2}“, za 3 roky „${r.sem3}“, platné k „${r.sem4}“ (kalkuluj(): ${r.maKalkuluj})`);
    }
    // má jejich tlačítko „Přepočítat“ vůbec posluchač? (kalkul.js hledá #calculate-button, na stránce je #calculate)
    const chyby = b.zaznam.konzole.filter((k) => k.typ === 'pageerror').map((k) => k.text.slice(0, 160));
    log(`- chyby stránky v konzoli: ${JSON.stringify(chyby)}`);
  } catch (e) {
    log(`- pokus ${pokus}: nepodařilo se (${String(e).slice(0, 120)})`);
    zive = null;
  } finally { if (b) await b.zavri(); }
}

fs.writeFileSync(`${VYSTUP}uredni-kalkulacky.txt`, radky.join('\n') + '\n');
fs.writeFileSync(`${VYSTUP}uredni-kalkulacky.json`, JSON.stringify({ datum: new Date().toISOString(), exekuce: vysl, insolvence: vyslB, insolvenceZive: zive }, null, 1));
