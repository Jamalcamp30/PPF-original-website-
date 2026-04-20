/* PPF Sticky Mobile CTA Bar
 * Shows on viewports ≤768px. Hides on scroll down, reveals on scroll up.
 * Auto-hides when inside the #start form section on start.html to avoid
 * obscuring the form the bar would otherwise drive users toward.
 */
(function () {
  'use strict';

  var bar = document.querySelector('.ppf-sticky-bar');
  if (!bar) return;

  document.body.classList.add('ppf-has-sticky-bar');

  // Scroll-direction hide/reveal (mobile UX pattern)
  var lastY = window.pageYOffset || 0;
  var ticking = false;
  var HIDE_THRESHOLD = 12;

  function onScroll() {
    var y = window.pageYOffset || 0;
    var dy = y - lastY;

    // Near the very top — always show
    if (y < 80) {
      bar.removeAttribute('data-state');
    } else if (dy > HIDE_THRESHOLD) {
      bar.setAttribute('data-state', 'hidden');
    } else if (dy < -HIDE_THRESHOLD) {
      bar.removeAttribute('data-state');
    }

    lastY = y;
    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) {
      window.requestAnimationFrame(onScroll);
      ticking = true;
    }
  }, { passive: true });
})();
