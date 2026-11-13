// Skripty v package.json a kroky CI nesmí mířit na neexistující testy ani skripty
// (další práce po revizi 5. 11. 2026: mrtvý skript test:e2e:skryte).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const KOREN = fileURLToPath(new URL('../../', import.meta.url));
const balik = JSON.parse(readFileSync(new URL('package.json', `file://${KOREN}`), 'utf8'));
const skripty = balik.scripts;

test('každý glob testů ve skriptech package.json najde aspoň jeden soubor', () => {
  for (const [nazev, prikaz] of Object.entries(skripty)) {
    for (const [, vzor] of prikaz.matchAll(/"([^"]+\.test\.m?js)"/g)) {
      assert.ok(globSync(vzor, { cwd: KOREN }).length > 0, `${nazev}: „${vzor}“ nenajde žádný test`);
    }
  }
});

test('skript test:e2e:skryte není, dokud není skrytý nástroj', () => {
  const nastroje = new URL('src/nastroje/', `file://${KOREN}`);
  const skryte = readdirSync(nastroje, { withFileTypes: true })
    .filter((d) => d.isDirectory() && existsSync(new URL(`${d.name}/nastroj.json`, nastroje)))
    .filter((d) => JSON.parse(readFileSync(new URL(`${d.name}/nastroj.json`, nastroje), 'utf8')).skryty);
  if (skryte.length === 0) assert.equal(skripty['test:e2e:skryte'], undefined);
});

test('kroky CI (web.yml) volají jen skripty, které v package.json jsou', () => {
  const yml = readFileSync(new URL('.github/workflows/web.yml', `file://${KOREN}`), 'utf8');
  const volane = [...yml.matchAll(/npm run ([\w:-]+)/g)].map((m) => m[1]);
  assert.ok(volane.length > 0);
  for (const s of volane) assert.ok(skripty[s], `web.yml volá npm run ${s}, ale skript neexistuje`);
});
