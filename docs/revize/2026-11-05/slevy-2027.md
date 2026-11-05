# Revize: Slevy 2027 (`frankie851/slevy-2027`)
Revidovaný commit: `d88ba427d8f665161b10071deb45c3a26bd4ac9d` (5. 11. 2026) · živý web: https://frankie851.github.io/slevy-2027/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Všechny částky, limity a termíny v `rules.json` odpovídají úředním zdrojům (zákon č. 180/2026 Sb., ZDP ve znění od 1. 1. 2027, sdělení MPSV, daňový řád) a nezávislý přepočet 59 případů včetně všech sedmi příkladů ze zadání se s modulem shoduje u všech vstupů, které modul podporuje; oba scénáře zadané v prohlížeči ukázaly totéž co modul i můj výpočet. Nejvážnější jsou dvě chyby, při nichž aplikace ukáže slevu, na kterou nárok není: po návratu „Zpět“ a změně roku narození dítěte zůstane v součtu školkovné dítěte, které už není předškolní, a daňové zvýhodnění se nekrátí u dítěte, které v roce 2027 dovrší 26 let. Dobře je naopak oddělení výpočtu od obrazovky, přísná CSP bez cizích požadavků a úložišť, čitelná čeština, upozornění „nejde o poradenství“ i funkční odkazy na primární zdroje.
Nálezy: Kritická 0 · Vysoká 2 · Střední 5 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟡 | SLV-04 |
| 2 Výpočty | 🔴 | SLV-01, SLV-02 |
| 3 Shoda se zadáním | 🟢 | — |
| 4 Testy | 🟡 | SLV-06 |
| 5 Mobil a přístupnost | 🟡 | SLV-03, SLV-07 |
| 6 Texty a citlivá témata | 🟢 | — |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
Všechny hodnoty z `rules.json` (ověřeno 2026-11-05) a konstanty v textech `app.js`; ověřeno proti rejstříku `pravidla.md` a vlastním čtením předpisů na zakonyprolidi.cz (ZDP znění od 1. 1. 2027, daňový řád, sdělení 171, 184, 186/2026 Sb., NV 177/2026 Sb., zákon 128/2022 Sb.) 5. 11. 2026. Odkazy na e-Sbírku v patičce se v prohlížeči skládají a odpovídají (`dukazy/slevy-2027/zdroje.json`).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Minimální mzda 2027 | `rules.json` minimalniMzda 24 900 Kč | 24 900 Kč měs. (148,30 Kč/h) | DP-24 – sdělení MPSV č. 171/2026 Sb., https://www.zakonyprolidi.cz/cs/2026-171 | 5. 11. 2026 | shodné |
| Sazby 15 % / 23 %, hranice 36× PM | `rules.json` sazbaDane 0,15 / 0,23 / 1 859 868 Kč | 36 × 51 663 Kč = 1 859 868 Kč | DP-29, DP-30 – § 16 ZDP; NV 177/2026 Sb. (48 900 × 1,0565) | 5. 11. 2026 | shodné |
| Zaokrouhlení: základ na sta dolů, daň na Kč nahoru | `slevy.js:148–152` | § 16 odst. 2 ZDP; § 146 odst. 1 DŘ | DP-39 | 5. 11. 2026 | shodné |
| Sleva na poplatníka | `rules.json` 30 840 / 2 570 Kč | 30 840 Kč | DP-18 – § 35ba odst. 1 písm. a) | 5. 11. 2026 | shodné |
| Sleva na manžela: 24 840 Kč (ZTP/P 49 680), příjem ≤ 68 000 Kč, dítě do 3 let, jen ročně | `rules.json` manzel; `slevy.js:56–72`, `app.js` kde = roční zúčtování | 24 840 Kč, dvojnásobek u ZTP/P; „nedovršilo věku 3 let“; „příjem nepřesahující 68 000 Kč“; měsíčně nelze (§ 38h odst. 6) | DP-19 – § 35bb, § 35ba odst. 3, § 38h odst. 6 ZDP | 5. 11. 2026 | shodné (včetně 1/12 za měsíc) |
| Invalidita I./II. st. 2 520 Kč, III. st. 5 040 Kč | `rules.json` invalidita12/3 | 2 520 / 5 040 Kč | DP-20 – § 35ba odst. 1 písm. c), d) | 5. 11. 2026 | shodné |
| ZTP/P 16 140 Kč | `rules.json` ztpp | 16 140 Kč | DP-21 – § 35ba odst. 1 písm. e) | 5. 11. 2026 | shodné |
| Sleva na studenta 4 020 Kč, do 26 let, prezenční doktorské do 28 let, měsíčně i v zálohách | `rules.json` student; `slevy.js:33–39`; `app.js` druh „doktorskeJine“ → 26 let | 4 020 Kč; § 35bc odst. 2; měsíční sleva § 35d odst. 1 písm. a), c)–f) | DP-22 – zákon č. 180/2026 Sb.; ZDP § 35bc, § 35d | 5. 11. 2026 | shodné (novinka 2027 správně označena jako schválený zákon) |
| Školkovné: výdaje, nejvýš min. mzda na dítě; dělení počtem domácností dolů / písemná dohoda; jen ročně | `rules.json` skolkovne 24 900; `slevy.js:79–93` | § 35bd odst. 1–3; § 38h odst. 6 | DP-23 | 5. 11. 2026 | shodné |
| Daňové zvýhodnění 15 204 / 22 320 / 27 840 Kč, ZTP/P ×2, už za měsíc narození | `rules.json` deti; `slevy.js:101–117` | § 35c odst. 1, 7, 10 | DP-25, DP-26 | 5. 11. 2026 | částky shodné; **věková hranice dítěte (26 let) se neuplatňuje – SLV-02** |
| Vyživované dítě: nezletilé, zletilé do 26 let při soustavné přípravě | neuplatněno (jen nápověda v `app.js`, validace roku ≥ 2001) | § 35c odst. 6 písm. a), b) ZDP | https://www.zakonyprolidi.cz/cs/1992-586/zneni-20270101 (v rejstříku chybí – doplnit) | 5. 11. 2026 | **chybí ve výpočtu – SLV-02** |
| Bonus: příjem § 6/§ 7 ≥ 6× min. mzdy (149 400 Kč), aspoň 100 Kč, bez horního limitu | `rules.json` deti.bonus*; `slevy.js:159–173` | § 35c odst. 3, 4 | DP-27 | 5. 11. 2026 | shodné |
| Produkty na stáří 48 000 Kč; DPS jen část měsíčního příspěvku nad 1 700 Kč | `rules.json` stari 48 000 / 20 400; `slevy.js:121–126` | § 15 odst. 6, 7 (po měsících) | DP-11, DP-12, DP-14 | 5. 11. 2026 | limit shodný; **paušál 20 400 Kč/rok místo měsíčního výpočtu – SLV-05** |
| Úroky 150 000 Kč na domácnost, 1/12 za měsíc; 300 000 Kč u bytové potřeby obstarané před 1. 1. 2021 | `rules.json` uroky; `slevy.js:128–133`; text „smlouva před 1. 1. 2021“ | § 15 odst. 3, 4 ZDP; zákon č. 386/2020 Sb. čl. IV | DP-31 | 5. 11. 2026 | částky shodné; **podmínka formulována podle data smlouvy – SLV-04** |
| Dary ≥ 1 000 Kč nebo > 2 % ZD, max. 15 % ZD; krev 3 000 Kč; 30 % jen 2022–2026 | `rules.json` dary; `slevy.js:136–144` | § 15 odst. 1 ZDP; zákon č. 128/2022 Sb. § 1 odst. 1 ve znění 24/2025 Sb. | DP-32 | 5. 11. 2026 | hodnoty shodné; citace „66/2022 Sb.“ chybná (SLV-09); strop ze sníženého základu (SLV-08) |
| Odbory, zkoušky – zrušeno od 2024 | `rules.json` odbory/zkousky zruseno | § 15 ZDP bez těchto odstavců | DP-33 | 5. 11. 2026 | shodné |
| Přiznání zaměstnance: ostatní příjmy § 7–10 nad 40 000 Kč; obecná hranice 100 000 Kč | `rules.json` priznani; `slevy.js:184–190` (> 40 000) | § 38g odst. 1, 2 („vyšší než 40 000 Kč“) | DP-34 | 5. 11. 2026 | shodné |
| Malé dohody 2027: záloha, DPP < 12 500 Kč, ostatní < 5 000 Kč, nezakládají přiznání | `rules.json` priznani.limitMale*; texty `app.js` | § 6 odst. 4, § 38g odst. 2, § 38h odst. 10; sdělení 184 a 186/2026 Sb. | DP-35 | 5. 11. 2026 | shodné |
| Prohlášení do 15. 2. 2027 (nástup do 30 dnů) | `rules.json` terminy.prohlaseni | § 38k odst. 4 ZDP; 15. 2. 2027 pondělí | DP-36 | 5. 11. 2026 | shodné |
| Žádost o roční zúčtování do 15. 2. 2028 | `rules.json` terminy.rocniZuctovani | § 38ch odst. 1 ZDP; 15. 2. 2028 úterý | DP-37 | 5. 11. 2026 | shodné |
| Přiznání za rok 2027: 3. 4. / 2. 5. / 3. 7. 2028 | `rules.json` terminy.priznani* | § 136 odst. 1, 2 a § 33 odst. 1, 4 DŘ; 1. 4. 2028 sobota, 1. 5. 2028 svátek, 1. 7. 2028 sobota (vlastní výpočet `prepocet.txt` T1, T3) | DP-38 | 5. 11. 2026 | shodné; aplikace ukazuje jen rok 2027 (termíny za rok 2026 neuvádí) |
| Texty: 149 400 Kč, 24 900 Kč, 68 000 Kč, 1 700 Kč, 48 000 Kč, 150 000 / 300 000 Kč, 1 000 Kč / 2 % / 15 %, 40 000 / 100 000 Kč | `app.js` nápovědy a „Novinky roku 2027“ | viz výše | DP-18 až DP-35 | 5. 11. 2026 | shodné s `rules.json` |

## Nezávislý přepočet
Skript `dukazy/skripty/slevy-2027-prepocet.mjs` (bez kódu aplikace) a `slevy-2027-porovnani.mjs`; úplná tabulka 59 případů + 2 scénářů v `dukazy/slevy-2027/prepocet.txt` (2 běhy, shodné). Obrazovka: `dukazy/slevy-2027/prohlizec.json`, snímky `vysledek-360.png`, `vysledek-1440.png`, `vysledek2-360.png`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 student 22 let celý rok (zadání) | nar. 1/2005, studium 1–12 | 4 020 Kč | 4 020 Kč | — | ano |
| Z2 student leden–červen (zadání) | nar. 1/2005, studium 1–6 | 2 010 Kč | 2 010 Kč | 2 010 Kč (scénář B) | ano |
| Z3 věk 27, bakalář (zadání) | nar. 1/2000 | 0 Kč | 0 Kč | — | ano |
| Z4 2 děti celý rok (zadání) | nar. 4/2018, 9/2021 | 37 524 Kč | 37 524 Kč | 37 524 Kč (scénář A) | ano |
| Z5 školkovné (zadání) | školné 30 000 / 12 000 Kč | 24 900 / 12 000 Kč | 24 900 / 12 000 Kč | 24 900 Kč (scénář A) | ano |
| Z6 manželka (zadání) | příjem 50 000 / 70 000 Kč, dítě 2 roky | 24 840 / 0 Kč | 24 840 / 0 Kč | 24 840 Kč (scénář A) | ano |
| Z7 DIP 60 000 Kč (zadání) | DIP 60 000 | 48 000 Kč | 48 000 Kč | odpočet 48 000 Kč, úspora 7 200 Kč (scénář B) | ano |
| V1 student dovrší 26 let v červnu | nar. 6/2001 | 2 010 Kč (6/12) | 2 010 Kč | — | ano |
| V2 student narozený 1. 6. 2001 | nar. 1. 6. 2001 | 1 675 Kč (5/12) | 2 010 Kč | — | ne – modul den nezná, předpoklad přiznán v README (SLV-10) |
| V3–V5 doktorand 27 let prezenční / 28 let / kombinovaný | nar. 1/2000; 3/1999; 1/2000 | 4 020 / 670 / 0 Kč | 4 020 / 670 / 0 Kč | — | ano |
| V7, V8 manžel příjem 68 000 / 68 001 Kč | dítě 3/2025 | 24 840 / 0 Kč | 24 840 / 0 Kč | — | ano |
| V9 manžel: dítě dovrší 3 roky v listopadu | dítě 11/2024 | 22 770 Kč (11/12) | 22 770 Kč | — | ano |
| V10 manžel: dítě narozené v dubnu 2027 | dítě 4/2027 | 16 560 Kč (8/12) | 16 560 Kč | — | ano |
| V11 manžel ZTP/P | dítě 3/2025 | 49 680 Kč | 49 680 Kč | — | ano |
| V13 dítě narozené v dubnu 2027 | nar. 4/2027 | 11 403 Kč (9/12) | 11 403 Kč | — | ano |
| V14, V15 dítě ZTP/P; 3 děti | — | 30 408 Kč; 65 364 Kč | 30 408 Kč; 65 364 Kč | — | ano |
| **V16 dítě dovrší 26 let v březnu 2027** | nar. 3/2001, v domácnosti 1–12 | **3 801 Kč** (3/12, § 35c odst. 6 písm. b)) | **15 204 Kč** | — | **ne – SLV-02** |
| V18–V21 školkovné 2 / 3 domácnosti; dohoda 17 430; dohoda 30 000 | školné 30 000 | 12 450 / 8 300 / 17 430 / 24 900 Kč | 12 450 / 8 300 / 17 430 / 24 900 Kč | — | ano |
| V23 školné 0 / −5 000 Kč | — | 0 Kč | 0 Kč | — | ano |
| V24, V25 penzijko 24 000 / 20 400 Kč rovnoměrně | — | 3 600 / 0 Kč | 3 600 / 0 Kč | — | ano |
| **V26 penzijko jednorázově v prosinci 48 000 Kč** | 11× 0, prosinec 48 000 | **46 300 Kč** (§ 15 odst. 7 po měsících) | **27 600 Kč** | — | **ne – SLV-05** |
| V27, V28 součet nad limit; DIP 48 000 | — | 48 000 / 48 000 Kč | 48 000 / 48 000 Kč | — | ano |
| V29–V32 úroky 200 000; před 2021; 6 měsíců; přesně 150 000 | — | 150 000 / 200 000 / 75 000 / 150 000 Kč | shodné | — | ano |
| V33–V37 dary 800; 500 + krev; 200 000 (strop); 999 při ZD 40 000; bez základu | — | 0 / 3 500 / 90 000 / 999 / 200 000 Kč | shodné | — | ano |
| **V38 dary 100 000 při ZD 600 000, jiné odpočty 198 000** | — | **90 000 Kč** (15 % ze základu daně) | **60 300 Kč** (15 % ze sníženého základu) | — | **ne – SLV-08** |
| V39 daň: ZD 240 000, 1 dítě | mzda 20 000 × 12 | daň 36 000 → 0, bonus 10 044 Kč | shodné | — | ano |
| V40–V42 bonus při 149 399 / 149 400 Kč; bonus 50 Kč | — | 0 / 15 204 / 0 Kč | shodné | — | ano |
| V43, V44 pásmo 23 % (ZD 2 000 000); ZD 240 099 | — | 311 211 Kč; 36 000 Kč | shodné | — | ano |
| V46–V49 přiznání: 40 000 / 40 001 / souběh 1 Kč / malé dohody | — | ne / ano / ano / ne | shodné | — | ano |
| T1 termíny za rok 2027 | — | 15. 2. 2027; 15. 2. 2028; 3. 4.; 2. 5.; 3. 7. 2028 | shodné (`rules.json`) | 15. 2. 2027 / 15. 2. 2028 / 3. 4. a 2. 5. 2028 ve výsledku | ano |
| **Scénář A (vlastní, prohlížeč)** | nar. 5/1990, mzda 45 000 × 12, děti 4/2018 a 3/2025 (školka 30 000), manželka 50 000 Kč, úroky 120 000, penzijko 36 000 + DIP 10 000, dary 5 000 + 2 odběry | Až 141 594 Kč; reálně 118 524 Kč (daň 57 510 → 0, bonus 37 524); položky 30 840 / 24 840 / 24 900 / 37 524 / 3 840 (25 600) / 18 000 (120 000) / 1 650 (11 000) | shodné | 360 i 1 440 px: Až 141 594 Kč, reálně 118 524 Kč, všechny řádky shodné, kde/kdy správně | ano |
| **Scénář B (vlastní, prohlížeč)** | student nar. 1/2005, studium 1–6, mzda 25 000 × 12, DIP 60 000, ostatní příjmy 45 000 | Až 40 050 Kč; reálně 40 050 Kč (daň 44 550 → 11 700); přiznání povinné | shodné | Až 40 050 Kč, reálně 40 050 Kč, student 335 Kč/měs., DIP „Daňové přiznání, do 3. 4. 2028, do 2. 5. 2028 elektronicky“ | ano |
| Vlastní, prohlížeč: „84 512,30“ v číselném poli (cs-CZ / en-US) | školné / úroky | 84 512 Kč | — | cs-CZ: 84512.30 (správně); en-US: 8 451 230 | cs-CZ ano / **en-US ne – SLV-03** |
| Vlastní, prohlížeč: Zpět a změna roku dítěte 2023 → 2012 po zadání školného 20 000 | — | školkovné 0 Kč (dítě není předškolní) | modul dostane `skolka: true` ze zastaralého stavu → 20 000 Kč | výsledek „Školkovné 20 000 Kč“, Až 66 044 Kč | **ne – SLV-01** |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: statický web, dotazník → seznam slev, zvýhodnění a odpočtů s částkou měsíčně a ročně, kde a kdy uplatnit, novinky 2027 vyznačené | splněno | `vysledek-360.png`, `prohlizec.json` (sloupce Měsíčně/Ročně/Kde/Do kdy, štítky „Novinka 2027“, „Změna 2027“) |
| Čisté HTML + CSS + JS (ES moduly), žádný build ani server | splněno | `index.html:13` `<script type="module">`, `package.json` bez závislostí |
| Logika v `slevy.js` (čisté funkce), parametry v `rules.json` se zdrojem a datem | splněno | `slevy.js` bez DOM (importovatelný v Node – `prepocet.txt`); `rules.json` `zdroje`, `overeno` u každé položky |
| Testy `node --test`; nasazení GitHub Pages | splněno | `testy.txt` (30/30), živý web HTTP 200 = main |
| „Než začneš psát kód“: tabulka hodnota → zdroj → datum pro 2027 | splněno | `README.md` „Stav ověření hodnot pro rok 2027“ + `rules.json` |
| Měsíční slevy 1/12 za měsíc, na jehož počátku jsou podmínky splněny | splněno | `slevy.js:13–24, 37, 65–68`; V1, V9, V10, V13 |
| Manžel, školkovné a odpočty jen ročně | splněno | `slevy.js:243, 249, 266–280` (`kde: rocniKde`), obrazovka „Žádost o roční zúčtování (jen ročně)“ |
| Školkovné = min(školné, minimální mzda) na každé dítě | splněno | Z5, V18–V22; `slevy.js:88–93` |
| Slevy snižují daň max. na nulu; zvýhodnění může vytvořit bonus | splněno | `slevy.js:159–173`; V39–V42; scénář A (daň 0, bonus 37 524 Kč) |
| Obrazovka 1: jedna otázka na obrazovku, max. 10, tlačítko Zpět; otázky věk a studium, děti (počet, věk, školka, školné, ZTP/P), manžel (příjem, dítě do 3 let), invalidita/ZTP/P, hypotéka, penzijko/DIP/ŽP, dary, vedlejší příjmy | splněno | `app.js` pole `kroky` (10 kroků), `prohlizec.json` průchody; Zpět zachová hodnoty (`chyby.zapornaMzdaA15Mesicu.hodnotyPoZpet`) |
| Obrazovka 2: tabulka sleva → Kč měsíčně → Kč ročně → kde → do kdy; nahoře „Až X Kč ročně“; štítek „Novinka 2027“ | splněno | `vysledek-360.png`, `vysledek-1440.png` |
| Obrazovka 3: kontrolní seznam k vytištění (co podepsat, jaké doklady) | splněno | `seznam-360.png`, `styles.css:199–205` (@media print) |
| Obrazovka 4: patička „Orientační přehled, nejde o daňové poradenství“, datum ověření, zdroje | splněno | `index.html:38–44`; datum 5. 11. 2026 = `rules.json.overeno` (živý web `prohlizec.json.zivyWeb.overeno`) |
| Testy projdou včetně 7 uvedených případů | splněno | `test/slevy.test.js:22–61`, `testy.txt` |
| Web funguje na 360 px bez vodorovného posuvníku | splněno | přetékání false ve všech stavech (`uvod-kontrola.json`, `prohlizec.json`: krok děti, výsledek, seznam, živý web) |
| Odpovědi se neukládají ani neodesílají | splněno | síť jen 5 vlastních požadavků, `localStorage` prázdný, 0 cookies (`prohlizec.json.sit`), CSP `connect-src 'self'` |
| README česky: jak každý rok aktualizovat `rules.json` | splněno | `README.md` „Každoroční aktualizace rules.json“ (11 kroků) |
| Postup: projít testovací případy ručně v prohlížeči | splněno (ověřeno revizí) | scénáře A a B v prohlížeči shodné s modulem |
| Zadání × úřední zdroj | — | podklady zadání jsou v souladu (rejstřík, „Chyby v zadání“); zadání u úroků říká jen „max. 150 000 Kč“ a vede k formulaci podle smlouvy (SLV-04 je i nepřesnost zadání: zákon váže 300 000 Kč na bytovou potřebu obstaranou před 1. 1. 2021) |

## Nálezy
### SLV-01 · Vysoká · 2 Výpočty · Školkovné zůstane po změně roku narození dítěte (zastaralý stav formuláře)
- **Kde:** `app.js` krok „Chodí některé dítě do školky?“, funkce `cti` (aktualizuje jen děti, pro které byla pole vykreslena: `if (fd.has(\`skolne${i}\`))`), `html` filtruje děti s rokem ≥ 2020; `odpovedi()` předává `skolka: true` a `skolne` ze zastaralého stavu; `slevy.js:88–93` `skolkovne()` věk dítěte nekontroluje.
- **Reprodukce:** 1 dítě nar. 2023 → krok školka: zaškrtnout, školné 20 000 → Další → 2× Zpět → změnit rok dítěte na 2012 → Další: krok 4 říká „Nezadali jste žádné dítě v předškolním věku“ → projít na výsledek. Očekáváno: žádné školkovné (dítě 15 let není v předškolním zařízení, § 35bd odst. 1 a 6). Skutečnost: řádek „Sleva za umístění dítěte (školkovné) 20 000 Kč“, součet „Až 66 044 Kč ročně“ místo 46 044 Kč; totéž v kontrolním seznamu (`prohlizec.json.zastaraleSkolkovne`, `cisla-lokalizace.txt`).
- **Dopad na uživatele:** po opravě překlepu v roce narození počítá s neexistující slevou 20 000 Kč (až 24 900 Kč) a odnese si špatný kontrolní seznam.
- **Doporučená oprava:** v `cti` kroku školky vynulovat `skolka`, `skolne`, `dveDomacnosti`, `dohodaStrop` u dětí, pro které se pole nevykreslila (nebo to udělat v `odpovedi()` podle věku); v `slevy.js` navíc hlídat věk dítěte (předškolní zařízení).
- **Ověření:** reprodukováno 2× (nový proces, en-US i cs-CZ) · skeptik:

### SLV-02 · Vysoká · 2 Výpočty · Daňové zvýhodnění se nekrátí u dítěte, které v roce 2027 dovrší 26 let (ani 18 let bez studia)
- **Kde:** `slevy.js:101–117` `zvyhodneniDeti()` (kontroluje jen narození a měsíce od–do), `app.js` validace přijímá rok narození ≥ 2001 (`rules.rok - 26`), nápověda kroku „Máte děti?“ říká „do 18 let, nebo do 26 let, pokud studují“, ale nevyzve ke zkrácení „V domácnosti do“ a neptá se na studium dítěte.
- **Reprodukce:** dítě nar. 3/2001, v domácnosti 1–12 → očekáváno 3 × 1 267 = 3 801 Kč (§ 35c odst. 6 písm. b) – vyživované je zletilé dítě „až do dovršení věku 26 let“; 1/12 za měsíc, na jehož počátku jsou podmínky splněny, § 35c odst. 10; na počátku dubna už 26 let má) → skutečnost 15 204 Kč (`prepocet.txt` V16). Obdobně dítě 2009 (18 let v roce 2027), které nestuduje, dostane 12/12.
- **Dopad na uživatele:** rodič staršího studenta počítá s 15 204 Kč, nárok je 3 801 Kč (rozdíl 11 403 Kč); u ZTP/P dvojnásobek.
- **Doporučená oprava:** v `zvyhodneniDeti()` započítat jen měsíce, na jejichž počátku dítě nedovršilo 26 let (modul zná rok i měsíc narození, stejně jako u manžela `mladsiNez(d.narozeni, 3, …)`); u dětí 18+ se zeptat, zda se soustavně připravují (jinak hranice 18 let); doplnit test.
- **Ověření:** reprodukováno 2× (dva běhy `slevy-2027-porovnani.mjs`) · skeptik:

### SLV-03 · Střední · 5 Mobil a přístupnost · Desetinná čárka v číselném poli se v prohlížeči s jinou než českou lokalizací zahodí
- **Kde:** `app.js` `cisloPole()` – `<input type="number" step="1">`, `num()`; chování závisí na lokalizaci prohlížeče, ne na stránce (`<html lang="cs">` nestačí).
- **Reprodukce:** testováno v Chromiu 1243 v obou lokalizacích (`prohlizec.json.cislaLokalizace`, `cisla-lokalizace.txt`): **cs-CZ** (navigator.language cs-CZ): „1500,50“ → 1500.50, „84 512,30“ → 84512.30, „0,85“ → 0.85, „1 500“ → 1500 – správně. **en-US**: „1500,50“ → `150050`, „84 512,30“ → `8451230`, „0,85“ → `085`, mezera se ignoruje správně („1 500“ → 1500); `validity.badInput` je false, žádná hláška. Očekáváno: 84 512 Kč nebo zamítnutí vstupu. Skutečnost v en-US: 100× vyšší číslo; u úroků pak strop 150 000 Kč místo 84 512 Kč (rozdíl „úspory“ 9 823 Kč), u školného strop 24 900 Kč.
- **Dopad na uživatele:** jen uživatelé s anglicky (jinak než česky) nastaveným prohlížečem – běžné na firemních počítačích; chyba je v poli vidět, ale nic na ni neupozorní (SLV-07).
- **Doporučená oprava:** `type="text" inputmode="decimal"` s vlastním parserem (odstranit mezery a NBSP, čárku → tečka) a hláškou při nečíselném vstupu; nebo alespoň `step="any"` a text „bez haléřů“.
- **Ověření:** reprodukováno 2× (dva nezávislé procesy, obě lokalizace) · skeptik:

### SLV-04 · Střední · 1 Pravidla a data · Limit úroků 300 000 Kč navázán na datum smlouvy místo na obstarání bytové potřeby
- **Kde:** `app.js` krok „Hypotéka“: nápověda „u smluv od roku 2021 nejvýš 150 000 Kč ročně, u starších 300 000 Kč“, zaškrtávátko „Úvěrová smlouva je uzavřená před 1. 1. 2021“; `rules.json:170` poznámka „150 000 Kč (smlouvy od 1. 1. 2021), 300 000 Kč u starších“.
- **Reprodukce:** zákon č. 386/2020 Sb. čl. IV bod 3 (DP-31): limit 300 000 Kč platí pro úroky z úvěru na bytovou potřebu **obstaranou před 1. 1. 2021** bez ohledu na datum smlouvy (typicky refinancování). Uživatel, který byt koupil 2019 a úvěr refinancoval 2023 (úroky 180 000 Kč), podle textu políčko nezaškrtne → aplikace ukáže odpočet 150 000 Kč, nárok je 180 000 Kč; naopak smlouva z prosince 2020 na byt nabytý 2021 → aplikace 300 000 Kč, nárok 150 000 Kč.
- **Dopad na uživatele:** chybná částka jen u úroků nad 150 000 Kč ročně (méně častý případ), rozdíl až 22 500 Kč na dani.
- **Doporučená oprava:** přeformulovat otázku na „bytová potřeba (byt, dům, pozemek…) obstaraná před 1. 1. 2021“ s vysvětlením, že refinancování nevadí; opravit poznámku v `rules.json`.
- **Ověření:** reprodukováno 2× (text zákona 386/2020 Sb. + rejstřík DP-31) · skeptik:

### SLV-05 · Střední · 2 Výpočty · Penzijní spoření: paušální odečet 20 400 Kč/rok místo měsíčního výpočtu
- **Kde:** `slevy.js:121–126` `odpocetStari()` (`penzijko − 20 400`), `rules.json:151` `penzijkoNezapocitane`; nápověda kroku „Spoření na stáří“ předpoklad přiznává.
- **Reprodukce:** § 15 odst. 7 ZDP (DP-12): odečíst lze „pouze část **měsíčního** příspěvku, která převyšuje částku, od které náleží nejvyšší státní příspěvek“ (1 700 Kč). Vklad 48 000 Kč jednorázově v prosinci → zákon 48 000 − 1 700 = 46 300 Kč; aplikace 27 600 Kč (`prepocet.txt` V26). Vklady 3 000 Kč/měs. jen 6 měsíců (18 000 Kč/rok) → zákon 7 800 Kč, aplikace 0 Kč.
- **Dopad na uživatele:** u nepravidelných nebo mimořádných vkladů (běžné na konci roku) podhodnocený odpočet až o 18 700 Kč (úspora 2 805 Kč); u pravidelných vkladů shodné.
- **Doporučená oprava:** ptát se na pravidelný měsíční vklad a případné mimořádné vklady (nebo počet měsíců placení) a počítat Σ max(0, měsíční vklad − 1 700); minimálně upozornit, že u nepravidelných vkladů je odpočet jiný.
- **Ověření:** reprodukováno 2× (dva běhy porovnání) · skeptik:

### SLV-06 · Střední · 4 Testy · Chybí testy pro věkovou hranici dítěte a vazbu formuláře na výpočet; test u úroků fixuje nepřesnou podmínku
- **Kde:** `test/slevy.test.js` – žádný test dítěte, které dovrší 18/26 let (`zvyhodneniDeti` by s chybou SLV-02 prošla), žádný test stropu darů vůči základu před odpočty (SLV-08), žádný test `vyhodnot()` se mzdou + manželem + školkovným; test „úroky … stará smlouva 300 000“ (`slevy.test.js:117–121`) zakonzervovává sémantiku „smlouva“ (SLV-04). UI stav (SLV-01) není testovatelný, protože `app.js` stav neexportuje.
- **Reprodukce:** `node --test` 30/30 prošlo (`testy.txt`, 2. běh shodný), přitom V16, V26, V38 se s referencí rozcházejí.
- **Dopad na uživatele:** nepřímý – chyby výpočtu projdou do nasazení.
- **Doporučená oprava:** doplnit testy pro V16 (3 801 Kč), dítě 18 let bez studia, V38, celý scénář A; po opravě SLV-04 přejmenovat vstup na `bytovaPotrebaPred2021`; vyčlenit převod stavu formuláře (`odpovedi()`) do testovatelné funkce.
- **Ověření:** reprodukováno 2× · skeptik:

### SLV-07 · Střední · 5 Mobil a přístupnost · Číselná pole nekontrolují platnost vstupu a nic nehlásí
- **Kde:** `app.js` `num()` (`Math.max(0, Math.floor(Number(v)))`), krok 1 `cti` (`Math.min(12, Math.max(1, …))`), `cisloPole()` (`<input type="number" min max step="1">` s `novalidate` na formuláři, `validity.badInput` se nečte); jediná hláška je u roku narození a u měsíců od > do.
- **Reprodukce:** mzda „−5000“ a „15“ měsíců → formulář projde bez hlášky, po Zpět je v polích 0 a 12 (`prohlizec.json.chyby.zapornaMzdaA15Mesicu`); školné „1500.50“ → tiše 1 500; „84 512,30“ v en-US prohlížeči → tiše 8 451 230 (SLV-03); počet dětí nad 10 se podle kódu tiše ořízne na 10; rok dítěte 2000 (27 let) vrátí jen obecné „Zadejte u každého dítěte rok narození“ bez důvodu (`prohlizec.json.chyby.dite2000`). Očekáváno: hláška „zadejte celé kladné číslo“ / „nejvýš 12 měsíců“ a zastavení kroku, jako u roku narození.
- **Dopad na uživatele:** překlep nebo cizí formát projde až do výsledku, uživatel se o úpravě vstupu nedozví; v kombinaci se SLV-03 vede k chybné částce.
- **Doporučená oprava:** společná validace číselných polí v `precti()`: `badInput`, záporná čísla, překročení `min`/`max` a desetinná místa → `role="alert"` hláška u konkrétního pole (`aria-describedby`), krok nepustit dál; hodnoty neořezávat tiše.
- **Ověření:** reprodukováno 2× (dva běhy `slevy-2027-prohlizec.mjs`) · skeptik:

### SLV-08 · Nízká · 2 Výpočty · Strop darů 15 % se počítá ze základu sníženého o ostatní odpočty
- **Kde:** `slevy.js:274` `zakladProDary = zakladDane − stari.odpocet − uroky.odpocet`, `slevy.js:142`.
- **Reprodukce:** § 15 odst. 1 ZDP: „v úhrnu lze odečíst nejvýše 15 % ze základu daně“ (základ podle § 5, nikoli snížený o jiné nezdanitelné části). ZD 600 000 Kč, stáří 48 000, úroky 150 000, dary 100 000 → zákon strop 90 000 Kč, aplikace 60 300 Kč (`prepocet.txt` V38).
- **Dopad na uživatele:** jen u velkých darů v kombinaci s velkými odpočty; podhodnocení (konzervativní).
- **Doporučená oprava:** počítat strop z `zakladDane`.
- **Ověření:** reprodukováno 2× · skeptik:

### SLV-09 · Nízká · 1 Pravidla a data · Chybná citace zákona u zvýšeného stropu darů
- **Kde:** `rules.json:185` („zákon č. 66/2022 Sb. ve znění zákona č. 24/2025 Sb.“).
- **Reprodukce:** strop 30 % za roky 2022–2026 stanoví § 1 odst. 1 zákona č. 128/2022 Sb. (https://www.zakonyprolidi.cz/cs/2022-128), novelizovaný zákonem č. 24/2025 Sb.; zákon 66/2022 Sb. je jiný předpis (DP-32). Hodnoty v aplikaci jsou správně.
- **Dopad na uživatele:** jen dohledatelnost zdroje.
- **Doporučená oprava:** opravit číslo předpisu v poznámce (a doplnit odkaz do `zdroje`).
- **Ověření:** reprodukováno 2× (zakonyprolidi.cz + rejstřík) · skeptik:

### SLV-10 · Nízká · 2 Výpočty · Nekonzistence vstupů: sleva na manžela bez zadaného dítěte, narozeniny 1. dne měsíce
- **Kde:** `slevy.js:63–64` (manžel bez zadaného dítěte → 12 měsíců), `slevy.js:17–24` `mladsiNez()` (narozeniny v měsíci se berou jako „ještě nedovršeno“).
- **Reprodukce:** 0 dětí + zaškrtnuto „Žijeme spolu s naším dítětem mladším 3 let“ → sleva na manžela 24 840 Kč, ale žádné daňové zvýhodnění na totéž dítě a žádné upozornění; student narozený 1. 6. 2001 → 6/12 místo 5/12 (`prepocet.txt` V2; 1. 6. 2027 už 26 let dovršil – README předpoklad přiznává).
- **Dopad na uživatele:** matoucí (zapomenuté dítě = nižší zvýhodnění), rozdíl 335 Kč u narozených 1. dne měsíce.
- **Doporučená oprava:** upozornit, že dítě do 3 let je třeba zadat i v kroku „Máte děti?“ (nebo slevu na manžela odvozovat jen ze zadaných dětí); volitelně den narození u hraničních měsíců.
- **Ověření:** reprodukováno 2× · skeptik:

### SLV-11 · Nízká · 5 Mobil a přístupnost · Celý dotazník je živá oblast `aria-live="polite"`
- **Kde:** `index.html:30` `<section id="dotaznik" … aria-live="polite">`; `app.js` `vykresliKrok()` přepisuje celý `innerHTML` oblasti.
- **Reprodukce:** každý krok vymění obsah živé oblasti (nadpis, dlouhá nápověda, pole, tlačítka) → čtečka obrazovky má přečíst celý krok, přitom skript současně přesouvá fokus na nadpis (`.otazka.focus()`) – dvojí oznámení; axe to nehlásí (0 nálezů ve všech stavech, `prohlizec.json`). S čtečkou neověřeno.
- **Dopad na uživatele:** zdržení uživatelů čteček; funkce není omezena.
- **Doporučená oprava:** `aria-live` ponechat jen pro chybovou hlášku (`role="alert"` už je) a případně pro „Otázka X z 10“; fokus na nadpis stačí.
- **Ověření:** reprodukováno 2× (kód + chování ve dvou bězích) · skeptik:

## Neslité větve
Žádné (`git ls-remote --heads origin` → jen `main` = `d88ba42`). GitHub workflow v repozitáři není; nasazení „Deploy from a branch“ podle README – živý web (všech 5 souborů, SHA-256) odpovídá `main`; v prohlížeči přes proxy: HTTP 200, 0 chyb konzole, 0 chybějících souborů, 0 cizích požadavků, axe 0, datum ověření 5. 11. 2026 (`prohlizec.json.zivyWeb`, `zivy-360.png`).

## Co se nepodařilo ověřit a předpoklady
- Tři sekundární zdroje v patičce (FakturaOnline, Peníze.cz, Portál POHODA) jsou z tohoto prostředí nedostupné (proxy odmítá spojení) – funkčnost odkazů neověřena; všech 16 úředních odkazů (e-Sbírka, Finanční správa, eet.gov.cz) se načetlo a odpovídá názvu (`zdroje.json`). Obsah e-Sbírky nešel číst přes curl, texty předpisů jsem četl na zakonyprolidi.cz.
- Chování `type="number"` s čárkou jsem ověřil v Chromiu 1243 v lokalizacích cs-CZ a en-US (prohlížeč spuštěný s `--lang` **a** proměnnými `LANG`/`LANGUAGE`; samotný parametr `otevriProhlizec({lang})` knihovny v tomto prostředí lokalizaci nepřepnul – `navigator.language` zůstal en-US); Firefox a Safari neověřeny.
- SLV-11 (aria-live) neověřeno skutečnou čtečkou obrazovky; axe WCAG 2.2 A/AA + best-practice hlásí 0 nálezů v úvodu, kroku s dětmi, chybovém stavu, výsledku i kontrolním seznamu.
- Předpoklad výpočtu věku: den narození neznámý → beru 15. den (shodně s aplikací); V2 ukazuje rozdíl jen u narozených 1. dne měsíce.
- Řazení dětí (1., 2., 3.) podle pořadí v dotazníku je přípustné (poplatník si pořadí volí, § 35c odst. 1 „posuzují se dohromady“), součet se nemění – nehodnotím jako chybu.
- Lhůty přiznání za rok 2026 (1. 4. / 3. 5. / 1. 7. 2027) aplikace neuvádí (zobrazuje jen rok 2027 s termíny 2028, které jsou správně); poznámka zadání revize „2. 5. 2027“ je chybná – vlastní výpočet dává 3. 5. 2027 (`prepocet.txt` T2).
- Zákon č. 245/2000 Sb. (svátky) jsem pro výpočet posunu lhůt použil ze znalosti pevných svátků a Velikonoc (Meeus), text zákona jsem neotevíral; výsledek je shodný s rejstříkem DP-38.
