/**
 * PPF Elite Animations — 15 integrated animation systems
 * Enhances existing PPF Athletics site with athletic training-inspired motion.
 * Each system injects its own CSS and is fully self-contained.
 */
;(function () {
  'use strict';

  /* ── Reduced-motion guard ─────────────────────────────────── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  /* ── Local helpers ────────────────────────────────────────── */
  function qs(s, p) { return (p || document).querySelector(s); }
  function qsa(s, p) { return [].slice.call((p || document).querySelectorAll(s)); }

  /** Inject a <style> block once (keyed by id). */
  function injectCSS(id, css) {
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /** IntersectionObserver convenience — fires callback(entry) per element. */
  function onVisible(selector, callback, opts) {
    var els = qsa(selector);
    if (!els.length) return;
    var o = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) callback(e); });
    }, opts || { threshold: 0.15 });
    els.forEach(function (el) { o.observe(el); });
    return o;
  }

  /** True when the device has no fine pointer (touch-only). */
  function isTouchDevice() {
    return window.matchMedia('(pointer: coarse)').matches;
  }

  /* ================================================================
     #1  STANDARD IGNITION — Pre-phase enhancement for .ppf-intro
     ================================================================ */
  function initStandardIgnition() {
    var intro = qs('.ppf-intro');
    if (!intro) return;

    injectCSS('ea-ignition', [
      '.ppf-intro-prephase{position:absolute;inset:0;z-index:2;pointer-events:none;overflow:hidden}',
      '.ignition-frag{position:absolute;background:var(--orange,#ff5500);opacity:0;will-change:transform,opacity,clip-path}',
      /* Field lines — thin horizontal */
      '.ignition-frag--line{height:1px;width:60%;opacity:0;' +
        'clip-path:inset(0 100% 0 0);transition:clip-path .5s var(--ease-out-expo,cubic-bezier(.16,1,.3,1)),opacity .3s}',
      '.ignition-frag--line.snap{clip-path:inset(0 0 0 0);opacity:.35}',
      /* Lane marks — short vertical dashes */
      '.ignition-frag--lane{width:2px;height:24px;opacity:0;' +
        'clip-path:inset(100% 0 0 0);transition:clip-path .45s var(--ease-out-expo,cubic-bezier(.16,1,.3,1)),opacity .3s}',
      '.ignition-frag--lane.snap{clip-path:inset(0);opacity:.3}',
      /* Knurl dots */
      '.ignition-frag--knurl{width:3px;height:3px;border-radius:50%;opacity:0;' +
        'clip-path:circle(0% at 50% 50%);transition:clip-path .4s ease-out,opacity .3s}',
      '.ignition-frag--knurl.snap{clip-path:circle(50% at 50% 50%);opacity:.25}',
      /* Timing grid fragments */
      '.ignition-frag--grid{width:40px;height:40px;opacity:0;' +
        'border:1px solid rgba(255,85,0,.2);clip-path:inset(50%);transition:clip-path .5s ease-out,opacity .3s}',
      '.ignition-frag--grid.snap{clip-path:inset(0);opacity:.18}'
    ].join('\n'));

    // Build pre-phase container
    var wrap = document.createElement('div');
    wrap.className = 'ppf-intro-prephase';
    intro.classList.add('ppf-intro-prephase');

    var types = ['line', 'lane', 'knurl', 'grid'];
    var frags = [];

    for (var i = 0; i < 20; i++) {
      var t = types[i % types.length];
      var d = document.createElement('div');
      d.className = 'ignition-frag ignition-frag--' + t;

      // Position from edges building toward centre
      var edge = i % 4; // 0=left 1=right 2=top 3=bottom
      if (edge === 0) { d.style.left = '0'; d.style.top = (15 + Math.random() * 70) + '%'; }
      else if (edge === 1) { d.style.right = '0'; d.style.top = (15 + Math.random() * 70) + '%'; }
      else if (edge === 2) { d.style.top = '0'; d.style.left = (15 + Math.random() * 70) + '%'; }
      else { d.style.bottom = '0'; d.style.left = (15 + Math.random() * 70) + '%'; }

      wrap.appendChild(d);
      frags.push(d);
    }
    intro.insertBefore(wrap, intro.firstChild);

    // Stagger snap-in over 600ms
    frags.forEach(function (f, idx) {
      setTimeout(function () { f.classList.add('snap'); }, idx * 28);
    });

    // After 600ms, fade out pre-phase so existing intro continues
    setTimeout(function () {
      wrap.style.transition = 'opacity .3s';
      wrap.style.opacity = '0';
      setTimeout(function () { if (wrap.parentNode) wrap.parentNode.removeChild(wrap); }, 350);
    }, 600);
  }

  /* ================================================================
     #2  REACTIVE TURF PRESSURE — Canvas mouse-follow depression
     ================================================================ */
  function initTurfPressure() {
    if (isTouchDevice()) return;

    injectCSS('ea-turf', [
      '.turf-canvas{position:fixed;inset:0;width:100%;height:100%;',
      '  z-index:1;pointer-events:none}'
    ].join(''));

    var canvas = document.createElement('canvas');
    canvas.className = 'turf-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');

    function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
    resize();
    window.addEventListener('resize', resize);

    var pool = []; // {x, y, birth}
    var MAX = 5;
    var LIFE = 300;

    document.addEventListener('mousemove', function (e) {
      pool.push({ x: e.clientX, y: e.clientY, birth: performance.now() });
      if (pool.length > MAX) pool.shift();
    });

    function tick(now) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pool = pool.filter(function (p) { return (now - p.birth) < LIFE; });
      pool.forEach(function (p) {
        var age = (now - p.birth) / LIFE;
        var alpha = 0.04 * (1 - age);
        var r = 40 + age * 30;
        var grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        grad.addColorStop(0, 'rgba(0,0,0,' + alpha + ')');
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ================================================================
     #3  SPRINT BURST TRACKING — Speed trail for proof metrics
     ================================================================ */
  function initSprintBurst() {
    if (!qs('#proof')) return;

    injectCSS('ea-sprint', [
      '.proof-metric{position:relative;overflow:hidden}',
      '.sprint-trail{position:absolute;top:50%;left:0;height:2px;width:200px;',
      '  transform:translateY(-50%);pointer-events:none;z-index:2;',
      '  background:linear-gradient(90deg,#ff5500,transparent);',
      '  opacity:0;will-change:transform}',
      '@keyframes sprintRace{0%{transform:translateX(-200px) translateY(-50%);opacity:1}',
      '  100%{transform:translateX(calc(100vw)) translateY(-50%);opacity:0}}',
      '.sprint-trail.go{animation:sprintRace .6s var(--ease-out-expo,cubic-bezier(.16,1,.3,1)) forwards}',
      '.proof-metric .sprint-clip{clip-path:inset(0 100% 0 0);transition:clip-path .6s var(--ease-out-expo,cubic-bezier(.16,1,.3,1))}',
      '.proof-metric.sprint-revealed .sprint-clip{clip-path:inset(0 0 0 0)}'
    ].join('\n'));

    var revealed = false;
    onVisible('.proof-metric', function (entry) {
      if (revealed) return;
      revealed = true;
      var metrics = qsa('.proof-metric');
      metrics.forEach(function (m, i) {
        // Wrap inner content for clip
        if (!qs('.sprint-clip', m)) {
          var inner = document.createElement('div');
          inner.className = 'sprint-clip';
          while (m.firstChild) inner.appendChild(m.firstChild);
          m.appendChild(inner);
        }
        // Add trail element
        var trail = document.createElement('div');
        trail.className = 'sprint-trail';
        m.appendChild(trail);

        setTimeout(function () {
          trail.classList.add('go');
          m.classList.add('sprint-revealed');
        }, i * 150);
      });
    }, { threshold: 0.2 });
  }

  /* ================================================================
     #4  BAR LOAD TENSION BUILD — Tension line at section tops
     ================================================================ */
  function initBarLoadTension() {
    injectCSS('ea-tension', [
      '.tension-ready{position:relative}',
      '.tension-ready::before{content:"";position:absolute;top:0;left:0;right:0;',
      '  height:2px;background:var(--orange,#ff5500);transform:scaleX(0);',
      '  transform-origin:center;z-index:3;pointer-events:none;',
      '  transition:transform .4s var(--ease-out-expo,cubic-bezier(.16,1,.3,1))}',
      '.tension-active::before{transform:scaleX(1)}',
      '@keyframes tensionBend{',
      '  0%{clip-path:polygon(0 0,100% 0,100% 2px,0 2px)}',
      '  50%{clip-path:polygon(0 0,100% 0,100% 8px,50% 14px,0 8px)}',
      '  80%{clip-path:polygon(0 0,100% 0,100% 2px,50% 0px,0 2px)}',
      '  100%{clip-path:polygon(0 0,100% 0,100% 2px,0 2px)}}',
      '.tension-bend::before{animation:tensionBend .8s var(--ease-spring,cubic-bezier(.34,1.56,.64,1)) forwards}'
    ].join('\n'));

    var targets = qsa('.standard-section');
    if (!targets.length) return;

    targets.forEach(function (sec) {
      sec.classList.add('tension-ready');
    });

    onVisible('.tension-ready', function (entry) {
      var el = entry.target;
      if (el.dataset.tensionDone) return;
      el.dataset.tensionDone = '1';
      el.classList.add('tension-active');
      setTimeout(function () { el.classList.add('tension-bend'); }, 400);
      setTimeout(function () {
        el.classList.remove('tension-active', 'tension-bend');
      }, 1400);
    }, { threshold: 0.1 });
  }

  /* ================================================================
     #5  CHALK CLOUD DECISION SPLIT — Particle burst in paths
     ================================================================ */
  function initChalkCloud() {
    var pathsSection = qs('#paths');
    if (!pathsSection) return;

    injectCSS('ea-chalk', [
      '.chalk-overlay{position:fixed;inset:0;z-index:9999;pointer-events:none;overflow:hidden}',
      '.chalk-p{position:absolute;border-radius:50%;will-change:transform,opacity;',
      '  top:50%;left:50%;transform:translate(-50%,-50%)}',
      '@keyframes chalkLeft{0%{transform:translate(-50%,-50%) scale(0);opacity:.7}',
      '  100%{transform:translate(calc(-50vw + ' + (Math.random()*20) + 'px),-50%) scale(1.5);opacity:0}}',
      '@keyframes chalkDown{0%{transform:translate(-50%,-50%) scale(0);opacity:.7}',
      '  100%{transform:translate(-50%,40vh) scale(1.5);opacity:0}}',
      '@keyframes chalkRight{0%{transform:translate(-50%,-50%) scale(0);opacity:.7}',
      '  100%{transform:translate(calc(50vw - ' + (Math.random()*20) + 'px),-50%) scale(1.5);opacity:0}}'
    ].join('\n'));

    var fired = false;
    onVisible('#paths', function () {
      if (fired) return;
      fired = true;

      var overlay = document.createElement('div');
      overlay.className = 'chalk-overlay';
      document.body.appendChild(overlay);

      var flows = [
        { color: 'rgba(255,85,0,.6)', anim: 'chalkLeft', count: 6 },    // athlete → left
        { color: 'rgba(106,143,255,.6)', anim: 'chalkDown', count: 5 },  // adult → down
        { color: 'rgba(80,200,120,.6)', anim: 'chalkRight', count: 6 }   // integrated → right
      ];

      flows.forEach(function (flow) {
        for (var i = 0; i < flow.count; i++) {
          var p = document.createElement('div');
          p.className = 'chalk-p';
          var size = 6 + Math.random() * 10;
          p.style.width = size + 'px';
          p.style.height = size + 'px';
          p.style.background = flow.color;
          var dur = 0.8 + Math.random() * 0.4;
          var delay = Math.random() * 0.3;
          p.style.animation = flow.anim + ' ' + dur + 's ' + delay + 's ease-out forwards';
          overlay.appendChild(p);
        }
      });

      setTimeout(function () {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      }, 1400);
    }, { threshold: 0.3 });
  }

  /* ================================================================
     #6  COACHING INTERRUPT — Bold command slam on fast scroll
     ================================================================ */
  function initCoachingInterrupt() {
    injectCSS('ea-interrupt', [
      '.ci-overlay{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
      '  z-index:10000;pointer-events:none;font-family:var(--font-display,"Bebas Neue",Impact,sans-serif);',
      '  font-size:clamp(3rem,8vw,7rem);color:var(--white,#f5f5f5);opacity:0;',
      '  text-align:center;letter-spacing:.04em;white-space:nowrap;',
      '  text-shadow:0 0 40px rgba(255,85,0,.4);will-change:opacity,transform}',
      '@keyframes ciSlam{0%{opacity:0;transform:translate(-50%,-50%) scale(1.3)}',
      '  15%{opacity:.85;transform:translate(-50%,-50%) scale(1)}',
      '  75%{opacity:.85;transform:translate(-50%,-50%) scale(1)}',
      '  100%{opacity:0;transform:translate(-50%,-50%) scale(.97)}}',
      '.ci-overlay.slam{animation:ciSlam .9s var(--ease-out-expo,cubic-bezier(.16,1,.3,1)) forwards}'
    ].join('\n'));

    var words = ['DRIVE', 'RESET', 'FINISH', 'STAY TIGHT', 'OWN THE REP', 'LOCK IN'];
    var triggerSections = '.standard-section, .paths-section, .proof-section, .room-section';
    var maxFires = 3;
    var cooldownMs = 8000;
    var fireCount = 0;
    var lastFire = 0;
    var lastScrollY = window.scrollY;
    var lastScrollTime = performance.now();

    // Detect if user is scrolling past trigger sections
    var inTriggerZone = false;
    var triggerObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) inTriggerZone = true;
      });
    }, { threshold: 0 });
    qsa(triggerSections).forEach(function (el) { triggerObs.observe(el); });

    function onScroll() {
      if (fireCount >= maxFires) return;
      var now = performance.now();
      var dy = Math.abs(window.scrollY - lastScrollY);
      var dt = now - lastScrollTime;
      lastScrollY = window.scrollY;
      lastScrollTime = now;

      if (dt < 1) return;
      var vel = dy / (dt / 16); // px per frame
      if (vel > 50 && inTriggerZone && (now - lastFire) > cooldownMs) {
        fireCount++;
        lastFire = now;
        slam();
      }
      inTriggerZone = false;
    }

    function slam() {
      var el = document.createElement('div');
      el.className = 'ci-overlay';
      el.textContent = words[Math.floor(Math.random() * words.length)];
      document.body.appendChild(el);
      // Force reflow then animate
      void el.offsetWidth;
      el.classList.add('slam');
      setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 1000);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ================================================================
     #7  RECOVERY PULSE RESET — Breathing transition at morphs
     ================================================================ */
  function initRecoveryPulse() {
    var morphs = qsa('.section-morph');
    if (!morphs.length) return;

    injectCSS('ea-recovery', [
      '.recovery-breath{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);',
      '  width:12px;height:12px;border-radius:50%;',
      '  background:rgba(255,85,0,.25);pointer-events:none;z-index:5;opacity:0}',
      '@keyframes breathe{0%{opacity:0;transform:translate(-50%,-50%) scale(.5)}',
      '  30%{opacity:.4;transform:translate(-50%,-50%) scale(1.2)}',
      '  70%{opacity:.3;transform:translate(-50%,-50%) scale(1)}',
      '  100%{opacity:0;transform:translate(-50%,-50%) scale(.8)}}',
      '.recovery-breath.active{animation:breathe 1s ease-in-out forwards}',
      '@keyframes bgPulse{0%{background-color:#080808}50%{background-color:#0c0c0c}100%{background-color:#080808}}',
      '.recovery-bg-pulse{animation:bgPulse 1.5s ease-in-out}'
    ].join('\n'));

    var triggered = {};
    onVisible('.section-morph', function (entry) {
      var el = entry.target;
      var key = el.className;
      if (triggered[key]) return;
      triggered[key] = true;

      // Background pulse
      document.body.classList.add('recovery-bg-pulse');
      setTimeout(function () { document.body.classList.remove('recovery-bg-pulse'); }, 1600);

      // Breathing indicator
      var dot = document.createElement('div');
      dot.className = 'recovery-breath';
      document.body.appendChild(dot);
      void dot.offsetWidth;
      dot.classList.add('active');
      setTimeout(function () { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 1100);
    }, { threshold: 0.5 });
  }

  /* ================================================================
     #8  MOVEMENT PATH OVERLAY — SVG arcs on card hover
     ================================================================ */
  function initMovementOverlay() {
    if (isTouchDevice()) return;

    injectCSS('ea-movement', [
      '.mo-svg{position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:2;overflow:visible}',
      '.mo-svg path{fill:none;stroke-width:1.5;stroke-linecap:round;',
      '  stroke-dasharray:200;stroke-dashoffset:200;transition:stroke-dashoffset .8s var(--ease-out-expo,cubic-bezier(.16,1,.3,1))}',
      '.mo-active .mo-svg path{stroke-dashoffset:0}'
    ].join('\n'));

    // Arc definitions per path type
    var arcs = {
      athlete: {
        color: '#ff5500',
        d: 'M10,80 L50,20 L90,80 M30,60 L70,15'
      },
      adult: {
        color: '#6a8fff',
        d: 'M5,50 Q30,45 50,50 T95,50 M5,60 Q30,55 50,60 T95,60'
      },
      integrated: {
        color: '#50c878',
        d: 'M10,70 Q50,20 90,70 M20,50 Q50,30 80,50'
      }
    };

    // Default arc for non-path cards
    var defaultArc = { color: '#ff5500', d: 'M10,70 L50,30 L90,70' };

    function getPathType(el) {
      var p = el.dataset.path || el.closest('[data-path]');
      if (p && typeof p === 'object') p = p.dataset.path;
      return (typeof p === 'string') ? p : null;
    }

    qsa('.path-card, .leader-card').forEach(function (card) {
      card.style.position = card.style.position || 'relative';
      var pathType = getPathType(card);
      var arc = (pathType && arcs[pathType]) ? arcs[pathType] : defaultArc;

      var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('class', 'mo-svg');
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', arc.d);
      path.setAttribute('stroke', arc.color);
      svg.appendChild(path);
      card.appendChild(svg);

      card.addEventListener('mouseenter', function () { card.classList.add('mo-active'); });
      card.addEventListener('mouseleave', function () { card.classList.remove('mo-active'); });
    });
  }

  /* ================================================================
     #9  REP LOCK SEQUENCE — Brace micro-animation on CTA hover
     ================================================================ */
  function initRepLock() {
    injectCSS('ea-replock', [
      '.ppf-cta .cta-brace-grid{position:absolute;inset:0;pointer-events:none;opacity:0;',
      '  transition:opacity .15s;z-index:0}',
      '.ppf-cta .cta-brace-dot{position:absolute;width:2px;height:2px;border-radius:50%;',
      '  background:rgba(255,85,0,.2)}',
      '.ppf-cta.cta-bracing .cta-brace-grid{opacity:1}',
      '.ppf-cta.cta-bracing{box-shadow:inset 0 0 0 2px rgba(255,85,0,.25);',
      '  transition:box-shadow .15s,transform .15s}',
      '.ppf-cta.cta-braced{transform:scale(1.02);',
      '  box-shadow:inset 0 0 0 2px rgba(255,85,0,.35)}'
    ].join('\n'));

    qsa('.ppf-cta').forEach(function (cta) {
      cta.style.position = cta.style.position || 'relative';

      // Build 4×4 dot grid
      var grid = document.createElement('div');
      grid.className = 'cta-brace-grid';
      for (var r = 0; r < 4; r++) {
        for (var c = 0; c < 4; c++) {
          var dot = document.createElement('div');
          dot.className = 'cta-brace-dot';
          dot.style.top = (20 + r * 20) + '%';
          dot.style.left = (20 + c * 20) + '%';
          grid.appendChild(dot);
        }
      }
      cta.appendChild(grid);

      var timer = null;
      cta.addEventListener('mouseenter', function () {
        cta.classList.add('cta-bracing');
        timer = setTimeout(function () {
          cta.classList.add('cta-braced');
        }, 150);
      });
      cta.addEventListener('mouseleave', function () {
        clearTimeout(timer);
        cta.classList.remove('cta-bracing', 'cta-braced');
      });
    });
  }

  /* ================================================================
     #10 VELOCITY FAILURE & CORRECTION — Film room hover effect
     ================================================================ */
  function initVelocityFailure() {
    var filmRoom = qs('#filmRoom');
    if (!filmRoom) return;

    injectCSS('ea-velocity', [
      '.vf-failure{filter:hue-rotate(-10deg) saturate(1.2);',
      '  transition:filter .3s,transform .3s}',
      '.vf-failure *{transition:transform .15s}',
      '.vf-correct{filter:hue-rotate(60deg) brightness(1.05);',
      '  transition:filter .3s,transform .3s}',
      '@keyframes wobble{0%,100%{transform:translateX(0)}25%{transform:translateX(-2px)}',
      '  50%{transform:translateX(2px)}75%{transform:translateX(-1px)}}',
      '.vf-wobbling{animation:wobble .3s ease-in-out 2}'
    ].join('\n'));

    // Find "miss" vs "correct" content by section labels
    qsa('.fr-section', filmRoom).forEach(function (sec) {
      var label = qs('.fr-section-label', sec);
      if (!label) return;
      var text = (label.textContent || '').toLowerCase();

      if (text.indexOf('miss') !== -1 || text.indexOf('wrong') !== -1 || text.indexOf('common') !== -1) {
        sec.addEventListener('mouseenter', function () {
          sec.classList.add('vf-failure', 'vf-wobbling');
        });
        sec.addEventListener('mouseleave', function () {
          sec.classList.remove('vf-failure', 'vf-wobbling');
        });
      }
      if (text.indexOf('correct') !== -1 || text.indexOf('right') !== -1 || text.indexOf('proper') !== -1) {
        sec.addEventListener('mouseenter', function () {
          sec.classList.add('vf-correct');
        });
        sec.addEventListener('mouseleave', function () {
          sec.classList.remove('vf-correct');
        });
      }
    });
  }

  /* ================================================================
     #11 COMPETITION BOARD CLIMB — Animated metric count-up
     ================================================================ */
  function initBoardClimb() {
    var board = qs('#benchmarkBoard');
    if (!board) return;

    injectCSS('ea-climb', [
      '.climb-flash{display:inline-block;transition:color .3s,text-shadow .3s}',
      '.climb-gold{color:#ffd700;text-shadow:0 0 12px rgba(255,215,0,.5)}'
    ].join('\n'));

    var counted = new WeakSet();
    onVisible('.proof-metric, .metric-item', function (entry) {
      var el = entry.target;
      if (counted.has(el)) return;
      counted.add(el);

      // Find a numeric target
      var numEl = qs('[data-target]', el) || qs('.metric-num', el);
      if (!numEl) return;
      var target = parseFloat(numEl.dataset.target || numEl.textContent);
      if (isNaN(target) || target === 0) return;

      var suffix = (numEl.textContent || '').replace(/[\d.,\-]+/, '');
      var isInt = target === Math.floor(target) && suffix.indexOf('.') === -1;
      numEl.classList.add('climb-flash');

      var start = performance.now();
      var dur = 1600;

      function frame(now) {
        var t = Math.min((now - start) / dur, 1);
        // Competitive stutter: accelerate, pause at 60%, surge
        var val;
        if (t < 0.5) {
          val = target * (t / 0.5) * 0.6; // climb to 60%
        } else if (t < 0.65) {
          val = target * 0.6; // pause
        } else {
          var surge = (t - 0.65) / 0.35;
          surge = 1 - Math.pow(1 - surge, 3); // ease-out cubic
          val = target * (0.6 + 0.4 * surge);
        }

        numEl.textContent = (isInt ? Math.round(val) : val.toFixed(1)) + suffix;

        if (t < 1) {
          requestAnimationFrame(frame);
        } else {
          numEl.textContent = (isInt ? target : target.toFixed(1)) + suffix;
          numEl.classList.add('climb-gold');
          setTimeout(function () { numEl.classList.remove('climb-gold'); }, 600);
        }
      }
      requestAnimationFrame(frame);
    }, { threshold: 0.3, root: board.closest('.section') || null });
  }

  /* ================================================================
     #12 FORCE TRANSFER SEQUENCE — Energy particle along trails
     ================================================================ */
  function initForceTransfer() {
    var carryover = qs('#carryover');
    if (!carryover) return;

    injectCSS('ea-force', [
      '.ft-particle{position:absolute;width:8px;height:8px;border-radius:50%;',
      '  pointer-events:none;z-index:5;filter:blur(1px);',
      '  box-shadow:0 0 8px 2px currentColor;will-change:left,top,opacity}',
      '.ft-glow{position:absolute;width:6px;height:6px;border-radius:50%;',
      '  pointer-events:none;z-index:4;opacity:.4;filter:blur(3px);',
      '  will-change:opacity;transition:opacity .5s}'
    ].join('\n'));

    var trailColors = {
      speed: '#ff5500',
      strength: '#ff5500',
      coordination: '#50c878'
    };

    var animated = new WeakSet();
    onVisible('.carryover-trail', function (entry) {
      var trail = entry.target;
      if (animated.has(trail)) return;
      animated.add(trail);

      var key = trail.dataset.trail || 'speed';
      var color = trailColors[key] || '#ff5500';

      // Gather child nodes as waypoints
      var nodes = qsa('.cm-reveal-item, [class*="node"], [class*="dot"]', trail);
      if (nodes.length < 2) {
        // Fallback: create path across trail width
        nodes = [{ offsetLeft: 0, offsetTop: trail.offsetHeight / 2 },
                 { offsetLeft: trail.offsetWidth, offsetTop: trail.offsetHeight / 2 }];
      }

      var particle = document.createElement('div');
      particle.className = 'ft-particle';
      particle.style.color = color;
      particle.style.background = color;
      trail.style.position = trail.style.position || 'relative';
      trail.appendChild(particle);

      var step = 0;
      var totalSteps = 60;
      var perNode = Math.floor(totalSteps / Math.max(nodes.length - 1, 1));

      function getPos(node) {
        if (node.offsetLeft !== undefined && node.getBoundingClientRect) {
          return { x: node.offsetLeft + node.offsetWidth / 2, y: node.offsetTop + node.offsetHeight / 2 };
        }
        return { x: node.offsetLeft || 0, y: node.offsetTop || 0 };
      }

      function tick() {
        var seg = Math.min(Math.floor(step / perNode), nodes.length - 2);
        var segT = (step - seg * perNode) / perNode;
        var a = getPos(nodes[seg]);
        var b = getPos(nodes[seg + 1] || nodes[seg]);
        var x = a.x + (b.x - a.x) * segT;
        var y = a.y + (b.y - a.y) * segT;

        particle.style.left = x + 'px';
        particle.style.top = y + 'px';

        // Leave glow trail
        if (step % 4 === 0) {
          var glow = document.createElement('div');
          glow.className = 'ft-glow';
          glow.style.background = color;
          glow.style.left = x + 'px';
          glow.style.top = y + 'px';
          trail.appendChild(glow);
          setTimeout(function () { glow.style.opacity = '0'; }, 100);
          setTimeout(function () { if (glow.parentNode) glow.parentNode.removeChild(glow); }, 700);
        }

        step++;
        if (step <= totalSteps) {
          requestAnimationFrame(tick);
        } else {
          particle.style.transition = 'opacity .3s';
          particle.style.opacity = '0';
          setTimeout(function () { if (particle.parentNode) particle.parentNode.removeChild(particle); }, 400);
        }
      }
      requestAnimationFrame(tick);
    }, { threshold: 0.3 });
  }

  /* ================================================================
     #13 SESSION CLOCK COMPRESSION — Viewport squeeze on work phase
     ================================================================ */
  function initSessionClock() {
    var room = qs('#room, .room-section');
    if (!room) return;

    injectCSS('ea-clock', [
      '.clock-vignette{position:fixed;inset:0;pointer-events:none;z-index:4;',
      '  box-shadow:inset 0 0 0 0 rgba(0,0,0,0);',
      '  transition:box-shadow 3s ease-in-out}',
      '.clock-vignette.compress{box-shadow:inset 0 0 120px 40px rgba(0,0,0,.6)}',
      '.clock-vignette.release{transition-duration:.5s;box-shadow:inset 0 0 0 0 rgba(0,0,0,0)}',
      '.room-section.clock-pad{transition:padding 3s ease-in-out}',
      '.room-section.clock-pad-active{padding-left:40px;padding-right:40px}',
      '.room-section.clock-pad-release{transition-duration:.5s;padding-left:0;padding-right:0}'
    ].join('\n'));

    var vignette = document.createElement('div');
    vignette.className = 'clock-vignette';
    document.body.appendChild(vignette);

    var roomSection = qs('.room-section') || room;
    roomSection.classList.add('clock-pad');

    var isCompressed = false;

    // Watch for work phase activation
    var observer = new MutationObserver(function () {
      var workStage = qs('.room-stage[data-phase="work"]', room);
      var isActive = workStage && (workStage.classList.contains('active') ||
                                    workStage.classList.contains('room-stage-active'));

      if (isActive && !isCompressed) {
        isCompressed = true;
        vignette.classList.remove('release');
        vignette.classList.add('compress');
        roomSection.classList.remove('clock-pad-release');
        roomSection.classList.add('clock-pad-active');
      } else if (!isActive && isCompressed) {
        isCompressed = false;
        vignette.classList.remove('compress');
        vignette.classList.add('release');
        roomSection.classList.remove('clock-pad-active');
        roomSection.classList.add('clock-pad-release');
      }
    });

    observer.observe(room, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }

  /* ================================================================
     #14 SURFACE SHIFT BY TRAINING MODE — Background texture swap
     ================================================================ */
  function initSurfaceShift() {
    injectCSS('ea-surface', [
      '.surface-layer{position:fixed;inset:0;pointer-events:none;z-index:0;',
      '  opacity:0;transition:opacity .8s ease-in-out}',
      '.surface-layer.surface-active{opacity:1}',
      /* Track lanes — horizontal lines */
      '.surface-track{background:repeating-linear-gradient(',
      '  0deg,transparent,transparent 38px,rgba(255,85,0,.03) 38px,rgba(255,85,0,.03) 40px)}',
      /* Rubber floor — grid */
      '.surface-grid{background:repeating-linear-gradient(',
      '  0deg,transparent,transparent 58px,rgba(255,255,255,.02) 58px,rgba(255,255,255,.02) 60px),',
      '  repeating-linear-gradient(',
      '  90deg,transparent,transparent 58px,rgba(255,255,255,.02) 58px,rgba(255,255,255,.02) 60px)}',
      /* Matte — clean */
      '.surface-matte{background:none}',
      /* Warm radial */
      '.surface-warm{background:radial-gradient(ellipse at 50% 50%,rgba(80,200,120,.03),transparent 70%)}'
    ].join('\n'));

    var textures = {
      paths: 'track', hero: 'track',
      standard: 'grid', memberships: 'grid', proof: 'grid',
      room: 'matte', leadership: 'matte',
      oneRoom: 'warm', carryover: 'warm', trust: 'warm'
    };

    // Build surface layers
    var layers = {};
    ['track', 'grid', 'matte', 'warm'].forEach(function (key) {
      var div = document.createElement('div');
      div.className = 'surface-layer surface-' + key;
      document.body.appendChild(div);
      layers[key] = div;
    });

    var current = null;

    var sectionEls = qsa('section[id]');
    if (!sectionEls.length) return;

    var obs = new IntersectionObserver(function (entries) {
      // Find the most visible section
      var best = null;
      var bestRatio = 0;
      entries.forEach(function (e) {
        if (e.isIntersecting && e.intersectionRatio > bestRatio) {
          bestRatio = e.intersectionRatio;
          best = e.target;
        }
      });
      if (!best) return;

      var id = best.id;
      var tex = textures[id] || null;

      if (tex !== current) {
        if (current && layers[current]) layers[current].classList.remove('surface-active');
        current = tex;
        if (tex && layers[tex]) layers[tex].classList.add('surface-active');
      }
    }, { threshold: [0, 0.2, 0.5, 0.8] });

    sectionEls.forEach(function (sec) { obs.observe(sec); });
  }

  /* ================================================================
     #15 THE LAST REP FINISH — Completion ceremony
     ================================================================ */
  function initLastRep() {
    injectCSS('ea-lastrep', [
      '.lr-overlay{position:fixed;inset:0;z-index:99999;pointer-events:none;',
      '  display:flex;align-items:center;justify-content:center;flex-direction:column}',
      '.lr-vignette{position:absolute;inset:0;',
      '  box-shadow:inset 0 0 0 0 rgba(0,0,0,0);transition:box-shadow .5s ease-in-out}',
      '.lr-vignette.tight{box-shadow:inset 0 0 150px 60px rgba(0,0,0,.7)}',
      '.lr-vignette.release{box-shadow:inset 0 0 0 0 rgba(0,0,0,0);transition-duration:.6s}',
      '.lr-bar{width:200px;height:4px;background:rgba(255,255,255,.1);border-radius:2px;',
      '  position:relative;z-index:1;overflow:hidden;opacity:0;transition:opacity .3s}',
      '.lr-bar-fill{height:100%;width:80%;background:var(--orange,#ff5500);border-radius:2px;',
      '  transition:width 1.5s cubic-bezier(.4,0,.2,1)}',
      '.lr-bar.show{opacity:1}',
      '.lr-bar-fill.grind{width:100%}',
      '.lr-stamp{font-family:var(--font-display,"Bebas Neue",Impact,sans-serif);',
      '  font-size:clamp(2rem,5vw,4rem);color:var(--white,#f5f5f5);letter-spacing:.08em;',
      '  opacity:0;transform:scale(1.1);transition:opacity .5s,transform .5s;',
      '  position:relative;z-index:1;margin-top:16px}',
      '.lr-stamp.show{opacity:1;transform:scale(1)}'
    ].join('\n'));

    var hasPlayed = false;

    function playFinish() {
      if (hasPlayed) return;
      hasPlayed = true;

      var overlay = document.createElement('div');
      overlay.className = 'lr-overlay';

      var vig = document.createElement('div');
      vig.className = 'lr-vignette';

      var bar = document.createElement('div');
      bar.className = 'lr-bar';
      var fill = document.createElement('div');
      fill.className = 'lr-bar-fill';
      bar.appendChild(fill);

      var stamp = document.createElement('div');
      stamp.className = 'lr-stamp';
      stamp.textContent = 'COMPLETE';

      overlay.appendChild(vig);
      overlay.appendChild(bar);
      overlay.appendChild(stamp);
      document.body.appendChild(overlay);

      // 1. Vignette tightens
      requestAnimationFrame(function () {
        vig.classList.add('tight');
      });

      // 2. Progress bar grinds 80% → 100%
      setTimeout(function () {
        bar.classList.add('show');
        requestAnimationFrame(function () { fill.classList.add('grind'); });
      }, 500);

      // 3. COMPLETE stamp
      setTimeout(function () {
        stamp.classList.add('show');
      }, 2200);

      // 4. Release vignette
      setTimeout(function () {
        vig.classList.remove('tight');
        vig.classList.add('release');
      }, 3000);

      // Cleanup
      setTimeout(function () {
        overlay.style.transition = 'opacity .5s';
        overlay.style.opacity = '0';
        setTimeout(function () { if (overlay.parentNode) overlay.parentNode.removeChild(overlay); }, 600);
      }, 3800);
    }

    // Trigger on form submit
    var form = qs('#startForm');
    if (form) {
      form.addEventListener('submit', function () {
        // Wait for success state to appear
        var check = setInterval(function () {
          var success = qs('#formSuccess');
          if (success && (success.offsetHeight > 0 || success.classList.contains('visible') ||
              getComputedStyle(success).display !== 'none')) {
            clearInterval(check);
            playFinish();
          }
        }, 200);
        // Safety timeout
        setTimeout(function () { clearInterval(check); }, 5000);
      });
    }

    // Trigger on passport result becoming visible
    var passportTarget = qs('.passport-result, #passportResult');
    if (passportTarget) {
      var mo = new MutationObserver(function () {
        if (passportTarget.offsetHeight > 0 &&
            getComputedStyle(passportTarget).display !== 'none') {
          playFinish();
          mo.disconnect();
        }
      });
      mo.observe(passportTarget, { attributes: true, attributeFilter: ['class', 'style'] });
      // Also observe parent in case it's added dynamically
      if (passportTarget.parentNode) {
        mo.observe(passportTarget.parentNode, { childList: true, subtree: true });
      }
    }
  }

  /* ================================================================
     INITIALIZATION
     ================================================================ */
  document.addEventListener('DOMContentLoaded', function () {
    initStandardIgnition();  // #1  — Enhance ppf-intro pre-phase
    initTurfPressure();      // #2  — Reactive turf canvas
    initSprintBurst();       // #3  — Speed trail on proof metrics
    initBarLoadTension();    // #4  — Tension line at section entry
    initChalkCloud();        // #5  — Chalk particle burst in paths
    initCoachingInterrupt(); // #6  — Bold coaching command slam
    initRecoveryPulse();     // #7  — Breathing transition at morphs
    initMovementOverlay();   // #8  — SVG arcs on card hover
    initRepLock();           // #9  — CTA brace micro-animation
    initVelocityFailure();   // #10 — Film room hover effects
    initBoardClimb();        // #11 — Competitive metric count-up
    initForceTransfer();     // #12 — Energy particle on trails
    initSessionClock();      // #13 — Viewport compression on work
    initSurfaceShift();      // #14 — Background texture by section
    initLastRep();           // #15 — Completion ceremony
  });

})();
