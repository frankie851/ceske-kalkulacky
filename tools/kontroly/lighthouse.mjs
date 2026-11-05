// Lighthouse (mobil) pro úvod a nástroje: výkon ≥ 90, přístupnost 100.
// Každá stránka se měří víckrát (LIGHTHOUSE_BEHY, výchozí 3) a proti limitům se porovnává
// MEDIÁN – jedno měření na sdíleném CI stroji kolísá o několik bodů (doporučení Lighthouse CI).
// Použití: npm run build && npm run lighthouse [-- stranka/ …]
import fs from 'node:fs';
import path from 'node:path';
import lighthouse from 'lighthouse';
import { spustitProhlizec } from './prohlizec.mjs';
import { spustitServer, KOREN } from './server.mjs';

const STRANKY = process.argv.slice(2).length ? process.argv.slice(2) : ['', 'penize/plan48/', 'penize/penzijko-kompas/', 'penize/inflacni-kalkulacka/', 'dane-podnikani/mam-eet/', 'dane-podnikani/mam-eet/osvc-2027/',
  'dane-podnikani/slevy-2027/', 'dane-podnikani/cestovni-prikaz-2027/', 'prace-rodina/vypoved-2026/', 'prace-rodina/prijimacky/',
  'prace-rodina/rodicovska/', 'prace-rodina/volno-2027/', 'bydleni-energie/bydlometr/', 'bydleni-energie/spot-nebo-fix/'];
const LIMITY = { performance: 0.9, accessibility: 1 };
const BEHY = Math.max(1, Number(process.env.LIGHTHOUSE_BEHY) || 3);
const KATEGORIE = ['performance', 'accessibility', 'best-practices', 'seo'];
const METRIKY = ['first-contentful-paint', 'largest-contentful-paint', 'total-blocking-time', 'cumulative-layout-shift', 'speed-index'];

const median = (cisla) => { const s = [...cisla].sort((a, b) => a - b); return s[Math.floor(s.length / 2)]; };

const { zaklad, zavrit } = await spustitServer({ prefix: process.env.PATH_PREFIX || '/' });
const browser = await spustitProhlizec();
const port = Number(new URL(browser.wsEndpoint()).port);
const vysledky = [];
let chyb = 0;
for (const s of STRANKY) {
  const behy = [];
  for (let i = 0; i < BEHY; i++) {
    const r = await lighthouse(zaklad + s, { port, output: 'json', logLevel: 'error', onlyCategories: KATEGORIE });
    behy.push({
      skore: Object.fromEntries(KATEGORIE.map((k) => [k, r.lhr.categories[k].score])),
      metriky: Object.fromEntries(METRIKY.map((m) => [m, r.lhr.audits[m]?.displayValue ?? null])),
      cls: r.lhr.audits['cumulative-layout-shift']?.numericValue ?? 0,
      posuny: (r.lhr.audits['layout-shifts']?.details?.items || []).slice(0, 4)
        .map((it) => `${(it.score ?? 0).toFixed(3)} ${it.node?.selector || '?'}`),
    });
  }
  const skore = Object.fromEntries(KATEGORIE.map((k) => [k, median(behy.map((b) => b.skore[k]))]));
  const spatne = Object.entries(LIMITY).filter(([k, lim]) => skore[k] < lim).map(([k]) => k);
  chyb += spatne.length;
  const pct = (x) => Math.round(x * 100);
  vysledky.push({
    stranka: '/' + s,
    median: Object.fromEntries(Object.entries(skore).map(([k, v]) => [k, pct(v)])),
    behy: behy.map((b) => ({ skore: Object.fromEntries(Object.entries(b.skore).map(([k, v]) => [k, pct(v)])), metriky: b.metriky })),
  });
  const vykonBehy = behy.map((b) => pct(b.skore.performance)).join('/');
  console.log(`${spatne.length ? '✗' : '✓'} /${s}  ${Object.entries(skore).map(([k, v]) => `${k} ${pct(v)}`).join(' · ')}  (výkon v bězích: ${vykonBehy})`);
  const clsMax = Math.max(...behy.map((b) => b.cls));
  if (clsMax > 0.05) {
    const b = behy.find((x) => x.cls === clsMax);
    console.log(`    CLS ${clsMax.toFixed(3)} – posouvá se: ${b.posuny.join(' | ') || 'neuvedeno'}`);
  }
  if (spatne.length) {
    const b = behy.find((x) => x.skore.performance === skore.performance) || behy[0];
    console.log(`    metriky běhu s mediánem: ${Object.entries(b.metriky).map(([k, v]) => `${k} ${v}`).join(' · ')}`);
  }
}
await browser.close();
await zavrit();
fs.mkdirSync(path.join(KOREN, 'docs/kontroly'), { recursive: true });
fs.writeFileSync(path.join(KOREN, 'docs/kontroly/lighthouse.json'), JSON.stringify({ datum: new Date().toISOString(), behu: BEHY, vysledky }, null, 2));
process.exit(chyb ? 1 : 0);
