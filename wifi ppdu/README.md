# Wi-Fi PPDU explorer

Interactive visualisation of how an IEEE 802.11 PPDU is built in frequency and time
(802.11a/g Non-HT, 802.11n HT, 802.11ac VHT, 802.11ax HE). Everything runs client-side.

**Status:** milestone (e) — 802.11a/g (Non-HT), 802.11n (HT-mixed), 802.11ac (VHT SU) and 802.11ax (HE SU) views:
subcarrier map (Data field and pre-HT / pre-HE plans, plus an RU overlay for HE), OFDM symbol, PPDU timeline (HE:
RL-SIG, HE-LTF type, LDPC pre-FEC padding with the a-factor, packet extension), output panel, check table and
glossary.

Milestone (e) adds two modes:
- **Transmitter → receiver:** a real bit-level chain for one 20 MHz stream (scrambler, BCC encoder + puncturing,
  interleaver, Gray mapping, IFFT + cyclic prefix → echo, frequency offset, noise → FFT, channel estimate, equalizer
  with pilot tracking, demapper, deinterleaver, Viterbi, descrambler). Type a message, move the channel sliders and
  watch it survive or break; "Break it" presets, "follow the bits" animation, and a hardware / software boundary
  against SIFS.
- **Generations compared:** a PPDU race for one payload, payload rate against payload size, where the extra speed
  comes from, the four tone plans in one 20 MHz channel, and a side-by-side table (changes highlighted).

Every number carries one of four statuses: *standard-checked*, *supported* (two independent public sources),
*derived* (arithmetic from checked values) or *unverified* — only the last is shown as a warning.
See `VERIFICATION.md`.

Open `index.html` (works straight from disk).

## Layout

```
index.html, css/                  page shell
core/                             system-agnostic: registry, DOM/SVG helpers, tooltips + glossary, zoom, FFT
systems/wifi/standards-data.js    every standard-derived number and glossary term, with status + evidence (pure data)
systems/wifi/nav.js               where the user is (PPDU > Data field > symbol > subcarrier), URL hash, clamping
systems/wifi/chain.js             bit-level transmitter → channel → receiver (BCC path), pure functions
systems/wifi/calc.js              pure calculators: tone maps, N_CBPS/N_DBPS, N_SYM (BCC / HE LDPC), TXTIME,
                                  and which unverified data each result depends on
systems/wifi/view-*.js, module.js the Wi-Fi views (draw only what calc.js returns) and system registration
tests/wifi-calc.test.js           check table, ns-3 TXTIME vectors with named exceptions, HE LDPC examples, invariants
tests/vectors/ns3-txtime.js       ns-3 vectors (verbatim) + named exceptions with sources
tests/ui-terms.test.js            glossary coverage, no cellular terms, core independent of the Wi-Fi module
tests/wifi-nav.test.js            URL hash round trip, symbol / subcarrier index clamping after config changes
tests/wifi-chain.test.js          scrambler vector, BCC impulse response, puncturing, interleaver, Gray mapping, end-to-end
tools/verification-report.js      regenerates VERIFICATION.md from the data file
VERIFICATION.md                   what is verified, what is not, and the sources used
```

Another radio system can be added later as `systems/<name>/`, without touching `systems/wifi/`.

## Commands (from the repository root)

```
node --test "wifi ppdu/tests/wifi-calc.test.js" "wifi ppdu/tests/ui-terms.test.js" "wifi ppdu/tests/wifi-chain.test.js" "wifi ppdu/tests/wifi-nav.test.js"
node "wifi ppdu/tools/verification-report.js"
```

## Stated simplifications

- **HE coding:** every HE configuration uses LDPC. The standard also allows BCC for MCS 0–9, N_SS ≤ 4 and RU ≤ 242 tones.
- **HE options left out:** DCM, midambles, the 4x HE-LTF with 0.8 µs GI, the PE disambiguity bit. N_HE-LTF is assumed
  to follow the VHT mapping (unverified).
- **HE payload:** no APEP_LENGTH field limit is applied; only the 5484 µs maximum PPDU duration is checked.
- **RU overlay:** an illustration of HE MU / HE TB PPDUs on top of the HE SU plan; the pilots drawn are the HE SU
  pilots (each RU has its own, not shown).
- **No STBC:** m_STBC = 1 everywhere, and there are no extension LTFs.
- **PPDU formats:** HT-mixed, VHT SU and HE SU only.
- **VHT payload:** APEP_LENGTH is used as the PSDU length (no MAC end-of-frame padding).
- **Symbol view:** shows spatial stream 1; random constellation points; pilots drawn as +1 (the standard varies their sign).
- **Chain mode:** 20 MHz, one stream, BCC (HE limited to MCS 0–9, where BCC is allowed); a known BPSK training symbol
  stands in for the LTFs; no L-STF (timing is known); pilots always +1; one encoder; Clause 17 padding (no HE a-factor);
  hard-decision Viterbi; a two-path channel. Interleaver sizes for HT / VHT / HE are unverified.
