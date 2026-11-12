// Inflační kalkulačka – klientský modul. Čte formuláře, počítá přes inflation.js (vystup.js)
// a aktualizuje kartu výsledku, grafy a tabulku. Data indexu bere z <script id="data-cpi">
// (žádný fetch); výchozí hodnoty formulářů vykreslil build z rules.json. Hash adresy jen vybírá záložku.
import { createSeries } from './inflation.js';
import * as v from './vystup.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const series = createSeries(JSON.parse(document.getElementById('data-cpi').textContent));

const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];
const text = (sel, t) => { const el = $(sel); if (el) el.textContent = t; };

const NASTROJE = ['prepocet', 'vynos', 'mzda'];
const HASH = { prepocet: 'prepocet', vynos: 'vynos', mzda: 'mzda' };
let aktivni = 'prepocet';
const posledni = {}; // nástroj → poslední platný výsledek

/* ---------- čtení vstupů ---------- */

/** Číslo z pole: mezery pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
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
    $('.error-text', el).textContent = zprava || '';
  }
}

const mesic = (id) => `${$(`#${id}-rok`).value}-${$(`#${id}-mesic`).value}`;
function nastavMesic(id, m) {
  $(`#${id}-rok`).value = m.slice(0, 4);
  $(`#${id}-mesic`).value = m.slice(5);
}

function castkaZPole(id, { kladna = false } = {}) {
  const n = nactiCislo(id);
  if (n === null) { nastavChybu(id, 'Vyplň částku, například 10 000.'); return null; }
  if (Number.isNaN(n)) { nastavChybu(id, 'Zadej částku číslem, bez písmen.'); return null; }
  if (n < 0 || (kladna && n === 0)) { nastavChybu(id, kladna ? 'Zadej kladnou částku, větší než 0.' : 'Částka nemůže být záporná.'); return null; }
  nastavChybu(id, '');
  return n;
}

const spocitej = {
  prepocet() {
    const c = castkaZPole('castka');
    if (c === null) return null;
    return v.prepocet(series, { castka: c, od: mesic('prepocet-od'), do: mesic('prepocet-do') });
  },
  vynos() {
    const urok = nactiCislo('urok');
    let chyba = '';
    if (urok === null) chyba = 'Vyplň výnos v procentech, například 4.';
    else if (Number.isNaN(urok)) chyba = 'Zadej výnos číslem, například 4 nebo 3,5.';
    else if (urok <= -100) chyba = 'Výnos musí být větší než −100 %.';
    nastavChybu('urok', chyba);
    const typ = $('input[name="typ"]:checked')?.value || 'pa';
    if (chyba) return null;
    const r = v.vynos(series, { urok, typ, od: mesic('vynos-od'), do: mesic('vynos-do') });
    nastavChybu('vynos-do', r.chyba ? r.chyba.text : '');
    $$('#vynos-do-mesic, #vynos-do-rok').forEach((el) => {
      if (r.chyba) el.setAttribute('aria-describedby', 'vynos-do-chyba');
      else el.removeAttribute('aria-describedby');
    });
    return r.chyba ? null : r;
  },
  mzda() {
    const tehdy = castkaZPole('mzda-tehdy', { kladna: true });
    const ted = castkaZPole('mzda-ted', { kladna: true });
    if (tehdy === null || ted === null) return null;
    return v.mzda(series, { mzdaTehdy: tehdy, mzdaTed: ted, od: mesic('mzda-od'), do: mesic('mzda-do') });
  },
};

/* ---------- výstup ---------- */

let casovacOznameni = null;
function zobrazVysledek(r) {
  text('#vysledek .result-kicker', r.kicker);
  text('#vysledek-nadpis', r.nadpis);
  text('[data-vysledek-cislo]', r.cislo);
  text('[data-vysledek-popis]', r.popis);
  text('[data-vysledek-vysvetleni]', r.vysvetleni);
  const cislo = $('[data-vysledek-cislo]');
  cislo.classList.toggle('inflace-ztrata', r.ton === 'ztrata');
  text('[data-poznamka]', r.poznamky.join(' '));
  $('[data-poznamka-obal]').hidden = r.poznamky.length === 0;
  $$('#vysledek .stats > li').forEach((li, i) => {
    const s = r.statistiky[i];
    if (!s) return;
    $('b', li).textContent = s.hodnota;
    $('span', li).textContent = s.popis;
    li.classList.toggle('sage', Boolean(s.zvyraznit));
  });
  text('[data-lista-cislo]', r.lista.cislo);
  text('[data-lista-popis]', r.lista.popis);
  clearTimeout(casovacOznameni);
  casovacOznameni = setTimeout(() => text('[data-oznameni]', `${r.nadpis}: ${r.cislo}. ${r.popis}.`), 800);
}

let vykresleno = '';
function vykresliGrafy(vynutit = false) {
  const r = posledni[aktivni];
  if (!r) return;
  const obal = $('[data-graf-hladiny]');
  const sirka = Math.max(280, Math.round(obal.clientWidth || 640));
  const klic = `${r.obdobi.od}|${r.obdobi.do}|${sirka}`;
  if (!vynutit && klic === vykresleno) return;
  vykresleno = klic;
  const g = v.grafy(series, r.obdobi.od, r.obdobi.do, { sirka, vyska: sirka < 480 ? 260 : 300 });
  obal.innerHTML = g.grafHladiny;
  $('[data-graf-inflace]').innerHTML = g.grafInflace;
  $('[data-tabulka]').innerHTML = g.tabulka;
  text('[data-popis-hladiny]', g.popisHladiny);
  text('[data-popis-inflace]', g.popisInflace);
}

function prepocitej(nastroj) {
  const r = spocitej[nastroj]();
  if (r) posledni[nastroj] = r;
  if (nastroj !== aktivni) return;
  if (r) zobrazVysledek(r);
  vykresliGrafy();
}

/* ---------- záložky (role tablist, šipky, Home/End) ---------- */

const zalozky = $$('[data-zalozka]');
function vyberZalozku(nastroj, { fokus = false, hash = true } = {}) {
  aktivni = nastroj;
  for (const z of zalozky) {
    const zapnuto = z.dataset.zalozka === nastroj;
    z.setAttribute('aria-selected', String(zapnuto));
    z.tabIndex = zapnuto ? 0 : -1;
    $(`#${z.getAttribute('aria-controls')}`).hidden = !zapnuto;
    if (zapnuto && fokus) z.focus();
  }
  if (hash) history.replaceState(null, '', `#${HASH[nastroj]}`);
  prepocitej(nastroj);
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
$('[data-zalozky]').hidden = false;

/* ---------- formuláře ---------- */

for (const nastroj of NASTROJE) {
  const form = $(`#form-${nastroj}`);
  form.addEventListener('input', () => prepocitej(nastroj));
  form.addEventListener('change', () => prepocitej(nastroj));
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    prepocitej(nastroj);
    $('#vysledek').scrollIntoView({ block: 'start' });
  });
}

$('[data-prohodit-obal]').hidden = false;
$('[data-prohodit]').addEventListener('click', () => {
  const od = mesic('prepocet-od');
  nastavMesic('prepocet-od', mesic('prepocet-do'));
  nastavMesic('prepocet-do', od);
  prepocitej('prepocet');
});

let casovacSirky = null;
window.addEventListener('resize', () => {
  clearTimeout(casovacSirky);
  casovacSirky = setTimeout(() => vykresliGrafy(), 150);
});

// Výsledky všech nástrojů spočítáme hned, ať je přepnutí záložky okamžité.
for (const n of NASTROJE) posledni[n] = spocitej[n]() || posledni[n];
const zHashe = Object.keys(HASH).find((n) => `#${HASH[n]}` === location.hash);
vyberZalozku(zHashe || 'prepocet', { hash: Boolean(zHashe) });
