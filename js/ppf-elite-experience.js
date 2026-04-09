/* =====================================================
   PPF ELITE EXPERIENCE — 15 PREMIUM ENHANCEMENTS
   ===================================================== */
(function () {
  'use strict';

  /* ── helpers ────────────────────────────────────────── */
  const qs  = (s, p) => (p || document).querySelector(s);
  const qsa = (s, p) => [...(p || document).querySelectorAll(s)];
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════
     1. PULSE VAULT OPENING
  ══════════════════════════════════════════════════════ */
  function initPulseVault() {
    const vault = qs('.pulse-vault');
    if (!vault || prefersReducedMotion) {
      if (vault) vault.classList.add('pv-done');
      return;
    }
    const canvas = qs('.pv-canvas', vault);
    const brand  = qs('.pv-brand', vault);
    if (!canvas || !brand) return;

    const ctx = canvas.getContext('2d');
    let w, h, time = 0, done = false;
    const pathColors = ['#ff5500', '#6a8fff', '#50c878'];
    const pulses = pathColors.map((c, i) => ({
      x: 0, y: 0, color: c, phase: (i * Math.PI * 2) / 3, radius: 0
    }));

    function resize() {
      w = canvas.width  = vault.offsetWidth;
      h = canvas.height = vault.offsetHeight;
      pulses.forEach((p, i) => {
        p.x = w * (0.3 + i * 0.2);
        p.y = h * 0.5;
      });
    }
    resize();

    const totalDuration = 2400;
    const startTime = performance.now();

    function draw(now) {
      if (done) return;
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / totalDuration, 1);
      ctx.clearRect(0, 0, w, h);

      const convergeFactor = Math.min(progress * 1.5, 1);
      const cx = w / 2;
      const cy = h / 2;

      pulses.forEach((p) => {
        const targetX = cx + Math.cos(p.phase + elapsed * 0.002) * (120 * (1 - convergeFactor));
        const targetY = cy + Math.sin(p.phase + elapsed * 0.002) * (60 * (1 - convergeFactor));
        p.x += (targetX - p.x) * 0.08;
        p.y += (targetY - p.y) * 0.08;
        p.radius = 80 + Math.sin(elapsed * 0.004 + p.phase) * 30;

        const alpha = 0.15 + 0.1 * (1 - convergeFactor);
        const alphaInt = Math.min(255, Math.max(0, Math.round(alpha * 255)));
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
        grad.addColorStop(0, p.color + '44');
        grad.addColorStop(0.5, p.color + alphaInt.toString(16).padStart(2, '0'));
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      if (progress >= 0.7 && !brand.classList.contains('pv-reveal')) {
        brand.classList.add('pv-reveal');
      }

      if (progress < 1) {
        requestAnimationFrame(draw);
      } else {
        setTimeout(() => {
          vault.classList.add('pv-exit');
          setTimeout(() => {
            vault.classList.add('pv-done');
            done = true;
          }, 900);
        }, 600);
      }
    }
    requestAnimationFrame(draw);
    window.addEventListener('resize', resize);
  }

  /* ══════════════════════════════════════════════════════
     2. HERO LOCK-ON
  ══════════════════════════════════════════════════════ */
  function initHeroLockOn() {
    const hero = qs('.hero');
    if (!hero || prefersReducedMotion) return;
    const layer = qs('.hero-lockon-layer', hero);
    if (!layer) return;
    const glow = qs('.hero-lockon-glow', layer);
    if (!glow) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      glow.style.left = (e.clientX - rect.left) + 'px';
      glow.style.top  = (e.clientY - rect.top) + 'px';
    });
  }

  /* ══════════════════════════════════════════════════════
     3. COACHING LANGUAGE WALL
  ══════════════════════════════════════════════════════ */
  function initCoachingWall() {
    const section = qs('.coaching-wall-section');
    if (!section) return;
    const words = qsa('.cw-word', section);
    const explainer = qs('.cw-explainer-text', section);
    if (!words.length || !explainer) return;

    let currentIdx = -1;
    let autoInterval = null;

    function activate(idx) {
      words.forEach((w) => w.classList.remove('cw-active'));
      explainer.classList.remove('cw-visible');
      currentIdx = idx;
      const word = words[idx];
      word.classList.add('cw-active');
      explainer.textContent = word.dataset.explain || '';
      requestAnimationFrame(() => {
        explainer.classList.add('cw-visible');
      });
    }

    words.forEach((w, i) => {
      w.addEventListener('mouseenter', () => {
        clearInterval(autoInterval);
        activate(i);
      });
      w.addEventListener('click', () => {
        clearInterval(autoInterval);
        activate(i);
      });
    });

    function autoCycle() {
      autoInterval = setInterval(() => {
        activate((currentIdx + 1) % words.length);
      }, 3000);
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          activate(0);
          autoCycle();
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(section);
  }

  /* ══════════════════════════════════════════════════════
     4. PATH DECODER
  ══════════════════════════════════════════════════════ */
  function initPathDecoder() {
    const section = qs('.path-decoder-section');
    if (!section) return;

    const questions = qsa('.pd-question', section);
    const pips      = qsa('.pd-pip', section);
    const result    = qs('.pd-result', section);
    if (!questions.length || !result) return;

    let step = 0;
    const answers = [];

    const pathMap = {
      athlete:    { name: 'ATHLETE PERFORMANCE', desc: 'You belong on the floor where speed, power, and competitive performance are the standard. PPF will build you into the athlete your competition fears.' },
      adult:      { name: 'ADULT PERFORMANCE', desc: 'Your path runs through structured coaching that builds strength, endurance, and accountability. PPF will push you past every plateau you\'ve accepted.' },
      integrated: { name: 'INTEGRATED FITNESS', desc: 'Your environment adapts to you while holding you to a standard. PPF will meet you where you are and take you further than anyone expects.' }
    };

    function showStep(idx) {
      questions.forEach((q) => { q.classList.remove('pd-active'); });
      result.classList.remove('pd-active');
      pips.forEach((p, i) => {
        p.classList.remove('pd-pip-current', 'pd-pip-done');
        if (i < idx) p.classList.add('pd-pip-done');
        if (i === idx) p.classList.add('pd-pip-current');
      });
      if (idx < questions.length) {
        questions[idx].classList.add('pd-active');
      }
    }

    function showResult() {
      pips.forEach((p) => p.classList.add('pd-pip-done'));
      const counts = { athlete: 0, adult: 0, integrated: 0 };
      answers.forEach((a) => { if (counts[a] !== undefined) counts[a]++; });
      let best = 'adult';
      if (counts.athlete > counts.adult && counts.athlete >= counts.integrated) best = 'athlete';
      else if (counts.integrated > counts.adult) best = 'integrated';

      const pathEl = qs('.pd-result-path', result);
      const descEl = qs('.pd-result-desc', result);
      if (pathEl) {
        pathEl.textContent = pathMap[best].name;
        pathEl.dataset.path = best;
      }
      if (descEl) descEl.textContent = pathMap[best].desc;
      result.classList.add('pd-active');
    }

    qsa('.pd-option', section).forEach((opt) => {
      opt.addEventListener('click', () => {
        answers.push(opt.dataset.value || 'adult');
        step++;
        if (step >= questions.length) {
          showResult();
        } else {
          showStep(step);
        }
      });
    });

    showStep(0);
  }

  /* ══════════════════════════════════════════════════════
     5. FLOOR INTELLIGENCE MAP
  ══════════════════════════════════════════════════════ */
  function initFloorMap() {
    const section = qs('.floor-map-section');
    if (!section) return;
    const zones = qsa('.fm-zone', section);

    zones.forEach((z) => {
      z.addEventListener('mouseenter', () => {
        zones.forEach((oz) => oz.classList.remove('fm-active'));
        z.classList.add('fm-active');
      });
      z.addEventListener('click', () => {
        const isActive = z.classList.contains('fm-active');
        zones.forEach((oz) => oz.classList.remove('fm-active'));
        if (!isActive) z.classList.add('fm-active');
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     6. STANDARD INDEX
  ══════════════════════════════════════════════════════ */
  function initStandardIndex() {
    const section = qs('.standard-index-section');
    if (!section) return;
    const metrics = qsa('.si-metric', section);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('si-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    metrics.forEach((m) => observer.observe(m));
  }

  /* ══════════════════════════════════════════════════════
     7. CARRYOVER ENGINE
  ══════════════════════════════════════════════════════ */
  function initCarryoverEngine() {
    const rows = qsa('.ce-row');
    if (!rows.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ce-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    rows.forEach((r, i) => {
      r.style.transitionDelay = (i * 0.15) + 's';
      observer.observe(r);
    });
  }

  /* ══════════════════════════════════════════════════════
     8. SESSION ATMOSPHERE
  ══════════════════════════════════════════════════════ */
  function initAtmosphere() {
    const section = qs('.atmosphere-section');
    if (!section) return;
    const lines = qsa('.atm-line', section);

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('atm-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    lines.forEach((l, i) => {
      l.style.transitionDelay = (i * 0.2) + 's';
      observer.observe(l);
    });
  }

  /* ══════════════════════════════════════════════════════
     9. STANDARD ARCHIVES — scroll reveal
  ══════════════════════════════════════════════════════ */
  function initArchives() {
    const artifacts = qsa('.sa-artifact');
    if (!artifacts.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });

    artifacts.forEach((a, i) => {
      a.style.opacity = '0';
      a.style.transform = 'translateY(16px)';
      a.style.transition = 'opacity 0.6s ease ' + (i * 0.1) + 's, transform 0.6s ease ' + (i * 0.1) + 's';
      observer.observe(a);
    });
  }

  /* ══════════════════════════════════════════════════════
     10. FIRST VISIT SIMULATOR
  ══════════════════════════════════════════════════════ */
  function initVisitSimulator() {
    const moments = qsa('.vs-moment');
    if (!moments.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('vs-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.2 });

    moments.forEach((m, i) => {
      m.style.transitionDelay = (i * 0.12) + 's';
      observer.observe(m);
    });
  }

  /* ══════════════════════════════════════════════════════
     11. LEADERSHIP PRESENCE
  ══════════════════════════════════════════════════════ */
  function initLeadershipPresence() {
    const intro = qs('.ldr-presence-intro');
    if (!intro) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('ldr-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    observer.observe(intro);
  }

  /* ══════════════════════════════════════════════════════
     12. SECTION TRANSITIONS — ENVIRONMENTAL CONTROL
  ══════════════════════════════════════════════════════ */
  function initEnvTransitions() {
    const transitions = qsa('.env-transition');
    if (!transitions.length) return;

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('env-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });

    transitions.forEach((t) => observer.observe(t));
  }

  /* ══════════════════════════════════════════════════════
     13. PROOF CHAMBER — expandable file cards
  ══════════════════════════════════════════════════════ */
  function initProofChamber() {
    const files = qsa('.pc-file');
    if (!files.length) return;

    files.forEach((f) => {
      const grid = qs('.pc-file-grid', f);
      const quote = qs('.pc-file-quote', f);
      if (!grid) return;
      grid.style.maxHeight = '0';
      grid.style.overflow = 'hidden';
      grid.style.transition = 'max-height 0.5s ease, opacity 0.4s ease';
      grid.style.opacity = '0';
      if (quote) {
        quote.style.maxHeight = '0';
        quote.style.overflow = 'hidden';
        quote.style.transition = 'max-height 0.5s ease 0.1s, opacity 0.4s ease 0.1s';
        quote.style.opacity = '0';
      }

      f.addEventListener('click', () => {
        const open = f.classList.toggle('pc-open');
        grid.style.maxHeight = open ? '400px' : '0';
        grid.style.opacity   = open ? '1' : '0';
        if (quote) {
          quote.style.maxHeight = open ? '200px' : '0';
          quote.style.opacity   = open ? '1' : '0';
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     14. COMMITMENT METER
  ══════════════════════════════════════════════════════ */
  function initCommitmentMeter() {
    const section = qs('.cm-visual');
    if (!section) return;
    const track    = qs('.cm-track', section);
    const fill     = qs('.cm-fill', section);
    const handle   = qs('.cm-handle', section);
    const labels   = qsa('.cm-level-label', section);
    const benefits = qsa('.cm-benefit', section);
    if (!track || !fill || !handle) return;

    const levels = [
      { pct: 12.5,  label: 0, unlock: 1 },
      { pct: 37.5,  label: 1, unlock: 3 },
      { pct: 62.5,  label: 2, unlock: 5 },
      { pct: 87.5,  label: 3, unlock: 7 }
    ];
    let currentLevel = 0;

    function setLevel(lvl) {
      currentLevel = lvl;
      const info = levels[lvl];
      fill.style.width = info.pct + '%';
      handle.style.left = info.pct + '%';
      labels.forEach((l, i) => l.classList.toggle('cm-level-active', i === lvl));
      benefits.forEach((b, i) => b.classList.toggle('cm-unlocked', i < info.unlock));
    }

    track.addEventListener('click', (e) => {
      const rect = track.getBoundingClientRect();
      const pct  = ((e.clientX - rect.left) / rect.width) * 100;
      let closest = 0;
      let minDist = Infinity;
      levels.forEach((l, i) => {
        const d = Math.abs(l.pct - pct);
        if (d < minDist) { minDist = d; closest = i; }
      });
      setLevel(closest);
    });

    labels.forEach((l, i) => {
      l.style.cursor = 'pointer';
      l.addEventListener('click', () => setLevel(i));
    });

    setLevel(0);
  }

  /* ══════════════════════════════════════════════════════
     15. POST-SUBMIT TRANSFORMATION
  ══════════════════════════════════════════════════════ */
  function initPostSubmit() {
    const form    = qs('#startForm');
    const overlay = qs('.post-submit-overlay');
    if (!form || !overlay) return;
    const closeBtn = qs('.ps-close', overlay);
    const pathBadge = qs('.ps-path-badge', overlay);

    /* Listen for native form submission interception already in main.js */
    const origSuccess = qs('#formSuccess');
    if (!origSuccess) return;

    let postSubmitShown = false;

    const mo = new MutationObserver(() => {
      if (!postSubmitShown && (origSuccess.style.display === 'flex' || origSuccess.style.display === 'block' || origSuccess.classList.contains('visible'))) {
        showPostSubmit();
      }
    });
    mo.observe(origSuccess, { attributes: true, attributeFilter: ['style', 'class'] });

    /* Also intercept form submit event */
    form.addEventListener('submit', () => {
      setTimeout(() => {
        if (!postSubmitShown && origSuccess.offsetHeight > 0) {
          showPostSubmit();
        }
      }, 600);
    });

    function showPostSubmit() {
      if (postSubmitShown) return;
      postSubmitShown = true;
      mo.disconnect();
      const pathSelect = qs('#path');
      if (pathBadge && pathSelect) {
        const val = pathSelect.value || 'your';
        const names = { athlete: 'ATHLETE PATH', adult: 'ADULT PATH', integrated: 'INTEGRATED PATH', unsure: 'PATH PENDING' };
        pathBadge.textContent = names[val] || 'YOUR PATH AWAITS';
      }
      overlay.classList.add('ps-active');
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('ps-active');
      });
    }

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) overlay.classList.remove('ps-active');
    });
  }

  /* ══════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', () => {
    initPulseVault();
    initHeroLockOn();
    initCoachingWall();
    initPathDecoder();
    initFloorMap();
    initStandardIndex();
    initCarryoverEngine();
    initAtmosphere();
    initArchives();
    initVisitSimulator();
    initLeadershipPresence();
    initEnvTransitions();
    initProofChamber();
    initCommitmentMeter();
    initPostSubmit();
  });
})();
