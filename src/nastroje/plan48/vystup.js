// Plán48 – texty, grafy a tabulky výsledku. Sdílí je build (plan48.11tydata.js) i prohlížeč (app.js),
// aby ukázka bez JS a živý výpočet vypadaly stejně. Žádné částky ani sazby tu nejsou natvrdo:
// všechno se bere z výsledku calc.js a z rules.json.
import { kc, cislo, procenta } from '../../js/format.js';
import { skladanyPruh, caroveGrafy, tabulkaDat } from '../../js/graf.js';
import { najdiPasmo, spocitejRok } from './calc.js';

const MESICU = 12;
const NBSP = '\u00a0';
/** Pevná mezera v datech typu „31. 12.“, aby se nezalomila. */
const pevneDatum = (t) => t.replace(/(\d+)\. (\d+)\./g, `$1.${NBSP}$2.`);
const pct = (podil) => procenta(Math.round(podil * 10000) / 100, Number.isInteger(Math.round(podil * 10000) / 100) ? 0 : 1);
const velke = (text) => `${text.charAt(0).toUpperCase()}${text.slice(1)}`;

/** Text štítku sady („Návrh, zatím neschváleno“), nebo null u platných pravidel. */
export function stitekSady(sada) {
  return sada.stitek ? velke(sada.stitek) : null;
}

function naZbyvajici(n) {
  if (n === 1) return 'na poslední měsíc';
  if (n >= 2 && n <= 4) return `na zbývající ${n} měsíce`;
  return `na zbývajících ${n} měsíců`;
}

/** Popis ke statistice státního příspěvku. */
export function popisPrispevku(vstup, r, sada) {
  if (vstup.starobniDuchod && sada.statniPrispevek.starobniDuchodBezNaroku) {
    return 'státní příspěvek za rok (při starobním důchodu nenáleží)';
  }
  const pasmo = najdiPasmo(vstup.vek, sada);
  if (r.statniPrispevekMesicne === 0) {
    return `státní příspěvek za rok (vklad pod ${kc(pasmo.minVklad)} měsíčně ho nemá)`;
  }
  const max = Math.round(pasmo.sazba * pasmo.maxZaklad);
  if (r.statniPrispevekMesicne >= max) {
    return `státní příspěvek za rok (maximum ${kc(max)} měsíčně)`;
  }
  return `státní příspěvek za rok (${kc(r.statniPrispevekMesicne)} měsíčně, ${pct(pasmo.sazba)} vkladu)`;
}

/** Nápověda k přepínači sazby daně (§ 16 odst. 1 ZDP: vyšší sazba jen pro část základu daně). */
export function napovedaSazby(sazbyDane) {
  return `${procenta(Math.round(sazbyDane.at(-1) * 100))} jen pro vysoké příjmy (část základu daně nad 36násobek průměrné mzdy).`;
}

/**
 * Tři statistiky pod hlavním číslem (pořadí odpovídá prototypu B).
 * Dlaždice státního příspěvku nese štítek sady (revize 5. 11. 2026, P48-08): u návrhu je vidět, u platných pravidel skrytý.
 */
export function statistiky(vstup, r, sada) {
  const o = r.odpocet;
  return [
    { hodnota: kc(r.uspora), popis: `daňová úspora při sazbě ${pct(vstup.sazbaDane)}`, zvyraznit: true },
    { hodnota: kc(r.statniPrispevekRocne), popis: popisPrispevku(vstup, r, sada), zvyraznit: r.statniPrispevekRocne > 0, stitek: stitekSady(sada) },
    o.nevyuzity > 0
      ? { hodnota: kc(o.nevyuzity), popis: `nevyužitý odpočet z limitu ${kc(o.limit)}`, zvyraznit: false }
      : { hodnota: kc(o.vyuzity), popis: `využitý odpočet, celý limit ${kc(o.limit)}`, zvyraznit: true },
  ];
}

/** Věta pod hlavním číslem: z čeho se odpočet skládá. */
export function vysvetleni(r) {
  const o = r.odpocet;
  const casti = [];
  if (o.dpsCast > 0) {
    casti.push(o.hranice > 0
      ? `z penzijka ${kc(o.dpsCast)} (část nad ${kc(o.hranice / MESICU)} měsíčně)`
      : `z penzijka ${kc(o.dpsCast)} (od první koruny)`);
  }
  if (o.dip > 0) casti.push(`z DIP ${kc(o.dip)}`);
  if (o.zp > 0) casti.push(`z životního pojištění ${kc(o.zp)}`);
  if (!casti.length) {
    return o.hranice > 0
      ? `Zatím nic. Z penzijka se počítá jen část nad ${kc(o.hranice / MESICU)} měsíčně, DIP a životní pojištění od první koruny. Limit je ${kc(o.limit)}.`
      : `Zatím nic. Penzijko, DIP i životní pojištění se počítají od první koruny. Limit je ${kc(o.limit)}.`;
  }
  const seznam = casti.length > 1 ? `${casti.slice(0, -1).join(', ')} a ${casti.at(-1)}` : casti[0];
  let veta = `Počítá se ${seznam}. Limit je ${kc(o.limit)}.`;
  if (o.hruby > o.limit) veta += ` ${kc(o.hruby - o.limit)} je nad limitem, ten už daň nesníží.`;
  return veta;
}

/** Akční věta „Co udělat do 31. 12.“ z doporuceni (calc.js). */
export function vetaCoUdelat(d, limit) {
  if (d.hotovo) {
    return 'Nic dalšího není potřeba. Máš maximální státní příspěvek i celý limit odpočtu. Stačí pokračovat ve vkladech.';
  }
  const vety = [];
  if (d.prispevek) {
    vety.push(`Zvyš vklad na penzijko na ${kc(d.prispevek.navysitNa)} měsíčně ${naZbyvajici(d.prispevek.mesicu)}. Stát ti přidá o ${kc(d.prispevek.ziskate)} víc.`);
  }
  if (d.odpocet) {
    const o = d.odpocet;
    const kam = o.doplatekDps === o.doplatekDipZp
      ? `${kc(o.doplatekDipZp)} na DIP, životní pojištění nebo penzijko`
      : `${kc(o.doplatekDipZp)} na DIP nebo životní pojištění (na penzijko by to bylo ${kc(o.doplatekDps)})`;
    vety.push(`${d.prispevek ? 'K tomu do' : 'Do'} 31. 12. vlož mimořádně ${kam} a využiješ celý limit ${kc(limit)}. Ušetříš tak dalších ${kc(o.uspora)} na dani.`);
  }
  return pevneDatum(vety.join(' '));
}

/**
 * Upozornění na podmínky daňové podpory a její navrácení (§ 15b ZDP).
 * Čísla jdou z rules.json (sada.odpocet.podminkyPodpory). Bez nich vrací prázdný text.
 */
export function upozorneniPodpory(sada) {
  const p = sada.odpocet.podminkyPodpory;
  if (!p) return '';
  const vety = [`Odpočet platí jen u smlouvy, ze které jde peníze vybrat nejdřív po ${cislo(p.mesicu)} měsících a nejdřív v roce, kdy ti bude ${cislo(p.vek)} let.`];
  if (p.dpsLetPredDuchodovymVekem) vety.push(`U penzijka podporu neruší ani výplata ${cislo(p.dpsLetPredDuchodovymVekem)} let před důchodovým věkem.`);
  vety.push(`Když peníze vybereš dřív nebo smlouvu zrušíš bez převodu na stejný druh spoření, odpočty za posledních ${cislo(p.vraceniZaObdobi)} let dodaníš.`);
  return vety.join(' ');
}

/**
 * Drobná poznámka pod akční větou (propadlý příspěvek, mimořádný vklad, podmínky podpory).
 * Termín připsání mimořádného vkladu zákon nestanoví, určuje ho penzijní společnost (revize 5. 11. 2026, P48-09),
 * proto tu žádné datum není. Parametr vychozi zůstává kvůli stejnému volání z buildu i z prohlížeče.
 */
export function poznamkaCoUdelat(d, vychozi, sada) {
  const p = [];
  if (d.prispevek?.propadlo > 0) p.push(`Za uplynulé měsíce už propadlo ${kc(d.prispevek.propadlo)} státního příspěvku.`);
  if (d.odpocet) {
    p.push('Mimořádný vklad na penzijko označ jako mimořádný, jinak se může počítat do dalšího roku. Do kdy musí dorazit, určují podmínky tvé penzijní společnosti. Pošli ho s předstihem.');
    p.push('Odpočet ušetří jen tolik daně, kolik jí opravdu platíš.');
    if (sada) p.push(upozorneniPodpory(sada));
  }
  return pevneDatum(p.filter(Boolean).join(' '));
}

/** Krátký komentář nad grafem limitu. */
export function komentarLimitu(o) {
  const podil = o.vyuzity / o.limit;
  if (podil >= 1) return 'Plno. Celý limit máš využitý.';
  if (podil >= 0.9) return 'Skoro plno. Zbývá jen malý kousek.';
  if (podil >= 0.5) return 'Víc než polovina je využitá. Ještě je kam přidat.';
  if (podil > 0) return 'Většina limitu je zatím volná.';
  return 'Limit je zatím prázdný.';
}

/** Části limitu v pořadí penzijko → DIP → životní pojištění, oříznuté na výši limitu. */
export function castiLimitu(o) {
  let zbyva = o.limit;
  const podil = (castka) => { const v = Math.min(castka, zbyva); zbyva -= v; return v; };
  return [
    { nazev: 'Penzijko (DPS)', hodnota: podil(o.dpsCast), trida: 'graf-rada-1' },
    { nazev: 'DIP', hodnota: podil(o.dip), trida: 'graf-rada-3' },
    { nazev: 'Životní pojištění', hodnota: podil(o.zp), trida: 'graf-rada-2' },
  ];
}

/** Graf využití limitu (skládaný pruh) a tabulka jako textová alternativa. */
export function grafLimitu(o) {
  const casti = castiLimitu(o);
  const nenulove = casti.filter((c) => c.hodnota > 0);
  const graf = skladanyPruh({
    titulek: `Složení limitu odpočtu ${kc(o.limit)}`,
    id: 'plan48-limit',
    polozky: nenulove,
    limit: o.limit,
  });
  const tabulka = tabulkaDat({
    caption: 'Využití limitu odpočtu',
    sloupce: ['Část', 'Částka za rok'],
    radky: [
      ...casti.map((c) => [c.nazev, kc(c.hodnota)]),
      ['Volné místo v limitu', kc(o.nevyuzity)],
      ['Limit celkem', kc(o.limit)],
    ],
  });
  return { graf, tabulka };
}

/** Krátký formát pro osu Y: 250 tis. Kč, 1,2 mil. Kč. */
export function kratce(n) {
  const a = Math.abs(n);
  if (a >= 1e6) return `${cislo(n / 1e6, Number.isInteger(n / 1e6) ? 0 : 1)} mil. Kč`;
  if (a >= 1e3) return `${cislo(n / 1e3)} tis. Kč`;
  return kc(n);
}

/** Graf projekce do vekKonec (hodnota úspor vs. vloženo) a tabulka. */
export function grafProjekce(body, { sirka = 640, vyska = 320 } = {}) {
  if (body.length < 2) return { graf: '', tabulka: '' };
  const graf = caroveGrafy({
    titulek: 'Projekce úspor na penzijku a DIP',
    id: 'plan48-projekce',
    sirka,
    vyska,
    rady: [
      { nazev: 'Hodnota úspor', body: body.map((b) => ({ x: b.vek, y: b.hodnota })), trida: 'graf-rada-1', vyplnena: true, zvyraznena: true },
      { nazev: 'Vloženo celkem', body: body.map((b) => ({ x: b.vek, y: b.vlozeno })), trida: 'graf-rada-2', carkovana: true },
    ],
    osaX: { popisek: 'věk', format: (n) => `${cislo(n)}` },
    osaY: { format: kratce },
  });
  const posledni = body.length - 1;
  const radky = body.filter((b, i) => i === 0 || i === posledni || (b.vek - body[0].vek) % 5 === 0)
    .map((b) => [`${cislo(b.vek)} let`, kc(b.vlozeno), kc(b.hodnota)]);
  const tabulka = tabulkaDat({
    caption: 'Projekce úspor po pěti letech',
    sloupce: ['Věk', 'Vloženo celkem', 'Hodnota úspor'],
    radky,
  });
  return { graf, tabulka };
}

/** Věta nad grafem projekce. */
export function shrnutiProjekce(body, vekKonec) {
  if (body.length < 2) return `Projekce se počítá do ${vekKonec} let. Pro zadaný věk už není co promítat.`;
  const k = body.at(-1);
  return `V ${vekKonec} letech můžeš mít zhruba ${kc(k.hodnota)}. Z toho ${kc(k.vlozeno)} je vloženo (ty, zaměstnavatel, stát a DIP).`;
}

/** Shrnutí kroků formuláře (step-sum). */
export function shrnutiKroku(vstup, sada) {
  return {
    oTobe: `${cislo(vstup.vek)} let · daň ${pct(vstup.sazbaDane)} · ${sada.nazev}${vstup.starobniDuchod ? ' · důchod' : ''}`,
    vklady: `Penzijko ${kc(vstup.dps)} · DIP ${kc(vstup.dip)} · životko ${kc(vstup.zp)} měsíčně`,
  };
}

/** Pásmo návrhu se zvýšeným příspěvkem pro dospělé (např. 18–29 let, 40 %). */
export function pasmoMladych(sada) {
  const pasma = sada.statniPrispevek.pasma.filter((p) => p.vekOd > 0 && p.vekDo !== null);
  return pasma.sort((a, b) => b.sazba - a.sazba)[0] || null;
}

/** Texty karty „A co návrh pro rok 2027?“. Vrací null, když v pravidlech návrh není. */
export function textyNavrhu(vstup, pravidla) {
  const klic = Object.keys(pravidla.sady).find((k) => pravidla.sady[k].stav === 'navrh');
  if (!klic) return null;
  const navrh = pravidla.sady[klic];
  const platne = pravidla.sady[pravidla.vychozi.sada];
  const mladi = pasmoMladych(navrh);
  const deti = navrh.statniPrispevek.pasma.find((p) => p.vekOd === 0 && p.vekDo !== null);
  let popis = '';
  if (mladi) {
    const mes = Math.round(mladi.sazba * mladi.maxZaklad);
    popis = `Pro lidi do ${mladi.vekDo + 1} let má být státní příspěvek ${pct(mladi.sazba)} vkladu. Při vkladu ${kc(mladi.maxZaklad)} měsíčně je to ${kc(mes)} měsíčně, tedy ${kc(mes * MESICU)} ročně.`;
  }
  if (deti) popis += ` Děti mají mít nárok už od vkladu ${kc(deti.minVklad)}.`;

  const ted = spocitejRok({ ...vstup, mesicuProbehlo: 0 }, platne).statniPrispevekRocne;
  const pak = spocitejRok({ ...vstup, mesicuProbehlo: 0 }, navrh).statniPrispevekRocne;
  let proTebe;
  if (vstup.starobniDuchod && navrh.statniPrispevek.starobniDuchodBezNaroku) {
    proTebe = 'Při starobním důchodu by se pro tebe nic nezměnilo. Státní příspěvek nenáleží ani podle návrhu.';
  } else if (pak > ted) {
    proTebe = `S tvým vkladem by ti stát podle návrhu přidal ${kc(pak)} ročně. To je o ${kc(pak - ted)} víc než teď.`;
  } else if (mladi && vstup.vek > mladi.vekDo) {
    proTebe = `Je ti ${cislo(vstup.vek)}, takže by se tě zvýšený příspěvek pro lidi do ${mladi.vekDo + 1} let netýkal.`;
  } else if (mladi && vstup.dps < mladi.minVklad) {
    proTebe = `Zvýšený příspěvek by se tě týkal, ale až od vkladu ${kc(mladi.minVklad)} měsíčně.`;
  } else {
    proTebe = 'S tvým zadáním by se státní příspěvek podle návrhu nezměnil.';
  }
  return { nazev: navrh.nazev, stitek: stitekSady(navrh), popis: popis.trim(), poznamka: navrh.poznamka, proTebe };
}
