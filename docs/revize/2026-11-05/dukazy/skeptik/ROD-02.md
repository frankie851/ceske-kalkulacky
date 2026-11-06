# Skeptik – ROD-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: § 30b zákona č. 117/1995 Sb. počítá měsíc narození a měsíce s PPM jako měsíce celodenní péče (odst. 1 písm. a, b). Odst. 3 doslova říká, že při nároku na PPM „rodičovský příspěvek náleží, jen je-li vyšší, a to ve výši rozdílu“, takže souběh zákon dovoluje. Aplikace ale v `rodina.js:313–314` nastaví `rpOd = posledniPpm + 1`. Scénář (a), porod 15. 3. 2026 a příjem 15 000 Kč: mateřská vychází březen 10 726, duben 10 380 a srpen 5 190 Kč, příspěvek je nula až do srpna a začíná v září (odMesice 6). Správně má být rozdíl 4 274 / 4 620 / … / 9 810 Kč. Scénář (b), mateřská otce: v březnu 0 Kč, přestože mateřská v tom měsíci vůbec neběží, takže má náležet celých 34 440 Kč; v dubnu 0 Kč místo 34 440 − 5 740 = 28 700 Kč, první příspěvek až v říjnu. Jediná polehčující okolnost: README uvádí souběh jako nepočítané zjednodušení. Text v `app.js:155` („nevyplácí se souběžně“) je ale věcně nepravdivý a checklist v `app.js:173` radí podat žádost pozdě, takže závažnost Vysoká sedí.

Co jsem udělal: Spustil `planRodiny` z klonu (commit 9ff80c3) v Node pro oba scénáře a vypsal dávky po měsících. § 30b ověřil přes curl na zakonyprolidi.cz.
