// Výpočty náhrad za tuzemské pracovní cesty (zákoník práce § 157, § 158, § 163, § 176).
// Čisté funkce bez DOM a bez I/O. Všechny peněžní částky se počítají v haléřích (celá čísla),
// aby nevznikaly chyby plovoucí čárky.

export class ChybaSazby extends Error {
  constructor(message) { super(message); this.name = 'ChybaSazby'; }
}
export class ChybaVstupu extends Error {
  constructor(message) { super(message); this.name = 'ChybaVstupu'; }
}

export const PALIVA = {
  benzin95: { nazev: 'Benzin 95', jednotka: 'l' },
  benzin98: { nazev: 'Benzin 98', jednotka: 'l' },
  nafta: { nazev: 'Motorová nafta', jednotka: 'l' },
  elektrina: { nazev: 'Elektřina', jednotka: 'kWh' },
};

export const DRUHY_VOZIDEL = {
  osobni: 'Osobní automobil',
  jednostope: 'Jednostopé vozidlo / tříkolka',
};

const PASMA = ['5–12 h', '12–18 h', 'nad 18 h'];
const MAX_JIDEL = 3;
export const nazevPasma = (p) => (p < 0 ? 'pod 5 h' : PASMA[p]);

// --- pomocné ---

/** Celočíselné dělení se zaokrouhlením na nejbližší, polovina nahoru (pro nezáporná čísla). */
function delZaokr(citatel, jmenovatel) {
  const q = Math.floor(citatel / jmenovatel);
  const zbytek = citatel - q * jmenovatel;
  return 2 * zbytek >= jmenovatel ? q + 1 : q;
}

/** Převede kladné desetinné číslo na celé číslo v jednotkách 1/meritko (např. Kč → haléře). */
function naCele(hodnota, meritko, nazev) {
  const n = Number(hodnota);
  if (!Number.isFinite(n) || n < 0) throw new ChybaVstupu(`${nazev}: zadejte nezáporné číslo.`);
  return Math.round(n * meritko);
}

const ISO_DATUM = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATUM_CAS = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;

function parseDatumCas(s, nazev) {
  const m = ISO_DATUM_CAS.exec(String(s ?? ''));
  if (!m) throw new ChybaVstupu(`${nazev}: zadejte datum a čas.`);
  // UTC = „nástěnné“ hodiny bez vlivu letního času
  return Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]) / 60000; // minuty
}

const minutyNaDatum = (min) => new Date(min * 60000).toISOString().slice(0, 10);

// --- sazby ---

/** Vrátí sazby pro rok podle data cesty, nebo vyhodí ChybaSazby s vysvětlením. */
export function pravidlaProDatum(rules, datum) {
  const m = ISO_DATUM.exec(String(datum ?? '').slice(0, 10));
  if (!m) throw new ChybaVstupu('Chybí datum cesty.');
  const rok = m[1];
  if (!Object.prototype.hasOwnProperty.call(rules, rok)) {
    throw new ChybaSazby(
      `Pro rok ${rok} nejsou v aplikaci sazby. Aplikace počítá jen roky, pro které je v rules.json ` +
      `zapsána vyhláška MPSV o sazbách cestovních náhrad.`);
  }
  const r = rules[rok];
  if (r === null) {
    throw new ChybaSazby(
      `Vyhláška MPSV se sazbami cestovních náhrad pro rok ${rok} zatím nevyšla ve Sbírce zákonů ` +
      `(nebo ještě nebyla doplněna do aplikace). Sazbu za km, stravné ani průměrné ceny PHM pro rok ` +
      `${rok} proto nelze určit a výpočet se neprovede. Sazby z předchozího roku se nepoužijí, ` +
      `protože by výsledek mohl být nesprávný.`);
  }
  return r;
}

/** Cena PHM v haléřích za litr / kWh: z dokladu, jinak vyhlášková platná ke dni `datum`. */
export function cenaPHM(r, palivo, datum, cenaDoklad) {
  if (cenaDoklad !== undefined && cenaDoklad !== null && cenaDoklad !== '') {
    const cenaHal = naCele(cenaDoklad, 100, 'Cena PHM z dokladu');
    if (cenaHal <= 0) throw new ChybaVstupu('Cena PHM z dokladu musí být větší než 0.');
    return { cenaHal, zdroj: 'doklad' };
  }
  const obdobi = r.phm?.[palivo];
  if (!obdobi?.length) throw new ChybaVstupu(`Neznámé palivo „${palivo}“.`);
  const den = String(datum).slice(0, 10);
  let platna = null;
  for (const o of obdobi) if (o.od <= den && (!platna || o.od >= platna.od)) platna = o;
  if (!platna) throw new ChybaSazby(`Pro ${den} není v rules.json průměrná cena paliva „${palivo}“.`);
  return { cenaHal: Math.round(platna.cena * 100), zdroj: 'vyhlaska', od: platna.od };
}

// --- náhrady za vozidlo ---

/**
 * Základní náhrada = km × sazba (Kč/km), s přívěsem zvýšená o navyseniPct (§ 157 odst. 4 ZP).
 * Km na desetiny, výsledek v haléřích z přesného součinu (ne ze zaokrouhlené zvýšené sazby).
 */
export function zakladniNahrada(km, sazbaKc, navyseniPct = 0) {
  const km10 = naCele(km, 10, 'Počet km');
  const sazbaHal = Math.round(sazbaKc * 100);
  return delZaokr(km10 * sazbaHal * (100 + navyseniPct), 10 * 100);
}

/** Náhrada za PHM = km × spotřeba / 100 × cena. Spotřeba na setiny, cena v haléřích. */
export function nahradaPHM(km, spotreba, cenaHal) {
  const km10 = naCele(km, 10, 'Počet km');
  const sp100 = naCele(spotreba, 100, 'Spotřeba');
  return delZaokr(km10 * sp100 * cenaHal, 10 * 100 * 100);
}

// --- stravné ---

/** Rozdělí dobu cesty na kalendářní dny: [{ datum, minuty }]. */
export function hodinyPoDnech(odjezd, navrat) {
  const a = parseDatumCas(odjezd, 'Odjezd');
  const b = parseDatumCas(navrat, 'Návrat');
  if (b <= a) throw new ChybaVstupu('Návrat musí být později než odjezd.');
  if (b - a > 31 * 1440) throw new ChybaVstupu('Cesta delší než 31 dní – rozdělte ji prosím.');
  const dny = [];
  let zacatek = a;
  while (zacatek < b) {
    const pulnoc = (Math.floor(zacatek / 1440) + 1) * 1440;
    const konec = Math.min(pulnoc, b);
    dny.push({ datum: minutyNaDatum(zacatek), minuty: konec - zacatek });
    zacatek = konec;
  }
  return dny;
}

/** Časové pásmo stravného: -1 = pod 5 h, 0 = 5–12 h, 1 = nad 12 do 18 h, 2 = nad 18 h. */
export function pasmo(minuty) {
  if (minuty < 5 * 60) return -1;
  if (minuty <= 12 * 60) return 0;
  if (minuty <= 18 * 60) return 1;
  return 2;
}

/**
 * Stravné za jeden kalendářní den.
 * Soukromá sféra (§ 163): minimum z vyhlášky; krácení „až o“ 70/35/25 % za jídlo, nižší
 *   procento může zaměstnavatel určit předem (hlavicka.kraceniPct).
 * Veřejná sféra (§ 176): částka v rozpětí vyhlášky (hlavicka.stravneVerejna, jinak dolní
 *   hranice); krácení pevně 70/35/25 %.
 */
export function stravneDen(minuty, jidla, hlavicka, r) {
  const p = pasmo(minuty);
  const pocetJidel = Number(jidla ?? 0);
  if (!Number.isInteger(pocetJidel) || pocetJidel < 0 || pocetJidel > MAX_JIDEL) {
    throw new ChybaVstupu('Počet poskytnutých jídel za den musí být 0 až 3.');
  }
  if (p < 0) return { pasmo: p, zakladHal: 0, pct: 0, jidla: pocetJidel, stravneHal: 0 };

  let zakladKc;
  let pct;
  if (hlavicka.sfera === 'verejna') {
    const min = r.stravne.verejnaMin[p];
    const max = r.stravne.verejnaMax[p];
    zakladKc = hlavicka.stravneVerejna?.[p] ?? min;
    if (!(zakladKc >= min && zakladKc <= max)) {
      throw new ChybaVstupu(`Stravné ve veřejné sféře pro pásmo ${PASMA[p]} musí být ${min}–${max} Kč.`);
    }
    pct = r.kraceniMaxPct[p];
  } else if (hlavicka.sfera === 'soukroma') {
    zakladKc = r.stravne.soukroma[p];
    const max = r.kraceniMaxPct[p];
    pct = hlavicka.kraceniPct?.[p] ?? max;
    if (!(pct >= 0 && pct <= max)) {
      throw new ChybaVstupu(`Krácení pro pásmo ${PASMA[p]} může být nejvýše ${max} % za jídlo.`);
    }
  } else {
    throw new ChybaVstupu('Zvolte sféru (soukromá / veřejná).');
  }

  const zakladHal = Math.round(zakladKc * 100);
  const snizeni = delZaokr(zakladHal * pct * pocetJidel, 100);
  return { pasmo: p, zakladHal, pct, jidla: pocetJidel, stravneHal: Math.max(0, zakladHal - snizeni) };
}

// --- celá cesta ---

/**
 * Spočítá jednu cestu.
 * cesta: { odjezd: 'YYYY-MM-DDTHH:MM', navrat, km, jidla: { 'YYYY-MM-DD': počet }, cenaDoklad?, prives? }
 */
export function spocitejCestu(hlavicka, cesta, rules) {
  const dny = hodinyPoDnech(cesta.odjezd, cesta.navrat);
  // ověří, že pro všechny dny cesty existují sazby (např. cesta přes Silvestr)
  const pravidlaDnu = dny.map((d) => pravidlaProDatum(rules, d.datum));
  const r = pravidlaDnu[0];

  const privesPct = cesta.prives ? rules.zakonik.prives.pct : 0;

  const km = Number(cesta.km ?? 0);
  let zakladniHal = 0;
  let phmHal = 0;
  let cena = null;
  if (km > 0) {
    const v = hlavicka.vozidlo ?? {};
    const sazba = r.sazbaKm[v.druh];
    if (sazba === undefined) throw new ChybaVstupu('Zvolte druh vozidla.');
    if (!(Number(v.spotreba) > 0)) throw new ChybaVstupu('Zadejte spotřebu vozidla z technického průkazu.');
    zakladniHal = zakladniNahrada(km, sazba, privesPct);
    cena = cenaPHM(r, v.palivo, dny[0].datum, cesta.cenaDoklad);
    phmHal = nahradaPHM(km, v.spotreba, cena.cenaHal);
  } else if (!(km === 0)) {
    throw new ChybaVstupu('Počet km musí být nezáporné číslo.');
  }

  const dnyVysledek = dny.map((d, i) => ({
    ...d,
    ...stravneDen(d.minuty, cesta.jidla?.[d.datum] ?? 0, hlavicka, pravidlaDnu[i]),
  }));
  const oddeleneHal = dnyVysledek.reduce((s, d) => s + d.stravneHal, 0);

  // § 163 odst. 4 ZP: cesta, která spadá do 2 kalendářních dnů, se posoudí jako celek,
  // je-li to pro zaměstnance výhodnější. Jídla obou dnů se sečtou (nejvýš 3 za pásmo),
  // sazby a krácení podle dne odjezdu.
  let spolecne = null;
  if (dny.length === 2) {
    const jidla = Math.min(MAX_JIDEL, dny.reduce((s, d) => s + Number(cesta.jidla?.[d.datum] ?? 0), 0));
    const celkem = stravneDen(dny[0].minuty + dny[1].minuty, jidla, hlavicka, r);
    if (celkem.stravneHal > oddeleneHal) spolecne = { ...celkem, minuty: dny[0].minuty + dny[1].minuty };
  }
  const stravneHal = spolecne ? spolecne.stravneHal : oddeleneHal;

  return {
    vyhlaska: r.vyhlaska,
    dny: dnyVysledek,
    posouzeni: spolecne ? 'spolecne' : 'oddelene',
    spolecne,
    privesPct,
    sazbaKm: km > 0 ? r.sazbaKm[hlavicka.vozidlo.druh] : null,
    cena,
    zakladniHal,
    phmHal,
    stravneHal,
    celkemHal: zakladniHal + phmHal + stravneHal,
  };
}

/** Součty po položkách; celková částka zaokrouhlená nahoru na celé koruny (konvence aplikace). */
export function souhrn(vysledky) {
  const s = { zakladniHal: 0, phmHal: 0, stravneHal: 0, celkemHal: 0 };
  for (const v of vysledky) {
    s.zakladniHal += v.zakladniHal;
    s.phmHal += v.phmHal;
    s.stravneHal += v.stravneHal;
    s.celkemHal += v.celkemHal;
  }
  s.celkemKc = Math.ceil(s.celkemHal / 100);
  return s;
}

/** 123456 → „1 234,56 Kč“ (s nezlomitelnými mezerami). */
export function formatKc(halere, { haleru = true } = {}) {
  const zaporne = halere < 0;
  const abs = Math.abs(Math.round(halere));
  const kc = Math.floor(abs / 100);
  const hal = String(abs % 100).padStart(2, '0');
  const kcText = String(kc).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${zaporne ? '−' : ''}${kcText}${haleru ? ',' + hal : ''} Kč`;
}

/** „2026-03-15“ → „15. 3. 2026“ */
export function formatDatum(iso) {
  const m = ISO_DATUM.exec(String(iso).slice(0, 10));
  return m ? `${+m[3]}. ${+m[2]}. ${m[1]}` : '';
}

/** 630 → „10:30 h“ */
export const formatMinuty = (min) => `${Math.floor(min / 60)}:${String(min % 60).padStart(2, '0')} h`;
