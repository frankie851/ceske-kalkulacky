// Exekuce, nebo oddlužení? – klientský modul. Čte formulář, počítá přes dluhy.js a aktualizuje stránku.
// Pravidla bere z <script type="application/json" id="pravidla"> (žádný požadavek na síť).
// Nic se neukládá ani neodesílá a zadané hodnoty se nedávají do adresy stránky.
import { pravidlaProRok } from './dluhy.js';
import { rokPravidel, vysledek, moznostiUroku, cisloSazby } from './vystup.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const rules = JSON.parse(document.getElementById('pravidla').textContent);
const rok = rokPravidel(rules, new Date().getFullYear());
const p = pravidlaProRok(rules, rok.rok);

const urokMoznosti = moznostiUroku(rules.urokZProdleni);
const sazbaPololeti = new Map(urokMoznosti.map((m) => [m.hodnota, m.sazba]));
const vychoziSazba = cisloSazby(urokMoznosti.find((m) => m.vybrano).sazba);

const formular = document.getElementById('dluhy-formular');
const $ = (sel, koren = document) => koren.querySelector(sel);

/* ---------- čtení a kontrola vstupů ---------- */

/** Číslo z textového pole: mezery a „Kč“ pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
function nactiCislo(id) {
  return prectiCislo($(`#${id}`).value, { zaporne: false });
}

function nastavChybu(id, text) {
  const pole = $(`#${id}`);
  const zprava = $(`#${id}-chyba`);
  pole.closest('.field').classList.toggle('is-error', Boolean(text));
  if (text) pole.setAttribute('aria-invalid', 'true');
  else pole.removeAttribute('aria-invalid');
  if (zprava) {
    zprava.hidden = !text;
    $('.error-text', zprava).textContent = text || '';
  }
  return text ? 1 : 0;
}

function nactiVstup() {
  let chyby = 0;
  const mzda = nactiCislo('mzda');
  chyby += nastavChybu('mzda', mzda === null || Number.isNaN(mzda) ? 'Napište částku v korunách, třeba 23 000.' : '');
  const dluh = nactiCislo('dluh');
  chyby += nastavChybu('dluh', dluh === null || Number.isNaN(dluh) ? 'Napište částku v korunách. Stačí odhad.' : '');
  const osoby = nactiCislo('osoby') ?? 0;
  chyby += nastavChybu('osoby', Number.isNaN(osoby) || !Number.isInteger(osoby) || osoby > 15 ? 'Napište celé číslo od 0 do 15.' : '');
  const exekuce = nactiCislo('exekuce') ?? 0;
  chyby += nastavChybu('exekuce', Number.isNaN(exekuce) || !Number.isInteger(exekuce) ? 'Napište celé číslo, třeba 1.' : '');
  let sazba = 0;
  if ($('#urok').checked) {
    sazba = nactiCislo('sazba');
    chyby += nastavChybu('sazba', sazba === null || Number.isNaN(sazba) || sazba > 100 ? `Napište sazbu v procentech, třeba ${vychoziSazba}.` : '');
  } else {
    nastavChybu('sazba', '');
  }
  return {
    chyby,
    vstup: {
      cistaMzda: mzda,
      osoby,
      prednostni: formular.elements.druh.value === 'prednostni',
      pocetExekuci: exekuce,
      duchodce: $('#duchod').checked,
      dluh,
      sazba,
      drivejsiOdpusteni: formular.elements.odpusteni.value,
    },
  };
}

/* ---------- výpis výsledku ---------- */

function nastav(sel, text) {
  const el = $(sel);
  el.textContent = text;
  return el;
}

function nastavSkryte(sel, text) {
  nastav(sel, text).hidden = !text;
}

function zobraz(v) {
  nastav('[data-ex-zustane]', v.ex.zustane);
  nastav('[data-ex-srazka]', v.ex.srazka);
  nastav('[data-ex-vericum]', v.ex.vericum);
  nastav('[data-ex-nezabavitelna]', v.ex.nezabavitelna);
  nastavSkryte('[data-ex-nahrada]', v.ex.nahrada);
  nastav('[data-ex-doba]', v.ex.doba);
  nastav('[data-ex-upozorneni]', v.ex.upozorneni);

  nastav('[data-od-nelze-text]', v.od.nelze);
  $('[data-od-nelze]').hidden = !v.od.nelze;
  nastav('[data-od-splatka]', v.od.splatka);
  nastav('[data-od-zustane]', v.od.zustane);
  nastav('[data-od-delka]', v.od.delka);
  nastav('[data-od-spravce]', v.od.spravce);
  nastav('[data-od-celkem]', v.od.zaplacenoCelkem);
  nastav('[data-od-minimum]', v.od.minimum);
  nastav('[data-od-spravce-text]', v.od.spravceText);
  nastavSkryte('[data-od-srovnani]', v.od.srovnani);
  nastav('[data-od-zaplaceno]', v.od.zaplaceno);
  nastav('[data-od-zbytek]', v.od.zbytek);
  nastav('[data-od-minimum-text]', v.od.minimumText).classList.toggle('dluhy-varovani', !v.od.splnujeMinimum);

  const rozpis = $('[data-rozpis]');
  rozpis.replaceChildren(...v.rozpis.map((t) => {
    const li = document.createElement('li');
    li.textContent = t;
    return li;
  }));
  nastav('[data-lista-cislo]', v.ex.zustane);
}

let casovac = null;
function prepocitej() {
  const { chyby, vstup } = nactiVstup();
  $('[data-chyby]').hidden = !chyby;
  $('#vysledek').classList.toggle('dluhy-neplatne', Boolean(chyby));
  if (chyby) return;
  const v = vysledek(p, vstup);
  zobraz(v);
  // Čtečkám oznámíme výsledek až po krátké pauze v psaní
  clearTimeout(casovac);
  casovac = setTimeout(() => {
    nastav('[data-oznameni]', `Při exekuci vám zůstane ${v.ex.zustane}. Splátka v oddlužení je ${v.od.splatka}.`);
  }, 800);
}

/* ---------- spuštění ---------- */

nastav('[data-rok]', rok.poznamka);
formular.addEventListener('input', prepocitej);
formular.addEventListener('change', prepocitej);
// Formulář se nikam neodesílá (ani Enter v poli nic nepošle)
formular.addEventListener('submit', (e) => e.preventDefault());

const urok = $('#urok');
const urokPole = $('#urok-pole');
const prepniUrok = () => { urokPole.hidden = !urok.checked; };
urok.addEventListener('change', prepniUrok);
prepniUrok();

// Volba pololetí doplní zákonnou sazbu z rules.json. Vlastní sazba (třeba ze smlouvy)
// přepne volbu na „Jindy, nebo mám sazbu ze smlouvy“.
const pololetiPole = $('#pololeti');
const sazbaPole = $('#sazba');
pololetiPole.addEventListener('change', () => {
  const s = sazbaPololeti.get(pololetiPole.value);
  if (s !== null && s !== undefined) sazbaPole.value = cisloSazby(s);
});
sazbaPole.addEventListener('input', () => {
  const s = sazbaPololeti.get(pololetiPole.value);
  if (s !== null && s !== undefined && nactiCislo('sazba') !== s) pololetiPole.value = 'jina';
});

for (const el of document.querySelectorAll('[data-jen-js]')) el.hidden = false;
$('[data-ukaz-vysledek]').addEventListener('click', () => {
  const nadpis = $('#vysledek-nadpis');
  nadpis.scrollIntoView({ block: 'start' });
  nadpis.focus({ preventScroll: true });
});

prepocitej();
