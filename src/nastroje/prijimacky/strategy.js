// „Moje strategie“ – jednoduché porovnání očekávaných bodů s loňským minimem škol.
// Nic nepredikuje: loňské minimum závisí na loňských uchazečích.

const finite = v => typeof v === 'number' && Number.isFinite(v);

export const CATEGORY_LABEL = {
  jistota: 'Spíš jistota',
  tesne: 'Těsné',
  riziko: 'Riziko',
  nevim: 'Chybí údaje',
};

export function evaluateStrategy({ expected, schools = [], margin = 5 }) {
  // Hodnotí se jen zadané školy (název nebo minimum). Prázdné pozice formuláře se nevypisují
  // a varování „žádná jistota“ se neukáže, dokud není u žádné školy zadané minimum (revize PRI-07).
  const zadana = s => Boolean(s?.name?.trim()) || finite(s?.lastMin);
  const rows = schools.map((s, i) => {
    if (!zadana(s)) return null;
    let category = 'nevim';
    let diff = null;
    if (finite(expected) && finite(s.lastMin)) {
      diff = expected - s.lastMin;
      category = diff >= margin ? 'jistota' : diff >= 0 ? 'tesne' : 'riziko';
    }
    return { priority: i + 1, name: s.name?.trim() || `Škola ${i + 1}`, lastMin: s.lastMin, diff, category };
  }).filter(Boolean);
  const warnings = [];
  if (!finite(expected)) warnings.push({ id: 'missing-expected', level: 'info',
    text: 'Doplňte, kolik bodů zhruba čekáte (např. z testů nanečisto nebo ze školy).' });
  if (rows.some(r => !finite(r.lastMin)))
    warnings.push({ id: 'missing-min', level: 'info',
      text: 'U některé školy chybí loňské minimum. Najdete ho obvykle na webu školy (výsledky přijímacího řízení).' });
  if (rows.some(r => r.category !== 'nevim') && !rows.some(r => r.category === 'jistota'))
    warnings.push({ id: 'no-safe', level: 'warn',
      text: `Žádná škola nemá rezervu aspoň ${margin} b. nad loňským minimem. Zvažte přidat školu, kam se ` +
        'dostanete s velkou pravděpodobností – nejlépe na poslední místo. Na šance u vyšších priorit to nemá vliv.' });
  const names = rows.filter(r => schools[r.priority - 1].name?.trim()).map(r => r.name.toLowerCase());
  if (new Set(names).size !== names.length)
    warnings.push({ id: 'duplicate', level: 'warn', text: 'Stejná škola je uvedená víckrát.' });
  return { schools: rows, warnings };
}
