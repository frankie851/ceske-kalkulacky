// Cestovní příkaz 2027 – výstupy (HTML řetězce) pro stránku i pro ukázku při buildu.
// Čisté funkce bez DOM: stejný kód vykreslí ukázku v Node (cestovni-prikaz-2027.11tydata.js)
// i živý výsledek v prohlížeči (app.js). Žádné sazby tu nejsou: všechno je v rules.json.
import {
  ChybaSazby, ChybaVstupu, PALIVA, DRUHY_VOZIDEL,
  spocitejCestu, souhrn, nazevPasma, formatMinuty,
} from './cesty.js';
import { kc, cislo, procenta, datum } from '../../js/format.js';
import { esc } from '../../js/graf.js';

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

/** Uložená hlavička → vstup pro spocitejCestu (veřejná sféra: prázdné = dolní hranice rozpětí). */
export function hlavickaProVypocet(h, rules) {
  const r = rules[posledniRok(rules)];
  const out = {
    firma: h.firma, zamestnanec: h.kdo, sfera: h.sfera,
    vozidlo: { ...h.vozidlo, spotreba: Number(h.vozidlo.spotreba) },
  };
  if (h.sfera === 'verejna') {
    if ((h.stravneVerejna || []).some((v) => v !== null && v !== undefined)) {
      out.stravneVerejna = [0, 1, 2].map((i) => h.stravneVerejna[i] ?? r.stravne.verejnaMin[i]);
    }
  } else {
    out.kraceniPct = [0, 1, 2].map((i) => h.kraceniPct?.[i] ?? r.kraceniMaxPct[i]);
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
    const v = spocitejCestu(hlavickaProVypocet(hlavicka, rules),
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
  const vyhlasky = [...new Set(ok.map((p) => p.v.vyhlaska))];
  const novely = [...new Set(ok.map((p) => rules[p.c.odjezd.slice(0, 4)]?.novely || []).flat()
    .filter((n) => ok.some((p) => p.c.odjezd.slice(0, 10) >= n.ucinnost)).map((n) => n.cislo))];
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
      <div><dt>Sféra</dt><dd>${sfera}</dd></div>
      <div><dt>Sazby</dt><dd>vyhláška č. ${vyhlasky.map(esc).join(', ')}${novely.length ? ` ve znění ${novely.map(esc).join(', ')}` : ''}</dd></div>
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
    <p class="small muted">Každou položku počítáme na haléře, celkovou částku zaokrouhlujeme nahoru na celé koruny.
      Vyhláška ani zákoník práce zaokrouhlení neupravují.${vysledek.polozky.length > ok.length ? ` <strong>Nezapočteno: ${vysledek.polozky.length - ok.length} ${sklonujCesty(vysledek.polozky.length - ok.length)} bez platných sazeb.</strong>` : ''}</p>
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
