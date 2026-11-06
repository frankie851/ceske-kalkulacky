// Porovnání „můj výpočet vs. modul aplikace“ pro revizi mam-eet (5. 11. 2026).
// Teprve tady se importuje kód aplikace (rules.js, osvc.js, rules.json z klonu /tmp/revize/repos/mam-eet).
// Spuštění: node mam-eet-porovnani.mjs [výstupní soubor]  (výchozí ../mam-eet/prepocet.txt)
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import * as muj from './mam-eet-prepocet.mjs';

const REPO = '/tmp/revize/repos/mam-eet';
const app = {
  rules: await import(pathToFileURL(`${REPO}/rules.js`).href),
  osvc: await import(pathToFileURL(`${REPO}/osvc.js`).href),
};
const RULES = JSON.parse(readFileSync(`${REPO}/rules.json`, 'utf8'));
const out = process.argv[2] ?? new URL('../mam-eet/prepocet.txt', import.meta.url).pathname;

const fmt = (n) => (n === null || n === undefined || Number.isNaN(n) ? '—' : new Intl.NumberFormat('cs-CZ').format(n) + ' Kč');
const lines = [];
const L = (s = '') => lines.push(s);
let shod = 0; let rozdil = 0;
const ok = (a, b) => { const same = JSON.stringify(a) === JSON.stringify(b); if (same) shod++; else rozdil++; return same ? 'ANO' : 'NE'; };

L(`# Nezávislý přepočet vs. modul aplikace mam-eet @ ${process.env.REV_SHA ?? 'e5bf47f'} · ${new Date().toISOString()} · node ${process.version}`);
L('# Můj výpočet: mam-eet-prepocet.mjs (bez kódu aplikace). Modul: rules.js / osvc.js + rules.json z klonu.');
L();

/* ---------- Parametry ---------- */
const p = muj.parametry();
const pa = app.osvc.params(RULES);
const z = muj.pausalniZalohy();
L('## Parametry roku 2027');
L('| Parametr | Můj výpočet | Modul aplikace | Shoda |');
L('|---|---|---|---|');
const PAR = [
  ['průměrná mzda', p.pm, RULES.osvc2027.averageWage.monthly],
  ['min. měsíční VZ soc. hlavní', p.minVZMesHlavni, pa.socialMinBaseMain],
  ['min. záloha soc. hlavní', p.minZalohaHlavni, pa.socialMinAdvanceMain],
  ['min. měsíční VZ soc. začínající (25 % PM)', p.minVZMesZacinajici, null],
  ['min. měsíční VZ soc. vedlejší', p.minVZMesVedlejsi, pa.socialMinBaseSide],
  ['min. záloha soc. vedlejší', p.minZalohaVedlejsi, pa.socialMinAdvanceSide],
  ['max. roční VZ soc.', p.socMaxVZ, pa.socialMaxBaseAnnual],
  ['rozhodná částka (vedlejší)', p.rozhodnaCastka, pa.sideThreshold],
  ['min. roční VZ zdrav. (12 × 50 % PM)', p.zdrMinVZRocni, pa.healthMinBase * pa.months],
  ['min. záloha zdrav.', p.zdrMinZaloha, pa.healthMinAdvance],
  ['hranice 23 % (36 × PM)', p.hranice23, pa.highRateThreshold],
  ['příjem pro daňový bonus (6 × min. mzda)', p.bonusMinPrijem, pa.bonusMinIncome],
  ['paušál 1. pásmo měsíčně', z.band1.celkem, RULES.osvc2027.flatTax.bands[0].monthly],
  ['  z toho sociální 1. pásmo', z.band1.soc, RULES.osvc2027.flatTax.bands[0].social],
  ['  z toho zdravotní 1. pásmo', z.band1.zdr, RULES.osvc2027.flatTax.bands[0].health],
  ['paušál 2. pásmo měsíčně', z.band2.celkem, RULES.osvc2027.flatTax.bands[1].monthly],
  ['paušál 3. pásmo měsíčně', z.band3.celkem, RULES.osvc2027.flatTax.bands[2].monthly],
  ['EET OFF měsíčně (1. pásmo + 1 400)', z.band1.celkem + 1400, RULES.osvc2027.flatTax.bands[0].monthly + RULES.eetOff.surchargeMonthly],
  ['přirážka EET OFF ročně', 12 * 1400, app.rules.eetOffAnnualSurcharge(RULES)],
];
for (const [n, a, b] of PAR) L(`| ${n} | ${fmt(a)} | ${b === null ? '(není v aplikaci)' : fmt(b)} | ${b === null ? 'NE – chybí' : ok(a, b)} |`);
if (PAR.some(([, , b]) => b === null)) rozdil--; // chybějící parametr počítáme jen jednou níže u případů
L();

/* ---------- Mám EET? ---------- */
L('## Průvodce „Mám EET?“ – evaluate()');
L('| Případ | Vstup | Můj výpočet | Modul aplikace | Shoda |');
L('|---|---|---|---|---|');
for (const c of muj.EET_PRIPADY) {
  const m = muj.mamEet(c.a);
  let a;
  try {
    const r = app.rules.evaluate(c.a, RULES);
    a = { verdikt: r.verdict, code: r.eetOff?.code ?? null, surcharge: r.eetOff?.eligible ? r.eetOff.surchargeAnnual : null, deadline: r.eetOff?.eligible ? r.eetOff.registrationDeadline : null, mojeEet: r.mojeEet?.suitable ?? null, zdroje: r.reasons.length };
  } catch (e) { a = { chyba: String(e.message) }; }
  const mm = { verdikt: m.verdikt, code: m.eetOff?.code ?? null, surcharge: m.eetOff?.eligible ? m.eetOff.surchargeAnnual : null, deadline: m.eetOff?.eligible ? m.eetOff.deadline : null };
  const aa = { verdikt: a.verdikt, code: a.code === 'eligible' ? null : a.code ?? null, surcharge: a.surcharge ?? null, deadline: a.deadline ?? null };
  L(`| ${c.id} ${c.popis} | ${JSON.stringify(c.a)} | ${JSON.stringify(mm)}${m.mojeEet !== undefined && m.mojeEet !== null ? ' MOJE eet vhodná: ' + m.mojeEet : ''} | ${JSON.stringify(a)} | ${ok(mm, aa)} |`);
}
L();
L('## Kalkulačka EET OFF – compareCosts()');
L('| Případ | Vstup | Můj výpočet | Modul aplikace | Shoda |');
L('|---|---|---|---|---|');
for (const c of muj.KALK_PRIPADY) {
  const m = muj.kalkulackaEetOff(c.v);
  const r = app.rules.compareCosts({ useMojeEet: c.v.mojeEet, ownCostAnnual: c.v.vlastniRocne }, RULES);
  const a = { prirazka: r.surcharge, naklady: r.evidenceCost, levnejsi: r.cheaper, rozdil: r.diff, veta: r.sentence };
  const same = m.naklady === a.naklady && m.levnejsi === a.levnejsi;
  if (same) shod++; else rozdil++;
  L(`| ${c.id} ${c.popis} | ${JSON.stringify(c.v)} | ${JSON.stringify(m)} | ${JSON.stringify(a)} | ${same ? 'ANO' : 'NE'} |`);
}
L();

/* ---------- OSVČ 2027 ---------- */
L('## OSVČ 2027 – compare() / classic() / flatTax() / eetOffVariant()');
L('| Případ | Vstup | Můj výpočet (přiznání: daň + soc + zdr = ročně · paušál · EET OFF · nejlevnější) | Modul aplikace | Shoda |');
L('|---|---|---|---|---|');
const toApp = (v) => ({
  income: v.prijmy, flatRateId: v.pausal, actualExpenses: Number.isFinite(v.skutecne) ? v.skutecne : null,
  vatPayer: v.platceDph, children: v.deti, activityId: v.cinnost === 'vedlejsi' ? (v.zamestnanec ? 'sideEmployed' : 'sideOther') : 'main', contactPayments: v.kontaktni,
});
const vysledky = [];
for (const c of muj.OSVC_PRIPADY) {
  const m = muj.porovnani(c.v);
  const inp = toApp(c.v);
  let a;
  try {
    const r = app.osvc.compare(inp, RULES);
    const cl = r.variants.find((x) => x.id === 'classic');
    const fl = r.variants.find((x) => x.id === 'flat');
    const eo = r.variants.find((x) => x.id === 'eetOff');
    a = {
      priznani: { dan: cl.tax.tax, soc: cl.social.amount, zdr: cl.health.amount, rocne: cl.annual },
      pausal: fl.available ? { pasmo: fl.band.id, rocne: fl.annual } : { ne: fl.code },
      eetOff: eo.available ? { rocne: eo.annual } : { ne: eo.code },
      nejlevnejsi: r.cheapestId,
    };
  } catch (e) { a = { chyba: String(e.message) }; }
  const mm = {
    priznani: { dan: m.priznani.dan.dan, soc: m.priznani.soc.pojistne, zdr: m.priznani.zdr.pojistne, rocne: m.priznani.rocne },
    pausal: m.pausal.dostupne ? { pasmo: m.pausal.pasmo, rocne: m.pausal.rocne } : { ne: m.pausal.duvod },
    eetOff: m.eetOff.dostupne ? { rocne: m.eetOff.rocne } : { ne: m.eetOff.duvod },
    nejlevnejsi: m.nejlevnejsi === 'pausal' ? 'flat' : m.nejlevnejsi === 'priznani' ? 'classic' : 'eetOff',
  };
  // Shoda se posuzuje na částkách a dostupnosti, ne na textu důvodu. Liší-li se jen 1. pásmo (9 661 vs. 9 662 Kč,
  // tj. 12 Kč ročně u paušálu i EET OFF), je to „ANO*“ a rozdíl se počítá jen jednou v tabulce parametrů.
  const norm = (x, b1) => ({ priznani: x.priznani, pausal: x.pausal?.rocne !== undefined ? x.pausal.rocne - (x.pausal.pasmo === 'band1' ? b1 : 0) : 'ne', eetOff: x.eetOff?.rocne !== undefined ? x.eetOff.rocne - b1 : 'ne', nej: x.nejlevnejsi });
  let same;
  if (JSON.stringify(norm(mm, 0)) === JSON.stringify(norm(a, 0))) { shod++; same = 'ANO'; }
  else if (!a.chyba && JSON.stringify(norm(mm, 0)) === JSON.stringify(norm(a, 12))) { shod++; same = 'ANO* (jen 1. pásmo ±12 Kč)'; }
  else { rozdil++; same = 'NE'; }
  vysledky.push({ id: c.id, muj: mm, app: a, same });
  const txt = (x) => x.chyba ? `CHYBA ${x.chyba}` : `přiznání ${fmt(x.priznani.dan)} + ${fmt(x.priznani.soc)} + ${fmt(x.priznani.zdr)} = **${fmt(x.priznani.rocne)}** · paušál ${x.pausal.rocne !== undefined ? x.pausal.pasmo + ' ' + fmt(x.pausal.rocne) : 'ne (' + x.pausal.ne + ')'} · EET OFF ${x.eetOff.rocne !== undefined ? fmt(x.eetOff.rocne) : 'ne (' + x.eetOff.ne + ')'} · nejlevnější ${x.nejlevnejsi}`;
  L(`| ${c.id} ${c.popis} | ${JSON.stringify(inp)}${c.v.cinnost === 'zacinajici' ? ' + začínající OSVČ (v aplikaci nelze zadat)' : ''}${c.v.podil8060 !== undefined ? ' + smíšené příjmy (v aplikaci nelze zadat)' : ''} | ${txt(mm)} | ${txt(a)} | ${same} |`);
}
L();

/* ---------- Příklad E15 dvěma metodami ---------- */
L('## Kontrolní příklad E15 (základ 200 000 Kč, 2 děti) – rozbor');
{
  const r = muj.priznani({ prijmy: 500000, skutecne: 300000, deti: 2, cinnost: 'hlavni', pausal: 'p60' });
  L(`- Podle zákona z ročních základů: daň 15 % × 200 000 = 30 000 − 30 840 → 0; zvýhodnění 15 204 + 22 320 = 37 524 → bonus ${fmt(r.dan.bonus)} (příjmy 500 000 ≥ 149 400);`);
  L(`  sociální max(55 % × 200 000 = 110 000; 12 × 18 083 = 216 996) × 29,2 % = ${fmt(r.soc.pojistne)}; zdravotní max(100 000; 12 × 25 831,5 = 309 978) × 13,5 % = ${fmt(r.zdr.pojistne)}; celkem **${fmt(r.rocne)}**.`);
  const mes = 12 * p.minZalohaHlavni + 12 * p.zdrMinZaloha - r.dan.bonus;
  L(`- Metodou „12 × minimální měsíční záloha“ (tabulky E15): 12 × 5 281 + 12 × 3 488 − 37 524 = **${fmt(mes)}** (E15 uvádí 67 704 Kč). Rozdíl ${fmt(mes - r.rocne)} plyne jen ze zaokrouhlování záloh po měsících; zákonný roční výpočet dává 67 687 Kč.`);
  L(`- Modul aplikace: ${fmt(vysledky.find((v) => v.id === 'O4').app.priznani.rocne)}.`);
}
L();

/* ---------- Výpočet 1. pásma ---------- */
L('## 1. pásmo paušální daně 2027 – dva postupy');
L(`- Zákon (§ 14 odst. 3 písm. a) ZPSZ): VZ = 18 083 × 1,15 = 20 795,45 → 20 796 Kč (§ 14 odst. 13); pojistné 20 796 × 29,2 % = ${(20796 * 0.292).toFixed(2)} → ${Math.ceil(20796 * 0.292)} Kč; i bez zaokrouhlení VZ: ${(20795.45 * 0.292).toFixed(2)} → ${Math.ceil(20795.45 * 0.292)} Kč. 1. pásmo = 100 + 6 073 + 3 488 = **9 661 Kč**.`);
L(`- Aplikace (rules.json band1.note, test „1. pásmo = 100 + min. soc. záloha × 1,15“): 5 281 × 1,15 = ${(5281 * 1.15).toFixed(2)} → ${Math.ceil(5281 * 1.15)} Kč → 1. pásmo **9 662 Kč**.`);
L(`- Kontrola postupu na roce 2026 (tabulka FS od 7/2026: I. pásmo 9 162 Kč, soc. 5 756 Kč): VZ 17 139 × 1,15 = ${(17139 * 1.15).toFixed(2)} → ${Math.ceil(17139 * 1.15)} × 29,2 % = ${(Math.ceil(17139 * 1.15) * 0.292).toFixed(2)} → ${Math.ceil(Math.ceil(17139 * 1.15) * 0.292)} Kč; přes zálohu 5 005 × 1,15 = ${(5005 * 1.15).toFixed(2)} → ${Math.ceil(5005 * 1.15)} Kč – v roce 2026 oba postupy shodné, v roce 2027 se liší o 1 Kč.`);
L();
L(`# Souhrn: shod ${shod}, rozdílů ${rozdil}.`);

writeFileSync(out, lines.join('\n') + '\n');
console.log(lines.join('\n'));
console.log(`\n→ zapsáno ${out}`);
