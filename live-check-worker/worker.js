// Cloudflare Worker: real-time YouTube live check for Hope Baptist Church.
//
// It asks the YouTube Data API whether the channel is currently live and
// hands the website a tiny JSON answer: { live: true/false, watchUrl: ... }.
// The API key never touches the browser. It is stored as a Worker secret
// (env.YT_API_KEY), set with: npx wrangler secret put YT_API_KEY
//
// See README.md in this folder for full setup and deploy steps.

const CHANNEL_ID = "UCvbDv_cxJDA7OGYsRVSTBRg"; // youtube.com/@hopebaptistchurch9868
const ALLOW_ORIGIN = "https://hopebaptistwarsaw.org";
const CACHE_SECONDS = 120; // one upstream YouTube call at most this often (protects quota)

export default {
  async fetch(request, env, ctx) {
    const cors = {
      "Access-Control-Allow-Origin": ALLOW_ORIGIN,
      "Content-Type": "application/json",
    };

    // Serve a cached answer if we have a fresh one. Every visitor shares it,
    // so page traffic does not multiply YouTube API usage.
    const cache = caches.default;
    const cacheKey = new Request("https://livecheck.internal/" + CHANNEL_ID);
    const cached = await cache.match(cacheKey);
    if (cached) return cached;

    let live = false;
    let videoId = null;
    try {
      const url =
        "https://www.googleapis.com/youtube/v3/search" +
        "?part=snippet&type=video&eventType=live" +
        "&channelId=" + CHANNEL_ID +
        "&key=" + env.YT_API_KEY;
      const data = await (await fetch(url)).json();
      if (data.items && data.items.length) {
        live = true;
        videoId = data.items[0].id.videoId;
      }
    } catch (_) {
      // Fail closed: if YouTube errors, report "not live" and let the
      // website fall back to its schedule based guess.
    }

    const resp = new Response(
      JSON.stringify({
        live: live,
        watchUrl: videoId ? "https://www.youtube.com/watch?v=" + videoId : null,
      }),
      { headers: Object.assign({}, cors, { "Cache-Control": "max-age=" + CACHE_SECONDS }) }
    );

    ctx.waitUntil(cache.put(cacheKey, resp.clone()));
    return resp;
  },
};
