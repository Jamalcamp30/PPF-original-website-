/* ============================================================
   PPF COMMAND LAYER — Next-Level Interactive Systems
   Decision-Maker Mode, Readiness Fingerprint, Session X-Ray,
   Live Availability Radar, Coach Cue Waveform, Standard Ledger,
   Pipeline Map, Benchmark Ladder, Family Trust Mode, Passport-to-Plan
   ============================================================ */
(function () {
  'use strict';

  /* ── Helpers ── */
  var qs = function (s, p) { return (p || document).querySelector(s); };
  var qsa = function (s, p) { return Array.from((p || document).querySelectorAll(s)); };

  function hexToRgba(hex, alpha) {
    hex = hex.replace('#', '');
    var r = parseInt(hex.substring(0, 2), 16);
    var g = parseInt(hex.substring(2, 4), 16);
    var b = parseInt(hex.substring(4, 6), 16);
    return 'rgba(' + r + ',' + g + ',' + b + ',' + alpha + ')';
  }

  /* ── Shared Audio Context & Unlock ── */
  var _audioCtx = null;
  var _audioUnlocked = false;

  function getAudioCtx() {
    if (!_audioCtx) {
      try { _audioCtx = new (window.AudioContext || window.webkitAudioContext)(); }
      catch (e) { /* Web Audio unsupported */ }
    }
    return _audioCtx;
  }

  function unlockAudio() {
    if (_audioUnlocked) return;
    var ac = getAudioCtx();
    if (!ac) return;
    if (ac.state === 'suspended') {
      ac.resume().catch(function () {});
    }
    _audioUnlocked = true;
  }

  // Unlock on first real user interaction
  window.addEventListener('pointerdown', unlockAudio, { once: true });
  window.addEventListener('keydown', unlockAudio, { once: true });

  /**
   * Play a synthesized coaching-cue tone.
   * Each cue type gets a distinct pitch / character so cards feel unique.
   */
  var CUE_TONES = {
    sprint1:         { freq: 440, type: 'sawtooth', dur: 0.35 },
    sprint2:         { freq: 466, type: 'sawtooth', dur: 0.35 },
    strength1:       { freq: 330, type: 'triangle', dur: 0.40 },
    strength2:       { freq: 349, type: 'triangle', dur: 0.40 },
    integrated1:     { freq: 392, type: 'sine',     dur: 0.45 },
    accountability1: { freq: 294, type: 'square',   dur: 0.30 }
  };

  function playCueTone(cueKey) {
    try {
      unlockAudio();
      var ac = getAudioCtx();
      if (!ac) return;
      var cfg = CUE_TONES[cueKey] || { freq: 400, type: 'sine', dur: 0.35 };
      var now = ac.currentTime;

      var osc = ac.createOscillator();
      var gain = ac.createGain();
      osc.type = cfg.type;
      osc.frequency.setValueAtTime(cfg.freq, now);
      osc.frequency.exponentialRampToValueAtTime(cfg.freq * 0.7, now + cfg.dur);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.linearRampToValueAtTime(0.18, now + cfg.dur * 0.15);
      gain.gain.exponentialRampToValueAtTime(0.001, now + cfg.dur);
      osc.connect(gain);
      gain.connect(ac.destination);
      osc.start(now);
      osc.stop(now + cfg.dur + 0.05);
    } catch (e) { /* silent */ }
  }

  /* ══════════════════════════════════════════════
     1. READINESS FINGERPRINT
     ══════════════════════════════════════════════ */
  function initReadinessFingerprint() {
    var wrap = qs('#readinessFingerprint');
    if (!wrap) return;

    var canvas = qs('.rf-canvas', wrap);
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var sliders = qsa('.rf-slider', wrap);
    var insightText = qs('.rf-insight-text', wrap);
    var pathCta = qs('.rf-path-cta', wrap);

    var dims = ['ENERGY', 'CONFIDENCE', 'SORENESS', 'CONSISTENCY'];
    var colors = {
      athlete: '#ff5500',
      adult: '#6a8fff',
      integrated: '#50c878'
    };

    function getValues() {
      return sliders.map(function (s) { return parseInt(s.value, 10); });
    }

    function detectPath(vals) {
      var energy = vals[0], confidence = vals[1], soreness = vals[2], consistency = vals[3];
      if (energy >= 7 && confidence >= 6) return 'athlete';
      if (consistency >= 7 && soreness <= 5) return 'adult';
      return 'integrated';
    }

    var insights = {
      athlete: { text: 'Speed needs structure. Your energy and confidence say you are ready to compete — PPF will build the system around your edge.', cta: 'START ATHLETE EVALUATION', href: '#paths' },
      adult: { text: 'Strength needs rhythm. Your consistency is your weapon — PPF will channel it into measurable, lasting change.', cta: 'START ADULT ASSESSMENT', href: '#paths' },
      integrated: { text: 'Progress starts with trust. PPF will meet you exactly where you are and build from a foundation of dignity and patience.', cta: 'START INTEGRATED CONSULT', href: '#paths' }
    };

    function drawFingerprint(vals) {
      var dpr = window.devicePixelRatio || 1;
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var cx = w / 2, cy = h / 2;
      var maxR = Math.min(w, h) / 2 - 30;
      var path = detectPath(vals);
      var mainColor = colors[path];

      ctx.clearRect(0, 0, w, h);

      // Draw grid rings
      for (var r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / 4) * r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Draw axis lines
      for (var i = 0; i < 4; i++) {
        var angle = (Math.PI * 2 / 4) * i - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(angle) * maxR, cy + Math.sin(angle) * maxR);
        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Labels
        var lx = cx + Math.cos(angle) * (maxR + 16);
        var ly = cy + Math.sin(angle) * (maxR + 16);
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(dims[i], lx, ly);
      }

      // Draw filled shape
      ctx.beginPath();
      for (var j = 0; j < 4; j++) {
        var a = (Math.PI * 2 / 4) * j - Math.PI / 2;
        var radius = (vals[j] / 10) * maxR;
        var px = cx + Math.cos(a) * radius;
        var py = cy + Math.sin(a) * radius;
        if (j === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.fillStyle = hexToRgba(mainColor, 0.12);
      ctx.fill();
      ctx.strokeStyle = mainColor;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw dots at vertices
      for (var k = 0; k < 4; k++) {
        var a2 = (Math.PI * 2 / 4) * k - Math.PI / 2;
        var r2 = (vals[k] / 10) * maxR;
        var dx = cx + Math.cos(a2) * r2;
        var dy = cy + Math.sin(a2) * r2;
        ctx.beginPath();
        ctx.arc(dx, dy, 4, 0, Math.PI * 2);
        ctx.fillStyle = mainColor;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(dx, dy, 7, 0, Math.PI * 2);
        ctx.strokeStyle = hexToRgba(mainColor, 0.3);
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Update insight
      var info = insights[path];
      if (insightText) insightText.textContent = info.text;
      if (pathCta) {
        pathCta.textContent = info.cta;
        pathCta.href = info.href;
        pathCta.style.borderColor = hexToRgba(mainColor, 0.4);
        pathCta.style.color = mainColor;
        pathCta.style.background = hexToRgba(mainColor, 0.12);
      }
    }

    sliders.forEach(function (s) {
      var valEl = qs('.rf-slider-value', s.closest('.rf-slider-group'));
      s.addEventListener('input', function () {
        if (valEl) valEl.textContent = s.value;
        drawFingerprint(getValues());
      });
    });

    // Initial draw
    drawFingerprint(getValues());
  }

  /* ══════════════════════════════════════════════
     2. SESSION X-RAY
     ══════════════════════════════════════════════ */
  function initSessionXray() {
    var cards = qsa('.xray-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      // Toggle expand
      card.addEventListener('click', function (e) {
        if (e.target.closest('.xray-hotspot')) return;
        card.classList.toggle('expanded');
      });

      // Hotspots
      var hotspots = qsa('.xray-hotspot', card);
      hotspots.forEach(function (hs) {
        hs.addEventListener('click', function (e) {
          e.stopPropagation();
          var wasActive = hs.classList.contains('active');
          hotspots.forEach(function (h) { h.classList.remove('active'); });
          if (!wasActive) hs.classList.add('active');
        });
      });
    });

    // Close hotspots on outside click
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.xray-card')) {
        qsa('.xray-hotspot.active').forEach(function (h) { h.classList.remove('active'); });
      }
    });
  }

  /* ══════════════════════════════════════════════
     3. LIVE AVAILABILITY RADAR
     ══════════════════════════════════════════════ */
  function initRadar() {
    var canvas = qs('.radar-canvas');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var sweepAngle = 0;

    var slots = [
      { label: 'ATHLETE', angle: 0, distance: 0.7, status: 'open' },
      { label: 'ADULT', angle: Math.PI * 0.6, distance: 0.55, status: 'limited' },
      { label: 'INTEGRATED', angle: Math.PI * 1.2, distance: 0.6, status: 'open' },
      { label: 'CAMP', angle: Math.PI * 1.7, distance: 0.8, status: 'filling' },
      { label: 'PT', angle: Math.PI * 0.3, distance: 0.45, status: 'open' }
    ];

    var statusColors = { open: '#50c878', limited: '#ffaa00', filling: '#ff5500' };

    function draw() {
      var w = canvas.clientWidth;
      var h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      var cx = w / 2, cy = h / 2;
      var maxR = Math.min(w, h) / 2 - 20;

      ctx.clearRect(0, 0, w, h);

      // Grid rings
      for (var r = 1; r <= 4; r++) {
        ctx.beginPath();
        ctx.arc(cx, cy, (maxR / 4) * r, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(255,255,255,0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Cross lines
      for (var i = 0; i < 8; i++) {
        var a = (Math.PI / 4) * i;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + Math.cos(a) * maxR, cy + Math.sin(a) * maxR);
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Sweep
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, maxR, sweepAngle - 0.5, sweepAngle, false);
      ctx.closePath();
      var grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      grad.addColorStop(0, 'rgba(255,85,0,0)');
      grad.addColorStop(1, 'rgba(255,85,0,0.12)');
      ctx.fillStyle = grad;
      ctx.fill();

      // Sweep line
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(sweepAngle) * maxR, cy + Math.sin(sweepAngle) * maxR);
      ctx.strokeStyle = 'rgba(255,85,0,0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Blips
      slots.forEach(function (slot) {
        var x = cx + Math.cos(slot.angle) * (slot.distance * maxR);
        var y = cy + Math.sin(slot.angle) * (slot.distance * maxR);
        var color = statusColors[slot.status];

        // Glow
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, Math.PI * 2);
        ctx.fillStyle = hexToRgba(color, 0.15);
        ctx.fill();

        // Dot
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();

        // Label
        ctx.fillStyle = 'rgba(255,255,255,0.4)';
        ctx.font = '9px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(slot.label, x, y - 14);
      });

      // Center dot
      ctx.beginPath();
      ctx.arc(cx, cy, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#ff5500';
      ctx.fill();

      sweepAngle += 0.015;
      if (sweepAngle > Math.PI * 2) sweepAngle -= Math.PI * 2;
      requestAnimationFrame(draw);
    }

    // Only animate when visible
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) draw();
    }, { threshold: 0.1 });
    observer.observe(canvas);
  }

  /* ══════════════════════════════════════════════
     4. COACH CUE WAVEFORM
     ══════════════════════════════════════════════ */
  function initCueWaveform() {
    var cards = qsa('.waveform-card');
    if (!cards.length) return;

    cards.forEach(function (card) {
      var vizCanvas = qs('canvas', card);
      if (!vizCanvas) return;
      var vizCtx = vizCanvas.getContext('2d');
      var bars = [];
      for (var i = 0; i < 32; i++) {
        bars.push(0.1 + Math.random() * 0.9);
      }

      function drawWaveform(playing) {
        var dpr = window.devicePixelRatio || 1;
        var w = vizCanvas.clientWidth;
        var h = vizCanvas.clientHeight;
        vizCanvas.width = w * dpr;
        vizCanvas.height = h * dpr;
        vizCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        vizCtx.clearRect(0, 0, w, h);

        var barW = w / bars.length;
        var midY = h / 2;

        bars.forEach(function (v, i) {
          var barH = v * midY * 0.85;
          var x = i * barW + barW * 0.15;
          var bw = barW * 0.7;

          if (playing) {
            vizCtx.fillStyle = 'rgba(255,85,0,0.7)';
          } else {
            vizCtx.fillStyle = 'rgba(255,255,255,0.15)';
          }
          vizCtx.fillRect(x, midY - barH, bw, barH);
          vizCtx.fillRect(x, midY, bw, barH * 0.6);
        });
      }

      drawWaveform(false);

      var animId = null;
      var phase = 0;

      function animateWaveform() {
        phase += 0.15;
        for (var i = 0; i < bars.length; i++) {
          bars[i] = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(phase + i * 0.4));
        }
        drawWaveform(true);
        animId = requestAnimationFrame(animateWaveform);
      }

      card.addEventListener('click', function () {
        var wasPlaying = card.classList.contains('playing');
        // Stop all others
        qsa('.waveform-card.playing').forEach(function (c) {
          c.classList.remove('playing');
        });
        if (animId) { cancelAnimationFrame(animId); animId = null; }

        if (!wasPlaying) {
          card.classList.add('playing');
          animateWaveform();
          // Play synthesized coaching-cue tone for this card
          playCueTone(card.getAttribute('data-cue') || '');
          // Auto-stop after 4 seconds
          setTimeout(function () {
            card.classList.remove('playing');
            if (animId) { cancelAnimationFrame(animId); animId = null; }
            drawWaveform(false);
          }, 4000);
        } else {
          drawWaveform(false);
        }
      });
    });
  }

  /* ══════════════════════════════════════════════
     5. STANDARD LEDGER — Live Activity Feed
     ══════════════════════════════════════════════ */
  function initStandardLedger() {
    var container = qs('.ledger-rows');
    if (!container) return;

    var entries = [
      { type: 'pr', cls: 'pr', text: 'New squat PR recorded — 365 lbs', time: '2m ago' },
      { type: 'streak', cls: 'streak', text: '12-week attendance streak — Adult Path', time: '8m ago' },
      { type: 'benchmark', cls: 'benchmark', text: '40-yard benchmark achieved — 4.52s', time: '14m ago' },
      { type: 'attendance', cls: 'attendance', text: '94% weekly attendance — Room standard met', time: '22m ago' },
      { type: 'assessment', cls: 'assessment', text: 'Athlete evaluation completed — new member', time: '31m ago' },
      { type: 'camp', cls: 'camp', text: 'Speed Camp registration — 3 new spots filled', time: '45m ago' },
      { type: 'pr', cls: 'pr', text: 'Vertical leap PR — 32.5 inches', time: '1h ago' },
      { type: 'streak', cls: 'streak', text: '8-week consistency streak — Integrated Path', time: '1h ago' },
      { type: 'benchmark', cls: 'benchmark', text: 'Push-up benchmark cleared — 55 reps', time: '2h ago' },
      { type: 'attendance', cls: 'attendance', text: 'Family trust milestone — 6 months active', time: '2h ago' },
      { type: 'pr', cls: 'pr', text: 'Deadlift PR — 2.1x bodyweight', time: '3h ago' },
      { type: 'assessment', cls: 'assessment', text: 'Adult assessment booked — next available slot', time: '3h ago' },
      { type: 'camp', cls: 'camp', text: 'Combine Prep Camp — 85% capacity reached', time: '4h ago' },
      { type: 'streak', cls: 'streak', text: '20-session streak — Athlete Path standard', time: '5h ago' },
      { type: 'benchmark', cls: 'benchmark', text: 'Pro Agility benchmark hit — 4.18s', time: '5h ago' }
    ];

    // Shuffle based on day
    var now = new Date();
    var dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 1)) / 86400000);
    var shuffled = entries.slice().sort(function () { return 0.5 - seededRandom(dayOfYear); });

    function seededRandom(seed) {
      var x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }

    // Show initial entries
    var shown = Math.min(8, shuffled.length);
    for (var i = 0; i < shown; i++) {
      container.appendChild(createRow(shuffled[i]));
    }

    // Cycle new entries every 12 seconds
    var idx = shown;
    setInterval(function () {
      if (container.children.length >= 8 && container.lastChild) {
        container.lastChild.remove();
      }
      var entry = shuffled[idx % shuffled.length];
      var row = createRow(entry);
      container.insertBefore(row, container.firstChild);
      idx++;
    }, 12000);

    function createRow(entry) {
      var row = document.createElement('div');
      row.className = 'ledger-row';
      row.innerHTML =
        '<div class="ledger-row-type ' + entry.cls + '">' + entry.type.toUpperCase() + '</div>' +
        '<div class="ledger-row-text">' + entry.text + '</div>' +
        '<div class="ledger-row-time">' + entry.time + '</div>';
      return row;
    }
  }

  /* ══════════════════════════════════════════════
     6. PIPELINE MAP — Local Origins Visualization
     ══════════════════════════════════════════════ */
  function initPipelineMap() {
    var mapEl = qs('.pipeline-map canvas');
    if (!mapEl) return;
    var ctx = mapEl.getContext('2d');
    var dpr = window.devicePixelRatio || 1;

    var locations = [
      { name: 'Cumming', x: 0.5, y: 0.45, size: 14, isPPF: true },
      { name: 'Alpharetta', x: 0.48, y: 0.65, size: 8 },
      { name: 'Johns Creek', x: 0.58, y: 0.7, size: 7 },
      { name: 'Milton', x: 0.42, y: 0.58, size: 6 },
      { name: 'Roswell', x: 0.38, y: 0.72, size: 6 },
      { name: 'Suwanee', x: 0.65, y: 0.55, size: 5 },
      { name: 'Buford', x: 0.72, y: 0.42, size: 4 },
      { name: 'Dawsonville', x: 0.35, y: 0.25, size: 4 },
      { name: 'Dahlonega', x: 0.28, y: 0.12, size: 3 },
      { name: 'Gainesville', x: 0.68, y: 0.2, size: 3 },
      { name: 'Canton', x: 0.2, y: 0.4, size: 3 },
      { name: 'Woodstock', x: 0.25, y: 0.55, size: 4 }
    ];

    function draw() {
      var w = mapEl.clientWidth;
      var h = mapEl.clientHeight;
      mapEl.width = w * dpr;
      mapEl.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);

      // Draw connection lines from PPF to each location
      var ppf = locations[0];
      locations.forEach(function (loc, i) {
        if (i === 0) return;
        ctx.beginPath();
        ctx.moveTo(ppf.x * w, ppf.y * h);
        ctx.lineTo(loc.x * w, loc.y * h);
        ctx.strokeStyle = 'rgba(255,85,0,0.08)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // Draw dots
      locations.forEach(function (loc) {
        var x = loc.x * w;
        var y = loc.y * h;

        if (loc.isPPF) {
          // PPF center glow
          ctx.beginPath();
          ctx.arc(x, y, 20, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,85,0,0.08)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, 10, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(255,85,0,0.2)';
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(x, y, loc.size / 2 + 1, 0, Math.PI * 2);
        ctx.fillStyle = loc.isPPF ? '#ff5500' : 'rgba(255,85,0,0.5)';
        ctx.fill();

        // Label
        ctx.fillStyle = loc.isPPF ? '#ff5500' : 'rgba(255,255,255,0.4)';
        ctx.font = (loc.isPPF ? 'bold 11px' : '9px') + ' Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(loc.name, x, y + loc.size / 2 + 14);
      });
    }

    // Observe for visibility
    var observer = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) draw();
    }, { threshold: 0.1 });
    observer.observe(mapEl);

    window.addEventListener('resize', function () { draw(); });
  }

  /* ══════════════════════════════════════════════
     7. BENCHMARK LADDER — Interactive Tiers
     ══════════════════════════════════════════════ */
  function initBenchmarkLadder() {
    var ladder = qs('.bench-ladder');
    if (!ladder) return;

    var rows = qsa('.bench-ladder-row:not(.header)', ladder);
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          var fill = qs('.bench-ladder-fill', e.target);
          var marker = qs('.bench-ladder-marker', e.target);
          if (fill) {
            var w = parseFloat(fill.getAttribute('data-width'));
            if (!isNaN(w) && w >= 0 && w <= 100) {
              fill.style.width = w + '%';
            }
          }
          if (marker) {
            var pos = parseFloat(marker.getAttribute('data-pos'));
            if (!isNaN(pos) && pos >= 0 && pos <= 100) {
              marker.style.left = pos + '%';
            }
          }
        }
      });
    }, { threshold: 0.2 });

    rows.forEach(function (row) { observer.observe(row); });
  }

  /* ══════════════════════════════════════════════
     8. FAMILY TRUST MODE — View Toggle
     ══════════════════════════════════════════════ */
  function initFamilyTrustMode() {
    var btns = qsa('.ftm-btn');
    var views = qsa('.ftm-view');
    if (!btns.length || !views.length) return;

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-ftm-view');
        btns.forEach(function (b) { b.classList.remove('active'); });
        views.forEach(function (v) { v.classList.remove('active'); });
        btn.classList.add('active');
        var view = qs('.ftm-view[data-ftm="' + target + '"]');
        if (view) view.classList.add('active');
      });
    });
  }

  /* ══════════════════════════════════════════════
     9. PASSPORT-TO-PLAN ENGINE
     ══════════════════════════════════════════════ */
  function initPassportToPlan() {
    var planEl = qs('#passportPlan');
    if (!planEl) return;

    var planData = {
      athlete: {
        week1: 'Assessment day, baseline sprint testing, movement screen, first coached session — sprint mechanics focus',
        milestone30: '10-yard split improvement, consistent form cues, 3x/week training rhythm established',
        milestone60: 'Measurable 40-yard time drop, power output increase, benchmark board entries started',
        milestone90: 'Full combine-ready testing, competition prep protocol, PPF Standard Score earned',
        membership: 'Quarterly Athlete — $650'
      },
      adult: {
        week1: 'Movement assessment, strength baseline testing, mobility screen, first coached strength session',
        milestone30: 'Consistent 3x/week attendance, form mastery on core lifts, first body comp check',
        milestone60: 'Strength benchmarks tracked, mobility improvement measured, push-up benchmark attempted',
        milestone90: 'Deadlift 2x BW progression, consistency streak active, full benchmark board review',
        membership: 'Quarterly Adult — $650'
      },
      integrated: {
        week1: 'Family consultation, trust-building session, movement exploration, coach introduction with Rebecca',
        milestone30: 'Comfort in the room established, engagement metrics improving, first milestone shared with family',
        milestone60: 'Independence markers tracked, coordination improvements noted, session streak active',
        milestone90: 'Confidence rating measurable, family trust fully established, long-term plan reviewed',
        membership: 'Quarterly Integrated — $650'
      }
    };

    // Listen for passport completion
    document.addEventListener('passport:complete', function (e) {
      var who = (e.detail && e.detail.who) || 'athlete';
      var data = planData[who] || planData.athlete;

      qs('.p2p-block[data-p2p="week1"] .p2p-block-value', planEl).textContent = data.week1;
      qs('.p2p-block[data-p2p="day30"] .p2p-block-value', planEl).textContent = data.milestone30;
      qs('.p2p-block[data-p2p="day60"] .p2p-block-value', planEl).textContent = data.milestone60;
      qs('.p2p-block[data-p2p="day90"] .p2p-block-value', planEl).textContent = data.milestone90;

      planEl.classList.add('visible');
    });

    // Download button
    var dlBtn = qs('.p2p-download', planEl);
    if (dlBtn) {
      dlBtn.addEventListener('click', function () {
        var blocks = qsa('.p2p-block', planEl);
        var text = 'PPF ATHLETICS — YOUR 90-DAY PLAN\n';
        text += '═══════════════════════════════════\n\n';
        blocks.forEach(function (b) {
          var label = qs('.p2p-block-label', b);
          var value = qs('.p2p-block-value', b);
          if (label && value) {
            text += label.textContent + '\n' + value.textContent + '\n\n';
          }
        });
        text += '─────────────────────────────────\n';
        text += 'PPF Athletics | Cumming, GA\n';
        text += '(678) 938-9668 | ppfathletics.com\n';

        var blob = new Blob([text], { type: 'text/plain' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'PPF-90-Day-Plan.txt';
        a.click();
        URL.revokeObjectURL(url);
      });
    }
  }

  /* ══════════════════════════════════════════════
     10. CARRYOVER TRANSLATOR 2.0 — Animated Chain
     ══════════════════════════════════════════════ */
  function initCarryoverChain() {
    var chain = qs('.cmap-chain');
    if (!chain) return;

    var chainData = {
      burst: [
        { label: 'PPF TRAINS', text: 'Hip extension power, ankle stiffness, arm drive timing' },
        { label: 'CUE THAT MATTERS', text: '"Push the ground away — don\'t reach for speed"' },
        { label: 'WEEKLY WORK', text: '3x sprint mechanics + 2x power development' },
        { label: 'MILESTONE', text: '10-yard split under 1.55s — coach verified' },
        { label: 'LIFE CARRYOVER', text: 'First-step explosion in game situations' }
      ],
      route: [
        { label: 'PPF TRAINS', text: 'Deceleration control, hip turn speed, re-acceleration' },
        { label: 'CUE THAT MATTERS', text: '"Sink and snap — own the cut"' },
        { label: 'WEEKLY WORK', text: '2x agility mechanics + 2x change of direction' },
        { label: 'MILESTONE', text: 'Pro Agility under 4.25s — film verified' },
        { label: 'LIFE CARRYOVER', text: 'Route release that wins off the line' }
      ],
      posture: [
        { label: 'PPF TRAINS', text: 'Thoracic mobility, core anti-rotation, hip hinge mastery' },
        { label: 'CUE THAT MATTERS', text: '"Stack it — ribs over hips, every rep"' },
        { label: 'WEEKLY WORK', text: '3x strength sessions with mobility integration' },
        { label: 'MILESTONE', text: 'Mobility score 8/10 — sustained 4+ weeks' },
        { label: 'LIFE CARRYOVER', text: 'Pain-free daily movement and improved posture' }
      ],
      awareness: [
        { label: 'PPF TRAINS', text: 'Proprioception drills, balance progressions, spatial awareness' },
        { label: 'CUE THAT MATTERS', text: '"Feel the ground — know where your body is"' },
        { label: 'WEEKLY WORK', text: '2x coached sessions with progressive complexity' },
        { label: 'MILESTONE', text: 'Coordination score improvement — 3 consecutive months' },
        { label: 'LIFE CARRYOVER', text: 'Confidence navigating physical space independently' }
      ],
      confidence: [
        { label: 'PPF TRAINS', text: 'Trust-building environment, coached progression, family communication' },
        { label: 'CUE THAT MATTERS', text: '"You belong here — every step counts"' },
        { label: 'WEEKLY WORK', text: '2-3x sessions in safe, structured environment' },
        { label: 'MILESTONE', text: 'Engagement rate above 90% — 8 weeks running' },
        { label: 'LIFE CARRYOVER', text: 'Family confidence in long-term fitness home' }
      ],
      injury: [
        { label: 'PPF TRAINS', text: 'Movement quality, landing mechanics, load management' },
        { label: 'CUE THAT MATTERS', text: '"Absorb the force — don\'t fight it"' },
        { label: 'WEEKLY WORK', text: '3x structured sessions with built-in recovery' },
        { label: 'MILESTONE', text: 'Zero compensatory patterns — movement screen clear' },
        { label: 'LIFE CARRYOVER', text: 'Fewer injuries, longer career, sustainable health' }
      ]
    };

    var steps = qsa('.cmap-chain-step', chain);

    // Listen for carryover option clicks
    qsa('.cmap-option').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var result = btn.getAttribute('data-result');
        var data = chainData[result];
        if (!data) return;

        // Reset
        steps.forEach(function (s) { s.classList.remove('revealed'); });

        // Populate and reveal with stagger
        data.forEach(function (d, i) {
          if (steps[i]) {
            qs('.cmap-chain-label', steps[i]).textContent = d.label;
            qs('.cmap-chain-text', steps[i]).textContent = d.text;
            setTimeout(function () {
              steps[i].classList.add('revealed');
            }, i * 200);
          }
        });
      });
    });
  }

  /* ══════════════════════════════════════════════
     11. HERO COUNTER FIX — Render real values on first paint
     ══════════════════════════════════════════════ */
  function fixHeroCounters() {
    var counters = qsa('.hero-metrics .metric-num[data-target]');
    counters.forEach(function (el) {
      // Set textContent to the real target value immediately
      // The animation JS reads the current value as its start point
      var target = el.getAttribute('data-target');
      if (target && el.textContent === '0') {
        el.textContent = target;
      }
    });
  }

  /* ══════════════════════════════════════════════
     BOOT SEQUENCE
     ══════════════════════════════════════════════ */
  // Fix hero counters immediately (before DOMContentLoaded if possible)
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  function boot() {
    fixHeroCounters();
    initReadinessFingerprint();
    initSessionXray();
    initRadar();
    initCueWaveform();
    initStandardLedger();
    initPipelineMap();
    initBenchmarkLadder();
    initFamilyTrustMode();
    initPassportToPlan();
    initCarryoverChain();
  }
})();
