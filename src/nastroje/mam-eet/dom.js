// Sdílené pomocníky pro tvorbu DOM (obě záložky). Text se vkládá vždy přes textContent.

const SVG = 'http://www.w3.org/2000/svg';

/** Malý pomocník pro tvorbu prvků. Text vždy přes textContent. */
export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === false || v === null || v === undefined) continue;
    if (k === 'class') el.className = v;
    else if (k === 'text') el.textContent = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (v === true) el.setAttribute(k, '');
    else el.setAttribute(k, v);
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    el.append(typeof c === 'string' ? document.createTextNode(c) : c);
  }
  return el;
}

/** Vymění obsah prvku; pole zploští a vynechá prázdné položky. */
export function put(el, ...children) {
  el.replaceChildren(...children.flat(Infinity).filter((c) => c !== null && c !== undefined && c !== false));
}

/** Prvek SVG (graf). */
export function s(tag, attrs = {}, text) {
  const el = document.createElementNS(SVG, tag);
  for (const [key, v] of Object.entries(attrs)) if (v !== null && v !== undefined) el.setAttribute(key, String(v));
  if (text !== undefined) el.textContent = text;
  return el;
}

/** Ikona ze spritu (sprite = URL souboru sprite.svg z data-sprite stránky). */
export function ikona(id, sprite) {
  const svg = s('svg', { class: 'ikona', 'aria-hidden': 'true', focusable: 'false' });
  svg.append(s('use', { href: `${sprite}#${id}` }));
  return svg;
}

/** Odkaz na zdroj ve stylu varianty B (Zdroj: <a>…</a>). */
export function sourceLink(source, label, sprite) {
  return h('span', { class: 'src' },
    sprite ? ikona('ikona-odkaz', sprite) : null,
    `${label}: `,
    h('a', { href: source.url, text: source.title }));
}

/** Vloží HTML řetězec z vystup.js (texty jsou v něm už escapované). */
export function html(el, kod) {
  el.innerHTML = kod;
  return el;
}
