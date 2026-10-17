/* Subcarrier level (wave.js) and the constellation mapping tables.
 * Run from the repository root:   node --test "wifi ppdu/tests/wifi-wave.test.js"
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');

const D = require(path.join(__dirname, '../systems/wifi/standards-data.js'));
const C = require(path.join(__dirname, '../systems/wifi/calc.js')).create(D);
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../core/dsp.js'), 'utf8'), ctx);
const Wv = require(path.join(__dirname, '../systems/wifi/wave.js')).create(ctx.Dsp);
const X = require(path.join(__dirname, '../systems/wifi/chain.js')).create(D, C, ctx.Dsp);

const CONFIGS = [
  { gen: 'nonHT', mod: '64-QAM', R: '3/4' },
  { gen: 'HT', bw: 40, mcs: 6 },
  { gen: 'VHT', bw: 160, mcs: 0 },
  { gen: 'HE', bw: 20, mcs: 10 },
  { gen: 'HE', bw: 160, mcs: 4 },
];

test('build the symbol: the sum of all N_ST subcarriers equals the symbol-view waveform exactly', () => {
  for (const cfg of CONFIGS) {
    const a = C.analyze(Object.assign({ payload: 1500 }, cfg));
    const g = Wv.grid(a), values = Wv.symbolValues(a, 2);
    assert.equal(Wv.usedInOrder(values).length, a.params.N_ST);
    const full = Wv.symbolWaveform(g, values), part = Wv.partialSum(g, values, a.params.N_ST);
    const peak = full.re.reduce((m, x) => Math.max(m, Math.abs(x)), 0);
    let diff = 0;
    for (let i = 0; i < full.re.length; i++) diff = Math.max(diff, Math.abs(full.re[i] - part.re[i]), Math.abs(full.im[i] - part.im[i]));
    assert.ok(diff / peak < 1e-9, `${JSON.stringify(cfg)}: relative difference ${diff / peak}`);
    // fewer subcarriers: not the symbol
    const half = Wv.partialSum(g, values, Math.floor(a.params.N_ST / 2));
    assert.ok(Math.abs(half.re.reduce((m, x, i) => Math.max(m, Math.abs(x - full.re[i])), 0)) > 1e-3 * peak);
  }
});

test('one subcarrier: exactly |k| cycles over T_DFT, and the guard interval is a seamless copy of the tail', () => {
  const a = C.analyze({ gen: 'HT', bw: 40, mcs: 6, payload: 1500 });
  const g = Wv.grid(a);
  for (const k of [1, 2, 11, -25, 53, -58]) {
    const w = Wv.toneWave(g, k, { re: 1, im: 0 });
    let crossings = 0;
    for (let n = 1; n < g.L; n++) if (Math.sign(w.re[g.cp + n]) !== Math.sign(w.re[g.cp + n - 1]) && w.re[g.cp + n] !== 0) crossings++;
    assert.equal(crossings, 2 * Math.abs(k), `k = ${k}`);
    for (let i = 0; i < g.cp; i++) {
      assert.ok(Math.abs(w.re[i] - w.re[g.L + i]) < 1e-12 && Math.abs(w.im[i] - w.im[g.L + i]) < 1e-12, `k = ${k}: prefix sample ${i}`);
    }
  }
  // zero amplitude (DC / guard): nothing
  const z = Wv.toneWave(g, 0, null);
  assert.ok(z.re.every((x) => x === 0));
});

test('mapping tables: the data-file tables give the same points as the chain engine; BPSK 0 → −1, 1 → +1', () => {
  const BL = D.bitLevel;
  assert.deepEqual(BL.constellationMapping.value.BPSK.I, { 0: -1, 1: 1 });
  for (const mod of ['BPSK', 'QPSK', '16-QAM', '64-QAM', '256-QAM', '1024-QAM']) {
    const t = BL.constellationMapping.value[mod] || BL.constellationMappingHigh.value[mod];
    const n = D.modulations[mod].N_BPSCS.value, m = t.Q ? n / 2 : n, k = 1 / Math.sqrt(BL.meanEnergy.value[mod]);
    for (let v = 0; v < 1 << n; v++) {
      const bits = v.toString(2).padStart(n, '0');
      const fromTable = { re: k * t.I[bits.slice(0, m)], im: t.Q ? k * t.Q[bits.slice(m)] : 0 };
      const fromChain = X.mapBits([...bits].map(Number), mod);
      assert.ok(Math.abs(fromTable.re - fromChain.re) < 1e-12 && Math.abs(fromTable.im - fromChain.im) < 1e-12, `${mod} ${bits}`);
    }
  }
  assert.equal(BL.constellationMapping.status, 'supported');
  assert.equal(BL.constellationMappingHigh.status, 'unverified');
});
