# Revize: Inflační kalkulačka (`frankie851/inflacni-kalkulacka`)
Revidovaný commit: `b9e19800fed0e0bcbf0971930208b3ff0b541903` (5. 11. 2026) · živý web: https://frankie851.github.io/inflacni-kalkulacka/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Výpočty jsou správné: všech 45 referenčních případů (5 příkladů ze zadání, skutečná data, hraniční stavy) se shoduje s modulem `inflation.js` i s obrazovkou, datová řada `data/cpi.json` je měsíc po měsíci totožná s CSV ČSÚ (372/372 v 010022‑25, 141/141 v CEN0101E) a přepočet září 2025 → září 2026 dává 2,5 % jako oficiální meziroční inflace ČSÚ. Nejvážnější jsou dvě porušení přístupnosti stupně „serious“ (axe, WCAG 2.2 AA): aktivní záložka má kontrast 4,42:1 (tmavý režim 3,64:1) a posuvná tabulka hodnot není dosažitelná klávesnicí – podle škály závažnosti jde o nálezy Vysoké, kritický nález není. Dobře je oddělený výpočetní modul bez DOM, poctivé README (včetně upozornění na odchylku meziroční inflace z bazického indexu), poznámka u měsíce bez dat, žádná analytika ani ukládání, žádné přetékání na 360 px, funkční měsíční aktualizace dat a živý web shodný s `main`.
Nálezy: Kritická 0 · Vysoká 2 · Střední 2 · Nízká 5

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟢 | — |
| 2 Výpočty | 🟡 | INF-03 („10.000“ se čte jako 10 Kč) |
| 3 Shoda se zadáním | 🟢 | INF-08 (Nízká) |
| 4 Testy | 🟡 | INF-04 |
| 5 Mobil a přístupnost | 🔴 | INF-01, INF-02 |
| 6 Texty a citlivá témata | 🟢 | INF-05, INF-07 (Nízká) |
| 7 Soukromí a bezpečnost | 🟢 | INF-06 (Nízká) |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
Aplikace nemá `rules.json`; „pravidla“ jsou datová řada ČSÚ, její definice, vzorce a několik konstant v kódu (grep čísel v `app.js`, `inflation.js`, `scripts/*.mjs`, `index.html`, workflow).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Datová řada: bazický index spotřebitelských cen, úhrn, průměr 2015 = 100, měsíčně od ledna 1995 | `data/cpi.json` (381 hodnot 1995‑01 … 2026‑09); patička `index.html:135` | ČSÚ 010022‑25 (1995‑01 … 2025‑12) a CEN0101E `IZ2015` (2015‑01 … 2026‑09); vzorky 1995‑01 = 50,6; 2005‑01 = 80,2; 2015‑06 = 100,5; 2022‑09 = 138,5; 2025‑12 = 155,2; 2026‑09 = 159,2 | FD‑50, rejstřík „Datové řady“; vlastní stažení obou CSV 5. 11. 2026 (`dukazy/inflacni-kalkulacka/data-vs-csu.txt`) | 5. 11. 2026 (2 zdroje: 010022‑25 i CEN0101E) | shodné: 372/372 a 141/141 měsíců, překryv 132 měsíců bez rozdílu, žádný měsíc navíc |
| Definice řady (filtr sloupců): 010022‑25 `stapro_kod 6134`, `casz_kod Z`, prázdný `ucel_kod`, základ 2015‑01‑01…2015‑12‑31; CEN0101E `TYPUDAJE4A IZ2015`, `CZCOP1 0`, prázdný `CZCOP23`, `EKAKTIOCDS 0`, `UZ02P CZ`, `CASMKMQRM12 RRRR‑MM` | `scripts/cpi-parse.mjs:72–185`, `README.md:24–31` | tytéž kódy v CSV ČSÚ (vlastní parser vybral stejných 372 + 141 hodnot) | FD‑50; dokumentace 010022 https://csu.gov.cz/docs/107508/5bc19b9e-1d32-50d4-8b7c-a3bcd4fbf4d2/010022-23dds.htm (HTTP 200) | 5. 11. 2026 | shodné; `update-cpi.mjs --dry-run` v kopii: obě CSV nalezena, koeficient navázání 1,00000 přes 132 měsíců, „381 měsíců, bez děr“ |
| Vzorce: přepočet, kumulativní a průměrná roční inflace, reálný výnos, reálná mzda, výnos p.a. ↔ za období | `inflation.js:65–98`, `README.md:38–46` | definice ze zadání (`docs/zadani.md` ř. 674–682); meziroční index ČSÚ = I_m / I_m−12 | FD‑51 | 5. 11. 2026 | shodné (45/45 případů referenčního výpočtu, viz níže) |
| Meziroční inflace září 2026 | z dat: 159,2 / 155,3 − 1 = 2,51 % → na obrazovce „2,5 %“ | ČSÚ: 2,5 % („meziroční růst, který byl v září 2,5 %“); CEN0101E `IR` 2026‑09 = 102,5 | FD‑52; https://csu.gov.cz/rychle-informace/indexy-spotrebitelskych-cen-inflace-zari-2026 (curl 5. 11. 2026, HTTP 200) | 5. 11. 2026 (2 zdroje) | shodné |
| Meziroční inflace 2026 po měsících (graf, tabulka) | `yoySeries`, `inflation.js:113–121` | ČSÚ `IR`: 1,6 / 1,4 / 1,9 / 2,5 / 2,1 / 1,5 / 1,7 / 1,9 / 2,5 % | CEN0101E (`data-vs-csu.txt`) | 5. 11. 2026 | shodné po zaokrouhlení na 1 desetinné místo ve všech 9 měsících |
| Odchylka meziroční inflace z bazického indexu proti oficiální (README: „o desetinu, kolem 2000 až o 0,3 p. b.“) | `README.md:32–33` | vlastní výpočet 2000‑01 … 2025‑12 (312 měsíců): max. 0,317 p. b. (2000‑11), 2005–2014 max. 0,137, 2015–2025 max. 0,106; 89 měsíců > 0,05 p. b. | ČSÚ 010022‑25 `casz_kod C` | 5. 11. 2026 | tvrzení README platí (přesně 0,32 p. b.) |
| Průměrná roční míra inflace 2025 = 2,5 % | jen v zadání a README (aplikace ji nepočítá) | ČSÚ 2,5 % | FD‑53, https://csu.gov.cz/inflace-spotrebitelske-ceny | 5. 11. 2026 | shodné |
| Poslední zveřejněný měsíc | patička „Poslední data: září 2026“ (`app.js:248`) | ČSÚ: září 2026 (RI 13. 10. 2026), říjen 2026 vyjde 10. 11. 2026 | FD‑54 | 5. 11. 2026 | shodné |
| Základ: průměr roku 2015 = 100 | test tolerance 0,05 (`test/cpi-data.test.mjs:100`), data 99,975 | ČSÚ měsíce 2015 zaokrouhlené na 1 des. místo → průměr 99,975 | FD‑55 | 5. 11. 2026 | shodné |
| Začátek výběru období 1995 | `app.js:10` `FIRST_YEAR = 1995`; `validateSeries start '1995-01'` (`cpi-parse.mjs:217`) | řada ČSÚ od ledna 1995 | FD‑50 | 5. 11. 2026 | shodné |
| Výchozí období (leden 2005; −5 let; −10 let), plán aktualizace 11.–15. den v měsíci, stáří dat max. 3 měsíce, tolerance navázání řad 0,05 %, zaokrouhlení navázaných hodnot na 2 des. místa | `app.js:251–253`, `.github/workflows/update-cpi.yml:7`, `scripts/update-cpi.mjs:122`, `scripts/cpi-parse.mjs:191,201` | předpoklady aplikace, ne úřední hodnoty (ČSÚ zveřejňuje kolem 10. dne; RI za září vyšla 13. 10. 2026) | — | 5. 11. 2026 | v pořádku |
| Chart.js 4.4.1 z cdnjs | `index.html:10` | výjimka výslovně v zadání | `docs/zadani.md` ř. 659 | 5. 11. 2026 | povoleno; bez `integrity` (INF‑06) |

Zdroje v patičce a README: https://csu.gov.cz/produkty/isc_cr (200), https://csu.gov.cz/produkty/indexy-spotrebitelskych-cen (200), dokumentace 010022 (200), https://data.csu.gov.cz/opendata/sady/CEN0101E/distribuce/csv (200, text/csv, 49,5 MB) – všechny fungují a odpovídají tomu, co text tvrdí. Žádné pravidlo v rejstříku nechybělo.

## Nezávislý přepočet
Referenční výpočet od nuly: `dukazy/skripty/inflacni-kalkulacka-prepocet.mjs` (bez importu kódu aplikace; jediný vstup z repozitáře je datový soubor `data/cpi.json`, nezávisle ověřený proti CSV ČSÚ). Porovnání s modulem: `inflacni-kalkulacka-porovnani.mjs` → `dukazy/inflacni-kalkulacka/prepocet.txt` (2 běhy v nových procesech, shodné: 42 shod, 3 „neshody“ jen u pravidel čtení textu, viz INF‑03/INF‑05). Obrazovka: `inflacni-kalkulacka-prohlizec.mjs` → `dukazy/inflacni-kalkulacka/prohlizec.json` (2 běhy, 0 rozdílů) a snímky `vysledek-360.png`, `vysledek-1440.png`, `chyba-360.png`, `vynos-360.png`, `mzda-360.png`. Kontrola dat: `inflacni-kalkulacka-data.mjs` → `data-vs-csu.txt`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: index 100 → 125 | 100 Kč | 125 Kč, kumulativně 25,0 % | 125; 0,25 | — | ano |
| zadání: obrácený přepočet | 125 Kč, index 125 → 100 | 100 Kč | 100 | — | ano |
| zadání: nominálně 4 %, inflace 2,5 % | — | reálně 1,4634 % (≈ 1,46 %) | 0,014634 | — | ano |
| zadání: mzda 40 000 → 50 000 Kč, index +20 % | — | +4,1667 % (≈ 4,17 %) | 0,041667 | — | ano |
| zadání: 24 měsíců, index 100 → 110,25 | — | průměrně 5,0 % ročně | 0,05 | — | ano |
| zadání/data: 10 000 Kč, leden 2005 → září 2026 (výchozí stav) | 10 000; 80,2 → 159,2; 260 měs. | 19 850,37 Kč; +98,50 %; prům. 3,22 % ročně | 19 850,374; 0,985037; 0,032151 | „19 850 Kč“, „vzrostly o 98,5 % (průměrně 3,2 % ročně)“ – 360 i 1440 px, živý web totéž | ano |
| zadání/data: obráceně (tlačítko ⇄) | 10 000 Kč, září 2026 → leden 2005 | 5 037,69 Kč | 5 037,688 | „5 038 Kč“, „10 000 Kč v září 2026 má stejnou kupní sílu jako 5 038 Kč v lednu 2005“; selecty prohozeny | ano |
| zadání/postup: porovnání s oficiální meziroční inflací ČSÚ | 100 Kč, září 2025 → září 2026 | 102,51 Kč; 2,511 % (ČSÚ 2,5 %) | 102,511; 0,025113 | „103 Kč“, „vzrostly o 2,5 %“; tabulka září 2026: 159,20 · 102,5 · 2,5 %; graf meziroční: poslední bod 2,511 | ano (ČSÚ 2,5 %) |
| vlastní: stejný měsíc | 1 000 Kč, září 2026 → září 2026 | 1 000 Kč, 0 % | 1 000; 0 | — | ano |
| vlastní: celé období 1995‑01 → 2026‑09 (380 měs.) | 1 000 Kč | 3 146,25 Kč; +214,6 %; prům. 3,69 % | shodné | — | ano |
| vlastní: přelom roku 2019‑11 → 2020‑02 (3 měs.) | 100 Kč | 101,92 Kč; prům. 7,92 % ročně | shodné | — | ano |
| vlastní: přestupný únor 2024‑01 → 2024‑03 (2 měs.) | 100 Kč | 100,40 Kč; prům. 2,43 % | shodné | — | ano |
| vlastní: 1 měsíc beze změny indexu (2026‑08 → 2026‑09) | 100 Kč | 100 Kč; 0 %; prům. 0 % | shodné | — | ano |
| vlastní: inflační vlna 2022‑01 → 2023‑01 | 1 000 Kč | 1 174,96 Kč; 17,50 % | shodné | — | ano |
| vlastní: 0 Kč; 1 000 000 000 Kč; 99,99 Kč | leden 2005 → září 2026 atd. | 0 Kč; 3 146 245 059 Kč; 102,57 Kč | shodné | — | ano |
| vlastní: výnos 4 % p.a., září 2021 → září 2026 (výchozí stav) | 60 měs. | nominálně 21,67 %, ceny 35,60 %, reálně −10,28 %, −2,15 % ročně | shodné | „-2,15 % ročně“ (červeně), „nominálně o 21,7 %, ceny o 35,6 % … -10,3 % (průměrně -2,15 % ročně)“ | ano |
| vlastní: výnos 10 % celkem, září 2025 → září 2026 | 12 měs. | reálně +7,31 % | shodné | „+7,31 % za období“ (zeleně) | ano |
| vlastní: výnos „3,5“ celkem (čárka), cs‑CZ i en‑US | 12 měs. | +0,96 % | shodné | „+0,96 % za období“; v en‑US pole drží „3,5“, výpočet správný (pole je `type=text`) | ano |
| vlastní: 2 % p.a. 2022‑01 → 2023‑01; 0 % p.a.; −50 % celkem; 6 % p.a. 1 měsíc | — | −13,19 %; −2,45 %; −50,80 %; +0,49 % za měsíc = 6,00 % p.a. | shodné | — | ano |
| vlastní: výnos −100 %; období obrácené (Od > Do) | — | odmítnout | app.js:109–110 odmítá | „Zadejte výnos v procentech, např. 4 nebo 3,5.“ / „Zvolte období, ve kterém je „Do“ později než „Od“.“ | ano |
| vlastní: mzda 30 000 Kč (září 2016) → 45 000 Kč (září 2026) (výchozí stav) | — | nominálně +50,0 %, ceny +58,41 %, reálně −5,31 %; stačilo by 47 522 Kč | shodné | „-5,31 %“, „… stačilo 47 522 Kč“ | ano |
| vlastní: mzda 40 000 Kč (září 2025) → 50 000 Kč (září 2026) | zadáno „40 000“, „50 000“ | +21,94 %; 41 004,51 Kč | shodné | „+21,94 %“, „stačilo 41 005 Kč“ | ano |
| vlastní: stejná mzda; mzda 12 500 → 45 000 Kč (2005‑01 → 2026‑09); mzda dřív 0 | — | −2,45 %; +81,36 %; odmítnout | shodné; app.js:131 odmítá | 0 Kč → „Zadejte obě mzdy jako kladná čísla.“ | ano |
| zadání: měsíc bez dat (prosinec 2026, říjen 2026); před začátkem (červen 1994) | — | počítat se zářím 2026 / lednem 1995 + poznámka | `resolveMonth` after/before | prosinec 2026 → „Za prosinec 2026 zatím data nejsou, počítám s posledním dostupným měsícem (září 2026).“; výsledek beze změny | ano |
| zadání: graf meziroční inflace – správné měsíce | září 2026; leden 2023; prosinec 1995; leden 1996 | 2,51 %; 17,50 %; – (bez dat o rok zpět); 8,89 % | `yoySeries` shodné | tabulka září 2026 „2,5 %“, srpen 2026 „1,9 %“ (ČSÚ 1,9 %) | ano |
| vlastní: zápis „1 500“ / „1500,50“ / „1 500,5“ (NBSP) | — | 1 500 / 1 500,50 / 1 500,5 | shodné | „2 978 Kč“ / „2 979 Kč“ (cs‑CZ i en‑US) | ano |
| vlastní: zápis „10.000“ | — | nejednoznačné → odmítnout nebo 10 000 Kč | `app.js:26` → 10 | „19,85 Kč“, „10,00 Kč v lednu 2005…“ | **NE** (INF‑03) |
| vlastní: prázdné pole | — | výzva | 0 | „0,00 Kč … má stejnou kupní sílu jako 0,00 Kč“ | NE (INF‑05) |
| vlastní: „-5“; „abc“ | — | odmítnout | `app.js:85` odmítá | „Zadejte částku jako číslo, např. 10 000.“ (`chyba-360.png`) | ano |

Termíny, víkendy a svátky se v této aplikaci nevyskytují (měsíční řada, žádné lhůty). Zaokrouhlení: ČSÚ nic nepředepisuje; aplikace zobrazuje Kč bez haléřů od 100 Kč, procenta na 1 desetinné místo ve větě a na 2 v hlavní hodnotě výnosu/mzdy – konzistentní, výpočet probíhá bez mezizaokrouhlení.

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: přepočet částky „10 000 Kč v lednu 2005 odpovídá dnes X Kč“ (i obráceně) | splněno | výchozí stav 19 850 Kč, tlačítko ⇄ (`index.html:40`, `app.js:261–268`), `vysledek-360.png`, prohlizec.json V1/V2 |
| Cíl 2: reálný výnos spořicího účtu / investice za období, roste/ztrácí | splněno | `app.js:104–124`, `vynos-360.png` („-2,15 % ročně“, červeně) |
| Cíl 3: reálná mzda dřív a dnes, polepšil/pohoršil, o kolik % | splněno | `app.js:126–140`, `mzda-360.png` |
| Statický web v češtině | splněno | `index.html` (`lang="cs"`), žádný build |
| Čisté HTML + CSS + JS (ES moduly), Chart.js z cdnjs | splněno | `index.html:10–11`, `app.js` `import … from './inflation.js'` |
| Výpočty v `inflation.js` bez vazby na DOM | částečně | `inflation.js` je bez DOM a importovatelný v Node (porovnání 45/45); ale čtení vstupu (`parseInput`) a volba směru/průměru při obráceném přepočtu jsou v `app.js:26, 94–96` (INF‑04) |
| `scripts/update-cpi.mjs` stáhne z otevřených dat ČSÚ bazický index (úhrn, měsíčně, 2015 = 100) a uloží `data/cpi.json` `{ "RRRR-MM": index }`; web čte jen tento soubor, ČSÚ z prohlížeče nevolá | splněno | `--dry-run` v kopii 5. 11. 2026 (381 měsíců, bez děr); síť v prohlížeči: jen vlastní původ + cdnjs (prohlizec.json `sit360`) |
| GitHub Action jednou měsíčně po zveřejnění, commit změněných dat | splněno | `.github/workflows/update-cpi.yml` (cron `17 7 11-15 * *`, commit jen při změně, kontrola práva zápisu); běh na serveru z klonu nelze doložit |
| Testy `node --test`, nasazení GitHub Pages | splněno | `testy.txt` 27/27 (2. běh 5. 11. 2026 08:41 UTC 27/27); živý web 200, 5 souborů SHA‑256 = `main` |
| „Než začneš psát kód“: vypsat adresu CSV, sloupce, poznání úhrnu | splněno (dokumentováno) | `README.md:16–31` uvádí obě adresy, sloupce a filtr; vlastní parser se stejným filtrem dává stejná data |
| Vzorce: přepočet, kumulativní, průměrná roční, reálný výnos, reálná mzda | splněno | tabulka výše, `prepocet.txt` |
| Měsíc bez dat → poslední dostupný a napsat to | splněno | prohlizec.json D1 („Za prosinec 2026 zatím data nejsou…“) |
| Obrazovka 1: tři záložky, výběr měsíce a roku od 1995 do posledního dostupného | částečně | záložky s rolí tab a šipkami (`sipkaNaZalozce`); roky 1995–2026, ale u roku 2026 lze zvolit i říjen–prosinec bez dat (řešeno poznámkou) – INF‑08 |
| Obrazovka 2: výsledek velkým písmem a pod ním věta vysvětlení | splněno | `.result-value` 2–3 rem, `vysledek-360.png` (vysvětlení jsou dvě věty) |
| Obrazovka 3: graf cenové hladiny za období a meziroční inflace po měsících | splněno | `vysledek-360.png`; graf má 261 bodů 1/2005–9/2026, poslední meziroční hodnota 2,51 %, hladina 100 → 198,5 |
| Obrazovka 4: patička – zdroj ČSÚ, datum posledních dat, „Orientační výpočet“ | splněno | `index.html:135–137`, „Poslední data: září 2026“ |
| Kritérium: 5 testovacích případů v `node --test` | splněno | `test/inflation.test.mjs:14–35`, hodnoty v testech odpovídají mému výpočtu |
| Kritérium: `cpi.json` od ledna 1995 po poslední měsíc; test na díry | splněno | `test/cpi-data.test.mjs:90–94` (`validateSeries`), data 1995‑01 … 2026‑09 |
| Kritérium: mobil 360 px bez vodorovného posuvníku | splněno | `preteka: false` ve všech stavech (úvod, výsledek, chyba, výnos, mzda; 360 i 1440) |
| Kritérium: README česky – spuštění, ruční aktualizace, nasazení | splněno | `README.md:49–123` |
| Postup: na konci porovnat jeden přepočet s oficiální meziroční inflací ČSÚ | splněno | skript vypisuje „meziročně 2026‑09: 2,5 %“; vlastní kontrola 2,511 % vs. ČSÚ 2,5 % |

## Nálezy
### INF-01 · Vysoká · Mobil a přístupnost · Aktivní záložka nesplňuje kontrast písma 4,5:1 (axe color‑contrast, serious)
- **Kde:** `styles.css:105` (`.tabs [role="tab"][aria-selected="true"] { background: var(--accent); color: #fff; }`), `styles.css:9` (`--accent: #2a78d6`), `styles.css:29,48` (tmavý režim `#3987e5`); `index.html:25–27`
- **Reprodukce:** otevřít stránku (360 px) → axe WCAG 2.2 A/AA hlásí 1× `color-contrast` (serious) na `#tab-convert`; po přepnutí na „Reálná mzda“ na `#tab-wage`; v tmavém režimu (`prefers-color-scheme: dark`) totéž. Očekáváno: bílé písmo 15,2 px / tloušťka 600 (není „velký text“) potřebuje kontrast ≥ 4,5:1 (WCAG 1.4.3). Skutečnost: bílá na `#2a78d6` = 4,42:1, na `#3987e5` (tmavý režim) = 3,64:1 (výpočet relativní luminance; `prohlizec.json` → `barvyZalozky`, `axe360_convert`, `axe360_wage`, `axe360_dark`; `uvod-kontrola.json`; živý web `zivy-kontrola.json`).
- **Dopad na uživatele:** slabozrací uživatelé hůř rozeznají, který ze tří nástrojů je právě zapnutý – nejdůležitější navigační prvek stránky.
- **Doporučená oprava:** pro aktivní záložku použít tmavší pozadí (např. `var(--accent-ink)` `#1d5fae`, ≈ 6,5:1 s bílou) a v tmavém režimu tmavé písmo na světlém pozadí; nebo zvětšit písmo záložek na ≥ 18,66 px tučně. Po opravě znovu axe v obou režimech.
- **Ověření:** reprodukováno 2× (nezávislé běhy prohlizec.mjs 1 a 2, navíc úvodní kontrola a živý web) · skeptik:

### INF-02 · Vysoká · Mobil a přístupnost · Posuvná tabulka hodnot není dosažitelná klávesnicí (axe scrollable‑region‑focusable, serious)
- **Kde:** `styles.css:194` (`.table-scroll { max-height: 360px; overflow: auto; }`), `index.html:121–128` (`<div class="table-scroll">` bez `tabindex`)
- **Reprodukce:** rozbalit „Zobrazit hodnoty v tabulce“ (při výchozím období 261 řádků) → axe hlásí `scrollable-region-focusable` (serious, WCAG 2.1.1/2.1.3) na `.table-scroll`; Tab z `summary` přeskočí rovnou na odkaz ČSÚ v patičce (`uvod-kontrola.json` → `tab`), oblast nelze zaostřit ani odrolovat šipkami. Očekáváno: každý posuvný obsah musí jít ovládat klávesnicí. Skutečnost: bez myši jsou čitelné jen první řádky (do výšky 360 px, cca 10 měsíců).
- **Dopad na uživatele:** uživatel klávesnice nebo přepínačů (a často i čtečky) se nedostane k hodnotám indexu a meziroční inflace starších měsíců, které jsou jedinou textovou alternativou grafů.
- **Doporučená oprava:** `.table-scroll` doplnit `tabindex="0"`, `role="region"` a `aria-label="Tabulka hodnot"` (plus viditelný `:focus-visible`), nebo tabulku nerolovat a místo toho omezit/stránkovat řádky.
- **Ověření:** reprodukováno 2× (prohlizec.mjs běh 1 a 2: `axe360_convert`, `axe360_wage`) · skeptik:

### INF-03 · Střední · Výpočty (propojení formuláře) · Zápis „10.000“ se čte jako 10 Kč
- **Kde:** `app.js:26` (`parseInput = (s) => Number(String(s).replace(/[\s ]/g, '').replace(',', '.'))`), pole `amount`, `rate`, `wageThen`, `wageNow`
- **Reprodukce:** do „Částka (Kč)“ napsat `10.000` (leden 2005 → září 2026) → očekáváno 10 000 Kč → 19 850 Kč, nebo odmítnutí s hláškou (tečka jako oddělovač tisíců je v českém zápisu částek běžná a zápis je nejednoznačný) → skutečnost „19,85 Kč“ a věta „10,00 Kč v lednu 2005 má stejnou kupní sílu jako 19,85 Kč“ (`prohlizec.json` P3, cs‑CZ; chování je nezávislé na lokalizaci, pole je `type=text`). Zápis `1.500.000` dá NaN a hlášku, `10.000` ne.
- **Dopad na uživatele:** výsledek je 1 000× menší; věta částku zopakuje, takže pozorný uživatel chybu odhalí – proto Střední, ne vyšší.
- **Doporučená oprava:** tečku následovanou přesně třemi číslicemi (a bez čárky) brát jako oddělovač tisíců, jinak tečku odmítnout s hláškou „desetinná místa oddělte čárkou“; doplnit test (viz INF‑04).
- **Ověření:** reprodukováno 2× (prohlizec.mjs běh 1 a 2; porovnani.mjs 2 běhy) · skeptik:

### INF-04 · Střední · Testy · Čtení vstupu a logika směru přepočtu jsou v `app.js` a bez testu
- **Kde:** `app.js:26` (`parseInput`), `app.js:94–96` (chronologický směr změny cen a průměrná roční inflace při obráceném přepočtu: `change = from < to ? cum : 1 / (1 + cum) - 1`), `app.js:85, 109–110, 131` (kontroly vstupu); `test/inflation.test.mjs` testuje jen `inflation.js`
- **Reprodukce:** `node --test` 27/27, ale žádný test nepokrývá „1 500“, „1500,50“, „10.000“ (INF‑03), prázdné pole (INF‑05), záporné číslo ani větu při prohozených měsících; `app.js` nelze v Node importovat (po načtení volá `init()` nad `document`), takže se tato logika testovat ani nedá.
- **Dopad na uživatele:** regrese v propojení formuláře s výpočtem projde CI, i když vzorce zůstanou správné.
- **Doporučená oprava:** přesunout `parseInput` a výpočet „změna cen v chronologickém směru + průměr ročně“ do `inflation.js` (nebo modulu bez DOM) a přidat testy pro uvedené vstupy a pro obrácený přepočet.
- **Ověření:** reprodukováno 2× (statická kontrola kódu, `testy.txt` + druhý běh testů) · skeptik:

### INF-05 · Nízká · Texty · Prázdná částka vrací „0,00 Kč … má stejnou kupní sílu jako 0,00 Kč“ místo výzvy
- **Kde:** `app.js:82, 85` (`Number('') = 0`, kontrola `!(amount >= 0)` nulu propustí)
- **Reprodukce:** smazat obsah pole „Částka (Kč)“ → očekáváno „Zadejte částku…“ → skutečnost hodnota „0,00 Kč“ a věta s dvěma nulami (`prohlizec.json` P4).
- **Dopad na uživatele:** nic škodlivého, jen nesmyslná věta.
- **Doporučená oprava:** prázdný řetězec (po odstranění mezer) považovat za chybějící vstup a zobrazit výzvu.
- **Ověření:** reprodukováno 2× · skeptik:

### INF-06 · Nízká · Soukromí a bezpečnost · Chart.js z cdnjs bez `integrity`/`crossorigin` a bez CSP
- **Kde:** `index.html:10`
- **Reprodukce:** `<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js" defer>` bez atributu `integrity`; stránka nemá `Content-Security-Policy`. CDN je výjimka povolená zadáním, ale bez SRI by změněný soubor na CDN běžel se všemi právy stránky.
- **Dopad na uživatele:** nízký (stránka nezpracovává osobní údaje a nic neukládá), jde o zpevnění.
- **Doporučená oprava:** doplnit `integrity="sha384-…"` a `crossorigin="anonymous"` pro verzi 4.4.1 a `<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; img-src 'self' data:; style-src 'self'">`.
- **Ověření:** reprodukováno 2× (zdroj + síťový záznam obou běhů) · skeptik:

### INF-07 · Nízká · Texty a citlivá témata · Chybí výslovné „nejde o finanční poradenství“
- **Kde:** `index.html:137` (patička: „Orientační výpočet. Index popisuje průměrný spotřební koš…“), `README.md:12`
- **Reprodukce:** nástroj „Reálný výnos“ hodnotí výnos investice proti inflaci, ale nikde není věta, že nejde o investiční doporučení. Požadavek zadání („Orientační výpočet“) splněn je.
- **Dopad na uživatele:** malý; text jinak neslibuje víc, než aplikace umí.
- **Doporučená oprava:** do patičky doplnit „Nejde o finanční ani investiční poradenství.“
- **Ověření:** reprodukováno 2× · skeptik:

### INF-08 · Nízká · Shoda se zadáním · Výběr měsíce nabízí i říjen–prosinec 2026, za které data nejsou
- **Kde:** `app.js:41, 45` (měsíce vždy 1–12, roky `lastYear … 1995`)
- **Reprodukce:** v roce 2026 zvolit „prosinec“ → aplikace správně počítá se zářím 2026 a napíše poznámku (zadání to vyžaduje). Zadání obrazovky ale říká „výběr měsíce a roku od 1995 do posledního dostupného“ – nabízené měsíce bez dat matou a poznámka se objeví až po výběru.
- **Dopad na uživatele:** jen zmatení; výsledek je správný a vysvětlený.
- **Doporučená oprava:** u posledního roku nabídnout jen měsíce s daty (poznámku ponechat pro adresu `#hash` nebo budoucí měsíce z jiného zdroje), nebo měsíce bez dat označit v nabídce.
- **Ověření:** reprodukováno 2× · skeptik:

### INF-09 · Nízká · Mobil a přístupnost · Lámání slov uprostřed v tabulce na 360 px („červen‑ec“, „Mezir‑očně“)
- **Kde:** `styles.css:64` (`body { overflow-wrap: anywhere; }`), tabulka `index.html:124–127`
- **Reprodukce:** 360 px, rozbalit tabulku → hlavička „Mezir očně“ a buňka „červen ec 2026“ zalomené uprostřed slova (`vysledek-360.png`). Stránka nepřetéká, jen se hůř čte.
- **Dopad na uživatele:** kosmetický.
- **Doporučená oprava:** v tabulce `white-space: nowrap` pro první sloupec a hlavičku (nebo `hyphens: manual` a kratší popisky „Meziročně“ → „Mezi‑ročně“ s `&shy;`).
- **Ověření:** reprodukováno 2× (snímky obou běhů shodné) · skeptik:

## Neslité větve
Žádné (`git branch -a`: jen `main` a `origin/main`).

## Co se nepodařilo ověřit a předpoklady
- Běh GitHub Action `update-cpi.yml` na serveru GitHubu (právo zápisu, skutečný commit) nelze z klonu doložit; ověřen jen lokální `--dry-run` v kopii (`/tmp/revize/scratch/inflacni-kalkulacka/repo`, 5. 11. 2026, přes proxy `NODE_USE_ENV_PROXY=1`), který našel obě CSV a vrátil řadu shodnou s `data/cpi.json`. Nastavení GitHub Pages a „Read and write permissions“ znám jen z README.
- Krok zadání „Než začneš psát kód … vypiš adresu souboru a sloupce“ je proces, který nejde zpětně doložit; posuzuji podle README, kde jsou adresy, sloupce i filtr uvedeny a odpovídají skutečným CSV.
- `app.js` nelze importovat v Node (volá `init()` nad DOM), proto jsou kontroly vstupu a `parseInput` ověřeny jen v prohlížeči (2 běhy) a opsány v `inflacni-kalkulacka-porovnani.mjs` s odkazem na řádky.
- Chování navázání řad při případné budoucí revizi hodnot ČSÚ v překryvu (koeficient ≠ 1 by škáloval nové měsíce) je hypotetické; dnes je koeficient přesně 1,00000.
- Předpoklad: referenční výpočet používá datový soubor aplikace `data/cpi.json`; jeho shoda s CSV ČSÚ je ověřena nezávisle (`data-vs-csu.txt`, vlastní parser), takže na výsledky nemá vliv kód aplikace.
- Rozdíl 0,01 p. b. mezi meziroční inflací z bazického indexu (2,511 %) a oficiální hodnotou (2,5 %) je dán zaokrouhlením indexu ČSÚ na 1 desetinné místo; README to uživateli vysvětluje, v aplikaci samotné tato věta není (není to nález, zobrazení na 1 desetinné místo se s ČSÚ shoduje ve všech měsících roku 2026).
