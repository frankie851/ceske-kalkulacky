// Testy výpočtu Volno 2027 (node --test). Pravidla se čtou z ../rules.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  velikonocniNedele, svatkyRoku, jeVolno, jeVikend, denVTydnu, dnyVolnaVRoce, blokyVolna,
  nejlepsiNavrhy, zavreneObchodyRoku, prehledRoku, dnyMezi,
} from '../volno.js';

const rules = JSON.parse(readFileSync(new URL('../rules.json', import.meta.url), 'utf8'));
const ROK = rules.rok;
const svatek = (datum) => svatkyRoku(Number(datum.slice(0, 4)), rules).find((s) => s.datum === datum);

test('rules.json: meta, rok 2027 a 13 svátků', () => {
  assert.match(rules.meta.overeno, /^\d{4}-\d{2}-\d{2}$/);
  assert.ok(rules.meta.zdroje.length >= 2);
  assert.ok(rules.meta.neovereno.some((t) => /směnný provoz/i.test(t)));
  assert.equal(ROK, 2027);
  assert.equal(svatkyRoku(ROK, rules).length, 13);
});

test('Velikonoční neděle 2024–2030 (algoritmus)', () => {
  const zname = {
    2024: '2024-03-31', 2025: '2025-04-20', 2026: '2026-04-05', 2027: '2027-03-28',
    2028: '2028-04-16', 2029: '2029-04-01', 2030: '2030-04-21',
  };
  for (const [rok, datum] of Object.entries(zname)) assert.equal(velikonocniNedele(Number(rok)), datum, `rok ${rok}`);
});

test('2027: Velký pátek 26. 3., Velikonoční pondělí 29. 3.', () => {
  assert.equal(svatek('2027-03-26')?.nazev, 'Velký pátek');
  assert.equal(svatek('2027-03-29')?.nazev, 'Velikonoční pondělí');
  assert.equal(denVTydnu('2027-03-26'), 4); // pátek
  assert.equal(denVTydnu('2027-03-29'), 0); // pondělí
});

test('2027: 1. 5., 8. 5., 25. 12. a 26. 12. připadají na víkend', () => {
  for (const d of ['2027-05-01', '2027-05-08', '2027-12-25', '2027-12-26']) {
    assert.ok(svatek(d), `${d} je svátek`);
    assert.ok(jeVikend(d), `${d} je víkend`);
  }
  const oVikendu = prehledRoku(ROK, rules).svatkyOVikendu.map((s) => s.datum);
  assert.deepEqual(oVikendu, ['2027-05-01', '2027-05-08', '2027-12-25', '2027-12-26']);
});

test('2027: blok 3.–6. 7. = 4 dny volna bez dovolené', () => {
  const blok = blokyVolna(ROK, rules).find((b) => b.svatky.some((s) => s.datum === '2027-07-05'));
  assert.deepEqual({ od: blok.od, do: blok.do, delka: blok.delka }, { od: '2027-07-03', do: '2027-07-06', delka: 4 });
  assert.deepEqual(blok.svatky.map((s) => s.datum), ['2027-07-05', '2027-07-06']);
  assert.equal(jeVolno('2027-07-07', rules), false);
});

test('2027: Velikonoce = blok 26.–29. 3. (4 dny)', () => {
  const blok = blokyVolna(ROK, rules).find((b) => b.svatky.some((s) => s.datum === '2027-03-26'));
  assert.deepEqual({ od: blok.od, do: blok.do, delka: blok.delka }, { od: '2027-03-26', do: '2027-03-29', delka: 4 });
});

test('2027: 24. 12. zavřeno od poledne, Velikonoční pondělí a 28. 9. celý den', () => {
  const zavreno = zavreneObchodyRoku(ROK, rules);
  const stedry = zavreno.find((z) => z.datum === '2027-12-24');
  assert.equal(stedry.zavreno, 'od-poledne');
  assert.equal(stedry.od, '12:00');
  assert.equal(svatek('2027-12-24').zavreno, 'od-poledne');
  assert.deepEqual(
    zavreno.filter((z) => z.zavreno === 'cely-den').map((z) => z.datum),
    ['2027-01-01', '2027-03-29', '2027-05-08', '2027-09-28', '2027-10-28', '2027-12-25', '2027-12-26'],
  );
  // Velký pátek, 1. 5., 5. 7., 6. 7. a 17. 11. obchody zavřené nemají
  for (const d of ['2027-03-26', '2027-05-01', '2027-07-05', '2027-07-06', '2027-11-17']) {
    assert.equal(svatek(d).zavreno, null, d);
  }
});

test('volné dny: víkendy + svátky v pracovní dny', () => {
  const volne = dnyVolnaVRoce(ROK, rules);
  const vikendu = volne.filter((d) => d.vikend).length;
  const p = prehledRoku(ROK, rules);
  assert.equal(vikendu, 104);
  assert.equal(p.svatkyVPracovniDen.length, 9);
  assert.equal(volne.length, 104 + 9);
  assert.equal(p.volnychDnu, 113);
  assert.equal(p.pracovnichDnu, 365 - 113);
});

test('1 den dovolené kolem svátku dá aspoň 4 dny volna', () => {
  const navrhy = nejlepsiNavrhy(ROK, 1, rules);
  assert.ok(navrhy.length >= 1);
  for (const n of navrhy) {
    assert.equal(n.pocetDovolene, 1);
    assert.equal(n.dovolena.length, 1);
    assert.ok(n.delka >= 4, `${n.od}–${n.do}: ${n.delka} dny`);
  }
  // Nejlepší: Velikonoce nebo červenec, 5 dnů za 1 den dovolené
  assert.equal(navrhy[0].delka, 5);
  assert.ok(navrhy.some((n) => n.od === '2027-07-02' && n.do === '2027-07-06'));
  assert.ok(navrhy.some((n) => n.od === '2027-09-25' && n.do === '2027-09-28' && n.dovolena[0] === '2027-09-27'));
});

test('návrhy: úsek je souvislý, maximální a dovolená padá na pracovní dny', () => {
  for (let pocet = 1; pocet <= rules.maxDnuDovolene; pocet++) {
    const navrhy = nejlepsiNavrhy(ROK, pocet, rules, { max: 20 });
    assert.ok(navrhy.length > 0);
    for (const n of navrhy) {
      const dny = dnyMezi(n.od, n.do);
      assert.equal(dny.length, n.delka);
      assert.ok(n.pocetDovolene >= 1 && n.pocetDovolene <= pocet);
      assert.deepEqual(n.dovolena, dny.filter((d) => !jeVolno(d, rules)));
      assert.ok(n.dovolena.every((d) => d.startsWith(`${ROK}-`)), 'dovolená jen v daném roce');
      assert.ok(n.svatky.some((s) => !jeVikend(s.datum)), 'obsahuje svátek v pracovní den');
      assert.equal(n.pomer, n.delka / n.pocetDovolene);
    }
    // seřazeno podle poměru
    for (let i = 1; i < navrhy.length; i++) assert.ok(navrhy[i - 1].pomer >= navrhy[i].pomer);
    // každý svátkový blok nejvýš jednou
    assert.equal(new Set(navrhy.map((n) => n.klic)).size, navrhy.length);
  }
});

test('víc dnů dovolené = delší nejlepší volno; max omezí počet návrhů', () => {
  const delky = [1, 2, 3, 4, 5].map((n) => nejlepsiNavrhy(ROK, n, rules, { max: 20 })
    .reduce((m, x) => Math.max(m, x.delka), 0));
  for (let i = 1; i < delky.length; i++) assert.ok(delky[i] > delky[i - 1], `${delky}`);
  assert.equal(nejlepsiNavrhy(ROK, 3, rules, { max: 2 }).length, 2);
  assert.equal(nejlepsiNavrhy(ROK, 3, rules).length, 5);
  // 3 dny po svátcích v červenci: sobota 3. 7. až neděle 11. 7. = 9 dnů
  assert.ok(nejlepsiNavrhy(ROK, 3, rules).some((n) => n.od === '2027-07-03' && n.do === '2027-07-11' && n.delka === 9));
});

test('neplatný počet dnů dovolené vyhodí chybu', () => {
  for (const n of [0, 6, 1.5, '2', NaN]) assert.throws(() => nejlepsiNavrhy(ROK, n, rules), RangeError);
});

test('volno smí přesáhnout do dalšího roku, dovolená ne', () => {
  const navrhy = nejlepsiNavrhy(ROK, 5, rules, { max: 20 });
  // 24. 12. 2027 (pátek) + 27.–31. 12. → do neděle 2. 1. 2028 = 10 dnů; nebo stejně dlouhé 17.–26. 12.
  const vanoce = navrhy.find((n) => n.klic === '2027-12-24');
  assert.equal(vanoce.delka, 10);
  assert.ok(vanoce.dovolena.every((d) => d.startsWith('2027-')));
});

test('žádné natvrdo zapsané datum ani rok 2027 ve volno.js', () => {
  const zdroj = readFileSync(new URL('../volno.js', import.meta.url), 'utf8');
  assert.doesNotMatch(zdroj, /2027/);
  assert.doesNotMatch(zdroj, /new Date\(\s*\)/);
  assert.doesNotMatch(zdroj, /Date\.now\(/);
});
