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

  /* ── BATCHED SCROLL SYSTEM ───────────────────────── */
  const scrollHandlers = [];
  let scrollRafPending = false;

  function registerScrollHandler(fn) {
    scrollHandlers.push(fn);
  }

  window.addEventListener('scroll', () => {
    if (!scrollRafPending) {
      scrollRafPending = true;
      requestAnimationFrame(() => {
        scrollHandlers.forEach(fn => fn());
        scrollRafPending = false;
      });
    }
  }, { passive: true });

  /* ══════════════════════════════════════════════════════
     PPF INTRO — THE STANDARD ACTIVATES
     Ultimate opening: 9 concepts fused into one iconic sequence
     ══════════════════════════════════════════════════════ */
  (function initIntro() {
    var intro    = qs('#ppfIntro');
    var skipBtn  = qs('#introSkip');
    var canvas   = qs('#introCanvas');

    if (!intro || isReduced) {
      if (intro) intro.remove();
      document.body.classList.remove('intro-active');
      return;
    }

    document.body.classList.add('intro-active');

    var introDismissed = false;
    var introTimers = [];
    var canvasRafId = null;
    var ctx = canvas ? canvas.getContext('2d') : null;
    var W = 0, H = 0;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);

    function schedule(fn, ms) {
      var id = setTimeout(fn, ms);
      introTimers.push(id);
      return id;
    }

    function dismissIntro() {
      if (introDismissed) return;
      introDismissed = true;
      introTimers.forEach(clearTimeout);
      introTimers = [];
      if (canvasRafId) cancelAnimationFrame(canvasRafId);
      window.removeEventListener('resize', resizeCanvas);
      document.removeEventListener('keydown', onKeySkip);

      intro.classList.add('dismissed');
      document.body.classList.remove('intro-active');
      setTimeout(function () { intro.remove(); }, 800);
    }

    if (skipBtn) skipBtn.addEventListener('click', dismissIntro);
    function onKeySkip(e) {
      if (e.key === 'Escape' || e.key === 'Enter') dismissIntro();
    }
    document.addEventListener('keydown', onKeySkip);

    /* ── Canvas sizing ── */
    function resizeCanvas() {
      if (!canvas) return;
      W = canvas.offsetWidth;
      H = canvas.offsetHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    /* ═══════════════════════════════════════════════════
       PARTICLE SYSTEM — Chalk, dust, debris
       ═══════════════════════════════════════════════════ */
    var particles = [];
    var MAX_PARTICLES = 600;

    /* Sprint-line chalk kick: particles blast diagonally backward from foot strike */
    function spawnStrikeChalk(originX, originY, count) {
      for (var i = 0; i < count; i++) {
        var baseAngle = -Math.PI * 0.25 + (Math.random() - 0.5) * Math.PI * 0.7;
        var speed = 2 + Math.random() * 10;
        var size = 0.4 + Math.random() * 3;
        var isLarge = Math.random() < 0.12;
        if (isLarge) { size = 3 + Math.random() * 5; speed *= 0.5; }
        particles.push({
          x: originX + (Math.random() - 0.5) * 40,
          y: originY + (Math.random() - 0.5) * 25,
          vx: Math.cos(baseAngle) * speed,
          vy: Math.sin(baseAngle) * speed,
          size: size,
          life: 1,
          decay: 0.003 + Math.random() * 0.007,
          alpha: 0.35 + Math.random() * 0.55,
          tx: 0, ty: 0,
          captured: false,
          captureDelay: 0.6 + Math.random() * 1.0,
          colorPhase: 0,
          isTrail: Math.random() < 0.35,
          isOrangeHint: Math.random() < 0.08
        });
      }
      if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    }

    /* Palm strike burst */
    function spawnPalmChalk(cx, cy, count) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 1.5 + Math.random() * 5;
        particles.push({
          x: cx + (Math.random() - 0.5) * 50,
          y: cy + (Math.random() - 0.5) * 50,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0.4 + Math.random() * 2,
          life: 1,
          decay: 0.015 + Math.random() * 0.02,
          alpha: 0.25 + Math.random() * 0.4,
          tx: 0, ty: 0,
          captured: false, captureDelay: 99,
          colorPhase: 0, isTrail: false, isOrangeHint: false
        });
      }
      if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    }

    /* Impact shockwave particles */
    function spawnImpactRipple(cx, cy, count) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = 0.5 + Math.random() * 2;
        particles.push({
          x: cx + Math.cos(angle) * 20,
          y: cy + Math.sin(angle) * 10,
          vx: Math.cos(angle) * speed * 0.3,
          vy: -0.3 - Math.random() * 0.8,
          size: 0.3 + Math.random() * 1.5,
          life: 1,
          decay: 0.01 + Math.random() * 0.015,
          alpha: 0.15 + Math.random() * 0.3,
          tx: 0, ty: 0,
          captured: false, captureDelay: 99,
          colorPhase: 2, isTrail: false, isOrangeHint: Math.random() < 0.15
        });
      }
    }

    /* ═══════════════════════════════════════════════════
       CHALK STREAK — the violent diagonal rip
       ═══════════════════════════════════════════════════ */
    var streak = { progress: 0, alpha: 0, dustAlpha: 0 };

    function drawChalkStreak(progress, alpha) {
      if (alpha <= 0 || progress <= 0) return;
      ctx.save();

      var x1 = W * 0.06;
      var y1 = H * 0.84;
      var x2 = W * 0.94;
      var y2 = H * 0.16;
      var cx = x1 + (x2 - x1) * progress;
      var cy = y1 + (y2 - y1) * progress;

      var segs = Math.max(6, Math.floor(progress * 24));

      /* Outer glow — dirty chalk texture */
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(210, 205, 195, ' + (alpha * 0.12) + ')';
      ctx.lineWidth = 32;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (var i = 1; i <= segs; i++) {
        var t = i / segs;
        if (t > progress) break;
        ctx.lineTo(
          x1 + (x2 - x1) * t + Math.sin(i * 4.7) * 3.5,
          y1 + (y2 - y1) * t + Math.cos(i * 3.3) * 2.5
        );
      }
      ctx.stroke();

      /* Mid layer — textured chalk */
      ctx.strokeStyle = 'rgba(240, 238, 230, ' + (alpha * 0.4) + ')';
      ctx.lineWidth = 12;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (var j = 1; j <= segs; j++) {
        var t2 = j / segs;
        if (t2 > progress) break;
        ctx.lineTo(
          x1 + (x2 - x1) * t2 + Math.sin(j * 4.7) * 2,
          y1 + (y2 - y1) * t2 + Math.cos(j * 3.3) * 1.5
        );
      }
      ctx.stroke();

      /* Core white impact edge */
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (alpha * 0.95) + ')';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      for (var k = 1; k <= segs; k++) {
        var t3 = k / segs;
        if (t3 > progress) break;
        ctx.lineTo(
          x1 + (x2 - x1) * t3 + Math.sin(k * 4.7) * 1,
          y1 + (y2 - y1) * t3 + Math.cos(k * 3.3) * 0.8
        );
      }
      ctx.stroke();

      /* Bright leading edge flash */
      if (progress > 0.03 && progress < 0.97) {
        var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
        grad.addColorStop(0, 'rgba(255, 255, 255, ' + (alpha * 0.8) + ')');
        grad.addColorStop(0.4, 'rgba(255, 255, 255, ' + (alpha * 0.2) + ')');
        grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = grad;
        ctx.fillRect(cx - 60, cy - 60, 120, 120);
      }

      /* Dust residue along streak path */
      if (streak.dustAlpha > 0) {
        ctx.globalAlpha = streak.dustAlpha;
        for (var d = 0; d < Math.floor(progress * 50); d++) {
          var dt = d / 50;
          var dx = x1 + (x2 - x1) * dt + (Math.random() - 0.5) * 24;
          var dy = y1 + (y2 - y1) * dt + (Math.random() - 0.5) * 16;
          var ds = 0.2 + Math.random() * 1.8;
          ctx.fillStyle = Math.random() < 0.08
            ? 'rgba(255, 85, 0, ' + (0.06 + Math.random() * 0.06) + ')'
            : 'rgba(255, 255, 255, ' + (0.04 + Math.random() * 0.1) + ')';
          ctx.beginPath();
          ctx.arc(dx, dy, ds, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       FIELD LINE — the real performance line
       ═══════════════════════════════════════════════════ */
    var fieldLine = { progress: 0, y: 0 };

    function drawFieldLine(progress) {
      if (progress <= 0) return;
      ctx.save();
      fieldLine.y = H * 0.5;
      var startX = W * 0.03;
      var endX = startX + (W * 0.94) * progress;

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(startX, fieldLine.y);
      var segs = Math.max(4, Math.floor((endX - startX) / 25));
      for (var i = 1; i <= segs; i++) {
        ctx.lineTo(
          startX + (endX - startX) * (i / segs),
          fieldLine.y + Math.sin(i * 2.7) * 0.7
        );
      }
      ctx.stroke();
      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       METRIC GEOMETRY — performance data that captures dust
       ═══════════════════════════════════════════════════ */
    var metricPoints = [];

    function buildMetricGeometry() {
      var cx = W * 0.5;
      var cy = H * 0.42;

      /* 40-yard split ticks */
      for (var i = 0; i < 12; i++) {
        metricPoints.push({
          x: W * 0.08 + (W * 0.84) * (i / 11),
          y: cy + 40,
          type: 'tick', alpha: 0, targetAlpha: 0.18 + Math.random() * 0.15
        });
      }

      /* Split time labels */
      var labels = ['4.32', '4.41', '4.28', '4.55', '4.39', '4.22'];
      for (var j = 0; j < labels.length; j++) {
        metricPoints.push({
          x: W * 0.12 + (W * 0.76) * (j / 5),
          y: cy + 55 + Math.random() * 8,
          type: 'label', text: labels[j],
          alpha: 0, targetAlpha: 0.1 + Math.random() * 0.08
        });
      }

      /* Output / power bars */
      for (var k = 0; k < 10; k++) {
        metricPoints.push({
          x: W * 0.15 + (W * 0.7) * (k / 9),
          y: cy - 30 - Math.random() * 25,
          type: 'bar', h: 6 + Math.random() * 30,
          alpha: 0, targetAlpha: 0.07 + Math.random() * 0.1
        });
      }

      /* Speed trail lines */
      for (var s = 0; s < 8; s++) {
        metricPoints.push({
          x: W * 0.05 + Math.random() * W * 0.4,
          y: cy - 70 + Math.random() * 140,
          type: 'trail', w: 20 + Math.random() * 120,
          alpha: 0, targetAlpha: 0.03 + Math.random() * 0.05
        });
      }

      /* Jump arc arcs (measurement geometry) */
      for (var m = 0; m < 3; m++) {
        metricPoints.push({
          x: W * 0.3 + (W * 0.4) * (m / 2),
          y: cy + 40,
          type: 'arc', radius: 25 + Math.random() * 40,
          alpha: 0, targetAlpha: 0.05 + Math.random() * 0.05
        });
      }

      /* Hash marks along field line */
      for (var h = 0; h < 16; h++) {
        metricPoints.push({
          x: W * 0.06 + (W * 0.88) * (h / 15),
          y: H * 0.5,
          type: 'hash', len: 6 + Math.random() * 14,
          alpha: 0, targetAlpha: 0.12 + Math.random() * 0.2
        });
      }

      /* Knurl texture (barbell grip) near center */
      for (var n = 0; n < 18; n++) {
        metricPoints.push({
          x: cx - 54 + n * 6,
          y: H * 0.5 + 25 + Math.random() * 15,
          type: 'knurl', h: 3 + Math.random() * 7,
          alpha: 0, targetAlpha: 0.03 + Math.random() * 0.04
        });
      }
    }

    function drawMetricGeometry(progress) {
      if (progress <= 0) return;
      ctx.save();

      metricPoints.forEach(function (mp) {
        mp.alpha = mp.targetAlpha * progress;

        if (mp.type === 'tick') {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mp.x, mp.y - 8);
          ctx.lineTo(mp.x, mp.y + 8);
          ctx.stroke();
        }

        if (mp.type === 'label') {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.font = '600 9px Inter, sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(mp.text, mp.x, mp.y);
        }

        if (mp.type === 'bar') {
          ctx.fillStyle = 'rgba(255, 255, 255, ' + (mp.alpha * 0.6) + ')';
          ctx.fillRect(mp.x - 2, mp.y, 4, mp.h * progress);
        }

        if (mp.type === 'trail') {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(mp.x, mp.y);
          ctx.lineTo(mp.x + mp.w * progress, mp.y);
          ctx.stroke();
        }

        if (mp.type === 'arc') {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.lineWidth = 0.7;
          ctx.beginPath();
          ctx.arc(mp.x, mp.y, mp.radius, -Math.PI * 0.3, Math.PI * 0.3);
          ctx.stroke();
        }

        if (mp.type === 'hash') {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(mp.x, mp.y - mp.len / 2);
          ctx.lineTo(mp.x, mp.y + mp.len / 2);
          ctx.stroke();
        }

        if (mp.type === 'knurl') {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + mp.alpha + ')';
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(mp.x, mp.y);
          ctx.lineTo(mp.x, mp.y + mp.h);
          ctx.stroke();
        }
      });

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       ROOM TEXTURES — drawn on canvas (The Room concept)
       ═══════════════════════════════════════════════════ */
    var roomFlashes = [
      { type: 'knurl', alpha: 0 },
      { type: 'lane', alpha: 0 },
      { type: 'rack', alpha: 0 },
      { type: 'board', alpha: 0 }
    ];

    function drawRoomFlash(flashIndex, alpha) {
      if (alpha <= 0.01) return;
      var cx = W * 0.5;
      var cy = H * 0.5;
      ctx.save();
      ctx.globalAlpha = alpha;

      if (flashIndex === 0) {
        /* Barbell knurl texture — crosshatch */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;
        for (var i = 0; i < 30; i++) {
          var kx = cx - 90 + i * 6;
          ctx.beginPath();
          ctx.moveTo(kx, cy - 4);
          ctx.lineTo(kx, cy + 4);
          ctx.stroke();
        }
      }

      if (flashIndex === 1) {
        /* Lane stripe */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 3;
        ctx.setLineDash([20, 15]);
        ctx.beginPath();
        ctx.moveTo(W * 0.1, cy);
        ctx.lineTo(W * 0.9, cy);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      if (flashIndex === 2) {
        /* Rack steel edges */
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx - 40, cy - 60);
        ctx.lineTo(cx - 40, cy + 60);
        ctx.moveTo(cx + 40, cy - 60);
        ctx.lineTo(cx + 40, cy + 60);
        ctx.stroke();
      }

      if (flashIndex === 3) {
        /* Whiteboard coaching marks */
        ctx.strokeStyle = 'rgba(255, 85, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(cx - 20, cy - 10, 15, 0, Math.PI * 1.5);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx, cy - 20);
        ctx.lineTo(cx + 30, cy + 10);
        ctx.stroke();
      }

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       LOGO GEOMETRY — PPF assembled from captured debris
       ═══════════════════════════════════════════════════ */
    var logoPieces = [];
    var logoAlpha = 0;

    function buildLogoPieces() {
      var cx = W * 0.5;
      var cy = H * 0.40;
      var scale = Math.min(W, H) * 0.0014;
      if (scale < 0.5) scale = 0.5;
      var s = scale;

      /* Orange performance bars — left */
      var barL = [
        { x: -82, y: 5, w: 7, h: 60 },
        { x: -70, y: -10, w: 7, h: 80 },
        { x: -58, y: -20, w: 7, h: 100 },
        { x: -46, y: -10, w: 7, h: 80 }
      ];
      /* Orange performance bars — right */
      var barR = [
        { x: 152, y: -10, w: 7, h: 80 },
        { x: 164, y: -20, w: 7, h: 100 },
        { x: 176, y: -10, w: 7, h: 80 },
        { x: 188, y: 5, w: 7, h: 60 }
      ];
      /* P1 */
      var p1 = [
        { x: 0, y: -20, w: 10, h: 100 },
        { x: 10, y: -20, w: 28, h: 10 },
        { x: 38, y: -20, w: 10, h: 50 },
        { x: 10, y: 20, w: 28, h: 10 }
      ];
      /* P2 */
      var p2 = [
        { x: 56, y: -20, w: 10, h: 100 },
        { x: 66, y: -20, w: 28, h: 10 },
        { x: 94, y: -20, w: 10, h: 50 },
        { x: 66, y: 20, w: 28, h: 10 }
      ];
      /* F */
      var fL = [
        { x: 112, y: -20, w: 10, h: 100 },
        { x: 122, y: -20, w: 38, h: 10 },
        { x: 122, y: 20, w: 28, h: 10 }
      ];

      function addPieces(rects, color) {
        rects.forEach(function (r) {
          /* Start scattered along the chalk diagonal */
          var diagT = Math.random();
          var diagX = W * 0.06 + (W * 0.88) * diagT;
          var diagY = H * 0.84 + (H * 0.16 - H * 0.84) * diagT;
          logoPieces.push({
            fx: cx + r.x * s,
            fy: cy + r.y * s,
            fw: r.w * s,
            fh: r.h * s,
            x: diagX + (Math.random() - 0.5) * 80,
            y: diagY + (Math.random() - 0.5) * 60,
            color: color,
            progress: 0
          });
        });
      }

      addPieces(barL, '#ff5500');
      addPieces(barR, '#ff5500');
      addPieces(p1, '#ffffff');
      addPieces(p2, '#ffffff');
      addPieces(fL, '#ffffff');

      logoPieces.athleticsY = cy + 65 * s;
      logoPieces.athleticsSize = Math.max(10, 18 * s);
      logoPieces.cx = cx;
    }

    /* ═══════════════════════════════════════════════════
       EDGE FORGE — heat shimmer + pressure compression
       ═══════════════════════════════════════════════════ */
    function drawEdgeForge(progress) {
      if (progress <= 0) return;
      ctx.save();

      var cx = W * 0.5;
      var cy = H * 0.40;

      /* Heat shimmer lines */
      ctx.globalAlpha = progress * 0.08;
      ctx.strokeStyle = '#ff5500';
      ctx.lineWidth = 0.5;
      for (var i = 0; i < 6; i++) {
        var shimX = cx - 100 + i * 40;
        ctx.beginPath();
        ctx.moveTo(shimX, cy - 70);
        for (var j = 0; j < 10; j++) {
          ctx.lineTo(
            shimX + Math.sin((j + progress * 10) * 1.5) * 4,
            cy - 70 + j * 14
          );
        }
        ctx.stroke();
      }

      /* Pressure compression lines converging on logo */
      ctx.globalAlpha = progress * 0.12;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 0.8;
      var compressT = Math.min(1, progress * 1.5);
      for (var k = 0; k < 8; k++) {
        var angle = (k / 8) * Math.PI * 2;
        var startR = 200 * (1 - compressT * 0.6);
        var endR = 30;
        ctx.beginPath();
        ctx.moveTo(cx + Math.cos(angle) * startR, cy + Math.sin(angle) * startR * 0.6);
        ctx.lineTo(cx + Math.cos(angle) * endR, cy + Math.sin(angle) * endR * 0.6);
        ctx.stroke();
      }

      /* Orange energy seam — the PPF signature */
      if (progress > 0.4) {
        var seamA = (progress - 0.4) / 0.6;
        ctx.globalAlpha = seamA * 0.18;
        ctx.strokeStyle = '#ff5500';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        var sx1 = W * 0.33;
        var sy1 = H * 0.55;
        var sx2 = W * 0.67;
        var sy2 = H * 0.28;
        ctx.moveTo(sx1, sy1);
        for (var si = 1; si <= 10; si++) {
          var st = si / 10;
          ctx.lineTo(
            sx1 + (sx2 - sx1) * st + Math.sin(si * 2.8) * 5,
            sy1 + (sy2 - sy1) * st + Math.cos(si * 2.1) * 3
          );
        }
        ctx.stroke();
      }

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       PALM STRIKE HANDPRINT — ghost flash
       ═══════════════════════════════════════════════════ */
    var palmStrike = { alpha: 0, x: 0, y: 0 };

    function drawPalmPrint(a) {
      if (a <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = a;

      var px = palmStrike.x;
      var py = palmStrike.y;
      var s = Math.min(W, H) * 0.0008;
      if (s < 0.3) s = 0.3;

      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (a * 0.35) + ')';
      ctx.fillStyle = 'rgba(255, 255, 255, ' + (a * 0.05) + ')';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';

      /* Palm center */
      ctx.beginPath();
      ctx.ellipse(px, py, 35 * s, 42 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      /* Fingers */
      var fingers = [
        { dx: -22, dy: -50, len: 35, angle: -0.15 },
        { dx: -8, dy: -58, len: 40, angle: -0.05 },
        { dx: 8, dy: -56, len: 38, angle: 0.05 },
        { dx: 22, dy: -48, len: 32, angle: 0.2 },
        { dx: 38, dy: -15, len: 25, angle: 0.7 }
      ];
      fingers.forEach(function (f) {
        ctx.beginPath();
        ctx.moveTo(px + f.dx * s, py + f.dy * s);
        ctx.lineTo(
          px + (f.dx + Math.sin(f.angle) * f.len) * s,
          py + (f.dy - Math.cos(f.angle) * f.len) * s
        );
        ctx.lineWidth = 6 * s;
        ctx.stroke();
      });

      /* Impact ring */
      ctx.strokeStyle = 'rgba(255, 255, 255, ' + (a * 0.2) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(px, py, 60 * s * (2 - a), 0, Math.PI * 2);
      ctx.stroke();

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       ATHLETE SILHOUETTE — sprint-stance ghost
       ═══════════════════════════════════════════════════ */
    var athleteGhost = { alpha: 0, x: 0, y: 0 };

    function drawAthleteSilhouette(a) {
      if (a <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = a * 0.1;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      var gx = athleteGhost.x;
      var gy = athleteGhost.y;
      var s = Math.min(W, H) * 0.001;
      if (s < 0.4) s = 0.4;

      /* Head */
      ctx.beginPath();
      ctx.arc(gx, gy - 70 * s, 8 * s, 0, Math.PI * 2);
      ctx.stroke();
      /* Torso */
      ctx.beginPath();
      ctx.moveTo(gx, gy - 62 * s);
      ctx.lineTo(gx + 15 * s, gy - 20 * s);
      ctx.stroke();
      /* Arms */
      ctx.beginPath();
      ctx.moveTo(gx + 5 * s, gy - 45 * s);
      ctx.lineTo(gx + 25 * s, gy - 10 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 5 * s, gy - 45 * s);
      ctx.lineTo(gx - 20 * s, gy - 30 * s);
      ctx.stroke();
      /* Legs */
      ctx.beginPath();
      ctx.moveTo(gx + 15 * s, gy - 20 * s);
      ctx.lineTo(gx + 5 * s, gy + 10 * s);
      ctx.lineTo(gx + 20 * s, gy + 15 * s);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(gx + 15 * s, gy - 20 * s);
      ctx.lineTo(gx - 25 * s, gy + 20 * s);
      ctx.lineTo(gx - 35 * s, gy + 15 * s);
      ctx.stroke();

      ctx.restore();
    }

    /* ═══════════════════════════════════════════════════
       METRIC CAPTURE — pull free particles to data geometry
       ═══════════════════════════════════════════════════ */
    function captureParticles(elapsed) {
      var cx = W * 0.5;
      var cy = H * 0.40;
      particles.forEach(function (p) {
        if (p.captured || elapsed < p.captureDelay + 1.3) return;
        if (!p.tx && !p.ty) {
          p.tx = cx + (Math.random() - 0.5) * 220;
          p.ty = cy + (Math.random() - 0.5) * 140;
        }
        p.captured = true;
      });

      particles.forEach(function (p) {
        if (!p.captured) return;
        var dx = p.tx - p.x;
        var dy = p.ty - p.y;
        p.vx += dx * 0.025;
        p.vy += dy * 0.025;
        p.vx *= 0.86;
        p.vy *= 0.86;
        p.decay = 0.002;
      });
    }

    /* ═══════════════════════════════════════════════════
       WEB AUDIO — immersive sound design
       ═══════════════════════════════════════════════════ */
    var audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { /* silent */ }
      }
      return audioCtx;
    }

    function playSound(type) {
      try {
        var ac = getAudioCtx();
        if (!ac) return;
        var now = ac.currentTime;

        if (type === 'hum') {
          /* Low room hum — ambient training room presence */
          var osc = ac.createOscillator();
          var g = ac.createGain();
          osc.type = 'sine';
          osc.frequency.value = 55;
          g.gain.setValueAtTime(0, now);
          g.gain.linearRampToValueAtTime(0.04, now + 0.5);
          g.gain.linearRampToValueAtTime(0.06, now + 2);
          g.gain.exponentialRampToValueAtTime(0.001, now + 4);
          osc.connect(g);
          g.connect(ac.destination);
          osc.start();
          osc.stop(now + 4.5);
        }

        if (type === 'friction') {
          /* Chalk friction drag */
          var bufLen = ac.sampleRate * 0.3;
          var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
          var d = buf.getChannelData(0);
          for (var i = 0; i < bufLen; i++) {
            var t = i / bufLen;
            d[i] = (Math.random() * 2 - 1) * (0.2 + t * 0.8) * Math.exp(-Math.max(0, t - 0.85) * 10);
          }
          var src = ac.createBufferSource();
          src.buffer = buf;
          var filt = ac.createBiquadFilter();
          filt.type = 'bandpass';
          filt.frequency.setValueAtTime(1200, now);
          filt.frequency.linearRampToValueAtTime(4500, now + 0.25);
          filt.Q.value = 2;
          var gF = ac.createGain();
          gF.gain.setValueAtTime(0.06, now);
          gF.gain.linearRampToValueAtTime(0.12, now + 0.2);
          gF.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
          src.connect(filt);
          filt.connect(gF);
          gF.connect(ac.destination);
          src.start();
        }

        if (type === 'strike') {
          /* Violent chalk impact + sub thump */
          var bufLen2 = ac.sampleRate * 0.15;
          var buf2 = ac.createBuffer(1, bufLen2, ac.sampleRate);
          var d2 = buf2.getChannelData(0);
          for (var j = 0; j < bufLen2; j++) {
            d2[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.007));
          }
          var src2 = ac.createBufferSource();
          src2.buffer = buf2;
          var hp = ac.createBiquadFilter();
          hp.type = 'highpass';
          hp.frequency.value = 1800;
          var gS = ac.createGain();
          gS.gain.setValueAtTime(0.2, now);
          gS.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
          src2.connect(hp);
          hp.connect(gS);
          gS.connect(ac.destination);
          src2.start();

          var osc2 = ac.createOscillator();
          var gO = ac.createGain();
          osc2.type = 'sine';
          osc2.frequency.setValueAtTime(110, now);
          osc2.frequency.exponentialRampToValueAtTime(35, now + 0.2);
          gO.gain.setValueAtTime(0.14, now);
          gO.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
          osc2.connect(gO);
          gO.connect(ac.destination);
          osc2.start();
          osc2.stop(now + 0.3);
        }

        if (type === 'chirp') {
          /* Metric data chirp — tiny digital beep */
          var osc3 = ac.createOscillator();
          var gC = ac.createGain();
          osc3.type = 'square';
          osc3.frequency.value = 2800 + Math.random() * 1500;
          gC.gain.setValueAtTime(0.03, now);
          gC.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
          osc3.connect(gC);
          gC.connect(ac.destination);
          osc3.start();
          osc3.stop(now + 0.05);
        }

        if (type === 'lock') {
          /* Metallic snap */
          var bufLen3 = ac.sampleRate * 0.1;
          var buf3 = ac.createBuffer(1, bufLen3, ac.sampleRate);
          var d3 = buf3.getChannelData(0);
          for (var k = 0; k < bufLen3; k++) {
            d3[k] = (Math.random() * 2 - 1) * Math.exp(-k / (ac.sampleRate * 0.008));
          }
          var src3 = ac.createBufferSource();
          src3.buffer = buf3;
          var bp = ac.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 5000;
          bp.Q.value = 12;
          var gL = ac.createGain();
          gL.gain.setValueAtTime(0.12, now);
          gL.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
          src3.connect(bp);
          bp.connect(gL);
          gL.connect(ac.destination);
          src3.start();
        }

        if (type === 'palm') {
          /* Sharp clap */
          var bufLen4 = ac.sampleRate * 0.06;
          var buf4 = ac.createBuffer(1, bufLen4, ac.sampleRate);
          var d4 = buf4.getChannelData(0);
          for (var m = 0; m < bufLen4; m++) {
            d4[m] = (Math.random() * 2 - 1) * Math.exp(-m / (ac.sampleRate * 0.004));
          }
          var src4 = ac.createBufferSource();
          src4.buffer = buf4;
          var gP = ac.createGain();
          gP.gain.setValueAtTime(0.16, now);
          gP.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
          src4.connect(gP);
          gP.connect(ac.destination);
          src4.start();
        }

        if (type === 'impact') {
          /* Deep thump — final dismiss */
          var osc4 = ac.createOscillator();
          var osc5 = ac.createOscillator();
          var gI = ac.createGain();
          osc4.type = 'sine';
          osc4.frequency.setValueAtTime(85, now);
          osc4.frequency.exponentialRampToValueAtTime(25, now + 0.4);
          osc5.type = 'triangle';
          osc5.frequency.setValueAtTime(170, now);
          osc5.frequency.exponentialRampToValueAtTime(45, now + 0.3);
          gI.gain.setValueAtTime(0.18, now);
          gI.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
          osc4.connect(gI);
          osc5.connect(gI);
          gI.connect(ac.destination);
          osc4.start();
          osc5.start();
          osc4.stop(now + 0.5);
          osc5.stop(now + 0.5);
        }
      } catch (e) { /* Web Audio unsupported */ }
    }

    /* ═══════════════════════════════════════════════════
       ANIMATION STATE
       ═══════════════════════════════════════════════════ */
    var startTime = 0;
    var phase = 0;
    var athleticsAlpha = 0;
    var chirpCount = 0;
    /*
      THE STANDARD ACTIVATES — Ultimate 9-second sequence:
      ────────────────────────────────────────────────────
      Phase 0  (0.0–0.5s)  BLACK + ROOM HUM + TEST WINDOW SLIT
      Phase 1  (0.5–1.0s)  ROOM FLASHES through the slit
      Phase 2  (1.0–1.5s)  FIELD LINE drags + FRICTION SOUND
      Phase 3  (1.5–1.7s)  FOOT STRIKE — slit EXPLODES, chalk kicks
      Phase 4  (1.7–2.5s)  DUST TRAILS + METRIC GEOMETRY boots
      Phase 5  (2.5–3.5s)  EDGE FORGE — logo assembles from debris
      Phase 6  (3.5–4.0s)  SCAN + METRICS + PROFILE STAMP
      Phase 7  (4.0–4.5s)  PALM STRIKE + LOCK IN command
      Phase 8  (4.5–5.5s)  IMPACT RIPPLE + ASCENT
      Phase 9  (5.5–7.0s)  HERO CONVERSION — intro becomes the site
    */

    /* ═══════════════════════════════════════════════════
       MAIN RENDER LOOP
       ═══════════════════════════════════════════════════ */
    function render(timestamp) {
      if (introDismissed) return;

      if (!startTime) {
        startTime = timestamp;
        buildMetricGeometry();
        buildLogoPieces();
        palmStrike.x = W * 0.5;
        palmStrike.y = H * 0.40;
        athleteGhost.x = W * 0.15;
        athleteGhost.y = H * 0.78;
      }

      var elapsed = (timestamp - startTime) / 1000;
      ctx.clearRect(0, 0, W, H);

      /* ── Phase 0: BLACK + ROOM HUM + TEST WINDOW SLIT (0.0–0.5s) ── */
      if (elapsed >= 0.1 && phase < 1) {
        phase = 1;
        playSound('hum');
        intro.classList.add('phase-slit');
      }

      /* ── Phase 1: ROOM FLASHES through slit (0.5–1.0s) ── */
      if (elapsed >= 0.5 && phase < 2) {
        phase = 2;
        intro.classList.add('phase-room');
      }
      if (phase >= 2 && elapsed < 1.2) {
        /* Canvas-drawn room textures flash rapidly */
        var roomT = (elapsed - 0.5) / 0.5;
        for (var ri = 0; ri < roomFlashes.length; ri++) {
          var flashStart = ri * 0.12;
          var flashEnd = flashStart + 0.12;
          var rAge = roomT - flashStart;
          if (rAge > 0 && rAge < flashEnd + 0.05) {
            var rA = rAge < 0.04 ? rAge / 0.04 : Math.max(0, 1 - (rAge - 0.04) / 0.08);
            drawRoomFlash(ri, rA * 0.6);
          }
        }
      }

      /* ── Phase 2: FIELD LINE drags + FRICTION (1.0–1.5s) ── */
      if (elapsed >= 1.0 && phase < 3) {
        phase = 3;
        playSound('friction');
      }
      if (phase >= 3) {
        var lineT = clamp((elapsed - 1.0) / 0.5, 0, 1);
        lineT = 1 - Math.pow(1 - lineT, 3);
        fieldLine.progress = lineT;
        drawFieldLine(lineT);
      }

      /* ── Phase 3: FOOT STRIKE — slit explodes, chalk kicks (1.5s) ── */
      if (elapsed >= 1.5 && phase < 4) {
        phase = 4;
        playSound('strike');
        intro.classList.add('phase-explode');
        intro.classList.add('phase-footstrike');
        /* Sprint-start chalk kick from bottom-left */
        spawnStrikeChalk(W * 0.12, H * 0.82, 320);
        /* Ghost athlete appears at strike point */
      }

      /* Athlete silhouette ghost — flash at strike point */
      if (phase >= 4 && elapsed >= 1.5 && elapsed < 2.3) {
        var ghostT = (elapsed - 1.5) / 0.8;
        athleteGhost.alpha = ghostT < 0.3 ? ghostT / 0.3 : Math.max(0, 1 - (ghostT - 0.3) / 0.5);
        drawAthleteSilhouette(athleteGhost.alpha);
      }

      /* ── Chalk streak rips diagonally across screen ── */
      if (phase >= 4) {
        var streakT = clamp((elapsed - 1.5) / 0.4, 0, 1);
        streakT = 1 - Math.pow(1 - streakT, 4);
        streak.progress = streakT;

        var streakAge = elapsed - 1.5;
        if (streakAge < 0.25) {
          streak.alpha = Math.min(1, streakAge / 0.06);
        } else if (streakAge < 0.7) {
          streak.alpha = 1 - (streakAge - 0.25) / 0.45 * 0.5;
        } else {
          streak.alpha = Math.max(0, 0.5 - (streakAge - 0.7) * 0.3);
        }
        streak.dustAlpha = clamp(streakAge / 0.4, 0, 0.7) * (1 - clamp((streakAge - 2.5) / 1, 0, 1));
        drawChalkStreak(streak.progress, streak.alpha);
      }

      /* ── Phase 4: DUST TRAILS + METRIC GEOMETRY (1.7–2.5s) ── */
      if (elapsed >= 1.7 && phase < 5) {
        phase = 5;
      }
      if (phase >= 5) {
        var metricT = clamp((elapsed - 1.7) / 0.8, 0, 1);
        metricT = 1 - Math.pow(1 - metricT, 2);
        drawMetricGeometry(metricT);
        captureParticles(elapsed);

        /* Metric chirps */
        if (chirpCount < 4 && elapsed > 1.8 + chirpCount * 0.15) {
          playSound('chirp');
          chirpCount++;
        }
      }

      /* ── Phase 5: EDGE FORGE — logo assembles (2.5–3.5s) ── */
      if (elapsed >= 2.5 && phase < 6) {
        phase = 6;
        playSound('lock');
        intro.classList.add('phase-forge');
      }
      if (phase >= 6) {
        var forgeT = clamp((elapsed - 2.5) / 1.0, 0, 1);
        drawEdgeForge(forgeT);

        /* Logo pieces assemble with spring ease */
        if (logoPieces.length) {
          var logoT = clamp((elapsed - 2.5) / 0.9, 0, 1);
          var eased = logoT < 0.5
            ? 4 * logoT * logoT * logoT
            : 1 - Math.pow(-2 * logoT + 2, 3) / 2;
          logoAlpha = eased;

          ctx.save();
          logoPieces.forEach(function (p) {
            if (p.fx === undefined) return;
            p.progress = eased;
            var curX = p.x + (p.fx - p.x) * eased;
            var curY = p.y + (p.fy - p.y) * eased;
            ctx.globalAlpha = eased;
            ctx.fillStyle = p.color;
            ctx.fillRect(curX, curY, p.fw, p.fh);
          });

          /* ATHLETICS text */
          athleticsAlpha = clamp((elapsed - 3.0) / 0.4, 0, 1);
          if (athleticsAlpha > 0) {
            ctx.globalAlpha = athleticsAlpha;
            ctx.fillStyle = '#ff5500';
            ctx.font = '600 ' + logoPieces.athleticsSize + 'px "Bebas Neue", Impact, sans-serif';
            ctx.textAlign = 'center';
            var athText = 'ATHLETICS';
            var athSpacing = logoPieces.athleticsSize * 0.35;
            var totalAthW = 0;
            for (var ai = 0; ai < athText.length; ai++) {
              totalAthW += ctx.measureText(athText[ai]).width + (ai < athText.length - 1 ? athSpacing : 0);
            }
            var athX = logoPieces.cx - totalAthW / 2;
            for (var aj = 0; aj < athText.length; aj++) {
              ctx.fillText(athText[aj], athX, logoPieces.athleticsY);
              athX += ctx.measureText(athText[aj]).width + athSpacing;
            }
          }

          /* Alignment anchor dots */
          if (eased > 0.7) {
            var dotA = (eased - 0.7) / 0.3;
            ctx.fillStyle = 'rgba(255, 85, 0, ' + (dotA * 0.4) + ')';
            var firstP = logoPieces[0];
            var lastP = logoPieces[logoPieces.length - 1];
            if (firstP && lastP && firstP.fx !== undefined && lastP.fx !== undefined) {
              var bx = firstP.fx;
              var by = firstP.fy;
              var ex = lastP.fx + lastP.fw;
              var ey = lastP.fy + lastP.fh;
              ctx.beginPath(); ctx.arc(bx - 3, by - 3, 2, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(ex + 3, by - 3, 2, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(bx - 3, ey + 3, 2, 0, Math.PI * 2); ctx.fill();
              ctx.beginPath(); ctx.arc(ex + 3, ey + 3, 2, 0, Math.PI * 2); ctx.fill();
            }
          }

          ctx.restore();
        }
      }

      /* ── Phase 6: SCAN + METRICS + PROFILE (3.5–4.0s) ── */
      if (elapsed >= 3.5 && phase < 7) {
        phase = 7;
        intro.classList.add('phase-scan');
        intro.classList.add('phase-metrics');
        intro.classList.add('phase-profile');
      }

      /* ── Phase 7: PALM STRIKE + LOCK IN (4.0–4.5s) ── */
      if (elapsed >= 4.0 && phase < 8) {
        phase = 8;
        playSound('palm');
        spawnPalmChalk(W * 0.5, H * 0.40, 90);
        intro.classList.add('phase-palmstrike');
        intro.classList.add('phase-command');
      }

      /* Palm print ghost */
      if (phase >= 8) {
        var palmAge = elapsed - 4.0;
        if (palmAge < 0.07) {
          palmStrike.alpha = palmAge / 0.07;
        } else if (palmAge < 0.18) {
          palmStrike.alpha = 1 - (palmAge - 0.07) / 0.11;
        } else {
          palmStrike.alpha = 0;
        }
        drawPalmPrint(palmStrike.alpha);
      }

      /* ── Phase 8: IMPACT RIPPLE + ASCENT (4.5–5.5s) ── */
      if (elapsed >= 4.5 && phase < 9) {
        phase = 9;
        playSound('impact');
        intro.classList.add('phase-impact');
        intro.classList.add('phase-ascent');
        spawnImpactRipple(W * 0.5, H * 0.5, 50);
      }

      /* ── Phase 9: HERO CONVERSION (5.5–7.0s) ── */
      if (elapsed >= 5.5 && phase < 10) {
        phase = 10;
        intro.classList.add('phase-convert');
        schedule(dismissIntro, 1200);
      }

      /* Fade out canvas during conversion */
      if (phase >= 10) {
        var fadeOut = clamp((elapsed - 5.5) / 1.2, 0, 1);
        ctx.save();
        ctx.globalAlpha = 1 - fadeOut;
        ctx.restore();
      }

      /* ═══════════════════════════════════════════════════
         RENDER ALL CHALK PARTICLES (every frame)
         ═══════════════════════════════════════════════════ */
      ctx.save();
      var globalFade = phase >= 10 ? Math.max(0, 1 - clamp((elapsed - 5.5) / 1.2, 0, 1)) : 1;

      for (var pi = particles.length - 1; pi >= 0; pi--) {
        var p = particles[pi];
        p.x += p.vx;
        p.y += p.vy;

        if (!p.captured) {
          p.vy -= 0.012;
          p.vx *= 0.988;
        }
        p.life -= p.decay;

        if (p.life <= 0) {
          particles.splice(pi, 1);
          continue;
        }

        /* Color phase: dirty white → bright white → faint orange */
        var age = 1 - p.life;
        ctx.globalAlpha = p.alpha * p.life * globalFade;

        if (p.isOrangeHint && age > 0.5) {
          ctx.fillStyle = 'rgba(255, 85, 0, ' + (0.25 + Math.random() * 0.25) + ')';
        } else if (age < 0.12) {
          var dv = 195 + Math.floor(Math.random() * 35);
          ctx.fillStyle = 'rgb(' + dv + ',' + (dv - 5) + ',' + (dv - 18) + ')';
        } else if (age < 0.45) {
          ctx.fillStyle = '#ffffff';
        } else {
          if (p.isTrail && Math.random() < 0.12) {
            ctx.fillStyle = 'rgba(255, 85, 0, ' + (0.2 + Math.random() * 0.3) + ')';
          } else {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
          }
        }

        /* Trail particles render as motion streaks */
        if (p.isTrail && Math.abs(p.vx) > 0.4) {
          ctx.beginPath();
          ctx.moveTo(p.x - p.vx * 2.5, p.y - p.vy * 2.5);
          ctx.lineTo(p.x, p.y);
          ctx.lineWidth = p.size * 0.5;
          ctx.strokeStyle = ctx.fillStyle;
          ctx.stroke();
        } else {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      canvasRafId = requestAnimationFrame(render);
    }

    canvasRafId = requestAnimationFrame(render);

    /* Safety: force dismiss after 9s max */
    schedule(dismissIntro, 9000);
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
    const hoverEls = qsa('a, button, .path-card, .pillar-card, .proof-metric, .story-card, .force-panel, .ppf-cta');
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
    registerScrollHandler(() => {
      if (window.scrollY > 80) {
        nav.classList.add('scrolled');
      } else {
        nav.classList.remove('scrolled');
      }
    });
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

    let heroRafId = null;
    let heroVisible = true;

    function heroLoop() {
      if (!heroCanvas || !heroVisible) {
        heroRafId = null;
        return;
      }
      ctx.clearRect(0, 0, W, H);

      const scrollFactor = clamp(window.scrollY / H, 0, 1);
      if (isReduced) {
        // Draw minimal grid only
        ctx.clearRect(0, 0, W, H);
        heroRafId = requestAnimationFrame(heroLoop);
        return;
      }

      drawGrid(scrollFactor);
      drawStreaks();
      drawPulseRings();
      drawParticles();

      heroRafId = requestAnimationFrame(heroLoop);
    }

    // Pause hero canvas RAF when section is not visible
    const heroCanvasParent = heroCanvas.closest('section') || heroCanvas.parentElement;
    if (heroCanvasParent && 'IntersectionObserver' in window) {
      const heroCanvasObs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          heroVisible = entry.isIntersecting;
          if (heroVisible && !heroRafId) {
            heroRafId = requestAnimationFrame(heroLoop);
          } else if (!heroVisible && heroRafId) {
            cancelAnimationFrame(heroRafId);
            heroRafId = null;
          }
        });
      }, { threshold: 0 });
      heroCanvasObs.observe(heroCanvasParent);
    }

    window.addEventListener('resize', () => { resize(); }, { passive: true });
    resize();
    initParticles();
    heroLoop();
  }

  /* ── SCROLL VELOCITY SYSTEM ──────────────────────── */
  registerScrollHandler(() => {
    const sy = window.scrollY;
    scrollVelocity = Math.abs(sy - lastScrollY);
    lastScrollY = sy;
    scrollY = sy;
  });

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
      }, { threshold: 0.15, rootMargin: '0px 0px 50px 0px' });

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
      // Reset counter values before re-animating
      qsa('.proof-num', activePanel).forEach(el => { el.textContent = '0'; });
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

    // Clear work timer when leaving stage 3
    if (index !== 3 && workTimerInterval) {
      clearInterval(workTimerInterval);
      workTimerInterval = null;
    }

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
    if (workTimerInterval) return; // Guard: timer already running
    let seconds = 45;
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
      // Clear athlete timer
      const interval = cardTimers.get(this);
      if (interval) {
        clearInterval(interval);
        cardTimers.delete(this);
      }
      const timerEl = qs('.motion-timer', this);
      if (timerEl) timerEl.textContent = '00:00.00';
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
        const btnText = qs('.cta-label', submitBtn) || qs('span', submitBtn);
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
          const btnText = qs('.cta-label', submitBtn) || qs('span', submitBtn);
          if (btnText) btnText.textContent = 'SUBMIT APPLICATION';
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

  registerScrollHandler(updateActiveNav);
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
  const leaderCards = qsa('.force-panel');
  if ('IntersectionObserver' in window) {
    const leaderObs = new IntersectionObserver((entries) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
          }, i * 150);
          leaderObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    leaderCards.forEach((card, i) => {
      card.style.opacity = '0';
      card.style.transform = 'translateY(30px)';
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

    registerScrollHandler(() => {
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
    });
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
    registerScrollHandler(() => {
      const velocity = clamp(scrollVelocity, 0, 30);
      const intensity = velocity / 30;

      document.documentElement.style.setProperty(
        '--scroll-intensity',
        intensity.toFixed(3)
      );
    });
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

  /* ── MEMBERSHIP SYSTEM ─────────────────────────────── */

  /* Lane Toggle (Memberships / Private Coaching) */
  const laneBtns = qsa('.ms-lane-btn');
  const lanes = qsa('.ms-lane');

  laneBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.dataset.lane;
      laneBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      lanes.forEach(lane => lane.classList.remove('active'));
      if (target === 'private') {
        const el = qs('#lanePrivate');
        if (el) el.classList.add('active');
      } else {
        const el = qs('#laneMemberships');
        if (el) el.classList.add('active');
      }
    });
  });

  /* Path Filter (All Paths / Athlete / Adult / Integrated) */
  const pathFilterBtns = qsa('.ms-filter-btn');
  const membershipCards = qsa('.membership-card');

  function updatePathAwareCopy(path) {
    const key = (path === 'all') ? 'default' : path;
    membershipCards.forEach(card => {
      const desc = card.querySelector('.mc-description');
      const bestFor = card.querySelector('.mc-best-for');
      const bfText = card.querySelector('.mc-bf-text');
      if (desc) {
        const val = desc.getAttribute('data-' + key);
        if (val) desc.textContent = val;
      }
      if (bestFor && bfText) {
        const val = bestFor.getAttribute('data-' + key);
        if (val) bfText.textContent = val.replace(/^Best for:\s*/i, '');
      }
    });
  }

  pathFilterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const path = btn.dataset.path;
      pathFilterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      updatePathAwareCopy(path);
    });
  });

  /* Membership Card Hover — Glow, Depth Meter, Runway Sync */
  const tierToLevel = { monthly: 1, quarterly: 2, semiannual: 3, yearly: 4 };
  const tierToStage = { monthly: 'monthly', quarterly: 'quarterly', semiannual: 'semiannual', yearly: 'yearly' };
  const dmFill = qs('.ms-dm-fill');
  const dmLabels = qsa('.ms-dm-label');
  const runwayStages = qsa('.ms-runway-stage');
  const runwayEl = qs('.ms-commitment-runway');
  const runwayPulse = qs('.ms-runway-pulse');

  function setDepthMeter(level) {
    if (dmFill) dmFill.setAttribute('data-level', level);
    dmLabels.forEach(label => {
      label.classList.toggle('active', parseInt(label.dataset.level) <= level);
    });
  }

  function setRunway(tier) {
    const stageMap = ['monthly', 'quarterly', 'semiannual', 'yearly'];
    const tierIndex = stageMap.indexOf(tier);
    runwayStages.forEach((stage, i) => {
      const isLit = i <= tierIndex;
      const isActive = stage.dataset.stage === tier;
      stage.classList.toggle('lit', isLit);
      stage.classList.toggle('active-stage', isActive);
    });
    if (runwayEl) runwayEl.classList.add('pulse-active');
    if (runwayPulse) {
      const pct = ((tierIndex + 1) / 4) * 100;
      runwayPulse.style.width = pct + '%';
    }
  }

  function resetRunway() {
    runwayStages.forEach(stage => {
      stage.classList.remove('lit', 'active-stage');
    });
    if (runwayEl) runwayEl.classList.remove('pulse-active');
    if (runwayPulse) runwayPulse.style.width = '0%';
  }

  membershipCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      const tier = card.dataset.tier;
      const level = tierToLevel[tier] || 0;
      let glowIntensity = '0.06';
      let borderIntensity = '0.25';

      if (tier === 'quarterly') { glowIntensity = '0.10'; borderIntensity = '0.35'; }
      if (tier === 'semiannual') { glowIntensity = '0.12'; borderIntensity = '0.4'; }
      if (tier === 'yearly') { glowIntensity = '0.15'; borderIntensity = '0.5'; }

      card.style.boxShadow = `0 12px 40px rgba(255, 85, 0, ${glowIntensity})`;
      card.style.borderColor = `rgba(255, 85, 0, ${borderIntensity})`;

      setDepthMeter(level);
      setRunway(tier);
    });

    card.addEventListener('mouseleave', () => {
      card.style.boxShadow = '';
      card.style.borderColor = '';
      setDepthMeter(0);
      resetRunway();
    });
  });

  /* Private Coaching Card Hover */
  const pcCards = qsa('.ms-pc-card');
  pcCards.forEach(pkg => {
    pkg.addEventListener('mouseenter', () => {
      pkg.style.boxShadow = '0 12px 40px rgba(255, 85, 0, 0.1)';
    });
    pkg.addEventListener('mouseleave', () => {
      pkg.style.boxShadow = '';
    });
  });

  /* Commitment Runway Scroll Animation */
  const runwayFills = qsa('.ms-runway-fill');
  if ('IntersectionObserver' in window && runwayStages.length) {
    const runwayObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const fill = entry.target.querySelector('.ms-runway-fill');
          if (fill) {
            setTimeout(() => {
              fill.style.width = getComputedStyle(fill).getPropertyValue('--fill-width');
            }, 300);
          }
          runwayObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });

    runwayStages.forEach(stage => {
      const fill = stage.querySelector('.ms-runway-fill');
      if (fill) fill.style.width = '0%';
      runwayObs.observe(stage);
    });
  }

  /* ── PPF ECOSYSTEM — MODE SWITCHING & ANIMATIONS ──── */
  /* Story mode toggles */
  const ecoModes = qsa('.eco-mode-btn');
  const ecoPanels = qsa('.eco-panel');

  ecoModes.forEach(btn => {
    btn.addEventListener('click', () => {
      const mode = btn.dataset.mode;

      /* Update active button */
      ecoModes.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');

      /* Switch visible panel */
      ecoPanels.forEach(panel => {
        panel.classList.remove('is-visible');
        if (panel.dataset.panel === mode) {
          panel.classList.add('is-visible');
        }
      });
    });
  });

  /* Ecosystem boot-up animation on scroll */
  const ecoSection = qs('.ppf-ecosystem');
  if (ecoSection && 'IntersectionObserver' in window) {
    const ecoObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          ecoSection.classList.add('eco-active');
          ecoObs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    ecoObs.observe(ecoSection);
  }

  /* Social link hover effects */
  const ecoSocialLinks = qsa('.eco-social-link');
  ecoSocialLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      link.style.transform = 'translateY(-3px)';
    });
    link.addEventListener('mouseleave', () => {
      link.style.transform = '';
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
    registerScrollHandler(() => {
      const sy = window.scrollY;
      const heroH = heroSection.offsetHeight;
      if (sy > heroH * 0.3) {
        heroSection.classList.add('compressed');
      } else {
        heroSection.classList.remove('compressed');
      }
    });
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
    registerScrollHandler(() => {
      if (window.scrollY > 300 && !stripShown) {
        liveMetricStrip.classList.add('visible');
        stripShown = true;
      } else if (window.scrollY <= 300 && stripShown) {
        liveMetricStrip.classList.remove('visible');
        stripShown = false;
      }
    });
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

    registerScrollHandler(updateHud);
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
  /* (Now handled by leadership cinematic init below) */

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
  const focusableCards = qsa('.path-card, .proof-metric, .membership-card, .force-panel');
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

  /* ── COACHING COMMAND MODE — PPF Signature System ──── */
  const commandOverlay = qs('#coachingCommandOverlay');
  const commandText = qs('#commandText');

  if (commandOverlay && commandText && !isReduced) {
    const commandCues = [
      { section: 'standard', commands: ['DISCIPLINE', 'STANDARD', 'NO DRIFT'] },
      { section: 'paths', commands: ['CHOOSE', 'LOCK IN', 'COMMIT'] },
      { section: 'oneRoom', commands: ['ONE ROOM', 'SAME STANDARD'] },
      { section: 'proof', commands: ['PROVE IT', 'MEASURED', 'VERIFIED'] },
      { section: 'carryover', commands: ['CARRYOVER', 'TRANSFER'] },
      { section: 'room', commands: ['DRIVE', 'FINISH TALL', 'OWN THE REP'] },
      { section: 'leadership', commands: ['PROTECT', 'COACH', 'LEAD'] },
      { section: 'experience', commands: ['ASSESS', 'TRAIN', 'PLACE'] },
      { section: 'memberships', commands: ['COMMIT', 'INVEST'] },
    ];

    const triggeredSections = new Set();
    let commandTimeout = null;

    function showCommand(text) {
      if (commandTimeout) clearTimeout(commandTimeout);
      commandText.textContent = text;
      commandOverlay.classList.add('active');
      commandOverlay.setAttribute('aria-hidden', 'false');
      commandTimeout = setTimeout(() => {
        commandOverlay.classList.remove('active');
        commandOverlay.setAttribute('aria-hidden', 'true');
      }, 800);
    }

    commandCues.forEach(({ section, commands }) => {
      const el = qs('#' + section);
      if (!el) return;
      const obs = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !triggeredSections.has(section)) {
            triggeredSections.add(section);
            const cmd = commands[Math.floor(Math.random() * commands.length)];
            showCommand(cmd);
            obs.unobserve(entry.target);
          }
        });
      }, { threshold: 0.3 });
      obs.observe(el);
    });
  }

  /* ── PPF STANDARD METER — Engagement Tracker ────────── */
  const standardMeter = qs('#ppfStandardMeter');
  const standardFill = qs('#standardMeterFill');
  const standardLevel = qs('#standardMeterLevel');

  if (standardMeter && standardFill && standardLevel && !isReduced) {
    const meterSections = ['hero', 'standard', 'paths', 'proof', 'room', 'leadership', 'experience', 'memberships', 'start'];
    const meterLevels = ['PRESENCE', 'DISCIPLINE', 'STRUCTURE', 'OUTPUT', 'STANDARD'];
    const visitedSections = new Set();
    let meterShown = false;

    function updateMeter() {
      meterSections.forEach(id => {
        const el = qs('#' + id);
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewMid = window.innerHeight * 0.5;
        if (rect.top < viewMid && rect.bottom > viewMid) {
          visitedSections.add(id);
        }
      });

      const progress = Math.min(visitedSections.size / meterSections.length, 1);
      const pct = Math.round(progress * 100);
      standardFill.style.width = pct + '%';

      const levelIdx = Math.min(Math.floor(progress * meterLevels.length), meterLevels.length - 1);
      standardLevel.textContent = meterLevels[levelIdx];

      // Show meter after first scroll
      if (!meterShown && visitedSections.size > 1) {
        standardMeter.classList.add('visible');
        meterShown = true;
      }

      // Add final level class
      if (levelIdx === meterLevels.length - 1) {
        standardMeter.classList.add('level-5');
      } else {
        standardMeter.classList.remove('level-5');
      }
    }

    registerScrollHandler(updateMeter);
  }

  /* ── ONE ROOM ENGINE — Interactive Floor Toggle ──────── */
  const oneRoomBtns = qsa('.one-room-btn');
  const roomStates = qsa('.room-state');
  const roomFloorOverlay = qs('#roomFloorOverlay');

  if (oneRoomBtns.length && roomStates.length) {
    const roomColors = {
      athlete: 'radial-gradient(ellipse at center, rgba(255, 85, 0, 0.04) 0%, transparent 70%)',
      adult: 'radial-gradient(ellipse at center, rgba(100, 140, 255, 0.04) 0%, transparent 70%)',
      integrated: 'radial-gradient(ellipse at center, rgba(80, 200, 120, 0.04) 0%, transparent 70%)',
    };

    oneRoomBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const room = btn.dataset.room;

        // Update buttons
        oneRoomBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Switch room states
        roomStates.forEach(s => s.classList.remove('active'));
        const target = qs(`[data-room-state="${room}"]`);
        if (target) target.classList.add('active');

        // Update floor overlay
        if (roomFloorOverlay) {
          roomFloorOverlay.style.background = roomColors[room] || 'none';
        }
      });
    });
  }

  /* ── CARRYOVER VISION — Trail Node Reveal ────────────── */
  const carryoverTrails = qsa('.carryover-trail');

  if (carryoverTrails.length && 'IntersectionObserver' in window) {
    const trailObs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const trail = entry.target;
          const nodes = qsa('.trail-node', trail);
          const connectors = qsa('.trail-connector', trail);

          nodes.forEach((node, i) => {
            setTimeout(() => {
              node.classList.add('revealed');
            }, i * 200);
          });

          connectors.forEach((conn, i) => {
            setTimeout(() => {
              conn.classList.add('revealed');
            }, i * 200 + 100);
          });

          trailObs.unobserve(trail);
        }
      });
    }, { threshold: 0.2 });

    carryoverTrails.forEach(trail => trailObs.observe(trail));
  }

  /* ── PATH ROUTING ENGINE — Site-Wide Path Lock ──────── */
  let activePathFilter = null;

  function setActivePath(path) {
    if (activePathFilter === path) {
      // Deselect - show all
      activePathFilter = null;
      document.body.removeAttribute('data-active-path');
      return;
    }

    activePathFilter = path;
    document.body.setAttribute('data-active-path', path);

    // Switch proof tab to match path
    const matchingTab = qs(`.proof-tab[data-tab="${path}"]`);
    if (matchingTab) {
      activateProofTab(matchingTab);
    }

    // Switch One Room Engine to match path
    const matchingRoomBtn = qs(`.one-room-btn[data-room="${path}"]`);
    if (matchingRoomBtn) matchingRoomBtn.click();

    // Pre-select form path dropdown
    const formPath = qs('#path');
    if (formPath) {
      formPath.value = path;
    }

    // Switch membership path filter to match
    const matchingPathFilter = qs(`.ms-filter-btn[data-path="${path}"]`);
    if (matchingPathFilter) matchingPathFilter.click();
  }

  // Listen for path card CTA clicks to set path routing
  pathCards.forEach(card => {
    const cta = qs('.path-cta', card);
    if (cta) {
      cta.addEventListener('click', function () {
        const path = card.dataset.path;
        setActivePath(path);
      });
    }

    // Also set path on card click (beyond the CTA)
    card.addEventListener('click', function (e) {
      if (e.target.closest('.path-cta')) return; // Let CTA handler deal with it
      const path = this.dataset.path;
      setActivePath(path);
    });
  });

  // Path selector buttons (one-room) also route
  oneRoomBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const room = btn.dataset.room;
      if (activePathFilter !== room) {
        setActivePath(room);
      }
    });
  });

  /* ── ENHANCED SESSION RECONSTRUCTED ──────────────────── */
  // Add coaching cue flash to instruction stage
  const roomTrackEl = qs('#roomTrack');
  if (roomTrackEl) {
    const instructionStage = qs('[data-phase="instruction"]', roomTrackEl);
    if (instructionStage) {
      const cues = qsa('.rv-cue', instructionStage);

      // Enhanced stage transitions
      roomStages.forEach((stage, idx) => {
        if (idx === 2 && cues.length) { // Instruction stage
          const obs = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
              if (entry.isIntersecting && entry.target.classList.contains('active')) {
                cues.forEach((cue, i) => {
                  cue.style.opacity = '0';
                  cue.style.transform = 'translateY(10px)';
                  setTimeout(() => {
                    cue.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                    cue.style.opacity = '1';
                    cue.style.transform = 'translateY(0)';
                  }, 300 + i * 400);
                });
              }
            });
          }, { threshold: 0.5 });
          obs.observe(stage);
        }
      });
    }
  }

  /* =====================================================
     LEADERSHIP — CINEMATIC AUTHORITY SYSTEM
     ===================================================== */
  (function initLeadership() {
    const leadershipSection = qs('#leadership');
    if (!leadershipSection) return;

    /* ── 1. STANDARD LOCK ─────────────────────────────── */
    const stdLock = qs('#stdLock');
    const lockFill = qs('#lockFill');
    let lockShown = false;
    let lockUnlocked = false;
    let lockHoldTimer = null;
    let lockProgress = 0;

    function showLock() {
      if (lockShown || lockUnlocked) return;
      lockShown = true;
      stdLock.classList.add('active');

      // Auto-unlock after 5s if user doesn't hold
      setTimeout(function() {
        if (!lockUnlocked) unlockLock();
      }, 5000);
    }

    function unlockLock() {
      if (lockUnlocked) return;
      lockUnlocked = true;
      stdLock.classList.add('unlocking');
      setTimeout(function() {
        stdLock.classList.remove('active', 'unlocking');
        stdLock.style.display = 'none';
      }, 800);
    }

    if (stdLock) {
      // Hold-to-unlock on the lock screen
      stdLock.addEventListener('mousedown', function() {
        lockProgress = 0;
        lockHoldTimer = setInterval(function() {
          lockProgress += 3;
          if (lockFill) lockFill.style.width = lockProgress + '%';
          if (lockProgress >= 100) {
            clearInterval(lockHoldTimer);
            unlockLock();
          }
        }, 30);
      });

      stdLock.addEventListener('mouseup', function() {
        clearInterval(lockHoldTimer);
        lockProgress = 0;
        if (lockFill && !lockUnlocked) lockFill.style.width = '0%';
      });

      stdLock.addEventListener('mouseleave', function() {
        clearInterval(lockHoldTimer);
        lockProgress = 0;
        if (lockFill && !lockUnlocked) lockFill.style.width = '0%';
      });

      // Touch support
      stdLock.addEventListener('touchstart', function(e) {
        e.preventDefault();
        lockProgress = 0;
        lockHoldTimer = setInterval(function() {
          lockProgress += 3;
          if (lockFill) lockFill.style.width = lockProgress + '%';
          if (lockProgress >= 100) {
            clearInterval(lockHoldTimer);
            unlockLock();
          }
        }, 30);
      }, { passive: false });

      stdLock.addEventListener('touchend', function() {
        clearInterval(lockHoldTimer);
        lockProgress = 0;
        if (lockFill && !lockUnlocked) lockFill.style.width = '0%';
      });
    }

    // Show lock when user scrolls to leadership
    var lockObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          showLock();
          lockObserver.disconnect();
        }
      });
    }, { threshold: 0.15 });
    lockObserver.observe(leadershipSection);

    /* ── 2. FORCE PANELS VISIBILITY ──────────────────── */
    var forcePanels = qsa('.force-panel');
    var forceObserver = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.2 });
    forcePanels.forEach(function(p) { forceObserver.observe(p); });

    // Center seam visibility
    var seam = qs('#forcesSeam');
    if (seam) {
      var seamObs = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      }, { threshold: 0.5 });
      seamObs.observe(seam);
    }

    /* ── 3. DEFENSE ITEMS — Shield Interaction ────────── */
    qsa('.defense-item').forEach(function(item) {
      item.addEventListener('click', function() {
        // Toggle scene-active for padding
        var isActive = item.classList.contains('scene-active');
        // Close all in same system
        var parent = item.closest('.defense-items');
        if (parent) {
          parent.querySelectorAll('.defense-item').forEach(function(di) {
            di.classList.remove('scene-active');
          });
        }
        if (!isActive) {
          item.classList.add('scene-active');
        }
      });
    });

    /* ── 4. VOICE OF THE STANDARD ─────────────────────── */
    // Create voice overlay element
    var voiceOverlay = document.createElement('div');
    voiceOverlay.className = 'voice-overlay';
    document.body.appendChild(voiceOverlay);

    var voiceTimer = null;
    qsa('.voice-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var quote = btn.getAttribute('data-quote');
        if (!quote) return;

        var isRichard = btn.classList.contains('richard-voice');

        // Flash the button
        btn.classList.add('playing');
        setTimeout(function() { btn.classList.remove('playing'); }, 1500);

        // Show overlay
        voiceOverlay.textContent = '\u201C' + quote + '\u201D';
        voiceOverlay.className = 'voice-overlay active ' + (isRichard ? 'richard-style' : 'rebecca-style');

        clearTimeout(voiceTimer);
        voiceTimer = setTimeout(function() {
          voiceOverlay.classList.remove('active');
        }, 3000);

        // Trigger visual reaction on force panel
        var panel = btn.closest('.force-panel');
        if (panel) {
          panel.style.boxShadow = isRichard
            ? '0 0 40px rgba(255, 85, 0, 0.2)'
            : '0 0 40px rgba(180, 140, 255, 0.15)';
          setTimeout(function() { panel.style.boxShadow = ''; }, 1500);
        }
      });
    });

    /* ── 5. RIPPLE MAP ────────────────────────────────── */
    qsa('.ripple-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var leader = btn.getAttribute('data-leader');
        // Toggle buttons
        qsa('.ripple-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        // Toggle nodes
        qsa('.ripple-nodes').forEach(function(n) { n.classList.remove('active'); });
        var targetNodes = qs('.' + leader + '-nodes');
        if (targetNodes) targetNodes.classList.add('active');

        // Toggle pathway
        qsa('.ripple-pathway').forEach(function(p) { p.classList.remove('active'); });
        var targetPath = qs('.' + leader + '-pathway');
        if (targetPath) targetPath.classList.add('active');

        // Pulse rings
        qsa('.ripple-ring').forEach(function(ring) {
          ring.classList.remove('pulse');
          void ring.offsetWidth; // reflow
          ring.classList.add('pulse');
        });
      });
    });

    /* ── 6. SESSION THROUGH THEIR EYES ─────────────── */
    qsa('.eyes-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var view = btn.getAttribute('data-view');
        // Toggle buttons
        qsa('.eyes-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        // Toggle views
        qsa('.eyes-view').forEach(function(v) { v.classList.remove('active'); });
        var targetView = qs('#' + view + 'View');
        if (targetView) targetView.classList.add('active');
      });
    });

    /* ── 8. CREDENTIAL PROOF TILES ────────────────────── */
    qsa('.proof-tile').forEach(function(tile) {
      var meaning = tile.getAttribute('data-meaning');
      var impact = tile.getAttribute('data-impact');
      var meaningEl = tile.querySelector('.tile-panel-meaning');
      var impactEl = tile.querySelector('.tile-panel-impact');
      if (meaningEl && meaning) meaningEl.textContent = meaning;
      if (impactEl && impact) impactEl.textContent = impact;
    });

    /* ── 9. THE STANDARD NEVER RESTS ──────────────────── */
    var neverRests = qs('#neverRests');
    if (neverRests) {
      var nrTriggered = false;
      var nrObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          if (entry.isIntersecting && !nrTriggered) {
            nrTriggered = true;
            neverRests.classList.add('active');

            // After cue words appear, collapse them and show final
            setTimeout(function() {
              qsa('.nr-cue').forEach(function(cue) {
                cue.classList.add('collapse');
              });
              setTimeout(function() {
                var nrFinal = qs('.nr-final');
                if (nrFinal) nrFinal.classList.add('show');
              }, 600);
            }, 3000);
          }
        });
      }, { threshold: 0.3 });
      nrObserver.observe(neverRests);
    }

  })();

})();

/* ── CONVERSION RAIL ───────────────────────────────── */
(function initConversionRail() {
  var rail = document.getElementById('conversionRail');
  if (!rail) return;

  var shown = false;
  var scrollThreshold = 400;

  function checkScroll() {
    if (window.scrollY > scrollThreshold && !shown) {
      shown = true;
      rail.classList.add('is-visible');
    } else if (window.scrollY <= scrollThreshold && shown) {
      shown = false;
      rail.classList.remove('is-visible');
    }
  }

  // Debounced scroll handler
  var ticking = false;
  window.addEventListener('scroll', function() {
    if (!ticking) {
      window.requestAnimationFrame(function() {
        checkScroll();
        ticking = false;
      });
      ticking = true;
    }
  }, { passive: true });

  // Smooth scroll for internal links
  rail.querySelectorAll('a[href^="#"]').forEach(function(link) {
    link.addEventListener('click', function(e) {
      var target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Initial check
  checkScroll();
})();

/* ── DAILY SIGNAL BOARD ────────────────────────────── */
(function initDailySignal() {
  var dateEl = document.getElementById('signalDate');
  if (!dateEl) return;

  // Set today's date
  var now = new Date();
  var days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY'];
  var months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  dateEl.textContent = days[now.getDay()] + ' · ' + months[now.getMonth()] + ' ' + now.getDate() + ', ' + now.getFullYear();

  // Daily rotation data — seeded by day of year
  var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);

  var cues = [
    { text: '"Drive through the ground. Own every inch."', coach: '— Coach Richard' },
    { text: '"The warm-up is not optional. It is the first rep."', coach: '— Coach Richard' },
    { text: '"Slow is smooth. Smooth is fast."', coach: '— Coach Rebecca' },
    { text: '"If you are in this room, you already chose harder. Now finish."', coach: '— Coach Richard' },
    { text: '"Control the descent. Earn the ascent."', coach: '— Coach Richard' },
    { text: '"Your body does not know Monday from Friday. The standard is constant."', coach: '— Coach Rebecca' },
    { text: '"The first step wins or loses the play. We train the first step."', coach: '— Coach Richard' }
  ];

  var focuses = [
    'Lower Body Power + Sprint Mechanics',
    'Upper Body Strength + Mobility Flow',
    'Speed Development + Agility Circuits',
    'Full-Body Conditioning + Core Stability',
    'Olympic Lift Technique + Power Cleans',
    'Acceleration Drills + Lateral Quickness',
    'Recovery Protocol + Movement Assessment'
  ];

  var wins = [
    { text: 'Marcus T. — New squat PR: 365 lbs', meta: 'Athlete Path · Week 12' },
    { text: 'Sarah K. — First unassisted pull-up', meta: 'Adult Path · Week 8' },
    { text: 'Jaylen W. — 40-yard dash: 4.52s', meta: 'Athlete Path · Combine Prep' },
    { text: 'David R. — 50 lb total weight loss milestone', meta: 'Adult Path · Month 6' },
    { text: 'Emma C. — Independent warm-up completed', meta: 'Integrated Path · Week 16' },
    { text: 'Tyler B. — Vertical leap +3 inches', meta: 'Athlete Path · Week 10' },
    { text: 'Kim L. — Deadlift 1.5x bodyweight', meta: 'Adult Path · Week 14' }
  ];

  var idx = dayOfYear % cues.length;
  var cueEl = document.getElementById('signalCue');
  var cueMetaEl = cueEl ? cueEl.nextElementSibling : null;
  if (cueEl) cueEl.textContent = cues[idx].text;
  if (cueMetaEl) cueMetaEl.textContent = cues[idx].coach;

  var focusEl = document.getElementById('signalFocus');
  if (focusEl) focusEl.textContent = focuses[dayOfYear % focuses.length];

  var winEl = document.getElementById('signalWin');
  var winMeta = winEl ? winEl.nextElementSibling : null;
  var winData = wins[dayOfYear % wins.length];
  if (winEl) winEl.textContent = winData.text;
  if (winMeta) winMeta.textContent = winData.meta;

  // Randomize stats slightly based on day
  var base = dayOfYear % 50;
  var sessEl = document.getElementById('signalSessions');
  var prEl = document.getElementById('signalPRs');
  var evalEl = document.getElementById('signalEvals');
  var campEl = document.getElementById('signalCampSpots');
  if (sessEl) sessEl.textContent = 110 + base;
  if (prEl) prEl.textContent = 8 + (base % 12);
  if (evalEl) evalEl.textContent = 4 + (base % 8);
  if (campEl) campEl.textContent = Math.max(3, 20 - (base % 15));

  // Room temperature based on time of day
  var hour = now.getHours();
  var temp, activeLevel;
  if (hour >= 5 && hour < 9) { temp = 40; activeLevel = 'building'; }
  else if (hour >= 9 && hour < 15) { temp = 65; activeLevel = 'live'; }
  else if (hour >= 15 && hour < 19) { temp = 90; activeLevel = 'locked'; }
  else { temp = 20; activeLevel = 'calm'; }

  var tempFill = document.getElementById('tempBarFill');
  if (tempFill) tempFill.style.setProperty('--temp', temp + '%');

  document.querySelectorAll('.temp-level').forEach(function(el) {
    el.classList.toggle('active', el.getAttribute('data-level') === activeLevel);
  });

  // Update status label based on time
  var statusLabel = document.getElementById('signalStatusLabel');
  if (statusLabel) {
    if (hour >= 5 && hour < 20) {
      statusLabel.textContent = 'ROOM ACTIVE';
    } else {
      statusLabel.textContent = 'NEXT SESSION TOMORROW';
      var dot = statusLabel.previousElementSibling;
      if (dot) { dot.style.background = '#ff5500'; dot.style.boxShadow = '0 0 8px rgba(255,85,0,0.5)'; }
    }
  }

  // Camp countdown (next Saturday from now, as a sample)
  var nextCamp = new Date(now);
  nextCamp.setDate(now.getDate() + (6 - now.getDay() + 7) % 7 + 14);
  nextCamp.setHours(9, 0, 0, 0);
  var diff = nextCamp - now;
  var daysLeft = Math.floor(diff / 86400000);
  var hoursLeft = Math.floor((diff % 86400000) / 3600000);
  var minsLeft = Math.floor((diff % 3600000) / 60000);

  var countDays = document.getElementById('countDays');
  var countHours = document.getElementById('countHours');
  var countMins = document.getElementById('countMins');
  if (countDays) countDays.textContent = daysLeft < 10 ? '0' + daysLeft : daysLeft;
  if (countHours) countHours.textContent = hoursLeft < 10 ? '0' + hoursLeft : hoursLeft;
  if (countMins) countMins.textContent = minsLeft < 10 ? '0' + minsLeft : minsLeft;
})();
