// showcase.js — makes the Products section interactive (tabs, phone deck/carousel, image fallbacks).
// render.js builds the HTML; this file only adds behaviour. If it fails, the products still show.
//
// Two display modes, switched by CSS at 640px (keep this number in sync with components.css):
//   • deck     (> 640px) : centre phone + two angled neighbours, gentle autoplay
//   • carousel (≤ 640px) : native horizontal swipe (CSS scroll-snap); JS only keeps dots/label in sync

const AUTOPLAY_MS = 4500;
const CAROUSEL_QUERY = '(max-width: 640px)';

export function initShowcase() {
  const root = document.querySelector('[data-showcase]');
  if (!root) return;

  const tabs = [...root.querySelectorAll('[role="tab"]')];
  const panels = [...root.querySelectorAll('[role="tabpanel"]')];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  const carousel = window.matchMedia(CAROUSEL_QUERY);
  const state = panels.map(() => 0);            // active screen per product
  const lockUntil = panels.map(() => 0);        // ignore scroll events while we animate a scroll ourselves
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

  /* ---- helpers ---- */
  const trackOf = (pi) => panels[pi].querySelector('.deck__track');
  const phonesOf = (pi) => [...panels[pi].querySelectorAll('.phone')];

  /** Carousel only: scroll the track so phone `i` is centred. */
  function scrollToPhone(pi, i, smooth) {
    const track = trackOf(pi);
    const ph = phonesOf(pi)[i];
    if (!track || !ph || !track.clientWidth) return; // hidden panel → nothing to measure yet
    const left = ph.offsetLeft - (track.clientWidth - ph.offsetWidth) / 2;
    track.scrollTo({ left, behavior: smooth && !reduce.matches ? 'smooth' : 'auto' });
  }

  /* ---- 2) phones: positions (centre / right / left / hidden), label and dots ---- */
  function place(pi) {
    const panel = panels[pi];
    const phones = phonesOf(pi);
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

  function go(pi, i) {
    state[pi] = i;
    place(pi);
    if (carousel.matches) {
      lockUntil[pi] = Date.now() + 900;
      scrollToPhone(pi, i, true);
    }
  }

  panels.forEach((panel, pi) => {
    place(pi);
    const deck = panel.querySelector('.deck');
    const track = trackOf(pi);

    // tap a phone or a dot
    deck?.addEventListener('click', (e) => {
      const t = e.target.closest('.phone, .deck__dots button');
      if (!t) return;
      go(pi, Number(t.dataset.i));
      restart();
    });

    // keyboard: ← / → move between screens
    deck?.addEventListener('keydown', (e) => {
      const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
      if (!k) return;
      const n = phonesOf(pi).length;
      if (n < 2) return;
      e.preventDefault();
      go(pi, (state[pi] + k + n) % n);
      restart();
    });

    // swipe: the browser scrolls the track; we only work out which phone is now in the middle.
    // (3–6 offset reads per scroll event is cheap, so no rAF batching is needed.)
    track?.addEventListener('scroll', () => {
      if (!carousel.matches || Date.now() < lockUntil[pi]) return;
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let bestDist = Infinity;
      phonesOf(pi).forEach((ph, i) => {
        const d = Math.abs(ph.offsetLeft + ph.offsetWidth / 2 - mid);
        if (d < bestDist) { bestDist = d; best = i; }
      });
      if (best !== state[pi]) { state[pi] = best; place(pi); }
    }, { passive: true });
  });

  /* ---- 3) tabs (click + arrow keys) ---- */
  function revealTab(t) { // keep the chosen tab visible in the horizontally scrolling tab bar
    const list = t.parentElement;
    if (!list || list.scrollWidth <= list.clientWidth) return;
    list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: reduce.matches ? 'auto' : 'smooth' });
  }

  function select(i, focus) {
    current = i;
    tabs.forEach((t, k) => {
      t.setAttribute('aria-selected', String(k === i));
      t.tabIndex = k === i ? 0 : -1;
    });
    panels.forEach((p, k) => { p.hidden = k !== i; });
    revealTab(tabs[i]);
    if (carousel.matches) scrollToPhone(i, state[i], false); // a freshly shown panel starts at scrollLeft 0
    if (focus) tabs[i].focus({ preventScroll: true });
    restart();
  }
  tabs.forEach((t, i) => t.addEventListener('click', () => select(i, false)));
  root.querySelector('[role="tablist"]').addEventListener('keydown', (e) => {
    const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
    if (k) { e.preventDefault(); select((current + k + tabs.length) % tabs.length, true); }
    if (e.key === 'Home') { e.preventDefault(); select(0, true); }
    if (e.key === 'End') { e.preventDefault(); select(tabs.length - 1, true); }
  });

  /* ---- 4) gentle autoplay — deck mode only (on phones people swipe; autoplay would fight their thumb) ---- */
  function tick() {
    const n = phonesOf(current).length;
    if (n > 1) go(current, (state[current] + 1) % n);
  }
  function restart() {
    clearInterval(timer);
    if (reduce.matches || document.hidden || carousel.matches) return;
    timer = setInterval(tick, AUTOPLAY_MS);
  }
  root.addEventListener('mouseenter', () => clearInterval(timer));
  root.addEventListener('mouseleave', restart);
  root.addEventListener('focusin', () => clearInterval(timer));
  root.addEventListener('focusout', restart);
  document.addEventListener('visibilitychange', restart);

  /* ---- 5) rotating the phone / resizing across the 640px line: re-sync the active screen ---- */
  carousel.addEventListener('change', () => {
    panels.forEach((_, pi) => { place(pi); if (carousel.matches) scrollToPhone(pi, state[pi], false); });
    restart();
  });

  restart();
}
