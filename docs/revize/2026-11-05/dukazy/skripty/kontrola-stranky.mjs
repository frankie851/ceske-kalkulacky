// Spuštění: node kontrola-stranky.mjs <repo> [cesta] – standardní kontrola úvodní stránky klonu.
import { kontrolaStranky } from './prohlizec-lib.mjs';
const [repo, cesta = ''] = process.argv.slice(2);
if (!repo) { console.error('použití: node kontrola-stranky.mjs <repo> [cesta]'); process.exit(1); }
const koren = `/tmp/revize/repos/${repo}`;
const vystup = new URL(`../${repo}/`, import.meta.url).pathname;
const v = await kontrolaStranky({ koren, cesta, vystup, nazev: 'uvod' });
for (const [k, z] of Object.entries(v.zobrazeni)) {
  console.log(`[${k}] přetéká: ${z.preteka.preteka} (${z.preteka.scrollWidth}/${z.preteka.innerWidth}) · cizí požadavky: ${z.ciziPozadavky.length} · konzole: ${z.konzole.length} · chyby: ${z.chyby.length}` + (z.axe ? ` · axe: ${z.axe.length} (serious/critical: ${z.axe.filter(a => ['serious','critical'].includes(a.dopad)).length}) · XSS img: ${z.xss.vlozenyImg} · dialogy: ${z.dialogy.length}` : ''));
  if (z.ciziPozadavky.length) console.log('  cizí:', [...new Set(z.ciziPozadavky.map(r => r.url))].join('\n        '));
  if (z.axe) z.axe.forEach(a => console.log(`  axe ${a.dopad}: ${a.id} ×${a.pocet} – ${a.popis}`));
  if (z.konzole.length) z.konzole.slice(0, 5).forEach(c => console.log('  konzole:', c.typ, c.text.slice(0, 160)));
  if (z.chyby.length) z.chyby.slice(0, 5).forEach(c => console.log('  chyba:', JSON.stringify(c)));
}
