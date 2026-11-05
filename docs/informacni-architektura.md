# Informační architektura: společný web českých kalkulaček

Stav: návrh pro 1. fázi (prototypy designu). Pracovní název webu je **Spočítáno**, další
návrhy jsou na konci dokumentu. Zdrojem obsahu je `docs/zadani.md`. Ukázková data pro
prototypy jsou v `designs/_obsah/obsah.json`.

## 1. Pro koho web je a co slibuje

- **Pro koho:** běžní lidé v Česku, kteří potřebují rychle a přesně spočítat situaci podle
  nových pravidel: zaměstnanci, živnostníci, drobní investoři, rodiče a lidé s dluhy.
- **Slib:** „Česká pravidla srozumitelně. Spočítáte si to sami, v prohlížeči, bez registrace.“
- **Principy, které platí pro celý web:**
  1. Výpočty běží jen v prohlížeči. Nic se neukládá ani neodesílá a web nemá měření
     návštěvnosti bez souhlasu.
  2. Každý nástroj ukazuje datum ověření pravidel a odkazy na zdroje.
  3. Co je jen návrh zákona, nese štítek „Návrh, zatím neschváleno“.
  4. Všude je vidět upozornění, že nejde o investiční, daňové ani právní poradenství.
  5. Web nesmí působit jako oficiální web státu: žádný státní znak, žádné barvy ani styl
     gov.cz či Portálu občana.

## 2. Kategorie

Zadání navrhuje pět skupin. Ponechávám je, upravil jsem jen název jedné a doplnil druhou
osu navigace podle životní situace.

| Kategorie | URL | Nástroje | Proč takto |
| --- | --- | --- | --- |
| **Peníze a investice** | `/penize/` | Plán48, Penzijko kompas, Zdaním to? (včetně dividend ze zahraničí), Inflační kalkulačka | Spoření, investice a jejich zdanění. Plán48, Kompas a Zdaním to? sdílejí uživatele i pravidla (§ 15a, penzijko). |
| **Daně a podnikání** | `/dane-podnikani/` | Mám EET? (záložka OSVČ 2027), Slevy 2027, Cestovní příkaz 2027 | Nástroje s pevnými daňovými termíny (1. 1. 2027, 11. 1. 2027, prohlášení u zaměstnavatele). |
| **Bydlení a energie** | `/bydleni-energie/` | Bydlometr (refixace, nájem vs. koupě), Spot, nebo fix? | Výdaje domácnosti na bydlení. Oba nástroje potřebují externí data (sazby, ceny OTE). |
| **Práce a rodina** | `/prace-rodina/` | Výpověď 2026, Rodičovská pro celou rodinu, Přijímačky bez paniky, Volno 2027 | Životní události kolem práce a dětí. |
| **Dluhy** | `/dluhy/` | Exekuce, nebo oddlužení? | Citlivé téma se zvláštními pravidly (viz kap. 7). Má samostatnou sekci a nikdy se nemíchá s propagací. |

**Změny oproti zadání a důvody:**

- **„Práce, rodina, škola“ → „Práce a rodina“.** Kratší název se vejde do hlavní navigace i na
  mobilu. Škola (Přijímačky) je rodinné téma, protože nástroj čtou hlavně rodiče deváťáků.
  Volno 2027 v kategorii zůstává (plánování dovolené s rodinou), ale v navigaci podle situace
  se objevuje i u zaměstnanců.
- **Dluhy zůstávají samostatně**, přestože mají jediný nástroj. Sloučení s jinou kategorií
  (např. „Práce a rodina“) by dluhy postavilo vedle nástrojů, které mohou mít affiliate odkazy
  (Plán48 je zmiňuje jako možnou monetizaci). Samostatná sekce s vlastními pravidly to vylučuje.
- **OSVČ 2027 není samostatný nástroj v navigaci, ale druhá záložka Mám EET?** (zadání:
  „Nejlépe funguje jako druhá záložka aplikace Mám EET?, protože sdílí `rules.json`“).
  Ve vyhledávání a v navigaci podle situace se ale ukazuje samostatně.
- **Dividendy ze zahraničí jsou součástí Zdaním to?** (zadání: „nejlépe jako součást Zdaním to?“).
- **Druhá osa „Podle situace“.** Slevy 2027 a Cestovní příkaz se týkají zaměstnanců
  i podnikatelů, Plán48 investorů i zaměstnanců. Proto úvodní stránka nabízí i vstup
  podle situace:

| Situace | Nástroje (pořadí podle naléhavosti) |
| --- | --- |
| Jsem zaměstnanec | Slevy 2027, Plán48, Výpověď 2026, Inflační kalkulačka |
| Podnikám (OSVČ) | Mám EET?, OSVČ 2027, Cestovní příkaz 2027, Plán48 |
| Investuji a spořím | Plán48, Penzijko kompas, Zdaním to?, Inflační kalkulačka |
| Mám rodinu a děti | Rodičovská, Přijímačky bez paniky, Slevy 2027, Volno 2027 |
| Mám dluhy | Exekuce, nebo oddlužení? + bezplatná pomoc |

## 3. Navigace

- **Hlavička:** název webu (odkaz na úvod), 5 kategorií + „Co se mění v roce 2027“,
  vyhledávací pole, přepínač světlý/tmavý režim. Na mobilu je navigace pod tlačítkem Menu
  (v prototypu bez JS jako `<details>`), vyhledávání zůstává vždy viditelné.
- **Drobečková navigace** na stránkách kategorií a nástrojů: Úvod › Peníze a investice › Plán48.
- **Uvnitř nástroje:** záložky (např. Plán48 | Penzijko kompas; Mám EET? | OSVČ 2027),
  u průvodců ukazatel kroků „Krok 2 z 8“ s tlačítkem Zpět.
- **Patička:** O webu, Jak počítáme a odkud bereme pravidla, Všechny zdroje, Soukromí
  (nic neukládáme), datum poslední kontroly pravidel, upozornění „Nejde o poradenství“.
  V patičce každé stránky je i odkaz na bezplatnou dluhovou pomoc.
- **Přístupnost:** odkaz „Přeskočit na obsah“, `aria-current="page"` u aktivní položky,
  ovládání klávesnicí, viditelný fokus.

## 4. Struktura URL

Česká slova bez diakritiky, malá písmena, pomlčky a lomítko na konci. Rok je v URL jen tam,
kde je součástí názvu nástroje (pravidla jiného roku = nová verze nástroje).

```
/                                         úvod
/co-se-meni-2027/                         přehled změn s odkazy do nástrojů
/hledat/?q=penzijko                       výsledky vyhledávání
/zdroje/                                  všechny zdroje a data ověření
/o-webu/  /soukromi/  /jak-pocitame/

/penize/                                  kategorie
/penize/plan48/                           kalkulačka (stav ve fragmentu, viz níže)
/penize/plan48/navrh-2027/                stejná kalkulačka s přepínačem na návrh 2027
/penize/penzijko-kompas/
/penize/zdanim-to/
/penize/zdanim-to/dividendy/
/penize/inflacni-kalkulacka/

/dane-podnikani/
/dane-podnikani/mam-eet/                  úvod průvodce
/dane-podnikani/mam-eet/krok-2/           kroky průvodce (krok-1 … krok-8)
/dane-podnikani/mam-eet/vysledek/
/dane-podnikani/mam-eet/osvc-2027/        záložka OSVČ 2027
/dane-podnikani/slevy-2027/
/dane-podnikani/cestovni-prikaz-2027/

/bydleni-energie/
/bydleni-energie/bydlometr/               (záložky refixace / najem-vs-koupe)
/bydleni-energie/spot-nebo-fix/

/prace-rodina/
/prace-rodina/vypoved-2026/
/prace-rodina/rodicovska/
/prace-rodina/prijimacky/
/prace-rodina/volno-2027/

/dluhy/
/dluhy/exekuce-nebo-oddluzeni/
/dluhy/bezplatna-pomoc/
```

- **Zadané hodnoty** se ve 2. fázi mohou ukládat do fragmentu URL (`#vek=35&dps=3000…`).
  Fragment se neodesílá na server, takže výsledek jde sdílet bez porušení slibu „nic
  neodesíláme“. U nástroje Dluhy se hodnoty do URL **neukládají** (citlivé údaje by zůstaly
  v historii prohlížeče a ve sdíleném odkazu).
- **Při změně roku** zůstane stará verze dostupná (např. `/prace-rodina/vypoved-2026/`),
  nová dostane nový slug a stará na ni výrazně odkáže.

## 5. Úvodní stránka

Pořadí bloků (varianty je skládají různě, ale obsah je stejný):

1. **Hlavička** s vyhledáváním.
2. **Úvod:** jedna věta o webu a vyhledávací pole („Hledat kalkulačku, např. penzijko, EET,
   výpověď“).
3. **Nejbližší termíny:** Plán48 (vklady do 31. 12. 2026), MOJE EET od 1. 12. 2026,
   EET 2.0 od 1. 1. 2027, přihláška k paušální dani do 11. 1. 2027.
4. **Podle situace:** 5 vstupů z kap. 2.
5. **Kategorie:** 5 karet, v každé nástroje s krátkým perexem a typem (kalkulačka/průvodce).
6. **Co se mění v roce 2027:** EET 2.0, Lepší penzijko (štítek návrhu), paušální daň
   1. pásmo 9 662 Kč, sleva na studenta a školkovné, svátky 2027. U každé položky zdroj
   a odkaz do nástroje. Ve variantě D je to hlavní obsah stránky.
7. **Dluhy:** samostatný klidný blok „Nejste v tom sami“ s výrazným odkazem na bezplatnou
   pomoc. Nesmí stát vedle propagace nebo affiliate.
8. **Jak to funguje:** výpočty v prohlížeči, zdroje, datum ověření, nejde o poradenství.
9. **Patička.**

## 6. Vazby mezi nástroji

Vazby se zobrazují jako blok „Souvisí“ pod výsledkem. Jsou kontextové: odkaz se ukáže,
jen když výsledek dává důvod (např. nevyužitý odpočet).

| Z nástroje | Do nástroje | Kdy a proč |
| --- | --- | --- |
| Plán48 | Penzijko kompas | „Chcete vědět, který fond a kolik vás stojí poplatky?“ Plán48 řeší letošní rok, Kompas dlouhodobou volbu fondu. Mohou sdílet `calc.js` a `rules.json`. |
| Penzijko kompas | Plán48 | Kompas počítá odpočet jen informativně, plný výpočet dělá Plán48. |
| Plán48 | Zdaním to? | Investorům s DIP a akciemi: osvobození prodeje a dividendy do přiznání. |
| Zdaním to? | Plán48 | Kdo investuje, může využít odpočet DIP. |
| Plán48, Penzijko kompas | Inflační kalkulačka | Reálná hodnota úspor a výnosů po inflaci. |
| Mám EET? | OSVČ 2027 | Výsledek EET OFF vede na srovnání paušální daň / přiznání / EET OFF (sdílený `rules.json`). |
| OSVČ 2027 | Cestovní příkaz 2027 | Živnostníkům s autem: náhrady a stravné. |
| Slevy 2027 | Plán48 | Kromě slev i odpočty (penzijko, DIP, životní pojištění). |
| Slevy 2027 | Rodičovská | Rodiny s dětmi: školkovné a daňové zvýhodnění na děti. |
| Výpověď 2026 | Dluhy | Jen nenápadný odkaz „Bojíte se, že nezvládnete splátky?“ na bezplatnou pomoc, nikdy ne naopak s nabídkou. |
| Výpověď 2026 | Rodičovská | Návrat po rodičovské a výpověď. |
| Rodičovská | Volno 2027 | Plánování návratu do práce a dovolené. |
| Bydlometr | Spot, nebo fix? | Celkové náklady na bydlení. |
| Dluhy | Výpověď 2026 | Ztráta práce je častý spouštěč dluhů. Jen informativní odkaz. |

## 7. Pravidla pro sekci Dluhy (závazné, ze zadání)

- Žádné reklamy, affiliate odkazy, nabídky půjček ani odkazy na placené zprostředkovatele.
  Platí pro celou sekci `/dluhy/` i pro bloky, které na ni odkazují.
- Žádné sbírání kontaktů. Nic se neukládá ani neodesílá, hodnoty se neukládají do URL.
- Odkaz na **bezplatnou pomoc** (dluhové poradny, akreditované osoby pro sepis insolvenčního
  návrhu, oficiální seznamy) je viditelný bez posouvání na každé obrazovce i na mobilu.
  Odkazuje na něj i patička celého webu.
- U každého výsledku věta: „Orientační výpočet. Závazně to posoudí poradna, exekutor nebo
  insolvenční soud.“
- Klidný tón, krátké věty, žádné zkratky bez vysvětlení, žádné strašení ani vtipkování.
- Úvodní stránka webu má blok Dluhy oddělený od ostatních nástrojů, bez propagace.
- Případná monetizace webu (affiliate u DIP podle zadání Plán48) musí být vždy označená
  a nikdy se nezobrazí na stránkách `/dluhy/` ani vedle odkazu na ně.

## 8. Vyhledávání

- **Statické, bez externí služby a bez odesílání dotazu na server.** Ve 2. fázi se při sestavení
  webu vygeneruje `search-index.json` (název, kategorie, perex, štítky, synonyma, URL)
  a malý skript ho prohledá v prohlížeči. Bez JS formulář odešle `GET /hledat/?q=…`
  a stránka ukáže úplný seznam nástrojů seřazený podle kategorií.
- **Synonyma a hovorové výrazy** (z `stitky` v obsah.json + ruční seznam): penzijko = DPS =
  doplňkové penzijní spoření = penzijní připojištění; DIP = dlouhodobý investiční produkt;
  EET = evidence tržeb = účtenky; paušál = paušální daň; exekuce = srážky ze mzdy =
  obstavení; oddlužení = osobní bankrot = insolvence; mateřská = PPM; krypto = kryptoměny
  = bitcoin.
- **Hledání bez diakritiky** („mam eet“, „vypoved“) a s překlepy (normalizace a podobnost).
- **Výsledek:** karta nástroje + odpovídající položka z „Co se mění v roce 2027“.
- **Prázdný výsledek:** nabídnout kategorie a „Podle situace“. Dotazy, které vypadají jako
  tíseň („exekuce“, „dluh“, „nemám na nájem“), ukážou nahoře odkaz na bezplatnou pomoc.
- Dotazy se nikam neukládají.

## 9. Sdílené komponenty

Každá varianta designu je ukazuje všechny (kontroluje `tools/kontroly/kontrola.mjs`):

| Komponenta | Použití | Poznámka |
| --- | --- | --- |
| Hlavička s navigací a vyhledáváním | všechny stránky | `role="search"`, přepínač režimu |
| Karta nástroje | úvod, kategorie, „Souvisí“ | název, typ, perex, termín, štítky, odkaz |
| Formulář s nápovědou | kalkulačky a průvodci | `label`, nápověda přes `aria-describedby`, jednotky |
| Chybový stav formuláře | všechny formuláře | `aria-invalid`, text chyby u pole, ikona i text |
| Krokovač průvodce | Mám EET?, Slevy, Výpověď, Dluhy | „Krok 2 z 8“, Zpět/Pokračovat |
| Karta výsledku | všechny nástroje | velké číslo + jedna věta vysvětlení + „Co udělat“ |
| Graf | kalkulačky | vložené SVG, textová alternativa nebo tabulka |
| Tabulka | kalkulačky, srovnání | `caption`, `th scope`, číslice stejné šířky, na mobilu posuvná |
| Štítek „Pravidla ověřena k [datum]“ | všechny nástroje | datum z `rules.json` |
| Štítek „Návrh, zatím neschváleno“ | vše z návrhů zákonů | odlišná barva i text |
| Upozornění „Nejde o poradenství“ | všechny nástroje, patička | |
| Seznam zdrojů | všechny nástroje, `/zdroje/` | název zdroje, URL |
| Kontrolní seznam s termíny | Mám EET?, Plán48, OSVČ 2027 | lze vytisknout |
| Blok bezplatné pomoci | sekce Dluhy, patička, vyhledávání | bez reklam |
| Tiskový styl | všechny stránky | bez navigace, URL odkazů, datum ověření |
| Přepínač světlý/tmavý režim | hlavička | výchozí podle systému (varianta C tmavá) |

## 10. Názvy webu (5 návrhů)

Dostupnost domén **jsem neověřoval**. Je potřeba ji ověřit u registrátora (.cz) a zkontrolovat
ochranné známky.

| Název | Doména (neověřeno) | Proč |
| --- | --- | --- |
| **Spočítáno** (pracovní) | spocitano.cz | Krátké, česky srozumitelné, slibuje hotovou odpověď. |
| **Kalkulárna** | kalkularna.cz | Hravé, zapamatovatelné, jasně o kalkulačkách. |
| **Pravidla v kostce** | pravidlavkostce.cz | Zdůrazňuje vysvětlení pravidel, sedí k průvodcům a variantě D. |
| **Dopočti** | dopocti.cz | Výzva k akci, krátké, funguje i jako značka u jednotlivých nástrojů. |
| **Na rovinu** | narovinu.cz | Tón srozumitelnosti a důvěry. Dobře se hodí i k citlivému tématu dluhů. |

Názvy záměrně nepůsobí úředně (žádné „portál“, „úřad“, „gov“, „stát“), aby si web nikdo nespletl
s oficiálním státním webem.
