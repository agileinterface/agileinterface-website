// theme.js — light/dark switch.
// 1. A tiny inline script in each page's <head> picks the theme BEFORE the page paints:
//    saved choice (localStorage) → otherwise the visitor's system setting.
// 2. This module wires the toggle button, saves the choice and follows system changes
//    for visitors who never chose.

const KEY = 'ai-theme';
const root = document.documentElement;
const THEME_COLOR = { dark: '#070B14', light: '#F3F6FB' };
let fadeTimer;

const current = () => (root.getAttribute('data-theme') === 'light' ? 'light' : 'dark');

function savedTheme() {
  try { return localStorage.getItem(KEY); } catch (_) { return null; }
}

/** Updates everything that shows the theme: button label, footer status, browser bar colour. */
export function refreshThemeUI() {
  const t = current();
  const label = t === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.setAttribute('aria-label', label);
    btn.title = label;
  });
  document.querySelectorAll('[data-theme-status]').forEach((el) => { el.textContent = `theme: ${t}`; });
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[t]);
}

function setTheme(theme, persist) {
  root.classList.add('theme-anim');            // enables the colour fade (base.css)
  root.setAttribute('data-theme', theme);
  if (persist) { try { localStorage.setItem(KEY, theme); } catch (_) { /* private mode */ } }
  refreshThemeUI();
  clearTimeout(fadeTimer);
  fadeTimer = setTimeout(() => root.classList.remove('theme-anim'), 500);
}

export function initTheme() {
  document.querySelectorAll('[data-theme-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(current() === 'dark' ? 'light' : 'dark', true));
  });

  const mq = window.matchMedia?.('(prefers-color-scheme: light)');
  mq?.addEventListener?.('change', (e) => {
    if (!savedTheme()) setTheme(e.matches ? 'light' : 'dark', false);
  });

  refreshThemeUI();
}
