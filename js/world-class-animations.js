/* ================================================================
   PPF ATHLETICS — WORLD-CLASS ANIMATION ENGINE
   ================================================================
   Self-contained IIFE that drives advanced section animations.
   Works alongside main.js (IntersectionObserver, cursor, scroll)
   and command-trigger.js (CTA state machine).

   Exposes: window.PPFWorldAnimations  { refresh() }
   ================================================================ */
;(function () {
  'use strict';

  /* ---------------------------------------------------------------
     0. REDUCED-MOTION GUARD
  --------------------------------------------------------------- */
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) {
    window.PPFWorldAnimations = { refresh: function () {} };
    return; // Skip every animation system
  }

  /* ---------------------------------------------------------------
     1. SHARED UTILITIES
  --------------------------------------------------------------- */

  /** Debounce — returns a debounced version of `fn`. */
  function debounce(fn, ms) {
    var id;
    return function () {
      var ctx = this, args = arguments;
      clearTimeout(id);
      id = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  /** Clamp value between min and max. */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }

  /** Linear interpolation. */
  function lerp(a, b, t) { return a + (b - a) * t; }

  /** Sprint-style easing: slow start, fast middle, slow end. */
  function sprintEase(t) {
    // Attempt a quartic ease-in-out for "sprint acceleration feel"
    return t < 0.5
      ? 8 * t * t * t * t
      : 1 - Math.pow(-2 * t + 2, 4) / 2;
  }

  /** Shorthand querySelector / querySelectorAll cached. */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /** Safe requestAnimationFrame wrapper. */
  var raf = window.requestAnimationFrame || function (cb) { return setTimeout(cb, 16); };

  /* ---------------------------------------------------------------
     2. DOM CACHE
  --------------------------------------------------------------- */
  var dom = {};

  function cacheDOM() {
    dom.hero            = qs('#hero');
    dom.heroContent     = qs('.hero-content', dom.hero);
    dom.heroMicroData   = qs('#heroMicroData');
    dom.staggerBlocks   = qsa('.stagger-block');
    dom.headlineWords   = qsa('.headline-word');

    dom.paths           = qs('#paths');
    dom.pathCards       = qsa('.path-card');

    dom.standard        = qs('#standard');
    dom.pillarCards     = qsa('.pillar-card');
    dom.pillarSeal      = qs('.pillar-complete-seal');

    dom.proof           = qs('#proof');
    dom.proofNums       = qsa('.proof-num');
    dom.storyCards      = qsa('.story-card');
    dom.proofStamps     = qsa('.proof-stamp');

    dom.room            = qs('#room');
    dom.roomStages      = qsa('.room-stage');

    dom.leadership      = qs('#leadership');
    dom.leaderCards     = qsa('.leader-card');

    dom.experience      = qs('#experience');
    dom.experienceDays  = qsa('.experience-day');
    dom.roadmapLine     = qs('#expRoadmapLine') || qs('.experience-roadmap-line');

    dom.memberships     = qs('#memberships');
    dom.memberCards     = qsa('.membership-card');

    dom.social          = qs('#social');
    dom.footer          = qs('#footer') || qs('.site-footer');
    dom.footerLogo      = qs('.footer-logo', dom.footer);
    dom.footerSig       = qs('.footer-signature', dom.footer);
    dom.footerCloseLine = qs('.footer-close-line', dom.footer);
    dom.footerContactCards = qsa('.ccc-contact-card, .ccc-location', dom.footer);

    dom.sectionMorphs   = qsa('.section-morph');

    dom.coachHud        = qs('#coachHud');
    dom.hudPhase        = qs('#hudPhase');
    dom.hudCue          = qs('#hudCue');
    dom.hudProgressFill = qs('#hudProgressFill');

    dom.socialCards     = qsa('.social-card');
  }

  /* ---------------------------------------------------------------
     3. SHARED INTERSECTION OBSERVER
     One observer handles most one-shot viewport triggers.
  --------------------------------------------------------------- */
  var observedMap = {}; // key → callback
  var sharedObserver;
  var observerEntries = []; // track registered elements

  function initSharedObserver() {
    sharedObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var key = el.getAttribute('data-wca-key');
        if (key && observedMap[key]) {
          observedMap[key](el);
          delete observedMap[key];
          sharedObserver.unobserve(el);
        }
      });
    }, { rootMargin: '0px 0px -60px 0px', threshold: [0, 0.15, 0.3, 0.5, 0.7] });
  }

  var wcaKeyCounter = 0;
  function observe(el, cb) {
    if (!el) return;
    var key = 'wca-' + (++wcaKeyCounter);
    el.setAttribute('data-wca-key', key);
    observedMap[key] = cb;
    sharedObserver.observe(el);
    observerEntries.push(el);
  }

  /* ---------------------------------------------------------------
     4. SCROLL STATE (debounced + RAF)
  --------------------------------------------------------------- */
  var scrollState = {
    y: 0,
    prevY: 0,
    velocity: 0,
    docH: 1,
    winH: 1,
    progress: 0, // 0-1 over whole page
    rafId: null,
    lastEchoTime: 0
  };

  function updateScrollMetrics() {
    scrollState.prevY = scrollState.y;
    scrollState.y = window.pageYOffset || document.documentElement.scrollTop;
    scrollState.velocity = scrollState.y - scrollState.prevY;
    scrollState.docH = Math.max(document.body.scrollHeight, 1);
    scrollState.winH = window.innerHeight;
    scrollState.progress = clamp(scrollState.y / (scrollState.docH - scrollState.winH), 0, 1);
  }

  /* ---------------------------------------------------------------
     5. MOUSE STATE
  --------------------------------------------------------------- */
  var mouseState = { x: 0, y: 0 };

  /* ================================================================
     SYSTEM 1 — HERO COMMAND-CENTER
  ================================================================ */

  var heroFloatLabels = [];
  var heroLabelsCreated = false;

  function initHeroCommandCenter() {
    if (!dom.hero) return;

    /* --- Metric Float Labels --- */
    createHeroFloatLabels();

    /* --- Staggered Headline Reveal --- */
    var revealTargets = dom.headlineWords.length ? dom.headlineWords : qsa('.stagger-block > *');
    revealTargets.forEach(function (el, i) {
      setTimeout(function () {
        el.classList.add('revealed');
      }, i * 80);
    });
  }

  /** Create 6 floating micro-data labels around hero edges. */
  function createHeroFloatLabels() {
    if (heroLabelsCreated || !dom.heroMicroData) return;
    heroLabelsCreated = true;

    var labels = ['REACTION', 'SPEED', 'OUTPUT', 'READINESS', 'STANDARD', 'COACHING'];
    // Positions around the hero edges (percent-based)
    var positions = [
      { top: '8%',  left: '4%' },
      { top: '12%', right: '6%' },
      { top: '55%', left: '2%' },
      { top: '60%', right: '3%' },
      { bottom: '18%', left: '8%' },
      { bottom: '14%', right: '5%' }
    ];

    labels.forEach(function (text, i) {
      var el = document.createElement('span');
      el.className = 'hero-metric-float wca-float-label';
      el.textContent = text;
      el.setAttribute('aria-hidden', 'true');

      var pos = positions[i];
      Object.keys(pos).forEach(function (k) { el.style[k] = pos[k]; });

      // Stagger entrance
      el.style.animationDelay = (i * 0.4 + 1) + 's';
      dom.hero.appendChild(el);
      heroFloatLabels.push(el);
    });
  }

  /** Per-frame hero updates driven from the scroll RAF loop. */
  function tickHero() {
    if (!dom.hero) return;

    // --hero-scroll: 0 at top, 1 when hero exits viewport
    var rect = dom.hero.getBoundingClientRect();
    var heroH = dom.hero.offsetHeight || 1;
    var t = clamp(-rect.top / heroH, 0, 1);
    dom.hero.style.setProperty('--hero-scroll', t.toFixed(4));

    // Hero compression transform
    if (dom.heroContent) {
      var scale = lerp(1, 0.96, t);
      var ty = lerp(0, -40, t);
      dom.heroContent.style.transform = 'scale(' + scale + ') translateY(' + ty + 'px)';
      dom.heroContent.style.opacity = clamp(1 - t * 0.6, 0, 1);
    }

    // Float-label parallax (shift opposite to mouse direction, max 8px)
    var winW = window.innerWidth || 1;
    var cx = (mouseState.x / winW - 0.5) * 2;   // -1..1 horizontal
    var cy = (mouseState.y / scrollState.winH - 0.5) * 2; // -1..1 vertical
    heroFloatLabels.forEach(function (el, i) {
      var dx = -cx * (4 + (i % 3) * 2); // max ≈ 8px
      var dy = -cy * (4 + (i % 3) * 2);
      el.style.transform = 'translate(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px)';
    });
  }

  /* ================================================================
     SYSTEM 2 — PATH LANE-DETECTION
  ================================================================ */

  var pathHoverTimers = {};  // per-path timers for identity tag delay
  var pathMemory = { athlete: 0, adult: 0, integrated: 0, preferred: null };

  function initPathLaneDetection() {
    if (!dom.paths || !dom.pathCards.length) return;

    dom.pathCards.forEach(function (card) {
      var pathType = card.getAttribute('data-path');

      // Set per-type animation speed data attributes
      var speeds = { athlete: '0.3', adult: '0.5', integrated: '0.4' };
      card.setAttribute('data-anim-speed', speeds[pathType] || '0.4');

      card.addEventListener('mouseenter', function () {
        handlePathHover(card, pathType);
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        handlePathLeave(card, pathType);
      }, { passive: true });

      card.addEventListener('click', function () {
        handlePathClick(card, pathType);
      });
    });

    // Track mouse glow on paths section
    if (dom.paths) {
      dom.paths.addEventListener('mousemove', function (e) {
        var rect = dom.paths.getBoundingClientRect();
        dom.paths.style.setProperty('--path-glow-x', (e.clientX - rect.left) + 'px');
        dom.paths.style.setProperty('--path-glow-y', (e.clientY - rect.top) + 'px');
      }, { passive: true });
    }
  }

  function handlePathHover(card, pathType) {
    // Start lane scanning
    card.classList.add('lane-scanning');

    // Track hover start for path memory
    card._wcaHoverStart = Date.now();

    // After scan delay, show identity tag
    clearTimeout(pathHoverTimers[pathType]);
    pathHoverTimers[pathType] = setTimeout(function () {
      card.classList.remove('lane-scanning');

      var identityMessages = {
        athlete: 'ATHLETE MATCH DETECTED',
        adult: 'ADULT MATCH DETECTED',
        integrated: 'INTEGRATED MATCH DETECTED'
      };

      // Create or update identity tag
      var tag = card.querySelector('.path-identity-tag');
      if (!tag) {
        tag = document.createElement('div');
        tag.className = 'path-identity-tag';
        tag.setAttribute('aria-hidden', 'true');
        card.appendChild(tag);
      }
      tag.textContent = identityMessages[pathType] || '';
      tag.classList.add('visible');
    }, 400);
  }

  function handlePathLeave(card, pathType) {
    clearTimeout(pathHoverTimers[pathType]);
    card.classList.remove('lane-scanning');

    var tag = card.querySelector('.path-identity-tag');
    if (tag) tag.classList.remove('visible');

    // Record hover duration for path memory
    if (card._wcaHoverStart) {
      var duration = Date.now() - card._wcaHoverStart;
      pathMemory[pathType] = (pathMemory[pathType] || 0) + duration;
      card._wcaHoverStart = null;
      updatePathMemory();
    }
  }

  function handlePathClick(card, pathType) {
    // Clear scanning, lock the lane
    clearTimeout(pathHoverTimers[pathType]);
    card.classList.remove('lane-scanning');
    card.classList.add('lane-locked');

    // Remove lock from other cards
    dom.pathCards.forEach(function (c) {
      if (c !== card) c.classList.remove('lane-locked');
    });
  }

  /* ================================================================
     SYSTEM 3 — STANDARD POWER CHAMBER (Progressive Focus)
  ================================================================ */

  var pillarViewState = { coaching: false, structure: false, environment: false, proof: false };
  var pillarCompleteFired = false;

  function initStandardPowerChamber() {
    if (!dom.pillarCards.length) return;

    var impactPhrases = {
      coaching:    'COACHING CORRECTS IN REAL TIME',
      structure:   'STRUCTURE REMOVES RANDOMNESS',
      environment: 'ENVIRONMENT DEMANDS MORE',
      proof:       'PROOF MAKES IT REAL'
    };

    dom.pillarCards.forEach(function (card) {
      var pillar = card.getAttribute('data-pillar');

      card.addEventListener('mouseenter', function () {
        // Dim siblings
        dom.pillarCards.forEach(function (sib) {
          if (sib !== card) sib.classList.add('focus-dimmed');
        });

        // Mark as viewed
        if (pillar && pillarViewState.hasOwnProperty(pillar)) {
          pillarViewState[pillar] = true;
        }

        // Show impact phrase overlay
        showImpactPhrase(card, impactPhrases[pillar]);

        checkPillarComplete();
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        dom.pillarCards.forEach(function (sib) {
          sib.classList.remove('focus-dimmed');
        });
        hideImpactPhrase(card);
      }, { passive: true });
    });
  }

  function showImpactPhrase(card, phrase) {
    if (!phrase) return;
    var el = card.querySelector('.wca-impact-phrase');
    if (!el) {
      el = document.createElement('div');
      el.className = 'wca-impact-phrase';
      el.setAttribute('aria-hidden', 'true');
      card.appendChild(el);
    }
    el.textContent = phrase;
    el.classList.add('visible');
  }

  function hideImpactPhrase(card) {
    var el = card.querySelector('.wca-impact-phrase');
    if (el) el.classList.remove('visible');
  }

  function checkPillarComplete() {
    if (pillarCompleteFired) return;
    var all = Object.keys(pillarViewState).every(function (k) { return pillarViewState[k]; });
    if (all) {
      pillarCompleteFired = true;
      setTimeout(function () {
        if (dom.pillarSeal) dom.pillarSeal.classList.add('active');
        if (dom.standard) dom.standard.classList.add('pillars-all-viewed');
      }, 500);
    }
  }

  /* ================================================================
     SYSTEM 4 — PROOF ENGINE THEATER
  ================================================================ */

  var proofAnimated = false;

  function initProofEngineTheater() {
    if (!dom.proof) return;

    // Observe proof section
    observe(dom.proof, function () {
      if (proofAnimated) return;
      proofAnimated = true;
      animateProofCounters();
      staggerStoryCards();
      stampPulse();
    });
  }

  /** Sprint-eased counter animation for proof numbers. */
  function animateProofCounters() {
    dom.proofNums.forEach(function (el) {
      var target = parseInt(el.getAttribute('data-target'), 10);
      if (isNaN(target) || target === 0) return;

      var duration = 1800; // ms
      var start = performance.now();

      function step(now) {
        var elapsed = now - start;
        var t = clamp(elapsed / duration, 0, 1);
        var eased = sprintEase(t);
        el.textContent = Math.round(eased * target);
        if (t < 1) raf(step);
      }
      raf(step);
    });
  }

  /** Stagger entrance for story / testimonial cards. */
  function staggerStoryCards() {
    // Only animate visible panel's cards
    var activePanel = qs('.proof-panel.active', dom.proof);
    var cards = activePanel ? qsa('.story-card', activePanel) : dom.storyCards;
    cards.forEach(function (card, i) {
      setTimeout(function () {
        card.classList.add('in-view');
      }, i * 120);
    });
  }

  /** Proof stamp one-shot pulse. */
  function stampPulse() {
    dom.proofStamps.forEach(function (stamp) {
      stamp.classList.add('stamped');
    });
  }

  /* ================================================================
     SYSTEM 5 — SESSION RECONSTRUCTION (Inside the Room)
  ================================================================ */

  var coachCues = {
    arrival:     ['CHECK IN', 'SYSTEM ACTIVE', 'READY STATE'],
    warmup:      ['ACTIVATE', 'PRIME THE SYSTEM', 'MOBILITY FIRST'],
    instruction: ['HIPS BACK', 'DRIVE THROUGH', 'FINISH TALL'],
    work:        ['EXECUTE', 'MAINTAIN FORM', 'PUSH OUTPUT'],
    finish:      ['RECOVER', 'SESSION LOGGED', 'COMPLETE']
  };

  var cueOverlay = null;   // shared overlay element
  var cueTimers = [];       // track cue timeouts for cleanup

  function initSessionReconstruction() {
    if (!dom.room || !dom.roomStages.length) return;

    // Create a reusable overlay container
    cueOverlay = document.createElement('div');
    cueOverlay.className = 'wca-coach-cue-overlay';
    cueOverlay.setAttribute('aria-hidden', 'true');
    dom.room.appendChild(cueOverlay);

    // Watch for active stage changes via MutationObserver
    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        if (m.type === 'attributes' && m.attributeName === 'class') {
          var stage = m.target;
          if (stage.classList.contains('active') && stage.classList.contains('room-stage')) {
            onStageActivated(stage);
          }
        }
      });
    });

    dom.roomStages.forEach(function (stage) {
      mo.observe(stage, { attributes: true, attributeFilter: ['class'] });
    });

    // Trigger for the initially active stage
    var active = qs('.room-stage.active', dom.room);
    if (active) onStageActivated(active);
  }

  function onStageActivated(stage) {
    var phase = stage.getAttribute('data-phase');
    clearCueTimers();
    cueOverlay.innerHTML = '';

    // Phase-specific ambient class on room section
    var phases = ['arrival', 'warmup', 'instruction', 'work', 'finish'];
    phases.forEach(function (p) { dom.room.classList.remove('room-ambient-' + p); });
    if (phase) dom.room.classList.add('room-ambient-' + phase);

    // Show coach cues for this phase
    var cues = coachCues[phase];
    if (!cues) return;

    cues.forEach(function (word, i) {
      var delay = i * 400;
      var timer = setTimeout(function () {
        var span = document.createElement('span');
        span.className = 'wca-cue-word';
        span.textContent = word;
        cueOverlay.appendChild(span);

        // Trigger entrance on next frame
        raf(function () { span.classList.add('active'); });

        // Fade out after 1.2s
        var fadeTimer = setTimeout(function () {
          span.classList.remove('active');
          setTimeout(function () {
            if (span.parentNode) span.parentNode.removeChild(span);
          }, 400);
        }, 1200);
        cueTimers.push(fadeTimer);
      }, delay);
      cueTimers.push(timer);
    });
  }

  function clearCueTimers() {
    cueTimers.forEach(function (t) { clearTimeout(t); });
    cueTimers = [];
  }

  /* ================================================================
     SYSTEM 6 — LEADERSHIP GUARDIAN REVEAL
  ================================================================ */

  var leaderValuesCreated = false;

  function initLeadershipGuardianReveal() {
    if (!dom.leaderCards.length) return;

    var protectedValues = [
      ['STANDARD', 'ACCOUNTABILITY', 'PRECISION', 'TRUST'],       // Richard
      ['DIGNITY', 'PURPOSE', 'TRANSFORMATION', 'SUPPORT']         // Rebecca
    ];

    dom.leaderCards.forEach(function (card, idx) {
      var credentials = qsa('.credential-badge', card);

      // Hover: stagger credential reveal
      card.addEventListener('mouseenter', function () {
        credentials.forEach(function (cred, ci) {
          setTimeout(function () { cred.classList.add('revealed'); }, ci * 150);
        });
      }, { passive: true });

      // Create floating protected values (orbital)
      if (!leaderValuesCreated) {
        createOrbitalValues(card, protectedValues[idx] || []);
      }
    });

    leaderValuesCreated = true;
  }

  function createOrbitalValues(card, values) {
    var container = document.createElement('div');
    container.className = 'wca-leader-values-orbit';
    container.setAttribute('aria-hidden', 'true');

    values.forEach(function (val, i) {
      var span = document.createElement('span');
      span.className = 'wca-orbit-value';
      span.textContent = val;
      // Randomized delay for orbital animation
      span.style.animationDelay = (i * 1.8 + Math.random() * 2).toFixed(1) + 's';
      // Distribute around the card
      span.style.setProperty('--orbit-index', i);
      container.appendChild(span);
    });

    card.style.position = 'relative';
    card.appendChild(container);
  }

  /* ================================================================
     SYSTEM 7 — SECTION MORPH TRANSITIONS
  ================================================================ */

  function initSectionMorphs() {
    dom.sectionMorphs.forEach(function (el) {
      observe(el, function (target) {
        target.classList.add('morph-active');
      });
    });
  }

  /* ================================================================
     SYSTEM 8 — 3-DAY EXPERIENCE CEREMONY
  ================================================================ */

  var experienceAnimated = false;

  function initExperienceCeremony() {
    if (!dom.experience || !dom.experienceDays.length) return;

    observe(dom.experience, function () {
      if (experienceAnimated) return;
      experienceAnimated = true;

      // Power on cards sequentially: 0ms, 300ms, 600ms
      dom.experienceDays.forEach(function (card, i) {
        setTimeout(function () {
          card.classList.add('powered-on');
        }, i * 300);
      });

      // Extend roadmap line after all 3 power on
      var totalDelay = dom.experienceDays.length * 300 + 200;
      setTimeout(function () {
        if (dom.roadmapLine) {
          dom.roadmapLine.classList.add('roadmap-extending', 'extending');
        }
      }, totalDelay);
    });
  }

  /* ================================================================
     SYSTEM 9 — MEMBERSHIP COMMITMENT LADDER
  ================================================================ */

  function initMembershipLadder() {
    if (!dom.memberCards.length) return;

    var tierIdentity = {
      monthly:    'ENTRY',
      quarterly:  'MOMENTUM',
      semiannual: 'DEVELOPMENT',
      yearly:     'TRANSFORMATION'
    };

    dom.memberCards.forEach(function (card, idx) {
      var tier = card.getAttribute('data-tier');

      // Set commitment level CSS property (0-3)
      card.style.setProperty('--commitment-level', idx);

      card.addEventListener('mouseenter', function () {
        showMembershipTag(card, tierIdentity[tier]);
      }, { passive: true });

      card.addEventListener('mouseleave', function () {
        hideMembershipTag(card);
      }, { passive: true });
    });
  }

  function showMembershipTag(card, label) {
    if (!label) return;
    var tag = card.querySelector('.wca-membership-tag');
    if (!tag) {
      tag = document.createElement('div');
      tag.className = 'wca-membership-tag';
      tag.setAttribute('aria-hidden', 'true');
      card.appendChild(tag);
    }
    tag.textContent = label;
    tag.classList.add('visible');
  }

  function hideMembershipTag(card) {
    var tag = card.querySelector('.wca-membership-tag');
    if (tag) tag.classList.remove('visible');
  }

  /* ================================================================
     SYSTEM 10 — FOOTER CLOSING SEQUENCE
  ================================================================ */

  var footerAnimated = false;

  function initFooterClosingSequence() {
    var target = dom.footer || dom.social;
    if (!target) return;

    observe(target, function () {
      if (footerAnimated) return;
      footerAnimated = true;

      target.classList.add('footer-active');

      // Stagger contact items
      dom.footerContactCards.forEach(function (item, i) {
        setTimeout(function () {
          item.classList.add('revealed', 'in-view');
        }, i * 100);
      });

      // Social cards stagger
      dom.socialCards.forEach(function (card, i) {
        setTimeout(function () {
          card.classList.add('in-view');
        }, i * 100);
      });

      // Logo resolve
      if (dom.footerLogo) {
        setTimeout(function () {
          dom.footerLogo.classList.add('logo-resolved');
        }, 400);
      }

      // Signature animation
      if (dom.footerSig) {
        setTimeout(function () {
          dom.footerSig.classList.add('active');
        }, 600);
      }

      // Final statement — slow authority
      if (dom.footerCloseLine) {
        setTimeout(function () {
          dom.footerCloseLine.classList.add('visible');
        }, 900);
      }
    });
  }

  /* ================================================================
     SYSTEM 11 — COACH CUE HUD ENHANCEMENT
  ================================================================ */

  var sectionModes = {
    hero:        'ARRIVAL',
    standard:    'METHOD',
    paths:       'SELECTION',
    proof:       'VERIFICATION',
    room:        'TRAINING',
    leadership:  'COMMAND',
    experience:  'EVALUATION',
    memberships: 'COMMITMENT',
    start:       'INITIATION',
    social:      'CONTACT'
  };

  var currentHudMode = '';

  /** Determine which section the user is currently viewing. */
  function getCurrentSection() {
    var sections = [
      'hero', 'standard', 'paths', 'proof', 'room',
      'leadership', 'experience', 'memberships', 'start', 'social'
    ];
    var best = null;
    var bestScore = Infinity;

    sections.forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;
      var rect = el.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var dist = Math.abs(center - scrollState.winH / 2);
      if (dist < bestScore) {
        bestScore = dist;
        best = id;
      }
    });
    return best;
  }

  function tickHud() {
    if (!dom.coachHud) return;

    var section = getCurrentSection();
    var mode = sectionModes[section] || '—';

    if (mode !== currentHudMode) {
      currentHudMode = mode;
      if (dom.hudPhase) {
        dom.hudPhase.textContent = mode;
        // Flash animation
        dom.coachHud.classList.add('hud-update-flash');
        setTimeout(function () {
          dom.coachHud.classList.remove('hud-update-flash');
        }, 300);
      }
    }

    // Engagement level = scroll progress as 0-100%
    if (dom.hudProgressFill) {
      dom.hudProgressFill.style.width = (scrollState.progress * 100).toFixed(1) + '%';
    }
  }

  /* ================================================================
     SYSTEM 12 — COACHING COMMAND ECHOES
  ================================================================ */

  var echoWords = ['STANDARD', 'PROOF', 'LOCK IN', 'BUILT', 'PERFORM', 'COACHING', 'STRUCTURE'];
  var echoContainer = null;

  function initCommandEchoes() {
    echoContainer = document.createElement('div');
    echoContainer.className = 'wca-echo-container';
    echoContainer.setAttribute('aria-hidden', 'true');
    document.body.appendChild(echoContainer);
  }

  function tickEchoes() {
    if (!echoContainer) return;

    var vel = Math.abs(scrollState.velocity);
    var now = Date.now();

    // Threshold: fast scroll > 40px/frame, max 1 echo every 2s
    if (vel > 40 && (now - scrollState.lastEchoTime) > 2000) {
      scrollState.lastEchoTime = now;
      spawnEcho();
    }
  }

  function spawnEcho() {
    var word = echoWords[Math.floor(Math.random() * echoWords.length)];

    var el = document.createElement('span');
    el.className = 'wca-echo-word';
    el.textContent = word;

    // Random position within viewport
    el.style.left = (10 + Math.random() * 80) + '%';
    el.style.top = (10 + Math.random() * 80) + '%';

    // Random slight opacity between 0.06-0.08
    el.style.opacity = (0.06 + Math.random() * 0.02).toFixed(3);

    echoContainer.appendChild(el);

    // Trigger CSS animation
    raf(function () { el.classList.add('active'); });

    // Remove after 1.5s
    setTimeout(function () {
      el.classList.add('fading');
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 500);
    }, 1500);
  }

  /* ================================================================
     SYSTEM 13 — EFFORT COMPRESSION MICRO-INTERACTION
  ================================================================ */

  function initEffortCompression() {
    var selectors = ['.path-card', '.membership-card', '.pillar-card', '.leader-card'];
    var targets = qsa(selectors.join(','));

    targets.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        // Remove existing to allow re-trigger
        el.classList.remove('effort-compress');
        // Force reflow to restart animation
        void el.offsetWidth;
        el.classList.add('effort-compress');
      }, { passive: true });

      // Cleanup after animation
      el.addEventListener('animationend', function (e) {
        if (e.animationName === 'ppf-effort-compress') {
          el.classList.remove('effort-compress');
        }
      }, { passive: true });
    });
  }

  /* ================================================================
     SYSTEM 14 — PATH MEMORY SYSTEM
  ================================================================ */

  function updatePathMemory() {
    var threshold = 3000; // 3 seconds total hover
    var best = null;
    var bestTime = 0;

    Object.keys(pathMemory).forEach(function (k) {
      if (k === 'preferred') return;
      if (pathMemory[k] > bestTime) {
        bestTime = pathMemory[k];
        best = k;
      }
    });

    if (best && bestTime >= threshold && pathMemory.preferred !== best) {
      pathMemory.preferred = best;
      document.body.setAttribute('data-preferred-path', best);
    }
  }

  /* ================================================================
     MAIN RAF LOOP — drives per-frame updates
  ================================================================ */

  function tick() {
    updateScrollMetrics();
    tickHero();
    tickHud();
    tickEchoes();
    scrollState.rafId = raf(tick);
  }

  /* ================================================================
     EVENT BINDINGS
  ================================================================ */

  function bindEvents() {
    // Mouse tracking (passive)
    document.addEventListener('mousemove', function (e) {
      mouseState.x = e.clientX;
      mouseState.y = e.clientY;
    }, { passive: true });

    // Resize debounce
    window.addEventListener('resize', debounce(function () {
      scrollState.winH = window.innerHeight;
      scrollState.docH = Math.max(document.body.scrollHeight, 1);
    }, 200), { passive: true });
  }

  /* ================================================================
     INITIALIZATION
  ================================================================ */

  function init() {
    cacheDOM();
    initSharedObserver();
    bindEvents();

    // Initialize all systems
    initHeroCommandCenter();
    initPathLaneDetection();
    initStandardPowerChamber();
    initProofEngineTheater();
    initSessionReconstruction();
    initLeadershipGuardianReveal();
    initSectionMorphs();
    initExperienceCeremony();
    initMembershipLadder();
    initFooterClosingSequence();
    initCommandEchoes();
    initEffortCompression();

    // Start the RAF loop
    updateScrollMetrics();
    tick();
  }

  /** Refresh — re-cache DOM and re-initialize observers. */
  function refresh() {
    // Stop current loop
    if (scrollState.rafId) {
      (window.cancelAnimationFrame || clearTimeout)(scrollState.rafId);
    }

    // Clear any lingering timers
    clearCueTimers();

    // Clean up old observed entries
    observerEntries.forEach(function (el) {
      el.removeAttribute('data-wca-key');
    });
    observerEntries = [];
    observedMap = {};

    // Reset flags
    proofAnimated = false;
    experienceAnimated = false;
    footerAnimated = false;
    pillarCompleteFired = false;
    heroLabelsCreated = false;
    leaderValuesCreated = false;
    heroFloatLabels = [];
    currentHudMode = '';
    pillarViewState = { coaching: false, structure: false, environment: false, proof: false };

    // Re-initialize
    init();
  }

  /* ---------------------------------------------------------------
     BOOT
  --------------------------------------------------------------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Expose public API
  window.PPFWorldAnimations = { refresh: refresh };

})();
