// ===== Hope Baptist Church - shared site script =====

// Mobile nav open/close
function openMobileNav() { var n = document.getElementById('mobileNav'); if (n) n.classList.add('open'); }
function closeMobileNav() { var n = document.getElementById('mobileNav'); if (n) n.classList.remove('open'); }

// Coming Soon modal
function openComingSoon() { var m = document.getElementById('comingSoonModal'); if (m) m.style.display = 'flex'; }
function closeComingSoon() { var m = document.getElementById('comingSoonModal'); if (m) m.style.display = 'none'; }

// Sticky header shadow
var siteHeader = document.getElementById('siteHeader');
if (siteHeader) {
  window.addEventListener('scroll', function () {
    siteHeader.classList.toggle('scrolled', window.scrollY > 10);
  });
}

// Fade-in on scroll
var faders = document.querySelectorAll('.fade-up');
if (faders.length) {
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) { if (e.isIntersecting) e.target.classList.add('visible'); });
  }, { threshold: 0.15 });
  faders.forEach(function (el) { io.observe(el); });
}

// Scroll to an element, accounting for the sticky header height
function scrollToWithOffset(el, extra) {
  if (!el) return;
  var h = siteHeader ? siteHeader.offsetHeight : 73;
  var top = el.getBoundingClientRect().top + window.pageYOffset - h - (extra || 0);
  window.scrollTo({ top: top, behavior: 'smooth' });
}

// Smooth-scroll same-page anchor links (e.g. #about on the homepage),
// skipping anchors that carry their own onclick handler (beliefs sub-nav, modals).
document.querySelectorAll('a[href^="#"]').forEach(function (a) {
  if (a.hasAttribute('onclick')) return;
  var id = a.getAttribute('href').slice(1);
  if (!id) return;
  a.addEventListener('click', function (e) {
    var el = document.getElementById(id);
    if (el) {
      e.preventDefault();
      closeMobileNav();
      scrollToWithOffset(el);
      history.replaceState(null, '', '#' + id);
    }
  });
});

// Close the mobile nav whenever any of its links is tapped
document.querySelectorAll('.mobile-nav a').forEach(function (a) {
  a.addEventListener('click', closeMobileNav);
});

// On load, if the URL has a hash (e.g. arriving at index.html#events from another page),
// scroll to it with the header offset applied.
window.addEventListener('load', function () {
  if (location.hash && location.hash.length > 1) {
    var el = document.getElementById(location.hash.slice(1));
    if (el) setTimeout(function () { scrollToWithOffset(el); }, 60);
  }
});

// Beliefs page sub-nav jump (clears header + sticky sub-nav)
function scrollToBelief(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var nav = document.querySelector('.beliefs-nav');
  var navH = nav ? nav.offsetHeight : 0;
  scrollToWithOffset(el, navH + 16);
}

// Expandable Scripture references (beliefs + gospel pages)
function toggleVerse(el) {
  var expanded = el.nextElementSibling;
  if (expanded && expanded.classList.contains('verse-expanded')) {
    expanded.remove();
    el.classList.remove('verse-active');
    return;
  }
  var section = el.closest('.belief-section') || el.closest('.gospel-card') || el.closest('.gospel-section');
  if (section) {
    section.querySelectorAll('.verse-expanded').forEach(function (v) { v.remove(); });
    section.querySelectorAll('.verse-active').forEach(function (v) { v.classList.remove('verse-active'); });
  }
  var text = el.getAttribute('data-verse');
  if (!text) return;
  var div = document.createElement('div');
  div.className = 'verse-expanded';
  div.innerHTML = '<strong>' + el.textContent + '</strong><br>' + text;
  el.parentNode.insertBefore(div, el.nextSibling);
  el.classList.add('verse-active');
}

// ===== Shared: Cloudflare Worker + church service schedule =====
// The Worker returns live status ("/") and the sermon list ("/videos").
// Used by both the live "Watch" button and the sermons page. If the account's
// workers.dev subdomain ever changes, update this one URL.
var HOPE_WORKER_URL = "https://hope-live-check.alexharper.workers.dev";
var HOPE_TZ = "America/Indiana/Indianapolis"; // Warsaw, IN (Eastern)

function hopeChurchParts() {
  var p = new Intl.DateTimeFormat("en-US", {
    timeZone: HOPE_TZ, weekday: "long", day: "numeric",
    hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(new Date());
  var o = {};
  p.forEach(function (x) { o[x.type] = x.value; });
  return o;
}

// True during a streamed service window. Windows are minutes-since-midnight,
// 5 min before start to 95 min after. Service times are defined here ONCE and
// shared by the live button and the sermons page. Edit here to change them.
function hopeIsLive() {
  var t = hopeChurchParts();
  var mins = parseInt(t.hour, 10) * 60 + parseInt(t.minute, 10);
  var day = parseInt(t.day, 10);
  var w = [];
  if (t.weekday === "Sunday") {
    w.push([655, 755]);                             // Morning service 11:00 AM
    w.push(day <= 7 ? [775, 875] : [1015, 1115]);   // Afternoon 1:00 PM first Sunday, else evening 5:00 PM
  }
  // Wednesday 6:30 PM service intentionally disabled for now.
  return w.some(function (x) { return mins >= x[0] && mins <= x[1]; });
}

// ===== Live service indicator =====
// During service windows the "Watch Online" buttons become a pulsing
// "Watch Live" link. When HOPE_WORKER_URL is set, the actual stream is
// confirmed and the link deep-links to the exact live video.
(function () {
  var CHANNEL_URL = "https://youtube.com/@hopebaptistchurch9868";
  var LIVE_URL = "https://youtube.com/@hopebaptistchurch9868/live";
  var btns = document.querySelectorAll('.watch-online');
  if (!btns.length) return;
  btns.forEach(function (a) { a.dataset.defaultHtml = a.innerHTML; });

  function render(live, liveUrl) {
    btns.forEach(function (a) {
      if (live) {
        a.classList.add('is-live');
        a.setAttribute('href', liveUrl);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        a.dataset.live = "1";
        a.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Watch Live';
      } else {
        a.classList.remove('is-live');
        a.setAttribute('href', CHANNEL_URL);
        a.setAttribute('target', '_blank');
        a.setAttribute('rel', 'noopener');
        a.dataset.live = "";
        a.innerHTML = a.dataset.defaultHtml;
      }
    });
  }

  function update() {
    var scheduled = hopeIsLive();
    // Outside service windows: never call the API (saves quota).
    if (!scheduled || !HOPE_WORKER_URL) {
      render(scheduled, LIVE_URL);
      return;
    }
    // Inside a window: confirm the stream is actually on and deep-link to it.
    // Fall back to the schedule guess if the check fails.
    fetch(HOPE_WORKER_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(!!d.live, d.watchUrl || LIVE_URL); })
      .catch(function () { render(true, LIVE_URL); });
  }

  update();
  setInterval(update, 60000); // re-check every minute so it flips on/off automatically
})();

// ===== Sermons page (video library + separate live section) =====
// Only runs on sermons.html (keys off #sermonGrid). Renders a click-to-play
// grid of past sermons, and shows a separate live section only while a service
// is actually streaming. Classes are namespaced "slib-" to avoid colliding
// with the homepage's ".sermon-card".
(function () {
  var grid = document.getElementById('sermonGrid');
  if (!grid) return;
  var liveSection = document.getElementById('sermonLive');
  var livePlayer = document.getElementById('sermonLivePlayer');
  var loadMore = document.getElementById('sermonLoadMore');
  var CHANNEL_URL = "https://youtube.com/@hopebaptistchurch9868";
  var nextPage = "";
  var loading = false;
  var loadedAny = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmtDate(iso) {
    try {
      return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) { return ""; }
  }
  // Privacy-enhanced embed (youtube-nocookie).
  function playerHtml(id, title, autoplay) {
    return '<div class="slib-player"><iframe src="https://www.youtube-nocookie.com/embed/' +
      encodeURIComponent(id) + '?rel=0' + (autoplay ? '&autoplay=1' : '') +
      '" title="' + esc(title) +
      '" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen" allowfullscreen></iframe></div>';
  }
  // Go fullscreen if the browser allows it (desktop). On iOS this no-ops and the
  // video plays inline; YouTube's own fullscreen button still works there.
  function requestFs(el) {
    var fn = el.requestFullscreen || el.webkitRequestFullscreen || el.msRequestFullscreen;
    if (fn) { try { fn.call(el); } catch (e) {} }
  }
  // Replace a tapped thumbnail button with its player, then request fullscreen.
  function wirePlay(btn, id, title) {
    btn.addEventListener('click', function () {
      var wrap = document.createElement('div');
      wrap.innerHTML = playerHtml(id, title, true);
      var player = wrap.firstChild;
      btn.parentNode.replaceChild(player, btn);
      requestFs(player);
    });
  }

  function card(v) {
    var el = document.createElement('div');
    el.className = 'slib-card';
    el.innerHTML =
      '<button class="slib-thumb" type="button" aria-label="Play ' + esc(v.title) + '">' +
      '<img loading="lazy" src="' + esc(v.thumb) + '" alt="' + esc(v.title) + '">' +
      '<span class="slib-play" aria-hidden="true"></span></button>' +
      '<div class="slib-meta"><p class="slib-title">' + esc(v.title) + '</p>' +
      '<p class="slib-date">' + esc(fmtDate(v.publishedAt)) + '</p></div>';
    wirePlay(el.querySelector('.slib-thumb'), v.id, v.title);
    return el;
  }

  // Live section: only during service windows, and only if the stream is
  // actually on. Hidden entirely otherwise.
  function showLive(id) {
    if (liveSection.dataset.vid === id) { liveSection.style.display = ''; return; }
    liveSection.dataset.vid = id;
    livePlayer.innerHTML = playerHtml(id, 'Live service', false);
    liveSection.style.display = '';
  }
  function hideLive() {
    if (liveSection.style.display === 'none') return;
    liveSection.style.display = 'none';
    livePlayer.innerHTML = '';
    liveSection.dataset.vid = '';
  }
  function checkLive() {
    if (!liveSection || !livePlayer) return;
    var inWindow = HOPE_WORKER_URL && typeof hopeIsLive === 'function' && hopeIsLive();
    if (!inWindow) { hideLive(); return; }
    fetch(HOPE_WORKER_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d && d.live && d.videoId) { showLive(d.videoId); } else { hideLive(); } })
      .catch(function () { /* leave current state on a transient error */ });
  }

  function loadVideos() {
    if (loading) return;
    loading = true;
    if (loadMore) { loadMore.textContent = 'Loading...'; loadMore.disabled = true; }
    var url = HOPE_WORKER_URL + '/videos' + (nextPage ? ('?page=' + encodeURIComponent(nextPage)) : '');
    fetch(url).then(function (r) { return r.json(); }).then(function (d) {
      if (!loadedAny) { grid.innerHTML = ''; loadedAny = true; } // clear the loading placeholder
      (d.videos || []).forEach(function (v) { grid.appendChild(card(v)); });
      nextPage = d.nextPage || "";
      loading = false;
      if (loadMore) {
        loadMore.disabled = false;
        loadMore.textContent = 'Load More';
        loadMore.style.display = nextPage ? 'inline-flex' : 'none';
      }
      if (!grid.children.length) {
        grid.innerHTML = '<p class="slib-error">No sermons to show yet. <a href="' + CHANNEL_URL +
          '" target="_blank" rel="noopener">Visit our YouTube channel</a>.</p>';
      }
    }).catch(function () {
      loading = false;
      if (loadMore) loadMore.style.display = 'none';
      if (!loadedAny) { grid.innerHTML = ''; loadedAny = true; }
      if (!grid.children.length) {
        grid.innerHTML = '<p class="slib-error">Sermons could not be loaded right now. ' +
          '<a href="' + CHANNEL_URL + '" target="_blank" rel="noopener">Watch on YouTube</a>.</p>';
      }
    });
  }

  if (loadMore) loadMore.addEventListener('click', loadVideos);
  loadVideos();
  checkLive();
  setInterval(checkLive, 60000); // show/hide the live section automatically
})();
