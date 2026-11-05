// Plán48 – ukázkový výsledek spočítaný při buildu stejným modulem jako v prohlížeči.
// Stránka bez JavaScriptu ukáže formulář s těmito hodnotami a k nim skutečný výsledek.
import fs from 'node:fs';
import { spocitejRok, projekce, najdiPasmo, statniPrispevekMesicni } from './calc.js';
import { kc, cislo, procenta } from '../../js/format.js';
import * as v from './vystup.js';

const pravidla = JSON.parse(fs.readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const klicSady = pravidla.vychozi.sada;
const sada = pravidla.sady[klicSady];

// Ukázka z prototypu B: penzijko 3 000 Kč + životní pojištění 2 500 Kč měsíčně, sazba 15 %.
// Kolik měsíců už proběhlo, bereme z data ověření pravidel (4. 11. 2026 → 10 měsíců).
// Výsledek na tom nezávisí: vklad 3 000 Kč je nad hranicí maximálního státního příspěvku.
const vstup = {
  vek: 35,
  sazbaDane: sada.sazbyDane[0],
  dps: 3000,
  dip: 0,
  zp: 2500,
  zamestnavatel: 0,
  mesicuProbehlo: new Date(`${pravidla.meta.overeno}T12:00:00Z`).getUTCMonth(),
  starobniDuchod: false,
};

// Tabulky „Pro kontrolu a srovnání“ – vstupy jsou kontrolní příklady ze zadání (money.cz), výsledky z calc.js.
const pasmoMladych = v.pasmoMladych;
/** Tabulka kontrolních příkladů ze zadání (money.cz), spočítaná podle platných pravidel. */
function kontrolniPriklady(pravidla, sazbaDane) {
  const sada = pravidla.sady[pravidla.vychozi.sada];
  const zaklad = { vek: vstup.vek, sazbaDane, dps: 0, dip: 0, zp: 0, zamestnavatel: 0, mesicuProbehlo: 0, starobniDuchod: false };
  const priklady = [
    { nazev: `Penzijko ${kc(5700)}`, vstup: { dps: 5700 } },
    { nazev: `Penzijko ${kc(3000)} + životní pojištění ${kc(2500)}`, vstup: { dps: 3000, zp: 2500 } },
    { nazev: `DIP ${kc(4000)}`, vstup: { dip: 4000 } },
  ];
  return priklady.map((p) => {
    const r = spocitejRok({ ...zaklad, ...p.vstup }, sada);
    return [p.nazev, kc(r.odpocet.vyuzity), kc(r.uspora)];
  });
}

/** Tabulka: státní příspěvek podle platných pravidel a podle návrhu (pro lidi do 30 let). */
function srovnaniPrispevku(pravidla) {
  const platne = pravidla.sady[pravidla.vychozi.sada];
  const klic = Object.keys(pravidla.sady).find((k) => pravidla.sady[k].stav === 'navrh');
  const navrh = klic ? pravidla.sady[klic] : null;
  const mladi = navrh ? pasmoMladych(navrh) : null;
  const vekMladi = mladi ? mladi.vekOd : vstup.vek;
  const vekPlatne = vstup.vek;
  const bunka = (m) => (m > 0 ? `${kc(m)} (${kc(m * 12)} ročně)` : kc(0));
  const radky = [400, 500, 1000, 1700, 3000].map((vklad) => [
    `${kc(vklad)}`,
    bunka(statniPrispevekMesicni(vklad, vekPlatne, platne)),
    ...(navrh ? [bunka(statniPrispevekMesicni(vklad, vekMladi, navrh))] : []),
  ]);
  const p = najdiPasmo(vekPlatne, platne);
  return {
    sloupce: ['Měsíční vklad', platne.nazev, ...(navrh ? [`${navrh.nazev} (do ${mladi ? mladi.vekDo + 1 : 30} let)`] : [])],
    radky,
    poznamka: `${platne.nazev}: pod ${kc(p.minVklad)} měsíčně je příspěvek nulový, mezi ${kc(p.minVklad)} a ${kc(p.maxZaklad)} je to ${procenta(p.sazba * 100)} vkladu.${navrh ? ` Sloupec ${navrh.nazev} je návrh, zatím neschválený.` : ''}`,
    navrh: navrh ? navrh.nazev : null,
  };
}

const r = spocitejRok(vstup, sada);
const { vynos, poplatek, vekKonec } = pravidla.vychozi;
const body = projekce(vstup, sada, { vynos, poplatek, vekKonec });
const limit = v.grafLimitu(r.odpocet);
const proj = v.grafProjekce(body);
const srovnani = srovnaniPrispevku(pravidla);

const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const procentaVstup = (podil) => String(+(podil * 100).toFixed(2)).replace('.', ',');

export default {
  plan48: {
    vstup,
    // Hodnoty polí formuláře (čitelné, s běžnou mezerou kvůli úpravám)
    pole: {
      vek: String(vstup.vek),
      dps: cislo(vstup.dps).replace(/ /g, ' '),
      dip: cislo(vstup.dip),
      zp: cislo(vstup.zp).replace(/ /g, ' '),
      zamestnavatel: cislo(vstup.zamestnavatel),
      vynos: procentaVstup(vynos),
      poplatek: procentaVstup(poplatek),
    },
    sady: Object.entries(pravidla.sady).map(([klic, s]) => ({ hodnota: klic, text: s.nazev, vybrano: klic === klicSady })),
    sazby: sada.sazbyDane.map((s) => ({ hodnota: String(Math.round(s * 100)), text: procenta(s * 100), vybrano: s === vstup.sazbaDane })),
    duchod: [{ hodnota: 'ne', text: 'Ne', vybrano: !vstup.starobniDuchod }, { hodnota: 'ano', text: 'Ano', vybrano: vstup.starobniDuchod }],
    mesice: MESICE.slice(0, 12).map((m, i) => ({
      hodnota: String(i),
      text: `${i} ${i === 1 ? 'měsíc' : i >= 2 && i <= 4 ? 'měsíce' : 'měsíců'} (teď je ${m})`,
      vybrano: i === vstup.mesicuProbehlo,
    })),
    stitekNavrhu: v.stitekSady(Object.values(pravidla.sady).find((s) => s.stitek) || {}) || 'Návrh, zatím neschváleno',
    stitekSady: v.stitekSady(sada),
    nazevSady: sada.nazev,
    napovedy: {
      dps: `Do odpočtu jde jen část nad ${kc(sada.odpocet.dpsRocniHranice / 12)} měsíčně. Na maximální státní příspěvek stačí ${kc(najdiPasmo(vstup.vek, sada).maxZaklad)}.`,
      sazba: `${procenta(sada.sazbyDane.at(-1) * 100)} jen pro vysoké příjmy (část nad 36násobek průměrné mzdy).`,
    },
    shrnuti: v.shrnutiKroku(vstup, sada),
    // Výsledek
    odpocet: kc(r.odpocet.vyuzity),
    popis: 'Odpočet od základu daně za celý rok',
    vysvetleni: v.vysvetleni(r),
    statistiky: v.statistiky(vstup, r, sada),
    akce: v.vetaCoUdelat(r.doporuceni, r.odpocet.limit),
    akcePoznamka: v.poznamkaCoUdelat(r.doporuceni, pravidla.vychozi),
    limitCastka: kc(r.odpocet.limit),
    komentarLimitu: v.komentarLimitu(r.odpocet),
    grafLimitu: limit.graf,
    tabulkaLimitu: limit.tabulka,
    vekKonec,
    shrnutiProjekce: v.shrnutiProjekce(body, vekKonec),
    grafProjekce: proj.graf,
    tabulkaProjekce: proj.tabulka,
    navrh: v.textyNavrhu(vstup, pravidla),
    kontrolniPriklady: kontrolniPriklady(pravidla, vstup.sazbaDane),
    sazbaPrikladu: procenta(vstup.sazbaDane * 100),
    srovnani,
  },
};
