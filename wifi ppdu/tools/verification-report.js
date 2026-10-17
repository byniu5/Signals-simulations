/* Generates VERIFICATION.md from standards-data.js: every value entry with its
 * status and evidence, grouped by status (unverified first).
 * Run from the repository root:   node "wifi ppdu/tools/verification-report.js"
 */
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const D = require(path.join(__dirname, '../systems/wifi/standards-data.js'));

const rows = [];
(function walk(o, where) {
  if (!o || typeof o !== 'object') return;
  if (!Array.isArray(o) && 'value' in o) rows.push({ where, e: o });
  for (const [k, v] of Object.entries(o)) {
    const key = Array.isArray(o) ? `[${v && v.name ? v.name : k}]` : (where ? '.' : '') + k;
    walk(v, where + key);
  }
})(D, '');
for (const g of Object.keys(D.generations))
  for (const x of D.generations[g].exclusions || [])
    rows.push({ where: `generations.${g}.exclusions[${x.bw} MHz, MCS ${x.mcs}, NSS ${x.nss.join('/')}]`, e: Object.assign({ value: 'excluded' }, x) });

const show = (v) => {
  const s = typeof v === 'string' ? v : JSON.stringify(v);
  return (s.length > 90 ? s.slice(0, 87) + '…' : s).replace(/\|/g, '\\|');
};
const line = ({ where, e }) =>
  `| \`${where.replace(/\.value$/, '')}\` | ${show(e.value)}${e.unit ? ' ' + e.unit : ''} | ${e.evidence.join(', ')} | ${(e.note || '').replace(/\|/g, '\\|')}${e.clause ? ' — clause as cited: ' + e.clause : ''} |`;

const GROUPS = [
  { status: 'unverified', title: 'Unverified — please check against the standard',
    rule: 'Fewer than two independent public sources, or an input of a derivation is unverified. Shown as a warning in the app.' },
  { status: 'standard-checked', title: 'Standard-checked', rule: 'Read in the standard text by the user.' },
  { status: 'supported', title: 'Supported (secondary sources)',
    rule: 'At least two independent public sources (open-source implementation, IEEE submission, patent, vendor documentation), ' +
      'or classified as supported by the reviewer (source `review-3`). The standard text itself was not read.' },
  { status: 'derived', title: 'Derived', rule: 'Arithmetic from standard-checked, supported or derived values; the inputs are listed.' },
];
for (const r of rows) if (!GROUPS.some((g) => g.status === r.e.status)) throw new Error(`${r.where}: unknown status ${r.e.status}`);
const header = '| Entry | Value | Evidence | Note |\n|---|---|---|---|';
const derivedLine = (r) => line(r).replace(/ \|$/, '') + (r.e.derivedFrom ? ` From: ${r.e.derivedFrom.map((x) => '`' + x + '`').join(', ')}.` : '') + ' |';
const section = (g) => {
  const list = rows.filter((r) => r.e.status === g.status);
  return `## ${g.title} (${list.length})\n\n${g.rule}\n\n` +
    (list.length ? `${header}\n${list.map(g.status === 'derived' ? derivedLine : line).join('\n')}` : '_None._');
};
const counts = GROUPS.map((g) => `${g.status} **${rows.filter((r) => r.e.status === g.status).length}**`).join(' · ');
const checkRows = D.checkTable.rows.map((r) =>
  `| ${D.generations[r.gen].label} | ${r.bw} | ${r.gi} | ${r.nss} | ${r.mcs !== undefined ? 'MCS ' + r.mcs : r.mod + ' ' + r.R} | ${r.expectMbps} | ${r.status} | ${r.evidence.join(', ')} |`).join('\n');

const md = `# Wi-Fi PPDU explorer — verification status

Generated from \`systems/wifi/standards-data.js\` by \`tools/verification-report.js\`. Do not edit by hand.

${D.meta.clauseNote}

**Statuses** (only *unverified* is shown as a warning in the app): *standard-checked* — read in the standard text by the
user; *supported* — at least two independent public sources, standard text not read; *derived* — arithmetic from
checked values; *unverified* — everything else. Sources are counted by their \`origin\` (several ns-3 files are one
origin); \`plan\` and \`arith\` are cross-checks and never count as sources. The unit tests enforce these rules.

- Status-bearing entries: **${rows.length}** — ${counts}

${GROUPS.map(section).join('\n\n')}

## Check table — status of the published reference values

| PHY | BW | GI | N_SS | MCS / rate | Mb/s | Status | Evidence |
|---|---|---|---|---|---|---|---|
${checkRows}

## Sources

${Object.entries(D.sources).map(([id, s]) => `- **${id}** (${s.origin}) — ${s.url ? `[${s.title}](${s.url})` : s.title}`).join('\n')}
`;

const out = path.join(__dirname, '..', 'VERIFICATION.md');
fs.writeFileSync(out, md);
console.log(`Wrote ${out}: ${counts.replace(/\*\*/g, '')}.`);
