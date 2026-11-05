// Volno 2027 – klientský modul. Čte počet dnů dovolené, počítá návrhy přes volno.js
// a překreslí výsledek, karty návrhů, kalendář a lepivou lištu.
// Pravidla bere z <script type="application/json" id="pravidla"> (žádný fetch).
import { nejlepsiNavrhy } from './volno.js';
import { textyVysledku, navrhyHtml, kalendarHtml, dovolenaZNavrhu } from './vystup.js';

const pravidla = JSON.parse(document.getElementById('pravidla').textContent);
const formular = document.getElementById('volno-formular');
const $ = (sel) => document.querySelector(sel);
const nastavText = (sel, text) => { const el = $(sel); if (el) el.textContent = text; };

function prepocitej({ oznamit = true } = {}) {
  const vybrano = Number(formular.querySelector('input[name="dovolena"]:checked')?.value);
  const pocet = Number.isInteger(vybrano) && vybrano >= 1 && vybrano <= pravidla.maxDnuDovolene ? vybrano : 1;
  const navrhy = nejlepsiNavrhy(pravidla.rok, pocet, pravidla, { max: pravidla.maxNavrhu });
  const t = textyVysledku(navrhy, pocet, pravidla.rok);

  nastavText('#vysledek-nadpis', t.nadpis);
  nastavText('#vysledek [data-vysledek-cislo]', t.cislo);
  nastavText('#vysledek [data-vysledek-popis]', t.popis);
  nastavText('#vysledek [data-vysledek-vysvetleni]', t.vysvetleni);
  nastavText('[data-lista-cislo]', t.lista);
  nastavText('[data-lista-popis]', t.listaPopis);
  $('[data-navrhy]').innerHTML = navrhyHtml(navrhy);
  $('[data-kalendar]').innerHTML = kalendarHtml(pravidla.rok, pravidla, dovolenaZNavrhu(navrhy));
  if (oznamit) nastavText('[data-oznameni]', t.oznameni);
}

formular.addEventListener('change', () => prepocitej());
formular.addEventListener('submit', (e) => { e.preventDefault(); prepocitej(); });
// Prohlížeč může po návratu na stránku obnovit jinou volbu, než ukazuje ukázka z buildu
prepocitej({ oznamit: false });
