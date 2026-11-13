// Výpočty mateřské, otcovské a rodičovského příspěvku. Čisté funkce bez DOM.
// Všechny parametry (hranice, sazby, částky) přicházejí z rules.json.

const DEN_MS = 86400000;
const MESICE_ZKR = ['led', 'úno', 'bře', 'dub', 'kvě', 'čvn', 'čvc', 'srp', 'zář', 'říj', 'lis', 'pro'];

// ---------- Datum (ISO řetězce 'YYYY-MM-DD', počítáno v UTC) ----------

export function parseDatum(iso) {
  const [y, m, d] = String(iso).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

export function formatIso(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

export function pridejDny(iso, n) {
  return formatIso(parseDatum(iso) + n * DEN_MS);
}

/** První den kalendářního měsíce posunutého o `posun` měsíců od data `iso`. */
export function prvniDenMesice(iso, posun = 0) {
  const d = new Date(parseDatum(iso));
  return formatIso(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + posun, 1));
}

export function dnuVMesici(rok, mesic /* 1–12 */) {
  return new Date(Date.UTC(rok, mesic, 0)).getUTCDate();
}

/** Rozdíl kalendářních měsíců (isoDo − isoOd). */
export function rozdilMesicu(isoOd, isoDo) {
  const a = new Date(parseDatum(isoOd));
  const b = new Date(parseDatum(isoDo));
  return (b.getUTCFullYear() - a.getUTCFullYear()) * 12 + (b.getUTCMonth() - a.getUTCMonth());
}

export function popisMesice(rok, mesic) {
  return `${MESICE_ZKR[mesic - 1]} ${rok}`;
}

const maxIso = (a, b) => (a > b ? a : b);

// ---------- Zaokrouhlení ----------

export const naHalere = (x) => Math.round((x + Number.EPSILON) * 100) / 100;
/** Zaokrouhlení na celé koruny nahoru (mezivýsledek nejdřív na haléře kvůli chybám float). */
export const nahoruKc = (x) => Math.ceil(naHalere(x));

// ---------- Nemocenské pojištění: DVZ, redukce, dávky ----------

/** Počet kalendářních dní rozhodného období = 12 kalendářních měsíců před měsícem vzniku nároku. */
export function dnyRozhodnehoObdobi(datumNaroku) {
  const od = parseDatum(prvniDenMesice(datumNaroku, -12));
  const doMs = parseDatum(prvniDenMesice(datumNaroku, 0));
  return Math.round((doMs - od) / DEN_MS);
}

/**
 * Denní vyměřovací základ = příjmy za rozhodné období / počet dní, zaokrouhleno na haléře
 * (stejně jako kalkulačka MPSV: ROUND(příjem × 12 / 365; 2)).
 */
export function dvz(mesicniPrijem, dny = 365) {
  if (!(mesicniPrijem > 0) || !(dny > 0)) return 0;
  return naHalere((mesicniPrijem * 12) / dny);
}

/** Redukovaný DVZ: pásma podle redukčních hranic, výsledek nahoru na celé Kč. */
export function redukovanyDvz(dvzHodnota, hranice, redukce = [1, 0.6, 0.3]) {
  if (!(dvzHodnota > 0)) return 0;
  const { h1, h2, h3 } = hranice;
  const p1 = Math.min(dvzHodnota, h1);
  const p2 = Math.max(0, Math.min(dvzHodnota, h2) - h1);
  const p3 = Math.max(0, Math.min(dvzHodnota, h3) - h2);
  return nahoruKc(p1 * redukce[0] + p2 * redukce[1] + p3 * redukce[2]);
}

/** Denní výše dávky (mateřská, otcovská) = sazba × redukovaný DVZ, nahoru na celé Kč. */
export function denniDavka(redDvz, sazba = 0.7) {
  if (!(redDvz > 0)) return 0;
  return nahoruKc(redDvz * sazba);
}

/** Redukční hranice podle roku vzniku nároku. Chybí-li rok, vrátí poslední známý s odhad: true. */
export function hraniceProDatum(rules, iso) {
  const roky = Object.keys(rules.redukcniHranice).map(Number).sort((a, b) => a - b);
  const rok = Number(String(iso).slice(0, 4));
  const pouzity = roky.filter((r) => r <= rok).pop() ?? roky[0];
  return { ...rules.redukcniHranice[pouzity], rok: pouzity, odhad: pouzity !== rok };
}

/** Kompletní výpočet dávky pro rodiče k danému dni nástupu. */
export function davkaRodice(rules, mesicniPrijem, narok, datumNaroku, sazba) {
  if (!narok || !(mesicniPrijem > 0)) return null;
  const dny = dnyRozhodnehoObdobi(datumNaroku);
  const d = dvz(mesicniPrijem, dny);
  const hranice = hraniceProDatum(rules, datumNaroku);
  const red = redukovanyDvz(d, hranice, rules.ppm.redukce);
  return { datum: datumNaroku, dny, dvz: d, redDvz: red, denni: denniDavka(red, sazba), hranice, sazba };
}

/**
 * Denní výše dávky v daném kalendářním roce. Dávka, na kterou vznikl nárok před 1. lednem
 * a trvá i po něm, se od 1. ledna přepočítá podle redukčních hranic nového roku; DVZ se nemění
 * (§ 22 odst. 2 zákona o nemocenském pojištění).
 */
export function davkaVRoce(rules, info, rok) {
  const rokNaroku = Number(info.datum.slice(0, 4));
  if (rok <= rokNaroku) return { rok: rokNaroku, redDvz: info.redDvz, denni: info.denni, hranice: info.hranice };
  const hranice = hraniceProDatum(rules, `${rok}-01-01`);
  const red = redukovanyDvz(info.dvz, hranice, rules.ppm.redukce);
  return { rok, redDvz: red, denni: denniDavka(red, info.sazba), hranice };
}

// ---------- Rodičovský příspěvek ----------

/** Pravidla RP podle data narození dítěte. */
export function pravidlaRp(rules, datumNarozeni) {
  const seznam = [...rules.rodicovsky].sort((a, b) => (a.narozeniOd < b.narozeniOd ? -1 : 1));
  const platna = seznam.filter((p) => p.narozeniOd <= datumNarozeni).pop();
  return platna ? { ...platna, odhad: false } : { ...seznam[0], odhad: true };
}

/** Měsíční strop RP = max(minimum, k × 0,7 × 30 × vyšší redukovaný DVZ rodičů). */
export function stropRp({ redDvz = [], vicercata = false }, rp, rules) {
  const nejvyssi = Math.max(0, ...redDvz.filter((x) => x > 0));
  const k = vicercata ? rp.nasobekVicercata : 1;
  const zDvz = Math.floor(naHalere(k * rules.rpPodilDvz * rules.rpDnu * nejvyssi));
  const minimum = vicercata ? rp.minStropVicercata : rp.minStrop;
  return Math.max(minimum, zDvz);
}

/**
 * Čerpání RP po měsících věku dítěte (0 = měsíc narození, poslední = vekMesicu, tedy měsíc
 * 3. narozenin – § 30b odst. 1 písm. d) ZSSP).
 * odecet: Map měsíc → mateřská (PPM) vyplacená v tom měsíci. RP pak náleží jen ve výši rozdílu,
 * je-li vyšší (§ 30b odst. 3 ZSSP).
 * Zbude-li po výplatě méně než částka za aktuální měsíc, vyplatí se zbytek s ní (§ 30 odst. 6 ZSSP).
 */
export function cerpaniRp({ celkem, mesicniVyse, odMesice = 0, vekMesicu = 36, odecet = null }) {
  let zbyva = celkem;
  const mesice = [];
  let mesicVycerpani = null;
  if (mesicniVyse > 0) {
    for (let m = Math.max(0, odMesice); m <= vekMesicu && zbyva > 0; m++) {
      const nalezi = Math.max(0, mesicniVyse - (odecet?.get(m) ?? 0));
      if (nalezi === 0) continue;
      let castka = Math.min(nalezi, zbyva);
      zbyva -= castka;
      if (zbyva > 0 && zbyva < nalezi) {
        castka += zbyva;
        zbyva = 0;
      }
      mesice.push({ mesic: m, castka });
      if (zbyva === 0) mesicVycerpani = m;
    }
  }
  return { mesice, vycerpano: celkem - zbyva, propadne: zbyva, mesicVycerpani };
}

/** Nejnižší měsíční výše (na stovky nahoru), se kterou se RP vyčerpá do měsíce 3. narozenin včetně. */
export function navrhVyse(celkem, odMesice, vekMesicu = 36, krok = 100) {
  const mesicu = Math.max(1, vekMesicu - odMesice + 1);
  return Math.ceil(celkem / mesicu / krok) * krok;
}

/**
 * Nejnižší výše (po krocích nahoru), se kterou se RP vyčerpá i se souběhem s mateřskou.
 * Začíná odhadem bez souběhu a přidává po kroku, nejvýš do stropu.
 */
export function navrhVyseSOdectem({ celkem, odMesice = 0, vekMesicu = 36, odecet = null, strop = Infinity, krok = 100 }) {
  let vyse = navrhVyse(celkem, odMesice, vekMesicu, krok);
  while (vyse < strop && cerpaniRp({ celkem, mesicniVyse: vyse, odMesice, vekMesicu, odecet }).propadne > 0) vyse += krok;
  return Math.min(vyse, strop);
}

// ---------- Orientační čistá mzda zaměstnance ----------

export function parametryMzdy(rules, rok) {
  const roky = Object.keys(rules.cistaMzda).map(Number).sort((a, b) => a - b);
  const pouzity = roky.filter((r) => r <= rok).pop() ?? roky[0];
  return { ...rules.cistaMzda[pouzity], rok: pouzity, odhad: pouzity !== rok };
}

/** Hrubá → čistá: pojistné zaměstnance, záloha na daň (základ na stovky nahoru), sleva na poplatníka. */
export function cistaMzda(hruba, p) {
  if (!(hruba > 0)) return 0;
  const sp = nahoruKc(hruba * p.sp);
  const zp = nahoruKc(hruba * p.zp);
  const zaklad = hruba > 100 ? Math.ceil(hruba / 100) * 100 : hruba;
  const dan = nahoruKc(zaklad * p.dan + Math.max(0, zaklad - p.hraniceDan2Mesic) * (p.dan2 - p.dan));
  return Math.round(hruba - sp - zp - Math.max(0, dan - p.slevaMesic));
}

// ---------- Plán rodiny ----------

/**
 * Poslední den (počítáno od dne narození = 0), kdy lze nastoupit na otcovskou.
 * § 38a odst. 4 zákona č. 187/2006 Sb.: 6 týdnů ode dne narození; období se prodlužuje
 * o kalendářní dny hospitalizace dítěte, které spadají do těchto 6 týdnů (nejvýš maxDni z rules.json).
 */
export function nastupOtcovskeMaxDne(rules, v) {
  const h = rules.otcovska.hospitalizace;
  const dni = v?.hospitalizace ? Math.min(h.maxDni, Math.max(0, Math.floor(Number(v.hospitalizaceDni) || 0))) : 0;
  return rules.otcovska.nastupDoDne + dni;
}

export const VYCHOZI_VSTUP = {
  terminPorodu: '2027-04-15',
  vicercata: false,
  prijemMatka: 40000,
  prijemOtec: 50000,
  narokMatka: true,
  narokOtec: true,
  kdoPpm: 'matka', // 'matka' | 'otec' | 'nikdo'
  ppmTydnuPred: 6,
  otcovska: true,
  otcovskaOdDne: 0,
  hospitalizace: false, // dítě bylo v prvních 6 týdnech hospitalizováno (§ 38a odst. 4 věta třetí ZNP)
  hospitalizaceDni: 0,
  rpVyse: null, // null = navrhnout výši, se kterou se RP vyčerpá do 3 let
  stridani: false,
  stridaniOdMesice: 12,
  navrat: false,
  navratOdMesice: 24,
};

const kc = (x) => `${new Intl.NumberFormat('cs-CZ').format(Math.round(x))} Kč`;

/** Sazby dávky po kalendářních letech, kterými dávka od začátku do konce prochází. */
function sazbyDavky(rules, info, start, konec) {
  const sazby = [];
  for (let rok = Number(start.slice(0, 4)); rok <= Number(konec.slice(0, 4)); rok++) sazby.push(davkaVRoce(rules, info, rok));
  return sazby;
}
const druhy = (kdo) => (kdo === 'matka' ? 'otec' : kdo === 'otec' ? 'matka' : null);

/**
 * Sestaví plán rodiny po kalendářních měsících: mateřská (PPM), otcovská, rodičovský příspěvek
 * a orientační čisté mzdy. Předpokládá porod v termínu.
 */
export function planRodiny(vstupy, rules) {
  const v = { ...VYCHOZI_VSTUP, ...vstupy };
  const varovani = [];
  const B = v.terminPorodu;
  const rp = pravidlaRp(rules, B);
  const vek = rp.vekMesicu;
  const P = rules.ppm;
  const sestinedeli = pridejDny(B, P.otecOdDne);
  const ppmDny = 7 * (v.vicercata ? P.tydnyVicercata : P.tydny);
  const otecPpmDny = 7 * (v.vicercata ? P.otecMaxTydnyVicercata : P.otecMaxTydny);

  const maNarok = {
    matka: Boolean(v.narokMatka) && v.prijemMatka > 0,
    otec: Boolean(v.narokOtec) && v.prijemOtec > 0,
  };

  // Kdo nastoupí na mateřskou
  let kdoPpm = v.kdoPpm;
  if (kdoPpm !== 'nikdo' && !maNarok[kdoPpm]) {
    varovani.push({
      typ: 'bezNaroku', uroven: 'pozor',
      text: `${kdoPpm === 'matka' ? 'Matka' : 'Otec'} nemá podle zadání nárok na mateřskou (chybí příjem nebo ${P.narokDnyPojisteni} dní pojištění za poslední 2 roky). Počítám bez mateřské, rodičovský příspěvek od narození.`,
    });
    kdoPpm = 'nikdo';
  }

  // Období mateřské (PPM)
  let ppm = null;
  if (kdoPpm === 'matka') {
    const tydny = Math.min(P.nastupTydnyPredMax, Math.max(P.nastupTydnyPredMin, Number(v.ppmTydnuPred) || 6));
    const start = pridejDny(B, -7 * tydny);
    ppm = { start, konec: pridejDny(start, ppmDny - 1) };
  } else if (kdoPpm === 'otec') {
    ppm = { start: sestinedeli, konec: pridejDny(sestinedeli, otecPpmDny - 1) };
  }

  // Kdo pečuje o dítě (od kterého dne)
  const useky = [];
  if (kdoPpm === 'otec') useky.push({ od: B, kdo: 'matka' }, { od: sestinedeli, kdo: 'otec' });
  else useky.push({ od: ppm ? ppm.start : B, kdo: 'matka' });

  let stridaniOd = null;
  if (v.stridani) {
    const pozadovano = prvniDenMesice(B, Number(v.stridaniOdMesice) || 0);
    stridaniOd = maxIso(pozadovano, sestinedeli);
    if (stridaniOd !== pozadovano) {
      varovani.push({
        typ: 'sestinedeli', uroven: 'info',
        text: `Druhý rodič může převzít péči s mateřskou nejdříve od 7. týdne po porodu, střídání proto počítám od ${formatCz(stridaniOd)}.`,
      });
    }
    useky.push({ od: stridaniOd, kdo: '<stridani>' });
  }
  let navratOd = null;
  if (v.navrat) {
    navratOd = maxIso(prvniDenMesice(B, Number(v.navratOdMesice) || 0), sestinedeli);
    useky.push({ od: navratOd, kdo: null });
    if (stridaniOd && navratOd <= stridaniOd) {
      varovani.push({ typ: 'navratPredStridanim', uroven: 'info', text: 'Návrat do práce je dřív než střídání, střídání se proto neprojeví.' });
    }
  }
  useky.sort((a, b) => (a.od < b.od ? -1 : a.od > b.od ? 1 : 0));
  let aktualni = null;
  for (const u of useky) {
    aktualni = u.kdo === '<stridani>' ? druhy(aktualni) : u.kdo;
    u.pecuje = aktualni;
  }
  const pecujeV = (iso) => {
    let kdo = null;
    for (const u of useky) if (u.od <= iso) kdo = u.pecuje;
    return kdo;
  };

  // Otcovská
  let otcovska = null;
  if (v.otcovska) {
    if (!maNarok.otec) {
      varovani.push({ typ: 'otcovskaBezNaroku', uroven: 'pozor', text: 'Otec nemá podle zadání příjem z pojištěného zaměstnání, otcovská se nepočítá.' });
    } else {
      // Nástup v období 6 týdnů ode dne narození, prodlouženém o dny hospitalizace dítěte
      // (§ 38a odst. 4 zákona č. 187/2006 Sb.).
      const maxDne = nastupOtcovskeMaxDne(rules, v);
      const odDne = Math.min(maxDne, Math.max(0, Number(v.otcovskaOdDne) || 0));
      const start = pridejDny(B, odDne);
      const info = davkaRodice(rules, v.prijemOtec, true, start, rules.otcovska.sazba);
      const konec = pridejDny(start, rules.otcovska.dny - 1);
      otcovska = {
        start, konec, ...info, sazby: sazbyDavky(rules, info, start, konec),
        nastupNejpozdeji: pridejDny(B, maxDne),
        prodlouzeniDni: maxDne - rules.otcovska.nastupDoDne,
      };
    }
  }

  // Den po dni: kdo pobírá mateřskou, kdo pracuje
  const startHorizontu = prvniDenMesice(ppm && ppm.start < B ? ppm.start : B);
  // Poslední den měsíce 3. narozenin (§ 30b odst. 1 písm. d) ZSSP).
  const konecHorizontu = pridejDny(prvniDenMesice(B, vek + 1), -1);
  const mesice = new Map();
  let otcovskaPrekryta = 0;
  const ppmInfo = { matka: null, otec: null };
  for (let ms = parseDatum(startHorizontu); ms <= parseDatum(konecHorizontu); ms += DEN_MS) {
    const iso = formatIso(ms);
    const index = rozdilMesicu(B, iso);
    if (!mesice.has(index)) {
      const d = new Date(ms);
      mesice.set(index, {
        index, rok: d.getUTCFullYear(), mesic: d.getUTCMonth() + 1,
        ppm: { matka: 0, otec: 0 }, ppmKc: { matka: 0, otec: 0 }, otc: 0, otcKc: 0, prace: { matka: 0, otec: 0 }, pecuje: null,
      });
    }
    const m = mesice.get(index);
    const kdo = pecujeV(iso);
    if (kdo) m.pecuje = kdo;

    let otecNaPpm = false;
    if (ppm && iso >= ppm.start && iso <= ppm.konec && kdo && maNarok[kdo] && (kdo === 'matka' || iso >= sestinedeli)) {
      if (!ppmInfo[kdo]) {
        const prijem = kdo === 'matka' ? v.prijemMatka : v.prijemOtec;
        ppmInfo[kdo] = davkaRodice(rules, prijem, true, iso, P.sazba);
      }
      m.ppm[kdo]++;
      if (kdo === 'otec') otecNaPpm = true;
      m.ppmKc[kdo] += davkaVRoce(rules, ppmInfo[kdo], Number(iso.slice(0, 4))).denni;
    }
    // Z jednoho pojištění má mateřská přednost před otcovskou (§ 48 odst. 1 písm. a) ZNP):
    // dny, kdy otec už pobírá mateřskou, se otcovská nevyplácí, podpůrčí doba se neprodlužuje.
    const otcovskaVPodpurciDobe = otcovska && iso >= otcovska.start && iso <= otcovska.konec;
    if (otcovskaVPodpurciDobe && otecNaPpm) otcovskaPrekryta++;
    const naOtcovske = otcovskaVPodpurciDobe && !otecNaPpm;
    if (naOtcovske) {
      m.otc++;
      m.otcKc += davkaVRoce(rules, otcovska, Number(iso.slice(0, 4))).denni;
    }
    if (kdo !== 'matka' && v.prijemMatka > 0) m.prace.matka++;
    if (kdo !== 'otec' && !naOtcovske && v.prijemOtec > 0) m.prace.otec++;
  }

  if (otcovskaPrekryta) {
    varovani.push({
      typ: 'otcovskaSMaterskou', uroven: 'info', dni: otcovskaPrekryta,
      text: `Otcovská se ${otcovskaPrekryta} dní kryje s mateřskou otce. Za tyto dny se vyplácí jen mateřská (§ 48 odst. 1 písm. a) zákona o nemocenském pojištění).`,
    });
  }

  for (const kdo of ['matka', 'otec']) {
    if (ppmInfo[kdo]) ppmInfo[kdo].sazby = sazbyDavky(rules, ppmInfo[kdo], ppm.start, ppm.konec);
  }

  // Rodičovský příspěvek: od měsíce narození, souběžně s mateřskou jen ve výši rozdílu
  // (§ 30b odst. 3 ZSSP). Před narozením nenáleží.
  const celkem = v.vicercata ? rp.celkemVicercata : rp.celkem;
  const ppmVMesici = new Map([...mesice.values()].filter((m) => m.index >= 0).map((m) => [m.index, m.ppmKc.matka + m.ppmKc.otec]));
  // Strop z DVZ redukovaného hranicemi roku narození dítěte (§ 30 odst. 3 písm. b) ZSSP, § 22 odst. 2 ZNP).
  const hraniceNarozeni = hraniceProDatum(rules, B);
  // DVZ matky jde stanovit i bez nároku na mateřskou (270 dní pojištění): stačí pojištěný příjem,
  // rozhoduje i DVZ pro nemocenské v souvislosti s porodem (§ 30 odst. 2 ZSSP; revize 5. 11. 2026, ROD-13).
  // U otce rozhoduje odpověď „je nemocensky pojištěný zaměstnanec“.
  const maDvz = { matka: v.prijemMatka > 0, otec: maNarok.otec };
  const dvzProRp = ['matka', 'otec'].map((kdo) => {
    if (ppmInfo[kdo]) return redukovanyDvz(ppmInfo[kdo].dvz, hraniceNarozeni, P.redukce);
    const info = davkaRodice(rules, kdo === 'matka' ? v.prijemMatka : v.prijemOtec, maDvz[kdo], B, P.sazba);
    return info ? info.redDvz : 0;
  });
  if (!maNarok.matka && dvzProRp[0] > dvzProRp[1] && rules.dvzBezNaroku) {
    varovani.push({ typ: 'dvzBezNaroku', uroven: 'info', text: rules.dvzBezNaroku.text });
  }
  const strop = stropRp({ redDvz: dvzProRp, vicercata: v.vicercata }, rp, rules);
  const navrh = navrhVyseSOdectem({ celkem, vekMesicu: vek, odecet: ppmVMesici, strop });
  let vyse = v.rpVyse == null || v.rpVyse === '' ? navrh : Number(v.rpVyse);
  if (vyse > strop) {
    varovani.push({ typ: 'nadStrop', uroven: 'pozor', text: `Zvolená výše přesahuje váš měsíční strop ${kc(strop)}, počítám se stropem.` });
    vyse = strop;
  }
  const cerpani = cerpaniRp({ celkem, mesicniVyse: vyse, odMesice: 0, vekMesicu: vek, odecet: ppmVMesici });
  const rpOd = cerpani.mesice.length ? cerpani.mesice[0].mesic : 0;
  const rpPoMesicich = new Map(cerpani.mesice.map((x) => [x.mesic, x.castka]));

  // Sestavení měsíců
  let posledniPecujici = 'matka';
  let odhadMzdy = false;
  const vystup = [...mesice.values()].sort((a, b) => a.index - b.index).map((m) => {
    if (m.pecuje) posledniPecujici = m.pecuje;
    const polozky = [];
    for (const kdo of ['matka', 'otec']) {
      if (m.ppm[kdo]) polozky.push({ typ: 'ppm', kdo, dni: m.ppm[kdo], castka: m.ppmKc[kdo] });
    }
    if (m.otc) polozky.push({ typ: 'otcovska', kdo: 'otec', dni: m.otc, castka: m.otcKc });
    if (rpPoMesicich.has(m.index)) polozky.push({ typ: 'rp', kdo: posledniPecujici, castka: rpPoMesicich.get(m.index) });
    const dim = dnuVMesici(m.rok, m.mesic);
    const pm = parametryMzdy(rules, m.rok);
    if (pm.odhad) odhadMzdy = true;
    for (const kdo of ['matka', 'otec']) {
      const prijem = kdo === 'matka' ? v.prijemMatka : v.prijemOtec;
      if (m.prace[kdo] && prijem > 0) {
        const hruba = (prijem * m.prace[kdo]) / dim;
        polozky.push({ typ: 'mzda', kdo, dni: m.prace[kdo], hruba: Math.round(hruba), castka: cistaMzda(hruba, pm) });
      }
    }
    const davky = polozky.filter((p) => p.typ !== 'mzda').reduce((s, p) => s + p.castka, 0);
    const mzdy = polozky.filter((p) => p.typ === 'mzda').reduce((s, p) => s + p.castka, 0);
    return {
      index: m.index, rok: m.rok, mesic: m.mesic, popis: popisMesice(m.rok, m.mesic),
      pecuje: m.pecuje, polozky, davky, mzdy, celkem: davky + mzdy,
    };
  });

  const soucet = (typ, kdo) => vystup.flatMap((m) => m.polozky)
    .filter((p) => p.typ === typ && (!kdo || p.kdo === kdo)).reduce((s, p) => s + p.castka, 0);
  const souhrn = {
    ppmMatka: soucet('ppm', 'matka'),
    ppmOtec: soucet('ppm', 'otec'),
    ppm: soucet('ppm'),
    otcovska: soucet('otcovska'),
    rp: cerpani.vycerpano,
    mzdy: soucet('mzda'),
  };
  souhrn.davky = souhrn.ppm + souhrn.otcovska + souhrn.rp;
  souhrn.celkem = souhrn.davky + souhrn.mzdy;

  // Upozornění
  const mesicVycerpani = cerpani.mesicVycerpani;
  const navrhProVycerpani = navrhVyseSOdectem({ celkem, vekMesicu: vek, odecet: ppmVMesici });
  if (cerpani.propadne > 0) {
    const lze = navrhProVycerpani <= strop;
    varovani.unshift({
      typ: 'propadnuti', uroven: 'pozor', castka: cerpani.propadne,
      text: `Do 3 let dítěte vyčerpáte jen ${kc(cerpani.vycerpano)}, zbylých ${kc(cerpani.propadne)} propadne. `
        + (lze
          ? `Aby se rodičovská vyčerpala celá, zvolte aspoň ${kc(navrhProVycerpani)} měsíčně.`
          : `Ani při maximální výši ${kc(strop)} se celá částka do 3 let nevyčerpá.`),
    });
  }
  const pouziteHranice = [ppmInfo.matka, ppmInfo.otec, otcovska].filter(Boolean).flatMap((x) => x.sazby.map((s) => s.hranice));
  const odhadHranice = pouziteHranice.find((h) => h.odhad);
  if (odhadHranice) {
    varovani.push({ typ: 'odhadHranice', uroven: 'info', text: `Redukční hranice pro požadovaný rok ještě nejsou v rules.json, použity hodnoty roku ${odhadHranice.rok}.` });
  }
  if (odhadMzdy) {
    varovani.push({ typ: 'odhadMzdy', uroven: 'info', text: 'Pro čistou mzdu v dalších letech jsou použity sazby roku ' + Object.keys(rules.cistaMzda).sort().pop() + '.' });
  }
  // Částka podle zákona, který je schválený, ale ještě neplatí (stav ze src/js/stav-pravidel.js).
  if (rp.stav !== 'plati' && rp.poznamka) varovani.push({ typ: 'novela400', uroven: 'info', text: rp.poznamka });
  if (v.navrat && Number(v.navratOdMesice) < 24) {
    varovani.push({
      typ: 'jesle', uroven: 'info',
      text: `Při návratu do práce se rodičovský příspěvek vyplácí dál, ale dítě mladší 2 let smí být v jeslích nebo školce nejvýš ${rules.jesleHodinMesicne} hodin měsíčně.`,
    });
  }

  return {
    vstup: { ...v, kdoPpm },
    terminPorodu: B,
    ppm,
    matka: { ppm: ppmInfo.matka },
    otec: { ppm: ppmInfo.otec, otcovska },
    rp: {
      ...rp, celkem, strop, navrh, navrhProVycerpani, vyse, odMesice: rpOd,
      vycerpano: cerpani.vycerpano, propadne: cerpani.propadne, mesicVycerpani,
      mesiceCerpani: cerpani.mesice.length,
    },
    stridaniOd, navratOd,
    mesice: vystup,
    souhrn,
    varovani,
  };
}

export function formatCz(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
}
