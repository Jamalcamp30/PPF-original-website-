/* ================================================================
   PPF BAR LOAD TENSION BUILD — Loaded Standard Reveal
   ================================================================
   A precision horizontal line bends under invisible load, braces
   at peak tension, then snaps back with controlled force to
   reveal the strength section. Triggers once on first scroll entry.
   ================================================================ */
(function () {
  'use strict';

  /* ── CONFIG ──────────────────────────────────────────────────── */
  var CONFIG = {
    pretensionDur: 400,   // ms — micro vibration
    loadDur: 900,         // ms — line bends down
    braceDur: 350,        // ms — hold at peak
    releaseDur: 400,      // ms — snap back up
    maxBend: 18,          // px — max downward deflection at center
    triggerThreshold: 0.3 // IntersectionObserver threshold
  };

  /* ── HELPERS ─────────────────────────────────────────────────── */
  function qs(sel, ctx) { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  /* ── BOOT ────────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', function () {
    var containers = qsa('.bar-tension-reveal');
    if (!containers.length || !('IntersectionObserver' in window)) return;

    containers.forEach(function (container) {
      initBarTension(container);
    });
  });

  /* ── INIT PER INSTANCE ──────────────────────────────────────── */
  function initBarTension(container) {
    var svg = qs('.bar-tension-svg', container);
    var barPath = qs('.bar-line', svg);
    var tickGroup = qs('.bar-tension-ticks', svg);
    var targetId = container.getAttribute('data-target');
    var target = targetId ? document.getElementById(targetId) : null;
    var fired = false;

    if (!barPath) return;

    // Lock the target section content
    if (target) {
      target.classList.add('bar-tension-target', 'bt-locked');
    }

    // Build the initial flat bar path
    var svgWidth = 1000; // viewBox width
    var cy = 40;         // center Y in viewBox
    setBarPath(barPath, 0, svgWidth, cy);

    // Generate calibration tick positions
    buildTicks(tickGroup, svgWidth, cy);

    // Observe
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !fired) {
          fired = true;
          observer.unobserve(container);
          runSequence(container, barPath, tickGroup, target, svgWidth, cy);
        }
      });
    }, { threshold: CONFIG.triggerThreshold });

    observer.observe(container);
  }

  /* ── SET BAR PATH (quadratic bezier bend) ───────────────────── */
  function setBarPath(path, bend, w, cy) {
    // Quadratic bezier: endpoints anchored, control point at center + bend
    var d = 'M 30 ' + cy + ' Q ' + (w / 2) + ' ' + (cy + bend) + ' ' + (w - 30) + ' ' + cy;
    path.setAttribute('d', d);
  }

  /* ── BUILD CALIBRATION TICKS ────────────────────────────────── */
  function buildTicks(group, w, cy) {
    if (!group) return;
    var tickCount = 20;
    var startX = 60;
    var endX = w - 60;
    var spacing = (endX - startX) / (tickCount - 1);

    for (var i = 0; i < tickCount; i++) {
      var x = startX + i * spacing;
      var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', 'bar-tick');
      line.setAttribute('x1', x);
      line.setAttribute('y1', cy - 4);
      line.setAttribute('x2', x);
      line.setAttribute('y2', cy + 4);
      group.appendChild(line);
    }
  }

  /* ── UPDATE TICK POSITIONS to follow bend ───────────────────── */
  function updateTicks(group, bend, w, cy) {
    if (!group) return;
    var ticks = qsa('.bar-tick', group);
    var startX = 60;
    var endX = w - 60;
    var tickCount = ticks.length;
    if (!tickCount) return;
    var spacing = (endX - startX) / (tickCount - 1);

    for (var i = 0; i < tickCount; i++) {
      var x = startX + i * spacing;
      // Calculate Y offset along the quadratic bezier at this X
      var t = (x - 30) / (w - 60); // parametric position 0-1
      var yOffset = bend * 4 * t * (1 - t); // parabolic approximation
      ticks[i].setAttribute('y1', (cy + yOffset) - 4);
      ticks[i].setAttribute('y2', (cy + yOffset) + 4);
    }
  }

  /* ── EASING FUNCTIONS ───────────────────────────────────────── */
  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function easeOutBack(t) {
    var recoilIntensity = 1.3; // controlled recoil, NOT springy
    var scaledRecoil = recoilIntensity + 1;
    return 1 + scaledRecoil * Math.pow(t - 1, 3) + recoilIntensity * Math.pow(t - 1, 2);
  }

  /* ── ANIMATE BEND ───────────────────────────────────────────── */
  function animateBend(barPath, tickGroup, from, to, duration, easing, w, cy, callback) {
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var elapsed = ts - start;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easing(progress);
      var currentBend = from + (to - from) * eased;

      setBarPath(barPath, currentBend, w, cy);
      updateTicks(tickGroup, currentBend, w, cy);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        if (callback) callback();
      }
    }
    requestAnimationFrame(step);
  }

  /* ── FULL ANIMATION SEQUENCE ────────────────────────────────── */
  function runSequence(container, barPath, tickGroup, target, w, cy) {
    var maxBend = CONFIG.maxBend;

    // Reduce bend on mobile
    if (window.innerWidth <= 600) {
      maxBend = CONFIG.maxBend * 0.55;
    }

    // Phase 1: Pre-tension — micro vibration
    container.classList.add('phase-pretension');

    setTimeout(function () {
      container.classList.remove('phase-pretension');

      // Phase 2: Load-in — line bends down
      container.classList.add('phase-load');

      animateBend(barPath, tickGroup, 0, maxBend, CONFIG.loadDur, easeInOutCubic, w, cy, function () {

        // Phase 3: Brace — hold at peak tension
        container.classList.remove('phase-load');
        container.classList.add('phase-brace');

        setTimeout(function () {

          // Phase 4: Release — snap back with authority
          container.classList.remove('phase-brace');
          container.classList.add('phase-release');

          animateBend(barPath, tickGroup, maxBend, 0, CONFIG.releaseDur, easeOutBack, w, cy, function () {

            // Phase 5: Done — structural artifact
            container.classList.remove('phase-release');
            container.classList.add('phase-done');

            // Unlock target section content
            if (target) {
              target.classList.remove('bt-locked');
              target.classList.add('bt-released');
            }
          });

        }, CONFIG.braceDur);
      });

    }, CONFIG.pretensionDur);
  }

})();
