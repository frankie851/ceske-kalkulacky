# Skeptik – EET-02 (model Opus, čistý kontext, 5. 11. 2026)

Verdikt: Potvrzeno

Proč: V `osvc-app.js:433–436` (commit e5bf47f) dostává překryv `rect.overlay` atributy `tabindex="0"` a `aria-label="Najetím nebo šipkami na grafu zobrazíš hodnoty pro konkrétní příjmy."`, ale žádnou roli. Rodičovské `<svg>` má `role="img"` (ř. 374), takže jeho potomci jsou pro asistivní technologie prezentační a popisek fokusovatelného prvku se čtečce nezpřístupní. Pro WCAG 4.1.2 to znamená, že fokusovatelný prvek nemá zpřístupněné jméno. Při spuštění axe-core 4.14.0 s tagy wcag2a/wcag2aa/wcag21aa/wcag22aa na `index.html#osvc` s příjmem 800 000 Kč vyšlo při 1280×900 i 390×844 shodně `aria-prohibited-attr`, dopad serious, uzel `rect`. Jiné porušení se neobjevilo. Úvodní stránku bez grafu skeptik nekontroloval.

Co jsem udělal: Zkopíroval klon do `/tmp/revize/scratch/eet02/site` a spustil nad ním statický server. Puppeteer s Chromiem vyplnil `#osvc-income`=800000, odeslal formulář, vypsal `rect.overlay` a spustil `axe.run` se zmíněnými tagy.
