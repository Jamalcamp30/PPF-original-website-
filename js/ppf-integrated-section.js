/* ============================================================
   PPF INTEGRATED SECTION — IntersectionObserver Animations
   Scroll-reveal, SVG trace-in, progression strip, counters
   Uses same reveal-up pattern as main.js for consistency
   ============================================================ */
(function () {
  'use strict';

  /* ── Utility ─────────────────────────────────────────── */
  var qs  = function (s, p) { return (p || document).querySelector(s); };
  var qsa = function (s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); };

  var section = qs('.ppf-int');
  if (!section) return;

  /* ── IntersectionObserver factory ────────────────────── */
  function observe(els, opts) {
    if (!('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add(opts.className || 'is-revealed'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          if (opts.onEnter) {
            opts.onEnter(entry.target);
          } else {
            entry.target.classList.add(opts.className || 'is-revealed');
          }
          if (opts.once !== false) observer.unobserve(entry.target);
        }
      });
    }, { threshold: opts.threshold || 0.15, rootMargin: opts.rootMargin || '0px 0px -30px 0px' });

    els.forEach(function (el) { observer.observe(el); });
  }

  /* ── 1. Value strip SVG trace-in ─────────────────────── */
  var values = qsa('.ppf-int__value', section);
  observe(values, {
    className: 'is-traced',
    threshold: 0.2,
    onEnter: function (el) {
      /* Stagger within the strip */
      var idx = values.indexOf(el);
      setTimeout(function () {
        el.classList.add('is-traced');
      }, idx * 150);
    }
  });

  /* ── 2. Benefit list staggered reveal ────────────────── */
  var benefits = qsa('.ppf-int__benefit', section);
  observe(benefits, {
    className: 'is-revealed',
    threshold: 0.1,
    onEnter: function (el) {
      var idx = benefits.indexOf(el);
      setTimeout(function () {
        el.classList.add('is-revealed');
      }, idx * 100);
    }
  });

  /* ── 3. Program cards lock-in ────────────────────────── */
  var cards = qsa('.ppf-int__card', section);
  observe(cards, {
    className: 'is-locked',
    threshold: 0.12,
    onEnter: function (el) {
      var idx = cards.indexOf(el);
      setTimeout(function () {
        el.classList.add('is-locked');
      }, idx * 120);
    }
  });

  /* ── 4. Schedule cards ───────────────────────────────── */
  var schedCards = qsa('.ppf-int__sched-card', section);
  observe(schedCards, {
    className: 'is-revealed',
    threshold: 0.15,
    onEnter: function (el) {
      var idx = schedCards.indexOf(el);
      setTimeout(function () {
        el.classList.add('is-revealed');
      }, idx * 130);
    }
  });

  /* ── 5. Counter cards ────────────────────────────────── */
  var counters = qsa('.ppf-int__counter', section);
  observe(counters, {
    className: 'is-revealed',
    threshold: 0.15,
    onEnter: function (el) {
      var idx = counters.indexOf(el);
      setTimeout(function () {
        el.classList.add('is-revealed');
      }, idx * 100);
    }
  });

  /* ── 6. Rebecca spotlight ────────────────────────────── */
  var portrait = qs('.ppf-int__spot-portrait', section);
  var info = qs('.ppf-int__spot-info', section);
  if (portrait) observe([portrait], { className: 'is-revealed', threshold: 0.2 });
  if (info) observe([info], { className: 'is-revealed', threshold: 0.2 });

  /* ── 7. Scroll progression strip ─────────────────────── */
  var progSteps = qsa('.ppf-int__prog-step', section);
  var progArrows = qsa('.ppf-int__prog-arrow', section);
  var progressionEl = qs('.ppf-int__progression', section);

  if (progressionEl && progSteps.length) {
    var progObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          /* Light up steps sequentially */
          progSteps.forEach(function (step, i) {
            setTimeout(function () {
              step.classList.add('is-lit');
            }, i * 300);
          });
          progArrows.forEach(function (arrow, i) {
            setTimeout(function () {
              arrow.classList.add('is-lit');
            }, i * 300 + 150);
          });
          progObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    progObserver.observe(progressionEl);
  }

})();
