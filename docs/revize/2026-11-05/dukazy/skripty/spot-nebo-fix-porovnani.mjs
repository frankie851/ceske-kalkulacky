// Porovnání nezávislého přepočtu (spot-nebo-fix-prepocet.mjs) s výpočetním modulem aplikace (calc.js).
// Spuštění: node spot-nebo-fix-porovnani.mjs [cesta ke klonu]  → zapíše ../spot-nebo-fix/prepocet.txt a prepocet.json
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import * as R from './spot-nebo-fix-prepocet.mjs';

const REPO = R.REPO;
const OUT = new URL('../spot-nebo-fix/', import.meta.url).pathname;
const calc = await import(pathToFileURL(path.join(REPO, 'calc.js')).href);
const tariffs = JSON.parse(fs.readFileSync(path.join(REPO, 'tariffs.json'), 'utf8'));
const dyn = JSON.parse(fs.readFileSync(path.join(REPO, 'dynamic.json'), 'utf8'));
const product = dyn.products[dyn.default];
const VAT = tariffs.vat.value;
const net = (x) => x / (1 + VAT);

/** Spustí modul aplikace stejně, jako to dělá app.js (recalc): vstupy vč. DPH → net → computeVariants. */
export function modulVarianty({ grid, spotEur, fx, pct, tdd, mwh, distributor, sazba, jistic, fix, marze, poplFix = 163.35, poplSpot = 163.35, dynBase = 3900, dynFee = 163.35, shift = 0, cons = null }) {
  const c = cons ?? calc.consumptionProfile(mwh, tdd);
  const regulated = calc.regulatedFor(tariffs, grid, distributor, sazba, jistic);
  const r = calc.computeVariants({
    grid, cons: c, spotEur, fx, vat: VAT, regulated,
    fix: { price: net(fix), monthlyFee: net(poplFix) }, spot: { margin: net(marze), monthlyFee: net(poplSpot) },
    dynamic: { base: net(dynBase), pct, monthlyFee: net(dynFee) }, shiftPct: shift,
  });
  const map = (v) => ({ celkem: v.total, energie: v.energy, regulovane: v.regulated, stale: v.fixedFees, mwh: v.totalMWh });
  return { fix: map(r.variants.fix), spot: map(r.variants.spot), dynamic: map(r.variants.dynamic) };
}

export function kontextModulu(repo = REPO) {
  const meta = JSON.parse(fs.readFileSync(path.join(repo, 'data/meta.json'), 'utf8'));
  const prices = JSON.parse(fs.readFileSync(path.join(repo, 'data/prices.json'), 'utf8'));
  const fxj = JSON.parse(fs.readFileSync(path.join(repo, 'data/fx.json'), 'utf8'));
  const grid = calc.buildQuarterGrid(meta.from, meta.to);
  const spotEur = Object.keys(prices.days).sort().flatMap((d) => prices.days[d]);
  const fx = grid.map((q) => fxj.rates[q.date]);
  const pct = calc.dynamicPctPerQuarter(grid, product);
  const tdd = (k) => JSON.parse(fs.readFileSync(path.join(repo, 'data/tdd', `${k}.json`), 'utf8')).values;
  return { grid, spotEur, fx, pct, tdd, meta };
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { pripady: P } = R.pripady(REPO);
  const K = kontextModulu(REPO);
  const byId = Object.fromEntries(P.map((p) => [p.id, p]));
  const rows = [];
  const fmt = (x) => (typeof x === 'number' ? (Number.isInteger(x) ? String(x) : x.toFixed(2)) : JSON.stringify(x));
  const blizko = (a, b, eps = 0.01) => typeof a === 'number' && typeof b === 'number' && Math.abs(a - b) <= eps;
  const row = (id, vstup, muj, modul, shoda, pozn = '') => rows.push({ id, vstup, muj, modul, shoda, pozn });
  const tri = (id, label, muj, modul, pozn) => {
    for (const v of ['fix', 'spot', 'dynamic']) {
      const ok = blizko(muj[v].celkem, modul[v].celkem) && blizko(muj[v].energie, modul[v].energie) && blizko(muj[v].regulovane, modul[v].regulovane) && blizko(muj[v].stale, modul[v].stale);
      row(`${id} ${v}`, label, `celkem ${fmt(muj[v].celkem)} (energie ${fmt(muj[v].energie)}, regul. ${fmt(muj[v].regulovane)}, stálé ${fmt(muj[v].stale)})`,
        `celkem ${fmt(modul[v].celkem)} (energie ${fmt(modul[v].energie)}, regul. ${fmt(modul[v].regulovane)}, stálé ${fmt(modul[v].stale)})`, ok, pozn);
    }
  };

  // Z1–Z3 jednoduché příklady
  { const p = byId.Z1; const cons = [1.5, 1.5];
    const m = calc.energyFix(cons, 3000) + calc.regulatedVariable(cons, null, 2515.08, 0, 0);
    row('Z1', p.popis, fmt(p.muj.castka), fmt(m), blizko(p.muj.castka, m)); }
  { const p = byId.Z2; const m = calc.energySpot([0.5, 0.5], [100, 0], [25, 25]); row('Z2', p.popis, fmt(p.muj.castka), fmt(m), blizko(p.muj.castka, m)); }
  { const p = byId.Z3; const m = calc.energyDynamic([0.7, 0.3], [-50, -50], 3900); row('Z3', p.popis, fmt(p.muj.castka), fmt(m), blizko(p.muj.castka, m)); }
  { const p = byId.Z4; const m = p.vstup.dny.map(calc.quartersInDay); const g = calc.buildQuarterGrid(K.meta.from, K.meta.to).length;
    row('Z4', p.popis + ' ' + p.vstup.dny.join(', '), JSON.stringify(p.muj.ctvrthodin) + ` mřížka ${p.muj.mrizkaCelkem}`, JSON.stringify(m) + ` mřížka ${g}`, JSON.stringify(m) === JSON.stringify(p.muj.ctvrthodin) && g === p.muj.mrizkaCelkem); }
  { const p = byId.Z5; const ms = Object.fromEntries(p.vstup.tridy.map((k) => [k, calc.sum(calc.normalize(K.tdd(k)))]));
    const ok = p.vstup.tridy.every((k) => blizko(ms[k], 1, 1e-9) && blizko(p.muj.soucty[k], 1, 1e-9) && p.muj.delky[k] === K.grid.length);
    row('Z5', p.popis, `součty 1 ± 1e-9 (${p.vstup.tridy.length} tříd), délky ${p.muj.mrizka}`, `součty ${Object.values(ms).map((v) => v.toFixed(12)).join(', ')}`, ok); }

  // V1 hlavní případ + posun
  const V1 = { ...K, tdd: K.tdd('TDD4'), mwh: 3, distributor: 'cez', sazba: 'D02d', jistic: '3x25', fix: 3000, marze: 400 };
  const m1 = modulVarianty(V1);
  tri('V1', byId.V1.popis, byId.V1.muj, m1);
  { const a = modulVarianty({ ...V1, shift: 0 }), b = modulVarianty(V1); row('Z6', byId.Z6.popis, String(byId.Z6.muj.shodne), String(JSON.stringify(a) === JSON.stringify(b)), byId.Z6.muj.shodne && JSON.stringify(a) === JSON.stringify(b)); }
  { const m10 = modulVarianty({ ...V1, shift: 10 }), m30 = modulVarianty({ ...V1, shift: 30 }), m50 = modulVarianty({ ...V1, shift: 50 }); const p = byId.Z7.muj;
    row('Z7 MWh', 'posun 10/30 %: roční spotřeba spotu', `${p.mwh10.toFixed(9)} / ${p.mwh30.toFixed(9)}`, `${m10.spot.mwh.toFixed(9)} / ${m30.spot.mwh.toFixed(9)}`, blizko(p.mwh10, 3, 1e-9) && blizko(m10.spot.mwh, 3, 1e-9) && blizko(m30.spot.mwh, 3, 1e-9));
    row('Z7 spot', 'posun 10 % / 30 %: celkem spot (musí klesat)', `${fmt(p.spot10)} / ${fmt(p.spot30)}`, `${fmt(m10.spot.celkem)} / ${fmt(m30.spot.celkem)}`, blizko(p.spot10, m10.spot.celkem) && blizko(p.spot30, m30.spot.celkem) && m30.spot.celkem < m10.spot.celkem && m10.spot.celkem < m1.spot.celkem);
    row('Z7 ořez', 'posun 50 % = posun 30 % (ořez na max.)', String(p.spot50rovnoSpot30), String(m50.spot.celkem === m30.spot.celkem), p.spot50rovnoSpot30 && m50.spot.celkem === m30.spot.celkem);
    row('Z7 fix', 'posun 30 % nemění fix', fmt(p.fix30), fmt(m30.fix.celkem), blizko(p.fix30, m30.fix.celkem) && blizko(m30.fix.celkem, m1.fix.celkem));
    tri('V1b', byId.V1b.popis, byId.V1b.muj, m30); }

  // V2 tepelné čerpadlo – mapování TDD
  const V2 = { ...K, tdd: K.tdd('TDD6'), mwh: 9, distributor: 'egd', sazba: 'D56d', jistic: '3x25', fix: 3500, marze: 400 };
  tri('V2', byId.V2.popis, byId.V2.muj, modulVarianty(V2), `aplikace mapuje D56d → ${tariffs.sazbyInfo.D56d.tdd}`);
  tri('V2z', byId.V2z.popis, byId.V2z.muj, modulVarianty({ ...V2, tdd: K.tdd('TDD7') }), 'modul s profilem TDD7 (správná třída); aplikace ho pro D56d nepoužije');
  row('V2z rozdíl', 'dopad mapování TDD6→TDD7 u EG.D D56d 9 MWh (můj výpočet): spot / dyn / fix; spot−fix (aplikace) vs. (vyhláška)',
    `${fmt(byId.V2z.rozdilProtiV2.spot)} / ${fmt(byId.V2z.rozdilProtiV2.dynamic)} / ${fmt(byId.V2z.rozdilProtiV2.fix)}; ${fmt(byId.V2z.rozdilProtiV2.spotMinusFixApp)} vs. ${fmt(byId.V2z.rozdilProtiV2.spotMinusFixLaw)}`, '—', false, 'nález: tariffs.json sazbyInfo D45d/D56d/D57d → TDD6, D61d → TDD7; příloha 6 vyhl. 408/2015 Sb.: D45d/D56d/D57d → TDD7, D61d → TDD4, D35d → TDD6');
  { const m6 = modulVarianty({ ...K, tdd: K.tdd('TDD6'), mwh: 9, distributor: 'cez', sazba: 'D57d', jistic: '3x25', fix: 3500, marze: 400 });
    tri('V2c', byId.V2c.popis, byId.V2c.muj, m6, `rozdíl TDD7−TDD6 (můj): spot ${fmt(byId.V2c.rozdil.spot)}, dyn ${fmt(byId.V2c.rozdil.dynamic)}, fix ${fmt(byId.V2c.rozdil.fix)}`); }
  row('TDD mapování', 'tariffs.json sazbyInfo.*.tdd vs. příloha č. 6 vyhlášky 408/2015 Sb.', JSON.stringify(R.TRIDA_TDD), JSON.stringify(Object.fromEntries(Object.entries(tariffs.sazbyInfo).map(([k, v]) => [k, v.tdd]))),
    Object.entries(R.TRIDA_TDD).every(([k, v]) => tariffs.sazbyInfo[k]?.tdd === v));

  // V3 PRE D25d 1x25
  tri('V3', byId.V3.popis, byId.V3.muj, modulVarianty({ ...K, tdd: K.tdd('TDD5-P'), mwh: 2, distributor: 'pre', sazba: 'D25d', jistic: '1x25', fix: 2900, marze: 300, poplFix: 100, poplSpot: 120 }));

  // V4 D61d
  { const m = modulVarianty({ ...K, tdd: K.tdd('TDD7'), mwh: 2, distributor: 'cez', sazba: 'D61d', jistic: '3x25', fix: 3000, marze: 400 });
    tri('V4', byId.V4.popis, byId.V4.muj, m, `modul s okny aplikace + TDD7; podíl NT čtvrthodin ERÚ ${(byId.V4.podilNTeru * 100).toFixed(1)} % vs. aplikace ${(byId.V4.podilNTapp * 100).toFixed(1)} %`);
    tri('V4 (konfigurace aplikace)', 'tentýž vstup, můj výpočet s okny a TDD7 aplikace (kontrola aritmetiky)', byId.V4.aplikaceOknaATdd7, m, `regulované složky aplikace nižší o ${fmt(byId.V4.rozdilRegulovane * -1)} Kč/rok`); }

  // V5–V7 hraniční vstupy
  { const z = modulVarianty({ ...V1, mwh: 0 }); row('V5', byId.V5.popis, fmt(byId.V5.muj.fixCelkem), fmt(z.fix.celkem), blizko(byId.V5.muj.fixCelkem, z.fix.celkem), 'app.js num(): prázdné/záporné → 0, pak Math.max(0,1; …) → 0,1 MWh'); }
  { const z = modulVarianty({ ...V1, mwh: 100 }); row('V6', byId.V6.popis, fmt(byId.V6.muj.fixEnergie), fmt(z.fix.energie), blizko(byId.V6.muj.fixEnergie, z.fix.energie)); }
  { const z = modulVarianty({ ...V1, mwh: -1 }); row('V7', byId.V7.popis, fmt(byId.V7.muj.fixEnergie), fmt(z.fix.energie), blizko(byId.V7.muj.fixEnergie, z.fix.energie), 'modul záporný vstup nehlídá (stejně jako můj výpočet); v UI blokuje num()'); }
  { let err = ''; try { calc.regulatedFor(tariffs, K.grid, 'cez', 'D99d', '3x25'); } catch (e) { err = e.message; } row('V7b', 'neznámá sazba → modul vyhodí chybu', 'chyba', err || 'bez chyby', !!err); }

  // V8 pásma dyn. tarifu
  { const cena = (g, i) => 3900 * (1 + calc.dynamicPctPerQuarter(g, product)[i] / 100);
    const g1 = calc.buildQuarterGrid('2026-10-25', '2026-10-25'), g2 = calc.buildQuarterGrid('2026-03-29', '2026-03-29'), g3 = calc.buildQuarterGrid('2026-07-06', '2026-07-06'), g4 = calc.buildQuarterGrid('2026-07-07', '2026-07-07'), g5 = calc.buildQuarterGrid('2026-01-05', '2026-01-05');
    const idx2 = g1.map((q, i) => (q.hour === 2 ? i : -1)).filter((i) => i >= 0);
    const m = { delka2510: g1.length, hod2count: idx2.length, cena2510h2: [...new Set(idx2.map((i) => cena(g1, i)))], delka2903: g2.length, hod2chybi: !g2.some((q) => q.hour === 2),
      svatek6h: cena(g3, g3.findIndex((q) => q.hour === 6)), pracovni6h: cena(g4, g4.findIndex((q) => q.hour === 6)), zima12h: cena(g5, g5.findIndex((q) => q.hour === 12)), leto12h: cena(g3, g3.findIndex((q) => q.hour === 12)) };
    row('V8', byId.V8.popis, JSON.stringify(byId.V8.muj), JSON.stringify(m), JSON.stringify(byId.V8.muj) === JSON.stringify(m)); }
  // Celoroční shoda pásem: moje cena vs. modul pro každou čtvrthodinu
  { const grid = K.grid; const mine = R.mrizka(K.meta.from, K.meta.to); let diff = 0;
    for (let i = 0; i < grid.length; i++) if (R.dynCenaSDph(mine[i]) !== Math.round(3900 * (1 + K.pct[i] / 100) * 100) / 100) diff++;
    row('V8b', 'cena pásma dyn. tarifu pro všech 35 040 čtvrthodin (moje pásma z PDF ČEZ vs. dynamic.json)', '0 rozdílů', `${diff} rozdílů`, diff === 0); }
  // Mřížka: hodina a příznak víkend/svátek pro každou čtvrthodinu
  { const grid = K.grid; const mine = R.mrizka(K.meta.from, K.meta.to); let diff = 0;
    for (let i = 0; i < grid.length; i++) if (grid[i].date !== mine[i].date || grid[i].hour !== mine[i].hour || grid[i].minute !== mine[i].minute || !!grid[i].weekend !== mine[i].volno) diff++;
    row('Mřížka', 'datum, hodina, minuta a víkend/svátek všech 35 040 čtvrthodin', '0 rozdílů', `${diff} rozdílů`, diff === 0); }

  // V9, V10
  { const g = calc.buildQuarterGrid('2028-02-28', '2028-03-01'); row('V9', byId.V9.popis, `${byId.V9.muj.ctvrthodin}; ${byId.V9.muj.dny.join(', ')}`, `${g.length}; ${calc.eachDay('2028-02-28', '2028-03-01').join(', ')}`, g.length === byId.V9.muj.ctvrthodin && g.length === 288); }
  { const h26 = [...calc.czechHolidays(2026)].sort(), h27 = [...calc.czechHolidays(2027)].sort();
    row('V10', byId.V10.popis, byId.V10.muj[2026].join(' ') + ' | ' + byId.V10.muj[2027].join(' '), h26.join(' ') + ' | ' + h27.join(' '), JSON.stringify(h26) === JSON.stringify(byId.V10.muj[2026]) && JSON.stringify(h27) === JSON.stringify(byId.V10.muj[2027]) && calc.easterSunday(2027) === byId.V10.muj.velikonoce2027); }
  row('V11', byId.V11.popis, JSON.stringify(byId.V11.muj), '— (datový soubor, modul nepočítá)', byId.V11.muj.sobotyShodne === byId.V11.muj.sobotyCelkem);
  { const m = [calc.pozeAnnual(3, { perMWh: 495, monthly: 8.32 * 75 }), calc.pozeAnnual(20, { perMWh: 495, monthly: 8.32 * 75 }), calc.pozeAnnual(3, { perMWh: 495, monthly: 0 })];
    row('V12', byId.V12.popis, `${byId.V12.muj.poze3MWh} / ${byId.V12.muj.poze20MWh} / ${byId.V12.muj.poze2026}`, m.join(' / '), m[0] === byId.V12.muj.poze3MWh && m[1] === byId.V12.muj.poze20MWh && m[2] === 0); }

  // CSV – jen modul (očekávání z definice)
  { const cases = [['1 500,5', 1500.5], ['1.500,50', 1500.5], ['1500.50', 1500.5], ['0,25', 0.25], ['1 500', 1500], ['abc', NaN], ['', NaN], ['-0,5', -0.5]];
    const res = cases.map(([s, e]) => { const v = calc.parseNumber(s); return `${JSON.stringify(s)}→${v}${Object.is(v, e) || (Number.isNaN(e) && Number.isNaN(v)) ? '' : ' ≠ ' + e}`; });
    row('CSV čísla', 'parseNumber: české desetinné čárky a mezery', cases.map(([s, e]) => `${JSON.stringify(s)}→${e}`).join(', '), res.join(', '), cases.every(([s, e]) => { const v = calc.parseNumber(s); return Object.is(v, e) || (Number.isNaN(e) && Number.isNaN(v)); })); }
  { const t = ['05.01.2026 00:15', '5. 1. 2026 0:15', '2026-01-05 00:15', '2026-01-05T00:15:00', '2026-01-05T00:15:00Z', '2026-01-05T24:00', '5.1.2026', 'nesmysl'];
    const m = t.map((s) => `${JSON.stringify(s)}→${JSON.stringify(calc.parseTime(s))}`);
    row('CSV čas', 'parseTime: formáty; 24:00 → další den; Z → převod do Prahy (1:15)', '—', m.join('; '), calc.parseTime('2026-01-05T00:15:00Z')?.min === 75 && calc.parseTime('2026-01-05T24:00')?.date === '2026-01-06' && calc.parseTime('nesmysl') === null); }
  { const grid = calc.buildQuarterGrid('2026-01-05', '2026-01-06'); const tdd = grid.map(() => 1);
    const text = 'Datum a čas;Spotřeba [kWh]\n05.01.2026 00:15;0,25\n05.01.2026 00:30;1 000,5\n05.01.2026 00:45;0,5\n';
    const { rows: rws } = calc.parseCsv(text); const r = calc.profileFromCsv(rws, { timeCol: 0, valueCol: 1, timeIsEnd: true, unit: 'kWh' }, grid, tdd);
    row('CSV čárka', 'CSV se středníkem a čárkou: 0,25 / 1 000,5 / 0,5 kWh → MWh v 1.–3. čtvrthodině', '0,00025 / 1,0005 / 0,0005; matched 3', `${r.cons[0]} / ${r.cons[1]} / ${r.cons[2]}; matched ${r.matched}`, blizko(r.cons[1], 1.0005, 1e-12) && r.matched === 3);
    let e1 = '', e2 = '', e3 = '';
    try { calc.profileFromCsv(calc.parseCsv('toto není csv\nabc;def\n').rows, { timeCol: 0, valueCol: 1, timeIsEnd: true, unit: 'kWh' }, grid, tdd); } catch (e) { e1 = e.message; }
    try { calc.profileFromCsv(calc.parseCsv('t;v\n05.01.2026 00:10;1\n05.01.2026 00:20;1\n05.01.2026 00:30;1\n').rows, { timeCol: 0, valueCol: 1, timeIsEnd: true, unit: 'kWh' }, grid, tdd); } catch (e) { e2 = e.message; }
    try { calc.profileFromCsv(calc.parseCsv('t;v\n05.03.2026 00:15;1\n').rows, { timeCol: 0, valueCol: 1, timeIsEnd: true, unit: 'kWh' }, grid, tdd); } catch (e) { e3 = e.message; }
    row('CSV chyby', 'špatný formát / interval 10 min / mimo období → srozumitelná chyba', 'chyba, chyba, chyba', `„${e1}“ / „${e2}“ / „${e3}“`, !!e1 && !!e2 && !!e3); }

  // Výstup
  const lines = [];
  lines.push(`# Spot, nebo fix? – nezávislý přepočet vs. modul aplikace (calc.js) · ${new Date().toISOString()} · klon ${REPO}`);
  lines.push(`# Data: ${K.meta.from} – ${K.meta.to}, ${K.grid.length} čtvrthodin. Vstupy uživatele vč. DPH; částky v Kč vč. DPH, nezaokrouhleno.`);
  lines.push('# Můj výpočet = spot-nebo-fix-prepocet.mjs (bez kódu aplikace); modul = calc.js voláno jako v app.js (regulatedFor + computeVariants).');
  lines.push('');
  lines.push('| Případ | Vstup | Můj výpočet | Modul aplikace | Shoda | Poznámka |');
  lines.push('|---|---|---|---|---|---|');
  for (const r of rows) lines.push(`| ${r.id} | ${r.vstup} | ${r.muj} | ${r.modul} | ${r.shoda ? 'ano' : 'NE'} | ${r.pozn} |`);
  lines.push('');
  const neshody = rows.filter((r) => !r.shoda);
  lines.push(`Shod: ${rows.length - neshody.length} / ${rows.length}. Neshody: ${neshody.map((r) => r.id).join(', ') || 'žádné'}.`);
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'prepocet.txt'), lines.join('\n') + '\n');
  fs.writeFileSync(path.join(OUT, 'prepocet.json'), JSON.stringify({ pripady: P.map(({ ...p }) => p), modul: { V1: m1 }, radky: rows }, null, 1));
  console.log(lines.join('\n'));
}
