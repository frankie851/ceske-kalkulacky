// UI průvodce „Mám EET?“. Veškerá logika je v rules.js, texty a čísla v rules.json,
// HTML výsledku sdílí s buildem vystup.js. Odpovědi drží jen proměnná `answers`
// v paměti stránky: nic se neukládá ani neodesílá.

import { visibleQuestions, fill, uiVars } from './rules.js';
import { h, put, ikona, html } from './dom.js';
import {
  modelEet,
  vysledekEetHtml,
  kalkulackaHtml,
  kalkulackaTabulkaHtml,
  modelKalkulacky,
  seznamHtml,
  textOdpovedi,
} from './vystup.js';

const $ = (id) => document.getElementById(id);

const rules = JSON.parse($('pravidla').textContent);
const vars = uiVars(rules);
const koren = $('eet');
const sprite = koren.dataset.sprite;
const app = $('eet-app');

// Texty rozhraní, které v rules.json nejsou (bez čísel a částek).
const T = {
  dotaznik: 'Dotazník',
  hotovo: 'hotovo',
  praveTady: 'právě tady',
  kroky: 'Kroky dotazníku',
  hotovoVse: 'Hotovo, tady je tvůj výsledek',
  neposilame: 'Odpovědi nikam neposíláme',
  chyba: 'Chyba: ',
  vyplneno: 'Tvoje odpovědi',
};

let answers = {};
let step = 0;

/** Fokus na nadpis (bez skoku) a posun, jen když nadpis není vidět. */
function focusHeading(el) {
  if (!el) return;
  el.setAttribute('tabindex', '-1');
  el.focus({ preventScroll: true });
  const r = el.getBoundingClientRect();
  if (r.top < 0 || r.bottom > window.innerHeight) el.scrollIntoView({ block: 'start' });
}

/* ---------- Krokovač (pruh „Otázka 2 z 8“) ---------- */

function krokovac(ids, current, { done = false } = {}) {
  const total = rules.questions.length;
  const items = [];
  for (let i = 0; i < total; i++) {
    const q = rules.questions.find((x) => x.id === ids[i]);
    const isDone = done || i < current;
    const isCurrent = !done && i === current;
    const stav = isDone ? ` – ${T.hotovo}` : isCurrent ? ` – ${T.praveTady}` : '';
    items.push(h('li', { class: isDone ? 'done' : isCurrent ? 'current' : null, 'aria-current': isCurrent ? 'step' : null },
      h('span', { class: 'sr-only', text: `${i + 1}. ${q ? fill(q.title, vars) : ''}${stav}` })));
  }
  return h('div', { class: 'bar-progress' },
    h('p', { class: 'bar-label' },
      h('span', { text: done ? T.hotovoVse : fill(rules.ui.progress, { current: current + 1, total }) }),
      h('span', { class: 'muted', text: T.neposilame })),
    h('ol', { class: 'bar-steps', 'aria-label': T.kroky, 'aria-hidden': done ? 'true' : null }, items));
}

/** Shrnutí už zodpovězených otázek (.done-steps). */
function hotoveKroky(ids, upTo) {
  const polozky = ids.slice(0, upTo).map((id, i) => {
    const q = rules.questions.find((x) => x.id === id);
    return h('li', {}, ikona('ikona-zaskrtnuti', sprite), `${i + 1}. ${textOdpovedi(q, answers[id], rules)}`);
  });
  return polozky.length ? h('ul', { class: 'done-steps', 'aria-label': T.vyplneno }, polozky) : null;
}

/* ---------- Dotazník ---------- */

function optionsFor(q) {
  if (q.type === 'yesno') return [{ id: 'yes', label: rules.ui.yes }, { id: 'no', label: rules.ui.no }];
  return rules[q.optionsFrom];
}

function currentValue(q) {
  const v = answers[q.id];
  if (q.type === 'yesno') return v === undefined ? undefined : v ? 'yes' : 'no';
  return v;
}

function renderQuestion({ fokus = true } = {}) {
  const ids = visibleQuestions(answers, rules);
  const q = rules.questions.find((x) => x.id === ids[step]);
  const name = `q-${q.id}`;
  const title = fill(q.title, vars);
  const helpId = `${name}-napoveda`;
  const errId = `${name}-chyba`;
  const value = currentValue(q);

  const errText = h('span', { class: 'error-text' });
  const error = h('p', { class: 'error-msg', id: errId, hidden: true },
    ikona('ikona-vystraha', sprite), h('span', {}, h('span', { class: 'sr-only', text: T.chyba }), errText));

  let control;
  if (q.type === 'number') {
    control = h('div', { class: 'field eet-cislo' },
      h('label', { class: 'sr-only', for: name, text: title }),
      h('div', { class: 'input' },
        h('input', {
          id: name, name, type: 'text', inputmode: 'numeric', autocomplete: 'off',
          'aria-describedby': `${helpId} ${errId}`, value: value ?? '',
        }),
        q.unit ? h('span', { class: 'unit', 'aria-hidden': 'true', text: q.unit }) : null));
  } else {
    const type = q.type === 'multi' ? 'checkbox' : 'radio';
    control = h('ul', { class: 'options' }, optionsFor(q).map((o) => {
      const id = `${name}-${o.id}`;
      const checked = q.type === 'multi' ? (value ?? []).includes(o.id) : value === o.id;
      return h('li', { class: 'opt' },
        h('input', { type, id, name, value: o.id, checked }),
        h('label', { for: id }, h('span', { class: 'box' }, ikona('ikona-zaskrtnuti', sprite)), o.label));
    }));
  }

  const heading = h('h2', { class: 'quiz-q', id: `${name}-nadpis`, tabindex: '-1', text: title });
  const form = h('form', {
    class: 'quiz', novalidate: true,
    onsubmit: (e) => { e.preventDefault(); next(q, form, error, errText); },
  },
  h('fieldset', { 'aria-describedby': `${helpId} ${errId}` },
    h('legend', {}, heading),
    h('p', { class: 'hint', id: helpId, text: q.help }),
    control,
    error),
  h('div', { class: 'quiz-actions' },
    step > 0 ? h('button', { class: 'btn btn-ghost', type: 'button', onclick: back },
      ikona('ikona-sipka-zpet', sprite), rules.ui.back) : null,
    h('button', { class: 'btn btn-primary', type: 'submit' }, rules.ui.next, ikona('ikona-sipka', sprite))));

  put(app, h('section', { class: 'eet-krok', 'aria-labelledby': heading.id },
    krokovac(ids, step),
    hotoveKroky(ids, step),
    form));
  if (fokus) focusHeading(heading);
}

function readAnswer(q, form) {
  const name = `q-${q.id}`;
  if (q.type === 'multi') {
    const vals = [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((i) => i.value);
    return vals.length ? { ok: true, value: vals } : { ok: false, msg: rules.ui.validationMulti };
  }
  if (q.type === 'number') {
    const raw = form.querySelector(`#${name}`).value.replace(/\s/g, '');
    const n = Number(raw);
    if (raw === '' || !Number.isInteger(n) || n < q.min) {
      return { ok: false, msg: fill(rules.ui.validationNumber, { min: q.min }) };
    }
    return { ok: true, value: n };
  }
  const checked = form.querySelector(`input[name="${name}"]:checked`);
  if (!checked) return { ok: false, msg: rules.ui.validationMulti };
  return { ok: true, value: q.type === 'yesno' ? checked.value === 'yes' : checked.value };
}

function next(q, form, error, errText) {
  const a = readAnswer(q, form);
  const inputs = [...form.querySelectorAll('input')];
  if (!a.ok) {
    errText.textContent = a.msg;
    error.hidden = false;
    form.classList.add('is-error');
    form.querySelector('.field')?.classList.add('is-error');
    for (const i of inputs) i.setAttribute('aria-invalid', 'true');
    inputs[0]?.focus();
    return;
  }
  answers[q.id] = a.value;
  const ids = visibleQuestions(answers, rules);
  if (step + 1 < ids.length) {
    step += 1;
    renderQuestion();
  } else {
    renderResult();
  }
}

function back() {
  if (step === 0) return;
  step -= 1;
  renderQuestion();
}

/* ---------- Výsledek ---------- */

function renderResult() {
  const m = modelEet(answers, rules);
  const ids = visibleQuestions(answers, rules);
  const obsah = html(h('div', { class: 'eet-vysledek-obsah' }),
    vysledekEetHtml(m, rules, { sprite })
    + (m.r.eetOff?.eligible ? kalkulackaHtml(m.r, rules, { sprite, idPrefix: 'kalk' }) : '')
    + seznamHtml(m, rules, { sprite, idPrefix: 'ukol' }));

  put(app, h('section', { class: 'eet-hotovo', 'aria-label': T.dotaznik },
    krokovac(ids, ids.length, { done: true }),
    obsah,
    h('div', { class: 'form-actions eet-akce' },
      h('button', {
        class: 'btn btn-ghost', type: 'button',
        onclick: () => { step = visibleQuestions(answers, rules).length - 1; renderQuestion(); },
      }, ikona('ikona-sipka-zpet', sprite), rules.ui.back),
      h('button', {
        class: 'btn btn-ghost', type: 'button',
        onclick: () => { answers = {}; step = 0; renderQuestion(); },
      }, rules.ui.restart),
      h('button', { class: 'btn btn-primary', type: 'button', onclick: () => window.print() }, rules.ui.print))));

  if (m.r.eetOff?.eligible) renderCalc(obsah.querySelector('[data-kalkulacka]'), m.r);
  focusHeading($('vysledek-nadpis'));
}

/* ---------- Kalkulačka EET OFF ---------- */

function renderCalc(sec, result) {
  if (!sec) return;
  const pole = sec.querySelector('[data-kalk-vlastni]');
  const costInput = pole.querySelector('input');
  const tabulka = sec.querySelector('[data-kalk-tabulka]');
  const veta = sec.querySelector('[data-kalk-veta]');

  const update = () => {
    const mode = sec.querySelector('input[type="radio"]:checked')?.value;
    const useMojeEet = mode === 'moje';
    pole.hidden = useMojeEet;
    const raw = costInput.value.replace(/\s/g, '');
    const own = raw === '' ? null : Number(raw);
    const k = modelKalkulacky(result, rules, { useMojeEet, ownCostAnnual: Number.isFinite(own) ? own : null });
    html(tabulka, kalkulackaTabulkaHtml(k));
    put(veta, h('strong', { text: k.veta }));
  };
  sec.addEventListener('change', update);
  costInput.addEventListener('input', update);
  update();
}

/* ---------- Start ---------- */

$('eet-bez-js')?.remove();
renderQuestion({ fokus: false });
