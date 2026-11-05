# Skeptik – INF-01 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: Na commitu b9e1980 obarvuje `styles.css:105` aktivní záložku jako bílé písmo na `var(--accent)`. To je #2a78d6 (ř. 9), což podle vzorce WCAG dává poměr 4,42:1. V tmavém režimu jde o #3987e5 (ř. 29 a 47), což dává 3,64:1. axe-core při šířce 360 px nahlásil `color-contrast` (serious) na `#tab-convert` i `#tab-wage` v obou režimech (4,41 a 3,63). Vypočtený styl je 15,2 px a váha 600, takže to není „velký text“ (ten začíná na 18,66 px tučně nebo 24 px) a platí limit 4,5:1 z WCAG 2.2 SC 1.4.3. Drobná nepřesnost je jen v doporučení: #1d5fae (už existující `--accent-ink`) má 6,36:1, ne „≈ 6,5:1“.

Co jsem udělal: Kopii klonu pustil přes `python3 -m http.server` a v puppeteeru (viewport 360 px, emulace light i dark) kliknul na záložky a spustil axe s tagy wcag2a/aa, wcag21a/aa a wcag22aa. Kontrastní poměry nezávisle přepočítal vzorcem relativní luminance z WCAG.
