/* =============================================================================
 *  standards-data.js  —  every IEEE 802.11-derived number used by the Wi-Fi module
 * -----------------------------------------------------------------------------
 *  PURE DATA. No functions, no computed values: the calculators (calc.js) and the
 *  views derive everything from this object. A unit test fails if a function ever
 *  appears in here.
 *
 *  Value entries look like
 *      { value, unit?, status, evidence: [sourceId...], derivedFrom?: [...], clause?, note? }
 *
 *  status (only 'unverified' is shown as a warning in the UI)
 *    'standard-checked'  read in the standard text by the user
 *    'supported'         >= 2 independent public sources (open-source implementation, IEEE
 *                        submission, patent, vendor documentation; `origin` of each source in
 *                        `sources`); standard text not read. Entries the reviewer classified as
 *                        supported carry the source 'review-3'.
 *    'derived'           arithmetic from checked values; `derivedFrom` lists the inputs (data paths,
 *                        or a 'definition: ...' the arithmetic rests on). No input may be unverified.
 *    'unverified'        anything else — please check these against the standard.
 *  'plan' (my pre-research expectation) and 'arith' are cross-checks, never counted as sources.
 *
 *  clause
 *    The IEEE text itself could NOT be read: ieee.org / mentor.ieee.org are blocked
 *    from the environment this was built in. Clause / table numbers below are only
 *    those quoted by secondary sources (edition noted) — see meta.clauseNumbersRead.
 * ===========================================================================*/
var WIFI_STANDARDS = {
  meta: {
    title: 'IEEE 802.11 PHY parameters for the PPDU explorer',
    clauseNumbersRead: false,
    clauseNote: 'No clause number was read in the IEEE document. Top-level clauses are those given in the ' +
      'project brief; sub-clause / table numbers are as cited by the listed secondary sources.',
    verificationDate: '2026-10',
  },

  /* ---------------------------------------------------------------------------
   *  Documents. Top-level clauses as given in the project brief.
   * ------------------------------------------------------------------------- */
  documents: {
    'c17': { doc: 'IEEE Std 802.11-2020', clause: '17', title: 'Orthogonal frequency division multiplexing (OFDM) PHY specification' },
    'c18': { doc: 'IEEE Std 802.11-2020', clause: '18', title: 'Extended Rate PHY (ERP) specification', note: 'clause number unverified' },
    'c19': { doc: 'IEEE Std 802.11-2020', clause: '19', title: 'High-throughput (HT) PHY specification' },
    'c21': { doc: 'IEEE Std 802.11-2020', clause: '21', title: 'Very high throughput (VHT) PHY specification' },
    'c27': { doc: 'IEEE Std 802.11ax-2021 / IEEE Std 802.11-2024', clause: '27', title: 'High-efficiency (HE) PHY specification' },
  },

  /* ---------------------------------------------------------------------------
   *  Secondary sources used as evidence
   * ------------------------------------------------------------------------- */
  sources: {
    'plan': { title: 'Value listed in the pre-research plan (prior knowledge), written before searching', kind: 'cross-check', origin: 'cross-check' },
    'arith': { title: 'Arithmetic consequence of other verified values (shown in the note)', kind: 'cross-check', origin: 'cross-check' },
    'ns3-ofdm': { title: 'ns-3 simulator, ofdm-phy.cc (cites IEEE 802.11-2016 cl. 17)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/non-ht/ofdm-phy.cc', kind: 'code', origin: 'ns-3' },
    'ns3-ht': { title: 'ns-3 simulator, ht-phy.cc (cites IEEE 802.11-2016 cl. 19)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/ht/ht-phy.cc', kind: 'code', origin: 'ns-3' },
    'ns3-vht': { title: 'ns-3 simulator, vht-phy.cc (cites IEEE 802.11-2016 cl. 21)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/vht/vht-phy.cc', kind: 'code', origin: 'ns-3' },
    'ns3-he': { title: 'ns-3 simulator, he-phy.cc (cites IEEE 802.11ax-2021 cl. 27)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-phy.cc', kind: 'code', origin: 'ns-3' },
    'ns3-heru': { title: 'ns-3 simulator, he-ru.cc (cites Tables 27-7..27-9 of IEEE 802.11ax-2021)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-ru.cc', kind: 'code', origin: 'ns-3' },
    'ns3-txdur': { title: 'ns-3 simulator, tx-duration-test.cc (TXTIME test vectors)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/test/tx-duration-test.cc', kind: 'code', origin: 'ns-3' },
    'keysight-ofdm': { title: 'Keysight 89600 VSA help: 802.11 OFDM Overview', url: 'https://helpfiles.keysight.com/csg/89600B/Webhelp/Subsystems/wlan-ofdm/content/ofdm_80211-overview.htm', kind: 'vendor', origin: 'Keysight' },
    'pat-legacy-sig': { title: 'US patent 10342042 (describes 802.11a SIG tone plan: -26..26, pilots ±7, ±21)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10342042', kind: 'patent', origin: 'US 10342042' },
    'pat-ht-vht-pilots': { title: 'US patent 10447448 family (HT 40 MHz and VHT 80/160 MHz pilot indices)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10447448', kind: 'patent', origin: 'US 10447448' },
    'pat-he-pilots-242': { title: 'USPTO patent full text returned by web search for the 242-tone RU pilot indices (exact patent number not recorded)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12294541', kind: 'patent', origin: 'USPTO (242-tone pilots)' },
    'pat-he-pilots-80': { title: 'US patents 12167410 and 12587328 — ±18-based pilot set; per review this is the 802.11be (EHT) design, NOT 802.11ax. Kept for reference, not used as evidence.', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12167410', kind: 'patent', origin: 'US 12167410' },
    'ieee-16-0623': { title: 'IEEE 802.11-16/0623r0, Table 26-32 (TGax draft numbering) — 80 MHz HE pilot indices. Supplied by the reviewer; not read by the author.', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-0623-00-00ax.docx', kind: 'reviewer-cited', origin: 'IEEE 11-16/0623' },
    'mw-hesuconfig': { title: 'MathWorks WLAN Toolbox: wlanHESUConfig (nominal packet padding and PE durations). Supplied by the reviewer.', url: 'https://www.mathworks.com/help/wlan/ref/wlanhesuconfig.html', kind: 'reviewer-cited', origin: 'MathWorks' },
    'review-2': { title: 'Second review pass (2026-10): VHT N_ES rule, N_SD,short table, L-SIG LENGTH rule — supplied by the reviewer', kind: 'reviewer-cited', origin: 'reviewer' },
    'ieee-11-0577': { title: 'IEEE 802.11-11/0577r0 — TGac draft list of excluded VHT-MCS / bandwidth / N_SS combinations (reviewer-cited; not read by the author)', kind: 'reviewer-cited', origin: 'IEEE 11-11/0577' },
    'ieee-13-1002': { title: 'IEEE 802.11-13/1002r1, SB2 clause 22 comment resolution — max TXTIME (4095 + 3) x 4/3 + 20 = 5484 µs', url: 'https://mentor.ieee.org/802.11/dcn/13/11-13-1002-01-00ac-sb2-clause-22-comment-resolution.docx', kind: 'ieee-contribution', origin: 'IEEE 11-13/1002' },
    'pat-format-detect': { title: 'US patents 10637706 family, 9025428 (HT-SIG QBPSK; VHT-SIG-A1 BPSK and VHT-SIG-A2 QBPSK for format detection)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10637706', kind: 'patent', origin: 'US 10637706' },
    'paper-ht-detect': { title: 'A Novel Method to Detect the Frame-Formats in 802.11n (AMEII 2016): HT-SIG rotated 90° relative to L-SIG', url: 'https://atlantis-press.com/proceedings/ameii-16/25854744', kind: 'paper', origin: 'AMEII 2016 paper' },
    'pat-preamble-11a': { title: 'US patents 7852972 / 8923446 (802.11a training: 10 x 0.8 µs short + 1.6 µs GI + 2 x 3.2 µs long symbols, citing 802.11a-1999 17.3.3)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7852972', kind: 'patent', origin: 'US 7852972' },
    'pat-phase-rot': { title: 'US patent 10327172 family (per-20 MHz phase rotation: 40 MHz {1, j}; 80 MHz {1,-1,-1,-1})', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327172', kind: 'patent', origin: 'US 10327172' },
    'keysight-nonht-dup': { title: 'Keysight help: 802.11ac Non-HT transmission (duplicate per 20 MHz with phase rotation)', url: 'https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ac%20NonHT%20Transmission.htm', kind: 'vendor', origin: 'Keysight' },
    'pat-padding': { title: 'US 2022/0053371 A1 (Newracom) and US 12096275 — reproduce the 802.11ax pre-FEC padding equations', url: 'https://patents.google.com/patent/US20220053371A1/en', kind: 'patent', origin: 'US 2022/0053371' },
    'pat-nsd-short': { title: 'US 2023/0261784 A1 — extended N_SD,short table for multi-RU (484+242 -> 180, 996+484 -> 360)', url: 'https://patents.google.com/patent/US20230261784A1/en', kind: 'patent', origin: 'US 2023/0261784' },
    'pat-pe': { title: 'US 2021/0360472 A1 and US 12598022 — nominal packet padding 0/8/16 us, nominal T_PE 4/8/12/16 us', url: 'https://patents.google.com/patent/US20210360472A1/en', kind: 'patent', origin: 'US 2021/0360472' },
    'pat-he-txtime': { title: 'US patent 11576207 — HE SU TXTIME = 20 + T_HE-PREAMBLE + N_SYM*T_SYM + T_PE + SignalExtension', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11576207', kind: 'patent', origin: 'US 11576207' },
    'ieee-16-1411': { title: 'IEEE 802.11-16/1411r1, TXTIME and RXTIME fixes (TGax draft era)', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-1411-01-00ax-txtime-and-rxtime-fixes.docx', kind: 'ieee-contribution', origin: 'IEEE 11-16/1411' },
    'ieee-16-1341': { title: 'IEEE 802.11-16/1341r2, CR HE PHY introduction (LTF 3.2/6.4/12.8 us; GI 0.8/1.6/3.2 us)', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-1341-02-00ax-cr-he-phy-introduction-part-2.docx', kind: 'ieee-contribution', origin: 'IEEE 11-16/1341' },
    'ieee-18-1460': { title: 'IEEE 802.11-18/1460r1, CR PHY capabilities part 2; and P802.11ax D0.2 cl. 26.3.10.4 (BCC limits)', url: 'https://mentor.ieee.org/802.11/dcn/18/11-18-1460-01-00ax-cr-phy-capabilities-part-2.docx', kind: 'ieee-contribution', origin: 'IEEE 11-18/1460' },
    'ieee-07-2077': { title: 'IEEE 802.11-07/2077r2, LB97 PHY equations comment resolution (HT-mixed short GI TXTIME rounding)', url: 'https://mentor.ieee.org/802.11/dcn/07/11-07-2077-02-000n-lb97-phy-equations-comment-resolution.doc', kind: 'ieee-contribution', origin: 'IEEE 11-07/2077' },
    'tgbe-ndbps': { title: 'IEEE 802.11 TGbe e-mail reflector: "Ndbps = floor(Ncbps*R)" (802.11be context)', url: 'https://grouper.ieee.org/groups/802/11/email/stds-802-11-tgbe/msg02428.html', kind: 'ieee-reflector', origin: 'IEEE TGbe reflector' },
    'keysight-he-su': { title: 'Keysight help: 802.11ax carrier settings SU / Ext SU (GI + HE-LTF combinations)', url: 'https://helpfiles.keysight.com/csg/n5186/Content/WLAN/802_11ax%20Carrier%20Settings%20SU%20Ext%20SU%20NDP.htm', kind: 'vendor', origin: 'Keysight' },
    'silabs-gi-ltf': { title: 'Silicon Labs WiFi91x docs: 802.11ax GI and LTF', url: 'https://docs.silabs.com/wifi91xrcp/2.10.1/wifi91xrcp-developers-guide-wifi-configuration/802-11-ax-gi-and-ltf', kind: 'vendor', origin: 'Silicon Labs' },
    'mw-vht-ppdu': { title: 'MathWorks WLAN Toolbox: VHT PPDU Structure (VHT-SIG-B in SU and MU; cites 802.11-2016 21.3.8.3.6)', url: 'https://www.mathworks.com/help/wlan/gs/vht-ppdu-structure.html', kind: 'vendor', origin: 'MathWorks' },
    'mw-duration': { title: 'MathWorks WLAN Toolbox: Packet Size and Duration Dependencies (TXTIME in 19.4.3 / 21.4.3 of 802.11-2016)', url: 'https://www.mathworks.com/help/wlan/gs/packet-size-and-duration-dependencies.html', kind: 'vendor', origin: 'MathWorks' },
    'rs-rates': { title: 'Rohde & Schwarz: Wi-Fi data rates (HT/VHT/HE MCS rate tables)', url: 'https://rs-nc.rohde-schwarz.com/en/products/wireless-lan/wi-fi-data-rates', kind: 'vendor', origin: 'Rohde & Schwarz' },
    'cts-ru': { title: 'CTS 160: 802.11ax OFDMA Resource Units (data/pilot split per RU)', url: 'https://www.cleartosend.net/802-11ax-ofdma-resource-units/', kind: 'article', origin: 'CTS 160 (Clear To Send)' },
    'wiki-difs': { title: 'Wikipedia: DCF Interframe Space (DIFS = SIFS + 2 x aSlotTime, per-PHY table)', url: 'https://en.wikipedia.org/wiki/DCF_Interframe_Space', kind: 'encyclopedia', origin: 'Wikipedia' },
    'wiki-sifs': { title: 'Wikipedia: Short Interframe Space (10 us at 2.4 GHz, 16 us at 5 GHz)', url: 'https://en.wikipedia.org/wiki/Short_Interframe_Space', kind: 'encyclopedia', origin: 'Wikipedia' },
    'arxiv-ldpc': { title: 'arXiv 2003.11234, Joint shortening and puncturing for structured LDPC codes (802.11n N_shrt, N_punc)', url: 'https://arxiv.org/pdf/2003.11234', kind: 'paper', origin: 'arXiv 2003.11234' },
    'pat-ldpc-extra': { title: 'US patent 12212413 (LDPC extra-symbol condition with 0.1 and 1.2 factors, longer-codeword variant)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12212413', kind: 'patent', origin: 'US 12212413' },
    'review-3': { title: 'Third review pass (2026-10): status classification of selected entries, supplied by the reviewer', kind: 'reviewer-cited', origin: 'reviewer' },
    'mw-ppdu-structure': { title: 'MathWorks WLAN Toolbox: Non-HT / HT / VHT / HE PPDU Structure pages (L-LTF 1.6 + 2 x 3.2 µs, HT-STF 4 µs, VHT-STF 4 µs, VHT-SIG-A two symbols)', url: 'https://www.mathworks.com/help/wlan/gs/ht-ppdu-structure.html', kind: 'vendor', origin: 'MathWorks' },
    'mw-lsig': { title: 'MathWorks WLAN Toolbox: wlanLSIG / Non-HT PPDU Structure (24-bit L-SIG layout; RATE 1101 = 6 Mb/s in HT and VHT PPDUs)', url: 'https://www.mathworks.com/help/wlan/gs/non-ht-ppdu-structure.html', kind: 'vendor', origin: 'MathWorks' },
    'pat-he-durations': { title: 'US patent 10327246 (L-STF 8 µs, L-SIG 4 µs, RL-SIG 4 µs, HE-SIG-A 2 or 4 symbols x 4 µs, HE-STF 4 or 8 µs)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327246', kind: 'patent', origin: 'US 10327246' },
    'keysight-he-structure': { title: 'Keysight help: 802.11ax Signal Structure (HE TB PPDU HE-STF 8 µs; other fields as HE SU)', url: 'https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ax%20Signal%20Structure.htm', kind: 'vendor', origin: 'Keysight' },
    'pat-lsig-bits': { title: 'US patent 9882754 (L-SIG: 4-bit rate, reserved bit, 12-bit length, even parity, 6 tail bits)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/9882754', kind: 'patent', origin: 'US 9882754' },
    'pat-lsig-length': { title: 'US patent 12150075: LENGTH = ceil((TXTIME − SignalExtension − 20)/4)·RATE/8·4 − 3 − m (m only for HE)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12150075', kind: 'patent', origin: 'US 12150075' },
    'warp-ref': { title: 'WARP 802.11 reference design, calc_phy_preamble.m (open source): HT L-SIG at 6 Mb/s with LENGTH matching the HT duration', url: 'https://warpproject.org/trac/browser/ReferenceDesigns/w3_802.11/sysgen/wlan_phy_tx_pmd/util/calc_phy_preamble.m', kind: 'code', origin: 'WARP project' },
    'ieee-17-0398': { title: 'IEEE 802.11-17/0398r1, comment resolutions for HE preamble: L-SIG LENGTH mod 3 = 1 for HE SU / HE TB (m = 2), = 2 for HE MU / HE ER SU (m = 1)', url: 'https://mentor.ieee.org/802.11/dcn/17/11-17-0398-01-00ax-11ax-comment-resolutions-for-he-preamble.docx', kind: 'ieee-contribution', origin: 'IEEE 11-17/0398' },
    'pat-he-mod3': { title: 'US patent 10374767 (L_LENGTH mod 3 indicates HE SU/TB vs HE MU/ER SU)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10374767', kind: 'patent', origin: 'US 10374767' },
    'ibwave-wifi6': { title: 'iBwave Wireless Standards Wi-Fi 6 poster (HE data subcarriers 234/468/980/1960, pilots 8/16/16/32)', url: 'https://www.ibwave.com/storage/app/media/pdf/posters/iBwave-Wireless-Standards-Wi-Fi-6-Poster-1.pdf', kind: 'vendor', origin: 'iBwave' },
    'vocal-11a': { title: 'VOCAL Technologies 802.11a overview: rate table (6–54 Mb/s with modulation, R, N_CBPS, N_DBPS) and 16-bit SERVICE field', url: 'https://ftp.unpad.ac.id/orari/library/library-ref-eng/ref-eng-2/physical/wireless/80211a.pdf', kind: 'vendor', origin: 'VOCAL Technologies' },
    'unpad-11a': { title: '802.11a tutorial document (ftp.unpad.ac.id): 10 short training symbols of 0.8 µs; 2 long symbols of 3.2 µs + 1.6 µs GI', url: 'https://ftp.unpad.ac.id/orari/library/library-ref-eng/ref-eng-2/physical/wireless/80211a.doc', kind: 'article', origin: '802.11a tutorial (unpad mirror)' },
    'mw-hdl-conv': { title: 'MathWorks Wireless HDL Toolbox: Convolutional Encoder (Wi-Fi 802.11a/b/g/n/ac; terminated mode appends constraint length − 1 = 6 zero bits)', url: 'https://www.mathworks.com/help/wireless-hdl/ref/convolutionalencoder.html', kind: 'vendor', origin: 'MathWorks' },
    'mw-vhtltf': { title: 'MathWorks WLAN Toolbox: wlanVHTLTF (N_VHT-LTF = 1, 2, 4, 4, 6, 6, 8, 8 for 1–8 streams; 4 µs per symbol) and wlanHTLTFDemodulate (HT-LTF 4 µs, one, two or four HT-LTFs)', url: 'https://www.mathworks.com/help/wlan/ref/wlanvhtltf.html', kind: 'vendor', origin: 'MathWorks' },
    'arxiv-1301': { title: 'arXiv 1301.4691, Cross-layer optimization for next generation Wi-Fi (VHT 20 MHz rates; short-GI rates = long-GI rates x 10/9)', url: 'https://arxiv.org/pdf/1301.4691', kind: 'paper', origin: 'arXiv 1301.4691' },
    'pat-vht-siga': { title: 'US patent 8718191 (second VHT-SIG-A symbol rotated by 90° for VHT auto-detection)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/8718191', kind: 'patent', origin: 'US 8718191' },
    'ieee-draft-d02': { title: 'IEEE P802.11ax D0.2 (2016) 26.3.10.4: BCC limited to N_SS <= 4, MCS 0-9; mandatory for RU <= 242 tones (draft text, as quoted by search results)', kind: 'ieee-draft', origin: 'IEEE P802.11ax D0.2' },
    'pat-padding-mu': { title: 'US patents 11245559 / 11689406 (padding and packet extension for DL MU: per-user pre-FEC padding with the common a-factor)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11245559', kind: 'patent', origin: 'US 11245559' },
    'pat-pre-post-fec': { title: 'US patent 12119929 (four pre-FEC padding boundaries; a-factor 1..4)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12119929', kind: 'patent', origin: 'US 12119929' },
    'keysight-89601': { title: 'Keysight 89601 VSA technical overview (802.11ax subcarrier spacing 78.125 kHz)', url: 'https://docs.alltest.net/manual/Alltest-Agilent-Keysight-89601EVMC-TechnicalOverview-30607-.pdf', kind: 'vendor', origin: 'Keysight' },
    'pat-vht-20': { title: 'US patent 10461978 (802.11ac 20 MHz: 52 data + 4 pilot subcarriers)', url: 'https://patents.google.com/patent/US10461978', kind: 'patent', origin: 'US 10461978' },
    'ibwave-11': { title: 'iBwave Wireless Standards 802.11 poster (802.11ac 80 MHz: 234 data, 8 pilot, 14 unused subcarriers)', url: 'https://www.ibwave.com/storage/app/media/pdf/posters/iBwave-Wireless-Standards-802.11.pdf', kind: 'vendor', origin: 'iBwave' },
    'pat-scrambler-init': { title: 'US patent 12581474 (scrambler x^7 + x^4 + 1, seven shift registers; 7-bit scrambler initialization in the SERVICE field; all-ones state gives 00001110 11110010 11001001 …)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12581474', kind: 'patent', origin: 'US 12581474' },
    'arxiv-1212-4991': { title: 'arXiv 1212.4991, PHY-layer key distribution for 802.11g: scrambler LFSR G(x) = x^7 + x^4 + 1, period 127; first 7 SERVICE bits are zero so the receiver recovers the seed', url: 'https://arxiv.org/pdf/1212.4991', kind: 'paper', origin: 'arXiv 1212.4991' },
    'inet-ofdm': { title: 'INET framework for OMNeT++ (open source), bit-level 802.11 OFDM: Ieee80211ConvolutionalCode.cc (133/171, K = 7, puncturing matrices), Ieee80211OfdmInterleaver.cc (Clause 17 permutations), Qam16Modulation.cc', url: 'https://github.com/inet-framework/inet/tree/master/src/inet/physicallayer/wireless/ieee80211/bitlevel', kind: 'code', origin: 'INET framework' },
    'ubc-elex7860': { title: 'UBC ELEX 7860 course solution quoting 802.11a: rate-1/2 convolutional code, K = 7, g0 = 133 and g1 = 171 (octal), punctured to 2/3 and 3/4', url: 'https://people.ece.ubc.ca/~edc/7860.jan2022/midterm1sol.pdf', kind: 'course', origin: 'UBC course' },
    'pat-interleaver-11a': { title: 'US patents 6934901 / RE44848 (802.11a block interleaver: 16 columns, two permutations, s = max(N_BPSC/2, 1))', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/6934901', kind: 'patent', origin: 'US 6934901' },
    'pat-he-interleaver': { title: 'US patent 10110406 (HE BCC interleaver parameters per RU size; a search summary quotes N_COL 13 / N_ROW 9 for the 242-tone RU — conflicts with the plan value)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10110406', kind: 'patent', origin: 'US 10110406' },
    'gr-ieee80211': { title: 'gr-ieee802-11 (GNU Radio IEEE 802.11a/g/p transceiver, open source), lib/constellations_impl.cc: BPSK, QPSK, 16-QAM, 64-QAM point tables (index LSB = first bit)', url: 'https://github.com/bastibl/gr-ieee802-11/blob/maint-3.10/lib/constellations_impl.cc', kind: 'code', origin: 'gr-ieee802-11' },
    'tub-ofdm': { title: 'TU Berlin telecom exercises (802.11ac non-null subcarriers: 56/64, 114/128, 242/256, 484/512)', url: 'https://platform.commit.tu-berlin.de/en/book/telecom/chapter/ch25/section/exercises', kind: 'course', origin: 'TU Berlin' },
  },

  /* ---------------------------------------------------------------------------
   *  Constellations: N_BPSCS = number of coded bits per subcarrier per stream
   * ------------------------------------------------------------------------- */
  modulations: {
    'BPSK':     { N_BPSCS: { value: 1,  status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(2)' } },
    'QPSK':     { N_BPSCS: { value: 2,  status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(4)' } },
    '16-QAM':   { N_BPSCS: { value: 4,  status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(16)' } },
    '64-QAM':   { N_BPSCS: { value: 6,  status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(64)' } },
    '256-QAM':  { N_BPSCS: { value: 8,  status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(256)' } },
    '1024-QAM': { N_BPSCS: { value: 10, status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['definition: N_BPSCS = log2(M) for an M-point constellation'], note: 'log2(1024)' } },
  },

  /* MCS index -> (modulation, coding rate R). HT uses index 0-7 per spatial stream
   * (displayed MCS = 8*(N_SS-1) + m for equal modulation); VHT 0-9; HE 0-11. */
  mcsTable: {
    value: [
      { mcs: 0,  mod: 'BPSK',     R: '1/2' },
      { mcs: 1,  mod: 'QPSK',     R: '1/2' },
      { mcs: 2,  mod: 'QPSK',     R: '3/4' },
      { mcs: 3,  mod: '16-QAM',   R: '1/2' },
      { mcs: 4,  mod: '16-QAM',   R: '3/4' },
      { mcs: 5,  mod: '64-QAM',   R: '2/3' },
      { mcs: 6,  mod: '64-QAM',   R: '3/4' },
      { mcs: 7,  mod: '64-QAM',   R: '5/6' },
      { mcs: 8,  mod: '256-QAM',  R: '3/4' },
      { mcs: 9,  mod: '256-QAM',  R: '5/6' },
      { mcs: 10, mod: '1024-QAM', R: '3/4' },
      { mcs: 11, mod: '1024-QAM', R: '5/6' },
    ],
    status: 'supported', evidence: ['rs-rates', 'plan', 'ns3-vht'], note: 'ns-3 defines the same MCS -> (modulation, R) modes; its TXTIME vectors at MCS 0, 6-9, 11 depend on them and are reproduced by the tests. Rates reproduce the R&S tables.',
  },

  /* ---------------------------------------------------------------------------
   *  Legacy (pre-HT) tone plan used by L-STF/L-LTF/L-SIG and the following SIG
   *  fields (HT-SIG, VHT-SIG-A, RL-SIG, HE-SIG-A): one 20 MHz 64-point plan,
   *  replicated in every 20 MHz subchannel, each copy multiplied by a phase
   *  rotation to keep the peak-to-average power ratio down.
   * ------------------------------------------------------------------------- */
  legacy: {
    subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'derived', evidence: ['keysight-ofdm', 'arith', 'plan'], derivedFrom: ['legacy.fftSizePer20MHz', 'definition: 20 MHz channel'], note: '20 MHz / 64' },
    fftSizePer20MHz: { value: 64, status: 'supported', evidence: ['keysight-ofdm', 'plan', 'tub-ofdm'] },
    occupied: { value: [[-26, -1], [1, 26]], status: 'supported', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
    pilots: { value: [-21, -7, 7, 21], status: 'supported', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
    subchannelOffsets: {
      value: { 20: [0], 40: [-32, 32], 80: [-96, -32, 32, 96], 160: [-224, -160, -96, -32, 32, 96, 160, 224] },
      status: 'derived', evidence: ['arith', 'keysight-nonht-dup'], derivedFrom: ['legacy.fftSizePer20MHz'],
      note: '20 MHz subchannel = 64 subcarriers of 312.5 kHz; centres at odd multiples of 32.',
    },
    phaseRotationDeg: {
      value: { 20: [0], 40: [0, 90], 80: [0, 180, 180, 180], 160: [0, 180, 180, 180, 0, 180, 180, 180] },
      status: 'unverified', evidence: ['pat-phase-rot', 'keysight-nonht-dup'],
      note: '40 MHz {1, j} and 80 MHz {1,-1,-1,-1} are stated by a patent (verified level); the 160 MHz pattern ' +
        '(two 80 MHz patterns) was not found in a source, so the entry as a whole stays unverified.',
    },
  },

  /* ---------------------------------------------------------------------------
   *  PHY generations
   * ------------------------------------------------------------------------- */
  generations: {

    /* ====================== 802.11a / g : Non-HT ====================== */
    nonHT: {
      label: '802.11a/g', phyName: 'Non-HT (OFDM PHY; ERP-OFDM at 2.4 GHz)', ppduFormat: 'Non-HT PPDU', doc: 'c17',
      termNames: { T_DFT: 'T_FFT' }, // Clause 17 calls the IFFT/FFT period T_FFT; Clauses 19, 21 and 27 call it T_DFT
      bands: {
        '5':   { label: '5 GHz (802.11a, OFDM PHY)', doc: 'c17' },
        '2.4': { label: '2.4 GHz (802.11g, ERP-OFDM)', doc: 'c18' },
      },
      bandwidths: [20],
      spatialStreams: [1],
      coding: 'BCC',
      ofdm: {
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'derived', evidence: ['keysight-ofdm', 'arith', 'plan'], derivedFrom: ['generations.nonHT.ofdm.fftSize', 'definition: 20 MHz channel'] },
        T_DFT: { value: 3.2, unit: 'µs', status: 'derived', evidence: ['ns3-ofdm', 'arith', 'plan'], derivedFrom: ['generations.nonHT.ofdm.subcarrierSpacingKHz'], note: '1 / 312.5 kHz; ns-3: symbol 4 µs = 3.2 + 0.8' },
        guardIntervals: { value: [0.8], unit: 'µs', status: 'supported', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan'] },
        fftSize: { value: { 20: 64 }, status: 'supported', evidence: ['keysight-ofdm', 'plan', 'tub-ofdm'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-26, -1], [1, 26]], status: 'supported', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
          pilots: { value: [-21, -7, 7, 21], status: 'supported', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
          N_SD: { value: 48, status: 'supported', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan'] },
        },
      },
      /* 802.11a has no MCS index; the SIGNAL field carries a 4-bit RATE. */
      rates: {
        value: [
          { rateMbps: 6,  mod: 'BPSK',   R: '1/2' },
          { rateMbps: 9,  mod: 'BPSK',   R: '3/4' },
          { rateMbps: 12, mod: 'QPSK',   R: '1/2' },
          { rateMbps: 18, mod: 'QPSK',   R: '3/4' },
          { rateMbps: 24, mod: '16-QAM', R: '1/2' },
          { rateMbps: 36, mod: '16-QAM', R: '3/4' },
          { rateMbps: 48, mod: '64-QAM', R: '2/3' },
          { rateMbps: 54, mod: '64-QAM', R: '3/4' },
        ],
        status: 'supported', evidence: ['ns3-ofdm', 'plan', 'vocal-11a'],
      },
      lsigBits: {
        value: [{ name: 'RATE', bits: 4 }, { name: 'Reserved', bits: 1 }, { name: 'LENGTH', bits: 12 }, { name: 'Parity', bits: 1 }, { name: 'Tail', bits: 6 }],
        status: 'supported', evidence: ['plan', 'mw-lsig', 'pat-lsig-bits', 'review-3'], note: '24 bits = one BPSK rate-1/2 OFDM symbol (48 coded bits on 48 data subcarriers).',
      },
      maxPsduOctets: { value: 4095, unit: 'octet', status: 'derived', evidence: ['ieee-13-1002', 'mw-duration', 'plan', 'arith', 'review-3'], derivedFrom: ['generations.nonHT.lsigBits'], note: '2^12 − 1: largest value of the 12-bit LENGTH field' },
      payloadField: { name: 'LENGTH', term: 'LENGTH', label: 'PSDU length', max: 'maxPsduOctets' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'supported', evidence: ['ns3-ofdm', 'plan', 'vocal-11a'], note: 'SERVICE field' },
        N_tail: { value: 6, unit: 'bit', status: 'supported', evidence: ['ns3-ofdm', 'plan', 'mw-hdl-conv'], note: 'BCC tail per encoder' },
      },
      fields: [
        { name: 'L-STF', alias: 'short training field (Clause 17: PHY preamble, short training symbols)', toneplan: 'legacy',
          duration: { value: 8, unit: 'µs', status: 'supported', evidence: ['pat-preamble-11a', 'ns3-ofdm', 'plan', 'pat-he-durations'] },
          structure: { value: { shortTrainingSymbols: 10, each: 0.8 }, unit: 'µs', status: 'supported', evidence: ['pat-preamble-11a', 'plan', 'unpad-11a'] } },
        { name: 'L-LTF', alias: 'long training field (Clause 17: PHY preamble, long training symbols)', toneplan: 'legacy',
          duration: { value: 8, unit: 'µs', status: 'supported', evidence: ['pat-preamble-11a', 'ns3-ofdm', 'plan', 'mw-ppdu-structure'] },
          structure: { value: { gi2: 1.6, longTrainingSymbols: 2, each: 3.2 }, unit: 'µs', status: 'supported', evidence: ['pat-preamble-11a', 'plan', 'unpad-11a', 'mw-ppdu-structure'] } },
        { name: 'L-SIG', alias: 'SIGNAL field (Clause 17 name)', toneplan: 'legacy',
          duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan', 'pat-he-durations'], note: 'one OFDM symbol, BPSK rate 1/2' } },
        { name: 'Data', kind: 'data' },
      ],
    },

    /* ====================== 802.11n : HT ====================== */
    HT: {
      label: '802.11n', phyName: 'HT PHY', ppduFormat: 'HT-mixed format PPDU', doc: 'c19',
      bands: {
        '2.4': { label: '2.4 GHz', doc: 'c19' },
        '5':   { label: '5 GHz', doc: 'c19' },
      },
      bandwidths: [20, 40],
      spatialStreams: [1, 2, 3, 4],
      coding: 'BCC',
      ofdm: {
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['legacy.subcarrierSpacingKHz'], note: '40 MHz / 128 = 20 MHz / 64' },
        T_DFT: { value: 3.2, unit: 'µs', status: 'derived', evidence: ['ns3-ht', 'plan', 'arith'], derivedFrom: ['generations.HT.ofdm.subcarrierSpacingKHz'], note: 'ns-3: symbol = 3200 ns + GI' },
        guardIntervals: { value: [0.8, 0.4], unit: 'µs', status: 'supported', evidence: ['ns3-ht', 'plan', 'arxiv-1301'], note: '0.4 µs = short GI; short-GI rates are long-GI rates x 10/9 (= 4.0/3.6), arxiv-1301.' },
        fftSize: { value: { 20: 64, 40: 128 }, status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['generations.HT.ofdm.subcarrierSpacingKHz', 'definition: channel bandwidth'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-28, -1], [1, 28]], status: 'derived', evidence: ['arith', 'plan', 'tub-ofdm'], derivedFrom: ['generations.HT.toneplan.20.N_SD', 'definition: N_ST = 56 (52 data + 4 pilots, tub-ofdm) around one DC subcarrier'], note: '52 data + 4 pilots = 56 = ±1..±28 with one DC null' },
          pilots: { value: [-21, -7, 7, 21], status: 'unverified', evidence: ['plan'], note: 'same positions as Non-HT; no source found for HT 20 MHz specifically' },
          N_SD: { value: 52, status: 'supported', evidence: ['ns3-ht', 'plan', 'pat-vht-20'] },
        },
        40: {
          occupied: { value: [[-58, -2], [2, 58]], status: 'derived', evidence: ['arith', 'plan', 'tub-ofdm'], derivedFrom: ['generations.HT.toneplan.40.N_SD', 'definition: N_ST = 114 (108 + 6, tub-ofdm) around 3 DC subcarriers'], note: '108 + 6 = 114 = ±2..±58 with 3 DC nulls' },
          pilots: { value: [-53, -25, -11, 11, 25, 53], status: 'unverified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 108, status: 'supported', evidence: ['ns3-ht', 'plan', 'tub-ofdm'], note: 'ns-3: 108; TU Berlin: 114 non-null of 128 (= 108 + 6 pilots).' },
        },
      },
      maxMcsPerStream: 7,
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'supported', evidence: ['ns3-ht', 'plan', 'mw-vhtltf'], note: 'ns-3 mapping; MathWorks: one, two or four HT-LTFs.' },
      encoders: {
        value: { ndbpsPerEncoder: 1080 }, status: 'derived', evidence: ['review-2', 'ns3-ht', 'arith', 'review-3'], derivedFrom: ['mcsTable', 'generations.HT.toneplan.20.N_SD', 'generations.HT.toneplan.40.N_SD'],
        note: 'N_ES = 2 when N_DBPS > 1080 (= ceil(N_DBPS / 1080) for N_SS <= 4). ns-3\'s 320/350 Mb/s rate thresholds give the same N_ES for every HT MCS with N_SS <= 4.',
      },
      maxPsduOctets: { value: 65535, unit: 'octet', status: 'supported', evidence: ['plan', 'review-3'], note: '16-bit HT Length subfield of HT-SIG' },
      payloadField: { name: 'HT Length', term: 'HT Length', label: 'PSDU length', max: 'maxPsduOctets' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'supported', evidence: ['ns3-ht', 'plan', 'vocal-11a'], note: 'Same SERVICE field as Clause 17; ns-3 uses 16 bits for every OFDM-based PHY.' },
        N_tail: { value: 6, unit: 'bit per encoder', status: 'supported', evidence: ['ns3-ht', 'plan', 'mw-hdl-conv'], note: '6 x N_ES (ns-3: equation 19-32)' },
      },
      txtime: {
        shortGiRounding: { value: true, status: 'supported', evidence: ['ieee-07-2077', 'mw-duration', 'plan'],
          note: 'HT-mixed: with short GI the data duration in TXTIME is rounded up to a multiple of 4 µs to align ' +
            'with legacy symbol boundaries. (ns-3 does not apply this rounding.)' },
        legacySymbol: { value: 4, unit: 'µs', status: 'derived', evidence: ['ns3-ht', 'plan', 'arith'], derivedFrom: ['generations.nonHT.ofdm.T_DFT', 'generations.nonHT.ofdm.guardIntervals'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'HT-SIG', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'unverified', evidence: ['ns3-ht', 'plan'], note: 'HT-SIG1 + HT-SIG2' },
          modulation: { value: ['QBPSK', 'QBPSK'], status: 'supported', evidence: ['paper-ht-detect', 'pat-format-detect', 'plan'],
            note: 'BPSK rotated by 90° relative to L-SIG: lets a receiver recognise an HT-mixed PPDU right after L-SIG.' } },
        { name: 'HT-STF', duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-ht', 'plan', 'mw-ppdu-structure'] } },
        { name: 'HT-LTF', count: 'N_LTF', durationEach: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-ht', 'plan', 'mw-vhtltf'] } },
        { name: 'Data', kind: 'data' },
      ],
    },

    /* ====================== 802.11ac : VHT ====================== */
    VHT: {
      label: '802.11ac', phyName: 'VHT PHY', ppduFormat: 'VHT SU PPDU', doc: 'c21',
      bands: { '5': { label: '5 GHz', doc: 'c21' } },
      bandwidths: [20, 40, 80, 160],
      spatialStreams: [1, 2, 3, 4],
      coding: 'BCC',
      ofdm: {
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['legacy.subcarrierSpacingKHz'] },
        T_DFT: { value: 3.2, unit: 'µs', status: 'derived', evidence: ['ns3-ht', 'plan', 'arith'], derivedFrom: ['generations.VHT.ofdm.subcarrierSpacingKHz'] },
        guardIntervals: { value: [0.8, 0.4], unit: 'µs', status: 'supported', evidence: ['ns3-ht', 'plan', 'arxiv-1301'] },
        fftSize: { value: { 20: 64, 40: 128, 80: 256, 160: 512 }, status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['generations.VHT.ofdm.subcarrierSpacingKHz', 'definition: channel bandwidth'] },
      },
      toneplan: {
        20: { sameAs: 'HT' },
        40: { sameAs: 'HT' },
        80: {
          occupied: { value: [[-122, -2], [2, 122]], status: 'derived', evidence: ['arith', 'plan', 'ibwave-11'], derivedFrom: ['generations.VHT.toneplan.80.N_SD', 'definition: N_ST = 242 (234 + 8, ibwave-11) around 3 DC subcarriers'], note: '234 + 8 = 242 = ±2..±122 with 3 DC nulls' },
          pilots: { value: [-103, -75, -39, -11, 11, 39, 75, 103], status: 'unverified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 234, status: 'supported', evidence: ['ns3-vht', 'plan', 'ibwave-11'] },
        },
        160: {
          occupied: { value: [[-250, -130], [-126, -6], [6, 126], [130, 250]], status: 'unverified', evidence: ['plan'],
            note: 'Two 80 MHz plans at ±128 (4 x 121 = 484 = 468 + 16): consistent arithmetic, but index ranges not found in a source.' },
          pilots: { value: [-231, -203, -167, -139, -117, -89, -53, -25, 25, 53, 89, 117, 139, 167, 203, 231], status: 'unverified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 468, status: 'supported', evidence: ['ns3-vht', 'plan', 'tub-ofdm'], note: 'ns-3: 468; TU Berlin: 484 non-null of 512 (= 468 + 16 pilots).' },
        },
      },
      maxMcs: 9,
      /* MCS / bandwidth / N_SS combinations that the VHT MCS tables do not define */
      exclusions: [
        { bw: 20, mcs: 9, nss: [1, 2, 4], status: 'supported', evidence: ['ieee-11-0577', 'ns3-vht', 'review-3'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
        { bw: 80, mcs: 6, nss: [3], status: 'supported', evidence: ['ieee-11-0577', 'ns3-vht', 'review-3'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
        { bw: 160, mcs: 9, nss: [3], status: 'supported', evidence: ['ieee-11-0577', 'ns3-vht', 'review-3'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
      ],
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'supported', evidence: ['ns3-ht', 'plan', 'mw-vhtltf'],
        note: 'Number of VHT-LTFs for N_STS 1-4 (ns-3 reuses the HT mapping).' },
      encoders: {
        value: {
          ndbpsPerEncoder: 2160,
          exceptions: [
            { bw: 80, nss: 7, mcs: 2, N_ES: 3 }, { bw: 80, nss: 7, mcs: 7, N_ES: 6 }, { bw: 80, nss: 7, mcs: 8, N_ES: 6 },
            { bw: 80, nss: 8, mcs: 7, N_ES: 6 }, { bw: 160, nss: 4, mcs: 7, N_ES: 6 }, { bw: 160, nss: 5, mcs: 8, N_ES: 8 },
            { bw: 160, nss: 6, mcs: 7, N_ES: 8 }, { bw: 160, nss: 7, mcs: 3, N_ES: 4 }, { bw: 160, nss: 7, mcs: 4, N_ES: 6 },
            { bw: 160, nss: 7, mcs: 5, N_ES: 7 }, { bw: 160, nss: 7, mcs: 7, N_ES: 9 }, { bw: 160, nss: 7, mcs: 8, N_ES: 12 },
            { bw: 160, nss: 7, mcs: 9, N_ES: 12 },
          ],
        },
        status: 'supported', evidence: ['review-2', 'ns3-vht', 'review-3'],
        note: 'N_ES = ceil(N_DBPS / 2160) plus the explicit overrides of ns-3 m_exceptionsMap (derived there from Tables 21-30..21-61 of 802.11-2016). Same as ns-3\'s 540 / 600 Mb/s rate rule (N_DBPS/4/540 = N_DBPS/3.6/600 = N_DBPS/2160).',
      },
      maxApepOctets: { value: 1048575, unit: 'octet', status: 'supported', evidence: ['plan', 'review-3'], note: 'APEP_LENGTH upper bound (2^20 − 1)' },
      maxPsduOctets: { value: 4692480, unit: 'octet', status: 'derived', evidence: ['arith', 'review-3'],
        derivedFrom: ['lsig.maxPpdu', 'generations.VHT.fields[VHT-SIG-B].duration', 'generations.VHT.ofdm.guardIntervals',
          'definition: 68 µs VHT preamble with 8 VHT-LTFs; N_DBPS = 24960 at 160 MHz, 8 streams, 256-QAM 5/6'],
        note: '(5484 − 68) µs = 5416 µs; 5416 / 3.6 µs = 1504 short-GI symbols; 1504 x 24960 bits / 8 = 4,692,480 octets.' },
      payloadField: { name: 'APEP_LENGTH', term: 'APEP_LENGTH', label: 'APEP length', max: 'maxApepOctets' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'supported', evidence: ['ns3-vht', 'plan', 'vocal-11a'], note: 'Same SERVICE field as Clause 17; ns-3 uses 16 bits for every OFDM-based PHY.' },
        N_tail: { value: 6, unit: 'bit per encoder', status: 'supported', evidence: ['ns3-vht', 'plan', 'mw-hdl-conv'] },
      },
      txtime: {
        shortGiRounding: { value: true, status: 'supported', evidence: ['mw-duration', 'plan', 'review-3'],
          note: 'Same 4 µs alignment as HT-mixed expected for VHT (TXTIME eq. in 21.4.3 of 802.11-2016 per MathWorks); not confirmed.' },
        legacySymbol: { value: 4, unit: 'µs', status: 'derived', evidence: ['ns3-vht', 'plan', 'arith'], derivedFrom: ['generations.nonHT.ofdm.T_DFT', 'generations.nonHT.ofdm.guardIntervals'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'VHT-SIG-A', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'supported', evidence: ['ns3-vht', 'plan', 'mw-ppdu-structure'], note: 'VHT-SIG-A1 + VHT-SIG-A2 (two 4 µs symbols, MathWorks)' },
          modulation: { value: ['BPSK', 'QBPSK'], status: 'supported', evidence: ['pat-format-detect', 'plan', 'pat-vht-siga'],
            note: 'VHT-SIG-A1 looks like a Non-HT/HT receiver would expect (BPSK); VHT-SIG-A2 is rotated by 90° (QBPSK), which identifies a VHT PPDU.' } },
        { name: 'VHT-STF', duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-vht', 'plan', 'mw-ppdu-structure'] } },
        { name: 'VHT-LTF', count: 'N_LTF', durationEach: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-vht', 'plan', 'mw-vhtltf'] } },
        { name: 'VHT-SIG-B',
          duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['mw-vht-ppdu', 'ns3-vht', 'plan'],
            note: 'Present in VHT SU PPDUs too (MathWorks: 17-bit VHT-SIG-B Length at 20 MHz SU). ns-3 models it for MU only.' } },
        { name: 'Data', kind: 'data' },
      ],
    },

    /* ====================== 802.11ax : HE ====================== */
    HE: {
      label: '802.11ax', phyName: 'HE PHY', ppduFormat: 'HE SU PPDU', doc: 'c27',
      bands: {
        '2.4': { label: '2.4 GHz', doc: 'c27', bandwidths: [20, 40] },
        '5':   { label: '5 GHz', doc: 'c27' },
        '6':   { label: '6 GHz', doc: 'c27' },
      },
      bandwidths: [20, 40, 80, 160],
      spatialStreams: [1, 2, 3, 4],
      coding: 'LDPC',
      payloadField: { name: 'APEP_LENGTH', term: 'APEP_LENGTH', label: 'APEP length', max: null },
      ofdm: {
        subcarrierSpacingKHz: { value: 78.125, unit: 'kHz', status: 'supported', evidence: ['ns3-he', 'arith', 'plan', 'keysight-89601'], note: '1 / 12.8 µs = 20 MHz / 256' },
        T_DFT: { value: 12.8, unit: 'µs', status: 'derived', evidence: ['ns3-he', 'plan', 'arith'], derivedFrom: ['generations.HE.ofdm.subcarrierSpacingKHz'], note: 'ns-3: symbol = 12800 ns + GI' },
        guardIntervals: { value: [0.8, 1.6, 3.2], unit: 'µs', status: 'supported', evidence: ['ieee-16-1341', 'plan', 'silabs-gi-ltf', 'ns3-he'] },
        fftSize: { value: { 20: 256, 40: 512, 80: 1024, 160: 2048 }, status: 'derived', evidence: ['arith', 'plan'], derivedFrom: ['generations.HE.ofdm.subcarrierSpacingKHz', 'definition: channel bandwidth'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-122, -2], [2, 122]], status: 'unverified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-7 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-116, -90, -48, -22, 22, 48, 90, 116], status: 'unverified', evidence: ['pat-he-pilots-242', 'plan'],
            note: 'Stated by one patent; marked unverified in review (not to be derived from the 80 MHz set).' },
          N_SD: { value: 234, status: 'supported', evidence: ['ns3-he', 'cts-ru', 'plan', 'ibwave-wifi6'] },
        },
        40: {
          occupied: { value: [[-244, -3], [3, 244]], status: 'unverified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-8 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-238, -212, -170, -144, -104, -78, -36, -10, 10, 36, 78, 104, 144, 170, 212, 238], status: 'unverified', evidence: ['plan'],
            note: 'Value from the pre-research plan only; no source found.' },
          N_SD: { value: 468, status: 'supported', evidence: ['ns3-he', 'cts-ru', 'plan', 'ibwave-wifi6'] },
        },
        80: {
          occupied: { value: [[-500, -3], [3, 500]], status: 'unverified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-9 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-468, -400, -334, -266, -226, -158, -92, -24, 24, 92, 158, 226, 266, 334, 400, 468], status: 'unverified', evidence: ['ieee-16-0623', 'plan'],
            clause: 'Table 26-32 of TGax draft (per IEEE 11-16/0623r0, reviewer-cited)',
            note: 'Corrected in review. The ±18-based set found in patents is the 802.11be design.' },
          N_SD: { value: 980, status: 'supported', evidence: ['ns3-he', 'cts-ru', 'plan', 'ibwave-wifi6'] },
        },
        160: {
          occupied: { value: [[-1012, -515], [-509, -12], [12, 509], [515, 1012]], status: 'unverified', evidence: ['ns3-heru', 'plan'] },
          pilots: { value: [-980, -912, -846, -778, -738, -670, -604, -536, -488, -420, -354, -286, -246, -178, -112, -44,
                             44, 112, 178, 246, 286, 354, 420, 488, 536, 604, 670, 738, 778, 846, 912, 980],
            status: 'unverified', evidence: ['ieee-16-0623'], note: 'The 80 MHz set shifted by −512 and +512 (rule supplied in review).' },
          N_SD: { value: 1960, status: 'supported', evidence: ['ns3-he', 'plan', 'ibwave-wifi6'] },
        },
      },
      maxMcs: 11,
      /* RU = resource unit, used for OFDMA in HE MU and HE TB PPDUs (illustration only — HE SU uses the full band) */
      resourceUnits: {
        tones: {
          value: { 26: { data: 24, pilot: 2 }, 52: { data: 48, pilot: 4 }, 106: { data: 102, pilot: 4 },
                   242: { data: 234, pilot: 8 }, 484: { data: 468, pilot: 16 }, 996: { data: 980, pilot: 16 } },
          status: 'supported', evidence: ['ns3-he', 'cts-ru', 'plan'],
          note: 'ns-3 gives the data counts; pilot counts = RU size - data (and CTS 160 for 242/484/996).',
        },
        countPerBandwidth: {
          value: { 20: { 26: 9, 52: 4, 106: 2, 242: 1 },
                   40: { 26: 18, 52: 8, 106: 4, 242: 2, 484: 1 },
                   80: { 26: 37, 52: 16, 106: 8, 242: 4, 484: 2, 996: 1 },
                   160: { 26: 74, 52: 32, 106: 16, 242: 8, 484: 4, 996: 2 } },
          status: 'unverified', evidence: ['ns3-heru', 'plan'],
        },
        /* Subcarrier ranges [first, last] of every RU, in order of RU index. A 26-tone RU in the centre
         * of a 20 or 80 MHz channel is split around DC. Tones between RUs stay empty in OFDMA. */
        subcarrierRanges: {
          value: {
            20: {
              26: [
                [[-121, -96]], [[-95, -70]], [[-68, -43]], [[-42, -17]], [[-16, -4], [4, 16]], [[17, 42]],
                [[43, 68]], [[70, 95]], [[96, 121]],
              ],
              52: [[[-121, -70]], [[-68, -17]], [[17, 68]], [[70, 121]]],
              106: [[[-122, -17]], [[17, 122]]],
              242: [[[-122, -2], [2, 122]]],
            },
            40: {
              26: [
                [[-243, -218]], [[-217, -192]], [[-189, -164]], [[-163, -138]], [[-136, -111]], [[-109, -84]],
                [[-83, -58]], [[-55, -30]], [[-29, -4]], [[4, 29]], [[30, 55]], [[58, 83]],
                [[84, 109]], [[111, 136]], [[138, 163]], [[164, 189]], [[192, 217]], [[218, 243]],
              ],
              52: [
                [[-243, -192]], [[-189, -138]], [[-109, -58]], [[-55, -4]], [[4, 55]], [[58, 109]],
                [[138, 189]], [[192, 243]],
              ],
              106: [[[-243, -138]], [[-109, -4]], [[4, 109]], [[138, 243]]],
              242: [[[-244, -3]], [[3, 244]]],
              484: [[[-244, -3], [3, 244]]],
            },
            80: {
              26: [
                [[-499, -474]], [[-473, -448]], [[-445, -420]], [[-419, -394]], [[-392, -367]], [[-365, -340]],
                [[-339, -314]], [[-311, -286]], [[-285, -260]], [[-257, -232]], [[-231, -206]], [[-203, -178]],
                [[-177, -152]], [[-150, -125]], [[-123, -98]], [[-97, -72]], [[-69, -44]], [[-43, -18]],
                [[-16, -4], [4, 16]], [[18, 43]], [[44, 69]], [[72, 97]], [[98, 123]], [[125, 150]],
                [[152, 177]], [[178, 203]], [[206, 231]], [[232, 257]], [[260, 285]], [[286, 311]],
                [[314, 339]], [[340, 365]], [[367, 392]], [[394, 419]], [[420, 445]], [[448, 473]],
                [[474, 499]],
              ],
              52: [
                [[-499, -448]], [[-445, -394]], [[-365, -314]], [[-311, -260]], [[-257, -206]], [[-203, -152]],
                [[-123, -72]], [[-69, -18]], [[18, 69]], [[72, 123]], [[152, 203]], [[206, 257]],
                [[260, 311]], [[314, 365]], [[394, 445]], [[448, 499]],
              ],
              106: [
                [[-499, -394]], [[-365, -260]], [[-257, -152]], [[-123, -18]], [[18, 123]], [[152, 257]],
                [[260, 365]], [[394, 499]],
              ],
              242: [[[-500, -259]], [[-258, -17]], [[17, 258]], [[259, 500]]],
              484: [[[-500, -17]], [[17, 500]]],
              996: [[[-500, -3], [3, 500]]],
            },
          },
          status: 'unverified', evidence: ['ns3-heru'],
          note: 'Parsed from ns-3 he-ru.cc (m_heRuSubcarrierGroups, citing Tables 27-7..27-9 of 802.11ax-2021); one origin. ' +
            'RU counts equal countPerBandwidth and every RU has exactly its number of tones (tests).',
        },
        layout160: {
          value: { from: 80, shift: [-512, 512], wholeChannel: { size: 1992, ranges: [[-1012, -515], [-509, -12], [12, 509], [515, 1012]] } },
          status: 'unverified', evidence: ['ns3-heru'],
          note: '160 MHz: the 80 MHz layout shifted by −512 and +512 (ns-3 GetSubcarrierGroup), plus the 2×996-tone RU over the whole channel.',
        },
      },
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'unverified', evidence: ['plan'],
        note: 'Assumed equal to the VHT mapping; ns-3 caps HE-LTFs at 8 but does not show the mapping.' },
      heLtf: {
        symbolWithoutGi: { value: { '1x': 3.2, '2x': 6.4, '4x': 12.8 }, unit: 'µs', status: 'derived', evidence: ['ieee-16-1341', 'plan', 'arith'], derivedFrom: ['generations.HE.ofdm.T_DFT', 'definition: an Nx HE-LTF symbol lasts N/4 of the data DFT period'] },
        /* HE-LTF type + GI pairs offered for an HE SU PPDU */
        allowedWithGi: {
          value: [{ ltf: '1x', gi: 0.8 }, { ltf: '2x', gi: 0.8 }, { ltf: '2x', gi: 1.6 }, { ltf: '4x', gi: 3.2 }],
          status: 'supported', evidence: ['keysight-he-su', 'silabs-gi-ltf'],
          note: '4x HE-LTF + 0.8 µs GI also exists but only under extra conditions (DCM/STBC, or HE ER SU) — not offered here.',
        },
      },
      codingRule: {
        value: { bccMaxNss: 4, bccMaxMcs: 9, bccMaxRuTones: 242 },
        status: 'supported', evidence: ['ieee-18-1460', 'ieee-draft-d02'],
        clause: 'P802.11ax D0.2 26.3.10.4 (draft numbering); the final 802.11ax-2021 clause number was not read',
        note: 'BCC may only be used for MCS 0-9, N_SS <= 4 and RU <= 242 tones; LDPC otherwise. This app uses LDPC ' +
          'for every HE configuration (stated simplification).',
      },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'supported', evidence: ['pat-padding', 'plan', 'ns3-he'] },
        N_tail: { value: 0, unit: 'bit', status: 'derived', evidence: ['pat-padding', 'plan', 'arith'], derivedFrom: ['definition: LDPC is a block code; tail bits only terminate a convolutional (BCC) code'], note: 'LDPC has no tail bits (N_tail = 6·N_ES only for BCC).' },
        N_DBPS_rounding: { value: 'floor', status: 'unverified', evidence: ['tgbe-ndbps'],
          note: 'N_DBPS = floor(N_CBPS · R). Stated on the TGbe (802.11be) reflector only. None of the 72 ns-3 HE TXTIME ' +
            'vectors distinguishes floor from exact (see tests). Payloads that would: HE 80 MHz MCS 9 APEP_LENGTH 2448, ' +
            'MCS 11 APEP_LENGTH 5102 (1 SS, GI 0.8 µs) — check one of these in another tool.' },
        N_SD_short: {
          value: { 26: 6, 52: 12, 106: 24, 242: 60, 484: 120, 996: 240, 1992: 492 },
          status: 'supported', evidence: ['review-2', 'pat-nsd-short', 'review-3'],
          note: 'Looked up by RU size (1992 = 2 x 996-tone RU at 160 MHz); table supplied in review, consistent with the multi-RU patent.',
        },
      },
      /* Pre-FEC padding (a-factor) procedure — equations reproduced by pat-padding */
      padding: {
        equations: {
          value: [
            'N_Excess = mod(8·APEP_LENGTH + N_tail + N_service, N_DBPS)',
            'N_SYM,init = ceil((8·APEP_LENGTH + N_tail + N_service) / N_DBPS)',
            'a_init = 4 if N_Excess = 0, else min(ceil(N_Excess / N_DBPS,short), 4)',
            'N_DBPS,last,init = a_init·N_DBPS,short if a_init < 4, else N_DBPS',
            'N_PAD,Pre-FEC = (N_SYM,init − 1)·N_DBPS + N_DBPS,last,init − 8·APEP_LENGTH − N_tail − N_service',
            'if LDPC extra symbol segment: a_init = 4 → N_SYM = N_SYM,init + 1 and a = 1; else N_SYM = N_SYM,init and a = a_init + 1',
          ],
          status: 'supported', evidence: ['pat-padding', 'plan', 'pat-padding-mu'], note: 'Secondary: patents quoting draft text (m_STBC = 1 here).',
        },
        aRange: { value: [1, 2, 3, 4], status: 'supported', evidence: ['pat-pe', 'plan', 'pat-pre-post-fec'], note: 'a = pre-FEC padding factor' },
      },
      packetExtension: {
        nominalPacketPadding: { value: [0, 8, 16], unit: 'µs', status: 'supported', evidence: ['pat-pe', 'plan', 'mw-hesuconfig'] },
        /* nominal T_PE indexed [a-1] for each nominal packet padding */
        T_PE: {
          value: { 0: [0, 0, 0, 0], 8: [0, 0, 4, 8], 16: [4, 8, 12, 16] },
          unit: 'µs', status: 'supported', evidence: ['mw-hesuconfig', 'pat-pe', 'plan'],
          note: 'Index = a − 1. Values confirmed in review from MathWorks wlanHESUConfig; the 16 µs row also matches the patents.',
        },
      },
      txtime: {
        formula: { value: 'TXTIME = 20 µs + T_HE-PREAMBLE + N_SYM·T_SYM + T_PE + SignalExtension; T_HE-PREAMBLE = T_RL-SIG + T_HE-SIG-A + T_HE-STF + N_HE-LTF·T_HE-LTF,SYM',
          status: 'supported', evidence: ['pat-he-txtime', 'ieee-16-1411', 'plan'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'RL-SIG', toneplan: 'legacy',
          duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-he', 'plan', 'pat-he-durations'], note: 'repeated L-SIG (ns-3: L-SIG + RL-SIG = 8 µs)' } },
        { name: 'HE-SIG-A', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'supported', evidence: ['ns3-he', 'plan', 'pat-he-durations'], note: 'HE SU; 16 µs in an HE ER SU PPDU' } },
        { name: 'HE-STF', duration: { value: 4, unit: 'µs', status: 'supported', evidence: ['ns3-he', 'plan', 'pat-he-durations', 'keysight-he-structure'], note: 'HE SU/MU; 8 µs in an HE TB PPDU' } },
        { name: 'HE-LTF', count: 'N_LTF', durationEach: 'heLtf' },
        { name: 'Data', kind: 'data' },
        { name: 'PE', kind: 'pe', optional: true },
      ],
    },
  },

  /* ---------------------------------------------------------------------------
   *  L-SIG LENGTH. In a Non-HT PPDU it is the PSDU length. HT, VHT and HE PPDUs
   *  set it so that a legacy receiver, which assumes the 6 Mb/s rate (3 octets
   *  per 4 µs symbol), computes the true duration and defers for it.
   * ------------------------------------------------------------------------- */
  lsig: {
    nonHtLength: { value: 'PSDU length in octets', status: 'unverified', evidence: ['review-2', 'plan', 'mw-lsig'], note: 'MathWorks + reviewer statement only (one public origin).' },
    spoofRule: {
      value: { legacyPreamble: 20, symbol: 4, octetsPerSymbol: 3, subtract: 3 },
      status: 'supported', evidence: ['review-2', 'ieee-13-1002', 'pat-lsig-length', 'warp-ref', 'review-3'], note: 'LENGTH = ceil((TXTIME − SignalExtension − 20) / 4) · 3 − 3 for HT and VHT; HE subtracts a further m (lsig.heM). The patent writes 3 as RATE/8·4 with RATE = 6 Mb/s.',
    },
    heM: {
      value: { 'HE SU PPDU': 2, 'HE TB PPDU': 2, 'HE MU PPDU': 1, 'HE ER SU PPDU': 1 },
      status: 'supported', evidence: ['ieee-17-0398', 'pat-he-mod3', 'pat-lsig-length'],
      note: 'HE PPDUs subtract m: LENGTH mod 3 = 1 marks HE SU / HE TB, LENGTH mod 3 = 2 marks HE MU / HE ER SU (mod 3 = 0: not HE).',
    },
    maxLength: { value: 4095, unit: 'octet', status: 'derived', evidence: ['ieee-13-1002', 'mw-duration', 'plan', 'arith', 'review-3'], derivedFrom: ['generations.nonHT.lsigBits'], note: '2^12 − 1 (12-bit LENGTH)' },
    maxPpdu: { value: 5484, unit: 'µs', status: 'derived', evidence: ['ieee-13-1002', 'mw-duration', 'arith', 'review-3'], derivedFrom: ['lsig.spoofRule', 'lsig.maxLength'],
      note: '(4095 + 3) / 3 · 4 + 20 = 5484 µs: the longest duration an L-SIG LENGTH can announce. Checked for every generation ' +
        '(excluding the signal extension); the longest Non-HT PPDU, 4095 octets at 6 Mb/s, takes exactly 5484 µs.' },
  },

  /* ---------------------------------------------------------------------------
   *  LDPC encoding parameters (HT clause 19, reused by HE) — N_CW and L_LDPC
   *  as a function of N_avbits and N_pld.
   * ------------------------------------------------------------------------- */
  ldpc: {
    codewordTable: {
      value: [
        { maxAvbits: 648,  N_CW: 1,    L_long: 1296, L_short: 648,  threshold: 912 },
        { maxAvbits: 1296, N_CW: 1,    L_long: 1944, L_short: 1296, threshold: 1464 },
        { maxAvbits: 1944, N_CW: 1,    L_long: 1944, L_short: 1944, threshold: null },
        { maxAvbits: 2592, N_CW: 2,    L_long: 1944, L_short: 1296, threshold: 2916 },
        { maxAvbits: null, N_CW: null, L_long: 1944, L_short: 1944, threshold: null },
      ],
      status: 'unverified', evidence: ['plan'],
      note: 'Row i applies when N_avbits <= maxAvbits. L_long is used if N_avbits >= N_pld + threshold·(1 − R). ' +
        'Last row: N_CW = ceil(N_pld / (1944·R)). Codeword lengths 648/1296/1944 confirmed by patents; thresholds not found.',
    },
    shorteningPuncturing: {
      value: ['N_shrt = max(0, N_CW·L_LDPC·R − N_pld)', 'N_punc = max(0, N_CW·L_LDPC − N_avbits − N_shrt)'],
      status: 'supported', evidence: ['arxiv-ldpc', 'plan', 'pat-ldpc-extra'],
    },
    extraSymbolCondition: {
      value: { puncturedFraction: 0.1, shorteningFactor: 1.2 },
      status: 'unverified', evidence: ['pat-ldpc-extra', 'plan'],
      note: 'Extra symbol (HT) / LDPC extra symbol segment (HE) if N_punc > 0.1·N_CW·L_LDPC·(1 − R) AND ' +
        'N_shrt < 1.2·N_punc·R/(1 − R). The patent uses this form for a longer-codeword variant.',
    },
  },

  /* ---------------------------------------------------------------------------
   *  Bit-level processing of the Data field on the BCC path (transmitter →
   *  receiver chain): scrambler, convolutional encoder, puncturing, interleaver,
   *  constellation mapping. One spatial stream, 20 MHz.
   * ------------------------------------------------------------------------- */
  bitLevel: {
    scrambler: {
      value: { polynomialExponents: [7, 4, 0], stateBits: 7, initBitsInService: 7 },
      status: 'supported', evidence: ['pat-scrambler-init', 'arxiv-1212-4991', 'plan'],
      note: 'Frame-synchronous scrambler S(x) = x^7 + x^4 + 1 (period 127). The first 7 SERVICE bits are zero before scrambling, so the receiver reads the scrambler state straight from them.',
    },
    tailZeroedAfterScrambling: {
      value: true, status: 'unverified', evidence: ['plan'],
      note: 'The 6 tail bits are set back to zero after scrambling so that the encoder ends in the all-zero state.',
    },
    convolutionalCode: {
      value: { constraintLength: 7, generatorsOctal: ['133', '171'] },
      status: 'supported', evidence: ['inet-ofdm', 'ubc-elex7860', 'plan'],
      note: 'Rate-1/2 mother code: output A from g0 = 133 (octal), output B from g1 = 171 (octal).',
    },
    puncturing: {
      value: { '1/2': [[1], [1]], '2/3': [[1, 1], [1, 0]], '3/4': [[1, 1, 0], [1, 0, 1]], '5/6': [[1, 1, 0, 1, 0], [1, 0, 1, 0, 1]] },
      status: 'unverified', evidence: ['inet-ofdm', 'plan'],
      note: 'Rows: output A and output B; 1 = sent, 0 = removed (stolen). One open-source origin only.',
    },
    interleaverRule: {
      value: ['i = N_ROW·(k mod N_COL) + floor(k / N_COL)', 'j = s·floor(i / s) + (i + N_CBPS − floor(N_COL·i / N_CBPS)) mod s,  s = max(N_BPSCS / 2, 1)'],
      status: 'supported', evidence: ['inet-ofdm', 'pat-interleaver-11a', 'plan'],
      note: 'Both sources state the Clause 17 form (N_COL = 16, N_ROW = N_CBPS / 16). Later PHYs reuse the two permutations with other array sizes (one stream: no frequency rotation).',
    },
    interleaverColumnsNonHT: { value: 16, status: 'supported', evidence: ['inet-ofdm', 'pat-interleaver-11a', 'plan'] },
    interleaverSize20MHz: {
      value: { HT: { columns: 13, rowsPerBpscs: 4 }, VHT: { columns: 13, rowsPerBpscs: 4 }, HE: { columns: 26, rowsPerBpscs: 9 } },
      status: 'unverified', evidence: ['plan'],
      note: 'One spatial stream, 20 MHz (52 / 52 / 234 data subcarriers = columns × rows / N_BPSCS). Plan values only; for the 242-tone RU a patent summary (pat-he-interleaver) gives different numbers.',
    },
    grayMapping: {
      value: 'I from the first half of each N_BPSCS bit group, Q from the second half (BPSK: I only). On each axis the first bit is the sign (0 → negative) and the level index is the inverse binary-reflected Gray code of the bits.',
      status: 'unverified', evidence: ['inet-ofdm', 'plan'],
      note: 'Matches the INET 16-QAM table; one origin.',
    },
    /* Constellation mapping as tables: on each axis, the bit group (first bit first) → level
     * (odd integers; multiply by K_MOD = 1/sqrt(meanEnergy) for unit average power). I takes the
     * first half of the N_BPSCS bits, Q the second half; BPSK has I only. */
    constellationMapping: {
      value: {
        'BPSK': { I: { '0': -1, '1': 1 } },
        'QPSK': { I: { '0': -1, '1': 1 }, Q: { '0': -1, '1': 1 } },
        '16-QAM': { I: { '10': 3, '11': 1, '00': -3, '01': -1 }, Q: { '10': 3, '11': 1, '00': -3, '01': -1 } },
        '64-QAM': { I: { '100': 7, '101': 5, '110': 1, '111': 3, '000': -7, '001': -5, '010': -1, '011': -3 }, Q: { '100': 7, '101': 5, '110': 1, '111': 3, '000': -7, '001': -5, '010': -1, '011': -3 } },
      },
      status: 'supported', evidence: ['gr-ieee80211', 'inet-ofdm', 'plan'],
      note: 'Checked point by point: gr-ieee802-11 (BPSK, QPSK, 16-QAM, 64-QAM) and INET (same four) give the same points when the first bit is the index LSB. BPSK: 0 → −1, 1 → +1.',
    },
    constellationMappingHigh: {
      value: {
        '256-QAM': { I: { '1000': 15, '1001': 13, '1010': 9, '1011': 11, '1100': 1, '1101': 3, '1110': 7, '1111': 5, '0000': -15, '0001': -13, '0010': -9, '0011': -11, '0100': -1, '0101': -3, '0110': -7, '0111': -5 }, Q: { '1000': 15, '1001': 13, '1010': 9, '1011': 11, '1100': 1, '1101': 3, '1110': 7, '1111': 5, '0000': -15, '0001': -13, '0010': -9, '0011': -11, '0100': -1, '0101': -3, '0110': -7, '0111': -5 } },
        '1024-QAM': { I: { '10000': 31, '10001': 29, '10010': 25, '10011': 27, '10100': 17, '10101': 19, '10110': 23, '10111': 21, '11000': 1, '11001': 3, '11010': 7, '11011': 5, '11100': 15, '11101': 13, '11110': 9, '11111': 11, '00000': -31, '00001': -29, '00010': -25, '00011': -27, '00100': -17, '00101': -19, '00110': -23, '00111': -21, '01000': -1, '01001': -3, '01010': -7, '01011': -5, '01100': -15, '01101': -13, '01110': -9, '01111': -11 }, Q: { '10000': 31, '10001': 29, '10010': 25, '10011': 27, '10100': 17, '10101': 19, '10110': 23, '10111': 21, '11000': 1, '11001': 3, '11010': 7, '11011': 5, '11100': 15, '11101': 13, '11110': 9, '11111': 11, '00000': -31, '00001': -29, '00010': -25, '00011': -27, '00100': -17, '00101': -19, '00110': -23, '00111': -21, '01000': -1, '01001': -3, '01010': -7, '01011': -5, '01100': -15, '01101': -13, '01110': -9, '01111': -11 } },
      },
      status: 'unverified', evidence: ['plan'],
      note: 'Same Gray rule extended to 4 and 5 bits per axis. INET\'s 256/1024-QAM tables use another bit layout (Q bits first, generated from patent WO2003058904), so no second source agrees.',
    },
    meanEnergy: {
      value: { 'BPSK': 1, 'QPSK': 2, '16-QAM': 10, '64-QAM': 42, '256-QAM': 170, '1024-QAM': 682 },
      status: 'derived', evidence: ['arith', 'plan'],
      derivedFrom: ['definition: square M-QAM with levels ±1, ±3, … has mean energy 2(M − 1)/3; BPSK ±1 has 1'],
      note: 'K_MOD = 1 / sqrt(mean energy) normalizes every constellation to unit average power.',
    },
  },

  /* ---------------------------------------------------------------------------
   *  Interframe timing (per band)
   * ------------------------------------------------------------------------- */
  interframe: {
    bands: {
      '5':   { SIFS: { value: 16, unit: 'µs', status: 'unverified', evidence: ['wiki-sifs', 'wiki-difs', 'plan'] },
               aSlotTime: { value: { short: 9 }, unit: 'µs', status: 'unverified', evidence: ['wiki-difs', 'plan'] } },
      '2.4': { SIFS: { value: 10, unit: 'µs', status: 'unverified', evidence: ['plan'] },
               aSlotTime: { value: { short: 9, long: 20 }, unit: 'µs', status: 'unverified', evidence: ['plan'] } },
      '6':   { SIFS: { value: 16, unit: 'µs', status: 'unverified', evidence: ['wiki-sifs', 'wiki-difs', 'plan'], note: 'assumed same as 5 GHz' },
               aSlotTime: { value: { short: 9 }, unit: 'µs', status: 'unverified', evidence: ['wiki-difs', 'plan'] } },
    },
    difsRule: { value: 'DIFS = SIFS + 2 × aSlotTime', status: 'unverified', evidence: ['wiki-difs', 'plan'] },
    signalExtension: {
      value: { '2.4': 6, '5': 0, '6': 0 }, unit: 'µs', status: 'supported', evidence: ['ns3-ofdm', 'ns3-txdur', 'plan', 'pat-lsig-length'],
      note: 'OFDM PPDUs in the 2.4 GHz band end with a 6 µs signal extension (no transmission) so that the receiver has time to finish decoding before SIFS.',
    },
    ackFrameOctets: { value: 14, unit: 'octet', status: 'unverified', evidence: ['plan'] },
  },


  /* ---------------------------------------------------------------------------
   *  Glossary: official 802.11 terms shown as labels / tooltips.
   *  doc = top-level clause (see `documents`). `cited` = a sub-clause number quoted
   *  by a secondary source (edition given) — never read in the standard itself.
   * ------------------------------------------------------------------------- */
  terms: {
    'PPDU': { expansion: 'PHY protocol data unit', doc: 'c17',
      definition: 'Everything that goes on the air for one transmission: the PHY preamble (training fields), the signal field(s) and the Data field.' },
    'PSDU': { expansion: 'PHY service data unit', doc: 'c17',
      definition: 'The bits the MAC hands to the PHY for one PPDU (a MAC frame, or from 802.11n on an aggregate of frames). It is carried inside the Data field.' },
    'Non-HT PPDU': { doc: 'c17',
      definition: 'The PPDU format of the OFDM PHY (802.11a, 5 GHz) and of ERP-OFDM (802.11g, 2.4 GHz). Later PHYs still use it for control frames and as the first part of their own preambles.' },
    'PHY preamble': { doc: 'c17', cited: { ref: '17.3.3 "PHY preamble (SYNC)" (802.11-2016 numbering)', source: 'ns3-ofdm' },
      definition: 'The training fields at the start of a PPDU (L-STF and L-LTF) that let the receiver detect the packet, set its gain, synchronize and estimate the channel.' },
    'L-STF': { expansion: 'Non-HT (legacy) Short Training field', doc: 'c17', cited: { ref: '17.3.3 (802.11-2016 numbering)', source: 'ns3-ofdm' },
      definition: 'Ten repetitions of a 0.8 µs short training symbol (8 µs). Used for packet detection, automatic gain control (AGC), coarse carrier-frequency-offset estimation and timing. A 0.8 µs period is a quarter of T_FFT, so only every fourth subcarrier is used.' },
    'L-LTF': { expansion: 'Non-HT (legacy) Long Training field', doc: 'c17', cited: { ref: '17.3.3 (802.11-2016 numbering)', source: 'ns3-ofdm' },
      definition: 'A 1.6 µs guard interval (T_GI2) followed by two identical 3.2 µs long training symbols with known values on every used subcarrier (8 µs). Used for fine frequency-offset estimation and channel estimation: dividing what is received on each subcarrier by the known value gives that subcarrier\'s complex channel gain. This per-subcarrier estimate is the channel state information (CSI).' },
    'L-SIG': { expansion: 'Non-HT (legacy) SIGNAL field', alias: 'SIGNAL field (Clause 17 name)', doc: 'c17',
      definition: 'One OFDM symbol (4 µs), always BPSK rate 1/2, carrying RATE and LENGTH. From them every receiver — including older ones — computes how long the PPDU lasts and stays quiet for that time.' },
    'RATE': { doc: 'c17', definition: 'The 4-bit L-SIG subfield that tells a Non-HT receiver the modulation and coding rate of the Data field.' },
    'LENGTH': { doc: 'c17', definition: 'The 12-bit L-SIG subfield. In a Non-HT PPDU it is the PSDU length in octets. In HT and VHT PPDUs it is set to ceil((TXTIME − 20 µs)/4 µs)·3 − 3, so that a legacy receiver — which assumes 6 Mb/s, i.e. 3 octets per 4 µs symbol — computes the true duration and stays quiet for it. HE PPDUs subtract a further m (2 for HE SU and HE TB, 1 for HE MU and HE ER SU), so LENGTH mod 3 tells an HE receiver the format early.' },
    'Data field': { doc: 'c17',
      definition: 'The part of the PPDU after the preamble and signal fields: SERVICE field + PSDU + tail bits + pad bits, coded and modulated onto N_SYM OFDM symbols. With LDPC (HE here) there are no tail bits, and the padding is split into pre-FEC and post-FEC padding.' },
    'SERVICE field': { doc: 'c17',
      definition: 'The first 16 bits of the Data field. Its first bits are zero so the receiver can recover the scrambler\'s initial state; the rest are reserved.' },
    'Tail bits': { doc: 'c17',
      definition: 'Six zero bits per BCC encoder appended after the PSDU, returning the convolutional encoder to the all-zero state so the decoder can terminate cleanly.' },
    'Pad bits': { doc: 'c17',
      definition: 'Bits added after the tail so that the Data field fills a whole number of OFDM symbols (N_SYM · N_DBPS bits).' },
    'OFDM symbol': { doc: 'c17',
      definition: 'One output block of the IFFT plus its guard interval. All subcarriers are transmitted in parallel for T_SYM; the constellation points change from one OFDM symbol to the next.' },
    'Subcarrier': { alias: 'tone (802.11ax wording)', doc: 'c17',
      definition: 'One of the N_FFT orthogonal frequencies of the OFDM signal, spaced Δ_F apart. Each carries one constellation point (or nothing) per OFDM symbol.' },
    'Data subcarrier': { doc: 'c17', definition: 'A subcarrier that carries data: one constellation point with N_BPSCS coded bits per spatial stream in each OFDM symbol.' },
    'Pilot subcarrier': { doc: 'c17',
      definition: 'A subcarrier with a known BPSK value at a fixed index. The receiver uses pilots to track residual carrier-frequency offset and phase noise during the Data field. Their sign follows a pilot polarity sequence from symbol to symbol.' },
    'DC subcarrier': { doc: 'c17',
      definition: 'The subcarrier(s) at and around index 0, left empty: a direct-conversion receiver has DC offset and local-oscillator leakage exactly there.' },
    'Guard subcarriers': { doc: 'c17',
      definition: 'Unused subcarriers at both band edges. They keep the transmitted spectrum inside the spectral mask and leave room for the analog filters.' },
    'Null subcarrier': { doc: 'c21',
      definition: 'Any other subcarrier that carries no energy — here the centre subcarriers of each 80 MHz half of a 160 MHz channel.' },
    'FFT size': { doc: 'c17',
      definition: 'Number of points of the IFFT (transmitter) / FFT (receiver) = number of subcarrier positions N_FFT. Sample rate = N_FFT · Δ_F, i.e. 20 Msample/s for 64 points at 312.5 kHz.' },
    'Δ_F': { expansion: 'subcarrier frequency spacing', doc: 'c17',
      definition: 'Distance between adjacent subcarriers: 20 MHz / 64 = 312.5 kHz in Clauses 17, 19, 21; 78.125 kHz for HE (Clause 27). Its inverse is the useful symbol duration.' },
    'T_FFT': { expansion: 'IFFT/FFT period (Clause 17 name; Clauses 19, 21, 27 call it T_DFT)', doc: 'c17', cited: { ref: '17.3.2.4 Table 17-5 "Timing-related parameters" (802.11-2016 numbering)', source: 'ns3-ofdm' },
      definition: 'Duration of the useful part of an OFDM symbol, T_FFT = 1/Δ_F = 3.2 µs. The receiver\'s FFT window covers exactly this part.' },
    'T_DFT': { expansion: 'IDFT/DFT period (Clauses 19, 21, 27 name; Clause 17 calls it T_FFT)', doc: 'c19',
      definition: 'Duration of the useful part of an OFDM symbol, 1/Δ_F: 3.2 µs for HT and VHT, 12.8 µs for HE.' },
    'Guard interval': { expansion: 'GI, duration T_GI', doc: 'c17',
      definition: 'Time added before the useful part of every OFDM symbol (0.8 µs in Non-HT). It absorbs the echoes of the previous symbol (multipath delay spread) so that symbols do not interfere.' },
    'Cyclic prefix': { doc: 'c17',
      definition: 'How the guard interval is filled: with a copy of the last T_GI of the useful part. Inside the FFT window the channel then acts as a circular convolution, so each subcarrier sees just one complex gain — a one-tap equalizer per subcarrier is enough.' },
    'T_SYM': { expansion: 'symbol interval', doc: 'c17', definition: 'Duration of one OFDM symbol: T_SYM = T_GI + T_FFT (4.0 µs in Non-HT).' },
    'T_GI2': { expansion: 'training symbol guard interval', doc: 'c17', definition: 'The 1.6 µs double guard interval in front of the two long training symbols of the L-LTF.' },
    'N_SD': { expansion: 'number of data subcarriers', doc: 'c17', definition: 'Subcarriers that carry data in each OFDM symbol (48 in Non-HT).' },
    'N_SP': { expansion: 'number of pilot subcarriers', doc: 'c17', definition: 'Subcarriers that carry pilots (4 in Non-HT).' },
    'N_ST': { expansion: 'total number of subcarriers', doc: 'c17', definition: 'N_ST = N_SD + N_SP: all subcarriers that carry energy.' },
    'N_BPSCS': { expansion: 'coded bits per subcarrier per spatial stream', doc: 'c17', definition: 'log2 of the constellation size: 1 (BPSK), 2 (QPSK), 4 (16-QAM), 6 (64-QAM), 8 (256-QAM), 10 (1024-QAM).' },
    'N_CBPS': { expansion: 'coded bits per OFDM symbol', doc: 'c17', definition: 'N_CBPS = N_SD · N_BPSCS · N_SS — what one OFDM symbol carries after channel coding.' },
    'N_DBPS': { expansion: 'data bits per OFDM symbol', doc: 'c17', definition: 'N_DBPS = N_CBPS · R — the information bits per OFDM symbol before coding. Data rate = N_DBPS / T_SYM.' },
    'N_SS': { expansion: 'number of spatial streams', doc: 'c19', definition: 'Independent data streams sent at the same time over multiple antennas (always 1 in Non-HT).' },
    'N_SYM': { expansion: 'number of OFDM symbols in the Data field', doc: 'c17', cited: { ref: 'equation 19-32 (802.11-2016 numbering, BCC case)', source: 'ns3-ofdm' },
      definition: 'With BCC: N_SYM = ceil((16 + 8·LENGTH + 6·N_ES) / N_DBPS) — SERVICE, PSDU and tail bits, rounded up to whole symbols.' },
    'N_PAD': { expansion: 'number of pad bits', doc: 'c17', definition: 'N_PAD = N_SYM · N_DBPS − (16 + 8·LENGTH + 6·N_ES).' },
    'N_ES': { expansion: 'number of BCC encoders', doc: 'c19', definition: 'Parallel convolutional encoders used at high rates (always 1 in Non-HT). Each adds 6 tail bits.' },
    'R': { expansion: 'coding rate', doc: 'c17', definition: 'Ratio of information bits to coded bits: 1/2, 2/3, 3/4 (and 5/6 from HT on).' },
    'BCC': { expansion: 'binary convolutional code', doc: 'c17', definition: 'The rate-1/2 convolutional code of the OFDM PHY, punctured to 2/3 or 3/4 (5/6 from HT on).' },
    'Data rate': { doc: 'c17', definition: 'N_DBPS / T_SYM: information bits delivered per microsecond during the Data field (Mb/s).' },
    'TXTIME': { doc: 'c17', definition: 'The time the PHY needs to transmit the whole PPDU, computed from the parameters. The MAC uses it for timing (e.g. the Duration field and NAV).' },
    'Signal extension': { doc: 'c18', cited: { ref: 'ERP-OFDM, 2.4 GHz', source: 'ns3-ofdm' },
      definition: 'A 6 µs period of no transmission after an OFDM PPDU in the 2.4 GHz band. With the 10 µs SIFS of 2.4 GHz it gives the receiver the same 16 µs of decoding time as SIFS at 5 GHz.' },
    'ERP-OFDM': { expansion: 'Extended Rate PHY with OFDM (802.11g)', doc: 'c18', definition: 'The OFDM modulation of Clause 17 used in the 2.4 GHz band, with a signal extension.' },
    'CSI': { expansion: 'channel state information', doc: 'c19',
      definition: 'The receiver\'s estimate of the channel: one complex gain (amplitude and phase) per subcarrier and antenna pair, obtained from the long training field(s).' },
    'Constellation mapping': { doc: 'c17', definition: 'Grouping N_BPSCS coded bits and turning them into one complex point (BPSK, QPSK, 16-QAM, 64-QAM …). This is where bits become symbols.' },
    'IFFT': { expansion: 'inverse fast Fourier transform', doc: 'c17', definition: 'Turns the N_FFT subcarrier values of one OFDM symbol into N_FFT time-domain samples (the useful part).' },
    'Channel bandwidth': { doc: 'c17', definition: 'Width of the channel: 20 MHz for Non-HT; 40 MHz from HT; 80/160 MHz from VHT.' },
    'Band': { doc: 'c17', definition: 'Frequency band of operation: 5 GHz (802.11a, Clause 17) or 2.4 GHz (802.11g ERP-OFDM, Clause 18); HT adds 2.4 GHz operation, VHT is 5 GHz only, HE also runs in 6 GHz. The band changes SIFS, aSlotTime and the signal extension (6 µs at 2.4 GHz).' },
    'HT-mixed format PPDU': { doc: 'c19',
      definition: 'The 802.11n PPDU format used here. It starts with the Non-HT preamble (L-STF, L-LTF, L-SIG) so that older stations can still read the duration, followed by HT-SIG, HT-STF and the HT-LTFs before the Data field.' },
    'VHT SU PPDU': { expansion: 'VHT single-user PPDU', doc: 'c21',
      definition: 'An 802.11ac PPDU addressed to one station: Non-HT preamble, VHT-SIG-A, VHT-STF, VHT-LTFs, VHT-SIG-B, Data.' },
    'HT-SIG': { expansion: 'HT SIGNAL field', doc: 'c19',
      definition: 'Two OFDM symbols (8 µs) on the pre-HT subcarrier plan, modulated with QBPSK. Carries the MCS, the channel bandwidth (20/40 MHz), the HT Length, short GI, coding (BCC/LDPC), STBC and the number of extension spatial streams, protected by a CRC.' },
    'HT-STF': { expansion: 'HT Short Training field', doc: 'c19',
      definition: 'One 4 µs symbol after HT-SIG. The receiver re-adjusts its gain (AGC) here, because from this point the signal may use more streams or be beamformed differently from the legacy part.' },
    'HT-LTF': { expansion: 'HT Long Training field', doc: 'c19',
      definition: 'One 4 µs symbol per training dimension (N_LTF = 1, 2, 4, 4 for 1–4 streams). The receiver estimates the full MIMO channel — one matrix per subcarrier — which it needs to separate the spatial streams. This is the CSI used for MIMO detection and for beamforming feedback.' },
    'VHT-SIG-A': { expansion: 'VHT SIGNAL A field', doc: 'c21',
      definition: 'Two OFDM symbols (8 µs) on the pre-HT subcarrier plan: VHT-SIG-A1 in BPSK, VHT-SIG-A2 in QBPSK. Carries the bandwidth, STBC, group ID, number of space-time streams, short GI (with the N_SYM disambiguation bit), coding, the MCS of an SU PPDU, beamforming flag and a CRC.' },
    'VHT-STF': { expansion: 'VHT Short Training field', doc: 'c21', definition: 'One 4 µs symbol for re-adjusting the gain (AGC) before the VHT part of the PPDU.' },
    'VHT-LTF': { expansion: 'VHT Long Training field', doc: 'c21',
      definition: 'One 4 µs symbol per training dimension (N_LTF = 1, 2, 4, 4 for 1–4 streams), on the VHT subcarrier plan. Used to estimate the MIMO channel on every subcarrier (CSI).' },
    'VHT-SIG-B': { expansion: 'VHT SIGNAL B field', doc: 'c21', cited: { ref: '21.3.8.3.6 (802.11-2016 numbering)', source: 'mw-vht-ppdu' },
      definition: 'One 4 µs symbol after the VHT-LTFs. In a VHT SU PPDU it carries the VHT-SIG-B Length (APEP_LENGTH in units of 4 octets); in a VHT MU PPDU also the MCS of each user.' },
    'QBPSK': { expansion: 'quadrature BPSK', doc: 'c19',
      definition: 'BPSK rotated by 90°: the two points lie on the imaginary axis (±j). HT-SIG and VHT-SIG-A2 use it, so a receiver can tell an HT or VHT PPDU from a Non-HT PPDU one symbol after L-SIG.' },
    'Short GI': { expansion: 'short guard interval', doc: 'c19',
      definition: 'The 0.4 µs guard interval of HT and VHT (T_SYM = 3.6 µs instead of 4.0 µs). In TXTIME the Data field is then rounded up to a multiple of 4 µs so the PPDU ends on the legacy symbol grid.' },
    'N_LTF': { expansion: 'number of long-training symbols', doc: 'c19',
      definition: 'Number of HT-LTF / VHT-LTF / HE-LTF symbols. It follows the number of space-time streams: 1, 2, 4, 4 for 1–4 (3 streams need 4 symbols because the training matrix is square).' },
    'APEP_LENGTH': { expansion: 'A-MPDU pre-EOF padding length', doc: 'c21',
      definition: 'The number of octets of the A-MPDU before the end-of-frame padding. VHT and HE PPDUs size their Data field from it (here: the payload length you enter).' },
    'HT Length': { doc: 'c19', definition: 'The 16-bit HT-SIG subfield with the PSDU length in octets of an HT PPDU.' },
    'Phase rotation': { doc: 'c19',
      definition: 'In wider channels the pre-HT fields are sent once per 20 MHz subchannel; each copy is multiplied by its own factor (1 and j at 40 MHz; 1, −1, −1, −1 at 80 MHz) to keep the peak-to-average power ratio low.' },
    'Spatial stream': { doc: 'c19', definition: 'One of N_SS independent data streams sent simultaneously over several antennas on the same subcarriers (MIMO spatial multiplexing).' },
    'MCS': { expansion: 'modulation and coding scheme', doc: 'c19', definition: 'Index for a combination of modulation and coding rate (HT and later: HT 0–7 per stream, VHT 0–9, HE 0–11). Non-HT has no MCS — it signals a data rate in RATE.' },

    /* ---- transmitter → receiver chain ---- */
    'Scrambler': { doc: 'c17', definition: 'XORs the data bits with a pseudo-random sequence from a 7-bit shift register (S(x) = x^7 + x^4 + 1) so that long runs of 0s or 1s do not produce spectral lines. Its starting state is random; the receiver learns it from the first 7 SERVICE bits, which are zero before scrambling.' },
    'Convolutional encoder': { doc: 'c17', definition: 'The BCC encoder: a 6-bit memory plus the new bit (constraint length 7). For every input bit it outputs two bits, A and B, each the XOR of the taps of one generator polynomial (133 and 171 in octal). Each output depends on the last 7 input bits, which is what lets the decoder correct errors.' },
    'Puncturing': { doc: 'c17', definition: 'Removing some of the encoder\'s output bits in a fixed pattern to raise the coding rate from 1/2 to 2/3, 3/4 or 5/6. The receiver puts "unknown" (erasures) back in their places before decoding.' },
    'Interleaver': { doc: 'c17', definition: 'Reorders the coded bits of each OFDM symbol: adjacent coded bits go to subcarriers far apart (first permutation) and alternate between more and less reliable bits of the constellation (second permutation). A fade that wipes out neighbouring subcarriers then causes scattered errors, which the decoder can correct, instead of a burst it cannot.' },
    'Viterbi decoder': { doc: 'c17', definition: 'The usual decoder for the BCC: it tracks all 64 encoder states through a trellis and keeps, for each state, the most likely path so far. At the end it follows the best path back and outputs the bits that most likely produced what was received.' },
    'Channel estimation': { doc: 'c17', definition: 'The receiver divides what it received on each subcarrier during a training field by the known transmitted value. The result is one complex gain per subcarrier — the CSI — later used by the equalizer.' },
    'Equalizer': { doc: 'c17', definition: 'Divides each received data subcarrier by its estimated channel gain, undoing the attenuation and phase shift of the channel. Thanks to the cyclic prefix one complex division per subcarrier is enough.' },
    'Carrier frequency offset': { expansion: 'CFO', doc: 'c17', definition: 'The difference between the transmitter\'s and the receiver\'s carrier frequencies. It makes the received constellation rotate from symbol to symbol and, if large, leaks energy between subcarriers. Estimated from repeated training symbols; what remains is tracked with the pilots.' },
    'Multipath': { doc: 'c17', definition: 'The signal arrives over several paths (direct, reflections) with different delays. Within one OFDM symbol this makes some subcarriers stronger and some weaker (frequency-selective fading); echoes longer than the guard interval also smear one symbol into the next.' },
    'SNR': { expansion: 'signal-to-noise ratio', doc: 'c17', definition: 'Average signal power divided by noise power, in dB. Denser constellations need a higher SNR because their points are closer together.' },
    'EVM': { expansion: 'error vector magnitude', doc: 'c17', definition: 'RMS distance between the received (equalized) constellation points and the ideal points, relative to the average point power — the standard measure of modulation accuracy.' },
    'Demapper': { doc: 'c17', definition: 'The inverse of constellation mapping: turns each equalized point back into N_BPSCS bits (here: the bits of the nearest constellation point, a hard decision).' },
    'SIFS': { expansion: 'short interframe space', doc: 'c17', definition: 'The gap between the end of a received PPDU and the start of the response (e.g. an ACK): 16 µs at 5 GHz, 10 µs (+ 6 µs signal extension) at 2.4 GHz. Within it the receiver must finish decoding, check the frame and switch to transmit — the reason the lower PHY usually sits in dedicated hardware.' },
    'ACK': { expansion: 'Acknowledgment frame', doc: 'c17', definition: 'The short control frame a receiver sends one SIFS after a correctly received frame. If it does not arrive in time, the sender retransmits.' },

    /* ---- HE (802.11ax) ---- */
    'HE SU PPDU': { expansion: 'HE single-user PPDU', doc: 'c27',
      definition: 'An 802.11ax PPDU to one station over the whole channel: the pre-HE fields (L-STF, L-LTF, L-SIG, RL-SIG, HE-SIG-A) on the 312.5 kHz plan, then HE-STF, the HE-LTFs and the Data field on the 78.125 kHz plan, and the packet extension (PE).' },
    'RL-SIG': { expansion: 'Repeated Non-HT SIGNAL field', doc: 'c27',
      definition: 'An exact repeat of L-SIG (4 µs) right after it. Seeing the same symbol twice tells a receiver that an HE PPDU follows; it also gets a second copy of L-SIG to combine.' },
    'HE-SIG-A': { expansion: 'HE SIGNAL A field', doc: 'c27',
      definition: 'Two OFDM symbols (8 µs) on the pre-HE plan; four (16 µs) in an HE ER SU PPDU. For an HE SU PPDU it carries the MCS, DCM, BSS color, bandwidth, GI + HE-LTF type, number of space-time streams, coding (BCC/LDPC), the LDPC extra symbol segment bit, the pre-FEC padding factor, the PE disambiguity bit and a CRC.' },
    'HE-STF': { expansion: 'HE Short Training field', doc: 'c27',
      definition: 'A 4 µs field (8 µs in an HE TB PPDU) for re-adjusting the gain (AGC) before the HE part, where the signal may use more streams, beamforming or — in OFDMA — only some resource units.' },
    'HE-LTF': { expansion: 'HE Long Training field', doc: 'c27',
      definition: 'N_LTF symbols for MIMO channel estimation (CSI) on the HE subcarrier plan. Each lasts one HE-LTF symbol (3.2, 6.4 or 12.8 µs for the 1x, 2x or 4x HE-LTF) plus the guard interval of the Data field.' },
    'HE-LTF type': { alias: 'HE-LTF size (1x, 2x, 4x)', doc: 'c27',
      definition: 'How densely an HE-LTF symbol samples the subcarriers. 4x uses every subcarrier and lasts the full 12.8 µs; 2x uses every second subcarrier, so the signal repeats after 6.4 µs and only one period is sent; 1x uses every fourth (3.2 µs). Shorter HE-LTFs save airtime, denser ones estimate the channel better. HE-SIG-A signals it together with the GI.' },
    'PE': { expansion: 'Packet extension field', doc: 'c27',
      definition: 'An optional field after the Data field (0 to 16 µs in 4 µs steps) that carries no new information. It gives the receiver extra time to finish the last symbol before it must answer one SIFS later. Its duration T_PE follows from the nominal packet padding and the pre-FEC padding factor a: the fewer segments of the last symbol carry data, the less extra time is needed.' },
    'T_PE': { expansion: 'duration of the packet extension', doc: 'c27',
      definition: 'Looked up from the nominal packet padding (0, 8 or 16 µs) and the pre-FEC padding factor a (1..4). It is part of TXTIME.' },
    'Nominal packet padding': { doc: 'c27',
      definition: 'Capability a receiver announces (0, 8 or 16 µs): how much extra processing time it needs after the last OFDM symbol for a given bandwidth, number of streams and constellation. The transmitter picks T_PE from this value and a.' },
    'Pre-FEC padding factor': { alias: 'a-factor, a', doc: 'c27',
      definition: 'a = 1..4: how many of the four segments of the last OFDM symbol carry information bits. The pad bits that fill segment a go in before the encoder (pre-FEC padding); the remaining segments are filled after it (post-FEC padding). Signalled in HE-SIG-A.' },
    'Pre-FEC padding': { doc: 'c27',
      definition: 'Pad bits added before the encoder so that the information bits end exactly on the a-th segment boundary of the last OFDM symbol (N_PAD,Pre-FEC bits).' },
    'Post-FEC padding': { doc: 'c27',
      definition: 'Bits added after encoding to fill the segments of the last OFDM symbol beyond the a-th. The receiver does not need to decode them, which is what allows a shorter PE.' },
    'LDPC': { expansion: 'low-density parity-check code', doc: 'c19',
      definition: 'A block code with codewords of 648, 1296 or 1944 bits: optional in HT and VHT, the main code of HE. The information bits are spread over N_CW codewords, which are shortened (N_shrt zero bits, not sent) and punctured (N_punc parity bits, not sent) to fit the available coded bits exactly. No tail bits are needed.' },
    'LDPC extra symbol segment': { doc: 'c27',
      definition: 'Added when too many parity bits would have to be punctured (decoding would suffer): the coded bits get one more segment — a grows by 1, or, if a was already 4, one more OFDM symbol is added with a = 1. Signalled in HE-SIG-A.' },
    'N_SD,short': { expansion: 'data subcarriers per segment of the last OFDM symbol', doc: 'c27',
      definition: 'Data subcarriers in each of the first three segments of the last OFDM symbol, looked up by RU size (60 for a 242-tone RU); the fourth segment gets the rest. N_DBPS,short = N_SD,short · N_BPSCS · N_SS · R bits fit in one segment.' },
    'N_Excess': { doc: 'c27', definition: 'Information bits left for the last OFDM symbol: mod(8·APEP_LENGTH + N_tail + N_service, N_DBPS). It decides a_init.' },
    'N_SYM,init': { doc: 'c27', definition: 'Number of data OFDM symbols before the LDPC extra symbol segment check: ceil((8·APEP_LENGTH + N_tail + N_service) / N_DBPS).' },
    'N_pld': { expansion: 'number of bits in the LDPC payload', doc: 'c19', definition: 'Information bits handed to the LDPC encoder: SERVICE + APEP + pre-FEC pad bits.' },
    'N_avbits': { expansion: 'number of available coded bits', doc: 'c19', definition: 'Coded bits that fit in the data OFDM symbols — in HE up to the a-th segment of the last symbol.' },
    'N_CW': { expansion: 'number of LDPC codewords', doc: 'c19', definition: 'How many LDPC codewords the payload is split into, chosen together with L_LDPC from N_avbits and N_pld.' },
    'L_LDPC': { expansion: 'LDPC codeword length', doc: 'c19', definition: '648, 1296 or 1944 bits, chosen from N_avbits and N_pld.' },
    'N_shrt': { expansion: 'number of shortening bits', doc: 'c19', definition: 'Zero information bits that fill the codewords up to N_CW · L_LDPC · R; they are removed before transmission.' },
    'N_punc': { expansion: 'number of punctured bits', doc: 'c19', definition: 'Parity bits removed so that the codewords fit into N_avbits. Too many of them trigger the LDPC extra symbol segment.' },
    'Resource unit': { expansion: 'RU', doc: 'c27',
      definition: 'A group of adjacent subcarriers (26, 52, 106, 242, 484, 996 or 2×996 tones) given to one user in an OFDMA PPDU. An HE SU PPDU uses the whole channel as one RU (242 tones at 20 MHz).' },
    'OFDMA': { expansion: 'orthogonal frequency division multiple access', doc: 'c27',
      definition: 'Several users in one PPDU, each on its own resource unit: downlink in an HE MU PPDU, uplink in HE TB PPDUs sent at the same time.' },
    'HE MU PPDU': { expansion: 'HE multi-user PPDU', doc: 'c27',
      definition: 'Downlink PPDU to several users at once (OFDMA and/or MU-MIMO). It adds HE-SIG-B, which tells each user its RU.' },
    'HE TB PPDU': { expansion: 'HE trigger-based PPDU', doc: 'c27',
      definition: 'Uplink PPDU a station sends in response to a Trigger frame, on the RU the AP assigned. Its HE-STF lasts 8 µs.' },
    'HE ER SU PPDU': { expansion: 'HE extended range SU PPDU', doc: 'c27',
      definition: 'Single-user PPDU for long range: HE-SIG-A is sent twice (four symbols, 16 µs) and the Data field uses only a 242- or 106-tone RU of a 20 MHz channel.' },
  },

  /* ---------------------------------------------------------------------------
   *  Built-in check table: published rates the calculators must reproduce.
   *  tolerance in Mbps. HE rows compare against the exact N_SD·N_BPSCS·R·N_SS/T_SYM
   *  with ±0.1 Mbps (published HE tables differ in rounding, e.g. 600.4 vs 600.5).
   * ------------------------------------------------------------------------- */
  checkTable: {
    // each row's `status` describes the published reference value (its sources), not the calculator
    rows: [
      { gen: 'nonHT', bw: 20, gi: 0.8, nss: 1, mod: 'BPSK',   R: '1/2', expectMbps: 6,     expectNDBPS: 24,  tol: 0.001, evidence: ['ns3-ofdm', 'vocal-11a', 'plan'], status: 'supported' },
      { gen: 'nonHT', bw: 20, gi: 0.8, nss: 1, mod: '64-QAM', R: '3/4', expectMbps: 54,    expectNDBPS: 216, tol: 0.001, evidence: ['ns3-ofdm', 'vocal-11a', 'plan'], status: 'supported' },
      { gen: 'HT',  bw: 20, gi: 0.8, nss: 1, mcs: 0, expectMbps: 6.5,   tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HT',  bw: 20, gi: 0.8, nss: 1, mcs: 7, expectMbps: 65,    tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HT',  bw: 20, gi: 0.4, nss: 1, mcs: 7, expectMbps: 72.2,  tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HT',  bw: 40, gi: 0.4, nss: 1, mcs: 7, expectMbps: 150,   tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HT',  bw: 40, gi: 0.4, nss: 2, mcs: 7, expectMbps: 300,   tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified', note: 'HT MCS 15' },
      { gen: 'VHT', bw: 20, gi: 0.8, nss: 1, mcs: 8, expectMbps: 78,    tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'VHT', bw: 80, gi: 0.4, nss: 1, mcs: 9, expectMbps: 433.3, tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'VHT', bw: 160, gi: 0.4, nss: 1, mcs: 9, expectMbps: 866.7, tol: 0.05, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HE',  bw: 20, gi: 3.2, nss: 1, mcs: 0,  expectMbps: 7.3,    tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HE',  bw: 20, gi: 0.8, nss: 1, mcs: 0,  expectMbps: 8.6,    tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HE',  bw: 20, gi: 0.8, nss: 1, mcs: 11, expectMbps: 143.4,  tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified' },
      { gen: 'HE',  bw: 80, gi: 0.8, nss: 1, mcs: 9,  expectMbps: 480.4,  tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified', note: 'fractional N_DBPS (6533.3)' },
      { gen: 'HE',  bw: 80, gi: 0.8, nss: 1, mcs: 11, expectMbps: 600.4,  tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified', note: 'fractional N_DBPS (8166.7); R&S lists 600.5' },
      { gen: 'HE',  bw: 160, gi: 0.8, nss: 2, mcs: 11, expectMbps: 2401.9, tol: 0.1, evidence: ['rs-rates', 'plan'], status: 'unverified', note: 'R&S lists 2402.0' },
    ],
  },
};

if (typeof module === 'object' && module.exports) module.exports = WIFI_STANDARDS;
