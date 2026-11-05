// Volno – texty a HTML výstupu. Běží v Node (ukázka při buildu) i v prohlížeči (ui.js),
// takže stránka bez JS i s JS vypadá stejně. Čisté funkce, žádný DOM.
import { esc } from '../../js/graf.js';
import { NBSP } from '../../js/format.js';
import { denVTydnu, jeVikend, svatek, dnyRoku, rozdilDnu } from './volno.js';

export const MESICE = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
export const DNY = ['pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota', 'neděle'];
const DNY_KRATCE = ['po', 'út', 'st', 'čt', 'pá', 'so', 'ne'];
const DNY_ZAHLAVI = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
const DNY_4P = ['v pondělí', 'v úterý', 've středu', 've čtvrtek', 'v pátek', 'v sobotu', 'v neděli'];

/** 1 den, 2 dny, 5 dní (s pevnou mezerou). */
export function dny(n) {
  const slovo = n === 1 ? 'den' : n >= 2 && n <= 4 ? 'dny' : 'dní';
  return `${n}${NBSP}${slovo}`;
}

/** „25. 3.“ nebo s rokem „25. 3. 2027“. */
export function kratkeDatum(iso, sRokem = false) {
  const [r, m, d] = iso.split('-').map(Number);
  return `${d}.${NBSP}${m}.${sRokem ? `${NBSP}${r}` : ''}`;
}

/** „čt 25. 3.“ */
export function sDnem(iso, sRokem = false) {
  return `${DNY_KRATCE[denVTydnu(iso)]}${NBSP}${kratkeDatum(iso, sRokem)}`;
}

/** „čt 25. 3. – po 29. 3.“ (přes hranici roku s roky). */
export function rozsah(od, do_, { sRokem = false } = {}) {
  const pres = od.slice(0, 4) !== do_.slice(0, 4);
  return `${sDnem(od, pres)} – ${sDnem(do_, pres || sRokem)}`;
}

/** Česká množná čísla: mnozne(5, 'svátek', 'svátky', 'svátků') → „5 svátků“. */
export function mnozne(n, jeden, dva, pet) {
  return `${n}${NBSP}${n === 1 ? jeden : n >= 2 && n <= 4 ? dva : pet}`;
}

/** Zakončí větu tečkou, pokud už na tečku nekončí (datum „25. 3.“). */
export const veta = (t) => (t.endsWith('.') ? t : `${t}.`);

/** Výčet: „a“, „a, b a c“. */
export function vycet(polozky) {
  if (polozky.length <= 1) return polozky.join('');
  return `${polozky.slice(0, -1).join(', ')} a ${polozky[polozky.length - 1]}`;
}

/** Dny dovolené po skupinách za sebou: „po 28. 6. – pá 2. 7.“, „pá 24. 9. a po 27. 9.“ */
export function dnyDovolene(dovolena) {
  const skupiny = [];
  for (const d of dovolena) {
    const posledni = skupiny[skupiny.length - 1];
    if (posledni && rozdilDnu(posledni[posledni.length - 1], d) === 1) posledni.push(d);
    else skupiny.push([d]);
  }
  return vycet(skupiny.flatMap((s) => (s.length >= 3 ? [`${sDnem(s[0])} – ${sDnem(s[s.length - 1])}`] : s.map((d) => sDnem(d)))));
}

/** Krátký název volna podle svátků: „Velikonoce“, „Cyril a Metoděj, Jan Hus“. */
export function nazevVolna(navrh) {
  const nazvy = [...new Set(navrh.svatky.filter((s) => !jeVikend(s.datum)).map((s) => s.kratce || s.nazev))];
  return nazvy.join(', ');
}

/** Texty hlavní karty výsledku a lepivé lišty pro nejlepší návrh. */
export function textyVysledku(navrhy, pocet, rok) {
  const nadpis = `Kolik volna ti dá ${dny(pocet)} dovolené`;
  const n = navrhy[0];
  if (!n) {
    return { nadpis, cislo: '–', popis: 'Žádný návrh', vysvetleni: `V roce ${rok} jsme kolem svátků nenašli volno, kam by se ${dny(pocet)} dovolené hodily.`, lista: '–', listaPopis: nadpis, oznameni: 'Žádný návrh.' };
  }
  const svatkyVTydnu = n.svatky.filter((s) => !jeVikend(s.datum));
  const kdy = n.dovolena.length === 1
    ? `${DNY_4P[denVTydnu(n.dovolena[0])]} ${kratkeDatum(n.dovolena[0])}`
    : dnyDovolene(n.dovolena);
  const vysvetleni = `${veta(`Vezmi si dovolenou ${n.dovolena.length === 1 ? '' : 'na '}${kdy}`)} `
    + `${vycet(svatkyVTydnu.map((s) => `${s.nazev} (${sDnem(s.datum)})`))} ${svatkyVTydnu.length === 1 ? 'je svátek' : 'jsou svátky'}, zbytek je víkend.`
    + (n.pocetDovolene < pocet ? ` Delší volno tady nevyjde, ${dny(n.pocetDovolene)} dovolené stačí.` : '');
  const cislo = `${dny(n.delka)} volna`;
  return {
    nadpis,
    cislo,
    popis: `${nazevVolna(n)}: ${rozsah(n.od, n.do)}`,
    vysvetleni,
    lista: cislo,
    listaPopis: `Za ${dny(n.pocetDovolene)} dovolené`,
    oznameni: `Návrhy pro ${dny(pocet)} dovolené. Nejlépe vyjde ${nazevVolna(n)}: ${dny(n.delka)} volna.`,
  };
}

/** Karty návrhů (ol > li.volno-navrh). */
export function navrhyHtml(navrhy) {
  if (!navrhy.length) return '<p>Žádný návrh.</p>';
  const karty = navrhy.map((n, i) => {
    const svatkyVTydnu = n.svatky.filter((s) => !jeVikend(s.datum));
    return `<li class="volno-navrh${i === 0 ? ' volno-navrh-nej' : ''}">
  <p class="volno-navrh-k">${i === 0 ? '<span class="badge badge-ok">Nejvýhodnější</span> ' : ''}${esc(nazevVolna(n))}</p>
  <h3 class="volno-navrh-rozsah">${esc(rozsah(n.od, n.do))}</h3>
  <p class="volno-navrh-cislo"><b>${esc(dny(n.delka))} volna</b> <span>za ${esc(dny(n.pocetDovolene))} dovolené</span></p>
  <p class="volno-navrh-vezmi"><span class="volno-znacka volno-znacka-dovolena" aria-hidden="true"></span><span><strong>Vezmi si:</strong> ${esc(dnyDovolene(n.dovolena))}</span></p>
  <p class="volno-navrh-svatky"><span class="volno-znacka volno-znacka-svatek" aria-hidden="true"></span><span>${svatkyVTydnu.length === 1 ? 'Svátek' : 'Svátky'}: ${esc(vycet(svatkyVTydnu.map((s) => `${s.nazev} (${sDnem(s.datum)})`)))}</span></p>
</li>`;
  });
  return `<ol class="volno-navrhy" role="list">\n${karty.join('\n')}\n</ol>`;
}

/**
 * Kalendář roku: 12 tabulek po měsících. Víkend, svátek a navržená dovolená mají vlastní
 * třídu (tvar i barva) a pro čtečky text. dovolena = Set ISO dat navržené dovolené.
 */
export function kalendarHtml(rok, rules, dovolena = new Set()) {
  const vsechny = dnyRoku(rok);
  const mesice = MESICE.map((nazev, m) => {
    const dnyMesice = vsechny.filter((d) => Number(d.slice(5, 7)) === m + 1);
    const bunky = [];
    for (let i = 0; i < denVTydnu(dnyMesice[0]); i++) bunky.push('<td class="vk-prazdny"></td>');
    for (const d of dnyMesice) {
      const s = svatek(d, rules);
      const tridy = ['vk-den'];
      const popisy = [];
      if (jeVikend(d)) tridy.push('vk-vikend');
      if (s) { tridy.push('vk-svatek'); popisy.push(`svátek: ${s.nazev}`); }
      if (dovolena.has(d)) { tridy.push('vk-dovolena'); popisy.push('navržená dovolená'); }
      const cislo = Number(d.slice(8, 10));
      const sr = popisy.length ? `<span class="sr-only">, ${esc(popisy.join(', '))}</span>` : '';
      const titulek = popisy.length ? ` title="${esc(popisy.join(', '))}"` : '';
      bunky.push(`<td class="${tridy.join(' ')}" data-datum="${d}"${titulek}><span class="vk-cislo">${cislo}</span>${sr}</td>`);
    }
    while (bunky.length % 7) bunky.push('<td class="vk-prazdny"></td>');
    const radky = [];
    for (let i = 0; i < bunky.length; i += 7) radky.push(`<tr>${bunky.slice(i, i + 7).join('')}</tr>`);
    const zahlavi = DNY_ZAHLAVI.map((z, i) => `<th scope="col"><abbr title="${DNY[i]}">${z}</abbr></th>`).join('');
    return `<table class="vk-mesic">
<caption>${nazev} ${rok}</caption>
<thead><tr>${zahlavi}</tr></thead>
<tbody>${radky.join('')}</tbody>
</table>`;
  });
  return `<div class="vk-mrizka">\n${mesice.join('\n')}\n</div>`;
}

/** Množina dnů dovolené ze všech návrhů (pro kalendář). */
export const dovolenaZNavrhu = (navrhy) => new Set(navrhy.flatMap((n) => n.dovolena));

/** Den v týdnu slovem. */
export const denSlovem = (iso) => DNY[denVTydnu(iso)];
