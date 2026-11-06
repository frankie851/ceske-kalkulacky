# Opravný prompt: Plán48 (`frankie851/plan48`)
Z nezávislé revize 5. 11. 2026 · revidovaný commit `48733fea370ca096397c964ed430fa48cd8ee11c` · zpráva: `docs/revize/2026-11-05/plan48.md` v repozitáři `frankie851/ceske-kalkulacky` (větev `revize/2026-11-05`)

## Jak spustit (pro Davida)
1. Otevři nové sezení Claude Code v repozitáři **frankie851/plan48**, větev `main`.
2. Model **Opus 5.5** (`/model opus`), effort **High** (`/effort high`).
3. Zkopíruj všechno od nadpisu „Prompt“ níže až do konce souboru a vlož to jako první zprávu.
4. Výsledkem bude PR do `main` s tabulkou nález → test → stav. Před sloučením si projdi tabulku a namátkou zkontroluj 1–2 opravy.

---

# Prompt

## Kontext
Plán48 je statická česká kalkulačka (HTML + CSS + ES moduly, bez buildu), která spočítá státní příspěvek k doplňkovému penzijnímu spoření, daňový odpočet z limitu 48 000 Kč (DPS + DIP + životní pojištění) a poradí, kolik ještě poslat do 31. 12. Zadání aplikace je sekce „Úkol: Plán48 – česká kalkulačka penzijka, DIP a daňového odpočtu“ v https://github.com/frankie851/ceske-kalkulacky/blob/main/docs/zadani.md. Tento úkol opravuje nálezy nezávislé revize z 5. 11. 2026 (zpráva: https://github.com/frankie851/ceske-kalkulacky/blob/revize/2026-11-05/docs/revize/2026-11-05/plan48.md); revidován byl commit `48733fea370ca096397c964ed430fa48cd8ee11c` (jediný commit na `main`, živý web https://frankie851.github.io/plan48/ je s ním shodný). Výpočty jsou v `calc.js` (bez DOM), obrazovka v `app.js`, pravidla v `rules.json` (sady `2026` a `navrh2027`), testy v `test/calc.test.js` (`node --test`).

## Nálezy k opravě (seřazené podle závažnosti)
### P48-01 · Vysoká · Odpočet DPS krácen paušálně 20 400 Kč ročně místo po měsících; rada „mimořádně na penzijko“ nadhodnocená
- **Kde:** `calc.js:109–110` (`dpsCast = dpsRocne − 20 400`), `calc.js:170–173` (`doplatekDps = nevyuzity + doHranice`), `rules.json:31` (`dpsRocniHranice: 20400`), `app.js:41` (věta „případně X Kč mimořádně na penzijko“), `README.md:55–57`, `test/calc.test.js:94–97`
- **Reprodukce:** (a) Obrazovka, Pravidla 2026: věk 40, sazba 15 %, DPS 1 000 Kč/měs, 10 měsíců proběhlo → očekáváno „…(případně 48 000 Kč mimořádně na penzijko)“ → skutečnost „…(případně **55 000 Kč** mimořádně na penzijko)“. DPS 0 Kč/měs → 65 000 Kč místo 48 000 Kč; DPS 1 000 Kč, 11 měsíců → 55 700 Kč místo 48 000 Kč. (b) Modul: `odpocet({ dpsRocne: 11 × 1 000 + 30 000 }, R2026).vyuzity` → očekáváno 11 × 0 + (30 000 − 1 700) = 28 300 Kč → skutečnost 20 600 Kč. README ř. 57 tvrdí „Mimořádný vklad v prosinci se ale započte celý“, kód dělá opak.
- **Správná hodnota / pravidlo a zdroj:** § 15 odst. 7 zákona č. 586/1992 Sb., o daních z příjmů (ZDP; znění od 1. 1. 2027, stejné pravidlo platí už pro rok 2026): u DPS lze odečíst „pouze část **měsíčního** příspěvku, která převyšuje částku, od které náleží nejvyšší státní příspěvek“ – tj. v každém měsíci zvlášť část nad 1 700 Kč (§ 14 odst. 2 písm. b) zákona č. 427/2011 Sb., ZDPS). Rejstřík DP-12, https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101. Roční odečet 12 × 1 700 = 20 400 Kč dává správný výsledek jen u rovnoměrných vkladů. Očekávané hodnoty: profil 11 × 1 000 Kč + prosinec 30 000 Kč → 28 300 Kč; 11 × 0 + 48 000 Kč → 46 300 Kč; 11 × 1 000 + 31 000 Kč → 29 300 Kč; 11 × 3 500 + prosinec 3 500 + 26 400 Kč → 48 000 Kč (beze změny). Rada při DPS 1 000 Kč/měs a 10 proběhlých měsících: po navýšení listopadu a prosince na 1 700 Kč se prosincový mimořádný vklad započte celý, k vyčerpání limitu stačí 48 000 Kč (předpoklad revize: uživatel navýšení provede; bez navýšení by bylo správně 48 000 + (1 700 − 1 000) = 48 700 Kč, stále méně než 55 000 Kč).
- **Oprava:** počítat DPS část odpočtu z měsíčního profilu: Σ max(0, vklad_m − 1 700) přes 12 měsíců (proběhlé měsíce × původní vklad, zbývající měsíce × navýšený vklad, prosinec navíc + mimořádný vklad); u starobního důchodce hranice 0 (`duchodceBezHranice`). V radě (`spocitejRok`) pak `doplatekDps = nevyuzity + max(0, 1 700 − prosincovýPravidelnýVklad)`. V `rules.json` nahradit `dpsRocniHranice: 20400` měsíční hranicí 1 700 Kč (nejlépe odvozenou z `maxZaklad`, ať není dvakrát) se zdrojem § 15 odst. 7 ZDP a datem ověření. Opravit README ř. 55–57 (popis metody) a test ř. 94–97 (viz P48-02). Výsledky pro rovnoměrné vklady se nesmí změnit (DPS 5 700 → 48 000 Kč; DPS 3 000 + ŽP 2 500 → 45 600 Kč; DPS 2 000 → 3 600 Kč; důchodce 1 000 → 12 000 Kč).
- **Regresní test:** (1) `odpocet` s měsíčním profilem 11 × 1 000 Kč + prosinec 30 000 Kč → `vyuzity` 28 300 Kč (dnes 20 600 Kč); profil 11 × 0 + 48 000 Kč → 46 300 Kč (dnes 27 600 Kč). (2) `spocitejRok({ vek: 40, sazbaDane: 0.15, dps: 1000, mesicuProbehlo: 10 }, R2026).doporuceni.odpocet.doplatekDps` → 48 000 Kč (dnes 55 000 Kč); totéž s `dps: 0` → 48 000 Kč (dnes 65 000 Kč); `dps: 1000, mesicuProbehlo: 11` → 48 000 Kč (dnes 55 700 Kč). (3) rovnoměrný profil 12 × 2 000 Kč → 3 600 Kč a `doplatekDipZp` u DPS 3 500 Kč / 10 měsíců → 26 400 Kč (musí dál procházet).

### P48-02 · Střední · Test „mimořádný vklad v prosinci se započte celý“ zakonzervuje chybu, chybí test nepravidelného profilu a rady u vkladu < 1 700 Kč
- **Kde:** `test/calc.test.js:94–97` (očekává 20 600 Kč), `test/calc.test.js:137–145` (očekává `doplatekDps = 48 000 + 7 000`)
- **Reprodukce:** `node --test` → 34/34 prošlo, přestože podle § 15 odst. 7 ZDP je u 11 × 1 000 + 30 000 Kč správně 28 300 Kč a u rady „1 000 Kč/měs, 10 měsíců“ správně 48 000 Kč na DPS; testy potvrzují hodnoty modulu, ne zákona. Žádný test nekontroluje měsíční profil, radu při DPS 0 Kč ani chování prázdného věku v návrhu 2027.
- **Správná hodnota / pravidlo a zdroj:** stejné hodnoty jako v P48-01 (28 300 Kč; 48 000 Kč), zdroj § 15 odst. 7 ZDP, rejstřík DP-12, https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101.
- **Oprava:** po opravě P48-01 přepsat oba testy na zákonné hodnoty – to je jediná povolená změna očekávaných hodnot v existujících testech, do komentáře dej odkaz na § 15 odst. 7 ZDP – a doplnit případy: měsíční profil s prosincovým mimořádným vkladem (28 300 Kč; 46 300 Kč), rada při DPS 0 Kč/měs a 10 proběhlých měsících (`doplatekDps` 48 000 Kč), starobní důchodce s nepravidelným profilem (od první koruny), věk 0 / prázdný v sadě `navrh2027` (viz P48-06).
- **Regresní test:** nález je o testech samotných – „selhávající test“ je test ř. 94–97 s očekáváním 28 300 Kč a test ř. 137–145 s `doplatekDps` 48 000 Kč: na revidovaném commitu musí selhat, po opravě P48-01 projít. Do tabulky v PR uveď názvy všech přidaných testů.

### P48-03 · Střední · Žádné chybové hlášky ani validace: desetinná čárka, záporné číslo a hodnoty mimo rozsah se tiše přepočítají
- **Kde:** `index.html:39` (`novalidate`), `index.html:45, 62, 79` (`type="number"` s `min`/`max` bez hlášky), `app.js:63–79` (`cisloZ` vrací 0, `Math.min(120 | 11, …)` tiše ořízne)
- **Reprodukce:** Chromium s lokalizací en-US: do pole DPS napsat „1500,50“ → očekáváno 1 500,50 Kč nebo hláška → skutečnost pole ukáže „150050“ a dlaždice „4 080 Kč“, „48 000 Kč“, „Nic dalšího není potřeba“. „−500“ → pole nevalidní (min 0), výsledek „0 Kč – vklad pod 500 Kč“ bez hlášky. Věk 150 → tiše 120; měsíců 15 → tiše 11 („na zbývající měsíc“). „1 500“ (mezera) a „abc“ jsou v pořádku. Poznámka revize: v česky lokalizovaném prohlížeči může číselné pole čárku přijmout jako desetinnou – nález stojí hlavně na chybějící hlášce, ne na konkrétní hodnotě; i tak doplň kontrolu validity a hlášku.
- **Správná hodnota / pravidlo a zdroj:** požadavek zadání (chybové stavy, mobil), žádný právní předpis. Očekávané chování: nečitelná hodnota nebo hodnota mimo rozsah → viditelná hláška u pole a žádný tichý přepočet s náhradní hodnotou.
- **Oprava:** při čtení formuláře kontrolovat `input.validity` (`badInput`, `rangeUnderflow`, `rangeOverflow`, `stepMismatch`) a vlastní rozsahy (věk 0–120, měsíců 0–11); při chybě zobrazit text u pole (`aria-describedby`, `aria-invalid`, kontejner `role="alert"`) a výsledky nepřepočítat nebo zřetelně označit; hodnoty neořezávat tiše. Volitelně `type="text" inputmode="decimal"` s vlastním parsováním čárky a mezer (`cisloZ` to už umí) nebo aspoň `step="any"`.
- **Regresní test:** validace je v `app.js` (DOM), proto vyčleň parsování a kontrolu rozsahu do funkce bez DOM (např. exportovaná `overVstup` v novém malém modulu, který `app.js` importuje) a otestuj: „1500,50“ → 1 500,5; „−500“ → chyba; věk 150 → chyba (ne 120); měsíců 15 → chyba (ne 11); „1 500“ → 1 500. Před opravou taková funkce neexistuje, test selže. Ruční ověření na 360 px: „−500“ v poli DPS zobrazí hlášku.

### P48-04 · Střední · Chybí upozornění na podmínku daňové podpory (120 měsíců a 60 let) a navrácení podpory při předčasném výběru
- **Kde:** `index.html` (celá stránka), `README.md` – `grep -iE '120|10 let|60 let|dodan|navrácen'` najde jen projekci „do 60 let“
- **Reprodukce:** zadání („Hlídat v pravidlech“: u DIP vzniká nárok na odpočet jen při trvání aspoň 10 let a výběru nejdřív v 60 letech) → skutečnost: aplikace radí „pošlete ještě 48 000 Kč na DIP, životní pojištění nebo mimořádně na penzijko“ bez této podmínky (obrazovky 360 i 1440 px).
- **Správná hodnota / pravidlo a zdroj:** § 15b odst. 1 písm. a) bod 1 ZDP (ve znění zákona č. 128/2026 Sb.): daňová podpora jen u produktu, z něhož je výplata sjednána nejdříve po 120 kalendářních měsících od vzniku a nejdříve v roce dosažení 60 let; § 15b odst. 4 ZDP: při porušení podmínek se uplatněné odpočty dodaní (navrácení podpory). Rejstřík DP-15, https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101; zákon č. 128/2026 Sb. čl. III bod 1, https://www.zakonyprolidi.cz/cs/2026-128.
- **Oprava:** do poznámky pod „Co udělat do 31. 12.“ (`#akce-pozn`) a do patičky doplnit jednu větu o podmínce 120 měsíců / 60 let a o dodanění při předčasném výběru s odkazem na § 15b ZDP; do `rules.json` přidat parametry `podporaMesicu: 120` a `podporaVek: 60` se zdrojem a datem a text z nich skládat (žádná čísla natvrdo v kódu).
- **Regresní test:** test nad `rules.json`: sada `2026` má `podporaMesicu === 120` a `podporaVek === 60` a u nich zdroj s URL obsahující `zakonyprolidi.cz/cs/1992-586` – dnes selže. Ruční ověření: věta je vidět u rady na 360 px.

### P48-05 · Střední · Odpočet citován jako „§ 15a ZDP“ v UI, rules.json, README i kódu; správně § 15 odst. 6–7 (a § 15b podmínky)
- **Kde:** `rules.json:16` (poznámka zobrazená v patičce), `rules.json:19` (název zdroje „(§ 15a)“), `calc.js:103` (komentář), `README.md:55`
- **Reprodukce:** patička „odpočet podle § 15a ZDP“ a odkaz „Zákon č. 586/1992 Sb., o daních z příjmů (§ 15a)“ → podle textu zákona § 15a jen definuje produkty spoření na stáří; limit 48 000 Kč je v § 15 odst. 6, krácení u DPS v § 15 odst. 7, podmínky podpory v § 15b. Čísla to nemění, uživatel hledá ve špatném paragrafu.
- **Správná hodnota / pravidlo a zdroj:** § 15 odst. 6 a 7 ZDP (limit a krácení), § 15b ZDP (podmínky 120 měsíců / 60 let); rejstřík DP-11, DP-12, DP-15; https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101 (konsolidované znění s kotvou: https://www.zakonyprolidi.cz/cs/1992-586#p15). Chyba je převzata ze zadání („ověř proti § 15a“) – jde o chybu v zadání: opravuje se aplikace podle úředního zdroje, zadání se nemění (opraví David zvlášť).
- **Oprava:** ve všech čtyřech místech nahradit „§ 15a“ za „§ 15 odst. 6 a 7 ZDP (podmínky § 15b)“; u zdroje v `rules.json:19` upravit název a URL na konsolidované znění a aktualizovat datum ověření sady.
- **Regresní test:** test nad `rules.json`: žádný text v `poznamka` ani v `zdroje[].nazev` sady `2026` neobsahuje „§ 15a“ a název zdroje ZDP obsahuje „§ 15 odst. 6“ – dnes selže. Po opravě `grep -n '15a' calc.js README.md rules.json` nic nenajde.

### P48-06 · Střední · Prázdné pole Věk se v sadě Návrh 2027 bere jako věk 0 → pásmo nezletilých (40 %, nárok od 100 Kč)
- **Kde:** `app.js:63–66, 71` (`cisloZ` → 0), `calc.js:76–81` (`najdiPasmo(0)` → pásmo 0–17), `rules.json:50`
- **Reprodukce:** Návrh 2027, smazat obsah pole Věk, DPS 1 700 Kč → očekáváno upozornění „zadejte věk“ (nebo výchozí dospělé pásmo) → skutečnost „8 160 Kč“, „680 Kč měsíčně (40 %)“; při DPS 100 Kč by ukázala nárok 40 Kč/měs. V sadě 2026 bez vlivu (jedno pásmo). V projekci to zdvojnásobí státní část až do 30 let.
- **Správná hodnota / pravidlo a zdroj:** návrh „Lepší penzijko“ (sněmovní tisk 285): 40 % jen do 30. narozenin, nárok od 100 Kč jen do 18. narozenin – rejstřík DP-06, DP-07, https://www.psp.cz/sqw/historie.sqw?o=10&T=285. Bez známého věku nelze pásmo určit: správně je hláška a žádný výsledek, nebo výchozí věk z `value="35"` (→ 340 Kč/měs, 4 080 Kč/rok).
- **Oprava:** prázdný nebo nevalidní věk neposílat do výpočtu – čtení vstupu vrátí chybu, u pole se zobrazí hláška (stejný mechanismus jako v P48-03) a výsledek se skryje; nebo brát výchozí věk z `value="35"`. Pásma v `calc.js`/`rules.json` neměň (`najdiPasmo(0)` je pro skutečný věk 0 správně).
- **Regresní test:** ve vyčleněné funkci čtení vstupu (viz P48-03): věk „“ → chyba (ne 0) – dnes neexistuje, selže. Pokud zvolíš výchozí věk: prázdný věk + DPS 1 700 Kč v sadě `navrh2027` → příspěvek 340 Kč/měs (ne 680 Kč). Ruční ověření: Návrh 2027, smazat věk → žádné „680 Kč měsíčně“.

## Nízké nálezy (nepovinné, oprav jen pokud to nezasáhne nic jiného)
- P48-07 · Zdroje návrhu 2027 jsou jen média · do `zdroje` sady `navrh2027` přidat sněmovní tisk 285 (https://www.psp.cz/sqw/historie.sqw?o=10&T=285) a tiskovou zprávu MF z 24. 8. 2026 (https://mf.gov.cz/cs/ministerstvo/media/tiskove-zpravy/2026/vlada-schvalila-lepsi-penzijko-64961), do poznámky „sněmovní tisk 285, 1. čtení 24. 9. 2026, výbory 29. 10. 2026, 2. čtení k 5. 11. 2026 neproběhlo“.
- P48-08 · Štítek „návrh, zatím neschváleno“ chybí u dlaždice státního příspěvku a u projekce · přidat `<span data-stitek>` k dlaždici příspěvku a k nadpisu projekce (stejný mechanismus jako u „Co udělat“).
- P48-09 · Drobné nepřesnosti textů · `app.js:274` „pro část základu daně nad 36násobek průměrné mzdy“ (§ 16 odst. 1 ZDP); `app.js:55` u 20. 12. doplnit „podle podmínek vaší penzijní společnosti“ (20. 12. 2026 je neděle, není to právní pravidlo); `README.md:154` překlep „Ve web nejsou“ → „Na webu nejsou“; `README.md:72` doplnit číslo tisku 285.

## Postup
1. Nejdřív si přečti zadání aplikace a zprávu z revize (odkazy výše). Nálezy nepřeformulovávej.
2. Ke každému nálezu v pořadí výše: (a) napiš regresní test, který teď **selže** a dokládá nález; (b) proveď opravu; (c) spusť všechny testy (`node --test`). Teprve pak další nález.
3. Když měníš pravidlo nebo hodnotu v `rules.json`, aktualizuj u ní zdroj (předpis, paragraf, URL) a datum ověření na den opravy.
4. Mimo uvedené nálezy nic neopravuj, nerefaktoruj a nepřepisuj (ani texty, ani styl, ani strukturu). Když při práci najdeš jinou chybu, zapiš ji do PR do sekce „Mimo rozsah“ a nech ji být.
5. Když se nález nepodaří zopakovat (test neselže, chování je jiné, než zpráva popisuje), **neopravuj naslepo**: zapiš do PR, co jsi zkusil a co jsi viděl, nález přeskoč a pokračuj dalším.
6. Na konci spusť všechny testy, otevři stránku v prohlížeči na šířce 360 px a ověř aspoň jeden opravený případ ručně.
7. Otevři PR do `main` s názvem „Opravy z nezávislé revize 5. 11. 2026“. Popis PR obsahuje tabulku **nález → test → stav** (opraveno / nezopakováno / přeskočeno s důvodem), seznam změněných souborů a sekci „Mimo rozsah“.

## Definice hotovo
- Každý kritický, vysoký a střední nález má řádek v tabulce PR se stavem a názvem testu.
- Všechny testy procházejí (`node --test`), žádný dřívější test nebyl smazán ani oslaben (změna očekávané hodnoty jen tam, kde to nález výslovně požaduje, s odkazem na zdroj).
- `rules.json` má u změněných hodnot aktuální zdroj a datum.
- Stránka funguje na 360 px bez vodorovného posuvníku a v konzoli nejsou chyby.
- Nic mimo nálezy nebylo změněno.
