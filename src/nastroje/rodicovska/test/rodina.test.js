import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  dvz, redukovanyDvz, denniDavka, dnyRozhodnehoObdobi, hraniceProDatum,
  pravidlaRp, stropRp, cerpaniRp, navrhVyse, cistaMzda, parametryMzdy,
  planRodiny, pridejDny, nastupOtcovskeMaxDne,
} from '../rodina.js';
import { kontrolniSeznam } from '../vystup.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const H2026 = rules.redukcniHranice['2026'];
const H2027 = rules.redukcniHranice['2027'];
const R = rules.ppm.redukce;

// ---------- Požadované případy ze zadání ----------

test('příjem 30 000 Kč měsíčně → DVZ 986,30 Kč, redukovaný DVZ 987 Kč', () => {
  const d = dvz(30000, 365);
  assert.equal(d.toFixed(2), '986.30');
  assert.equal(redukovanyDvz(d, H2026, R), 987);
  assert.equal(redukovanyDvz(d, H2027, R), 987);
});

test('DVZ 1 000 Kč → strop rodičovské 21 000 Kč měsíčně', () => {
  const rp = pravidlaRp(rules, '2026-06-01');
  assert.equal(stropRp({ redDvz: [1000], vicercata: false }, rp, rules), 21000);
});

// Revize 5. 11. 2026, ROD-05: § 30 odst. 6 ZSSP – zbytek nižší než měsíční částka se vyplatí
// spolu s částkou za aktuální měsíc. Původní test (24 měsíců, poslední 5 000 Kč) a zadání
// „23 × 15 000 + 5 000“ odporovaly zákonu.
test('bez DVZ, 15 000 Kč měsíčně → 350 000 Kč za 23 měsíců, poslední 20 000 Kč (§ 30 odst. 6 ZSSP)', () => {
  const rp = pravidlaRp(rules, '2026-06-01');
  const strop = stropRp({ redDvz: [], vicercata: false }, rp, rules);
  assert.equal(strop, 15000);
  const c = cerpaniRp({ celkem: rp.celkem, mesicniVyse: 15000, odMesice: 0 });
  assert.equal(c.vycerpano, 350000);
  assert.equal(c.mesice.length, 23);
  assert.equal(c.mesice.filter((m) => m.castka === 15000).length, 22);
  assert.equal(c.mesice.at(-1).castka, 20000);
  assert.equal(c.mesicVycerpani, 22);
  assert.equal(c.propadne, 0);
});

// Revize 5. 11. 2026, ROD-01: § 30b odst. 1 písm. d) ZSSP – měsíc 3. narozenin se počítá celý.
// Původní test (240 000 / 110 000 Kč) i zadání chybu konzervovaly.
test('rodičovská od 6. měsíce po 8 000 Kč → do 3 let 248 000 Kč včetně měsíce 3. narozenin, propadne 102 000 Kč', () => {
  const c = cerpaniRp({ celkem: 350000, mesicniVyse: 8000, odMesice: 6 });
  assert.equal(c.vycerpano, 248000);
  assert.equal(c.propadne, 102000);
  assert.equal(c.mesice.length, 31);
  assert.equal(c.mesice.at(-1).mesic, 36);
  assert.equal(c.mesicVycerpani, null);

  // Celý plán: matka na mateřské 6 týdnů před porodem → RP od 6. měsíce dítěte.
  const plan = planRodiny({
    terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 40000,
    kdoPpm: 'matka', otcovska: false, rpVyse: 8000,
  }, rules);
  assert.equal(plan.rp.odMesice, 6);
  assert.equal(plan.rp.vycerpano, 248000);
  assert.equal(plan.rp.propadne, 102000);
  assert.equal(plan.mesice.at(-1).index, 36, 'plán končí měsícem 3. narozenin');
  assert.equal(plan.mesice.at(-1).polozky.find((p) => p.typ === 'rp').castka, 8000);
  const v = plan.varovani.find((x) => x.typ === 'propadnuti');
  assert.ok(v, 'chybí varování o propadnutí');
  assert.match(v.text, /102\s000/);
});

test('vícerčata bez DVZ → strop 30 000 Kč, celkem 700 000 Kč', () => {
  const rp = pravidlaRp(rules, '2026-06-01');
  assert.equal(stropRp({ redDvz: [], vicercata: true }, rp, rules), 30000);
  const plan = planRodiny({
    terminPorodu: '2026-06-01', vicercata: true, prijemMatka: 0, prijemOtec: 0,
    kdoPpm: 'nikdo', otcovska: false, rpVyse: 30000,
  }, rules);
  assert.equal(plan.rp.strop, 30000);
  assert.equal(plan.rp.celkem, 700000);
  assert.equal(plan.rp.vycerpano, 700000);
  assert.equal(plan.rp.propadne, 0);
});

// ---------- Další kontroly ----------

test('mateřská z příjmu 30 000 Kč = 691 Kč denně (70 % z 987, nahoru)', () => {
  assert.equal(denniDavka(987, 0.7), 691);
});

test('redukce po pásmech 2026: 100 % / 60 % / 30 % a nic nad 3. hranicí', () => {
  assert.equal(redukovanyDvz(1633, H2026, R), 1633);
  assert.equal(redukovanyDvz(2000, H2026, R), Math.ceil(1633 + 0.6 * 367));        // 1853,2 → 1854
  assert.equal(redukovanyDvz(3000, H2026, R), Math.ceil(1633 + 0.6 * 816 + 0.3 * 551)); // 2287,9 → 2288
  assert.equal(redukovanyDvz(4897, H2026, R), 2857);
  assert.equal(redukovanyDvz(10000, H2026, R), 2857);
});

test('maximální strop RP 2026 = 59 997 Kč (0,7 × 30 × 2 857)', () => {
  const rp = pravidlaRp(rules, '2026-06-01');
  assert.equal(stropRp({ redDvz: [2857], vicercata: false }, rp, rules), 59997);
  assert.equal(stropRp({ redDvz: [500, 2857], vicercata: false }, rp, rules), 59997, 'použije se vyšší DVZ');
  assert.equal(stropRp({ redDvz: [1000], vicercata: true }, rp, rules), 42000, 'vícerčata 2 × 0,7 × 30 × DVZ');
});

test('počet dní rozhodného období (12 kalendářních měsíců před měsícem nároku)', () => {
  assert.equal(dnyRozhodnehoObdobi('2027-02-01'), 365); // 2/2026–1/2027
  assert.equal(dnyRozhodnehoObdobi('2028-03-10'), 366); // 3/2027–2/2028 obsahuje 29. 2. 2028
});

test('redukční hranice podle roku nástupu, neznámý rok → poslední známé s příznakem odhadu', () => {
  assert.equal(hraniceProDatum(rules, '2026-12-20').h1, 1633);
  assert.equal(hraniceProDatum(rules, '2027-01-05').h1, 1723);
  const h = hraniceProDatum(rules, '2028-02-01');
  assert.equal(h.rok, 2027);
  assert.equal(h.odhad, true);
});

// Revize 5. 11. 2026, ROD-03: § 22 odst. 2 ZNP – dávka trvající přes 1. leden se od 1. 1.
// přepočítá podle nových redukčních hranic. Původní test čekal 2 000 Kč/den po celou dobu.
test('porod v lednu 2027 s nástupem v prosinci 2026 → do 31. 12. hranice 2026, od 1. 1. hranice 2027', () => {
  const plan = planRodiny({ terminPorodu: '2027-01-20', prijemMatka: 200000, kdoPpm: 'matka' }, rules);
  assert.equal(plan.matka.ppm.hranice.rok, 2026);
  assert.equal(plan.matka.ppm.redDvz, 2857);
  assert.equal(plan.matka.ppm.denni, 2000); // 0,7 × 2857 = 1999,9 → 2000
  assert.deepEqual(plan.matka.ppm.sazby.map((x) => [x.rok, x.denni]), [[2026, 2000], [2027, 2111]]);
  assert.equal(plan.souhrn.ppm, 23 * 2000 + 173 * 2111); // 411 203 Kč
  assert.equal(plan.rp.celkem, 400000);
});

test('ROD-03: mateřská 80 000 Kč přes Nový rok a strop RP z hranic roku narození', () => {
  const plan = planRodiny({ terminPorodu: '2027-01-20', prijemMatka: 80000, kdoPpm: 'matka', otcovska: false }, rules);
  assert.equal(plan.souhrn.ppm, 308046);
  const ppmV = (rok, mesic) => plan.mesice.find((m) => m.rok === rok && m.mesic === mesic).polozky.find((p) => p.typ === 'ppm').castka;
  assert.equal(ppmV(2026, 12), 23 * 1524);
  assert.equal(ppmV(2027, 1), 31 * 1578);
  assert.equal(plan.rp.strop, 47334);
  // dávka celá v jednom roce se nemění
  const r2026 = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, kdoPpm: 'matka', otcovska: false }, rules);
  assert.equal(r2026.souhrn.ppm, 135436);
});

test('ROD-03: otcovská 28. 12. 2026 – 10. 1. 2027 → 4 dny podle hranic 2026 a 10 dní podle 2027', () => {
  const plan = planRodiny({ terminPorodu: '2026-12-24', prijemMatka: 30000, prijemOtec: 80000, kdoPpm: 'matka', otcovska: true, otcovskaOdDne: 4 }, rules);
  assert.equal(plan.otec.otcovska.start, '2026-12-28');
  assert.equal(plan.souhrn.otcovska, 4 * 1524 + 10 * 1578);
});

// Revize 5. 11. 2026, ROD-02: § 30b odst. 3 ZSSP – souběžně s mateřskou náleží rodičovská
// ve výši rozdílu, když je vyšší, a to už od měsíce narození.
test('ROD-02: rodičovská souběžně s mateřskou ve výši rozdílu od měsíce narození', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 15000, kdoPpm: 'matka', otcovska: false, rpVyse: 15000 }, rules);
  const rpV = (i) => plan.mesice.find((m) => m.index === i).polozky.find((p) => p.typ === 'rp')?.castka ?? 0;
  assert.equal(plan.matka.ppm.denni, 346);
  assert.equal(rpV(0), 15000 - 31 * 346);
  assert.equal(rpV(1), 15000 - 30 * 346);
  assert.equal(rpV(5), 15000 - 15 * 346);
  assert.equal(rpV(6), 15000);
  assert.equal(plan.rp.odMesice, 0);
  assert.ok(plan.rp.mesicVycerpani < 29, 'vyčerpá se dřív než bez souběhu');
  assert.equal(plan.rp.vycerpano, 350000);
});

test('ROD-02: otec na mateřské od 7. týdne, matka bez nároku → RP od narození, pak rozdíl', () => {
  const plan = planRodiny({
    terminPorodu: '2026-03-15', prijemMatka: 0, narokMatka: false, prijemOtec: 50000,
    kdoPpm: 'otec', otcovska: false, rpVyse: 34440,
  }, rules);
  const rpV = (i) => plan.mesice.find((m) => m.index === i).polozky.find((p) => p.typ === 'rp')?.castka ?? 0;
  assert.equal(plan.rp.strop, 34440);
  assert.equal(plan.otec.ppm.denni, 1148);
  assert.equal(rpV(0), 34440);
  assert.equal(rpV(1), 34440 - 5 * 1148);
});

test('ROD-02: mateřská vyšší než zvolená rodičovská → v měsících mateřské žádná rodičovská', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, kdoPpm: 'matka', otcovska: false, rpVyse: 8000 }, rules);
  for (let i = 0; i < 6; i++) {
    assert.equal(plan.mesice.find((m) => m.index === i).polozky.some((p) => p.typ === 'rp'), false, `měsíc ${i}`);
  }
});

test('narození od 1. 1. 2027 → 400 000 Kč, stejný scénář 8 000 Kč od 6. měsíce → propadne 152 000 Kč', () => {
  const plan = planRodiny({
    terminPorodu: '2027-03-15', prijemMatka: 30000, prijemOtec: 40000,
    kdoPpm: 'matka', otcovska: false, rpVyse: 8000,
  }, rules);
  assert.equal(plan.rp.celkem, 400000);
  assert.equal(plan.rp.vycerpano, 248000);
  assert.equal(plan.rp.propadne, 152000);
  assert.ok(plan.varovani.some((x) => x.typ === 'novela400'));
  // Společný model stavu: 400 000 Kč je schválené (zákon č. 152/2026 Sb.), 350 000 Kč platí.
  assert.equal(plan.rp.stav, 'schvaleno');
  assert.equal(pravidlaRp(rules, '2026-06-01').stav, 'plati');
  const plan2026 = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 40000, kdoPpm: 'matka', otcovska: false, rpVyse: 8000 }, rules);
  assert.ok(!plan2026.varovani.some((x) => x.typ === 'novela400'));
});

test('vícerčata 2027 → 800 000 Kč', () => {
  assert.equal(pravidlaRp(rules, '2027-01-01').celkemVicercata, 800000);
});

test('návrh výše pro vyčerpání do 3 let', () => {
  assert.equal(navrhVyse(350000, 6, 36), 11300); // 350 000 / 31 měsíců (6.–36.) = 11 290,32 → nahoru na stovky
  const c = cerpaniRp({ celkem: 350000, mesicniVyse: 11300, odMesice: 6 });
  assert.equal(c.propadne, 0);
  // Návrh v plánu počítá i se souběhem s mateřskou a vyčerpá celou částku.
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 15000, kdoPpm: 'matka', otcovska: false }, rules);
  assert.equal(plan.rp.propadne, 0);
  assert.equal(plan.rp.vycerpano, 350000);
});

test('orientační čistá mzda zaměstnance 2026 z 30 000 Kč = 24 590 Kč', () => {
  const p = parametryMzdy(rules, 2026);
  // SP 2 130, ZP 1 350, daň 4 500 − sleva 2 570 = 1 930
  assert.equal(cistaMzda(30000, p), 24590);
  assert.equal(cistaMzda(0, p), 0);
});

test('mateřská se rozpadne do kalendářních měsíců: 196 dní celkem', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, kdoPpm: 'matka', otcovska: false }, rules);
  const dny = plan.mesice.flatMap((m) => m.polozky).filter((p) => p.typ === 'ppm').reduce((s, p) => s + p.dni, 0);
  assert.equal(dny, 196);
  assert.equal(plan.souhrn.ppm, 196 * 691);
  assert.equal(plan.ppm.start, pridejDny('2026-03-15', -42));
});

test('vícerčata: mateřská 37 týdnů', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', vicercata: true, prijemMatka: 30000, kdoPpm: 'matka', otcovska: false }, rules);
  const dny = plan.mesice.flatMap((m) => m.polozky).filter((p) => p.typ === 'ppm').reduce((s, p) => s + p.dni, 0);
  assert.equal(dny, 259);
});

test('otcovská 14 dní, 70 % redukovaného DVZ otce', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'matka', otcovska: true }, rules);
  assert.equal(plan.otec.otcovska.denni, 691);
  assert.equal(plan.souhrn.otcovska, 14 * 691);
});

// Revize 5. 11. 2026, ROD-09: § 38a odst. 4 zákona č. 187/2006 Sb. – nástup na otcovskou
// „v období 6 týdnů ode dne narození“ (0.–41. den), § 38b odst. 1 – podpůrčí doba 2 týdny.
// Dřív modul posunul každý nástup po 28. dni na 28. den.
test('otcovská od 35. a 41. dne se neposune na 28. den, později se omezí na 41. den', () => {
  const zaklad = { terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'matka', otcovska: true };
  assert.equal(rules.otcovska.nastupDoDne, 41);
  assert.match(rules.otcovska.zdroj.pravniZaklad, /§ 38a odst\. 4/);
  assert.match(rules.otcovska.zdroj.citace, /v období 6 týdnů ode dne narození/);
  const p35 = planRodiny({ ...zaklad, otcovskaOdDne: 35 }, rules);
  assert.equal(p35.otec.otcovska.start, '2026-04-19');
  assert.equal(p35.otec.otcovska.konec, '2026-05-02');
  assert.equal(p35.souhrn.otcovska, 14 * 691);
  const p41 = planRodiny({ ...zaklad, otcovskaOdDne: 41 }, rules);
  assert.equal(p41.otec.otcovska.start, '2026-04-25');
  assert.equal(p41.otec.otcovska.konec, '2026-05-08');
  assert.equal(p41.souhrn.otcovska, 14 * 691);
  assert.equal(planRodiny({ ...zaklad, otcovskaOdDne: 42 }, rules).otec.otcovska.start, '2026-04-25');
});

// § 48 odst. 1 písm. a) zákona č. 187/2006 Sb.: z jednoho pojištění má přednost mateřská.
// Když otec převezme mateřskou od 42. dne a otcovská ještě běží, za společné dny se vyplácí jen mateřská.
test('otcovská překrytá mateřskou otce: za společné dny jen mateřská, s upozorněním', () => {
  const plan = planRodiny({
    terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'otec', otcovska: true, otcovskaOdDne: 35,
  }, rules);
  // otcovská 35.–48. den, mateřská otce od 42. dne → otcovská se vyplatí za 35.–41. den (7 dní)
  assert.equal(plan.souhrn.otcovska, 7 * 691);
  assert.ok(plan.varovani.some((x) => x.typ === 'otcovskaSMaterskou'));
  const bez = planRodiny({
    terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 30000, kdoPpm: 'otec', otcovska: true, otcovskaOdDne: 20,
  }, rules);
  assert.equal(bez.souhrn.otcovska, 14 * 691);
  assert.ok(!bez.varovani.some((x) => x.typ === 'otcovskaSMaterskou'));
});

// Další práce (13. 11. 2026): mez nástupu počítá nastupOtcovskeMaxDne() z rules.json
// (6 týdnů + dny hospitalizace dítěte), už ne konstanta OTCOVSKA_MAX.
test('formulář dovolí nástup na otcovskou do dne z rules.otcovska.nastupDoDne (+ dny hospitalizace)', async () => {
  const { default: data } = await import('../rodicovska.11tydata.js');
  assert.equal(data.rodicovska.otcovskaMax, rules.otcovska.nastupDoDne);
  assert.match(data.rodicovska.napovedy.otcovskaOd, /nejvýš 41/);
  const app = readFileSync(new URL('../app.js', import.meta.url), 'utf8');
  assert.match(app, /HOSPITALIZACE_MAX = pravidla\.otcovska\.hospitalizace\.maxDni/);
  assert.match(app, /nastupOtcovskeMaxDne\(pravidla, \{ hospitalizace, hospitalizaceDni/);
  assert.match(app, /celeCislo\('otcovska-od', 0, otcovskaMax,/);
});

test('střídání: otec převezme mateřskou nejdříve od 7. týdne a RP pak pobírá on', () => {
  const plan = planRodiny({
    terminPorodu: '2026-03-15', prijemMatka: 30000, prijemOtec: 60000, kdoPpm: 'matka',
    otcovska: false, stridani: true, stridaniOdMesice: 1,
  }, rules);
  const prevzeti = plan.mesice.flatMap((m) => m.polozky).find((p) => p.typ === 'ppm' && p.kdo === 'otec');
  assert.ok(prevzeti, 'otec nepobírá mateřskou');
  assert.ok(plan.varovani.some((x) => x.typ === 'sestinedeli'));
  const rpMesic = plan.mesice.find((m) => m.polozky.some((p) => p.typ === 'rp'));
  assert.equal(rpMesic.polozky.find((p) => p.typ === 'rp').kdo, 'otec');
  // strop podle vyššího DVZ (otec)
  assert.ok(plan.rp.strop > 21000);
});

test('výše nad stropem se omezí a aplikace upozorní', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 0, prijemOtec: 0, kdoPpm: 'nikdo', rpVyse: 40000 }, rules);
  assert.equal(plan.rp.vyse, 15000);
  assert.ok(plan.varovani.some((x) => x.typ === 'nadStrop'));
});

test('bez mateřské začíná RP v měsíci narození a mzda otce se počítá', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 0, prijemOtec: 30000, kdoPpm: 'nikdo', otcovska: false, rpVyse: 10000 }, rules);
  assert.equal(plan.rp.odMesice, 0);
  assert.equal(plan.mesice[0].index, 0);
  assert.equal(plan.mesice[1].polozky.find((p) => p.typ === 'mzda' && p.kdo === 'otec').castka, 24590);
});

// Revize 5. 11. 2026, ROD-04: § 31 odst. 3 písm. a) ZSSP – 120 hodin (dřív 92).
test('dřívější návrat do práce do 2 let → upozornění na limit jeslí 120 hodin', () => {
  const plan = planRodiny({ terminPorodu: '2026-03-15', prijemMatka: 30000, kdoPpm: 'matka', navrat: true, navratOdMesice: 12 }, rules);
  assert.equal(rules.jesleHodinMesicne, 120);
  assert.match(rules.jesle.zdroj.pravniZaklad, /§ 31 odst\. 3 písm\. a\)/);
  const j = plan.varovani.find((x) => x.typ === 'jesle');
  assert.match(j.text, /120 hodin/);
  assert.doesNotMatch(j.text, /92/);
  const m12 = plan.mesice.find((m) => m.index === 12);
  assert.ok(m12.polozky.some((p) => p.typ === 'mzda' && p.kdo === 'matka'));
});

// Revize 5. 11. 2026, ROD-12: čistá mzda 2027 – hranice 23 % = 3 × průměrná mzda 51 663 Kč
// (NV č. 177/2026 Sb.: 48 900 × 1,0565, § 23b odst. 4 zákona č. 589/1992 Sb.; § 38h odst. 2 ZDP).
test('ROD-12: parametry čisté mzdy 2027 z úředních zdrojů, hranice 23 % 154 989 Kč', () => {
  const p = parametryMzdy(rules, 2027);
  assert.equal(p.rok, 2027);
  assert.equal(p.odhad, false);
  assert.equal(p.hraniceDan2Mesic, 154989);
  assert.equal(p.sp, 0.071);
  assert.equal(p.zp, 0.045);
  assert.equal(p.slevaMesic, 2570);
  assert.equal(Math.ceil(p.prumernaMzda.vvz * p.prumernaMzda.koeficient), p.prumernaMzda.castka);
  assert.equal(3 * p.prumernaMzda.castka, p.hraniceDan2Mesic);
  // 155 000 Kč: v roce 2027 jen 11 Kč nad hranicí 23 % (2026 by to bylo 8 099 Kč).
  assert.equal(cistaMzda(155000, p), 116339);
  assert.equal(cistaMzda(155000, parametryMzdy(rules, 2026)), 115692);
  const p28 = parametryMzdy(rules, 2028);
  assert.equal(p28.rok, 2027);
  assert.equal(p28.odhad, true);
});

// Revize 5. 11. 2026, ROD-13: DVZ jde stanovit i matce bez nároku na mateřskou (§ 30 odst. 2 ZSSP).
test('ROD-13: matka bez 270 dní pojištění, ale s příjmem → strop RP z jejího DVZ', () => {
  const zaklad = { terminPorodu: '2027-03-15', prijemMatka: 60000, prijemOtec: 0, narokOtec: false, kdoPpm: 'nikdo', otcovska: false };
  const sNarokem = planRodiny({ ...zaklad, narokMatka: true }, rules);
  const bezNaroku = planRodiny({ ...zaklad, narokMatka: false }, rules);
  assert.ok(sNarokem.rp.strop > rules.rodicovsky[1].minStrop);
  assert.equal(bezNaroku.rp.strop, sNarokem.rp.strop);
  assert.ok(bezNaroku.varovani.some((x) => x.typ === 'dvzBezNaroku' && /§ 30 odst\. 2/.test(x.text)));
  // Bez příjmu DVZ není, strop je zákonné minimum.
  const bezPrijmu = planRodiny({ ...zaklad, prijemMatka: 0, narokMatka: false }, rules);
  assert.equal(bezPrijmu.rp.strop, rules.rodicovsky[1].minStrop);
});

test('ROD-13: jednorázová výplata zbytku jen s DVZ nebo OSVČ (§ 30a odst. 1 ZSSP)', () => {
  const plan = planRodiny({ terminPorodu: '2027-03-15', prijemMatka: 30000, kdoPpm: 'matka' }, rules);
  const u = kontrolniSeznam(plan, rules).find((x) => /další dítě/.test(x.ukol));
  assert.match(u.ukol, /denní vyměřovací základ/);
  assert.match(u.ukol, /OSVČ/);
  assert.match(u.ukol, /§ 30a odst\. 1/);
});

// Další práce po revizi (13. 11. 2026): průměrná mzda 2026 48 967 Kč z úředního předpisu, ne jen ze stránky MPSV.
// NV č. 365/2025 Sb., § 1: VVZ 2024 = 46 278 Kč, koeficient 1,0581 → 48 966,75 → nahoru 48 967 Kč
// (§ 23b odst. 4 zákona č. 589/1992 Sb.); § 21g odst. 2 a § 38h odst. 2 ZDP: záloha 23 % nad 3násobek.
test('čistá mzda 2026: hranice 23 % = 3 × průměrná mzda z NV č. 365/2025 Sb.', () => {
  const p = parametryMzdy(rules, 2026);
  assert.equal(p.rok, 2026);
  assert.equal(p.prumernaMzda.vvz, 46278);
  assert.equal(p.prumernaMzda.koeficient, 1.0581);
  assert.equal(Math.ceil(p.prumernaMzda.vvz * p.prumernaMzda.koeficient), p.prumernaMzda.castka);
  assert.equal(p.prumernaMzda.castka, 48967);
  assert.equal(3 * p.prumernaMzda.castka, p.hraniceDan2Mesic);
  const z = p.prumernaMzda.zdroj;
  assert.match(z.pravniZaklad, /365\/2025 Sb\./);
  assert.match(z.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/2025-365#p1$/);
  assert.match(z.citace, /46278 Kč/);
  assert.match(z.citace, /1,0581/);
  assert.equal(typeof p.zdroj, 'object');
  assert.match(p.zdroj.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/1992-586#p38h$/);
  assert.match(p.zdroj.citace, /3násobku průměrné mzdy/);
  assert.match(p.zdroj.citace, /§ 21g odst\. 2/);
  assert.ok(rules.meta.zdroje.some((x) => x.url === 'https://www.zakonyprolidi.cz/cs/2025-365'), 'meta.zdroje: NV 365/2025 Sb.');
});

// Další práce po revizi (13. 11. 2026): § 38a odst. 4 věta třetí zákona č. 187/2006 Sb. – období pro nástup
// na otcovskou (6 týdnů) se prodlužuje o dny hospitalizace dítěte, které spadají do těchto 6 týdnů.
test('otcovská: hospitalizace dítěte prodlouží lhůtu nástupu o dny v nemocnici (nejvýš 6 týdnů)', () => {
  const h = rules.otcovska.hospitalizace;
  assert.equal(rules.otcovska.nastupDoDne, 41);
  assert.equal(h.maxDni, 42);
  assert.match(h.zdroj.url, /^https:\/\/www\.zakonyprolidi\.cz\/cs\/2006-187#p38a$/);
  assert.match(h.zdroj.citace, /prodlužuje o kalendářní dny, po které bylo dítě hospitalizováno/);
  assert.match(h.zdroj.citace, /den přijetí dítěte/);
  assert.match(h.zdroj.pravniZaklad, /§ 38a odst\. 4 věta třetí/);

  assert.equal(nastupOtcovskeMaxDne(rules, {}), 41);
  assert.equal(nastupOtcovskeMaxDne(rules, { hospitalizace: false, hospitalizaceDni: 10 }), 41);
  assert.equal(nastupOtcovskeMaxDne(rules, { hospitalizace: true, hospitalizaceDni: 10 }), 51);
  assert.equal(nastupOtcovskeMaxDne(rules, { hospitalizace: true, hospitalizaceDni: 99 }), 83);

  const zaklad = { terminPorodu: '2027-04-15', prijemMatka: 40000, prijemOtec: 50000, kdoPpm: 'matka', otcovska: true, otcovskaOdDne: 50 };
  // bez hospitalizace se nástup omezí na 41. den
  assert.equal(planRodiny(zaklad, rules).otec.otcovska.start, pridejDny('2027-04-15', 41));
  // 10 dní v nemocnici → nástup 50. den je v pořádku
  const s = planRodiny({ ...zaklad, hospitalizace: true, hospitalizaceDni: 10 }, rules);
  assert.equal(s.otec.otcovska.start, pridejDny('2027-04-15', 50));
  assert.equal(s.otec.otcovska.nastupNejpozdeji, pridejDny('2027-04-15', 51));
  // kontrolní seznam ukáže prodloužený termín
  const otc = kontrolniSeznam(s, rules).find((p) => /^Otcovská/.test(p.ukol));
  assert.match(otc.termin, /nejpozději 5\.\s6\.\s2027$/);
  assert.match(otc.ukol, /nemocnici/);
});
