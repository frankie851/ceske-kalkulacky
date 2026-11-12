# Stav nálezů revize z 5. 11. 2026 na sjednoceném webu

Revize v této složce hodnotila **původní repozitáře** (plan48, penzijko-kompas, mam-eet, …). Web převzal výpočetní moduly skoro beze změny, ale přepsal rozhraní, CSS, grafy a formuláře. Tahle tabulka říká, které nálezy platí i pro web `frankie851/ceske-kalkulacky` (stav `main` k 12. 11. 2026, commit `78a6f15`, před opravami) a kde jsou opravené.

**Jak se ověřovalo:** výpočetní nálezy přepočtem v Node nad moduly webu (`src/nastroje/<id>/`), textové nálezy podle textů webu (`vystup.js`, `index.njk`, `rules.json`), přístupnost podle markupu, tokenů v `src/css/main.css` a výsledků `npm run kontrola` (axe serious/critical ve světlém i tmavém režimu, 360 px). Kritické a vysoké nálezy ověřoval druhý průchod znovu a opravy mají vlastní testy.

## Souhrn

- Nálezů: **136** (kritická 1, vysoká 18, střední 61, nízká 56).
- Na webu platí 79, částečně 25, neplatí 32.
- Kritické a vysoké: 19, z toho na webu platí nebo částečně 16. Všechny jsou opravené v otevřených PR. Neplatí 3: PEN-03, EET-02, INF-01 (přístupnost, kterou vyřešil nový design).
- Střední a nízké opravené zároveň s vysokými (stejná funkce nebo stejná příčina): 19 (P48-02, P48-05, PEN-04, PEN-08, EET-04, EET-08, EET-14, SPOT-05, SPOT-08, SLV-04, SLV-05, INF-03, CES-06, VYP-03, VYP-08, ROD-05, ROD-06, ROD-10, DLU-04). Ostatní jsou v seznamu k další práci na konci.

| PR | Obsah |
|---|---|
| [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) | Výpověď 2026: VYP-01, VYP-02, VYP-08 |
| [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) | Rodičovská: ROD-01 až ROD-06, ROD-10 |
| [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) | OSVČ 2027 a Slevy 2027: EET-01, EET-08, SLV-01, SLV-02 |
| [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) | Penze a odpočet DPS po měsících: P48-01, P48-02, P48-05, PEN-01, PEN-08, SLV-05 |
| [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) | Cestovní příkaz: CES-01, CES-02, CES-06 |
| [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) | Spot, nebo fix?: SPOT-01, SPOT-02, SPOT-05 |
| [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) | Sdílené čtení čísel a sjednocení: PEN-02, PEN-04, VYP-03, INF-03, EET-04, EET-14, DLU-04, SPOT-08, SLV-04 |

## Tabulka nálezů

Stav = stav na webu před opravami. Důkaz = soubor:řádek na webu, výsledek přepočtu nebo kontroly. Oprava = PR, ve kterém je nález opravený.

| Kód | Záv. | Nástroj na webu | Stav na webu | Důkaz | Oprava |
|---|---|---|---|---|---|
| P48-01 | V | `src/nastroje/plan48` | platí | `calc.js:44–53` `dpsRocne − 20 400`; rada „55 000 Kč mimořádně“ místo 48 000 Kč (Node) | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| P48-02 | S | `src/nastroje/plan48` | platí | `test/calc.test.js:94–96` čeká 20 600 (ověřeno v Node), `:144` čeká `48000 + 7000`; test měsíčního profilu chybí | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) (přepsané testy) |
| P48-03 | S | `src/nastroje/plan48` | neplatí | `app.js:16–19` přijme čárku; `:49` hlásí věk mimo 0–120; `:56` hlásí zápornou částku; `index.njk:40` měsíce jsou výběr | — |
| P48-04 | S | `src/nastroje/plan48` | částečně | `index.njk:37,142` a `rules.json:42` uvádějí podmínku u DIP; `vystup.js:87–90` radí DIP/ŽP/penzijko bez upozornění na vrácení podpory a bez podmínek ŽP | seznam k další práci |
| P48-05 | S | `src/nastroje/plan48` | platí | `rules.json:10, 60, 67` „§ 15a“; `calc.js:39` „(§ 15a ZDP)“ | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| P48-06 | S | `src/nastroje/plan48` | neplatí | `app.js:48` prázdný věk = hláška „Vyplň věk“; `:154` výpočet se při chybě nespustí | — |
| P48-07 | N | `src/nastroje/plan48` | platí | `rules.json:108–121` zdroje návrhu jsou jen finance.cz, dumfinanci.cz, ČSPS; tisk 285 chybí | seznam k další práci |
| P48-08 | N | `src/nastroje/plan48` | částečně | `index.njk:66` štítek návrhu je ve výsledkové kartě; sekce projekce `index.njk:89–103` štítek nemá | seznam k další práci |
| P48-09 | N | `src/nastroje/plan48` | platí | `rules.json:40` „část příjmů nad 36násobek“; `vystup.js:100` „Obvykle musí dorazit do 20. 12.“ bez zdroje; `rules.json:107` „8/2026“ bez tisku | seznam k další práci |
| PEN-01 | V | `src/nastroje/penzijko-kompas` | platí | `calc.js:93–110` konec TF bez ohledu na sadu; sada 2026 → 852 538 Kč místo 655 378 Kč | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| PEN-02 | V | `src/nastroje/penzijko-kompas` | částečně | pole už `type=text`, čárka funguje; `app.js:25–35` „1.500“ → 1,5, poplatek 85 % projde | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| PEN-03 | V | `src/nastroje/penzijko-kompas` | neplatí | `.srovnani` na webu není; `.stat > span` 6,6:1 (`main.css:661`); axe 0 chyb | — |
| PEN-04 | S | `src/nastroje/penzijko-kompas` | částečně | `app.js:25–34` odmítá záporné a nečíselné hodnoty, prázdné pole hlásí (`:55, :64`); věk 150 projde s příspěvkem 340 Kč (Node) | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) (horní meze polí) |
| PEN-05 | S | `src/nastroje/penzijko-kompas` | platí | `rules.json:17` a `:69` pořád `mf.gov.cz/cs/financni-trh/penzijni-sporeni` | seznam k další práci |
| PEN-06 | S | `src/nastroje/penzijko-kompas` | platí | `rules.json:150–185` výnosy 1,5/3/4,5/7 % bez zdroje; `:48` jen „předpoklad, ne slib“ | seznam k další práci |
| PEN-07 | S | `src/nastroje/penzijko-kompas` | platí | `test/calc.test.js:166–179` TF → konzervativní i v sadě 2026; `:60–66` tolerance; `:222` 5 let = 0; `vkladProMaxPrispevek` bez testu | částečně: [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) (test TF a doporučení); zbývá test `vkladProMaxPrispevek` a tolerance |
| PEN-08 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:11, 64` „(§ 15a)“; `calc.js:35` „(§ 15a ZDP)“ | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| PEN-09 | N | `src/nastroje/penzijko-kompas` | neplatí | `zobrazeni.js:44–51` spojí navazující pásma; Node: věk 10, návrh 2027 → „Vyšší sazba platí do 30. narozenin.“ | — |
| PEN-10 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:203–206` bez zdroje; `calc.js:208` `< zdarmaPoLetech`; 5 let → „převod je zdarma“ (`zobrazeni.js:217–219`) | seznam k další práci |
| PEN-11 | N | `src/nastroje/penzijko-kompas` | neplatí | žádný skript z CDN; `zaklad.njk:32–34` jen lokální moduly, grafy jsou vlastní SVG | — |
| PEN-12 | N | `src/nastroje/penzijko-kompas` | platí | `rules.json:56` `platnostOd 2026-01-01`; `:97–106` zdroje návrhu MF prezentace a Finance.cz, tisk 285 chybí | seznam k další práci |
| PEN-13 | N | `src/nastroje/penzijko-kompas` | neplatí | `zobrazeni.js:152–164` tabulka s `data-label`; `main.css:753–759` na mobilu řádky skládá, sloupec Poplatky neskrývá | — |
| EET-01 | V | `src/nastroje/mam-eet` | platí | `osvc.js:31–53, 105–116` jen minimum 35 %; `rules.json:719–720` bez podílu pro začínající | [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| EET-02 | V | `src/nastroje/mam-eet` | neplatí | graf přepsaný: `osvc-app.js:281` `<rect>` bez `aria-label`, popisek na obalu `role="group"` (`:153`); axe 0 chyb (`docs/kontroly/web-vysledky.json`) | — |
| EET-03 | S | `src/nastroje/mam-eet` | platí | `rules.json:832–836` `monthly 9662`; `test/osvc.test.js:41–49` čeká 115 944 / 132 744 | seznam k další práci |
| EET-04 | S | `src/nastroje/mam-eet` | platí | `app.js:235–236` `Number(raw)`; Node: „20.000“ → 20 Kč, −5000 → 0 Kč | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| EET-05 | S | `src/nastroje/mam-eet` | částečně | `osvc-app.js:84–90` chybu u pole ukáže; starý výsledek ale zůstane na obrazovce | seznam k další práci |
| EET-06 | S | `src/nastroje/mam-eet` | platí | `osvc.js:151–157` limit jen podle `flatRateId`; `rules.json:994` nápověda bez podmínky 75 % | seznam k další práci |
| EET-07 | S | `src/nastroje/mam-eet` | platí | `osvc.js:110` `zisk <= p.sideThreshold`; Node: 123 991 → 0 Kč, 123 992 → 19 914 Kč | seznam k další práci |
| EET-08 | S | `src/nastroje/mam-eet` | platí | `rules.json:765–767` zdroj 24 900 Kč je NV 164/2026, ne sdělení 171/2026 Sb.; také `:74–75` | [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| EET-09 | S | `src/nastroje/mam-eet` | platí | chyby v `docs/zadani.md:503, 505, 558–559` beze změny (zadání se v této práci nemění) | seznam k další práci |
| EET-10 | N | `src/nastroje/mam-eet` | platí | `osvc.js:39` `ceilKc(avg × 0,5)` = 25 832, `:124` × 12 = 309 984 | seznam k další práci |
| EET-11 | N | `src/nastroje/mam-eet` | platí | `osvc.js:47` `Math.floor(avg × 2,4 + EPS)` = 123 991 | seznam k další práci |
| EET-12 | N | `src/nastroje/mam-eet` | neplatí | `h1` je v hlavičce stránky (`komponenty/rozvrzeni.njk:117`), otázky `h2` (`app.js:125`); axe 0 chyb | — |
| EET-13 | N | `src/nastroje/mam-eet` | platí | `rules.json:846` „(výpočet 1. pásma 2026)“; odkazy na e-sbirka.gov.cz `rules.json:55–75` | seznam k další práci |
| EET-14 | N | `src/nastroje/mam-eet` | platí | `osvc-app.js:28–33` a `app.js:154–156` `Number()` vezme „1e6“ jako 1 000 000 | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SPOT-01 | V | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:128–143` D45d/D56d/D57d → TDD6, D61d → TDD7 | [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-02 | V | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:374–391` D61d NT i ve všední dny; `calc.js:182–185` jen `weekend` | [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-03 | S | `src/nastroje/spot-nebo-fix` | částečně | štítek „Pravidla ověřena“ (`nastroj.njk:20`, `rules.json:3`); CV ERÚ 14/2025 v `rules.json:7–45` chybí; `vystup.js:329` ukazuje POZE 0,60 Kč/kWh, i když se účtuje 0 Kč | seznam k další práci |
| SPOT-04 | S | `src/nastroje/spot-nebo-fix` | neplatí | `ui.js:70–101` prázdné, nesmyslné i mimo rozsah hlásí s `aria-invalid`; výpočet neproběhne | — |
| SPOT-05 | S | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:126, 134` „D35d – akumulace 16 h“, „D56d – tepelné čerpadlo 22 h“; `rules.json:304` „22 hodin“ | [#19](https://github.com/frankie851/ceske-kalkulacky/pull/19) |
| SPOT-06 | S | `src/nastroje/spot-nebo-fix` | částečně | formulář pokrývá e2e (`test/e2e/spot-nebo-fix.test.js:71, 125`); `calc.test.js` netestuje přiřazení TDD, okna NT, pásma jističe | seznam k další práci |
| SPOT-07 | S | `src/nastroje/spot-nebo-fix` | platí | `tariffs.json:413–418` `distributors.*.source` je ceník ČEZ Prodej; cenový výměr ERÚ 14/2025 chybí | seznam k další práci |
| SPOT-08 | S | `src/nastroje/spot-nebo-fix` | částečně | pole `type=text`, `ui.js:52–56` přijme čárku; „3.500“ ale projde jako 3,5 | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SPOT-09 | N | `src/nastroje/spot-nebo-fix` | platí | jen zdokumentováno: `rules.json:281` ceny 2026 i pro listopad a prosinec 2025 | seznam k další práci |
| SPOT-10 | N | `src/nastroje/spot-nebo-fix` | platí | `calc.js:435–436` extrapoluje přes `scale`; `ui.js:313–319` | seznam k další práci |
| SPOT-11 | N | `src/nastroje/spot-nebo-fix` | platí | plán v `.github/workflows/aktualizace-spot.yml:9–10`; běh na GitHubu z repozitáře nejde doložit | seznam k další práci |
| SPOT-12 | N | `src/nastroje/spot-nebo-fix` | částečně | `rules.json:283` „do 16 nejlevnějších čtvrthodin téhož dne“; optimismus (ceny známé dopředu) dál nezmíněn | seznam k další práci |
| SPOT-13 | N | `src/nastroje/spot-nebo-fix` | neplatí | favicon v `_includes/layouty/zaklad.njk:23`; konzole bez chyb | — |
| SPOT-14 | N | `src/nastroje/spot-nebo-fix` | neplatí | formulář je v DOM před výsledky (`index.njk:18–89`), bez CSS `order`; axe 0 chyb | — |
| BYD-01 | S | `src/nastroje/bydlometr` | platí | `js/mortgage.js:135–138`, `vystup.js:392–400` jen 0,25 %/rok se stropem 1 %, bez § 117 odst. 5 a § 117a; 300 000 Kč → 3 000 Kč | seznam k další práci |
| BYD-02 | S | `src/nastroje/bydlometr` | platí | `mortgage.js:121–126`, `vystup.js:381–385`; smlouva 2021, splátka v den konce fixace → „Zkontroluj smlouvu“ místo 0 Kč | seznam k další práci |
| BYD-03 | S | `src/nastroje/bydlometr` | platí | `ui.js:114, 142, 183` `if (chyba) return;` nechá starý výsledek | seznam k další práci |
| BYD-04 | S | `src/nastroje/bydlometr` | částečně | `taxSaving` se nevypisuje; DTI se nepočítá, jen věta `vystup.js:363`; `rules.json:160` nevyužito | seznam k další práci |
| BYD-05 | S | `src/nastroje/bydlometr` | platí | Brno, 60 m², 1,5 mil. Kč, 40 let → „LTV 80 %, ale limit je 80 %“ (`vystup.js:472`); simulace pokračuje (`rentbuy.js:30–34`) | seznam k další práci |
| BYD-06 | S | `src/nastroje/bydlometr` | částečně | formulář pokrývá e2e; bankovní testy jen s tolerancí (`test/mortgage.test.js:33–39`); parser `ui.js:30` bez testu | seznam k další práci |
| BYD-07 | S | `src/nastroje/bydlometr` | platí | `rules.json:22–50` kb.cz, banky.cz, hyponamiru.cz; `rules.json:48` „§ 15 odst. 3“; `rules.json:248` „smlouvy do 31. 12. 2020“ | částečně: [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) (formulace limitu úroků); zbývají neúřední zdroje a citace „§ 15 odst. 3“ |
| BYD-08 | N | `src/nastroje/bydlometr` | částečně | tykání jednotné, `aria-invalid` nastaveno; zbývá „Prodloužit splatnost o 0 let“ (`vystup.js:71, 258`) | seznam k další práci |
| BYD-09 | N | `src/nastroje/bydlometr` | částečně | čísla natvrdo zmizela (`vystup.js:392–400` z rules); nevyužité položky `defaults.json:16–40`, `rules.json:159–175, 245` | seznam k další práci |
| BYD-10 | N | `src/nastroje/bydlometr` | neplatí | favicon v `zaklad.njk:23`; konzole bez chyb | — |
| BYD-11 | N | `src/nastroje/bydlometr` | platí | záporný růst jen u cen (`vystup.js:91`), u nájmů a výnosu ne (`ui.js:62`) | seznam k další práci |
| SLV-01 | V | `src/nastroje/slevy-2027` | částečně | UI chybu maskuje (`app.js:357` `ROK - 7`), ale `slevy.js:88–93` `skolkovne()` věk neřeší a stav formuláře zůstává | [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| SLV-02 | V | `src/nastroje/slevy-2027` | platí | `slevy.js:101–117` bez věku 18/26 a studia; dítě 3/2001 → 15 204 Kč (Node) | [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) |
| SLV-03 | S | `src/nastroje/slevy-2027` | neplatí | `app.js:67` pole `type="text"`; `:41–43` `/^\d+$/`, „1500,50“ dostane hlášku | — |
| SLV-04 | S | `src/nastroje/slevy-2027` | platí | `app.js:236` „Úvěrová smlouva je uzavřená před 1. 1. 2021“; `vystup.js:61`; `rules.json:256` | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| SLV-05 | S | `src/nastroje/slevy-2027` | platí | `slevy.js:123` `penzijko − 20 400`, `rules.json:237`; Node: 48 000 → 27 600 | [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) |
| SLV-06 | S | `src/nastroje/slevy-2027` | platí | `test/slevy.test.js:129–131` fixuje `stareSmlouva`; test dítěte 18/26 let chybí | částečně: [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) (testy 18/26 let); zbývá test `stareSmlouva` a strop darů |
| SLV-07 | S | `src/nastroje/slevy-2027` | neplatí | `app.js:46–49` `overCisla` hlásí chyby; `:128` měsíce výběrem; `:178` rok dítěte s rozsahem | — |
| SLV-08 | N | `src/nastroje/slevy-2027` | platí | `slevy.js:274` `zakladDane − stari − uroky`; Node: strop 60 300 místo 90 000 | seznam k další práci |
| SLV-09 | N | `src/nastroje/slevy-2027` | platí | `rules.json:271` „zákona č. 66/2022 Sb. ve znění zákona č. 24/2025 Sb.“ | seznam k další práci |
| SLV-10 | N | `src/nastroje/slevy-2027` | platí | `slevy.js:63–64` bez dítěte bere 12 měsíců; `slevy.js:17–23` `mladsiNez` | seznam k další práci |
| SLV-11 | N | `src/nastroje/slevy-2027` | neplatí | `index.njk:20` bez `aria-live`; `app.js:293` jen přesouvá fokus | — |
| INF-01 | V | `src/nastroje/inflacni-kalkulacka` | neplatí | `inflacni-kalkulacka.css:18` + tokeny `main.css:81, 83` → 6,15:1 (světlý) a 8,02:1 (tmavý); axe 0 chyb | — |
| INF-02 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | tabulka v `div.table-wrap role="region" tabindex="0"` (`src/js/graf.js:269`) | — |
| INF-03 | S | `src/nastroje/inflacni-kalkulacka` | platí | `ui.js:21–24`: „10.000“ → 10 bez hlášky | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| INF-04 | S | `src/nastroje/inflacni-kalkulacka` | částečně | e2e `test/e2e/inflacni-kalkulacka.test.js:81, 118`; parser `ui.js:21` bez testu „10.000“ a „1 500“ | seznam k další práci |
| INF-05 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `ui.js:50` prázdné pole → hláška, výsledek se nepřepíše | — |
| INF-06 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | žádný skript z CDN, grafy vlastní SVG, CSP `zaklad.njk:8` | — |
| INF-07 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `_includes/layouty/nastroj.njk:60` upozornění „Nejde o investiční… poradenství“ | — |
| INF-08 | N | `src/nastroje/inflacni-kalkulacka` | platí | `vystup.js:277–280` nabízí 12 měsíců i pro poslední rok dat | seznam k další práci |
| INF-09 | N | `src/nastroje/inflacni-kalkulacka` | neplatí | `main.css:165` `overflow-wrap: break-word`; tabulka v posuvném `.table-wrap` (`main.css:741`) | — |
| PRI-01 | S | `src/nastroje/prijimacky` | neplatí | opraveno při převzetí: `ics.js:4` `'\;'`, `tests/ics.test.js:27` | — |
| PRI-02 | S | `src/nastroje/prijimacky` | platí | `ui.js:21–26, 286` rozsah nehlídá; čekané body 150 → „jistota“ bez hlášky | seznam k další práci |
| PRI-03 | S | `src/nastroje/prijimacky` | částečně | strategie `type=text` s čárkou (`index.njk:211, 218`); body v simulátoru `type="number"` (`vystup.js:36`) | seznam k další práci |
| PRI-04 | S | `src/nastroje/prijimacky` | platí | `index.njk:206, 211, 226` „ze 100“ proti „loňskému minimu“ bez upozornění na stejnou škálu | seznam k další práci |
| PRI-05 | S | `src/nastroje/prijimacky` | částečně | test .ics opraven (`tests/ics.test.js:27`); kapacita 0 a prázdné priority bez testu | seznam k další práci |
| PRI-06 | N | `src/nastroje/prijimacky` | platí | `index.njk:66` „jde psát dvakrát“ bez upřesnění pro obory | seznam k další práci |
| PRI-07 | N | `src/nastroje/prijimacky` | platí | `strategy.js:30`; čekané body bez škol → varování „no-safe“ | seznam k další práci |
| PRI-08 | N | `src/nastroje/prijimacky` | neplatí | `vystup.js:204` řadí sestupně jako škola | — |
| PRI-09 | N | `src/nastroje/prijimacky` | částečně | „reforma“ má `status: confirmed` (`rules.json:44`) a štítek „Ověřeno“ (`index.njk:128`); ISO data se nezobrazují | seznam k další práci |
| CES-01 | V | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:211–215` sčítá po dnech; 20:00–02:00 → 0 Kč (Node) | [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-02 | V | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:190–193` `throw` u přívěsu; pole přívěsu v UI chybí | [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-03 | S | `src/nastroje/cestovni-prikaz-2027` | neplatí | pole `type=text` (`index.njk:58, 77, 78`); `app.js:31–35` `nactiCislo` převede čárku, neplatný vstup hlásí (`app.js:115, 225–232`) | — |
| CES-04 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `index.njk:58` nápověda „průměr spotřeby“; kombinovaný provoz chybí | seznam k další práci |
| CES-05 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `vystup.js:220–221` „Vyhláška ani zákoník práce zaokrouhlení neupravují“; `rules.json:20, 35` „plné znění ve Sbírce nebylo dostupné“ | seznam k další práci |
| CES-06 | S | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.test.js:167–171` „přívěs není ověřený → výpočet ho odmítne“; test § 163 odst. 4 chybí | [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) |
| CES-07 | N | `src/nastroje/cestovni-prikaz-2027` | neplatí | ukládá se jen po kliknutí (`index.njk:127`, makro `ulozeni`); `js/uloziste.js:26–28, 54` tlačítko Smazat | — |
| CES-08 | N | `src/nastroje/cestovni-prikaz-2027` | částečně | `rules.json:4–17` zdroje jen praceamzda.cz a epravo.cz; ZP a vyhlášky 78/2026 a 175/2026 bez odkazu | částečně: [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) (§ 157, § 163, § 176 ZP); zbývají vyhlášky 573/2025, 78/2026 a 175/2026 Sb. ze Sbírky |
| CES-09 | N | `src/nastroje/cestovni-prikaz-2027` | neplatí | `_includes/layouty/zaklad.njk:23` favicon `img/favicon.svg` | — |
| CES-10 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:47–50` `Date.UTC` „nástěnné“ hodiny; 29. 3. 2026 0:30–5:30 → 300 min (skutečně 240) | seznam k další práci |
| CES-11 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `app.js:14` `rSazby = rules[posledniRok]`; krácení a rozpětí veřejné sféry podle posledního roku (`app.js:61, 94, 106–107`) | seznam k další práci |
| CES-12 | N | `src/nastroje/cestovni-prikaz-2027` | platí | `cesty.js:163` `zakladKc = r.stravne.soukroma[p]`; pole pro vyšší sjednané stravné chybí | seznam k další práci |
| VYP-01 | K | `src/nastroje/vypoved-2026` | platí | `rules.json:79–81` `duvodUraz: "d"`, `nasobekUraz: 12`; `vypoved.js:153–163`: d) → 480 000 Kč, e) → 0 Kč (Node) | [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) |
| VYP-02 | V | `src/nastroje/vypoved-2026` | platí | `vypoved.js:225–233` `podpora()` důvod nedostává; h) → 90 000 Kč; `vystup.js:95` „Způsob skončení … neovlivňují“ | [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) |
| VYP-03 | S | `src/nastroje/vypoved-2026` | platí | `app.js:27–31` `cislo()` regex `^\d+(\.\d+)?$`, „40.000“ → 40 bez hlášky | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| VYP-04 | S | `src/nastroje/vypoved-2026` | platí | `vypoved.test.js:109, 115` testovaly d) 12× a e) 0; `cislo()` v `app.js:27` bez testu | částečně: [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) (testy písm. d/e), [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) (čtení čísel); zbývá test `konecDohody` a věku 52/57 |
| VYP-05 | S | `src/nastroje/vypoved-2026` | platí | `index.njk:28` nápověda „Ke dni skončení. Půl roku = 0,5.“; § 67 odst. 2 nikde | seznam k další práci |
| VYP-06 | N | `src/nastroje/vypoved-2026` | platí | `vystup.js:93` „prodlouží o zbytek výpovědní doby“; `vystup.js:90` „praxe úřadu práce“ | seznam k další práci |
| VYP-07 | N | `src/nastroje/vypoved-2026` | platí | `app.js:56` kontroluje jen rok žádosti; doručení 2025-05-15 se spočítá; žádost před koncem se spočítá | seznam k další práci |
| VYP-08 | N | `src/nastroje/vypoved-2026` | platí | `rules.json:6` epravo.cz místo Sbírky; `rules.json:81` „§ 67 odst. 1“ i u 12×; ZP, ZoZ a 537/2025 Sb. bez odkazu | [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) (úřední zdroje a citace) |
| VYP-09 | N | `src/nastroje/vypoved-2026` | neplatí | `_includes/layouty/zaklad.njk:23` favicon; konzole bez chyb (kontrola webu) | — |
| ROD-01 | V | `src/nastroje/rodicovska` | platí | `rodina.js:195` `const vek = 36`, `cerpaniRp` `m < vekMesicu` → 240 000 / 110 000 Kč (Node) | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-02 | V | `src/nastroje/rodicovska` | platí | `rodina.js:313–314` `rpOd = posledniPpm + 1`; `vystup.js:223` „nevyplácí souběžně s mateřskou“ | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-03 | V | `src/nastroje/rodicovska` | platí | `rodina.js:94–101, 298–301` hranice jen podle data nástupu; 80 000 Kč přes Nový rok → 298 704 Kč místo 308 046 Kč | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-04 | V | `src/nastroje/rodicovska` | platí | `rules.json:130` `jesleHodinMesicne: 92` | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-05 | S | `src/nastroje/rodicovska` | platí | `rodina.js:125–137` `cerpaniRp`; 350 000 / 15 000 → 24 měsíců, poslední 5 000 Kč | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-06 | S | `src/nastroje/rodicovska` | platí | `rules.json:122–124` „schválená Senátem“ a tisková zpráva; `rules.json:47`; `app.js:233` „schváleno, zatím ne ve Sbírce“ | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) |
| ROD-07 | S | `src/nastroje/rodicovska` | částečně | hlášky u polí jsou (`app.js:51–66, 75–77`); při chybě `app.js:186` ponechá starý souhrn | seznam k další práci |
| ROD-08 | S | `src/nastroje/rodicovska` | neplatí | pole `type=text` (`index.njk:28, 30`); `app.js:29–33` převede čárku | — |
| ROD-09 | S | `src/nastroje/rodicovska` | platí | `app.js:21` `OTCOVSKA_MAX = 42 − 14`; `rodina.js:269` | seznam k další práci |
| ROD-10 | S | `src/nastroje/rodicovska` | platí | `test/rodina.test.js:29, 42, 116` zachovávají 24 měsíců / 5 000 a 240 000 / 110 000 | [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) (přepsané testy) |
| ROD-11 | S | `src/nastroje/rodicovska` | platí | `rules.json:7, 146` cssz.cz/…/pojisteni-osvc; `rules.json:11, 100, 150` `cssz.cz/otcovska`; `:124` tisková zpráva | seznam k další práci |
| ROD-12 | N | `src/nastroje/rodicovska` | platí | `rules.json:131–132` `cistaMzda` jen 2026; `rodina.js:151, 391` | seznam k další práci |
| ROD-13 | N | `src/nastroje/rodicovska` | platí | `rodina.js:195` `vek = 36`; `rodina.js:315–319`; `vystup.js:270` jednorázová výplata bez podmínky | částečně: [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) (věk z rules.json); zbývá DVZ bez nároku a podmínka jednorázové výplaty |
| ROD-14 | N | `src/nastroje/rodicovska` | částečně | `app.js:265–279` obnoví jen řetězce a známé volby, pak validuje; výchozí 40 000 / 50 000 (`rodina.js:169–170`) | seznam k další práci |
| ROD-15 | N | `src/nastroje/rodicovska` | neplatí | `_includes/layouty/zaklad.njk:23` favicon | — |
| DLU-01 | S | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | `exekuce-nebo-oddluzeni.11tydata.js:39` „Zákonná sazba od 1. 7. 2026 je 11,75 %“; vazba na pololetí vzniku prodlení jen v `rules.json:197` | seznam k další práci |
| DLU-02 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `rules.json:26–27, 135–137` zdroj NV 436/2022 Sb. | seznam k další práci |
| DLU-03 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `rules.json:65–70, 109–118` odkazy na úřední kalkulačky bez upozornění na jejich rozpor | seznam k další práci |
| DLU-04 | S | `src/nastroje/exekuce-nebo-oddluzeni` | platí | `ui.js:17–21` regex `^\d+(\.\d+)?$`, „23.000“ → 23 bez hlášky | [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) |
| DLU-05 | S | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `ui.js:142–145` zaostří nadpis výsledku přímo, bez hashchange | — |
| DLU-06 | S | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | e2e `test/e2e/dluhy.test.js:85` běží v CI; čtení čísel a větve prilis-dlouho/zadna-srazka bez testu | seznam k další práci |
| DLU-07 | N | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | „úředník“ pryč (`vystup.js:105`); dluh 0 → „0 měsíců“; mzda 14 105 → „déle než 50 let“ (`vystup.js:54`) | seznam k další práci |
| DLU-08 | N | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `#osoby` `type=text` (`index.njk:48`); `ui.js:42–43` „1,5“ → hláška | — |
| DLU-09 | N | `src/nastroje/exekuce-nebo-oddluzeni` | částečně | 4 000 Kč na webu není; `rules.json:116` jen hlavní stránka insolvence.justice.cz; `dluhy.js:95` náhrada 50 Kč vždy | seznam k další práci |
| DLU-10 | N | `src/nastroje/exekuce-nebo-oddluzeni` | neplatí | `zaklad.njk:23` favicon; kontrola a e2e v CI (`.github/workflows/web.yml:33–36`) | — |

## Nesoulady mezi nástroji (SOUHRN, část 3)

| Pravidlo | Stav po opravách |
|---|---|
| Odpočet příspěvků na DPS | Sjednoceno: sdílená `src/js/odpocet-dps.js` po měsících ve všech třech nástrojích, hlídá `test/sdilene/konzistence.test.js` ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Zaokrouhlení státního příspěvku DPS | Ponecháno (rozdíl nejvýš 0,50 Kč, hlídá `konzistence.test.js`), zapsáno v `docs/rozhodnuti.md` ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Citace „§ 15a ZDP“ | Opraveno na § 15 odst. 6 a 7 ZDP v Plánu48 i Penzijko kompasu ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Limit úroků z hypotéky 300 000 Kč | Sjednoceno: „bydlení pořízené před 1. 1. 2021“ podle zákona č. 386/2020 Sb., čl. IV bod 3 ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). |
| Minimální mzda 2027 – zdroj | Sjednoceno: sdělení MPSV č. 171/2026 Sb. i v Mám EET? ([#16](https://github.com/frankie851/ceske-kalkulacky/pull/16)). |
| Průměrná mzda | Tři hodnoty jsou správné a slouží jinému účelu, nástroje to u nich uvádějí; vysvětlení v `docs/rozhodnuti.md` ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). Sada čisté mzdy 2027 v Rodičovské chybí (ROD-12, seznam k další práci). |
| Návrh „Lepší penzijko“ | Zápis pásem 17/29 vs. 18/30 dává pro celé roky stejný výsledek, ponecháno. Konec TF 2036 jen v sadě návrhu se štítkem ([#17](https://github.com/frankie851/ceske-kalkulacky/pull/17)). |
| Zdroje v rules.json | Úřední předpisy doplněné u opravovaných nástrojů (Výpověď, Rodičovská, Cestovní příkaz, Plán48, Penzijko, Spot). Zbytek neúředních zdrojů: P48-07, PEN-05, PEN-12, BYD-07, CES-08, ROD-11, SPOT-07 v seznamu k další práci. |
| Zpracování čísel ve formulářích | Sjednoceno: sdílená `src/js/cislo-vstup.js` ve 12 nástrojích ([#20](https://github.com/frankie851/ceske-kalkulacky/pull/20)). |
| Rok 2027 a značení stavu | 400 000 Kč v Rodičovské je zákon č. 152/2026 Sb. se štítkem „schváleno“ ([#15](https://github.com/frankie851/ceske-kalkulacky/pull/15)). Společný model štítků „platí / schváleno / návrh / předběžně“ zatím není, v seznamu k další práci. |

## Seznam k další práci (střední a nízké nálezy)

Nálezy, které na webu platí nebo platí částečně a nejsou úplně opravené v PR výše. Postup a regresní testy jsou v `opravy/<repozitář>.md`, ale cesty je potřeba převést na `src/nastroje/<id>/`.

### P48 · `src/nastroje/plan48` · opravy: `opravy/plan48.md`

- **P48-04** (střední, částečně): Chybí upozornění na podmínku daňové podpory (120 měsíců a 60 let) a navrácení podpory při předčasném výběru.
- **P48-07** (nízká, platí): Zdroje návrhu 2027 jsou jen média, bez sněmovního tisku 285 a materiálů MF; mediální odkazy neověřitelné.
- **P48-08** (nízká, částečně): Štítek „návrh, zatím neschváleno“ není u dlaždice státního příspěvku ani u projekce.
- **P48-09** (nízká, platí): Drobné nepřesnosti textů.

### PEN · `src/nastroje/penzijko-kompas` · opravy: `opravy/penzijko-kompas.md`

- **PEN-05** (střední, platí): Zdroj „MF ČR – Státní podpora penzijního spoření“ v patičce vrací 404.
- **PEN-06** (střední, platí): Předpokládané výnosy nemají zdroj a liší se od modelu MF, který zadání uvádí jako podklad; výnos TF 1,5 % rozhoduje o radě „přejít“.
- **PEN-07** (střední, platí): Chybí testy důležitých větví a jeden test konzervuje návrh v sadě 2026. Částečně opraveno: [#17](https://github.com/frankie851/ceske-kalkulacky/pull/17) (test TF a doporučení); zbývá test `vkladProMaxPrispevek` a tolerance.
- **PEN-10** (nízká, platí): Poplatek za převod ke konkurenci: neuveden zákonný zdroj, hranice „přesně 5 let“ se liší od zákona.
- **PEN-12** (nízká, platí): `platnostOd` sady 2026 a mediální zdroj návrhu.

### EET · `src/nastroje/mam-eet` · opravy: `opravy/mam-eet.md`

- **EET-03** (střední, platí): 1. pásmo paušální daně 2027 je 9 662 Kč, podle zákonného vzorce vychází 9 661 Kč.
- **EET-05** (střední, částečně): OSVČ 2027: při neplatném vstupu zůstává na obrazovce starý výsledek.
- **EET-06** (střední, platí): Pásmo paušálu se určuje z jediné činnosti, podmínka „alespoň 75 % příjmů“ a zjednodušení nejsou zmíněny.
- **EET-07** (střední, platí): Vedlejší činnost: při zisku přesně 123 991 Kč aplikace nepočítá sociální pojištění.
- **EET-09** (střední, platí): Chyby v zadání (`docs/zadani.md`) proti úředním zdrojům.
- **EET-10** (nízká, platí): Roční minimální VZ zdravotního pojištění 309 984 Kč místo 309 978 Kč.
- **EET-11** (nízká, platí): Rozhodná částka počítaná jako floor(2,4 × PM).
- **EET-13** (nízká, platí): Popis zdroje 1. pásma a odkazy na e-Sbírku.

### SPOT · `src/nastroje/spot-nebo-fix` · opravy: `opravy/spot-nebo-fix.md`

- **SPOT-03** (střední, částečně): Chybí datum ověření regulovaných cen, odkaz na CV ERÚ 14/2025 a vysvětlení nulového POZE.
- **SPOT-06** (střední, částečně): Chybí testy pravidel, která se v revizi ukázala chybná, a propojení formuláře.
- **SPOT-07** (střední, platí): Zdroj distribučních cen je jen ceník dodavatele, zadání žádá položky se zdrojem.
- **SPOT-09** (nízká, platí): Regulované ceny 2026 a nulové POZE se používají i na listopad a prosinec 2025.
- **SPOT-10** (nízká, platí): Krátké CSV se extrapoluje na celý rok a přepíše roční spotřebu nereálnou hodnotou.
- **SPOT-11** (nízká, platí): Denní workflow zatím běžel jen ručně; plánovaný běh a nasazení po commitu bota neověřeno.
- **SPOT-12** (nízká, částečně): Popis posunu „do 4 nejlevnějších hodin“ vs. „16 nejlevnějších čtvrthodin“.

### BYD · `src/nastroje/bydlometr` · opravy: `opravy/bydlometr.md`

- **BYD-01** (střední, platí): Kalkulačka poplatku ukazuje jen strop 0,25 %/rok; neuplatňuje omezení podle § 117 odst. 5 (úrok do konce fixace) ani § 117a (admin. náklady max. 1 000 Kč + úrokový rozdíl).
- **BYD-02** (střední, platí): Starší smlouvy (před 1. 9. 2024 bez nové fixace) nedostanou číslo ani v bezplatných případech; další bezplatné důvody § 117 odst. 3 nejsou zmíněny.
- **BYD-03** (střední, platí): Při chybném vstupu zůstane pod hláškou starý výsledek (věta „Nejlevněji vychází…“, tabulky, zátěžový test).
- **BYD-04** (střední, částečně): DTI se nepočítá ani neukazuje (vlastní bydlení informativně, investiční doporučení 7) a úspora na dani z odpočtu úroků se uživateli nikde nezobrazí.
- **BYD-05** (střední, platí): Nájem vs. koupě počítá celý výsledek i s úvěrem nad limit LTV a hláška po zaokrouhlení tvrdí „LTV 80 %, ale limit je 80 %“.
- **BYD-06** (střední, částečně): Chybí testy pro `format.js`/`form.js` (propojení formuláře) a dva „bankovní“ testy ověřují jen díky toleranci.
- **BYD-07** (střední, platí): Zdroje zákonných pravidel odkazují na neúřední weby a dvě citace jsou nepřesné. Částečně opraveno: [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) (formulace limitu úroků); zbývají neúřední zdroje a citace „§ 15 odst. 3“.
- **BYD-08** (nízká, částečně): Nejednotné oslovení a drobné textové nepřesnosti.
- **BYD-09** (nízká, částečně): Nepoužité položky JSON v patičce a texty s čísly natvrdo.
- **BYD-11** (nízká, platí): Záporný růst nájmů nebo výnos investic je odmítnut, záporný růst cen povolen; neúčelové úvěry na bydlení mimo rozsah.

### SLV · `src/nastroje/slevy-2027` · opravy: `opravy/slevy-2027.md`

- **SLV-06** (střední, platí): Chybí testy pro věkovou hranici dítěte a vazbu formuláře na výpočet; test u úroků fixuje nepřesnou podmínku. Částečně opraveno: [#16](https://github.com/frankie851/ceske-kalkulacky/pull/16) (testy 18/26 let); zbývá test `stareSmlouva` a strop darů.
- **SLV-08** (nízká, platí): Strop darů 15 % se počítá ze základu sníženého o ostatní odpočty.
- **SLV-09** (nízká, platí): Chybná citace zákona u zvýšeného stropu darů.
- **SLV-10** (nízká, platí): Nekonzistence vstupů: sleva na manžela bez zadaného dítěte, narozeniny 1. dne měsíce.

### INF · `src/nastroje/inflacni-kalkulacka` · opravy: `opravy/inflacni-kalkulacka.md`

- **INF-04** (střední, částečně): Čtení vstupu a logika směru přepočtu jsou v `app.js` a bez testu.
- **INF-08** (nízká, platí): Výběr měsíce nabízí i říjen–prosinec 2026, za které data nejsou.

### PRI · `src/nastroje/prijimacky` · opravy: `opravy/prijimacky-bez-paniky.md`

- **PRI-02** (střední, platí): Číselná pole nehlídají rozsah ani platnost a nic nehlásí.
- **PRI-03** (střední, částečně): Desetinná čárka se v prohlížeči s jinou než českou lokalizací zahodí (62,5 → 625).
- **PRI-04** (střední, platí): „Moje strategie“ porovnává body „ze 100“ s loňským minimem školy bez upozornění na stejnou škálu.
- **PRI-05** (střední, částečně): Chybějí testy u důležitých větví a test .ics fixuje špatnou hodnotu.
- **PRI-06** (nízká, platí): Krok 2 uvádí termíny JPZ jen pro čtyřleté obory bez upřesnění.
- **PRI-07** (nízká, platí): Varování „Žádná škola nemá rezervu“ a řádky „Škola 1–3“ se zobrazí dřív, než je zadaná jediná škola.
- **PRI-09** (nízká, částečně): Stav „confirmed“ u negativního tvrzení o reformě; data zdrojů v patičce v ISO tvaru.

### CES · `src/nastroje/cestovni-prikaz-2027` · opravy: `opravy/cestovni-prikaz.md`

- **CES-04** (střední, platí): Nápověda ke spotřebě radí „aritmetický průměr“, zákon žádá přednostně údaj pro kombinovaný provoz.
- **CES-05** (střední, platí): Aplikace tvrdí, že předpisy nebyly dostupné a že zákon zaokrouhlení neupravuje.
- **CES-08** (nízká, částečně): Patička ani README neodkazují na texty předpisů. Částečně opraveno: [#18](https://github.com/frankie851/ceske-kalkulacky/pull/18) (§ 157, § 163, § 176 ZP); zbývají vyhlášky 573/2025, 78/2026 a 175/2026 Sb. ze Sbírky.
- **CES-10** (nízká, platí): Délka cesty se počítá z „nástěnného“ času, při změně letního času se liší o hodinu.
- **CES-11** (nízká, platí): Rozpětí veřejné sféry a výchozí krácení se berou z posledního roku v `rules.json`, ne z roku cesty.
- **CES-12** (nízká, platí): Soukromá sféra neumožňuje vyšší sjednané stravné (§ 163 odst. 3 věta první).

### VYP · `src/nastroje/vypoved-2026` · opravy: `opravy/vypoved-2026.md`

- **VYP-04** (střední, platí): Testy zakonzervují chybu § 52 d)/e); chybějící testy parsování vstupu a hraničních stavů UI. Částečně opraveno: [#14](https://github.com/frankie851/ceske-kalkulacky/pull/14) (testy písm. d/e), [#20](https://github.com/frankie851/ceske-kalkulacky/pull/20) (čtení čísel); zbývá test `konecDohody` a věku 52/57.
- **VYP-05** (střední, platí): Chybí § 67 odst. 2 – započtení předchozího pracovního poměru u téhož zaměstnavatele.
- **VYP-06** (nízká, platí): Drobné nepřesnosti textů (ochranná doba, zkušební doba, „praxe úřadu práce“).
- **VYP-07** (nízká, platí): Doručení před 1. 6. 2025 a žádost před koncem pracovního poměru nejsou hlídány.

### ROD · `src/nastroje/rodicovska` · opravy: `opravy/rodicovska.md`

- **ROD-07** (střední, částečně): Chybné vstupy bez hlášky; při neplatném termínu zůstane starý souhrn a kontrolní seznam.
- **ROD-09** (střední, platí): Nástup na otcovskou lze zadat jen do 28. dne po porodu, zákon dovoluje do 6 týdnů.
- **ROD-11** (střední, platí): Dva odkazy v patičce nevedou na slibovaný obsah, zdroje míchají domény.
- **ROD-12** (nízká, platí): Čistá mzda nemá parametry pro rok 2027.
- **ROD-13** (nízká, platí): Drobná zjednodušení bez vlivu na běžné částky. Částečně opraveno: [#15](https://github.com/frankie851/ceske-kalkulacky/pull/15) (věk z rules.json); zbývá DVZ bez nároku a podmínka jednorázové výplaty.
- **ROD-14** (nízká, částečně): Obnova plánu z `localStorage` bez validace; formulář předvyplněný smyšlenými příjmy.

### DLU · `src/nastroje/exekuce-nebo-oddluzeni` · opravy: `opravy/kalkulator-dluhu.md`

- **DLU-01** (střední, částečně): Výchozí úrok 11,75 % se nabízí jako „zákonná sazba“ bez vazby na dobu vzniku prodlení.
- **DLU-02** (střední, platí): Životní minimum se cituje ze zrušeného nařízení 436/2022 Sb. (i v patičce).
- **DLU-03** (střední, platí): Odkazované úřední kalkulačky dnes ukazují jiná čísla a aplikace na to neupozorní.
- **DLU-06** (střední, částečně): Chybí testy u propojení formuláře, u pevně zapsané sazby a u větví doby splácení.
- **DLU-07** (nízká, částečně): Texty v okrajových případech: dluh 0, srážka 1 Kč, „úředník“.
- **DLU-09** (nízká, částečně): Neúplnosti u pomoci a náhrady plátce.

Mimo nálezy revize: skript `test:e2e:skryte` v `package.json` míří na `test/e2e/skryte/`, která neexistuje (Dluhy a Zdaním to? už jsou zveřejněné a jejich e2e běží v `npm run test:e2e`).
