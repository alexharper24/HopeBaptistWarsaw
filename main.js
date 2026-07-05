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

// ===== Live service indicator =====
// During service times (church local time, Eastern) the "Watch Online" buttons
// become a pulsing "Watch Live" link straight to the YouTube live stream.
// Outside those windows they behave normally (Coming Soon).
(function () {
  var CHANNEL_URL = "https://youtube.com/@hopebaptistchurch9868";
  var LIVE_URL = "https://youtube.com/@hopebaptistchurch9868/live";
  var TZ = "America/Indiana/Indianapolis"; // Warsaw, IN (Eastern)
  // Optional real-time confirmation. Paste the Cloudflare Worker URL here after
  // deploying live-check-worker/ to switch from schedule-guess to actual YouTube
  // live detection. Left blank, the schedule alone drives the indicator.
  var LIVE_CHECK_URL = "";
  var btns = document.querySelectorAll('.watch-online');
  if (!btns.length) return;
  btns.forEach(function (a) { a.dataset.defaultHtml = a.innerHTML; });

  function churchParts() {
    var p = new Intl.DateTimeFormat("en-US", {
      timeZone: TZ, weekday: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false
    }).formatToParts(new Date());
    var o = {};
    p.forEach(function (x) { o[x.type] = x.value; });
    return o;
  }

  // Service start times as minutes-since-midnight, with a window from
  // 5 min before start to 95 min after (covers the whole service).
  function isLive() {
    var t = churchParts();
    var mins = parseInt(t.hour, 10) * 60 + parseInt(t.minute, 10);
    var day = parseInt(t.day, 10);
    var w = [];
    if (t.weekday === "Sunday") {
      w.push([655, 755]);                             // Morning service 11:00 AM
      w.push(day <= 7 ? [775, 875] : [1015, 1115]);   // Evening: 1:00 PM first Sunday, else 5:00 PM
    } else if (t.weekday === "Wednesday") {
      w.push([1105, 1205]);                           // Wednesday 6:30 PM
    }
    return w.some(function (x) { return mins >= x[0] && mins <= x[1]; });
  }

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
    var scheduled = isLive();
    // Outside service windows: never call the API (saves quota).
    // Inside a window with no Worker configured: trust the schedule.
    if (!scheduled || !LIVE_CHECK_URL) {
      render(scheduled, LIVE_URL);
      return;
    }
    // Inside a window with a Worker: confirm the stream is actually on,
    // and deep-link to the exact live video. Fall back to the schedule
    // guess if the check fails.
    fetch(LIVE_CHECK_URL)
      .then(function (r) { return r.json(); })
      .then(function (d) { render(!!d.live, d.watchUrl || LIVE_URL); })
      .catch(function () { render(true, LIVE_URL); });
  }

  update();
  setInterval(update, 60000); // re-check every minute so it flips on/off automatically
})();
