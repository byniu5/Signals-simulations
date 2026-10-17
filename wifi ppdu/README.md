# Wi-Fi PPDU explorer

Interactive visualisation of how an IEEE 802.11 PPDU is built in frequency and time
(802.11a/g Non-HT, 802.11n HT, 802.11ac VHT, 802.11ax HE). Everything runs client-side.

**Status:** milestone (c) — 802.11a/g (Non-HT), 802.11n (HT-mixed) and 802.11ac (VHT SU) views: subcarrier map
(Data field and pre-HT plans), OFDM symbol, PPDU timeline, output panel, check table and glossary. 802.11ax (HE) and
the transmitter → receiver chain follow in later milestones.

Open `index.html` (works straight from disk).

## Layout

```
index.html, css/                  page shell
core/                             system-agnostic: registry, DOM/SVG helpers, tooltips + glossary, zoom, FFT
systems/wifi/standards-data.js    every standard-derived number and glossary term, with status + evidence (pure data)
systems/wifi/calc.js              pure calculators: tone maps, N_CBPS/N_DBPS, N_SYM (BCC / HE LDPC), TXTIME,
                                  and which unverified data each result depends on
systems/wifi/view-*.js, module.js the Wi-Fi views (draw only what calc.js returns) and system registration
tests/wifi-calc.test.js           check table, ns-3 TXTIME vectors with named exceptions, HE LDPC examples, invariants
tests/vectors/ns3-txtime.js       ns-3 vectors (verbatim) + named exceptions with sources
tests/ui-terms.test.js            glossary coverage, no cellular terms, core independent of the Wi-Fi module
tools/verification-report.js      regenerates VERIFICATION.md from the data file
VERIFICATION.md                   what is verified, what is not, and the sources used
```

Another radio system can be added later as `systems/<name>/`, without touching `systems/wifi/`.

## Commands (from the repository root)

```
node --test "wifi ppdu/tests/wifi-calc.test.js" "wifi ppdu/tests/ui-terms.test.js"
node "wifi ppdu/tools/verification-report.js"
```

## Stated simplifications

- **HE coding:** every HE configuration uses LDPC. The standard also allows BCC for MCS 0–9, N_SS ≤ 4 and RU ≤ 242 tones.
- **No STBC:** m_STBC = 1 everywhere, and there are no extension LTFs.
- **PPDU formats:** HT-mixed, VHT SU and HE SU only.
- **VHT payload:** APEP_LENGTH is used as the PSDU length (no MAC end-of-frame padding).
- **Symbol view:** shows spatial stream 1; random constellation points; pilots drawn as +1 (the standard varies their sign).
