/* systems/wifi/view-ppdu.js — View 3: the whole PPDU in time.
 *
 * Row 1: true time scale (the preamble is tiny next to a long Data field).
 * Row 2: the same fields expanded so each can be read and clicked; Data symbols are
 *        individually clickable and zoom into the OFDM-symbol view.
 * Below: where the Data-field bits go (SERVICE, PSDU, tail, pad) and the N_SYM formula.
 * Every duration comes from WifiCalc.timeline().
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term, svgSym } = root.Dom;
  const V = root.WifiViews;

  const W = 800, LEFT = 14, RIGHT = 14, PW = W - LEFT - RIGHT;
  /** Rough width of a 12 px label (for deciding whether it fits). */
  const textWidth = (str) => str.length * 6.8;
  /** Centre a label over its box, but keep it inside the drawing at both edges. */
  const labelAnchor = (x, w, str) => {
    const half = (textWidth(str) * 11) / 12 / 2;
    if (x + w / 2 + half > W - 2) return { x: x + w, 'text-anchor': 'end' };
    if (x + w / 2 - half < 2) return { x, 'text-anchor': 'start' };
    return { x: x + w / 2, 'text-anchor': 'middle' };
  };
  /* glossary entries for the no-transmission items that close a PPDU */
  const GAP_TERM = { 'Signal extension': 'Signal extension', 'Short GI rounding': 'Short GI' };
  const Y1 = 46, H1 = 24, Y2 = 150, H2 = 46;

  /** @param opts { selected, symbolIndex, onField(name), onSymbol(index, rect) } */
  V.ppdu = function (a, opts) {
    const tl = a.timeline, total = tl.txtime_ns;
    const items = tl.items;
    const color = (it) => V.FIELD[it.kind] || '#94a3b8';
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} 262`, role: 'img', 'aria-label': 'PPDU timeline' });
    svg.append(s('defs', null, s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 6, height: 6, fill: '#1e293b' }), s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#64748b', 'stroke-width': 2 }))));

    /* ---------- row 1: true scale ---------- */
    const tx = (ns) => LEFT + (ns / total) * PW;
    svg.append(s('text', { x: LEFT, y: Y1 - 10, class: 'muted' }, `True time scale — `, ...svgSym('TXTIME'), ` = ${V.us(total)} µs`));
    for (const it of items) {
      const x0 = tx(it.start_ns), w = Math.max(0.8, tx(it.start_ns + it.dur_ns) - x0);
      const r = s('rect', { x: x0, y: Y1, width: w, height: H1, fill: it.kind === 'gap' ? 'url(#hatch)' : color(it), stroke: '#0a0e17', 'stroke-width': 0.6 },
        s('title', null, `${it.name}: ${V.us(it.dur_ns)} µs (from ${V.us(it.start_ns)} µs)`));
      if (it.kind !== 'gap') V.clickable(r, it.name, () => opts.onField(it.name));
      svg.append(r);
      if (w > textWidth(it.name) + 6) svg.append(s('text', { x: x0 + w / 2, y: Y1 + 16, 'text-anchor': 'middle', fill: '#04131c', 'font-weight': 600, 'pointer-events': 'none' }, it.name));
    }
    const stepUs = V.niceStep(total / 1000, 8);
    for (let t = 0; t <= total / 1000 + 1e-9; t += stepUs) {
      const x = tx(t * 1000);
      svg.append(s('line', { x1: x, x2: x, y1: Y1 + H1, y2: Y1 + H1 + 5, stroke: '#93a0b8' }));
      if (x < W - RIGHT - 40) svg.append(s('text', { x, y: Y1 + H1 + 17, 'text-anchor': 'middle', class: 'muted mono' }, fmt(t, 1)));
    }
    svg.append(s('text', { x: W - RIGHT, y: Y1 + H1 + 17, 'text-anchor': 'end', class: 'muted' }, 'µs'));

    /* ---------- row 2: expanded structure ---------- */
    const g = root.WifiCalc.generation(a.cfg.gen);
    const fieldDef = (name) => {
      const f = g.fields.find((x) => x.name === name);
      return f && f.ref ? root.WifiCalc.generation(f.ref).fields.find((x) => x.name === name) : f;
    };
    const fixedWidth = (it) => (it.kind === 'gap' ? 64 : it.kind === 'pe' ? 56 : Math.min(130, 56 + (it.dur_ns / 1000) * 6 * (it.count ? 0.6 : 1)));
    const others = items.filter((it) => it.kind !== 'data');
    const DATA_MIN = 230;
    const othersWidth = others.reduce((acc, it) => acc + fixedWidth(it), 0);
    const scale = Math.min(1, (PW - DATA_MIN - 4 * items.length) / othersWidth);
    const dataWidth = PW - othersWidth * scale - 4 * (items.length - 1);
    svg.append(s('text', { x: LEFT, y: Y2 - 30, class: 'muted' }, 'Field structure (expanded, not to scale) — click a field or a Data symbol'));

    let x = LEFT;
    const rowItems = [];
    items.forEach((it, i) => { it.labelLevel = 0; it.index = i; });
    for (const it of items) {
      const w = it.kind === 'data' ? dataWidth : fixedWidth(it) * scale;
      // stagger the name of a field that is narrower than its label, so neighbours do not overlap
      const afterData = it.index > 0 && items[it.index - 1].kind === 'data';
      if (it.kind !== 'data' && w < textWidth(it.name)) it.labelLevel = it.index % 2 || afterData ? 1 : 0;
      rowItems.push({ it, x, w });
      // connector from the true-scale bar
      const a0 = tx(it.start_ns), a1 = tx(it.start_ns + it.dur_ns);
      svg.append(s('path', { d: `M${a0},${Y1 + H1 + 22} L${x},${Y2 - 20} L${x + w},${Y2 - 20} L${a1},${Y1 + H1 + 22} Z`, fill: color(it), opacity: 0.07 }));
      if (it.kind === 'data') drawData(svg, a, it, x, w, opts);
      else drawField(svg, it, x, w, fieldDef(it.name), opts, color(it));
      x += w + 4;
    }

    /* ---------- below: bits of the Data field ---------- */
    return h('div', null,
      h('div', { class: 'view-head' }, h('h2', null, term('PPDU', 'PPDU'), ' — ', g.ppduFormat, ' (', g.label, ')'),
        h('span', { class: 'chip mono' }, 'TXTIME ', V.us(total), ' µs')),
      svg, dataBits(a), txtimeSum(a));
  };

  function drawField(svg, it, x, w, def, opts, fill) {
    const isGap = it.kind === 'gap';
    const sel = opts.selected === it.name;
    const r = s('rect', { x, y: Y2, width: w, height: H2, rx: 4, fill: isGap ? 'url(#hatch)' : fill,
      stroke: sel ? '#ffffff' : '#0a0e17', 'stroke-width': sel ? 2 : 1 });
    if (!isGap) V.clickable(r, `${it.name}, ${V.us(it.dur_ns)} µs`, () => opts.onField(it.name));
    svg.append(r);
    // internal structure from the data file (L-STF short symbols, L-LTF GI2 + long symbols, repeated LTFs)
    const st = def && def.structure ? def.structure.value : null;
    const parts = st && st.shortTrainingSymbols ? Array(st.shortTrainingSymbols).fill(1)
      : st && st.longTrainingSymbols ? [st.gi2, ...Array(st.longTrainingSymbols).fill(st.each)]
      : it.count > 1 ? Array(it.count).fill(1) : null;
    if (parts) {
      const sum = parts.reduce((p, q) => p + q, 0);
      let xx = x;
      parts.forEach((p, i) => {
        if (i) svg.append(s('line', { x1: xx, x2: xx, y1: Y2 + 4, y2: Y2 + H2 - 4, stroke: '#0a0e17', 'stroke-width': 1, 'pointer-events': 'none' }));
        xx += (p / sum) * w;
      });
    }
    svg.append(
      s('text', Object.assign({ y: Y2 - 6 - 14 * (it.labelLevel || 0), 'font-weight': 600, 'font-size': w < textWidth(it.name) ? 11 : 12,
        'data-term': GAP_TERM[it.name] || it.name }, labelAnchor(x, w, it.name)), it.name),
      s('text', { x: x + w / 2, y: Y2 + H2 + 16, 'text-anchor': 'middle', class: 'muted mono' },
        it.count > 1 ? `${it.count} × ${V.us(it.each_ns)} µs` : `${V.us(it.dur_ns)} µs`));
    if (st && st.shortTrainingSymbols) svg.append(s('text', { x: x + w / 2, y: Y2 + H2 + 31, 'text-anchor': 'middle', class: 'muted small' }, `${st.shortTrainingSymbols} × ${st.each} µs`));
    if (st && st.longTrainingSymbols) svg.append(s('text', { x: x + w / 2, y: Y2 + H2 + 31, 'text-anchor': 'middle', class: 'muted small' }, `${st.gi2} + ${st.longTrainingSymbols} × ${st.each} µs`));
  }

  function drawData(svg, a, it, x, w, opts) {
    const n = it.count;
    const maxShown = Math.max(6, Math.floor(w / 13));
    const shown = n <= maxShown ? [...Array(n).keys()].map((i) => i + 1)
      : [...[...Array(maxShown - 5).keys()].map((i) => i + 1), null, n - 2, n - 1, n];
    const gapW = 44, slots = shown.length - (shown.includes(null) ? 1 : 0);
    const sw = (w - (shown.includes(null) ? gapW : 0)) / slots;
    let xx = x;
    for (const idx of shown) {
      if (idx === null) {
        svg.append(s('text', { x: xx + gapW / 2, y: Y2 + H2 / 2 + 4, 'text-anchor': 'middle', class: 'muted' }, '…'),
          s('text', { x: xx + gapW / 2, y: Y2 + H2 + 16, 'text-anchor': 'middle', class: 'muted small' }, `${n - (maxShown - 2)} more`));
        xx += gapW;
        continue;
      }
      const sel = opts.symbolIndex === idx;
      const r = s('rect', { x: xx + 0.5, y: Y2, width: Math.max(1, sw - 1.5), height: H2, rx: 2, fill: V.FIELD.data,
        opacity: sel ? 1 : 0.8, stroke: sel ? '#ffffff' : 'none', 'stroke-width': 2, 'data-zoom-symbol': idx },
        s('title', null, `Data symbol ${idx} of ${n} — ${V.us(it.each_ns)} µs`));
      V.clickable(r, `Data symbol ${idx}`, () => opts.onSymbol(idx, r.getBoundingClientRect()));
      svg.append(r);
      xx += sw;
    }
    svg.append(
      s('text', { x: x + w / 2, y: Y2 - 6, 'text-anchor': 'middle', 'font-weight': 600, 'data-term': 'Data field' },
        w < 300 ? 'Data: ' : 'Data field: ', ...svgSym('N_SYM'), ` = ${n}`, w < 300 ? '' : ' OFDM symbols'),
      s('text', { x: x + w / 2, y: Y2 + H2 + 31, 'text-anchor': 'middle', class: 'muted mono' }, `${n} × ${V.us(it.each_ns)} µs = ${V.us(it.dur_ns)} µs`));
  }

  /** Bits in the Data field: SERVICE | PSDU | tail | pad = N_SYM · N_DBPS. */
  function dataBits(a) {
    const sy = a.symbols, p = a.params;
    if (sy.coding !== 'BCC') return h('div');
    const pf = root.WifiCalc.generation(a.cfg.gen).payloadField;
    const total = sy.N_SYM * p.N_DBPS;
    const parts = [
      { label: 'SERVICE', term: 'SERVICE field', bits: sy.N_service, color: '#c084fc' },
      { label: pf.name === 'APEP_LENGTH' ? 'APEP' : 'PSDU', term: pf.name === 'APEP_LENGTH' ? 'APEP_LENGTH' : 'PSDU', bits: sy.payloadBits, color: '#38bdf8' },
      { label: 'tail', term: 'Tail bits', bits: sy.N_tail, color: '#fbbf24' },
      { label: 'pad', term: 'Pad bits', bits: sy.N_PAD, color: '#64748b' },
    ];
    const bar = h('div', { class: 'bits', role: 'img', 'aria-label': 'Data field bits' },
      parts.filter((q) => q.bits > 0).map((q) => h('div', {
        style: { background: q.color, flex: `${Math.max(q.bits / total, 0.14)} 0 0` }, title: `${q.label}: ${q.bits} bits`,
      }, `${q.label} ${q.bits}`)));
    return h('div', { class: 'explain' },
      h('h3', null, 'Bits of the ', term('Data field', 'Data field')),
      bar,
      h('div', { class: 'formula' },
        term('N_SYM'), ` = ⌈(${sy.N_service} + 8·`, term(pf.term, pf.name), ` + ${sy.N_tail / (p.N_ES || 1)}·`, term('N_ES'), ') / ', term('N_DBPS'), '⌉ = ⌈(',
        `${sy.N_service} + ${sy.payloadBits} + ${sy.N_tail}) / ${p.N_DBPS}⌉ = ⌈${sy.N_service + sy.payloadBits + sy.N_tail} / ${p.N_DBPS}⌉ = ${sy.N_SYM}`),
      h('div', { class: 'formula' }, term('N_PAD'), ` = ${sy.N_SYM} × ${p.N_DBPS} − ${sy.N_service + sy.payloadBits + sy.N_tail} = ${sy.N_PAD} bits`));
  }

  /** TXTIME as the sum of the timeline items. */
  function txtimeSum(a) {
    const items = a.timeline.items;
    const terms = items.map((it) => (it.count > 1 ? `${it.count}×${V.us(it.each_ns)}` : V.us(it.dur_ns)));
    return h('div', { class: 'formula' }, term('TXTIME'), ' = ', items.map((i) => i.name).join(' + '), h('br'),
      '       = ', terms.join(' + '), ` = ${V.us(a.timeline.txtime_ns)} µs`);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
