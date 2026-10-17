/* systems/wifi/view-context.js — "where am I": breadcrumb and context strips.
 *
 * Above the main view, one thin strip per level already entered (PPDU, Data field,
 * OFDM symbol). Each strip marks where the next level sits inside it ("you are here")
 * and a funnel connects that mark to the full width of what is below.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;
  const N = () => root.WifiNav;

  const W = 800, X0 = 96, X1 = 786, SH = 30;
  const LABEL = { ppdu: 'PPDU', data: 'Data field', symbol: 'Symbol', subcarrier: 'Subcarrier' };

  /** Breadcrumb "PPDU › Data field › Symbol 19 › Subcarrier +11", each part clickable; Time | Spectrum at the symbol level. */
  V.breadcrumb = function (a, nav, cb) {
    const parts = [];
    const depth = N().depth(nav.level);
    N().LEVELS.forEach((lv, i) => {
      if (i > depth) return;
      if (i) parts.push(h('span', { class: 'sep', 'aria-hidden': 'true' }, '›'));
      const text = lv === 'symbol' ? `Symbol ${nav.sym}` : lv === 'subcarrier' ? `Subcarrier ${V.signed(nav.sc, 0)}` : LABEL[lv];
      parts.push(h('button', { type: 'button', 'aria-current': lv === nav.level ? 'location' : null, onclick: () => cb.onLevel(lv) }, text));
    });
    const toggle = nav.level === 'symbol'
      ? h('div', { class: 'seg', role: 'group', 'aria-label': 'View of the OFDM symbol' },
        h('button', { type: 'button', 'aria-pressed': String(nav.view === 'time'), onclick: () => cb.onView('time') }, 'Time'),
        h('button', { type: 'button', 'aria-pressed': String(nav.view === 'spectrum'), onclick: () => cb.onView('spectrum') }, 'Spectrum'))
      : null;
    const hint = { ppdu: 'click the Data field or a symbol to zoom in', data: 'click a symbol to zoom in', symbol: nav.view === 'time' ? 'Time: the waveform · Spectrum: its subcarriers' : 'the same symbol, seen as its subcarriers', subcarrier: '' }[nav.level];
    return h('nav', { class: 'crumbs', 'aria-label': 'You are here' }, ...parts, toggle,
      h('span', { class: 'muted small' }, hint ? '  ' + hint + ' · ← → step · Esc zoom out' : ''));
  };

  /** One strip per level above the current one. cb: { onLevel(level), onSymbol(i), onSubcarrier(k) } */
  V.contextStrips = function (a, nav, cb) {
    const depth = N().depth(nav.level);
    const wrap = h('div', { class: 'ctx-strips' });
    if (depth < 1) return wrap;
    const tl = a.timeline, total = tl.txtime_ns, data = tl.items.find((it) => it.kind === 'data');
    const tx = (ns) => X0 + (ns / total) * (X1 - X0);

    /* ---- PPDU strip ---- */
    {
      const svg = strip('PPDU', `${V.us(total)} µs`, () => cb.onLevel('ppdu'));
      for (const it of tl.items) {
        const x = tx(it.start_ns), w = Math.max(0.8, tx(it.start_ns + it.dur_ns) - x);
        svg.append(s('rect', { x, y: 4, width: w, height: SH - 8, fill: it.kind === 'gap' ? '#334155' : V.FIELD[it.kind], opacity: 0.85 }, s('title', null, `${it.name} ${V.us(it.dur_ns)} µs`)));
        if (w > it.name.length * 6.5 + 6) svg.append(s('text', { x: x + w / 2, y: SH / 2 + 4, 'text-anchor': 'middle', class: 'small', fill: '#04131c', 'font-weight': 600 }, it.name));
      }
      const r = [tx(data.start_ns), tx(data.start_ns + data.dur_ns)];
      if (depth >= 2) { // the current symbol inside the Data field
        const m0 = tx(data.start_ns + (nav.sym - 1) * data.each_ns), m1 = tx(data.start_ns + nav.sym * data.each_ns);
        svg.append(s('rect', { x: m0, y: 2, width: Math.max(2, m1 - m0), height: SH - 4, fill: '#ffffff', opacity: 0.85 }));
      }
      here(svg, r[0], r[1]);
      wrap.append(svg.parentNode, funnel(r[0], r[1], depth >= 2));
    }
    /* ---- Data-field strip ---- */
    if (depth >= 2) {
      const n = a.symbols.N_SYM;
      const svg = strip('Data field', `${n} symbols`, () => cb.onLevel('data'));
      const sx = (i) => X0 + ((i - 1) / n) * (X1 - X0), sw = (X1 - X0) / n;
      if (n <= 600) for (let i = 1; i <= n; i++) {
        const t = s('rect', { x: sx(i) + (sw > 3 ? 0.5 : 0), y: 6, width: Math.max(0.6, sw - (sw > 3 ? 1 : 0)), height: SH - 12, fill: V.FIELD.data, opacity: 0.8, 'data-sym': i },
          s('title', null, `symbol ${i}`));
        svg.append(t);
      } else svg.append(s('rect', { x: X0, y: 6, width: X1 - X0, height: SH - 12, fill: V.FIELD.data, opacity: 0.8 }));
      svg.addEventListener('click', (ev) => {
        const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * W;
        ev.stopPropagation();
        if (x < X0) { cb.onLevel('data'); return; }
        cb.onSymbol(Math.min(n, Math.max(1, Math.floor((x - X0) / sw) + 1)));
      }, true);
      const m0 = sx(nav.sym), m1 = Math.max(m0 + 4, sx(nav.sym + 1));
      here(svg, m0, m1);
      wrap.append(svg.parentNode, funnel(m0, m1, depth >= 3));
    }
    /* ---- symbol strip (spectrum), when a subcarrier is entered ---- */
    if (depth >= 3) {
      const t = a.dataTones, fft = t.fft;
      const svg = strip(`Symbol ${nav.sym}`, `${fft} subcarriers`, () => cb.onLevel('symbol'));
      const kx = (k) => X0 + ((k + fft / 2) / fft) * (X1 - X0), kw = (X1 - X0) / fft;
      for (const r of V.runs(t.tones)) {
        const hgt = r.kind === 'data' ? SH - 12 : r.kind === 'pilot' ? SH - 8 : 5;
        svg.append(s('rect', { x: kx(r.from), y: SH - 4 - hgt, width: Math.max(0.8, (r.to - r.from + 1) * kw), height: hgt, fill: V.KIND[r.kind].color, opacity: 0.85 }));
      }
      svg.addEventListener('click', (ev) => {
        const r = svg.getBoundingClientRect(), x = ((ev.clientX - r.left) / r.width) * W;
        ev.stopPropagation();
        if (x < X0) { cb.onLevel('symbol'); return; }
        cb.onSubcarrier(Math.round((x - X0) / kw - fft / 2));
      }, true);
      const m0 = kx(nav.sc), m1 = Math.max(m0 + 4, kx(nav.sc + 1));
      here(svg, m0, m1);
      wrap.append(svg.parentNode, funnel(m0, m1, false));
    }
    return wrap;
  };

  /** A strip: label on the left, drawing area X0…X1; clicking it jumps to that level. */
  function strip(label, sub, onClick) {
    const svg = s('svg', { class: 'diagram ctx', viewBox: `0 0 ${W} ${SH}`, role: 'img', 'aria-label': `${label} (${sub}); click to go to this level` },
      s('text', { x: 4, y: 13, 'font-weight': 600 }, label), s('text', { x: 4, y: 26, class: 'muted small' }, sub));
    const box = h('button', { type: 'button', class: 'ctx-strip', title: `Back to: ${label}`, onclick: onClick }, svg);
    return svg;
  }
  /** "You are here" rectangle. */
  function here(svg, x0, x1) {
    svg.append(s('rect', { x: x0 - 2, y: 1, width: x1 - x0 + 4, height: SH - 2, rx: 3, fill: 'none', stroke: '#fbbf24', 'stroke-width': 2 }));
  }
  /** Funnel from the marked rectangle down to what comes next: the drawing area of the next strip, or the full main view. */
  function funnel(x0, x1, toStrip) {
    const FH = 16, b0 = toStrip ? X0 : 0, b1 = toStrip ? X1 : W;
    return s('svg', { class: 'diagram ctx-funnel', viewBox: `0 0 ${W} ${FH}`, 'aria-hidden': 'true', preserveAspectRatio: 'none' },
      s('path', { d: `M${x0 - 2},0 L${x1 + 2},0 L${b1},${FH} L${b0},${FH} Z`, fill: '#fbbf24', opacity: 0.1 }),
      s('path', { d: `M${x0 - 2},0 L${b0},${FH} M${x1 + 2},0 L${b1},${FH}`, stroke: '#fbbf24', 'stroke-width': 1.2, opacity: 0.8, fill: 'none', 'vector-effect': 'non-scaling-stroke' }));
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
