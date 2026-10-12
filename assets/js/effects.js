// effects.js — scroll-driven effects.
//  • starts the code-typing animation when the editor scrolls into view
//  • reveal-on-scroll fallback for browsers without CSS scroll timelines
//  • current year in the footer

export function initEffects() {
  const hasIO = 'IntersectionObserver' in window;

  // 1) Typing editor: add .is-typing once ~35% of it is visible (CSS does the rest)
  const editor = document.getElementById('build-editor');
  if (editor) {
    if (hasIO) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          editor.classList.add('is-typing');
          io.disconnect();
        }
      }, { threshold: 0.35 });
      io.observe(editor);
    } else {
      editor.classList.add('is-typing');
    }
  }

  // 2) Reveal fallback (Chrome/Edge use pure CSS animation-timeline instead)
  const cssTimeline = window.CSS?.supports?.('animation-timeline: view()');
  if (!cssTimeline) {
    const items = document.querySelectorAll('.reveal');
    if (hasIO) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-visible');
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      items.forEach((el) => io.observe(el));
    } else {
      items.forEach((el) => el.classList.add('is-visible'));
    }
  }

  // 3) Footer year
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = String(new Date().getFullYear()); });
}
