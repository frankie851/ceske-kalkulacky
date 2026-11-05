// Lighthouse (mobil) pro úvod a nástroje: výkon ≥ 90, přístupnost 100.
// Použití: npm run build && npm run lighthouse
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import { spustitProhlizec } from './prohlizec.mjs';
import { spustitServer, KOREN } from './server.mjs';

const STRANKY = process.argv.slice(2).length ? process.argv.slice(2) : ['', 'penize/plan48/', 'penize/penzijko-kompas/', 'penize/inflacni-kalkulacka/', 'dane-podnikani/mam-eet/', 'dane-podnikani/mam-eet/osvc-2027/',
  'dane-podnikani/slevy-2027/', 'dane-podnikani/cestovni-prikaz-2027/', 'prace-rodina/vypoved-2026/', 'prace-rodina/prijimacky/',
  'prace-rodina/rodicovska/', 'prace-rodina/volno-2027/'];
const LIMITY = { performance: 0.9, accessibility: 1 };

const { zaklad, zavrit } = await spustitServer({ prefix: process.env.PATH_PREFIX || '/' });
const browser = await spustitProhlizec();
const port = Number(new URL(browser.wsEndpoint()).port);
const vysledky = [];
let chyb = 0;
for (const s of STRANKY) {
  const r = await lighthouse(zaklad + s, { port, output: 'json', logLevel: 'error', onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'] });
  const skore = Object.fromEntries(Object.entries(r.lhr.categories).map(([k, v]) => [k, Math.round(v.score * 100)]));
  const spatne = Object.entries(LIMITY).filter(([k, lim]) => r.lhr.categories[k].score < lim).map(([k]) => k);
  chyb += spatne.length;
  vysledky.push({ stranka: '/' + s, skore });
  console.log(`${spatne.length ? '✗' : '✓'} /${s}  ${Object.entries(skore).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
}
await browser.close();
await zavrit();
fs.mkdirSync(path.join(KOREN, 'docs/kontroly'), { recursive: true });
fs.writeFileSync(path.join(KOREN, 'docs/kontroly/lighthouse.json'), JSON.stringify({ datum: new Date().toISOString(), vysledky }, null, 2));
process.exit(chyb ? 1 : 0);
