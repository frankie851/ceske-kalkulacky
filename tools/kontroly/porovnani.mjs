// Sestaví designs/porovnani.html: jedna samostatná stránka, CSS inline, snímky jako WebP data URI.
// Předpoklad: node tools/kontroly/snimky.mjs --webp (vytvoří tools/kontroly/.webp/*.webp)
// Výstupy:
//   designs/porovnani.html                      – plný HTML dokument (funguje z disku)
//   <scratchpad>/porovnani-artefakt.html        – stejná stránka bez <!doctype>/<html>/<head>/<body> pro publikaci jako artefakt
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const WEBP = path.join(KOREN, 'tools/kontroly/.webp');
const varianty = JSON.parse(fs.readFileSync(path.join(KOREN, 'designs/_obsah/varianty.json'), 'utf8'));
const artefaktCesta = process.argv[2];

const OBRAZOVKY = [
  { id: 'index', nazev: 'Úvodní stránka', url: 'spocitano.cz' },
  { id: 'kalkulacka', nazev: 'Kalkulačka Plán48', url: 'spocitano.cz/penize/plan48/' },
  { id: 'pruvodce', nazev: 'Průvodce Mám EET?', url: 'spocitano.cz/dane-podnikani/mam-eet/' },
  { id: 'kategorie', nazev: 'Kategorie Peníze a investice', url: 'spocitano.cz/penize/' },
];
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const data = (v, o, z) => {
  const p = path.join(WEBP, `${v}-${o}-${z}.webp`);
  if (!fs.existsSync(p)) throw new Error(`chybí ${p} – spusť snimky.mjs --webp`);
  return `data:image/webp;base64,${fs.readFileSync(p).toString('base64')}`;
};

const tecky = `<svg class="dots" viewBox="0 0 40 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="4" fill="var(--dot1)"/><circle cx="20" cy="5" r="4" fill="var(--dot2)"/><circle cx="35" cy="5" r="4" fill="var(--dot3)"/></svg>`;

function sekce(o, i) {
  const sloupce = varianty.map((v) => `
      <article class="col" aria-labelledby="h-${o.id}-${v.slug}">
        <h3 id="h-${o.id}-${v.slug}"><span class="badge" style="--c:${v.barva}">${v.pismeno}</span> ${esc(v.nazev)}</h3>
        <figure class="desk">
          <div class="bar">${tecky}<span class="addr">${esc(o.url)}</span></div>
          <div class="screen" tabindex="0" role="region" aria-label="${esc(v.nazev)}, ${esc(o.nazev)}, desktop – posuvný náhled">
            <img src="${data(v.slug, o.id, 'desktop')}" alt="${esc(v.nazev)}: ${esc(o.nazev)} na desktopu (1440 px)" width="1440" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
          </div>
          <figcaption>Desktop 1440 px</figcaption>
        </figure>
        <figure class="phone">
          <div class="handset">
            <div class="notch" aria-hidden="true"></div>
            <div class="screen" tabindex="0" role="region" aria-label="${esc(v.nazev)}, ${esc(o.nazev)}, mobil – posuvný náhled">
              <img src="${data(v.slug, o.id, 'mobil')}" alt="${esc(v.nazev)}: ${esc(o.nazev)} na mobilu (390 px)" width="390" loading="${i === 0 ? 'eager' : 'lazy'}" decoding="async">
            </div>
          </div>
          <figcaption>Mobil 390 px</figcaption>
        </figure>
      </article>`).join('');
  return `
    <section class="screen-set" id="${o.id}" aria-labelledby="s-${o.id}">
      <div class="set-head">
        <h2 id="s-${o.id}">${esc(o.nazev)}</h2>
        <p>Náhledy uvnitř rámečků se dají posouvat. Výřez ukazuje horní část stránky.</p>
      </div>
      <div class="grid-scroll" tabindex="0" role="region" aria-label="${esc(o.nazev)} – čtyři varianty vedle sebe">
        <div class="grid">${sloupce}
        </div>
      </div>
    </section>`;
}

const karty = varianty.map((v) => `
      <li class="vcard" style="--c:${v.barva}">
        <p class="vletter" aria-hidden="true">${v.pismeno}</p>
        <h3>${esc(v.nazev)}</h3>
        <p>${esc(v.veta)}</p>
        <dl>
          <div><dt>Písmo</dt><dd>${esc(v.pismo)}</dd></div>
          <div><dt>Barvy</dt><dd>${esc(v.barvy)}</dd></div>
          <div><dt>Hustota</dt><dd>${esc(v.hustota)}</dd></div>
          <div><dt>Pro koho</dt><dd>${esc(v.pro_koho)}</dd></div>
        </dl>
      </li>`).join('');

const telo = `<title>Srovnání návrhů Spočítáno</title>
<meta name="claude:viewport-fit-sides" content="cover">
<meta name="description" content="Čtyři varianty designu webu českých kalkulaček vedle sebe na desktopu a mobilu.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap">
<style>
/* Rozvržení: kontaktní arch návrhů – čtyři sloupce variant, v každém desktop nad mobilem; sekce po obrazovkách */
:root {
  --bg: #F3F4F1; --surface: #FFFFFF; --fg: #1A1D1A; --muted: #4D554F; --line: #CDD3CC;
  --accent: #2F5D50; --frame: #262A27; --frame-fg: #E9ECE8; --addr: #3A3F3B;
  --dot1: #D9695F; --dot2: #D9AE4F; --dot3: #6BAF6B;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --body: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif;
  --col: 340px;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #141715; --surface: #1D211E; --fg: #E8ECE8; --muted: #AEB8B0; --line: #3A413C;
  --accent: #8CC7B4; --frame: #0B0D0C; --frame-fg: #D5DAD5; --addr: #2A2F2B; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #141715; --surface: #1D211E; --fg: #E8ECE8; --muted: #AEB8B0; --line: #3A413C;
  --accent: #8CC7B4; --frame: #0B0D0C; --frame-fg: #D5DAD5; --addr: #2A2F2B; color-scheme: dark }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 16px/1.55 var(--body); }
.wrap { max-width: 1480px; margin: 0 auto; padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 4px; }
.skip { position: absolute; left: -9999px; } .skip:focus { left: 16px; top: 16px; background: var(--surface); padding: 8px 12px; z-index: 5; }
header.top { padding-block: 40px 24px; border-bottom: 1px solid var(--line); }
.eyebrow { font-size: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
h1 { font-family: var(--display); font-weight: 800; font-size: clamp(32px, 5vw, 56px); line-height: 1.05; margin: 0 0 12px; text-wrap: balance; letter-spacing: -.01em; }
.lede { max-width: 68ch; margin: 0; color: var(--muted); font-size: 18px; }
nav.jump { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-top: 20px; }
nav.jump a { font-weight: 700; }
.vcards { list-style: none; padding: 0; margin: 28px 0 0; display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
.vcard { background: var(--surface); border: 1px solid var(--line); border-top: 6px solid var(--c); border-radius: 6px; padding: 16px 18px; }
.vletter { font-family: var(--display); font-weight: 800; font-size: 40px; line-height: 1; margin: 0; color: var(--fg); }
.vcard h3 { font-family: var(--display); font-size: 22px; margin: 6px 0 6px; }
.vcard p { margin: 0 0 10px; }
.vcard dl { margin: 0; display: grid; gap: 4px; font-size: 14px; }
.vcard dl div { display: grid; grid-template-columns: 76px 1fr; gap: 8px; }
.vcard dt { color: var(--muted); } .vcard dd { margin: 0; }
.screen-set { padding-block: 40px 8px; border-bottom: 1px solid var(--line); }
.set-head { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 20px; margin-bottom: 16px; }
.set-head h2 { font-family: var(--display); font-weight: 800; font-size: clamp(24px, 3vw, 34px); margin: 0; }
.set-head p { margin: 0; color: var(--muted); }
.grid-scroll { overflow-x: auto; padding-bottom: 12px; }
.grid { display: grid; grid-template-columns: repeat(4, minmax(var(--col), 1fr)); gap: 20px; min-width: calc(4 * var(--col) + 60px); }
.col h3 { font-family: var(--display); font-size: 18px; margin: 0 0 10px; display: flex; align-items: center; gap: 8px; }
.badge { display: inline-grid; place-items: center; width: 28px; height: 28px; border-radius: 50%; background: var(--c); color: #fff; font-size: 15px; }
figure { margin: 0; }
figcaption { font-size: 13px; color: var(--muted); margin-top: 6px; text-align: center; }
.desk { background: var(--frame); border-radius: 10px; padding: 0 6px 6px; box-shadow: 0 8px 24px rgb(0 0 0 / .12); }
.desk figcaption { color: var(--frame-fg); padding-bottom: 2px; }
.bar { display: flex; align-items: center; gap: 10px; height: 30px; padding: 0 6px; }
.dots { width: 34px; height: 9px; flex: none; }
.addr { flex: 1; min-width: 0; background: var(--addr); color: var(--frame-fg); border-radius: 5px; font-size: 12px; padding: 2px 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.desk .screen { height: 300px; overflow-y: auto; background: #fff; border-radius: 3px; }
.screen img { display: block; width: 100%; height: auto; max-width: 100%; }
.phone { margin-top: 18px; display: grid; justify-items: center; }
.handset { width: 214px; background: var(--frame); border-radius: 30px; padding: 12px 8px 14px; position: relative; box-shadow: 0 8px 24px rgb(0 0 0 / .14); }
.notch { width: 64px; height: 6px; border-radius: 3px; background: #444a46; margin: 0 auto 8px; }
.handset .screen { height: 400px; overflow-y: auto; border-radius: 16px; background: #fff; }
.note { padding-block: 32px 48px; color: var(--muted); max-width: 72ch; }
.note h2 { font-family: var(--display); color: var(--fg); font-size: 24px; margin: 0 0 8px; }
@media (max-width: 600px) { :root { --col: 280px; } .desk .screen { height: 240px; } }
@media (prefers-reduced-motion: reduce) { * { scroll-behavior: auto !important; } }
@media print { .grid-scroll { overflow: visible; } .desk .screen, .handset .screen { height: auto; overflow: visible; } }
</style>
<a class="skip" href="#index">Přeskočit na náhledy</a>
<header class="top"><div class="wrap">
  <p class="eyebrow">Spočítáno · návrh designu, 1. fáze</p>
  <h1>Čtyři varianty webu českých kalkulaček</h1>
  <p class="lede">Stejný obsah a stejná čísla ve čtyřech podobách: úvodní stránka, kalkulačka Plán48 (penzijko 3&nbsp;000&nbsp;Kč + životní pojištění 2&nbsp;500&nbsp;Kč měsíčně → odpočet 45&nbsp;600&nbsp;Kč) a průvodce Mám EET? (EET OFF za 16&nbsp;800&nbsp;Kč ročně). Prototypy zatím nepočítají naostro.</p>
  <nav class="jump" aria-label="Obrazovky">${OBRAZOVKY.map((o) => `<a href="#${o.id}">${esc(o.nazev)}</a>`).join('')}</nav>
  <ul class="vcards">${karty}
  </ul>
</div></header>
<main class="wrap">${OBRAZOVKY.map(sekce).join('')}
  <section class="note" aria-labelledby="pozn">
    <h2 id="pozn">Jak číst náhledy</h2>
    <p>Snímky jsou pořízené v Chromu ve světlém režimu systému; varianta C má výchozí tmavý režim. Všechny stránky prošly automatickou kontrolou přístupnosti (axe, WCAG 2.2 AA: 0 závažných chyb), přetečení na šířce 360&nbsp;px a externích požadavků. Nejde o investiční, daňové ani právní poradenství; pravidla v ukázce jsou ověřena k 4.&nbsp;11.&nbsp;2026.</p>
  </section>
</main>
`;

const hlava = '<!doctype html>\n<html lang="cs">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n';
const plny = hlava + telo.replace('</style>', '</style>\n</head>\n<body>') + '</body>\n</html>\n';

fs.writeFileSync(path.join(KOREN, 'designs/porovnani.html'), plny);
if (artefaktCesta) fs.writeFileSync(artefaktCesta, telo);
const mb = (fs.statSync(path.join(KOREN, 'designs/porovnani.html')).size / 1048576).toFixed(2);
console.log(`designs/porovnani.html: ${mb} MB${artefaktCesta ? `, artefakt: ${artefaktCesta}` : ''}`);
