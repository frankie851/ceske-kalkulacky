# Revize: Bydlometr (`frankie851/bydlometr`)
Revidovaný commit: `047298597072978a58322e6484e98fa564e80a07` (5. 11. 2026) · živý web: https://frankie851.github.io/bydlometr/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Připraveno
Výpočetní jádro je správné: nezávislý přepočet od nuly se shoduje s moduly `mortgage.js` a `rentbuy.js` ve 151 ze 152 případů (jediný rozdíl je chybějící strop podle § 117 odst. 5, který aplikace nepočítá), všech osm příkladů ze zadání vychází v modulu i na obrazovce a splátkový kalendář sedí na haléř. Nejvážnější jsou střední nálezy: kalkulačka poplatku ukazuje jen strop 0,25 %/rok (ne omezení § 117 odst. 5 a § 117a, takže „nejvýš 2 250 Kč“ může být řádově víc než zákonné maximum), u starších smluv nedá číslo ani v bezplatných případech, při chybném vstupu zůstanou na obrazovce staré výsledky a DTI ze zadání se nikde neukazuje. Dobře je oddělení výpočtu od obrazovky, všechny hodnoty v JSON se zdrojem a datem, parsování českých čísel („3 500 000“, „4,94“, „22,5“ i v en-US), CSP + SRI, žádná analytika ani ukládání, 0 porušení axe ve všech stavech a žádné přetékání na 360 px.
Nálezy: Kritická 0 · Vysoká 0 · Střední 7 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟡 | BYD-01 (jen strop § 117 odst. 4), BYD-02, BYD-07 |
| 2 Výpočty | 🟡 | BYD-05 (výsledek i při úvěru nad LTV) |
| 3 Shoda se zadáním | 🟡 | BYD-04 (DTI a odpočet úroků se neukazují) |
| 4 Testy | 🟡 | BYD-06 |
| 5 Mobil a přístupnost | 🟡 | BYD-03 (starý výsledek pod chybou) |
| 6 Texty a citlivá témata | 🟡 | BYD-01 („Poplatek nejvýš…“ není zákonné maximum), BYD-08 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | BYD-10 (jen favicon 404) |

## Pravidla
| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Max. LTV vlastní bydlení | `rules.json:8` `ltv.ownHousing` 0,8; `mortgage.js:170` | 80 % | rozhodnutí BR ČNB 4. 6. 2026 (FD-01); 2. zdroj stránka ČNB LTV (`zdroje-a-zakony.txt`) | 5. 11. 2026 | shodné; URL v aplikaci vede na ČNB a funguje |
| Max. LTV žadatel mladší 36 let | `rules.json:17` 0,9 | 90 % pro žadatele mladší 36 let | FD-02 | 5. 11. 2026 | shodné |
| Věková hranice | `rules.json:26` 36; `mortgage.js:173` `age < 36` | „mladší 36 let“ (do 35 včetně) | FD-03 | 5. 11. 2026 | shodné (věk 35 → 90 %, 36 → 80 %, `prepocet.txt`) |
| Doporučené LTV investiční nemovitost | `rules.json:35` 0,7 | 70 % od 1. 4. 2026 (doporučení) | TZ ČNB 27. 11. 2025 (FD-04), URL funguje | 5. 11. 2026 | shodné; v UI jen přes zaškrtávátko v nájem vs. koupě |
| Doporučené DTI investiční | `rules.json:46` 7 | DTI 7 od 1. 4. 2026 | FD-05 | 5. 11. 2026 | hodnota shodná, **v kódu nepoužito** (BYD-04) |
| DTI/DSTI vlastní bydlení | `rules.json:55` null | deaktivováno | FD-06 | 5. 11. 2026 | shodné; text „ukazatele DSTI a DTI jsou … deaktivované“ (`ui-refix.js:120`) |
| Účinnost nových pravidel předčasného splacení | `rules.json:66` 2024-09-01; `mortgage.js:105` (smlouva nebo fixace od data) | 1. 9. 2024; starší smlouvy od nové fixace | zákon 462/2023 Sb. čl. XV, XVI (FD-07); URL v aplikaci kb.cz (neúřední, z prostředí neověřitelné) | 5. 11. 2026 | shodné |
| Bezplatných 25 % v měsíci před výročím | `rules.json:75` 0,25 z původní výše; `mortgage.js:129–134` | § 117 odst. 3 písm. h): 25 % celkové výše, náhrada jen z přesahu | FD-08, text § 117 v `zdroje-a-zakony.txt` | 5. 11. 2026 | shodné (250 000 z 1 000 000 → 0; 400 000 → 1 125 Kč) |
| Okno před výročím | `rules.json:84` 1 měsíc; `mortgage.js:91` interval [výročí − 1 měsíc, výročí) | „během 1 měsíce přede dnem výročí“ | FD-09 | 5. 11. 2026 | shodné; den výročí sám není v okně (doslovný výklad) |
| Splátka ke konci fixace zdarma | `rules.json:93` true; `mortgage.js:126` | § 117 odst. 3 písm. c), d) | FD-10 | 5. 11. 2026 | shodné; u starších smluv ale aplikace číslo nedá (BYD-02) |
| Náhrada 0,25 %/započatý rok | `rules.json:102`; `mortgage.js:135–138` | § 117 odst. 4 věta 3 (účelové úvěry na bydlení) | FD-11 | 5. 11. 2026 | shodné (3 roky → 3 750 Kč; 1 den navíc → další rok) |
| Strop 1 % | `rules.json:111`; `mortgage.js:137` | § 117 odst. 4 „nejvýše však 1 %“ | FD-12 | 5. 11. 2026 | shodné (5 let → 5 000 Kč) |
| Strop úrokem do konce fixace a § 117a | není | § 117 odst. 5; § 117a (admin. max. 1 000 Kč + úrokový rozdíl) | FD-12, text zákona | 5. 11. 2026 | **nepočítá se** (BYD-01) |
| Další bezplatné důvody | nejsou | § 117 odst. 3 písm. a), b), e), f), g) | FD-13 | 5. 11. 2026 | chybí (součást BYD-02) |
| Limit odpočtu úroků | `rules.json:122` 150 000; `rentbuy.js:41,104` | 150 000 Kč (§ 15 odst. 4 ZDP) | FD-14 | 5. 11. 2026 | shodné; citace „§ 15 odst. 3“ nepřesná (BYD-07) |
| Limit 300 000 Kč starší bytové potřeby | `rules.json:131` „smlouvy do 31. 12. 2020“ | bytová potřeba obstaraná před 1. 1. 2021 | zákon 386/2020 Sb. čl. IV (FD-15) | 5. 11. 2026 | hodnota shodná, kritérium nepřesné, v kódu nepoužito (BYD-07, BYD-09) |
| Sazby daně 15 % / 23 % | `rules.json:140,149`; `ui-rentbuy.js:17` | § 16 ZDP | FD-16 | 5. 11. 2026 | shodné; URL banky.cz |
| Práh zátěže 40 %, varování od 30 % | `rules.json:160,170`; `mortgage.js:177` | bez úřední hodnoty | FD-17 | — | správně označeno „orientační, není to limit ČNB“ |
| Daň z nemovitosti Praha/Brno/Ostrava/ČR | `defaults.json:177,208,239,270` 38,43 / 14,95 / 14,95 / 8,54 Kč/m²/rok | 3,50 × 1,22 × koef. obce × místní koef. × infl. koef. 1,0 | zákon 338/1992 Sb. § 10–12, § 11f (FD-18, FD-19) | 5. 11. 2026 | vzorec shodný; místní koeficienty neověřené (aplikace to říká); UI dopočítá 60 m² → 2 306 Kč, 65,5 m² Brno → 979 Kč |
| Správní poplatek vklad do KN | `defaults.json:54` 4 000 (2 × 2 000); `:310` 12 000 | 2 000 Kč (položka 120 písm. a)) | zákon 634/2004 Sb. (FD-20) | 5. 11. 2026 | shodné; zdroj banky.cz z roku 2020 |
| Ceny bytů, nájmy, sazby, předpoklady | `defaults.json` rates, cities, ownership, assumptions | bez úředního zdroje; ČSÚ 2025: 72 410 / 131 520 Kč/m² | FD-21, FD-24 | 5. 11. 2026 | každá položka má zdroj a datum, odhady „předpoklad“; nabídkové ceny RealityMIX o 15–27 % nad ČSÚ (označeno); URL neověřitelné z prostředí |
| Anuita a kalendář | `mortgage.js:14,45` | matematika | FD-22 | 5. 11. 2026 | shodné na 1e-9 (`prepocet.txt`) |
| Datum ověření | `rules.json:3` checked 2026-11-05; `defaults.json:4` updated 2026-11-05; patička „Výchozí data zkontrolována 5. 11. 2026 … pravidla ČNB k 4. 6. 2026“ | — | — | 5. 11. 2026 | shodné (`vysledek-360.png`) |

## Nezávislý přepočet
Referenční výpočet od nuly: `dukazy/skripty/bydlometr-prepocet.mjs`; porovnání s moduly: `dukazy/skripty/bydlometr-porovnani.mjs` → `dukazy/bydlometr/prepocet.txt` (2 běhy, oba 151 shod / 1 neshoda z 152). Obrazovka: `dukazy/skripty/bydlometr-prohlizec.mjs` → `dukazy/bydlometr/prohlizec.json` (3 běhy: 2× cs-CZ, 1× en-US, všechny shodné) a snímky.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: anuita | 3 500 000 Kč, 25 let, 4,94 % | 20 338,49 Kč | 20 338,49 | „20 338 Kč“ (psáno „3 500 000“ a „4,94“; totéž s „4.94“ v poli konkurence) – `prohlizec.json` B | ano |
| zadání: anuita 0 % | 1 200 000 Kč, 10 let, 0 % | 10 000 Kč | 10 000 | „10 000 Kč“ | ano |
| zadání: náhrada 3 roky | 500 000 Kč, 3 započaté roky | 3 750 Kč | 3 750 | — | ano |
| zadání: náhrada 5 let | 500 000 Kč, 5 let | 5 000 Kč (strop 1 %) | 5 000 | poplatek 1 000 000 Kč z 3 000 000 v okně, 5 let → „nejvýš 2 500 Kč“ (zdarma 750 000, zbytek 250 000 × 1 %) | ano |
| zadání: konec fixace | 500 000 Kč | 0 Kč | 0 | „Poplatek: 0 Kč – Splátka ke konci fixace je zdarma.“ | ano |
| zadání: 25 % před výročím | 250 000 z 1 000 000 | 0 Kč | 0 | 750 000 z 3 000 000, 20. 5. 2026 (smlouva 1. 6. 2025) → „Poplatek: 0 Kč“ | ano |
| zadání: odpočet | úroky 200 000 Kč, 15 % | 22 500 Kč | 22 500 | — (v UI se úspora nezobrazuje, BYD-04) | ano |
| zadání: LTV | věk 30 / 40 (+ 35 / 36 / 0, investiční) | 90 / 80 % (90 / 80 / 90 / 70) | totéž | Praha věk 32 „LTV 84 % (max. 90 %)“; věk 40 „max. 80 %“ | ano |
| zadání: Σ jistiny kalendáře | 3 500 000/4,94/300; 2 345 678/6,35/217; 1 200 000/0/120 | = úvěr (odchylka < 1e-6 Kč) | totéž | — | ano |
| hranice anuity | 1 Kč/1 měs; 100 000/1 měs/12 %; 0; −100 000; doba 0; NaN; 1 mld/40 let/20 % | 1,0042; 101 000; 0; 0; chyba; chyba; 16 672 640,92 | totéž (RangeError) | prázdné / „abc“ / „−500000“ / „2.800.000“ → „Zkontrolujte pole: Zbývající dluh.“; „0“ a doba „0,01“ → „…musí být kladné“ (`chyba-360.png`) | ano |
| započaté roky (přelom roku, přestupný rok) | 2026-01-10→2029-01-10/11; 2028-02-29→2029-02-28/03-01; 2026-12-31→2027-01-01; stejný den; zpět | 3 / 4; 1 / 2; 1; 0; 0 | totéž | — | ano |
| okno před výročím | smlouva 15. 3. 2025: splátka 14. 2. / 15. 2. / 14. 3. / 15. 3. 2026; smlouva 31. 12. 2025: 30. 11. / 1. 12. 2026; 31. 3. 2024 → 28. 2. 2025 | ne / ano / ano / ne; ano / ano; ano | totéž | — | ano |
| nová pravidla | smlouva 2019 + fixace 10/2024; 5/2024; 31. 8. 2024; 1. 9. 2024 | ano; ne; ne; ano | totéž | smlouva + fixace 2021 → „Zkontrolujte smlouvu.“ (i ke dni konce fixace, BYD-02) | ano |
| náhrada – další | 400 000 v okně (3 r.); 250 000 v okně, bezplatná využita; 4 roky; 1 rok; 0; −100 000 | 1 125; 1 875; 5 000; 1 250; 0; 0 | totéž | bezplatná využita (1 000 000, 5 let) → „nejvýš 10 000 Kč“ | ano |
| vlastní: výchozí formulář poplatku | 300 000 z 3 500 000, fixace 5. 11. 2024–5. 11. 2029, splátka 5. 11. 2026 (den výročí) | 3 roky × 0,25 % = 2 250 Kč | 2 250 | „Poplatek nejvýš 2 250 Kč“ (`poplatek-360.png`) | ano |
| vlastní: § 117 odst. 5 | 300 000 Kč měsíc před koncem fixace, sazba 2,49 % | odst. 4: 750 Kč; úrok do konce fixace 622,50 Kč → zákonný strop 622,50 Kč | 750 Kč (odst. 5 nepočítá) | — | **ne** (BYD-01) |
| vlastní: refixace výchozí | 2 800 000 / 22 let / 2,49 % → 5,79 %; 5,05 % + 9 000; úspory 300 000; +5 let; 75 000 | dosavadní 13 785,70; přijmout 18 780,19 (úroky 2 157 968,94); refinancovat 17 587,01 (1 851 970,93 vč. nákladů); mimořádná 16 768,02 (1 926 757,98); prodloužit 17 106,30 (2 742 442,16); podíly 25/23/22/23 %; stres +1/+2: 20 146/21 563, 18 899/20 262, 17 988/19 252, 18 632/20 220; nejlevněji refinancovat | totéž | totéž zaokrouhleno, „Nejlevněji vychází varianta „Refinancovat jinde“ … 1 851 971 Kč, o 305 998 Kč méně“ (`vysledek-360.png`, `vysledek-1440.png`) | ano |
| vlastní: refixace okraje | úspory 5 000 000; prodloužení 0; fixace 30 > 22 let; nabídka 0 %; příjem 0; konkurence 4 %; úspory 0 | jistina 0 a splátka 0; rozdíl 0; stres prázdný; 10 606,06; „unknown“; refinance; refinance | totéž | doba „22,5“ → 21 499 Kč; příjem „75 000,50“ → 29 % | ano |
| vlastní: nájem vs. koupě plochý případ | 50 m² × 60 000, nájem 200/m², vlastní 600 000, 0 %, 20 let, horizont 25 | úvěr 2 400 000; splátka 10 000; rok 10: 1 800 000 vs 600 000; rok 25: 3 600 000; zlom 1 | totéž | — | ano |
| vlastní: plochý + varianty | výnos 6 %; růst cen 4 %; náklady koupě 200 000; nájem 50 + ceny −5 %; sazba 5→7; odpočet; LTV věk 40/30 s 300 000; vlastní 3 500 000; vlastní 0; horizont 1 / 50 | 636 000; 3 649 958,71; zlom 2; zlom null; po fixaci 18 002,78 (zůstatek 2 002 916,72); +17 755,77; ne/ano; úvěr 0, portfolio 500 000; akontace 0, LTV 100 %; 2 řádky / 6 600 000 | totéž | věk 40 Brno: varování „LTV 80 %, ale limit je 80 %“ (BYD-05); plocha 0 → „Plocha musí být kladná“; horizont 51 → „Horizont 1–50 let“ | ano |
| vlastní: Praha výchozí | 60 m², 154 112 Kč/m², nájem 462, vlastní 1 500 000, náklady 12 000, věk 32, 5,79 %/30 let, růsty 4/3/6/2 %, 20 let | cena 9 246 720; úvěr 7 758 720 (LTV 83,9 %); splátka 45 475,13 / nájem 27 720; rok 20: koupě 16 166 072,06, nájem 14 447 620,74, rozdíl +1 718 451,31; zlom 1; citlivost 3×3 −556 635 … +13 796 328 | totéž | „9 246 720 Kč“, „7 758 720 Kč – úvěr, LTV 84 % (max. 90 %)“, „45 475 Kč / 27 720 Kč“, „koupě 16 166 072 Kč, nájem 14 447 621 Kč … o 1 718 451 Kč … v 1. roce“, střed tabulky „+1,7 mil.“ (`rentbuy-360.png`, `rentbuy-1440.png`) | ano |
| vlastní: Praha investiční; sazba po fixaci 7,79 %; Brno věk 40 | — | LTV max 70 %, rozdíl 890 775,51; −1 298 258,83; LTV 73,5 %, +1 963 693,16, zlom 1 | totéž | Brno: cena 124 954, nájem 390, daň 897 Kč (60 × 14,95) | ano |
| chybový stav: chybí `rules.json` | server bez souboru | srozumitelná hláška | — | „Nepodařilo se načíst výchozí data (Nelze načíst rules.json (404)). Otevřete stránku přes webový server…“ (`chyba-data-360.png`) | ano |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: refixace – přijmout / refinancovat / mimořádně splatit / prodloužit, nová splátka, celkové úroky, zátěž rozpočtu, zátěžový test | splněno | `mortgage.js:202–248`, `vysledek-360.png`, přepočet refixace |
| Cíl 2: nájem vs. koupě – čisté jmění za N let, investování vlastních zdrojů i rozdílu, rok zlomu | splněno | `rentbuy.js:20–134`, `rentbuy-360.png` |
| Čisté HTML + CSS + JS (ES moduly), bez buildu a serveru | splněno | `index.html:13`, `package.json` bez závislostí; `fetch` JSON vyžaduje statický server (README to říká) |
| Chart.js z CDN (cdnjs) | splněno | `index.html:12` 4.4.1 + SRI ověřen (`zdroje-a-zakony.txt`); fallback text, když se nenačte (`ui-rentbuy.js:126`) |
| Výpočty v `mortgage.js` a `rentbuy.js` bez vazby na DOM | splněno | žádné `document`/`window` v obou souborech; importovány z Node v `bydlometr-porovnani.mjs`; `ui-refix.js`/`ui-rentbuy.js` jen čtou formulář a kreslí |
| `rules.json` (limity ČNB, mimořádné splátky, odpočet) a `defaults.json` (sazba, ceny a nájmy Praha/Brno/Ostrava/ČR), každá položka se zdrojem a datem, nic natvrdo | částečně | oba soubory kompletní, test `data.test.js` hlídá zdroj a datum; v kódu jsou natvrdo jen texty „0,25 %“, „1 %“, „25 %“ (`mortgage.js:133,140,141`) a delty ±1/±2 p. b. – BYD-09 |
| Testy `node --test` | splněno | `testy.txt`: 63/63 |
| Nasazení GitHub Pages, návod v README | splněno | `README.md` „Nasazení na GitHub Pages“; živý web 200, shodný s main |
| Anuitní splátka, měsíční úročení | splněno | `mortgage.js:14–22`, přepočet |
| Mimořádná splátka od 1. 9. 2024: 25 % 1× ročně měsíc před výročím a ke konci fixace zdarma, jinak 0,25 %/rok, max. 1 %; starší smlouvy jen upozornění | splněno (zadání samo je neúplné – odst. 5, § 117a, starší smlouvy mají bezplatné případy taky) | `mortgage.js:118–147`, D_poplatek; BYD-01, BYD-02 |
| LTV 90 % do 36 let, jinak 80 %; investiční 70 % a DTI 7; DTI a DSTI jen informativně | částečně | LTV ano (`maxLtv`, varování v nájem vs. koupě); DTI se nepočítá ani neukazuje nikde, DSTI jen jako „podíl splátky na příjmu“ – BYD-04 |
| Odpočet úroků max. 150 000 Kč/rok, úspora × sazba daně | částečně | `interestDeductionSaving` existuje a je testovaný, ale UI ho nepoužívá; simulace nájem vs. koupě odpočet započítá (`rentbuy.js:103–105`), částku ale nezobrazí – BYD-04 |
| Nástroj 1 vstupy: dluh, doba, dosavadní, nabídnutá a konkurenční sazba, náklady refinancování, úspory, čistý příjem | splněno | `index.html:31–72` (+ délka fixace, prodloužení, práh) |
| Nástroj 1 výstup: tabulka variant (splátka, změna, úroky do konce, celkové náklady), věta „Nejlevněji vychází…“, zátěžový test +1/+2 p. b. po další fixaci, podíl na příjmu s barvou, práh nastavitelný, výchozí 40 %, označen orientační | splněno | `vysledek-360.png`; `burden-note` text „Nejde o limit ČNB“ |
| Nástroj 2 vstupy: město (předvyplní cenu a nájem), plocha, vlastní zdroje, věk, sazba a fixace, růst cen, růst nájmů, výnos investic, náklady vlastnictví (fond oprav, pojištění, daň, údržba %), horizont | splněno | `index.html:133–189`; Brno přepíše cenu 124 954, nájem 390, daň 897 Kč (E_rentbuy_brno) |
| Simulace po měsících, rozdíl investuje ten, kdo má nižší výdaj (oběma směry) | splněno | `rentbuy.js:107–110`; testy „nájemník investuje rozdíl“ a „po splacení kupující investuje“; můj přepočet shodný |
| Výstup: graf jmění v čase, rok zlomu, citlivost 3 × 3 (růst cen × výnos) | splněno | `rentbuy-360.png`; graf Chart.js vykreslen (canvas 294×260, fallback skrytý), tabulka 3×3 |
| Dvě záložky, formulář vlevo / výsledky vpravo, na mobilu pod sebou | splněno | `styles.css` `.tool` grid + `@media (max-width: 860px)`; snímky 360 a 1440 |
| Patička: „Orientační výpočet, nejde o finanční poradenství ani nabídku úvěru“, datum výchozích dat, zdroje | splněno | `index.html:238–243`, `vysledek-360.png` |
| Kritéria: 20 337 ± 5; 10 000; 3 750; 5 000; 0; 0; 22 500; LTV 90/80 | splněno | testy 1–2, 7–10, 24, 27–28 v `testy.txt`; přepočet „zadání“ 12/12 |
| Kalendář: Σ jistiny = úvěr ± 1 Kč | splněno | test + přepočet (3 případy) |
| Mobil 360 px bez vodorovného posuvníku | splněno | scrollWidth 360/360 ve všech stavech (úvod, výsledek, chyba, nájem vs. koupě, živý web) |
| Zadaná čísla se neukládají ani neodesílají | splněno | síť: jen vlastní původ + cdnjs; `localStorage` prázdný po všech scénářích; CSP `connect-src 'self'`, `form-action 'none'` |
| README česky: spuštění, aktualizace `defaults.json`, nasazení | splněno | `README.md` oddíly Spuštění, Aktualizace výchozích dat, Nasazení |
| Postup: porovnat splátku s kalkulačkou banky | částečně | test „reprezentativní příklad KB“ porovnává anuitu s celkovou částkou vč. poplatků (rozdíl 861 Kč, tolerance 0,1 %) – BYD-06 |

## Nálezy
### BYD-01 · Střední · Pravidla a data / Texty · Kalkulačka poplatku ukazuje jen strop 0,25 %/rok; neuplatňuje omezení podle § 117 odst. 5 (úrok do konce fixace) ani § 117a (admin. náklady max. 1 000 Kč + úrokový rozdíl)
- **Kde:** `js/mortgage.js:135–146` (`prepaymentFee`), `js/ui-refix.js:147` („Poplatek nejvýš …“), `rules.json:98–116` (`feePerStartedYear`, `feeCap`), zadání ř. 400–402
- **Reprodukce:** (a) Obrazovka, výchozí kalkulačka poplatku: 300 000 Kč z úvěru 3 500 000 Kč, fixace 5. 11. 2024–5. 11. 2029, splátka 5. 11. 2026 → „Poplatek nejvýš 2 250 Kč“ (`prohlizec.json` D_poplatek.vychozi, 3 běhy, `poplatek-360.png`). Podle § 117 odst. 5 věty druhé a § 117a odst. 1 (`zdroje-a-zakony.txt`) je u účelového úvěru na bydlení náhrada navíc omezena na administrativní náklady nejvýše 1 000 Kč + kladný úrokový rozdíl proti průměru sazeb ČNB; je-li průměr ČNB vyšší nebo roven smluvní sazbě (dnes běžné u smluv z let 2024–2025), zákonné maximum je 1 000 Kč, ne 2 250 Kč. (b) Modul: 300 000 Kč měsíc před koncem fixace při 2,49 % → aplikace 750 Kč; § 117 odst. 5 (úrok do konce fixace) dává 622,50 Kč (`prepocet.txt`, jediná neshoda ze 152). Text „Banka smí účtovat jen skutečné náklady, může být méně“ to přiznává jen obecně.
- **Dopad na uživatele:** Člověk s novou smlouvou může kvůli zdánlivému poplatku (až 1 % = desítky tisíc) odložit mimořádnou splátku na okno před výročím nebo na konec fixace a platit mezitím úroky, ačkoli zákonný strop je často 1 000 Kč.
- **Doporučená oprava:** Do kalkulačky přidat smluvní sazbu (a volitelně průměr ČNB pro srovnatelné fixace s odkazem na zveřejnění ČNB podle § 117a odst. 2) a počítat `min(strop odst. 4, úrok z předčasně splacené části do konce fixace, 1 000 Kč + max(0, úrokový rozdíl))`; minimálně v textu výsledku říct, že při sazbách ČNB ≥ smluvní sazbě je náhrada nejvýš 1 000 Kč. Zároveň jde o chybu v zadání (ř. 400–402 omezení odst. 5 a § 117a neuvádí).
- **Ověření:** reprodukováno 2× (3 běhy prohlížeče, 2 procesy porovnání) · skeptik:

### BYD-02 · Střední · Pravidla a data · Starší smlouvy (před 1. 9. 2024 bez nové fixace) nedostanou číslo ani v bezplatných případech; další bezplatné důvody § 117 odst. 3 nejsou zmíněny
- **Kde:** `js/mortgage.js:121–126` (`newRulesApply === false` → `fee: null`), `js/ui-refix.js:141–145`, zadání ř. 402 („Pro starší smlouvy jen upozornění“)
- **Reprodukce:** Kalkulačka poplatku: smlouva i fixace 1. 3. 2021, konec fixace 1. 3. 2026, splátka 1. 3. 2026 (den konce fixace) → „Zkontrolujte smlouvu. Smlouva i současná fixace jsou starší než 1. 9. 2024 – zkontroluj smlouvu, může platit jiný výpočet.“ (`prohlizec.json` D_poplatek.starsiSmlouvaKonecFixace, 3 běhy). Očekáváno 0 Kč: § 117 odst. 3 písm. c), d) a bezplatných 25 % před výročím (dnes písm. h)) existovaly už před novelou – zákon 462/2023 Sb. čl. XIV bod 6 jen vložil písm. e), f) a bod 7 jen doplnil text písm. h) (`zdroje-a-zakony.txt`). Novela změnila jen výši náhrady (odst. 4, § 117a). Písm. a), b), e), f), g) (pojištění, převod nemovitosti a SJM po 24 měsících, úmrtí, nemoc, invalidita) aplikace nikde nezmiňuje (FD-13).
- **Dopad na uživatele:** Právě lidé z refixační vlny (fixace z let 2020–2021) jsou „starší smlouva“; aplikace jim neřekne, že ke konci fixace a do 25 % před výročím splácejí zdarma, a o dalších bezplatných důvodech se nedozví nikdo.
- **Doporučená oprava:** U starších smluv vracet 0 Kč v případech konec fixace a 25 % před výročím a jen pro zbytek upozornění „zkontroluj smlouvu“; pod výsledek přidat výčet dalších bezplatných důvodů § 117 odst. 3 jako text. Zapsat jako chybu v zadání (ř. 402).
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-03 · Střední · Mobil a přístupnost · Při chybném vstupu zůstane pod hláškou starý výsledek (věta „Nejlevněji vychází…“, tabulky, zátěžový test)
- **Kde:** `js/ui-refix.js:44–49` a `js/ui-rentbuy.js:78–84` (`return` po zobrazení chyby, výsledky se nepřepisují ani neskryjí), `index.html:77–81`
- **Reprodukce:** Refixace: do pole Zbývající dluh napsat „abc“ (nebo smazat, „−500000“, „2.800.000“) → červená hláška „Zkontrolujte pole: Zbývající dluh.“, ale nad ní i pod ní zůstává „Nejlevněji vychází varianta „Refinancovat jinde“ … 1 851 971 Kč“, tabulka variant i zátěžový test z předchozího vstupu (`chyba-360.png`, `prohlizec.json` C_refix_chyby.*.summaryZustal, 3 běhy). Totéž v nájem vs. koupě (plocha 0, horizont 51). Při „0“ je hláška, ale pole nemá `aria-invalid="true"`.
- **Dopad na uživatele:** Čtenář (zvlášť na mobilu, kde je hláška mezi dlouhými bloky) může číst částky, které k jeho zadání nepatří; čtečka obrazovky dostane jen hlášku, ne informaci, že čísla neplatí.
- **Doporučená oprava:** Při chybě výsledkové panely skrýt nebo označit (`aria-busy`/třída „neplatné“ s vysvětlením), případně vymazat souhrn a tabulky; u kontroly „kladné hodnoty“ nastavit `aria-invalid` na příslušná pole; chybové hlášce dát `role="alert"`.
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-04 · Střední · Shoda se zadáním · DTI se nepočítá ani neukazuje (vlastní bydlení informativně, investiční doporučení 7) a úspora na dani z odpočtu úroků se uživateli nikde nezobrazí
- **Kde:** `rules.json:43–60` (`dti.*` – v `js/` nikde nepoužito, grep), `js/mortgage.js:165` (`interestDeductionSaving` – voláno jen z testů), `js/rentbuy.js:103–105,113` (`taxSaving` se počítá, `ui-rentbuy.js` ho nevypisuje), zadání ř. 404–407
- **Reprodukce:** Zadání „DTI a DSTI pro vlastní bydlení nejsou závazné – ukazuj je jen informativně“ a „investiční nemovitost doporučeně 70 % a DTI 7“. Refixace s příjmem 75 000 Kč a dluhem 2 800 000 Kč: DTI = 3,1násobek ročního příjmu se nikde neobjeví (`vysledek-360.png`); nájem vs. koupě se zaškrtnutou investiční nemovitostí ukáže jen LTV 70 %, o DTI 7 ani slovo (příjem se tam nezadává). Úspora na dani (příklad zadání 22 500 Kč) není v UI vůbec; v simulaci je započtená skrytě. Ověřeno 3 běhy prohlížeče a grepem kódu.
- **Dopad na uživatele:** Chybí informace, kterou zadání výslovně požaduje; u investiční hypotéky uživatel nezjistí, že by ho doporučení DTI 7 mohlo omezit víc než LTV. Čísla výsledků to nemění.
- **Doporučená oprava:** V refixaci zobrazit řádek „DTI (dluh / roční čistý příjem): 3,1 – ČNB nemá závazný limit“; v nájem vs. koupě vypsat roční úsporu na dani z `taxSaving` (a použít k tomu `interestDeductionSaving`) a při investiční nemovitosti připomenout doporučení DTI 7 (s volitelným polem příjmu).
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-05 · Střední · Výpočty / Texty · Nájem vs. koupě počítá celý výsledek i s úvěrem nad limit LTV a hláška po zaokrouhlení tvrdí „LTV 80 %, ale limit je 80 %“
- **Kde:** `js/rentbuy.js:26–33` (varování, simulace pokračuje s plným úvěrem), `js/ui-rentbuy.js:93–94`
- **Reprodukce:** Nájem vs. koupě, Brno, 60 m², vlastní zdroje 1 500 000 Kč, věk 40 → varování „Úvěr by měl LTV 80 %, ale limit je 80 %. Na koupi chybí 11 448 Kč vlastních zdrojů – banka by takový úvěr neposkytla.“ (skutečné LTV 80,15 %), a přesto souhrn „Za 20 let: koupě 13 456 570 Kč … vychází lépe koupě o 1 971 930 Kč“ (`prohlizec.json` E_rentbuy_vek40, 3 běhy). Při vlastních zdrojích 0 Kč jde simulace s LTV 100 %.
- **Dopad na uživatele:** Výsledek se opírá o úvěr, který uživatel nedostane; varování je nad výsledkem, ale graf, tabulka i citlivost vypadají jako platné. Zaokrouhlená hláška mate.
- **Doporučená oprava:** Při překročení limitu buď výsledek označit jako hypotetický (a graf/tabulku ztlumit), nebo přepočítat s úvěrem omezeným na limit a vypsat potřebné vlastní zdroje; v hlášce zobrazit LTV na 1 desetinné místo.
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-06 · Střední · Testy · Chybí testy pro `format.js`/`form.js` (propojení formuláře) a dva „bankovní“ testy ověřují jen díky toleranci
- **Kde:** `test/` (žádný test `parseNumber`, `formatCZK`, `readNumbers`, `sourceList`), `test/mortgage.test.js:35–43` (Hypoindex 6/2026 → 21 082 ± 5; KB → 5 899 641 ± 0,1 %)
- **Reprodukce:** `node --test` 63/63 (`testy.txt`). Anuita 3 500 000 Kč / 5,30 % / 300 je 21 077,04 Kč – test očekává 21 082 Kč a prochází o 0,04 Kč (hodnota z článku zřejmě odpovídá jiné sazbě; 5,31 % → 21 097,75). Test KB porovnává čistou anuitu × 360 (5 898 780,41 Kč) s „celkem splaceno vč. poplatků“ 5 899 641,31 Kč – rozdíl 861 Kč schová tolerance 5 900 Kč, test tedy nic přesného neověřuje. Parsování „1 500“, „1500,50“, „2.800.000“ a `data-scale` nemá žádný test, přestože na něm stojí shoda obrazovky s modulem. Chybí test starší smlouvy v den konce fixace (BYD-02) a stropu podle § 117 odst. 5 (BYD-01).
- **Dopad na uživatele:** Nepřímý – regrese v parsování čísel nebo ve formuláři by testy nezachytily; „bankovní“ testy dávají falešnou jistotu.
- **Doporučená oprava:** Přidat `test/format.test.js` (české zápisy, NaN, záporné, `%`, `Kč`) a test `readNumbers` v jsdom-free podobě (čistá funkce nad hodnotami); test Hypoindex opravit na skutečnou anuitu 21 077 Kč ± 1 nebo doložit sazbu; test KB nahradit porovnáním měsíční splátky z reprezentativního příkladu banky.
- **Ověření:** reprodukováno 2× (přepočet, výstup testů) · skeptik:

### BYD-07 · Střední · Pravidla a data · Zdroje zákonných pravidel odkazují na neúřední weby a dvě citace jsou nepřesné
- **Kde:** `rules.json:68,77,86,95,104,125,134,143,152` (URL kb.cz, banky.cz, hyponamiru.cz, stavebky.cz), `defaults.json:181,212,243,274` (mesec.cz), `rules.json:124` („§ 15 odst. 3“), `rules.json:129` („smlouvy do 31. 12. 2020“); patička `#sources`
- **Reprodukce:** Patička „Zdroje výchozích dat a pravidel“ vede u předčasného splacení, odpočtu úroků, sazby daně a daně z nemovitosti na komerční weby; zákon je jen jmenován v textu. Limit 150 000 Kč je v § 15 odst. 4 ZDP (odst. 3 upravuje odpočet) – FD-14; limit 300 000 Kč se váže na bytovou potřebu obstaranou před 1. 1. 2021, ne na datum smlouvy – FD-15 (zákon 386/2020 Sb. čl. IV). 15 z 22 URL nebylo z prostředí dosažitelných (`zdroje-a-zakony.txt`), takže nelze potvrdit, že stránky tvrdí to, co aplikace; 5 odkazů na ČNB a cdnjs fungují a obsah ČNB souhlasí.
- **Dopad na uživatele:** Kdo si chce pravidlo ověřit, skončí na komerčním webu; čísla to nemění.
- **Doporučená oprava:** U zákonných pravidel uvádět URL na zakonyprolidi.cz/e-sbírku (257/2016 Sb. § 117, 586/1992 Sb. § 15 a § 16, 338/1992 Sb., 634/2004 Sb. položka 120) a ČNB; opravit citaci na § 15 odst. 4 a formulaci „bytová potřeba obstaraná před 1. 1. 2021“.
- **Ověření:** reprodukováno 2× (2 curl běhy, obsah souborů) · skeptik:

### BYD-08 · Nízká · Texty · Nejednotné oslovení a drobné textové nepřesnosti
- **Kde:** `js/mortgage.js:124` („zkontroluj smlouvu“ – tykání, jinde vykání „Zkontrolujte“), `js/mortgage.js:233` („Prodloužit splatnost o 0 let“ při prodloužení 0), `js/ui-refix.js:45` (hláška „Zbývající dluh a doba musí být kladné“ bez `aria-invalid`)
- **Reprodukce:** D_poplatek.starsiSmlouva: „Zkontrolujte smlouvu. Smlouva i současná fixace … – zkontroluj smlouvu…“; prodloužení 0 → varianta se jmenuje „Prodloužit splatnost o 0 let“ a je totožná s přijetím nabídky (`prepocet.txt`).
- **Dopad na uživatele:** Kosmetika.
- **Doporučená oprava:** Sjednotit na vykání; při prodloužení 0 variantu skrýt nebo přejmenovat.
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-09 · Nízká · Pravidla a data · Nepoužité položky JSON v patičce a texty s čísly natvrdo
- **Kde:** `defaults.json:16–40` (`rates.fix1y`, `fix10y`, `newLoans` – v UI nepoužité, ale v seznamu zdrojů), `rules.json:128,43–60` (`limitPre2021`, `dti.*` nepoužité), `js/mortgage.js:133,140,141` („25 %“, „0,25 %“, „1 %“ v textech odůvodnění)
- **Reprodukce:** grep `fix1y|fix10y|newLoans|limitPre2021|dti` v `js/` → 0 výskytů mimo text; změna `feePerStartedYear` v `rules.json` by změnila výpočet, ale text „× 0,25 %“ ne.
- **Dopad na uživatele:** Žádný dnes; riziko nesouladu textu a výpočtu při příští aktualizaci pravidel.
- **Doporučená oprava:** Texty skládat z hodnot `rules.json` (`formatPct`), nepoužité položky buď použít (např. ukázat sazby podle fixace), nebo odstranit.
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-10 · Nízká · Nasazení a větve · Chybí favicon, v konzoli je 404
- **Kde:** `index.html` (žádný `<link rel="icon">`), živý web `https://frankie851.github.io/favicon.ico` 404
- **Reprodukce:** `uvod-kontrola.json`, `prohlizec.json`, `zivy-kontrola.json`: jediná konzolová chyba „Failed to load resource: 404“ pro favicon.ico (lokálně i živě, všechny běhy).
- **Dopad na uživatele:** Žádný; jen šum v konzoli.
- **Doporučená oprava:** Přidat `<link rel="icon" href="data:,">` nebo malý SVG favicon (CSP `img-src 'self' data:` to dovoluje).
- **Ověření:** reprodukováno 2× · skeptik:

### BYD-11 · Nízká · Výpočty · Záporný růst nájmů nebo výnos investic je odmítnut, záporný růst cen povolen; neúčelové úvěry na bydlení mimo rozsah
- **Kde:** `js/ui-rentbuy.js:52–57` (jen `priceGrowth` smí být záporný), `js/form.js:46` (`v < 0` = neplatné)
- **Reprodukce:** Růst nájmů „−1“ → „Zkontrolujte pole: Růst nájmů.“, růst cen „−2“ projde (`prohlizec.json` E_rentbuy_rustNajmuZaporny / rustCenZaporny). Pro úvěry na bydlení bez účelu (§ 2 odst. 2 písm. a) nikoli b)) platí podle § 117 odst. 4 strop 1 % / 0,5 %, aplikace to neřeší ani neříká.
- **Dopad na uživatele:** Nelze namodelovat pokles nájmů nebo záporný výnos; u „americké hypotéky“ by strop vyšel jinak (okrajový případ).
- **Doporučená oprava:** Povolit záporné hodnoty u všech růstů/výnosu; u kalkulačky poplatku poznámku, že platí pro účelový úvěr na bydlení.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
Žádné (`git branch -a`: jen `main`, `origin/main`). GitHub workflow v repozitáři není (README: Pages z větve, bez Actions).

## Co se nepodařilo ověřit a předpoklady
- 15 z 22 URL v `rules.json`/`defaults.json` (kb.cz, banky.cz, hyponamiru.cz, stavebky.cz, mesec.cz, hypoindex.cz, realitymix.cz, tvbydleni.cz, housi.cz, rulecalc.com, kurzy.cz) není z prostředí dosažitelných (proxy nenaváže spojení) – nelze potvrdit, že stránky obsahují citované hodnoty; úřední hodnoty jsou ověřené přes rejstřík a zakonyprolidi.cz/cnb.cz.
- Historické znění § 117 před 1. 9. 2024 na zakonyprolidi.cz vyžaduje JavaScript/předplatné; závěr pro BYD-02 je odvozen z textu novely 462/2023 Sb. (co měnila a co ne) a konsolidovaného znění.
- Průměry zápůjčních sazeb ČNB podle § 117a odst. 2 jsem nestahoval; tvrzení v BYD-01, že u smluv z let 2024–2025 bývá úrokový rozdíl záporný, vychází jen z porovnání výchozí sazby 5,79 % (Hypoindex 10/2026) s nižšími sazbami předchozích let.
- Místní koeficienty daně z nemovitosti (Praha 2, Brno a Ostrava 1) a inflační koeficient 2026 – podle rejstříku neověřeno proti vyhláškám obcí a sdělení MF; aplikace je označuje jako odhad.
- Tržní výchozí hodnoty (Hypoindex, Hypomonitor, RealityMIX, Housi, Deloitte) nemají úřední zdroj; kontrolováno jen, že mají zdroj, URL a datum.
- Desetinná čárka: aplikace nemá žádné `<input type="number">` (všechna pole `type="text"` + `inputmode`), takže rozdíl cs-CZ/en-US se neprojevil (3. běh v en-US byl shodný s cs-CZ); `type="date"` pole kalkulačky poplatku byla plněna programově.
- Předpoklad: v referenčním výpočtu nájem vs. koupě jsem použil stejné konvence pořadí (nejdřív zhodnocení portfolia, pak toky měsíce; nájem roste 1× ročně, cena a výnos měsíčně), jak je popisuje text „Jak se počítá“ – jiná konvence by dala mírně jiná čísla, ne jiné závěry.
- Tmavý režim a skutečné mobilní zařízení netestovány (jen Chromium 360×800 a 1440×900).
