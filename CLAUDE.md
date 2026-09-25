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
index.html              Home (hero, service strip, welcome teaser, 2026 focus, Titus Women highlight, Plan Your Visit + contact, Services & Events)
our-church.html         Our Church (welcome/mission, meet our pastor, Life at Hope gallery, ministries teaser)
gospel.html             "What is the Gospel?" (God, Problem/Sin, Penalty, Payment, Decision)
beliefs.html            "What We Believe" (13 points in 4 groups; see Belief groups)
sermons.html            Sermons (live section + past-sermon library, driven by the Cloudflare Worker)
ministries.html         Ministries hub (landing page: one card per ministry, links to detail pages)
ministries-scripture.html  Scripture Publishing Ministry (detail page)
ministries-women.html   Titus Women ministry (detail page; launching Oct 2026)
connect.html            Connection Card (online version of the paper card; live Formspree form)
style.css               All styles for every page
main.js                 All shared behavior (nav, scroll, scripture expand, live indicator, sermons page, modal)
img/                    All photos + logo
live-check-worker/      Cloudflare Worker (YouTube live status + sermon list); see its README
sitemap.xml             Lists all pages for search engines
robots.txt              Points crawlers at the sitemap
CNAME                   Custom domain (hopebaptistwarsaw.org) for GitHub Pages
.nojekyll               Tells GitHub Pages to serve files verbatim (no Jekyll)
README.md               Human-facing setup/deploy notes
```

Every page shares the same header, mobile nav, footer, and Coming Soon modal markup. If you change one of those, change it in **all pages** to keep them in sync. **Ministries** in the nav points to the `ministries.html` hub; each ministry has its own `ministries-*.html` detail page, and new ministries are added as a card on the hub plus a detail page.

**Information architecture.** Nav is six items: Our Church, The Gospel, What We Believe, Sermons, Ministries, Connection Card. All six are real pages.

**Visit is not in the nav.** It held the sixth slot until 2026-09-09, came back on 2026-09-14 while the connection card was pulled, and Connection Card took the slot again on 2026-09-24. Plan Your Visit still lives on the homepage at `index.html#visit` and is reached from the hero button, the footer Quick Links and any older external link, so do not split those details onto their own page and do not make the nav seven items without asking.

- `our-church.html` owns the About/mission copy, the pastor bio, and the Life at Hope gallery.
- `index.html` owns Plan Your Visit (what to expect, contact, location) and Services & Events, and carries `id="visit"` / `id="events"` for the nav and for older external links. `id="about"` is kept for the same reason.
- The homepage welcome block is a **short teaser written differently** from the full About copy on `our-church.html`. Keep it that way: duplicating the same paragraphs on two pages makes them compete in search.

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

8. **Google Analytics tag must stay on every page.** Each page carries a GA4 `gtag.js` snippet (measurement ID `G-4V3LJ5EJ5T`) just before `</head>`. It has been silently dropped once by committing an older local copy, which flatlined analytics. Keep it on all pages, and add it to any new page. If traffic data stops, check this tag first.

## Feature notes

### Live service indicator (main.js, bottom)
During service windows (church Eastern time) the three "Watch Online" buttons (header, mobile nav, footer) turn into a red pulsing "Watch Live" link to the live stream; otherwise they read "Watch Online" and link to the channel. Windows are defined in `isLive()` as minutes-since-midnight, 5 min before to 95 min after each service start:
- Sunday morning 11:00 AM
- Sunday evening 5:00 PM, **automatically 1:00 PM on the first Sunday of the month** (the evening service moves; it is not an extra service)
- Wednesday 6:30 PM, **enabled 2026-09-20** at the church's request. Window is `[1105, 1205]`, which is 6:25 PM to 8:05 PM.

Timezone is `America/Indiana/Indianapolis` (computed via `Intl`, so it is correct regardless of the visitor's location). It re-checks every 60 seconds. To change service times or add a streamed service, edit `isLive()`.

The schedule is the gate. When `LIVE_CHECK_URL` is set (near the top of the live indicator block), the site also **confirms the actual stream** during those windows via a Cloudflare Worker (see `live-check-worker/`) that queries the YouTube Data API and returns `{live, watchUrl}`, and it deep-links to the exact live video. The Worker holds the API key as a secret so it never ships to the browser. If the Worker is unreachable, or `LIVE_CHECK_URL` is blank, the site falls back to the schedule alone. The Worker is only called during scheduled windows, so there is no API usage the rest of the week.

### Sermons page (sermons.html + main.js)
Two independent parts:

- **Live section** (`#sermonLive`): hidden entirely unless a service is actually streaming. It re-checks every 60s, so it appears and disappears on its own. Gated by `hopeIsLive()` first, so the API is only called during service windows.
- **Past Sermons library** (`#sermonGrid`): loads from the Worker's `/videos` endpoint as click-to-play thumbnails (the YouTube iframe loads only on tap, and uses `youtube-nocookie.com`).

`MAX_SERMONS` in `main.js` caps the library at **24** (12 on load, one "Load More" adds 12 more, then the button hides). Older sermons intentionally stay on YouTube, linked below the grid, so the page stays fast on phones as the archive grows. Raise that constant to hold more.

The Worker returns **only watchable videos**: public, embeddable, processed, not a live/upcoming broadcast, and with a non-zero duration. That last check matters, since an ended live stream with no saved recording reports zero duration and would otherwise show up and then say "Live stream offline" when clicked. `CACHE_VERSION` in `worker.js` must be bumped whenever the filtering logic changes, or Cloudflare's edge cache will keep serving the old list.

### YouTube
Current channel: `https://www.youtube.com/@hopebaptistchurchwarsaw`. Used for Sermons links, the "Browse Sermons" hero button, Watch Online (channel) / Watch Live (channel `/streams`), and the footer YouTube link. The handle changed from `@hopebaptistchurch9868` to `@hopebaptistchurchwarsaw`; if it changes again, update `CHANNEL_URL` and `LIVE_URL` in `main.js` plus the YouTube `href`s in every HTML page and the `sameAs` entry in the JSON-LD on `index.html`. The Worker is unaffected by handle changes because it keys off the channel ID (`UCvbDv_cxJDA7OGYsRVSTBRg`), which stays the same.

### Belief groups (beliefs.html)
The thirteen doctrines sit inside four `<section class="belief-group" id="...">` wrappers,
each led by an `<h2 class="belief-group-title">`. Heading outline is **h1 page, h2 group,
h3 doctrine**, so the per-doctrine headings are `<h3>` and `.belief-section h3` carries
their styling. Do not put an `<h2>` inside a belief section.

| Group id | Title | Doctrines |
|---|---|---|
| `god-and-word` | God and His Word | scripture, god, christ, spirit |
| `creation-and-salvation` | Creation, Man, and Salvation | creation, sin, salvation, security |
| `church-and-living` | The Church and Christian Living | church, baptism, separation |
| `last-things` | Last Things | israel, return |

**The jump nav points at the four group ids, not the thirteen doctrine ids.** That is the
whole point of the grouping: thirteen pills wrapped to six rows at 375px. The individual
`#scripture`, `#israel` and so on still exist and still work as deep links, and both
`.belief-section[id]` and `.belief-group[id]` carry `scroll-margin-top`.

**Creation moved** from last on the page to the head of the second group on 2026-09-19.
It had been appended after the original twelve and sat oddly after The Second Coming.

Adding a fifth group means a fifth pill, which is what pushes the phone nav to a third
row, so prefer adding a doctrine to an existing group. If the labels ever need to grow,
make the nav a single horizontal scroll strip on mobile rather than letting it wrap.

### Connection card (connect.html) — LIVE
**Relaunched 2026-09-24** with the real Formspree endpoint `https://formspree.io/f/mwlpqwbg`.
It was pulled on 2026-09-14 in `bd57c2c` because it posted to a placeholder, and the page
content came back from `e073d74` onto the current shared shell rather than by a plain
checkout, because the header and footer had drifted in the meantime.

The online version of the church's printed connection card, built so a QR code on the
printed card can point at it. Plain `POST` to Formspree, no JavaScript involved, so it
keeps working if `main.js` ever fails. Field labels and the checkboxes under "Do any of
these apply to you?" are **verbatim from the paper card** and should not be reworded
without the church saying so.

Only `name` is required. Everything else is optional, because the card includes "I am
just visiting and would prefer not to be contacted by anyone" and it would be wrong to
force contact details out of someone who ticks it. The address fields exist so the
church can drop a gift card off in person, and the copy says so.

Spam control is the `_gotcha` honeypot, which Formspree discards on. It legitimately
sits outside the viewport; that is not a layout bug.

**If the endpoint is ever swapped back to a placeholder, restore the yellow `.form-todo`
notice above the form in the same edit.** Never let this page ship looking functional
while it silently drops submissions. The `.form-todo` styles are still in `style.css`.

The page sits in the main nav in the Visit slot, and is also reached by QR code, the
footer Quick Links, and a button in Plan Your Visit on the homepage. Visit itself keeps
its footer link, the hero button, and the `#visit` anchor on the homepage.

**Faith Baptist School is deliberately not one of the checkboxes.** It is on the printed
card, but the church asked for it to be left off the online version. Do not add it back
without them asking.

### Footer columns fold on a phone (added 2026-09-14)

At 390px wide the footer measured 980px, more than a screenful of links sitting under
the address. Below 900px, Quick Links and Connect fold behind their own headings and the
footer is 436px. Desktop is untouched at 382px.

- **The toggle, its chevron and the panel are built by `main.js`, not written into the
  eight pages.** The pages are unchanged apart from the `?v=` bumps: the columns already
  carried `class="footer-col"`. Two reasons to keep it that way. The heading text is
  written once, so renaming a column cannot leave the phone and the desktop disagreeing.
  And a footer whose script never loaded keeps plain headings with every link visible,
  because the elements that do the folding never come into being. Hiding links behind a
  control that cannot open them is the one failure this pattern must not have. Do not
  move the toggle markup into the HTML.
- **The `.footer-brand` block never folds.** The address and Get Directions are what
  someone scrolls to a church footer for.
- **Everything after the heading is MOVED into the panel, not cloned.** The live-service
  code above it has already bound the footer's `.watch-online` link, and cloning would
  drop that listener. Moving whatever follows the heading also means the same block works
  on sites that wrap footer links in a `<ul>` rather than listing bare `<a>`, which is how
  it ports to the other church sites unchanged.
- **The breakpoint is 900px because that is where `.footer-grid` already collapses to one
  column.** Not a number picked to look tidy. Verified at the edge: 901px gives three
  columns with the fold off, 900px gives one column with the fold on.
- **Closed panels set `visibility: hidden` as well as a zero grid row.** The zero row
  collapses the height; visibility is what takes the links out of the tab order and out
  of the way of taps, the way `display:none` used to. With both columns closed the only
  reachable footer links are Get Directions and the Harper Studio credit.
- Known and deliberately left alone: Quick Links is an `<h3>` and Connect an `<h4>`. The
  JS accepts either. Worth normalising one day, but it is a pre-existing inconsistency,
  not something this change introduced.

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
- YouTube: https://www.youtube.com/@hopebaptistchurchwarsaw

## Common tasks

- **Change wording or a photo on one page:** edit that page's `.html`. For a photo, drop the new compressed file in `img/` and point the `src` at it. Commit both.
- **Change something in the header, footer, nav, or modal:** edit it in all four HTML files identically.
- **Change site-wide colors/spacing/fonts:** edit `style.css`.
- **Change behavior (nav, scroll, live indicator, scripture expand):** edit `main.js`.
- **Add a new page:** copy an existing page as a template, keep the shared header/footer/modal, write the head tags (title/description/canonical/OG), add the nav links in all pages, and add the URL to `sitemap.xml`.

After any change: run the local server, click through on desktop and a phone viewport, confirm no broken images, then commit and push.
