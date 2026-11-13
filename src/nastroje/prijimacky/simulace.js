// Přijímačky bez paniky – čisté pomocné funkce pro simulátor a kalendář (bez DOM).
// Používá je build (prijimacky.11tydata.js) i prohlížeč (ui.js). Výpočet dělá převzatý matching.js.
import { deferredAcceptance, explain, bestOfTwo, TieError } from './matching.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

/* ---------- Kontrola číselných polí (revize 5. 11. 2026, PRI-02 a PRI-03) ---------- */

/**
 * Meze číselných polí. Body z jednotné zkoušky jsou podle rules.json → body (2 testy po 50 b.,
 * vyhláška č. 422/2023 Sb. a CERMAT), počet míst je jen pojistka proti překlepu (formular).
 */
export function mezePoli(pravidla) {
  const { testMax, pocetTestu } = pravidla.body;
  const max = testMax * pocetTestu;
  const body = { min: 0, max, mimo: `Body z jednotné zkoušky jsou od 0 do ${max} (${pocetTestu} testy po ${testMax} bodech).` };
  return {
    body,
    bodyPovinne: { ...body, povinne: 'Vyplň body. Kdo na zkoušku nepřišel, má 0.' },
    pokus: { min: 0, max: testMax, mimo: `Jeden test má 0 až ${testMax} bodů.` },
    kapacita: {
      min: 0, max: pravidla.formular.kapacitaMax, cele: true,
      povinne: 'Vyplň počet míst.',
      mimo: `Počet míst zadej jako celé číslo od 0 do ${pravidla.formular.kapacitaMax}.`,
    },
    shoda: {},
  };
}

/**
 * Číslo z textového pole (čárka i tečka, mezery) a kontrola mezí.
 * Vrací { hodnota } (null = prázdné pole), nebo { chyba } s textem hlášky.
 */
export function kontrolaCisla(text, { min = -Infinity, max = Infinity, cele = false, povinne = '', mimo = '' } = {}) {
  const n = prectiCislo(text);
  if (n === null) return povinne ? { chyba: povinne } : { hodnota: null };
  if (Number.isNaN(n)) return { chyba: cele ? 'Zadej celé číslo, bez písmen.' : 'Zadej číslo, například 62 nebo 62,5.' };
  if ((cele && !Number.isInteger(n)) || n < min || n > max) {
    return { chyba: mimo || `Zadej číslo od ${min} do ${max}.` };
  }
  return { hodnota: n };
}

/** Uchazeč pro editor: vždy 3 priority, body i dva pokusy (kvůli přepínání režimu). */
export function normalizujDite(a) {
  const priority = [...(a.priorities ?? [])];
  while (priority.length < 3) priority.push('');
  const body = a.score ?? (a.attempts ? bestOfTwo(a.attempts) : null);
  return {
    id: a.id,
    name: a.name ?? '',
    score: body,
    attempts: a.attempts
      ? { cj: [...a.attempts.cj], m: [...a.attempts.m] }
      : rozdelBody(body),
    tiebreak: a.tiebreak ?? null,
    priorities: priority.slice(0, 3),
  };
}

/** Body rozdělené do prvního pokusu (čeština, matematika) – pro přepnutí na „dva pokusy“. */
export function rozdelBody(body) {
  if (body == null) return { cj: [null, null], m: [null, null] };
  const cj = Math.min(50, Math.ceil(body / 2));
  return { cj: [cj, null], m: [Math.min(50, body - cj), null] };
}

/** Stav simulátoru ze scénáře. */
export function stavZeScenare(sc) {
  return {
    scenar: sc.id,
    rezim: sc.mode,
    skoly: sc.schools.map((s) => ({ ...s })),
    deti: sc.applicants.map(normalizujDite),
  };
}

/** Vstup pro deferredAcceptance z editoru. */
export function vstupSimulace(stav) {
  return stav.deti.map((a) => ({
    id: a.id,
    name: a.name.trim() || '(bez jména)',
    ...(stav.rezim === 'attempts' ? { attempts: a.attempts } : { score: a.score ?? 0 }),
    tiebreak: a.tiebreak,
    priorities: a.priorities.filter(Boolean),
  }));
}

/** Spustí rozřazení. Vrací { deti, vysledek, proc } nebo { deti, chyba } při shodě bodů bez rozhodnutí. */
export function spust(stav) {
  const deti = vstupSimulace(stav);
  try {
    const vysledek = deferredAcceptance(deti, stav.skoly);
    return { deti, vysledek, proc: explain(vysledek, deti, stav.skoly), chyba: null };
  } catch (e) {
    if (!(e instanceof TieError)) throw e;
    const jmena = e.applicants.map((id) => deti.find((d) => d.id === id)?.name ?? id);
    return {
      deti, vysledek: null, proc: null,
      chyba: `${jmena[0]} a ${jmena[1]} mají stejně bodů. Škola musí mít jednoznačné pořadí: vyplň u jednoho z nich, kdo vyhraje při shodě (vyšší číslo = lepší).`,
    };
  }
}

/** „1 kolo“, „2 kola“, „5 kol“. */
export function pocetKol(n) {
  return `${n} ${n === 1 ? 'kolo' : n >= 2 && n <= 4 ? 'kola' : 'kol'}`;
}

/* ---------- Termíny ---------- */

const NBSP = ' ';
const MESICE = ['leden', 'únor', 'březen', 'duben', 'květen', 'červen', 'červenec', 'srpen', 'září', 'říjen', 'listopad', 'prosinec'];
const DNY = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];
const DNY_CELE = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];

const rozloz = (iso) => iso.split('-').map(Number);
const utc = (iso) => { const [y, m, d] = rozloz(iso); return new Date(Date.UTC(y, m - 1, d)); };

/** „12. 4.“ (bez roku) */
export function denMesic(iso) {
  const [, m, d] = rozloz(iso);
  return `${d}.${NBSP}${m}.`;
}

/** „12. 4. 2027“ */
export function datumPlne(iso) {
  const [y, m, d] = rozloz(iso);
  return `${d}.${NBSP}${m}.${NBSP}${y}`;
}

/** Den v týdnu: krátce („po“) nebo celý („pondělí“). */
export function denVTydnu(iso, cely = false) {
  return (cely ? DNY_CELE : DNY)[utc(iso).getUTCDay()];
}

/** Rozsah termínu: „12. 4. 2027“ nebo „15. 3.–23. 4. 2027“ (s rokem na konci). */
export function rozsahTerminu(e) {
  if (!e.end || e.end === e.start) return datumPlne(e.start);
  const [y1] = rozloz(e.start);
  const [y2] = rozloz(e.end);
  return y1 === y2 ? `${denMesic(e.start)}–${datumPlne(e.end)}` : `${datumPlne(e.start)}–${datumPlne(e.end)}`;
}

/** Termíny vybraných skupin seřazené podle data. Skupina „ss“ (čtyřleté obory) je vždy. */
export function vyberTerminy(events, skupiny = []) {
  const s = new Set(['ss', ...skupiny]);
  return events.filter((e) => s.has(e.group)).sort((a, b) => a.start.localeCompare(b.start));
}

/** Termíny po měsících: [{ klic: '2027-02', nazev: 'únor 2027', terminy: [...] }] */
export function poMesicich(terminy) {
  const mapa = new Map();
  for (const e of terminy) {
    const [y, m] = rozloz(e.start);
    const klic = `${y}-${String(m).padStart(2, '0')}`;
    if (!mapa.has(klic)) mapa.set(klic, { klic, nazev: `${MESICE[m - 1]} ${y}`, terminy: [] });
    mapa.get(klic).terminy.push(e);
  }
  return [...mapa.values()];
}

/** Datum pro DTSTAMP v .ics: vždy pevné (den ověření pravidel), nikdy „teď“. */
export function casExportu(pravidla) {
  return new Date(`${pravidla.meta.overeno}T00:00:00Z`);
}

/**
 * Události pro buildICS: bez neověřených termínů, s poznámkou a zdrojem.
 * textPoznamky = funkce pro úpravu poznámky (tykání), upozorneni = věta na konec popisu.
 */
export function udalostiProIcs(terminy, pravidla, { textPoznamky = (t) => t, upozorneni = '' } = {}) {
  return terminy.filter((e) => e.stav !== 'neovereno').map((e) => ({
    id: `${e.id}-2027`,
    title: e.doporuceni ? `${e.title} (doporučení)` : e.title,
    start: e.start,
    end: e.end,
    description: [e.note ? textPoznamky(e.note) : '', upozorneni].filter(Boolean).join('\n'),
    url: pravidla.sources[e.source]?.url,
  }));
}
