// Spot, nebo fix? – klientský modul. Čte formulář, počítá přes vystup.js (calc.js) a aktualizuje
// výsledek, grafy a tabulky. Výsledek z buildu zůstává na místě, JS jen mění čísla a obsah grafů
// (grafy mají pevný poměr stran), takže stránka po načtení neposkočí.
// Data: ceny, kurzy, tarify a pásma jsou vložené ve stránce (<script type="application/json">).
// Profil spotřeby (TDD) si stáhneme jen pro zvolenou třídu z vlastního webu (./data/tdd/<třída>.json).
// Těžší příprava (časová mřížka 35 040 čtvrthodin) proběhne až při první interakci.
// Nahrané CSV se čte přes FileReader jen v prohlížeči a nikam se neodesílá.
import * as v from './vystup.js';
import { parseCsv, profileFromCsv, normalize, sum } from './calc.js';
import { cislo } from '../../js/format.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];
const json = (id) => JSON.parse(document.getElementById(id).textContent);
const text = (sel, t, koren = document) => { const el = $(sel, koren); if (el) el.textContent = t; };

const pravidla = json('pravidla');
const tarify = json('data-tarify');
const dynamicky = json('data-dynamicky');
const formular = $('#spot-formular');
const vysledekEl = $('#vysledek');

/* ---------- data (líně) ---------- */

let priprava = null;
/** Časová mřížka, ceny a kurzy – jednou, při první interakci. */
function priprav() {
  if (!priprava) {
    priprava = new Promise((hotovo) => setTimeout(hotovo, 0)).then(() => v.pripravData({
      ceny: json('data-ceny'), kurzy: json('data-kurzy'), meta: json('data-meta'), tarify, dynamicky,
    }));
  }
  return priprava;
}

const tddCache = new Map();
/** Profil TDD jedné třídy z vlastního webu (vedle tohoto modulu, nastroj.json → verejneSoubory). */
function nactiTdd(klic) {
  if (!tddCache.has(klic)) {
    const url = new URL(`./data/tdd/${encodeURIComponent(klic)}.json`, import.meta.url);
    tddCache.set(klic, fetch(url).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    }).then((j) => j.values).catch((e) => { tddCache.delete(klic); throw e; }));
  }
  return tddCache.get(klic);
}

/* ---------- čtení a kontrola vstupů ---------- */

/** Číslo z pole: mezery pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
function nactiCislo(id) {
  return prectiCislo($(`#${id}`).value);
}

function nastavChybu(id, zprava) {
  const pole = $(`#${id}`);
  const el = $(`#${id}-chyba`);
  pole.closest('.field')?.classList.toggle('is-error', Boolean(zprava));
  if (zprava) pole.setAttribute('aria-invalid', 'true');
  else pole.removeAttribute('aria-invalid');
  if (el) {
    el.hidden = !zprava;
    $('.error-text', el).textContent = zprava || '';
  }
}

function cisloZPole(id, { min = 0, max = Infinity, prazdne, nesmysl, rozsah }) {
  const n = nactiCislo(id);
  let chyba = '';
  if (n === null) chyba = prazdne;
  else if (Number.isNaN(n)) chyba = nesmysl;
  else if (n < min || n > max) chyba = rozsah;
  nastavChybu(id, chyba);
  return chyba ? null : n;
}

const cena = (id, priklad) => cisloZPole(id, {
  max: 100000,
  prazdne: `Vyplň částku, například ${priklad}.`,
  nesmysl: 'Zadej částku číslem, bez písmen.',
  rozsah: 'Zadej částku od 0 do 100 000.',
});

let mereni = null; // { cons, matched, coverage, measuredMWh, interval } z CSV
let mwhPredMerenim = null; // co bylo v poli „Roční spotřeba“ před použitím měření (vrátí ho „Zpět“)

function nactiVstup() {
  const mwh = mereni ? sum(mereni.cons) : cisloZPole('mwh', {
    min: 0.1, max: 100,
    prazdne: 'Vyplň roční spotřebu, například 3,5.',
    nesmysl: 'Zadej spotřebu číslem, například 3,5.',
    rozsah: 'Zadej spotřebu od 0,1 do 100 MWh.',
  });
  const hodnoty = {
    fixCena: cena('fix-cena', '3 500'), fixPlat: cena('fix-plat', '163'),
    spotPrirazka: cena('spot-prirazka', '400'), spotPlat: cena('spot-plat', '163'),
    dynZaklad: cena('dyn-zaklad', '3 900'), dynPlat: cena('dyn-plat', '163'),
  };
  if (mwh === null || Object.values(hodnoty).some((h) => h === null)) return null;
  return {
    distributor: $('#distributor').value,
    sazba: $('#sazba').value,
    region: $('#region').value,
    jistic: $('#jistic').value,
    mwh,
    fix: { cena: hodnoty.fixCena, stalyPlat: hodnoty.fixPlat },
    spot: { prirazka: hodnoty.spotPrirazka, stalyPlat: hodnoty.spotPlat },
    dyn: { zaklad: hodnoty.dynZaklad, stalyPlat: hodnoty.dynPlat },
    posun: Number($('#posun').value) || 0,
  };
}

/* ---------- výstup ---------- */

const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
let casovacOznameni = null;

function zobraz(o) {
  text('#vysledek .result-kicker', o.kicker);
  text('#vysledek-nadpis', o.nadpis);
  text('[data-vysledek-cislo]', o.cislo);
  text('[data-vysledek-popis]', o.popis);
  text('[data-vysledek-vysvetleni]', o.vysvetleni);
  for (const k of o.karty) {
    const el = $(`[data-varianta="${k.klic}"]`);
    el.classList.toggle('is-best', k.nejlevnejsi);
    $('[data-odznak]', el).hidden = !k.nejlevnejsi;
    text('[data-castka]', k.castka, el);
    text('[data-zakwh]', k.zaKwh, el);
    text('[data-rozdil]', k.rozdil, el);
    k.polozky.forEach((p, i) => text(`[data-polozka="${i}"]`, p.hodnota, el));
    const posun = $('[data-posun-efekt]', el);
    posun.textContent = k.posun;
    posun.hidden = !k.posun;
  }
  text('[data-lista-cislo]', o.lista.cislo);
  text('[data-lista-popis]', o.lista.popis);
  for (const verze of ['uzky', 'siroky']) {
    $(`[data-graf-mesice="${verze}"]`).innerHTML = o.grafMesice[verze];
    $(`[data-graf-hodiny="${verze}"]`).innerHTML = o.grafHodiny[verze];
  }
  $('[data-tabulka-mesice]').innerHTML = o.tabulkaMesice;
  const upozorneni = $('[data-upozorneni-obdobi]');
  upozorneni.hidden = !o.upozorneniObdobi;
  text('[data-upozorneni-obdobi-text]', o.upozorneniObdobi);
  $('[data-stav-cen]').hidden = !o.stavCen;
  $('[data-tabulka-hodiny]').innerHTML = o.tabulkaHodiny;
  text('[data-hodiny-shrnuti]', o.hodinyShrnuti);
  $('[data-predpoklady]').innerHTML = o.predpoklady
    .map((p) => `<div><dt>${esc(p.nazev)}</dt><dd>${esc(p.hodnota)}</dd></div>`).join('');
  clearTimeout(casovacOznameni);
  casovacOznameni = setTimeout(() => text('[data-oznameni]', o.oznameni), 800);
}

function ukazChybu(zprava) {
  const el = $('[data-chyba-vypoctu]');
  el.hidden = !zprava;
  text('[data-chyba-text]', zprava || '');
}

/* ---------- přepočet ---------- */

let poradi = 0;
let casovac = null;

function naplanuj() {
  vysledekEl.dataset.stav = 'pocitam';
  clearTimeout(casovac);
  casovac = setTimeout(() => { prepocitej().catch((e) => ukazChybu(`Výpočet se nepovedl: ${e.message}`)); }, 120);
}

async function prepocitej() {
  const cislo = ++poradi;
  const vstup = nactiVstup();
  if (!vstup) { vysledekEl.dataset.stav = 'chyba'; return; }
  vysledekEl.setAttribute('aria-busy', 'true');
  try {
    const D = await priprav();
    const klic = v.tridaTdd(tarify, vstup.sazba, vstup.region);
    let tdd;
    try {
      tdd = await nactiTdd(klic);
    } catch {
      ukazChybu('Průběh spotřeby se nepodařilo načíst. Zkus stránku načíst znovu.');
      vysledekEl.dataset.stav = 'chyba';
      return;
    }
    if (cislo !== poradi) return; // mezitím přišla novější změna
    const vypocet = v.spocitej(D, vstup, tdd, mereni ? mereni.cons : null);
    ukazChybu('');
    zobraz(v.vystup(D, vypocet, { tdd: klic, mereni: Boolean(mereni) }));
    vysledekEl.dataset.stav = 'hotovo';
  } finally {
    if (cislo === poradi) vysledekEl.removeAttribute('aria-busy');
  }
}

/* ---------- formulář ---------- */

function nastavMoznosti(select, polozky, vybrana) {
  select.replaceChildren(...polozky.map(([hodnota, popis]) => new Option(popis, hodnota, false, hodnota === vybrana)));
}

function aktualizujRegiony() {
  const jeTdd5 = tarify.sazbyInfo[$('#sazba').value]?.tdd === 'TDD5';
  $('[data-region]').hidden = !jeTdd5;
  const regiony = tarify.distributors[$('#distributor').value].tdd5Regions;
  const vybrany = $('#region').value;
  nastavMoznosti($('#region'), regiony.map((r) => [r, tarify.tdd5RegionLabels[r]]), regiony.includes(vybrany) ? vybrany : regiony[0]);
}

function pouzijPredvolbu() {
  const id = $('input[name="predvolba"]:checked')?.value;
  const p = pravidla.predvolby.find((x) => x.id === id);
  if (!p) return;
  $('#sazba').value = p.sazba;
  $('#jistic').value = p.jistic;
  if (!mereni) { $('#mwh').value = v.doPole(p.mwh); nastavChybu('mwh', ''); }
  text('#predvolba-napoveda', p.napoveda);
  aktualizujRegiony();
}

function zmenaDynamickehoTarifu() {
  const produkt = dynamicky.products[$('#dyn-produkt').value];
  if (!produkt) return;
  const k = 1 + tarify.vat.value;
  $('#dyn-zaklad').value = v.doPole(Math.round(produkt.basePrice.value * k));
  $('#dyn-plat').value = v.doPole(Math.round(produkt.monthlyFee.value * k * 100) / 100);
}

formular.addEventListener('change', (e) => {
  const id = e.target.id || e.target.name;
  if (id === 'csv-soubor' || id === 'csv-cas' || id === 'csv-hodnota' || id === 'csv-jednotka' || id === 'csv-konec') return;
  if (e.target.name === 'predvolba') pouzijPredvolbu();
  if (id === 'distributor' || id === 'sazba') aktualizujRegiony();
  if (id === 'dyn-produkt') zmenaDynamickehoTarifu();
  naplanuj();
});
formular.addEventListener('input', (e) => {
  if (e.target.tagName === 'INPUT' && e.target.type === 'text') naplanuj();
});
formular.addEventListener('submit', (e) => {
  e.preventDefault();
  naplanuj();
  vysledekEl.scrollIntoView({ block: 'start' });
});

const posuvnik = $('#posun');
posuvnik.addEventListener('input', () => {
  const t = `${posuvnik.value} %`;
  text('[data-posun-text]', t);
  posuvnik.setAttribute('aria-valuetext', `${t} denní spotřeby`);
  naplanuj();
});

// Přípravu dat spustíme při první interakci, ať je první přepočet rychlý a načtení stránky lehké.
for (const udalost of ['pointerdown', 'focusin', 'keydown', 'touchstart']) {
  document.addEventListener(udalost, function predpriprava() {
    document.removeEventListener(udalost, predpriprava);
    priprav().catch(() => {});
  }, { passive: true, once: true });
}

/* ---------- vlastní měření z CSV (jen v prohlížeči) ---------- */

let csv = null;
const csvStav = (zprava, chyba = false) => {
  const el = $('[data-csv-stav]');
  el.textContent = zprava;
  el.classList.toggle('is-chyba', chyba);
};

function prectiSoubor(soubor, kodovani) {
  return new Promise((hotovo, chyba) => {
    const r = new FileReader();
    r.onload = () => hotovo(r.result);
    r.onerror = () => chyba(r.error);
    r.readAsText(soubor, kodovani);
  });
}

$('#csv-soubor').addEventListener('change', async (e) => {
  const soubor = e.target.files[0];
  if (!soubor) return;
  try {
    let obsah = await prectiSoubor(soubor, 'utf-8');
    if (obsah.includes('�')) obsah = await prectiSoubor(soubor, 'windows-1250');
    csv = parseCsv(obsah);
    if (!csv.headers.length || !csv.rows.length) throw new Error('soubor je prázdný');
    const sloupce = csv.headers.map((h, i) => [String(i), h || `Sloupec ${i + 1}`]);
    const cas = csv.headers.findIndex((h) => /čas|cas|datum|date|time|od|do/i.test(h));
    const hodnota = csv.headers.findIndex((h) => /kwh|kw|spotř|spotr|odběr|odber|hodnota|value|činn/i.test(h));
    nastavMoznosti($('#csv-cas'), sloupce, String(cas >= 0 ? cas : 0));
    nastavMoznosti($('#csv-hodnota'), sloupce, String(hodnota >= 0 && hodnota !== cas ? hodnota : Math.min(1, sloupce.length - 1)));
    if (csv.headers.some((h) => /\bkW\b(?!h)/i.test(h))) $('#csv-jednotka').value = 'kW';
    $('[data-csv-mapovani]').hidden = false;
    csvStav(`Načteno ${cislo(csv.rows.length)} řádků. Zkontroluj sloupce a klikni na „Použít měření“.`);
  } catch (chyba) {
    csvStav(`Soubor se nepodařilo přečíst: ${chyba.message}`, true);
  }
});

$('[data-csv-pouzit]').addEventListener('click', async () => {
  if (!csv) return;
  try {
    const D = await priprav();
    const klic = v.tridaTdd(tarify, $('#sazba').value, $('#region').value);
    const tdd = normalize(await nactiTdd(klic));
    const r = profileFromCsv(csv.rows, {
      timeCol: Number($('#csv-cas').value), valueCol: Number($('#csv-hodnota').value),
      timeIsEnd: $('#csv-konec').value === '1', unit: $('#csv-jednotka').value,
    }, D.grid, tdd);
    // Revize SPOT-10: krátké měření (pod minimem pokrytí z rules.json) nepoužijeme a roční spotřebu nepřepíšeme.
    const posudek = v.posudMereni(r, pravidla.mereni);
    csvStav(posudek.zprava, posudek.chyba);
    if (!posudek.pouzit) return;
    const pole = $('#mwh');
    if (!mereni) mwhPredMerenim = pole.value;
    mereni = r;
    pole.value = v.doPole(Math.round(sum(r.cons) * 100) / 100);
    pole.readOnly = true;
    nastavChybu('mwh', '');
    naplanuj();
  } catch (chyba) {
    csvStav(chyba.message, true);
  }
});

$('[data-csv-zrusit]').addEventListener('click', () => {
  mereni = null;
  csv = null;
  $('#csv-soubor').value = '';
  $('[data-csv-mapovani]').hidden = true;
  $('#mwh').readOnly = false;
  // Vrátíme hodnotu, kterou měl uživatel v poli před měřením, ne předvolbu.
  if (mwhPredMerenim !== null) $('#mwh').value = mwhPredMerenim;
  mwhPredMerenim = null;
  csvStav('Počítáme zase s typovým profilem spotřeby (TDD).');
  naplanuj();
});
