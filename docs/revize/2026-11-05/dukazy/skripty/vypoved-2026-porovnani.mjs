// Porovnání „můj výpočet vs. modul aplikace“ pro Výpověď 2026 (revize 5. 11. 2026).
// Referenční výpočet: ./vypoved-2026-prepocet.mjs (od nuly). Modul aplikace: /tmp/revize/repos/vypoved-2026/vypoved.js (jen čtení).
// Spuštění: node vypoved-2026-porovnani.mjs [cesta-k-repu]  → zapíše ../vypoved-2026/prepocet.txt (připojí nový běh).
import fs from 'node:fs';
import path from 'node:path';
import { PRIPADY, spocitejReferenci, konecPomeruRef, odstupneRef, podporaRef, terminyRef, rozloz } from './vypoved-2026-prepocet.mjs';

const repo = process.argv[2] || '/tmp/revize/repos/vypoved-2026';
const app = await import(path.join(repo, 'vypoved.js'));
const rules = JSON.parse(fs.readFileSync(path.join(repo, 'rules.json'), 'utf8'));
const vystup = new URL('../vypoved-2026/prepocet.txt', import.meta.url).pathname;

function modul(p) {
  try {
    switch (p.druh) {
      case 'konec': return app.konecPomeru(p.vstup, rules);
      case 'odstupne': { const r = app.odstupne({ kdo: p.vstup.kdo, duvod: p.vstup.duvod, zkusebniDoba: p.vstup.zkusebniDoba, delkaLet: p.vstup.delkaLet, prumernyHruby: p.vstup.prumer }, rules); return `${r.castka} (${r.nasobek}×) – „${r.duvod}“`; }
      case 'podpora': {
        const r = app.podpora({ vek: p.vstup.vek, cistyVydelek: p.vstup.cisty, datumZadosti: p.vstup.datumZadosti }, rules);
        let s = `${r.hlavni.podpurciDoba} měs.: ${r.hlavni.mesice.map((m) => m.castka + (m.omezenoStropem ? '*' : '')).join(',')} = ${r.hlavni.celkem}${r.hlavni.predbezne ? ' (předběžně)' : ''}${r.mimoRozsah ? ' (mimo rozsah)' : ''} [sada ${r.rok}]`;
        if (r.navrh) s += ` | návrh: ${r.navrh.mesice.map((m) => m.castka + (m.omezenoStropem ? '*' : '')).join(',')} = ${r.navrh.celkem}`;
        return s;
      }
      case 'terminy': { const s = app.kontrolniSeznam({ konec: p.vstup.konec }); return `ÚP ${s.find((u) => u.id === 'urad-prace').termin}, ZP ${s.find((u) => u.id === 'zdravotni-pojistovna').termin}`; }
      default: return '?';
    }
  } catch (e) { return 'chyba: ' + e.message; }
}

/** Strojové porovnání klíčových hodnot (ne textů). */
function shoda(p) {
  try {
    switch (p.druh) {
      case 'konec': {
        let ref; try { ref = konecPomeruRef(p.vstup).konec; } catch { ref = 'chyba'; }
        let m; try { m = app.konecPomeru(p.vstup, rules); } catch { m = 'chyba'; }
        if (p.id === 'V12') return m === ref ? 'shoda s novým pravidlem, ale doručení před 1. 6. 2025 aplikace nehlídá' : 'NE';
        return m === ref ? 'ano' : 'NE';
      }
      case 'odstupne': {
        let ref; try { ref = odstupneRef(p.vstup); } catch { ref = 'chyba'; }
        let m; try { m = app.odstupne({ kdo: p.vstup.kdo, duvod: p.vstup.duvod, zkusebniDoba: p.vstup.zkusebniDoba, delkaLet: p.vstup.delkaLet, prumernyHruby: p.vstup.prumer }, rules).castka; } catch { m = 'chyba'; }
        if (ref === 'chyba' || m === 'chyba') return ref === m ? 'ano (obě chyba)' : 'NE';
        if (ref.nahrada271ca) return m === ref.nahrada271ca ? 'částka ano, ale titul NE (náhrada § 271ca, ne odstupné)' : 'NE';
        return m === ref.odstupne ? 'ano' : `NE (ref ${ref.odstupne}, modul ${m})`;
      }
      case 'podpora': {
        let ref; try { ref = podporaRef(p.vstup); } catch { ref = 'chyba'; }
        let m; try { m = app.podpora({ vek: p.vstup.vek, cistyVydelek: p.vstup.cisty, datumZadosti: p.vstup.datumZadosti }, rules); } catch { m = 'chyba'; }
        if (ref === 'chyba' || m === 'chyba') return ref === m ? 'ano (obě chyba)' : 'NE';
        const hl = JSON.stringify(m.hlavni.mesice.map((x) => x.castka)) === JSON.stringify(ref.castky) && m.hlavni.podpurciDoba === ref.podpurciDoba;
        let nav = true;
        if (rozloz(p.vstup.datumZadosti).r >= 2027) { const rn = podporaRef({ ...p.vstup, varianta: 'navrh' }); nav = m.navrh && JSON.stringify(m.navrh.mesice.map((x) => x.castka)) === JSON.stringify(rn.castky); }
        const stropOzn = m.hlavni.mesice.every((x, i) => x.omezenoStropem === ref.mesice[i].omezeno);
        return hl && nav ? (stropOzn ? 'ano' : 'částky ano, označení stropu NE') : 'NE';
      }
      case 'terminy': {
        const ref = terminyRef(p.vstup.konec); const s = app.kontrolniSeznam({ konec: p.vstup.konec });
        const up = s.find((u) => u.id === 'urad-prace').termin === ref.uradPrace; const zp = s.find((u) => u.id === 'zdravotni-pojistovna').termin;
        return up ? (zp === ref.zdravotniPojistovnaOdDnePo ? 'ano' : zp === ref.zdravotniPojistovnaOdKonce ? 'ÚP ano, ZP = přísnější varianta' : 'ÚP ano, ZP NE') : 'NE (ÚP)';
      }
      default: return '?';
    }
  } catch (e) { return 'chyba porovnání: ' + e.message; }
}

const radky = [];
const h = (s) => { radky.push(s); console.log(s); };
h(`# Výpověď 2026 – můj výpočet vs. modul aplikace · ${new Date().toISOString()} · repo ${repo} · node ${process.version}`);
h(`# rules.json overeno=${rules.overeno}, strop 2026=${rules.podpora['2026'].strop}, strop 2027=${rules.podpora['2027'].strop} (predbezne=${rules.podpora['2027'].predbezne}), návrh strop=${rules.podpora['2027-navrh'].strop}`);
h('| ID | Typ | Případ | Vstup | Můj výpočet | Modul aplikace | Shoda |');
h('|---|---|---|---|---|---|---|');
let ano = 0, ne = 0;
for (const p of PRIPADY) {
  const s = shoda(p);
  if (s.startsWith('ano')) ano++; else ne++;
  h(`| ${p.id} | ${p.typ} | ${p.popis} | ${JSON.stringify(p.vstup)} | ${spocitejReferenci(p)} | ${modul(p)} | ${s} |`);
}
h(`# Shod: ${ano}, neshod/odchylek: ${ne} z ${PRIPADY.length}`);
fs.mkdirSync(path.dirname(vystup), { recursive: true });
fs.appendFileSync(vystup, radky.join('\n') + '\n\n');
console.log('zapsáno →', vystup);
