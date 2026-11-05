// Volno 2027 a Výpověď 2026 mají každý vlastní výpočet svátků (Výpověď je převzatá z původní
// aplikace s pevným seznamem v kódu, Volno bere svátky z rules.json). Test hlídá, aby se
// nerozjely – při změně zákona o státních svátcích je nutné upravit oba nástroje.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { svatkyRoku } from '../../src/nastroje/volno-2027/volno.js';
import { svatky } from '../../src/nastroje/vypoved-2026/vypoved.js';

const rules = JSON.parse(readFileSync(new URL('../../src/nastroje/volno-2027/rules.json', import.meta.url), 'utf8'));

for (let rok = 2026; rok <= 2030; rok++) {
  test(`svátky ${rok}: Volno 2027 = Výpověď 2026`, () => {
    const volno = svatkyRoku(rok, rules).map((s) => s.datum).sort();
    const vypoved = [...svatky(rok)].sort();
    assert.deepEqual(volno, vypoved);
  });
}
