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
   * @param opts  { field: 'data' | 'legacy', onField(field), ru: RU size | null, onRu(size),
   *                windowStart: first k of the zoom window | null, onWindow(k) }
   */
  V.frequency = function (a, opts) {
    const C = root.WifiCalc;
    const field = opts.field === 'legacy' ? 'legacy' : 'data';
    const map = field === 'legacy' ? a.legacyTones : a.dataTones;
    const g = C.generation(a.cfg.gen);
    const pre = a.cfg.gen === 'HE' ? 'pre-HE' : 'pre-HT';
    const legacyFields = g.fields.filter((f) => f.toneplan === 'legacy').map((f) => f.name);
    // RU overlay: HE Data-field plan only (an illustration of HE MU / HE TB PPDUs)
    const ruSizes = a.cfg.gen === 'HE' && field === 'data' ? C.ruSizes(a.cfg.bw) : [];
    const ruSize = ruSizes.includes(opts.ru) ? opts.ru : null;
    const rus = ruSize ? C.ruLayout(a.cfg.bw, ruSize) : [];
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

    // --- resource units (behind the subcarriers)
    if (rus.length) {
      const RU_FILL = ['#38bdf8', '#a78bfa'];
      const centres = [];
      rus.forEach((ru, i) => {
        for (const [k0, k1] of ru.ranges) {
          const x0 = X(k0) - px / 2, x1 = X(k1) + px / 2;
          svg.append(s('rect', { x: x0, y: 34, width: Math.max(1, x1 - x0), height: BASE - 34, fill: RU_FILL[i % 2], opacity: 0.16, stroke: RU_FILL[i % 2], 'stroke-opacity': 0.6 },
            s('title', null, `RU ${ru.index} (${ru.tones} tones): k = ${ru.ranges.map(([p, q]) => `${V.signed(p, 0)}…${V.signed(q, 0)}`).join(' and ')}`)));
        }
        const ks = ru.ranges.flatMap(([p, q]) => [p, q]);
        centres.push({ x: X((Math.min(...ks) + Math.max(...ks)) / 2), priority: 0, label: String(ru.index) });
      });
      for (const l of V.placeLabels(centres, 16)) svg.append(s('text', { x: l.x, y: 28, 'text-anchor': 'middle', class: 'mono small' }, l.label));
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

    // guard and DC brackets (the DC subcarriers are listed one by one when there are only a few)
    for (const r of V.runs(tones)) {
      if (r.kind !== 'guard' && r.kind !== 'dc') continue;
      const x0 = X(r.from) - px / 2, x1 = X(r.to) + px / 2, y = BASE + 46;
      const label = r.kind === 'guard' ? `guard ${V.signed(r.from, 0)}…${V.signed(r.to, 0)} (${r.n})`
        : r.n <= 5 ? `DC (${Array.from({ length: r.n }, (_, i) => V.signed(r.from + i, 0)).join(', ')})` : `DC ${V.signed(r.from, 0)}…${V.signed(r.to, 0)} (${r.n})`;
      svg.append(s('path', { d: `M${x0},${y - 4} V${y} H${x1} V${y - 4}`, fill: 'none', stroke: V.KIND[r.kind].color }),
        s('text', Object.assign({ y: y + 14, class: 'muted small' }, anchor((x0 + x1) / 2)), label));
    }

    // zoom window: when one bar per subcarrier does not fit, show 64 subcarriers at a time below
    const WIN = 64;
    const needWindow = px < 4;
    const k0 = needWindow ? Math.max(-fft / 2, Math.min(fft / 2 - WIN, opts.windowStart ?? -WIN / 2)) : null;
    if (needWindow) {
      svg.append(s('rect', { x: X(k0) - px / 2, y: 30, width: WIN * px, height: BASE - 26, fill: 'rgba(230,234,242,.06)', stroke: '#e6eaf2', 'stroke-width': 1.2, 'stroke-dasharray': '4 3', 'pointer-events': 'none' }));
      // click anywhere on the overview to centre the zoom window there
      svg.style.cursor = 'zoom-in';
      svg.addEventListener('click', (ev) => {
        const r = svg.getBoundingClientRect();
        const k = Math.round(((ev.clientX - r.left) / r.width) * W / px - LEFT / px - fft / 2 - 0.5);
        opts.onWindow && opts.onWindow(k - WIN / 2);
      });
    }
    svg.append(s('text', { x: LEFT, y: 290, class: 'muted' }, 'subcarrier index k (top) and frequency offset k·Δ_F from the channel centre (bottom)'));

    // --- header and facts
    const counts = map.counts;
    const chip = (kind, n) => h('span', { class: 'chip' }, h('i', { style: { background: V.KIND[kind].color } }), term(V.KIND[kind].term, V.KIND[kind].label), ' ' + n);
    // fields that use this plan (the PE field carries no subcarrier data of its own)
    const fieldNames = g.fields.filter((f) => (field === 'legacy' ? f.toneplan === 'legacy' : f.toneplan !== 'legacy' && f.kind !== 'pe')).map((f) => f.name);
    const head = h('div', { class: 'view-head' },
      h('h2', null, 'Subcarrier map — ', field === 'legacy' ? `${pre} fields` : 'Data field'),
      h('div', { class: 'seg', role: 'group', 'aria-label': 'Field' },
        h('button', { type: 'button', 'aria-pressed': String(field === 'data'), onclick: () => opts.onField('data') }, 'Data field'),
        h('button', { type: 'button', 'aria-pressed': String(field === 'legacy'), onclick: () => opts.onField('legacy') },
          `${pre[0].toUpperCase()}${pre.slice(1)} fields (${legacyFields[0]} … ${legacyFields[legacyFields.length - 1]})`)));
    const ruBar = ruSizes.length ? h('div', { class: 'seg ru-seg', role: 'group', 'aria-label': 'Resource unit overlay' },
      h('span', { class: 'muted small' }, term('Resource unit', 'RU'), ' overlay (', term('OFDMA'), ' illustration): '),
      [null, ...ruSizes].map((size) => h('button', { type: 'button', 'aria-pressed': String(size === ruSize), onclick: () => opts.onRu(size) },
        size === null ? 'off' : sizeLabel(size)))) : null;
    const chips = h('div', { class: 'chips' },
      chip('data', counts.data), chip('pilot', counts.pilot), chip('dc', counts.dc),
      counts.null ? chip('null', counts.null) : null, chip('guard', counts.guard));

    const occupiedMHz = ((kMax - kMin + 1) * dfKHz) / 1000;
    // HE: the Data-field plan is 4x finer than the pre-HE plan (ratio from the two tone maps)
    const ratio = a.legacyTones.spacingKHz / a.dataTones.spacingKHz;
    const facts = h('div', { class: 'formula' },
      term('FFT size'), ` = ${fft}   ·   `, term('Δ_F'), ` = ${fmt(dfKHz, 3)} kHz   →   ${fft} × ${fmt(dfKHz, 3)} kHz = ${fmt((fft * dfKHz) / 1000, 3)} MHz `, term('Channel bandwidth', 'channel'), '   ·   ',
      term('N_SD'), ` = ${map.N_SD}, `, term('N_SP'), ` = ${map.N_SP}, `, term('N_ST'), ` = ${map.N_ST}   ·   used subcarriers ${V.signed(kMin, 0)}…${V.signed(kMax, 0)} span ${fmt(occupiedMHz, 4)} MHz`,
      pilotsLabelled ? null : [h('br'), term('Pilot subcarrier', 'pilots'), ' at k = ', pilots.map((t) => V.signed(t.k, 0)).join(', ')],
      counts.null ? [h('br'), term('Null subcarrier', 'null'), ' subcarriers ', V.runs(tones).filter((r) => r.kind === 'null').map((r) => `${V.signed(r.from, 0)}…${V.signed(r.to, 0)}`).join(', '), ': the centre of each 80 MHz half'] : null,
      ratio !== 1 ? [h('br'), field === 'data'
        ? `Δ_F is ${fmt(ratio, 2)}× smaller than the ${fmt(a.legacyTones.spacingKHz, 3)} kHz of the ${pre} fields: ${fmt(ratio, 2)}× more subcarriers in the same channel and a ${fmt(ratio, 2)}× longer useful symbol (${V.us(a.params.T_DFT_ns)} µs), so the same guard interval costs less overhead.`
        : `The HE part after ${legacyFields[legacyFields.length - 1]} switches to Δ_F = ${fmt(a.dataTones.spacingKHz, 3)} kHz (${fmt(ratio, 2)}× finer, FFT size ${a.dataTones.fft}).`] : null);

    // RU overlay summary (HE MU / HE TB illustration)
    let ruNote = null;
    if (rus.length) {
      const D = C.data, RU = g.resourceUnits;
      const covered = rus.reduce((n, r) => n + r.tones, 0);
      const split = RU.tones.value[ruSize];
      ruNote = h('div', { class: 'notice info' },
        h('strong', null, 'HE MU / HE TB illustration — not part of an HE SU PPDU. '),
        `${rus.length} RU${rus.length > 1 ? 's' : ''} × ${sizeLabel(ruSize)} tones`, split ? ` (${split.data} data + ${split.pilot} pilot each)` : '',
        ` = ${covered} of the ${a.dataTones.N_ST} HE SU subcarriers`,
        covered < a.dataTones.N_ST ? `; the other ${a.dataTones.N_ST - covered} stay empty in this layout (between RUs and around DC).` : '.',
        ' In ', term('OFDMA'), ' each user gets one RU (', term('HE MU PPDU', 'HE MU'), ' downlink, ', term('HE TB PPDU', 'HE TB'),
        ' uplink); an ', term('HE SU PPDU', 'HE SU PPDU'), ' uses the whole channel as one RU. The pilots drawn are the HE SU pilots; each RU has its own pilot positions (not shown). ',
        h('span', { class: 'badge ' + RU.subcarrierRanges.status }, RU.subcarrierRanges.status), ' ',
        h('span', { class: 'small muted' }, 'RU ranges: ', RU.subcarrierRanges.evidence.map((id) => D.sources[id].title).join('; ')));
    }
    const ltf = a.timeline.items.find((i) => i.ltf);
    const ltfStep = ltf ? Math.round(a.params.T_DFT_ns / ltf.symbol_ns) : null;

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
          ltf ? ['. The ', term('HE-LTF type', `${ltf.ltf} HE-LTF`), ltfStep > 1 ? ` uses every ${ltfStep === 2 ? 'second' : ltfStep === 4 ? 'fourth' : ltfStep + 'th'} subcarrier, so its symbol repeats after ${V.us(ltf.symbol_ns)} µs and only that is sent` : ' uses every subcarrier for the full symbol'] : '',
          '. Click the OFDM symbol step above to see the same symbol in time.'));

    const zoom = needWindow ? zoomWindow(map, k0, WIN, opts) : null;
    return h('div', null, head, chips, ruBar, h('div', { style: { margin: '8px 0' } }, svg), zoom, facts, ruNote, explain);
  };

  /** "2×996" for the RU that covers a whole 160 MHz channel (two 80 MHz halves). */
  function sizeLabel(size) {
    const whole = root.WifiCalc.data.generations.HE.resourceUnits.layout160.value.wholeChannel.size;
    return size === whole ? `2×${whole / 2}` : String(size);
  }

  /** 64 subcarriers drawn one by one, with their indices — the magnified part of the overview. */
  function zoomWindow(map, k0, WIN, opts) {
    const H = 150, B = 112;
    const px = PW / WIN, fft = map.fft, dfKHz = map.spacingKHz;
    const X = (k) => LEFT + (k - k0 + 0.5) * px;
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Subcarriers ${k0} to ${k0 + WIN - 1}` });
    const tones = map.tones.filter((t) => t.k >= k0 && t.k < k0 + WIN);
    for (const t of tones) {
      const k = V.KIND[t.kind], x = X(t.k), w = px * 0.6;
      const title = s('title', null, `k = ${V.signed(t.k, 0)} · ${V.signed((t.k * dfKHz) / 1000, 4)} MHz · ${k.term.toLowerCase()}`);
      const hgt = t.kind === 'pilot' ? 84 : t.kind === 'data' ? 66 : 10;
      svg.append(s('rect', { x: x - w / 2, y: B - hgt, width: w, height: hgt, rx: 1.5, fill: k.color, opacity: t.kind === 'guard' ? 0.8 : 1 }, title));
    }
    svg.append(s('line', { x1: LEFT, x2: W - RIGHT, y1: B + 0.5, y2: B + 0.5, stroke: '#a7b2c6' }));
    for (let k = k0; k < k0 + WIN; k++) {
      if (((k % 8) + 8) % 8) continue;
      svg.append(s('line', { x1: X(k), x2: X(k), y1: B, y2: B + 5, stroke: '#a7b2c6' }),
        s('text', { x: X(k), y: B + 18, 'text-anchor': 'middle', class: 'mono' }, V.signed(k, 0)));
    }
    for (const t of tones) if (t.kind === 'pilot') svg.append(s('text', { x: X(t.k), y: B - 90, 'text-anchor': 'middle', class: 'mono', fill: V.KIND.pilot.color }, V.signed(t.k, 0)));
    svg.append(s('text', { x: LEFT, y: H - 4, class: 'muted small' }, `${V.signed((k0 * dfKHz) / 1000, 4)} MHz`),
      s('text', { x: W - RIGHT, y: H - 4, 'text-anchor': 'end', class: 'muted small' }, `${V.signed(((k0 + WIN - 1) * dfKHz) / 1000, 4)} MHz`));
    const move = (d) => opts.onWindow && opts.onWindow(Math.max(-fft / 2, Math.min(fft / 2 - WIN, k0 + d)));
    return h('div', { class: 'zoom-window' },
      h('div', { class: 'view-head' },
        h('h3', null, `Zoom: subcarriers ${V.signed(k0, 0)} … ${V.signed(k0 + WIN - 1, 0)}`, h('span', { class: 'muted small' }, ` (${WIN} of ${fft}, dashed box above)`)),
        h('div', { class: 'chips' },
          h('button', { type: 'button', onclick: () => move(-WIN / 2), disabled: k0 <= -fft / 2, 'aria-label': 'Move the zoom window left' }, '◀'),
          h('button', { type: 'button', onclick: () => opts.onWindow && opts.onWindow(-WIN / 2) }, 'centre'),
          h('button', { type: 'button', onclick: () => move(WIN / 2), disabled: k0 >= fft / 2 - WIN, 'aria-label': 'Move the zoom window right' }, '▶'))),
      svg);
  }

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
    if (t.kind === 'dc') return s('rect', { x: x - Math.max(1, px * 0.3), y: BASE - 14, width: Math.max(2, px * 0.6), height: 14, fill: k.color }, title);
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
