// Výpověď 2026 – klientská část: čte formulář, volá výpočet (vystup.js → vypoved.js)
// a živě překresluje výsledek. Pravidla jsou ve stránce (#pravidla), nic se nenačítá,
// neukládá ani neodesílá.
import { spocitej, kartaHtml, detailyHtml, seznamHtml, denPo } from './vystup.js';
import { konecPomeru, kontrolaDoruceni } from './vypoved.js';
import { kc, datum } from '../../js/format.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const $ = (id) => document.getElementById(id);
const rules = JSON.parse($('pravidla').textContent);
const koren = $('vypoved');
const sprite = koren.dataset.sprite;
const dluhy = koren.dataset.dluhy;
const form = $('vypoved-formular');
const vysledky = $('vypoved-vysledky');
const oznameni = form.querySelector('[data-oznameni]');
const duvod = $('duvod');
const volbaJiny = duvod.querySelector('option[value="jiny"]');
const PRVNI_ROK = Object.keys(rules.podpora).filter((k) => /^\d{4}$/.test(k)).sort()[0];

let zadostUpravena = false;

/* ---------- Čtení a kontrola polí ---------- */

const kdo = () => form.querySelector('input[name="kdo"]:checked')?.value ?? 'zamestnavatel';
const jeDatum = (t) => /^\d{4}-\d{2}-\d{2}$/.test(t);

function cislo(id) {
  return prectiCislo($(id).value, { zaporne: false }) ?? NaN;
}

function vstupKonce() {
  const k = kdo();
  return {
    doruceni: $('doruceni').value,
    kdo: k,
    duvod: k === 'zamestnanec' ? undefined : duvod.value,
    pricinaUraz: form.querySelector('input[name="pricina"]:checked')?.value === 'uraz',
    zvlastHrube: k === 'zamestnavatel' && form.querySelector('input[name="zvlastHrube"]:checked')?.value === 'ano',
    zkusebniDoba: k !== 'dohoda' && form.querySelector('input[name="zkusebni"]:checked')?.value === 'ano',
    konecDohody: k === 'dohoda' ? $('konecDohody').value : undefined,
  };
}

function precti() {
  const v = vstupKonce();
  const vstup = { ...v, delkaLet: cislo('delka'), vek: cislo('vek'), hruby: cislo('hruby'), cisty: cislo('cisty'), datumZadosti: $('datumZadosti').value };
  const chyby = {};
  if (!jeDatum(v.doruceni)) chyby.doruceni = 'Zadej den doručení výpovědi.';
  else {
    // Revize 5. 11. 2026, VYP-07: výpověď doručená před 1. 6. 2025 (čl. II bod 3 zákona č. 120/2025 Sb.).
    const chyba = kontrolaDoruceni(v, rules);
    if (chyba) chyby.doruceni = chyba;
  }
  if (v.kdo === 'dohoda') {
    if (!jeDatum(v.konecDohody)) chyby.konecDohody = 'Zadej sjednaný den skončení podle dohody.';
    else if (jeDatum(v.doruceni)) {
      // Pořadí dat hlídá výpočetní modul (konecPomeru), tady jen ukážeme jeho hlášku u pole.
      try { konecPomeru(v, rules); } catch (e) { chyby.konecDohody = e.message; }
    }
  }
  if (Number.isNaN(vstup.delkaLet)) chyby.delka = 'Zadej délku v letech, třeba 1,5.';
  if (Number.isNaN(vstup.hruby)) chyby.hruby = 'Zadej průměrný hrubý výdělek v Kč.';
  if (Number.isNaN(vstup.cisty)) chyby.cisty = 'Zadej průměrný čistý výdělek v Kč.';
  if (!Number.isInteger(vstup.vek) || vstup.vek < 15 || vstup.vek > 100) chyby.vek = 'Zadej věk celým číslem od 15 do 100.';
  if (!jeDatum(vstup.datumZadosti)) chyby.datumZadosti = 'Zadej den podání žádosti o podporu.';
  else if (vstup.datumZadosti.slice(0, 4) < PRVNI_ROK) chyby.datumZadosti = `Počítáme žádosti podané od roku ${PRVNI_ROK}.`;
  return { vstup, chyby };
}

const POLE = ['doruceni', 'konecDohody', 'delka', 'hruby', 'cisty', 'vek', 'datumZadosti'];

function ukazChyby(chyby) {
  for (const id of POLE) {
    const input = $(id);
    const zprava = $(`${id}-chyba`);
    const text = chyby[id];
    input.closest('.field').classList.toggle('is-error', Boolean(text));
    if (text) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    if (zprava) {
      zprava.hidden = !text;
      zprava.querySelector('.error-text').textContent = text ?? '';
    }
  }
}

/* ---------- Závislá pole ---------- */

function aktualizujPole() {
  const k = kdo();
  for (const blok of form.querySelectorAll('[data-pro]')) {
    const proDuvod = !blok.dataset.duvod || blok.dataset.duvod.split(' ').includes(duvod.value);
    blok.hidden = !blok.dataset.pro.split(' ').includes(k) || !proDuvod;
  }
  const dohoda = k === 'dohoda';
  volbaJiny.hidden = !dohoda;
  volbaJiny.disabled = !dohoda;
  if (!dohoda && duvod.value === 'jiny') duvod.value = 'c';
}

function navrhniDatumZadosti() {
  if (zadostUpravena) return;
  try {
    $('datumZadosti').value = denPo(konecPomeru(vstupKonce(), rules));
  } catch {
    /* neúplné zadání – nic nenavrhujeme */
  }
}

/* ---------- Výsledek ---------- */

/** Šířka grafu podle místa v kartě, aby text grafu byl čitelný i na mobilu. */
function sirkaGrafu() {
  const karta = vysledky.querySelector('.card') ?? vysledky;
  const styl = getComputedStyle(karta);
  const w = karta.clientWidth - parseFloat(styl.paddingLeft) - parseFloat(styl.paddingRight);
  return Math.round(Math.min(640, Math.max(280, w || 640)));
}

function vykresli({ fokus = false } = {}) {
  const { vstup, chyby } = precti();
  if (!Object.keys(chyby).length) {
    try {
      const m = spocitej(vstup, rules);
      const zaskrtnute = [...vysledky.querySelectorAll('.checklist input:checked')].map((i) => i.id);
      vysledky.innerHTML = kartaHtml(m, { sprite }) + detailyHtml(m, rules, { sprite, sirkaGrafu: sirkaGrafu() }) + seznamHtml(m, { sprite, idPrefix: 'ukol', dluhy });
      for (const id of zaskrtnute) { const i = $(id); if (i) i.checked = true; }
      const lista = document.querySelector('[data-lista-cislo]');
      if (lista) lista.textContent = datum(m.konec);
      const nahrada = m.nahrada.castka > 0 ? `, jednorázová náhrada ${kc(m.nahrada.castka)}` : '';
      const podporaText = m.p.vylouceno ? 'podpora nenáleží' : `podpora celkem ${kc(m.p.hlavni.celkem)}`;
      oznameni.textContent = `Poslední den ${datum(m.konec)}, odstupné ${kc(m.od.castka)}${nahrada}, ${podporaText}.`;
    } catch (e) {
      chyby.datumZadosti = e.message;
    }
  }
  ukazChyby(chyby);
  const prvni = POLE.find((id) => chyby[id]);
  if (prvni) {
    oznameni.textContent = 'Oprav zvýrazněná pole, výsledek se zatím nepřepočítal.';
    if (fokus) $(prvni).focus();
    return;
  }
  if (fokus) {
    const nadpis = $('vysledek-nadpis');
    nadpis.focus({ preventScroll: true });
    nadpis.closest('.result').scrollIntoView({ block: 'start' });
  }
}

/* ---------- Události ---------- */

form.addEventListener('input', (e) => {
  if (e.target.id === 'datumZadosti') zadostUpravena = Boolean(e.target.value);
  else if (e.target.matches('#doruceni, #konecDohody, [name="kdo"], [name="zkusebni"], #duvod')) {
    aktualizujPole();
    navrhniDatumZadosti();
  }
  vykresli();
});
form.addEventListener('change', (e) => {
  if (e.target.id === 'datumZadosti') zadostUpravena = Boolean(e.target.value);
  else { aktualizujPole(); navrhniDatumZadosti(); }
  vykresli();
});
let sirkaPred = window.innerWidth;
window.addEventListener('resize', () => {
  if (Math.abs(window.innerWidth - sirkaPred) < 40) return;
  sirkaPred = window.innerWidth;
  vykresli();
});
form.addEventListener('submit', (e) => { e.preventDefault(); vykresli({ fokus: true }); });

/* ---------- Start ---------- */

form.querySelector('[data-tlacitko]').hidden = false;
aktualizujPole();
vykresli();
