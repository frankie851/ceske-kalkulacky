# Revize: Přijímačky bez paniky (`frankie851/prijimacky-bez-paniky`)
Revidovaný commit: `e9dd0d338515283b277a2b54fa684a351375e4bf` (5. 11. 2026) · živý web: https://frankie851.github.io/prijimacky-bez-paniky/ (HTTP 200, shoda s main: ano) · revize: 5. 11. 2026

## Verdikt: Připraveno
Všech 22 termínů a 12 pravidel v `rules.json` odpovídá rejstříku (PS-01 až PS-28) i mému druhému čtení sdělení MŠMT MSMT-525/2026-13, harmonogramu MŠMT 2026/2027, školského zákona (§ 60a–60n) a vyhlášky 422/2023 Sb.; nezávislá implementace odloženého přijetí (sekvenční varianta + hrubá síla přes všechna stabilní párování) se s `matching.js` shoduje ve všech 4 příkladech ze zadání, 3 scénářích, 19 hraničních případech a 200 náhodných instancích včetně permutací pořadí, a dva případy zadané do formuláře (zadání Z3 a scénář „dva pokusy“ s 35 + 28 = 63 b.) ukázaly na obrazovce totéž co modul. Nejvážnější jsou střední nálezy: generátor .ics neescapuje středník (dnes se neprojeví, test chybu zakonzervoval), číselná pole nehlídají rozsah ani desetinnou čárku v neczeské lokalizaci (62,5 → 625 → „Spíš jistota“) a „Moje strategie“ porovnává body „ze 100“ s loňským minimem školy bez upozornění na shodnou škálu. Dobře je oddělení čistého algoritmu od obrazovky, jednoznačné hlášení shody pořadí, platný .ics (0 chyb podle RFC 5545 u 22 událostí, skutečné stažení v prohlížeči), žádné cizí požadavky, úložiště ani `innerHTML`, 0 porušení axe na úvodní stránce i ve strategii, žádné přetékání na 360 px a viditelné datum ověření shodné s `rules.json`.
Nálezy: Kritická 0 · Vysoká 0 · Střední 5 · Nízká 4

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟢 | PRI-09 |
| 2 Výpočty | 🟡 | PRI-01 |
| 3 Shoda se zadáním | 🟢 | — (import .ics do Google/iPhone neověřen, viz závěr) |
| 4 Testy | 🟡 | PRI-05 |
| 5 Mobil a přístupnost | 🟡 | PRI-02, PRI-03 |
| 6 Texty a citlivá témata | 🟡 | PRI-04 |
| 7 Soukromí a bezpečnost | 🟢 | — |
| 8 Nasazení a větve | 🟢 | — |

## Pravidla
Všechny hodnoty z `rules.json` (`meta.checked` 2026-11-05) a konstanty v textech `index.html`; porovnáno s rejstříkem `pravidla.md` (oblast C) a 5. 11. 2026 znovu přečteno v úředních textech (zakonyprolidi.cz ŠZ 561/2004 Sb. a V422; pdftotext sdělení a harmonogramu MŠMT) – výňatky a HTTP stavy všech šesti zdrojů aplikace v `dukazy/prijimacky-bez-paniky/zdroje.txt`. Tabulka termínů s dny v týdnu a svátky: `dukazy/prijimacky-bez-paniky/prepocet.txt`, část F.

| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|
| Počet přihlášek 3 + 2 (konzervatoře se počítají do 2) | `rules.json` `pocet`; `index.html:221` | nejvýše 3 obory bez TZ a 2 s TZ | PS-01 – ŠZ § 60a odst. 1, https://www.zakonyprolidi.cz/cs/2004-561 | 5. 11. 2026 | shodné |
| Priorita závazná, po termínu neměnná, na tiskopisech shodná | `rules.json` `priorita`; `index.html:49, 228` | § 60b odst. 2–3 (netýká se zpětvzetí) | PS-02 – ŠZ § 60b | 5. 11. 2026 | shodné |
| JPZ dvakrát, lepší výsledek z každého testu; ČJL 60 min, M 70 min, 50 b. | `rules.json` `dva-pokusy`; `matching.js:17` `bestOfTwo`; `index.html:61` | § 60h odst. 1 („může jednotnou zkoušku konat dvakrát“), § 60i odst. 3 | PS-03, PS-04 – ŠZ; CERMAT | 5. 11. 2026 | shodné |
| Podíl JPZ ≥ 60 % (sportovní gymnázium ≥ 40 %) | `rules.json` `podil`; `index.html:61` | § 60i odst. 3 | PS-05 | 5. 11. 2026 | shodné |
| Hranice úspěšnosti školy; neúčast = 0 b. | `rules.json` `hranice`; `matching.js` `minScore`, `bestOfTwo` → 0 | metodika MŠMT s. 12 | PS-06 | 5. 11. 2026 | shodné |
| Algoritmus odloženého přijetí | `rules.json` `algoritmus`; `matching.js` `deferredAcceptance`; `index.html:84, 94` | § 60j odst. 2–4; metodika s. 12–13 (uchazečsky optimální stabilní párování) | PS-07 – https://msmt.gov.cz/media/wp-content/uploads/2026/08/Metodika_prijimaci-rizeni_2026-2027.pdf | 5. 11. 2026 | shodné (viz Nezávislý přepočet) |
| Jednoznačné pořadí, pomocná kritéria, priorita jako pomocné kritérium, los | `rules.json` `shoda`; `matching.js` `TieError`; `index.html:72` | V422 § 19 odst. 2; metodika s. 6, 12 | PS-08 – https://www.zakonyprolidi.cz/cs/2023-422 | 5. 11. 2026 | shodné (aplikace shodu bez kritéria odmítne) |
| Způsob podání (DiPSy / tiskopis; výpis zrušen; registrační identifikátor ŠPZ) | `rules.json` `podani`; `index.html:226, 228` | § 60a odst. 3, § 60fa; dopis MŠMT | PS-09 | 5. 11. 2026 | shodné |
| Výsledky zveřejněním seznamu, bez písemného rozhodnutí a potvrzení; vzdání se | `rules.json` `vysledky` | § 60j odst. 5–6, § 60k, § 60n odst. 5 | PS-10 | 5. 11. 2026 | shodné |
| Odvolání 3 pracovní dny | `rules.json` `odvolani`; `index.html:94` pozn. | § 60l odst. 1 („ode dne zveřejnění výsledků“) | PS-11 | 5. 11. 2026 | shodné |
| 2. kolo s prioritami, 3. kolo bez omezení/priorit, jen tiskopis | `rules.json` `druhe-kolo`, `kolo3` | § 60m, § 60n odst. 6 | PS-12 | 5. 11. 2026 | shodné |
| Reforma „nejdřív testy, pak přihlášky“ pro 2027 neplatí | `rules.json` `reforma` (status `confirmed`) | žádný úřední dokument o změně pořadí pro 2026/2027; harmonogram drží únor → duben | PS-13 | 5. 11. 2026 | text správný; status „confirmed“ u negativního tvrzení – PRI-09 |
| Konzervatoře: přihlášky 1.–30. 11. 2026, TZ 4.–15. 1., náhradní 18.–29. 1., výsledky 8. 2. 2027 | `rules.json` `kons-*` (4 události) | V422 § 21a; harmonogram MŠMT (konzervatoře) | PS-14, PS-15 – https://msmt.gov.cz/media/wp-content/uploads/2026/08/Casovy-harmonogram_2026-2027.pdf | 5. 11. 2026 | shodné |
| Kritéria SŠ 15.–31. 1. 2027; v DiPSy od 1. 2. | `rules.json` `ss-kriteria` | V422 § 1; Průvodce CERMAT | PS-16 | 5. 11. 2026 | shodné |
| Přihlášky SŠ 1. 2.–22. 2. 2027 | `rules.json` `ss-prihlasky-start/-konec`; `index.html:229` | V422 § 2 (do 20. 2.) + § 31; 20. 2. 2027 je sobota → pondělí 22. 2. (můj výpočet, prepocet.txt F) | PS-17; harmonogram „1. – 20., resp. 22. 2.“ | 5. 11. 2026 | shodné |
| ŠPZ/TZ 15. 3.–23. 4. 2027 | `rules.json` `ss-skolni-zkousky` | V422 § 10 odst. 2; sdělení MŠMT | PS-18 – https://msmt.gov.cz/media/wp-content/uploads/2026/08/Sdeleni-o-terminech_2026-2027.pdf | 5. 11. 2026 | shodné |
| JPZ 4leté 12. a 13. 4. 2027 (po, út) | `rules.json` `jpz-1/2`; `index.html:61` | sdělení MSMT-525/2026-13: „pondělí 12. dubna 2027, úterý 13. dubna 2027“ | PS-19 | 5. 11. 2026 | shodné |
| JPZ víceletá gymnázia 14. a 15. 4. 2027 (st, čt) | `rules.json` `vg-1/2` | sdělení MŠMT | PS-20 | 5. 11. 2026 | shodné |
| Náhradní JPZ 29. a 30. 4. 2027; omluva do 3 pracovních dnů | `rules.json` `jpz-nahr-1/2`; `index.html:231` | sdělení MŠMT; ŠZ § 60h odst. 2 | PS-21 | 5. 11. 2026 | shodné |
| Náhradní ŠPZ/TZ 26. 4.–5. 5. 2027 (období od 24. 4. = sobota) | `rules.json` `skolni-nahradni` + pozn. | V422; harmonogram „24., resp. 26. 4. – 5. 5.“ | PS-22 | 5. 11. 2026 | shodné |
| Zpětvzetí do 4. 5. 2027 | `rules.json` `zpetvzeti` | harmonogram; ŠZ § 60b odst. 4 | PS-23 | 5. 11. 2026 | shodné |
| Rozřazení v DiPSy 11. 5., výsledky 1. kola 14. 5. 2027 | `rules.json` `rozrazeni`, `vysledky-1-kolo`; `index.html:94` | V422 § 19; harmonogram „Přijatí uchazeči dle DiPSy 11. 5.“, „Zveřejnění výsledků 14. 5.“ | PS-24, PS-25 | 5. 11. 2026 | shodné |
| 2. kolo: přihlášky 19.–24. 5., zkoušky 8.–14. 6., výsledky 22. 6. 2027; 3. kolo od 23. 6. | `rules.json` `kolo2-*`, `kolo3` | V422 § 22–23; harmonogram; Průvodce CERMAT | PS-26, PS-27 | 5. 11. 2026 | shodné |
| „Jistota“ na posledním místě nesníží šance výš | `strategy.js` text `no-safe`; `scenarios.js` scénář 2; `app.js:389` | metodika s. 13 („nenutí … ke strategizování“) | PS-28 | 5. 11. 2026 | shodné (vlastnost mechanismu potvrzena hrubou silou) |
| Svátky a víkendy u všech 22 termínů | – | žádný jednodenní termín nepřipadá na víkend/svátek (zákon 245/2000 Sb.); 1. 11. 2026 (neděle) a 31. 1. 2027 (neděle) jsou jen hranice období | vlastní výpočet, prepocet.txt F | 5. 11. 2026 | v pořádku |

Odkazy na zdroje v patičce i u pravidel: všech 6 adres vrací HTTP 200 a odpovídá názvu (PDF MŠMT/CERMAT, stránka CERMAT JPZ) – `zdroje.txt`.

## Nezávislý přepočet
Skripty `dukazy/skripty/prijimacky-bez-paniky-prepocet.mjs` (vlastní sekvenční odložené přijetí, hrubá síla přes všechna stabilní párování, svátky, kontrola .ics podle RFC 5545 – bez kódu aplikace) a `prijimacky-bez-paniky-porovnani.mjs` (import `matching.js`, `strategy.js`, `ics.js`, `scenarios.js`). Úplná tabulka 98 porovnání v `dukazy/prijimacky-bez-paniky/prepocet.txt` (2 běhy, výstup shodný). Obrazovka: `dukazy/prijimacky-bez-paniky/prohlizec.json` (2 běhy), snímky `vysledek-360.png`, `vysledek-1440.png`, `pokusy-360.png`, `chyba-360.png`, `strategie-360.png`, stažený `export.ics`.

| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|
| Z1 (zadání) | X 90 (A,B), Y 80 (A,B); kapacity 1 | X→A, Y→B | X→A, Y→B | — | ano |
| Z2 (zadání) | X 90 (B,A), Y 80 (A,B) | X→B, Y→A | X→B, Y→A | — | ano |
| Z3 (zadání) | X 90 (B,A), Z 85 (B,A), Y 80 (A) | X→B, Z→A, Y nepřijat (jediné stabilní párování) | X→B, Z→A, Y null; 2 kola, Y vytlačen Z | X→Průmyslovka (B), Z→Gymnázium (A), Y „v 1. kole nepřijat(a)“ – zadáno do formuláře, Krok i Přehrát (3,2 s), oba běhy | ano |
| Z3r (vlastní) | Z3 v opačném pořadí zadání uchazečů i škol | stejné | stejné | tlačítko „Zamíchat pořadí“: „výsledek zůstal stejný“ | ano |
| Z4 (zadání) | ČJL 30 a 35, M 28 a 20 | 63 b. | `bestOfTwo` 63 | „Započte se: 63 b.“ u Zuzky, scénář 3 | ano |
| Scénář „Priorita nepřebíjí body“ | 6 uchazečů, G 2 / P 1 / O 3 | Adam G, Bára G, Cyril O, Dana O, Eva P, Filip O | shodné = `EXPECTED` | — | ano |
| Scénář „Proč dát na 3. místo jistotu“ | 6 uchazečů, G 2 / P 2 / S 3 | Kuba nepřijat, Lucie S, ostatní G/P | shodné | — | ano |
| Scénář „Lepší výsledek ze dvou pokusů“ | 4 uchazeči s pokusy, G 1 / P 2 / O 2 | Hana G, Tomáš P, Věra P, Zuzka O | shodné | shodné (Přehrát do „Hotovo“, 3 kola), oba běhy | ano |
| V1 kapacita 0 | X 90 (A,B); A 0, B 1 | X→B | X→B; explain „škola nemá žádné volné místo“ | — | ano |
| V2 uchazeč bez priorit / V3 škola bez uchazečů / V14 bez uchazečů / V15 bez škol | — | null / A / {} / null | shodné | — | ano |
| V4 neznámá škola + duplicitní priorita | (Q, A, A, '', null) | A | A | — | ano |
| V5, V7, V8 shoda bodů (i shoda kritéria; i na 2. prioritě) | 80 = 80 | neplatný vstup | `TieError` | chybový pruh „Shoda pořadí: Bára a Cyril…“, Krok/Přehrát vypnuté (`chyba-360.png`) | ano |
| V6 shoda bodů s kritériem | tb 2 vs 5 | Q→A | Q→A | po doplnění kritéria 1/0 výsledek spočítán | ano |
| V9–V11 body 0, záporné, chybějící; kapacita 1,9 / −2 | — | chyba (0 = chybí); P→A; P→A, Q null | shodné | simulátor přijme −10, 150 i 85,5 bez hlášky (PRI-02) | ano |
| V12 `minScore` | A min 60; P 59, Q 60 | P→B, Q→A | shodné | — | ano |
| V13 řetězové vytlačení přes 3 školy | — | P A, Q B, R C, S null | shodné | — | ano |
| V16 5 uchazečů na kapacitu 2 / V17 63 b. vs 62 b. / V18 nemoc / V19 priorita jako jediný rozdíl | — | podle bodů | shodné | — | ano |
| N1–N200 náhodné instance (2–4 školy, 2–6 uchazečů, kapacity 0–2) | generátor seed 20261105 | sekvenční DA + hrubá síla (200×: právě 1 stabilní nebo uchazečsky optimální) | shodné; 4 permutace pořadí shodné; kapacita nepřekročena | — | 200/200 |
| P pokusy: nemoc, nikdo nepřišel, maximum, záporné, nečíselné | — | 75 / 0 / 100 / −1 / 20 | shodné | — | ano |
| T termíny: 22 událostí vs rejstřík; 20. 2. 2027 sobota → 22. 2.; 24. 4. 2027 sobota → 26. 4. | `rules.json` | shodné, žádný termín na víkend/svátek | — | kalendář: 22 událostí po zapnutí VG a konzervatoří | ano |
| S strategie: 60 b.; 75/62/58 | margin 5 | riziko, riziko, těsné; varování | shodné | „Riziko / Riziko / Těsné“ + „Žádná škola nemá rezervu aspoň 5 b.“ (`strategie-360.png`) | ano |
| S hranice 5/4/0/−1; rezerva 10 a 3; 0/0; 100/100; 150/−5 | — | jistota/těsné/těsné/riziko … | shodné | rezerva 10 + min 50 → „Spíš jistota“, varování zmizí | ano |
| I .ics z `buildICS` (22 událostí) | `rules.json` | 0 chyb RFC 5545 (CRLF, ≤ 75 oktetů, VERSION, PRODID, UID jedinečné, DTSTAMP UTC, DTSTART;VALUE=DATE, DTEND = den po konci) | 0 chyb | skutečné stažení `export.ics`: 12 253 B, 22 VEVENT, 0 chyb, shodné s výstupem modulu kromě DTSTAMP | ano |
| I DTEND přelom roku 31. 12. 2026 / 28. 2. 2028 / 29. 2. 2028 / 28. 2. 2027 / 1.–30. 11. | — | 20270101 / 20280229 / 20280301 / 20270301 / 20261201 | shodné | — | ano |
| **I `escapeText` se středníkem** | `a; b`; věta se „;“ a „,“ | `a\; b` (RFC 5545 §3.3.11) | `a; b` – středník neescapován, čárka ano | — | **ne – PRI-01** |
| I skládání řádků UTF-8 (title 6× věta, 300× Ř) | — | 0 chyb, text po rozbalení shodný | shodné | — | ano |

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|
| Cíl 1: srozumitelně vysvětlí, jak DiPSy rozřazuje podle bodů a priorit | splněno | `index.html:36–115` 5 kroků + animace + 12 pravidel se zdroji |
| Cíl 2: simulátor na modelové třídě krok za krokem, kdo kam a proč, změna pořadí/bodů | splněno | `app.js:31–366`; `vysledek-360.png` (log kol, „Výsledek a proč“), editor třídy a škol |
| Cíl 3: kalendář termínů 2027/2028 s exportem .ics | splněno | `app.js:418–456`, `ics.js`; `export.ics` 22 událostí; nadpis „Termíny 2026/2027“ s vysvětlením „nástup v září 2027“ |
| Cíl 4: kontrolní seznam před podáním přihlášky | splněno | `index.html:217–233` (11 bodů, obsahově shodné s PS-01, 02, 09, 17, 21) |
| „Aplikace NEPREDIKUJE přijetí… Vždy to napiš u simulátoru“ | splněno | `index.html:120` (`role=note` přímo pod nadpisem simulátoru), patička `index.html:238`, strategie `index.html:168` |
| Technologie: čisté HTML+CSS+JS (ES moduly), žádný build ani server | splněno | `index.html:11` `type=module`; žádný `package.json` build; `uvod-kontrola.json` jen 8 vlastních požadavků |
| Algoritmus v `matching.js` (čisté funkce), termíny a pravidla v `rules.json` se zdrojem | splněno | `matching.js` bez DOM (importovatelný v node – `prepocet.txt`); `rules.json` `sources`+`source` u každé položky, test `scenarios.test.js:17` |
| Testy `node --test`; nasazení GitHub Pages | splněno | `testy.txt` 25/25; živý web HTTP 200, soubory shodné s main (`zivy-web-vs-main.txt`), `zivy-kontrola.json` bez chyb |
| „Než začneš psát kód“: tabulka pravidlo → zdroj → datum; reforma ověřena; nepotvrzené nepoužít | částečně | tabulka existuje jen v podobě `rules.json` (zdroj a stav u každé položky, data zdrojů po měsících, u CERMAT jen „2026“); reforma řešena položkou `reforma`; žádná položka `unverified` |
| Algoritmus: odložené přijetí z pohledu uchazečů; kapacita a pořadí podle bodů; opakuje se, dokud se nic nemění; horší nepřeskočí lepšího | splněno | `matching.js:63–121`; `prepocet.txt` A, B, D (200/200, hrubá síla) |
| Body z JPZ: z každého předmětu lepší ze dvou pokusů | splněno | `matching.js:17–23`; „Započte se: 63 b.“ (`prohlizec.json` B) |
| Obrazovka 1: vysvětlení v 5 krocích s jednoduchou animací (bez knihoven, jen CSS/SVG) | splněno | `index.html:38–111`, `styles.css:108–158` (keyframes, `prefers-reduced-motion`) |
| Obrazovka 2: tabulka uchazečů (jméno, body, priority), školy (kapacita); Krok / Přehrát / Reset; 3 scénáře se zadanými názvy | splněno | `index.html:122–157`; `scenarios.js` tituly přesně dle zadání; tlačítka funkční vč. klávesnice (Enter na „Krok“ → „Kolo 1 z 2“) |
| Obrazovka 3: Moje strategie – tři školy a loňské minimum, upozornění, když žádná není „jistota“ | splněno (s výhradou PRI-04, PRI-07) | `strategy.js`, `index.html:165–198`; `strategie-360.png` |
| Obrazovka 4: kalendář + export .ics | splněno | viz Cíl 3 |
| Obrazovka 5: patička „Informativní pomůcka, závazné jsou informace CERMAT a škol“, zdroje | splněno | `index.html:238–241` (přesné znění), 6 zdrojů s odkazy, datum ověření |
| Kritéria: 4 testovací příklady (3× kapacita 1, 63 b.) | splněno | `tests/matching.test.js:7–47`; nezávisle Z1–Z4 shodné |
| Kritérium: stejný výsledek bez ohledu na pořadí zadání uchazečů | splněno | `matching.test.js:69` (všech 720 permutací); můj test 200 instancí × permutace; tlačítko „Zamíchat“ |
| Kritérium: .ics se otevře v Google Kalendáři i na iPhonu | částečně (neověřeno přímo) | soubor je platný podle RFC 5545 (0 chyb, 22 událostí, CRLF, VALUE=DATE); import do reálných kalendářů jsem neměl jak provést |
| Kritérium: web funguje na 360 px bez vodorovného posuvníku | splněno | přetékání `false` v 5 stavech na 360 px (`prohlizec.json`, `uvod-kontrola.json`, `zivy-kontrola.json`) |
| Kritérium: nic se neukládá ani neodesílá | splněno | 0 cizích požadavků, 0 ne-GET požadavků, `localStorage`/`sessionStorage`/cookies 0, zaškrtnutí seznamu po obnovení zmizí (`prohlizec.json` H) |
| Postup: na konci spustit testy a projít v prohlížeči 3 scénáře | splněno (ověřeno mnou) | `testy.txt`; scénáře 1 a 3 projité v prohlížeči, scénář 2 modulem + hrubou silou |

## Nálezy
### PRI-01 · Střední · 2 Výpočty · Generátor .ics neescapuje středník, test chybu zakonzervoval
- **Kde:** `ics.js:4` (`.replace(/;/g, '\;')` – v JS řetězci je `'\;'` jen `;`), `tests/ics.test.js:27–29`
- **Reprodukce:** `escapeText('a; b')` → očekáváno `a\; b` (RFC 5545 §3.3.11: v hodnotě TEXT musí být SEMICOLON, COMMA a BACKSLASH escapované; čárka i zpětné lomítko aplikace escapuje správně) → skutečnost `a; b`. `buildICS([{title:'Zkouška; termín, místo'…}])` dává `SUMMARY:Zkouška; termín\, místo` – nevalidní TEXT (`prepocet.txt` H, 2 běhy). Test `ics: escapování textu` očekává `'a\\, b\; c\\\\d\\ne'`, kde `\;` je opět jen `;`, takže chybu potvrzuje. V dnešních datech `rules.json` středník není, stažený `export.ics` je proto bez chyby.
- **Dopad na uživatele:** dnes žádný; jakmile se do názvu nebo poznámky termínu dostane středník (např. „Pozvánka 14 dní předem; náhradní 7 dní“), kalendář může událost odmítnout nebo text oříznout, a test to nezachytí.
- **Doporučená oprava:** `.replace(/;/g, '\\;')` a v testu očekávat `b\\; c`; přidat test `buildICS` s řetězcem obsahujícím `;` ověřený parserem.
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-02 · Střední · 5 Mobil a přístupnost · Číselná pole nehlídají rozsah ani platnost a nic nehlásí
- **Kde:** `app.js:21` (`num`), `app.js:107–108, 138–139, 150–151` (simulátor), `app.js:375–377` + `index.html:172, 185–193` (strategie); atributy `min`/`max` jsou jen v HTML, `validity` se nikde nečte
- **Reprodukce:** strategie, „Kolik bodů zhruba čekám (ze 100)“ = `150` (min 60) → očekáváno hláška „zadejte 0–100“ → skutečnost „o 90 b. nad loňským minimem – Spíš jistota“; `1 500` → „o 1440 b. nad…“; `-5` → „Riziko“. Simulátor: body `-10`, `150`, `85.5` → bez hlášky, uchazeč má „−10 b.“ / „150 b.“ / „85.5 b.“ (`validity.rangeOverflow/Underflow/stepMismatch = true`, nic se nezobrazí). Obě lokalizace, oba běhy (`prohlizec.json` C.nesmyslneBody, F).
- **Dopad na uživatele:** překlep (150 místo 50, 1 500) dá bez varování kategorii „Spíš jistota“ nebo nesmyslné pořadí v simulátoru; uživatel chybu nemusí odhalit.
- **Doporučená oprava:** po `input` číst `el.validity` (nebo omezit `num` na 0–100 celé body), zobrazit hlášku u pole (`aria-describedby`) a hodnotu mimo rozsah do výpočtu nepouštět; v simulátoru omezit body na 0–100 a pokusy 0–50 (`index.html` už má `max`).
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-03 · Střední · 5 Mobil a přístupnost · Desetinná čárka se v prohlížeči s jinou než českou lokalizací zahodí (62,5 → 625)
- **Kde:** `index.html:172` (`#exp`, `type=number`), `app.js:375`; stejně `min0–2` a body v simulátoru
- **Reprodukce:** Chromium `--lang=en-US`: napsat `62,5` do „Kolik bodů zhruba čekám“ (škola A, minimum 60) → očekáváno 62,5 b. a „Těsné“ (nebo hláška) → skutečnost hodnota `625`, `rangeOverflow`, zobrazeno „o 565 b. nad loňským minimem – Spíš jistota“. V `--lang=cs-CZ` prohlížeč čárku přijme (`62.5`, „o 2.5 b. nad – Těsné“). V simulátoru `85,5` → cs-CZ 85.5 b., en-US 855 b. Oba běhy (`prohlizec.json` F_cisla_en-US, F_cisla_cs-CZ).
- **Dopad na uživatele:** rodič s anglicky nastaveným prohlížečem (běžné na telefonech) dostane po zadání „62,5“ falešnou „Spíš jistotu“; projevuje se jen v neczeské lokalizaci (proto Střední).
- **Doporučená oprava:** použít `type=text inputmode=decimal` s vlastním parsováním („62,5“, „1 500“) nebo aspoň `step=0.5` a kontrolu `validity.rangeOverflow` s hláškou (viz PRI-02); u bodů JPZ stačí celá čísla – pak čárku odmítnout s vysvětlením.
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-04 · Střední · 6 Texty a citlivá témata · „Moje strategie“ porovnává body „ze 100“ s loňským minimem školy bez upozornění na stejnou škálu
- **Kde:** `index.html:171` („Kolik bodů zhruba čekám (ze 100)“), `index.html:167, 185` („loňské minimum bodů … na webu školy“), `strategy.js:14–19`
- **Reprodukce:** školy zveřejňují „minimum posledního přijatého“ různě – jen body JPZ (0–100), celkové body s vahou JPZ 60 % a vysvědčením (často také 0–100 nebo 0–150) nebo procenta; aplikace vyzve k JPZ bodům „ze 100“ a odečte od nich číslo ze školního webu bez dotazu, v jaké škále je. Příklad: škola uvádí celkové minimum 55 b. (JPZ přepočtená na 60 % + vysvědčení), uchazeč čeká 62 b. z JPZ → aplikace „o 7 b. nad – Spíš jistota“, přitom jeho celkový součet může být pod 55. Chování je deterministické (modul i obrazovka shodně), jde o chybějící vstupní podmínku, ne o výpočet.
- **Dopad na uživatele:** falešná „Spíš jistota“ může rodinu odradit od přidání skutečné jistoty na 3. místo; opačný směr jen zbytečně straší. Hodnotím Střední (aplikace opakovaně píše, že minimum je orientační a že nepredikuje; štítek je „Spíš jistota“), hranice s Vysokou je ale těsná – ponechávám skeptikovi.
- **Doporučená oprava:** u pole minimum napsat „zadejte ve stejné škále jako vaše očekávané body (nejlépe jen body z JPZ 0–100); pokud škola uvádí celkové body nebo %, přepočítejte nebo nepoužívejte“, případně přidat volbu škály; do varování `no-safe` nezasahovat.
- **Ověření:** reprodukováno 2× (čtení kódu a texty, prohlížeč E) · skeptik:

### PRI-05 · Střední · 4 Testy · Chybějí testy u důležitých větví a test .ics fixuje špatnou hodnotu
- **Kde:** `tests/matching.test.js`, `tests/strategy.test.js`, `tests/ics.test.js:27`
- **Reprodukce:** 25 testů prochází a pokrývají všechny 4 příklady ze zadání, permutace a stabilitu. Netestuje se: kapacita 0 (`deferredAcceptance` i `explain` „škola nemá žádné volné místo“), `minScore` (větev `reason: 'kriteria'`, `explain`), uchazeč bez priorit / škola bez uchazečů / prázdné vstupy, `rankApplicants` se shodou bez `tiebreak` (jen přes DA), `evaluateStrategy` s očekávanými body a žádnou školou (PRI-07), převod formulář → modul (`num`, prázdné body = 0, `simInput`), `buildICS` s textem obsahujícím `;` (viz PRI-01 – test naopak chybu potvrzuje). Mé vlastní případy V1–V19 tyto větve procházejí a shodují se, chyba tedy dnes není, ale regresi nic nezachytí.
- **Dopad na uživatele:** nepřímý – budoucí úprava algoritmu nebo exportu může projít testy a rozbít okrajové stavy.
- **Doporučená oprava:** doplnit testy pro kapacitu 0, `minScore`, prázdné vstupy, `explain`, `evaluateStrategy` bez škol a opravit očekávání v testu `escapeText` (`'a\\, b\\; c\\\\d\\ne'`).
- **Ověření:** reprodukováno 2× (čtení testů, `testy.txt`) · skeptik:

### PRI-06 · Nízká · 6 Texty a citlivá témata · Krok 2 uvádí termíny JPZ jen pro čtyřleté obory bez upřesnění
- **Kde:** `index.html:61` („Češtinu i matematiku píšete dvakrát (12. a 13. dubna 2027)“)
- **Reprodukce:** sdělení MŠMT: 4leté obory 12. a 13. 4., víceletá gymnázia 14. a 15. 4. 2027 (PS-19, PS-20); kalendář aplikace má oba termíny správně, obecný text v 5 krocích ale jmenuje jen první dvojici bez „čtyřleté obory“.
- **Dopad na uživatele:** rodič páťáka/sedmáka může z úvodu vyčíst špatný den; kalendář níž ho opraví.
- **Doporučená oprava:** „(čtyřleté obory 12. a 13. dubna, víceletá gymnázia 14. a 15. dubna 2027)“.
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-07 · Nízká · 6 Texty a citlivá témata · Varování „Žádná škola nemá rezervu“ a řádky „Škola 1–3“ se zobrazí dřív, než je zadaná jediná škola
- **Kde:** `strategy.js:26–29` (`no-safe` nevyžaduje vyplněnou školu), `app.js:379–389`
- **Reprodukce:** vyplnit jen „Kolik bodů zhruba čekám“ = 60 → očekáváno výzva k doplnění škol → skutečnost tři řádky „1. Škola 1 – Chybí údaje“ … a varování „Žádná škola nemá rezervu aspoň 5 b. nad loňským minimem. Zvažte přidat školu…“ (`prohlizec.json` E.pouzeBody, oba běhy; modul: `prepocet.txt` G „3 prázdné“ → no-safe = true).
- **Dopad na uživatele:** mate, než doplní školy; ke škodě nevede.
- **Doporučená oprava:** `no-safe` jen když aspoň jedna škola má zadané minimum (`rows.some(r => r.category !== 'nevim')`).
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-08 · Nízká · 2 Výpočty · Seznam „Výsledek a proč“ řadí uchazeče se shodnými body podle kritéria opačně než škola
- **Kde:** `app.js:314` (`(a.tiebreak ?? 0) - (b.tiebreak ?? 0)` – vzestupně), `matching.js:36` (`tb - ta` – vyšší kritérium je lepší)
- **Reprodukce:** scénář 1, Bára 85 b. kritérium 1, Cyril 85 b. kritérium 0 → očekáváno Bára před Cyrilem → skutečnost v seznamu Cyril před Bárou (`prohlizec.json` C.poKriteriu, oba běhy). Přiřazení je správné, jde jen o pořadí výpisu.
- **Dopad na uživatele:** kosmetické, může zmást při čtení „kdo byl lepší“.
- **Doporučená oprava:** řadit `compareApplicants` z `matching.js`.
- **Ověření:** reprodukováno 2× · skeptik:

### PRI-09 · Nízká · 1 Pravidla a data · Stav „confirmed“ u negativního tvrzení o reformě; data zdrojů v patičce v ISO tvaru
- **Kde:** `rules.json` `reforma` (`status: "confirmed"`), `app.js:460` (`(${s.date})` → „(2026-08-18)“, u CERMAT jen „(2026)“)
- **Reprodukce:** text pravidla je správný (harmonogram 2026/2027 drží únor → duben; PS-13), ale „Ověřeno v oficiálním zdroji“ u tvrzení „neplatí“ lze doložit jen absencí dokumentu, ne úředním zdrojem; patička zobrazuje „MŠMT – Metodický materiál … (2026-08-18)“ místo českého „18. 8. 2026“.
- **Dopad na uživatele:** žádný na čísla; drobná nepřesnost a nečeský formát.
- **Doporučená oprava:** u `reforma` doplnit poznámku „úřední harmonogram 2027 změnu neobsahuje; jde o záměr bez legislativního návrhu (stav k 5. 11. 2026)“; data zdrojů formátovat česky (nebo jen rok a měsíc).
- **Ověření:** reprodukováno 2× · skeptik:

## Neslité větve
Žádné (`git branch -a`: jen `main`, `origin/main`; žádný GitHub workflow – Pages z větve).

## Co se nepodařilo ověřit a předpoklady
- **Import `.ics` do Google Kalendáře a kalendáře iPhonu** (kritérium zadání) – nemám přístup k těmto službám; ověřeno jen podle RFC 5545 vlastním parserem (0 chyb u 22 událostí, skutečné stažení z prohlížeče). Oba kalendáře vyžadují VERSION, PRODID, UID, DTSTAMP a u celodenních událostí DTEND o den později – vše přítomno.
- **axe „color-contrast“ (serious) u štítku `.pupil.new .tag`** se objevil v obou bězích scénáře A, kdy axe běžel ~0,1 s po posledním kroku, tedy během animace `pop` (opacity 0 → 1, `styles.css:230`). Po doběhnutí animace hlásí axe 0 porušení (2 běhy, `axe-kontrast.txt`) a vypočtený kontrast #5a6675 na #dcebf7 je 4,81 : 1 (≥ 4,5). Považuji za artefakt měření, ne za nález; nejnižší kontrast v paletě je 4,53 : 1 (ok na ok-soft).
- **Předpoklad k shodě bodů:** aplikace odmítne vstup, kdykoli dva uchazeči uvádějící tutéž školu mají stejné body bez kritéria, i když by se o místo nikdy neutkali. Beru to jako správné čtení V422 § 19 odst. 2 (škola stanoví pořadí všech uchazečů) a má reference se chová stejně.
- **Reforma „nejdřív testy, pak přihlášky“:** vlastní pátrání jsem neopakoval, vycházím z rejstříku PS-13 (psp.cz, MŠMT, CERMAT prohledány 5. 11. 2026 bez nálezu).
- **Metodika MŠMT a Průvodce CERMAT** jsem nečetl celé; termíny a pravidla jsem potvrdil druhým zdrojem (sdělení MŠMT, harmonogram, ŠZ, V422 – `zdroje.txt`), citace stran přebírám z rejstříku.
- Testovací vstupy jsou smyšlené (X/Y/Z, modelové třídy ze scénářů); žádné skutečné školy ani osoby.
