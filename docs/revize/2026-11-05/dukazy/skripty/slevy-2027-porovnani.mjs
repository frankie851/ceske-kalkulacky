// Porovnání nezávislého přepočtu (slevy-2027-prepocet.mjs) s výpočetním modulem aplikace Slevy 2027.
// Modul aplikace se importuje až zde, z klonu revidovaného commitu (jen čtení).
// Spuštění: node slevy-2027-porovnani.mjs  → zapíše ../slevy-2027/prepocet.txt
import { readFileSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { pripady, scenare, terminy } from './slevy-2027-prepocet.mjs';

const KLON = '/tmp/revize/repos/slevy-2027';
const M = await import(`${KLON}/slevy.js`);
const rules = JSON.parse(readFileSync(`${KLON}/rules.json`, 'utf8'));
const celyRok = { od: 1, do: 12 };
const n = (rok, mesic) => ({ rok, mesic });

// Jak zavolat modul pro každý případ (vstupy ve formátu modulu; stejné hodnoty jako v referenci).
const modul = {
  Z1: () => M.slevaStudent({ narozeni: n(2005, 1), studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules).rocne,
  Z2: () => M.slevaStudent({ narozeni: n(2005, 1), studium: { studuje: true, od: 1, do: 6, druh: 'vs' } }, rules).rocne,
  Z3: () => M.slevaStudent({ narozeni: n(2000, 1), studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules).rocne,
  Z4: () => M.zvyhodneniDeti([{ narozeni: n(2018, 4), ...celyRok }, { narozeni: n(2021, 9), ...celyRok }], rules).rocne,
  Z5a: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 30000 }], rules).rocne,
  Z5b: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 12000 }], rules).rocne,
  Z6a: () => M.slevaManzel({ manzel: { ma: true, prijem: 50000, peceODite: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne,
  Z6b: () => M.slevaManzel({ manzel: { ma: true, prijem: 70000, peceODite: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne,
  Z7: () => M.odpocetStari({ dip: 60000 }, rules).odpocet,
  V1: () => M.slevaStudent({ narozeni: n(2001, 6), studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules).rocne,
  V2: () => M.slevaStudent({ narozeni: n(2001, 6), studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules).rocne + ' (modul den nezná)',
  V3: () => M.slevaStudent({ narozeni: n(2000, 1), studium: { studuje: true, ...celyRok, druh: 'doktorske' } }, rules).rocne,
  V4: () => M.slevaStudent({ narozeni: n(1999, 3), studium: { studuje: true, ...celyRok, druh: 'doktorske' } }, rules).rocne,
  V5: () => M.slevaStudent({ narozeni: n(2000, 1), studium: { studuje: true, ...celyRok, druh: 'vs' } }, rules).rocne + ' (UI mapuje „doktorskeJine“ na vs)',
  V6: () => M.slevaStudent({ narozeni: n(2005, 1), studium: { studuje: true, od: 9, do: 6, druh: 'vs' } }, rules).rocne + ' (UI hlásí chybu od > do)',
  V7: () => M.slevaManzel({ manzel: { ma: true, prijem: 68000, peceODite: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne,
  V8: () => M.slevaManzel({ manzel: { ma: true, prijem: 68001, peceODite: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne,
  V9: () => M.slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [{ narozeni: n(2024, 11), ...celyRok }] }, rules).rocne,
  V10: () => M.slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [{ narozeni: n(2027, 4), ...celyRok }] }, rules).rocne,
  V11: () => M.slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true, ztpp: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne,
  V12: () => M.slevaManzel({ manzel: { ma: true, prijem: 0, peceODite: true }, deti: [{ narozeni: n(2015, 3), ...celyRok }] }, rules).rocne,
  V13: () => M.zvyhodneniDeti([{ narozeni: n(2027, 4), ...celyRok }], rules).rocne,
  V14: () => M.zvyhodneniDeti([{ narozeni: n(2018, 4), ...celyRok, ztpp: true }], rules).rocne,
  V15: () => M.zvyhodneniDeti([1, 2, 3].map(() => ({ narozeni: n(2015, 1), ...celyRok })), rules).rocne,
  V16: () => M.zvyhodneniDeti([{ narozeni: n(2001, 3), ...celyRok }], rules).rocne,
  V17: () => M.zvyhodneniDeti([{ narozeni: n(2018, 4), od: 7, do: 12 }], rules).rocne,
  V18: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 30000, domacnosti: 2 }], rules).rocne,
  V19: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 30000, domacnosti: 3 }], rules).rocne,
  V20: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 30000, domacnosti: 2, dohodaStrop: 17430 }], rules).rocne,
  V21: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 30000, domacnosti: 2, dohodaStrop: 30000 }], rules).rocne,
  V22: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 24900 }], rules).rocne,
  V23: () => M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: 0 }], rules).rocne + M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: -5000 }], rules).rocne,
  V24: () => M.odpocetStari({ penzijko: 24000 }, rules).odpocet,
  V25: () => M.odpocetStari({ penzijko: 20400 }, rules).odpocet,
  V26: () => M.odpocetStari({ penzijko: 48000 }, rules).odpocet + ' (modul nezná rozpis po měsících)',
  V27: () => M.odpocetStari({ penzijko: 50400, dip: 10000, zivotni: 20000 }, rules).odpocet,
  V28: () => M.odpocetStari({ dip: 48000 }, rules).odpocet,
  V29: () => M.odpocetUroky({ uroky: 200000 }, rules).odpocet,
  V30: () => M.odpocetUroky({ uroky: 200000, stareSmlouva: true }, rules).odpocet,
  V31: () => M.odpocetUroky({ uroky: 100000, mesice: 6 }, rules).odpocet,
  V32: () => M.odpocetUroky({ uroky: 150000 }, rules).odpocet,
  V33: () => M.odpocetDary({ dary: 800 }, 600000, rules).odpocet,
  V34: () => M.odpocetDary({ dary: 500, krev: 1 }, 600000, rules).odpocet,
  V35: () => M.odpocetDary({ dary: 200000 }, 600000, rules).odpocet,
  V36: () => M.odpocetDary({ dary: 999 }, 40000, rules).odpocet,
  V37: () => M.odpocetDary({ dary: 200000 }, null, rules).odpocet,
  V38: () => { // ve vyhodnot() se strop počítá ze základu sníženého o stáří a úroky
    const v = M.vyhodnot({ narozeni: n(1990, 1), mzda: { mesicne: 50000, mesice: 12 }, stari: { dip: 48000 }, hypoteka: { uroky: 150000 }, dary: { dary: 100000 } }, rules);
    return v.polozky.find((p) => p.id === 'dary').rocne;
  },
  V39: () => { const v = M.uplatnitDan({ zakladDane: 240000, prijmyPrace: 240000, slevy: 30840, zvyhodneni: 15204 }, rules); return `${v.danPred}/${v.dan}/${v.bonus}`; },
  V40: () => M.uplatnitDan({ zakladDane: 149399, prijmyPrace: 149399, slevy: 30840, zvyhodneni: 15204 }, rules).bonus,
  V41: () => M.uplatnitDan({ zakladDane: 149400, prijmyPrace: 149400, slevy: 30840, zvyhodneni: 15204 }, rules).bonus,
  V42: () => M.uplatnitDan({ zakladDane: 155400, prijmyPrace: 155400, slevy: 30840, zvyhodneni: 50 }, rules).bonus,
  V43: () => M.uplatnitDan({ zakladDane: 2000000, prijmyPrace: 2000000, slevy: 0 }, rules).danPred,
  V44: () => M.uplatnitDan({ zakladDane: 240099, prijmyPrace: 240099, slevy: 0 }, rules).danPred,
  V45: () => M.uplatnitDan({ zakladDane: 10000, odpocty: 48000, prijmyPrace: 10000, slevy: 30840 }, rules).dan,
  V46: () => M.povinnostPriznani({ ostatni: 40000 }, rules).povinne,
  V47: () => M.povinnostPriznani({ ostatni: 40001 }, rules).povinne,
  V48: () => M.povinnostPriznani({ soubezne: 1 }, rules).povinne,
  V49: () => M.povinnostPriznani({ maleDohody: 30000 }, rules).povinne,
  T1: () => ['prohlaseni', 'rocniZuctovani', 'priznaniPapir', 'priznaniElektronicky', 'priznaniPoradce'].map((k) => rules.terminy[k].datum).join(' '),
  T2: () => '(aplikace rok 2026 nemá)',
  T3: () => '(není v modulu)',
};

// Vstupy pro modul u scénářů A a B (formát odpovedi() z app.js)
export const scenarModul = {
  A: {
    narozeni: n(1990, 5), mzda: { mesicne: 45000, mesice: 12 }, studium: { studuje: false, od: 1, do: 12, druh: 'vs' },
    deti: [
      { narozeni: n(2018, 4), ztpp: false, od: 1, do: 12, skolka: false, skolne: 0, domacnosti: 1, dohodaStrop: 0 },
      { narozeni: n(2025, 3), ztpp: false, od: 1, do: 12, skolka: true, skolne: 30000, domacnosti: 1, dohodaStrop: 0 },
    ],
    manzel: { ma: true, prijem: 50000, peceODite: true, ztpp: false }, invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: 120000, stareSmlouva: false }, stari: { penzijko: 36000, dip: 10000, zivotni: 0, dlouhodobaPece: 0 },
    dary: { dary: 5000, krev: 2 }, odbory: false, prijmy: { maleDohody: 0, soubezne: 0, ostatni: 0 },
  },
  B: {
    narozeni: n(2005, 1), mzda: { mesicne: 25000, mesice: 12 }, studium: { studuje: true, od: 1, do: 6, druh: 'vs' },
    deti: [], manzel: { ma: false, prijem: 0, peceODite: false, ztpp: false }, invalidita: { stupen: 0, ztpp: false },
    hypoteka: { uroky: 0, stareSmlouva: false }, stari: { penzijko: 0, dip: 60000, zivotni: 0, dlouhodobaPece: 0 },
    dary: { dary: 0, krev: 0 }, odbory: false, prijmy: { maleDohody: 0, soubezne: 0, ostatni: 45000 },
  },
};

const spustenoPrimo = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (spustenoPrimo) hlavni();

function hlavni() {
const fmt = (x) => (typeof x === 'number' ? new Intl.NumberFormat('cs-CZ').format(x) : String(x));
const radky = [];
let shod = 0, neshod = 0;
radky.push(`# Nezávislý přepočet vs. modul aplikace slevy-2027 @ d88ba42 · ${new Date().toISOString()}`);
radky.push('# Reference: slevy-2027-prepocet.mjs (bez kódu aplikace); modul: /tmp/revize/repos/slevy-2027/slevy.js + rules.json');
radky.push('');
radky.push('ID\tZdroj\tPřípad\tVstup\tMůj výpočet\tModul aplikace\tShoda');
for (const p of pripady) {
  const moje = p.ref();
  let m;
  try { m = modul[p.id] ? modul[p.id]() : '(nepřiřazeno)'; } catch (e) { m = `CHYBA: ${e.message}`; }
  const mojeS = fmt(moje), mS = fmt(m);
  const shoda = String(m).startsWith(String(moje)) && !String(m).includes('CHYBA') ? 'ano' : (String(m).startsWith('(') ? '—' : 'NE');
  if (shoda === 'ano') shod += 1; else if (shoda === 'NE') neshod += 1;
  radky.push(`${p.id}\t${p.zdroj}\t${p.popis}\t${p.vstup}\t${mojeS}${p.ocekavano !== undefined ? ` (zadání ${fmt(p.ocekavano)})` : ''}\t${mS}\t${shoda}`);
}
radky.push('');
radky.push(`Shod: ${shod} · neshod: ${neshod}`);
radky.push('');
radky.push('## Celé scénáře (vyhodnot)');
for (const [k, s] of Object.entries(scenare)) {
  const r = s.ref();
  const v = M.vyhodnot(scenarModul[k], rules);
  const podle = Object.fromEntries(v.polozky.map((p) => [p.id, p]));
  radky.push(`### ${s.popis}`);
  const por = (nazev, moje, modulH) => { const ok = moje === modulH ? 'ano' : 'NE'; if (ok === 'NE') neshod += 1; else shod += 1; radky.push(`  ${nazev}\t${fmt(moje)}\t${fmt(modulH)}\t${ok}`); };
  radky.push('  položka\tmůj\tmodul\tshoda');
  for (const [id, val] of Object.entries(r.slevy)) por(`sleva ${id}`, val, id === 'invalidita' ? ['invalidita12', 'invalidita3', 'ztpp'].reduce((a, i) => a + (podle[i]?.rocne ?? 0), 0) : (podle[id]?.rocne ?? 0));
  if (r.zvyhodneni) por('zvýhodnění děti', r.zvyhodneni, podle.deti?.rocne ?? 0);
  for (const [id, val] of Object.entries(r.odpocty)) por(`odpočet ${id}`, val, podle[id]?.rocne ?? 0);
  por('součet „Až … ročně“', r.az, v.soucetAz);
  por('daň před slevami', r.vyuct?.danPred ?? null, v.dan?.danPred ?? null);
  por('daň po slevách', r.vyuct?.dan ?? null, v.dan?.dan ?? null);
  por('bonus', r.vyuct?.bonus ?? null, v.dan?.bonus ?? null);
  por('reálný efekt', r.realne, v.realne);
  por('povinné přiznání', r.priznani, v.priznani.povinne);
  radky.push(`  kde (modul): ${v.polozky.map((p) => `${p.id}=${p.kde}`).join(', ')}`);
  radky.push('');
}
radky.push('## Termíny (moje podle § 33 a § 136 DŘ) vs. rules.json');
radky.push(`  rok 2027: ${JSON.stringify(terminy(2027))}`);
radky.push(`  rules.json: ${JSON.stringify(Object.fromEntries(Object.entries(rules.terminy).filter(([k]) => k !== 'zdroje' && k !== 'overeno' && k !== 'poznamka').map(([k, v]) => [k, v.datum])))}`);
radky.push(`  rok 2026 (informativně): ${JSON.stringify(terminy(2026))}`);
radky.push('');
radky.push('## Robustnost modulu na vstupy (cislo())');
for (const x of ['1 500', '1500,50', '1500.50', '-5000', 'abc', NaN, Infinity, null, undefined, '', '1e3']) {
  radky.push(`  odpocetStari({dip: ${JSON.stringify(x) ?? 'undefined'}}) → ${M.odpocetStari({ dip: x }, rules).odpocet}`);
}
radky.push(`  skolkovne skolne "30 000" → ${M.skolkovne([{ narozeni: n(2022, 5), skolka: true, skolne: '30 000' }], rules).rocne}`);
radky.push(`  slevaManzel prijem "70 000" (NaN → 0 → nárok!) → ${M.slevaManzel({ manzel: { ma: true, prijem: '70 000', peceODite: true }, deti: [{ narozeni: n(2025, 3), ...celyRok }] }, rules).rocne}`);
radky.push(`  povinnostPriznani ostatni "45 000" → ${M.povinnostPriznani({ ostatni: '45 000' }, rules).povinne}`);
radky.push('');
radky.push(`Celkem shod: ${shod} · neshod: ${neshod}`);

const out = new URL('../slevy-2027/prepocet.txt', import.meta.url).pathname;
writeFileSync(out, radky.join('\n') + '\n');
console.log(radky.join('\n'));
console.log('→', out);
}
