/* core/app.js — boots the page: picks a registered system, builds the mode tabs,
 * the glossary and the tooltips. Knows nothing about any particular radio system. */
(function (root) {
  'use strict';
  const { h } = root.Dom;

  function boot() {
    const systems = root.Systems.list();
    if (!systems.length) throw new Error('No system registered');
    const params = new URLSearchParams(location.search);
    let system = root.Systems.get(params.get('system')) || systems[0];

    const tabs = document.getElementById('modeTabs');
    const main = document.getElementById('app');
    const picker = document.getElementById('systemPicker');

    function mountSystem(sys) {
      system = sys;
      document.getElementById('appTitle').textContent = sys.title;
      document.getElementById('appSubtitle').textContent = sys.subtitle || '';
      document.title = sys.title;
      const glossary = sys.glossary();
      const byId = new Map(glossary.map((t) => [t.id, t]));
      root.Tooltip.init((id) => byId.get(id) || null, document.getElementById('tooltip'));
      root.Glossary.mount(document.getElementById('glossary'), glossary, sys.glossaryTitle || 'Glossary');

      const enabled = sys.modes.filter((m) => !m.disabled);
      // handed to every mode so it can switch to another mode of the same system
      const ctx = { selectMode: (id) => { const m = enabled.find((x) => x.id === id); if (m) select(m); } };
      let active = sys.modes.find((m) => m.id === params.get('mode') && !m.disabled) || enabled[0];
      function select(mode) {
        active = mode;
        tabs.querySelectorAll('button').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.mode === mode.id)));
        main.replaceChildren();
        mode.mount(main, ctx);
      }
      tabs.replaceChildren(...sys.modes.map((m) => h('button', {
        type: 'button', role: 'tab', 'data-mode': m.id, disabled: !!m.disabled,
        title: m.disabled || '', onclick: () => select(m),
      }, m.label, m.disabled ? h('span', { class: 'soon' }, 'coming soon') : null)));
      select(active);
    }

    // A picker only appears once more than one system is registered.
    if (systems.length > 1) {
      const sel = h('select', { 'aria-label': 'Radio system', onchange: (e) => mountSystem(root.Systems.get(e.target.value)) },
        systems.map((s) => h('option', { value: s.id, selected: s === system }, s.title)));
      picker.replaceChildren(sel);
    }
    document.getElementById('glossaryBtn').addEventListener('click', () => root.Glossary.toggle());
    mountSystem(system);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})(typeof globalThis !== 'undefined' ? globalThis : this);
