// Cestovní příkaz 2027 – klientský modul. Čte hlavičku a cesty, počítá přes cesty.js (vystup.js)
// a aktualizuje stránku. Pravidla bere z <script type="application/json" id="pravidla"> (žádný fetch),
// žádné sazby tu nejsou natvrdo. Ukládá se JEN na kliknutí (sdílený modul uloziste.js).
import { PALIVA, pravidlaProDatum, hodinyPoDnech, pasmo, nazevPasma, formatMinuty } from './cesty.js';
import * as v from './vystup.js';
import { datum } from '../../js/format.js';
import { pripojUlozeni } from '../../js/uloziste.js';

const $ = (sel, koren = document) => koren.querySelector(sel);
const $$ = (sel, koren = document) => [...koren.querySelectorAll(sel)];

const rules = JSON.parse($('#pravidla').textContent);
const UKAZKA = JSON.parse($('#cp-ukazka').textContent);
const rSazby = rules[v.posledniRok(rules)];

const fh = $('#cp-hlavicka');
const fc = $('#cp-cesta');
let stav = structuredClone(UKAZKA);
let upravovana = null; // id upravované cesty
let jidlaRozpracovana = {}; // { 'RRRR-MM-DD': { s, o, v } }
let pocitadlo = 0;

const noveId = () => {
  do pocitadlo += 1; while (stav.cesty.some((c) => c.id === `c${pocitadlo}`));
  return `c${pocitadlo}`;
};

/* ---------- pomocné: čísla a chyby polí ---------- */

/** Číslo z textového pole: mezery pryč, desetinná čárka. Prázdné = null, nesmysl = NaN. */
function nactiCislo(id) {
  const t = String($(`#${id}`).value).replace(/[\s  ]/g, '').replace(',', '.');
  if (t === '') return null;
  return /^[-+]?\d*\.?\d+$/.test(t) ? Number(t) : NaN;
}

const naText = (n) => (n === null || n === undefined ? '' : String(n).replace('.', ','));

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

/* ---------- hlavička ---------- */

function naplnHlavicku() {
  const h = stav.hlavicka;
  $('#firma').value = h.firma || '';
  $('#kdo').value = h.kdo || '';
  const radio = $(`#sfera-${h.sfera}`);
  if (radio) radio.checked = true;
  [0, 1, 2].forEach((i) => {
    $(`#kraceni${i}`).value = naText(h.kraceniPct?.[i] ?? rSazby.kraceniMaxPct[i]);
    $(`#verejna${i}`).value = naText(h.stravneVerejna?.[i]);
  });
  $('#spz').value = h.vozidlo.spz || '';
  $('#druh').value = h.vozidlo.druh;
  $('#palivo').value = h.vozidlo.palivo;
  $('#spotreba').value = naText(h.vozidlo.spotreba);
  ['spotreba', 'kraceni0', 'kraceni1', 'kraceni2', 'verejna0', 'verejna1', 'verejna2'].forEach((id) => nastavChybu(id, ''));
  prepniHlavicku();
}

/** Přepne viditelnost krácení / veřejné sféry a jednotky podle paliva. */
function prepniHlavicku() {
  const sfera = fh.querySelector('input[name="sfera"]:checked')?.value || 'soukroma';
  $('#cp-kraceni').hidden = sfera !== 'soukroma';
  $('#cp-verejna').hidden = sfera !== 'verejna';
  const jedn = PALIVA[$('#palivo').value]?.jednotka ?? 'l';
  const nastavJednotku = (id, text) => {
    const pole = $(`#${id}`).closest('.field');
    $('.unit', pole).textContent = text;
    const sr = $(`#${id}-napoveda .sr-only`);
    if (sr) sr.textContent = `V jednotkách ${text}. `;
  };
  nastavJednotku('spotreba', `${jedn}/100 km`);
  nastavJednotku('cena', `Kč/${jedn}`);
}

/** Přečte hlavičku. Neplatná pole označí a ponechá jejich poslední platnou hodnotu. */
function prectiHlavicku() {
  const h = stav.hlavicka;
  const sfera = fh.querySelector('input[name="sfera"]:checked')?.value || 'soukroma';
  const kraceni = [0, 1, 2].map((i) => {
    const id = `kraceni${i}`;
    const max = rSazby.kraceniMaxPct[i];
    const n = nactiCislo(id);
    if (n === null) { nastavChybu(id, ''); return max; }
    if (!Number.isFinite(n) || n < 0 || n > max) {
      nastavChybu(id, `Nejvýš ${max} %.`);
      return h.kraceniPct?.[i] ?? max;
    }
    nastavChybu(id, '');
    return n;
  });
  const verejna = [0, 1, 2].map((i) => {
    const id = `verejna${i}`;
    const min = rSazby.stravne.verejnaMin[i];
    const max = rSazby.stravne.verejnaMax[i];
    const n = nactiCislo(id);
    if (n === null) { nastavChybu(id, ''); return null; }
    if (!Number.isFinite(n) || n < min || n > max) {
      nastavChybu(id, `Jen ${min}–${max} Kč.`);
      return h.stravneVerejna?.[i] ?? null;
    }
    nastavChybu(id, '');
    return n;
  });
  const sp = nactiCislo('spotreba');
  let spotreba = sp;
  if (sp !== null && (!Number.isFinite(sp) || sp <= 0 || sp > 100)) {
    nastavChybu('spotreba', 'Zadej spotřebu jako kladné číslo, třeba 6,5.');
    spotreba = h.vozidlo.spotreba;
  } else nastavChybu('spotreba', '');

  stav.hlavicka = {
    firma: $('#firma').value.trim(),
    kdo: $('#kdo').value.trim(),
    sfera,
    kraceniPct: kraceni,
    stravneVerejna: verejna,
    vozidlo: { spz: $('#spz').value.trim().toUpperCase(), druh: $('#druh').value, palivo: $('#palivo').value, spotreba },
  };
}

/** Bez spotřeby nejde spočítat cesta autem – ukaž to u pole spotřeby. */
function zkontrolujSpotrebu() {
  const chybi = !(Number(stav.hlavicka.vozidlo.spotreba) > 0);
  if (chybi && stav.cesty.some((c) => c.km > 0)) {
    nastavChybu('spotreba', 'Vyplň spotřebu z technického průkazu. Bez ní nespočítáme náhradu za auto.');
    return false;
  }
  if (chybi && $('#spotreba').value.trim() === '') nastavChybu('spotreba', '');
  return !chybi;
}

/* ---------- formulář cesty ---------- */

/** Ověří odjezd a návrat. Vrátí dny cesty, nebo null (chyby ukáže u polí). */
function overTermin({ povinne = false } = {}) {
  const odjezd = $('#odjezd').value;
  const navrat = $('#navrat').value;
  nastavChybu('odjezd', '');
  nastavChybu('navrat', '');
  if (!odjezd || !navrat) {
    if (povinne && !odjezd) nastavChybu('odjezd', 'Vyplň datum a čas odjezdu.');
    if (povinne && !navrat) nastavChybu('navrat', 'Vyplň datum a čas návratu.');
    return null;
  }
  let dny;
  try {
    dny = hodinyPoDnech(odjezd, navrat);
  } catch (e) {
    nastavChybu('navrat', /31/.test(e.message)
      ? 'Cesta je delší než 31 dní. Rozděl ji na víc cest.'
      : 'Návrat musí být později než odjezd.');
    return null;
  }
  for (const d of dny) {
    try {
      pravidlaProDatum(rules, d.datum);
    } catch {
      const rok = d.datum.slice(0, 4);
      nastavChybu(d.datum === dny[0].datum ? 'odjezd' : 'navrat', v.textChybySazby(rules, rok));
      return null;
    }
  }
  return dny;
}

function vykresliJidla() {
  const box = $('[data-cp-jidla]');
  const dny = overTermin();
  if (!dny) {
    box.innerHTML = `<p class="small muted mb-0">${$('#odjezd').value && $('#navrat').value
      ? 'Dny cesty se ukážou, až bude termín v pořádku.'
      : 'Nejdřív vyplň odjezd a návrat. Pak se tu ukážou dny cesty.'}</p>`;
    return;
  }
  box.innerHTML = `<ul class="cp-dny">${dny.map((d) => {
    const p = pasmo(d.minuty);
    const j = jidlaRozpracovana[d.datum] ?? {};
    const popis = `${formatMinuty(d.minuty)} · ${p < 0 ? 'pod 5 h, stravné nenáleží' : nazevPasma(p)}`;
    if (p < 0) return `<li class="cp-den"><p class="mb-0"><strong>${datum(d.datum)}</strong> <span class="muted">${popis}</span></p></li>`;
    return `<li class="cp-den"><fieldset><legend><strong>${datum(d.datum)}</strong> <span class="muted">${popis}</span></legend>
      <div class="cp-jidla">${v.JIDLA.map(([k, n]) => {
        const id = `jidlo-${d.datum}-${k}`;
        return `<span class="cp-jidlo"><input type="checkbox" id="${id}" data-den="${d.datum}" data-jidlo="${k}"${j[k] ? ' checked' : ''}><label for="${id}">${n}</label></span>`;
      }).join('')}</div></fieldset></li>`;
  }).join('')}</ul>`;
}

function resetCesty() {
  fc.reset();
  upravovana = null;
  jidlaRozpracovana = {};
  ['odjezd', 'navrat', 'odkud', 'kam', 'ucel', 'km', 'cena'].forEach((id) => nastavChybu(id, ''));
  $('[data-cp-pridat]').textContent = 'Přidat cestu';
  $('[data-cp-zrusit]').hidden = true;
  $('#krok-cesta .step-title').textContent = '2. Přidat cestu';
  vykresliJidla();
}

/** Přečte a ověří cestu. Vrátí cestu, nebo null (chyby ukáže u polí). */
function prectiCestu() {
  let ok = true;
  const dny = overTermin({ povinne: true });
  if (!dny) ok = false;
  const text = (id, chyba) => {
    const t = $(`#${id}`).value.trim();
    nastavChybu(id, t ? '' : chyba);
    if (!t) ok = false;
    return t;
  };
  const odkud = text('odkud', 'Vyplň, odkud cesta začíná.');
  const kam = text('kam', 'Vyplň, kam se jede.');
  const ucel = text('ucel', 'Vyplň účel cesty, třeba jednání s klientem.');

  const km = nactiCislo('km');
  if (km === null) { nastavChybu('km', 'Vyplň ujeté km. Bez auta napiš 0.'); ok = false; }
  else if (!Number.isFinite(km) || km < 0) { nastavChybu('km', 'Zadej km jako kladné číslo, třeba 120 nebo 12,5.'); ok = false; }
  else if (km > 20000) { nastavChybu('km', 'Tolik km za jednu cestu? Zkontroluj číslo.'); ok = false; }
  else nastavChybu('km', '');

  const cena = nactiCislo('cena');
  if (cena !== null && (!Number.isFinite(cena) || cena <= 0)) {
    nastavChybu('cena', 'Zadej cenu jako kladné číslo, třeba 38,90. Bez dokladu nech pole prázdné.');
    ok = false;
  } else nastavChybu('cena', '');

  if (ok && km > 0 && !(Number(stav.hlavicka.vozidlo.spotreba) > 0)) {
    nastavChybu('spotreba', 'Vyplň spotřebu z technického průkazu. Bez ní nespočítáme náhradu za auto.');
    $('#krok-hlavicka').open = true;
    $('#spotreba').focus();
    return null;
  }
  if (!ok) return null;

  const jidla = {};
  for (const d of dny) {
    const j = jidlaRozpracovana[d.datum];
    if (j && v.JIDLA.some(([k]) => j[k])) jidla[d.datum] = { ...j };
  }
  return {
    id: upravovana || noveId(),
    odjezd: $('#odjezd').value,
    navrat: $('#navrat').value,
    odkud, kam, km, ucel,
    cenaDoklad: cena,
    jidla,
  };
}

function upravCestu(id) {
  const c = stav.cesty.find((x) => x.id === id);
  if (!c) return;
  resetCesty();
  upravovana = c.id;
  $('#odjezd').value = c.odjezd;
  $('#navrat').value = c.navrat;
  $('#odkud').value = c.odkud || '';
  $('#kam').value = c.kam || '';
  $('#ucel').value = c.ucel || '';
  $('#km').value = naText(c.km);
  $('#cena').value = naText(c.cenaDoklad);
  jidlaRozpracovana = structuredClone(c.jidla ?? {});
  $('[data-cp-pridat]').textContent = 'Uložit změny';
  $('[data-cp-zrusit]').hidden = false;
  $('#krok-cesta .step-title').textContent = '2. Upravit cestu';
  vykresliJidla();
  $('#krok-cesta').open = true;
  $('#krok-cesta').scrollIntoView({ block: 'start' });
  $('#odjezd').focus({ preventScroll: true });
}

/* ---------- vykreslení ---------- */

function oznam(text) {
  const el = $('[data-cp-oznameni]');
  el.textContent = '';
  requestAnimationFrame(() => { el.textContent = text; });
}

function vykresli() {
  const vysledek = v.vypocitej(stav, rules);
  const cislo = v.hlavniCislo(vysledek);
  $('#vysledek [data-vysledek-cislo]').textContent = cislo;
  $('#vysledek [data-vysledek-popis]').textContent = v.popisVysledku(vysledek);
  $('[data-cp-statistiky]').innerHTML = v.statistiky(vysledek);
  $('[data-lista-cislo]').textContent = cislo;
  $('[data-cp-seznam]').innerHTML = v.seznam(vysledek);
  $('[data-cp-vyuctovani]').innerHTML = v.vyuctovani(stav, vysledek, rules);
  $('[data-cp-ukazka-pozn]').hidden = !stav.cesty.some((c) => /^u\d+$/.test(c.id));
  $('[data-cp-nacisto]').hidden = !stav.cesty.length;
  $('[data-cp-tisk]').disabled = !vysledek.ok.length;
  const h = stav.hlavicka;
  $('#krok-hlavicka .step-sum').textContent = [h.firma, h.kdo, h.vozidlo.spz].filter(Boolean).join(' · ') || 'Zatím nevyplněno';
  zkontrolujSpotrebu();
}

/* ---------- události ---------- */

fh.addEventListener('submit', (e) => e.preventDefault());
fh.addEventListener('input', () => { prepniHlavicku(); prectiHlavicku(); vykresli(); });
fh.addEventListener('change', () => { prepniHlavicku(); prectiHlavicku(); vykresli(); });

$('#odjezd').addEventListener('change', () => {
  // Návrat předvyplníme na stejný den, když je prázdný
  if (!$('#navrat').value && $('#odjezd').value) $('#navrat').value = $('#odjezd').value;
  vykresliJidla();
});
$('#navrat').addEventListener('change', vykresliJidla);
$('[data-cp-jidla]').addEventListener('change', (e) => {
  const t = e.target;
  if (!t.dataset.den) return;
  jidlaRozpracovana[t.dataset.den] ??= {};
  jidlaRozpracovana[t.dataset.den][t.dataset.jidlo] = t.checked;
});

fc.addEventListener('submit', (e) => {
  e.preventDefault();
  const cesta = prectiCestu();
  if (!cesta) {
    const prvni = fc.querySelector('[aria-invalid="true"]');
    if (prvni) prvni.focus();
    return;
  }
  const r = v.vypocitejCestu(stav.hlavicka, cesta, rules);
  if (!r.ok) {
    nastavChybu(r.sazby ? 'odjezd' : 'km', r.zprava);
    return;
  }
  const nova = !stav.cesty.some((x) => x.id === cesta.id);
  stav.cesty = nova ? [...stav.cesty, cesta] : stav.cesty.map((x) => (x.id === cesta.id ? cesta : x));
  stav.cesty.sort((a, b) => a.odjezd.localeCompare(b.odjezd));
  resetCesty();
  vykresli();
  oznam(`${nova ? 'Cesta přidána' : 'Změny uloženy'}. Náhrady celkem ${v.hlavniCislo(v.vypocitej(stav, rules))}.`);
});
$('[data-cp-zrusit]').addEventListener('click', () => { resetCesty(); oznam('Úprava zrušena.'); });

$('[data-cp-seznam]').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-akce]');
  if (!b) return;
  const id = b.dataset.id;
  if (b.dataset.akce === 'upravit') upravCestu(id);
  if (b.dataset.akce === 'smazat') {
    stav.cesty = stav.cesty.filter((x) => x.id !== id);
    if (upravovana === id) resetCesty();
    vykresli();
    $('#cp-seznam-nadpis').setAttribute('tabindex', '-1');
    $('#cp-seznam-nadpis').focus();
    oznam(`Cesta smazána. Náhrady celkem ${v.hlavniCislo(v.vypocitej(stav, rules))}.`);
  }
});

$('[data-cp-nacisto]').addEventListener('click', () => {
  stav.cesty = [];
  stav.hlavicka = { ...stav.hlavicka, firma: '', kdo: '', vozidlo: { ...stav.hlavicka.vozidlo, spz: '' } };
  naplnHlavicku();
  resetCesty();
  vykresli();
  $('#krok-hlavicka').open = true;
  $('#firma').focus();
  oznam('Seznam cest je prázdný. Začni hlavičkou.');
});

$('[data-cp-tisk]').addEventListener('click', () => window.print());

/** Uložená data mají tvar { hlavicka, cesty }. Cizí nebo poškozená data nepoužijeme. */
function platnyStav(d) {
  return d && typeof d === 'object' && d.hlavicka && d.hlavicka.vozidlo && Array.isArray(d.cesty)
    && d.cesty.every((c) => c && typeof c.id === 'string' && typeof c.odjezd === 'string' && typeof c.navrat === 'string');
}

pripojUlozeni({
  id: 'cestovni-prikaz',
  ziskej: () => structuredClone(stav),
  obnov: (data) => {
    if (!platnyStav(data)) { oznam('Uložená data nejde načíst.'); return; }
    stav = structuredClone(data);
    naplnHlavicku();
    resetCesty();
    vykresli();
  },
});

/* ---------- start ---------- */

$('[data-cp-akce]').hidden = false;
$('[data-cp-tisk]').hidden = false;
naplnHlavicku();
prectiHlavicku();
resetCesty();
vykresli();
