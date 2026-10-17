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
  const textWidth = (str) => str.length * 7.3;
  /** Centre a label over its box, but keep it inside the drawing at both edges. */
  const labelAnchor = (x, w, str) => {
    const half = (textWidth(str) * 11) / 12 / 2;
    if (x + w / 2 + half > W - 2) return { x: x + w, 'text-anchor': 'end' };
    if (x + w / 2 - half < 2) return { x, 'text-anchor': 'start' };
    return { x: x + w / 2, 'text-anchor': 'middle' };
  };
  /* glossary entries for the no-transmission items that close a PPDU */
  const GAP_TERM = { 'Signal extension': 'Signal extension', 'Short GI rounding': 'Short GI' };
  const H1 = 24, H2 = 46;
  let Y2 = 150; // top of the expanded row; set per render (depends on whether the preamble inset is shown)

  /** @param opts { selected, symbolIndex, onField(name), onSymbol(index, rect) } */
  V.ppdu = function (a, opts) {
    const tl = a.timeline, total = tl.txtime_ns;
    const items = tl.items;
    const color = (it) => V.FIELD[it.kind] || '#94a3b8';
    const dataItem = items.find((it) => it.kind === 'data');
    const pre_ns = dataItem.start_ns;                        // everything before the Data field
    // magnify the preamble whenever one of its fields is too narrow to carry its name at true scale
    const showInset = items.some((it) => it.start_ns < pre_ns && (it.dur_ns / total) * PW < textWidth(it.name) + 6);
    const Y1 = showInset ? 122 : 44;                         // true-scale bar
    const cTop = Y1 + H1 + 26, cBot = cTop + 58;             // connector band
    Y2 = cBot + 52;
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${Y2 + H2 + 40}`, role: 'img', 'aria-label': 'PPDU timeline' });
    svg.append(s('defs', null, s('pattern', { id: 'hatch', width: 6, height: 6, patternUnits: 'userSpaceOnUse', patternTransform: 'rotate(45)' },
      s('rect', { width: 6, height: 6, fill: '#1e293b' }), s('line', { x1: 0, y1: 0, x2: 0, y2: 6, stroke: '#64748b', 'stroke-width': 2 }))));
    const tx = (ns) => LEFT + (ns / total) * PW;
    const fieldRect = (it, x0, y, w, hgt) => {
      const r = s('rect', { x: x0, y, width: w, height: hgt, fill: it.kind === 'gap' ? 'url(#hatch)' : color(it), stroke: '#0a0e17', 'stroke-width': 0.6 },
        s('title', null, `${it.name}: ${V.us(it.dur_ns)} µs (from ${V.us(it.start_ns)} µs)`));
      if (it.kind !== 'gap') V.clickable(r, it.name, () => opts.onField(it.name));
      return r;
    };
    const ticks = (y, x0, x1, span_ns) => {
      const step = V.niceStep(span_ns / 1000, 8);
      for (let t = 0; t <= span_ns / 1000 + 1e-9; t += step) {
        const x = x0 + ((t * 1000) / span_ns) * (x1 - x0);
        svg.append(s('line', { x1: x, x2: x, y1: y, y2: y + 5, stroke: '#a7b2c6' }));
        if (x < x1 - 30) svg.append(s('text', { x, y: y + 17, 'text-anchor': 'middle', class: 'muted mono' }, fmt(t, 1)));
      }
      svg.append(s('text', { x: x1, y: y + 17, 'text-anchor': 'end', class: 'muted' }, 'µs'));
    };

    /* ---------- preamble inset (to scale, magnified) ---------- */
    if (showInset) {
      const YI = 22, HI = 24;
      const ix = (ns) => LEFT + (ns / pre_ns) * PW;
      svg.append(s('text', { x: LEFT, y: YI - 8, class: 'muted' }, `Preamble magnified ×${fmt(total / pre_ns, 1)} — to scale, ${V.us(pre_ns)} µs`));
      for (const it of items.filter((x) => x.start_ns < pre_ns)) {
        const x0 = ix(it.start_ns), w = ix(it.start_ns + it.dur_ns) - x0;
        svg.append(fieldRect(it, x0, YI, w, HI));
        if (w > textWidth(it.name) + 6) svg.append(s('text', { x: x0 + w / 2, y: YI + 16, 'text-anchor': 'middle', fill: '#04131c', 'font-weight': 600, 'pointer-events': 'none' }, it.name));
      }
      ticks(YI + HI, LEFT, W - RIGHT, pre_ns);
      // funnel from the inset down to the outlined preamble on the true-scale bar
      // (the funnel ends above the row-1 labels, then drops straight onto the outline)
      const fy0 = YI + HI + 22, fy1 = Y1 - 26, fy2 = Y1 - 4, xa = tx(0) - 2, xb = tx(pre_ns) + 2;
      svg.append(s('path', { d: `M${LEFT},${fy0} L${W - RIGHT},${fy0} L${xb},${fy1} L${xa},${fy1} Z`, fill: '#e6eaf2', opacity: 0.06 }),
        s('path', { d: `M${LEFT},${fy0} L${xa},${fy1} V${fy2} M${W - RIGHT},${fy0} L${xb},${fy1} V${fy2}`, stroke: '#e6eaf2', 'stroke-width': 1, 'stroke-dasharray': '4 3', opacity: 0.7, fill: 'none' }));
    }

    /* ---------- row 1: true scale ---------- */
    svg.append(s('text', { x: W - RIGHT, y: Y1 - 10, 'text-anchor': 'end', class: 'muted' }, `True time scale — `, ...svgSym('TXTIME'), ` = ${V.us(total)} µs`));
    for (const it of items) {
      const x0 = tx(it.start_ns), w = Math.max(0.8, tx(it.start_ns + it.dur_ns) - x0);
      svg.append(fieldRect(it, x0, Y1, w, H1));
      if (w > textWidth(it.name) + 6) svg.append(s('text', { x: x0 + w / 2, y: Y1 + 16, 'text-anchor': 'middle', fill: '#04131c', 'font-weight': 600, 'pointer-events': 'none' }, it.name));
    }
    // outline the preamble so it reads as one region even when it is thin
    svg.append(s('rect', { x: tx(0) - 2, y: Y1 - 4, width: tx(pre_ns) - tx(0) + 4, height: H1 + 8, rx: 3, fill: 'none', stroke: '#e6eaf2', 'stroke-width': 1.4, 'stroke-dasharray': '5 3' }),
      s('text', { x: tx(0) + 4, y: Y1 - 10, class: 'small', fill: '#e6eaf2' }, `preamble ${V.us(pre_ns)} µs`));
    ticks(Y1 + H1, LEFT, W - RIGHT, total);

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
    // caption below the connector band, above the field names
    svg.append(s('text', { x: LEFT, y: cBot + 16, class: 'muted' }, 'Field structure (expanded, not to scale) — click a field or a Data symbol'));

    let x = LEFT;
    items.forEach((it, i) => { it.labelLevel = 0; it.index = i; });
    for (const it of items) {
      const w = it.kind === 'data' ? dataWidth : fixedWidth(it) * scale;
      const afterData = it.index > 0 && items[it.index - 1].kind === 'data';
      if (it.kind !== 'data' && w < textWidth(it.name)) it.labelLevel = it.index % 2 || afterData ? 1 : 0;
      // connector: from the field's true-scale position to its expanded box
      const a0 = tx(it.start_ns), a1 = Math.max(a0 + 0.8, tx(it.start_ns + it.dur_ns));
      const c = it.kind === 'gap' ? '#64748b' : color(it);
      svg.append(s('path', { d: `M${a0},${cTop} L${a1},${cTop} L${x + w},${cBot} L${x},${cBot} Z`, fill: c, opacity: 0.22, 'pointer-events': 'none' }),
        s('path', { d: `M${a0},${cTop} L${x},${cBot} M${a1},${cTop} L${x + w},${cBot}`, stroke: c, 'stroke-width': 1, opacity: 0.9, fill: 'none', 'pointer-events': 'none' }));
      if (it.kind === 'data') drawData(svg, a, it, x, w, opts);
      else drawField(svg, it, x, w, fieldDef(it.name), opts, color(it));
      x += w + 4;
    }

    /* ---------- below: bits of the Data field ---------- */
    return h('div', null,
      h('div', { class: 'view-head' }, h('h2', null, term('PPDU', 'PPDU'), ' — ', g.ppduFormat, ' (', g.label, ')'),
        h('span', { class: 'chip mono' }, 'TXTIME ', V.us(total), ' µs',
          a.unverified.airtime.length ? [' ', h('span', { class: 'badge unverified', title: 'depends on: ' + a.unverified.airtime.map(V.depLabel).join('; ') }, 'unverified')] : null)),
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
    if (sy.coding === 'LDPC') return ldpcBits(a);
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

  /**
   * HE with LDPC: SERVICE | APEP | pre-FEC pad = N_pld, the a-factor of the last
   * OFDM symbol, the LDPC codeword parameters and the extra-symbol-segment test.
   */
  function ldpcBits(a) {
    const sy = a.symbols, p = a.params, L = sy.ldpc, cfg = a.cfg;
    const pf = root.WifiCalc.generation(cfg.gen).payloadField;
    const info = sy.N_service + sy.payloadBits + sy.N_tail;
    const parts = [
      { label: 'SERVICE', bits: sy.N_service, color: '#c084fc' },
      { label: 'APEP', bits: sy.payloadBits, color: '#38bdf8' },
      { label: 'pre-FEC pad', bits: sy.N_PAD_preFEC, color: '#64748b' },
    ];
    const bar = h('div', { class: 'bits', role: 'img', 'aria-label': 'Information bits given to the LDPC encoder' },
      parts.filter((q) => q.bits > 0).map((q) => h('div', {
        style: { background: q.color, flex: `${Math.max(q.bits / sy.N_pld, 0.24)} 0 0` }, title: `${q.label}: ${q.bits} bits`,
      }, `${q.label} ${q.bits}`)));
    // the last OFDM symbol: segments 1..3 have N_SD,short data subcarriers each, segment 4 the rest
    const segTones = [sy.N_SD_short, sy.N_SD_short, sy.N_SD_short, p.N_SD - 3 * sy.N_SD_short];
    const T_PE = a.timeline.T_PE_ns;
    const last = h('div', { class: 'bits', role: 'img', 'aria-label': `Last OFDM symbol: ${sy.a} of 4 segments carry data` },
      segTones.map((n, i) => h('div', { style: { background: i < sy.a ? '#38bdf8' : 'repeating-linear-gradient(45deg,#1e293b 0 5px,#334155 5px 10px)',
        color: i < sy.a ? '#04131c' : '#cbd5e1', flex: `${n} 0 0` }, title: `segment ${i + 1}: ${n} data subcarriers` },
        i < sy.a ? `segment ${i + 1}: data` : `segment ${i + 1}: post-FEC pad`)));
    const lim = (x) => fmt(x, 1);
    return h('div', { class: 'explain' },
      h('h3', null, 'Bits of the ', term('Data field', 'Data field'), ' — ', term('LDPC'), ' coding'),
      bar,
      h('div', { class: 'formula' },
        term('N_SYM,init'), ` = ⌈(8·`, term(pf.term, pf.name), ' + N_tail + N_service) / ', term('N_DBPS'), `⌉ = ⌈(${sy.payloadBits} + ${sy.N_tail} + ${sy.N_service}) / ${fmt(p.N_DBPS, 3)}⌉ = ${sy.N_SYM_init}`, h('br'),
        term('N_Excess'), ` = ${info} mod ${fmt(p.N_DBPS, 3)} = ${sy.N_Excess}   ·   `, term('N_SD,short', root.Dom.sym('N_DBPS,short')),
        ` = ${sy.N_SD_short} × ${p.N_BPSCS} × ${p.N_SS} × ${p.R.text} = ${fmt(sy.N_DBPS_short, 3)}`, h('br'),
        'a_init = ', sy.N_Excess === 0 ? '4 (N_Excess = 0)' : `min(⌈${sy.N_Excess} / ${fmt(sy.N_DBPS_short, 3)}⌉, 4) = ${sy.a_init}`, h('br'),
        term('N_pld'), ` = ${sy.N_SYM_init - 1} × ${fmt(p.N_DBPS, 3)} + ${sy.a_init < 4 ? `${sy.a_init} × ${fmt(sy.N_DBPS_short, 3)}` : fmt(p.N_DBPS, 3)} = ${sy.N_pld}   →   `,
        term('Pre-FEC padding', root.Dom.sym('N_PAD,Pre-FEC')), ` = ${sy.N_pld} − ${info} = ${sy.N_PAD_preFEC} bits`, h('br'),
        term('N_avbits'), ` = ${sy.N_SYM_init - 1} × ${p.N_CBPS} + ${sy.a_init < 4 ? `${sy.a_init} × ${sy.N_CBPS_short}` : p.N_CBPS} = ${sy.N_avbits}`),
      h('div', { class: 'formula' },
        term('N_CW'), ` = ${L.N_CW}, `, term('L_LDPC'), ` = ${L.L_LDPC}, `, term('N_shrt'), ` = ${L.N_shrt}, `, term('N_punc'), ` = ${L.N_punc}`, h('br'),
        term('LDPC extra symbol segment', 'Extra segment'), ` if N_punc > 0.1·N_CW·L_LDPC·(1 − R) = ${lim(L.puncLimit)} (${L.N_punc > L.puncLimit ? 'yes' : 'no'})`,
        ` and N_shrt < 1.2·N_punc·R/(1 − R) = ${lim(L.shrtLimit)} (${L.N_shrt < L.shrtLimit ? 'yes' : 'no'}) → `,
        L.extraSegment ? (sy.a_init === 4 ? 'yes: one more OFDM symbol, a = 1' : `yes: a = a_init + 1 = ${sy.a}`) : 'no',
        h('br'), term('N_SYM'), ` = ${sy.N_SYM}, `, term('Pre-FEC padding factor', 'a'), ` = ${sy.a}`),
      h('h3', null, 'Last OFDM symbol — ', term('Pre-FEC padding factor', 'a'), ` = ${sy.a} of 4 segments carry data`),
      h('div', { class: 'small muted' }, `Its ${p.N_SD} data subcarriers, split into segments of ${sy.N_SD_short}, ${sy.N_SD_short}, ${sy.N_SD_short} and ${segTones[3]} (`, term('N_SD,short'), '):'),
      last,
      h('p', { class: 'small muted' }, 'The receiver can stop after segment a: the rest is ', term('Post-FEC padding', 'post-FEC padding'), '. ',
        term('T_PE'), ` = ${V.us(T_PE)} µs follows from the `, term('Nominal packet padding', 'nominal packet padding'), ` (${cfg.nominalPadding} µs) and a = ${sy.a}.`),
      a.unverified.ldpcDependent ? h('div', { class: 'notice warn' }, h('strong', null, 'Airtime depends on unverified LDPC constants: '),
        a.unverified.airtime.filter((d) => d.startsWith('ldpc.')).map(V.depLabel).join('; '), ' (codeword-length thresholds and the extra-segment factors were not found in two sources).') : null);
  }

  /** TXTIME as the sum of the timeline items. */
  function txtimeSum(a) {
    const items = a.timeline.items;
    const terms = items.map((it) => (it.count > 1 ? `${it.count}×${V.us(it.each_ns)}` : V.us(it.dur_ns)));
    const formula = root.WifiCalc.generation(a.cfg.gen).txtime?.formula;
    return h('div', { class: 'formula' }, term('TXTIME'), ' = ', items.map((i) => i.name).join(' + '), h('br'),
      '       = ', terms.join(' + '), ` = ${V.us(a.timeline.txtime_ns)} µs`,
      formula ? [h('br'), h('span', { class: 'muted' }, formula.value)] : null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
