// Volno – čisté výpočetní funkce: svátky, volné dny, bloky volna, návrhy dovolené
// a dny se zavřenými obchody. Žádný přístup k DOM, síti ani úložišti.
// Data jsou řetězce 'RRRR-MM-DD'. Rok i svátky dostávají funkce zvenku (rules.json),
// v kódu není žádné konkrétní datum.

const DEN_MS = 86400000;

// --- Datum -------------------------------------------------------------------

function parse(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso));
  if (!m) throw new Error(`Neplatné datum: ${iso}`);
  const [r, mes, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const dt = new Date(Date.UTC(r, mes - 1, d));
  if (dt.getUTCFullYear() !== r || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== d) {
    throw new Error(`Neplatné datum: ${iso}`);
  }
  return dt;
}

const naIso = (dt) => dt.toISOString().slice(0, 10);
const dvojmistne = (n) => String(n).padStart(2, '0');

/** ISO datum z roku, měsíce (1–12) a dne. */
export function isoDatum(rok, mesic, den) {
  return `${String(rok).padStart(4, '0')}-${dvojmistne(mesic)}-${dvojmistne(den)}`;
}

/** Posune datum o n dnů. */
export function posunDny(iso, n) {
  return naIso(new Date(parse(iso).getTime() + n * DEN_MS));
}

/** Den v týdnu: 0 = pondělí … 6 = neděle. */
export function denVTydnu(iso) {
  return (parse(iso).getUTCDay() + 6) % 7;
}

export const jeVikend = (iso) => denVTydnu(iso) >= 5;

/** Počet dnů mezi dvěma daty (do − od). */
export function rozdilDnu(od, do_) {
  return Math.round((parse(do_).getTime() - parse(od).getTime()) / DEN_MS);
}

/** Všechny dny od–do včetně. */
export function dnyMezi(od, do_) {
  const n = rozdilDnu(od, do_);
  return Array.from({ length: n + 1 }, (_, i) => posunDny(od, i));
}

/** Všechny dny roku. */
export function dnyRoku(rok) {
  return dnyMezi(isoDatum(rok, 1, 1), isoDatum(rok, 12, 31));
}

function kontrolaRoku(rok) {
  if (!Number.isInteger(rok) || rok < 1583 || rok > 9999) throw new RangeError(`Neplatný rok: ${rok}`);
}

// --- Svátky ------------------------------------------------------------------

/** Velikonoční neděle (anonymní gregoriánský algoritmus Meeus/Jones/Butcher). */
export function velikonocniNedele(rok) {
  kontrolaRoku(rok);
  const a = rok % 19;
  const b = Math.floor(rok / 100);
  const c = rok % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mesic = Math.floor((h + l - 7 * m + 114) / 31);
  const den = ((h + l - 7 * m + 114) % 31) + 1;
  return isoDatum(rok, mesic, den);
}

/** Datum pohyblivého svátku (id z rules.svatky.pohyblive) v daném roce. */
function datumPohybliveho(id, rok, rules) {
  const posun = rules.svatky.posunOdVelikonocniNedele?.[id];
  if (!Number.isInteger(posun)) throw new Error(`Neznámý pohyblivý svátek: ${id}`);
  return posunDny(velikonocniNedele(rok), posun);
}

/** Jak jsou v daný den zavřené obchody: 'cely-den', 'od-poledne', nebo null. */
function zavrenoV(iso, rok, rules) {
  const z = rules.zavreneObchody;
  if (!z) return null;
  const [, m, d] = iso.split('-').map(Number);
  if ((z.dny || []).some((x) => x.mesic === m && x.den === d)) return 'cely-den';
  if ((z.pohyblive || []).some((id) => datumPohybliveho(id, rok, rules) === iso)) return 'cely-den';
  if ((z.odPoledne || []).some((x) => x.mesic === m && x.den === d)) return 'od-poledne';
  return null;
}

const cacheSvatku = new WeakMap();

/**
 * Svátky (dny pracovního klidu) v roce, seřazené podle data:
 * [{ datum, nazev, kratce, zavreno: 'cely-den' | 'od-poledne' | null }]
 * (kratce = krátký název pro popisky, např. „Velikonoce“)
 */
export function svatkyRoku(rok, rules) {
  kontrolaRoku(rok);
  let podleRoku = cacheSvatku.get(rules);
  if (!podleRoku) { podleRoku = new Map(); cacheSvatku.set(rules, podleRoku); }
  if (podleRoku.has(rok)) return podleRoku.get(rok).seznam.map((s) => ({ ...s }));

  const s = rules.svatky;
  const seznam = [
    ...s.pevne.map((x) => ({ datum: isoDatum(rok, x.mesic, x.den), nazev: x.nazev, kratce: x.kratce || x.nazev })),
    ...(s.pohyblive || []).map((id) => {
      const nazev = s.nazvyPohyblivych?.[id] || id;
      return { datum: datumPohybliveho(id, rok, rules), nazev, kratce: s.kratcePohyblivych?.[id] || nazev };
    }),
  ]
    .map((x) => ({ ...x, zavreno: zavrenoV(x.datum, rok, rules) }))
    .sort((a, b) => a.datum.localeCompare(b.datum));
  const mapa = new Map(seznam.map((x) => [x.datum, x]));
  podleRoku.set(rok, { seznam, mapa });
  return seznam.map((x) => ({ ...x }));
}

/** Svátek v daný den, nebo null. */
export function svatek(iso, rules) {
  const rok = Number(String(iso).slice(0, 4));
  svatkyRoku(rok, rules);
  return cacheSvatku.get(rules).get(rok).mapa.get(iso) || null;
}

/** Volný den = sobota, neděle nebo svátek. */
export function jeVolno(iso, rules) {
  return jeVikend(iso) || svatek(iso, rules) !== null;
}

/** Svátek, který připadne na pracovní den (ušetří den dovolené). */
const jeSvatekVPracovniDen = (iso, rules) => !jeVikend(iso) && svatek(iso, rules) !== null;

/**
 * Všechny volné dny roku: [{ datum, vikend, svatek: nazev | null }].
 */
export function dnyVolnaVRoce(rok, rules) {
  return dnyRoku(rok)
    .filter((d) => jeVolno(d, rules))
    .map((d) => ({ datum: d, vikend: jeVikend(d), svatek: svatek(d, rules)?.nazev || null }));
}

// --- Bloky volna -------------------------------------------------------------

function popisUseku(dny, rules) {
  return {
    od: dny[0],
    do: dny[dny.length - 1],
    delka: dny.length,
    svatky: dny.map((d) => svatek(d, rules)).filter(Boolean).map((s) => ({ datum: s.datum, nazev: s.nazev, kratce: s.kratce })),
  };
}

/**
 * Souvislé bloky volných dnů (víkendy + svátky), které zasahují do roku.
 * Blok může přesáhnout do sousedního roku (např. svátky na přelomu roku).
 * [{ od, do, delka, svatky: [{ datum, nazev }], sSvatkem: bool }]
 */
export function blokyVolna(rok, rules) {
  const bloky = [];
  let aktualni = null;
  for (const d of dnyRoku(rok)) {
    if (jeVolno(d, rules)) (aktualni ||= []).push(d);
    else if (aktualni) { bloky.push(aktualni); aktualni = null; }
  }
  if (aktualni) bloky.push(aktualni);
  // Prodloužení přes hranici roku
  if (bloky.length) {
    const prvni = bloky[0];
    if (prvni[0] === isoDatum(rok, 1, 1)) {
      for (let d = posunDny(prvni[0], -1); jeVolno(d, rules); d = posunDny(d, -1)) prvni.unshift(d);
    }
    const posledni = bloky[bloky.length - 1];
    if (posledni[posledni.length - 1] === isoDatum(rok, 12, 31)) {
      for (let d = posunDny(posledni[posledni.length - 1], 1); jeVolno(d, rules); d = posunDny(d, 1)) posledni.push(d);
    }
  }
  return bloky.map((dny) => {
    const p = popisUseku(dny, rules);
    return { ...p, sSvatkem: p.svatky.length > 0 };
  });
}

// --- Návrhy dovolené ---------------------------------------------------------

/**
 * Kam vložit nejvýš n dnů dovolené, aby vyšlo co nejdelší souvislé volno.
 * Projde všechny úseky, které:
 *   – obsahují svátek v pracovní den,
 *   – mají 1 až n pracovních dnů (ty se vezmou jako dovolená) a všechny leží v roce `rok`,
 *   – nejdou prodloužit bez další dovolené (před i za úsekem je pracovní den).
 * Pro každý svátkový blok nechá nejdelší úsek (při shodě s méně dny dovolené, pak dřívější).
 * Seřadí podle poměru dny volna / dny dovolené, pak podle délky a data.
 * Vrací [{ od, do, delka, dovolena: [iso], pocetDovolene, pomer, svatky, klic }].
 */
export function nejlepsiNavrhy(rok, pocetDnuDovolene, rules, { max = 5 } = {}) {
  kontrolaRoku(rok);
  const limit = rules.maxDnuDovolene ?? 5;
  const n = pocetDnuDovolene;
  if (!Number.isInteger(n) || n < 1 || n > limit) {
    throw new RangeError(`Počet dnů dovolené musí být celé číslo 1–${limit}.`);
  }
  const rezerva = 7 * (limit + 2); // dost dnů na přesah volna do sousedního roku
  const dny = dnyMezi(posunDny(isoDatum(rok, 1, 1), -rezerva), posunDny(isoDatum(rok, 12, 31), rezerva));
  const volno = dny.map((d) => jeVolno(d, rules));
  const vRoce = dny.map((d) => d.startsWith(`${String(rok).padStart(4, '0')}-`));

  // Začátek volného bloku, do kterého den patří (klíč pro sloučení návrhů u stejného svátku)
  const zacatekBloku = new Array(dny.length).fill(null);
  for (let i = 0; i < dny.length; i++) {
    if (volno[i]) zacatekBloku[i] = i > 0 && volno[i - 1] ? zacatekBloku[i - 1] : dny[i];
  }

  const nejlepsi = new Map();
  for (let i = 1; i < dny.length - 1; i++) {
    if (volno[i - 1]) continue; // úsek musí začínat hned po pracovním dni
    let pracovnich = 0;
    let klic = null;
    for (let j = i; j < dny.length - 1; j++) {
      if (!volno[j]) {
        if (!vRoce[j]) break; // dovolená jen v daném roce
        pracovnich++;
        if (pracovnich > n) break;
      } else if (klic === null && jeSvatekVPracovniDen(dny[j], rules)) {
        klic = zacatekBloku[j];
      }
      if (volno[j + 1] || pracovnich === 0 || klic === null) continue;
      const usek = dny.slice(i, j + 1);
      const navrh = {
        ...popisUseku(usek, rules),
        dovolena: usek.filter((d, k) => !volno[i + k]),
        pocetDovolene: pracovnich,
        klic,
      };
      navrh.pomer = navrh.delka / navrh.pocetDovolene;
      const dosud = nejlepsi.get(klic);
      if (!dosud || navrh.delka > dosud.delka
        || (navrh.delka === dosud.delka && navrh.pocetDovolene < dosud.pocetDovolene)) {
        nejlepsi.set(klic, navrh);
      }
    }
  }

  return [...nejlepsi.values()]
    .sort((a, b) => b.pomer - a.pomer || b.delka - a.delka || a.od.localeCompare(b.od))
    .slice(0, max);
}

// --- Zavřené obchody ---------------------------------------------------------

/**
 * Dny, kdy mají prodejny nad rules.zavreneObchody.plochaNad m² zavřeno:
 * [{ datum, nazev, zavreno: 'cely-den' | 'od-poledne', od: 'HH:MM' | null }]
 */
export function zavreneObchodyRoku(rok, rules) {
  const odPoledne = rules.zavreneObchody?.odPoledne || [];
  return svatkyRoku(rok, rules)
    .filter((s) => s.zavreno)
    .map((s) => {
      const [, m, d] = s.datum.split('-').map(Number);
      const x = odPoledne.find((p) => p.mesic === m && p.den === d);
      return { datum: s.datum, nazev: s.nazev, zavreno: s.zavreno, od: s.zavreno === 'od-poledne' && x ? x.od : null };
    });
}

// --- Přehled roku (zajímavosti) ----------------------------------------------

/**
 * Souhrn roku: počty dnů, svátky o víkendu, prodloužené víkendy, nejdelší volno bez dovolené.
 */
export function prehledRoku(rok, rules) {
  const svatky = svatkyRoku(rok, rules);
  const dny = dnyRoku(rok);
  const volnych = dny.filter((d) => jeVolno(d, rules)).length;
  const bloky = blokyVolna(rok, rules);
  const sSvatkem = bloky.filter((b) => b.sSvatkem);
  const nejdelsi = sSvatkem.reduce((a, b) => (!a || b.delka > a.delka ? b : a), null);
  return {
    rok,
    dnuVRoce: dny.length,
    volnychDnu: volnych,
    pracovnichDnu: dny.length - volnych,
    pocetSvatku: svatky.length,
    svatkyVPracovniDen: svatky.filter((s) => !jeVikend(s.datum)),
    svatkyOVikendu: svatky.filter((s) => jeVikend(s.datum)),
    prodlouzeneVikendy: sSvatkem.filter((b) => b.delka >= 3),
    nejdelsiBezDovolene: nejdelsi,
  };
}
