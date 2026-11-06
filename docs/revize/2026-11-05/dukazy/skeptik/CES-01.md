# Skeptik – CES-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: § 163 odst. 4 ZP na zakonyprolidi.cz (https://www.zakonyprolidi.cz/cs/2006-262#p163) zní: „Při pracovní cestě, která spadá do 2 kalendářních dnů, se upustí od odděleného posuzování doby trvání pracovní cesty v kalendářním dnu, je-li to pro zaměstnance výhodnější.“ Pro veřejnou sféru platí taky, protože § 176 odst. 1 vylučuje jen § 163 odst. 1–3 a § 174 odkazuje na hlavu II. Aplikace v `cesty.js:113–127` (`hodinyPoDnech`) a `cesty.js:211–215` cestu vždy dělí po kalendářních dnech a variantu „dohromady“ nikde nepočítá. Výsledky v obou sférách: 20:00–2:00 → 0 Kč (správně 155), 6:00–0:30 → 236 Kč (správně 370), 22:00–11:00 → 155 Kč (správně 236), 19:00–10:00 → 310 Kč, kde je dělení po dnech výhodnější a 310 Kč sedí. README v sekci „Co aplikace záměrně nepočítá“ pravidlo zmiňuje jen jako „nepodařilo se ověřit“; v platném znění zákona je, takže jde o skutečnou chybu v neprospěch zaměstnance.

Co jsem udělal: Stáhl znění zákona č. 262/2006 Sb. ze zakonyprolidi.cz a přečetl § 163, 174 a 176. V Node spustil `spocitejCestu` z klonu na commitu bb4e580 se sazbami z `rules.json` pro všechny 4 cesty a obě sféry.
