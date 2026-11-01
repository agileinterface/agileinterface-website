# Agile Interface — company website

Static website for **Agile Interface (Private) Limited**: plain HTML, CSS and JavaScript. No framework, no build step, no `npm install`.
All the content you'll change regularly (products, team, contact, legal links…) lives in **one file: `data/site-data.json`**.

Design: "Terminal Peak" (C v2). Dark and light themes, a theme switch, and an animated Code Peak logo.

---

## 1. Folder structure

```
agile-interface-website/
├── index.html                 ← the home page (structure + section headings)
├── privacy.html               ← Privacy Policy (template — fill the [brackets])
├── terms.html                 ← Terms of Service (template)
├── 404.html                   ← "page not found" (terminal style)
│
├── data/
│   ├── site-data.json         ← ★ ALL editable content lives here
│   └── site-data.schema.json  ← rules for the JSON (VS Code autocompletes + flags mistakes)
│
├── assets/
│   ├── css/
│   │   ├── fonts.css          ← self-hosted Space Grotesk + Space Mono
│   │   ├── tokens.css         ← ★ colours for dark + light theme, fonts, sizes
│   │   ├── base.css           ← reset, typography, helpers
│   │   ├── components.css     ← every section's styles (nav, hero, cards, terminal, footer…)
│   │   └── animations.css     ← all motion (+ "reduce motion" support)
│   ├── js/
│   │   ├── main.js            ← entry point: loads the JSON, renders, starts effects
│   │   ├── render.js          ← turns JSON into HTML (safely escaped)
│   │   ├── theme.js           ← light/dark switch, remembers the choice
│   │   ├── showcase.js        ← products tabs + phone carousel
│   │   ├── terminal.js        ← the interactive "Get to know us" terminal
│   │   └── effects.js         ← typing-on-scroll, reveal-on-scroll, footer year
│   ├── fonts/                 ← .woff2 font files + their licences (OFL)
│   ├── favicon/               ← favicons + app icons (from the brand kit)
│   └── img/
│       ├── logo/              ← logo SVGs (colour + reversed)
│       ├── products/<app>/    ← ★ icon.png + screen-1..3.png for each app
│       └── og-image-1200x630.png  ← preview image for links shared on WhatsApp / LinkedIn
│
├── site.webmanifest           ← name + icons when "added to home screen"
├── robots.txt / sitemap.xml   ← for search engines (agileinterface.com)
├── _headers                   ← Cloudflare Pages: security + cache headers
└── _redirects                 ← Cloudflare Pages: short links (/delete-account etc.)
```

★ = the files you'll actually touch.

---

## 2. Run it locally

The site loads `site-data.json` with `fetch()` and uses JavaScript modules. **Browsers block both on `file://`**, so double-clicking `index.html` shows an empty page. Serve the folder instead, with any one of these:

```bash
# Option A — Node (no install needed)
npx serve .

# Option B — Python
python3 -m http.server 8080      # then open http://localhost:8080

# Option C — Cloudflare's own local server (reads _headers and _redirects, closest to production)
npx wrangler pages dev .

# Option D — VS Code: install the "Live Server" extension → right-click index.html → "Open with Live Server"
```

---

## 3. Updating content (the everyday job)

1. Open `data/site-data.json` in VS Code (the schema gives you autocomplete and red squiggles on mistakes).
2. Edit and save.
3. Refresh the browser. If the site is deployed, commit and push and it redeploys automatically.

### Change the email / company details
```json
"company": {
  "name": "Agile Interface",
  "legalName": "Agile Interface (Private) Limited",
  "registrationNo": "0123456",
  "address": "Office 4, Example Plaza, Lahore, Pakistan",
  "email": "hello@agileinterface.com",
  "location": "Lahore, Pakistan"
}
```
The email updates **everywhere at once**: contact section, footer, terminal `contact` command, privacy and terms pages.

### Add a product (and its icon + app screens)
Add an object to the `"products"` array (and keep a comma between objects):
```json
{
  "name": "Qibla Compass & Quran",
  "file": "qibla_compass_quran.kt",
  "description": "One or two sentences on what it does.",
  "status": "in-development",
  "targets": ["android"],
  "icon": "assets/img/products/qibla-compass-quran/icon.png",
  "accent": "#D9B35A",
  "tags": ["qibla", "prayer times", "quran"],
  "screens": [
    { "image": "assets/img/products/qibla-compass-quran/screen-1.png", "label": "Qibla compass" },
    { "image": "assets/img/products/qibla-compass-quran/screen-2.png", "label": "Prayer times" },
    { "image": "assets/img/products/qibla-compass-quran/screen-3.png", "label": "Quran" }
  ],
  "links": []
}
```
- `status`: `"live"`, `"in-development"` or `"coming-soon"`. Anything except `live` shows a greyed **“Coming soon on Google Play”** button.
- `targets`: any of `"android"`, `"ios"`, `"desktop"`, `"web"`.
- `accent`: the app's brand colour (`#RRGGBB`). Tints the glow behind the phones and the active dot.
- `tags`: short feature chips under the description (optional).

**App icon.** Save a square PNG (512×512 — the Play Store icon works) as `assets/img/products/<app-folder>/icon.png` and keep the `"icon"` path in the JSON. Missing file = a letter tile is shown instead.

**App screens (the phone mockups).** Take 3 screenshots from the running app (or export them from Figma), 1080×2340 PNG or WebP, and save them as `screen-1.png`, `screen-2.png`, `screen-3.png` in the same folder. Any normal phone screenshot works (it is cropped to fill the frame, top-aligned). Up to 6 are supported; `label` is the caption under the phones. Missing files = a “Screens coming soon” phone is shown for that slot.

Each app already has its folder under `assets/img/products/` (`qibla-compass-quran`, `translator`, `ai-phone-doctor`, `charging-animation`, `street-view-navigation`) and the JSON already points at the file names above, so you can just drop the files in.

**When an app goes live.** Set `"status": "live"` and add the store link — the greyed button becomes the real download button:
```json
"links": [ { "label": "Get it on Google Play", "url": "https://play.google.com/store/apps/details?id=YOUR.PACKAGE.NAME" } ]
```

### Team
```json
"team": [
  { "name": "Kazmi-dev", "role": "Kotlin Multiplatform", "linkedin": "https://www.linkedin.com/in/…", "github": "https://github.com/kazmi-dev" }
]
```
Names appear in the `Team.kt` code card. LinkedIn/GitHub links appear underneath, but only when you fill them.

### Terminal commands ("Get to know us")
```json
{ "command": "cat values.txt", "output": ["Ship small, ship often.", "Users first."] }
```
`{email}` and `{location}` inside the output are replaced with your company values.

### Other things in the JSON
`hero.tagline` (the line under the logo), `ticker` (the two scrolling rows), `build.points` / `build.steps` / `build.platforms` (the "How we build & ship" section), `contact.text` / `ctaLabel` / `emailSubject`, and `footer.legal` / `footer.social` links.

### Things that live in the HTML, not the JSON
Section **headings and intro paragraphs** (e.g. "One Kotlin codebase. Every platform.") and the code shown in the editor window are in `index.html`. Each section is marked with a `<!-- ===== N. Name ===== -->` comment so you can find it quickly. The commit hashes like `7f3a2c1` are decoration, so change them freely.

### Change colours
Edit `assets/css/tokens.css`. Every colour is a variable, defined once for dark and once for light (`--bg`, `--fg`, `--accent`…). Change it once and the whole site updates.

---

## 4. Deploy on Cloudflare Pages (free)

The site is plain files. **There is no build command.**

### Option A — Connect to GitHub (recommended: every `git push` redeploys)
1. Push this folder to a GitHub repo (the files must be at the repo root, next to `index.html`).
2. dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git** → pick the repo.
3. Build settings: Framework preset **None**, Build command **empty**, Build output directory **`/`**.
4. **Save and Deploy.** You get `https://<project>.pages.dev`.

### Option B — Upload from your computer
- Dashboard: **Workers & Pages → Create → Pages → Upload assets** → drag the folder in.
- Or from the terminal: `npx wrangler pages deploy . --project-name agile-interface`

### Custom domain (agileinterface.com is already on Cloudflare)
Pages project → **Custom domains → Set up a custom domain** → add `agileinterface.com`, then add `www.agileinterface.com` too. DNS + HTTPS are created automatically because the domain lives in the same Cloudflare account.
To send `www` → apex: **Rules → Redirect Rules** (or Bulk Redirects) for `www.agileinterface.com/*` → `https://agileinterface.com/${1}` (301). `_redirects` can't do this; it only matches paths, not hostnames.

### Things Cloudflare Pages does for you
- **Clean URLs:** `/privacy.html` is served at `/privacy` (the `.html` version 308-redirects). All links, canonicals and the sitemap already use the clean form.
- **404:** `404.html` is served automatically, with a real 404 status.
- **Headers / redirects:** from `_headers` and `_redirects` (test them locally with `npx wrangler pages dev .`).
- **Preview builds:** every branch gets its own `*.pages.dev` URL; `_headers` marks those `noindex` so Google only indexes agileinterface.com.

### Email
`hello@agileinterface.com` is used across the site. Create it for free in **Cloudflare → your domain → Email → Email Routing** (forwards to your Gmail).

### Contact form (optional)
"Start a project" opens the visitor's email app (`mailto:`), zero setup. For a real form, use Formspree / Web3Forms, or later a Pages Function (`functions/` folder).

---

## 5. Before you launch: checklist

- [ ] Replace every `[bracket]` in `data/site-data.json`.
- [x] Domain set to `agileinterface.com` everywhere (canonical, `og:` tags, robots, sitemap).
- [ ] Create `hello@agileinterface.com` with Cloudflare Email Routing.
- [ ] Write the real **Privacy Policy** (`privacy.html`). Google Play requires a privacy policy URL for your apps, plus an account-deletion URL if users can create accounts. Have it reviewed; the file is a template, not legal advice.
- [ ] Fill in `terms.html` the same way.
- [ ] Add each app's `icon.png` and `screen-1..3.png` to `assets/img/products/<app>/`.
- [ ] Open the site on a real phone, try both themes, and click every footer link.
- [ ] Run Chrome DevTools → **Lighthouse** and aim for green scores.

---

## 6. How it works (the 2-minute version)

- **HTML** holds the page structure. Empty "slots" like `<div data-slot="products">` mark where data goes.
- **`main.js`** fetches `site-data.json` and calls **`render.js`**, which builds HTML for each slot. Every value goes through `esc()` and every link through `safeUrl()`, so a stray `<` or a bad link in the JSON can't break the page or inject code.
- **Theme:** a tiny script in each page's `<head>` sets `data-theme="dark|light"` *before* the page paints (saved choice first, otherwise the visitor's system setting), so there's no flash. **`theme.js`** handles the button and remembers the choice in `localStorage`. The CSS reads colour **roles** (`var(--fg)`) instead of hard-coded hex values, just like `MaterialTheme.colorScheme` in Compose.
- **Animations** are pure CSS. JavaScript only flips classes: `.is-typing` when the code editor scrolls into view, and `.is-visible` as a reveal fallback for browsers without CSS scroll timelines. Everything turns off for visitors with "reduce motion" enabled.

---

Fonts: Space Grotesk and Space Mono, © their authors, SIL Open Font License 1.1 (licences in `assets/fonts/`).
© Agile Interface (Private) Limited.
