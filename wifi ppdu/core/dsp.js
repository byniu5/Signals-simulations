/* core/dsp.js — generic signal-processing helpers (no radio-standard knowledge). */
(function (root) {
  'use strict';

  /**
   * In-place radix-2 FFT on separate real/imaginary arrays (length must be a power of 2).
   * inverse = true computes the IFFT including the 1/N scaling.
   */
  function fft(re, im, inverse) {
    const n = re.length;
    if (n & (n - 1)) throw new Error('FFT length must be a power of two');
    for (let i = 1, j = 0; i < n; i++) {            // bit-reversal permutation
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len <<= 1) {          // butterflies
      const ang = (2 * Math.PI / len) * (inverse ? 1 : -1);
      const wr = Math.cos(ang), wi = Math.sin(ang);
      for (let i = 0; i < n; i += len) {
        let cr = 1, ci = 0;
        for (let k = 0; k < len / 2; k++) {
          const a = i + k, b = a + len / 2;
          const tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
          re[b] = re[a] - tr; im[b] = im[a] - ti;
          re[a] += tr; im[a] += ti;
          [cr, ci] = [cr * wr - ci * wi, cr * wi + ci * wr];
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }

  /** Small deterministic PRNG (mulberry32) so the same configuration draws the same points. */
  function rng(seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seedFrom(text) {
    let hsh = 2166136261;
    for (let i = 0; i < text.length; i++) hsh = Math.imul(hsh ^ text.charCodeAt(i), 16777619);
    return hsh >>> 0;
  }

  /**
   * Points of a square QAM constellation with 2^bits points (BPSK for bits = 1),
   * scaled to unit average power. Bit labelling is not needed for drawing.
   */
  function constellation(bits) {
    if (bits === 1) return [{ re: -1, im: 0 }, { re: 1, im: 0 }];
    const side = 2 ** (bits / 2);
    const pts = [];
    for (let i = 0; i < side; i++) for (let q = 0; q < side; q++) pts.push({ re: 2 * i - side + 1, im: 2 * q - side + 1 });
    const p = pts.reduce((acc, z) => acc + z.re * z.re + z.im * z.im, 0) / pts.length;
    return pts.map((z) => ({ re: z.re / Math.sqrt(p), im: z.im / Math.sqrt(p) }));
  }

  root.Dsp = { fft, rng, seedFrom, constellation };
})(typeof globalThis !== 'undefined' ? globalThis : this);
