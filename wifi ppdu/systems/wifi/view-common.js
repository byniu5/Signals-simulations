/* systems/wifi/view-common.js — shared drawing helpers for the Wi-Fi views. */
(function (root) {
  'use strict';
  const V = (root.WifiViews = root.WifiViews || {});

  /** Colours and glossary terms for each subcarrier kind returned by WifiCalc. */
  V.KIND = {
    data:  { color: '#38bdf8', term: 'Data subcarrier',  label: 'data' },
    pilot: { color: '#fbbf24', term: 'Pilot subcarrier', label: 'pilot' },
    dc:    { color: '#f87171', term: 'DC subcarrier',    label: 'DC' },
    null:  { color: '#a78bfa', term: 'Null subcarrier',  label: 'null' },
    guard: { color: '#64748b', term: 'Guard subcarriers', label: 'guard' },
  };
  /** Colours for PPDU timeline items (kind from WifiCalc.timeline). */
  V.FIELD = { training: '#34d399', signal: '#c084fc', data: '#38bdf8', pe: '#fbbf24', gap: '#475569' };
  V.GI = '#fb923c';

  /** A "nice" axis step (1, 2, 5 × 10^n) giving about `target` ticks over `span`. */
  V.niceStep = (span, target) => {
    const raw = span / target, mag = 10 ** Math.floor(Math.log10(raw));
    return [1, 2, 5, 10].map((m) => m * mag).find((st) => st >= raw) || 10 * mag;
  };

  /** Consecutive runs of the same subcarrier kind: [{kind, from, to, n}]. */
  V.runs = (tones) => {
    const out = [];
    for (const t of tones) {
      const last = out[out.length - 1];
      if (last && last.kind === t.kind && last.to === t.k - 1) { last.to = t.k; last.n++; }
      else out.push({ kind: t.kind, from: t.k, to: t.k, n: 1 });
    }
    return out;
  };

  /** Signed number for subcarrier indices / frequency offsets. */
  V.signed = (x, d = 3) => (x > 0 ? '+' : x < 0 ? '−' : '') + root.Dom.fmt(Math.abs(x), d);

  /** µs from ns with a sensible number of decimals. */
  V.us = (ns) => root.Dom.fmt(ns / 1000, 3);

  /** Name of the useful-symbol duration in the selected generation (Clause 17: T_FFT, later: T_DFT). */
  V.tUsefulName = (a) => {
    const names = root.WifiCalc.generation(a.cfg.gen).termNames || {};
    return names.T_DFT || 'T_DFT';
  };

  /**
   * Readable name for a data path recorded by WifiCalc's dependency tracking,
   * e.g. 'generations.HT.fields[HT-SIG].duration' → '802.11n: HT-SIG duration'.
   */
  V.depLabel = (path) => {
    const D = root.WifiCalc.data;
    let m = path.match(/^generations\.(\w+)\.(.+)$/);
    if (m) {
      const gen = D.generations[m[1]] ? D.generations[m[1]].label + ': ' : '';
      const rest = m[2];
      const rules = [
        [/^fields\[(.+)\]\.duration$/, (x) => `${x[1]} duration`],
        [/^fields\[(.+)\]\.durationEach$/, (x) => `${x[1]} symbol duration`],
        [/^encoders$/, () => 'number of BCC encoders (N_ES rule)'],
        [/^N_LTF$/, () => 'number of long-training symbols (N_LTF per N_SS)'],
        [/^dataField\.N_DBPS_rounding$/, () => 'rounding of a fractional N_DBPS (floor)'],
        [/^dataField\.N_SD_short$/, () => 'N_SD,short table'],
        [/^dataField\.(\w+)$/, (x) => `${x[1]} of the Data field`],
        [/^toneplan\.(\d+)\.(\w+)$/, (x) => `${x[2]} of the ${x[1]} MHz tone plan`],
        [/^ofdm\.(\w+)$/, (x) => `OFDM parameter ${x[1]}`],
        [/^heLtf\.symbolWithoutGi$/, () => 'HE-LTF symbol duration (1x/2x/4x)'],
        [/^packetExtension\.T_PE$/, () => 'packet extension duration table (T_PE)'],
        [/^padding\.equations$/, () => 'pre-FEC padding equations'],
        [/^txtime\.shortGiRounding$/, () => 'short-GI rounding of TXTIME'],
        [/^txtime\.legacySymbol$/, () => 'legacy 4 µs symbol for TXTIME rounding'],
        [/^exclusions$/, () => 'excluded MCS / bandwidth / N_SS combinations'],
        [/^resourceUnits\.(\w+)$/, (x) => `resource-unit ${x[1]}`],
      ];
      for (const [re, f] of rules) { const x = rest.match(re); if (x) return gen + f(x); }
      return gen + rest;
    }
    const fixed = {
      'ldpc.codewordTable': 'LDPC codeword table (N_CW, L_LDPC thresholds)',
      'ldpc.extraSymbolCondition': 'LDPC extra-symbol condition (0.1 / 1.2 factors)',
      'lsig.nonHtLength': 'L-SIG LENGTH rule for Non-HT (PSDU length)',
      'lsig.spoofRule': 'L-SIG LENGTH rule for HT / VHT / HE',
      'lsig.heM': 'L-SIG LENGTH offset m for HE',
      'lsig.maxLength': 'maximum L-SIG LENGTH',
      'lsig.maxPpdu': 'maximum PPDU duration',
      'interframe.signalExtension': 'signal extension (2.4 GHz)',
      'legacy.phaseRotationDeg': 'per-20 MHz phase rotation',
      'mcsTable': 'MCS table',
    };
    if (fixed[path]) return fixed[path];
    m = path.match(/^modulations\.(.+)\.N_BPSCS$/);
    if (m) return `N_BPSCS of ${m[1]}`;
    return path;
  };

  /** Keyboard + mouse activation for clickable SVG shapes. */
  V.clickable = (el, label, handler) => {
    el.setAttribute('class', ((el.getAttribute('class') || '') + ' clickable').trim());
    el.setAttribute('tabindex', '0');
    el.setAttribute('role', 'button');
    el.setAttribute('aria-label', label);
    el.addEventListener('click', handler);
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); handler(e); } });
    return el;
  };

  /** Greedy label placement: keep labels with higher priority, drop overlapping ones. */
  V.placeLabels = (cands, minGap) => {
    const kept = [];
    for (const c of [...cands].sort((a, b) => b.priority - a.priority)) {
      if (kept.every((k) => Math.abs(k.x - c.x) >= minGap)) kept.push(c);
    }
    return kept.sort((a, b) => a.x - b.x);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
