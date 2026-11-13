// Penzijko kompas – texty a HTML výsledků. Sdílí ho build (penzijko-kompas.11tydata.js, ukázka bez JS)
// i prohlížeč (app.js), takže stránka bez JS i s JS ukazuje totéž. Bez DOM, bez fetch.
// Všechny částky, sazby a hranice jdou z rules.json (parametr `rules`), výpočty z calc.js.
import {
  statniPrispevek,
  danovyOdpocet,
  vkladProMaxPrispevek,
  srovnaniFondu,
  dopadPoplatku,
  transformovanyFond,
  doporuceni,
  poplatekZaPrevod,
} from './calc.js';
import { kc, cislo, procenta, datum } from '../../js/format.js';
import { caroveGrafy, esc } from '../../js/graf.js';

const PROCENT = 100;
const TISIC = 1e3;
const MILION = 1e6;

/** Počet desetinných míst, který číslo potřebuje (0–2): 0.8 → 1, 10 → 0. */
function mist(n) {
  for (let d = 0; d < 2; d++) if (Math.abs(n * 10 ** d - Math.round(n * 10 ** d)) < 1e-9) return d;
  return 2;
}

/** Procenta s tolika desetinnými místy, kolik je potřeba: 0,8 %, 10 %. */
export const pct = (n) => procenta(n, mist(n));

/** Hodnota do textového pole formuláře: 150 000, 0,8. */
export const doPole = (n) => cislo(n, mist(n));

/** Klíč platné sady pravidel (stav "platne"), jinak první sada. */
export function platnaSada(rules) {
  return Object.keys(rules.sady).find((k) => rules.sady[k].stav === 'platne') ?? Object.keys(rules.sady)[0];
}

/** Krátký název sady na přepínač: „Pravidla 2026“, „Návrh 2027“. */
export function kratkyNazev(sada) {
  // Rok sady (ne rok účinnosti): pravidla „2026“ platí beze změny už od 1. 7. 2024 (revize 5. 11. 2026, PEN-12).
  const rok = sada.rok ?? String(sada.platnostOd).slice(0, 4);
  return sada.stav === 'navrh' ? `Návrh ${rok}` : `Pravidla ${rok}`;
}

/** Do kolika let platí stejná sazba a maximum jako v pásmu pro daný věk (spojí navazující pásma). */
function konecSazby(sada, pasmo) {
  const pasma = [...sada.statniPrispevek.pasma].sort((a, b) => a.vekOd - b.vekOd);
  let konec = pasmo.vekDo;
  for (const p of pasma) {
    if (konec !== null && konec !== undefined && p.vekOd === konec
      && p.sazba === pasmo.sazba && p.maxPrispevek === pasmo.maxPrispevek) konec = p.vekDo;
  }
  return konec ?? null;
}

/** Vysvětlení státního příspěvku pro jednu sadu pravidel (tykání, rodově neutrálně). */
function vysvetleniPrispevku(sada, v, r) {
  if (v.duchodce && !sada.statniPrispevek.duchodceMaNarok) {
    return 'Při pobírání starobního důchodu na státní příspěvek nárok není.';
  }
  if (!r.pasmo) return 'Pro tento věk pravidla příspěvek neuvádějí.';
  const cil = vkladProMaxPrispevek(sada, v.vek);
  let text;
  if (r.mesicne === 0) {
    text = `Příspěvek začíná od vkladu ${kc(r.pasmo.minVklad)} měsíčně.`;
  } else if (r.mesicne < r.pasmo.maxPrispevek) {
    text = `${pct(r.pasmo.sazba * PROCENT)} z vkladu. Maximum ${kc(r.pasmo.maxPrispevek)} dostaneš při vkladu ${kc(cil)}.`;
  } else {
    text = `Máš maximum. Vklad nad ${kc(cil)} už příspěvek nezvýší, ale může snížit daň.`;
  }
  const konec = konecSazby(sada, r.pasmo);
  const nejnizsi = Math.min(...sada.statniPrispevek.pasma.map((p) => p.sazba));
  if (sada.stav === 'navrh' && konec !== null && r.pasmo.sazba > nejnizsi) {
    text += ` Vyšší sazba platí do ${konec}. narozenin.`;
  }
  return text;
}

/** Státní příspěvek podle všech sad pravidel (karty 2026 vedle návrhu 2027). */
export function prispevky(rules, v) {
  return Object.entries(rules.sady).map(([klic, sada]) => {
    const r = statniPrispevek(sada, v);
    return {
      klic,
      nazev: sada.nazev,
      kratce: kratkyNazev(sada),
      navrh: sada.stav === 'navrh',
      mesicne: kc(r.mesicne),
      rocne: kc(r.rocne),
      vysvetleni: vysvetleniPrispevku(sada, v, r),
    };
  });
}

/** Informativní daňový odpočet (podle platné sady). */
export function textOdpoctu(rules, v) {
  const sada = rules.sady[platnaSada(rules)];
  const d = danovyOdpocet(sada, v);
  const hranice = kc(sada.odpocet.nadVklad);
  let text = d.rocne > 0
    ? `Daňový odpočet (informativně): z vkladů nad ${hranice} měsíčně si můžeš od základu daně odečíst ${kc(d.rocne)} ročně, na dani tak ušetříš až ${kc(d.uspora)}.`
    : `Daňový odpočet se týká jen vlastních vkladů nad ${hranice} měsíčně.`;
  text += ` Limit ${kc(d.maxRocne)} ročně je společný s DIP a životním pojištěním.`;
  if (v.zamestnavatel > 0) text += ' Příspěvek zaměstnavatele se do státního příspěvku ani do odpočtu nepočítá.';
  return text;
}

function statistiky(polozky) {
  return `<ul class="stats">${polozky.map((s) =>
    `<li class="stat${s.zvyraznit ? ' sage' : ''}"><b>${esc(s.hodnota)}</b><span>${esc(s.popis)}</span></li>`).join('')}</ul>`;
}

/** Kompaktní popisek osy Y: 450 tis., 1,2 mil. */
function kratceKc(n) {
  if (Math.abs(n) >= MILION) return `${cislo(n / MILION, mist(Math.round(n / MILION * 10) / 10))} mil.`;
  if (Math.abs(n) >= TISIC) return `${cislo(n / TISIC)} tis.`;
  return cislo(n);
}

/** Třída barvy podle pořadí fondu v rules.json, aby fond měl vždy stejnou barvu. */
function tridaFondu(rules, klic) {
  return `graf-rada-${(Object.keys(rules.fondy).indexOf(klic) % 5) + 1}`;
}

/** Čárový graf „Kolik budeš mít v 65“: jedna řada na fond, tvůj fond zvýrazněný. */
export function htmlGraf(rules, v, srovnani, zobrazeni = 'realne', sirka = 640) {
  const realne = zobrazeni === 'realne';
  const vekPenze = rules.predpoklady.vekPenze;
  const vyska = Math.round(Math.min(360, Math.max(260, sirka * 0.55)));
  const rady = Object.entries(srovnani).map(([klic, p]) => ({
    nazev: rules.fondy[klic].nazev + (klic === v.fond ? ' (tvůj fond)' : ''),
    body: p.rada.map((b) => ({ x: Math.round(b.vek * 100) / 100, y: realne ? b.realne : b.nominal })),
    trida: tridaFondu(rules, klic),
    zvyraznena: klic === v.fond,
  }));
  const popis = `Zůstatek od dnešního věku ${v.vek} let do ${vekPenze} let podle typu fondu, ${realne ? 'v dnešních penězích' : 'nominálně'}. `
    + Object.entries(srovnani).map(([klic, p]) =>
      `${rules.fondy[klic].nazev}${klic === v.fond ? ' (tvůj fond)' : ''}: ${kc(realne ? p.souhrn.realne : p.souhrn.nominal)}`).join(', ') + '.';
  return caroveGrafy({
    titulek: `Kolik budeš mít v ${vekPenze} letech podle typu fondu (${realne ? 'v dnešních penězích' : 'nominálně'})`,
    popis,
    rady,
    osaX: { popisek: 'věk', format: (n) => cislo(n) },
    osaY: { popisek: realne ? 'Kč v dnešních penězích' : 'Kč nominálně', format: kratceKc },
    sirka,
    vyska,
    id: `kompas-graf-${zobrazeni}`,
  });
}

/** Tabulka fondů (textová alternativa ke grafu), tvůj fond zvýrazněný. */
export function htmlTabulka(rules, v, srovnani) {
  const vekPenze = rules.predpoklady.vekPenze;
  const sloupce = ['Fond', 'V dnešních penězích', 'Nominálně', 'Poplatky'];
  const radky = Object.entries(srovnani).map(([klic, p]) => {
    const tvuj = klic === v.fond;
    const s = p.souhrn;
    const bunky = [kc(s.realne), kc(s.nominal), kc(s.poplatky)];
    return `<tr${tvuj ? ' class="hl"' : ''} data-fond="${esc(klic)}"><th scope="row">${esc(rules.fondy[klic].nazev)}${tvuj ? ' <span class="tag">tvůj fond</span>' : ''}</th>`
      + bunky.map((b, i) => `<td class="r" data-label="${esc(sloupce[i + 1])}">${esc(b)}</td>`).join('') + '</tr>';
  }).join('');
  return `<div class="table-wrap" role="region" aria-label="Tabulka: kolik budeš mít v ${vekPenze} letech podle fondu" tabindex="0">`
    + `<table class="stack-table"><caption>Kolik budeš mít v ${vekPenze} letech podle typu fondu</caption>`
    + `<thead><tr>${sloupce.map((s, i) => `<th scope="col"${i ? ' class="r"' : ''}>${esc(s)}</th>`).join('')}</tr></thead>`
    + `<tbody>${radky}</tbody></table></div>`;
}

/** Souhrn projekce pro fond uživatele. */
export function htmlProjekce(rules, v, srovnani) {
  const vekPenze = rules.predpoklady.vekPenze;
  if (!srovnani) {
    return `<p>Projekci počítáme do ${vekPenze} let. Tvůj zůstatek je ${esc(kc(v.zustatek))}.</p>`;
  }
  const s = srovnani[v.fond].souhrn;
  return `<p>Ve fondu „${esc(rules.fondy[v.fond].nazev)}“ podle pravidel „${esc(kratkyNazev(rules.sady[v.sada]))}“:</p>`
    + statistiky([
      { hodnota: kc(s.realne), popis: `v ${vekPenze} letech v dnešních penězích`, zvyraznit: true },
      { hodnota: kc(s.nominal), popis: 'nominálně, bez vlivu inflace' },
      { hodnota: kc(s.statni), popis: 'z toho státní příspěvky' },
      { hodnota: kc(s.poplatky), popis: 'zaplatíš na poplatcích' },
    ]);
}

/** Karta „Poplatky tě stojí“: dnešní poplatky vs. strop z návrhu. */
export function htmlPoplatky(rules, v) {
  const vekPenze = rules.predpoklady.vekPenze;
  if (v.vek >= vekPenze) return `<p>Srovnání poplatků počítáme do ${vekPenze} let.</p>`;
  const d = dopadPoplatku(rules, v);
  const s = d.stropPoplatku;
  if (!s) return '<p>Žádná sada pravidel teď strop poplatků nemá.</p>';
  const dnesText = `${pct(v.poplatky.sprava)} za správu + ${pct(v.poplatky.zhodnoceni)} ze zhodnocení`;
  const stropText = `${pct(s.sprava)} za správu${s.zhodnoceni ? ` + ${pct(s.zhodnoceni)} ze zhodnocení` : ', bez poplatku ze zhodnocení'}`;
  const uvod = d.rozdilNominal >= 1
    ? `<p>Se stropem z návrhu (${esc(stropText)}) budeš mít v ${vekPenze} letech o <strong class="num">${esc(kc(d.rozdilNominal))}</strong> víc. V dnešních penězích je to <span class="num">${esc(kc(d.rozdilRealne))}</span>.</p>`
    : `<p>Tvoje poplatky už jsou pod navrhovaným stropem (${esc(stropText)}). Strop by pro tebe nic nezměnil.</p>`;
  return uvod + statistiky([
    { hodnota: kc(d.dnes.souhrn.poplatky), popis: `zaplatíš do ${vekPenze} let při dnešních poplatcích (${dnesText})` },
    { hodnota: kc(d.strop.souhrn.poplatky), popis: `zaplatíš se stropem z návrhu (${stropText})`, zvyraznit: true },
  ]) + `<p class="table-note">Obě varianty počítají se stejnými vklady a výnosy. Částky jsou nominální, do ${vekPenze} let.</p>`;
}

/** Popis výnosu fondu pro větu o předpokladech: „7,5 %“, u strategie „7,5 % u akcií a 4 % u dluhopisů“. */
function popisVynosu(fond) {
  return fond.cyklus
    ? `${pct(fond.cyklus.vynosAkcie)} u akcií a ${pct(fond.cyklus.vynosDluhopisy)} u dluhopisů`
    : pct(fond.vynos);
}

/** Věta pod srovnáním „zůstat, nebo přejít“: s jakými výnosy počítáme (PEN-06). */
export function pouziteVynosyTF(rules, cil) {
  const tf = rules.fondy.transformovany;
  const c = rules.fondy[cil];
  return `Počítáme s výnosem ${pct(tf.vynos)} ročně v transformovaném fondu a ${popisVynosu(c)} ve fondu „${c.nazev}“. `
    + 'Jsou to předpoklady, ne slib. Rozdíl mezi „zůstat“ a „přejít“ stojí právě na nich.';
}

/** Karta „Transformovaný fond“: zůstat vs. přejít, poplatek za převod ke konkurenci. */
export function htmlTF(rules, v) {
  const vekPenze = rules.predpoklady.vekPenze;
  const { poplatek, zdarmaPoMesicich } = rules.predpoklady.prevodKonkurence;
  let html = '';
  if (v.vek < vekPenze) {
    const t = transformovanyFond(rules, v);
    const cil = rules.fondy[t.cil].nazev;
    const lepsi = t.rozdilRealne > 0;
    html += statistiky([
      { hodnota: kc(t.zustat.souhrn.realne), popis: `zůstat v transformovaném fondu (v ${vekPenze} letech, v dnešních penězích)`, zvyraznit: !lepsi },
      { hodnota: kc(t.prejit.souhrn.realne), popis: `přejít do „${cil}“ (v ${vekPenze} letech, v dnešních penězích)`, zvyraznit: lepsi },
    ]);
    html += lepsi
      ? `<p class="mt-4">Přechod ti podle předpokladů přinese o <strong class="num">${esc(kc(t.rozdilRealne))}</strong> víc v dnešních penězích.</p>`
      : `<p class="mt-4">Při tvém horizontu vychází lépe zůstat. Rozdíl je <span class="num">${esc(kc(-t.rozdilRealne))}</span>.</p>`;
    html += `<p class="table-note">${esc(pouziteVynosyTF(rules, t.cil))}</p>`;
  }
  // § 61 odst. 3 a § 62 odst. 3 ZDPS: až 800 Kč, zdarma až po více než 60 měsících (revize 5. 11. 2026, PEN-10).
  html += `<p class="table-note">Převod ke konkurenci: ${poplatekZaPrevod(rules, v.delkaSmlouvy) > 0
    ? `zdarma je až po víc než ${zdarmaPoMesicich} měsících spoření u stejné společnosti. Do té doby může stát až ${esc(kc(poplatek))}. Přechod v rámci stejné společnosti je zdarma.`
    : `spoříš u stejné společnosti víc než ${zdarmaPoMesicich} měsíců, převod je zdarma.`}</p>`;
  return html;
}

/** Texty kroků z calc.doporuceni přepsané na tykání a rodově neutrálně, s českým formátem čísel. */
export function textKroku(rules, k, v) {
  const h = k.hodnoty;
  switch (k.id) {
    case 'vklad':
      return {
        nadpis: `Navyš vklad na ${kc(h.cilVklad)} měsíčně`,
        popis: `Stát ti pak přidá ${kc(h.pak)} místo ${kc(h.ted)} měsíčně. Ze svého dáš navíc ${kc(h.cilVklad - v.vklad)} měsíčně.`,
      };
    case 'fond':
      return {
        nadpis: `Změň fond na „${rules.fondy[h.cil].nazev}“`,
        popis: v.fond === 'transformovany'
          ? 'Přechod z transformovaného do účastnického fondu stejné společnosti je zdarma. Zpátky se ale vrátit nejde.'
          : 'Změnu strategie zadáš u své penzijní společnosti, obvykle online.',
      };
    case 'zamestnavatel':
      return {
        nadpis: 'Řekni si zaměstnavateli o příspěvek',
        popis: `Počítáme s ${kc(h.castka)} měsíčně. Pro firmu je příspěvek daňově zvýhodněný a do státního příspěvku se nepočítá.`,
      };
    case 'poplatky':
      return {
        nadpis: 'Najdi fond s nižšími poplatky',
        popis: `Tvůj fond je dražší než typický (${pct(h.sprava)} za správu + ${pct(h.zhodnoceni)} ze zhodnocení).`,
      };
    default:
      return { nadpis: k.nadpis, popis: k.popis };
  }
}

/** „Co udělat“: max. 3 kroky z calc.doporuceni seřazené podle přínosu. */
export function htmlKroky(rules, v) {
  const vekPenze = rules.predpoklady.vekPenze;
  const kroky = doporuceni(rules, v);
  if (!kroky.length) {
    return `<p>${v.vek >= vekPenze
      ? `Doporučení počítáme pro spoření do ${vekPenze} let.`
      : 'Nemáme co doporučit. Vklad, fond i příspěvek zaměstnavatele máš nastavené dobře.'}</p>`;
  }
  return `<ol class="kompas-kroky">${kroky.map((k) => {
    const t = textKroku(rules, k, v);
    return `<li data-krok="${esc(k.id)}"><h3>${esc(t.nadpis)}</h3><p>${esc(t.popis)}</p>`
      + `<p class="kompas-prinos">Přínos v ${vekPenze} letech: <strong class="num">+${esc(kc(k.prinos))}</strong> v dnešních penězích</p></li>`;
  }).join('')}</ol>`
    + `<p class="table-note">Přínos = o kolik víc budeš mít v ${vekPenze} letech v dnešních penězích, po odečtení peněz, které vložíš navíc ze svého.</p>`;
}

/** Shrnutí vyplněných kroků formuláře. */
export function shrnuti(rules, v) {
  return {
    oTobe: `${v.vek} let · smlouva ${v.delkaSmlouvy} let · ${kratkyNazev(rules.sady[v.sada])}${v.duchodce ? ' · starobní důchod' : ''}`,
    penzijko: `${kc(v.vklad)} měsíčně · ${rules.fondy[v.fond].nazev} · zůstatek ${kc(v.zustatek)}`,
  };
}

/** Všechno, co stránka ukazuje, pro jeden vstup. */
export function vypocet(rules, v, { sirka = 640 } = {}) {
  const vekPenze = rules.predpoklady.vekPenze;
  const sada = rules.sady[v.sada];
  const hlavni = statniPrispevek(sada, v);
  const srovnani = v.vek < vekPenze ? srovnaniFondu(rules, v) : null;
  return {
    prispevky: prispevky(rules, v),
    hlavni: {
      cislo: kc(hlavni.mesicne),
      popis: `měsíčně, to je ${kc(hlavni.rocne)} za rok`,
      lista: `Stát ti přidá měsíčně · ${kratkyNazev(sada)}`,
      navrh: sada.stav === 'navrh',
      sada: kratkyNazev(sada),
    },
    odpocet: textOdpoctu(rules, v),
    maTF: v.fond === 'transformovany',
    maProjekci: Boolean(srovnani),
    shrnuti: shrnuti(rules, v),
    html: {
      projekce: htmlProjekce(rules, v, srovnani),
      grafRealne: srovnani ? htmlGraf(rules, v, srovnani, 'realne', sirka) : '',
      grafNominal: srovnani ? htmlGraf(rules, v, srovnani, 'nominal', sirka) : '',
      tabulka: srovnani ? htmlTabulka(rules, v, srovnani) : '',
      poplatky: htmlPoplatky(rules, v),
      tf: v.fond === 'transformovany' ? htmlTF(rules, v) : '',
      kroky: htmlKroky(rules, v),
    },
  };
}

/** Předpoklady výnosů a inflace (statický text z rules.json). */
export function predpoklady(rules) {
  const f = rules.fondy;
  const p = rules.predpoklady;
  const cyklus = Object.values(f).find((x) => x.cyklus);
  const sadaTf = Object.values(rules.sady).find((x) => x.transformovaneFondy);
  const se = Object.values(rules.sady).find((s) => s.stropPoplatku);
  // Původ výnosů (PEN-06): model MF k návrhu Lepší penzijko, nebo vlastní předpoklad kalkulačky.
  const fondy = Object.values(f).filter((x) => !x.cyklus);
  const vycet = (seznam) => {
    const casti = seznam.map((x) => `${x.nazev.toLowerCase()} fond ${pct(x.vynos)}`);
    return casti.length > 1 ? `${casti.slice(0, -1).join(', ')} a ${casti.at(-1)}` : (casti[0] ?? '');
  };
  const zMf = fondy.filter((x) => x.vynosZdroj?.puvod === 'mf');
  const vlastni = fondy.filter((x) => x.vynosZdroj?.puvod !== 'mf');
  const tridyMf = cyklus && cyklus.cyklus.zdrojAkcie?.puvod === 'mf'
    ? [`akcie ${pct(cyklus.cyklus.vynosAkcie)}`, `dluhopisy ${pct(cyklus.cyklus.vynosDluhopisy)}`]
    : [];
  const polozky = [];
  if (zMf.length || tridyMf.length) {
    polozky.push(`Předpokládané roční výnosy před poplatky bereme z modelu MF k návrhu Lepší penzijko: ${[...zMf.map((x) => `${x.nazev.toLowerCase()} fond ${pct(x.vynos)}`), ...tridyMf].join(', ')}.`
      + zMf.filter((x) => /výnos akcií/.test(x.vynosZdroj.citace ?? ''))
        .map((x) => ` ${x.nazev} fond počítáme, jako by byl celý v akciích.`).join(''));
  }
  if (vlastni.length) {
    const text = vycet(vlastni);
    polozky.push(`${text.charAt(0).toUpperCase()}${text.slice(1)} ${vlastni.length > 1 ? 'jsou' : 'je'} předpoklad kalkulačky, ne úřední údaj. MF tyto výnosy neuvádí.`);
  }
  const tf = f.transformovany;
  if (tf) {
    polozky.push(`Výnos transformovaného fondu (${pct(tf.vynos)}) rozhoduje o radě „přejít“. Kdyby byl vyšší, přechod by vycházel méně výhodně.`);
  }
  polozky.push(`Inflace ${pct(p.inflace)} ročně${p.inflaceZdroj?.puvod === 'mf' ? ' (model MF)' : ''}. „V dnešních penězích“ znamená přepočteno touto inflací.`);
  if (cyklus) {
    const c = cyklus.cyklus;
    polozky.push(`Strategie životního cyklu je předpoklad kalkulačky, ne zákon: do ${c.plneAkcieDoVeku} let 100 % akcie (výnos ${pct(c.vynosAkcie)}), pak postupně na ${pct(c.podilAkciiNaKonci * PROCENT)} akcií v ${c.vekKonec} letech, zbytek dluhopisy (${pct(c.vynosDluhopisy)}).`);
  }
  if (sadaTf) {
    const tf = sadaTf.transformovaneFondy;
    polozky.push(`Transformovaný fond počítáme s platnými pravidly po celou dobu. S pravidly „${kratkyNazev(sadaTf)}“ (${tf.stitek}) ho po ${datum(tf.konci)} počítáme jako fond „${f[tf.nastupce].nazev}“.`);
  }
  if (se) {
    const dospeli = se.statniPrispevek.pasma.find((x) => x.vekDo === null || x.vekDo === undefined);
    polozky.push(`${kratkyNazev(se)}: strop poplatku za správu ${pct(se.stropPoplatku.sprava)}`
      + `${se.stropPoplatku.zhodnoceni ? `, poplatek ze zhodnocení nejvýš ${pct(se.stropPoplatku.zhodnoceni)}` : ', bez poplatku ze zhodnocení'}.`
      + `${dospeli ? ` Od ${dospeli.vekOd} let zůstává státní příspěvek jako dnes.` : ''}`);
  }
  polozky.push(`Doporučení počítají s příspěvkem zaměstnavatele ${kc(p.doporuceni.prispevekZamestnavatele)} měsíčně a s přechodem do fondu „${f[p.doporuceni.cilovyFond].nazev}“.`);
  polozky.push(`Projekce končí v ${p.vekPenze} letech. Výplatu po ${p.vekPenze} letech nepočítáme.`);
  return polozky;
}
