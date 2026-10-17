/* systems/wifi/view-compare.js — Mode 3: the generations side by side.
 *
 * One configuration per generation (editable), one shared payload. Everything is
 * computed with WifiCalc.analyze(): a PPDU race on a common time axis, efficiency
 * against payload size, where the extra speed comes from, the subcarriers of one
 * 20 MHz channel, and a parameter table with the changes highlighted.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;

  /* categorical colours (validated: dark surface, adjacent CVD ΔE ≥ 8) — fixed per generation */
  const GEN_COLOR = { nonHT: '#3987e5', HT: '#d95926', VHT: '#199e70', HE: '#c98500' };
  const DEFAULTS = {
    nonHT: { gen: 'nonHT', band: '5', bw: 20, gi: 0.8, nss: 1, mod: '64-QAM', R: '3/4' },
    HT: { gen: 'HT', band: '5', bw: 40, gi: 0.4, nss: 2, mcs: 7 },
    VHT: { gen: 'VHT', band: '5', bw: 80, gi: 0.4, nss: 2, mcs: 9 },
    HE: { gen: 'HE', band: '5', bw: 80, gi: 0.8, ltf: '2x', nss: 2, mcs: 11, nominalPadding: 16 },
  };

  V.mountCompare = function (container, ctx, shared) {
    const C = root.WifiCalc, D = C.data;
    const gens = Object.keys(D.generations);
    const st = shared.compare || (shared.compare = { payload: 1500, cfg: JSON.parse(JSON.stringify(DEFAULTS)), from: 'nonHT', to: 'HE' });
    let raf = 0;

    const top = h('section', { class: 'panel' });
    const race = h('section', { class: 'panel' });
    const eff = h('section', { class: 'panel' });
    const factors = h('section', { class: 'panel' });
    const tones = h('section', { class: 'panel' });
    const table = h('section', { class: 'panel' });
    container.append(h('div', { class: 'compare-mode' }, top, race, h('div', { class: 'compare-two' }, eff, factors), tones, table));

    const analyze = (g, payload) => C.analyze(Object.assign({}, st.cfg[g], { payload: payload ?? st.payload }));
    const label = (g) => D.generations[g].label;

    /* ---------- configuration ---------- */
    function sel(value, options, onchange) {
      return h('select', { onchange: (e) => onchange(e.target.value), disabled: options.length < 2 },
        options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value), disabled: o.disabled }, o.label)));
    }
    function setCfg(g, patch) {
      const merged = Object.assign({}, st.cfg[g], patch);
      let cfg = C.normalize(merged).cfg;
      if (C.exclusion(cfg)) cfg = C.normalize(Object.assign({}, cfg, { mcs: Math.max(0, cfg.mcs - 1), mod: null, R: null })).cfg;
      st.cfg[g] = cfg;
      drawAll();
    }
    function drawTop() {
      const payloadLabel = h('b', { class: 'mono' }, fmt(st.payload, 0) + ' octets');
      const cols = gens.map((g) => {
        const cfg = C.normalize(st.cfg[g]).cfg, o = C.options(cfg);
        const mcs = o.mcs.map((m) => ({ value: m.mcs ?? `${m.mod}|${m.R}`, label: m.mcs === null ? `${m.mod} ${m.R}` : `MCS ${C.displayMcs(Object.assign({}, cfg, { mcs: m.mcs }))} · ${m.mod} ${m.R}`,
          disabled: m.mcs !== null && !!C.exclusion(Object.assign({}, cfg, { mcs: m.mcs })) }));
        return h('div', { class: 'cmp-col', style: { borderTopColor: GEN_COLOR[g] } },
          h('div', { class: 'cmp-name' }, h('i', { style: { background: GEN_COLOR[g] } }), label(g), h('span', { class: 'muted small' }, ' ' + D.generations[g].phyName.split(' (')[0])),
          h('div', { class: 'cmp-ctl' },
            sel(cfg.bw, o.bandwidths.map((b) => ({ value: b, label: b + ' MHz' })), (v) => setCfg(g, { bw: Number(v) })),
            sel(cfg.nss, o.spatialStreams.map((n) => ({ value: n, label: n + ' SS' })), (v) => setCfg(g, { nss: Number(v) })),
            sel(cfg.gi, o.guardIntervals.map((x) => ({ value: x, label: 'GI ' + x + ' µs' })), (v) => setCfg(g, { gi: Number(v) })),
            sel(cfg.mcs ?? `${cfg.mod}|${cfg.R}`, mcs, (v) => (v.includes('|') ? setCfg(g, { mcs: null, mod: v.split('|')[0], R: v.split('|')[1] }) : setCfg(g, { mcs: Number(v) })))));
      });
      top.replaceChildren(
        h('div', { class: 'view-head' }, h('h2', null, 'Four generations, one payload'),
          h('label', { class: 'ctl slider inline payload' }, h('span', null, 'Payload ', payloadLabel),
            h('input', { type: 'range', min: 0, max: 5, step: 0.01, value: Math.log10(st.payload),
              oninput: (e) => { st.payload = Math.max(1, Math.round(10 ** Number(e.target.value))); payloadLabel.textContent = fmt(st.payload, 0) + ' octets'; drawData(false); } }))),
        h('div', { class: 'cmp-cols' }, cols),
        h('p', { class: 'small muted' }, 'Each column is a full configuration; change any of them. Payload = PSDU length (Non-HT, HT) or APEP_LENGTH (VHT, HE), clamped to what each format allows. All at 5 GHz.'));
    }

    /* ---------- 1. the race ---------- */
    function drawRace(animate) {
      cancelAnimationFrame(raf);
      const res = gens.map((g) => ({ g, a: analyze(g) }));
      const tMax = Math.max(...res.map((r) => r.a.timeline.txtime_ns));
      const Wp = 800, L = 92, R = 120, laneH = 34, T = 26;
      const Hp = T + res.length * (laneH + 10) + 26;
      const X = (ns) => L + (ns / tMax) * (Wp - L - R);
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Airtime of the same payload in each generation' });
      const clipId = 'raceClip' + Math.random().toString(36).slice(2, 7);
      const clipRect = s('rect', { x: 0, y: 0, width: animate ? L : Wp, height: Hp });
      svg.append(s('defs', null, s('clipPath', { id: clipId }, clipRect)));
      const lanes = s('g', { 'clip-path': `url(#${clipId})` });
      const finish = [];
      res.forEach(({ g, a }, i) => {
        const y = T + i * (laneH + 10);
        svg.append(s('text', { x: L - 8, y: y + laneH / 2 + 4, 'text-anchor': 'end', 'font-weight': 600 }, label(g)),
          s('rect', { x: L - 4, y: y + 4, width: 3, height: laneH - 8, fill: GEN_COLOR[g] }));
        for (const it of a.timeline.items) {
          const x0 = X(it.start_ns), w = Math.max(0.8, X(it.start_ns + it.dur_ns) - x0);
          lanes.append(s('rect', { x: x0, y, width: w, height: laneH, fill: it.kind === 'gap' ? '#334155' : V.FIELD[it.kind], stroke: '#0a0e17', 'stroke-width': 0.6 },
            s('title', null, `${label(g)} · ${it.name}: ${V.us(it.dur_ns)} µs`)));
        }
        const pre = a.timeline.items.find((it) => it.kind === 'data').start_ns;
        const t = a.timeline.txtime_ns;
        const f = s('g', { opacity: animate ? 0 : 1, style: { transition: 'opacity .3s' } },
          s('text', { x: X(t) + 6, y: y + 14, class: 'mono', 'font-size': 12 }, `${V.us(t)} µs`),
          s('text', { x: X(t) + 6, y: y + 28, class: 'small muted' }, `preamble ${Math.round((100 * pre) / t)} %`));
        finish.push({ t, f });
        svg.append(f);
      });
      svg.append(lanes);
      const cursor = s('line', { x1: L, x2: L, y1: T - 8, y2: Hp - 22, stroke: '#e6eaf2', 'stroke-width': 1.5, opacity: animate ? 1 : 0 });
      const clock = s('text', { x: L, y: T - 12, 'text-anchor': 'middle', class: 'mono small' }, '');
      svg.append(cursor, clock);
      const step = V.niceStep(tMax / 1000, 6);
      for (let t = 0; t <= tMax / 1000 + 1e-9; t += step) svg.append(s('text', { x: X(t * 1000), y: Hp - 6, 'text-anchor': 'middle', class: 'muted mono small' }, fmt(t, 1)));
      svg.append(s('text', { x: Wp - 4, y: Hp - 6, 'text-anchor': 'end', class: 'muted small' }, 'µs'));

      if (animate) {
        const dur = 3800, t0 = performance.now();
        const frame = (now) => {
          const k = Math.min(1, (now - t0) / dur), t = k * tMax;
          clipRect.setAttribute('width', X(t));
          cursor.setAttribute('x1', X(t)); cursor.setAttribute('x2', X(t));
          clock.setAttribute('x', X(t)); clock.textContent = V.us(t) + ' µs';
          for (const f of finish) if (t >= f.t) f.f.setAttribute('opacity', 1);
          if (k < 1) raf = requestAnimationFrame(frame);
          else { cursor.setAttribute('opacity', 0); clock.textContent = ''; }
        };
        raf = requestAnimationFrame(frame);
      }
      const winner = res.reduce((b, r) => (r.a.timeline.txtime_ns < b.a.timeline.txtime_ns ? r : b));
      race.replaceChildren(
        h('div', { class: 'view-head' }, h('h2', null, 'The race — same payload, real time scale'),
          h('button', { type: 'button', class: 'play', onclick: () => drawRace(true) }, '▶ race')),
        svg,
        h('div', { class: 'chips small' }, Object.entries({ training: 'training fields', signal: 'signal fields', data: 'Data field', pe: 'PE', gap: 'no transmission' })
          .map(([k, l]) => h('span', { class: 'chip' }, h('i', { style: { background: k === 'gap' ? '#334155' : V.FIELD[k] } }), l))),
        h('p', { class: 'small' }, `Fastest for ${fmt(st.payload, 0)} octets: ${label(winner.g)}. `,
          'Short payloads are dominated by the preamble, which grows with every generation (more training and signal fields); the faster Data field only pays off for longer payloads.'));
    }

    /* ---------- 2. efficiency against payload ---------- */
    function drawEff() {
      const Wp = 520, Hp = 300, L = 48, R = 14, T = 16, B = 34;
      const xMin = 0, xMax = 5;
      const X = (lg) => L + ((lg - xMin) / (xMax - xMin)) * (Wp - L - R);
      const series = gens.map((g) => {
        const pts = [];
        for (let lg = 0; lg <= xMax + 1e-9; lg += 0.05) {
          const Lo = Math.max(1, Math.round(10 ** lg));
          const a = analyze(g, Lo);
          if (a.cfg.payload !== Lo || a.maxPpdu.exceeded) break;
          pts.push({ lg, L: Lo, mbps: (8 * Lo * 1000) / a.timeline.txtime_ns });
        }
        return { g, pts, rate: analyze(g).params.rateMbps };
      });
      const yMax = Math.max(...series.map((se) => se.rate)) * 1.08;
      const Y = (v) => T + (1 - v / yMax) * (Hp - T - B);
      const svg = s('svg', { class: 'diagram eff-chart', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Payload rate (8·L / TXTIME) against payload length' });
      const yStep = V.niceStep(yMax, 5);
      for (let v = 0; v <= yMax; v += yStep) svg.append(s('line', { x1: L, x2: Wp - R, y1: Y(v), y2: Y(v), stroke: '#1f2a3d' }),
        s('text', { x: L - 6, y: Y(v) + 4, 'text-anchor': 'end', class: 'muted mono small' }, fmt(v, 0)));
      for (let e = 0; e <= xMax; e++) svg.append(s('line', { x1: X(e), x2: X(e), y1: Hp - B, y2: Hp - B + 4, stroke: '#93a0b8' }),
        s('text', { x: X(e), y: Hp - B + 16, 'text-anchor': 'middle', class: 'muted mono small' }, ['1', '10', '100', '1k', '10k', '100k'][e]));
      svg.append(s('text', { x: (L + Wp - R) / 2, y: Hp - 2, 'text-anchor': 'middle', class: 'muted small' }, 'payload (octets, log scale)'),
        s('text', { x: 4, y: 10, class: 'muted small' }, 'Mb/s'));
      for (const se of series) {
        svg.append(s('line', { x1: L, x2: Wp - R, y1: Y(se.rate), y2: Y(se.rate), stroke: GEN_COLOR[se.g], 'stroke-dasharray': '3 5', opacity: 0.6 }));
        svg.append(s('polyline', { points: se.pts.map((p) => `${X(p.lg).toFixed(1)},${Y(p.mbps).toFixed(1)}`).join(' '), fill: 'none', stroke: GEN_COLOR[se.g], 'stroke-width': 2 }));
        const last = se.pts[se.pts.length - 1];
        if (last) svg.append(s('text', { x: Math.min(X(last.lg) + 4, Wp - R - 40), y: Y(last.mbps) - 6, class: 'small', fill: '#e6eaf2' }, label(se.g)));
      }
      // current payload + hover crosshair
      const cur = s('line', { x1: X(Math.log10(st.payload)), x2: X(Math.log10(st.payload)), y1: T, y2: Hp - B, stroke: '#e6eaf2', 'stroke-dasharray': '4 3' });
      const hover = s('g', { opacity: 0 });
      const hl = s('line', { y1: T, y2: Hp - B, stroke: '#93a0b8' });
      const dots = series.map((se) => s('circle', { r: 4, fill: GEN_COLOR[se.g], stroke: '#111827', 'stroke-width': 2 }));
      hover.append(hl, ...dots);
      const hit = s('rect', { x: L, y: T, width: Wp - L - R, height: Hp - T - B, fill: 'transparent', style: { cursor: 'crosshair' } });
      svg.append(cur, hover, hit);
      const tip = h('div', { class: 'chart-tip', hidden: true });
      const lgAt = (ev) => {
        const r = svg.getBoundingClientRect();
        const x = ((ev.clientX - r.left) / r.width) * Wp;
        return Math.max(xMin, Math.min(xMax, xMin + ((x - L) / (Wp - L - R)) * (xMax - xMin)));
      };
      hit.addEventListener('mousemove', (ev) => {
        const lg = lgAt(ev), x = X(lg);
        hover.setAttribute('opacity', 1); hl.setAttribute('x1', x); hl.setAttribute('x2', x);
        const Lo = Math.max(1, Math.round(10 ** lg));
        const rows = series.map((se, i) => {
          const p = se.pts.reduce((b, q) => (Math.abs(q.lg - lg) < Math.abs(b.lg - lg) ? q : b), se.pts[0] || { lg: 99 });
          const ok = p && Math.abs(p.lg - lg) < 0.06;
          dots[i].setAttribute('opacity', ok ? 1 : 0);
          if (ok) { dots[i].setAttribute('cx', X(p.lg)); dots[i].setAttribute('cy', Y(p.mbps)); }
          return h('div', null, h('i', { style: { background: GEN_COLOR[se.g] } }), `${label(se.g)}  `, h('b', null, ok ? fmt(p.mbps, 1) + ' Mb/s' : '—'));
        });
        tip.replaceChildren(h('div', { class: 'mono' }, `${fmt(Lo, 0)} octets`), ...rows);
        tip.hidden = false;
        const r = svg.getBoundingClientRect();
        tip.style.left = Math.min(ev.clientX - r.left + 14, r.width - 170) + 'px';
        tip.style.top = ev.clientY - r.top + 10 + 'px';
      });
      hit.addEventListener('mouseleave', () => { hover.setAttribute('opacity', 0); tip.hidden = true; });
      hit.addEventListener('click', (ev) => { st.payload = Math.max(1, Math.round(10 ** lgAt(ev))); drawAll(); });
      eff.replaceChildren(h('h2', null, 'How much of the data rate you get'),
        h('div', { class: 'chart-box' }, svg, tip),
        h('div', { class: 'chips small' }, gens.map((g) => h('span', { class: 'chip' }, h('i', { style: { background: GEN_COLOR[g] } }), label(g)))),
        h('p', { class: 'small' }, 'Solid: payload bits / ', term('TXTIME'), '. Dashed: the ', term('Data rate', 'data rate'), ' of the Data field. Lines stop at the largest payload a format allows (length field or the 5484 µs limit). Click to set the payload.'));
    }

    /* ---------- 3. where the speed comes from ---------- */
    function drawFactors() {
      const pa = analyze(st.from).params, pb = analyze(st.to).params;
      const items = [
        { name: 'data subcarriers', t: 'N_SD', r: pb.N_SD / pa.N_SD, txt: `${pa.N_SD} → ${pb.N_SD}` },
        { name: 'bits per subcarrier', t: 'N_BPSCS', r: pb.N_BPSCS / pa.N_BPSCS, txt: `${pa.N_BPSCS} → ${pb.N_BPSCS}` },
        { name: 'coding rate', t: 'R', r: pb.R.value / pa.R.value, txt: `${pa.R.text} → ${pb.R.text}` },
        { name: 'spatial streams', t: 'N_SS', r: pb.N_SS / pa.N_SS, txt: `${pa.N_SS} → ${pb.N_SS}` },
        { name: 'symbols per second', t: 'T_SYM', r: pa.T_SYM_ns / pb.T_SYM_ns, txt: `T_SYM ${V.us(pa.T_SYM_ns)} → ${V.us(pb.T_SYM_ns)} µs` },
      ];
      const Wp = 520, rowH = 34, T = 10, L = 150, R = 70;
      const maxLog = Math.max(1, ...items.map((i) => Math.abs(Math.log10(i.r))));
      const mid = L + (Wp - L - R) * (maxLog / (2 * maxLog));
      const X = (lg) => mid + (lg / maxLog) * ((Wp - L - R) / 2);
      const Hp = T + items.length * rowH + 10;
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Data-rate factors' });
      svg.append(s('line', { x1: mid, x2: mid, y1: T - 4, y2: Hp - 6, stroke: '#93a0b8' }));
      items.forEach((it, i) => {
        const y = T + i * rowH, lg = Math.log10(it.r), x1 = X(lg);
        svg.append(s('text', { x: 4, y: y + 15, class: 'small' }, it.name), s('text', { x: 4, y: y + 28, class: 'small muted mono' }, it.txt));
        if (Math.abs(lg) > 1e-9) svg.append(s('rect', { x: Math.min(mid, x1), y: y + 6, width: Math.abs(x1 - mid), height: 18, rx: 4, fill: lg > 0 ? '#3987e5' : '#d95926' },
          s('title', null, `× ${fmt(it.r, 3)}`)));
        svg.append(s('text', { x: lg >= 0 ? Math.max(x1, mid) + 6 : mid + 6, y: y + 19, class: 'mono small' }, '× ' + fmt(it.r, 2)));
      });
      const prod = items.reduce((p, i) => p * i.r, 1);
      factors.replaceChildren(
        h('div', { class: 'view-head' }, h('h2', null, 'Where the speed comes from'),
          h('div', { class: 'cmp-ctl' }, sel(st.from, gens.map((g) => ({ value: g, label: label(g) })), (v) => { st.from = v; drawFactors(); }), ' → ',
            sel(st.to, gens.map((g) => ({ value: g, label: label(g) })), (v) => { st.to = v; drawFactors(); }))),
        svg,
        h('div', { class: 'formula' }, term('Data rate'), ` = N_SD · N_BPSCS · R · N_SS / T_SYM\n${fmt(pa.exactRateMbps, 1)} Mb/s × ${fmt(prod, 3)} = ${fmt(pa.exactRateMbps * prod, 1)} Mb/s`
          + (Math.abs(pb.rateMbps - pa.exactRateMbps * prod) > 0.05 ? ` (${fmt(pb.rateMbps, 1)} with N_DBPS rounded down)` : '')),
        h('p', { class: 'small muted' }, 'Bars on a log scale, so the factors add up visually. Blue speeds up, orange slows down — HE\'s 4× longer symbol is paid back by 4× more subcarriers.'));
    }

    /* ---------- 4. the subcarriers of 20 MHz ---------- */
    function drawTones() {
      const Wp = 800, L = 92, R = 14, laneH = 30, T = 18;
      const Hp = T + gens.length * (laneH + 12) + 26;
      const X = (mhz) => L + ((mhz + 10) / 20) * (Wp - L - R);
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Subcarriers in one 20 MHz channel' });
      gens.forEach((g, i) => {
        const tm = C.dataToneMap(g, 20), y = T + i * (laneH + 12);
        svg.append(s('text', { x: L - 8, y: y + laneH / 2 + 4, 'text-anchor': 'end', 'font-weight': 600 }, label(g)),
          s('rect', { x: L - 4, y: y + 4, width: 3, height: laneH - 8, fill: GEN_COLOR[g] }));
        for (const t of tm.tones) {
          if (t.kind !== 'data' && t.kind !== 'pilot') continue;
          const x = X((t.k * tm.spacingKHz) / 1000);
          svg.append(s('line', { x1: x, x2: x, y1: y + (t.kind === 'pilot' ? 0 : 6), y2: y + laneH, stroke: V.KIND[t.kind].color, 'stroke-width': 1, class: 'grow', style: { animationDelay: `${i * 0.25}s` } }));
        }
        svg.append(s('text', { x: Wp - R, y: y - 2, 'text-anchor': 'end', class: 'small muted mono' }, `${tm.N_SD} + ${tm.N_SP} subcarriers · Δ_F ${fmt(tm.spacingKHz, 3)} kHz · FFT ${tm.fft}`));
      });
      for (const f of [-10, -5, 0, 5, 10]) svg.append(s('text', { x: X(f), y: Hp - 6, 'text-anchor': f === 10 ? 'end' : f === -10 ? 'start' : 'middle', class: 'muted mono small' }, V.signed(f, 0) + ' MHz'));
      tones.replaceChildren(h('h2', null, 'The same 20 MHz, four tone plans'), svg,
        h('div', { class: 'chips small' }, ['data', 'pilot'].map((k) => h('span', { class: 'chip' }, h('i', { style: { background: V.KIND[k].color } }), term(V.KIND[k].term, V.KIND[k].label)))),
        h('p', { class: 'small' }, 'HT and VHT squeeze 4 more data subcarriers into the guard band; HE divides the channel 4× finer (78.125 kHz), so less is lost to DC and guard subcarriers and the guard interval is a smaller share of a 4× longer symbol.'));
    }

    /* ---------- 5. parameter table ---------- */
    function drawTable() {
      const as = gens.map((g) => analyze(g));
      const rows = [
        ['Standard', (a, g) => `${D.documents[D.generations[g].doc].doc}, Cl. ${D.documents[D.generations[g].doc].clause}`],
        ['PPDU format', (a, g) => D.generations[g].ppduFormat],
        ['Bands (GHz)', (a, g) => Object.keys(D.generations[g].bands).join(' / ')],
        ['Channel bandwidths (MHz)', (a, g) => D.generations[g].bandwidths.join(' / ')],
        [term('Δ_F'), (a) => fmt(a.params.spacingKHz, 3) + ' kHz'],
        [term('T_DFT'), (a) => V.us(a.params.T_DFT_ns) + ' µs'],
        ['Guard intervals', (a, g) => C.val(D.generations[g].ofdm.guardIntervals).join(' / ') + ' µs'],
        ['Coding', (a, g) => D.generations[g].coding + (g === 'HE' ? ' (here)' : '')],
        ['Max constellation', (a, g) => C.options({ gen: g }).mcs.map((m) => m.mod).pop()],
        ['Max spatial streams (here)', (a, g) => Math.max(...D.generations[g].spatialStreams)],
        ['— this configuration —', () => ''],
        ['Bandwidth', (a) => a.cfg.bw + ' MHz'],
        [term('FFT size'), (a) => a.params.N_FFT],
        [[term('N_SD'), ' + ', term('N_SP')], (a) => `${a.params.N_SD} + ${a.params.N_SP}`],
        ['Modulation, R', (a) => `${a.cfg.mod} ${a.cfg.R}`],
        [term('N_SS'), (a) => a.cfg.nss],
        [term('T_SYM'), (a) => V.us(a.params.T_SYM_ns) + ' µs'],
        [term('Data rate'), (a) => fmt(a.params.rateMbps, 1) + ' Mb/s'],
        ['Preamble (until Data)', (a) => V.us(a.timeline.items.find((i) => i.kind === 'data').start_ns) + ' µs'],
        [term('TXTIME'), (a) => V.us(a.timeline.txtime_ns) + ' µs'],
        ['Payload rate', (a) => fmt((8 * a.cfg.payload * 1000) / a.timeline.txtime_ns, 1) + ' Mb/s'],
      ];
      const head = h('tr', null, h('th', null, ''), gens.map((g) => h('th', null,
        h('div', { class: 'cmp-name' }, h('i', { style: { background: GEN_COLOR[g] } }), label(g)),
        h('button', { type: 'button', class: 'small-btn', onclick: () => {
          shared.cfg = Object.assign({}, st.cfg[g], { payload: as[gens.indexOf(g)].cfg.payload });
          shared.nav = { level: 'ppdu', sym: 1, sc: null, view: 'time', field: 'data' };
          try { history.pushState(null, '', root.WifiNav.format(shared.nav, Object.assign({}, shared.cfg))); } catch (e) { /* file:// in some browsers */ }
          ctx.selectMode('ppdu');
        } }, 'open in PPDU view →'))));
      const body = rows.map(([name, f]) => {
        const vals = gens.map((g, i) => String(f(as[i], g)));
        if (name.startsWith && name.startsWith('—')) return h('tr', { class: 'sep' }, h('td', { colspan: gens.length + 1 }, name));
        return h('tr', null, h('td', null, name), vals.map((v, i) => h('td', { class: i > 0 && v !== vals[i - 1] ? 'changed' : null }, v)));
      });
      table.replaceChildren(h('h2', null, 'Side by side'),
        h('div', { style: { overflowX: 'auto' } }, h('table', { class: 'cmp-table' }, h('thead', null, head), h('tbody', null, body))),
        h('p', { class: 'small muted' }, 'Highlighted: different from the generation to its left.'));
    }

    function drawData(animateRace) { drawRace(animateRace); drawEff(); drawFactors(); drawTable(); }
    function drawAll() { drawTop(); drawData(false); drawTones(); }
    drawAll();
    drawRace(true);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
