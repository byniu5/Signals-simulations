/* =============================================================================
 *  standards-data.js  —  every IEEE 802.11-derived number used by the Wi-Fi module
 * -----------------------------------------------------------------------------
 *  PURE DATA. No functions, no computed values: the calculators (calc.js) and the
 *  views derive everything from this object. A unit test fails if a function ever
 *  appears in here.
 *
 *  Value entries look like
 *      { value, unit?, status, evidence: [sourceId...], clause?, note? }
 *
 *  status
 *    'verified'    the exact value is stated by at least one public secondary source
 *                  found during research (see `evidence`) AND it matches an independent
 *                  check: a second source, arithmetic, or the value written down in the
 *                  pre-research plan before searching (source id 'plan'), OR it was supplied in
 *                  review (source kind 'reviewer-cited'; the reviewer's citation is in its title).
 *    'unverified'  anything else — please check these against the standard.
 *
 *  clause
 *    The IEEE text itself could NOT be read: ieee.org / mentor.ieee.org are blocked
 *    from the environment this was built in. Clause / table numbers below are only
 *    those quoted by secondary sources (edition noted) and are therefore never
 *    "verified" — see meta.clauseNumbersRead.
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
    'plan': { title: 'Value listed in the pre-research plan (prior knowledge), written before searching', kind: 'cross-check' },
    'arith': { title: 'Arithmetic consequence of other verified values (shown in the note)', kind: 'cross-check' },
    'ns3-ofdm': { title: 'ns-3 simulator, ofdm-phy.cc (cites IEEE 802.11-2016 cl. 17)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/non-ht/ofdm-phy.cc', kind: 'code' },
    'ns3-ht': { title: 'ns-3 simulator, ht-phy.cc (cites IEEE 802.11-2016 cl. 19)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/ht/ht-phy.cc', kind: 'code' },
    'ns3-vht': { title: 'ns-3 simulator, vht-phy.cc (cites IEEE 802.11-2016 cl. 21)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/vht/vht-phy.cc', kind: 'code' },
    'ns3-he': { title: 'ns-3 simulator, he-phy.cc (cites IEEE 802.11ax-2021 cl. 27)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-phy.cc', kind: 'code' },
    'ns3-heru': { title: 'ns-3 simulator, he-ru.cc (cites Tables 27-7..27-9 of IEEE 802.11ax-2021)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/model/he/he-ru.cc', kind: 'code' },
    'ns3-txdur': { title: 'ns-3 simulator, tx-duration-test.cc (TXTIME test vectors)', url: 'https://gitlab.com/nsnam/ns-3-dev/-/blob/master/src/wifi/test/tx-duration-test.cc', kind: 'code' },
    'keysight-ofdm': { title: 'Keysight 89600 VSA help: 802.11 OFDM Overview', url: 'https://helpfiles.keysight.com/csg/89600B/Webhelp/Subsystems/wlan-ofdm/content/ofdm_80211-overview.htm', kind: 'vendor' },
    'pat-legacy-sig': { title: 'US patent 10342042 (describes 802.11a SIG tone plan: -26..26, pilots ±7, ±21)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10342042', kind: 'patent' },
    'pat-ht-vht-pilots': { title: 'US patent 10447448 family (HT 40 MHz and VHT 80/160 MHz pilot indices)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10447448', kind: 'patent' },
    'pat-he-pilots-242': { title: 'USPTO patent full text returned by web search for the 242-tone RU pilot indices (exact patent number not recorded)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12294541', kind: 'patent' },
    'pat-he-pilots-80': { title: 'US patents 12167410 and 12587328 — ±18-based pilot set; per review this is the 802.11be (EHT) design, NOT 802.11ax. Kept for reference, not used as evidence.', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12167410', kind: 'patent' },
    'ieee-16-0623': { title: 'IEEE 802.11-16/0623r0, Table 26-32 (TGax draft numbering) — 80 MHz HE pilot indices. Supplied by the reviewer; not read by the author.', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-0623-00-00ax.docx', kind: 'reviewer-cited' },
    'mw-hesuconfig': { title: 'MathWorks WLAN Toolbox: wlanHESUConfig (nominal packet padding and PE durations). Supplied by the reviewer.', url: 'https://www.mathworks.com/help/wlan/ref/wlanhesuconfig.html', kind: 'reviewer-cited' },
    'review-2': { title: 'Second review pass (2026-10): VHT N_ES rule, N_SD,short table, L-SIG LENGTH rule — supplied by the reviewer', kind: 'reviewer-cited' },
    'ieee-11-0577': { title: 'IEEE 802.11-11/0577r0 — TGac draft list of excluded VHT-MCS / bandwidth / N_SS combinations (reviewer-cited; not read by the author)', kind: 'reviewer-cited' },
    'ieee-13-1002': { title: 'IEEE 802.11-13/1002r1, SB2 clause 22 comment resolution — max TXTIME (4095 + 3) x 4/3 + 20 = 5484 µs', url: 'https://mentor.ieee.org/802.11/dcn/13/11-13-1002-01-00ac-sb2-clause-22-comment-resolution.docx', kind: 'ieee-contribution' },
    'pat-format-detect': { title: 'US patents 10637706 family, 9025428 (HT-SIG QBPSK; VHT-SIG-A1 BPSK and VHT-SIG-A2 QBPSK for format detection)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10637706', kind: 'patent' },
    'paper-ht-detect': { title: 'A Novel Method to Detect the Frame-Formats in 802.11n (AMEII 2016): HT-SIG rotated 90° relative to L-SIG', url: 'https://atlantis-press.com/proceedings/ameii-16/25854744', kind: 'paper' },
    'pat-preamble-11a': { title: 'US patents 7852972 / 8923446 (802.11a training: 10 x 0.8 µs short + 1.6 µs GI + 2 x 3.2 µs long symbols, citing 802.11a-1999 17.3.3)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/7852972', kind: 'patent' },
    'pat-phase-rot': { title: 'US patent 10327172 family (per-20 MHz phase rotation: 40 MHz {1, j}; 80 MHz {1,-1,-1,-1})', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/10327172', kind: 'patent' },
    'keysight-nonht-dup': { title: 'Keysight help: 802.11ac Non-HT transmission (duplicate per 20 MHz with phase rotation)', url: 'https://helpfiles.keysight.com/csg/n7617/Content/Main/802.11ac%20NonHT%20Transmission.htm', kind: 'vendor' },
    'pat-padding': { title: 'US 2022/0053371 A1 (Newracom) and US 12096275 — reproduce the 802.11ax pre-FEC padding equations', url: 'https://patents.google.com/patent/US20220053371A1/en', kind: 'patent' },
    'pat-nsd-short': { title: 'US 2023/0261784 A1 — extended N_SD,short table for multi-RU (484+242 -> 180, 996+484 -> 360)', url: 'https://patents.google.com/patent/US20230261784A1/en', kind: 'patent' },
    'pat-pe': { title: 'US 2021/0360472 A1 and US 12598022 — nominal packet padding 0/8/16 us, nominal T_PE 4/8/12/16 us', url: 'https://patents.google.com/patent/US20210360472A1/en', kind: 'patent' },
    'pat-he-txtime': { title: 'US patent 11576207 — HE SU TXTIME = 20 + T_HE-PREAMBLE + N_SYM*T_SYM + T_PE + SignalExtension', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/11576207', kind: 'patent' },
    'ieee-16-1411': { title: 'IEEE 802.11-16/1411r1, TXTIME and RXTIME fixes (TGax draft era)', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-1411-01-00ax-txtime-and-rxtime-fixes.docx', kind: 'ieee-contribution' },
    'ieee-16-1341': { title: 'IEEE 802.11-16/1341r2, CR HE PHY introduction (LTF 3.2/6.4/12.8 us; GI 0.8/1.6/3.2 us)', url: 'https://mentor.ieee.org/802.11/dcn/16/11-16-1341-02-00ax-cr-he-phy-introduction-part-2.docx', kind: 'ieee-contribution' },
    'ieee-18-1460': { title: 'IEEE 802.11-18/1460r1, CR PHY capabilities part 2; and P802.11ax D0.2 cl. 26.3.10.4 (BCC limits)', url: 'https://mentor.ieee.org/802.11/dcn/18/11-18-1460-01-00ax-cr-phy-capabilities-part-2.docx', kind: 'ieee-contribution' },
    'ieee-07-2077': { title: 'IEEE 802.11-07/2077r2, LB97 PHY equations comment resolution (HT-mixed short GI TXTIME rounding)', url: 'https://mentor.ieee.org/802.11/dcn/07/11-07-2077-02-000n-lb97-phy-equations-comment-resolution.doc', kind: 'ieee-contribution' },
    'tgbe-ndbps': { title: 'IEEE 802.11 TGbe e-mail reflector: "Ndbps = floor(Ncbps*R)" (802.11be context)', url: 'https://grouper.ieee.org/groups/802/11/email/stds-802-11-tgbe/msg02428.html', kind: 'ieee-reflector' },
    'keysight-he-su': { title: 'Keysight help: 802.11ax carrier settings SU / Ext SU (GI + HE-LTF combinations)', url: 'https://helpfiles.keysight.com/csg/n5186/Content/WLAN/802_11ax%20Carrier%20Settings%20SU%20Ext%20SU%20NDP.htm', kind: 'vendor' },
    'silabs-gi-ltf': { title: 'Silicon Labs WiFi91x docs: 802.11ax GI and LTF', url: 'https://docs.silabs.com/wifi91xrcp/2.10.1/wifi91xrcp-developers-guide-wifi-configuration/802-11-ax-gi-and-ltf', kind: 'vendor' },
    'mw-vht-ppdu': { title: 'MathWorks WLAN Toolbox: VHT PPDU Structure (VHT-SIG-B in SU and MU; cites 802.11-2016 21.3.8.3.6)', url: 'https://www.mathworks.com/help/wlan/gs/vht-ppdu-structure.html', kind: 'vendor' },
    'mw-duration': { title: 'MathWorks WLAN Toolbox: Packet Size and Duration Dependencies (TXTIME in 19.4.3 / 21.4.3 of 802.11-2016)', url: 'https://www.mathworks.com/help/wlan/gs/packet-size-and-duration-dependencies.html', kind: 'vendor' },
    'rs-rates': { title: 'Rohde & Schwarz: Wi-Fi data rates (HT/VHT/HE MCS rate tables)', url: 'https://rs-nc.rohde-schwarz.com/en/products/wireless-lan/wi-fi-data-rates', kind: 'vendor' },
    'cts-ru': { title: 'CTS 160: 802.11ax OFDMA Resource Units (data/pilot split per RU)', url: 'https://www.cleartosend.net/802-11ax-ofdma-resource-units/', kind: 'article' },
    'wiki-difs': { title: 'Wikipedia: DCF Interframe Space (DIFS = SIFS + 2 x aSlotTime, per-PHY table)', url: 'https://en.wikipedia.org/wiki/DCF_Interframe_Space', kind: 'encyclopedia' },
    'wiki-sifs': { title: 'Wikipedia: Short Interframe Space (10 us at 2.4 GHz, 16 us at 5 GHz)', url: 'https://en.wikipedia.org/wiki/Short_Interframe_Space', kind: 'encyclopedia' },
    'arxiv-ldpc': { title: 'arXiv 2003.11234, Joint shortening and puncturing for structured LDPC codes (802.11n N_shrt, N_punc)', url: 'https://arxiv.org/pdf/2003.11234', kind: 'paper' },
    'pat-ldpc-extra': { title: 'US patent 12212413 (LDPC extra-symbol condition with 0.1 and 1.2 factors, longer-codeword variant)', url: 'https://image-ppubs.uspto.gov/dirsearch-public/print/downloadPdf/12212413', kind: 'patent' },
  },

  /* ---------------------------------------------------------------------------
   *  Constellations: N_BPSCS = number of coded bits per subcarrier per stream
   * ------------------------------------------------------------------------- */
  modulations: {
    'BPSK':     { N_BPSCS: { value: 1,  status: 'verified', evidence: ['arith', 'plan'], note: 'log2(2)' } },
    'QPSK':     { N_BPSCS: { value: 2,  status: 'verified', evidence: ['arith', 'plan'], note: 'log2(4)' } },
    '16-QAM':   { N_BPSCS: { value: 4,  status: 'verified', evidence: ['arith', 'plan'], note: 'log2(16)' } },
    '64-QAM':   { N_BPSCS: { value: 6,  status: 'verified', evidence: ['arith', 'plan'], note: 'log2(64)' } },
    '256-QAM':  { N_BPSCS: { value: 8,  status: 'verified', evidence: ['arith', 'plan'], note: 'log2(256)' } },
    '1024-QAM': { N_BPSCS: { value: 10, status: 'verified', evidence: ['arith', 'plan'], note: 'log2(1024)' } },
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
    status: 'verified', evidence: ['rs-rates', 'plan'],
    note: 'Cross-checked through the rate check table (rates reproduce the published HT/VHT/HE tables).',
  },

  /* ---------------------------------------------------------------------------
   *  Legacy (pre-HT) tone plan used by L-STF/L-LTF/L-SIG and the following SIG
   *  fields (HT-SIG, VHT-SIG-A, RL-SIG, HE-SIG-A): one 20 MHz 64-point plan,
   *  replicated in every 20 MHz subchannel, each copy multiplied by a phase
   *  rotation to keep the peak-to-average power ratio down.
   * ------------------------------------------------------------------------- */
  legacy: {
    subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'verified', evidence: ['keysight-ofdm', 'arith', 'plan'], note: '20 MHz / 64' },
    fftSizePer20MHz: { value: 64, status: 'verified', evidence: ['keysight-ofdm', 'plan'] },
    occupied: { value: [[-26, -1], [1, 26]], status: 'verified', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
    pilots: { value: [-21, -7, 7, 21], status: 'verified', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
    subchannelOffsets: {
      value: { 20: [0], 40: [-32, 32], 80: [-96, -32, 32, 96], 160: [-224, -160, -96, -32, 32, 96, 160, 224] },
      status: 'verified', evidence: ['arith', 'keysight-nonht-dup'],
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
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'verified', evidence: ['keysight-ofdm', 'arith', 'plan'] },
        T_DFT: { value: 3.2, unit: 'µs', status: 'verified', evidence: ['ns3-ofdm', 'arith', 'plan'], note: '1 / 312.5 kHz; ns-3: symbol 4 µs = 3.2 + 0.8' },
        guardIntervals: { value: [0.8], unit: 'µs', status: 'verified', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan'] },
        fftSize: { value: { 20: 64 }, status: 'verified', evidence: ['keysight-ofdm', 'plan'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-26, -1], [1, 26]], status: 'verified', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
          pilots: { value: [-21, -7, 7, 21], status: 'verified', evidence: ['pat-legacy-sig', 'keysight-ofdm', 'plan'] },
          N_SD: { value: 48, status: 'verified', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan'] },
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
        status: 'verified', evidence: ['ns3-ofdm', 'plan'],
      },
      lsigBits: {
        value: [{ name: 'RATE', bits: 4 }, { name: 'Reserved', bits: 1 }, { name: 'LENGTH', bits: 12 }, { name: 'Parity', bits: 1 }, { name: 'Tail', bits: 6 }],
        status: 'unverified', evidence: ['plan'], note: '24 bits = one BPSK rate-1/2 OFDM symbol (48 coded bits on 48 data subcarriers).',
      },
      maxPsduOctets: { value: 4095, unit: 'octet', status: 'verified', evidence: ['ieee-13-1002', 'mw-duration', 'plan'], note: 'largest value of the 12-bit LENGTH field (used in the 5484 µs maximum-TXTIME derivation)' },
      payloadField: { name: 'LENGTH', term: 'LENGTH', label: 'PSDU length' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'verified', evidence: ['ns3-ofdm', 'plan'], note: 'SERVICE field' },
        N_tail: { value: 6, unit: 'bit', status: 'verified', evidence: ['ns3-ofdm', 'plan'], note: 'BCC tail per encoder' },
      },
      fields: [
        { name: 'L-STF', alias: 'short training field (Clause 17: PHY preamble, short training symbols)', toneplan: 'legacy',
          duration: { value: 8, unit: 'µs', status: 'verified', evidence: ['pat-preamble-11a', 'ns3-ofdm', 'plan'] },
          structure: { value: { shortTrainingSymbols: 10, each: 0.8 }, unit: 'µs', status: 'verified', evidence: ['pat-preamble-11a', 'plan'] } },
        { name: 'L-LTF', alias: 'long training field (Clause 17: PHY preamble, long training symbols)', toneplan: 'legacy',
          duration: { value: 8, unit: 'µs', status: 'verified', evidence: ['pat-preamble-11a', 'ns3-ofdm', 'plan'] },
          structure: { value: { gi2: 1.6, longTrainingSymbols: 2, each: 3.2 }, unit: 'µs', status: 'verified', evidence: ['pat-preamble-11a', 'plan'] } },
        { name: 'L-SIG', alias: 'SIGNAL field (Clause 17 name)', toneplan: 'legacy',
          duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-ofdm', 'keysight-ofdm', 'plan'], note: 'one OFDM symbol, BPSK rate 1/2' } },
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
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'verified', evidence: ['arith', 'plan'], note: '40 MHz / 128 = 20 MHz / 64' },
        T_DFT: { value: 3.2, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'], note: 'ns-3: symbol = 3200 ns + GI' },
        guardIntervals: { value: [0.8, 0.4], unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'], note: '0.4 µs = short GI' },
        fftSize: { value: { 20: 64, 40: 128 }, status: 'verified', evidence: ['arith', 'plan'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-28, -1], [1, 28]], status: 'verified', evidence: ['arith', 'plan'], note: '52 data + 4 pilots = 56 = ±1..±28 with one DC null' },
          pilots: { value: [-21, -7, 7, 21], status: 'unverified', evidence: ['plan'], note: 'same positions as Non-HT; no source found for HT 20 MHz specifically' },
          N_SD: { value: 52, status: 'verified', evidence: ['ns3-ht', 'plan'] },
        },
        40: {
          occupied: { value: [[-58, -2], [2, 58]], status: 'verified', evidence: ['arith', 'plan'], note: '108 + 6 = 114 = ±2..±58 with 3 DC nulls' },
          pilots: { value: [-53, -25, -11, 11, 25, 53], status: 'verified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 108, status: 'verified', evidence: ['ns3-ht', 'plan'] },
        },
      },
      maxMcsPerStream: 7,
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'verified', evidence: ['ns3-ht', 'plan'],
        note: 'Number of HT-LTFs for N_STS (no STBC, no extension LTFs).' },
      encoders: {
        value: { ndbpsPerEncoder: 1080 }, status: 'unverified', evidence: ['review-2', 'ns3-ht'],
        note: 'N_ES = 2 when N_DBPS > 1080 (= ceil(N_DBPS / 1080) for N_SS <= 4). ns-3\'s 320/350 Mb/s rate thresholds give the same N_ES for every HT MCS with N_SS <= 4.',
      },
      maxPsduOctets: { value: 65535, unit: 'octet', status: 'unverified', evidence: ['plan'], note: '16-bit HT Length subfield of HT-SIG' },
      payloadField: { name: 'HT Length', term: 'HT Length', label: 'PSDU length' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'verified', evidence: ['ns3-ht', 'plan'] },
        N_tail: { value: 6, unit: 'bit per encoder', status: 'verified', evidence: ['ns3-ht', 'plan'], note: '6 x N_ES (ns-3: equation 19-32)' },
      },
      txtime: {
        shortGiRounding: { value: true, status: 'verified', evidence: ['ieee-07-2077', 'mw-duration', 'plan'],
          note: 'HT-mixed: with short GI the data duration in TXTIME is rounded up to a multiple of 4 µs to align ' +
            'with legacy symbol boundaries. (ns-3 does not apply this rounding.)' },
        legacySymbol: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'HT-SIG', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'], note: 'HT-SIG1 + HT-SIG2' },
          modulation: { value: ['QBPSK', 'QBPSK'], status: 'verified', evidence: ['paper-ht-detect', 'pat-format-detect', 'plan'],
            note: 'BPSK rotated by 90° relative to L-SIG: lets a receiver recognise an HT-mixed PPDU right after L-SIG.' } },
        { name: 'HT-STF', duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'] } },
        { name: 'HT-LTF', count: 'N_LTF', durationEach: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'] } },
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
        subcarrierSpacingKHz: { value: 312.5, unit: 'kHz', status: 'verified', evidence: ['arith', 'plan'] },
        T_DFT: { value: 3.2, unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'] },
        guardIntervals: { value: [0.8, 0.4], unit: 'µs', status: 'verified', evidence: ['ns3-ht', 'plan'] },
        fftSize: { value: { 20: 64, 40: 128, 80: 256, 160: 512 }, status: 'verified', evidence: ['arith', 'plan'] },
      },
      toneplan: {
        20: { sameAs: 'HT' },
        40: { sameAs: 'HT' },
        80: {
          occupied: { value: [[-122, -2], [2, 122]], status: 'verified', evidence: ['arith', 'plan'], note: '234 + 8 = 242 = ±2..±122 with 3 DC nulls' },
          pilots: { value: [-103, -75, -39, -11, 11, 39, 75, 103], status: 'verified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 234, status: 'verified', evidence: ['ns3-vht', 'plan'] },
        },
        160: {
          occupied: { value: [[-250, -130], [-126, -6], [6, 126], [130, 250]], status: 'unverified', evidence: ['plan'],
            note: 'Two 80 MHz plans at ±128 (4 x 121 = 484 = 468 + 16): consistent arithmetic, but index ranges not found in a source.' },
          pilots: { value: [-231, -203, -167, -139, -117, -89, -53, -25, 25, 53, 89, 117, 139, 167, 203, 231], status: 'verified', evidence: ['pat-ht-vht-pilots', 'plan'] },
          N_SD: { value: 468, status: 'verified', evidence: ['ns3-vht', 'plan'] },
        },
      },
      maxMcs: 9,
      /* MCS / bandwidth / N_SS combinations that the VHT MCS tables do not define */
      exclusions: [
        { bw: 20, mcs: 9, nss: [1, 2, 4], status: 'unverified', evidence: ['ieee-11-0577', 'ns3-vht'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
        { bw: 80, mcs: 6, nss: [3], status: 'unverified', evidence: ['ieee-11-0577', 'ns3-vht'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
        { bw: 160, mcs: 9, nss: [3], status: 'unverified', evidence: ['ieee-11-0577', 'ns3-vht'], note: 'supported by IEEE 11-11/0577r0 draft list + ns-3 N_ES rule; standard table not read' },
      ],
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'verified', evidence: ['ns3-ht', 'plan'],
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
        status: 'verified', evidence: ['review-2', 'ns3-vht'],
        note: 'N_ES = ceil(N_DBPS / 2160) plus the explicit overrides of ns-3 m_exceptionsMap (derived there from Tables 21-30..21-61 of 802.11-2016). Same as ns-3\'s 540 / 600 Mb/s rate rule (N_DBPS/4/540 = N_DBPS/3.6/600 = N_DBPS/2160).',
      },
      maxPsduOctets: { value: 1048575, unit: 'octet', status: 'unverified', evidence: ['plan'], note: 'APEP_LENGTH upper bound; in practice the 5484 µs maximum PPDU duration limits it first' },
      payloadField: { name: 'APEP_LENGTH', term: 'APEP_LENGTH', label: 'APEP length' },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'verified', evidence: ['ns3-vht', 'plan'] },
        N_tail: { value: 6, unit: 'bit per encoder', status: 'verified', evidence: ['ns3-vht', 'plan'] },
      },
      txtime: {
        shortGiRounding: { value: true, status: 'unverified', evidence: ['mw-duration', 'plan'],
          note: 'Same 4 µs alignment as HT-mixed expected for VHT (TXTIME eq. in 21.4.3 of 802.11-2016 per MathWorks); not confirmed.' },
        legacySymbol: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-vht', 'plan'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'VHT-SIG-A', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'verified', evidence: ['ns3-vht', 'plan'], note: 'VHT-SIG-A1 + VHT-SIG-A2' },
          modulation: { value: ['BPSK', 'QBPSK'], status: 'verified', evidence: ['pat-format-detect', 'plan'],
            note: 'VHT-SIG-A1 looks like a Non-HT/HT receiver would expect (BPSK); VHT-SIG-A2 is rotated by 90° (QBPSK), which identifies a VHT PPDU.' } },
        { name: 'VHT-STF', duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-vht', 'plan'] } },
        { name: 'VHT-LTF', count: 'N_LTF', durationEach: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-vht', 'plan'] } },
        { name: 'VHT-SIG-B',
          duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['mw-vht-ppdu', 'ns3-vht', 'plan'],
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
      payloadField: { name: 'APEP_LENGTH', term: 'APEP_LENGTH', label: 'APEP length' },
      ofdm: {
        subcarrierSpacingKHz: { value: 78.125, unit: 'kHz', status: 'verified', evidence: ['ns3-he', 'arith', 'plan'], note: '1 / 12.8 µs = 20 MHz / 256' },
        T_DFT: { value: 12.8, unit: 'µs', status: 'verified', evidence: ['ns3-he', 'plan'], note: 'ns-3: symbol = 12800 ns + GI' },
        guardIntervals: { value: [0.8, 1.6, 3.2], unit: 'µs', status: 'verified', evidence: ['ieee-16-1341', 'plan'] },
        fftSize: { value: { 20: 256, 40: 512, 80: 1024, 160: 2048 }, status: 'verified', evidence: ['arith', 'plan'] },
      },
      toneplan: {
        20: {
          occupied: { value: [[-122, -2], [2, 122]], status: 'verified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-7 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-116, -90, -48, -22, 22, 48, 90, 116], status: 'unverified', evidence: ['pat-he-pilots-242', 'plan'],
            note: 'Stated by one patent; marked unverified in review (not to be derived from the 80 MHz set).' },
          N_SD: { value: 234, status: 'verified', evidence: ['ns3-he', 'cts-ru', 'plan'] },
        },
        40: {
          occupied: { value: [[-244, -3], [3, 244]], status: 'verified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-8 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-238, -212, -170, -144, -104, -78, -36, -10, 10, 36, 78, 104, 144, 170, 212, 238], status: 'unverified', evidence: ['plan'],
            note: 'Value from the pre-research plan only; no source found.' },
          N_SD: { value: 468, status: 'verified', evidence: ['ns3-he', 'cts-ru', 'plan'] },
        },
        80: {
          occupied: { value: [[-500, -3], [3, 500]], status: 'verified', evidence: ['ns3-heru', 'plan'], clause: 'Table 27-9 (802.11ax-2021, per ns-3)' },
          pilots: { value: [-468, -400, -334, -266, -226, -158, -92, -24, 24, 92, 158, 226, 266, 334, 400, 468], status: 'verified', evidence: ['ieee-16-0623', 'plan'],
            clause: 'Table 26-32 of TGax draft (per IEEE 11-16/0623r0, reviewer-cited)',
            note: 'Corrected in review. The ±18-based set found in patents is the 802.11be design.' },
          N_SD: { value: 980, status: 'verified', evidence: ['ns3-he', 'cts-ru', 'plan'] },
        },
        160: {
          occupied: { value: [[-1012, -515], [-509, -12], [12, 509], [515, 1012]], status: 'verified', evidence: ['ns3-heru', 'plan'] },
          pilots: { value: [-980, -912, -846, -778, -738, -670, -604, -536, -488, -420, -354, -286, -246, -178, -112, -44,
                             44, 112, 178, 246, 286, 354, 420, 488, 536, 604, 670, 738, 778, 846, 912, 980],
            status: 'verified', evidence: ['ieee-16-0623'], note: 'The 80 MHz set shifted by −512 and +512 (rule supplied in review).' },
          N_SD: { value: 1960, status: 'verified', evidence: ['ns3-he', 'plan'] },
        },
      },
      maxMcs: 11,
      /* RU = resource unit, used for OFDMA in HE MU and HE TB PPDUs (illustration only — HE SU uses the full band) */
      resourceUnits: {
        tones: {
          value: { 26: { data: 24, pilot: 2 }, 52: { data: 48, pilot: 4 }, 106: { data: 102, pilot: 4 },
                   242: { data: 234, pilot: 8 }, 484: { data: 468, pilot: 16 }, 996: { data: 980, pilot: 16 } },
          status: 'verified', evidence: ['ns3-he', 'cts-ru', 'plan'],
          note: 'ns-3 gives the data counts; pilot counts = RU size - data (and CTS 160 for 242/484/996).',
        },
        countPerBandwidth: {
          value: { 20: { 26: 9, 52: 4, 106: 2, 242: 1 },
                   40: { 26: 18, 52: 8, 106: 4, 242: 2, 484: 1 },
                   80: { 26: 37, 52: 16, 106: 8, 242: 4, 484: 2, 996: 1 },
                   160: { 26: 74, 52: 32, 106: 16, 242: 8, 484: 4, 996: 2 } },
          status: 'verified', evidence: ['ns3-heru', 'plan'],
        },
      },
      N_LTF: { value: { 1: 1, 2: 2, 3: 4, 4: 4 }, status: 'unverified', evidence: ['plan'],
        note: 'Assumed equal to the VHT mapping; ns-3 caps HE-LTFs at 8 but does not show the mapping.' },
      heLtf: {
        symbolWithoutGi: { value: { '1x': 3.2, '2x': 6.4, '4x': 12.8 }, unit: 'µs', status: 'verified', evidence: ['ieee-16-1341', 'plan'] },
        /* HE-LTF type + GI pairs offered for an HE SU PPDU */
        allowedWithGi: {
          value: [{ ltf: '1x', gi: 0.8 }, { ltf: '2x', gi: 0.8 }, { ltf: '2x', gi: 1.6 }, { ltf: '4x', gi: 3.2 }],
          status: 'verified', evidence: ['keysight-he-su', 'silabs-gi-ltf'],
          note: '4x HE-LTF + 0.8 µs GI also exists but only under extra conditions (DCM/STBC, or HE ER SU) — not offered here.',
        },
      },
      codingRule: {
        value: { bccMaxNss: 4, bccMaxMcs: 9, bccMaxRuTones: 242 },
        status: 'verified', evidence: ['ieee-18-1460'],
        clause: 'P802.11ax D0.2 26.3.10.4 (draft numbering); the final 802.11ax-2021 clause number was not read',
        note: 'BCC may only be used for MCS 0-9, N_SS <= 4 and RU <= 242 tones; LDPC otherwise. This app uses LDPC ' +
          'for every HE configuration (stated simplification).',
      },
      dataField: {
        N_service: { value: 16, unit: 'bit', status: 'verified', evidence: ['pat-padding', 'plan'] },
        N_tail: { value: 0, unit: 'bit', status: 'verified', evidence: ['pat-padding', 'plan'], note: 'LDPC has no tail bits (N_tail = 6·N_ES only for BCC).' },
        N_DBPS_rounding: { value: 'floor', status: 'unverified', evidence: ['tgbe-ndbps'],
          note: 'N_DBPS = floor(N_CBPS · R). Stated on the TGbe (802.11be) reflector only. None of the 72 ns-3 HE TXTIME ' +
            'vectors distinguishes floor from exact (see tests). Payloads that would: HE 80 MHz MCS 9 APEP_LENGTH 2448, ' +
            'MCS 11 APEP_LENGTH 5102 (1 SS, GI 0.8 µs) — check one of these in another tool.' },
        N_SD_short: {
          value: { 26: 6, 52: 12, 106: 24, 242: 60, 484: 120, 996: 240, 1992: 492 },
          status: 'verified', evidence: ['review-2', 'pat-nsd-short'],
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
          status: 'verified', evidence: ['pat-padding', 'plan'], note: 'Secondary: patents quoting draft text (m_STBC = 1 here).',
        },
        aRange: { value: [1, 2, 3, 4], status: 'verified', evidence: ['pat-pe', 'plan'], note: 'a = pre-FEC padding factor' },
      },
      packetExtension: {
        nominalPacketPadding: { value: [0, 8, 16], unit: 'µs', status: 'verified', evidence: ['pat-pe', 'plan'] },
        /* nominal T_PE indexed [a-1] for each nominal packet padding */
        T_PE: {
          value: { 0: [0, 0, 0, 0], 8: [0, 0, 4, 8], 16: [4, 8, 12, 16] },
          unit: 'µs', status: 'verified', evidence: ['mw-hesuconfig', 'pat-pe', 'plan'],
          note: 'Index = a − 1. Values confirmed in review from MathWorks wlanHESUConfig; the 16 µs row also matches the patents.',
        },
      },
      txtime: {
        formula: { value: 'TXTIME = 20 µs + T_HE-PREAMBLE + N_SYM·T_SYM + T_PE + SignalExtension; T_HE-PREAMBLE = T_RL-SIG + T_HE-SIG-A + T_HE-STF + N_HE-LTF·T_HE-LTF,SYM',
          status: 'verified', evidence: ['pat-he-txtime', 'ieee-16-1411', 'plan'] },
      },
      fields: [
        { name: 'L-STF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-LTF', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'L-SIG', toneplan: 'legacy', ref: 'nonHT' },
        { name: 'RL-SIG', toneplan: 'legacy',
          duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-he', 'plan'], note: 'repeated L-SIG (ns-3: L-SIG + RL-SIG = 8 µs)' } },
        { name: 'HE-SIG-A', toneplan: 'legacy', symbols: 2,
          duration: { value: 8, unit: 'µs', status: 'verified', evidence: ['ns3-he', 'plan'], note: 'HE SU; 16 µs in an HE ER SU PPDU' } },
        { name: 'HE-STF', duration: { value: 4, unit: 'µs', status: 'verified', evidence: ['ns3-he', 'plan'], note: 'HE SU/MU; 8 µs in an HE TB PPDU' } },
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
    nonHtLength: { value: 'PSDU length in octets', status: 'verified', evidence: ['review-2', 'plan'] },
    spoofRule: {
      value: { legacyPreamble: 20, symbol: 4, octetsPerSymbol: 3, subtract: 3 },
      status: 'unverified', evidence: ['review-2', 'ieee-13-1002'],
      note: 'LENGTH = ceil((TXTIME − SignalExtension − 20) / 4) · 3 − 3 for HT, VHT and HE. Reviewer-supplied; consistent with ' +
        'the 5484 µs maximum (LENGTH = 4095). Subtracting the 2.4 GHz signal extension, and an extra HE-specific offset, are not confirmed.',
    },
    maxLength: { value: 4095, unit: 'octet', status: 'verified', evidence: ['ieee-13-1002', 'mw-duration', 'plan'] },
    maxPpdu: { value: 5484, unit: 'µs', status: 'verified', evidence: ['ieee-13-1002', 'mw-duration', 'arith'],
      note: '(4095 + 3) / 3 · 4 + 20 = 5484 µs: the longest duration an L-SIG LENGTH can announce (HT, VHT, HE PPDUs).' },
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
      status: 'verified', evidence: ['arxiv-ldpc', 'plan'],
    },
    extraSymbolCondition: {
      value: { puncturedFraction: 0.1, shorteningFactor: 1.2 },
      status: 'unverified', evidence: ['pat-ldpc-extra', 'plan'],
      note: 'Extra symbol (HT) / LDPC extra symbol segment (HE) if N_punc > 0.1·N_CW·L_LDPC·(1 − R) AND ' +
        'N_shrt < 1.2·N_punc·R/(1 − R). The patent uses this form for a longer-codeword variant.',
    },
  },

  /* ---------------------------------------------------------------------------
   *  Interframe timing (per band)
   * ------------------------------------------------------------------------- */
  interframe: {
    bands: {
      '5':   { SIFS: { value: 16, unit: 'µs', status: 'verified', evidence: ['wiki-sifs', 'wiki-difs', 'plan'] },
               aSlotTime: { value: { short: 9 }, unit: 'µs', status: 'verified', evidence: ['wiki-difs', 'plan'] } },
      '2.4': { SIFS: { value: 10, unit: 'µs', status: 'verified', evidence: ['wiki-sifs', 'wiki-difs', 'plan'] },
               aSlotTime: { value: { short: 9, long: 20 }, unit: 'µs', status: 'verified', evidence: ['wiki-difs', 'plan'] } },
      '6':   { SIFS: { value: 16, unit: 'µs', status: 'unverified', evidence: ['plan'], note: 'assumed same as 5 GHz' },
               aSlotTime: { value: { short: 9 }, unit: 'µs', status: 'unverified', evidence: ['plan'] } },
    },
    difsRule: { value: 'DIFS = SIFS + 2 × aSlotTime', status: 'verified', evidence: ['wiki-difs', 'plan'] },
    signalExtension: {
      value: { '2.4': 6, '5': 0, '6': 0 }, unit: 'µs', status: 'verified', evidence: ['ns3-ofdm', 'ns3-txdur', 'plan'],
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
    'LENGTH': { doc: 'c17', definition: 'The 12-bit L-SIG subfield. In a Non-HT PPDU it is the PSDU length in octets. In HT, VHT and HE PPDUs it is set to ceil((TXTIME − 20 µs)/4 µs)·3 − 3, so that a legacy receiver — which assumes 6 Mb/s, i.e. 3 octets per 4 µs symbol — computes the true duration and stays quiet for it.' },
    'Data field': { doc: 'c17',
      definition: 'The part of the PPDU after the preamble and signal fields: SERVICE field + PSDU + tail bits + pad bits, coded and modulated onto N_SYM OFDM symbols.' },
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
    'Band': { doc: 'c17', definition: 'Frequency band of operation: 5 GHz (802.11a, Clause 17) or 2.4 GHz (802.11g ERP-OFDM, Clause 18). The band changes SIFS, aSlotTime and the signal extension.' },
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
    'MCS': { expansion: 'modulation and coding scheme', doc: 'c19', definition: 'Index for a combination of modulation and coding rate (HT and later). Non-HT has no MCS — it signals a data rate in RATE.' },
  },

  /* ---------------------------------------------------------------------------
   *  Built-in check table: published rates the calculators must reproduce.
   *  tolerance in Mbps. HE rows compare against the exact N_SD·N_BPSCS·R·N_SS/T_SYM
   *  with ±0.1 Mbps (published HE tables differ in rounding, e.g. 600.4 vs 600.5).
   * ------------------------------------------------------------------------- */
  checkTable: {
    status: 'verified',
    rows: [
      { gen: 'nonHT', bw: 20, gi: 0.8, nss: 1, mod: 'BPSK',   R: '1/2', expectMbps: 6,     expectNDBPS: 24,  tol: 0.001, evidence: ['ns3-ofdm', 'plan'] },
      { gen: 'nonHT', bw: 20, gi: 0.8, nss: 1, mod: '64-QAM', R: '3/4', expectMbps: 54,    expectNDBPS: 216, tol: 0.001, evidence: ['ns3-ofdm', 'plan'] },
      { gen: 'HT',  bw: 20, gi: 0.8, nss: 1, mcs: 0, expectMbps: 6.5,   tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'HT',  bw: 20, gi: 0.8, nss: 1, mcs: 7, expectMbps: 65,    tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'HT',  bw: 20, gi: 0.4, nss: 1, mcs: 7, expectMbps: 72.2,  tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'HT',  bw: 40, gi: 0.4, nss: 1, mcs: 7, expectMbps: 150,   tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'HT',  bw: 40, gi: 0.4, nss: 2, mcs: 7, expectMbps: 300,   tol: 0.05, evidence: ['rs-rates', 'plan'], note: 'HT MCS 15' },
      { gen: 'VHT', bw: 20, gi: 0.8, nss: 1, mcs: 8, expectMbps: 78,    tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'VHT', bw: 80, gi: 0.4, nss: 1, mcs: 9, expectMbps: 433.3, tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'VHT', bw: 160, gi: 0.4, nss: 1, mcs: 9, expectMbps: 866.7, tol: 0.05, evidence: ['rs-rates', 'plan'] },
      { gen: 'HE',  bw: 20, gi: 3.2, nss: 1, mcs: 0,  expectMbps: 7.3,    tol: 0.1, evidence: ['rs-rates', 'plan'] },
      { gen: 'HE',  bw: 20, gi: 0.8, nss: 1, mcs: 0,  expectMbps: 8.6,    tol: 0.1, evidence: ['rs-rates', 'plan'] },
      { gen: 'HE',  bw: 20, gi: 0.8, nss: 1, mcs: 11, expectMbps: 143.4,  tol: 0.1, evidence: ['rs-rates', 'plan'] },
      { gen: 'HE',  bw: 80, gi: 0.8, nss: 1, mcs: 9,  expectMbps: 480.4,  tol: 0.1, evidence: ['rs-rates', 'plan'], note: 'fractional N_DBPS (6533.3)' },
      { gen: 'HE',  bw: 80, gi: 0.8, nss: 1, mcs: 11, expectMbps: 600.4,  tol: 0.1, evidence: ['rs-rates', 'plan'], note: 'fractional N_DBPS (8166.7); R&S lists 600.5' },
      { gen: 'HE',  bw: 160, gi: 0.8, nss: 2, mcs: 11, expectMbps: 2401.9, tol: 0.1, evidence: ['rs-rates', 'plan'], note: 'R&S lists 2402.0' },
    ],
  },
};

if (typeof module === 'object' && module.exports) module.exports = WIFI_STANDARDS;
