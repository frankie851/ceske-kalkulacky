# Spočítáno

Kalkulačky a průvodci podle českých pravidel (pracovní název **Spočítáno**). Statický web
v [Eleventy 3](https://www.11ty.dev/), design varianty B „Přátelský průvodce“. Výpočty běží
jen v prohlížeči. Web nic neukládá ani neodesílá (kromě volby světlého/tmavého režimu
v `localStorage`). Písma jsou hostovaná přímo na webu a web nevolá žádné cizí domény.

## Spuštění

Potřebujete Node.js 22 nebo novější.

```bash
npm ci
```

```bash
npm start
```

`npm start` spustí vývojový server s automatickým obnovením stránky na http://localhost:8080/.

```bash
npm run build
```

`npm run build` sestaví web do `_site/`.

## Testy a kontroly

```bash
npm test
```

Unit testy (`node --test`) pokrývají výpočty všech nástrojů a sdílené moduly.

```bash
npm run build && npm run test:e2e
```

E2E testy v Puppeteeru vyplní ve skutečném rozhraní kontrolní příklady ze zadání.

```bash
npm run kontrola
```

Kontrola projde všechny stránky v `_site`:
- axe (WCAG 2.2 AA) ve světlém i tmavém režimu,
- šířka 360 px bez přetečení,
- žádné cizí požadavky ani chyby v konzoli,
- stránky fungují bez JavaScriptu.

```bash
npm run lighthouse
```

Lighthouse na mobilu musí dosáhnout výkonu aspoň 90 a přístupnosti 100.

```bash
npm run kontrola:navrhy
```

Kontrola prototypů designu z 1. fáze (`designs/`).

Při sestavení pro GitHub Pages se web servíruje z podsložky. Stejnou proměnnou použijte
i pro kontroly:

```bash
PATH_PREFIX=/ceske-kalkulacky/ npm run build
```

```bash
PATH_PREFIX=/ceske-kalkulacky/ npm run kontrola
```

## Struktura

| Cesta | Obsah |
| --- | --- |
| `src/` | zdroj webu: stránky (`*.njk`), data (`_data/`), layouty a makra (`_includes/`), CSS, JS, obrázky |
| `src/nastroje/<id>/` | jeden nástroj: `nastroj.json`, `rules.json`, výpočetní moduly, testy (`test/`), stránky a klientský JS |
| `src/js/` | sdílené moduly: `format.js`, `graf.js` (SVG grafy), `hledani.js`, `tema.js` |
| `test/sdilene/`, `test/e2e/` | testy sdílených modulů, konzistence mezi nástroji a e2e testy |
| `tools/kontroly/` | kontroly webu a návrhů, Lighthouse, statický server |
| `docs/` | zadání, informační architektura, rozhodnutí, návod [jak přidat nástroj](docs/jak-pridat-nastroj.md) |
| `designs/` | prototypy designu z 1. fáze (rozcestník `designs/index.html`) |

## Úprava pravidel po změně zákona

Všechny částky, sazby, limity a termíny jsou v `src/nastroje/<id>/rules.json`. V kódu nejsou
natvrdo zapsané a testy to u Plánu48, Penzijko kompasu a Mám EET? hlídají.

1. Upravte hodnotu v `rules.json` a doplňte nebo opravte zdroj (URL).
2. Aktualizujte `meta.overeno` na datum, kdy jste pravidlo ověřili. Datum se zobrazí na webu
   ve štítku „Pravidla ověřena k …“.
3. Co se nepodařilo potvrdit z oficiálního zdroje, zapište do `meta.neovereno`. Taková pravidla
   do výpočtu nedávejte.
4. U návrhů zákonů ponechte štítek „Návrh, zatím neschváleno“, dokud zákon nevyjde ve Sbírce.
5. Spusťte `npm test` a podle potřeby upravte kontrolní příklady v testech.
6. Plán48 a Penzijko kompas mají každý vlastní pravidla státního příspěvku.
   `test/sdilene/konzistence.test.js` zachytí, když se jejich výsledky rozjedou, proto
   upravujte oba soubory.

## Nasazení

Při pushi do `main` workflow `.github/workflows/web.yml` spustí testy, sestaví web s
`PATH_PREFIX=/<název repozitáře>/`, provede kontroly, e2e testy a Lighthouse a pak web nasadí
na GitHub Pages. Na pull requestech běží stejné kroky, jen bez nasazení.

**Jednorázové nastavení:** v repozitáři zapněte Settings → Pages → Build and deployment →
Source: **GitHub Actions**.

## Dokumentace

- `docs/zadani.md`: zadání všech aplikací, zdroj pravdy.
- `docs/zadani-faze-2.md`: sestavení webu ve třech vlnách.
- `docs/informacni-architektura.md`: kategorie, navigace, URL, vazby a vyhledávání.
- `docs/rozhodnuti.md`: předpoklady, rozhodnutí a výsledky kontrol.
- `docs/jak-pridat-nastroj.md`: postup pro přenos dalšího nástroje.
