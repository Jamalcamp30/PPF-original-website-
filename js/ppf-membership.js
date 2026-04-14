/* =====================================================
   PPF MEMBERSHIP — Premium Tab System
   Tab switching, sliding underline, panel transitions,
   scroll-triggered animations, price count-up
   ===================================================== */

(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────── */
  var qs  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.from((ctx || document).querySelectorAll(sel)); };

  /* ── DOM refs ─────────────────────────────────────── */
  var section   = qs('.ppf-ms');
  if (!section) return;                       // bail if section not on page

  var tabBar    = qs('.ppf-ms__tabs', section);
  var tabs      = qsa('.ppf-ms__tab', section);
  var tabLine   = qs('.ppf-ms__tab-line', section);
  var panels    = qsa('.ppf-ms__panel', section);
  var panelsWrap = qs('.ppf-ms__panels', section);

  /* ── Slide underline to active tab ───────────────── */
  function positionLine(tab) {
    if (!tabLine || !tab || !tabBar) return;
    var tabRect = tab.getBoundingClientRect();
    var barRect = tabBar.getBoundingClientRect();
    tabLine.style.left  = (tabRect.left - barRect.left + tabBar.scrollLeft) + 'px';
    tabLine.style.width = tabRect.width + 'px';
  }

  /* Initial position */
  var activeTab = qs('.ppf-ms__tab.active', section);
  if (activeTab) {
    requestAnimationFrame(function () { positionLine(activeTab); });
  }
  window.addEventListener('resize', function () {
    var at = qs('.ppf-ms__tab.active', section);
    if (at) positionLine(at);
  });

  /* ── Tab switching with panel transitions ────────── */
  function switchTab(clickedTab) {
    var target = clickedTab.getAttribute('data-tab');
    if (!target) return;

    // Update tab states
    tabs.forEach(function (t) { t.classList.remove('active'); });
    clickedTab.classList.add('active');
    positionLine(clickedTab);

    // Panel transition
    var current = qs('.ppf-ms__panel.active', section);
    var next    = qs('.ppf-ms__panel[data-panel="' + target + '"]', section);
    if (!next) return;
    if (current === next) return;

    // Exit current
    if (current) {
      current.classList.add('exiting');
      current.classList.remove('active');
    }

    // After short delay, show next
    setTimeout(function () {
      if (current) current.classList.remove('exiting');
      next.classList.add('active');
      // Re-trigger card animations inside the panel
      triggerCardAnimations(next);
      // Update panels wrapper height
      updatePanelHeight(next);
    }, 220);
  }

  tabs.forEach(function (tab) {
    tab.addEventListener('click', function () { switchTab(tab); });
  });

  /* ── Dynamic panel height (so layout doesn't jump) ─ */
  function updatePanelHeight(panel) {
    if (!panelsWrap || !panel) return;
    // Let it render first
    requestAnimationFrame(function () {
      panelsWrap.style.minHeight = panel.scrollHeight + 'px';
    });
  }
  // Set initial height
  var initPanel = qs('.ppf-ms__panel.active', section);
  if (initPanel) updatePanelHeight(initPanel);
  window.addEventListener('resize', function () {
    var ap = qs('.ppf-ms__panel.active', section);
    if (ap) updatePanelHeight(ap);
  });

  /* ── Re-trigger card stagger animations ──────────── */
  function triggerCardAnimations(panel) {
    var cards = qsa('.ppf-ms__card, .ppf-ms__sched-card, .ppf-ms__perk', panel);
    cards.forEach(function (card) {
      card.style.animation = 'none';
      // Force reflow
      void card.offsetWidth;
      card.style.animation = '';
    });
    // Count up prices
    countUpPrices(panel);
  }

  /* ── Price count-up animation ────────────────────── */
  function countUpPrices(panel) {
    var prices = qsa('[data-count-target]', panel);
    prices.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count-target'), 10);
      if (isNaN(target)) return;
      var prefix = el.getAttribute('data-count-prefix') || '';
      var duration = 600;
      var start = performance.now();
      function tick(now) {
        var progress = Math.min((now - start) / duration, 1);
        // Ease out
        var ease = 1 - Math.pow(1 - progress, 3);
        var val = Math.round(ease * target);
        el.textContent = prefix + val;
        if (progress < 1) requestAnimationFrame(tick);
        else el.classList.add('counted');
      }
      requestAnimationFrame(tick);
    });
  }

  /* ── Scroll-triggered section entrance ───────────── */
  var sectionRevealed = false;
  function checkSectionVisibility() {
    if (sectionRevealed) return;
    var rect = section.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.85) {
      sectionRevealed = true;
      section.classList.add('ppf-ms--visible');
      // Count up prices in the initially active panel
      var ap = qs('.ppf-ms__panel.active', section);
      if (ap) countUpPrices(ap);
    }
  }
  window.addEventListener('scroll', checkSectionVisibility, { passive: true });
  checkSectionVisibility();

  /* ── Scroll-triggered reveals for items inside ───── */
  if ('IntersectionObserver' in window) {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ppf-ms--in-view');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    qsa('.ppf-ms__included-item, .ppf-ms__perk, .ppf-ms__sched-card, .ppf-ms__offer-feature', section).forEach(function (el) {
      revealObserver.observe(el);
    });
  }

  /* ── URL query parameter tab switching ──────────── */
  // Supports ?tab=offers (or any tab name) to open directly
  function checkUrlTab() {
    var params = new URLSearchParams(window.location.search);
    var tabParam = params.get('tab');
    if (!tabParam) return;
    var targetTab = null;
    tabs.forEach(function (t) {
      if (t.getAttribute('data-tab') === tabParam) targetTab = t;
    });
    if (targetTab && !targetTab.classList.contains('active')) {
      switchTab(targetTab);
      // Scroll to memberships section
      setTimeout(function () {
        var el = document.getElementById('memberships');
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }
  checkUrlTab();

})();
