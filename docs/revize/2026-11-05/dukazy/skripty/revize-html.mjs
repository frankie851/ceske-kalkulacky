// Vygeneruje docs/revize/2026-11-05/revize.html z dukazy/nalezy.json (spusť po nalezy-export.mjs).
import fs from 'node:fs';
import path from 'node:path';
const koren = new URL('../../', import.meta.url).pathname;
const data = JSON.parse(fs.readFileSync(path.join(koren, 'dukazy', 'nalezy.json'), 'utf8'));
const OBLASTI = ['1 Pravidla a data','2 Výpočty','3 Shoda se zadáním','4 Testy','5 Mobil a přístupnost','6 Texty a citlivá témata','7 Soukromí a bezpečnost','8 Nasazení a větve'];
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const md = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>').replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>').replace(/(https?:\/\/[^\s)]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g, '<br>');
const celk = { kriticka: 0, vysoka: 0, stredni: 0, nizka: 0 };
for (const a of data) for (const k of Object.keys(celk)) celk[k] += a.spocitano?.[k] ?? 0;
const verdikty = { 'Připraveno': 0, 'Opravit před sloučením': 0, 'Předělat': 0 };
for (const a of data) if (a.verdikt in verdikty) verdikty[a.verdikt]++;
const zav = z => { const s = (z || '').toLowerCase(); return s.startsWith('krit') ? 'K' : s.startsWith('vys') ? 'V' : (s.startsWith('stř') || s.startsWith('str')) ? 'S' : 'N'; };
const vClass = v => v === 'Připraveno' ? 'ok' : v === 'Předělat' ? 'bad' : v ? 'fix' : 'none';
const nalezyJson = JSON.stringify(data.map(a => ({ kod: a.kod, repo: a.repo, nazev: a.nazev, verdikt: a.verdikt, nalezy: a.nalezy.map(n => ({ ...n, z: zav(n.zavaznost) })) })));
const html = `<!DOCTYPE html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Nezávislá revize 12 kalkulaček – 5. 11. 2026</title>
<style>
:root{--bg:#f6f5f2;--card:#fff;--text:#1d1c1a;--muted:#5f5d58;--line:#dedcd6;--ok:#2e7d32;--fix:#a85a00;--bad:#c62828;--none:#616161;--k:#b71c1c;--v:#e65100;--s:#f9a825;--n:#607d8b;--accent:#1d5fae;--chip:#eceae4}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#15171a;--card:#1f2226;--text:#ecebe8;--muted:#a7a49d;--line:#33373d;--chip:#2a2e34;--accent:#7fb3ff;--s:#fdd835}}
:root[data-theme="dark"]{--bg:#15171a;--card:#1f2226;--text:#ecebe8;--muted:#a7a49d;--line:#33373d;--chip:#2a2e34;--accent:#7fb3ff;--s:#fdd835}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{max-width:1100px;margin:0 auto;padding:16px}
h1{font-size:1.5rem;margin:.2em 0}h2{font-size:1.2rem;margin:1.4em 0 .5em}
.sub{color:var(--muted)}
.karty{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin:14px 0}
.karta{background:var(--card);border:1px solid var(--line);border-radius:10px;padding:10px 12px}
.karta b{display:block;font-size:1.6rem}
.tabwrap{overflow-x:auto;-webkit-overflow-scrolling:touch;border:1px solid var(--line);border-radius:10px;background:var(--card)}
table{border-collapse:collapse;width:100%;min-width:720px;font-size:.9rem}
th,td{padding:6px 8px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top}
th{position:sticky;top:0;background:var(--card)}
td.sem{text-align:center;font-size:1.1rem}
.v{display:inline-block;padding:2px 8px;border-radius:999px;font-size:.8rem;color:#fff;white-space:nowrap}
.v.ok{background:var(--ok)}.v.fix{background:var(--fix)}.v.bad{background:var(--bad)}.v.none{background:var(--none)}
.z{display:inline-block;min-width:1.6em;text-align:center;padding:1px 6px;border-radius:6px;color:#fff;font-weight:600;font-size:.8rem}
.z.K{background:var(--k)}.z.V{background:var(--v)}.z.S{background:var(--s);color:#1d1c1a}
.dot{display:inline-block;width:16px;height:16px;border-radius:50%;vertical-align:middle;border:1px solid rgba(0,0,0,.25)}.dot.g{background:#2e7d32}.dot.y{background:#f9c40f}.dot.r{background:#d32f2f}.dot.w{background:#e0e0e0}.z.N{background:var(--n)}
.filtry{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0;align-items:center}
.filtry label{font-size:.9rem;color:var(--muted)}
select,input[type=search]{font:inherit;padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--card);color:var(--text);max-width:100%}
.chips{display:flex;flex-wrap:wrap;gap:6px}
.chip{border:1px solid var(--line);background:var(--chip);border-radius:999px;padding:3px 10px;cursor:pointer;font-size:.85rem;color:var(--text)}
.chip[aria-pressed="true"]{outline:2px solid var(--accent);outline-offset:1px}
details.n{background:var(--card);border:1px solid var(--line);border-radius:10px;margin:8px 0;padding:0}
details.n summary{cursor:pointer;padding:10px 12px;display:flex;gap:8px;align-items:baseline;flex-wrap:wrap}
details.n summary .id{font-family:ui-monospace,Menlo,Consolas,monospace;color:var(--muted)}
details.n .telo{padding:0 12px 12px;font-size:.93rem}
details.n .telo p{margin:.4em 0}
code{background:var(--chip);padding:1px 4px;border-radius:4px;font-size:.9em;word-break:break-word}
a{color:var(--accent)}
.pocet{color:var(--muted);font-size:.9rem;margin:6px 0}
button.theme{float:right;font:inherit;border:1px solid var(--line);background:var(--card);color:var(--text);border-radius:8px;padding:4px 10px;cursor:pointer}
:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
@media (max-width:600px){table{font-size:.82rem}th,td{padding:5px 6px}}
</style>
</head>
<body>
<main>
<button class="theme" id="theme" type="button" aria-pressed="false">Tmavý režim</button>
<h1>Nezávislá revize 12 kalkulaček</h1>
<p class="sub">Revize 5. 11. 2026 · revizor Claude Fable 5.1 (čisté sezení), skeptik Opus · zdroj: větev <code>revize/2026-11-05</code>, soubory <code>SOUHRN.md</code>, <code>pravidla.md</code> a zprávy <code>&lt;repo&gt;.md</code> v <code>docs/revize/2026-11-05/</code>. Verdikt <strong>Připraveno</strong> = 0 kritických a 0 vysokých nálezů; střední a nízké se opravují později.</p>
<div class="karty">
 <div class="karta"><span class="sub">Připraveno</span><b>${verdikty['Připraveno']}</b></div>
 <div class="karta"><span class="sub">Opravit před sloučením</span><b>${verdikty['Opravit před sloučením']}</b></div>
 <div class="karta"><span class="sub">Předělat</span><b>${verdikty['Předělat']}</b></div>
 <div class="karta"><span class="sub">Nálezy K / V / S / N</span><b>${celk.kriticka} / ${celk.vysoka} / ${celk.stredni} / ${celk.nizka}</b></div>
</div>

<h2>Semafor 12 aplikací × 8 oblastí</h2>
<p class="sub"><span class="dot g" role="img" aria-label="zelená"></span> nic nad Nízká · <span class="dot y" role="img" aria-label="žlutá"></span> nejvýš Střední · <span class="dot r" role="img" aria-label="červená"></span> Kritická nebo Vysoká · <span class="dot w" role="img" aria-label="bílá"></span> neověřeno. Kliknutím na kód aplikace vyfiltrujete její nálezy.</p>
<div class="tabwrap"><table>
<thead><tr><th>Aplikace</th>${OBLASTI.map(o => `<th title="${esc(o)}">${esc(o.split(' ')[0])}</th>`).join('')}<th>Verdikt</th><th>K</th><th>V</th><th>S</th><th>N</th></tr></thead>
<tbody>
${data.map(a => `<tr><td><a href="#nalezy" data-kod="${a.kod}" class="kodlink"><strong>${a.kod}</strong></a><br><span class="sub">${esc(a.nazev)}</span></td>${OBLASTI.map(o => { const s = a.semafor?.[o]?.stav || '⚪'; const c = s === '🟢' ? 'g' : s === '🟡' ? 'y' : s === '🔴' ? 'r' : 'w'; const nm = { g: 'zelená', y: 'žlutá', r: 'červená', w: 'neověřeno' }[c]; return `<td class="sem" title="${esc(o)}: ${nm}${a.semafor?.[o]?.nalez ? ' – ' + esc(a.semafor[o].nalez) : ''}"><span class="dot ${c}" role="img" aria-label="${nm}"></span></td>`; }).join('')}<td><span class="v ${vClass(a.verdikt)}">${esc(a.verdikt || 'bez zprávy')}</span></td><td>${a.spocitano?.kriticka ?? '–'}</td><td>${a.spocitano?.vysoka ?? '–'}</td><td>${a.spocitano?.stredni ?? '–'}</td><td>${a.spocitano?.nizka ?? '–'}</td></tr>`).join('\n')}
</tbody></table></div>
<p class="sub">Oblasti: ${OBLASTI.join(' · ')}.</p>

<h2 id="nalezy">Všechny nálezy</h2>
<div class="filtry">
 <label for="f-app">Aplikace</label><select id="f-app"><option value="">všechny</option>${data.map(a => `<option value="${a.kod}">${a.kod} – ${esc(a.nazev)}</option>`).join('')}</select>
 <label for="f-obl">Oblast</label><select id="f-obl"><option value="">všechny</option>${OBLASTI.map(o => `<option value="${o.slice(2)}">${esc(o)}</option>`).join('')}</select>
 <input type="search" id="f-text" placeholder="Hledat v nálezech…" aria-label="Hledat v nálezech">
</div>
<div class="chips" role="group" aria-label="Závažnost">
 <button class="chip" data-z="K" aria-pressed="true" type="button"><span class="z K">K</span> Kritická</button>
 <button class="chip" data-z="V" aria-pressed="true" type="button"><span class="z V">V</span> Vysoká</button>
 <button class="chip" data-z="S" aria-pressed="true" type="button"><span class="z S">S</span> Střední</button>
 <button class="chip" data-z="N" aria-pressed="true" type="button"><span class="z N">N</span> Nízká</button>
 <button class="chip" id="rozbal" type="button">Rozbalit vše</button>
</div>
<p class="pocet" id="pocet" aria-live="polite"></p>
<div id="seznam"></div>
</main>
<script>
const DATA = ${nalezyJson};
const esc = s => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const md = s => esc(s).replace(/\`([^\`]+)\`/g,'<code>$1</code>').replace(/\\*\\*([^*]+)\\*\\*/g,'<strong>$1</strong>').replace(/(https?:\\/\\/[^\\s)<]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\\n/g,'<br>');
const ZN = {K:'Kritická',V:'Vysoká',S:'Střední',N:'Nízká'};
const vse = [];
for (const a of DATA) for (const n of a.nalezy) vse.push({...n, kod:a.kod, app:a.nazev, repo:a.repo});
const poradi = {K:0,V:1,S:2,N:3};
vse.sort((x,y) => poradi[x.z]-poradi[y.z] || x.kod.localeCompare(y.kod) || x.id.localeCompare(y.id));
const st = { app:'', obl:'', text:'', z:new Set(['K','V','S','N']) };
const seznam = document.getElementById('seznam'), pocet = document.getElementById('pocet');
function vykresli(){
  const t = st.text.toLowerCase();
  const vyb = vse.filter(n => (!st.app || n.kod===st.app) && (!st.obl || (n.oblast||'').toLowerCase().includes(st.obl.toLowerCase().slice(0,6))) && st.z.has(n.z) && (!t || (n.id+' '+n.nazev+' '+n.kde+' '+n.reprodukce+' '+n.dopad+' '+n.oprava).toLowerCase().includes(t)));
  pocet.textContent = 'Zobrazeno ' + vyb.length + ' z ' + vse.length + ' nálezů.';
  seznam.innerHTML = vyb.map(n => '<details class="n"><summary><span class="z '+n.z+'">'+n.z+'</span> <span class="id">'+esc(n.id)+'</span> <strong>'+esc(n.nazev)+'</strong> <span class="sub">· '+esc(n.app)+' · '+esc(n.oblast)+(n.skeptik ? ' · skeptik: '+esc(n.skeptik) : '')+'</span></summary><div class="telo">'
    + '<p><strong>Kde:</strong> '+md(n.kde)+'</p><p><strong>Reprodukce:</strong> '+md(n.reprodukce)+'</p><p><strong>Dopad na uživatele:</strong> '+md(n.dopad)+'</p><p><strong>Doporučená oprava:</strong> '+md(n.oprava)+'</p><p><strong>Ověření:</strong> '+md(n.overeni)+'</p>'
    + '<p class="sub">Zpráva: <code>docs/revize/2026-11-05/'+esc(n.repo)+'.md</code> · opravný prompt: <code>opravy/'+esc(n.repo)+'.md</code></p></div></details>').join('');
}
document.getElementById('f-app').addEventListener('change', e => { st.app = e.target.value; vykresli(); });
document.getElementById('f-obl').addEventListener('change', e => { st.obl = e.target.value; vykresli(); });
document.getElementById('f-text').addEventListener('input', e => { st.text = e.target.value; vykresli(); });
document.querySelectorAll('.chip[data-z]').forEach(b => b.addEventListener('click', () => { const z=b.dataset.z; const on = b.getAttribute('aria-pressed')!=='true'; b.setAttribute('aria-pressed', on); on ? st.z.add(z) : st.z.delete(z); vykresli(); }));
document.querySelectorAll('.kodlink').forEach(a => a.addEventListener('click', () => { st.app = a.dataset.kod; document.getElementById('f-app').value = st.app; vykresli(); }));
document.getElementById('rozbal').addEventListener('click', () => { const d=[...seznam.querySelectorAll('details')]; const open = d.some(x=>!x.open); d.forEach(x=>x.open=open); });
const tb = document.getElementById('theme');
function nastavTema(t){ if (t) document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; const dark = (t||'') === 'dark' || (!t && matchMedia('(prefers-color-scheme: dark)').matches); tb.textContent = dark ? 'Světlý režim' : 'Tmavý režim'; tb.setAttribute('aria-pressed', dark); }
tb.addEventListener('click', () => { const dark = tb.getAttribute('aria-pressed')==='true'; const t = dark ? 'light' : 'dark'; nastavTema(t); try{localStorage.setItem('revize-tema',t);}catch(e){} });
let ulozene=null; try{ulozene=localStorage.getItem('revize-tema');}catch(e){}
nastavTema(ulozene);
vykresli();
</script>
</body>
</html>`;
fs.writeFileSync(path.join(koren, 'revize.html'), html);
// Varianta pro publikování jako artefakt (claude.ai skládá vlastní kostru dokumentu)
let art = html.replace(/^<!DOCTYPE html>\s*<html lang="cs">\s*<head>\s*<meta charset="utf-8">\s*<meta name="viewport"[^>]*>\s*/i, '')
  .replace('</head>\n<body>', '').replace(/<\/body>\s*<\/html>\s*$/, '')
  .replace('<title>Nezávislá revize 12 kalkulaček – 5. 11. 2026</title>', '<title>Nezávislá revize kalkulaček</title>\n<meta name="claude:viewport-fit-sides" content="cover">')
  .replace('main{max-width:1100px;margin:0 auto;padding:16px}', 'main{max-width:1100px;margin:0 auto;padding-block:16px;padding-left:max(16px, env(safe-area-inset-left, 0px));padding-right:max(16px, env(safe-area-inset-right, 0px))}')
  .replace('@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){', '@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){color-scheme:dark;')
  .replace(':root[data-theme="dark"]{', ':root[data-theme="dark"]{color-scheme:dark;');
const artDir = process.env.ARTEFAKT_DIR;
if (artDir) { fs.mkdirSync(artDir, { recursive: true }); fs.writeFileSync(path.join(artDir, 'revize-artefakt.html'), art); console.log('artefakt →', path.join(artDir, 'revize-artefakt.html'), (art.length/1024).toFixed(0), 'kB'); }
console.log('revize.html', (html.length / 1024).toFixed(0), 'kB,', data.reduce((s, a) => s + a.nalezy.length, 0), 'nálezů');
