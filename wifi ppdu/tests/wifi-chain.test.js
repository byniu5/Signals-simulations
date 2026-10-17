/* Tests for the bit-level transmitter → channel → receiver (chain.js).
 * Run from the repository root:   node --test "wifi ppdu/tests/wifi-chain.test.js"
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const vm = require('node:vm');
const fs = require('node:fs');

const D = require(path.join(__dirname, '../systems/wifi/standards-data.js'));
const C = require(path.join(__dirname, '../systems/wifi/calc.js')).create(D);
// core/dsp.js is a browser script: load it into a sandbox to get Dsp
const ctx = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../core/dsp.js'), 'utf8'), ctx);
const X = require(path.join(__dirname, '../systems/wifi/chain.js')).create(D, C, ctx.Dsp);

const MSG = 'Hello, Wi-Fi! 802.11 ✓';

test('scrambler: all-ones state gives 00001110 11110010 11001001 … with period 127 (pat-scrambler-init)', () => {
  const { seq } = X.scramblerSequence([1, 1, 1, 1, 1, 1, 1], 254);
  assert.equal(seq.slice(0, 24).join(''), '000011101111001011001001');
  assert.deepEqual(seq.slice(127), seq.slice(0, 127));
  for (let p = 1; p < 127; p++) assert.notDeepEqual(seq.slice(p, p + 127), seq.slice(0, 127), 'shorter period ' + p);
});

test('scrambler: the receiver recovers the state from the 7 scrambled zero SERVICE bits', () => {
  for (const seed of [1, 45, 93, 127]) {
    const st = X.seedToState(seed);
    const { seq, states } = X.scramblerSequence(st, 40);
    assert.deepEqual(X.stateFromOutputs(seq), states[7]);
    const rest = X.scramblerSequence(X.stateFromOutputs(seq), 33).seq;
    assert.deepEqual(rest, seq.slice(7));
  }
});

test('BCC: impulse response = the generator polynomials 133 and 171 (octal)', () => {
  const { A, B } = X.encode([1, 0, 0, 0, 0, 0, 0]);
  assert.equal(A.join(''), parseInt('133', 8).toString(2));
  assert.equal(B.join(''), parseInt('171', 8).toString(2));
});

test('puncturing gives the coding rate; depuncture puts bits back with erasures; Viterbi decodes every rate', () => {
  const rnd = ctx.Dsp.rng(5);
  const bits = [...Array.from({ length: 294 }, () => (rnd() < 0.5 ? 1 : 0)), 0, 0, 0, 0, 0, 0];
  const enc = X.encode(bits);
  for (const R of ['1/2', '2/3', '3/4', '5/6']) {
    const [n, d] = R.split('/').map(Number);
    const p = X.puncture(enc.A, enc.B, R);
    assert.equal(p.bits.length, (bits.length * d) / n, R);
    const dp = X.depuncture(p.bits, R, bits.length);
    assert.deepEqual(X.viterbi(dp.A, dp.B).bits, bits, R);
  }
  // rate 1/2 corrects scattered errors
  const p = X.puncture(enc.A, enc.B, '1/2');
  const noisy = p.bits.slice();
  for (const i of [10, 90, 200, 333, 480]) noisy[i] ^= 1;
  const dp = X.depuncture(noisy, '1/2', bits.length);
  assert.deepEqual(X.viterbi(dp.A, dp.B).bits, bits);
});

test('interleaver: a permutation; Clause 17 form with 16 columns matches INET; every generation fits N_CBPS', () => {
  for (const [N_CBPS, N_BPSCS] of [[48, 1], [96, 2], [192, 4], [288, 6]]) {
    const { perm } = X.interleaverPermutation(N_CBPS, N_BPSCS, 16, N_CBPS / 16);
    assert.deepEqual([...perm].sort((a, b) => a - b), [...Array(N_CBPS).keys()]);
    const s = Math.max(N_BPSCS / 2, 1);
    perm.forEach((j, k) => {
      const i = (N_CBPS / 16) * (k % 16) + Math.floor(k / 16);
      assert.equal(j, s * Math.floor(i / s) + ((i + N_CBPS - Math.floor((16 * i) / N_CBPS)) % s));
    });
    // adjacent coded bits never land on adjacent subcarriers
    for (let k = 0; k + 1 < N_CBPS; k++) assert.ok(Math.abs(Math.floor(perm[k] / N_BPSCS) - Math.floor(perm[k + 1] / N_BPSCS)) > 1);
  }
  for (const gen of ['nonHT', 'HT', 'VHT', 'HE']) for (const m of X.mcsOptions(gen)) {
    const { cfg } = C.normalize({ gen, bw: 20, nss: 1, mod: m.mod, R: m.R, mcs: m.mcs });
    if (C.exclusion(cfg)) continue;
    const p = C.symbolParams(cfg);
    const z = X.interleaverSize(gen, p.N_BPSCS, p.N_CBPS);
    assert.equal(z.cols * z.rows, p.N_CBPS, `${gen} ${m.mod} ${m.R}`);
  }
});

test('Gray mapping: neighbours differ in one bit; unit average power; demap inverts map', () => {
  for (const mod of ['BPSK', 'QPSK', '16-QAM', '64-QAM', '256-QAM', '1024-QAM']) {
    const pts = X.constellationPoints(mod);
    const P = pts.reduce((a, z) => a + z.re * z.re + z.im * z.im, 0) / pts.length;
    assert.ok(Math.abs(P - 1) < 1e-9, mod + ' power ' + P);
    const nb = D.modulations[mod].N_BPSCS.value;
    for (const z of pts) {
      assert.equal(X.demapPoint(z, nb, mod).join(''), z.bits);
      const step = pts.filter((q) => q !== z).reduce((m, q) => Math.min(m, Math.hypot(q.re - z.re, q.im - z.im)), Infinity);
      for (const q of pts) if (Math.abs(Math.hypot(q.re - z.re, q.im - z.im) - step) < 1e-9)
        assert.equal([...q.bits].filter((b, i) => b !== z.bits[i]).length, 1, `${mod} ${z.bits}-${q.bits}`);
    }
  }
  assert.deepEqual(X.mapBits([1, 0, 0, 0], '16-QAM'), { re: 3 / Math.sqrt(10), im: -3 / Math.sqrt(10) }); // INET Qam16 index 1
});

test('clean channel: the message comes back exactly for every generation and modulation', () => {
  for (const gen of ['nonHT', 'HT', 'VHT', 'HE']) for (const m of X.mcsOptions(gen)) {
    const cfg = { gen, mod: m.mod, R: m.R, mcs: m.mcs, gi: 0.8, text: MSG, seed: 71 };
    if (C.exclusion(C.normalize(Object.assign({ bw: 20, nss: 1 }, cfg)).cfg)) continue;
    const r = X.run(cfg, { snrDb: 60 });
    assert.equal(r.rx.text, MSG, `${gen} ${m.mod} ${m.R}`);
    assert.equal(r.rx.errors.rawCount, 0);
    assert.deepEqual(r.rx.recoveredState, r.tx.scrStates[7]);
  }
});

test('the receiver handles what it was designed for, and fails where it should', () => {
  const cfg = { gen: 'nonHT', mod: '64-QAM', R: '3/4', gi: 0.8, text: MSG.repeat(3), seed: 33 };
  // an echo shorter than the guard interval: equalizer removes it
  assert.equal(X.run(cfg, { snrDb: 40, echoDelayNs: 400, echoGain: 0.6 }).rx.errors.rawCount, 0);
  // an echo longer than the guard interval: inter-symbol interference
  assert.ok(X.run(cfg, { snrDb: 40, echoDelayNs: 1600, echoGain: 0.8 }).rx.errors.rawCount > 0);
  // carrier frequency offset: estimated and corrected
  const cfo = X.run(cfg, { snrDb: 40, cfoKHz: 40 });
  assert.ok(Math.abs(cfo.rx.cfoEstKHz - 40) < 1, 'estimate ' + cfo.rx.cfoEstKHz);
  assert.equal(cfo.rx.text, cfg.text);
  // without CFO correction and without pilot tracking the constellation rotates away
  const bad = X.run(cfg, { snrDb: 40, cfoKHz: 8 }, { cfoCorrection: false, pilotTracking: false });
  assert.ok(bad.rx.errors.decodedCount > 0);
  // ... pilot tracking alone rescues a small offset
  assert.equal(X.run(cfg, { snrDb: 40, cfoKHz: 1 }, { cfoCorrection: false, pilotTracking: true }).rx.errors.decodedCount, 0);
  // the decoder corrects raw errors at moderate SNR
  const mid = X.run(Object.assign({}, cfg, { mod: 'QPSK', R: '1/2' }), { snrDb: 8 });
  assert.ok(mid.rx.errors.rawCount > 0 && mid.rx.errors.decodedCount === 0, `raw ${mid.rx.errors.rawCount}, decoded ${mid.rx.errors.decodedCount}`);
});

test('interleaving spreads a deep fade: no decoded errors with the interleaver, many without', () => {
  const cfg = { gen: 'nonHT', mod: '16-QAM', R: '1/2', gi: 0.8, text: MSG.repeat(4), seed: 9 };
  let on = 0, off = 0;
  for (const seed of [1, 2, 3, 4]) {
    const ch = { snrDb: 20, echoDelayNs: 150, echoGain: 0.95, seed };
    on += X.run(cfg, ch).rx.errors.decodedCount;
    off += X.run(Object.assign({ interleave: false }, cfg), ch).rx.errors.decodedCount;
  }
  assert.equal(on, 0);
  assert.ok(off > 20, 'without interleaver ' + off);
});
