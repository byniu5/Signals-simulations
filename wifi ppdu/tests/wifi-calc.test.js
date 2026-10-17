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

/* Four statuses; only 'unverified' is a warning in the UI. */
const STATUSES = ['standard-checked', 'supported', 'derived', 'unverified'];
const NOT_A_SOURCE = new Set(['cross-check', 'reviewer']); // origins that never count as independent sources

/** Every status-bearing entry: value entries, VHT exclusions and check-table rows. */
function statusEntries() {
  const out = [];
  (function walk(o, where) {
    if (!o || typeof o !== 'object') return;
    if (!Array.isArray(o) && 'value' in o) out.push({ where, e: o });
    for (const [k, v] of Object.entries(o)) walk(v, where + (Array.isArray(o) ? `[${v && v.name ? v.name : k}]` : '.' + k));
  })(D, 'D');
  for (const [gen, g] of Object.entries(D.generations)) (g.exclusions || []).forEach((x, i) => out.push({ where: `${gen}.exclusions[${i}]`, e: x }));
  D.checkTable.rows.forEach((r, i) => out.push({ where: `checkTable.rows[${i}]`, e: r }));
  return out;
}

/** Resolve a derivedFrom path such as 'generations.VHT.fields[VHT-SIG-B].duration' to its entry. */
function resolve(pathText) {
  let o = D;
  for (const part of pathText.split('.')) {
    const m = part.match(/^([^[]+)\[(.+)\]$/);
    o = m ? o[m[1]].find((x) => x.name === m[2]) : o[part];
    if (o === undefined) return undefined;
  }
  return o;
}

test('every status-bearing entry has one of the four statuses and evidence from known sources', () => {
  const all = statusEntries();
  for (const { where, e } of all) {
    assert.ok(STATUSES.includes(e.status), `${where}: status "${e.status}"`);
    assert.ok(Array.isArray(e.evidence) && e.evidence.length > 0, `${where}: no evidence`);
    for (const id of e.evidence) assert.ok(D.sources[id], `${where}: unknown source "${id}"`);
  }
  for (const s of Object.values(D.sources)) assert.ok(typeof s.origin === 'string' && s.origin.length, 'source without origin: ' + s.title);
  assert.ok(all.length > 100, 'expected many entries, found ' + all.length);
});

test('"supported" = at least 2 independent public origins (or classified so by the reviewer)', () => {
  for (const { where, e } of statusEntries()) {
    if (e.status !== 'supported') continue;
    const origins = new Set(e.evidence.map((id) => D.sources[id].origin).filter((o) => !NOT_A_SOURCE.has(o)));
    assert.ok(origins.size >= 2 || e.evidence.includes('review-3'), `${where}: supported by ${[...origins].join(', ') || 'no public source'}`);
  }
});

test('"derived" = arithmetic whose inputs exist and are not unverified', () => {
  let n = 0;
  for (const { where, e } of statusEntries()) {
    if (e.status !== 'derived') continue;
    n++;
    assert.ok(e.evidence.includes('arith'), `${where}: derived without 'arith'`);
    assert.ok(Array.isArray(e.derivedFrom) && e.derivedFrom.length > 0, `${where}: no derivedFrom`);
    for (const input of e.derivedFrom) {
      if (input.startsWith('definition: ')) continue;
      const x = resolve(input);
      assert.ok(x && STATUSES.includes(x.status), `${where}: input ${input} not found`);
      assert.notEqual(x.status, 'unverified', `${where}: input ${input} is unverified`);
    }
  }
  assert.ok(n > 10);
});

test('"standard-checked" only with a source of kind "standard" (none yet: the IEEE text could not be read)', () => {
  for (const { where, e } of statusEntries()) {
    if (e.status === 'standard-checked') assert.ok(e.evidence.some((id) => D.sources[id].kind === 'standard'), where);
  }
});

test('the reviewer\'s third-pass classification is applied', () => {
  const st = (p) => resolve(p).status;
  for (const p of ['generations.nonHT.lsigBits', 'lsig.spoofRule', 'generations.VHT.txtime.shortGiRounding', 'generations.VHT.encoders',
    'generations.HE.dataField.N_SD_short', 'generations.HT.maxPsduOctets', 'generations.VHT.maxApepOctets']) assert.equal(st(p), 'supported', p);
  for (const x of D.generations.VHT.exclusions) assert.equal(x.status, 'supported');
  for (const p of ['lsig.maxLength', 'generations.nonHT.maxPsduOctets', 'lsig.maxPpdu', 'generations.HT.encoders', 'generations.VHT.maxPsduOctets'])
    assert.equal(st(p), 'derived', p);
  assert.equal(D.lsig.maxLength.value, 2 ** 12 - 1);
  const v = D.generations.VHT.maxPsduOctets.value;
  assert.equal(Math.floor((D.lsig.maxPpdu.value - 68) / 3.6), 1504);
  assert.equal(v, 1504 * 24960 / 8, 'VHT max PSDU = 1504 symbols x 24960 bits / 8');
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
      assert.equal(x.status, 'supported');
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

test('VHT exclusions coincide with BCC encoder-parser integrality (independent cross-check of the listed entries)', () => {
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
 *  HE resource units (illustration of HE MU / HE TB): internal consistency
 * ------------------------------------------------------------------------- */
test('HE RUs: counts, sizes, no overlap, inside the HE SU plan; the largest RU is the HE SU plan', () => {
  const RU = D.generations.HE.resourceUnits;
  const counts = RU.countPerBandwidth.value;
  for (const bw of [20, 40, 80, 160]) {
    const su = C.dataToneMap('HE', bw);
    const used = new Set(su.tones.filter((t) => t.kind === 'data' || t.kind === 'pilot').map((t) => t.k));
    const sizes = C.ruSizes(bw);
    for (const size of sizes) {
      const rus = C.ruLayout(bw, size);
      if (counts[bw][size] !== undefined) assert.equal(rus.length, counts[bw][size], `${bw} MHz ${size}-tone count`);
      const seen = new Set();
      for (const ru of rus) {
        assert.equal(ru.tones, size, `${bw} MHz ${size}-tone RU ${ru.index} size`);
        for (const [a, b] of ru.ranges) for (let k = a; k <= b; k++) {
          assert.ok(!seen.has(k), `${bw} MHz ${size}-tone RUs overlap at ${k}`);
          assert.ok(used.has(k), `${bw} MHz ${size}-tone RU ${ru.index}: tone ${k} outside the HE SU plan`);
          seen.add(k);
        }
      }
    }
    const largest = C.ruLayout(bw, sizes[sizes.length - 1]);
    assert.equal(largest.length, 1);
    assert.equal(largest[0].tones, su.N_ST, `${bw} MHz: largest RU = all ${su.N_ST} HE SU tones`);
    if (RU.tones.value[largest[0].tones]) assert.equal(RU.tones.value[largest[0].tones].data, su.N_SD);
  }
  const r80 = C.ruLayout(80, 26), r160 = C.ruLayout(160, 26);
  assert.deepEqual(r160.map((r) => r.ranges), [...r80.map((r) => r.ranges.map(([a, b]) => [a - 512, b - 512])), ...r80.map((r) => r.ranges.map(([a, b]) => [a + 512, b + 512]))]);
});

test('HE SU: PE follows the nominal packet padding and a; T_PE is reported even when no PE field is sent', () => {
  for (const pad of [0, 8, 16]) for (let L = 1; L < 3000; L += 211) {
    const a = C.analyze({ gen: 'HE', bw: 20, gi: 0.8, ltf: '2x', mcs: 7, payload: L, nominalPadding: pad });
    const want = D.generations.HE.packetExtension.T_PE.value[pad][a.symbols.a - 1] * 1000;
    assert.equal(a.timeline.T_PE_ns, want);
    const pe = a.timeline.items.find((i) => i.kind === 'pe');
    assert.equal(pe ? pe.dur_ns : 0, want);
  }
  const ltf = C.analyze({ gen: 'HE', bw: 20, gi: 0.8, ltf: '1x', nss: 2, mcs: 7, payload: 100 }).timeline.items.find((i) => i.name === 'HE-LTF');
  assert.deepEqual([ltf.count, ltf.symbol_ns, ltf.gi_ns, ltf.each_ns], [2, 3200, 800, 4000]);
});

/* ------------------------------------------------------------------------- *
 *  Results report which unverified data they depend on
 * ------------------------------------------------------------------------- */
test('airtime of every HE configuration is labelled as depending on the unverified LDPC constants', () => {
  const a = C.analyze({ gen: 'HE', bw: 80, gi: 0.8, ltf: '2x', nss: 1, mcs: 11, payload: 1500 });
  assert.equal(a.unverified.ldpcDependent, true);
  assert.ok(a.unverified.airtime.includes('ldpc.codewordTable') && a.unverified.airtime.includes('ldpc.extraSymbolCondition'));
  const b = C.analyze({ gen: 'nonHT', band: '5', mod: '64-QAM', R: '3/4', payload: 1500 });
  assert.deepEqual(b.unverified, { rate: [], airtime: [], lsig: ['lsig.nonHtLength'], ldpcDependent: false });
  assert.deepEqual(C.analyze({ gen: 'VHT', bw: 80, mcs: 9, payload: 1500 }).unverified, { rate: [], airtime: [], lsig: [], ldpcDependent: false });
  // HT N_ES is 'derived' now; mark it unverified in a copy of the data to test where the dependency is reported
  const D2 = structuredClone(D);
  D2.generations.HT.encoders.status = 'unverified';
  const h = require(path.join(__dirname, '../systems/wifi/calc.js')).create(D2).analyze({ gen: 'HT', bw: 40, gi: 0.8, nss: 3, mcs: 5, payload: 1500 });
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
  assert.equal(C.normalize({ gen: 'HE', gi: 0.8, ltf: '4x' }).cfg.ltf, '2x', 'HE-LTF type not allowed with the GI -> default 2x');
  assert.equal(C.normalize({ gen: 'HE', gi: 0.8, ltf: '1x' }).cfg.ltf, '1x');
  assert.equal(C.normalize({ gen: 'HT', mod: '256-QAM', R: '5/6' }).cfg.mod, 'BPSK');
  assert.equal(C.normalize({ gen: 'HT', mcs: 7, nss: 2 }).cfg.mcs, 7);
  assert.equal(C.displayMcs(C.normalize({ gen: 'HT', mcs: 7, nss: 2 }).cfg), 15);
});

test('payload is clamped by the length field of each generation (VHT: APEP_LENGTH, not the derived PSDU maximum)', () => {
  const clamp = (gen, payload) => C.normalize({ gen, payload }).cfg.payload;
  assert.equal(clamp('nonHT', 5000), 4095);
  assert.equal(clamp('HT', 70000), 65535);
  assert.equal(clamp('VHT', 2000000), D.generations.VHT.maxApepOctets.value);
  assert.equal(clamp('VHT', 2000000), 1048575);
  assert.equal(clamp('HE', 2000000), 2000000, 'HE: no length-field limit here; the 5484 µs cap flags it');
  assert.equal(C.analyze({ gen: 'HE', bw: 20, mcs: 0, payload: 2000000 }).maxPpdu.exceeded, true);
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
  // a legacy receiver turns LENGTH back into a duration that covers the PPDU: 20 + ceil((LENGTH + 3)/3)·4
  for (const cfg of [{ gen: 'VHT', bw: 80, gi: 0.4, mcs: 9, payload: 3000 }, { gen: 'HE', bw: 40, gi: 1.6, ltf: '2x', mcs: 5, payload: 777 },
    { gen: 'HE', band: '2.4', bw: 20, gi: 0.8, ltf: '1x', mcs: 3, payload: 99 }]) {
    const a = C.analyze(cfg);
    const legacyUs = 20 + Math.ceil((a.lsig.LENGTH + 3) / 3) * 4;
    const t = us(a.timeline.txtime_ns - a.timeline.signalExtension_ns);
    assert.ok(legacyUs >= t && legacyUs - t < 4, JSON.stringify(cfg));
  }
});

test('HE SU: L-SIG LENGTH subtracts m = 2, so LENGTH mod 3 = 1 (HT / VHT: mod 3 = 0)', () => {
  for (let L = 1; L < 400; L += 37) {
    const he = C.analyze({ gen: 'HE', bw: 20, gi: 0.8, ltf: '2x', mcs: 4, payload: L });
    assert.equal(he.lsig.m, D.lsig.heM.value['HE SU PPDU']);
    assert.equal(he.lsig.LENGTH % 3, 1, 'HE SU, APEP ' + L);
    assert.equal(C.analyze({ gen: 'VHT', bw: 20, mcs: 4, payload: L }).lsig.LENGTH % 3, 0);
    assert.equal(C.analyze({ gen: 'HT', bw: 20, mcs: 4, payload: L }).lsig.LENGTH % 3, 0);
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
  // cross-check of the derived 5484 µs: the longest Non-HT PPDU (4095 octets at 6 Mb/s) is exactly that long
  const nonHtMax = C.analyze({ gen: 'nonHT', band: '5', mod: 'BPSK', R: '1/2', payload: 4095 });
  assert.equal(us(nonHtMax.timeline.txtime_ns), max);
  assert.equal(nonHtMax.maxPpdu.exceeded, false);
});

test('TXTIME > 5484 µs is flagged for every generation, exactly at the boundary, and agrees with L-SIG LENGTH <= 4095', () => {
  const limit = D.lsig.maxPpdu.value;
  const flagged = (a) => a.maxPpdu.exceeded;
  const t = (a) => us(a.timeline.txtime_ns - a.timeline.signalExtension_ns);
  const cases = [
    { gen: 'nonHT', band: '2.4', mod: 'BPSK', R: '1/2' },
    { gen: 'HT', band: '5', bw: 20, gi: 0.8, nss: 1, mcs: 0 }, { gen: 'HT', band: '2.4', bw: 20, gi: 0.4, nss: 1, mcs: 1 },
    { gen: 'VHT', bw: 20, gi: 0.8, nss: 1, mcs: 0 }, { gen: 'VHT', bw: 40, gi: 0.4, nss: 2, mcs: 3 },
    { gen: 'HE', band: '5', bw: 20, gi: 0.8, ltf: '2x', nss: 1, mcs: 0 }, { gen: 'HE', band: '2.4', bw: 20, gi: 3.2, ltf: '4x', nss: 1, mcs: 2 },
    { gen: 'HE', band: '6', bw: 40, gi: 1.6, ltf: '2x', nss: 2, mcs: 1, nominalPadding: 8 },
  ];
  let boundaries = 0;
  for (const base of cases) {
    const at = (L) => C.analyze(Object.assign({ payload: L }, base));
    const maxL = C.options(base).maxPayload ?? 1e7;
    // largest payload that still fits (binary search on the monotonic TXTIME)
    let lo = 1, hi = maxL;
    if (!flagged(at(hi))) lo = hi;
    else while (hi - lo > 1) { const mid = Math.floor((lo + hi) / 2); if (flagged(at(mid))) hi = mid; else lo = mid; }
    const fits = at(lo);
    assert.equal(flagged(fits), false);
    assert.ok(t(fits) <= limit, JSON.stringify(base));
    if (lo < maxL) {
      boundaries++;
      const over = at(lo + 1);
      assert.ok(flagged(over) && t(over) > limit, JSON.stringify(base));
    }
    // around the boundary the flag is exactly "TXTIME − SignalExtension > 5484" and the same as LENGTH > 4095
    for (let L = Math.max(1, lo - 400); L <= Math.min(maxL, lo + 400); L += 7) {
      const a = at(L);
      assert.equal(flagged(a), t(a) > limit, JSON.stringify(base) + ' ' + L);
      if (base.gen !== 'nonHT') assert.equal(flagged(a), !a.lsig.valid, JSON.stringify(base) + ' ' + L);
    }
  }
  assert.ok(boundaries >= cases.length - 1, 'every case except Non-HT (capped by the 12-bit LENGTH) has a boundary');
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
