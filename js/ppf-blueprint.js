/* ============================================================
   PPF BLUEPRINT — ELITE UPGRADE INTERACTIVITY
   ============================================================ */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────── */
  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };

  /* ── 11. Signature Intro — metrics boot in Pulse Vault ── */
  function initSignatureIntro() {
    var metricsEl = qs('.pv-metrics-boot');
    if (!metricsEl) return;
    /* Show metrics briefly during Pulse Vault sequence */
    setTimeout(function () {
      metricsEl.classList.add('active');
    }, 1200);
    setTimeout(function () {
      metricsEl.classList.remove('active');
    }, 3000);
  }

  /* ── 12. Live Standard Board — rotating entries ────── */
  function initLiveBoard() {
    var entries = qsa('.live-board__entry');
    if (entries.length === 0) return;

    var idx = 0;
    setInterval(function () {
      entries.forEach(function (e) { e.style.opacity = '0.5'; });
      entries[idx].style.opacity = '1';
      idx = (idx + 1) % entries.length;
    }, 3000);

    /* Initialize: all visible */
    entries.forEach(function (e) { e.style.transition = 'opacity 0.5s ease'; });
  }

  /* ── 13. Interactive Facility — zone expansion ─────── */
  function initInteractiveFacility() {
    var zones = qsa('.fm-zone');
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

    if (!('IntersectionObserver' in window)) {
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
