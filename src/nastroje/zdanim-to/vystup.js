// Zdaním to? – texty a HTML výsledků. Sdílí je build (zdanim-to.11tydata.js) i prohlížeč
// (ui-prodeje.js, ui-dividendy.js), aby ukázka bez JS a živý výpočet vypadaly stejně a stránka
// po načtení neposkočila. Žádné částky ani sazby tu nejsou natvrdo: vše z výsledku a rules.json.
import { kc, cislo, procenta, datum } from '../../js/format.js';

/** Escapování textu do HTML. */
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);

const pct = (podil) => procenta(Math.round(podil * 100 * 100) / 100, Number.isInteger(podil * 100) ? 0 : 1);

/** Štítek stavu pravidla (Shoda zdrojů / Sporné / Neověřeno) jako HTML. */
export function stitekStavu(stav, rules) {
  const s = rules.stavy[stav] || rules.stavy.neovereno;
  return `<span class="badge ${s.stitek === 'navrh' ? 'badge-draft' : 'badge-plain'} zt-stav">${esc(s.text)}</span>`;
}

/* ================= Prodeje ================= */

const NAZVY_STAVU = {
  casovy: 'Osvobozeno',
  hodnotovy: 'Osvobozeno',
  zdanitelne: 'Zdanitelné',
  'mimo-rok': 'Jiný rok',
  neuplne: 'Chybí údaje',
};

function duvodPolozky(p, v, rules) {
  const typ = rules.prodeje.typy[p.typ];
  switch (p.stav) {
    case 'casovy':
      return `Časový test splněn od ${datum(p.osvobozenoOd)} (nákup ${datum(p.nakup)}, držba přes ${rules.prodeje.casovyTest.let} roky).`;
    case 'hodnotovy':
      return `Hodnotový test: příjmy z prodeje (${typ.nazev.toLowerCase()}) za rok ${kc(v.uhrny[p.typ].uhrnProTest)}, limit ${kc(rules.prodeje.hodnotovyTest.limit)}.`;
    case 'zdanitelne':
      return `Časový test splněn až od ${datum(p.osvobozenoOd)} a příjmy za rok ${kc(v.uhrny[p.typ].uhrnProTest)} jsou nad limitem ${kc(rules.prodeje.hodnotovyTest.limit)}.`;
    case 'mimo-rok':
      return `Prodej není z roku ${v.rok}. Do výpočtu za tento rok se nepočítá.`;
    default:
      return p.chyby.map((c) => c.text).join(' ');
  }
}

/** Seznam položek s důvodem (HTML <ol>). */
export function polozkyHtml(v, rules) {
  const radky = v.polozky.map((p) => {
    const typ = rules.prodeje.typy[p.typ];
    const castky = p.stav === 'neuplne' ? '' : `<span class="zt-castky">Příjem ${kc(p.prijem)} · náklady ${kc(p.naklady)} · rozdíl <span class="num">${kc(p.rozdil)}</span></span>`;
    return `<li class="zt-polozka zt-polozka-${p.stav}">`
      + `<span class="zt-polozka-hlava"><span class="zt-polozka-nazev">Prodej ${p.index + 1}${typ ? ` · ${esc(typ.nazev)}` : ''}</span>`
      + `<span class="tag zt-tag-${p.stav}">${NAZVY_STAVU[p.stav]}</span></span>`
      + `<span class="zt-duvod">${esc(duvodPolozky(p, v, rules))}</span>${castky}</li>`;
  });
  return radky.length
    ? `<ol class="zt-polozky">${radky.join('')}</ol>`
    : '<p class="muted zt-prazdne">Zatím tu není žádný prodej. Přidej ho nahoře.</p>';
}

/** Statistiky úhrnů (HTML <ul class="stats">). */
export function uhrnyHtml(v, rules) {
  const ht = rules.prodeje.hodnotovyTest;
  const polozky = Object.entries(rules.prodeje.typy).map(([klic, t]) => {
    const u = v.uhrny[klic];
    return `<li class="stat${u.splneno ? ' sage' : ''}"><b>${kc(u.uhrnProTest)}</b><span>${esc(t.nazev)}: příjmy za rok pro hodnotový test (limit ${kc(ht.limit)})</span></li>`;
  });
  polozky.push(`<li class="stat${v.zdanitelnyRozdil ? '' : ' sage'}"><b>${kc(v.orientacniDan)}</b><span>orientační daň při sazbě ${pct(rules.dane.sazba.hodnota)}</span></li>`);
  return `<ul class="stats">${polozky.join('')}</ul>`;
}

/** Upozornění vzniklá z konkrétního výpočtu (sporná pravidla se nepočítají). */
export function upozorneniProdejuHtml(v, rules) {
  const texty = v.upozorneni.map((u) => {
    if (u.id === 'krypto-40mil') {
      return `<li><span>${stitekStavu(u.stav, rules)} Časově osvobozené příjmy z kryptoaktiv jsou ${kc(u.castka)}. Podle části zdrojů platí u kryptoaktiv od roku ${rules.prodeje.limit40mil.zrusenoOdRoku} dál limit ${kc(u.limit)}: příjmy nad něj by osvobozené nebyly. Do výpočtu to nepočítáme.</span></li>`;
    }
    if (u.id === 'ztraty') {
      return `<li><span>${stitekStavu(u.stav, rules)} Ztrátu z jednoho prodeje jsme odečetli od zisků z prodejů stejného druhu. Celkovou ztrátu uplatnit nejde.</span></li>`;
    }
    return '';
  }).filter(Boolean);
  return texty.length ? `<ul class="zt-upozorneni">${texty.join('')}</ul>` : '';
}

/** Hlavní čísla a texty výsledku prodejů. */
export function vysledekProdeju(v, rules) {
  const zdanit = v.zdanitelnyRozdil > 0;
  const osvobozeno = v.polozky.filter((p) => p.stav === 'casovy' || p.stav === 'hodnotovy').length;
  const zdanitelne = v.polozky.filter((p) => p.stav === 'zdanitelne').length;
  const vRoce = osvobozeno + zdanitelne;
  let vysvetleni;
  if (!vRoce) vysvetleni = `Za rok ${v.rok} tu zatím není žádný úplný prodej.`;
  else if (!zdanitelne) vysvetleni = `Všechny prodeje za rok ${v.rok} jsou osvobozené. Daň z nich neplatíš.`;
  else if (!zdanit) vysvetleni = 'Některé prodeje nejsou osvobozené, ale po odečtení nákladů nevyšel žádný zisk.';
  else vysvetleni = `Rozdíl mezi příjmem a náklady u neosvobozených prodejů patří do přiznání mezi ostatní příjmy (§ 10). Orientačně z něj zaplatíš ${kc(v.orientacniDan)} daně.`;
  return {
    nadpis: zdanit ? `Zdaníš ${kc(v.zdanitelnyRozdil)} rozdílu` : 'Nic nedaníš',
    cislo: kc(v.zdanitelnyRozdil),
    popis: `zdanitelný rozdíl z prodejů za rok ${v.rok}`,
    vysvetleni,
    lista: { cislo: kc(v.zdanitelnyRozdil), popis: zdanit ? 'Zdaníš rozdíl' : 'Nic nedaníš' },
    detail: uhrnyHtml(v, rules) + upozorneniProdejuHtml(v, rules),
    polozky: polozkyHtml(v, rules),
  };
}

/* ================= Dividendy ================= */

/** Tabulka po zemích (HTML, stack-table jako makro tabulka). */
export function tabulkaZemiHtml(v) {
  const sloupce = ['Země', 'Základ', 'Česká daň', 'Sraženo v zahraničí', 'Zápočet', 'Doplatek', 'Přeplaceno'];
  const bunky = (nazev, z, tridaRadku = '') => `<tr${tridaRadku}><th scope="row">${esc(nazev)}</th>`
    + ['zakladKc', 'ceskaDan', 'srazenoKc', 'zapocet', 'doplatek', 'preplaceno']
      .map((k, i) => `<td class="r" data-label="${sloupce[i + 1]}">${kc(z[k])}</td>`).join('') + '</tr>';
  const radky = v.zeme.map((z) => bunky(z.nazev, z));
  return '<div class="table-wrap" role="region" aria-label="Tabulka: dividendy po zemích" tabindex="0"><table class="stack-table">'
    + `<caption>Dividendy za rok ${v.rok} po zemích (v korunách)</caption>`
    + `<thead><tr>${sloupce.map((s, i) => `<th scope="col"${i ? ' class="r"' : ''}>${s}</th>`).join('')}</tr></thead>`
    + `<tbody>${radky.join('')}</tbody>`
    + `<tfoot>${bunky('Celkem', v.celkem, ' class="hl"')}</tfoot></table></div>`;
}

/** Přeplacená daň a tip na W-8BEN, neověřené smluvní sazby (HTML). */
export function upozorneniDividendHtml(v, rules) {
  const casti = [];
  for (const z of v.zeme.filter((x) => x.preplaceno > 0)) {
    const w = rules.dividendy.zeme[z.zeme].w8ben;
    const tip = z.w8ben && w
      ? ` Tip: s formulářem W-8BEN u brokera ti USA strhnou jen ${pct(w.sazbaS)} místo ${pct(w.sazbaBez)}.`
      : ' Přeplatek můžeš zkusit získat zpět v zemi, kde se daň strhla.';
    casti.push(`<li><span><strong>${esc(z.nazev)}: přeplaceno v zahraničí ${kc(z.preplaceno)}.</strong> Tuhle část v Česku nezapočteš.${tip}</span></li>`);
  }
  for (const u of v.upozorneni) {
    casti.push(`<li><span>${stitekStavu(u.stav, rules)} ${esc(u.nazev)}: smluvní sazbu jsme zatím neověřili. Zápočet jsme omezili jen českou daní, podle smlouvy může být nižší.</span></li>`);
  }
  return casti.length ? `<ul class="zt-upozorneni">${casti.join('')}</ul>` : '';
}

/** Návod k přiznání ve dvou variantách (umístění je sporné). */
export function navodHtml(v, rules) {
  const u = rules.dividendy.umisteni;
  const c = v.celkem;
  const varianty = u.varianty.map((x) => `<li class="zt-varianta"><h3 class="h-lg">Podle části zdrojů: ${esc(x.nazev)}</h3>`
    + `<p class="small">Zdroj: <a href="${esc(x.zdroj.url)}">${esc(x.zdroj.nazev)}</a></p>`
    + '<ol class="zt-kroky">'
    + `<li>Do přílohy (${esc(x.priloha)}) uveď hrubé dividendy přepočtené na koruny: <span class="num">${kc(c.zakladKc)}</span>.</li>`
    + `<li>Česká daň z nich je <span class="num">${kc(c.ceskaDan)}</span> (${esc(x.radek)}).</li>`
    + `<li>Uplatni ${esc(x.zapocet)}: <span class="num">${kc(c.zapocet)}</span>, po zemích podle tabulky výše.</li>`
    + `<li>K doplacení zůstává <span class="num">${kc(c.doplatek)}</span>.</li>`
    + '</ol></li>');
  return `<p>${stitekStavu(u.stav, rules)} Zdroje se neshodují, kam zahraniční dividendy v přiznání patří. Proto ukazujeme obě varianty. Než přiznání podáš, ověř to v aktuálních pokynech k přiznání na <a href="${esc(rules.overitUrl)}">webu finanční správy</a>.</p>`
    + `<ul class="zt-varianty">${varianty.join('')}</ul>`;
}

/** Hlavní čísla a texty výsledku dividend. */
export function vysledekDividend(v, rules) {
  const doplatit = v.celkem.doplatek > 0;
  const zpusob = rules.kurzy.zpusoby[v.zpusob]?.nazev || '';
  return {
    nadpis: doplatit ? `Doplatíš ${kc(v.celkem.doplatek)}` : 'Nic nedoplácíš',
    cislo: kc(v.celkem.doplatek),
    popis: `česká daň z dividend k doplacení za rok ${v.rok}`,
    vysvetleni: `Dividendy ${kc(v.celkem.zakladKc)} (přepočet: ${zpusob}), česká daň ${pct(rules.dane.sazba.hodnota)} je ${kc(v.celkem.ceskaDan)}. Zahraniční daň započteš do ${kc(v.celkem.zapocet)}.`,
    lista: { cislo: kc(v.celkem.doplatek), popis: doplatit ? 'Doplatíš' : 'Nic nedoplácíš' },
    tabulka: tabulkaZemiHtml(v),
    upozorneni: upozorneniDividendHtml(v, rules),
    navod: navodHtml(v, rules),
  };
}

/** Čísla do vstupních polí: 26.375 → "26,375", 100000 → "100 000" (běžná mezera kvůli úpravám). */
export function doPole(n) {
  if (n == null || n === '') return '';
  return String(n).includes('.') ? String(n).replace('.', ',') : cislo(n).replace(/ /g, ' ');
}
