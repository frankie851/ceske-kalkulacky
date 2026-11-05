import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skladanyPruh, caroveGrafy, sloupcovyGraf, tabulkaDat, hezkeDeleni, esc } from '../../src/js/graf.js';
import { kc, NBSP } from '../../src/js/format.js';

const bezBarev = (svg) => {
  assert.ok(!/#[0-9a-f]{3,8}\b/i.test(svg), 'žádné barevné literály');
  assert.ok(!/\bstyle=/.test(svg), 'žádné inline styly (CSP)');
  assert.ok(!/rgb\(|hsl\(/.test(svg));
};

test('hezkeDeleni: kroky 1-2-5', () => {
  const d = hezkeDeleni(0, 45600);
  assert.equal(d.min, 0);
  assert.equal(d.krok, 10000);
  assert.equal(d.max, 50000);
  assert.deepEqual(d.znacky, [0, 10000, 20000, 30000, 40000, 50000]);
  assert.equal(hezkeDeleni(0, 7).krok, 2);
  assert.equal(hezkeDeleni(0, 0.9).krok, 0.2);
  assert.deepEqual(hezkeDeleni(0, 0.9).znacky, [0, 0.2, 0.4, 0.6, 0.8, 1]);
  const z = hezkeDeleni(-30, 80);
  assert.ok(z.min <= -30 && z.max >= 80);
  assert.ok([1, 2, 5].includes(z.krok / 10 ** Math.floor(Math.log10(z.krok))));
  assert.deepEqual(hezkeDeleni(5, 5).min, 0);
  assert.deepEqual(hezkeDeleni(0, 0).znacky.length > 1, true);
});

test('skladanyPruh: limit 48 000 Kč s volným místem', () => {
  const html = skladanyPruh({
    titulek: 'Jak máš využitý limit 48 000 Kč',
    polozky: [
      { nazev: 'Penzijko (DPS)', hodnota: 15600, trida: 'graf-rada-1' },
      { nazev: 'Životní pojištění', hodnota: 30000, trida: 'graf-rada-2' },
    ],
    limit: 48000,
    id: 'limit',
  });
  assert.match(html, /^<figure class="graf graf-pruh graf-pruh-volno">/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-labelledby="limit-t limit-d"/);
  assert.match(html, /<title id="limit-t">Jak máš využitý limit 48 000 Kč<\/title>/);
  assert.match(html, /<desc id="limit-d">[^<]*Penzijko \(DPS\) 15.600.Kč/);
  assert.ok(html.includes(`volné místo ${kc(2400)}`));
  assert.ok(html.includes(`Dohromady ${kc(45600)} z ${kc(48000)}.`));
  assert.match(html, /class="graf-volno"/);
  assert.match(html, /<ul class="graf-legenda">/);
  assert.match(html, /graf-vzorek graf-rada-2/);
  bezBarev(html);
});

test('skladanyPruh: bez limitu a s neplatnou třídou', () => {
  const html = skladanyPruh({ titulek: 'T', polozky: [{ nazev: 'A', hodnota: 10, trida: 'evil" onload="x' }, { nazev: 'B', hodnota: 5 }] });
  assert.ok(!html.includes('onload'));
  assert.match(html, /graf-rada-1/);
  assert.match(html, /graf-rada-2/);
  assert.ok(!html.includes('graf-volno'));
  assert.ok(!html.includes('Dohromady'));
});

test('caroveGrafy: osy, mřížka, legenda, přístupnost', () => {
  const html = caroveGrafy({
    titulek: 'Projekce úspor',
    popis: 'Úspory rostou.',
    rady: [
      { nazev: 'S penzijkem', body: [{ x: 35, y: 0 }, { x: 45, y: 210000 }, { x: 60, y: 512345 }], vyplnena: true, zvyraznena: true },
      { nazev: 'Bez penzijka', body: [{ x: 35, y: 0 }, { x: 60, y: 300000 }], carkovana: true, trida: 'graf-rada-3' },
    ],
    osaX: { popisek: 'věk', format: (n) => `${n} let` },
    osaY: { popisek: 'Kč', format: (n) => kc(n) },
    id: 'proj',
  });
  assert.match(html, /viewBox="0 0 640 320"/);
  assert.match(html, /role="img"/);
  assert.match(html, /<title id="proj-t">Projekce úspor<\/title>/);
  assert.match(html, /<desc id="proj-d">Úspory rostou.<\/desc>/);
  assert.match(html, /class="graf-mrizka"/);
  assert.match(html, /class="graf-osa"/);
  assert.match(html, /class="graf-popisek-osy"[^>]*>věk</);
  assert.ok(html.includes(kc(600000)), 'horní značka osy Y je hezké číslo 600 000');
  assert.ok(html.includes('35 let') && html.includes('60 let'));
  assert.match(html, /graf-cara graf-zvyraznena/);
  assert.match(html, /graf-cara graf-carkovana/);
  assert.match(html, /class="graf-plocha"/);
  assert.match(html, /graf-vzorek graf-rada-3 graf-vzorek-cara graf-vzorek-carkovana/);
  bezBarev(html);
});

test('caroveGrafy: automatický popis a escapování textu', () => {
  const html = caroveGrafy({ titulek: '<script>alert(1)</script>', rady: [{ nazev: 'A & B', body: [{ x: 1, y: 2 }, { x: 2, y: 4 }] }] });
  assert.ok(!html.includes('<script>'));
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(html.includes('A &amp; B: od 2 (1) do 4 (2).'));
});

test('caroveGrafy: prázdná data nespadnou', () => {
  const html = caroveGrafy({ titulek: 'Prázdný', rady: [] });
  assert.match(html, /<svg/);
});

test('sloupcovyGraf: sloupce s hodnotami', () => {
  const html = sloupcovyGraf({ titulek: 'Náklady', polozky: [{ nazev: 'EET OFF', hodnota: 16800 }, { nazev: 'MOJE EET', hodnota: 0 }], osaY: { format: kc } });
  assert.equal((html.match(/class="graf-sloupec"/g) || []).length, 2);
  assert.ok(html.includes(kc(16800)));
  bezBarev(html);
});

test('tabulkaDat: caption, záhlaví a formát čísel', () => {
  const html = tabulkaDat({ caption: 'Kontrolní příklady', sloupce: ['Vklady', 'Odpočet'], radky: [['Penzijko 3 000 Kč', 45600], ['DIP <b>', 48000]], stack: true });
  assert.match(html, /role="region"/);
  assert.match(html, /tabindex="0"/);
  assert.match(html, /<caption>Kontrolní příklady<\/caption>/);
  assert.match(html, /<th scope="col">Vklady<\/th><th scope="col" class="r">Odpočet<\/th>/);
  assert.match(html, /<th scope="row">Penzijko 3 000 Kč<\/th>/);
  assert.ok(html.includes(`45${NBSP}600`));
  assert.ok(html.includes('DIP &lt;b&gt;'));
  assert.match(html, /data-label="Odpočet"/);
  assert.match(html, /class="stack-table"/);
});

test('esc', () => {
  assert.equal(esc(`<a href="x">'&'</a>`), '&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;');
  assert.equal(esc(null), '');
});
