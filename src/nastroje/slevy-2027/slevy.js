// Výpočet slev, daňového zvýhodnění a odpočtů pro rok 2027.
// Čisté funkce bez DOM – všechny částky a termíny přicházejí z rules.json.
// Měsíce se číslují 1–12; datum narození je { rok, mesic }.

import { odpocitatelnaCastDps, rovnomerne } from '../../js/odpocet-dps.js';

const MESICE = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/** Porovná (rok, měsíc) a (rok, měsíc): záporné, 0, kladné. */
const porovnej = (r1, m1, r2, m2) => (r1 - r2) * 12 + (m1 - m2);

const cislo = (x) => (Number.isFinite(Number(x)) && Number(x) > 0 ? Number(x) : 0);

/** Měsíce roku, na jejichž počátku je splněna podmínka. */
export function mesiceSplneno(rok, podminka, od = 1, doMesice = 12) {
  return MESICE.filter((m) => m >= od && m <= doMesice && podminka(rok, m)).length;
}

/**
 * Je osoba narozená v (rok, měsíc) na počátku měsíce m mladší než `vek` let?
 * Narozeniny v daném měsíci se počítají ještě jako „před dovršením“
 * (na počátku měsíce věk ještě dovršen není – předpoklad: nenarodil se 1. dne).
 */
function mladsiNez(narozeni, vek, rok, m) {
  return porovnej(rok, m, narozeni.rok + vek, narozeni.mesic) <= 0;
}

// --- Slevy na dani (§ 35ba, § 35bc, § 35bd) ----------------------------------

export function slevaPoplatnik(rules) {
  const s = rules.slevy.poplatnik;
  return { mesice: 12, mesicne: s.mesicne, rocne: s.rocne };
}

export function slevaStudent({ narozeni, studium }, rules) {
  const s = rules.slevy.student;
  if (!studium?.studuje || !narozeni) return { mesice: 0, mesicne: s.mesicne, rocne: 0 };
  const vekMax = studium.druh === 'doktorske' ? s.vekMaxDoktorske : s.vekMax;
  const mesice = mesiceSplneno(rules.rok, (r, m) => mladsiNez(narozeni, vekMax, r, m), studium.od ?? 1, studium.do ?? 12);
  return { mesice, mesicne: s.mesicne, rocne: mesice * s.mesicne };
}

export function slevaInvalidita({ invalidita }, rules) {
  const vysledek = [];
  if (!invalidita) return vysledek;
  const mesice = invalidita.mesice ?? 12;
  const pridej = (id) => {
    const s = rules.slevy[id];
    vysledek.push({ id, mesice, mesicne: s.mesicne, rocne: mesice * s.mesicne });
  };
  if (invalidita.stupen === 1 || invalidita.stupen === 2) pridej('invalidita12');
  if (invalidita.stupen === 3) pridej('invalidita3');
  if (invalidita.ztpp) pridej('ztpp');
  return vysledek;
}

/** Sleva na manžela: jen ročně, 1/12 za každý měsíc, na jehož počátku manžel pečuje o dítě do 3 let. */
export function slevaManzel({ manzel, deti = [] }, rules) {
  const s = rules.slevy.manzel;
  const nic = { mesice: 0, rocne: 0 };
  if (!manzel?.ma || !manzel.peceODite) return nic;
  if (cislo(manzel.prijem) > s.limitPrijmu) return { ...nic, duvod: 'prijem' };

  const sNarozenim = deti.filter((d) => d?.narozeni?.rok);
  const mesice = sNarozenim.length === 0
    ? 12 // dítě nebylo v dotazníku zadáno – bereme odpověď „pečuje o dítě do 3 let“ za celý rok
    : mesiceSplneno(rules.rok, (r, m) => sNarozenim.some((d) =>
      porovnej(r, m, d.narozeni.rok, d.narozeni.mesic) > 0 // na počátku měsíce už je na světě
      && mladsiNez(d.narozeni, s.vekDitete, r, m)
      && m >= (d.od ?? 1) && m <= (d.do ?? 12)));

  const rocniSazba = manzel.ztpp ? s.rocneZtpp : s.rocne;
  return { mesice, rocne: Math.round((rocniSazba * mesice) / 12) };
}

/**
 * Strop školkovného na jedno dítě pro tohoto poplatníka (§ 35bd odst. 1 a 2).
 * Žije-li dítě ve více společně hospodařících domácnostech, dělí se minimální mzda
 * počtem domácností (zaokrouhleno dolů), ledaže se poplatníci písemně dohodli jinak.
 */
export function stropSkolkovneho(dite, rules) {
  const strop = rules.slevy.skolkovne.stropNaDite;
  const dohoda = cislo(dite?.dohodaStrop);
  if (dohoda > 0) return Math.min(dohoda, strop);
  const domacnosti = Math.max(1, Math.floor(cislo(dite?.domacnosti) || 1));
  return Math.floor(strop / domacnosti);
}

/**
 * Je dítě v předškolním věku pro školkovné? Hranice je praktické zjednodušení
 * v rules.json (slevy.skolkovne.maxVekDitete), zákon rozhoduje podle předškolního zařízení.
 * Bez zadaného roku narození se dítě nevylučuje.
 */
export function predskolniVek(narozeni, rules) {
  if (!narozeni?.rok) return true;
  return Number(narozeni.rok) >= rules.rok - rules.slevy.skolkovne.maxVekDitete;
}

/** Školkovné: min(zaplacené školné, strop) na každé dítě v předškolním věku; jen ročně. */
export function skolkovne(deti = [], rules) {
  const polozky = deti
    .map((d, index) => ({
      index,
      strop: stropSkolkovneho(d, rules),
      rocne: d?.skolka && predskolniVek(d.narozeni, rules) ? Math.min(cislo(d.skolne), stropSkolkovneho(d, rules)) : 0,
    }))
    .filter((p) => p.rocne > 0);
  return { polozky, rocne: polozky.reduce((s, p) => s + p.rocne, 0) };
}

// --- Daňové zvýhodnění na děti (§ 35c) ---------------------------------------

/**
 * Pořadí dítěte se určuje v každém měsíci podle pořadí v seznamu mezi dětmi,
 * na které je v tom měsíci nárok. Nárok je i za měsíc narození.
 * Nárok je jen za měsíce, na jejichž počátku dítě nedovršilo 18 let, nebo 26 let,
 * když se soustavně připravuje na povolání (d.studuje) – § 35c odst. 6 a 10 ZDP.
 */
export function zvyhodneniDeti(deti = [], rules) {
  const z = rules.deti;
  const polozky = deti.map((d, index) => ({ index, mesice: 0, rocne: 0, ztpp: Boolean(d?.ztpp) }));
  for (const m of MESICE) {
    let poradi = 0;
    deti.forEach((d, index) => {
      if (!d?.narozeni?.rok) return;
      if (porovnej(rules.rok, m, d.narozeni.rok, d.narozeni.mesic) < 0) return;
      if (m < (d.od ?? 1) || m > (d.do ?? 12)) return;
      if (!mladsiNez(d.narozeni, d.studuje ? z.vekMax : z.vekMaxBezStudia, rules.rok, m)) return;
      const sazba = z.mesicne[Math.min(poradi, z.mesicne.length - 1)] * (d.ztpp ? z.nasobekZtpp : 1);
      polozky[index].mesice += 1;
      polozky[index].rocne += sazba;
      poradi += 1;
    });
  }
  return { polozky, rocne: polozky.reduce((s, p) => s + p.rocne, 0) };
}

// --- Odpočty od základu daně (§ 15) -------------------------------------------

/**
 * Odpočet na produkty spoření na stáří (§ 15 odst. 6 a 7 ZDP). U penzijka se počítá po měsících
 * jen část měsíčního příspěvku nad hranicí: pravidelnou část rozložíme rovnoměrně do 12 měsíců,
 * mimořádný vklad (část ročního úhrnu) přičteme k prosinci.
 */
export function odpocetStari(vklady = {}, rules) {
  const o = rules.odpocty.stari;
  const mimoradny = Math.min(cislo(vklady.penzijkoMimoradny), cislo(vklady.penzijko));
  const profil = rovnomerne(cislo(vklady.penzijko) - mimoradny);
  profil[profil.length - 1] += mimoradny;
  const penzijko = odpocitatelnaCastDps(profil, o.penzijkoHraniceMesicne);
  const celkem = penzijko + cislo(vklady.dip) + cislo(vklady.zivotni) + cislo(vklady.dlouhodobaPece);
  return { odpocet: Math.min(celkem, o.limit), celkem };
}

export function odpocetUroky(hypoteka = {}, rules) {
  const o = rules.odpocty.uroky;
  const limit = hypoteka.stareSmlouva ? o.limitStareSmlouvy : o.limit;
  const mesice = hypoteka.mesice ?? 12;
  return { odpocet: Math.min(cislo(hypoteka.uroky), Math.round((limit * mesice) / 12)) };
}

/** Dary: úhrn aspoň 1 000 Kč nebo nad 2 % základu daně, nejvýš 15 % základu. Bez známého základu daně strop neuplatní. */
export function odpocetDary(dary = {}, zakladDane, rules) {
  const o = rules.odpocty.dary;
  const uhrn = cislo(dary.dary) + cislo(dary.krev) * o.darKrve;
  const znamyZaklad = Number.isFinite(zakladDane) && zakladDane > 0;
  const splneno = uhrn >= o.minKc || (znamyZaklad && uhrn > zakladDane * o.minPodilZakladu);
  if (!splneno) return { odpocet: 0, uhrn, omezeno: false };
  const strop = znamyZaklad ? Math.floor(zakladDane * o.maxPodilZakladu) : Infinity;
  return { odpocet: Math.min(uhrn, strop), uhrn, omezeno: uhrn > strop, stropNeznamy: !znamyZaklad };
}

// --- Výpočet daně ------------------------------------------------------------

function danZeZakladu(zaklad, rules) {
  const { zakladni, zvysena, hraniceZvysene } = rules.sazbaDane;
  const dan = Math.min(zaklad, hraniceZvysene) * zakladni + Math.max(0, zaklad - hraniceZvysene) * zvysena;
  return Math.ceil(Math.round(dan * 100) / 100);
}

/**
 * Slevy (bez dětí) sníží daň nejvýš na nulu; zvýhodnění na děti nejprve jako sleva,
 * zbytek jako bonus – jen pokud příjmy z práce dosáhnou 6násobku minimální mzdy
 * a bonus činí aspoň 100 Kč (§ 35c odst. 3).
 */
export function uplatnitDan({ zakladDane, odpocty = 0, prijmyPrace, slevy, zvyhodneni = 0 }, rules) {
  const zaklad = Math.max(0, Math.floor((cislo(zakladDane) - cislo(odpocty)) / 100) * 100);
  const danPred = danZeZakladu(zaklad, rules);
  const slevyUplatnene = Math.min(danPred, cislo(slevy));
  const poSlevach = danPred - slevyUplatnene;
  const zvyhodneniSleva = Math.min(poSlevach, cislo(zvyhodneni));
  const minPrijem = rules.deti.bonusMinRocniPrijemNasobekMinMzdy * rules.minimalniMzda.mesicne;
  const narokNaBonus = cislo(prijmyPrace) >= minPrijem;
  const zbytek = cislo(zvyhodneni) - zvyhodneniSleva;
  const bonus = narokNaBonus && zbytek >= rules.deti.bonusMinKc ? zbytek : 0;
  return {
    zaklad, danPred, slevyUplatnene, zvyhodneniSleva, bonus, narokNaBonus,
    dan: poSlevach - zvyhodneniSleva,
  };
}

// --- Povinnost podat přiznání ------------------------------------------------

/**
 * prijmy.soubezne – souběžné příjmy od dalšího zaměstnavatele mimo malé dohody
 *   (druhý úvazek, DPP nad měsíční limit) → přiznání,
 * prijmy.maleDohody – DPP do limitu / malý rozsah bez prohlášení (dříve srážková daň);
 *   samy povinnost přiznání nezakládají,
 * prijmy.ostatni – příjmy podle § 7 až 10; přiznání nad 40 000 Kč.
 */
export function povinnostPriznani(prijmy = {}, rules) {
  const p = rules.priznani;
  const duvody = [];
  if (cislo(prijmy.ostatni) > p.limitOstatnichPrijmuZamestnance) duvody.push('ostatni');
  if (cislo(prijmy.soubezne) > 0) duvody.push('soubezne');
  return { povinne: duvody.length > 0, duvody, maleDohody: cislo(prijmy.maleDohody) > 0 };
}

// --- Celkové vyhodnocení -----------------------------------------------------

const MESICNI = 'prohlaseni';

/**
 * odpovedi = {
 *   narozeni: {rok, mesic}, mzda: {mesicne, mesice}, studium: {studuje, od, do, druh},
 *   deti: [{narozeni, ztpp, od, do, skolka, skolne}], manzel: {ma, prijem, peceODite, ztpp},
 *   invalidita: {stupen, ztpp}, hypoteka: {uroky, stareSmlouva}, stari: {penzijko, dip, zivotni, dlouhodobaPece},
 *   dary: {dary, krev}, prijmy: {soubezne, maleDohody, ostatni}, odbory: bool
 * }
 */
export function vyhodnot(odpovedi = {}, rules) {
  const priznani = povinnostPriznani(odpovedi.prijmy, rules);
  const rocniKde = priznani.povinne ? 'priznani' : 'rocniZuctovani';
  const sazba = rules.sazbaDane.zakladni;

  const mzdaRocne = cislo(odpovedi.mzda?.mesicne) * (odpovedi.mzda?.mesice ?? 12);
  const prijmyPrace = mzdaRocne + cislo(odpovedi.prijmy?.soubezne);
  const zakladDane = mzdaRocne > 0 ? prijmyPrace + cislo(odpovedi.prijmy?.ostatni) : null;

  const polozky = [];
  const pridej = (id, data, meta) => {
    const r = meta ?? rules.slevy[id];
    polozky.push({
      id,
      nazev: r.nazev,
      novinka: Boolean(r.novinka2027),
      zmena: Boolean(r.zmena2027),
      overit: Boolean(r.overit),
      poznamka: r.poznamka ?? null,
      zruseno: false,
      uspora: null,
      ...data,
    });
  };

  const poplatnik = slevaPoplatnik(rules);
  pridej('poplatnik', { typ: 'sleva', mesicne: poplatnik.mesicne, rocne: poplatnik.rocne, kde: MESICNI });

  const student = slevaStudent(odpovedi, rules);
  if (odpovedi.studium?.studuje) {
    pridej('student', { typ: 'sleva', mesicne: student.mesice ? student.mesicne : null, rocne: student.rocne, mesice: student.mesice, kde: MESICNI });
  }

  for (const inv of slevaInvalidita(odpovedi, rules)) {
    pridej(inv.id, { typ: 'sleva', mesicne: inv.mesicne, rocne: inv.rocne, mesice: inv.mesice, kde: MESICNI });
  }

  const manzel = slevaManzel(odpovedi, rules);
  if (odpovedi.manzel?.ma) {
    pridej('manzel', { typ: 'sleva', mesicne: null, rocne: manzel.rocne, mesice: manzel.mesice, duvod: manzel.duvod ?? null, kde: rocniKde });
  }

  const deti = odpovedi.deti ?? [];
  const skolka = skolkovne(deti, rules);
  if (deti.some((d) => d?.skolka)) {
    pridej('skolkovne', { typ: 'sleva', mesicne: null, rocne: skolka.rocne, kde: rocniKde });
  }

  const zvyh = zvyhodneniDeti(deti, rules);
  if (deti.length > 0) {
    const plnyRok = zvyh.polozky.every((p) => p.mesice === 12);
    pridej('deti', {
      typ: 'zvyhodneni',
      mesicne: plnyRok ? Math.round(zvyh.rocne / 12) : null,
      rocne: zvyh.rocne,
      rozpis: zvyh.polozky,
      kde: MESICNI,
    }, rules.deti);
  }

  const stari = odpocetStari(odpovedi.stari, rules);
  if (stari.celkem > 0) {
    pridej('stari', { typ: 'odpocet', mesicne: null, rocne: stari.odpocet, uspora: Math.round(stari.odpocet * sazba), kde: rocniKde }, rules.odpocty.stari);
  }

  const uroky = odpocetUroky(odpovedi.hypoteka, rules);
  if (cislo(odpovedi.hypoteka?.uroky) > 0) {
    pridej('uroky', { typ: 'odpocet', mesicne: null, rocne: uroky.odpocet, uspora: Math.round(uroky.odpocet * sazba), kde: rocniKde }, rules.odpocty.uroky);
  }

  const zakladProDary = zakladDane === null ? null : Math.max(0, zakladDane - stari.odpocet - uroky.odpocet);
  const dary = odpocetDary(odpovedi.dary, zakladProDary, rules);
  if (dary.uhrn > 0) {
    pridej('dary', {
      typ: 'odpocet', mesicne: null, rocne: dary.odpocet, uspora: Math.round(dary.odpocet * sazba),
      omezeno: dary.omezeno, stropNeznamy: Boolean(dary.stropNeznamy), kde: rocniKde,
    }, rules.odpocty.dary);
  }

  if (odpovedi.odbory) {
    pridej('odbory', { typ: 'odpocet', mesicne: null, rocne: 0, uspora: 0, zruseno: true, kde: null }, rules.odpocty.odbory);
  }

  const soucetAz = polozky.reduce((s, p) => s + (p.typ === 'odpocet' ? p.uspora : p.rocne), 0);

  let dan = null;
  let realne = null;
  if (zakladDane !== null) {
    const slevyCelkem = polozky.filter((p) => p.typ === 'sleva').reduce((s, p) => s + p.rocne, 0);
    const odpoctyCelkem = polozky.filter((p) => p.typ === 'odpocet').reduce((s, p) => s + p.rocne, 0);
    dan = uplatnitDan({ zakladDane, odpocty: odpoctyCelkem, prijmyPrace, slevy: slevyCelkem, zvyhodneni: zvyh.rocne }, rules);
    const bezUlev = danZeZakladu(Math.floor(zakladDane / 100) * 100, rules);
    realne = bezUlev - dan.dan + dan.bonus;
  }

  return { polozky, soucetAz, realne, dan, zakladDane, priznani, kontrolniSeznam: kontrolniSeznam(polozky, odpovedi, priznani, rules) };
}

// --- Kontrolní seznam --------------------------------------------------------

export function kontrolniSeznam(polozky, odpovedi, priznani, rules) {
  const t = rules.terminy;
  const ma = (id) => polozky.some((p) => p.id === id && !p.zruseno && p.rocne > 0);
  const kroky = [];
  const doklady = [];

  kroky.push(`Podepsat u hlavního zaměstnavatele Prohlášení poplatníka daně na rok ${rules.rok} – ${t.prohlaseni.text}.`);
  if (priznani.povinne) {
    kroky.push(`Podat daňové přiznání za rok ${rules.rok} – ${t.priznaniPapir.text} (papírově), ${t.priznaniElektronicky.text}.`);
    doklady.push('Potvrzení o zdanitelných příjmech od všech zaměstnavatelů');
    if (priznani.duvody.includes('ostatni')) doklady.push('Podklady k ostatním příjmům (pronájem, podnikání, jiné příjmy) a výdajům');
  } else if (polozky.some((p) => p.kde === 'rocniZuctovani' && p.rocne > 0)) {
    kroky.push(`Požádat zaměstnavatele o roční zúčtování daně za rok ${rules.rok} – ${t.rocniZuctovani.text}.`);
  } else {
    kroky.push(`Volitelně požádat o roční zúčtování za rok ${rules.rok} (${t.rocniZuctovani.text}) – vyplatí se, pokud jste nepracovali celý rok nebo se během roku změnily podmínky.`);
  }

  if (ma('student')) doklady.push('Potvrzení školy o soustavné přípravě na budoucí povolání (potvrzení o studiu, na každý školní/akademický rok)');
  if (ma('invalidita12') || ma('invalidita3')) doklady.push('Rozhodnutí ČSSZ o přiznání invalidního důchodu (stupeň invalidity)');
  if (ma('ztpp')) doklady.push('Průkaz ZTP/P (kopie)');
  if (ma('deti')) {
    doklady.push('Jména a rodná čísla dětí (rodný list při prvním uplatnění)');
    doklady.push('Potvrzení zaměstnavatele druhého rodiče, že zvýhodnění na děti neuplatňuje (nebo jaké děti uplatňuje)');
    if ((odpovedi.deti ?? []).some((d) => d?.ztpp)) doklady.push('Průkaz ZTP/P dítěte');
  }
  if (ma('skolkovne')) {
    doklady.push(`Potvrzení předškolního zařízení o výdajích za umístění dítěte za rok ${rules.rok} (jméno dítěte, celková částka, datum zápisu zařízení do rejstříku / evidence nebo vzniku živnostenského oprávnění)`);
    doklady.push('Potvrzení druhého poplatníka, který dítě také vyživuje (např. druhý rodič): jeho jméno, jméno dítěte a výše jím uplatněné slevy za umístění dítěte');
    if ((odpovedi.deti ?? []).some((d) => cislo(d?.dohodaStrop) > 0)) doklady.push('Písemná dohoda poplatníků o rozdělení maximální výše školkovného (§ 35bd odst. 2)');
  }
  if (ma('manzel')) {
    doklady.push('Jméno a rodné číslo manžela/manželky, oddací list');
    doklady.push(`Doklad o příjmech manžela/manželky za rok ${rules.rok} (nejvýš 68 000 Kč) a rodný list dítěte do 3 let`);
    if (odpovedi.manzel?.ztpp) doklady.push('Průkaz ZTP/P manžela/manželky');
  }
  if (ma('uroky')) doklady.push(`Potvrzení banky / stavební spořitelny o úrocích zaplacených za rok ${rules.rok}; při prvním uplatnění úvěrová smlouva a výpis z katastru`);
  if (ma('stari')) doklady.push(`Potvrzení penzijní společnosti / poskytovatele DIP / pojišťovny o příspěvcích za rok ${rules.rok} (u pojištění i smlouva)`);
  if (ma('dary')) {
    doklady.push('Darovací potvrzení od obdarovaných organizací');
    if (cislo(odpovedi.dary?.krev) > 0) doklady.push('Potvrzení o bezpříspěvkových odběrech krve');
  }

  return { kroky, doklady };
}
