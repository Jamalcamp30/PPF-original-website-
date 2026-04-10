/* =====================================================
   PPF PREMIUM ANIMATIONS — JS CONTROLLER
   Room section + Leadership section animations
   ===================================================== */
(function () {
  'use strict';

  var qs  = function(s, p) { return (p || document).querySelector(s); };
  var qsa = function(s, p) { return [].slice.call((p || document).querySelectorAll(s)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════
     1. BLACKOUT PULSE + PRESSURE REVEAL — Room Section
     ══════════════════════════════════════════════════════ */
  function initRoomAnimations() {
    var section = qs('.atmosphere-section');
    if (!section) return;

    /* Inject shadow sweep overlay */
    var sweep = document.createElement('div');
    sweep.className = 'atm-shadow-sweep';
    sweep.setAttribute('aria-hidden', 'true');
    section.appendChild(sweep);

    /* Inject floor glow */
    var floorGlow = document.createElement('div');
    floorGlow.className = 'atm-floor-glow';
    floorGlow.setAttribute('aria-hidden', 'true');
    section.appendChild(floorGlow);

    /* Inject volume meter */
    var meter = document.createElement('div');
    meter.className = 'atm-volume-meter';
    meter.setAttribute('aria-hidden', 'true');
    section.appendChild(meter);

    var lines = qsa('.atm-line', section);

    /* Add data attributes for cue lock and disruption */
    lines.forEach(function(line) {
      var text = qs('.atm-line-text', line);
      if (!text) return;
      var t = text.textContent.trim();
      /* Cue lock on key lines */
      if (t === 'EVERY REP HAS A CUE.' || t === 'THE MUSIC DOES NOT SET THE TEMPO.') {
        line.setAttribute('data-cue-lock', '');
      }
      /* Disruption on "quiet until it's not" */
      if (t === "THE FLOOR IS QUIET UNTIL IT'S NOT.") {
        line.setAttribute('data-disruption', '');
      }
    });

    /* Blackout pulse: observe section entry */
    var sectionObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          section.classList.add('atm-entered');
          sectionObserver.unobserve(section);
          /* Start pressure reveal after blackout */
          triggerPressureReveal(lines);
        }
      });
    }, { threshold: 0.15 });
    sectionObserver.observe(section);

    /* Volume meter: update on scroll */
    if (!prefersReduced) {
      initVolumeMeter(section, meter);
    }
  }

  function triggerPressureReveal(lines) {
    lines.forEach(function(line, i) {
      /* Staggered reveal: each line hits with different timing */
      var baseDelay = 600; /* After blackout pulse */
      var stagger = 350;   /* Between lines */
      var delay = baseDelay + (i * stagger);

      setTimeout(function() {
        line.classList.add('atm-pressure-reveal');
        line.classList.add('atm-visible');

        /* Cue lock: fire after the line reveals */
        if (line.hasAttribute('data-cue-lock')) {
          setTimeout(function() {
            line.classList.add('atm-cue-locked');
          }, 400);
        }

        /* Disruption: fire after the line reveals */
        if (line.hasAttribute('data-disruption')) {
          setTimeout(function() {
            line.classList.add('atm-disrupted');
          }, 500);
        }
      }, delay);
    });
  }

  function initVolumeMeter(section, meter) {
    var rafId = null;
    var isVisible = false;

    function updateMeter() {
      if (!isVisible) return;
      var rect = section.getBoundingClientRect();
      var vh = window.innerHeight;
      var sectionTop = rect.top;
      var sectionHeight = rect.height;
      /* Calculate scroll progress through section */
      var progress = Math.max(0, Math.min(1,
        (vh - sectionTop) / (sectionHeight + vh)
      ));
      var level = Math.round(progress * 100);
      meter.style.setProperty('--volume-level', level + '%');
      rafId = requestAnimationFrame(updateMeter);
    }

    var meterObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          isVisible = true;
          if (!rafId) rafId = requestAnimationFrame(updateMeter);
        } else {
          isVisible = false;
          if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
          }
        }
      });
    }, { threshold: 0 });
    meterObserver.observe(section);
  }


  /* ══════════════════════════════════════════════════════
     2. LEADERSHIP SECTION ANIMATIONS
     ══════════════════════════════════════════════════════ */
  function initLeadershipAnimations() {
    var section = qs('#leadership');
    if (!section) return;

    initDualPortraitEntrance();
    initSignatureStandardLine();
    initPortraitParallax();
    initPresenceEmphasis();
    initClosingReveal();
    initExitTransition();
  }

  /* ── Dual portrait entrance with stagger ──────────── */
  function initDualPortraitEntrance() {
    var cards = qsa('.ldr-card');
    if (!cards.length) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('ldr-card-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    cards.forEach(function(card) {
      observer.observe(card);
    });
  }

  /* ── Signature standard line animation ─────────────── */
  function initSignatureStandardLine() {
    var line = qs('.ldr-standard-line');
    if (!line) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          line.classList.add('ldr-line-active');
          observer.unobserve(line);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(line);
  }

  /* ── Portrait depth parallax ──────────────────────── */
  function initPortraitParallax() {
    if (prefersReduced) return;
    var cards = qsa('.ldr-card');

    cards.forEach(function(card) {
      card.addEventListener('mousemove', function(e) {
        var rect = card.getBoundingClientRect();
        var x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        var y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        card.setAttribute('data-parallax-x', '');
        card.style.setProperty('--parallax-x', x.toFixed(3));
        card.style.setProperty('--parallax-y', y.toFixed(3));
      });

      card.addEventListener('mouseleave', function() {
        card.removeAttribute('data-parallax-x');
        card.style.removeProperty('--parallax-x');
        card.style.removeProperty('--parallax-y');
      });
    });
  }

  /* ── "Built it. Protect it." emphasis animation ───── */
  function initPresenceEmphasis() {
    var intro = qs('.ldr-presence-intro');
    if (!intro) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          setTimeout(function() {
            intro.classList.add('ldr-emphasis-active');
          }, 500);
          observer.unobserve(intro);
        }
      });
    }, { threshold: 0.6 });

    observer.observe(intro);
  }

  /* ── Closing tagline reveal ────────────────────────── */
  function initClosingReveal() {
    var closing = qs('.ldr-closing');
    if (!closing) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          closing.classList.add('ldr-closing-visible');
          observer.unobserve(closing);
        }
      });
    }, { threshold: 0.5 });

    observer.observe(closing);
  }

  /* ── Exit transition — dissolve on scroll away ────── */
  function initExitTransition() {
    var cards = qsa('.ldr-card');
    if (!cards.length || prefersReduced) return;

    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (!entry.isIntersecting && entry.target.classList.contains('ldr-card-visible')) {
          entry.target.classList.add('ldr-card-exiting');
        } else {
          entry.target.classList.remove('ldr-card-exiting');
        }
      });
    }, { threshold: 0, rootMargin: '0px 0px -100px 0px' });

    cards.forEach(function(card) {
      observer.observe(card);
    });
  }


  /* ══════════════════════════════════════════════════════
     BOOT
     ══════════════════════════════════════════════════════ */
  function boot() {
    initRoomAnimations();
    initLeadershipAnimations();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
