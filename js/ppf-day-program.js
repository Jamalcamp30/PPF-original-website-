/* ============================================================
   PPF DAY PROGRAM — Signature Scroll-Driven Storytelling
   GSAP ScrollTrigger + Vanilla JS
   ============================================================ */
(function () {
  'use strict';

  /* ── Guard ───────────────────────────────────────────── */
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
  gsap.registerPlugin(ScrollTrigger);

  /* ── Utility ─────────────────────────────────────────── */
  var qs  = function (s, p) { return (p || document).querySelector(s); };
  var qsa = function (s, p) { return Array.prototype.slice.call((p || document).querySelectorAll(s)); };

  /* ============================================================
     1 — HERO ENTRANCE
     ============================================================ */
  function bootHero() {
    var badge = qs('.dp-hero__badge');
    var title = qs('.dp-hero__title');
    var sub   = qs('.dp-hero__sub');
    var stats = qs('.dp-hero__stats');
    if (!title) return;

    var tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
    if (badge) tl.to(badge, { opacity: 1, y: 0, duration: 0.7 }, 0.2);
    tl.to(title, { opacity: 1, y: 0, duration: 0.9 }, 0.4);
    if (sub) tl.to(sub, { opacity: 1, y: 0, duration: 0.7 }, 0.7);
    if (stats) tl.to(stats, { opacity: 1, y: 0, duration: 0.7 }, 0.9);

    /* Animate stat numbers */
    qsa('.dp-hero__stat-num').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      if (isNaN(target)) return;
      var obj = { val: 0 };
      tl.to(obj, {
        val: target,
        duration: 1.6,
        ease: 'power2.out',
        onUpdate: function () {
          el.textContent = Math.round(obj.val) + (el.getAttribute('data-suffix') || '');
        }
      }, 0.9);
    });
  }

  /* ============================================================
     2 — PINNED STORY SEQUENCE ("One Day at PPF Integrated")
     ============================================================ */
  function bootStory() {
    var pin      = qs('.dp-story__pin');
    var frame    = qs('.dp-story__frame');
    var slides   = qsa('.dp-story__slide');
    var progress = qs('.dp-story__progress');
    var dots     = qsa('.dp-story__progress-dot');

    if (!pin || !frame || !slides.length) return;

    var numSlides = slides.length;

    ScrollTrigger.create({
      trigger: pin,
      start: 'top top',
      end: 'bottom bottom',
      pin: frame,
      onUpdate: function (self) {
        var raw   = self.progress * numSlides;
        var idx   = Math.min(Math.floor(raw), numSlides - 1);

        slides.forEach(function (s, i) {
          if (i === idx) {
            s.classList.add('is-active');
          } else {
            s.classList.remove('is-active');
          }
        });

        dots.forEach(function (d, i) {
          if (i === idx) {
            d.classList.add('is-active');
          } else {
            d.classList.remove('is-active');
          }
        });
      },
      onEnter: function () { if (progress) progress.classList.add('is-visible'); },
      onLeave: function () { if (progress) progress.classList.remove('is-visible'); },
      onEnterBack: function () { if (progress) progress.classList.add('is-visible'); },
      onLeaveBack: function () { if (progress) progress.classList.remove('is-visible'); }
    });
  }

  /* ============================================================
     3 — DAY-IN-MOTION TIMELINE
     ============================================================ */
  function bootTimeline() {
    var fill  = qs('.dp-timeline__fill');
    var stops = qsa('.dp-timeline__stop');
    if (!fill || !stops.length) return;

    /* Fill line tied to scroll */
    var timelineEl = qs('.dp-timeline');
    if (timelineEl) {
      ScrollTrigger.create({
        trigger: timelineEl,
        start: 'top 80%',
        end: 'bottom 20%',
        onUpdate: function (self) {
          fill.style.height = (self.progress * 100) + '%';
        }
      });
    }

    /* Reveal each stop */
    stops.forEach(function (stop, i) {
      ScrollTrigger.create({
        trigger: stop,
        start: 'top 75%',
        once: true,
        onEnter: function () {
          stop.classList.add('is-revealed');
        }
      });
    });
  }

  /* ============================================================
     4 — PARTICIPANT WALL ("50 Lives. One Standard.")
     ============================================================ */
  function bootWall() {
    var tiles = qsa('.dp-wall__tile');
    var words = qsa('.dp-wall__word');
    if (!tiles.length) return;

    var wallEl = qs('.dp-wall');
    if (!wallEl) return;

    ScrollTrigger.create({
      trigger: wallEl,
      start: 'top 70%',
      once: true,
      onEnter: function () {
        /* Stagger tile reveal in random order */
        var indices = [];
        for (var i = 0; i < tiles.length; i++) indices.push(i);
        /* Shuffle */
        for (var j = indices.length - 1; j > 0; j--) {
          var k = Math.floor(Math.random() * (j + 1));
          var tmp = indices[j];
          indices[j] = indices[k];
          indices[k] = tmp;
        }
        indices.forEach(function (idx, order) {
          setTimeout(function () {
            tiles[idx].classList.add('is-lit');
          }, order * 30);
        });

        /* Reveal words after tiles */
        words.forEach(function (w, i) {
          setTimeout(function () {
            w.classList.add('is-revealed');
          }, tiles.length * 30 + 400 + i * 300);
        });
      }
    });
  }

  /* ============================================================
     5 — DAILY MEETING CIRCLE
     ============================================================ */
  function bootCircle() {
    var circleEl = qs('.dp-circle');
    var ring = qs('.dp-circle__ring');
    var nodes = qsa('.dp-circle__node');
    var connections = qsa('.dp-circle__connection');
    var label = qs('.dp-circle__label');
    if (!circleEl || !nodes.length) return;

    /* Position nodes in a circle */
    var radius = 130;
    var cx = 250, cy = 250;

    nodes.forEach(function (node, i) {
      var angle = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      node.style.transform = 'translate(-50%, -50%)';

      /* Start position: outside the viewport edges */
      var startX = Math.cos(angle) * 400;
      var startY = Math.sin(angle) * 400;
      node.style.left = (cx + startX) + 'px';
      node.style.top = (cy + startY) + 'px';

      node.setAttribute('data-final-x', x);
      node.setAttribute('data-final-y', y);
    });

    ScrollTrigger.create({
      trigger: circleEl,
      start: 'top 60%',
      once: true,
      onEnter: function () {
        /* Expand ring */
        if (ring) ring.classList.add('is-formed');

        /* Animate nodes to circle positions */
        nodes.forEach(function (node, i) {
          setTimeout(function () {
            node.style.left = node.getAttribute('data-final-x') + 'px';
            node.style.top = node.getAttribute('data-final-y') + 'px';
            node.classList.add('is-placed');
          }, 200 + i * 120);
        });

        /* Draw connections after nodes settle */
        setTimeout(function () {
          connections.forEach(function (conn, i) {
            setTimeout(function () {
              conn.classList.add('is-drawn');
            }, i * 80);
          });
        }, 200 + nodes.length * 120 + 200);

        /* Show center label */
        setTimeout(function () {
          if (label) label.classList.add('is-visible');
        }, 200 + nodes.length * 120 + connections.length * 80 + 300);

        /* Fade connections after a moment */
        setTimeout(function () {
          connections.forEach(function (conn) {
            conn.classList.remove('is-drawn');
          });
        }, 200 + nodes.length * 120 + connections.length * 80 + 1800);
      }
    });
  }

  /* ============================================================
     6 — COMMUNITY ROUTE REVEAL
     ============================================================ */
  function bootRoute() {
    var routeEl = qs('.dp-route');
    var path = qs('.dp-route__path');
    var dests = qsa('.dp-route__dest');
    if (!routeEl || !path) return;

    /* Measure actual path length */
    var pathLen = path.getTotalLength ? path.getTotalLength() : 1000;
    path.style.strokeDasharray = pathLen;
    path.style.strokeDashoffset = pathLen;

    ScrollTrigger.create({
      trigger: routeEl,
      start: 'top 60%',
      end: 'bottom 40%',
      onUpdate: function (self) {
        path.style.strokeDashoffset = pathLen * (1 - self.progress);

        /* Light up destinations based on progress */
        dests.forEach(function (dest, i) {
          var threshold = (i + 1) / (dests.length + 1);
          if (self.progress >= threshold) {
            dest.classList.add('is-lit');
          }
        });
      }
    });
  }

  /* ============================================================
     7 — IMPACT RIPPLE
     ============================================================ */
  function bootImpact() {
    var impactEl = qs('.dp-impact');
    var rings = qsa('.dp-impact__ring');
    var proofs = qsa('.dp-impact__proof-item');
    if (!impactEl || !rings.length) return;

    ScrollTrigger.create({
      trigger: impactEl,
      start: 'top 60%',
      once: true,
      onEnter: function () {
        rings.forEach(function (ring, i) {
          setTimeout(function () {
            ring.classList.add('is-expanded');
          }, i * 400);
        });

        proofs.forEach(function (p, i) {
          setTimeout(function () {
            p.classList.add('is-revealed');
          }, rings.length * 400 + 200 + i * 200);
        });
      }
    });
  }

  /* ============================================================
     8 — STRUCTURED DAY CARDS (lock-in effect)
     ============================================================ */
  function bootCards() {
    var cards = qsa('.dp-card');
    if (!cards.length) return;

    /* Set random offsets for each card */
    cards.forEach(function (card, i) {
      var offsets = [-20, 15, -10, 25, -15, 20];
      card.style.setProperty('--dp-card-offset', (offsets[i % offsets.length]) + 'px');
    });

    ScrollTrigger.batch(cards, {
      start: 'top 80%',
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (card, i) {
          setTimeout(function () {
            card.classList.add('is-locked');
          }, i * 100);
        });
      }
    });
  }

  /* ============================================================
     9 — LEADERSHIP REVEAL
     ============================================================ */
  function bootLeadership() {
    var leaderEl = qs('.dp-leader');
    if (!leaderEl) return;

    var portrait = qs('.dp-leader__portrait', leaderEl);
    var info     = qs('.dp-leader__info', leaderEl);
    var creds    = qsa('.dp-leader__cred', leaderEl);
    var stats    = qsa('.dp-leader__stat', leaderEl);

    ScrollTrigger.create({
      trigger: leaderEl,
      start: 'top 65%',
      once: true,
      onEnter: function () {
        if (portrait) portrait.classList.add('is-revealed');
        if (info) info.classList.add('is-revealed');

        /* Stagger credentials */
        creds.forEach(function (cred, i) {
          setTimeout(function () {
            cred.classList.add('is-revealed');
          }, 600 + i * 200);
        });

        /* Lock stats into place */
        stats.forEach(function (stat, i) {
          setTimeout(function () {
            stat.classList.add('is-revealed');
          }, 600 + creds.length * 200 + 200 + i * 150);
        });
      }
    });
  }

  /* ============================================================
     10 — STAFFING STRIP
     ============================================================ */
  function bootStaff() {
    var cards = qsa('.dp-staff__card');
    if (!cards.length) return;

    ScrollTrigger.batch(cards, {
      start: 'top 80%',
      once: true,
      onEnter: function (batch) {
        batch.forEach(function (card, i) {
          setTimeout(function () {
            card.classList.add('is-revealed');
          }, i * 120);
        });
      }
    });
  }

  /* ============================================================
     11 — GENERIC SCROLL-REVEAL for .dp-reveal elements
     ============================================================ */
  function bootReveals() {
    var els = qsa('.dp-reveal');
    if (!els.length) return;

    ScrollTrigger.batch(els, {
      start: 'top 82%',
      once: true,
      onEnter: function (batch) {
        gsap.to(batch, {
          opacity: 1,
          y: 0,
          stagger: 0.08,
          duration: 0.7,
          ease: 'power3.out'
        });
      }
    });
  }

  /* ============================================================
     12 — COMMUNITY PULSE BACKGROUND CANVAS
     ============================================================ */
  function bootPulse() {
    var canvas = qs('.dp-pulse-canvas');
    if (!canvas) return;

    var ctx = canvas.getContext('2d');
    if (!ctx) return;

    var w, h;
    var dots = [];
    var NUM_DOTS = 60;
    var frameId = null;

    function resize() {
      w = canvas.width  = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }

    function initDots() {
      dots = [];
      for (var i = 0; i < NUM_DOTS; i++) {
        dots.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.3,
          vy: (Math.random() - 0.5) * 0.3,
          r: Math.random() * 1.5 + 0.5,
          alpha: Math.random() * 0.3 + 0.05
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);

      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        d.x += d.vx;
        d.y += d.vy;
        if (d.x < 0) d.x = w;
        if (d.x > w) d.x = 0;
        if (d.y < 0) d.y = h;
        if (d.y > h) d.y = 0;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(80, 200, 120, ' + d.alpha + ')';
        ctx.fill();

        /* Connect nearby dots */
        for (var j = i + 1; j < dots.length; j++) {
          var d2 = dots[j];
          var dx = d.x - d2.x;
          var dy = d.y - d2.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.beginPath();
            ctx.moveTo(d.x, d.y);
            ctx.lineTo(d2.x, d2.y);
            ctx.strokeStyle = 'rgba(80, 200, 120, ' + (0.04 * (1 - dist / 120)) + ')';
            ctx.stroke();
          }
        }
      }

      frameId = requestAnimationFrame(draw);
    }

    resize();
    initDots();

    /* Only animate when page is on the Integrated Day Program section */
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          canvas.classList.add('is-active');
          if (!frameId) draw();
        } else {
          canvas.classList.remove('is-active');
          if (frameId) {
            cancelAnimationFrame(frameId);
            frameId = null;
          }
        }
      });
    }, { threshold: 0.01 });

    var main = qs('.dp-main');
    if (main) observer.observe(main);

    window.addEventListener('resize', function () {
      resize();
      initDots();
    });
  }

  /* ============================================================
     13 — MAGNETIC CTA BUTTON
     ============================================================ */
  function bootMagneticCTA() {
    var btn = qs('.dp-cta__btn');
    if (!btn) return;

    btn.addEventListener('mousemove', function (e) {
      var rect = btn.getBoundingClientRect();
      var cx = rect.left + rect.width / 2;
      var cy = rect.top + rect.height / 2;
      var dx = (e.clientX - cx) * 0.12;
      var dy = (e.clientY - cy) * 0.12;
      btn.style.transform = 'translate(' + dx + 'px, ' + dy + 'px)';
    });

    btn.addEventListener('mouseleave', function () {
      btn.style.transform = 'translate(0, 0)';
      btn.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      setTimeout(function () {
        btn.style.transition = '';
      }, 500);
    });

    /* Confirmation burst on click */
    btn.addEventListener('click', function (e) {
      var burst = document.createElement('span');
      burst.style.cssText = 'position:absolute;inset:0;border-radius:inherit;background:rgba(255,255,255,0.2);animation:dp-burst 0.5s ease-out forwards;pointer-events:none;';
      btn.appendChild(burst);
      setTimeout(function () { burst.remove(); }, 600);
    });

    /* Add burst keyframes if not present */
    if (!qs('#dp-burst-style')) {
      var style = document.createElement('style');
      style.id = 'dp-burst-style';
      style.textContent = '@keyframes dp-burst{0%{transform:scale(1);opacity:1}100%{transform:scale(1.5);opacity:0}}';
      document.head.appendChild(style);
    }
  }

  /* ============================================================
     BOOT
     ============================================================ */
  function boot() {
    bootHero();
    bootStory();
    bootTimeline();
    bootWall();
    bootCircle();
    bootRoute();
    bootImpact();
    bootCards();
    bootLeadership();
    bootStaff();
    bootReveals();
    bootPulse();
    bootMagneticCTA();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
