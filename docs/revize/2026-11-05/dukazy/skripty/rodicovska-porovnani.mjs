// Porovnání: můj referenční výpočet (rodicovska-prepocet.mjs) vs. výpočetní modul aplikace (rodina.js z klonu, jen čtení).
// Spuštění: node docs/revize/2026-11-05/dukazy/skripty/rodicovska-porovnani.mjs > docs/revize/2026-11-05/dukazy/rodicovska/prepocet.txt
import { readFileSync } from 'node:fs';
import * as R from './rodicovska-prepocet.mjs';

const KLON = '/tmp/revize/repos/rodicovska';
const A = await import(`${KLON}/rodina.js`);
const rules = JSON.parse(readFileSync(`${KLON}/rules.json`, 'utf8'));
const H26 = rules.redukcniHranice['2026'];
const H27 = rules.redukcniHranice['2027'];
const f = (x) => (x == null ? '—' : typeof x === 'number' ? new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(x) : String(x));
const radky = [];
let shod = 0, neshod = 0;
function radek(id, popis, vstup, muj, modul, zadani, poznamka = '') {
  const shoda = String(muj) === String(modul);
  if (shoda) shod++; else neshod++;
  radky.push({ id, popis, vstup, muj, modul, zadani, shoda: shoda ? 'ano' : 'NE', poznamka });
}

console.log(`# Nezávislý přepočet ROD – ${new Date().toISOString()} · modul: ${KLON}/rodina.js (commit 9ff80c3) · node ${process.version}`);
console.log('# Sloupce: Můj = referenční výpočet podle zákona (rodicovska-prepocet.mjs); Modul = rodina.js; Zadání = hodnota z docs/zadani.md (je-li).');
console.log('');

// ---------- Z: příklady ze zadání ----------
{
  const d = R.dvz(30000, 365); const dm = A.dvz(30000, 365);
  radek('Z1a', 'DVZ z 30 000 Kč (zadání)', '30 000 Kč, 365 dní', d.toFixed(2), dm.toFixed(2), '986,30');
  radek('Z1b', 'Redukovaný DVZ 2026 (zadání)', 'DVZ 986,30', R.redukce(d, 2026), A.redukovanyDvz(dm, H26, rules.ppm.redukce), '987');
  radek('Z1c', 'Redukovaný DVZ 2027', 'DVZ 986,30', R.redukce(d, 2027), A.redukovanyDvz(dm, H27, rules.ppm.redukce), '—');
  radek('Z1d', 'PPM denně z 987', 'red. DVZ 987', R.denniDavka(987), A.denniDavka(987, 0.7), '—');
}
{
  const rp = A.pravidlaRp(rules, '2026-06-01');
  radek('Z2', 'Strop RP při DVZ 1 000 (zadání)', 'red. DVZ 1 000', R.stropRp([1000]), A.stropRp({ redDvz: [1000] }, rp, rules), '21 000');
  radek('Z2b', 'Strop RP bez DVZ', 'red. DVZ —', R.stropRp([]), A.stropRp({ redDvz: [] }, rp, rules), '15 000');
  radek('Z2c', 'Strop RP max 2026 (DVZ 2 857)', 'red. DVZ 2 857', R.stropRp([2857]), A.stropRp({ redDvz: [2857] }, rp, rules), '—');
  radek('Z2d', 'Strop RP vícerčata, DVZ 1 000', 'red. DVZ 1 000, vícerčata', R.stropRp([1000], true), A.stropRp({ redDvz: [1000], vicercata: true }, rp, rules), '—');
}
{
  const m = R.cerpaniRp({ celkem: 350000, vyse: 15000 });
  const a = A.cerpaniRp({ celkem: 350000, mesicniVyse: 15000, odMesice: 0 });
  radek('Z3a', '15 000 Kč/měs. bez DVZ – vyčerpáno (zadání)', '350 000, 15 000/měs. od měsíce 0', m.vycerpano, a.vycerpano, '350 000');
  radek('Z3b', '15 000 Kč/měs. – počet měsíců výplaty', 'dtto', m.pocetMesicu, a.mesice.length, '24', 'zákon: § 30 odst. 6 ZSSP – zbytek 5 000 < 15 000 se vyplatí s 23. měsíční částkou (23 měsíců, poslední 20 000 Kč); zadání i modul: 24 měsíců (23 × 15 000 + 5 000)');
  radek('Z3c', '15 000 Kč/měs. – poslední částka', 'dtto', m.mesice.at(-1).castka, a.mesice.at(-1).castka, '5 000', 'viz Z3b');
  radek('Z3d', '15 000 Kč/měs. – měsíc vyčerpání (index)', 'dtto', m.mesicVycerpani, a.mesicVycerpani, '23', 'viz Z3b');
}
{
  const m = R.cerpaniRp({ celkem: 350000, vyse: 8000, od: 6 });
  const mz = R.cerpaniRp({ celkem: 350000, vyse: 8000, od: 6, do: 35, par30odst6: false }); // varianta podle zadání (36 měsíců, bez § 30 odst. 6)
  const a = A.cerpaniRp({ celkem: 350000, mesicniVyse: 8000, odMesice: 6 });
  radek('Z4a', '8 000 Kč od 6. měsíce – vyčerpáno do 3 let (zadání)', '350 000, 8 000/měs., měsíce 6–36', m.vycerpano, a.vycerpano, '240 000', `zákon: měsíc 3. narozenin se počítá celý (§ 30b odst. 1 písm. d)) → 31 měsíců × 8 000 = 248 000; varianta „jen do měsíce 35“ dává ${f(mz.vycerpano)} jako zadání`);
  radek('Z4b', '8 000 Kč od 6. měsíce – propadne (zadání)', 'dtto', m.propadne, a.propadne, '110 000', 'zákon 102 000 Kč; zadání i modul 110 000 Kč (o jednu měsíční částku víc)');
  const plan = A.planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 40000, kdoPpm: 'matka', otcovska: false, rpVyse: 8000 }, rules);
  const ref = R.planRef({ terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 40000, kdoPpm: 'matka', otcovska: false, rpVyse: 8000 });
  radek('Z4c', 'Celý plán: porod 15. 3. 2026, matka 30 000, otec 40 000, PPM matka, 8 000/měs. – PPM celkem', 'viz popis', ref.ppmCelkem, plan.souhrn.ppm, '—', 'PPM 1. 2.–15. 8. 2026, 196 × 691 Kč');
  radek('Z4d', '… strop RP', 'dtto', ref.strop, plan.rp.strop, '—', 'vyšší red. DVZ = otec (40 000 → 1 315,07 → 1 316 → 21 × 1 316 = 27 636)');
  radek('Z4e', '… první měsíc s RP (index)', 'dtto', ref.cerpani.mesice[0].index, plan.rp.odMesice, '6', 'v srpnu je PPM 15 × 691 = 10 365 > 8 000, RP tedy od září (index 6) i podle § 30b odst. 3');
  radek('Z4f', '… vyčerpáno / propadne', 'dtto', `${ref.cerpani.vycerpano} / ${ref.cerpani.propadne}`, `${plan.rp.vycerpano} / ${plan.rp.propadne}`, '240 000 / 110 000', 'viz Z4a');
  radek('Z4g', '… varování o propadnutí', 'dtto', 'ano', plan.varovani.some((x) => x.typ === 'propadnuti') ? 'ano' : 'ne', 'ano');
}
{
  const rp = A.pravidlaRp(rules, '2026-06-01');
  radek('Z5a', 'Vícerčata bez DVZ – strop (zadání)', 'vícerčata, DVZ —', R.stropRp([], true), A.stropRp({ redDvz: [], vicercata: true }, rp, rules), '30 000');
  const plan = A.planRodiny({ terminPorodu: '2026-06-01', vicercata: true, prijemMatka: 0, prijemOtec: 0, kdoPpm: 'nikdo', otcovska: false, rpVyse: 30000 }, rules);
  const ref = R.planRef({ terminPorodu: '2026-06-01', vicercata: true, prijemMatka: 0, prijemOtec: 0, kdoPpm: 'nikdo', otcovska: false, rpVyse: 30000 });
  radek('Z5b', 'Vícerčata bez DVZ – celkem (zadání)', 'porod 1. 6. 2026, 30 000/měs.', ref.celkem, plan.rp.celkem, '700 000');
  radek('Z5c', '… vyčerpáno / propadne', 'dtto', `${ref.cerpani.vycerpano} / ${ref.cerpani.propadne}`, `${plan.rp.vycerpano} / ${plan.rp.propadne}`, '—');
  radek('Z5d', '… počet měsíců výplaty / měsíc vyčerpání', 'dtto', `${ref.cerpani.pocetMesicu} / ${ref.cerpani.mesicVycerpani}`, `${plan.rp.mesiceCerpani} / ${plan.rp.mesicVycerpani}`, '—', '§ 30 odst. 6: zbytek 10 000 < 30 000 se vyplatí s 23. částkou (index 22); modul 24 měsíců');
}

// ---------- V: vlastní hraniční případy ----------
{
  const pripady = [
    ['V1a', 'DVZ přesně na 1. hranici 2026', 1633, 2026], ['V1b', 'DVZ těsně nad 1. hranicí', 1633.01, 2026],
    ['V1c', 'DVZ na 2. hranici 2026', 2449, 2026], ['V1d', 'DVZ na 3. hranici 2026', 4897, 2026], ['V1e', 'DVZ nad 3. hranicí 2026', 10000, 2026],
    ['V1f', 'DVZ na 3. hranici 2027', 5167, 2027], ['V1g', 'DVZ 4 931,51 (150 000 Kč) 2027', 4931.51, 2027],
    ['V1h', 'DVZ 0', 0, 2026], ['V1i', 'DVZ záporný', -500, 2026], ['V1j', 'DVZ NaN', NaN, 2026], ['V1k', 'DVZ 0,01', 0.01, 2026],
  ];
  for (const [id, popis, d, rok] of pripady) {
    radek(id, popis, `DVZ ${f(d)}, hranice ${rok}`, R.redukce(d, rok), A.redukovanyDvz(d, rules.redukcniHranice[String(rok)], rules.ppm.redukce), '—');
  }
  radek('V1l', 'Sken 1–300 000 Kč: zaokrouhlení pásem (§ 21 odst. 2) vs. bez něj – počet rozdílů 2026', 'příjem po 1 Kč, 365 dní', R.skenPasem(2026).length, '—', '—', 'informativní: modul pásma nezaokrouhluje; shoda s mým výpočtem viz V1m');
  let rozdilModul = 0; const priklady = [];
  for (let p = 1; p <= 300000; p++) {
    const d = R.dvz(p, 365);
    const a = R.redukce(d, 2026); const b = A.redukovanyDvz(A.dvz(p, 365), H26, rules.ppm.redukce);
    if (a !== b) { rozdilModul++; if (priklady.length < 5) priklady.push(`${p} Kč: ${a} vs ${b}`); }
  }
  radek('V1m', 'Sken 1–300 000 Kč: můj redukovaný DVZ 2026 vs. modul – počet rozdílů', 'dtto', 0, rozdilModul, '—', priklady.join('; ') || 'žádný rozdíl');
}
{
  radek('V2a', 'Rozhodné období – nástup 1. 2. 2027', '2/2026–1/2027', R.dnyRozhodneho('2027-02-01'), A.dnyRozhodnehoObdobi('2027-02-01'), '—');
  radek('V2b', 'Rozhodné období – nástup 10. 3. 2028 (přestupný únor 2028)', '3/2027–2/2028', R.dnyRozhodneho('2028-03-10'), A.dnyRozhodnehoObdobi('2028-03-10'), '—');
  radek('V2c', 'Rozhodné období – nástup 15. 1. 2026', '1/2025–12/2025', R.dnyRozhodneho('2026-01-15'), A.dnyRozhodnehoObdobi('2026-01-15'), '—');
  const d366 = R.dvz(30000, 366);
  radek('V2d', 'DVZ 30 000 Kč při 366 dnech', '30 000 × 12 / 366', d366.toFixed(2), A.dvz(30000, 366).toFixed(2), '—');
  radek('V2e', 'Denní PPM 2028 (hranice 2027 jako odhad)', `DVZ ${d366}`, R.denniDavka(R.redukce(d366, 2028)), A.denniDavka(A.redukovanyDvz(A.dvz(30000, 366), A.hraniceProDatum(rules, '2028-03-10'), rules.ppm.redukce), 0.7), '—');
}
{
  // Vstupy: 0, záporný, nesmyslný
  const rp = A.pravidlaRp(rules, '2026-06-01');
  radek('V3a', 'DVZ z příjmu 0', '0 Kč', R.dvz(0, 365), A.dvz(0, 365), '—');
  radek('V3b', 'DVZ z příjmu −30 000', '−30 000 Kč', R.dvz(-30000, 365), A.dvz(-30000, 365), '—');
  radek('V3c', 'DVZ z příjmu "abc"', '"abc"', R.dvz('abc', 365), A.dvz('abc', 365), '—');
  radek('V3d', 'DVZ z příjmu 1 000 000 000', '1e9 Kč', R.dvz(1e9, 365).toFixed(2), A.dvz(1e9, 365).toFixed(2), '—');
  radek('V3e', 'Strop RP se záporným DVZ v seznamu', 'red. DVZ [−5, 0]', R.stropRp([-5, 0]), A.stropRp({ redDvz: [-5, 0] }, rp, rules), '—');
  radek('V3f', 'Čerpání s výší 0', '350 000, 0/měs.', R.cerpaniRp({ celkem: 350000, vyse: 0 }).vycerpano, A.cerpaniRp({ celkem: 350000, mesicniVyse: 0 }).vycerpano, '—');
  radek('V3g', 'Čerpání se zápornou výší', '350 000, −1 000/měs.', R.cerpaniRp({ celkem: 350000, vyse: -1000 }).vycerpano, A.cerpaniRp({ celkem: 350000, mesicniVyse: -1000 }).vycerpano, '—');
}
{
  // V4: PPM přes přelom roku – § 22 odst. 2 ZNP (přepočet od 1. ledna) a DVZ pro strop k datu narození
  const vst = { terminPorodu: '2027-01-20', prijemMatka: 80000, prijemOtec: 0, narokOtec: false, kdoPpm: 'matka', otcovska: false, rpVyse: 15000 };
  const ref = R.planRef(vst); const plan = A.planRodiny(vst, rules);
  radek('V4a', 'PPM přes Nový rok: porod 20. 1. 2027, matka 80 000, nástup 9. 12. 2026 – DVZ', 'rozhodné období 12/2025–11/2026', ref.ppm.dvz.toFixed(2), plan.matka.ppm.dvz.toFixed(2), '—');
  radek('V4b', '… denní PPM v prosinci 2026 (hranice 2026)', 'red. DVZ 2 177', ref.ppm.sazbyRoku[2026].denni, plan.matka.ppm.denni, '—');
  radek('V4c', '… denní PPM od 1. 1. 2027 (hranice 2027, § 22 odst. 2 ZNP)', 'red. DVZ 2 254', ref.ppm.sazbyRoku[2027].denni, plan.matka.ppm.denni, '—', 'modul nechává sazbu roku nástupu po celých 196 dní (README: „hranice podle data nástupu“)');
  radek('V4d', '… PPM celkem za 196 dní', '23 dní 2026 + 173 dní 2027', ref.ppmCelkem, plan.souhrn.ppm, '—', `rozdíl ${f(ref.ppmCelkem - plan.souhrn.ppm)} Kč v neprospěch uživatele`);
  radek('V4e', '… strop RP (DVZ k datu narození 20. 1. 2027)', 'red. DVZ 2 254 → 21 × 2 254', ref.strop, plan.rp.strop, '—', 'modul bere red. DVZ k nástupu na PPM (2 177 → 45 717)');
  const vst2 = { terminPorodu: '2027-01-20', prijemMatka: 200000, kdoPpm: 'matka', otcovska: false };
  const ref2 = R.planRef(vst2); const plan2 = A.planRodiny(vst2, rules);
  radek('V4f', 'Test aplikace „porod v lednu 2027, 200 000 Kč“: denní PPM od 1. 1. 2027', 'DVZ 6 575,34 → max', ref2.ppm.sazbyRoku[2027].denni, plan2.matka.ppm.denni, '—', 'test rodina.test.js:108 zakonzervovává 2 000 Kč/den po celou PPM; zákon od 1. 1. 2027 2 061 Kč/den');
  radek('V4g', '… PPM celkem', 'dtto', ref2.ppmCelkem, plan2.souhrn.ppm, '—');
}
{
  // V5: nízký příjem – RP náleží už během PPM ve výši rozdílu (§ 30b odst. 3 ZSSP), od měsíce narození (§ 30b odst. 1 písm. a))
  const vst = { terminPorodu: '2026-03-15', prijemMatka: 15000, prijemOtec: 0, narokOtec: false, kdoPpm: 'matka', otcovska: false, rpVyse: 15000 };
  const ref = R.planRef(vst); const plan = A.planRodiny(vst, rules);
  const rpModul = Object.fromEntries(plan.mesice.map((m) => [m.index, m.polozky.filter((p) => p.typ === 'rp').reduce((s, p) => s + p.castka, 0)]));
  radek('V5a', 'Nízký příjem: porod 15. 3. 2026, matka 15 000 Kč, RP 15 000/měs. – denní PPM', 'DVZ 493,15 → 494 → 70 %', ref.ppm.sazbyRoku[2026].denni, plan.matka.ppm.denni, '—');
  for (const i of [0, 1, 5, 6]) {
    radek(`V5${'bcde'[[0, 1, 5, 6].indexOf(i)]}`, `… RP v měsíci ${i} (${['březen', 'duben', 'srpen', 'září'][[0, 1, 5, 6].indexOf(i)]} 2026)`, `PPM v měsíci ${f(ref.ppm.mesice.get(R.klicMesice(R.prvniDen('2026-03-15', i)))?.castka ?? 0)} Kč`, ref.rpPoMesicich[i] ?? 0, rpModul[i] ?? 0, '—', i < 6 ? 'zákon: rozdíl 15 000 − PPM (§ 30b odst. 3); modul: 0 („RP začíná v měsíci po mateřské“)' : '');
  }
  radek('V5f', '… měsíc vyčerpání (index)', 'dtto', ref.cerpani.mesicVycerpani, plan.rp.mesicVycerpani, '—');
  radek('V5g', '… vyčerpáno / propadne', 'dtto', `${ref.cerpani.vycerpano} / ${ref.cerpani.propadne}`, `${plan.rp.vycerpano} / ${plan.rp.propadne}`, '—');
}
{
  // V6: PPM čerpá otec od 7. týdne (matka bez nároku) – RP v měsíci narození a do nástupu otce
  const vst = { terminPorodu: '2026-03-15', prijemMatka: 0, narokMatka: false, prijemOtec: 50000, kdoPpm: 'otec', otcovska: false, rpVyse: null };
  const ref = R.planRef(vst); const plan = A.planRodiny(vst, rules);
  const rpModul = Object.fromEntries(plan.mesice.map((m) => [m.index, m.polozky.filter((p) => p.typ === 'rp').reduce((s, p) => s + p.castka, 0)]));
  radek('V6a', 'PPM otce: porod 15. 3. 2026, otec 50 000, matka bez nároku – začátek PPM otce', '7. týden po porodu', ref.ppm.start, plan.ppm.start, '—');
  radek('V6b', '… konec PPM otce (22 týdnů)', 'dtto', ref.ppm.konec, plan.ppm.konec, '—');
  radek('V6c', '… denní PPM otce', 'DVZ 1 643,84 → 1 640', ref.ppm.sazbyRoku[2026].denni, plan.otec.ppm.denni, '—');
  radek('V6d', '… strop RP', '21 × 1 640', ref.strop, plan.rp.strop, '—');
  radek('V6e', '… zvolená výše (návrh / maximum)', 'dtto', ref.vyse, plan.rp.vyse, '—', 'návrh výše je orientační a liší se počtem měsíců (36 vs. 37); porovnej V6f–h při stejné výši');
  const vst2 = { ...vst, rpVyse: 34440 };
  const ref2 = R.planRef(vst2); const plan2 = A.planRodiny(vst2, rules);
  const rpModul2 = Object.fromEntries(plan2.mesice.map((m) => [m.index, m.polozky.filter((p) => p.typ === 'rp').reduce((s, p) => s + p.castka, 0)]));
  radek('V6f', '… RP v měsíci 0 (březen 2026) při výši 34 440', 'bez PPM v měsíci', ref2.rpPoMesicich[0] ?? 0, rpModul2[0] ?? 0, '—', 'zákon: měsíc narození se počítá celý (§ 30b odst. 1 písm. a)); modul RP až po PPM otce');
  radek('V6g', '… RP v měsíci 1 (duben 2026)', 'PPM 5 × 1 148 = 5 740', ref2.rpPoMesicich[1] ?? 0, rpModul2[1] ?? 0, '—');
  radek('V6h', '… první měsíc s RP podle modulu (index)', 'dtto', 0, plan2.rp.odMesice, '—');
}
{
  // V7: měsíc 3. narozenin
  const vst = { terminPorodu: '2026-03-15', prijemMatka: 0, prijemOtec: 0, kdoPpm: 'nikdo', otcovska: false, rpVyse: 9000 };
  const ref = R.planRef(vst); const plan = A.planRodiny(vst, rules);
  radek('V7a', 'Bez PPM, 9 000 Kč/měs. od narození – počet měsíců s RP', 'měsíce 0–36 (3. narozeniny 15. 3. 2029)', ref.cerpani.pocetMesicu, plan.rp.mesiceCerpani, '—', 'zákon 37 měsíců (březen 2026 – březen 2029, § 30b odst. 1 písm. d)); modul 36 (končí únorem 2029)');
  radek('V7b', '… vyčerpáno / propadne', 'dtto', `${ref.cerpani.vycerpano} / ${ref.cerpani.propadne}`, `${plan.rp.vycerpano} / ${plan.rp.propadne}`, '—');
  radek('V7c', '… poslední měsíc časové osy modulu', 'dtto', 'bře 2029', plan.mesice.at(-1).popis, '—');
}
{
  // V8: otcovská – nástup a DVZ
  const vst = { terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'matka', otcovska: true, otcovskaOdDne: 0 };
  const ref = R.planRef(vst); const plan = A.planRodiny(vst, rules);
  radek('V8a', 'Otcovská od dne porodu: denní', 'otec 30 000, rozhodné období 3/2025–2/2026', ref.otcovska.sazbyRoku[2026].denni, plan.otec.otcovska.denni, '—');
  radek('V8b', '… celkem 14 dní', 'dtto', ref.otcovskaCelkem, plan.souhrn.otcovska, '—');
  const vst41 = { ...vst, otcovskaOdDne: 41 };
  const ref41 = R.planRef(vst41); const plan41 = A.planRodiny(vst41, rules);
  radek('V8c', 'Otcovská s nástupem 41. den po porodu (zákon: nástup do 6 týdnů, § 38a odst. 4)', 'otcovskaOdDne 41', ref41.otcovska.start, plan41.otec.otcovska.start, '—', 'modul omezí nástup na 28. den (rodina.js:269), aby dávka skončila do 6 týdnů – přísnější než zákon');
  const vst35 = { ...vst, otcovskaOdDne: 35 };
  radek('V8d', 'Otcovská s nástupem 35. den', 'otcovskaOdDne 35', R.planRef(vst35).otcovska.start, A.planRodiny(vst35, rules).otec.otcovska.start, '—');
  // otcovská přes Nový rok
  const vstNY = { terminPorodu: '2026-12-28', prijemMatka: 0, narokMatka: false, prijemOtec: 80000, kdoPpm: 'nikdo', otcovska: true, otcovskaOdDne: 0, rpVyse: 15000 };
  const refNY = R.planRef(vstNY); const planNY = A.planRodiny(vstNY, rules);
  radek('V8e', 'Otcovská 28. 12. 2026 – 10. 1. 2027, otec 80 000 – celkem', '4 dny 2026 + 10 dní 2027', refNY.otcovskaCelkem, planNY.souhrn.otcovska, '—', 'zákon: od 1. 1. 2027 nové hranice (§ 22 odst. 2)');
}
{
  // V9: § 30 odst. 6 u návrhu výše
  const m = R.cerpaniRp({ celkem: 350000, vyse: 11700, od: 6, do: 35 });
  const a = A.cerpaniRp({ celkem: 350000, mesicniVyse: 11700, odMesice: 6 });
  radek('V9a', '11 700 Kč od 6. měsíce, jen do měsíce 35 – měsíc vyčerpání', '28 × 11 700 = 327 600; zbytek', m.mesicVycerpani, a.mesicVycerpani, '—', '§ 30 odst. 6: po 28 částkách zbývá 22 400, z toho 10 700 < 11 700 → vyplatí se spolu v měsíci 34');
  radek('V9b', '… poslední částka', 'dtto', m.mesice.at(-1).castka, a.mesice.at(-1).castka, '—');
  radek('V9c', 'Návrh výše pro vyčerpání (350 000 od 6. měsíce)', 'ceil(350 000 / n / 100) × 100', Math.ceil(350000 / 31 / 100) * 100, A.navrhVyse(350000, 6, 36), '—', 'zákon 31 měsíců (6–36) → 11 300; modul 30 měsíců → 11 700 (konzervativní)');
}
{
  // V10: čistá mzda
  const p = A.parametryMzdy(rules, 2026);
  radek('V10a', 'Čistá mzda z 30 000 Kč (2026)', 'SP 7,1 %, ZP 4,5 %, daň 15 %, sleva 2 570', R.cistaMzda(30000), A.cistaMzda(30000, p), '—');
  radek('V10b', 'Čistá mzda z 150 000 Kč (nad 146 901)', '23 % nad hranicí', R.cistaMzda(150000), A.cistaMzda(150000, p), '—');
  radek('V10c', 'Čistá mzda z 20 800 Kč (min. mzda 2026)', 'dtto', R.cistaMzda(20800), A.cistaMzda(20800, p), '—');
  radek('V10d', 'Čistá mzda z 50 Kč (základ pod 100 Kč)', 'dtto', R.cistaMzda(50), A.cistaMzda(50, p), '—');
  radek('V10e', 'Parametry mzdy pro rok 2027', 'rules.json cistaMzda', '2027 (NV 177/2026 Sb.: hranice 154 989)', `${A.parametryMzdy(rules, 2027).rok}${A.parametryMzdy(rules, 2027).odhad ? ' (odhad)' : ''}`, '—', 'modul rok 2027 nemá a označuje odhad');
}
{
  // V11: RP podle data narození, hranice 2027 a vícerčata 2027
  radek('V11a', 'RP pro narození 31. 12. 2026', 'rules.rodicovsky', R.pravidlaRp('2026-12-31').celkem, A.pravidlaRp(rules, '2026-12-31').celkem, '—');
  radek('V11b', 'RP pro narození 1. 1. 2027', 'dtto', R.pravidlaRp('2027-01-01').celkem, A.pravidlaRp(rules, '2027-01-01').celkem, '—');
  radek('V11c', 'RP vícerčata 2027', 'dtto', R.pravidlaRp('2027-01-01').vicercata, A.pravidlaRp(rules, '2027-01-01').celkemVicercata, '—');
  radek('V11d', 'Redukovaný DVZ 2027 z 50 000 Kč', 'DVZ 1 643,84', R.redukce(R.dvz(50000, 365), 2027), A.redukovanyDvz(A.dvz(50000, 365), H27, rules.ppm.redukce), '—');
  radek('V11e', 'Max. redukovaný DVZ 2027', 'DVZ ≥ 5 167', R.redukce(5167, 2027), A.redukovanyDvz(5167, H27, rules.ppm.redukce), '—', 'README označuje 2 944 jako „(max)“ – skutečné maximum 2027 je 3 015');
  const d = R.dvz(50000, 365);
  radek('V11f', 'PPM 196 dní 2026 z 50 000 Kč (MPSV 225 008)', 'red. 1 640 → 1 148/den', 196 * R.denniDavka(R.redukce(d, 2026)), 196 * A.denniDavka(A.redukovanyDvz(A.dvz(50000, 365), H26, rules.ppm.redukce), 0.7), '225 008 (MPSV)');
}
{
  // V12: střídání – otec převezme PPM od 7. týdne, dohromady 28 týdnů (ZNP § 34 odst. 3; ČSSZ)
  const vst = { terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 60000, kdoPpm: 'matka', otcovska: false, stridani: true, stridaniOdMesice: 1 };
  const plan = A.planRodiny(vst, rules);
  const dnyM = plan.mesice.flatMap((m) => m.polozky).filter((p) => p.typ === 'ppm' && p.kdo === 'matka').reduce((s, p) => s + p.dni, 0);
  const dnyO = plan.mesice.flatMap((m) => m.polozky).filter((p) => p.typ === 'ppm' && p.kdo === 'otec').reduce((s, p) => s + p.dni, 0);
  radek('V12a', 'Střídání od 7. týdne: dny PPM matka + otec', 'matka od 1. 2. 2026, otec od 26. 4. 2026', '84 + 112 = 196', `${dnyM} + ${dnyO} = ${dnyM + dnyO}`, '—', 'otec: 22 týdnů − (12 týdnů matky − 6 týdnů šestinedělí) = 16 týdnů = 112 dní');
  radek('V12b', '… denní PPM otce (DVZ k 26. 4. 2026 z 60 000)', 'DVZ 1 972,60 → 1 837 → 1 286', R.denniDavka(R.redukce(R.dvz(60000, 365), 2026)), plan.otec.ppm.denni, '—');
}

// ---------- Výpis ----------
const sirky = [5, 70, 40, 22, 22, 18, 5];
const orez = (s, n) => { s = String(s); return s.length > n ? s.slice(0, n - 1) + '…' : s.padEnd(n); };
console.log(['ID', 'Případ', 'Vstup', 'Můj výpočet', 'Modul aplikace', 'Zadání', 'Shoda'].map((h, i) => orez(h, sirky[i])).join(' | '));
console.log(sirky.map((n) => '-'.repeat(n)).join('-|-'));
for (const r of radky) {
  console.log([r.id, r.popis, r.vstup, f(r.muj), f(r.modul), r.zadani, r.shoda].map((h, i) => orez(h, sirky[i])).join(' | '));
  if (r.poznamka) console.log(`      ↳ ${r.poznamka}`);
}
console.log('');
console.log(`Celkem řádků: ${radky.length} · shoda: ${shod} · neshoda: ${neshod}`);
console.log('');
console.log('## Strojově čitelný výpis (JSON)');
console.log(JSON.stringify(radky));
