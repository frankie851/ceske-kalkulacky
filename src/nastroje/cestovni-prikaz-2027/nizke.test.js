// Revize 5. 11. 2026, nízké nálezy cestovního příkazu: odkazy na předpisy na výtisku (CES-08),
// letní čas (CES-10), sazby hlavičky podle roku cesty (CES-11), vyšší sjednané stravné (CES-12).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ChybaVstupu, hodinyPoDnech, stravneDen, spocitejCestu } from './cesty.js';
import * as v from './vystup.js';

const rules = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const r2026 = rules['2026'];
const zdrojak = (soubor) => readFileSync(new URL(soubor, import.meta.url), 'utf8');

const hlavicka = (o = {}) => ({
  firma: 'Test s.r.o.', kdo: 'Jan Novák', sfera: 'soukroma',
  kraceniPct: [null, null, null], stravneVerejna: [null, null, null], stravneSoukroma: [null, null, null],
  vozidlo: { spz: '1AB 2345', druh: 'osobni', palivo: 'benzin95', spotreba: 6 }, ...o,
});

/** Pravidla s vymyšleným rokem 2027, který má jiné rozpětí i krácení než 2026 (jen pro test). */
function sRokem2027() {
  const r = structuredClone(rules);
  r['2027'] = structuredClone(r2026);
  r['2027'].stravne = { soukroma: [160, 300, 390], verejnaMin: [160, 300, 390], verejnaMax: [190, 340, 470] };
  r['2027'].kraceniMaxPct = [60, 30, 20];
  r['2027'].phm = Object.fromEntries(Object.entries(r2026.phm).map(([k, o]) => [k, [{ ...o[0], od: '2027-01-01' }]]));
  return r;
}

// --- CES-10: skutečně uplynulý čas v Europe/Prague -------------------------------------------

test('CES-10: 29. 3. 2026 0:30–5:30 (přechod na letní čas) trvá 4 h → stravné nenáleží', () => {
  assert.deepEqual(hodinyPoDnech('2026-03-29T00:30', '2026-03-29T05:30'), [{ datum: '2026-03-29', minuty: 240 }]);
  const c = spocitejCestu(hlavicka(), { odjezd: '2026-03-29T00:30', navrat: '2026-03-29T05:30', km: 0 }, rules);
  assert.equal(c.stravneHal, 0);
});

test('CES-10: 25. 10. 2026 0:30–5:00 (přechod na zimní čas) trvá 5,5 h → stravné 5–12 h', () => {
  assert.deepEqual(hodinyPoDnech('2026-10-25T00:30', '2026-10-25T05:00'), [{ datum: '2026-10-25', minuty: 330 }]);
  const c = spocitejCestu(hlavicka(), { odjezd: '2026-10-25T00:30', navrat: '2026-10-25T05:00', km: 0 }, rules);
  assert.equal(c.stravneHal, r2026.stravne.soukroma[0] * 100);
});

test('CES-10: dny se dělí o místní půlnoci, hodina navíc nebo míň patří dni přechodu', () => {
  assert.deepEqual(hodinyPoDnech('2026-03-28T20:00', '2026-03-29T08:00'),
    [{ datum: '2026-03-28', minuty: 240 }, { datum: '2026-03-29', minuty: 420 }]);
  assert.deepEqual(hodinyPoDnech('2026-10-24T20:00', '2026-10-25T08:00'),
    [{ datum: '2026-10-24', minuty: 240 }, { datum: '2026-10-25', minuty: 540 }]);
  // běžný den beze změny
  assert.deepEqual(hodinyPoDnech('2026-03-15T06:00', '2026-03-15T19:00'), [{ datum: '2026-03-15', minuty: 780 }]);
  assert.deepEqual(hodinyPoDnech('2026-12-31T20:00', '2027-01-01T02:00'),
    [{ datum: '2026-12-31', minuty: 240 }, { datum: '2027-01-01', minuty: 120 }]);
});

// --- CES-11: rozpětí a krácení v hlavičce podle roku cesty -------------------------------------

test('CES-11: rok pravidel hlavičky = rok rozpracované cesty, jinak poslední cesty, jinak poslední rok', () => {
  const r = sRokem2027();
  assert.equal(v.rokHlavicky(r, '2026-12-20T08:00', []), '2026');
  assert.equal(v.rokHlavicky(r, '2027-01-05T08:00', []), '2027');
  assert.equal(v.rokHlavicky(r, '', [{ odjezd: '2026-11-02T07:00' }]), '2026');
  assert.equal(v.rokHlavicky(r, '', []), '2027');
  assert.equal(v.rokHlavicky(rules, '2027-01-05T08:00', []), '2026', 'rok bez sazeb → poslední rok se sazbami');
});

test('CES-11: rozpětí veřejné sféry se ověřuje podle roku cesty, ne podle posledního roku', () => {
  const r = sRokem2027();
  const texty = { verejna0: '185', verejna1: '', verejna2: '' };
  assert.deepEqual(v.stravneHlavicky(texty, r['2026']).chyby, {});
  assert.deepEqual(v.stravneHlavicky(texty, r['2026']).stravneVerejna, [185, null, null]);
  const chyby2027 = v.stravneHlavicky({ verejna0: '159' }, r['2027']).chyby;
  assert.match(chyby2027.verejna0, /^Jen 160–190\sKč\.$/);
  assert.match(v.stravneHlavicky({ kraceni0: '65' }, r['2027']).chyby.kraceni0, /^Nejvýš 60\s%\.$/);
  assert.deepEqual(v.stravneHlavicky({ kraceni0: '65' }, r['2026']).chyby, {});
});

test('CES-11: prázdná pole hlavičky se doplní podle roku cesty (veřejná sféra i krácení)', () => {
  const r = sRokem2027();
  // 13 h v roce 2026, veřejná sféra: vyplněné jen pásmo 5–12 h, pásmo 12–18 h z rozpětí 2026
  const verejna = v.vypocitejCestu(hlavicka({ sfera: 'verejna', stravneVerejna: [170, null, null] }),
    { id: 'a', odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 0, jidla: {} }, r);
  assert.equal(verejna.ok, true, verejna.zprava);
  assert.equal(verejna.v.stravneHal, r2026.stravne.verejnaMin[1] * 100);
  // soukromá sféra, krácení nevyplněné: 8 h s obědem v roce 2026 → krácení 70 % (ne 60 % z roku 2027)
  const soukroma = v.vypocitejCestu(hlavicka(),
    { id: 'b', odjezd: '2026-03-15T08:00', navrat: '2026-03-15T16:00', km: 0, jidla: { '2026-03-15': { o: true } } }, r);
  assert.equal(soukroma.v.stravneHal, Math.round(r2026.stravne.soukroma[0] * (100 - r2026.kraceniMaxPct[0])));
});

// --- CES-12: vyšší sjednané stravné v soukromé sféře ----------------------------------------------

test('CES-12: sjednané stravné 200 Kč pro pásmo 5–12 h se použije a krátí se z něj', () => {
  const h = hlavicka({ stravneSoukroma: [200, null, null] });
  assert.equal(stravneDen(8 * 60, 0, h, r2026).stravneHal, 20000);
  assert.equal(stravneDen(8 * 60, 1, h, r2026).stravneHal, 6000); // 200 − 70 %
  assert.equal(stravneDen(13 * 60, 0, h, r2026).stravneHal, r2026.stravne.soukroma[1] * 100); // jiné pásmo: minimum
});

test('CES-12: sjednané stravné pod zákonným minimem → chyba', () => {
  assert.throws(() => stravneDen(8 * 60, 0, hlavicka({ stravneSoukroma: [150, null, null] }), r2026), ChybaVstupu);
  const { chyby, stravneSoukroma } = v.stravneHlavicky({ sjednane0: '150', sjednane1: '', sjednane2: '400' }, r2026);
  assert.match(chyby.sjednane0, /^Nejméně 155\sKč\.$/);
  assert.deepEqual(stravneSoukroma, [undefined, null, 400]);
});

test('CES-12: sjednané stravné projde až do vyúčtování', () => {
  const stav = {
    hlavicka: hlavicka({ stravneSoukroma: [200, null, null] }),
    cesty: [{ id: 'a', odjezd: '2026-03-15T08:00', navrat: '2026-03-15T16:00', odkud: 'Praha', kam: 'Kolín', km: 0, ucel: 'Jednání', cenaDoklad: null, jidla: {} }],
  };
  const vysledek = v.vypocitej(stav, rules);
  assert.equal(vysledek.souhrn.stravneHal, 20000);
  assert.match(v.vyuctovani(stav, vysledek, rules), /Sjednané stravné/);
  assert.match(zdrojak('./index.njk'), /§ 163 odst\. 3/);
});

// --- CES-08: odkazy na texty předpisů na výtisku -------------------------------------------------

test('CES-08: výtisk odkazuje na zákoník práce a na vyhlášku i novely ze zakonyprolidi.cz', () => {
  const stav = {
    hlavicka: hlavicka(),
    cesty: [{ id: 'a', odjezd: '2026-10-15T06:00', navrat: '2026-10-15T19:00', odkud: 'Praha', kam: 'Plzeň', km: 100, ucel: 'Jednání', cenaDoklad: null, jidla: {} }],
  };
  const html = v.vyuctovani(stav, v.vypocitej(stav, rules), rules);
  for (const c of ['2025-573', '2026-78', '2026-175']) {
    assert.match(html, new RegExp(`<a href="https://www\\.zakonyprolidi\\.cz/cs/${c}">`), c);
  }
  assert.match(zdrojak('./index.njk'), /cp-tisk-poznamka[^\n]*<a href="https:\/\/www\.zakonyprolidi\.cz\/cs\/2006-262">/);
});
