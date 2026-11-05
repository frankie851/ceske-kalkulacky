// Zdaním to? – osvobození příjmů z prodeje cenných papírů a kryptoaktiv (čisté funkce, bez DOM).
// Žádné částky, limity ani lhůty tu nejsou natvrdo: vše přichází v parametru rules (rules.json).
// Sporná pravidla (limit 40 mil. Kč u kryptoaktiv) se nepočítají, jen se z nich skládají upozornění.

export const TYPY = ['cenny-papir', 'kryptoaktivum'];

const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;

/** ISO datum → { r, m, d } (měsíc 1–12), neplatné → null. */
export function rozeberDatum(iso) {
  const m = ISO.exec(String(iso ?? '').trim());
  if (!m) return null;
  const [, r, mes, d] = m.map(Number);
  const dt = new Date(Date.UTC(r, mes - 1, d));
  if (dt.getUTCFullYear() !== r || dt.getUTCMonth() !== mes - 1 || dt.getUTCDate() !== d) return null;
  return { r, m: mes, d };
}

const naIso = (dt) => dt.toISOString().split('T')[0];

/**
 * Konec lhůty časového testu: stejný den o `let` let později. Když takový den v měsíci není
 * (29. 2.), je to poslední den měsíce. Vrací { konec, osvobozenoOd } jako ISO data:
 * osvobozený je prodej až po konci lhůty, tedy od následujícího dne.
 */
export function lhutaCasovehoTestu(nakupIso, let_) {
  const n = rozeberDatum(nakupIso);
  if (!n) return null;
  const posledniDen = new Date(Date.UTC(n.r + let_, n.m, 0)).getUTCDate();
  const konec = new Date(Date.UTC(n.r + let_, n.m - 1, Math.min(n.d, posledniDen)));
  const dalsi = new Date(Date.UTC(konec.getUTCFullYear(), konec.getUTCMonth(), konec.getUTCDate() + 1));
  return { konec: naIso(konec), osvobozenoOd: naIso(dalsi) };
}

const jeCastka = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0;

/** Kontrola jednoho prodeje. Vrátí pole chyb { pole, text } (prázdné = v pořádku). */
export function zkontrolujProdej(p) {
  const chyby = [];
  if (!TYPY.includes(p?.typ)) chyby.push({ pole: 'typ', text: 'Vyber, co se prodávalo.' });
  const nakup = rozeberDatum(p?.nakup);
  const prodej = rozeberDatum(p?.prodej);
  if (!nakup) chyby.push({ pole: 'nakup', text: 'Doplň datum nákupu.' });
  if (!prodej) chyby.push({ pole: 'prodej', text: 'Doplň datum prodeje.' });
  if (nakup && prodej && p.prodej < p.nakup) chyby.push({ pole: 'prodej', text: 'Prodej nemůže být dřív než nákup.' });
  if (!jeCastka(p?.prijem)) chyby.push({ pole: 'prijem', text: 'Zadej příjem z prodeje v korunách.' });
  if (p?.naklady != null && !jeCastka(p.naklady)) chyby.push({ pole: 'naklady', text: 'Náklady zadej jako kladné číslo, nebo nech prázdné.' });
  return chyby;
}

/**
 * Vyhodnotí prodeje za rok.
 * @param {Array<{typ, nakup, prodej, prijem, naklady}>} prodeje – data ISO, částky v Kč
 * @param {number} rok – zdaňovací období (rok prodeje)
 * @param {object} rules – celý rules.json
 * @returns {{ polozky, uhrny, zdanitelnyRozdil, orientacniDan, upozorneni }}
 *   polozka.stav: 'casovy' | 'hodnotovy' | 'zdanitelne' | 'mimo-rok' | 'neuplne'
 */
export function osvobozeniProdeje(prodeje, rok, rules) {
  const pr = rules.prodeje;
  const ht = pr.hodnotovyTest;
  const klicUhrnu = (typ) => (ht.zvlastPodleTypu ? typ : 'vse');

  // 1. kontrola, rok a časový test
  const polozky = (prodeje || []).map((p, index) => {
    const chyby = zkontrolujProdej(p);
    const zaklad = { index, typ: p?.typ, prijem: p?.prijem ?? null, naklady: p?.naklady ?? 0, rozdil: null, chyby };
    if (chyby.length) return { ...zaklad, stav: 'neuplne' };
    const rozdil = p.prijem - (p.naklady ?? 0);
    const lhuta = lhutaCasovehoTestu(p.nakup, pr.casovyTest.let);
    const out = { ...zaklad, naklady: p.naklady ?? 0, rozdil, osvobozenoOd: lhuta.osvobozenoOd, nakup: p.nakup, prodej: p.prodej };
    if (rozeberDatum(p.prodej).r !== rok) return { ...out, stav: 'mimo-rok' };
    return { ...out, stav: p.prodej >= lhuta.osvobozenoOd ? 'casovy' : null };
  });

  // 2. úhrny příjmů za rok (podle typu) a hodnotový test
  const uhrny = {};
  for (const typ of TYPY) uhrny[typ] = { prijmy: 0, prijmyCasove: 0, limit: ht.limit, splneno: true, zdanitelnyRozdil: 0, pocet: 0 };
  const vRoce = polozky.filter((p) => p.stav === 'casovy' || p.stav === null);
  const soucet = {};
  for (const p of vRoce) {
    if (p.stav === 'casovy' && !ht.zahrnoutOsvobozeneCasovymTestem) continue;
    soucet[klicUhrnu(p.typ)] = (soucet[klicUhrnu(p.typ)] || 0) + p.prijem;
  }
  for (const p of vRoce) {
    uhrny[p.typ].pocet += 1;
    uhrny[p.typ].prijmy += p.prijem;
    if (p.stav === 'casovy') uhrny[p.typ].prijmyCasove += p.prijem;
  }
  for (const typ of TYPY) {
    uhrny[typ].uhrnProTest = soucet[klicUhrnu(typ)] || 0;
    uhrny[typ].splneno = uhrny[typ].uhrnProTest <= ht.limit;
  }
  for (const p of polozky) {
    if (p.stav !== null) continue;
    p.stav = uhrny[p.typ].splneno ? 'hodnotovy' : 'zdanitelne';
  }

  // 3. zdanitelný rozdíl podle typu (zisky a ztráty stejného typu se započtou, celkem nejméně 0)
  for (const typ of TYPY) {
    const r = polozky.filter((p) => p.typ === typ && p.stav === 'zdanitelne').reduce((s, p) => s + p.rozdil, 0);
    uhrny[typ].zdanitelnyRozdil = Math.max(0, r);
  }
  const zdanitelnyRozdil = TYPY.reduce((s, t) => s + uhrny[t].zdanitelnyRozdil, 0);
  const orientacniDan = Math.round(zdanitelnyRozdil * rules.dane.sazba.hodnota);

  // 4. upozornění ze sporných pravidel (nepočítají se)
  const upozorneni = [];
  const krypto40 = pr.limit40mil?.kryptoaktiva;
  if (krypto40?.hodnota != null && uhrny.kryptoaktivum.prijmyCasove > krypto40.hodnota) {
    upozorneni.push({ id: 'krypto-40mil', stav: krypto40.stav, limit: krypto40.hodnota, castka: uhrny.kryptoaktivum.prijmyCasove });
  }
  if (polozky.some((p) => p.stav === 'zdanitelne' && p.rozdil < 0)) {
    upozorneni.push({ id: 'ztraty', stav: pr.vzajemneZapocteni.stav });
  }

  return { rok, polozky, uhrny, zdanitelnyRozdil, orientacniDan, upozorneni };
}
