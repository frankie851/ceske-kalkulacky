// Vyhledávací index pro /hledat/: nástroje, jejich záložky (např. OSVČ 2027) a změny 2027.
// Položka: { id, nazev, perex, stitky, url, kategorie, typ, stav }.
// URL jsou bez pathPrefix; šablona je doplní filtrem sPrefixem.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { nactiNastroje } from '../_lib/nastroje.js';

const DATA = path.dirname(fileURLToPath(import.meta.url));

export default function () {
  const kategorie = JSON.parse(fs.readFileSync(path.join(DATA, 'kategorie.json'), 'utf8'));
  const nazevKat = Object.fromEntries(kategorie.map((k) => [k.slug, k.nazev]));
  const zmeny = JSON.parse(fs.readFileSync(path.join(DATA, 'zmeny2027.json'), 'utf8'));
  const index = [];
  for (const n of nactiNastroje()) {
    index.push({
      id: n.id, nazev: n.nazev, perex: n.perex, stitky: n.stitky || [],
      url: n.stav === 'aktivni' ? n.url : null, kategorie: nazevKat[n.kategorie] || '', typ: n.typ, stav: n.stav,
    });
    for (const z of n.zalozky || []) {
      index.push({
        id: z.id, nazev: z.nazev, perex: z.perex, stitky: z.stitky || [],
        url: n.stav === 'aktivni' ? z.url : null, kategorie: nazevKat[n.kategorie] || '', typ: z.typ || n.typ, stav: n.stav,
      });
    }
  }
  for (const z of zmeny) {
    index.push({
      id: `zmena-${z.id}`, nazev: z.titulek, perex: z.text, stitky: ['2027', 'změna'],
      url: `/co-se-meni-2027/#${z.id}`, kategorie: 'Co se mění v roce 2027', typ: 'změna 2027', stav: z.stav,
    });
  }
  return index;
}
