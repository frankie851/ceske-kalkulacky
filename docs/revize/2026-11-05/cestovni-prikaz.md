# Revize: Cestovní příkaz 2027 (`frankie851/cestovni-prikaz`)
Revidovaný commit: `bb4e5801f25eae6d24d5253474527300cd4d59d1` (5. 11. 2026) · živý web: https://frankie851.github.io/cestovni-prikaz/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Opravit před sloučením
Sazby, ceny PHM včetně obou mimořádných změn v roce 2026, pásma stravného, krácení za jídla v obou sférách i zaokrouhlení částky k výplatě odpovídají vyhlášce č. 573/2025 Sb. a zákoníku práce; všech 8 příkladů ze zadání a 48 z 54 vlastních případů se shoduje s mým nezávislým přepočtem a oba scénáře v prohlížeči ukázaly totéž co modul. Nejvážnější jsou dvě mezery proti zákonu: cesta spadající do dvou kalendářních dnů se vždy dělí půlnocí, takže aplikace ukáže např. 0 Kč místo 155 Kč nebo 236 Kč místo 370 Kč stravného (ZP § 163 odst. 4), a navýšení sazby o 15 % za přívěs (ZP § 157 odst. 4, výslovný požadavek zadání) aplikace odmítá s nepravdivým textem, že pravidlo nešlo ověřit. Dobře je oddělený výpočetní modul s celočíselnou aritmetikou, správné zablokování roku 2027 bez vyhlášky, tisk na jednu stranu A4, žádné cizí požadavky, bezpečné vykreslení uživatelských textů a 0 nálezů axe ve všech stavech.
Nálezy: Kritická 0 · Vysoká 2 · Střední 4 · Nízká 6

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🔴 | CES-02 |
| 2 Výpočty | 🔴 | CES-01 |
| 3 Shoda se zadáním | 🔴 | CES-02 |
| 4 Testy | 🟡 | CES-06 |
| 5 Mobil a přístupnost | 🟡 | CES-03 |
| 6 Texty a citlivá témata | 🟡 | CES-04, CES-05 |
| 7 Soukromí a bezpečnost | 🟢 | CES-07 (Nízká) |
| 8 Nasazení a větve | 🟢 | CES-09 (Nízká) |

## Pravidla
Hodnoty z `rules.json` (ověřeno `2026-11-05`), konstanty a texty v `cesty.js`, `app.js`, `index.html` a `README.md` porovnány s rejstříkem `pravidla.md` (oblast B, PR-56 až PR-74) a znovu s texty předpisů na zakonyprolidi.cz (zákoník práce v účinném znění, vyhlášky 573/2025, 78/2026 a 175/2026 Sb.), staženo 5. 11. 2026 (`dukazy/skripty/cestovni-prikaz-prepocet.mjs`, záhlaví). Aplikace uživateli žádné odkazy neukazuje, jen čísla předpisů v patičce (CES-08).

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Sazba základní náhrady za km | `rules.json` sazbaKm osobni 5,90, jednostope 1,60 | 5,90 Kč osobní, 1,60 Kč jednostopá a tříkolky | PR-56 – vyhl. 573/2025 Sb. § 1; ZP § 157 odst. 4, https://www.zakonyprolidi.cz/cs/2025-573 | 5. 11. 2026 | shodné |
| Přívěs: sazba zvýšená nejméně o 15 % | `cesty.js:190–193` vyhodí ChybaVstupu „pravidlo … se nepodařilo ověřit“; `index.html:91–94` zaškrtávátko disabled | 5,90 × 1,15 = 6,785 Kč/km (nejméně) | PR-57 – ZP § 157 odst. 4 věta za písm. b), https://www.zakonyprolidi.cz/cs/2006-262#p157 | 5. 11. 2026 | **chybí, text nepravdivý – CES-02** |
| Nákladní auto, autobus, traktor: dvojnásobek | nenabízí se | nejméně 11,80 Kč/km | PR-58 – ZP § 157 odst. 5 | 5. 11. 2026 | nenabízí (zadání nežádá) |
| Náhrada za PHM = cena × spotřebované množství; cena z dokladu, jinak vyhlášková | `cesty.js:79–108` | § 158 odst. 2, 3 | PR-59 – ZP § 158, https://www.zakonyprolidi.cz/cs/2006-262#p158 | 5. 11. 2026 | shodné |
| Spotřeba z TP: kombinovaný provoz, jinak aritmetický průměr | `index.html:90` nápověda „aritmetický průměr“ | nejdřív údaj pro kombinovaný provoz, až není-li, průměr | PR-59 – ZP § 158 odst. 4 | 5. 11. 2026 | **nápověda neúplná – CES-04** |
| Více dokladů o ceně → aritmetický průměr cen | jedno pole „cena z dokladu“ | § 158 odst. 3 věta druhá | PR-59 | 5. 11. 2026 | uživatel musí zprůměrovat sám (není v zadání) |
| Průměrné ceny PHM 2026 (původní) | `rules.json` phm od 2026-01-01: 34,70 / 39,00 / 34,10 / 7,20 | 34,70 Kč benzin 95, 39 Kč benzin 98, 34,10 Kč nafta, 7,20 Kč/kWh | PR-60 – vyhl. 573/2025 Sb. § 4 (původní znění) | 5. 11. 2026 | shodné |
| Nafta 44,50 Kč od 1. 6. 2026 | `rules.json` novely[0], phm.nafta od 2026-06-01 | 44,50 Kč, účinnost 1. 6. 2026 | PR-61 – vyhl. 78/2026 Sb., https://www.zakonyprolidi.cz/cs/2026-78 | 5. 11. 2026 | shodné (modul i obrazovka: V22, V23) |
| Benzin 95 41,80 Kč od 1. 10. 2026 | `rules.json` novely[1], phm.benzin95 od 2026-10-01 | 41,80 Kč, účinnost 1. 10. 2026 | PR-62 – vyhl. 175/2026 Sb., https://www.zakonyprolidi.cz/cs/2026-175 | 5. 11. 2026 | shodné (V20, V21) |
| Cena PHM „ke dni odjezdu“ u vícedenní cesty přes 1. 6. / 1. 10. | `cesty.js:205` `dny[0].datum` | zákon den neurčuje | – | – | konvence, popsaná v README (předpoklad) |
| Stravné, soukromá sféra | `rules.json` stravne.soukroma [155, 236, 370] | nejméně 155 / 236 / 370 Kč | PR-63 – ZP § 163 odst. 1; vyhl. § 2 | 5. 11. 2026 | shodné |
| Časová pásma 5–12 / >12–18 / >18 h, hranice včetně | `cesty.js:130–135` (<300 min nic; ≤720; ≤1080; >1080) | 5 až 12 h; déle než 12, nejdéle 18; déle než 18 | PR-67 – ZP § 163 odst. 1, § 176 odst. 1 | 5. 11. 2026 | shodné (V1–V6) |
| Krácení soukromá: až 70/35/25 %, bez určení nižší hodnoty nejvyšší | `rules.json` kraceniMaxPct; `cesty.js:162–168`; `index.html:43` | § 163 odst. 2, 3 | PR-64 | 5. 11. 2026 | shodné |
| Vyšší sjednané stravné v soukromé sféře | nelze zadat (jen minimum) | § 163 odst. 3 věta první připouští vyšší stravné | ZP § 163 odst. 3 | 5. 11. 2026 | omezení, zadání nežádá (CES-12) |
| Stravné, veřejná sféra: rozpětí, bez určení dolní sazba | `rules.json` verejnaMin/Max; `cesty.js:154–161` | 155–185 / 236–284 / 370–442 Kč; § 176 odst. 5 dolní sazba | PR-65 – ZP § 176; vyhl. § 3 | 5. 11. 2026 | shodné (V15, V16) |
| Krácení veřejná: pevně 70/35/25 %; při 2 jídlech (5–12 h) a 3 jídlech (>12–18 h) nic | `cesty.js:161, 175` (`max(0, …)`) | § 176 odst. 3, 4 | PR-66 | 5. 11. 2026 | shodné ve výsledku (V17, V18) |
| Veřejná sféra pod 5 h: lze poskytnout až do výše pásma a) | nenabízí | § 176 odst. 2 (nepovinné) | PR-67 | 5. 11. 2026 | nenabízí (v pořádku) |
| Cesta spadající do 2 kalendářních dnů: posoudit dohromady, je-li to výhodnější | `cesty.js:113–127, 211–215` vždy dělí půlnocí | § 163 odst. 4; platí i ve veřejné sféře (§ 174; § 176 odst. 1 vylučuje jen § 163 odst. 1–3) | PR-68 – https://www.zakonyprolidi.cz/cs/2006-262#p163, #p174, #p176 | 5. 11. 2026 | **chybí – CES-01** |
| Zaokrouhlení částky k výplatě nahoru na celé Kč | `cesty.js:238` `ceil(celkemHal/100)`; položky na haléře | § 183 odst. 5 (vratka zaměstnance § 183 odst. 3) | PR-69 – https://www.zakonyprolidi.cz/cs/2006-262#p183 | 5. 11. 2026 | shodné; **text v UI a README tvrdí, že to zákon neupravuje – CES-05** |
| Zaokrouhlení položek na haléře (polovina nahoru) | `cesty.js:30–34` | zákon neupravuje | – | – | konvence (shoduje se s mou referencí) |
| Mimořádná změna při pohybu cen o 20 % | `README.md` | § 189 odst. 2 | PR-70 | 5. 11. 2026 | shodné |
| Vyhláška pro rok 2027 | `rules.json` `"2027": null`; výpočet blokován s vysvětlením | k 5. 11. 2026 nevydána | PR-71 – https://www.zakonyprolidi.cz/cs/rocnik/2026 | 5. 11. 2026 | shodné (Z7, obrazovka) |
| Datum ověření a jeho zdůvodnění | `rules.json` overeno 2026-11-05, poznamkaOvereni „plné znění ve Sbírce nebylo dostupné“ | plné texty jsou na zakonyprolidi.cz dostupné | PR-62 pozn. | 5. 11. 2026 | datum shodné s patičkou; **poznámka nepravdivá – CES-05** |
| OSVČ: vlastní auto, stravné nad 12 h, paušál 5 000 Kč | `index.html:98–104` jen text „nepodařilo se ověřit, nepočítáme“ | ZDP § 24 odst. 2 písm. k) body 2 a 3, písm. zt) | PR-72, PR-73, PR-74 | 5. 11. 2026 | nepočítá (v souladu se zadáním „nic nepotvrzeného nepoužij“); odůvodnění nepravdivé – CES-05 |
| Cesta nejvýše 31 dní; návrat po odjezdu; jídla 0–3 za den | `cesty.js:116–117, 147` | zákon neupravuje | – | – | konvence aplikace |

## Nezávislý přepočet
Reference: `dukazy/skripty/cestovni-prikaz-prepocet.mjs` (62 případů, od nuly podle předpisů; ruční očekávání potvrzeno u všech 62). Porovnání s modulem: `cestovni-prikaz-porovnani.mjs` → `dukazy/cestovni-prikaz/prepocet.txt` (dva běhy, stejný otisk `c1518690f85f05f1`): shoda 56, rozdíl 6 (V32 přívěs; V43, V44, V45, V48, V49 cesta přes půlnoc). Obrazovka: `cestovni-prikaz-prohlizec.mjs` → `prohlizec.json` (2 běhy, Chromium cs-CZ 360 px). Hlavička v prohlížeči: osobní auto, benzin 95, 6 l/100 km, soukromá sféra (není-li uvedeno jinak).

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 zadání | 100 km × 5,90 Kč | 590,00 Kč | 590,00 Kč | 590,00 Kč | ano |
| Z2 zadání | 100 km, 6 l/100 km, benzin 95 bez dokladu, 15. 3. 2026 | 208,20 Kč | 208,20 Kč | 208,20 Kč | ano |
| Z3 zadání | 13 h bez jídla, soukromá | 236,00 Kč | 236,00 Kč | 236,00 Kč | ano |
| Z4 zadání | 20 h | 370,00 Kč | 370,00 Kč | — | ano |
| Z5 zadání | 4 h | 0,00 Kč | 0,00 Kč | — | ano |
| Z6 zadání | elektromobil 100 km, 18 kWh/100 km bez dokladu | 129,60 Kč | 129,60 Kč | — | ano |
| Z7 zadání | 10. 1. 2027 7:00–15:00, 100 km | chyba (vyhláška 2027 nevyšla) | ChybaSazby s vysvětlením | cesta uložena, červeně „Vyhláška MPSV … pro rok 2027 zatím nevyšla …“, do souhrnu nezapočtena, tisk zakázán (`chyba-360.png`) | ano |
| Z8 zadání (součet) | 100 km, 6 l, benzin 95, 15. 3. 2026 6:00–19:00 | 1 034,20 Kč; k výplatě 1 035 Kč | 1 034,20 Kč; 1 035 Kč | 590,00 + 208,20 + 236,00 = 1 034,20 Kč; „Náhrady celkem k výplatě 1 035 Kč“ (`vysledek-360.png`, `vysledek-1440.png`) | ano |
| V1–V6 hranice pásem | 5:00 / 4:59 / 12:00 / 12:01 / 18:00 / 18:01 h | 155 / 0 / 155 / 236 / 236 / 370 Kč | totéž | — | ano |
| V7 celý den | 15. 3. 0:00 – 16. 3. 0:00 | 370,00 Kč (1 den) | 370,00 Kč | — | ano |
| V8–V12 krácení soukromá | 13 h+1 jídlo; 13 h+3; 6 h+1; 6 h+2; 20 h+3 | 153,40 / 0 / 46,50 / 0 / 92,50 Kč | totéž | — | ano |
| V13, V14 nižší/vyšší krácení | 6 h+1 jídlo při 50 %; 80 % | 77,50 Kč; chyba | 77,50 Kč; ChybaVstupu | — | ano |
| V15 veřejná bez určení | 13 h | 236,00 Kč | 236,00 Kč | — | ano |
| V16 veřejná 442 Kč + 1 večeře | 15. 3. 2:00–22:00 | 331,50 Kč | 331,50 Kč | 331,50 Kč („442 Kč, 1 jídlo × −25 %“) | ano |
| V17 veřejná 185 Kč + 2 jídla | 16. 3. 8:00–14:00 | 0,00 Kč (§ 176 odst. 4) | 0,00 Kč | 0,00 Kč | ano |
| V18, V19 veřejná | 284 Kč + 3 jídla; 200 Kč mimo rozpětí | 0,00 Kč; chyba | 0,00 Kč; ChybaVstupu | — | ano |
| V20–V24 ceny PHM podle data | benzin 95 30. 9. / 1. 10. 2026; nafta 31. 5. / 1. 6. 2026; benzin 98 | 208,20 / 250,80 / 170,50 / 222,50 / 273,00 Kč | totéž | — | ano |
| V25–V27 cena z dokladu | 38,90 Kč/l; 6,50 Kč/kWh; 0 | 233,40 Kč; 117,00 Kč; chyba | totéž | 100,5 km × 6,5 l × 38,90 = 254,11 Kč (cs-CZ) | ano |
| V28–V31 desetiny, zaokrouhlení | 12,5 km; 33,3 km × 6,4 × 34,70; 0,1 km × 5 × 41; jednostopé 50 km | 73,75 / 73,95 / 0,21 / 80,00 Kč | totéž | — | ano |
| V32 přívěs | 100 km osobní s přívěsem | 678,50 Kč (5,90 × 1,15) | ChybaVstupu „pravidlo … se nepodařilo ověřit“ | zaškrtávátko disabled | **ne – CES-02** |
| V33, V34 maximum | 9 999,9 km; × 6 l × 41,80 | 58 999,41 Kč; 25 079,75 Kč | totéž | — | ano |
| V35–V40 vstupy | km 0; −5; NaN; spotřeba 0; návrat před odjezdem; prázdný odjezd | 236,00 Kč; chyba ×5 | totéž | km −5 → „Počet km musí být nezáporné číslo.“; návrat dřív → „Návrat musí být později než odjezd.“; prázdný formulář → „Vyplňte: Odjezd, Návrat, Odkud, Kam, Účel cesty.“ | ano |
| V41 tři dny | 15. 3. 14:00 – 17. 3. 10:30, oběd 16. 3. | 587,50 Kč | 587,50 Kč | — | ano |
| V42 návrat o půlnoci | 15. 3. 8:00 – 16. 3. 0:00 | 236,00 Kč | 236,00 Kč | — | ano |
| V43 přes půlnoc | 15. 3. 20:00 – 16. 3. 2:00 (4 h + 2 h) | 155,00 Kč (společně 6 h, § 163 odst. 4) | 0,00 Kč | 0,00 Kč („pod 5 h → 0 Kč; pod 5 h → 0 Kč“, `pulnoc-360.png`) | **ne – CES-01** |
| V44 přes půlnoc | 10. 4. 6:00 – 11. 4. 0:30 (18 h + 0,5 h) | 370,00 Kč (společně 18,5 h) | 236,00 Kč | 236,00 Kč | **ne – CES-01** |
| V45 přes půlnoc | 22:00 – 11:00 (2 h + 11 h) | 236,00 Kč (společně 13 h) | 155,00 Kč | — | **ne – CES-01** |
| V46 přes půlnoc | 19:00 – 10:00 (5 h + 10 h) | 310,00 Kč (oddělené výhodnější) | 310,00 Kč | — | ano |
| V47 přes půlnoc s jídlem | 21:00 – 9:00, 1 jídlo 2. den | 46,50 Kč (obě varianty stejné) | 46,50 Kč | — | ano |
| V48 veřejná přes půlnoc | 20:00 – 2:00 | 155,00 Kč | 0,00 Kč | — | **ne – CES-01** |
| V49 nepřestupný rok | 28. 2. 2026 22:00 – 1. 3. 2026 4:00 | 155,00 Kč (dny správně bez 29. 2.) | 0,00 Kč | — | **ne – CES-01** (dělení dnů správné) |
| V50 přelom roku | 31. 12. 2026 20:00 – 1. 1. 2027 8:00 | chyba (2027 bez vyhlášky) | ChybaSazby | — | ano |
| V51 rok 2025 | 31. 12. 2025 | chyba | ChybaSazby | — | ano |
| V52, V53 souhrn | 301,10 + 1 034,20; 1 034,00 | 1 335,30 → 1 336 Kč; 1 034 Kč | totéž | 3 cesty: 6 785,54 Kč → 6 786 Kč | ano |
| V54 letní čas | 29. 3. 2026 0:30–5:30 | 155 Kč nástěnně (skutečně 4 h → 0 Kč) | 155,00 Kč | — | ano (CES-10) |
| E český zápis | km „100,5“, spotřeba „6,5“, doklad „38,90“, km „1 500“ | 592,95 + 254,11 + 236 = 1 083,06 Kč; 1 500 km → 8 850,00 Kč | totéž | cs-CZ: 1 083,06 Kč, 8 850,00 Kč; **en-US: 1005 km × 65 l × 3 890 Kč = 2 547 308,00 Kč** | cs-CZ ano; en-US **ne – CES-03** |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl: statický web česky, více cest za měsíc, náhrada za auto, PHM, stravné, vyúčtování k tisku/PDF | splněno | `index.html`, `app.js:306–416`, `vysledek-360.png`, `vyuctovani-1-cesta.pdf` |
| Čisté HTML + CSS + JS (ES moduly), žádný build ani server | splněno | `package.json` bez závislostí, `<script type="module">` `index.html:9` |
| PDF přes `@media print` a `window.print()`, žádná knihovna | splněno | `style.css:203–228`, `app.js:265` |
| Výpočty v `cesty.js` (čisté funkce), sazby v `rules.json` po letech, 2027 `null`, rok podle data cesty | splněno | `cesty.js` bez DOM (spuštěn v Node v `porovnani.mjs`), `cesty.js:58–76` |
| Cesty jen do `localStorage` v try/catch, nikam jinam | splněno | `app.js:26–36`; síť jen vlastní původ (`prohlizec.json` A_zadani.sit, `zivy-kontrola.json`) |
| Testy `node --test`; nasazení GitHub Pages | splněno | `testy.txt` 26/26; živý web HTTP 200, shoda SHA (`zivy-web-vs-main.txt`) |
| „Než začneš psát kód“: tabulka hodnota → zdroj → datum z vyhlášky a ZP § 157, 158, 163, 176 | částečně | v repozitáři jen `poznamkaOvereni` se sekundárními zdroji (MPSV ppropo, SME Union, ČMKOS, Money…); primární texty nebyly použity (CES-05) |
| … přirážku za přívěs ověřit | ne | odmítnuto jako „neověřené“ (CES-02) |
| … vyhláška 2027: pokud nevyšla, `null` + upozornění v UI | splněno | `rules.json` `"2027": null`; žlutý pruh „Sazby pro rok 2027 zatím nejsou“ (`uvod-360.png`) |
| … OSVČ: ověřit, nic nepotvrzeného nepoužít | částečně | nepočítá se a říká to (správně konzervativní), ale tvrdí „nepodařilo se spolehlivě ověřit“ místo odkazu na ZDP § 24 odst. 2 písm. k), zt) (CES-05) |
| Výpočet: základní náhrada = km × sazba (u přívěsu navýšení podle zákona) | částečně | km × sazba správně (Z1, V28, V31, V33); přívěs ne (CES-02) |
| Náhrada za PHM = km × spotřeba / 100 × cena (z dokladu, jinak vyhlášková) | splněno | Z2, Z6, V20–V27 |
| Stravné podle délky cesty v daném dni, kráceno za jídla | částečně | pásma a krácení správně (V1–V19); cesta přes 2 dny bez § 163 odst. 4 (CES-01) |
| Zaokrouhlení: položky na haléře, součet na koruny | splněno | `cesty.js:30–34, 238`; V52, V53 (zadání se mýlí v tom, že pravidla jsou „z vyhlášky“ – jsou v ZP § 183 odst. 5) |
| Obrazovka 1 Hlavička: firma, zaměstnanec, vozidlo (SPZ, spotřeba, palivo), sféra | splněno | `index.html:21–96`, `uvod-360.png` |
| Obrazovka 2 Seznam cest: datum, časy, odkud – kam – zpět, km, účel, jídla, cena PHM z dokladu | splněno | `index.html:108–155`; jídla po dnech `app.js:121–141` |
| Obrazovka 3 Souhrn: tabulka cest, součty po položkách, tlačítko Tisk/PDF | splněno | `app.js:347–416`, `vysledek-1440.png` |
| Obrazovka 4 Patička: použitá vyhláška, datum ověření, „Orientační výpočet“ | splněno | `app.js:418–433`; patička na obrazovce i v PDF |
| Kritéria: 590; 208,20; 236; 370; 0; 129,60 Kč | splněno | testy 1–6, `prepocet.txt` Z1–Z6, obrazovka Z8 |
| Kritérium: cesta 2027 bez vyhlášky → výpočet se nepustí a vysvětlí proč | splněno | test 7; `chyba-360.png` |
| Kritérium: PDF jedné cesty na jednu stranu A4 | splněno | `page.pdf()` A4: 1 cesta 1 strana, 3 cesty 1 strana (`prohlizec.json` pdfStrany1/3); `ukazka-vyuctovani.pdf` 1 strana A4 (pdfinfo) |
| Kritérium: mobil 360 px bez vodorovného posuvníku | splněno | přetékání false ve všech stavech (`uvod-kontrola.json`, `prohlizec.json`) |
| Kritérium: README česky – jak doplnit vyhlášku do `rules.json` | splněno | `README.md` oddíl „Jak každý rok doplnit novou vyhlášku“ |
| Postup: na konci spustit testy a vytisknout ukázkové vyúčtování | splněno | `ukazka-vyuctovani.pdf` v repozitáři (Chromium, 5. 11. 2026) |
| Postup: „Nejdřív tabulka ověřených sazeb a čekej na schválení“ | neověřitelné | proces mimo repozitář |

## Nálezy
### CES-01 · Vysoká · 2 Výpočty · Cesta přes půlnoc se vždy dělí po dnech – chybí společné posouzení podle ZP § 163 odst. 4
- **Kde:** `cesty.js:113–127` (`hodinyPoDnech`), `cesty.js:211–215` (`spocitejCestu` sčítá `stravneDen` za každý den zvlášť); `README.md` „Co aplikace záměrně nepočítá“ – „případné zvláštní pravidlo pro cestu přes půlnoc … se nepodařilo ověřit“; v UI žádné upozornění (`app.js:338–343` ukáže „pod 5 h → 0 Kč“).
- **Reprodukce:** soukromá sféra, cesta 15. 3. 2026 20:00 – 16. 3. 2026 2:00, bez jídel, bez km → očekáváno 155 Kč: § 163 odst. 4 ZP („Při pracovní cestě, která spadá do 2 kalendářních dnů, se upustí od odděleného posuzování doby trvání pracovní cesty v kalendářním dnu, je-li to pro zaměstnance výhodnější“, https://www.zakonyprolidi.cz/cs/2006-262#p163); 4 h + 2 h = 6 h → pásmo 5–12 h → 155 Kč. Skutečnost: modul `stravneHal = 0`, obrazovka „Stravné 0,00 Kč … pod 5 h → 0 Kč; pod 5 h → 0 Kč“ (`prepocet.txt` V43, `prohlizec.json` C_pulnoc, `pulnoc-360.png`). Dále 6:00–0:30 (18 h + 0,5 h): očekáváno 370 Kč (18,5 h), skutečnost 236 Kč (V44, obrazovka); 22:00–11:00: očekáváno 236 Kč, skutečnost 155 Kč (V45). Ve veřejné sféře totéž (V48): § 176 odst. 1 vylučuje jen § 163 odst. 1–3, § 174 odkazuje na hlavu II.
- **Dopad na uživatele:** zaměstnavatel podle vyúčtování vyplatí méně, než je zákonné minimum (o 155 Kč, 134 Kč nebo 81 Kč za cestu); zaměstnanec vracející se po půlnoci z celodenní cesty přijde o 134 Kč stravného, aniž by ho na to aplikace upozornila.
- **Doporučená oprava:** v `spocitejCestu` u cest s právě 2 kalendářními dny spočítat i variantu „dohromady“ (pásmo z celkové doby, všechna poskytnutá jídla, krácení podle společného pásma) a použít vyšší částku; v detailu ukázat, která varianta se použila; odstranit tvrzení v README; doplnit testy (20:00–2:00 → 155 Kč; 6:00–0:30 → 370 Kč; 19:00–10:00 → 310 Kč zůstává).
- **Ověření:** reprodukováno 2× (dva běhy `porovnani.mjs`, dva běhy prohlížeče) · skeptik: Potvrzeno (Opus, 5. 11. 2026 – § 163 odst. 4 ZP citován, platí i pro veřejnou sféru (§ 174, § 176 odst. 1); spocitejCestu reprodukováno: 0 / 236 / 155 Kč místo 155 / 370 / 236 Kč)

### CES-02 · Vysoká · 1 Pravidla a data · Přívěs: povinné navýšení sazby o 15 % aplikace odmítá s nepravdivým odůvodněním
- **Kde:** `cesty.js:190–193` (`if (cesta.prives) throw new ChybaVstupu('… pravidlo v platném zákoníku práce se nepodařilo ověřit.')`), `index.html:91–94` (zaškrtávátko „S přívěsem“ `disabled` s textem „pravidlo se nepodařilo ověřit v platném znění ZP“), `README.md` „Co aplikace záměrně nepočítá: navýšení sazby za přívěs“, test `cesty.test.js:167–171`.
- **Reprodukce:** 100 km osobním autem s přívěsem, sazby 2026 → očekáváno základní náhrada nejméně 100 × 5,90 × 1,15 = 678,50 Kč (ZP § 157 odst. 4: „při použití přívěsu k silničnímu motorovému vozidlu zaměstnavatel sazbu základní náhrady za 1 km jízdy zvýší nejméně o 15 %“, https://www.zakonyprolidi.cz/cs/2006-262#p157; rejstřík PR-57). Skutečnost: modul vyhodí ChybaVstupu (`prepocet.txt` V32), v UI nelze přívěs vůbec zvolit; zadání přitom výslovně žádá „u přívěsu navýšení podle zákona“ a ověření „přirážku za přívěs“.
- **Dopad na uživatele:** zaměstnanec s přívěsem (řemeslníci, servis) buď dostane jen 5,90 Kč/km (o 0,885 Kč/km méně, 88,50 Kč na 100 km), nebo si musí vše dopočítat ručně; text navíc tvrdí, že platný zákon pravidlo neobsahuje.
- **Doporučená oprava:** povolit zaškrtávátko, v `zakladniNahrada` násobit sazbu 1,15 (haléře z přesného součinu km × sazba × 1,15, ne z předem zaokrouhlené sazby 6,79 Kč), ukázat to v detailu („5,90 Kč/km + 15 % přívěs“), opravit texty v `index.html` i README a nahradit test 23 testem na 678,50 Kč.
- **Ověření:** reprodukováno 2× (dva běhy `porovnani.mjs`; text v UI na obou snímcích) · skeptik: Potvrzeno (Opus, 5. 11. 2026 – § 157 odst. 4 ZP citován („zvýší nejméně o 15 %“); spocitejCestu s prives: true vyhodí ChybaVstupu místo ≥ 678,50 Kč; test odmítnutí přímo vynucuje)

### CES-03 · Střední · 5 Mobil a přístupnost · Desetinná čárka v číselných polích se v prohlížeči s jinou než českou lokalizací potichu zahodí (6,5 → 65)
- **Kde:** `index.html:85, 129, 136` (`<input type="number" step="0.01|0.1" inputmode="decimal">` pro spotřebu, km a cenu z dokladu; také `kr0–2`, `sv0–2`), `app.js:97, 156, 158` (`Number(f.km.value)` bez kontroly), formulář cesty má `novalidate`.
- **Reprodukce:** Chromium `--lang=en-US`: spotřeba „6,5“, km „100,5“, cena z dokladu „38,90“ → pole obsahují „65“, „1005“, „3890“, `validity.badInput = false` (čárka je odfiltrována už při psaní i při vložení ze schránky – `prohlizec.json` E_cisla_en-US, test vložení `insertText`), žádná hláška; cesta se uloží a souhrn ukáže „1005 km × 65 l/100 km × 3 890,00 Kč/l = 2 541 142,50 Kč“, celkem 2 547 308,00 Kč. Očekáváno 100,5 km × 6,5 l × 38,90 = 254,11 Kč, celkem 1 083,06 Kč. V cs-CZ funguje správně (obrazovka 1 083,06 Kč). „1 500“ s mezerou se v obou lokalizacích správně převede na 1500.
- **Dopad na uživatele:** uživatel s anglickým prohlížečem/OS (běžné na firemních noteboocích) dostane nesmyslnou částku nebo – u méně nápadných hodnot (6,5 → 65 l/100 km) – desetinásobnou náhradu za PHM, aniž by ho na to cokoli upozornilo; kontrola `validity` tu nepomůže, protože prohlížeč vstup neoznačí za chybný.
- **Doporučená oprava:** pro spotřebu, km a cenu použít `type="text" inputmode="decimal"` s vlastním převodem („6,5“, „1 500,50“ → číslo) a chybovou hláškou, nebo aspoň u `type=number` zachytit událost `beforeinput` s čárkou a varovat; přidat kontrolu rozumných mezí (spotřeba > 30 l/100 km, cena > 100 Kč/l → dotaz).
- **Ověření:** reprodukováno 2× (dva běhy prohlížeče en-US, navíc test vložení) · skeptik:

### CES-04 · Střední · 6 Texty a citlivá témata · Nápověda ke spotřebě radí „aritmetický průměr“, zákon žádá přednostně údaj pro kombinovaný provoz
- **Kde:** `index.html:90` („Uvádí-li technický průkaz více údajů o spotřebě, použijte jejich aritmetický průměr (§ 158 ZP).“), `README.md` totéž není opraveno.
- **Reprodukce:** ZP § 158 odst. 4: „Při určení spotřeby pohonné hmoty použije zaměstnavatel údaj o spotřebě pro kombinovaný provoz podle norem Evropské unie. Není-li tento údaj … uveden, vypočítá zaměstnavatel spotřebu … aritmetickým průměrem z údajů … uvedených“ (https://www.zakonyprolidi.cz/cs/2006-262#p158; rejstřík PR-59). U vozidla s údaji např. 7,9 / 5,1 / 6,1 (město/mimo město/kombinovaná) nápověda vede k zadání průměru 6,37 místo kombinované 6,1; u WLTP údajů (nízká/střední/vysoká/velmi vysoká/kombinovaná) je odchylka podobná.
- **Dopad na uživatele:** náhrada za PHM o jednotky procent vyšší nebo nižší, než má být (u 6,37 vs. 6,1 l a 1 000 km po 41,80 Kč o 113 Kč), s odkazem na zákon, který říká něco jiného.
- **Doporučená oprava:** text: „Použijte údaj o spotřebě pro kombinovaný provoz; jen pokud v technickém průkazu není, aritmetický průměr všech uvedených údajů (§ 158 odst. 4 ZP).“
- **Ověření:** reprodukováno 2× (text v obou snímcích; § 158 odst. 4 ověřen v rejstříku i vlastním čtením) · skeptik:

### CES-05 · Střední · 6 Texty a citlivá témata · Aplikace tvrdí, že předpisy nebyly dostupné a že zákon zaokrouhlení neupravuje
- **Kde:** `rules.json` `poznamkaOvereni` („plné znění ve Sbírce nebylo z prostředí dostupné“, zdroje jen sekundární); `README.md` „Co aplikace záměrně nepočítá … se nepodařilo ověřit v platném znění předpisů“ a „Zaokrouhlování: vyhláška ani zákoník práce ho neupravují“; `app.js:408–409` poznámka na výtisku „konvence aplikace – vyhláška ani zákoník práce zaokrouhlení neupravují“; `index.html:100–103` OSVČ „pravidla se nám nepodařilo spolehlivě ověřit“.
- **Reprodukce:** texty vyhlášek 573/2025, 78/2026 a 175/2026 Sb. i zákoníku práce jsou na zakonyprolidi.cz volně dostupné (staženo 5. 11. 2026, HTTP 200); zaokrouhlení částky k výplatě nahoru na celé koruny stanoví ZP § 183 odst. 5 (a vratku § 183 odst. 3; https://www.zakonyprolidi.cz/cs/2006-262#p183) – aplikace ho shodou okolností dodržuje, ale popisuje jako vlastní konvenci; pravidla pro OSVČ jsou v ZDP § 24 odst. 2 písm. k) a zt) (PR-72–74).
- **Dopad na uživatele:** mzdová účetní nebo kontrolor nemohou uvedenému datu ověření důvěřovat a výtisk tvrdí účetní nepravdu; zároveň se tím maskují CES-01 a CES-02 jako „neověřitelné“.
- **Doporučená oprava:** `poznamkaOvereni` nahradit odkazy na primární texty (zakonyprolidi.cz / e-Sbírka) s datem; poznámku na výtisku změnit na „zaokrouhleno nahoru na celé koruny podle § 183 odst. 5 zákoníku práce“; v README a u OSVČ uvést skutečný důvod (mimo rozsah aplikace) s odkazem na § 24 ZDP.
- **Ověření:** reprodukováno 2× (texty na obou snímcích a ve výtisku PDF; zdroje staženy dvakrát – rejstřík a vlastní stažení) · skeptik:

### CES-06 · Střední · 4 Testy · Test konzervuje odmítnutí přívěsu, chybí test pro cestu přes dva dny
- **Kde:** `cesty.test.js:167–171` („přívěs není ověřený → výpočet ho odmítne“ – `assert.throws`), žádný test pro § 163 odst. 4; `cesty.test.js:128–152` testují jen oddělené dny (vícedenní cesta 3 dny, návrat o půlnoci).
- **Reprodukce:** `node --test` 26/26 projde (`testy.txt`), včetně testu, který očekává chybu místo 678,50 Kč; případy V43–V45 nejsou pokryté, takže oprava CES-01 ani CES-02 by bez změny testů neprošla, resp. chyba CES-01 testy neodhalí.
- **Dopad na uživatele:** nepřímý – testy dávají falešnou jistotu, že výpočet odpovídá zákonu.
- **Doporučená oprava:** nahradit test 23 testem na 678,50 Kč; přidat testy 20:00–2:00 → 155 Kč, 6:00–0:30 → 370 Kč, 19:00–10:00 → 310 Kč, veřejná sféra 20:00–2:00 → 155 Kč; přidat test zaokrouhlení v `souhrn` s odkazem na § 183 odst. 5 (už existuje, jen přejmenovat zdůvodnění).
- **Ověření:** reprodukováno 2× (`testy.txt`, vlastní čtení testů) · skeptik:

### CES-07 · Nízká · 7 Soukromí a bezpečnost · localStorage drží jméno zaměstnance, SPZ a cesty bez možnosti smazání v aplikaci
- **Kde:** `app.js:7, 26–36` (klíč `cestovni-prikaz-v1`, celý `state` včetně `firma`, `zamestnanec`, `vozidlo.spz`, trasy a účely cest); UI nemá tlačítko „Smazat vše“ (cesty lze mazat jen jednotlivě, hlavičku jen přepsat).
- **Reprodukce:** po vyplnění hlavičky a cesty obsahuje `localStorage` `{"hlavicka":{"firma":"Testovací s.r.o.","zamestnanec":"Jan Testovací",…"spz":"1AB 2345"…},"cesty":[…]}` (`prohlizec.json` A_zadani.localStorage, `uvod-kontrola.json`); na sdíleném počítači je uvidí další uživatel. Ukládání je dokumentované (README, patička „Data se ukládají jen v tomto prohlížeči“), v try/catch, nikam se neodesílá (žádné cizí požadavky), žádné cookies ani analytika; `innerHTML` dostává jen hodnoty přes `esc()` – payload `<img src=x onerror=alert(1)>` ve všech polích hlavičky i cesty (odkud, kam, zpět, účel) se vykreslil jako text, bez dialogu (`prohlizec.json` F_xss, `uvod-360-xss.png`).
- **Dopad na uživatele:** osobní údaje zaměstnance zůstávají v prohlížeči kiosku či sdíleného PC bez jednoduchého vymazání.
- **Doporučená oprava:** tlačítko „Smazat všechna data“ (`localStorage.removeItem(KLIC)` + reset formulářů) a věta o tom v patičce.
- **Ověření:** reprodukováno 2× (oba běhy) · skeptik:

### CES-08 · Nízká · 1 Pravidla a data · Patička ani README neodkazují na texty předpisů
- **Kde:** `app.js:418–433` (patička: čísla vyhlášek a paragrafů bez odkazu), `README.md` (odkazy jen na živý web a ukázkové PDF).
- **Reprodukce:** uživatel chce „ověřit aktuální znění předpisů ve Sbírce zákonů“, jak patička radí, ale nemá kam kliknout; zadání uvádí jako podklady epravo.cz a praceamzda.cz (sekundární).
- **Dopad na uživatele:** ztížené ověření; žádný vliv na čísla.
- **Doporučená oprava:** do `rules.json` přidat `zdroje: [{ nazev, url }]` (zakonyprolidi.cz/cs/2025-573, /2026-78, /2026-175, ZP § 157–189) a vypsat je v patičce.
- **Ověření:** reprodukováno 2× · skeptik:

### CES-09 · Nízká · 8 Nasazení a větve · Chybí favicon – chyba 404 v konzoli při každém načtení
- **Kde:** repozitář bez `favicon.ico` a bez `<link rel="icon">` v `index.html`.
- **Reprodukce:** lokálně i na https://frankie851.github.io/cestovni-prikaz/ konzole „Failed to load resource: 404“ pro `/favicon.ico` (`uvod-kontrola.json`, `zivy-kontrola.json`); jiné chyby ani chybějící soubory nejsou, živý web odpovídá `main` (SHA-256 všech souborů, `zivy-web-vs-main.txt`), GitHub workflow není (nasazení z větve).
- **Dopad na uživatele:** žádný funkční; šum při ladění.
- **Doporučená oprava:** přidat `<link rel="icon" href="data:,">` nebo malé SVG.
- **Ověření:** reprodukováno 2× (lokálně i živě) · skeptik:

### CES-10 · Nízká · 2 Výpočty · Délka cesty se počítá z „nástěnného“ času, při změně letního času se liší o hodinu
- **Kde:** `cesty.js:46–51` (`Date.UTC` z místních hodnot – komentář to přiznává).
- **Reprodukce:** 29. 3. 2026 0:30–5:30 → aplikace 5:00 h → 155 Kč, skutečně uplynou 4 h (hodiny přeskočí z 2:00 na 3:00) → 0 Kč; 25. 10. 2026 0:30–5:00 → aplikace 4:30 h → 0 Kč, skutečně 5,5 h → 155 Kč (`prepocet.txt` V54; moje reference počítá stejně, proto „shoda“). Zákon pracuje s dobou trvání cesty, nikoli s rozdílem údajů na hodinách.
- **Dopad na uživatele:** dvakrát ročně, jen u cest přes 2:00–3:00 ráno s délkou těsně u hranice pásma; částka 155 Kč.
- **Doporučená oprava:** počítat trvání v reálném čase (lokální `Date` pro rozdíl, kalendářní den podle místního času) nebo aspoň upozornění u dnů změny času.
- **Ověření:** reprodukováno 2× · skeptik:

### CES-11 · Nízká · 2 Výpočty · Rozpětí veřejné sféry a výchozí krácení se berou z posledního roku v `rules.json`, ne z roku cesty
- **Kde:** `app.js:55–56, 73–81, 91, 108` (`posledniRokSazeb()` pro `min/max/placeholder` polí `sv0–2` a doplnění `kraceniPct`/`stravneVerejna`), zatímco `cesty.js:154–160` kontroluje rozpětí roku cesty.
- **Reprodukce:** dnes bez dopadu (jediný rok 2026). Po doplnění roku 2027 s jiným rozpětím (např. 160–190 Kč) zadá uživatel 190 Kč a všechny cesty z prosince 2026 skončí chybou „musí být 155–185 Kč“, protože částka se neukládá po letech.
- **Dopad na uživatele:** budoucí zmatek při přelomu roku, žádná špatná částka.
- **Doporučená oprava:** určenou výši stravného ve veřejné sféře ukládat po letech, nebo ji validovat a nabízet podle roku rozpracované cesty.
- **Ověření:** čtení kódu, 2× ověřeno · skeptik:

### CES-12 · Nízká · 3 Shoda se zadáním · Soukromá sféra neumožňuje vyšší sjednané stravné (§ 163 odst. 3 věta první)
- **Kde:** `cesty.js:163` (`zakladKc = r.stravne.soukroma[p]` bez možnosti vyšší částky), `index.html:41–50` (jen krácení).
- **Reprodukce:** zaměstnavatel, který určil stravné 200 Kč pro pásmo 5–12 h, nemůže vyúčtování v aplikaci sestavit; zákon vyšší stravné výslovně připouští („Nesjedná-li zaměstnavatel … vyšší stravné …, přísluší zaměstnanci stravné podle odstavce 1“). Zadání to nežádá, README omezení nezmiňuje.
- **Dopad na uživatele:** omezení použitelnosti, nikoli chybná částka (minimum je správně).
- **Doporučená oprava:** volitelné pole „sjednané stravné“ pro soukromou sféru (≥ minimum) nebo věta v README, že aplikace počítá jen zákonné minimum.
- **Ověření:** čtení kódu a § 163 odst. 3, 2× · skeptik:

## Neslité větve
Žádné (`git branch -a`: jen `main` / `origin/main`).

## Co se nepodařilo ověřit a předpoklady
- **Vyhláška pro rok 2027** – k 5. 11. 2026 neexistuje (PR-71); chování aplikace (`null`, blokace) je správné, hodnoty nelze ověřit.
- **Jídla při společném posouzení dvou dnů (§ 163 odst. 4):** zákon neříká, jak při „upuštění od odděleného posuzování“ započíst jídla; moje reference sečte jídla obou dnů (nejvýše 3) a krátí podle společného pásma. Případy V43–V45, V48, V49 (bez jídel) na tomto předpokladu nezávisí; V47 vychází v obou výkladech stejně.
- **Cena PHM u vícedenní cesty přes 1. 6. nebo 1. 10. 2026:** zákon neurčuje rozhodný den; aplikace i reference berou den odjezdu (README to říká). Rozdíl nastane jen u cest přes tato data bez dokladu.
- **Letní čas (CES-10):** zákon výslovně neřeší; předpoklad, že rozhoduje skutečně uplynulá doba.
- **Primární zdroje:** použit jen zakonyprolidi.cz (konsolidovaná znění a texty vyhlášek); e-Sbírka se bez prohlížeče neskládá, proto nebyla druhým zdrojem; druhým potvrzením je rejstřík `pravidla.md` (nezávisle sestavený ve fázi 1) a u změn cen citace nahrazovaných čísel v novelách.
- **Procesní body zadání** („čekej na schválení“, tabulka sazeb před kódem) – v repozitáři není stopa, neověřitelné.
- **Chování ve Firefoxu a Safari u desetinné čárky (CES-03)** – testováno jen v Chromium (cs-CZ, en-US).
- Testovací vstupy (firma „Testovací s.r.o.“, „Jan Testovací“, SPZ „1AB 2345“) jsou smyšlené.
