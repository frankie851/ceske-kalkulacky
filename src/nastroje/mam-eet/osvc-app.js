// UI záložky „OSVČ 2027“ (paušální daň, přiznání, nebo EET OFF?).
// Výpočty jsou v osvc.js, čísla a texty v rules.json, HTML výsledku sdílí s buildem vystup.js.
// Formulář vykreslí šablona s výchozími hodnotami; tento skript z něj čte stav a přepočítává.
// Zadané hodnoty drží jen proměnná `state` v paměti stránky: nic se neukládá ani neodesílá.

import { fill, formatCzk } from './rules.js';
import { compare, series, chartIncomes, breakEven, osvcVars, formatPercent } from './osvc.js';
import { h, put, s, html } from './dom.js';
import { modelOsvc, vysledekOsvcHtml, prvniPlatba } from './vystup.js';
import { prectiCislo } from '../../js/cislo-vstup.js';

const $ = (id) => document.getElementById(id);

const rules = JSON.parse($('pravidla').textContent);
const o = rules.osvc2027;
const tx = o.texts;
const vars = osvcVars(rules);
const sprite = $('osvc').dataset.sprite;
const form = $('osvc-form');
let resizeObserver;
let lastResult = null;

const k = (n) => formatCzk(Math.round(n), rules);
const byId = (list, id) => list.find((x) => x.id === id);
const radio = (name) => form.querySelector(`input[name="${name}"]:checked`)?.value;

/* ---------- Stav formuláře ---------- */

function parseInt0(raw) {
  const n = prectiCislo(raw, { zaporne: false });
  if (n === null) return null;
  return Number.isInteger(n) ? n : NaN;
}

function readState() {
  const children = parseInt0($('osvc-children').value);
  return {
    income: parseInt0($('osvc-income').value),
    flatRateId: $('osvc-flat').value,
    expenseMode: radio('osvc-exp') ?? 'flat',
    actualExpenses: parseInt0($('osvc-actual').value),
    vatPayer: radio('osvc-vat') === 'yes',
    children: children === null ? 0 : children,
    activityId: radio('osvc-activity') ?? o.activities[0].id,
    contactPayments: radio('osvc-contact') !== 'no',
  };
}

/** Ověří vstup. Vrací { input } nebo { error, field }. */
function readInput(state) {
  const minIncome = o.chart.min > 0 ? 1 : 0;
  if (!Number.isInteger(state.income) || state.income < minIncome) {
    return { error: fill(tx.validationIncome, { min: minIncome }), field: 'osvc-income' };
  }
  if (state.expenseMode === 'actual' && (!Number.isInteger(state.actualExpenses) || state.actualExpenses < 0)) {
    return { error: tx.validationActual, field: 'osvc-actual' };
  }
  if (!Number.isInteger(state.children) || state.children < 0) {
    return { error: tx.validationChildren, field: 'osvc-children' };
  }
  return {
    input: {
      income: state.income,
      flatRateId: state.flatRateId,
      actualExpenses: state.expenseMode === 'actual' ? state.actualExpenses : null,
      vatPayer: state.vatPayer,
      children: state.children,
      activityId: state.activityId,
      contactPayments: state.contactPayments,
    },
  };
}

/** Chyba u pole (makro pole s chybaMisto: .error-msg, .is-error, aria-invalid). */
function setError(id, msg) {
  const input = $(id);
  const box = $(`${id}-chyba`);
  const field = input?.closest('.field');
  if (!input || !box) return;
  box.hidden = !msg;
  box.querySelector('.error-text').textContent = msg ?? '';
  field.classList.toggle('is-error', Boolean(msg));
  if (msg) input.setAttribute('aria-invalid', 'true');
  else input.removeAttribute('aria-invalid');
}

/**
 * Neplatné zadání: výsledek, graf, lištu a částku zálohy skryje (patřily by ke starému číslu)
 * a ukáže upozornění. Po opravě je update() znovu vykreslí.
 */
function showInvalid(invalid) {
  const box = $('osvc-neplatne');
  const was = box ? !box.hidden : false;
  if (box) box.hidden = !invalid;
  $('osvc-vysledek').hidden = invalid;
  $('osvc-graf').hidden = invalid;
  const lista = document.querySelector('.lepiva-lista');
  if (lista) lista.hidden = invalid;
  if (invalid) {
    const fp = $('osvc-first-payment');
    if (fp) fp.hidden = true;
    if (!was) $('osvc-hlaseni').textContent = tx.invalidResult;
  }
}

function update({ submitted = false } = {}) {
  const state = readState();
  $('osvc-actual-pole').hidden = state.expenseMode !== 'actual';
  const r = readInput(state);
  for (const id of ['osvc-income', 'osvc-actual', 'osvc-children']) setError(id, r.field === id ? r.error : null);
  showInvalid(Boolean(r.error));
  if (r.error) {
    lastResult = null;
    if (submitted) $(r.field)?.focus();
    return;
  }
  const result = compare(r.input, rules);
  lastResult = { input: r.input, result };
  renderResult(r.input);
  renderChart(r.input);
  renderFirstPayment(result);
  if (submitted) $('osvc-vysledek-nadpis')?.focus();
}

/* ---------- Výsledek ---------- */

function renderResult(input) {
  const m = modelOsvc(input, rules);
  html($('osvc-vysledek'), vysledekOsvcHtml(m, rules, { sprite }));
  $('osvc-vysledek-nadpis').setAttribute('tabindex', '-1');
  $('osvc-hlaseni').textContent = m.res.summary;
  const lista = document.querySelector('[data-lista-cislo]');
  if (lista) lista.textContent = m.cislo;
  const popis = document.querySelector('[data-lista-popis]');
  if (popis) popis.textContent = m.lista;
}

/* ---------- Graf ---------- */

const compact = new Intl.NumberFormat('cs-CZ', { notation: 'compact', maximumFractionDigits: 1 });

const SERIES = [
  { key: 'classic', cls: 'graf-rada-1', label: () => tx.chartLegendClassic },
  { key: 'flat', cls: 'graf-rada-2', label: () => tx.chartLegendFlat },
  { key: 'eetOff', cls: 'graf-rada-3', label: () => tx.chartLegendEetOff },
];

function niceStep(maxY) {
  const ch = o.chart;
  return ch.yTickSteps.find((st) => maxY / st <= ch.yTickTarget) ?? ch.yTickSteps.at(-1);
}

function linePath(pts, key, x, y) {
  let d = '';
  let pen = false;
  for (const p of pts) {
    if (p[key] === null) { pen = false; continue; }
    d += `${pen ? 'L' : 'M'}${x(p.income).toFixed(1)},${y(p[key]).toFixed(1)}`;
    pen = true;
  }
  return d;
}

function renderChart(input) {
  const section = $('osvc-graf');
  const chartInput = { ...input, actualExpenses: null };
  const pts = series(chartInput, rules, chartIncomes(chartInput, rules));
  const be = breakEven(chartInput, rules);
  const fr = byId(o.expenseFlatRates, input.flatRateId);
  const activity = byId(o.activities, input.activityId);
  const rate = formatPercent(fr.rate);
  const present = SERIES.filter((sr) => pts.some((p) => p[sr.key] !== null));

  const plot = h('div', { class: 'osvc-plot', tabindex: '0', role: 'group', 'aria-label': tx.chartHelp });
  const tooltip = h('div', { class: 'osvc-tooltip', hidden: true, role: 'status' });
  plot.append(tooltip);

  const beText = be.length
    ? be.map((b) => fill(tx.chartBreakEven, {
      income: k(b.income),
      cheaper: b.cheaper === 'flat' ? tx.cheaperFlat : tx.cheaperClassic,
    })).join(' ')
    : tx.chartBreakEvenNone;

  const step = o.chart.tableStep;
  const tableRows = pts.filter((p) => p.income % step === 0);

  put(section,
    h('h2', { id: 'osvc-graf-nadpis', text: tx.chartTitle }),
    h('p', { class: 'muted small', id: 'osvc-graf-popis', text: fill(tx.chartDesc, { ...vars, rate, children: input.children, activity: activity.label.toLowerCase() }) }),
    h('ul', { class: 'graf-legenda' }, SERIES.map((sr) => h('li', {},
      h('span', { class: `graf-vzorek graf-vzorek-cara ${sr.cls}`, 'aria-hidden': 'true' }),
      present.includes(sr) ? sr.label() : `${sr.label()} (${tx.chartUnavailable})`))),
    plot,
    h('p', { class: 'graf-souhrn', text: beText }),
    input.actualExpenses !== null ? h('p', { class: 'note', text: fill(tx.noteActualChart, { rate }) }) : null,
    h('p', { class: 'hint', text: tx.chartHelp }),
    h('details', { class: 'osvc-tabulka-grafu' },
      h('summary', { text: tx.chartTableSummary }),
      h('div', { class: 'table-wrap', role: 'region', tabindex: '0', 'aria-label': tx.chartTableSummary },
        h('table', {},
          h('caption', { class: 'sr-only', text: tx.chartTitle }),
          h('thead', {}, h('tr', {},
            h('th', { scope: 'col', text: tx.colIncome }),
            SERIES.map((sr) => h('th', { scope: 'col', class: 'r', text: sr.label() })))),
          h('tbody', {}, tableRows.map((p) => h('tr', {},
            h('th', { scope: 'row', text: k(p.income) }),
            SERIES.map((sr) => h('td', { class: 'r', text: p[sr.key] === null ? '—' : k(p[sr.key]) })))))))),
  );

  const draw = () => drawSvg(plot, tooltip, pts, be, input, present);
  draw();
  resizeObserver?.disconnect();
  let lastWidth = plot.clientWidth;
  resizeObserver = new ResizeObserver(() => {
    if (plot.clientWidth !== lastWidth) { lastWidth = plot.clientWidth; draw(); }
  });
  resizeObserver.observe(plot);
}

function drawSvg(plot, tooltip, pts, be, input, present) {
  const L = o.chart.layout;
  const ch = o.chart;
  plot.querySelector('svg')?.remove();
  const width = plot.clientWidth || L.minWidth;
  const height = width < L.narrowWidth ? L.heightNarrow : L.height;
  const left = L.marginLeft;
  const narrow = width < L.narrowWidth;
  const right = width - (narrow ? L.marginRightNarrow : L.marginRight);
  const top = L.marginTop;
  const bottom = height - L.marginBottom;

  const maxVal = Math.max(...pts.flatMap((p) => present.map((sr) => p[sr.key] ?? 0)));
  const yStep = niceStep(maxVal);
  const yMax = Math.ceil(maxVal / yStep) * yStep;
  const x = (v) => left + ((v - ch.min) / (ch.max - ch.min)) * (right - left);
  const y = (v) => bottom - (v / yMax) * (bottom - top);

  const svg = s('svg', {
    width, height, viewBox: `0 0 ${width} ${height}`, role: 'img',
    'aria-labelledby': 'osvc-graf-nadpis osvc-graf-popis', class: 'osvc-svg',
  });

  // Mřížka a osa Y
  for (let v = 0; v <= yMax; v += yStep) {
    svg.append(s('line', { x1: left, x2: right, y1: y(v), y2: y(v), class: v === 0 ? 'graf-osa' : 'graf-mrizka' }));
    svg.append(s('text', { x: left - L.tickLength, y: y(v), class: 'graf-popisek', 'text-anchor': 'end', 'dominant-baseline': 'middle' },
      compact.format(v)));
  }
  // Osa X
  const xTicks = [ch.min];
  for (let v = ch.tickStep; v <= ch.max; v += ch.tickStep) xTicks.push(v);
  let lastLabelX = -Infinity;
  for (const v of [...xTicks].reverse()) {
    svg.append(s('line', { x1: x(v), x2: x(v), y1: bottom, y2: bottom + L.tickLength, class: 'graf-osa' }));
    if (Math.abs(lastLabelX - x(v)) < L.minTickSpacing) continue;
    lastLabelX = x(v);
    const anchor = v === ch.max && narrow ? 'end' : 'middle';
    svg.append(s('text', { x: x(v), y: bottom + L.tickLength * 2, class: 'graf-popisek', 'text-anchor': anchor, 'dominant-baseline': 'hanging' },
      compact.format(v)));
  }

  // Ty (zadané příjmy)
  if (input.income >= ch.min && input.income <= ch.max) {
    svg.append(s('line', { x1: x(input.income), x2: x(input.income), y1: top, y2: bottom, class: 'osvc-ty' }));
    svg.append(s('text', { x: x(input.income), y: top - L.tickLength, class: 'graf-popisek-osy', 'text-anchor': 'middle' }, tx.chartYou));
  }

  // Čáry
  for (const sr of present) {
    const g = s('g', { class: sr.cls });
    g.append(s('path', { d: linePath(pts, sr.key, x, y), class: 'graf-cara' }));
    svg.append(g);
  }

  // Body zlomu
  for (const b of be) {
    svg.append(s('circle', { cx: x(b.income), cy: y(b.classic), r: L.markerRadius, class: 'osvc-zlom' }));
  }

  // Přímé popisky na konci čar (s posunem, aby se nepřekrývaly)
  // Na úzkém displeji jsou popisky nad koncem čáry (zarovnané doprava), jinak vpravo od ní.
  const labels = present.map((sr) => {
    const last = [...pts].reverse().find((p) => p[sr.key] !== null);
    return { sr, x: x(last.income), y: y(last[sr.key]) - (narrow ? L.labelLift : 0) };
  }).sort((a, b) => a.y - b.y);
  for (let i = 1; i < labels.length; i++) {
    if (labels[i].y - labels[i - 1].y < L.labelGap) labels[i].y = labels[i - 1].y + L.labelGap;
  }
  for (const lb of labels) {
    svg.append(s('text', {
      x: narrow ? lb.x : lb.x + L.tickLength, y: lb.y, class: 'graf-hodnota',
      'text-anchor': narrow ? 'end' : 'start', 'dominant-baseline': narrow ? 'auto' : 'middle',
    }, lb.sr.label()));
  }

  // Hover / klávesnice: zaměřovač a tooltip
  const cross = s('line', { y1: top, y2: bottom, class: 'osvc-zamerovac', visibility: 'hidden' });
  const dots = present.map((sr) => s('circle', { r: L.markerRadius, class: `graf-bod ${sr.cls}`, visibility: 'hidden' }));
  svg.append(cross, ...dots);
  // Myš a dotyk na průhledném obdélníku, klávesnice na obalu grafu (role group, šipky)
  const overlay = s('rect', { x: left, y: top, width: right - left, height: bottom - top, class: 'osvc-overlay' });
  svg.append(overlay);

  let idx = -1;
  const show = (i) => {
    idx = Math.max(0, Math.min(pts.length - 1, i));
    const p = pts[idx];
    const px = x(p.income);
    cross.setAttribute('x1', px); cross.setAttribute('x2', px); cross.setAttribute('visibility', 'visible');
    present.forEach((sr, j) => {
      if (p[sr.key] === null) { dots[j].setAttribute('visibility', 'hidden'); return; }
      dots[j].setAttribute('cx', px); dots[j].setAttribute('cy', y(p[sr.key])); dots[j].setAttribute('visibility', 'visible');
    });
    put(tooltip,
      h('p', { class: 'osvc-tooltip-hlava', text: fill(tx.chartTooltipIncome, { income: k(p.income) }) }),
      present.map((sr) => h('p', { class: 'osvc-tooltip-radek' },
        h('span', { class: `graf-vzorek graf-vzorek-cara ${sr.cls}`, 'aria-hidden': 'true' }),
        h('strong', { text: p[sr.key] === null ? '—' : k(p[sr.key]) }),
        ` ${sr.label()}`)));
    tooltip.hidden = false;
    const tw = tooltip.offsetWidth;
    const flip = px + L.tooltipOffset + tw > width;
    const want = flip ? px - L.tooltipOffset - tw : px + L.tooltipOffset;
    tooltip.style.left = `${Math.max(0, Math.min(width - tw, want))}px`;
    tooltip.style.top = `${top}px`;
  };
  const hide = () => {
    cross.setAttribute('visibility', 'hidden');
    dots.forEach((d) => d.setAttribute('visibility', 'hidden'));
    tooltip.hidden = true;
  };
  const nearest = (clientX) => {
    const rect = svg.getBoundingClientRect();
    const v = ch.min + ((clientX - rect.left - left) / (right - left)) * (ch.max - ch.min);
    let best = 0;
    for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i].income - v) < Math.abs(pts[best].income - v)) best = i;
    return best;
  };
  overlay.addEventListener('pointermove', (e) => show(nearest(e.clientX)));
  overlay.addEventListener('pointerdown', (e) => show(nearest(e.clientX)));
  overlay.addEventListener('pointerleave', hide);
  // Obal grafu se nepřekresluje, proto obsluhy jako vlastnosti (při překreslení se nahradí)
  plot.onblur = hide;
  plot.onfocus = () => show(nearest(svg.getBoundingClientRect().left + x(input.income)));
  plot.onkeydown = (e) => {
    const jump = Math.max(1, Math.round(pts.length / (ch.max / ch.tableStep)));
    if (e.key === 'ArrowRight') { e.preventDefault(); show(idx + jump); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); show(idx - jump); }
    if (e.key === 'Escape') hide();
  };

  plot.prepend(svg);
}

/* ---------- Termíny ---------- */

function renderFirstPayment(result) {
  const el = $('osvc-first-payment');
  if (!el) return;
  const text = prvniPlatba(result, rules);
  put(el, text ? h('strong', { text }) : null);
  el.hidden = !text;
}

/* ---------- Start ---------- */

form.addEventListener('input', () => update());
form.addEventListener('change', () => update());
form.addEventListener('submit', (e) => { e.preventDefault(); update({ submitted: true }); });
for (const el of document.querySelectorAll('.osvc-bez-js')) el.remove();
update();
