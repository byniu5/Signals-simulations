# Wi-Fi PPDU explorer — verification status

Generated from `systems/wifi/standards-data.js` by `tools/verification-report.js`. Do not edit by hand.

No clause number was read in the IEEE document. Top-level clauses are those given in the project brief; sub-clause / table numbers are as cited by the listed secondary sources.

**Statuses** (only *unverified* is shown as a warning in the app): *standard-checked* — read in the standard text by the
user; *supported* — at least two independent public sources, standard text not read; *derived* — arithmetic from
checked values; *unverified* — everything else. Sources are counted by their `origin` (several ns-3 files are one
origin); `plan` and `arith` are cross-checks and never count as sources. The unit tests enforce these rules.

- Status-bearing entries: **128** — unverified **29** · standard-checked **0** · supported **69** · derived **30**

## Unverified — please check against the standard (29)

Fewer than two independent public sources, or an input of a derivation is unverified. Shown as a warning in the app.

| Entry | Value | Evidence | Note |
|---|---|---|---|
| `legacy.phaseRotationDeg` | {"20":[0],"40":[0,90],"80":[0,180,180,180],"160":[0,180,180,180,0,180,180,180]} | pat-phase-rot, keysight-nonht-dup | 40 MHz {1, j} and 80 MHz {1,-1,-1,-1} are stated by a patent (verified level); the 160 MHz pattern (two 80 MHz patterns) was not found in a source, so the entry as a whole stays unverified. |
| `generations.HT.toneplan.20.pilots` | [-21,-7,7,21] | plan | same positions as Non-HT; no source found for HT 20 MHz specifically |
| `generations.HT.toneplan.40.pilots` | [-53,-25,-11,11,25,53] | pat-ht-vht-pilots, plan |  |
| `generations.HT.fields[HT-SIG].duration` | 8 µs | ns3-ht, plan | HT-SIG1 + HT-SIG2 |
| `generations.VHT.toneplan.80.pilots` | [-103,-75,-39,-11,11,39,75,103] | pat-ht-vht-pilots, plan |  |
| `generations.VHT.toneplan.160.occupied` | [[-250,-130],[-126,-6],[6,126],[130,250]] | plan | Two 80 MHz plans at ±128 (4 x 121 = 484 = 468 + 16): consistent arithmetic, but index ranges not found in a source. |
| `generations.VHT.toneplan.160.pilots` | [-231,-203,-167,-139,-117,-89,-53,-25,25,53,89,117,139,167,203,231] | pat-ht-vht-pilots, plan |  |
| `generations.HE.toneplan.20.occupied` | [[-122,-2],[2,122]] | ns3-heru, plan |  — clause as cited: Table 27-7 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.20.pilots` | [-116,-90,-48,-22,22,48,90,116] | pat-he-pilots-242, plan | Stated by one patent; marked unverified in review (not to be derived from the 80 MHz set). |
| `generations.HE.toneplan.40.occupied` | [[-244,-3],[3,244]] | ns3-heru, plan |  — clause as cited: Table 27-8 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.40.pilots` | [-238,-212,-170,-144,-104,-78,-36,-10,10,36,78,104,144,170,212,238] | plan | Value from the pre-research plan only; no source found. |
| `generations.HE.toneplan.80.occupied` | [[-500,-3],[3,500]] | ns3-heru, plan |  — clause as cited: Table 27-9 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.80.pilots` | [-468,-400,-334,-266,-226,-158,-92,-24,24,92,158,226,266,334,400,468] | ieee-16-0623, plan | Corrected in review. The ±18-based set found in patents is the 802.11be design. — clause as cited: Table 26-32 of TGax draft (per IEEE 11-16/0623r0, reviewer-cited) |
| `generations.HE.toneplan.160.occupied` | [[-1012,-515],[-509,-12],[12,509],[515,1012]] | ns3-heru, plan |  |
| `generations.HE.toneplan.160.pilots` | [-980,-912,-846,-778,-738,-670,-604,-536,-488,-420,-354,-286,-246,-178,-112,-44,44,112,… | ieee-16-0623 | The 80 MHz set shifted by −512 and +512 (rule supplied in review). |
| `generations.HE.resourceUnits.countPerBandwidth` | {"20":{"26":9,"52":4,"106":2,"242":1},"40":{"26":18,"52":8,"106":4,"242":2,"484":1},"80… | ns3-heru, plan |  |
| `generations.HE.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | plan | Assumed equal to the VHT mapping; ns-3 caps HE-LTFs at 8 but does not show the mapping. |
| `generations.HE.dataField.N_DBPS_rounding` | floor | tgbe-ndbps | N_DBPS = floor(N_CBPS · R). Stated on the TGbe (802.11be) reflector only. None of the 72 ns-3 HE TXTIME vectors distinguishes floor from exact (see tests). Payloads that would: HE 80 MHz MCS 9 APEP_LENGTH 2448, MCS 11 APEP_LENGTH 5102 (1 SS, GI 0.8 µs) — check one of these in another tool. |
| `lsig.nonHtLength` | PSDU length in octets | review-2, plan, mw-lsig | MathWorks + reviewer statement only (one public origin). |
| `ldpc.codewordTable` | [{"maxAvbits":648,"N_CW":1,"L_long":1296,"L_short":648,"threshold":912},{"maxAvbits":12… | plan | Row i applies when N_avbits <= maxAvbits. L_long is used if N_avbits >= N_pld + threshold·(1 − R). Last row: N_CW = ceil(N_pld / (1944·R)). Codeword lengths 648/1296/1944 confirmed by patents; thresholds not found. |
| `ldpc.extraSymbolCondition` | {"puncturedFraction":0.1,"shorteningFactor":1.2} | pat-ldpc-extra, plan | Extra symbol (HT) / LDPC extra symbol segment (HE) if N_punc > 0.1·N_CW·L_LDPC·(1 − R) AND N_shrt < 1.2·N_punc·R/(1 − R). The patent uses this form for a longer-codeword variant. |
| `interframe.bands.5.SIFS` | 16 µs | wiki-sifs, wiki-difs, plan |  |
| `interframe.bands.5.aSlotTime` | {"short":9} µs | wiki-difs, plan |  |
| `interframe.bands.6.SIFS` | 16 µs | wiki-sifs, wiki-difs, plan | assumed same as 5 GHz |
| `interframe.bands.6.aSlotTime` | {"short":9} µs | wiki-difs, plan |  |
| `interframe.bands.2.4.SIFS` | 10 µs | plan |  |
| `interframe.bands.2.4.aSlotTime` | {"short":9,"long":20} µs | plan |  |
| `interframe.difsRule` | DIFS = SIFS + 2 × aSlotTime | wiki-difs, plan |  |
| `interframe.ackFrameOctets` | 14 octet | plan |  |

## Standard-checked (0)

Read in the standard text by the user.

_None._

## Supported (secondary sources) (69)

At least two independent public sources (open-source implementation, IEEE submission, patent, vendor documentation), or classified as supported by the reviewer (source `review-3`). The standard text itself was not read.

| Entry | Value | Evidence | Note |
|---|---|---|---|
| `mcsTable` | [{"mcs":0,"mod":"BPSK","R":"1/2"},{"mcs":1,"mod":"QPSK","R":"1/2"},{"mcs":2,"mod":"QPSK… | rs-rates, plan, ns3-vht | ns-3 defines the same MCS -> (modulation, R) modes; its TXTIME vectors at MCS 0, 6-9, 11 depend on them and are reproduced by the tests. Rates reproduce the R&S tables. |
| `legacy.fftSizePer20MHz` | 64 | keysight-ofdm, plan, tub-ofdm |  |
| `legacy.occupied` | [[-26,-1],[1,26]] | pat-legacy-sig, keysight-ofdm, plan |  |
| `legacy.pilots` | [-21,-7,7,21] | pat-legacy-sig, keysight-ofdm, plan |  |
| `generations.nonHT.ofdm.guardIntervals` | [0.8] µs | ns3-ofdm, keysight-ofdm, plan |  |
| `generations.nonHT.ofdm.fftSize` | {"20":64} | keysight-ofdm, plan, tub-ofdm |  |
| `generations.nonHT.toneplan.20.occupied` | [[-26,-1],[1,26]] | pat-legacy-sig, keysight-ofdm, plan |  |
| `generations.nonHT.toneplan.20.pilots` | [-21,-7,7,21] | pat-legacy-sig, keysight-ofdm, plan |  |
| `generations.nonHT.toneplan.20.N_SD` | 48 | ns3-ofdm, keysight-ofdm, plan |  |
| `generations.nonHT.rates` | [{"rateMbps":6,"mod":"BPSK","R":"1/2"},{"rateMbps":9,"mod":"BPSK","R":"3/4"},{"rateMbps… | ns3-ofdm, plan, vocal-11a |  |
| `generations.nonHT.lsigBits` | [{"name":"RATE","bits":4},{"name":"Reserved","bits":1},{"name":"LENGTH","bits":12},{"na… | plan, mw-lsig, pat-lsig-bits, review-3 | 24 bits = one BPSK rate-1/2 OFDM symbol (48 coded bits on 48 data subcarriers). |
| `generations.nonHT.dataField.N_service` | 16 bit | ns3-ofdm, plan, vocal-11a | SERVICE field |
| `generations.nonHT.dataField.N_tail` | 6 bit | ns3-ofdm, plan, mw-hdl-conv | BCC tail per encoder |
| `generations.nonHT.fields[L-STF].duration` | 8 µs | pat-preamble-11a, ns3-ofdm, plan, pat-he-durations |  |
| `generations.nonHT.fields[L-STF].structure` | {"shortTrainingSymbols":10,"each":0.8} µs | pat-preamble-11a, plan, unpad-11a |  |
| `generations.nonHT.fields[L-LTF].duration` | 8 µs | pat-preamble-11a, ns3-ofdm, plan, mw-ppdu-structure |  |
| `generations.nonHT.fields[L-LTF].structure` | {"gi2":1.6,"longTrainingSymbols":2,"each":3.2} µs | pat-preamble-11a, plan, unpad-11a, mw-ppdu-structure |  |
| `generations.nonHT.fields[L-SIG].duration` | 4 µs | ns3-ofdm, keysight-ofdm, plan, pat-he-durations | one OFDM symbol, BPSK rate 1/2 |
| `generations.HT.ofdm.guardIntervals` | [0.8,0.4] µs | ns3-ht, plan, arxiv-1301 | 0.4 µs = short GI; short-GI rates are long-GI rates x 10/9 (= 4.0/3.6), arxiv-1301. |
| `generations.HT.toneplan.20.N_SD` | 52 | ns3-ht, plan, pat-vht-20 |  |
| `generations.HT.toneplan.40.N_SD` | 108 | ns3-ht, plan, tub-ofdm | ns-3: 108; TU Berlin: 114 non-null of 128 (= 108 + 6 pilots). |
| `generations.HT.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | ns3-ht, plan, mw-vhtltf | ns-3 mapping; MathWorks: one, two or four HT-LTFs. |
| `generations.HT.maxPsduOctets` | 65535 octet | plan, review-3 | 16-bit HT Length subfield of HT-SIG |
| `generations.HT.dataField.N_service` | 16 bit | ns3-ht, plan, vocal-11a | Same SERVICE field as Clause 17; ns-3 uses 16 bits for every OFDM-based PHY. |
| `generations.HT.dataField.N_tail` | 6 bit per encoder | ns3-ht, plan, mw-hdl-conv | 6 x N_ES (ns-3: equation 19-32) |
| `generations.HT.txtime.shortGiRounding` | true | ieee-07-2077, mw-duration, plan | HT-mixed: with short GI the data duration in TXTIME is rounded up to a multiple of 4 µs to align with legacy symbol boundaries. (ns-3 does not apply this rounding.) |
| `generations.HT.fields[HT-SIG].modulation` | ["QBPSK","QBPSK"] | paper-ht-detect, pat-format-detect, plan | BPSK rotated by 90° relative to L-SIG: lets a receiver recognise an HT-mixed PPDU right after L-SIG. |
| `generations.HT.fields[HT-STF].duration` | 4 µs | ns3-ht, plan, mw-ppdu-structure |  |
| `generations.HT.fields[HT-LTF].durationEach` | 4 µs | ns3-ht, plan, mw-vhtltf |  |
| `generations.VHT.ofdm.guardIntervals` | [0.8,0.4] µs | ns3-ht, plan, arxiv-1301 |  |
| `generations.VHT.toneplan.80.N_SD` | 234 | ns3-vht, plan, ibwave-11 |  |
| `generations.VHT.toneplan.160.N_SD` | 468 | ns3-vht, plan, tub-ofdm | ns-3: 468; TU Berlin: 484 non-null of 512 (= 468 + 16 pilots). |
| `generations.VHT.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | ns3-ht, plan, mw-vhtltf | Number of VHT-LTFs for N_STS 1-4 (ns-3 reuses the HT mapping). |
| `generations.VHT.encoders` | {"ndbpsPerEncoder":2160,"exceptions":[{"bw":80,"nss":7,"mcs":2,"N_ES":3},{"bw":80,"nss"… | review-2, ns3-vht, review-3 | N_ES = ceil(N_DBPS / 2160) plus the explicit overrides of ns-3 m_exceptionsMap (derived there from Tables 21-30..21-61 of 802.11-2016). Same as ns-3's 540 / 600 Mb/s rate rule (N_DBPS/4/540 = N_DBPS/3.6/600 = N_DBPS/2160). |
| `generations.VHT.maxApepOctets` | 1048575 octet | plan, review-3 | APEP_LENGTH upper bound (2^20 − 1) |
| `generations.VHT.dataField.N_service` | 16 bit | ns3-vht, plan, vocal-11a | Same SERVICE field as Clause 17; ns-3 uses 16 bits for every OFDM-based PHY. |
| `generations.VHT.dataField.N_tail` | 6 bit per encoder | ns3-vht, plan, mw-hdl-conv |  |
| `generations.VHT.txtime.shortGiRounding` | true | mw-duration, plan, review-3 | Same 4 µs alignment as HT-mixed expected for VHT (TXTIME eq. in 21.4.3 of 802.11-2016 per MathWorks); not confirmed. |
| `generations.VHT.fields[VHT-SIG-A].duration` | 8 µs | ns3-vht, plan, mw-ppdu-structure | VHT-SIG-A1 + VHT-SIG-A2 (two 4 µs symbols, MathWorks) |
| `generations.VHT.fields[VHT-SIG-A].modulation` | ["BPSK","QBPSK"] | pat-format-detect, plan, pat-vht-siga | VHT-SIG-A1 looks like a Non-HT/HT receiver would expect (BPSK); VHT-SIG-A2 is rotated by 90° (QBPSK), which identifies a VHT PPDU. |
| `generations.VHT.fields[VHT-STF].duration` | 4 µs | ns3-vht, plan, mw-ppdu-structure |  |
| `generations.VHT.fields[VHT-LTF].durationEach` | 4 µs | ns3-vht, plan, mw-vhtltf |  |
| `generations.VHT.fields[VHT-SIG-B].duration` | 4 µs | mw-vht-ppdu, ns3-vht, plan | Present in VHT SU PPDUs too (MathWorks: 17-bit VHT-SIG-B Length at 20 MHz SU). ns-3 models it for MU only. |
| `generations.HE.ofdm.subcarrierSpacingKHz` | 78.125 kHz | ns3-he, arith, plan, keysight-89601 | 1 / 12.8 µs = 20 MHz / 256 |
| `generations.HE.ofdm.guardIntervals` | [0.8,1.6,3.2] µs | ieee-16-1341, plan, silabs-gi-ltf, ns3-he |  |
| `generations.HE.toneplan.20.N_SD` | 234 | ns3-he, cts-ru, plan, ibwave-wifi6 |  |
| `generations.HE.toneplan.40.N_SD` | 468 | ns3-he, cts-ru, plan, ibwave-wifi6 |  |
| `generations.HE.toneplan.80.N_SD` | 980 | ns3-he, cts-ru, plan, ibwave-wifi6 |  |
| `generations.HE.toneplan.160.N_SD` | 1960 | ns3-he, plan, ibwave-wifi6 |  |
| `generations.HE.resourceUnits.tones` | {"26":{"data":24,"pilot":2},"52":{"data":48,"pilot":4},"106":{"data":102,"pilot":4},"24… | ns3-he, cts-ru, plan | ns-3 gives the data counts; pilot counts = RU size - data (and CTS 160 for 242/484/996). |
| `generations.HE.heLtf.allowedWithGi` | [{"ltf":"1x","gi":0.8},{"ltf":"2x","gi":0.8},{"ltf":"2x","gi":1.6},{"ltf":"4x","gi":3.2}] | keysight-he-su, silabs-gi-ltf | 4x HE-LTF + 0.8 µs GI also exists but only under extra conditions (DCM/STBC, or HE ER SU) — not offered here. |
| `generations.HE.codingRule` | {"bccMaxNss":4,"bccMaxMcs":9,"bccMaxRuTones":242} | ieee-18-1460, ieee-draft-d02 | BCC may only be used for MCS 0-9, N_SS <= 4 and RU <= 242 tones; LDPC otherwise. This app uses LDPC for every HE configuration (stated simplification). — clause as cited: P802.11ax D0.2 26.3.10.4 (draft numbering); the final 802.11ax-2021 clause number was not read |
| `generations.HE.dataField.N_service` | 16 bit | pat-padding, plan, ns3-he |  |
| `generations.HE.dataField.N_SD_short` | {"26":6,"52":12,"106":24,"242":60,"484":120,"996":240,"1992":492} | review-2, pat-nsd-short, review-3 | Looked up by RU size (1992 = 2 x 996-tone RU at 160 MHz); table supplied in review, consistent with the multi-RU patent. |
| `generations.HE.padding.equations` | ["N_Excess = mod(8·APEP_LENGTH + N_tail + N_service, N_DBPS)","N_SYM,init = ceil((8·APE… | pat-padding, plan, pat-padding-mu | Secondary: patents quoting draft text (m_STBC = 1 here). |
| `generations.HE.padding.aRange` | [1,2,3,4] | pat-pe, plan, pat-pre-post-fec | a = pre-FEC padding factor |
| `generations.HE.packetExtension.nominalPacketPadding` | [0,8,16] µs | pat-pe, plan, mw-hesuconfig |  |
| `generations.HE.packetExtension.T_PE` | {"0":[0,0,0,0],"8":[0,0,4,8],"16":[4,8,12,16]} µs | mw-hesuconfig, pat-pe, plan | Index = a − 1. Values confirmed in review from MathWorks wlanHESUConfig; the 16 µs row also matches the patents. |
| `generations.HE.txtime.formula` | TXTIME = 20 µs + T_HE-PREAMBLE + N_SYM·T_SYM + T_PE + SignalExtension; T_HE-PREAMBLE = … | pat-he-txtime, ieee-16-1411, plan |  |
| `generations.HE.fields[RL-SIG].duration` | 4 µs | ns3-he, plan, pat-he-durations | repeated L-SIG (ns-3: L-SIG + RL-SIG = 8 µs) |
| `generations.HE.fields[HE-SIG-A].duration` | 8 µs | ns3-he, plan, pat-he-durations | HE SU; 16 µs in an HE ER SU PPDU |
| `generations.HE.fields[HE-STF].duration` | 4 µs | ns3-he, plan, pat-he-durations, keysight-he-structure | HE SU/MU; 8 µs in an HE TB PPDU |
| `lsig.spoofRule` | {"legacyPreamble":20,"symbol":4,"octetsPerSymbol":3,"subtract":3} | review-2, ieee-13-1002, pat-lsig-length, warp-ref, review-3 | LENGTH = ceil((TXTIME − SignalExtension − 20) / 4) · 3 − 3 for HT and VHT; HE subtracts a further m (lsig.heM). The patent writes 3 as RATE/8·4 with RATE = 6 Mb/s. |
| `lsig.heM` | {"HE SU PPDU":2,"HE TB PPDU":2,"HE MU PPDU":1,"HE ER SU PPDU":1} | ieee-17-0398, pat-he-mod3, pat-lsig-length | HE PPDUs subtract m: LENGTH mod 3 = 1 marks HE SU / HE TB, LENGTH mod 3 = 2 marks HE MU / HE ER SU (mod 3 = 0: not HE). |
| `ldpc.shorteningPuncturing` | ["N_shrt = max(0, N_CW·L_LDPC·R − N_pld)","N_punc = max(0, N_CW·L_LDPC − N_avbits − N_s… | arxiv-ldpc, plan, pat-ldpc-extra |  |
| `interframe.signalExtension` | {"5":0,"6":0,"2.4":6} µs | ns3-ofdm, ns3-txdur, plan, pat-lsig-length | OFDM PPDUs in the 2.4 GHz band end with a 6 µs signal extension (no transmission) so that the receiver has time to finish decoding before SIFS. |
| `generations.VHT.exclusions[20 MHz, MCS 9, NSS 1/2/4]` | excluded | ieee-11-0577, ns3-vht, review-3 | supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read |
| `generations.VHT.exclusions[80 MHz, MCS 6, NSS 3]` | excluded | ieee-11-0577, ns3-vht, review-3 | supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read |
| `generations.VHT.exclusions[160 MHz, MCS 9, NSS 3]` | excluded | ieee-11-0577, ns3-vht, review-3 | supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read |

## Derived (30)

Arithmetic from standard-checked, supported or derived values; the inputs are listed.

| Entry | Value | Evidence | Note |
|---|---|---|---|
| `modulations.BPSK.N_BPSCS` | 1 | arith, plan | log2(2) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `modulations.QPSK.N_BPSCS` | 2 | arith, plan | log2(4) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `modulations.16-QAM.N_BPSCS` | 4 | arith, plan | log2(16) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `modulations.64-QAM.N_BPSCS` | 6 | arith, plan | log2(64) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `modulations.256-QAM.N_BPSCS` | 8 | arith, plan | log2(256) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `modulations.1024-QAM.N_BPSCS` | 10 | arith, plan | log2(1024) From: `definition: N_BPSCS = log2(M) for an M-point constellation`. |
| `legacy.subcarrierSpacingKHz` | 312.5 kHz | keysight-ofdm, arith, plan | 20 MHz / 64 From: `legacy.fftSizePer20MHz`, `definition: 20 MHz channel`. |
| `legacy.subchannelOffsets` | {"20":[0],"40":[-32,32],"80":[-96,-32,32,96],"160":[-224,-160,-96,-32,32,96,160,224]} | arith, keysight-nonht-dup | 20 MHz subchannel = 64 subcarriers of 312.5 kHz; centres at odd multiples of 32. From: `legacy.fftSizePer20MHz`. |
| `generations.nonHT.ofdm.subcarrierSpacingKHz` | 312.5 kHz | keysight-ofdm, arith, plan |  From: `generations.nonHT.ofdm.fftSize`, `definition: 20 MHz channel`. |
| `generations.nonHT.ofdm.T_DFT` | 3.2 µs | ns3-ofdm, arith, plan | 1 / 312.5 kHz; ns-3: symbol 4 µs = 3.2 + 0.8 From: `generations.nonHT.ofdm.subcarrierSpacingKHz`. |
| `generations.nonHT.maxPsduOctets` | 4095 octet | ieee-13-1002, mw-duration, plan, arith, review-3 | 2^12 − 1: largest value of the 12-bit LENGTH field From: `generations.nonHT.lsigBits`. |
| `generations.HT.ofdm.subcarrierSpacingKHz` | 312.5 kHz | arith, plan | 40 MHz / 128 = 20 MHz / 64 From: `legacy.subcarrierSpacingKHz`. |
| `generations.HT.ofdm.T_DFT` | 3.2 µs | ns3-ht, plan, arith | ns-3: symbol = 3200 ns + GI From: `generations.HT.ofdm.subcarrierSpacingKHz`. |
| `generations.HT.ofdm.fftSize` | {"20":64,"40":128} | arith, plan |  From: `generations.HT.ofdm.subcarrierSpacingKHz`, `definition: channel bandwidth`. |
| `generations.HT.toneplan.20.occupied` | [[-28,-1],[1,28]] | arith, plan, tub-ofdm | 52 data + 4 pilots = 56 = ±1..±28 with one DC null From: `generations.HT.toneplan.20.N_SD`, `definition: N_ST = 56 (52 data + 4 pilots, tub-ofdm) around one DC subcarrier`. |
| `generations.HT.toneplan.40.occupied` | [[-58,-2],[2,58]] | arith, plan, tub-ofdm | 108 + 6 = 114 = ±2..±58 with 3 DC nulls From: `generations.HT.toneplan.40.N_SD`, `definition: N_ST = 114 (108 + 6, tub-ofdm) around 3 DC subcarriers`. |
| `generations.HT.encoders` | {"ndbpsPerEncoder":1080} | review-2, ns3-ht, arith, review-3 | N_ES = 2 when N_DBPS > 1080 (= ceil(N_DBPS / 1080) for N_SS <= 4). ns-3's 320/350 Mb/s rate thresholds give the same N_ES for every HT MCS with N_SS <= 4. From: `mcsTable`, `generations.HT.toneplan.20.N_SD`, `generations.HT.toneplan.40.N_SD`. |
| `generations.HT.txtime.legacySymbol` | 4 µs | ns3-ht, plan, arith |  From: `generations.nonHT.ofdm.T_DFT`, `generations.nonHT.ofdm.guardIntervals`. |
| `generations.VHT.ofdm.subcarrierSpacingKHz` | 312.5 kHz | arith, plan |  From: `legacy.subcarrierSpacingKHz`. |
| `generations.VHT.ofdm.T_DFT` | 3.2 µs | ns3-ht, plan, arith |  From: `generations.VHT.ofdm.subcarrierSpacingKHz`. |
| `generations.VHT.ofdm.fftSize` | {"20":64,"40":128,"80":256,"160":512} | arith, plan |  From: `generations.VHT.ofdm.subcarrierSpacingKHz`, `definition: channel bandwidth`. |
| `generations.VHT.toneplan.80.occupied` | [[-122,-2],[2,122]] | arith, plan, ibwave-11 | 234 + 8 = 242 = ±2..±122 with 3 DC nulls From: `generations.VHT.toneplan.80.N_SD`, `definition: N_ST = 242 (234 + 8, ibwave-11) around 3 DC subcarriers`. |
| `generations.VHT.maxPsduOctets` | 4692480 octet | arith, review-3 | (5484 − 68) µs = 5416 µs; 5416 / 3.6 µs = 1504 short-GI symbols; 1504 x 24960 bits / 8 = 4,692,480 octets. From: `lsig.maxPpdu`, `generations.VHT.fields[VHT-SIG-B].duration`, `generations.VHT.ofdm.guardIntervals`, `definition: 68 µs VHT preamble with 8 VHT-LTFs; N_DBPS = 24960 at 160 MHz, 8 streams, 256-QAM 5/6`. |
| `generations.VHT.txtime.legacySymbol` | 4 µs | ns3-vht, plan, arith |  From: `generations.nonHT.ofdm.T_DFT`, `generations.nonHT.ofdm.guardIntervals`. |
| `generations.HE.ofdm.T_DFT` | 12.8 µs | ns3-he, plan, arith | ns-3: symbol = 12800 ns + GI From: `generations.HE.ofdm.subcarrierSpacingKHz`. |
| `generations.HE.ofdm.fftSize` | {"20":256,"40":512,"80":1024,"160":2048} | arith, plan |  From: `generations.HE.ofdm.subcarrierSpacingKHz`, `definition: channel bandwidth`. |
| `generations.HE.heLtf.symbolWithoutGi` | {"1x":3.2,"2x":6.4,"4x":12.8} µs | ieee-16-1341, plan, arith |  From: `generations.HE.ofdm.T_DFT`, `definition: an Nx HE-LTF symbol lasts N/4 of the data DFT period`. |
| `generations.HE.dataField.N_tail` | 0 bit | pat-padding, plan, arith | LDPC has no tail bits (N_tail = 6·N_ES only for BCC). From: `definition: LDPC is a block code; tail bits only terminate a convolutional (BCC) code`. |
| `lsig.maxLength` | 4095 octet | ieee-13-1002, mw-duration, plan, arith, review-3 | 2^12 − 1 (12-bit LENGTH) From: `generations.nonHT.lsigBits`. |
| `lsig.maxPpdu` | 5484 µs | ieee-13-1002, mw-duration, arith, review-3 | (4095 + 3) / 3 · 4 + 20 = 5484 µs: the longest duration an L-SIG LENGTH can announce. Checked for every generation (excluding the signal extension); the longest Non-HT PPDU, 4095 octets at 6 Mb/s, takes exactly 5484 µs. From: `lsig.spoofRule`, `lsig.maxLength`. |

## Check table — status of the published reference values

| PHY | BW | GI | N_SS | MCS / rate | Mb/s | Status | Evidence |
|---|---|---|---|---|---|---|---|
| 802.11a/g | 20 | 0.8 | 1 | BPSK 1/2 | 6 | supported | ns3-ofdm, vocal-11a, plan |
| 802.11a/g | 20 | 0.8 | 1 | 64-QAM 3/4 | 54 | supported | ns3-ofdm, vocal-11a, plan |
| 802.11n | 20 | 0.8 | 1 | MCS 0 | 6.5 | unverified | rs-rates, plan |
| 802.11n | 20 | 0.8 | 1 | MCS 7 | 65 | unverified | rs-rates, plan |
| 802.11n | 20 | 0.4 | 1 | MCS 7 | 72.2 | unverified | rs-rates, plan |
| 802.11n | 40 | 0.4 | 1 | MCS 7 | 150 | unverified | rs-rates, plan |
| 802.11n | 40 | 0.4 | 2 | MCS 7 | 300 | unverified | rs-rates, plan |
| 802.11ac | 20 | 0.8 | 1 | MCS 8 | 78 | unverified | rs-rates, plan |
| 802.11ac | 80 | 0.4 | 1 | MCS 9 | 433.3 | unverified | rs-rates, plan |
| 802.11ac | 160 | 0.4 | 1 | MCS 9 | 866.7 | unverified | rs-rates, plan |
| 802.11ax | 20 | 3.2 | 1 | MCS 0 | 7.3 | unverified | rs-rates, plan |
| 802.11ax | 20 | 0.8 | 1 | MCS 0 | 8.6 | unverified | rs-rates, plan |
| 802.11ax | 20 | 0.8 | 1 | MCS 11 | 143.4 | unverified | rs-rates, plan |
| 802.11ax | 80 | 0.8 | 1 | MCS 9 | 480.4 | unverified | rs-rates, plan |
| 802.11ax | 80 | 0.8 | 1 | MCS 11 | 600.4 | unverified | rs-rates, plan |
| 802.11ax | 160 | 0.8 | 2 | MCS 11 | 2401.9 | unverified | rs-rates, plan |

## Sources

- **plan** (cross-check) — Value listed in the pre-research plan (prior knowledge), written before searching
- **arith** (cross-check) — Arithmetic consequence of other verified values (shown in the note)
- **ns3-ofdm** (ns-3) — [ns-3 simulator, ofdm-phy.cc (cites IEEE 802.11-2016 cl. 17)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/non-ht/ofdm-phy.cc)
- **ns3-ht** (ns-3) — [ns-3 simulator, ht-phy.cc (cites IEEE 802.11-2016 cl. 19)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/ht/ht-phy.cc)
- **ns3-vht** (ns-3) — [ns-3 simulator, vht-phy.cc (cites IEEE 802.11-2016 cl. 21)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/vht/vht-phy.cc)
- **ns3-he** (ns-3) — [ns-3 simulator, he-phy.cc (cites IEEE 802.11ax-2021 cl. 27)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-phy.cc)
- **ns3-heru** (ns-3) — [ns-3 simulator, he-ru.cc (cites Tables 27-7..27-9 of IEEE 802.11ax-2021)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-ru.cc)
- **ns3-txdur** (ns-3) — [ns-3 simulator, tx-duration-test.cc (TXTIME test vectors)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/test/tx-duration-test.cc)
- **keysight-ofdm** (Keysight) — [Keysight 89600 VSA help: 802.11 OFDM Overview](https://helpfiles.keysight.com/csg/89600B/Webhelp/Subsystems/wlan-ofdm/content/ofdm_80211-overview.htm)
- **pat-legacy-sig** (US 10342042) — [US patent 10342042 (describes 802.11a SIG tone plan: -26..26, pilots ±7, ±21)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10342042)
- **pat-ht-vht-pilots** (US 10447448) — [US patent 10447448 family (HT 40 MHz and VHT 80/160 MHz pilot indices)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10447448)
- **pat-he-pilots-242** (USPTO (242-tone pilots)) — [USPTO patent full text returned by web search for the 242-tone RU pilot indices (exact patent number not recorded)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12294541)
- **pat-he-pilots-80** (US 12167410) — [US patents 12167410 and 12587328 — ±18-based pilot set; per review this is the 802.11be (EHT) design, NOT 802.11ax. Kept for reference, not used as evidence.](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12167410)
- **ieee-16-0623** (IEEE 11-16/0623) — [IEEE 802.11-16/0623r0, Table 26-32 (TGax draft numbering) — 80 MHz HE pilot indices. Supplied by the reviewer; not read by the author.](https://mentor.ieee.org/802.11/dcn/16/11-16-0623-00-00ax.docx)
- **mw-hesuconfig** (MathWorks) — [MathWorks WLAN Toolbox: wlanHESUConfig (nominal packet padding and PE durations). Supplied by the reviewer.](https://www.mathworks.com/help/wlan/ref/wlanhesuconfig.html)
- **review-2** (reviewer) — Second review pass (2026-10): VHT N_ES rule, N_SD,short table, L-SIG LENGTH rule — supplied by the reviewer
- **ieee-11-0577** (IEEE 11-11/0577) — IEEE 802.11-11/0577r0 — TGac draft list of excluded VHT-MCS / bandwidth / N_SS combinations (reviewer-cited; not read by the author)
- **ieee-13-1002** (IEEE 11-13/1002) — [IEEE 802.11-13/1002r1, SB2 clause 22 comment resolution — max TXTIME (4095 + 3) x 4/3 + 20 = 5484 µs](https://mentor.ieee.org/802.11/dcn/13/11-13-1002-01-00ac-sb2-clause-22-comment-resolution.docx)
- **pat-format-detect** (US 10637706) — [US patents 10637706 family, 9025428 (HT-SIG QBPSK; VHT-SIG-A1 BPSK and VHT-SIG-A2 QBPSK for format detection)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10637706)
- **paper-ht-detect** (AMEII 2016 paper) — [A Novel Method to Detect the Frame-Formats in 802.11n (AMEII 2016): HT-SIG rotated 90° relative to L-SIG](https://atlantis-press.com/proceedings/ameii-16/25854744)
- **pat-preamble-11a** (US 7852972) — [US patents 7852972 / 8923446 (802.11a training: 10 x 0.8 µs short + 1.6 µs GI + 2 x 3.2 µs long symbols, citing 802.11a-1999 17.3.3)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7852972)
- **pat-phase-rot** (US 10327172) — [US patent 10327172 family (per-20 MHz phase rotation: 40 MHz {1, j}; 80 MHz {1,-1,-1,-1})](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327172)
- **keysight-nonht-dup** (Keysight) — [Keysight help: 802.11ac Non-HT transmission (duplicate per 20 MHz with phase rotation)](https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ac%20NonHT%20Transmission.htm)
- **pat-padding** (US 2022/0053371) — [US 2022/0053371 A1 (Newracom) and US 12096275 — reproduce the 802.11ax pre-FEC padding equations](https://patents.google.com/patent/US20220053371A1/en)
- **pat-nsd-short** (US 2023/0261784) — [US 2023/0261784 A1 — extended N_SD,short table for multi-RU (484+242 -> 180, 996+484 -> 360)](https://patents.google.com/patent/US20230261784A1/en)
- **pat-pe** (US 2021/0360472) — [US 2021/0360472 A1 and US 12598022 — nominal packet padding 0/8/16 us, nominal T_PE 4/8/12/16 us](https://patents.google.com/patent/US20210360472A1/en)
- **pat-he-txtime** (US 11576207) — [US patent 11576207 — HE SU TXTIME = 20 + T_HE-PREAMBLE + N_SYM*T_SYM + T_PE + SignalExtension](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11576207)
- **ieee-16-1411** (IEEE 11-16/1411) — [IEEE 802.11-16/1411r1, TXTIME and RXTIME fixes (TGax draft era)](https://mentor.ieee.org/802.11/dcn/16/11-16-1411-01-00ax-txtime-and-rxtime-fixes.docx)
- **ieee-16-1341** (IEEE 11-16/1341) — [IEEE 802.11-16/1341r2, CR HE PHY introduction (LTF 3.2/6.4/12.8 us; GI 0.8/1.6/3.2 us)](https://mentor.ieee.org/802.11/dcn/16/11-16-1341-02-00ax-cr-he-phy-introduction-part-2.docx)
- **ieee-18-1460** (IEEE 11-18/1460) — [IEEE 802.11-18/1460r1, CR PHY capabilities part 2; and P802.11ax D0.2 cl. 26.3.10.4 (BCC limits)](https://mentor.ieee.org/802.11/dcn/18/11-18-1460-01-00ax-cr-phy-capabilities-part-2.docx)
- **ieee-07-2077** (IEEE 11-07/2077) — [IEEE 802.11-07/2077r2, LB97 PHY equations comment resolution (HT-mixed short GI TXTIME rounding)](https://mentor.ieee.org/802.11/dcn/07/11-07-2077-02-000n-lb97-phy-equations-comment-resolution.doc)
- **tgbe-ndbps** (IEEE TGbe reflector) — [IEEE 802.11 TGbe e-mail reflector: "Ndbps = floor(Ncbps*R)" (802.11be context)](https://grouper.ieee.org/groups/802/11/email/stds-802-11-tgbe/msg02428.html)
- **keysight-he-su** (Keysight) — [Keysight help: 802.11ax carrier settings SU / Ext SU (GI + HE-LTF combinations)](https://helpfiles.keysight.com/csg/n5186/Content/WLAN/802_11ax%20Carrier%20Settings%20SU%20Ext%20SU%20NDP.htm)
- **silabs-gi-ltf** (Silicon Labs) — [Silicon Labs WiFi91x docs: 802.11ax GI and LTF](https://docs.silabs.com/wifi91xrcp/2.10.1/wifi91xrcp-developers-guide-wifi-configuration/802-11-ax-gi-and-ltf)
- **mw-vht-ppdu** (MathWorks) — [MathWorks WLAN Toolbox: VHT PPDU Structure (VHT-SIG-B in SU and MU; cites 802.11-2016 21.3.8.3.6)](https://www.mathworks.com/help/wlan/gs/vht-ppdu-structure.html)
- **mw-duration** (MathWorks) — [MathWorks WLAN Toolbox: Packet Size and Duration Dependencies (TXTIME in 19.4.3 / 21.4.3 of 802.11-2016)](https://www.mathworks.com/help/wlan/gs/packet-size-and-duration-dependencies.html)
- **rs-rates** (Rohde & Schwarz) — [Rohde & Schwarz: Wi-Fi data rates (HT/VHT/HE MCS rate tables)](https://rs-nc.rohde-schwarz.com/en/products/wireless-lan/wi-fi-data-rates)
- **cts-ru** (CTS 160 (Clear To Send)) — [CTS 160: 802.11ax OFDMA Resource Units (data/pilot split per RU)](https://www.cleartosend.net/802-11ax-ofdma-resource-units/)
- **wiki-difs** (Wikipedia) — [Wikipedia: DCF Interframe Space (DIFS = SIFS + 2 x aSlotTime, per-PHY table)](https://en.wikipedia.org/wiki/DCF_Interframe_Space)
- **wiki-sifs** (Wikipedia) — [Wikipedia: Short Interframe Space (10 us at 2.4 GHz, 16 us at 5 GHz)](https://en.wikipedia.org/wiki/Short_Interframe_Space)
- **arxiv-ldpc** (arXiv 2003.11234) — [arXiv 2003.11234, Joint shortening and puncturing for structured LDPC codes (802.11n N_shrt, N_punc)](https://arxiv.org/pdf/2003.11234)
- **pat-ldpc-extra** (US 12212413) — [US patent 12212413 (LDPC extra-symbol condition with 0.1 and 1.2 factors, longer-codeword variant)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12212413)
- **review-3** (reviewer) — Third review pass (2026-10): status classification of selected entries, supplied by the reviewer
- **mw-ppdu-structure** (MathWorks) — [MathWorks WLAN Toolbox: Non-HT / HT / VHT / HE PPDU Structure pages (L-LTF 1.6 + 2 x 3.2 µs, HT-STF 4 µs, VHT-STF 4 µs, VHT-SIG-A two symbols)](https://www.mathworks.com/help/wlan/gs/ht-ppdu-structure.html)
- **mw-lsig** (MathWorks) — [MathWorks WLAN Toolbox: wlanLSIG / Non-HT PPDU Structure (24-bit L-SIG layout; RATE 1101 = 6 Mb/s in HT and VHT PPDUs)](https://www.mathworks.com/help/wlan/gs/non-ht-ppdu-structure.html)
- **pat-he-durations** (US 10327246) — [US patent 10327246 (L-STF 8 µs, L-SIG 4 µs, RL-SIG 4 µs, HE-SIG-A 2 or 4 symbols x 4 µs, HE-STF 4 or 8 µs)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327246)
- **keysight-he-structure** (Keysight) — [Keysight help: 802.11ax Signal Structure (HE TB PPDU HE-STF 8 µs; other fields as HE SU)](https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ax%20Signal%20Structure.htm)
- **pat-lsig-bits** (US 9882754) — [US patent 9882754 (L-SIG: 4-bit rate, reserved bit, 12-bit length, even parity, 6 tail bits)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9882754)
- **pat-lsig-length** (US 12150075) — [US patent 12150075: LENGTH = ceil((TXTIME − SignalExtension − 20)/4)·RATE/8·4 − 3 − m (m only for HE)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12150075)
- **warp-ref** (WARP project) — [WARP 802.11 reference design, calc_phy_preamble.m (open source): HT L-SIG at 6 Mb/s with LENGTH matching the HT duration](https://warpproject.org/trac/browser/ReferenceDesigns/w3_802.11/sysgen/wlan_phy_tx_pmd/util/calc_phy_preamble.m)
- **ieee-17-0398** (IEEE 11-17/0398) — [IEEE 802.11-17/0398r1, comment resolutions for HE preamble: L-SIG LENGTH mod 3 = 1 for HE SU / HE TB (m = 2), = 2 for HE MU / HE ER SU (m = 1)](https://mentor.ieee.org/802.11/dcn/17/11-17-0398-01-00ax-11ax-comment-resolutions-for-he-preamble.docx)
- **pat-he-mod3** (US 10374767) — [US patent 10374767 (L_LENGTH mod 3 indicates HE SU/TB vs HE MU/ER SU)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10374767)
- **ibwave-wifi6** (iBwave) — [iBwave Wireless Standards Wi-Fi 6 poster (HE data subcarriers 234/468/980/1960, pilots 8/16/16/32)](https://www.ibwave.com/storage/app/media/pdf/posters/iBwave-Wireless-Standards-Wi-Fi-6-Poster-1.pdf)
- **vocal-11a** (VOCAL Technologies) — [VOCAL Technologies 802.11a overview: rate table (6–54 Mb/s with modulation, R, N_CBPS, N_DBPS) and 16-bit SERVICE field](https://ftp.unpad.ac.id/orari/library/library-ref-eng/ref-eng-2/physical/wireless/80211a.pdf)
- **unpad-11a** (802.11a tutorial (unpad mirror)) — [802.11a tutorial document (ftp.unpad.ac.id): 10 short training symbols of 0.8 µs; 2 long symbols of 3.2 µs + 1.6 µs GI](https://ftp.unpad.ac.id/orari/library/library-ref-eng/ref-eng-2/physical/wireless/80211a.doc)
- **mw-hdl-conv** (MathWorks) — [MathWorks Wireless HDL Toolbox: Convolutional Encoder (Wi-Fi 802.11a/b/g/n/ac; terminated mode appends constraint length − 1 = 6 zero bits)](https://www.mathworks.com/help/wireless-hdl/ref/convolutionalencoder.html)
- **mw-vhtltf** (MathWorks) — [MathWorks WLAN Toolbox: wlanVHTLTF (N_VHT-LTF = 1, 2, 4, 4, 6, 6, 8, 8 for 1–8 streams; 4 µs per symbol) and wlanHTLTFDemodulate (HT-LTF 4 µs, one, two or four HT-LTFs)](https://www.mathworks.com/help/wlan/ref/wlanvhtltf.html)
- **arxiv-1301** (arXiv 1301.4691) — [arXiv 1301.4691, Cross-layer optimization for next generation Wi-Fi (VHT 20 MHz rates; short-GI rates = long-GI rates x 10/9)](https://arxiv.org/pdf/1301.4691)
- **pat-vht-siga** (US 8718191) — [US patent 8718191 (second VHT-SIG-A symbol rotated by 90° for VHT auto-detection)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8718191)
- **ieee-draft-d02** (IEEE P802.11ax D0.2) — IEEE P802.11ax D0.2 (2016) 26.3.10.4: BCC limited to N_SS <= 4, MCS 0-9; mandatory for RU <= 242 tones (draft text, as quoted by search results)
- **pat-padding-mu** (US 11245559) — [US patents 11245559 / 11689406 (padding and packet extension for DL MU: per-user pre-FEC padding with the common a-factor)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11245559)
- **pat-pre-post-fec** (US 12119929) — [US patent 12119929 (four pre-FEC padding boundaries; a-factor 1..4)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12119929)
- **keysight-89601** (Keysight) — [Keysight 89601 VSA technical overview (802.11ax subcarrier spacing 78.125 kHz)](https://docs.alltest.net/manual/Alltest-Agilent-Keysight-89601EVMC-TechnicalOverview-30607-.pdf)
- **pat-vht-20** (US 10461978) — [US patent 10461978 (802.11ac 20 MHz: 52 data + 4 pilot subcarriers)](https://patents.google.com/patent/US10461978)
- **ibwave-11** (iBwave) — [iBwave Wireless Standards 802.11 poster (802.11ac 80 MHz: 234 data, 8 pilot, 14 unused subcarriers)](https://www.ibwave.com/storage/app/media/pdf/posters/iBwave-Wireless-Standards-802.11.pdf)
- **tub-ofdm** (TU Berlin) — [TU Berlin telecom exercises (802.11ac non-null subcarriers: 56/64, 114/128, 242/256, 484/512)](https://platform.commit.tu-berlin.de/en/book/telecom/chapter/ch25/section/exercises)
