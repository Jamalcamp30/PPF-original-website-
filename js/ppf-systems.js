/* =====================================================
   PPF ATHLETICS — PPF SYSTEMS
   12 Exclusive Features: Standard Score, Film Room,
   Room Feed, Carryover Map, Coach's Voice, Roadmap,
   Family Trust, Readiness, Legacy Wall, Streaks,
   Room Enhancement, Benchmark Board
   ===================================================== */

(function () {
  'use strict';

  /* ── UTILITY ─────────────────────────────────────── */
  function qs(s, p) { return (p || document).querySelector(s); }
  function qsa(s, p) { return [].slice.call((p || document).querySelectorAll(s)); }

  /* Path color map used across features */
  var PATH_COLORS = {
    athlete:    '#ff5500',
    adult:      '#6a8fff',
    integrated: '#50c878'
  };

  /* Helper: create element with class and optional text */
  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text) node.textContent = text;
    return node;
  }

  /* Helper: inject scoped <style> block once */
  function injectStyles(id, css) {
    if (document.getElementById(id)) return;
    var style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  /* Helper: staggered class addition for child elements */
  function staggerReveal(parent, childSelector, className, delayMs) {
    qsa(childSelector, parent).forEach(function (child, i) {
      setTimeout(function () { child.classList.add(className); }, i * delayMs);
    });
  }

  /* Helper: IntersectionObserver factory */
  function onVisible(selector, callback, opts) {
    var elements = typeof selector === 'string' ? qsa(selector) : [selector];
    if (!elements.length) return;
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          callback(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, opts || { threshold: 0.2 });
    elements.forEach(function (el) { observer.observe(el); });
  }


  /* ══════════════════════════════════════════════════════
     1. THE STANDARD SCORE
     Enhances passport quiz result with a 0-100 PPF score
     ══════════════════════════════════════════════════════ */
  function initStandardScore() {
    injectStyles('ppf-standard-score-css', [
      '#standardScorePanel { max-width: 600px; margin: 32px auto; padding: 32px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; font-family: var(--font-body, Inter, sans-serif); color: var(--white, #fff); opacity: 0; transform: translateY(20px); transition: opacity 0.6s var(--ease-out-expo, ease), transform 0.6s var(--ease-out-expo, ease); }',
      '#standardScorePanel.ppf-visible { opacity: 1; transform: translateY(0); }',
      '.ss-header { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.6rem; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 20px; color: var(--orange, #ff5500); }',
      '.ss-score-ring { display: flex; align-items: center; gap: 24px; margin-bottom: 24px; }',
      '.ss-score-number { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 4rem; line-height: 1; min-width: 100px; }',
      '.ss-score-label { font-size: 0.85rem; color: var(--gray-300, #aaa); text-transform: uppercase; letter-spacing: 0.06em; }',
      '.ss-detail { padding: 12px 0; border-top: 1px solid var(--gray-700, #2a2a2a); }',
      '.ss-detail-title { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--gray-300, #aaa); margin-bottom: 4px; }',
      '.ss-detail-value { font-size: 1rem; }',
      '.ss-bar-track { height: 6px; background: var(--gray-700, #2a2a2a); border-radius: 3px; margin-top: 6px; overflow: hidden; }',
      '.ss-bar-fill { height: 100%; width: 0; border-radius: 3px; transition: width 1.2s var(--ease-out-expo, ease); }',
      '.ss-bar-fill.ss-animate { width: var(--fill); }'
    ].join('\n'));

    /* Score calculation matrices */
    var readinessMap    = { asap: 90, '1month': 75, '3months': 60, exploring: 40 };
    var experienceMap   = { advanced: 95, intermediate: 75, beginner: 55, none: 35 };
    var priorityMap     = { speed: 85, strength: 80, health: 70, independence: 65 };
    var goalAlignMap    = { speed: 85, strength: 80, health: 90, independence: 75 };

    var pathRecommend = {
      athlete:    { label: 'ATHLETE PERFORMANCE', color: PATH_COLORS.athlete },
      adult:      { label: 'ADULT PERFORMANCE',   color: PATH_COLORS.adult },
      integrated: { label: 'INTEGRATED FITNESS',  color: PATH_COLORS.integrated }
    };

    var targets30 = {
      athlete:    'Complete baseline testing & hold 3 coaching cues under fatigue.',
      adult:      'Train 3× per week consistently and hit first mobility benchmark.',
      integrated: 'Attend 4 sessions independently and execute warm-up with confidence.'
    };

    var weakLinks = {
      speed:        'Lateral movement deficit — prioritise first-step mechanics.',
      strength:     'Posterior chain imbalance — coaches will program hinge corrections.',
      health:       'Recovery awareness gap — expect readiness check-ins every session.',
      independence: 'Confidence under load — cue progressions will be gradual.'
    };

    var corrections = {
      athlete:    'Foot contact position on sprint start — expect this cue day one.',
      adult:      'Hip hinge patterning on deadlift setup — this unlocks everything.',
      integrated: 'Eye-level posture during movement — small cue, huge carryover.'
    };

    function buildPanel(data) {
      var path = data.path || 'adult';
      var goal = data.goal || 'strength';
      var experience = data.experience || 'beginner';
      var timeline = data.timeline || '1month';
      var priority = data.priority || goal;

      /* Calculate sub-scores */
      var readiness    = readinessMap[timeline] || 60;
      var moveQuality  = experienceMap[experience] || 55;
      var commitment   = priorityMap[priority] || 70;
      var coachability = goalAlignMap[goal] || 75;
      var output       = Math.round((readiness + moveQuality) / 2);
      var carryover    = Math.round((commitment + coachability) / 2);

      var total = Math.round(
        (readiness * 0.2) + (moveQuality * 0.2) + (commitment * 0.15) +
        (coachability * 0.15) + (output * 0.15) + (carryover * 0.15)
      );
      total = Math.min(100, Math.max(0, total));

      var rec = pathRecommend[path] || pathRecommend.adult;

      /* Build DOM */
      var panel = document.getElementById('standardScorePanel');
      if (!panel) {
        panel = el('div');
        panel.id = 'standardScorePanel';
        var result = document.getElementById('passportResult');
        if (result) {
          result.appendChild(panel);
        } else {
          return; // nowhere to attach
        }
      }

      panel.innerHTML = '';

      /* Header */
      panel.appendChild(el('div', 'ss-header', 'YOUR PPF STANDARD SCORE'));

      /* Score display */
      var ring = el('div', 'ss-score-ring');
      var num  = el('div', 'ss-score-number');
      num.textContent = '0';
      num.style.color = rec.color;
      ring.appendChild(num);

      var info = el('div');
      info.appendChild(el('div', 'ss-score-label', 'OUT OF 100'));
      var pathBadge = el('div', 'ss-detail-value');
      pathBadge.textContent = rec.label;
      pathBadge.style.color = rec.color;
      pathBadge.style.fontWeight = '700';
      info.appendChild(pathBadge);
      ring.appendChild(info);
      panel.appendChild(ring);

      /* Sub-score bars */
      var subs = [
        { label: 'Readiness',         val: readiness,    color: rec.color },
        { label: 'Movement Quality',  val: moveQuality,  color: rec.color },
        { label: 'Commitment',        val: commitment,   color: rec.color },
        { label: 'Coachability',      val: coachability,  color: rec.color },
        { label: 'Output Potential',  val: output,       color: rec.color },
        { label: 'Carryover Need',    val: carryover,    color: rec.color }
      ];

      subs.forEach(function (s) {
        var row = el('div', 'ss-detail');
        row.appendChild(el('div', 'ss-detail-title', s.label + ' — ' + s.val + '/100'));
        var track = el('div', 'ss-bar-track');
        var fill  = el('div', 'ss-bar-fill');
        fill.style.background = s.color;
        fill.style.setProperty('--fill', s.val + '%');
        track.appendChild(fill);
        row.appendChild(track);
        panel.appendChild(row);
      });

      /* 30-Day target */
      var tgt = el('div', 'ss-detail');
      tgt.appendChild(el('div', 'ss-detail-title', '30-DAY TARGET'));
      tgt.appendChild(el('div', 'ss-detail-value', targets30[path] || targets30.adult));
      panel.appendChild(tgt);

      /* Weak-link alert */
      var wl = el('div', 'ss-detail');
      wl.appendChild(el('div', 'ss-detail-title', 'WEAK-LINK ALERT'));
      wl.appendChild(el('div', 'ss-detail-value', weakLinks[goal] || weakLinks.strength));
      panel.appendChild(wl);

      /* Coach's first correction */
      var cf = el('div', 'ss-detail');
      cf.appendChild(el('div', 'ss-detail-title', "COACH'S FIRST CORRECTION"));
      cf.appendChild(el('div', 'ss-detail-value', corrections[path] || corrections.adult));
      panel.appendChild(cf);

      /* Animate score counting up */
      requestAnimationFrame(function () {
        panel.classList.add('ppf-visible');

        /* Animate bars */
        setTimeout(function () {
          qsa('.ss-bar-fill', panel).forEach(function (f) {
            f.classList.add('ss-animate');
          });
        }, 300);

        /* Count-up animation */
        var current = 0;
        var duration = 1200;
        var start = performance.now();
        (function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          /* ease-out */
          var eased = 1 - Math.pow(1 - progress, 3);
          current = Math.round(eased * total);
          num.textContent = current;
          if (progress < 1) requestAnimationFrame(tick);
        })(start);
      });
    }

    /* Listen for passport quiz completion event */
    document.addEventListener('passport:complete', function (e) {
      buildPanel(e.detail || {});
    });
  }


  /* ══════════════════════════════════════════════════════
     2. THE PPF FILM ROOM
     Movement analysis tabs with curated coaching insights
     ══════════════════════════════════════════════════════ */
  function initFilmRoom() {
    var section = qs('#filmRoom');
    if (!section) return;

    injectStyles('ppf-film-room-css', [
      '.fr-tabs { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }',
      '.fr-tab { padding: 10px 18px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 6px; color: var(--gray-300, #aaa); font-family: var(--font-body, Inter, sans-serif); font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.06em; cursor: pointer; transition: all 0.3s var(--ease-out-expo, ease); }',
      '.fr-tab:hover { color: var(--white, #fff); border-color: var(--gray-500, #555); }',
      '.fr-tab.fr-active { color: var(--orange, #ff5500); border-color: var(--orange, #ff5500); background: rgba(255,85,0,0.08); }',
      '.fr-panel { background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; padding: 28px; opacity: 0; transform: translateY(12px); transition: opacity 0.5s var(--ease-out-expo, ease), transform 0.5s var(--ease-out-expo, ease); }',
      '.fr-panel.fr-show { opacity: 1; transform: translateY(0); }',
      '.fr-section { margin-bottom: 20px; }',
      '.fr-section:last-child { margin-bottom: 0; }',
      '.fr-section-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--orange, #ff5500); margin-bottom: 6px; font-family: var(--font-body, Inter, sans-serif); }',
      '.fr-section-text { font-size: 0.95rem; color: var(--gray-100, #f0f0f0); line-height: 1.6; font-family: var(--font-body, Inter, sans-serif); }'
    ].join('\n'));

    var data = {
      'sprint-start': {
        miss: 'Most athletes pop up too early, losing horizontal force. The shin angle at push-off dictates acceleration quality.',
        cue: '"Push the ground behind you. Stay patient — let the speed come to you." PPF coaches watch shin angle, not arm swing.',
        correct: 'A 45° torso angle through the first 3 steps with foot contacts landing behind the centre of mass. No early upright phase.',
        carryover: 'First-step quickness in sport. Route breaks, base-stealing jumps, defensive recovery — they all start here.'
      },
      'deadlift-setup': {
        miss: 'Hips shoot up first because the lifter never loaded the hamstrings. The bar drifts forward and the lower back compensates.',
        cue: '"Wedge yourself between the bar and the floor. Push the floor away." PPF coaches cue the wedge, not the pull.',
        correct: 'Lats engaged, bar over midfoot, shoulders slightly ahead of bar, hamstrings pre-loaded. The first inch looks identical to the lockout.',
        carryover: 'Picking up a child, carrying groceries, standing from a low chair — the hip-hinge pattern protects the spine for life.'
      },
      'jump-landing': {
        miss: 'Knees cave on landing because the glutes aren\'t trained to absorb force eccentrically. This is the mechanism behind most ACL tears.',
        cue: '"Land like you\'re catching yourself, not crashing." PPF coaches cue the quiet landing — less noise = more control.',
        correct: 'Soft toe-to-heel landing, knees tracking over toes, hips absorbing with a slight sit. Quiet feet, stable knees.',
        carryover: 'Cutting in basketball, stepping off a curb, playing in the yard with kids. Controlled deceleration prevents injury everywhere.'
      },
      'first-step': {
        miss: 'Most athletes false-step backward before moving forward. It wastes 0.1-0.2 seconds — the difference between open and covered.',
        cue: '"Replace, don\'t retreat. Your first move should be toward the target." PPF coaches film this frame by frame.',
        correct: 'The back foot replaces where the front foot was. Body lean initiates the movement. No wasted backward motion.',
        carryover: 'Route running, defensive breaks on the ball, stealing bases, boxing out — every sport rewards the faster first move.'
      },
      'integrated-movement': {
        miss: 'Coordination is assumed, not trained. Many people struggle with bilateral timing, not strength. The brain needs patterning before loading.',
        cue: '"Slow is smooth, smooth is fast." PPF coaches break complex movements into simple rhythmic steps before adding speed.',
        correct: 'Fluid transitions between movements with consistent timing. The pattern looks effortless because each piece was rehearsed independently first.',
        carryover: 'Walking gait, stair confidence, balance recovery, recreational sports — training coordination builds real-world independence and safety.'
      }
    };

    var tabNames = [
      { key: 'sprint-start',         label: 'Sprint Start' },
      { key: 'deadlift-setup',       label: 'Deadlift Setup' },
      { key: 'jump-landing',         label: 'Jump Landing' },
      { key: 'first-step',           label: 'First Step' },
      { key: 'integrated-movement',  label: 'Integrated Movement' }
    ];

    /* Build tabs */
    var tabBar = el('div', 'fr-tabs');
    var panelContainer = el('div', 'fr-panel-container');

    tabNames.forEach(function (t, idx) {
      var btn = el('button', 'fr-tab', t.label);
      btn.setAttribute('data-fr', t.key);
      if (idx === 0) btn.classList.add('fr-active');
      tabBar.appendChild(btn);
    });

    section.appendChild(tabBar);
    section.appendChild(panelContainer);

    function showMovement(key) {
      var d = data[key];
      if (!d) return;

      /* Update active tab */
      qsa('.fr-tab', tabBar).forEach(function (t) {
        t.classList.toggle('fr-active', t.getAttribute('data-fr') === key);
      });

      /* Build panel */
      var panel = panelContainer.querySelector('.fr-panel');
      if (panel) panel.classList.remove('fr-show');

      setTimeout(function () {
        panelContainer.innerHTML = '';
        var p = el('div', 'fr-panel');

        var sections = [
          { label: 'WHAT MOST PEOPLE MISS',         text: d.miss },
          { label: 'WHAT PPF COACHES CUE',          text: d.cue },
          { label: 'WHAT CORRECT EXECUTION LOOKS LIKE', text: d.correct },
          { label: 'WHERE CARRYOVER SHOWS UP',       text: d.carryover }
        ];

        sections.forEach(function (s) {
          var sec = el('div', 'fr-section');
          sec.appendChild(el('div', 'fr-section-label', s.label));
          sec.appendChild(el('div', 'fr-section-text', s.text));
          p.appendChild(sec);
        });

        panelContainer.appendChild(p);
        requestAnimationFrame(function () {
          requestAnimationFrame(function () { p.classList.add('fr-show'); });
        });
      }, panel ? 300 : 0);
    }

    /* Tab click handler */
    tabBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.fr-tab');
      if (!btn) return;
      showMovement(btn.getAttribute('data-fr'));
    });

    /* Show first movement */
    showMovement('sprint-start');
  }


  /* ══════════════════════════════════════════════════════
     3. THE ROOM FEED
     Live-feeling rotating command feed with progress bar
     ══════════════════════════════════════════════════════ */
  function initRoomFeed() {
    var section = qs('#roomFeed');
    if (!section) return;

    injectStyles('ppf-room-feed-css', [
      '.rf-container { max-width: 640px; margin: 0 auto; background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; overflow: hidden; }',
      '.rf-header { display: flex; align-items: center; justify-content: space-between; padding: 14px 20px; background: var(--bg-elevated, #141414); border-bottom: 1px solid var(--gray-700, #2a2a2a); }',
      '.rf-live-dot { width: 8px; height: 8px; border-radius: 50%; background: #ff5500; margin-right: 8px; display: inline-block; }',
      '.rf-live-dot.rf-pulse { animation: rfPulse 1.5s infinite; }',
      '@keyframes rfPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }',
      '.rf-label { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1rem; letter-spacing: 0.1em; color: var(--gray-300, #aaa); }',
      '.rf-counter { font-size: 0.75rem; color: var(--gray-500, #555); font-family: var(--font-body, Inter, sans-serif); }',
      '.rf-body { padding: 28px 24px; min-height: 120px; position: relative; }',
      '.rf-module-tag { font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--orange, #ff5500); margin-bottom: 8px; font-family: var(--font-body, Inter, sans-serif); }',
      '.rf-module-text { font-size: 1.15rem; color: var(--white, #fff); line-height: 1.5; font-family: var(--font-body, Inter, sans-serif); opacity: 0; transform: translateY(10px); transition: opacity 0.4s ease, transform 0.4s ease; }',
      '.rf-module-text.rf-text-show { opacity: 1; transform: translateY(0); }',
      '.rf-nav { display: flex; gap: 6px; padding: 12px 20px; justify-content: center; }',
      '.rf-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--gray-700, #2a2a2a); cursor: pointer; transition: background 0.3s; border: none; padding: 0; }',
      '.rf-dot.rf-dot-active { background: var(--orange, #ff5500); }',
      '.rf-progress { height: 3px; background: var(--gray-700, #2a2a2a); }',
      '.rf-progress-fill { height: 100%; width: 0; background: var(--orange, #ff5500); transition: none; }',
      '.rf-progress-fill.rf-progress-run { transition: width 6s linear; width: 100%; }'
    ].join('\n'));

    var modules = [
      { tag: "TODAY'S COACH CUE",            text: '"Control the eccentric. Own the negative before you earn the speed." — Coach directive for all paths today.' },
      { tag: "THIS WEEK'S STANDARD",         text: 'No rep counts without quality. Every session this week: 3-second eccentrics on all compound lifts.' },
      { tag: 'MOST RECENT PR',               text: 'Athlete Path — Marcus D. just hit a 4.48 forty-yard dash. That\'s a 0.14s improvement in 6 weeks.' },
      { tag: 'CURRENT SPEED CAMP COUNT',      text: '23 athletes currently enrolled in the PPF Summer Speed Camp. Next cohort starts in 2 weeks.' },
      { tag: 'ATHLETE SPOTLIGHT',             text: 'Jaylen R. (Athlete Path) — 3 months in. Vertical jump up 4 inches, coach confidence rating: elite.' },
      { tag: 'ADULT CONSISTENCY STREAK',      text: 'The adult room is averaging 91% attendance this month. The standard is being held.' },
      { tag: 'INTEGRATED FAMILY WIN',         text: 'The Torres family completed 12 consecutive weeks of Integrated sessions. Independence milestones: 4/5 hit.' },
      { tag: 'NEXT AVAILABLE ASSESSMENT',     text: 'Assessment slots open: Tuesday 4 PM, Thursday 10 AM, Saturday 9 AM. Walk-ins welcome for first session.' }
    ];

    var idx = 0;
    var cycleTimer = null;

    /* Build DOM */
    var container = el('div', 'rf-container');

    var header = el('div', 'rf-header');
    var leftH = el('div');
    leftH.innerHTML = '<span class="rf-live-dot rf-pulse"></span><span class="rf-label">THE ROOM — LIVE FEED</span>';
    header.appendChild(leftH);
    var counter = el('span', 'rf-counter');
    header.appendChild(counter);
    container.appendChild(header);

    var body = el('div', 'rf-body');
    var tagEl = el('div', 'rf-module-tag');
    var textEl = el('div', 'rf-module-text');
    body.appendChild(tagEl);
    body.appendChild(textEl);
    container.appendChild(body);

    var nav = el('div', 'rf-nav');
    modules.forEach(function (_, i) {
      var dot = el('button', 'rf-dot');
      dot.setAttribute('aria-label', 'Feed item ' + (i + 1));
      nav.appendChild(dot);
    });
    container.appendChild(nav);

    var progressTrack = el('div', 'rf-progress');
    var progressFill  = el('div', 'rf-progress-fill');
    progressTrack.appendChild(progressFill);
    container.appendChild(progressTrack);

    section.appendChild(container);

    function show(i) {
      idx = i;
      var m = modules[idx];
      counter.textContent = (idx + 1) + ' / ' + modules.length;
      tagEl.textContent = m.tag;

      textEl.classList.remove('rf-text-show');
      setTimeout(function () {
        textEl.textContent = m.text;
        textEl.classList.add('rf-text-show');
      }, 200);

      qsa('.rf-dot', nav).forEach(function (d, j) {
        d.classList.toggle('rf-dot-active', j === idx);
      });

      /* Reset progress bar */
      progressFill.classList.remove('rf-progress-run');
      /* Force reflow */
      void progressFill.offsetWidth;
      progressFill.classList.add('rf-progress-run');
    }

    function startCycle() {
      clearInterval(cycleTimer);
      cycleTimer = setInterval(function () {
        show((idx + 1) % modules.length);
      }, 6000);
    }

    nav.addEventListener('click', function (e) {
      var dot = e.target.closest('.rf-dot');
      if (!dot) return;
      var dots = qsa('.rf-dot', nav);
      var clickIdx = dots.indexOf(dot);
      if (clickIdx < 0) return;
      show(clickIdx);
      startCycle(); // restart timer on manual navigation
    });

    show(0);
    startCycle();
  }


  /* ══════════════════════════════════════════════════════
     4. PPF CARRYOVER MAP
     Real-life result → PPF training connection
     ══════════════════════════════════════════════════════ */
  function initCarryoverMap() {
    var section = qs('#carryoverMap');
    if (!section) return;

    injectStyles('ppf-carryover-css', [
      '.cm-options { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px; margin-bottom: 28px; }',
      '.cm-option { padding: 16px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 8px; cursor: pointer; text-align: center; font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; color: var(--gray-300, #aaa); transition: all 0.3s var(--ease-out-expo, ease); }',
      '.cm-option:hover { color: var(--white, #fff); border-color: var(--gray-500, #555); }',
      '.cm-option.cm-selected { color: var(--orange, #ff5500); border-color: var(--orange, #ff5500); background: rgba(255,85,0,0.06); }',
      '.cm-reveal { background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; padding: 28px; }',
      '.cm-reveal-item { opacity: 0; transform: translateY(14px); transition: opacity 0.5s ease, transform 0.5s ease; margin-bottom: 20px; }',
      '.cm-reveal-item:last-child { margin-bottom: 0; }',
      '.cm-reveal-item.cm-item-show { opacity: 1; transform: translateY(0); }',
      '.cm-item-label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--orange, #ff5500); margin-bottom: 4px; font-family: var(--font-body, Inter, sans-serif); }',
      '.cm-item-text { font-size: 0.95rem; color: var(--gray-100, #f0f0f0); line-height: 1.6; font-family: var(--font-body, Inter, sans-serif); }'
    ].join('\n'));

    var data = {
      '10-yard-burst': {
        trains: 'Acceleration mechanics, first-step replacement, posterior chain power, shin-angle control.',
        session: 'Sprint-start drills, sled pushes, single-leg RDLs, resisted acceleration runs, and film review of stride 1-3.',
        cues: '"Push the ground behind you." "Stay low — let the speed come." "Replace, don\'t retreat."',
        milestone: 'Consistent sub-1.6s 10-yard dash with controlled mechanics. No false steps on reactive starts.'
      },
      'route-release': {
        trains: 'Hip mobility, lateral first-step speed, deceleration control, and reactive agility patterning.',
        session: 'Cone break drills, hip-turn acceleration, lateral bounds, film study of release technique, and agility ladder work.',
        cues: '"Snap the hip, don\'t round the turn." "Sell the stem before the break." "Low-to-fast, not fast-to-low."',
        milestone: 'Clean route breaks at full speed with zero wasted steps. Reactive drill scores improve 15%+ in 8 weeks.'
      },
      'posture-correction': {
        trains: 'Thoracic extension, scapular stability, deep core activation, and posterior chain endurance.',
        session: 'Dead hangs, band pull-aparts, goblet squats, wall slides, and farmer carries with coached breathing.',
        cues: '"Ribs over hips." "Shoulder blades in your back pockets." "Breathe through the brace."',
        milestone: 'Sustained upright posture through a full 60-minute session. Zero compensation patterns under fatigue.'
      },
      'body-awareness': {
        trains: 'Proprioception, bilateral coordination, spatial orientation, and rhythmic movement patterning.',
        session: 'Balance beam walks, contralateral crawls, single-leg stance progressions, and mirror-guided movement drills.',
        cues: '"Feel where your feet are." "Slow is smooth, smooth is fast." "Match the rhythm before adding speed."',
        milestone: 'Independent warm-up execution. Confident transitions between movement stations without coaching prompt.'
      },
      'family-confidence': {
        trains: 'Independence skills, social comfort in gym settings, self-directed movement, and parent-coach trust building.',
        session: 'Structured exploration stations, coached partner drills, achievement card milestones, and family debrief.',
        cues: '"You\'ve got this — show me what you remember." "Try first, then we\'ll adjust." "That was better than last week."',
        milestone: 'Family member completes 3 sessions without parent prompt. Confidence rating self-reported at 4+/5.'
      },
      'injury-reduction': {
        trains: 'Eccentric control, landing mechanics, joint stability, movement screening, and corrective patterning.',
        session: 'Depth drops to stick, single-leg landings, ankle stability circuits, hip CARs, and deceleration drills.',
        cues: '"Land quiet — less noise means more control." "Knees track toes." "Absorb with your hips, not your knees."',
        milestone: 'Zero movement-screen red flags. Controlled single-leg landing with no knee valgus under fatigue.'
      }
    };

    var options = [
      { key: '10-yard-burst',     label: '10-Yard Burst' },
      { key: 'route-release',     label: 'Route Release' },
      { key: 'posture-correction', label: 'Posture Correction' },
      { key: 'body-awareness',    label: 'Body Awareness' },
      { key: 'family-confidence', label: 'Family Confidence' },
      { key: 'injury-reduction',  label: 'Injury Reduction' }
    ];

    var optGrid = el('div', 'cm-options');
    options.forEach(function (o) {
      var btn = el('button', 'cm-option', o.label);
      btn.setAttribute('data-cm', o.key);
      optGrid.appendChild(btn);
    });
    section.appendChild(optGrid);

    var revealContainer = el('div', 'cm-reveal');
    revealContainer.style.display = 'none';
    section.appendChild(revealContainer);

    function showResult(key) {
      var d = data[key];
      if (!d) return;

      qsa('.cm-option', optGrid).forEach(function (b) {
        b.classList.toggle('cm-selected', b.getAttribute('data-cm') === key);
      });

      revealContainer.innerHTML = '';
      revealContainer.style.display = 'block';

      var items = [
        { label: 'WHAT PPF TRAINS FOR THIS',      text: d.trains },
        { label: 'WHAT A SESSION WOULD INCLUDE',   text: d.session },
        { label: 'WHAT CUES MATTER',               text: d.cues },
        { label: 'WHAT MILESTONE PROVES IT\'S WORKING', text: d.milestone }
      ];

      items.forEach(function (item) {
        var row = el('div', 'cm-reveal-item');
        row.appendChild(el('div', 'cm-item-label', item.label));
        row.appendChild(el('div', 'cm-item-text', item.text));
        revealContainer.appendChild(row);
      });

      /* Staggered fade-in */
      staggerReveal(revealContainer, '.cm-reveal-item', 'cm-item-show', 150);
    }

    optGrid.addEventListener('click', function (e) {
      var btn = e.target.closest('.cm-option');
      if (!btn) return;
      showResult(btn.getAttribute('data-cm'));
    });
  }


  /* ══════════════════════════════════════════════════════
     5. COACH'S VOICE ARCHIVE
     Branded audio-feel rotating cue interface
     ══════════════════════════════════════════════════════ */
  function initCoachVoice() {
    var section = qs('#coachVoice');
    if (!section) return;

    injectStyles('ppf-coach-voice-css', [
      '.cv-player { max-width: 560px; margin: 0 auto; background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; overflow: hidden; }',
      '.cv-top { padding: 14px 20px; background: var(--bg-elevated, #141414); border-bottom: 1px solid var(--gray-700, #2a2a2a); display: flex; align-items: center; justify-content: space-between; }',
      '.cv-now { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 0.85rem; letter-spacing: 0.14em; color: var(--orange, #ff5500); }',
      '.cv-path-badge { display: inline-block; padding: 3px 10px; border-radius: 4px; font-size: 0.65rem; text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-body, Inter, sans-serif); font-weight: 600; }',
      '.cv-body { padding: 28px 24px; min-height: 100px; text-align: center; }',
      '.cv-cue { font-family: var(--font-body, Inter, sans-serif); font-size: 1.2rem; color: var(--white, #fff); line-height: 1.6; font-style: italic; opacity: 0; transform: scale(0.96); transition: opacity 0.5s ease, transform 0.5s ease; }',
      '.cv-cue.cv-cue-show { opacity: 1; transform: scale(1); }',
      /* Waveform bars */
      '.cv-wave { display: flex; align-items: flex-end; justify-content: center; gap: 3px; height: 32px; padding: 16px 24px 20px; }',
      '.cv-wave-bar { width: 3px; background: var(--orange, #ff5500); border-radius: 2px; opacity: 0.6; }',
      '.cv-wave-bar.cv-wave-animate { animation: cvWave 1.2s ease-in-out infinite; }',
      '@keyframes cvWave { 0%,100%{ height: 6px; opacity:0.3; } 50%{ height: var(--bar-h, 24px); opacity:0.8; } }',
      '.cv-controls { display: flex; justify-content: center; gap: 12px; padding: 0 24px 20px; }',
      '.cv-btn { padding: 8px 20px; background: transparent; border: 1px solid var(--gray-700, #2a2a2a); border-radius: 6px; color: var(--gray-300, #aaa); font-family: var(--font-body, Inter, sans-serif); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.3s ease; }',
      '.cv-btn:hover { color: var(--white, #fff); border-color: var(--orange, #ff5500); }'
    ].join('\n'));

    var cues = [
      { text: '"Control the eccentric. If you can\'t own the negative, you haven\'t earned the speed."', path: 'athlete' },
      { text: '"Consistency isn\'t boring — it\'s the standard. Show up, do the work, repeat."', path: 'adult' },
      { text: '"Slow is smooth, smooth is fast. Master the pattern before you chase the clock."', path: 'integrated' },
      { text: '"Your warm-up is your first rep. Treat it like it matters, because it does."', path: 'athlete' },
      { text: '"Nobody cares about your max if your form breaks at 70%. Build the base."', path: 'adult' },
      { text: '"Confidence is a skill. We train it the same way we train strength — progressively."', path: 'integrated' },
      { text: '"The scoreboard doesn\'t know about your excuses. Prepare like it\'s game day."', path: 'athlete' },
      { text: '"Movement is medicine, but only if the dose is right. Trust the program."', path: 'adult' }
    ];

    var idx = 0;
    var timer = null;

    var player = el('div', 'cv-player');

    /* Top bar */
    var top = el('div', 'cv-top');
    var nowLabel = el('span', 'cv-now', 'NOW PLAYING');
    var badge = el('span', 'cv-path-badge');
    top.appendChild(nowLabel);
    top.appendChild(badge);
    player.appendChild(top);

    /* Body */
    var body = el('div', 'cv-body');
    var cueText = el('div', 'cv-cue');
    body.appendChild(cueText);
    player.appendChild(body);

    /* Waveform */
    var wave = el('div', 'cv-wave');
    for (var b = 0; b < 24; b++) {
      var bar = el('div', 'cv-wave-bar cv-wave-animate');
      var h = 8 + Math.random() * 20;
      bar.style.setProperty('--bar-h', h + 'px');
      bar.style.animationDelay = (Math.random() * 1.2).toFixed(2) + 's';
      wave.appendChild(bar);
    }
    player.appendChild(wave);

    /* Controls */
    var controls = el('div', 'cv-controls');
    var prevBtn = el('button', 'cv-btn', '← PREV');
    var nextBtn = el('button', 'cv-btn', 'NEXT →');
    controls.appendChild(prevBtn);
    controls.appendChild(nextBtn);
    player.appendChild(controls);

    section.appendChild(player);

    function showCue(i) {
      idx = ((i % cues.length) + cues.length) % cues.length;
      var c = cues[idx];

      cueText.classList.remove('cv-cue-show');
      setTimeout(function () {
        cueText.textContent = c.text;
        badge.textContent = c.path.toUpperCase();
        badge.style.background = PATH_COLORS[c.path] + '22';
        badge.style.color = PATH_COLORS[c.path];
        cueText.classList.add('cv-cue-show');
      }, 250);
    }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(function () { showCue(idx + 1); }, 8000);
    }

    prevBtn.addEventListener('click', function () { showCue(idx - 1); startAuto(); });
    nextBtn.addEventListener('click', function () { showCue(idx + 1); startAuto(); });

    showCue(0);
    startAuto();
  }


  /* ══════════════════════════════════════════════════════
     6. 90-DAY VISUAL ROADMAP BUILDER
     4-phase timeline after path selection
     ══════════════════════════════════════════════════════ */
  function initRoadmap() {
    var section = qs('#roadmapBuilder');
    if (!section) return;

    injectStyles('ppf-roadmap-css', [
      '.rm-path-select { display: flex; gap: 12px; margin-bottom: 32px; flex-wrap: wrap; }',
      '.rm-path-btn { padding: 12px 24px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 8px; color: var(--gray-300, #aaa); font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.1rem; letter-spacing: 0.08em; cursor: pointer; transition: all 0.3s ease; }',
      '.rm-path-btn:hover { color: var(--white, #fff); }',
      '.rm-path-btn.rm-path-active { color: var(--white, #fff); }',
      '.rm-timeline { position: relative; padding-left: 32px; }',
      '.rm-timeline::before { content: ""; position: absolute; left: 10px; top: 0; bottom: 0; width: 2px; background: var(--gray-700, #2a2a2a); }',
      '.rm-phase { position: relative; padding: 20px 0 32px 24px; opacity: 0; transform: translateX(-20px); transition: opacity 0.6s ease, transform 0.6s ease; }',
      '.rm-phase.rm-phase-show { opacity: 1; transform: translateX(0); }',
      '.rm-phase-dot { position: absolute; left: -27px; top: 24px; width: 14px; height: 14px; border-radius: 50%; border: 2px solid var(--gray-700, #2a2a2a); background: var(--bg-base, #080808); transition: border-color 0.4s ease, background 0.4s ease; }',
      '.rm-phase.rm-phase-show .rm-phase-dot { border-color: currentColor; background: currentColor; }',
      '.rm-phase-week { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1rem; letter-spacing: 0.1em; margin-bottom: 4px; }',
      '.rm-phase-title { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.4rem; letter-spacing: 0.06em; color: var(--white, #fff); margin-bottom: 8px; }',
      '.rm-phase-desc { font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; color: var(--gray-300, #aaa); line-height: 1.6; }'
    ].join('\n'));

    var phases = {
      athlete: [
        { week: 'WEEK 1', title: 'ASSESSMENT + BASELINE', desc: 'Full movement screen, 10-yard and 40-yard times, vertical jump, pro agility. Coaches identify your weak link and set 90-day targets.' },
        { week: 'WEEKS 2–4', title: 'FOUNDATION + CORRECTION', desc: 'Sprint mechanics drills, posterior chain activation, hip hinge patterning. 3–4 sessions per week with film review every Friday.' },
        { week: 'WEEKS 5–8', title: 'PROGRESSION + OUTPUT', desc: 'Speed increases, resisted sprints, plyometric progressions, sport-specific agility. Testing at week 6 to validate trajectory.' },
        { week: 'WEEKS 9–12', title: 'MILESTONE + REASSESSMENT', desc: 'Full retest against baseline. Compare 10-yard, 40-yard, vertical, agility. Set next 90-day cycle. Coach debrief and program update.' }
      ],
      adult: [
        { week: 'WEEK 1', title: 'ASSESSMENT + BASELINE', desc: 'Movement screen, strength baselines (deadlift, squat, press), mobility assessment, body composition snapshot. Coach sets 90-day plan.' },
        { week: 'WEEKS 2–4', title: 'FOUNDATION + CORRECTION', desc: 'Master the 6 foundational patterns. Build consistency at 3× per week. Mobility work every session. Nutrition awareness check-in.' },
        { week: 'WEEKS 5–8', title: 'PROGRESSION + OUTPUT', desc: 'Progressive overload on compound lifts. Conditioning added. Mid-point body comp check. Consistency target: 90%+ attendance.' },
        { week: 'WEEKS 9–12', title: 'MILESTONE + REASSESSMENT', desc: 'Full retest: deadlift, squat, press, mobility score, body composition. Celebrate wins, identify next focus. Program recalibrated.' }
      ],
      integrated: [
        { week: 'WEEK 1', title: 'ASSESSMENT + BASELINE', desc: 'Meet your coach, tour the room. Assess coordination, balance, confidence level, and independence skills. Family debrief included.' },
        { week: 'WEEKS 2–4', title: 'FOUNDATION + CORRECTION', desc: 'Learn 3 safe movement patterns. Build routine and comfort. 2 sessions per week with full coaching support. Progress card started.' },
        { week: 'WEEKS 5–8', title: 'PROGRESSION + OUTPUT', desc: 'Add complexity and independence. Warm-up self-directed. Coordination drills scored. Social integration with group activities.' },
        { week: 'WEEKS 9–12', title: 'MILESTONE + REASSESSMENT', desc: 'Independence milestone review. Confidence self-report. Coordination retest. Family meeting to discuss next phase and long-term goals.' }
      ]
    };

    /* Path selector buttons */
    var pathSelect = el('div', 'rm-path-select');
    ['athlete', 'adult', 'integrated'].forEach(function (p) {
      var btn = el('button', 'rm-path-btn', p.toUpperCase());
      btn.setAttribute('data-path', p);
      btn.style.setProperty('--path-color', PATH_COLORS[p]);
      pathSelect.appendChild(btn);
    });
    section.appendChild(pathSelect);

    var timeline = el('div', 'rm-timeline');
    section.appendChild(timeline);

    function showPath(path) {
      var data = phases[path];
      if (!data) return;
      var color = PATH_COLORS[path];

      qsa('.rm-path-btn', pathSelect).forEach(function (b) {
        var active = b.getAttribute('data-path') === path;
        b.classList.toggle('rm-path-active', active);
        b.style.borderColor = active ? color : '';
        b.style.color = active ? color : '';
      });

      timeline.innerHTML = '';

      data.forEach(function (phase) {
        var phEl = el('div', 'rm-phase');
        phEl.style.color = color;

        var dot = el('div', 'rm-phase-dot');
        phEl.appendChild(dot);

        phEl.appendChild(el('div', 'rm-phase-week', phase.week));
        phEl.appendChild(el('div', 'rm-phase-title', phase.title));
        phEl.appendChild(el('div', 'rm-phase-desc', phase.desc));

        timeline.appendChild(phEl);
      });

      /* Staggered reveal */
      staggerReveal(timeline, '.rm-phase', 'rm-phase-show', 200);
    }

    pathSelect.addEventListener('click', function (e) {
      var btn = e.target.closest('.rm-path-btn');
      if (!btn) return;
      showPath(btn.getAttribute('data-path'));
    });

    /* Also reveal on scroll */
    onVisible(timeline, function () {
      if (!qs('.rm-phase', timeline)) showPath('athlete');
    });
  }


  /* ══════════════════════════════════════════════════════
     7. FAMILY TRUST DASHBOARD
     Expandable accordion for family/integrated concerns
     ══════════════════════════════════════════════════════ */
  function initFamilyTrust() {
    var section = qs('#familyDashboard');
    if (!section) return;

    var green = PATH_COLORS.integrated;

    injectStyles('ppf-family-trust-css', [
      '.ft-card { background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 10px; margin-bottom: 12px; overflow: hidden; transition: border-color 0.3s ease; }',
      '.ft-card:hover { border-color: ' + green + '44; }',
      '.ft-card-header { display: flex; align-items: center; justify-content: space-between; padding: 18px 20px; cursor: pointer; }',
      '.ft-card-title { font-family: var(--font-body, Inter, sans-serif); font-size: 1rem; color: var(--white, #fff); font-weight: 600; }',
      '.ft-card-icon { font-size: 1.2rem; color: ' + green + '; transition: transform 0.3s ease; }',
      '.ft-card.ft-open .ft-card-icon { transform: rotate(45deg); }',
      '.ft-card-body { max-height: 0; overflow: hidden; transition: max-height 0.5s var(--ease-out-expo, ease); }',
      '.ft-card.ft-open .ft-card-body { max-height: 400px; }',
      '.ft-card-content { padding: 0 20px 20px; font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; color: var(--gray-300, #aaa); line-height: 1.7; }'
    ].join('\n'));

    var cards = [
      {
        title: 'What parents can expect in week 1',
        body: 'Your child will meet their coach, tour the training room, and complete a baseline assessment designed for comfort — not competition. We observe movement quality, confidence level, and social comfort. You\'ll receive a written summary of findings and the proposed plan. No pressure, no overwhelm — just a clear picture of where we start.'
      },
      {
        title: 'How progress is communicated',
        body: 'Every 4 weeks, you\'ll receive a progress card covering coordination scores, independence milestones, confidence self-reports, and coach observations. We also schedule family check-ins at weeks 4, 8, and 12. You\'ll never wonder what\'s happening — transparency is built into the program.'
      },
      {
        title: 'What session observation looks like',
        body: 'Parents are welcome to observe any session from our designated viewing area. We encourage watching during week 1, then stepping back to promote independence. Coaches will debrief with you post-session if requested. Our goal is to build your child\'s confidence in the room while keeping you informed.'
      },
      {
        title: 'How safety, dignity, and progress are tracked',
        body: 'Every session begins with a readiness check-in and ends with a positive reinforcement close. We use a traffic-light system: green (progressing), yellow (needs attention), red (modify approach). Equipment is age-appropriate, loads are conservative, and every athlete is addressed by name. Dignity is non-negotiable.'
      },
      {
        title: 'What success looks like beyond fitness',
        body: 'Success in the Integrated path isn\'t a number on a bar. It\'s your child warming up independently. It\'s them asking to go to training. It\'s improved posture, better sleep, more confidence at school, and a sense of belonging. We measure what matters — and what matters is their quality of life improving, week by week.'
      }
    ];

    cards.forEach(function (c) {
      var card = el('div', 'ft-card');

      var header = el('div', 'ft-card-header');
      header.appendChild(el('span', 'ft-card-title', c.title));
      header.appendChild(el('span', 'ft-card-icon', '+'));
      card.appendChild(header);

      var body = el('div', 'ft-card-body');
      body.appendChild(el('div', 'ft-card-content', c.body));
      card.appendChild(body);

      section.appendChild(card);
    });

    /* Accordion click handler */
    section.addEventListener('click', function (e) {
      var header = e.target.closest('.ft-card-header');
      if (!header) return;
      var card = header.parentElement;
      var wasOpen = card.classList.contains('ft-open');

      /* Close all */
      qsa('.ft-card', section).forEach(function (c) {
        c.classList.remove('ft-open');
      });

      /* Toggle clicked */
      if (!wasOpen) card.classList.add('ft-open');
    });
  }


  /* ══════════════════════════════════════════════════════
     8. PPF READINESS CHECK-IN
     Modal with 5 slider questions and recommendation
     ══════════════════════════════════════════════════════ */
  function initReadiness() {
    var btn = qs('#readinessBtn');
    if (!btn) return;

    injectStyles('ppf-readiness-css', [
      '.rc-overlay { position: fixed; inset: 0; z-index: 9999; background: rgba(0,0,0,0.85); display: flex; align-items: center; justify-content: center; opacity: 0; visibility: hidden; transition: opacity 0.4s ease, visibility 0.4s ease; }',
      '.rc-overlay.rc-open { opacity: 1; visibility: visible; }',
      '.rc-modal { background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 14px; width: 90%; max-width: 480px; max-height: 90vh; overflow-y: auto; padding: 32px; position: relative; }',
      '.rc-close { position: absolute; top: 12px; right: 16px; background: none; border: none; color: var(--gray-500, #555); font-size: 1.5rem; cursor: pointer; line-height: 1; }',
      '.rc-title { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.6rem; letter-spacing: 0.08em; color: var(--orange, #ff5500); margin-bottom: 24px; }',
      '.rc-question { margin-bottom: 24px; }',
      '.rc-q-label { font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; color: var(--white, #fff); margin-bottom: 10px; }',
      '.rc-slider { width: 100%; accent-color: var(--orange, #ff5500); cursor: pointer; }',
      '.rc-slider-labels { display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--gray-500, #555); font-family: var(--font-body, Inter, sans-serif); margin-top: 4px; }',
      '.rc-select { width: 100%; padding: 10px 12px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 6px; color: var(--white, #fff); font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; }',
      '.rc-submit { display: block; width: 100%; padding: 14px; background: var(--orange, #ff5500); border: none; border-radius: 8px; color: var(--white, #fff); font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.1rem; letter-spacing: 0.08em; cursor: pointer; transition: opacity 0.3s; margin-top: 8px; }',
      '.rc-submit:hover { opacity: 0.85; }',
      '.rc-result { text-align: center; padding: 20px 0; }',
      '.rc-result-title { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.3rem; color: var(--orange, #ff5500); margin-bottom: 12px; letter-spacing: 0.06em; }',
      '.rc-result-text { font-family: var(--font-body, Inter, sans-serif); font-size: 0.95rem; color: var(--gray-100, #f0f0f0); line-height: 1.6; margin-bottom: 16px; }',
      '.rc-result-cta { display: inline-block; padding: 12px 28px; background: var(--orange, #ff5500); border-radius: 8px; color: var(--white, #fff); text-decoration: none; font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1rem; letter-spacing: 0.06em; }'
    ].join('\n'));

    /* Build modal */
    var overlay = el('div', 'rc-overlay');
    var modal   = el('div', 'rc-modal');

    var closeBtn = el('button', 'rc-close', '×');
    closeBtn.setAttribute('aria-label', 'Close');
    modal.appendChild(closeBtn);
    modal.appendChild(el('div', 'rc-title', 'PPF READINESS CHECK-IN'));

    var form = el('div', 'rc-form');

    /* Slider questions */
    var sliders = [
      { id: 'energy',     label: 'How is your energy today?',          low: 'Drained', high: 'Fired Up' },
      { id: 'confidence', label: 'How confident are you feeling?',     low: 'Low',     high: 'Unstoppable' },
      { id: 'soreness',   label: 'Any soreness or limitation?',        low: 'None',    high: 'Significant' },
      { id: 'consistency', label: 'How is your schedule consistency?',  low: 'Spotty',  high: 'Locked In' }
    ];

    var inputs = {};

    sliders.forEach(function (s) {
      var q = el('div', 'rc-question');
      q.appendChild(el('div', 'rc-q-label', s.label));
      var slider = document.createElement('input');
      slider.type = 'range';
      slider.min = '1';
      slider.max = '5';
      slider.value = '3';
      slider.className = 'rc-slider';
      slider.id = 'rc-' + s.id;
      inputs[s.id] = slider;
      q.appendChild(slider);
      var labels = el('div', 'rc-slider-labels');
      labels.appendChild(el('span', '', s.low));
      labels.appendChild(el('span', '', s.high));
      q.appendChild(labels);
      form.appendChild(q);
    });

    /* Select question */
    var obsQ = el('div', 'rc-question');
    obsQ.appendChild(el('div', 'rc-q-label', 'What\'s your biggest obstacle right now?'));
    var select = document.createElement('select');
    select.className = 'rc-select';
    select.id = 'rc-obstacle';
    var obstacles = ['Time management', 'Motivation', 'Recovery / soreness', 'Not sure where to start', 'Financial concern', 'Accountability'];
    obstacles.forEach(function (o) {
      var opt = document.createElement('option');
      opt.value = o.toLowerCase().replace(/\s+/g, '-');
      opt.textContent = o;
      select.appendChild(opt);
    });
    inputs.obstacle = select;
    obsQ.appendChild(select);
    form.appendChild(obsQ);

    var submitBtn = el('button', 'rc-submit', 'GET MY RECOMMENDATION');
    form.appendChild(submitBtn);

    modal.appendChild(form);

    var resultDiv = el('div', 'rc-result');
    resultDiv.style.display = 'none';
    modal.appendChild(resultDiv);

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    /* Open / Close */
    btn.addEventListener('click', function () {
      overlay.classList.add('rc-open');
    });

    function closeModal() { overlay.classList.remove('rc-open'); }
    closeBtn.addEventListener('click', closeModal);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    /* Submit logic */
    submitBtn.addEventListener('click', function () {
      var energy      = parseInt(inputs.energy.value);
      var confidence  = parseInt(inputs.confidence.value);
      var soreness    = parseInt(inputs.soreness.value);
      var consistency = parseInt(inputs.consistency.value);
      var obstacle    = inputs.obstacle.value;

      var score = energy + confidence + (6 - soreness) + consistency; // 4-20 range

      var rec;
      if (score >= 16) {
        rec = { title: 'YOU\'RE READY TO PUSH', text: 'Your readiness is high. Book a performance session and bring intensity. This is a green-light day.', cta: 'Book a Session', href: '#passport' };
      } else if (score >= 11) {
        rec = { title: 'SOLID FOUNDATION DAY', text: 'You\'re in a good spot for a structured session. Focus on quality movement and building consistency. Show up and hold the standard.', cta: 'View the Schedule', href: '#passport' };
      } else if (score >= 7) {
        rec = { title: 'RECOVERY + MOVEMENT', text: 'Today is a yellow-light day. A mobility session or light movement would serve you better than max effort. Protect the streak.', cta: 'Learn About Recovery', href: '#passport' };
      } else {
        rec = { title: 'REST IS PART OF THE STANDARD', text: 'Your body is telling you to recover. Hydrate, sleep, and come back stronger. The room will be here when you\'re ready.', cta: 'Talk to a Coach', href: '#passport' };
      }

      /* Adjust for obstacle */
      if (obstacle === 'not-sure-where-to-start') {
        rec.text += ' Start with a free assessment — we\'ll build the plan for you.';
        rec.cta = 'Book Free Assessment';
      } else if (obstacle === 'accountability') {
        rec.text += ' Consider the Quarterly membership for built-in accountability.';
      }

      form.style.display = 'none';
      resultDiv.style.display = 'block';
      resultDiv.innerHTML = '';
      resultDiv.appendChild(el('div', 'rc-result-title', rec.title));
      resultDiv.appendChild(el('div', 'rc-result-text', rec.text));
      var cta = el('a', 'rc-result-cta', rec.cta);
      cta.href = rec.href;
      cta.addEventListener('click', closeModal);
      resultDiv.appendChild(cta);
    });

    /* Reset form on reopen */
    btn.addEventListener('click', function () {
      form.style.display = 'block';
      resultDiv.style.display = 'none';
    });
  }


  /* ══════════════════════════════════════════════════════
     9. THE PPF LEGACY WALL
     Achievement grid with path filtering
     ══════════════════════════════════════════════════════ */
  function initLegacyWall() {
    var section = qs('#legacyWall');
    if (!section) return;

    injectStyles('ppf-legacy-wall-css', [
      '.lw-filters { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }',
      '.lw-filter { padding: 8px 18px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 6px; color: var(--gray-300, #aaa); font-family: var(--font-body, Inter, sans-serif); font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.08em; cursor: pointer; transition: all 0.3s ease; }',
      '.lw-filter:hover { color: var(--white, #fff); }',
      '.lw-filter.lw-filter-active { color: var(--orange, #ff5500); border-color: var(--orange, #ff5500); }',
      '.lw-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }',
      '.lw-card { background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 10px; padding: 20px; opacity: 0; transform: translateY(20px); transition: opacity 0.5s ease, transform 0.5s ease, border-color 0.3s ease; }',
      '.lw-card.lw-card-show { opacity: 1; transform: translateY(0); }',
      '.lw-card.lw-card-hidden { display: none; }',
      '.lw-card:hover { border-color: var(--gray-500, #555); }',
      '.lw-card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }',
      '.lw-card-name { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.1rem; color: var(--white, #fff); letter-spacing: 0.04em; }',
      '.lw-card-badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 0.6rem; text-transform: uppercase; letter-spacing: 0.1em; font-family: var(--font-body, Inter, sans-serif); font-weight: 600; }',
      '.lw-card-achievement { font-family: var(--font-body, Inter, sans-serif); font-size: 0.9rem; color: var(--gray-300, #aaa); line-height: 1.5; margin-bottom: 10px; }',
      '.lw-card-metric { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.6rem; margin-bottom: 6px; }',
      '.lw-card-time { font-size: 0.7rem; color: var(--gray-500, #555); font-family: var(--font-body, Inter, sans-serif); }'
    ].join('\n'));

    var entries = [
      { name: 'Marcus D.', achievement: 'Dropped 0.14s off forty time in 6 weeks of sprint training.', metric: '4.48 forty', path: 'athlete', time: '2 weeks ago' },
      { name: 'Jaylen R.', achievement: 'Vertical jump improved 4 inches after posterior chain programming.', metric: '34" vertical', path: 'athlete', time: '3 weeks ago' },
      { name: 'Amir T.', achievement: 'First sub-1.5s ten-yard dash with zero false steps on film.', metric: '1.47s ten-yard', path: 'athlete', time: '1 month ago' },
      { name: 'Kaleb S.', achievement: 'Pro agility under 4.2 for the first time in his career.', metric: '4.18 pro agility', path: 'athlete', time: '1 month ago' },
      { name: 'Lisa M.', achievement: '90% attendance maintained for 6 consecutive months.', metric: '180+ sessions', path: 'adult', time: '1 week ago' },
      { name: 'David W.', achievement: 'Hit a 2× bodyweight deadlift milestone at age 47.', metric: '405 lb deadlift', path: 'adult', time: '2 weeks ago' },
      { name: 'Karen J.', achievement: 'Full push-up set of 50 — started at 8 reps nine months ago.', metric: '50 push-ups', path: 'adult', time: '3 weeks ago' },
      { name: 'Robert C.', achievement: 'Mobility score jumped from 4/10 to 8/10. Zero low-back pain.', metric: '8/10 mobility', path: 'adult', time: '1 month ago' },
      { name: 'The Torres Family', achievement: '12 consecutive weeks of integrated sessions completed together.', metric: '12-week streak', path: 'integrated', time: '1 week ago' },
      { name: 'Sophia L.', achievement: 'Independent warm-up achieved in week 10 — ahead of schedule.', metric: 'Independence ✓', path: 'integrated', time: '2 weeks ago' },
      { name: 'Ethan G.', achievement: 'Coordination score improved from 3/10 to 7/10 in 8 weeks.', metric: '7/10 coordination', path: 'integrated', time: '3 weeks ago' },
      { name: 'The Park Family', achievement: 'Confidence self-report at 5/5 for both children in the program.', metric: '5/5 confidence', path: 'integrated', time: '1 month ago' }
    ];

    /* Filters */
    var filterBar = el('div', 'lw-filters');
    ['all', 'athlete', 'adult', 'integrated'].forEach(function (f) {
      var btn = el('button', 'lw-filter', f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1));
      btn.setAttribute('data-filter', f);
      if (f === 'all') btn.classList.add('lw-filter-active');
      filterBar.appendChild(btn);
    });
    section.appendChild(filterBar);

    /* Grid */
    var grid = el('div', 'lw-grid');

    entries.forEach(function (entry) {
      var card = el('div', 'lw-card');
      card.setAttribute('data-path', entry.path);
      var color = PATH_COLORS[entry.path];

      var top = el('div', 'lw-card-top');
      top.appendChild(el('span', 'lw-card-name', entry.name));
      var badge = el('span', 'lw-card-badge', entry.path.toUpperCase());
      badge.style.background = color + '22';
      badge.style.color = color;
      top.appendChild(badge);
      card.appendChild(top);

      card.appendChild(el('div', 'lw-card-achievement', entry.achievement));

      var metric = el('div', 'lw-card-metric', entry.metric);
      metric.style.color = color;
      card.appendChild(metric);

      card.appendChild(el('div', 'lw-card-time', entry.time));

      grid.appendChild(card);
    });

    section.appendChild(grid);

    /* Filter click */
    filterBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.lw-filter');
      if (!btn) return;
      var filter = btn.getAttribute('data-filter');

      qsa('.lw-filter', filterBar).forEach(function (b) {
        b.classList.toggle('lw-filter-active', b === btn);
      });

      qsa('.lw-card', grid).forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-path') === filter;
        card.classList.toggle('lw-card-hidden', !match);
        /* Re-trigger animation for visible cards */
        if (match) {
          card.classList.remove('lw-card-show');
          void card.offsetWidth;
        }
      });

      /* Stagger visible cards */
      staggerReveal(grid, '.lw-card:not(.lw-card-hidden)', 'lw-card-show', 80);
    });

    /* Initial scroll-triggered reveal */
    onVisible(grid, function () {
      staggerReveal(grid, '.lw-card', 'lw-card-show', 80);
    });
  }


  /* ══════════════════════════════════════════════════════
     10. STANDARD STREAKS
     Animated counters triggered by IntersectionObserver
     ══════════════════════════════════════════════════════ */
  function initStreaks() {
    var section = qs('#standardStreaks');
    if (!section) return;

    injectStyles('ppf-streaks-css', [
      '.sk-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; }',
      '.sk-card { background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 10px; padding: 24px; text-align: center; opacity: 0; transform: translateY(16px); transition: opacity 0.5s ease, transform 0.5s ease; }',
      '.sk-card.sk-visible { opacity: 1; transform: translateY(0); }',
      '.sk-number { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 3rem; line-height: 1; margin-bottom: 4px; }',
      '.sk-unit { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.12em; color: var(--gray-500, #555); font-family: var(--font-body, Inter, sans-serif); margin-bottom: 10px; }',
      '.sk-label { font-family: var(--font-body, Inter, sans-serif); font-size: 0.85rem; color: var(--gray-300, #aaa); }'
    ].join('\n'));

    var streaks = [
      { value: 47,  unit: 'DAYS',     label: 'Adult Consistency Streak',      color: PATH_COLORS.adult },
      { value: 23,  unit: 'SESSIONS', label: 'Athlete Attendance Streak',     color: PATH_COLORS.athlete },
      { value: 12,  unit: 'WEEKS',    label: 'Family Progress Streak',        color: PATH_COLORS.integrated },
      { value: 1,   unit: 'CUE',      label: 'Coach Cue Streak of the Week', color: PATH_COLORS.athlete, text: '"Own the eccentric"' },
      { value: 34,  unit: 'DAYS',     label: 'Standard Held (Consecutive)',   color: '#ff5500' }
    ];

    var grid = el('div', 'sk-grid');

    streaks.forEach(function (s) {
      var card = el('div', 'sk-card');

      var num = el('div', 'sk-number');
      num.textContent = '0';
      num.style.color = s.color;
      num.setAttribute('data-target', s.value);
      card.appendChild(num);

      card.appendChild(el('div', 'sk-unit', s.unit));

      var label = el('div', 'sk-label', s.label);
      card.appendChild(label);

      if (s.text) {
        var extra = el('div', 'sk-label');
        extra.style.fontStyle = 'italic';
        extra.style.marginTop = '6px';
        extra.textContent = s.text;
        card.appendChild(extra);
      }

      grid.appendChild(card);
    });

    section.appendChild(grid);

    /* Count-up animation triggered by IntersectionObserver */
    function animateCount(numEl) {
      var target = parseInt(numEl.getAttribute('data-target'));
      var duration = 1400;
      var start = performance.now();

      (function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        numEl.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(tick);
      })(start);
    }

    onVisible(grid, function () {
      qsa('.sk-card', grid).forEach(function (card, i) {
        setTimeout(function () {
          card.classList.add('sk-visible');
          var numEl = qs('.sk-number', card);
          if (numEl) animateCount(numEl);
        }, i * 150);
      });
    });
  }


  /* ══════════════════════════════════════════════════════
     11. INSIDE THE ROOM ENHANCEMENT
     "Enter Session Mode" fullscreen overlay sequence
     ══════════════════════════════════════════════════════ */
  function initRoomEnhance() {
    var roomSection = qs('#room');
    if (!roomSection) return;

    injectStyles('ppf-room-enhance-css', [
      '.re-enter-btn { display: inline-block; padding: 14px 32px; background: transparent; border: 2px solid var(--orange, #ff5500); border-radius: 8px; color: var(--orange, #ff5500); font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.1rem; letter-spacing: 0.1em; cursor: pointer; transition: all 0.3s ease; margin-top: 20px; }',
      '.re-enter-btn:hover { background: var(--orange, #ff5500); color: var(--white, #fff); }',
      '.re-overlay { position: fixed; inset: 0; z-index: 10000; background: #000; display: flex; align-items: center; justify-content: center; flex-direction: column; opacity: 0; visibility: hidden; transition: opacity 0.6s ease, visibility 0.6s ease; }',
      '.re-overlay.re-active { opacity: 1; visibility: visible; }',
      '.re-close { position: absolute; top: 20px; right: 24px; background: none; border: none; color: var(--gray-500, #555); font-size: 1.8rem; cursor: pointer; z-index: 10; line-height: 1; }',
      '.re-step { position: absolute; opacity: 0; transition: opacity 0.8s ease; text-align: center; }',
      '.re-step.re-step-show { opacity: 1; }',
      '.re-step-text { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: clamp(1.8rem, 5vw, 3.5rem); letter-spacing: 0.12em; color: var(--white, #fff); }',
      '.re-countdown { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: clamp(4rem, 12vw, 8rem); color: var(--orange, #ff5500); }',
      '.re-session-active .re-step-text { color: var(--orange, #ff5500); }',
      '.re-pulse-border { animation: rePulse 1.5s ease-in-out infinite; }',
      '@keyframes rePulse { 0%,100%{ box-shadow: inset 0 0 0 3px rgba(255,85,0,0.3); } 50%{ box-shadow: inset 0 0 0 3px rgba(255,85,0,0.8); } }',
      '.re-cta-link { display: inline-block; margin-top: 24px; padding: 14px 36px; background: var(--orange, #ff5500); border-radius: 8px; color: var(--white, #fff); text-decoration: none; font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.1rem; letter-spacing: 0.08em; }'
    ].join('\n'));

    /* Add button to room section */
    var enterBtn = el('button', 're-enter-btn', 'ENTER SESSION MODE');
    roomSection.appendChild(enterBtn);

    /* Build overlay */
    var overlay = el('div', 're-overlay');
    var closeBtn = el('button', 're-close', '×');
    closeBtn.setAttribute('aria-label', 'Close session mode');
    overlay.appendChild(closeBtn);

    /* Steps */
    var steps = [
      { html: '<div class="re-step-text">ENTERING THE ROOM</div>', duration: 2000 },
      { html: '<div class="re-step-text">COACHES ARE ON THE FLOOR</div>', duration: 2000 },
      { html: '<div class="re-countdown">3</div>', duration: 1000 },
      { html: '<div class="re-countdown">2</div>', duration: 1000 },
      { html: '<div class="re-countdown">1</div>', duration: 1000 },
      { html: '<div class="re-step-text" style="color:#ff5500;">SESSION ACTIVE</div>', duration: 5000, pulse: true },
      { html: '<div class="re-step-text">SESSION COMPLETE</div><div style="margin-top:12px;font-family:Inter,sans-serif;font-size:1rem;color:#aaa;">The standard was held.</div><a class="re-cta-link" href="#passport">BOOK YOUR FIRST</a>', duration: 0 }
    ];

    var stepEls = [];
    steps.forEach(function (s) {
      var stepEl = el('div', 're-step');
      stepEl.innerHTML = s.html;
      overlay.appendChild(stepEl);
      stepEls.push(stepEl);
    });

    document.body.appendChild(overlay);

    var running = false;
    var timers = [];

    function clearTimers() {
      timers.forEach(clearTimeout);
      timers = [];
    }

    function runSequence() {
      if (running) return;
      running = true;
      overlay.classList.add('re-active');
      overlay.classList.remove('re-pulse-border');

      stepEls.forEach(function (s) { s.classList.remove('re-step-show'); });

      var delay = 400; // initial delay
      steps.forEach(function (step, i) {
        timers.push(setTimeout(function () {
          /* Hide previous */
          if (i > 0) stepEls[i - 1].classList.remove('re-step-show');
          stepEls[i].classList.add('re-step-show');

          if (step.pulse) overlay.classList.add('re-pulse-border');
          else overlay.classList.remove('re-pulse-border');
        }, delay));
        delay += step.duration;
      });
    }

    function closeOverlay() {
      clearTimers();
      running = false;
      overlay.classList.remove('re-active', 're-pulse-border');
      stepEls.forEach(function (s) { s.classList.remove('re-step-show'); });
    }

    enterBtn.addEventListener('click', runSequence);
    closeBtn.addEventListener('click', closeOverlay);
  }


  /* ══════════════════════════════════════════════════════
     12. PPF BENCHMARK BOARD
     3-column board with animated fill bars
     ══════════════════════════════════════════════════════ */
  function initBenchmarkBoard() {
    var section = qs('#benchmarkBoard');
    if (!section) return;

    injectStyles('ppf-benchmark-css', [
      '.bb-tabs { display: flex; gap: 8px; margin-bottom: 24px; flex-wrap: wrap; }',
      '.bb-tab { padding: 10px 20px; background: var(--bg-card, #1a1a1a); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 6px; color: var(--gray-300, #aaa); font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1rem; letter-spacing: 0.08em; cursor: pointer; transition: all 0.3s ease; }',
      '.bb-tab:hover { color: var(--white, #fff); }',
      '.bb-tab.bb-tab-active { color: var(--white, #fff); }',
      '.bb-columns { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; }',
      '@media (max-width: 768px) { .bb-columns { grid-template-columns: 1fr; } .bb-column.bb-col-hidden { display: none; } }',
      '.bb-column { background: var(--bg-surface, #0e0e0e); border: 1px solid var(--gray-700, #2a2a2a); border-radius: 12px; padding: 24px; }',
      '.bb-col-title { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 1.2rem; letter-spacing: 0.1em; margin-bottom: 20px; text-align: center; }',
      '.bb-metric { margin-bottom: 18px; }',
      '.bb-metric:last-child { margin-bottom: 0; }',
      '.bb-metric-header { display: flex; justify-content: space-between; margin-bottom: 6px; }',
      '.bb-metric-label { font-family: var(--font-body, Inter, sans-serif); font-size: 0.8rem; color: var(--gray-300, #aaa); }',
      '.bb-metric-target { font-family: var(--font-display, "Bebas Neue", sans-serif); font-size: 0.9rem; color: var(--white, #fff); }',
      '.bb-bar-track { height: 6px; background: var(--gray-700, #2a2a2a); border-radius: 3px; overflow: hidden; }',
      '.bb-bar-fill { height: 100%; width: 0; border-radius: 3px; transition: width 1s var(--ease-out-expo, ease); }',
      '.bb-bar-fill.bb-animate { width: var(--fill); }'
    ].join('\n'));

    var benchmarks = {
      athlete: {
        title: 'ATHLETE',
        color: PATH_COLORS.athlete,
        metrics: [
          { label: '10-Yard Dash',     target: '1.5s',            fill: 85 },
          { label: '40-Yard Dash',     target: '4.6s',            fill: 78 },
          { label: 'Vertical Jump',    target: '30"+',            fill: 72 },
          { label: 'Pro Agility',      target: '4.2s',            fill: 68 },
          { label: 'Bodyweight Bench', target: 'BW × Reps',      fill: 75 }
        ]
      },
      adult: {
        title: 'ADULT',
        color: PATH_COLORS.adult,
        metrics: [
          { label: 'Consistency',   target: '90%+',      fill: 91 },
          { label: 'Deadlift',     target: '2× BW',     fill: 65 },
          { label: 'Push-ups',     target: '50+',        fill: 58 },
          { label: 'Mobility Score', target: '8/10',     fill: 80 },
          { label: 'Body Comp Δ',  target: 'Improving',  fill: 70 }
        ]
      },
      integrated: {
        title: 'INTEGRATED',
        color: PATH_COLORS.integrated,
        metrics: [
          { label: 'Coordination Score',       target: '7/10',      fill: 70 },
          { label: 'Confidence Rating',        target: '5/5',       fill: 88 },
          { label: 'Independence Milestones',  target: '4/5',       fill: 80 },
          { label: 'Engagement %',             target: '95%+',      fill: 95 },
          { label: 'Session Streak',           target: '12+ wks',   fill: 75 }
        ]
      }
    };

    /* Mobile tabs (only visible on narrow screens) */
    var tabBar = el('div', 'bb-tabs');
    var pathKeys = ['athlete', 'adult', 'integrated'];
    pathKeys.forEach(function (key) {
      var btn = el('button', 'bb-tab', benchmarks[key].title);
      btn.setAttribute('data-bb', key);
      tabBar.appendChild(btn);
    });
    section.appendChild(tabBar);

    /* Columns */
    var columns = el('div', 'bb-columns');

    pathKeys.forEach(function (key) {
      var data = benchmarks[key];
      var col = el('div', 'bb-column');
      col.setAttribute('data-bb-col', key);

      var title = el('div', 'bb-col-title', data.title);
      title.style.color = data.color;
      col.appendChild(title);

      data.metrics.forEach(function (m) {
        var metric = el('div', 'bb-metric');

        var header = el('div', 'bb-metric-header');
        header.appendChild(el('span', 'bb-metric-label', m.label));
        header.appendChild(el('span', 'bb-metric-target', m.target));
        metric.appendChild(header);

        var track = el('div', 'bb-bar-track');
        var fill  = el('div', 'bb-bar-fill');
        fill.style.background = data.color;
        fill.style.setProperty('--fill', m.fill + '%');
        track.appendChild(fill);
        metric.appendChild(track);

        col.appendChild(metric);
      });

      columns.appendChild(col);
    });

    section.appendChild(columns);

    /* Mobile tab filtering */
    var activeTab = 'all';

    function filterColumns(key) {
      activeTab = key;
      qsa('.bb-tab', tabBar).forEach(function (t) {
        var isActive = t.getAttribute('data-bb') === key;
        t.classList.toggle('bb-tab-active', isActive);
        t.style.borderColor = isActive ? benchmarks[key].color : '';
        t.style.color = isActive ? benchmarks[key].color : '';
      });

      qsa('.bb-column', columns).forEach(function (col) {
        /* On mobile, hide non-selected columns */
        var colKey = col.getAttribute('data-bb-col');
        if (key === 'all') {
          col.classList.remove('bb-col-hidden');
        } else {
          col.classList.toggle('bb-col-hidden', colKey !== key);
        }
      });
    }

    tabBar.addEventListener('click', function (e) {
      var btn = e.target.closest('.bb-tab');
      if (!btn) return;
      filterColumns(btn.getAttribute('data-bb'));
    });

    /* Animate bars on scroll */
    onVisible(columns, function () {
      qsa('.bb-bar-fill', columns).forEach(function (fill, i) {
        setTimeout(function () { fill.classList.add('bb-animate'); }, i * 60);
      });
    });
  }


  /* ══════════════════════════════════════════════════════
     BOOTSTRAP — Initialise all features on DOM ready
     ══════════════════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    initStandardScore();
    initFilmRoom();
    initRoomFeed();
    initCarryoverMap();
    initCoachVoice();
    initRoadmap();
    initFamilyTrust();
    initReadiness();
    initLegacyWall();
    initStreaks();
    initRoomEnhance();
    initBenchmarkBoard();
  });

})();
