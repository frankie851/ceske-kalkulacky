// Rozřazovací algoritmus – odložené přijetí (deferred acceptance) z pohledu uchazečů.
// Čisté funkce, bez DOM. Popis podle Metodického materiálu MŠMT k přijímacímu řízení
// („algoritmus odloženého přijetí“, výsledek je optimálně stabilní).

export class TieError extends Error {
  constructor(a, b) {
    super(`Shoda pořadí: ${a.name ?? a.id} a ${b.name ?? b.id} mají stejný počet bodů. ` +
      'Škola musí stanovit jednoznačné pořadí (doplňte rozhodovací kritérium).');
    this.name = 'TieError';
    this.applicants = [a.id, b.id];
  }
}

const finite = v => typeof v === 'number' && Number.isFinite(v);

/** Lepší výsledek ze dvou pokusů pro každý předmět zvlášť. attempts = { cj: [a, b], m: [a, b] } */
export function bestOfTwo(attempts = {}) {
  const best = list => {
    const vals = (list ?? []).filter(finite);
    return vals.length ? Math.max(...vals) : 0;
  };
  return best(attempts.cj) + best(attempts.m);
}

export function scoreOf(applicant) {
  if (applicant.attempts) return bestOfTwo(applicant.attempts);
  return finite(applicant.score) ? applicant.score : 0;
}

/** Porovnání dvou uchazečů na škole: záporné číslo = a je v pořadí před b. */
export function compareApplicants(a, b) {
  const d = scoreOf(b) - scoreOf(a);
  if (d !== 0) return d;
  const ta = finite(a.tiebreak) ? a.tiebreak : null;
  const tb = finite(b.tiebreak) ? b.tiebreak : null;
  if (ta !== null && tb !== null && ta !== tb) return tb - ta;
  if (a.id === b.id) return 0;
  throw new TieError(a, b);
}

/** Pořadí uchazečů na škole (sestupně podle bodů, pak podle rozhodovacího kritéria). */
export function rankApplicants(applicants) {
  const list = [...applicants].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  // ověř jednoznačnost pořadí (vyhláška 422/2023 Sb.: nikdo nesdílí stejné místo)
  for (let i = 0; i < list.length; i++)
    for (let j = i + 1; j < list.length; j++) compareApplicants(list[i], list[j]);
  return list.sort(compareApplicants);
}

/**
 * Odložené přijetí po kolech:
 *  1. každý dosud nezařazený uchazeč se hlásí na svou nejvyšší dosud nezkoušenou prioritu,
 *  2. každá škola si z dočasně držených + nových vybere nejlepší do kapacity, ostatní odmítne,
 *  3. opakuje se, dokud někdo není odmítnut a má ještě další prioritu.
 * Dočasné držení není přijetí – lepší uchazeč může později „vytlačit“ horšího.
 *
 * applicants: [{ id, name?, score? | attempts?, tiebreak?, priorities: [schoolId, …] }]
 * schools:    [{ id, name?, capacity, minScore? }]
 * Vrací { assignment: {applicantId: schoolId|null}, schools: {schoolId: [applicantId…]}, rounds: [...] }
 */
export function deferredAcceptance(applicants, schools) {
  const schoolById = new Map(schools.map(s => [s.id, s]));
  const byId = new Map(applicants.map(a => [a.id, a]));
  // Seřaď podle id → kroky i výsledek nezávisí na pořadí zadání.
  const sortedIds = [...byId.keys()].sort();

  // Jednoznačnost pořadí ověř předem pro celou množinu uchazečů každé školy.
  for (const s of schools) {
    rankApplicants(applicants.filter(a => cleanPriorities(a, schoolById).includes(s.id)));
  }

  const prefs = new Map(sortedIds.map(id => [id, cleanPriorities(byId.get(id), schoolById)]));
  const next = new Map(sortedIds.map(id => [id, 0])); // index další priority
  const held = new Map(schools.map(s => [s.id, []]));
  let free = sortedIds.filter(id => prefs.get(id).length > 0);
  const rounds = [];

  while (free.length) {
    const proposals = [];
    for (const id of free) {
      const i = next.get(id);
      const sid = prefs.get(id)[i];
      next.set(id, i + 1);
      proposals.push({ applicant: id, school: sid, priority: i + 1 });
    }
    const rejected = [];
    const touched = [...new Set(proposals.map(p => p.school))].sort();
    for (const sid of touched) {
      const s = schoolById.get(sid);
      const incoming = proposals.filter(p => p.school === sid).map(p => byId.get(p.applicant));
      const candidates = [...held.get(sid).map(id => byId.get(id)), ...incoming];
      const eligible = [];
      for (const a of candidates) {
        if (finite(s.minScore) && scoreOf(a) < s.minScore) {
          rejected.push({ applicant: a.id, school: sid, reason: 'kriteria' });
        } else eligible.push(a);
      }
      const ranked = rankApplicants(eligible);
      const cap = Math.max(0, Math.floor(s.capacity ?? 0));
      held.set(sid, ranked.slice(0, cap).map(a => a.id));
      for (const a of ranked.slice(cap)) {
        rejected.push({ applicant: a.id, school: sid, reason: 'kapacita', displacedBy: held.get(sid).at(-1) ?? null });
      }
    }
    rejected.sort((x, y) => (x.applicant < y.applicant ? -1 : 1));
    rounds.push({
      proposals,
      rejected,
      held: Object.fromEntries(schools.map(s => [s.id, [...held.get(s.id)]]).sort()),
    });
    free = rejected.map(r => r.applicant).filter(id => next.get(id) < prefs.get(id).length);
  }

  const assignment = {};
  for (const id of sortedIds) assignment[id] = null;
  for (const [sid, ids] of held) for (const id of ids) assignment[id] = sid;
  return {
    assignment,
    schools: Object.fromEntries([...held].map(([sid, ids]) => [sid, [...ids]])),
    rounds,
  };
}

function cleanPriorities(a, schoolById) {
  const seen = new Set();
  return (a.priorities ?? []).filter(sid => {
    if (!sid || !schoolById.has(sid) || seen.has(sid)) return false;
    seen.add(sid);
    return true;
  });
}

/**
 * Vysvětlení výsledku pro každého uchazeče: proč nebyl přijat na vyšší priority.
 * Vrací { applicantId: [věta, …] }.
 */
export function explain(result, applicants, schools) {
  const schoolById = new Map(schools.map(s => [s.id, s]));
  const byId = new Map(applicants.map(a => [a.id, a]));
  const nm = a => a.name || a.id;
  const sn = sid => schoolById.get(sid)?.name || sid;
  const out = {};
  for (const a of applicants) {
    const prefs = cleanPriorities(a, schoolById);
    const got = result.assignment[a.id];
    const lines = [];
    const stop = got == null ? prefs.length : prefs.indexOf(got);
    for (let i = 0; i < stop; i++) {
      const s = schoolById.get(prefs[i]);
      if (finite(s.minScore) && scoreOf(a) < s.minScore) {
        lines.push(`${i + 1}. priorita ${sn(s.id)}: nesplnil(a) kritéria (minimum ${s.minScore} b., má ${scoreOf(a)} b.).`);
        continue;
      }
      const heldIds = result.schools[s.id] ?? [];
      if (!heldIds.length) {
        lines.push(`${i + 1}. priorita ${sn(s.id)}: škola nemá žádné volné místo.`);
        continue;
      }
      const last = byId.get(heldIds.at(-1));
      lines.push(`${i + 1}. priorita ${sn(s.id)}: všech ${heldIds.length} míst obsadili uchazeči s lepším pořadím ` +
        `(poslední přijatý: ${nm(last)}, ${scoreOf(last)} b.; ${nm(a)} má ${scoreOf(a)} b.).`);
    }
    if (got != null) lines.push(`Přijat(a) na ${prefs.indexOf(got) + 1}. prioritu: ${sn(got)}.`);
    else if (!prefs.length) lines.push('Nemá zadanou žádnou školu.');
    else lines.push('Nepřijat(a) v tomto kole – může se hlásit do dalšího kola.');
    out[a.id] = lines;
  }
  return out;
}
