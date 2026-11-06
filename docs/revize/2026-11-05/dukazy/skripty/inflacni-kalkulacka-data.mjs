// Kontrola dat: data/cpi.json aplikace vs. CSV ČSÚ stažená přímo z úředních adres (vlastní parser, bez kódu aplikace).
//   010022-25: https://csu.gov.cz/docs/107508/cfcf22e1-06b0-92a6-cf41-fb554acc545a/010022-25data011326.csv?version=1.0
//   CEN0101E : https://data.csu.gov.cz/opendata/sady/CEN0101E/distribuce/csv
// Spuštění: node inflacni-kalkulacka-data.mjs <010022-25.csv> <cen0101e.csv>   → dukazy/inflacni-kalkulacka/data-vs-csu.txt
// Porovnává (1) bazický index úhrn 2015 = 100 měsíc po měsíci, (2) meziroční inflaci spočtenou z cpi.json
// s oficiálním meziročním indexem ČSÚ (casz_kod C v 010022-25, TYPUDAJE4A IR v CEN0101E).
import fs from 'node:fs';
const [oldCsv, newCsv] = process.argv.slice(2);
const REPO = process.env.INF_REPO ?? '/tmp/revize/repos/inflacni-kalkulacka';
const cpi = JSON.parse(fs.readFileSync(`${REPO}/data/cpi.json`, 'utf8'));
const out = [];
const log = (s = '') => { out.push(s); console.log(s); };

function csv(text) { // jednoduchý RFC 4180 parser (uvozovky, čárky uvnitř, CRLF, BOM)
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  const rows = []; let row = [], f = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(f); f = ''; if (row.length > 1 || row[0] !== '') rows.push(row); row = []; }
    else f += c;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  const h = rows[0];
  return rows.slice(1).map((r) => Object.fromEntries(h.map((k, i) => [k, r[i] ?? ''])));
}
const yoyApp = (m) => { const p = `${Number(m.slice(0, 4)) - 1}${m.slice(4)}`; return p in cpi ? (cpi[m] / cpi[p] - 1) * 100 : null; };
const fmt = (x) => new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 3 }).format(x);

log(`# data/cpi.json vs. ČSÚ · ${new Date().toISOString()} · cpi.json ${Object.keys(cpi).length} měsíců`);

// ---- 010022-25 ----
const oldRows = csv(fs.readFileSync(oldCsv, 'utf8'));
const mm = (r) => `${r.rok}-${String(r.mesic).padStart(2, '0')}`;
const base15 = {}, yoyOff = {};
for (const r of oldRows) {
  if (r.stapro_kod !== '6134' || r.ucel_kod !== '' || !r.mesic) continue;
  if (r.casz_kod === 'Z' && r.bazobdobiod === '2015-01-01' && r.bazobdobido === '2015-12-31') base15[mm(r)] = Number(r.hodnota);
  if (r.casz_kod === 'C') yoyOff[mm(r)] = Number(r.hodnota) - 100; // meziroční index (stejný měsíc předchozího roku = 100)
}
const mOld = Object.keys(base15).sort();
let shod = 0, rozdil = [];
for (const m of mOld) { if (m in cpi && Math.abs(cpi[m] - base15[m]) < 1e-9) shod++; else rozdil.push(`${m}: app ${cpi[m]} ≠ ČSÚ ${base15[m]}`); }
log(`\n## 010022-25 (bazický index Z, úhrn, průměr 2015 = 100): ${mOld[0]} … ${mOld.at(-1)}, ${mOld.length} měsíců`);
log(`shoda s cpi.json: ${shod}/${mOld.length}${rozdil.length ? '; rozdíly: ' + rozdil.slice(0, 10).join('; ') : ''}`);
for (const m of ['1995-01', '2005-01', '2015-06', '2022-09', '2025-12']) log(`  ${m}: app ${cpi[m]} · ČSÚ ${base15[m]}`);

// meziroční: spočtená z cpi.json vs. oficiální C
const mY = Object.keys(yoyOff).sort().filter((m) => yoyApp(m) !== null);
let max = 0, maxM = '', nad01 = [], nad005 = 0;
const eras = {};
for (const m of mY) {
  const d = Math.abs(yoyApp(m) - yoyOff[m]);
  const era = m < '2005' ? '1996–2004' : m < '2015' ? '2005–2014' : '2015–2025';
  eras[era] = Math.max(eras[era] ?? 0, d);
  if (d > max) { max = d; maxM = m; }
  if (d > 0.05) nad005++;
  if (d > 0.15) nad01.push(`${m} (app ${fmt(yoyApp(m))} %, ČSÚ ${fmt(yoyOff[m])} %)`);
}
log(`\n## Meziroční inflace z cpi.json vs. oficiální meziroční index ČSÚ (casz_kod C), ${mY.length} měsíců ${mY[0]} … ${mY.at(-1)}`);
log(`největší rozdíl: ${fmt(max)} p. b. (${maxM}); po obdobích: ${Object.entries(eras).map(([e, d]) => `${e}: ${fmt(d)} p. b.`).join(', ')}`);
log(`měsíců s rozdílem > 0,05 p. b. (tj. po zaokrouhlení na 1 desetinné místo se může lišit): ${nad005}; > 0,15 p. b.: ${nad01.length}${nad01.length ? ' – ' + nad01.join('; ') : ''}`);
for (const m of ['2022-09', '2023-01', '2025-12']) log(`  ${m}: z cpi.json ${fmt(yoyApp(m))} % · ČSÚ oficiálně ${fmt(yoyOff[m])} %`);

// ---- CEN0101E ----
const newText = fs.readFileSync(newCsv, 'utf8');
const newRows = csv(newText);
const uhrn = newRows.filter((r) => r.IndicatorType === '6134' && r['CZCOICOP2.CZCOP1'] === '0' && r['CZCOICOP2.CZCOP23'] === '' && r.EKAKTIOCDS === '0' && r.UZ02P === 'CZ' && /^\d{4}-\d{2}$/.test(r.CASMKMQRM12));
const typy = {};
for (const r of uhrn) typy[r.TYPUDAJE4A] = r['Typ indexu'];
log(`\n## CEN0101E (DataStat): typy indexu u řádků úhrn/Česko/domácnosti celkem/měsíc: ${Object.entries(typy).map(([k, v]) => `${k} = „${v}“`).join('; ')}`);
const iz = {}, ir = {};
for (const r of uhrn) { if (r.TYPUDAJE4A === 'IZ2015') iz[r.CASMKMQRM12] = Number(r.Hodnota); if (r.TYPUDAJE4A === 'IR') ir[r.CASMKMQRM12] = Number(r.Hodnota) - 100; }
const mNew = Object.keys(iz).sort();
let shod2 = 0, roz2 = [];
for (const m of mNew) { if (m in cpi && Math.abs(cpi[m] - iz[m]) < 1e-9) shod2++; else roz2.push(`${m}: app ${cpi[m]} ≠ ČSÚ ${iz[m]}`); }
log(`IZ2015 (bazický 2015 = 100): ${mNew[0]} … ${mNew.at(-1)}, ${mNew.length} měsíců; shoda s cpi.json: ${shod2}/${mNew.length}${roz2.length ? '; rozdíly: ' + roz2.slice(0, 10).join('; ') : ''}`);
const chybi = Object.keys(cpi).filter((m) => !(m in base15) && !(m in iz));
log(`měsíce v cpi.json, které nejsou ani v jednom CSV: ${chybi.length ? chybi.join(', ') : 'žádné'}; poslední měsíc ČSÚ (IZ2015): ${mNew.at(-1)}, v aplikaci: ${Object.keys(cpi).sort().at(-1)}`);
log(`překryv 2015-01 … 2025-12 obou sad: ${mOld.filter((m) => m in iz).length} měsíců, rozdílných hodnot: ${mOld.filter((m) => m in iz && base15[m] !== iz[m]).length}`);
log(`\n## Meziroční inflace 2026 (z cpi.json vs. ČSÚ IR):`);
for (const m of mNew.filter((x) => x >= '2026-01')) log(`  ${m}: z cpi.json ${fmt(yoyApp(m))} % · ČSÚ IR ${fmt(ir[m])} %${Math.abs(yoyApp(m) - ir[m]) > 0.05 ? '  (rozdíl > 0,05 p. b.)' : ''}`);
log(`průměr roku 2015 v cpi.json: ${fmt(Object.keys(cpi).filter((m) => m.startsWith('2015')).reduce((s, m) => s + cpi[m], 0) / 12)}`);
fs.writeFileSync(new URL('../inflacni-kalkulacka/data-vs-csu.txt', import.meta.url), out.join('\n') + '\n');
