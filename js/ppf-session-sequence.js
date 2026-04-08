/* =====================================================
   PPF SESSION SEQUENCE — Controller
   One master state drives rail + visual + card + spine
   ===================================================== */
(function () {
  'use strict';

  /* ── STAGE DATA ───────────────────────────────────── */
  var STAGES = [
    { id: 'arrival',     callout: 'MOVE',   meter: 'ENTRY'  },
    { id: 'warmup',      callout: 'SET',    meter: 'PREP'   },
    { id: 'instruction', callout: 'DRIVE',  meter: 'TEACH'  },
    { id: 'work',        callout: 'DRIVE',  meter: 'OUTPUT' },
    { id: 'finish',      callout: 'FINISH', meter: 'CLOSE'  }
  ];

  /* ── DOM CACHE ────────────────────────────────────── */
  var section      = null;
  var scrollEl     = null;
  var frame        = null;
  var railStages   = [];
  var visuals      = [];
  var cards        = [];
  var spineFill    = null;
  var calloutEl    = null;
  var meterStages  = [];
  var spacers      = [];
  var timerEl      = null;

  var activeStage  = -1;  // force first update
  var workInterval = null;
  var prefersReduced = false;

  /* ── HELPERS ──────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ── INIT ─────────────────────────────────────────── */
  function init() {
    section = qs('.ssq-section');
    if (!section) return;

    scrollEl    = qs('.ssq-scroll', section);
    frame       = qs('.ssq-frame', section);
    railStages  = qsa('.ssq-rail-stage', section);
    visuals     = qsa('.ssq-vis', section);
    cards       = qsa('.ssq-card', section);
    spineFill   = qs('.ssq-spine-fill', section);
    calloutEl   = qs('.ssq-callout', section);
    meterStages = qsa('.ssq-meter-stage', section);
    spacers     = qsa('.ssq-spacer', section);
    timerEl     = qs('.ssq-output-timer', section);

    prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Desktop: scroll-driven
    if (window.innerWidth > 900 && spacers.length) {
      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll(); // set initial
    }

    // Rail click navigation (works on both mobile & desktop)
    railStages.forEach(function (btn, i) {
      btn.addEventListener('click', function () {
        if (window.innerWidth > 900 && spacers.length) {
          scrollToStage(i);
        } else {
          setStage(i);
        }
      });
    });

    // Touch swipe for mobile
    if (window.innerWidth <= 900) {
      setStage(0);
      initSwipe();
    }

    // Resize handler
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (window.innerWidth > 900 && spacers.length) {
          onScroll();
        }
      }, 200);
    });
  }

  /* ── SCROLL → STAGE MAPPING ───────────────────────── */
  function onScroll() {
    if (!scrollEl) return;
    var rect = scrollEl.getBoundingClientRect();
    var scrollH = scrollEl.offsetHeight - window.innerHeight;
    if (scrollH <= 0) return;

    var progress = Math.max(0, Math.min(1, -rect.top / scrollH));
    var stageIndex = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

    setStage(stageIndex);
  }

  /* ── SCROLL TO STAGE (click on rail) ──────────────── */
  function scrollToStage(index) {
    if (!spacers[index]) return;
    var sectionTop = section.getBoundingClientRect().top + window.pageYOffset;
    var spacerOffset = spacers[index].offsetTop;
    window.scrollTo({
      top: sectionTop + spacerOffset + 10,
      behavior: prefersReduced ? 'auto' : 'smooth'
    });
  }

  /* ── MASTER STATE UPDATE ──────────────────────────── */
  function setStage(index) {
    if (index === activeStage) return;
    var prevStage = activeStage;
    activeStage = index;

    // 1. Rail
    railStages.forEach(function (btn, i) {
      btn.classList.remove('active', 'completed');
      if (i < index) btn.classList.add('completed');
      if (i === index) btn.classList.add('active');
    });

    // 2. Progress spine
    if (spineFill) {
      var pct = STAGES.length > 1 ? (index / (STAGES.length - 1)) * 100 : 0;
      spineFill.style.height = pct + '%';
    }

    // 3. Center visuals
    visuals.forEach(function (v, i) {
      v.classList.toggle('active', i === index);
    });

    // 4. Content cards
    cards.forEach(function (c, i) {
      c.classList.toggle('active', i === index);
    });

    // 5. Floor meter
    meterStages.forEach(function (m, i) {
      m.classList.remove('active', 'completed');
      if (i < index) m.classList.add('completed');
      if (i === index) m.classList.add('active');
    });

    // 6. Work timer
    if (index === 3) {
      startWorkTimer();
    } else {
      stopWorkTimer();
    }

    // 7. Coach callout pulse
    if (prevStage !== -1 && calloutEl && !prefersReduced) {
      fireCallout(STAGES[index].callout);
    }
  }

  /* ── COACH CALLOUT FLASH ──────────────────────────── */
  function fireCallout(word) {
    if (!calloutEl) return;
    calloutEl.classList.remove('flash');
    calloutEl.textContent = word;
    // Force reflow
    void calloutEl.offsetWidth;
    calloutEl.classList.add('flash');
  }

  /* ── WORK TIMER ───────────────────────────────────── */
  function startWorkTimer() {
    if (!timerEl) return;
    if (workInterval) return;
    var seconds = 45;
    timerEl.textContent = '00:45';
    workInterval = setInterval(function () {
      seconds = seconds <= 0 ? 45 : seconds - 1;
      timerEl.textContent = '00:' + (seconds < 10 ? '0' : '') + seconds;
    }, 1000);
  }

  function stopWorkTimer() {
    if (workInterval) {
      clearInterval(workInterval);
      workInterval = null;
    }
  }

  /* ── MOBILE SWIPE ─────────────────────────────────── */
  function initSwipe() {
    var startX = 0;
    var contentArea = qs('.ssq-content', section) || section;

    contentArea.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
    }, { passive: true });

    contentArea.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0 && activeStage < STAGES.length - 1) {
        setStage(activeStage + 1);
      } else if (dx > 0 && activeStage > 0) {
        setStage(activeStage - 1);
      }
      // Scroll active rail button into view
      if (railStages[activeStage]) {
        railStages[activeStage].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }, { passive: true });
  }

  /* ── BOOT ─────────────────────────────────────────── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
