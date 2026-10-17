/* systems/wifi/view-symbol.js — View 2: one OFDM symbol in time.
 *
 * Builds a real OFDM symbol from the tone map: random constellation points on the
 * data subcarriers, a known value on the pilots, zeros elsewhere, then an IFFT
 * (oversampled by zero-padding so the curve is smooth). The guard interval is then
 * filled with a copy of the last T_GI of the useful part — the cyclic prefix.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term, svgSym } = root.Dom;
  const { Dsp } = root;
  const V = root.WifiViews;

  const W = 800, LEFT = 40, RIGHT = 16, PW = W - LEFT - RIGHT, MID = 150, AMP = 74;

  const Wv = () => root.WifiWave;

  /** Frequency-domain values of one Data-field OFDM symbol (deterministic per configuration and index). */
  V.symbolValues = (a, index) => Wv().symbolValues(a, index);

  /**
   * @param opts { index (1..N_SYM), onIndex(i), onZoomIn(rect), onSubcarrier(k, rect) }
   */
  V.symbol = function (a, opts) {
    const p = a.params, N = p.N_FFT, nSym = a.symbols.N_SYM;
    const index = Math.min(Math.max(1, opts.index || 1), nSym);
    const values = V.symbolValues(a, index);

    // IFFT with M-times oversampling (wave.js): bin k of an N·M-point IFFT, cyclic prefix in front
    const g = Wv().grid(a);
    const wave = Array.from(Wv().symbolWaveform(g, values).re);
    const peak = wave.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;

    const T = p.T_SYM_ns;
    const xt = (ns) => LEFT + (ns / T) * PW;
    const xGI = xt(p.T_GI_ns), xEnd = xt(T), xTail = xt(T - p.T_GI_ns);
    const tName = V.tUsefulName(a);
    const fsMHz = (N * p.spacingKHz) / 1000;

    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} 330`, role: 'img', 'aria-label': 'One OFDM symbol in the time domain' });
    // regions
    svg.append(
      s('rect', { x: LEFT, y: MID - AMP - 22, width: xGI - LEFT, height: 2 * AMP + 30, fill: V.GI, opacity: 0.16 }),
      s('rect', { x: xTail, y: MID - AMP - 22, width: xEnd - xTail, height: 2 * AMP + 30, fill: 'none', stroke: V.GI, 'stroke-dasharray': '5 4' }));
    const useful = s('rect', { x: xGI, y: MID - AMP - 22, width: xEnd - xGI, height: 2 * AMP + 30, fill: '#38bdf8', opacity: 0.07, 'data-zoom-target': 'useful' });
    V.clickable(useful, 'Zoom into the subcarriers of the useful part', () => opts.onZoomIn(useful.getBoundingClientRect()));
    svg.append(useful);

    // waveform (in-phase part)
    const pts = wave.map((x, i) => `${(LEFT + (i / (wave.length - 1)) * PW).toFixed(1)},${(MID - (x / peak) * AMP).toFixed(1)}`);
    svg.append(s('line', { x1: LEFT, x2: xEnd, y1: MID, y2: MID, stroke: '#2b3a57' }),
      s('polyline', { points: pts.join(' '), fill: 'none', stroke: '#38bdf8', 'stroke-width': 1.4 }));

    // "copy" arrow from the tail of the useful part to the guard interval
    const yA = MID - AMP - 30;
    svg.append(
      s('defs', null, s('marker', { id: 'arrowGI', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 7, markerHeight: 7, orient: 'auto-start-reverse' },
        s('path', { d: 'M0,0 L10,5 L0,10 z', fill: V.GI }))),
      s('path', { d: `M${(xTail + xEnd) / 2},${yA} C${(xTail + xEnd) / 2},${yA - 26} ${(LEFT + xGI) / 2},${yA - 26} ${(LEFT + xGI) / 2},${yA}`,
        fill: 'none', stroke: V.GI, 'stroke-width': 1.6, 'marker-end': 'url(#arrowGI)' }),
      s('text', { x: (LEFT + xEnd) / 2, y: yA - 22, 'text-anchor': 'middle', fill: V.GI, 'data-term': 'Cyclic prefix' },
        'cyclic prefix = copy of the last ', ...svgSym('T_GI'), ' of the useful part'));

    // dimension lines
    const dim = (x0, x1, y, label, termId) => [
      s('path', { d: `M${x0},${y - 5} V${y + 5} M${x0},${y} H${x1} M${x1},${y - 5} V${y + 5}`, stroke: '#93a0b8', fill: 'none' }),
      s('text', { x: (x0 + x1) / 2, y: y + 18, 'text-anchor': 'middle', 'data-term': termId }, ...label)];
    svg.append(
      ...dim(LEFT, xGI, 254, [...svgSym('T_GI'), ` = ${V.us(p.T_GI_ns)} µs`], 'Guard interval'),
      ...dim(xGI, xEnd, 254, [...svgSym(tName), ' = 1/', ...svgSym('Δ_F'), ` = ${V.us(p.T_DFT_ns)} µs (useful part)`], tName),
      ...dim(LEFT, xEnd, 294, [...svgSym('T_SYM'), ` = ${V.us(p.T_GI_ns)} + ${V.us(p.T_DFT_ns)} = ${V.us(T)} µs`], 'T_SYM'));
    svg.append(s('text', { x: LEFT - 8, y: MID + 4, 'text-anchor': 'end', class: 'muted' }, 'Re'));

    // --- constellation of this symbol: ideal grid, I/Q axes with ticks, data (blue) and pilot (amber) points
    const grid = Dsp.constellation(p.N_BPSCS);
    const used = values.filter((v) => v.z);
    const lim = Math.max(1.2, ...used.map((v) => Math.max(Math.abs(v.z.re), Math.abs(v.z.im)))) * 1.12;
    const CS = 300, CC = 162, CR = 112; // viewBox size, plot centre, plot radius (px)
    const cx = (re) => CC + (re / lim) * CR, cy = (im) => CC - 14 - (im / lim) * CR;
    const fx0 = CC - CR - 10, fx1 = CC + CR + 10, fy0 = cy(0) - CR - 10, fy1 = cy(0) + CR + 10;
    const cons = s('svg', { class: 'diagram constellation sym-cons', viewBox: `0 0 ${CS} ${CS + 14}`, role: 'img', 'aria-label': `Constellation points of this symbol (${a.cfg.mod})` },
      s('rect', { x: fx0, y: fy0, width: fx1 - fx0, height: fy1 - fy0, fill: 'none', stroke: '#3b4a66' }),
      s('line', { x1: fx0, x2: fx1, y1: cy(0), y2: cy(0), stroke: '#2b3a57' }),
      s('line', { x1: cx(0), x2: cx(0), y1: fy0, y2: fy1, stroke: '#2b3a57' }),
      s('text', { x: (fx0 + fx1) / 2, y: fy1 + 30, 'text-anchor': 'middle', class: 'muted' }, 'I (in-phase)'),
      s('text', { x: 12, y: cy(0), 'text-anchor': 'middle', class: 'muted', transform: `rotate(-90 12 ${cy(0)})` }, 'Q (quadrature)'));
    // ticks on the frame, outside the point cloud
    for (const t of [-1, 0, 1]) {
      const lab = t > 0 ? '+1' : t < 0 ? '−1' : '0';
      cons.append(s('line', { x1: cx(t), x2: cx(t), y1: fy1, y2: fy1 + 4, stroke: '#a7b2c6' }),
        s('text', { x: cx(t), y: fy1 + 16, 'text-anchor': 'middle', class: 'muted mono small' }, lab),
        s('line', { x1: fx0 - 4, x2: fx0, y1: cy(t), y2: cy(t), stroke: '#a7b2c6' }),
        s('text', { x: fx0 - 6, y: cy(t) + 4, 'text-anchor': 'end', class: 'muted mono small' }, lab));
    }
    const rDot = grid.length > 256 ? 1.3 : grid.length > 64 ? 2 : 3;
    for (const z of grid) cons.append(s('circle', { cx: cx(z.re), cy: cy(z.im), r: rDot, fill: 'none', stroke: '#3b4a66', 'stroke-width': 0.8 }));
    for (const v of used) {
      const c = v.kind === 'pilot' ? V.KIND.pilot.color : V.KIND.data.color;
      cons.append(s('circle', { cx: cx(v.z.re), cy: cy(v.z.im), r: v.kind === 'pilot' ? rDot + 2.5 : rDot + 0.4, fill: c, stroke: v.kind === 'pilot' ? '#111827' : 'none' },
        s('title', null, `k = ${V.signed(v.k, 0)}: ${fmt(v.z.re, 3)} ${v.z.im < 0 ? '−' : '+'} j${fmt(Math.abs(v.z.im), 3)}`)));
    }
    cons.append(s('text', { x: fx0, y: fy0 - 6, class: 'muted small' }, `${a.cfg.mod} · ${grid.length} points, unit average power`));

    // --- header, stepper, explanation
    const step = (d) => opts.onIndex(Math.min(nSym, Math.max(1, index + d)));
    const head = h('div', { class: 'view-head' },
      h('h2', null, 'One ', term('OFDM symbol', 'OFDM symbol'), ' in time — Data field',
        a.cfg.nss > 1 ? h('span', { class: 'muted small' }, ' · ', term('Spatial stream', 'spatial stream'), ` 1 of ${a.cfg.nss}`) : null),
      h('div', { class: 'chips' },
        h('button', { type: 'button', onclick: () => step(-1), disabled: index <= 1, 'aria-label': 'Previous symbol' }, '◀'),
        h('span', { class: 'chip mono' }, `symbol ${index} of ${nSym}`),
        h('button', { type: 'button', onclick: () => step(1), disabled: index >= nSym, 'aria-label': 'Next symbol' }, '▶')));

    const cpSamples = (p.T_GI_ns / 1000) * fsMHz, fftSamples = (p.T_DFT_ns / 1000) * fsMHz;
    const facts = h('div', { class: 'formula' },
      'sample rate = ', term('FFT size', root.Dom.sym('N_FFT')), ' · ', term('Δ_F'), ` = ${N} × ${fmt(p.spacingKHz, 3)} kHz = ${fmt(fsMHz, 3)} Msample/s  →  `,
      term('Guard interval', 'GI'), ` = ${fmt(cpSamples, 2)} samples, useful part = ${fmt(fftSamples, 2)} samples`);

    const side = h('figure', { class: 'cons-fig' }, cons,
      h('div', { class: 'chips small' },
        h('span', { class: 'chip' }, h('i', { style: { background: V.KIND.data.color } }), term('Data subcarrier', 'data'), ' ' + a.dataTones.N_SD),
        h('span', { class: 'chip' }, h('i', { style: { background: V.KIND.pilot.color } }), term('Pilot subcarrier', 'pilot'), ' ' + a.dataTones.N_SP),
        h('span', { class: 'chip' }, h('i', { style: { background: 'transparent', border: '1px solid #3b4a66' } }), 'ideal points')),
      h('figcaption', { class: 'small' }, 'Points sent in this symbol: ', a.dataTones.N_SD, ' data subcarriers (',
        term('Constellation mapping', a.cfg.mod), ') and ', a.dataTones.N_SP, ' pilots (amber). Each point is the complex amplitude of one subcarrier.'));

    const explain = h('div', { class: 'explain' },
      h('p', null, 'The ', term('IFFT', 'IFFT'), ' turns the ', a.dataTones.N_ST, ' subcarrier values into ', N,
        ' time samples lasting ', h('span', { class: 'mono' }, V.us(p.T_DFT_ns) + ' µs'), ' = 1/', root.Dom.sym('Δ_F'), '. Then the last ',
        h('span', { class: 'mono' }, V.us(p.T_GI_ns) + ' µs'), ' is copied in front as the ', term('Cyclic prefix', 'cyclic prefix'), '.'),
      h('p', null, 'Why: echoes shorter than the guard interval only smear into the prefix, and inside the receiver\'s FFT window the channel then acts on each subcarrier as a single complex gain — corrected with one division per subcarrier.'),
      h('p', { class: 'muted small' }, 'Illustration: the constellation points are random (same for the same symbol index); pilots are drawn as +1 although the standard changes their sign from symbol to symbol. Click the blue useful part to zoom into its subcarriers.'));

    // linked spectrum strip: hover a subcarrier to overlay its own wave (true scale), click to zoom into it
    const strip = toneStrip(a, values, {
      onHover: (k) => {
        overlay.replaceChildren();
        if (k === null) { stripLabel.textContent = 'hover a subcarrier to see its wave inside the symbol · click to zoom in'; return; }
        const v = values.find((x) => x.k === k);
        const tw = Wv().toneWave(g, k, v && v.z);
        const step = Math.max(1, Math.floor(tw.re.length / 1500));
        const pts = [];
        for (let i = 0; i < tw.re.length; i += step) pts.push(`${(LEFT + (i / (tw.re.length - 1)) * PW).toFixed(1)},${(MID - (tw.re[i] / peak) * AMP).toFixed(1)}`);
        overlay.append(s('polyline', { points: pts.join(' '), fill: 'none', stroke: '#fbbf24', 'stroke-width': 2, opacity: 0.9 }));
        stripLabel.textContent = `k = ${V.signed(k, 0)} (${v ? V.KIND[v.kind].label : ''}) — its wave in amber, same scale as the symbol: ${v && v.z ? `${Math.abs(k)} cycles in ${V.us(p.T_DFT_ns)} µs` : 'zero amplitude'}`;
      },
      onClick: opts.onSubcarrier,
    });
    const overlay = s('g', { 'pointer-events': 'none' });
    svg.append(overlay);
    const stripLabel = h('div', { class: 'small muted strip-label' }, 'hover a subcarrier to see its wave inside the symbol · click to zoom in');
    return h('div', null, head, svg, h('div', { class: 'tone-strip' }, strip, stripLabel), h('div', { class: 'symbol-grid' }, h('div', null, facts, explain), side));
  };

  /**
   * Compact time view of symbol `index` for the Spectrum view: show(k) overlays subcarrier k's own wave
   * (amber, same scale) — linked brushing from the subcarrier map.
   */
  V.timePreview = function (a, index) {
    const g = Wv().grid(a), values = Wv().symbolValues(a, index);
    const full = Wv().symbolWaveform(g, values).re, len = full.length;
    const H = 120, MID = 60, AMP = 46;
    const peak = full.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
    const step = Math.max(1, Math.floor(len / 1400));
    const path = (arr) => { const pts = []; for (let i = 0; i < len; i += step) pts.push(`${(LEFT + (i / (len - 1)) * PW).toFixed(1)},${(MID - (arr[i] / peak) * AMP).toFixed(1)}`); return pts.join(' '); };
    const tone = s('polyline', { fill: 'none', stroke: '#fbbf24', 'stroke-width': 2 });
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'This symbol in time' },
      s('rect', { x: LEFT, y: 8, width: (g.cp / len) * PW, height: H - 16, fill: V.GI, opacity: 0.14 }),
      s('line', { x1: LEFT, x2: W - RIGHT, y1: MID, y2: MID, stroke: '#2b3a57' }),
      s('polyline', { points: path(full), fill: 'none', stroke: '#38bdf8', 'stroke-width': 1, opacity: 0.55 }), tone,
      s('text', { x: LEFT - 8, y: MID + 4, 'text-anchor': 'end', class: 'muted' }, 'Re'));
    const label = h('div', { class: 'small muted strip-label' }, `Symbol ${index} in time (blue). Hover a subcarrier above to overlay its wave; click it to zoom in.`);
    return {
      el: h('div', { class: 'time-preview' }, h('h3', null, 'The same symbol in time'), svg, label),
      show(k) {
        if (k === null) { tone.setAttribute('points', ''); label.textContent = `Symbol ${index} in time (blue). Hover a subcarrier above to overlay its wave; click it to zoom in.`; return; }
        const v = values.find((x) => x.k === k);
        tone.setAttribute('points', path(Wv().toneWave(g, k, v && v.z).re));
        label.textContent = `k = ${V.signed(k, 0)} (${v ? V.KIND[v.kind].label : ''}): its wave in amber, same scale — ${v && v.z ? `${Math.abs(k)} cycles in ${V.us(a.params.T_DFT_ns)} µs` : 'zero amplitude'}`;
      },
    };
  };

  /** Thin spectrum strip of one symbol (|value| per subcarrier); reports the hovered / clicked subcarrier. */
  function toneStrip(a, values, cb) {
    const fft = a.dataTones.fft, H = 46;
    const X = (k) => LEFT + ((k + fft / 2 + 0.5) / fft) * PW, px = PW / fft;
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Subcarriers of this symbol: hover to overlay one, click to zoom in' });
    const amp = Math.max(...values.map((v) => (v.z ? Math.hypot(v.z.re, v.z.im) : 0))) || 1;
    for (const v of values) {
      const hgt = v.z ? 6 + 28 * (Math.hypot(v.z.re, v.z.im) / amp) : 3;
      svg.append(s('rect', { x: X(v.k) - Math.max(0.5, px * 0.35), y: 36 - hgt, width: Math.max(1, px * 0.7), height: hgt, fill: V.KIND[v.kind].color, opacity: v.z ? 0.9 : 0.6 }));
    }
    svg.append(s('line', { x1: LEFT, x2: W - RIGHT, y1: 36.5, y2: 36.5, stroke: '#a7b2c6' }),
      s('text', { x: LEFT - 6, y: 30, 'text-anchor': 'end', class: 'muted small' }, '|X_k|'),
      s('text', { x: LEFT, y: H - 1, class: 'muted mono small' }, V.signed(-fft / 2, 0)),
      s('text', { x: W - RIGHT, y: H - 1, 'text-anchor': 'end', class: 'muted mono small' }, V.signed(fft / 2 - 1, 0)));
    const cursor = s('rect', { x: 0, y: 0, width: Math.max(3, px), height: 37, fill: 'none', stroke: '#fbbf24', 'stroke-width': 1.5, opacity: 0 });
    svg.append(cursor);
    const kAt = (ev) => {
      const r = svg.getBoundingClientRect();
      const x = ((ev.clientX - r.left) / r.width) * W;
      return Math.max(-fft / 2, Math.min(fft / 2 - 1, Math.round((x - LEFT) / px - fft / 2 - 0.5)));
    };
    svg.addEventListener('mousemove', (ev) => { const k = kAt(ev); cursor.setAttribute('x', X(k) - Math.max(3, px) / 2); cursor.setAttribute('opacity', 1); cb.onHover(k); });
    svg.addEventListener('mouseleave', () => { cursor.setAttribute('opacity', 0); cb.onHover(null); });
    if (cb.onClick) { svg.style.cursor = 'pointer'; svg.addEventListener('click', (ev) => cb.onClick(kAt(ev), cursor.getBoundingClientRect())); }
    return svg;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
