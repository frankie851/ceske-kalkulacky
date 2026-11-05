# Revize: Mám EET? + OSVČ 2027 (`frankie851/mam-eet`)
Revidovaný commit: `e5bf47f97e1389606957ac2a02d66ecf02440b93` (5. 11. 2026) · živý web: https://frankie851.github.io/mam-eet/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Aplikace je postavená správně (čistý výpočetní modul bez DOM, všechna čísla v `rules.json` s úředními zdroji, 72 testů prochází, žádné cizí požadavky, bez XSS, bez přetékání na 360 px) a pravidla EET 2.0 i parametry roku 2027 se až na dvě výjimky shodují se zákonem a rejstříkem. Nejvážnější je, že kalkulačka OSVČ 2027 nezná sníženou minimální zálohu 25 % průměrné mzdy pro OSVČ v prvních třech letech podnikání (§ 14 odst. 5 věta druhá a § 5b odst. 2 ZPSZ) – začínajícímu živnostníkovi s 800 000 Kč a 60% paušálem doporučí paušální daň, přestože přiznání je pro něj o 5 532 Kč levnější; druhý vysoký nález je „serious“ chyba přístupnosti v grafu (axe `aria-prohibited-attr`). Výše 1. pásma 9 662 Kč je proti zákonnému vzorci o 1 Kč/měs. vyšší (9 661 Kč), úřední tabulka FS pro 2027 ale ještě nevyšla, proto jen Střední.
Nálezy: Kritická 0 · Vysoká 2 · Střední 7 · Nízká 5

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟡 | EET-03 |
| 2 Výpočty | 🔴 | EET-01 |
| 3 Shoda se zadáním | 🟡 | EET-01 (chybí 25 % pro začínající – zadání ji ale samo neuvádí), EET-09 |
| 4 Testy | 🟡 | EET-03 (test zakonzervoval vzorec 5 281 × 1,15) |
| 5 Mobil a přístupnost | 🔴 | EET-02 |
| 6 Texty a citlivá témata | 🟡 | EET-06 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
Zdroje: ID z rejstříku `pravidla.md` (oblast A); texty předpisů jsem znovu přečetl 5. 11. 2026 na zakonyprolidi.cz (znění od 1. 1. 2027), eet.gov.cz, financnisprava.gov.cz, cssz.gov.cz; staženo v `/tmp/revize/scratch/mam-eet/zdroje/`. Stav všech 33 URL z `rules.json`: `dukazy/mam-eet/url-stavy.txt` (32 × HTTP 200, z toho 6 × e-sbirka.gov.cz jen JS kostra; 1 × EPO na adisspr.mfcr.cz nedostupné přes proxy; všech 8 kotev na eet.gov.cz existuje).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Zákon o evidenci tržeb, účinnost 1. 1. 2027 | `rules.json:7, 24` (180/2026 Sb., `launch.date 2027-01-01`) | zák. č. 180/2026 Sb., § 36: účinnost 1. 1. 2027 | DP-41, https://www.zakonyprolidi.cz/cs/2026-180 | 5. 11. 2026 | shodné |
| Kontaktní platba (hotovost vždy; karta, QR/převod, poukázky, krypto, šek na místě; faktura převodem, platební brána, dobírka poštou ne) | `rules.json:60–142` `paymentMethods` | § 5 odst. 1, § 6 odst. 1, 2 ZoET; eet.gov.cz „Kdo musí evidovat“ (dobírka 1.8) | DP-42 | 5. 11. 2026 | shodné |
| Osobní vynětí § 11 (stát, ÚSC, VŠ, pošta; banky, pojišťovny…; nevidomí/hluchoslepí s průkazem ZTP/ZTP/P bez zaměstnanců) | `rules.json:239–256, 313–319` | § 11 odst. 1, 2, 4 ZoET | DP-43 | 5. 11. 2026 | shodné (zadání má širší „ZTP/P“ – chyba v zadání) |
| Věcné vynětí § 12 (11 oborů) | `rules.json:150–265` | § 12 odst. 1, 2 ZoET | DP-44 | 5. 11. 2026 | shodné |
| Další vynětí § 13 (automat, toalety, ryby 18.–24. 12.) | `rules.json:266–292` | § 13 odst. 2–5 ZoET | DP-45 | 5. 11. 2026 | shodné |
| Výjimka pro hotovost do 300 000 Kč | záměrně není (`test/rules.test.js:309`) | v § 11–13 ZoET neexistuje | DP-56 | 5. 11. 2026 | správně |
| EET OFF: jen FO v 1. pásmu, příjmy za 2026 ≤ 1 000 000 Kč | `rules.json:320–324` | § 2b odst. 1 ZDP | DP-46 | 5. 11. 2026 | shodné |
| Přirážka 1 400 Kč/měs., daňová složka 100 → 1 500 Kč, 16 800 Kč/rok | `rules.json:325–328`, `rules.js:37` | § 38lk odst. 7 písm. a), odst. 8 ZDP; brožura MF s. 9 | DP-47 | 5. 11. 2026 | shodné |
| EET OFF nelze během roku měnit; po překročení 1 mil. přirážka do konce roku | `rules.json:338` | § 2b odst. 4 ZDP; eet.gov.cz EET OFF | DP-48 | 5. 11. 2026 | shodné |
| Termín oznámení 11. 1. 2027 (10. 1. je neděle) | `rules.json:329, 787` | § 2b odst. 1 písm. b) ZDP + § 33 odst. 4 DŘ; eet.gov.cz: „do 11. ledna 2027“ | DP-49 | 5. 11. 2026 | shodné |
| Splatnost paušální zálohy do 20. dne; za leden do 20. 1. 2027 | `rules.json:796` | § 38lk odst. 5 ZDP; FS obecné informace | DP-63 | 5. 11. 2026 | shodné |
| Spuštění 1. 1. 2027, leden pilotní režim | `rules.json:23–29, 511` | § 36 ZoET; harmonogram FS („pilotní režim … standardní evidence“) | DP-50 | 5. 11. 2026 | shodné |
| MOJE eet od 1. 12. 2026, zejména ≤ 2 jednotky, zdarma | `rules.json:348–362` | eet.gov.cz praktické informace („nejvýše 2 evidenčními jednotkami“, „od 1. prosince 2026“) | DP-51 | 5. 11. 2026 | shodné (limit 2 zaměstnanců ze zadání úřední web nemá) |
| DIS+ od 1. 11. 2026, aktivace 48 h / 5 prac. dnů; certifikát před první tržbou; odezva 2 s, výpadek 48 h | `rules.json:438–505` | § 14, 15 ZoET; eet.gov.cz „Jak začít evidovat“, „Nastavení“ | DP-52, 53, 54 | 5. 11. 2026 | shodné |
| Infolinka 953 109 109, Po–Čt 9–17, Pá 9–14 | `rules.json:13–20` | eet.gov.cz online služby; brožura MF s. 12 | DP-55 | 5. 11. 2026 | shodné |
| Sleva na evidenci tržeb až 5 000 Kč (jen informativně) | `rules.json:363–369` | § 35ba odst. 1 písm. h), § 35be ZDP; brožura s. 10 | DP-28 | 5. 11. 2026 | shodné |
| Průměrná mzda 2027 = 48 900 × 1,0565 → 51 663 Kč | `rules.json:603` | NV č. 177/2026 Sb. § 1; § 23b odst. 4 ZPSZ | DP-30 | 5. 11. 2026 | shodné |
| Sazby pojistného 29,2 % / 13,5 %, zaokrouhlení nahoru | `rules.json:611, 634`; `osvc.js:10` | § 7 odst. 1 písm. e), odst. 3 ZPSZ; § 2 ZPZP | DP-66, DP-71 | 5. 11. 2026 | shodné |
| VZ 55 % (soc.) / 50 % (zdr.) základu | `rules.json:612, 635` | § 5b odst. 1 ZPSZ; § 3a odst. 1 ZPZP | DP-67 | 5. 11. 2026 | shodné |
| Min. měsíční VZ soc. hlavní 35 % PM = 18 083 Kč (záloha 5 281), vedlejší 11 % = 5 683 Kč (1 660) | `rules.json:613–621`; `osvc.js:37–45` | § 14 odst. 5 věty první a třetí, odst. 13 ZPSZ | DP-64 | 5. 11. 2026 | shodné |
| Min. VZ soc. **začínající OSVČ 25 % PM = 12 916 Kč** (rok zahájení + 2 roky) | **chybí** | § 14 odst. 5 věta druhá, § 5b odst. 2 písm. a) ZPSZ; ČSSZ pro 2026 uvádí 12 242 Kč | DP-64 | 5. 11. 2026 | **rozdíl – EET-01** |
| Roční minimum soc. = 12 × měsíční min. VZ | `osvc.js:113` | § 5b odst. 2 ZPSZ | DP-67 | 5. 11. 2026 | shodné |
| Max. VZ soc. 48 × PM = 2 479 824 Kč | `rules.json:615, 622` | § 15a odst. 5 ZPSZ | DP-69 | 5. 11. 2026 | shodné |
| Rozhodná částka vedlejší 123 991 Kč; účast při příjmu „aspoň“ rozhodná částka | `rules.json:616, 623`; `osvc.js:47, 110` | § 10 odst. 2 ZDPoj: 2,4 × 48 900 × 1,0565 = 123 990,84 → 123 991; účast, pokud příjem dosáhl aspoň rozhodné částky | DP-68 | 5. 11. 2026 | hodnota shodná; vzorec floor(2,4 × PM) a podmínka `<=` neodpovídají (EET-07, EET-11) |
| Min. VZ zdrav. = 12 × 50 % PM = 309 978 Kč; min. záloha 3 488 Kč; minimum neplatí pro zaměstnance a státní pojištěnce | `rules.json:636–640`; `osvc.js:39, 124` (309 984) | § 3a odst. 2, 3 ZPZP | DP-65 | 5. 11. 2026 | záloha shodná; roční minimum o 6 Kč vyšší, bez vlivu (EET-10) |
| Daň 15 % / 23 % nad 36 × PM = 1 859 868 Kč; základ na sta dolů; daň nahoru | `rules.json:647–650`; `osvc.js:85–87` | § 16 ZDP; § 146 DŘ | DP-29, DP-39 | 5. 11. 2026 | shodné |
| Sleva na poplatníka 30 840 Kč | `rules.json:651` | § 35ba odst. 1 písm. a) ZDP | DP-18 | 5. 11. 2026 | shodné |
| Daňové zvýhodnění 15 204 / 22 320 / 27 840 Kč; bonus ≥ 100 Kč; příjem § 6 nebo § 7 ≥ 6 × min. mzda = 149 400 Kč | `rules.json:652–658`; `osvc.js:93–100` | § 35c odst. 1, 3, 4 ZDP | DP-25, DP-27 | 5. 11. 2026 | shodné |
| Minimální mzda 2027 = 24 900 Kč | `rules.json:659–661` | sdělení MPSV č. 171/2026 Sb. (aplikace cituje NV 164/2026 Sb., které částku neobsahuje) | DP-24 | 5. 11. 2026 | hodnota shodná, zdroj chybný (EET-08) |
| Výdajové paušály 80/60/40/30 % se stropy 1,6/1,2/0,8/0,6 mil. Kč | `rules.json:668–693` | § 7 odst. 7 ZDP | DP-70 | 5. 11. 2026 | shodné |
| Podmínky paušálního režimu: ne plátce DPH, ne závislá činnost, příjmy ≤ 2 mil. Kč | `rules.json:697–721`; `osvc.js:160–173` | § 2a odst. 1 ZDP | DP-58 | 5. 11. 2026 | shodné |
| Rozhodné příjmy pásem (1 / 1,5 / 2 mil. podle 75 % příjmů s 80/60% paušálem) | `rules.json:731–773` | § 2a odst. 5 ZDP | DP-57 | 5. 11. 2026 | limity shodné; podmínka 75 % zjednodušena na jednu činnost bez upozornění (EET-06) |
| Záloha na daň v paušálu 100 / 4 963 / 9 320 Kč | `rules.json:727, 747, 765` | § 38lk odst. 7 ZDP | DP-59 | 5. 11. 2026 | shodné |
| Soc. složka 2. a 3. pásma 8 191 / 12 527 Kč; zdrav. 3 591 / 5 292 Kč | `rules.json:748–749, 766–767` | § 14 odst. 3 písm. b), c) ZPSZ; § 3a odst. 5 ZPZP; tabulka FS 2026 | DP-60, DP-61 | 5. 11. 2026 | shodné |
| **1. pásmo 2027: soc. = (18 083 × 1,15 → 20 796) × 29,2 % = 6 073 Kč; celkem 9 661 Kč** | `rules.json:726–730` (6 074 / **9 662 Kč**, stav „derived“) | § 14 odst. 3 písm. a), odst. 13 ZPSZ; postup FS 2026 (17 139 × 1,15 → 5 756 Kč) | DP-62 | 5. 11. 2026 | rozdíl 1 Kč/měs.; úřední tabulka FS pro 2027 k 5. 11. 2026 nezveřejněna (EET-03) |
| Datum ověření pravidel 5. 11. 2026 v patičce = `meta.lastVerified` | `rules.json:5`; `app.js:270`; `osvc-app.js:530` | – | – | 5. 11. 2026 | shodné (snímky) |

## Nezávislý přepočet
Referenční výpočet: `dukazy/skripty/mam-eet-prepocet.mjs` (bez kódu aplikace), porovnání s modulem: `mam-eet-porovnani.mjs` → `dukazy/mam-eet/prepocet.txt` (70 porovnání, dva běhy shodné). Obrazovka: `mam-eet-prohlizec.mjs` → `dukazy/mam-eet/prohlizec-scenare.json`, snímky `vysledek-eet-*.png`, `vysledek-osvc-*.png`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 zadání | OSVČ, hotovost, bez paušálu | musí evidovat | `must` | — | ano |
| Z2 zadání | jen faktury převodem | nemusí | `not` | — | ano |
| Z3 zadání | e-shop, jen platební brána | nemusí | `not` | — | ano |
| Z4 zadání | kavárna (PO), jen QR u pultu | musí | `must` | — | ano |
| Z5 zadání | OSVČ, hotovost, 1. pásmo, 800 000 Kč | EET OFF lze, přirážka 16 800 Kč, termín 11. 1. 2027 | `off`, 16 800, 2027-01-11 | „Můžeš zvolit EET OFF.“, přirážka 16 800 Kč, termín 11. 1. 2027, kalkulačka s pokladnou 20 000 → „EET OFF vychází levněji … ušetříš 3 200 Kč“ (`vysledek-eet-360.png`) | ano |
| Z6 zadání | 2. pásmo | EET OFF nelze | `must`, `wrongBand` | — | ano |
| Z7 zadání | 1. pásmo, 1 200 000 Kč | EET OFF nelze | `must`, `overLimit` | — | ano |
| E1/E2 vlastní | příjmy 1 000 000 / 1 000 001 Kč | lze / nelze | `off` / `must` | — | ano |
| E4–E10 vlastní | vyjmutý obor, nevidomý sám / se zaměstnanci, faktura + hotovost, nepodnikám, dobírka, 3 jednotky | not / not / must / must / not / not / must, MOJE eet nevhodná | shodné | — | ano |
| K2 vlastní | kalkulačka, vlastní pokladna 20 000 Kč | EET OFF levnější o 3 200 Kč | shodné | shodné (i „20 000“) | ano |
| K4/K6 vlastní | kalkulačka „20 000,50“ / −5 000 | neplatný vstup → hláška | bere jako 0 Kč: „Evidence vychází levněji: 0 Kč…“ | „20.000“ → **„20 Kč ročně … ušetříš 16 780 Kč“** | **ne (EET-04)** |
| O1 zadání | 800 000 Kč, 60 %, hlavní, 0 dětí | přiznání 17 160 + 63 363 + 41 848 = 122 371 Kč; paušál 1. pásmo 115 932 Kč; EET OFF 132 732 Kč | 122 371 / **115 944** / **132 744** Kč | 115 944 / 122 371 / 132 744 Kč, „Tvoje měsíční záloha: 9 662 Kč“ (`vysledek-osvc-360.png`) | jen 1. pásmo ±12 Kč (EET-03) |
| O2 zadání | plátce DPH | paušál i EET OFF nedostupné | shodné, důvod „Plátce DPH nemůže mít paušální daň“ | shodné | ano |
| O3 zadání | 1 200 000 Kč, 40 % | 2. pásmo 200 940 Kč; EET OFF ne; přiznání 241 392 Kč | shodné | 200 940 / 241 392 Kč, EET OFF „Nedostupné: … vychází 2. pásmo“ | ano |
| O4 zadání (E15) | 500 000 − 300 000 = základ 200 000 Kč, 2 děti | bonus 37 524; 63 363 + 41 848 − 37 524 = **67 687 Kč** (E15 67 704 = 12 × měsíční zálohy, rozdíl 17 Kč) | 67 687 Kč | 67 687 Kč, rozpis shodný | ano |
| O5/O6 vlastní | 1 000 000 / 1 000 001 Kč, 40 % | 1. pásmo + EET OFF / 2. pásmo bez EET OFF | shodné | — | ano |
| O7–O10 vlastní | 1,5 mil. 60 %; 2 mil. 80 %; 2 000 001 80 %; 1,6 mil. 30 % | band1, EET OFF ne; band1; paušál nedostupný; band3 | shodné | — | ano |
| O11/O12 vlastní | 5 / 6 mil. Kč, 40 % (23 %, strop výdajů, max. VZ) | 1 744 391 / 2 091 480 Kč | shodné | — | ano |
| O13 vlastní | vedlejší (student) 300 000 Kč, 60 % | soc. 0, zdr. 8 100 Kč | shodné | — | ano |
| O14 vlastní | vedlejší, zisk přesně 123 991 Kč | účast (§ 10 odst. 2 „aspoň“): soc. 19 914 Kč, celkem 28 284 Kč | soc. 0, celkem **8 370 Kč** | — | **ne (EET-07)** |
| O15/O16 vlastní | vedlejší, zisk 123 992 / 123 990 Kč | 28 284 / 8 370 Kč | shodné | — | ano |
| O17 vlastní | vedlejší při zaměstnání 400 000 Kč | paušál nedostupný (zaměstnanec), přiznání 36 496 Kč | shodné | — | ano |
| O18 vlastní | **začínající OSVČ** (25 % PM), 800 000 Kč, 60 % | přiznání 17 160 + 51 392 + 41 848 = **110 400 Kč** → přiznání levnější než paušál o 5 532 Kč | nelze zadat; počítá 122 371 Kč → **doporučí paušál („ušetříš 6 427 Kč“)** | — | **ne (EET-01)** |
| O19 vlastní | začínající, 600 000 Kč, 1 dítě | 77 062 Kč | 95 167 Kč | — | **ne (EET-01)** |
| O20–O22 vlastní | hranice bonusu 149 400 / 149 399 Kč; ztráta s dítětem | bonus 15 204 / 0 / 0 | shodné | — | ano |
| O23–O25 vlastní | základ 300 099 (sta dolů); 1 859 868 a 1 859 968 (23 %) | 119 371 / 672 367 / 672 408 Kč | shodné | — | ano |
| O26–O28 vlastní | 4 děti; bez kontaktních plateb; příjmy 1 Kč | 35 167 Kč; EET OFF ne; 105 211 Kč | shodné | — | ano |
| O29 vlastní | 1 200 000 Kč, příjmy napůl 60 % a 40 % (75 % nesplněno) | limit 1. pásma 1 mil. → 2. pásmo | nelze zadat; s „60 %“ dá 1. pásmo 115 944 Kč | — | **ne (EET-06)** |
| UI vlastní | OSVČ: „800 000“, „1 200 000“, „300 000“ s mezerou | přijato | — | přijato, výsledek správný | ano |
| UI vlastní | OSVČ: „1500000,50“, prázdné, „1.200.000“, −100, 0, děti −1 | chyba | — | chyba až po „Spočítat“, **tabulka se starým výsledkem zůstává** (`chyba-osvc-360.png`) | EET-05 |
| UI vlastní | EET dotazník: prázdné, „800000,50“, −1, „abc“, XSS | chyba | — | „Zadej celé číslo, nejméně 0.“; „1 500“ přijato | ano |
| UI vlastní | desetinná čárka „1500,50“, „0,85“ ve všech 4 číselných polích, prohlížeč cs-CZ i en-US (`mam-eet-carka.mjs` → `carka-lokalizace.txt`) | chyba (celé Kč) | — | pole jsou `type="text" inputmode="numeric"`, hodnota zůstane v poli beze změny v obou lokalizacích; dotazník a OSVČ formulář hlásí „Zadej … celé číslo“; kalkulačka EET OFF bez hlášky bere 0 Kč (EET-04) | ano / EET-04 |

## Shoda se zadáním
### Mám EET?
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1–3: zda evidovat, zda EET OFF a kolik stojí, co udělat do kdy | splněno | `rules.js:152–218` (`evaluate`), `:239–268` (`buildChecklist`); `vysledek-eet-360.png` |
| Čisté HTML + CSS + JS (ES moduly), bez buildu a serveru | splněno | `index.html:12–14`, `package.json` bez závislostí |
| Logika v `rules.js` bez vazby na DOM | splněno | `rules.js` neobsahuje `document`/`window`; testy běží v Node (`testy.txt`) |
| Částky, limity, termíny, texty v `rules.json` se zdrojem a datem; v kódu nic natvrdo | splněno | `rules.json` (každá položka `source`+`verified`, hlídá `test/rules.test.js:291–307`); zákaz čísel v kódu `rules.test.js:314–322` |
| Testy `node --test` nad `rules.js` | splněno | `test/rules.test.js`; `testy.txt` 72/72 |
| Nasazení GitHub Pages (návod v README) | splněno | `README.md:131–139`; živý web HTTP 200 |
| Ověřit pravidla na eet.gov.cz a brožuře MF; neuvádět výjimku 300 000 Kč | splněno | 300 000 není v `rules.json` (`rules.test.js:309–312`, DP-56); zdroje jen úřední (`rules.test.js:16–23`) |
| Eviduje se kontaktní platba: hotovost vždy, karta, QR, stravenky, poukázky, virtuální aktiva | splněno | `rules.json:60–114`; DP-42 |
| Neeviduje se faktura převodem, online platba přes bránu | splněno | `rules.json:115–141` (+ dobírka poštou, § 6 odst. 2) |
| Výjimky z evidence podle zákona, seznam z eet.gov.cz | splněno | `rules.json:143–293`; DP-43–45 shodné s § 11–13 ZoET |
| EET OFF: jen 1. pásmo, příjmy do 1 mil., 1 500 místo 100 Kč, 16 800 Kč/rok, nelze měnit | splněno | `rules.json:320–347`; DP-46–48; test `rules.test.js:62–72` |
| Spuštění 1. 1. 2027; MOJE EET od 1. 12. 2026 (max. 2 jednotky a 2 zaměstnanci, certifikát, DIS+) | splněno s odchylkou | `rules.json:23–29, 348–362`; limit 2 zaměstnanců záměrně vynechán (`README.md:127`), úřední web ho neuvádí (DP-51) – chyba v zadání |
| Obrazovka 1: dotazník, jedna otázka na obrazovku, max. 8, tlačítko Zpět | splněno | `app.js:63–107`, `:145–149`; `rules.test.js:233–240` (8 otázek) |
| Otázky: forma, platby, obor, paušál a pásmo, příjmy, počet provozoven/pokladen, počet zaměstnanců, ZTP/P | částečně | `rules.json:518–575`: 7 z 8 témat; „počet zaměstnanců“ jen jako otázka „bez zaměstnanců a tržby přijímáš sám“ u držitelů průkazu (jediné místo, kde na tom podle § 11 odst. 4 záleží); ZTP/P zúženo na zrak/hluchoslepotu podle zákona |
| Obrazovka 2: jedna věta, proč, odkaz na zdroj u každého důvodu | splněno | `app.js:153–177`; `prohlizec-scenare.json` → `odkazyNeoficialni: []`; `vysledek-eet-360.png` |
| Obrazovka 3: kalkulačka EET OFF (16 800 Kč vs. MOJE EET zdarma / vlastní pokladna), jedna věta | splněno, s chybou parsování | `app.js:192–230`, `rules.js:221–236`; EET-04 |
| Obrazovka 4: kontrolní seznam s termíny (certifikát, DIS+, volba režimu, aplikace/pokladna, test), tisk | splněno | `rules.json:402–517`, `app.js:234–253` (tlačítko tisk), `styles.css:352` `@media print` |
| Obrazovka 5: patička s upozorněním, datem kontroly, eet.gov.cz, infolinkou | splněno | `app.js:266–278`; snímky (5. 11. 2026 = `rules.json:5`) |
| Kritéria: 7 testovacích případů v `node --test` | splněno | `test/rules.test.js:33–95`; shoda s mým přepočtem (tabulka výše) |
| Každý výsledek ukazuje aspoň jeden odkaz na oficiální zdroj | splněno | `assertHasOfficialSource` v testech; obrazovka Z5: 2 důvody se zdroji eet.gov.cz |
| Mobil 360 px bez vodorovného posuvníku | splněno | `prohlizec-scenare.json` `preteka: false` (úvod, výsledek, chyba); snímky |
| Odpovědi se neukládají ani neodesílají; žádné analytiky | splněno | `sit: []`, `localStorage: {}` (lokálně i živě); CSP `index.html:6–7` |
| README česky: spuštění, úprava `rules.json` při změně výkladu | splněno | `README.md:65–74, 98–129` |

### OSVČ 2027
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: roční odvody ve 3 variantách (paušál v pásmu s nárokem, přiznání s paušálem/skutečnými výdaji, EET OFF) + co se vyplatí | splněno | `osvc.js:130–303`; `vysledek-osvc-360.png` |
| Termíny: přihláška do 11. 1. 2027, první platba do 20. 1. 2027 | splněno | `rules.json:784–803`; `test/osvc.test.js:265–270`; DP-49, DP-63 |
| Druhá záložka aplikace Mám EET?, společný `rules.json` a styl | splněno | `index.html:22–25, 41`; `osvc-app.js:35–77` |
| Výpočty v `osvc.js` bez DOM | splněno | `osvc.js` bez `document`; testy v Node |
| Parametry v `rules.json` sekce `osvc2027`, každý se zdrojem a datem | splněno | `rules.json:598–983` (`status`, `source`, `verified`) |
| Testy `node --test`, nasazení GitHub Pages | splněno | `test/osvc.test.js`; `testy.txt` |
| Ověřit hodnoty: 3 pásma, podmínky pásem, PM 2027, min. VZ, sazby, paušály a stropy, slevy, zvýhodnění, hranice 23 %, zaokrouhlení; min. zálohy „jen návrh“ – ověřit | částečně | hodnoty shodné s rejstříkem kromě 1. pásma (EET-03); 35 % PM je v zákoně (DP-64), aplikace ho správně má; chybí varianta 25 % PM pro začínající (EET-01) – zadání ji samo neuvádí (chyba v zadání) |
| Zisk = příjmy − výdaje (paušál 80/60/40/30 % se stropem, nebo skutečné) | splněno | `osvc.js:56–66`; O11 (strop 800 000) shodné |
| Daň = 15 % (23 % nad hranicí) − sleva 30 840 (min. 0) − zvýhodnění na děti (bonus) | splněno | `osvc.js:82–102`; O4, O20–O26 shodné |
| Sociální = max(55 % zisku, roční min. VZ) × 29,2 % | částečně | `osvc.js:105–116`: správně pro OSVČ po 3. roce; chybí min. VZ 25 % PM pro začínající (EET-01); hranice vedlejší činnosti `<=` místo `<` (EET-07) |
| Zdravotní = max(50 % zisku, roční min. VZ) × 13,5 % | splněno | `osvc.js:119–127`; roční minimum 309 984 místo 309 978 Kč bez vlivu na výsledek (EET-10) |
| Paušál 12 × měsíční částka; EET OFF = 1. pásmo + 12 × 1 400 Kč | splněno | `osvc.js:176–213`; 1. pásmo 9 662 vs. zákon 9 661 Kč (EET-03) |
| Formulář: příjmy, druh činnosti / skutečné výdaje, DPH, děti, hlavní/vedlejší, kontaktní platby | splněno | `osvc-app.js:115–165` |
| Výsledek: tabulka 3 variant (ročně, měsíčně), nejlevnější zvýrazněná, rozdíl, důvody nedostupnosti | splněno | `osvc-app.js:216–263`; obrazovka O2 („Plátce DPH nemůže mít paušální daň“), O3 |
| Graf 100 tis.–2 mil. Kč pro zvolený paušál a obě varianty s bodem zlomu | splněno, s chybou přístupnosti | `osvc-app.js:298–487`, `rules.json:848–879`; bod zlomu „Od příjmů 693 000 Kč…“; EET-02 |
| Termíny a odkazy na formuláře finanční správy | splněno | `osvc-app.js:491–503`, `rules.json:804–847` (tiskopisy 5255, 5260 HTTP 200; EPO neověřeno) |
| Patička „Orientační výpočet, nejde o daňové poradenství“, datum ověření | splněno | `osvc-app.js:518–538`; snímek |
| Kritérium: paušál 1. pásmo za rok = 115 944 Kč (12 × 9 662) | splněno vůči zadání, zadání chybné | `test/osvc.test.js:37–43` prochází; podle § 14 odst. 3 ZPSZ 9 661 Kč → 115 932 Kč (EET-03, EET-09) |
| Kritérium: EET OFF = 132 744 Kč | splněno vůči zadání, zadání chybné | `osvc.test.js:45–50`; zákon 132 732 Kč |
| Kritérium: plátce DPH → paušál nedostupný | splněno | `osvc.test.js:52–60`; O2 |
| Kritérium: 1 200 000 Kč, 40 % → 1. pásmo i EET OFF nedostupné | splněno | `osvc.test.js:62–72`; O3 |
| Kritérium: základ 200 000 Kč, 2 děti → cca 67 700 Kč (±100) | splněno | 67 687 Kč (`osvc.test.js:74–81`), můj výpočet 67 687 Kč, E15 67 704 Kč = 12 × zálohy |
| Mobil 360 px bez posuvníku; nic se neukládá ani neodesílá | splněno | `prohlizec-scenare.json` (osvc 360/1440 `preteka: false`, `sit: []`, `localStorage: {}`) |
| Postup: tabulka hodnot → schválení → testy → UI; porovnat s E15 / FS | nelze zpětně ověřit | pořadí commitů (`git log`) odpovídá; porovnání s E15 je v README a testu |

## Nálezy
### EET-01 · Vysoká · 2 Výpočty · Chybí snížené minimum 25 % průměrné mzdy pro začínající OSVČ
- **Kde:** `osvc.js:105–116` (`socialIns`: minimum vždy `socialMinBaseMain` = 35 % PM), `rules.json:613` (`minBaseShareMain 0.35`, žádný parametr pro začínající), formulář `osvc-app.js:147–149` (jen hlavní / vedlejší)
- **Reprodukce:** vstup 800 000 Kč, 60% paušál, hlavní činnost, OSVČ v roce zahájení nebo ve 2 následujících letech (bez podnikání v předchozích 20 letech) → očekáváno podle § 14 odst. 5 věty druhé a § 5b odst. 2 písm. a) ZPSZ (znění od 1. 1. 2027, https://www.zakonyprolidi.cz/cs/1992-589/zneni-20270101; ČSSZ pro 2026 uvádí 25 % PM = 12 242 Kč, https://www.cssz.gov.cz/zalohy-na-pojistne-na-duchodove-pojisteni): min. roční VZ 12 × 12 916 = 154 992 Kč < 55 % × 320 000 = 176 000 Kč → sociální 51 392 Kč, přiznání 110 400 Kč, **přiznání levnější než paušál** (115 932 Kč) o 5 532 Kč → skutečnost: aplikace počítá minimum 216 996 Kč, sociální 63 363 Kč, přiznání 122 371 Kč a doporučí paušál („Nejlevněji vychází Paušální daň… Ušetříš 6 427 Kč“). Pro zisk do 394 537 Kč nadhodnocuje sociální pojistné až o 18 105 Kč/rok (`prepocet.txt` O18, O19). Paušál 1. pásma se u začínajících nemění (§ 14 odst. 3 písm. a) odkazuje jen na větu první).
- **Dopad na uživatele:** začínající živnostník s nízkým ziskem dostane obrácené doporučení (paušál místo přiznání) a přeplatí tisíce korun ročně; aplikace o tomto zjednodušení nikde neinformuje.
- **Doporučená oprava:** přidat do formuláře přepínač „podnikám 1.–3. rokem (a 20 let předtím jsem nepodnikal)“, do `rules.json` `minBaseShareStarting 0.25` se zdrojem § 14 odst. 5 ZPSZ a v `socialIns` použít 12 × ceil(0,25 × PM) = 154 992 Kč; doplnit test; do textu poznámek uvést, že paušál 1. pásma se tím nemění.
- **Ověření:** reprodukováno 2× (zákon § 5b odst. 2 + § 14 odst. 5 a ČSSZ; dva běhy `mam-eet-porovnani.mjs`) · skeptik:

### EET-02 · Vysoká · 5 Mobil a přístupnost · axe „serious“: `aria-label` na `<rect>` bez role (WCAG 4.1.2)
- **Kde:** `osvc-app.js:433–436` (`s('rect', { … tabindex: 0, 'aria-label': tx.chartHelp })`), obrazovka výsledku OSVČ 2027 s grafem
- **Reprodukce:** otevřít `#osvc`, zadat příjmy 800 000 Kč → axe-core (WCAG 2.2 A/AA) hlásí `aria-prohibited-attr`, dopad **serious**, uzel `rect` (`prohlizec-scenare.json` → `osvc.360.axeVysledek` i `axeChyba`; úvodní stránka bez grafu je čistá). Prvek `<rect>` má generickou roli, na které je `aria-label` zakázán, čtečka proto nápovědu „Najetím nebo šipkami na grafu…“ nepřečte, přestože je prvek fokusovatelný.
- **Dopad na uživatele:** uživatel čtečky dostane neoznačený fokusovatelný prvek bez vysvětlení, co s ním dělat (hodnoty grafu jsou naštěstí dostupné i v tabulce pod grafem).
- **Doporučená oprava:** dát překryvu `role="application"` nebo `role="img"` (případně nahradit `<rect>` tlačítkem/`<g role="group">`), nebo text přesunout do `<title>`/`aria-describedby` na `<svg>`; ověřit axe = 0 serious.
- **Ověření:** reprodukováno 2× (dva běhy `mam-eet-prohlizec.mjs`, obě analýzy) · skeptik: Potvrzeno (Opus, 5. 11. 2026 – axe 4.14 reprodukoval aria-prohibited-attr serious na rect.overlay při 1280×900 i 390×844; rodičovské svg má role=img, popisek fokusovatelného prvku se nezpřístupní)

### EET-03 · Střední · 1 Pravidla a data · 1. pásmo paušální daně 2027 je 9 662 Kč, podle zákonného vzorce vychází 9 661 Kč
- **Kde:** `rules.json:726–741` (`band1.monthly 9662`, `social 6074`, `socialFromMinAdvanceMultiple 1.15`, note „minimální záloha × 1,15“), test `test/osvc.test.js:98–103` a `:37–50` (115 944 / 132 744), obrazovka „Tvoje měsíční záloha: 9 662 Kč“
- **Reprodukce:** § 14 odst. 3 písm. a) ZPSZ: měsíční VZ 1. pásma = nejnižší měsíční VZ (35 % × 51 663 = 18 082,05 → 18 083 Kč, § 14 odst. 13) zvýšený o 15 % = 20 795,45 → 20 796 Kč; pojistné 29,2 % = 6 072,43 → **6 073 Kč** (§ 7 odst. 3) → 1. pásmo 100 + 6 073 + 3 488 = **9 661 Kč** (https://www.zakonyprolidi.cz/cs/1992-589/zneni-20270101; postup FS na roce 2026: 17 139 × 1,15 → 5 756 Kč souhlasí s tabulkou FS od 7/2026, https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/pausalni-dan/obecne-informace) → skutečnost: aplikace násobí 1,15 až zaokrouhlenou zálohu (5 281 × 1,15 = 6 073,15 → 6 074), tj. 9 662 Kč, 115 944 Kč/rok, EET OFF 132 744 Kč. Úřední tabulka FS pro 2027 k 5. 11. 2026 nevyšla (ověřeno na stránce FS – jen 2026), aplikace stav „derived“ přiznává v patičce i v poznámce výsledku. Zadání (ř. 497+) uvádí stejnou chybnou hodnotu z médií; test ji zakonzervoval, včetně zdroje „FS, tisková zpráva 19. 1. 2026 (výpočet 1. pásma 2026)“, která žádný výpočet neobsahuje, jen tabulku.
- **Dopad na uživatele:** rozdíl 1 Kč měsíčně (12 Kč ročně) u paušálu i EET OFF a v doporučené výši trvalého příkazu; na pořadí variant nemá vliv. Závažnost zůstává Střední, dokud FS tabulku nezveřejní; pokud FS potvrdí 9 662 Kč, nález padá, pokud 9 661 Kč, jde o nepřesnou částku zálohy.
- **Doporučená oprava:** v `rules.json` počítat 1. pásmo z VZ (`ceil(ceil(0,35 × PM) × 1,15) × 0,292`, nahoru) → 6 073 / 9 661 Kč, upravit test a očekávané hodnoty 115 932 / 132 732 Kč, opravit popis zdroje; po zveřejnění tabulky FS pro 2027 nastavit `status: official`.
- **Ověření:** reprodukováno 2× (zákon + tabulka FS 2026; dva běhy porovnání) · skeptik:

### EET-04 · Střední · 2 Výpočty · Kalkulačka EET OFF tiše bere neplatnou cenu pokladny jako 0 Kč a „20.000“ jako 20 Kč
- **Kde:** `app.js:205` (`Number(costInput.value.replace(/\s/g, ''))`), `rules.js:223` (`ownCostAnnual > 0 ? ownCostAnnual : 0`), pole „Roční náklady na vlastní pokladnu“
- **Reprodukce:** výsledek Z5 → „Budu evidovat ve vlastní pokladně“ → zadat „20 000,50“ nebo „−5000“ → očekáváno chybová hláška (jako u ostatních číselných polí) → skutečnost „Evidence vychází levněji: 0 Kč ročně proti přirážce 16 800 Kč, ušetříš 16 800 Kč.“; zadat „20.000“ → „Evidence vychází levněji: **20 Kč** ročně …, ušetříš 16 780 Kč“ (správně: EET OFF levnější o 3 200 Kč). `prohlizec-scenare.json` → `eet.360.kalkulacka`; `prepocet.txt` K4, K6. Chování je stejné v prohlížeči cs-CZ i en-US (`carka-lokalizace.txt`): pole je `type="text"`, takže prohlížeč čárku nezahazuje a chyba je čistě v parsování `Number()` v aplikaci; ostatní tři číselná pole čárku správně odmítnou hláškou.
- **Dopad na uživatele:** při českém zápisu s tečkou nebo desetinnou čárkou dostane opačné doporučení; částka 0/20 Kč je ve větě vidět, takže pozorný uživatel chybu odhalí, ale bez varování.
- **Doporučená oprava:** použít stejnou validaci jako v dotazníku (celé číslo ≥ 0, jinak hláška a bez věty), odmítnout tečku jako oddělovač tisíců nebo ji odstranit stejně jako mezery; v `compareCosts` vracet pro NaN/záporné `null` místo 0.
- **Ověření:** reprodukováno 2× (dva běhy prohlížeče) · skeptik:

### EET-05 · Střední · 5 Mobil a přístupnost · OSVČ 2027: při neplatném vstupu zůstává na obrazovce starý výsledek
- **Kde:** `osvc-app.js:194–212` (`update`: při chybě bez odeslání nic nehlásí, `lastResult` nechá zobrazený; po odeslání ukáže hlášku, ale tabulku neskryje)
- **Reprodukce:** zadat 1 200 000 Kč (výsledek se přepočítá živě) → dopsat „,50“ nebo pole smazat → očekáváno: hláška a skrytý/označený neplatný výsledek → skutečnost: žádná hláška, tabulka dál ukazuje výsledek pro 1 200 000 Kč (resp. pro poslední platný mezistav, při psaní „1.200.000“ pro 1 Kč); po „Spočítat“ přibude hláška „Zadej roční příjmy jako celé číslo, nejméně 1.“, ale tabulka, graf a „Tvoje měsíční záloha“ zůstanou (`chyba-osvc-360.png`, `prohlizec-scenare.json` → `osvc.360.desetinne`, `prazdne`, `tecky`).
- **Dopad na uživatele:** uživatel může číst částky, které nepatří k číslu ve formuláři; chyba se projeví jen po stisku tlačítka.
- **Doporučená oprava:** při neplatném vstupu výsledek skrýt nebo označit („výsledek platí pro …“) a hlášku zobrazovat i bez odeslání (po opuštění pole).
- **Ověření:** reprodukováno 2× · skeptik:

### EET-06 · Střední · 6 Texty a citlivá témata · Pásmo paušálu se určuje z jediné činnosti, podmínka „alespoň 75 % příjmů“ a zjednodušení nejsou zmíněny
- **Kde:** `osvc.js:151–157` (`flatTaxBands`: limit podle `flatRateId`), `rules.json:731–736`, formulář „Druh činnosti (výdajový paušál)“ `osvc-app.js:133–135`, texty `rules.json:937–939`
- **Reprodukce:** OSVČ s příjmy 1 200 000 Kč napůl ze živnosti (60 %) a z autorských honorářů (40 %) zvolí „60 %“ → očekáváno podle § 2a odst. 5 písm. a) ZDP: podmínka 75 % příjmů s 80/60% paušálem nesplněna → limit 1. pásma 1 000 000 Kč → 2. pásmo (200 940 Kč), EET OFF nelze → skutečnost: „1. pásmo: ano (limit 1 500 000 Kč)“, paušál 115 944 Kč (`prepocet.txt` O29). Nikde není uvedeno, že se předpokládají všechny příjmy z jedné činnosti.
- **Dopad na uživatele:** u kombinovaných příjmů nabídne pásmo bez nároku; při skutečném podání by FÚ oznámení zamítl nebo by vznikla jiná výše paušální daně.
- **Doporučená oprava:** doplnit k poli nápovědu „platí, pokud aspoň 75 % příjmů spadá pod zvolený paušál“ nebo doplňkovou otázku na podíl příjmů, případně do poznámek výsledku.
- **Ověření:** reprodukováno 2× (zákon § 2a odst. 5; dva běhy porovnání) · skeptik:

### EET-07 · Střední · 2 Výpočty · Vedlejší činnost: při zisku přesně 123 991 Kč aplikace nepočítá sociální pojištění
- **Kde:** `osvc.js:110` (`zisk <= p.sideThreshold` → bez pojistného)
- **Reprodukce:** vedlejší činnost (student/důchodce), příjmy 300 000 Kč, skutečné výdaje 176 009 Kč (zisk 123 991 Kč) → očekáváno podle § 10 odst. 2 ZDPoj („pokud její příjem … dosáhl … aspoň rozhodné částky“ – https://www.zakonyprolidi.cz/cs/1995-155/zneni-20270101; DP-68): účast vzniká, sociální = max(68 196; 12 × 5 683) × 29,2 % = 19 914 Kč, celkem 28 284 Kč → skutečnost: sociální 0 Kč, celkem 8 370 Kč; při 123 992 Kč už správně 19 914 Kč (`prepocet.txt` O14–O16).
- **Dopad na uživatele:** jen při zisku rovném rozhodné částce (hranice široká 1 Kč) chybí 19 914 Kč; prakticky vzácné, ale podmínka je obrácená.
- **Doporučená oprava:** `zisk < p.sideThreshold`; doplnit test hranice.
- **Ověření:** reprodukováno 2× · skeptik:

### EET-08 · Střední · 1 Pravidla a data · Zdroj minimální mzdy odkazuje na NV 164/2026 Sb., které částku neobsahuje
- **Kde:** `rules.json:659–661` (`minimumWage 24900`, `minimumWageSource https://e-sbirka.gov.cz/sb/2026/164`, titulek „Nařízení vlády č. 164/2026 Sb. (minimální mzda 2027)“)
- **Reprodukce:** NV 164/2026 Sb. stanoví jen koeficienty pro výpočet (https://www.zakonyprolidi.cz/cs/2026-164, § 1); částku 24 900 Kč vyhlašuje sdělení MPSV č. 171/2026 Sb., bod 1 (https://www.zakonyprolidi.cz/cs/2026-171) → aplikace uvádí správnou hodnotu s nesprávným předpisem (DP-24).
- **Dopad na uživatele:** čísla se nemění; kdo si zdroj otevře, částku tam nenajde.
- **Doporučená oprava:** změnit zdroj na sdělení č. 171/2026 Sb. (e-sbirka.gov.cz/sb/2026/171), NV 164/2026 Sb. ponechat jako druhý odkaz.
- **Ověření:** reprodukováno 2× (oba předpisy přečteny) · skeptik:

### EET-09 · Střední · 3 Shoda se zadáním · Chyby v zadání (`docs/zadani.md`) proti úředním zdrojům
- **Kde:** `docs/zadani.md` ř. 497–571 (OSVČ 2027) a 221–299 (Mám EET?)
- **Reprodukce:** (a) „1. pásmo 9 662 Kč (daň 100, sociální 6 074…)“ a kritéria „115 944 Kč“, „132 744 Kč“ – podle § 14 odst. 3 písm. a) ZPSZ 9 661 / 115 932 / 132 732 Kč (viz EET-03; zdrojem zadání jsou média); (b) „Minimální zálohy 2027 (návrh): sociální 5 281 Kč“ – sazba 35 % PM je v § 14 odst. 5 ZPSZ (účinné od 1. 7. 2026, novela 90/2026 Sb.), nejde o návrh; (c) zadání neuvádí sníženou sazbu 25 % PM pro začínající OSVČ, proto ji aplikace nemá (EET-01); (d) výjimka „podnikatelé se ZTP/P bez zaměstnanců“ – § 11 odst. 4 ZoET ji dává jen při průkazu kvůli nevidomosti, těžké ztrátě zraku nebo hluchoslepotě; (e) „MOJE EET … max. 2 zaměstnanci“ – eet.gov.cz uvádí jen 2 evidenční jednotky. Body (d) a (e) má aplikace správně (odchýlila se od zadání oprávněně).
- **Dopad na uživatele:** kritérium hotovo „115 944 Kč“ nutí autora k hodnotě, která se pravděpodobně rozejde s tabulkou FS; chybějící pravidlo (c) vedlo k nálezu EET-01.
- **Doporučená oprava:** opravit zadání: 1. pásmo „podle vzorce § 14 odst. 3 ZPSZ, do zveřejnění tabulky FS orientačně 9 661 Kč“, doplnit sazbu 25 % PM pro začínající, upřesnit (d) a (e).
- **Ověření:** reprodukováno 2× (rejstřík + vlastní čtení předpisů) · skeptik:

### EET-10 · Nízká · 2 Výpočty · Roční minimální VZ zdravotního pojištění 309 984 Kč místo 309 978 Kč
- **Kde:** `osvc.js:39, 124` (`healthMinBase = ceil(51 663 × 0,5) = 25 832` × 12), rozpis výpočtu na obrazovce („minimum 309 984 Kč“)
- **Reprodukce:** § 3a odst. 2 ZPZP: minimum = dvanáctinásobek 50 % PM = 12 × 25 831,5 = 309 978 Kč (měsíční část se nezaokrouhluje) → pojistné 41 847,03 → 41 848 Kč, aplikace 41 847,84 → 41 848 Kč: pro 2027 bez rozdílu, v jiném roce může dát 1 Kč.
- **Dopad na uživatele:** žádný v roce 2027; nepřesný mezivýsledek v rozpisu.
- **Doporučená oprava:** počítat roční minimum jako `12 × PM × 0,5` bez zaokrouhlení měsíční části (měsíční zálohu zaokrouhlit zvlášť).
- **Ověření:** reprodukováno 2× · skeptik:

### EET-11 · Nízká · 1 Pravidla a data · Rozhodná částka počítaná jako floor(2,4 × PM)
- **Kde:** `osvc.js:47` (`Math.floor(avg × 2.4 + EPS)`), `rules.json:616, 625`
- **Reprodukce:** § 10 odst. 2 ZDPoj: 2,4 × (VVZ × koeficient) = 2,4 × 51 662,85 = 123 990,84 → zaokrouhlení nahoru 123 991 Kč; aplikace floor(2,4 × 51 663 = 123 991,2) = 123 991 Kč – shoda jen náhodou (DP-68).
- **Dopad na uživatele:** pro 2027 žádný; v jiném roce odchylka 1 Kč.
- **Doporučená oprava:** počítat z nezaokrouhleného součinu VVZ × koeficient a zaokrouhlit nahoru (uložit VVZ a koeficient do `rules.json`).
- **Ověření:** reprodukováno 2× · skeptik:

### EET-12 · Nízká · 5 Mobil a přístupnost · Obrazovky dotazníku nemají nadpis úrovně 1
- **Kde:** `app.js:63–107` (otázka je `<legend>`, `h1` je jen na úvodu a výsledku)
- **Reprodukce:** během dotazníku axe hlásí `page-has-heading-one` (moderate, best-practice) – `prohlizec-scenare.json` → `eet.360.axeChyba`; žádný nález A/AA.
- **Dopad na uživatele:** horší orientace čtečkou; funkčnost beze změny.
- **Doporučená oprava:** vykreslit otázku jako `h1` (nebo ponechat skrytý `h1` s názvem průvodce).
- **Ověření:** reprodukováno 2× · skeptik:

### EET-13 · Nízká · 6 Texty a citlivá témata · Popis zdroje 1. pásma a odkazy na e-Sbírku
- **Kde:** `rules.json:739–740` (`sourceTitle` „FS, tisková zpráva 19. 1. 2026 (výpočet 1. pásma 2026)“), `rules.json:606, 627, 630, 642, 660, 664, 694` (e-sbirka.gov.cz)
- **Reprodukce:** tisková zpráva FS obsahuje jen tabulku záloh 2026 (9 984 / 16 745 / 27 139 Kč), žádný „výpočet“; odkazy na e-sbirka.gov.cz vrací přes curl jen 1 040 B JS kostru (v prohlížeči se skládají), takže zdroj nelze strojově ověřit – uživateli fungují.
- **Dopad na uživatele:** zavádějící název zdroje; jinak kosmetika.
- **Doporučená oprava:** přejmenovat zdroj („tabulka záloh 2026“), vzorec doložit § 14 odst. 3 ZPSZ; u e-Sbírky doplnit paragraf do titulku.
- **Ověření:** reprodukováno 2× · skeptik:

### EET-14 · Nízká · 5 Mobil a přístupnost · Pole přijímají zápis „1e6“ jako číslo
- **Kde:** `app.js:116–118`, `osvc-app.js:81–86` (`Number(raw)` po odstranění mezer)
- **Reprodukce:** příjmy „1e6“ → přijato jako 1 000 000 Kč bez hlášky (`prohlizec-scenare.json` → `osvc.360.exponent`); „1.200.000“ a „1500,50“ jsou správně odmítnuty.
- **Dopad na uživatele:** prakticky žádný.
- **Doporučená oprava:** validovat regulárním výrazem `^\d+$` po odstranění mezer.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
`claude/fix-tabs-race` (commit `c0f4904`): už je součástí `main` – merge PR #2 je právě revidovaný commit `e5bf47f`, `git diff main...origin/claude/fix-tabs-race --stat` je prázdný. Mění `index.html` (záložky jako `<a role="tab" href="#eet|#osvc">` místo tlačítek), `osvc-app.js` (přepínání jen přes `hashchange`, mezerník aktivuje záložku), `styles.css` a `tools/e2e-osvc.mjs` (regresní test se zpomaleným `rules.json`). Řeší ztracený klik na záložku před načtením skriptu, žádný z nálezů této revize. V prohlížeči ověřeno, že `#osvc` otevře kalkulačku a klik na „Mám EET?“ vrátí průvodce. Doporučení: nic ke sloučení, větev lze smazat.

## Co se nepodařilo ověřit a předpoklady
- **Úřední tabulka paušálních záloh 2027** – financnisprava.gov.cz k 5. 11. 2026 uvádí jen rok 2026 (9 162 / 16 745 / 27 139 Kč); hodnota 1. pásma je dopočet ze zákona (9 661 Kč) proti dopočtu aplikace (9 662 Kč). Po zveřejnění tabulky nález EET-03 přehodnotit.
- **Částky ČSSZ a VZP pro 2027** (5 281 / 1 660 / 3 488 Kč) – ČSSZ zveřejňuje jen 2026; vzp.cz je z prostředí nedostupný. Hodnoty jsou dopočet ze zákona a NV 177/2026 Sb. (shoda s rejstříkem).
- **Odkaz na EPO** (`https://adisspr.mfcr.cz/...`, `rules.json:815`) – proxy odmítá spojení (CONNECT 403), funkčnost neověřena; ostatních 32 URL vrací HTTP 200 (e-sbirka.gov.cz jen JS kostru, obsah se skládá v prohlížeči). Kotvy na eet.gov.cz (8) existují.
- **Postup podle zadání** (tabulka ověřených hodnot a schválení před kódem, ruční průchod 7 scénářů) nelze zpětně ověřit; v repozitáři je volitelný Playwright skript, který jsem nespouštěl (nahrazen vlastním puppeteer scénářem).
- **Rozhodná částka u vedlejší činnosti** – posuzuji „příjem“ jako daňový základ (zisk) stejně jako aplikace a rejstřík DP-68; dílčí příjmy ze zaměstnání aplikace neřeší (mimo rozsah zadání).
- **Předpoklady:** OSVČ s daňovým zvýhodněním má nárok na celý rok; dítě bez ZTP/P; výdajový paušál platí pro 100 % příjmů (aplikace i můj výpočet mimo případ O29); EET OFF v kalkulačce OSVČ se posuzuje podle zadaných příjmů jako příjmů roku 2026 (aplikace to uvádí v poznámce).
- **Lokalizace prohlížeče:** test desetinné čárky běžel s `--lang=cs-CZ` i `en-US`; headless Chromium v obou hlásil `navigator.language = en-US`, pro tuto aplikaci to ale nerozhoduje – žádné pole není `type="number"` (všechna `type="text" inputmode="numeric"`, `app.js:74, 197`, `osvc-app.js:104`), hodnota v poli zůstala v obou bězích přesně taková, jak byla zadána.
- Testovací vstupy jsou smyšlené; do repozitáře aplikace jsem nic nezapisoval, skripty běžely z `docs/revize/.../skripty/` a `/tmp/revize/scratch/mam-eet/`.
