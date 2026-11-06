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
