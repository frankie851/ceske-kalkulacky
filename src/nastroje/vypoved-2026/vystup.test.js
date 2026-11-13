// Výpověď 2026 – texty a kontroly ve výstupu (revize 5. 11. 2026, nízké nálezy VYP-06 a VYP-07).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { spocitej } from './vystup.js';
import { konecPomeru, kontrolaDoruceni, kontrolaZadosti } from './vypoved.js';

const rules = JSON.parse(readFileSync(new URL('./rules.json', import.meta.url), 'utf8'));
const ZAKLAD = {
  doruceni: '2026-07-10', kdo: 'zamestnavatel', duvod: 'c', zkusebniDoba: false, konecDohody: '',
  delkaLet: 1.5, vek: 40, hruby: 40000, cisty: 30000, datumZadosti: '2026-09-11',
};
const poznamky = (vstup) => spocitej({ ...ZAKLAD, ...vstup }, rules).poznamky.join('\n');

// --- VYP-06: texty -------------------------------------------------------------

test('VYP-06: ochranná doba posune konec o dobu, po kterou trvala (§ 53 odst. 2 ZP)', () => {
  const t = poznamky({});
  assert.match(t, /o dobu, po kterou ochranná doba ve výpovědní době trvala/);
  assert.match(t, /§ 53 odst\. 2 ZP/);
  assert.doesNotMatch(t, /o zbytek výpovědní doby/);
  assert.match(t, /netrváš/, 'zaměstnanec může prodloužení odmítnout');
});

test('VYP-06: hraniční věk se opírá o § 43 zákona o zaměstnanosti, ne o „praxi“', () => {
  for (const vek of [52, 57]) {
    const t = poznamky({ vek });
    assert.match(t, /§ 43 zákona o zaměstnanosti/, `věk ${vek}`);
    assert.doesNotMatch(t, /praxe/, `věk ${vek}`);
  }
  assert.doesNotMatch(poznamky({ vek: 40 }), /Hraniční věk/);
});

test('VYP-06: zrušení ve zkušební době připomene zákaz v prvních 14 dnech neschopenky (§ 66 odst. 1 ZP)', () => {
  const t = poznamky({ zkusebniDoba: true });
  assert.match(t, /prvních 14 kalendářních dnů/);
  assert.match(t, /§ 66 odst\. 1 ZP/);
  assert.doesNotMatch(poznamky({ zkusebniDoba: true, kdo: 'zamestnanec' }), /prvních 14/, 'zaměstnance se zákaz netýká');
  assert.doesNotMatch(poznamky({}), /prvních 14/);
});

test('VYP-06: počet dní zákazu je v rules.json s citací § 66 odst. 1', () => {
  const z = rules.zakonikPrace.zkusebniDoba;
  assert.equal(z.zakazPriNeschopnostiDnu, 14);
  assert.match(z.zakazZdroj.pravniZaklad, /§ 66 odst\. 1/);
  assert.match(z.zakazZdroj.url, /2006-262#p66$/);
  assert.match(z.zakazZdroj.citace, /prvních 14 kalendářních dnů/);
});

// --- VYP-07: doručení před 1. 6. 2025 a žádost před koncem ----------------------

test('VYP-07: výpověď doručená před 1. 6. 2025 se nepočítá (čl. II bod 3 zákona č. 120/2025 Sb.)', () => {
  const zprava = /Kalkulačka počítá výpovědi doručené od 1\. 6\. 2025\./;
  assert.match(kontrolaDoruceni({ doruceni: '2025-05-31', kdo: 'zamestnanec' }, rules), zprava);
  assert.throws(() => konecPomeru({ doruceni: '2025-05-15', kdo: 'zamestnanec' }, rules), zprava);
  assert.throws(() => konecPomeru({ doruceni: '2025-05-15', kdo: 'zamestnavatel', duvod: 'c' }, rules), zprava);
  assert.equal(kontrolaDoruceni({ doruceni: '2025-06-01', kdo: 'zamestnanec' }, rules), null);
  assert.equal(konecPomeru({ doruceni: '2025-06-01', kdo: 'zamestnanec' }, rules), '2025-08-01');
  // Dohoda a zkušební doba výpovědní dobu nemají, § 51 se jich netýká.
  assert.equal(kontrolaDoruceni({ doruceni: '2025-05-15', kdo: 'dohoda' }, rules), null);
  assert.equal(kontrolaDoruceni({ doruceni: '2025-05-15', kdo: 'zamestnanec', zkusebniDoba: true }, rules), null);
});

test('VYP-07: datum účinnosti je v rules.json s citací přechodného ustanovení', () => {
  const vd = rules.zakonikPrace.vypovedniDoba;
  assert.equal(vd.ucinnost, '2025-06-01');
  assert.match(vd.prechodneUstanoveni.pravniZaklad, /čl\. II bod 3 zákona č\. 120\/2025 Sb\./);
  assert.match(vd.prechodneUstanoveni.url, /zakonyprolidi\.cz\/cs\/2025-120/);
  assert.match(vd.prechodneUstanoveni.citace, /doručena přede dnem nabytí účinnosti/);
});

test('VYP-07: žádost o podporu musí být až po skončení pracovního poměru', () => {
  assert.match(kontrolaZadosti('2026-09-10', '2026-09-10'), /až po skončení pracovního poměru/);
  assert.match(kontrolaZadosti('2026-08-01', '2026-09-10'), /nejdřív 11\. 9\. 2026/);
  assert.equal(kontrolaZadosti('2026-09-11', '2026-09-10'), null);
  assert.throws(() => spocitej({ ...ZAKLAD, doruceni: '2026-12-31', datumZadosti: '2026-12-15' }, rules), /až po skončení/);
  assert.doesNotThrow(() => spocitej(ZAKLAD, rules));
});
