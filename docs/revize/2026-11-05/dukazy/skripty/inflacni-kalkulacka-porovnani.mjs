// Porovnání: referenční výpočet (inflacni-kalkulacka-prepocet.mjs, bez kódu aplikace) vs. výpočetní modul
// aplikace /tmp/revize/repos/inflacni-kalkulacka/inflation.js se stejnými vstupy.
// Výstup: dukazy/inflacni-kalkulacka/prepocet.txt (druhý běh = nový proces, sekce se připojí → „reprodukováno 2×“).
// app.js importovat nejde (při načtení sahá na DOM), proto jsou kontroly vstupu a parsování z app.js
// opsány s odkazem na řádek a znovu ověřeny v prohlížeči (inflacni-kalkulacka-prohlizec.mjs).
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { PRIPADY, spocitej, popisVystupu, REPO } from './inflacni-kalkulacka-prepocet.mjs';

const inf = await import(`${REPO}/inflation.js`);
const cpi = JSON.parse(readFileSync(`${REPO}/data/cpi.json`, 'utf8'));
const series = inf.createSeries(cpi);
const vystup = new URL('../inflacni-kalkulacka/prepocet.txt', import.meta.url).pathname;

// opsáno z app.js:26 a z kontrol v app.js:85, 109–110, 131 (UI vrstva, mimo modul)
const parseInputApp = (s) => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'));

function modul(c) {
  const v = c.vstup;
  switch (c.druh) {
    case 'prepocet': {
      let i0 = v.iOd, i1 = v.iDo, n = v.n, chrono;
      if (v.od) {
        const r0 = inf.resolveMonth(series, v.od).month, r1 = inf.resolveMonth(series, v.do).month;
        i0 = series.index(r0); i1 = series.index(r1); n = Math.abs(inf.monthsBetween(r0, r1));
      }
      const vysledek = inf.convert(v.castka, i0, i1);
      const kumulativni = inf.cumulativeInflation(i0, i1);
      // směr jako app.js:94–96 (průměr se počítá chronologicky)
      chrono = v.od && v.od > v.do ? 1 / (1 + kumulativni) - 1 : kumulativni;
      const prumRocni = n > 0 ? inf.annualizedInflation(1, 1 + chrono, n) : 0;
      return { vysledek, kumulativni, mesicu: n ?? 0, prumRocni };
    }
    case 'vynos': {
      if (v.nominal !== undefined) return { realny: inf.realReturn(v.nominal, v.inflace) };
      const r0 = inf.resolveMonth(series, v.od).month, r1 = inf.resolveMonth(series, v.do).month;
      const mesicu = inf.monthsBetween(r0, r1);
      const inflace = inf.cumulativeInflation(series.index(r0), series.index(r1));
      const nominal = v.typ === 'pa' ? inf.nominalForPeriod(v.sazba, mesicu) : v.sazba;
      const realny = inf.realReturn(nominal, inflace);
      return { mesicu, nominal, inflace, realny, realnyPa: inf.annualize(realny, mesicu) };
    }
    case 'mzda': {
      let i0 = v.i0, i1 = v.i1;
      if (v.od) { i0 = series.index(inf.resolveMonth(series, v.od).month); i1 = series.index(inf.resolveMonth(series, v.do).month); }
      return { realnaZmena: inf.realWageChange(v.m0, v.m1, i0, i1), nominalne: v.m1 / v.m0 - 1, ceny: inf.cumulativeInflation(i0, i1), potrebnaMzda: inf.convert(v.m0, i0, i1) };
    }
    case 'omez': { const r = inf.resolveMonth(series, v.mesic); return { mesic: r.month, poznamka: r.clamped === 'after' ? 'po konci dat' : r.clamped === 'before' ? 'před začátkem dat' : null }; }
    case 'meziroc': return { meziroc: inf.yoySeries(series, v.mesic, v.mesic)[0].value };
    case 'parse': { const n = parseInputApp(v.text); return { cislo: !(n >= 0) ? 'chyba' : n }; }   // app.js:26 + kontrola app.js:85
    case 'chyba': {
      if (v.sazba !== undefined) return { stav: (!Number.isFinite(v.sazba) || v.sazba <= -1) ? 'chyba' : `modul realReturn=${inf.realReturn(v.sazba, 0.02)}` }; // app.js:109
      if (v.od) return { stav: inf.monthsBetween(v.od, v.do) <= 0 ? 'chyba' : 'projde' };   // app.js:110
      if (v.m0 !== undefined) return { stav: !(v.m0 > 0) ? 'chyba' : 'projde' };            // app.js:131; modul: realWageChange(0,…) = Infinity
      return { stav: '?' };
    }
    default: throw new Error(c.druh);
  }
}

const stejne = (a, b) => (typeof a === 'number' && typeof b === 'number') ? Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a)) : String(a) === String(b);
const radky = [];
const log = (s = '') => radky.push(s);
log(`# Inflační kalkulačka – nezávislý přepočet vs. modul aplikace · ${new Date().toISOString()} · pid ${process.pid} · node ${process.version}`);
log(`# modul: ${REPO}/inflation.js · data: data/cpi.json (${series.first} … ${series.last}, ${series.months.length} měsíců)`);
log('');
log('| ID | Typ | Případ | Vstup | Můj výpočet | Modul aplikace | Shoda |');
log('|---|---|---|---|---|---|---|');
let shod = 0, neshod = 0;
for (const c of PRIPADY) {
  const muj = spocitej(c).vystupy;
  const m = modul(c);
  const rozdily = Object.keys(muj).filter((k) => !stejne(muj[k], m[k]));
  const ok = rozdily.length === 0;
  ok ? shod++ : neshod++;
  log(`| ${c.id} | ${c.typ} | ${c.popis} | ${JSON.stringify(c.vstup)} | ${popisVystupu(muj)} | ${popisVystupu(m)} | ${ok ? 'ano' : 'NE (' + rozdily.join(', ') + ')'} |`);
}
log('');
log(`Shod: ${shod} · neshod: ${neshod} z ${PRIPADY.length}`);
log('Poznámka: P3 „10.000“ – referenční čtení tečku odmítá (nejednoznačná), app.js:26 ji bere jako desetinnou → 10 Kč; P5 „-5“ – app.js:85 odmítá záporné (správně), referenční ctiCislo jen parsuje.');
const text = radky.join('\n') + '\n';
if (existsSync(vystup) && process.env.PREPOCET_APPEND === '1') appendFileSync(vystup, '\n---- druhý běh (nový proces) ----\n' + text); else writeFileSync(vystup, text);
console.log(text);
