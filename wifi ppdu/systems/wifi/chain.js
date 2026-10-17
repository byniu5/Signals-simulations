/* =============================================================================
 *  chain.js — a real, bit-level transmitter → channel → receiver (BCC path)
 * -----------------------------------------------------------------------------
 *  One spatial stream in a 20 MHz channel, using the Data-field tone plan of the
 *  selected generation. Every standard constant (scrambler, code generators,
 *  puncturing, interleaver sizes, Gray mapping, K_MOD, tone plans) comes from
 *  standards-data.js via calc.js. Pure functions: runs in Node for the tests.
 *
 *  Simplifications (stated in the view):
 *   - training: two copies of a known BPSK symbol on every used subcarrier
 *     (stands in for the L-LTF / HT-LTF / VHT-LTF / HE-LTF), after a double GI;
 *   - pilots are +1 (no pilot polarity sequence); timing is known (no L-STF
 *     packet detection); one BCC encoder; padding as in Clause 17 (no HE a-factor);
 *   - hard-decision Viterbi decoding.
 *
 *  Browser: exposes `WifiChain`. Node: module.exports = { create(D, calc, dsp) }.
 * ===========================================================================*/
(function (root) {
  'use strict';

  function create(D, C, Dsp) {
    const val = C.val;
    const BL = D.bitLevel;
    const parity = (x) => { x ^= x >> 16; x ^= x >> 8; x ^= x >> 4; x ^= x >> 2; x ^= x >> 1; return x & 1; };

    /* ---------------------------------------------------------------- bits */
    /** UTF-8 octets, each sent least significant bit first. */
    function textToBits(text) {
      const bytes = Array.from(new TextEncoder().encode(text));
      const bits = [];
      for (const b of bytes) for (let i = 0; i < 8; i++) bits.push((b >> i) & 1);
      return { bytes, bits };
    }
    function bitsToBytes(bits) {
      const bytes = [];
      for (let i = 0; i + 8 <= bits.length; i += 8) {
        let b = 0;
        for (let j = 0; j < 8; j++) b |= bits[i + j] << j;
        bytes.push(b);
      }
      return bytes;
    }
    const bytesToText = (bytes) => new TextDecoder('utf-8', { fatal: false }).decode(new Uint8Array(bytes));

    /* ----------------------------------------------------------- scrambler */
    const SCR = val(BL.scrambler);
    const [tapHi, tapLo] = SCR.polynomialExponents; // x^7 + x^4 + 1 → registers 7 and 4
    /** 7-bit state [x1 … x7] from an integer seed 1…127 (x1 = most significant bit). */
    const seedToState = (seed) => Array.from({ length: SCR.stateBits }, (_, i) => (seed >> (SCR.stateBits - 1 - i)) & 1);
    /** Scrambling sequence of length n from a state; also returns every intermediate state (for the animation). */
    function scramblerSequence(state, n) {
      const x = state.slice(), seq = [], states = [];
      for (let i = 0; i < n; i++) {
        states.push(x.slice());
        const fb = x[tapHi - 1] ^ x[tapLo - 1];
        seq.push(fb);
        x.pop(); x.unshift(fb); // x7 ← x6 … x2 ← x1, x1 ← feedback
      }
      return { seq, states, next: x };
    }
    const xor = (a, b) => a.map((v, i) => v ^ b[i]);
    /** After 7 output bits the register holds exactly those bits: x1 = newest. */
    const stateFromOutputs = (bits) => bits.slice(0, SCR.stateBits).reverse();

    /* ------------------------------------------------------ BCC + puncturing */
    const CC = val(BL.convolutionalCode);
    const K = CC.constraintLength, MEM = K - 1, NSTATES = 1 << MEM;
    const G = CC.generatorsOctal.map((o) => parseInt(o, 8));
    /** Rate-1/2 mother code. The register holds (input, d1 … d6) with the input as most significant bit. */
    function encode(bits) {
      const A = [], B = [], regs = [];
      let s = 0;
      for (const u of bits) {
        const reg = (u << MEM) | s;
        regs.push(reg);
        A.push(parity(reg & G[0]));
        B.push(parity(reg & G[1]));
        s = reg >> 1;
      }
      return { A, B, regs };
    }
    const patternOf = (R) => {
      const p = val(BL.puncturing)[R];
      if (!p) throw new Error('No puncturing pattern for R = ' + R);
      return p;
    };
    /** Coded bits in transmit order A0 B0 A1 B1 … with the removed ones left out; `map` keeps (stream, time) of each. */
    function puncture(A, B, R) {
      const [pa, pb] = patternOf(R), P = pa.length;
      const out = [], map = [];
      for (let t = 0; t < A.length; t++) {
        if (pa[t % P]) { out.push(A[t]); map.push({ s: 'A', t }); }
        if (pb[t % P]) { out.push(B[t]); map.push({ s: 'B', t }); }
      }
      return { bits: out, map };
    }
    /** Inverse of puncture: null where a bit was removed (an erasure). */
    function depuncture(bits, R, n) {
      const [pa, pb] = patternOf(R), P = pa.length;
      const A = new Array(n).fill(null), B = new Array(n).fill(null);
      let i = 0;
      for (let t = 0; t < n; t++) {
        if (pa[t % P]) A[t] = bits[i++];
        if (pb[t % P]) B[t] = bits[i++];
      }
      return { A, B };
    }
    /** Hard-decision Viterbi decoder (erasures cost nothing); the encoder starts and ends in state 0. */
    function viterbi(A, B) {
      const n = A.length, INF = 1e9;
      let metric = new Float64Array(NSTATES).fill(INF);
      metric[0] = 0;
      const from = new Uint8Array(n * NSTATES), bit = new Uint8Array(n * NSTATES);
      for (let t = 0; t < n; t++) {
        const next = new Float64Array(NSTATES).fill(INF);
        for (let s = 0; s < NSTATES; s++) {
          if (metric[s] >= INF) continue;
          for (let u = 0; u < 2; u++) {
            const reg = (u << MEM) | s;
            const a = parity(reg & G[0]), b = parity(reg & G[1]);
            const m = metric[s] + (A[t] === null ? 0 : a !== A[t]) + (B[t] === null ? 0 : b !== B[t]);
            const ns = reg >> 1;
            if (m < next[ns]) { next[ns] = m; from[t * NSTATES + ns] = s; bit[t * NSTATES + ns] = u; }
          }
        }
        metric = next;
      }
      const out = new Array(n);
      let s = 0;
      for (let t = n - 1; t >= 0; t--) { out[t] = bit[t * NSTATES + s]; s = from[t * NSTATES + s]; }
      return { bits: out, pathMetric: metric[0] };
    }

    /* --------------------------------------------------------- interleaver */
    /** Array size for one stream at 20 MHz: Non-HT 16 columns (Clause 17), later PHYs from the data file. */
    function interleaverSize(gen, N_BPSCS, N_CBPS) {
      if (gen === 'nonHT') {
        const cols = val(BL.interleaverColumnsNonHT);
        return { cols, rows: N_CBPS / cols };
      }
      const z = val(BL.interleaverSize20MHz)[gen];
      return { cols: z.columns, rows: z.rowsPerBpscs * N_BPSCS };
    }
    /** perm[k] = position j of coded bit k after both permutations. */
    function interleaverPermutation(N_CBPS, N_BPSCS, cols, rows) {
      if (cols * rows !== N_CBPS) throw new Error(`interleaver ${cols}×${rows} ≠ N_CBPS ${N_CBPS}`);
      const s = Math.max(N_BPSCS / 2, 1);
      const perm = new Array(N_CBPS), first = new Array(N_CBPS);
      for (let k = 0; k < N_CBPS; k++) {
        const i = rows * (k % cols) + Math.floor(k / cols);
        first[k] = i;
        perm[k] = s * Math.floor(i / s) + ((i + N_CBPS - Math.floor((cols * i) / N_CBPS)) % s);
      }
      return { perm, first, s };
    }
    const permute = (bits, perm) => { const out = new Array(bits.length); perm.forEach((j, k) => { out[j] = bits[k]; }); return out; };
    const unpermute = (bits, perm) => perm.map((j) => bits[j]);

    /* ------------------------------------------------- constellation mapping */
    const grayToBinary = (g) => { let b = g; while ((g >>= 1)) b ^= g; return b; };
    const binaryToGray = (b) => b ^ (b >> 1);
    function axisBits(N_BPSCS) { return N_BPSCS === 1 ? [1, 0] : [N_BPSCS / 2, N_BPSCS / 2]; }
    const kmod = (mod) => 1 / Math.sqrt(val(BL.meanEnergy)[mod]);
    /** Bits (first = sign of I) → complex point with unit average power. */
    function mapBits(bits, mod) {
      const [mi, mq] = axisBits(bits.length), k = kmod(mod);
      const level = (bs) => {
        const L = 1 << bs.length;
        const w = bs.reduce((acc, b) => (acc << 1) | b, 0);
        return 2 * grayToBinary(w) - (L - 1);
      };
      return { re: k * level(bits.slice(0, mi)), im: mq ? k * level(bits.slice(mi, mi + mq)) : 0 };
    }
    /** Nearest point (hard decision) → bits. */
    function demapPoint(z, N_BPSCS, mod) {
      const [mi, mq] = axisBits(N_BPSCS), k = kmod(mod);
      const axis = (x, m) => {
        const L = 1 << m;
        const idx = Math.min(L - 1, Math.max(0, Math.round((x / k + (L - 1)) / 2)));
        const g = binaryToGray(idx), out = [];
        for (let i = m - 1; i >= 0; i--) out.push((g >> i) & 1);
        return out;
      };
      return mq ? [...axis(z.re, mi), ...axis(z.im, mq)] : axis(z.re, mi);
    }
    /** Every point with its bit label (for drawing). */
    function constellationPoints(mod) {
      const N_BPSCS = val(D.modulations[mod].N_BPSCS);
      const pts = [];
      for (let v = 0; v < (1 << N_BPSCS); v++) {
        const bits = [];
        for (let i = N_BPSCS - 1; i >= 0; i--) bits.push((v >> i) & 1);
        pts.push(Object.assign(mapBits(bits, mod), { bits: bits.join('') }));
      }
      return pts;
    }

    /* ------------------------------------------------------------ transmit */
    const cmul = (a, b) => ({ re: a.re * b.re - a.im * b.im, im: a.re * b.im + a.im * b.re });
    const cexp = (ph) => ({ re: Math.cos(ph), im: Math.sin(ph) });

    function setup(input) {
      const { cfg } = C.normalize(Object.assign({}, input, { bw: 20, nss: 1 }));
      const p = C.symbolParams(cfg);
      const tones = C.dataToneMap(cfg.gen, 20);
      const N = tones.fft;
      const Ts_ns = 1e6 / (N * tones.spacingKHz); // sample period in ns (1 / 20 MHz = 50 ns)
      const gi = Math.round(p.T_GI_ns / Ts_ns);
      const dataK = tones.tones.filter((t) => t.kind === 'data').map((t) => t.k);
      const pilotK = tones.tones.filter((t) => t.kind === 'pilot').map((t) => t.k);
      const usedK = tones.tones.filter((t) => t.kind === 'data' || t.kind === 'pilot').map((t) => t.k);
      return { cfg, p, tones, N, Ts_ns, gi, dataK, pilotK, usedK };
    }

    /** Frequency-domain values → one OFDM symbol in time (cyclic prefix of `cp` samples). */
    function ofdmSymbol(N, cp, values, scale) {
      const re = new Float64Array(N), im = new Float64Array(N);
      for (const [k, z] of values) { re[(k + N) % N] = z.re; im[(k + N) % N] = z.im; }
      Dsp.fft(re, im, true);
      const out = [];
      for (let n = N - cp; n < N; n++) out.push({ re: re[n] * scale, im: im[n] * scale });
      for (let n = 0; n < N; n++) out.push({ re: re[n] * scale, im: im[n] * scale });
      return out;
    }

    /**
     * cfg: { gen, mod, R, gi, text, seed (1…127), interleave (default true) }
     */
    function transmit(input) {
      const S = setup(input);
      const { cfg, p, N, gi, dataK, pilotK, usedK } = S;
      const interleave = input.interleave !== false;
      const df = D.generations.nonHT.dataField; // BCC SERVICE / tail (Clause 17)
      const N_service = val(df.N_service), N_tail = val(df.N_tail);
      const msg = textToBits(input.text || '');
      const bits0 = [...new Array(N_service).fill(0), ...msg.bits, ...new Array(N_tail).fill(0)];
      const N_SYM = Math.ceil(bits0.length / p.N_DBPS);
      const N_PAD = N_SYM * p.N_DBPS - bits0.length;
      const dataBits = [...bits0, ...new Array(N_PAD).fill(0)];
      const segments = { service: N_service, payload: msg.bits.length, tail: N_tail, pad: N_PAD };

      const seed = Math.min(127, Math.max(1, Math.round(input.seed || 93)));
      const state0 = seedToState(seed);
      const sc = scramblerSequence(state0, dataBits.length);
      const scrambled = xor(dataBits, sc.seq);
      const tailAt = N_service + msg.bits.length;
      if (val(BL.tailZeroedAfterScrambling)) for (let i = 0; i < N_tail; i++) scrambled[tailAt + i] = 0;

      const enc = encode(scrambled);
      const punc = puncture(enc.A, enc.B, cfg.R);
      const coded = punc.bits; // N_SYM · N_CBPS bits
      const size = interleaverSize(cfg.gen, p.N_BPSCS, p.N_CBPS);
      const il = interleaverPermutation(p.N_CBPS, p.N_BPSCS, size.cols, size.rows);
      const interleaved = [];
      for (let m = 0; m < N_SYM; m++) {
        const blk = coded.slice(m * p.N_CBPS, (m + 1) * p.N_CBPS);
        interleaved.push(...(interleave ? permute(blk, il.perm) : blk));
      }

      // constellation points, one OFDM symbol at a time
      const symbols = [];
      for (let m = 0; m < N_SYM; m++) {
        const pts = [];
        for (let d = 0; d < p.N_SD; d++) {
          const b = interleaved.slice(m * p.N_CBPS + d * p.N_BPSCS, m * p.N_CBPS + (d + 1) * p.N_BPSCS);
          pts.push(Object.assign(mapBits(b, cfg.mod), { bits: b.join('') }));
        }
        symbols.push(pts);
      }

      // time domain: double-GI + two known training symbols, then the data symbols
      const scale = N / Math.sqrt(usedK.length); // unit average sample power
      const rnd = Dsp.rng(Dsp.seedFrom('training ' + cfg.gen));
      const training = new Map(usedK.map((k) => [k, { re: rnd() < 0.5 ? -1 : 1, im: 0 }]));
      const tTrain = ofdmSymbol(N, 2 * gi, training, scale);
      const tTrain2 = ofdmSymbol(N, 0, training, scale);
      const samples = [...tTrain, ...tTrain2];
      const preambleLen = samples.length;
      const pilotValue = { re: 1, im: 0 };
      symbols.forEach((pts) => {
        const v = new Map();
        dataK.forEach((k, d) => v.set(k, pts[d]));
        pilotK.forEach((k) => v.set(k, pilotValue));
        samples.push(...ofdmSymbol(N, gi, v, scale));
      });

      return {
        S, cfg, p, seed, state0, interleave, msg, segments, dataBits, scrSeq: sc.seq, scrStates: sc.states, scrambled,
        enc, punc, coded, size, il, interleaved, symbols, training, pilotValue, samples, preambleLen,
        N_SYM, N_PAD, symLen: N + gi,
      };
    }

    /* ------------------------------------------------------------- channel */
    /**
     * ch: { snrDb, echoDelayNs, echoGain (0…1), cfoKHz, seed }
     * Two-path channel (direct + one echo), carrier frequency offset, white Gaussian noise.
     */
    function channel(tx, ch) {
      const { N, Ts_ns, usedK } = tx.S;
      const d = Math.max(0, Math.round((ch.echoDelayNs || 0) / Ts_ns));
      const a = ch.echoGain || 0, phi = 2.1;
      const norm = 1 / Math.sqrt(1 + a * a);
      const taps = [{ delay: 0, g: { re: norm, im: 0 } }];
      if (a > 0) taps.push({ delay: d, g: { re: a * norm * Math.cos(phi), im: a * norm * Math.sin(phi) } });
      const x = tx.samples, len = x.length + d;
      const y = Array.from({ length: len }, () => ({ re: 0, im: 0 }));
      for (const t of taps) for (let n = 0; n < x.length; n++) {
        const z = cmul(x[n], t.g);
        y[n + t.delay].re += z.re; y[n + t.delay].im += z.im;
      }
      const w = 2 * Math.PI * (ch.cfoKHz || 0) * 1e3 * Ts_ns * 1e-9;
      if (w) for (let n = 0; n < len; n++) y[n] = cmul(y[n], cexp(w * n));
      const P = x.reduce((acc, z) => acc + z.re * z.re + z.im * z.im, 0) / x.length;
      const sigma = Math.sqrt(P / 10 ** ((ch.snrDb ?? 30) / 10) / 2);
      const rnd = Dsp.rng(ch.seed ?? 7);
      const gauss = () => Math.sqrt(-2 * Math.log(1 - rnd())) * Math.cos(2 * Math.PI * rnd());
      for (let n = 0; n < len; n++) { y[n].re += sigma * gauss(); y[n].im += sigma * gauss(); }
      // true frequency response on the used subcarriers (for display)
      const H = new Map(usedK.map((k) => {
        let z = { re: 0, im: 0 };
        for (const t of taps) { const e = cmul(t.g, cexp((-2 * Math.PI * k * t.delay) / N)); z = { re: z.re + e.re, im: z.im + e.im }; }
        return [k, z];
      }));
      return { samples: y, taps, delaySamples: d, delayNs: d * Ts_ns, H, noiseSigma: sigma, signalPower: P };
    }

    /* ------------------------------------------------------------- receive */
    function fftAt(r, start, N) {
      const re = new Float64Array(N), im = new Float64Array(N);
      for (let n = 0; n < N; n++) { const z = r[start + n] || { re: 0, im: 0 }; re[n] = z.re; im[n] = z.im; }
      Dsp.fft(re, im, false);
      return (k) => ({ re: re[(k + N) % N], im: im[(k + N) % N] });
    }
    const cdiv = (a, b) => { const d = b.re * b.re + b.im * b.im || 1e-30; return { re: (a.re * b.re + a.im * b.im) / d, im: (a.im * b.re - a.re * b.im) / d }; };

    /** rx options: { cfoCorrection (default true), pilotTracking (default true) } */
    function receive(tx, chOut, opts = {}) {
      const { N, Ts_ns, gi, dataK, pilotK, usedK, p, cfg } = tx.S;
      const cfoCorrection = opts.cfoCorrection !== false, pilotTracking = opts.pilotTracking !== false;
      let r = chOut.samples;
      // CFO from the phase drift between the two identical training symbols (N samples apart)
      const t0 = 2 * gi;
      let acc = { re: 0, im: 0 };
      for (let n = 0; n < N; n++) {
        const a = r[t0 + n], b = r[t0 + N + n];
        acc = { re: acc.re + b.re * a.re + b.im * a.im, im: acc.im + b.im * a.re - b.re * a.im };
      }
      const cfoEstKHz = Math.atan2(acc.im, acc.re) / (2 * Math.PI * N * Ts_ns * 1e-9) / 1e3;
      if (cfoCorrection) {
        const w = -2 * Math.PI * cfoEstKHz * 1e3 * Ts_ns * 1e-9;
        r = r.map((z, n) => cmul(z, cexp(w * n)));
      }
      // channel estimate: average of the two training symbols / known value (scaled like the true H)
      const Y1 = fftAt(r, t0, N), Y2 = fftAt(r, t0 + N, N);
      const scale = N / Math.sqrt(usedK.length);
      const Hest = new Map(usedK.map((k) => {
        const y = Y1(k), y2 = Y2(k), x = tx.training.get(k);
        return [k, cdiv({ re: (y.re + y2.re) / 2, im: (y.im + y2.im) / 2 }, { re: x.re * scale, im: x.im * scale })];
      }));
      // data symbols
      const eqBefore = [], eqAfter = [], phase = [], demapped = [];
      for (let m = 0; m < tx.N_SYM; m++) {
        const Y = fftAt(r, tx.preambleLen + m * tx.symLen + gi, N);
        const eq = (k) => { const h = Hest.get(k); return cdiv(Y(k), { re: h.re * scale, im: h.im * scale }); };
        let th = 0;
        if (pilotK.length) {
          let s = { re: 0, im: 0 };
          for (const k of pilotK) { const z = cmul(eq(k), { re: tx.pilotValue.re, im: -tx.pilotValue.im }); s = { re: s.re + z.re, im: s.im + z.im }; }
          th = Math.atan2(s.im, s.re);
        }
        phase.push(th);
        const rot = pilotTracking ? cexp(-th) : { re: 1, im: 0 };
        const before = dataK.map(eq), after = before.map((z) => cmul(z, rot));
        eqBefore.push(before); eqAfter.push(after);
        demapped.push(...after.flatMap((z) => demapPoint(z, p.N_BPSCS, cfg.mod)));
      }
      // coded bits back in encoder order
      const deinterleaved = [];
      for (let m = 0; m < tx.N_SYM; m++) {
        const blk = demapped.slice(m * p.N_CBPS, (m + 1) * p.N_CBPS);
        deinterleaved.push(...(tx.interleave ? unpermute(blk, tx.il.perm) : blk));
      }
      const dp = depuncture(deinterleaved, cfg.R, tx.dataBits.length);
      const dec = viterbi(dp.A, dp.B);
      // descramble with the state read from the first 7 SERVICE bits
      const n7 = SCR.initBitsInService;
      const recoveredState = stateFromOutputs(dec.bits);
      const rest = scramblerSequence(recoveredState, dec.bits.length - n7).seq;
      const descrambled = [...new Array(n7).fill(0), ...dec.bits.slice(n7).map((b, i) => b ^ rest[i])];
      const sv = tx.segments.service, payloadBits = descrambled.slice(sv, sv + tx.msg.bits.length);
      const bytes = bitsToBytes(payloadBits);

      // errors at each stage
      const diff = (a, b) => a.map((v, i) => (v !== b[i] ? 1 : 0));
      const rawErr = diff(demapped, tx.interleaved);                 // in transmit (interleaved) order
      const codedErr = diff(deinterleaved, tx.coded);                // in encoder order
      const decodedErr = diff(dec.bits.slice(0, tx.segments.service + tx.msg.bits.length),
        tx.scrambled.slice(0, tx.segments.service + tx.msg.bits.length));
      const payloadErr = diff(payloadBits, tx.msg.bits);
      const byteErr = bytes.map((b, i) => (b !== tx.msg.bytes[i] ? 1 : 0));
      let evmNum = 0, evmN = 0;
      eqAfter.forEach((pts, m) => pts.forEach((z, d) => { const x = tx.symbols[m][d]; evmNum += (z.re - x.re) ** 2 + (z.im - x.im) ** 2; evmN++; }));
      const evm = Math.sqrt(evmNum / Math.max(1, evmN));
      const sum = (a) => a.reduce((x, y) => x + y, 0);
      return {
        cfoEstKHz, Hest, eqBefore, eqAfter, phase, demapped, deinterleaved, decoded: dec.bits, pathMetric: dec.pathMetric,
        recoveredState, txStateAfter7: tx.scrStates[n7] || null, descrambled, payloadBits, bytes, text: bytesToText(bytes),
        errors: {
          raw: rawErr, coded: codedErr, decoded: decodedErr, payload: payloadErr, bytes: byteErr,
          rawCount: sum(rawErr), decodedCount: sum(payloadErr), byteCount: sum(byteErr),
          rawBer: sum(rawErr) / rawErr.length,
        },
        evm, evmDb: 20 * Math.log10(evm || 1e-9),
      };
    }

    /** Whole chain in one call. */
    function run(cfg, ch, rx) {
      const tx = transmit(cfg);
      const out = channel(tx, ch || {});
      return { tx, ch: out, rx: receive(tx, out, rx) };
    }

    /** Modulation / coding options for the chain (HE: only where BCC is allowed). */
    function mcsOptions(gen) {
      const g = C.generation(gen);
      const all = C.options({ gen }).mcs;
      const lim = g.codingRule ? val(g.codingRule).bccMaxMcs : Infinity;
      return all.filter((m) => m.mcs === null || m.mcs <= lim);
    }

    return {
      textToBits, bitsToBytes, bytesToText, seedToState, scramblerSequence, stateFromOutputs,
      encode, puncture, depuncture, viterbi, interleaverSize, interleaverPermutation, permute, unpermute,
      mapBits, demapPoint, constellationPoints, transmit, channel, receive, run, mcsOptions, generators: G, constraintLength: K,
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { create };
  else root.WifiChain = create(root.WIFI_STANDARDS, root.WifiCalc, root.Dsp);
})(typeof globalThis !== 'undefined' ? globalThis : this);
