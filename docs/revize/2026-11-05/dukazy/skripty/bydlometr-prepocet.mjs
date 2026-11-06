// Nezávislý referenční přepočet pro revizi Bydlometru (5. 11. 2026).
// Napsáno od nuly podle úředních pravidel z rejstříku pravidla.md (FD-01 … FD-24) a textu
// zákona č. 257/2016 Sb. § 117 (zakonyprolidi.cz, staženo 5. 11. 2026). Kód aplikace zde NENÍ
// importovaný ani opsaný. Porovnání s modulem aplikace dělá bydlometr-porovnani.mjs.
//
// Spuštění: node bydlometr-prepocet.mjs   → vypíše případy jako JSON (použije porovnání)

// ---------- úřední konstanty (rejstřík) ----------
export const PRAVIDLA = {
  ltvVlastni: 0.8,          // FD-01 ČNB 4. 6. 2026
  ltvMladi: 0.9,            // FD-02
  vekMladi: 36,             // FD-03 „mladší 36 let“ → věk < 36
  ltvInvesticni: 0.7,       // FD-04 doporučení od 1. 4. 2026
  dtiInvesticni: 7,         // FD-05
  bezplatnyPodil: 0.25,     // FD-08 § 117 odst. 3 písm. h) – z celkové výše úvěru
  oknoMesicu: 1,            // FD-09
  sazbaZaRok: 0.0025,       // FD-11 § 117 odst. 4
  stropNahrady: 0.01,       // FD-12
  limitOdpoctu: 150000,     // FD-14 § 15 odst. 4 ZDP
  limitOdpoctuPred2021: 300000, // FD-15
  danZakladni: 0.15,        // FD-16 § 16 ZDP
  danVyssi: 0.23,
  novaPravidlaOd: '2024-09-01', // FD-07 zákon 462/2023 Sb.
};

// ---------- anuita ----------
/** Měsíční anuita: P·i/(1−(1+i)^−n), i = roční sazba/12; sazba 0 → P/n. */
export function anuita(P, rocniPct, n) {
  if (!(n > 0) || !Number.isFinite(n)) throw new RangeError('n musí být kladné');
  if (!(P > 0)) return 0;
  const i = rocniPct / 100 / 12;
  if (i === 0) return P / n;
  return (P * i) / (1 - (1 + i) ** -n);
}

/** Splátkový kalendář počítaný po měsících (jistina = splátka − úrok, poslední dorovná). */
export function kalendar(P, rocniPct, n) {
  const a = anuita(P, rocniPct, n);
  const i = rocniPct / 100 / 12;
  let z = P;
  const radky = [];
  for (let m = 1; m <= n; m++) {
    const urok = z * i;
    let jistina = m === n ? z : Math.min(a - urok, z);
    z -= jistina;
    radky.push({ m, splatka: urok + jistina, urok, jistina, zustatek: z });
  }
  return radky;
}
export const soucetJistiny = (radky) => radky.reduce((s, r) => s + r.jistina, 0);
export const soucetUroku = (radky) => radky.reduce((s, r) => s + r.urok, 0);
export const zustatekPo = (P, rocniPct, n, k) => (k <= 0 ? P : k >= n ? 0 : kalendar(P, rocniPct, n)[k - 1].zustatek);
export const celkoveUroky = (P, rocniPct, n) => (P > 0 ? soucetUroku(kalendar(P, rocniPct, n)) : 0);

// ---------- data ----------
const dny = (iso) => { const [y, m, d] = iso.split('-').map(Number); return Date.UTC(y, m - 1, d); };
const posunRoky = (iso, r) => {
  const [y, m, d] = iso.split('-').map(Number);
  const posl = new Date(Date.UTC(y + r, m, 0)).getUTCDate(); // 29. 2. → 28. 2.
  return new Date(Date.UTC(y + r, m - 1, Math.min(d, posl))).toISOString().slice(0, 10);
};
const posunMesice = (iso, k) => {
  const [y, m, d] = iso.split('-').map(Number);
  const celk = y * 12 + (m - 1) + k;
  const ny = Math.floor(celk / 12), nm = (celk % 12) + 1;
  const posl = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return new Date(Date.UTC(ny, nm - 1, Math.min(d, posl))).toISOString().slice(0, 10);
};

/** Započaté roky od `od` do `do` (0, když do ≤ od): celé roky + 1, pokud zbývá aspoň den. */
export function zapocateRoky(od, doIso) {
  if (dny(doIso) <= dny(od)) return 0;
  let cele = 0;
  while (dny(posunRoky(od, cele + 1)) <= dny(doIso)) cele++;
  return dny(posunRoky(od, cele)) === dny(doIso) ? cele : cele + 1;
}

/** Je `splatka` během 1 měsíce přede dnem výročí uzavření smlouvy (§ 117 odst. 3 písm. h))? */
export function vOknePredVyrocim(smlouva, splatka, oknoMesicu = 1) {
  const s = dny(splatka);
  for (let r = 1; r <= 60; r++) {
    const vyroci = posunRoky(smlouva, r);
    const zacatek = posunMesice(vyroci, -oknoMesicu);
    if (s >= dny(zacatek) && s < dny(vyroci)) return true;
    if (dny(vyroci) > s + 400 * 86400000) break;
  }
  return false;
}

export const novaPravidla = (smlouva, zacatekFixace) =>
  dny(smlouva) >= dny(PRAVIDLA.novaPravidlaOd) || (zacatekFixace ? dny(zacatekFixace) >= dny(PRAVIDLA.novaPravidlaOd) : false);

/**
 * Strop náhrady podle § 117 odst. 3 písm. h), odst. 4 (0,25 %/započatý rok, max. 1 %).
 * Navíc vrací strop podle odst. 5 (úrok do konce fixace z předčasně splacené části) – aplikace ho nepočítá.
 */
export function nahrada({ castka, puvodniVyse, zapocate, koncFixace = false, vOkne = false, bezplatnaVyuzita = false, nova = true, sazbaPct = null, mesicuDoKonceFixace = null }) {
  castka = Math.max(0, castka || 0);
  if (!nova) return { poplatek: null, duvod: 'starší smlouva i fixace – podle zadání jen upozornění; bezplatné důvody § 117 odst. 3 (konec fixace, 25 % před výročím) platí i tak' };
  if (koncFixace) return { poplatek: 0, duvod: 'konec fixace – § 117 odst. 3 písm. c)/d)' };
  const bezplatne = vOkne && !bezplatnaVyuzita ? PRAVIDLA.bezplatnyPodil * (puvodniVyse || 0) : 0;
  const zpoplatnena = Math.max(0, castka - bezplatne);
  if (zpoplatnena === 0) return { poplatek: 0, duvod: 'do 25 % celkové výše úvěru v měsíci před výročím – § 117 odst. 3 písm. h)' };
  const roky = Math.max(1, zapocate);
  const sazba = Math.min(PRAVIDLA.stropNahrady, PRAVIDLA.sazbaZaRok * roky);
  const strop4 = Math.round(zpoplatnena * sazba * 100) / 100;
  let strop5 = null;
  if (sazbaPct != null && mesicuDoKonceFixace != null) {
    // úrok, který by z předčasně splacené části do konce fixace zaplatil (zjednodušeně bez umořování)
    strop5 = Math.round(zpoplatnena * (sazbaPct / 100 / 12) * mesicuDoKonceFixace * 100) / 100;
  }
  return { poplatek: strop4, sazba, roky, zpoplatnena, strop5, zakonnyStrop: strop5 == null ? strop4 : Math.min(strop4, strop5) };
}

// ---------- daně, LTV, zátěž ----------
export const usporaOdpocet = (uroky, sazbaDane, limit = PRAVIDLA.limitOdpoctu) => Math.min(Math.max(0, uroky), limit) * sazbaDane;
export const maxLtv = (vek, investicni = false) => (investicni ? PRAVIDLA.ltvInvesticni : vek < PRAVIDLA.vekMladi ? PRAVIDLA.ltvMladi : PRAVIDLA.ltvVlastni);
export function zatez(splatka, prijem, prah = 0.4, pasmo = 0.1) {
  if (!(prijem > 0)) return { podil: NaN, stupen: 'unknown' };
  const podil = splatka / prijem;
  return { podil, stupen: podil >= prah ? 'high' : podil >= prah - pasmo ? 'warn' : 'ok' };
}

// ---------- refixace ----------
/** Splátka po skončení nové fixace při sazbě +1/+2 p. b.: zůstatek po fixaci, anuita na zbytek doby. */
export function zatezovyTest(P, sazbaPct, n, fixLet, delty = [1, 2]) {
  const fixM = Math.round(fixLet * 12);
  if (!(P > 0) || fixM >= n) return [];
  const zbytek = zustatekPo(P, sazbaPct, n, fixM);
  return delty.map((d) => ({ delta: d, sazba: Math.round((sazbaPct + d) * 100) / 100, zustatek: zbytek, splatka: anuita(zbytek, sazbaPct + d, n - fixM) }));
}

export function refixace({ dluh, mesicu, sazbaDosavadni, sazbaNabidka, sazbaKonkurence, nakladyRefi = 0, uspory = 0, prodlouzeniMesicu = 0, prijem = 0, fixLet = 5, prah = 0.4 }) {
  const dosavadni = anuita(dluh, sazbaDosavadni, mesicu);
  const predsplaceno = Math.min(Math.max(0, uspory), dluh);
  const var_ = (id, P, s, n, naklady) => {
    const splatka = anuita(P, s, n);
    const uroky = celkoveUroky(P, s, n);
    return { id, P, sazba: s, n, splatka, zmena: splatka - dosavadni, uroky, naklady, celkem: uroky + naklady, zatez: zatez(splatka, prijem, prah), stres: zatezovyTest(P, s, n, fixLet) };
  };
  const varianty = [
    var_('accept', dluh, sazbaNabidka, mesicu, 0),
    var_('refinance', dluh, sazbaKonkurence, mesicu, nakladyRefi),
    var_('prepay', dluh - predsplaceno, sazbaNabidka, mesicu, 0),
    var_('extend', dluh, sazbaNabidka, mesicu + prodlouzeniMesicu, 0),
  ];
  let nej = varianty[0];
  for (const v of varianty) if (v.celkem < nej.celkem - 0.5) nej = v;
  return { dosavadni, varianty, nej: nej.id, predsplaceno };
}

// ---------- nájem vs. koupě ----------
/**
 * Simulace po měsících podle zadání a textu „Jak se počítá“ v aplikaci:
 * kupující: vlastní zdroje − náklady koupě = akontace; splácí anuitu, platí fond oprav, pojištění, daň (rostou o costGrowth ročně),
 * údržbu % z aktuální ceny; odpočet úroků se připíše jednou ročně. Nájemník: platí nájem (roste 1× ročně), vlastní zdroje investuje.
 * Kdo má v měsíci nižší výdaj, rozdíl investuje. Portfolia rostou měsíčně faktorem (1+r)^(1/12), cena bytu též.
 */
export function najemKoupe(i) {
  const cena = i.plocha * i.cenaM2;
  const poNakladech = i.vlastni - (i.nakladyKoupe ?? 0);
  const akontace = Math.min(cena, Math.max(0, poNakladech));
  const uver = cena - akontace;
  const ltv = cena > 0 ? uver / cena : 0;
  const limit = maxLtv(i.vek, !!i.investicni);
  const nM = Math.round(i.splatnostLet * 12), fixM = Math.round(i.fixLet * 12), H = Math.round(i.horizontLet * 12);
  const sazbaPo = i.sazbaPoFixaci ?? i.sazba;
  const odpocet = i.odpocet !== false && !i.investicni;
  const dan = i.sazbaDane ?? PRAVIDLA.danZakladni;
  const gI = (1 + i.vynos / 100) ** (1 / 12), gC = (1 + i.rustCen / 100) ** (1 / 12);
  let zust = uver, splatka = uver > 0 ? anuita(uver, i.sazba, nM) : 0, sazba = i.sazba;
  let hodnota = cena, portK = Math.max(0, poNakladech - akontace), portN = Math.max(0, i.vlastni);
  let urokRok = 0, urokyCelkem = 0;
  const roky = [{ rok: 0, hodnota, zust, portK, portN, jmeniK: hodnota - zust + portK, jmeniN: portN }];
  const najemZaklad = i.plocha * i.najemM2;
  for (let m = 1; m <= H; m++) {
    const r = Math.floor((m - 1) / 12);
    portK *= gI; portN *= gI;
    let zaplaceno = 0;
    if (zust > 0 && m <= nM) {
      if (m === fixM + 1 && fixM < nM) { sazba = sazbaPo; splatka = anuita(zust, sazba, nM - fixM); }
      const urok = zust * sazba / 100 / 12;
      let jist = m === nM ? zust : Math.min(splatka - urok, zust);
      zust -= jist; if (zust < 1e-6) zust = 0;
      zaplaceno = urok + jist; urokRok += urok; urokyCelkem += urok;
    }
    const idx = (1 + (i.rustNakladu ?? 0) / 100) ** r;
    const vlastnictvi = i.plocha * (i.fondOprav ?? 0) * idx + ((i.pojisteni ?? 0) + (i.danNemovitost ?? 0)) / 12 * idx + (i.udrzbaPct ?? 0) / 100 * hodnota / 12;
    let uspora = 0;
    if (odpocet && m % 12 === 0) { uspora = Math.min(urokRok, PRAVIDLA.limitOdpoctu) * dan; }
    if (m % 12 === 0) urokRok = 0;
    const najem = najemZaklad * (1 + i.rustNajmu / 100) ** r;
    const vydajK = zaplaceno + vlastnictvi - uspora;
    const diff = vydajK - najem;
    if (diff > 0) portN += diff; else portK -= diff;
    hodnota *= gC;
    if (m % 12 === 0 || m === H) roky.push({ rok: Math.ceil(m / 12), hodnota, zust, portK, portN, jmeniK: hodnota - zust + portK, jmeniN: portN });
  }
  let zlom = null;
  for (const y of roky) { if (y.rok === 0) continue; if (y.jmeniK >= y.jmeniN - 0.5) zlom ??= y.rok; else zlom = null; }
  const posl = roky.at(-1);
  return { cena, uver, akontace, ltv, maxLtv: limit, ltvOk: ltv <= limit + 1e-9, splatka1: roky.length && uver > 0 ? anuita(uver, i.sazba, nM) : 0, najem1: najemZaklad, urokyCelkem, roky, zlom, rozdil: posl.jmeniK - posl.jmeniN };
}

export function citlivost(i, delty = [-2, 0, 2]) {
  const r2 = (x) => Math.round(x * 100) / 100;
  const rc = delty.map((d) => r2(i.rustCen + d)), vy = delty.map((d) => r2(i.vynos + d));
  return { rustCen: rc, vynos: vy, mrizka: rc.map((a) => vy.map((b) => najemKoupe({ ...i, rustCen: a, vynos: b }).rozdil)) };
}

// ---------- případy ----------
const bezpecne = (f) => { try { return f(); } catch (e) { return `CHYBA: ${e.message}`; } };
export const refixPriklad = { dluh: 2800000, mesicu: 264, sazbaDosavadni: 2.49, sazbaNabidka: 5.79, sazbaKonkurence: 5.05, nakladyRefi: 9000, uspory: 300000, prodlouzeniMesicu: 60, prijem: 75000, fixLet: 5, prah: 0.4 };
export const rbPlochy = { plocha: 50, cenaM2: 60000, najemM2: 200, vlastni: 600000, nakladyKoupe: 0, vek: 30, sazba: 0, fixLet: 5, splatnostLet: 20, rustCen: 0, rustNajmu: 0, vynos: 0, rustNakladu: 0, fondOprav: 0, pojisteni: 0, danNemovitost: 0, udrzbaPct: 0, horizontLet: 25, sazbaDane: 0.15, odpocet: false };
export const rbPraha = { plocha: 60, cenaM2: 154112, najemM2: 462, vlastni: 1500000, nakladyKoupe: 12000, vek: 32, sazba: 5.79, fixLet: 5, sazbaPoFixaci: 5.79, splatnostLet: 30, rustCen: 4, rustNajmu: 3, vynos: 6, rustNakladu: 2, fondOprav: 20, pojisteni: 2500, danNemovitost: Math.round(60 * 38.43), udrzbaPct: 1, horizontLet: 20, sazbaDane: 0.15, odpocet: true };
export const rbBrno = { ...rbPraha, cenaM2: 124954, najemM2: 390, danNemovitost: Math.round(60 * 14.95), vek: 40, vlastni: 2000000 };

export function pripady() {
  const p = [];
  const add = (skupina, nazev, vstup, hodnota) => p.push({ skupina, nazev, vstup, muj: bezpecne(() => hodnota()) });
  // Zadání
  add('zadání', 'anuita 3 500 000 Kč, 25 let, 4,94 %', { P: 3500000, r: 4.94, n: 300 }, () => anuita(3500000, 4.94, 300));
  add('zadání', 'anuita 1 200 000 Kč, 0 %, 10 let', { P: 1200000, r: 0, n: 120 }, () => anuita(1200000, 0, 120));
  add('zadání', 'náhrada 500 000 Kč, 3 celé roky do konce fixace', {}, () => nahrada({ castka: 500000, puvodniVyse: 1000000, zapocate: 3 }).poplatek);
  add('zadání', 'náhrada 500 000 Kč, 5 let do konce fixace (strop 1 %)', {}, () => nahrada({ castka: 500000, puvodniVyse: 1000000, zapocate: 5 }).poplatek);
  add('zadání', 'náhrada 500 000 Kč ke konci fixace', {}, () => nahrada({ castka: 500000, puvodniVyse: 1000000, zapocate: 0, koncFixace: true }).poplatek);
  add('zadání', 'náhrada 250 000 Kč (25 % z 1 000 000) měsíc před výročím', {}, () => nahrada({ castka: 250000, puvodniVyse: 1000000, zapocate: 3, vOkne: true }).poplatek);
  add('zadání', 'odpočet: úroky 200 000 Kč, sazba 15 %', {}, () => usporaOdpocet(200000, 0.15));
  add('zadání', 'LTV věk 30', {}, () => maxLtv(30));
  add('zadání', 'LTV věk 40', {}, () => maxLtv(40));
  add('zadání', 'kalendář: Σ jistiny = úvěr (3 500 000 / 4,94 % / 300)', {}, () => soucetJistiny(kalendar(3500000, 4.94, 300)));
  add('zadání', 'kalendář: Σ jistiny = úvěr (2 345 678 / 6,35 % / 217)', {}, () => soucetJistiny(kalendar(2345678, 6.35, 217)));
  add('zadání', 'kalendář: Σ jistiny = úvěr (1 200 000 / 0 % / 120)', {}, () => soucetJistiny(kalendar(1200000, 0, 120)));
  // Hranice a nesmysly – anuita
  add('hranice', 'anuita 3 500 000 Kč, 25 let, 5,30 % (Hypoindex 6/2026)', {}, () => anuita(3500000, 5.3, 300));
  add('hranice', 'anuita 1 Kč, 1 měsíc, 5 %', {}, () => anuita(1, 5, 1));
  add('hranice', 'anuita 100 000 Kč, 1 měsíc, 12 %', {}, () => anuita(100000, 12, 1));
  add('hranice', 'anuita 0 Kč', {}, () => anuita(0, 5, 120));
  add('hranice', 'anuita záporná jistina −100 000', {}, () => anuita(-100000, 5, 120));
  add('hranice', 'anuita doba 0 měsíců', {}, () => anuita(100000, 5, 0));
  add('hranice', 'anuita doba NaN', {}, () => anuita(100000, 5, NaN));
  add('hranice', 'anuita 1 mld Kč, 40 let, 20 %', {}, () => anuita(1e9, 20, 480));
  add('hranice', 'celkové úroky 3 500 000 / 4,94 % / 300', {}, () => celkoveUroky(3500000, 4.94, 300));
  add('hranice', 'zůstatek po 60 splátkách 3 500 000 / 4,94 % / 300', {}, () => zustatekPo(3500000, 4.94, 300, 60));
  add('hranice', 'zůstatek po 60 splátkách 2 800 000 / 5,79 % / 264', {}, () => zustatekPo(2800000, 5.79, 264, 60));
  // Započaté roky – přelom roku, přestupný rok, dny
  add('data', 'započaté roky 2026-01-10 → 2029-01-10', {}, () => zapocateRoky('2026-01-10', '2029-01-10'));
  add('data', 'započaté roky 2026-01-10 → 2029-01-11', {}, () => zapocateRoky('2026-01-10', '2029-01-11'));
  add('data', 'započaté roky 2026-01-10 → 2026-03-01', {}, () => zapocateRoky('2026-01-10', '2026-03-01'));
  add('data', 'započaté roky 2026-01-10 → 2026-01-10 (stejný den)', {}, () => zapocateRoky('2026-01-10', '2026-01-10'));
  add('data', 'započaté roky 2026-01-10 → 2025-01-10 (zpět)', {}, () => zapocateRoky('2026-01-10', '2025-01-10'));
  add('data', 'započaté roky 2028-02-29 → 2029-02-28 (přestupný)', {}, () => zapocateRoky('2028-02-29', '2029-02-28'));
  add('data', 'započaté roky 2028-02-29 → 2029-03-01 (přestupný + den)', {}, () => zapocateRoky('2028-02-29', '2029-03-01'));
  add('data', 'započaté roky 2026-12-31 → 2027-01-01 (přelom roku)', {}, () => zapocateRoky('2026-12-31', '2027-01-01'));
  add('data', 'započaté roky 2026-11-05 → 2029-11-05 (výchozí formulář)', {}, () => zapocateRoky('2026-11-05', '2029-11-05'));
  add('data', 'započaté roky 2026-11-05 → 2031-11-04', {}, () => zapocateRoky('2026-11-05', '2031-11-04'));
  add('data', 'okno: smlouva 2025-03-15, splátka 2026-02-15', {}, () => vOknePredVyrocim('2025-03-15', '2026-02-15'));
  add('data', 'okno: smlouva 2025-03-15, splátka 2026-02-14', {}, () => vOknePredVyrocim('2025-03-15', '2026-02-14'));
  add('data', 'okno: smlouva 2025-03-15, splátka 2026-03-14', {}, () => vOknePredVyrocim('2025-03-15', '2026-03-14'));
  add('data', 'okno: smlouva 2025-03-15, splátka 2026-03-15 (den výročí)', {}, () => vOknePredVyrocim('2025-03-15', '2026-03-15'));
  add('data', 'okno: smlouva 2025-12-31, splátka 2026-12-01 (přelom roku)', {}, () => vOknePredVyrocim('2025-12-31', '2026-12-01'));
  add('data', 'okno: smlouva 2025-12-31, splátka 2026-11-30', {}, () => vOknePredVyrocim('2025-12-31', '2026-11-30'));
  add('data', 'okno: smlouva 2024-03-31, splátka 2025-02-28 (únor)', {}, () => vOknePredVyrocim('2024-03-31', '2025-02-28'));
  add('data', 'okno: smlouva 2025-03-15, splátka 2025-02-20 (před smlouvou)', {}, () => vOknePredVyrocim('2025-03-15', '2025-02-20'));
  add('data', 'nová pravidla: smlouva 2019-05-01, fixace 2024-10-01', {}, () => novaPravidla('2019-05-01', '2024-10-01'));
  add('data', 'nová pravidla: smlouva 2019-05-01, fixace 2024-05-01', {}, () => novaPravidla('2019-05-01', '2024-05-01'));
  add('data', 'nová pravidla: smlouva 2024-08-31, fixace 2024-08-31', {}, () => novaPravidla('2024-08-31', '2024-08-31'));
  add('data', 'nová pravidla: smlouva 2024-09-01', {}, () => novaPravidla('2024-09-01', null));
  // Náhrada – další
  add('náhrada', '400 000 Kč v okně, 25 % z 1 000 000 zdarma, 3 roky', {}, () => nahrada({ castka: 400000, puvodniVyse: 1000000, zapocate: 3, vOkne: true }).poplatek);
  add('náhrada', '250 000 Kč v okně, bezplatná už využita, 3 roky', {}, () => nahrada({ castka: 250000, puvodniVyse: 1000000, zapocate: 3, vOkne: true, bezplatnaVyuzita: true }).poplatek);
  add('náhrada', '500 000 Kč, 4 započaté roky', {}, () => nahrada({ castka: 500000, puvodniVyse: 1000000, zapocate: 4 }).poplatek);
  add('náhrada', '500 000 Kč, 1 započatý rok', {}, () => nahrada({ castka: 500000, puvodniVyse: 1000000, zapocate: 1 }).poplatek);
  add('náhrada', '0 Kč', {}, () => nahrada({ castka: 0, puvodniVyse: 1000000, zapocate: 3 }).poplatek);
  add('náhrada', 'záporná částka −100 000 Kč', {}, () => nahrada({ castka: -100000, puvodniVyse: 1000000, zapocate: 3 }).poplatek);
  add('náhrada', 'výchozí formulář: 300 000 Kč, 3 500 000, 2026-11-05 → 2029-11-05 (3 roky, mimo okno)', {}, () => nahrada({ castka: 300000, puvodniVyse: 3500000, zapocate: zapocateRoky('2026-11-05', '2029-11-05'), vOkne: vOknePredVyrocim('2024-11-05', '2026-11-05') }).poplatek);
  add('náhrada', 'odst. 5: 300 000 Kč měsíc před koncem fixace, sazba 2,49 % – strop odst. 4 vs. úrok do konce fixace', {}, () => { const r = nahrada({ castka: 300000, puvodniVyse: 3500000, zapocate: 1, sazbaPct: 2.49, mesicuDoKonceFixace: 1 }); return `odst.4 ${r.poplatek}; odst.5 ${r.strop5}; zákonný strop ${r.zakonnyStrop}`; });
  add('náhrada', 'legacy: smlouva 2021, fixace 2021 → bez čísla', {}, () => nahrada({ castka: 300000, puvodniVyse: 3500000, zapocate: 3, nova: false }).poplatek);
  // Odpočet, LTV, zátěž
  add('odpočet', 'úroky 100 000 Kč, 15 %', {}, () => usporaOdpocet(100000, 0.15));
  add('odpočet', 'úroky 150 000 Kč, 23 %', {}, () => usporaOdpocet(150000, 0.23));
  add('odpočet', 'úroky 150 001 Kč, 15 %', {}, () => usporaOdpocet(150001, 0.15));
  add('odpočet', 'úroky 0 Kč', {}, () => usporaOdpocet(0, 0.15));
  add('odpočet', 'úroky záporné', {}, () => usporaOdpocet(-5000, 0.15));
  add('LTV', 'věk 35', {}, () => maxLtv(35));
  add('LTV', 'věk 36', {}, () => maxLtv(36));
  add('LTV', 'věk 0', {}, () => maxLtv(0));
  add('LTV', 'investiční, věk 30', {}, () => maxLtv(30, true));
  add('zátěž', '20 000 / 75 000, práh 40 %', {}, () => zatez(20000, 75000).stupen);
  add('zátěž', '22 500 / 75 000 (přesně 30 %)', {}, () => zatez(22500, 75000).stupen);
  add('zátěž', '30 000 / 75 000 (přesně 40 %)', {}, () => zatez(30000, 75000).stupen);
  add('zátěž', 'příjem 0', {}, () => zatez(30000, 0).stupen);
  // Refixace
  const R = refixace(refixPriklad);
  add('refix', 'příklad: dosavadní splátka', refixPriklad, () => R.dosavadni);
  for (const v of R.varianty) {
    add('refix', `příklad: ${v.id} splátka`, {}, () => v.splatka);
    add('refix', `příklad: ${v.id} úroky do konce`, {}, () => v.uroky);
    add('refix', `příklad: ${v.id} celkem`, {}, () => v.celkem);
    add('refix', `příklad: ${v.id} podíl na příjmu`, {}, () => v.zatez.podil);
    add('refix', `příklad: ${v.id} stres +1 p. b.`, {}, () => v.stres[0]?.splatka ?? null);
    add('refix', `příklad: ${v.id} stres +2 p. b.`, {}, () => v.stres[1]?.splatka ?? null);
  }
  add('refix', 'příklad: nejlevnější varianta', {}, () => R.nej);
  add('refix', 'úspory 5 000 000 > dluh: prepay jistina', {}, () => refixace({ ...refixPriklad, uspory: 5000000 }).varianty[2].P);
  add('refix', 'úspory 5 000 000 > dluh: prepay splátka', {}, () => refixace({ ...refixPriklad, uspory: 5000000 }).varianty[2].splatka);
  add('refix', 'prodloužení 0: extend splátka = accept', {}, () => { const r = refixace({ ...refixPriklad, prodlouzeniMesicu: 0 }); return r.varianty[3].splatka - r.varianty[0].splatka; });
  add('refix', 'fixace 30 let > zbývá 22: stres prázdný', {}, () => refixace({ ...refixPriklad, fixLet: 30 }).varianty[0].stres.length);
  add('refix', 'sazba nabídky 0 %: accept splátka', {}, () => refixace({ ...refixPriklad, sazbaNabidka: 0 }).varianty[0].splatka);
  add('refix', 'příjem 0: zátěž', {}, () => refixace({ ...refixPriklad, prijem: 0 }).varianty[0].zatez.stupen);
  add('refix', 'konkurence 4 % s náklady 9 000: nejlevnější', {}, () => refixace({ ...refixPriklad, sazbaKonkurence: 4 }).nej);
  add('refix', 'úspory 0: nejlevnější', {}, () => refixace({ ...refixPriklad, uspory: 0 }).nej);
  add('refix', 'stres: 2 800 000 / 5,79 % / 264 / fix 5 → +1', {}, () => zatezovyTest(2800000, 5.79, 264, 5)[0].splatka);
  add('refix', 'stres: 2 800 000 / 5,79 % / 264 / fix 5 → +2', {}, () => zatezovyTest(2800000, 5.79, 264, 5)[1].splatka);
  add('refix', 'stres: fix 0 let → +1 hned', {}, () => zatezovyTest(2800000, 5.79, 264, 0)[0].splatka);
  // Nájem vs. koupě
  const F = najemKoupe(rbPlochy);
  add('rentbuy', 'plochý případ: úvěr', rbPlochy, () => F.uver);
  add('rentbuy', 'plochý případ: splátka', {}, () => F.splatka1);
  add('rentbuy', 'plochý případ: jmění koupě rok 10', {}, () => F.roky[10].jmeniK);
  add('rentbuy', 'plochý případ: jmění nájem rok 10', {}, () => F.roky[10].jmeniN);
  add('rentbuy', 'plochý případ: jmění koupě rok 25', {}, () => F.roky[25].jmeniK);
  add('rentbuy', 'plochý případ: rok zlomu', {}, () => F.zlom);
  add('rentbuy', 'plochý + výnos 6 %: nájem rok 1', {}, () => najemKoupe({ ...rbPlochy, vynos: 6 }).roky[1].jmeniN);
  add('rentbuy', 'plochý + růst cen 4 %: hodnota rok 5', {}, () => najemKoupe({ ...rbPlochy, rustCen: 4 }).roky[5].hodnota);
  add('rentbuy', 'plochý + náklady koupě 200 000 (vlastní 800 000): zlom', {}, () => najemKoupe({ ...rbPlochy, nakladyKoupe: 200000, vlastni: 800000 }).zlom);
  add('rentbuy', 'plochý, nájem 50 Kč/m², ceny −5 %, 10 let: zlom', {}, () => najemKoupe({ ...rbPlochy, najemM2: 50, rustCen: -5, horizontLet: 10 }).zlom);
  add('rentbuy', 'plochý, sazba 5 → 7 po fixaci: splátka po fixaci', {}, () => { const r = najemKoupe({ ...rbPlochy, sazba: 5, sazbaPoFixaci: 7 }); return anuita(r.roky[5].zust, 7, 180); });
  add('rentbuy', 'plochý, sazba 5 → 7: zůstatek rok 5', {}, () => najemKoupe({ ...rbPlochy, sazba: 5, sazbaPoFixaci: 7 }).roky[5].zust);
  add('rentbuy', 'plochý, sazba 5, 20 let: zůstatek rok 20', {}, () => najemKoupe({ ...rbPlochy, sazba: 5, horizontLet: 20 }).roky[20].zust);
  add('rentbuy', 'plochý, sazba 5, 20 let: úroky celkem', {}, () => najemKoupe({ ...rbPlochy, sazba: 5, horizontLet: 20 }).urokyCelkem);
  add('rentbuy', 'plochý, sazba 5, nájem 100, odpočet: rozdíl jmění rok 1 (odpočet − bez)', {}, () => { const a = najemKoupe({ ...rbPlochy, sazba: 5, najemM2: 100, odpocet: true }), b = najemKoupe({ ...rbPlochy, sazba: 5, najemM2: 100, odpocet: false }); return (a.roky[1].jmeniK - a.roky[1].jmeniN) - (b.roky[1].jmeniK - b.roky[1].jmeniN); });
  add('rentbuy', 'věk 40, vlastní 300 000: LTV ok?', {}, () => najemKoupe({ ...rbPlochy, vek: 40, vlastni: 300000 }).ltvOk);
  add('rentbuy', 'věk 30, vlastní 300 000: LTV ok?', {}, () => najemKoupe({ ...rbPlochy, vek: 30, vlastni: 300000 }).ltvOk);
  add('rentbuy', 'vlastní 3 500 000 > cena: úvěr', {}, () => najemKoupe({ ...rbPlochy, vlastni: 3500000 }).uver);
  add('rentbuy', 'vlastní 3 500 000 > cena: portfolio kupujícího rok 0', {}, () => najemKoupe({ ...rbPlochy, vlastni: 3500000 }).roky[0].portK);
  add('rentbuy', 'vlastní 0, náklady koupě 12 000: akontace / LTV', {}, () => { const r = najemKoupe({ ...rbPlochy, vlastni: 0, nakladyKoupe: 12000 }); return `${r.akontace} / ${r.ltv}`; });
  add('rentbuy', 'horizont 1 rok: počet řádků', {}, () => najemKoupe({ ...rbPlochy, horizontLet: 1 }).roky.length);
  add('rentbuy', 'horizont 50 let: jmění koupě', {}, () => najemKoupe({ ...rbPlochy, horizontLet: 50 }).roky.at(-1).jmeniK);
  const P = najemKoupe(rbPraha);
  add('rentbuy', 'Praha výchozí: cena', rbPraha, () => P.cena);
  add('rentbuy', 'Praha výchozí: úvěr', {}, () => P.uver);
  add('rentbuy', 'Praha výchozí: LTV', {}, () => P.ltv);
  add('rentbuy', 'Praha výchozí: splátka', {}, () => P.splatka1);
  add('rentbuy', 'Praha výchozí: nájem 1. měsíc', {}, () => P.najem1);
  add('rentbuy', 'Praha výchozí: jmění koupě rok 20', {}, () => P.roky[20].jmeniK);
  add('rentbuy', 'Praha výchozí: jmění nájem rok 20', {}, () => P.roky[20].jmeniN);
  add('rentbuy', 'Praha výchozí: rozdíl rok 20', {}, () => P.rozdil);
  add('rentbuy', 'Praha výchozí: rok zlomu', {}, () => P.zlom);
  add('rentbuy', 'Praha výchozí: zůstatek rok 20', {}, () => P.roky[20].zust);
  add('rentbuy', 'Praha výchozí: hodnota bytu rok 20', {}, () => P.roky[20].hodnota);
  add('rentbuy', 'Praha výchozí: jmění koupě rok 1', {}, () => P.roky[1].jmeniK);
  add('rentbuy', 'Praha výchozí: jmění nájem rok 1', {}, () => P.roky[1].jmeniN);
  add('rentbuy', 'Praha investiční: LTV max / odpočet vypnut (rozdíl rok 20)', {}, () => { const r = najemKoupe({ ...rbPraha, investicni: true }); return `${r.maxLtv} / ${r.rozdil}`; });
  add('rentbuy', 'Praha sazba po fixaci 7,79 %: rozdíl rok 20', {}, () => najemKoupe({ ...rbPraha, sazbaPoFixaci: 7.79 }).rozdil);
  const B = najemKoupe(rbBrno);
  add('rentbuy', 'Brno věk 40, vlastní 2 000 000: LTV / max / rozdíl rok 20 / zlom', rbBrno, () => `${B.ltv} / ${B.maxLtv} / ${B.rozdil} / ${B.zlom}`);
  const C = citlivost(rbPraha);
  add('rentbuy', 'citlivost Praha: osy', {}, () => `${C.rustCen.join(',')} | ${C.vynos.join(',')}`);
  C.mrizka.forEach((row, i) => row.forEach((v, j) => add('rentbuy', `citlivost Praha [${C.rustCen[i]} %, ${C.vynos[j]} %]`, {}, () => v)));
  return p;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(JSON.stringify(pripady(), null, 1));
}
