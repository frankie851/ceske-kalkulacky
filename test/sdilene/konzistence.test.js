// Plán48 a Penzijko kompas mají každý vlastní výpočet státního příspěvku (převzato z původních
// aplikací s jinými konvencemi: vekDo inkluzivní/exkluzivní, maxZaklad/maxPrispevek, zaokrouhlení).
// Tento test hlídá, aby se jejich výsledky nerozjely – při změně zákona je nutné upravit oba rules.json.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as plan48 from '../../src/nastroje/plan48/calc.js';
import * as kompas from '../../src/nastroje/penzijko-kompas/calc.js';

const nacti = (id) => JSON.parse(readFileSync(new URL(`../../src/nastroje/${id}/rules.json`, import.meta.url)));
const pravidlaPlan48 = nacti('plan48');
const pravidlaKompas = nacti('penzijko-kompas');

const VEKY = Array.from({ length: 71 }, (_, i) => i);
const VKLADY = [0, 99, 100, 101, 150, 399, 400, 499, 500, 501, 777, 1000, 1001, 1234, 1699, 1700, 1701, 2000, 3000, 4250, 5700, 6000];

for (const sada of ['2026', 'navrh2027']) {
  test(`státní příspěvek: Plán48 = Penzijko kompas (sada ${sada})`, () => {
    const s48 = pravidlaPlan48.sady[sada];
    const sk = pravidlaKompas.sady[sada];
    assert.ok(s48 && sk, `sada ${sada} chybí v jednom z rules.json`);
    for (const vek of VEKY) {
      for (const vklad of VKLADY) {
        for (const duchod of [false, true]) {
          let a;
          try { a = plan48.statniPrispevekMesicni(vklad, vek, s48, { starobniDuchod: duchod }); }
          catch { a = 0; } // Plán48 hází výjimku, když pro věk neexistuje pásmo
          const b = Math.round(kompas.statniPrispevek(sk, { vek, vklad, duchodce: duchod }).mesicne);
          assert.equal(a, b, `věk ${vek}, vklad ${vklad}, důchod ${duchod}: Plán48 ${a} ≠ Kompas ${b}`);
        }
      }
    }
  });
}

test('odpočet: Plán48 a Penzijko kompas se shodnou pro samotné penzijko', () => {
  const s48 = pravidlaPlan48.sady['2026'];
  const sk = pravidlaKompas.sady['2026'];
  for (const vklad of [0, 1000, 1700, 1701, 3000, 5700, 8000]) {
    const a = plan48.odpocet({ dpsRocne: vklad * 12, dipRocne: 0, zpRocne: 0, starobniDuchod: false }, s48).vyuzity;
    const b = kompas.danovyOdpocet(sk, { vklad }).rocne;
    assert.equal(a, b, `vklad ${vklad}: Plán48 ${a} ≠ Kompas ${b}`);
  }
});
