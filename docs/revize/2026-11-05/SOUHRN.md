# Souhrn nezávislé revize 12 kalkulaček – 5. 11. 2026

Revizor: Claude Fable 5.1 v čistém sezení (kód nepsal). Skeptik: Opus v čistém kontextu u každého kritického a vysokého nálezu. Zdroje pravdy: `docs/zadani.md` pro požadavky a výhradně úřední zdroje pro čísla (rejstřík `pravidla.md`, 288 položek). Každá aplikace má zprávu `<repo>.md`, důkazy v `dukazy/<repo>/`, nezávislý přepočet v `dukazy/skripty/<repo>-prepocet.mjs` a opravný prompt v `opravy/<repo>.md`. Souhrnná stránka: `revize.html` (publikovaná také jako artefakt: https://claude.ai/artifact/PQPR15kcnX9co1WEYpe8Gj).

## 1. Verdikty a semafor (12 aplikací × 8 oblastí)

**Připraveno: 3** (Bydlometr, Přijímačky bez paniky, Dluhy) · **Opravit před sloučením: 9** · **Předělat: 0**. Nálezů celkem **136**: Kritická 1 · Vysoká 18 · Střední 61 · Nízká 56 (skeptik posoudil 20 nálezů: 18 potvrzeno, 1 nejisté, 1 vyvráceno a sníženo na Nízkou).

Oblasti: 1 Pravidla a data · 2 Výpočty · 3 Shoda se zadáním · 4 Testy · 5 Mobil a přístupnost · 6 Texty a citlivá témata · 7 Soukromí a bezpečnost · 8 Nasazení a větve. 🟢 nic nad Nízká · 🟡 nejvýš Střední · 🔴 Kritická nebo Vysoká.

| Kód | Aplikace | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | Verdikt | K | V | S | N |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| P48 | Plán48 (`plan48`) | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 1 | 5 | 3 |
| PEN | Penzijko kompas (`penzijko-kompas`) | 🔴 | 🔴 | 🟡 | 🟡 | 🔴 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 3 | 4 | 6 |
| EET | Mám EET? + OSVČ 2027 (`mam-eet`) | 🟡 | 🔴 | 🟡 | 🟡 | 🔴 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 2 | 7 | 5 |
| SPOT | Spot, nebo fix? (`spot-nebo-fix`) | 🔴 | 🟢 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 2 | 6 | 6 |
| BYD | Bydlometr (`bydlometr`) | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Připraveno** | 0 | 0 | 7 | 4 |
| SLV | Slevy 2027 (`slevy-2027`) | 🟡 | 🔴 | 🟢 | 🟡 | 🟡 | 🟢 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 2 | 5 | 4 |
| INF | Inflační kalkulačka (`inflacni-kalkulacka`) | 🟢 | 🟡 | 🟢 | 🟡 | 🔴 | 🟢 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 1 | 2 | 6 |
| PRI | Přijímačky bez paniky (`prijimacky-bez-paniky`) | 🟢 | 🟡 | 🟢 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Připraveno** | 0 | 0 | 5 | 4 |
| CES | Cestovní příkaz 2027 (`cestovni-prikaz`) | 🔴 | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 2 | 4 | 6 |
| VYP | Výpověď 2026 (`vypoved-2026`) | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🔴 | 🟢 | 🟢 | **Opravit před sloučením** | 1 | 1 | 3 | 4 |
| ROD | Rodičovská pro celou rodinu (`rodicovska`) | 🔴 | 🔴 | 🟡 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Opravit před sloučením** | 0 | 4 | 7 | 4 |
| DLU | Dluhy – exekuce, nebo oddlužení? (`kalkulator-dluhu`) | 🟡 | 🟡 | 🟢 | 🟡 | 🟡 | 🟡 | 🟢 | 🟢 | **Připraveno** | 0 | 0 | 6 | 4 |
| | **Celkem** | | | | | | | | | | **1** | **18** | **61** | **56** |

Společné všem 12 aplikacím: testy procházejí (`dukazy/<repo>/testy.txt`), živý web vrací HTTP 200 a soubory se shodují s `main` (`dukazy/zivy-web-vs-main.txt`), žádné přetékání na 360 px, žádné cizí síťové požadavky kromě Chart.js z cdnjs tam, kde to zadání povoluje, žádná analytika, žádný únik dat, žádný průchod `<img src=x onerror=alert(1)>` do stránky. Výpočet je ve všech aplikacích v samostatném modulu, který jde spustit bez stránky, proto žádná aplikace nespadá do verdiktu Předělat. Ani jedna z 12 aplikací ale neměla vlastní testy, které by odhalily nálezy níže; v sedmi případech test chybnou hodnotu naopak zakonzervoval.

### Kritické a vysoké nálezy (po skeptikovi)
- **P48-01** · Vysoká · Plán48 · Odpočet DPS krácen paušálně 20 400 Kč ročně místo po měsících; rada „mimořádně na penzijko“ nadhodnocená · skeptik: Potvrzeno
- **PEN-01** · Vysoká · Penzijko kompas · Konec transformovaného fondu 2036 (návrh) se počítá a píše jako fakt i v sadě „Platná pravidla 2026“ · skeptik: Potvrzeno
- **PEN-02** · Vysoká · Penzijko kompas · Desetinná čárka a tečka v polích `type=number` tiše mění hodnotu 100× nebo 1 000× · skeptik: Nejisté
- **PEN-03** · Vysoká · Penzijko kompas · Kontrast textu v dlaždicích srovnání 4,44:1 (WCAG 1.4.3, axe „serious“ ×4) · skeptik: Potvrzeno
- **EET-01** · Vysoká · Mám EET? + OSVČ 2027 · Chybí snížené minimum 25 % průměrné mzdy pro začínající OSVČ · skeptik: Potvrzeno
- **EET-02** · Vysoká · Mám EET? + OSVČ 2027 · axe „serious“: `aria-label` na `<rect>` bez role (WCAG 4.1.2) · skeptik: Potvrzeno
- **SPOT-01** · Vysoká · Spot, nebo fix? · Sazby D45d/D56d/D57d počítají s TDD6 místo TDD7, D61d s TDD7 místo TDD4 · skeptik: Potvrzeno
- **SPOT-02** · Vysoká · Spot, nebo fix? · Víkendová sazba D61d má nízký tarif i ve všední dny, úředně platí jen pátek 12:00 – neděle 22:00 · skeptik: Potvrzeno
- **SLV-01** · Vysoká · Slevy 2027 · Školkovné zůstane po změně roku narození dítěte (zastaralý stav formuláře) · skeptik: Potvrzeno
- **SLV-02** · Vysoká · Slevy 2027 · Daňové zvýhodnění se nekrátí u dítěte, které v roce 2027 dovrší 26 let (ani 18 let bez studia) · skeptik: Potvrzeno
- **INF-01** · Vysoká · Inflační kalkulačka · Aktivní záložka nesplňuje kontrast písma 4,5:1 (axe color‑contrast, serious) · skeptik: Potvrzeno
- **CES-01** · Vysoká · Cestovní příkaz 2027 · Cesta přes půlnoc se vždy dělí po dnech – chybí společné posouzení podle ZP § 163 odst. 4 · skeptik: Potvrzeno
- **CES-02** · Vysoká · Cestovní příkaz 2027 · Přívěs: povinné navýšení sazby o 15 % aplikace odmítá s nepravdivým odůvodněním · skeptik: Potvrzeno
- **VYP-01** · Kritická · Výpověď 2026 · Zdravotní výpovědní důvody podle znění do 31. 5. 2025: 12× „odstupné“ u § 52 písm. d), 0 Kč u písm. e), náhrada § 271ca vydávána za odstupné · skeptik: Potvrzeno
- **VYP-02** · Vysoká · Výpověď 2026 · U výpovědi podle § 52 písm. h) (a g) pro zvlášť hrubé porušení) aplikace ukáže plnou podporu a tvrdí, že způsob skončení podporu neovlivňuje · skeptik: Potvrzeno
- **ROD-01** · Vysoká · Rodičovská pro celou rodinu · Rodičovská končí měsíc před 3. narozeninami, měsíc dovršení 3 let se nepočítá · skeptik: Potvrzeno
- **ROD-02** · Vysoká · Rodičovská pro celou rodinu · Rodičovská podle aplikace nenáleží souběžně s mateřskou; zákon přiznává rozdíl už od měsíce narození · skeptik: Potvrzeno
- **ROD-03** · Vysoká · Rodičovská pro celou rodinu · Mateřská a otcovská trvající přes 1. leden se nepřepočítá podle nových redukčních hranic; strop RP z DVZ k nástupu · skeptik: Potvrzeno
- **ROD-04** · Vysoká · Rodičovská pro celou rodinu · Limit docházky dítěte do 2 let do jeslí 92 hodin místo 120 · skeptik: Potvrzeno

## 2. Top 10 oprav podle dopadu na uživatele

1. **VYP-01 (Kritická) – Výpověď 2026: zdravotní výpovědní důvody podle znění zákoníku práce do 31. 5. 2025.** Zaměstnanec s výpovědí podle § 52 písm. d) z běžných zdravotních důvodů vidí nárok na 12 platů (480 000 Kč při 40 000 Kč), který nemá; zaměstnanec s písm. e) vidí 0 Kč místo 12násobku (§ 67 odst. 3); u pracovního úrazu je plnění označeno jako odstupné místo náhrady podle § 271ca. Skeptik potvrdil. Opravný prompt `opravy/vypoved-2026.md`.
2. **ROD-02 – Rodičovská: příspěvek se nepočítá souběžně s mateřskou.** Zákon (§ 30b odst. 3 ZSSP) přiznává rozdíl od měsíce narození; rodiny s nízkou mateřskou nebo s mateřskou otce vidí v prvních měsících o tisíce až desetitisíce méně a checklist radí žádat pozdě, ač nárok na výplatu zaniká 3 měsíce zpětně.
3. **ROD-03 – Rodičovská: mateřská přes 1. leden bez přepočtu podle nových redukčních hranic (§ 22 odst. 2 ZNP).** U příjmů nad 1. redukční hranicí podhodnocení o jednotky tisíc až přes 19 000 Kč a nižší strop rodičovské.
4. **EET-01 – OSVČ 2027: chybí minimum 25 % průměrné mzdy pro začínající OSVČ (§ 14 odst. 5 ZPSZ).** Začínající živnostník dostane obrácené doporučení (paušál místo přiznání) a může přeplatit až 18 105 Kč ročně.
5. **SLV-02 – Slevy 2027: daňové zvýhodnění se nekrátí u dítěte, které dovrší 26 let (ani 18 let bez studia).** Rozdíl 11 403 Kč u jednoho dítěte; hrozí doměrek.
6. **SLV-01 – Slevy 2027: školkovné zůstane započtené po opravě roku narození dítěte.** Až 24 900 Kč neexistující slevy v souhrnu i kontrolním seznamu.
7. **P48-01 – Plán48: odpočet DPS krácen paušálně 20 400 Kč ročně místo po měsících (§ 15 odst. 7 ZDP).** Rada „mimořádně na penzijko“ doporučuje o 7 000 až 18 700 Kč víc, než je k vyčerpání limitu potřeba. Totéž pravidlo má Slevy 2027 (SLV-05, Střední).
8. **CES-01 – Cestovní příkaz: cesta přes půlnoc se nikdy neposoudí dohromady (§ 163 odst. 4 ZP).** Stravné pod zákonné minimum (např. 0 Kč místo 155 Kč, 236 místo 370 Kč).
9. **SPOT-01 + SPOT-02 – Spot, nebo fix?: špatné přiřazení tříd TDD (příloha č. 6 vyhl. 408/2015 Sb.) a nízký tarif D61d i ve všední dny.** Domácnosti s tepelným čerpadlem a přímotopem vidí spot o 1 % levnější, víkendová sazba podhodnocena asi o 1 226 Kč ročně.
10. **PEN-01 – Penzijko kompas: konec transformovaných fondů 2036 (jen sněmovní tisk 285) se počítá jako fakt i v sadě „Platná pravidla 2026“.** Účastník transformovaného fondu vidí o 30 % vyšší majetek pod štítkem „platí“.

Mimo pořadí, ale rychlé: **ROD-01** (měsíc 3. narozenin se nepočítá, § 30b odst. 1 písm. d)), **ROD-04** (92 místo 120 hodin v jeslích), **CES-02** (přívěs +15 % odmítán s nepravdivým textem), **VYP-02** (podpora po výpovědi pro zvlášť hrubé porušení, § 39 odst. 2 ZoZ), kontrast písma **PEN-03** a **INF-01**, `aria-label` na `<rect>` **EET-02**.

## 3. Nesoulad mezi aplikacemi (důležité před sloučením do jednoho webu)

| Pravidlo | Aplikace a hodnota | Úřední stav | Co sjednotit |
|---|---|---|---|
| Odpočet příspěvků na DPS | Plán48 a Slevy 2027: roční úhrn − 20 400 Kč; Penzijko kompas: (měsíční vklad − 1 700) × 12 | § 15 odst. 7 ZDP: část **měsíčního** příspěvku nad 1 700 Kč | společná funkce počítající po měsících (DP-12, P48-01, SLV-05) |
| Zaokrouhlení státního příspěvku DPS | Plán48 na celé Kč, Penzijko kompas na haléře | zákon zaokrouhluje jen příspěvek účastníka dolů (§ 14 odst. 4 ZDPS) | jedna konvence, rozdíl ≤ 0,50 Kč (DP-78) |
| Citace odpočtu „§ 15a ZDP“ | Plán48, Penzijko kompas (převzato ze zadání) | § 15 odst. 6–7 (limit), § 15a produkty, § 15b podmínky | opravit citace v UI, rules.json i README (P48-05, PEN-08) |
| Limit úroků z hypotéky 300 000 Kč | Bydlometr i Slevy 2027: „smlouvy do 2020 / od 2021“ | zákon 386/2020 Sb. čl. IV: bytová potřeba **obstaraná** před 1. 1. 2021 | shodná formulace a test (BYD-07, SLV-04) |
| Minimální mzda 2027 – zdroj | Slevy 2027: sdělení 171/2026 Sb.; Mám EET?: NV 164/2026 Sb. (jen koeficienty) | sdělení MPSV č. 171/2026 Sb. = 24 900 Kč | sjednotit zdroj (EET-08) |
| Průměrná mzda | Slevy/OSVČ: 51 663 Kč (NV 177/2026 Sb.) pro daně a pojistné; Výpověď: 48 171 Kč (sdělení 537/2025 Sb.) pro podporu 2026; Rodičovská: 48 967 Kč (NV 365/2025 Sb.) pro čistou mzdu 2026 bez sady 2027 | všechny tři hodnoty jsou úřední a slouží jinému účelu | ve společném webu vysvětlit, která „průměrná mzda“ k čemu slouží; doplnit ROD sadu 2027 |
| Návrh „Lepší penzijko“ (tisk 285) | Plán48: vekDo 17/29 včetně; Penzijko kompas: vekDo 18/30 bez; PEN používá konec TF 2036 i pro platná pravidla | návrh po 1. čtení 24. 9. 2026, výbory 29. 10. 2026 | jeden zápis pásem a štítek návrhu u všech odvozených hodnot (PEN-01) |
| Zdroje v `rules.json` | Bydlometr, Výpověď, Cestovní příkaz, Dluhy, Plán48, Penzijko kompas odkazují na kb.cz, banky.cz, hyponamiru.cz, epravo.cz, média; Slevy 2027, Mám EET?, Přijímačky, Rodičovská na předpisy a úřady | — | ve sloučeném webu odkazovat na zakonyprolidi.cz / e-Sbírku s číslem předpisu a paragrafu |
| Zpracování čísel ve formulářích | Bydlometr, Mám EET?, Výpověď, Dluhy, Inflace: `type=text` s vlastním parsováním (čárka funguje, tečka se čte jako desetinná → „40.000“ = 40 Kč); Penzijko kompas, Slevy, Spot/fix, Přijímačky, Cestovní příkaz, Rodičovská, Plán48: `type=number` (v česky lokalizovaném Chromiu čárka funguje, v en-US se zahodí → 100× až 1 000× vyšší hodnota) | — | jedna společná funkce pro český zápis čísel („1 500“, „1500,50“, „40.000“) s hláškou při neplatném vstupu |
| Rok 2027 | Rodičovská má redukční hranice 2027 a 400 000 Kč (zákon 152/2026 Sb.), ale popisuje je jako „schváleno Senátem“; Výpověď má 2027 jen předběžně (tisk 300 správně jako návrh); Cestovní příkaz 2027 = `null` (vyhláška nevyšla); OSVČ 2027 počítá 1. pásmo 9 662 Kč (podle vzorce § 14 odst. 3 ZPSZ 9 661 Kč, tabulka FS zatím není) | — | sjednotit značení „platí / schváleno / návrh / předběžně“ |

## 4. Opakující se problémy

- **Zadávání čísel bez kontroly a hlášky (11 z 12 aplikací).** Buď se desetinná čárka v anglicky lokalizovaném prohlížeči zahodí (PEN-02, SPOT-08, SLV-03, PRI-03, CES-03, ROD-08, P48-03, DLU-08), nebo se tečka v tisících čte jako desetinná (INF-03, VYP-03, DLU-04, EET-04). Skoro nikde není hláška pro záporné, prázdné a nesmyslné vstupy (PEN-04, SPOT-04, SLV-07, PRI-02, ROD-07, BYD-05). Pro společný web jde o jednu sdílenou funkci a jeden test.
- **Testy zakonzervovaly chybu (7 aplikací).** P48-02, PEN-07, SLV-06, PRI-05, CES-06, VYP-04, ROD-10: testy ověřují to, co kód dělá, ne to, co říká zákon. Příklady ze zadání procházejí všude, ale zadání samo bylo v několika bodech chybné (viz bod 6).
- **Starý výsledek zůstane na obrazovce po chybném vstupu (4 aplikace).** BYD-03, EET-05, ROD-07, SLV-01 (zastaralý stav formuláře).
- **Zdroje a citace.** Odkazy na neúřední weby místo předpisů (BYD-07, VYP-08, CES-08, P48-07, PEN-12), nepřesné citace paragrafů (P48-05, PEN-08, SLV-09, DLU-02 – zrušené NV 436/2022 Sb., BYD „§ 15 odst. 3“), nepravdivé tvrzení o nedostupnosti předpisů (CES-05), odkazy 404 (PEN-05).
- **Návrh nebo zastaralý stav legislativy v textu.** PEN-01 (konec TF 2036 jako fakt), ROD-06 (zákon 152/2026 Sb. popsán jako „schváleno Senátem“), PRI-09 (status „confirmed“ u negativního tvrzení). Naopak Výpověď (tisk 300) a obě penzijní aplikace u sazeb návrh správně štítkují.
- **Přístupnost.** Kontrast písma pod 4,5:1 (PEN-03, INF-01), `aria-label` bez role (EET-02), ztráta fokusu po odeslání (DLU-05), celý dotazník jako `aria-live` (SLV-11). Ostatní axe čisté.
- **Drobnosti napříč:** chybějící favicon s chybou 404 v konzoli (SPOT, BYD, CES, VYP, ROD, DLU), Chart.js bez SRI (PEN-11, INF-06), localStorage s osobními údaji bez tlačítka smazat (CES-07, ROD-14).

## 5. Chyby v zadání (`docs/zadani.md`), které se propsaly do aplikací

Zadání samotné se v této revizi nemění; opravy jsou na Davidovi. Podrobnosti v `pravidla.md` (sekce „Chyby v zadání“ u každé oblasti).

- **Výpověď 2026:** zadání omezuje odstupné na § 52 písm. a)–c) a pomíjí § 67 odst. 3 (12× u písm. e)) i § 271ca – aplikace mezeru vyplnila rozdělením písmen d)/e) platným do 31. 5. 2025 (VYP-01).
- **Rodičovská:** příklad „od 6. měsíce 8 000 Kč → 240 000 vyčerpáno, 110 000 propadne“ odporuje § 30b odst. 1 písm. d) (správně 248 000 / 102 000, ROD-01); „24 měsíců = 23 × 15 000 + 5 000“ odporuje § 30 odst. 6 (ROD-05); limit 120 hodin v jeslích chybí; 400 000 Kč je dnes zákon.
- **OSVČ 2027:** 1. pásmo 9 662 Kč a testy 115 944 / 132 744 Kč jsou z médií; podle vzorce zákona vychází 9 661 Kč (EET-03); minimální zálohy nejsou návrh, 35 % PM je v zákoně; chybí 25 % pro začínající OSVČ (EET-01).
- **Bydlometr:** „25 % jistiny“ (zákon: 25 % celkové výše úvěru); starší smlouvy měly bezplatné splacení ke konci fixace i v okně výročí už před novelou (BYD-02).
- **Cestovní příkaz:** „zaokrouhlení podle pravidel z vyhlášky“ – vyhláška žádná nemá, platí § 183 ZP; zadání nepočítá se změnami cen PHM během roku (aplikace to řeší správně).
- **Plán48 / Penzijko kompas:** „ověř proti § 15a ZDP“ – limit je v § 15 odst. 6–7; 680 Kč u návrhu je dopočet; poplatek za převod 800 Kč je zákonný strop, ne údaj ze sazebníku; konec TF 2036 bez označení návrhu.
- **Dluhy:** 3 525,37 místo 3 525,375 Kč; „kolem 2 200 Kč“ (přesně 2 178 Kč); doba splácení bez odečtu 50 Kč plátci mzdy. Přijímačky: termín přihlášek pro 2027 je 22. 2. 2027, zadání nezná listopadové přihlášky na konzervatoře.
- Zadání se u zákonných hodnot opírá skoro výhradně o média a poradenské weby; číselně bylo většinou správně, ale právě tam, kde ne (VYP, ROD, OSVČ), vznikly nejzávažnější chyby.

## 6. Doporučené pořadí oprav

1. `opravy/vypoved-2026.md` (jediný kritický nález; citlivé téma).
2. `opravy/rodicovska.md` (4 vysoké nálezy ve výpočtu dávek).
3. `opravy/mam-eet.md` (OSVČ 2027: obrácené doporučení pro začínající OSVČ; termín 11. 1. 2027 se blíží).
4. `opravy/slevy-2027.md` (lidé podepisují prohlášení v prosinci).
5. `opravy/plan48.md` (rada „do 31. 12.“ je nadhodnocená; termín konec roku).
6. `opravy/cestovni-prikaz.md`, `opravy/spot-nebo-fix.md`, `opravy/penzijko-kompas.md`, `opravy/inflacni-kalkulacka.md`.
7. Připravené aplikace lze sloučit hned; jejich střední nálezy (`opravy/bydlometr.md`, `opravy/prijimacky-bez-paniky.md`, `opravy/kalkulator-dluhu.md`) opravit při slučování.
8. Napříč: společná funkce pro čtení českých čísel + hlášky, společný formát zdrojů v `rules.json`, favicon, SRI u Chart.js.

## 7. Co nebylo ověřeno a proč

- **psp.cz** jde číst jen nástrojem WebFetch (curl spojení nenaváže); stav tisků 285, 300, 198 byl ověřen tímto způsobem. **uradprace.cz** a **vzp.cz** nebyly dostupné; porovnání Výpovědi s kalkulačkou ÚP se nepodařilo (3 pokusy). **e-sbirka.gov.cz** se skládá v prohlížeči; čísla předpisů byla ověřena na zakonyprolidi.cz a e-Sbírka jen odkazem.
- **Úřední tabulka paušálních záloh 2027** (FS) a částky ČSSZ/VZP pro 2027 zatím nevyšly; 1. pásmo 9 661 vs. 9 662 Kč zůstává „neověřeno úřední tabulkou“ (EET-03 proto jen Střední).
- **Vyhláška o cestovních náhradách pro rok 2027** nevyšla (ročník 2026 Sbírky do č. 213); aplikace to řeší správně.
- **Lokalizace prohlížeče:** chování desetinné čárky ověřeno jen v Chromiu (cs-CZ i en-US), ne ve Firefoxu a Safari; skutečné mobilní zařízení a čtečka obrazovky nebyly k dispozici (jen axe a emulace 360 px).
- **GitHub Actions** (Spot/fix denní aktualizace, Inflace měsíční aktualizace): skripty běží lokálně nanečisto, běhy na GitHubu nešlo doložit (API 403). Rodičovská a Dluhy nasazují přes vlastní workflow Pages; `package.json` Rodičovské není na živém webu (bez vlivu).
- **Úřední kalkulačky státu mají vlastní rozpory:** exekuce.justice.cz nabízí variantu „2026 od 1. 10.“ se životním minimem 5 500 Kč bez opory v NV 595/2006 Sb. § 4; kalkulátor splátek insolvence.justice.cz používá hranici 1 × 16 590 Kč místo 1,9 ×. Aplikace Dluhy počítá podle nařízení správně, měla by ale na rozdíl upozornit (DLU-03).
- **Tržní výchozí hodnoty** (sazby hypoték, ceny bytů, nájmy, výnosy fondů, inflace v projekcích) nemají úřední zdroj; kontrolováno jen označení a datum. Odkazy na sazebníky a média v `rules.json` aplikací byly z prostředí často nedostupné (proxy), hodnoty byly ověřeny z předpisů.
- **Mimo rozsah revize** (jen poznámka): zadání počítá s aplikacemi *Zdaním to?* a *Volno 2027*, které neexistují; společný web a jeho design nebyly hodnoceny.

## 8. Kontroly před odevzdáním

- Namátkově zopakovány v novém procesu: P48-01 (`odpocet` → dpsCast 20 600 Kč místo 28 300 Kč), CES-02 (`spocitejCestu` s `prives: true` → výjimka místo 678,50 Kč), ROD-04 (`rules.json` `jesleHodinMesicne: 92`). Všechny trvají.
- Odkazy v `pravidla.md`: 181 adres, 172 odpovídá HTTP 200, 2 přesměrování; 6 adres psp.cz nejde z curl (ověřeny přes WebFetch); 3 adresy jsou šablony s proměnnou částí (OTE, ČEZ ceníky) a odpovídají až po dosazení.
- Počty nálezů v tabulce výše se shodují s hlavičkami všech 12 zpráv (`dukazy/skripty/nalezy-export.mjs`: „počty sedí“ u všech).
- `git diff --stat main...revize/2026-11-05` mění jen `docs/revize/2026-11-05/`; všech 12 klonů aplikací má čistý `git status`, nikam se nepushovalo.
