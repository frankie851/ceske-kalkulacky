# Zadání pro Claude Code: Volno 2027

Volno 2027 navrhne, kdy si v roce 2027 vzít dovolenou, aby vyšlo co nejvíc volných dní v kuse.
K tomu ukáže všechny svátky roku, dny, kdy jsou zavřené velké obchody, a kalendář celého roku.
Je to nejjednodušší nástroj webu: žádná externí data, jen kalendář a dva zákony. Hodí se teď,
kdy lidé plánují dovolené na příští rok.

**Podklady, ze kterých zadání vychází (ověřeno 5. 11. 2026):**

- **Svátky:** zákon č. 245/2000 Sb., o státních svátcích, o ostatních svátcích, o významných
  dnech a o dnech pracovního klidu ([e-Sbírka](https://www.e-sbirka.gov.cz/sb/2000/245),
  [epravo.cz](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2000/245)). Dny pracovního
  klidu jsou státní svátky (1. 1., 8. 5., 5. 7., 6. 7., 28. 9., 28. 10., 17. 11.) a ostatní
  svátky (Velký pátek, Velikonoční pondělí, 1. 5., 24. 12., 25. 12., 26. 12.), dohromady 13 dnů.
- **Prodejní doba:** zákon č. 223/2016 Sb., o prodejní době v maloobchodě a velkoobchodě
  ([epravo.cz](https://www.epravo.cz/top/zakony/sbirka-zakonu/sb/2016/223),
  [Práce a mzda](https://www.praceamzda.cz/predpisy/223-2016-sb),
  [BusinessInfo](https://www.businessinfo.cz/cs/clanky/prodejni-doba-v-maloobchode-a-velkoobchode-84594.html)).
  Prodejny s prodejní plochou nad 200 m² mají zavřeno 1. 1., o Velikonočním pondělí, 8. 5.,
  28. 9., 28. 10., 25. 12. a 26. 12. a 24. 12. od 12:00 do 24:00. Zákaz se netýká menších
  prodejen, čerpacích stanic, lékáren, prodejen na letištích, nádražích apod.
- **Kalendář 2027 (vlastní výpočet):** Velikonoční neděle 28. 3., Velký pátek 26. 3.,
  Velikonoční pondělí 29. 3. Svátky 1. 5., 8. 5. a 25. 12. připadnou na sobotu, 26. 12. na
  neděli. 5. 7. je pondělí a 6. 7. úterý, takže sobota 3. 7. až úterý 6. 7. jsou čtyři dny
  volna bez dovolené. 24. 12. je pátek.

```markdown
# Úkol: Volno 2027 – kdy si vzít dovolenou

## Cíl
Stránka v češtině na webu Spočítáno (`/prace-rodina/volno-2027/`): uživatel zadá, kolik dnů
dovolené chce vložit do jednoho volna (1–5), a dostane návrhy, kam je dát, aby vyšlo co nejvíc
volných dní v kuse. Stránka ukáže i kalendář roku 2027, seznam svátků s dnem v týdnu a dny,
kdy jsou zavřené velké obchody.

## Technologie
- Eleventy 3, komponenty varianty B (viz `docs/jak-pridat-nastroj.md`).
- Výpočet v `src/nastroje/volno-2027/volno.js` (čisté ES moduly, bez DOM, bez `new Date()`
  bez argumentu). Svátky i zavřené obchody v `rules.json` s `meta`. Rok 2027 je jen v
  `rules.json` (`rok`), v kódu žádné datum roku 2027.
- Velikonoce algoritmem (anonymní gregoriánský algoritmus Meeus/Jones/Butcher), ne tabulkou.
- Testy: `node --test`. Ukázkový výsledek se spočítá při buildu stejným modulem.

## Pravidla k ověření se zdroji
| Pravidlo | Zdroj | Potvrzeno |
| --- | --- | --- |
| 13 dnů pracovního klidu: 1. 1., Velký pátek, Velikonoční pondělí, 1. 5., 8. 5., 5. 7., 6. 7., 28. 9., 28. 10., 17. 11., 24. 12., 25. 12., 26. 12. | zákon č. 245/2000 Sb., § 1 a § 2 | ano |
| Velký pátek a Velikonoční pondělí se odvozují od Velikonoční neděle (−2 a +1 den) | zákon č. 245/2000 Sb., § 2 | ano |
| Prodejny nad 200 m² zavřeno 1. 1., Velikonoční pondělí, 8. 5., 28. 9., 28. 10., 25. 12., 26. 12. | zákon č. 223/2016 Sb. | ano |
| 24. 12. zavřeno od 12:00 do 24:00 | zákon č. 223/2016 Sb. | ano |
| Výjimky: menší prodejny (do 200 m²), čerpací stanice, lékárny, prodejny na letištích, nádražích apod. | zákon č. 223/2016 Sb. | ano |
| Dovolená se čerpá v pracovních dnech, pracovní týden je pondělí–pátek | předpoklad nástroje | ne (do `meta.neovereno`) |

## Výpočet
- Volný den = sobota, neděle nebo svátek. Pracovní den = všechno ostatní.
- `velikonocniNedele(rok)` → 'RRRR-MM-DD'.
- `svatkyRoku(rok, rules)` → `[{ datum, nazev, zavreno: 'cely-den' | 'od-poledne' | null }]`.
- `blokyVolna(rok, rules)` → souvislé úseky volných dnů (víkend + svátky) s délkou a svátky.
- `nejlepsiNavrhy(rok, n, rules, { max = 5 })`: pro n = 1–5 dnů dovolené projde všechny
  souvislé úseky, které obsahují svátek v pracovní den, mají nejvýš n pracovních dnů (ty se
  vezmou jako dovolená, všechny v roce `rok`) a nejdou prodloužit bez další dovolené. Pro každý
  svátkový blok nechá nejdelší úsek (při shodě ten s méně dny dovolené). Seřadí podle poměru
  dny volna / dny dovolené, pak podle délky a data. Volno smí přesáhnout do sousedního roku
  (24. 12. 2027 až 2. 1. 2028), dovolená ne.
- `zavreneObchodyRoku(rok, rules)` → dny se zavřenými obchody (celý den / od poledne).

## Obrazovky
1. Formulář: kolik dnů dovolené chceš vložit (1–5, pilulky). Bez JS ukázka pro 1 den.
2. Výsledek „Kolik volna ti dá X dnů dovolené“: nejlepší návrh velkým číslem (dny volna
   v kuse), od–do, které dny vzít. Mobilní lepivá lišta s tímtéž číslem.
3. Návrhy (karty): od–do, dny volna, kolik dnů dovolené, které dny vzít, které svátky pomohou.
4. Kalendář roku 2027: 12 měsíců jako přístupné tabulky (Po–Ne, popisky pro čtečky).
   Víkend, svátek a navržená dovolená se liší tvarem i barvou, ne jen barvou. Legenda.
5. Svátky 2027: datum, den v týdnu, název, jestli jsou zavřené obchody.
6. Kdy jsou zavřené obchody: seznam, poznámka o 24. 12. od poledne a výjimkách.
7. Zajímavosti z dat: svátky o víkendu, prodloužené víkendy, nejdelší volno bez dovolené.

## Kontrolní příklady
- Velikonoční neděle: 2024-03-31, 2025-04-20, 2026-04-05, 2027-03-28, 2028-04-16,
  2029-04-01, 2030-04-21.
- 2027: Velký pátek 26. 3., Velikonoční pondělí 29. 3.; blok 26.–29. 3. = 4 dny volna.
- 1. 5., 8. 5., 25. 12. a 26. 12. 2027 připadnou na víkend.
- 5.–6. 7. 2027: sobota 3. 7. až úterý 6. 7. = 4 dny volna bez dovolené.
- 24. 12. 2027: obchody nad 200 m² zavřené od poledne.
- 1 den dovolené kolem svátku → aspoň 4 dny volna v kuse (např. pondělí 27. 9. → 25.–28. 9.,
  středa 7. 7. → 3.–7. 7. = 5 dnů).
- Svátky z `svatkyRoku` se shodují s funkcí `svatky(rok)` z Výpovědi 2026 pro roky 2026–2030.

## Kritéria hotovo
- `node --test` projde (testy modulu a sdílený test s Výpovědí 2026).
- E2E: v seznamu svátků je 26. 3. 2027 Velký pátek a 5.–6. 7.; s 1 dnem dovolené je mezi
  návrhy blok aspoň 4 dny; změna počtu dnů přepočítá návrhy; kalendář má 12 měsíců;
  0 chyb v konzoli; bez JS je vidět ukázka i kalendář.
- Kontrola webu: 0 chyb axe serious/critical ve světlém i tmavém režimu, nic nepřetéká
  na 360 px, 0 cizích požadavků.

## Mimo rozsah
Směnný provoz a jiný pracovní týden než pondělí–pátek, svátky jiných zemí, roční plán
rozložení celé dovolené, export do kalendáře (.ics).
```
