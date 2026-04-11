/* ═══════════════════════════════════════════════════════════
   PPF HERO BACKGROUND VIDEO — autoplay / pause / performance
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var video = document.getElementById('heroVideo');
  var hero  = document.getElementById('hero');
  if (!video || !hero) return;

  /* ── Force autoplay (some browsers block until interaction) ── */
  function tryPlay() {
    var p = video.play();
    if (p && typeof p.catch === 'function') {
      p.catch(function () {
        // Autoplay blocked — wait for first user interaction then retry
        function onInteract() {
          video.play();
          document.removeEventListener('click', onInteract);
          document.removeEventListener('touchstart', onInteract);
          document.removeEventListener('scroll', onInteract);
        }
        document.addEventListener('click', onInteract, { once: true, passive: true });
        document.addEventListener('touchstart', onInteract, { once: true, passive: true });
        document.addEventListener('scroll', onInteract, { once: true, passive: true });
      });
    }
  }

  /* ── Pause/resume when hero section scrolls out of view ── */
  if ('IntersectionObserver' in window) {
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          tryPlay();
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.05 });
    obs.observe(hero);
  } else {
    // Fallback for older browsers — just play
    tryPlay();
  }

  /* ── Kick-start on load ── */
  if (document.readyState === 'complete') {
    tryPlay();
  } else {
    window.addEventListener('load', tryPlay, { once: true });
  }
})();
