/* core/registry.js — radio systems register themselves here.
 *
 * A system is a self-contained module (e.g. systems/wifi/) that provides
 *   { id, title, subtitle,
 *     glossary(): [{ id, label, expansion, alias, definition, ref, note }],
 *     modes: [{ id, label, mount(container, ctx) } | { id, label, disabled: 'reason' }] }
 * The core never imports system code directly, so adding a system means adding a
 * folder and one <script> tag — nothing in the existing systems changes.
 */
(function (root) {
  'use strict';
  const systems = new Map();
  root.Systems = {
    register(def) {
      if (!def || !def.id) throw new Error('A system needs an id');
      if (systems.has(def.id)) throw new Error('Duplicate system id: ' + def.id);
      systems.set(def.id, def);
    },
    get: (id) => systems.get(id),
    list: () => [...systems.values()],
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
