# Live check Worker

A tiny Cloudflare Worker that reports whether the church's YouTube channel is
**actually live right now**. The website (`main.js`) uses it to upgrade the
"Watch Live" indicator from a schedule based guess to real detection.

The YouTube API key is held here as a Worker **secret**, so it never appears in
the public website. This is the whole reason the Worker exists: a static
GitHub Pages site cannot safely hold an API key.

## How it fits together

```
Browser (main.js)              This Worker                    YouTube Data API
─────────────────              ───────────                    ────────────────
isLive() schedule gate   ──▶   holds API key (secret)   ──▶   search.list
 only calls when a             120s shared cache               eventType=live
 service should be on          returns {live, watchUrl}  ◀──   (100 quota units)
```

`main.js` only calls the Worker during scheduled service windows, so there is
zero API usage the rest of the week. If the Worker is unreachable, the site
silently falls back to the schedule based behavior. Nothing breaks.

## One time setup

1. **YouTube API key** (Google Cloud Console, https://console.cloud.google.com/):
   - Create a project.
   - APIs and Services -> Library -> enable **YouTube Data API v3**.
   - Credentials -> Create credentials -> **API key**. Copy it.
   - Edit the key -> API restrictions -> restrict to **YouTube Data API v3**.

2. The channel ID is already filled in `worker.js`
   (`UCvbDv_cxJDA7OGYsRVSTBRg` = youtube.com/@hopebaptistchurch9868).
   To confirm or change it:
   ```
   https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=hopebaptistchurch9868&key=YOUR_KEY
   ```

## Deploy

From inside this folder:

```bash
npm install -g wrangler        # first time only, if you do not have it
wrangler login                 # opens a browser to authorize Cloudflare
wrangler secret put YT_API_KEY # paste the API key when prompted
wrangler deploy
```

Deploy prints a URL like:

```
https://hope-live-check.<your-subdomain>.workers.dev
```

## Turn it on in the website

Open `../main.js`, find `LIVE_CHECK_URL` near the top of the live indicator
block, and paste the Worker URL between the quotes:

```js
var LIVE_CHECK_URL = "https://hope-live-check.<your-subdomain>.workers.dev";
```

Commit and push. While that value is an empty string, the site behaves exactly
as before (schedule only), so it is safe to leave blank until the Worker is up.

## Quota notes

- Free quota: 10,000 units/day. Each check costs 100 units.
- The 120s cache means all visitors share one upstream call per two minutes.
- A normal service (~90 min) is well under quota. On a two-service Sunday it is
  close; if you ever hit the limit, request a free quota increase in the Cloud
  Console or raise `CACHE_SECONDS` in `worker.js`.

## Cost

Free. Cloudflare Workers free plan is 100,000 requests/day; the YouTube API is
free within quota.
