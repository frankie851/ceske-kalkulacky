// Přijímačky bez paniky – klientský modul: simulátor, strategie a kalendář s exportem .ics.
// Pravidla bere z <script type="application/json" id="pravidla"> (žádný fetch), výpočty dělají
// převzaté moduly matching.js, strategy.js a ics.js, HTML skládá vystup.js (stejně jako build).
import { SCENARIOS } from './scenarios.js';
import { bestOfTwo, scoreOf } from './matching.js';
import { evaluateStrategy } from './strategy.js';
import { buildICS, downloadICS } from './ics.js';
import { stavZeScenare, normalizujDite, rozdelBody, spust, vyberTerminy, udalostiProIcs, casExportu } from './simulace.js';
import * as v from './vystup.js';
import { ty } from './texty.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const pravidla = JSON.parse(document.getElementById('pravidla').textContent);
const koren = document.getElementById('prij');
const sprite = koren.dataset.sprite;
const $ = (sel, k = koren) => k.querySelector(sel);
const $$ = (sel, k = koren) => [...k.querySelectorAll(sel)];
const omezitPohyb = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const TEMPO = 1300; // ms mezi koly při přehrávání

/** Číslo z pole: prázdné → null, čárka i mezery povolené, nesmysl → null. */
function cislo(hodnota) {
  const n = prectiCislo(hodnota);
  return Number.isFinite(n) ? n : null;
}

// S JavaScriptem: pryč s upozorněním pro verzi bez JS, odemknout ovládání simulátoru.
$('[data-bez-js]')?.remove();
$('[data-zamek]').disabled = false;

/* =================== SIMULÁTOR =================== */

const sim = { scenar: null, stav: null, beh: null, kolo: -1, hotovo: false, timer: null, seq: 0 };
const el = {
  info: $('[data-scenar-info]'),
  skoly: $('[data-editor-skol]'),
  deti: $('[data-editor-deti]'),
  rezim: $('[data-rezim]'),
  stav: $('[data-stav-kola]'),
  chyba: $('[data-sim-chyba]'),
  tabule: $('[data-tabule]'),
  kola: $('[data-kola]'),
  kolaPrazdne: $('[data-kola-prazdne]'),
  vysledek: $('#vysledek'),
  vysledekObsah: $('[data-vysledek-obsah]'),
  vysledekCeka: $('[data-vysledek-ceka]'),
  prehrat: $('[data-prehrat]'),
  krok: $('[data-krok]'),
  znovu: $('[data-znovu]'),
  zamichatPoznamka: $('[data-zamichat-poznamka]'),
};

function nactiScenar(id) {
  const sc = SCENARIOS.find((s) => s.id === id) ?? SCENARIOS[0];
  zastav();
  sim.scenar = sc;
  sim.stav = stavZeScenare(sc);
  for (const r of $$('input[name="scenar"]')) r.checked = r.value === sc.id;
  el.zamichatPoznamka.textContent = '';
  vykresliInfo();
  vykresliEditor();
  prepocitej();
}

function vlastniTrida() {
  if (!sim.scenar) return;
  sim.scenar = null;
  for (const r of $$('input[name="scenar"]')) r.checked = false;
  vykresliInfo();
}

function vykresliInfo() {
  el.info.innerHTML = v.scenarInfoHtml(sim.scenar);
}

function vykresliEditor() {
  el.rezim.checked = sim.stav.rezim === 'attempts';
  el.skoly.innerHTML = v.editorSkolHtml(sim.stav);
  el.deti.innerHTML = v.editorDetiHtml(sim.stav);
}

function prepocitej() {
  zastav();
  sim.beh = spust(sim.stav);
  sim.kolo = -1;
  sim.hotovo = false;
  vykresliPrubeh();
}

function vykresliPrubeh() {
  const { beh, stav, kolo, hotovo } = sim;
  const ok = Boolean(beh.vysledek);
  el.chyba.hidden = ok;
  el.chyba.textContent = ok ? '' : beh.chyba;
  el.stav.textContent = ok ? v.stavKola(beh, kolo, hotovo) : 'Simulace čeká na opravu údajů.';
  el.tabule.innerHTML = ok ? v.tabuleHtml(stav, beh, kolo) : '';
  el.kola.innerHTML = ok ? v.kolaHtml(stav, beh, kolo, hotovo) : '';
  el.kolaPrazdne.hidden = !ok || kolo >= 0;
  el.krok.disabled = !ok || hotovo;
  el.prehrat.disabled = !ok;
  el.vysledek.hidden = !(ok && hotovo);
  el.vysledekCeka.hidden = ok && hotovo;
  if (ok && hotovo) {
    const souhrn = v.souhrnVysledku(beh);
    $('.result-kicker', el.vysledek).textContent = sim.scenar ? `Scénář: ${sim.scenar.title}` : 'Vlastní třída';
    $('[data-vysledek-cislo]', el.vysledek).textContent = souhrn.cislo;
    $('[data-vysledek-popis]', el.vysledek).textContent = souhrn.popis;
    el.vysledekObsah.innerHTML = v.vysledekHtml(stav, beh, sim.scenar);
  }
}

function krok() {
  if (!sim.beh?.vysledek || sim.hotovo) return;
  const n = sim.beh.vysledek.rounds.length;
  if (sim.kolo < n - 1) sim.kolo++;
  // Po posledním kole se už nic nemění – výsledek je hotový.
  if (sim.kolo >= n - 1) sim.hotovo = true;
  vykresliPrubeh();
}

function prehrat() {
  if (sim.timer) { zastav(); return; }
  if (!sim.beh?.vysledek) return;
  if (sim.hotovo) { sim.kolo = -1; sim.hotovo = false; }
  el.prehrat.textContent = 'Pozastavit';
  const tik = () => {
    krok();
    if (sim.hotovo) zastav();
  };
  tik();
  if (!sim.hotovo) sim.timer = setInterval(tik, omezitPohyb() ? TEMPO * 1.5 : TEMPO);
}

function zastav() {
  if (sim.timer) clearInterval(sim.timer);
  sim.timer = null;
  el.prehrat.textContent = 'Přehrát';
}

function znovu() {
  zastav();
  sim.kolo = -1;
  sim.hotovo = false;
  vykresliPrubeh();
}

const skolaPodleRadku = (tr) => sim.stav.skoly.find((s) => s.id === tr.dataset.skola);
const ditePodleRadku = (tr) => sim.stav.deti.find((a) => a.id === tr.dataset.dite);
const aktualizujJmenoVRadku = (tr, jmeno) => {
  for (const s of $$('[data-sr-jmeno]', tr)) s.textContent = ` – ${jmeno}`;
};

// Školy: název a počet míst
el.skoly.addEventListener('input', (e) => {
  const tr = e.target.closest('tr[data-skola]');
  const s = tr && skolaPodleRadku(tr);
  if (!s) return;
  if (e.target.dataset.pole === 'name') {
    s.name = e.target.value;
    aktualizujJmenoVRadku(tr, s.name);
  } else if (e.target.dataset.pole === 'capacity') {
    s.capacity = Math.max(0, Math.floor(cislo(e.target.value) ?? 0));
  }
  vlastniTrida();
  prepocitej();
});
// Nový název školy se promítne do výběru priorit až po opuštění pole (ať pole neztratí fokus).
el.skoly.addEventListener('change', (e) => {
  if (e.target.dataset.pole === 'name') el.deti.innerHTML = v.editorDetiHtml(sim.stav);
});
el.skoly.addEventListener('click', (e) => {
  const tl = e.target.closest('[data-odebrat-skolu]');
  if (!tl || sim.stav.skoly.length <= 1) return;
  const id = tl.dataset.odebratSkolu;
  sim.stav.skoly = sim.stav.skoly.filter((s) => s.id !== id);
  for (const a of sim.stav.deti) a.priorities = a.priorities.map((p) => (p === id ? '' : p));
  vlastniTrida();
  vykresliEditor();
  prepocitej();
  $('[data-pridat-skolu]').focus();
});

// Děti: jméno, body nebo pokusy, priority, rozhodnutí při shodě
function zmenaDitete(e) {
  const tr = e.target.closest('tr[data-dite]');
  const a = tr && ditePodleRadku(tr);
  if (!a) return;
  const pole = e.target.dataset.pole;
  if (pole === 'name') {
    a.name = e.target.value;
    aktualizujJmenoVRadku(tr, a.name);
  } else if (pole === 'score') a.score = cislo(e.target.value);
  else if (pole === 'tiebreak') a.tiebreak = cislo(e.target.value);
  else if (/^(cj|m)[01]$/.test(pole)) {
    a.attempts[pole.slice(0, -1)][Number(pole.slice(-1))] = cislo(e.target.value);
    $('[data-zapocte]', tr).textContent = `${bestOfTwo(a.attempts)} b.`;
  } else if (/^pr[0-2]$/.test(pole)) a.priorities[Number(pole.slice(2))] = e.target.value;
  else return;
  vlastniTrida();
  prepocitej();
}
el.deti.addEventListener('input', zmenaDitete);
el.deti.addEventListener('change', (e) => { if (e.target.tagName === 'SELECT') zmenaDitete(e); });
el.deti.addEventListener('click', (e) => {
  const tl = e.target.closest('[data-odebrat-dite]');
  if (!tl) return;
  sim.stav.deti = sim.stav.deti.filter((a) => a.id !== tl.dataset.odebratDite);
  vlastniTrida();
  el.deti.innerHTML = v.editorDetiHtml(sim.stav);
  prepocitej();
  $('[data-pridat-dite]').focus();
});

function noveId(predpona) {
  const pouzite = new Set([...sim.stav.skoly, ...sim.stav.deti].map((x) => x.id));
  let id;
  do id = `${predpona}${++sim.seq}`; while (pouzite.has(id));
  return id;
}

$('[data-pridat-skolu]').addEventListener('click', () => {
  sim.stav.skoly.push({ id: noveId('s'), name: `Škola ${sim.stav.skoly.length + 1}`, capacity: 1 });
  vlastniTrida();
  vykresliEditor();
  prepocitej();
  $$('[data-editor-skol] tr[data-skola] input[data-pole="name"]').at(-1)?.focus();
});

$('[data-pridat-dite]').addEventListener('click', () => {
  // Body bez shody s ostatními, ať simulace hned běží (shodu musí škola rozhodnout).
  const obsazene = new Set(spust(sim.stav).deti.map((a) => scoreOf(a)));
  let body = 50;
  while (obsazene.has(body) && body > 0) body--;
  const dite = normalizujDite({ id: noveId('u'), name: `Dítě ${sim.stav.deti.length + 1}`, score: body, priorities: [sim.stav.skoly[0]?.id ?? ''] });
  if (sim.stav.rezim === 'attempts') dite.attempts = rozdelBody(body);
  sim.stav.deti.push(dite);
  vlastniTrida();
  el.deti.innerHTML = v.editorDetiHtml(sim.stav);
  prepocitej();
  $$('[data-editor-deti] tr[data-dite] input[data-pole="name"]').at(-1)?.focus();
});

$('[data-zamichat]').addEventListener('click', () => {
  const pred = JSON.stringify(sim.beh?.vysledek?.assignment ?? null);
  const deti = sim.stav.deti;
  for (let i = deti.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deti[i], deti[j]] = [deti[j], deti[i]];
  }
  el.deti.innerHTML = v.editorDetiHtml(sim.stav);
  prepocitej();
  const po = JSON.stringify(sim.beh?.vysledek?.assignment ?? null);
  el.zamichatPoznamka.textContent = pred === po
    ? 'Pořadí v tabulce se změnilo, výsledek zůstal stejný. Na pořadí zápisu nezáleží.'
    : 'Výsledek se změnil – to by se stát nemělo.';
});

el.rezim.addEventListener('change', () => {
  // Při přepnutí převeď body ↔ pokusy, ať simulace dává smysl.
  sim.stav.rezim = el.rezim.checked ? 'attempts' : 'score';
  for (const a of sim.stav.deti) {
    if (sim.stav.rezim === 'score') a.score = bestOfTwo(a.attempts);
    else if (a.score != null && bestOfTwo(a.attempts) !== a.score) a.attempts = rozdelBody(a.score);
  }
  vlastniTrida();
  el.deti.innerHTML = v.editorDetiHtml(sim.stav);
  prepocitej();
});

for (const r of $$('input[name="scenar"]')) r.addEventListener('change', () => { if (r.checked) nactiScenar(r.value); });
el.krok.addEventListener('click', () => { zastav(); krok(); });
el.prehrat.addEventListener('click', prehrat);
el.znovu.addEventListener('click', znovu);

nactiScenar($('input[name="scenar"]:checked')?.value ?? SCENARIOS[0].id);

/* =================== STRATEGIE =================== */

const formular = document.getElementById('strategie-formular');
const vystupStrategie = $('[data-strategie-vystup]');

function vyhodnotStrategii() {
  const rezerva = cislo(formular.querySelector('input[name="str-rezerva"]:checked')?.value) ?? 5;
  const res = evaluateStrategy({
    expected: cislo(formular.elements['str-ocekavane'].value),
    margin: rezerva,
    schools: [1, 2, 3].map((i) => ({
      name: formular.elements[`str-nazev-${i}`].value,
      lastMin: cislo(formular.elements[`str-min-${i}`].value),
    })),
  });
  vystupStrategie.innerHTML = v.strategieHtml(res, rezerva, sprite);
}
formular.addEventListener('input', vyhodnotStrategii);
formular.addEventListener('submit', (e) => { e.preventDefault(); vyhodnotStrategii(); });
vyhodnotStrategii();

/* =================== KALENDÁŘ =================== */

const kalendar = $('[data-kalendar]');
const kalendarStav = $('[data-kalendar-stav]');
const filtry = $$('[data-filtr]');

function vybraneTerminy() {
  return vyberTerminy(pravidla.events, filtry.filter((f) => f.checked).map((f) => f.value));
}

function vykresliKalendar() {
  const terminy = vybraneTerminy();
  kalendar.innerHTML = v.kalendarHtml(terminy, pravidla);
  kalendarStav.textContent = `Zobrazeno termínů: ${terminy.length}.`;
}

$('[data-filtry]').hidden = false;
$('[data-ics]').hidden = false;
$('[data-ics-odkaz]').hidden = true;
for (const f of filtry) f.addEventListener('change', vykresliKalendar);
vykresliKalendar();

$('[data-ics]').addEventListener('click', () => {
  const udalosti = udalostiProIcs(vybraneTerminy(), pravidla, {
    textPoznamky: ty,
    upozorneni: 'Informativní pomůcka – závazné jsou informace CERMAT a škol.',
  });
  downloadICS(buildICS(udalosti, { now: casExportu(pravidla), calName: 'Přijímačky 2027' }), 'prijimacky-2027.ics');
});
