/* systems/wifi/view-frequency.js — View 1: subcarrier map of one OFDM symbol.
 *
 * Draws every FFT bin of the selected field as data / pilot / DC / null / guard,
 * entirely from the tone map returned by WifiCalc (nothing about the standard is
 * hard-coded here). Index labels and frequency offsets are derived from N_FFT and Δ_F.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;

  const W = 800, LEFT = 44, RIGHT = 14, PW = W - LEFT - RIGHT;
  const BASE = 196, H_DATA = 104, H_PILOT = 128;

  /**
   * @param a     analysis from WifiCalc.analyze
   * @param opts  { field: 'data' | 'legacy', onField(field) }
   */
  V.frequency = function (a, opts) {
    const field = opts.field === 'legacy' ? 'legacy' : 'data';
    const map = field === 'legacy' ? a.legacyTones : a.dataTones;
    const g = root.WifiCalc.generation(a.cfg.gen);
    const fft = map.fft, dfKHz = map.spacingKHz;
    const px = PW / fft;
    const X = (k) => LEFT + (k + fft / 2 + 0.5) * px;
    const fMHz = (k) => (k * dfKHz) / 1000;

    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} 300`, role: 'img',
      'aria-label': `Subcarrier map: ${map.N_SD} data, ${map.N_SP} pilot subcarriers out of ${fft}` });

    // --- 20 MHz subchannels of the pre-HT fields (replicas with phase rotation)
    if (field === 'legacy' && map.subchannels.length > 1) {
      for (const sc of map.subchannels) {
        const x0 = X(sc.centre - 32) - px / 2, x1 = X(sc.centre + 31) + px / 2;
        svg.append(s('rect', { x: x0, y: 34, width: x1 - x0, height: BASE - 34, fill: 'none', stroke: '#2b3a57', 'stroke-dasharray': '4 4' }),
          s('text', { x: (x0 + x1) / 2, y: 28, 'text-anchor': 'middle', class: 'muted' }, `20 MHz · ×${rotationLabel(sc.rotationDeg)}`));
      }
    }

    // --- subcarriers
    const tones = map.tones;
    if (px >= 4) {
      for (const t of tones) svg.append(toneShape(t, X(t.k), px, fMHz(t.k)));
    } else {
      for (const r of V.runs(tones)) if (r.kind !== 'pilot') svg.append(runShape(r, X, px, fMHz));
      for (const t of tones) if (t.kind === 'pilot') svg.append(toneShape(t, X(t.k), px, fMHz(t.k)));
    }

    // --- axis
    svg.append(s('line', { x1: LEFT, x2: W - RIGHT, y1: BASE + 0.5, y2: BASE + 0.5, stroke: '#93a0b8' }));
    const occ = tones.filter((t) => t.kind === 'data' || t.kind === 'pilot').map((t) => t.k);
    const kMin = Math.min(...occ), kMax = Math.max(...occ);
    const cands = [
      { k: -fft / 2, priority: 5 }, { k: fft / 2 - 1, priority: 5 }, { k: 0, priority: 6 },
      { k: kMin, priority: 4 }, { k: kMax, priority: 4 },
    ];
    for (const r of V.runs(tones)) if (r.kind === 'dc' || r.kind === 'null') cands.push({ k: r.from, priority: 2 }, { k: r.to, priority: 2 });
    const labels = V.placeLabels(cands.map((c) => Object.assign(c, { x: X(c.k) })), 44);
    // keep the outermost labels inside the plot (and clear of the axis titles on the left)
    const anchor = (x) => (x < LEFT + 24 ? { x: x - 3, 'text-anchor': 'start' } : x > W - RIGHT - 24 ? { x: x + 3, 'text-anchor': 'end' } : { x, 'text-anchor': 'middle' });
    for (const l of labels) {
      svg.append(s('line', { x1: l.x, x2: l.x, y1: BASE, y2: BASE + 5, stroke: '#93a0b8' }),
        s('text', Object.assign({ y: BASE + 18, class: 'mono' }, anchor(l.x)), V.signed(l.k, 0)),
        s('text', Object.assign({ y: BASE + 33, class: 'muted mono' }, anchor(l.x)), V.signed(fMHz(l.k), 4)));
    }
    svg.append(s('text', { x: LEFT - 8, y: BASE + 18, 'text-anchor': 'end', class: 'muted' }, 'k'),
      s('text', { x: LEFT - 8, y: BASE + 33, 'text-anchor': 'end', class: 'muted' }, 'MHz'));

    // pilot indices above the pilots (when they fit)
    const pilots = tones.filter((t) => t.kind === 'pilot');
    const pilotLabels = V.placeLabels(pilots.map((t) => ({ k: t.k, x: X(t.k), priority: 1 })), 26);
    const pilotsLabelled = pilotLabels.length === pilots.length;
    if (pilotsLabelled) {
      for (const l of pilotLabels) svg.append(s('text', { x: l.x, y: BASE - H_PILOT - 8, 'text-anchor': 'middle', class: 'mono', fill: V.KIND.pilot.color }, V.signed(l.k, 0)));
    }

    // guard brackets
    for (const r of V.runs(tones)) {
      if (r.kind !== 'guard') continue;
      const x0 = X(r.from) - px / 2, x1 = X(r.to) + px / 2, y = BASE + 46;
      svg.append(s('path', { d: `M${x0},${y - 4} V${y} H${x1} V${y - 4}`, fill: 'none', stroke: V.KIND.guard.color }),
        s('text', Object.assign({ y: y + 14, class: 'muted small' }, anchor((x0 + x1) / 2)), `guard ${V.signed(r.from, 0)}…${V.signed(r.to, 0)} (${r.n})`));
    }
    svg.append(s('text', { x: LEFT, y: 290, class: 'muted' }, 'subcarrier index k (top) and frequency offset k·Δ_F from the channel centre (bottom)'));

    // --- header and facts
    const counts = map.counts;
    const chip = (kind, n) => h('span', { class: 'chip' }, h('i', { style: { background: V.KIND[kind].color } }), term(V.KIND[kind].term, V.KIND[kind].label), ' ' + n);
    // fields that use this plan (the PE field carries no subcarrier data of its own)
    const fieldNames = g.fields.filter((f) => (field === 'legacy' ? f.toneplan === 'legacy' : f.toneplan !== 'legacy' && f.kind !== 'pe')).map((f) => f.name);
    const head = h('div', { class: 'view-head' },
      h('h2', null, 'Subcarrier map — ', field === 'legacy' ? 'pre-HT fields' : 'Data field'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Field' },
        h('button', { type: 'button', 'aria-pressed': String(field === 'data'), onclick: () => opts.onField('data') }, 'Data field'),
        h('button', { type: 'button', 'aria-pressed': String(field === 'legacy'), onclick: () => opts.onField('legacy') }, 'Pre-HT fields (L-STF … SIG)')));
    const chips = h('div', { class: 'chips' },
      chip('data', counts.data), chip('pilot', counts.pilot), chip('dc', counts.dc),
      counts.null ? chip('null', counts.null) : null, chip('guard', counts.guard));

    const occupiedMHz = ((kMax - kMin + 1) * dfKHz) / 1000;
    const facts = h('div', { class: 'formula' },
      term('FFT size'), ` = ${fft}   ·   `, term('Δ_F'), ` = ${fmt(dfKHz, 3)} kHz   →   ${fft} × ${fmt(dfKHz, 3)} kHz = ${fmt((fft * dfKHz) / 1000, 3)} MHz `, term('Channel bandwidth', 'channel'), '   ·   ',
      term('N_SD'), ` = ${map.N_SD}, `, term('N_SP'), ` = ${map.N_SP}, `, term('N_ST'), ` = ${map.N_ST}   ·   used subcarriers ${V.signed(kMin, 0)}…${V.signed(kMax, 0)} span ${fmt(occupiedMHz, 4)} MHz`,
      pilotsLabelled ? null : [h('br'), term('Pilot subcarrier', 'pilots'), ' at k = ', pilots.map((t) => V.signed(t.k, 0)).join(', ')],
      counts.null ? [h('br'), term('Null subcarrier', 'null'), ' subcarriers ', V.runs(tones).filter((r) => r.kind === 'null').map((r) => `${V.signed(r.from, 0)}…${V.signed(r.to, 0)}`).join(', '), ': the centre of each 80 MHz half'] : null);

    const explain = h('div', { class: 'explain' },
      h('p', null, 'Each bar is one ', term('Subcarrier', 'subcarrier'), ' of a single ', term('OFDM symbol', 'OFDM symbol'),
        '. Data subcarriers carry one constellation point each; pilots carry known values for phase tracking; the ',
        term('DC subcarrier', 'DC'), ' and the ', term('Guard subcarriers', 'guard'), ' subcarriers stay empty.'),
      field === 'legacy'
        ? h('p', null, map.subchannels.length > 1
          ? 'These fields repeat the 20 MHz Non-HT plan in every 20 MHz subchannel, each copy multiplied by its own phase rotation.'
          : 'At 20 MHz the pre-HT fields use the same 52-subcarrier plan as a Non-HT Data field.',
          ' Fields using this plan: ', fieldNames.join(', '), '.')
        : h('p', null, 'Fields using this plan: ', fieldNames.join(', '),
          fieldNames.some((n) => /STF/.test(n)) ? ' (the short training fields put energy on only a subset of these subcarriers)' : '',
          '. Click the OFDM symbol step above to see the same symbol in time.'));

    return h('div', null, head, chips, h('div', { style: { margin: '8px 0' } }, svg), facts, explain);
  };

  function rotationLabel(deg) {
    return { 0: '1', 90: 'j', 180: '−1', 270: '−j' }[((deg % 360) + 360) % 360] || deg + '°';
  }

  function toneShape(t, x, px, f) {
    const k = V.KIND[t.kind];
    const title = s('title', null, `k = ${V.signed(t.k, 0)} · ${V.signed(f, 4)} MHz · ${k.term.toLowerCase()}`);
    const w = Math.max(1.5, px * 0.55);
    if (t.kind === 'data') return s('rect', { x: x - w / 2, y: BASE - H_DATA, width: w, height: H_DATA, fill: k.color }, title);
    if (t.kind === 'pilot') {
      return s('g', null, title,
        s('rect', { x: x - w / 2, y: BASE - H_PILOT, width: w, height: H_PILOT, fill: k.color }),
        px >= 4 ? s('circle', { cx: x, cy: BASE - H_PILOT, r: Math.min(4, px / 2), fill: k.color }) : null);
    }
    if (t.kind === 'dc') return s('circle', { cx: x, cy: BASE - 6, r: Math.max(2, Math.min(4, px / 2.5)), fill: 'none', stroke: k.color, 'stroke-width': 1.6 }, title);
    return s('line', { x1: x, x2: x, y1: BASE - 12, y2: BASE, stroke: k.color, 'stroke-width': Math.max(1, Math.min(2, px * 0.4)) }, title);
  }

  function runShape(r, X, px, fMHz) {
    const k = V.KIND[r.kind];
    const x0 = X(r.from) - px / 2, x1 = X(r.to) + px / 2;
    const title = s('title', null, `k = ${V.signed(r.from, 0)} … ${V.signed(r.to, 0)} (${r.n}) · ${V.signed(fMHz(r.from), 4)} … ${V.signed(fMHz(r.to), 4)} MHz · ${k.term.toLowerCase()}`);
    if (r.kind === 'data') return s('rect', { x: x0, y: BASE - H_DATA, width: Math.max(1, x1 - x0), height: H_DATA, fill: k.color, opacity: 0.85 }, title);
    return s('rect', { x: x0, y: BASE - 12, width: Math.max(1.5, x1 - x0), height: 12, fill: k.color }, title);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
