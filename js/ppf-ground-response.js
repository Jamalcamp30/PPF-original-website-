/**
 * PPF Ground Response System
 * Reactive Turf Pressure — 5-layer surface load response
 *
 * Layer 1: Surface texture    (CSS-only, always present)
 * Layer 2: Pressure field     (cursor-tracked compression shadow)
 * Layer 3: Ripple response    (low-opacity expanding pressure ring)
 * Layer 4: Particulate edge   (micro-pellet drift at pressure boundary)
 * Layer 5: Recovery           (smooth return to neutral)
 *
 * Strongest in hero, lighter in section transitions, contained on cards.
 * Disabled / simplified on touch devices & reduced-motion.
 */
;(function () {
  'use strict';

  /* ── Reduced-motion guard ─────────────────────────── */
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  /* ── Touch device guard (cursor effects only) ─────── */
  var isTouch = window.matchMedia('(pointer: coarse)').matches;

  /* ── Helpers ──────────────────────────────────────── */
  function qs(s, p) { return (p || document).querySelector(s); }
  function qsa(s, p) { return [].slice.call((p || document).querySelectorAll(s)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function dist(x1, y1, x2, y2) {
    var dx = x2 - x1, dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /* ── Configuration ────────────────────────────────── */
  var CONFIG = {
    /* Pressure field */
    pressureRadius:    120,   // px — compression zone radius
    pressureStrength:  0.055, // 0-1 — max shadow opacity (subtle)
    pressureLerp:      0.08,  // cursor-follow smoothing factor

    /* Ripple */
    rippleInterval:    180,   // ms — min time between ripples
    rippleSize:        240,   // px — ripple diameter
    maxRipples:        3,     // concurrent ripple limit per zone

    /* Pellets */
    pelletCount:       24,    // pellets per zone
    pelletDriftMax:    6,     // px — max drift distance
    pelletRadius:      140,   // px — interaction radius

    /* Recovery */
    recoverySpeed:     0.06,  // lerp factor back to neutral (slightly faster than depression)

    /* Hierarchy intensifiers */
    ctaMultiplier:     1.5,   // pressure strength near CTAs
    proofMultiplier:   1.3,   // pressure strength on proof sections

    /* Performance */
    heroFullEffect:    true,
    sectionLightEffect: true,
    cardContainedEffect: true
  };

  /* ── Zone Registry ────────────────────────────────── */
  var zones = [];

  /**
   * ZoneController — manages all 5 layers for a single GRS zone
   */
  function ZoneController(el, options) {
    this.el = el;
    this.opts = options || {};
    this.intensity = this.opts.intensity || 1;
    this.active = false;
    this.mouseX = 0;
    this.mouseY = 0;
    this.smoothX = 0;
    this.smoothY = 0;
    this.currentStrength = 0;
    this.targetStrength = 0;
    this.lastRippleTime = 0;
    this.rippleCount = 0;
    this.pellets = [];
    this.pressureField = null;
    this.rafId = null;
    this.boundRect = null;

    this._init();
  }

  ZoneController.prototype._init = function () {
    var self = this;

    /* Add zone class */
    this.el.classList.add('grs-zone');

    /* Layer 2: Create pressure field element */
    this.pressureField = document.createElement('div');
    this.pressureField.className = 'grs-pressure-field';
    /* Insert as first child so it sits beneath content */
    if (this.el.firstChild) {
      this.el.insertBefore(this.pressureField, this.el.firstChild);
    } else {
      this.el.appendChild(this.pressureField);
    }

    /* Layer 4: Seed pellets */
    if (!isTouch) {
      this._seedPellets();
    }

    /* Mouse tracking */
    if (!isTouch) {
      this.el.addEventListener('mouseenter', function (e) {
        self.active = true;
        self._updateRect();
        self._onMove(e);
      });
      this.el.addEventListener('mousemove', function (e) {
        self._onMove(e);
      });
      this.el.addEventListener('mouseleave', function () {
        self.active = false;
        self.targetStrength = 0;
      });
    }

    /* Start animation loop */
    this._tick();
  };

  ZoneController.prototype._updateRect = function () {
    this.boundRect = this.el.getBoundingClientRect();
  };

  ZoneController.prototype._onMove = function (e) {
    if (!this.boundRect) this._updateRect();
    this.mouseX = e.clientX - this.boundRect.left;
    this.mouseY = e.clientY - this.boundRect.top;
    this.targetStrength = CONFIG.pressureStrength * this.intensity;

    /* Check if near a CTA or proof element for hierarchy boost */
    var target = e.target;
    var nearCTA = false;
    var nearProof = false;
    var node = target;
    while (node && node !== this.el) {
      if (node.classList) {
        if (node.classList.contains('ppf-cta') || node.classList.contains('cta-action') ||
            node.tagName === 'BUTTON' || node.classList.contains('cta-shell')) {
          nearCTA = true;
        }
        if (node.classList.contains('proof-metric') || node.classList.contains('ba-card') ||
            node.classList.contains('metric-item') || node.classList.contains('hero-metrics')) {
          nearProof = true;
        }
      }
      node = node.parentElement;
    }

    if (nearCTA) {
      this.targetStrength *= CONFIG.ctaMultiplier;
    } else if (nearProof) {
      this.targetStrength *= CONFIG.proofMultiplier;
    }

    /* Spawn ripple (throttled) */
    var now = Date.now();
    if (now - this.lastRippleTime > CONFIG.rippleInterval) {
      this._spawnRipple(this.mouseX, this.mouseY);
      this.lastRippleTime = now;
    }
  };

  /* ── Layer 2: Pressure Field Render ─────────────── */
  ZoneController.prototype._renderPressure = function () {
    var strength = this.currentStrength;
    if (strength < 0.002) {
      this.pressureField.style.background = 'none';
      return;
    }

    /* Compression shadow: radial darkening + slight inward texture tightening */
    var r = CONFIG.pressureRadius;
    this.pressureField.style.background =
      'radial-gradient(circle ' + r + 'px at ' +
      this.smoothX + 'px ' + this.smoothY + 'px, ' +
      'rgba(0,0,0,' + (strength * 1.2).toFixed(4) + ') 0%, ' +
      'rgba(0,0,0,' + (strength * 0.6).toFixed(4) + ') 40%, ' +
      'rgba(0,0,0,' + (strength * 0.15).toFixed(4) + ') 70%, ' +
      'transparent 100%)';
  };

  /* ── Layer 3: Ripple Spawner ────────────────────── */
  ZoneController.prototype._spawnRipple = function (x, y) {
    if (this.rippleCount >= CONFIG.maxRipples) return;

    var self = this;
    var ripple = document.createElement('div');
    ripple.className = 'grs-ripple';
    var size = CONFIG.rippleSize;
    ripple.style.width = size + 'px';
    ripple.style.height = size + 'px';
    ripple.style.left = (x - size / 2) + 'px';
    ripple.style.top = (y - size / 2) + 'px';

    this.el.appendChild(ripple);
    this.rippleCount++;

    /* Force reflow then activate */
    void ripple.offsetWidth;
    ripple.classList.add('grs-ripple--active');

    /* Cleanup */
    setTimeout(function () {
      if (ripple.parentNode) ripple.parentNode.removeChild(ripple);
      self.rippleCount--;
    }, 850);
  };

  /* ── Layer 4: Seed Pellets ─────────────────────── */
  ZoneController.prototype._seedPellets = function () {
    /* Distribute pellets randomly across the zone */
    for (var i = 0; i < CONFIG.pelletCount; i++) {
      var pellet = document.createElement('div');
      pellet.className = 'grs-pellet';

      /* Random warm-tinted pellets (orange rubber infill) */
      if (Math.random() < 0.2) {
        pellet.classList.add('grs-pellet--warm');
      }

      /* Random position (percentage-based for responsiveness) */
      var px = Math.random() * 100;
      var py = Math.random() * 100;
      pellet.style.left = px + '%';
      pellet.style.top = py + '%';

      /* Slight size variation */
      var s = 1.5 + Math.random() * 1.5;
      pellet.style.width = s + 'px';
      pellet.style.height = s + 'px';

      this.el.appendChild(pellet);
      this.pellets.push({
        el: pellet,
        homeX: px,
        homeY: py,
        currentOffsetX: 0,
        currentOffsetY: 0
      });
    }
  };

  /* ── Layer 4: Update Pellet Positions ──────────── */
  ZoneController.prototype._updatePellets = function () {
    if (!this.boundRect) return;
    var w = this.boundRect.width;
    var h = this.boundRect.height;

    for (var i = 0; i < this.pellets.length; i++) {
      var p = this.pellets[i];
      var pelletAbsX = (p.homeX / 100) * w;
      var pelletAbsY = (p.homeY / 100) * h;
      var d = dist(this.smoothX, this.smoothY, pelletAbsX, pelletAbsY);

      var targetOffsetX = 0;
      var targetOffsetY = 0;

      if (this.active && d < CONFIG.pelletRadius && d > 10) {
        /* Push pellets outward from cursor */
        var force = (1 - d / CONFIG.pelletRadius) * CONFIG.pelletDriftMax * this.intensity;
        var angle = Math.atan2(pelletAbsY - this.smoothY, pelletAbsX - this.smoothX);
        targetOffsetX = Math.cos(angle) * force;
        targetOffsetY = Math.sin(angle) * force;
      }

      /* Smooth transition */
      var speed = this.active ? CONFIG.pressureLerp : CONFIG.recoverySpeed;
      p.currentOffsetX = lerp(p.currentOffsetX, targetOffsetX, speed);
      p.currentOffsetY = lerp(p.currentOffsetY, targetOffsetY, speed);

      /* Apply if meaningful */
      if (Math.abs(p.currentOffsetX) > 0.1 || Math.abs(p.currentOffsetY) > 0.1) {
        p.el.style.transform = 'translate(' +
          p.currentOffsetX.toFixed(1) + 'px,' +
          p.currentOffsetY.toFixed(1) + 'px)';
        p.el.style.opacity = clamp(0.08 + Math.abs(p.currentOffsetX + p.currentOffsetY) * 0.01, 0.04, 0.14).toFixed(3);
      } else {
        p.el.style.transform = 'translate(0,0)';
        p.el.style.opacity = '0.08';
      }
    }
  };

  /* ── Layer 5: Recovery + Main Tick ──────────────── */
  ZoneController.prototype._tick = function () {
    var self = this;

    /* Smooth cursor position */
    var lerpFactor = this.active ? CONFIG.pressureLerp : CONFIG.recoverySpeed;
    this.smoothX = lerp(this.smoothX, this.mouseX, lerpFactor);
    this.smoothY = lerp(this.smoothY, this.mouseY, lerpFactor);

    /* Smooth pressure strength (depression on enter, recovery on leave) */
    this.currentStrength = lerp(this.currentStrength, this.targetStrength,
      this.active ? CONFIG.pressureLerp : CONFIG.recoverySpeed);

    /* Render layers */
    this._renderPressure();
    if (!isTouch) {
      this._updatePellets();
    }

    this.rafId = requestAnimationFrame(function () {
      self._tick();
    });
  };

  ZoneController.prototype.destroy = function () {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    if (this.pressureField && this.pressureField.parentNode) {
      this.pressureField.parentNode.removeChild(this.pressureField);
    }
    for (var i = 0; i < this.pellets.length; i++) {
      var el = this.pellets[i].el;
      if (el.parentNode) el.parentNode.removeChild(el);
    }
    this.pellets = [];
  };

  /* ================================================================
     Section Seam Controller
     Scroll-triggered pressure sweep across section dividers
     ================================================================ */
  function initSectionSeams() {
    var seams = qsa('.grs-section-seam');
    if (!seams.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('grs-seam--active');
        } else {
          entry.target.classList.remove('grs-seam--active');
        }
      });
    }, { threshold: 0.5 });

    seams.forEach(function (seam) {
      observer.observe(seam);
    });
  }

  /* ================================================================
     Card Pressure Controller
     Adds ground-compression shadow beneath hoverable cards
     ================================================================ */
  function initCardPressure() {
    var cardSelectors = [
      '.path-card',
      '.pillar-card',
      '.ba-card',
      '.signal-card',
      '.story-card',
      '.force-panel'
    ];

    cardSelectors.forEach(function (selector) {
      qsa(selector).forEach(function (card) {
        card.classList.add('grs-card-zone');
      });
    });
  }

  /* ================================================================
     Touch / Mobile Fallback
     Scroll-based pressure sweeps and tap pulses
     ================================================================ */
  function initTouchFallback() {
    if (!isTouch) return;

    /* On scroll, apply a brief pressure sweep to the hero */
    var hero = qs('#hero');
    if (!hero) return;

    hero.classList.add('grs-zone');
    var pressureField = document.createElement('div');
    pressureField.className = 'grs-pressure-field';
    if (hero.firstChild) {
      hero.insertBefore(pressureField, hero.firstChild);
    } else {
      hero.appendChild(pressureField);
    }

    var scrollStrength = 0;
    var targetScrollStrength = 0;

    window.addEventListener('scroll', function () {
      targetScrollStrength = 0.04;
      setTimeout(function () { targetScrollStrength = 0; }, 300);
    }, { passive: true });

    /* Touch-tap pressure pulse */
    hero.addEventListener('touchstart', function (e) {
      if (!e.touches.length) return;
      var touch = e.touches[0];
      var rect = hero.getBoundingClientRect();
      var x = touch.clientX - rect.left;
      var y = touch.clientY - rect.top;

      /* Brief compression */
      pressureField.style.background =
        'radial-gradient(circle 100px at ' + x + 'px ' + y + 'px, ' +
        'rgba(0,0,0,0.06) 0%, transparent 100%)';
      pressureField.style.transition = 'opacity 0.3s ease';
      pressureField.style.opacity = '1';

      setTimeout(function () {
        pressureField.style.opacity = '0';
      }, 400);
    }, { passive: true });

    /* Scroll-driven subtle sweep */
    function scrollTick() {
      scrollStrength = lerp(scrollStrength, targetScrollStrength, 0.08);
      if (scrollStrength > 0.005) {
        var scrollPos = window.scrollY;
        var heroH = hero.offsetHeight;
        var pct = clamp(scrollPos / heroH, 0, 1);
        pressureField.style.background =
          'linear-gradient(180deg, ' +
          'transparent ' + (pct * 100 - 10) + '%, ' +
          'rgba(0,0,0,' + scrollStrength.toFixed(4) + ') ' + (pct * 100) + '%, ' +
          'transparent ' + (pct * 100 + 10) + '%)';
      }
      requestAnimationFrame(scrollTick);
    }
    scrollTick();
  }

  /* ================================================================
     Boot — Initialize all Ground Response System zones
     ================================================================ */
  function boot() {
    /* Hero — full effect */
    var hero = qs('#hero');
    if (hero && !isTouch && CONFIG.heroFullEffect) {
      zones.push(new ZoneController(hero, { intensity: 1 }));
    }

    /* Key content sections — lighter effect */
    if (!isTouch && CONFIG.sectionLightEffect) {
      var sectionIds = ['#standard', '#proof', '#paths', '#experience', '#start'];
      sectionIds.forEach(function (id) {
        var section = qs(id);
        if (section) {
          zones.push(new ZoneController(section, { intensity: 0.5 }));
        }
      });
    }

    /* Insert section seams between major sections */
    var seamAfterIds = ['#hero', '#standard', '#paths', '#proof', '#experience'];
    seamAfterIds.forEach(function (id) {
      var section = qs(id);
      if (section && section.nextElementSibling) {
        var seam = document.createElement('div');
        seam.className = 'grs-section-seam';
        section.parentNode.insertBefore(seam, section.nextElementSibling);
      }
    });

    /* Card pressure system */
    if (CONFIG.cardContainedEffect) {
      initCardPressure();
    }

    /* Section seam scroll triggers */
    initSectionSeams();

    /* Touch/mobile fallback */
    initTouchFallback();
  }

  /* Wait for DOM */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
