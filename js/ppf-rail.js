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
    { sectionId: 'standard', label: '10 YD',  phase: 'SPEED FOUNDATION',     type: 'yard' },
    { sectionId: 'proof',    label: '20 YD',  phase: 'FORCE APPLICATION',    type: 'yard' },
    { sectionId: 'passport', label: '30 YD',  phase: 'POSITIONAL MOVEMENT',  type: 'yard' },
    { sectionId: 'memberships', label: '40 YD', phase: 'VERIFIED TESTING',   type: 'yard' },
    { sectionId: 'start',   label: 'GOAL',   phase: 'START YOUR PATH',       type: 'yard' }
  ];

  var ATHLETE_METRICS = ['40', 'VERT', 'BROAD', 'SHUTTLE', 'BENCH', 'RAS'];

  /* Section → metric tag association */
  var ATHLETE_METRIC_SECTIONS = {
    proof:          '40',
    legacyWall:     'VERT',
    benchmarkBoard: 'BROAD',
    passport:       'SHUTTLE',
    memberships:    'BENCH',
    start:          'RAS'
  };

  /* Split times that appear as user scrolls */
  var ATHLETE_SPLITS = [
    { pct: 15, time: '1.52' },
    { pct: 35, time: '2.89' },
    { pct: 60, time: '3.74' },
    { pct: 85, time: '4.48' }
  ];

  var ADULT_MARKERS = [
    { sectionId: 'standard',    label: 'START',    phase: 'READY',           type: 'milestone' },
    { sectionId: 'proof',       label: 'BUILD',    phase: 'BUILD',           type: 'milestone' },
    { sectionId: 'experience',  label: 'IMPROVE',  phase: 'STRENGTH',        type: 'milestone' },
    { sectionId: 'memberships', label: 'PERFORM',  phase: 'COMMIT',          type: 'milestone' },
    { sectionId: 'start',       label: 'SUSTAIN',  phase: 'STAY CONSISTENT', type: 'milestone' }
  ];

  var ADULT_READINESS_CUES = {
    standard:    'READY',
    paths:       'BUILD',
    proof:       'STRENGTH',
    experience:  'COMMIT',
    memberships: 'PERFORM',
    start:       'STAY CONSISTENT'
  };

  var INTEGRATED_MARKERS = [
    { sectionId: 'standard',        label: 'WELCOME',    phase: 'WELCOME',    type: 'guided' },
    { sectionId: 'paths',           label: 'SUPPORT',    phase: 'SUPPORT',    type: 'guided' },
    { sectionId: 'filmRoom',        label: 'MOVEMENT',   phase: 'MOVEMENT',   type: 'guided' },
    { sectionId: 'passport',        label: 'PROGRESS',   phase: 'PROGRESS',   type: 'guided' },
    { sectionId: 'familyDashboard', label: 'CONFIDENCE', phase: 'CONFIDENCE', type: 'guided' },
    { sectionId: 'start',           label: 'BELONGING',  phase: 'BELONGING',  type: 'guided' }
  ];

  /* Sections that trigger connection lines (integrated) */
  var INTEGRATED_CONNECT_SECTIONS = ['familyDashboard', 'paths', 'room', 'trust'];

  /* Sections that trigger proof-active state */
  var PROOF_SECTIONS = ['proof', 'legacyWall', 'benchmarkBoard', 'standardStreaks'];

  /* Sections that trigger CTA-active state */
  var CTA_SECTIONS = ['start', 'experience'];

  /* Sections that trigger tension (adult) */
  var STRENGTH_SECTIONS = ['proof', 'benchmarkBoard', 'memberships'];

  /* Path labels */
  var PATH_NAMES = {
    athlete:    'PPF DRIVE LANE',
    adult:      'PPF STRENGTH LINE',
    integrated: 'PPF GUIDED PATH'
  };

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
  var leftPulse;
  var rightStatus;
  var leftPathName;
  var leftMarkerContainer, rightMarkerContainer;
  var leftConnection;  /* integrated only */
  var rightCtaZone;
  var leftSplitTime;   /* athlete only */
  var leftReadiness;   /* adult only */
  var metricTagEls = {};

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

    leftPulse = el('div', 'ppf-rail__pulse');
    leftRail.appendChild(leftPulse);

    leftPathName = el('div', 'ppf-rail__path-name');
    leftRail.appendChild(leftPathName);

    leftMarkerContainer = el('div', 'ppf-rail__markers');
    leftMarkerContainer.style.cssText = 'position:absolute;top:5%;bottom:5%;width:100%';
    leftRail.appendChild(leftMarkerContainer);

    leftConnection = el('div', 'ppf-rail__connection');
    leftRail.appendChild(leftConnection);

    leftSplitTime = el('div', 'ppf-rail__split-time');
    leftRail.appendChild(leftSplitTime);

    leftReadiness = el('div', 'ppf-rail__readiness');
    leftRail.appendChild(leftReadiness);

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

    rightCtaZone = el('div', 'ppf-rail__cta-zone');
    rightRail.appendChild(rightCtaZone);

    document.body.appendChild(leftRail);
    document.body.appendChild(rightRail);
  }

  /* ── Marker Builders ───────────────────────────────── */

  function clearMarkers() {
    leftMarkerContainer.innerHTML = '';
    rightMarkerContainer.innerHTML = '';
    metricTagEls = {};
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
    var top = section.getBoundingClientRect().top + window.pageYOffset;
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

    /* Metric stack tags — right rail */
    var metricStartPct = 20;
    var metricGap = 10;
    ATHLETE_METRICS.forEach(function (name, i) {
      var tag = el('div', 'ppf-rail__metric-tag');
      tag.textContent = name;
      tag.style.position = 'absolute';
      tag.style.top = (metricStartPct + i * metricGap) + '%';
      tag.style.left = '4px';
      metricTagEls[name] = tag;
      rightMarkerContainer.appendChild(tag);
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

    /* Show/hide path-specific elements */
    leftSplitTime.style.display = (path === 'athlete') ? '' : 'none';
    leftReadiness.style.display = (path === 'adult') ? '' : 'none';
    leftConnection.style.display = (path === 'integrated') ? '' : 'none';

    /* Force update */
    updateProgress();
  }

  /* ── Scroll Progress ───────────────────────────────── */

  var scrollTicking = false;

  function updateProgress() {
    var docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;
    scrollPct = Math.min(100, Math.max(0, (window.pageYOffset / docHeight) * 100));

    /* Progress fill height — maps to the 90% track area (5% to 95%) */
    var fillHeight = scrollPct * 0.9;
    leftProgress.style.height = fillHeight + '%';
    leftProgress.style.top = '5%';
    rightProgress.style.height = fillHeight + '%';
    rightProgress.style.top = '5%';

    /* Glow dot position */
    var glowTop = 5 + scrollPct * 0.9;
    leftGlow.style.top = glowTop + '%';
    leftGlow.classList.add('ppf-rail__glow--active');
    rightGlow.style.top = glowTop + '%';
    rightGlow.classList.add('ppf-rail__glow--active');

    /* Pulse position */
    leftPulse.style.top = glowTop + '%';
    leftPulse.style.opacity = '1';

    /* Update markers — mark as reached when scroll passes them */
    var allMarkers = qsa('.ppf-rail__marker', leftMarkerContainer)
      .concat(qsa('.ppf-rail__marker', rightMarkerContainer));
    allMarkers.forEach(function (m) {
      var markerPct = parseFloat(m.getAttribute('data-pct'));
      if (scrollPct >= markerPct - 2) {
        m.classList.add('ppf-rail__marker--reached');
      } else {
        m.classList.remove('ppf-rail__marker--reached');
      }
    });

    /* Path-specific scroll effects */
    if (currentPath === 'athlete') {
      updateAthleteSplitTime();
      updateAthleteMetricTags();
    } else if (currentPath === 'adult') {
      updateAdultReadiness();
      updateAdultTension();
    } else if (currentPath === 'integrated') {
      updateIntegratedConnection();
    }

    /* CTA zone */
    if (scrollPct > 85) {
      rightCtaZone.classList.add('ppf-rail__cta-zone--hot');
    } else {
      rightCtaZone.classList.remove('ppf-rail__cta-zone--hot');
    }
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

  /* ── Athlete-Specific: Split Time ──────────────────── */

  function updateAthleteSplitTime() {
    var currentSplit = null;
    for (var i = ATHLETE_SPLITS.length - 1; i >= 0; i--) {
      if (scrollPct >= ATHLETE_SPLITS[i].pct) {
        currentSplit = ATHLETE_SPLITS[i];
        break;
      }
    }
    if (currentSplit) {
      leftSplitTime.textContent = currentSplit.time + 's';
      leftSplitTime.style.opacity = '1';
    } else {
      leftSplitTime.textContent = '0.00s';
      leftSplitTime.style.opacity = '0.3';
    }
  }

  /* ── Athlete-Specific: Metric Tags ─────────────────── */

  function updateAthleteMetricTags() {
    if (!activeSection) return;
    var litMetric = ATHLETE_METRIC_SECTIONS[activeSection];
    Object.keys(metricTagEls).forEach(function (name) {
      if (name === litMetric) {
        metricTagEls[name].classList.add('ppf-rail__metric-tag--lit');
      } else {
        metricTagEls[name].classList.remove('ppf-rail__metric-tag--lit');
      }
    });
  }

  /* ── Adult-Specific: Readiness Cue ─────────────────── */

  function updateAdultReadiness() {
    if (!activeSection) {
      leftReadiness.classList.remove('ppf-rail__readiness--show');
      return;
    }
    var cue = ADULT_READINESS_CUES[activeSection];
    if (cue) {
      leftReadiness.textContent = cue;
      leftReadiness.classList.add('ppf-rail__readiness--show');
      /* Position near the bracket */
      var bracketTop = parseFloat(leftBracket.style.top) || 50;
      leftReadiness.style.top = (bracketTop + 4) + '%';
    } else {
      leftReadiness.classList.remove('ppf-rail__readiness--show');
    }
  }

  /* ── Adult-Specific: Tension Effect ────────────────── */

  function updateAdultTension() {
    var inStrength = STRENGTH_SECTIONS.indexOf(activeSection) >= 0;
    if (inStrength) {
      leftRail.classList.add('ppf-rail--tension');
      rightRail.classList.add('ppf-rail--tension');
    } else {
      leftRail.classList.remove('ppf-rail--tension');
      rightRail.classList.remove('ppf-rail--tension');
    }
  }

  /* ── Integrated-Specific: Connection Lines ─────────── */

  function updateIntegratedConnection() {
    var shouldConnect = INTEGRATED_CONNECT_SECTIONS.indexOf(activeSection) >= 0;
    if (shouldConnect) {
      /* Position connection line at bracket */
      leftConnection.style.top = leftBracket.style.top;
      leftConnection.classList.add('ppf-rail__connection--extend');
    } else {
      leftConnection.classList.remove('ppf-rail__connection--extend');
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
      threshold: [0.15, 0.3, 0.5],
      rootMargin: '-10% 0px -10% 0px'
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
    leftBracket.style.top = (5 + bracketPct * 0.9) + '%';
    leftBracket.classList.add('ppf-rail__bracket--active');

    /* Right bracket */
    rightBracket.style.top = (5 + bracketPct * 0.9) + '%';
    rightBracket.classList.add('ppf-rail__bracket--active');

    /* Right status label */
    var statusText = getStatusText(sectionId);
    if (statusText) {
      rightStatus.textContent = statusText;
      rightStatus.style.top = (5 + bracketPct * 0.9 + 3) + '%';
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
    if (currentPath === 'athlete') {
      var aMarker = null;
      ATHLETE_MARKERS.forEach(function (m) {
        if (m.sectionId === sectionId) aMarker = m;
      });
      return aMarker ? aMarker.phase : null;
    }
    if (currentPath === 'adult') {
      return ADULT_READINESS_CUES[sectionId] || null;
    }
    if (currentPath === 'integrated') {
      var iMarker = null;
      INTEGRATED_MARKERS.forEach(function (m) {
        if (m.sectionId === sectionId) iMarker = m;
      });
      return iMarker ? iMarker.phase : null;
    }
    return null;
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
        } else if (scrollPct < 3) {
          leftRail.classList.remove('ppf-rail--visible');
          rightRail.classList.remove('ppf-rail--visible');
        }
      });
    }, { threshold: 0.3 });

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
    }, 300);

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
  }

  document.addEventListener('DOMContentLoaded', init);

})();
