/* ============================================================
   PPF BLUEPRINT — ELITE UPGRADE INTERACTIVITY
   ============================================================ */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────── */
  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };

  /* ── Reduced-motion check ────────────────────────── */
  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 11. Signature Intro — metrics boot in Pulse Vault ── */
  function initSignatureIntro() {
    var metricsEl = qs('.pv-metrics-boot');
    if (!metricsEl) return;
    if (prefersReducedMotion) {
      metricsEl.classList.add('active');
      return;
    }
    /* Show metrics briefly during Pulse Vault sequence */
    setTimeout(function () {
      metricsEl.classList.add('active');
    }, 1200);
    setTimeout(function () {
      metricsEl.classList.remove('active');
    }, 3000);
  }

  /* ── 12. Live Standard Board — rotating entries ────── */
  var liveBoardInterval = null;

  function initLiveBoard() {
    var entries = qsa('.live-board__entry');
    if (entries.length === 0) return;

    /* Initialize: all visible with transition */
    entries.forEach(function (e) { e.style.transition = 'opacity 0.5s ease'; });

    if (prefersReducedMotion) return;

    var idx = 0;
    liveBoardInterval = setInterval(function () {
      entries.forEach(function (e) { e.style.opacity = '0.5'; });
      if (entries[idx]) {
        entries[idx].style.opacity = '1';
      }
      idx = (idx + 1) % entries.length;
    }, 3000);

    /* Pause cycling when section not visible to save resources */
    if ('IntersectionObserver' in window) {
      var board = qs('.live-board');
      if (board) {
        var boardObserver = new IntersectionObserver(function (observedEntries) {
          var entry = observedEntries[0];
          if (!entry.isIntersecting && liveBoardInterval) {
            clearInterval(liveBoardInterval);
            liveBoardInterval = null;
          } else if (entry.isIntersecting && !liveBoardInterval) {
            idx = 0;
            liveBoardInterval = setInterval(function () {
              entries.forEach(function (e) { e.style.opacity = '0.5'; });
              if (entries[idx]) {
                entries[idx].style.opacity = '1';
              }
              idx = (idx + 1) % entries.length;
            }, 3000);
          }
        }, { threshold: 0.1 });
        boardObserver.observe(board);
      }
    }
  }

  /* ── 13. Interactive Facility — zone expansion ─────── */
  function initInteractiveFacility() {
    var zones = qsa('.fm-zone');
    if (zones.length === 0) return;
    zones.forEach(function (zone) {
      zone.addEventListener('click', function () {
        var isActive = zone.classList.contains('active');
        zones.forEach(function (z) { z.classList.remove('active'); });
        if (!isActive) zone.classList.add('active');
      });
    });
  }

  /* ── Intersection Observer for reveal animations ───── */
  function initRevealAnimations() {
    var targets = qsa(
      '.proof-wall, .ppf-authority, .integrated-enrollment, ' +
      '.visit-logistics, .trust-markers, .media-gallery, ' +
      '.cta-branch, .live-board, .member-preview, .founder-origin'
    );
    if (targets.length === 0) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (t) { t.style.opacity = '1'; });
      return;
    }

    targets.forEach(function (t) {
      t.style.opacity = '0';
      t.style.transform = 'translateY(24px)';
      t.style.transition = 'opacity 0.8s ease, transform 0.8s ease';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    targets.forEach(function (t) { observer.observe(t); });
  }

  /* ── Boot ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    initSignatureIntro();
    initLiveBoard();
    initInteractiveFacility();
    initRevealAnimations();
  });
})();
