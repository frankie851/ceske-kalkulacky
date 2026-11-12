// Čtení čísel z textových polí v českém zápisu. Sdílí ho všechny kalkulačky webu, aby
// „40 000“, „40.000“ i „1500,50“ znamenaly všude totéž (revize 5. 11. 2026).
//
// Pravidla:
// - mezery, pevné a úzké mezery a „Kč“ na konci se ignorují,
// - čárka je desetinná,
// - tečka, za kterou následují přesně tři číslice (a číslo nezačíná nulou), odděluje tisíce:
//   „40.000“ = 40 000, „1.234.567,5“ = 1 234 567,5,
// - jiná tečka je desetinná: „1.5“ = 1,5, „0.850“ = 0,85,
// - prázdné pole vrací null, nečitelný zápis NaN (pole pak ukáže hlášku).

const MEZERY = /[\s   ]/g;
const TISICE_TECKOU = /^[1-9]\d{0,2}(\.\d{3})+(,\d+)?$/;
const DESETINNE = /^\d*[.,]?\d+$/;

/**
 * @param {unknown} text hodnota pole
 * @param {{ zaporne?: boolean }} [volby] zaporne: false = znaménko minus je chyba
 * @returns {number|null} číslo, null pro prázdné pole, NaN pro nečitelný zápis
 */
export function prectiCislo(text, { zaporne = true } = {}) {
  let t = String(text ?? '').replace(MEZERY, '').replace(/kč$/i, '');
  if (t === '') return null;
  let znamenko = 1;
  if (t[0] === '-' || t[0] === '+') {
    if (t[0] === '-') {
      if (!zaporne) return NaN;
      znamenko = -1;
    }
    t = t.slice(1);
  }
  let n;
  if (TISICE_TECKOU.test(t)) n = Number(t.replace(/\./g, '').replace(',', '.'));
  else if (DESETINNE.test(t)) n = Number(t.replace(',', '.'));
  else return NaN;
  return znamenko * n;
}
