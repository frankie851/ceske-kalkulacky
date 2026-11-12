// Plán48 – klientský modul. Čte formulář, počítá přes calc.js a aktualizuje stránku.
// Pravidla bere z <script type="application/json" id="pravidla"> (žádný fetch).
// Žádné částky ani sazby tu nejsou natvrdo: všechno je v rules.json.
import { spocitejRok, projekce, najdiPasmo } from './calc.js';
import * as v from './vystup.js';
import { kc, procenta } from '../../js/format.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const pravidla = JSON.parse(document.getElementById('pravidla').textContent);
const formular = document.getElementById('plan48-formular');
const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];

/* ---------- čtení a kontrola vstupů ---------- */

/** Číslo z textového pole: mezery pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
function nactiCislo(id) {
  return prectiCislo($(`#${id}`).value);
}

function nastavChybu(id, text) {
  const pole = $(`#${id}`);
  const obal = pole.closest('.field');
  const zprava = $(`#${id}-chyba`);
  obal.classList.toggle('is-error', Boolean(text));
  if (text) pole.setAttribute('aria-invalid', 'true');
  else pole.removeAttribute('aria-invalid');
  if (zprava) {
    zprava.hidden = !text;
    $('.error-text', zprava).textContent = text || '';
  }
}

function vybrane(nazev) {
  return formular.querySelector(`input[name="${nazev}"]:checked`)?.value;
}

function aktualniSada() {
  const klic = vybrane('sada');
  return pravidla.sady[klic] ? klic : pravidla.vychozi.sada;
}

/** Vrátí { vstup, chyby } pro výpočet roku. */
function nactiVstup(sada) {
  let chyby = 0;
  const vek = nactiCislo('vek');
  if (vek === null) { nastavChybu('vek', 'Vyplň věk. Podle něj poznáme, jaký státní příspěvek ti náleží.'); chyby++; }
  else if (!Number.isInteger(vek) || vek < 0 || vek > 120) { nastavChybu('vek', 'Zadej věk v celých letech, například 35.'); chyby++; }
  else nastavChybu('vek', '');

  const castky = {};
  for (const id of ['dps', 'dip', 'zp', 'zamestnavatel']) {
    const n = nactiCislo(id);
    if (Number.isNaN(n)) { nastavChybu(id, 'Zadej částku číslem, bez písmen.'); chyby++; }
    else if (n !== null && n < 0) { nastavChybu(id, 'Částka nemůže být záporná. Zadej 0 nebo víc.'); chyby++; }
    else nastavChybu(id, '');
    castky[id] = n > 0 ? n : 0;
  }

  const procento = Number(vybrane('sazba'));
  const sazbaDane = sada.sazbyDane.find((s) => Math.round(s * 100) === procento) ?? sada.sazbyDane[0];

  return {
    chyby,
    vstup: {
      vek: vek ?? 0,
      sazbaDane,
      ...castky,
      mesicuProbehlo: Number($('#mesicu').value) || 0,
      starobniDuchod: vybrane('duchod') === 'ano',
    },
  };
}

/** Výnos a poplatek pro projekci (podíl, ne procenta). Chyba → null. */
function nactiProjekci() {
  const vynos = nactiCislo('vynos');
  const poplatek = nactiCislo('poplatek');
  let ok = true;
  if (vynos === null || Number.isNaN(vynos)) { nastavChybu('vynos', 'Zadej výnos v procentech, například 5.'); ok = false; }
  else nastavChybu('vynos', '');
  if (poplatek === null || Number.isNaN(poplatek)) { nastavChybu('poplatek', 'Zadej poplatek v procentech.'); ok = false; }
  else if (poplatek < 0) { nastavChybu('poplatek', 'Poplatek nemůže být záporný.'); ok = false; }
  else nastavChybu('poplatek', '');
  return ok ? { vynos: vynos / 100, poplatek: poplatek / 100, vekKonec: pravidla.vychozi.vekKonec } : null;
}

/* ---------- pomocné úpravy stránky ---------- */

function text(sel, hodnota) {
  for (const el of $$(sel)) el.textContent = hodnota;
}

/** Přepíše text za skrytým „V jednotkách …“ v nápovědě pole. */
function nastavNapovedu(id, hodnota) {
  const el = $(`#${id}-napoveda`);
  if (!el) return;
  const posledni = el.lastChild;
  if (posledni && posledni.nodeType === Node.TEXT_NODE) posledni.textContent = hodnota;
  else el.append(hodnota);
}

/** Štítek návrhu u přepínače i ve výsledku. */
function nastavStitek(sada) {
  const stitek = v.stitekSady(sada);
  for (const el of $$('[data-stitek-sady]')) {
    el.hidden = !stitek;
    if (!stitek) continue;
    const badge = $('.badge', el);
    const uzel = [...badge.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE);
    if (uzel) uzel.textContent = stitek;
  }
}

/** Když má sada jiné sazby daně, přestaví přepínač sazby. */
function zajistiSazby(sada) {
  const skupina = $('input[name="sazba"]').closest('.seg');
  const hodnoty = sada.sazbyDane.map((s) => String(Math.round(s * 100)));
  const ted = $$('input[name="sazba"]', skupina).map((i) => i.value);
  if (hodnoty.join() === ted.join()) return;
  const vybrano = hodnoty.includes(vybrane('sazba')) ? vybrane('sazba') : hodnoty[0];
  skupina.replaceChildren(...hodnoty.flatMap((h) => {
    const input = Object.assign(document.createElement('input'), { type: 'radio', name: 'sazba', id: `sazba-${h}`, value: h, checked: h === vybrano });
    const label = Object.assign(document.createElement('label'), { htmlFor: `sazba-${h}`, textContent: procenta(Number(h)) });
    return [input, label];
  }));
  nastavNapovedu('sazba', `${procenta(Number(hodnoty.at(-1)))} jen pro vysoké příjmy (část nad 36násobek průměrné mzdy).`);
}

/* ---------- vykreslení ---------- */

let posledniProjekce = null;
let oznameniCasovac = null;

function vykresliProjekci() {
  if (!posledniProjekce) return;
  const { body, vekKonec } = posledniProjekce;
  const obal = $('[data-graf-projekce]');
  const sirka = Math.max(280, Math.round(obal.clientWidth || 640));
  const { graf, tabulka } = v.grafProjekce(body, { sirka, vyska: sirka < 480 ? 280 : 320 });
  text('[data-projekce-shrnuti]', v.shrnutiProjekce(body, vekKonec));
  obal.innerHTML = graf;
  $('[data-tabulka-projekce]').innerHTML = tabulka;
  $('[data-projekce-tabulka-obal]').hidden = !tabulka;
}

function prepocitej() {
  const sada = pravidla.sady[aktualniSada()];
  zajistiSazby(sada);
  nastavStitek(sada);
  const { vstup, chyby } = nactiVstup(sada);
  const parametry = nactiProjekci();
  if (chyby) return;

  const r = spocitejRok(vstup, sada);
  const o = r.odpocet;

  // Formulář: shrnutí kroků a nápověda k penzijku podle pravidel
  const s = v.shrnutiKroku(vstup, sada);
  text('#krok-o-tobe .step-sum', s.oTobe);
  text('#krok-vklady .step-sum', s.vklady);
  nastavNapovedu('dps', `Do odpočtu jde jen část nad ${kc(sada.odpocet.dpsMesicniHranice)} měsíčně. Na maximální státní příspěvek stačí ${kc(najdiPasmo(vstup.vek, sada).maxZaklad)}.`);

  // Karta výsledku
  text('#vysledek .result-kicker', `Počítáme podle: ${sada.nazev}`);
  text('[data-vysledek-cislo]', kc(o.vyuzity));
  text('[data-vysledek-vysvetleni]', v.vysvetleni(r));
  const stat = v.statistiky(vstup, r, sada);
  $$('#vysledek .stats > li').forEach((li, i) => {
    if (!stat[i]) return;
    $('b', li).textContent = stat[i].hodnota;
    $('span', li).textContent = stat[i].popis;
    li.classList.toggle('sage', Boolean(stat[i].zvyraznit));
  });
  text('[data-akce]', v.vetaCoUdelat(r.doporuceni, o.limit));
  const poznamka = v.poznamkaCoUdelat(r.doporuceni, pravidla.vychozi);
  text('[data-akce-poznamka]', poznamka);
  $('[data-akce-poznamka-obal]').hidden = !poznamka;
  text('[data-lista-cislo]', kc(o.vyuzity));

  // Limit
  const limit = v.grafLimitu(o);
  text('[data-komentar-limitu]', v.komentarLimitu(o));
  $('[data-graf-limitu]').innerHTML = limit.graf;
  $('[data-tabulka-limitu]').innerHTML = limit.tabulka;

  // Návrh
  const navrh = v.textyNavrhu(vstup, pravidla);
  if (navrh) text('[data-navrh-pro-tebe]', navrh.proTebe);

  // Projekce
  if (parametry) {
    posledniProjekce = { body: projekce(vstup, sada, parametry), vekKonec: parametry.vekKonec };
    vykresliProjekci();
  }

  // Oznámení pro čtečky (se zpožděním, ať se nečte každé písmeno)
  clearTimeout(oznameniCasovac);
  oznameniCasovac = setTimeout(() => {
    text('[data-oznameni]', `Odpočet ${kc(o.vyuzity)}, daňová úspora ${kc(r.uspora)}, státní příspěvek ${kc(r.statniPrispevekRocne)} za rok.`);
  }, 800);
}

/* ---------- start ---------- */

formular.addEventListener('input', prepocitej);
formular.addEventListener('change', prepocitej);
for (const id of ['vynos', 'poplatek']) $(`#${id}`).addEventListener('input', prepocitej);
formular.addEventListener('submit', (e) => {
  e.preventDefault();
  prepocitej();
  $('#vysledek').scrollIntoView({ block: 'start' });
});
const akce = $('.plan48-akce-formulare');
if (akce) akce.hidden = false;

let sirkaGrafu = $('[data-graf-projekce]').clientWidth;
let casovacSirky = null;
window.addEventListener('resize', () => {
  clearTimeout(casovacSirky);
  casovacSirky = setTimeout(() => {
    const w = $('[data-graf-projekce]').clientWidth;
    if (w !== sirkaGrafu) { sirkaGrafu = w; vykresliProjekci(); }
  }, 150);
});

prepocitej();
