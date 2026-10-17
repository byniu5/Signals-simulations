/* Unit tests for the Wi-Fi data file and calculators.
 * Run from the repository root:   node --test "wifi ppdu/tests/"
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');

const D = require(path.join(__dirname, '../systems/wifi/standards-data.js'));
const C = require(path.join(__dirname, '../systems/wifi/calc.js')).create(D);

const us = (ns) => ns / 1000;
const TXTIME = (cfg) => us(C.analyze(cfg).timeline.txtime_ns);

/* ------------------------------------------------------------------------- *
 *  Data file integrity
 * ------------------------------------------------------------------------- */
test('standards-data.js contains no functions (pure data)', () => {
  const walk = (o, where) => {
    assert.notEqual(typeof o, 'function', 'function found at ' + where);
    if (o && typeof o === 'object') for (const [k, v] of Object.entries(o)) walk(v, where + '.' + k);
  };
  walk(D, 'WIFI_STANDARDS');
});

test('every value entry has a status and evidence that resolves to a known source', () => {
  let entries = 0;
  const walk = (o, where) => {
    if (!o || typeof o !== 'object') return;
    if (!Array.isArray(o) && 'value' in o) {
      entries++;
      assert.ok(['verified', 'unverified'].includes(o.status), `${where}: status "${o.status}"`);
      assert.ok(Array.isArray(o.evidence) && o.evidence.length > 0, `${where}: no evidence`);
      for (const id of o.evidence) assert.ok(D.sources[id], `${where}: unknown source "${id}"`);
    }
    for (const [k, v] of Object.entries(o)) walk(v, where + '.' + k);
  };
  walk(D, 'D');
  for (const row of D.checkTable.rows) for (const id of row.evidence) assert.ok(D.sources[id], 'check row source ' + id);
  for (const g of Object.values(D.generations)) for (const x of g.exclusions || []) {
    assert.ok(['verified', 'unverified'].includes(x.status));
    for (const id of x.evidence) assert.ok(D.sources[id]);
  }
  assert.ok(entries > 50, 'expected many value entries, found ' + entries);
});

test('clause numbers are flagged as not read', () => {
  assert.equal(D.meta.clauseNumbersRead, false);
  for (const g of Object.values(D.generations)) assert.ok(D.documents[g.doc], 'unknown document ' + g.doc);
});

/* ------------------------------------------------------------------------- *
 *  Frequency domain: subcarrier maps
 * ------------------------------------------------------------------------- */
test('data-field tone plans reproduce N_SD, N_SP and fill the FFT exactly', () => {
  // expected: [N_FFT, N_SD, N_SP, DC nulls, other nulls, guard]
  const expect = {
    nonHT: { 20: [64, 48, 4, 1, 0, 11] },
    HT: { 20: [64, 52, 4, 1, 0, 7], 40: [128, 108, 6, 3, 0, 11] },
    VHT: { 20: [64, 52, 4, 1, 0, 7], 40: [128, 108, 6, 3, 0, 11], 80: [256, 234, 8, 3, 0, 11], 160: [512, 468, 16, 11, 6, 11] },
    HE: { 20: [256, 234, 8, 3, 0, 11], 40: [512, 468, 16, 5, 0, 23], 80: [1024, 980, 16, 5, 0, 23], 160: [2048, 1960, 32, 23, 10, 23] },
  };
  for (const [gen, bws] of Object.entries(expect)) {
    for (const [bw, [fft, sd, sp, dc, nul, guard]] of Object.entries(bws)) {
      const t = C.dataToneMap(gen, Number(bw));
      const tag = `${gen} ${bw} MHz`;
      assert.equal(t.fft, fft, tag + ' FFT');
      assert.equal(t.N_SD, sd, tag + ' N_SD');
      assert.equal(t.N_SD, t.expectedN_SD, tag + ' N_SD vs data-file N_SD');
      assert.equal(t.N_SP, sp, tag + ' N_SP');
      assert.deepEqual([t.counts.dc, t.counts.null, t.counts.guard], [dc, nul, guard], tag + ' nulls');
      assert.equal(t.tones.length, fft, tag + ' every FFT bin classified once');
    }
  }
});

test('subcarrier spacing x FFT size = channel bandwidth', () => {
  for (const [gen, g] of Object.entries(D.generations)) {
    for (const bw of g.bandwidths) {
      const t = C.dataToneMap(gen, bw);
      assert.equal(t.fft * t.spacingKHz, bw * 1000, `${gen} ${bw} MHz`);
    }
  }
});

test('legacy fields are per-20 MHz replicas (e.g. L-LTF at 40 MHz: 96 data + 8 pilots)', () => {
  const expect = { 20: [64, 48, 4], 40: [128, 96, 8], 80: [256, 192, 16], 160: [512, 384, 32] };
  for (const [bw, [fft, sd, sp]] of Object.entries(expect)) {
    const t = C.legacyToneMap(Number(bw));
    assert.deepEqual([t.fft, t.N_SD, t.N_SP, t.N_ST], [fft, sd, sp, sd + sp], bw + ' MHz');
    assert.equal(t.spacingKHz, 312.5);
  }
  assert.deepEqual(C.legacyToneMap(40).subchannels.map((s) => s.rotationDeg), [0, 90]);
});

/* ------------------------------------------------------------------------- *
 *  Rates: the built-in check table
 * ------------------------------------------------------------------------- */
test('check table: every published rate is reproduced', () => {
  for (const r of C.runChecks()) {
    const tag = `${r.row.gen} ${r.row.bw} MHz GI ${r.row.gi} NSS ${r.row.nss} ${r.row.mcs ?? r.row.mod + ' ' + r.row.R}`;
    assert.ok(r.pass, `${tag}: computed ${r.rateMbps.toFixed(3)} (exact ${r.exactRateMbps.toFixed(3)}) vs ${r.row.expectMbps}`);
  }
});

test('HE: fractional N_DBPS is rounded down (rule from the data file), never assumed integer', () => {
  const p = C.symbolParams(C.normalize({ gen: 'HE', bw: 80, gi: 0.8, nss: 1, mcs: 11 }).cfg);
  assert.equal(p.N_CBPS, 9800);
  assert.ok(Math.abs(p.N_DBPS_exact - 8166.666) < 0.001);
  assert.equal(p.N_DBPS, 8166);
});

test('Non-HT, HT and VHT N_DBPS are integers for every allowed combination', () => {
  for (const gen of ['nonHT', 'HT', 'VHT']) {
    const g = D.generations[gen];
    for (const bw of g.bandwidths) for (const gi of C.val(g.numerology.guardIntervals))
      for (const nss of g.spatialStreams) for (const m of C.options({ gen }).mcs) {
        const { cfg } = C.normalize({ gen, band: Object.keys(g.bands)[0], bw, gi, nss, mod: m.mod, R: m.R });
        if (C.exclusion(cfg)) continue;
        assert.ok(Number.isInteger(C.symbolParams(cfg).N_DBPS), JSON.stringify(cfg));
      }
  }
});

/* ------------------------------------------------------------------------- *
 *  VHT exclusions
 * ------------------------------------------------------------------------- */
test('VHT 20 MHz MCS 9 is excluded except for 3 (and 6) spatial streams', () => {
  const ex = (nss) => C.exclusion({ gen: 'VHT', bw: 20, mcs: 9, nss });
  assert.equal(ex(1).status, 'verified');
  assert.ok(ex(2) && ex(4));
  assert.equal(ex(3), null);
});

test('VHT exclusions coincide with BCC encoder-parser integrality (cross-check of the unverified entries)', () => {
  // A combination cannot be built if N_DBPS or N_CBPS is not divisible by N_ES (each encoder gets equal bits).
  const derived = [];
  for (const bw of [20, 40, 80, 160]) for (const nss of [1, 2, 3, 4]) for (let mcs = 0; mcs <= 9; mcs++) {
    const { cfg } = C.normalize({ gen: 'VHT', bw, gi: 0.8, nss, mcs });
    const p = C.symbolParams(cfg);
    if (!Number.isInteger(p.N_DBPS) || p.N_DBPS % p.N_ES || p.N_CBPS % p.N_ES) derived.push(`${bw}/${mcs}/${nss}`);
  }
  const listed = [];
  for (const x of D.generations.VHT.exclusions) for (const n of x.nss) if (n <= 4) listed.push(`${x.bw}/${x.mcs}/${n}`);
  assert.deepEqual(derived.sort(), listed.sort());
});

/* ------------------------------------------------------------------------- *
 *  Time domain: TXTIME against ns-3 test vectors (tx-duration-test.cc)
 *
 *  ns-3 differs from the standard in two documented ways, corrected here:
 *   (1) HT-mixed / VHT short GI: the standard rounds the data duration up to a
 *       4 µs boundary (IEEE 802.11-07/2077); ns-3 does not.
 *   (2) VHT SU PPDUs carry a 4 µs VHT-SIG-B field (MathWorks VHT PPDU structure);
 *       ns-3 only includes it for MU PPDUs.
 * ------------------------------------------------------------------------- */
const roundUp4 = (x) => Math.ceil(x / 4 - 1e-9) * 4;

test('802.11a 54 Mb/s TXTIME (ns-3 vectors)', () => {
  for (const [L, t] of [[1536, 248], [76, 32], [14, 24]])
    assert.equal(TXTIME({ gen: 'nonHT', band: '5', mod: '64-QAM', R: '3/4', payload: L }), t, L + ' B');
});

test('HT-mixed TXTIME (ns-3 vectors; short GI rounded to 4 µs)', () => {
  const pre = 36; // L-STF + L-LTF + L-SIG + HT-SIG + HT-STF + 1 HT-LTF
  const vectors = [ // [mcs, bw, gi, [1536 B, 76 B, 14 B] in µs as listed by ns-3]
    [7, 20, 0.8, [228, 48, 40]],
    [0, 20, 0.4, [1742.4, 126, 57.6]],
    [6, 20, 0.4, [226.8, 46.8, 39.6]],
    [7, 40, 0.8, [128, 44, 40]],
    [7, 40, 0.4, [118.8, 43.2, 39.6]],
  ];
  for (const [mcs, bw, gi, times] of vectors) {
    [1536, 76, 14].forEach((L, i) => {
      const expected = gi < 0.8 ? pre + roundUp4(times[i] - pre) : times[i];
      assert.equal(TXTIME({ gen: 'HT', band: '5', bw, gi, nss: 1, mcs, payload: L }), expected, `MCS ${mcs} ${bw} MHz GI ${gi} ${L} B`);
      assert.equal(TXTIME({ gen: 'HT', band: '2.4', bw, gi, nss: 1, mcs, payload: L }), expected + 6, '2.4 GHz adds 6 µs signal extension');
    });
  }
});

test('VHT SU TXTIME (ns-3 vectors + VHT-SIG-B; short GI rounded to 4 µs)', () => {
  const preNs3 = 36;
  const vectors = [
    [8, 20, 0.8, [196, 48, 40]], [8, 20, 0.4, [180, 46.8, 39.6]],
    [9, 40, 0.8, [108, 40, 40]], [9, 40, 0.4, [100.8, 39.6, 39.6]],
    [0, 80, 0.8, [460, 60, 44]], [0, 80, 0.4, [417.6, 57.6, 43.2]],
    [9, 80, 0.8, [68, 40, 40]], [9, 80, 0.4, [64.8, 39.6, 39.6]],
    [8, 160, 0.8, [56, 40, 40]], [8, 160, 0.4, [54, 39.6, 39.6]],
  ];
  for (const [mcs, bw, gi, times] of vectors) {
    [1536, 76, 14].forEach((L, i) => {
      const data = times[i] - preNs3;
      const expected = preNs3 + 4 /* VHT-SIG-B */ + (gi < 0.8 ? roundUp4(data) : data);
      assert.equal(TXTIME({ gen: 'VHT', bw, gi, nss: 1, mcs, payload: L }), expected, `MCS ${mcs} ${bw} MHz GI ${gi} ${L} B`);
    });
  }
});

test('HE SU preamble matches ns-3 (which models a fixed 8 µs HE-LTF = 2x LTF + 1.6 µs GI)', () => {
  const a = C.analyze({ gen: 'HE', bw: 20, gi: 1.6, ltf: '2x', nss: 1, mcs: 0, payload: 14 });
  const data = a.timeline.items.find((i) => i.kind === 'data');
  assert.equal(us(data.start_ns), 44); // 16 + L-SIG 4 + RL-SIG 4 + HE-SIG-A 8 + HE-STF 4 + HE-LTF 8
  assert.deepEqual(a.timeline.items.slice(0, 7).map((i) => i.name),
    ['L-STF', 'L-LTF', 'L-SIG', 'RL-SIG', 'HE-SIG-A', 'HE-STF', 'HE-LTF']);
});

/* ------------------------------------------------------------------------- *
 *  HE LDPC symbol count — worked examples, every step derived by hand from the
 *  equations in standards-data.js (HE.padding.equations, ldpc.*)
 * ------------------------------------------------------------------------- */
test('HE LDPC example 1: 20 MHz, MCS 0, 100-octet APEP -> LDPC extra symbol segment', () => {
  // N_DBPS = 234·1·1/2 = 117; N_DBPS,short = 60·1·1/2 = 30; bits = 8·100 + 16 = 816
  // N_SYM,init = ceil(816/117) = 7; N_Excess = 816 − 6·117 = 114; a_init = min(ceil(114/30), 4) = 4
  // N_pld = 7·117 = 819; N_avbits = 7·234 = 1638 -> 1 codeword of 1944 bits
  // N_shrt = 972 − 819 = 153; N_punc = 1944 − 1638 − 153 = 153
  // 153 > 0.1·1944·0.5 = 97.2 and 153 < 1.2·153 -> extra segment; a_init = 4 -> N_SYM = 8, a = 1
  const a = C.analyze({ gen: 'HE', band: '5', bw: 20, gi: 0.8, ltf: '2x', nss: 1, mcs: 0, payload: 100, nominalPadding: 16 });
  const s = a.symbols;
  assert.deepEqual([s.N_SYM_init, s.N_Excess, s.a_init, s.N_pld, s.N_avbits], [7, 114, 4, 819, 1638]);
  assert.deepEqual([s.ldpc.N_CW, s.ldpc.L_LDPC, s.ldpc.N_shrt, s.ldpc.N_punc, s.ldpc.extraSegment], [1, 1944, 153, 153, true]);
  assert.deepEqual([s.N_SYM, s.a], [8, 1]);
  // TXTIME = 20 + RL-SIG 4 + HE-SIG-A 8 + HE-STF 4 + HE-LTF (6.4+0.8) + 8·13.6 + PE 4 = 156.0 µs
  assert.equal(us(a.timeline.txtime_ns), 156);
});

test('HE LDPC example 2: 80 MHz, MCS 11, 1500-octet APEP -> no extra segment, a = 2', () => {
  // N_DBPS = floor(8166.67) = 8166; N_DBPS,short = 240·10·5/6 = 2000; bits = 12016
  // N_SYM,init = 2; N_Excess = 3850; a_init = ceil(3850/2000) = 2
  // N_pld = 8166 + 4000 = 12166; N_avbits = 9800 + 4800 = 14600 -> N_CW = ceil(12166/1620) = 8
  // N_shrt = 12960 − 12166 = 794; N_punc = 15552 − 14600 − 794 = 158 <= 0.1·8·1944/6 = 259.2 -> no extra
  const a = C.analyze({ gen: 'HE', band: '5', bw: 80, gi: 0.8, ltf: '2x', nss: 1, mcs: 11, payload: 1500, nominalPadding: 16 });
  const s = a.symbols;
  assert.deepEqual([s.N_SYM_init, s.N_Excess, s.a_init, s.N_PAD_preFEC], [2, 3850, 2, 150]);
  assert.deepEqual([s.ldpc.N_CW, s.ldpc.N_shrt, s.ldpc.N_punc, s.ldpc.extraSegment], [8, 794, 158, false]);
  assert.deepEqual([s.N_SYM, s.a], [2, 2]);
  // 43.2 µs preamble + 2·13.6 + PE (a = 2, nominal 16 µs) 8 = 78.4 µs
  assert.ok(Math.abs(us(a.timeline.txtime_ns) - 78.4) < 1e-9);
});

/* ------------------------------------------------------------------------- *
 *  Derived, not hard-coded: changing one parameter changes the outputs
 * ------------------------------------------------------------------------- */
test('changing the configuration updates every derived number', () => {
  const base = { gen: 'HE', bw: 20, gi: 0.8, ltf: '2x', nss: 1, mcs: 7, payload: 1000 };
  const a = C.analyze(base), b = C.analyze(Object.assign({}, base, { bw: 40 }));
  assert.equal(a.params.N_FFT * 2, b.params.N_FFT);
  assert.ok(b.params.N_SD > a.params.N_SD && b.params.rateMbps > a.params.rateMbps);
  const c = C.analyze(Object.assign({}, base, { gi: 3.2 }));
  assert.equal(c.cfg.ltf, '4x', 'GI 3.2 µs forces the 4x HE-LTF');
  assert.equal(c.params.T_SYM_ns, 16000);
});

test('normalize() keeps configurations inside what each generation allows', () => {
  assert.equal(C.normalize({ gen: 'VHT', band: '2.4' }).cfg.band, '5');
  assert.equal(C.normalize({ gen: 'HE', band: '2.4', bw: 80 }).cfg.bw, 40);
  assert.equal(C.normalize({ gen: 'nonHT', nss: 3 }).cfg.nss, 1);
  assert.equal(C.normalize({ gen: 'HT', mod: '256-QAM', R: '5/6' }).cfg.mod, 'BPSK');
  assert.equal(C.normalize({ gen: 'HT', mcs: 7, nss: 2 }).cfg.mcs, 7);
  assert.equal(C.displayMcs(C.normalize({ gen: 'HT', mcs: 7, nss: 2 }).cfg), 15);
});

/* ------------------------------------------------------------------------- *
 *  Browser loading: both files must work as classic <script> tags (file://)
 * ------------------------------------------------------------------------- */
test('classic-script loading exposes the WIFI_STANDARDS and WifiCalc globals', () => {
  const vm = require('node:vm');
  const fs = require('node:fs');
  const ctx = vm.createContext({});
  for (const f of ['standards-data.js', 'calc.js'])
    vm.runInContext(fs.readFileSync(path.join(__dirname, '../systems/wifi', f), 'utf8'), ctx, { filename: f });
  assert.equal(typeof ctx.WIFI_STANDARDS, 'object');
  assert.equal(typeof ctx.WifiCalc.analyze, 'function');
  assert.equal(ctx.WifiCalc.runChecks().every((r) => r.pass), true);
});
