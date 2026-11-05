# Skeptik – SLV-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Kód odpovídá popisu nálezu. V `app.js` funkce `cti` u kroku školky (ř. 154–163) přepisuje `skolka`/`skolne` jen tehdy, když platí `fd.has('skolne'+i)`. Funkce `html` (ř. 143) vykreslí pole jen dětem s rokem narození ≥ 2020 (2027 − 7). `odpovedi()` (ř. 352) předá starý stav beze změny a `skolkovne()` v `slevy.js:88–93` věk dítěte nekontroluje. V prohlížeči zopakováno: dítě nar. 2023, školné 20 000 Kč, pak změna roku narození na 2012. Krok školky pak hlásí „Nezadali jste žádné dítě v předškolním věku“, ale výsledek přesto obsahuje řádek „Sleva za umístění dítěte (školkovné) … 20 000 Kč“ a součet „Až 66 044 Kč ročně“, tedy o 20 000 Kč víc. Podle § 35bd odst. 1 ZDP ve znění zákona č. 180/2026 Sb. jde o slevu za „umístění … dítěte v předškolním zařízení“, takže na patnáctileté dítě nárok není.

Co jsem udělal: Kód prošel čtením v `/tmp/revize/repos/slevy-2027` (commit d88ba42) a nález zopakoval puppeteer skriptem nad kopií klonu servírovanou `python3 -m http.server`. Pak curlem stáhl zákon č. 180/2026 Sb. ze zakonyprolidi.cz a ověřil znění § 35bd odst. 1.
