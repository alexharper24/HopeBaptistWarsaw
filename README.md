# Hope Baptist Church Website

The website for Hope Baptist Church, Warsaw, Indiana, live at
**https://hopebaptistwarsaw.org**.

It is a static, multi-page site (plain HTML, CSS, and JavaScript) hosted free on
GitHub Pages. There is no build step: you edit the files and push, and the live
site updates automatically.

> Working on this in Claude Code? Read **CLAUDE.md** first. It has the full
> architecture, conventions, and the gotchas that are easy to break.

## Pages

- `index.html` - Home (includes Plan Your Visit and Services & Events)
- `our-church.html` - Our Church
- `gospel.html` - What is the Gospel?
- `beliefs.html` - What We Believe (statement of faith)
- `sermons.html` - Sermons
- `ministries.html` - Ministries hub
- `ministries-scripture.html` - Scripture Publishing Ministry
- `ministries-women.html` - Titus Women
- `connect.html` - Connection Card (online version of the paper card)

Shared across all pages: `style.css` (all styling), `main.js` (all behavior),
`img/` (all photos and the logo).

## Still pending

- **Connection card is live.** Relaunched 24 September 2026 at
  `hopebaptistwarsaw.org/connect.html`, posting to
  `https://formspree.io/f/mwlpqwbg`. It sits in the main nav in the Visit slot,
  in the footer Quick Links, and behind a button in Plan Your Visit on the
  homepage.

- **Click the Formspree confirmation email.** The first real submission triggers
  a one time confirmation to the destination inbox, and nothing is delivered
  until somebody clicks it. Send a test card through and confirm it arrives
  before the QR code goes on anything printed.

- **Confirm the destination inbox** in the Formspree dashboard, not in this
  repo. Free tier is 50 submissions per month, which is the cap to watch.
- **QR code for the printed card.** Generate a QR pointing at
  `https://hopebaptistwarsaw.org/connect.html` and drop it into the printed card
  artwork where the placeholder sits.

Note: the Faith Baptist School checkbox on the printed card is deliberately left
off the online form, at the church's request.

## Preview locally

No build needed. Serve the folder and open it in a browser:

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

Test on a phone too (or the browser device emulator), since the site is
phone-first and has had mobile-only issues in the past.

## Connect to GitHub and work in Claude Code

If the repository already exists on GitHub (it does, this site is live), clone it
and open it in Claude Code:

```bash
git clone https://github.com/<your-username>/<your-repo>.git
cd <your-repo>
claude            # start Claude Code in the project folder
```

If you are starting the repo fresh from this folder instead:

```bash
git init
git add -A
git commit -m "Initial commit: Hope Baptist Church website"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

Claude Code automatically reads `CLAUDE.md`, so it will pick up the project
conventions on its own.

## Deploy (automatic on push)

GitHub Pages is configured to deploy from the `main` branch, root folder. Any
push to `main` publishes within a minute or two:

```bash
git add -A
git commit -m "describe your change"
git push
```

One-time GitHub settings (already done for the live site): Settings -> Pages ->
Deploy from a branch -> `main` / root, and check "Enforce HTTPS". The `CNAME`
file keeps the custom domain attached; do not delete it.

## Most important rule

When you add or change a **photo**, commit the file in `img/` along with the
HTML. HTML going up without its images is the number one cause of broken images
on the live site. After deploying, confirm an image URL such as
`https://hopebaptistwarsaw.org/img/logo.jpg` loads directly.

## After changes go live

- Google Search Console: submit `sitemap.xml` so search engines re-crawl.
- Keep a Google Business Profile for the church address for local search.
