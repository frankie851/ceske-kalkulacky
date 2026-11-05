// Porovnání „můj výpočet vs. modul aplikace“ pro revizi Přijímačky bez paniky (5. 11. 2026).
// Importuje vlastní referenci (prijimacky-bez-paniky-prepocet.mjs) a moduly aplikace z klonu (jen čtení).
// Spuštění: node prijimacky-bez-paniky-porovnani.mjs  → zapíše ../prijimacky-bez-paniky/prepocet.txt
import fs from 'node:fs';
import * as R from './prijimacky-bez-paniky-prepocet.mjs';

const REPO = '/tmp/revize/repos/prijimacky-bez-paniky';
const VYSTUP = new URL('../prijimacky-bez-paniky/prepocet.txt', import.meta.url).pathname;
const M = await import(`${REPO}/matching.js`);
const S = await import(`${REPO}/strategy.js`);
const I = await import(`${REPO}/ics.js`);
const { SCENARIOS, EXPECTED } = await import(`${REPO}/scenarios.js`);
const rules = JSON.parse(fs.readFileSync(`${REPO}/rules.json`, 'utf8'));

const out = [];
const log = (...a) => { const s = a.join(' '); out.push(s); console.log(s); };
const fmt = o => JSON.stringify(Object.fromEntries(Object.entries(o ?? {}).sort()));
let celkem = 0, shod = 0, rozdilu = 0;
const radek = (kod, popis, vstup, muj, modul, shoda, pozn = '') => { celkem++; if (shoda) shod++; else rozdilu++; log(`| ${kod} | ${popis} | ${vstup} | ${muj} | ${modul} | ${shoda ? 'ano' : 'NE'} | ${pozn} |`); };

log(`# Nezávislý přepočet – Přijímačky bez paniky @ e9dd0d3 · ${new Date().toISOString()} · node ${process.version}`);
log('Můj výpočet: sekvenční odložené přijetí + hrubá síla (stabilita, uchazečská optimalita); modul: deferredAcceptance z matching.js.');
log('');
log('## A. Rozřazení (zadání Z1–Z3 a vlastní případy)');
log('| Případ | Popis | Vstup | Můj výpočet | Modul aplikace | Shoda | Pozn. |');
log('|---|---|---|---|---|---|---|');
for (const p of R.PRIPADY) {
  const vstup = p.uchazeci.map(a => `${a.id} ${a.attempts ? `ČJL ${a.attempts.cj.join('/')} M ${a.attempts.m.join('/')}` : (a.score ?? '—') + ' b.'}${a.tiebreak != null ? ` tb ${a.tiebreak}` : ''} (${(a.priorities ?? []).filter(Boolean).join(',') || '—'})`).join('; ')
    + ` · školy ${p.skoly.map(s => `${s.id}:${s.capacity}${s.minScore != null ? ` min ${s.minScore}` : ''}`).join(' ') || '—'}`;
  let muj, modul, hs = null;
  try { muj = fmt(R.odlozenePrijeti(p.uchazeci, p.skoly).assignment); } catch (e) { muj = `CHYBA: ${e.constructor.name}`; }
  try { modul = fmt(M.deferredAcceptance(p.uchazeci, p.skoly).assignment); } catch (e) { modul = `CHYBA: ${e.name}`; }
  try { if (p.uchazeci.length <= 7 && !p.chyba) hs = R.hrubaSila(p.uchazeci, p.skoly); } catch { hs = null; }
  const shoda = p.chyba ? (muj.startsWith('CHYBA') && modul.startsWith('CHYBA')) : (muj === modul && (!hs || fmt(hs.optimalni) === modul));
  radek(p.kod, p.popis, vstup, muj, modul, shoda, hs ? `hrubá síla: ${hs.pocetStabilnich} stabilní(ch), optimální = ${fmt(hs.optimalni) === modul ? 'modul' : 'JINÉ'}` : (p.ocekavano ? `očekáváno ${fmt(p.ocekavano)}` : ''));
}

log('');
log('## B. Scénáře ze scenarios.js (vlastní ruční propočet vs. modul vs. EXPECTED v kódu)');
log('| Scénář | Vstup | Můj výpočet | Modul aplikace | Shoda | Pozn. |');
log('|---|---|---|---|---|---|');
for (const sc of SCENARIOS) {
  const vstup = sc.applicants.map(a => `${a.name} ${R.body(a)} b. (${a.priorities.filter(Boolean).join(',')})`).join('; ') + ` · ${sc.schools.map(s => `${s.name}:${s.capacity}`).join(' ')}`;
  const muj = R.odlozenePrijeti(sc.applicants, sc.schools).assignment;
  const modul = M.deferredAcceptance(sc.applicants, sc.schools).assignment;
  const modulR = M.deferredAcceptance([...sc.applicants].reverse(), [...sc.schools].reverse()).assignment;
  const hs = R.hrubaSila(sc.applicants, sc.schools);
  const shoda = R.stejne(muj, modul) && R.stejne(muj, R.SCENARE_OCEKAVANI[sc.id]) && R.stejne(muj, EXPECTED[sc.id]) && R.stejne(muj, modulR) && R.stejne(hs.optimalni, muj);
  celkem++; shoda ? shod++ : rozdilu++;
  log(`| ${sc.title} | ${vstup} | ${fmt(muj)} | ${fmt(modul)} | ${shoda ? 'ano' : 'NE'} | ruční propočet = EXPECTED; obrácené pořadí zadání stejné: ${R.stejne(modul, modulR)}; stabilních ${hs.pocetStabilnich} |`);
}

log('');
log('## C. Lepší ze dvou pokusů (ŠZ § 60i odst. 3)');
log('| Případ | Vstup | Můj výpočet | Modul (bestOfTwo) | Shoda |');
log('|---|---|---|---|---|');
for (const [popis, att] of [
  ['zadání: ČJL 30 a 35, M 28 a 20', { cj: [30, 35], m: [28, 20] }],
  ['nemoc: ČJL 40/–, M 35/–', { cj: [40, null], m: [35, null] }],
  ['oba chybí (nedostavil se) → 0', { cj: [], m: [] }],
  ['maximum 50+50', { cj: [50, 49], m: [49, 50] }],
  ['nula a záporné (nesmyslný vstup, bere se větší)', { cj: [0, -3], m: [-1, -2] }],
  ['nečíselné hodnoty se ignorují', { cj: ['35', NaN], m: [undefined, 20] }],
]) {
  const muj = R.lepsiZeDvou(att), modul = M.bestOfTwo(att);
  radek('P', popis, JSON.stringify(att), muj, modul, muj === modul);
}

log('');
log('## D. Náhodné instance (200, bez shod bodů): sekvenční DA vs. modul; modul při 4 permutacích pořadí; stabilita hrubou silou do 6 uchazečů');
let nOk = 0, nBad = 0, nHs = 0;
const bad = [];
for (const inst of R.nahodneInstance(200)) {
  const muj = R.odlozenePrijeti(inst.uchazeci, inst.skoly).assignment;
  const modul = M.deferredAcceptance(inst.uchazeci, inst.skoly).assignment;
  let ok = R.stejne(muj, modul);
  for (let k = 0; k < 4 && ok; k++) {
    const perm = [...inst.uchazeci].sort(() => (k % 2 ? 1 : -1) * ((k * 7919) % 3 - 1));
    ok = R.stejne(modul, M.deferredAcceptance(perm, [...inst.skoly].reverse()).assignment);
  }
  if (ok && inst.uchazeci.length <= 6) { nHs++; const hs = R.hrubaSila(inst.uchazeci, inst.skoly); ok = R.stejne(hs.optimalni, modul); }
  // kapacita nikdy nepřekročena, každý nejvýš jednou
  const r = M.deferredAcceptance(inst.uchazeci, inst.skoly);
  for (const s of inst.skoly) if ((r.schools[s.id] ?? []).length > Math.max(0, Math.floor(s.capacity))) ok = false;
  if (ok) nOk++; else { nBad++; bad.push(inst); }
}
log(`shoda: ${nOk}/200 (z toho hrubou silou ověřeno ${nHs}); rozdíly: ${nBad}` + (bad.length ? '\n' + JSON.stringify(bad.slice(0, 3)) : ''));
celkem++; nBad === 0 ? shod++ : rozdilu++;

log('');
log('## E. Vysvětlení (explain) pro Z3 a kapacitu 0');
{
  const apps = R.PRIPADY.find(p => p.kod === 'Z3').uchazeci;
  const r = M.deferredAcceptance(apps, R.AB1);
  log(JSON.stringify(M.explain(r, apps, R.AB1), null, 1));
  const p = R.PRIPADY.find(p => p.kod === 'V1');
  const r2 = M.deferredAcceptance(p.uchazeci, p.skoly);
  log(JSON.stringify(M.explain(r2, p.uchazeci, p.skoly)));
  log('kroky Z3:', JSON.stringify(r.rounds));
}

log('');
log('## F. Termíny v rules.json vs. rejstřík pravidla.md (PS-14 … PS-27) a kontrola víkendů/svátků (V422 § 31)');
log('| ID události | rules.json | Rejstřík | Den v týdnu (start) | Pracovní den | Shoda |');
log('|---|---|---|---|---|---|');
for (const e of rules.events) {
  const t = R.REJSTRIK_TERMINY[e.id];
  const shoda = !!t && t.start === e.start && (t.end ?? null) === (e.end ?? null);
  const prac = R.jePracovni(e.start);
  radek(e.id, e.title, `${e.start}${e.end ? '–' + e.end : ''} (${e.status})`, t ? `${t.start}${t.end ? '–' + t.end : ''} (${t.id})` : 'CHYBÍ', `${R.denVTydnu(e.start)}${e.end ? ' – ' + R.denVTydnu(e.end) : ''}; ${prac ? 'pracovní' : 'NE pracovní (začátek období)'}`, shoda, t?.odvozeno ?? '');
}
log(`počet událostí v rules.json: ${rules.events.length}; v rejstříku: ${Object.keys(R.REJSTRIK_TERMINY).length}; chybí v rejstříku: ${rules.events.filter(e => !R.REJSTRIK_TERMINY[e.id]).map(e => e.id).join(', ') || 'nic'}`);
log(`20. 2. 2027 je ${R.denVTydnu('2027-02-20')} → nejbližší pracovní den ${R.nejblizsiPracovni('2027-02-20')} (rules.json: ${rules.events.find(e => e.id === 'ss-prihlasky-konec').start})`);
log(`24. 4. 2027 je ${R.denVTydnu('2027-04-24')} → ${R.nejblizsiPracovni('2027-04-24')} (rules.json skolni-nahradni start: ${rules.events.find(e => e.id === 'skolni-nahradni').start})`);
log(`meta.checked = ${rules.meta.checked}; stavy: ${JSON.stringify(Object.fromEntries(['confirmed', 'unverified', 'tip'].map(s => [s, [...rules.events, ...rules.rules].filter(x => x.status === s).length])))}`);
log(`svátky 2027 (zákon 245/2000 Sb.): ${[...R.svatkyCR(2027)].join(', ')}`);

log('');
log('## G. „Moje strategie“ – vlastní definice (rezerva ≥ margin = jistota; 0 ≤ rozdíl < margin = těsné; < 0 = riziko) vs. evaluateStrategy');
log('| Případ | Vstup | Můj výpočet | Modul | Shoda |');
log('|---|---|---|---|---|');
for (const [popis, inp] of [
  ['test aplikace: 60 b.; 75/62/58', { expected: 60, schools: [{ name: 'A', lastMin: 75 }, { name: 'B', lastMin: 62 }, { name: 'C', lastMin: 58 }] }],
  ['hranice: rozdíl přesně 5 = jistota, 4 = těsné, 0 = těsné, −1 = riziko', { expected: 60, schools: [{ name: 'A', lastMin: 55 }, { name: 'B', lastMin: 56 }, { name: 'C', lastMin: 60 }, { name: 'D', lastMin: 61 }] }],
  ['rezerva 10: rozdíl 9 = těsné', { expected: 60, margin: 10, schools: [{ name: 'A', lastMin: 51 }] }],
  ['rezerva 3: rozdíl 3 = jistota', { expected: 60, margin: 3, schools: [{ name: 'A', lastMin: 57 }] }],
  ['chybí očekávané body', { expected: null, schools: [{ name: 'A', lastMin: 50 }] }],
  ['očekávané body, ale žádná škola vyplněná (3 prázdné)', { expected: 62, schools: [{ name: '', lastMin: null }, { name: '', lastMin: null }, { name: '', lastMin: null }] }],
  ['body 0 a minimum 0', { expected: 0, schools: [{ name: 'A', lastMin: 0 }] }],
  ['body 100, minimum 100', { expected: 100, schools: [{ name: 'A', lastMin: 100 }] }],
  ['záporné / nad 100 (nesmyslný vstup)', { expected: 150, schools: [{ name: 'A', lastMin: -5 }] }],
]) {
  const muj = R.strategie(inp); const mod = S.evaluateStrategy(inp);
  const mujS = `${muj.rows.map(r => r.category).join(',')}; no-safe=${muj.noSafe}`;
  const modS = `${mod.schools.map(r => r.category).join(',')}; no-safe=${mod.warnings.some(w => w.id === 'no-safe')}`;
  radek('S', popis, JSON.stringify(inp), mujS, modS, mujS === modS);
}

log('');
log('## H. Export .ics – kontrola podle RFC 5545 (vlastní parser) nad výstupem buildICS');
{
  const NOW = new Date(Date.UTC(2026, 10, 5, 12, 0, 0));
  const src = rules.sources;
  const events = rules.events.filter(e => e.status !== 'unverified').map(e => ({ id: `${e.id}-2027`, title: e.title, start: e.start, end: e.end,
    description: [e.note, 'Informativní pomůcka – závazné jsou informace CERMAT a škol.'].filter(Boolean).join('\n'), url: src[e.source].url }));
  const ics = I.buildICS(events, { now: NOW, calName: 'Přijímačky 2027' });
  fs.writeFileSync(new URL('../prijimacky-bez-paniky/export-modul.ics', import.meta.url).pathname, ics);
  const k = R.zkontrolujICS(ics);
  log(`událostí: ${k.pocetUdalosti} (očekáváno ${events.length}); chyb RFC: ${k.chyby.length}${k.chyby.length ? '\n - ' + k.chyby.join('\n - ') : ''}`);
  // DTEND = den po konci (včetně přelomu měsíce/roku a přestupného roku)
  log('| Událost | start–end | DTSTART | DTEND | Očekávaný DTEND (den po konci) | Shoda |');
  log('|---|---|---|---|---|---|');
  for (const e of k.events) {
    const id = e.UID.value.replace('@prijimacky-bez-paniky', '').replace(/-2027$/, '');
    const r = rules.events.find(x => x.id === id);
    const oc = R.dalsiDen(r.end ?? r.start).replace(/-/g, '');
    radek('I', id, `${r.start}–${r.end ?? r.start}`, oc, e.DTEND.value, e.DTEND.value === oc && e.DTSTART.value === r.start.replace(/-/g, ''));
  }
  for (const [popis, ev] of [
    ['přelom roku 31. 12. 2026', { id: 'x1', title: 'x', start: '2026-12-31' }],
    ['přestupný rok 28. 2. 2028', { id: 'x2', title: 'x', start: '2028-02-28' }],
    ['29. 2. 2028', { id: 'x3', title: 'x', start: '2028-02-29' }],
    ['nepřestupný 28. 2. 2027', { id: 'x4', title: 'x', start: '2027-02-28' }],
    ['období 1.–30. 11. 2026', { id: 'x5', title: 'x', start: '2026-11-01', end: '2026-11-30' }],
  ]) {
    const t = I.buildICS([ev], { now: NOW });
    const dtend = /DTEND;VALUE=DATE:(\d{8})/.exec(t)[1];
    const oc = R.dalsiDen(ev.end ?? ev.start).replace(/-/g, '');
    radek('I', `DTEND: ${popis}`, JSON.stringify(ev), oc, dtend, dtend === oc);
  }
  // escapování TEXT
  for (const s of ['a, b', 'a; b', 'zpět\\lomítko', 'řádek\nnový', 'Jen pro omluvené. Omluvu je třeba poslat řediteli školy písemně do 3 pracovních dnů; jinak termín propadá, a to bez náhrady.']) {
    const muj = R.escapeRFC(s), modul = I.escapeText(s);
    radek('I', 'escapeText', JSON.stringify(s), JSON.stringify(muj), JSON.stringify(modul), muj === modul, muj === modul ? '' : 'RFC 5545 §3.3.11: SEMICOLON musí být escapovaný jako \\;');
  }
  const t2 = I.buildICS([{ id: 'y', title: 'Zkouška; termín, místo', start: '2027-04-12' }], { now: NOW });
  const k2 = R.zkontrolujICS(t2);
  radek('I', 'VEVENT se středníkem v SUMMARY', 'Zkouška; termín, místo', '0 chyb RFC', `${k2.chyby.length} chyb: ${k2.chyby.join('; ')}`, k2.chyby.length === 0);
  // dlouhé řádky s diakritikou
  const t3 = I.buildICS([{ id: 'z', title: 'Příliš žluťoučký kůň úpěl ďábelské ódy – '.repeat(6), start: '2027-04-12', description: 'Ř'.repeat(300) }], { now: NOW });
  const k3 = R.zkontrolujICS(t3);
  radek('I', 'skládání řádků (UTF-8, 75 oktetů)', 'title 6× věta, description 300× Ř', '0 chyb', `${k3.chyby.length} chyb`, k3.chyby.length === 0, `SUMMARY po rozbalení shodné: ${k3.events[0].SUMMARY.value === R.escapeRFC('Příliš žluťoučký kůň úpěl ďábelské ódy – '.repeat(6))}`);
}

log('');
log(`## Souhrn: ${celkem} porovnání, shoda ${shod}, rozdíl ${rozdilu}`);
fs.writeFileSync(VYSTUP, out.join('\n') + '\n');
console.log('zapsáno', VYSTUP);
