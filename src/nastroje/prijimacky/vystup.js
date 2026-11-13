// Přijímačky bez paniky – výstup jako HTML řetězce. Sdílí ho build (ukázka v prijimacky.11tydata.js)
// i prohlížeč (ui.js), takže stránka bez JavaScriptu i s ním vypadá stejně. Žádný DOM.
// Všechna data jdou přes esc(); termíny a pravidla z rules.json, výpočet z matching.js a strategy.js.
import { scoreOf, bestOfTwo } from './matching.js';
import { pocetKol, rozsahTerminu, denMesic, denVTydnu, poMesicich } from './simulace.js';
import { ty, KATEGORIE, KATEGORIE_POPIS, textUpozorneni, SKUPINY, STAV_TERMINU } from './texty.js';
import { esc } from '../../js/graf.js';
import { cislo as formatCislo } from '../../js/format.js';

const NBSP = ' ';

/** Body zaokrouhlené na setiny a počet desetinných míst pro výpis (62 → 0, 62,5 → 1). */
function setiny(n) {
  const r = Math.round(n * 100) / 100;
  const des = Number.isInteger(r) ? 0 : Math.abs(r * 10 - Math.round(r * 10)) < 1e-9 ? 1 : 2;
  return { r, des };
}

/** Body česky: 62 → „62 b.“, 62.5 → „62,5 b.“ (desetinná čárka, revize PRI-03). */
export function b(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return `–${NBSP}b.`;
  const { r, des } = setiny(n);
  return `${formatCislo(r, des)}${NBSP}b.`;
}

/** SVG ikona ze spritu (sprite = URL souboru sprite.svg včetně pathPrefix). */
export function ikona(id, sprite, trida = '') {
  return `<svg class="ikona${trida ? ` ${trida}` : ''}" aria-hidden="true" focusable="false"><use href="${esc(sprite)}#${esc(id)}"/></svg>`;
}

const mist = (n) => (n === 1 ? 'místo' : n >= 2 && n <= 4 ? 'místa' : 'míst');
const nazevSkoly = (stav, id) => stav.skoly.find((s) => s.id === id)?.name || id;

/* ---------- Scénář ---------- */

export function scenarInfoHtml(sc) {
  if (!sc) {
    return '<h3>Vlastní třída</h3><p>Data scénáře jsou upravená. Simulace běží na tvých údajích.</p>';
  }
  return `<h3>${esc(sc.title)}</h3><p>${esc(ty(sc.lead))}</p>`
    + `<p><strong>Co sledovat:</strong> ${esc(ty(sc.watch))}</p>`;
}

/* ---------- Editor škol a dětí ---------- */

/** Hodnota číselného pole: prázdné, nebo číslo s desetinnou čárkou („62,5“). */
const cislo = (v) => {
  if (typeof v !== 'number' || !Number.isFinite(v)) return '';
  return String(setiny(v).r).replace('.', ',');
};

/**
 * Hláška u pole stejně jako makro pole() (třída error-msg, id „<id>-chyba“). Bez chyby je skrytá,
 * ui.js ji při psaní jen přepíná, aby pole neztratilo fokus.
 */
export function chybaPoleHtml(id, text = '', sprite = '') {
  return `<p class="error-msg" id="${esc(id)}-chyba"${text ? '' : ' hidden'}>${sprite ? ikona('ikona-vystraha', sprite) : ''}`
    + `<span><span class="sr-only">Chyba: </span><span class="error-text">${esc(text)}</span></span></p>`;
}

/**
 * Pole editoru. Číselná pole jsou type="text" s inputmode, takže desetinná čárka nezávisí na jazyku
 * prohlížeče (PRI-03). chyba = { text, hodnota } z ui.js: pole ukáže zapsaný text a hlášku (PRI-02).
 */
function vstup({ id, label, sr = '', hodnota, typ = 'cislo', cele = false, pole, maxlength, chyba, sprite = '' }) {
  const ciselne = typ === 'cislo';
  const atributy = ciselne
    ? ` type="text" inputmode="${cele ? 'numeric' : 'decimal'}" class="prij-cislo"`
    : ` type="text"${maxlength ? ` maxlength="${maxlength}"` : ''}`;
  const chybaAtr = chyba ? ` aria-invalid="true" aria-describedby="${id}-chyba"` : '';
  return `<label class="prij-pole" for="${id}"><span class="prij-lbl">${esc(label)}</span>${sr ? `<span class="sr-only" data-sr-jmeno> – ${esc(sr)}</span>` : ''}</label>`
    + `<input id="${id}"${atributy} value="${esc(chyba ? chyba.hodnota : hodnota)}" data-pole="${pole}" autocomplete="off"${chybaAtr}>`
    + (ciselne ? chybaPoleHtml(id, chyba?.text, sprite) : '');
}

/** volby: { chyby: Map(id pole → { text, hodnota }), sprite } – předává jen ui.js. */
export function editorSkolHtml(stav, { chyby = new Map(), sprite = '' } = {}) {
  const radky = stav.skoly.map((s) => `<tr data-skola="${esc(s.id)}">`
    + `<td>${vstup({ id: `skola-${s.id}-nazev`, label: 'Název školy', hodnota: s.name, typ: 'text', maxlength: 40, pole: 'name' })}</td>`
    + `<td>${vstup({ id: `skola-${s.id}-mist`, label: 'Počet míst', sr: s.name, hodnota: cislo(s.capacity), cele: true, pole: 'capacity', chyba: chyby.get(`skola-${s.id}-mist`), sprite })}</td>`
    + `<td class="prij-akce-bunka"><button type="button" class="prij-odebrat" data-odebrat-skolu="${esc(s.id)}"${stav.skoly.length <= 1 ? ' disabled' : ''}>Odebrat<span class="sr-only" data-sr-jmeno> – ${esc(s.name)}</span></button></td>`
    + '</tr>').join('');
  return '<div class="table-wrap prij-edit-obal" role="region" aria-label="Tabulka: školy a počet míst" tabindex="0">'
    + '<table class="prij-edit prij-edit-skoly"><caption>Školy</caption>'
    + '<thead><tr><th scope="col">Název školy</th><th scope="col">Počet míst</th><th scope="col"><span class="sr-only">Akce</span></th></tr></thead>'
    + `<tbody>${radky}</tbody></table></div>`;
}

function volbyPriority(stav, vybrano) {
  return '<option value="">–</option>' + stav.skoly.map((s) =>
    `<option value="${esc(s.id)}"${s.id === vybrano ? ' selected' : ''}>${esc(s.name || s.id)}</option>`).join('');
}

export function editorDetiHtml(stav, { chyby = new Map(), sprite = '' } = {}) {
  const pokusy = stav.rezim === 'attempts';
  const hlavicka = ['Jméno',
    ...(pokusy ? ['ČJL 1. pokus', 'ČJL 2. pokus', 'M 1. pokus', 'M 2. pokus', 'Započte se'] : ['Body']),
    '1. priorita', '2. priorita', '3. priorita', 'Při shodě bodů'];
  const radky = stav.deti.map((a) => {
    const p = `dite-${a.id}`;
    const pole = (id, dalsi) => ({ id, sr: a.name, chyba: chyby.get(id), sprite, ...dalsi });
    const idPokusu = ['cj0', 'cj1', 'm0', 'm1'].map((k) => `${p}-${k}`);
    const body = pokusy
      ? [['cj', 0, 'ČJL 1. pokus'], ['cj', 1, 'ČJL 2. pokus'], ['m', 0, 'M 1. pokus'], ['m', 1, 'M 2. pokus']].map(([pr, k, l]) =>
        `<td>${vstup(pole(`${p}-${pr}${k}`, { label: l, hodnota: cislo(a.attempts[pr][k]), pole: `${pr}${k}` }))}</td>`).join('')
        + `<td class="prij-zapocte"><span class="prij-lbl" aria-hidden="true">Započte se</span><output data-zapocte for="${idPokusu.join(' ')}">${idPokusu.some((id) => chyby.has(id)) ? '–' : b(bestOfTwo(a.attempts))}</output></td>`
      : `<td>${vstup(pole(`${p}-body`, { label: 'Body', hodnota: cislo(a.score), pole: 'score' }))}</td>`;
    const priority = [0, 1, 2].map((k) => `<td><label class="prij-pole" for="${p}-pr${k}"><span class="prij-lbl">${k + 1}. priorita</span><span class="sr-only" data-sr-jmeno> – ${esc(a.name)}</span></label>`
      + `<select id="${p}-pr${k}" data-pole="pr${k}">${volbyPriority(stav, a.priorities[k])}</select></td>`).join('');
    return `<tr data-dite="${esc(a.id)}">`
      + `<td>${vstup({ id: `${p}-jmeno`, label: 'Jméno', hodnota: a.name, typ: 'text', maxlength: 30, pole: 'name' })}</td>`
      + body + priority
      + `<td>${vstup(pole(`${p}-shoda`, { label: 'Při shodě bodů', hodnota: cislo(a.tiebreak), pole: 'tiebreak' }))}</td>`
      + `<td class="prij-akce-bunka"><button type="button" class="prij-odebrat" data-odebrat-dite="${esc(a.id)}">Odebrat<span class="sr-only" data-sr-jmeno> – ${esc(a.name)}</span></button></td>`
      + '</tr>';
  }).join('');
  return '<div class="table-wrap prij-edit-obal" role="region" aria-label="Tabulka: děti ve třídě, body a priority" tabindex="0">'
    + `<table class="prij-edit prij-edit-deti${pokusy ? ' prij-edit-pokusy' : ''}"><caption>Děti ve třídě</caption>`
    + `<thead><tr>${hlavicka.map((h) => `<th scope="col">${h}</th>`).join('')}<th scope="col"><span class="sr-only">Akce</span></th></tr></thead>`
    + `<tbody>${radky}</tbody></table></div>`;
}

/* ---------- Průběh kol ---------- */

/** Text stavu: „Připraveno (3 kola)“, „Kolo 2 ze 3“, „Hotovo…“. */
export function stavKola(beh, kolo, hotovo) {
  if (!beh.vysledek) return '';
  const n = beh.vysledek.rounds.length;
  if (hotovo) return `Hotovo po ${n} ${n === 1 ? 'kole' : 'kolech'}. Výsledek se už nemění.`;
  if (kolo < 0) return `Připraveno: ${pocetKol(n)}. Spusť Přehrát nebo Krok.`;
  return `Kolo ${kolo + 1} z ${n}`;
}

function zak(a, { trida = '', stitek = '', novy = false } = {}) {
  return `<li class="prij-zak${trida ? ` ${trida}` : ''}">`
    + `<span class="prij-zak-jmeno">${esc(a.name)}${novy ? '<span class="sr-only"> (nově)</span>' : ''}</span>`
    + (stitek ? `<span class="prij-zak-stitek">${esc(stitek)}</span>` : '')
    + `<span class="prij-zak-body">${b(scoreOf(a))}</span></li>`;
}

/** Přehled kola: sloupec za každou školu + kdo je zatím bez místa. kolo = -1 před startem. */
export function tabuleHtml(stav, beh, kolo) {
  const r = beh.vysledek;
  if (!r) return '';
  const byId = new Map(beh.deti.map((a) => [a.id, a]));
  const cur = kolo >= 0 ? r.rounds[kolo] : null;
  const sloupce = stav.skoly.map((s) => {
    const drzi = cur ? cur.held[s.id] ?? [] : [];
    const nove = new Set(cur ? cur.proposals.filter((p) => p.school === s.id).map((p) => p.applicant) : []);
    const odmitnuti = cur ? cur.rejected.filter((x) => x.school === s.id) : [];
    const mista = [];
    const kapacita = Math.max(0, Math.floor(s.capacity ?? 0));
    for (let k = 0; k < Math.max(kapacita, drzi.length); k++) {
      const a = byId.get(drzi[k]);
      if (a) {
        const novy = nove.has(a.id);
        mista.push(zak(a, { trida: novy ? 'prij-zak-novy' : '', stitek: `${a.priorities.indexOf(s.id) + 1}. priorita`, novy }));
      } else mista.push('<li class="prij-zak prij-zak-volno">volné místo</li>');
    }
    if (!kapacita) mista.push('<li class="prij-zak prij-zak-volno">žádné místo</li>');
    const odm = odmitnuti.length
      ? `<p class="prij-odmitnuti-h">Odmítá v tomto kole:</p><ul class="prij-mista">${odmitnuti.map((x) =>
        zak(byId.get(x.applicant), { trida: 'prij-zak-ven', stitek: x.reason === 'kriteria' ? 'nesplňuje kritéria' : 'horší pořadí' })).join('')}</ul>`
      : '';
    return `<li class="prij-sloupec"><h4>${esc(s.name || s.id)} <span class="prij-obsazeno">${drzi.length}/${kapacita} ${mist(kapacita)}</span></h4>`
      + `<ul class="prij-mista">${mista.join('')}</ul>${odm}</li>`;
  });

  const drziTed = new Set(cur ? Object.values(cur.held).flat() : []);
  const dalsi = new Map(beh.deti.map((a) => [a.id, 0]));
  if (cur) for (const rd of r.rounds.slice(0, kolo + 1)) for (const p of rd.proposals) dalsi.set(p.applicant, p.priority);
  const cekaji = beh.deti.filter((a) => !drziTed.has(a.id));
  const platne = (a) => a.priorities.filter((p) => stav.skoly.some((s) => s.id === p));
  const bezMista = cekaji.length
    ? `<ul class="prij-mista">${cekaji.map((a) => {
      const k = dalsi.get(a.id);
      const pr = platne(a);
      if (kolo < 0) return zak(a, { trida: 'prij-zak-ceka', stitek: pr.length ? `1. ${nazevSkoly(stav, pr[0])}` : 'bez přihlášky' });
      if (k < pr.length) return zak(a, { trida: 'prij-zak-ceka', stitek: `příště ${k + 1}. ${nazevSkoly(stav, pr[k])}` });
      return zak(a, { trida: 'prij-zak-nic', stitek: 'žádná další priorita' });
    }).join('')}</ul>`
    : '<p class="small muted">Všichni mají aspoň dočasné místo.</p>';
  const trida = `<div class="prij-sloupec prij-sloupec-trida"><h4>${kolo < 0 ? 'Třída před rozřazením' : 'Zatím bez místa'}</h4>${bezMista}</div>`;
  return `<ul class="prij-tabule">${sloupce.join('')}</ul>${trida}`;
}

/** Tabulka za každé proběhlé kolo: kdo se hlásí, koho škola drží a koho odmítá. */
export function kolaHtml(stav, beh, kolo, hotovo) {
  const r = beh.vysledek;
  if (!r || kolo < 0) return '';
  const byId = new Map(beh.deti.map((a) => [a.id, a]));
  const jm = (id) => `${byId.get(id).name} (${b(scoreOf(byId.get(id)))})`;
  return r.rounds.slice(0, kolo + 1).map((rd, i) => {
    const skoly = [...new Set(rd.proposals.map((p) => p.school))];
    const radky = skoly.map((sid) => {
      const hlasi = rd.proposals.filter((p) => p.school === sid)
        .map((p) => `${byId.get(p.applicant).name} (${p.priority}. priorita, ${b(scoreOf(byId.get(p.applicant)))})`);
      const drzi = rd.held[sid].map(jm);
      const odm = rd.rejected.filter((x) => x.school === sid)
        .map((x) => `${jm(x.applicant)}${x.reason === 'kriteria' ? ' – nesplňuje kritéria' : ''}`);
      return `<tr><th scope="row">${esc(nazevSkoly(stav, sid))}</th>`
        + `<td data-label="Hlásí se">${esc(hlasi.join(', '))}</td>`
        + `<td data-label="Drží zatím">${esc(drzi.join(', ') || 'nikoho')}</td>`
        + `<td data-label="Odmítá">${esc(odm.join(', ') || '–')}</td></tr>`;
    }).join('');
    const aktualni = i === kolo && !hotovo;
    const nadpis = `Kolo ${i + 1}: ${i === 0 ? 'všichni se hlásí na 1. prioritu' : 'odmítnutí zkoušejí další prioritu'}`;
    return `<div class="table-wrap prij-kolo${aktualni ? ' prij-kolo-aktualni' : ''}" role="region" aria-label="Tabulka: kolo ${i + 1}" tabindex="0">`
      + `<table class="stack-table"><caption>${nadpis}</caption>`
      + '<thead><tr><th scope="col">Škola</th><th scope="col">Hlásí se</th><th scope="col">Drží zatím</th><th scope="col">Odmítá</th></tr></thead>'
      + `<tbody>${radky}</tbody></table></div>`;
  }).join('');
}

/* ---------- Výsledek ---------- */

/** Drobná jazyková úprava vět z explain() (modul je převzatý beze změny). */
export function upravVetu(veta) {
  // Desetinná tečka v bodech → čárka („59.5 b.“ → „59,5 b.“); „1. priorita“ se nezmění.
  return veta.replace(/(\d)\.(\d)/g, '$1,$2').replace(/všech (\d+) míst obsadili uchazeči s lepším pořadím/, (cele, n) => {
    const k = Number(n);
    if (k === 1) return 'jediné místo obsadil někdo s lepším pořadím';
    if (k === 2) return 'obě místa obsadili uchazeči s lepším pořadím';
    if (k <= 4) return `všechna ${k} místa obsadili uchazeči s lepším pořadím`;
    return cele;
  });
}

/** Hlavní číslo karty výsledku: „6 z 6“ + popis. */
export function souhrnVysledku(beh) {
  const r = beh.vysledek;
  const celkem = beh.deti.length;
  const prijato = r ? Object.values(r.assignment).filter(Boolean).length : 0;
  const tvar = (n) => (n === 1 ? 'dítě má' : n >= 2 && n <= 4 ? 'děti mají' : 'dětí má');
  return { cislo: `${prijato} z ${celkem}`, popis: `${tvar(celkem)} po 1. kole místo na škole` };
}

/** Seznam „kdo kam a proč“ (vysvětlení z explain()). */
export function vysledekHtml(stav, beh, scenar) {
  const r = beh.vysledek;
  if (!r) return '';
  const serazeni = [...beh.deti].sort((a, c) => scoreOf(c) - scoreOf(a) || (c.tiebreak ?? 0) - (a.tiebreak ?? 0));
  const polozky = serazeni.map((a) => {
    const skola = r.assignment[a.id];
    const stitek = skola
      ? `<span class="badge badge-ok">${esc(nazevSkoly(stav, skola))} · ${a.priorities.indexOf(skola) + 1}. priorita</span>`
      : '<span class="badge prij-badge-nic">V 1. kole bez místa</span>';
    return `<li class="prij-vysl${skola ? '' : ' prij-vysl-nic'}" data-uchazec="${esc(a.id)}" data-skola="${esc(skola ?? '')}">`
      + `<p class="prij-vysl-hlava"><strong>${esc(a.name)}</strong> <span class="num muted">${b(scoreOf(a))}</span> ${stitek}</p>`
      + `<ul class="prij-proc">${(beh.proc[a.id] ?? []).map((t) => `<li>${esc(upravVetu(t))}</li>`).join('')}</ul></li>`;
  }).join('');
  const odnest = scenar ? `<p class="prij-odnest"><strong>Co si odnést:</strong> ${esc(ty(scenar.takeaway))}</p>` : '';
  return `<h3 class="h-lg">Kdo kam a proč</h3><ul class="prij-vysledky">${polozky}</ul>${odnest}`;
}

/* ---------- Strategie ---------- */

export function strategieHtml(res, rezerva, sprite) {
  const radky = res.schools.map((s) => {
    let detail = 'Chybí loňské minimum nebo očekávané body.';
    if (s.diff !== null) {
      const o = Math.abs(s.diff);
      detail = `Loňské minimum ${b(s.lastMin)}, ${s.diff >= 0 ? `o ${b(o)} nad ním` : `o ${b(o)} pod ním`}.`;
    }
    return `<li class="prij-str" data-kategorie="${esc(s.category)}">`
      + `<span class="prij-str-poradi" aria-hidden="true">${s.priority}.</span>`
      + `<div class="prij-str-text"><p class="prij-str-nazev"><span class="sr-only">${s.priority}. priorita: </span>${esc(s.name)}</p>`
      + `<p class="small muted">${esc(detail)} ${esc(KATEGORIE_POPIS[s.category] ?? '')}</p></div>`
      + `<span class="badge prij-kat prij-kat-${esc(s.category)}">${esc(KATEGORIE[s.category] ?? s.category)}</span></li>`;
  }).join('');
  const upozorneni = res.warnings.map((w) => `<li class="prij-upoz prij-upoz-${w.level === 'warn' ? 'warn' : 'info'}" data-upozorneni="${esc(w.id)}">`
    + `${ikona(w.level === 'warn' ? 'ikona-vystraha' : 'ikona-info', sprite)}<span>${esc(textUpozorneni(w, rezerva))}</span></li>`).join('');
  // PRI-07: bez zadané školy jen výzva k doplnění, žádné prázdné řádky „Škola 1–3“.
  const seznam = radky ? `<ol class="prij-strategie">${radky}</ol>`
    : '<p class="prij-str-prazdna" data-strategie-prazdna>Doplň aspoň jednu školu a její loňské minimum. Pak tu uvidíš, jak vychází.</p>';
  return seznam
    + (upozorneni ? `<ul class="prij-upozorneni">${upozorneni}</ul>` : '')
    + '<p class="note">Pořadí na přihlášce dej podle toho, kam dítě chce nejvíc. Nižší priorita mu šanci na vyšší nevezme.</p>';
}

/** Místo výsledku strategie, když některé pole není v pořádku (starý výsledek se neukazuje). */
export function strategieNeplatnaHtml() {
  return '<p class="prij-str-neplatne" data-strategie-neplatne>Výsledek se ukáže, až budou čísla v zadání v pořádku. Oprav pole s hláškou.</p>';
}

/* ---------- Kalendář ---------- */

export function kalendarHtml(terminy, pravidla) {
  return poMesicich(terminy).map((m) => `<section class="prij-mesic" aria-labelledby="mesic-${m.klic}">`
    + `<h3 id="mesic-${m.klic}">${esc(m.nazev.charAt(0).toUpperCase() + m.nazev.slice(1))}</h3>`
    + `<ol class="prij-terminy">${m.terminy.map((e) => {
      const zdroj = pravidla.sources[e.source];
      const viceDni = e.end && e.end !== e.start;
      const stav = e.status === 'confirmed' ? ''
        : `<span class="badge ${e.status === 'unverified' ? 'badge-draft' : 'badge-plain'}">${esc(STAV_TERMINU[e.status] ?? e.status)}</span>`;
      const skupina = e.group !== 'ss' ? `<span class="badge badge-plain">${esc(SKUPINY[e.group] ?? e.group)}</span>` : '';
      return `<li class="prij-termin" data-termin="${esc(e.id)}" data-skupina="${esc(e.group)}">`
        + `<p class="prij-termin-datum"><span class="prij-termin-den">${esc(viceDni ? `${denMesic(e.start)}–${denMesic(e.end)}` : denMesic(e.start))}</span>`
        + `${viceDni ? '' : `<span class="prij-termin-tyden">${esc(denVTydnu(e.start, true))}</span>`}</p>`
        + `<div class="prij-termin-text"><p class="prij-termin-nazev">${esc(e.title)}<span class="sr-only">, ${esc(rozsahTerminu(e))}</span></p>`
        + (skupina || stav ? `<p class="prij-termin-stitky">${skupina}${stav}</p>` : '')
        + (e.note ? `<p class="small">${esc(ty(e.note))}</p>` : '')
        + (zdroj ? `<p class="small muted prij-termin-zdroj">Zdroj: <a href="${esc(zdroj.url)}">${esc(zdroj.name)}</a></p>` : '')
        + '</div></li>';
    }).join('')}</ol></section>`).join('');
}
