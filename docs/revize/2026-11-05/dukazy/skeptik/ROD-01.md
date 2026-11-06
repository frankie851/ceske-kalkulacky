# Skeptik – ROD-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: § 30b odst. 1 písm. d) zákona č. 117/1995 Sb. (https://www.zakonyprolidi.cz/cs/1995-117#p30b) výslovně říká, že podmínka celoměsíční péče je splněna „i v kalendářním měsíci, v němž dítě dosáhlo věku 3 let“. Příspěvek tedy náleží i za měsíc 3. narozenin (u porodu 15. 3. 2026 za březen 2029). MPSV uvádí jen obecně „nejdéle do 3 let věku“, takže zákonu neodporuje. Kód při commitu 9ff80c3 cyklí `m < vekMesicu` (rodina.js:130), takže posledním měsícem je 35, tj. únor 2029. Horizont osy `prvniDenMesice(B, 36) − 1` (rodina.js:281) a checklist v app.js („Do 28. 2. 2029“) končí stejně. Pro 350 000 Kč a 8 000 Kč od 6. měsíce `cerpaniRp` vrátil 240 000 / 110 000 Kč při 30 měsících a posledním měsíci 35. Podle zákona vychází 31 měsíců a 248 000 / 102 000 Kč.

Co jsem udělal: Spustil v Node `cerpaniRp({celkem:350000, mesicniVyse:8000, odMesice:6, vekMesicu:36})` z klonu a přečetl rodina.js:122–145, 195, 280–281 a app.js:182–183. Přes curl ověřil text § 30b odst. 1 písm. d) na zakonyprolidi.cz a stránku MPSV.
