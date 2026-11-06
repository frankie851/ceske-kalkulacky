// Vypíše markdownovou tabulku 12 aplikací × 8 oblastí + verdikt + počty z dukazy/nalezy.json (pro SOUHRN.md).
import fs from 'node:fs';
const data = JSON.parse(fs.readFileSync(new URL('../nalezy.json', import.meta.url), 'utf8'));
const OBL = ['1 Pravidla a data','2 Výpočty','3 Shoda se zadáním','4 Testy','5 Mobil a přístupnost','6 Texty a citlivá témata','7 Soukromí a bezpečnost','8 Nasazení a větve'];
console.log('| Kód | Aplikace | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Verdikt | K | V | S | N |');
console.log('|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|');
const sum = { kriticka: 0, vysoka: 0, stredni: 0, nizka: 0 };
for (const a of data) {
  const s = a.spocitano || {}; for (const k in sum) sum[k] += s[k] || 0;
  console.log(`| ${a.kod} | ${a.nazev} (\`${a.repo}\`) | ${OBL.map(o => a.semafor?.[o]?.stav || '⚪').join(' | ')} | **${a.verdikt || '—'}** | ${s.kriticka ?? '–'} | ${s.vysoka ?? '–'} | ${s.stredni ?? '–'} | ${s.nizka ?? '–'} |`);
}
console.log(`| | **Celkem** | | | | | | | | | | **${sum.kriticka}** | **${sum.vysoka}** | **${sum.stredni}** | **${sum.nizka}** |`);
console.log('\n## Kritické a vysoké nálezy (po skeptikovi)\n');
for (const a of data) for (const n of a.nalezy) { const z = n.zavaznost.toLowerCase(); if (z.startsWith('krit') || z.startsWith('vys')) console.log(`- **${n.id}** · ${n.zavaznost} · ${a.nazev} · ${n.nazev} · skeptik: ${n.skeptik || '—'}`); }
