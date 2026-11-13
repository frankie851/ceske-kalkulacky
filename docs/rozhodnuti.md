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

# 2. fáze – vlna 1 (5. 11. 2026)

## Rozhodnutí

1. **Nástroje jsou převzaté, ne přepsané.** Výpočetní moduly (`calc.js`, `rules.js`, `osvc.js`)
   a původní testy jsou zkopírované beze změny do `src/nastroje/<id>/`. Testy leží
   v `src/nastroje/<id>/test/`, takže jejich relativní cesty (`../calc.js`, `../rules.json`)
   fungují bez úprav. Změnilo se jen rozhraní.
2. **`rules.json` dostal jednotný obal `meta`** (`overeno`, `zdroje`, `neovereno`). Ostatní
   klíče zůstaly. U Mám EET? je výjimka pro malé hotovostní tržby popsaná bez částky, protože
   integritní test zakazuje text „300 000“.
3. **Ukázkový výsledek bez JavaScriptu** se počítá při buildu (`<id>.11tydata.js`) stejným
   modulem jako v prohlížeči. Výstup skládají sdílené moduly bez DOM (`plan48/vystup.js`,
   `penzijko-kompas/zobrazeni.js`, `mam-eet/vystup.js`), takže stránka bez JS a s JS vypadá
   stejně. Kontrola webu to ověřuje přes `[data-ukazka]`.
4. **Plán48 a Penzijko kompas mají dál každý vlastní výpočet státního příspěvku.** Liší se
   konvencemi (`vekDo` inkluzivní/exkluzivní, `maxZaklad`/`maxPrispevek`, zaokrouhlení).
   Sloučení by znamenalo změnit převzaté a otestované moduly. Proto
   `test/sdilene/konzistence.test.js` porovnává oba výpočty v mřížce věk 0–70 × 22 vkladů
   × důchodce ano/ne pro obě sady pravidel a hlídá i odpočet.
5. **Penzijko kompas počítá s koncem transformovaných fondů 31. 12. 2036 i u pravidel 2026**,
   stejně jako původní `calc.js`. Podle zadání je to součást návrhu 2027, proto je to na
   stránce označené jako návrh. K rozhodnutí ve vlně 2: má projekce s pravidly 2026
   transformovaný fond neukončit?
   **Rozhodnuto 12. 11. 2026** (revize PEN-01): s pravidly 2026 transformovaný fond nekončí,
   konec 2036 platí jen v sadě „Návrh 2027“. Viz „Opravy podle revize 5. 11. 2026“.
6. **Texty jsou rodově neutrální.** „Jsem zaměstnanec“ → „Mám zaměstnání“. V Mám EET? se
   tvary jako „Ty jsi zadal“ přepsaly na „Zadáno:“. Čísla ani zdroje se neměnily. Sekce
   Dluhy vyká.
7. **Tmavý režim** používá CSS `light-dark()`. Každá barva je definovaná jednou a mění se
   jen `color-scheme` (systémové nastavení, `data-theme` z přepínače a fallback přes `:has`
   bez JS). Potřebuje prohlížeč z roku 2024 nebo novější (Safari 17.5+). Volbu režimu si web
   pamatuje v `localStorage` a je to jediná věc, kterou ukládá.
8. **CSP v `<meta>`:** `script-src 'self'` a hash jediného inline skriptu (nastavení režimu
   před vykreslením). Pravidla jsou vložená jako `<script type="application/json">`
   a nespouštějí se. Žádné cizí domény. Písma Nunito a Fredoka se hostují na webu
   (`@fontsource`, jen latin a latin-ext).
9. **Grafy jsou vlastní SVG** (`src/js/graf.js`): skládaný pruh, čárový a sloupcový graf,
   každý s tabulkou jako textovou alternativou. Chart.js z CDN je pryč.
10. **Formulář na desktopu nelepí.** Lepicí sloupec u dlouhých formulářů schovával tlačítko.
    Na mobilu ukazuje hlavní číslo lepivá lišta s odkazem na výsledek.
11. **Záložky sourozeneckých nástrojů** (Plán48 | Penzijko kompas, Mám EET? | OSVČ 2027) jsou
    samostatné stránky, ne přepínání přes `#hash`. OSVČ 2027 je na
    `/dane-podnikani/mam-eet/osvc-2027/`.
12. **Data obsahují 14 nástrojů:** 12 existujících a 2 nové (Zdaním to?, Volno 2027).
    3 jsou aktivní, ostatní mají kartu „Připravujeme“ bez odkazu.

## Bezplatná dluhová pomoc

| Odkaz | Provozovatel | Stav ověření |
| --- | --- | --- |
| https://mpsv.gov.cz/registr-poskytovatelu-sluzeb – registr poskytovatelů sociálních služeb (odborné sociální poradenství) | MPSV | Ověřeno přímým otevřením 5. 11. 2026, titulek „Registr poskytovatelů sociálních služeb \| MPSV“. Původně uvedená adresa `iregistr.mpsv.cz` neexistuje (doména nemá DNS záznam) a odkaz na webu nefungoval. Opraveno, hlídá to `test/sdilene/pomoc.test.js`. |
| https://insolvence.justice.cz/jak-vstoupit-do-oddluzeni/ – oficiální průvodce „Jak vstoupit do oddlužení“ (služba zdarma od neziskové organizace, varování před oddlužovacími šmejdy) | Ministerstvo spravedlnosti | Ověřeno vykreslením v prohlížeči 5. 11. 2026. Nahrazuje https://sako.justice.cz/ (seznam akreditovaných osob): ten vrací 200 i titulek, ale skripty se ze serveru nestáhnou celé (`ERR_CONTENT_LENGTH_MISMATCH`), takže se seznam nevykreslí a návštěvník vidí prázdnou stránku. Stejně je na tom vesta.justice.cz (placené služby), kterou jsme z bloku pomoci kalkulačky dluhů odebrali. |

Přímým otevřením bylo 5. 11. 2026 ověřeno i všech 8 odkazů skryté kalkulačky Exekuce, nebo
oddlužení? (`rules.json` → `pomoc` a další kroky). Všechny vrací 200 s odpovídajícím titulkem:
www.ceecr.cz, isir.justice.cz, exekuce.justice.cz/vypocet-srazek-ze-mzdy/, insolvence.justice.cz,
www.ochrance.cz, vesta.justice.cz, sako.justice.cz a mpsv.gov.cz/registr-poskytovatelu-sluzeb.
O zveřejnění kalkulačky rozhoduje uživatel.

Odkazy jsou v `src/_data/pomoc.json`. Kalkulačka dluhů (vlna 2) se zveřejní až po ručním
ověření.

## Výsledky kontrol vlny 1

Sestavení proběhlo s `PATH_PREFIX=/ceske-kalkulacky/`, stejně jako v CI.

- `npm test`: **159/159**
  - Plán48: 34
  - Penzijko kompas: 25
  - Mám EET? + OSVČ: 72
  - sdílené moduly a konzistence: 28
- `npm run test:e2e`: **29/29**
  - Plán48: 7
  - Penzijko kompas: 7
  - Mám EET? + OSVČ 2027: 15
- `npm run kontrola`: **17 stránek**, 0 chyb axe serious/critical ve světlém i tmavém režimu,
  0 přetečení na 360 px, 0 cizích požadavků, 0 chyb v konzoli. Všechny stránky fungují bez
  JS a odkaz na pomoc je na `/dluhy/` vidět bez posouvání (360 × 640).
- `npm run lighthouse` (mobil): přístupnost 100 a výkon 92–100 na úvodu a 4 stránkách
  nástrojů. Podrobnosti jsou v `docs/kontroly/`.
- Snímky: `docs/snimky/vlna-1/` (desktop 1440 px a mobil 390 px; úvod a nástroje
  i v tmavém režimu).

# 2. fáze – vlna 2 (5. 11. 2026)

## Rozhodnutí

1. **Exekuce, nebo oddlužení? je postavená, ale nezveřejněná** (rozhodnutí uživatele).
   - `nastroj.json` má `"skryty": true`. Bez `ZOBRAZIT_SKRYTE=1` se stránka nevytvoří a JS
     ani CSS nástroje se nekopírují. Na webu je karta „Připravujeme“ a rozcestník pomoci
     na `/dluhy/`.
   - CI sestaví i `_site-vse` (se skrytými nástroji) a otestuje je, nasazuje se ale jen `_site`.
   - **Zveřejnění:** ručně ověřit odkazy v `rules.json` → `pomoc` a v `meta.zdroje`, smazat
     `"skryty": true` a příslušný bod z `meta.neovereno`.
2. **Dluhy: test obsahu stránky převeden na test nad hotovým webem.** Původní
   `test/obsah.test.js` četl `index.html` a `app.js`, které na webu nejsou. Jeho kontroly
   jsou teď v `test/e2e/skryte/dluhy-obsah.test.js`. Kontroluje se:
   - pomoc nad nadpisem,
   - povinná věta v obou kartách,
   - povolené domény,
   - žádné úložiště ani reklamní slova,
   - čtivost přes převzatý `scripts/ctenost.mjs`.
3. **Dluhy používají `layouty/zaklad.njk`, ne `nastroj.njk`.** Odkaz na pomoc musí být nad
   `h1` a layout nástroje dává `h1` na začátek. Bloky (zdroje, neověřené, upozornění,
   pravidla) proto stránka skládá sama. Výchozí texty layoutu umí vykat (`vykani: true`).
4. **Ukládání jen na kliknutí** (rozhodnutí uživatele). Cestovní příkaz a Rodičovská
   ukládají zadané údaje do `localStorage` (klíče `spocitano-…`) jen po kliknutí
   „Uložit v tomto prohlížeči“ a mají tlačítka Načíst uložené a Smazat uložené
   (`src/js/uloziste.js`, makro `ulozeni`). Stránka Soukromí to popisuje. Dluhy neukládají nic,
   ani do URL.
5. **Testy zůstaly tam, kde je mají původní repozitáře.** Výpověď a Cestovní příkaz mají test
   v kořeni složky nástroje, Přijímačky ve `tests/`, Inflace má `*.test.mjs`. `npm test`
   hledá `src/**/*.test.js` i `*.test.mjs`. Složky `test/` a `tests/` se do webu nekopírují.
6. **Oprava v `ics.js` (Přijímačky).** `escapeText` měl `'\;'`, což je v JS jen `;`, takže se
   středník v kalendáři neescapoval (RFC 5545 vyžaduje `\;`). Opraveno na `'\;'` a test
   upraven. Je to jediná změna převzatých modulů ve vlně 2.
7. **Texty převzatých modulů, které vykají nebo mají rodové tvary**, se na webu upravují
   ve `vystup.js` nebo `texty.js` daného nástroje a moduly zůstávají beze změny.
   Při aktualizaci modulu je potřeba úpravy zkontrolovat (Přijímačky při změně znění
   vypíšou varování při buildu).
8. **Inflační kalkulačka** dostala nový `rules.json` (jen `meta` a údaje o datech). Data ČSÚ
   (`data/cpi.json`) se vkládají do stránky při buildu. Akce
   `.github/workflows/aktualizace-cpi.yml` jednou měsíčně stáhne nová data, spustí testy
   a otevře PR.
   - V repozitáři je potřeba povolit Settings → Actions → General → „Allow GitHub Actions
     to create and approve pull requests“.
   - PR vytvořený akcí sám nespustí `web.yml`, kontroly je třeba pustit ručně
     (workflow_dispatch nebo zavřít a znovu otevřít PR).
9. **Cestovní příkaz:** `rules.json` je klíčovaný rokem a UI bere jen klíče `RRRR`. Sazby 2027
   jsou `null`, web proto u cest v roce 2027 řekne, že vyhláška vyjde koncem prosince.
   Po vydání stačí doplnit `rules.json["2027"]`.
10. **Volno 2027 je nový nástroj.** Zadání je v `docs/zadani-volno-2027.md`.
    - Svátky jsou podle zákona č. 245/2000 Sb. a zavřené obchody podle zákona č. 223/2016 Sb.
    - Velikonoce se počítají algoritmem.
    - `test/sdilene/volno-vypoved.test.js` hlídá shodu svátků s Výpovědí 2026
      v letech 2026–2030.
11. Rodičovská počítá ukázku při buildu s termínem porodu `meta.overeno` + 150 dní.
    V prohlížeči je výchozí termín dnešek + 150 dní.

## Výsledky kontrol vlny 2

Sestavení proběhlo s `PATH_PREFIX=/ceske-kalkulacky/`.

- `npm test`: **365/365**. Převzaté testy:
  - Slevy 30, Výpověď 24, Cestovní příkaz 26, Přijímačky 25, Rodičovská 29, Inflace 27
  - Dluhy 26
  - Volno 2027 má 14 nových testů a test shody s Výpovědí.
- `npm run test:e2e`: **81/81** (vlna 1 i 2). `npm run test:e2e:skryte` (Dluhy): **20/20**.
- `npm run kontrola`: **24 stránek** a k tomu 2 skryté stránky Dluhů nad `_site-vse`.
  - 0 chyb axe serious/critical ve světlém i tmavém režimu
  - 0 přetečení na 360 px
  - 0 cizích požadavků a 0 chyb konzole
  - ukázka funguje bez JS
  - pomoc je na `/dluhy/` vidět bez posouvání
- Lighthouse (mobil) na úvodu a 7 nových nástrojích: přístupnost 100, výkon 98–100.
- Snímky: `docs/snimky/vlna-2/`, nezveřejněné Dluhy v `docs/snimky/vlna-2/nezverejneno/`.
12. **Variabilní písma.** Na sdíleném CI stroji ukázal Lighthouse posun rozvržení (CLS ~0,22)
    na Penzijko kompasu, Inflaci, Cestovním příkazu a Přijímačkách. Příčina byla
    „Web font loaded“: přednačtený byl jen řez Nunito 400, tučné řezy 600, 700 a 800 se
    načítaly později a text se přelil. Řešení:
    - statické řezy jsou nahrazené variabilními (`@fontsource-variable/nunito` a `/fredoka`),
      tedy jedním souborem pro latin a jedním pro latin-ext s celou škálou tlouštěk,
    - všechny čtyři soubory se přednačítají,
    - písma jsou celkem menší (asi 109 kB místo 176 kB).
    
    Lighthouse navíc měří každou stránku třikrát, bere medián a vypisuje CLS a jeho příčiny.

# 2. fáze – vlna 3 (5. 11. 2026)

## Rozhodnutí

1. **Zdaním to? je postavené, ale nezveřejněné** (rozhodnutí uživatele, stejně jako Dluhy).
   - Oficiální weby finanční správy se z cloudové relace nedaly otevřít a sekundární zdroje se
     v několika bodech rozcházejí.
   - Tabulka 18 pravidel (zdroj, stav, co s tím nástroj dělá) je v `docs/zadani-zdanim-to.md`.
   - Sporné body nástroj nepočítá, jen na ně upozorní: limit 40 mil. Kč u kryptoaktiv, umístění
     zahraničních dividend (§ 8 + příloha 3, nebo § 16a + příloha 4), smluvní sazby mimo USA,
     limity pro přiznání od 2027.
   - Jednotný kurz GFŘ za 2026 zatím nevyšel, kurz se zadává ručně.
   - **Zveřejnění:** schválit tabulku, doplnit nebo opravit pravidla v `rules.json`, nastavit
     `meta.stav` a smazat `"skryty": true`.
2. **Štítek „Neověřeno“ místo „Pravidla ověřena“.** Když má `rules.json` `meta.stav: "neovereno"`,
   layout nástroje ukáže varovný štítek s `meta.stavText`.
3. **Velká data na vyžádání.** `nastroj.json` → `verejneSoubory` zkopíruje vybraná data
   do webu. Spot, nebo fix? tak načítá jen vybraný profil spotřeby TDD (asi 175 kB) z vlastního
   webu, ne všech 11 (1,9 MB). Ceny z burzy jsou ve stránce bezeztrátově zakódované
   (88 kB místo 224 kB) a build ověří, že po dekódování dají přesně původní data.
4. **Spot, nebo fix?** má týdenní aktualizaci dat z OTE a ČNB
   (`.github/workflows/aktualizace-spot.yml`), která otevře PR. Ceníky (`tariffs.json`,
   `dynamic.json`) platí pro 2026 a na rok 2027 je potřeba je přepsat ručně.
5. **Bydlometr** vkládá do stránky zeštíhlený `defaults.json` (jen hodnoty a zdroje).
   Bez JavaScriptu jsou vidět obě záložky pod sebou (`<noscript>` styl). Výsledek převzatého
   modelu, že se při výchozích hodnotách pro Prahu koupě vyplatí už v 1. roce, není chyba
   převodu. Stojí ale za kontrolu výchozích předpokladů.
6. Grafy se vykreslují tak, aby po načtení skriptu stránka neposkočila (pevný poměr stran,
   výsledky z buildu se jen aktualizují). CLS je na všech nových stránkách pod 0,01.

## Výsledky kontrol vlny 3

Sestavení proběhlo s `PATH_PREFIX=/ceske-kalkulacky/`.

- `npm test`: **474/474**. Nové testy vlny 3:
  - Bydlometr 62, Spot, nebo fix? 17 (převzaté)
  - Zdaním to? 30 (nové)
- `npm run test:e2e`: **94/94**. `npm run test:e2e:skryte` (Dluhy + Zdaním to?): **35/35**.
- `npm run kontrola`: **26 stránek** a k tomu 4 skryté nad `_site-vse`.
  - 0 chyb axe serious/critical ve světlém i tmavém režimu
  - 0 přetečení na 360 px
  - 0 cizích požadavků a 0 chyb konzole
  - ukázka funguje bez JS
- Lighthouse (mobil, medián ze 3 běhů) na úvodu a 13 nástrojích: přístupnost 100, výkon 97–100.
- Snímky: `docs/snimky/vlna-3/`, nezveřejněné Zdaním to? v `docs/snimky/vlna-3/nezverejneno/`.

## Odkazy na pomoc: kontrola vykreslení (6. 11. 2026)

HTTP 200 a titulek nestačí. sako.justice.cz je vracela, a přesto se návštěvníkům zobrazovala
prázdná. Proto přibyla ruční kontrola `npm run kontrola:odkazy` (`tools/kontroly/odkazy-pomoci.mjs`).
Každý odkaz na pomoc otevře ve skutečném prohlížeči a za chybu považuje:
- jinou odpověď než 200,
- nenačtené vlastní skripty nebo styly stránky,
- skoro prázdnou stránku.

Závisí na cizích serverech, proto neběží v CI. Spusť ji před zveřejněním kalkulačky dluhů
a při každé změně odkazů.

`test/sdilene/pomoc.test.js` zakazuje v bloku pomoci odkazy na sako.justice.cz a
vesta.justice.cz, dokud se nevykreslují. Tlačítko „Najít neziskovku“ v průvodci ministerstva
vede také na sako.justice.cz. Je proto vhodné upozornit ministerstvo přes kontakt na
insolvence.justice.cz (Kontakt pro dlužníka).

## Zveřejnění kalkulačky dluhů (6. 11. 2026)

Kalkulačka Exekuce, nebo oddlužení? je zveřejněná na `/dluhy/exekuce-nebo-oddluzeni/`
(uživatel o to požádal). Podmínka zveřejnění, tedy ověřené odkazy na bezplatnou pomoc, je splněná:
- PR #6 opravil mrtvý odkaz na registr poraden (`mpsv.gov.cz/registr-poskytovatelu-sluzeb`),
- PR #7 nahradil prázdnou stránku sako.justice.cz průvodcem ministerstva
  `insolvence.justice.cz/jak-vstoupit-do-oddluzeni/`,
- `npm run kontrola:odkazy` 6. 11. 2026 vykreslil v prohlížeči všech 5 odkazů pomoci s obsahem.

Změny při zveřejnění:
- z `nastroj.json` je odebrané `"skryty": true` a z `meta.neovereno` bod o čekání na ověření,
- záznam zmizel ze `src/_data/pripravujeme.json`,
- e2e testy dluhů se přesunuly z `test/e2e/skryte/` do `test/e2e/` a běží nad veřejným webem,
- stránka je v Lighthouse.

Výsledky před zveřejněním:
- `npm test` 477/477, `npm run test:e2e` 114/114, `npm run kontrola` 27 stránek bez chyb
  (včetně pomoci viditelné bez posouvání na 360 × 640),
- Lighthouse pro `/dluhy/exekuce-nebo-oddluzeni/` a `/dluhy/`: výkon 100, přístupnost 100.

Skrytý zůstává jen nástroj Zdaním to? (čeká na schválení pravidel).

## Zveřejnění Zdaním to? (6. 11. 2026)

Uživatel schválil tabulku pravidel v `docs/zadani-zdanim-to.md` a požádal o zveřejnění.
Schválení znamená přijetí tabulky tak, jak je. Sporné body se tím nestávají ověřenými:
- zůstávají v `meta.neovereno` a na stránce jako upozornění,
- nástroj je dál nepočítá: limit 40 mil. Kč u kryptoaktiv, umístění zahraničních dividend
  v přiznání, smluvní sazby mimo USA, limity přiznání od 2027,
- jednotný kurz GFŘ za 2026 se zadává ručně.

Změny:
- z `nastroj.json` je odebrané `"skryty": true`,
- `meta.stavText` je „Pravidla z odborných zdrojů, sporná místa označujeme“. Varovný styl
  štítku zůstává, protože oficiální texty se z cloudové relace ověřit nedaly,
- ze stránek zmizel štítek „čeká na schválení“,
- `src/_data/pripravujeme.json` je prázdný,
- e2e test se přesunul do `test/e2e/`, krok CI pro skryté nástroje je odebraný (žádný teď není)
  a stránky jsou v Lighthouse.

Mechanismus `"skryty": true` (`ZOBRAZIT_SKRYTE=1`, `_site-vse`, `test/e2e/skryte/`) zůstává
pro budoucí nástroje.

Výsledky:
- `npm test` 477/477, `npm run test:e2e` 129/129,
- `npm run kontrola` 29 stránek bez chyb,
- Lighthouse pro obě stránky Zdaním to?: výkon 100, přístupnost 100.

## Zdaním to? podle ověřených pravidel 2026 (6. 11. 2026)

Uživatel dodal `zdanim-to-overeni-2026.json`. Soubor obsahuje 13 bodů ověřených z ZDP v úplném
znění (e-Sbírka, znění od 1. 8. 2026), pokynů GFŘ a smluv o zamezení dvojího zdanění. Přidal
pořadí výpočtu u prodejů a pravidla pro dividendy, kurzy a limity přiznání.

Rozhodnutí:
- **Hodnoty jen z JSONu.** `rules.json` je přepsaný podle souboru, každé pravidlo má `stav`
  a `zdroj`. Výjimka: sazba 15 % u § 8 a § 10 (orientační daň) zůstává ze schválené tabulky.
  V JSONu je 15 % jen u § 16a.
- **Hlavička** ukazuje „Pravidla ověřena k 6. 11. 2026“: `meta.stav: neovereno` je pryč.
  Blok nejasných míst má nadpis „Co zákon ani finanční správa jasně neřeší“
  (`meta.neoverenoNadpis`, layout ho umí nově).
- **Nejasné body** se počítají podle doporučení a vždy mají viditelné upozornění se štítkem
  „Nejasné“:
  - úhrn 100 000 Kč včetně prodejů po 3 letech,
  - kód krypta v příloze č. 2,
  - zápočet v § 16a (jen orientačně),
  - dividendy v limitu přiznání,
  - W-8BEN.
- **Sazba 30 % u W-8BEN zmizela.** V JSONu není: bod 6 uvádí W-8BEN jen jako „nejasné – US
  procedura“. Tip na W-8BEN je teď bez čísel.
- **Elektronický peněžní token** je samostatná volba v řádku prodeje. Do hodnotového testu
  nevstupuje (bod 2), časový test a limit 40 mil. Kč se na něj vztahují jako na kryptoaktivum.
  Soubor tuto výjimku nemá.
- **Termínový prodej** je zaškrtávátko „sjednaný do 3 let od nákupu“, jen u krypta a EMT. Ruší
  časový test, hodnotový test ne (pořadí podle zadání).
- **Kurz za 2026:** jen denní kurz ČNB, přepínač se zobrazí, až bude jednotný kurz v
  `kurzy.jednotny[rok]`. Průběžný odhad „předběžné“ zatím není: počítal by se z měsíčních kurzů
  ČNB a ty v JSONu nejsou (web je nestahuje). Jednotný kurz za 2025 (GFŘ-D-75) je v rules jen
  jako údaj a pro testy.
- **„Jiná země“** zůstala bez smluvní sazby: zápočet jen do české daně a upozornění, že podle
  smlouvy může být nižší, bez smlouvy žádný.
- **Patička:** stránky nástroje mají v patičce webu větu „Nejde o daňové poradenství. Pravidla
  ověřena k 6. 11. 2026.“. Data stránky `patickaPoznamka` → `paticka({ poznamka })`.
- **Přepínač § 8 / § 16a** má název `zdaneni`. Název `rezim` už používá přepínač světlého
  a tmavého režimu (`tema.js`) a jeho skript by volbu odznačil.

### Doplnění: ověření podle textu ZDP (6. 11. 2026)

Uživatel dodal doslovný výběr ZDP v úplném znění od 1. 8. 2026 (e-Sbírka). Výběr obsahuje
§ 4 odst. 1 písm. t), u), zj), zk), § 4 odst. 3, § 16, § 16a, § 16ab a § 38f. Je uložený
v `docs/zdroje/zdp-2026-08-01-vyber.md`. Text zákona není podle § 3 autorského zákona chráněný.

- **EMT je potvrzený.** Písm. zj) vyjímá elektronický peněžní token jen z hodnotového testu.
  Písm. zk) a § 4 odst. 3 výjimku nemají, takže časový test i limit 40 mil. Kč platí.
- **Termínový prodej platí i pro cenné papíry.** Písm. u) má stejnou větu o budoucím převodu
  jako zk). Zadání mluvilo jen o kryptu, ale opora je v zákoně. Zaškrtávátko je teď u všech
  druhů.
- **Sazba 15 %** je doložená z § 16 odst. 1 písm. a), už není jen ze schválené tabulky. 23 %
  (písm. b) a zaokrouhlení základu na sta Kč dolů (§ 16 odst. 2, § 16a odst. 2) dál nepočítáme
  a obojí je uvedené v `meta.neovereno`.
- **Jiná země má zápočet 0** (volba uživatele). Podle § 38f odst. 1 se dvojí zdanění vylučuje
  podle mezinárodní smlouvy. Pro zemi mimo přehled 8 smluv sazbu nemáme, proto počítáme
  opatrně bez zápočtu a upozorníme, že při smlouvě s ČR jde zápočet uplatnit podle ní.
- **Návod k přiznání** má nové kroky o dokladech podle § 38f odst. 5 a 10: potvrzení správce
  daně nebo brokera a seznam potvrzení.
- **Citace:** pravidla mají v `rules.json` pole `zdroj.citace` s doslovným úryvkem. Stránka
  ho ukazuje v části „Jak počítáme“. U ustanovení ze ZDP je odkaz na e-Sbírku
  (`https://e-sbirka.gov.cz/sb/1992/586`).
- **Beze změny zůstává** úhrn 100 000 Kč včetně prodejů po 3 letech. Písm. t) a zj) mluví
  o „úhrnu“ bez výjimky, ale ověřovací JSON bod vede jako nejasný a oficiální metodika
  chybí. Proto má dál štítek „Nejasné“, teď s citací zákona.

### Doplnění: úplné znění ZDP (6. 11. 2026)

Uživatel nahrál celé znění ZDP od 1. 8. 2026. Do `docs/zdroje/zdp-2026-08-01-vyber.md` jsem
přidal další ustanovení: § 8 odst. 4 a 8, § 10 odst. 4 a 5, § 38 odst. 1, 5 a 7, § 38g
odst. 1 až 3 a § 38v. Celé znění v repozitáři není, je zbytečně velké.

**Potvrzeno beze změny výpočtu**
- § 10 odst. 4: k rozdílu, o který výdaje druhu převyšují příjem, se nepřihlíží. U částečně
  osvobozeného příjmu se výdaje krátí poměrem.
- § 8 odst. 4 a 8:
  - zahraniční dividendy jsou základem daně nesníženým o výdaje,
  - když se do § 16a zahrne jeden takový příjem, musí tam být všechny.
- § 38 odst. 1 písm. b), 5 a 7:
  - přepočet denním kurzem ČNB ke dni příjmu, nebo jednotným kurzem,
  - obojí v jednom období současně použít nelze.
- § 38g odst. 1 a 2: limity za rok 2026 jsou 50 000 Kč a 20 000 Kč (jiné příjmy podle § 7
  až 10). Limity od roku 2027 mění zák. č. 180/2026 Sb. a v tomto znění ještě nejsou.

**Nejasné zůstává**
- Dividendy v limitu přiznání. Text § 38g z limitu vyjímá jen osvobozené příjmy a příjmy
  sražené zvláštní sazbou, což výklad podporuje. Stav ale zůstává podle ověřovacího JSONu,
  stránka teď ukazuje citaci.

**Nové**
- § 38v: osvobozený příjem vyšší než 5 000 000 Kč je nutné oznámit správci daně do konce
  lhůty pro přiznání. Kalkulačka upozorní u každého prodeje, jehož osvobozená část limit
  přesahuje.
  - U krypta nad 40 mil. Kč se počítá jen osvobozená část.
  - Zákon neříká, zda se příjmy sčítají. Kalkulačka posuzuje každý prodej zvlášť, podle textu
    „obdrží příjem“.
- § 10 odst. 5: k formuláři přibyla nápověda, co patří do nákladů:
  - nabývací cena,
  - u cenných papírů poplatky za nákup a výdaje spojené s prodejem,
  - u krypta ze směny cena podle zákona o oceňování.

### Doplnění: oznámení se sčítá, smlouvy ověřené z textu (7. 11. 2026)

- **Sčítání pro oznámení (§ 38v).** Na přání uživatele se osvobozené příjmy všech prodejů
  v roce sčítají, cenné papíry i krypto dohromady. Je to přísnější varianta, příklad: akcie
  3 mil. + krypto 2,5 mil. = 5,5 mil. Kč, tedy oznámit. Zákon mluví o „příjmu“ vyšším než
  5 000 000 Kč a o sčítání nic neříká, proto má upozornění štítek „Nejasné“. Přesně
  5 000 000 Kč se neoznamuje. Volba `oznameni.scitani` v rules vrací posouzení po prodejích.
- **Pokuta za neoznámení (§ 38w odst. 1):**
  - 0,1 % z příjmu, když oznámení podá bez výzvy,
  - 10 % po výzvě úřadu,
  - 15 %, když ho nepodá ani v náhradní lhůtě.

  Upozornění výši pokuty vyčíslí ze součtu.
- **Smluvní sazby** jsou ověřené z textu smluv: čl. 10 odst. 2 všech 8 smluv, stažený
  ze zakonyprolidi.cz ve znění Sbírky. Doslovný text je v `docs/zdroje/smlouvy-cl10.md`,
  u každé země je v rules `smluvniSazba.zdroj` s odkazem a citací. U Švýcarska platí nové
  znění čl. 10 podle Protokolu 99/2013 Sb.m.s. Všechny sazby odpovídají ověřovacímu JSONu.
- **Prokazování původu majetku** do kalkulačky nepatří. Uživatel zmínil předpis, podle kterého
  musí člověk doložit majetek nad 5 mil. Kč. Úplné znění ZDP takové ustanovení neobsahuje
  (prohlášení o majetku je v jiném předpisu) a nástroj ho nepočítá.

## Úpravy vzhledu podle připomínek uživatele (12. 11. 2026)

- **„Odkud to víme“** je na stránkách nástrojů sbalené na kliknutí: `zdroje({ sbalitelne: true })`
  vykreslí `<details>` se souhrnem „Pravidla ověřena … · N zdrojů“. Před tiskem se blok
  otevře (`beforeprint` v `js/tema.js`), takže se zdroje vytisknou. Stránka Všechny zdroje
  (`/zdroje/`) zůstává rozbalená.
- **„Co zatím neověřujeme a nepočítáme“** je nad zdroji, a to v layoutu nástroje i na stránce
  Dluhů.
- **Dlaždice voleb** (`.opt`) mají jemné podbarvení `--c-surface-2` místo bílé, takže
  na bílé kartě nesplývají. Najetí myší míchá barvu s `--c-accent-soft`. Pilulky `.seg`
  mají tenký rámeček.
- **„Jak číst štítky“** (Co se mění v roce 2027) dostaly vlastní seznam `.legenda`. Původní
  `.watch` je pro ikonu 28 px, takže se do něj štítek nevešel, překrýval text a pravidlo
  `.watch .ikona` mu přebarvilo ikonu.

# Opravy podle revize 5. 11. 2026 (12. 11. 2026)

Revize v `docs/revize/2026-11-05/` hodnotila původní repozitáře. Stav každého nálezu na webu
je v `docs/revize/2026-11-05/stav-na-webu.md`. Opravují se kritické a vysoké nálezy, které na
webu platí. Každá hodnota je ověřená v textu předpisu na zakonyprolidi.cz (e-Sbírka se z prostředí
neotevře) a v `rules.json` má citaci (`zdroj: { pravniZaklad, url, citace }`).

## Výpověď 2026 (VYP-01, VYP-02, VYP-08)

- **§ 52 písm. d) a e) podle znění od 1. 6. 2025** (zákon č. 120/2025 Sb.). Písm. d) je jednotný
  zdravotní důvod, písm. e) je dosažení nejvyšší přípustné expozice. Odstupné 12× náleží jen
  u písm. e) (§ 67 odst. 3 ZP). U písm. d) odstupné nenáleží.
- **Jednorázová náhrada podle § 271ca ZP** je samostatný řádek, ne odstupné. Náleží u písm. d)
  při výpovědi i dohodě, když zdravotní nezpůsobilost způsobil pracovní úraz, nemoc z povolání
  nebo její ohrožení. Formulář se na příčinu zeptá jen u písm. d). Výchozí je „Jiné zdravotní
  důvody“, aby kalkulačka neslibovala peníze, na které nárok není.
- **Podpora a § 39 odst. 2 zákona o zaměstnanosti.** Když pracovní poměr ukončí zaměstnavatel
  podle § 52 písm. h), nebo podle písm. g) pro zvlášť hrubé porušení, podpora nenáleží.
  Kalkulačka místo tabulky ukáže 0 Kč s odůvodněním. U písm. g) se ptá zaškrtnutím, protože
  písm. g) zahrnuje i méně závažná porušení. Dohodu ani výpověď od zaměstnance § 39 odst. 2
  nevylučuje. Úřad práce bere v úvahu skončení za posledních 6 měsíců. Kalkulačka počítá
  s posledním pracovním poměrem.
- Věta „způsob skončení podporu neovlivňuje“ nahrazena přesným pravidlem včetně podmínky,
  že nepobíráš starobní důchod (§ 39 odst. 1 písm. c).
- Zdroje: přidány úřední předpisy (ZP § 52, § 67, § 271ca, zákon č. 120/2025 Sb., ZoZ § 39
  a § 50, sdělení MPSV č. 537/2025 Sb.), epravo.cz odebráno.
- Testy 13 a 14 z původního repozitáře (d → 12×, e → 0) chybu konzervovaly, jsou přepsané.

## Rodičovská (ROD-01 až ROD-04, s nimi ROD-05 a ROD-06)

- **Měsíc 3. narozenin se počítá celý** (§ 30b odst. 1 písm. d) ZSSP). Plán, čerpání
  i kontrolní seznam končí posledním dnem měsíce 3. narozenin. Věk se bere z
  `rules.rodicovsky[].vekMesicu`, ne z konstanty v kódu.
- **Rodičovská souběžně s mateřskou** (§ 30b odst. 3 ZSSP): náleží od měsíce narození, v měsících
  s mateřskou jen ve výši rozdílu, když je zvolená výše vyšší. Před narozením nenáleží.
  Návrh výše „Vyčerpat do 3 let“ hledá nejnižší výši po stovkách, se kterou se vyčerpá
  i se souběhem (`navrhVyseSOdectem`).
- **Mateřská a otcovská přes 1. leden** se od 1. 1. přepočítají podle redukčních hranic nového
  roku (§ 22 odst. 2 ZNP). DVZ se nemění. Částka v měsíci je součet po dnech. Výstup ukazuje
  druhou sazbu, jen když se liší. Strop rodičovské se počítá z DVZ redukovaného hranicemi roku
  narození dítěte.
- **Jesle: 120 hodin** (§ 31 odst. 3 písm. a) ZSSP), dřív 92.
- **Zbytek nižší než měsíční částka** se vyplatí spolu s poslední výplatou (§ 30 odst. 6 ZSSP).
  Je to střední nález ROD-05, opravený společně s ROD-01, protože jde o stejnou funkci
  `cerpaniRp`. Proto 350 000 Kč po 15 000 Kč = 23 měsíců (poslední 20 000 Kč), ne 24.
- **400 000 Kč** pro děti narozené od 1. 1. 2027 je zákon č. 152/2026 Sb. (čl. II), štítek
  „schváleno“ místo „návrh“ (ROD-06).
- Přepsané testy, které chybu konzervovaly: 240 000 / 110 000 Kč, 24 měsíců / 5 000 Kč,
  `navrhVyse` 11 700 Kč, 2 000 Kč denně po celou mateřskou přes Nový rok.

## OSVČ 2027 a Slevy 2027 (EET-01, SLV-01, SLV-02, s nimi EET-08)

- **Začínající OSVČ** (§ 14 odst. 5 věta druhá zákona č. 589/1992 Sb.): v roce zahájení hlavní
  činnosti a ve 2 dalších letech je minimum sociálního pojištění 25 % průměrné mzdy (12 916 Kč
  měsíčně v roce 2027). Neplatí, když člověk podnikal v předchozích 20 letech. Na webu je to
  třetí druh činnosti „Hlavní činnost, začínám“, takže se propíše do srovnání, grafu i bodu
  zvratu bez dalšího pole. Zdravotní minimum ani paušální daň se nemění. Pravidlo je
  v `rules.json` (`social.minBaseShareStarting`, `startingCitation`), odkaz vede na e-Sbírku,
  protože integritní test Mám EET? povoluje jen úřední domény.
- **Minimální mzda 2027** cituje sdělení MPSV č. 171/2026 Sb. (24 900 Kč), ne nařízení vlády
  č. 164/2026 Sb. (EET-08, sjednocení se Slevami 2027).
- **Školkovné** (SLV-01): `skolkovne()` započte jen dítě v předškolním věku. Hranice je v
  `rules.json` (`slevy.skolkovne.maxVekDitete`, 7 let) a označená jako praktické zjednodušení,
  protože zákon rozhoduje podle předškolního zařízení. Převod odpovědí z formuláře je čistá
  funkce `odpovediZeStavu()` ve `vystup.js` s testem. Krok školky navíc maže staré odpovědi
  u dětí, které už v předškolním věku nejsou.
- **Daňové zvýhodnění na zletilé dítě** (SLV-02, § 35c odst. 6 a 10 ZDP): nárok jen za měsíce,
  na jejichž počátku dítě nedovršilo 18 let, nebo 26 let, když studuje (soustavně se připravuje
  na povolání). U dítěte přibylo zaškrtávátko „Studuje…“. Pořadí dětí se dál určuje po měsících
  jen mezi dětmi s nárokem.

## Penze a odpočet (P48-01, PEN-01, s nimi SLV-05, P48-05, PEN-08)

- **Odpočet DPS po měsících ve všech třech nástrojích** (§ 15 odst. 7 ZDP): sdílená funkce
  `src/js/odpocet-dps.js` (`odpocitatelnaCastDps`) sečte v každém měsíci část vkladu nad
  hranicí 1 700 Kč. Hranice je v `rules.json` každého nástroje (Plán48
  `odpocet.dpsMesicniHranice`, Penzijko kompas `odpocet.nadVklad`, Slevy
  `odpocty.stari.penzijkoHraniceMesicne`). Shodu hlídá `test/sdilene/konzistence.test.js`.
  - Plán48 počítá z měsíčního profilu: proběhlé měsíce s dnešním vkladem, zbylé s navýšeným.
    Rada „mimořádně na penzijko“ = nevyužitý limit + rozdíl do hranice v prosinci. Při
    navýšení na 1 700 Kč je to přesně nevyužitý limit (48 000 Kč místo 55 000 Kč).
  - Slevy se ptají na roční úhrn a nově i na mimořádný vklad. Pravidelnou část rozloží do
    12 měsíců, mimořádný vklad přičtou k prosinci (SLV-05). Kdo platí nepravidelně jinak,
    dostane odhad, a to je v nápovědě kroku.
- **Zaokrouhlení státního příspěvku** zůstává rozdílné (Plán48 na celé Kč, Penzijko kompas
  na haléře). Rozdíl je nejvýš 0,50 Kč měsíčně a `konzistence.test.js` ho hlídá. Sjednocení
  by měnilo převzaté a otestované moduly bez dopadu na výsledek pro uživatele.
- **Pásma „Lepší penzijko“** mají v Plánu48 zápis `vekDo` 17/29 včetně, v Penzijko kompasu
  18/30 bez. Pro celé roky věku je to totéž, zápis se nesjednocuje.
- **Konec transformovaných fondů 2036** je jen ve vládním návrhu (sněmovní tisk 285), ne
  v zákoně č. 427/2011 Sb. Údaj je v `sady.navrh2027.transformovaneFondy` se zdrojem a projekce
  ho používá jen s touto sadou. Text na kartě a v předpokladech má štítek návrhu. S pravidly
  2026 se proto v transformovaném fondu nenabízí krok „navyš vklad“, protože se při výnosu
  1,5 % v dnešních penězích nevyplatí (test doporučení upraven).
- **Citace „§ 15a ZDP“** opraveny na „§ 15 odst. 6 a 7 ZDP“ v Plánu48 i Penzijko kompasu.

## Cestovní příkaz (CES-01, CES-02)

- **Cesta přes 2 kalendářní dny** (§ 163 odst. 4 ZP, pro veřejnou sféru platí taky, § 176 odst. 1
  vylučuje jen odst. 1–3): `spocitejCestu` spočítá stravné po dnech i dohromady a použije vyšší
  částku. Výsledek nese `posouzeni` (`oddelene` / `spolecne`), vyúčtování to vypíše. Zákon neříká,
  jak při společném posouzení počítat jídla. Sčítáme jídla obou dnů (nejvýš 3) a krátíme podle
  společného pásma a sazeb dne odjezdu. U cesty přes 2 dny formulář nabídne jídla i u dne kratšího
  než 5 hodin. Cesty přes 3 a více dní se posuzují po dnech jako dřív.
- **Přívěs** (§ 157 odst. 4 ZP): sazba za km nejméně o 15 % vyšší. Procento je v `rules.json`
  (`zakonik.prives`), náhrada se počítá z přesného součinu km × sazba × 1,15, ne ze zaokrouhlené
  sazby. Ve formuláři je u cesty zaškrtávátko „Jedu s přívěsem“. Body o přívěsu a o cestě přes
  půlnoc zmizely z `meta.neovereno`.
- Do `meta.zdroje` přibyly paragrafy zákoníku práce na zakonyprolidi.cz. Sekundární zdroje vyhlášky
  zůstávají v seznamu, jejich nahrazení je v seznamu k další práci (CES-08).

## Spot, nebo fix? (SPOT-01, SPOT-02, s nimi SPOT-05)

- **Třídy TDD podle přílohy č. 6 vyhlášky č. 408/2015 Sb.** (aktuální znění od 1. 9. 2026, ověřeno
  na zakonyprolidi.cz): TDD4 = D01d, D02d, D61d; TDD5 = D25d, D26d, D27d; TDD6 = D35d;
  TDD7 = D45d, D56d, D57d. Zdroj je v `tariffs.json` → `sazbyInfoZdroj` (mimo `sazbyInfo`,
  protože to se vypisuje do výběru sazeb).
- **D61d: nízký tarif jen od pátku 12:00 do neděle 22:00** (cenový výměr ERÚ č. 14/2025, staženo
  z eru.gov.cz). Okna NT umí nově i zápis podle dne v týdnu (`byWeekday`, 0 = neděle), svátky na
  něj nemají vliv. Mřížka čtvrthodin proto nese i `dow`.
- **Délky NT podle podmínek sazeb v CV ERÚ 14/2025** (SPOT-05, stejná data): D35d a D56d 20 h
  denně, D27d 8 h jen v době 18:00–8:00. Okna jsou dál typická (skutečné časy určuje HDO
  distributora), sedí jen délka a rozmezí.

## Sdílené čtení čísel a sjednocení napříč nástroji (PEN-02 a část 3 souhrnu)

- **Jedna funkce pro čísla z formulářů** `src/js/cislo-vstup.js` (`prectiCislo`). Používá ji
  12 nástrojů místo vlastních kopií. Pravidla:
  - mezery (i pevné a úzké) a „Kč“ na konci se ignorují,
  - čárka je desetinná,
  - tečka, za kterou následují přesně tři číslice, odděluje tisíce („40.000“ = 40 000,
    „1.500“ = 1 500); jiná tečka je desetinná („1.5“, „0.850“),
  - prázdné pole = `null`, nečitelný zápis = `NaN` a pole ukáže hlášku,
  - záporné číslo jen tam, kde ho pole dovolí (`{ zaporne: false }`).

  Dřív se „40.000“ všude četlo jako 40 a Mám EET? bralo „1e6“ jako milion. Slevy 2027 dál
  přijímají jen celá čísla a „40.000“ odmítnou s hláškou. Bydlometr si nechává vlastní
  `parseNumber` v `js/format.js`, formulář ho nepoužívá.
- **Penzijko kompas:** horní meze polí pro kontrolu překlepu jsou v `rules.json` → `formular.max`
  (věk 100, poplatek za správu 5 %, ze zhodnocení 30 %). Nejsou to zákonné stropy, jen pojistka
  proti „85“ místo „0,85“ %.
- **Úroky z hypotéky:** vyšší limit 300 000 Kč patří k bytové potřebě obstarané před 1. 1. 2021
  (zákon č. 386/2020 Sb., čl. IV bod 3), ne k datu smlouvy. Bydlometr i Slevy to tak píšou,
  hlídá to `test/sdilene/konzistence.test.js`.
- **Průměrná mzda:** tři různé hodnoty jsou správně, každá slouží k jinému účelu a nástroj
  to u ní uvádí: 51 663 Kč (NV č. 177/2026 Sb.) pro daně a pojistné 2027 v Mám EET? a Slevách,
  48 171 Kč (sdělení č. 537/2025 Sb.) pro strop podpory 2026 ve Výpovědi, 3 × 48 967 Kč pro
  hranici 23% daně 2026 v čisté mzdě Rodičovské.

# Střední nálezy revize 5. 11. 2026 (12. 11. 2026)

## Plán48 a Penzijko kompas – střední nálezy (P48-04, PEN-05, PEN-06, PEN-07)

- **Podmínky daňové podpory (P48-04).** Podle § 15b odst. 1 písm. a) bod 1 ZDP je produkt
  daňově podporovaný, jen když se z něj vyplácí nejdřív po 120 kalendářních měsících a nejdřív
  v roce 60 let (u penzijka i od věku 5 let před důchodovým věkem). Při výplatě nebo zániku
  dřív se podpora vrací (§ 15b odst. 4): odpočty za předchozích 10 zdaňovacích období se
  zdaní jako ostatní příjem (§ 15b odst. 5 písm. a)). Čísla jsou v `rules.json` →
  `sady.*.odpocet.podminkyPodpory` s citací, text skládá `vystup.js` → `upozorneniPodpory`.
  Upozornění je v poznámce pod radou „Co udělat do 31. 12.“ (jen když rada radí vložit peníze),
  v seznamu „Na co si dát pozor“ a v nápovědě pole DIP. Dřívější věta „trvání aspoň 10 let“
  byla nepřesná: zákon počítá 120 měsíců od vzniku produktu do výplaty, ne délku placení.
  Podmínky soukromého životního pojištění podle § 15a odst. 3 (pojistná částka, věk 60)
  nástroj dál nekontroluje, je to v `meta.neovereno`.
- **Odkaz MF (PEN-05).** Stránka `mf.gov.cz/cs/financni-trh/penzijni-sporeni` vrací 404.
  Nahrazena stránkou MF „Základní informace“ k III. pilíři (HTTP 200, titulek „Základní
  informace | Ministerstvo financí ČR“, 12. 11. 2026). Odkazy na kb.cz, finance.cz, finex.cz,
  dumfinanci.cz, csps.cz a psp.cz se z prostředí nedají otevřít (proxy je blokuje), proto
  zůstávají beze změny a jsou uvedené v PR k ruční kontrole.
- **Výnosy fondů (PEN-06).** Prezentace MF z 3. 6. 2026 uvádí předpoklady svého modelu: na
  s. 12–15 výnos akcií 7,5 %, dluhopisů 4,0 %, peněžního trhu 2,5 % a inflaci 2,5 %, na s. 17
  výnos transformovaného fondu 1,5 %. Ty jsou teď v `rules.json` s citací (`vynosZdroj`,
  `cyklus.zdrojAkcie`, `cyklus.zdrojDluhopisy`, `predpoklady.inflaceZdroj`):
  - transformovaný fond 1,5 % (beze změny, teď se zdrojem),
  - akcie ve strategii životního cyklu 7 → 7,5 %, dluhopisy 3 → 4 %,
  - akciový fond 7 → 7,5 % (počítáme ho celý v akciích, to je předpoklad kalkulačky),
  - inflace 2,5 % (beze změny, teď se zdrojem).
  Výnos konzervativního (3 %) a vyváženého (4,5 %) fondu MF neuvádí. Hodnoty zůstávají a mají
  poznámku „předpoklad kalkulačky, ne úřední údaj“. Rozložení životního cyklu (100 % akcií
  do 45 let, 20 % v 65) zůstává vlastním předpokladem. MF v modelu počítá s 98 % akcií do
  55 let a pak se snížením na 30 %, to je v poznámce fondu. Stránka v „S čím počítáme“ říká,
  odkud který výnos je, a výslovně, že výnos transformovaného fondu rozhoduje o radě „přejít“.
  Karta transformovaného fondu ukazuje použité výnosy pod výsledkem. Vyšší výnosy akcií
  a dluhopisů zvýší projekce akciového fondu a životního cyklu a s nimi přínos přechodu
  z transformovaného fondu (výchozí ukázka: 392 791 Kč v dnešních penězích).
- **Testy (PEN-07).** Přibyly testy `vkladProMaxPrispevek` (obě sady, hranice pásem 17/18
  a 29/30 let, věk bez pásma, minimální vklad), větve doporučení „poplatky“ a test 6 teď
  ověřuje přesnou hodnotu měsíčního modelu 100 000 × (1 − 0,01/12)^120 = 90 479,97 Kč
  místo tolerance 0,5 % kolem 90 438 Kč (to je roční strhávání ze zadání, 100 000 × 0,99^10).

## Mám EET? + OSVČ 2027 – střední nálezy (EET-03, EET-05, EET-06, EET-07, EET-09, s nimi EET-11)

- **1. pásmo paušální daně 2027 podle zákonného vzorce** (EET-03, rozhodnutí uživatele): o 15 % se
  zvyšuje vyměřovací základ, ne záloha (§ 14 odst. 3 písm. a) a odst. 13 zákona č. 589/1992 Sb.).
  35 % × 51 663 = 18 083 Kč, × 1,15 = 20 796 Kč, pojistné 29,2 % = 6 073 Kč (§ 7 odst. 3, nahoru).
  Zdravotní část je 13,5 % z dvanáctiny minimálního VZ = 3 488 Kč (§ 8a a § 3a odst. 5 zákona
  č. 592/1992 Sb.), daň 100 Kč (§ 38lk odst. 7 ZDP). Celkem **9 661 Kč** měsíčně, 115 932 Kč ročně,
  EET OFF 132 732 Kč. Stejný postup dává oficiální částky FS pro rok 2026 (5 756 / 3 306 Kč).
  `osvc.js` → `flatBands()` 1. pásmo dopočítá z parametrů. `rules.json` drží jen daň, násobek 1,15,
  kontrolní hodnoty v `expected` a citace (`zdroj`, `zdrojZdravotni`, `zdrojDan`). Stav zůstává
  „derived“: tabulka Finanční správy pro rok 2027 k 12. 11. 2026 nevyšla (ověřeno na
  financnisprava.gov.cz, je tam jen rok 2026). Po zveřejnění tabulky přepnout na „official“.
  Zdroj 1. pásma už neodkazuje na tiskovou zprávu FS bez výpočtu (část EET-13). Karta na úvodní
  stránce (`zmeny2027.json`) uvádí 9 661 Kč se zdrojem v zákoně.
- **Neplatné zadání v OSVČ 2027** (EET-05): výsledek, graf, lepivá lišta i částka první zálohy se
  skryjí a místo nich je upozornění „V zadání je chyba…“. Hlášku u pole formulář ukazuje už při
  psaní, čtečka ji oznámí jednou. Po opravě se vše přepočítá.
- **Jedna činnost a podmínka 75 %** (EET-06, § 2a odst. 5 ZDP): kalkulačka se dál ptá jen na jeden
  výdajový paušál. Nápověda pole to říká. Výsledek přidá poznámku, když pásmo vychází jen díky
  vyššímu limitu (1,5 nebo 2 mil. Kč): ten platí, jen když aspoň 75 % příjmů tvoří příjmy
  s paušálem 80 % nebo 60 % (2 mil. Kč jen 80 %). Jinak je limit 1. pásma 1 mil. Kč (2. pásma
  1,5 mil. Kč). Doplňkovou otázku na podíl příjmů jsme nepřidali, zjednodušení je v `meta.neovereno`.
- **Rozhodná částka u vedlejší činnosti** (EET-07, § 10 odst. 2 zákona č. 155/1995 Sb.): účast
  vzniká, když zisk rozhodné částky „dosáhl“. Bez pojistného je jen zisk pod ní (dřív `<=`).
  Rozhodná částka se počítá z nezaokrouhleného součinu VVZ × koeficient (NV č. 177/2026 Sb.:
  48 900 Kč × 1,0565), ne z průměrné mzdy zaokrouhlené nahoru (EET-11, stejná funkce). Zákon
  zaokrouhlení neurčuje: porovnává se přesná hodnota 123 990,84 Kč, zobrazuje se 123 991 Kč.
  Pro rok 2027: 123 990 Kč → bez pojistného, 123 991 Kč → 19 914 Kč. Průměrná mzda 51 663 Kč
  se kontroluje testem jako VVZ × koeficient nahoru (§ 23b odst. 4 ZPSZ).
- **Zadání** (EET-09, rozhodnutí uživatele): `docs/zadani.md` opraveno s poznámkou „(opraveno podle
  revize 5. 11. 2026, EET-09)“: 1. pásmo 9 661 Kč a kritéria 115 932 / 132 732 Kč, minimální
  zálohy 35 % PM nejsou návrh, 25 % PM pro začínající, výjimka jen pro průkaz ZTP nebo ZTP/P kvůli
  nevidomosti, těžké ztrátě zraku nebo hluchoslepotě (§ 11 odst. 4 zákona č. 180/2026 Sb.),
  MOJE eet „zejména pro nejvýše 2 evidenční jednotky“ bez limitu zaměstnanců (eet.gov.cz).
- Přepsané testy, které chybu konzervovaly: 115 944 → 115 932 Kč, 132 744 → 132 732 Kč, měsíčně
  9 662 → 9 661 Kč a EET OFF 11 062 → 11 061 Kč (`test/osvc.test.js`, `test/e2e/mam-eet.test.js`
  včetně ukázky bez JS). Test „1. pásmo = min. soc. záloha × 1,15“ nahradil test zákonného vzorce.

## Výpověď 2026 a Rodičovská – střední nálezy (VYP-04, VYP-05, ROD-07, ROD-09, ROD-11)

- **VYP-04 (zbytek):** kontrola „sjednaný den skončení nemůže být dřív než den uzavření dohody“
  je v `konecPomeru` (`vypoved.js`), ne jen ve formuláři. Modul vyhodí `Error` s neutrální větou
  bez tykání i vykání, `app.js` ji jen ukáže u pole `konecDohody`. Týž den uzavření a skončení
  je v pořádku. Testy věku 52 a 57 s čistým výdělkem 60 000 Kč: 8 a 11 měsíců, první 3 měsíce
  strop 38 537 Kč (0,8 × 48 171 Kč, sdělení č. 537/2025 Sb.), celkem 253 611 a 325 611 Kč
  (§ 43 a § 50 zákona č. 435/2004 Sb.). Tyto dva testy prošly už před opravou, jsou pojistkou.
- **VYP-05:** § 67 odst. 2 zákoníku práce (předchozí pracovní poměr u téhož zaměstnavatele,
  pauza nejvýš 6 měsíců) je v `rules.json` → `zakonikPrace.odstupne.predchoziPomer` s citací.
  Nápověda k délce pracovního poměru se skládá v `vypoved-2026.11tydata.js` z těchto dat.
  Výpočet se nemění, délku zadává uživatel.
- **ROD-07:** při chybě ve formuláři (termín, příjem, dny a měsíce) se plán skryje celý:
  karta výsledku, časová osa, souhrn, kontrolní seznam i lepivá lišta. Místo nich je upozornění
  „Plán se nepřepočítal“ v živé oblasti (`role="status"`). Po opravě se plán vrátí. Skrytí jsme
  zvolili místo zašednutí: zašedlá čísla k jinému zadání se dají omylem opsat.
- **ROD-09:** nástup na otcovskou jde zadat do 41. dne (`rules.otcovska.nastupDoDne`, § 38a
  odst. 4 zákona č. 187/2006 Sb.: „v období 6 týdnů ode dne narození“; den porodu = 0. den).
  Délka 14 dní (§ 38b odst. 1) a sazba 70 % (§ 38c) beze změny. Dřívější strop 28. den byl
  42 − 14, aby se otcovská nepotkala s mateřskou otce od 7. týdne. Ten střet teď řeší výpočet
  podle § 48 odst. 1 písm. a) zákona č. 187/2006 Sb.: z jednoho pojištění má přednost mateřská,
  takže za společné dny se vyplácí jen mateřská a otcovská se neprodlužuje. Aplikace na to
  upozorní (`otcovskaSMaterskou`). Prodloužení lhůty o dny hospitalizace (§ 38a odst. 4 věta
  třetí) nepočítáme.
- **ROD-11:** odkazy ČSSZ vedou přímo na stránky „Peněžitá pomoc v mateřství“ a „Otcovská“
  na cssz.gov.cz (curl 12. 11. 2026: HTTP 200, titulek odpovídá). Tisková zpráva Finanční
  správy k čisté mzdě je nahrazená předpisy na zakonyprolidi.cz: zákon č. 586/1992 Sb. § 16
  a § 35ba, č. 589/1992 Sb. § 7 a č. 48/1997 Sb. § 9 odst. 2. Přibyly zdroje § 38a a § 48
  zákona č. 187/2006 Sb. Kontrolní seznam bere název i adresu odkazu na úřad z `rules.json`
  (`ppm.urad`, `otcovska`, `rodicovskyUrad`). Dřív odkaz „MPSV / ÚP ČR – Rodičovský příspěvek“
  vedl na text zákona. Test `test/zdroje.test.js` hlídá jen úřední domény (gov.cz,
  zakonyprolidi.cz), žádné tiskové zprávy a shodu `zdroje` s `meta.zdroje`.

## Spot, nebo fix? – střední nálezy (SPOT-03, SPOT-06, SPOT-07)

- **Zdroj distribuce je cenový výměr ERÚ č. 14/2025** (SPOT-07, ERV 18/2025,
  https://eru.gov.cz/sites/default/files/obsah/prilohy/erv182025.pdf). `tariffs.json` →
  `distributors.*.source` má tvar `{ pravniZaklad, url (#page=30), citace, stranyPdf, overeno }`,
  `stranyPdf` dává stranu PDF pro každou sazbu (D 01d str. 30 … D 61d str. 46). Ceník ČEZ Prodej
  zůstal jen jako `kontrolniZdroj`. Všech 300 hodnot (10 sazeb × 3 distributoři × VT, NT a
  8 pásem jističe) jsme 12. 11. 2026 strojově porovnali s textem PDF (`pdftotext -layout`):
  žádný rozdíl, hodnoty se neměnily.
- **POZE ve výstupu ukazuje to, co se účtuje** (SPOT-03). Dřív předpoklady psaly 0,60 Kč/kWh
  (strop 495 Kč/MWh s DPH), i když výpočet účtuje 0 Kč. Teď `vystup.js` počítá roční POZE stejnou
  funkcí jako výpočet (`pozeAnnual`, nižší z obou plateb). Při nule ukáže „0 Kč“ a důvod
  z `tariffs.json` → `common.poze.vysvetleniNuly`. Důvod: CV ERÚ č. 15/2025 (ERV 19/2025, bod 2)
  mění v CV 13/2025 bod (5.1.2) z 8,32 na 0 Kč/A/měsíc. Podle odůvodnění pokryjí náklady na
  podporu v roce 2026 prostředky státního rozpočtu. Strop 495 Kč/MWh je ze zákona č. 165/2012 Sb.,
  § 28a odst. 2. Citace jsou v `common.poze.zdroj`.
- **Datum ověření regulovaných cen** je v `tariffs.json` → `overeno` (12. 11. 2026). Stránka ho
  ukazuje v části „Předpoklady výpočtu“ s odkazem na CV ERÚ 14/2025. `rules.json` → `meta.zdroje`
  má nově CV 14/2025 a zákon č. 165/2012 Sb. § 28a.
- **Testy** (SPOT-06): `src/nastroje/spot-nebo-fix/test/regulovane.test.js` – pásma jističe
  (1× 25 A a 3× 10 A až 3× 63 A), cena za jistič a VT/NT v `regulatedFor` pro D02d, D56d, D57d
  a D61d u všech tří distributorů a všech 9 jističů, VT/NT a jistič 3× 25 A pro všech 10 sazeb
  ČEZ. Očekávané hodnoty jsou opsané z PDF, ne z `tariffs.json`. Testy hodnot prošly už na `main`,
  hodnoty byly správně. E2E `test/e2e/spot-nebo-fix.test.js`: změna jističe, distributora, sazby
  a jejich kombinace přepočítá karty i předpoklady stejně jako `vystup.js` v Node.

## Slevy 2027, Inflační kalkulačka, Cestovní příkaz – střední nálezy (SLV-06, INF-04, CES-04, CES-05, s nimi SLV-08)

- **Úroky z hypotéky – název vstupu** (SLV-06): vstup `stareSmlouva` se jmenuje
  `bytovaPotrebaPred2021`, klíč `limitStareSmlouvy` je `limitPred2021`. Rozhoduje, kdy byla
  bytová potřeba obstarána, ne datum smlouvy (zákon č. 386/2020 Sb., čl. IV bod 3,
  https://www.zakonyprolidi.cz/cs/2020-386). Citace je v `odpocty.uroky.zdroj`. Testy pokrývají
  refinancování (byt 2019, úvěr 2023, úroky 180 000 Kč → 180 000 Kč) a cestu od zaškrtávátka
  v dotazníku (`odpovediZeStavu`) až do výpočtu.
- **Strop darů ze základu daně** (SLV-08, odhalil ho test z SLV-06): § 15 odst. 1 ZDP (znění od
  1. 1. 2027) dovoluje odečíst „nejvýše 15 % ze základu daně“; minimum je úhrn nad 2 % základu
  nebo aspoň 1 000 Kč. `vyhodnot()` dřív bral základ snížený o odpočet na stáří a úroky
  (ZD 600 000, stáří 48 000, úroky 150 000, dary 100 000 → 60 300 Kč). Teď bere základ daně před
  odpočty → 90 000 Kč. Strop všech odpočtů dohromady (nejvýš do výše základu) hlídá dál
  `uplatnitDan`. Citace v `odpocty.dary.zdroj`.
- **Inflační kalkulačka – vstup a směr přepočtu bez DOM** (INF-04): `vystup.js` má čisté funkce
  `castkaZTextu`, `vynosZTextu`, `mesicZPoli`, `smerPrepoctu` (`dopredu` / `zpet` / `stejne`,
  měsíce vždy chronologicky), `prohodMesice` a `vstupPrepoctu` / `vstupVynosu` / `vstupMzdy`
  (vrací `{ vstup, chyby }`, chyby podle id pole). `ui.js` je jen volá a vypisuje chyby k polím.
  Čísla dál čte sdílené `prectiCislo`. Texty hlášek se nezměnily. Výsledek `prepocet()` nově nese
  `smer`, `zmena` a `rocne`, aby šel směr ověřit testem.
- **Spotřeba z technického průkazu** (CES-04): nápověda teď říká „údaj pro kombinovaný provoz,
  jinak aritmetický průměr všech údajů“. Pozor: je to § 158 **odst. 4** zákoníku práce (odst. 3
  upravuje cenu pohonné hmoty). Citace v `zakonik.spotreba.zdroj`.
- **Ověření sazeb 2026 proti vyhláškám** (CES-05): texty vyhlášek č. 573/2025 Sb., 78/2026 Sb.
  a 175/2026 Sb. jsme stáhli ze zakonyprolidi.cz. Hodnoty v `rules.json["2026"]` sedí: 5,90 a
  1,60 Kč/km, stravné 155/236/370 Kč, veřejná sféra 155–185/236–284/370–442 Kč, benzin 95 34,70 Kč
  (od 1. 10. 2026 41,80 Kč), benzin 98 39 Kč, nafta 34,10 Kč (od 1. 6. 2026 44,50 Kč), elektřina
  7,20 Kč/kWh. Původní znění vyhlášky 573/2025 Sb. (verze 1) se stáhnout nepodařilo (stránka znění k 1. 1. 2026 je bez textu);
  původní ceny benzinu 95 a nafty plynou z textu novel („34,70 Kč“ → „41,80 Kč“, „34,10“ →
  „44,50“). `meta.zdroje` vedou na zakonyprolidi.cz místo praceamzda.cz a epravo.cz. Věta
  o sekundárních zdrojích zmizela z `meta.neovereno` i z `poznamkaOvereni`. Odkaz „vyhlášky
  č. 573/2025 Sb.“ u tabulky sazeb vedl na § 157 zákoníku práce (první položka zdrojů), teď
  vede na vyhlášku (`rules.json["2026"].zdroj.url`).
- **Zaokrouhlení** (CES-05): § 183 odst. 5 zákoníku práce: částka, kterou zaměstnavatel poskytuje
  zaměstnanci v Kč, se zaokrouhlí na celé koruny nahoru (vratka zálohy zaměstnancem také nahoru,
  § 183 odst. 3). Zaokrouhlení jednotlivých položek zákon neupravuje – kalkulačka je počítá na
  haléře (polovina haléře nahoru), to je její konvence. Výtisk to tak teď píše; citace je
  v `zakonik.zaokrouhleni`.
- **OSVČ** (CES-05): místo „pravidla jsme spolehlivě neověřili“ stránka říká, že náhrady OSVČ jsou
  mimo rozsah kalkulačky, a odkazuje na § 24 odst. 2 písm. k) a zt) ZDP.

## Bydlometr – střední nálezy (BYD-01 až BYD-07)

- **Poplatek za mimořádnou splátku = nejnižší ze tří stropů** (zákon č. 257/2016 Sb., znění od
  1. 9. 2024, ověřeno na zakonyprolidi.cz): § 117 odst. 4 (0,25 % za započatý rok do konce fixace,
  nejvýš 1 %), § 117 odst. 5 (úrok do konce fixace) a § 117 odst. 5 věta druhá s § 117a
  (administrativní náklady nejvýš 1 000 Kč + kladný úrokový rozdíl). Kalkulačka se nově ptá na
  smluvní sazbu (předvyplněná ukázková) a nepovinně na průměr sazeb ČNB podle § 117a. Bez průměru
  ČNB výsledek připomene, že při průměru ≥ smluvní sazbě je strop 1 000 Kč.
  - Úrok i úrokový rozdíl počítáme z mimořádné splátky, jako by se z ní do konce fixace platil jen
    úrok. Pro anuitní úvěr je to horní mez (vyšší splátka úrok i rozdíl jen zmenší), takže věta
    „Poplatek nejvýš …“ zůstává pravdivá bez dalších polí (zůstatek, splátka). Když průměr ČNB
    není nižší než smluvní sazba, rozdíl není kladný a strop je 1 000 Kč.
  - Průměr ČNB nepředvyplňujeme: ČNB ho zveřejňuje pro 20 skupin úvěrů a skupinu určuje banka.
- **Starší smlouvy** (před 1. 9. 2024 a bez fixace začaté po tomto dni, zákon č. 462/2023 Sb.,
  čl. XV bod 2: „ode dne, kdy po dni nabytí účinnosti … započne běžet nové období“): splátka ke
  konci fixace a do 25 % v měsíci před výročím jsou zdarma i podle dřívějšího znění (§ 117 odst. 3
  písm. c), d), f) a odst. 5 ve znění do 31. 8. 2024). Jinak procentní strop neplatil, banka smí
  chtít skutečné náklady, nejvýš úrok do konce fixace – se smluvní sazbou ukážeme tuto mez.
  Odečtení bezplatné části od vyšší splátky přinesla až novela (čl. XIV bod 7), u starších smluv
  se proto neodečítá. Fixace začatá přesně 1. 9. 2024 se podle textu přechodného ustanovení řídí
  dřívějším zněním (dřív kód bral „od 1. 9.“).
- Pod kalkulačkou poplatku je výčet dalších bezplatných případů § 117 odst. 3 písm. a), b), e),
  f), g) (seznam v `rules.json` → `prepayment.otherFreeReasons`, e) a f) jen pro nové znění).
- **Neplatný vstup** (BYD-03): výsledek, tabulky a zátěžový test se skryjí, místo nich je hláška
  s `role="alert"` a výčtem polí, lepivá lišta ukáže „–“. Kalkulačka poplatku ukáže „–“ a hlášku.
  Kontrola polí je čistá funkce `zkontrolujPole` ve `vystup.js` (meze polí jsou v definici pole,
  ne v `ui.js`), stav výsledku `stavVysledku`.
- **DTI a úspora na dani** (BYD-04): refixace ukazuje DTI (zbývající dluh / roční čistý příjem)
  s poznámkou, že pro vlastní bydlení ČNB limit nestanovila (záznam bankovní rady 4. 6. 2026), a
  úsporu na dani za 1. rok nové fixace u nejlevnější varianty: min(úroky, limit) × 15 %. Limit
  150 000 Kč (§ 15 odst. 4 ZDP), se zaškrtnutím „Bydlení je pořízené před 1. 1. 2021“ 300 000 Kč
  (zákon č. 386/2020 Sb., čl. IV body 3 a 4). Nájem vs. koupě má nepovinné pole příjmu pro DTI,
  u investičního bytu připomíná doporučení ČNB DTI 7 (TZ 27. 11. 2025) a nad ním varuje. Úspora na
  dani v 1. roce a celkem je vidět ve výsledku. DTI počítáme jen z této hypotéky.
- **Nad limitem LTV se porovnání nepočítá** (BYD-05): výsledek ukáže, kolik vlastních zdrojů
  chybí; statistiky, graf, tabulky a citlivost jsou skryté. Platí i pro investiční byt (doporučení
  ČNB 70 %), text tam mluví o doporučení. LTV v hlášce má jedno desetinné místo zaokrouhlené
  nahoru, takže nad limitem nikdy neukáže „80 %“.
- **Zdroje** (BYD-07): zákonná pravidla v `rules.json` mají úřední url (zakonyprolidi.cz s
  paragrafem, cnb.cz) a citaci `zdroj: { pravniZaklad, url, citace }`. Komerční weby zůstaly jen
  u tržních údajů a v `meta.zdroje` mají poznámku „Tržní údaj“. Poplatek za vklad do katastru
  ověřen v zákoně č. 634/2004 Sb., položka 120 písm. a) (2 000 Kč), daň z nemovitosti v zákoně
  č. 338/1992 Sb. (§ 10 odst. 3, § 11). Limit 150 000 Kč cituje § 15 odst. 4 ZDP.
- **Testy** (BYD-06): `test/format.test.js` (parseNumber a formátování), `test/vystup.test.js`
  (čtení formuláře, neplatný vstup, výstupy). Dva „bankovní“ testy anuity porovnávají přesnou
  hodnotu ze vzorce (21 077,04 Kč; 16 385,50 Kč) místo tolerance.

## Plán48 a Penzijko kompas – střední nálezy (P48-04, PEN-05, PEN-06, PEN-07)

- **Podmínky daňové podpory (P48-04).** Podle § 15b odst. 1 písm. a) bod 1 ZDP je produkt
  daňově podporovaný, jen když se z něj vyplácí nejdřív po 120 kalendářních měsících a nejdřív
  v roce 60 let (u penzijka i od věku 5 let před důchodovým věkem). Při výplatě nebo zániku
  dřív se podpora vrací (§ 15b odst. 4): odpočty za předchozích 10 zdaňovacích období se
  zdaní jako ostatní příjem (§ 15b odst. 5 písm. a)). Čísla jsou v `rules.json` →
  `sady.*.odpocet.podminkyPodpory` s citací, text skládá `vystup.js` → `upozorneniPodpory`.
  Upozornění je v poznámce pod radou „Co udělat do 31. 12.“ (jen když rada radí vložit peníze),
  v seznamu „Na co si dát pozor“ a v nápovědě pole DIP. Dřívější věta „trvání aspoň 10 let“
  byla nepřesná: zákon počítá 120 měsíců od vzniku produktu do výplaty, ne délku placení.
  Podmínky soukromého životního pojištění podle § 15a odst. 3 (pojistná částka, věk 60)
  nástroj dál nekontroluje, je to v `meta.neovereno`.
- **Odkaz MF (PEN-05).** Stránka `mf.gov.cz/cs/financni-trh/penzijni-sporeni` vrací 404.
  Nahrazena stránkou MF „Základní informace“ k III. pilíři (HTTP 200, titulek „Základní
  informace | Ministerstvo financí ČR“, 12. 11. 2026). Odkazy na kb.cz, finance.cz, finex.cz,
  dumfinanci.cz, csps.cz a psp.cz se z prostředí nedají otevřít (proxy je blokuje), proto
  zůstávají beze změny a jsou uvedené v PR k ruční kontrole.
- **Výnosy fondů (PEN-06).** Prezentace MF z 3. 6. 2026 uvádí předpoklady svého modelu: na
  s. 12–15 výnos akcií 7,5 %, dluhopisů 4,0 %, peněžního trhu 2,5 % a inflaci 2,5 %, na s. 17
  výnos transformovaného fondu 1,5 %. Ty jsou teď v `rules.json` s citací (`vynosZdroj`,
  `cyklus.zdrojAkcie`, `cyklus.zdrojDluhopisy`, `predpoklady.inflaceZdroj`):
  - transformovaný fond 1,5 % (beze změny, teď se zdrojem),
  - akcie ve strategii životního cyklu 7 → 7,5 %, dluhopisy 3 → 4 %,
  - akciový fond 7 → 7,5 % (počítáme ho celý v akciích, to je předpoklad kalkulačky),
  - inflace 2,5 % (beze změny, teď se zdrojem).
  Výnos konzervativního (3 %) a vyváženého (4,5 %) fondu MF neuvádí. Hodnoty zůstávají a mají
  poznámku „předpoklad kalkulačky, ne úřední údaj“. Rozložení životního cyklu (100 % akcií
  do 45 let, 20 % v 65) zůstává vlastním předpokladem. MF v modelu počítá s 98 % akcií do
  55 let a pak se snížením na 30 %, to je v poznámce fondu. Stránka v „S čím počítáme“ říká,
  odkud který výnos je, a výslovně, že výnos transformovaného fondu rozhoduje o radě „přejít“.
  Karta transformovaného fondu ukazuje použité výnosy pod výsledkem. Vyšší výnosy akcií
  a dluhopisů zvýší projekce akciového fondu a životního cyklu a s nimi přínos přechodu
  z transformovaného fondu (výchozí ukázka: 392 791 Kč v dnešních penězích).
- **Testy (PEN-07).** Přibyly testy `vkladProMaxPrispevek` (obě sady, hranice pásem 17/18
  a 29/30 let, věk bez pásma, minimální vklad), větve doporučení „poplatky“ a test 6 teď
  ověřuje přesnou hodnotu měsíčního modelu 100 000 × (1 − 0,01/12)^120 = 90 479,97 Kč
  místo tolerance 0,5 % kolem 90 438 Kč (to je roční strhávání ze zadání, 100 000 × 0,99^10).

## Přijímačky bez paniky – střední nálezy (PRI-02, PRI-03, PRI-04, PRI-05)

- **Škála bodů (PRI-02).** Jednotná zkouška má dva testy po nejvýš 50 bodech, celkem 0–100.
  Zdroj: vyhláška č. 422/2023 Sb., příloha č. 1, poznámka 1 („standardní 50bodová hodnotící
  škála“ testu) a stránka CERMAT „Jednotná přijímací zkouška“ („Maximální možný počet
  dosažených bodů … je 50 bodů“), obojí přečteno 12. 11. 2026. Hodnoty jsou v `rules.json`
  → `body` (`testMax`, `pocetTestu`) s citací. Meze polí skládá `mezePoli()` v `simulace.js`:
  body v simulátoru i ve strategii 0–100, jeden pokus 0–50. Počet míst ve škole 0–50 (celé
  číslo) je jen pojistka proti překlepu v modelové třídě (`rules.json` → `formular`).
- **Kontrola polí (PRI-02).** `kontrolaCisla()` čte číslo sdíleným `prectiCislo` a vrací
  hodnotu, nebo text hlášky. Hláška je u pole (`.error-msg`, `aria-invalid`, `aria-describedby`),
  ve strategii přes makro `pole({ chybaMisto: true })`, v tabulkách simulátoru stejným HTML
  z `vystup.js`. Chybné číslo se do výpočtu nepustí: simulátor ukáže „Některé číslo v tabulce
  není v pořádku“, skryje tabuli, kola i výsledek a zamkne Přehrát a Krok. Strategie místo
  výsledku napíše, že se ukáže po opravě. Prázdné body v simulátoru jsou teď chyba (dřív
  se tiše počítaly jako 0). Prázdný pokus je dál v pořádku (nemoc), prázdné „Při shodě bodů“
  taky.
- **Desetinná čísla (PRI-03).** Všechna číselná pole jsou `type="text"` s `inputmode`
  (`decimal`, u počtu míst `numeric`). „62,5“ i „62.5“ je 62,5 bez ohledu na jazyk prohlížeče.
  Úřední zdroje neříkají, že body z jednotné zkoušky jsou vždy celé, proto pole desetinná
  čísla přijímají (je to v `meta.neovereno`). Výpis bodů je česky („62,5 b.“, „o 2,5 b. nad
  ním“), věty z `explain()` dostanou desetinnou čárku v `upravVetu()`. Převzaté moduly
  (`matching.js`, `strategy.js`) zůstaly beze změny.
- **Stejná škála ve strategii (PRI-04).** Formulář chce body i loňské minimum jen z jednotné
  zkoušky (0–100) a říká to v upozornění nad poli i v nápovědě u minima. Volbu „celkové body
  školy“ jsme nepřidali: každá škola má celkové hodnocení na jiné škále (jednotná zkouška
  aspoň 60 %, zbytek si určí ředitel, § 60i odst. 3 školského zákona), takže jedno číslo
  „čekaných bodů“ nejde porovnat se třemi různými škálami. Hodnocení jednotné zkoušky musí
  být v seznamu výsledků každé školy zvlášť (§ 60j odst. 5), uživatel ho tedy najde.
- **Testy (PRI-05).** Přibyly testy kapacity 0 (i `explain` „škola nemá žádné volné místo“),
  `minScore` (důvod „kriteria“ a věta v `explain`), uchazeče bez priorit, školy bez uchazečů,
  prázdného vstupu, shody v `rankApplicants`, řetězového vytlačení přes 3 školy, strategie
  bez škol a se třemi prázdnými školami (zapsané dnešní chování `no-safe`, nízký PRI-07 se
  neopravoval) a hranic kategorií. Nový `tests/vstup.test.js` testuje kontrolu polí, HTML
  editoru s hláškou a text o škále.
- **`meta.overeno` zůstává 5. 11. 2026.** Nová pravidla mají vlastní `body.overeno`
  (12. 11. 2026). `meta.overeno` je datum štítku „Pravidla ověřena“ pro celý nástroj
  i pevný `DTSTAMP` v .ics a termíny jsme 12. 11. znovu neověřovali.
