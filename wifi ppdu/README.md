# Wi-Fi PPDU explorer

Interactive visualisation of how an IEEE 802.11 PPDU is built in frequency and time
(802.11a/g Non-HT, 802.11n HT, 802.11ac VHT, 802.11ax HE). Everything runs client-side.

**Status:** milestone (a) — data file, calculators and unit tests. There are no views yet.

## Layout

```
systems/wifi/standards-data.js   every standard-derived number, with status + evidence (pure data)
systems/wifi/calc.js             pure calculators: tone maps, N_CBPS/N_DBPS, N_SYM (BCC / HE LDPC), TXTIME
tests/wifi-calc.test.js          unit tests (check table, ns-3 TXTIME vectors, worked HE LDPC examples)
tools/verification-report.js     regenerates VERIFICATION.md from the data file
VERIFICATION.md                  what is verified, what is not, and the sources used
```

Another radio system can be added later as `systems/<name>/`, without touching `systems/wifi/`.

## Commands (from the repository root)

```
node --test "wifi ppdu/tests/wifi-calc.test.js"
node "wifi ppdu/tools/verification-report.js"
```

## Stated simplifications

- **HE coding:** every HE configuration uses LDPC. The standard also allows BCC for MCS 0–9, N_SS ≤ 4 and RU ≤ 242 tones.
- **No STBC:** m_STBC = 1 everywhere, and there are no extension LTFs.
- **PPDU formats:** HT-mixed, VHT SU and HE SU only.
- **VHT payload:** for VHT and HE the payload length is used as APEP_LENGTH.
