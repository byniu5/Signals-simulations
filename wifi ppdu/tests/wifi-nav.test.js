/* Navigation state (nav.js): URL hash round trip and index clamping after configuration changes.
 * Run from the repository root:   node --test "wifi ppdu/tests/wifi-nav.test.js"
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const D = require(path.join(__dirname, '../systems/wifi/standards-data.js'));
const C = require(path.join(__dirname, '../systems/wifi/calc.js')).create(D);
const N = require(path.join(__dirname, '../systems/wifi/nav.js'));

const limits = (cfg) => { const a = C.analyze(cfg); return { nSym: a.symbols.N_SYM, fft: a.dataTones.fft }; };

test('hash round trip: navigation and configuration', () => {
  const nav = { level: 'subcarrier', sym: 19, sc: -11, view: 'spectrum', field: 'legacy' };
  const cfg = { gen: 'HT', band: '5', bw: 40, gi: 0.4, nss: 2, mcs: 7, payload: 1500 };
  const back = N.parse(N.format(nav, cfg));
  assert.deepEqual(back.nav, nav);
  assert.deepEqual(back.cfg, cfg);
  // defaults are not written; junk is ignored
  assert.equal(N.format({ level: 'ppdu', sym: 1, sc: null, view: 'time', field: 'data' }, {}), '#level=ppdu');
  assert.deepEqual(N.parse('#level=nonsense&sym=abc&view=3d&bw=wide').nav, N.DEFAULT);
  assert.deepEqual(N.parse('#bw=wide').cfg, {});
});

test('levels in zoom direction; parent of each level', () => {
  assert.deepEqual(N.LEVELS, ['ppdu', 'data', 'symbol', 'subcarrier']);
  assert.equal(N.parent('subcarrier'), 'symbol');
  assert.equal(N.parent('symbol'), 'data');
  assert.equal(N.parent('data'), 'ppdu');
  assert.equal(N.parent('ppdu'), 'ppdu');
});

test('clamp: a symbol index that no longer exists after a configuration change', () => {
  const ht = { gen: 'HT', bw: 40, gi: 0.8, nss: 1, mcs: 6, payload: 1500 };
  const L1 = limits(ht);
  assert.equal(L1.nSym, 25);
  const nav = N.clamp({ level: 'symbol', sym: 19 }, L1);
  assert.equal(nav.sym, 19, 'valid index kept');
  assert.equal(nav.level, 'symbol', 'level kept');
  // faster MCS and more streams: fewer symbols
  const L2 = limits(Object.assign({}, ht, { mcs: 7, nss: 4 }));
  assert.ok(L2.nSym < 19);
  const n2 = N.clamp(nav, L2);
  assert.equal(n2.sym, L2.nSym, 'clamped to the last symbol');
  assert.equal(n2.level, 'symbol', 'still a valid level, kept');
  assert.equal(N.clamp({ sym: 0 }, L2).sym, 1);
  assert.equal(N.clamp({ sym: -5 }, L2).sym, 1);
});

test('clamp: a subcarrier index outside a narrower channel', () => {
  const wide = limits({ gen: 'HE', bw: 160, mcs: 4, payload: 800 });
  assert.equal(wide.fft, 2048);
  const nav = N.clamp({ level: 'subcarrier', sym: 1, sc: 900 }, wide);
  assert.equal(nav.sc, 900);
  const narrow = limits({ gen: 'HE', bw: 20, mcs: 4, payload: 800 });
  const n2 = N.clamp(nav, narrow);
  assert.equal(n2.sc, narrow.fft / 2 - 1, 'clamped to the top of the 256-point FFT');
  assert.equal(n2.level, 'subcarrier');
  assert.equal(N.clamp({ level: 'subcarrier', sc: -5000 }, narrow).sc, -128);
  // the subcarrier level needs a subcarrier
  assert.equal(N.clamp({ level: 'subcarrier', sc: null }, narrow).level, 'symbol');
});

test('clamp keeps every level valid for every generation and bandwidth', () => {
  for (const [gen, g] of Object.entries(D.generations)) for (const bw of g.bandwidths) {
    const L = limits({ gen, bw, payload: 300 });
    for (const level of N.LEVELS) {
      const n = N.clamp({ level, sym: 1e6, sc: 1e6 }, L);
      assert.ok(n.sym >= 1 && n.sym <= L.nSym && n.sc < L.fft / 2 && N.LEVELS.includes(n.level), `${gen} ${bw} ${level}`);
    }
  }
});
