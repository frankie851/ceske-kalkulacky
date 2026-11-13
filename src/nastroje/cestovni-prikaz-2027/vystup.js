// Cestovní příkaz 2027 – výstupy (HTML řetězce) pro stránku i pro ukázku při buildu.
// Čisté funkce bez DOM: stejný kód vykreslí ukázku v Node (cestovni-prikaz-2027.11tydata.js)
// i živý výsledek v prohlížeči (app.js). Žádné sazby tu nejsou: všechno je v rules.json.
import {
  ChybaSazby, ChybaVstupu, PALIVA, DRUHY_VOZIDEL,
  spocitejCestu, souhrn, nazevPasma, formatMinuty,
} from './cesty.js';
import { kc, cislo, procenta, datum, NBSP } from '../../js/format.js';
import { esc } from '../../js/graf.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

export const JIDLA = [['s', 'snídaně'], ['o', 'oběd'], ['v', 'večeře']];
export const PASMA = ['5–12 h', '12–18 h', 'nad 18 h'];

/* ---------- roky sazeb (rules.json má i klíč meta – rok je jen čtyřmístný klíč) ---------- */

export const rokySazeb = (rules) => Object.keys(rules).filter((k) => /^\d{4}$/.test(k)).sort();
export const rokySeSazbami = (rules) => rokySazeb(rules).filter((k) => rules[k]);
export const rokyBezSazeb = (rules) => rokySazeb(rules).filter((k) => !rules[k]);
export const posledniRok = (rules) => rokySeSazbami(rules).at(-1);

/** Srozumitelné vysvětlení, proč pro rok nejsou sazby (místo dlouhé zprávy z cesty.js). */
export function textChybySazby(rules, rok) {
  const posledni = posledniRok(rules);
  if (Object.prototype.hasOwnProperty.call(rules, rok) && rules[rok] === null) {
    return `Sazby pro rok ${rok} vyjdou ve vyhlášce obvykle koncem prosince. Zatím spočítáš cesty v roce ${posledni}.`;
  }
  return `Sazby pro rok ${rok} tu nemáme. Spočítáš cesty v roce ${posledni}.`;
}

/* ---------- hlavička: sazby podle roku cesty (revize CES-11) ---------- */

/**
 * Rok, podle kterého se v hlavičce nabízí a ověřuje rozpětí stravného a krácení: rok rozpracované
 * cesty (odjezd ve formuláři), jinak nejpozdější rok cest v seznamu, jinak poslední rok se sazbami.
 */
export function rokHlavicky(rules, odjezd, cesty = []) {
  const maSazby = (rok) => Boolean(rok && /^\d{4}$/.test(rok) && rules[rok]);
  const zOdjezdu = String(odjezd ?? '').slice(0, 4);
  if (maSazby(zOdjezdu)) return zOdjezdu;
  return cesty.map((c) => String(c?.odjezd ?? '').slice(0, 4)).filter(maSazby).sort().at(-1) ?? posledniRok(rules);
}

/**
 * Přečte stravné z polí hlavičky (texty = { id: text }) a ověří ho proti sazbám roku r.
 * Prázdné pole = null (výpočet použije výchozí hodnotu roku cesty), neplatné = undefined + chyba.
 * kraceni0–2: krácení za jídlo (nejvýš podle § 163 odst. 2), verejna0–2: částka v rozpětí (§ 176),
 * sjednane0–2: vyšší sjednané stravné v soukromé sféře, aspoň zákonné minimum (§ 163 odst. 3).
 */
export function stravneHlavicky(texty, r) {
  const chyby = {};
  const cti = (id, chyba) => {
    const n = prectiCislo(texty[id]);
    if (n === null) return null;
    const zprava = Number.isFinite(n) ? chyba(n) : chyba(NaN);
    if (zprava) { chyby[id] = zprava; return undefined; }
    return n;
  };
  const pasma = [0, 1, 2];
  return {
    kraceniPct: pasma.map((i) => cti(`kraceni${i}`, (n) => (n >= 0 && n <= r.kraceniMaxPct[i] ? '' : `Nejvýš ${r.kraceniMaxPct[i]}${NBSP}%.`))),
    stravneVerejna: pasma.map((i) => {
      const min = r.stravne.verejnaMin[i];
      const max = r.stravne.verejnaMax[i];
      return cti(`verejna${i}`, (n) => (n >= min && n <= max ? '' : `Jen ${min}–${max}${NBSP}Kč.`));
    }),
    stravneSoukroma: pasma.map((i) => cti(`sjednane${i}`, (n) => (n >= r.stravne.soukroma[i] ? '' : `Nejméně ${r.stravne.soukroma[i]}${NBSP}Kč.`))),
    chyby,
  };
}

/** Nápovědy k polím stravného v hlavičce pro sazby roku r (sdílí build i prohlížeč). */
export function napovedyHlavicky(r, rok) {
  return {
    kraceni: `Pro rok ${rok} zákon dovoluje nejvýš ${r.kraceniMaxPct.join(' / ')} %. Nižší procento musí firma určit předem, před cestou. Prázdné pole: nejvyšší krácení.`,
    verejna: [0, 1, 2].map((i) => `${cislo(r.stravne.verejnaMin[i])}–${kc(r.stravne.verejnaMax[i])}`),
    sjednane: [0, 1, 2].map((i) => `Nejméně ${kc(r.stravne.soukroma[i])}.`),
  };
}

/* ---------- formátování ---------- */

export const hal = (h) => kc(h / 100, 2);
export const km = (n) => cislo(n, Number.isInteger(Number(n)) ? 0 : 1);
const desetinne = (n) => cislo(n, Number.isInteger(Number(n)) ? 0 : (Number.isInteger(Number(n) * 10) ? 1 : 2));
const cas = (s) => String(s).slice(11, 16);

export function trasa(c) {
  return [c.odkud, c.kam].filter(Boolean).map(esc).join(' – ') || 'Bez trasy';
}

export function terminCesty(c) {
  const d1 = c.odjezd.slice(0, 10);
  const d2 = c.navrat.slice(0, 10);
  return d1 === d2
    ? `${datum(d1)} ${cas(c.odjezd)}–${cas(c.navrat)}`
    : `${datum(d1)} ${cas(c.odjezd)} – ${datum(d2)} ${cas(c.navrat)}`;
}

/* ---------- výpočet ---------- */

/**
 * Uložená hlavička → vstup pro spocitejCestu. Prázdné hodnoty zůstanou null a cesty.js je doplní
 * podle sazeb roku cesty (revize CES-11): veřejná sféra dolní hranicí rozpětí, krácení nejvyšším
 * zákonným procentem, stravné v soukromé sféře zákonným minimem.
 */
export function hlavickaProVypocet(h) {
  const pasma = (pole) => [0, 1, 2].map((i) => pole?.[i] ?? null);
  const out = {
    firma: h.firma, zamestnanec: h.kdo, sfera: h.sfera,
    vozidlo: { ...h.vozidlo, spotreba: Number(h.vozidlo.spotreba) },
  };
  if (h.sfera === 'verejna') out.stravneVerejna = pasma(h.stravneVerejna);
  else {
    out.kraceniPct = pasma(h.kraceniPct);
    out.stravneSoukroma = pasma(h.stravneSoukroma);
  }
  return out;
}

export const pocetJidel = (j) => Object.fromEntries(
  Object.entries(j ?? {}).map(([d, m]) => [d, JIDLA.filter(([k]) => m?.[k]).length]));

/** Zprávy z cesty.js vykají – na webu tykáme. */
const tykani = (text) => String(text)
  .replace(/Zadejte spotřebu vozidla z technického průkazu\./, 'Chybí spotřeba z technického průkazu. Doplň ji v hlavičce.')
  .replace(/rozdělte ji prosím/, 'rozděl ji na víc cest')
  .replace(/Zadejte/g, 'Zadej').replace(/zadejte/g, 'zadej').replace(/Zvolte/g, 'Vyber');

/** Spočítá jednu cestu. Chyby sazeb a vstupu vrátí jako { ok: false }, jiné vyhodí. */
export function vypocitejCestu(hlavicka, c, rules) {
  try {
    const v = spocitejCestu(hlavickaProVypocet(hlavicka),
      { ...c, cenaDoklad: c.cenaDoklad ?? undefined, jidla: pocetJidel(c.jidla) }, rules);
    return { c, ok: true, v };
  } catch (e) {
    if (e instanceof ChybaSazby || e instanceof ChybaVstupu) {
      const sazby = e instanceof ChybaSazby;
      const rok = sazby ? (/\b(\d{4})\b/.exec(e.message) || [])[1] : null;
      return { c, ok: false, sazby, zprava: rok && !rules[rok] ? textChybySazby(rules, rok) : tykani(e.message) };
    }
    throw e;
  }
}

export function vypocitej(stav, rules) {
  const polozky = stav.cesty.map((c) => vypocitejCestu(stav.hlavicka, c, rules));
  const ok = polozky.filter((p) => p.ok);
  return { polozky, ok, souhrn: souhrn(ok.map((p) => p.v)) };
}

/* ---------- výsledek ---------- */

const sklonujCesty = (n) => (n === 1 ? 'cestu' : n >= 2 && n <= 4 ? 'cesty' : 'cest');

export function hlavniCislo(vysledek) {
  return kc(vysledek.souhrn.celkemKc);
}

export function popisVysledku(vysledek) {
  const n = vysledek.ok.length;
  return n ? `K proplacení za ${n} ${sklonujCesty(n)}, zaokrouhleno nahoru na koruny` : 'Zatím žádná cesta k proplacení';
}

export function statistiky(vysledek) {
  const s = vysledek.souhrn;
  const polozky = [
    { hodnota: hal(s.zakladniHal), popis: 'Základní náhrada za auto' },
    { hodnota: hal(s.phmHal), popis: 'Pohonné hmoty' },
    { hodnota: hal(s.stravneHal), popis: 'Stravné', zvyraznit: true },
  ];
  return `<ul class="stats">${polozky.map((p) => `<li class="stat${p.zvyraznit ? ' sage' : ''}"><b>${p.hodnota}</b><span>${p.popis}</span></li>`).join('')}</ul>`;
}

/* ---------- seznam cest ---------- */

export function seznam(vysledek, { akce = true } = {}) {
  if (!vysledek.polozky.length) {
    return '<p class="cp-prazdno">Zatím žádná cesta. Vyplň formulář a klikni na „Přidat cestu“.</p>';
  }
  const radky = vysledek.polozky.map(({ c, ok, v, zprava }) => `
    <li class="cp-cesta${ok ? '' : ' cp-cesta-chyba'}" id="cesta-${esc(c.id)}">
      <div class="cp-cesta-text">
        <p class="cp-cesta-kdy">${terminCesty(c)}</p>
        <p class="cp-cesta-kam">${trasa(c)}</p>
        <p class="small muted">${esc(c.ucel)}${c.km > 0 ? ` · ${km(c.km)}&nbsp;km` : ' · bez auta'}</p>
        ${ok ? '' : `<p class="error-msg"><span>${esc(zprava)}</span></p>`}
      </div>
      <div class="cp-cesta-strana">
        ${ok ? `<p class="cp-cesta-suma num">${hal(v.celkemHal)}</p>` : ''}
        ${akce ? `<div class="cp-cesta-akce">
          <button type="button" class="btn btn-ghost" data-akce="upravit" data-id="${esc(c.id)}">Upravit<span class="sr-only"> cestu ${terminCesty(c)}</span></button>
          <button type="button" class="btn btn-ghost" data-akce="smazat" data-id="${esc(c.id)}">Smazat<span class="sr-only"> cestu ${terminCesty(c)}</span></button>
        </div>` : ''}
      </div>
    </li>`).join('');
  return `<ol class="cp-seznam">${radky}</ol>`;
}

/* ---------- vyúčtování k tisku ---------- */

function rozpis(c, v, h) {
  const jedn = PALIVA[h.vozidlo.palivo]?.jednotka ?? 'l';
  const radky = [];
  if (c.km > 0) {
    const prives = v.privesPct ? ` + ${procenta(v.privesPct)} za přívěs` : '';
    radky.push(`Základní náhrada: ${km(c.km)} km × ${kc(v.sazbaKm, 2)}/km${prives} = <strong>${hal(v.zakladniHal)}</strong>`);
    const zdroj = v.cena.zdroj === 'doklad' ? 'cena z dokladu' : `průměrná cena podle vyhlášky od ${datum(v.cena.od)}`;
    radky.push(`Pohonné hmoty: ${km(c.km)} km × ${desetinne(h.vozidlo.spotreba)} ${jedn}/100 km × ${hal(v.cena.cenaHal)}/${jedn} (${zdroj}) = <strong>${hal(v.phmHal)}</strong>`);
  }
  const dny = v.dny.map((d) => {
    if (d.pasmo < 0) return `${datum(d.datum)} ${formatMinuty(d.minuty)}: pod 5 h, stravné nenáleží`;
    const kr = d.jidla ? `, ${d.jidla} ${d.jidla === 1 ? 'jídlo' : 'jídla'} × −${procenta(d.pct)}` : '';
    return `${datum(d.datum)} ${formatMinuty(d.minuty)} (${nazevPasma(d.pasmo)}): ${hal(d.zakladHal)}${kr} = <strong>${hal(d.stravneHal)}</strong>`;
  });
  if (v.posouzeni === 'spolecne') {
    const s = v.spolecne;
    const kr = s.jidla ? `, ${s.jidla} ${s.jidla === 1 ? 'jídlo' : 'jídla'} × −${procenta(s.pct)}` : '';
    radky.push(`Stravné posouzené dohromady za oba dny (§ 163 odst. 4 zákoníku práce, výhodnější než po dnech): ${formatMinuty(s.minuty)} (${nazevPasma(s.pasmo)}): ${hal(s.zakladHal)}${kr} = <strong>${hal(s.stravneHal)}</strong>`);
  } else radky.push(`Stravné: ${dny.join('; ')}`);
  return radky.map((r) => `<li>${r}</li>`).join('');
}

export function vyuctovani(stav, vysledek, rules) {
  const h = stav.hlavicka;
  const { ok, souhrn: s } = vysledek;
  if (!ok.length) {
    return '<p class="muted">Vyúčtování se ukáže, až přidáš aspoň jednu cestu, kterou jde spočítat.</p>';
  }
  // Odkazy na texty předpisů na zakonyprolidi.cz (revize CES-08); při tisku je doplní CSS i jako adresu.
  const odkaz = (url, text) => (url ? `<a href="${esc(url)}">${esc(text)}</a>` : esc(text));
  const roky = [...new Set(ok.map((p) => p.c.odjezd.slice(0, 4)))];
  const vyhlasky = [...new Map(roky.map((rok) => [rules[rok].vyhlaska, rules[rok].zdroj?.url])).entries()]
    .map(([c, url]) => odkaz(url, c));
  const novely = [...new Map(roky.flatMap((rok) => rules[rok].novely || [])
    .filter((n) => ok.some((p) => p.c.odjezd.slice(0, 10) >= n.ucinnost)).map((n) => [n.cislo, n.url])).entries()]
    .map(([c, url]) => odkaz(url, c));
  const sjednane = h.sfera !== 'verejna' && (h.stravneSoukroma || []).some((x) => x !== null && x !== undefined)
    ? `<div><dt>Sjednané stravné (§ 163 odst. 3 zákoníku práce)</dt><dd>${PASMA.map((p, i) => `${p}: ${h.stravneSoukroma[i] !== null && h.stravneSoukroma[i] !== undefined ? kc(h.stravneSoukroma[i]) : 'zákonné minimum'}`).join(', ')}</dd></div>`
    : '';
  const palivo = PALIVA[h.vozidlo.palivo];
  const jedn = palivo?.jednotka ?? 'l';
  const sfera = h.sfera === 'verejna' ? 'veřejná sféra (§ 176 zákoníku práce)' : 'soukromá sféra (§ 163 zákoníku práce)';
  const kmCelkem = ok.reduce((a, p) => a + (Number(p.c.km) || 0), 0);
  const sloupce = ['Kdy', 'Trasa a účel', 'km', 'Základní náhrada', 'Pohonné hmoty', 'Stravné', 'Celkem'];
  const td = (i, obsah, r = true) => `<td${r ? ' class="r"' : ''} data-label="${sloupce[i]}">${obsah}</td>`;

  const telo = ok.map(({ c, v }) => `
      <tr>
        <th scope="row">${terminCesty(c)}</th>
        ${td(1, `${trasa(c)}<span class="cp-ucel">${esc(c.ucel)}</span>`, false)}
        ${td(2, c.km > 0 ? km(c.km) : '–')}
        ${td(3, hal(v.zakladniHal))}
        ${td(4, hal(v.phmHal))}
        ${td(5, hal(v.stravneHal))}
        ${td(6, `<strong>${hal(v.celkemHal)}</strong>`)}
      </tr>
      <tr class="cp-rozpis"><td colspan="7"><ul>${rozpis(c, v, h)}</ul></td></tr>`).join('');

  return `
    <dl class="cp-hlavicka-dokladu">
      <div><dt>Zaměstnavatel</dt><dd>${esc(h.firma) || '–'}</dd></div>
      <div><dt>Kdo jede</dt><dd>${esc(h.kdo) || '–'}</dd></div>
      <div><dt>Vozidlo</dt><dd>${esc(h.vozidlo.spz) || 'SPZ nevyplněna'}, ${esc(DRUHY_VOZIDEL[h.vozidlo.druh] || '')}</dd></div>
      <div><dt>Palivo a spotřeba (technický průkaz)</dt><dd>${esc(palivo?.nazev || '')}, ${h.vozidlo.spotreba ? desetinne(h.vozidlo.spotreba) : '–'} ${jedn}/100 km</dd></div>
      <div><dt>Sféra</dt><dd>${sfera}</dd></div>${sjednane}
      <div><dt>Sazby</dt><dd>vyhláška č. ${vyhlasky.join(', ')}${novely.length ? ` ve znění ${novely.join(', ')}` : ''}</dd></div>
    </dl>
    <div class="table-wrap" role="region" aria-label="Tabulka: vyúčtování cest" tabindex="0">
      <table class="stack-table cp-tabulka">
        <caption>Vyúčtování tuzemských pracovních cest</caption>
        <thead><tr>${sloupce.map((x, i) => `<th scope="col"${i >= 2 ? ' class="r"' : ''}>${x}</th>`).join('')}</tr></thead>
        <tbody>${telo}</tbody>
        <tfoot><tr>
          <th scope="row">Součet (${ok.length} ${ok.length === 1 ? 'cesta' : ok.length <= 4 ? 'cesty' : 'cest'})</th>
          ${td(1, '', false)}
          ${td(2, kmCelkem > 0 ? km(Math.round(kmCelkem * 10) / 10) : '–')}
          ${td(3, hal(s.zakladniHal))}
          ${td(4, hal(s.phmHal))}
          ${td(5, hal(s.stravneHal))}
          ${td(6, `<strong>${hal(s.celkemHal)}</strong>`)}
        </tr></tfoot>
      </table>
    </div>
    <p class="cp-k-vyplate"><span>K výplatě celkem</span><strong class="num">${kc(s.celkemKc)}</strong></p>
    <p class="small muted">Každou položku počítáme na haléře (konvence kalkulačky). Částku k výplatě zaokrouhlujeme nahoru na celé koruny podle § 183 odst. 5 zákoníku práce.${vysledek.polozky.length > ok.length ? ` <strong>Nezapočteno: ${vysledek.polozky.length - ok.length} ${sklonujCesty(vysledek.polozky.length - ok.length)} bez platných sazeb.</strong>` : ''}</p>
    <div class="cp-podpisy">
      <div><p>Vyúčtování předkládá (kdo jede)</p><p class="cp-linka">Datum:</p><p class="cp-linka">Podpis:</p></div>
      <div><p>Vyúčtování schvaluje (za zaměstnavatele)</p><p class="cp-linka">Datum:</p><p class="cp-linka">Podpis:</p></div>
    </div>`;
}

/* ---------- sazby roku (tabulky pod výsledkem) ---------- */

/** Řádky tabulek se sazbami pro všechny roky, které mají vyhlášku. */
export function sazbyRoku(rules) {
  return rokySeSazbami(rules).map((rok) => {
    const r = rules[rok];
    const phm = Object.entries(r.phm).flatMap(([klic, obdobi]) => obdobi.map((o) => [
      PALIVA[klic].nazev, `${kc(o.cena, 2)}/${PALIVA[klic].jednotka}`, `od ${datum(o.od)}`,
    ]));
    return {
      rok,
      vyhlaska: r.vyhlaska,
      novely: (r.novely || []).map((n) => `${n.cislo} (od ${datum(n.ucinnost)}: ${n.popis})`),
      km: Object.entries(r.sazbaKm).map(([k, s]) => [DRUHY_VOZIDEL[k], `${kc(s, 2)} za km`]),
      stravne: [0, 1, 2].map((i) => [
        PASMA[i],
        kc(r.stravne.soukroma[i]),
        `${cislo(r.stravne.verejnaMin[i])}–${kc(r.stravne.verejnaMax[i])}`,
        `až ${procenta(r.kraceniMaxPct[i])}`,
      ]),
      phm,
    };
  });
}
