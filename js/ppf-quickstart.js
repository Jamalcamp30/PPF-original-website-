/* ============================================================
   PPF QUICK START OFFERS — Scroll-triggered reveal animations
   + price count-up
   ============================================================ */
(function () {
  'use strict';

  var selectors = '.qs-reveal-up, .qs-reveal-left, .qs-reveal-right';

  function countUp(el) {
    var target = parseInt(el.getAttribute('data-count-target'), 10);
    if (isNaN(target)) return;
    var prefix = el.getAttribute('data-count-prefix') || '';
    var duration = 600;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - progress, 3);
      el.textContent = prefix + Math.round(ease * target);
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  function boot() {
    var els = document.querySelectorAll(selectors);
    if (!els.length) return;

    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('qs-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('qs-visible');
          // Count up prices inside this revealed element
          var prices = entry.target.querySelectorAll('[data-count-target]');
          prices.forEach(countUp);
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
