// showcase.js — makes the Products section interactive (tabs, phone carousel, image fallbacks).
// render.js builds the HTML; this file only adds behaviour. If it fails, the products still show.

const AUTOPLAY_MS = 4500;

export function initShowcase() {
  const root = document.querySelector('[data-showcase]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const state = panels.map(() => 0); // active screen per product
  let current = 0;
  let timer = null;

  /* ---- 1) a missing image (typo in the path, file not uploaded yet) → friendly fallback ---- */
  root.querySelectorAll('img[data-fallback]').forEach((img) => {
    img.addEventListener('error', () => {
      if (img.dataset.fallback === 'icon') {
        const tile = document.createElement('div');
        tile.className = `${img.className} ${img.className}--placeholder`;
        tile.setAttribute('aria-hidden', 'true');
        tile.textContent = img.dataset.letter || 'A';
        img.replaceWith(tile);
      } else {
        const ph = document.createElement('span');
        ph.className = 'phone__ph';
        ph.innerHTML = '<b></b><span>Screens coming soon</span>';
        ph.querySelector('b').textContent = img.dataset.letter || 'A';
        img.replaceWith(ph);
      }
    }, { once: true });
  });

  /* ---- 2) phones: positions (centre / right / left / hidden) ---- */
  function place(pi) {
    const panel = panels[pi];
    const phones = [...panel.querySelectorAll('.phone')];
    const n = phones.length;
    const act = state[pi];
    phones.forEach((ph, i) => {
      const d = (i - act + n) % n;
      ph.dataset.pos = d === 0 ? 'c' : d === 1 ? 'r' : (d === n - 1 && n > 2) ? 'l' : 'x';
      ph.tabIndex = d === 0 ? -1 : 0;
      ph.setAttribute('aria-current', String(d === 0));
    });
    const label = phones[act]?.getAttribute('aria-label')?.replace('Show screen: ', '') || '';
    const lbl = panel.querySelector('.deck__label');
    if (lbl) lbl.textContent = label ? `// ${label.toLowerCase()}` : '';
    const dots = panel.querySelector('.deck__dots');
    if (dots) {
      dots.innerHTML = n > 1 ? phones.map((_, i) => `<button type="button" data-i="${i}" aria-label="Show screen ${i + 1}" aria-current="${i === act}"></button>`).join('') : '';
    }
  }

  function go(pi, i) { state[pi] = i; place(pi); }

  panels.forEach((panel, pi) => {
    place(pi);
    panel.querySelector('.deck')?.addEventListener('click', (e) => {
      const t = e.target.closest('.phone, .deck__dots button');
      if (!t) return;
      go(pi, Number(t.dataset.i));
      restart();
    });
  });

  /* ---- 3) tabs (click + arrow keys) ---- */
  function select(i, focus) {
    current = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    if (focus) tabs[i].focus();
    restart();
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i, false)));
  root.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); select((current + k + tabs.length) % tabs.length, true); }
    if (e.key === 'Home') { e.preventDefault(); select(0, true); }
    if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
  });

  /* ---- 4) gentle autoplay (off for reduced motion; pauses on hover/focus/hidden tab) ---- */
  function tick() {
    const n = panels[current].querySelectorAll('.phone').length;
    if (n > 1) go(current, (state[current] + 1) % n);
  }
  function restart() {
    clearInterval(timer);
    if (reduce.matches || document.hidden) return;
    timer = setInterval(tick, AUTOPLAY_MS);
  }
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  root.addEventListener('focusin', () => clearInterval(timer));
  root.addEventListener('focusout', restart);
  document.addEventListener('visibilitychange', restart);
  restart();
}
