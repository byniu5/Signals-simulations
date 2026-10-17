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

  /** Frequency-domain values of one Data-field OFDM symbol (deterministic per configuration and index). */
  V.symbolValues = function (a, index) {
    const p = a.params;
    const rand = Dsp.rng(Dsp.seedFrom(JSON.stringify([a.cfg.gen, a.cfg.bw, a.cfg.mod, a.cfg.nss, index])));
    const pts = Dsp.constellation(p.N_BPSCS);
    return a.dataTones.tones.map((t) => ({
      k: t.k, kind: t.kind,
      z: t.kind === 'data' ? pts[Math.floor(rand() * pts.length)] : t.kind === 'pilot' ? { re: 1, im: 0 } : null,
    }));
  };

  /**
   * @param opts { index (1..N_SYM), onIndex(i), onZoomIn(rect) }
   */
  V.symbol = function (a, opts) {
    const p = a.params, N = p.N_FFT, nSym = a.symbols.N_SYM;
    const index = Math.min(Math.max(1, opts.index || 1), nSym);
    const values = V.symbolValues(a, index);

    // IFFT with M-times oversampling: bin k of an N·M-point IFFT, negative k wrap around.
    const M = Math.max(1, Math.ceil(1024 / N)), L = N * M;
    const re = new Float64Array(L), im = new Float64Array(L);
    for (const v of values) if (v.z) { const i = (v.k + L) % L; re[i] = v.z.re; im[i] = v.z.im; }
    Dsp.fft(re, im, true);
    const cp = Math.round((L * p.T_GI_ns) / p.T_DFT_ns);             // samples in the guard interval
    const wave = [...Array.from(re.slice(L - cp)), ...Array.from(re)];  // cyclic prefix + useful part
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

    // --- constellation of this symbol
    const cons = s('svg', { class: 'diagram constellation', viewBox: '0 0 220 220', role: 'img', 'aria-label': 'Constellation points of this symbol' },
      s('line', { x1: 10, x2: 210, y1: 110, y2: 110, stroke: '#2b3a57' }), s('line', { x1: 110, x2: 110, y1: 10, y2: 210, stroke: '#2b3a57' }));
    const used = values.filter((v) => v.z);
    const lim = Math.max(1.2, ...used.map((v) => Math.max(Math.abs(v.z.re), Math.abs(v.z.im)))) * 1.1;
    for (const v of used) {
      const c = v.kind === 'pilot' ? V.KIND.pilot.color : V.KIND.data.color;
      cons.append(s('circle', { cx: 110 + (v.z.re / lim) * 98, cy: 110 - (v.z.im / lim) * 98, r: v.kind === 'pilot' ? 4 : 2.6, fill: c },
        s('title', null, `k = ${V.signed(v.k, 0)}: ${fmt(v.z.re, 3)} ${v.z.im < 0 ? '−' : '+'} j${fmt(Math.abs(v.z.im), 3)}`)));
    }

    // --- header, stepper, explanation
    const step = (d) => opts.onIndex(Math.min(nSym, Math.max(1, index + d)));
    const head = h('div', { class: 'view-head' },
      h('h2', null, 'One ', term('OFDM symbol', 'OFDM symbol'), ' in time — Data field'),
      h('div', { class: 'chips' },
        h('button', { type: 'button', onclick: () => step(-1), disabled: index <= 1, 'aria-label': 'Previous symbol' }, '◀'),
        h('span', { class: 'chip mono' }, `symbol ${index} of ${nSym}`),
        h('button', { type: 'button', onclick: () => step(1), disabled: index >= nSym, 'aria-label': 'Next symbol' }, '▶')));

    const cpSamples = (p.T_GI_ns / 1000) * fsMHz, fftSamples = (p.T_DFT_ns / 1000) * fsMHz;
    const facts = h('div', { class: 'formula' },
      'sample rate = ', term('FFT size', root.Dom.sym('N_FFT')), ' · ', term('Δ_F'), ` = ${N} × ${fmt(p.spacingKHz, 3)} kHz = ${fmt(fsMHz, 3)} Msample/s  →  `,
      term('Guard interval', 'GI'), ` = ${fmt(cpSamples, 2)} samples, useful part = ${fmt(fftSamples, 2)} samples`);

    const side = h('div', null, cons,
      h('p', { class: 'muted small' }, 'Points sent in this symbol: ', a.dataTones.N_SD, ' data subcarriers (',
        term('Constellation mapping', a.cfg.mod), ') and ', a.dataTones.N_SP, ' pilots (amber). Each point is the complex amplitude of one subcarrier.'));

    const explain = h('div', { class: 'explain' },
      h('p', null, 'The ', term('IFFT', 'IFFT'), ' turns the ', a.dataTones.N_ST, ' subcarrier values into ', N,
        ' time samples lasting ', h('span', { class: 'mono' }, V.us(p.T_DFT_ns) + ' µs'), ' = 1/', root.Dom.sym('Δ_F'), '. Then the last ',
        h('span', { class: 'mono' }, V.us(p.T_GI_ns) + ' µs'), ' is copied in front as the ', term('Cyclic prefix', 'cyclic prefix'), '.'),
      h('p', null, 'Why: echoes shorter than the guard interval only smear into the prefix, and inside the receiver\'s FFT window the channel then acts on each subcarrier as a single complex gain — corrected with one division per subcarrier.'),
      h('p', { class: 'muted small' }, 'Illustration: the constellation points are random (same for the same symbol index); pilots are drawn as +1 although the standard changes their sign from symbol to symbol. Click the blue useful part to zoom into its subcarriers.'));

    return h('div', null, head, svg, h('div', { class: 'symbol-grid' }, h('div', null, facts, explain), side));
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
