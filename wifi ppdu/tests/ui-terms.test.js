/* Terminology and structure checks for the UI code.
 * Run from the repository root:   node --test "wifi ppdu/tests/ui-terms.test.js"
 */
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const D = require(path.join(ROOT, 'systems/wifi/standards-data.js'));
const read = (rel) => fs.readFileSync(path.join(ROOT, rel), 'utf8');
const list = (dir) => fs.readdirSync(path.join(ROOT, dir)).filter((f) => f.endsWith('.js')).map((f) => path.join(dir, f));

const VIEW_FILES = list('systems/wifi').filter((f) => /view-|module/.test(f));
const CORE_FILES = list('core');
const UI_FILES = ['index.html', ...CORE_FILES, ...VIEW_FILES];

test('every UI script parses (catches syntax errors the calculator tests cannot see)', () => {
  const vm = require('node:vm');
  for (const f of [...CORE_FILES, ...list('systems/wifi')]) assert.doesNotThrow(() => new vm.Script(read(f), { filename: f }), f);
});

test('every glossary-linked label used in the views exists in the glossary', () => {
  const used = new Set();
  for (const f of VIEW_FILES) {
    const src = read(f);
    for (const m of src.matchAll(/term\('([^']+)'/g)) used.add(m[1]);
    for (const m of src.matchAll(/'data-term': '([^']+)'/g)) used.add(m[1]);
    for (const m of src.matchAll(/term: '([^']+)'/g)) used.add(m[1]);
  }
  const missing = [...used].filter((id) => !D.terms[id]);
  assert.deepEqual(missing, [], 'terms used but not defined: ' + missing.join(', '));
  assert.ok(used.size > 30, 'expected many glossary links, found ' + used.size);
});

test('every field of the generations with views has a glossary entry', () => {
  for (const gen of ['nonHT', 'HT', 'VHT']) {
    const g = D.generations[gen];
    for (const f of g.fields) {
      const id = f.kind === 'data' ? 'Data field' : f.name;
      assert.ok(D.terms[id], `${gen}: no glossary entry for ${id}`);
    }
    assert.ok(D.terms[g.ppduFormat], `${gen}: no glossary entry for ${g.ppduFormat}`);
    assert.ok(D.terms[g.payloadField.term], `${gen}: no glossary entry for ${g.payloadField.term}`);
  }
  for (const id of ['Signal extension', 'Short GI', 'TXTIME', 'T_FFT', 'T_DFT', 'QBPSK', 'Phase rotation', 'N_LTF']) assert.ok(D.terms[id], id);
});

test('glossary entries have a definition and a known document; cited sub-clauses name a source', () => {
  for (const [id, t] of Object.entries(D.terms)) {
    assert.ok(t.definition && t.definition.length > 20, id + ': definition');
    assert.ok(D.documents[t.doc], id + ': document ' + t.doc);
    if (t.cited) assert.ok(D.sources[t.cited.source], id + ': cited source ' + t.cited.source);
  }
});

test('no cellular (LTE / 5G NR) terminology in anything the user sees', () => {
  const banned = /resource block|resource element|subframe|\bslot\b|\bPRB\b|numerology|\bgNB\b|\beNB\b|\bUE\b|\bTTI\b|\bmini-slot\b/i;
  const files = [...UI_FILES, 'systems/wifi/standards-data.js'];
  for (const f of files) {
    read(f).split('\n').forEach((line, i) => {
      assert.ok(!banned.test(line), `${f}:${i + 1}: ${line.trim()}`);
    });
  }
});

test('the core does not depend on the Wi-Fi module', () => {
  for (const f of CORE_FILES) {
    const src = read(f);
    for (const name of ['WifiCalc', 'WifiViews', 'WIFI_STANDARDS']) assert.ok(!src.includes(name), `${f} references ${name}`);
  }
});

test('index.html loads every core and Wi-Fi script that exists, core first', () => {
  const html = read('index.html');
  const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map((m) => m[1]);
  for (const f of [...CORE_FILES, ...list('systems/wifi')]) assert.ok(scripts.includes(f.replace(/\\/g, '/')), 'not loaded: ' + f);
  assert.ok(scripts.indexOf('core/registry.js') < scripts.indexOf('systems/wifi/module.js'));
  assert.equal(scripts[scripts.length - 1], 'core/app.js', 'boot script last');
});
