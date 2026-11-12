// Odpočet příspěvků na penzijní připojištění a doplňkové penzijní spoření od základu daně.
// § 15 odst. 7 zákona č. 586/1992 Sb.: odečíst lze jen tu část MĚSÍČNÍHO příspěvku, která
// převyšuje částku, od které náleží nejvyšší státní příspěvek. Počítá se tedy po měsících,
// ne z ročního úhrnu. Hranici předává volající z rules.json, žádné částky tady nejsou.
// Sdílí ho Plán48, Penzijko kompas a Slevy 2027.

const MESICU_V_ROCE = 12;

const kladne = (x) => {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/**
 * Součet částí měsíčních příspěvků nad hranicí.
 * @param {number[]} mesicniVklady příspěvky za jednotlivé měsíce (obvykle 12)
 * @param {number} hraniceMesicni částka, od které náleží nejvyšší státní příspěvek (0 = celé)
 */
export function odpocitatelnaCastDps(mesicniVklady, hraniceMesicni) {
  const h = kladne(hraniceMesicni);
  return mesicniVklady.reduce((s, v) => s + Math.max(0, kladne(v) - h), 0);
}

/** Roční úhrn rozložený rovnoměrně do 12 měsíců (když měsíční profil neznáme). */
export function rovnomerne(rocne) {
  return Array(MESICU_V_ROCE).fill(kladne(rocne) / MESICU_V_ROCE);
}
