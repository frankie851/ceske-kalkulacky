// Rodičovská pro celou rodinu – klientský modul. Čte formulář, počítá přes rodina.js,
// kreslí časovou osu přes timeline.js a aktualizuje stránku.
// Pravidla bere z <script type="application/json" id="pravidla"> (žádný fetch).
// Žádné částky ani sazby tu nejsou natvrdo: všechno je v rules.json.
// Ukládá se JEN na kliknutí (sdílený modul uloziste.js), nic automaticky.
import { planRodiny, VYCHOZI_VSTUP, pridejDny, nastupOtcovskeMaxDne } from './rodina.js';
import { svgOsa } from './timeline.js';
import * as v from './vystup.js';
import { kc, datum } from '../../js/format.js';
import { pripojUlozeni } from '../../js/uloziste.js';
import { prectiCislo } from '../../js/cislo-vstup.js';
import { ocistiUlozene, mezeFormulare } from './obnova.js';

const pravidla = JSON.parse(document.getElementById('pravidla').textContent);
const formular = document.getElementById('rodicovska-formular');
const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];

const DNI_DO_PORODU = 150;
const TERMIN_MIN = [...pravidla.rodicovsky].map((r) => r.narozeniOd).sort()[0];
const VEK_MAX = Math.max(...pravidla.rodicovsky.map((r) => r.vekMesicu)) - 1;
// Nástup na otcovskou do 6 týdnů od narození, lhůta se prodlouží o dny hospitalizace dítěte
// v těchto 6 týdnech (§ 38a odst. 4 zákona č. 187/2006 Sb.). Meze z rules.json.
const HOSPITALIZACE_MAX = pravidla.otcovska.hospitalizace.maxDni;
const SPRITE = ($('use[href*="sprite.svg#"]')?.getAttribute('href') || '/img/sprite.svg#').split('#')[0];

/** Výše rodičovského příspěvku: 'navrh' (vyčerpat do 3 let), 'max' (strop), nebo 'vlastni' (posuvník). */
let rpVolba = 'navrh';
let plan = null;

/* ---------- čtení a kontrola vstupů ---------- */

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

const vybrane = (nazev) => formular.querySelector(`input[name="${nazev}"]:checked`)?.value;

/** Celé číslo v rozsahu, jinak chyba u pole. */
function celeCislo(id, min, max, popis) {
  const n = nactiCislo(id);
  if (n === null || Number.isNaN(n) || !Number.isInteger(n) || n < min || n > max) {
    nastavChybu(id, `Zadej ${popis} jako celé číslo od ${min} do ${max}.`);
    return null;
  }
  nastavChybu(id, '');
  return n;
}

function prijem(id) {
  const n = nactiCislo(id);
  if (Number.isNaN(n)) { nastavChybu(id, 'Zadej částku číslem, bez písmen.'); return null; }
  if (n !== null && n < 0) { nastavChybu(id, 'Příjem nemůže být záporný. Zadej 0 nebo víc.'); return null; }
  nastavChybu(id, '');
  return n > 0 ? n : 0;
}

/** Vrátí { vstup, chyby } pro planRodiny. */
function nactiVstup() {
  let chyby = 0;
  const termin = $('#termin').value;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(termin)) { nastavChybu('termin', 'Vyplň termín porodu.'); chyby++; }
  else if (termin < TERMIN_MIN) { nastavChybu('termin', `Zadej termín od ${datum(TERMIN_MIN)}. Pro dřívější narození platí jiná pravidla.`); chyby++; }
  else nastavChybu('termin', '');

  const prijemMatka = prijem('prijem-matka');
  const prijemOtec = prijem('prijem-otec');
  if (prijemMatka === null) chyby++;
  if (prijemOtec === null) chyby++;

  const otcovska = vybrane('otcovska') === 'ano';
  const stridani = vybrane('stridani') === 'ano';
  const navrat = vybrane('navrat') === 'ano';
  const hospitalizace = otcovska && vybrane('hospitalizace') === 'ano';
  const hospitalizaceDni = hospitalizace ? celeCislo('hospitalizace-dni', 0, HOSPITALIZACE_MAX, 'počet dní') : 0;
  if (!hospitalizace) nastavChybu('hospitalizace-dni', '');
  const otcovskaMax = nastupOtcovskeMaxDne(pravidla, { hospitalizace, hospitalizaceDni: hospitalizaceDni ?? 0 });
  nastavNapovedu('otcovska-od', v.napovedaOtcovskaOd(pravidla, otcovskaMax));
  const otcovskaOdDne = otcovska ? celeCislo('otcovska-od', 0, otcovskaMax, 'počet dní') : 0;
  const stridaniOdMesice = stridani ? celeCislo('stridani-od', 1, VEK_MAX, 'měsíc') : VYCHOZI_VSTUP.stridaniOdMesice;
  const navratOdMesice = navrat ? celeCislo('navrat-od', 1, VEK_MAX, 'měsíc') : VYCHOZI_VSTUP.navratOdMesice;
  if (!otcovska) nastavChybu('otcovska-od', '');
  if (!stridani) nastavChybu('stridani-od', '');
  if (!navrat) nastavChybu('navrat-od', '');
  if (hospitalizaceDni === null || otcovskaOdDne === null || stridaniOdMesice === null || navratOdMesice === null) chyby++;

  return {
    chyby,
    vstup: {
      terminPorodu: termin,
      vicercata: vybrane('vicercata') === 'ano',
      prijemMatka: prijemMatka ?? 0,
      prijemOtec: prijemOtec ?? 0,
      narokMatka: vybrane('narok-matka') === 'ano',
      narokOtec: vybrane('narok-otec') === 'ano',
      kdoPpm: vybrane('kdo-ppm') || 'matka',
      ppmTydnuPred: Number($('#ppm-tydnu').value) || pravidla.ppm.nastupTydnyPredMin,
      otcovska,
      otcovskaOdDne: otcovskaOdDne ?? 0,
      hospitalizace,
      hospitalizaceDni: hospitalizaceDni ?? 0,
      rpVyse: null,
      stridani,
      stridaniOdMesice: stridaniOdMesice ?? 0,
      navrat,
      navratOdMesice: navratOdMesice ?? 0,
    },
  };
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

const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ikona = (id) => `<svg class="ikona" aria-hidden="true" focusable="false"><use href="${esc(SPRITE)}#${id}"/></svg>`;

/** Řádky tabulky ve stejné podobě jako makro tabulka (první buňka = th scope="row"). */
function radkyTabulky(tabulka, radky, sloupce, vpravo, zvyraznit = -1) {
  $('tbody', tabulka).innerHTML = radky.map((radek, ri) => `<tr${ri === zvyraznit ? ' class="hl"' : ''}>`
    + radek.map((b, i) => (i === 0
      ? `<th scope="row">${esc(b)}</th>`
      : `<td${vpravo.includes(i) ? ' class="r"' : ''} data-label="${esc(sloupce[i])}">${esc(b)}</td>`)).join('')
    + '</tr>').join('');
}

function vykresliVarovani(seznam) {
  $('[data-varovani]').innerHTML = seznam.map((w) => `<div class="notice${w.uroven === 'info' ? ' notice-info' : ''}">`
    + ikona(w.uroven === 'info' ? 'ikona-info' : 'ikona-vystraha')
    + `<div>${w.titulek ? `<p><strong>${esc(w.titulek)}</strong></p>` : ''}<p>${esc(w.text)}</p></div></div>`).join('');
}

/** Kontrolní seznam jako makro kontrolni_seznam; odškrtnuté úkoly zůstanou odškrtnuté. */
function vykresliSeznam(polozky) {
  const obal = $('[data-kontrolni-seznam]');
  const hotove = new Set($$('input:checked', obal).map((i) => $(`label[for="${i.id}"] .task`, obal)?.textContent));
  obal.innerHTML = `<ul class="checklist">${polozky.map((u, i) => {
    const id = `ukol-${i + 1}`;
    const kdy = u.termin
      ? `<span class="when${u.typ === 'hard' ? ' firm' : ''}">${ikona('ikona-kalendar')}<span class="sr-only">${u.typ === 'hard' ? 'Pevný termín: ' : 'Doporučený termín: '}</span>${esc(u.termin)}</span>`
      : '';
    const zdroj = u.zdroj
      ? `<span class="src">Zdroj: ${u.zdroj.url ? `<a href="${esc(u.zdroj.url)}">${esc(u.zdroj.nazev)}</a>` : esc(u.zdroj.nazev)}</span>`
      : '';
    return `<li><input type="checkbox" id="${id}"${hotove.has(u.ukol) ? ' checked' : ''}><label for="${id}"><span class="box">${ikona('ikona-zaskrtnuti')}</span>`
      + `<span><span class="task">${esc(u.ukol)}</span>${kdy}</span></label>${zdroj}</li>`;
  }).join('')}</ul>`;
}

function vykresliOsu() {
  if (!plan) return;
  const obal = $('[data-osa]');
  const sirka = Math.max(280, Math.floor(obal.clientWidth || 360));
  obal.innerHTML = svgOsa(plan, { sirka });
}

function zobrazZavisle(vstup) {
  for (const el of $$('[data-zavisi]')) {
    const k = el.dataset.zavisi;
    el.hidden = !(k === 'ppm-matka' ? vstup.kdoPpm === 'matka' : vstup[k]);
  }
}

/* ---------- výpočet a vykreslení ---------- */

let oznameniCasovac = null;

/**
 * Při chybě ve formuláři skryje celý plán (výsledek, osu, souhrn, kontrolní seznam i lištu)
 * a ukáže upozornění, aby pod hláškou nezůstala čísla k jinému zadání (revize 5. 11. 2026, ROD-07).
 */
function oznacNeplatne(neplatne) {
  $('[data-neplatne]').hidden = !neplatne;
  for (const el of $$('#vysledek, [data-plan], .lepiva-lista')) el.hidden = neplatne;
}

function prepocitej() {
  const { vstup, chyby } = nactiVstup();
  zobrazZavisle(vstup);
  oznacNeplatne(Boolean(chyby));
  if (chyby) {
    clearTimeout(oznameniCasovac);
    return;
  }

  // Výše rodičovského příspěvku podle volby: nejdřív plán s návrhem, kvůli stropu
  const zaklad = planRodiny(vstup, pravidla);
  const posuvnik = $('#rp-vyse');
  if (rpVolba === 'max') vstup.rpVyse = zaklad.rp.strop;
  else if (rpVolba === 'vlastni') vstup.rpVyse = Math.min(Number(posuvnik.value), zaklad.rp.strop);
  plan = vstup.rpVyse == null ? zaklad : planRodiny(vstup, pravidla);
  const r = plan.rp;

  // Posuvník a tlačítka
  posuvnik.max = String(r.strop);
  posuvnik.min = String(Math.min(v.KROK_VYSE, r.strop));
  posuvnik.value = String(r.vyse);
  posuvnik.setAttribute('aria-valuetext', `${kc(r.vyse)} měsíčně`);
  text('[data-rp-text]', kc(r.vyse));
  text('[data-rp-napoveda]', v.napovedaRp(plan, pravidla));
  $('[data-rp-navrh]').setAttribute('aria-pressed', String(rpVolba === 'navrh'));
  $('[data-rp-max]').setAttribute('aria-pressed', String(rpVolba === 'max'));

  // Formulář: shrnutí kroků a nápovědy
  const s = v.shrnutiKroku(plan, pravidla);
  text('#krok-dite .step-sum', s.dite);
  text('#krok-prijmy .step-sum', s.prijmy);
  text('#krok-materska .step-sum', s.materska);
  text('#krok-otcovska .step-sum', s.otcovska);
  text('#krok-rp .step-sum', s.rp);
  // Předvyplněné mzdy jsou ukázka; označení zmizí, jakmile je někdo přepíše (ROD-14).
  $('[data-ukazka-prijmu]').hidden = vstup.prijemMatka !== VYCHOZI_VSTUP.prijemMatka || vstup.prijemOtec !== VYCHOZI_VSTUP.prijemOtec;
  nastavNapovedu('prijem-matka', v.napovedaPrijmu(vstup.prijemMatka, pravidla));
  nastavNapovedu('prijem-otec', v.napovedaPrijmu(vstup.prijemOtec, pravidla));

  // Karta výsledku
  const vys = v.vysledek(plan);
  text('[data-vysledek-cislo]', vys.cislo);
  text('[data-vysledek-popis]', vys.popis);
  text('[data-vysledek-vysvetleni]', vys.vysvetleni);
  $$('#vysledek .stats > li').forEach((li, i) => {
    const st = vys.statistiky[i];
    if (!st) return;
    $('b', li).textContent = st.hodnota;
    $('span', li).textContent = st.popis;
    li.classList.toggle('sage', Boolean(st.zvyraznit));
  });
  // Štítek částky podle schváleného zákona, který ještě neplatí (stav pravidla ze src/js/stav-pravidel.js).
  const novela = $('[data-novela]');
  if (novela) novela.hidden = r.stav === 'plati';
  if (novela && r.stav !== 'plati') {
    const badge = $('.badge', novela);
    const uzel = [...badge.childNodes].reverse().find((n) => n.nodeType === Node.TEXT_NODE);
    if (uzel) uzel.textContent = `${kc(r.celkem)}: zákon č. ${r.zakon}`;
  }
  vykresliVarovani(v.varovani(plan, vstup, pravidla));
  text('[data-lista-cislo]', vys.lista);

  // Časová osa, tabulky, postup, kontrolní seznam
  vykresliOsu();
  radkyTabulky($('#tabulka-mesicu'), v.radkyMesicu(plan), v.sloupceMesicu, [1, 2, 3]);
  const souhrn = v.radkySouhrnu(plan, pravidla);
  radkyTabulky($('#tabulka-souhrnu'), souhrn, v.sloupceSouhrnu, [1], v.zvyraznitSouhrn(souhrn));
  $('[data-jak-pocitame]').innerHTML = v.jakPocitame(plan, pravidla).map((t) => `<li>${esc(t)}</li>`).join('');
  vykresliSeznam(v.kontrolniSeznam(plan, pravidla));

  // Oznámení pro čtečky (se zpožděním, ať se nečte každé písmeno)
  clearTimeout(oznameniCasovac);
  oznameniCasovac = setTimeout(() => {
    text('[data-oznameni]', `Dávky celkem ${vys.cislo}. ${vys.statistiky[0].hodnota === 'nevyčerpá se' ? 'Rodičovský příspěvek se do 3 let nevyčerpá.' : `Rodičovský příspěvek se vyčerpá: ${vys.statistiky[0].hodnota}.`}`);
  }, 800);
}

/* ---------- ukládání (jen na kliknutí) ---------- */

const POLE = ['termin', 'prijem-matka', 'prijem-otec', 'ppm-tydnu', 'hospitalizace-dni', 'otcovska-od', 'stridani-od', 'navrat-od'];
const RADIA = ['vicercata', 'narok-matka', 'narok-otec', 'kdo-ppm', 'otcovska', 'hospitalizace', 'stridani', 'navrat'];

function ziskej() {
  const data = { rpVolba, rpVyse: Number($('#rp-vyse').value) };
  for (const id of POLE) data[id] = $(`#${id}`).value;
  for (const n of RADIA) data[n] = vybrane(n);
  return data;
}

function obnov(ulozeno) {
  // Revize 5. 11. 2026, ROD-14: do formuláře jen platné hodnoty, ostatní pole zůstanou, jak jsou.
  const data = ocistiUlozene(ulozeno, mezeFormulare(pravidla));
  for (const id of POLE) if (id in data) $(`#${id}`).value = data[id];
  for (const n of RADIA) {
    const radio = data[n] && formular.querySelector(`input[name="${n}"][value="${CSS.escape(String(data[n]))}"]`);
    if (radio) radio.checked = true;
  }
  rpVolba = data.rpVolba ?? 'navrh';
  if (rpVolba === 'vlastni' && 'rpVyse' in data) {
    const posuvnik = $('#rp-vyse');
    posuvnik.max = String(Math.max(Number(posuvnik.max), Number(data.rpVyse)));
    posuvnik.value = String(data.rpVyse);
  }
  prepocitej();
}

/* ---------- start ---------- */

// Výchozí termín v prohlížeči: dnes + 150 dní (build ukazuje deterministický termín z data ověření).
const termin = $('#termin');
termin.min = TERMIN_MIN;
if (termin.value === termin.defaultValue) {
  const dnes = new Date();
  const iso = `${dnes.getFullYear()}-${String(dnes.getMonth() + 1).padStart(2, '0')}-${String(dnes.getDate()).padStart(2, '0')}`;
  const novy = pridejDny(iso, DNI_DO_PORODU);
  if (novy >= TERMIN_MIN) termin.value = novy;
}

formular.addEventListener('input', (e) => {
  if (e.target.id === 'rp-vyse') rpVolba = 'vlastni';
  prepocitej();
});
formular.addEventListener('change', prepocitej);
formular.addEventListener('submit', (e) => {
  e.preventDefault();
  prepocitej();
  $('#vysledek').scrollIntoView({ block: 'start' });
});
$('[data-rp-navrh]').addEventListener('click', () => { rpVolba = 'navrh'; prepocitej(); });
$('[data-rp-max]').addEventListener('click', () => { rpVolba = 'max'; prepocitej(); });
$('[data-rp-tlacitka]').hidden = false;
const akce = $('.rodicovska-akce-formulare');
if (akce) akce.hidden = false;

let sirkaOsy = $('[data-osa]').clientWidth;
const ro = new ResizeObserver(() => {
  const w = $('[data-osa]').clientWidth;
  if (Math.abs(w - sirkaOsy) > 2) { sirkaOsy = w; vykresliOsu(); }
});
ro.observe($('[data-osa]'));

pripojUlozeni({ id: 'rodicovska', ziskej, obnov });
prepocitej();
