# Hope Baptist Church Website (multi-page)

A fast, SEO-friendly static website. Each page is its own file with its own
title, description, and structured data, so search engines and AI assistants
can index every page on its own URL.

## Files
- `index.html` ........ Home
- `gospel.html` ....... What is the Gospel?
- `beliefs.html` ...... What We Believe (statement of faith)
- `ministries.html` ... Scripture Publishing Ministry
- `style.css` ......... shared styles (edit once, applies everywhere)
- `main.js` ........... shared script (nav, scripture expand, scrolling)
- `img/` .............. all photos and the logo
- `sitemap.xml`, `robots.txt` ... help search engines find every page
- `CNAME` ............. custom domain for GitHub Pages
- `.nojekyll` ......... tells GitHub Pages to serve all files as-is

## Hosting on GitHub Pages (free)
1. Create a public repository.
2. Upload EVERYTHING in this folder, keeping the `img/` folder intact.
   Upload all files at the top level (so `index.html` is at the repo root).
   The single most common mistake is forgetting to upload the image files,
   which shows broken images on the live site. Upload the whole folder.
3. Settings -> Pages -> Deploy from a branch -> main -> / (root).
4. The `CNAME` file already points the site at hopebaptistwarsaw.org. In
   GoDaddy DNS, add four A records on @ to GitHub's IPs
   (185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153)
   and a CNAME on www to <username>.github.io.
5. Check "Enforce HTTPS" for free SSL.

## Editing later
- Change words/photos on a page: edit that page's `.html` file.
- Change colors, fonts, spacing for the whole site: edit `style.css`.
- Add a new photo: drop it in `img/` and reference it as `img/yourphoto.jpg`.
  Always upload new image files to GitHub along with the HTML.

## After it's live (helps people find the church)
- Set up a free Google Business Profile for the church address.
- Add the site in Google Search Console and submit `sitemap.xml`.
- Link the site from the church Facebook page.
