// Odkazy na bezplatnou dluhovou pomoc musí vést na existující oficiální stránky.
// Vznikl kvůli chybě: tlačítko „Najít bezplatnou poradnu“ vedlo na neexistující doménu
// iregistr.mpsv.cz. Test běží offline (síť se neověřuje), hlídá https, povolené oficiální
// domény a známé mrtvé domény. Při změně odkazu je potřeba stránku ověřit ručně a doplnit
// datum do src/_data/pomoc.json → overeno.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const cti = (cesta) => JSON.parse(readFileSync(new URL(cesta, import.meta.url)));
const pomoc = cti('../../src/_data/pomoc.json');
const dluhy = cti('../../src/nastroje/exekuce-nebo-oddluzeni/rules.json');

const POVOLENE = [/(^|\.)justice\.cz$/, /^mpsv\.gov\.cz$/, /^(www\.)?ceecr\.cz$/, /^(www\.)?ochrance\.cz$/, /^e-sbirka\.gov\.cz$/];
const MRTVE = ['iregistr.mpsv.cz'];
// Stránky, které existují, ale návštěvník na nich neuvidí obsah. sako.justice.cz se 5. 11. 2026
// zobrazovala prázdná: skripty se ze serveru nestáhly celé (ERR_CONTENT_LENGTH_MISMATCH),
// takže se seznam nevykreslil. Odkazujeme proto na průvodce insolvence.justice.cz. Až bude
// seznam zase fungovat (ověř: npm run kontrola:odkazy), lze doménu odsud odebrat.
const NEFUNKCNI = ['sako.justice.cz', 'vesta.justice.cz']; // vesta: stejná serverová chyba jako sako

const odkazy = [
  ...pomoc.odkazy.map((o) => ({ kde: 'src/_data/pomoc.json', ...o })),
  ...(dluhy.pomoc || []).map((o) => ({ kde: 'exekuce-nebo-oddluzeni/rules.json → pomoc', ...o })),
];

test('odkazy na bezplatnou pomoc existují a mají povinná pole', () => {
  assert.ok(pomoc.odkazy.length >= 1, 'pomoc.json musí mít aspoň jeden odkaz');
  assert.match(pomoc.overeno, /^\d{4}-\d{2}-\d{2}$/, 'pomoc.json → overeno musí být datum RRRR-MM-DD');
  for (const o of odkazy) {
    assert.ok(o.nazev && o.url, `${o.kde}: odkaz bez názvu nebo url`);
  }
});

test('odkazy na pomoc jsou https, z oficiálních domén a ne na známé mrtvé doméně', () => {
  for (const o of odkazy) {
    const u = new URL(o.url);
    assert.equal(u.protocol, 'https:', `${o.kde}: ${o.url} není https`);
    assert.ok(!MRTVE.includes(u.hostname), `${o.kde}: ${o.url} vede na neexistující doménu`);
    assert.ok(!NEFUNKCNI.includes(u.hostname), `${o.kde}: ${o.url} se návštěvníkům zobrazuje prázdná`);
    assert.ok(POVOLENE.some((re) => re.test(u.hostname)), `${o.kde}: ${u.hostname} není mezi povolenými oficiálními doménami`);
  }
});

test('hlavní odkaz na poradny je shodný na webu i ve skryté kalkulačce dluhů', () => {
  const registr = (seznam) => seznam.find((o) => /registr|poradn/i.test(o.nazev + ' ' + (o.popis || '')) && /mpsv/.test(o.url))?.url;
  const naWebu = registr(pomoc.odkazy);
  const vKalkulacce = registr(dluhy.pomoc || []);
  if (vKalkulacce) assert.equal(naWebu, vKalkulacce, 'odkaz na registr poraden se na webu a v kalkulačce liší');
});
