/* =============================================================================
 *  wave.js — time-domain waveforms of one OFDM symbol (pure, no DOM)
 * -----------------------------------------------------------------------------
 *  One sample grid for everything, so pictures can be compared exactly:
 *    L = N_FFT · M samples over T_DFT (M-times oversampling by zero-padding the IFFT),
 *    preceded by cp = L · T_GI / T_DFT samples of cyclic prefix.
 *  Sample n (−cp ≤ n < L) is at time t = n · T_DFT / L.
 *
 *    symbolValues(a, index)   subcarrier values of one Data-field symbol (illustration:
 *                             random points, pilots +1, nulls 0) — used by the symbol view
 *    symbolWaveform(a, vals)  IFFT of all of them, cyclic prefix in front
 *    toneWave(g, k, z)        one subcarrier alone: (1/L) · z · exp(j2π k n / L)
 *    partialSum(g, vals, n)   sum of the first n used subcarriers (ascending k), direct sum
 *
 *  At n = N_ST the partial sum equals symbolWaveform (tested), because the IFFT is
 *  exactly that sum.  Browser: `WifiWave`. Node: module.exports = { create(Dsp) }.
 * ===========================================================================*/
(function (root) {
  'use strict';

  function create(Dsp) {
    /** Values of the data / pilot subcarriers for symbol `index` (deterministic per configuration). */
    function symbolValues(a, index) {
      const p = a.params;
      const rand = Dsp.rng(Dsp.seedFrom(JSON.stringify([a.cfg.gen, a.cfg.bw, a.cfg.mod, a.cfg.nss, index])));
      const pts = Dsp.constellation(p.N_BPSCS);
      return a.dataTones.tones.map((t) => ({
        k: t.k, kind: t.kind,
        z: t.kind === 'data' ? pts[Math.floor(rand() * pts.length)] : t.kind === 'pilot' ? { re: 1, im: 0 } : null,
      }));
    }

    /** Sample grid of a configuration. */
    function grid(a) {
      const N = a.params.N_FFT, M = Math.max(1, Math.ceil(1024 / N)), L = N * M;
      return { N, M, L, cp: Math.round((L * a.params.T_GI_ns) / a.params.T_DFT_ns), T_DFT_ns: a.params.T_DFT_ns, T_GI_ns: a.params.T_GI_ns };
    }

    /** IFFT of the subcarrier values; returns cp + L samples (cyclic prefix first). */
    function symbolWaveform(g, values) {
      const re = new Float64Array(g.L), im = new Float64Array(g.L);
      for (const v of values) if (v.z) { const i = (v.k + g.L) % g.L; re[i] = v.z.re; im[i] = v.z.im; }
      Dsp.fft(re, im, true);
      const outRe = new Float64Array(g.cp + g.L), outIm = new Float64Array(g.cp + g.L);
      for (let n = 0; n < g.cp; n++) { outRe[n] = re[g.L - g.cp + n]; outIm[n] = im[g.L - g.cp + n]; }
      outRe.set(re, g.cp); outIm.set(im, g.cp);
      return { re: outRe, im: outIm };
    }

    /** One subcarrier: (1/L) · z · e^{j2πkn/L} for n = −cp … L−1 (the prefix is the same sinusoid continued). */
    function toneWave(g, k, z, into) {
      const len = g.cp + g.L;
      const re = into ? into.re : new Float64Array(len), im = into ? into.im : new Float64Array(len);
      if (!z || (z.re === 0 && z.im === 0)) return { re, im };
      const w = (2 * Math.PI * k) / g.L;
      // rotate by e^{jw} each sample (no trig in the loop); re-anchor every 256 samples against drift
      let cr = 0, ci = 0;
      const sr = Math.cos(w), si = Math.sin(w);
      for (let i = 0; i < len; i++) {
        if (i % 256 === 0) { const ph = w * (i - g.cp); cr = Math.cos(ph); ci = Math.sin(ph); }
        re[i] += (z.re * cr - z.im * ci) / g.L;
        im[i] += (z.re * ci + z.im * cr) / g.L;
        const nr = cr * sr - ci * si; ci = cr * si + ci * sr; cr = nr;
      }
      return { re, im };
    }

    /** The used subcarriers in the order they are added up (ascending k). */
    const usedInOrder = (values) => values.filter((v) => v.z).sort((x, y) => x.k - y.k);

    /** Sum of the first `count` used subcarriers, on the same grid as symbolWaveform. */
    function partialSum(g, values, count) {
      const len = g.cp + g.L, acc = { re: new Float64Array(len), im: new Float64Array(len) };
      const used = usedInOrder(values);
      for (let i = 0; i < Math.min(count, used.length); i++) toneWave(g, used[i].k, used[i].z, acc);
      return acc;
    }

    return { symbolValues, grid, symbolWaveform, toneWave, partialSum, usedInOrder };
  }

  if (typeof module === 'object' && module.exports) module.exports = { create };
  else root.WifiWave = create(root.Dsp);
})(typeof globalThis !== 'undefined' ? globalThis : this);
