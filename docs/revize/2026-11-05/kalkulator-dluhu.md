# Revize: Dluhy – exekuce, nebo oddlužení? (`frankie851/kalkulator-dluhu`)
Revidovaný commit: `abb6c1c48d1d0703aa02058e012d6f57156b6e9f` (5. 11. 2026) · živý web: https://frankie851.github.io/kalkulator-dluhu/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Připraveno
Všech 17 parametrů v `rules.json` pro rok 2026 odpovídá rejstříku (DS-01 až DS-29) i mému druhému čtení předpisů na zakonyprolidi.cz; můj referenční výpočet psaný od nuly se s modulem `dluhy.js` shoduje ve všech 53 porovnáních (5 příkladů ze zadání, 14 hraničních případů srážky, 10 případů doby splácení, 11 případů oddlužení) a úřední kalkulačka exekuce.justice.cz (varianta „2026 výpočet od 1. 1.“, volaná přímo na serveru) dala u 13 případů včetně důchodce, 4 exekucí, náhrady plátce a koruny nad hranicí přesně totéž co aplikace; tři případy zadané do formuláře ukázaly na obrazovce totéž co modul (3 nezávislé běhy). Nejvážnější jsou střední nálezy: výchozí sazba úroku z prodlení 11,75 % se nabízí bez upozornění, že zákonná sazba se řídí pololetím vzniku prodlení (u dluhů z let 2022–2025 je 11,75–15 %), citace životního minima vede na zrušené nařízení 436/2022 Sb., úřední kalkulačky, na které aplikace odkazuje, dnes ukazují jiná čísla (varianta „od 1. 10. 2026“ se ŽM 5 500 Kč; insolvenční kalkulátor s hranicí 1 × místo 1,9 ×) a aplikace o tom mlčí, zápis „23.000“ se čte jako 23 Kč a po odeslání formuláře se ztrácí fokus. Dobře je oddělení čistého výpočtu od obrazovky, přesné zaokrouhlování (úhrn nahoru, třetiny dolů), správná výjimka pro důchodce i náhrada plátce mzdy, 0 porušení axe ve všech stavech, žádné přetékání na 360 px, odkaz na bezplatnou pomoc ve výřezu každé obrazovky, žádné cizí požadavky, úložiště ani `innerHTML`, přísná CSP a čtivé texty (průměr 5,4 slova na větu).
Nálezy: Kritická 0 · Vysoká 0 · Střední 6 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟡 | DLU-02 |
| 2 Výpočty | 🟡 | DLU-04 |
| 3 Shoda se zadáním | 🟢 | — |
| 4 Testy | 🟡 | DLU-06 |
| 5 Mobil a přístupnost | 🟡 | DLU-05 |
| 6 Texty a citlivá témata | 🟡 | DLU-01, DLU-03 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | DLU-10 (Nízká) |

## Pravidla
Všechny hodnoty z `rules.json` (`overeno` 2026-11-05) a konstanty v `index.html`/`app.js` (grep čísel: v `dluhy.js` jsou jen čísla paragrafů, `maxMesicu` 600 a převody; v `app.js` limity formuláře 15 osob a 100 % a text „11,75“). Porovnáno s rejstříkem `pravidla.md` (oblast C) a 5. 11. 2026 znovu přečteno na zakonyprolidi.cz, exekuce.justice.cz, insolvence.justice.cz a cnb.cz – výňatky a HTTP stavy všech odkazů aplikace v `dukazy/kalkulator-dluhu/zdroje.txt`.

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Nezabavitelná částka = 85 % součtu ŽM + normativní nájemné + energetický paušál | `rules.json` `procentoDluznik` 85; `dluhy.js:48–53` | 85 % | DS-01 – NV 595/2006 Sb. § 1 odst. 1 ve znění NV 548/2025 Sb., https://www.zakonyprolidi.cz/cs/2006-595 | 5. 11. 2026 | shodné |
| ¼ na každou vyživovanou osobu; manžel jen při důchodu; ne ten, kdo vymáhá výživné | `rules.json` `jmenovatelNaOsobu` 4; nápověda `index.html:50` | ¼ nezabavitelné částky | DS-02 – NV 595/2006 § 1 odst. 1 a 2 | 5. 11. 2026 | shodné |
| Hranice plně zabavitelného zbytku 1,9× součtu | `rules.json` `nasobekHraniceDesetiny` 19; `dluhy.js:56–58` | 1,9násobek (31 521 Kč) | DS-03 – NV 595/2006 § 2 | 5. 11. 2026 | shodné |
| Zaokrouhlení úhrnu nezabavitelné částky nahoru | `rules.json` `zaokrouhleni`; `dluhy.js:52` (`Math.ceil` celého úhrnu) | na celé Kč nahoru (3 osoby → 24 678 Kč) | DS-04 – NV 595/2006 § 3; úřední příklad exekuce.justice.cz | 5. 11. 2026 | shodné |
| Hodnoty k 1. lednu roku výplaty | `rules.json` 2027 (ŽM 5 500 „pro srážky od ledna 2027“); `app.js:177` výběr roku | § 4: „ve výši k 1. lednu kalendářního roku, do kterého spadá výplata mzdy“ | DS-05 – NV 595/2006 § 4 (NV 548/2025 čl. I bod 3) | 5. 11. 2026 | shodné (úřední kalkulačka má přesto variantu „od 1. 10.“ – DLU-03) |
| Životní minimum jednotlivce 4 860 Kč | `rules.json:7–13` (zdroj „NV 436/2022 Sb., § 1“, účinnost 2023-01-01); `index.html:242` | 4 860 Kč k 1. 1. 2026 podle NV 361/2025 Sb. § 1 (účinnost 1. 10. 2025, zrušeno k 1. 10. 2026); NV 436/2022 zrušeno k 1. 10. 2025 | DS-06 – https://www.zakonyprolidi.cz/cs/2025-361 ; https://www.zakonyprolidi.cz/cs/2022-436 | 5. 11. 2026 | hodnota shodná, citace a odkaz chybné – DLU-02 |
| Životní minimum 5 500 Kč od 1. 10. 2026 (rok 2027) | `rules.json:130` | 5 500 Kč (zákon 110/2006 § 2, znění od 1. 10. 2026, verze 29) | DS-07 – https://www.zakonyprolidi.cz/cs/2006-110 | 5. 11. 2026 | shodné |
| Normativní nájemné 9 430 Kč (jednočlenná, obec ≥ 70 000) | `rules.json` `normativniNajemne` | 9 430 Kč (sdělení 526/2025 Sb. písm. a)); exekuce.justice.cz totéž | DS-08 | 5. 11. 2026 (převzato z rejstříku + text úřední kalkulačky) | shodné |
| Normativní nájemné 2027 nevyhlášeno → rok 2027 „neúplné“ | `rules.json:127–135`; `dluhy.js:13–25` | sdělení pro 2027 neexistuje; sdělení 169/2026 Sb. jen do 31. 12. 2026 | DS-09 | 5. 11. 2026 | shodné; `pravidlaProRok(2027)` správně odmítne (prepocet.txt) |
| Energetický paušál 2 300 Kč | `rules.json` `energetickyPausal` | 2 300 Kč (zákon 151/2025 § 32 odst. 2 písm. a)) | DS-10 | 5. 11. 2026 | shodné |
| Výsledné částky 2026: 14 102 / 17 627 / 21 153 / 24 678 Kč; hranice 31 521 Kč | `test/dluhy.test.js:53–64` | shodné (vlastní přepočet, úřední kalkulačka) | DS-11 | 5. 11. 2026 | shodné |
| Zbytek dolů na dělitelný třemi; 1/3 běžné, 2/3 přednostní | `dluhy.js:7–10, 77–79, 91` | OSŘ § 279 odst. 1 | DS-12 – https://www.zakonyprolidi.cz/cs/1963-99 | 5. 11. 2026 | shodné |
| Přednostní pohledávky – příklady | `index.html:62` | výčet § 279 odst. 2 písm. a)–k) | DS-13 | 5. 11. 2026 | shodné (jen příklady) |
| Část nad hranicí se srazí celá; počítá se z nezaokrouhleného zbytku | `dluhy.js:78` (`Math.floor(zbytek − hranice)`) | OSŘ § 279 odst. 3; úřední kalkulačka: 50 001 Kč → 14 885 Kč, 45 624 Kč → 10 508 Kč (POST 5. 11. 2026) | DS-14; `uredni-kalkulacky.txt` A | 5. 11. 2026 | shodné s úřední praxí (doslovné čtení „zbytek vypočtený podle odst. 1 věty první“ by dalo o 1–2 Kč méně; viz Neověřeno) |
| ≥ 4 exekuce → vždy 2/3 | `rules.json` `minimumExekuciProDveTretiny` 4; `dluhy.js:86–89`; `index.html:67` | OSŘ § 279 odst. 4 | DS-15 | 5. 11. 2026 | shodné |
| Výjimka pro důchodce: 1/3 < 1 089 Kč | `dluhy.js:87` (`tretina < spravceMesicne`) | § 279 odst. 5: „nedosahuje-li jedna třetina … součtu … zvýšených o DPH“ | DS-16 | 5. 11. 2026 | shodné (rovnost 1 089 = 2/3, ověřeno i úřední kalkulačkou 16 502 → 800 Kč) |
| Paušální náhrada plátci 50 Kč, max ⅓ srážky nahoru, odečte se věřitelům | `rules.json` `nahradaZamestnavateli`; `dluhy.js:94` | vyhl. 485/2000 § 4d (50 Kč), § 4e (⅓ nahoru); OSŘ § 270 odst. 2, § 279 odst. 1 | DS-17 – https://www.zakonyprolidi.cz/cs/2000-485 | 5. 11. 2026 | shodné (úřední kalkulačka 14 402 Kč → 100/34/66) |
| Oddlužení 36 měsíců; opakované do 20 let 60 měsíců | `rules.json` `delkaOddluzeniMesicu` 36, `delkaOpakovanehoOddluzeniMesicu` 60 | IZ § 412a odst. 1 písm. b) „3 let“, odst. 3 „5 let“ | DS-18, DS-19 – https://www.zakonyprolidi.cz/cs/2006-182 | 5. 11. 2026 | shodné |
| Zamítnutí při osvobození v posledních 12 letech | `rules.json` `zakazOpakovaniLet` 12; `app.js:148` | IZ § 395 odst. 3 (výjimka odst. 6) | DS-20 | 5. 11. 2026 | shodné |
| Minimální splátka = správce + stejná částka věřitelům = 2 × 1 089 = 2 178 Kč | `rules.json` `minimumSplatkyNasobekSpravce` 2; `dluhy.js:165` | IZ § 395 odst. 1 písm. b); insolvence.justice.cz „zpravidla 1089 Kč“ | DS-21 | 5. 11. 2026 | shodné |
| Splátka v oddlužení = rozsah pro přednostní pohledávky | `dluhy.js:161` | IZ § 398 odst. 3 | DS-22 | 5. 11. 2026 | shodné (jiná výše podle § 398 odst. 5 nezmíněna – přijatelné) |
| Odměna správce 750 Kč + výdaje 150 Kč měsíčně, DPH 21 % → 1 089 Kč | `rules.json` `odmenaSpravceMesicne`, `vydajeSpravceMesicne`, `dphProcenta`; `dluhy.js:61–63` | vyhl. 313/2007 § 3 odst. 2 písm. a), § 7 odst. 4; zákon 235/2004 § 47 | DS-23, DS-24, DS-25 – https://www.zakonyprolidi.cz/cs/2007-313 | 5. 11. 2026 | shodné (jen jednotlivec; manželé 1 633,50 Kč aplikace neřeší) |
| Sepis návrhu nejvýše 4 000 Kč bez DPH; akreditované osoby zdarma | `index.html:228`, `:218` | 4 000 Kč, u manželů 6 000 Kč (§ 390a odst. 3); akreditovaná osoba bez odměny (odst. 4) | DS-26, DS-31, DS-37 | 5. 11. 2026 | neúplné (6 000 Kč) – DLU-09 |
| Co se neodpouští | `index.html:146–152` | IZ § 416 odst. 1; § 414 | DS-27 | 5. 11. 2026 | shodné |
| „Během oddlužení se exekuce zastaví. Úroky přestanou růst.“ | `index.html:155` | IZ § 109 odst. 1 písm. c) (exekuci nelze provést od zahájení řízení); § 170 písm. a) (úroky přirostlé po rozhodnutí o úpadku se neuspokojují) | ověřeno mnou v textu IZ (`zdroje.txt`; v rejstříku R-08 neověřeno) | 5. 11. 2026 | shodné (zjednodušení přijatelné) |
| Úrok z prodlení = repo k 1. dni pololetí vzniku prodlení + 8 b. | `rules.json` `urokZProdleniProcenta` 11,75 (popis: 1. pololetí 11,50); `index.html:91, 94` „11,75“ | NV 351/2013 § 2 odst. 1; repo 3,50 % (9. 5. 2025) → 11,50 %; 3,75 % (19. 6. 2026) → 11,75 % | DS-28, DS-29 – https://www.zakonyprolidi.cz/cs/2013-351 ; cnb.cz vyvoj_repo_historie.txt | 5. 11. 2026 | hodnoty shodné; výchozí sazba se nabízí bez vazby na vznik prodlení – DLU-01 |
| Odkazy pomoci: ceecr.cz, isir, registr MPSV (§ 72 zák. 108/2006 zdarma), sako, exekuce.justice.cz, insolvence.justice.cz, ochrance.cz, vesta | `index.html:168–229` | všechny HTTP 200; obsah odpovídá (kalkulátor splátek má /kalkulator-splatek/; leták ochránce jen „Exekuce“) | DS-30 až DS-37; `zdroje.txt` | 5. 11. 2026 | funkční; drobnosti – DLU-09 |
| Odkazy do e-Sbírky (11 adres) | `rules.json`, `index.html:236–247` | v prohlížeči se načtou; /sb/2022/436 zobrazí „minulé znění, zrušeno“, /sb/2025/361 „zrušeno 1. 10. 2026“, /sb/2006/595 „aktuální znění 1. 1. 2026“ | DS-38; `prohlizec.json` → `esbirka` | 5. 11. 2026 (puppeteer) | funkční; obsah u ŽM viz DLU-02 |
| Datum ověření pravidel 5. 11. 2026 v patičce = `rules.json` | `index.html:233`, `rules.json:2`, test `obsah.test.js` | – | – | 5. 11. 2026 | shodné |

## Nezávislý přepočet
Skripty: `dukazy/skripty/kalkulator-dluhu-prepocet.mjs` (vlastní výpočet od nuly: nezabavitelná částka, třetiny, hranice, důchodce, náhrada plátce, doba splácení simulací i uzavřeným vzorcem, oddlužení, úrok z prodlení podle data – bez kódu aplikace), `kalkulator-dluhu-porovnani.mjs` (import `dluhy.js`; 2 běhy shodné), `kalkulator-dluhu-uredni.mjs` (úřední kalkulačky: exekuce.justice.cz přes POST, insolvence.justice.cz přepisem jejich `kalkul.js` a živě), `kalkulator-dluhu-prohlizec.mjs` (formulář, 3 běhy: 2× cs-CZ, 1× en-US) a `kalkulator-dluhu-fokus.mjs`. Výstupy: `dukazy/kalkulator-dluhu/prepocet.txt` (53 porovnání, 0 neshod), `uredni-kalkulacky.txt`, `prohlizec.json`, `fokus-a-okraje.json`, snímky `formular-360.png`, `chyba-360.png`, `vysledek-360.png`, `vysledek-1440.png`, `kroky-360.png`, výřezy `vyrez-*-360.png`, živý web `zivy-*.png`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 (zadání) | 23 000 Kč, 0 osob, běžný, 1 exekuce, dluh 100 000 Kč | srážka 2 966 Kč, zůstane 20 034 Kč, věřitelům 2 916 Kč (náhrada 50 Kč), 35 měsíců; oddlužení 5 932 Kč, věřitelům 4 843 Kč, 21 měsíců, nic se neodpouští | shodné | 20 034 / 2 966 / 2 916 Kč, „2 roky a 11 měsíců“, oddlužení 5 932 Kč, „1 rok a 9 měsíců“, „Nic by se neodpouštělo.“ (3 běhy, 360 i 1440 px); úřední kalkulačka 2 966 / 2 916 / 50 / 20 034 Kč | ano |
| Z2 (zadání) | 50 000 Kč, přednostní, dluh 1 000 000 Kč, úrok 11,75 % | srážka 25 391 Kč (2 × 10 507 + 4 377), věřitelům 25 341 Kč, 51 měsíců (vzorec 51), úroky 270 194 Kč; oddlužení 25 391 Kč, 36 m, zaplaceno 874 872 Kč (87 %), odpuštěno 125 128 Kč | shodné | 24 609 / 25 391 / 25 341 Kč, „4 roky a 3 měsíce“, „Na úrocích zaplatíte asi 270 194 Kč“, oddlužení 25 391 Kč, 3 roky, 874 872 Kč, 125 128 Kč (3 běhy); úřední 25 391 Kč | ano |
| Z3 (zadání) | 50 000 Kč, běžný | 10 507 + 4 377 = 14 884 Kč | 14 884 Kč | — (úřední kalkulačka 14 884 Kč) | ano |
| Z4 (zadání) | 2 vyživované osoby | 14 101,50 × 1,5 = 21 152,25 → 21 153 Kč | 21 153 Kč | rozpis „Musí vám zůstat aspoň 21 153 Kč“ (formáty, osoby 2) | ano |
| Z5 (zadání) | 12 000 Kč < nezabavitelná částka | srážka 0, náhrada 0, věřitelům 0 | shodné | „1 500“ → „Vaše výplata je nižší … nestrhává nic“ (úřední 12 000 → 0) | ano |
| H1 NČ 0/1/3 osob | – | 14 102 / 17 627 / 24 678 Kč | shodné | — | ano |
| H2–H3 hranice nezabavitelné | 14 102 / 14 103 / 14 105 Kč | 0 / 0 / 1 Kč (náhrada 1 Kč, věřitelům 0) | shodné | 14 105 → „Strhne se 1 Kč“, věřitelé 0 Kč, „Splácení by trvalo déle než 50 let.“ (DLU-07); úřední 1 / 0 / 1 Kč | ano |
| H4–H6 hranice 1,9× | 45 623 / 45 624 / 50 001 / 50 002 Kč | 10 507 / 10 508 / 14 885 / 14 886 Kč (doslovná varianta 10 507 / 10 507 / 14 884 / 14 884) | 10 507 / 10 508 / 14 885 / 14 886 | — (úřední 10 508 a 14 885 = modul) | ano |
| H7 3 vs 4 exekuce | 23 000 Kč | 2 966 / 5 932 Kč | shodné | — (úřední 5 932) | ano |
| H8 důchodce, 4 exekuce | 16 502 / 17 369 / 23 000 Kč | 800 (⅓ < 1 089) / 2 178 (⅓ = 1 089 → 2/3) / 5 932 Kč | shodné | 16 502 → 15 702 / 800 / 750 Kč, „5 let a 7 měsíců“, oddlužení 1 600 Kč + varování o minimu 2 178 Kč (3 běhy); úřední 800 Kč | ano |
| H9 přednostní + 4 ex. + důchodce | 16 502 Kč | 1 600 Kč | 1 600 Kč | — | ano |
| H10–H14 | 23 000 Kč + 2 osoby; 14 402 Kč; 23 000,70 Kč; 15 osob; 1 000 000 Kč | 615 Kč (náhrada 50); 100 Kč (náhrada 34, věřitelům 66); 2 966; 8 678; 975 391 Kč | shodné | — (úřední 615, 100/34/66, 975 391) | ano |
| V1 nesmyslné vstupy modulu | 0, −5 000, NaN, „23 000“ (text), osoby −2, 2,5 | 0 / 0 / 0 / 0 Kč; osoby −2 → 0; 2,5 → 2 | shodné (text → 0; formulář parsuje sám) | formulář: −5000, „nevím“, osoby 16, exekuce −1, sazba 150/abc → hlášky, fokus na první pole | ano |
| D1–D7 doba splácení | 100 000 / 2 916 Kč bez úroku; 11,75 %; 15 %; 500 000 Kč; splátka = úrok; dluh 0; 10 mil.; 1 mil./25 341 | 35; 42 (úroky 22 445); 46 (31 403); nesplatitelné (úrok 4 895,83); nesplatitelné; 0; „příliš dlouho“ (> 600 m); 51 | shodné | Z1/Z2 viz výše; „sazba 11,75“ i „11.75“ → „3 roky a 6 měsíců“, úroky 22 445 Kč | ano |
| O1–O7 oddlužení | 30 000/400 000; 23 000/100 000; 17 369 a 17 368; 12–20 let; do 12 let; 50 000/100 000; 12 000; dluh 0; 20 000/2 000 000 | 10 598 (věřitelům 9 509, 36 m, 342 324 Kč, odpuštěno 57 676); 5 932/21 m; 2 178 splní / 2 176 nesplní; 60 m; nelze povolit; 5 m; 0 Kč nesplní minimum; 36 m; 5,1 % a přesto 36 m | shodné | H8: „Splátka musí být aspoň 2 178 Kč“; Z1: 21 m | ano |
| U1 úrok z prodlení podle data | 1. 1. 2026 / 1. 7. 2026 / 1. 3. 2023 / 1. 9. 2024 / 15. 2. 2025 / 1. 3. 2022 | 11,50 / 11,75 / 15,00 / 12,75 / 12,00 / 11,75 % | 11,50 / 11,75 % (jen 2026); jinak výchozí 11,75 % | nápověda „Zákonná sazba pro druhou polovinu roku 2026 je 11,75 %“ | 2026 ano; starší prodlení – DLU-01 |
| Úřední kalkulačka exekuce „2026 od 1. 10.“ (výchozí volba) | 23 000 / 50 000 přednostní / 50 000 běžný / 4 exekuce | se ŽM 5 500: 2 784 / 24 441 / 13 529 / 5 568 Kč | aplikace (NV § 4): 2 966 / 25 391 / 14 884 / 5 932 Kč | úřední: 2 784 / 24 441 / 13 529 / 2 784 Kč (náhrada 0, bez 4+ pravidla) | rozdíl −182 až −3 148 Kč – DLU-03 |
| Úřední kalkulátor splátek insolvence.justice.cz 2026 | 30 000 / 23 000 / 17 369 / 23 000 + 2 os. / 35 000 / 50 000 Kč | 10 598 / 5 932 / 2 178 / 1 230 / 13 932 / 25 391 Kč | shodné s mým | úřední `kalkul.js`: 10 598 / 5 932 / 2 178 / 1 230 / **15 368** / **30 368** Kč (hranice 1 × 16 590 Kč) | do 30 692 Kč ano; výš se úřední skript rozchází s NV § 2 – DLU-03 |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: kolik při exekuci zůstane a kolik se strhne | splněno | `dluhy.js:70–111`; `vysledek-360.png`; přepočet Z1–Z3 |
| Cíl 2: odhad doby splácení v exekuci | splněno | `dluhy.js:120–156`, `app.js:114–131`; D1–D7 |
| Cíl 3: oddlužení – splátka, délka, zbytek | splněno | `dluhy.js:159–185`; karta „Jak by to vypadalo v oddlužení“ (`vysledek-360.png`) |
| Cíl 4: na každé obrazovce výrazně bezplatná pomoc s odkazy na oficiální seznamy | splněno | lišta + pruh na všech 4 obrazovkách ve výřezu 360×800 (`prohlizec.json` `*Vyrez`, `vyrez-*-360.png`); sekce „Bezplatná pomoc“ s MPSV registrem a sako.justice.cz |
| Pevné pravidlo: žádné reklamy, affiliate, půjčky, placení zprostředkovatelé | splněno | `obsah.test.js` (povolené domény, zakázaná slova); jediný placený subjekt (VESTA) uveden s cenou a doporučením akreditovaných osob (DS-37) |
| Pevné pravidlo: žádné sbírání kontaktů, nic se neukládá ani neodesílá | splněno | žádný formulář s `action`, `form-action 'none'`, `connect-src 'self'`; síť jen vlastní původ + `rules.json`; `localStorage` {} (`prohlizec.json`, `uvod-kontrola.json`, `zivy-kontrola.json`) |
| Pevné pravidlo: věta „Orientační výpočet. Závazně to posoudí poradna, exekutor nebo insolvenční soud.“ u každého výsledku | splněno | `index.html:139, 157` (obě karty), `obsah.test.js`; `prohlizec.json` `vyhrady` 2× |
| Technologie: čisté HTML + CSS + JS (ES moduly), bez buildu a serveru | splněno | `index.html:11` `type=module`; žádný `package.json`; workflow jen kopíruje soubory |
| Výpočty v `dluhy.js` (čisté funkce), parametry po letech v `rules.json` se zdrojem a datem | splněno | `dluhy.js` bez DOM (importováno v node – `prepocet.txt`); `rules.json` `zdroj`, `odkaz`, `ucinnostOd` u každé hodnoty, `overeno` |
| Testy `node --test`; nasazení GitHub Pages | splněno | `testy.txt` 35/35; `.github/workflows/pages.yml` (testy → deploy); živý web HTTP 200, SHA shodné (`zivy-web-vs-main.txt`) |
| „Než začneš psát kód“: tabulka pravidlo → zdroj → datum (vzorce 2026/2027, zaokrouhlení, třetiny, 4+ exekucí, náhrada, délky, minimum, správce, kalkulátor, seznamy pomoci) | splněno | vše v `rules.json` (17 položek s § a datem) + README „Aktualizace pravidel“; 2027 správně jako neúplné |
| Výpočet: NČ = dlužník + osoby × částka, zaokrouhleno nahoru; zbytek; část do limitu dolů na dělitelnou třemi; nad limit celá; 1/3 nebo 2/3 | splněno | `dluhy.js:48–58, 70–96`; shoda s úřední kalkulačkou ve 13 případech |
| Výpočet: doba splácení = dluh / srážka, volitelně s úrokem a jasným upozorněním, že dluh může růst rychleji | splněno | `app.js:118–131` („Dluh poroste rychleji, než ho splácíte“ / „Dluh může růst rychleji, než se splácí“); Z2 na obrazovce |
| Obrazovka 1: „Nejste v tom sami“ + odkaz na poradnu nahoře | splněno | `index.html:20–27`, `uvod-360.png`, `vyrez-uvod-360.png` |
| Obrazovka 2: čistá mzda, počet vyživovaných osob, druh dluhů, počet exekucí, celková výše dluhů | splněno | `index.html:35–106` (+ důchod, dřívější oddlužení, úrok) |
| Obrazovka 3: kolik zůstane, kolik se strhne, doba splácení + karta oddlužení | splněno | `vysledek-360.png`, `vysledek-1440.png` |
| Obrazovka 4: Centrální evidence exekucí, kde najít poradnu, co připravit | splněno | `index.html:164–200`, `kroky-360.png` |
| Obrazovka 5: patička s datem ověření a zdroji | splněno | `index.html:232–249`; datum = `rules.json` |
| Kritéria: 5 testovacích případů 2026 (2 966; 25 391; 10 507 + 4 377; 21 153; 0) | splněno | `test/dluhy.test.js:17–50`; nezávisle Z1–Z5 shodné |
| Kritérium: odkaz na pomoc viditelný bez posouvání na každé obrazovce i na mobilu | splněno | `prohlizec.json`: `lista: true, pruh: true` na úvodu, formuláři, výsledku i krocích při 360×800 (3 běhy) a 1440×900 |
| Kritérium: 360 px bez vodorovného posuvníku | splněno | přetékání `false` ve všech stavech (`prohlizec.json`, `uvod-kontrola.json`, `zivy-kontrola.json`) |
| Kritérium: čtivost – krátké věty, zkratky vysvětlené | splněno | `node scripts/ctenost.mjs` (kopie): 208 vět, průměr 5,4 slova, nejdelší 17, žádné nevysvětlené zkratky; `obsah.test.js` |
| Postup: na konci porovnat dva výpočty s oficiálním kalkulátorem splátek justice | částečně | v repozitáři nedoloženo; ověřeno mnou: kalkulátor splátek dává totéž do mzdy 30 692 Kč (30 000 → 10 598 Kč, 23 000 → 5 932 Kč), nad ní se úřední skript rozchází s NV § 2 (`uredni-kalkulacky.txt` B) |

## Nálezy
### DLU-01 · Střední · 6 Texty a citlivá témata · Výchozí úrok 11,75 % se nabízí jako „zákonná sazba“ bez vazby na dobu vzniku prodlení
- **Kde:** `index.html:91` („Zákonná sazba pro druhou polovinu roku 2026 je 11,75 % ročně. Ve smlouvě můžete mít jinou.“), `index.html:94` (`value="11,75"`), `rules.json` `urokZProdleniProcenta`
- **Reprodukce:** NV 351/2013 Sb. § 2 odst. 1: výše úroku z prodlení odpovídá repo sazbě ČNB „pro první den kalendářního pololetí, v němž došlo k prodlení“, + 8 bodů – sazba je tedy daná okamžikem vzniku prodlení a po celou dobu se nemění. Podle ČNB (vyvoj_repo_historie.txt) je pro prodlení vzniklé v roce 2023 sazba 15,00 %, 1. pol. 2024 14,75 %, 2. pol. 2024 12,75 %, 1. pol. 2025 12,00 %, 2. pol. 2025 11,50 %; 11,75 % platí jen pro prodlení od 1. 7. 2026 (`prepocet.txt` U1, `zdroje.txt`). Uživatel s dluhem po splatnosti od roku 2023 zaškrtne „Počítat i s úrokem“ a nechá předvyplněných 11,75 %: pro 100 000 Kč a 2 916 Kč měsíčně aplikace ukáže „3 roky a 6 měsíců“ a úroky 22 445 Kč, správně při 15 % 46 měsíců a 31 403 Kč (`prepocet.txt` D2, D3; obrazovka „sazba 11,75“ v `prohlizec.json`). Reprodukováno 2× (modul i obrazovka, 3 běhy).
- **Dopad na uživatele:** u starších dluhů (typický případ člověka v exekuci) podhodnocená doba splácení a úroky o desítky procent; text navíc naznačuje, že 11,75 % je „ta zákonná sazba“, ačkoli pro většinu existujících dluhů neplatí.
- **Doporučená oprava:** v nápovědě vysvětlit, že zákonná sazba se určuje podle pololetí, kdy přestal splácet (a pak se nemění), přidat krátkou tabulku 2022–2026 nebo výběr „od kdy nesplácíte“ s dosazením sazby z `rules.json` (přidat historii repo sazeb), výchozí pole nechat prázdné nebo označit jako „pro nové prodlení od 1. 7. 2026“.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-02 · Střední · 1 Pravidla a data · Životní minimum se cituje ze zrušeného nařízení 436/2022 Sb. (i v patičce)
- **Kde:** `rules.json:7–13` (`zdroj` „Nařízení vlády č. 436/2022 Sb., § 1“, `odkaz` e-sbirka.gov.cz/sb/2022/436, `ucinnostOd` 2023-01-01), `index.html:242` („Nařízení vlády o životním minimu, číslo 436/2022“), README krok 1
- **Reprodukce:** zakonyprolidi.cz/cs/2022-436: „Zrušeno k 01.10.2025 (152/2025 Sb.)“; e-Sbírka na odkazu aplikace zobrazí „436/2022 Sb., 1. 1. 2023 – 30. 9. 2025, minulé znění, zrušeno“ (`prohlizec.json` → `esbirka`, 2 pokusy). Hodnota 4 860 Kč k 1. 1. 2026 plyne z NV 361/2025 Sb. § 1 (účinnost 1. 10. 2025; samo zrušeno k 1. 10. 2026, od kdy je 5 500 Kč přímo v § 2 zákona 110/2006 Sb.) – tak ji cituje i exekuce.justice.cz (`zdroje.txt`). Číslo v aplikaci je správné (DS-06), citace, odkaz i datum účinnosti ne.
- **Dopad na uživatele:** kdo si zdroj ověří, najde zrušený předpis a ztratí důvěru ve zbytek čísel; při příští aktualizaci (README krok 1) správce zkontroluje špatný předpis.
- **Doporučená oprava:** `zdroj` „NV 361/2025 Sb., § 1 (hodnota k 1. 1. 2026; NV 595/2006 § 4)“, `odkaz` https://e-sbirka.gov.cz/sb/2025/361, `ucinnostOd` 2025-10-01; v patičce totéž; v README poznámku, že od 1. 10. 2026 je ŽM v zákoně 110/2006 § 2.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-03 · Střední · 6 Texty a citlivá témata · Odkazované úřední kalkulačky dnes ukazují jiná čísla a aplikace na to neupozorní
- **Kde:** `index.html:216–221` (odkazy „Úřední kalkulačka srážek ze mzdy“, „Úřední informace o oddlužení … s kalkulačkou splátek“), `app.js:177` (rok podle data)
- **Reprodukce:** (a) exekuce.justice.cz/vypocet-srazek-ze-mzdy/ má jako první (výchozí) volbu „2026 výpočet od 1. 10.“ se skrytým ŽM 5 500 Kč; POST se stejnými vstupy 5. 11. 2026 (2 běhy): 23 000 Kč běžný → **2 784 Kč** (aplikace 2 966 Kč), 50 000 Kč přednostní → 24 441 Kč (25 391), 50 000 Kč běžný → 13 529 Kč (14 884), 23 000 Kč se 4 exekucemi → 2 784 Kč (5 932; varianta neuplatňuje ani pravidlo 4+ exekucí, ani náhradu plátce). Varianta „od 1. 1.“ dává přesně čísla aplikace (`uredni-kalkulacky.txt` A, A2). NV 595/2006 § 4 (znění od 1. 1. 2026) ukládá použít hodnoty „ve výši k 1. lednu kalendářního roku, do kterého spadá výplata mzdy“, text úřední stránky mluví jen o úpravě od 1. 1. 2026 (14 101,50 / 31 521 Kč) a žádná novela NV k 1. 10. 2026 neexistuje (ZPL: aktuální znění verze 7, bez budoucího znění) – aplikace počítá správně, úřední výchozí varianta zákon nereflektuje. (b) insolvence.justice.cz/kalkulator-splatek/ počítá v `kalkul.js` s hranicí `puvodni_vypocet_nasobeni012026 = 1` (1 × 16 590 Kč místo 1,9 ×): 50 000 Kč → **30 368 Kč** (aplikace i IZ § 398 odst. 3 + NV § 2: 25 391 Kč), 35 000 Kč → 15 368 Kč (13 932 Kč); do mzdy 30 692 Kč shoda (`uredni-kalkulacky.txt` B, B2 – jejich skript spuštěný v jejich stránce).
- **Dopad na uživatele:** člověk si výsledek „ověří“ na úřadem doporučené kalkulačce, dostane o 182–3 148 Kč měsíčně jiné číslo (nebo o 5 000 Kč vyšší splátku v oddlužení) a neví, komu věřit; může se rozhodnout podle špatného čísla úřadu, které aplikace mohla předem vysvětlit.
- **Doporučená oprava:** u odkazů doplnit větu typu „Úřední kalkulačka nabízí i variantu ‚od 1. 10. 2026‘ s vyšším životním minimem; nařízení vlády ale ukládá počítat celý rok 2026 s částkami k 1. lednu, proto se čísla mohou lišit“ a u kalkulátoru splátek „u mezd nad asi 30 700 Kč ukáže vyšší splátku“; do README zapsat, že srovnání bylo provedeno s variantou „od 1. 1.“.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-04 · Střední · 2 Výpočty · Tečka v částce se čte jako desetinná: „23.000“ = 23 Kč, „150.000“ = 150 Kč
- **Kde:** `app.js:33–37` (`cislo()` – odstraní mezery a „Kč“, čárku převede na tečku, tečku ponechá), `index.html:44, 78` (pole mzda a dluh jsou textová s `inputmode=numeric`)
- **Reprodukce:** mzda „23.000“, dluh „100 000“ → očekáváno 23 000 Kč (nebo hláška) → obrazovka „Z výplaty vám zůstane 23 Kč“, „Strhne se 0 Kč“, „Vaše výplata je nižší než částka, kterou vám musí nechat“, oddlužení „Měsíční splátka 0 Kč“, „Zbytek asi 100 000 Kč vám soud odpustí“ + varování o minimu. Mzda 23 000, dluh „150.000“ → „Odhad doby splácení: 1 měsíc“, oddlužení „Jak dlouho: 1 měsíc“, „Dluhy byste splatili celé dřív než za 3 roky“ (`fokus-a-okraje.json` `mzda23tecka`, `dluh150tecka`, 2 běhy; `prohlizec.json` formáty „23.000“, 3 běhy, cs-CZ i en-US). „23 000“, „23000,50“, „23000.50“ i „23 000 Kč“ se čtou správně.
- **Dopad na uživatele:** zápis s tečkou jako oddělovačem tisíců je u částek v Kč běžný; výsledek je nesmyslný, ale u dluhu („1 měsíc“) ho méně pozorný člověk může brát vážně.
- **Doporučená oprava:** v `cislo()` chápat tečku následovanou právě třemi číslicemi (a bez další desetinné části) jako oddělovač tisíců, případně částky pod 1 000 Kč u mzdy odmítnout hláškou „Napište celou měsíční mzdu, třeba 23 000“; přidat test.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-05 · Střední · 5 Mobil a přístupnost · Po odeslání formuláře se fokus ztratí (nadpis výsledku se zaostřuje dřív, než je zobrazen)
- **Kde:** `app.js:198–200` (`location.hash = 'vysledek'` a hned `$('vysledek-nadpis').focus()`; obrazovku zobrazí až asynchronní `hashchange` → `navigace()`)
- **Reprodukce:** vyplnit 23 000 / 100 000 a odeslat Enterem i klikem na „Spočítat“ → očekáváno fokus na `h1#vysledek-nadpis` (jak kód zamýšlí) → skutečnost `document.activeElement === body` ihned, po 100 ms i po 600 ms; další Tab přenese fokus na první odkaz v liště nahoře (`fokus-a-okraje.json`, 2 běhy; `prohlizec.json` `aktivni: "BODY"`, 3 běhy). Chybový stav funguje správně (fokus na `#mzda`).
- **Dopad na uživatele:** uživatel čtečky nebo klávesnice po odeslání neví, že se něco stalo, a musí projít celou stránku od začátku (WCAG 2.4.3); vidící uživatel vidí výsledek, protože stránka skočí nahoru.
- **Doporučená oprava:** zaostřit nadpis až po zobrazení obrazovky – např. volat `ukaz('vysledek')` přímo a pak `focus()`, nebo fokus přesunout v `navigace()` po `ukaz()` (a `aria-live` na nadpis). Přidat test/scénář v `scripts/mobil.mjs`.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-06 · Střední · 4 Testy · Chybí testy u propojení formuláře, u pevně zapsané sazby a u větví doby splácení
- **Kde:** `test/dluhy.test.js`, `test/obsah.test.js`, `test/rules.test.js`; `scripts/mobil.mjs` (mimo `node --test`, vyžaduje globální Playwright)
- **Reprodukce:** 35 testů prochází a pokrývají všech 5 příkladů ze zadání, zaokrouhlení, 4+ exekucí, důchodce, náhradu plátce, úrok i oddlužení (žádný test nefixuje špatnou hodnotu – každou hodnotu v testech jsem nezávisle potvrdil). Netestuje se: `cislo()` a `nactiFormular()` v `app.js` (DLU-04 by test odhalil), shoda textu „11,75“ v `index.html:91, 94` s `rules.json` (při změně repo sazby se rozjedou), větev `prilis-dlouho` (`dluhy.js:155`), `duvod: 'zadna-srazka'` při nenulové srážce (text „déle než 50 let“, DLU-07), rovnost třetiny a 1 089 Kč u důchodce (17 369 Kč → 2/3), `delkaSlovy` (0 měsíců, 1 rok, 5 let), `nejnovejsiPlatnyRok` pro rok bez platných pravidel, fokus po odeslání (DLU-05). `scripts/mobil.mjs` sice formulář zkouší, ale v CI neběží.
- **Dopad na uživatele:** nepřímý – budoucí úprava (nová sazba, nový rok, změna parsování) může projít testy a rozbít formulář nebo texty.
- **Doporučená oprava:** vyčlenit `cislo()` do modulu a otestovat („23 000“, „23.000“, „1500,50“, „Kč“, záporné), test shody `rules.json` ↔ `index.html` pro sazbu, testy větví `prilis-dlouho`/`zadna-srazka`/`delkaSlovy`, případně `scripts/mobil.mjs` zapojit do workflow.
- **Ověření:** reprodukováno 2× (čtení testů, `testy.txt`) · skeptik:

### DLU-07 · Nízká · 6 Texty a citlivá témata · Texty v okrajových případech: dluh 0, srážka 1 Kč, „úředník“
- **Kde:** `app.js:123, 125` (`v-doba`), `app.js:158` („Je to úředník, který na oddlužení dohlíží.“), `app.js:164–166`
- **Reprodukce:** dluh 0 → „Odhad doby splácení: 0 měsíců.“ a v oddlužení „Jak dlouho: 3 roky“, „Dluhy byste splatili celé dřív než za 3 roky“; mzda 14 105 Kč → srážka 1 Kč, věřitelům 0 Kč a text „Splácení by trvalo déle než 50 let.“ (ve skutečnosti věřitelé nedostanou nic, protože celou srážku pohltí náhrada plátce – větev `zadna-srazka` sdílí text s `prilis-dlouho`); oddlužení „Měsíční splátka 2 Kč“ (`fokus-a-okraje.json`, 2 běhy). Insolvenční správce není úředník, ale soukromá osoba s povolením ministerstva (zákon č. 312/2006 Sb., o insolvenčních správcích).
- **Dopad na uživatele:** matoucí formulace v nereálných vstupech; „úředník“ může vést k mylné představě o nestrannosti a bezplatnosti.
- **Doporučená oprava:** dluh 0 → „Nezadali jste žádný dluh“; `zadna-srazka` → „Věřitelům z této srážky nic nezbude“; „Je to odborník s licencí ministerstva, který na oddlužení dohlíží.“
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-08 · Nízká · 5 Mobil a přístupnost · V prohlížeči s jinou než českou lokalizací se „1,5“ v počtu osob změní na 15 bez hlášky
- **Kde:** `index.html:51` (`#osoby` `type=number`), `app.js:69` (kontrola čte už upravenou hodnotu pole)
- **Reprodukce:** Chromium `--lang=en-US`: napsat do „Kolika lidem platíte výživné?“ „1,5“ → hodnota pole „15“, `validity.valid = true`, výsledek „Musí vám zůstat aspoň 66 983 Kč“, srážka 0 Kč. V `--lang=cs-CZ` prohlížeč čárku přijme („1.5“) a aplikace správně hlásí „Napište celé číslo od 0 do 15.“ (`prohlizec.json` formáty „osoby 1,5“, běh 3 vs. běhy 1–2). Pole sazby je textové, čárku přijímá v obou lokalizacích.
- **Dopad na uživatele:** jen v neczeské lokalizaci a při nesmyslném vstupu (osoby nejsou desetinné); výsledek je zjevně absurdní.
- **Doporučená oprava:** u `#osoby` a `#exekuce` číst `validity.badInput`/`stepMismatch` nebo použít textové pole s vlastním parsováním jako u mzdy.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-09 · Nízká · 6 Texty a citlivá témata · Neúplnosti u pomoci a náhrady plátce
- **Kde:** `index.html:228` (4 000 Kč), `index.html:220` (odkaz na insolvence.justice.cz), `index.html:224–225` (ochrance.cz „letáky o srážkách ze mzdy“), `app.js:109–111` + `dluhy.js:94` (náhrada 50 Kč vždy)
- **Reprodukce:** IZ § 390a odst. 3: 4 000 Kč bez DPH, „v případě společného oddlužení manželů 6 000 Kč“ – aplikace uvádí jen 4 000 Kč (DS-26). Kalkulátor splátek má vlastní adresu /kalkulator-splatek/, odkaz vede na hlavní stránku (DS-32). Na ochrance.cz/letaky/ je leták „Exekuce“, leták výslovně o srážkách ze mzdy nenalezen (DS-36). Paušální náhrada plátci náleží podle exekuce.justice.cz jen „v exekučních řízeních, ve kterých byl exekuční příkaz vydán dne 1. ledna 2022 nebo později“ – aplikace ji odečítá vždy (rozdíl 50 Kč měsíčně u starších exekucí).
- **Dopad na uživatele:** drobné nepřesnosti bez vlivu na hlavní čísla.
- **Doporučená oprava:** doplnit „u manželů 6 000 Kč“, odkaz přímo na kalkulátor, formulaci „letáky o exekuci“, u náhrady větu „u exekucí nařízených před rokem 2022 se neplatí“.
- **Ověření:** reprodukováno 2× · skeptik:

### DLU-10 · Nízká · 8 Nasazení a větve · Chybějící favicon (404 v konzoli) a kontrola mobilu mimo CI
- **Kde:** `index.html` `<head>`; `.github/workflows/pages.yml` (kopíruje jen 6 souborů); README „node scripts/mobil.mjs“
- **Reprodukce:** lokálně i na https://frankie851.github.io/kalkulator-dluhu/ jediná chyba v konzoli: `favicon.ico` 404 (`uvod-kontrola.json`, `zivy-kontrola.json`, 2 běhy). `scripts/mobil.mjs` vyžaduje globálně nainstalovaný Playwright a v workflow neběží.
- **Dopad na uživatele:** žádný funkční; šum v konzoli, slabší ochrana proti regresi na mobilu.
- **Doporučená oprava:** `<link rel="icon" href="data:,">` nebo malá ikona (CSP `img-src 'self' data:` to dovolí); zvážit spuštění `scripts/mobil.mjs` v CI.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
Žádné (`git branch -a`: jen `main`, `origin/main`; jediný commit `abb6c1c`). Workflow `pages.yml` při pushi do `main` spustí `node --test` a nasadí `index.html`, `styles.css`, `app.js`, `dluhy.js`, `rules.json`, `.nojekyll`; živé soubory jsou po SHA-256 shodné s `main` (`zivy-web-vs-main.txt`, `rules.json` ověřen znovu 5. 11. 2026), živá stránka bez cizích požadavků, 0 porušení axe, jen 404 favicon (`zivy-kontrola.json`).

## Co se nepodařilo ověřit a předpoklady
- **Doslovný výklad OSŘ § 279 odst. 3** („zbytek čisté mzdy vypočtené podle odstavce 1 věty první“ = zbytek už zaokrouhlený na dělitelný třemi) by u mezd, kde zbytek přesahuje hranici a není dělitelný třemi, dal srážku o 1–2 Kč nižší (50 001 Kč: 14 884 vs 14 885 Kč). Úřední kalkulačka exekuce.justice.cz počítá jako aplikace (14 885 Kč), proto to nehodnotím jako nález; závazný výklad soudů jsem neověřoval.
- **Varianta úřední kalkulačky „2026 výpočet od 1. 10.“** – její právní základ se nepodařilo dohledat (žádná novela NV 595/2006 po 1. 1. 2026 na ZPL ani v e-Sbírce; stránka ji nevysvětluje). Předpokládám, že jde o připravenou, předčasně zveřejněnou variantu; výsledky jsem získal POSTem (2 běhy), nikoli v jejich prohlížečovém rozhraní.
- **Insolvenční kalkulátor živě:** jejich `kalkul.js` se v headless prohlížeči přes proxy nenačetl (ERR_TUNNEL u některých zdrojů), proto byl do jejich stránky vložen tentýž skript stažený curl; výsledky 10 598 / 5 932 / 30 368 Kč odpovídají mému přepisu. Nevylučuji, že produkční stránka má ještě jinou (nenalezenou) verzi skriptu.
- **Datum účinnosti zákona 252/2024 Sb.** (1. 10. 2024 u `minimumExekuciProDveTretiny`, `delkaOddluzeniMesicu`, `odmenaSpravceMesicne`) a **2019-06-01 u § 395 odst. 3** – přebírám stav rejstříku (R-03, DS-20: neověřeno přímo), na čísla pro rok 2026 to nemá vliv.
- **Normativní nájemné 9 430 Kč** jsem znovu nečetl ve sdělení 526/2025 Sb.; opírám se o rejstřík DS-08 a o text úřední kalkulačky, která je cituje.
- **Oddlužení manželů, jiná výše splátek podle IZ § 398 odst. 5, náklady exekuce, pořadí více věřitelů** – aplikace je vědomě neřeší (výslovně uvádí, že náklady exekuce nepočítá); nehodnotil jsem je jako nálezy.
- **Odkazy do e-Sbírky** fungují v prohlížeči (puppeteer, 1 pokus úspěšný); curl vrací jen kostru, strojově jsem ověřil jen tři adresy (436/2022, 361/2025, 595/2006).
- Testovací vstupy jsou smyšlené; žádné skutečné osobní údaje.
