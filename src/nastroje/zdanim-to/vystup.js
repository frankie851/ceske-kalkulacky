// Zdaním to? – texty a HTML výsledků. Sdílí je build (zdanim-to.11tydata.js) i prohlížeč
// (ui-prodeje.js, ui-dividendy.js), aby ukázka bez JS a živý výpočet vypadaly stejně a stránka
// po načtení neposkočila. Žádné částky ani sazby tu nejsou natvrdo: vše z výsledku a rules.json.
import { kc, cislo, procenta, datum } from '../../js/format.js';

/** Escapování textu do HTML. */
export const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (z) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[z]);

const pct = (podil) => procenta(Math.round(podil * 100 * 100) / 100, Number.isInteger(podil * 100) ? 0 : 1);

/** Štítek stavu pravidla (Potvrzeno / Nejasné / Neověřeno) jako HTML. */
export function stitekStavu(stav, rules) {
  const s = rules.stavy[stav] || rules.stavy.neovereno;
  return `<span class="badge ${s.stitek === 'navrh' ? 'badge-draft' : 'badge-plain'} zt-stav">${esc(s.text)}</span>`;
}

/* ================= Prodeje ================= */

const NAZVY_STAVU = {
  hodnotovy: 'Osvobozeno',
  casovy: 'Osvobozeno',
  castecne: 'Částečně osvobozeno',
  zdanitelne: 'Zdanitelné',
  'mimo-rok': 'Jiný rok',
  neuplne: 'Chybí údaje',
};

const nazevDruhu = (druh, rules) => rules.prodeje.druhy[druh]?.nazev ?? '';

function duvodPolozky(p, v, rules) {
  const pr = rules.prodeje;
  const u = v.uhrny[p.druh];
  const let_ = pr.casovyTest.let;
  const nadLimitem = () => `Hodnotový test nesplněn: příjmy z prodejů (${nazevDruhu(p.druh, rules).toLowerCase()}) za rok ${kc(u.uhrnProTest)} jsou nad limitem ${kc(u.limit)}.`;
  switch (p.stav) {
    case 'hodnotovy':
      return `Hodnotový test: příjmy z prodejů (${nazevDruhu(p.druh, rules).toLowerCase()}) za rok ${kc(u.uhrnProTest)}, limit ${kc(u.limit)}.`;
    case 'casovy':
      return `${nadLimitem()} Časový test splněn od ${datum(p.osvobozenoOd)} (nákup ${datum(p.nakup)}, držba přes ${let_} roky).`;
    case 'castecne': {
      const c = p.zdanitelnaCast;
      return `Časový test splněn od ${datum(p.osvobozenoOd)}, ale časově osvobozené příjmy z kryptoaktiv za rok (${kc(u.limit40.uhrn)}) přesahují ${kc(u.limit40.limit)}. `
        + `Neosvobozená je poměrná část ${pct(c.pomer)}: příjem ${kc(c.prijem)}, náklady ${kc(c.naklady)}, rozdíl ${kc(c.rozdil)}.`;
    }
    case 'zdanitelne':
      if (p.terminovy && p.drzbaSplnena) {
        return `Termínový prodej sjednaný do ${let_} let od nákupu se časovým testem neosvobozuje. ${p.vHodnotovemTestu ? nadLimitem() : ''}`.trim();
      }
      if (!p.vHodnotovemTestu) {
        return `Elektronický peněžní token do hodnotového testu nevstupuje a časový test je splněn až od ${datum(p.osvobozenoOd)}.`;
      }
      return `${nadLimitem()} Časový test splněn až od ${datum(p.osvobozenoOd)}.`;
    case 'mimo-rok':
      return `Prodej není z roku ${v.rok}. Do výpočtu za tento rok se nepočítá.`;
    default:
      return p.chyby.map((ch) => ch.text).join(' ');
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
  const polozky = Object.entries(rules.prodeje.druhy).map(([klic, d]) => {
    const u = v.uhrny[klic];
    return `<li class="stat${u.splneno ? ' sage' : ''}"><b>${kc(u.uhrnProTest)}</b><span>${esc(d.nazev)}: příjmy za rok pro hodnotový test (limit ${kc(u.limit)})</span></li>`;
  });
  polozky.push(`<li class="stat${v.zdanitelnyRozdil ? '' : ' sage'}"><b>${kc(v.orientacniDan)}</b><span>orientační daň při sazbě ${pct(rules.dane.sazba.hodnota)}</span></li>`);
  return `<ul class="stats">${polozky.join('')}</ul>`;
}

/** Upozornění z konkrétního výpočtu: nejasná pravidla (počítaná podle doporučení) a krácení. */
export function upozorneniProdejuHtml(v, rules) {
  const pr = rules.prodeje;
  const texty = v.upozorneni.map((u) => {
    const s = stitekStavu(u.stav, rules);
    const druh = esc(nazevDruhu(u.druh, rules));
    if (u.id === 'uhrn-casovy') {
      const dopad = u.meniVysledek
        ? `Bez nich by úhrn byl ${kc(u.uhrnBez)} a prodeje by byly osvobozené hodnotovým testem.`
        : 'Na tento výsledek to vliv nemá.';
      return `<li><span>${s} ${druh}: do úhrnu ${kc(u.limit)} jsme započítali i prodeje, které splnily časový test (úhrn ${kc(u.uhrn)}). `
        + `Zákon mluví o úhrnu bez výjimky, oficiální metodiku finanční správy jsme nenašli. Počítáme opatrnější variantu. ${dopad}</span></li>`;
    }
    if (u.id === 'krypto-40mil') {
      return `<li><span>${s} Časově osvobozené příjmy z kryptoaktiv jsou ${kc(u.uhrn)}, víc než ${kc(u.limit)}. `
        + `Neosvobozená je poměrná část ${pct(u.pomer)} (úhrn − ${kc(u.limit)}) / úhrn a stejným poměrem jsme krátili náklady. `
        + `Cenné papíry: ${esc(pr.limit40mil.cennePapiryAPodily)}.</span></li>`;
    }
    if (u.id === 'ztraty') {
      const zaporny = u.vysledek < 0 ? ' Výsledek druhu je záporný: počítá se jako 0 a do dalších let se ztráta nepřevádí.' : '';
      return `<li><span>${s} ${druh}: ztrátu jsme odečetli jen od zisků stejného druhu. Mezi cennými papíry a kryptoaktivy se zisky a ztráty nezapočítávají.${zaporny}</span></li>`;
    }
    if (u.id === 'kod-krypta-p2') {
      return `<li><span>${s} Pro kryptoaktiva není v příloze č. 2 přiznání samostatný kód druhu příjmu. Než přiznání podáš, ověř v pokynech, který kód použít.</span></li>`;
    }
    return '';
  }).filter(Boolean);
  return texty.length ? `<ul class="zt-upozorneni">${texty.join('')}</ul>` : '';
}

/** Hlavní čísla a texty výsledku prodejů. */
export function vysledekProdeju(v, rules) {
  const zdanit = v.zdanitelnyRozdil > 0;
  const osvobozeno = v.polozky.filter((p) => p.stav === 'casovy' || p.stav === 'hodnotovy').length;
  const zdanitelne = v.polozky.filter((p) => p.stav === 'zdanitelne' || p.stav === 'castecne').length;
  const vRoce = osvobozeno + zdanitelne;
  let vysvetleni;
  if (!vRoce) vysvetleni = `Za rok ${v.rok} tu zatím není žádný úplný prodej.`;
  else if (!zdanitelne) vysvetleni = `Všechny prodeje za rok ${v.rok} jsou osvobozené. Daň z nich neplatíš.`;
  else if (!zdanit) vysvetleni = 'Některé prodeje nejsou osvobozené, ale po odečtení nákladů nevyšel žádný zisk.';
  else vysvetleni = `Rozdíl mezi příjmem a náklady u neosvobozených prodejů patří do přiznání mezi ostatní příjmy (§ 10), cenné papíry a kryptoaktiva zvlášť. Orientačně z něj zaplatíš ${kc(v.orientacniDan)} daně.`;
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
  const sloupce = ['Země', 'Základ', 'Česká daň', 'Sraženo v zahraničí', v.zapocetOrientacni ? 'Zápočet (orientačně)' : 'Zápočet', 'Doplatek', 'Přeplaceno'];
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

/** Strop zápočtu po zemích z výpočtu: smluvní sazba, smlouva a článek (HTML). */
export function stropyHtml(v, rules) {
  const strop = rules.dividendy.stropZapoctu;
  const zeme = v.zeme.map((z) => {
    const s = rules.dividendy.zeme[z.zeme].smluvniSazba;
    return s?.hodnota == null
      ? `${esc(z.nazev)}: smluvní sazbu nemáme`
      : `${esc(z.nazev)} ${pct(s.hodnota)} (smlouva ${esc(s.smlouva)}, ${esc(s.clanek)})`;
  });
  if (!zeme.length) return '';
  return `<p class="small zt-stropy">${stitekStavu(strop.stav, rules)} Zápočet je nejvýš smluvní sazba × hrubá dividenda: ${zeme.join('; ')}.</p>`;
}

/** Přeplacená daň, W-8BEN, chybějící smluvní sazby a orientační zápočet u § 16a (HTML). */
export function upozorneniDividendHtml(v, rules) {
  const casti = [];
  for (const u of v.upozorneni.filter((x) => x.id === 'zapocet-16a')) {
    casti.push(`<li><span>${stitekStavu(u.stav, rules)} Režim § 16a: jak se zahraniční daň započítává v příloze č. 4, se z pokynů ověřit nepodařilo. Zápočet ukazujeme jen orientačně.</span></li>`);
  }
  for (const z of v.zeme.filter((x) => x.preplaceno > 0)) {
    casti.push(`<li><span><strong>${esc(z.nazev)}: přeplaceno v zahraničí ${kc(z.preplaceno)}.</strong> Tuhle část v Česku nezapočteš. Přeplatek můžeš zkusit získat zpět v zemi, kde se daň strhla.</span></li>`);
  }
  for (const u of v.upozorneni) {
    if (u.id === 'w8ben') {
      casti.push(`<li><span>${stitekStavu(u.stav, rules)} ${esc(u.nazev)}: srážku u zdroje může snížit formulář W-8BEN u brokera. Je to americký postup, z českého zdroje jsme ho neověřili.</span></li>`);
    }
    if (u.id === 'smluvni-sazba') {
      casti.push(`<li><span>${stitekStavu(u.stav, rules)} ${esc(u.nazev)}: smluvní sazbu v ověřených pravidlech nemáme. Zápočet jsme omezili jen českou daní. Podle smlouvy může být nižší, bez smlouvy žádný.</span></li>`);
    }
  }
  return casti.length ? `<ul class="zt-upozorneni">${casti.join('')}</ul>` : '';
}

/** Návod k přiznání pro zvolený režim (§ 8, nebo § 16a). */
export function navodHtml(v, rules) {
  const rz = rules.dividendy.rezimy;
  const x = rz.varianty[v.rezim];
  const c = v.celkem;
  const orientacne = v.zapocetOrientacni ? ' (orientačně)' : '';
  return `<p>${stitekStavu(rz.stav, rules)} Zvolený režim: <strong>${esc(x.nazev)}</strong>, ${esc(x.popis)}. `
    + `Volba platí pro všechny tvoje zahraniční příjmy z kapitálového majetku najednou (${esc(rz.podminka)}).</p>`
    + '<ol class="zt-kroky">'
    + `<li>Základ (hrubé dividendy v korunách): <span class="num">${kc(c.zakladKc)}</span>, česká daň ${pct(v.sazba)}: <span class="num">${kc(c.ceskaDan)}</span>.</li>`
    + x.kroky.map((k) => `<li>${esc(k)}</li>`).join('')
    + `<li>Zápočet daně zaplacené v zahraničí${orientacne}: <span class="num">${kc(c.zapocet)}</span>, ${esc(rz.zapocet)}, po státech podle tabulky výše.</li>`
    + `<li>K doplacení zůstává${orientacne} <span class="num">${kc(c.doplatek)}</span>.</li>`
    + '</ol>'
    + `<p class="small muted">Řádky podle: ${esc(rz.radkyDle)}. Zdroj: <a href="${esc(rz.zdroj.url)}">${esc(rz.zdroj.pravniZaklad)}</a>.</p>`;
}

/** Hlavní čísla a texty výsledku dividend. */
export function vysledekDividend(v, rules) {
  const doplatit = v.celkem.doplatek > 0;
  const zpusob = rules.kurzy.zpusoby[v.zpusob]?.nazev || '';
  const rezim = rules.dividendy.rezimy.varianty[v.rezim].nazev;
  return {
    nadpis: doplatit ? `Doplatíš ${kc(v.celkem.doplatek)}` : 'Nic nedoplácíš',
    cislo: kc(v.celkem.doplatek),
    popis: `česká daň z dividend k doplacení za rok ${v.rok}${v.zapocetOrientacni ? ' (orientačně)' : ''}`,
    vysvetleni: `Dividendy ${kc(v.celkem.zakladKc)} (přepočet: ${zpusob}, režim ${rezim}), česká daň ${pct(v.sazba)} je ${kc(v.celkem.ceskaDan)}. `
      + `Zahraniční daň započteš ${v.zapocetOrientacni ? 'orientačně ' : ''}do ${kc(v.celkem.zapocet)}.`,
    lista: { cislo: kc(v.celkem.doplatek), popis: doplatit ? 'Doplatíš' : 'Nic nedoplácíš' },
    tabulka: tabulkaZemiHtml(v) + stropyHtml(v, rules),
    upozorneni: upozorneniDividendHtml(v, rules),
    navod: navodHtml(v, rules),
  };
}

/** Čísla do vstupních polí: 26.375 → "26,375", 100000 → "100 000" (běžná mezera kvůli úpravám). */
export function doPole(n) {
  if (n == null || n === '') return '';
  return String(n).includes('.') ? String(n).replace('.', ',') : cislo(n).replace(/ /g, ' ');
}
