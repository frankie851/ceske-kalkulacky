// Porovnání: vlastní referenční výpočet (plan48-prepocet.mjs) vs. výpočetní modul aplikace
// (/tmp/revize/repos/plan48/calc.js + rules.json). Výstup: dukazy/plan48/prepocet.txt.
// Spouští se dvakrát po sobě (dva nové procesy) kvůli „reprodukováno 2×“; druhý běh připojí sekci.
import { readFileSync, writeFileSync, appendFileSync, existsSync } from 'node:fs';
import { PRIPADY, spocitejPripad, profil } from './plan48-prepocet.mjs';

const REPO = process.env.PLAN48_REPO ?? '/tmp/revize/repos/plan48';
const calc = await import(`${REPO}/calc.js`);
const rules = JSON.parse(readFileSync(`${REPO}/rules.json`, 'utf8'));
const vystup = new URL('../plan48/prepocet.txt', import.meta.url).pathname;

const fmt = (n) => (typeof n === 'number' ? new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 2 }).format(n) : String(n));
const radky = [];
const log = (s = '') => radky.push(s);

log(`# Plán48 – nezávislý přepočet vs. modul aplikace · ${new Date().toISOString()} · pid ${process.pid} · node ${process.version}`);
log(`# modul: ${REPO}/calc.js, rules.json (sady: ${Object.keys(rules.sady).join(', ')})`);
log('');
log('| ID | Případ | Vstup | Můj výpočet | Modul aplikace | Shoda |');
log('|---|---|---|---|---|---|');

let shod = 0, neshod = 0;
function porovnej(id, popis, vstup, muj, modul) {
  const klice = Object.keys(muj);
  const rozdily = klice.filter((k) => Math.abs((muj[k] ?? NaN) - (modul[k] ?? NaN)) > 0.005);
  const ok = rozdily.length === 0;
  ok ? shod++ : neshod++;
  const s = (o) => klice.map((k) => `${k}=${fmt(o[k])}`).join(', ');
  log(`| ${id} | ${popis} | ${vstup} | ${s(muj)} | ${s(modul)} | ${ok ? 'ano' : 'NE (' + rozdily.join(', ') + ')'} |`);
}

for (const c of PRIPADY) {
  const muj = spocitejPripad(c);
  const v = c.vstup ?? {};
  const sadaKlic = v.sada ?? '2026';
  const sada = rules.sady[sadaKlic];
  const vek = v.vek ?? 40;
  const sazba = v.sazba ?? 0.15;

  if (c.rada) {
    const r = c.rada;
    const vys = calc.spocitejRok({ vek, sazbaDane: sazba, dps: r.dps, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: r.probehlo, starobniDuchod: !!r.duchodce }, sada);
    const d = vys.doporuceni;
    // odpočet po navýšení v modulu není vrácen přímo – dopočet stejným způsobem jako modul (roční úhrn − 20 400)
    const dpsPo = r.dps * r.probehlo + (r.navysitNa ?? r.dps) * (12 - r.probehlo);
    const oPo = calc.odpocet({ dpsRocne: dpsPo, starobniDuchod: !!r.duchodce }, sada);
    const modul = {
      odpocetPoNavyseni: oPo.vyuzity,
      nevyuzity: oPo.nevyuzity,
      doplatekDipZp: d.odpocet?.doplatekDipZp ?? 0,
      doplatekDps: d.odpocet?.doplatekDps ?? 0,
      ziskatePrispevek: d.prispevek?.ziskate ?? 0,
      propadlo: d.prispevek?.propadlo ?? 0,
    };
    porovnej(c.id, c.popis, JSON.stringify(r), muj, modul);
    continue;
  }

  if (v.dpsMesice) {
    // modul nezná měsíční profil – dostane roční úhrn, jak to dělá app (dps × 12) / jak to dělá test aplikace
    const rocne = v.dpsMesice.reduce((a, b) => a + b, 0);
    const o = calc.odpocet({ dpsRocne: rocne }, sada);
    const modul = { prispevekMesic: calc.statniPrispevekMesicni(v.dpsMesice[0], vek, sada), prispevekRok: 12 * calc.statniPrispevekMesicni(v.dpsMesice[0], vek, sada), odpocet: o.vyuzity, nevyuzity: o.nevyuzity, uspora: calc.danovaUspora(o.vyuzity, sazba) };
    porovnej(c.id, c.popis, `DPS měsíce=${JSON.stringify(v.dpsMesice)} (modul dostal roční úhrn ${fmt(rocne)})`, muj, modul);
    continue;
  }

  let modul;
  if (v.dipRocne !== undefined || v.zpRocne !== undefined) {
    const o = calc.odpocet({ dipRocne: v.dipRocne ?? 0, zpRocne: v.zpRocne ?? 0 }, sada);
    modul = { prispevekMesic: 0, prispevekRok: 0, odpocet: o.vyuzity, nevyuzity: o.nevyuzity, uspora: calc.danovaUspora(o.vyuzity, sazba) };
  } else {
    let vys;
    try {
      vys = calc.spocitejRok({ vek, sazbaDane: sazba, dps: v.dps ?? 0, dip: v.dip ?? 0, zp: v.zp ?? 0, zamestnavatel: v.zamestnavatel ?? 0, mesicuProbehlo: 0, starobniDuchod: !!v.duchodce }, sada);
    } catch (e) {
      log(`| ${c.id} | ${c.popis} | ${JSON.stringify(v)} | ${JSON.stringify(muj)} | CHYBA: ${e.message} | NE |`);
      neshod++;
      continue;
    }
    modul = { prispevekMesic: vys.statniPrispevekMesicne, prispevekRok: vys.statniPrispevekRocne, odpocet: vys.odpocet.vyuzity, nevyuzity: vys.odpocet.nevyuzity, uspora: vys.uspora };
  }
  porovnej(c.id, c.popis, JSON.stringify(v), muj, modul);
}

log('');
log(`Shoda: ${shod} · neshoda: ${neshod} z ${PRIPADY.length} případů.`);
log('Poznámky: (1) U případů M1–M4 modul nezná měsíční profil; dostal roční úhrn, jak ho skládá app.js (vklad × 12) a test „mimořádný vklad v prosinci“.');
log('(2) U případů R1–R5 je „doplatekDps“ částka, kterou aplikace radí poslat mimořádně na penzijko do 31. 12.; můj výpočet počítá podle § 15 odst. 7 ZDP po měsících.');
log('(3) H3/H7: zákon zaokrouhluje jen příspěvek účastníka dolů (§ 14 odst. 4 ZDPS); zaokrouhlení příspěvku státu nestanoví, můj výpočet ho nechává nezaokrouhlený.');
log('');

const text = radky.join('\n');
const beh = existsSync(vystup) && readFileSync(vystup, 'utf8').includes('# Plán48') ? 2 : 1;
if (beh === 1) writeFileSync(vystup, `## Běh 1\n${text}\n`);
else appendFileSync(vystup, `\n## Běh 2 (nový proces)\n${text}\n`);
console.log(text);
console.log(`zapsáno: ${vystup} (běh ${beh})`);
