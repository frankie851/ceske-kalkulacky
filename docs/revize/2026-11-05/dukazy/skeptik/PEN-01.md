# Skeptik – PEN-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: V `calc.js:93–96` se `nastupce` a `posledniRok = rokKonce(fondDef.konci)` použijí bez ohledu na zvolenou sadu. `rules.json:50–51` u fondu `transformovany` dává `konci: "2036-12-31"` a `nastupce: "konzervativni"` bez označení, že jde o návrh. Pro výchozí vstup (35 let, vklad 1 000 Kč, zůstatek 150 000 Kč, TF 0,8 %/10 %/1,5 %, sada „2026“, start 11/2026) vychází přesně 852 538 / 406 441 Kč, z toho 238 měsíců v konzervativním fondu. S `bezNastupce` vychází 655 378 / 312 447 Kč, tedy přesně čísla z nálezu. Sada 2026 dostane štítek „platí“ (`app.js:39–42`) a věta na kartě TF (`app.js:310`) i v patičce (`app.js:383`) je bez štítku návrhu. Aktuální znění zákona č. 427/2011 Sb. na zakonyprolidi.cz řetězec „2036“ vůbec neobsahuje. § 194 odst. 2 zná jen zánik povolení, žádný pevný konec transformovaných fondů.

Co jsem udělal: Spustil `projekce()` z klonu (commit 7381900) v Node, jednou výchozí a jednou s `bezNastupce:true`, přečetl dotčená místa v `calc.js`, `rules.json`, `app.js` a v testu. Stáhl https://www.zakonyprolidi.cz/cs/2011-427 a hledal v něm „2036“, „2035“ a znění § 194.
