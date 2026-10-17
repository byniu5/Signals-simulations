/* core/zoom.js — animated zoom between nested views.
 *
 *   const stage = Zoom.stage(container);
 *   stage.show(render)                               // replace without animation
 *   stage.zoomIn(render, fromRect)                   // new view grows out of fromRect (in the old view)
 *   stage.zoomOut(render, targetSelector)            // old view shrinks into targetSelector (in the new view)
 *
 * render(el) fills a fresh element. Rects are viewport rectangles (getBoundingClientRect).
 */
(function (root) {
  'use strict';
  const DURATION = 520;
  const EASE = 'cubic-bezier(.2,.7,.2,1)';
  const reduced = () => root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stage(container) {
    container.classList.add('zoom-stage');
    let current = null;

    function make(render) {
      const el = document.createElement('div');
      el.className = 'zoom-view';
      render(el);
      return el;
    }
    function swap(neu) {
      if (current) current.remove();
      container.appendChild(neu);
      current = neu;
      return neu;
    }
    /** Take the old view out of the flow and pin it on top, so the new one can lay out underneath. */
    function lift(old) {
      const c = container.getBoundingClientRect(), r = old.getBoundingClientRect();
      Object.assign(old.style, { position: 'absolute', left: (r.left - c.left) + 'px', top: (r.top - c.top) + 'px', width: r.width + 'px' });
      return { c, r };
    }
    const finish = (anims, old) => Promise.all(anims.map((a) => a.finished)).catch(() => {}).then(() => old.remove());

    return {
      get view() { return current; },
      show(render) { return swap(make(render)); },

      zoomIn(render, fromRect) {
        const old = current;
        if (!old || !fromRect || reduced()) return Promise.resolve(this.show(render));
        const { c } = lift(old);
        const neu = make(render);
        container.appendChild(neu);
        current = neu;
        const n = neu.getBoundingClientRect();
        const sx = fromRect.width / n.width, sy = fromRect.height / n.height;
        const tx = fromRect.left - n.left, ty = fromRect.top - n.top;
        neu.style.transformOrigin = '0 0';
        const a1 = neu.animate([
          { transform: `translate(${tx}px, ${ty}px) scale(${sx}, ${sy})`, opacity: 0.2 },
          { transform: 'none', opacity: 1 }], { duration: DURATION, easing: EASE });
        const ox = fromRect.left + fromRect.width / 2 - c.left, oy = fromRect.top + fromRect.height / 2 - c.top;
        old.style.transformOrigin = `${ox}px ${oy}px`;
        const a2 = old.animate([{ transform: 'none', opacity: 1 }, { transform: 'scale(2.2)', opacity: 0 }],
          { duration: DURATION, easing: EASE, fill: 'forwards' });
        return finish([a1, a2], old);
      },

      zoomOut(render, targetSelector) {
        const old = current;
        if (!old || reduced()) return Promise.resolve(this.show(render));
        const { r } = lift(old);
        const neu = make(render);
        container.appendChild(neu);
        current = neu;
        const target = targetSelector && neu.querySelector(targetSelector);
        if (!target) { old.remove(); return Promise.resolve(neu); }
        const t = target.getBoundingClientRect();
        const sx = t.width / r.width, sy = t.height / r.height;
        old.style.transformOrigin = '0 0';
        const a1 = old.animate([
          { transform: 'none', opacity: 1 },
          { transform: `translate(${t.left - r.left}px, ${t.top - r.top}px) scale(${sx}, ${sy})`, opacity: 0 }],
          { duration: DURATION, easing: EASE, fill: 'forwards' });
        const n = neu.getBoundingClientRect();
        neu.style.transformOrigin = `${t.left + t.width / 2 - n.left}px ${t.top + t.height / 2 - n.top}px`;
        const a2 = neu.animate([{ transform: 'scale(1.6)', opacity: 0 }, { transform: 'none', opacity: 1 }],
          { duration: DURATION, easing: EASE });
        return finish([a1, a2], old);
      },
    };
  }

  root.Zoom = { stage };
})(typeof globalThis !== 'undefined' ? globalThis : this);
