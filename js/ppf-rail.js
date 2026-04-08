/* =====================================================
   PPF PATH-ADAPTIVE RAIL SYSTEM
   One core system · Three audience modes

   Athlete  → PPF Drive Lane   (#ff5500)
   Adult    → PPF Strength Line (#6a8fff)
   Integrated → PPF Guided Path (#50c878)

   Tracks scroll, reacts to sections, adapts to path.
   ===================================================== */

;(function () {
  'use strict';

  /* ── Guards ────────────────────────────────────────── */
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (window.innerWidth < 900) return;

  /* ── Helpers ───────────────────────────────────────── */
  function qs(s, p) { return (p || document).querySelector(s); }
  function qsa(s, p) { return [].slice.call((p || document).querySelectorAll(s)); }
  function el(tag, cls) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    return node;
  }

  /* ── Configuration ─────────────────────────────────── */
  var PATH_COLORS = {
    athlete:    '#ff5500',
    adult:      '#6a8fff',
    integrated: '#50c878'
  };

  /* Section → marker mappings per path */
  var ATHLETE_MARKERS = [
    { sectionId: 'hero',       label: 'START',  phase: 'ENTER',               type: 'yard' },
    { sectionId: 'paths',      label: '10 YD',  phase: 'CHOOSE YOUR LANE',    type: 'yard' },
    { sectionId: 'proof',      label: '20 YD',  phase: 'SEE THE RESULTS',     type: 'yard' },
    { sectionId: 'memberships',label: '30 YD',  phase: 'COMMIT',              type: 'yard' },
    { sectionId: 'start',      label: 'GOAL',   phase: 'START YOUR PATH',     type: 'yard' }
  ];

  var ADULT_MARKERS = [
    { sectionId: 'hero',        label: 'START',    phase: 'READY',           type: 'milestone' },
    { sectionId: 'paths',       label: 'BUILD',    phase: 'FIND YOUR FIT',   type: 'milestone' },
    { sectionId: 'proof',       label: 'IMPROVE',  phase: 'SEE THE RESULTS', type: 'milestone' },
    { sectionId: 'memberships', label: 'PERFORM',  phase: 'COMMIT',          type: 'milestone' },
    { sectionId: 'start',       label: 'SUSTAIN',  phase: 'STAY CONSISTENT', type: 'milestone' }
  ];

  var INTEGRATED_MARKERS = [
    { sectionId: 'hero',            label: 'WELCOME',    phase: 'WELCOME',    type: 'guided' },
    { sectionId: 'paths',           label: 'EXPLORE',    phase: 'EXPLORE',    type: 'guided' },
    { sectionId: 'familyDashboard', label: 'SUPPORT',    phase: 'SUPPORT',    type: 'guided' },
    { sectionId: 'memberships',     label: 'PROGRESS',   phase: 'PROGRESS',   type: 'guided' },
    { sectionId: 'start',           label: 'BELONGING',  phase: 'BELONGING',  type: 'guided' }
  ];

  /* Sections that trigger proof-active state */
  var PROOF_SECTIONS = ['proof', 'legacyWall', 'benchmarkBoard', 'standardStreaks'];

  /* Sections that trigger CTA-active state */
  var CTA_SECTIONS = ['start', 'experience'];

  /* Path labels */
  var PATH_NAMES = {
    athlete:    'PPF DRIVE LANE',
    adult:      'PPF STRENGTH LINE',
    integrated: 'PPF GUIDED PATH'
  };

  /* Rail track spans 5%–95% of viewport, giving 90% usable range */
  var TRACK_OFFSET  = 5;   /* top/bottom inset (%) */
  var TRACK_RATIO   = 0.9; /* usable track fraction (90%) */
  var MARKER_LEAD   = 2;   /* scroll % before marker to count as reached */
  var HERO_HIDE_PCT = 3;   /* hide rails when within this % of page top */
  var DOM_SETTLE_MS = 300;  /* delay to let DOM layout stabilise on init */

  /* IntersectionObserver tuning for section detection */
  var SECTION_THRESHOLDS = [0.15, 0.3, 0.5];
  var SECTION_ROOT_MARGIN = '-10% 0px -10% 0px';
  var HERO_EXIT_THRESHOLD = 0.3;

  /* ── State ─────────────────────────────────────────── */
  var currentPath = 'athlete';
  var scrollPct = 0;
  var activeSection = null;
  var railsBuilt = false;

  /* DOM references filled by buildRails() */
  var leftRail, rightRail;
  var leftProgress, rightProgress;
  var leftBracket, rightBracket;
  var leftGlow, rightGlow;
  var rightStatus;
  var leftPathName;
  var leftMarkerContainer, rightMarkerContainer;

  /* ── Build Rail DOM ────────────────────────────────── */
  function buildRails() {
    if (railsBuilt) return;
    railsBuilt = true;

    /* —— Left Rail —— */
    leftRail = el('div', 'ppf-rail ppf-rail--left');
    leftRail.setAttribute('aria-hidden', 'true');

    var leftTrack = el('div', 'ppf-rail__track');
    leftRail.appendChild(leftTrack);

    leftProgress = el('div', 'ppf-rail__progress');
    leftRail.appendChild(leftProgress);

    leftBracket = el('div', 'ppf-rail__bracket');
    leftRail.appendChild(leftBracket);

    leftGlow = el('div', 'ppf-rail__glow');
    leftRail.appendChild(leftGlow);

    leftPathName = el('div', 'ppf-rail__path-name');
    leftRail.appendChild(leftPathName);

    leftMarkerContainer = el('div', 'ppf-rail__markers');
    leftMarkerContainer.style.cssText = 'position:absolute;top:5%;bottom:5%;width:100%';
    leftRail.appendChild(leftMarkerContainer);

    /* —— Right Rail —— */
    rightRail = el('div', 'ppf-rail ppf-rail--right');
    rightRail.setAttribute('aria-hidden', 'true');

    var rightTrack = el('div', 'ppf-rail__track');
    rightRail.appendChild(rightTrack);

    rightProgress = el('div', 'ppf-rail__progress');
    rightRail.appendChild(rightProgress);

    rightBracket = el('div', 'ppf-rail__bracket');
    rightRail.appendChild(rightBracket);

    rightGlow = el('div', 'ppf-rail__glow');
    rightRail.appendChild(rightGlow);

    rightStatus = el('div', 'ppf-rail__status');
    rightRail.appendChild(rightStatus);

    rightMarkerContainer = el('div', 'ppf-rail__markers');
    rightMarkerContainer.style.cssText = 'position:absolute;top:5%;bottom:5%;width:100%';
    rightRail.appendChild(rightMarkerContainer);

    document.body.appendChild(leftRail);
    document.body.appendChild(rightRail);
  }

  /* ── Marker Builders ───────────────────────────────── */

  function clearMarkers() {
    leftMarkerContainer.innerHTML = '';
    rightMarkerContainer.innerHTML = '';
  }

  /**
   * Calculate the percentage position of a section within
   * the scrollable document (0..100).
   */
  function sectionPct(sectionId) {
    var section = qs('#' + sectionId);
    if (!section) return -1;
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return -1;
    var top = section.getBoundingClientRect().top + window.scrollY;
    return Math.min(100, Math.max(0, (top / docHeight) * 100));
  }

  function buildAthleteMarkers() {
    ATHLETE_MARKERS.forEach(function (m) {
      var pct = sectionPct(m.sectionId);
      if (pct < 0) return;

      /* Left rail — yard marker */
      var marker = el('div', 'ppf-rail__marker ppf-rail__marker--yard');
      marker.style.top = pct + '%';
      marker.setAttribute('data-section', m.sectionId);
      marker.setAttribute('data-pct', pct);
      var tick = el('div', 'ppf-rail__tick');
      var label = el('div', 'ppf-rail__label');
      label.textContent = m.label;
      marker.appendChild(tick);
      marker.appendChild(label);
      leftMarkerContainer.appendChild(marker);

      /* Right rail — phase label */
      var rMarker = el('div', 'ppf-rail__marker ppf-rail__marker--yard');
      rMarker.style.top = pct + '%';
      rMarker.setAttribute('data-section', m.sectionId);
      rMarker.setAttribute('data-pct', pct);
      var rTick = el('div', 'ppf-rail__tick');
      var rLabel = el('div', 'ppf-rail__label');
      rLabel.textContent = m.phase;
      rMarker.appendChild(rTick);
      rMarker.appendChild(rLabel);
      rightMarkerContainer.appendChild(rMarker);
    });
  }

  function buildAdultMarkers() {
    ADULT_MARKERS.forEach(function (m) {
      var pct = sectionPct(m.sectionId);
      if (pct < 0) return;

      /* Left rail — milestone marker */
      var marker = el('div', 'ppf-rail__marker ppf-rail__marker--milestone');
      marker.style.top = pct + '%';
      marker.setAttribute('data-section', m.sectionId);
      marker.setAttribute('data-pct', pct);
      var tick = el('div', 'ppf-rail__tick');
      var label = el('div', 'ppf-rail__label');
      label.textContent = m.label;
      marker.appendChild(tick);
      marker.appendChild(label);
      leftMarkerContainer.appendChild(marker);

      /* Right rail — phase label */
      var rMarker = el('div', 'ppf-rail__marker ppf-rail__marker--milestone');
      rMarker.style.top = pct + '%';
      rMarker.setAttribute('data-section', m.sectionId);
      rMarker.setAttribute('data-pct', pct);
      var rTick = el('div', 'ppf-rail__tick');
      var rLabel = el('div', 'ppf-rail__label');
      rLabel.textContent = m.phase;
      rMarker.appendChild(rTick);
      rMarker.appendChild(rLabel);
      rightMarkerContainer.appendChild(rMarker);
    });
  }

  function buildIntegratedMarkers() {
    INTEGRATED_MARKERS.forEach(function (m) {
      var pct = sectionPct(m.sectionId);
      if (pct < 0) return;

      /* Left rail — guided marker (soft dots) */
      var marker = el('div', 'ppf-rail__marker ppf-rail__marker--guided');
      marker.style.top = pct + '%';
      marker.setAttribute('data-section', m.sectionId);
      marker.setAttribute('data-pct', pct);
      var tick = el('div', 'ppf-rail__tick');
      var label = el('div', 'ppf-rail__label');
      label.textContent = m.label;
      marker.appendChild(tick);
      marker.appendChild(label);
      leftMarkerContainer.appendChild(marker);

      /* Right rail — phase label */
      var rMarker = el('div', 'ppf-rail__marker ppf-rail__marker--guided');
      rMarker.style.top = pct + '%';
      rMarker.setAttribute('data-section', m.sectionId);
      rMarker.setAttribute('data-pct', pct);
      var rTick = el('div', 'ppf-rail__tick');
      var rLabel = el('div', 'ppf-rail__label');
      rLabel.textContent = m.phase;
      rMarker.appendChild(rTick);
      rMarker.appendChild(rLabel);
      rightMarkerContainer.appendChild(rMarker);
    });
  }

  function buildMarkersForPath() {
    clearMarkers();
    switch (currentPath) {
      case 'athlete':    buildAthleteMarkers(); break;
      case 'adult':      buildAdultMarkers(); break;
      case 'integrated': buildIntegratedMarkers(); break;
    }
  }

  /* ── Path Switching ────────────────────────────────── */

  function setPath(path) {
    if (!PATH_COLORS[path]) return;
    if (path === currentPath && leftRail.classList.contains('ppf-rail--' + path)) return;

    currentPath = path;

    /* Remove old path classes */
    ['athlete', 'adult', 'integrated'].forEach(function (p) {
      leftRail.classList.remove('ppf-rail--' + p);
      rightRail.classList.remove('ppf-rail--' + p);
    });

    /* Add new path class */
    leftRail.classList.add('ppf-rail--' + path);
    rightRail.classList.add('ppf-rail--' + path);

    /* Update path name label */
    leftPathName.textContent = PATH_NAMES[path] || '';
    leftPathName.classList.add('ppf-rail__path-name--visible');

    /* Rebuild path-specific markers */
    buildMarkersForPath();

    /* Force update */
    updateProgress();
  }

  /* ── Scroll Progress ───────────────────────────────── */

  var scrollTicking = false;

  function updateProgress() {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    scrollPct = Math.min(100, Math.max(0, (window.scrollY / docHeight) * 100));

    /* Progress fill height — maps to the track area */
    var fillHeight = scrollPct * TRACK_RATIO;
    leftProgress.style.height = fillHeight + '%';
    leftProgress.style.top = TRACK_OFFSET + '%';
    rightProgress.style.height = fillHeight + '%';
    rightProgress.style.top = TRACK_OFFSET + '%';

    /* Glow dot position */
    var glowTop = TRACK_OFFSET + scrollPct * TRACK_RATIO;
    leftGlow.style.top = glowTop + '%';
    leftGlow.classList.add('ppf-rail__glow--active');
    rightGlow.style.top = glowTop + '%';
    rightGlow.classList.add('ppf-rail__glow--active');

    /* Update markers — mark as reached when scroll passes them */
    var allMarkers = qsa('.ppf-rail__marker', leftMarkerContainer)
      .concat(qsa('.ppf-rail__marker', rightMarkerContainer));
    allMarkers.forEach(function (m) {
      var markerPct = parseFloat(m.getAttribute('data-pct'));
      if (scrollPct >= markerPct - MARKER_LEAD) {
        m.classList.add('ppf-rail__marker--reached');
      } else {
        m.classList.remove('ppf-rail__marker--reached');
      }
    });
  }

  function onScroll() {
    if (!scrollTicking) {
      requestAnimationFrame(function () {
        updateProgress();
        scrollTicking = false;
      });
      scrollTicking = true;
    }
  }

  /* ── Section Observation ───────────────────────────── */

  function observeSections() {
    var sections = qsa('section[id]');
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && entry.intersectionRatio > 0.15) {
          var id = entry.target.id;
          if (id === activeSection) return;
          activeSection = id;
          onSectionChange(id);
        }
      });
    }, {
      threshold: SECTION_THRESHOLDS,
      rootMargin: SECTION_ROOT_MARGIN
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function onSectionChange(sectionId) {
    /* Calculate bracket position based on section top */
    var bracketPct = sectionPct(sectionId);
    if (bracketPct < 0) return;

    /* Left bracket */
    leftBracket.style.top = (TRACK_OFFSET + bracketPct * TRACK_RATIO) + '%';
    leftBracket.classList.add('ppf-rail__bracket--active');

    /* Right bracket */
    rightBracket.style.top = (TRACK_OFFSET + bracketPct * TRACK_RATIO) + '%';
    rightBracket.classList.add('ppf-rail__bracket--active');

    /* Right status label */
    var statusText = getStatusText(sectionId);
    if (statusText) {
      rightStatus.textContent = statusText;
      rightStatus.style.top = (TRACK_OFFSET + bracketPct * TRACK_RATIO + 3) + '%';
      rightStatus.classList.add('ppf-rail__status--visible');
    } else {
      rightStatus.classList.remove('ppf-rail__status--visible');
    }

    /* Section-type effects */
    var isProof = PROOF_SECTIONS.indexOf(sectionId) >= 0;
    leftRail.classList.toggle('ppf-rail--proof-active', isProof);
    rightRail.classList.toggle('ppf-rail--proof-active', isProof);

    var isCta = CTA_SECTIONS.indexOf(sectionId) >= 0;
    leftRail.classList.toggle('ppf-rail--cta-active', isCta);
    rightRail.classList.toggle('ppf-rail--cta-active', isCta);
  }

  function getStatusText(sectionId) {
    var markers;
    if (currentPath === 'athlete') {
      markers = ATHLETE_MARKERS;
    } else if (currentPath === 'adult') {
      markers = ADULT_MARKERS;
    } else if (currentPath === 'integrated') {
      markers = INTEGRATED_MARKERS;
    } else {
      return null;
    }
    var found = null;
    markers.forEach(function (m) {
      if (m.sectionId === sectionId) found = m;
    });
    return found ? found.phase : null;
  }

  /* ── Visibility Control ────────────────────────────── */

  function showRails() {
    leftRail.classList.add('ppf-rail--visible');
    rightRail.classList.add('ppf-rail--visible');
  }

  function observeHeroExit() {
    var hero = qs('.ppf-intro') || qs('#hero') || qs('.hero-section');
    if (!hero) {
      /* No hero found — show rails immediately after short delay */
      setTimeout(showRails, 800);
      return;
    }

    var heroObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) {
          showRails();
        } else if (scrollPct < HERO_HIDE_PCT) {
          leftRail.classList.remove('ppf-rail--visible');
          rightRail.classList.remove('ppf-rail--visible');
        }
      });
    }, { threshold: HERO_EXIT_THRESHOLD });

    heroObserver.observe(hero);
  }

  /* ── Path Detection ────────────────────────────────── */

  function detectPath() {
    /* 1. Check localStorage for previously selected path */
    try {
      var stored = localStorage.getItem('ppf-rail-path');
      if (stored && PATH_COLORS[stored]) {
        setPath(stored);
      }
    } catch (e) { /* localStorage unavailable */ }

    /* 2. Listen for passport quiz completion */
    document.addEventListener('passport:complete', function (e) {
      var data = e.detail || {};
      if (data.path && PATH_COLORS[data.path]) {
        setPath(data.path);
        tryStore(data.path);
      }
    });

    /* 3. Listen for path card clicks */
    document.addEventListener('click', function (e) {
      /* Path cards */
      var pathCard = e.target.closest('[data-path]');
      if (pathCard) {
        var path = pathCard.getAttribute('data-path');
        if (PATH_COLORS[path]) {
          setPath(path);
          tryStore(path);
        }
      }

      /* Passport options — detect "who" field */
      var passportOption = e.target.closest('.passport-option[data-field="who"]');
      if (passportOption) {
        var val = passportOption.getAttribute('data-value');
        if (PATH_COLORS[val]) {
          setPath(val);
          tryStore(val);
        }
      }

      /* Path select dropdown change */
      var selectEl = qs('#path');
      if (selectEl && e.target === selectEl) {
        /* Handle via change event below */
      }
    });

    /* 4. Listen for form path dropdown */
    var pathSelect = qs('#path');
    if (pathSelect) {
      pathSelect.addEventListener('change', function () {
        var val = pathSelect.value;
        if (PATH_COLORS[val]) {
          setPath(val);
          tryStore(val);
        }
      });
    }
  }

  function tryStore(path) {
    try { localStorage.setItem('ppf-rail-path', path); } catch (e) { /* noop */ }
  }

  /* ── Resize Handler ────────────────────────────────── */

  var resizeTimer = null;
  function onResize() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (window.innerWidth < 900) {
        leftRail.classList.remove('ppf-rail--visible');
        rightRail.classList.remove('ppf-rail--visible');
        return;
      }
      buildMarkersForPath();
      updateProgress();
    }, 200);
  }

  /* ── Initialize ────────────────────────────────────── */

  function init() {
    buildRails();
    setPath(currentPath);
    detectPath();

    /* Delay section observation to ensure DOM layout is settled */
    setTimeout(function () {
      buildMarkersForPath();
      observeSections();
      observeHeroExit();
      updateProgress();
    }, DOM_SETTLE_MS);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
