// Sdílený načítač nástrojů (používají ho datové soubory nastroje.js a hledaniIndex.js).
// Všechny nástroje webu (aktivní i připravované) jako jedno pole.
// Aktivní: src/nastroje/<id>/nastroj.json + rules.json (meta = rules.meta, pravidla = celý rules.json).
// Připravované: src/_data/pripravujeme.json (stav "pripravujeme", bez odkazu).
// Pořadí: podle kategorie (pořadí v kategorie.json), pak podle "poradi".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '_data');
const NASTROJE = path.join(DATA, '..', 'nastroje');

const cti = (p) => JSON.parse(fs.readFileSync(p, 'utf8'));

export function nactiNastroje() {
  const kategorie = cti(path.join(DATA, 'kategorie.json')).map((k) => k.slug);
  const aktivni = [];
  if (fs.existsSync(NASTROJE)) {
    for (const slozka of fs.readdirSync(NASTROJE, { withFileTypes: true })) {
      if (!slozka.isDirectory()) continue;
      const soubor = path.join(NASTROJE, slozka.name, 'nastroj.json');
      if (!fs.existsSync(soubor)) continue;
      const nastroj = cti(soubor);
      const rulesSoubor = path.join(NASTROJE, slozka.name, 'rules.json');
      const pravidla = fs.existsSync(rulesSoubor) ? cti(rulesSoubor) : {};
      if (!pravidla.meta || !pravidla.meta.overeno) {
        throw new Error(`Nástroj ${nastroj.id}: rules.json musí mít meta.overeno (RRRR-MM-DD).`);
      }
      aktivni.push({
        ...nastroj,
        stav: 'aktivni',
        meta: { zdroje: [], neovereno: [], ...pravidla.meta },
        pravidla,
      });
    }
  }
  const idAktivnich = new Set(aktivni.map((n) => n.id));
  const pripravujeme = cti(path.join(DATA, 'pripravujeme.json'))
    .filter((n) => !idAktivnich.has(n.id))
    .map((n) => ({ ...n, stav: 'pripravujeme', meta: null, pravidla: null, souvisi: n.souvisi || [] }));

  return [...aktivni, ...pripravujeme].sort((a, b) =>
    kategorie.indexOf(a.kategorie) - kategorie.indexOf(b.kategorie) || (a.poradi ?? 99) - (b.poradi ?? 99));
}

