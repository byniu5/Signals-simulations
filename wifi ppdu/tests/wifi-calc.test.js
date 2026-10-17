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
    for (const bw of g.bandwidths) for (const gi of C.val(g.ofdm.guardIntervals))
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
test('VHT exclusions for N_SS 1-4 are exactly 20 MHz MCS 9 (N_SS 1,2,4), 80 MHz MCS 6 (N_SS 3), 160 MHz MCS 9 (N_SS 3)', () => {
  const listed = [];
  for (const bw of [20, 40, 80, 160]) for (let mcs = 0; mcs <= 9; mcs++) for (const nss of [1, 2, 3, 4]) {
    const x = C.exclusion({ gen: 'VHT', bw, mcs, nss });
    if (x) {
      listed.push(`${bw}/${mcs}/${nss}`);
      assert.equal(x.status, 'unverified');
      assert.match(x.note, /11-11\/0577r0.*N_ES rule.*standard table not read/);
    }
  }
  assert.deepEqual(listed, ['20/9/1', '20/9/2', '20/9/4', '80/6/3', '160/9/3']);
});

test('N_ES: VHT = ceil(N_DBPS / 2160) with overrides; HT = 2 when N_DBPS > 1080', () => {
  const nes = (cfg) => C.symbolParams(C.normalize(cfg).cfg).N_ES;
  assert.equal(nes({ gen: 'VHT', bw: 80, gi: 0.8, nss: 1, mcs: 9 }), 1);      // N_DBPS 1560
  assert.equal(nes({ gen: 'VHT', bw: 160, gi: 0.8, nss: 2, mcs: 9 }), 3);     // N_DBPS 6240 -> ceil(2.89)
  assert.equal(nes({ gen: 'VHT', bw: 160, gi: 0.8, nss: 4, mcs: 7 }), 6);     // override (rule would give 5)
  assert.equal(nes({ gen: 'HT', bw: 40, gi: 0.8, nss: 2, mcs: 7 }), 1);       // N_DBPS 1080
  assert.equal(nes({ gen: 'HT', bw: 40, gi: 0.8, nss: 3, mcs: 5 }), 2);       // N_DBPS 1296
  // the N_DBPS rule equals ns-3's rate rule (540 / 600 Mb/s per encoder) for every VHT combination
  for (const bw of [20, 40, 80, 160]) for (const gi of [0.8, 0.4]) for (const nss of [1, 2, 3, 4]) for (let mcs = 0; mcs <= 9; mcs++) {
    const { cfg } = C.normalize({ gen: 'VHT', bw, gi, nss, mcs });
    const p = C.symbolParams(cfg);
    if (D.generations.VHT.encoders.value.exceptions.some((e) => e.bw === bw && e.nss === nss && e.mcs === mcs)) continue;
    assert.equal(p.N_ES, Math.max(1, Math.ceil(p.rateMbps / (gi === 0.8 ? 540 : 600) - 1e-9)), JSON.stringify(cfg));
  }
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
 *  Time domain: TXTIME against the ns-3 vectors (tests/vectors/ns3-txtime.js)
 *
 *  The vectors are verbatim. Where ns-3 departs from the standard, a named
 *  exception (with sources) from the vectors file is applied here.
 * ------------------------------------------------------------------------- */
const NS3 = require(path.join(__dirname, 'vectors/ns3-txtime.js'));
const roundUp4 = (x) => Math.ceil(x / 4 - 1e-9) * 4;
const applies = (ex, gen, gi) => ex.appliesTo.gen.includes(gen) && (!ex.appliesTo.gi || ex.appliesTo.gi.includes(gi));

function ns3Config(gen, [m, bw, gi], payload, extra) {
  const cfg = { gen, band: NS3.band, bw, gi, nss: 1, payload };
  if (gen === 'nonHT') Object.assign(cfg, D.generations.nonHT.rates.value.find((r) => r.rateMbps === m));
  else cfg.mcs = m;
  return Object.assign(cfg, extra);
}

/** ns-3 vector -> what the standard calculator must give, plus the exception ids applied. */
function standardExpectation(gen, vec, payload, raw) {
  const a = C.analyze(ns3Config(gen, vec, payload));
  const items = a.timeline.items;
  const dataStart = us(items.find((i) => i.kind === 'data').start_ns);
  const sigB = items.find((i) => i.name === 'VHT-SIG-B');
  let pre = dataStart - (sigB ? us(sigB.dur_ns) : 0); // preamble as ns-3 models it
  let data = raw - pre;
  const applied = [];
  for (const [id, ex] of Object.entries(NS3.exceptions)) {
    if (!applies(ex, gen, vec[2])) continue;
    applied.push(id);
    if (id === 'ns3-vht-sigb-su-omitted') pre += us(sigB.dur_ns);
    else if (id === 'ns3-no-short-gi-rounding') data = roundUp4(data);
    else throw new Error('exception without an implementation: ' + id);
  }
  return { expected: pre + data, applied, analysis: a };
}

/** ns-3's simplified HE model (exception 'ns3-he-simplified-model'), with a selectable N_DBPS convention. */
function ns3HeModel(vec, payload, rounding) {
  const [mcs, bw, gi] = vec;
  // ns-3 preamble: legacy fields + RL-SIG + HE-SIG-A + HE-STF + one fixed 8 µs HE-LTF (= 2x LTF with 1.6 µs GI)
  const pre = us(C.analyze({ gen: 'HE', bw, gi: 1.6, ltf: '2x', nss: 1, mcs, payload }).timeline.items
    .find((i) => i.kind === 'data').start_ns);
  const p = C.symbolParams(C.normalize({ gen: 'HE', bw, gi, nss: 1, mcs, ndbpsRounding: rounding }).cfg);
  const N_SYM = Math.ceil((16 + 8 * payload + 6) / p.N_DBPS);
  return pre + N_SYM * us(p.T_SYM_ns);
}

for (const gen of ['nonHT', 'HT', 'VHT']) {
  test(`${gen} TXTIME reproduces every ns-3 vector (after named exceptions)`, (t) => {
    const used = new Set();
    for (const vec of NS3.vectors[gen]) for (const [L, raw] of Object.entries(vec[3])) {
      const { expected, applied, analysis } = standardExpectation(gen, vec, Number(L), raw);
      applied.forEach((id) => used.add(id));
      const got = us(analysis.timeline.txtime_ns);
      assert.ok(Math.abs(got - expected) < 1e-9, `${gen} ${JSON.stringify(vec.slice(0, 3))} ${L} B: ${got} vs ${expected} (ns-3 ${raw}, ${applied.join(', ') || 'no exception'})`);
    }
    t.diagnostic(`exceptions applied: ${[...used].join(', ') || 'none'}`);
  });
}

test('HE ns-3 vectors reproduce with the ns-3 model; exact vs floor N_DBPS is not distinguished by any vector', (t) => {
  let total = 0, distinguishing = 0;
  for (const vec of NS3.vectors.HE) for (const [L, raw] of Object.entries(vec[3])) {
    total++;
    const exact = ns3HeModel(vec, Number(L), 'exact');
    const floor = ns3HeModel(vec, Number(L), 'floor');
    assert.ok(Math.abs(exact - raw) < 1e-9 || Math.abs(floor - raw) < 1e-9, `HE ${vec.slice(0, 3)} ${L} B: ns-3 ${raw}, model ${exact} / ${floor}`);
    if (Math.abs(exact - floor) > 1e-9) distinguishing++;
  }
  // Integer N_DBPS for every Non-HT/HT/VHT vector, so they cannot distinguish either.
  t.diagnostic(`HE vectors: ${total}; vectors whose TXTIME differs between exact and floor N_DBPS: ${distinguishing}`);
  assert.equal(distinguishing, 0, 'a vector now distinguishes the conventions — update N_DBPS_rounding status');
  assert.equal(D.generations.HE.dataField.N_DBPS_rounding.status, 'unverified');
});

test('HE LDPC: smallest APEP_LENGTH at which exact and floor N_DBPS give different TXTIME (to check in another tool)', (t) => {
  const found = [];
  for (const [bw, mcs, nss] of [[80, 9, 1], [80, 11, 1], [160, 9, 1], [160, 11, 1]]) {
    for (let L = 1; L <= 20000; L++) {
      const base = { gen: 'HE', bw, gi: 0.8, ltf: '2x', nss, mcs, payload: L, nominalPadding: 16 };
      const e = C.analyze(Object.assign({ ndbpsRounding: 'exact' }, base)).timeline.txtime_ns;
      const f = C.analyze(Object.assign({ ndbpsRounding: 'floor' }, base)).timeline.txtime_ns;
      if (e !== f) { found.push({ bw, mcs, L, exact_us: us(e), floor_us: us(f) }); break; }
    }
  }
  for (const x of found) t.diagnostic(`HE ${x.bw} MHz MCS ${x.mcs} 1SS GI 0.8: APEP_LENGTH ${x.L} -> exact ${x.exact_us} µs, floor ${x.floor_us} µs`);
  assert.ok(found.length > 0);
});

test('HE SU preamble field order and durations (ns-3 model: 2x HE-LTF + 1.6 µs GI = 8 µs)', () => {
  const a = C.analyze({ gen: 'HE', bw: 20, gi: 1.6, ltf: '2x', nss: 1, mcs: 0, payload: 14 });
  const data = a.timeline.items.find((i) => i.kind === 'data');
  assert.equal(us(data.start_ns), 44); // 16 + L-SIG 4 + RL-SIG 4 + HE-SIG-A 8 + HE-STF 4 + HE-LTF 8
  assert.deepEqual(a.timeline.items.slice(0, 7).map((i) => i.name),
    ['L-STF', 'L-LTF', 'L-SIG', 'RL-SIG', 'HE-SIG-A', 'HE-STF', 'HE-LTF']);
});

test('every ns-3 exception names known sources', () => {
  for (const ex of Object.values(NS3.exceptions)) for (const id of ex.sources) assert.ok(D.sources[id], id);
});

/* ------------------------------------------------------------------------- *
 *  Pilot invariants (HE): even indices, symmetric around DC, counts 8/16/16/32
 * ------------------------------------------------------------------------- */
test('HE pilot indices are even, symmetric around DC and number 8/16/16/32', () => {
  const counts = { 20: 8, 40: 16, 80: 16, 160: 32 };
  for (const [bw, n] of Object.entries(counts)) {
    const pil = C.val(D.generations.HE.toneplan[bw].pilots);
    assert.equal(pil.length, n, bw + ' MHz count');
    assert.ok(pil.every((k) => k % 2 === 0), bw + ' MHz even');
    assert.deepEqual([...pil].map((k) => -k).sort((a, b) => a - b), [...pil].sort((a, b) => a - b), bw + ' MHz symmetric');
  }
  const p80 = C.val(D.generations.HE.toneplan[80].pilots);
  const p160 = C.val(D.generations.HE.toneplan[160].pilots);
  assert.deepEqual([...p160].sort((a, b) => a - b), [...p80.map((k) => k - 512), ...p80.map((k) => k + 512)].sort((a, b) => a - b),
    '160 MHz = 80 MHz set shifted by -512 and +512');
});

test('pilot sets of every generation are symmetric around DC', () => {
  for (const [gen, g] of Object.entries(D.generations)) for (const bw of g.bandwidths) {
    const pil = C.val(C.generation(C.toneplanOwner(gen, bw)).toneplan[bw].pilots);
    assert.deepEqual([...pil].map((k) => -k).sort((a, b) => a - b), [...pil].sort((a, b) => a - b), `${gen} ${bw}`);
  }
});

/* ------------------------------------------------------------------------- *
 *  Results report which unverified data they depend on
 * ------------------------------------------------------------------------- */
test('airtime of every HE configuration is labelled as depending on the unverified LDPC constants', () => {
  const a = C.analyze({ gen: 'HE', bw: 80, gi: 0.8, ltf: '2x', nss: 1, mcs: 11, payload: 1500 });
  assert.equal(a.unverified.ldpcDependent, true);
  assert.ok(a.unverified.airtime.includes('ldpc.codewordTable') && a.unverified.airtime.includes('ldpc.extraSymbolCondition'));
  const b = C.analyze({ gen: 'nonHT', band: '5', mod: '64-QAM', R: '3/4', payload: 1500 });
  assert.deepEqual(b.unverified, { rate: [], airtime: [], ldpcDependent: false });
  const h = C.analyze({ gen: 'HT', bw: 40, gi: 0.8, nss: 3, mcs: 5, payload: 1500 });
  assert.ok(!h.unverified.rate.includes('generations.HT.encoders') && h.unverified.airtime.includes('generations.HT.encoders'),
    'N_ES affects N_SYM, not the rate');
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
 *  L-SIG LENGTH and the maximum PPDU duration
 * ------------------------------------------------------------------------- */
test('L-SIG LENGTH: PSDU length in Non-HT; ceil((TXTIME − 20)/4)·3 − 3 in HT/VHT/HE', () => {
  const n = C.analyze({ gen: 'nonHT', band: '5', mod: '64-QAM', R: '3/4', payload: 1536 });
  assert.equal(n.lsig.LENGTH, 1536);
  const h = C.analyze({ gen: 'HT', band: '5', bw: 20, gi: 0.8, nss: 1, mcs: 7, payload: 1536 });
  assert.equal(us(h.timeline.txtime_ns), 228);
  assert.equal(h.lsig.LENGTH, ((228 - 20) / 4) * 3 - 3); // 153
  const h24 = C.analyze({ gen: 'HT', band: '2.4', bw: 20, gi: 0.8, nss: 1, mcs: 7, payload: 1536 });
  assert.equal(h24.lsig.LENGTH, 153, 'signal extension excluded');
  // a legacy receiver turns LENGTH back into a duration that covers the PPDU
  for (const cfg of [{ gen: 'VHT', bw: 80, gi: 0.4, mcs: 9, payload: 3000 }, { gen: 'HE', bw: 40, gi: 1.6, ltf: '2x', mcs: 5, payload: 777 }]) {
    const a = C.analyze(cfg);
    const legacyUs = 20 + ((a.lsig.LENGTH + 3) / 3) * 4;
    assert.ok(legacyUs >= us(a.timeline.txtime_ns) && legacyUs - us(a.timeline.txtime_ns) < 4, JSON.stringify(cfg));
  }
});

test('maximum PPDU duration: 5484 µs corresponds to L-SIG LENGTH 4095', () => {
  const max = D.lsig.maxPpdu.value, r = D.lsig.spoofRule.value;
  assert.equal(Math.ceil((max - r.legacyPreamble) / r.symbol) * r.octetsPerSymbol - r.subtract, D.lsig.maxLength.value);
  const long = C.analyze({ gen: 'HT', bw: 20, gi: 0.8, nss: 1, mcs: 0, payload: 65535 });
  assert.equal(long.maxPpdu.exceeded, true);
  assert.equal(long.lsig.valid, false);
  const ok = C.analyze({ gen: 'VHT', bw: 80, gi: 0.8, mcs: 9, payload: 4000 });
  assert.equal(ok.maxPpdu.exceeded, false);
});

test('N_SD,short is looked up from the table by RU size, never derived', () => {
  assert.deepEqual(D.generations.HE.dataField.N_SD_short.value, { 26: 6, 52: 12, 106: 24, 242: 60, 484: 120, 996: 240, 1992: 492 });
  for (const [bw, ru] of [[20, 242], [40, 484], [80, 996], [160, 1992]]) {
    const a = C.analyze({ gen: 'HE', bw, gi: 0.8, ltf: '2x', mcs: 0, payload: 500 });
    assert.equal(a.symbols.N_SD_short, D.generations.HE.dataField.N_SD_short.value[ru]);
  }
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
