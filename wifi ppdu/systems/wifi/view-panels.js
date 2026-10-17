/* systems/wifi/view-panels.js — output numbers, built-in check table, field information. */
(function (root) {
  'use strict';
  const { h, fmt, term } = root.Dom;
  const V = root.WifiViews;

  /** Output panel: the per-symbol and per-PPDU numbers with their formulas. */
  V.outputs = function (a) {
    const p = a.params, sy = a.symbols, tName = V.tUsefulName(a);
    const ltfItem = a.timeline.items.find((i) => i.count && i.kind === 'training');
    const row = (label, value, formula) => h('tr', null, h('td', null, label, formula ? h('div', { class: 'f' }, formula) : null), h('td', null, value));
    const rows = [
      row(term('FFT size'), p.N_FFT),
      row(term('Δ_F'), fmt(p.spacingKHz, 3) + ' kHz'),
      row(term('N_SD'), p.N_SD),
      row(term('N_SP'), p.N_SP),
      row(term('N_ST'), p.N_ST, 'N_SD + N_SP'),
      row(term('N_BPSCS'), p.N_BPSCS, a.cfg.mod),
      row(term('R'), p.R.text),
      row(term('N_SS'), p.N_SS),
      row(term('N_CBPS'), p.N_CBPS, `${p.N_SD} × ${p.N_BPSCS} × ${p.N_SS}`),
      row(term('N_DBPS'), fmt(p.N_DBPS, 3), `${p.N_CBPS} × ${p.R.text}` + (p.N_DBPS_rule === 'floor' ? ` = ${fmt(p.N_DBPS_exact, 3)} → floor` : '')),
      p.N_ES !== null ? row(term('N_ES'), p.N_ES) : null,
      row(term(tName), V.us(p.T_DFT_ns) + ' µs', '1 / Δ_F'),
      row(term('Guard interval', h('span', null, 'T', h('sub', null, 'GI'))), V.us(p.T_GI_ns) + ' µs'),
      row(term('T_SYM'), V.us(p.T_SYM_ns) + ' µs', `T_GI + ${tName}`),
      row(term('Data rate'), fmt(p.rateMbps, 2) + ' Mb/s', `${fmt(p.N_DBPS, 3)} bits / ${V.us(p.T_SYM_ns)} µs`),
      row(term('N_SYM'), sy.N_SYM),
      ltfItem ? row(term('N_LTF'), ltfItem.count, `${ltfItem.name} symbols for N_SS = ${p.N_SS}`) : null,
      sy.N_PAD !== undefined ? row(term('N_PAD'), sy.N_PAD + ' bits') : null,
      row(term('TXTIME'), V.us(a.timeline.txtime_ns) + ' µs', 'airtime of the whole PPDU'),
      row(h('span', null, 'L-SIG ', term('LENGTH')), a.lsig.LENGTH,
        a.lsig.rule === 'psdu' ? 'PSDU length'
          : `ceil((${V.us(a.timeline.txtime_ns - a.timeline.signalExtension_ns)} − 20)/4)·3 − 3` + (a.lsig.m ? ` − m (m = ${a.lsig.m})` : '')),
    ];
    const u = a.unverified;
    const notice = u.airtime.length || u.lsig.length
      ? h('div', { class: 'notice warn' },
        u.ldpcDependent ? h('strong', null, 'Airtime depends on unverified LDPC constants. ') : null,
        u.rate.length ? h('div', null, 'Data rate depends on unverified data: ', u.rate.join(', ')) : null,
        u.airtime.length ? h('div', null, 'TXTIME / N_SYM depend on unverified data: ', u.airtime.join(', ')) : null,
        u.lsig.length ? h('div', null, 'L-SIG LENGTH depends on unverified data: ', u.lsig.join(', ')) : null)
      : h('div', { class: 'notice ok' }, 'No unverified data is used for these numbers (every input is supported or derived).');
    const problems = [];
    if (a.excluded) problems.push(`This MCS / bandwidth / N_SS combination is not defined in the VHT-MCS tables (${a.excluded.status}: ${a.excluded.note}).`);
    if (a.maxPpdu.exceeded) problems.push(`TXTIME${a.timeline.signalExtension_ns ? ' (without the signal extension)' : ''} is ${V.us(a.timeline.txtime_ns - a.timeline.signalExtension_ns)} µs, more than the maximum PPDU duration of ${V.us(a.maxPpdu.limit_ns)} µs that an L-SIG LENGTH can announce — this PPDU cannot be sent; reduce the payload or raise the MCS.`);
    else if (!a.lsig.valid) problems.push(`L-SIG LENGTH ${a.lsig.LENGTH} exceeds ${a.lsig.maxLength}.`);
    return h('div', null, h('h2', null, 'Output'),
      h('div', { class: 'small muted' }, a.mcsIndex === null
        ? [`Data rate ${fmt(p.rateMbps, 2)} Mb/s (signalled in `, term('RATE'), ')']
        : [term('MCS'), ` ${a.mcsIndex}`, a.cfg.gen === 'HT' && a.cfg.nss > 1 ? ` (= 8·(N_SS − 1) + ${a.cfg.mcs})` : '']),
      problems.map((t) => h('div', { class: 'notice warn' }, t)),
      h('table', { class: 'kv' }, h('tbody', null, rows)), notice);
  };

  /** Built-in check table: published rates vs. the calculators. */
  V.checks = function (results) {
    const D = root.WifiCalc.data;
    const passed = results.filter((r) => r.pass).length;
    return h('div', { class: 'checks' },
      h('h2', null, `Check table — ${passed}/${results.length} pass`),
      h('p', { class: 'small muted' }, 'Published data rates against the calculators. HE rows compare with the exact N_SD·N_BPSCS·R·N_SS/T_SYM (±0.1 Mb/s); published HE tables differ in rounding. "Reference" is the status of the published value itself.'),
      h('div', { style: { overflowX: 'auto' } }, h('table', null,
        h('thead', null, h('tr', null, ['PHY', 'BW', 'GI', 'N_SS', 'MCS / rate', 'published', 'reference', 'computed', 'exact', ''].map((x) => h('th', null, x)))),
        h('tbody', null, results.map((r) => {
          const g = D.generations[r.row.gen];
          return h('tr', null,
            h('td', null, g.label), h('td', { class: 'num' }, r.row.bw), h('td', { class: 'num' }, r.row.gi), h('td', { class: 'num' }, r.row.nss),
            h('td', null, r.row.mcs !== undefined ? `MCS ${r.row.gen === 'HT' ? 8 * (r.row.nss - 1) + r.row.mcs : r.row.mcs}` : `${r.row.mod} ${r.row.R}`),
            h('td', { class: 'num' }, fmt(r.row.expectMbps, 1)),
            h('td', { title: r.row.evidence.map((id) => D.sources[id].title).join('\n') }, h('span', { class: 'badge ' + r.row.status }, r.row.status)),
            h('td', { class: 'num' }, fmt(r.rateMbps, 3)),
            h('td', { class: 'num' }, fmt(r.exactRateMbps, 3)),
            h('td', { class: r.pass ? 'pass' : 'fail' }, r.pass ? 'pass' : 'FAIL'));
        })))));
  };

  /** Information card for a clicked PPDU field. */
  V.fieldInfo = function (a, name) {
    const C = root.WifiCalc, D = C.data;
    const g = C.generation(a.cfg.gen);
    const it = a.timeline.items.find((x) => x.name === name);
    if (!it) return null;
    let def = g.fields.find((f) => f.name === name);
    if (def && def.ref) def = C.generation(def.ref).fields.find((f) => f.name === name);
    const t = D.terms[name] || D.terms[it.kind === 'data' ? 'Data field' : name];
    const statusOf = (e) => (e && e.status ? h('span', { class: 'badge ' + e.status }, e.status) : null);
    const extra = [];
    if (def && def.structure) {
      const st = def.structure.value;
      extra.push(h('div', null, 'Structure: ',
        st.shortTrainingSymbols ? `${st.shortTrainingSymbols} short training symbols × ${st.each} µs` : `${st.gi2} µs `,
        st.longTrainingSymbols ? [term('T_GI2'), ` + ${st.longTrainingSymbols} long training symbols × ${st.each} µs`] : null, ' ', statusOf(def.structure)));
    }
    if (name === 'L-SIG' && g.lsigBits) {
      extra.push(h('div', null, 'Bits: ', g.lsigBits.value.map((b) => `${b.name} (${b.bits})`).join(' · '),
        ` = ${g.lsigBits.value.reduce((n, b) => n + b.bits, 0)} bits `, statusOf(g.lsigBits)));
    }
    if (def && def.modulation) {
      const mods = def.modulation.value;
      extra.push(h('div', null, 'Modulation: ', mods.map((m, i) => (mods.length > 1 ? `${name}${i + 1} ` : '') + m).join(', '), ' (', term('QBPSK'), ' = BPSK rotated by 90°) ', statusOf(def.modulation),
        def.modulation.note ? h('div', { class: 'small muted' }, def.modulation.note) : null));
    }
    if (name === 'L-SIG') {
      extra.push(h('div', null, term('LENGTH'), ` = ${a.lsig.LENGTH}`, a.lsig.rule === 'psdu' ? ' (the PSDU length)'
        : ` = ceil((TXTIME − 20 µs)/4 µs)·3 − 3${a.lsig.m ? ' − m' : ''} — a legacy receiver reading this at 6 Mb/s defers for the whole PPDU`, ' ',
        statusOf(a.lsig.rule === 'psdu' ? D.lsig.nonHtLength : D.lsig.spoofRule),
        a.lsig.m ? h('div', { class: 'small muted' }, `m = ${a.lsig.m} for an ${g.ppduFormat}: LENGTH mod 3 = ${a.lsig.LENGTH % 3}, which tells an HE receiver the PPDU format before HE-SIG-A. `, statusOf(D.lsig.heM)) : null));
    }
    if (it.toneplan) {
      const n20 = a.cfg.bw / 20;
      extra.push(h('div', null, 'Subcarrier plan: ', it.toneplan === 'legacy'
        ? (n20 > 1 ? [`pre-HT — the 20 MHz Non-HT plan sent ${n20} times, once per 20 MHz subchannel, each with its own `, term('Phase rotation', 'phase rotation')] : 'pre-HT — the 20 MHz Non-HT plan')
        : `${C.generation(a.cfg.gen).label} Data-field plan (${a.dataTones.N_ST} subcarriers at ${a.cfg.bw} MHz)`));
    }
    if (it.count > 1) extra.push(h('div', null, `${it.count} symbols: `, term('N_LTF'), ` for N_SS = ${a.cfg.nss}`));
    return h('div', { class: 'info-card' },
      h('h3', null, term(t ? (D.terms[name] ? name : 'Data field') : name, name), ' ',
        h('span', { class: 'mono muted' }, it.count > 1 ? `${it.count} × ${V.us(it.each_ns)} µs` : `${V.us(it.dur_ns)} µs`), ' ',
        statusOf(def && def.duration)),
      t ? h('p', null, t.definition) : null,
      extra,
      t && t.alias ? h('div', { class: 'small muted' }, 'Also called: ' + t.alias) : null);
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
