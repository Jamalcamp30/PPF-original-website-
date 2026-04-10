/* =====================================================
   PPF LEADERSHIP — Scroll-driven Animation Controller
   Forge · Split Current · Timeline · Philosophy · Legacy
   ===================================================== */
(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────── */
  var qs  = function (s, r) { return (r || document).querySelector(s); };
  var qsa = function (s, r) { return (r || document).querySelectorAll(s); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════
     1. SECTION ACTIVATION — dark forge overlay
     ══════════════════════════════════════════════════════ */
  function initSectionActivation() {
    var section = qs('#leadership');
    if (!section) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          section.classList.add('ldr-active');
          observer.unobserve(section);
        }
      });
    }, { threshold: 0.05 });

    observer.observe(section);
  }

  /* ══════════════════════════════════════════════════════
     2. FORGED HEADLINE — letter lines stamped sequentially
     ══════════════════════════════════════════════════════ */
  function initForgeHeadline() {
    var lines = qsa('.ldr-forge-line');
    if (!lines.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          forgeSequence(lines);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(lines[0].parentElement);
  }

  function forgeSequence(lines) {
    var baseDelay = prefersReduced ? 0 : 200;
    lines.forEach(function (line, i) {
      setTimeout(function () {
        line.classList.add('ldr-forged');
      }, i * baseDelay);
    });
  }

  /* ══════════════════════════════════════════════════════
     3. FOUNDERS STATEMENT REVEAL
     ══════════════════════════════════════════════════════ */
  function initFoundersStatement() {
    var el = qs('.ldr-founders-statement-text');
    if (!el) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          el.classList.add('ldr-visible');
          observer.unobserve(el);
        }
      });
    }, { threshold: 0.4 });

    observer.observe(el);
  }

  /* ══════════════════════════════════════════════════════
     4. SIGNATURE STANDARD LINE
     ══════════════════════════════════════════════════════ */
  function initStandardLine() {
    var line = qs('.ldr-standard-line');
    if (!line) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          line.classList.add('ldr-line-active');
          observer.unobserve(line);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(line);
  }

  /* ══════════════════════════════════════════════════════
     5. SPLIT DIVIDER ACTIVATION
     ══════════════════════════════════════════════════════ */
  function initSplitDivider() {
    var divider = qs('.ldr-split-divider');
    if (!divider) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          divider.classList.add('ldr-div-active');
          observer.unobserve(divider);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(divider);
  }

  /* ══════════════════════════════════════════════════════
     6. DUAL CARD ENTRANCE — Blueprint to Reality
     ══════════════════════════════════════════════════════ */
  function initCardEntrance() {
    var cards = qsa('.ldr-card');
    if (!cards.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ldr-card-visible');
          // Blueprint resolves after entrance
          setTimeout(function () {
            entry.target.classList.add('ldr-card-resolved');
          }, prefersReduced ? 0 : 1800);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    cards.forEach(function (card) { observer.observe(card); });
  }

  /* ══════════════════════════════════════════════════════
     7. TIMELINE IN THE FLOOR — marker activation
     ══════════════════════════════════════════════════════ */
  function initTimelines() {
    var cards = qsa('.ldr-card');
    cards.forEach(function (card) {
      var markers = qsa('.ldr-timeline-marker', card);
      if (!markers.length) return;

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            activateTimeline(markers);
            observer.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });

      var timeline = qs('.ldr-timeline', card);
      if (timeline) observer.observe(timeline);
    });
  }

  function activateTimeline(markers) {
    var delay = prefersReduced ? 0 : 300;
    markers.forEach(function (marker, i) {
      setTimeout(function () {
        marker.classList.add('ldr-tm-active');
      }, i * delay);
    });
  }

  /* ══════════════════════════════════════════════════════
     8. PORTRAIT PARALLAX — depth on mouse move
     ══════════════════════════════════════════════════════ */
  function initPortraitParallax() {
    if (prefersReduced) return;
    var cards = qsa('.ldr-card');

    cards.forEach(function (card) {
      card.addEventListener('mousemove', function (e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        card.setAttribute('data-parallax-x', '');
        card.style.setProperty('--parallax-x', x.toFixed(3));
        card.style.setProperty('--parallax-y', y.toFixed(3));
      });

      card.addEventListener('mouseleave', function () {
        card.removeAttribute('data-parallax-x');
        card.style.removeProperty('--parallax-x');
        card.style.removeProperty('--parallax-y');
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     9. ROOM RESPONDS — background reacts to hover
     ══════════════════════════════════════════════════════ */
  function initRoomResponds() {
    if (prefersReduced) return;
    var section = qs('#leadership');
    var richardCard = qs('.ldr-richard');
    var rebeccaCard = qs('.ldr-rebecca');
    if (!section || !richardCard || !rebeccaCard) return;

    richardCard.addEventListener('mouseenter', function () {
      section.classList.add('ldr-hover-richard');
      section.classList.remove('ldr-hover-rebecca');
    });

    rebeccaCard.addEventListener('mouseenter', function () {
      section.classList.add('ldr-hover-rebecca');
      section.classList.remove('ldr-hover-richard');
    });

    richardCard.addEventListener('mouseleave', clearRoomHover);
    rebeccaCard.addEventListener('mouseleave', clearRoomHover);

    function clearRoomHover() {
      section.classList.remove('ldr-hover-richard');
      section.classList.remove('ldr-hover-rebecca');
    }
  }

  /* ══════════════════════════════════════════════════════
     10. CLOSING REVEAL
     ══════════════════════════════════════════════════════ */
  function initClosingReveal() {
    var closing = qs('.ldr-closing');
    if (!closing) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          closing.classList.add('ldr-closing-visible');
          observer.unobserve(closing);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(closing);
  }

  /* ══════════════════════════════════════════════════════
     11. PRESSURE CHAMBER — "Why They Started It"
     ══════════════════════════════════════════════════════ */
  function initPressureChamber() {
    var chamber = qs('.ldr-pressure-chamber');
    if (!chamber) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          chamber.classList.add('ldr-chamber-active');
          observer.unobserve(chamber);
        }
      });
    }, { threshold: 0.25 });

    observer.observe(chamber);
  }

  /* ══════════════════════════════════════════════════════
     12. STARTS PANEL — "What Starts With Them"
     ══════════════════════════════════════════════════════ */
  function initStartsPanel() {
    var cols = qsa('.ldr-starts-col');
    if (!cols.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ldr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    cols.forEach(function (col) { observer.observe(col); });
  }

  /* ══════════════════════════════════════════════════════
     13. PROTECT DAILY — Tile stagger
     ══════════════════════════════════════════════════════ */
  function initProtectDaily() {
    var block = qs('.ldr-protect-daily');
    if (!block) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          block.classList.add('ldr-visible');
          observer.unobserve(block);
        }
      });
    }, { threshold: 0.2 });

    observer.observe(block);
  }

  /* ══════════════════════════════════════════════════════
     14. PHILOSOPHY STRIP — Lock-in Sequence
     ══════════════════════════════════════════════════════ */
  function initPhilosophyStrip() {
    var strip = qs('.ldr-philosophy-strip');
    var lines = qsa('.ldr-phil-line');
    if (!strip || !lines.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          lockInSequence(lines, strip);
          observer.unobserve(strip);
        }
      });
    }, { threshold: 0.4 });

    observer.observe(strip);
  }

  function lockInSequence(lines, strip) {
    var delay = prefersReduced ? 0 : 350;
    lines.forEach(function (line, i) {
      setTimeout(function () {
        line.classList.add('ldr-phil-locked');
      }, i * delay);
    });

    // After all lines lock, settle the strip
    var settleDelay = prefersReduced ? 0 : (lines.length * delay + 600);
    setTimeout(function () {
      strip.classList.add('ldr-phil-settled');
    }, settleDelay);
  }

  /* ══════════════════════════════════════════════════════
     15. LEGACY PULSE EXIT
     ══════════════════════════════════════════════════════ */
  function initLegacyPulse() {
    var pulse = qs('.ldr-legacy-pulse');
    if (!pulse) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          pulse.classList.add('ldr-legacy-active');
          observer.unobserve(pulse);
        }
      });
    }, { threshold: 0.3 });

    observer.observe(pulse);
  }

  /* ══════════════════════════════════════════════════════
     16. EXIT TRANSITION — cards dissolve on scroll away
     ══════════════════════════════════════════════════════ */
  function initExitTransition() {
    var cards = qsa('.ldr-card');
    if (!cards.length || prefersReduced) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting && entry.target.classList.contains('ldr-card-visible')) {
          entry.target.classList.add('ldr-card-exiting');
        } else {
          entry.target.classList.remove('ldr-card-exiting');
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -100px 0px' });

    cards.forEach(function (card) { observer.observe(card); });
  }


  /* ══════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════ */
  function boot() {
    if (!qs('#leadership')) return;

    initSectionActivation();
    initForgeHeadline();
    initFoundersStatement();
    initStandardLine();
    initSplitDivider();
    initCardEntrance();
    initTimelines();
    initPortraitParallax();
    initRoomResponds();
    initClosingReveal();
    initPressureChamber();
    initStartsPanel();
    initProtectDaily();
    initPhilosophyStrip();
    initLegacyPulse();
    initExitTransition();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
