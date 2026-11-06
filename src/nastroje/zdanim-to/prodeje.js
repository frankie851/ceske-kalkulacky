// Zdaním to? – osvobození příjmů z prodeje cenných papírů a kryptoaktiv (čisté funkce, bez DOM).
// Žádné částky, limity ani lhůty tu nejsou natvrdo: vše přichází v parametru rules (rules.json).
// Pořadí výpočtu (docs/zadani-zdanim-to.md):
//   1. cenné papíry a kryptoaktiva zvlášť (dva úhrny, dva limity),
//   2. hodnotový test z úhrnu všech hrubých příjmů druhu (bez elektronických peněžních tokenů),
//   3. jinak časový test po prodejích (termínový prodej krypta sjednaný do 3 let se neosvobozuje),
//   4. jen kryptoaktiva: časově osvobozené příjmy nad limit → neosvobozená poměrná část,
//   5. zisky a ztráty jen uvnitř druhu, záporný výsledek druhu = 0, ztráta se nepřevádí.
// Nejasná pravidla se počítají podle doporučení z rules a vždy z nich vznikne upozornění.

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
const zaokrouhli = (n) => Math.round(n * 100) / 100;
const secti = (polozky, f) => polozky.reduce((s, p) => s + f(p), 0);

/** Kontrola jednoho prodeje. Vrátí pole chyb { pole, text } (prázdné = v pořádku). */
export function zkontrolujProdej(p, rules) {
  const chyby = [];
  if (!rules.prodeje.typy[p?.typ]) chyby.push({ pole: 'typ', text: 'Vyber, co se prodávalo.' });
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
 * @param {Array<{typ, nakup, prodej, prijem, naklady, terminovy}>} prodeje – data ISO, částky v Kč;
 *   terminovy: termínový (forwardový) prodej sjednaný do lhůty časového testu (jen typy s terminovy v rules)
 * @param {number} rok – zdaňovací období (rok prodeje)
 * @param {object} rules – celý rules.json
 * @returns {{ rok, polozky, uhrny, zdanitelnyRozdil, orientacniDan, upozorneni }}
 *   polozka.stav: 'hodnotovy' | 'casovy' | 'castecne' | 'zdanitelne' | 'mimo-rok' | 'neuplne'
 *   uhrny: podle druhu (rules.prodeje.druhy)
 */
export function osvobozeniProdeje(prodeje, rok, rules) {
  const pr = rules.prodeje;
  const ht = pr.hodnotovyTest;
  const druhy = Object.keys(pr.druhy);

  // Kontrola, rok a splnění časového testu (o osvobození se rozhodne až po hodnotovém testu)
  const polozky = (prodeje || []).map((p, index) => {
    const chyby = zkontrolujProdej(p, rules);
    const typ = pr.typy[p?.typ];
    const zaklad = {
      index, typ: p?.typ, druh: typ?.druh ?? null, prijem: p?.prijem ?? null, naklady: p?.naklady ?? 0, rozdil: null, chyby,
      terminovy: Boolean(typ?.terminovy && p?.terminovy),
    };
    if (chyby.length) return { ...zaklad, stav: 'neuplne' };
    const naklady = p.naklady ?? 0;
    const lhuta = lhutaCasovehoTestu(p.nakup, pr.casovyTest.let);
    const out = {
      ...zaklad, naklady, rozdil: p.prijem - naklady, nakup: p.nakup, prodej: p.prodej,
      osvobozenoOd: lhuta.osvobozenoOd,
      drzbaSplnena: p.prodej >= lhuta.osvobozenoOd,
      vHodnotovemTestu: typ.hodnotovyTest !== false,
    };
    out.casovySplnen = out.drzbaSplnena && !out.terminovy;
    if (rozeberDatum(p.prodej).r !== rok) return { ...out, stav: 'mimo-rok' };
    return { ...out, stav: null };
  });
  const vRoce = polozky.filter((p) => p.stav === null);

  // 1.–2. Hodnotový test zvlášť podle druhu: úhrn všech hrubých příjmů druhu za rok
  const uhrny = {};
  for (const d of druhy) {
    const druhu = vRoce.filter((p) => p.druh === d);
    const vTestu = druhu.filter((p) => p.vHodnotovemTestu);
    const zapocitane = ht.zahrnoutOsvobozeneCasovymTestem ? vTestu : vTestu.filter((p) => !p.casovySplnen);
    const uhrnProTest = secti(zapocitane, (p) => p.prijem);
    const casove = zapocitane.filter((p) => p.casovySplnen);
    uhrny[d] = {
      limit: ht.limity[d],
      uhrnProTest,
      splneno: uhrnProTest <= ht.limity[d],
      prijmy: secti(druhu, (p) => p.prijem),
      pocet: druhu.length,
      mimoTest: druhu.length - vTestu.length,
      zapocitanoCasove: casove.length,
      uhrnBezCasovych: uhrnProTest - secti(casove, (p) => p.prijem),
      limit40: null,
      vysledek: 0,
      zdanitelnyRozdil: 0,
    };
  }

  // 3. Jinak časový test po jednotlivých prodejích
  for (const p of vRoce) {
    if (p.vHodnotovemTestu && uhrny[p.druh].splneno) p.stav = 'hodnotovy';
    else if (p.casovySplnen) p.stav = 'casovy';
    else p.stav = 'zdanitelne';
  }

  // 4. Horní limit časově osvobozených příjmů (jen druhy, které ho mají – kryptoaktiva)
  for (const d of druhy) {
    const limit = pr.limit40mil.limity[d];
    if (limit == null) continue;
    const casove = vRoce.filter((p) => p.druh === d && p.stav === 'casovy');
    const uhrn = secti(casove, (p) => p.prijem);
    if (uhrn <= limit) continue;
    const pomer = (uhrn - limit) / uhrn;
    uhrny[d].limit40 = { uhrn, limit, pomer };
    for (const p of casove) {
      p.stav = 'castecne';
      const prijem = zaokrouhli(p.prijem * pomer);
      const naklady = zaokrouhli(p.naklady * pomer);
      p.zdanitelnaCast = { pomer, prijem, naklady, rozdil: zaokrouhli(prijem - naklady) };
    }
  }

  // 5. Zdanitelný zbytek po druzích: zisky a ztráty jen uvnitř druhu, záporný výsledek = 0
  const zdanitelnaCast = (p) => (p.stav === 'zdanitelne' ? p.rozdil : p.stav === 'castecne' ? p.zdanitelnaCast.rozdil : 0);
  for (const d of druhy) {
    const vysledek = zaokrouhli(secti(vRoce.filter((p) => p.druh === d), zdanitelnaCast));
    uhrny[d].vysledek = vysledek;
    uhrny[d].zdanitelnyRozdil = Math.max(pr.zapocteni.zapornyVysledekDruhu, vysledek);
  }
  const zdanitelnyRozdil = zaokrouhli(secti(druhy, (d) => uhrny[d].zdanitelnyRozdil));
  const orientacniDan = Math.round(zdanitelnyRozdil * rules.dane.sazba.hodnota);

  // Upozornění: nejasná pravidla (počítaná podle doporučení) a důležité kroky výpočtu
  const upozorneni = [];
  for (const d of druhy) {
    const u = uhrny[d];
    if (u.zapocitanoCasove) {
      upozorneni.push({
        id: 'uhrn-casovy', stav: ht.zahrnuti.stav, druh: d, uhrn: u.uhrnProTest, uhrnBez: u.uhrnBezCasovych,
        limit: u.limit, meniVysledek: !u.splneno && u.uhrnBezCasovych <= u.limit,
      });
    }
  }
  for (const d of druhy) {
    if (uhrny[d].limit40) upozorneni.push({ id: 'krypto-40mil', stav: pr.limit40mil.stav, druh: d, ...uhrny[d].limit40 });
  }
  for (const d of druhy) {
    if (vRoce.some((p) => p.druh === d && zdanitelnaCast(p) < 0)) upozorneni.push({ id: 'ztraty', stav: pr.zapocteni.stav, druh: d, vysledek: uhrny[d].vysledek });
  }
  if (uhrny.kryptoaktivum?.zdanitelnyRozdil > 0) upozorneni.push({ id: 'kod-krypta-p2', stav: pr.zapocteni.kodKryptaP2.stav });
  // Osvobozený příjem nad limit je třeba oznámit správci daně (§ 38v)
  const osvobozenaCast = (p) => (p.stav === 'hodnotovy' || p.stav === 'casovy' ? p.prijem : p.stav === 'castecne' ? p.prijem - p.zdanitelnaCast.prijem : 0);
  const kOznameni = vRoce.filter((p) => osvobozenaCast(p) > pr.oznameni.limit);
  if (kOznameni.length) {
    upozorneni.push({ id: 'oznameni', stav: pr.oznameni.stav, limit: pr.oznameni.limit, polozky: kOznameni.map((p) => ({ index: p.index, castka: osvobozenaCast(p) })) });
  }

  return { rok, polozky, uhrny, zdanitelnyRozdil, orientacniDan, upozorneni };
}
