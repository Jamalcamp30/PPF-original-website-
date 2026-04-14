/* ============================================================
   PPF QUICK START OFFERS — Scroll-triggered reveal animations
   ============================================================ */
(function () {
  'use strict';

  var selectors = '.qs-reveal-up, .qs-reveal-left, .qs-reveal-right';

  function boot() {
    var els = document.querySelectorAll(selectors);
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      // Fallback: show everything immediately
      els.forEach(function (el) { el.classList.add('qs-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('qs-visible');
        }
      });
    }, { threshold: 0.2 });

    els.forEach(function (el) { observer.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
