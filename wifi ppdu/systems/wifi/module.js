/* systems/wifi/module.js — registers the Wi-Fi system with the core.
 *
 * Holds the configuration, builds the controls from WifiCalc.options(), and moves
 * between the zoom levels PPDU > Data field > OFDM symbol (Time | Spectrum) >
 * Subcarrier (state and URL hash in WifiNav). All numbers shown come from
 * WifiCalc.analyze(config).
 */
(function (root) {
  'use strict';
  const { h, term, fmt } = root.Dom;
  const C = root.WifiCalc, D = C.data, V = root.WifiViews;

  /* Generations with views in the current milestone; the others are listed but disabled. */
  const AVAILABLE = { nonHT: true, HT: true, VHT: true, HE: true };
  const Nav = root.WifiNav;

  function glossary() {
    return Object.entries(D.terms).map(([id, t]) => {
      const doc = D.documents[t.doc];
      let ref = `${doc.doc}, Clause ${doc.clause} — ${doc.title}`;
      if (t.cited) ref += `. Sub-clause cited by a secondary source: ${t.cited.ref}`;
      return { id, label: id, expansion: t.expansion, alias: t.alias, definition: t.definition, ref,
        note: 'Clause numbers were not read in the standard itself — see VERIFICATION.md.' };
    });
  }

  /* State shared by the three modes (the core remounts a mode on every tab switch). */
  const shared = { cfg: { gen: 'nonHT', band: '5', bw: 20, gi: 0.8, nss: 1, mod: '64-QAM', R: '3/4', payload: 1500 }, nav: null };

  /** The configuration fields written to the URL hash. */
  function hashCfg(cfg) {
    const out = { gen: cfg.gen, band: cfg.band, bw: cfg.bw, gi: cfg.gi, nss: cfg.nss, payload: cfg.payload };
    if (cfg.mcs !== null && cfg.mcs !== undefined) out.mcs = cfg.mcs; else { out.mod = cfg.mod; out.R = cfg.R; }
    if (cfg.gen === 'HE') { out.ltf = cfg.ltf; out.nominalPadding = cfg.nominalPadding; }
    return out;
  }

  function mountPpdu(container) {
    // position and configuration: the URL hash wins (deep link, back button), then what the other modes left
    const fromHash = Nav.parse(location.hash);
    const hasHash = /level=/.test(location.hash);
    const state = {
      cfg: C.normalize(Object.assign({}, shared.cfg, hasHash ? fromHash.cfg : {})).cfg,
      nav: hasHash ? fromHash.nav : Object.assign({}, Nav.DEFAULT, shared.nav),
      selected: null,
      ru: null, // RU size of the HE MU / TB overlay on the subcarrier map (null = off)
      mapWindow: null, // first subcarrier of the 64-subcarrier zoom window (wide FFTs)
    };
    let a = C.analyze(state.cfg);
    const limits = () => ({ nSym: a.symbols.N_SYM, fft: a.dataTones.fft });
    state.nav = shared.nav = Nav.clamp(state.nav, limits());

    const controls = h('section', { class: 'panel controls', 'aria-label': 'Configuration' });
    const ctxArea = h('div', { class: 'ctx' }); // sticky: breadcrumb + one strip per level above
    const stageEl = h('div');
    const info = h('div');
    const outputs = h('section', { class: 'panel outputs', 'aria-live': 'polite' });
    const checks = h('section', { class: 'panel', style: { marginTop: '16px' } });
    container.append(h('div', { class: 'ppdu-mode' }, controls, h('section', { class: 'stage-wrap' }, ctxArea, stageEl, info), outputs), checks);
    const stage = root.Zoom.stage(stageEl);
    // the output panel scrolls on its own and always ends inside the window, wherever it currently sits
    const fitOutputs = () => {
      if (!outputs.isConnected) { removeEventListener('scroll', fitOutputs); removeEventListener('resize', fitOutputs); return; }
      const top = Math.max(12, outputs.getBoundingClientRect().top);
      outputs.style.setProperty('--out-max', `${Math.max(240, innerHeight - top - 12)}px`);
    };
    addEventListener('scroll', fitOutputs, { passive: true });
    addEventListener('resize', fitOutputs);
    requestAnimationFrame(fitOutputs);

    /* ---------- views ---------- */
    const render = (el) => {
      const nav = state.nav;
      if (nav.level === 'ppdu') el.append(V.ppdu(a, { selected: state.selected, symbolIndex: nav.sym,
        onField: (name) => { state.selected = name; stage.show(render); drawInfo(); },
        onData: (r) => navigate({ level: 'data' }, r),
        onSymbol: (i, r) => navigate({ level: 'symbol', sym: i }, r) }));
      else if (nav.level === 'data') el.append(V.dataField(a, { index: nav.sym,
        onIndex: (i) => navigate({ sym: i }, null, true),
        onZoomIn: (i, r) => navigate({ level: 'symbol', sym: i }, r) }));
      else if (nav.level === 'subcarrier' && V.subcarrier) el.append(V.subcarrier(a, nav, { navigate }));
      else if (nav.view === 'time') el.append(V.symbol(a, { index: nav.sym,
        onIndex: (i) => navigate({ sym: i }, null, true),
        onZoomIn: (r) => navigate({ view: 'spectrum' }, r) }));
      else el.append(V.frequency(a, { field: nav.field, onField: (f) => navigate({ field: f }, null, true),
        ru: state.ru, onRu: (size) => { state.ru = size; stage.show(render); },
        windowStart: state.mapWindow, onWindow: (k) => { state.mapWindow = k; stage.show(render); },
        onSubcarrier: V.subcarrier ? (k, r) => navigate({ level: 'subcarrier', sc: k }, r) : null }));
    };
    // where the inner level sits inside the outer view (target of the zoom-out animation)
    const anchorIn = (outer, inner) => (outer.level === 'ppdu'
      ? (inner.level === 'data' ? '[data-zoom-target="data"]' : `[data-zoom-symbol="${inner.sym}"]`)
      : outer.level === 'data' ? `[data-zoom-symbol="${inner.sym}"]`
        : outer.view === 'time' ? '[data-zoom-target="useful"]' : `[data-zoom-k="${inner.sc}"]`);

    /** Go somewhere: patch the position, keep it valid, record it in the URL, animate. */
    function navigate(patch, fromRect, replaceHistory) {
      const prev = state.nav;
      state.nav = shared.nav = Nav.clamp(Object.assign({}, prev, patch), limits());
      writeHash(replaceHistory || prev.level === state.nav.level);
      transition(prev, state.nav, fromRect);
    }
    function transition(prev, next, fromRect) {
      const d0 = Nav.depth(prev.level), d1 = Nav.depth(next.level);
      if (d1 > d0 && fromRect) stage.zoomIn(render, fromRect);
      else if (d1 < d0) stage.zoomOut(render, anchorIn(next, prev));
      else if (d1 === d0 && prev.view !== next.view && fromRect) stage.zoomIn(render, fromRect);
      else stage.show(render);
      drawChrome();
      drawInfo();
    }
    function writeHash(replace) {
      const hsh = Nav.format(state.nav, hashCfg(state.cfg));
      if (hsh === location.hash) return;
      try { history[replace ? 'replaceState' : 'pushState'](null, '', hsh); } catch (e) { location.hash = hsh; }
    }
    // back / forward buttons and hand-edited links
    const onPop = () => {
      if (!container.isConnected) { removeEventListener('popstate', onPop); removeEventListener('hashchange', onPop); return; }
      if (location.hash === Nav.format(state.nav, hashCfg(state.cfg))) return;
      const { nav, cfg } = Nav.parse(location.hash);
      const prev = state.nav;
      state.cfg = shared.cfg = C.normalize(Object.assign({}, state.cfg, cfg)).cfg;
      a = C.analyze(state.cfg);
      state.nav = shared.nav = Nav.clamp(nav, limits());
      drawControls();
      outputs.replaceChildren(V.outputs(a));
      transition(prev, state.nav, null);
      writeHash(true); // show the clamped position in the address bar
    };
    addEventListener('popstate', onPop);
    addEventListener('hashchange', onPop);
    // keyboard: ← → previous / next symbol (or subcarrier), Esc zooms out
    const onKey = (e) => {
      if (!container.isConnected) { removeEventListener('keydown', onKey); return; }
      if (e.altKey || e.ctrlKey || e.metaKey || (e.target.closest && e.target.closest('input, select, textarea, .drawer'))) return;
      const lv = state.nav.level;
      if (e.key === 'Escape' && lv !== 'ppdu') { e.preventDefault(); navigate({ level: Nav.parent(lv) }); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const d = e.key === 'ArrowLeft' ? -1 : 1;
        if (lv === 'data' || lv === 'symbol') { e.preventDefault(); navigate({ sym: state.nav.sym + d }, null, true); }
        else if (lv === 'subcarrier') { e.preventDefault(); navigate({ sc: state.nav.sc + d }, null, true); }
      }
    };
    addEventListener('keydown', onKey);

    function drawChrome() {
      const cb = {
        onLevel: (lv) => navigate({ level: lv }),
        onView: (v) => navigate({ view: v }, null, true),
        onSymbol: (i) => navigate({ sym: i }, null, true),
        onSubcarrier: (k) => navigate({ sc: k }, null, true),
      };
      ctxArea.replaceChildren(V.breadcrumb(a, state.nav, cb), V.contextStrips(a, state.nav, cb));
    }

    function drawInfo() {
      info.replaceChildren();
      if (state.nav.level === 'ppdu' && state.selected) {
        const card = V.fieldInfo(a, state.selected);
        if (card) info.append(card);
      }
    }

    /* ---------- controls ---------- */
    let adjustNote = null;
    function setCfg(patch) {
      let cfg = C.normalize(Object.assign({}, state.cfg, patch)).cfg;
      adjustNote = null;
      // combinations the MCS tables do not define (VHT): step down to the nearest defined MCS
      const ex = C.exclusion(cfg);
      if (ex) {
        const allowed = C.options(cfg).mcs.filter((m) => m.mcs < cfg.mcs && !C.exclusion(Object.assign({}, cfg, { mcs: m.mcs })));
        const fallback = allowed[allowed.length - 1];
        adjustNote = `MCS ${cfg.mcs} is not defined for ${cfg.bw} MHz with N_SS = ${cfg.nss} (${ex.note}${ex.status === 'unverified' ? ' — unverified' : ''}). Using MCS ${fallback.mcs}.`;
        cfg = C.normalize(Object.assign({}, cfg, { mcs: fallback.mcs, mod: null, R: null })).cfg;
      }
      state.cfg = cfg;
      shared.cfg = cfg;
      redraw();
      writeHash(true);
    }
    function select(labelNode, value, options, onchange, disabled) {
      return h('label', { class: 'ctl' }, h('span', null, labelNode),
        h('select', { onchange: (e) => onchange(e.target.value), disabled: disabled || options.length < 2 },
          options.map((o) => h('option', { value: o.value, selected: String(o.value) === String(value), disabled: o.disabled }, o.label))));
    }
    function drawControls() {
      const cfg = state.cfg, g = C.generation(cfg.gen), o = C.options(cfg);
      const mods = [...new Set(o.mcs.map((m) => m.mod))];
      const rates = o.mcs.filter((m) => m.mod === cfg.mod);
      const maxLen = o.maxPayload; // null: no length-field limit (HE); the 5484 µs PPDU cap still applies
      const pf = g.payloadField;
      const rateLabel = (m) => {
        if (m.rateLabel) return `${m.R} (${m.rateLabel})`;
        const ex = C.exclusion(Object.assign({}, cfg, { mcs: m.mcs }));
        return `${m.R} (MCS ${C.displayMcs(Object.assign({}, cfg, { mcs: m.mcs }))})${ex ? ' — not defined' : ''}`;
      };
      controls.replaceChildren(...[
        h('h2', null, 'Configuration'),
        select('PHY generation', cfg.gen, Object.entries(D.generations).map(([id, gg]) => ({
          value: id, label: `${gg.label} — ${gg.phyName.split(' (')[0]}${AVAILABLE[id] === true ? '' : ` (${AVAILABLE[id]})`}`, disabled: AVAILABLE[id] !== true,
        })), (v) => setCfg({ gen: v })),
        select(term('Band'), cfg.band, o.bands.map((b) => ({ value: b, label: g.bands[b].label })), (v) => setCfg({ band: v })),
        select(term('Channel bandwidth'), cfg.bw, o.bandwidths.map((b) => ({ value: b, label: b + ' MHz' })), (v) => setCfg({ bw: Number(v) })),
        select(term('Guard interval'), cfg.gi, o.guardIntervals.map((x) => ({ value: x, label: x + ' µs' })), (v) => setCfg({ gi: Number(v) })),
        // HE: HE-LTF type, offered only in the combinations with the selected GI that the data file allows
        o.ltfTypes ? select(term('HE-LTF type'), cfg.ltf, o.ltfTypes.filter((x) => x.gi === cfg.gi).map((x) => ({ value: x.ltf, label: `${x.ltf} HE-LTF` })),
          (v) => setCfg({ ltf: v })) : null,
        select(term('Constellation mapping', 'Modulation'), cfg.mod, mods.map((m) => ({ value: m, label: m })), (v) => setCfg({ mod: v, R: null, mcs: null })),
        select(term('R', 'Coding rate R'), cfg.R, rates.map((m) => ({ value: m.R, label: rateLabel(m),
          disabled: m.mcs !== null && !!C.exclusion(Object.assign({}, cfg, { mcs: m.mcs })) })), (v) => setCfg({ R: v, mcs: null })),
        select(term('N_SS', 'Spatial streams'), cfg.nss, o.spatialStreams.map((n) => ({ value: n, label: n })), (v) => setCfg({ nss: Number(v) })),
        o.nominalPadding ? select(term('Nominal packet padding'), cfg.nominalPadding, o.nominalPadding.map((x) => ({ value: x, label: x + ' µs' })),
          (v) => setCfg({ nominalPadding: Number(v) })) : null,
        h('label', { class: 'ctl' }, h('span', null, pf.label, ' (', term(pf.term, pf.name), ', octets)'),
          h('input', { type: 'number', min: 1, max: maxLen === null ? undefined : maxLen, value: cfg.payload,
            onchange: (e) => setCfg({ payload: Number(e.target.value) || 1 }) }),
          h('div', { class: 'hint' }, maxLen === null ? 'limited by the 5484 µs maximum PPDU duration' : `1 … ${maxLen} octets`)),
        adjustNote ? h('div', { class: 'notice warn' }, adjustNote) : null,
        h('div', { class: 'hint' }, term(g.ppduFormat, g.ppduFormat), ' · ', D.documents[g.bands[cfg.band].doc || g.doc].doc, ', Clause ', D.documents[g.bands[cfg.band].doc || g.doc].clause),
        g.coding === 'LDPC' ? h('div', { class: 'hint' }, 'Coding: ', term('LDPC'), ' for every configuration (simplification: BCC is also allowed for MCS ≤ ',
          g.codingRule.value.bccMaxMcs, ', N_SS ≤ ', g.codingRule.value.bccMaxNss, ', RU ≤ ', g.codingRule.value.bccMaxRuTones, ' tones).') : null,
      ].filter(Boolean)); // replaceChildren would print "null" for empty slots
    }

    /** After a configuration change: same level if still valid, indices clamped (WifiNav.clamp). */
    function redraw() {
      a = C.analyze(state.cfg);
      state.nav = shared.nav = Nav.clamp(state.nav, limits());
      if (state.selected && !a.timeline.items.some((i) => i.name === state.selected)) state.selected = null;
      drawControls();
      drawChrome();
      stage.show(render);
      drawInfo();
      outputs.replaceChildren(V.outputs(a));
    }

    checks.append(V.checks(C.runChecks()));
    redraw();
    writeHash(true);
  }

  root.Systems.register({
    id: 'wifi',
    title: 'Wi-Fi PPDU explorer',
    subtitle: 'How an IEEE 802.11 PPDU is built, from one subcarrier to the whole packet. Hover any underlined term for its definition and clause.',
    glossaryTitle: 'Wi-Fi glossary (IEEE 802.11 terms)',
    glossary,
    modes: [
      { id: 'ppdu', label: 'PPDU view', mount: mountPpdu },
      { id: 'chain', label: 'Transmitter → receiver', mount: (el, ctx) => V.mountChain(el, ctx, shared) },
      { id: 'compare', label: 'Generations compared', mount: (el, ctx) => V.mountCompare(el, ctx, shared) },
    ],
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
