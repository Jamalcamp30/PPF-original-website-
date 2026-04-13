/* ============================================================
   PPF MEGA-NAV — Hamburger + Dropdown Controller
   - Hamburger toggle (mobile)
   - Accordion dropdown toggle (mobile)
   - Close on link click
   - Close on outside click
   - Close on Escape key
   ============================================================ */
(function () {
  'use strict';

  var hamburger = document.getElementById('navHamburger');
  var menu = document.getElementById('navMenu');
  if (!hamburger || !menu) return;

  var dropdownItems = menu.querySelectorAll('.nav-menu__item--has-dropdown');
  var isMobile = function () {
    return window.innerWidth <= 960;
  };

  /* ── Hamburger toggle ────────────────────────────────── */
  function toggleMenu() {
    var isOpen = hamburger.classList.contains('is-open');
    hamburger.classList.toggle('is-open');
    menu.classList.toggle('is-open');
    hamburger.setAttribute('aria-expanded', String(!isOpen));

    // Prevent body scroll when menu is open
    if (!isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  function closeMenu() {
    hamburger.classList.remove('is-open');
    menu.classList.remove('is-open');
    hamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';

    // Close all dropdowns
    dropdownItems.forEach(function (item) {
      item.classList.remove('is-dropdown-open');
    });
  }

  hamburger.addEventListener('click', function (e) {
    e.stopPropagation();
    toggleMenu();
  });

  /* ── Mobile dropdown accordion ───────────────────────── */
  dropdownItems.forEach(function (item) {
    var link = item.querySelector('.nav-menu__link');
    if (!link) return;

    link.addEventListener('click', function (e) {
      if (!isMobile()) return; // Let desktop hover work naturally

      // Prevent navigation — toggle dropdown instead
      e.preventDefault();
      e.stopPropagation();

      var wasOpen = item.classList.contains('is-dropdown-open');

      // Close all other dropdowns
      dropdownItems.forEach(function (other) {
        if (other !== item) other.classList.remove('is-dropdown-open');
      });

      // Toggle this dropdown
      item.classList.toggle('is-dropdown-open', !wasOpen);
    });
  });

  /* ── Close menu on dropdown link click (mobile) ──────── */
  var dropdownLinks = menu.querySelectorAll('.nav-dropdown__item');
  dropdownLinks.forEach(function (link) {
    link.addEventListener('click', function () {
      if (isMobile()) {
        closeMenu();
      }
    });
  });

  /* ── Close on outside click ──────────────────────────── */
  document.addEventListener('click', function (e) {
    if (isMobile() && menu.classList.contains('is-open')) {
      if (!menu.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    }
  });

  /* ── Close on Escape key ─────────────────────────────── */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menu.classList.contains('is-open')) {
      closeMenu();
      hamburger.focus();
    }
  });

  /* ── Close menu on resize to desktop ─────────────────── */
  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (!isMobile() && menu.classList.contains('is-open')) {
        closeMenu();
      }
    }, 150);
  });

  /* ── Nav scroll behavior (scrolled class) ────────────── */
  var nav = document.getElementById('siteNav');
  if (nav) {
    var lastScroll = 0;
    function onScroll() {
      var y = window.pageYOffset || document.documentElement.scrollTop;
      nav.classList.toggle('scrolled', y > 40);
      lastScroll = y;
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();
