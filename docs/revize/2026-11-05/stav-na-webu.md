# Stav nálezů revize z 5. 11. 2026 na sjednoceném webu

Revize v této složce hodnotila **původní repozitáře** (plan48, penzijko-kompas, mam-eet, …). Web převzal výpočetní moduly skoro beze změny, ale přepsal rozhraní, CSS, grafy a formuláře. Tahle tabulka říká, které nálezy platí i pro web `frankie851/ceske-kalkulacky` (stav `main` k 12. 11. 2026, commit `78a6f15`, před opravami) a kde jsou opravené.

**Jak se ověřovalo:** výpočetní nálezy přepočtem v Node nad moduly webu (`src/nastroje/<id>/`), textové nálezy podle textů webu (`vystup.js`, `index.njk`, `rules.json`), přístupnost podle markupu, tokenů v `src/css/main.css` a výsledků `npm run kontrola` (axe serious/critical ve světlém i tmavém režimu, 360 px). Kritické a vysoké nálezy ověřoval druhý průchod znovu a opravy mají vlastní testy.

## Souhrn

Stav k 13. 11. 2026, po sloučení PR #14 až #33 do `main`.

- Nálezů: **136** (kritická 1, vysoká 18, střední 61, nízká 56).
- Na webu před opravami platilo 79, částečně 25, neplatilo 32 (sloupec „Stav na webu“).
- Z 104 nálezů, které na webu platily nebo platily částečně: **opraveno 102**, ověřeno bez potřeby změny 1, částečně 1, zbývá 0.
- Neopravené části a drobnosti, které se objevily při opravách, jsou v seznamu k další práci na konci.

| PR | Obsah |
|---|---|
| [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) | Výpověď: VYP-01 (kritický), VYP-02, VYP-08 |
| [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) | Rodičovská: ROD-01 až ROD-06, ROD-10 |
| [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) | OSVČ 2027 a Slevy: EET-01, EET-08, SLV-01, SLV-02 |
| [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) | Penze, odpočet DPS po měsících: P48-01, P48-02, P48-05, PEN-01, PEN-08, SLV-05 |
| [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) | Cestovní příkaz: CES-01, CES-02, CES-06 |
| [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) | Spot, nebo fix?: SPOT-01, SPOT-02, SPOT-05 |
| [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) | Sdílené čtení čísel: PEN-02, PEN-04, VYP-03, INF-03, EET-04, EET-14, DLU-04, SPOT-08, SLV-04 |
| [#21](https://github.com/frankie851/ceske-kalkulacky/pull/21) | Tento soubor (první verze) |
| [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22) | Střední – penze: P48-04, PEN-05, PEN-06, PEN-07 |
| [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) | Střední – Mám EET? a OSVČ: EET-03, EET-05, EET-06, EET-07, EET-09, EET-11 |
| [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) | Střední – Výpověď a Rodičovská: VYP-04, VYP-05, ROD-07, ROD-09, ROD-11 |
| [#25](https://github.com/frankie851/ceske-kalkulacky/pull/25) | Střední – Spot: SPOT-03, SPOT-06, SPOT-07 |
| [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) | Střední – Slevy, Inflace, Cestovní příkaz: SLV-06, SLV-08, INF-04, CES-04, CES-05 |
| [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) | Střední – Bydlometr: BYD-01 až BYD-07 |
| [#28](https://github.com/frankie851/ceske-kalkulacky/pull/28) | Střední – Přijímačky: PRI-02 až PRI-05 |
| [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) | Střední – Dluhy: DLU-01, DLU-02, DLU-03, DLU-06, DLU-07 |
| [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) | Nízké – Mám EET?, Spot, Inflace: EET-10, EET-13, SPOT-09 až SPOT-12, INF-08 |
| [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) | Nízké – penze, Výpověď, Rodičovská: P48-07 až P48-09, PEN-10, PEN-12, VYP-06, VYP-07, ROD-12 až ROD-14 |
| [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) | Nízké – Bydlometr, Slevy, Cestovní příkaz: BYD-08, BYD-09, BYD-11, SLV-09, SLV-10, CES-08, CES-10 až CES-12 |
| [#33](https://github.com/frankie851/ceske-kalkulacky/pull/33) | Nízké – Přijímačky a Dluhy: PRI-06, PRI-07, PRI-09, DLU-09 |

## Tabulka nálezů

Stav = stav na webu před opravami. Důkaz = soubor:řádek na webu, výsledek přepočtu nebo kontroly. Oprava = stav po opravách k 13. 11. 2026 a PR, ve kterém je nález opravený.

| Kód | Záv. | Nástroj na webu | Stav na webu | Důkaz | Oprava |
|---|---|---|---|---|---|
| P48-01 | V | `src/nastroje/plan48` | platí | `calc.js:44–53` `dpsRocne − 20 400`; rada „55 000 Kč mimořádně“ místo 48 000 Kč (Node) | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| P48-02 | S | `src/nastroje/plan48` | platí | `test/calc.test.js:94–96` čeká 20 600 (ověřeno v Node), `:144` čeká `48000 + 7000`; test měsíčního profilu chybí | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| P48-03 | S | `src/nastroje/plan48` | neplatí | `app.js:16–19` přijme čárku; `:49` hlásí věk mimo 0–120; `:56` hlásí zápornou částku; `index.njk:40` měsíce jsou výběr | — |
| P48-04 | S | `src/nastroje/plan48` | částečně | `index.njk:37,142` a `rules.json:42` uvádějí podmínku u DIP; `vystup.js:87–90` radí DIP/ŽP/penzijko bez upozornění na vrácení podpory a bez podmínek ŽP | opraveno v [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22) |
| P48-05 | S | `src/nastroje/plan48` | platí | `rules.json:10, 60, 67` „§ 15a“; `calc.js:39` „(§ 15a ZDP)“ | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| P48-06 | S | `src/nastroje/plan48` | neplatí | `app.js:48` prázdný věk = hláška „Vyplň věk“; `:154` výpočet se při chybě nespustí | — |
| P48-07 | N | `src/nastroje/plan48` | platí | `rules.json:108–121` zdroje návrhu jsou jen finance.cz, dumfinanci.cz, ČSPS; tisk 285 chybí | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| P48-08 | N | `src/nastroje/plan48` | částečně | `index.njk:66` štítek návrhu je ve výsledkové kartě; sekce projekce `index.njk:89–103` štítek nemá | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| P48-09 | N | `src/nastroje/plan48` | platí | `rules.json:40` „část příjmů nad 36násobek“; `vystup.js:100` „Obvykle musí dorazit do 20. 12.“ bez zdroje; `rules.json:107` „8/2026“ bez tisku | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| PEN-01 | V | `src/nastroje/penzijko-kompas` | platí | `calc.js:93–110` konec TF bez ohledu na sadu; sada 2026 → 852 538 Kč místo 655 378 Kč | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| PEN-02 | V | `src/nastroje/penzijko-kompas` | částečně | pole už `type=text`, čárka funguje; `app.js:25–35` „1.500“ → 1,5, poplatek 85 % projde | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| PEN-03 | V | `src/nastroje/penzijko-kompas` | neplatí | `.srovnani` na webu není; `.stat > span` 6,6:1 (`main.css:661`); axe 0 chyb | — |
| PEN-04 | S | `src/nastroje/penzijko-kompas` | částečně | `app.js:25–34` odmítá záporné a nečíselné hodnoty, prázdné pole hlásí (`:55, :64`); věk 150 projde s příspěvkem 340 Kč (Node) | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| PEN-05 | S | `src/nastroje/penzijko-kompas` | platí | `rules.json:17` a `:69` pořád `mf.gov.cz/cs/financni-trh/penzijni-sporeni` | opraveno v [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22) |
| PEN-06 | S | `src/nastroje/penzijko-kompas` | platí | `rules.json:150–185` výnosy 1,5/3/4,5/7 % bez zdroje; `:48` jen „předpoklad, ne slib“ | opraveno v [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22) |
| PEN-07 | S | `src/nastroje/penzijko-kompas` | platí | `test/calc.test.js:166–179` TF → konzervativní i v sadě 2026; `:60–66` tolerance; `:222` 5 let = 0; `vkladProMaxPrispevek` bez testu | opraveno v [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22) |
| PEN-08 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:11, 64` „(§ 15a)“; `calc.js:35` „(§ 15a ZDP)“ | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| PEN-09 | N | `src/nastroje/penzijko-kompas` | neplatí | `zobrazeni.js:44–51` spojí navazující pásma; Node: věk 10, návrh 2027 → „Vyšší sazba platí do 30. narozenin.“ | — |
| PEN-10 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:203–206` bez zdroje; `calc.js:208` `< zdarmaPoLetech`; 5 let → „převod je zdarma“ (`zobrazeni.js:217–219`) | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| PEN-11 | N | `src/nastroje/penzijko-kompas` | neplatí | žádný skript z CDN; `zaklad.njk:32–34` jen lokální moduly, grafy jsou vlastní SVG | — |
| PEN-12 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:56` `platnostOd 2026-01-01`; `:97–106` zdroje návrhu MF prezentace a Finance.cz, tisk 285 chybí | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| PEN-13 | N | `src/nastroje/penzijko-kompas` | neplatí | `zobrazeni.js:152–164` tabulka s `data-label`; `main.css:753–759` na mobilu řádky skládá, sloupec Poplatky neskrývá | — |
| EET-01 | V | `src/nastroje/mam-eet` | platí | `osvc.js:31–53, 105–116` jen minimum 35 %; `rules.json:719–720` bez podílu pro začínající | opraveno v [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| EET-02 | V | `src/nastroje/mam-eet` | neplatí | graf přepsaný: `osvc-app.js:281` `<rect>` bez `aria-label`, popisek na obalu `role="group"` (`:153`); axe 0 chyb (`docs/kontroly/web-vysledky.json`) | — |
| EET-03 | S | `src/nastroje/mam-eet` | platí | `rules.json:832–836` `monthly 9662`; `test/osvc.test.js:41–49` čeká 115 944 / 132 744 | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-04 | S | `src/nastroje/mam-eet` | platí | `app.js:235–236` `Number(raw)`; Node: „20.000“ → 20 Kč, −5000 → 0 Kč | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| EET-05 | S | `src/nastroje/mam-eet` | částečně | `osvc-app.js:84–90` chybu u pole ukáže; starý výsledek ale zůstane na obrazovce | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-06 | S | `src/nastroje/mam-eet` | platí | `osvc.js:151–157` limit jen podle `flatRateId`; `rules.json:994` nápověda bez podmínky 75 % | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-07 | S | `src/nastroje/mam-eet` | platí | `osvc.js:110` `zisk <= p.sideThreshold`; Node: 123 991 → 0 Kč, 123 992 → 19 914 Kč | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-08 | S | `src/nastroje/mam-eet` | platí | `rules.json:765–767` zdroj 24 900 Kč je NV 164/2026, ne sdělení 171/2026 Sb.; také `:74–75` | opraveno v [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| EET-09 | S | `src/nastroje/mam-eet` | platí | chyby v `docs/zadani.md:503, 505, 558–559` beze změny (zadání se v této práci nemění) | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-10 | N | `src/nastroje/mam-eet` | platí | `osvc.js:39` `ceilKc(avg × 0,5)` = 25 832, `:124` × 12 = 309 984 | opraveno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) |
| EET-11 | N | `src/nastroje/mam-eet` | platí | `osvc.js:47` `Math.floor(avg × 2,4 + EPS)` = 123 991 | opraveno v [#23](https://github.com/frankie851/ceske-kalkulacky/pull/23) |
| EET-12 | N | `src/nastroje/mam-eet` | neplatí | `h1` je v hlavičce stránky (`komponenty/rozvrzeni.njk:117`), otázky `h2` (`app.js:125`); axe 0 chyb | — |
| EET-13 | N | `src/nastroje/mam-eet` | platí | `rules.json:846` „(výpočet 1. pásma 2026)“; odkazy na e-sbirka.gov.cz `rules.json:55–75` | opraveno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) |
| EET-14 | N | `src/nastroje/mam-eet` | platí | `osvc-app.js:28–33` a `app.js:154–156` `Number()` vezme „1e6“ jako 1 000 000 | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SPOT-01 | V | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:128–143` D45d/D56d/D57d → TDD6, D61d → TDD7 | opraveno v [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-02 | V | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:374–391` D61d NT i ve všední dny; `calc.js:182–185` jen `weekend` | opraveno v [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-03 | S | `src/nastroje/spot-nebo-fix` | částečně | štítek „Pravidla ověřena“ (`nastroj.njk:20`, `rules.json:3`); CV ERÚ 14/2025 v `rules.json:7–45` chybí; `vystup.js:329` ukazuje POZE 0,60 Kč/kWh, i když se účtuje 0 Kč | opraveno v [#25](https://github.com/frankie851/ceske-kalkulacky/pull/25) |
| SPOT-04 | S | `src/nastroje/spot-nebo-fix` | neplatí | `ui.js:70–101` prázdné, nesmyslné i mimo rozsah hlásí s `aria-invalid`; výpočet neproběhne | — |
| SPOT-05 | S | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:126, 134` „D35d – akumulace 16 h“, „D56d – tepelné čerpadlo 22 h“; `rules.json:304` „22 hodin“ | opraveno v [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-06 | S | `src/nastroje/spot-nebo-fix` | částečně | formulář pokrývá e2e (`test/e2e/spot-nebo-fix.test.js:71, 125`); `calc.test.js` netestuje přiřazení TDD, okna NT, pásma jističe | opraveno v [#25](https://github.com/frankie851/ceske-kalkulacky/pull/25) |
| SPOT-07 | S | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:413–418` `distributors.*.source` je ceník ČEZ Prodej; cenový výměr ERÚ 14/2025 chybí | opraveno v [#25](https://github.com/frankie851/ceske-kalkulacky/pull/25) |
| SPOT-08 | S | `src/nastroje/spot-nebo-fix` | částečně | pole `type=text`, `ui.js:52–56` přijme čárku; „3.500“ ale projde jako 3,5 | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SPOT-09 | N | `src/nastroje/spot-nebo-fix` | platí | jen zdokumentováno: `rules.json:281` ceny 2026 i pro listopad a prosinec 2025 | částečně v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30): ceny 2025 se nedoplnily, měsíce mimo rok cen mají upozornění a POZE 2025 podle CR ERÚ 11/2024 |
| SPOT-10 | N | `src/nastroje/spot-nebo-fix` | platí | `calc.js:435–436` extrapoluje přes `scale`; `ui.js:313–319` | opraveno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) |
| SPOT-11 | N | `src/nastroje/spot-nebo-fix` | platí | plán v `.github/workflows/aktualizace-spot.yml:9–10`; běh na GitHubu z repozitáře nejde doložit | ověřeno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30): plánovaný běh 9. 11. 2026 proběhl; opraven test, který by první automatický PR s daty shodil |
| SPOT-12 | N | `src/nastroje/spot-nebo-fix` | částečně | `rules.json:283` „do 16 nejlevnějších čtvrthodin téhož dne“; optimismus (ceny známé dopředu) dál nezmíněn | opraveno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) |
| SPOT-13 | N | `src/nastroje/spot-nebo-fix` | neplatí | favicon v `_includes/layouty/zaklad.njk:23`; konzole bez chyb | — |
| SPOT-14 | N | `src/nastroje/spot-nebo-fix` | neplatí | formulář je v DOM před výsledky (`index.njk:18–89`), bez CSS `order`; axe 0 chyb | — |
| BYD-01 | S | `src/nastroje/bydlometr` | platí | `js/mortgage.js:135–138`, `vystup.js:392–400` jen 0,25 %/rok se stropem 1 %, bez § 117 odst. 5 a § 117a; 300 000 Kč → 3 000 Kč | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-02 | S | `src/nastroje/bydlometr` | platí | `mortgage.js:121–126`, `vystup.js:381–385`; smlouva 2021, splátka v den konce fixace → „Zkontroluj smlouvu“ místo 0 Kč | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-03 | S | `src/nastroje/bydlometr` | platí | `ui.js:114, 142, 183` `if (chyba) return;` nechá starý výsledek | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-04 | S | `src/nastroje/bydlometr` | částečně | `taxSaving` se nevypisuje; DTI se nepočítá, jen věta `vystup.js:363`; `rules.json:160` nevyužito | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-05 | S | `src/nastroje/bydlometr` | platí | Brno, 60 m², 1,5 mil. Kč, 40 let → „LTV 80 %, ale limit je 80 %“ (`vystup.js:472`); simulace pokračuje (`rentbuy.js:30–34`) | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-06 | S | `src/nastroje/bydlometr` | částečně | formulář pokrývá e2e; bankovní testy jen s tolerancí (`test/mortgage.test.js:33–39`); parser `ui.js:30` bez testu | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-07 | S | `src/nastroje/bydlometr` | platí | `rules.json:22–50` kb.cz, banky.cz, hyponamiru.cz; `rules.json:48` „§ 15 odst. 3“; `rules.json:248` „smlouvy do 31. 12. 2020“ | opraveno v [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27) |
| BYD-08 | N | `src/nastroje/bydlometr` | částečně | tykání jednotné, `aria-invalid` nastaveno; zbývá „Prodloužit splatnost o 0 let“ (`vystup.js:71, 258`) | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| BYD-09 | N | `src/nastroje/bydlometr` | částečně | čísla natvrdo zmizela (`vystup.js:392–400` z rules); nevyužité položky `defaults.json:16–40`, `rules.json:159–175, 245` | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| BYD-10 | N | `src/nastroje/bydlometr` | neplatí | favicon v `zaklad.njk:23`; konzole bez chyb | — |
| BYD-11 | N | `src/nastroje/bydlometr` | platí | záporný růst jen u cen (`vystup.js:91`), u nájmů a výnosu ne (`ui.js:62`) | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| SLV-01 | V | `src/nastroje/slevy-2027` | částečně | UI chybu maskuje (`app.js:357` `ROK - 7`), ale `slevy.js:88–93` `skolkovne()` věk neřeší a stav formuláře zůstává | opraveno v [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| SLV-02 | V | `src/nastroje/slevy-2027` | platí | `slevy.js:101–117` bez věku 18/26 a studia; dítě 3/2001 → 15 204 Kč (Node) | opraveno v [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| SLV-03 | S | `src/nastroje/slevy-2027` | neplatí | `app.js:67` pole `type="text"`; `:41–43` `/^\d+$/`, „1500,50“ dostane hlášku | — |
| SLV-04 | S | `src/nastroje/slevy-2027` | platí | `app.js:236` „Úvěrová smlouva je uzavřená před 1. 1. 2021“; `vystup.js:61`; `rules.json:256` | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SLV-05 | S | `src/nastroje/slevy-2027` | platí | `slevy.js:123` `penzijko − 20 400`, `rules.json:237`; Node: 48 000 → 27 600 | opraveno v [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| SLV-06 | S | `src/nastroje/slevy-2027` | platí | `test/slevy.test.js:129–131` fixuje `stareSmlouva`; test dítěte 18/26 let chybí | opraveno v [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) |
| SLV-07 | S | `src/nastroje/slevy-2027` | neplatí | `app.js:46–49` `overCisla` hlásí chyby; `:128` měsíce výběrem; `:178` rok dítěte s rozsahem | — |
| SLV-08 | N | `src/nastroje/slevy-2027` | platí | `slevy.js:274` `zakladDane − stari − uroky`; Node: strop 60 300 místo 90 000 | opraveno v [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) |
| SLV-09 | N | `src/nastroje/slevy-2027` | platí | `rules.json:271` „zákona č. 66/2022 Sb. ve znění zákona č. 24/2025 Sb.“ | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| SLV-10 | N | `src/nastroje/slevy-2027` | platí | `slevy.js:63–64` bez dítěte bere 12 měsíců; `slevy.js:17–23` `mladsiNez` | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| SLV-11 | N | `src/nastroje/slevy-2027` | neplatí | `index.njk:20` bez `aria-live`; `app.js:293` jen přesouvá fokus | — |
| INF-01 | V | `src/nastroje/inflacni-kalkulacka` | neplatí | `inflacni-kalkulacka.css:18` + tokeny `main.css:81, 83` → 6,15:1 (světlý) a 8,02:1 (tmavý); axe 0 chyb | — |
| INF-02 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | tabulka v `div.table-wrap role="region" tabindex="0"` (`src/js/graf.js:269`) | — |
| INF-03 | S | `src/nastroje/inflacni-kalkulacka` | platí | `ui.js:21–24`: „10.000“ → 10 bez hlášky | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| INF-04 | S | `src/nastroje/inflacni-kalkulacka` | částečně | e2e `test/e2e/inflacni-kalkulacka.test.js:81, 118`; parser `ui.js:21` bez testu „10.000“ a „1 500“ | opraveno v [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) |
| INF-05 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `ui.js:50` prázdné pole → hláška, výsledek se nepřepíše | — |
| INF-06 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | žádný skript z CDN, grafy vlastní SVG, CSP `zaklad.njk:8` | — |
| INF-07 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `_includes/layouty/nastroj.njk:60` upozornění „Nejde o investiční… poradenství“ | — |
| INF-08 | N | `src/nastroje/inflacni-kalkulacka` | platí | `vystup.js:277–280` nabízí 12 měsíců i pro poslední rok dat | opraveno v [#30](https://github.com/frankie851/ceske-kalkulacky/pull/30) |
| INF-09 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `main.css:165` `overflow-wrap: break-word`; tabulka v posuvném `.table-wrap` (`main.css:741`) | — |
| PRI-01 | S | `src/nastroje/prijimacky` | neplatí | opraveno při převzetí: `ics.js:4` `'\;'`, `tests/ics.test.js:27` | — |
| PRI-02 | S | `src/nastroje/prijimacky` | platí | `ui.js:21–26, 286` rozsah nehlídá; čekané body 150 → „jistota“ bez hlášky | opraveno v [#28](https://github.com/frankie851/ceske-kalkulacky/pull/28) |
| PRI-03 | S | `src/nastroje/prijimacky` | částečně | strategie `type=text` s čárkou (`index.njk:211, 218`); body v simulátoru `type="number"` (`vystup.js:36`) | opraveno v [#28](https://github.com/frankie851/ceske-kalkulacky/pull/28) |
| PRI-04 | S | `src/nastroje/prijimacky` | platí | `index.njk:206, 211, 226` „ze 100“ proti „loňskému minimu“ bez upozornění na stejnou škálu | opraveno v [#28](https://github.com/frankie851/ceske-kalkulacky/pull/28) |
| PRI-05 | S | `src/nastroje/prijimacky` | částečně | test .ics opraven (`tests/ics.test.js:27`); kapacita 0 a prázdné priority bez testu | opraveno v [#28](https://github.com/frankie851/ceske-kalkulacky/pull/28) |
| PRI-06 | N | `src/nastroje/prijimacky` | platí | `index.njk:66` „jde psát dvakrát“ bez upřesnění pro obory | opraveno v [#33](https://github.com/frankie851/ceske-kalkulacky/pull/33) |
| PRI-07 | N | `src/nastroje/prijimacky` | platí | `strategy.js:30`; čekané body bez škol → varování „no-safe“ | opraveno v [#33](https://github.com/frankie851/ceske-kalkulacky/pull/33) |
| PRI-08 | N | `src/nastroje/prijimacky` | neplatí | `vystup.js:204` řadí sestupně jako škola | — |
| PRI-09 | N | `src/nastroje/prijimacky` | částečně | „reforma“ má `status: confirmed` (`rules.json:44`) a štítek „Ověřeno“ (`index.njk:128`); ISO data se nezobrazují | opraveno v [#33](https://github.com/frankie851/ceske-kalkulacky/pull/33) |
| CES-01 | V | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:211–215` sčítá po dnech; 20:00–02:00 → 0 Kč (Node) | opraveno v [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-02 | V | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:190–193` `throw` u přívěsu; pole přívěsu v UI chybí | opraveno v [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-03 | S | `src/nastroje/cestovni-prikaz-2027` | neplatí | pole `type=text` (`index.njk:58, 77, 78`); `app.js:31–35` `nactiCislo` převede čárku, neplatný vstup hlásí (`app.js:115, 225–232`) | — |
| CES-04 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `index.njk:58` nápověda „průměr spotřeby“; kombinovaný provoz chybí | opraveno v [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) |
| CES-05 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `vystup.js:220–221` „Vyhláška ani zákoník práce zaokrouhlení neupravují“; `rules.json:20, 35` „plné znění ve Sbírce nebylo dostupné“ | opraveno v [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26) |
| CES-06 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.test.js:167–171` „přívěs není ověřený → výpočet ho odmítne“; test § 163 odst. 4 chybí | opraveno v [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-07 | N | `src/nastroje/cestovni-prikaz-2027` | neplatí | ukládá se jen po kliknutí (`index.njk:127`, makro `ulozeni`); `js/uloziste.js:26–28, 54` tlačítko Smazat | — |
| CES-08 | N | `src/nastroje/cestovni-prikaz-2027` | částečně | `rules.json:4–17` zdroje jen praceamzda.cz a epravo.cz; ZP a vyhlášky 78/2026 a 175/2026 bez odkazu | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| CES-09 | N | `src/nastroje/cestovni-prikaz-2027` | neplatí | `_includes/layouty/zaklad.njk:23` favicon `img/favicon.svg` | — |
| CES-10 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:47–50` `Date.UTC` „nástěnné“ hodiny; 29. 3. 2026 0:30–5:30 → 300 min (skutečně 240) | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| CES-11 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `app.js:14` `rSazby = rules[posledniRok]`; krácení a rozpětí veřejné sféry podle posledního roku (`app.js:61, 94, 106–107`) | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| CES-12 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:163` `zakladKc = r.stravne.soukroma[p]`; pole pro vyšší sjednané stravné chybí | opraveno v [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32) |
| VYP-01 | K | `src/nastroje/vypoved-2026` | platí | `rules.json:79–81` `duvodUraz: "d"`, `nasobekUraz: 12`; `vypoved.js:153–163`: d) → 480 000 Kč, e) → 0 Kč (Node) | opraveno v [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) |
| VYP-02 | V | `src/nastroje/vypoved-2026` | platí | `vypoved.js:225–233` `podpora()` důvod nedostává; h) → 90 000 Kč; `vystup.js:95` „Způsob skončení … neovlivňují“ | opraveno v [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) |
| VYP-03 | S | `src/nastroje/vypoved-2026` | platí | `app.js:27–31` `cislo()` regex `^\d+(\.\d+)?$`, „40.000“ → 40 bez hlášky | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| VYP-04 | S | `src/nastroje/vypoved-2026` | platí | `vypoved.test.js:109, 115` testovaly d) 12× a e) 0; `cislo()` v `app.js:27` bez testu | opraveno v [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) |
| VYP-05 | S | `src/nastroje/vypoved-2026` | platí | `index.njk:28` nápověda „Ke dni skončení. Půl roku = 0,5.“; § 67 odst. 2 nikde | opraveno v [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) |
| VYP-06 | N | `src/nastroje/vypoved-2026` | platí | `vystup.js:93` „prodlouží o zbytek výpovědní doby“; `vystup.js:90` „praxe úřadu práce“ | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| VYP-07 | N | `src/nastroje/vypoved-2026` | platí | `app.js:56` kontroluje jen rok žádosti; doručení 2025-05-15 se spočítá; žádost před koncem se spočítá | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| VYP-08 | N | `src/nastroje/vypoved-2026` | platí | `rules.json:6` epravo.cz místo Sbírky; `rules.json:81` „§ 67 odst. 1“ i u 12×; ZP, ZoZ a 537/2025 Sb. bez odkazu | opraveno v [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) |
| VYP-09 | N | `src/nastroje/vypoved-2026` | neplatí | `_includes/layouty/zaklad.njk:23` favicon; konzole bez chyb (kontrola webu) | — |
| ROD-01 | V | `src/nastroje/rodicovska` | platí | `rodina.js:195` `const vek = 36`, `cerpaniRp` `m < vekMesicu` → 240 000 / 110 000 Kč (Node) | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-02 | V | `src/nastroje/rodicovska` | platí | `rodina.js:313–314` `rpOd = posledniPpm + 1`; `vystup.js:223` „nevyplácí souběžně s mateřskou“ | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-03 | V | `src/nastroje/rodicovska` | platí | `rodina.js:94–101, 298–301` hranice jen podle data nástupu; 80 000 Kč přes Nový rok → 298 704 Kč místo 308 046 Kč | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-04 | V | `src/nastroje/rodicovska` | platí | `rules.json:130` `jesleHodinMesicne: 92` | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-05 | S | `src/nastroje/rodicovska` | platí | `rodina.js:125–137` `cerpaniRp`; 350 000 / 15 000 → 24 měsíců, poslední 5 000 Kč | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-06 | S | `src/nastroje/rodicovska` | platí | `rules.json:122–124` „schválená Senátem“ a tisková zpráva; `rules.json:47`; `app.js:233` „schváleno, zatím ne ve Sbírce“ | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-07 | S | `src/nastroje/rodicovska` | částečně | hlášky u polí jsou (`app.js:51–66, 75–77`); při chybě `app.js:186` ponechá starý souhrn | opraveno v [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) |
| ROD-08 | S | `src/nastroje/rodicovska` | neplatí | pole `type=text` (`index.njk:28, 30`); `app.js:29–33` převede čárku | — |
| ROD-09 | S | `src/nastroje/rodicovska` | platí | `app.js:21` `OTCOVSKA_MAX = 42 − 14`; `rodina.js:269` | opraveno v [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) |
| ROD-10 | S | `src/nastroje/rodicovska` | platí | `test/rodina.test.js:29, 42, 116` zachovávají 24 měsíců / 5 000 a 240 000 / 110 000 | opraveno v [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-11 | S | `src/nastroje/rodicovska` | platí | `rules.json:7, 146` cssz.cz/…/pojisteni-osvc; `rules.json:11, 100, 150` `cssz.cz/otcovska`; `:124` tisková zpráva | opraveno v [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24) |
| ROD-12 | N | `src/nastroje/rodicovska` | platí | `rules.json:131–132` `cistaMzda` jen 2026; `rodina.js:151, 391` | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| ROD-13 | N | `src/nastroje/rodicovska` | platí | `rodina.js:195` `vek = 36`; `rodina.js:315–319`; `vystup.js:270` jednorázová výplata bez podmínky | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| ROD-14 | N | `src/nastroje/rodicovska` | částečně | `app.js:265–279` obnoví jen řetězce a známé volby, pak validuje; výchozí 40 000 / 50 000 (`rodina.js:169–170`) | opraveno v [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) |
| ROD-15 | N | `src/nastroje/rodicovska` | neplatí | `_includes/layouty/zaklad.njk:23` favicon | — |
| DLU-01 | S | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | `exekuce-nebo-oddluzeni.11tydata.js:39` „Zákonná sazba od 1. 7. 2026 je 11,75 %“; vazba na pololetí vzniku prodlení jen v `rules.json:197` | opraveno v [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) |
| DLU-02 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `rules.json:26–27, 135–137` zdroj NV 436/2022 Sb. | opraveno v [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) |
| DLU-03 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `rules.json:65–70, 109–118` odkazy na úřední kalkulačky bez upozornění na jejich rozpor | opraveno v [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) |
| DLU-04 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `ui.js:17–21` regex `^\d+(\.\d+)?$`, „23.000“ → 23 bez hlášky | opraveno v [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| DLU-05 | S | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `ui.js:142–145` zaostří nadpis výsledku přímo, bez hashchange | — |
| DLU-06 | S | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | e2e `test/e2e/dluhy.test.js:85` běží v CI; čtení čísel a větve prilis-dlouho/zadna-srazka bez testu | opraveno v [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) |
| DLU-07 | N | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | „úředník“ pryč (`vystup.js:105`); dluh 0 → „0 měsíců“; mzda 14 105 → „déle než 50 let“ (`vystup.js:54`) | opraveno v [#29](https://github.com/frankie851/ceske-kalkulacky/pull/29) |
| DLU-08 | N | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `#osoby` `type=text` (`index.njk:48`); `ui.js:42–43` „1,5“ → hláška | — |
| DLU-09 | N | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | 4 000 Kč na webu není; `rules.json:116` jen hlavní stránka insolvence.justice.cz; `dluhy.js:95` náhrada 50 Kč vždy | opraveno v [#33](https://github.com/frankie851/ceske-kalkulacky/pull/33) |
| DLU-10 | N | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `zaklad.njk:23` favicon; kontrola a e2e v CI (`.github/workflows/web.yml:33–36`) | — |

## Nesoulady mezi nástroji (SOUHRN, část 3)

| Pravidlo | Stav po opravách |
|---|---|
| Odpočet příspěvků na DPS | Sjednoceno: sdílená `src/js/odpocet-dps.js` po měsících ve všech třech nástrojích, hlídá `test/sdilene/konzistence.test.js` ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Zaokrouhlení státního příspěvku DPS | Ponecháno (rozdíl nejvýš 0,50 Kč, hlídá `konzistence.test.js`), zapsáno v `docs/rozhodnuti.md` ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Citace „§ 15a ZDP“ | Opraveno na § 15 odst. 6 a 7 ZDP v Plánu48 i Penzijko kompasu ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Limit úroků z hypotéky 300 000 Kč | Sjednoceno: „bydlení pořízené před 1. 1. 2021“ podle zákona č. 386/2020 Sb., čl. IV bod 3 ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). |
| Minimální mzda 2027 – zdroj | Sjednoceno: sdělení MPSV č. 171/2026 Sb. i v Mám EET? ([#16](https://github.com/frankie851/ceske-kalkulacky/pull/16)). |
| Průměrná mzda | Tři hodnoty jsou správné a slouží jinému účelu, nástroje to u nich uvádějí; vysvětlení v `docs/rozhodnuti.md` ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). Sada čisté mzdy 2027 v Rodičovské doplněna (ROD-12, [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31)). |
| Návrh „Lepší penzijko“ | Zápis pásem 17/29 vs. 18/30 dává pro celé roky stejný výsledek, ponecháno. Konec TF 2036 jen v sadě návrhu se štítkem ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Zdroje v rules.json | Zákonná pravidla všech nástrojů odkazují na předpisy (zakonyprolidi.cz, ERÚ, ČNB, e-Sbírka) s citací. Tržní údaje (sazby, ceny, nájmy) mají tržní zdroje a jsou tak označené. Hotovo v [#22](https://github.com/frankie851/ceske-kalkulacky/pull/22), [#24](https://github.com/frankie851/ceske-kalkulacky/pull/24), [#25](https://github.com/frankie851/ceske-kalkulacky/pull/25), [#26](https://github.com/frankie851/ceske-kalkulacky/pull/26), [#27](https://github.com/frankie851/ceske-kalkulacky/pull/27), [#31](https://github.com/frankie851/ceske-kalkulacky/pull/31) a [#32](https://github.com/frankie851/ceske-kalkulacky/pull/32). |
| Zpracování čísel ve formulářích | Sjednoceno: sdílená `src/js/cislo-vstup.js` ve 12 nástrojích ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). |
| Rok 2027 a značení stavu | 400 000 Kč v Rodičovské je zákon č. 152/2026 Sb. se štítkem „schváleno“ ([#15](https://github.com/frankie851/ceske-kalkulacky/pull/15)). Společný datový model štítků „platí / schváleno / návrh / předběžně“ zatím není (seznam k další práci). |

## Seznam k další práci

Všechny nálezy revize jsou opravené kromě části SPOT-09. Při opravách se našlo pár drobností mimo rozsah revize.

### Z revize
- **SPOT-09** (nízká, částečně): za listopad a prosinec 2025 se pořád počítá s regulovanými cenami 2026. Ceny 2025 jsou v cenových rozhodnutích ERÚ 11/2024 a 12/2024. Úplná oprava vyžaduje ceny po měsících a ceník dynamického tarifu 2025. Teď stránka u těchto měsíců zobrazí upozornění ([#30](https://github.com/frankie851/ceske-kalkulacky/pull/30)).

### Nalezeno při opravách
- **Slevy 2027:** kontrolní seznam (`slevy.js` → `kontrolniSeznam`) vyká a má v textu částku „nejvýš 68 000 Kč“ natvrdo. Čísla čte vlastní funkcí `cele()` místo sdíleného `prectiCislo`.
- **Mám EET?:** volba „Vedlejší – zároveň jsem zaměstnanec“ není rodově neutrální.
- **Přijímačky:** věty z převzatého `explain()` mají rodové tvary „Přijat(a)“, „nesplnil(a)“. Termíny jednotné zkoušky pro pětileté obory úřední zdroj neuvádí.
- **Dluhy:** při chybě ve formuláři jsou karty výsledku ztlumené (`opacity: .45`) a axe na nich hlásí nízký kontrast. Náhrada plátci 50 Kč se odečítá vždy, i u exekucí nařízených před 1. 1. 2022 (vysvětleno textem, chybí pole).
- **Bydlometr:** `parseNumber` v `js/format.js` čte „2.800.000“ jako NaN (formulář už používá sdílené `prectiCislo`). Smlouvy uzavřené před 1. 12. 2016 kalkulačka nepočítá.
- **Penze a Výpověď:** stav sněmovních tisků 285 a 300 na psp.cz nejde z prostředí ověřit (spojení se nenaváže).
- **Rodičovská:** prodloužení lhůty nástupu na otcovskou o dobu hospitalizace (§ 38a odst. 4 věta třetí ZNP) se nepočítá. Průměrná mzda 48 967 Kč pro hranici 23% daně 2026 stojí jen na stránce MPSV.
- **Napříč nástroji:** stav pravidel se v `rules.json` zapisuje v každém nástroji jinak (`stav`, `status`, `predbezne`, `jeNavrh`). Společný model štítků „platí / schváleno / návrh / předběžně“ by sjednotil zobrazení.
- **Projekt:** skript `test:e2e:skryte` v `package.json` míří na neexistující `test/e2e/skryte/`.
