// render.js — turns site-data.json into HTML.
// Every value from the JSON goes through esc() (text) or safeUrl()/safeAsset() (links, images)
// so a typo or stray "<" in the JSON can never break the page or inject code.

/* ---------------- helpers ---------------- */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

/** Allow only web links, email/phone links, in-page anchors and local pages. */
export function safeUrl(url) {
  const u = String(url ?? '').trim();
  if (!u) return '';
  return /^(https?:\/\/|mailto:|tel:|#|\.\/|\/|[\w-]+\.html)/i.test(u) ? u : '';
}

/** Allow only local image paths like assets/img/products/app.png */
function safeAsset(path) {
  const p = String(path ?? '').trim();
  return /^[\w./-]+\.(png|jpe?g|webp|svg|avif)$/i.test(p) && !p.includes('..') ? p : '';
}

const isExternal = (u) => /^https?:\/\//i.test(u);
const linkAttrs = (u) => (isExternal(u) ? ' target="_blank" rel="noopener"' : '');
const slots = (name) => document.querySelectorAll(`[data-slot="${name}"]`);
const fill = (name, html) => slots(name).forEach((el) => { el.innerHTML = html; });
const onHomePage = () => Boolean(document.getElementById('top'));

const ICONS = {
  check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12l5 5 9-10"/></svg>',
  android: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3"/><path d="M11 18.5h2"/></svg>',
  ios: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="6" y="2.5" width="12" height="19" rx="3.5"/><path d="M10.5 5h3"/></svg>',
  desktop: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
  web: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3.2 3 14.8 0 18M12 3c-3 3.2-3 14.8 0 18"/></svg>',
  mark: '<svg viewBox="0 0 100 100" width="30" height="30" aria-hidden="true"><polyline class="mark-peak" points="16,84 50,16 84,84"/><rect class="mark-cursor" x="38" y="60" width="24" height="11"/></svg>'
};

const STATUS = {
  'live': 'live',
  'in-development': 'in development',
  'coming-soon': 'coming soon'
};

/* ---------------- sections ---------------- */
function renderHero(hero = {}) {
  slots('hero-tagline').forEach((el) => { if (hero.tagline) el.textContent = hero.tagline; });
}

function renderTicker(t = {}) {
  const words = t.words || [];
  const symbols = t.symbols?.length ? t.symbols : ['/'];
  const secondary = t.secondary || [];
  if (!words.length && !secondary.length) return;
  const rowA = words.map((w, i) => `<span>${esc(w)}</span><span class="sym">${esc(symbols[i % symbols.length])}</span>`).join('');
  const rowB = secondary.map((w) => `<span>${esc(w)}</span><span>/</span>`).join('');
  // Each row = 4 copies, the animation moves it by half → seamless loop on wide screens
  const loop = (s) => s + s + s + s;
  fill('ticker', `<div class="ticker__row">${loop(rowA)}</div><div class="ticker__row ticker__row--alt">${loop(rowB)}</div>`);
}

function renderBuild(build = {}) {
  fill('build-points', (build.points || []).map((p) =>
    `<li>${ICONS.check}<span><b>${esc(p.title)}</b> ${esc(p.text)}</span></li>`).join(''));

  const targets = build.targets || [];
  fill('build-targets',
    `<span class="build-bar__label later" style="--w:4.9s">▶ build</span>` +
    targets.map((t, i) => `<span class="chip later" style="--w:${(5.1 + i * 0.2).toFixed(1)}s">${ICONS.check}${esc(t)}</span>`).join(''));

  fill('ship-steps', (build.steps || []).map((s, i) => `
    <li class="card glass lift reveal">
      <div class="card__meta"><span class="card__hash">${esc(s.hash || '')}</span><span class="card__num">${String(i + 1).padStart(2, '0')}</span></div>
      <h4 class="card__title">${esc(s.title)}</h4>
      <p class="card__text">${esc(s.text)}</p>
    </li>`).join(''));

  fill('platforms', (build.platforms || []).map((p) => `
    <div class="platform glass lift reveal">
      <div class="platform__icon">${ICONS[p.icon] || ICONS.web}</div>
      <div><div class="platform__name">${esc(p.name)}</div><div class="platform__store">${esc(p.store)}</div></div>
    </div>`).join(''));
}

function productIcon(p) {
  const src = safeAsset(p.icon);
  if (src) return `<img class="product__icon" src="${esc(src)}" alt="${esc(p.name)} app icon" width="96" height="96" loading="lazy">`;
  const letter = (String(p.name || '').replace(/[^\p{L}\p{N}]/gu, '')[0] || 'A').toUpperCase();
  return `<div class="product__icon product__icon--placeholder" aria-hidden="true">${esc(letter)}</div>`;
}

function renderProducts(products = []) {
  if (!products.length) {
    fill('products', '<p class="muted">New products are on the way.</p>');
    return;
  }
  fill('products', products.map((p) => {
    const status = STATUS[p.status] ? p.status : 'in-development';
    const file = p.file || `${String(p.name || 'product').toLowerCase().replace(/[^a-z0-9]+/g, '_')}.kt`;
    const links = (p.links || [])
      .map((l) => ({ ...l, url: safeUrl(l.url) }))
      .filter((l) => l.url)
      .map((l) => `<a href="${esc(l.url)}"${linkAttrs(l.url)}>${esc(l.label)} →</a>`).join('');
    return `
    <article class="product glass lift reveal">
      <div class="product__bar"><span>products/${esc(file)}</span><span class="product__status--${status}">● ${STATUS[status]}</span></div>
      <div class="product__body">
        ${productIcon(p)}
        <div class="product__info">
          <h3 class="product__name">${esc(p.name)}</h3>
          <p class="product__desc">${esc(p.description)}</p>
          <div class="product__targets">targets = [${(p.targets || []).map(esc).join(', ')}]</div>
          ${links ? `<div class="product__links">${links}</div>` : ''}
        </div>
      </div>
    </article>`;
  }).join(''));
}

function renderTeam(team = []) {
  if (!team.length) return;
  const lines = team.map((m) =>
    `    Founder(<span class="str">"${esc(m.name)}"</span>, role = <span class="str">"${esc(m.role)}"</span>),`).join('\n');
  const code = `<div class="code-block"><span class="kw">val</span> founders = listOf(\n${lines}\n)</div>`;

  const rows = team.map((m) => {
    const li = safeUrl(m.linkedin);
    const gh = safeUrl(m.github);
    if (!li && !gh) return '';
    return `<div class="team-links__row"><span class="team-links__name">${esc(m.name)}</span>` +
      (li ? `<a href="${esc(li)}"${linkAttrs(li)}>LinkedIn</a>` : '') +
      (gh ? `<a href="${esc(gh)}"${linkAttrs(gh)}>GitHub</a>` : '') + `</div>`;
  }).join('');

  fill('team', code + (rows ? `<div class="team-links">${rows}</div>` : ''));
}

function mailto(email, subject) {
  const e = String(email || '').trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return '#contact';
  return `mailto:${e}${subject ? `?subject=${encodeURIComponent(subject)}` : ''}`;
}

function renderContact(company = {}, contact = {}) {
  slots('contact-text').forEach((el) => { if (contact.text) el.textContent = contact.text; });
  slots('contact-email').forEach((el) => {
    el.textContent = company.email || '';
    el.href = mailto(company.email);
  });
  slots('contact-cta').forEach((el) => {
    el.textContent = contact.ctaLabel || 'Start a project';
    el.href = mailto(company.email, contact.emailSubject);
  });
}

/** Fills <span data-company="legalName"> etc. (used on the legal pages) */
function renderCompanyFields(company = {}) {
  document.querySelectorAll('[data-company]').forEach((el) => {
    const v = company[el.dataset.company];
    if (v) el.textContent = v;
  });
  document.querySelectorAll('[data-company-email]').forEach((el) => {
    el.textContent = company.email || '';
    el.href = mailto(company.email);
  });
}

function renderFooter(data = {}) {
  const c = data.company || {};
  const f = data.footer || {};
  const base = onHomePage() ? '' : './';
  const linkList = (items = []) => items
    .map((l) => ({ ...l, url: safeUrl(l.url) }))
    .filter((l) => l.url)
    .map((l) => `<a href="${esc(l.url)}"${linkAttrs(l.url)}>${esc(l.label)}</a>`).join('');

  const companyLines = [c.legalName, c.registrationNo ? `Reg. no. ${c.registrationNo}` : '', c.address]
    .filter(Boolean).map(esc).join('<br>');

  fill('footer', `
    <div class="footer__grid">
      <div class="footer__col">
        <a class="brand" href="${base}#top">${ICONS.mark}<span class="brand__name">${esc((c.name || 'Agile Interface').toUpperCase())}</span></a>
        <div class="footer__company">${companyLines}</div>
      </div>
      <nav class="footer__col" aria-label="Explore">
        <div class="footer__heading">// explore</div>
        <a href="${base}#build">How we build</a>
        <a href="${base}#about">Get to know us</a>
        <a href="${base}#products">Products</a>
        <a href="${base}#team">Team</a>
        <a href="${base}#contact">Contact</a>
      </nav>
      <nav class="footer__col" aria-label="Legal">
        <div class="footer__heading">// legal</div>
        ${linkList(f.legal)}
      </nav>
      <nav class="footer__col" aria-label="Connect">
        <div class="footer__heading">// connect</div>
        ${c.email ? `<a href="${esc(mailto(c.email))}">${esc(c.email)}</a>` : ''}
        ${linkList(f.social)}
      </nav>
    </div>
    <div class="footer__bar">
      <div class="footer__bar-inner">
        <div><span class="commit__hash">● main</span><span>© <span data-year></span> ${esc(c.legalName || '')}. All rights reserved.</span></div>
        <div><span data-theme-status>theme: dark</span><span>Built with Kotlin</span><span>UTF-8</span></div>
      </div>
    </div>`);
}

/* ---------------- entry ---------------- */
export function renderAll(data) {
  renderHero(data.hero);
  renderTicker(data.ticker);
  renderBuild(data.build);
  renderProducts(data.products);
  renderTeam(data.team);
  renderContact(data.company, data.contact);
  renderCompanyFields(data.company);
  renderFooter(data);
}
