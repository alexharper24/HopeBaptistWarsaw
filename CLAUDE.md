# CLAUDE.md

Context for working on the Hope Baptist Church website in Claude Code. Read this before making changes.

## What this is

The public website for Hope Baptist Church (Warsaw, Indiana), live at **hopebaptistwarsaw.org**. It is a hand-maintained **static multi-page site** hosted free on **GitHub Pages**. No backend, no build step, no framework. You edit HTML/CSS/JS files directly and push to deploy.

The audience is ordinary church visitors and people searching for a church locally, so the priorities are: loads fast on phones, easy to read, found by Google and AI assistants, and doctrinally accurate.

## Tech stack

- Plain HTML, CSS, and vanilla JavaScript. No React, no bundler, no npm.
- Shared `style.css` and `main.js` linked by every page.
- Google Fonts (Lora + Source Sans 3) is the only external dependency.
- Images are real files in `img/` (not base64 embedded).
- Hosting: GitHub Pages, custom domain via `CNAME`, free SSL.

## File structure

```
index.html        Home (hero, welcome/mission, 2026 focus, services+events, gallery, pastor, visit/contact)
gospel.html       "What is the Gospel?" (God, Problem/Sin, Penalty, Payment, Decision)
beliefs.html      "What We Believe" (12-point statement of faith)
ministries.html   Scripture Publishing Ministry
style.css         All styles for every page
main.js           All shared behavior (nav, scroll, scripture expand, live indicator, modal)
img/              All photos + logo
sitemap.xml       Lists all four pages for search engines
robots.txt        Points crawlers at the sitemap
CNAME             Custom domain (hopebaptistwarsaw.org) for GitHub Pages
.nojekyll         Tells GitHub Pages to serve files verbatim (no Jekyll)
README.md         Human-facing setup/deploy notes
```

Every page shares the same header, mobile nav, footer, and Coming Soon modal markup. If you change one of those, change it in **all four** pages to keep them in sync.

## Local development

There is no build. To preview, serve the folder and open it in a browser:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Use a real server (not opening the file directly) so paths and fetches behave like production. **Always test on a phone or the browser device emulator** — this site has had several mobile-only issues (see gotchas).

## Deployment

GitHub Pages is set to **deploy from the `main` branch, root folder**. So:

```bash
git add -A
git commit -m "describe the change"
git push
```

Every push to `main` publishes within a minute or two. `CNAME` keeps the custom domain attached; do not delete it. "Enforce HTTPS" is enabled in the repo's Pages settings.

Critical: when you add or change an image, **commit the file in `img/`**. The single most common production bug on this site is HTML going up without the image files, which shows broken images. Verify `hopebaptistwarsaw.org/img/<name>.jpg` loads after deploy.

## Design system

Defined as CSS variables at the top of `style.css`:

- Navy `#1e3054` (brand: headers, buttons, nav), navy-dark `#152340`, navy-light `#2a4270`
- Gold `#c9a84c` (accents, section eyebrows, underlines)
- Cream `#faf8f4` (alternating section background), white `#ffffff`
- Text `#2d2d2d`, text-light `#5a5a5a`
- Fonts: Lora (serif) for headings, Source Sans 3 (sans) for body
- Sections alternate white / cream down the page. Section padding ~56px desktop, ~40px mobile.

Icons are inline SVG (never an icon font — icon fonts failed to render reliably here).

## Critical conventions and gotchas (do not regress these)

1. **Light-mode lock.** iOS Safari auto-inverts pages that do not declare a color scheme, turning the site into unreadable dark-on-dark. Every page has, and must keep: the two `<meta name="color-scheme">` / `supported-color-schemes` tags, `color-scheme: light only !important` in `:root`, and a `@media (prefers-color-scheme: dark)` block in `style.css` that forces backgrounds back to light. If you add a section/card background class, add it to that dark-mode override too. Note: that override uses `!important`, so any element meant to stay dark (like the navy modal box) needs its own protected class.

2. **No em dashes or en dashes anywhere in visible content.** They read as AI-generated. Use periods, commas, colons, "at", or parentheses. Applies to copy, alt text, everything a visitor can see.

3. **Relative image paths only.** Always `img/name.jpg`, never `/img/...` (a leading slash breaks on project subpaths). All lowercase filenames; GitHub Pages is case-sensitive.

4. **New images must be compressed.** Use Pillow: content/gallery photos ~600-700px wide, hero ~1280px, logo ~200px, JPEG quality ~68-72, progressive. Keep files small; this is a phone-first site. Then commit the file.

5. **Navigation.** Real page links (`beliefs.html`, `gospel.html`, `ministries.html`). Homepage section links are `#about` / `#events` / `#visit` on `index.html`, and `index.html#about` etc. from the other pages. `main.js` smooth-scrolls same-page anchors with the sticky-header offset applied, and on load it scrolls to `location.hash` with the same offset (so cross-page anchors land correctly). Do not hardcode the header height; it is measured live.

6. **Expandable Scripture references.** A `<span class="scripture" onclick="toggleVerse(this)" data-verse="...">Ref</span>` drops the verse text in below on tap and closes any other open verse in the same card. Used on beliefs and gospel pages. The KJV text lives in the `data-verse` attribute.

7. **Doctrine is KJV-preferring, fundamental Baptist.** Do not soften, add, or change doctrinal statements without the church confirming. When in doubt, ask rather than guess.

## Feature notes

### Live service indicator (main.js, bottom)
During service windows (church Eastern time) the three "Watch Online" buttons (header, mobile nav, footer) turn into a red pulsing "Watch Live" link to the live stream; otherwise they read "Watch Online" and link to the channel. Windows are defined in `isLive()` as minutes-since-midnight, 5 min before to 95 min after each service start:
- Sunday morning 11:00 AM
- Sunday evening 5:00 PM, **automatically 1:00 PM on the first Sunday of the month**
- Wednesday 6:30 PM

Timezone is `America/Indiana/Indianapolis` (computed via `Intl`, so it is correct regardless of the visitor's location). It re-checks every 60 seconds. To change service times or add a streamed service, edit `isLive()`. The schedule is the source of truth; it does not detect the actual stream (that would need the YouTube API and a key, unsafe on a static site).

### YouTube
Current channel: `https://youtube.com/@hopebaptistchurch9868`. Used for Sermons links, the "Browse Sermons" hero button, Watch Online (channel) / Watch Live (channel `/live`), and the footer YouTube link. If the channel changes, update `CHANNEL_URL` and `LIVE_URL` in `main.js` and the Sermons/YouTube `href`s in the four HTML files.

### Coming Soon modal
`#comingSoonModal` markup is still in each page and `openComingSoon()`/`closeComingSoon()` remain in `main.js`, but nothing currently triggers the modal (Sermons and Watch now link to YouTube). It is kept as a ready-made pattern for future "not yet live" features. It closes on backdrop click and on its buttons.

### SEO / AI discoverability
Each page has a unique `<title>`, meta description, canonical URL, and Open Graph tags. `index.html` carries JSON-LD `Church` structured data (address, phone, email, sameAs). When you **add a page**, give it those head tags and add its URL to `sitemap.xml`. Keep the structured data accurate.

## Church facts (keep edits consistent with these)

- Name: Hope Baptist Church. Location: outskirts of Winona Lake and Warsaw, Indiana.
- Address: 2277 E Pierceton Rd, Warsaw, IN 46580. Map: https://maps.app.goo.gl/dWw3AADZCu6NSRm28
- Phone: (574) 377-0573. Email: info@hopebaptistwarsaw.org. Domain: hopebaptistwarsaw.org
- Pastor: Stephen Williams.
- Services: Sunday School 10:00 AM, Morning 11:00 AM, Sunday Evening 5:00 PM (1:00 PM first Sunday), Wednesday 6:30 PM.
- Regular events: Men's Morning Bible Study (Thu 6:45 AM), Saturday Men's Prayer (Sat 7:00 PM), Town Outreach (3rd Friday, summer only), Symphony of Prayer (1st Saturday 9:00 AM).
- Facebook: https://www.facebook.com/profile.php?id=61586909768207
- YouTube: https://youtube.com/@hopebaptistchurch9868

## Common tasks

- **Change wording or a photo on one page:** edit that page's `.html`. For a photo, drop the new compressed file in `img/` and point the `src` at it. Commit both.
- **Change something in the header, footer, nav, or modal:** edit it in all four HTML files identically.
- **Change site-wide colors/spacing/fonts:** edit `style.css`.
- **Change behavior (nav, scroll, live indicator, scripture expand):** edit `main.js`.
- **Add a new page:** copy an existing page as a template, keep the shared header/footer/modal, write the head tags (title/description/canonical/OG), add the nav links in all pages, and add the URL to `sitemap.xml`.

After any change: run the local server, click through on desktop and a phone viewport, confirm no broken images, then commit and push.
