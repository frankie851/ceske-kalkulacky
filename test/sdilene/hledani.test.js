import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizuj, hledej, jeTisen, vzdalenost } from '../../src/js/hledani.js';

const synonyma = JSON.parse(fs.readFileSync(new URL('../../src/_data/synonyma.json', import.meta.url), 'utf8'));

const index = [
  { id: 'plan48', nazev: 'Plán48', perex: 'Kolik ti stát přidá na penzijko a odpočet 48 000 Kč.', stitky: ['penzijko', 'DIP', 'odpočet', 'životní pojištění'], url: '/penize/plan48/', kategorie: 'Peníze a investice', typ: 'kalkulačka', stav: 'aktivni' },
  { id: 'penzijko-kompas', nazev: 'Penzijko kompas', perex: 'Který fond a kolik sežerou poplatky.', stitky: ['penzijko', 'poplatky', 'transformovaný fond'], url: '/penize/penzijko-kompas/', kategorie: 'Peníze a investice', typ: 'kalkulačka', stav: 'aktivni' },
  { id: 'mam-eet', nazev: 'Mám EET?', perex: 'Jestli se tě EET 2.0 týká.', stitky: ['EET 2.0', 'EET OFF', 'pokladna'], url: '/dane-podnikani/mam-eet/', kategorie: 'Daně a podnikání', typ: 'průvodce', stav: 'aktivni' },
  { id: 'osvc-2027', nazev: 'OSVČ 2027', perex: 'Paušální daň, nebo přiznání?', stitky: ['paušální daň', 'výdajový paušál'], url: '/dane-podnikani/mam-eet/osvc-2027/', kategorie: 'Daně a podnikání', typ: 'kalkulačka', stav: 'aktivni' },
  { id: 'vypoved-2026', nazev: 'Výpověď 2026', perex: 'Odstupné a výpovědní doba.', stitky: ['výpovědní doba', 'odstupné'], url: null, kategorie: 'Práce a rodina', typ: 'průvodce', stav: 'pripravujeme' },
  { id: 'exekuce-nebo-oddluzeni', nazev: 'Exekuce, nebo oddlužení?', perex: 'Kolik vám zůstane z výplaty.', stitky: ['exekuce', 'oddlužení'], url: null, kategorie: 'Dluhy', typ: 'průvodce', stav: 'pripravujeme' },
  { id: 'zdanim-to', nazev: 'Zdaním to?', perex: 'Prodej akcií a krypta.', stitky: ['akcie', 'krypto', 'dividendy'], url: null, kategorie: 'Peníze a investice', typ: 'průvodce', stav: 'pripravujeme' },
];
const ids = (r) => r.map((v) => v.id);

test('normalizuj: malá písmena, bez diakritiky a interpunkce', () => {
  assert.equal(normalizuj('Mám EET?'), 'mam eet');
  assert.equal(normalizuj('  Výpověď   2026 '), 'vypoved 2026');
  assert.equal(normalizuj('Plán48'), 'plan48');
  assert.equal(normalizuj('ŽLUŤOUČKÝ kůň'), 'zlutoucky kun');
  assert.equal(normalizuj(null), '');
});

test('hledej: přesný název je první', () => {
  const r = hledej('penzijko kompas', index, synonyma);
  assert.equal(r[0].id, 'penzijko-kompas');
  assert.equal(hledej('Plán48', index, synonyma)[0].id, 'plan48');
});

test('hledej: bez diakritiky', () => {
  assert.equal(hledej('mam eet', index, synonyma)[0].id, 'mam-eet');
  assert.equal(hledej('vypoved', index, synonyma)[0].id, 'vypoved-2026');
});

test('hledej: penzijko najde Plán48 i Kompas', () => {
  const r = ids(hledej('penzijko', index, synonyma));
  assert.ok(r.includes('plan48') && r.includes('penzijko-kompas'));
  assert.equal(r[0], 'penzijko-kompas');
});

test('hledej: synonyma (DPS, osobní bankrot, bitcoin, paušál)', () => {
  assert.ok(ids(hledej('DPS', index, synonyma)).includes('plan48'));
  assert.ok(ids(hledej('doplňkové penzijní spoření', index, synonyma)).includes('penzijko-kompas'));
  assert.equal(hledej('osobní bankrot', index, synonyma)[0].id, 'exekuce-nebo-oddluzeni');
  assert.equal(hledej('bitcoin', index, synonyma)[0].id, 'zdanim-to');
  assert.equal(hledej('paušál', index, synonyma)[0].id, 'osvc-2027');
  assert.ok(ids(hledej('účtenky', index, synonyma)).includes('mam-eet'));
});

test('hledej: překlep', () => {
  assert.equal(hledej('penzjko', index, synonyma)[0].id, 'penzijko-kompas');
  assert.ok(ids(hledej('odstupne', index, synonyma)).includes('vypoved-2026'));
  assert.ok(ids(hledej('vypovet', index, synonyma)).includes('vypoved-2026'));
});

test('hledej: prázdný dotaz a nic nenalezeno', () => {
  assert.deepEqual(hledej('', index, synonyma), []);
  assert.deepEqual(hledej('   ', index, synonyma), []);
  assert.deepEqual(hledej('xyzqwv', index, synonyma), []);
});

test('hledej: synonyma i jako prosté pole skupin', () => {
  assert.ok(ids(hledej('dps', index, synonyma.skupiny)).includes('plan48'));
});

test('jeTisen: dluhy, exekuce, insolvence, nájem', () => {
  for (const q of ['dluhy', 'Mám exekuci', 'insolvence', 'oddlužení', 'Nemám na nájem', 'srážky ze mzdy', 'DLUH']) {
    assert.ok(jeTisen(q), q);
  }
  for (const q of ['penzijko', 'EET', 'výpověď', '']) assert.ok(!jeTisen(q), q);
});

test('vzdalenost', () => {
  assert.equal(vzdalenost('kitten', 'sitting'), 3);
  assert.equal(vzdalenost('abc', 'abc'), 0);
  assert.ok(vzdalenost('a', 'abcdefgh', 2) > 2);
});
