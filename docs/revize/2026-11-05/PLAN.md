# Plán nezávislé revize 12 kalkulaček – 5. 11. 2026

Větev `revize/2026-11-05`. Revizor: Claude Fable 5.1 (čisté sezení, kód nepsal). Skeptik: Opus.

## Fáze 0 – Příprava
- ☑ Datum, větev, složka
- ☑ 12 klonů v `/tmp/revize/repos/<repo>` (všechny úspěšné)
- ☑ SHA `main` a vzdálené větve (viz tabulka)
- ☑ Nástroje: puppeteer + @axe-core/puppeteer v `/tmp/revize/nastroje` (prohlížeč: předinstalované Chromium Playwright)
- ☑ Kostra commitnuta a pushnuta

## Revidované commity

| Kód | Repozitář | SHA `main` | Datum | Další větve |
|---|---|---|---|---|
| P48 | plan48 | `48733fea370ca096397c964ed430fa48cd8ee11c` | 4. 11. 2026 | — |
| PEN | penzijko-kompas | `7381900dfabf675e2ada72431ac448b9ba8a0a6e` | 4. 11. 2026 | — |
| EET | mam-eet | `e5bf47f97e1389606957ac2a02d66ecf02440b93` | 5. 11. 2026 | `claude/fix-tabs-race` |
| SPOT | spot-nebo-fix | `1c1f7b2613e0a5a37fdf9bfee426749a2f31c36e` | 5. 11. 2026 | — |
| BYD | bydlometr | `047298597072978a58322e6484e98fa564e80a07` | 5. 11. 2026 | — |
| SLV | slevy-2027 | `d88ba427d8f665161b10071deb45c3a26bd4ac9d` | 5. 11. 2026 | — |
| INF | inflacni-kalkulacka | `b9e19800fed0e0bcbf0971930208b3ff0b541903` | 5. 11. 2026 | — |
| PRI | prijimacky-bez-paniky | `e9dd0d338515283b277a2b54fa684a351375e4bf` | 5. 11. 2026 | — |
| CES | cestovni-prikaz | `bb4e5801f25eae6d24d5253474527300cd4d59d1` | 5. 11. 2026 | — |
| VYP | vypoved-2026 | `e5c7b54d4138fc0f89581c7a6adf4442d780fa4c` | 5. 11. 2026 | `claude/vypoved-2026-calculator-4wx7op` |
| ROD | rodicovska | `9ff80c369dcb60f61e74c067b7d6e96302c554aa` | 5. 11. 2026 | — |
| DLU | kalkulator-dluhu | `abb6c1c48d1d0703aa02058e012d6f57156b6e9f` | 5. 11. 2026 | — |

Živé weby: všech 12 adres `https://frankie851.github.io/<repo>/` vrátilo HTTP 200 (5. 11. 2026, curl).

## Fáze 1 – Rejstřík pravidel (`pravidla.md`)
- ☑ Daně a penze (P48, PEN, SLV, EET/OSVČ) – 73 pravidel
- ☑ Práce, rodina, cesty (VYP, ROD, CES) – 74 pravidel
- ☑ Dluhy a školství (DLU, PRI) – 38 + 28 pravidel
- ☑ Finance a datové řady (BYD, SPOT, INF) – 46 pravidel + 3 datové řady

## Fáze 2–3 – Revize aplikací a skeptik

| Kód | 2 Revize | 3 Skeptik | 4 Oprava | Verdikt |
|---|---|---|---|---|
| P48 | ☐ | ☐ | ☐ | |
| PEN | ☐ | ☐ | ☐ | |
| EET | ☐ | ☐ | ☐ | |
| SPOT | ☐ | ☐ | ☐ | |
| BYD | ☐ | ☐ | ☐ | |
| SLV | ☐ | ☐ | ☐ | |
| INF | ☐ | ☐ | ☐ | |
| PRI | ☐ | ☐ | ☐ | |
| CES | ☐ | ☐ | ☐ | |
| VYP | ☐ | ☐ | ☐ | |
| ROD | ☐ | ☐ | ☐ | |
| DLU | ☐ | ☐ | ☐ | |

## Fáze 5–6
- ☐ `SOUHRN.md`
- ☐ `revize.html` + artefakt
- ☐ PR do `main`

## Poznámky k prostředí
- Přímo přes curl nejsou dostupné `psp.cz`, `mfcr.cz`, `uradprace.cz` a `www.mpsv.gov.cz` (spojení se nenaváže); `mpsv.gov.cz` bez `www` odpovídá. Dostupné: zakonyprolidi.cz, e-sbirka.gov.cz, cnb.cz, ote-cr.cz, eru.gov.cz, csu.gov.cz, cermat.gov.cz, financnisprava.gov.cz, cssz.gov.cz, justice.cz, epravo.cz.
- `GH_TOKEN` v prostředí je neplatný; push se zkouší přes proxy sezení.
