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
