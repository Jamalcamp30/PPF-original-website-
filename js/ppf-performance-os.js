/* ============================================================
   PPF PERFORMANCE OPERATING SYSTEM — JavaScript Layer
   A living ambient system overlay that enhances the PPF
   Athletics website with subtle performance-inspired UI.
   All dynamic elements are created here; nothing is assumed
   to exist in the static HTML except documented selectors.
   ============================================================ */

(function () {
  'use strict';

  // ------------------------------------------------------------------
  // Shared references & utilities
  // ------------------------------------------------------------------

  var doc  = document;
  var body = doc.body;
  var win  = window;

  var qs  = function (sel, ctx) { return (ctx || doc).querySelector(sel); };
  var qsa = function (sel, ctx) { return (ctx || doc).querySelectorAll(sel); };

  var isDesktop = function () { return win.innerWidth > 900; };

  var prefersReducedMotion = win.matchMedia &&
    win.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var isTouchDevice = 'ontouchstart' in win || navigator.maxTouchPoints > 0;

  // Throttle helper — limits fn to once per `ms`
  function throttle(fn, ms) {
    var last = 0;
    var timer = null;
    return function () {
      var self = this;
      var args = arguments;
      var now = Date.now();
      if (now - last >= ms) {
        last = now;
        fn.apply(self, args);
      } else if (!timer) {
        timer = setTimeout(function () {
          last = Date.now();
          timer = null;
          fn.apply(self, args);
        }, ms - (now - last));
      }
    };
  }

  // Ensure an element has position:relative for absolute children
  function ensureRelative(element) {
    if (element && !element.style.position) element.style.position = 'relative';
  }

  // Simple element builder
  function el(tag, cls, text) {
    var e = doc.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  // Section visibility map — kept up-to-date by a shared observer
  var activeSections = {};
  var sectionIds = [
    'hero', 'standard', 'paths', 'oneRoom', 'proof',
    'carryover', 'trust', 'room', 'leadership',
    'experience', 'memberships', 'start', 'social', 'footer'
  ];

  // Mouse position (updated by a shared listener)
  var mouse = { x: win.innerWidth / 2, y: win.innerHeight / 2 };

  if (!isTouchDevice) {
    doc.addEventListener('mousemove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });
  }

  // ------------------------------------------------------------------
  // Bail entirely for reduced-motion users
  // ------------------------------------------------------------------
  if (prefersReducedMotion) return;

  // ------------------------------------------------------------------
  // Shared IntersectionObserver — populates activeSections map
  // ------------------------------------------------------------------

  var sectionObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      activeSections[entry.target.id] = entry.isIntersecting;
    });
  }, { threshold: 0.15 });

  sectionIds.forEach(function (id) {
    var section = qs('#' + id);
    if (section) sectionObserver.observe(section);
  });

  // Determine which section is currently most visible
  function currentSection() {
    for (var i = 0; i < sectionIds.length; i++) {
      if (activeSections[sectionIds[i]]) return sectionIds[i];
    }
    return 'hero';
  }

  // ------------------------------------------------------------------
  // 1. READINESS PULSE GRID
  // ------------------------------------------------------------------

  (function initPulseGrid() {
    if (!isDesktop()) return;

    var canvas = doc.createElement('canvas');
    canvas.className = 'pos-pulse-grid';
    canvas.id = 'posPulseGrid';
    body.insertBefore(canvas, body.firstChild);

    var ctx = canvas.getContext('2d');
    var dpr = Math.min(win.devicePixelRatio || 1, 2);
    var SPACING = 60;
    var BASE_RADIUS = 1.5;
    var BASE_ALPHA = 0.08;
    var scrollY = 0;

    function resize() {
      canvas.width = win.innerWidth * dpr;
      canvas.height = win.innerHeight * dpr;
      canvas.style.width = win.innerWidth + 'px';
      canvas.style.height = win.innerHeight + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    win.addEventListener('resize', throttle(resize, 200));

    win.addEventListener('scroll', function () { scrollY = win.scrollY; }, { passive: true });

    function draw() {
      requestAnimationFrame(draw);

      var w = win.innerWidth;
      var h = win.innerHeight;
      ctx.clearRect(0, 0, w, h);

      var sect = currentSection();
      var pulseMod = 1;       // intensity multiplier
      var focusCenter = false; // draw toward center
      var fadeIn = 1;

      if (sect === 'hero') {
        // Slow wake-up based on scroll proximity
        fadeIn = Math.min(1, scrollY / 400);
        pulseMod = 0.6;
      } else if (sect === 'proof') {
        pulseMod = 1.8;
      } else if (sect === 'leadership') {
        pulseMod = 0.5;
      } else if (sect === 'start') {
        focusCenter = true;
      }

      var time = Date.now() * 0.001;
      var cols = Math.ceil(w / SPACING) + 1;
      var rows = Math.ceil(h / SPACING) + 1;
      var cx = w / 2;
      var cy = h / 2;

      for (var r = 0; r < rows; r++) {
        for (var c = 0; c < cols; c++) {
          var x = c * SPACING;
          var y = r * SPACING;

          // Distance to mouse (viewport coords)
          var dx = x - mouse.x;
          var dy = y - mouse.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          var proximity = Math.max(0, 1 - dist / 400);

          // Base pulse driven by scroll + time
          var pulse = Math.sin(time * 1.2 * pulseMod + c * 0.3 + r * 0.3) * 0.3 + 0.7;

          var alpha = BASE_ALPHA * pulse * fadeIn + proximity * 0.06;
          alpha = Math.min(alpha, 0.25);

          // Focus toward center for Start section
          if (focusCenter) {
            var dcx = x - cx;
            var dcy = y - cy;
            var centerDist = Math.sqrt(dcx * dcx + dcy * dcy);
            var centerFade = Math.max(0, 1 - centerDist / (Math.min(w, h) * 0.6));
            alpha *= 0.3 + centerFade * 0.7;
          }

          var radius = BASE_RADIUS + proximity * 0.8;

          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,85,0,' + alpha.toFixed(3) + ')';
          ctx.fill();
        }
      }
    }
    draw();
  })();

  // ------------------------------------------------------------------
  // 2. "THE STANDARD NEVER SLEEPS" LIVE LABEL
  // ------------------------------------------------------------------

  (function initLiveLabel() {
    if (!isDesktop()) return;

    var labels = [
      'THE STANDARD IS LIVE',
      'COACHING ACTIVE',
      'ROOM READY'
    ];
    var idx = 0;

    var label = el('div', 'pos-live-label');
    var span = el('span', '', labels[0]);
    label.appendChild(span);
    label.style.opacity = '0';
    body.appendChild(label);

    // Show after 3 seconds
    setTimeout(function () {
      label.style.opacity = '';
    }, 3000);

    // Cycle text every 12 seconds
    setInterval(function () {
      idx = (idx + 1) % labels.length;
      span.textContent = labels[idx];
    }, 12000);
  })();

  // ------------------------------------------------------------------
  // 3. PERFORMANCE WEATHER / ATMOSPHERIC MOOD LAYER
  // ------------------------------------------------------------------

  (function initWeather() {
    var weather = el('div', 'pos-weather');
    var grid = qs('#posPulseGrid') || body.firstChild;
    body.insertBefore(weather, grid ? grid.nextSibling : body.firstChild);

    var moods = {
      hero:       { pressure: 0.3, intensity: 0.5, warmth: 0.4 },
      standard:   { pressure: 0.5, intensity: 0.6, warmth: 0.5 },
      paths:      { pressure: 0.4, intensity: 0.7, warmth: 0.6 },
      proof:      { pressure: 0.7, intensity: 0.9, warmth: 0.5 },
      leadership: { pressure: 0.3, intensity: 0.3, warmth: 0.4 },
      start:      { pressure: 0.6, intensity: 0.8, warmth: 0.7 }
    };

    // Current animated values
    var cur = { pressure: 0.3, intensity: 0.5, warmth: 0.4 };

    function lerp(a, b, t) { return a + (b - a) * t; }

    function tick() {
      requestAnimationFrame(tick);
      var sect = currentSection();
      var target = moods[sect] || moods.hero;
      cur.pressure  = lerp(cur.pressure,  target.pressure,  0.02);
      cur.intensity = lerp(cur.intensity, target.intensity, 0.02);
      cur.warmth    = lerp(cur.warmth,    target.warmth,    0.02);

      // Scale intensity for the CSS radial gradient (keep subtle)
      var cssIntensity = (cur.intensity * 0.06).toFixed(3);
      weather.style.setProperty('--pos-pressure',  cur.pressure.toFixed(3));
      weather.style.setProperty('--pos-intensity',  cssIntensity);
      weather.style.setProperty('--pos-warmth',     cur.warmth.toFixed(3));
    }
    tick();
  })();

  // ------------------------------------------------------------------
  // 4. FORCE PLATE HOVER PHYSICS
  // ------------------------------------------------------------------

  (function initForcePlate() {
    if (isTouchDevice) return;

    var CARD_SEL = '.story-card, .membership-card, .pillar-card, .leader-card, .path-card';
    var MAX_DEG = 3;
    var readouts = ['LOAD: 92N', 'FORCE: ACTIVE', 'PRESSURE: 87N', 'LOAD: 104N'];

    function getCard(target) {
      return target.closest(CARD_SEL);
    }

    doc.addEventListener('mousemove', function (e) {
      var card = getCard(e.target);
      if (!card || !card.classList.contains('pos-force-loaded')) return;
      var rect = card.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) / (rect.width / 2);
      var dy = (e.clientY - cy) / (rect.height / 2);
      var rotX = -dy * MAX_DEG;
      var rotY = dx * MAX_DEG;
      card.style.transform =
        'perspective(800px) rotateX(' + rotX.toFixed(2) + 'deg) rotateY(' + rotY.toFixed(2) + 'deg)';
    }, { passive: true });

    doc.addEventListener('mouseenter', function (e) {
      var card = getCard(e.target);
      if (!card || card.classList.contains('pos-force-loaded')) return;
      card.classList.add('pos-force-loaded');

      var readout = el('div', 'pos-force-readout',
        readouts[Math.floor(Math.random() * readouts.length)]);
      ensureRelative(card);
      card.appendChild(readout);
    }, true); // use capture for delegation

    doc.addEventListener('mouseleave', function (e) {
      var card = getCard(e.target);
      if (!card) return;
      card.classList.remove('pos-force-loaded');
      card.style.transform = '';
      var ro = qs('.pos-force-readout', card);
      if (ro) ro.remove();
    }, true);
  })();

  // ------------------------------------------------------------------
  // 5. SESSION RESIDUE
  // ------------------------------------------------------------------

  (function initResidue() {
    var keySections = ['standard', 'paths', 'proof', 'room', 'leadership'];
    var seen = {};

    var residueObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (entry.isIntersecting) {
          seen[id] = true;
        } else if (seen[id]) {
          entry.target.classList.add('pos-residue');
          if (keySections.indexOf(id) !== -1) spawnParticles(entry.target);
        }
      });
    }, { threshold: 0.05 });

    sectionIds.forEach(function (id) {
      var section = qs('#' + id);
      if (section) residueObs.observe(section);
    });

    function spawnParticles(section) {
      var count = 3 + Math.floor(Math.random() * 3); // 3-5
      for (var i = 0; i < count; i++) {
        var p = el('div', 'pos-residue-particle');
        p.style.left = (10 + Math.random() * 80) + '%';
        p.style.bottom = '0';
        ensureRelative(section);
        section.appendChild(p);
        // Self-remove after 3s
        (function (particle) {
          setTimeout(function () {
            if (particle.parentNode) particle.parentNode.removeChild(particle);
          }, 3000);
        })(p);
      }
    }
  })();

  // ------------------------------------------------------------------
  // 6. STANDARD IGNITION SEQUENCE
  // ------------------------------------------------------------------

  (function initIgnition() {
    var fired = false;

    var ignitionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          ignitionObs.disconnect();
          runIgnition();
        }
      });
    }, { threshold: 0.25 });

    var standardEl = qs('#standard');
    if (standardEl) ignitionObs.observe(standardEl);

    function runIgnition() {
      var overlay = el('div', 'pos-ignition-overlay');
      body.appendChild(overlay);

      setTimeout(function () {
        var status = el('div', 'pos-ignition-status',
          'STANDARD CONFIRMED · COACHING ACTIVE · SYSTEM ENGAGED');
        body.appendChild(status);
        body.classList.add('pos-ignition-active');

        setTimeout(function () {
          body.classList.remove('pos-ignition-active');
        }, 500);

        setTimeout(function () {
          if (overlay.parentNode) overlay.remove();
          if (status.parentNode) status.remove();
        }, 2000);
      }, 200);
    }
  })();

  // ------------------------------------------------------------------
  // 7. PATH DNA SIGNATURES
  // ------------------------------------------------------------------

  (function initPathDNA() {
    // Hover on path cards
    var pathCards = qsa('.path-card[data-path]');
    pathCards.forEach(function (card) {
      var path = card.getAttribute('data-path');
      card.addEventListener('mouseenter', function () {
        card.classList.add('pos-dna-' + path, 'pos-dna-active');
      });
      card.addEventListener('mouseleave', function () {
        card.classList.remove('pos-dna-' + path, 'pos-dna-active');
      });
    });

    // One Room selector
    var dnaClasses = ['pos-dna-athlete', 'pos-dna-adult', 'pos-dna-integrated'];
    doc.addEventListener('click', function (e) {
      var btn = e.target.closest('.one-room-btn');
      if (!btn) return;
      var room = btn.getAttribute('data-room');
      var floor = qs('.one-room-floor');
      if (!floor) return;
      dnaClasses.forEach(function (cls) { floor.classList.remove(cls); });
      if (room) floor.classList.add('pos-dna-' + room);
    });
  })();

  // ------------------------------------------------------------------
  // 8. PROOF REPLAY MODE
  // ------------------------------------------------------------------

  (function initProofReplay() {
    var replayObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var card = entry.target;
        if (card.getAttribute('data-pos-replayed')) return;
        card.setAttribute('data-pos-replayed', '1');
        runReplay(card);
      });
    }, { threshold: 0.3 });

    qsa('.story-card').forEach(function (card) {
      replayObs.observe(card);
    });

    function runReplay(card) {
      card.classList.add('pos-replay-active');

      // Find outcome badge and parse before/after
      var badge = qs('.outcome-badge', card);
      if (badge) {
        var original = badge.textContent.trim();
        var parts = original.split(/\s*→\s*/);
        if (parts.length === 2) {
          badge.textContent = parts[0];
          setTimeout(function () {
            badge.textContent = original;
          }, 500);
        }
      }

      // Stagger-reveal timeline steps
      var steps = qsa('.st-step', card);
      steps.forEach(function (step, i) {
        step.style.setProperty('--pos-step-i', i);
        setTimeout(function () {
          step.classList.add('pos-step-visible');
        }, 800 + i * 350);
      });

      // Append verified stamp after all steps
      var delay = 800 + steps.length * 350 + 200;
      setTimeout(function () {
        var stamp = el('div', 'pos-verified-stamp', '✓ VERIFIED BY COACH');
        var timeline = qs('.story-timeline', card);
        if (timeline) {
          timeline.parentNode.insertBefore(stamp, timeline.nextSibling);
        } else {
          card.appendChild(stamp);
        }
      }, delay);
    }
  })();

  // ------------------------------------------------------------------
  // 9. ASSESSMENT PASSPORT
  // ------------------------------------------------------------------

  (function initPassport() {
    var form = qs('#startForm');
    if (!form) return;

    var stepNames   = ['PATH', 'IDENTITY', 'CONTACT', 'CONFIRM'];
    var statusTexts = ['PATH IDENTIFIED', 'PROFILE SET', 'CONTACT LINKED', 'READY TO SUBMIT'];
    var stepFields  = [
      ['path'],
      ['firstName', 'lastName'],
      ['email', 'phone'],
      [] // confirm — no fields, review only
    ];
    var currentStep = 0;

    // Gather form groups by field name
    var fieldGroups = {};
    qsa('.form-group', form).forEach(function (g) {
      var input = qs('input, select', g);
      if (input) fieldGroups[input.name] = g;
    });

    // Build step indicator
    var stepsBar = el('div', 'pos-passport-steps');
    stepNames.forEach(function (name, i) {
      if (i > 0) {
        var line = el('div', 'pos-passport-line');
        line.setAttribute('data-line', i - 1);
        stepsBar.appendChild(line);
      }
      var dot = el('div', 'pos-passport-step');
      dot.setAttribute('data-step', i);
      dot.textContent = i + 1;
      stepsBar.appendChild(dot);
    });

    // Insert above the form header
    var header = qs('.form-header', form);
    if (header) {
      form.insertBefore(stepsBar, header);
    } else {
      form.insertBefore(stepsBar, form.firstChild);
    }

    // Build navigation buttons
    var nav = el('div', 'pos-passport-nav');
    nav.style.cssText = 'display:flex;gap:12px;margin-top:16px;';

    var backBtn = el('button', 'pos-passport-btn', '← BACK');
    backBtn.type = 'button';
    backBtn.style.cssText =
      'background:transparent;border:1px solid rgba(255,255,255,0.15);color:rgba(255,255,255,0.6);' +
      'padding:8px 18px;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;' +
      'font-family:inherit;border-radius:3px;';

    var nextBtn = el('button', 'pos-passport-btn', 'NEXT →');
    nextBtn.type = 'button';
    nextBtn.style.cssText =
      'background:rgba(255,85,0,0.9);border:1px solid rgba(255,85,0,0.6);color:#fff;' +
      'padding:8px 18px;font-size:10px;letter-spacing:2px;text-transform:uppercase;cursor:pointer;' +
      'font-family:inherit;border-radius:3px;';

    nav.appendChild(backBtn);
    nav.appendChild(nextBtn);

    // Status chip
    var statusChip = el('div', 'pos-passport-status pos-passport-status--pending');
    nav.appendChild(statusChip);

    // Build confirm panel
    var confirmPanel = el('div', 'pos-passport-confirm');
    confirmPanel.style.cssText =
      'padding:16px;border:1px solid rgba(255,255,255,0.08);border-radius:6px;' +
      'background:rgba(255,255,255,0.02);margin-bottom:12px;display:none;';

    // Insert nav and confirm panel before the CTA button
    var ctaWrap = qs('.ppf-cta', form);
    if (ctaWrap) {
      form.insertBefore(confirmPanel, ctaWrap);
      form.insertBefore(nav, ctaWrap);
    } else {
      form.appendChild(confirmPanel);
      form.appendChild(nav);
    }

    function renderStep() {
      // Show/hide form groups
      Object.keys(fieldGroups).forEach(function (name) {
        var visible = stepFields[currentStep].indexOf(name) !== -1;
        fieldGroups[name].style.display = visible ? '' : 'none';
      });

      // Update step dots
      qsa('.pos-passport-step', stepsBar).forEach(function (dot, i) {
        dot.className = 'pos-passport-step';
        if (i < currentStep) {
          dot.classList.add('is-complete');
          dot.textContent = '';
        } else if (i === currentStep) {
          dot.classList.add('is-active');
          dot.textContent = i + 1;
        } else {
          dot.classList.add('is-future');
          dot.textContent = i + 1;
        }
      });

      // Update connecting lines
      qsa('.pos-passport-line', stepsBar).forEach(function (line, i) {
        line.classList.toggle('is-complete', i < currentStep);
      });

      // Update buttons
      backBtn.style.display = currentStep === 0 ? 'none' : '';
      nextBtn.style.display = currentStep >= stepNames.length - 1 ? 'none' : '';
      if (ctaWrap) ctaWrap.style.display = currentStep === stepNames.length - 1 ? '' : 'none';

      // Status chip
      if (currentStep > 0) {
        statusChip.textContent = statusTexts[currentStep - 1];
        statusChip.className = 'pos-passport-status pos-passport-status--identified';
      } else {
        statusChip.textContent = '';
        statusChip.className = 'pos-passport-status pos-passport-status--pending';
      }

      // Confirm panel — build with textContent to prevent XSS
      if (currentStep === stepNames.length - 1) {
        confirmPanel.style.display = '';
        var pathEl = qs('#path');
        var fnEl = qs('#firstName');
        var lnEl = qs('#lastName');
        var emEl = qs('#email');
        var phEl = qs('#phone');

        var pathText = '—';
        if (pathEl && pathEl.selectedIndex >= 0 && pathEl.options[pathEl.selectedIndex]) {
          pathText = pathEl.options[pathEl.selectedIndex].text || '—';
        }

        // Build safely with DOM methods
        confirmPanel.textContent = '';

        var reviewLabel = el('div', '', 'REVIEW YOUR APPLICATION');
        reviewLabel.style.cssText = 'font-size:9px;letter-spacing:2px;text-transform:uppercase;' +
          'color:rgba(255,255,255,0.4);margin-bottom:10px;';
        confirmPanel.appendChild(reviewLabel);

        var reviewBody = el('div');
        reviewBody.style.cssText = 'color:rgba(255,255,255,0.8);font-size:13px;line-height:2.2;';

        var fields = [
          ['Path', pathText],
          ['Name', (fnEl ? fnEl.value : '') + ' ' + (lnEl ? lnEl.value : '')],
          ['Email', emEl ? emEl.value : ''],
          ['Phone', phEl ? phEl.value || '—' : '—']
        ];
        fields.forEach(function (pair) {
          var row = el('div');
          var bold = el('strong', '', pair[0] + ': ');
          row.appendChild(bold);
          row.appendChild(doc.createTextNode(pair[1]));
          reviewBody.appendChild(row);
        });
        confirmPanel.appendChild(reviewBody);
      } else {
        confirmPanel.style.display = 'none';
      }

      // Hide form header except on first step
      if (header) header.style.display = currentStep === 0 ? '' : 'none';
    }

    nextBtn.addEventListener('click', function () {
      if (currentStep < stepNames.length - 1) {
        currentStep++;
        renderStep();
      }
    });

    backBtn.addEventListener('click', function () {
      if (currentStep > 0) {
        currentStep--;
        renderStep();
      }
    });

    // Initial render — hide CTA until confirm step
    renderStep();
  })();

  // ------------------------------------------------------------------
  // 10. COMMITMENT LADDER
  // ------------------------------------------------------------------

  (function initLadder() {
    var panel = qs('#membershipGeneral');
    if (!panel) return;
    var grid = qs('.membership-grid', panel);
    if (!grid) return;

    var tierLabels = {
      monthly:    'ENTRY',
      quarterly:  'MOMENTUM',
      semiannual: 'DEVELOPMENT',
      yearly:     'TRANSFORMATION'
    };

    // Add progress line
    var progress = el('div', 'pos-ladder-progress');
    grid.style.position = 'relative';
    grid.appendChild(progress);

    // Add stage labels to each card
    qsa('.membership-card[data-tier]', grid).forEach(function (card) {
      var tier = card.getAttribute('data-tier');
      var label = tierLabels[tier];
      if (label) {
        var stageLabel = el('div', 'pos-ladder-stage-label', label);
        ensureRelative(card);
        card.appendChild(stageLabel);
      }
    });

    // Animate progress line on scroll through membership section
    var membershipsSection = qs('#memberships');
    if (!membershipsSection) return;

    function updateLadder() {
      var rect = membershipsSection.getBoundingClientRect();
      var vh = win.innerHeight;
      var progressPct = 0;

      if (rect.top < vh && rect.bottom > 0) {
        var visibleTop = Math.max(0, -rect.top);
        var totalHeight = rect.height;
        progressPct = Math.min(1, visibleTop / (totalHeight - vh));
      }

      progress.style.setProperty('--pos-ladder-h', (progressPct * 100) + '%');
      progress.style.height = grid.offsetHeight + 'px';
      var after = progress.querySelector('.pos-ladder-fill-el');
      if (!after) {
        // Use a child element instead of pseudo for dynamic height
        after = el('div', 'pos-ladder-fill-el');
        after.style.cssText =
          'position:absolute;left:0;bottom:0;width:100%;' +
          'background:linear-gradient(to top,rgba(255,85,0,0.15),rgba(255,85,0,0.8));' +
          'transition:height 0.3s ease;';
        progress.appendChild(after);
      }
      after.style.height = (progressPct * 100) + '%';
    }

    win.addEventListener('scroll', throttle(updateLadder, 50), { passive: true });
    updateLadder();
  })();

  // ------------------------------------------------------------------
  // 11. CARRYOVER CONVERSION MAP ENHANCEMENT
  // ------------------------------------------------------------------

  (function initConversionMap() {
    var trails = qsa('.carryover-trail');
    if (!trails.length) return;

    trails.forEach(function (trail) {
      trail.classList.add('pos-convert-map');

      // Add input label to origin
      var origin = qs('.trail-origin', trail);
      if (origin) origin.classList.add('pos-convert-input');

      // Add output label to final node
      var finalNode = qs('.trail-node-final', trail);
      if (finalNode) finalNode.classList.add('pos-convert-output');
    });

    var convertObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('pos-convert-active');

          // Animate trail connector widths
          var connectors = qsa('.trail-connector', entry.target);
          connectors.forEach(function (conn, i) {
            conn.style.transition = 'none';
            conn.style.width = '0';
            void conn.offsetHeight; // force reflow before applying transition
            conn.style.transition = 'width 0.6s cubic-bezier(0.16,1,0.3,1) ' + (i * 0.15) + 's';
            conn.style.width = '';
          });
        }
      });
    }, { threshold: 0.3 });

    trails.forEach(function (trail) { convertObs.observe(trail); });
  })();

  // ------------------------------------------------------------------
  // 12. LEADERSHIP COMMAND DOSSIER
  // ------------------------------------------------------------------

  (function initDossier() {
    var cards = qsa('.leader-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      card.classList.add('pos-dossier');

      // Prepend dossier header
      var dossierHeader = el('div', 'pos-dossier-header');
      var headerSpan = el('span', '', 'COMMAND DOSSIER · PPF ATHLETICS');
      dossierHeader.appendChild(headerSpan);

      var info = qs('.leader-info', card);
      if (info) {
        info.insertBefore(dossierHeader, info.firstChild);
      } else {
        card.insertBefore(dossierHeader, card.firstChild);
      }

      // Add dossier lines between info sections within leader-info
      if (info) {
        var children = Array.from(info.children);
        for (var i = 1; i < children.length; i++) {
          if (!children[i].classList.contains('pos-dossier-line') &&
              !children[i].classList.contains('pos-dossier-header')) {
            var line = el('div', 'pos-dossier-line');
            info.insertBefore(line, children[i]);
            // Re-read children since DOM changed
            children = Array.from(info.children);
            i++; // skip the newly inserted line
          }
        }
      }

      // Add "refuses to compromise" section
      var protects = qs('.leader-protects', card);
      if (protects && !qs('.pos-dossier-refusal', protects)) {
        var refusal = el('div', 'pos-dossier-refusal');
        var refLabel = el('div', 'pos-dossier-refusal-label', 'REFUSES TO COMPROMISE');
        var refText = el('p', '', 'The coaching standard. The people in the room. The process that produces results.');
        refusal.appendChild(refLabel);
        refusal.appendChild(refText);
        protects.appendChild(refusal);
      }
    });
  })();

  // ------------------------------------------------------------------
  // 13. AMBIENT SYSTEM TAGS
  // ------------------------------------------------------------------

  (function initTags() {
    var tagConfig = [
      { section: '#hero',       text: 'LIVE',     cls: 'pos-tag--live',     nearSel: '.hero-micro-data' },
      { section: '#standard',   text: 'LOCKED',   cls: 'pos-tag--locked',   nearSel: '.section-title' },
      { section: '#proof',      text: 'VERIFIED',  cls: 'pos-tag--verified', nearSel: '.proof-metrics-grid' },
      { section: '#leadership', text: 'ACTIVE',    cls: 'pos-tag--active',   nearSel: '.section-title' },
      { section: '#start',      text: 'ARMED',     cls: 'pos-tag--armed',    nearSel: '.section-title' }
    ];

    var tagObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var tag = entry.target.querySelector('.pos-tag[data-pos-pending]');
        if (tag) {
          setTimeout(function () {
            tag.style.opacity = '1';
            tag.style.transform = 'translateY(0)';
            tag.removeAttribute('data-pos-pending');
          }, 600);
        }
      });
    }, { threshold: 0.3 });

    tagConfig.forEach(function (cfg) {
      var section = qs(cfg.section);
      if (!section) return;
      var anchor = qs(cfg.nearSel, section);
      if (!anchor) anchor = section;

      var tag = el('span', 'pos-tag ' + cfg.cls, cfg.text);
      tag.setAttribute('data-pos-pending', '1');
      tag.style.cssText = 'opacity:0;transform:translateY(6px);transition:opacity 0.5s ease,transform 0.5s ease;margin-left:8px;';

      // Insert next to the anchor element
      if (anchor.parentNode) {
        anchor.parentNode.insertBefore(tag, anchor.nextSibling);
      }

      tagObs.observe(section);
    });
  })();

  // ------------------------------------------------------------------
  // 14. MOTION SILENCE
  // ------------------------------------------------------------------

  (function initSilence() {
    if (!isDesktop()) return;

    var silenceSections = ['standard', 'proof', 'leadership'];
    var silenceFired = {};

    var silenceObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        if (silenceFired[id]) return;
        silenceFired[id] = true;

        body.classList.add('pos-silence');
        setTimeout(function () {
          body.classList.remove('pos-silence');
        }, 300);
      });
    }, { threshold: 0.15 });

    silenceSections.forEach(function (id) {
      var section = qs('#' + id);
      if (section) silenceObs.observe(section);
    });
  })();

  // ------------------------------------------------------------------
  // 15. SYSTEM BOOT STATUS ON HERO
  // ------------------------------------------------------------------

  (function initBootStatus() {
    var reactionEl = qs('#microReaction');
    var outputEl   = qs('#microOutput');

    if (!reactionEl && !outputEl) return;

    var statusLabels = [
      'REACTION LIVE', 'OUTPUT ACTIVE', 'SPEED ARMED',
      'STANDARD LOCKED', 'POWER TRACKING'
    ];
    var labelIdx = 0;

    // Add a rotating status label near the micro data HUD
    var microData = qs('#heroMicroData');
    var statusEl;
    if (microData) {
      statusEl = el('div', 'pos-tag pos-tag--live', statusLabels[0]);
      statusEl.style.cssText =
        'position:absolute;bottom:-24px;left:50%;transform:translateX(-50%);' +
        'transition:opacity 0.4s ease;white-space:nowrap;';
      ensureRelative(microData);
      microData.appendChild(statusEl);

      setInterval(function () {
        statusEl.style.opacity = '0';
        setTimeout(function () {
          labelIdx = (labelIdx + 1) % statusLabels.length;
          statusEl.textContent = statusLabels[labelIdx];
          statusEl.style.opacity = '1';
        }, 300);
      }, 4000);
    }

    // Fluctuate reaction time (41ms → 43ms → 39ms → 42ms)
    var reactionValues = [42, 41, 43, 39, 44, 40, 42, 38];
    var reactionIdx = 0;

    if (reactionEl) {
      setInterval(function () {
        reactionIdx = (reactionIdx + 1) % reactionValues.length;
        reactionEl.textContent = reactionValues[reactionIdx] + 'ms';
      }, 3000);
    }

    // Creep output percentage (93% → 94% → 95%)
    var outputBase = 93;
    if (outputEl) {
      setInterval(function () {
        outputBase = outputBase >= 97 ? 93 : outputBase + 1;
        outputEl.textContent = outputBase + '%';
      }, 5000);
    }
  })();

})();
