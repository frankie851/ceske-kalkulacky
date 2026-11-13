// Společný model štítků stavu pravidel (13. 11. 2026).
// 1) Sdílený modul src/js/stav-pravidel.js: slovník, popisky, typ makra, HTML štítku.
// 2) Všechny datové JSON nástrojů (rules.json, tariffs.json, defaults.json…) a _data/zmeny2027.json:
//    každé pole `stav` (a `…Stav`) má hodnotu ze slovníku, staré klíče se nepoužívají a stavy
//    navrh / predbezne / odvozeno / neovereno mají vysvětlení (poznámku nebo zdroj).
// 3) Makro stitky.njk umí všechny typy, které modul vrací.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  STAVY, STAVY_S_VYSVETLENIM, jeStav, typStitku, popisekStavu, stavPravidla, stitekHtml, datumUcinnosti,
} from '../../src/js/stav-pravidel.js';

/** Datum z format.js má pevné mezery (U+00A0); v testu porovnáváme s obyčejnými. */
const m = (t) => t.replace(/\u00a0/g, ' ');

const KOREN = fileURLToPath(new URL('../../', import.meta.url));
const NASTROJE = join(KOREN, 'src/nastroje');

/** Staré klíče stavu, které se už nesmí objevit (nahradilo je pole `stav`). */
const STARE_KLICE = ['status', 'statusLegend', 'predbezne', 'jeNavrh', 'stitek', 'stavy', 'presny', 'pozn'];
/** Klíče, které se počítají jako vysvětlení stavu. */
const VYSVETLENI = ['poznamka', 'note', 'zdroj', 'zdroje', 'vysvetleni'];

function jsonSoubory(slozka) {
  const vysledek = [];
  for (const polozka of readdirSync(slozka)) {
    const cesta = join(slozka, polozka);
    if (statSync(cesta).isDirectory()) {
      if (['test', 'tests', 'scripts', 'node_modules'].includes(polozka)) continue;
      vysledek.push(...jsonSoubory(cesta));
    } else if (polozka.endsWith('.json') && polozka !== 'nastroj.json') {
      vysledek.push(cesta);
    }
  }
  return vysledek;
}

const SOUBORY = [...jsonSoubory(NASTROJE), join(KOREN, 'src/_data/zmeny2027.json')];

/** Projde JSON a pro každý objekt zavolá fn(objekt, cesta). */
function projdi(hodnota, fn, cesta = '') {
  if (Array.isArray(hodnota)) hodnota.forEach((v, i) => projdi(v, fn, `${cesta}[${i}]`));
  else if (hodnota && typeof hodnota === 'object') {
    fn(hodnota, cesta);
    for (const [k, v] of Object.entries(hodnota)) projdi(v, fn, cesta ? `${cesta}.${k}` : k);
  }
}

test('modul: slovník stavů a popisky štítků', () => {
  assert.deepEqual([...STAVY], ['plati', 'schvaleno', 'navrh', 'predbezne', 'odvozeno', 'nejasne', 'neovereno']);
  assert.deepEqual([...STAVY_S_VYSVETLENIM], ['navrh', 'predbezne', 'odvozeno', 'neovereno']);
  assert.equal(popisekStavu('plati'), 'Platí');
  assert.equal(popisekStavu('schvaleno'), 'Schváleno');
  assert.equal(m(popisekStavu('schvaleno', { platnostOd: '2027-01-01' })), 'Schváleno, platí od 1. 1. 2027');
  assert.equal(popisekStavu('navrh'), 'Návrh, zatím neschváleno');
  assert.equal(popisekStavu('predbezne'), 'Předběžně');
  assert.equal(popisekStavu('odvozeno'), 'Dopočteno ze zákona');
  assert.equal(popisekStavu('nejasne'), 'Nejasné');
  assert.equal(popisekStavu('neovereno'), 'Neověřeno');
  assert.ok(jeStav('navrh'));
  assert.ok(!jeStav('platne') && !jeStav('potvrzeno') && !jeStav('confirmed') && !jeStav('toString'));
  assert.throws(() => typStitku('platne'), /Neznámý stav/);
  for (const s of STAVY) assert.equal(typStitku(s), s, `typ makra pro ${s}`);
});

test('modul: stavPravidla vrací stav, popisek s datem účinnosti a vzhled', () => {
  const s = stavPravidla({ stav: 'schvaleno', platnostOd: '2027-01-01' });
  assert.deepEqual({ ...s, text: m(s.text) }, { stav: 'schvaleno', typ: 'schvaleno', text: 'Schváleno, platí od 1. 1. 2027', trida: 'badge-ok', ikona: 'ikona-overeno', platnostOd: '2027-01-01' });
  assert.equal(m(stavPravidla({ stav: 'schvaleno', ucinnost: '2027-01-01' }).text), 'Schváleno, platí od 1. 1. 2027');
  assert.equal(stavPravidla({ stav: 'navrh', platnostOd: '2027-01-01' }).text, 'Návrh, zatím neschváleno');
  assert.equal(datumUcinnosti({ ucinnostOd: '2026-10-01' }), '2026-10-01');
  assert.equal(datumUcinnosti(null), null);
  assert.throws(() => stavPravidla({}), /Neznámý stav/);
});

test('modul: stitekHtml má stejné třídy a ikony jako makro a escapuje text', () => {
  assert.equal(stitekHtml('navrh'), '<span class="badge badge-draft">Návrh, zatím neschváleno</span>');
  assert.equal(
    stitekHtml({ stav: 'predbezne' }, { sprite: '/img/sprite.svg', li: true, text: 'Strop <předběžně>' }),
    '<li class="badge badge-soon"><svg class="ikona" aria-hidden="true" focusable="false"><use href="/img/sprite.svg#ikona-hodiny"/></svg>Strop &lt;předběžně&gt;</li>',
  );
  assert.match(stitekHtml('nejasne', { trida: 'zt-stav' }), /^<span class="badge badge-draft zt-stav">Nejasné<\/span>$/);
  assert.throws(() => stitekHtml('potvrzeno'), /Neznámý stav/);
});

test('makro stitky.njk umí všechny typy stavů se stejnou třídou a ikonou jako modul', () => {
  const njk = readFileSync(join(KOREN, 'src/_includes/komponenty/stitky.njk'), 'utf8');
  for (const s of STAVY) {
    const { trida, ikona } = stavPravidla({ stav: s });
    const vetev = new RegExp(`typ == '${s}' -%}\\s*<\\{\\{ tag \\}\\} class="badge ${trida}">\\{\\{ ikona\\('${ikona}'\\) \\}\\}`);
    assert.match(njk, vetev, `makro: typ ${s}`);
  }
});

test('datové JSON nástrojů: soubory se našly', () => {
  const rel = SOUBORY.map((f) => relative(KOREN, f));
  for (const f of ['src/nastroje/plan48/rules.json', 'src/nastroje/spot-nebo-fix/tariffs.json', 'src/nastroje/bydlometr/defaults.json', 'src/_data/zmeny2027.json']) {
    assert.ok(rel.includes(f), f);
  }
});

for (const soubor of SOUBORY) {
  const nazev = relative(KOREN, soubor);
  test(`${nazev}: stav ze slovníku, žádné staré klíče, vysvětlení u nejistých stavů`, () => {
    const data = JSON.parse(readFileSync(soubor, 'utf8'));
    const chyby = [];
    projdi(data, (o, cesta) => {
      for (const [k, v] of Object.entries(o)) {
        if (STARE_KLICE.includes(k)) chyby.push(`${cesta}.${k}: starý klíč, použij pole „stav“`);
        if ((k === 'stav' || /Stav$/.test(k)) && typeof v === 'string' && !jeStav(v)) {
          chyby.push(`${cesta}.${k} = „${v}“ není ve slovníku (${STAVY.join(', ')})`);
        }
      }
      if (typeof o.stav === 'string' && STAVY_S_VYSVETLENIM.includes(o.stav) && !VYSVETLENI.some((k) => o[k])) {
        chyby.push(`${cesta}: stav „${o.stav}“ potřebuje vysvětlení (${VYSVETLENI.join(' / ')})`);
      }
    });
    assert.deepEqual(chyby, []);
  });
}

test('layout nástroje: meta.stav jde přes sdílený filtr stavStitek', () => {
  const layout = readFileSync(join(KOREN, 'src/_includes/layouty/nastroj.njk'), 'utf8');
  assert.match(layout, /stavStitek/);
  assert.doesNotMatch(layout, /meta\.stav == 'neovereno'/);
});
