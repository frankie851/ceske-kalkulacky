// Zdaním to? – dividendy ze zahraničí: přepočet na koruny, česká daň, zápočet zahraniční daně,
// doplatek a přeplatek po zemích (čisté funkce, bez DOM).
// Žádné sazby ani kurzy tu nejsou natvrdo: vše přichází v parametru rules (rules.json).

export const ZPUSOBY = ['denni', 'jednotny'];

/** Chyba vstupu s kódem (kombinace kurzů, chybějící kurz…), kterou UI ukáže jako text. */
export class ChybaDividend extends Error {
  constructor(kod, text, data = {}) {
    super(text);
    this.name = 'ChybaDividend';
    this.kod = kod;
    this.data = data;
  }
}

const zaokrouhli = (n) => Math.round(n * 100) / 100;
const jeKladne = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Jednotný kurz z rules pro rok a měnu, nebo null (pokyn GFŘ zatím nevyšel). */
export function jednotnyKurzZPravidel(rules, rok, mena) {
  const r = rules.kurzy?.jednotny?.[String(rok)];
  return r && typeof r[mena] === 'number' ? r[mena] : null;
}

/**
 * Ověří způsob přepočtu a doplní kurzy. Vrátí výplaty s kurzem (číslo).
 * Chyby (ChybaDividend): 'kombinace-kurzu', 'ruzne-jednotne-kurzy', 'chybi-kurz', 'neplatny-vstup'.
 */
export function pripravKurzy(vyplaty, rok, rules) {
  const zpusoby = new Set(vyplaty.map((v) => v.zpusobKurzu));
  for (const z of zpusoby) {
    if (!ZPUSOBY.includes(z)) throw new ChybaDividend('neplatny-vstup', 'Vyber způsob přepočtu: denní kurz ČNB, nebo jednotný kurz.');
  }
  if (zpusoby.size > 1) {
    throw new ChybaDividend('kombinace-kurzu',
      `V jednom roce (${rok}) nejde kombinovat jednotný kurz a denní kurzy ČNB. Přepočítej všechny výplaty za rok stejným způsobem.`);
  }
  const jednotne = {};
  return vyplaty.map((v, i) => {
    let kurz = v.kurz;
    if (v.zpusobKurzu === 'jednotny') {
      if (kurz == null) kurz = jednotnyKurzZPravidel(rules, rok, v.mena);
      if (kurz != null) {
        if (jednotne[v.mena] != null && jednotne[v.mena] !== kurz) {
          throw new ChybaDividend('ruzne-jednotne-kurzy',
            `Jednotný kurz platí pro celý rok. Všechny výplaty v ${v.mena} musí mít stejný kurz.`, { mena: v.mena, index: i });
        }
        jednotne[v.mena] = kurz;
      }
    }
    if (!(typeof kurz === 'number' && Number.isFinite(kurz) && kurz > 0)) {
      throw new ChybaDividend('chybi-kurz',
        v.zpusobKurzu === 'jednotny'
          ? `Jednotný kurz pro ${v.mena} za rok ${rok} zatím nevyšel. Zadej ho ručně.`
          : `U výplaty ${i + 1} chybí kurz ČNB ke dni výplaty.`, { index: i });
    }
    return { ...v, kurz };
  });
}

/** Kontrola částek jedné výplaty. Vrátí pole chyb { pole, text }. */
export function zkontrolujVyplatu(v, rules) {
  const chyby = [];
  if (!rules.dividendy.zeme[v?.zeme]) chyby.push({ pole: 'zeme', text: 'Vyber zemi, ze které dividenda přišla.' });
  if (!jeKladne(v?.hruba)) chyby.push({ pole: 'hruba', text: 'Zadej hrubou dividendu (před srážkou).' });
  if (!rules.dividendy.meny.includes(v?.mena)) chyby.push({ pole: 'mena', text: 'Vyber měnu.' });
  if (!jeKladne(v?.srazeno ?? 0)) chyby.push({ pole: 'srazeno', text: 'Sraženou daň zadej jako kladné číslo, nebo 0.' });
  else if (jeKladne(v?.hruba) && (v.srazeno ?? 0) > v.hruba) chyby.push({ pole: 'srazeno', text: 'Sražená daň nemůže být vyšší než hrubá dividenda.' });
  return chyby;
}

/**
 * Spočítá dividendy za rok po zemích.
 * @param {Array<{zeme, hruba, mena, srazeno, kurz, zpusobKurzu}>} vyplaty – částky v měně výplaty
 * @param {{ rok: number }} nastaveni
 * @param {object} rules – celý rules.json
 * @returns {{ rok, zeme: Array, celkem, upozorneni }}
 * @throws {ChybaDividend} při kombinaci kurzů, chybějícím kurzu nebo neplatném vstupu
 */
export function spocitejDividendy(vyplaty, { rok }, rules) {
  const sazba = rules.dane.sazba.hodnota;
  for (const [i, v] of vyplaty.entries()) {
    const chyby = zkontrolujVyplatu(v, rules);
    if (chyby.length) throw new ChybaDividend('neplatny-vstup', `Výplata ${i + 1}: ${chyby[0].text}`, { index: i, chyby });
  }
  const sKurzy = pripravKurzy(vyplaty, rok, rules);

  const poZemich = new Map();
  for (const v of sKurzy) {
    const z = poZemich.get(v.zeme) || { zeme: v.zeme, zakladKc: 0, srazenoKc: 0, pocet: 0, meny: new Set() };
    z.zakladKc += v.hruba * v.kurz;
    z.srazenoKc += (v.srazeno ?? 0) * v.kurz;
    z.pocet += 1;
    z.meny.add(v.mena);
    poZemich.set(v.zeme, z);
  }

  const upozorneni = [];
  const zeme = [...poZemich.values()].map((z) => {
    const info = rules.dividendy.zeme[z.zeme];
    const smluvni = info.smluvniSazba?.hodnota ?? null;
    const zakladKc = zaokrouhli(z.zakladKc);
    const srazenoKc = zaokrouhli(z.srazenoKc);
    const ceskaDan = zaokrouhli(zakladKc * sazba);
    const limitSmlouvy = smluvni == null ? null : zaokrouhli(zakladKc * smluvni);
    const zapocet = Math.min(srazenoKc, limitSmlouvy ?? Infinity, ceskaDan);
    const doplatek = zaokrouhli(Math.max(0, ceskaDan - zapocet));
    const preplaceno = zaokrouhli(Math.max(0, srazenoKc - zapocet));
    const smluvniNeoverena = smluvni == null && srazenoKc > 0;
    if (smluvniNeoverena) upozorneni.push({ id: 'smluvni-sazba', zeme: z.zeme, nazev: info.nazev, stav: info.smluvniSazba?.stav });
    return {
      zeme: z.zeme, nazev: info.nazev, pocet: z.pocet, meny: [...z.meny],
      zakladKc, srazenoKc, ceskaDan, smluvniSazba: smluvni, limitSmlouvy,
      zapocet: zaokrouhli(zapocet), doplatek, preplaceno, smluvniNeoverena,
      w8ben: Boolean(info.w8ben) && preplaceno > 0,
    };
  });

  const secti = (k) => zaokrouhli(zeme.reduce((s, z) => s + z[k], 0));
  const celkem = {
    zakladKc: secti('zakladKc'), srazenoKc: secti('srazenoKc'), ceskaDan: secti('ceskaDan'),
    zapocet: secti('zapocet'), doplatek: secti('doplatek'), preplaceno: secti('preplaceno'),
  };
  return { rok, zpusob: sKurzy[0]?.zpusobKurzu ?? null, zeme, celkem, upozorneni };
}
