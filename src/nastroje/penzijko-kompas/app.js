// Penzijko kompas – klientský modul. Čte formulář, počítá (calc.js přes zobrazeni.js) a překresluje
// výsledky. Pravidla bere z <script type="application/json" id="pravidla">, žádný fetch.
// Žádné částky ani sazby natvrdo: vše jde z rules.json.
import { vypocet, doPole } from './zobrazeni.js';

const PROCENT = 100;
const CISELNA = ['vek', 'delkaSmlouvy', 'vklad', 'zamestnavatel', 'zustatek', 'sprava', 'zhodnoceni'];
const CELA = new Set(['vek', 'delkaSmlouvy']);
const PROCENTNI = new Set(['sprava', 'zhodnoceni']);
const CHYBY = {
  vek: 'Zadej věk v celých letech, například 35.',
  delkaSmlouvy: 'Zadej délku smlouvy v celých letech. U nové smlouvy napiš 0.',
  vklad: 'Zadej měsíční vklad v korunách. Když zatím nespoříš, napiš 0.',
  zamestnavatel: 'Zadej příspěvek zaměstnavatele v korunách. Když nepřispívá, napiš 0.',
  zustatek: 'Zadej naspořenou částku v korunách. Když začínáš, napiš 0.',
  sprava: 'Zadej poplatek v procentech, například 0,8.',
  zhodnoceni: 'Zadej poplatek v procentech, například 10.',
};

const $ = (sel, el = document) => el.querySelector(sel);
const form = document.getElementById('kompas-formular');
const pravidlaEl = document.getElementById('pravidla');

/** Přečte číslo z pole: { hodnota } | { prazdne: true } | { chyba: true }. Bere mezery i desetinnou čárku. */
function precti(id) {
  const surove = String(form.elements[id].value).replace(/[\s  ]/g, '').replace(',', '.');
  if (surove === '') return { prazdne: true };
  if (!/^\d+(\.\d+)?$/.test(surove)) return { chyba: true };
  const n = Number(surove);
  if (!Number.isFinite(n)) return { chyba: true };
  if (CELA.has(id) && !Number.isInteger(n)) return { chyba: true };
  if (PROCENTNI.has(id) && n > PROCENT) return { chyba: true };
  return { hodnota: n };
}

/** Chybový stav pole (třídy a atributy z makra pole s chybaMisto). */
function nastavChybu(id, text) {
  const el = form.elements[id];
  const pole = el.closest('.field');
  const zprava = document.getElementById(`${id}-chyba`);
  if (!pole || !zprava) return;
  pole.classList.toggle('is-error', Boolean(text));
  zprava.hidden = !text;
  if (text) {
    el.setAttribute('aria-invalid', 'true');
    $('.error-text', zprava).textContent = text;
  } else {
    el.removeAttribute('aria-invalid');
  }
}

/** Zkontroluje jedno pole. Prázdné pole je chyba až po opuštění pole (change), ne při psaní. */
function zkontroluj(id, prisne) {
  const r = precti(id);
  if (r.chyba || (r.prazdne && prisne)) nastavChybu(id, CHYBY[id]);
  else nastavChybu(id, '');
}

/** Vstup pro výpočet, nebo null, když některé pole není platně vyplněné. */
function vstup() {
  const h = {};
  for (const id of CISELNA) {
    const r = precti(id);
    if (r.hodnota === undefined) return null;
    h[id] = r.hodnota;
  }
  const ted = new Date();
  return {
    vek: h.vek,
    delkaSmlouvy: h.delkaSmlouvy,
    vklad: h.vklad,
    zamestnavatel: h.zamestnavatel,
    zustatek: h.zustatek,
    fond: form.elements.fond.value,
    poplatky: { sprava: h.sprava, zhodnoceni: h.zhodnoceni },
    duchodce: form.elements.duchodce.checked,
    sada: form.elements.sada.value,
    start: { rok: ted.getFullYear(), mesic: ted.getMonth() + 1 },
  };
}

function predvyplnPoplatky(pravidla) {
  const f = pravidla.fondy[form.elements.fond.value];
  if (!f) return;
  form.elements.sprava.value = doPole(f.sprava);
  form.elements.zhodnoceni.value = doPole(f.zhodnoceni);
  nastavChybu('sprava', '');
  nastavChybu('zhodnoceni', '');
}

const grafy = () => $('[data-grafy]');
function sirkaGrafu() {
  const el = grafy();
  const sirka = el && !el.hidden ? Math.floor(el.clientWidth) : 0;
  return sirka > 0 ? sirka : undefined;
}

function nastavText(sel, text, el = document) {
  const cil = $(sel, el);
  if (cil) cil.textContent = text;
}

function nastavHtml(sel, html) {
  const cil = $(sel);
  if (cil) cil.innerHTML = html;
}

/** Překreslí stránku a vrátí šířku, na kterou se kreslily grafy. */
function vykresli(pravidla, v) {
  const sirka = sirkaGrafu();
  const m = vypocet(pravidla, v, { sirka });

  // Stát ti přidá
  nastavText('#vysledek .result-kicker', 'Tvůj výsledek');
  nastavText('[data-vysledek-cislo]', m.hlavni.cislo);
  nastavText('[data-vysledek-popis]', m.hlavni.popis);
  nastavText('[data-hlavni-sada]', `Počítáno podle: ${m.hlavni.sada}`);
  const navrh = $('[data-hlavni-navrh]');
  if (navrh) navrh.hidden = !m.hlavni.navrh;
  for (const p of m.prispevky) {
    const karta = document.querySelector(`[data-sada="${CSS.escape(p.klic)}"]`);
    if (!karta) continue;
    karta.classList.toggle('is-vybrana', p.klic === v.sada);
    nastavText('[data-mesicne]', p.mesicne, karta);
    nastavText('[data-rocne]', p.rocne, karta);
    nastavText('[data-vysvetleni]', p.vysvetleni, karta);
  }
  nastavText('[data-odpocet]', m.odpocet);

  // Kolik budeš mít v 65
  nastavHtml('[data-projekce]', m.html.projekce);
  const g = grafy();
  if (g) g.hidden = !m.maProjekci;
  nastavHtml('[data-graf="realne"]', m.html.grafRealne);
  nastavHtml('[data-graf="nominal"]', m.html.grafNominal);
  nastavHtml('[data-tabulka]', m.html.tabulka);

  // Poplatky, transformovaný fond, kroky
  nastavHtml('[data-poplatky]', m.html.poplatky);
  const tf = $('[data-karta-tf]');
  if (tf) tf.hidden = !m.maTF;
  nastavHtml('[data-tf]', m.html.tf);
  nastavHtml('[data-kroky]', m.html.kroky);
  nastavText('[data-kroky-sada]', `Podle: ${m.hlavni.sada}`);

  // Lepivá lišta a shrnutí kroků formuláře
  nastavText('[data-lista-cislo]', m.hlavni.cislo);
  nastavText('[data-lista-popis]', m.hlavni.lista);
  nastavText('#krok-o-tobe .step-sum', m.shrnuti.oTobe);
  nastavText('#krok-penzijko .step-sum', m.shrnuti.penzijko);
  return sirka;
}

function init() {
  const pravidla = JSON.parse(pravidlaEl.textContent);
  let posledni = null;
  let sirka;

  // Když se grafy právě odkryly (nebo změnily šířku), nakreslí se znovu na skutečnou šířku kontejneru.
  const kresli = (v) => {
    sirka = vykresli(pravidla, v);
    if (sirkaGrafu() !== sirka) sirka = vykresli(pravidla, v);
  };
  const prepocet = () => {
    const v = vstup();
    if (!v) return;
    posledni = v;
    kresli(v);
  };

  form.addEventListener('input', (e) => {
    const id = e.target.name;
    if (id === 'fond') predvyplnPoplatky(pravidla);
    if (CISELNA.includes(id)) zkontroluj(id, false);
    prepocet();
  });
  form.addEventListener('change', (e) => {
    const id = e.target.name;
    if (id === 'fond') {
      predvyplnPoplatky(pravidla);
      prepocet();
    }
    if (CISELNA.includes(id)) zkontroluj(id, true);
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    for (const id of CISELNA) zkontroluj(id, true);
    prepocet();
  });

  // Grafy na šířku kontejneru (text v SVG pak má skutečnou velikost)
  let ceka = false;
  window.addEventListener('resize', () => {
    if (ceka) return;
    ceka = true;
    requestAnimationFrame(() => {
      ceka = false;
      if (posledni && sirkaGrafu() !== sirka) kresli(posledni);
    });
  });

  const vysledek = $('#vysledek .result-top');
  if (vysledek) vysledek.setAttribute('aria-live', 'polite');
  prepocet();
}

if (form && pravidlaEl) init();
