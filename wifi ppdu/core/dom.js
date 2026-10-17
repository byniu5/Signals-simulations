/* core/dom.js — tiny helpers to build HTML and SVG without a framework. */
(function (root) {
  'use strict';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  function setAttrs(el, attrs) {
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'text') el.textContent = v;
      else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : String(v));
    }
    return el;
  }
  function append(el, children) {
    for (const c of children.flat(Infinity)) {
      if (c === null || c === undefined || c === false) continue;
      el.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
    }
    return el;
  }
  /** h('div', {class: 'x'}, child, ...) */
  const h = (tag, attrs, ...children) => append(setAttrs(document.createElement(tag), attrs), children);
  /** s('rect', {x: 0}) — SVG element */
  const s = (tag, attrs, ...children) => append(setAttrs(document.createElementNS(SVG_NS, tag), attrs), children);

  /** Format a number with at most `d` decimals, no trailing zeros. */
  function fmt(x, d = 2) {
    if (typeof x !== 'number' || !isFinite(x)) return String(x);
    return x.toLocaleString('en-US', { maximumFractionDigits: d });
  }

  /** Split a symbol name like "N_DBPS" or "Δ_F" into base and subscript. */
  function splitSymbol(name) {
    const i = name.indexOf('_');
    return i > 0 && !/\s/.test(name) ? [name.slice(0, i), name.slice(i + 1)] : [name, ''];
  }
  /** HTML rendering of a symbol: N<sub>DBPS</sub>. */
  function sym(name) {
    const [base, sub] = splitSymbol(name);
    return sub ? h('span', { class: 'sym' }, base, h('sub', null, sub)) : h('span', null, base);
  }
  /** SVG <text> children for a symbol, with the subscript lowered. */
  function svgSym(name) {
    const [base, sub] = splitSymbol(name);
    if (!sub) return [base];
    return [base, s('tspan', { dy: 3, 'font-size': '0.75em' }, sub), s('tspan', { dy: -3 }, '​')];
  }

  /**
   * A glossary-linked label. Hover / focus shows the tooltip; click opens the
   * glossary at this term. `text` defaults to the term id, rendered as a symbol.
   */
  function term(id, text) {
    return h('span', { class: 'term', 'data-term': id, tabindex: 0, role: 'button' }, text === undefined ? sym(id) : text);
  }

  root.Dom = { h, s, fmt, sym, svgSym, term, SVG_NS };
})(typeof globalThis !== 'undefined' ? globalThis : this);
