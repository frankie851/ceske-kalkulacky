---
projekt: České kalkulačky
prompt: 01-nezavisla-revize
verze: v2
datum: 2026-11-05
prostredi: Claude Code v cloudu (claude.ai/code)
model: Fable 5.1
effort: High
rezim: C samostatný
navazuje_na: docs/zadani.md (zadání všech aplikací)
---

# Jak spustit (pro Davida)

1. **Síť prostředí.** Otevři claude.ai/code a v nastavení cloudového prostředí přepni **Network access** na **Custom**. Do pole **Allowed domains** vlož seznam níže, jednu doménu na řádek, a zaškrtni **Also include default list of common package managers**. Bez toho by revizor neměl přístup k npm a nenainstaloval by si nástroje na kontrolu mobilu a přístupnosti. Úplně jednodušší alternativa je **Full**.

   ```
   *.gov.cz
   zakonyprolidi.cz
   *.zakonyprolidi.cz
   e-sbirka.cz
   *.e-sbirka.cz
   psp.cz
   *.psp.cz
   cnb.cz
   *.cnb.cz
   czso.cz
   *.czso.cz
   ote-cr.cz
   *.ote-cr.cz
   eru.cz
   *.eru.cz
   cez.cz
   *.cez.cz
   justice.cz
   *.justice.cz
   cssz.cz
   *.cssz.cz
   uradprace.cz
   *.uradprace.cz
   mpsv.cz
   *.mpsv.cz
   cermat.cz
   *.cermat.cz
   ceecr.cz
   *.ceecr.cz
   ochrance.cz
   *.ochrance.cz
   epravo.cz
   *.epravo.cz
   frankie851.github.io
   cdnjs.cloudflare.com
   ```

2. **Nové sezení** s repozitářem **frankie851/ceske-kalkulacky**, větev `main`. Ostatních 12 repozitářů si revizor naklonuje sám.
3. **Model a effort.** Do sezení napiš nejdřív `/model fable` a pak `/effort high`. Kalkulačky stavěl Opus, a proto revizi vede jiný model. Když Fable není k dispozici, použij `/model opus` a `/effort xhigh`. Nezávislost pak zajistí aspoň čisté sezení bez historie stavby.
4. **Zadání.** Zkopíruj všechno od nadpisu „Kontext“ až do konce souboru a vlož to jako první zprávu.
5. **Co čekat.** Revize poběží samostatně několik hodin (odhadem 2–5) a na nic se ptát nebude. Na konci dostaneš PR „Nezávislá revize 12 kalkulaček“ a odkaz na souhrnnou stránku. Začni souborem `SOUHRN.md`, pak si namátkou ověř 2–3 nálezy. Když se sezení přeruší (limity, vypršení), otevři ho znovu a napiš: „Pokračuj podle HANDOFF.md v docs/revize.“

---

## Kontext

David není programátor. Přes Claude Code (model Opus 5.5) si nechal postavit 12 samostatných českých webových kalkulaček, každou ve vlastním veřejném repozitáři `frankie851/<repo>`. Jsou to statické stránky v HTML, CSS a JS bez serveru, výpočty jsou v čistých JS modulech, zákonné parametry v `rules.json` a testy se spouštějí přes `node --test`. Později je sloučí do jednoho webu v repozitáři, ve kterém právě pracuješ (`frankie851/ceske-kalkulacky`). Než se to stane, potřebuje nezávislou revizi.

Ty jsi **nezávislý revizor**. Kód jsi nepsal a nic z toho, co tvrdí autoři (README, komentáře, `rules.json`, testy, texty v aplikaci), neber jako pravdu. Všechno ověř sám. Lidé budou podle těchto kalkulaček rozhodovat o penězích, termínech a nárocích, takže špatné číslo může někomu reálně uškodit.

**Zdroje pravdy:**
- **Požadavky:** `docs/zadani.md` v tomto repozitáři. Pro každou aplikaci má sekci, která začíná nadpisem `## Zadání pro Claude Code…` (sekce Plán48 se jmenuje jen `## Zadání pro Claude Code`). Sekce končí tam, kde začíná další nadpis ze seznamu: `## Zadání pro Claude Code…`, `## Další nápady na aplikace`, `## Dalších 5 nápadů` nebo `## Zdroje`. Řádky `## Cíl`, `## Obrazovky` a podobně uvnitř bloku kódu patří k zadání dané aplikace. Každá sekce obsahuje pravidla, obrazovky, testovací příklady a kritéria hotovo. Sekce „Dividendy ze zahraničí“ a „Zadání pro Claude Code v cloudu: společný web…“ do revize nepatří.
- **Zákonná čísla a termíny:** jen úřední zdroje, tedy Sbírka zákonů (e-sbirka.gov.cz), konsolidované znění (zakonyprolidi.cz) a úřad, který hodnotu vydává (MPSV, Finanční správa, MF, ČNB, ČSÚ, CERMAT, ERÚ, OTE, ČSSZ, Úřad práce, Ministerstvo spravedlnosti, Sněmovna pro návrhy zákonů). Zadání ani aplikace zdrojem pravdy nejsou. Když se zadání rozchází s úředním zdrojem, je to nález typu „chyba v zadání“.

**Aplikace k revizi:**

| Kód | Repozitář | Aplikace | Sekce v `docs/zadani.md` |
|---|---|---|---|
| P48 | plan48 | Plán48 | Zadání pro Claude Code (pod „Doporučená aplikace: Plán48“) |
| PEN | penzijko-kompas | Penzijko kompas | Zadání pro Claude Code: Penzijko kompas |
| EET | mam-eet | Mám EET? + OSVČ 2027 | …: Mám EET? a …: OSVČ 2027 |
| SPOT | spot-nebo-fix | Spot, nebo fix? | …: Spot, nebo fix? |
| BYD | bydlometr | Bydlometr | …: Bydlometr |
| SLV | slevy-2027 | Slevy 2027 | …: Slevy 2027 |
| INF | inflacni-kalkulacka | Inflační kalkulačka | …: Inflační kalkulačka |
| PRI | prijimacky-bez-paniky | Přijímačky bez paniky | …: Přijímačky bez paniky |
| CES | cestovni-prikaz | Cestovní příkaz 2027 | …: Cestovní příkaz 2027 |
| VYP | vypoved-2026 | Výpověď 2026 | …: Výpověď 2026 |
| ROD | rodicovska | Rodičovská pro celou rodinu | …: Rodičovská pro celou rodinu |
| DLU | kalkulator-dluhu | Dluhy – exekuce, nebo oddlužení? | …: Dluhy – exekuce, nebo oddlužení? |

`mam-eet` obsahuje dvě aplikace (Mám EET? a OSVČ 2027). Napiš k němu jednu zprávu, v tabulce „Shoda se zadáním“ ale každé ze dvou sekcí věnuj vlastní podsekci.

Živé weby by měly být na `https://frankie851.github.io/<repo>/`. Ověř, že tam opravdu jsou. Některé repozitáře mají kromě `main` i další větve (např. `mam-eet` → `claude/fix-tabs-race`, `vypoved-2026` → `claude/vypoved-2026-calculator-4wx7op`). Seznam si zjisti sám.

## Cíl

Pro každou z 12 aplikací zjistit, jestli počítá správně podle platných pravidel, jestli splňuje zadání a jestli je bezpečná a použitelná na mobilu. Výsledkem je zpráva s verdiktem a hotový opravný prompt pro každou aplikaci, souhrn přes všechny aplikace a souhrnná stránka. David podle toho rozhodne, co opravit, než aplikace sloučí.

## Vstupy

- `docs/zadani.md`: požadavky a testovací příklady všech aplikací.
- 12 repozitářů aplikací, které si naklonuješ (viz Postup, fáze 0).
- Úřední weby pro ověření pravidel. Síť je pro ně povolená. Když je některý web nedostupný, viz „Režim práce“. GitHub (klonování, push, PR) jde přes vlastní proxy sezení a v seznamu domén být nemusí.
- Kde co hledat: konsolidované znění zákonů na zakonyprolidi.cz. Stránky e-sbirka.gov.cz se často nedají načíst, protože se skládají až v prohlížeči. Proto u zákona vždy uveď číslo předpisu a paragraf, odkaz může vést na zakonyprolidi.cz. Kurzy hledej na cnb.cz (kurzy devizového trhu), spotové ceny elektřiny na ote-cr.cz (denní trh), regulované ceny a distribuční sazby na eru.gov.cz (cenová rozhodnutí), inflaci na csu.gov.cz a data.csu.gov.cz, mzdové a sociální částky na mpsv.gov.cz a cssz.cz, přijímačky na cermat.gov.cz a msmt.gov.cz, daně na financnisprava.gov.cz a mf.gov.cz, exekuce a insolvence na justice.cz a ceecr.cz, návrhy zákonů na psp.cz (sněmovní tisky).

## Výstup

Všechno patří do složky `docs/revize/<D>/`, kde `<D>` je dnešní datum ve tvaru `RRRR-MM-DD`. Jde to do větve `revize/<D>` a do PR do `main` repozitáře `ceske-kalkulacky`.

```
docs/revize/<D>/
├── PLAN.md            průběh: 12 aplikací × fáze, odškrtávané ☐ → ☑
├── pravidla.md        centrální rejstřík ověřených pravidel (fáze 1)
├── SOUHRN.md          souhrn přes všechny aplikace (fáze 5)
├── <repo>.md          12 zpráv, jedna na aplikaci (fáze 2–3)
├── opravy/<repo>.md   12 opravných promptů (fáze 4)
├── dukazy/<repo>/     snímky 360 px a 1440 px, výstupy testů, logy sítě, výstupy axe
├── dukazy/skripty/    tvoje skripty: nezávislé přepočty, kontroly v prohlížeči
├── revize.html        souhrnná stránka (fáze 6)
└── HANDOFF.md         jen při přerušení
```

Jazyk všech výstupů je čeština. Čísla piš v českém formátu (1 234,50 Kč) a data jako 5. 11. 2026.

### Závažnost nálezů

- **Kritická:** aplikace může běžnému uživateli ukázat špatnou částku, termín nebo nárok, podle kterého se rozhodne ke své škodě (propásnutý termín, přeplatek, nevyužitý příspěvek, chybná rada u dluhů). Patří sem i únik dat a nefunkční hlavní výpočet nebo web.
- **Vysoká:** chybné pravidlo nebo výpočet v méně častém případě, chybějící povinný požadavek ze zadání, porušení přístupnosti „serious“ nebo „critical“, zavádějící text u citlivého tématu, návrh zákona prezentovaný jako platné pravidlo.
- **Střední:** věc, která mate nebo zdržuje, ale ke škodě nevede. Dál chybějící test u důležité větve výpočtu, zastaralý údaj o zdroji, který nemění čísla, problém na mobilu bez ztráty funkce.
- **Nízká:** kosmetika, styl kódu, drobné textové chyby.

### Verdikt aplikace

- **Připraveno:** 0 kritických a 0 vysokých nálezů. Aplikaci jde sloučit, střední a nízké nálezy se opraví později. Žlutý semafor u Připraveno proto nevadí.
- **Opravit před sloučením:** aspoň 1 kritický nebo vysoký nález a nesplňuje podmínky pro Předělat.
- **Předělat:** platí aspoň jedno: výpočet je smíchaný s kódem obrazovky (nejde spustit bez stránky), méně než polovina požadavků zadání je splněná, nebo většinu kritických nálezů nejde opravit bez přepsání výpočetního modulu.

### Pojmy

- **Reprodukováno 2×:** nález se projevil ve dvou na sobě nezávislých bězích, tedy v novém procesu nebo nově načtené stránce se stejným vstupem. U pravidla to znamená, že úřední hodnotu potvrdil druhý úřední zdroj, případně jiné místo téhož předpisu.
- **Shoda živého webu s `main`:** hlavní JS soubor a `rules.json` (nebo jeho obdoba) na webu mají stejný obsah (SHA-256) jako v `main`.

### Šablona zprávy `<repo>.md`

```markdown
# Revize: <Aplikace> (`frankie851/<repo>`)
Revidovaný commit: `<SHA main>` (<datum commitu>) · živý web: <URL> (<HTTP stav>, shoda s main: ano/ne) · revize: <D>

## Verdikt: <Připraveno | Opravit před sloučením | Předělat>
<3 věty: proč, co je nejvážnější, co je dobře.>
Nálezy: Kritická <n> · Vysoká <n> · Střední <n> · Nízká <n>

## Semafor oblastí
| Oblast | Stav | Nejvážnější nález |
|---|---|---|
| 1 Pravidla a data | 🟢/🟡/🔴/⚪ | <ID nebo —> |
| 2 Výpočty | … | … |
| 3 Shoda se zadáním | … | … |
| 4 Testy | … | … |
| 5 Mobil a přístupnost | … | … |
| 6 Texty a citlivá témata | … | … |
| 7 Soukromí a bezpečnost | … | … |
| 8 Nasazení a větve | … | … |
(🟢 nic nad Nízká · 🟡 nejvýš Střední · 🔴 Kritická nebo Vysoká · ⚪ neověřeno, důvod v poznámce)

## Pravidla
| Pravidlo | V aplikaci (soubor) | Úřední hodnota | Zdroj (předpis, URL) | Ověřeno | Stav |
|---|---|---|---|---|---|

## Nezávislý přepočet
| Případ (zadání / vlastní) | Vstup | Můj výpočet | Modul aplikace | Obrazovka | Shoda |
|---|---|---|---|---|---|

## Shoda se zadáním
| Požadavek (citace nebo zkrácení) | Splněno / částečně / ne | Důkaz |
|---|---|---|

## Nálezy
### <KÓD>-01 · <Závažnost> · <Oblast> · <krátký název>
- **Kde:** `<soubor>:<řádek>` nebo obrazovka / URL
- **Reprodukce:** vstup → očekáváno (s odůvodněním a zdrojem) → skutečnost
- **Dopad na uživatele:** <1 věta>
- **Doporučená oprava:** <co změnit, ne celý kód>
- **Ověření:** reprodukováno 2× · skeptik: Potvrzeno / Nejisté (<důvod>)

## Neslité větve
<větev: co mění (soubory, 1–3 věty), jestli řeší některý nález, doporučení: sloučit / zahodit / nejdřív opravit>

## Co se nepodařilo ověřit a předpoklady
- <…>
```

## Postup

### Fáze 0 – Příprava

1. Zjisti dnešní datum `<D>` ze systému (`date +%F`), vytvoř větev `revize/<D>` a složku `docs/revize/<D>/`. Do ní založ `PLAN.md` se 12 aplikacemi a fázemi 1–6.
2. Naklonuj 12 repozitářů do `/tmp/revize/repos/<repo>` přes `git clone https://github.com/frankie851/<repo>`. Ukládej je mimo tento repozitář, aby se omylem necommitly. Když klon selže, zkus repozitář připojit k sezení nástrojem na přidávání repozitářů, pokud ho máš. Když to nepomůže, označ aplikaci jako neověřitelnou a pokračuj.
3. U každé aplikace si zapiš SHA posledního commitu v `main` a seznam vzdálených větví (`git ls-remote --heads`).
4. Nástroje pro prohlížeč nainstaluj do `/tmp/revize/nastroje`: `npm init -y && npm i puppeteer @axe-core/puppeteer`. Ani tohle nepatří do repozitáře. Když Puppeteer nestáhne prohlížeč, zkus Playwright. Teprve potom označ oblast 5 jako ⚪ s důvodem.
5. Commitni a pushni kostru (`PLAN.md`). Od teď ukládej průběžně.

### Fáze 1 – Centrální rejstřík pravidel (`pravidla.md`)

Řada pravidel se v aplikacích opakuje (minimální a průměrná mzda, slevy na dani, nezabavitelná částka, stravné…). Ověř je jednou, ať mají všechny zprávy stejný a doložený základ.

1. Projdi `rules.json`, datové soubory (`data/*.json`, `tariffs.json`, `dynamic.json`, `defaults.json`, `rules.js`…) a čísla zapsaná přímo v kódu, třeba přes grep na typické hodnoty a procenta. Vypiš každé pravidlo, které aplikace používá.
2. Každé ověř z úředního zdroje a zapiš do tabulky: *pravidlo · úřední hodnota · předpis a paragraf · URL · datum ověření · stav*. Stav je jeden z těchto: **platí** (od kdy) · **schváleno, platí od …** · **návrh** (číslo sněmovního tisku, fáze projednávání) · **neověřeno** (proč). Hodnoty z paměti nepoužívej. Fakta se mění a právě tohle má revize zachytit.
3. Pravidla na rok 2027: platí jen to, co je schválené a vyhlášené. Návrh smí aplikace ukázat jen jako jasně označený scénář. Když ho ukazuje jako platný, je to nález.
4. U datových řad (inflace, ceny elektřiny, kurzy, distribuční sazby) ověř aspoň 3 hodnoty proti zdroji a zjisti, k jakému datu jsou data aktuální. Přečti i skripty a workflow, které data aktualizují, a posuď, jestli aktualizace funguje.

### Fáze 2 – Revize aplikací (podagenti)

Na každou aplikaci spusť jednoho podagenta, nejvýš 4 najednou. Model jim nenastavuj, převezmou model hlavního sezení. Každý dostane cestu ke klonu, název sekce v `docs/zadani.md`, cestu k `pravidla.md`, šablonu zprávy, definice závažnosti a verdiktu a cesty pro výstupy. Narazí-li podagent na pravidlo, které v rejstříku chybí, ověří ho stejným způsobem a vrátí ti ho. Ty ho doplníš do `pravidla.md`. Každá aplikace se hodnotí v těchto 8 oblastech:

1. **Pravidla a data.** Každou hodnotu, kterou aplikace používá, porovnej s rejstříkem. Zkontroluj i datum ověření a zdroj, které aplikace uvádí uživateli.
2. **Výpočty.**
   - Spusť testy aplikace (`npm test`, případně `node --test`) a výstup ulož do `dukazy/<repo>/testy.txt`.
   - Napiš vlastní referenční výpočet `dukazy/skripty/<repo>-prepocet.mjs` **od nuly** podle úředních pravidel. Kód aplikace v něm nesmí být, jinak by přepočet jen zopakoval její chyby.
   - Spočítej všechny testovací příklady ze zadání a k nim vlastní hraniční případy: hranice pásem a limitů, 0, maximum, prázdný, záporný a nesmyslný vstup, zaokrouhlení podle předpisu, přelom roku, přestupný rok, víkendy a svátky u termínů. Potom spusť se stejnými vstupy výpočetní modul aplikace a porovnej výsledky.
   - Aspoň 2 případy zadej v prohlížeči do formuláře a ověř, že obrazovka ukáže totéž co modul. Chyba bývá i v propojení formuláře s výpočtem.
3. **Shoda se zadáním.** Projdi sekce Cíl, Technologie, Obrazovky a Kritéria hotovo a u každého požadavku zapiš splněno, částečně nebo ne a čím to dokládáš.
4. **Testy.** Zjisti, jestli procházejí, jestli pokrývají příklady ze zadání a jestli některý test nekontroluje špatnou hodnotu, která by chybu zakonzervovala.
5. **Mobil a přístupnost.**
   - Puppeteer na 360×800 a 1440×900: snímky hlavních stavů (prázdný formulář, výsledek, chyba) a kontrola, že stránka nepřetéká do šířky.
   - axe-core se značkami WCAG 2.2 A a AA. Cíl je 0 nálezů „serious“ a „critical“.
   - Ovládání klávesnicí (Tab projde formulář a fokus je vidět), popisky polí.
   - Zadávání čísel po česku („1 500“, „1500,50“) a chybové hlášky u špatného vstupu.
6. **Texty a citlivá témata.** Zkontroluj češtinu a srozumitelnost pro laika, upozornění „nejde o poradenství“, viditelné datum ověření pravidel a jeho shodu s `rules.json` a jestli aplikace neslibuje víc, než umí. U **kalkulator-dluhu** navíc všechna zvláštní pravidla ze sekce Dluhy v zadání: tón bez zahanbování, odkazy na bezplatné poradny, žádné placené služby oddlužení a žádná rada, která by člověka mohla poškodit.
7. **Soukromí a bezpečnost.**
   - Během používání zaznamenej síťové požadavky v Puppeteeru. Povolený je jen vlastní původ, případně výjimky, které výslovně uvádí zadání.
   - Bez analytiky a cookies třetích stran.
   - Uživatelský vstup se nesmí vkládat přes `innerHTML`. Vyzkoušej vstup `<img src=x onerror=alert(1)>`.
   - Ukládání do `localStorage` musí být zdokumentované a nesmí obsahovat citlivé údaje.
   - Žádné klíče ani tajemství v repozitáři.
8. **Nasazení a větve.**
   - Živý web vrací HTTP 200, odpovídá `main` (porovnej obsah aspoň jednoho JS souboru) a v konzoli nejsou chyby ani chybějící soubory.
   - U každé neslité větve zjisti, co mění (`git diff main...<větev> --stat` a krátký popis), jestli řeší některý nález a co doporučuješ.

Každý nález podagent ihned zopakuje podruhé. Teprve potom ho zapíše a připíše „reprodukováno 2×“. Zpráva vzniká jako `docs/revize/<D>/<repo>.md`. Po dokončení aplikace ji odškrtni v `PLAN.md`, commitni a pushni.

### Fáze 3 – Skeptik

Každý **kritický a vysoký** nález pošli zvlášť podagentovi v čistém kontextu s modelem **Opus** (parametr `model: opus`). Jde o jiný model, než který dělá revizi. Kdyby revize výjimečně běžela na Opusu, zvol pro skeptika `model: fable`, případně `sonnet`. Dostane jen text nálezu, cestu ke klonu a zdroje, ne zbytek zprávy. Úkol mu formuluj takto: *„Pokus se tento nález vyvrátit. Zopakuj ho sám a zkontroluj zdroj. Vrať verdikt Potvrzeno / Vyvráceno / Nejisté a 2–4 věty proč.“* Vyvrácené nálezy odstraň, nebo je s poznámkou sniž na nižší závažnost. Nejisté ponech s označením „nejisté“. Verdikt skeptika zapiš do řádku Ověření u nálezu.

### Fáze 4 – Opravné prompty (`opravy/<repo>.md`)

Pro každou aplikaci s aspoň jedním kritickým, vysokým nebo středním nálezem napiš hotový prompt pro nové sezení Claude Code v repozitáři té aplikace. U aplikace bez takových nálezů napiš do souboru jen „Není co opravovat“ a seznam nízkých nálezů. Prompt má:

- nahoře sekci **„Jak spustit“**: repozitář `frankie851/<repo>`, model Opus 5.5, effort High a co vložit;
- krátký kontext (aplikace, kde je zadání, že jde o opravy z nezávislé revize `<D>`);
- seznam nálezů k opravě seřazený podle závažnosti, u každého reprodukci, očekávanou hodnotu se zdrojem a doporučenou opravu. Nízké nálezy uveď na konci jako nepovinné;
- postup: ke každému nálezu nejdřív regresní test, který teď selže, potom oprava, potom všechny testy. Při změně pravidla se v `rules.json` aktualizují zdroj a datum. Mimo uvedené nálezy se nic neopravuje ani nepřepisuje a na konci vznikne PR s tabulkou *nález → test → stav*;
- definici hotovo a pokyn, co dělat, když se nález nepodaří zopakovat: zapsat to a neopravovat naslepo.

### Fáze 5 – Souhrn (`SOUHRN.md`)

1. Tabulka 12 aplikací × 8 oblastí (semafor), verdikt a počty nálezů podle závažnosti.
2. **Top 10 oprav** přes všechny aplikace, seřazených podle dopadu na uživatele.
3. **Nesoulad mezi aplikacemi:** stejné pravidlo s jinou hodnotou, zdrojem nebo zaokrouhlením ve dvou a více aplikacích. Na tom záleží při slučování do jednoho webu.
4. **Opakující se problémy:** stejný typ chyby ve více aplikacích.
5. Doporučené pořadí oprav a co nebylo ověřeno a proč.

### Fáze 6 – Souhrnná stránka (`revize.html`) a PR

1. Napiš `revize.html` jako **jedinou samostatnou stránku**. CSS i JS jsou vložené přímo, bez externích skriptů a obrázků (snímky obrazovky do ní nevkládej). Obsah: semafor 12 × 8, verdikty a seznam všech nálezů s filtrem podle aplikace, závažnosti a oblasti, každý nález rozbalitelný. Česky, čitelné na mobilu, světlý i tmavý režim.
2. Máš-li nástroj na publikování artefaktů, publikuj ji jako artefakt a odkaz dej do PR. Když ho nemáš, napiš do PR, že stránka je v repozitáři.
3. Commitni, pushni a otevři PR z `revize/<D>` do `main` s názvem **„Nezávislá revize 12 kalkulaček (<D>)“**. Do popisu dej tabulku verdiktů, top 5 oprav, odkaz na `SOUHRN.md` a odkaz na artefakt. PR otevři nástrojem, který sezení na GitHub má (`gh pr create` nebo nástroj pro PR). Když to nejde, nech větev pushnutou a do závěrečné zprávy napiš, že PR musí David založit tlačítkem na GitHubu.

## Pravidla a omezení

- **Do repozitářů aplikací nic nezapisuj.** Žádný push, větve, PR ani issues. Revize je nezávislá a o opravách rozhoduje David přes opravné prompty.
- **V tomto repozitáři měň jen `docs/revize/<D>/`.** `docs/zadani.md` neupravuj, chyby v něm zapiš jako nálezy. Klony aplikací, `node_modules` ani stažené nástroje do repozitáře nepatří.
- **Čísla jen ze zdrojů s odkazem a datem**, nic z paměti. Na tom stojí celá hodnota revize.
- **Testy a texty aplikace nejsou důkaz správnosti.** Důkazem je tvůj nezávislý přepočet a úřední zdroj.
- **Testovací vstupy jsou smyšlené.** Žádné skutečné osobní údaje.
- **Hodnotíš, neopravuješ.** U každého nálezu popiš, co změnit, ale opravu napiš jen jako doporučení.
- **Mimo rozsah:** design a sloučení společného webu, nové funkce, refaktoring a aplikace *Zdaním to?* (dividendy) a *Volno 2027*, které zatím neexistují. Když si všimneš něčeho mimo rozsah, co by mohlo uživatele poškodit, zapiš to jako nález. Jinak to jen krátce zmiň v souhrnu.

## Režim práce a kdy se zastavit

- **Režim C, samostatný:** pracuj bez otázek až do otevření PR. Když chybí údaj, použij rozumný předpoklad, zapiš ho do zprávy do sekce „Co se nepodařilo ověřit a předpoklady“ a pokračuj.
- **Zastav se a zeptej jen tehdy, když** by bylo nutné zapsat cokoli mimo `docs/revize/<D>/` v tomto repozitáři, když nejde naklonovat ani jeden z 12 repozitářů aplikací, nebo když chybí `docs/zadani.md`. Když selže jen část klonů, nezastavuj se a pokračuj podle fáze 0.
- **Na jeden problém nejvýš 3 pokusy** (nedostupný web, nástroj, který nejde nainstalovat, nejasné pravidlo). Potom ho zapiš jako „neověřeno“ s důvodem a pokračuj jinou částí.
- **Průběžné ukládání:** po každé dokončené aplikaci odškrtni `PLAN.md`, commitni a pushni. Kdyby sezení vypršelo, práce se neztratí.
- **Přerušení:** když ti dochází kontext nebo limity, zapiš `HANDOFF.md` (co je hotovo, rozpracováno a první další krok), commitni a pushni.

## Ověření a definice hotovo

- [ ] Existuje 12 zpráv `<repo>.md` se všemi sekcemi šablony, SHA commitu a verdiktem (nebo s odůvodněním, proč aplikace nešla ověřit).
- [ ] Každé pravidlo v `pravidla.md` má úřední zdroj a datum, nebo stav „neověřeno“ s důvodem.
- [ ] Každý testovací příklad ze zadání je nezávisle přepočítaný a výsledek je ve zprávě.
- [ ] Každý kritický a vysoký nález je reprodukovaný 2× a má verdikt skeptika.
- [ ] Každá aplikace má v `dukazy/<repo>/` snímky 360 px a 1440 px, výstup testů a výstup axe, jinak je oblast 5 označená ⚪ s důvodem.
- [ ] Je 12 souborů v `opravy/`.
- [ ] Hotový `SOUHRN.md` a `revize.html`, publikovaný jako artefakt, nebo s poznámkou proč ne.
- [ ] PR je otevřený a `git diff --stat main...revize/<D>` ukazuje změny jen v `docs/revize/<D>/`.
- [ ] V žádném repozitáři aplikace nevznikla nová větev ani commit: `git -C /tmp/revize/repos/<repo> status` je čistý a nic se nepushovalo.

**Před odevzdáním:** náhodně vyber 3 nálezy a zopakuj je ještě jednou, zkontroluj, že odkazy na zdroje v `pravidla.md` fungují, a porovnej počty nálezů v `SOUHRN.md` se zprávami.

## Závěrečná zpráva (v chatu)

5–15 řádků: kolik aplikací je Připraveno, Opravit před sloučením a Předělat, 3 nejvážnější problémy, co nebylo ověřeno a proč, odkaz na PR a artefakt a doporučený další krok (které opravné prompty spustit jako první).
