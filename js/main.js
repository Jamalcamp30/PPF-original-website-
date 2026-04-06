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

  /* ── PPF INTRO — THE LINEUP: PERFORMANCE OS ─────── */
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

    /* Schedule a function; track for cleanup */
    function schedule(fn, ms) {
      var id = setTimeout(fn, ms);
      introTimers.push(id);
      return id;
    }

    /* Dismiss intro and hand off to hero */
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
      setTimeout(function () { intro.remove(); }, 700);
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

    /* ── Particle system: chalk dust ── */
    var particles = [];
    var MAX_PARTICLES = 220;

    function spawnChalk(cx, cy, count, spread, burst) {
      for (var i = 0; i < count; i++) {
        var angle = Math.random() * Math.PI * 2;
        var speed = (burst ? 2 : 0.3) + Math.random() * (burst ? 5 : 1.5);
        var size  = 0.5 + Math.random() * 2.5;
        particles.push({
          x: cx + (Math.random() - 0.5) * spread,
          y: cy + (Math.random() - 0.5) * spread * 0.3,
          vx: Math.cos(angle) * speed * (burst ? 1 : 0.3),
          vy: Math.sin(angle) * speed * 0.4 - (burst ? 1.5 : 0.3),
          size: size,
          life: 1,
          decay: 0.008 + Math.random() * 0.015,
          alpha: 0.3 + Math.random() * 0.5
        });
      }
      if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    }

    /* ── Field markings state ── */
    var fieldLine = { progress: 0, active: false, y: 0 };
    var hashMarks = [];
    var yardMarkers = [];
    var timingTicks = [];
    var measureArcs = [];
    var knurlLines = [];
    var speedTrails = [];

    function buildFieldElements() {
      var midY = H * 0.5;
      fieldLine.y = midY;

      // Hash marks (short perpendicular ticks along the field line)
      for (var i = 0; i < 18; i++) {
        hashMarks.push({
          x: W * 0.08 + (W * 0.84) * (i / 17),
          y: midY,
          len: 8 + Math.random() * 16,
          alpha: 0,
          targetAlpha: 0.15 + Math.random() * 0.25
        });
      }

      // Yard markers
      for (var j = 0; j < 6; j++) {
        yardMarkers.push({
          x: W * 0.15 + (W * 0.7) * (j / 5),
          y: midY + 24 + Math.random() * 10,
          text: String((j + 1) * 10),
          alpha: 0,
          targetAlpha: 0.12 + Math.random() * 0.1
        });
      }

      // Split timing ticks (horizontal dashes above the line)
      for (var k = 0; k < 12; k++) {
        timingTicks.push({
          x: W * 0.1 + Math.random() * W * 0.8,
          y: midY - 14 - Math.random() * 30,
          w: 6 + Math.random() * 18,
          alpha: 0,
          targetAlpha: 0.08 + Math.random() * 0.12
        });
      }

      // Measurement arcs
      for (var m = 0; m < 3; m++) {
        measureArcs.push({
          x: W * 0.3 + (W * 0.4) * (m / 2),
          y: midY,
          radius: 30 + Math.random() * 40,
          startAngle: -Math.PI * 0.3,
          endAngle: Math.PI * 0.3,
          alpha: 0,
          targetAlpha: 0.06 + Math.random() * 0.06
        });
      }

      // Barbell knurl texture (subtle vertical hatching near center)
      var knurlCx = W * 0.5;
      for (var n = 0; n < 20; n++) {
        knurlLines.push({
          x: knurlCx - 60 + n * 6,
          y: midY + 40 + Math.random() * 20,
          h: 4 + Math.random() * 8,
          alpha: 0,
          targetAlpha: 0.04 + Math.random() * 0.04
        });
      }

      // Speed trails (ghostly horizontal streaks)
      for (var s = 0; s < 5; s++) {
        speedTrails.push({
          x: W * 0.05 + Math.random() * W * 0.3,
          y: midY - 50 + Math.random() * 100,
          w: 40 + Math.random() * 120,
          alpha: 0,
          targetAlpha: 0.03 + Math.random() * 0.04
        });
      }
    }

    /* ── Logo geometry pieces (PPF assembled from field lines) ── */
    var logoPieces = [];
    var logoAssembled = false;
    var logoAlpha = 0;

    function buildLogoPieces() {
      var cx = W * 0.5;
      var cy = H * 0.5;
      var scale = Math.min(W, H) * 0.0014;
      if (scale < 0.5) scale = 0.5;

      // Each piece: {rects: [{x,y,w,h}], color, offsetX, offsetY, assembled}
      // The logo is PPF with bars — built from hash marks sliding into position

      var s = scale;
      var baseX = cx - 110 * s;
      var baseY = cy - 50 * s;

      // Orange bars left
      var barData = [
        { x: -82, y: 5, w: 7, h: 60 },
        { x: -70, y: -10, w: 7, h: 80 },
        { x: -58, y: -20, w: 7, h: 100 },
        { x: -46, y: -10, w: 7, h: 80 }
      ];
      // Orange bars right
      var barDataR = [
        { x: 152, y: -10, w: 7, h: 80 },
        { x: 164, y: -20, w: 7, h: 100 },
        { x: 176, y: -10, w: 7, h: 80 },
        { x: 188, y: 5, w: 7, h: 60 }
      ];

      // P1 rects
      var p1 = [
        { x: 0, y: -20, w: 10, h: 100 },
        { x: 10, y: -20, w: 28, h: 10 },
        { x: 38, y: -20, w: 10, h: 50 },
        { x: 10, y: 20, w: 28, h: 10 }
      ];
      // P2 rects
      var p2 = [
        { x: 56, y: -20, w: 10, h: 100 },
        { x: 66, y: -20, w: 28, h: 10 },
        { x: 94, y: -20, w: 10, h: 50 },
        { x: 66, y: 20, w: 28, h: 10 }
      ];
      // F rects
      var fLetter = [
        { x: 112, y: -20, w: 10, h: 100 },
        { x: 122, y: -20, w: 38, h: 10 },
        { x: 122, y: 20, w: 28, h: 10 }
      ];

      function addPieces(rects, color, scatterRange) {
        rects.forEach(function (r) {
          var scatter = scatterRange || 300;
          logoPieces.push({
            fx: cx + r.x * s,
            fy: cy + r.y * s,
            fw: r.w * s,
            fh: r.h * s,
            // Start scattered (coming from field geometry)
            x: cx + r.x * s + (Math.random() - 0.5) * scatter,
            y: cy + r.y * s + (Math.random() - 0.5) * scatter * 0.5,
            w: r.w * s,
            h: r.h * s,
            color: color,
            progress: 0
          });
        });
      }

      addPieces(barData, '#ff5500', 250);
      addPieces(barDataR, '#ff5500', 250);
      addPieces(p1, '#ffffff', 350);
      addPieces(p2, '#ffffff', 350);
      addPieces(fLetter, '#ffffff', 350);

      // ATHLETICS text position for rendering
      logoPieces.athleticsY = cy + 65 * s;
      logoPieces.athleticsSize = Math.max(10, 18 * s);
      logoPieces.cx = cx;
    }

    /* ── Athlete stance silhouette (ghost) ── */
    var athleteGhost = { alpha: 0, x: 0, y: 0 };

    function drawAthleteSilhouette(a) {
      if (a <= 0.01) return;
      ctx.save();
      ctx.globalAlpha = a * 0.12;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';

      var gx = athleteGhost.x;
      var gy = athleteGhost.y;
      var s = Math.min(W, H) * 0.001;
      if (s < 0.4) s = 0.4;

      // Simplified ready-stance silhouette (sprinter in set position)
      ctx.beginPath();
      // Head
      ctx.arc(gx, gy - 70 * s, 8 * s, 0, Math.PI * 2);
      ctx.stroke();
      // Torso (angled forward)
      ctx.beginPath();
      ctx.moveTo(gx, gy - 62 * s);
      ctx.lineTo(gx + 15 * s, gy - 20 * s);
      ctx.stroke();
      // Front arm (down to block)
      ctx.beginPath();
      ctx.moveTo(gx + 5 * s, gy - 45 * s);
      ctx.lineTo(gx + 25 * s, gy - 10 * s);
      ctx.stroke();
      // Back arm
      ctx.beginPath();
      ctx.moveTo(gx + 5 * s, gy - 45 * s);
      ctx.lineTo(gx - 20 * s, gy - 30 * s);
      ctx.stroke();
      // Front leg (bent, foot on line)
      ctx.beginPath();
      ctx.moveTo(gx + 15 * s, gy - 20 * s);
      ctx.lineTo(gx + 5 * s, gy + 10 * s);
      ctx.lineTo(gx + 20 * s, gy + 15 * s);
      ctx.stroke();
      // Back leg (extended)
      ctx.beginPath();
      ctx.moveTo(gx + 15 * s, gy - 20 * s);
      ctx.lineTo(gx - 25 * s, gy + 20 * s);
      ctx.lineTo(gx - 35 * s, gy + 15 * s);
      ctx.stroke();

      ctx.restore();
    }

    /* ── Animation phases (driven by timestamp) ── */
    var startTime = 0;
    var phase = 0; // 0=black, 1=fieldLine, 2=chalk, 3=logo, 4=scan+metrics, 5=command, 6=impact, 7=heroDismiss
    var athleticsAlpha = 0;

    // Web Audio for immersive sound
    var audioCtx = null;
    function getAudioCtx() {
      if (!audioCtx) {
        try { audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
        catch (e) { /* fail silently */ }
      }
      return audioCtx;
    }

    function playSound(type) {
      try {
        var ac = getAudioCtx();
        if (!ac) return;
        var now = ac.currentTime;

        if (type === 'chalk') {
          // Sharp burst — like hand clap + starting gun
          var bufLen = ac.sampleRate * 0.12;
          var buf = ac.createBuffer(1, bufLen, ac.sampleRate);
          var d = buf.getChannelData(0);
          for (var i = 0; i < bufLen; i++) {
            d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ac.sampleRate * 0.015));
          }
          var src = ac.createBufferSource();
          src.buffer = buf;
          var filt = ac.createBiquadFilter();
          filt.type = 'highpass';
          filt.frequency.value = 2000;
          var g = ac.createGain();
          g.gain.setValueAtTime(0.12, now);
          g.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
          src.connect(filt);
          filt.connect(g);
          g.connect(ac.destination);
          src.start();
        }

        if (type === 'lock') {
          // Metallic snap for logo lock
          var bufLen2 = ac.sampleRate * 0.08;
          var buf2 = ac.createBuffer(1, bufLen2, ac.sampleRate);
          var d2 = buf2.getChannelData(0);
          for (var j = 0; j < bufLen2; j++) {
            d2[j] = (Math.random() * 2 - 1) * Math.exp(-j / (ac.sampleRate * 0.01));
          }
          var src2 = ac.createBufferSource();
          src2.buffer = buf2;
          var bp = ac.createBiquadFilter();
          bp.type = 'bandpass';
          bp.frequency.value = 4000;
          bp.Q.value = 8;
          var g2 = ac.createGain();
          g2.gain.setValueAtTime(0.1, now);
          g2.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
          src2.connect(bp);
          bp.connect(g2);
          g2.connect(ac.destination);
          src2.start();
        }

        if (type === 'impact') {
          // Deep thump — foot strike / loaded bar
          var osc = ac.createOscillator();
          var osc2 = ac.createOscillator();
          var gI = ac.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(80, now);
          osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);
          osc2.type = 'triangle';
          osc2.frequency.setValueAtTime(160, now);
          osc2.frequency.exponentialRampToValueAtTime(50, now + 0.25);
          gI.gain.setValueAtTime(0.15, now);
          gI.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
          osc.connect(gI);
          osc2.connect(gI);
          gI.connect(ac.destination);
          osc.start();
          osc2.start();
          osc.stop(now + 0.5);
          osc2.stop(now + 0.5);
        }
      } catch (e) { /* Web Audio unsupported */ }
    }

    /* ── Main render loop ── */
    function render(timestamp) {
      if (introDismissed) return;

      if (!startTime) {
        startTime = timestamp;
        buildFieldElements();
        buildLogoPieces();
        athleteGhost.x = W * 0.5 + 40;
        athleteGhost.y = H * 0.5 + 10;
      }

      var elapsed = (timestamp - startTime) / 1000; // seconds

      ctx.clearRect(0, 0, W, H);

      // ── Phase 0: Black screen tension (0.0–0.4s) ──
      // Just black. Nothing drawn.

      // ── Phase 1: Field line paints on (0.4–1.1s) ──
      if (elapsed >= 0.4 && phase < 1) phase = 1;
      if (phase >= 1) {
        var lineProgress = clamp((elapsed - 0.4) / 0.7, 0, 1);
        // Ease out
        lineProgress = 1 - Math.pow(1 - lineProgress, 3);
        fieldLine.progress = lineProgress;

        // Draw the field line — slightly imperfect (wobbly)
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.beginPath();
        var startX = W * 0.03;
        var endX = startX + (W * 0.94) * lineProgress;
        var baseY = fieldLine.y;
        ctx.moveTo(startX, baseY);
        // Add slight imperfection
        var segments = Math.max(4, Math.floor((endX - startX) / 30));
        for (var si = 1; si <= segments; si++) {
          var sx = startX + (endX - startX) * (si / segments);
          var sy = baseY + (Math.sin(si * 2.7) * 0.8);
          ctx.lineTo(sx, sy);
        }
        ctx.stroke();
        ctx.restore();
      }

      // ── Phase 2: Chalk burst + marker fragments (1.1–1.8s) ──
      if (elapsed >= 1.1 && phase < 2) {
        phase = 2;
        playSound('chalk');
        // Burst chalk particles from the field line
        spawnChalk(W * 0.5, fieldLine.y, 140, W * 0.7, true);
      }
      if (phase >= 2) {
        var fragProgress = clamp((elapsed - 1.1) / 0.7, 0, 1);
        fragProgress = 1 - Math.pow(1 - fragProgress, 2);

        // Hash marks
        ctx.save();
        hashMarks.forEach(function (h) {
          h.alpha = h.targetAlpha * fragProgress;
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + h.alpha + ')';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(h.x, h.y - h.len / 2);
          ctx.lineTo(h.x, h.y + h.len / 2);
          ctx.stroke();
        });

        // Yard markers
        ctx.font = '600 10px Inter, sans-serif';
        ctx.textAlign = 'center';
        yardMarkers.forEach(function (ym) {
          ym.alpha = ym.targetAlpha * fragProgress;
          ctx.fillStyle = 'rgba(255, 255, 255, ' + ym.alpha + ')';
          ctx.fillText(ym.text, ym.x, ym.y);
        });

        // Timing ticks
        timingTicks.forEach(function (t) {
          t.alpha = t.targetAlpha * fragProgress;
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + t.alpha + ')';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(t.x, t.y);
          ctx.lineTo(t.x + t.w, t.y);
          ctx.stroke();
        });

        // Measurement arcs
        measureArcs.forEach(function (a) {
          a.alpha = a.targetAlpha * fragProgress;
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + a.alpha + ')';
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius, a.startAngle, a.endAngle);
          ctx.stroke();
        });

        // Knurl texture
        knurlLines.forEach(function (kl) {
          kl.alpha = kl.targetAlpha * fragProgress;
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + kl.alpha + ')';
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(kl.x, kl.y);
          ctx.lineTo(kl.x, kl.y + kl.h);
          ctx.stroke();
        });

        // Speed trails
        speedTrails.forEach(function (st) {
          st.alpha = st.targetAlpha * fragProgress;
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + st.alpha + ')';
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(st.x, st.y);
          ctx.lineTo(st.x + st.w, st.y);
          ctx.stroke();
        });
        ctx.restore();

        // Athlete ghost silhouette — appears inside chalk, fades quickly
        if (elapsed >= 1.3 && elapsed < 2.0) {
          var ghostT = (elapsed - 1.3) / 0.7;
          athleteGhost.alpha = ghostT < 0.4 ? ghostT / 0.4 : Math.max(0, 1 - (ghostT - 0.4) / 0.6);
          drawAthleteSilhouette(athleteGhost.alpha);
        }
      }

      // ── Phase 3: Logo assembles from field geometry (1.8–2.5s) ──
      if (elapsed >= 1.8 && phase < 3) {
        phase = 3;
        playSound('lock');
        logoAssembled = true;
      }
      if (phase >= 3 && logoPieces.length) {
        var logoT = clamp((elapsed - 1.8) / 0.7, 0, 1);
        // Spring ease
        var eased = 1 - Math.pow(1 - logoT, 3);
        logoAlpha = eased;

        ctx.save();
        logoPieces.forEach(function (p) {
          if (typeof p === 'function' || p.fx === undefined) return;
          p.progress = eased;
          var curX = p.x + (p.fx - p.x) * eased;
          var curY = p.y + (p.fy - p.y) * eased;
          ctx.globalAlpha = eased;
          ctx.fillStyle = p.color;
          ctx.fillRect(curX, curY, p.fw, p.fh);
        });

        // ATHLETICS text
        athleticsAlpha = clamp((elapsed - 2.1) / 0.4, 0, 1);
        if (athleticsAlpha > 0) {
          ctx.globalAlpha = athleticsAlpha;
          ctx.fillStyle = '#ff5500';
          ctx.font = '600 ' + logoPieces.athleticsSize + 'px "Bebas Neue", Impact, sans-serif';
          ctx.textAlign = 'center';
          ctx.letterSpacing = '0.3em';
          ctx.fillText('ATHLETICS', logoPieces.cx, logoPieces.athleticsY);
        }

        // Alignment anchor dots at logo corners
        if (eased > 0.6) {
          var dotAlpha = (eased - 0.6) / 0.4;
          ctx.fillStyle = 'rgba(255, 85, 0, ' + (dotAlpha * 0.5) + ')';
          var bx = logoPieces[0] ? logoPieces[0].fx : 0;
          var by = logoPieces[0] ? logoPieces[0].fy : 0;
          var lastP = logoPieces[logoPieces.length - 1];
          if (lastP && lastP.fx !== undefined) {
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

      // ── Phase 4: Readiness scan + metrics boot (2.5–3.1s) ──
      if (elapsed >= 2.5 && phase < 4) {
        phase = 4;
        intro.classList.add('phase-scan');
        intro.classList.add('phase-metrics');
      }

      // ── Phase 5: Coaching command (3.1–3.8s) ──
      if (elapsed >= 3.1 && phase < 5) {
        phase = 5;
        intro.classList.add('phase-command');
      }

      // ── Phase 6: Impact ripple + hero conversion (3.8–4.5s) ──
      if (elapsed >= 3.8 && phase < 6) {
        phase = 6;
        playSound('impact');
        intro.classList.add('phase-impact');

        // Chalk lifts upward, ground shock
        spawnChalk(W * 0.5, fieldLine.y, 60, W * 0.5, false);

        // Fade everything down and outward
        schedule(dismissIntro, 700);
      }

      // Fade out field elements during phase 6 transition
      if (phase >= 6) {
        var fadeOut = clamp((elapsed - 3.8) / 0.7, 0, 1);
        ctx.save();
        ctx.globalAlpha = 1 - fadeOut;
        // Re-draw field line fading
        if (fieldLine.progress > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, ' + (0.7 * (1 - fadeOut)) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(W * 0.03, fieldLine.y);
          ctx.lineTo(W * 0.03 + W * 0.94, fieldLine.y);
          ctx.stroke();
        }
        ctx.restore();
      }

      // ── Render chalk particles (always) ──
      ctx.save();
      for (var pi = particles.length - 1; pi >= 0; pi--) {
        var p = particles[pi];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.02; // float upward
        p.vx *= 0.98;
        p.life -= p.decay;
        if (p.life <= 0) {
          particles.splice(pi, 1);
          continue;
        }
        ctx.globalAlpha = p.alpha * p.life;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      canvasRafId = requestAnimationFrame(render);
    }

    // Kick off
    canvasRafId = requestAnimationFrame(render);

    // Safety: force dismiss after 6s max
    schedule(dismissIntro, 6000);
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

    // Switch membership tab to match
    const matchingMembershipTab = qs(`.membership-tab[data-mtab="${path}"]`);
    if (matchingMembershipTab) matchingMembershipTab.click();
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

})();
