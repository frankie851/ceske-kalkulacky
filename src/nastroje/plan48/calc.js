// Plán48 – výpočetní modul. Bez vazby na DOM; všechny zákonné parametry
// přicházejí v objektu `sada` načteném z rules.json.

const MESICU_V_ROCE = 12;

const cislo = (x) => {
  const n = Number(x);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Pásmo státního příspěvku podle věku (vekDo null = bez horní hranice). */
export function najdiPasmo(vek, sada) {
  const pasmo = sada.statniPrispevek.pasma.find(
    (p) => vek >= p.vekOd && (p.vekDo === null || vek <= p.vekDo),
  );
  if (!pasmo) throw new Error(`Pro věk ${vek} není v pravidlech definováno pásmo.`);
  return pasmo;
}

function maNarokNaPrispevek(sada, starobniDuchod) {
  return !(starobniDuchod && sada.statniPrispevek.starobniDuchodBezNaroku);
}

/** Vklad, nad který už státní příspěvek neroste. */
export function maxUzitecnyVklad(vek, sada) {
  return najdiPasmo(vek, sada).maxZaklad;
}

/** Státní příspěvek za jeden měsíc při daném vlastním vkladu. */
export function statniPrispevekMesicni(vklad, vek, sada, { starobniDuchod = false } = {}) {
  const v = cislo(vklad);
  if (!maNarokNaPrispevek(sada, starobniDuchod)) return 0;
  const p = najdiPasmo(vek, sada);
  if (v < p.minVklad) return 0;
  return Math.round(p.sazba * Math.min(v, p.maxZaklad));
}

/**
 * Odpočet od základu daně (§ 15a ZDP) z ročních úhrnů vkladů.
 * DPS se snižuje o roční hranici (u poživatele starobního důchodu ne),
 * DIP a ŽP se počítají od první koruny, vše dohromady do ročního limitu.
 */
export function odpocet({ dpsRocne = 0, dipRocne = 0, zpRocne = 0, starobniDuchod = false }, sada) {
  const o = sada.odpocet;
  const hranice = starobniDuchod && o.duchodceBezHranice ? 0 : o.dpsRocniHranice;
  const dpsCast = Math.max(0, cislo(dpsRocne) - hranice);
  const dip = cislo(dipRocne);
  const zp = cislo(zpRocne);
  const hruby = dpsCast + dip + zp;
  const vyuzity = Math.min(hruby, o.limitRocni);
  return { dpsCast, dip, zp, hruby, vyuzity, nevyuzity: o.limitRocni - vyuzity, limit: o.limitRocni, hranice };
}

export function danovaUspora(castka, sazba) {
  return Math.round(cislo(castka) * cislo(sazba));
}

/**
 * Celý rok: předpokládá, že zadané měsíční vklady platí všech 12 měsíců.
 * `mesicuProbehlo` říká, kolik měsíců už letos uplynulo – zbývající měsíce
 * lze ještě využít k navýšení vkladu kvůli státnímu příspěvku.
 */
export function spocitejRok(vstup, sada) {
  const vek = cislo(vstup.vek);
  const dps = cislo(vstup.dps);
  const dip = cislo(vstup.dip);
  const zp = cislo(vstup.zp);
  const sazbaDane = cislo(vstup.sazbaDane);
  const starobniDuchod = Boolean(vstup.starobniDuchod);
  const probehlo = Math.min(MESICU_V_ROCE - 1, Math.floor(cislo(vstup.mesicuProbehlo)));
  const zbyva = MESICU_V_ROCE - probehlo;

  const prispevekMesicne = statniPrispevekMesicni(dps, vek, sada, { starobniDuchod });
  const statniPrispevekRocne = prispevekMesicne * MESICU_V_ROCE;

  const o = odpocet(
    { dpsRocne: dps * MESICU_V_ROCE, dipRocne: dip * MESICU_V_ROCE, zpRocne: zp * MESICU_V_ROCE, starobniDuchod },
    sada,
  );
  const uspora = danovaUspora(o.vyuzity, sazbaDane);

  // 1) Státní příspěvek: navýšit vklad na zbývající měsíce.
  let prispevek = null;
  let dpsRocnePoNavyseni = dps * MESICU_V_ROCE;
  if (maNarokNaPrispevek(sada, starobniDuchod)) {
    const cil = maxUzitecnyVklad(vek, sada);
    if (dps < cil) {
      const maxMesicne = statniPrispevekMesicni(cil, vek, sada, { starobniDuchod });
      prispevek = {
        navysitNa: cil,
        mesicu: zbyva,
        ziskate: zbyva * (maxMesicne - prispevekMesicne),
        propadlo: probehlo * (maxMesicne - prispevekMesicne),
      };
      dpsRocnePoNavyseni = dps * probehlo + cil * zbyva;
    }
  }

  // 2) Odpočet: jednorázově doplatit mezeru v limitu do 31. 12.
  const oPo = odpocet(
    { dpsRocne: dpsRocnePoNavyseni, dipRocne: dip * MESICU_V_ROCE, zpRocne: zp * MESICU_V_ROCE, starobniDuchod },
    sada,
  );
  let odpocetRada = null;
  if (oPo.nevyuzity > 0) {
    const doHranice = Math.max(0, oPo.hranice - dpsRocnePoNavyseni);
    odpocetRada = {
      doplatekDipZp: oPo.nevyuzity,
      doplatekDps: oPo.nevyuzity + doHranice,
      uspora: danovaUspora(oPo.nevyuzity, sazbaDane),
    };
  }

  return {
    statniPrispevekMesicne: prispevekMesicne,
    statniPrispevekRocne,
    zamestnavatelRocne: cislo(vstup.zamestnavatel) * MESICU_V_ROCE,
    odpocet: o,
    uspora,
    mesicuZbyva: zbyva,
    doporuceni: { prispevek, odpocet: odpocetRada, hotovo: !prispevek && !odpocetRada },
  };
}

/**
 * Projekce hodnoty DPS + DIP do věku `vekKonec`. Měsíční skládání,
 * čistá roční sazba = výnos − poplatek. Státní příspěvek se počítá
 * podle věku v daném roce. ŽP se nezahrnuje (pojistný produkt).
 */
export function projekce(vstup, sada, { vynos, poplatek, vekKonec }) {
  const vek0 = Math.floor(cislo(vstup.vek));
  const dps = cislo(vstup.dps);
  const mesicniVklad = (vek) =>
    dps +
    cislo(vstup.zamestnavatel) +
    cislo(vstup.dip) +
    statniPrispevekMesicni(dps, vek, sada, { starobniDuchod: Boolean(vstup.starobniDuchod) });

  const cista = Math.max(-0.99, Number(vynos) - Number(poplatek));
  const i = Math.pow(1 + cista, 1 / MESICU_V_ROCE) - 1;

  const body = [{ vek: vek0, vlozeno: 0, hodnota: 0 }];
  let vlozeno = 0;
  let hodnota = 0;
  for (let vek = vek0; vek < vekKonec; vek++) {
    const v = mesicniVklad(vek);
    for (let m = 0; m < MESICU_V_ROCE; m++) {
      hodnota = hodnota * (1 + i) + v;
      vlozeno += v;
    }
    body.push({ vek: vek + 1, vlozeno: Math.round(vlozeno), hodnota: Math.round(hodnota) });
  }
  return body;
}
