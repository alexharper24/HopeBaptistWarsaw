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

// On load, if the URL has a hash (e.g. an older bookmark to index.html#visit, or
// our-church.html#life), scroll to it with the header offset applied.
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
// confirmed first, so the buttons only flip when a stream is really on.
//
// When live they point at the site's OWN player (#sermonLive on the sermons
// page), not at YouTube, so a visitor stays on hopebaptistwarsaw.org to watch.
// YouTube remains the destination only when nothing is streaming.
//
// Any element can join this set by taking the .watch-online class. Give it
// data-offline-href if its not-live destination is something other than the
// YouTube channel, which is how the homepage "Browse Sermons" button keeps
// pointing at sermons.html when there is no service on.
(function () {
  var CHANNEL_URL = "https://www.youtube.com/@hopebaptistchurchwarsaw";
  var LIVE_ANCHOR = 'sermonLive';
  var btns = document.querySelectorAll('.watch-online');
  if (!btns.length) return;
  // Capture each button's own resting label once, before anything rewrites it.
  btns.forEach(function (a) { a.dataset.defaultHtml = a.innerHTML; });

  // Same page as the player, or a link across to it.
  function liveHref() {
    return document.getElementById(LIVE_ANCHOR) ? '#' + LIVE_ANCHOR : 'sermons.html#' + LIVE_ANCHOR;
  }

  function render(live) {
    btns.forEach(function (a) {
      if (live) {
        a.classList.add('is-live');
        a.setAttribute('href', liveHref());
        // On-site now, so no new tab.
        a.removeAttribute('target');
        a.removeAttribute('rel');
        a.dataset.live = "1";
        a.innerHTML = '<span class="live-dot" aria-hidden="true"></span>Watch Live';
      } else {
        a.classList.remove('is-live');
        var off = a.dataset.offlineHref || CHANNEL_URL;
        a.setAttribute('href', off);
        if (/^https?:/i.test(off)) {
          a.setAttribute('target', '_blank');
          a.setAttribute('rel', 'noopener');
        } else {
          a.removeAttribute('target');
          a.removeAttribute('rel');
        }
        a.dataset.live = "";
        a.innerHTML = a.dataset.defaultHtml;
      }
    });
  }

  function update() {
    var scheduled = hopeIsLive();
    // Outside service windows: never call the API (saves quota).
    if (!scheduled || !HOPE_WORKER_URL) {
      render(scheduled);
      return;
    }
    // Inside a window: confirm the stream is actually on.
    // Fall back to the schedule guess if the check fails.
    fetch(HOPE_WORKER_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(!!d.live); })
      .catch(function () { render(true); });
  }

  update();
  setInterval(update, 60000); // re-check every minute so it flips on/off automatically

  // These hrefs are written after load, so the parse-time anchor handler near the
  // top of this file never bound them. Handle the same-page jump here instead.
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href="#' + LIVE_ANCHOR + '"]');
    if (!a) return;
    var el = document.getElementById(LIVE_ANCHOR);
    if (!el || el.style.display === 'none') return;
    e.preventDefault();
    scrollToWithOffset(el, 12);
  });
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
  var CHANNEL_URL = "https://www.youtube.com/@hopebaptistchurchwarsaw";
  // Most sermons the page will hold (12 on load, one "Load More" adds 12 more).
  // Older sermons stay on the YouTube channel, linked below the grid.
  var MAX_SERMONS = 24;
  var nextPage = "";
  var loading = false;
  var loadedAny = false;

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
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
      // The sermon title already carries the service date, so the YouTube
      // upload date is deliberately not shown (they differ by a day or more).
      '<div class="slib-meta"><p class="slib-title">' + esc(v.title) + '</p></div>';
    wirePlay(el.querySelector('.slib-thumb'), v.id, v.title);
    return el;
  }

  // Live section: only during service windows, and only if the stream is
  // actually on. Hidden entirely otherwise.
  // Arriving from a Watch Live button means the hash is #sermonLive, but this
  // section is display:none until the Worker confirms a stream. Both the browser's
  // native hash jump and the load handler at the top of this file have already run
  // and missed by then, so scroll once here, after it is genuinely on screen.
  var liveHashDone = false;
  function scrollToLiveIfRequested() {
    if (liveHashDone || location.hash !== '#sermonLive') return;
    liveHashDone = true;
    setTimeout(function () { scrollToWithOffset(liveSection, 12); }, 60);
  }

  function showLive(id) {
    if (liveSection.dataset.vid === id) {
      liveSection.style.display = '';
      scrollToLiveIfRequested();
      return;
    }
    liveSection.dataset.vid = id;
    livePlayer.innerHTML = playerHtml(id, 'Live service', false);
    liveSection.style.display = '';
    scrollToLiveIfRequested();
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
      // Fill up to MAX_SERMONS only. Anything older lives on the YouTube channel,
      // which keeps this page fast on phones as the archive grows.
      var room = MAX_SERMONS - grid.querySelectorAll('.slib-card').length;
      (d.videos || []).slice(0, Math.max(room, 0)).forEach(function (v) { grid.appendChild(card(v)); });
      nextPage = d.nextPage || "";
      loading = false;
      var atCap = grid.querySelectorAll('.slib-card').length >= MAX_SERMONS;
      if (loadMore) {
        loadMore.disabled = false;
        loadMore.textContent = 'Load More';
        loadMore.style.display = (nextPage && !atCap) ? 'inline-flex' : 'none';
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


// ===== Footer columns fold on a phone =====
// The footer measured 980px tall at 390px wide, more than a screenful sitting
// under the address. Quick Links and Connect now fold behind their own
// headings below 900px, which is where .footer-grid collapses to one column.
// The brand block never folds: the address and Get Directions are what someone
// scrolls to a church footer for.
//
// The toggle and the panel are BUILT HERE rather than written into the eight
// pages, for two reasons. The heading text is then written once, so renaming a
// column cannot leave the phone and the desktop disagreeing. And a footer whose
// script never loaded keeps plain headings with every link visible, because the
// elements that do the folding never come into being; hiding links behind a
// control that cannot open them is the one failure this pattern must not have.
//
// Everything after the heading is MOVED into the panel, not cloned. Two reasons
// again: the live-service code above has already bound the .watch-online link in
// this footer and cloning would drop that listener, and moving whatever follows
// the heading works whether a site lists its links as bare <a> (this site) or
// wraps them in a <ul> (Layton Chapel), so the same block ports without a branch.
(function () {
  var cols = document.querySelectorAll('.footer-col');
  var foot = document.querySelector('.site-footer');
  if (!cols.length || !foot) return;

  var CHEVRON = '<svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"' +
    ' focusable="false"><path d="M2 4.5L6 8.5L10 4.5" fill="none" stroke="currentColor"' +
    ' stroke-width="1.8" stroke-linecap="square"></path></svg>';

  Array.prototype.forEach.call(cols, function (col) {
    // h3 on Quick Links, h4 on Connect: accept either rather than assume
    var heading = col.querySelector('h3, h4');
    if (!heading) return;

    var label = heading.textContent.trim();
    if (!label) return;
    var id = 'footer-' + label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    var panel = document.createElement('div');
    panel.className = 'footer-col-panel';
    panel.id = id;
    var clip = document.createElement('div');
    var node = heading.nextSibling;
    while (node) { var next = node.nextSibling; clip.appendChild(node); node = next; }
    panel.appendChild(clip);
    col.appendChild(panel);

    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'footer-col-toggle';
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-controls', id);
    button.appendChild(document.createTextNode(label));
    button.insertAdjacentHTML('beforeend', CHEVRON);

    // the heading keeps a plain label for desktop, where the button is hidden
    var text = document.createElement('span');
    text.className = 'footer-col-label';
    text.textContent = label;
    heading.textContent = '';
    heading.appendChild(text);
    heading.appendChild(button);

    button.addEventListener('click', function () {
      var open = !col.classList.contains('open');
      col.classList.toggle('open', open);
      button.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
  });

  foot.classList.add('footer-accordion-ready');
})();
