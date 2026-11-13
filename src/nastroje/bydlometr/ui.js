// Bydlometr – klientský modul. Čte formuláře, počítá přes vystup.js (js/mortgage.js, js/rentbuy.js)
// a aktualizuje výsledky. Pravidla bere z <script id="pravidla">, výchozí data z <script id="data-bydlometr">
// (žádný fetch). Výsledky, tabulky a graf vykreslil už build: tady se jen přepisují čísla, takže stránka
// po načtení neposkočí. Graf se překreslí do stejného rámečku (pevný poměr stran v CSS).
// Hash adresy jen vybírá záložku (#refixace, #najem-vs-koupe). Nic se neukládá ani neodesílá.
import * as v from './vystup.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const data = {
  pravidla: JSON.parse(document.getElementById('pravidla').textContent),
  defaults: JSON.parse(document.getElementById('data-bydlometr').textContent),
};

const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];
const text = (el, t) => { if (el && el.textContent !== t) el.textContent = t; };

/* ---------- HTML bez zbytečného překreslení ---------- */

// Poslední vložené HTML pro každý kontejner. Předvyplní se HTML, které vykreslil build pro výchozí
// vstupy (stejný kód), takže se při načtení stránky nic nevymění.
const posledniHtml = new Map();
function nastavHtml(el, html) {
  if (!el || posledniHtml.get(el) === html) return;
  posledniHtml.set(el, html);
  el.innerHTML = html;
}

/* ---------- čtení a kontrola polí ---------- */

function nactiCislo(id) {
  return prectiCislo($(`#${id}`).value);
}

function nastavChybu(id, zprava) {
  const pole = $(`#${id}`);
  const obal = pole?.closest('.field');
  const el = $(`#${id}-chyba`);
  if (obal) obal.classList.toggle('is-error', Boolean(zprava));
  if (pole) {
    if (zprava) pole.setAttribute('aria-invalid', 'true');
    else pole.removeAttribute('aria-invalid');
  }
  if (el) {
    el.hidden = !zprava;
    text($('.error-text', el), zprava || '');
  }
}

/** Přečte pole podle konfigurace z vystup.js (kontrola je čistá funkce v.zkontrolujPole). */
function nactiPole(seznam) {
  const texty = Object.fromEntries(seznam.map((p) => [p.id, $(`#${p.id}`).value]));
  const { vstup, chyby } = v.zkontrolujPole(seznam, texty, data.pravidla);
  const podle = new Map(chyby.map((c) => [c.id, c.zprava]));
  for (const p of seznam) nastavChybu(p.id, podle.get(p.id) || '');
  return { vstup, chyby };
}

/** Při chybě ve formuláři výsledky skryje a ukáže hlášku (BYD-03). Vrací true, když je vstup platný. */
function stavPanelu(prefix, chyby) {
  const stav = v.stavVysledku(chyby);
  const hlaska = $(`[data-neplatne="${prefix}"]`);
  text(hlaska, stav.zprava);
  hlaska.hidden = stav.platny;
  $(prefix === 'rf' ? '#vysledek' : '#vysledek-najem').hidden = !stav.platny;
  for (const el of $$(`[data-vysledky="${prefix}"]`)) el.hidden = !stav.platny;
  if (!stav.platny) {
    lista[prefix === 'rf' ? 'refixace' : 'najem'] = { cislo: '–', popis: 'Oprav zadání' };
    aktualizujListu();
  }
  return stav.platny;
}

/* ---------- výsledková karta ---------- */

const casovace = new Map();
function zobrazVysledek(id, r) {
  const karta = $(`#${id}`);
  text($('.result-kicker', karta), r.kicker);
  text($(`#${id}-nadpis`), r.nadpis);
  text($('[data-vysledek-cislo]', karta), r.cislo);
  text($('[data-vysledek-popis]', karta), r.popis);
  text($('[data-vysledek-vysvetleni]', karta), r.vysvetleni);
  $$('.stats > li', karta).forEach((li, i) => {
    const s = r.statistiky[i];
    if (!s) return;
    text($('b', li), s.hodnota);
    text($('span', li), s.popis);
    li.classList.toggle('sage', Boolean(s.zvyraznit));
  });
  clearTimeout(casovace.get(id));
  casovace.set(id, setTimeout(() => text($('[data-oznameni]', karta), `${r.nadpis}. ${r.cislo}, ${r.popis}.`), 800));
}

function shrnuti(prefix, s) {
  for (const [k, t] of Object.entries(s)) text($(`#${prefix}-krok-${k} .step-sum`), t);
}

/* ---------- lepivá lišta (podle vybrané záložky) ---------- */

const lista = { refixace: null, najem: null };
let aktivni = 'refixace';
function aktualizujListu() {
  const l = lista[aktivni];
  if (!l) return;
  text($('[data-lista-cislo]'), l.cislo);
  text($('[data-lista-popis]'), l.popis);
  const odkaz = $('.lepiva-lista a');
  if (odkaz) odkaz.setAttribute('href', aktivni === 'najem' ? '#vysledek-najem' : '#vysledek');
}

/* ---------- Refixace ---------- */

function prepocitejRefixaci() {
  const { vstup, chyby } = nactiPole(v.POLE_REFIXACE);
  if (!stavPanelu('rf', chyby)) return;
  vstup.pre2021 = Boolean($('input[name="rf-volby"][value="pred2021"]')?.checked);
  const r = v.refixace(vstup, data.pravidla);
  zobrazVysledek('vysledek', r.vysledek);
  nastavHtml($('[data-tabulka-variant]'), r.tabulkaVariant);
  nastavHtml($('[data-poznamky]'), r.poznamky.map((t) => `<li>${escText(t)}</li>`).join(''));
  text($('[data-uvod-stresu]'), r.uvodStresu);
  nastavHtml($('[data-tabulka-stresu]'), r.tabulkaStresu);
  text($('[data-poznamka-zateze]'), r.poznamkaZateze);
  shrnuti('rf', r.shrnuti);
  lista.refixace = r.lista;
  aktualizujListu();
}

const escText = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ---------- Poplatek za mimořádnou splátku ---------- */

let casovacPoplatku = null;
function prepocitejPoplatek() {
  const { vstup, chyby } = nactiPole(v.POLE_POPLATEK);
  for (const p of v.DATA_POPLATKU) {
    const hodnota = $(`#${p.id}`).value;
    const ok = /^\d{4}-\d{2}-\d{2}$/.test(hodnota);
    nastavChybu(p.id, ok ? '' : 'Vyplň datum.');
    if (ok) vstup[p.klic] = hodnota;
    else chyby.push({ id: p.id, label: p.label, zprava: 'Vyplň datum.' });
  }
  const stav = v.stavVysledku(chyby);
  $('#pp-vysledek').classList.toggle('bm-neplatne-vysledek', !stav.platny);
  if (!stav.platny) {
    text($('[data-poplatek-popis]'), 'Poplatek');
    text($('[data-poplatek-cislo]'), '–');
    text($('[data-poplatek-duvod]'), stav.zprava);
    return;
  }
  vstup.freeUsedThisYear = Boolean($('input[name="pp-volby"][value="vyuzito"]')?.checked);
  const r = v.poplatek(vstup, data.pravidla);
  text($('[data-poplatek-popis]'), r.popis);
  text($('[data-poplatek-cislo]'), r.cislo);
  text($('[data-poplatek-duvod]'), r.duvod);
  clearTimeout(casovacPoplatku);
  casovacPoplatku = setTimeout(() => text($('[data-poplatek-oznameni]'), `${r.popis} ${r.cislo}.`), 800);
}

/* ---------- Nájem vs. koupě ---------- */

const mesto = () => $('#nk-mesto').value;
let danUpravena = false;

function nastavNapovedu(id, t) {
  const el = $(`#${id}-napoveda`);
  if (!el) return;
  const uzel = el.lastChild;
  if (uzel && uzel.nodeType === Node.TEXT_NODE) { if (uzel.nodeValue !== t) uzel.nodeValue = t; } else el.append(t);
}

function predvyplnMesto() {
  for (const p of v.POLE_NAJEM.filter((q) => q.zdroj.startsWith('mesto:') && q.id !== 'nk-dan')) {
    $(`#${p.id}`).value = v.textPole(p, v.vychoziHodnota(p, data, mesto()));
    nastavNapovedu(p.id, v.napovedaPole(p, data, mesto()));
  }
  danUpravena = false;
  prepocitejDan();
}

function prepocitejDan() {
  if (danUpravena) return;
  const plocha = nactiCislo('nk-plocha');
  const p = v.POLE_NAJEM.find((q) => q.id === 'nk-dan');
  $('#nk-dan').value = v.textPole(p, v.danZNemovitosti(data, mesto(), plocha));
}

let posledniNajem = null;
function prepocitejNajem() {
  const { vstup, chyby } = nactiPole(v.POLE_NAJEM);
  if (!stavPanelu('nk', chyby)) return;
  vstup.city = mesto();
  vstup.taxRate = Number($('#nk-sazba-dane').value);
  vstup.deductInterest = Boolean($('input[name="nk-volby"][value="odpocet"]')?.checked);
  vstup.investment = Boolean($('input[name="nk-volby"][value="investicni"]')?.checked);
  const r = v.najem(vstup, data.pravidla);
  posledniNajem = vstup;
  zobrazVysledek('vysledek-najem', r.vysledek);
  const varovani = $('[data-varovani]');
  nastavHtml(varovani, r.varovani.map((t) => `<li>${ikonaVystrahy}<span>${escText(t)}</span></li>`).join(''));
  varovani.hidden = r.varovani.length === 0;
  // Úvěr nad limitem LTV: porovnání se nepočítá, statistiky, graf a tabulky se skryjí (BYD-05)
  $('#vysledek-najem .stats').hidden = !r.platny;
  for (const el of $$('[data-nk-detail]')) el.hidden = !r.platny;
  if (!r.platny) {
    shrnuti('nk', v.shrnutiNajmu(vstup, data));
    lista.najem = r.lista;
    aktualizujListu();
    posledniNajem = null;
    return;
  }
  nastavHtml($('[data-tabulka-let]'), r.tabulkaLet);
  text($('[data-uvod-citlivosti]'), r.uvodCitlivosti);
  nastavHtml($('[data-tabulka-citlivosti]'), r.tabulkaCitlivosti);
  shrnuti('nk', v.shrnutiNajmu(vstup, data));
  lista.najem = r.lista;
  aktualizujListu();
  vykresliGraf();
}

// Ikona výstrahy ze spritu (stejná jako ve varování z buildu)
const ikonaVystrahy = (() => {
  const vzor = $('.bydlometr svg.ikona use') || $('svg.ikona use');
  const href = vzor ? vzor.getAttribute('href').replace(/#.*$/, '#ikona-vystraha') : '';
  return href ? `<svg class="ikona" aria-hidden="true" focusable="false"><use href="${href}"/></svg>` : '';
})();

/** Graf čistého jmění: překreslí se do rozměru, který má SVG na stránce (poměr stran drží CSS). */
const klicVstupu = (o) => JSON.stringify(Object.keys(o).sort().map((k) => [k, o[k]]));
let klicGrafu = '';
function vykresliGraf() {
  if (aktivni !== 'najem' || !posledniNajem) return;
  if ($('[data-nk-detail]')?.hidden) return;
  const obal = $('[data-graf]');
  const svg = $('svg', obal);
  const box = svg?.getBoundingClientRect();
  if (!box || box.width < 50) return;
  const sirka = Math.round(box.width);
  const vyska = Math.round(box.height);
  const klic = `${sirka}x${vyska}|${klicVstupu(posledniNajem)}`;
  if (klic === klicGrafu) return;
  klicGrafu = klic;
  const res = v.najem(posledniNajem, data.pravidla, { sirka, vyska });
  obal.innerHTML = res.graf;
}

/* ---------- záložky (role tablist, šipky, Home/End) ---------- */

const koren = $('[data-bydlometr]');
const zalozky = $$('[data-zalozka]');
const HASH = { refixace: 'refixace', najem: 'najem-vs-koupe' };

function vyberZalozku(nazev, { fokus = false, hash = true } = {}) {
  aktivni = nazev;
  koren.dataset.aktivni = nazev;
  for (const z of zalozky) {
    const zapnuto = z.dataset.zalozka === nazev;
    z.setAttribute('aria-selected', String(zapnuto));
    z.tabIndex = zapnuto ? 0 : -1;
    $(`#${z.getAttribute('aria-controls')}`).hidden = !zapnuto;
    if (zapnuto && fokus) z.focus();
  }
  if (hash && location.hash !== `#${HASH[nazev]}`) history.replaceState(null, '', `#${HASH[nazev]}`);
  aktualizujListu();
  vykresliGraf();
}

for (const [i, z] of zalozky.entries()) {
  const panel = $(`#${z.getAttribute('aria-controls')}`);
  panel.setAttribute('role', 'tabpanel');
  panel.setAttribute('aria-labelledby', z.id);
  z.addEventListener('click', () => vyberZalozku(z.dataset.zalozka));
  z.addEventListener('keydown', (e) => {
    const n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: zalozky.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    vyberZalozku(zalozky[(n + zalozky.length) % zalozky.length].dataset.zalozka, { fokus: true });
  });
}

const zHashe = () => Object.keys(HASH).find((k) => `#${HASH[k]}` === location.hash);
window.addEventListener('hashchange', () => { const k = zHashe(); if (k && k !== aktivni) vyberZalozku(k, { hash: false }); });

/* ---------- formuláře ---------- */

function napoj(id, fn) {
  const form = $(`#${id}`);
  form.addEventListener('input', fn);
  form.addEventListener('change', fn);
  form.addEventListener('submit', (e) => { e.preventDefault(); fn(); });
}
napoj('form-refixace', prepocitejRefixaci);
napoj('form-poplatek', prepocitejPoplatek);
$('#nk-mesto').addEventListener('change', predvyplnMesto);
$('#nk-plocha').addEventListener('input', prepocitejDan);
$('#nk-dan').addEventListener('input', () => { danUpravena = true; });
napoj('form-najem', prepocitejNajem);

let casovacSirky = null;
window.addEventListener('resize', () => {
  clearTimeout(casovacSirky);
  casovacSirky = setTimeout(vykresliGraf, 150);
});

/* ---------- start ---------- */

// HTML z buildu pro výchozí vstupy – stejný kód, takže se při startu nic nepřekreslí.
{
  const rf = v.refixace(v.vychoziRefixace(data), data.pravidla);
  const nk = v.najem(v.vychoziNajem(data), data.pravidla);
  posledniHtml.set($('[data-tabulka-variant]'), rf.tabulkaVariant);
  posledniHtml.set($('[data-tabulka-stresu]'), rf.tabulkaStresu);
  posledniHtml.set($('[data-poznamky]'), rf.poznamky.map((t) => `<li>${escText(t)}</li>`).join(''));
  posledniHtml.set($('[data-tabulka-let]'), nk.tabulkaLet);
  posledniHtml.set($('[data-tabulka-citlivosti]'), nk.tabulkaCitlivosti);
  if (!nk.varovani.length) posledniHtml.set($('[data-varovani]'), '');
  klicGrafu = `640x320|${klicVstupu(v.vychoziNajem(data))}`;
}

// Prohlížeč mohl po návratu na stránku obnovit jiné hodnoty polí – proto se vše spočítá hned.
prepocitejRefixaci();
prepocitejPoplatek();
prepocitejNajem();
const k = zHashe();
vyberZalozku(k || 'refixace', { hash: Boolean(k) });
