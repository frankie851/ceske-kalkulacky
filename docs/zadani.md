# Český trh a návrh webové aplikace pro Claude Code

Nov 4, 2026 · @David

## Shrnutí

Doporučuji postavit **Plán48** – bezplatnou českou kalkulačku, která každému spočítá, kolik a kam poslat (penzijko, DIP, životní pojištění), aby vytěžil celý státní příspěvek i odpočet 48 000 Kč, a kolik ještě vložit do 31. 12. Druhá vrstva ukáže, co se změní, pokud projde reforma „Lepší penzijko“ od roku 2027.

- **Poptávka je velká a sezónní:** penzijko má zhruba 3,9 milionu lidí, DIP přes 265 tisíc smluv a vklady se každý rok hromadí v prosinci.
- **Mezera:** existují jen dílčí kalkulačky (státní příspěvek zvlášť, odpočet zvlášť); kombinovaný plán „co udělat do konce roku“ se scénářem 2027 chybí.
- **Jednoduchost:** čistá matematika nad zákonnými parametry, žádný server ani databáze – stejný typ statického webu, jaký už stavíš u InvestWebu.

Výklad „českého trhu“ jsem pojal jako spotřebitelský a digitální trh v ČR (co lidé online dělají a co je teď pálí). Záložní nápady jsou v sekci Mezery na trhu.

## Český digitální trh v číslech

Česko je silně online a finance řeší přes internet: 78 % lidí nad 16 let používá internetové bankovnictví, takže finanční nástroj na webu není pro běžného Čecha nic cizího.

| Ukazatel | Hodnota | Rok | Zdroj |
| --- | --- | --- | --- |
| Lidé 16+ používající internet | 89 % (7,7 mil.) | 2025 | [ČSÚ](https://csu.gov.cz/vykazy/vyberove_setreni_o_informacnich_a_komunikacnich_technologiich_v_domacnostech_a_jejich_vyuzivani_jednotlivci) |
| Lidé 16+ s chytrým telefonem | 86 % | 2025 | [ČSÚ](https://csu.gov.cz/ict-v-domacnostech-a-uzivatele-ict) |
| Internetové bankovnictví | 78 % | 2025 | [ČSÚ](https://csu.gov.cz/ict-v-domacnostech-a-uzivatele-ict) |
| Nákupy přes internet | 68 % | 2025 | [ČSÚ](https://csu.gov.cz/ict-v-domacnostech-a-uzivatele-ict) |
| Nástroje umělé inteligence | třetina populace 16+ | 2025 | [ČSÚ](https://csu.gov.cz/produkty/digitalni-dovednosti-v-cesku-jsou-nad-prumerem-eu) |
| Elektronická identita při jednání s úřady | 32 % (49 % ve věku 35–44) | 2025 | [ČSÚ](https://csu.gov.cz/produkty/digitalni-dovednosti-v-cesku-jsou-nad-prumerem-eu) |
| Obrat e-shopů | 206 mld. Kč, +6 % | 2025 | [Seznam Zprávy / APEK](https://www.seznamzpravy.cz/clanek/ekonomika-obrat-e-shopu-v-cesku-loni-mezirocne-vzrostl-o-sest-procent-na-206-miliard-korun-296214) |
| Růst e-commerce | +5,3 % | 1. pol. 2026 | [BusinessInfo / APEK](https://www.businessinfo.cz/clanky/e-commerce-2026-plny-kosik-neznamena-vzdy-dobry-byznys/) |
| Online zákazníci, kteří při nákupu použili AI | zhruba polovina | 2026 | [BusinessInfo / APEK](https://www.businessinfo.cz/clanky/e-commerce-2026-plny-kosik-neznamena-vzdy-dobry-byznys/) |

E-commerce je velký, ale obsazený trh (Heureka, Zboží.cz, velké e-shopy). Pro jednoduchou aplikaci od jednoho člověka jsou zajímavější úzké, česky specifické problémy, kde stačí dobře spočítat pravidla, která lidé neznají.

## Co Čechy právě pálí a co se mění

Nejvíc nových, nepřehledných pravidel přichází v penzijním spoření a daních od roku 2027; tam lidé nejvíc potřebují něco, co jim to spočítá.

| Oblast | Co se děje | Příležitost pro aplikaci |
| --- | --- | --- |
| Penzijní spoření | Vláda 24. 8. 2026 schválila „Lepší penzijko“: lidé do 30 let mají dostat 40% státní příspěvek (max. 680 Kč měsíčně při vkladu 1 700 Kč), děti příspěvek už od 100 Kč, poplatek za správu strop 0,5 % ([Echo24](https://www.echo24.cz/a/HF2qp/zpravy-ekonomika-vlada-schvalila-zmenu-pravidel-penzijniho-sporeni)). Sněmovna návrh podpořila v 1. čtení 24. 9. 2026 ([Blesk](https://www.blesk.cz/clanek/848986)); platit má od 2027, zákonem zatím není. | Kalkulačka „dnes vs. od 2027“ podle věku |
| DIP a odpočet 48 000 Kč | DIP má přes 265 tisíc smluv (srpen 2026); zná ho 73 % Čechů, ale sjednaný ho má jen každý desátý ([FXstreet](https://www.fxstreet.cz/klicova-slova+dip.html)). Limit 48 000 Kč je společný pro penzijko, DIP, životní a dlouhodobou péči ([money.cz](https://money.cz/novinky-a-tipy/?p=15884)). | Optimalizace mixu produktů a vklad do 31. 12. |
| EET 2.0 | Zákon prošel 9. 9. 2026 přehlasováním Senátu a podepsal ho prezident; evidence se vrací od 1. 1. 2027 ([Průvodce podnikáním](https://www.pruvodcepodnikanim.cz/?mesic=12&rok=2024)). Podle MF se zvýší daňová složka paušální daně pro osvobozené živnostníky ze 100 na 1 500 Kč měsíčně ([ČTK](https://www.ceskenoviny.cz/zpravy/2819962)). | Průvodce „týká se mě EET?“ pro OSVČ |
| Elektřina | Od 1. 1. 2026 zmizel poplatek na obnovitelné zdroje, ceny klesly zhruba o 10 % ([BusinessInfo / ERÚ](https://www.businessinfo.cz/clanky/od-ledna-2026-nizsi-ceny-elektriny-pro-domacnosti-a-firmy-eru-vydal-zmenovy-cenovy-vymer/)); na jaře ceny po krizi v Hormuzském průlivu vyskočily o 20–25 % a o dynamických tarifech lidé moc nevědí ([Echo24](https://www.echo24.cz/a/H3cCC/zpravy-ekonomika-ceske-domacnosti-uspory-energii-nove-trendy-v-energetice-cez-ipsos-analyza)). | Kalkulačka spot / fix / dynamický tarif |
| Bydlení | Téměř 88 % lidí bez vlastního bydlení čeká, že to bude ještě těžší; průměrná hypotéka 4,6 mil. Kč při sazbě 5,32 % (srpen 2026) ([ČTK / Generali](https://www.ceskenoviny.cz/zpravy/2894519)). | Velká bolest, ale přeplněný trh bankovních kalkulaček |

## Mezery na trhu a hodnocení nápadů

Penzijní plánovač vychází nejlépe: velká poptávka s jasným termínem, nízká náročnost a žádná externí data. Kalkulačka tarifů elektřiny je silná dvojka, ale potřebuje denní data z burzy a distribuční ceníky.

| Nápad | Poptávka | Konkurence | Náročnost stavby | Data | Hlavní riziko |
| --- | --- | --- | --- | --- | --- |
| **Plán48 – penzijko + DIP + odpočet** | Vysoká, miliony smluv, prosincová vlna | Jen dílčí kalkulačky (např. [Měšec](https://www.mesec.cz/kalkulacky/statni-prispevek-penzijko/), [E15](https://www.e15.cz/kalkulacky/kalkulacka-danovy-odpocet-za-zivotni-pojisteni-a-penzijni-sporeni-2026-1411844)) | Nízká, statický web | Zákonné parametry, ručně | Změna zákona → parametry v jednom souboru |
| Spot / fix / dynamický tarif | Střední, lidé přeplácejí | Srovnávače energií, dodavatelé | Střední až vysoká | Hodinové ceny OTE + ceníky distributorů | Nepřesný odhad spotřeby |
| EET 2.0 a paušál pro OSVČ | Střední, termín 1. 1. 2027 | Web MF, účetní blogy | Nízká | Text zákona | Vypadá jako právní rada |
| Dostupnost bydlení / hypotéka | Velmi vysoká | Každá banka a srovnávač | Nízká | Sazby bank | Nerozlišíš se |
| AI nákupní rádce | Roste | Heureka, Zboží.cz | Vysoká | Feedy e-shopů | Bez dat nefunguje |

## Doporučená aplikace: Plán48

Plán48 odpoví na jednu otázku: „Kolik peněz nechávám státu na stole a co s tím mám udělat do konce roku?“ Vše běží v prohlížeči, nic se neukládá na server.

**Vstupy (jedna obrazovka):** věk; daňová sazba 15 % (přepínač 23 % pro vysoké příjmy); měsíční vklad na penzijko, DIP a životní pojištění; příspěvek zaměstnavatele; kolik už letos odešlo.

**Výstupy:**

1. Státní příspěvek za rok a o kolik přicházíš (vklad pod 500 Kč = nula, max. 340 Kč při 1 700 Kč měsíčně).
2. Využitý odpočet z limitu 48 000 Kč a daňová úspora (max. 7 200 Kč při 15 %).
3. Konkrétní krok: „Do 31. 12. vlož X Kč mimořádně na DIP“ nebo „Navyš penzijko na 1 700 Kč“.
4. Přepínač **Pravidla 2026 / Návrh 2027**: pro lidi do 30 let ukáže 40% příspěvek (až 8 160 Kč ročně, viz [Energozrouti](https://energozrouti.cz/clanek/mladi-do-30-let-maji-od-statu-dostavat-8160-kc-rocne)) s jasným štítkem „zatím jen návrh“.
5. Graf projekce úspor do 60 let s nastavitelným výnosem a poplatkem.

**Kontrolní příklady pro testy** (z [money.cz](https://money.cz/novinky-a-tipy/?p=15884)): penzijko 5 700 Kč měsíčně → odpočet 48 000 Kč; penzijko 3 000 Kč + životní pojištění 2 500 Kč → odpočet 15 600 + 30 000 = 45 600 Kč; DIP 4 000 Kč měsíčně → odpočet 48 000 Kč.

**Hlídat v pravidlech:** u DIP vzniká nárok na odpočet jen při trvání aspoň 10 let a výběru nejdřív v 60 letech ([E15](https://www.e15.cz/dip-sporeni-duchod-2024)); starobní důchodci státní příspěvek nedostávají; příspěvek zaměstnavatele se do odpočtu nepočítá.

**Monetizace (volitelně):** affiliate odkazy na poskytovatele DIP vždy s označením, nebo zdarma jako vstupní brána do tvého obsahu (StocksAnalysis, InvestWeb). Na webu musí být viditelně „nejde o investiční ani daňové poradenství“.

**Rizika:**

- Zákon se mění → všechny částky v jednom souboru `rules.json` s datem platnosti.
- Chyba ve výpočtu poškodí důvěru → automatické testy na příklady výše.
- Konkurence okopíruje funkce → náskok dává rychlost (spuštění do prosince) a scénář 2027.

## Zadání pro Claude Code

Nejrychlejší cesta: nová prázdná složka `plan48`, v Claude Code nejdřív plan mode (Opus), po schválení plánu provedení. Prompt níže zkopíruj celý; pokud chceš i SPEC, PLAN a CLAUDE.md, pusť na něj svůj skill prompt-architekt.

```markdown
# Úkol: Plán48 – česká kalkulačka penzijka, DIP a daňového odpočtu

## Cíl
Statický web v češtině, který uživateli spočítá státní příspěvek k doplňkovému
penzijnímu spoření (DPS), daňový odpočet z limitu 48 000 Kč (DPS + DIP + životní
pojištění) a řekne mu, kolik má ještě vložit do 31. 12., aby nic nepropásl.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Graf: Chart.js z CDN (cdnjs).
- Výpočty v samostatném modulu `calc.js` bez vazby na DOM.
- Všechny zákonné parametry v `rules.json` (sady "2026" a "navrh2027", u každé datum
  a zdroj). V kódu nesmí být žádné natvrdo zapsané částky.
- Testy: vestavěný `node --test` nad `calc.js`.
- Nasazení: GitHub Pages (návod v README).

## Pravidla výpočtu (ověř proti § 15a zákona o daních z příjmů a zákonu o DPS)
- Státní příspěvek DPS: vklad < 500 Kč/měs = 0; 500–1 700 Kč = 20 % vkladu;
  nad 1 700 Kč = 340 Kč. Nárok nemá poživatel starobního důchodu.
- Návrh 2027: do 30 let 40 % (max. 680 Kč), u nezletilých nárok od 100 Kč.
  V UI vždy štítek "návrh, zatím neschváleno".
- Odpočet DPS: jen část vkladů nad 1 700 Kč měsíčně. DIP a životní pojištění od
  první koruny. Součet max. 48 000 Kč za rok. Příspěvek zaměstnavatele se nepočítá.
- Daňová úspora = odpočet × sazba (15 %, přepínač 23 %).

## Obrazovka
1. Formulář: věk, sazba daně, měsíční vklad DPS / DIP / ŽP, příspěvek
   zaměstnavatele, počet měsíců, které už letos proběhly.
2. Výsledek: státní příspěvek za rok, využitý a nevyužitý odpočet, daňová úspora,
   jedna věta "Co udělat do 31. 12.".
3. Přepínač Pravidla 2026 / Návrh 2027.
4. Graf projekce úspor do 60 let (výnos a poplatek nastavitelné).
5. Patička: "Nejde o investiční ani daňové poradenství" + odkazy na zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - DPS 5 700 Kč/měs → odpočet 48 000 Kč, úspora 7 200 Kč
  - DPS 3 000 + ŽP 2 500 Kč/měs → odpočet 45 600 Kč
  - DPS 400 Kč/měs → státní příspěvek 0
  - věk 25, návrh 2027, DPS 1 700 Kč/měs → příspěvek 8 160 Kč/rok
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Žádná data neodcházejí ze stránky (žádné analytiky bez souhlasu).
- README česky: jak spustit lokálně, jak upravit `rules.json`, jak nasadit.

## Postup
Nejdřív navrhni strukturu souborů a výpočetní model a počkej na schválení.
Pak piš testy, potom `calc.js`, nakonec UI. Na konci spusť testy a otevři
stránku v prohlížeči a zkontroluj ji na šířce 360 px.
```

Když je hotovo, zkontroluj ručně aspoň dva výsledky proti kalkulačkám [Měšce](https://www.mesec.cz/kalkulacky/statni-prispevek-penzijko/) a [E15](https://www.e15.cz/kalkulacky/kalkulacka-danovy-odpocet-za-zivotni-pojisteni-a-penzijni-sporeni-2026-1411844), než web pošleš dál.

## Zadání pro Claude Code: Penzijko kompas

Penzijko kompas je druhá aplikace, jen na penzijní spoření. Plán48 řeší „co udělat do konce roku“ napříč produkty; Kompas řeší dlouhodobé rozhodnutí uvnitř penzijka: který fond, kolik sežerou poplatky, co s transformovaným fondem a co přinese reforma podle věku.

**Podklady, ze kterých prompt vychází:**

- **Poplatky dnes:** akciové, vyvážené a dluhopisové účastnické fondy 1,0 % ročně + 15 % ze zhodnocení; povinný konzervativní 0,4 % + 10 %; transformovaný fond 0,8 % + 10 % ze zisku ([sazebník KB Penzijní](https://www.kb.cz/getmedia/c272ceaa-21af-4b06-9b4e-e45b6b00845b/sazebnik-ps.pdf), obdobně [Conseq](https://www.conseq.cz/getmedia/b7b9cd9e-104a-4d11-bd9b-13c7488511c1/Zenit-SDPS-SGDS-C2201.pdf.aspx?ext=.pdf)).
- **Návrh 2027:** poplatek za správu strop 0,5 %, výkonnostní poplatek u většiny fondů zmizí, výchozí strategie životního cyklu, transformované fondy skončí 31. 12. 2036 a zbylí klienti přejdou do konzervativního fondu ([Echo24](https://www.echo24.cz/a/HF2qp/zpravy-ekonomika-vlada-schvalila-zmenu-pravidel-penzijniho-sporeni)).
- **Stav reformy:** Sněmovna ji podpořila v 1. čtení 24. 9. 2026 ([Blesk](https://www.blesk.cz/clanek/848986)); o 2. nebo 3. čtení jsem k 4. 11. 2026 zprávu nenašel.
- **Přechod z transformovaného fondu:** jde jen do účastnického fondu téže penzijní společnosti ([ČNB](https://www.cnb.cz/cs/dohled-financni-trh/legislativni-zakladna/stanoviska-k-regulaci-financniho-trhu/RS2013-04)), teprve pak ke konkurenci; převod k jiné společnosti stojí 800 Kč, pokud smlouva trvá méně než 5 let ([sazebník NN](https://airbank.cz/file-download/informace-o-pobidkach-a-sazebnik)).
- **Výchozí předpoklady výnosů:** akcie 7,5 %, dluhopisy 4,0 %, peněžní trh 2,5 %, inflace 2,5 % ročně, tak jak je použilo MF ve svém modelu ([prezentace MF](https://mf.gov.cz/assets/attachments/2026-06-03_Prezentace-Lepsi-penzijko-3-vyhody-nejvetsiho-zlepseni-penzijniho-sporeni-v-historii_v02.pdf)).

```markdown
# Úkol: Penzijko kompas – kalkulačka doplňkového penzijního spoření

## Cíl
Statický web v češtině, který člověku s penzijkem (nebo bez něj) odpoví na čtyři otázky:
1. Kolik mi stát přidá teď a kolik od roku 2027, pokud projde reforma "Lepší penzijko"?
2. Kolik budu mít v 65 letech v různých fondech a kolik z toho sežerou poplatky?
3. Mám zůstat v transformovaném fondu, nebo přejít do účastnického?
4. Co mám konkrétně udělat (navýšit vklad, změnit fond, říct si o příspěvek zaměstnavatele)?

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Graf: Chart.js z CDN (cdnjs).
- Výpočty v modulu `calc.js` bez vazby na DOM.
- Všechny parametry v `rules.json`: sady "2026" a "navrh2027" (každá s datem a zdrojem)
  a sada "fondy" (typ fondu, poplatek za správu %, poplatek ze zhodnocení %, výchozí výnos %).
  V kódu nesmí být natvrdo zapsané částky ani sazby.
- Testy: vestavěný `node --test` nad `calc.js`.
- Nasazení: GitHub Pages (návod v README).

## Pravidla (ověř proti zákonu č. 427/2011 Sb. a § 15a zákona o daních z příjmů)
- Státní příspěvek 2026: vklad < 500 Kč/měs = 0; 500–1 700 Kč = 20 %; nad 1 700 Kč = 340 Kč.
  Poživatel starobního důchodu nemá nárok.
- Návrh 2027: do 30. narozenin 40 % (max. 680 Kč/měs); nezletilí mají nárok už od 100 Kč/měs.
  U všeho z návrhu v UI štítek "návrh, zatím neschváleno".
- Odpočet od základu daně: jen vklady nad 1 700 Kč/měs, max. 48 000 Kč/rok společně s DIP
  a životním pojištěním (v této aplikaci jen informativně, plný výpočet dělá Plán48).
- Příspěvek zaměstnavatele se do státního příspěvku ani odpočtu nepočítá.
- Poplatky: poplatek za správu se strhává měsíčně z průměrného zůstatku; poplatek ze
  zhodnocení zjednodušeně jen z kladného ročního výnosu. Zjednodušení napiš do patičky.
- Návrh 2027: poplatek za správu strop 0,5 %, bez poplatku ze zhodnocení.
- Transformovaný fond: končí 31. 12. 2036, pak převod do konzervativního fondu. Přechod jen
  do účastnického fondu téže společnosti; převod ke konkurenci 800 Kč, trvá-li smlouva < 5 let.
- Strategie životního cyklu: do 45 let 100 % akcie, pak lineárně dolů na 20 % akcií v 65 letech
  (zbytek dluhopisy). Je to předpoklad aplikace, ne zákon – v UI to tak označ.

## Obrazovky
1. Formulář: věk, měsíční vklad, příspěvek zaměstnavatele, dosavadní zůstatek, typ fondu
   (transformovaný / konzervativní / vyvážený / akciový / životní cyklus), poplatky fondu
   (předvyplněné podle typu, lze přepsat), délka smlouvy v letech.
2. Výsledek "Stát ti přidá": měsíčně a ročně, pravidla 2026 vedle návrhu 2027.
3. Graf "Kolik budeš mít v 65": čára pro každý typ fondu, reálně (po inflaci) i nominálně.
4. Karta "Poplatky tě stojí": rozdíl v 65 letech mezi dnešními poplatky a stropem 0,5 %.
5. Karta "Transformovaný fond" (jen když ho uživatel má): srovnání zůstat vs. přejít a postup
   ve 3 krocích.
6. "Co udělat": max. 3 konkrétní kroky seřazené podle přínosu v Kč.
7. Patička: "Nejde o investiční poradenství", předpoklady výnosů, odkazy na zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - věk 35, pravidla 2026, vklad 1 700 Kč → příspěvek 340 Kč/měs, 4 080 Kč/rok
  - věk 35, pravidla 2026, vklad 400 Kč → příspěvek 0
  - věk 25, návrh 2027, vklad 1 700 Kč → 680 Kč/měs, 8 160 Kč/rok
  - věk 10, návrh 2027, vklad 100 Kč → 40 Kč/měs
  - věk 35, vklad 3 000 Kč/měs → odpočet 15 600 Kč/rok
  - zůstatek 100 000 Kč, výnos 0 %, poplatek 1 % ročně, bez vkladů, 10 let → cca 90 438 Kč
    (tolerance 0,5 %)
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Žádná data neodcházejí ze stránky; nic se neukládá mimo prohlížeč.
- README česky: spuštění, úprava `rules.json` při změně zákona, nasazení.

## Postup
Nejdřív navrhni strukturu souborů, výpočetní model a podobu `rules.json` a počkej na
schválení. Pak testy, potom `calc.js`, nakonec UI. Na konci spusť testy, otevři stránku
v prohlížeči, zkontroluj ji na šířce 360 px a vypiš seznam předpokladů, které jsi musel zvolit.
```

Obě aplikace mohou sdílet `calc.js` a `rules.json`. Pokud je chceš mít na jednom webu, stačí Claude Code na konci napsat, ať z Kompasu udělá druhou záložku Plánu48.

## Zadání pro Claude Code: Mám EET?

„Mám EET?“ je průvodce pro živnostníky a malé firmy, který za dvě minuty řekne, jestli se jich EET 2.0 od 1. 1. 2027 týká, zda se jim vyplatí režim EET OFF a co musí udělat do kdy. Termín je pevný a blízko, takže web má smysl spustit ještě v listopadu.

**Podklady, ze kterých prompt vychází:**

- **Co se eviduje:** kontaktní platby, tedy hotovost vždy, karta na provozovně, QR platba u pultu, stravenky a poukázky; neevidují se faktury placené převodem ani čistě online platby přes platební bránu e-shopu ([Fakturoid](https://www.fakturoid.cz/almanach/legislativa/eet), [Deník](https://www.denik.cz/ekonomika/vlada-projednala-nove-eet/)). Kontaktní platbou je i placení virtuálním aktivem ([epravo](https://www.epravo.cz/top/aktualne/eet-20-je-na-svete-od-ledna-2027-budou-podnikatele-evidovat-i-platby-kartou-a-qr-kodem-121639.html?pdf=1)).
- **EET OFF:** jen pro 1. pásmo paušální daně s ročními příjmy do 1 mil. Kč; daňová složka 1 500 Kč měsíčně místo 100 Kč; režim nejde měnit během roku ([brožura MF](https://mf.gov.cz/assets/attachments/2026-09-09_Brozura-EET-2-0-jednoduse-moderne-a-prehledne.pdf)).
- **Kdy se EET OFF nevyplatí:** podle výpočtu Podnikatel.cz se s přirážkou 1 400 Kč paušální daň vyplatí až od příjmů zhruba 643 000 Kč u 40% výdajového paušálu a 950 000 Kč u 60%, u 80% nikdy ([Podnikatel.cz](https://www.podnikatel.cz/clanky/jak-bude-vypadat-eet-2-0-prinasime-podrobny-prehled/)).
- **Výjimky z evidence:** mimo jiné letecká doprava, bankovnictví, prodejní automaty ([BusinessInfo](https://www.businessinfo.cz/eet)) a podnikatelé se ZTP/P bez zaměstnanců ([epravo](https://www.epravo.cz/top/aktualne/eet-20-je-na-svete-od-ledna-2027-budou-podnikatele-evidovat-i-platby-kartou-a-qr-kodem-121639.html?pdf=1)).
- **Bezplatná aplikace MOJE EET:** od 1. 12. 2026, nejdřív je třeba vygenerovat pokladní certifikát ([DAUČ](https://www.dauc.cz/aktuality/2087/moje-eet-pro-drobne-podnikatele)); je pro nejvýš dvě evidenční jednotky a dva zaměstnance a propojuje se s Daňovou informační schránkou plus ([Podnikatel.cz](https://www.podnikatel.cz/clanky/financni-sprava-ukazala-jak-by-mela-vypadat-aplikace-zdarma-moje-eet/)).
- **Pozor na rozpory:** některé weby uvádějí i výjimku pro hotovostní tržby do 300 000 Kč ročně. V brožuře MF jsem ji nenašel, proto ji aplikace nesmí uvádět, dokud ji nepotvrdí oficiální web eet.gov.cz.

```markdown
# Úkol: Mám EET? – průvodce EET 2.0 pro podnikatele

## Cíl
Statický web v češtině, který podnikateli pomocí krátkého dotazníku řekne:
1. Zda musí od 1. 1. 2027 evidovat tržby v EET 2.0.
2. Zda může zvolit režim EET OFF a kolik ho to bude stát.
3. Co přesně udělat a do kdy (kontrolní seznam s termíny).

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Logika rozhodování v modulu `rules.js` bez vazby na DOM (čisté funkce).
- Všechny částky, limity, termíny a texty výsledků v `rules.json`; u každé položky
  zdroj (URL) a datum ověření. V kódu nesmí být natvrdo zapsané částky ani limity.
- Testy: vestavěný `node --test` nad `rules.js`.
- Nasazení: GitHub Pages (návod v README).

## Než začneš psát kód
Otevři oficiální web eet.gov.cz a brožuru MF k EET 2.0 a ověř každé pravidlo níže.
Co se nepotvrdí, do `rules.json` nedávej a vypiš mi to. Zejména NEUVÁDĚJ výjimku
pro hotovostní tržby do 300 000 Kč, pokud ji oficiální zdroj výslovně neuvádí.

## Pravidla (ověř)
- Eviduje se kontaktní platba za podnikání: hotovost (vždy, i mimo provozovnu), karta
  na místě, QR platba na místě, stravenky, poukázky, virtuální aktiva.
- Neeviduje se: faktura placená převodem, online platba přes platební bránu.
- Výjimky z evidence podle zákona (např. letecká doprava, bankovnictví, prodejní automaty,
  podnikatel se ZTP/P bez zaměstnanců) – přesný seznam vezmi z eet.gov.cz.
- EET OFF: jen 1. pásmo paušální daně a roční příjmy do 1 000 000 Kč; daňová složka
  paušální daně 1 500 Kč/měs místo 100 Kč (přirážka 1 400 Kč/měs = 16 800 Kč/rok);
  režim nelze měnit během roku.
- Spuštění 1. 1. 2027; bezplatná aplikace MOJE EET od 1. 12. 2026 (max. 2 evidenční
  jednotky a 2 zaměstnanci, nutný pokladní certifikát a Daňová informační schránka plus).

## Obrazovky
1. Dotazník (jedna otázka na obrazovku, max. 8 otázek, tlačítko Zpět): forma podnikání,
   jak přijímáš platby (zaškrtávací výběr), obor, paušální daň a pásmo, roční příjmy,
   počet provozoven/pokladen, počet zaměstnanců, ZTP/P.
2. Výsledek: jedna jasná věta ("Ano, musíš evidovat" / "Ne" / "Můžeš zvolit EET OFF"),
   pod ní proč (které odpovědi o tom rozhodly) a odkaz na zdroj u každého důvodu.
3. Kalkulačka EET OFF: přirážka 16 800 Kč/rok vedle nákladů na evidenci (MOJE EET zdarma,
   nebo vlastní pokladna – cenu zadá uživatel). Jedna věta, co vychází levněji.
4. Kontrolní seznam s termíny: pokladní certifikát, Daňová informační schránka plus,
   volba režimu, aplikace nebo pokladna, test před 1. 1. 2027. Lze vytisknout.
5. Patička: "Informativní průvodce, nejde o daňové poradenství", datum poslední
   kontroly pravidel, odkaz na eet.gov.cz a infolinku finanční správy.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - OSVČ, hotovost na provozovně, bez paušální daně → musí evidovat
  - jen faktury placené převodem → nemusí evidovat
  - e-shop, jen online platby přes platební bránu → nemusí evidovat
  - kavárna, jen QR platby u pultu → musí evidovat
  - paušální daň 1. pásmo, příjmy 800 000 Kč → může zvolit EET OFF, přirážka 16 800 Kč/rok
  - paušální daň 2. pásmo → EET OFF nelze
  - paušální daň 1. pásmo, příjmy 1 200 000 Kč → EET OFF nelze
- Každý výsledek ukazuje alespoň jeden odkaz na oficiální zdroj.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Odpovědi se neukládají ani neodesílají; žádné analytiky bez souhlasu.
- README česky: spuštění, jak upravit `rules.json`, když finanční správa změní výklad.

## Postup
Nejdřív ověř pravidla ze zdrojů a vypiš mi tabulku pravidlo → zdroj → potvrzeno ano/ne.
Po mém schválení navrhni strom otázek, pak testy, potom `rules.js`, nakonec UI.
Na konci spusť testy a projdi v prohlížeči všech 7 testovacích scénářů ručně.
```

## Zadání pro Claude Code: Spot, nebo fix?

„Spot, nebo fix?“ spočítá domácnosti na reálných cenách z burzy za posledních 12 měsíců, kolik by zaplatila na spotu, na fixu a na dynamickém tarifu. Je to nejtěžší ze čtyř aplikací, protože potřebuje data z OTE a pravidelnou aktualizaci; doporučuji ji stavět až po Plánu48.

**Podklady, ze kterých prompt vychází:**

- **Jak se počítá spot:** obchodní cena je vážený průměr cen denního trhu OTE, vážený typovým diagramem dodávky (TDD) nebo skutečnou spotřebou; ceny jsou v EUR a přepočítávají se denním kurzem ČNB ([dodatek PPAS ke spotu](https://www.ppas.cz/sites/default/files/ceniky/2023/Dodatek_pro_SPOT.pdf)).
- **15minutové ceny:** denní trh přešel na 15minutový obchodní interval ([OTE](https://www.ote-cr.cz/../o-spolecnosti/zpravy_ote/tz20250930_spusteni-15min-na-dt.pdf)); TDD pro maloodběr má 8 tříd a přepočítává se na 96 čtvrthodinových hodnot denně ([metodika OTE](https://www.ote-cr.cz/en/documentation/electricity-documentation/metodika_teplotniho_prepoctu_tdd_2026-1.pdf)).
- **Proč spot domácnosti často prodraží:** domácnosti berou nejvíc ráno, večer a v zimě, kdy je spot dražší než roční průměr ([aRecenze](https://www.arecenze.cz/?p=385199)).
- **Dynamický tarif ČEZ:** 10 cenových pásem ve všední den a 8 o víkendu, sleva až 50 %, ve špičce dražší nejvýš o čtvrtinu; vyžaduje průběhové měření ([TZB-info](https://www.tzb-info.cz/ceny-paliv-a-energii/29478-cez-prodej-spousti-dynamicky-tarif-prizpusobte-spotrebu-zaplatte-mene)). Zhruba 80 % klientů ušetří v průměru 10 % ([Echo24](https://www.echo24.cz/a/H3cCC/zpravy-ekonomika-ceske-domacnosti-uspory-energii-nove-trendy-v-energetice-cez-ipsos-analyza)).
- **Distribuce 2026 (s DPH), D02d:** ČEZ Distribuce 2 515,08 Kč/MWh, EG.D 2 777,36 Kč/MWh, PREdistribuce 1 835,00 Kč/MWh ([Ušetřeno](https://www.usetreno.cz/regulovane-ceny-elektriny-2023/)); D57d u ČEZ 140,97 Kč/MWh v nízkém a 913,27 Kč/MWh ve vysokém tarifu ([E15](https://www.e15.cz/ceny-elektriny-2026-srovnani-dodavatelu)). Stálé platby a jistič agent doplní z ceníků distributorů.

```markdown
# Úkol: Spot, nebo fix? – srovnání tarifů elektřiny pro domácnost

## Cíl
Statický web v češtině, který domácnosti spočítá roční náklady na elektřinu ve třech
variantách na skutečných cenách posledních 12 měsíců: spot, fix (cenu zadá uživatel)
a dynamický tarif s pevnými pásmy. Výsledek: která varianta vychází nejlevněji, o kolik,
a jak moc by se to změnilo, kdyby uživatel přesunul část spotřeby do levných hodin.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly) pro web; graf Chart.js z CDN (cdnjs).
- Výpočty v `calc.js` bez vazby na DOM.
- Data: skript `scripts/update-data.mjs` (Node), který stáhne z oficiálních zdrojů:
  - 15minutové (dříve hodinové) ceny denního trhu OTE za posledních 12 měsíců,
  - denní kurzy EUR/CZK z ČNB,
  - normalizované TDD pro třídy domácností z webu OTE,
  a uloží je do `data/*.json` (zaokrouhleně, malé soubory). Web čte jen tyto soubory,
  nikdy nevolá OTE ani ČNB z prohlížeče.
- GitHub Action, která skript spustí jednou denně a změněná data commitne.
- Distribuční ceny, stálé platby, poplatky a DPH v `tariffs.json` podle distributora a
  sazby (D01d, D02d, D25d, D26d, D45d, D56d, D57d, D61d), každá položka se zdrojem a rokem.
- Pásma dynamického tarifu v `dynamic.json` (časy a % odchylky od základní ceny), aby šla
  přidat i pásma jiného dodavatele.
- Testy: vestavěný `node --test` nad `calc.js`.

## Než začneš psát kód
Najdi na ote-cr.cz oficiální exporty výsledků denního trhu a TDD a na cnb.cz denní kurzy.
Napiš mi přesné adresy a formát dat. Pokud něco nejde stáhnout automaticky, zastav se
a navrhni alternativu (třeba ruční stažení souboru jednou měsíčně). Ceník dynamického
tarifu vezmi z aktuálního ceníku ČEZ Prodej a uveď odkaz.

## Výpočet
- Spotřeba po čtvrthodinách = roční spotřeba × normalizovaný TDD zvolené třídy (bez
  teplotního přepočtu, zjednodušení napiš do patičky). Volitelně: nahrání vlastního CSV
  s průběhovým měřením (sloupce čas + kWh, mapování sloupců v UI).
- Spot: Σ(spotřeba × (cena EUR/MWh × kurz ČNB)) + marže dodavatele Kč/MWh (zadá uživatel,
  předvyplněno) + distribuce + stálé platby + daň z elektřiny + DPH.
- Fix: spotřeba × cena silové elektřiny (zadá uživatel) + stejné regulované složky.
- Dynamický tarif: spotřeba v každém pásmu × základní cena × (1 + odchylka pásma).
- Posun spotřeby: posuvník 0–30 % "přesunu do nejlevnějších hodin" pro spot a dynamický
  tarif; celková roční spotřeba se nemění.
- Všechny částky uváděj včetně DPH a vždy to napiš u výsledku.

## Obrazovky
1. Formulář: distributor, distribuční sazba, roční spotřeba (MWh), jistič, typ domácnosti
   (byt / dům / dům s tepelným čerpadlem / s fotovoltaikou → výběr TDD), nabídnutá fixní
   cena, marže spotu.
2. Výsledek: tři karty s ročními náklady, nejlevnější zvýrazněná, rozdíl v Kč.
3. Graf: měsíční náklady ve třech variantách za posledních 12 měsíců.
4. Graf: průměrná spotová cena podle hodiny dne vs. kdy domácnost spotřebovává.
5. Patička: "Orientační výpočet, nejde o nabídku dodavatele", datum posledních dat,
   zjednodušení, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - fix: 3 MWh × (3 000 + 2 515,08) Kč/MWh = 16 545,24 Kč (bez stálých plateb)
  - spot: dvě období po 0,5 MWh, ceny 100 a 0 EUR/MWh, kurz 25 Kč/EUR
    → silová elektřina 1 250 Kč (bez marže)
  - dynamický tarif: celá spotřeba v pásmu −50 % → polovina základní ceny
  - den přechodu na letní čas má 92 čtvrthodin, na zimní 100; roční součet TDD = 1
  - posun 0 % nemění výsledek; posun nemění roční spotřebu
- `scripts/update-data.mjs` doběhne a vytvoří platná data za 12 měsíců.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Nahrané CSV zůstává jen v prohlížeči; nic se neodesílá.
- README česky: spuštění, ruční aktualizace dat, úprava `tariffs.json` na nový rok.

## Postup
Nejdřív ověř zdroje dat a vypiš mi je. Po schválení napiš a spusť `update-data.mjs`,
pak testy, `calc.js` a nakonec UI. Na konci spusť testy, otevři stránku, zkontroluj ji
na šířce 360 px a porovnej jeden výsledek s kalkulačkou ERÚ nebo ceníkem dodavatele.
```

## Zadání pro Claude Code: Bydlometr

Bydlometr nesoutěží s bankovními kalkulačkami splátky. Odpovídá na dvě otázky, na které banka neutrální odpověď nedá: „Končí mi fixace – přijmout nabídku, refinancovat, nebo mimořádně splatit?“ a „Vyplatí se mi koupit, nebo bydlet v nájmu a rozdíl investovat?“ Druhá část přímo navazuje na tvůj InvestWeb.

**Podklady, ze kterých prompt vychází:**

- **Vlna refixací:** ČNB čeká v roce 2026 refixace za zhruba 460 mld. Kč s průměrnou dosavadní sazbou 3,3 %; největší objem končí v letech 2026 a 2027 ([ČNB](https://www.cnb.cz/cs/o_cnb/cnblog/Refixace-a-refinancovani-hypotek-nove-odhady-dopadu-do-vydaju-domacnosti)). Týká se to zhruba 100 tisíc domácností letos a až 140 tisíc ročně v dalších letech ([Seznam Zprávy](https://www.seznamzpravy.cz/clanek/ekonomika-byznys-reality-hypoteka-blizi-se-vlna-refixaci-jez-zasahne-statisice-lidi-hypoteky-jim-zasadne-zdrazi-290526)).
- **Sazby:** průměrná nabídková sazba podle Swiss Life Hypoindexu byla 7. 10. 2026 na 5,79 % ([Hyponamíru](https://www.hyponamiru.cz/?p=18744)).
- **Limity ČNB:** LTV 80 %, pro žadatele do 36 let 90 %; DTI a DSTI zůstávají deaktivované; u investičních hypoték ČNB od 1. 4. 2026 doporučuje LTV 70 % a DTI 7 ([Hyponamíru](https://www.hyponamiru.cz/?p=16385), [FXstreet](https://www.fxstreet.cz/klicova-slova+dsti.html)).
- **Mimořádné splátky (smlouvy od 1. 9. 2024):** zdarma do 25 % jistiny jednou ročně v měsíci před výročím smlouvy ([Finance.cz](https://www.finance.cz/549514-situaci-pri-kterych-pujde-splatit-spotrebitelsky-uver-bez-sankci-bude-vic/)); jinak poplatek 0,25 % za každý započatý rok do konce fixace, nejvýš 1 % ([Ušetřeno](https://www.usetreno.cz/predcasne-splaceni-hypoteky/)); ke konci fixace je splacení zdarma ([Hyponamíru](https://www.hyponamiru.cz/predcasne-splaceni-hypoteky/)).
- **Odpočet úroků:** od roku 2021 nejvýš 150 000 Kč ročně ([CNN Prima News](https://cnn.iprima.cz/jak-pri-investovani-optimalizovat-dane-i-statni-podporu-kombinujte-dip-i-penzijni-sporeni-505350)).
- **Ceny pro výchozí hodnoty:** byt v roce 2025 v průměru 72 410 Kč/m² v ČR a 131 520 Kč/m² v Praze ([ČSÚ](https://csu.gov.cz/ceny-nemovitosti)); nabídkové nájemné 2+kk ve 2. čtvrtletí 2026: Praha 452 Kč/m², Brno 366 Kč/m², Ostrava 283 Kč/m² ([Banky.cz](https://www.banky.cz/clanky/ve-velkych-mestech-zdrazuji-hlavne-byty-2-kk/)).

```markdown
# Úkol: Bydlometr – refixace hypotéky a nájem vs. koupě

## Cíl
Statický web v češtině se dvěma nástroji, které sdílejí výpočet hypotéky:
1. Refixace: člověku končí fixace. Porovnej varianty – přijmout nabídku banky,
   refinancovat jinde, mimořádně splatit část dluhu, prodloužit splatnost – a ukaž
   novou splátku, celkové úroky a zátěž rozpočtu, včetně zátěžového testu sazby.
2. Nájem vs. koupě: za N let porovnej čisté jmění při koupi bytu na hypotéku a při
   nájmu, kdy se vlastní zdroje i měsíční rozdíl investují. Ukaž rok, kdy se koupě
   začne vyplácet (pokud vůbec).

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Graf: Chart.js z CDN (cdnjs).
- Výpočty v `mortgage.js` (anuita, splátkový kalendář, poplatky) a `rentbuy.js`
  (simulace po měsících), obojí bez vazby na DOM.
- Parametry v `rules.json` (limity ČNB, pravidla mimořádných splátek, odpočet úroků)
  a výchozí hodnoty v `defaults.json` (sazba, ceny bytů a nájmy pro Prahu, Brno,
  Ostravu a průměr ČR). Každá položka se zdrojem a datem. Nic natvrdo v kódu.
- Testy: vestavěný `node --test`.
- Nasazení: GitHub Pages (návod v README).

## Pravidla (ověř proti zákonu č. 257/2016 Sb. a aktuálnímu opatření ČNB)
- Anuitní splátka, měsíční úročení.
- Mimořádná splátka u smluv od 1. 9. 2024: zdarma do 25 % jistiny 1× ročně v měsíci
  před výročím smlouvy a ke konci fixace; jinak 0,25 % z částky za každý započatý rok
  do konce fixace, max. 1 %. Pro starší smlouvy jen upozornění "zkontroluj smlouvu".
- LTV limit: 90 % do 36 let, jinak 80 %; investiční nemovitost doporučeně 70 % a DTI 7.
  DTI a DSTI pro vlastní bydlení nejsou závazné – ukazuj je jen informativně.
- Odpočet úroků z hypotéky na vlastní bydlení: max. 150 000 Kč/rok, úspora × sazba daně.

## Nástroj 1: Refixace
- Vstupy: zbývající dluh, zbývající doba splácení, dosavadní sazba, nabídnutá sazba,
  sazba konkurence a náklady refinancování (odhad, poplatky), úspory na mimořádnou
  splátku, čistý měsíční příjem domácnosti.
- Výstup: tabulka variant (splátka, změna splátky, úroky do konce, celkové náklady)
  a jedna věta "Nejlevněji vychází…". Zátěžový test: splátka při sazbě +1 a +2 p. b.
  po další fixaci. Podíl splátky na čistém příjmu s barevným varováním (práh nastavitelný,
  výchozí 40 %, označený jako orientační, ne limit ČNB).

## Nástroj 2: Nájem vs. koupě
- Vstupy: město (předvyplní cenu za m² a nájem za m²), plocha, vlastní zdroje, věk
  (určuje LTV), sazba a fixace, roční růst cen nemovitostí, růst nájmů, výnos investic,
  náklady vlastnictví (fond oprav, pojištění, daň z nemovitosti, údržba % z ceny/rok),
  horizont N let.
- Simulace po měsících: kupující splácí a platí náklady; nájemník platí nájem a investuje
  vlastní zdroje + rozdíl, pokud je jeho měsíční výdaj nižší (a naopak).
- Výstup: graf čistého jmění obou variant v čase, rok zlomu, citlivost na růst cen
  a výnos investic (tabulka 3 × 3).

## Obrazovky
Dvě záložky (Refixace / Nájem vs. koupě), formulář vlevo, výsledky vpravo, na mobilu
pod sebou. Patička: "Orientační výpočet, nejde o finanční poradenství ani nabídku úvěru",
datum výchozích dat, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - 3 500 000 Kč, 25 let, 4,94 % → splátka 20 337 Kč ± 5 Kč (příklad Swiss Life Hypoindexu)
  - 1 200 000 Kč, 0 %, 10 let → splátka 10 000 Kč
  - mimořádná splátka 500 000 Kč, 3 celé roky do konce fixace → poplatek 3 750 Kč
  - totéž s 5 lety do konce fixace → poplatek 5 000 Kč (strop 1 %)
  - totéž ke konci fixace → poplatek 0 Kč
  - mimořádná splátka do 25 % jistiny v měsíci před výročím → poplatek 0 Kč
  - zaplacené úroky 200 000 Kč/rok, sazba daně 15 % → úspora 22 500 Kč
  - věk 30 → max. LTV 90 %; věk 40 → 80 %
- Splátkový kalendář: součet splátek jistiny = výše úvěru (tolerance 1 Kč).
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Zadaná čísla se neukládají ani neodesílají.
- README česky: spuštění, aktualizace `defaults.json` (sazby, ceny), nasazení.

## Postup
Nejdřív ověř pravidla a výchozí čísla ze zdrojů a vypiš tabulku hodnota → zdroj → datum.
Po mém schválení napiš testy, pak `mortgage.js`, `rentbuy.js` a nakonec UI. Začni
Nástrojem 1 (refixace), Nástroj 2 přidej, až bude první hotový a otestovaný.
Na konci spusť testy, zkontroluj stránku na šířce 360 px a porovnej jednu splátku
s kalkulačkou některé banky.
```

## Další nápady na aplikace

Všech šest nápadů stojí na stejném vzoru jako předchozí aplikace: česká pravidla, která lidé neznají, statický web bez serveru a parametry v jednom souboru. Většina má pevný termín v nejbližších třech měsících.

| Aplikace | Co řeší | Proč teď | Náročnost | Konkurence |
| --- | --- | --- | --- | --- |
| **OSVČ 2027: paušál, nebo přiznání?** (rozšíření Mám EET?) | Spočítá, jestli se živnostníkovi vyplatí paušální daň, klasické přiznání s výdajovým paušálem, nebo EET OFF | Přihlásit se k paušální dani je třeba do 11. 1. 2027; 1. pásmo stoupá na 9 662 Kč měsíčně ([Pohoda](https://portal.pohoda.cz/?p=45627), tabulka pásem v [E15](https://www.e15.cz/pausalni-dan-2027)) | Střední | Tabulky a kalkulačky finančních webů, ale bez volby EET OFF |
| **Zdaním to?** (krypto, akcie, ETF) | Ke každému prodeji řekne, jestli je osvobozený, a hlídá roční limity | U krypta osvobození do 100 000 Kč příjmů ročně nebo po 3 letech držby; limit 40 mil. Kč od roku 2026 zůstal jen u krypta ([Pohoda](https://portal.pohoda.cz/?p=36233)); přiznání za rok 2026 se podává na jaře 2027 | Nízká s ručním zadáním, vyšší s importem CSV z burz | Divly (placené), RuleCalc |
| **Volno 2027** | Navrhne, kdy si vzít dovolenou, aby vyšlo co nejvíc volných dní v kuse; ukáže i dny se zavřenými obchody | Lidé teď plánují dovolené na příští rok; v roce 2027 připadnou 1. 5., 8. 5. a oba vánoční svátky na víkend, zato 5.–6. 7. dají čtyři dny volna bez dovolené (vlastní výpočet z kalendáře) | Velmi nízká | Jen články |
| **Slevy 2027: na co mám nárok** | Projde situaci zaměstnance a řekne, které slevy a odpočty si má říct u zaměstnavatele | Vrací se sleva na studenta 4 020 Kč ročně a školkovné do výše minimální mzdy ([Práce a mzda](https://www.praceamzda.cz/tydenik/253/podtrzeno-secteno-c-26-30-2026)); volnočasové benefity budou bez limitu kromě rekreace ([Crowe](https://www.crowe.com/cz/cs-cz/news/dan-z-prijmu-2027-novinky-v-oblasti-zamestnaneckych-benefitu-a-dalsi)) | Nízká | Mzdové kalkulačky (např. [Finance.cz](https://www.finance.cz/kalkulacky/mzdova-kalkulacka-2027/)), ne průvodce slevami |
| **Přijímačky: simulátor priorit** | Vysvětlí rodičům deváťáků, jak systém rozřazuje na školy, a ukáže, co dělá pořadí škol na přihlášce | Až 3 přihlášky bez talentové zkoušky a 2 s ní, pořadí je závazné; horší uchazeč nikdy nepřeskočí lepšího jen kvůli prioritě ([Portál občana](https://portal.gov.cz/sluzby-vs/S1110)). Chystá se reforma pořadí testů a přihlášek ([Novinky](https://www.novinky.cz/clanek/domaci-nejdrive-testy-pak-prihlasky-prijimacky-na-stredni-skoly-cekaji-zmeny-40575923)), pravidla pro rok 2027 je třeba ověřit | Střední | Školy a média vysvětlují jen textem |
| **Inflační kalkulačka** | Ukáže, kolik mají dnes peníze, mzda nebo úspory reálnou hodnotu a jaký je reálný výnos spořicího účtu | Meziroční inflace v září 2026 2,5 % ([ČSÚ](https://csu.gov.cz/csu/czso/inflace-spotrebitelske-ceny)); data ČSÚ jsou veřejná | Velmi nízká | Neověřoval jsem; spíš cvičný první projekt |

**Doporučené pořadí podle termínů:**

1. **Volno 2027** jako rozehřívací projekt na jeden večer; nemá žádné právní riziko a dobře se sdílí.
2. **OSVČ 2027** přidat do Mám EET? ještě v prosinci, protože termín 11. 1. 2027 je pevný.
3. **Zdaním to?** do února, před sezónou daňových přiznání.
4. **Slevy 2027** a **Přijímačky** na leden, kdy lidé podepisují prohlášení u zaměstnavatele a vybírají školy.

## Zadání pro Claude Code: OSVČ 2027

OSVČ 2027 porovná pro živnostníka tři cesty: paušální daň, klasické přiznání s výdajovým paušálem a režim EET OFF. Nejlépe funguje jako druhá záložka aplikace Mám EET?, protože sdílí `rules.json`. Termín pro přihlášení k paušální dani je pevný: 11. 1. 2027.

**Podklady, ze kterých prompt vychází:**

- **Paušální daň 2027 (měsíčně):** 1. pásmo 9 662 Kč (daň 100, sociální 6 074, zdravotní 3 488), 2. pásmo 16 745 Kč, 3. pásmo 27 139 Kč ([Forvis Mazars / iDNES](https://www.forvismazars.com/cz/cs/prehledy/forvis-mazars-v-mediich/archiv-2026/pausalni-dan-2027-podnikatele-si-priplati)). Přihlásit se je třeba do 11. 1. 2027, první platba do 20. 1. ([Pohoda](https://portal.pohoda.cz/?p=45627)).
- **Pásma:** 1. pásmo do 1 mil. Kč příjmů, nebo do 1,5 mil. Kč, pokud aspoň 75 % příjmů spadá pod 80% nebo 60% výdajový paušál, nebo do 2 mil. Kč při 80% paušálu; paušální daň nemůže mít plátce DPH ([Běhounek](https://www.behounek.eu/l/pausalni-dan/)).
- **Minimální zálohy 2027 (návrh):** sociální 5 281 Kč, zdravotní 3 488 Kč měsíčně ([Pohoda](https://portal.pohoda.cz/dane-ucetnictvi-mzdy/page/8/?page=28)); průměrná mzda pro rok 2027 je 51 663 Kč ([money.cz](https://money.cz/novinky-a-tipy/?p=19357)). Sazby 29,2 % a 13,5 % se nemění ([E15 / Forvis Mazars](https://www.forvismazars.com/cz/cs/prehledy/forvis-mazars-v-mediich/archiv-2026/kolik-zaplatite-na-zalohach-v-roce-2027)); sociální pojištění se počítá z 55 % zisku ([BusinessInfo](https://www.businessinfo.cz/clanky/kdo-plati-minimalni-a-kdo-vyssi-zalohy-na-povinna-pojisteni-terminy-se-blizi/)).
- **Kontrolní tabulka:** E15 uvádí pro daňový základ 200 000 Kč (sleva na poplatníka, dvě děti) přímé odvody 115 944 Kč v paušálu a 67 704 Kč při klasickém zdanění ([E15](https://www.e15.cz/pausalni-dan-2027)).
- **Limit pro přiznání od 2027:** OSVČ podává přiznání až nad 100 000 Kč příjmů ročně ([BusinessInfo](https://www.businessinfo.cz/clanky/zmeny-u-dani-z-prijmu-jake-novinky-cekaji-podnikatele-i-zamestnance-od-ledna-2027/)).

```markdown
# Úkol: OSVČ 2027 – paušální daň, přiznání, nebo EET OFF?

## Cíl
Kalkulačka v češtině, která živnostníkovi spočítá roční odvody (daň + sociální +
zdravotní) v roce 2027 ve třech variantách a řekne, co se mu vyplatí:
1. Paušální daň v pásmu, na které má nárok.
2. Klasické přiznání s výdajovým paušálem (nebo skutečnými výdaji).
3. EET OFF (jen 1. pásmo a příjmy do 1 mil. Kč): paušál + 1 400 Kč/měs.
K výsledku přidá termíny: přihláška k paušální dani do 11. 1. 2027, první platba
do 20. 1. 2027.

## Kde to postavit
Pokud existuje projekt "Mám EET?", přidej tuto kalkulačku jako druhou záložku a použij
jeho `rules.json` a styl. Jinak založ samostatný statický web se stejnou strukturou.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Výpočty v `osvc.js` bez vazby na DOM.
- Všechny parametry v `rules.json` (sekce "osvc2027"), každý se zdrojem a datem.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř a vypiš tabulku hodnota → zdroj → datum pro: výši paušální daně ve 3 pásmech,
podmínky pásem, průměrnou mzdu 2027, minimální vyměřovací základy, sazby pojistného,
výdajové paušály a jejich stropy, slevu na poplatníka, daňové zvýhodnění na děti,
hranici pro 23% sazbu (36× průměrná mzda) a pravidla zaokrouhlení. Minimální zálohy
byly v době zadání jen návrhem – ověř, že platí.

## Výpočet klasického zdanění (ověř)
- Zisk = příjmy − výdaje (výdajový paušál 80/60/40/30 % se stropem, nebo skutečné výdaje).
- Daň = 15 % ze zisku (23 % nad hranicí) − sleva na poplatníka 30 840 Kč (min. 0)
  − daňové zvýhodnění na děti (může vzniknout bonus).
- Sociální = max(55 % zisku, roční minimální vyměřovací základ) × 29,2 %.
- Zdravotní = max(50 % zisku, roční minimální vyměřovací základ) × 13,5 %.
- Paušál: 12 × měsíční částka pásma. EET OFF: paušál 1. pásma + 12 × 1 400 Kč.

## Obrazovka
1. Formulář: roční příjmy, druh činnosti (výdajový paušál), nebo skutečné výdaje,
   plátce DPH ano/ne, počet dětí, hlavní/vedlejší činnost, zda přijímá kontaktní platby.
2. Výsledek: tabulka tří variant (roční odvody, měsíčně), nejlevnější zvýrazněná,
   rozdíl v Kč, a u nedostupných variant důvod ("plátce DPH nemůže mít paušální daň").
3. Graf: roční odvody podle výše příjmů (100 tis. – 2 mil. Kč) pro zvolený paušál
   a obě varianty, s bodem zlomu.
4. Termíny a odkazy na formuláře finanční správy.
5. Patička: "Orientační výpočet, nejde o daňové poradenství", datum ověření pravidel.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - paušál 1. pásmo za rok = 115 944 Kč (12 × 9 662)
  - EET OFF za rok = 115 944 + 16 800 = 132 744 Kč
  - plátce DPH → paušální daň nedostupná
  - příjmy 1 200 000 Kč, 40% paušál → 1. pásmo nedostupné, EET OFF nedostupný
  - daňový základ 200 000 Kč, sleva na poplatníka, 2 děti → klasicky cca 67 700 Kč/rok
    (tabulka E15: 67 704 Kč; tolerance ±100 Kč kvůli zaokrouhlení)
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Nic se neukládá ani neodesílá.

## Postup
Nejdřív tabulka ověřených hodnot a čekej na schválení. Pak testy, `osvc.js`, UI.
Na konci spusť testy a porovnej dva výsledky s tabulkami E15 nebo kalkulačkou
finanční správy.
```

## Zadání pro Claude Code: Slevy 2027

Slevy 2027 je krátký dotazník pro zaměstnance, který řekne, na které slevy a odpočty má nárok, kolik to dělá v Kč a kde si o ně říct (prohlášení u zaměstnavatele, roční zúčtování, nebo přiznání). Hodí se spustit v prosinci, kdy lidé podepisují prohlášení na nový rok.

**Podklady, ze kterých prompt vychází:**

- **Vracející se slevy:** sleva na studenta 4 020 Kč ročně pro lidi do 26 let, u prezenčního doktorského studia do 28 ([E15](https://www.e15.cz/finexpert/danove-priznani/navrat-skolkovneho-a-slevy-na-studenta-schvalen-na-danich-usetrite-az-v-roce-2028-1432587)); školkovné do výše minimální mzdy ([Práce a mzda](https://www.praceamzda.cz/tydenik/253/podtrzeno-secteno-c-26-30-2026)), tj. 24 900 Kč v roce 2027 ([MPSV](https://mpsv.gov.cz/minimalni-mzda-v-roce-2027-vzroste-na-24-900-korun)). Školkovné se uplatní až v ročním zúčtování nebo přiznání ([Finance.cz](https://www.finance.cz/kalkulacky/mzdova-kalkulacka-2027/)) a rodič doloží, že ho neuplatňuje druhý rodič ([Jenprace.cz](https://www.jenprace.cz/tiskove-zpravy/skolkovne-i-sleva-na-studenta-se-maji-vratit-co-se-zmeni-a-od-kdy-pujdou-znovu-vyuzit)).
- **Stávající slevy (výše pro 2026):** na poplatníka 30 840 Kč, ZTP/P 16 140 Kč, děti 15 204 / 22 320 / 27 840 Kč ročně ([Pohoda](https://portal.pohoda.cz/?p=42535)); na manžela 24 840 Kč, jen při jeho příjmu do 68 000 Kč a dítěti do 3 let ve společné domácnosti ([Finanční správa](https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/dotazy-a-odpovedi/dan-z-prijmu-fyzickych-osob/sleva-na-manzela)).
- **Benefity od 2027:** volnočasové bez limitu kromě rekreace, zdravotní do výše průměrné mzdy 51 663 Kč ([Crowe](https://www.crowe.com/cz/cs-cz/news/dan-z-prijmu-2027-novinky-v-oblasti-zamestnaneckych-benefitu-a-dalsi)); rekreace do 20 000 Kč ([Práce a mzda](https://www.praceamzda.cz/novinky/17221/eet-2-0-po-3-cteni-schvaleno-poslanci)).
- **Další změny:** spropitné v gastronomii osvobozené do 7 % měsíčních tržeb; zaměstnanec s vedlejšími příjmy podává přiznání až nad 40 000 Kč ročně ([BusinessInfo](https://www.businessinfo.cz/clanky/zmeny-u-dani-z-prijmu-jake-novinky-cekaji-podnikatele-i-zamestnance-od-ledna-2027/)).

```markdown
# Úkol: Slevy 2027 – na co mám nárok?

## Cíl
Statický web v češtině: zaměstnanec projde krátký dotazník a dostane seznam slev na dani,
daňového zvýhodnění a odpočtů, na které má v roce 2027 nárok – s částkou měsíčně a ročně
a s tím, KDE a KDY si o ni má říct (prohlášení poplatníka u zaměstnavatele, žádost
o roční zúčtování, nebo daňové přiznání). Zvlášť vyznačí novinky roku 2027.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Logika v `slevy.js` (čisté funkce), parametry v `rules.json` se zdrojem a datem.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř a vypiš tabulku hodnota → zdroj → datum pro rok 2027: sleva na poplatníka, na
manžela (podmínky), invaliditu, ZTP/P, studenta (věkové hranice), školkovné (strop =
minimální mzda 2027, podmínky, potvrzení druhého rodiče), daňové zvýhodnění na děti
(1./2./3.+ dítě, ZTP/P dvojnásobek, podmínka příjmu pro bonus), odpočty (produkty na stáří
max. 48 000 Kč, úroky z hypotéky max. 150 000 Kč, dary, odborové příspěvky, další),
termíny (podpis prohlášení, žádost o roční zúčtování, podání přiznání) a limity pro
povinné přiznání. Výše pro rok 2026 nepřebírej bez ověření, že se v roce 2027 nemění.

## Pravidla výpočtu (ověř)
- Měsíční slevy: 1/12 roční částky za každý měsíc, na jehož počátku jsou splněny podmínky.
- Sleva na manžela, školkovné a odpočty jen ročně (roční zúčtování / přiznání).
- Školkovné = min(skutečně zaplacené školné, minimální mzda) na každé dítě.
- Slevy snižují daň max. na nulu; daňové zvýhodnění na děti může vytvořit bonus.

## Obrazovky
1. Dotazník (jedna otázka na obrazovku, max. 10, tlačítko Zpět): věk a studium (od-do),
   děti (počet, věk, školka a školné, ZTP/P), manžel/ka (příjem, dítě do 3 let),
   invalidita/ZTP/P, hypotéka (zaplacené úroky), penzijko/DIP/životní pojištění
   (roční vklady), dary, vedlejší příjmy.
2. Výsledek: tabulka sleva → Kč měsíčně → Kč ročně → kde uplatnit → do kdy;
   nahoře součet "Až X Kč ročně" a štítek "Novinka 2027" u nových položek.
3. Kontrolní seznam k vytištění: co podepsat u zaměstnavatele a jaké doklady přinést.
4. Patička: "Orientační přehled, nejde o daňové poradenství", datum ověření, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - student 22 let po celý rok → sleva na studenta 4 020 Kč
  - student jen od ledna do června → 2 010 Kč (6/12)
  - věk 27, bakalářské studium → sleva na studenta 0
  - 2 děti po celý rok → 15 204 + 22 320 = 37 524 Kč
  - dítě ve školce, školné 30 000 Kč → školkovné 24 900 Kč; školné 12 000 Kč → 12 000 Kč
  - manželka s příjmem 50 000 Kč a dítě 2 roky → 24 840 Kč; příjem 70 000 Kč → 0
  - vklady do DIP 60 000 Kč → odpočet 48 000 Kč
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Odpovědi se neukládají ani neodesílají.
- README česky: jak každý rok aktualizovat `rules.json`.

## Postup
Nejdřív tabulka ověřených hodnot a čekej na schválení. Pak testy, `slevy.js`, UI.
Na konci spusť testy a projdi v prohlížeči všechny testovací případy ručně.
```

## Zadání pro Claude Code: Inflační kalkulačka

Inflační kalkulačka je nejjednodušší ze všech zadání a hodí se jako první cvičný projekt: jeden datový soubor z ČSÚ a pár vzorců. Odpoví, kolik mají peníze z určitého roku dnes, jakou reálnou hodnotu má mzda a zda spořicí účet poráží inflaci.

**Podklady, ze kterých prompt vychází:**

- **Data:** ČSÚ zveřejňuje indexy spotřebitelských cen jako otevřená data v CSV; starý produkt ve Veřejné databázi se od roku 2026 už neaktualizuje a nová data jsou na stránce [ČSÚ – ISC, otevřená data](https://csu.gov.cz/produkty/isc_cr#opendata) ([ČSÚ](https://csu.gov.cz/produkty/indexy-spotrebitelskych-cen)).
- **Řada:** bazické indexy (průměr roku 2015 = 100) jsou k dispozici měsíčně od roku 1995 ([dokumentace ČSÚ](https://csu.gov.cz/docs/107508/5bc19b9e-1d32-50d4-8b7c-a3bcd4fbf4d2/010022-23dds.htm)).
- **Aktuální stav:** meziroční inflace v září 2026 byla 2,5 %, průměrná roční inflace za rok 2025 také 2,5 % ([ČSÚ](https://csu.gov.cz/csu/czso/inflace-spotrebitelske-ceny)).

```markdown
# Úkol: Inflační kalkulačka – kolik mají moje peníze dnes

## Cíl
Statický web v češtině se třemi nástroji nad oficiálními daty ČSÚ:
1. Přepočet částky: "10 000 Kč v lednu 2005 odpovídá dnes X Kč" (i obráceně).
2. Reálný výnos: zadám úrok spořicího účtu nebo výnos investice a období, kalkulačka
   ukáže, jestli peníze reálně rostly, nebo ztrácely hodnotu.
3. Reálná mzda: zadám svou mzdu dřív a dnes, kalkulačka řekne, jestli si reálně
   polepšil, a o kolik procent.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly); graf Chart.js z CDN (cdnjs).
- Výpočty v `inflation.js` bez vazby na DOM.
- Skript `scripts/update-cpi.mjs` (Node) stáhne z otevřených dat ČSÚ bazický index
  spotřebitelských cen (úhrn, měsíčně, průměr 2015 = 100) a uloží `data/cpi.json`
  (klíč měsíc "RRRR-MM", hodnota index). Web čte jen tento soubor, nikdy nevolá ČSÚ z prohlížeče.
- GitHub Action, která skript spustí jednou měsíčně (po zveřejnění inflace) a commitne
  změněná data.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Najdi na csu.gov.cz/produkty/isc_cr (sekce Otevřená data) CSV s indexy spotřebitelských
cen a jeho dokumentaci. Vypiš mi adresu souboru, sloupce, které použiješ, a jak poznáš
bazický index za úhrn spotřebního koše. Pokud adresa nejde stáhnout automaticky, navrhni
ruční stažení jednou měsíčně.

## Výpočty
- Přepočet: částka × (index cílového měsíce / index výchozího měsíce).
- Kumulativní inflace: index_cíl / index_výchozí − 1.
- Průměrná roční inflace za období: (index_cíl / index_výchozí)^(12 / počet měsíců) − 1.
- Reálný výnos: (1 + nominální výnos) / (1 + inflace) − 1, za stejné období.
- Reálná změna mzdy: (mzda_dnes / mzda_dřív) / (index_dnes / index_dřív) − 1.
- Pokud uživatel zvolí měsíc, za který data ještě nejsou, použij poslední dostupný
  a napiš to u výsledku.

## Obrazovky
1. Tři záložky podle nástrojů, výběr měsíce a roku od 1995 do posledního dostupného.
2. Výsledek velkým písmem a pod ním jedna věta vysvětlení.
3. Graf: vývoj cenové hladiny za zvolené období a meziroční inflace po měsících.
4. Patička: zdroj (ČSÚ), datum posledních dat, "Orientační výpočet".

## Kritéria hotovo
- `node --test` projde, včetně těchto případů (na testovacích datech):
  - index 100 → 125: 100 Kč → 125 Kč, kumulativní inflace 25 %
  - obrácený přepočet 125 Kč → 100 Kč
  - nominální výnos 4 %, inflace 2,5 % → reálný výnos ≈ 1,46 %
  - mzda 40 000 → 50 000 Kč při růstu indexu o 20 % → reálně +4,17 %
  - 24 měsíců, index 100 → 110,25 → průměrná roční inflace 5 %
- `scripts/update-cpi.mjs` doběhne a vytvoří `data/cpi.json` od ledna 1995 po poslední
  zveřejněný měsíc; v testu ověř, že řada nemá díry.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- README česky: spuštění, ruční aktualizace dat, nasazení.

## Postup
Nejdřív ověř zdroj dat a vypiš ho. Po schválení napiš a spusť `update-cpi.mjs`, pak
testy, `inflation.js` a UI. Na konci porovnej jeden přepočet s oficiální meziroční
inflací ČSÚ za stejný měsíc.
```

## Zadání pro Claude Code: Přijímačky bez paniky

Přijímačky bez paniky vysvětlí rodičům a deváťákům, jak systém rozřazuje uchazeče na střední školy, a na modelové třídě ukáže, co dělá pořadí škol na přihlášce. Přidá kalendář termínů pro přijímací řízení na školní rok 2027/2028. Poptávka vrcholí v lednu a únoru, kdy se vybírají školy.

**Podklady, ze kterých prompt vychází:**

- **Přihlášky:** až tři obory bez talentové zkoušky a dva s ní, seřazené podle priority; algoritmus nikdy nedovolí, aby horší uchazeč přeskočil lepšího jen kvůli vyšší prioritě; jednotnou zkoušku lze psát dvakrát a z každého předmětu se počítá lepší výsledek ([Portál občana](https://portal.gov.cz/sluzby-vs/S1110)). Pořadí je závazné a ve všech přihláškách musí být stejné ([Liberecký kraj](https://www.kraj-lbc.cz/aktuality/case:detailPdf/itemId:558908/cgId:15623)).
- **Termíny 2027:** jednotná zkouška pro čtyřleté obory 12. a 13. 4. 2027, pro víceletá gymnázia 14. a 15. 4. 2027, náhradní termín 29. a 30. 4. 2027; školní a talentové zkoušky od 15. 3. do 23. 4. ([MŠMT](https://archiv.msmt.gov.cz/file/65227_1_1/)).
- **Přihlášky v předchozím roce:** do 20. února 2026 ([Liberecký kraj](https://www.kraj-lbc.cz/aktuality/case:detailPdf/itemId:587517/cgId:15623)); termín pro rok 2027 je třeba ověřit.
- **Pozor:** připravuje se reforma, podle níž by se nejdřív psaly testy a teprve pak podávaly přihlášky ([Novinky](https://www.novinky.cz/clanek/domaci-nejdrive-testy-pak-prihlasky-prijimacky-na-stredni-skoly-cekaji-zmeny-40575923)); aplikace musí vycházet z pravidel platných pro rok 2027.

```markdown
# Úkol: Přijímačky bez paniky – jak funguje rozřazení na střední školy

## Cíl
Statický web v češtině pro deváťáky a rodiče:
1. Srozumitelně vysvětlí, jak systém DiPSy rozřazuje uchazeče podle bodů a priorit.
2. Simulátor: na modelové třídě (výchozí scénáře + vlastní úpravy) ukáže krok za krokem,
   kdo kam se dostane a proč – a co se stane, když změním pořadí škol nebo body.
3. Kalendář termínů přijímacího řízení pro školní rok 2027/2028 s možností exportu
   do kalendáře (.ics).
4. Kontrolní seznam: co udělat před podáním přihlášky.
Aplikace NEPREDIKUJE přijetí na konkrétní školu – nemá data o ostatních uchazečích.
Vždy to napiš u simulátoru.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Algoritmus v `matching.js` (čisté funkce), termíny a pravidla v `rules.json` se zdrojem.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř na webech CERMAT, MŠMT a Portálu občana a vypiš tabulku pravidlo → zdroj → datum:
počet přihlášek, závaznost pořadí, termín podávání přihlášek pro 2027, termíny jednotné
zkoušky, školních a talentových zkoušek, náhradní termíny, zveřejnění výsledků, 2. kolo,
podíl jednotné zkoušky na celkovém hodnocení a přesný popis rozřazovacího algoritmu.
Ověř, zda reforma "nejdřív testy, pak přihlášky" platí už pro rok 2027. Co se nepotvrdí,
nepoužij a vypiš mi to.

## Algoritmus (ověř proti popisu CERMAT)
Odložené přijetí (deferred acceptance) z pohledu uchazečů:
- Každá škola/obor má kapacitu a pořadí uchazečů podle svých kritérií (body).
- Uchazeč se "hlásí" na první prioritu; škola si drží nejlepší uchazeče do kapacity,
  ostatní odmítne; odmítnutý se hlásí na další prioritu; opakuje se, dokud se nic nemění.
- Výsledek: nikdo s horším pořadím na škole nepřeskočí lepšího jen kvůli prioritě.
- Body z jednotné zkoušky: z každého předmětu lepší výsledek ze dvou pokusů.

## Obrazovky
1. Vysvětlení v 5 krocích s jednoduchou animací (bez knihoven, jen CSS/SVG).
2. Simulátor: tabulka uchazečů (jméno, body, priority), školy (kapacita); tlačítka
   Krok / Přehrát / Reset; 3 předpřipravené scénáře ("Priorita nepřebíjí body",
   "Proč dát na 3. místo jistotu", "Lepší výsledek ze dvou pokusů").
3. Moje strategie: zadám své tři školy a loňské minimální body (uživatel je opíše
   z webu školy) – aplikace upozorní, když žádná škola není "jistota".
4. Kalendář termínů + export .ics.
5. Patička: "Informativní pomůcka, závazné jsou informace CERMAT a škol", zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů (kapacita každé školy 1):
  - X 90 b. (A, B), Y 80 b. (A, B) → X do A, Y do B
  - X 90 b. (B, A), Y 80 b. (A, B) → X do B, Y do A
  - X 90 b. (B, A), Z 85 b. (B, A), Y 80 b. (A) → X do B, Z do A, Y nepřijat
    (Y měl A jako 1. prioritu, ale Z má víc bodů)
  - čeština 30 a 35, matematika 28 a 20 → započte se 35 + 28 = 63 b.
- Simulátor dává stejný výsledek bez ohledu na pořadí, v jakém jsou uchazeči zadáni.
- Export .ics se otevře v Google Kalendáři i v kalendáři iPhonu.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Nic se neukládá ani neodesílá.

## Postup
Nejdřív tabulka ověřených pravidel a termínů a čekej na schválení. Pak testy,
`matching.js`, simulátor a nakonec texty a kalendář. Na konci spusť testy a projdi
v prohlížeči všechny tři scénáře.
```

## Dalších 5 nápadů

Druhá várka míří na situace, kdy člověk potřebuje rychlou a přesnou odpověď podle nových pravidel: výpověď, dluhy, rodičovská, zahraniční dividendy a pracovní cesty. Všechny jsou opět statické weby s parametry v jednom souboru.

| Aplikace | Co řeší | Proč teď | Náročnost | Konkurence |
| --- | --- | --- | --- | --- |
| **Výpověď 2026: kdy končím a co mi náleží** | Z data doručení výpovědi spočítá poslední den pracovního poměru, odstupné a poměrnou dovolenou a navede k podpoře v nezaměstnanosti | Od 1. 6. 2025 běží výpovědní doba už ode dne doručení; obvykle trvá 2 měsíce, u některých důvodů jen 1 ([epravo](https://www.epravo.cz/top/clanky/byznys-a-paragrafy-dil-9-flexinovela-zakoniku-prace-119600.html)); odstupné je 1×, 2× nebo 3× průměrný výdělek podle délky pracovního poměru ([MPSV](https://ppropo.mpsv.cz/pdf/VI223Odstupne.pdf)) | Nízká | Kalkulačky odstupného (např. [Kurzy.cz](https://www.kurzy.cz/kalkulacka/odstupne-2026/)), ne celý průvodce koncem práce |
| **Cestovní příkaz 2027** | Živnostníkům a malým firmám spočítá náhradu za auto, pohonné hmoty a stravné a vytvoří cestovní příkaz v PDF | Sazby mění každý rok vyhláška; pro rok 2026 platí 5,90 Kč za km osobním autem a stravné od 155 Kč ([Práce a mzda](https://www.praceamzda.cz/predpisy/573-2025-sb), [epravo](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2025/573)); vyhláška na rok 2026 vyšla 22. 12. 2025 ([Sbírka zákonů](https://www.epravo.cz/_dataPublic/sbirky/2025/Sb_2025_573_PZZ.pdf)), na rok 2027 lze čekat podobný termín | Nízká | Účetní programy |
| **Dividendy ze zahraničí do přiznání** (rozšíření Zdaním to?) | Z výpisu brokera přepočte dividendy na koruny, započte zahraniční daň a řekne, jestli a jak je uvést v přiznání | Bez formuláře W-8BEN strhnou USA z dividend 30 %, s ním 15 % ([Finex](https://finex.cz/w-8ben-formular/)); od roku 2027 se zvyšují limity pro povinné přiznání ([BusinessInfo](https://www.businessinfo.cz/clanky/zmeny-u-dani-z-prijmu-jake-novinky-cekaji-podnikatele-i-zamestnance-od-ledna-2027/)); přiznání za rok 2026 se podává na jaře 2027 | Střední (import CSV z brokerů) | Neověřoval jsem |
| **Rodičovská: plánovač pro celou rodinu** | Rozvrhne v čase mateřskou, otcovskou a rodičovský příspěvek, ukáže, kdy se peníze vyčerpají, a co změní střídání rodičů nebo dřívější návrat do práce | Celkem 350 000 Kč na dítě, u vícerčat od roku 2026 nově 700 000 Kč; měsíčně až 70 % třicetinásobku denního vyměřovacího základu, bez něj nejvýš 15 000 Kč ([Dostupný advokát](https://dostupnyadvokat.cz/blog/rodicovsky-prispevek)); čerpat lze nejdéle do 3 let dítěte ([MPSV](https://mpsv.gov.cz/rodicovsky-prispevek-1)) | Nízká | Kalkulačky výše příspěvku (např. [Měšec](https://www.mesec.cz/kalkulacky/rodicovsky-prispevek/)), ne plánovač pro oba rodiče |
| **Dluhy: exekuce, nebo oddlužení?** | Spočítá, kolik dlužníkovi zůstane z výplaty, jak dlouho by splácel v exekuci a jak by vypadalo oddlužení; odkáže na bezplatnou pomoc | Od 2026 platí nový výpočet nezabavitelné částky, na dlužníka 14 102 Kč ([Finance.cz](https://www.finance.cz/553500-kolik-vam-musi-zustat-z-vyplaty-v-roce-2026-podivejte-se-na-novy-vypocet-nezabavitelne-castky/)); oddlužení od října 2024 trvá 3 roky pro všechny s minimální splátkou kolem 2 200 Kč a v exekuci je kolem 606 tisíc lidí ([Skrblík](https://www.skrblik.cz/?p=1239)) | Nízká | Kalkulačky srážek (Měšec, Peníze.cz, RuleCalc) a [kalkulátor splátek justice](https://www.pilnikov.cz/wp-content/uploads//2025/10/OP-letak-BAR-7_2025-oddluzeni.pdf), ale bez srovnání obou cest; některé weby uvádějí ještě starší pravidla oddlužení |

**Doporučené pořadí:**

1. **Výpověď 2026** jako nejjednodušší; poptávka je celoroční.
2. **Cestovní příkaz 2027** připravit předem a dokončit hned po vydání nové vyhlášky na konci prosince.
3. **Dividendy do přiznání** na leden až březen, nejlépe jako součást Zdaním to?.
4. **Rodičovská** a **Dluhy** nechat na později: jde o citlivá témata a texty musí být velmi přesné; u dluhů je odkaz na bezplatnou dluhovou poradnu povinný.

## Zadání pro Claude Code: Výpověď 2026

Výpověď 2026 provede zaměstnance koncem pracovního poměru: z data doručení výpovědi spočítá poslední den, odstupné a podporu v nezaměstnanosti a vypíše, co udělat do kdy.

**Podklady, ze kterých prompt vychází:**

- **Výpovědní doba:** od 1. 6. 2025 začíná dnem doručení výpovědi a končí dnem, který se s ním číslem shoduje ([epravo](https://www.epravo.cz/top/clanky/finalni-podoba-flexibilni-novely-zakoniku-prace-nabyla-ucinnosti-co-nas-ceka-119713.html)); výpověď doručená 10. července tedy končí 10. září ([Jenprace.cz](https://www.jenprace.cz/magazin/novela-zakoniku-prace-2024-slibuje-vetsi-flexibilitu-zasadni-novinky-a-pasti)). Obvykle trvá 2 měsíce, u výpovědi podle § 52 písm. f) až h) jen 1 měsíc ([epravo](https://www.epravo.cz/top/clanky/byznys-a-paragrafy-dil-9-flexinovela-zakoniku-prace-119600.html)). Pozor: některé weby uvádějí příklady, které tomuto pravidlu neodpovídají.
- **Odstupné:** nejméně 1×, 2× nebo 3× průměrný výdělek podle toho, zda pracovní poměr trval méně než rok, 1 až 2 roky, nebo aspoň 2 roky ([MPSV](https://ppropo.mpsv.cz/pdf/VI223Odstupne.pdf)).
- **Podpora v nezaměstnanosti 2026:** podpůrčí doba 5 měsíců do 52 let, 8 měsíců od 52 do 57 let a 11 měsíců nad 57 let; do 52 let první 2 měsíce 80 %, další 2 měsíce 50 %, pak 40 % čistého výdělku; maximum 38 537 Kč měsíčně ([Dostupný advokát](https://dostupnyadvokat.cz/blog/narok-na-podporu-v-nezamestnanosti), [Banky.cz](https://www.banky.cz/clanky/jak-se-v-roce-2026-meni-podpora-v-nezamestnanosti/)). Vláda navrhuje od roku 2027 podporu snížit ([Finance.cz](https://www.finance.cz/kalkulacky/podpora-v-nezamestnanosti-srovnani-2026-2027/)), pravidla pro rok 2027 tedy nejsou jistá.

```markdown
# Úkol: Výpověď 2026 – kdy končím a co mi náleží

## Cíl
Statický web v češtině pro zaměstnance, který dostal nebo podává výpověď:
1. Z data doručení a důvodu výpovědi spočítá poslední den pracovního poměru.
2. Spočítá zákonné minimum odstupného (pokud na něj je nárok).
3. Odhadne podporu v nezaměstnanosti po měsících podle data podání žádosti.
4. Vypíše kontrolní seznam: zápočtový list, proplacení dovolené, registrace na úřadu
   práce, zdravotní pojišťovna.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Výpočty v `vypoved.js` (čisté funkce), parametry v `rules.json` po letech (2026, 2027)
  se zdrojem a datem; výpočet podpory se řídí datem podání žádosti.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř v zákoníku práce (§ 51, § 52, § 67) a zákoně o zaměstnanosti a vypiš tabulku
pravidlo → zdroj → datum: počátek a konec výpovědní doby, kratší výpovědní doba podle
důvodu, výpověď ve zkušební době, ochranná doba, nárok a výše odstupného, proplacení
nevyčerpané dovolené, podpůrčí doba a sazby podpory pro rok 2026 i 2027 (stav návrhu
k datu ověření), maximum podpory. Kde se zdroje liší, řiď se textem zákona.

## Pravidla (ověř)
- Výpovědní doba začíná dnem doručení a končí dnem se stejným číslem o N měsíců později;
  když takový den v měsíci není, končí posledním dnem měsíce.
- Odstupné jen při výpovědi z organizačních důvodů (§ 52 a–c) nebo dohodě z týchž důvodů.
- Podpora: sazby a podpůrčí doba podle věku ke dni podání žádosti, strop měsíčně.

## Obrazovky
1. Formulář: datum doručení, kdo dává výpověď, důvod (výběr se srozumitelnými popisy),
   délka pracovního poměru, průměrný hrubý a čistý výdělek, věk, zkušební doba ano/ne.
2. Výsledek: poslední den velkým písmem, odstupné, tabulka podpory po měsících
   s celkovým součtem.
3. Kontrolní seznam s termíny, lze vytisknout.
4. Patička: "Orientační výpočet, nejde o právní poradenství", datum ověření, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - doručení 10. 7. 2026, 2 měsíce → konec 10. 9. 2026
  - doručení 31. 12. 2026, 2 měsíce → konec 28. 2. 2027
  - výpověď podle § 52 písm. g) → výpovědní doba 1 měsíc
  - pracovní poměr 1,5 roku, průměrný výdělek 40 000 Kč, § 52 písm. c) → odstupné 80 000 Kč
  - výpověď ze strany zaměstnance → odstupné 0
  - věk 40, čistý výdělek 30 000 Kč, žádost v roce 2026 → podpora 24 000, 24 000, 15 000,
    15 000, 12 000 Kč
  - věk 40, čistý výdělek 60 000 Kč → první měsíce omezeny stropem 38 537 Kč
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Nic se neukládá ani neodesílá.

## Postup
Nejdřív tabulka ověřených pravidel a čekej na schválení. Pak testy, `vypoved.js`, UI.
Na konci spusť testy a porovnej výpočet podpory s kalkulačkou Úřadu práce nebo MPSV.
```

## Zadání pro Claude Code: Cestovní příkaz 2027

Cestovní příkaz 2027 spočítá náhrady za tuzemskou pracovní cestu a vytiskne vyúčtování do PDF. Sazby se mění každý rok vyhláškou, proto je v zadání sada pro rok 2026 a prázdné místo pro rok 2027, které se doplní po vydání nové vyhlášky.

**Podklady, ze kterých prompt vychází:**

- **Sazby 2026 (vyhláška č. 573/2025 Sb.):** základní náhrada 5,90 Kč za km u osobních aut a 1,60 Kč u jednostopých vozidel; stravné v soukromé sféře nejméně 155 Kč (5–12 h), 236 Kč (12–18 h) a 370 Kč (nad 18 h); ve veřejné sféře 155–185 Kč u cest 5–12 h a 370–442 Kč nad 18 h ([Práce a mzda](https://www.praceamzda.cz/predpisy/573-2025-sb), [epravo](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2025/573)).
- **Průměrné ceny pohonných hmot 2026:** benzin 95 34,70 Kč, benzin 98 39 Kč, nafta 34,10 Kč za litr a elektřina 7,20 Kč za kWh ([epravo](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2025/573)); použijí se, když zaměstnanec cenu nedoloží dokladem ([epravo](https://www.epravo.cz/top/clanky/nove-sazby-cestovnich-nahrad-pro-rok-2025-119046.html?pdf=1)).
- **Termín:** vyhláška pro rok 2026 vyšla 22. 12. 2025 ([Sbírka zákonů](https://www.epravo.cz/_dataPublic/sbirky/2025/Sb_2025_573_PZZ.pdf)).

```markdown
# Úkol: Cestovní příkaz 2027 – náhrady za tuzemské pracovní cesty

## Cíl
Statický web v češtině pro malé firmy a živnostníky: zadám pracovní cestu (nebo více
cest za měsíc) a aplikace spočítá náhradu za použití vlastního auta, náhradu za pohonné
hmoty a stravné, a vytvoří vyúčtování cestovního příkazu k tisku nebo uložení do PDF.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- PDF přes tiskový styl (`@media print`) a `window.print()` – žádná knihovna.
- Výpočty v `cesty.js` (čisté funkce), sazby v `rules.json` po letech:
  "2026" (vyhláška 573/2025 Sb.) a "2027" (vyplní se po vydání vyhlášky, do té doby
  `null`). Rok sazeb se volí podle data cesty.
- Cesty se mohou ukládat jen do `localStorage` prohlížeče (obal v try/catch), nikam jinam.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř ve vyhlášce 573/2025 Sb. a zákoníku práce (§ 157, § 158, § 163, § 176) a vypiš tabulku
hodnota → zdroj → datum: sazby za km, stravné v soukromé i veřejné sféře (všechna tři
pásma), průměrné ceny pohonných hmot, pravidla krácení stravného za poskytnuté jídlo
(procenta podle délky cesty), přirážku za přívěs. Zjisti, zda už vyšla vyhláška pro
rok 2027; pokud ano, doplň ji, pokud ne, nech `null` a v UI ukaž upozornění.
Zvlášť ověř, co z toho může uplatnit OSVČ za sebe (náhrady za vlastní auto, paušální
výdaj na dopravu, stravné) a nic nepotvrzeného nepoužij.

## Výpočet (ověř)
- Základní náhrada = km × sazba za km (u přívěsu navýšení podle zákona).
- Náhrada za PHM = km × spotřeba z technického průkazu / 100 × cena (z dokladu,
  jinak vyhlášková).
- Stravné podle délky cesty v daném dni, kráceno za poskytnutá jídla.
- Zaokrouhlení podle pravidel z vyhlášky; částky v Kč na haléře, součet na koruny.

## Obrazovky
1. Hlavička: firma, zaměstnanec, vozidlo (SPZ, spotřeba, palivo), sféra (soukromá/veřejná).
2. Seznam cest: datum, čas odjezdu a návratu, odkud – kam – zpět, km, účel, poskytnutá
   jídla, cena PHM z dokladu (volitelně).
3. Souhrn: tabulka cest a součty po položkách; tlačítko Tisk/PDF.
4. Patička: použitá vyhláška a datum ověření, "Orientační výpočet".

## Kritéria hotovo
- `node --test` projde, včetně těchto případů (sazby 2026, osobní auto):
  - 100 km × 5,90 Kč = 590 Kč základní náhrady
  - 100 km, spotřeba 6 l/100 km, benzin 95 bez dokladu → 6 × 34,70 = 208,20 Kč
  - cesta 13 hodin bez jídla, soukromá sféra → stravné 236 Kč
  - cesta 20 hodin → 370 Kč; cesta 4 hodiny → 0 Kč
  - elektromobil 100 km, 18 kWh/100 km bez dokladu → 18 × 7,20 = 129,60 Kč
  - cesta v roce 2027 bez vydané vyhlášky → aplikace výpočet nepustí a vysvětlí proč
- Vytištěné PDF se vejde na jednu stranu A4 pro jednu cestu.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- README česky: jak každý rok doplnit novou vyhlášku do `rules.json`.

## Postup
Nejdřív tabulka ověřených sazeb a čekej na schválení. Pak testy, `cesty.js`, formulář,
nakonec tiskový styl. Na konci spusť testy a vytiskni ukázkové vyúčtování do PDF.
```

## Zadání pro Claude Code: Dividendy ze zahraničí

Dividendy ze zahraničí připraví z výpisu brokera podklady do daňového přiznání: dividendy v korunách po zemích, zahraniční daň, kolik z ní jde započíst a kolik doplatit v Česku. Nejlépe jako záložka aplikace Zdaním to?; prompt počítá s oběma variantami.

**Podklady, ze kterých prompt vychází:**

- **Srážka v USA:** bez formuláře W-8BEN se z amerických dividend strhává 30 %, s ním 15 % ([Finex](https://finex.cz/w-8ben-formular/)).
- **Přepočet na koruny:** buď denním kurzem ČNB, nebo jednotným kurzem, který každý rok stanoví pokyn GFŘ; v jednom roce nelze oba způsoby kombinovat ([DAUČ](https://www.dauc.cz/clanky/13545/drzba-zahranicnich-akcii-fyzickou-osobou-jak-zdanit-vyplacenou-dividendu)).
- **Zápočet:** zahraniční daň se započítává metodou prostého zápočtu, nejvýš do sazby podle smlouvy o zamezení dvojího zdanění, za každý stát zvlášť ([Finex](https://finex.cz/zdaneni-dividend-jak-postupovat-pri-vyplneni-danoveho-priznani/), [Finmag](https://www.finmag.cz/finance/309218-investice-a-dane-ii-dividendy)).
- **Pozor na rozpory ve zdrojích:** některé texty uvádějí zahraniční dividendy v příloze č. 3 a dílčím základu podle § 8 ([Finex](https://finex.cz/zdaneni-dividend-jak-postupovat-pri-vyplneni-danoveho-priznani/)), jiné v samostatném základu daně podle § 16a a příloze č. 4 ([RuleCalc](https://rulecalc.com/cs/dan/dan-fo-samostatny-zaklad)). Agent musí postup ověřit v aktuálních pokynech k přiznání od finanční správy.
- **Limity pro přiznání:** od roku 2027 se zvyšují ([BusinessInfo](https://www.businessinfo.cz/clanky/zmeny-u-dani-z-prijmu-jake-novinky-cekaji-podnikatele-i-zamestnance-od-ledna-2027/)); zda se vztahují na zahraniční dividendy, je třeba ověřit.

```markdown
# Úkol: Dividendy ze zahraničí – podklady do daňového přiznání

## Cíl
Statický web v češtině: nahraju výpis dividend od brokera (nebo zadám ručně) a dostanu
za zvolený rok:
1. Hrubé dividendy v Kč po zemích zdroje.
2. Sraženou zahraniční daň, uznatelný zápočet a českou daň k doplacení.
3. Odpověď, zda musím podat přiznání, a kam co vyplnit (příloha, řádek) podle aktuálních
   pokynů finanční správy.
4. Upozornění, kde jsem přeplatil zahraniční daň (např. chybějící W-8BEN).

## Kde to postavit
Pokud existuje projekt "Zdaním to?", přidej to jako záložku a použij jeho `rules.json`.
Jinak založ samostatný statický web se stejnou strukturou.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Výpočty v `dividendy.js` (čisté funkce), parsery CSV v `parsers/` – jeden soubor na
  brokera (začni XTB a Trading 212, pak Interactive Brokers a Revolut) + ruční zadání.
- Kurzy: jednotné kurzy GFŘ po letech v `rules.json`; denní kurzy ČNB stáhne skript
  `scripts/update-cnb.mjs` do `data/cnb-RRRR.json` (web nevolá ČNB z prohlížeče).
- Sazby srážkové daně podle smluv o zamezení dvojího zdanění pro hlavní země (USA, Německo,
  Velká Británie, Nizozemsko, Irsko, Francie, Švýcarsko, Kanada) v `rules.json` se zdrojem.
- Nahraný soubor se zpracuje jen v prohlížeči, nikam se neodesílá ani neukládá.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
V aktuálních pokynech k vyplnění přiznání k dani z příjmů FO (finanční správa) a v zákoně
o daních z příjmů ověř a vypiš tabulku pravidlo → zdroj → datum:
- kam patří dividendy ze zahraničí (dílčí základ § 8, nebo samostatný základ § 16a),
  která příloha a řádky se vyplňují a jak se uplatní zápočet,
- sazbu české daně, způsob přepočtu kurzem a zákaz kombinace kurzů v jednom roce,
- kdy je přiznání povinné (zaměstnanec, OSVČ) a jak to mění limity od roku 2027,
- sazby podle smluv pro země výše a jednotný kurz pro rok 2026, jakmile ho GFŘ vydá.
Zdroje se v tom rozcházejí – rozhoduje text zákona a pokyny finanční správy.

## Výpočet (ověř)
- Základ = hrubá dividenda (před zahraniční daní) přepočtená na Kč.
- Česká daň = sazba × základ (za každou zemi zvlášť pro účely zápočtu).
- Zápočet = min(skutečně sražená daň, sazba podle smlouvy × základ, česká daň z tohoto
  příjmu). Rozdíl nad smluvní sazbou se v ČR nezapočte – ukaž ho jako "přeplaceno v zahraničí".
- Doplatek = česká daň − zápočet (min. 0).

## Obrazovky
1. Výběr roku, způsobu přepočtu (jednotný / denní kurz), nahrání CSV nebo ruční zadání.
2. Kontrola importu: tabulka výplat s možností opravit zemi nebo částku.
3. Výsledek po zemích + celkem; jasná věta "Doplatíš X Kč" nebo "Nic nedoplácíš".
4. Návod k vyplnění přiznání krok za krokem s čísly z výpočtu.
5. Patička: "Orientační výpočet, nejde o daňové poradenství", datum ověření, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů (kurz 23 Kč/USD):
  - 100 USD hrubě, sraženo 15 USD → základ 2 300 Kč, daň 345 Kč, zápočet 345 Kč, doplatek 0
  - 100 USD hrubě, sraženo 30 USD (bez W-8BEN) → zápočet 345 Kč, doplatek 0,
    přeplaceno v zahraničí 345 Kč
  - 100 USD hrubě z rezidenta státu bez srážky → doplatek 345 Kč
  - pokus kombinovat jednotný a denní kurz v jednom roce → chyba s vysvětlením
  - parser XTB i Trading 212 načte ukázkový soubor (vytvoř anonymní testovací CSV)
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- README česky: jak přidat nového brokera a jak každý rok doplnit jednotný kurz.

## Postup
Nejdřív tabulka ověřených pravidel a čekej na schválení. Pak testy, `dividendy.js`,
parsery, UI. Na konci spusť testy a projdi ukázkový výpočet až po návod k vyplnění.
```

## Zadání pro Claude Code: Rodičovská pro celou rodinu

Rodičovská pro celou rodinu rozvrhne na časové ose mateřskou, otcovskou a rodičovský příspěvek a ukáže, kolik rodina dostane každý měsíc, kdy se peníze vyčerpají a co změní střídání rodičů nebo dřívější návrat do práce.

**Podklady, ze kterých prompt vychází:**

- **Mateřská a otcovská:** obě činí 70 % redukovaného denního vyměřovacího základu; redukční hranice pro rok 2026 jsou 1 633, 2 449 a 4 897 Kč a započítává se z nich 100 %, 60 % a 30 % ([ČSSZ](https://www.cssz.gov.cz/podrobne-informace-o-penezite-pomoci-v-materstvi), [přehled ČSSZ 2026](https://www.zdirec.cz/storage/content/Aktuality/tz-prehled-nejdulezitejsich-udaju-pro-socialni-zabezpeceni-v-roce-2026.pdf)). Mateřská trvá nejvýš 28 týdnů, u vícerčat 37, a otcovská 2 týdny ([příručka ČSSZ](https://www.cssz.cz/documents/20143/950156/TZ_Pr%CC%8Ci%CC%81ruc%CC%8Cka+pro+nasta%CC%81vaji%CC%81ci%CC%81+rodic%CC%8Ce+pomu%CC%8Az%CC%8Ce+zodpove%CC%8Cde%CC%8Ct+c%CC%8Caste%CC%81+dotazy.pdf/a7f1a3e7-74d2-f8e1-1a9b-ea3f79de1b4a)).
- **Rodičovský příspěvek:** celkem 350 000 Kč, u vícerčat od roku 2026 nově 700 000 Kč; měsíčně až 70 % třicetinásobku denního vyměřovacího základu, bez něj nebo při nízkém základu nejvýš 15 000 Kč ([Dostupný advokát](https://dostupnyadvokat.cz/blog/rodicovsky-prispevek)); čerpat lze nejdéle do 3 let dítěte ([MPSV](https://mpsv.gov.cz/rodicovsky-prispevek-1)). Výši čerpání lze měnit jednou za tři měsíce ([Měšec](https://www.mesec.cz/kalkulacky/rodicovsky-prispevek/)).
- **Možná změna:** programové prohlášení vlády počítá se zvýšením příspěvku na 400 000 Kč ([Kurzy.cz](https://zpravy.kurzy.cz/837132-rodicovsky-prispevek-2026-nova-pravidla-a-vyse-prispevku/)); stav je třeba ověřit.

```markdown
# Úkol: Rodičovská pro celou rodinu – plánovač mateřské, otcovské a rodičovské

## Cíl
Statický web v češtině pro budoucí rodiče:
1. Z hrubých příjmů obou rodičů odhadne denní vyměřovací základ, mateřskou a otcovskou.
2. Na časové ose od porodu do 3 let dítěte rozvrhne mateřskou, otcovskou a rodičovský
   příspěvek; uživatel posouvá měsíční výši rodičovské a vidí, kdy se vyčerpá.
3. Umožní střídání rodičů a dřívější návrat do práce a ukáže měsíční příjem rodiny.
4. Upozorní, když by část rodičovské propadla, protože se do 3 let nevyčerpá.

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly); graf/časová osa v SVG bez knihovny.
- Výpočty v `rodina.js` (čisté funkce), parametry v `rules.json` po letech se zdrojem
  a datem (redukční hranice, sazby, celková částka, stropy, délky dávek).
- Plán se může uložit jen do `localStorage` (obal v try/catch); nic se neodesílá.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř na webu ČSSZ a MPSV a vypiš tabulku pravidlo → zdroj → datum: výpočet denního
vyměřovacího základu, redukční hranice pro 2026 a 2027 (pokud už jsou vyhlášené),
procenta redukce pro mateřskou, zaokrouhlování, délku mateřské (i vícerčata) a nejdřívější
nástup, otcovskou (délka, kdy čerpat), podmínky nároku na mateřskou, rodičovský příspěvek
(celková částka, vícerčata, strop podle DVZ, 15 000 Kč bez DVZ, do kdy čerpat, jak často
měnit výši, co se stane s nevyčerpanou částkou při narození dalšího dítěte) a stav návrhu
na zvýšení na 400 000 Kč. Zdroje se u zaokrouhlení a starších částek liší – řiď se ČSSZ
a MPSV.

## Výpočet (ověř)
- DVZ = příjmy za rozhodné období / počet dní; redukce po pásmech; mateřská denně = 70 %
  redukovaného DVZ.
- Strop rodičovské měsíčně = max(15 000 Kč, 70 % × 30 × vyšší DVZ z rodičů);
  u vícerčat dvojnásobek.
- Čerpání: zbývající částka se snižuje o zvolenou měsíční výši až do nuly nebo do 3 let
  dítěte; zbytek k 3. narozeninám označ jako propadlý.

## Obrazovky
1. Formulář: termín porodu, vícerčata ano/ne, hrubý měsíční příjem obou rodičů za
   posledních 12 měsíců, kdo nastoupí na mateřskou, zda otec čerpá otcovskou.
2. Časová osa po měsících s barevnými úseky (mateřská, otcovská, rodičovská) a měsíční
   částkou; posuvník výše rodičovské; přepínač "střídání rodičů".
3. Souhrn: celkem dostaneme, kdy se rodičovská vyčerpá, kolik případně propadne.
4. Kontrolní seznam: kdy podat žádosti a kde.
5. Patička: "Orientační výpočet, nejde o rozhodnutí úřadu", datum ověření, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů:
  - příjem 30 000 Kč měsíčně → DVZ 986,30 Kč, redukovaný DVZ 987 Kč (celý pod 1. hranicí)
  - DVZ 1 000 Kč → strop rodičovské 21 000 Kč měsíčně
  - bez DVZ, 15 000 Kč měsíčně → 350 000 Kč vyčerpáno za 24 měsíců (23 × 15 000 + 5 000)
  - rodičovská od 6. měsíce dítěte po 8 000 Kč → do 3 let vyčerpáno 240 000 Kč,
    propadne 110 000 Kč a aplikace na to upozorní
  - vícerčata bez DVZ → strop 30 000 Kč, celkem 700 000 Kč
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- README česky: jak každý rok aktualizovat redukční hranice a částky.

## Postup
Nejdřív tabulka ověřených pravidel a čekej na schválení. Pak testy, `rodina.js`, časová
osa, formulář. Na konci spusť testy a porovnej výši mateřské s kalkulačkou MPSV nebo ČSSZ.
```

## Zadání pro Claude Code: Dluhy – exekuce, nebo oddlužení?

Dluhy – exekuce, nebo oddlužení? je klidný a srozumitelný průvodce pro lidi s dluhy. Spočítá, kolik jim zůstane z výplaty, jak dlouho by splácely v exekuci a jak by vypadalo oddlužení, a hlavně je pošle za bezplatnou pomocí. Téma je citlivé, proto má zadání přísná pravidla: žádné reklamy, žádné odkazy na placené zprostředkovatele a výrazný odkaz na poradnu.

**Podklady, ze kterých prompt vychází:**

- **Nezabavitelná částka 2026:** na dlužníka 14 101,50 Kč (= 0,85 × součet životního minima, normativního nájemného a energetického paušálu), na každou vyživovanou osobu 3 525,37 Kč, součet se zaokrouhluje nahoru; zbytek nad limit 31 521 Kč (= 1,9 × týž součet) je zabavitelný celý ([ANAG](https://www.anag.cz/files/product/16/46/39788/data/3306_a.pdf), [money.cz](https://money.cz/novinky-a-tipy/rychle-zpravy/exekucni-srazky-2026/)).
- **Třetiny:** zbytek do limitu se zaokrouhlí dolů na částku dělitelnou třemi; na běžné dluhy jde jedna třetina, na přednostní (výživné, daně) dvě ([Finance.cz](https://www.finance.cz/553541-jak-ovlivni-nezabavitelna-castka-srazky-ze-mzdy-v-roce-2026/)). U čtyř a více exekucí se podle části zdrojů sráží dvě třetiny i u běžných dluhů ([Banky.cz](https://www.banky.cz/clanky/insolvencni-kalkulacka-jak-vypocitat-nezabavitelnou-castku/)) – ověřit.
- **Kontrolní příklady:** čistá mzda 23 000 Kč, běžný dluh → srážka 2 966 Kč; čistá mzda 50 000 Kč, přednostní dluh → srážka 25 391 Kč ([Finance.cz](https://www.finance.cz/553541-jak-ovlivni-nezabavitelna-castka-srazky-ze-mzdy-v-roce-2026/)).
- **Oddlužení:** od října 2024 trvá 3 roky pro všechny, opakované 5 let, bez povinného procenta splacení, s minimální splátkou kolem 2 200 Kč ([Skrblík](https://www.skrblik.cz/?p=1239), [Skrblík](https://www.skrblik.cz/?p=80875)); oficiální kalkulátor splátek provozuje justice ([leták](https://www.pilnikov.cz/wp-content/uploads//2025/10/OP-letak-BAR-7_2025-oddluzeni.pdf)). Některé weby uvádějí ještě starší pravidla (5 let, 30 %).

```markdown
# Úkol: Dluhy – exekuce, nebo oddlužení?

## Cíl
Statický web v češtině pro lidi s dluhy, psaný klidně a bez odborných zkratek:
1. Spočítá, kolik jim při exekuci zůstane z čisté mzdy a kolik se strhne.
2. Odhadne, jak dlouho by splácely v exekuci (při zadané výši dluhů).
3. Ukáže, jak by vypadalo oddlužení: měsíční splátka, délka, co se stane se zbytkem.
4. Na každé obrazovce výrazně nabídne bezplatnou pomoc (dluhové poradny, akreditované
   osoby pro sepis insolvenčního návrhu) s odkazy na oficiální seznamy.

## Pevná pravidla
- Žádné reklamy, affiliate odkazy, nabídky půjček ani odkazy na placené zprostředkovatele.
- Žádné sbírání kontaktů; nic se neukládá ani neodesílá.
- U každého výsledku věta: "Orientační výpočet. Závazně to posoudí poradna, exekutor
  nebo insolvenční soud."

## Technologie
- Čisté HTML + CSS + JavaScript (ES moduly), žádný build ani server.
- Výpočty v `dluhy.js` (čisté funkce), parametry po letech v `rules.json` se zdrojem a datem.
- Testy: vestavěný `node --test`. Nasazení: GitHub Pages.

## Než začneš psát kód
Ověř v nařízení vlády o nezabavitelných částkách, občanském soudním řádu (§ 276–279)
a insolvenčním zákoně a vypiš tabulku pravidlo → zdroj → datum: vzorce a částky pro rok
2026 (a 2027, pokud už jsou vyhlášené), zaokrouhlování, třetiny, přednostní pohledávky,
pravidlo pro 4 a více exekucí, paušální náhradu plátci mzdy, délku oddlužení (první
i opakované), minimální splátku a jak se počítá, odměnu insolvenčního správce, adresu
oficiálního kalkulátoru splátek a oficiální seznamy bezplatné pomoci. Zdroje se
v pravidlech oddlužení liší – rozhoduje zákon a web justice.cz.

## Výpočet (ověř)
- Nezabavitelná částka = dlužník + počet vyživovaných osob × částka na osobu,
  zaokrouhleno nahoru na Kč.
- Zbytek = čistá mzda − nezabavitelná částka; část do limitu zaokrouhlit dolů na
  dělitelnou třemi a rozdělit na třetiny; část nad limit se srazí celá.
- Srážka = 1/3 (běžné dluhy) nebo 2/3 (přednostní) z limitované části + celá část nad limit.
- Doba splácení v exekuci = dluh / měsíční srážka; volitelně s úrokem z prodlení,
  s jasným upozorněním, že dluh může růst rychleji, než se splácí.

## Obrazovky
1. Úvod: "Nejste v tom sami" + odkaz na bezplatnou poradnu hned nahoře.
2. Formulář: čistá mzda, počet vyživovaných osob, druh dluhů (běžné/přednostní),
   počet exekucí, celková výše dluhů.
3. Výsledek: kolik zůstane, kolik se strhne, odhad doby splácení; vedle toho karta
   "Jak by to vypadalo v oddlužení".
4. Další kroky: jak zjistit své exekuce (Centrální evidence exekucí), kde najít poradnu,
   co si připravit na první schůzku.
5. Patička: datum ověření pravidel, zdroje.

## Kritéria hotovo
- `node --test` projde, včetně těchto případů (rok 2026):
  - čistá mzda 23 000 Kč, bez vyživovaných osob, běžný dluh → srážka 2 966 Kč
  - čistá mzda 50 000 Kč, bez vyživovaných osob, přednostní dluh → srážka 25 391 Kč
  - čistá mzda 50 000 Kč, běžný dluh → srážka 10 507 + 4 377 = 14 884 Kč
  - 2 vyživované osoby → nezabavitelná částka 21 153 Kč
  - čistá mzda nižší než nezabavitelná částka → srážka 0
- Odkaz na bezplatnou pomoc je viditelný bez posouvání na každé obrazovce i na mobilu.
- Web funguje na mobilu (šířka 360 px) bez vodorovného posuvníku.
- Texty projdou kontrolou čtivosti: krátké věty, bez zkratek bez vysvětlení.

## Postup
Nejdřív tabulka ověřených pravidel a seznam oficiálních zdrojů pomoci a čekej na
schválení. Pak testy, `dluhy.js`, UI a texty. Na konci spusť testy a porovnej dva výpočty
s oficiálním kalkulátorem splátek justice.
```

## Zadání pro Claude Code v cloudu: společný web a čtyři návrhy designu

Toto zadání je první fáze společného webu: navrhne strukturu webu pro všechny aplikace z tohoto dokumentu a postaví čtyři výrazně odlišné designové varianty jako proklikatelné prototypy. Kalkulačky v ní ještě nepočítají naostro. Po výběru varianty následuje druhá fáze, sestavení webu.

**Jak to spustit:**

1. Exportuj tento dokument do Markdownu.
2. Na GitHubu založ prázdný repozitář (např. `ceske-kalkulacky`) a nahraj export jako `docs/zadani.md`.
3. Na [claude.ai/code](https://claude.ai/code) připoj GitHub, vyber repozitář a nech výchozí prostředí s přístupem k síti **Trusted**.
4. Vlož prompt níže. Claude pracuje ve vlastní větvi, na konci ji nahraje a vytvoří pull request; změny projdeš v panelu Changes ([dokumentace](https://code.claude.com/docs/en/claude-code-on-the-web.md)).
5. Varianty uvidíš na srovnávací stránce publikované jako artefakt na claude.ai, pokud to relace umí, a na obrázcích v pull requestu. Jinak si větev stáhni jako ZIP a otevři `designs/index.html`.

**Podklady k prostředí, ze kterých prompt vychází:**

- **Cloudová relace:** čistý stroj s Ubuntu 24.04, předinstalovaný Node.js 22 s npm; přístup **Trusted** povoluje mimo jiné npm, GitHub, `*.googleapis.com` a Google Fonts (`fonts.googleapis.com`, `fonts.gstatic.com`), ale ne CDN jako cdnjs nebo jsDelivr ([Cloud environments](https://code.claude.com/docs/en/cloud-environments.md)). Prototypy proto nesmí načítat knihovny z CDN, jinak by se na snímcích nevykreslily.
- **Artefakt:** jedna samostatná stránka do 16 MiB; smí načíst Google Fonts, relativní odkazy na další soubory nefungují a externí obrázky jsou blokované ([Artifacts](https://code.claude.com/docs/en/artifacts.md)). Srovnávací stránka proto musí mít vše vložené přímo v sobě.

```markdown
# Úkol: Společný web českých kalkulaček – informační architektura a 4 varianty designu

## Kontext
Chci jeden web v češtině, který spojí jednoduché kalkulačky a průvodce podle českých
pravidel. Podrobná zadání všech aplikací jsou v `docs/zadani.md` – je to zdroj pravdy
pro obsah, testovací příklady a citlivá pravidla. Aplikace:
- Peníze a investice: Plán48 (penzijko + DIP + odpočet 48 000 Kč), Penzijko kompas,
  Zdaním to? (prodej akcií a krypta + dividendy ze zahraničí), Inflační kalkulačka
- Daně a podnikání: Mám EET? + OSVČ 2027, Slevy 2027, Cestovní příkaz 2027
- Bydlení a energie: Bydlometr (refixace, nájem vs. koupě), Spot, nebo fix?
- Práce, rodina, škola: Výpověď 2026, Rodičovská pro celou rodinu, Přijímačky bez paniky,
  Volno 2027
- Dluhy: Exekuce, nebo oddlužení? (citlivé téma – viz pravidla v zadání)
Rozdělení do kategorií můžeš navrhnout lépe; zdůvodni to.

## Cíl této fáze
Jen návrh, žádné skutečné výpočty ani nasazení. Výstupy:
1. `docs/informacni-architektura.md`: kategorie, navigace, struktura URL, obsah úvodní
   stránky, vazby mezi nástroji (např. Plán48 ↔ Penzijko kompas ↔ Zdaním to?),
   vyhledávání, sdílené komponenty a 5 návrhů názvu webu (dostupnost domén neověřuj,
   jen to poznamenej).
2. Čtyři varianty designu ve složkách `designs/a-…` až `designs/d-…`. Každá obsahuje:
   - `index.html` – úvodní stránka webu,
   - `kategorie.html` – stránka kategorie Peníze a investice,
   - `kalkulacka.html` – Plán48 s vyplněnými ukázkovými daty (formulář, karta výsledku,
     graf, zdroje, upozornění),
   - `pruvodce.html` – Mám EET? jako dotazník po krocích (zobraz 2. krok a výsledek),
   - `tokens.css` – barvy, písma, velikosti, mezery, zaoblení, stíny; světlý i tmavý režim.
3. `designs/index.html` – rozcestník: u každé varianty název, odstavec o myšlence,
   3 výhody, 3 nevýhody, náhled a odkazy na stránky.
4. `designs/porovnani.html` – JEDNA samostatná stránka (veškeré CSS a SVG vložené, žádné
   relativní odkazy ani externí obrázky; povolené jsou jen Google Fonts), která ukáže
   klíčové obrazovky všech 4 variant vedle sebe v rámečku mobilu i desktopu. Pokud v této
   relaci můžeš publikovat artefakt, publikuj ji jako artefakt a dej mi odkaz.
5. Snímky obrazovky PNG (desktop 1440 px, mobil 390 px) všech stránek všech variant do
   `designs/screenshots/`.
6. Pull request "Návrhy designu – 4 varianty" se souhrnnou tabulkou variant a vloženými
   snímky úvodních stránek.

## Varianty
Každá varianta se musí lišit rozvržením, typografií, barvami, hustotou, tónem textů
a přístupem k ilustracím.
- A "Klidná jistota": civilní a věcná jako spolehlivá příručka, vysoký kontrast, hodně
  volného místa, jedna akcentní barva.
- B "Přátelský průvodce": teplé barvy, zaoblené tvary, vlastní jednoduché SVG ilustrace,
  konverzační texty; hlavním vzorem je průvodce po krocích.
- C "Datový nástroj": hustší rozvržení, tabulky a grafy, výchozí tmavý režim, číslice se
  stejnou šířkou; pro investory a živnostníky.
- D "Redakční": výrazná typografie kvalitních médií, kalkulačka zasazená do vysvětlujícího
  článku, "Co se mění v roce 2027" jako hlavní obsah úvodní stránky.

## Společné požadavky pro všechny varianty
- Jazyk čeština; písma z Google Fonts s podporou češtiny (latin-ext) – zkontroluj č, ř, ů, ě.
- Žádná varianta nesmí vypadat jako oficiální web státu: žádný státní znak, barvy ani
  styl gov.cz či Portálu občana. Žádná loga bank ani jiných značek, žádné fotky lidí.
- Mobile-first: na šířce 360 px bez vodorovného posuvníku; desktop 1440 px.
- Přístupnost WCAG 2.2 AA: kontrast textu aspoň 4,5:1, viditelný fokus, ovládání
  klávesnicí, popisky formulářů, respektování `prefers-reduced-motion`.
- Světlý i tmavý režim (`prefers-color-scheme` + přepínač).
- Žádný JavaScript ani knihovny z CDN, žádné externí obrázky, žádné měření návštěvnosti.
  Ikony a grafy jako vložené SVG. Pokud potřebuješ knihovnu, nainstaluj ji z npm
  a zkopíruj do repozitáře.
- Každá varianta ukáže tyto komponenty: hlavičku s navigací a vyhledáváním, kartu nástroje,
  formulář s nápovědou, kartu výsledku (velké číslo + vysvětlení), graf, tabulku, štítek
  "Pravidla ověřena k [datum]", štítek "Návrh, zatím neschváleno", upozornění "Nejde
  o poradenství", seznam zdrojů, kontrolní seznam s termíny, chybový stav formuláře
  a tiskový styl.
- Ukázková data ber z testovacích příkladů v `docs/zadani.md` (např. penzijko 3 000 Kč
  + životní pojištění 2 500 Kč měsíčně → odpočet 45 600 Kč). Nic si nevymýšlej.
- V informační architektuře dodrž pravidla pro dluhy: bez reklam, bez placených
  zprostředkovatelů, výrazný odkaz na bezplatnou pomoc.

## Postup
Pracuj samostatně a neptej se mě; rozumné předpoklady a rozhodnutí zapisuj do
`docs/rozhodnuti.md`.
1. Přečti `docs/zadani.md` a napiš informační architekturu.
2. Připrav společný ukázkový obsah v `designs/_obsah/` (JSON), aby všechny varianty
   ukazovaly stejné texty a čísla.
3. Postav varianty; klidně každou svěř samostatnému subagentovi, ať se od sebe opravdu liší.
4. Kontroly: pomocí Puppeteeru (stáhne Chrome z storage.googleapis.com) a `@axe-core/puppeteer`
   otestuj každou stránku: 0 závažných chyb přístupnosti (serious, critical), žádné
   přetečení na 360 px, žádný požadavek na cizí doménu kromě Google Fonts. Opravuj, dokud
   kontroly neprojdou. Když se prohlížeč nepodaří spustit, napiš to a pokračuj bez snímků.
5. Pořiď snímky, sestav `designs/index.html` a `designs/porovnani.html`, publikuj artefakt
   (pokud to jde), commitni, nahraj větev a vytvoř pull request.

## Kritéria hotovo
- 4 varianty × 4 stránky + `tokens.css`; každá stránka funguje otevřená přímo z disku.
- Kontroly přístupnosti, přetečení a externích požadavků projdou u všech stránek.
- Snímky desktop i mobil u všech stránek (nebo zdůvodnění, proč chybí).
- `docs/informacni-architektura.md`, `docs/rozhodnuti.md`, `designs/index.html`,
  `designs/porovnani.html` a pull request s tabulkou variant.
- Na konci mi napiš 5 řádků: odkaz na artefakt nebo PR a jednu větu ke každé variantě.

## Mimo rozsah
Skutečné výpočty, soubory s pravidly a nasazení – to přijde v další fázi po výběru varianty.
```

Až si variantu vybereš (klidně s prvky z jiné), napiš mi to a připravím zadání pro druhou fázi: sestavení celého webu ve zvoleném designu.

## Zdroje

- [ČSÚ – Výběrové šetření o využívání ICT v domácnostech](https://csu.gov.cz/vykazy/vyberove_setreni_o_informacnich_a_komunikacnich_technologiich_v_domacnostech_a_jejich_vyuzivani_jednotlivci)
- [ČSÚ – ICT v domácnostech a uživatelé ICT](https://csu.gov.cz/ict-v-domacnostech-a-uzivatele-ict)
- [ČSÚ – Digitální dovednosti v Česku jsou nad průměrem EU](https://csu.gov.cz/produkty/digitalni-dovednosti-v-cesku-jsou-nad-prumerem-eu)
- [Seznam Zprávy – Obrat e-shopů v roce 2025](https://www.seznamzpravy.cz/clanek/ekonomika-obrat-e-shopu-v-cesku-loni-mezirocne-vzrostl-o-sest-procent-na-206-miliard-korun-296214)
- [BusinessInfo – E-commerce 2026](https://www.businessinfo.cz/clanky/e-commerce-2026-plny-kosik-neznamena-vzdy-dobry-byznys/)
- [Echo24 – Vláda schválila změnu pravidel penzijního spoření](https://www.echo24.cz/a/HF2qp/zpravy-ekonomika-vlada-schvalila-zmenu-pravidel-penzijniho-sporeni)
- [Blesk – Sněmovna podpořila změny penzijka v 1. čtení](https://www.blesk.cz/clanek/848986)
- [Energozrouti – Mladí do 30 let až 8 160 Kč ročně](https://energozrouti.cz/clanek/mladi-do-30-let-maji-od-statu-dostavat-8160-kc-rocne)
- [FXstreet – DIP: počty smluv a povědomí](https://www.fxstreet.cz/klicova-slova+dip.html)
- [money.cz – Daňově podporované produkty spoření na stáří 2026](https://money.cz/novinky-a-tipy/?p=15884)
- [E15 – DIP: podmínky](https://www.e15.cz/dip-sporeni-duchod-2024)
- [Měšec – Kalkulačka státního příspěvku](https://www.mesec.cz/kalkulacky/statni-prispevek-penzijko/)
- [E15 – Kalkulačka daňového odpočtu 2026](https://www.e15.cz/kalkulacky/kalkulacka-danovy-odpocet-za-zivotni-pojisteni-a-penzijni-sporeni-2026-1411844)
- [Průvodce podnikáním – Návrat EET v roce 2027](https://www.pruvodcepodnikanim.cz/?mesic=12&rok=2024)
- [ČTK – Vláda schválila návrat EET](https://www.ceskenoviny.cz/zpravy/2819962)
- [BusinessInfo – Nižší ceny elektřiny od ledna 2026](https://www.businessinfo.cz/clanky/od-ledna-2026-nizsi-ceny-elektriny-pro-domacnosti-a-firmy-eru-vydal-zmenovy-cenovy-vymer/)
- [Echo24 – Domácnosti, úspory energií a dynamický tarif](https://www.echo24.cz/a/H3cCC/zpravy-ekonomika-ceske-domacnosti-uspory-energii-nove-trendy-v-energetice-cez-ipsos-analyza)
- [ČTK / Generali – Dostupnost bydlení](https://www.ceskenoviny.cz/zpravy/2894519)

* [KB Penzijní společnost – Sazebník](https://www.kb.cz/getmedia/c272ceaa-21af-4b06-9b4e-e45b6b00845b/sazebnik-ps.pdf)
* [Conseq – Sazebník penzijního spoření](https://www.conseq.cz/getmedia/b7b9cd9e-104a-4d11-bd9b-13c7488511c1/Zenit-SDPS-SGDS-C2201.pdf.aspx?ext=.pdf)
* [ČNB – Převod z transformovaného fondu do účastnických fondů](https://www.cnb.cz/cs/dohled-financni-trh/legislativni-zakladna/stanoviska-k-regulaci-financniho-trhu/RS2013-04)
* [NN Penzijní společnost – Sazebník (Air Bank)](https://airbank.cz/file-download/informace-o-pobidkach-a-sazebnik)
* [MF – Prezentace Lepší penzijko](https://mf.gov.cz/assets/attachments/2026-06-03_Prezentace-Lepsi-penzijko-3-vyhody-nejvetsiho-zlepseni-penzijniho-sporeni-v-historii_v02.pdf)

- [MF – Brožura EET 2.0 jednoduše, moderně a přehledně](https://mf.gov.cz/assets/attachments/2026-09-09_Brozura-EET-2-0-jednoduse-moderne-a-prehledne.pdf)
- [Fakturoid – EET 2.0](https://www.fakturoid.cz/almanach/legislativa/eet)
- [Deník – Vláda projednala nové EET](https://www.denik.cz/ekonomika/vlada-projednala-nove-eet/)
- [epravo – EET 2.0 je na světě](https://www.epravo.cz/top/aktualne/eet-20-je-na-svete-od-ledna-2027-budou-podnikatele-evidovat-i-platby-kartou-a-qr-kodem-121639.html?pdf=1)
- [Podnikatel.cz – Jak bude vypadat EET 2.0](https://www.podnikatel.cz/clanky/jak-bude-vypadat-eet-2-0-prinasime-podrobny-prehled/)
- [Podnikatel.cz – Aplikace MOJE EET](https://www.podnikatel.cz/clanky/financni-sprava-ukazala-jak-by-mela-vypadat-aplikace-zdarma-moje-eet/)
- [DAUČ – Moje EET pro drobné podnikatele](https://www.dauc.cz/aktuality/2087/moje-eet-pro-drobne-podnikatele)
- [BusinessInfo – EET 2.0](https://www.businessinfo.cz/eet)
- [PPAS – Dodatek pro produkt SPOT](https://www.ppas.cz/sites/default/files/ceniky/2023/Dodatek_pro_SPOT.pdf)
- [OTE – Zavedení 15minutového intervalu na denním trhu](https://www.ote-cr.cz/../o-spolecnosti/zpravy_ote/tz20250930_spusteni-15min-na-dt.pdf)
- [OTE – Metodika přepočtu čtvrthodinových TDD](https://www.ote-cr.cz/en/documentation/electricity-documentation/metodika_teplotniho_prepoctu_tdd_2026-1.pdf)
- [aRecenze – Spot vs. fix v roce 2026](https://www.arecenze.cz/?p=385199)
- [TZB-info – ČEZ spouští Dynamický tarif](https://www.tzb-info.cz/ceny-paliv-a-energii/29478-cez-prodej-spousti-dynamicky-tarif-prizpusobte-spotrebu-zaplatte-mene)
- [Ušetřeno – Regulované ceny elektřiny 2026](https://www.usetreno.cz/regulovane-ceny-elektriny-2023/)
- [E15 – Ceny elektřiny 2026: srovnání dodavatelů](https://www.e15.cz/ceny-elektriny-2026-srovnani-dodavatelu)

* [ČNB – Refixace a refinancování hypoték, nové odhady dopadů](https://www.cnb.cz/cs/o_cnb/cnblog/Refixace-a-refinancovani-hypotek-nove-odhady-dopadu-do-vydaju-domacnosti)
* [Seznam Zprávy – Blíží se vlna refixací](https://www.seznamzpravy.cz/clanek/ekonomika-byznys-reality-hypoteka-blizi-se-vlna-refixaci-jez-zasahne-statisice-lidi-hypoteky-jim-zasadne-zdrazi-290526)
* [Hyponamíru – Sazby hypoték v říjnu 2026](https://www.hyponamiru.cz/?p=18744)
* [Hyponamíru – ČNB doporučuje přísnější limity pro investiční hypotéky](https://www.hyponamiru.cz/?p=16385)
* [FXstreet – ČNB nechala limity pro hypotéky beze změny](https://www.fxstreet.cz/klicova-slova+dsti.html)
* [Finance.cz – Kdy jde úvěr splatit bez sankcí](https://www.finance.cz/549514-situaci-pri-kterych-pujde-splatit-spotrebitelsky-uver-bez-sankci-bude-vic/)
* [Ušetřeno – Předčasné splacení hypotéky](https://www.usetreno.cz/predcasne-splaceni-hypoteky/)
* [Hyponamíru – Předčasné splacení hypotéky](https://www.hyponamiru.cz/predcasne-splaceni-hypoteky/)
* [CNN Prima News – Optimalizace daní a odpočtů](https://cnn.iprima.cz/jak-pri-investovani-optimalizovat-dane-i-statni-podporu-kombinujte-dip-i-penzijni-sporeni-505350)
* [ČSÚ – Ceny nemovitostí](https://csu.gov.cz/ceny-nemovitosti)
* [Banky.cz – Nájmy ve velkých městech, 2. čtvrtletí 2026](https://www.banky.cz/clanky/ve-velkych-mestech-zdrazuji-hlavne-byty-2-kk/)

- [Pohoda – Paušální daň v roce 2027 vzroste](https://portal.pohoda.cz/?p=45627)
- [E15 – Paušální daň 2027: tabulky pásem](https://www.e15.cz/pausalni-dan-2027)
- [Pohoda – Zrušení limitu 40 mil. Kč u akcií a podílů](https://portal.pohoda.cz/?p=36233)
- [Práce a mzda – Podtrženo, sečteno 26–30/2026](https://www.praceamzda.cz/tydenik/253/podtrzeno-secteno-c-26-30-2026)
- [Crowe – Daň z příjmů 2027: benefity](https://www.crowe.com/cz/cs-cz/news/dan-z-prijmu-2027-novinky-v-oblasti-zamestnaneckych-benefitu-a-dalsi)
- [Finance.cz – Mzdová kalkulačka 2027](https://www.finance.cz/kalkulacky/mzdova-kalkulacka-2027/)
- [Portál občana – Přijetí na střední školu](https://portal.gov.cz/sluzby-vs/S1110)
- [Novinky – Přijímačky na střední školy čekají změny](https://www.novinky.cz/clanek/domaci-nejdrive-testy-pak-prihlasky-prijimacky-na-stredni-skoly-cekaji-zmeny-40575923)
- [ČSÚ – Inflace, spotřebitelské ceny](https://csu.gov.cz/csu/czso/inflace-spotrebitelske-ceny)

* [Forvis Mazars / iDNES – Paušální daň 2027](https://www.forvismazars.com/cz/cs/prehledy/forvis-mazars-v-mediich/archiv-2026/pausalni-dan-2027-podnikatele-si-priplati)
* [Běhounek – Paušální daň, pásma](https://www.behounek.eu/l/pausalni-dan/)
* [Pohoda – Minimální zálohy OSVČ 2027](https://portal.pohoda.cz/dane-ucetnictvi-mzdy/page/8/?page=28)
* [money.cz – Průměrná mzda pro rok 2027](https://money.cz/novinky-a-tipy/?p=19357)
* [Forvis Mazars / E15 – Zálohy OSVČ v roce 2027](https://www.forvismazars.com/cz/cs/prehledy/forvis-mazars-v-mediich/archiv-2026/kolik-zaplatite-na-zalohach-v-roce-2027)
* [BusinessInfo – Kdo platí minimální zálohy](https://www.businessinfo.cz/clanky/kdo-plati-minimalni-a-kdo-vyssi-zalohy-na-povinna-pojisteni-terminy-se-blizi/)
* [BusinessInfo – Změny daní z příjmů od ledna 2027](https://www.businessinfo.cz/clanky/zmeny-u-dani-z-prijmu-jake-novinky-cekaji-podnikatele-i-zamestnance-od-ledna-2027/)
* [E15 – Návrat školkovného a slevy na studenta](https://www.e15.cz/finexpert/danove-priznani/navrat-skolkovneho-a-slevy-na-studenta-schvalen-na-danich-usetrite-az-v-roce-2028-1432587)
* [MPSV – Minimální mzda v roce 2027](https://mpsv.gov.cz/minimalni-mzda-v-roce-2027-vzroste-na-24-900-korun)
* [Jenprace.cz – Školkovné a sleva na studenta](https://www.jenprace.cz/tiskove-zpravy/skolkovne-i-sleva-na-studenta-se-maji-vratit-co-se-zmeni-a-od-kdy-pujdou-znovu-vyuzit)
* [Pohoda – Daňové zvýhodnění na děti a slevy 2026](https://portal.pohoda.cz/?p=42535)
* [Finanční správa – Sleva na manžela](https://financnisprava.gov.cz/cs/dane/dane/dan-z-prijmu/dotazy-a-odpovedi/dan-z-prijmu-fyzickych-osob/sleva-na-manzela)
* [Práce a mzda – EET 2.0 a benefity](https://www.praceamzda.cz/novinky/17221/eet-2-0-po-3-cteni-schvaleno-poslanci)
* [ČSÚ – Indexy spotřebitelských cen, otevřená data](https://csu.gov.cz/produkty/isc_cr#opendata)
* [ČSÚ – Indexy spotřebitelských cen (ukončený produkt)](https://csu.gov.cz/produkty/indexy-spotrebitelskych-cen)
* [ČSÚ – Dokumentace datové sady ISC](https://csu.gov.cz/docs/107508/5bc19b9e-1d32-50d4-8b7c-a3bcd4fbf4d2/010022-23dds.htm)
* [MŠMT – Termíny jednotné přijímací zkoušky 2026/2027](https://archiv.msmt.gov.cz/file/65227_1_1/)
* [Liberecký kraj – Přijímací řízení a nový algoritmus](https://www.kraj-lbc.cz/aktuality/case:detailPdf/itemId:558908/cgId:15623)
* [Liberecký kraj – Přihlášky do 20. února 2026](https://www.kraj-lbc.cz/aktuality/case:detailPdf/itemId:587517/cgId:15623)

- [epravo – Flexinovela zákoníku práce](https://www.epravo.cz/top/clanky/byznys-a-paragrafy-dil-9-flexinovela-zakoniku-prace-119600.html)
- [MPSV – Odstupné (§ 67 ZP)](https://ppropo.mpsv.cz/pdf/VI223Odstupne.pdf)
- [Kurzy.cz – Kalkulačka odstupného 2026](https://www.kurzy.cz/kalkulacka/odstupne-2026/)
- [Práce a mzda – Vyhláška 573/2025 Sb.](https://www.praceamzda.cz/predpisy/573-2025-sb)
- [epravo – Vyhláška 573/2025 Sb.](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2025/573)
- [Sbírka zákonů – Vyhláška 573/2025 Sb. (PDF)](https://www.epravo.cz/_dataPublic/sbirky/2025/Sb_2025_573_PZZ.pdf)
- [Finex – Formulář W-8BEN](https://finex.cz/w-8ben-formular/)
- [Dostupný advokát – Rodičovský příspěvek 2026](https://dostupnyadvokat.cz/blog/rodicovsky-prispevek)
- [MPSV – Rodičovský příspěvek](https://mpsv.gov.cz/rodicovsky-prispevek-1)
- [Měšec – Kalkulačka rodičovského příspěvku](https://www.mesec.cz/kalkulacky/rodicovsky-prispevek/)
- [Finance.cz – Nezabavitelná částka 2026](https://www.finance.cz/553500-kolik-vam-musi-zustat-z-vyplaty-v-roce-2026-podivejte-se-na-novy-vypocet-nezabavitelne-castky/)
- [Skrblík – Oddlužení 2026](https://www.skrblik.cz/?p=1239)
- [Leták k oddlužení s odkazem na kalkulátor splátek](https://www.pilnikov.cz/wp-content/uploads//2025/10/OP-letak-BAR-7_2025-oddluzeni.pdf)

* [epravo – Finální podoba flexinovely zákoníku práce](https://www.epravo.cz/top/clanky/finalni-podoba-flexibilni-novely-zakoniku-prace-nabyla-ucinnosti-co-nas-ceka-119713.html)
* [Jenprace.cz – Flexinovela: co platí v roce 2026](https://www.jenprace.cz/magazin/novela-zakoniku-prace-2024-slibuje-vetsi-flexibilitu-zasadni-novinky-a-pasti)
* [Dostupný advokát – Podpora v nezaměstnanosti 2026](https://dostupnyadvokat.cz/blog/narok-na-podporu-v-nezamestnanosti)
* [Banky.cz – Podpora v nezaměstnanosti 2026](https://www.banky.cz/clanky/jak-se-v-roce-2026-meni-podpora-v-nezamestnanosti/)
* [Finance.cz – Podpora v nezaměstnanosti 2026 vs. návrh 2027](https://www.finance.cz/kalkulacky/podpora-v-nezamestnanosti-srovnani-2026-2027/)
* [epravo – Cestovní náhrady 2025](https://www.epravo.cz/top/clanky/nove-sazby-cestovnich-nahrad-pro-rok-2025-119046.html?pdf=1)
* [DAUČ – Zdanění dividendy ze zahraničních akcií](https://www.dauc.cz/clanky/13545/drzba-zahranicnich-akcii-fyzickou-osobou-jak-zdanit-vyplacenou-dividendu)
* [Finex – Zdanění dividend v přiznání](https://finex.cz/zdaneni-dividend-jak-postupovat-pri-vyplneni-danoveho-priznani/)
* [Finmag – Investice a daně: dividendy](https://www.finmag.cz/finance/309218-investice-a-dane-ii-dividendy)
* [RuleCalc – Samostatný základ daně § 16a](https://rulecalc.com/cs/dan/dan-fo-samostatny-zaklad)
* [ČSSZ – Peněžitá pomoc v mateřství](https://www.cssz.gov.cz/podrobne-informace-o-penezite-pomoci-v-materstvi)
* [ČSSZ – Přehled údajů pro sociální zabezpečení 2026](https://www.zdirec.cz/storage/content/Aktuality/tz-prehled-nejdulezitejsich-udaju-pro-socialni-zabezpeceni-v-roce-2026.pdf)
* [ČSSZ – Příručka pro nastávající rodiče](https://www.cssz.cz/documents/20143/950156/TZ_Pr%CC%8Ci%CC%81ruc%CC%8Cka+pro+nasta%CC%81vaji%CC%81ci%CC%81+rodic%CC%8Ce+pomu%CC%8Az%CC%8Ce+zodpove%CC%8Cde%CC%8Ct+c%CC%8Caste%CC%81+dotazy.pdf/a7f1a3e7-74d2-f8e1-1a9b-ea3f79de1b4a)
* [Kurzy.cz – Rodičovský příspěvek 2026](https://zpravy.kurzy.cz/837132-rodicovsky-prispevek-2026-nova-pravidla-a-vyse-prispevku/)
* [ANAG – Exekuce srážkami ze mzdy, aktualizace 2026](https://www.anag.cz/files/product/16/46/39788/data/3306_a.pdf)
* [money.cz – Exekuční srážky 2026](https://money.cz/novinky-a-tipy/rychle-zpravy/exekucni-srazky-2026/)
* [Finance.cz – Nezabavitelná částka a srážky 2026](https://www.finance.cz/553541-jak-ovlivni-nezabavitelna-castka-srazky-ze-mzdy-v-roce-2026/)
* [Banky.cz – Insolvenční kalkulačka 2026](https://www.banky.cz/clanky/insolvencni-kalkulacka-jak-vypocitat-nezabavitelnou-castku/)
* [Skrblík – Osobní bankrot 2026](https://www.skrblik.cz/?p=80875)

- [Claude Code – Cloudové relace](https://code.claude.com/docs/en/claude-code-on-the-web.md)
- [Claude Code – Cloudová prostředí a povolené domény](https://code.claude.com/docs/en/cloud-environments.md)
- [Claude Code – Artefakty](https://code.claude.com/docs/en/artifacts.md)
