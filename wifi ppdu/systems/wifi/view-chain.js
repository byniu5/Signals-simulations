/* systems/wifi/view-chain.js — Mode 2: transmitter → channel → receiver.
 *
 * Every number and picture here comes from a real run of WifiChain (bit-level
 * scrambler, BCC, interleaver, mapping, IFFT, channel, FFT, equalizer, Viterbi …).
 * The chain is drawn as a U: transmitter on top, receiver underneath, each RX block
 * below the TX block it undoes. Sliders re-run the channel and the receiver live.
 */
(function (root) {
  'use strict';
  const { h, s, fmt, term } = root.Dom;
  const V = root.WifiViews;

  /* what flows out of each block (colour of the connector) */
  const FLOW = { bits: '#c084fc', coded: '#fbbf24', points: '#38bdf8', samples: '#34d399' };
  const STAGES = [
    { id: 'bits', side: 'tx', col: 0, label: ['Data bits'], term: 'Data field', out: 'bits' },
    { id: 'scrambler', side: 'tx', col: 1, label: ['Scrambler'], term: 'Scrambler', out: 'bits' },
    { id: 'encoder', side: 'tx', col: 2, label: ['BCC encoder', '+ puncturing'], term: 'Convolutional encoder', out: 'coded' },
    { id: 'interleaver', side: 'tx', col: 3, label: ['Interleaver'], term: 'Interleaver', out: 'coded' },
    { id: 'mapper', side: 'tx', col: 4, label: ['Constellation', 'mapping'], term: 'Constellation mapping', out: 'points' },
    { id: 'tones', side: 'tx', col: 5, label: ['Subcarriers', '+ pilots'], term: 'Pilot subcarrier', out: 'points' },
    { id: 'ifft', side: 'tx', col: 6, label: ['IFFT +', 'cyclic prefix'], term: 'IFFT', out: 'samples' },
    { id: 'channel', side: 'ch', label: ['Channel'], term: 'Multipath', out: 'samples' },
    { id: 'fft', side: 'rx', col: 6, label: ['FFT +', 'ch. estimation'], term: 'Channel estimation', out: 'points' },
    { id: 'equalizer', side: 'rx', col: 5, label: ['Equalizer', '+ pilots'], term: 'Equalizer', out: 'points' },
    { id: 'demapper', side: 'rx', col: 4, label: ['Demapper'], term: 'Demapper', out: 'coded' },
    { id: 'deinterleaver', side: 'rx', col: 3, label: ['Deinterleaver'], term: 'Interleaver', out: 'coded' },
    { id: 'decoder', side: 'rx', col: 2, label: ['Viterbi', 'decoder'], term: 'Viterbi decoder', out: 'bits' },
    { id: 'descrambler', side: 'rx', col: 1, label: ['Descrambler'], term: 'Scrambler', out: 'bits' },
    { id: 'message', side: 'rx', col: 0, label: ['Received', 'message'], term: 'PSDU', out: 'bits' },
  ];
  const RX_STAGES = STAGES.filter((st) => st.side === 'rx'); // in signal order (antenna first)

  /* diagram geometry */
  const W = 800, COLW = 84, GAP = 10, X0 = 10, TY = 28, RY = 176, BH = 62, CHX = 676, CHW = 114;
  const colX = (c) => X0 + c * (COLW + GAP);
  const centre = (st) => (st.side === 'ch' ? { x: CHX + CHW / 2, y: (TY + RY + BH) / 2 }
    : { x: colX(st.col) + COLW / 2, y: (st.side === 'tx' ? TY : RY) + BH / 2 });

  const PRESETS = [
    { id: 'clean', label: 'Clean channel', ch: { snrDb: 30, echoDelayNs: 0, echoGain: 0, cfoKHz: 0 }, rx: { cfoCorrection: true, pilotTracking: true }, interleave: true, stage: 'equalizer' },
    { id: 'echo-gi', label: 'Echo longer than the GI', ch: { snrDb: 35, echoDelayNs: 1500, echoGain: 0.7, cfoKHz: 0 }, rx: { cfoCorrection: true, pilotTracking: true }, interleave: true, stage: 'channel',
      cfg: { mod: '64-QAM', R: '3/4' } },
    { id: 'fade', label: 'Deep fade, no interleaver', ch: { snrDb: 20, echoDelayNs: 150, echoGain: 0.95, cfoKHz: 0 }, rx: { cfoCorrection: true, pilotTracking: true }, interleave: false, stage: 'deinterleaver',
      cfg: { mod: '16-QAM', R: '1/2' } },
    { id: 'pilots', label: 'Frequency offset, no pilot tracking', ch: { snrDb: 30, echoDelayNs: 0, echoGain: 0, cfoKHz: 6 }, rx: { cfoCorrection: false, pilotTracking: false }, interleave: true, stage: 'equalizer',
      cfg: { mod: '16-QAM', R: '1/2' } },
    { id: 'noise', label: 'Low SNR', ch: { snrDb: 9, echoDelayNs: 0, echoGain: 0, cfoKHz: 0 }, rx: { cfoCorrection: true, pilotTracking: true }, interleave: true, stage: 'decoder',
      cfg: { mod: 'QPSK', R: '1/2' } },
  ];

  /* ------------------------------------------------------------------ mount */
  V.mountChain = function (container, ctx, shared) {
    const C = root.WifiCalc, X = root.WifiChain, D = C.data;
    const startGen = shared.cfg.gen || 'nonHT';
    const state = {
      cfg: { gen: startGen, mod: 'QPSK', R: '1/2', gi: 0.8, text: 'Hello, Wi-Fi! 802.11 ✓', seed: 93, interleave: true },
      ch: { snrDb: 25, echoDelayNs: 300, echoGain: 0.4, cfoKHz: 3, seed: 1 },
      rx: { cfoCorrection: true, pilotTracking: true },
      stage: 'bits', split: RX_STAGES.length, hostUs: 60, playing: null,
    };
    let tx = null, res = null, timers = [];

    const controls = h('section', { class: 'panel controls chain-controls', 'aria-label': 'Chain configuration' });
    const diagramWrap = h('div', { class: 'panel chain-diagram' });
    const stageWrap = h('div', { class: 'panel chain-stage' });
    const outputs = h('section', { class: 'panel outputs', 'aria-live': 'polite' });
    container.append(h('div', { class: 'ppdu-mode chain-mode' }, controls, h('section', { class: 'stage-wrap' }, diagramWrap, stageWrap), outputs));

    /* ---------- running the chain ---------- */
    function runTx() { tx = X.transmit(state.cfg); }
    function runRx() {
      const out = X.channel(tx, state.ch);
      res = { tx, ch: out, rx: X.receive(tx, out, state.rx) };
    }
    let pending = 0;
    function update(txToo) {
      if (txToo) runTx();
      runRx();
      drawDiagram(); drawStage(); drawOutputs();
    }
    const live = () => { if (!pending) pending = requestAnimationFrame(() => { pending = 0; update(false); }); };

    /* ---------- controls ---------- */
    function select(label, value, options, onchange) {
      return h('label', { class: 'ctl' }, h('span', null, label),
        h('select', { onchange: (e) => onchange(e.target.value), disabled: options.length < 2 },
          options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value), disabled: o.disabled }, o.label))));
    }
    function slider(label, key, obj, min, max, step, unit, onlive) {
      const out = h('output', { class: 'mono' }, fmt(obj[key], 2) + unit);
      return h('label', { class: 'ctl slider' }, h('span', null, label, ' ', out),
        h('input', { type: 'range', min, max, step, value: obj[key], 'data-key': key,
          oninput: (e) => { obj[key] = Number(e.target.value); out.textContent = fmt(obj[key], 2) + unit; (onlive || live)(); } }));
    }
    function check(label, get, set) {
      return h('label', { class: 'check' }, h('input', { type: 'checkbox', checked: get(), onchange: (e) => { set(e.target.checked); } }), ' ', label);
    }
    function fixCfg() {
      const opts = X.mcsOptions(state.cfg.gen).filter((m) => !excluded(m));
      if (!opts.some((m) => m.mod === state.cfg.mod && m.R === state.cfg.R)) {
        const m = opts.find((x) => x.mod === state.cfg.mod) || opts[0];
        state.cfg.mod = m.mod; state.cfg.R = m.R;
      }
      const gis = C.val(C.generation(state.cfg.gen).ofdm.guardIntervals);
      if (!gis.includes(state.cfg.gi)) state.cfg.gi = gis[0];
    }
    const excluded = (m) => m.mcs !== null && !!C.exclusion({ gen: state.cfg.gen, bw: 20, nss: 1, mcs: m.mcs });
    function setCfg(patch) { Object.assign(state.cfg, patch); fixCfg(); drawControls(); update(true); }

    function drawControls() {
      const cfg = state.cfg, g = C.generation(cfg.gen);
      const mcs = X.mcsOptions(cfg.gen);
      const mods = [...new Set(mcs.map((m) => m.mod))];
      const rates = mcs.filter((m) => m.mod === cfg.mod);
      controls.replaceChildren(...[
        h('h2', null, 'Transmitter'),
        select('PHY generation (20 MHz, 1 stream)', cfg.gen, Object.entries(D.generations).map(([id, gg]) => ({ value: id, label: `${gg.label} — ${gg.phyName.split(' (')[0]}` })), (v) => setCfg({ gen: v })),
        select(term('Constellation mapping', 'Modulation'), cfg.mod, mods.map((m) => ({ value: m, label: m })), (v) => setCfg({ mod: v })),
        select(term('R', 'Coding rate R'), cfg.R, rates.map((m) => ({ value: m.R, label: m.R + (m.mcs !== null ? ` (MCS ${m.mcs})` : '') + (excluded(m) ? ' — not defined' : ''), disabled: excluded(m) })), (v) => setCfg({ R: v })),
        select(term('Guard interval'), cfg.gi, C.val(g.ofdm.guardIntervals).map((x) => ({ value: x, label: x + ' µs' })), (v) => setCfg({ gi: Number(v) })),
        h('label', { class: 'ctl' }, h('span', null, 'Message'),
          h('input', { type: 'text', maxlength: 80, value: cfg.text, oninput: (e) => { state.cfg.text = e.target.value || ' '; update(true); } })),
        h('label', { class: 'ctl' }, h('span', null, term('Scrambler'), ' seed (1…127)'),
          h('input', { type: 'number', min: 1, max: 127, value: cfg.seed, onchange: (e) => setCfg({ seed: Math.min(127, Math.max(1, Number(e.target.value) || 1)) }) })),
        g.codingRule ? h('div', { class: 'hint' }, 'HE here uses ', term('BCC'), ' — allowed for MCS ≤ ', C.val(g.codingRule).bccMaxMcs, ' in a 242-tone RU. The ', term('LDPC'),
          ' code of the PPDU view is not simulated bit by bit.') : null,
        h('h2', { style: { marginTop: '14px' } }, 'Channel'),
        slider(term('SNR', 'SNR'), 'snrDb', state.ch, 0, 40, 1, ' dB'),
        slider(term('Multipath', 'Echo delay'), 'echoDelayNs', state.ch, 0, 2000, 50, ' ns'),
        slider('Echo strength', 'echoGain', state.ch, 0, 1, 0.05, ''),
        slider(term('Carrier frequency offset', 'Frequency offset'), 'cfoKHz', state.ch, -40, 40, 1, ' kHz'),
        h('button', { type: 'button', class: 'small-btn', onclick: () => { state.ch.seed = (state.ch.seed % 997) + 1; update(false); } }, '↻ new noise'),
        h('h2', { style: { marginTop: '14px' } }, 'Receiver'),
        check(['Estimate and remove the ', term('Carrier frequency offset', 'frequency offset')], () => state.rx.cfoCorrection, (v) => { state.rx.cfoCorrection = v; update(false); }),
        check(['Pilot phase tracking'], () => state.rx.pilotTracking, (v) => { state.rx.pilotTracking = v; update(false); }),
        check(['Interleaver (TX and RX)'], () => cfg.interleave, (v) => { state.cfg.interleave = v; update(true); }),
        h('h2', { style: { marginTop: '14px' } }, 'Break it'),
        h('div', { class: 'presets' }, PRESETS.map((p) => h('button', { type: 'button', onclick: () => applyPreset(p) }, p.label))),
      ].filter(Boolean));
    }
    function applyPreset(p) {
      Object.assign(state.ch, p.ch);
      Object.assign(state.rx, p.rx);
      state.cfg.interleave = p.interleave;
      if (p.cfg) Object.assign(state.cfg, p.cfg);
      fixCfg();
      state.stage = p.stage;
      drawControls();
      update(true);
    }

    /* ---------- the U-shaped block diagram ---------- */
    function drawDiagram() {
      const e = res.rx.errors;
      const svg = s('svg', { class: 'diagram chain-svg', viewBox: `0 0 ${W} 268`, role: 'img', 'aria-label': 'Transmitter to receiver chain' });
      svg.append(s('defs', null, s('marker', { id: 'chArrow', viewBox: '0 0 10 10', refX: 9, refY: 5, markerWidth: 6, markerHeight: 6, orient: 'auto-start-reverse' },
        s('path', { d: 'M0,0 L10,5 L0,10 z', fill: '#93a0b8' }))));
      svg.append(s('text', { x: X0, y: 16, class: 'muted small' }, 'TRANSMITTER →'),
        s('text', { x: X0, y: RY + BH + 30, class: 'muted small' }, '← RECEIVER   (each block undoes the one above it)'));
      // inverse pairs
      for (let c = 0; c < 7; c++) svg.append(s('line', { x1: colX(c) + COLW / 2, x2: colX(c) + COLW / 2, y1: TY + BH + 4, y2: RY - 4, stroke: '#2b3a57', 'stroke-dasharray': '2 4' }));
      // software region (receiver blocks beyond the split)
      const sw = RX_STAGES.slice(state.split);
      if (sw.length) {
        const xs = sw.map((st) => (st.side === 'ch' ? CHX : colX(st.col)));
        const x0 = Math.min(...xs) - 5, x1 = Math.max(...xs) + COLW + 5;
        svg.append(s('rect', { x: x0, y: RY - 8, width: x1 - x0, height: BH + 16, rx: 10, fill: 'rgba(251,191,36,.06)', stroke: '#fbbf24', 'stroke-dasharray': '6 4' }),
          s('text', { x: x1, y: RY - 12, 'text-anchor': 'end', class: 'small', fill: '#fbbf24' }, 'software (host)'));
      }
      // connectors with flowing dashes
      const link = (a, b, color, pts) => svg.append(s('path', { d: pts, class: 'flow', stroke: color, fill: 'none', 'stroke-width': 2.2, 'marker-end': 'url(#chArrow)' }));
      for (let i = 0; i + 1 < STAGES.length; i++) {
        const a = STAGES[i], b = STAGES[i + 1], color = FLOW[a.out];
        if (a.side === 'tx' && b.side === 'tx') link(a, b, color, `M${colX(a.col) + COLW},${TY + BH / 2} H${colX(b.col) - 2}`);
        else if (a.side === 'tx') link(a, b, color, `M${colX(a.col) + COLW},${TY + BH / 2} H${CHX - 2}`);
        else if (a.side === 'ch') link(a, b, color, `M${CHX},${RY + BH / 2} H${colX(b.col) + COLW + 2}`);
        else link(a, b, color, `M${colX(a.col)},${RY + BH / 2} H${colX(b.col) + COLW + 2}`);
      }
      // blocks
      const metric = {
        bits: `${tx.msg.bytes.length} octets`, scrambler: `seed ${tx.seed}`, encoder: `R = ${tx.cfg.R}`,
        interleaver: tx.interleave ? `${tx.size.cols} × ${tx.size.rows}` : 'OFF', mapper: tx.cfg.mod, tones: `${tx.S.p.N_SD} + ${tx.S.p.N_SP}`,
        ifft: `N = ${tx.S.N}`, fft: `CFO ${fmt(res.rx.cfoEstKHz, 1)} kHz`, equalizer: `EVM ${fmt(res.rx.evmDb, 1)} dB`,
        demapper: `${e.rawCount} bit err.`, deinterleaver: tx.interleave ? 'spread' : 'OFF', decoder: `${e.decodedCount} bit err.`,
        descrambler: res.rx.recoveredState.join(''), message: e.byteCount ? `${e.byteCount} wrong` : 'intact',
      };
      const bad = { demapper: e.rawCount > 0, decoder: e.decodedCount > 0, message: e.byteCount > 0, interleaver: !tx.interleave, deinterleaver: !tx.interleave };
      for (const st of STAGES) {
        const isCh = st.side === 'ch';
        const x = isCh ? CHX : colX(st.col), y = isCh ? TY : st.side === 'tx' ? TY : RY;
        const w = isCh ? CHW : COLW, hh = isCh ? RY + BH - TY : BH;
        const sel = state.stage === st.id;
        const g = s('g', { class: 'chain-block' + (sel ? ' sel' : '') });
        g.append(s('rect', { x, y, width: w, height: hh, rx: 8, fill: sel ? '#0e3a52' : '#0d1422', stroke: sel ? '#38bdf8' : '#2b3a57', 'stroke-width': sel ? 2 : 1 }));
        if (isCh) drawChannelIcon(g, x, y, w, hh);
        else {
          st.label.forEach((l, i) => g.append(s('text', { x: x + w / 2, y: y + 18 + i * 13, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600 }, l)));
          g.append(s('text', { x: x + w / 2, y: y + BH - 8, 'text-anchor': 'middle', 'font-size': 10, class: 'mono', fill: bad[st.id] ? '#f87171' : '#93a0b8' }, metric[st.id]));
        }
        V.clickable(g, st.label.join(' '), () => { stopPlay(); state.stage = st.id; drawDiagram(); drawStage(); });
        svg.append(g);
      }
      // travelling token
      const tok = s('circle', { r: 7, class: 'chain-token', fill: '#e6eaf2', style: { transform: `translate(${centre(cur()).x}px, ${centre(cur()).y - BH / 2}px)` } });
      svg.append(tok);
      const legend = h('div', { class: 'chips small' }, Object.entries({ bits: 'bits', coded: 'coded bits', points: 'complex points', samples: 'time samples' })
        .map(([k, l]) => h('span', { class: 'chip' }, h('i', { style: { background: FLOW[k] } }), l)));
      const head = h('div', { class: 'view-head' }, h('h2', null, 'Transmitter → channel → receiver'),
        h('div', { class: 'chips' },
          h('button', { type: 'button', class: 'play', onclick: () => (state.playing ? stopPlay() : startPlay()) }, state.playing ? '■ stop' : '▶ follow the bits'),
          legend));
      const split = h('div', { class: 'split-row' },
        h('label', { class: 'ctl slider inline' }, h('span', null, 'Hardware / software boundary: ', h('b', null, `${state.split} of ${RX_STAGES.length}`), ' receiver blocks in hardware'),
          h('input', { type: 'range', min: 0, max: RX_STAGES.length, step: 1, value: state.split, oninput: (ev) => { state.split = Number(ev.target.value); drawDiagram(); drawOutputs(); } })));
      diagramWrap.replaceChildren(head, svg, split);
    }
    const cur = () => STAGES.find((st) => st.id === state.stage);

    function drawChannelIcon(g, x, y, w, hh) {
      const cx = x + w / 2;
      g.append(s('text', { x: cx, y: y + 18, 'text-anchor': 'middle', 'font-size': 11, 'font-weight': 600 }, 'Channel'));
      // two paths: direct and echo
      g.append(s('path', { d: `M${cx - 30},${y + 40} L${cx + 30},${y + 40}`, stroke: '#34d399', 'stroke-width': 2 }),
        s('path', { d: `M${cx - 30},${y + 44} Q${cx},${y + 44 + 40 * state.ch.echoGain} ${cx + 30},${y + 44}`, stroke: '#34d399', 'stroke-width': 1 + 2 * state.ch.echoGain, fill: 'none', opacity: 0.3 + 0.7 * state.ch.echoGain }));
      const lines = [`echo ${fmt(state.ch.echoDelayNs, 0)} ns × ${fmt(state.ch.echoGain, 2)}`, `CFO ${fmt(state.ch.cfoKHz, 0)} kHz`, `SNR ${fmt(state.ch.snrDb, 0)} dB`];
      lines.forEach((l, i) => g.append(s('text', { x: cx, y: y + 108 + i * 15, 'text-anchor': 'middle', 'font-size': 10, class: 'mono muted' }, l)));
      const giNs = res.tx.S.p.T_GI_ns;
      if (state.ch.echoGain > 0 && state.ch.echoDelayNs > giNs) g.append(s('text', { x: cx, y: y + hh - 10, 'text-anchor': 'middle', 'font-size': 10, fill: '#f87171' }, 'echo > GI!'));
    }

    /* ---------- "follow the bits" ---------- */
    function startPlay() {
      let i = STAGES.findIndex((st) => st.id === state.stage);
      if (i === STAGES.length - 1) i = -1;
      const step = () => {
        i++;
        if (i >= STAGES.length) { stopPlay(); return; }
        state.stage = STAGES[i].id;
        moveToken(); drawStage();
        state.playing = setTimeout(step, 3200);
      };
      state.playing = setTimeout(step, 50);
      drawDiagram();
    }
    function stopPlay() {
      if (state.playing) clearTimeout(state.playing);
      state.playing = null;
    }
    function moveToken() {
      // move the token smoothly (CSS transition), then refresh the highlight
      const tok = diagramWrap.querySelector('.chain-token');
      const c = centre(cur());
      if (tok) tok.style.transform = `translate(${c.x}px, ${c.y - (cur().side === 'ch' ? (RY + BH - TY) / 2 : BH / 2)}px)`;
      diagramWrap.querySelectorAll('.chain-block').forEach((g, i) => {
        const sel = STAGES[i].id === state.stage;
        g.classList.toggle('sel', sel);
        const r = g.querySelector('rect');
        r.setAttribute('fill', sel ? '#0e3a52' : '#0d1422'); r.setAttribute('stroke', sel ? '#38bdf8' : '#2b3a57'); r.setAttribute('stroke-width', sel ? 2 : 1);
      });
    }

    /* ---------- the selected stage ---------- */
    function every(ms, fn) { timers.push(setInterval(fn, ms)); }
    function drawStage() {
      timers.forEach(clearInterval); timers = [];
      const st = cur();
      const body = (STAGE_VIEWS[st.id] || (() => h('p', null, '…')))(res, { every, state, C, X, D });
      stageWrap.replaceChildren(h('div', { class: 'view-head' }, h('h2', null, term(st.term, st.label.join(' ')),
        h('span', { class: 'muted small' }, ` · ${st.side === 'tx' ? 'transmitter' : st.side === 'rx' ? 'receiver' : 'propagation'}`))), body);
    }

    /* ---------- received message + numbers ---------- */
    function drawOutputs() {
      const e = res.rx.errors, p = tx.S.p, D2 = D;
      const sent = state.cfg.text, got = res.rx.text;
      const row = (label, value, warn) => h('tr', null, h('td', null, label), h('td', { class: warn ? 'fail' : null }, value));
      const sifs = D2.interframe.bands['5'].SIFS;
      const inSw = RX_STAGES.slice(state.split);
      const late = inSw.length > 0;
      outputs.replaceChildren(
        h('h2', null, 'Received'),
        h('div', { class: 'rx-text' + (e.byteCount ? ' bad' : ' ok') }, diffText(sent, got)),
        h('div', { class: 'small muted' }, e.byteCount ? `${e.byteCount} of ${tx.msg.bytes.length} octets wrong` : 'every octet correct'),
        h('table', { class: 'kv' }, h('tbody', null,
          row(term('N_SYM'), tx.N_SYM),
          row(term('Data rate'), fmt(p.rateMbps, 2) + ' Mb/s'),
          row('raw bit errors', `${e.rawCount} / ${e.raw.length} (${fmt(100 * e.rawBer, 2)} %)`, e.rawCount > 0),
          row('after Viterbi', `${e.decodedCount} bit errors`, e.decodedCount > 0),
          row(term('EVM'), fmt(res.rx.evmDb, 1) + ' dB'),
          row(['estimated ', term('Carrier frequency offset', 'CFO')], fmt(res.rx.cfoEstKHz, 2) + ' kHz'),
        )),
        h('h2', { style: { marginTop: '16px' } }, 'Answer within ', term('SIFS')),
        h('p', { class: 'small' }, `After the last symbol the receiver has SIFS = ${sifs.value} µs (5 GHz `, h('span', { class: 'badge ' + sifs.status }, sifs.status),
          ') to decode, check the frame and start sending the ', term('ACK'), '.'),
        late ? h('div', null, h('label', { class: 'ctl slider' }, h('span', null, 'Host round trip (your assumption): ', h('b', null, state.hostUs + ' µs')),
          h('input', { type: 'range', min: 5, max: 500, step: 5, value: state.hostUs, oninput: (ev) => { state.hostUs = Number(ev.target.value); drawOutputs(); } })),
        h('div', { class: 'notice ' + (state.hostUs > sifs.value ? 'warn' : 'ok') },
          `${inSw.map((st) => st.label.join(' ')).join(', ')} run on the host: samples or bits must cross to it and the ACK back again — about ${state.hostUs} µs against ${sifs.value} µs. `,
          state.hostUs > sifs.value ? 'The ACK comes too late, so the sender assumes the frame was lost. This is why the lower PHY sits in dedicated hardware, and why all-software receivers usually cannot answer in time.'
            : 'With this (optimistic) latency the answer fits.'))
          : h('div', { class: 'notice ok' }, 'The whole receiver is in hardware: it decodes while the samples arrive, so the ACK can start on time.'),
      );
    }

    drawControls();
    update(true);
  };

  /** Sent vs received text, wrong characters marked. */
  function diffText(sent, got) {
    const a = [...sent], b = [...got];
    const n = Math.max(a.length, b.length);
    const out = [];
    for (let i = 0; i < n; i++) out.push(h('span', { class: a[i] === b[i] ? null : 'wrong', title: a[i] === b[i] ? null : `sent "${a[i] ?? ''}"` }, b[i] ?? '·'));
    return out;
  }

  /* ======================================================================
   *  Small drawing helpers
   * ==================================================================== */
  const SEG = { service: '#c084fc', payload: '#38bdf8', tail: '#fbbf24', pad: '#64748b' };
  /** Bits as small squares, `perRow` per line. colorOf(i, bit) → fill; ones solid, zeros faint. */
  function bitGrid(bits, perRow, colorOf, opts = {}) {
    const cell = opts.cell || Math.max(3, Math.min(12, Math.floor(780 / perRow)));
    const rows = Math.ceil(bits.length / perRow);
    const svg = s('svg', { class: 'diagram bits-grid', viewBox: `0 0 ${perRow * cell + 2} ${rows * cell + 2}`, role: 'img', 'aria-label': opts.label || 'bits' });
    bits.forEach((b, i) => {
      const x = 1 + (i % perRow) * cell, y = 1 + Math.floor(i / perRow) * cell;
      const c = colorOf(i, b);
      svg.append(s('rect', { x, y, width: cell - 1, height: cell - 1, rx: cell > 6 ? 1.5 : 0, fill: c, opacity: opts.flat ? 1 : b ? 1 : 0.22 }));
    });
    return svg;
  }
  /** Error strip: 1 = red. */
  const errGrid = (errs, perRow, label) => bitGrid(errs, perRow, (i, e) => (e ? '#f87171' : '#1f2a3d'), { flat: true, label, cell: Math.max(2, Math.min(9, Math.floor(780 / perRow))) });

  /** Constellation scatter. */
  function scatter(pointsSets, ideal, size, opts = {}) {
    const lim = (opts.lim || 1.45) * Math.max(1, ...ideal.map((z) => Math.max(Math.abs(z.re), Math.abs(z.im))));
    const S = size, c = S / 2, k = (S / 2 - 8) / lim;
    const svg = s('svg', { class: 'diagram constellation', viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': opts.label || 'constellation' },
      s('line', { x1: 4, x2: S - 4, y1: c, y2: c, stroke: '#2b3a57' }), s('line', { x1: c, x2: c, y1: 4, y2: S - 4, stroke: '#2b3a57' }));
    for (const z of ideal) svg.append(s('circle', { cx: c + z.re * k, cy: c - z.im * k, r: 2.2, fill: 'none', stroke: '#64748b' }));
    for (const set of pointsSets) for (const z of set.points) {
      const x = c + Math.max(-lim, Math.min(lim, z.re)) * k, y = c - Math.max(-lim, Math.min(lim, z.im)) * k;
      svg.append(s('circle', { cx: x, cy: y, r: set.r || 1.8, fill: z.bad ? '#f87171' : set.color, opacity: set.opacity || 0.8 }));
    }
    if (opts.title) svg.append(s('text', { x: 6, y: 14, class: 'small muted' }, opts.title));
    return svg;
  }

  /** Simple line/bar plot over subcarrier index. series: [{ values: [[k, y]], color, kind: 'line'|'bar'|'dots' }] */
  function kPlot(series, opts) {
    const Wp = 780, Hp = opts.height || 170, L = 40, R = 10, T = 12, B = 26;
    const ks = series.flatMap((se) => se.values.map((v) => v[0]));
    const k0 = Math.min(...ks), k1 = Math.max(...ks);
    const [y0, y1] = opts.y;
    const X = (k) => L + ((k - k0) / (k1 - k0 || 1)) * (Wp - L - R);
    const Y = (v) => T + (1 - (Math.max(y0, Math.min(y1, v)) - y0) / (y1 - y0)) * (Hp - T - B);
    const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': opts.label || 'plot' });
    for (const t of opts.yTicks || []) svg.append(s('line', { x1: L, x2: Wp - R, y1: Y(t), y2: Y(t), stroke: '#1f2a3d' }), s('text', { x: L - 6, y: Y(t) + 4, 'text-anchor': 'end', class: 'small muted mono' }, fmt(t, 1)));
    for (const t of [k0, 0, k1]) if (t >= k0 && t <= k1) svg.append(s('text', { x: X(t), y: Hp - 8, 'text-anchor': 'middle', class: 'small muted mono' }, V.signed(t, 0)));
    svg.append(s('text', { x: Wp - R, y: Hp - 8, 'text-anchor': 'end', class: 'small muted' }, 'subcarrier k'));
    if (opts.yLabel) svg.append(s('text', { x: 4, y: T + 2, class: 'small muted' }, opts.yLabel));
    for (const se of series) {
      if (se.kind === 'bar') for (const [k, v] of se.values) svg.append(s('line', { x1: X(k), x2: X(k), y1: Y(Math.max(y0, 0)), y2: Y(v), stroke: se.color, 'stroke-width': Math.max(1, (Wp - L - R) / (k1 - k0 + 1) * 0.6) }));
      else if (se.kind === 'dots') for (const [k, v] of se.values) svg.append(s('circle', { cx: X(k), cy: Y(v), r: se.r || 2.5, fill: se.color }));
      else svg.append(s('polyline', { points: se.values.map(([k, v]) => `${X(k).toFixed(1)},${Y(v).toFixed(1)}`).join(' '), fill: 'none', stroke: se.color, 'stroke-width': 2, 'stroke-dasharray': se.dash || null }));
    }
    return svg;
  }
  const db = (z) => 10 * Math.log10(Math.max(1e-6, z.re * z.re + z.im * z.im));
  const legendChips = (items) => h('div', { class: 'chips small' }, items.map(([c, l]) => h('span', { class: 'chip' }, h('i', { style: { background: c } }), l)));
  const statusBadge = (e) => h('span', { class: 'badge ' + e.status, title: (e.note || '') }, e.status);

  /* ======================================================================
   *  One view per stage
   * ==================================================================== */
  const STAGE_VIEWS = {
    bits(r, { C, D }) {
      const t = r.tx, sg = t.segments;
      const segOf = (i) => (i < sg.service ? 'service' : i < sg.service + sg.payload ? 'payload' : i < sg.service + sg.payload + sg.tail ? 'tail' : 'pad');
      const octets = t.msg.bytes.slice(0, 24).map((b, i) => h('span', { class: 'octet mono' }, b.toString(16).padStart(2, '0'),
        h('small', null, (b >> 0 & 1) + '' + (b >> 1 & 1) + (b >> 2 & 1) + (b >> 3 & 1) + (b >> 4 & 1) + (b >> 5 & 1) + (b >> 6 & 1) + (b >> 7 & 1)), i === 23 && t.msg.bytes.length > 24 ? ' …' : ''));
      const p = t.S.p;
      return h('div', null,
        h('p', null, `The message is ${t.msg.bytes.length} octets (UTF-8). 802.11 sends every octet least significant bit first:`),
        h('div', { class: 'octets' }, octets),
        h('p', null, 'The Data field adds the ', term('SERVICE field'), ` (${sg.service} zero bits), the `, term('Tail bits', 'tail bits'), ` (${sg.tail}) and `, term('Pad bits', 'pad bits'), ` (${sg.pad}) up to a whole number of OFDM symbols:`),
        legendChips([[SEG.service, 'SERVICE'], [SEG.payload, 'message (PSDU)'], [SEG.tail, 'tail'], [SEG.pad, 'pad']]),
        bitGrid(t.dataBits, 64, (i) => SEG[segOf(i)], { label: 'Data field bits' }),
        h('div', { class: 'formula' }, term('N_SYM'), ` = ⌈(${sg.service} + 8 × ${t.msg.bytes.length} + ${sg.tail}) / `, term('N_DBPS'), ` ${p.N_DBPS}⌉ = ${t.N_SYM}  ·  `, term('N_PAD'), ` = ${sg.pad}`),
        h('p', { class: 'small muted' }, 'Solid squares are 1s, faint ones 0s.'));
    },

    scrambler(r, { every, D }) {
      const t = r.tx, n = Math.min(48, t.dataBits.length);
      const svg = s('svg', { class: 'diagram', viewBox: '0 0 780 250', role: 'img', 'aria-label': 'Scrambler shift register' });
      const cellX = (i) => 200 + i * 52, cy = 60;
      const cells = [], cellT = [];
      for (let i = 0; i < 7; i++) {
        const r0 = s('rect', { x: cellX(i), y: cy - 18, width: 44, height: 36, rx: 6, fill: '#0d1422', stroke: '#2b3a57' });
        const tt = s('text', { x: cellX(i) + 22, y: cy + 6, 'text-anchor': 'middle', class: 'mono', 'font-size': 16 }, '');
        cells.push(r0); cellT.push(tt);
        svg.append(r0, tt, s('text', { x: cellX(i) + 22, y: cy - 24, 'text-anchor': 'middle', class: 'small muted' }, 'x' + (i + 1)));
      }
      const [hi, lo] = D.bitLevel.scrambler.value.polynomialExponents;
      const xorX = 140, xorY = cy + 72;
      svg.append(
        s('path', { d: `M${cellX(hi - 1) + 22},${cy + 18} V${xorY} H${xorX + 12}`, stroke: '#c084fc', fill: 'none' }),
        s('path', { d: `M${cellX(lo - 1) + 22},${cy + 18} V${xorY - 0}`, stroke: '#c084fc', fill: 'none' }),
        s('circle', { cx: xorX, cy: xorY, r: 12, fill: '#0d1422', stroke: '#c084fc', 'stroke-width': 2 }),
        s('text', { x: xorX, y: xorY + 5, 'text-anchor': 'middle', fill: '#c084fc', 'font-size': 16 }, '⊕'),
        s('path', { d: `M${xorX},${xorY - 12} V${cy} H${cellX(0) - 4}`, stroke: '#c084fc', fill: 'none', 'marker-end': 'url(#chArrow)' }),
        s('text', { x: 20, y: cy - 30, class: 'small muted' }, `S(x) = x^${hi} + x^${lo} + 1`),
        s('text', { x: 20, y: xorY + 32, class: 'small muted' }, 'feedback = x' + hi + ' ⊕ x' + lo + ' → scrambling bit'));
      const rowY = { data: 190, seq: 212, out: 234 };
      Object.entries({ data: 'data', seq: 'sequence', out: 'scrambled' }).forEach(([k, l]) => svg.append(s('text', { x: 6, y: rowY[k], class: 'small muted' }, l)));
      const rowCells = { data: [], seq: [], out: [] };
      for (let i = 0; i < n; i++) for (const k of ['data', 'seq', 'out']) {
        const b = k === 'data' ? t.dataBits[i] : k === 'seq' ? t.scrSeq[i] : t.scrambled[i];
        const tt = s('text', { x: 80 + i * 14.5, y: rowY[k], class: 'mono', 'font-size': 12, fill: k === 'out' && t.scrSeq[i] ? '#c084fc' : '#e6eaf2', opacity: 0.25 }, String(b));
        rowCells[k].push(tt); svg.append(tt);
      }
      const marker = s('rect', { x: 0, y: 176, width: 13, height: 64, rx: 3, fill: 'none', stroke: '#38bdf8' });
      svg.append(marker);
      let i = 0;
      const show = () => {
        const st = t.scrStates[i];
        st.forEach((b, j) => { cellT[j].textContent = b; cells[j].setAttribute('stroke', j === hi - 1 || j === lo - 1 ? '#c084fc' : '#2b3a57'); });
        for (const k of ['data', 'seq', 'out']) rowCells[k].forEach((c, j) => c.setAttribute('opacity', j <= i ? 1 : 0.25));
        marker.setAttribute('x', 80 + i * 14.5 - 3.5);
        i = (i + 1) % n;
      };
      show(); every(420, show);
      const flipped = t.scrSeq.reduce((a, b) => a + b, 0);
      return h('div', null, svg,
        h('p', null, `Seed ${t.seed} = ${t.state0.join('')}. Every data bit is XORed with the register output; ${flipped} of ${t.dataBits.length} bits get flipped (violet). `,
          'Because the first 7 SERVICE bits are zero, the first 7 scrambled bits ARE the register output — the receiver loads them as its state. ', statusBadge(D.bitLevel.scrambler)),
        h('p', { class: 'small muted' }, 'The 6 tail bits are set back to 0 after scrambling so the encoder ends in state 0. ', statusBadge(D.bitLevel.tailZeroedAfterScrambling)));
    },

    encoder(r, { every, D, X }) {
      const t = r.tx, n = Math.min(36, t.scrambled.length);
      const G = X.generators, K = X.constraintLength;
      const svg = s('svg', { class: 'diagram', viewBox: '0 0 780 300', role: 'img', 'aria-label': 'Convolutional encoder' });
      const cx = (i) => 170 + i * 58, cy = 120;
      const cellT = [];
      for (let i = 0; i < K; i++) {
        svg.append(s('rect', { x: cx(i), y: cy - 18, width: 46, height: 36, rx: 6, fill: '#0d1422', stroke: i === 0 ? '#38bdf8' : '#2b3a57' }),
          s('text', { x: cx(i) + 23, y: cy + 34, 'text-anchor': 'middle', class: 'small muted' }, i === 0 ? 'input' : 'd' + i));
        const tt = s('text', { x: cx(i) + 23, y: cy + 6, 'text-anchor': 'middle', class: 'mono', 'font-size': 16 }, '0');
        cellT.push(tt); svg.append(tt);
      }
      const adders = [{ y: 40, g: G[0], name: 'A', oct: D.bitLevel.convolutionalCode.value.generatorsOctal[0] }, { y: 210, g: G[1], name: 'B', oct: D.bitLevel.convolutionalCode.value.generatorsOctal[1] }];
      const outT = {};
      for (const a of adders) {
        const ax = cx(K) + 30;
        for (let i = 0; i < K; i++) if ((a.g >> (K - 1 - i)) & 1)
          svg.append(s('path', { d: `M${cx(i) + 23},${a.y < cy ? cy - 18 : cy + 18} V${a.y} H${ax - 12}`, stroke: a.name === 'A' ? '#fbbf24' : '#fb923c', fill: 'none', opacity: 0.7 }));
        svg.append(s('circle', { cx: ax, cy: a.y, r: 12, fill: '#0d1422', stroke: '#fbbf24', 'stroke-width': 2 }),
          s('text', { x: ax, y: a.y + 5, 'text-anchor': 'middle', fill: '#fbbf24', 'font-size': 16 }, '⊕'),
          s('text', { x: ax + 20, y: a.y + 5, class: 'small muted' }, `${a.name}  (g = ${a.oct} octal)`));
        outT[a.name] = s('text', { x: ax, y: a.y + (a.y < cy ? -18 : 32), 'text-anchor': 'middle', class: 'mono', 'font-size': 16, fill: '#fbbf24' }, '');
        svg.append(outT[a.name]);
      }
      const rows = { u: 258, A: 276, B: 294 };
      [['u', 'input'], ['A', 'A'], ['B', 'B']].forEach(([k, l]) => svg.append(s('text', { x: 6, y: rows[k], class: 'small muted' }, l)));
      const pat = D.bitLevel.puncturing.value[t.cfg.R];
      const cellsRow = { u: [], A: [], B: [] };
      for (let i = 0; i < n; i++) {
        const kept = { A: pat[0][i % pat[0].length], B: pat[1][i % pat[1].length] };
        for (const k of ['u', 'A', 'B']) {
          const b = k === 'u' ? t.scrambled[i] : t.enc[k][i];
          const tt = s('text', { x: 60 + i * 19, y: rows[k], class: 'mono' + (k !== 'u' && !kept[k] ? ' struck' : ''), 'font-size': 12, opacity: 0.2,
            fill: k === 'u' ? '#c084fc' : kept[k] ? '#fbbf24' : '#64748b' }, String(b));
          cellsRow[k].push(tt); svg.append(tt);
        }
      }
      let i = 0;
      const show = () => {
        const reg = t.enc.regs[i];
        for (let j = 0; j < K; j++) cellT[j].textContent = (reg >> (K - 1 - j)) & 1;
        outT.A.textContent = t.enc.A[i]; outT.B.textContent = t.enc.B[i];
        for (const k of ['u', 'A', 'B']) cellsRow[k].forEach((c, j) => c.setAttribute('opacity', j <= i ? 1 : 0.2));
        i = (i + 1) % n;
      };
      show(); every(450, show);
      return h('div', null, svg,
        h('p', null, `Each input bit produces A and B. `, term('Puncturing'), ` for R = ${t.cfg.R} removes the grey crossed-out bits: pattern A ${pat[0].join('')} / B ${pat[1].join('')}, so ${t.punc.bits.length} coded bits are sent for ${t.scrambled.length} data bits. `,
          statusBadge(D.bitLevel.convolutionalCode), ' ', statusBadge(D.bitLevel.puncturing)));
    },

    interleaver(r, { every, D }) {
      const t = r.tx, N = t.S.p.N_CBPS, nb = t.S.p.N_BPSCS;
      const show = Math.min(N, 3 * t.size.cols * Math.max(1, Math.ceil(48 / (3 * t.size.cols))));
      const all = N <= 432;
      const svg = s('svg', { class: 'diagram', viewBox: '0 0 780 210', role: 'img', 'aria-label': 'Interleaver permutation' });
      const xs = (i) => 10 + (i + 0.5) * (760 / N);
      const hue = (k) => `hsl(${(k / N) * 300},80%,62%)`;
      svg.append(s('text', { x: 10, y: 14, class: 'small muted' }, 'coded bits k (encoder order) — colour = position'),
        s('text', { x: 10, y: 204, class: 'small muted' }, 'positions j (transmit order) — every ' + nb + ' bits = one subcarrier'));
      const w = Math.max(1, 760 / N - 0.4);
      for (let k = 0; k < N; k++) {
        svg.append(s('rect', { x: xs(k) - w / 2, y: 20, width: w, height: 18, fill: hue(k) }));
        const j = t.interleave ? t.il.perm[k] : k;
        svg.append(s('rect', { x: xs(j) - w / 2, y: 170, width: w, height: 18, fill: hue(k) }));
      }
      const lines = [];
      for (let k = 0; k < (all ? N : show); k++) {
        const j = t.interleave ? t.il.perm[k] : k;
        const l = s('line', { x1: xs(k), y1: 40, x2: xs(j), y2: 168, stroke: hue(k), 'stroke-width': all && N > 200 ? 0.6 : 1.2, class: 'draw', style: { animationDelay: `${(k / (all ? N : show)) * 1.6}s` } });
        lines.push(l); svg.append(l);
      }
      for (let sc = 0; sc <= t.S.p.N_SD; sc += Math.max(1, Math.ceil(t.S.p.N_SD / 26))) svg.append(s('line', { x1: xs(sc * nb) - (760 / N) / 2, x2: xs(sc * nb) - (760 / N) / 2, y1: 188, y2: 192, stroke: '#93a0b8' }));
      const rule = D.bitLevel.interleaverRule;
      return h('div', null,
        t.interleave ? null : h('div', { class: 'notice warn' }, 'Interleaver switched off: bits go to the subcarriers in order. Try the "Deep fade" preset and compare the decoder.'),
        svg,
        h('p', null, `${N} coded bits per symbol are written into ${t.size.rows} rows × ${t.size.cols} columns and read out column by column, then neighbours are swapped between more and less reliable constellation bits. Neighbouring coded bits (similar colours) land on subcarriers far apart.`,
          all ? '' : ` Lines drawn for the first ${show} bits.`),
        h('div', { class: 'formula' }, rule.value.join('\n'), ' ', statusBadge(rule)),
        h('p', { class: 'small muted' }, t.cfg.gen === 'nonHT' ? ['16 columns (Clause 17) ', statusBadge(D.bitLevel.interleaverColumnsNonHT)]
          : [`${t.size.cols} columns × ${t.size.rows / nb}·N_BPSCS rows for one stream at 20 MHz `, statusBadge(D.bitLevel.interleaverSize20MHz)]));
    },

    mapper(r, { every, X, D }) {
      const t = r.tx, mod = t.cfg.mod, pts = X.constellationPoints(mod);
      const S = 320, lim = 1.3 * Math.max(...pts.map((z) => Math.abs(z.re)), 1), k = (S / 2 - 16) / lim, c = S / 2;
      const svg = s('svg', { class: 'diagram constellation big', viewBox: `0 0 ${S} ${S}`, role: 'img', 'aria-label': 'Constellation with Gray labels' },
        s('line', { x1: 6, x2: S - 6, y1: c, y2: c, stroke: '#2b3a57' }), s('line', { x1: c, x2: c, y1: 6, y2: S - 6, stroke: '#2b3a57' }),
        s('text', { x: S - 8, y: c - 6, 'text-anchor': 'end', class: 'small muted' }, 'I'), s('text', { x: c + 6, y: 14, class: 'small muted' }, 'Q'));
      const showLabels = pts.length <= 64;
      for (const z of pts) {
        svg.append(s('circle', { cx: c + z.re * k, cy: c - z.im * k, r: pts.length > 256 ? 1.6 : 3, fill: '#2b3a57' }, s('title', null, z.bits)));
        if (showLabels) svg.append(s('text', { x: c + z.re * k, y: c - z.im * k - 6, 'text-anchor': 'middle', class: 'mono', 'font-size': pts.length > 16 ? 6.5 : 10, fill: '#93a0b8' }, z.bits));
      }
      const ring = s('circle', { r: 9, fill: 'none', stroke: '#38bdf8', 'stroke-width': 2.5, class: 'pulse' });
      const trail = s('g');
      svg.append(trail, ring);
      const nShow = Math.min(t.S.p.N_SD, 40);
      const label = h('div', { class: 'map-now mono' });
      let i = 0;
      const step = () => {
        const z = t.symbols[0][i];
        ring.setAttribute('cx', c + z.re * k); ring.setAttribute('cy', c - z.im * k);
        trail.append(s('circle', { cx: c + z.re * k, cy: c - z.im * k, r: pts.length > 256 ? 2 : 4, fill: '#38bdf8', opacity: 0.85 }));
        label.replaceChildren(h('span', { class: 'chip' }, `subcarrier ${i + 1} of ${t.S.p.N_SD}`), ' bits ', h('b', null, z.bits), ` → ${fmt(z.re, 3)} ${z.im < 0 ? '−' : '+'} j${fmt(Math.abs(z.im), 3)}`);
        i++;
        if (i >= nShow) { i = 0; trail.replaceChildren(); }
      };
      step(); every(380, step);
      const K = 1 / Math.sqrt(D.bitLevel.meanEnergy.value[mod]);
      return h('div', { class: 'symbol-grid' },
        h('div', null, label,
          h('p', null, `Every ${t.S.p.N_BPSCS} coded bit${t.S.p.N_BPSCS > 1 ? 's' : ''} pick one of ${pts.length} points. Neighbouring points differ in exactly one bit (Gray coding), so the most likely mistake — the nearest neighbour — costs only one bit error. `,
            statusBadge(D.bitLevel.grayMapping)),
          h('div', { class: 'formula' }, `K_MOD = 1/√${D.bitLevel.meanEnergy.value[mod]} = ${fmt(K, 4)} scales the grid to unit average power `, statusBadge(D.bitLevel.meanEnergy)),
          h('p', { class: 'small muted' }, showLabels ? 'Labels: bits b0 b1 … (first half → I, second half → Q).' : 'Hover a point for its bits.')),
        svg);
    },

    tones(r) {
      const t = r.tx, sym = t.symbols[0], S = t.S;
      const values = new Map(S.dataK.map((k, d) => [k, sym[d]]));
      const pilots = S.pilotK.map((k) => [k, t.pilotValue.re]);
      return h('div', null,
        kPlot([
          { values: S.dataK.map((k) => [k, values.get(k).re]), color: '#38bdf8', kind: 'bar' },
          { values: S.dataK.map((k) => [k, values.get(k).im]), color: '#a78bfa', kind: 'dots', r: 2 },
          { values: pilots, color: '#fbbf24', kind: 'dots', r: 4 },
        ], { y: [-1.6, 1.6], yTicks: [-1, 0, 1], height: 190, label: 'Subcarrier values of OFDM symbol 1' }),
        legendChips([['#38bdf8', 'I (real) of each data point'], ['#a78bfa', 'Q (imaginary)'], ['#fbbf24', 'pilot (+1)']]),
        h('p', null, `The ${S.p.N_SD} points of symbol 1 go onto the `, term('Data subcarrier', 'data subcarriers'), ` in order of k; the ${S.p.N_SP} `, term('Pilot subcarrier', 'pilots'),
          ' get a known value; the ', term('DC subcarrier', 'DC'), ' and ', term('Guard subcarriers', 'guard'), ' subcarriers stay at 0. ',
          h('span', { class: 'muted small' }, 'Simplification: the pilots are always +1 here (the standard changes their sign from symbol to symbol).')));
    },

    ifft(r) {
      const t = r.tx, S = t.S, x = t.samples;
      const Wp = 780, Hp = 200, us = (n) => (n * S.Ts_ns) / 1000;
      const total = x.length, X = (n) => 10 + (n / total) * (Wp - 20);
      const peak = Math.max(...x.map((z) => Math.abs(z.re))) || 1;
      const Y = (v) => 100 - (v / peak) * 80;
      const svg = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Transmitted samples' });
      svg.append(s('rect', { x: X(0), y: 14, width: X(t.preambleLen) - X(0), height: 172, fill: '#34d399', opacity: 0.08 }),
        s('text', { x: X(0) + 4, y: 26, class: 'small', fill: '#34d399' }, 'training ×2'));
      for (let m = 0; m < t.N_SYM; m++) {
        const a = t.preambleLen + m * t.symLen;
        svg.append(s('rect', { x: X(a), y: 14, width: Math.max(0.5, X(a + S.gi) - X(a)), height: 172, fill: V.GI, opacity: 0.25 }));
      }
      const stepN = Math.max(1, Math.floor(total / 1500));
      const pts = [];
      for (let n = 0; n < total; n += stepN) pts.push(`${X(n).toFixed(1)},${Y(x[n].re).toFixed(1)}`);
      svg.append(s('polyline', { points: pts.join(' '), fill: 'none', stroke: '#34d399', 'stroke-width': 1 }),
        s('text', { x: Wp - 10, y: Hp - 4, 'text-anchor': 'end', class: 'small muted' }, `${fmt(us(total), 1)} µs  ·  ${total} samples`));
      return h('div', null, svg,
        legendChips([['#34d399', 'real part of the samples'], [V.GI, 'cyclic prefix (GI)']]),
        h('p', null, 'Each OFDM symbol: an ', term('IFFT'), ` of ${S.N} points (${fmt(S.p.T_DFT_ns / 1000, 1)} µs), then its last ${S.gi} samples (`,
          term('Guard interval', 'GI'), ` ${fmt(S.p.T_GI_ns / 1000, 1)} µs) copied in front — the `, term('Cyclic prefix', 'cyclic prefix'),
          `. Sample rate ${fmt(1000 / S.Ts_ns, 1)} Msample/s. In front: two copies of a known training symbol, used by the receiver for the frequency offset and the channel estimate.`),
        h('p', { class: 'small muted' }, 'Simplification: the training symbol stands in for the L-LTF / HT-LTF / VHT-LTF / HE-LTF; there is no L-STF and the receiver is told where the packet starts.'));
    },

    channel(r, { every, state }) {
      const t = r.tx, S = t.S, ch = r.ch;
      const giNs = S.p.T_GI_ns, maxNs = Math.max(2000, giNs * 1.2);
      const Wp = 380, Hp = 170, X = (ns) => 30 + (ns / maxNs) * (Wp - 50), Y0 = 140;
      const ir = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Impulse response' },
        s('line', { x1: 30, x2: Wp - 10, y1: Y0, y2: Y0, stroke: '#93a0b8' }),
        s('rect', { x: X(0), y: 20, width: X(giNs) - X(0), height: Y0 - 20, fill: V.GI, opacity: 0.12 }),
        s('text', { x: X(giNs) + 4, y: 32, class: 'small', fill: V.GI }, `GI ${giNs} ns`),
        s('text', { x: Wp - 10, y: Hp - 8, 'text-anchor': 'end', class: 'small muted' }, 'delay (ns)'));
      for (const tp of ch.taps) {
        const a = Math.hypot(tp.g.re, tp.g.im), xx = X(tp.delay * S.Ts_ns);
        ir.append(s('line', { x1: xx, x2: xx, y1: Y0, y2: Y0 - a * 110, stroke: tp.delay * S.Ts_ns > giNs ? '#f87171' : '#34d399', 'stroke-width': 3 }),
          s('circle', { cx: xx, cy: Y0 - a * 110, r: 4, fill: tp.delay * S.Ts_ns > giNs ? '#f87171' : '#34d399' }));
      }
      const H = [...ch.H.entries()].sort((a, b) => a[0] - b[0]);
      const fr = kPlot([{ values: H.map(([k, z]) => [k, db(z)]), color: '#34d399', kind: 'bar' }], { y: [-30, 6], yTicks: [-30, -20, -10, 0], height: 170, label: 'Channel gain per subcarrier', yLabel: '|H| dB' });
      // rotating phasor: phase turn per OFDM symbol caused by the frequency offset
      const perSym = 360 * state.ch.cfoKHz * 1e3 * S.p.T_SYM_ns * 1e-9;
      const ph = s('svg', { class: 'diagram phasor', viewBox: '0 0 140 140', role: 'img', 'aria-label': 'Phase rotation from the frequency offset' },
        s('circle', { cx: 70, cy: 70, r: 50, fill: 'none', stroke: '#2b3a57' }));
      const arm = s('line', { x1: 70, y1: 70, x2: 120, y2: 70, stroke: '#38bdf8', 'stroke-width': 3, 'stroke-linecap': 'round', style: { transformOrigin: '70px 70px', transition: 'transform .35s' } });
      ph.append(arm, s('circle', { cx: 70, cy: 70, r: 3, fill: '#38bdf8' }));
      let ang = 0;
      every(400, () => { ang += perSym; arm.style.transform = `rotate(${-ang}deg)`; });
      const isi = state.ch.echoGain > 0 && ch.delayNs > giNs;
      return h('div', null,
        h('div', { class: 'two-col' },
          h('div', null, h('h3', null, 'Impulse response'), ir,
            h('p', { class: 'small' }, isi ? h('span', { class: 'fail' }, `The echo (${ch.delayNs} ns) is longer than the GI (${giNs} ns): the end of each symbol leaks into the next one's FFT window — inter-symbol interference no equalizer can undo.`)
              : `Echo at ${ch.delayNs} ns, inside the ${giNs} ns guard interval: it only shapes the spectrum.`)),
          h('div', null, h('h3', null, 'Frequency offset'), ph,
            h('p', { class: 'small' }, `${fmt(state.ch.cfoKHz, 0)} kHz turns the constellation by ${fmt(perSym, 1)}° per OFDM symbol (${fmt(S.p.T_SYM_ns / 1000, 1)} µs).`))),
        h('h3', null, term('Multipath'), ': frequency-selective fading'), fr,
        h('p', null, 'Direct path + echo add up differently on every subcarrier: some are boosted, some fade. Echo strength near 1 creates deep notches — the subcarriers in them are almost lost. Then white noise at the chosen ', term('SNR'), ' is added.'));
    },

    fft(r) {
      const t = r.tx, rx = r.rx;
      const H = [...r.ch.H.entries()].sort((a, b) => a[0] - b[0]);
      const est = H.map(([k]) => [k, db(rx.Hest.get(k))]);
      const phTrue = H.map(([k, z]) => [k, Math.atan2(z.im, z.re)]);
      const phEst = H.map(([k]) => { const z = rx.Hest.get(k); return [k, Math.atan2(z.im, z.re)]; });
      return h('div', null,
        h('p', null, 'The receiver removes the cyclic prefix and runs an FFT over each symbol. From the two training symbols it first measures the ', term('Carrier frequency offset', 'frequency offset'),
          ` (phase drift between the copies: ${fmt(rx.cfoEstKHz, 2)} kHz), then divides each received training subcarrier by its known value — the `, term('Channel estimation', 'channel estimate'), ' (', term('CSI'), ').'),
        kPlot([{ values: H.map(([k, z]) => [k, db(z)]), color: '#34d399', kind: 'line' }, { values: est, color: '#38bdf8', kind: 'dots', r: 2 }],
          { y: [-30, 6], yTicks: [-30, -20, -10, 0], height: 170, yLabel: '|H| dB', label: 'Estimated vs true channel gain' }),
        kPlot([{ values: phTrue, color: '#34d399', kind: 'line' }, { values: phEst, color: '#38bdf8', kind: 'dots', r: 2 }],
          { y: [-Math.PI, Math.PI], yTicks: [-3, 0, 3], height: 130, yLabel: 'phase (rad)', label: 'Estimated vs true channel phase' }),
        legendChips([['#34d399', 'true channel'], ['#38bdf8', 'estimate (noisy)']]));
    },

    equalizer(r, { X, state }) {
      const t = r.tx, rx = r.rx, mod = t.cfg.mod, nb = t.S.p.N_BPSCS;
      const ideal = X.constellationPoints(mod);
      const mark = (set) => set.flatMap((pts, m) => pts.map((z, d) => Object.assign({}, z, { bad: X.demapPoint(z, nb, mod).join('') !== t.symbols[m][d].bits })));
      const before = mark(rx.eqBefore), after = mark(rx.eqAfter);
      const phases = rx.phase.map((p, m) => [m + 1, (p * 180) / Math.PI]);
      const Wp = 760, Hp = 90, n = Math.max(2, phases.length);
      const spark = s('svg', { class: 'diagram', viewBox: `0 0 ${Wp} ${Hp}`, role: 'img', 'aria-label': 'Pilot phase per symbol' },
        s('line', { x1: 30, x2: Wp, y1: 45, y2: 45, stroke: '#2b3a57' }),
        s('text', { x: 2, y: 14, class: 'small muted' }, '+180°'), s('text', { x: 2, y: 88, class: 'small muted' }, '−180°'),
        s('polyline', { points: phases.map(([m, d]) => `${30 + ((m - 1) / (n - 1)) * (Wp - 40)},${45 - (d / 180) * 40}`).join(' '), fill: 'none', stroke: '#fbbf24', 'stroke-width': 2 }));
      const badN = (set) => set.filter((z) => z.bad).length;
      return h('div', null,
        h('div', { class: 'two-col' },
          h('div', null, scatter([{ points: before, color: '#38bdf8' }], ideal, 300, { title: `after the equalizer (${badN(before)} wrong)` })),
          h('div', null, scatter([{ points: after, color: '#38bdf8' }], ideal, 300, { title: state.rx.pilotTracking ? `+ pilot phase tracking (${badN(after)} wrong)` : 'pilot tracking OFF' }))),
        h('p', null, 'Each received subcarrier is divided by its channel estimate (', term('Equalizer'), '). The pilots then show how far the whole symbol has turned since the training — that common phase is removed. Red points land in the wrong decision region.'),
        h('h3', null, 'Common phase measured on the pilots, per OFDM symbol'), spark,
        h('p', { class: 'small muted' }, `EVM ${fmt(rx.evmDb, 1)} dB over ${after.length} data points. Try "Frequency offset, no pilot tracking", then tick pilot tracking.`));
    },

    demapper(r) {
      const t = r.tx, e = r.rx.errors, N = t.S.p.N_CBPS;
      return h('div', null,
        h('p', null, 'The ', term('Demapper'), ` picks the nearest constellation point and outputs its ${t.S.p.N_BPSCS} bits. Comparing with what was sent: ${e.rawCount} of ${e.raw.length} coded bits are wrong (${fmt(100 * e.rawBer, 2)} %).`),
        h('h3', null, 'Coded-bit errors in transmit order — one row per OFDM symbol'),
        errGrid(e.raw, N, 'raw errors'),
        h('p', { class: 'small muted' }, 'Errors from a fade cluster in the same columns: neighbouring subcarriers carry neighbouring bits in transmit order.'));
    },

    deinterleaver(r) {
      const t = r.tx, e = r.rx.errors, N = t.S.p.N_CBPS;
      return h('div', null,
        t.interleave ? null : h('div', { class: 'notice warn' }, 'Interleaver OFF — a burst stays a burst.'),
        h('h3', null, 'Before: errors in transmit order'), errGrid(e.raw, N, 'errors before deinterleaving'),
        h('h3', null, 'After: errors in encoder order'), errGrid(e.coded, N, 'errors after deinterleaving'),
        h('p', null, 'The deinterleaver puts the coded bits back in the order the encoder produced them. ',
          t.interleave ? 'Errors that sat side by side on faded subcarriers are now spread far apart — exactly what the Viterbi decoder can correct.'
            : 'Without interleaving, errors from a fade stay next to each other, and a run of errors overwhelms the decoder.'));
    },

    decoder(r) {
      const t = r.tx, e = r.rx.errors;
      const fixed = e.rawCount - e.decodedCount;
      return h('div', null,
        h('div', { class: 'big-compare' },
          h('div', null, h('div', { class: 'big-num fail' }, e.rawCount), 'coded-bit errors in'),
          h('div', { class: 'arrow' }, '→'),
          h('div', null, h('div', { class: 'big-num ' + (e.decodedCount ? 'fail' : 'pass') }, e.decodedCount), 'data-bit errors out')),
        h('h3', null, 'Errors into the decoder (encoder order)'), errGrid(e.coded, t.S.p.N_CBPS, 'decoder input errors'),
        h('h3', null, 'Errors out of the decoder (data bits)'), errGrid(e.decoded, 64, 'decoder output errors'),
        h('p', null, 'The ', term('Viterbi decoder'), ` follows all 64 encoder states through the received sequence and keeps the most likely path (best path disagrees with ${r.rx.pathMetric} received bits). `,
          fixed > 0 && e.decodedCount === 0 ? `It corrected all ${e.rawCount} errors.` : e.decodedCount ? 'Too many or too clustered errors: some survive.' : '', ' Removed (punctured) bits count as unknown.'),
        h('p', { class: 'small muted' }, 'Hard decisions here; real receivers use soft bits (how sure each bit is), which gains about 2 dB.'));
    },

    descrambler(r) {
      const t = r.tx, rx = r.rx;
      const ok = rx.recoveredState.join('') === (rx.txStateAfter7 || []).join('');
      return h('div', null,
        h('p', null, 'The first 7 decoded bits are the scrambler output for 7 zero SERVICE bits — i.e. the register contents. The receiver loads them and continues the same sequence:'),
        h('div', { class: 'formula' }, `register after 7 bits (TX) ${(rx.txStateAfter7 || []).join('')}\nrecovered by the receiver ${rx.recoveredState.join('')}  ${ok ? '✓' : '✗ (decoder errors in the first bits)'}`),
        h('h3', null, 'Descrambled message bits (red = wrong)'),
        bitGrid(rx.payloadBits, 64, (i, b) => (rx.errors.payload[i] ? '#f87171' : '#38bdf8'), { label: 'descrambled bits' }));
    },

    message(r, { state }) {
      const e = r.rx.errors;
      return h('div', null,
        h('div', { class: 'rx-compare' },
          h('div', null, h('div', { class: 'small muted' }, 'sent'), h('div', { class: 'rx-text' }, state.cfg.text)),
          h('div', null, h('div', { class: 'small muted' }, 'received'), h('div', { class: 'rx-text ' + (e.byteCount ? 'bad' : 'ok') }, diffText(state.cfg.text, r.rx.text)))),
        h('p', null, e.byteCount ? `${e.byteCount} octet${e.byteCount > 1 ? 's' : ''} wrong. A real receiver would see a failed frame check (FCS) and send no ACK; the sender retries.`
          : 'Every octet arrived intact. With a valid frame check the receiver sends an ACK one SIFS later.'),
        h('p', { class: 'small muted' }, 'Beyond this chain: with several spatial streams a stream parser splits the bits and spatial mapping spreads them over the antennas; in OFDMA each user gets its own resource unit. Both are shown in the PPDU view.'));
    },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
