/* systems/wifi/module.js — registers the Wi-Fi system with the core.
 *
 * Holds the configuration, builds the controls from WifiCalc.options(), and moves
 * between the three zoom levels (subcarrier map ⊂ OFDM symbol ⊂ PPDU). All
 * numbers shown come from WifiCalc.analyze(config).
 */
(function (root) {
  'use strict';
  const { h, term, fmt } = root.Dom;
  const C = root.WifiCalc, D = C.data, V = root.WifiViews;

  /* Generations with views in the current milestone; the others are listed but disabled. */
  const AVAILABLE = { nonHT: true, HT: true, VHT: true, HE: true };
  /* Zoom levels, innermost first. */
  const LEVELS = ['subcarriers', 'symbol', 'ppdu'];
  const LEVEL_LABEL = { subcarriers: 'Subcarrier map', symbol: 'OFDM symbol', ppdu: 'PPDU' };

  function glossary() {
    return Object.entries(D.terms).map(([id, t]) => {
      const doc = D.documents[t.doc];
      let ref = `${doc.doc}, Clause ${doc.clause} — ${doc.title}`;
      if (t.cited) ref += `. Sub-clause cited by a secondary source: ${t.cited.ref}`;
      return { id, label: id, expansion: t.expansion, alias: t.alias, definition: t.definition, ref,
        note: 'Clause numbers were not read in the standard itself — see VERIFICATION.md.' };
    });
  }

  function mountPpdu(container) {
    const state = {
      cfg: { gen: 'nonHT', band: '5', bw: 20, gi: 0.8, nss: 1, mod: '64-QAM', R: '3/4', payload: 1500 },
      level: 'subcarriers', symbolIndex: 1, field: 'data', selected: null,
      ru: null, // RU size of the HE MU / TB overlay on the subcarrier map (null = off)
    };
    let a = C.analyze(state.cfg);

    const controls = h('section', { class: 'panel controls', 'aria-label': 'Configuration' });
    const crumbs = h('nav', { class: 'crumbs', 'aria-label': 'Zoom level' });
    const stageEl = h('div');
    const info = h('div');
    const outputs = h('section', { class: 'panel outputs', 'aria-live': 'polite' });
    const checks = h('section', { class: 'panel', style: { marginTop: '16px' } });
    container.append(h('div', { class: 'ppdu-mode' }, controls, h('section', { class: 'stage-wrap' }, crumbs, stageEl, info), outputs), checks);
    const stage = root.Zoom.stage(stageEl);

    /* ---------- views ---------- */
    const renderer = (level) => (el) => {
      if (level === 'subcarriers') el.append(V.frequency(a, { field: state.field, onField: (f) => { state.field = f; redraw(); },
        ru: state.ru, onRu: (size) => { state.ru = size; redraw(); } }));
      else if (level === 'symbol') el.append(V.symbol(a, { index: state.symbolIndex, onIndex: (i) => { state.symbolIndex = i; redraw(); }, onZoomIn: (r) => go('subcarriers', r) }));
      else el.append(V.ppdu(a, { selected: state.selected, symbolIndex: state.symbolIndex,
        onField: (name) => { state.selected = name; redraw(); },
        onSymbol: (i, r) => { state.symbolIndex = i; go('symbol', r); } }));
    };
    // where a level sits inside the next outer level (used to aim the zoom animation)
    const anchorIn = (outer) => (outer === 'symbol' ? '[data-zoom-target="useful"]' : `[data-zoom-symbol="${state.symbolIndex}"]`);

    function go(level, fromRect) {
      const from = LEVELS.indexOf(state.level), to = LEVELS.indexOf(level);
      if (from === to) return;
      if (to < from) {
        const anchor = stage.view && stage.view.querySelector(anchorIn(state.level));
        const rect = fromRect || (anchor && anchor.getBoundingClientRect());
        state.level = level;
        stage.zoomIn(renderer(level), rect);
      } else {
        state.level = level;
        stage.zoomOut(renderer(level), anchorIn(level)); // shrink into where the inner view sits
      }
      drawCrumbs();
      drawInfo();
    }

    function drawCrumbs() {
      const parts = [];
      LEVELS.forEach((lv, i) => {
        if (i) parts.push(h('span', { class: 'arrow', 'aria-hidden': 'true' }, '⊂'));
        parts.push(h('button', { type: 'button', 'aria-current': String(lv === state.level), onclick: () => go(lv) }, LEVEL_LABEL[lv]));
      });
      parts.push(h('span', { class: 'muted small' }, '  smallest unit → whole packet; click inside a view to zoom in'));
      crumbs.replaceChildren(...parts);
    }

    function drawInfo() {
      info.replaceChildren();
      if (state.level === 'ppdu' && state.selected) {
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
      redraw();
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

    function redraw() {
      a = C.analyze(state.cfg);
      state.symbolIndex = Math.min(state.symbolIndex, a.symbols.N_SYM);
      if (state.selected && !a.timeline.items.some((i) => i.name === state.selected)) state.selected = null;
      drawControls();
      drawCrumbs();
      stage.show(renderer(state.level));
      drawInfo();
      outputs.replaceChildren(V.outputs(a));
    }

    checks.append(V.checks(C.runChecks()));
    redraw();
  }

  root.Systems.register({
    id: 'wifi',
    title: 'Wi-Fi PPDU explorer',
    subtitle: 'How an IEEE 802.11 PPDU is built, from one subcarrier to the whole packet. Hover any underlined term for its definition and clause.',
    glossaryTitle: 'Wi-Fi glossary (IEEE 802.11 terms)',
    glossary,
    modes: [
      { id: 'ppdu', label: 'PPDU view', mount: mountPpdu },
      { id: 'chain', label: 'Transmitter → receiver', disabled: 'Transmitter → receiver chain: milestone (e)', disabledShort: '(e)' },
      { id: 'compare', label: 'Generations compared', disabled: 'Comparison across generations: milestone (e)', disabledShort: '(e)' },
    ],
  });
})(typeof globalThis !== 'undefined' ? globalThis : this);
