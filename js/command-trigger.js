/* =====================================================
   PPF COMMAND TRIGGER SYSTEM
   State Machine · Cursor Tracking · Magnetic Pull
   Edge Runner · Click Burst · Confirmation States
   ===================================================== */

(function () {
  'use strict';

  /* ═══════════════════════════════════════════════════
     §1  UTILITIES
     ═══════════════════════════════════════════════════ */

  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ═══════════════════════════════════════════════════
     §2  CONSTANTS & CONFIGURATION
     ═══════════════════════════════════════════════════ */

  const STATES = ['is-rest', 'is-near', 'is-hover', 'is-charged', 'is-pressed', 'is-success'];

  const TIER_CONFIG = {
    1: { proximity: 120, pullMax: 3 },
    2: { proximity: 100, pullMax: 2 },
    3: { proximity: 80,  pullMax: 1 }
  };

  const TIMING = {
    chargeDelay:      800,
    pressHold:        320,
    burstDuration:    400,
    successHold:      2000,
    edgeSnapDuration: 250,
    labelRotateMs:    6000,
    idlePulseMinMs:   5000,
    idlePulseMaxMs:   8000,
    idlePulseFlash:   300,
    lerpFactor:       0.08,
    rectRefreshMs:    200
  };

  const PRE_LABEL_SETS = {
    hero:        ['NEXT STEP AVAILABLE', 'READY', 'LOCK IN', 'START HERE', 'ENTER THE SYSTEM'],
    standard:    ['SYSTEM LOADED', 'METHOD LIVE', 'PROFILE OPEN'],
    paths:       ['PATH AVAILABLE', 'SELECTION OPEN', 'READY TO MATCH'],
    proof:       ['OUTPUT VERIFIED', 'RESULTS ACTIVE', 'METRICS LIVE'],
    leadership:  ['DIRECT ACCESS', 'COACH LINE OPEN'],
    experience:  ['PERFORMANCE PATH', 'EVALUATION READY', 'SYSTEM ARMED'],
    memberships: ['COMMITMENT READY', 'PATH OPEN', 'NEXT STEP'],
    start:       ['READY TO MOVE', 'LOCK IN', 'PROCESS ARMED'],
    contact:     ['DIRECT CONTACT', 'LINE OPEN', 'ACCESS READY'],
    default:     ['READY', 'LIVE', 'ARMED']
  };

  /* ═══════════════════════════════════════════════════
     §3  GLOBAL STATE
     ═══════════════════════════════════════════════════ */

  let mouseX = 0;
  let mouseY = 0;
  let pageVisible = true;
  let rafId = null;
  let isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let isTouchDevice = window.matchMedia('(hover: none)').matches || ('ontouchstart' in window);

  /** @type {Array<CTAInstance>} */
  let instances = [];

  /* ═══════════════════════════════════════════════════
     §4  STATE MACHINE
     ═══════════════════════════════════════════════════ */

  /**
   * Set exclusive state class on a CTA root element.
   * Only ONE state class is active at any time.
   */
  function setState(el, state) {
    for (let i = 0; i < STATES.length; i++) {
      el.classList.remove(STATES[i]);
    }
    el.classList.add(state);
  }

  /**
   * Read the current state class from an element.
   */
  function getState(el) {
    for (let i = 0; i < STATES.length; i++) {
      if (el.classList.contains(STATES[i])) return STATES[i];
    }
    return 'is-rest';
  }

  /* ═══════════════════════════════════════════════════
     §5  SOUND SYSTEM (MICRO AUDIO)
     Web Audio tick for tier-1 CTAs only.
     Respects prefers-reduced-motion and can be disabled.
     ═══════════════════════════════════════════════════ */

  let audioCtx = null;
  let soundEnabled = true;

  function getAudioCtx() {
    if (!audioCtx) {
      try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      } catch (_) {
        soundEnabled = false;
      }
    }
    return audioCtx;
  }

  /**
   * Play a very short high-frequency click tick (80ms).
   * Frequency sweeps 800 → 400 Hz with fast exponential decay.
   */
  function playClickTick() {
    if (!soundEnabled || isReduced) return;
    var ctx = getAudioCtx();
    if (!ctx) return;
    // Resume context if suspended (autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    var now = ctx.currentTime;
    var osc = ctx.createOscillator();
    var gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }

  /* ═══════════════════════════════════════════════════
     §6  CTA INSTANCE FACTORY
     Each .ppf-cta gets one of these objects.
     ═══════════════════════════════════════════════════ */

  /**
   * @typedef {Object} CTAInstance
   * @property {HTMLElement}      root
   * @property {HTMLElement|null} shell
   * @property {HTMLElement|null} preLabel
   * @property {HTMLElement|null} label
   * @property {HTMLElement|null} subline
   * @property {HTMLElement|null} edgeRunner
   * @property {HTMLElement|null} burst
   * @property {HTMLElement|null} action
   * @property {number}           tier
   * @property {string}           section
   * @property {DOMRect|null}     rect
   * @property {number}           chargeTimer
   * @property {number}           successTimer
   * @property {number}           labelRotateTimer
   * @property {number}           idlePulseTimer
   * @property {number}           labelIdx
   * @property {number}           currentPullX
   * @property {number}           currentPullY
   * @property {boolean}          isHovering
   * @property {boolean}          inViewport
   * @property {string}           origLabelText
   * @property {string}           origSublineText
   * @property {string}           origPreLabelText
   * @property {boolean}          isFormSubmit
   * @property {boolean}          viewportSwept
   */

  function createInstance(root) {
    var tier    = parseInt(root.getAttribute('data-cta-tier'), 10) || 1;
    var section = root.getAttribute('data-section') || 'default';
    var shell   = qs('.cta-shell', root);
    var preLabel   = qs('.cta-pre-label', root);
    var label      = qs('.cta-label', root);
    var subline    = qs('.cta-subline', root);
    var edgeRunner = qs('.cta-edge-runner', root);
    var burst      = qs('.cta-burst', root);
    var action     = qs('.cta-action', root);
    var isFormSubmit = action ? action.tagName === 'BUTTON' && action.type === 'submit' : false;

    return {
      root: root,
      shell: shell,
      preLabel: preLabel,
      label: label,
      subline: subline,
      edgeRunner: edgeRunner,
      burst: burst,
      action: action,
      tier: tier,
      section: section,
      rect: null,
      chargeTimer: 0,
      successTimer: 0,
      labelRotateTimer: 0,
      idlePulseTimer: 0,
      labelIdx: 0,
      currentPullX: 0,
      currentPullY: 0,
      isHovering: false,
      inViewport: false,
      origLabelText: label ? label.textContent : '',
      origSublineText: subline ? subline.textContent : '',
      origPreLabelText: preLabel ? preLabel.textContent : '',
      isFormSubmit: isFormSubmit,
      viewportSwept: false
    };
  }

  /* ═══════════════════════════════════════════════════
     §7  BOUNDING RECT CACHE
     Refreshed on scroll/resize (debounced).
     ═══════════════════════════════════════════════════ */

  function refreshRects() {
    for (var i = 0; i < instances.length; i++) {
      instances[i].rect = instances[i].root.getBoundingClientRect();
    }
  }

  var rectRefreshTimer = 0;
  function scheduleRectRefresh() {
    clearTimeout(rectRefreshTimer);
    rectRefreshTimer = setTimeout(refreshRects, TIMING.rectRefreshMs);
  }

  /* ═══════════════════════════════════════════════════
     §8  PRE-LABEL INTELLIGENCE
     Rotating rest labels + state-aware text swaps.
     ═══════════════════════════════════════════════════ */

  function getPreLabels(section) {
    return PRE_LABEL_SETS[section] || PRE_LABEL_SETS['default'];
  }

  function setPreLabelText(inst, text) {
    if (inst.preLabel) inst.preLabel.textContent = text;
  }

  /**
   * Advance the rest-label rotation by one step.
   */
  function rotateRestLabel(inst) {
    var state = getState(inst.root);
    if (state !== 'is-rest') return;
    var labels = getPreLabels(inst.section);
    inst.labelIdx = (inst.labelIdx + 1) % labels.length;
    setPreLabelText(inst, labels[inst.labelIdx]);
  }

  function startLabelRotation(inst) {
    stopLabelRotation(inst);
    inst.labelRotateTimer = setInterval(function () {
      rotateRestLabel(inst);
    }, TIMING.labelRotateMs);
  }

  function stopLabelRotation(inst) {
    if (inst.labelRotateTimer) {
      clearInterval(inst.labelRotateTimer);
      inst.labelRotateTimer = 0;
    }
  }

  /**
   * Update pre-label, label and subline text based on current state.
   */
  function updateTextsForState(inst, state) {
    switch (state) {
      case 'is-rest':
        // Restore originals, then let rotation handle rest text
        if (inst.label) inst.label.textContent = inst.origLabelText;
        if (inst.subline) inst.subline.textContent = inst.origSublineText;
        var labels = getPreLabels(inst.section);
        setPreLabelText(inst, labels[inst.labelIdx % labels.length]);
        startLabelRotation(inst);
        break;

      case 'is-near':
        stopLabelRotation(inst);
        if (inst.preLabel) {
          var activeText = inst.preLabel.getAttribute('data-active-text');
          if (activeText) setPreLabelText(inst, activeText);
        }
        break;

      case 'is-hover':
        // Keep active text set during near
        break;

      case 'is-charged':
        setPreLabelText(inst, 'GO');
        break;

      case 'is-success':
        stopLabelRotation(inst);
        if (inst.label) {
          var confirmText = inst.label.getAttribute('data-confirm-text');
          if (confirmText) inst.label.textContent = confirmText;
        }
        setPreLabelText(inst, 'CONFIRMED');
        if (inst.subline) inst.subline.textContent = 'Processing…';
        break;

      default:
        break;
    }
  }

  /* ═══════════════════════════════════════════════════
     §9  MAGNETIC DIRECTIONAL PULL
     Smooth lerp translation + glow positioning.
     ═══════════════════════════════════════════════════ */

  /**
   * Compute pull offsets and glow coords for one CTA.
   * Mutates inst.currentPullX / Y. Returns {near: boolean}.
   */
  function computePull(inst) {
    if (!inst.rect) return { near: false };

    var cfg = TIER_CONFIG[inst.tier] || TIER_CONFIG[1];
    var cx = inst.rect.left + inst.rect.width * 0.5;
    var cy = inst.rect.top  + inst.rect.height * 0.5;
    var dx = mouseX - cx;
    var dy = mouseY - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var near = dist < cfg.proximity;

    if (near && !isTouchDevice && !isReduced) {
      // Direction vector, normalised
      var ndx = dist > 0 ? dx / dist : 0;
      var ndy = dist > 0 ? dy / dist : 0;

      // Strength falls off linearly within proximity
      var strength = 1 - clamp(dist / cfg.proximity, 0, 1);
      var targetX = ndx * strength * cfg.pullMax;
      var targetY = ndy * strength * cfg.pullMax;

      inst.currentPullX = lerp(inst.currentPullX, targetX, TIMING.lerpFactor);
      inst.currentPullY = lerp(inst.currentPullY, targetY, TIMING.lerpFactor);

      // Glow position (0-100% within the element)
      var glowX = clamp(((mouseX - inst.rect.left) / inst.rect.width) * 100, 0, 100);
      var glowY = clamp(((mouseY - inst.rect.top)  / inst.rect.height) * 100, 0, 100);

      inst.root.style.setProperty('--pull-x', inst.currentPullX.toFixed(2) + 'px');
      inst.root.style.setProperty('--pull-y', inst.currentPullY.toFixed(2) + 'px');
      inst.root.style.setProperty('--glow-x', glowX.toFixed(1) + '%');
      inst.root.style.setProperty('--glow-y', glowY.toFixed(1) + '%');
    } else {
      // Return to zero smoothly
      inst.currentPullX = lerp(inst.currentPullX, 0, TIMING.lerpFactor);
      inst.currentPullY = lerp(inst.currentPullY, 0, TIMING.lerpFactor);

      // Only update DOM if values are still meaningful
      if (Math.abs(inst.currentPullX) > 0.01 || Math.abs(inst.currentPullY) > 0.01) {
        inst.root.style.setProperty('--pull-x', inst.currentPullX.toFixed(2) + 'px');
        inst.root.style.setProperty('--pull-y', inst.currentPullY.toFixed(2) + 'px');
      } else {
        inst.currentPullX = 0;
        inst.currentPullY = 0;
        inst.root.style.setProperty('--pull-x', '0px');
        inst.root.style.setProperty('--pull-y', '0px');
      }
    }

    return { near: near };
  }

  /* ═══════════════════════════════════════════════════
     §10  EDGE RUNNER CONTROL
     ═══════════════════════════════════════════════════ */

  /**
   * Trigger the snap variant of the edge runner (250ms single loop).
   */
  function edgeRunnerSnap(inst) {
    if (!inst.edgeRunner) return;
    inst.edgeRunner.classList.remove('edge-run-snap');
    // Force reflow so re-adding the class triggers a new animation
    void inst.edgeRunner.offsetWidth;
    inst.edgeRunner.classList.add('edge-run-snap');
    setTimeout(function () {
      inst.edgeRunner.classList.remove('edge-run-snap');
    }, TIMING.edgeSnapDuration);
  }

  /**
   * Mobile: one-time sweep when CTA enters viewport.
   */
  function edgeRunnerViewportSweep(inst) {
    if (inst.viewportSwept) return;
    inst.viewportSwept = true;
    if (!inst.edgeRunner) return;
    inst.edgeRunner.classList.add('edge-run-sweep');
    setTimeout(function () {
      inst.edgeRunner.classList.remove('edge-run-sweep');
    }, 600);
  }

  /**
   * Idle pulse: brief flash on the edge runner (300ms).
   */
  function edgeRunnerIdlePulse(inst) {
    var state = getState(inst.root);
    if (state !== 'is-rest' || !inst.edgeRunner) return;
    inst.edgeRunner.classList.add('edge-run-pulse');
    setTimeout(function () {
      inst.edgeRunner.classList.remove('edge-run-pulse');
    }, TIMING.idlePulseFlash);
  }

  function scheduleIdlePulse(inst) {
    clearTimeout(inst.idlePulseTimer);
    var delay = TIMING.idlePulseMinMs + Math.random() * (TIMING.idlePulseMaxMs - TIMING.idlePulseMinMs);
    inst.idlePulseTimer = setTimeout(function () {
      edgeRunnerIdlePulse(inst);
      // Reschedule
      if (getState(inst.root) === 'is-rest') {
        scheduleIdlePulse(inst);
      }
    }, delay);
  }

  /* ═══════════════════════════════════════════════════
     §11  CLICK / PRESS HANDLING
     ═══════════════════════════════════════════════════ */

  /**
   * Set burst origin CSS properties from a pointer event.
   */
  function setBurstOrigin(inst, clientX, clientY) {
    if (!inst.burst || !inst.rect) return;
    var bx = clamp(clientX - inst.rect.left, 0, inst.rect.width);
    var by = clamp(clientY - inst.rect.top, 0, inst.rect.height);
    inst.burst.style.setProperty('--burst-x', bx + 'px');
    inst.burst.style.setProperty('--burst-y', by + 'px');
  }

  function triggerBurst(inst) {
    if (!inst.burst) return;
    inst.burst.classList.remove('burst-active');
    void inst.burst.offsetWidth;
    inst.burst.classList.add('burst-active');
    setTimeout(function () {
      inst.burst.classList.remove('burst-active');
    }, TIMING.burstDuration);
  }

  /**
   * Transition into confirmation / success state.
   */
  function enterSuccess(inst) {
    setState(inst.root, 'is-success');
    updateTextsForState(inst, 'is-success');
    edgeRunnerSnap(inst);

    // For form submits, stay in success permanently
    if (inst.isFormSubmit) return;

    clearTimeout(inst.successTimer);
    inst.successTimer = setTimeout(function () {
      setState(inst.root, 'is-rest');
      updateTextsForState(inst, 'is-rest');
      scheduleIdlePulse(inst);
    }, TIMING.successHold);
  }

  function handlePressStart(inst, e) {
    var clientX, clientY;
    if (e.touches && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    setState(inst.root, 'is-pressed');
    clearTimeout(inst.chargeTimer);

    // Burst
    refreshSingleRect(inst);
    setBurstOrigin(inst, clientX, clientY);
    triggerBurst(inst);

    // will-change for press
    if (inst.shell) inst.shell.style.willChange = 'transform, box-shadow';

    // Sound for tier 1
    if (inst.tier === 1) playClickTick();

    // Form submit interception
    if (inst.isFormSubmit) {
      e.preventDefault();
      var form = inst.action.closest('form');
      if (form && !form.checkValidity()) {
        form.reportValidity();
        setState(inst.root, 'is-rest');
        updateTextsForState(inst, 'is-rest');
        return;
      }
    }

    // After press animation, enter success if applicable
    var hasConfirm = inst.label && inst.label.getAttribute('data-confirm-text');
    setTimeout(function () {
      if (hasConfirm) {
        enterSuccess(inst);
      } else {
        // Return to rest after brief press state
        setState(inst.root, 'is-rest');
        updateTextsForState(inst, 'is-rest');
      }
    }, TIMING.burstDuration);
  }

  function handlePressEnd(inst) {
    // Clean up will-change
    if (inst.shell) inst.shell.style.willChange = '';
  }

  /* ═══════════════════════════════════════════════════
     §12  HOVER / CHARGE LIFECYCLE
     ═══════════════════════════════════════════════════ */

  function handleMouseEnter(inst) {
    inst.isHovering = true;
    clearTimeout(inst.chargeTimer);
    clearTimeout(inst.idlePulseTimer);

    var state = getState(inst.root);
    if (state === 'is-pressed' || state === 'is-success') return;

    setState(inst.root, 'is-hover');
    updateTextsForState(inst, 'is-hover');

    // will-change hint
    if (inst.shell) inst.shell.style.willChange = 'transform, box-shadow';

    // Charge after delay
    inst.chargeTimer = setTimeout(function () {
      if (inst.isHovering && getState(inst.root) === 'is-hover') {
        setState(inst.root, 'is-charged');
        updateTextsForState(inst, 'is-charged');
      }
    }, TIMING.chargeDelay);
  }

  function handleMouseLeave(inst) {
    inst.isHovering = false;
    clearTimeout(inst.chargeTimer);
    inst.chargeTimer = 0;

    var state = getState(inst.root);
    if (state === 'is-pressed' || state === 'is-success') return;

    setState(inst.root, 'is-rest');
    updateTextsForState(inst, 'is-rest');

    // Remove will-change after transition
    setTimeout(function () {
      if (!inst.isHovering && inst.shell) {
        inst.shell.style.willChange = '';
      }
    }, 400);

    scheduleIdlePulse(inst);
  }

  /* ═══════════════════════════════════════════════════
     §13  EVENT BINDING
     Attach listeners per instance. Passive where possible.
     ═══════════════════════════════════════════════════ */

  function refreshSingleRect(inst) {
    inst.rect = inst.root.getBoundingClientRect();
  }

  function bindEvents(inst) {
    var target = inst.shell || inst.root;

    // Mouse enter/leave
    target.addEventListener('mouseenter', function () {
      handleMouseEnter(inst);
    });
    target.addEventListener('mouseleave', function () {
      handleMouseLeave(inst);
    });

    // Press (mouse)
    target.addEventListener('mousedown', function (e) {
      handlePressStart(inst, e);
    });
    target.addEventListener('mouseup', function () {
      handlePressEnd(inst);
    });

    // Press (touch)
    target.addEventListener('touchstart', function (e) {
      handlePressStart(inst, e);
    }, { passive: false });
    target.addEventListener('touchend', function () {
      handlePressEnd(inst);
      // On touch, if there's a confirm text, success was already handled in pressStart timeout.
      // Otherwise mimic hover-leave reset.
      var state = getState(inst.root);
      if (state !== 'is-success' && state !== 'is-pressed') {
        setState(inst.root, 'is-rest');
        updateTextsForState(inst, 'is-rest');
      }
    }, { passive: true });
  }

  /* ═══════════════════════════════════════════════════
     §14  PROXIMITY RAF LOOP
     Single requestAnimationFrame loop for all CTAs.
     ═══════════════════════════════════════════════════ */

  function proximityTick() {
    if (!pageVisible) {
      rafId = requestAnimationFrame(proximityTick);
      return;
    }

    for (var i = 0; i < instances.length; i++) {
      var inst = instances[i];

      // Skip proximity logic on touch devices or reduced motion
      if (isTouchDevice || isReduced) continue;

      var result = computePull(inst);
      var state  = getState(inst.root);

      // Don't override pressed / success / hover / charged from proximity
      if (state === 'is-pressed' || state === 'is-success') continue;

      if (result.near && !inst.isHovering) {
        if (state !== 'is-near') {
          setState(inst.root, 'is-near');
          updateTextsForState(inst, 'is-near');
        }
      } else if (!result.near && !inst.isHovering) {
        if (state === 'is-near') {
          setState(inst.root, 'is-rest');
          updateTextsForState(inst, 'is-rest');
        }
      }

      // Even when not near, keep lerping pull back to zero
      if (!result.near) {
        computePull(inst);
      }
    }

    rafId = requestAnimationFrame(proximityTick);
  }

  /* ═══════════════════════════════════════════════════
     §15  MOBILE ADAPTATION
     IntersectionObserver for viewport detection,
     idle pulse scheduling, touch mapping.
     ═══════════════════════════════════════════════════ */

  var viewportObserver = null;

  function setupViewportObserver() {
    if (!('IntersectionObserver' in window)) return;

    viewportObserver = new IntersectionObserver(function (entries) {
      for (var i = 0; i < entries.length; i++) {
        var entry = entries[i];
        var inst = findInstanceByRoot(entry.target);
        if (!inst) continue;

        if (entry.isIntersecting) {
          inst.inViewport = true;
          inst.root.classList.add('is-viewport');

          // One-time sweep on mobile
          if (isTouchDevice) {
            edgeRunnerViewportSweep(inst);
          }
        } else {
          inst.inViewport = false;
          inst.root.classList.remove('is-viewport');
        }
      }
    }, { threshold: 0.5 });
  }

  function findInstanceByRoot(el) {
    for (var i = 0; i < instances.length; i++) {
      if (instances[i].root === el) return instances[i];
    }
    return null;
  }

  /* ═══════════════════════════════════════════════════
     §16  GLOBAL EVENT LISTENERS
     Mouse tracking, visibility, scroll, resize.
     ═══════════════════════════════════════════════════ */

  function setupGlobalListeners() {
    // Mouse tracking (throttled to RAF via proximity loop)
    document.addEventListener('mousemove', function (e) {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Page visibility
    document.addEventListener('visibilitychange', function () {
      pageVisible = !document.hidden;
    });

    // Rect refresh on scroll/resize
    window.addEventListener('scroll', scheduleRectRefresh, { passive: true });
    window.addEventListener('resize', scheduleRectRefresh, { passive: true });

    // Reduced motion listener (can change at runtime)
    var motionMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionMQ.addEventListener) {
      motionMQ.addEventListener('change', function (e) {
        isReduced = e.matches;
      });
    } else if (motionMQ.addListener) {
      motionMQ.addListener(function () {
        isReduced = motionMQ.matches;
      });
    }
  }

  /* ═══════════════════════════════════════════════════
     §17  INSTANCE SETUP
     Wire up one CTA: state, events, observers, timers.
     ═══════════════════════════════════════════════════ */

  function setupInstance(inst) {
    // Initial state
    setState(inst.root, 'is-rest');
    refreshSingleRect(inst);

    // Events
    bindEvents(inst);

    // Viewport observer
    if (viewportObserver) {
      viewportObserver.observe(inst.root);
    }

    // Label rotation
    startLabelRotation(inst);

    // Idle pulse
    scheduleIdlePulse(inst);
  }

  /* ═══════════════════════════════════════════════════
     §18  INITIALISATION & PUBLIC API
     ═══════════════════════════════════════════════════ */

  /**
   * Scan DOM for .ppf-cta elements and initialise any new ones.
   */
  function scan() {
    var elements = qsa('.ppf-cta');

    for (var i = 0; i < elements.length; i++) {
      var el = elements[i];
      // Skip already-initialised
      if (el.hasAttribute('data-ct-init')) continue;
      el.setAttribute('data-ct-init', '1');

      var inst = createInstance(el);
      instances.push(inst);
      setupInstance(inst);
    }

    // Initial rect cache after scan
    refreshRects();
  }

  function init() {
    setupGlobalListeners();
    setupViewportObserver();
    scan();

    // Start the single proximity RAF loop
    rafId = requestAnimationFrame(proximityTick);
  }

  // Boot on DOMContentLoaded (or immediately if already loaded)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  /* ── Public API ──────────────────────────────────── */
  window.PPFCommandTrigger = {
    /**
     * Re-scan the DOM for newly added .ppf-cta elements.
     * Call after dynamic content insertion.
     */
    refresh: scan,

    /**
     * Enable or disable the click sound system.
     */
    setSound: function (enabled) {
      soundEnabled = !!enabled;
    }
  };

})();
