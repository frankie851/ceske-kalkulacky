// Sestaví designs/index.html (rozcestník variant) z designs/_obsah/varianty.json.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOREN = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const varianty = JSON.parse(fs.readFileSync(path.join(KOREN, 'designs/_obsah/varianty.json'), 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const STRANKY = [
  ['index.html', 'Úvodní stránka'],
  ['kategorie.html', 'Kategorie Peníze a investice'],
  ['kalkulacka.html', 'Kalkulačka Plán48'],
  ['pruvodce.html', 'Průvodce Mám EET?'],
  ['tokens.css', 'Design tokeny (tokens.css)'],
];

const bloky = varianty.map((v) => `
    <article class="variant" id="${v.slug}" style="--c:${v.barva}" aria-labelledby="t-${v.slug}">
      <div class="v-text">
        <p class="v-letter" aria-hidden="true">${v.pismeno}</p>
        <h2 id="t-${v.slug}">Varianta ${v.pismeno}: ${esc(v.nazev)}</h2>
        <p class="v-idea">${esc(v.myslenka)}</p>
        <div class="pc">
          <section aria-labelledby="pro-${v.slug}"><h3 id="pro-${v.slug}">Výhody</h3><ul>${v.vyhody.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
          <section aria-labelledby="proti-${v.slug}"><h3 id="proti-${v.slug}">Nevýhody</h3><ul>${v.nevyhody.map((x) => `<li>${esc(x)}</li>`).join('')}</ul></section>
        </div>
        <dl class="meta">
          <div><dt>Písmo</dt><dd>${esc(v.pismo)}</dd></div>
          <div><dt>Barvy</dt><dd>${esc(v.barvy)}</dd></div>
          <div><dt>Hustota</dt><dd>${esc(v.hustota)}</dd></div>
          <div><dt>Pro koho</dt><dd>${esc(v.pro_koho)}</dd></div>
        </dl>
        <nav aria-label="Stránky varianty ${v.pismeno}"><ul class="links">${STRANKY.map(([f, n]) => `<li><a href="${v.slug}/${f}">${n}</a></li>`).join('')}</ul></nav>
      </div>
      <figure class="v-shots">
        <a href="${v.slug}/index.html" class="shot-d"><img src="screenshots/${v.slug}-index-desktop.png" alt="Náhled úvodní stránky varianty ${v.pismeno} na desktopu" width="1440" loading="lazy"></a>
        <a href="${v.slug}/kalkulacka.html" class="shot-m"><img src="screenshots/${v.slug}-kalkulacka-mobil.png" alt="Náhled kalkulačky Plán48 varianty ${v.pismeno} na mobilu" width="390" loading="lazy"></a>
        <figcaption>Úvodní stránka (desktop) a kalkulačka (mobil). Další snímky jsou ve složce <code>screenshots/</code>.</figcaption>
      </figure>
    </article>`).join('');

const html = `<!doctype html>
<html lang="cs">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Návrhy designu Spočítáno</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,800&family=Atkinson+Hyperlegible:ital,wght@0,400;0,700;1,400&display=swap">
<style>
:root {
  --bg: #F3F4F1; --surface: #FFFFFF; --fg: #1A1D1A; --muted: #4D554F; --line: #CDD3CC; --accent: #2F5D50;
  --display: "Bricolage Grotesque", "Segoe UI", system-ui, sans-serif;
  --body: "Atkinson Hyperlegible", "Segoe UI", system-ui, sans-serif;
  color-scheme: light;
}
@media (prefers-color-scheme: dark) { :root { --bg: #141715; --surface: #1D211E; --fg: #E8ECE8; --muted: #AEB8B0; --line: #3A413C; --accent: #8CC7B4; color-scheme: dark; } }
* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--fg); font: 17px/1.55 var(--body); }
.wrap { max-width: 1280px; margin: 0 auto; padding: 0 16px; }
a { color: var(--accent); text-underline-offset: 3px; }
:focus-visible { outline: 3px solid var(--accent); outline-offset: 2px; border-radius: 3px; }
.skip { position: absolute; left: -9999px; } .skip:focus { left: 16px; top: 16px; background: var(--surface); padding: 8px 12px; }
header { padding: 40px 0 24px; border-bottom: 1px solid var(--line); }
.eyebrow { font-size: 14px; letter-spacing: .08em; text-transform: uppercase; color: var(--muted); margin: 0 0 8px; }
h1 { font-family: var(--display); font-weight: 800; font-size: clamp(32px, 5vw, 54px); line-height: 1.05; margin: 0 0 12px; text-wrap: balance; }
.lede { max-width: 70ch; color: var(--muted); margin: 0 0 10px; }
.toplinks { display: flex; flex-wrap: wrap; gap: 8px 20px; padding: 0; margin: 16px 0 0; list-style: none; font-weight: 700; }
.variant { display: grid; grid-template-columns: 1fr; gap: 24px; padding: 40px 0; border-bottom: 1px solid var(--line); }
@media (min-width: 960px) { .variant { grid-template-columns: minmax(0, 1fr) minmax(0, 1.1fr); gap: 40px; } }
.v-text { min-width: 0; }
.v-letter { font-family: var(--display); font-weight: 800; font-size: 56px; line-height: 1; margin: 0; color: var(--fg); border-left: 8px solid var(--c); padding-left: 12px; }
h2 { font-family: var(--display); font-size: clamp(24px, 3vw, 32px); margin: 12px 0 8px; }
h3 { font-size: 16px; margin: 0 0 6px; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
.v-idea { margin: 0 0 16px; max-width: 65ch; }
.pc { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 16px; }
.pc ul { margin: 0; padding-left: 20px; }
.meta { display: grid; gap: 4px; font-size: 15px; margin: 0 0 16px; }
.meta div { display: grid; grid-template-columns: 90px 1fr; gap: 8px; }
.meta dt { color: var(--muted); } .meta dd { margin: 0; }
.links { list-style: none; padding: 0; margin: 0; display: flex; flex-wrap: wrap; gap: 8px; }
.links a { display: inline-block; padding: 8px 12px; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); text-decoration: none; font-weight: 700; }
.links a:hover { border-color: var(--accent); }
.v-shots { margin: 0; display: grid; grid-template-columns: 1fr 140px; gap: 12px; align-items: start; min-width: 0; }
.v-shots a { display: block; border: 1px solid var(--line); border-radius: 6px; overflow: hidden; background: var(--surface); }
.shot-d { height: 420px; } .shot-m { height: 420px; }
.v-shots img { display: block; width: 100%; height: auto; }
.v-shots figcaption { grid-column: 1 / -1; font-size: 14px; color: var(--muted); }
@media (max-width: 520px) { .v-shots { grid-template-columns: 1fr; } .shot-m { display: none; } .shot-d { height: 240px; } }
footer { padding: 32px 0 48px; color: var(--muted); font-size: 15px; }
code { font-size: .9em; }
@media (prefers-reduced-motion: reduce) { * { transition: none !important; animation: none !important; } }
@media print { .v-shots { display: none; } a[href^="http"]::after { content: " (" attr(href) ")"; } }
</style>
</head>
<body>
<a class="skip" href="#obsah">Přeskočit na obsah</a>
<header><div class="wrap">
  <p class="eyebrow">Spočítáno · 1. fáze: návrhy designu</p>
  <h1>Čtyři varianty designu</h1>
  <p class="lede">Společný web českých kalkulaček a průvodců. Všechny varianty ukazují stejný obsah a čísla (z <code>designs/_obsah/obsah.json</code>): úvodní stránku, kategorii Peníze a investice, kalkulačku Plán48 a průvodce Mám EET?. Prototypy jsou čisté HTML a CSS bez JavaScriptu a zatím nepočítají naostro.</p>
  <ul class="toplinks">
    <li><a href="porovnani.html">Srovnání vedle sebe (desktop i mobil)</a></li>
    <li><a href="../docs/informacni-architektura.md">Informační architektura</a></li>
    <li><a href="../docs/rozhodnuti.md">Rozhodnutí a předpoklady</a></li>
    <li><a href="kontrola-vysledky.json">Výsledky kontrol</a></li>
  </ul>
</div></header>
<main id="obsah" class="wrap">${bloky}
</main>
<footer><div class="wrap">
  <p>Pravidla v ukázkách jsou ověřena k 4. 11. 2026. Nejde o investiční, daňové ani právní poradenství.</p>
</div></footer>
</body>
</html>
`;
fs.writeFileSync(path.join(KOREN, 'designs/index.html'), html);
console.log('designs/index.html hotovo');
