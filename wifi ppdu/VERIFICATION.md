# Wi-Fi PPDU explorer — verification status

Generated from `systems/wifi/standards-data.js` by `tools/verification-report.js`. Do not edit by hand.

No clause number was read in the IEEE document. Top-level clauses are those given in the project brief; sub-clause / table numbers are as cited by the listed secondary sources.

**Status rule:** *verified* = the exact value is stated by at least one public secondary source and matches an
independent check (a second source, arithmetic, or the pre-research plan). Everything else is *unverified*.

- Value entries: **115** — verified **93**, unverified **22**

## Unverified — please check against the standard

| Entry | Value | Evidence | Note |
|---|---|---|---|
| `legacy.phaseRotationDeg` | {"20":[0],"40":[0,90],"80":[0,180,180,180],"160":[0,180,180,180,0,180,180,180]} | pat-phase-rot, keysight-nonht-dup | 40 MHz {1, j} and 80 MHz {1,-1,-1,-1} are stated by a patent (verified level); the 160 MHz pattern (two 80 MHz patterns) was not found in a source, so the entry as a whole stays unverified. |
| `generations.nonHT.fields[L-STF].duration` | 8 µs | ns3-ofdm, plan | ns-3 confirms L-STF + L-LTF = 16 µs; the 8 + 8 split (10 x 0.8 µs short symbols) is not yet confirmed. |
| `generations.nonHT.fields[L-LTF].duration` | 8 µs | ns3-ofdm, plan | Expected 1.6 µs GI2 + 2 x 3.2 µs; only the 16 µs total is confirmed (ns-3). |
| `generations.HT.toneplan.20.pilots` | [-21,-7,7,21] | plan | same positions as Non-HT; no source found for HT 20 MHz specifically |
| `generations.HT.encoders` | {"maxMbpsPerEncoder":{"0.8":320,"0.4":350}} | ns3-ht | N_ES = ceil(rate / threshold). ns-3 derived these thresholds by observing where N_ES increments in Tables 19-27..19-41 (802.11-2016); they are not stated as a rule in the standard. |
| `generations.VHT.toneplan.160.occupied` | [[-250,-130],[-126,-6],[6,126],[130,250]] | plan | Two 80 MHz plans at ±128 (4 x 121 = 484 = 468 + 16): consistent arithmetic, but index ranges not found in a source. |
| `generations.VHT.encoders` | {"maxMbpsPerEncoder":{"0.8":540,"0.4":600},"exceptions":[{"bw":80,"nss":7,"mcs":2,"N_ES… | ns3-vht | ns-3 rule derived from Tables 21-30..21-61 (802.11-2016): N_ES = ceil(rate / threshold) plus exceptions. |
| `generations.VHT.txtime.shortGiRounding` | true | mw-duration, plan | Same 4 µs alignment as HT-mixed expected for VHT (TXTIME eq. in 21.4.3 of 802.11-2016 per MathWorks); not confirmed. |
| `generations.HE.toneplan.40.pilots` | [-238,-212,-170,-144,-104,-78,-36,-10,10,36,78,104,144,170,212,238] | plan, pat-he-pilots-80 | Equals the 80 MHz lower 484-tone RU pilot set from pat-he-pilots-80 shifted by +256 — a derivation, not a direct source. |
| `generations.HE.toneplan.160.pilots` | [-980,-912,-846,-778,-732,-664,-598,-530,-494,-426,-360,-292,-246,-178,-112,-44,44,112,… | pat-he-pilots-80 | Derived: the 80 MHz 996-tone pilot set shifted by ±512. |
| `generations.HE.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | plan | Assumed equal to the VHT mapping; ns-3 caps HE-LTFs at 8 but does not show the mapping. |
| `generations.HE.dataField.N_DBPS_rounding` | floor | tgbe-ndbps | N_DBPS = floor(N_CBPS · R). Stated on the TGbe (802.11be) reflector; consistent with published 600.4 Mbps (8166 / 13.6 µs) for 80 MHz MCS 11 — but R&S publishes 600.5. Check against the HE MCS tables. |
| `generations.HE.dataField.N_SD_short` | {"242":60,"484":120,"996":240,"1992":492} | pat-nsd-short, plan | Not found directly. Consistent with the multi-RU patent (484+242 -> 180, 996+484 -> 360) and with N_DBPS,short being an integer for every MCS. 1992 = 2 x 996-tone RU (160 MHz). |
| `generations.HE.packetExtension.T_PE` | {"0":[0,0,0,0],"8":[0,0,4,8],"16":[4,8,12,16]} µs | pat-pe, plan | The 16 µs row (4/8/12/16) matches the patents (nominal 16 µs, 4 µs decrement). The 0 and 8 µs rows were not found in a source. |
| `ldpc.codewordTable` | [{"maxAvbits":648,"N_CW":1,"L_long":1296,"L_short":648,"threshold":912},{"maxAvbits":12… | plan | Row i applies when N_avbits <= maxAvbits. L_long is used if N_avbits >= N_pld + threshold·(1 − R). Last row: N_CW = ceil(N_pld / (1944·R)). Codeword lengths 648/1296/1944 confirmed by patents; thresholds not found. |
| `ldpc.extraSymbolCondition` | {"puncturedFraction":0.1,"shorteningFactor":1.2} | pat-ldpc-extra, plan | Extra symbol (HT) / LDPC extra symbol segment (HE) if N_punc > 0.1·N_CW·L_LDPC·(1 − R) AND N_shrt < 1.2·N_punc·R/(1 − R). The patent uses this form for a longer-codeword variant. |
| `interframe.bands.6.SIFS` | 16 µs | plan | assumed same as 5 GHz |
| `interframe.bands.6.aSlotTime` | {"short":9} µs | plan |  |
| `interframe.ackFrameOctets` | 14 octet | plan |  |
| `generations.VHT.exclusions[80 MHz, MCS 6, NSS 3/7]` | excluded | ns3-vht | ns-3 excludes NSS 3 only; NSS 7 from memory. NSS 3 is also what the BCC divisibility rule (N_DBPS, N_CBPS divisible by N_ES) predicts — see tests. |
| `generations.VHT.exclusions[80 MHz, MCS 9, NSS 6]` | excluded | plan | from memory, not in ns-3 |
| `generations.VHT.exclusions[160 MHz, MCS 9, NSS 3]` | excluded | plan | from memory, not in ns-3; predicted by the BCC divisibility rule (N_CBPS = 11232 is not divisible by N_ES = 5) — see tests. |

## Verified (secondary sources)

| Entry | Value | Evidence | Note |
|---|---|---|---|
| `modulations.BPSK.N_BPSCS` | 1 | arith, plan | log2(2) |
| `modulations.QPSK.N_BPSCS` | 2 | arith, plan | log2(4) |
| `modulations.16-QAM.N_BPSCS` | 4 | arith, plan | log2(16) |
| `modulations.64-QAM.N_BPSCS` | 6 | arith, plan | log2(64) |
| `modulations.256-QAM.N_BPSCS` | 8 | arith, plan | log2(256) |
| `modulations.1024-QAM.N_BPSCS` | 10 | arith, plan | log2(1024) |
| `mcsTable` | [{"mcs":0,"mod":"BPSK","R":"1/2"},{"mcs":1,"mod":"QPSK","R":"1/2"},{"mcs":2,"mod":"QPSK… | rs-rates, plan | Cross-checked through the rate check table (rates reproduce the published HT/VHT/HE tables). |
| `legacy.subcarrierSpacingKHz` | 312.5 kHz | keysight-ofdm, arith, plan | 20 MHz / 64 |
| `legacy.fftSizePer20MHz` | 64 | keysight-ofdm, plan |  |
| `legacy.occupied` | [[-26,-1],[1,26]] | pat-legacy-sig, keysight-ofdm, plan |  |
| `legacy.pilots` | [-21,-7,7,21] | pat-legacy-sig, keysight-ofdm, plan |  |
| `legacy.subchannelOffsets` | {"20":[0],"40":[-32,32],"80":[-96,-32,32,96],"160":[-224,-160,-96,-32,32,96,160,224]} | arith, keysight-nonht-dup | 20 MHz subchannel = 64 subcarriers of 312.5 kHz; centres at odd multiples of 32. |
| `generations.nonHT.numerology.subcarrierSpacingKHz` | 312.5 kHz | keysight-ofdm, arith, plan |  |
| `generations.nonHT.numerology.T_DFT` | 3.2 µs | ns3-ofdm, arith, plan | 1 / 312.5 kHz; ns-3: symbol 4 µs = 3.2 + 0.8 |
| `generations.nonHT.numerology.guardIntervals` | [0.8] µs | ns3-ofdm, keysight-ofdm, plan |  |
| `generations.nonHT.numerology.fftSize` | {"20":64} | keysight-ofdm, plan |  |
| `generations.nonHT.toneplan.20.occupied` | [[-26,-1],[1,26]] | pat-legacy-sig, keysight-ofdm, plan |  |
| `generations.nonHT.toneplan.20.pilots` | [-21,-7,7,21] | pat-legacy-sig, keysight-ofdm, plan |  |
| `generations.nonHT.toneplan.20.N_SD` | 48 | ns3-ofdm, keysight-ofdm, plan |  |
| `generations.nonHT.rates` | [{"rateMbps":6,"mod":"BPSK","R":"1/2"},{"rateMbps":9,"mod":"BPSK","R":"3/4"},{"rateMbps… | ns3-ofdm, plan |  |
| `generations.nonHT.dataField.N_service` | 16 bit | ns3-ofdm, plan | SERVICE field |
| `generations.nonHT.dataField.N_tail` | 6 bit | ns3-ofdm, plan | BCC tail per encoder |
| `generations.nonHT.fields[L-SIG].duration` | 4 µs | ns3-ofdm, keysight-ofdm, plan | one OFDM symbol, BPSK rate 1/2 |
| `generations.HT.numerology.subcarrierSpacingKHz` | 312.5 kHz | arith, plan | 40 MHz / 128 = 20 MHz / 64 |
| `generations.HT.numerology.T_DFT` | 3.2 µs | ns3-ht, plan | ns-3: symbol = 3200 ns + GI |
| `generations.HT.numerology.guardIntervals` | [0.8,0.4] µs | ns3-ht, plan | 0.4 µs = short GI |
| `generations.HT.numerology.fftSize` | {"20":64,"40":128} | arith, plan |  |
| `generations.HT.toneplan.20.occupied` | [[-28,-1],[1,28]] | arith, plan | 52 data + 4 pilots = 56 = ±1..±28 with one DC null |
| `generations.HT.toneplan.20.N_SD` | 52 | ns3-ht, plan |  |
| `generations.HT.toneplan.40.occupied` | [[-58,-2],[2,58]] | arith, plan | 108 + 6 = 114 = ±2..±58 with 3 DC nulls |
| `generations.HT.toneplan.40.pilots` | [-53,-25,-11,11,25,53] | pat-ht-vht-pilots, plan |  |
| `generations.HT.toneplan.40.N_SD` | 108 | ns3-ht, plan |  |
| `generations.HT.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | ns3-ht, plan | Number of HT-LTFs for N_STS (no STBC, no extension LTFs). |
| `generations.HT.dataField.N_service` | 16 bit | ns3-ht, plan |  |
| `generations.HT.dataField.N_tail` | 6 bit per encoder | ns3-ht, plan | 6 x N_ES (ns-3: equation 19-32) |
| `generations.HT.txtime.shortGiRounding` | true | ieee-07-2077, mw-duration, plan | HT-mixed: with short GI the data duration in TXTIME is rounded up to a multiple of 4 µs to align with legacy symbol boundaries. (ns-3 does not apply this rounding.) |
| `generations.HT.txtime.legacySymbol` | 4 µs | ns3-ht, plan |  |
| `generations.HT.fields[HT-SIG].duration` | 8 µs | ns3-ht, plan | HT-SIG1 + HT-SIG2 |
| `generations.HT.fields[HT-STF].duration` | 4 µs | ns3-ht, plan |  |
| `generations.HT.fields[HT-LTF].durationEach` | 4 µs | ns3-ht, plan |  |
| `generations.VHT.numerology.subcarrierSpacingKHz` | 312.5 kHz | arith, plan |  |
| `generations.VHT.numerology.T_DFT` | 3.2 µs | ns3-ht, plan |  |
| `generations.VHT.numerology.guardIntervals` | [0.8,0.4] µs | ns3-ht, plan |  |
| `generations.VHT.numerology.fftSize` | {"20":64,"40":128,"80":256,"160":512} | arith, plan |  |
| `generations.VHT.toneplan.80.occupied` | [[-122,-2],[2,122]] | arith, plan | 234 + 8 = 242 = ±2..±122 with 3 DC nulls |
| `generations.VHT.toneplan.80.pilots` | [-103,-75,-39,-11,11,39,75,103] | pat-ht-vht-pilots, plan |  |
| `generations.VHT.toneplan.80.N_SD` | 234 | ns3-vht, plan |  |
| `generations.VHT.toneplan.160.pilots` | [-231,-203,-167,-139,-117,-89,-53,-25,25,53,89,117,139,167,203,231] | pat-ht-vht-pilots, plan |  |
| `generations.VHT.toneplan.160.N_SD` | 468 | ns3-vht, plan |  |
| `generations.VHT.N_LTF` | {"1":1,"2":2,"3":4,"4":4} | ns3-ht, plan | Number of VHT-LTFs for N_STS 1-4 (ns-3 reuses the HT mapping). |
| `generations.VHT.dataField.N_service` | 16 bit | ns3-vht, plan |  |
| `generations.VHT.dataField.N_tail` | 6 bit per encoder | ns3-vht, plan |  |
| `generations.VHT.txtime.legacySymbol` | 4 µs | ns3-vht, plan |  |
| `generations.VHT.fields[VHT-SIG-A].duration` | 8 µs | ns3-vht, plan | VHT-SIG-A1 + VHT-SIG-A2 |
| `generations.VHT.fields[VHT-STF].duration` | 4 µs | ns3-vht, plan |  |
| `generations.VHT.fields[VHT-LTF].durationEach` | 4 µs | ns3-vht, plan |  |
| `generations.VHT.fields[VHT-SIG-B].duration` | 4 µs | mw-vht-ppdu, ns3-vht, plan | Present in VHT SU PPDUs too (MathWorks: 17-bit VHT-SIG-B Length at 20 MHz SU). ns-3 models it for MU only. |
| `generations.HE.numerology.subcarrierSpacingKHz` | 78.125 kHz | ns3-he, arith, plan | 1 / 12.8 µs = 20 MHz / 256 |
| `generations.HE.numerology.T_DFT` | 12.8 µs | ns3-he, plan | ns-3: symbol = 12800 ns + GI |
| `generations.HE.numerology.guardIntervals` | [0.8,1.6,3.2] µs | ieee-16-1341, plan |  |
| `generations.HE.numerology.fftSize` | {"20":256,"40":512,"80":1024,"160":2048} | arith, plan |  |
| `generations.HE.toneplan.20.occupied` | [[-122,-2],[2,122]] | ns3-heru, plan |  — clause as cited: Table 27-7 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.20.pilots` | [-116,-90,-48,-22,22,48,90,116] | pat-he-pilots-242, plan |  |
| `generations.HE.toneplan.20.N_SD` | 234 | ns3-he, cts-ru, plan |  |
| `generations.HE.toneplan.40.occupied` | [[-244,-3],[3,244]] | ns3-heru, plan |  — clause as cited: Table 27-8 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.40.N_SD` | 468 | ns3-he, cts-ru, plan |  |
| `generations.HE.toneplan.80.occupied` | [[-500,-3],[3,500]] | ns3-heru, plan |  — clause as cited: Table 27-9 (802.11ax-2021, per ns-3) |
| `generations.HE.toneplan.80.pilots` | [-468,-400,-334,-266,-220,-152,-86,-18,18,86,152,220,266,334,400,468] | pat-he-pilots-80 | Two patents agree. The pre-research plan had ±24, ±92, ±158, ±226 for the inner pilots, which was wrong; the patents' values are used. Patents also discuss 802.11be — please check against 802.11ax. |
| `generations.HE.toneplan.80.N_SD` | 980 | ns3-he, cts-ru, plan |  |
| `generations.HE.toneplan.160.occupied` | [[-1012,-515],[-509,-12],[12,509],[515,1012]] | ns3-heru, plan |  |
| `generations.HE.toneplan.160.N_SD` | 1960 | ns3-he, plan |  |
| `generations.HE.resourceUnits.tones` | {"26":{"data":24,"pilot":2},"52":{"data":48,"pilot":4},"106":{"data":102,"pilot":4},"24… | ns3-he, cts-ru, plan | ns-3 gives the data counts; pilot counts = RU size - data (and CTS 160 for 242/484/996). |
| `generations.HE.resourceUnits.countPerBandwidth` | {"20":{"26":9,"52":4,"106":2,"242":1},"40":{"26":18,"52":8,"106":4,"242":2,"484":1},"80… | ns3-heru, plan |  |
| `generations.HE.heLtf.symbolWithoutGi` | {"1x":3.2,"2x":6.4,"4x":12.8} µs | ieee-16-1341, plan |  |
| `generations.HE.heLtf.allowedWithGi` | [{"ltf":"1x","gi":0.8},{"ltf":"2x","gi":0.8},{"ltf":"2x","gi":1.6},{"ltf":"4x","gi":3.2}] | keysight-he-su, silabs-gi-ltf | 4x HE-LTF + 0.8 µs GI also exists but only under extra conditions (DCM/STBC, or HE ER SU) — not offered here. |
| `generations.HE.codingRule` | {"bccMaxNss":4,"bccMaxMcs":9,"bccMaxRuTones":242} | ieee-18-1460 | BCC may only be used for MCS 0-9, N_SS <= 4 and RU <= 242 tones; LDPC otherwise. This app uses LDPC for every HE configuration (stated simplification). — clause as cited: P802.11ax D0.2 26.3.10.4 (draft numbering); the final 802.11ax-2021 clause number was not read |
| `generations.HE.dataField.N_service` | 16 bit | pat-padding, plan |  |
| `generations.HE.dataField.N_tail` | 0 bit | pat-padding, plan | LDPC has no tail bits (N_tail = 6·N_ES only for BCC). |
| `generations.HE.padding.equations` | ["N_Excess = mod(8·APEP_LENGTH + N_tail + N_service, N_DBPS)","N_SYM,init = ceil((8·APE… | pat-padding, plan | Secondary: patents quoting draft text (m_STBC = 1 here). |
| `generations.HE.padding.aRange` | [1,2,3,4] | pat-pe, plan | a = pre-FEC padding factor |
| `generations.HE.packetExtension.nominalPacketPadding` | [0,8,16] µs | pat-pe, plan |  |
| `generations.HE.txtime.formula` | TXTIME = 20 µs + T_HE-PREAMBLE + N_SYM·T_SYM + T_PE + SignalExtension; T_HE-PREAMBLE = … | pat-he-txtime, ieee-16-1411, plan |  |
| `generations.HE.fields[RL-SIG].duration` | 4 µs | ns3-he, plan | repeated L-SIG (ns-3: L-SIG + RL-SIG = 8 µs) |
| `generations.HE.fields[HE-SIG-A].duration` | 8 µs | ns3-he, plan | HE SU; 16 µs in an HE ER SU PPDU |
| `generations.HE.fields[HE-STF].duration` | 4 µs | ns3-he, plan | HE SU/MU; 8 µs in an HE TB PPDU |
| `ldpc.shorteningPuncturing` | ["N_shrt = max(0, N_CW·L_LDPC·R − N_pld)","N_punc = max(0, N_CW·L_LDPC − N_avbits − N_s… | arxiv-ldpc, plan |  |
| `interframe.bands.5.SIFS` | 16 µs | wiki-sifs, wiki-difs, plan |  |
| `interframe.bands.5.aSlotTime` | {"short":9} µs | wiki-difs, plan |  |
| `interframe.bands.2.4.SIFS` | 10 µs | wiki-sifs, wiki-difs, plan |  |
| `interframe.bands.2.4.aSlotTime` | {"short":9,"long":20} µs | wiki-difs, plan |  |
| `interframe.difsRule` | DIFS = SIFS + 2 × aSlotTime | wiki-difs, plan |  |
| `interframe.signalExtension` | {"5":0,"6":0,"2.4":6} µs | ns3-ofdm, ns3-txdur, plan | OFDM PPDUs in the 2.4 GHz band end with a 6 µs signal extension (no transmission) so that the receiver has time to finish decoding before SIFS. |
| `generations.VHT.exclusions[20 MHz, MCS 9, NSS 1/2/4/5/7/8]` | excluded | ns3-vht, plan | 20 MHz VHT-MCS 9 exists only for N_SS = 3 and 6 (ns-3 implements this for NSS <= 8). |

## Sources

- **plan** — Value listed in the pre-research plan (prior knowledge), written before searching
- **arith** — Arithmetic consequence of other verified values (shown in the note)
- **ns3-ofdm** — [ns-3 simulator, ofdm-phy.cc (cites IEEE 802.11-2016 cl. 17)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/non-ht/ofdm-phy.cc)
- **ns3-ht** — [ns-3 simulator, ht-phy.cc (cites IEEE 802.11-2016 cl. 19)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/ht/ht-phy.cc)
- **ns3-vht** — [ns-3 simulator, vht-phy.cc (cites IEEE 802.11-2016 cl. 21)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/vht/vht-phy.cc)
- **ns3-he** — [ns-3 simulator, he-phy.cc (cites IEEE 802.11ax-2021 cl. 27)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-phy.cc)
- **ns3-heru** — [ns-3 simulator, he-ru.cc (cites Tables 27-7..27-9 of IEEE 802.11ax-2021)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-ru.cc)
- **ns3-txdur** — [ns-3 simulator, tx-duration-test.cc (TXTIME test vectors)](https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/test/tx-duration-test.cc)
- **keysight-ofdm** — [Keysight 89600 VSA help: 802.11 OFDM Overview](https://helpfiles.keysight.com/csg/89600B/Webhelp/Subsystems/wlan-ofdm/content/ofdm_80211-overview.htm)
- **pat-legacy-sig** — [US patent 10342042 (describes 802.11a SIG tone plan: -26..26, pilots ±7, ±21)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10342042)
- **pat-ht-vht-pilots** — [US patent 10447448 family (HT 40 MHz and VHT 80/160 MHz pilot indices)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10447448)
- **pat-he-pilots-242** — [USPTO patent full text returned by web search for the 242-tone RU pilot indices (exact patent number not recorded)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12294541)
- **pat-he-pilots-80** — [US patents 12167410 and 12587328 (80 MHz 996-tone and 484-tone RU pilot indices; texts also cover 802.11be)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12167410)
- **pat-phase-rot** — [US patent 10327172 family (per-20 MHz phase rotation: 40 MHz {1, j}; 80 MHz {1,-1,-1,-1})](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327172)
- **keysight-nonht-dup** — [Keysight help: 802.11ac Non-HT transmission (duplicate per 20 MHz with phase rotation)](https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ac%20NonHT%20Transmission.htm)
- **pat-padding** — [US 2022/0053371 A1 (Newracom) and US 12096275 — reproduce the 802.11ax pre-FEC padding equations](https://patents.google.com/patent/US20220053371A1/en)
- **pat-nsd-short** — [US 2023/0261784 A1 — extended N_SD,short table for multi-RU (484+242 -> 180, 996+484 -> 360)](https://patents.google.com/patent/US20230261784A1/en)
- **pat-pe** — [US 2021/0360472 A1 and US 12598022 — nominal packet padding 0/8/16 us, nominal T_PE 4/8/12/16 us](https://patents.google.com/patent/US20210360472A1/en)
- **pat-he-txtime** — [US patent 11576207 — HE SU TXTIME = 20 + T_HE-PREAMBLE + N_SYM*T_SYM + T_PE + SignalExtension](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11576207)
- **ieee-16-1411** — [IEEE 802.11-16/1411r1, TXTIME and RXTIME fixes (TGax draft era)](https://mentor.ieee.org/802.11/dcn/16/11-16-1411-01-00ax-txtime-and-rxtime-fixes.docx)
- **ieee-16-1341** — [IEEE 802.11-16/1341r2, CR HE PHY introduction (LTF 3.2/6.4/12.8 us; GI 0.8/1.6/3.2 us)](https://mentor.ieee.org/802.11/dcn/16/11-16-1341-02-00ax-cr-he-phy-introduction-part-2.docx)
- **ieee-18-1460** — [IEEE 802.11-18/1460r1, CR PHY capabilities part 2; and P802.11ax D0.2 cl. 26.3.10.4 (BCC limits)](https://mentor.ieee.org/802.11/dcn/18/11-18-1460-01-00ax-cr-phy-capabilities-part-2.docx)
- **ieee-07-2077** — [IEEE 802.11-07/2077r2, LB97 PHY equations comment resolution (HT-mixed short GI TXTIME rounding)](https://mentor.ieee.org/802.11/dcn/07/11-07-2077-02-000n-lb97-phy-equations-comment-resolution.doc)
- **tgbe-ndbps** — [IEEE 802.11 TGbe e-mail reflector: "Ndbps = floor(Ncbps*R)" (802.11be context)](https://grouper.ieee.org/groups/802/11/email/stds-802-11-tgbe/msg02428.html)
- **keysight-he-su** — [Keysight help: 802.11ax carrier settings SU / Ext SU (GI + HE-LTF combinations)](https://helpfiles.keysight.com/csg/n5186/Content/WLAN/802_11ax%20Carrier%20Settings%20SU%20Ext%20SU%20NDP.htm)
- **silabs-gi-ltf** — [Silicon Labs WiFi91x docs: 802.11ax GI and LTF](https://docs.silabs.com/wifi91xrcp/2.10.1/wifi91xrcp-developers-guide-wifi-configuration/802-11-ax-gi-and-ltf)
- **mw-vht-ppdu** — [MathWorks WLAN Toolbox: VHT PPDU Structure (VHT-SIG-B in SU and MU; cites 802.11-2016 21.3.8.3.6)](https://www.mathworks.com/help/wlan/gs/vht-ppdu-structure.html)
- **mw-duration** — [MathWorks WLAN Toolbox: Packet Size and Duration Dependencies (TXTIME in 19.4.3 / 21.4.3 of 802.11-2016)](https://www.mathworks.com/help/wlan/gs/packet-size-and-duration-dependencies.html)
- **rs-rates** — [Rohde & Schwarz: Wi-Fi data rates (HT/VHT/HE MCS rate tables)](https://rs-nc.rohde-schwarz.com/en/products/wireless-lan/wi-fi-data-rates)
- **cts-ru** — [CTS 160: 802.11ax OFDMA Resource Units (data/pilot split per RU)](https://www.cleartosend.net/802-11ax-ofdma-resource-units/)
- **wiki-difs** — [Wikipedia: DCF Interframe Space (DIFS = SIFS + 2 x slot time, per-PHY table)](https://en.wikipedia.org/wiki/DCF_Interframe_Space)
- **wiki-sifs** — [Wikipedia: Short Interframe Space (10 us at 2.4 GHz, 16 us at 5 GHz)](https://en.wikipedia.org/wiki/Short_Interframe_Space)
- **arxiv-ldpc** — [arXiv 2003.11234, Joint shortening and puncturing for structured LDPC codes (802.11n N_shrt, N_punc)](https://arxiv.org/pdf/2003.11234)
- **pat-ldpc-extra** — [US patent 12212413 (LDPC extra-symbol condition with 0.1 and 1.2 factors, longer-codeword variant)](https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12212413)
