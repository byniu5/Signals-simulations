/* =============================================================================
 *  nav.js — where the user is inside the PPDU (pure, no DOM)
 * -----------------------------------------------------------------------------
 *  Levels in zoom direction:  PPDU > Data field > OFDM symbol > Subcarrier.
 *  The OFDM-symbol level has two views of the same object: 'time' (waveform)
 *  and 'spectrum' (subcarrier map).
 *
 *  A navigation state  { level, sym, sc, view, field }  round-trips through the
 *  URL hash together with the configuration, so deep links and the back button
 *  work. clamp() keeps a state valid after the configuration changes.
 *
 *  Browser: exposes `WifiNav`. Node: module.exports.
 * ===========================================================================*/
(function (root) {
  'use strict';

  const LEVELS = ['ppdu', 'data', 'symbol', 'subcarrier'];
  const VIEWS = ['time', 'spectrum'];
  const DEFAULT = { level: 'ppdu', sym: 1, sc: null, view: 'time', field: 'data' };
  /* configuration keys stored in the hash (values as WifiCalc.normalize expects them) */
  const CFG_KEYS = { gen: 's', band: 's', bw: 'n', gi: 'n', nss: 'n', mcs: 'n', mod: 's', R: 's', payload: 'n', ltf: 's', nominalPadding: 'n' };

  const depth = (level) => LEVELS.indexOf(level);
  const parent = (level) => LEVELS[Math.max(0, depth(level) - 1)];

  /** '#level=symbol&sym=19&sc=11&view=spectrum&gen=HT&bw=40…' → { nav, cfg } (unknown / bad values dropped). */
  function parse(hash) {
    const p = new URLSearchParams(String(hash || '').replace(/^#/, ''));
    const nav = Object.assign({}, DEFAULT);
    if (LEVELS.includes(p.get('level'))) nav.level = p.get('level');
    const sym = parseInt(p.get('sym'), 10);
    if (Number.isFinite(sym)) nav.sym = sym;
    const sc = parseInt(p.get('sc'), 10);
    if (Number.isFinite(sc)) nav.sc = sc;
    if (VIEWS.includes(p.get('view'))) nav.view = p.get('view');
    if (p.get('field') === 'legacy') nav.field = 'legacy';
    const cfg = {};
    for (const [k, type] of Object.entries(CFG_KEYS)) {
      if (!p.has(k)) continue;
      const v = p.get(k);
      if (type === 'n') { const x = Number(v); if (Number.isFinite(x)) cfg[k] = x; } else cfg[k] = v;
    }
    return { nav, cfg };
  }

  /** Inverse of parse. Only non-default navigation fields are written, to keep links short. */
  function format(nav, cfg) {
    const p = new URLSearchParams();
    p.set('level', nav.level);
    if (depth(nav.level) >= depth('data')) p.set('sym', String(nav.sym));
    if (nav.sc !== null && nav.sc !== undefined) p.set('sc', String(nav.sc));
    if (nav.view !== DEFAULT.view) p.set('view', nav.view);
    if (nav.field !== DEFAULT.field) p.set('field', nav.field);
    for (const k of Object.keys(CFG_KEYS)) if (cfg && cfg[k] !== undefined && cfg[k] !== null) p.set(k, String(cfg[k]));
    return '#' + p.toString();
  }

  /**
   * Make a navigation state valid for the current analysis:
   *   - symbol index clamped to 1 … N_SYM
   *   - subcarrier index clamped to the FFT range −N_FFT/2 … N_FFT/2 − 1 of the Data-field plan
   *   - the subcarrier level needs a subcarrier; otherwise fall back to the symbol level
   * limits: { nSym, fft }  (from WifiCalc.analyze: symbols.N_SYM, dataTones.fft)
   */
  function clamp(nav, limits) {
    const out = Object.assign({}, DEFAULT, nav);
    if (!LEVELS.includes(out.level)) out.level = DEFAULT.level;
    const nSym = Math.max(1, limits.nSym | 0);
    out.sym = Math.min(nSym, Math.max(1, Math.round(Number(out.sym) || 1)));
    if (out.sc !== null && out.sc !== undefined) {
      const half = limits.fft / 2;
      out.sc = Math.min(half - 1, Math.max(-half, Math.round(Number(out.sc) || 0)));
    } else out.sc = null;
    if (out.level === 'subcarrier' && out.sc === null) out.level = 'symbol';
    if (!VIEWS.includes(out.view)) out.view = DEFAULT.view;
    if (out.field !== 'legacy') out.field = 'data';
    return out;
  }

  const api = { LEVELS, VIEWS, DEFAULT, CFG_KEYS, depth, parent, parse, format, clamp };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.WifiNav = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
