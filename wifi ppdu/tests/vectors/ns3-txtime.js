/* TXTIME test vectors copied VERBATIM from ns-3 src/wifi/test/tx-duration-test.cc
 * (TxDurationTest::DoRun). Values are not edited; where ns-3's model departs from
 * the standard, the departure is recorded below as a named exception with sources
 * and the test harness applies it.
 *
 * Each vector: [mcs (or rate Mb/s for nonHT), bandwidth MHz, GI µs, { payloadOctets: TXTIME µs }]
 * All at 5 GHz, 1 spatial stream. Payloads 1536, 76 and 14 octets.
 */
'use strict';

module.exports = {
  source: 'ns3-txdur',
  band: '5',
  vectors: {
    nonHT: [
      [54, 20, 0.8, { 1536: 248, 76: 32, 14: 24 }],
    ],
    HT: [
      [7, 20, 0.8, { 1536: 228, 76: 48, 14: 40 }],
      [0, 20, 0.4, { 1536: 1742.4, 76: 126, 14: 57.6 }],
      [6, 20, 0.4, { 1536: 226.8, 76: 46.8, 14: 39.6 }],
      [7, 40, 0.8, { 1536: 128, 76: 44, 14: 40 }],
      [7, 40, 0.4, { 1536: 118.8, 76: 43.2, 14: 39.6 }],
    ],
    VHT: [
      [8, 20, 0.8, { 1536: 196, 76: 48, 14: 40 }],
      [8, 20, 0.4, { 1536: 180, 76: 46.8, 14: 39.6 }],
      [9, 40, 0.8, { 1536: 108, 76: 40, 14: 40 }],
      [9, 40, 0.4, { 1536: 100.8, 76: 39.6, 14: 39.6 }],
      [0, 80, 0.8, { 1536: 460, 76: 60, 14: 44 }],
      [0, 80, 0.4, { 1536: 417.6, 76: 57.6, 14: 43.2 }],
      [9, 80, 0.8, { 1536: 68, 76: 40, 14: 40 }],
      [9, 80, 0.4, { 1536: 64.8, 76: 39.6, 14: 39.6 }],
      [8, 160, 0.8, { 1536: 56, 76: 40, 14: 40 }],
      [8, 160, 0.4, { 1536: 54, 76: 39.6, 14: 39.6 }],
    ],
    HE: [
      [0, 20, 0.8, { 1536: 1485.6, 76: 125.6, 14: 71.2 }],
      [0, 40, 0.8, { 1536: 764.8, 76: 84.8, 14: 57.6 }],
      [0, 80, 0.8, { 1536: 397.6, 76: 71.2, 14: 57.6 }],
      [0, 160, 0.8, { 1536: 220.8, 76: 57.6, 14: 57.6 }],
      [0, 20, 1.6, { 1536: 1570.4, 76: 130.4, 14: 72.8 }],
      [0, 40, 1.6, { 1536: 807.2, 76: 87.2, 14: 58.4 }],
      [0, 80, 1.6, { 1536: 418.4, 76: 72.8, 14: 58.4 }],
      [0, 160, 1.6, { 1536: 231.2, 76: 58.4, 14: 58.4 }],
      [0, 20, 3.2, { 1536: 1740, 76: 140, 14: 76 }],
      [0, 40, 3.2, { 1536: 892, 76: 92, 14: 60 }],
      [0, 80, 3.2, { 1536: 460, 76: 76, 14: 60 }],
      [0, 160, 3.2, { 1536: 252, 76: 60, 14: 60 }],
      [11, 20, 0.8, { 1536: 139.2, 76: 57.6, 14: 57.6 }],
      [11, 40, 0.8, { 1536: 98.4, 76: 57.6, 14: 57.6 }],
      [11, 80, 0.8, { 1536: 71.2, 76: 57.6, 14: 57.6 }],
      [11, 160, 0.8, { 1536: 57.6, 76: 57.6, 14: 57.6 }],
      [11, 20, 1.6, { 1536: 144.8, 76: 58.4, 14: 58.4 }],
      [11, 40, 1.6, { 1536: 101.6, 76: 58.4, 14: 58.4 }],
      [11, 80, 1.6, { 1536: 72.8, 76: 58.4, 14: 58.4 }],
      [11, 160, 1.6, { 1536: 58.4, 76: 58.4, 14: 58.4 }],
      [11, 20, 3.2, { 1536: 156, 76: 60, 14: 60 }],
      [11, 40, 3.2, { 1536: 108, 76: 60, 14: 60 }],
      [11, 80, 3.2, { 1536: 76, 76: 60, 14: 60 }],
      [11, 160, 3.2, { 1536: 60, 76: 60, 14: 60 }],
    ],
  },

  /* Named departures of the ns-3 model from the standard. `sources` are ids in
   * standards-data.js. The harness implements each id; the vectors stay untouched. */
  exceptions: {
    'ns3-vht-sigb-su-omitted': {
      appliesTo: { gen: ['VHT'] },
      description: 'ns-3 includes the 4 µs VHT-SIG-B field only in VHT MU PPDUs; a VHT SU PPDU also carries VHT-SIG-B.',
      standardBehaviour: 'add the VHT-SIG-B duration (4 µs) to the ns-3 value',
      sources: ['ns3-vht', 'mw-vht-ppdu'],
    },
    'ns3-no-short-gi-rounding': {
      appliesTo: { gen: ['HT', 'VHT'], gi: [0.4] },
      description: 'ns-3 uses N_SYM x 3.6 µs for the data part; HT-mixed TXTIME rounds it up to a multiple of 4 µs ' +
        '(the VHT rounding is still unverified in the data file).',
      standardBehaviour: 'round the data-field duration up to the next multiple of 4 µs',
      sources: ['ieee-07-2077', 'mw-duration'],
    },
    'ns3-he-simplified-model': {
      appliesTo: { gen: ['HE'] },
      description: 'ns-3 HE SU durations use a fixed 8 µs HE-LTF, the BCC symbol count (6 tail bits, no pre-FEC padding / ' +
        'a-factor, no LDPC extra symbol segment) and no packet extension. They cannot be compared with the LDPC calculator; ' +
        'they are reproduced with that model instead, which still checks N_SD, T_SYM, the preamble fields and the N_DBPS convention.',
      standardBehaviour: 'not comparable — reproduce with the ns-3 model',
      sources: ['ns3-he'],
    },
  },
};
