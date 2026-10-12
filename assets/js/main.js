// main.js — entry point. Loads data/site-data.json, renders the page, starts the effects.
import { renderAll } from './render.js';
import { initTheme, refreshThemeUI } from './theme.js';
import { initTerminal } from './terminal.js';
import { initEffects } from './effects.js';

// Root-absolute so it works from any page URL (/, /privacy, /terms)
const DATA_URL = '/data/site-data.json';

async function loadData() {
  // no-cache: always ask the server for the latest version of the JSON after you edit it
  const res = await fetch(DATA_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Could not load ${DATA_URL} (HTTP ${res.status})`);
  return res.json();
}

async function main() {
  initTheme(); // the theme button works even if the content fails to load

  try {
    const data = await loadData();
    renderAll(data);
    if (Array.isArray(data.terminal)) initTerminal(data.terminal, data.company || {});
  } catch (err) {
    console.error('[agile-interface] Content failed to load:', err);
    if (location.protocol === 'file:') {
      console.warn('You opened the file directly. fetch() is blocked on file:// URLs — run a local server instead (see README → "Run it locally").');
    }
  }

  refreshThemeUI(); // update the footer "theme:" label now that the footer exists
  initEffects();    // run after rendering so new .reveal elements are animated too
}

main();
