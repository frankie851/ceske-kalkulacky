// Vyhledávání bez serveru: index se vloží do stránky /hledat/ při buildu, dotaz se nikam neposílá.
// Čisté funkce normalizuj/hledej/jeTisen jdou testovat v Node; inicializace stránky běží jen v prohlížeči.

/** Malá písmena, bez diakritiky, jen písmena a číslice oddělené mezerou. */
export function normalizuj(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Levenshteinova vzdálenost s brzkým ukončením nad limitem. */
export function vzdalenost(a, b, limit = 3) {
  if (a === b) return 0;
  if (Math.abs(a.length - b.length) > limit) return limit + 1;
  let pred = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const akt = [i];
    let minRadek = i;
    for (let j = 1; j <= b.length; j++) {
      akt[j] = Math.min(pred[j] + 1, akt[j - 1] + 1, pred[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (akt[j] < minRadek) minRadek = akt[j];
    }
    if (minRadek > limit) return limit + 1;
    pred = akt;
  }
  return pred[b.length];
}

// Dotazy, které vypadají jako tíseň: nahoře se ukáže blok bezplatné pomoci
const TISEN = ['dluh', 'exekuc', 'exekutor', 'insolvenc', 'oddluz', 'nemam na najem', 'nemam na najemne',
  'srazky ze mzdy', 'obstaven', 'osobni bankrot', 'nezvladam splatky', 'nemam na splatky'];

/** Je dotaz o dluzích nebo finanční tísni? */
export function jeTisen(dotaz) {
  const q = ` ${normalizuj(dotaz)} `;
  return TISEN.some((t) => q.includes(t));
}

function skupinySynonym(synonyma) {
  const pole = Array.isArray(synonyma) ? synonyma : synonyma?.skupiny || [];
  return pole.map((sk) => sk.map(normalizuj).filter(Boolean)).filter((sk) => sk.length > 1);
}

const VAHY = { nazev: 10, stitky: 6, perex: 3, kategorie: 2, typ: 1 };
const cache = new WeakMap();
function pripravit(polozka) {
  if (!cache.has(polozka)) {
    const pole = {
      nazev: normalizuj(polozka.nazev),
      stitky: normalizuj((polozka.stitky || []).join(' | ')),
      perex: normalizuj(polozka.perex),
      kategorie: normalizuj(polozka.kategorie),
      typ: normalizuj(polozka.typ),
    };
    const slova = new Set(`${pole.nazev} ${pole.stitky}`.split(' ').filter((s) => s.length >= 3));
    cache.set(polozka, { pole, slova: [...slova] });
  }
  return cache.get(polozka);
}

function shoda(text, pripravena) {
  let nej = 0;
  for (const [klic, vaha] of Object.entries(VAHY)) {
    const hodnota = pripravena.pole[klic];
    if (!hodnota) continue;
    const h = ` ${hodnota} `;
    if (h.includes(` ${text} `)) nej = Math.max(nej, vaha + 2);
    else if (h.includes(` ${text}`)) nej = Math.max(nej, vaha);
  }
  return nej;
}

/**
 * Prohledá index.
 * @param {string} dotaz
 * @param {{id:string, nazev:string, perex?:string, stitky?:string[], url?:string|null, kategorie?:string, typ?:string, stav?:string}[]} index
 * @param {{skupiny:string[][]}|string[][]} [synonyma]
 * @returns {object[]} položky indexu seřazené podle skóre (pole `skore`); prázdný dotaz → []
 */
export function hledej(dotaz, index = [], synonyma = []) {
  const q = normalizuj(dotaz);
  if (!q) return [];
  const tokeny = q.split(' ');
  const alternativy = tokeny.map((t) => [{ text: t, vaha: 1 }]);
  const qPad = ` ${q} `;

  for (const sk of skupinySynonym(synonyma)) {
    for (const fraze of sk) {
      const slova = fraze.split(' ');
      const pokryte = [];
      if (qPad.includes(` ${fraze} `)) {
        for (let i = 0; i + slova.length <= tokeny.length; i++) {
          if (slova.every((s, j) => tokeny[i + j] === s)) for (let j = 0; j < slova.length; j++) pokryte.push(i + j);
        }
      } else if (slova.length === 1) {
        tokeny.forEach((t, i) => { if (t.length >= 3 && fraze.startsWith(t)) pokryte.push(i); });
      }
      for (const i of pokryte) {
        for (const jina of sk) if (jina !== tokeny[i]) alternativy[i].push({ text: jina, vaha: 0.8 });
      }
    }
  }

  const hodnotit = (polozka, vsechny) => {
    const p = pripravit(polozka);
    let skore = 0;
    let trefy = 0;
    tokeny.forEach((token, i) => {
      let nej = 0;
      for (const a of alternativy[i]) nej = Math.max(nej, shoda(a.text, p) * a.vaha);
      if (nej === 0 && token.length >= 4) {
        const limit = token.length >= 7 ? 2 : 1;
        if (p.slova.some((s) => vzdalenost(token, s.slice(0, token.length + 1), limit) <= limit
          || vzdalenost(token, s, limit) <= limit)) nej = 3;
      }
      if (nej > 0) trefy += 1;
      skore += nej;
    });
    if (trefy === 0 || (vsechny && trefy < tokeny.length)) return 0;
    if (p.pole.nazev === q) skore += 20;
    if (polozka.stav === 'aktivni') skore += 0.5;
    return skore;
  };

  let vysledky = index.map((polozka) => ({ ...polozka, skore: hodnotit(polozka, true) })).filter((v) => v.skore > 0);
  if (!vysledky.length) {
    vysledky = index.map((polozka) => ({ ...polozka, skore: hodnotit(polozka, false) })).filter((v) => v.skore > 0);
  }
  return vysledky.sort((a, b) => b.skore - a.skore || a.nazev.localeCompare(b.nazev, 'cs'));
}

// ---------- Stránka /hledat/ ----------
function prvek(znacka, trida, text) {
  const el = document.createElement(znacka);
  if (trida) el.className = trida;
  if (text != null) el.textContent = text;
  return el;
}

function vykreslit(koren, dotaz, vysledky) {
  koren.replaceChildren();
  const nadpis = prvek('h2', 'h-xl', `Výsledky pro „${dotaz}“`);
  nadpis.id = 'vysledky-nadpis';
  koren.append(nadpis);
  const stav = prvek('p', 'search-status');
  stav.setAttribute('role', 'status');
  if (!vysledky.length) {
    stav.textContent = 'Nic jsme nenašli. Zkus jiné slovo, třeba „penzijko“, „EET“ nebo „výpověď“, nebo vyber téma níže.';
    koren.append(stav);
    return;
  }
  const n = vysledky.length;
  stav.textContent = n === 1 ? 'Našli jsme 1 výsledek.' : n <= 4 ? `Našli jsme ${n} výsledky.` : `Našli jsme ${n} výsledků.`;
  koren.append(stav);
  const seznam = prvek('ul', 'search-results');
  for (const v of vysledky) {
    const li = prvek('li', `search-hit${v.url ? '' : ' search-hit-soon'}`);
    const h = prvek('h3');
    if (v.url) {
      const a = prvek('a', null, v.nazev);
      a.href = v.url;
      h.append(a);
    } else {
      h.textContent = v.nazev;
    }
    li.append(h);
    const meta = prvek('div', 'tool-meta');
    if (v.typ) meta.append(prvek('span', 'tag', v.typ));
    if (v.kategorie) meta.append(prvek('span', 'tag', v.kategorie));
    if (!v.url) meta.append(prvek('span', 'badge badge-soon', 'Připravujeme'));
    if (v.stav === 'navrh') meta.append(prvek('span', 'badge badge-draft', 'Návrh, zatím neschváleno'));
    li.append(meta);
    if (v.perex) li.append(prvek('p', null, v.perex));
    seznam.append(li);
  }
  koren.append(seznam);
}

function init() {
  const koren = document.getElementById('hledani-vysledky');
  const zdrojIndexu = document.getElementById('hledani-index');
  if (!koren || !zdrojIndexu) return;
  let index = [];
  let synonyma = [];
  try {
    index = JSON.parse(zdrojIndexu.textContent);
    synonyma = JSON.parse(document.getElementById('hledani-synonyma')?.textContent || '[]');
  } catch { return; }
  const dotaz = (new URLSearchParams(window.location.search).get('q') || '').trim().slice(0, 100);
  for (const vstup of document.querySelectorAll('input[name="q"]')) vstup.value = dotaz;
  if (!dotaz) return;
  const pomoc = document.getElementById('hledani-pomoc');
  if (pomoc && jeTisen(dotaz)) pomoc.hidden = false;
  vykreslit(koren, dotaz, hledej(dotaz, index, synonyma));
  koren.hidden = false;
  document.title = `${dotaz} – hledání – ${document.title.split(' – ').pop()}`;
}

if (typeof document !== 'undefined') init();
