// Rodičovská – kontrola uloženého plánu před obnovením formuláře (revize 5. 11. 2026, ROD-14).
// Záznam v localStorage může být poškozený nebo podvržený. Do formuláře pustíme jen hodnoty
// správného typu v rozsahu, který formulář sám přijímá; ostatní zahodíme a pole si nechá výchozí
// hodnotu. Meze jdou z rules.json, žádné zákonné hodnoty tu nejsou natvrdo.
import { prectiCislo } from '../../js/cislo-vstup.js';

const MAX_DELKA = 40;
const VOLBY_RP = ['navrh', 'max', 'vlastni'];
const RADIA = ['vicercata', 'narok-matka', 'narok-otec', 'kdo-ppm', 'otcovska', 'hospitalizace', 'stridani', 'navrat'];

/** Meze polí formuláře podle pravidel (stejné jako kontrola v app.js). */
export function mezeFormulare(rules) {
  return {
    terminMin: [...rules.rodicovsky].map((r) => r.narozeniOd).sort()[0],
    vekMax: Math.max(...rules.rodicovsky.map((r) => r.vekMesicu)) - 1,
    otcovskaMax: rules.otcovska.nastupDoDne,
    hospitalizaceMax: rules.otcovska.hospitalizace.maxDni,
    ppmTydnuMin: rules.ppm.nastupTydnyPredMin,
    ppmTydnuMax: rules.ppm.nastupTydnyPredMax,
  };
}

const text = (x) => typeof x === 'string' && x.length <= MAX_DELKA;

function platneDatum(x, min) {
  if (!text(x) || !/^\d{4}-\d{2}-\d{2}$/.test(x)) return false;
  const [r, m, d] = x.split('-').map(Number);
  const dt = new Date(Date.UTC(r, m - 1, d));
  return dt.getUTCFullYear() === r && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d && x >= min;
}

function platnyPrijem(x) {
  if (!text(x)) return false;
  const n = prectiCislo(x);
  return n !== null && Number.isFinite(n) && n >= 0;
}

function celeVRozsahu(x, min, max) {
  if (!text(x)) return false;
  const n = prectiCislo(x);
  return Number.isInteger(n) && n >= min && n <= max;
}

/**
 * Vrátí kopii uložených dat jen s platnými položkami. Klíče jsou id polí formuláře
 * (termin, prijem-matka, …), názvy přepínačů a rpVolba / rpVyse.
 */
export function ocistiUlozene(data, meze) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return {};
  const pravidla = {
    termin: (x) => platneDatum(x, meze.terminMin),
    'prijem-matka': platnyPrijem,
    'prijem-otec': platnyPrijem,
    'ppm-tydnu': (x) => celeVRozsahu(x, meze.ppmTydnuMin, meze.ppmTydnuMax),
    // S hospitalizací dítěte může být nástup na otcovskou později; přesnou mez ověří formulář.
    'otcovska-od': (x) => celeVRozsahu(x, 0, meze.otcovskaMax + meze.hospitalizaceMax),
    'hospitalizace-dni': (x) => celeVRozsahu(x, 0, meze.hospitalizaceMax),
    'stridani-od': (x) => celeVRozsahu(x, 1, meze.vekMax),
    'navrat-od': (x) => celeVRozsahu(x, 1, meze.vekMax),
    rpVolba: (x) => VOLBY_RP.includes(x),
    rpVyse: (x) => Number.isInteger(x) && x >= 0,
  };
  // Přepínače: hodnotu ještě ověří formulář (musí existovat input s touto hodnotou).
  for (const n of RADIA) pravidla[n] = (x) => text(x) && /^[a-z]+$/.test(x);
  const vysledek = {};
  for (const [klic, platne] of Object.entries(pravidla)) {
    if (Object.hasOwn(data, klic) && platne(data[klic])) vysledek[klic] = data[klic];
  }
  return vysledek;
}
