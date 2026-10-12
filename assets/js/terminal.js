// terminal.js — the interactive "Get to know us" terminal.
// Commands and their output come from site-data.json → "terminal".
import { esc } from './render.js';

export function initTerminal(commands, company = {}) {
  const screen = document.querySelector('[data-terminal-screen]');
  const buttons = document.querySelector('[data-terminal-cmds]');
  if (!screen || !buttons || !commands.length) return;

  // "{email}" in the JSON becomes company.email, "{location}" becomes company.location, etc.
  const withVars = (line) => String(line).replace(/\{(\w+)\}/g, (match, key) => company[key] ?? match);

  buttons.innerHTML = commands
    .map((c, i) => `<button type="button" class="cmd" aria-pressed="false" data-index="${i}">${esc(c.command)}</button>`)
    .join('');

  function run(index) {
    const c = commands[index];
    const output = (c.output || [])
      .map((line, n) => `<div class="terminal__out line-in" style="animation-delay:${n * 80}ms">${esc(withVars(line))}</div>`)
      .join('');
    screen.innerHTML =
      `<div><span class="terminal__prompt">$</span> <span class="terminal__cmd">${esc(c.command)}</span></div>` +
      output +
      `<div><span class="terminal__prompt">$</span> <span class="terminal__caret blink"></span></div>`;
    buttons.querySelectorAll('.cmd').forEach((b) => {
      b.setAttribute('aria-pressed', String(Number(b.dataset.index) === index));
    });
  }

  buttons.addEventListener('click', (e) => {
    const btn = e.target.closest('.cmd');
    if (btn) run(Number(btn.dataset.index));
  });

  run(0);
}
