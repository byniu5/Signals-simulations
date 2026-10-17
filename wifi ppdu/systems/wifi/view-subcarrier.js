/* systems/wifi/view-subcarrier.js — the deepest zoom level: one subcarrier of one OFDM symbol.
 *
 *  - its wave  z · exp(j2π k Δ_F t)  over T_DFT (exactly k cycles), and the guard interval
 *    as the same sinusoid continued — which is why the cyclic prefix is a seamless copy;
 *  - its constellation point and the bits that select it (mapping table from the data file),
 *    with bit toggles;
 *  - "build the symbol": the sum of the first n subcarriers, equal to the symbol waveform at n = N_ST;
 *  - orthogonality: the product of two subcarriers averages to zero over T_DFT.
 * The subcarrier values are the same as in the symbol view (WifiWave.symbolValues).
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;
  const Wv = () => root.WifiWave;

  const W = 800, LEFT = 46, RIGHT = 16, PW = W - LEFT - RIGHT;
  const edits = new Map(); // bit flips made by the user, per (configuration, symbol, subcarrier)

  /** Mapping table for a modulation (BPSK…64-QAM supported, 256/1024-QAM unverified), with its data entry. */
  function mappingFor(mod) {
    const BL = root.WifiCalc.data.bitLevel;
    if (BL.constellationMapping.value[mod]) return { table: BL.constellationMapping.value[mod], entry: BL.constellationMapping };
    return { table: BL.constellationMappingHigh.value[mod], entry: BL.constellationMappingHigh };
  }
  const kmod = (mod) => 1 / Math.sqrt(root.WifiCalc.data.bitLevel.meanEnergy.value[mod]);
  /** bits → point, from the table. */
  function pointOf(bits, mod) {
    const { table } = mappingFor(mod), k = kmod(mod);
    const m = table.Q ? bits.length / 2 : bits.length;
    return { re: k * table.I[bits.slice(0, m)], im: table.Q ? k * table.Q[bits.slice(m)] : 0 };
  }
  /** point → bits (inverse lookup in the table). */
  function bitsOf(z, mod) {
    const { table } = mappingFor(mod), k = kmod(mod);
    const find = (axis, x) => Object.keys(axis).find((b) => axis[b] === Math.round(x / k));
    return find(table.I, z.re) + (table.Q ? find(table.Q, z.im) : '');
  }

  /**
   * @param nav  { sym, sc }
   * @param cb   { navigate(patch, rect, replace) }
   */
  V.subcarrier = function (a, nav, cb) {
    const p = a.params, g = Wv().grid(a), mod = a.cfg.mod;
    const fft = a.dataTones.fft, k = nav.sc;
    const base = Wv().symbolValues(a, nav.sym);
    const key = JSON.stringify([a.cfg, nav.sym]);
    const values = base.map((v) => (edits.has(key + '|' + v.k) ? Object.assign({}, v, { z: pointOf(edits.get(key + '|' + v.k), mod), edited: true }) : v));
    const v = values.find((x) => x.k === k) || { k, kind: 'guard', z: null };
    const used = Wv().usedInOrder(values);
    const state = { showIm: false, n: used.length, k2: null };
    const root_ = h('div');

    function draw() {
      const wave = wavePlot();
      root_.replaceChildren(header(), wave.plot, h('div', { class: 'sc-grid' }, h('div', null, wave.text), pointPanel()), buildPanel(), orthoPanel());
    }

    /* ---------- header ---------- */
    function header() {
      const fMHz = (k * p.spacingKHz) / 1000;
      const ord = v.kind === 'data' ? values.filter((x) => x.kind === 'data' && x.k <= k).length : null;
      const step = (d) => cb.navigate({ sc: k + d }, null, true);
      return h('div', { class: 'view-head' },
        h('h2', null, 'Subcarrier ', h('span', { class: 'mono' }, `k = ${V.signed(k, 0)}`), ` of symbol ${nav.sym}`),
        h('div', { class: 'chips' },
          h('span', { class: 'chip' }, h('i', { style: { background: V.KIND[v.kind].color } }), term(V.KIND[v.kind].term, V.KIND[v.kind].label), ord ? ` #${ord} of ${p.N_SD}` : ''),
          h('span', { class: 'chip mono' }, `${V.signed(fMHz, 4)} MHz`),
          h('button', { type: 'button', onclick: () => step(-1), disabled: k <= -fft / 2, 'aria-label': 'Previous subcarrier' }, '◀'),
          h('button', { type: 'button', onclick: () => step(1), disabled: k >= fft / 2 - 1, 'aria-label': 'Next subcarrier' }, '▶')));
    }

    /* ---------- C1: the wave of this subcarrier ---------- */
    function wavePlot() {
      const H = 250, MID = 120, AMP = 84;
      const T_GI = p.T_GI_ns, T = p.T_DFT_ns, span = T_GI + T;
      const xt = (ns) => LEFT + ((ns + T_GI) / span) * PW; // t from −T_GI to T_DFT
      const maxAmp = Math.max(1, ...Wv().symbolValues(a, nav.sym).filter((x) => x.z).map((x) => Math.hypot(x.z.re, x.z.im)));
      const y = (val) => MID - (val / maxAmp) * AMP;
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Wave of subcarrier ${k}` });
      svg.append(
        s('rect', { x: xt(-T_GI), y: MID - AMP - 14, width: xt(0) - xt(-T_GI), height: 2 * AMP + 28, fill: V.GI, opacity: 0.16 }),
        s('rect', { x: xt(0), y: MID - AMP - 14, width: xt(T) - xt(0), height: 2 * AMP + 28, fill: '#38bdf8', opacity: 0.06 }),
        s('rect', { x: xt(T - T_GI), y: MID - AMP - 14, width: xt(T) - xt(T - T_GI), height: 2 * AMP + 28, fill: 'none', stroke: V.GI, 'stroke-dasharray': '5 4' }),
        s('line', { x1: LEFT, x2: W - RIGHT, y1: MID, y2: MID, stroke: '#2b3a57' }),
        s('text', { x: LEFT - 8, y: MID + 4, 'text-anchor': 'end', class: 'muted' }, 'Re'));
      // cycle boundaries inside T_DFT
      const ak = Math.abs(k);
      if (v.z && ak > 0 && ak <= 48) for (let c = 0; c <= ak; c++) {
        const x = xt((c * T) / ak);
        svg.append(s('line', { x1: x, x2: x, y1: MID - AMP - 14, y2: MID - AMP - 4, stroke: '#a7b2c6' }));
      }
      const curve = (fn, color, dash) => {
        const n = Math.max(800, ak * 24), pts = [];
        for (let i = 0; i <= n; i++) {
          const t = -T_GI + (i / n) * span;
          pts.push(`${xt(t).toFixed(1)},${y(fn(t)).toFixed(2)}`);
        }
        return s('polyline', { points: pts.join(' '), fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-dasharray': dash || null });
      };
      const z = v.z || { re: 0, im: 0 };
      const ph = (t) => (2 * Math.PI * k * t) / T; // 2π k Δ_F t  with Δ_F = 1 / T_DFT
      svg.append(curve((t) => z.re * Math.cos(ph(t)) - z.im * Math.sin(ph(t)), V.KIND[v.kind].color));
      if (state.showIm) svg.append(curve((t) => z.re * Math.sin(ph(t)) + z.im * Math.cos(ph(t)), '#a78bfa', '6 4'));
      // axis
      const dim = (x0, x1, yy, label) => [s('path', { d: `M${x0},${yy - 5} V${yy + 5} M${x0},${yy} H${x1} M${x1},${yy - 5} V${yy + 5}`, stroke: '#a7b2c6', fill: 'none' }),
        s('text', { x: (x0 + x1) / 2, y: yy + 17, 'text-anchor': 'middle' }, label)];
      svg.append(...dim(xt(-T_GI), xt(0), MID + AMP + 26, `GI ${V.us(T_GI)} µs`), ...dim(xt(0), xt(T), MID + AMP + 26, `T_DFT = 1/Δ_F = ${V.us(T)} µs`));
      svg.append(s('text', { x: LEFT, y: 14, class: 'muted small' }, v.z
        ? (ak ? `exactly ${ak} cycle${ak > 1 ? 's' : ''} in T_DFT${ak <= 48 ? ' (ticks above)' : ''}${k < 0 ? ' — negative k: same frequency, turning the other way (see Im)' : ''}` : 'k = 0: a constant')
        : 'zero amplitude: nothing is sent on this subcarrier'));
      const gi = v.z && ak ? `The guard interval (orange) is the same sinusoid continued backwards. Because T_DFT holds a whole number of cycles, it equals the last ${V.us(T_GI)} µs of the useful part (dashed) — the cyclic prefix is a seamless copy.` : '';
      // many cycles do not resolve at this width: magnify a few cycles around the GI / useful-part boundary
      let mag = null;
      if (v.z && ak > 40) {
        const span2 = (4 * T) / ak, t0 = -span2 / 2, MH = 120, MM = 60, MA = 44;
        const xm = (t) => LEFT + ((t - t0) / span2) * PW;
        const ym = (val) => MM - (val / maxAmp) * MA;
        const pts = [];
        for (let i = 0; i <= 600; i++) { const t = t0 + (i / 600) * span2; pts.push(`${xm(t).toFixed(1)},${ym(z.re * Math.cos(ph(t)) - z.im * Math.sin(ph(t))).toFixed(2)}`); }
        mag = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${MH}`, role: 'img', 'aria-label': 'Four cycles around the start of the useful part' },
          s('rect', { x: xm(t0), y: 6, width: xm(0) - xm(t0), height: MH - 26, fill: V.GI, opacity: 0.16 }),
          s('rect', { x: xm(0), y: 6, width: xm(t0 + span2) - xm(0), height: MH - 26, fill: '#38bdf8', opacity: 0.06 }),
          s('line', { x1: LEFT, x2: W - RIGHT, y1: MM, y2: MM, stroke: '#2b3a57' }),
          s('polyline', { points: pts.join(' '), fill: 'none', stroke: V.KIND[v.kind].color, 'stroke-width': 2 }),
          s('text', { x: xm(0), y: MH - 6, 'text-anchor': 'middle', class: 'muted small' }, 't = 0: end of the GI, start of T_DFT'),
          s('text', { x: LEFT, y: MH - 6, class: 'muted small' }, `zoom ×${fmt(span / span2, 0)}: 4 cycles (${fmt(span2 / 1000, 4)} µs)`));
      }
      return {
        plot: h('div', null, svg, mag,
          h('div', { class: 'chips small' },
            h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: state.showIm, onchange: (e) => { state.showIm = e.target.checked; draw(); } }), ' show Im (dashed)'),
            h('span', { class: 'muted' }, `z · e^{j2π·${V.signed(k, 0)}·Δ_F·t},  Δ_F = ${fmt(p.spacingKHz, 3)} kHz`))),
        text: h('div', { class: 'explain' },
          h('p', null, `This subcarrier is one sinusoid at ${V.signed((k * p.spacingKHz) / 1000, 4)} MHz from the channel centre, multiplied by its complex value z (amplitude and phase). Its frequency is k · Δ_F, so it completes exactly |k| = ${Math.abs(k)} cycles in T_DFT = 1/Δ_F.`),
          gi ? h('p', null, gi) : null,
          h('p', { class: 'small muted' }, 'The receiver\'s FFT window covers only T_DFT (blue), so it sees exactly whole cycles of every subcarrier — the reason they do not interfere (see the last panel).')),
      };
    }

    /* ---------- C2 / C5: the point, the bits, the honest cases ---------- */
    function pointPanel() {
      const S = 220, c = S / 2, grid = root.Dsp.constellation(p.N_BPSCS);
      const lim = 1.25 * Math.max(...grid.map((q) => Math.max(Math.abs(q.re), Math.abs(q.im))));
      const X = (re) => c + (re / lim) * (c - 14), Y = (im) => c - (im / lim) * (c - 14);
      const svg = s('svg', { class: 'diagram constellation', viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': 'Constellation point of this subcarrier' },
        s('line', { x1: 8, x2: S - 8, y1: c, y2: c, stroke: '#3b4a66' }), s('line', { x1: c, x2: c, y1: 8, y2: S - 8, stroke: '#3b4a66' }),
        s('text', { x: S - 10, y: c - 6, 'text-anchor': 'end', class: 'muted small' }, 'I'), s('text', { x: c + 6, y: 16, class: 'muted small' }, 'Q'));
      const r = grid.length > 256 ? 1.2 : grid.length > 64 ? 1.8 : 3;
      for (const q of grid) svg.append(s('circle', { cx: X(q.re), cy: Y(q.im), r, fill: 'none', stroke: '#3b4a66' }));
      const body = [];
      if (v.kind === 'data') {
        const bits = bitsOf(v.z, mod);
        const orig = base.find((x) => x.k === k).z;
        if (v.edited) svg.append(s('circle', { cx: X(orig.re), cy: Y(orig.im), r: r + 3, fill: 'none', stroke: '#a7b2c6', 'stroke-dasharray': '2 2' }));
        svg.append(s('circle', { cx: X(v.z.re), cy: Y(v.z.im), r: r + 3.5, fill: V.KIND.data.color, stroke: '#ffffff', 'stroke-width': 1.5 }));
        const { table, entry } = mappingFor(mod);
        const m = table.Q ? bits.length / 2 : bits.length;
        const flip = (i) => {
          const nb = bits.slice(0, i) + (bits[i] === '1' ? '0' : '1') + bits.slice(i + 1);
          edits.set(key + '|' + k, nb);
          refresh();
        };
        body.push(
          h('div', { class: 'small muted' }, `${p.N_BPSCS} coded bit${p.N_BPSCS > 1 ? 's' : ''} choose this point (`, term('Constellation mapping', mod), '):'),
          h('div', { class: 'bit-row' }, [...bits].map((b, i) => h('button', { type: 'button', class: 'bit ' + (i < m ? 'bi' : 'bq'), title: `b${i} (${i < m ? 'I' : 'Q'}) — click to flip`, onclick: () => flip(i) },
            h('span', null, b), h('small', null, `b${i}`)))),
          h('div', { class: 'small muted' }, table.Q ? `b0…b${m - 1} → I, b${m}…b${2 * m - 1} → Q` : 'b0 → I', ' · first bit of each axis = sign (0 → negative)'),
          h('div', { class: 'formula' }, `I = ${fmt(v.z.re, 4)}, Q = ${fmt(v.z.im, 4)}  (levels ${table.I[bits.slice(0, m)]}${table.Q ? `, ${table.Q[bits.slice(m)]}` : ''} × K_MOD ${fmt(kmod(mod), 4)})`),
          h('div', { class: 'small' }, 'Mapping table ', h('span', { class: 'badge ' + entry.status, title: entry.note }, entry.status), ' ',
            v.edited ? h('button', { type: 'button', class: 'small-btn', onclick: () => { edits.delete(key + '|' + k); refresh(); } }, 'undo my flips') : null),
          h('p', { class: 'small muted' }, 'In a real transmitter these are N_BPSCS consecutive coded bits after the interleaver (see Transmitter → receiver). The symbol view draws random points, so the bits are read back from the point here. Flipping a bit moves the point and changes the wave — and the symbol below.'));
      } else if (v.kind === 'pilot') {
        svg.append(s('circle', { cx: X(1), cy: Y(0), r: r + 3.5, fill: V.KIND.pilot.color, stroke: '#ffffff', 'stroke-width': 1.5 }));
        body.push(h('p', null, term('Pilot subcarrier', 'Pilot'), ': a known value, drawn as +1 — no data bits.'),
          h('p', { class: 'small muted' }, 'The standard changes the sign of the pilots from symbol to symbol (a pilot polarity sequence); that table is not in the data file yet, so +1 is shown.'));
      } else {
        body.push(h('p', null, term(V.KIND[v.kind].term, V.KIND[v.kind].label), ' subcarrier: ', h('b', null, 'zero amplitude'), ' — nothing is transmitted here, so its wave is a flat line.'),
          h('p', { class: 'small muted' }, v.kind === 'dc' ? 'Left empty because a direct-conversion receiver has DC offset and LO leakage exactly at the centre.'
            : v.kind === 'guard' ? 'Left empty at the band edges to keep the spectrum inside the mask.' : 'Left empty at the centre of each 80 MHz half.'));
      }
      return h('figure', { class: 'cons-fig' }, svg, ...body);
    }

    /* ---------- C3: build the symbol from its subcarriers ---------- */
    let acc = null, accN = 0;
    function partial(n) {
      if (!acc || n < accN) { acc = Wv().partialSum(g, values, 0); accN = 0; }
      for (let i = accN; i < Math.min(n, used.length); i++) Wv().toneWave(g, used[i].k, used[i].z, acc);
      accN = Math.min(n, used.length);
      return acc;
    }
    function buildPanel() {
      const full = Wv().symbolWaveform(g, values);
      const H = 190, MID = 92, AMP = 72;
      const peak = full.re.reduce((m, x) => Math.max(m, Math.abs(x)), 0) || 1;
      const len = g.cp + g.L, step = Math.max(1, Math.floor(len / 1400));
      const path = (arr) => { const pts = []; for (let i = 0; i < len; i += step) pts.push(`${(LEFT + (i / (len - 1)) * PW).toFixed(1)},${(MID - (arr[i] / peak) * AMP).toFixed(1)}`); return pts.join(' '); };
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Sum of the first n subcarriers' },
        s('rect', { x: LEFT, y: MID - AMP - 8, width: (g.cp / len) * PW, height: 2 * AMP + 16, fill: V.GI, opacity: 0.14 }),
        s('line', { x1: LEFT, x2: W - RIGHT, y1: MID, y2: MID, stroke: '#2b3a57' }),
        s('polyline', { points: path(full.re), fill: 'none', stroke: '#64748b', 'stroke-width': 1.2, opacity: 0.8 }));
      const sumLine = s('polyline', { fill: 'none', stroke: '#38bdf8', 'stroke-width': 1.6 });
      const toneLine = s('polyline', { fill: 'none', stroke: '#fbbf24', 'stroke-width': 1.6, opacity: 0.9 });
      svg.append(sumLine, toneLine, s('text', { x: LEFT - 8, y: MID + 4, 'text-anchor': 'end', class: 'muted' }, 'Re'));
      toneLine.setAttribute('points', path(Wv().toneWave(g, k, v.z).re));
      const label = h('div', { class: 'small' });
      const slider = h('input', { type: 'range', min: 0, max: used.length, step: 1, value: state.n, 'aria-label': 'Number of subcarriers added', oninput: (e) => setN(Number(e.target.value)) });
      function setN(n) {
        state.n = n;
        const sum = partial(n);
        sumLine.setAttribute('points', path(sum.re));
        let diff = 0;
        if (n === used.length) for (let i = 0; i < len; i++) diff = Math.max(diff, Math.abs(sum.re[i] - full.re[i]), Math.abs(sum.im[i] - full.im[i]));
        const last = used[n - 1];
        label.replaceChildren(`n = ${n} of ${used.length} subcarriers`, n ? ` (k = ${V.signed(used[0].k, 0)} … ${V.signed(last.k, 0)})` : '',
          n === used.length ? h('b', null, ` — equals the symbol waveform (largest difference ${diff.toExponential(1)})`) : '');
        slider.value = n;
      }
      setN(state.n);
      let raf = 0;
      const play = () => {
        cancelAnimationFrame(raf);
        if (matchMedia('(prefers-reduced-motion: reduce)').matches) { setN(used.length); return; }
        const t0 = performance.now(), dur = 3000;
        const frame = (now) => { const f = Math.min(1, (now - t0) / dur); setN(Math.round(f * used.length)); if (f < 1 && root_.isConnected) raf = requestAnimationFrame(frame); };
        raf = requestAnimationFrame(frame);
      };
      return h('section', { class: 'sub-panel' },
        h('div', { class: 'view-head' }, h('h3', null, 'Build the symbol'), h('button', { type: 'button', class: 'play', onclick: play }, '▶ add them one by one')),
        svg, h('label', { class: 'ctl slider' }, slider), label,
        h('div', { class: 'chips small' },
          h('span', { class: 'chip' }, h('i', { style: { background: '#38bdf8' } }), 'sum of the first n subcarriers'),
          h('span', { class: 'chip' }, h('i', { style: { background: '#64748b' } }), 'the symbol (time view)'),
          h('span', { class: 'chip' }, h('i', { style: { background: '#fbbf24' } }), `subcarrier ${V.signed(k, 0)} alone`)),
        h('p', { class: 'small muted' }, 'The IFFT is exactly this sum: every subcarrier contributes one sinusoid, and the symbol is all of them added. Order: ascending k.'));
    }

    /* ---------- C6: orthogonality ---------- */
    function orthoPanel() {
      const others = values.filter((x) => x.z && x.k !== k);
      if (!others.length) return null;
      if (state.k2 === null || !values.some((x) => x.k === state.k2)) state.k2 = (others.find((x) => x.k > k) || others[0]).k;
      const k2 = state.k2, T = p.T_DFT_ns;
      const H = 150, MID = 72, AMP = 56, n = 1200;
      const f = (t) => Math.cos((2 * Math.PI * k * t) / T) * Math.cos((2 * Math.PI * k2 * t) / T);
      const x = (t) => LEFT + (t / T) * PW;
      let sum = 0;
      const posPts = [], negPts = [];
      for (let i = 0; i <= n; i++) {
        const t = (i / n) * T, val = f(t);
        sum += val * (i === 0 || i === n ? 0.5 : 1);
        posPts.push(`${x(t).toFixed(1)},${(MID - Math.max(0, val) * AMP).toFixed(1)}`);
        negPts.push(`${x(t).toFixed(1)},${(MID - Math.min(0, val) * AMP).toFixed(1)}`);
      }
      const mean = sum / n;
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Product of two subcarriers' },
        s('polygon', { points: `${x(0)},${MID} ${posPts.join(' ')} ${x(T)},${MID}`, fill: '#34d399', opacity: 0.35 }),
        s('polygon', { points: `${x(0)},${MID} ${negPts.join(' ')} ${x(T)},${MID}`, fill: '#f87171', opacity: 0.35 }),
        s('line', { x1: LEFT, x2: W - RIGHT, y1: MID, y2: MID, stroke: '#a7b2c6' }),
        s('text', { x: LEFT, y: H - 6, class: 'muted small' }, `0 … T_DFT = ${V.us(T)} µs`));
      const pick = h('select', { onchange: (e) => { state.k2 = Number(e.target.value); draw(); }, 'aria-label': 'Second subcarrier' },
        [...others].sort((x, y) => Math.abs(x.k - k) - Math.abs(y.k - k)).slice(0, 400).sort((x, y) => x.k - y.k) // the 400 nearest to k
          .map((o) => h('option', { value: o.k, selected: o.k === k2 }, `k = ${V.signed(o.k, 0)}`)));
      return h('section', { class: 'sub-panel' },
        h('div', { class: 'view-head' }, h('h3', null, 'Why subcarriers do not disturb each other'), h('label', { class: 'small' }, 'second subcarrier ', pick)),
        svg,
        h('p', { class: 'small' }, `cos(2π·${V.signed(k, 0)}·Δ_F·t) × cos(2π·${V.signed(k2, 0)}·Δ_F·t): the green and red areas are equal, so the average over T_DFT is `,
          h('b', { class: 'mono' }, fmt(Math.abs(mean) < 5e-4 ? 0 : mean, 4)),
          Math.abs(k2) === Math.abs(k) ? ' (same frequency: ½)' : ' — zero. The receiver\'s FFT measures each subcarrier with this kind of product, so the others contribute nothing (they are orthogonal over T_DFT).'));
    }

    function refresh() { cb.navigate({}, null, true); }

    draw();
    return root_;
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
