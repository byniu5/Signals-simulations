/* Generates VERIFICATION.md from standards-data.js: every value entry with its
 * status and evidence, unverified ones first.
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

const unverified = rows.filter((r) => r.e.status === 'unverified');
const verified = rows.filter((r) => r.e.status === 'verified');
const header = '| Entry | Value | Evidence | Note |\n|---|---|---|---|';

const md = `# Wi-Fi PPDU explorer — verification status

Generated from \`systems/wifi/standards-data.js\` by \`tools/verification-report.js\`. Do not edit by hand.

${D.meta.clauseNote}

**Status rule:** *verified* = the exact value is stated by at least one public secondary source and matches an
independent check (a second source, arithmetic, or the pre-research plan). Everything else is *unverified*.

- Value entries: **${rows.length}** — verified **${verified.length}**, unverified **${unverified.length}**

## Unverified — please check against the standard

${header}
${unverified.map(line).join('\n')}

## Verified (secondary sources)

${header}
${verified.map(line).join('\n')}

## Sources

${Object.entries(D.sources).map(([id, s]) => `- **${id}** — ${s.url ? `[${s.title}](${s.url})` : s.title}`).join('\n')}
`;

const out = path.join(__dirname, '..', 'VERIFICATION.md');
fs.writeFileSync(out, md);
console.log(`Wrote ${out}: ${verified.length} verified, ${unverified.length} unverified.`);
