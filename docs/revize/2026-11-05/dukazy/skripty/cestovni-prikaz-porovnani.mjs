// Porovnání: nezávislá reference (cestovni-prikaz-prepocet.mjs) vs. výpočetní modul aplikace (cesty.js + rules.json).
// Spuštění: node cestovni-prikaz-porovnani.mjs  → zapíše ../cestovni-prikaz/prepocet.txt a vypíše tabulku.
// Spouštět 2× (dva nezávislé procesy) – skript přidá do výstupu otisk výsledků, aby šlo oba běhy porovnat.
import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { PRIPADY, spustReferenci, kc, refKVyplate } from './cestovni-prikaz-prepocet.mjs';

const REPO = '/tmp/revize/repos/cestovni-prikaz';
const VYSTUP = new URL('../cestovni-prikaz/prepocet.txt', import.meta.url).pathname;
const M = await import(`${REPO}/cesty.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));
const r26 = rules['2026'];

const H = (o = {}) => ({ firma: 'Test', zamestnanec: 'T', sfera: 'soukroma', vozidlo: { spz: 'X', druh: 'osobni', palivo: 'benzin95', spotreba: 6 }, ...o });
const cesta = (odjezd, navrat, km = 0, extra = {}) => M.spocitejCestu(H(extra.hlavicka), { odjezd, navrat, km, jidla: extra.jidla, cenaDoklad: extra.cenaDoklad, prives: extra.prives }, rules);
const st = (min, jidla = 0, hl = {}) => M.stravneDen(min, jidla, H(hl), r26).stravneHal;
const stCesta = (odjezd, navrat, jidla = {}, hl = {}) => cesta(odjezd, navrat, 0, { jidla, hlavicka: hl }).stravneHal;

// Stejné vstupy jako v referenci, volané přes veřejné API modulu aplikace.
const APP = {
  Z1: () => M.zakladniNahrada(100, r26.sazbaKm.osobni),
  Z2: () => M.nahradaPHM(100, 6, M.cenaPHM(r26, 'benzin95', '2026-03-15').cenaHal),
  Z3: () => stCesta('2026-03-15T06:00', '2026-03-15T19:00'),
  Z4: () => stCesta('2026-03-15T02:00', '2026-03-15T22:00'),
  Z5: () => stCesta('2026-03-15T08:00', '2026-03-15T12:00'),
  Z6: () => M.nahradaPHM(100, 18, M.cenaPHM(r26, 'elektrina', '2026-03-15').cenaHal),
  Z7: () => cesta('2027-01-10T07:00', '2027-01-10T15:00', 100).celkemHal,
  Z8: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', 100).celkemHal,
  V1: () => st(300), V2: () => st(299), V3: () => st(720), V4: () => st(721), V5: () => st(1080), V6: () => st(1081),
  V7: () => stCesta('2026-03-15T00:00', '2026-03-16T00:00'),
  V8: () => st(780, 1), V9: () => st(780, 3), V10: () => st(360, 1), V11: () => st(360, 2), V12: () => st(1200, 3),
  V13: () => st(360, 1, { kraceniPct: [50, 35, 25] }),
  V14: () => st(360, 1, { kraceniPct: [80, 35, 25] }),
  V15: () => st(780, 0, { sfera: 'verejna' }),
  V16: () => st(1200, 1, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }),
  V17: () => st(360, 2, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }),
  V18: () => st(780, 3, { sfera: 'verejna', stravneVerejna: [185, 284, 442] }),
  V19: () => st(360, 0, { sfera: 'verejna', stravneVerejna: [200, 284, 442] }),
  V20: () => M.nahradaPHM(100, 6, M.cenaPHM(r26, 'benzin95', '2026-09-30').cenaHal),
  V21: () => M.nahradaPHM(100, 6, M.cenaPHM(r26, 'benzin95', '2026-10-01').cenaHal),
  V22: () => M.nahradaPHM(100, 5, M.cenaPHM(r26, 'nafta', '2026-05-31').cenaHal),
  V23: () => M.nahradaPHM(100, 5, M.cenaPHM(r26, 'nafta', '2026-06-01').cenaHal),
  V24: () => M.nahradaPHM(100, 7, M.cenaPHM(r26, 'benzin98', '2026-07-01').cenaHal),
  V25: () => M.nahradaPHM(100, 6, M.cenaPHM(r26, 'benzin95', '2026-03-15', 38.9).cenaHal),
  V26: () => M.nahradaPHM(100, 18, M.cenaPHM(r26, 'elektrina', '2026-03-15', 6.5).cenaHal),
  V27: () => M.cenaPHM(r26, 'benzin95', '2026-03-15', 0).cenaHal,
  V28: () => M.zakladniNahrada(12.5, 5.9),
  V29: () => M.nahradaPHM(33.3, 6.4, 3470),
  V30: () => M.nahradaPHM(0.1, 5, 4100),
  V31: () => M.zakladniNahrada(50, r26.sazbaKm.jednostope),
  V32: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', 100, { prives: true }).zakladniHal,
  V33: () => M.zakladniNahrada(9999.9, 5.9),
  V34: () => M.nahradaPHM(9999.9, 6, 4180),
  V35: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', 0).celkemHal,
  V36: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', -5).celkemHal,
  V37: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', NaN).celkemHal,
  V38: () => cesta('2026-03-15T06:00', '2026-03-15T19:00', 100, { hlavicka: { vozidlo: { spz: 'X', druh: 'osobni', palivo: 'benzin95', spotreba: 0 } } }).celkemHal,
  V39: () => stCesta('2026-03-15T10:00', '2026-03-15T09:00'),
  V40: () => stCesta('', '2026-03-15T09:00'),
  V41: () => stCesta('2026-03-15T14:00', '2026-03-17T10:30', { '2026-03-16': 1 }),
  V42: () => stCesta('2026-03-15T08:00', '2026-03-16T00:00'),
  V43: () => stCesta('2026-03-15T20:00', '2026-03-16T02:00'),
  V44: () => stCesta('2026-03-15T06:00', '2026-03-16T00:30'),
  V45: () => stCesta('2026-03-15T22:00', '2026-03-16T11:00'),
  V46: () => stCesta('2026-03-15T19:00', '2026-03-16T10:00'),
  V47: () => stCesta('2026-03-15T21:00', '2026-03-16T09:00', { '2026-03-16': 1 }),
  V48: () => stCesta('2026-03-15T20:00', '2026-03-16T02:00', {}, { sfera: 'verejna' }),
  V49: () => stCesta('2026-02-28T22:00', '2026-03-01T04:00'),
  V50: () => stCesta('2026-12-31T20:00', '2027-01-01T08:00'),
  V51: () => stCesta('2025-12-31T06:00', '2025-12-31T19:00'),
  V52: () => M.souhrn([{ zakladniHal: 7375, phmHal: 7395, stravneHal: 15340, celkemHal: 30110 }, { zakladniHal: 59000, phmHal: 20820, stravneHal: 23600, celkemHal: 103420 }]).celkemHal,
  V53: () => M.souhrn([{ zakladniHal: 59000, phmHal: 20800, stravneHal: 23600, celkemHal: 103400 }]).celkemHal,
  V54: () => stCesta('2026-03-29T00:30', '2026-03-29T05:30'),
};
const APP_KVYPLATE = {
  Z8: () => M.souhrn([cesta('2026-03-15T06:00', '2026-03-15T19:00', 100)]).celkemKc,
  V52: () => M.souhrn([{ zakladniHal: 7375, phmHal: 7395, stravneHal: 15340, celkemHal: 30110 }, { zakladniHal: 59000, phmHal: 20820, stravneHal: 23600, celkemHal: 103420 }]).celkemKc,
  V53: () => M.souhrn([{ zakladniHal: 59000, phmHal: 20800, stravneHal: 23600, celkemHal: 103400 }]).celkemKc,
};

const ref = spustReferenci();
const radky = [];
let rozdily = 0;
for (const p of PRIPADY) {
  const r = ref.find((x) => x.id === p.id);
  let app;
  try { app = APP[p.id](); } catch (e) { app = `chyba (${e.name}): ${e.message}`; }
  const appText = typeof app === 'number' ? kc(app) : app;
  const refChyba = String(r.referenceHal).startsWith('chyba');
  const appChyba = String(app).startsWith('chyba');
  let shoda;
  if (refChyba || appChyba) shoda = refChyba && appChyba;
  else shoda = app === r.referenceHal;
  let kv = '';
  if (p.kVyplateKc) {
    const a = APP_KVYPLATE[p.id]();
    kv = ` · k výplatě: ref ${refKVyplate(r.referenceHal)} Kč, modul ${a} Kč${a === refKVyplate(r.referenceHal) ? '' : ' ≠'}`;
    if (a !== refKVyplate(r.referenceHal)) shoda = false;
  }
  if (!shoda) rozdily++;
  radky.push({ id: p.id, typ: p.typ, popis: p.popis, ref: r.reference, app: appText, shoda, kv });
}

const otisk = createHash('sha256').update(JSON.stringify(radky)).digest('hex').slice(0, 16);
const out = [];
out.push(`# Nezávislý přepočet – Cestovní příkaz 2027 (cestovni-prikaz @ bb4e580) · ${new Date().toISOString()} · node ${process.version}`);
out.push(`# Reference: cestovni-prikaz-prepocet.mjs (bez kódu aplikace). Modul: ${REPO}/cesty.js + rules.json.`);
out.push(`# Sloupce: ID | typ | můj výpočet | modul aplikace | shoda | popis`);
out.push('');
for (const r of radky) out.push(`${r.id}\t${r.typ}\t${r.ref}\t${r.app}\t${r.shoda ? 'shoda' : 'ROZDÍL'}\t${r.popis}${r.kv}`);
out.push('');
out.push(`Celkem ${radky.length} případů, shoda ${radky.length - rozdily}, rozdíl ${rozdily}: ${radky.filter((r) => !r.shoda).map((r) => r.id).join(', ') || '—'}`);
out.push(`Otisk výsledků (pro porovnání dvou běhů): ${otisk}`);
fs.writeFileSync(VYSTUP, out.join('\n') + '\n');
console.log(out.join('\n'));
