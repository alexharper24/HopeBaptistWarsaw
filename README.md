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

Shared across all pages: `style.css` (all styling), `main.js` (all behavior),
`img/` (all photos and the logo).

## Still pending

- **Connection card page is pulled, waiting on Stephen.** It was taken down on
  14 September 2026 until he creates the Formspree account, so
  `hopebaptistwarsaw.org/connect.html` returns 404 and nothing links to it. The
  page itself is safe in git. To bring it back:

  1. `git checkout e073d74 -- connect.html`
  2. Paste the real Formspree ID over `REPLACE_THIS_FORMSPREE_ID` in the form
     `action`, and delete the yellow notice above the form.
  3. Put Connection Card back in the main nav and mobile nav on every page, in
     the Visit slot.
  4. Re-add the footer Quick Links entry, the button in Plan Your Visit on
     `index.html`, and the `sitemap.xml` line.
  5. Raise the two header-fit breakpoints in `style.css` from 920 and 1000 back
     to 980 and 1120, or six nav items will wrap against the Watch Online button.
  6. Bump `style.css?v=` on every page in the same commit.

  The form styles are still in `style.css` on purpose. Do not clean them out.

- **Decide the destination inbox** for connection cards. Set it in the Formspree
  dashboard, not in this repo. The first real submission triggers a one time
  confirmation email that somebody has to click before anything gets delivered.
  Free tier is 50 submissions per month.
- **QR code for the printed card.** Once the form is live, generate a QR pointing
  at `https://hopebaptistwarsaw.org/connect.html` and drop it into the printed
  card artwork where the placeholder sits.

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
