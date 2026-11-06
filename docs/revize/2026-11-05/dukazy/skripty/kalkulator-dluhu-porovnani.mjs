// Porovnání: můj referenční výpočet (kalkulator-dluhu-prepocet.mjs) vs. výpočetní modul aplikace (dluhy.js).
// Teprve tady se importuje kód aplikace (jen čtení z klonu, nic se v něm nemění).
// Spuštění: node kalkulator-dluhu-porovnani.mjs [beh]  → ../kalkulator-dluhu/prepocet.txt (+ prepocet-beh2.txt při beh=2)
import fs from 'node:fs';
import { P2026, PRIPADY, spocitejVse, kc, soucet, hranice, spravceMesicne, nezabavitelna } from './kalkulator-dluhu-prepocet.mjs';

const REPO = '/tmp/revize/repos/kalkulator-dluhu';
const VYSTUP = new URL('../kalkulator-dluhu/', import.meta.url).pathname;
const beh = process.argv[2] || '1';
const M = await import(`${REPO}/dluhy.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));
const p = M.pravidlaProRok(rules, 2026);

const radky = [];
const log = (s = '') => { radky.push(s); console.log(s); };
let shod = 0, neshod = 0;
const porovnej = (a, b) => {
  const ok = JSON.stringify(a) === JSON.stringify(b) || (typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) < 1e-6);
  ok ? shod++ : neshod++;
  return ok ? 'ano' : 'NE';
};

log(`# Nezávislý přepočet vs. modul aplikace · kalkulator-dluhu @ abb6c1c · ${new Date().toISOString()} · node ${process.version} · běh ${beh}`);
log(`# Parametry rules.json 2026: ŽM ${p.zivotniMinimum}, nájemné ${p.normativniNajemne}, paušál ${p.energetickyPausal}, ${p.procentoDluznik} %, 1/${p.jmenovatelNaOsobu}, ${p.nasobekHraniceDesetiny / 10}×, náhrada ${p.nahradaZamestnavateli}, správce ${p.odmenaSpravceMesicne}+${p.vydajeSpravceMesicne}, DPH ${p.dphProcenta}, ${p.delkaOddluzeniMesicu}/${p.delkaOpakovanehoOddluzeniMesicu} m, úrok ${p.urokZProdleniProcenta} %`);
log(`# Můj základ: součet ${soucet(P2026)} · NČ 0 os. ${nezabavitelna(P2026, 0)} (modul ${M.nezabavitelnaCastka(p, 0)}) · hranice ${hranice(P2026)} (modul ${M.hraniceBezOmezeni(p)}) · správce ${spravceMesicne(P2026)} (modul ${M.spravceMesicne(p)})`);
log(`# Varianta „praxe“ = část nad hranicí z nezaokrouhleného zbytku (shodně s úřední kalkulačkou exekuce.justice.cz, POST 5. 11. 2026: 50 001 Kč → 14 885 Kč); „literal“ = nejdřív celý zbytek dolů na dělitelný třemi.`);
log();
log('| Případ | Vstup | Můj výpočet (praxe) | Můj výpočet (literal) | Modul aplikace | Shoda modul = praxe |');
log('|---|---|---|---|---|---|');

for (const c of spocitejVse()) {
  const def = PRIPADY.find((x) => x.id === c.id);
  if (def.nc !== undefined) {
    for (const n of [].concat(def.nc)) {
      const moje = nezabavitelna(P2026, n); const mod = M.nezabavitelnaCastka(p, n);
      log(`| ${c.id} ${c.popis} | ${n} os. | NČ ${kc(moje)} | – | NČ ${kc(mod)} | ${porovnej(moje, mod)} |`);
    }
  }
  if (def.s) {
    for (const v of [].concat(def.s)) {
      const r = c.vysledky.find((x) => x.vstup === v);
      const mod = M.srazka(p, { cistaMzda: v.mzda, osoby: v.osoby, prednostni: v.prednostni, pocetExekuci: v.exekuci, duchodce: v.duchodce });
      const moje = { srazka: r.srazka, zustane: r.zustane, nahrada: r.nahrada, vericum: r.vericum, nc: r.nezabavitelna, doH: r.doHranice, nadH: r.nadHranici, dveTretiny: r.dveTretiny };
      const modK = { srazka: mod.srazka, zustane: mod.zustane, nahrada: mod.nahradaZamestnavateli, vericum: mod.vericiDostanou, nc: mod.nezabavitelna, doH: mod.doHranice, nadH: mod.nadHranici, dveTretiny: mod.dveTretiny };
      const vstup = `mzda ${typeof v.mzda === 'string' ? JSON.stringify(v.mzda) : v.mzda}, osoby ${v.osoby}${v.prednostni ? ', přednostní' : ''}${v.exekuci ? `, ${v.exekuci} ex.` : ''}${v.duchodce ? ', důchodce' : ''}`;
      const fmt = (o) => `srážka ${kc(o.srazka)}, zůstane ${kc(o.zustane)}, náhrada ${kc(o.nahrada)}, věřitelům ${kc(o.vericum)}, NČ ${kc(o.nc)}, do hranice ${kc(o.doH)}, nad ${kc(o.nadH)}, 2/3 ${o.dveTretiny}`;
      log(`| ${c.id} ${c.popis} | ${vstup} | ${fmt(moje)} | srážka ${kc(r.literal.srazka)}, nad ${kc(r.literal.nadHranici)} | ${fmt(modK)} | ${porovnej(moje, modK)} |`);
    }
  }
  if (def.d) {
    for (const v of [].concat(def.d)) {
      const r = c.vysledky.find((x) => x.vstup === v);
      const mod = M.dobaSplaceniExekuce({ dluh: v.dluh, mesicne: v.platba, rocniUrokProcent: v.sazbaRok ?? 0 });
      const moje = r.stav === 'ok' ? { mesicu: r.mesicu, uroky: Math.round(r.uroky), zaplaceno: Math.round(r.zaplaceno) } : r.stav === 'bez-dluhu' ? { mesicu: 0 } : { nesplatitelne: true, duvod: r.stav, urokMesicne: r.urokMesicne !== undefined ? Math.round(r.urokMesicne * 100) / 100 : undefined, rustZaRok: r.rustZaRok !== undefined ? Math.round(r.rustZaRok) : undefined };
      const modK = mod.nesplatitelne ? { nesplatitelne: true, duvod: mod.duvod === 'zadna-srazka' ? 'zadna-splatka' : mod.duvod === 'urok-vyssi-nez-splatka' ? 'urok-vyssi' : mod.duvod, urokMesicne: mod.urokMesicne !== undefined ? Math.round(mod.urokMesicne * 100) / 100 : undefined, rustZaRok: mod.rustZaRok !== undefined ? Math.round(mod.rustZaRok) : undefined } : mod.mesicu === 0 ? { mesicu: 0 } : { mesicu: mod.mesicu, uroky: Math.round(mod.uroky), zaplaceno: Math.round(mod.zaplacenoCelkem) };
      const vzorec = r.vzorec !== undefined ? ` (vzorec ${r.vzorec} m)` : '';
      log(`| ${c.id} ${c.popis} | dluh ${kc(v.dluh)}, splátka ${kc(v.platba)}, úrok ${v.sazbaRok ?? 0} % | ${JSON.stringify(moje)}${vzorec} | – | ${JSON.stringify(modK)} | ${porovnej(moje, modK)} |`);
    }
  }
  if (def.o) {
    for (const v of [].concat(def.o)) {
      const r = c.vysledky.find((x) => x.vstup === v);
      const mod = M.oddluzeni(p, { cistaMzda: v.mzda, osoby: v.osoby, dluh: v.dluh, drivejsiOdpusteni: v.odpusteni });
      const moje = { splatka: r.splatka, zustane: r.zustane, spravce: r.spravce, vericum: r.vericum, delka: r.delka, mesicu: r.mesicu, zaplaceno: r.zaplaceno, odpusteno: r.odpusteno, mira: Math.round(r.mira * 1000) / 1000, minimum: r.minimum, splnuje: r.splnujeMinimum, lze: r.lzePovolit };
      const modK = { splatka: mod.splatka, zustane: mod.zustane, spravce: mod.spravce, vericum: mod.vericumMesicne, delka: mod.delkaMesicu, mesicu: mod.mesicu, zaplaceno: mod.zaplacenoVericum, odpusteno: mod.odpusteno, mira: Math.round(mod.miraUspokojeni * 1000) / 1000, minimum: mod.minimum, splnuje: mod.splnujeMinimum, lze: mod.lzePovolit };
      log(`| ${c.id} ${c.popis} | mzda ${v.mzda}, osoby ${v.osoby}, dluh ${kc(v.dluh)}, ${v.odpusteni} | ${JSON.stringify(moje)} | – | ${JSON.stringify(modK)} | ${porovnej(moje, modK)} |`);
    }
  }
  if (def.u) {
    for (const r of c.vysledky) {
      const mod = r.vstup >= '2026-07-01' ? p.urokZProdleniProcenta : r.vstup >= '2026-01-01' ? 11.5 : null; // aplikace zná jen 2026 (rules.json popis: 1. pololetí 11,50 %)
      log(`| ${c.id} úrok z prodlení | prodlení od ${r.vstup} | ${r.urok} % (repo ${r.repo} % + 8) | – | ${mod === null ? 'aplikace nenabízí (výchozí 11,75 %)' : mod + ' %'} | ${mod === null ? '— (viz DLU nález o výchozí sazbě)' : porovnej(r.urok, mod)} |`);
    }
  }
}

log();
log(`# Shod ${shod} · neshod ${neshod}`);
// Kontrola roku 2027 a výběru roku
let chyba2027 = '';
try { M.pravidlaProRok(rules, 2027); } catch (e) { chyba2027 = e.message; }
log(`# pravidlaProRok(2027): ${chyba2027 ? 'odmítnuto: ' + chyba2027 : 'PROŠLO (chyba!)'} · nejnovejsiPlatnyRok(2026)=${M.nejnovejsiPlatnyRok(rules, 2026)} · (2027)=${M.nejnovejsiPlatnyRok(rules, 2027)} · (2025)=${M.nejnovejsiPlatnyRok(rules, 2025)}`);
// Kontrola: modul s textovým vstupem (jak by přišel z formuláře bez parsování)
const txt = M.srazka(p, { cistaMzda: '23 000', osoby: 0 });
log(`# srazka(cistaMzda: "23 000") → mzda ${txt.cistaMzda}, srážka ${txt.srazka} (modul Number("23 000") = NaN → 0; formulář parsuje sám v app.js cislo())`);

fs.writeFileSync(`${VYSTUP}prepocet${beh === '1' ? '' : '-beh' + beh}.txt`, radky.join('\n') + '\n');
