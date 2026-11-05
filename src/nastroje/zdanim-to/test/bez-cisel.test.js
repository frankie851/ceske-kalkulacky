// Moduly nesmí obsahovat natvrdo zapsané částky, sazby ani limity – vše je v rules.json.
// Povolené číselné literály: 0, 1, 2 (indexy a čítače) a 100 (převod podílu na procenta, haléře).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const SLOZKA = new URL('../', import.meta.url);
const MODULY = fs.readdirSync(SLOZKA).filter((f) => f.endsWith('.js') && !f.endsWith('.11tydata.js'));
const POVOLENE = new Set(['0', '1', '2', '100']);

function cisla(zdroj) {
  const bezKomentaru = zdroj
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/(^|[^:])\/\/.*$/gm, '$1')
    .replace(/`(?:\\.|[^`\\])*`/g, (t) => t.replace(/\$\{[^}]*\}/g, (v) => ` ${v} `).replace(/[^$\s{}]+/g, ' '))
    .replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, "''")
    .replace(/\/(?:\\.|\[[^\]]*\]|[^/\n\\])+\/[gimsuy]*/g, '/r/');
  return [...bezKomentaru.matchAll(/(?<![\w$.])\d+(?:\.\d+)?(?![\w$])/g)].map((m) => m[0]);
}

for (const soubor of MODULY) {
  test(`${soubor}: žádné natvrdo zapsané částky ani sazby`, () => {
    const zdroj = fs.readFileSync(new URL(soubor, SLOZKA), 'utf8');
    const zakazane = cisla(zdroj).filter((c) => !POVOLENE.has(c));
    assert.deepEqual(zakazane, []);
  });
}
