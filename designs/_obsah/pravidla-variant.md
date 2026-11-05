# Pravidla pro všechny varianty designu

Platí pro složky `designs/a-…` až `designs/d-…`. Kontroluje je `tools/kontroly/kontrola.mjs`.

## Soubory v každé složce
- `index.html` – úvodní stránka webu
- `kategorie.html` – kategorie **Peníze a investice** (4 nástroje: Plán48, Penzijko kompas, Zdaním to?, Inflační kalkulačka)
- `kalkulacka.html` – **Plán48** s vyplněnými ukázkovými daty
- `pruvodce.html` – **Mám EET?**: zobrazí **2. krok** dotazníku i **výsledek** (dvě sekce pod sebou nebo vedle sebe)
- `tokens.css` – design tokeny: barvy, písma, velikosti, mezery, zaoblení, stíny; světlý i tmavý režim
- volitelně `styles.css` (komponenty) – sdílený pro všechny 4 stránky varianty
- Odkazy mezi stránkami jsou relativní (`index.html`, `kategorie.html` …), takže vše funguje otevřené přímo z disku. Odkazy na nástroje, které v prototypu nejsou, vedou na `#`.

## Obsah
- Texty a čísla ber z `designs/_obsah/obsah.json`. **Čísla, pravidla, štítky, upozornění a zdroje neměň a nevymýšlej nové.** Titulky, perexy a mikrotexty smíš přepsat do tónu své varianty (vykání/tykání, délka vět), ale fakta musí zůstat stejná.
- Žádná vymyšlená čísla: graf projekce do 60 let je jen ilustrační tvar bez čísel na ose a s popiskem z `graf_projekce.poznamka`.
- Na každé stránce: štítek „Pravidla ověřena k 4. 11. 2026“ a upozornění „Nejde o … poradenství“.
- Úvodní stránka obsahuje sekci Dluhy s výrazným odkazem na **bezplatnou pomoc** (`dluhy_pomoc`), bez reklam a bez jakékoli nabídky půjček. Dluhy nikdy nestojí vedle propagace nebo affiliate.
- Bez log bank a značek, bez fotek lidí, bez státního znaku a bez stylu gov.cz/Portálu občana (tj. žádná kombinace státní modrá #2362A2 + bílá + lev, žádné „oficiální“ hlavičky).

## Povinné komponenty (každá varianta je musí ukázat; stačí na kterékoli ze 4 stránek, ale kalkulačka musí mít formulář, výsledek, graf, tabulku, zdroje a upozornění)
1. Hlavička s navigací (kategorie z `navigace`) a **vyhledáváním** (`<form role="search">` s `<label>` a `<input type="search">`, GET na `kategorie.html`)
2. Karta nástroje (na `index.html` a `kategorie.html`)
3. Formulář s nápovědou (`<label for>`, nápověda přes `aria-describedby`)
4. Karta výsledku – velké číslo + vysvětlení
5. Graf jako vložené `<svg>` s `role="img"` a `<title>`/`aria-label`, plus textová alternativa (tabulka nebo popis)
6. Tabulka (`<table>` s `<caption>` a `<th scope>`)
7. Štítek „Pravidla ověřena k 4. 11. 2026“
8. Štítek „Návrh, zatím neschváleno“ (u návrhu 2027)
9. Upozornění „Nejde o poradenství“
10. Seznam zdrojů (odkazy z `zdroje`)
11. Kontrolní seznam s termíny (`mam_eet.vysledek.kontrolni_seznam`)
12. Chybový stav formuláře: pole s `aria-invalid="true"`, chybová hláška propojená `aria-describedby`, ikona i text (nespoléhat jen na barvu)
13. Tiskový styl `@media print` (skrýt navigaci a přepínače, černý text na bílé, zobrazit URL odkazů `a[href^="http"]::after { content: " (" attr(href) ")" }`)

## Technika
- **Žádný JavaScript** (ani vlastní, ani z CDN), žádné externí obrázky, žádné měření návštěvnosti. Ikony, ilustrace a grafy jako vložené SVG.
- Jediné povolené externí zdroje: `fonts.googleapis.com` a `fonts.gstatic.com`. Písma načítej jedním `<link>` na `https://fonts.googleapis.com/css2?family=…&display=swap` (Google vrací i latin-ext). Pro jistotu `<link rel="preconnect">`.
- `<html lang="cs">`, `<meta charset="utf-8">`, `<meta name="viewport" content="width=device-width, initial-scale=1">`, unikátní `<title>`.
- **Mobile-first**: na 360 px žádný vodorovný posuvník (pozor na dlouhé tabulky – obal `overflow-x:auto` s `tabindex="0"` a `role="region"` + `aria-label`, nebo přeskládání; pozor na SVG bez `max-width:100%`, dlouhá slova, pevné šířky). Desktop 1440 px.
- **Světlý i tmavý režim**: tokeny v `:root`, tmavé hodnoty přes `@media (prefers-color-scheme: dark)` a přepínač bez JS – skupina tří rádiových tlačítek v hlavičce:
  ```html
  <fieldset class="theme-switch"><legend>Barevný režim</legend>
    <input type="radio" name="theme" id="t-auto" checked><label for="t-auto">Auto</label>
    <input type="radio" name="theme" id="t-light"><label for="t-light">Světlý</label>
    <input type="radio" name="theme" id="t-dark"><label for="t-dark">Tmavý</label>
  </fieldset>
  ```
  a v CSS `:root:has(#t-light:checked){…světlé tokeny…}` a `:root:has(#t-dark:checked){…tmavé tokeny…}`. Rádia musí být ovladatelná klávesnicí a mít viditelný fokus. (Volba se nepamatuje mezi stránkami – bez JS to nejde; je to známé omezení prototypu.)
  Aby kontrola mohla testovat tmavý režim, musí `@media (prefers-color-scheme: dark)` platit i v režimu Auto.
- **WCAG 2.2 AA**: kontrast textu ≥ 4,5:1 (velký text ≥ 3:1, ovládací prvky a grafické prvky ≥ 3:1) v obou režimech; viditelný `:focus-visible` (aspoň 2px obrys s dostatečným kontrastem); cílové plochy ≥ 24×24 px; skip link „Přeskočit na obsah“; jeden `<h1>`, logická hierarchie nadpisů; landmarky `header`, `nav` (s `aria-label`), `main`, `footer`; stav aktuální stránky `aria-current="page"`; `@media (prefers-reduced-motion: reduce)` vypne animace a přechody.
- Číslice: kde jsou částky v tabulkách, použij `font-variant-numeric: tabular-nums`. Mezery v tisících jako pevné mezery (`&nbsp;`) nebo úzké, aby se „45 600 Kč“ nezalomilo.
- Zkontroluj české znaky v nadpisech i textu: č ř ů ě ž š ý á í é ď ť ň Ž Č Ř.

## Kontrola
```bash
node tools/kontroly/kontrola.mjs designs/<tvoje-složka>
```
Musí vypsat 0 serious/critical chyb axe (světlý i tmavý režim), 0 přetečení na 360 px, 0 cizích požadavků a všechny povinné texty. Opravuj, dokud neprojde.
