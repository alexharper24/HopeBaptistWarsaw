// Cloudflare Worker for Hope Baptist Church.
//
// Two endpoints, both returning small JSON with the YouTube API key kept
// server-side as a Worker secret (env.YT_API_KEY), never in the browser:
//
//   GET /         -> live status: { live, videoId, watchUrl }
//   GET /videos   -> recent uploads: { videos: [{id,title,publishedAt,thumb}], nextPage }
//                    optional ?page=<token> for pagination ("Load More")
//
// Set the secret with: npx wrangler secret put YT_API_KEY
// See README.md in this folder for full setup and deploy steps.

const CHANNEL_ID = "UCvbDv_cxJDA7OGYsRVSTBRg"; // youtube.com/@hopebaptistchurch9868
const UPLOADS_PLAYLIST = "UUvbDv_cxJDA7OGYsRVSTBRg"; // channel uploads playlist = channel id with UC -> UU
const ALLOW_ORIGIN = "https://hopebaptistwarsaw.org";
const LIVE_CACHE_SECONDS = 120;   // live check is 100 quota units, so cache it
const VIDEOS_CACHE_SECONDS = 3600; // sermon list is 1 unit and changes rarely

const CORS = {
  "Access-Control-Allow-Origin": ALLOW_ORIGIN,
  "Content-Type": "application/json",
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/videos") return handleVideos(url, env, ctx);
    return handleLive(env, ctx);
  },
};

// Is the channel live right now?
async function handleLive(env, ctx) {
  const cache = caches.default;
  const cacheKey = new Request("https://livecheck.internal/live/" + CHANNEL_ID);
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let live = false;
  let videoId = null;
  try {
    const api =
      "https://www.googleapis.com/youtube/v3/search" +
      "?part=snippet&type=video&eventType=live" +
      "&channelId=" + CHANNEL_ID +
      "&key=" + env.YT_API_KEY;
    const data = await (await fetch(api)).json();
    if (data.items && data.items.length) {
      live = true;
      videoId = data.items[0].id.videoId;
    }
  } catch (_) {
    // Fail closed: report "not live" and let the site fall back to schedule.
  }

  const resp = new Response(
    JSON.stringify({
      live: live,
      videoId: videoId,
      watchUrl: videoId ? "https://www.youtube.com/watch?v=" + videoId : null,
    }),
    { headers: Object.assign({}, CORS, { "Cache-Control": "max-age=" + LIVE_CACHE_SECONDS }) }
  );
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}

// Recent uploads (sermon library), paginated. Only returns videos that can
// actually be watched: public, embeddable, fully processed, and not a live or
// upcoming broadcast (ended live streams with no saved recording are excluded).
async function handleVideos(url, env, ctx) {
  const pageToken = url.searchParams.get("page") || "";
  const cache = caches.default;
  const cacheKey = new Request("https://livecheck.internal/videos/" + (pageToken || "first"));
  const cached = await cache.match(cacheKey);
  if (cached) return cached;

  let videos = [];
  let nextPage = null;
  try {
    let api =
      "https://www.googleapis.com/youtube/v3/playlistItems" +
      "?part=snippet&maxResults=15&playlistId=" + UPLOADS_PLAYLIST +
      "&key=" + env.YT_API_KEY;
    if (pageToken) api += "&pageToken=" + encodeURIComponent(pageToken);
    const data = await (await fetch(api)).json();
    nextPage = data.nextPageToken || null;

    const raw = {};
    const ids = [];
    (data.items || []).forEach(function (it) {
      const s = it.snippet || {};
      const vid = s.resourceId && s.resourceId.videoId;
      if (!vid) return;
      if (s.title === "Private video" || s.title === "Deleted video") return;
      const th = s.thumbnails && (s.thumbnails.medium || s.thumbnails.high || s.thumbnails.default);
      raw[vid] = { id: vid, title: s.title, publishedAt: s.publishedAt, thumb: th ? th.url : "" };
      ids.push(vid);
    });

    if (ids.length) {
      try {
        // One extra call (1 unit) to check each video's real status.
        const vapi =
          "https://www.googleapis.com/youtube/v3/videos" +
          "?part=status,snippet&id=" + ids.join(",") +
          "&key=" + env.YT_API_KEY;
        const vdata = await (await fetch(vapi)).json();
        const byId = {};
        (vdata.items || []).forEach(function (v) { byId[v.id] = v; });
        ids.forEach(function (id) {
          const v = byId[id];
          if (!v || !raw[id]) return;
          const st = v.status || {};
          const sn = v.snippet || {};
          const watchable =
            st.privacyStatus === "public" &&
            st.embeddable !== false &&
            st.uploadStatus === "processed" &&
            sn.liveBroadcastContent === "none";
          if (!watchable) return;
          // Use the current (non-live) thumbnail variant when available.
          const th = sn.thumbnails && (sn.thumbnails.medium || sn.thumbnails.high || sn.thumbnails.default);
          if (th) raw[id].thumb = th.url;
          videos.push(raw[id]);
        });
      } catch (_) {
        // If the status lookup fails, fall back to the unfiltered list.
        videos = ids.map(function (id) { return raw[id]; });
      }
    }
  } catch (_) {
    // Fail closed: return an empty list; the site shows a fallback link.
  }

  const resp = new Response(
    JSON.stringify({ videos: videos, nextPage: nextPage }),
    { headers: Object.assign({}, CORS, { "Cache-Control": "max-age=" + VIDEOS_CACHE_SECONDS }) }
  );
  ctx.waitUntil(cache.put(cacheKey, resp.clone()));
  return resp;
}
