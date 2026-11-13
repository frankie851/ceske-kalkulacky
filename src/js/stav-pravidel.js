// Společný model stavu pravidel (13. 11. 2026). Čistý ES modul bez DOM – běží v prohlížeči
// i v Node (filtr Eleventy `stavStitek`, data šablon, testy).
//
// Každé pravidlo nebo sada pravidel v rules.json (a dalších datových JSON nástrojů) může mít
// pole `stav` s jednou z hodnot slovníku STAVY. Stav říká, jak pevné pravidlo je. Kvalita zdroje
// (úřední / sekundární) je jiná věc a do `stav` nepatří (viz `zdrojTyp` v mam-eet).
// Štítek se vykreslí makrem `stitek` (src/_includes/komponenty/stitky.njk) s typem z typStitku(),
// nebo v klientském skriptu funkcí stitekHtml(). Návod: docs/jak-pridat-nastroj.md.

import { datum } from './format.js';

/**
 * Slovník stavů. Pořadí = od nejpevnějšího po nejméně jisté.
 *   popisek – krátký text štítku
 *   typ     – typ makra stitek (stitky.njk)
 *   trida   – třída štítku (badge-*) pro klientské skripty
 *   ikona   – id ikony ve spritu
 *   vysvetlit – pravidlo s tímto stavem musí mít vysvětlení (poznámku nebo zdroj)
 */
const SLOVNIK = {
  plati: { popisek: 'Platí', typ: 'plati', trida: 'badge-ok', ikona: 'ikona-overeno', vysvetlit: false },
  schvaleno: { popisek: 'Schváleno', typ: 'schvaleno', trida: 'badge-ok', ikona: 'ikona-overeno', vysvetlit: false },
  navrh: { popisek: 'Návrh, zatím neschváleno', typ: 'navrh', trida: 'badge-draft', ikona: 'ikona-tuzka', vysvetlit: true },
  predbezne: { popisek: 'Předběžně', typ: 'predbezne', trida: 'badge-soon', ikona: 'ikona-hodiny', vysvetlit: true },
  odvozeno: { popisek: 'Dopočteno ze zákona', typ: 'odvozeno', trida: 'badge-plain', ikona: 'ikona-kalkulacka', vysvetlit: true },
  nejasne: { popisek: 'Nejasné', typ: 'nejasne', trida: 'badge-draft', ikona: 'ikona-vystraha', vysvetlit: false },
  neovereno: { popisek: 'Neověřeno', typ: 'neovereno', trida: 'badge-draft', ikona: 'ikona-info', vysvetlit: true },
};

/** Všechny povolené hodnoty pole `stav`. */
export const STAVY = Object.freeze(Object.keys(SLOVNIK));

/** Stavy, u kterých pravidlo musí mít vysvětlení (poznámku nebo zdroj). */
export const STAVY_S_VYSVETLENIM = Object.freeze(STAVY.filter((s) => SLOVNIK[s].vysvetlit));

/** Je hodnota ze slovníku stavů? */
export function jeStav(stav) {
  return Object.hasOwn(SLOVNIK, stav);
}

function over(stav) {
  if (!jeStav(stav)) throw new Error(`Neznámý stav pravidla: ${JSON.stringify(stav)}. Povolené: ${STAVY.join(', ')}.`);
  return SLOVNIK[stav];
}

/** Typ makra stitek pro stav (plati → 'plati', navrh → 'navrh' …). */
export function typStitku(stav) {
  return over(stav).typ;
}

/**
 * Datum, od kdy pravidlo platí (ISO), pokud ho pravidlo uvádí.
 * Čte `platnostOd`, jinak `ucinnost` nebo `ucinnostOd` (starší názvy v některých nástrojích).
 */
export function datumUcinnosti(pravidlo) {
  if (!pravidlo || typeof pravidlo !== 'object') return null;
  return pravidlo.platnostOd ?? pravidlo.ucinnost ?? pravidlo.ucinnostOd ?? null;
}

/**
 * Krátký popisek štítku. U stavu „schvaleno“ s datem: „Schváleno, platí od 1. 1. 2027“.
 * @param {string} stav
 * @param {{platnostOd?: string}} [moznosti]
 */
export function popisekStavu(stav, { platnostOd = null } = {}) {
  const s = over(stav);
  if (stav === 'schvaleno' && platnostOd && datum(platnostOd)) return `${s.popisek}, platí od ${datum(platnostOd)}`;
  return s.popisek;
}

/**
 * Stav pravidla a vše pro jeho štítek.
 * @param {object} pravidlo – objekt s polem `stav` (a volitelně platnostOd / ucinnost)
 * @returns {{stav:string, typ:string, text:string, trida:string, ikona:string, platnostOd:string|null}}
 */
export function stavPravidla(pravidlo) {
  const stav = pravidlo?.stav;
  const s = over(stav);
  const platnostOd = datumUcinnosti(pravidlo);
  return { stav, typ: s.typ, text: popisekStavu(stav, { platnostOd }), trida: s.trida, ikona: s.ikona, platnostOd };
}

const esc = (s) => String(s ?? '')
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

/**
 * HTML štítku pro klientské skripty (stejné třídy a ikony jako makro stitek).
 * @param {string|object} stavNeboPravidlo – hodnota stavu, nebo pravidlo s polem `stav`
 * @param {{text?: string, sprite?: string, li?: boolean, trida?: string}} [moznosti]
 *   text   – vlastní text (jinak popisek stavu)
 *   sprite – URL sprite.svg včetně pathPrefix; bez něj se ikona nevykreslí
 *   li     – true: <li>, jinak <span>
 *   trida  – třídy navíc
 */
export function stitekHtml(stavNeboPravidlo, { text, sprite, li = false, trida = '' } = {}) {
  const info = typeof stavNeboPravidlo === 'string'
    ? { ...SLOVNIK[stavNeboPravidlo], text: popisekStavu(stavNeboPravidlo) }
    : stavPravidla(stavNeboPravidlo);
  if (!info.typ) over(stavNeboPravidlo);
  const tag = li ? 'li' : 'span';
  const ikona = sprite
    ? `<svg class="ikona" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#${esc(info.ikona)}"/></svg>`
    : '';
  return `<${tag} class="badge ${info.trida}${trida ? ` ${esc(trida)}` : ''}">${ikona}${esc(text ?? info.text)}</${tag}>`;
}
