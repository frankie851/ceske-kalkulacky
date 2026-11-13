import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ChybaSazby, ChybaVstupu,
  pravidlaProDatum, zakladniNahrada, nahradaPHM, cenaPHM,
  hodinyPoDnech, pasmo, stravneDen, spocitejCestu, souhrn, formatKc,
} from './cesty.js';

const rules = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const r2026 = rules['2026'];

const hlavicka = (o = {}) => ({
  firma: 'Test s.r.o.', zamestnanec: 'Jan Novák',
  vozidlo: { spz: '1AB 2345', druh: 'osobni', palivo: 'benzin95', spotreba: 6 },
  sfera: 'soukroma', ...o,
});

// --- Povinné případy ze zadání (sazby 2026, osobní auto) ---

test('100 km × 5,90 Kč = 590 Kč základní náhrady', () => {
  assert.equal(zakladniNahrada(100, r2026.sazbaKm.osobni), 59000);
  assert.equal(formatKc(59000), '590,00 Kč');
});

test('PHM: 100 km, 6 l/100 km, benzin 95 bez dokladu (před 1. 10. 2026) → 208,20 Kč', () => {
  const cena = cenaPHM(r2026, 'benzin95', '2026-03-15');
  assert.deepEqual(cena, { cenaHal: 3470, zdroj: 'vyhlaska', od: '2026-01-01' });
  assert.equal(nahradaPHM(100, 6, cena.cenaHal), 20820);
});

test('cesta 13 hodin bez jídla, soukromá sféra → 236 Kč', () => {
  const v = spocitejCestu(hlavicka(), {
    odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 0,
  }, rules);
  assert.equal(v.stravneHal, 23600);
});

test('cesta 20 hodin → 370 Kč', () => {
  assert.equal(stravneDen(20 * 60, 0, hlavicka(), r2026).stravneHal, 37000);
});

test('cesta 4 hodiny → 0 Kč', () => {
  assert.equal(stravneDen(4 * 60, 0, hlavicka(), r2026).stravneHal, 0);
});

test('elektromobil 100 km, 18 kWh/100 km bez dokladu → 129,60 Kč', () => {
  const cena = cenaPHM(r2026, 'elektrina', '2026-03-15');
  assert.equal(cena.cenaHal, 720);
  assert.equal(nahradaPHM(100, 18, cena.cenaHal), 12960);
});

test('cesta v roce 2027 bez vydané vyhlášky → výpočet se nepustí a vysvětlí proč', () => {
  assert.throws(() => pravidlaProDatum(rules, '2027-01-10'), (e) => {
    assert.ok(e instanceof ChybaSazby);
    assert.match(e.message, /2027/);
    assert.match(e.message, /vyhláška/i);
    return true;
  });
  assert.throws(() => spocitejCestu(hlavicka(), {
    odjezd: '2027-01-10T07:00', navrat: '2027-01-10T15:00', km: 100,
  }, rules), ChybaSazby);
});

// --- Doplňující případy ---

test('benzin 95 od 1. 10. 2026 (vyhl. 175/2026 Sb.) → 41,80 Kč/l', () => {
  assert.equal(cenaPHM(r2026, 'benzin95', '2026-09-30').cenaHal, 3470);
  assert.equal(cenaPHM(r2026, 'benzin95', '2026-10-01').cenaHal, 4180);
});

test('nafta od 1. 6. 2026 (vyhl. 78/2026 Sb.) → 44,50 Kč/l', () => {
  assert.equal(cenaPHM(r2026, 'nafta', '2026-05-31').cenaHal, 3410);
  assert.equal(cenaPHM(r2026, 'nafta', '2026-06-01').cenaHal, 4450);
});

test('cena z dokladu má přednost před vyhláškovou', () => {
  assert.deepEqual(cenaPHM(r2026, 'benzin95', '2026-03-15', 38.9), { cenaHal: 3890, zdroj: 'doklad' });
});

test('rok bez záznamu v rules.json → ChybaSazby', () => {
  assert.throws(() => pravidlaProDatum(rules, '2025-12-31'), ChybaSazby);
});

test('hranice pásem: 5:00 h → 155 Kč, 12:00 h → 155 Kč, 12:01 → 236, 18:00 → 236, 18:01 → 370, 4:59 → 0', () => {
  const h = hlavicka();
  const s = (min) => stravneDen(min, 0, h, r2026).stravneHal;
  assert.equal(s(300), 15500);
  assert.equal(s(720), 15500);
  assert.equal(s(721), 23600);
  assert.equal(s(1080), 23600);
  assert.equal(s(1081), 37000);
  assert.equal(s(299), 0);
  assert.equal(pasmo(299), -1);
});

test('krácení, soukromá sféra: 13 h + 1 oběd → 236 × 0,65 = 153,40 Kč', () => {
  assert.equal(stravneDen(13 * 60, 1, hlavicka(), r2026).stravneHal, 15340);
});

test('krácení nesmí jít pod nulu: 6 h + 2 jídla (2 × 70 %) → 0 Kč', () => {
  assert.equal(stravneDen(6 * 60, 2, hlavicka(), r2026).stravneHal, 0);
});

test('soukromá sféra: nižší krácení určené předem (např. 50 %)', () => {
  const h = hlavicka({ kraceniPct: [50, 35, 25] });
  assert.equal(stravneDen(6 * 60, 1, h, r2026).stravneHal, 7750);
});

test('soukromá sféra: krácení nad zákonné maximum se odmítne', () => {
  const h = hlavicka({ kraceniPct: [80, 35, 25] });
  assert.throws(() => stravneDen(6 * 60, 1, h, r2026), ChybaVstupu);
});

test('veřejná sféra: bez určení se použije dolní hranice, krácení je pevné', () => {
  const h = hlavicka({ sfera: 'verejna', kraceniPct: [10, 10, 10] });
  assert.equal(stravneDen(13 * 60, 0, h, r2026).stravneHal, 23600);
  assert.equal(stravneDen(13 * 60, 1, h, r2026).stravneHal, 15340);
});

test('veřejná sféra: určená částka v rozpětí, mimo rozpětí chyba', () => {
  const h = hlavicka({ sfera: 'verejna', stravneVerejna: [185, 284, 442] });
  assert.equal(stravneDen(20 * 60, 0, h, r2026).stravneHal, 44200);
  const spatne = hlavicka({ sfera: 'verejna', stravneVerejna: [200, 284, 442] });
  assert.throws(() => stravneDen(6 * 60, 0, spatne, r2026), ChybaVstupu);
});

test('hodiny po kalendářních dnech u vícedenní cesty', () => {
  assert.deepEqual(hodinyPoDnech('2026-03-15T14:00', '2026-03-17T10:30'), [
    { datum: '2026-03-15', minuty: 600 },
    { datum: '2026-03-16', minuty: 1440 },
    { datum: '2026-03-17', minuty: 630 },
  ]);
  // návrat přesně o půlnoci nevytvoří prázdný den
  assert.deepEqual(hodinyPoDnech('2026-03-15T08:00', '2026-03-16T00:00'), [
    { datum: '2026-03-15', minuty: 960 },
  ]);
});

test('návrat před odjezdem → ChybaVstupu', () => {
  assert.throws(() => hodinyPoDnech('2026-03-15T10:00', '2026-03-15T09:00'), ChybaVstupu);
});

test('vícedenní cesta: stravné za každý den zvlášť, jídla po dnech', () => {
  const v = spocitejCestu(hlavicka(), {
    odjezd: '2026-03-15T14:00', navrat: '2026-03-17T10:30', km: 0,
    jidla: { '2026-03-16': 1 },
  }, rules);
  // 10 h → 155; 24 h + 1 jídlo → 370 − 25 % = 277,50; 10,5 h → 155
  assert.deepEqual(v.dny.map((d) => d.stravneHal), [15500, 27750, 15500]);
  assert.equal(v.stravneHal, 58750);
});

test('celá cesta: základ + PHM + stravné; jednostopé vozidlo 1,60 Kč/km', () => {
  const v = spocitejCestu(hlavicka(), {
    odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 100,
  }, rules);
  assert.equal(v.zakladniHal, 59000);
  assert.equal(v.phmHal, 20820);
  assert.equal(v.stravneHal, 23600);
  assert.equal(v.celkemHal, 59000 + 20820 + 23600);

  const moto = hlavicka({ vozidlo: { spz: 'X', druh: 'jednostope', palivo: 'benzin95', spotreba: 4 } });
  assert.equal(spocitejCestu(moto, { odjezd: '2026-03-15T08:00', navrat: '2026-03-15T10:00', km: 50 }, rules).zakladniHal, 8000);
});

// Revize 5. 11. 2026, CES-02: § 157 odst. 4 ZP – při použití přívěsu se sazba za km zvýší
// nejméně o 15 %. Původní test výpočet s přívěsem odmítal.
test('přívěs: sazba za km zvýšená o 15 % (§ 157 odst. 4 ZP)', () => {
  const cesta = { odjezd: '2026-03-15T06:00', navrat: '2026-03-15T19:00', km: 100 };
  const v = spocitejCestu(hlavicka(), { ...cesta, prives: true }, rules);
  assert.equal(v.zakladniHal, 67850);
  assert.equal(v.privesPct, 15);
  // z přesného součinu: 12,5 × 5,90 × 1,15 = 84,8125 → 84,81 Kč (ne 12,5 × 6,79)
  assert.equal(spocitejCestu(hlavicka(), { ...cesta, km: 12.5, prives: true }, rules).zakladniHal, 8481);
  const moto = hlavicka({ vozidlo: { spz: 'X', druh: 'jednostope', palivo: 'benzin95', spotreba: 4 } });
  assert.equal(spocitejCestu(moto, { ...cesta, km: 50, prives: true }, rules).zakladniHal, 9200);
  assert.equal(spocitejCestu(hlavicka(), cesta, rules).zakladniHal, 59000);
  assert.equal(rules.zakonik.prives.pct, 15);
  assert.match(rules.zakonik.prives.zdroj.url, /2006-262#p157/);
});

// Revize 5. 11. 2026, CES-01: § 163 odst. 4 ZP – cesta, která spadá do 2 kalendářních dnů,
// se posoudí dohromady, je-li to pro zaměstnance výhodnější.
test('cesta přes 2 kalendářní dny se posoudí dohromady, je-li to výhodnější (§ 163 odst. 4)', () => {
  const st = (odjezd, navrat, extra = {}, h = hlavicka()) => spocitejCestu(h, { odjezd, navrat, km: 0, ...extra }, rules);
  const a = st('2026-03-15T20:00', '2026-03-16T02:00');
  assert.equal(a.stravneHal, 15500);
  assert.equal(a.posouzeni, 'spolecne');
  assert.equal(st('2026-04-10T06:00', '2026-04-11T00:30').stravneHal, 37000);
  assert.equal(st('2026-03-15T22:00', '2026-03-16T11:00').stravneHal, 23600);
  const odd = st('2026-03-15T19:00', '2026-03-16T10:00');
  assert.equal(odd.stravneHal, 31000);
  assert.equal(odd.posouzeni, 'oddelene');
  assert.equal(st('2026-02-28T22:00', '2026-03-01T04:00').stravneHal, 15500);
  assert.equal(st('2026-03-15T21:00', '2026-03-16T09:00', { jidla: { '2026-03-16': 1 } }).stravneHal, 4650);
  assert.equal(st('2026-03-15T20:00', '2026-03-16T02:00', {}, hlavicka({ sfera: 'verejna' })).stravneHal, 15500);
  // Cesty přes 3 a více dní se nemění.
  assert.equal(st('2026-03-15T14:00', '2026-03-17T10:30', { jidla: { '2026-03-16': 1 } }).posouzeni, 'oddelene');
});

test('desetinné km a haléřové zaokrouhlení', () => {
  // 12,5 km × 5,90 = 73,75 Kč
  assert.equal(zakladniNahrada(12.5, 5.9), 7375);
  // 33,3 km × 6,4 l/100 × 34,70 = 73,95264 → 73,95 Kč
  assert.equal(nahradaPHM(33.3, 6.4, 3470), 7395);
  // 0,5 haléře se zaokrouhluje nahoru: 0,1 km × 5 l × 41,0 → 0,205 Kč → 0,21 Kč
  assert.equal(nahradaPHM(0.1, 5, 4100), 21);
});

// Revize 5. 11. 2026, CES-05/CES-06: zaokrouhlení částky k výplatě nahoru na celé koruny stanoví
// § 183 odst. 5 zákoníku práce (dřív test i aplikace mluvily o „konvenci aplikace“).
test('souhrn sčítá položky a částku k výplatě zaokrouhlí nahoru na koruny (§ 183 odst. 5 ZP)', () => {
  const s = souhrn([
    { zakladniHal: 7375, phmHal: 7395, stravneHal: 15340, celkemHal: 30110 },
    { zakladniHal: 59000, phmHal: 20820, stravneHal: 23600, celkemHal: 103420 },
  ]);
  assert.equal(s.zakladniHal, 66375);
  assert.equal(s.phmHal, 28215);
  assert.equal(s.stravneHal, 38940);
  assert.equal(s.celkemHal, 133530);
  assert.equal(s.celkemKc, 1336);
});

test('formatKc', () => {
  assert.equal(formatKc(123456789), '1 234 567,89 Kč');
  assert.equal(formatKc(5), '0,05 Kč');
  assert.equal(formatKc(0), '0,00 Kč');
});
