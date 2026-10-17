/* systems/wifi/view-datafield.js — the Data-field level: the row of OFDM symbols.
 *
 * Shows every data symbol of the PPDU and which bits each one carries (SERVICE,
 * PSDU / APEP, tail, padding), from WifiCalc's symbol counts — nothing new is
 * computed about the standard here. Clicking a symbol zooms into it.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;

  const W = 800, LEFT = 14, RIGHT = 14, PW = W - LEFT - RIGHT;
  const PART_COLOR = { SERVICE: '#c084fc', PSDU: '#38bdf8', APEP: '#38bdf8', tail: '#fbbf24', pad: '#64748b', 'pre-FEC pad': '#64748b', 'parity only': '#334155' };
  const PART_TERM = { SERVICE: 'SERVICE field', PSDU: 'PSDU', APEP: 'APEP_LENGTH', tail: 'Tail bits', pad: 'Pad bits', 'pre-FEC pad': 'Pre-FEC padding', 'parity only': 'LDPC extra symbol segment' };

  /**
   * Information bits carried by data symbol m (1-based), in transmit order before coding.
   * BCC: every symbol carries N_DBPS bits. HE LDPC: N_DBPS each up to N_SYM,init, whose last
   * symbol holds a_init segments of N_DBPS,short; an extra symbol (LDPC extra symbol segment) only parity.
   */
  V.symbolBits = function (a, m) {
    const sy = a.symbols, p = a.params;
    const payloadName = root.WifiCalc.generation(a.cfg.gen).payloadField.name === 'APEP_LENGTH' ? 'APEP' : 'PSDU';
    let segs, len, start;
    if (sy.coding === 'LDPC') {
      const bitsIn = (k) => (k < sy.N_SYM_init ? p.N_DBPS : k === sy.N_SYM_init ? (sy.a_init < 4 ? sy.a_init * sy.N_DBPS_short : p.N_DBPS) : 0);
      start = 0;
      for (let k = 1; k < m; k++) start += bitsIn(k);
      len = bitsIn(m);
      segs = [['SERVICE', sy.N_service], [payloadName, sy.payloadBits], ['pre-FEC pad', sy.N_PAD_preFEC]];
    } else {
      start = (m - 1) * p.N_DBPS; len = p.N_DBPS;
      segs = [['SERVICE', sy.N_service], [payloadName, sy.payloadBits], ['tail', sy.N_tail], ['pad', sy.N_PAD]];
    }
    const parts = [];
    let at = 0;
    for (const [name, n] of segs) {
      const lo = Math.max(at, start), hi = Math.min(at + n, start + len);
      if (hi > lo) parts.push({ name, bits: hi - lo, from: lo - at, to: hi - at - 1, color: PART_COLOR[name] });
      at += n;
    }
    if (!len) parts.push({ name: 'parity only', bits: 0, color: PART_COLOR['parity only'] });
    return { start, len, parts, coding: sy.coding, payloadName };
  };

  /** opts: { index, onIndex(i), onZoomIn(i, rect) } */
  V.dataField = function (a, opts) {
    const n = a.symbols.N_SYM, idx = Math.min(Math.max(1, opts.index || 1), n);
    const dataItem = a.timeline.items.find((it) => it.kind === 'data');
    const T = dataItem.each_ns;

    /* ---------- overview: all symbols as ticks ---------- */
    const WIN = Math.min(n, 24);
    const w0 = Math.max(1, Math.min(n - WIN + 1, idx - Math.floor(WIN / 2)));
    const ov = s('svg', { class: 'diagram', viewBox: `0 0 ${W} 64`, role: 'img', 'aria-label': `All ${n} data symbols` });
    const X = (i) => LEFT + ((i - 1) / n) * PW, sw = PW / n;
    if (n <= 600) {
      for (let i = 1; i <= n; i++) {
        const main = V.symbolBits(a, i).parts.reduce((b, q) => (q.bits > b.bits ? q : b), { bits: -1 });
        ov.append(s('rect', { x: X(i) + (sw > 3 ? 0.5 : 0), y: 24, width: Math.max(0.6, sw - (sw > 3 ? 1 : 0)), height: 22, fill: main.color, opacity: i === idx ? 1 : 0.75 }));
      }
    } else ov.append(s('rect', { x: LEFT, y: 24, width: PW, height: 22, fill: PART_COLOR.PSDU, opacity: 0.75 }));
    ov.append(s('rect', { x: X(w0) - 1, y: 20, width: WIN * sw + 2, height: 30, fill: 'none', stroke: '#e6eaf2', 'stroke-dasharray': '4 3' }),
      s('rect', { x: X(idx), y: 18, width: Math.max(3, sw), height: 34, fill: 'none', stroke: '#ffffff', 'stroke-width': 2 }),
      s('text', { x: LEFT, y: 10, class: 'muted small' }, `all ${n} symbols · dashed: shown below`),
      s('text', { x: LEFT, y: 62, class: 'muted mono small' }, '1'),
      s('text', { x: W - RIGHT, y: 62, 'text-anchor': 'end', class: 'muted mono small' }, String(n)));
    ov.style.cursor = 'pointer';
    ov.addEventListener('click', (ev) => {
      const r = ov.getBoundingClientRect();
      const i = Math.floor((((ev.clientX - r.left) / r.width) * W - LEFT) / sw) + 1;
      opts.onIndex(Math.min(n, Math.max(1, i)));
    });

    /* ---------- detail: a window of symbols as boxes with their bit composition ---------- */
    const BH = 92, BY = 18;
    const det = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${BY + BH + 34}`, role: 'img', 'aria-label': `Data symbols ${w0} to ${w0 + WIN - 1}` });
    const bw = PW / WIN;
    for (let i = w0; i < w0 + WIN; i++) {
      const x = LEFT + (i - w0) * bw, b = V.symbolBits(a, i), sel = i === idx;
      const g = s('g', { 'data-zoom-symbol': i });
      g.append(s('rect', { x: x + 2, y: BY, width: bw - 4, height: BH, rx: 4, fill: '#0d1422', stroke: sel ? '#ffffff' : '#2b3a57', 'stroke-width': sel ? 2 : 1 }));
      // stacked composition, first bits at the bottom
      let y = BY + BH - 3;
      const total = b.len || 1;
      for (const q of b.parts) {
        const hh = q.bits ? ((BH - 6) * q.bits) / total : BH - 6;
        y -= hh;
        g.append(s('rect', { x: x + 5, y, width: bw - 10, height: Math.max(1, hh), fill: q.color, opacity: 0.9 }));
      }
      g.append(s('title', null, `Symbol ${i}: ${b.parts.map((q) => `${q.name} ${q.bits}`).join(' + ')} bits`));
      det.append(g);
      if (bw > 26 || (i - w0) % 2 === 0 || sel) det.append(s('text', { x: x + bw / 2, y: BY + BH + 16, 'text-anchor': 'middle', class: 'mono' + (sel ? '' : ' muted'), 'font-weight': sel ? 700 : 400 }, String(i)));
      V.clickable(g, `Data symbol ${i}`, () => opts.onZoomIn(i, g.getBoundingClientRect()));
    }
    det.append(s('text', { x: LEFT, y: 12, class: 'muted small' }, `symbols ${w0} … ${w0 + WIN - 1} — each box: the bits it carries, first bit at the bottom; click to zoom in`));

    /* ---------- the selected symbol ---------- */
    const b = V.symbolBits(a, idx), startUs = (dataItem.start_ns + (idx - 1) * T) / 1000;
    const octet = (bit) => Math.floor(bit / 8) + 1;
    const desc = b.parts.map((q) => {
      const range = q.bits ? (q.name === b.payloadName ? ` (bits ${q.from}–${q.to} = octets ${octet(q.from)}–${octet(q.to)})` : ` (${q.bits} bits)`) : '';
      return h('li', null, h('i', { class: 'sw', style: { background: q.color } }), term(PART_TERM[q.name], q.name), range);
    });
    const ldpcNote = a.symbols.coding === 'LDPC' && idx >= a.symbols.N_SYM_init
      ? h('p', { class: 'small' }, idx === a.symbols.N_SYM_init
        ? ['Last information symbol: ', term('Pre-FEC padding factor', 'a'), ` = ${a.symbols.a_init} of 4 segments carry data (before the extra-segment check).`]
        : ['Added by the ', term('LDPC extra symbol segment'), ': carries parity only.'])
      : null;
    const card = h('div', { class: 'info-card' },
      h('h3', null, `Symbol ${idx} of ${n}`, h('span', { class: 'mono muted' }, `  ${V.us(T)} µs, from ${fmt(startUs, 3)} µs in the PPDU`)),
      h('p', null, b.len ? `Carries ${b.len} information bits (bit ${b.start} … ${b.start + b.len - 1} of the Data field${b.coding === 'LDPC' ? ', in order before LDPC encoding' : ''}):` : 'No information bits:'),
      h('ul', { class: 'parts' }, desc), ldpcNote,
      h('button', { type: 'button', class: 'play', onclick: (e) => opts.onZoomIn(idx, det.querySelector(`[data-zoom-symbol="${idx}"]`)?.getBoundingClientRect() || e.target.getBoundingClientRect()) }, `Zoom into symbol ${idx} →`));

    const step = (d) => opts.onIndex(Math.min(n, Math.max(1, idx + d)));
    const head = h('div', { class: 'view-head' },
      h('h2', null, term('Data field'), ` — `, term('N_SYM'), ` = ${n} `, term('OFDM symbol', 'OFDM symbols'), ` × ${V.us(T)} µs = ${V.us(n * T)} µs`),
      h('div', { class: 'chips' },
        h('button', { type: 'button', onclick: () => step(-1), disabled: idx <= 1, 'aria-label': 'Previous symbol' }, '◀'),
        h('span', { class: 'chip mono' }, `symbol ${idx} of ${n}`),
        h('button', { type: 'button', onclick: () => step(1), disabled: idx >= n, 'aria-label': 'Next symbol' }, '▶')));
    const legend = h('div', { class: 'chips small' }, [...new Set(Array.from({ length: n }, (_, i) => i + 1).slice(0, 2000).flatMap((i) => V.symbolBits(a, i).parts.map((q) => q.name)))]
      .map((name) => h('span', { class: 'chip' }, h('i', { style: { background: PART_COLOR[name] } }), name)));
    return h('div', null, head, ov, det, legend, card,
      h('p', { class: 'small muted' }, 'Every symbol lasts T_SYM and carries N_DBPS information bits; the first one starts with the SERVICE field, the last one ends with tail and pad bits. Keys: ← → previous / next symbol, Esc zoom out.'));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
