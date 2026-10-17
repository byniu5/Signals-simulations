/* =============================================================================
 *  calc.js — pure calculators for the Wi-Fi PPDU explorer
 * -----------------------------------------------------------------------------
 *  Every number comes from standards-data.js; nothing standard-related is
 *  hard-coded here. All functions are side-effect free so they can be unit-tested
 *  in Node and reused by every view in the browser.
 *
 *  Units: time is handled internally in integer nanoseconds (avoids 3.2 + 0.4 =
 *  3.6000000000000005); rates in Mb/s (= bits per µs).
 *
 *  Browser: exposes `WifiCalc` (built from the global WIFI_STANDARDS).
 *  Node:    module.exports = { create } — call create(data).
 * ===========================================================================*/
(function (root) {
  'use strict';

  function create(D) {
    /* ---------- small helpers ---------- */
    const val = (e) => (e !== null && typeof e === 'object' && !Array.isArray(e) && 'value' in e ? e.value : e);
    const ns = (us) => Math.round(us * 1000);
    const parseRate = (text) => {
      const [n, d] = text.split('/').map(Number);
      return { n, d, value: n / d, text };
    };
    const expand = (ranges) => {
      const out = [];
      for (const [a, b] of ranges) for (let k = a; k <= b; k++) out.push(k);
      return out;
    };

    function generation(id) {
      const g = D.generations[id];
      if (!g) throw new Error('Unknown PHY generation: ' + id);
      return g;
    }

    /* ======================================================================
     *  Tone plans (frequency domain)
     *
     *  A subcarrier index k runs over -N_FFT/2 .. N_FFT/2-1. Each index is one of
     *    data   – carries coded bits (constellation points)
     *    pilot  – known symbol, used to track residual frequency / phase error
     *    dc     – nulled around the channel centre (the receiver's LO leakage
     *             and DC offset land here)
     *    null   – other interior nulls (e.g. the centre of each 80 MHz half at 160 MHz)
     *    guard  – nulled at the band edges so the spectrum fits the channel mask
     * ==================================================================== */
    function toneplanEntry(genId, bw) {
      let tp = generation(genId).toneplan[bw];
      if (!tp) throw new Error(`${genId} has no tone plan for ${bw} MHz`);
      if (tp.sameAs) tp = generation(tp.sameAs).toneplan[bw];
      return tp;
    }

    function classify(fft, occupiedList, pilotList) {
      const occ = new Set(occupiedList), pil = new Set(pilotList);
      let lo = Infinity, hi = -Infinity, negIn = -Infinity, posIn = Infinity;
      for (const k of occupiedList) {
        if (k < lo) lo = k;
        if (k > hi) hi = k;
        if (k < 0 && k > negIn) negIn = k;
        if (k > 0 && k < posIn) posIn = k;
      }
      const tones = [];
      for (let k = -fft / 2; k < fft / 2; k++) {
        let kind;
        if (pil.has(k)) kind = 'pilot';
        else if (occ.has(k)) kind = 'data';
        else if (k < lo || k > hi) kind = 'guard';
        else if (k > negIn && k < posIn) kind = 'dc';
        else kind = 'null';
        tones.push({ k, kind });
      }
      return tones;
    }

    function summarizeTones(tones, extra) {
      const counts = { data: 0, pilot: 0, dc: 0, null: 0, guard: 0 };
      for (const t of tones) counts[t.kind]++;
      return Object.assign({
        tones,
        counts,
        N_SD: counts.data,
        N_SP: counts.pilot,
        N_ST: counts.data + counts.pilot,
      }, extra);
    }

    /** Subcarrier map of the Data field (and the fields that share its numerology). */
    function dataToneMap(genId, bw) {
      const g = generation(genId);
      const fft = val(g.numerology.fftSize)[bw];
      const tp = toneplanEntry(genId, bw);
      const tones = classify(fft, expand(val(tp.occupied)), val(tp.pilots));
      return summarizeTones(tones, {
        field: 'data',
        fft,
        spacingKHz: val(g.numerology.subcarrierSpacingKHz),
        expectedN_SD: val(tp.N_SD),
      });
    }

    /**
     * Subcarrier map of the pre-HT fields (L-STF, L-LTF, L-SIG, HT-SIG, VHT-SIG-A,
     * RL-SIG, HE-SIG-A): the 20 MHz Non-HT plan copied into every 20 MHz
     * subchannel, each copy with its own phase rotation. Always 312.5 kHz spacing.
     */
    function legacyToneMap(bw) {
      const L = D.legacy;
      const fft20 = val(L.fftSizePer20MHz);
      const offsets = val(L.subchannelOffsets)[bw];
      const rotation = val(L.phaseRotationDeg)[bw];
      if (!offsets) throw new Error('No legacy subchannel layout for ' + bw + ' MHz');
      const local = classify(fft20, expand(val(L.occupied)), val(L.pilots));
      const tones = [];
      offsets.forEach((c, s) => {
        for (const t of local) tones.push({ k: t.k + c, kind: t.kind, subchannel: s, rotationDeg: rotation[s] });
      });
      tones.sort((a, b) => a.k - b.k);
      return summarizeTones(tones, {
        field: 'legacy',
        fft: fft20 * offsets.length,
        spacingKHz: val(L.subcarrierSpacingKHz),
        subchannels: offsets.map((c, s) => ({ centre: c, rotationDeg: rotation[s] })),
      });
    }

    /* ======================================================================
     *  Modulation and coding
     * ==================================================================== */
    function mcsOptions(genId) {
      const g = generation(genId);
      if (genId === 'nonHT') {
        return val(g.rates).map((r) => ({ mcs: null, mod: r.mod, R: r.R, rateLabel: r.rateMbps + ' Mb/s' }));
      }
      const max = genId === 'HT' ? g.maxMcsPerStream : g.maxMcs;
      return val(D.mcsTable).filter((m) => m.mcs <= max).map((m) => ({ mcs: m.mcs, mod: m.mod, R: m.R }));
    }

    /** VHT combinations that the MCS tables do not define (returns the matching exclusion entry or null). */
    function exclusion(cfg) {
      const g = generation(cfg.gen);
      if (!g.exclusions) return null;
      return g.exclusions.find((x) => x.bw === cfg.bw && x.mcs === cfg.mcs && x.nss.includes(cfg.nss)) || null;
    }

    /** Displayed MCS index: HT numbers equal-modulation MCSs 0..31 across streams. */
    function displayMcs(cfg) {
      if (cfg.gen === 'nonHT') return null;
      return cfg.gen === 'HT' ? 8 * (cfg.nss - 1) + cfg.mcs : cfg.mcs;
    }

    /** Number of BCC encoders N_ES (Non-HT, HT, VHT). */
    function numEncoders(cfg, rateMbps) {
      if (cfg.gen === 'nonHT') return 1;
      const g = generation(cfg.gen);
      const enc = val(g.encoders);
      if (enc.exceptions) {
        const x = enc.exceptions.find((e) => e.bw === cfg.bw && e.nss === cfg.nss && e.mcs === cfg.mcs);
        if (x) return x.N_ES;
      }
      return Math.max(1, Math.ceil(rateMbps / enc.maxMbpsPerEncoder[cfg.gi] - 1e-9));
    }

    /**
     * Core per-symbol numbers.
     *   N_CBPS = N_SD · N_BPSCS · N_SS   (coded bits per OFDM symbol)
     *   N_DBPS = N_CBPS · R              (data bits per OFDM symbol)
     * For HE the product can be fractional (e.g. 980·10·5/6); the rounding rule
     * is taken from the data file (dataField.N_DBPS_rounding).
     */
    function symbolParams(cfg) {
      const g = generation(cfg.gen);
      const tones = dataToneMap(cfg.gen, cfg.bw);
      const N_BPSCS = val(D.modulations[cfg.mod].N_BPSCS);
      const R = parseRate(cfg.R);
      const N_SS = cfg.nss;
      const N_CBPS = tones.N_SD * N_BPSCS * N_SS;
      const N_DBPS_exact = (N_CBPS * R.n) / R.d;
      let N_DBPS = N_DBPS_exact;
      let fractionalN_DBPS = false; // true = combination not defined by this generation's MCS tables
      if (!Number.isInteger(N_DBPS_exact)) {
        const rule = g.dataField.N_DBPS_rounding ? val(g.dataField.N_DBPS_rounding) : null;
        if (rule === 'floor') N_DBPS = Math.floor(N_DBPS_exact);
        else fractionalN_DBPS = true;
      }
      const T_DFT_ns = ns(val(g.numerology.T_DFT));
      const T_GI_ns = ns(cfg.gi);
      const T_SYM_ns = T_DFT_ns + T_GI_ns;
      const rateMbps = (N_DBPS * 1000) / T_SYM_ns;
      const exactRateMbps = (N_DBPS_exact * 1000) / T_SYM_ns;
      return {
        N_FFT: tones.fft, spacingKHz: tones.spacingKHz,
        N_SD: tones.N_SD, N_SP: tones.N_SP, N_ST: tones.N_ST,
        N_BPSCS, R, N_SS, N_CBPS, N_DBPS, N_DBPS_exact, fractionalN_DBPS,
        T_DFT_ns, T_GI_ns, T_SYM_ns, rateMbps, exactRateMbps,
        N_ES: g.coding === 'BCC' ? numEncoders(cfg, rateMbps) : null,
      };
    }

    /* ======================================================================
     *  Number of data OFDM symbols
     * ==================================================================== */

    /**
     * BCC (Non-HT, HT, VHT): the Data field carries SERVICE (16 bits), the PSDU,
     * 6 tail bits per encoder and pad bits up to a whole number of symbols.
     *   N_SYM = ceil((N_service + 8·L + N_tail·N_ES) / N_DBPS)
     */
    function bccSymbols(cfg, p) {
      const df = generation(cfg.gen).dataField;
      const N_service = val(df.N_service);
      const N_tail = val(df.N_tail) * p.N_ES;
      const bits = N_service + 8 * cfg.payload + N_tail;
      const N_SYM = Math.ceil(bits / p.N_DBPS);
      return {
        coding: 'BCC', N_SYM, N_service, N_tail, payloadBits: 8 * cfg.payload,
        N_PAD: N_SYM * p.N_DBPS - bits,
      };
    }

    /** LDPC codeword parameters for N_pld information bits into N_avbits coded bits. */
    function ldpcParams(N_pld, N_avbits, R) {
      const rows = val(D.ldpc.codewordTable);
      const oneMinusR = 1 - R.value;
      let N_CW, L;
      const row = rows.find((r) => r.maxAvbits === null || N_avbits <= r.maxAvbits);
      if (row.N_CW === null) {
        N_CW = Math.ceil(N_pld / ((row.L_long * R.n) / R.d));
        L = row.L_long;
      } else {
        N_CW = row.N_CW;
        L = row.threshold === null ? row.L_long : (N_avbits >= N_pld + row.threshold * oneMinusR ? row.L_long : row.L_short);
      }
      const K = (N_CW * L * R.n) / R.d;              // information bits the codewords can hold
      const N_shrt = Math.max(0, K - N_pld);           // shortening bits (zeros, not transmitted)
      const N_punc = Math.max(0, N_CW * L - N_avbits - N_shrt); // parity bits removed to fit
      const c = val(D.ldpc.extraSymbolCondition);
      const extra = N_punc > c.puncturedFraction * N_CW * L * oneMinusR &&
                    N_shrt < (c.shorteningFactor * N_punc * R.value) / oneMinusR;
      return { N_CW, L_LDPC: L, N_shrt, N_punc, extraSegment: extra };
    }

    /**
     * HE with LDPC: the last OFDM symbol is split into 4 segments. The pre-FEC
     * padding factor a (1..4) says how many segments carry data, which lets the
     * receiver stop decoding early and lets the PE field be shorter.
     */
    function heLdpcSymbols(cfg, p) {
      const g = generation(cfg.gen);
      const df = g.dataField;
      const N_service = val(df.N_service);
      const N_tail = val(df.N_tail);
      const ruTones = p.N_ST; // HE SU: the whole channel is one RU (242/484/996/2x996 tones)
      const N_SD_short = val(df.N_SD_short)[ruTones];
      if (N_SD_short === undefined) throw new Error('No N_SD,short for RU size ' + ruTones);
      const N_CBPS_short = N_SD_short * p.N_BPSCS * p.N_SS;
      const N_DBPS_short = (N_CBPS_short * p.R.n) / p.R.d;

      const bits = 8 * cfg.payload + N_tail + N_service;
      const N_Excess = bits % p.N_DBPS;
      const N_SYM_init = Math.ceil(bits / p.N_DBPS);
      const a_init = N_Excess === 0 ? 4 : Math.min(Math.ceil(N_Excess / N_DBPS_short), 4);
      const N_DBPS_last = a_init < 4 ? a_init * N_DBPS_short : p.N_DBPS;
      const N_CBPS_last = a_init < 4 ? a_init * N_CBPS_short : p.N_CBPS;
      const N_PAD_preFEC = (N_SYM_init - 1) * p.N_DBPS + N_DBPS_last - bits;
      const N_pld = (N_SYM_init - 1) * p.N_DBPS + N_DBPS_last;
      const N_avbits = (N_SYM_init - 1) * p.N_CBPS + N_CBPS_last;
      const ldpc = ldpcParams(N_pld, N_avbits, p.R);

      let N_SYM = N_SYM_init, a = a_init;
      if (ldpc.extraSegment) {
        if (a_init === 4) { N_SYM = N_SYM_init + 1; a = 1; } else { a = a_init + 1; }
      }
      return {
        coding: 'LDPC', N_SYM, N_service, N_tail, payloadBits: 8 * cfg.payload,
        N_SD_short, N_CBPS_short, N_DBPS_short, N_Excess, N_SYM_init, a_init, a,
        N_PAD_preFEC, N_pld, N_avbits, ldpc,
      };
    }

    function dataSymbols(cfg, p) {
      return generation(cfg.gen).coding === 'LDPC' ? heLdpcSymbols(cfg, p) : bccSymbols(cfg, p);
    }

    /* ======================================================================
     *  PPDU timeline and TXTIME
     * ==================================================================== */
    function fieldDuration(genId, field) {
      if (field.duration) return field.duration;
      if (field.ref) return generation(field.ref).fields.find((f) => f.name === field.name).duration;
      return null;
    }

    function numLtf(cfg) {
      return val(generation(cfg.gen).N_LTF)[cfg.nss];
    }

    function timeline(cfg, p, sym) {
      const g = generation(cfg.gen);
      const items = [];
      let t = 0;
      const push = (item) => { item.start_ns = t; t += item.dur_ns; items.push(item); };

      for (const f of g.fields) {
        if (f.kind === 'data') {
          push({ name: 'Data', kind: 'data', count: sym.N_SYM, each_ns: p.T_SYM_ns, dur_ns: sym.N_SYM * p.T_SYM_ns, toneplan: 'data' });
          continue;
        }
        if (f.kind === 'pe') {
          const T_PE = val(g.packetExtension.T_PE)[cfg.nominalPadding][sym.a - 1];
          if (T_PE > 0) push({ name: 'PE', kind: 'pe', dur_ns: ns(T_PE) });
          continue;
        }
        if (f.count === 'N_LTF') {
          const n = numLtf(cfg);
          let each;
          if (f.durationEach === 'heLtf') each = ns(val(g.heLtf.symbolWithoutGi)[cfg.ltf]) + p.T_GI_ns;
          else each = ns(val(f.durationEach));
          push({ name: f.name, kind: 'training', count: n, each_ns: each, dur_ns: n * each, toneplan: 'data' });
          continue;
        }
        const d = fieldDuration(cfg.gen, f);
        push({ name: f.name, kind: /STF|LTF/.test(f.name) ? 'training' : 'signal', dur_ns: ns(val(d)),
               toneplan: f.toneplan === 'legacy' ? 'legacy' : 'data' });
      }

      const onAir_ns = t;
      // HT-mixed / VHT short GI: TXTIME rounds the data part up to the 4 µs legacy symbol grid.
      if (g.txtime && val(g.txtime.shortGiRounding) && p.T_GI_ns < ns(0.8)) {
        const sym4 = ns(val(g.txtime.legacySymbol));
        const data = items.find((i) => i.kind === 'data');
        const rounded = Math.ceil(data.dur_ns / sym4) * sym4;
        if (rounded > data.dur_ns) push({ name: 'Short-GI alignment', kind: 'gap', dur_ns: rounded - data.dur_ns });
      }
      const sigExt = val(D.interframe.signalExtension)[cfg.band] || 0;
      if (sigExt > 0) push({ name: 'Signal extension', kind: 'gap', dur_ns: ns(sigExt) });

      return { items, onAir_ns, txtime_ns: t };
    }

    /* ======================================================================
     *  Configuration handling
     * ==================================================================== */

    /** Options the UI may offer for a given (partial) configuration. */
    function options(cfg) {
      const g = generation(cfg.gen);
      const bands = Object.keys(g.bands);
      const band = bands.includes(cfg.band) ? cfg.band : (bands.includes('5') ? '5' : bands[0]);
      const bandwidths = g.bands[band].bandwidths || g.bandwidths;
      const guardIntervals = val(g.numerology.guardIntervals);
      const ltfTypes = g.heLtf ? val(g.heLtf.allowedWithGi) : null;
      return { bands, band, bandwidths, guardIntervals, ltfTypes, spatialStreams: g.spatialStreams, mcs: mcsOptions(cfg.gen) };
    }

    /** Fill in / correct a configuration so it is valid for the chosen generation. */
    function normalize(input) {
      const cfg = Object.assign({ gen: 'nonHT', band: '5', bw: 20, gi: 0.8, nss: 1, payload: 1500, nominalPadding: 16, ltf: '2x' }, input);
      const notes = [];
      if (!D.generations[cfg.gen]) cfg.gen = 'nonHT';
      const o = options(cfg);
      if (o.band !== cfg.band) { notes.push(`band ${cfg.band} GHz not available, using ${o.band} GHz`); cfg.band = o.band; }
      if (!o.bandwidths.includes(cfg.bw)) {
        const fit = o.bandwidths.filter((b) => b <= cfg.bw);
        cfg.bw = fit.length ? fit[fit.length - 1] : o.bandwidths[0];
      }
      if (!o.guardIntervals.includes(cfg.gi)) cfg.gi = o.guardIntervals[0];
      if (o.ltfTypes && !o.ltfTypes.some((x) => x.ltf === cfg.ltf && x.gi === cfg.gi)) {
        cfg.ltf = o.ltfTypes.find((x) => x.gi === cfg.gi).ltf;
      }
      if (!o.spatialStreams.includes(cfg.nss)) cfg.nss = Math.min(Math.max(cfg.nss, o.spatialStreams[0]), o.spatialStreams[o.spatialStreams.length - 1]);

      // modulation / coding rate: accept an MCS index or a (mod, R) pair
      let m = null;
      if (cfg.mcs !== undefined && cfg.mcs !== null) m = o.mcs.find((x) => x.mcs === cfg.mcs);
      if (!m && cfg.mod) m = o.mcs.find((x) => x.mod === cfg.mod && x.R === cfg.R) || o.mcs.find((x) => x.mod === cfg.mod);
      if (!m) m = o.mcs[0];
      cfg.mcs = m.mcs; cfg.mod = m.mod; cfg.R = m.R;

      cfg.payload = Math.max(1, Math.round(Number(cfg.payload) || 1));
      if (cfg.gen === 'HE') {
        const pads = val(generation('HE').packetExtension.nominalPacketPadding);
        if (!pads.includes(cfg.nominalPadding)) cfg.nominalPadding = pads[pads.length - 1];
      }
      return { cfg, notes };
    }

    /** Everything the views need for one configuration. */
    function analyze(input) {
      const { cfg, notes } = normalize(input);
      const p = symbolParams(cfg);
      const sym = dataSymbols(cfg, p);
      const tl = timeline(cfg, p, sym);
      return {
        cfg, notes,
        excluded: exclusion(cfg),
        mcsIndex: displayMcs(cfg),
        params: p,
        symbols: sym,
        timeline: tl,
        dataTones: dataToneMap(cfg.gen, cfg.bw),
        legacyTones: legacyToneMap(cfg.bw),
      };
    }

    /** Evaluate the built-in check table. */
    function runChecks() {
      return D.checkTable.rows.map((row) => {
        const { cfg } = normalize(row);
        const p = symbolParams(cfg);
        const isHE = row.gen === 'HE';
        const reference = isHE ? p.exactRateMbps : row.expectMbps;
        const pass = Math.abs(p.rateMbps - reference) <= row.tol &&
          Math.abs(p.exactRateMbps - row.expectMbps) <= row.tol &&
          (row.expectNDBPS === undefined || p.N_DBPS === row.expectNDBPS);
        return { row, cfg, rateMbps: p.rateMbps, exactRateMbps: p.exactRateMbps, N_DBPS: p.N_DBPS, pass };
      });
    }

    return {
      data: D, val, ns,
      generation, options, normalize, analyze, runChecks,
      dataToneMap, legacyToneMap, symbolParams, dataSymbols, ldpcParams, timeline, exclusion, displayMcs,
    };
  }

  if (typeof module === 'object' && module.exports) module.exports = { create };
  else root.WifiCalc = create(root.WIFI_STANDARDS);
})(typeof globalThis !== 'undefined' ? globalThis : this);
