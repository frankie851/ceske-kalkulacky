# Revize: Spot, nebo fix? (`frankie851/spot-nebo-fix`)
Revidovaný commit: `1c1f7b2613e0a5a37fdf9bfee426749a2f31c36e` (5. 11. 2026) · živý web: https://frankie851.github.io/spot-nebo-fix/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Výpočetní jádro je správné: nezávislý přepočet od nuly se s modulem `calc.js` shoduje na haléř ve všech příkladech zadání i ve vlastních případech (ČEZ D02d 3 MWh, EG.D D56d 9 MWh, PRE D25d 2 MWh, posun 0–30 %, dny změny času, přestupný rok, svátky, pásma dynamického tarifu pro všech 35 040 čtvrthodin) a obrazovka ukazuje totéž co modul. Nejvážnější jsou dvě chybná pravidla v `tariffs.json`: sazby D45d/D56d/D57d jsou přiřazené k třídě TDD6 místo TDD7 (a D61d k TDD7 místo TDD4) podle přílohy č. 6 vyhlášky č. 408/2015 Sb. – u předvolby „Dům s tepelným čerpadlem“ to podhodnocuje spot a dynamický tarif asi o 500 Kč/rok – a víkendová sazba D61d má vymyšlené okno nízkého tarifu místo úředního „pátek 12:00 – neděle 22:00“ (regulované složky nižší o ~1 073 Kč/rok při 2 MWh). Dobře: regulované ceny 2026 a pásma ČEZ souhlasí s ERÚ a ceníkem, CSV zůstává v prohlížeči, žádné cizí požadavky kromě Chart.js, axe 0 nálezů, mobil bez přetékání, testy 17/17 včetně všech příkladů zadání.
Nálezy: Kritická 0 · Vysoká 2 · Střední 6 · Nízká 6

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | SPOT-01 |
| 2 Výpočty | 🟢 | SPOT-10 (nízká; výpočet sám se shoduje, chyby jsou v pravidlech – SPOT-01/02) |
| 3 Shoda se zadáním | 🟡 | SPOT-07 |
| 4 Testy | 🟡 | SPOT-06 |
| 5 Mobil a přístupnost | 🟡 | SPOT-04 |
| 6 Texty a citlivá témata | 🟡 | SPOT-03 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | SPOT-11 (nízká) |

## Pravidla
| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| DPH | `tariffs.json` `vat.value` 0,21; `calc.js:281` × (1 + vat) na všechny složky | 21 % | FD-30 (§ 47 z. 235/2004 Sb.) | 5. 11. 2026 | shoda |
| Daň z elektřiny | `common.electricityTax` 28,30 Kč/MWh | 28,30 Kč/MWh | FD-31 (z. 261/2007 Sb. část 47 § 6) | 5. 11. 2026 | shoda |
| Systémové služby 2026 | `common.systemServices` 164,24 Kč/MWh | 164,24 Kč/MWh | FD-32 (CV ERÚ 13/2025) | 5. 11. 2026 | shoda |
| Nesíťová infrastruktura | `common.nonNetworkInfra` 12,87 Kč/měs. | 8,87 + 4,00 = 12,87 Kč/OM/měs. | FD-33 (CV 13/2025 bod 6.2, NV 392/2015 Sb.) | 5. 11. 2026 | shoda |
| POZE 2026 | `common.poze` 495 Kč/MWh vs. 0 Kč/A; `calc.js:276–279` min(…) → 0 Kč | 0 Kč (CV 15/2025: 0 Kč/A/měs., platí nižší výpočet) | FD-34 | 5. 11. 2026 | shoda; v UI nikde nevysvětleno (SPOT-03) |
| Distribuce D02d (VT, 8 pásem jističe, 3 distributoři) | `distributors.*.sazby.D02d` | ČEZ 2 078,58 / EG.D 2 295,34 / PRE 1 516,53; jističe 102…644 / 100…629 / 87…546 | FD-35 (CV ERÚ 14/2025, ERV 18/2025) | 5. 11. 2026 | shoda (27 hodnot) |
| Distribuce D57d | `sazby.D57d` | VT 754,77 / 749,87 / 421,52; NT 116,50 / 224,30 / 175,20; jističe 222…1 949 / 189…1 619 / 154…1 433 | FD-36 | 5. 11. 2026 | shoda (42 hodnot) |
| Distribuce D01d, D25d, D26d, D27d, D35d, D45d, D56d, D61d | `sazby.*` | ceník ČEZ Prodej = CV 14/2025 (D25d ověřeno proti CV; D61d ověřeno 5. 11. 2026: VT 3 306,67 / 3 367,23 / 2 343,05, NT 116,50 / 224,30 / 175,20, jističe 89…563 / 90…565 / 64…404) | FD-37; CV 14/2025 „Sazba D 61d“ https://eru.gov.cz/sites/default/files/obsah/prilohy/erv182025.pdf | 5. 11. 2026 | shoda |
| Příklady zadání (2 515,08; 140,97; 913,27 s DPH) | test 1, `tariffs.json` | 2 078,58 × 1,21 = 2 515,08 atd. | FD-45 | 5. 11. 2026 | shoda |
| Pásma dynamického tarifu ČEZ (sezóny, prac. den/víkend+svátek, −50/−10/+10/+25 %, 3 900 Kč/MWh, 163,35 Kč/měs.) | `dynamic.json` | ceník ČEZ Prodej od 1. 6. 2026: „Duben až září“/„Říjen až březen“, „Pracovní dny“/„Víkendy a svátky“, 1 950/3 510/4 290/4 875 Kč/MWh | FD-39; PDF znovu přečteno 5. 11. 2026 | 5. 11. 2026 | shoda (moje pásma z PDF = `dynamic.json` pro všech 35 040 čtvrthodin) |
| 15min ceny OTE, 92/100 čtvrthodin | `update-data.mjs`, `calc.js:52`; `prices.json` | OTE: 29. 3. 2026 92 period, 25. 10. 2026 100 | FD-40, FD-41 | 5. 11. 2026 | shoda (vlastní mřížka = modul, 0 rozdílů) |
| Kurz ČNB: víkend/svátek = poslední vyhlášený | `update-data.mjs:243–249`, `fx.json` | ČNB vyhlašuje v pracovní dny | sekce Datové řady rejstříku | 5. 11. 2026 | shoda (52/52 sobot = pátek; 17. 11. 2025 a 1. 1. 2026 = předchozí kurz) |
| Normalizované TDD 2025/2026, 11 řad, součet 1 | `data/tdd/*.json`, `calc.js:131` | OTE `Normalizovane_TDD_15MIN_*_CZ.zip` | FD-42, Datové řady | 5. 11. 2026 | shoda |
| **Přiřazení sazeb k třídám TDD** | `tariffs.json` `sazbyInfo`: D35d/D45d/D56d/D57d → TDD6, D61d → TDD7 | příloha č. 6 vyhl. 408/2015 Sb.: 4 = D01d, D02d, **D61d**; 5 = D25d, D26d, D27d; 6 = **D35d**; 7 = **D45d, D57d, D56d** | https://www.zakonyprolidi.cz/cs/2015-408 (znění od 1. 9. 2026), potvrzeno https://e-sbirka.gov.cz/sb/2015/408/2026-09-01 | 5. 11. 2026 | **NESHODA** (SPOT-01) |
| **Okno NT sazby D61d** | `ntHours.D61d`: prac. den 0–6 a 22–24 h, víkend a svátek celý den | „Doba platnosti nízkého tarifu je stanovena celoročně od pátku 12.00 hodin do neděle 22.00 hodin.“ | CV ERÚ 14/2025, „Sazba D 61d – Podmínky uplatnění“ (erv182025.pdf) | 5. 11. 2026 | **NESHODA** (SPOT-02) |
| Délka NT ostatních dvoutarifů | `ntHours`: D25d/D26d/D27d 8 h, D35d 16 h, D45d/D57d 20 h, D56d 22 h; popisky „D35d – akumulace 16 h“, „D56d – tepelné čerpadlo 22 h“ | CV 14/2025: D25d/D26d 8 h; D27d 8 h „v době od 18.00 do 8.00“; **D35d 20 h** (16 h jen přechodně při technické úpravě elektroměru); D45d/D57d 20 h; **D56d 20 h** („snížení … z 22 hodin na 20 hodin u sazeb C 56d a D 56d“) | tamtéž; FD-43 | 5. 11. 2026 | částečně: D35d, D56d a okno D27d (13–15 h) neodpovídají 2026 (SPOT-05) |
| Svátky (víkendový režim pásem a NT) | `calc.js:68–73` | § 1 a § 2 zákona č. 245/2000 Sb.: 1. 1., Velký pátek, Velikonoční pondělí, 1. 5., 8. 5., 5. 7., 6. 7., 28. 9., 28. 10., 17. 11., 24.–26. 12. | https://www.zakonyprolidi.cz/cs/2000-245 (FD-44 dosud neověřeno) | 5. 11. 2026 | shoda (2026 i 2027) |
| Regulované ceny 2026 i pro 11–12/2025 | patička, README | pro 2025 platily jiné ceny (CV 2024) | FD-38, Rozdíly 9 | 5. 11. 2026 | dokumentované zjednodušení (SPOT-09) |

## Nezávislý přepočet
Skripty: `dukazy/skripty/spot-nebo-fix-prepocet.mjs` (od nuly, bez kódu aplikace; čte jen datové řady OTE/ČNB/TDD, jejichž vzorky rejstřík ověřil), `spot-nebo-fix-porovnani.mjs` (modul `calc.js` volaný jako v `app.js`), výstup `dukazy/spot-nebo-fix/prepocet.txt` (51 řádků, 46 shod; 5 neshod jsou právě nálezy SPOT-01 a SPOT-02), obrazovka `dukazy/spot-nebo-fix/prohlizec.json`. Částky vč. DPH.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| zadání: fix bez stálých plateb | 3 MWh × (3 000 + 2 515,08) | 16 545,24 Kč | 16 545,24 Kč | — | ano |
| zadání: spot silová elektřina | 2 × 0,5 MWh, 100 a 0 EUR, kurz 25 | 1 250,00 Kč | 1 250,00 Kč | — | ano |
| zadání: dyn. pásmo −50 % | 1 MWh, základ 3 900 | 1 950,00 Kč (½) | 1 950,00 Kč | — | ano |
| zadání: čtvrthodin ve dni | 29. 3. 2026 / 25. 10. 2026 / 26. 10. 2025 / 15. 6. 2026 / 28. 3. 2027 / 31. 10. 2027 | 92 / 100 / 100 / 96 / 92 / 100; mřížka 35 040 | totéž | — | ano |
| zadání: Σ TDD = 1 | 11 tříd | 1 ± 1e-9, délka 35 040 | totéž | — | ano |
| zadání: posun 0 % | V1 s/bez parametru | identické | identické | — | ano |
| zadání: posun nemění spotřebu | V1, posun 10/30/50 % | 3,000000000 MWh; spot 25 291,40 / 24 196,23 Kč; 50 % = 30 % | totéž | — | ano |
| vlastní V1: ČEZ D02d 3 MWh, 3×25 A, fix 3 000, marže 400, poplatky 163,35, dyn 3 900/163,35 | formulář | fix 23 108,36 · spot 25 838,99 · dyn 25 733,60 (energie 9 000,00 / 11 730,63 / 11 625,24; regul. 8 244,17; stálé 5 864,19) | totéž | 360 i 1 440 px: 23 108 · 25 839 · 25 734 Kč, „o 2 731 Kč méně než spot“ (`vysledek-360.png`, `vysledek-1440.png`) | ano |
| vlastní V1b: V1 + posun 30 % | posuvník 30 | spot 24 196,23 · dyn 24 382,61 · fix 23 108,36 | totéž | 24 196 · 24 383 · 23 108 Kč; „úspora 1 643 / 1 351 Kč“ | ano |
| vlastní V2: EG.D D56d 9 MWh, 3×25 A, fix 3 500, marže 400 (profil TDD6 = mapování aplikace, okna NT aplikace) | předvolba „Dům s tepelným čerpadlem“ + EG.D | fix 45 526,69 · spot 48 709,88 · dyn 48 476,33 | totéž | 45 527 · 48 710 · 48 476 Kč (`vysledek-tc-360.png`; načten `TDD6.json`) | ano (s chybným profilem) |
| vlastní V2z: totéž s profilem TDD7 (vyhláška) | — | fix 45 596,31 · spot 49 207,12 · dyn 48 932,92 (rozdíl +69,62 / +497,25 / +456,59 Kč; spot − fix 3 610,81 místo 3 183,19) | modul s TDD7 totéž | — | aplikace TDD7 pro D56d nepoužije (SPOT-01) |
| vlastní V2c: ČEZ D57d 9 MWh TDD6 vs. TDD7 | — | TDD6: 46 280,49 / 49 463,68 / 49 230,13; TDD7 +66,08 / +493,71 / +453,05 | totéž (TDD6) | — | ano / SPOT-01 |
| vlastní V3: PRE D25d (TDD5 Praha) 2 MWh, 1×25 A, fix 2 900, marže 300, poplatky 100/120 | — | 11 304,40 · 13 047,60 · 13 643,86 | totéž | — | ano |
| vlastní V4: ČEZ D61d 2 MWh, 3×25 A, fix 3 000, NT podle ERÚ (pá 12–ne 22) + TDD4 | — | 16 848,35 · 18 668,77 · 18 598,51 (regul. 5 448,80) | 15 775,42 · 17 577,82 · 17 516,89 (regul. 4 375,87; okna aplikace + TDD7) | — | **NE** (SPOT-02); s konfigurací aplikace se můj výpočet shoduje → chyba je v pravidle |
| vlastní: 0 MWh / 100 MWh / −1 MWh | — | 5 864,19 (jen stálé) / energie 300 000,00 / −3 000,00 | totéž | prázdná spotřeba → 0,1 MWh (6 439 Kč); 250 MWh přijato | ano; modul vstup nehlídá, UI jen částečně (SPOT-04) |
| vlastní: pásma dyn. 25. 10. 2026 (2:00 dvakrát), 29. 3. 2026, svátek 6. 7. 2026 6:00, prac. den 7. 7. 6:00, 12:00 zima/léto | — | 100 čtvrthodin, 8× hodina 2 → 3 510; 92; 4 290; 4 875; 3 510 / 1 950 | totéž; celoročně 0 rozdílů | — | ano |
| vlastní: přestupný rok 28. 2.–1. 3. 2028; svátky 2026/2027 | — | 288 čtvrthodin; 13 + 13 svátků, Velikonoce 5. 4. 2026 / 28. 3. 2027 | totéž | — | ano |
| vlastní: POZE min(…) s hypotetickými 8,32 Kč/A | 3 / 20 MWh, 3×25 A | 1 485 / 7 488 / 2026: 0 | totéž | — | ano |
| vlastní: CSV čísla a časy | „1 500,5“, „1.500,50“, „0,25“, „abc“; „5. 1. 2026 0:15“, ISO, „…Z“, „24:00“ | 1 500,5 / 1 500,5 / 0,25 / NaN; Z → 1:15 SEČ, 24:00 → další den | totéž | CSV se středníkem a čárkami: „naměřeno 1,02 MWh“ (očekáváno 1,018); chybný soubor: „V CSV jsem nenašel žádné řádky s časem a hodnotou.“ (`chyba-360.png`) | ano |
| vlastní: zadávání čísel (cs-CZ / en-US Chromium) | „3000,50“, „3 000“, „0,85“, prázdné, −500, „3,5“ MWh | — | — | cs-CZ: 3 000,50 → fix 23 110 Kč ✓, mezera se zahodí ✓; en-US: „3000,50“ → 300050 → fix 914 258 Kč, „0,85“ → 085, „3,5“ MWh → 35 MWh; prázdné/−500 → silová 0 Kč a „fix nejlevnější“; nikde žádná hláška (`vstup-carka-360.png`) | SPOT-04, SPOT-08 |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: statický web, 3 varianty na cenách posledních 12 měsíců, nejlevnější + rozdíl, vliv přesunu spotřeby | splněno | `index.html:121–137`, `app.js:160–188`, `vysledek-360.png` |
| Čisté HTML+CSS+JS (ES moduly), Chart.js z cdnjs | splněno | `index.html:9–10`; síť: jediný cizí požadavek cdnjs (`prohlizec.json`) |
| Výpočty v `calc.js` bez vazby na DOM | splněno | `calc.js` běží v Node (`prepocet.txt`), žádný `document`/`window` |
| `scripts/update-data.mjs` stahuje 15min ceny OTE, kurzy ČNB, TDD → `data/*.json`; web nevolá OTE/ČNB | splněno | `update-data.mjs:23–29`, běh nanečisto v rejstříku (Datové řady); síť bez OTE/ČNB |
| GitHub Action denně commitne změněná data | částečně | `update-data.yml` (cron 15:37 UTC); na GitHubu jen 3 ruční běhy, plánovaný ještě neproběhl, `git log -- data/` = jediný commit 5. 11. 2026 (SPOT-11) |
| `tariffs.json` podle distributora a sazby (D01d…D61d), každá položka se zdrojem a rokem | částečně | sazby i D27d/D35d navíc; zdroj distribuce jen ceník ČEZ, ne CV ERÚ 14/2025; přiřazení TDD a okna NT chybná (SPOT-01, 02, 05) |
| `dynamic.json` s pásmy (časy a %), rozšiřitelné | splněno | `dynamic.json` `products`, shoda s ceníkem ČEZ |
| Testy `node --test` nad `calc.js` | splněno | `testy.txt` 17/17 |
| Spotřeba = roční × normalizovaný TDD, bez teplotního přepočtu, zjednodušení v patičce | splněno (profil pro D45d/D56d/D57d/D61d z nesprávné třídy) | `calc.js:138`, `index.html:158`; SPOT-01 |
| Volitelné CSV s průběhovým měřením, mapování sloupců v UI | splněno | `index.html:95–118`, `app.js:282–333`, `prohlizec.json` csv |
| Spot = Σ spotřeba × (EUR × kurz ČNB) + marže + distribuce + stálé platby + daň + DPH | splněno | `calc.js:250–257, 272–282`; V1 shoda |
| Fix = spotřeba × cena + stejné regulované složky | splněno | V1, Z1 |
| Dynamický tarif = spotřeba v pásmu × základ × (1 + odchylka) | splněno | `calc.js:261`, Z3, V8 |
| Posuvník 0–30 %, roční spotřeba se nemění | splněno | `index.html:134`, Z6/Z7, obrazovka 30 % |
| Vše vč. DPH a napsáno u výsledku | splněno | odznak „vč. DPH 21 %“, text karet, patička |
| Obrazovka 1 formulář (distributor, sazba, MWh, jistič, typ domácnosti → TDD, fix, marže) | splněno | `index.html:21–119` |
| Obrazovka 2 tři karty, nejlevnější zvýrazněná, rozdíl v Kč | splněno | `vysledek-360.png` |
| Obrazovka 3 graf měsíčních nákladů | splněno | `app.js:194–209` |
| Obrazovka 4 graf průměrné spotové ceny podle hodiny vs. spotřeba | splněno | `app.js:211–238` |
| Obrazovka 5 patička: „Orientační výpočet, nejde o nabídku dodavatele“, datum dat, zjednodušení, zdroje | splněno (bez data ověření regulovaných cen) | `index.html:152–176`; SPOT-03 |
| Kritéria: 5 testovacích případů zadání | splněno | testy 1, 2, 4, 6, 7, 10, 11 (`testy.txt`), přepočet Z1–Z7 |
| `update-data.mjs` doběhne a vytvoří platná data za 12 měsíců | splněno | rejstřík Datové řady (běh nanečisto, bitově shodná data) |
| Web na 360 px bez vodorovného posuvníku | splněno | přetékání 360/360 ve všech stavech |
| Nahrané CSV zůstává v prohlížeči | splněno | jen GET, 12 požadavků před i po nahrání (`prohlizec.json` csv.sit) |
| README česky: spuštění, ruční aktualizace, úprava `tariffs.json` na nový rok | splněno | `README.md` |
| Postup: porovnat jeden výsledek s ceníkem dodavatele | splněno | test 17 (dyn. tarif vs. ceník ČEZ D02d/D25d) |

## Nálezy
### SPOT-01 · Vysoká · 1 Pravidla a data · Sazby D45d/D56d/D57d počítají s TDD6 místo TDD7, D61d s TDD7 místo TDD4
- **Kde:** `tariffs.json:305–324` (`sazbyInfo.D45d/D56d/D57d.tdd = "TDD6"`, `D61d.tdd = "TDD7"`), komentář `scripts/update-data.mjs:31`, `README.md` Zjednodušení („D35d/D45d/D56d/D57d → TDD6, D61d → TDD7“)
- **Reprodukce:** předvolba „Dům s tepelným čerpadlem“ (D56d, 9 MWh), EG.D, fix 3 500, marže 400 → očekáváno podle přílohy č. 6 vyhlášky č. 408/2015 Sb. (třída 7 = „D45d; D57d“ a „D56d“, třída 4 = „D01d; D02d; D61d“, třída 6 = „D35d“; zakonyprolidi.cz znění od 1. 9. 2026, potvrzeno e-sbirka.gov.cz) profil TDD7: spot 49 207 Kč, dyn 48 933 Kč, fix 45 596 Kč → skutečnost (načten `TDD6.json`, `prohlizec.json` V2-360): spot 48 710 Kč, dyn 48 476 Kč, fix 45 527 Kč. Spot a dynamický tarif podhodnocené o 497 a 457 Kč/rok, rozdíl spot − fix 3 183 místo 3 611 Kč (ČEZ D57d: +494 / +453 Kč). Stejné pro D45d; D61d dostává profil přímotopů místo profilu domácnosti bez vytápění.
- **Dopad na uživatele:** domácnosti s tepelným čerpadlem a přímotopem (jedna ze čtyř předvoleb) vidí spot a dynamický tarif o ~1 % levnější, než by podle úředního profilu vyšly; při těsném srovnání to může převážit volbu.
- **Doporučená oprava:** v `sazbyInfo` nastavit D45d/D56d/D57d → TDD7, D61d → TDD4 (D35d zůstává TDD6), opravit komentář v `update-data.mjs`, README a nápovědu; přidat test, který mapování porovná s přílohou 6 (D01d/D02d/D61d → 4, D25d/D26d/D27d → 5, D35d → 6, D45d/D56d/D57d → 7).
- **Ověření:** reprodukováno 2× (zakonyprolidi + e-Sbírka; přepočet `prepocet.txt` V2/V2z a obrazovka `prohlizec.json`) · skeptik:

### SPOT-02 · Vysoká · 1 Pravidla a data · Víkendová sazba D61d má nízký tarif i ve všední dny, úředně platí jen pátek 12:00 – neděle 22:00
- **Kde:** `tariffs.json:554–571` (`ntHours.D61d`: workday `[0,6],[22,24]`, weekend `[0,24]`), `calc.js:182–185` (`ntMaskFor` + víkend = i svátek)
- **Reprodukce:** ČEZ Distribuce, D61d, 2 MWh, 3×25 A, fix 3 000 → očekáváno podle CV ERÚ 14/2025 „Sazba D 61d – Podmínky uplatnění: Doba platnosti nízkého tarifu je stanovena celoročně od pátku 12.00 hodin do neděle 22.00 hodin“ (erv182025.pdf; VT 3 306,67, NT 116,50 Kč/MWh bez DPH) → regulované složky 5 448,80 Kč, celkem fix 16 848 Kč, spot 18 669 Kč, dyn 18 599 Kč → skutečnost modulu (NT 54,7 % čtvrthodin místo 34,7 %, ve všední den 8 h NT, v neděli večer i o svátcích NT): regulované 4 375,87 Kč, fix 15 775 Kč, spot 17 578 Kč, dyn 17 517 Kč (`prepocet.txt` V4). Podhodnocení 1 073 Kč/rok u všech tří variant (nemění pořadí).
- **Dopad na uživatele:** uživatel s víkendovou sazbou (chaty, chalupy) dostane roční náklady o ~6 % nižší, než zaplatí; patička to kryje jen obecnou větou o HDO, ale u D61d okno neurčuje HDO, nýbrž cenový výměr.
- **Doporučená oprava:** okno D61d odvodit z dne v týdnu (pá od 12:00, so celý den, ne do 22:00, svátky bez vlivu) – `ntHours` dnes umí jen „pracovní den / víkend“, takže buď rozšířit formát o den v týdnu, nebo D61d řešit zvláštní větví v `ntMaskFor`; přidat test.
- **Ověření:** reprodukováno 2× (přepočet ve dvou procesech – `prepocet.mjs` a `porovnani.mjs`; úřední text CV 14/2025) · skeptik:

### SPOT-03 · Střední · 6 Texty a citlivá témata · Chybí datum ověření regulovaných cen, odkaz na CV ERÚ 14/2025 a vysvětlení nulového POZE
- **Kde:** `index.html:155, 166–175` (patička: „Regulované ceny: 2026“, zdroje), `tariffs.json:593–598, 748–753, 902–907` (`source` jen ceník ČEZ Prodej), `README.md` „Zdroje dat“
- **Reprodukce:** patička → očekáváno viditelné datum, ke kterému byly distribuční ceny a pásma ověřeny, odkaz na cenový výměr ERÚ č. 14/2025 (ERV 18/2025), z něhož ceny pocházejí, a poznámka, že platba POZE je v roce 2026 0 Kč (CV 15/2025) → skutečnost: jen rok 2026 a datum aktualizace dat OTE; distribuce se opírá výhradně o ceník dodavatele ČEZ Prodej; karta „Distribuce, daň a poplatky“ POZE nerozepisuje a uživatel s cenou 495 Kč/MWh nic nenajde.
- **Dopad na uživatele:** nelze poznat, zda jsou regulované ceny aktuální, a laik může nulové POZE považovat za chybu nebo naopak nečekat jeho návrat v roce 2027.
- **Doporučená oprava:** do `tariffs.json` přidat `verifiedAt` a zobrazit v patičce; k distribuci doplnit zdroj CV ERÚ 14/2025 s URL; do Zjednodušení větu „POZE je podle CV ERÚ 15/2025 v roce 2026 0 Kč“.
- **Ověření:** reprodukováno 2× (soubor i živý web) · skeptik:

### SPOT-04 · Střední · 5 Mobil a přístupnost · Žádná kontrola platnosti vstupu ani chybová hláška: prázdná či záporná cena dává 0 Kč a „fix nejlevnější“, spotřeba nad maximem se přijme
- **Kde:** `app.js:47–50` (`num()` vrací 0 pro NaN i záporné), `app.js:141` (`Math.max(0.1, …)`), `index.html:54, 66, 70` (`min`/`max`/`step`, formulář `novalidate`, žádný prvek pro hlášky)
- **Reprodukce:** V1, pak smazat fixní cenu nebo zadat −500 → očekáváno upozornění „zadejte cenu“ a pozastavení výsledku → skutečnost: karta Fixní cena 14 108 Kč, „Silová elektřina 0 Kč“, zvýrazněno „Nejlevnější“, souhrn „Nejlevněji vychází fixní cena“; spotřeba 250 MWh (max 100) i prázdná spotřeba (→ 0,1 MWh, 6 439 Kč) projdou bez hlášky; `chyboveHlasky: []` (`prohlizec.json` vstup-cs-CZ).
- **Dopad na uživatele:** překlep nebo nedopsaná hodnota okamžitě vyrobí sebejisté doporučení s nesmyslnou částkou, bez jakéhokoli varování.
- **Doporučená oprava:** po každé změně ověřit `validity` (badInput, rangeUnderflow/Overflow, valueMissing) a prázdnou/zápornou cenu; při chybě zobrazit hlášku u pole (`aria-describedby`) a karty neaktualizovat nebo označit „neúplné zadání“.
- **Ověření:** reprodukováno 2× (cs-CZ i en-US běh) · skeptik:

### SPOT-05 · Střední · 1 Pravidla a data · Délky nízkého tarifu D35d (16 h) a D56d (22 h) a okno D27d neodpovídají podmínkám 2026
- **Kde:** `tariffs.json:305–315` (popisky „D35d – akumulace 16 h“, „D56d – tepelné čerpadlo 22 h“), `tariffs.json:372–393, 394–431, 478–507` (`ntHours.D27d` 0–6 + 13–15 h, `D35d` 16 h, `D56d` 22 h), `app.js:26` (nápověda „D56d (22 h nízkého tarifu)“)
- **Reprodukce:** CV ERÚ 14/2025: D35d „nízkého tarifu po dobu 20 hodin“ (16 h jen přechodně, je-li změna „podmíněna technickými úpravami elektroměru“), D56d „po dobu 20 hodin“ a odůvodnění „snížení počtu hodin nízkého tarifu z 22 hodin na 20 hodin u sazeb C 56d a D 56d“, D27d „minimálně 8 hodin denně v době od 18.00 hodin do 8.00 hodin“ → aplikace: D35d 16 h, D56d 22 h, D27d 2 h NT v 13–15 h, což podmínky vylučují. Při 9 MWh D56d jde o řádově stovky Kč/rok na regulovaných složkách (shodně u všech variant).
- **Dopad na uživatele:** popisky sazeb jsou pro rok 2026 nepravdivé a regulovaná část je u D56d podhodnocená, u D35d nadhodnocená; pořadí variant se nemění.
- **Doporučená oprava:** D35d a D56d převést na 20 h (sjednotit s D45d/D57d), D27d okno posunout do 18–8 h, přepsat popisky a nápovědu; ve Zjednodušení uvést, že délky odpovídají CV ERÚ 14/2025.
- **Ověření:** reprodukováno 2× (text CV 14/2025 na dvou místech – podmínky sazby a odůvodnění) · skeptik:

### SPOT-06 · Střední · 4 Testy · Chybí testy pravidel, která se v revizi ukázala chybná, a propojení formuláře
- **Kde:** `test/calc.test.js` (17 testů)
- **Reprodukce:** testy pokrývají všech pět příkladů zadání, DST, svátky, posun, CSV a shodu dyn. tarifu s ceníkem (D02d, D25d). Netestuje se: přiřazení sazeb k třídám TDD (SPOT-01 by test odhalil), okna NT proti podmínkám CV (SPOT-02/05), `regulatedFor` pro pásma jističe a `1x25`, parsování vstupů v `app.js` (`num()`), extrapolace CSV z krátkého období, chování při prázdném/záporném vstupu. Žádný test nekonzervuje špatnou hodnotu.
- **Dopad na uživatele:** nepřímý – chyby v datových pravidlech se do výsledku dostanou bez varování.
- **Doporučená oprava:** test mapování TDD podle přílohy 6, test D61d (pá 12:00 NT, čt 3:00 VT, ne 23:00 VT), test počtu hodin NT za den pro každou sazbu, test `regulatedFor` pro všech 9 jističů, a jednoduchý test parsování čísel vyčleněný z `app.js`.
- **Ověření:** reprodukováno 2× (čtení testů, `testy.txt`) · skeptik:

### SPOT-07 · Střední · 3 Shoda se zadáním · Zdroj distribučních cen je jen ceník dodavatele, zadání žádá položky se zdrojem
- **Kde:** `tariffs.json:593–598` a dále (`distributors.*.source` = ceník ČEZ Prodej), `README.md` tabulka „Zdroje dat“ (jen CV 13/2025 a 15/2025)
- **Reprodukce:** zadání: „každá položka se zdrojem a rokem“ → hodnoty se shodují s CV ERÚ 14/2025 (rejstřík FD-35–37), ale výměr není nikde uveden; při změně ceníku ČEZ (např. 1. 6. 2026 se měnila obchodní část) se ztrácí stopa k úřední ceně distribuce.
- **Dopad na uživatele:** zdroj v patičce odkazuje na dodavatele, ne na regulátora – nelze si regulované ceny ověřit.
- **Doporučená oprava:** doplnit `source`/`url` na CV ERÚ 14/2025 (ERV 18/2025) a nechat ceník ČEZ jako sekundární kontrolu.
- **Ověření:** reprodukováno 2× · skeptik:

### SPOT-08 · Střední · 5 Mobil a přístupnost · V prohlížeči s jinou než českou lokalizací se desetinná čárka zahodí a výsledek se tiše zvětší stokrát
- **Kde:** `index.html:54, 66, 70` (`<input type="number">`), `app.js:47–50`
- **Reprodukce:** Chromium `--lang=en-US`, pole „Fixní cena“ napsat `3000,50` → očekáváno 3 000,50 nebo hláška → skutečnost hodnota `300050`, karta Fixní cena 914 258 Kč, „o 888 525 Kč dráž“ (`vstup-carka-360.png`); `0,85` → `085`; spotřeba `3,5` → 35 MWh (207 046 Kč). V Chromiu `--lang=cs-CZ` prohlížeč čárku přijme (3000.50 → 23 110 Kč) a mezera v „3 000“ se zahodí v obou lokalizacích. Chyba se tedy projeví jen u uživatelů s anglickým (ne-českým) prohlížečem; `calc.js` přitom má `parseNumber()`, který českou čárku umí.
- **Dopad na uživatele:** Čech s anglickým prohlížečem (běžné u firemních notebooků a telefonů) dostane bez varování absurdní srovnání.
- **Doporučená oprava:** buď `type="text" inputmode="decimal"` a `parseNumber()` z `calc.js`, nebo u `type="number"` kontrolovat `validity.badInput` a zobrazit hlášku (viz SPOT-04).
- **Ověření:** reprodukováno 2× (samostatný test lokalizací a hlavní scénář) · skeptik:

### SPOT-09 · Nízká · 1 Pravidla a data · Regulované ceny 2026 a nulové POZE se používají i na listopad a prosinec 2025
- **Kde:** `README.md` Zjednodušení, `index.html:160`
- **Reprodukce:** data 1. 11. 2025 – 31. 10. 2026, ceny distribuce a POZE 0 Kč podle CV 2026 → pro 11–12/2025 platily jiné ceny (rejstřík FD-38, Rozdíly 9). Dokumentované; dopad stejný u všech tří variant, pořadí se nemění.
- **Dopad na uživatele:** absolutní roční částka neodpovídá tomu, co by za 12 měsíců skutečně zaplatil; uživatel je upozorněn.
- **Doporučená oprava:** ponechat, případně v patičce doplnit „zejména POZE bylo v roce 2025 nenulové“.
- **Ověření:** reprodukováno 2× · skeptik:

### SPOT-10 · Nízká · 2 Výpočty · Krátké CSV se extrapoluje na celý rok a přepíše roční spotřebu nereálnou hodnotou
- **Kde:** `calc.js:433–437` (`scale = measured / tddCovered`), `app.js:139, 312–316`
- **Reprodukce:** CSV se dvěma lednovými dny (1,02 MWh) → pole „Roční spotřeba“ se uzamkne na 168,60 MWh, karty 974 966 / 1 127 287 / 1 121 973 Kč; stav hlásí „pokrývá 1 % čtvrthodin … výsledek je jen hrubý odhad“ (`prohlizec.json` csv). Po „Zpět na TDD“ se do spotřeby vrátí předvolba 3,5 místo uživatelových 3 MWh (`chyba-360.png`).
- **Dopad na uživatele:** matoucí částky u částečných exportů; varování existuje, ale číslo v poli vypadá jako údaj.
- **Doporučená oprava:** pod určité pokrytí (např. < 10 %) měření nepoužít a říct proč; „Zpět na TDD“ vrátit poslední hodnotu zadanou uživatelem.
- **Ověření:** reprodukováno 2× · skeptik:

### SPOT-11 · Nízká · 8 Nasazení a větve · Denní workflow zatím běžel jen ručně; plánovaný běh a nasazení po commitu bota neověřeno
- **Kde:** `.github/workflows/update-data.yml`, GitHub Actions
- **Reprodukce:** `git log -- data/` → jediný commit 4557a8e (5. 11. 2026 00:38 UTC); stránka Actions ukazuje 3 běhy „Aktualizace dat“ spuštěné ručně (14 s, 17 s, 56 s) a 3 „pages build and deployment“, stav běhů stránka bez přihlášení neukazuje; plánovaný běh (15:37 UTC) do doby revize neproběhl. GitHub plánované workflow po 60 dnech bez aktivity v repozitáři vypne.
- **Dopad na uživatele:** riziko, že se data po skončení měsíce nestáhnou a web zůstane u října 2026, aniž by to kdo poznal (patička datum ukazuje, takže ne tiše).
- **Doporučená oprava:** po prvním plánovaném běhu zkontrolovat stav a to, že se po commitu bota spustí nasazení Pages; zvážit odznak stavu workflow v README.
- **Ověření:** reprodukováno 2× (git log, stránka Actions) · skeptik:

### SPOT-12 · Nízká · 6 Texty a citlivá témata · Popis posunu „do 4 nejlevnějších hodin“ vs. „16 nejlevnějších čtvrthodin“
- **Kde:** `index.html:162`, `README.md` Zjednodušení, `calc.js:203–221`
- **Reprodukce:** kód přesouvá do 16 nejlevnějších čtvrthodin dne (nemusí tvořit 4 celé hodiny, u spotu se vybírají zpětně podle skutečných cen); patička říká „4 nejlevnějších hodin“.
- **Dopad na uživatele:** drobná nepřesnost; úspora je navíc optimistická (znalost cen dopředu), což patička neříká.
- **Doporučená oprava:** sjednotit text („16 nejlevnějších čtvrthodin“) a doplnit „při znalosti cen daného dne“.
- **Ověření:** reprodukováno 2× · skeptik:

### SPOT-13 · Nízká · 8 Nasazení a větve · Chybějící favicon (404 v konzoli lokálně i na živém webu)
- **Kde:** `index.html` (bez `<link rel="icon">`), živý web `https://frankie851.github.io/favicon.ico` → 404
- **Reprodukce:** každé načtení stránky → jediná chyba v konzoli „Failed to load resource: 404“ (`uvod-kontrola.json`, `zivy-kontrola.json`).
- **Dopad na uživatele:** žádný funkční, jen šum v konzoli.
- **Doporučená oprava:** přidat `<link rel="icon" href="data:,">` nebo SVG ikonu.
- **Ověření:** reprodukováno 2× · skeptik:

### SPOT-14 · Nízká · 5 Mobil a přístupnost · Pořadí Tab po výpočtu začíná u rozbalovačů a odkazů, fokus je ale všude vidět
- **Kde:** `index.html` (pořadí prvků), `styles.css` (`:focus-visible`)
- **Reprodukce:** 360 px, po vyplnění formuláře Tab projde: Další nastavení → CSV → posuvník → 7 odkazů v patičce → formulář (`prohlizec.json` V1-360.tab); všech 17 prvků má viditelný fokus; axe 0 nálezů ve všech stavech (úvod, výsledek, živý web).
- **Dopad na uživatele:** klávesnicový uživatel se k výsledkovým kartám dostane jen čtečkou (karty nejsou fokusovatelné, mají `aria-live`), funkčně bez ztráty.
- **Doporučená oprava:** není nutná; případně přidat přeskakovací odkaz na výsledek.
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
žádné (`git branch -r`: jen `origin/main`).

## Co se nepodařilo ověřit a předpoklady
- **Stav běhů GitHub Actions** (úspěch/neúspěch) – API i stránka s detaily jsou ze session nedostupné (403, odznak 404); vidět je jen seznam 3 ručních běhů. Plánovaný běh (15:37 UTC) v době revize ještě nenastal.
- **Druhý nezávislý zdroj k oknu D61d** – ověřeno jen v CV ERÚ 14/2025 (podmínky sazby); web ČEZ Distribuce není ze session dostupný (DNS). Ceník ČEZ Prodej časy NT neuvádí.
- **Skutečná okna HDO** pro D25d/D27d/D35d/D45d/D56d/D57d – úředně nejsou dána (jen délka a omezení); ve vlastním přepočtu jsem pro srovnání použil okna aplikace jako předpoklad a ověřil jen délky a podmínky z CV 14/2025.
- **Datové řady** (ceny OTE, kurzy ČNB, TDD) – znovu jsem je nestahoval; spoléhám na vzorky ověřené v rejstříku (sekce Datové řady, bitově shodný běh nanečisto). Můj přepočet je čte ze souborů aplikace.
- **Chování `type=number` v jiných prohlížečích** (Firefox, Safari) – testováno jen Chromium 1243 s `--lang=cs-CZ` a `--lang=en-US`; v jiných prohlížečích se zacházení s čárkou může lišit.
- **Nasazení Pages po commitu `github-actions[bot]`** – nelze doložit, dokud workflow nezmění data (první změna nastane po skončení listopadu 2026).
- **Testovací vstupy** jsou smyšlené (3 MWh, 9 MWh, ceny 3 000/3 500 Kč/MWh), CSV je vygenerované.
