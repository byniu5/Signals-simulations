/* core/tooltip.js — glossary tooltips and the glossary drawer.
 * Any element with data-term="<id>" gets a tooltip (definition + reference);
 * clicking it opens the glossary at that term. Term content comes from the active
 * system through a resolver, so this file contains no system-specific words.
 */
(function (root) {
  'use strict';
  const { h } = root.Dom;
  let resolve = () => null;
  let tipEl = null, drawer = null, listEl = null, searchEl = null, terms = [];

  function termCard(t, compact) {
    return h('div', { class: 'term-card' },
      h('div', { class: 'term-head' }, h('strong', null, t.label), t.expansion ? h('span', { class: 'muted' }, ' — ' + t.expansion) : null),
      t.alias ? h('div', { class: 'muted small' }, 'Also: ' + t.alias) : null,
      h('p', null, t.definition),
      h('div', { class: 'ref' }, t.ref),
      t.note && !compact ? h('div', { class: 'ref muted' }, t.note) : null);
  }

  function show(target) {
    const t = resolve(target.getAttribute('data-term'));
    if (!t) return;
    tipEl.replaceChildren(termCard(t, true), h('div', { class: 'tip-hint' }, 'Click for the glossary'));
    tipEl.hidden = false;
    const r = target.getBoundingClientRect(), w = tipEl.offsetWidth, ht = tipEl.offsetHeight;
    let x = Math.min(Math.max(8, r.left + r.width / 2 - w / 2), innerWidth - w - 8);
    let y = r.bottom + 8;
    if (y + ht > innerHeight - 8) y = Math.max(8, r.top - ht - 8);
    tipEl.style.left = x + 'px';
    tipEl.style.top = y + 'px';
  }
  const hide = () => { if (tipEl) tipEl.hidden = true; };
  const termTarget = (e) => (e.target.closest ? e.target.closest('[data-term]') : null);

  function renderList(filter) {
    const q = (filter || '').trim().toLowerCase();
    const shown = terms.filter((t) => !q || [t.label, t.expansion, t.alias, t.definition].join(' ').toLowerCase().includes(q));
    listEl.replaceChildren(...shown.map((t) => {
      const card = termCard(t, false);
      card.id = 'term-' + t.id.replace(/[^\w-]/g, '_');
      return card;
    }));
  }

  root.Tooltip = {
    /** resolver(id) -> term object or null */
    init(resolver, tooltipElement) {
      resolve = resolver;
      tipEl = tooltipElement;
      document.addEventListener('mouseover', (e) => { const t = termTarget(e); if (t) show(t); });
      document.addEventListener('focusin', (e) => { const t = termTarget(e); if (t) show(t); });
      document.addEventListener('mouseout', (e) => { if (termTarget(e)) hide(); });
      document.addEventListener('focusout', hide);
      document.addEventListener('click', (e) => { const t = termTarget(e); if (t) { hide(); root.Glossary.open(t.getAttribute('data-term')); } });
      document.addEventListener('keydown', (e) => {
        const t = termTarget(e);
        if (t && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); root.Glossary.open(t.getAttribute('data-term')); }
        if (e.key === 'Escape') { hide(); root.Glossary.close(); }
      });
      addEventListener('scroll', hide, true);
    },
  };

  root.Glossary = {
    mount(drawerEl, termList, title) {
      drawer = drawerEl;
      terms = [...termList].sort((a, b) => a.label.localeCompare(b.label));
      searchEl = h('input', { type: 'search', placeholder: 'Search terms…', 'aria-label': 'Search the glossary' });
      listEl = h('div', { class: 'glossary-list' });
      searchEl.addEventListener('input', () => renderList(searchEl.value));
      drawer.replaceChildren(
        h('div', { class: 'drawer-head' }, h('h2', null, title || 'Glossary'),
          h('button', { type: 'button', class: 'icon', 'aria-label': 'Close glossary', onclick: () => root.Glossary.close() }, '✕')),
        searchEl, listEl);
      renderList('');
    },
    open(id) {
      if (!drawer) return;
      drawer.hidden = false;
      drawer.classList.add('open');
      if (id) {
        searchEl.value = '';
        renderList('');
        const el = document.getElementById('term-' + id.replace(/[^\w-]/g, '_'));
        if (el) { el.scrollIntoView({ block: 'start' }); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1200); }
      }
    },
    close() { if (drawer) { drawer.classList.remove('open'); drawer.hidden = true; } },
    toggle() { if (drawer && drawer.hidden) this.open(); else this.close(); },
  };
})(typeof globalThis !== 'undefined' ? globalThis : this);
