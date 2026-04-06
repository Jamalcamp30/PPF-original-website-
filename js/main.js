/* =====================================================
   PPF ATHLETICS — FLAGSHIP WEBSITE
   Advanced Animation & Interaction System
   ===================================================== */

(function () {
  'use strict';

  /* ── UTILITY ─────────────────────────────────────── */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, min, max) => Math.min(Math.max(v, min), max);

  /* ── STATE ───────────────────────────────────────── */
  let mouseX = 0, mouseY = 0;
  let cursorX = 0, cursorY = 0;
  let dotX = 0, dotY = 0;
  let scrollY = window.scrollY;
  let lastScrollY = scrollY;
  let workTimerInterval = null;
  const cardTimers = new WeakMap();
  let scrollVelocity = 0;
  let rafId = null;
  let isReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── PPF INTRO — PERFORMANCE SYSTEM BOOT-UP ─────── */
  (function initIntro() {
    const intro      = qs('#ppfIntro');
    const skipBtn    = qs('#introSkip');
    const gridCanvas = qs('#introGridCanvas');

    if (!intro || isReduced) {
      // Skip intro entirely for reduced motion
      if (intro) intro.remove();
      document.body.classList.remove('intro-active');
      return;
    }

    document.body.classList.add('intro-active');

    let introDismissed = false;
    let introTimers = [];

    /* Schedule a function at a delay; track for cleanup */
    function schedule(fn, ms) {
      const id = setTimeout(fn, ms);
      introTimers.push(id);
      return id;
    }

    /* Dismiss intro and hand off to site */
    function dismissIntro() {
      if (introDismissed) return;
      introDismissed = true;
      introTimers.forEach(clearTimeout);
      introTimers = [];

      intro.classList.add('dismissed');
      document.body.classList.remove('intro-active');

      // Remove from DOM after transition
      setTimeout(function () { intro.remove(); }, 700);
    }

    /* Skip button */
    if (skipBtn) {
      skipBtn.addEventListener('click', dismissIntro);
    }

    /* Keyboard skip (Escape or Enter) */
    function onKeySkip(e) {
      if (e.key === 'Escape' || e.key === 'Enter') {
        dismissIntro();
        document.removeEventListener('keydown', onKeySkip);
      }
    }
    document.addEventListener('keydown', onKeySkip);

    /* ── Sensor grid canvas ── */
    if (gridCanvas) {
      var gCtx = gridCanvas.getContext('2d');
      var gW, gH;
      var gridRafId;

      function resizeGrid() {
        gW = gridCanvas.width  = gridCanvas.offsetWidth;
        gH = gridCanvas.height = gridCanvas.offsetHeight;
      }

      function drawIntroGrid() {
        if (introDismissed) return;
        gCtx.clearRect(0, 0, gW, gH);

        var spacing = 50;
        var time = performance.now() * 0.001;

        // Horizontal sensor lines
        for (var y = 0; y < gH; y += spacing) {
          var pulse = 0.02 + 0.015 * Math.sin(time * 2 + y * 0.01);
          gCtx.beginPath();
          gCtx.strokeStyle = 'rgba(255, 85, 0, ' + pulse + ')';
          gCtx.lineWidth = 0.5;
          gCtx.moveTo(0, y);
          gCtx.lineTo(gW, y);
          gCtx.stroke();
        }

        // Vertical calibration marks
        for (var x = 0; x < gW; x += spacing) {
          var pulse2 = 0.015 + 0.01 * Math.sin(time * 1.5 + x * 0.02);
          gCtx.beginPath();
          gCtx.strokeStyle = 'rgba(255, 85, 0, ' + pulse2 + ')';
          gCtx.lineWidth = 0.5;
          gCtx.moveTo(x, 0);
          gCtx.lineTo(x, gH);
          gCtx.stroke();
        }

        // Center crosshair
        var cx = gW / 2, cy = gH / 2;
        var crossAlpha = 0.06 + 0.03 * Math.sin(time * 3);
        gCtx.strokeStyle = 'rgba(255, 85, 0, ' + crossAlpha + ')';
        gCtx.lineWidth = 1;
        gCtx.beginPath();
        gCtx.moveTo(cx - 30, cy);
        gCtx.lineTo(cx + 30, cy);
        gCtx.stroke();
        gCtx.beginPath();
        gCtx.moveTo(cx, cy - 30);
        gCtx.lineTo(cx, cy + 30);
        gCtx.stroke();

        gridRafId = requestAnimationFrame(drawIntroGrid);
      }

      resizeGrid();
      window.addEventListener('resize', resizeGrid);
      drawIntroGrid();
    }

    /* ── Web Audio — synthesized intro sounds ── */
    function playIntroSound(type) {
      try {
        var audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        if (type === 'hum') {
          // Low-frequency sub hum
          var osc = audioCtx.createOscillator();
          var gain = audioCtx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(55, audioCtx.currentTime);
          osc.frequency.linearRampToValueAtTime(80, audioCtx.currentTime + 1.5);
          gain.gain.setValueAtTime(0, audioCtx.currentTime);
          gain.gain.linearRampToValueAtTime(0.08, audioCtx.currentTime + 0.5);
          gain.gain.linearRampToValueAtTime(0.04, audioCtx.currentTime + 1.5);
          gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.5);
          osc.connect(gain);
          gain.connect(audioCtx.destination);
          osc.start();
          osc.stop(audioCtx.currentTime + 2.5);
        }

        if (type === 'snap') {
          // Metallic lock/snap sound
          var bufferSize = audioCtx.sampleRate * 0.15;
          var buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
          var data = buffer.getChannelData(0);
          for (var i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (audioCtx.sampleRate * 0.02));
          }
          var noise = audioCtx.createBufferSource();
          noise.buffer = buffer;

          var filter = audioCtx.createBiquadFilter();
          filter.type = 'bandpass';
          filter.frequency.value = 3500;
          filter.Q.value = 5;

          var snapGain = audioCtx.createGain();
          snapGain.gain.setValueAtTime(0.15, audioCtx.currentTime);
          snapGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);

          noise.connect(filter);
          filter.connect(snapGain);
          snapGain.connect(audioCtx.destination);
          noise.start();
        }

        if (type === 'hit') {
          // Final branded impact hit
          var osc2 = audioCtx.createOscillator();
          var osc3 = audioCtx.createOscillator();
          var hitGain = audioCtx.createGain();

          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(100, audioCtx.currentTime);
          osc2.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.3);

          osc3.type = 'square';
          osc3.frequency.setValueAtTime(200, audioCtx.currentTime);
          osc3.frequency.exponentialRampToValueAtTime(60, audioCtx.currentTime + 0.2);

          hitGain.gain.setValueAtTime(0.12, audioCtx.currentTime);
          hitGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);

          osc2.connect(hitGain);
          osc3.connect(hitGain);
          hitGain.connect(audioCtx.destination);
          osc2.start();
          osc3.start();
          osc2.stop(audioCtx.currentTime + 0.5);
          osc3.stop(audioCtx.currentTime + 0.5);
        }

        if (type === 'rise') {
          // Subtle frequency rise (bars building)
          var oscR = audioCtx.createOscillator();
          var rGain = audioCtx.createGain();
          oscR.type = 'sawtooth';
          oscR.frequency.setValueAtTime(40, audioCtx.currentTime);
          oscR.frequency.linearRampToValueAtTime(120, audioCtx.currentTime + 0.6);
          rGain.gain.setValueAtTime(0, audioCtx.currentTime);
          rGain.gain.linearRampToValueAtTime(0.03, audioCtx.currentTime + 0.1);
          rGain.gain.linearRampToValueAtTime(0.05, audioCtx.currentTime + 0.4);
          rGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.7);
          oscR.connect(rGain);
          rGain.connect(audioCtx.destination);
          oscR.start();
          oscR.stop(audioCtx.currentTime + 0.8);
        }
      } catch (e) {
        // Web Audio not supported — fail silently
      }
    }

    /* ── Animation Sequence ── */
    // Phase 0 (0.0s): Black screen, subtle orange pulse
    schedule(function () {
      intro.classList.add('phase-scanlines');
      playIntroSound('hum');
    }, 100);

    // Phase 1 (0.6s): Orange bars rise like measured output
    schedule(function () {
      intro.classList.add('phase-bars');
      playIntroSound('rise');
    }, 600);

    // Phase 2 (1.0s): Data readouts flicker around logo
    schedule(function () {
      intro.classList.add('phase-data');
    }, 1000);

    // Phase 3 (1.3s): White structural letters snap in
    schedule(function () {
      intro.classList.add('phase-letters');
      playIntroSound('snap');
    }, 1300);

    // Phase 4 (1.7s): Coach voice "LOCK IN!" + impact ring
    schedule(function () {
      intro.classList.add('phase-voice');
      playIntroSound('hit');
    }, 1700);

    // Phase 5 (2.2s): ATHLETICS text + micro band
    schedule(function () {
      intro.classList.add('phase-athletics');
      intro.classList.add('phase-micro');
    }, 2200);

    // Phase 6 (2.6s): Shadow sweep light beam
    schedule(function () {
      intro.classList.add('phase-sweep');
    }, 2600);

    // Phase 7 (3.2s): Final logo glow
    schedule(function () {
      intro.classList.add('phase-glow');
    }, 3200);

    // Phase 8 (4.2s): Dismiss — hand off to hero
    schedule(function () {
      dismissIntro();
    }, 4200);

    // Safety: force dismiss after 6 seconds max
    schedule(function () {
      dismissIntro();
    }, 6000);
  })();

  /* ── CUSTOM CURSOR ───────────────────────────────── */
  const cursorRing = qs('#cursorRing');
  const cursorDot  = qs('#cursorDot');

  const isTouchDevice = () => window.matchMedia('(hover: none)').matches;

  if (!isTouchDevice() && cursorRing && cursorDot) {
    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    document.addEventListener('mousedown', () => cursorRing.classList.add('clicking'));
    document.addEventListener('mouseup',   () => cursorRing.classList.remove('clicking'));

    // Hover effect on interactive elements
    const hoverEls = qsa('a, button, .path-card, .pillar-card, .proof-metric, .story-card, .leader-card');
    hoverEls.forEach(el => {
      el.addEventListener('mouseenter', () => cursorRing.classList.add('hovering'));
      el.addEventListener('mouseleave', () => cursorRing.classList.remove('hovering'));
    });
  } else {
    if (cursorRing) cursorRing.style.display = 'none';
    if (cursorDot)  cursorDot.style.display  = 'none';
    document.body.style.cursor = 'auto';
    qsa('button, a').forEach(el => (el.style.cursor = 'pointer'));
  }

  /* ── NAVIGATION ──────────────────────────────────── */
  const nav = qs('#siteNav');
  const navToggle = qs('#navToggle');
  const navLinks  = qs('#navLinks');

  if (nav) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => {
      const isOpen = navLinks.classList.contains('open');
      navLinks.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', String(!isOpen));
    });

    // Close on link click
    qsa('.nav-link', navLinks).forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── HERO CANVAS — PERFORMANCE GRID ─────────────── */
  const heroCanvas = qs('#heroCanvas');
  if (heroCanvas) {
    const ctx = heroCanvas.getContext('2d');
    let W, H, particles = [], gridLines = [];
    const PARTICLE_COUNT = 80;
    const GRID_SPACING = 60;

    function resize() {
      W = heroCanvas.width  = heroCanvas.offsetWidth;
      H = heroCanvas.height = heroCanvas.offsetHeight;
      initGrid();
    }

    function initGrid() {
      gridLines = [];
      // Horizontal lines
      for (let y = 0; y < H; y += GRID_SPACING) {
        gridLines.push({ x1: 0, y1: y, x2: W, y2: y, type: 'h' });
      }
      // Vertical lines
      for (let x = 0; x < W; x += GRID_SPACING) {
        gridLines.push({ x1: x, y1: 0, x2: x, y2: H, type: 'v' });
      }
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        particles.push({
          x:   Math.random() * W,
          y:   Math.random() * H,
          vx:  (Math.random() - 0.5) * 0.4,
          vy:  (Math.random() - 0.5) * 0.4,
          size: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.4 + 0.1,
          life:  Math.random(),
          speed: Math.random() * 0.5 + 0.2,
        });
      }
    }

    function drawGrid(scrollFactor) {
      gridLines.forEach(line => {
        const dist  = line.type === 'h'
          ? Math.abs(mouseY - line.y1)
          : Math.abs(mouseX - line.x1);
        const maxDist = 200;
        const intensity = Math.max(0, 1 - dist / maxDist);
        const alpha = 0.04 + intensity * 0.06 + scrollFactor * 0.02;

        ctx.beginPath();
        ctx.strokeStyle = `rgba(255, 85, 0, ${alpha})`;
        ctx.lineWidth = 0.5;
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
      });
    }

    function drawParticles() {
      particles.forEach(p => {
        p.x += p.vx * p.speed;
        p.y += p.vy * p.speed;
        p.life += 0.002;

        if (p.x < 0) p.x = W;
        if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H;
        if (p.y > H) p.y = 0;

        const pulse = 0.5 + 0.5 * Math.sin(p.life * Math.PI * 2);
        const a = p.alpha * pulse;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 85, 0, ${a})`;
        ctx.fill();

        // Connection lines to nearby particles (forward-only to avoid O(n²) duplication)
        for (let j = particles.indexOf(p) + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = p.x - other.x;
          if (Math.abs(dx) > 100) continue;
          const dy = p.y - other.y;
          const d  = Math.sqrt(dx * dx + dy * dy);
          if (d < 100) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 85, 0, ${(1 - d / 100) * 0.06})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });
    }

    // Pulse rings from center
    let pulseRings = [];
    function addPulseRing() {
      pulseRings.push({ x: W / 2, y: H / 2, r: 0, alpha: 0.3, speed: 1.5 });
    }

    setInterval(addPulseRing, 3000);
    addPulseRing();

    function drawPulseRings() {
      pulseRings = pulseRings.filter(ring => ring.alpha > 0);
      pulseRings.forEach(ring => {
        ring.r += ring.speed;
        ring.alpha -= 0.003;
        ctx.beginPath();
        ctx.arc(ring.x, ring.y, ring.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(255, 85, 0, ${ring.alpha})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });
    }

    // Speed streak lines (hero momentum)
    let streaks = [];
    function addStreak() {
      streaks.push({
        x: -10,
        y: Math.random() * H,
        w: Math.random() * 120 + 40,
        speed: Math.random() * 4 + 2,
        alpha: Math.random() * 0.15 + 0.05,
      });
    }

    setInterval(addStreak, 600);

    function drawStreaks() {
      streaks = streaks.filter(s => s.x < W + s.w);
      streaks.forEach(s => {
        s.x += s.speed;
        const grad = ctx.createLinearGradient(s.x - s.w, 0, s.x, 0);
        grad.addColorStop(0, `rgba(255, 85, 0, 0)`);
        grad.addColorStop(1, `rgba(255, 85, 0, ${s.alpha})`);
        ctx.beginPath();
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1;
        ctx.moveTo(s.x - s.w, s.y);
        ctx.lineTo(s.x, s.y);
        ctx.stroke();
      });
    }

    function heroLoop() {
      if (!heroCanvas) return;
      ctx.clearRect(0, 0, W, H);

      const scrollFactor = clamp(window.scrollY / H, 0, 1);
      if (isReduced) {
        // Draw minimal grid only
        ctx.clearRect(0, 0, W, H);
        requestAnimationFrame(heroLoop);
        return;
      }

      drawGrid(scrollFactor);
      drawStreaks();
      drawPulseRings();
      drawParticles();

      requestAnimationFrame(heroLoop);
    }

    window.addEventListener('resize', () => { resize(); }, { passive: true });
    resize();
    initParticles();
    heroLoop();
  }

  /* ── SCROLL VELOCITY SYSTEM ──────────────────────── */
  window.addEventListener('scroll', () => {
    const sy = window.scrollY;
    scrollVelocity = Math.abs(sy - lastScrollY);
    lastScrollY = sy;
    scrollY = sy;
  }, { passive: true });

  /* ── INTERSECTION OBSERVER — REVEAL ANIMATIONS ───── */
  const revealEls = qsa('.reveal-up');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* ── ANIMATED NUMBER COUNTERS ────────────────────── */
  function animateCounter(el, target, duration = 1800) {
    const start    = performance.now();
    const startVal = 0;

    function update(now) {
      const elapsed  = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(startVal + (target - startVal) * eased);
      el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  function initCounters(container = document) {
    const counterEls = qsa('[data-target]', container);

    if ('IntersectionObserver' in window) {
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const el     = entry.target;
            const target = parseInt(el.dataset.target, 10);
            animateCounter(el, target);
            obs.unobserve(el);
          }
        });
      }, { threshold: 0.5 });

      counterEls.forEach(el => obs.observe(el));
    } else {
      counterEls.forEach(el => {
        el.textContent = el.dataset.target;
      });
    }
  }

  initCounters();

  /* ── PROOF ENGINE TABS ───────────────────────────── */
  const proofTabs   = qsa('.proof-tab');
  const proofPanels = qsa('.proof-panel');

  function activateProofTab(tabEl) {
    const id = tabEl.dataset.tab;

    proofTabs.forEach(t => t.classList.remove('active'));
    proofPanels.forEach(p => {
      p.classList.remove('active');
      // Reset bar fills
      qsa('.proof-bar-fill', p).forEach(bar => bar.classList.remove('animated'));
    });

    tabEl.classList.add('active');
    const activePanel = qs(`#proof${id.charAt(0).toUpperCase() + id.slice(1)}`);
    if (activePanel) {
      activePanel.classList.add('active');
      // Trigger counter animations
      initCounters(activePanel);
      // Trigger bar fill animations
      setTimeout(() => {
        qsa('.proof-bar-fill', activePanel).forEach(bar => {
          bar.classList.add('animated');
        });
      }, 300);
    }
  }

  proofTabs.forEach(tab => {
    tab.addEventListener('click', () => activateProofTab(tab));
  });

  // Auto-animate bars when proof section enters viewport
  const proofSection = qs('#proof');
  if (proofSection && 'IntersectionObserver' in window) {
    const proofObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          qsa('.proof-panel.active .proof-bar-fill').forEach(bar => {
            bar.classList.add('animated');
          });
          proofObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    proofObs.observe(proofSection);
  }

  /* ── INSIDE THE ROOM — SESSION SIMULATOR ─────────── */
  const roomTrack    = qs('#roomTrack');
  const roomStages   = qsa('.room-stage');
  const roomDots     = qsa('.room-dot');
  const roomPrevBtn  = qs('#roomPrev');
  const roomNextBtn  = qs('#roomNext');
  let currentStage   = 0;

  function goToStage(index) {
    const total = roomStages.length;
    index = ((index % total) + total) % total;

    roomStages.forEach((s, i) => s.classList.toggle('active', i === index));
    roomDots.forEach((d, i)   => d.classList.toggle('active', i === index));
    currentStage = index;

    // Start work timer animation
    if (index === 3) startWorkTimer();

    // Update progress tracker
    updateRoomProgress(index);
  }

  function updateRoomProgress(index) {
    const rptStagesLocal = qsa('.rpt-stage');
    const rptLinesLocal = qsa('.rpt-line-fill');
    rptStagesLocal.forEach((stage, i) => {
      stage.classList.remove('active', 'completed');
      if (i < index) stage.classList.add('completed');
      if (i === index) stage.classList.add('active');
    });
    rptLinesLocal.forEach((line, i) => {
      line.style.width = i < index ? '100%' : '0%';
    });
  }

  if (roomPrevBtn) roomPrevBtn.addEventListener('click', () => goToStage(currentStage - 1));
  if (roomNextBtn) roomNextBtn.addEventListener('click', () => goToStage(currentStage + 1));

  roomDots.forEach((dot, i) => {
    dot.addEventListener('click', () => goToStage(i));
  });

  // Work timer
  function startWorkTimer() {
    const timerEl = qs('#rvTimer');
    if (!timerEl) return;
    let seconds = 45;
    clearInterval(workTimerInterval);
    workTimerInterval = setInterval(() => {
      seconds = seconds <= 0 ? 45 : seconds - 1;
      timerEl.textContent = `00:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // Keyboard navigation for room
  document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight') goToStage(currentStage + 1);
    if (e.key === 'ArrowLeft')  goToStage(currentStage - 1);
  });

  /* ── PATH CARDS — INTERACTIVE HOVER SYSTEM ─────── */
  const pathCards = qsa('.path-card');

  pathCards.forEach(card => {
    card.addEventListener('mouseenter', function () {
      const path = this.dataset.path;
      this.style.zIndex = '10';

      // Animate motion timer for athlete
      if (path === 'athlete') {
        startAthleteTimer(this);
      }
    });

    card.addEventListener('mouseleave', function () {
      this.style.zIndex = '';
    });
  });

  function startAthleteTimer(card) {
    const timerEl = qs('.motion-timer', card);
    if (!timerEl) return;
    let ms = 0;
    clearInterval(cardTimers.get(card));
    const interval = setInterval(() => {
      ms += 10;
      const s   = Math.floor(ms / 1000) % 60;
      const m   = Math.floor(ms / 60000);
      const msD = ms % 1000;
      timerEl.textContent =
        `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${Math.floor(msD / 10).toString().padStart(2, '0')}`;
    }, 10);
    cardTimers.set(card, interval);
  }

  /* ── FORM SUBMISSION ─────────────────────────────── */
  const startForm    = qs('#startForm');
  const formSuccess  = qs('#formSuccess');

  if (startForm) {
    startForm.addEventListener('submit', function (e) {
      e.preventDefault();

      const firstName = qs('#firstName', this);
      const email     = qs('#email', this);
      let valid = true;

      // Simple validation
      [firstName, email].forEach(field => {
        if (!field.value.trim()) {
          field.style.borderColor = '#ff3300';
          valid = false;
        } else {
          field.style.borderColor = '';
        }
      });

      if (!valid) return;

      // Simulate submission
      const submitBtn = qs('[type="submit"]', this);
      if (submitBtn) {
        submitBtn.disabled = true;
        const btnText = qs('span', submitBtn);
        if (btnText) btnText.textContent = 'Sending…';
      }

      setTimeout(() => {
        if (formSuccess) {
          formSuccess.classList.add('visible');
          formSuccess.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        startForm.reset();
        if (submitBtn) {
          submitBtn.disabled = false;
          const btnText = qs('span', submitBtn);
          if (btnText) btnText.textContent = 'Claim My 3-Day Pass';
        }
      }, 1000);
    });

    // Live border feedback on input
    qsa('.form-input', startForm).forEach(input => {
      input.addEventListener('focus', function () {
        this.style.borderColor = '';
      });
    });
  }

  /* ── RAF LOOP — CURSOR + SMOOTH SCROLL ───────────── */
  function rafLoop() {
    if (!isTouchDevice() && cursorRing && cursorDot) {
      // Smooth cursor following
      cursorX = lerp(cursorX, mouseX, 0.12);
      cursorY = lerp(cursorY, mouseY, 0.12);
      dotX    = lerp(dotX, mouseX, 0.8);
      dotY    = lerp(dotY, mouseY, 0.8);

      cursorRing.style.left = `${cursorX}px`;
      cursorRing.style.top  = `${cursorY}px`;
      cursorDot.style.left  = `${dotX}px`;
      cursorDot.style.top   = `${dotY}px`;
    }

    // Scroll velocity decay
    scrollVelocity *= 0.85;

    requestAnimationFrame(rafLoop);
  }

  rafLoop();

  /* ── NAV ACTIVE STATE ON SCROLL ──────────────────── */
  const sections = qsa('section[id]');
  const navLinksEls = qsa('.nav-link[href^="#"]');

  function updateActiveNav() {
    const scrollMid = window.scrollY + window.innerHeight * 0.4;
    let current = '';

    sections.forEach(section => {
      if (section.offsetTop <= scrollMid) {
        current = section.getAttribute('id');
      }
    });

    navLinksEls.forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', updateActiveNav, { passive: true });
  updateActiveNav();

  /* ── PILLAR CARDS STAGGER ENTRANCE ──────────────── */
  const pillarCards = qsa('.pillar-card');
  if ('IntersectionObserver' in window) {
    const pillarObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 100);
          pillarObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    pillarCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
      card.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      pillarObs.observe(card);
    });
  }

  /* ── EXPERIENCE DAYS ACTIVATION SEQUENCE ─────────── */
  const experienceDays = qsa('.experience-day');
  if ('IntersectionObserver' in window) {
    const expObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const day = entry.target;
          const dayNum = day.dataset.day;
          setTimeout(() => {
            day.style.opacity = '1';
            day.style.transform = 'translateY(0)';
            // Highlight day number
            const numEl = qs('.day-num', day);
            if (numEl) {
              numEl.style.textShadow = `0 0 30px rgba(255, 85, 0, 0.5)`;
            }
          }, (dayNum - 1) * 200);
          expObs.unobserve(day);
        }
      });
    }, { threshold: 0.3 });

    experienceDays.forEach(day => {
      day.style.opacity = '0';
      day.style.transform = 'translateY(20px)';
      day.style.transition = 'opacity 0.8s cubic-bezier(0.16,1,0.3,1), transform 0.8s cubic-bezier(0.16,1,0.3,1)';
      expObs.observe(day);
    });
  }

  /* ── LEADER CARDS ENTRANCE ───────────────────────── */
  const leaderCards = qsa('.leader-card');
  if ('IntersectionObserver' in window) {
    const leaderObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateX(0)';
          }, i * 150);
          leaderObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    leaderCards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = i % 2 === 0 ? 'translateX(-30px)' : 'translateX(30px)';
      card.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
      leaderObs.observe(card);
    });
  }

  /* ── PROOF STORY CARDS ENTRANCE ─────────────────── */
  const storyCards = qsa('.story-card');
  if ('IntersectionObserver' in window) {
    const storyObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 100);
          storyObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    storyCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      storyObs.observe(card);
    });
  }

  /* ── PATH CARDS ENTRANCE ─────────────────────────── */
  if ('IntersectionObserver' in window) {
    const pathObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 150);
          pathObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    pathCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(40px)';
      card.style.transition = 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)';
      pathObs.observe(card);
    });
  }

  /* ── SECTION TITLE SPLIT TEXT ANIMATION ─────────── */
  function splitAndAnimateTitles() {
    const titles = qsa('.section-title');
    titles.forEach(title => {
      // We don't split every title to preserve HTML structure,
      // just add the animation class via IntersectionObserver
      if ('IntersectionObserver' in window) {
        const obs = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('animated');
              obs.unobserve(entry.target);
            }
          });
        }, { threshold: 0.3 });
        obs.observe(title);
      }
    });
  }

  splitAndAnimateTitles();

  /* ── PROOF METRIC HOVER GLOW ─────────────────────── */
  const proofMetrics = qsa('.proof-metric');
  proofMetrics.forEach(metric => {
    metric.addEventListener('mouseenter', function () {
      const numEl = qs('.proof-num', this);
      if (numEl) {
        numEl.style.textShadow = '0 0 20px rgba(255, 85, 0, 0.5)';
        numEl.style.color = '#ff7730';
      }
    });
    metric.addEventListener('mouseleave', function () {
      const numEl = qs('.proof-num', this);
      if (numEl) {
        numEl.style.textShadow = '';
        numEl.style.color = '';
      }
    });
  });

  /* ── SMOOTH ANCHOR SCROLL ────────────────────────── */
  qsa('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = qs(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - (window.innerWidth > 900 ? 72 : 60);
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ── TYPING EFFECT FOR HERO EYEBROW ──────────────── */
  const eyebrowText = qs('.eyebrow-text');
  if (eyebrowText && !isReduced) {
    const originalText = eyebrowText.textContent;
    eyebrowText.textContent = '';
    let charIndex = 0;

    setTimeout(() => {
      const typeInterval = setInterval(() => {
        if (charIndex < originalText.length) {
          eyebrowText.textContent += originalText[charIndex];
          charIndex++;
        } else {
          clearInterval(typeInterval);
        }
      }, 50);
    }, 800);
  }

  /* ── PARALLAX — SUBTLE DEPTH ON SCROLL ───────────── */
  if (!isReduced) {
    const heroContent = qs('.hero-content');
    const heroMetrics = qs('.hero-metrics');

    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      if (sy < window.innerHeight) {
        if (heroContent) {
          heroContent.style.transform = `translateY(${sy * 0.15}px)`;
          heroContent.style.opacity = `${1 - sy / (window.innerHeight * 0.8)}`;
        }
        if (heroMetrics) {
          heroMetrics.style.transform = `translateY(${sy * 0.05}px)`;
        }
      }
    }, { passive: true });
  }

  /* ── FOOTER AMBIENT REVEAL ───────────────────────── */
  const footer = qs('.site-footer');
  if (footer && 'IntersectionObserver' in window) {
    const footerObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          footer.classList.add('visible');

          qsa('.footer-nav-list a', footer).forEach((link, i) => {
            link.style.opacity = '0';
            link.style.transform = 'translateY(8px)';
            link.style.transition = `opacity 0.5s ease ${i * 0.04}s, transform 0.5s ease ${i * 0.04}s`;
            setTimeout(() => {
              link.style.opacity = '';
              link.style.transform = '';
            }, 100);
          });

          footerObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    footerObs.observe(footer);
  }

  /* ── SECTION TRANSITION INTENSITY ───────────────── */
  // Adjust animation speed based on scroll velocity
  if (!isReduced) {
    window.addEventListener('scroll', () => {
      const velocity = clamp(scrollVelocity, 0, 30);
      const intensity = velocity / 30;

      document.documentElement.style.setProperty(
        '--scroll-intensity',
        intensity.toFixed(3)
      );
    }, { passive: true });
  }

  /* ── PERFORMANCE TICKER (footer/hero supplement) ─── */
  const tickerData = [
    '20+ Years of Elite Coaching',
    '500+ Athletes Developed',
    'Three Performance Paths',
    'One Coaching Standard',
    'Claim Your 3-Day Pass',
  ];

  // Simple data availability — no visible ticker DOM element needed
  // (keeping as data for potential use)

  /* ── PATH CARD TOUCH SUPPORT ─────────────────────── */
  if (isTouchDevice()) {
    pathCards.forEach(card => {
      card.addEventListener('click', function () {
        const isActive = this.classList.contains('touch-active');
        pathCards.forEach(c => c.classList.remove('touch-active'));
        if (!isActive) this.classList.add('touch-active');
      });
    });

    // Add touch-active styles
    const style = document.createElement('style');
    style.textContent = `
      .path-card.touch-active .path-desc,
      .path-card.touch-active .path-highlights { display: block; opacity: 1; }
      .path-card.touch-active .path-highlights { display: flex; opacity: 1; }
      .path-card.touch-active .path-cta { opacity: 1; transform: none; }
      .path-card.touch-active .path-motion-layer { opacity: 1; }
    `;
    document.head.appendChild(style);
  }

  /* ── FAQ ACCORDION ──────────────────────────────────── */
  const faqItems = qsa('.faq-item');
  faqItems.forEach(item => {
    const questionBtn = qs('.faq-question', item);
    if (questionBtn) {
      questionBtn.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all other FAQ items
        faqItems.forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            const otherBtn = qs('.faq-question', other);
            if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        item.classList.toggle('open');
        questionBtn.setAttribute('aria-expanded', String(!isOpen));
      });
    }
  });

  /* ── TRUST MARKERS ENTRANCE ─────────────────────────── */
  const trustItems = qsa('.trust-item');
  if ('IntersectionObserver' in window) {
    const trustObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 80);
          trustObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    trustItems.forEach(item => {
      item.style.opacity = '0';
      item.style.transform = 'translateY(15px)';
      item.style.transition = 'opacity 0.6s cubic-bezier(0.16,1,0.3,1), transform 0.6s cubic-bezier(0.16,1,0.3,1)';
      trustObs.observe(item);
    });
  }

  /* ── MEMBERSHIP TABS ────────────────────────────────── */
  const membershipTabs = qsa('.membership-tab');
  const membershipPanels = qsa('.membership-panel');

  membershipTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.mtab;

      membershipTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      membershipPanels.forEach(panel => {
        panel.classList.remove('active');
      });

      if (target === 'pt') {
        qs('#membershipPT').classList.add('active');
      } else {
        qs('#membershipGeneral').classList.add('active');
      }
    });
  });

  /* ── MEMBERSHIP CARD HOVER REACTOR ─────────────────── */
  const membershipCards = qsa('.membership-card');
  membershipCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const tier = card.dataset.tier;
      let glowIntensity = '0.06';
      let borderIntensity = '0.25';

      if (tier === 'quarterly') { glowIntensity = '0.10'; borderIntensity = '0.35'; }
      if (tier === 'semiannual') { glowIntensity = '0.12'; borderIntensity = '0.4'; }
      if (tier === 'yearly') { glowIntensity = '0.15'; borderIntensity = '0.5'; }

      card.style.boxShadow = `0 12px 40px rgba(255, 85, 0, ${glowIntensity})`;
      card.style.borderColor = `rgba(255, 85, 0, ${borderIntensity})`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
      card.style.borderColor = '';
    });
  });

  /* ── PT PACKAGE HOVER ──────────────────────────────── */
  const ptPackages = qsa('.pt-package');
  ptPackages.forEach(pkg => {
    pkg.addEventListener('mouseenter', () => {
      pkg.style.boxShadow = '0 12px 40px rgba(255, 85, 0, 0.1)';
    });
    pkg.addEventListener('mouseleave', () => {
      pkg.style.boxShadow = '';
    });
  });

  /* ── COMMITMENT TIMELINE ANIMATION ─────────────────── */
  const ctStages = qsa('.ct-stage');
  if ('IntersectionObserver' in window && ctStages.length) {
    const ctObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.ct-fill');
          if (fill) {
            setTimeout(() => {
              fill.style.width = getComputedStyle(fill).getPropertyValue('--fill-width');
            }, 300);
          }
          ctObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    ctStages.forEach(stage => {
      const fill = stage.querySelector('.ct-fill');
      if (fill) fill.style.width = '0%';
      ctObs.observe(stage);
    });
  }

  /* ── SOCIAL CARD HOVER EFFECTS ─────────────────────── */
  const socialCards = qsa('.social-card');
  socialCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const arrow = card.querySelector('.social-card-arrow');
      if (arrow) arrow.style.transform = 'translateX(4px)';
    });
    card.addEventListener('mouseleave', () => {
      const arrow = card.querySelector('.social-card-arrow');
      if (arrow) arrow.style.transform = '';
    });
  });

  /* ── CONTACT COMMAND CENTER ENTRANCE ───────────────── */
  const cccCards = qsa('.ccc-location, .ccc-contact-card');
  if ('IntersectionObserver' in window) {
    const cccObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 120);
          cccObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    cccCards.forEach(card => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(20px)';
      card.style.transition = 'opacity 0.7s cubic-bezier(0.16,1,0.3,1), transform 0.7s cubic-bezier(0.16,1,0.3,1)';
      cccObs.observe(card);
    });
  }

  /* ── INITIALIZATION LOG ──────────────────────────── */
  console.log(
    '%cPPF Athletics — Three Paths. One Standard.',
    'color: #ff5500; font-family: system-ui; font-size: 14px; font-weight: bold;'
  );

  /* ── HERO SCROLL COMPRESSION ─────────────────────── */
  const heroSection = qs('#hero');
  if (heroSection && !isReduced) {
    window.addEventListener('scroll', () => {
      const sy = window.scrollY;
      const heroH = heroSection.offsetHeight;
      if (sy > heroH * 0.3) {
        heroSection.classList.add('compressed');
      } else {
        heroSection.classList.remove('compressed');
      }
    }, { passive: true });
  }

  /* ── HERO MICRO-DATA LIVE UPDATE ─────────────────── */
  const microReaction = qs('#microReaction');
  const microOutput = qs('#microOutput');
  if (microReaction && microOutput && !isReduced) {
    setInterval(() => {
      const r = (38 + Math.random() * 8).toFixed(0);
      microReaction.textContent = r + 'ms';
      const o = (90 + Math.random() * 9).toFixed(0);
      microOutput.textContent = o + '%';
    }, 2500);
  }

  /* ── LIVE METRIC STRIP ───────────────────────────── */
  const liveMetricStrip = qs('#liveMetricStrip');
  const lmsTrack = qs('#lmsTrack');
  if (liveMetricStrip && lmsTrack) {
    // Generate marquee content dynamically (duplicated for seamless loop)
    const metrics = [
      '<strong>20+</strong> Years Coaching',
      '<strong>500+</strong> Athletes Developed',
      '<strong>NSCA</strong> Certified Coaches',
      '<strong>85%</strong> Member Retention',
      '<strong>&lt;12hr</strong> Response Time',
      '<strong>3</strong> Performance Paths',
      '<strong>95%</strong> Return-to-Play',
    ];
    const fragment = document.createDocumentFragment();
    for (let rep = 0; rep < 2; rep++) {
      metrics.forEach(m => {
        const item = document.createElement('span');
        item.className = 'lms-item';
        item.innerHTML = m;
        fragment.appendChild(item);
        const div = document.createElement('span');
        div.className = 'lms-divider';
        div.textContent = '\u25C6';
        fragment.appendChild(div);
      });
    }
    lmsTrack.appendChild(fragment);

    let stripShown = false;
    window.addEventListener('scroll', () => {
      if (window.scrollY > 300 && !stripShown) {
        liveMetricStrip.classList.add('visible');
        stripShown = true;
      } else if (window.scrollY <= 300 && stripShown) {
        liveMetricStrip.classList.remove('visible');
        stripShown = false;
      }
    }, { passive: true });
  }

  /* ── COACH CUE HUD ──────────────────────────────── */
  const coachHud = qs('#coachHud');
  const hudPhase = qs('#hudPhase');
  const hudCue = qs('#hudCue');
  const hudProgressFill = qs('#hudProgressFill');
  const hudPath = qs('#hudPath');

  const hudSections = [
    { id: 'standard', phase: 'THE STANDARD', cues: ['COACHING', 'STRUCTURE', 'ENVIRONMENT', 'PROOF'], path: 'ALL PATHS' },
    { id: 'paths', phase: 'CHOOSE YOUR PATH', cues: ['ATHLETE', 'ADULT', 'INTEGRATED'], path: 'ALL PATHS' },
    { id: 'proof', phase: 'PROOF ENGINE', cues: ['VERIFIED', 'MEASURED', 'DOCUMENTED'], path: 'ALL PATHS' },
    { id: 'room', phase: 'INSIDE THE ROOM', cues: ['HIPS BACK', 'DRIVE THROUGH', 'FINISH TALL'], path: 'ALL PATHS' },
    { id: 'leadership', phase: 'LEADERSHIP', cues: ['STANDARD', 'PROTECT', 'COACH'], path: 'ALL PATHS' },
    { id: 'experience', phase: '3-DAY EXPERIENCE', cues: ['ASSESS', 'TRAIN', 'PLACE'], path: 'ALL PATHS' },
  ];

  if (coachHud && hudPhase && hudCue && hudProgressFill && !isReduced) {
    let currentHudSection = null;
    let cueInterval = null;

    function updateHud() {
      const scrollMid = window.scrollY + window.innerHeight * 0.5;
      let activeSection = null;

      for (const sec of hudSections) {
        const el = qs(`#${sec.id}`);
        if (el) {
          const top = el.offsetTop;
          const bot = top + el.offsetHeight;
          if (scrollMid >= top && scrollMid <= bot) {
            activeSection = sec;
            const progress = ((scrollMid - top) / (bot - top)) * 100;
            hudProgressFill.style.width = Math.min(progress, 100) + '%';
            break;
          }
        }
      }

      if (activeSection && activeSection.id !== currentHudSection) {
        currentHudSection = activeSection.id;
        hudPhase.textContent = activeSection.phase;
        if (hudPath) hudPath.textContent = activeSection.path;
        coachHud.classList.add('visible');

        // Rotate cues
        let cueIdx = 0;
        clearInterval(cueInterval);
        hudCue.textContent = activeSection.cues[0] || '';
        cueInterval = setInterval(() => {
          cueIdx = (cueIdx + 1) % activeSection.cues.length;
          hudCue.textContent = activeSection.cues[cueIdx];
        }, 2000);
      } else if (!activeSection) {
        coachHud.classList.remove('visible');
        currentHudSection = null;
        clearInterval(cueInterval);
      }
    }

    window.addEventListener('scroll', updateHud, { passive: true });
  }

  /* ── SECTION TRANSITIONS — SCROLL TRIGGER ────────── */
  const sectionTransitions = qsa('.section-transition');
  if ('IntersectionObserver' in window) {
    const stObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animated');
          stObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    sectionTransitions.forEach(st => stObs.observe(st));
  }

  /* ── PATH CARDS — LANE LOCK + AMBIENT GLOW ─────── */
  const pathsAmbient = qs('#pathsAmbient');

  pathCards.forEach(card => {
    // Ambient lighting shift
    card.addEventListener('mouseenter', function () {
      const path = this.dataset.path;
      if (pathsAmbient) {
        if (path === 'athlete') {
          pathsAmbient.style.background = 'radial-gradient(ellipse 50% 50% at 17% 50%, rgba(255, 85, 0, 0.06) 0%, transparent 100%)';
        } else if (path === 'adult') {
          pathsAmbient.style.background = 'radial-gradient(ellipse 50% 50% at 50% 50%, rgba(100, 140, 255, 0.06) 0%, transparent 100%)';
        } else if (path === 'integrated') {
          pathsAmbient.style.background = 'radial-gradient(ellipse 50% 50% at 83% 50%, rgba(80, 200, 120, 0.06) 0%, transparent 100%)';
        }
      }
    });

    card.addEventListener('mouseleave', function () {
      if (pathsAmbient) {
        pathsAmbient.style.background = 'none';
      }
    });

    // Lane lock on CTA click
    const cta = qs('.path-cta', card);
    if (cta) {
      cta.addEventListener('click', function (e) {
        const lockOverlay = qs('.lane-lock-overlay', card);
        if (lockOverlay) {
          e.preventDefault();
          lockOverlay.classList.add('active');
          setTimeout(() => {
            lockOverlay.classList.remove('active');
            // Navigate to start section
            const target = qs('#start');
            if (target) {
              const top = target.getBoundingClientRect().top + window.scrollY - 72;
              window.scrollTo({ top, behavior: 'smooth' });
            }
          }, 1200);
        }
      });
    }
  });

  /* ── PROOF ENGINE — VERIFIED STAMPS ──────────────── */
  const storyCardsAll = qsa('.story-card');
  storyCardsAll.forEach(card => {
    // Add verified stamp if not already present
    if (!qs('.verified-stamp', card)) {
      const stamp = document.createElement('div');
      stamp.className = 'verified-stamp';
      stamp.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> VERIFIED';
      card.appendChild(stamp);
    }
  });

  // Pulse verified stamps when they enter viewport
  if ('IntersectionObserver' in window) {
    const stampObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const stamp = qs('.verified-stamp', entry.target);
          if (stamp) {
            setTimeout(() => stamp.classList.add('pulsed'), 400);
          }
          stampObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    storyCardsAll.forEach(card => stampObs.observe(card));
  }

  /* ── PROOF ENGINE — CIRCULAR PROGRESS ────────────── */
  const proofMetricEls = qsa('.proof-metric');
  proofMetricEls.forEach(metric => {
    const bar = qs('.proof-bar-fill', metric);
    if (bar) {
      const fillVal = bar.style.getPropertyValue('--fill');
      if (fillVal) {
        const pct = parseInt(fillVal, 10);
        // Add circular progress indicator
        const circle = document.createElement('div');
        circle.className = 'proof-metric-circle';
        const offset = 100 - pct;
        circle.style.setProperty('--circle-offset', offset);
        circle.innerHTML = `<svg viewBox="0 0 36 36"><circle class="circle-bg" cx="18" cy="18" r="16"/><circle class="circle-fill" cx="18" cy="18" r="16" pathLength="100"/></svg>`;
        metric.appendChild(circle);
      }
    }
  });

  // Animate circles when proof section enters viewport
  if (proofSection && 'IntersectionObserver' in window) {
    const circleObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          qsa('.proof-metric-circle', entry.target).forEach(c => {
            setTimeout(() => c.classList.add('animated'), 600);
          });
          circleObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });
    circleObs.observe(proofSection);
  }

  /* ── ROOM — PROGRESS TRACKER (already integrated into goToStage) ── */

  /* ── LEADERSHIP — CREDENTIAL ROLL ANIMATION ─────── */
  const leaderCardsEls = qsa('.leader-card');
  if ('IntersectionObserver' in window) {
    const leaderCredsObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('creds-visible');
          }, 300);
          leaderCredsObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    leaderCardsEls.forEach(card => leaderCredsObs.observe(card));
  }

  /* ── TRUST MARKERS — DRAW-ON EFFECT ──────────────── */
  const trustItemsEls = qsa('.trust-item');
  if ('IntersectionObserver' in window) {
    const drawOnObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.classList.add('drawn-on');
          }, i * 150);
          drawOnObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    trustItemsEls.forEach(item => drawOnObs.observe(item));
  }

  /* ── 3-DAY EXPERIENCE — SNAP + ROADMAP ───────────── */
  const expDays = qsa('.experience-day');
  const expCta = qs('.experience-cta');
  if ('IntersectionObserver' in window && expDays.length) {
    let allDaysSnapped = 0;

    const snapObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const day = entry.target;
          setTimeout(() => {
            day.classList.add('snapped');
            allDaysSnapped++;

            // After all 3 days snap, draw roadmap
            if (allDaysSnapped >= 3 && expCta) {
              setTimeout(() => {
                expCta.classList.add('roadmap-active');
              }, 400);
            }
          }, (parseInt(day.dataset.day, 10) - 1) * 300);

          snapObs.unobserve(day);
        }
      });
    }, { threshold: 0.4 });

    expDays.forEach(day => snapObs.observe(day));
  }

  /* ── SMART CTA — DIRECTIONAL PULL ────────────────── */
  const smartCtas = qsa('.btn-smart-cta');
  smartCtas.forEach(btn => {
    btn.addEventListener('mousemove', function (e) {
      const rect = this.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / rect.width;
      const dy = (e.clientY - cy) / rect.height;
      this.style.transform = `translate(${dx * 4}px, ${dy * 2}px)`;
    });

    btn.addEventListener('mouseleave', function () {
      this.style.transform = '';
    });

    // Click burst
    btn.addEventListener('click', function () {
      const readyLabel = qs('.btn-cta-ready', this);
      if (readyLabel) {
        readyLabel.textContent = 'SENT ✓';
        setTimeout(() => {
          readyLabel.textContent = 'READY';
        }, 2000);
      }
    });
  });

  /* ── PROGRESSIVE FOCUS MODE ──────────────────────── */
  const focusableCards = qsa('.path-card, .proof-metric, .membership-card, .leader-card');
  if (!isTouchDevice()) {
    focusableCards.forEach(card => {
      card.addEventListener('mouseenter', function () {
        const section = this.closest('.section');
        if (section) {
          document.body.classList.add('focus-mode');
          section.classList.add('focus-target');
        }
      });

      card.addEventListener('mouseleave', function () {
        const section = this.closest('.section');
        if (section) {
          document.body.classList.remove('focus-mode');
          section.classList.remove('focus-target');
        }
      });
    });
  }

  /* ── PERFORMANCE REPLAY MODE ─────────────────────── */
  // Adds a replay trigger to re-run hero animations without page reload
  let replayEnabled = false;
  document.addEventListener('keydown', (e) => {
    if (e.key === 'r' && e.altKey && e.shiftKey) {
      e.preventDefault();
      replayHeroAnimations();
    }
  });

  function replayHeroAnimations() {
    const headline = qs('.hero-headline');
    const words = qsa('.headline-word');
    const eyebrow = qs('.hero-eyebrow');
    const sub = qs('.hero-sub');
    const actions = qs('.hero-actions');
    const metrics = qs('.hero-metrics');

    // Reset
    [eyebrow, sub, actions, metrics].forEach(el => {
      if (el) {
        el.style.animation = 'none';
        void el.offsetHeight; // Force reflow
        el.style.animation = '';
      }
    });

    words.forEach(word => {
      word.style.animation = 'none';
      void word.offsetHeight;
      word.style.animation = '';
    });

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

})();
