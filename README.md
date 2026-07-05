# Hope Baptist Church Website

The website for Hope Baptist Church, Warsaw, Indiana, live at
**https://hopebaptistwarsaw.org**.

It is a static, multi-page site (plain HTML, CSS, and JavaScript) hosted free on
GitHub Pages. There is no build step: you edit the files and push, and the live
site updates automatically.

> Working on this in Claude Code? Read **CLAUDE.md** first. It has the full
> architecture, conventions, and the gotchas that are easy to break.

## Pages

- `index.html` - Home
- `gospel.html` - What is the Gospel?
- `beliefs.html` - What We Believe (statement of faith)
- `ministries.html` - Scripture Publishing Ministry

Shared across all pages: `style.css` (all styling), `main.js` (all behavior),
`img/` (all photos and the logo).

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
