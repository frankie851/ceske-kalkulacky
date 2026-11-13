// Penzijko kompas – výpočty. Čisté funkce bez vazby na DOM.
// Všechny částky, sazby a hranice přicházejí z rules.json (parametr `rules` nebo `sada`).

import { odpocitatelnaCastDps } from '../../js/odpocet-dps.js';

const MESICU_V_ROCE = 12;
const PROCENT = 100;

const zaokrouhli = (x) => Math.round(x * PROCENT) / PROCENT;

/** Najde věkové pásmo státního příspěvku: vekOd <= vek < vekDo (vekDo null = bez horní hranice). */
export function najdiPasmo(sada, vek) {
  return sada.statniPrispevek.pasma.find(
    (p) => vek >= p.vekOd && (p.vekDo === null || p.vekDo === undefined || vek < p.vekDo),
  ) ?? null;
}

/**
 * Měsíční a roční státní příspěvek. Počítá se jen z vlastního vkladu účastníka,
 * příspěvek zaměstnavatele se sem nepředává.
 */
export function statniPrispevek(sada, { vek, vklad, duchodce = false }) {
  const pasmo = najdiPasmo(sada, vek);
  let mesicne = 0;
  if (pasmo && !(duchodce && !sada.statniPrispevek.duchodceMaNarok) && vklad >= pasmo.minVklad) {
    mesicne = zaokrouhli(Math.min(pasmo.sazba * vklad, pasmo.maxPrispevek));
  }
  return { mesicne, rocne: zaokrouhli(mesicne * MESICU_V_ROCE), pasmo };
}

/** Vklad, při kterém účastník v daném věku dosáhne na maximální státní příspěvek. */
export function vkladProMaxPrispevek(sada, vek) {
  const pasmo = najdiPasmo(sada, vek);
  return pasmo ? Math.max(pasmo.minVklad, pasmo.maxPrispevek / pasmo.sazba) : 0;
}

/**
 * Informativní odpočet od základu daně (§ 15 odst. 6 a 7 ZDP): v každém měsíci jen část
 * vlastního vkladu nad hranicí, se stropem. Vklad je tu stejný po celý rok.
 */
export function danovyOdpocet(sada, { vklad }) {
  const { nadVklad, maxRocne, sazbaDane } = sada.odpocet;
  const rocne = Math.min(odpocitatelnaCastDps(Array(MESICU_V_ROCE).fill(vklad), nadVklad), maxRocne);
  return { rocne, uspora: zaokrouhli(rocne * sazbaDane), maxRocne };
}

/** Podíl akcií ve strategii životního cyklu (předpoklad aplikace). */
export function podilAkcii(cyklus, vek) {
  const { plneAkcieDoVeku, vekKonec, podilAkciiNaKonci } = cyklus;
  if (vek <= plneAkcieDoVeku) return 1;
  if (vek >= vekKonec) return podilAkciiNaKonci;
  const t = (vek - plneAkcieDoVeku) / (vekKonec - plneAkcieDoVeku);
  return 1 - t * (1 - podilAkciiNaKonci);
}

/** Předpokládaný hrubý roční výnos fondu v % (u životního cyklu závisí na věku). */
export function vynosFondu(fond, vek) {
  if (fond.cyklus) {
    const s = podilAkcii(fond.cyklus, vek);
    return s * fond.cyklus.vynosAkcie + (1 - s) * fond.cyklus.vynosDluhopisy;
  }
  return fond.vynos;
}

function parametryFondu(fondDef, prepis, strop) {
  const p = { ...fondDef, ...(prepis ?? {}) };
  if (prepis && prepis.vynos !== undefined) delete p.cyklus;
  if (strop) {
    p.sprava = Math.min(p.sprava, strop.sprava);
    p.zhodnoceni = Math.min(p.zhodnoceni, strop.zhodnoceni);
  }
  return p;
}

function rokKonce(datum) {
  return Number(String(datum).slice(0, 4));
}

/**
 * Měsíční projekce zůstatku.
 * p = { zustatek, vklad, zamestnavatel, vek, duchodce, fond (klíč), parametry (přepis sprava/zhodnoceni/vynos),
 *       sada (klíč), strop (volitelně přepíše strop poplatků sady; null = bez stropu),
 *       mesicu (volitelně, jinak do věku penze), start: {rok, mesic}, inflace (volitelně), bezNastupce }
 */
export function projekce(rules, p) {
  const sada = rules.sady[p.sada];
  const pred = rules.predpoklady;
  const inflace = (p.inflace ?? pred.inflace) / PROCENT;
  const vekPenze = p.vekPenze ?? pred.vekPenze;
  const mesicu = p.mesicu ?? Math.max(0, Math.round((vekPenze - p.vek) * MESICU_V_ROCE));
  const strop = 'strop' in p ? p.strop : sada.stropPoplatku;
  const vklad = p.vklad ?? 0;
  const zamestnavatel = p.zamestnavatel ?? 0;
  const start = p.start ?? { rok: new Date().getFullYear(), mesic: new Date().getMonth() + 1 };

  const fondDef = rules.fondy[p.fond];
  const hlavni = parametryFondu(fondDef, p.parametry, strop);
  // Konec transformovaných fondů je jen v návrhu „Lepší penzijko“ (sněmovní tisk 285).
  // Platný zákon č. 427/2011 Sb. ho nezná, proto ho uplatníme jen se sadou, která ho obsahuje.
  const konecTf = fondDef.typ === 'transformovany' ? sada.transformovaneFondy : null;
  const nastupce = konecTf && !p.bezNastupce
    ? parametryFondu(rules.fondy[konecTf.nastupce], null, strop)
    : null;
  const posledniRok = nastupce ? rokKonce(konecTf.konci) : Infinity;

  let zustatek = p.zustatek ?? 0;
  const souhrn = {
    vlastni: 0, vlastniRealne: 0, statni: 0, zamestnavatel: 0,
    vynos: 0, poplatkySprava: 0, poplatkyZhodnoceni: 0,
  };
  const rada = [{ vek: p.vek, nominal: zustatek, realne: zustatek }];
  let rocniCistyVynos = 0;
  let mesicePoNastupci = 0;

  for (let m = 0; m < mesicu; m++) {
    const rok = start.rok + Math.floor((start.mesic - 1 + m) / MESICU_V_ROCE);
    const vek = p.vek + Math.floor(m / MESICU_V_ROCE);
    const fond = rok > posledniRok ? nastupce : hlavni;
    if (fond === nastupce) mesicePoNastupci++;

    const rocniVynos = vynosFondu(fond, vek) / PROCENT;
    const rm = Math.pow(1 + rocniVynos, 1 / MESICU_V_ROCE) - 1;
    const vynos = zustatek * rm;
    const predPoplatkem = zustatek + vynos;
    const sprava = (fond.sprava / PROCENT / MESICU_V_ROCE) * ((zustatek + predPoplatkem) / 2);

    const statni = statniPrispevek(sada, { vek, vklad, duchodce: p.duchodce }).mesicne;
    zustatek = predPoplatkem - sprava + vklad + zamestnavatel + statni;

    rocniCistyVynos += vynos - sprava;
    souhrn.vynos += vynos;
    souhrn.poplatkySprava += sprava;
    souhrn.vlastni += vklad;
    souhrn.zamestnavatel += zamestnavatel;
    souhrn.statni += statni;

    const deflator = Math.pow(1 + inflace, (m + 1) / MESICU_V_ROCE);
    souhrn.vlastniRealne += vklad / deflator;

    const konecRoku = (m + 1) % MESICU_V_ROCE === 0;
    if (konecRoku || m === mesicu - 1) {
      const poplatek = (fond.zhodnoceni / PROCENT) * Math.max(0, rocniCistyVynos);
      zustatek -= poplatek;
      souhrn.poplatkyZhodnoceni += poplatek;
      rocniCistyVynos = 0;
      rada.push({ vek: p.vek + (m + 1) / MESICU_V_ROCE, nominal: zustatek, realne: zustatek / deflator });
    }
  }

  const deflatorKonec = Math.pow(1 + inflace, mesicu / MESICU_V_ROCE);
  souhrn.nominal = zustatek;
  souhrn.realne = zustatek / deflatorKonec;
  souhrn.poplatky = souhrn.poplatkySprava + souhrn.poplatkyZhodnoceni;
  return { rada, souhrn, mesicu, mesicePoNastupci, parametry: hlavni };
}

/** Převede vstup formuláře na parametry projekce pro daný fond. */
function zVstupu(vstup, fond, navic = {}) {
  const vlastniFond = fond === vstup.fond;
  return {
    zustatek: vstup.zustatek,
    vklad: vstup.vklad,
    zamestnavatel: vstup.zamestnavatel,
    vek: vstup.vek,
    duchodce: vstup.duchodce,
    sada: vstup.sada,
    start: vstup.start,
    inflace: vstup.inflace,
    fond,
    parametry: vlastniFond && vstup.poplatky ? { ...vstup.poplatky } : undefined,
    ...navic,
  };
}

/** Projekce pro všechny typy fondů; u fondu uživatele se použijí jeho poplatky. */
export function srovnaniFondu(rules, vstup) {
  const vysledek = {};
  for (const klic of Object.keys(rules.fondy)) {
    vysledek[klic] = projekce(rules, zVstupu(vstup, klic));
  }
  return vysledek;
}

/** Sada, která obsahuje strop poplatků (návrh). */
export function sadaSeStropem(rules) {
  const klic = Object.keys(rules.sady).find((k) => rules.sady[k].stropPoplatku);
  return klic ? { klic, sada: rules.sady[klic] } : null;
}

/** Rozdíl v 65 letech mezi dnešními poplatky fondu a stropem z návrhu. */
export function dopadPoplatku(rules, vstup) {
  const se = sadaSeStropem(rules);
  const dnes = projekce(rules, zVstupu(vstup, vstup.fond, { strop: null }));
  const strop = projekce(rules, zVstupu(vstup, vstup.fond, { strop: se ? se.sada.stropPoplatku : null }));
  return {
    dnes,
    strop,
    stropPoplatku: se ? se.sada.stropPoplatku : null,
    sadaStropu: se ? se.klic : null,
    rozdilNominal: strop.souhrn.nominal - dnes.souhrn.nominal,
    rozdilRealne: strop.souhrn.realne - dnes.souhrn.realne,
  };
}

/**
 * Poplatek za převod k jiné penzijní společnosti (§ 61 odst. 3 ZDPS: nejvýše částka z rules.json).
 * Neúčtuje se až „po více než 60 měsících“ spoření u téže společnosti (§ 62 odst. 3 ZDPS),
 * délka smlouvy se zadává v celých letech – přesně 5 let (60 měsíců) je proto ještě zpoplatněno.
 */
export function poplatekZaPrevod(rules, delkaSmlouvyLet) {
  const { poplatek, zdarmaPoMesicich } = rules.predpoklady.prevodKonkurence;
  return (delkaSmlouvyLet ?? 0) * MESICU_V_ROCE > zdarmaPoMesicich ? 0 : poplatek;
}

/** Transformovaný fond: zůstat vs. přejít do účastnického fondu téže společnosti. */
export function transformovanyFond(rules, vstup, cil = rules.predpoklady.doporuceni.cilovyFond) {
  const zustat = projekce(rules, zVstupu({ ...vstup, fond: 'transformovany' }, 'transformovany'));
  const prejit = projekce(rules, zVstupu({ ...vstup, fond: 'transformovany' }, cil));
  return {
    cil,
    zustat,
    prejit,
    rozdilNominal: prejit.souhrn.nominal - zustat.souhrn.nominal,
    rozdilRealne: prejit.souhrn.realne - zustat.souhrn.realne,
    poplatekKonkurence: poplatekZaPrevod(rules, vstup.delkaSmlouvy),
    konci: rules.sady[vstup.sada]?.transformovaneFondy?.konci ?? null,
  };
}

/** Přínos změny v dnešních penězích: přírůstek majetku v 65 minus přírůstek vlastních vkladů. */
function prinos(zaklad, zmena) {
  return (zmena.souhrn.realne - zaklad.souhrn.realne)
    - (zmena.souhrn.vlastniRealne - zaklad.souhrn.vlastniRealne);
}

/** Max. 3 konkrétní kroky seřazené podle přínosu v Kč (reálně v 65 letech). */
export function doporuceni(rules, vstup) {
  const sada = rules.sady[vstup.sada];
  const pred = rules.predpoklady;
  if (vstup.vek >= pred.vekPenze) return [];
  const zaklad = projekce(rules, zVstupu(vstup, vstup.fond));
  const kroky = [];

  // a) navýšit vklad na hranici maximálního státního příspěvku
  const cilVklad = vkladProMaxPrispevek(sada, vstup.vek);
  const maPrispevek = !(vstup.duchodce && !sada.statniPrispevek.duchodceMaNarok);
  if (maPrispevek && cilVklad > 0 && vstup.vklad < cilVklad) {
    const zmena = projekce(rules, zVstupu({ ...vstup, vklad: cilVklad }, vstup.fond));
    const ted = statniPrispevek(sada, vstup).mesicne;
    const pak = statniPrispevek(sada, { ...vstup, vklad: cilVklad }).mesicne;
    kroky.push({
      id: 'vklad',
      nadpis: `Navyš vklad na ${cilVklad} Kč měsíčně`,
      popis: `Stát ti pak přidá ${pak} Kč místo ${ted} Kč měsíčně.`,
      hodnoty: { cilVklad, ted, pak },
      prinos: prinos(zaklad, zmena),
    });
  }

  // b) změnit fond na cílovou strategii
  const cil = pred.doporuceni.cilovyFond;
  if (vstup.fond !== cil && rules.fondy[cil]) {
    const zmena = projekce(rules, zVstupu(vstup, cil));
    kroky.push({
      id: 'fond',
      nadpis: `Změň fond na „${rules.fondy[cil].nazev}“`,
      popis: vstup.fond === 'transformovany'
        ? 'Přechod z transformovaného do účastnického fondu téže společnosti je zdarma. Zpět se už vrátit nejde.'
        : 'Změnu strategie zadáš u své penzijní společnosti, obvykle online.',
      hodnoty: { cil },
      prinos: prinos(zaklad, zmena),
    });
  }

  // c) požádat zaměstnavatele o příspěvek
  const navrhZam = pred.doporuceni.prispevekZamestnavatele;
  if (!vstup.zamestnavatel && navrhZam > 0) {
    const zmena = projekce(rules, zVstupu({ ...vstup, zamestnavatel: navrhZam }, vstup.fond));
    kroky.push({
      id: 'zamestnavatel',
      nadpis: 'Řekni si zaměstnavateli o příspěvek',
      popis: `Počítáme s ${navrhZam} Kč měsíčně. Pro firmu je příspěvek daňově zvýhodněný.`,
      hodnoty: { castka: navrhZam },
      prinos: prinos(zaklad, zmena),
    });
  }

  // d) poplatky nad typickou úrovní
  const typicke = rules.fondy[vstup.fond];
  if (vstup.poplatky && (vstup.poplatky.sprava > typicke.sprava || vstup.poplatky.zhodnoceni > typicke.zhodnoceni)) {
    const zmena = projekce(rules, zVstupu({ ...vstup, poplatky: undefined }, vstup.fond));
    kroky.push({
      id: 'poplatky',
      nadpis: 'Hledej fond s nižšími poplatky',
      popis: `Tvůj fond je dražší než typický ${typicke.nazev.toLowerCase()} fond (${typicke.sprava} % + ${typicke.zhodnoceni} % ze zhodnocení).`,
      hodnoty: { sprava: typicke.sprava, zhodnoceni: typicke.zhodnoceni },
      prinos: prinos(zaklad, zmena),
    });
  }

  return kroky
    .filter((k) => k.prinos > 0)
    .sort((a, b) => b.prinos - a.prinos)
    .slice(0, 3);
}
