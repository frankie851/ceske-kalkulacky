// Vytáhne nálezy, verdikty a semafory ze zpráv <repo>.md do nalezy.json (pro SOUHRN.md a revize.html).
// Spuštění: node nalezy-export.mjs  (z libovolné složky)
import fs from 'node:fs';
import path from 'node:path';
const koren = new URL('../../', import.meta.url).pathname; // docs/revize/2026-11-05/
const APLIKACE = [
  ['P48','plan48','Plán48'],['PEN','penzijko-kompas','Penzijko kompas'],['EET','mam-eet','Mám EET? + OSVČ 2027'],
  ['SPOT','spot-nebo-fix','Spot, nebo fix?'],['BYD','bydlometr','Bydlometr'],['SLV','slevy-2027','Slevy 2027'],
  ['INF','inflacni-kalkulacka','Inflační kalkulačka'],['PRI','prijimacky-bez-paniky','Přijímačky bez paniky'],
  ['CES','cestovni-prikaz','Cestovní příkaz 2027'],['VYP','vypoved-2026','Výpověď 2026'],['ROD','rodicovska','Rodičovská pro celou rodinu'],
  ['DLU','kalkulator-dluhu','Dluhy – exekuce, nebo oddlužení?']];
const OBLASTI = ['1 Pravidla a data','2 Výpočty','3 Shoda se zadáním','4 Testy','5 Mobil a přístupnost','6 Texty a citlivá témata','7 Soukromí a bezpečnost','8 Nasazení a větve'];
const vystup = [];
for (const [kod, repo, nazev] of APLIKACE) {
  const f = path.join(koren, repo + '.md');
  const z = { kod, repo, nazev, zprava: fs.existsSync(f), verdikt: null, pocty: {}, semafor: {}, nalezy: [], hlavicka: '' };
  if (z.zprava) {
    const t = fs.readFileSync(f, 'utf8');
    z.hlavicka = (t.split('\n')[1] || '').trim();
    z.verdikt = (t.match(/^## Verdikt:\s*(.+)$/m) || [])[1]?.trim() || null;
    const p = t.match(/Nálezy:\s*Kritická\s*(\d+)\s*·\s*Vysoká\s*(\d+)\s*·\s*Střední\s*(\d+)\s*·\s*Nízká\s*(\d+)/);
    if (p) z.pocty = { kriticka: +p[1], vysoka: +p[2], stredni: +p[3], nizka: +p[4] };
    for (const o of OBLASTI) {
      const m = t.match(new RegExp('^\\|\\s*' + o.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\|\\s*([^|]*)\\|\\s*([^|]*)\\|', 'm'));
      if (m) z.semafor[o] = { stav: (m[1].match(/(🟢|🟡|🔴|⚪)/u) || ['?'])[0], nalez: m[2].trim() };
    }
    const re = /^### ([A-Z0-9]+-\d+)\s*·\s*([^·\n]+?)\s*·\s*([^·\n]+?)\s*·\s*(.+)$/gm;
    let m; const idx = [];
    while ((m = re.exec(t))) idx.push({ id: m[1], zavaznost: m[2].trim(), oblast: m[3].trim(), nazev: m[4].trim(), start: m.index, konec: 0 });
    idx.forEach((n, i) => { n.konec = i + 1 < idx.length ? idx[i + 1].start : (t.indexOf('\n## ', n.start) > 0 ? t.indexOf('\n## ', n.start) : t.length); });
    for (const n of idx) {
      const telo = t.slice(n.start, n.konec);
      const pole = k => (telo.match(new RegExp('\\*\\*' + k + ':\\*\\*\\s*([\\s\\S]*?)(?=\\n- \\*\\*|\\n###|\\n## |$)')) || [])[1]?.trim() || '';
      z.nalezy.push({ id: n.id, zavaznost: n.zavaznost, oblast: n.oblast, nazev: n.nazev, kde: pole('Kde'), reprodukce: pole('Reprodukce'), dopad: pole('Dopad na uživatele'), oprava: pole('Doporučená oprava'), overeni: pole('Ověření'), skeptik: (pole('Ověření').match(/skeptik:\s*([^\n(]+)/) || [])[1]?.trim() || '' });
    }
    const spoc = { kriticka: 0, vysoka: 0, stredni: 0, nizka: 0 };
    for (const n of z.nalezy) { const s = n.zavaznost.toLowerCase(); if (s.startsWith('krit')) spoc.kriticka++; else if (s.startsWith('vys')) spoc.vysoka++; else if (s.startsWith('stř') || s.startsWith('str')) spoc.stredni++; else if (s.startsWith('níz') || s.startsWith('niz')) spoc.nizka++; }
    z.spocitano = spoc;
    z.shodaPoctu = JSON.stringify(spoc) === JSON.stringify({ kriticka: z.pocty.kriticka ?? -1, vysoka: z.pocty.vysoka ?? -1, stredni: z.pocty.stredni ?? -1, nizka: z.pocty.nizka ?? -1 });
  }
  vystup.push(z);
}
fs.writeFileSync(path.join(koren, 'dukazy', 'nalezy.json'), JSON.stringify(vystup, null, 1));
for (const z of vystup) console.log(`${z.kod.padEnd(4)} ${z.zprava ? (z.verdikt || '?').padEnd(24) : 'bez zprávy'.padEnd(24)} K${z.spocitano?.kriticka ?? '-'} V${z.spocitano?.vysoka ?? '-'} S${z.spocitano?.stredni ?? '-'} N${z.spocitano?.nizka ?? '-'} ${z.zprava ? (z.shodaPoctu ? 'počty sedí' : 'POČTY NESEDÍ ' + JSON.stringify(z.pocty)) : ''}`);
