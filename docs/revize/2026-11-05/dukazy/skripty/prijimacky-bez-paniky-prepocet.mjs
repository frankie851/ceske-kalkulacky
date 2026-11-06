// Nezávislý referenční výpočet pro revizi „Přijímačky bez paniky“ (5. 11. 2026).
// Psáno od nuly podle úředních pravidel z rejstříku pravidla.md (PS-01 … PS-28):
//  - ŠZ § 60j odst. 2–3 a metodika MŠMT 2026/2027 s. 12–13: odložené přijetí (uchazeč je přijat do oboru
//    s nejvyšší prioritou, k němuž ho výsledky opravňují; horší uchazeč nepředběhne lepšího jen kvůli prioritě),
//  - V422 § 19 odst. 2: „Více uchazečů nesmí sdílet shodné pořadí“ → shoda bodů bez dalšího kritéria = neplatný vstup,
//  - ŠZ § 60h odst. 1, § 60i odst. 3: JPZ dvakrát, z každého testu se započte lepší výsledek,
//  - V422 § 31: termín na sobotu/neděli/svátek → nejbližší pracovní den,
//  - RFC 5545 (iCalendar) pro kontrolu exportu .ics.
// ŽÁDNÝ kód aplikace zde není importován. Porovnání s modulem dělá prijimacky-bez-paniky-porovnani.mjs.

// ---------- 1. Lepší ze dvou pokusů (ŠZ § 60i odst. 3) ----------
export function lepsiZeDvou({ cj = [], m = [] } = {}) {
  const best = arr => {
    const v = arr.filter(x => typeof x === 'number' && Number.isFinite(x));
    return v.length ? v.reduce((a, b) => (b > a ? b : a)) : 0; // neúčast = 0 b. (PS-06)
  };
  return best(cj) + best(m);
}
export const body = a => (a.attempts ? lepsiZeDvou(a.attempts) : (Number.isFinite(a.score) ? a.score : 0));

// ---------- 2. Pořadí na škole: body sestupně, pak pomocné kritérium (vyšší lepší); shoda = chyba ----------
export class NejednoznacnePoradi extends Error {}
function lepsi(a, b) { // true, pokud a je na škole před b
  const da = body(a), db = body(b);
  if (da !== db) return da > db;
  const ta = Number.isFinite(a.tiebreak) ? a.tiebreak : null;
  const tb = Number.isFinite(b.tiebreak) ? b.tiebreak : null;
  if (ta !== null && tb !== null && ta !== tb) return ta > tb;
  throw new NejednoznacnePoradi(`shoda pořadí ${a.id}/${b.id}`);
}
function platnePriority(a, skolyMap) {
  const out = [];
  for (const s of a.priorities ?? []) if (s && skolyMap.has(s) && !out.includes(s)) out.push(s);
  return out;
}

/**
 * Odložené přijetí – SEKVENČNÍ varianta (jeden uchazeč navrhuje v jednom kroku), schválně jiná než
 * „po kolech“ v aplikaci. Uchazečsky optimální stabilní párování je jediné, výsledek se tedy musí shodovat.
 * Vrací { assignment: {id: schoolId|null}, schools: {schoolId: [ids seřazené podle pořadí školy]} }.
 */
export function odlozenePrijeti(uchazeci, skoly) {
  const skolyMap = new Map(skoly.map(s => [s.id, s]));
  const kap = s => { const c = Number(s.capacity); return Number.isFinite(c) && c > 0 ? Math.floor(c) : 0; };
  const prefs = new Map(uchazeci.map(a => [a.id, platnePriority(a, skolyMap)]));
  // kontrola jednoznačnosti pořadí mezi všemi uchazeči, kteří školu uvedli (V422 § 19 odst. 2)
  for (const s of skoly) {
    const list = uchazeci.filter(a => prefs.get(a.id).includes(s.id));
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length; j++) lepsi(list[i], list[j]);
  }
  const drzi = new Map(skoly.map(s => [s.id, []]));
  const dalsi = new Map(uchazeci.map(a => [a.id, 0]));
  const byId = new Map(uchazeci.map(a => [a.id, a]));
  // zásobník volných uchazečů – pořadí schválně obrácené (test nezávislosti na pořadí)
  const volni = [...uchazeci].reverse().map(a => a.id);
  let kroku = 0;
  while (volni.length) {
    if (++kroku > 1e6) throw new Error('nekonečná smyčka');
    const id = volni.pop();
    const p = prefs.get(id);
    const i = dalsi.get(id);
    if (i >= p.length) continue; // už nemá kam
    dalsi.set(id, i + 1);
    const sid = p[i];
    const s = skolyMap.get(sid);
    const a = byId.get(id);
    if (Number.isFinite(s.minScore) && body(a) < s.minScore) { volni.push(id); continue; }
    const h = drzi.get(sid);
    if (h.length < kap(s)) { h.push(id); h.sort((x, y) => (lepsi(byId.get(x), byId.get(y)) ? -1 : 1)); continue; }
    if (kap(s) === 0) { volni.push(id); continue; }
    const nejhorsi = h[h.length - 1];
    if (lepsi(a, byId.get(nejhorsi))) {
      h.pop(); h.push(id); h.sort((x, y) => (lepsi(byId.get(x), byId.get(y)) ? -1 : 1));
      volni.push(nejhorsi);
    } else volni.push(id);
  }
  const assignment = {};
  for (const a of uchazeci) assignment[a.id] = null;
  for (const [sid, ids] of drzi) for (const id of ids) assignment[id] = sid;
  return { assignment, schools: Object.fromEntries([...drzi].map(([k, v]) => [k, [...v]])) };
}

/** Kontrola stability a uchazečské optimality hrubou silou (jen malé instance). */
export function hrubaSila(uchazeci, skoly) {
  const skolyMap = new Map(skoly.map(s => [s.id, s]));
  const kap = s => { const c = Number(s.capacity); return Number.isFinite(c) && c > 0 ? Math.floor(c) : 0; };
  const prefs = uchazeci.map(a => platnePriority(a, skolyMap).filter(sid => !(Number.isFinite(skolyMap.get(sid).minScore) && body(a) < skolyMap.get(sid).minScore)));
  const byId = new Map(uchazeci.map(a => [a.id, a]));
  const stabilni = [];
  const rec = (k, cur) => {
    if (k === uchazeci.length) {
      // kapacity
      const cnt = {};
      for (const v of Object.values(cur)) if (v) cnt[v] = (cnt[v] ?? 0) + 1;
      for (const s of skoly) if ((cnt[s.id] ?? 0) > kap(s)) return;
      // blokující dvojice: a chce s víc než to, co má, a s má volno nebo drží horšího
      for (let i = 0; i < uchazeci.length; i++) {
        const a = uchazeci[i]; const got = cur[a.id];
        const lepsiSkoly = got ? prefs[i].slice(0, prefs[i].indexOf(got)) : prefs[i];
        for (const sid of lepsiSkoly) {
          const s = skolyMap.get(sid);
          const drzi = uchazeci.filter(b => cur[b.id] === sid);
          if (drzi.length < kap(s)) return;
          if (drzi.some(b => lepsi(a, b))) return;
        }
      }
      stabilni.push({ ...cur });
      return;
    }
    const a = uchazeci[k];
    for (const sid of [null, ...prefs[k]]) { cur[a.id] = sid; rec(k + 1, cur); }
  };
  rec(0, {});
  // uchazečsky optimální: každý uchazeč na něm dostane svou nejlepší školu ze všech stabilních
  const rank = (i, sid) => (sid == null ? prefs[i].length : prefs[i].indexOf(sid));
  const opt = stabilni.find(m => uchazeci.every((a, i) => stabilni.every(n => rank(i, m[a.id]) <= rank(i, n[a.id]))));
  return { pocetStabilnich: stabilni.length, optimalni: opt ?? null };
}

// ---------- 3. Termíny: dny v týdnu, svátky, V422 § 31 ----------
export function velikonocniNedele(y) { // Meeus/Jones/Butcher
  const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25),
    g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4,
    l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451),
    mon = Math.floor((h + l - 7 * m + 114) / 31), day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(y, mon - 1, day));
}
export function svatkyCR(y) { // zákon č. 245/2000 Sb.
  const iso = d => d.toISOString().slice(0, 10);
  const vn = velikonocniNedele(y);
  const posun = (d, n) => new Date(d.getTime() + n * 864e5);
  return new Set([`${y}-01-01`, iso(posun(vn, -2)), iso(posun(vn, 1)), `${y}-05-01`, `${y}-05-08`, `${y}-07-05`, `${y}-07-06`,
    `${y}-09-28`, `${y}-10-28`, `${y}-11-17`, `${y}-12-24`, `${y}-12-25`, `${y}-12-26`]);
}
export const DEN = ['neděle', 'pondělí', 'úterý', 'středa', 'čtvrtek', 'pátek', 'sobota'];
export function denVTydnu(iso) { return DEN[new Date(iso + 'T00:00:00Z').getUTCDay()]; }
export function jePracovni(iso) { const d = new Date(iso + 'T00:00:00Z').getUTCDay(); return d !== 0 && d !== 6 && !svatkyCR(+iso.slice(0, 4)).has(iso); }
export function nejblizsiPracovni(iso) { let d = new Date(iso + 'T00:00:00Z'); while (!jePracovni(d.toISOString().slice(0, 10))) d = new Date(d.getTime() + 864e5); return d.toISOString().slice(0, 10); }
export function dalsiDen(iso) { return new Date(new Date(iso + 'T00:00:00Z').getTime() + 864e5).toISOString().slice(0, 10); }

/** Úřední termíny podle rejstříku pravidla.md (oblast C, PS-14 … PS-27), ověřené 5. 11. 2026. */
export const REJSTRIK_TERMINY = {
  'kons-prihlasky': { start: '2026-11-01', end: '2026-11-30', id: 'PS-14' },
  'kons-zkousky': { start: '2027-01-04', end: '2027-01-15', id: 'PS-15' },
  'kons-nahradni': { start: '2027-01-18', end: '2027-01-29', id: 'PS-15' },
  'kons-vysledky': { start: '2027-02-08', id: 'PS-15' },
  'ss-kriteria': { start: '2027-01-15', end: '2027-01-31', id: 'PS-16' },
  'ss-prihlasky-start': { start: '2027-02-01', id: 'PS-17' },
  'ss-prihlasky-konec': { start: '2027-02-22', id: 'PS-17', odvozeno: 'V422 § 2 (20. 2.) + § 31 (sobota → pondělí)' },
  'ss-skolni-zkousky': { start: '2027-03-15', end: '2027-04-23', id: 'PS-18' },
  'jpz-1': { start: '2027-04-12', id: 'PS-19' },
  'jpz-2': { start: '2027-04-13', id: 'PS-19' },
  'vg-1': { start: '2027-04-14', id: 'PS-20' },
  'vg-2': { start: '2027-04-15', id: 'PS-20' },
  'skolni-nahradni': { start: '2027-04-26', end: '2027-05-05', id: 'PS-22', odvozeno: 'období od 24. 4. (sobota), první pracovní den 26. 4.' },
  'jpz-nahr-1': { start: '2027-04-29', id: 'PS-21' },
  'jpz-nahr-2': { start: '2027-04-30', id: 'PS-21' },
  'zpetvzeti': { start: '2027-05-04', id: 'PS-23' },
  'rozrazeni': { start: '2027-05-11', id: 'PS-24' },
  'vysledky-1-kolo': { start: '2027-05-14', id: 'PS-25' },
  'kolo2-prihlasky': { start: '2027-05-19', end: '2027-05-24', id: 'PS-26' },
  'kolo2-zkousky': { start: '2027-06-08', end: '2027-06-14', id: 'PS-26' },
  'kolo2-vysledky': { start: '2027-06-22', id: 'PS-26' },
  'kolo3': { start: '2027-06-23', id: 'PS-27' },
};

// ---------- 4. „Moje strategie“ – vlastní definice podle textů aplikace a PS-28 ----------
export function strategie({ expected, schools, margin = 5 }) {
  const fin = v => typeof v === 'number' && Number.isFinite(v);
  const rows = schools.map((s, i) => {
    if (!fin(expected) || !fin(s.lastMin)) return { priority: i + 1, category: 'nevim', diff: null };
    const diff = expected - s.lastMin;
    return { priority: i + 1, diff, category: diff >= margin ? 'jistota' : diff >= 0 ? 'tesne' : 'riziko' };
  });
  const noSafe = fin(expected) && rows.length > 0 && !rows.some(r => r.category === 'jistota');
  return { rows, noSafe };
}

// ---------- 5. Kontrola .ics podle RFC 5545 ----------
export function zkontrolujICS(text) {
  const chyby = [];
  if (!text.endsWith('\r\n')) chyby.push('soubor nekončí CRLF');
  if (/[^\r]\n|\r[^\n]/.test(text)) chyby.push('řádek bez CRLF');
  const radky = text.split('\r\n').filter((l, i, arr) => !(i === arr.length - 1 && l === ''));
  for (const l of radky) if (Buffer.byteLength(l, 'utf8') > 75) chyby.push(`řádek > 75 oktetů: ${l.slice(0, 40)}…`);
  // rozbalení (unfold)
  const unfolded = text.replace(/\r\n[ \t]/g, '').split('\r\n').filter(Boolean);
  if (unfolded[0] !== 'BEGIN:VCALENDAR') chyby.push('nezačíná BEGIN:VCALENDAR');
  if (unfolded.at(-1) !== 'END:VCALENDAR') chyby.push('nekončí END:VCALENDAR');
  const prop = n => unfolded.filter(l => l.startsWith(n + ':') || l.startsWith(n + ';'));
  if (prop('VERSION')[0] !== 'VERSION:2.0') chyby.push('chybí VERSION:2.0');
  if (!prop('PRODID').length) chyby.push('chybí PRODID');
  const events = [];
  let cur = null;
  for (const l of unfolded) {
    if (l === 'BEGIN:VEVENT') cur = {};
    else if (l === 'END:VEVENT') { events.push(cur); cur = null; }
    else if (cur) { const i = l.indexOf(':'); const [name, ...params] = l.slice(0, i).split(';'); cur[name] = { params, value: l.slice(i + 1) }; }
  }
  const uids = new Set();
  for (const e of events) {
    for (const n of ['UID', 'DTSTAMP', 'DTSTART', 'SUMMARY']) if (!e[n]) chyby.push(`VEVENT bez ${n}`);
    if (e.UID) { if (uids.has(e.UID.value)) chyby.push(`duplicitní UID ${e.UID.value}`); uids.add(e.UID.value); }
    if (e.DTSTAMP && !/^\d{8}T\d{6}Z$/.test(e.DTSTAMP.value)) chyby.push(`DTSTAMP není UTC date-time: ${e.DTSTAMP.value}`);
    if (e.DTSTART) {
      if (!e.DTSTART.params.includes('VALUE=DATE')) chyby.push('DTSTART bez VALUE=DATE');
      if (!/^\d{8}$/.test(e.DTSTART.value)) chyby.push(`DTSTART není DATE: ${e.DTSTART.value}`);
    }
    if (e.DTEND) {
      if (!e.DTEND.params.includes('VALUE=DATE')) chyby.push('DTEND bez VALUE=DATE');
      if (e.DTSTART && e.DTEND.value <= e.DTSTART.value) chyby.push(`DTEND ${e.DTEND.value} není po DTSTART ${e.DTSTART.value}`);
    } else chyby.push('celodenní VEVENT bez DTEND (RFC 5545 §3.6.1: bez DTEND trvá 1 den – přípustné, ale Google/Apple vyžadují explicitní konec u vícedenních)');
    for (const n of ['SUMMARY', 'DESCRIPTION']) {
      const v = e[n]?.value ?? '';
      // v TEXT musí být ; , \ escapované; povolené sekvence \\ \; \, \n \N
      if (/(^|[^\\])(\\\\)*[;,]/.test(v)) chyby.push(`${n} obsahuje neescapované ; nebo ,: ${v.slice(0, 60)}`);
      if (/\\(?![\\;,nN])/.test(v)) chyby.push(`${n} obsahuje neplatnou escape sekvenci: ${v.slice(0, 60)}`);
    }
  }
  return { chyby, pocetUdalosti: events.length, events };
}
/** Vlastní escapování TEXT podle RFC 5545 §3.3.11 – pro srovnání s modulem. */
export const escapeRFC = s => String(s).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

// ---------- 6. Testovací případy ----------
export const AB1 = [{ id: 'A', capacity: 1 }, { id: 'B', capacity: 1 }];
export const PRIPADY = [
  { kod: 'Z1', popis: 'zadání: X 90 (A,B), Y 80 (A,B)', skoly: AB1, uchazeci: [{ id: 'X', score: 90, priorities: ['A', 'B'] }, { id: 'Y', score: 80, priorities: ['A', 'B'] }], ocekavano: { X: 'A', Y: 'B' } },
  { kod: 'Z2', popis: 'zadání: X 90 (B,A), Y 80 (A,B)', skoly: AB1, uchazeci: [{ id: 'X', score: 90, priorities: ['B', 'A'] }, { id: 'Y', score: 80, priorities: ['A', 'B'] }], ocekavano: { X: 'B', Y: 'A' } },
  { kod: 'Z3', popis: 'zadání: X 90 (B,A), Z 85 (B,A), Y 80 (A)', skoly: AB1, uchazeci: [{ id: 'X', score: 90, priorities: ['B', 'A'] }, { id: 'Z', score: 85, priorities: ['B', 'A'] }, { id: 'Y', score: 80, priorities: ['A'] }], ocekavano: { X: 'B', Z: 'A', Y: null } },
  { kod: 'Z3r', popis: 'zadání Z3 v opačném pořadí zadání (Y, Z, X)', skoly: [...AB1].reverse(), uchazeci: [{ id: 'Y', score: 80, priorities: ['A'] }, { id: 'Z', score: 85, priorities: ['B', 'A'] }, { id: 'X', score: 90, priorities: ['B', 'A'] }], ocekavano: { X: 'B', Z: 'A', Y: null } },
  { kod: 'V1', popis: 'kapacita 0 – nikdo není přijat, uchazeč jde dál', skoly: [{ id: 'A', capacity: 0 }, { id: 'B', capacity: 1 }], uchazeci: [{ id: 'X', score: 90, priorities: ['A', 'B'] }], ocekavano: { X: 'B' } },
  { kod: 'V2', popis: 'uchazeč bez priorit', skoly: AB1, uchazeci: [{ id: 'X', score: 90, priorities: [] }, { id: 'Y', score: 50, priorities: ['A'] }], ocekavano: { X: null, Y: 'A' } },
  { kod: 'V3', popis: 'škola bez uchazečů (B)', skoly: AB1, uchazeci: [{ id: 'X', score: 90, priorities: ['A'] }], ocekavano: { X: 'A' } },
  { kod: 'V4', popis: 'neznámá škola a duplicitní priorita', skoly: AB1, uchazeci: [{ id: 'X', score: 50, priorities: ['Q', 'A', 'A', '', null] }], ocekavano: { X: 'A' } },
  { kod: 'V5', popis: 'shoda bodů bez kritéria → chyba', skoly: AB1, uchazeci: [{ id: 'P', score: 80, priorities: ['A'] }, { id: 'Q', score: 80, priorities: ['A'] }], chyba: true },
  { kod: 'V6', popis: 'shoda bodů, rozhodne kritérium (vyšší lepší)', skoly: AB1, uchazeci: [{ id: 'P', score: 80, tiebreak: 2, priorities: ['A'] }, { id: 'Q', score: 80, tiebreak: 5, priorities: ['A'] }], ocekavano: { P: null, Q: 'A' } },
  { kod: 'V7', popis: 'shoda bodů i kritéria → chyba', skoly: AB1, uchazeci: [{ id: 'P', score: 80, tiebreak: 3, priorities: ['A'] }, { id: 'Q', score: 80, tiebreak: 3, priorities: ['A'] }], chyba: true },
  { kod: 'V8', popis: 'shoda bodů na škole, kterou oba uvedli až jako 2. prioritu → chyba (škola musí mít úplné pořadí)', skoly: [{ id: 'A', capacity: 2 }, { id: 'B', capacity: 2 }], uchazeci: [{ id: 'P', score: 80, priorities: ['A', 'B'] }, { id: 'Q', score: 80, priorities: ['A', 'B'] }], chyba: true },
  { kod: 'V9', popis: 'body 0, záporné a chybějící', skoly: [{ id: 'A', capacity: 2 }], uchazeci: [{ id: 'P', score: 0, priorities: ['A'] }, { id: 'Q', score: -5, priorities: ['A'] }, { id: 'R', priorities: ['A'] }], chyba: true /* R má 0 b. = P */ },
  { kod: 'V10', popis: 'body 0 a záporné, kapacita 1', skoly: [{ id: 'A', capacity: 1 }], uchazeci: [{ id: 'P', score: 0, priorities: ['A'] }, { id: 'Q', score: -5, priorities: ['A'] }], ocekavano: { P: 'A', Q: null } },
  { kod: 'V11', popis: 'kapacita desetinná 1,9 → 1; záporná → 0', skoly: [{ id: 'A', capacity: 1.9 }, { id: 'B', capacity: -2 }], uchazeci: [{ id: 'P', score: 90, priorities: ['A', 'B'] }, { id: 'Q', score: 80, priorities: ['A', 'B'] }], ocekavano: { P: 'A', Q: null } },
  { kod: 'V12', popis: 'minScore: nesplnění kritéria školy', skoly: [{ id: 'A', capacity: 2, minScore: 60 }, { id: 'B', capacity: 1 }], uchazeci: [{ id: 'P', score: 59, priorities: ['A', 'B'] }, { id: 'Q', score: 60, priorities: ['A'] }], ocekavano: { P: 'B', Q: 'A' } },
  { kod: 'V13', popis: 'řetězové vytlačení přes 3 školy', skoly: [{ id: 'A', capacity: 1 }, { id: 'B', capacity: 1 }, { id: 'C', capacity: 1 }], uchazeci: [{ id: 'P', score: 90, priorities: ['A'] }, { id: 'Q', score: 85, priorities: ['A', 'B'] }, { id: 'R', score: 80, priorities: ['B', 'C'] }, { id: 'S', score: 75, priorities: ['C', 'A'] }], ocekavano: { P: 'A', Q: 'B', R: 'C', S: null } },
  { kod: 'V14', popis: 'žádní uchazeči', skoly: AB1, uchazeci: [], ocekavano: {} },
  { kod: 'V15', popis: 'žádné školy', skoly: [], uchazeci: [{ id: 'P', score: 90, priorities: ['A'] }], ocekavano: { P: null } },
  { kod: 'V16', popis: 'všichni na jednu školu s kapacitou 2, 5 uchazečů', skoly: [{ id: 'A', capacity: 2 }], uchazeci: [1, 2, 3, 4, 5].map(i => ({ id: 'u' + i, score: 50 + i, priorities: ['A'] })), ocekavano: { u1: null, u2: null, u3: null, u4: 'A', u5: 'A' } },
  { kod: 'V17', popis: 'pokusy: čeština 30/35, matematika 28/20 → 63 b. rozhoduje proti 62 b.', skoly: [{ id: 'A', capacity: 1 }], uchazeci: [{ id: 'P', attempts: { cj: [30, 35], m: [28, 20] }, priorities: ['A'] }, { id: 'Q', score: 62, priorities: ['A'] }], ocekavano: { P: 'A', Q: null } },
  { kod: 'V18', popis: 'pokusy: nemoc (2. pokus null) – počítá se 1. pokus', skoly: [{ id: 'A', capacity: 1 }], uchazeci: [{ id: 'P', attempts: { cj: [40, null], m: [35, null] }, priorities: ['A'] }, { id: 'Q', attempts: { cj: [38, 30], m: [36, 30] }, priorities: ['A'] }], ocekavano: { P: 'A', Q: null } },
  { kod: 'V19', popis: 'zadání: uchazeč s horší 1. prioritou nepřeskočí lepšího (priorita jako jediný rozdíl)', skoly: [{ id: 'A', capacity: 1 }, { id: 'B', capacity: 5 }], uchazeci: [{ id: 'P', score: 70, priorities: ['A', 'B'] }, { id: 'Q', score: 90, priorities: ['B', 'A'] }, { id: 'R', score: 95, priorities: ['B'] }, { id: 'S', score: 93, priorities: ['B'] }, { id: 'T', score: 92, priorities: ['B'] }, { id: 'U', score: 91, priorities: ['B'] }, { id: 'W', score: 90.5, priorities: ['B'] }], ocekavano: { P: null, Q: 'A', R: 'B', S: 'B', T: 'B', U: 'B', W: 'B' } },
];
export const SCENARE_OCEKAVANI = { // vlastní ruční propočet scénářů ze scenarios.js (viz zpráva)
  body: { a1: 'G', a2: 'G', a3: 'O', a4: 'O', a5: 'P', a6: 'O' },
  jistota: { b1: 'G', b2: 'G', b3: 'P', b4: 'P', b5: null, b6: 'S' },
  pokusy: { c1: 'G', c2: 'P', c3: 'P', c4: 'O' },
};

// Náhodné instance pro porovnání (deterministický generátor)
export function nahodneInstance(n = 200, seed = 20261105) {
  let s = seed; const rnd = () => (s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296;
  const out = [];
  for (let k = 0; k < n; k++) {
    const nS = 2 + Math.floor(rnd() * 3), nA = 2 + Math.floor(rnd() * 5);
    const skoly = Array.from({ length: nS }, (_, i) => ({ id: 'S' + i, capacity: Math.floor(rnd() * 3) }));
    const used = new Set();
    const uchazeci = Array.from({ length: nA }, (_, i) => {
      let score; do score = Math.floor(rnd() * 40); while (used.has(score)); used.add(score); // bez shod
      const ids = skoly.map(x => x.id).sort(() => rnd() - 0.5).slice(0, 1 + Math.floor(rnd() * 3));
      return { id: 'u' + i, score, priorities: ids };
    });
    out.push({ kod: 'N' + (k + 1), skoly, uchazeci });
  }
  return out;
}

/** Porovnání přiřazení nezávisle na pořadí klíčů. */
export const stejne = (a, b) => JSON.stringify(Object.fromEntries(Object.entries(a ?? {}).sort())) === JSON.stringify(Object.fromEntries(Object.entries(b ?? {}).sort()));

// ---------- 7. Samostatný běh: vypíše vlastní výsledky ----------
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('# Vlastní referenční výpočet – bez kódu aplikace');
  console.log('lepší ze dvou (30/35, 28/20):', lepsiZeDvou({ cj: [30, 35], m: [28, 20] }));
  for (const p of PRIPADY) {
    try {
      const r = odlozenePrijeti(p.uchazeci, p.skoly);
      const hs = p.uchazeci.length <= 7 ? hrubaSila(p.uchazeci, p.skoly) : null;
      const ok = stejne(r.assignment, p.ocekavano);
      console.log(p.kod, ok ? 'OK' : 'ROZDÍL', JSON.stringify(r.assignment), hs ? `stabilních=${hs.pocetStabilnich} optimální=${stejne(hs.optimalni, r.assignment)}` : '');
    } catch (e) { console.log(p.kod, p.chyba ? 'OK (očekávaná chyba)' : 'NEČEKANÁ CHYBA', e.message); }
  }
  for (const [id, t] of Object.entries(REJSTRIK_TERMINY)) console.log(id, t.start, denVTydnu(t.start), jePracovni(t.start) ? '' : '(ne pracovní den)', t.end ? `– ${t.end} ${denVTydnu(t.end)}` : '');
  console.log('20. 2. 2027 →', denVTydnu('2027-02-20'), '→ nejbližší pracovní den', nejblizsiPracovni('2027-02-20'));
  console.log('24. 4. 2027 →', denVTydnu('2027-04-24'), '→', nejblizsiPracovni('2027-04-24'));
  console.log('svátky 2027:', [...svatkyCR(2027)].join(', '));
}
