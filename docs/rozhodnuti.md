# Rozhodnutí a předpoklady (1. fáze: návrhy designu)

Zadání mi dovolilo pracovat samostatně. Tady jsou rozhodnutí, která jsem musel udělat sám,
a důvody k nim.

## Obsah a data

1. **Ukázková data jsou jen ze `docs/zadani.md`.** Plán48 ukazuje kontrolní příklad
   „penzijko 3 000 Kč + životní pojištění 2 500 Kč měsíčně → odpočet 15 600 + 30 000 = 45 600 Kč“.
   Z něj jsem prostou aritmetikou odvodil jen tato čísla:
   - daňová úspora 45 600 × 15 % = **6 840 Kč**,
   - nevyužitý odpočet 48 000 − 45 600 = **2 400 Kč**,
   - doporučení „Do 31. 12. vložte mimořádně 2 400 Kč na DIP“ (DIP se odečítá od první koruny),
   - státní příspěvek při vkladu 3 000 Kč = maximum **340 Kč** měsíčně, **4 080 Kč** ročně.
   Věk 35 let a sazba 15 % jsou převzaté z testů Penzijko kompasu („věk 35, vklad 3 000 Kč/měs →
   odpočet 15 600 Kč/rok“). Ukázka počítá s vklady po celý rok 2026.
2. **Graf projekce do 60 let je jen ilustrační.** Zadání žádný testovací příklad projekce nemá
   a výnosy by byly vymyšlené. Hlavní graf proto ukazuje složení limitu 48 000 Kč
   (15 600 / 30 000 / 2 400 Kč). Projekce je jen tvar křivky bez čísel na ose s popiskem
   „Náhled grafu, výpočet přijde v další fázi“.
3. **Mám EET?, výsledek:** testovací scénář „paušální daň 1. pásmo, příjmy 800 000 Kč → může
   zvolit EET OFF, přirážka 16 800 Kč/rok“ jsem spojil s krokem 2 (hotovost, QR u pultu
   a faktury převodem). Odůvodnění je podle pravidel ze zadání: kontaktní platby se evidují,
   faktury převodem ne.
4. **Termíny v kontrolním seznamu EET:** zadání uvádí jen MOJE EET od 1. 12. 2026 a start
   1. 1. 2027. U pokladního certifikátu, Daňové informační schránky plus a volby režimu je
   napsáno „termín ověříme“, žádné datum jsem nevymýšlel. Výjimka pro hotovostní tržby do
   300 000 Kč se nikde neuvádí (zadání to zakazuje). Kontrolní skript to hlídá.
5. **„Pravidla ověřena k 4. 11. 2026“** je datum dokumentu zadání („o 2. čtení jsem k 4. 11. 2026
   zprávu nenašel“). V prototypu jde o ukázku štítku. Skutečné ověření pravidel proběhne
   ve 2. fázi.
6. **Bezplatná dluhová pomoc:** zadání požaduje odkazy na „oficiální seznamy“, ale konkrétní URL
   neuvádí. Prototypy proto odkazují na `#pomoc` s poznámkou „Odkaz na oficiální seznam
   bezplatných poraden doplníme po ověření“. Ve 2. fázi je potřeba URL ověřit (zadání:
   „rozhoduje zákon a web justice.cz“).
7. **„Co se mění v roce 2027“** obsahuje jen fakta ze zadání se zdrojem: EET 2.0, Lepší
   penzijko (štítek návrhu), paušální daň 1. pásmo 9 662 Kč, sleva na studenta 4 020 Kč
   a školkovné, svátky 2027 (zadání: „vlastní výpočet z kalendáře“).
8. **Sdílený obsah vs. tón variant.** Zadání chce stejné texty a čísla ve všech variantách,
   ale zároveň odlišný tón. Řešení: `designs/_obsah/obsah.json` je závazný pro čísla,
   pravidla, štítky, upozornění a zdroje. Titulky a mikrotexty každá varianta přepsala svým
   tónem (A vyká věcně, B tyká konverzačně, C je stručná jako nástroj, D píše novinářsky).
9. **Pracovní název webu „Spočítáno“** používají všechny varianty, aby se daly porovnat.
   Další návrhy jsou v informační architektuře.

## Technika

10. **„Žádný JavaScript ani knihovny z CDN“ jsem vyložil přísně: prototypy nemají žádný JavaScript.**
    Všechno je čisté HTML a CSS, a proto fungují otevřené přímo z disku.
11. **Přepínač světlého a tmavého režimu bez JS:** tři rádiová tlačítka (Auto / Světlý / Tmavý)
    a selektor `:root:has(#t-dark:checked)`. Režim Auto se řídí `prefers-color-scheme`.
    Omezení: volba se nepamatuje mezi stránkami. Ve 2. fázi ji uloží malý skript
    do `localStorage`.
12. **Varianta C má výchozí tmavý režim**, jak zadání požaduje. Systémové nastavení světlého
    režimu ji proto nepřepne, světlý režim se zapíná přepínačem. Respektování
    `prefers-color-scheme` je u C vědomě omezené na tmavý režim. Je to rozhodnutí produktu,
    popsané v jejím `tokens.css`.
13. **Průvodce bez JS:** stránka `pruvodce.html` ukazuje 2. krok i výsledek jako dvě sekce.
    Ve 2. fázi z nich budou samostatné kroky (`/mam-eet/krok-2/`, `/mam-eet/vysledek/`).
14. **Chybový stav formuláře** je ukázaný staticky na jednom poli (`aria-invalid="true"`
    a hláška propojená přes `aria-describedby`).
15. **Vyhledávání** je `<form role="search">` s metodou GET. V prototypu vede na stránku
    kategorie. Ve 2. fázi se napojí na statický index (viz IA, kap. 8).
16. **Písma** jsou z Google Fonts a u všech jsem ověřil podmnožinu latin-ext (č, ř, ů, ě):
    Source Sans 3, Source Serif 4, Nunito, IBM Plex Sans, IBM Plex Mono, Fraunces,
    Newsreader a Inter.
17. **Kontroly:** Puppeteer a `@axe-core/puppeteer` z npm v `tools/kontroly/`
    (`node_modules` není v gitu, instalace `npm ci` nebo `npm i`). Puppeteer stáhl Chrome
    ze storage.googleapis.com. Když stažený Chrome chybí, skript použije předinstalovaný
    Chromium. Proměnná prostředí `PUPPETEER_EXECUTABLE_PATH` v cloudu ukazovala na
    neexistující soubor, proto ji skript v takovém případě ignoruje.
18. **Rozsah kontroly axe:** značky wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa a best-practice.
    Požadavek je 0 chyb s dopadem serious nebo critical, a to ve světlém i tmavém režimu
    (emulace `prefers-color-scheme`). Přetečení se měří na šířce 360 px jako
    `scrollWidth > clientWidth`. Povolené požadavky jsou jen `file:`, `data:`,
    fonts.googleapis.com a fonts.gstatic.com.
19. **Snímky** mají deviceScaleFactor 1 a zachycují celou stránku ve světlém režimu
    (u C v jejím výchozím tmavém). Hustota 1 drží velikost repozitáře rozumnou
    (32 PNG souborů).
20. **`designs/porovnani.html`** obsahuje snímky vložené jako WebP data URI (výřezy stránek),
    aby byla jedním samostatným souborem bez relativních odkazů, jak zadání chce.
    Zadání zakazuje „externí obrázky“, data URI externí nejsou.
21. **Varianty stavěli čtyři samostatní subagenti** se stejným zadáním obsahu
    (`designs/_obsah/obsah.json`, `designs/_obsah/pravidla-variant.md`), ale s odlišným
    směrem designu. Rozdíly od zadání, které udělali sami:
    - B tyká i v hlavní otázce („S čím ti můžeme pomoct?“), aby se tykání a vykání nemíchalo.
      U dluhů zůstal nadpis „Nejste v tom sami“.
    - A a B ukazují chybový stav pole Věk v samostatném označeném rámečku, aby hlavní
      formulář zůstal vyplněný.
    - D má místo plynulých velikostí písma (`vw`) pevné stupně podle zlomů, protože
      se plynulé velikosti na snímcích celé stránky vykreslovaly nespolehlivě.

## Výsledek kontrol (`node tools/kontroly/kontrola.mjs`)

- Prošlo 18 stránek: 4 varianty × 4 stránky, `designs/index.html` a `designs/porovnani.html`.
- Axe (WCAG 2.2 AA + best practice): **0 chyb serious/critical** ve světlém i tmavém režimu.
- Na šířce 360 px **nic nepřetéká**.
- **0 požadavků** na jiné domény než Google Fonts.
- Všechny povinné texty (čísla z obsah.json, štítky) a komponenty jsou na svém místě.
- Podrobnosti jsou v `designs/kontrola-vysledky.json`.
- Snímky: 32 PNG v `designs/screenshots/` (desktop 1440 px a mobil 390 px, každá stránka
  každé varianty).

## Jak to spustit znovu

```bash
npm ci                                      # od 2. fáze jsou závislosti v kořeni repozitáře
node tools/kontroly/kontrola.mjs            # kontroly všech stránek
node tools/kontroly/snimky.mjs --webp       # snímky + WebP výřezy pro porovnání
node tools/kontroly/rozcestnik.mjs          # designs/index.html z designs/_obsah/varianty.json
node tools/kontroly/porovnani.mjs           # designs/porovnani.html (jeden soubor s vloženými snímky)
```

## Výběr varianty

5. 11. 2026 byla vybrána **varianta B „Přátelský průvodce“**. Zadání 2. fáze je
v `docs/zadani-faze-2.md`. Sestavení webu je rozdělené do tří vln podle termínů a převezme
výpočty a testy z 12 existujících repozitářů aplikací.
