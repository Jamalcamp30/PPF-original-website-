/* =====================================================
   PPF ATHLETICS — PPF SYSTEMS
   12 Exclusive Features: Standard Score, Film Room,
   Room Feed, Carryover Map, Coach's Voice, Roadmap,
   Family Trust, Readiness, Legacy Wall, Streaks,
   Room Enhancement, Benchmark Board
   -------------------------------------------------
   Wires interactive behaviour into the existing HTML
   authored in index.html (styled by ppf-systems.css).
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
     Enhances passport quiz result with a 0-100 PPF score.
     Appends a new panel inside #passportResult (no
     duplicate — this element is created only by JS).
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

    /* Passport quiz stores schedule as a number (days per week: 2–5).
       Map to timeline categories used by the score calculator. */
    var scheduleToTimeline = { '2': '1month', '3': '1month', '4': '3months', '5': 'asap' };

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

    function buildPanel(raw) {
      /* Accept both the native passport keys (who/goal/level/schedule)
         and the legacy keys (path/goal/experience/timeline/priority). */
      var path       = raw.path || raw.who || 'adult';
      var goal       = raw.goal || 'strength';
      var experience = raw.experience || raw.level || 'beginner';
      var timeline   = raw.timeline || scheduleToTimeline[raw.schedule] || '1month';
      var priority   = raw.priority || goal;

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
        var duration = 1200;
        var start = performance.now();
        (function tick(now) {
          var elapsed = now - start;
          var progress = Math.min(elapsed / duration, 1);
          var eased = 1 - Math.pow(1 - progress, 3);
          num.textContent = Math.round(eased * total);
          if (progress < 1) {
            requestAnimationFrame(tick);
          } else {
            num.textContent = total;
          }
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
     Wires tab clicks to the existing .film-tab /
     .film-panel / .film-block markup in index.html.
     ══════════════════════════════════════════════════════ */
  function initFilmRoom() {
    var section = qs('#filmRoom');
    if (!section) return;

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

    var tabs  = qsa('.film-tab', section);
    var panel = qs('#filmPanel', section);
    if (!tabs.length || !panel) return;

    function showMovement(key) {
      var d = data[key];
      if (!d) return;

      /* Update active tab */
      tabs.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-film') === key);
      });

      /* Populate the four .film-block-text fields */
      qsa('.film-block-text', panel).forEach(function (txt) {
        var field = txt.getAttribute('data-field');
        if (field && d[field] !== undefined) {
          txt.textContent = d[field];
        }
      });
    }

    /* Tab click handler (delegate from parent) */
    section.addEventListener('click', function (e) {
      var btn = e.target.closest('.film-tab');
      if (!btn) return;
      showMovement(btn.getAttribute('data-film'));
    });

    /* Show first movement on load */
    showMovement('sprint-start');
  }


  /* ══════════════════════════════════════════════════════
     3. THE ROOM FEED
     Wires auto-cycling behaviour into the existing
     .feed-board / .feed-module / .feed-dot markup.
     ══════════════════════════════════════════════════════ */
  function initRoomFeed() {
    var section = qs('#roomFeed');
    if (!section) return;

    var modules     = qsa('.feed-module', section);
    var dots        = qsa('.feed-dot', section);
    var progressFill = qs('.feed-progress-fill', section);
    if (!modules.length) return;

    var idx = 0;
    var cycleTimer = null;

    function show(i) {
      idx = ((i % modules.length) + modules.length) % modules.length;

      modules.forEach(function (m, j) {
        m.classList.toggle('active', j === idx);
      });

      dots.forEach(function (d, j) {
        d.classList.toggle('active', j === idx);
      });

      /* Reset progress bar */
      if (progressFill) {
        progressFill.style.transition = 'none';
        progressFill.style.width = '0';
        progressFill.getBoundingClientRect(); /* force reflow */
        progressFill.style.transition = 'width 6s linear';
        progressFill.style.width = '100%';
      }
    }

    function startCycle() {
      clearInterval(cycleTimer);
      cycleTimer = setInterval(function () {
        show(idx + 1);
      }, 6000);
    }

    /* Dot click handler */
    section.addEventListener('click', function (e) {
      var dot = e.target.closest('.feed-dot');
      if (!dot) return;
      var clickIdx = dots.indexOf(dot);
      if (clickIdx < 0) return;
      show(clickIdx);
      startCycle();
    });

    show(0);
    startCycle();
  }


  /* ══════════════════════════════════════════════════════
     4. PPF CARRYOVER MAP
     Wires option clicks to the existing .cmap-option /
     .cmap-block markup. HTML uses data-result values
     (burst, route, posture, awareness, confidence,
     injury) so we key our data the same way.
     ══════════════════════════════════════════════════════ */
  function initCarryoverMap() {
    var section = qs('#carryoverMap');
    if (!section) return;

    var options = qsa('.cmap-option', section);
    var result  = qs('#cmapResult', section);
    if (!options.length || !result) return;

    var data = {
      burst: {
        trains: 'Acceleration mechanics, first-step replacement, posterior chain power, shin-angle control.',
        session: 'Sprint-start drills, sled pushes, single-leg RDLs, resisted acceleration runs, and film review of stride 1-3.',
        cues: '"Push the ground behind you." "Stay low — let the speed come." "Replace, don\'t retreat."',
        milestone: 'Consistent sub-1.6s 10-yard dash with controlled mechanics. No false steps on reactive starts.'
      },
      route: {
        trains: 'Hip mobility, lateral first-step speed, deceleration control, and reactive agility patterning.',
        session: 'Cone break drills, hip-turn acceleration, lateral bounds, film study of release technique, and agility ladder work.',
        cues: '"Snap the hip, don\'t round the turn." "Sell the stem before the break." "Low-to-fast, not fast-to-low."',
        milestone: 'Clean route breaks at full speed with zero wasted steps. Reactive drill scores improve 15%+ in 8 weeks.'
      },
      posture: {
        trains: 'Thoracic extension, scapular stability, deep core activation, and posterior chain endurance.',
        session: 'Dead hangs, band pull-aparts, goblet squats, wall slides, and farmer carries with coached breathing.',
        cues: '"Ribs over hips." "Shoulder blades in your back pockets." "Breathe through the brace."',
        milestone: 'Sustained upright posture through a full 60-minute session. Zero compensation patterns under fatigue.'
      },
      awareness: {
        trains: 'Proprioception, bilateral coordination, spatial orientation, and rhythmic movement patterning.',
        session: 'Balance beam walks, contralateral crawls, single-leg stance progressions, and mirror-guided movement drills.',
        cues: '"Feel where your feet are." "Slow is smooth, smooth is fast." "Match the rhythm before adding speed."',
        milestone: 'Independent warm-up execution. Confident transitions between movement stations without coaching prompt.'
      },
      confidence: {
        trains: 'Independence skills, social comfort in gym settings, self-directed movement, and parent-coach trust building.',
        session: 'Structured exploration stations, coached partner drills, achievement card milestones, and family debrief.',
        cues: '"You\'ve got this — show me what you remember." "Try first, then we\'ll adjust." "That was better than last week."',
        milestone: 'Family member completes 3 sessions without parent prompt. Confidence rating self-reported at 4+/5.'
      },
      injury: {
        trains: 'Eccentric control, landing mechanics, joint stability, movement screening, and corrective patterning.',
        session: 'Depth drops to stick, single-leg landings, ankle stability circuits, hip CARs, and deceleration drills.',
        cues: '"Land quiet — less noise means more control." "Knees track toes." "Absorb with your hips, not your knees."',
        milestone: 'Zero movement-screen red flags. Controlled single-leg landing with no knee valgus under fatigue.'
      }
    };

    function showResult(key) {
      var d = data[key];
      if (!d) return;

      options.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-result') === key);
      });

      /* Populate the four .cmap-block-text fields */
      var blocks = qsa('.cmap-block', result);
      blocks.forEach(function (block) {
        var txt = qs('.cmap-block-text', block);
        if (!txt) return;
        var field = txt.getAttribute('data-field');
        if (field && d[field] !== undefined) {
          txt.textContent = d[field];
        }
        block.classList.add('visible');
      });
    }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('.cmap-option');
      if (!btn) return;
      showResult(btn.getAttribute('data-result'));
    });
  }


  /* ══════════════════════════════════════════════════════
     5. COACH'S VOICE ARCHIVE
     Wires auto-rotating cues into the existing
     .voice-player / #voiceCueText / #voiceNextBtn markup.
     ══════════════════════════════════════════════════════ */
  function initCoachVoice() {
    var section  = qs('#coachVoice');
    if (!section) return;

    var cueTextEl = qs('#voiceCueText', section);
    var badgeEl   = qs('#voicePathBadge', section);
    var nextBtn   = qs('#voiceNextBtn', section);
    if (!cueTextEl) return;

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

    function showCue(i) {
      idx = ((i % cues.length) + cues.length) % cues.length;
      var c = cues[idx];
      cueTextEl.textContent = c.text;
      if (badgeEl) {
        badgeEl.textContent = c.path.toUpperCase() + ' PATH';
      }
    }

    function startAuto() {
      clearInterval(timer);
      timer = setInterval(function () { showCue(idx + 1); }, 8000);
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        showCue(idx + 1);
        startAuto();
      });
    }

    showCue(0);
    startAuto();
  }


  /* ══════════════════════════════════════════════════════
     6. 90-DAY VISUAL ROADMAP BUILDER
     Wires path-button clicks to the existing
     .roadmap-path-btn / .roadmap-phase markup and fills
     the .roadmap-phase-desc elements with path-specific
     descriptions.
     ══════════════════════════════════════════════════════ */
  function initRoadmap() {
    var section = qs('#roadmapBuilder');
    if (!section) return;

    var pathBtns  = qsa('.roadmap-path-btn', section);
    var timeline  = qs('#roadmapTimeline', section);
    var phases    = qsa('.roadmap-phase', section);
    var connector = qs('.roadmap-connector-fill', section);
    if (!pathBtns.length || !phases.length) return;

    var descriptions = {
      athlete: {
        phase1: 'Full movement screen, 10-yard and 40-yard times, vertical jump, pro agility. Coaches identify your weak link and set 90-day targets.',
        phase2: 'Sprint mechanics drills, posterior chain activation, hip hinge patterning. 3–4 sessions per week with film review every Friday.',
        phase3: 'Speed increases, resisted sprints, plyometric progressions, sport-specific agility. Testing at week 6 to validate trajectory.',
        phase4: 'Full retest against baseline. Compare 10-yard, 40-yard, vertical, agility. Set next 90-day cycle. Coach debrief and program update.'
      },
      adult: {
        phase1: 'Movement screen, strength baselines (deadlift, squat, press), mobility assessment, body composition snapshot. Coach sets 90-day plan.',
        phase2: 'Master the 6 foundational patterns. Build consistency at 3× per week. Mobility work every session. Nutrition awareness check-in.',
        phase3: 'Progressive overload on compound lifts. Conditioning added. Mid-point body comp check. Consistency target: 90%+ attendance.',
        phase4: 'Full retest: deadlift, squat, press, mobility score, body composition. Celebrate wins, identify next focus. Program recalibrated.'
      },
      integrated: {
        phase1: 'Meet your coach, tour the room. Assess coordination, balance, confidence level, and independence skills. Family debrief included.',
        phase2: 'Learn 3 safe movement patterns. Build routine and comfort. 2 sessions per week with full coaching support. Progress card started.',
        phase3: 'Add complexity and independence. Warm-up self-directed. Coordination drills scored. Social integration with group activities.',
        phase4: 'Independence milestone review. Confidence self-report. Coordination retest. Family meeting to discuss next phase and long-term goals.'
      }
    };

    function showPath(path) {
      var descs = descriptions[path];
      if (!descs) return;

      pathBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-path') === path);
      });

      /* Fill phase descriptions */
      phases.forEach(function (phase) {
        var descEl = qs('.roadmap-phase-desc', phase);
        if (!descEl) return;
        var key = descEl.getAttribute('data-content'); // e.g. "phase1"
        if (key && descs[key]) {
          descEl.textContent = descs[key];
        }
        phase.classList.add('visible');
      });

      /* Animate connector fill */
      if (connector) {
        connector.style.height = '100%';
      }
    }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('.roadmap-path-btn');
      if (!btn) return;
      showPath(btn.getAttribute('data-path'));
    });

    /* Show athlete path on scroll */
    if (timeline) {
      onVisible(timeline, function () { showPath('athlete'); });
    }
  }


  /* ══════════════════════════════════════════════════════
     7. FAMILY TRUST DASHBOARD
     Wires accordion behaviour into the existing
     .ftd-card / .ftd-card-header markup.
     ══════════════════════════════════════════════════════ */
  function initFamilyTrust() {
    var section = qs('#familyDashboard');
    if (!section) return;

    var cards = qsa('.ftd-card', section);
    if (!cards.length) return;

    /* Accordion click handler */
    section.addEventListener('click', function (e) {
      var header = e.target.closest('.ftd-card-header');
      if (!header) return;
      var card = header.closest('.ftd-card');
      if (!card) return;
      var wasOpen = card.classList.contains('open');

      /* Close all */
      cards.forEach(function (c) {
        c.classList.remove('open');
        var h = qs('.ftd-card-header', c);
        if (h) h.setAttribute('aria-expanded', 'false');
      });

      /* Toggle clicked */
      if (!wasOpen) {
        card.classList.add('open');
        header.setAttribute('aria-expanded', 'true');
      }
    });
  }


  /* ══════════════════════════════════════════════════════
     8. PPF READINESS CHECK-IN
     Wires the existing #readinessModal markup —
     slider inputs, select, submit, and result display.
     ══════════════════════════════════════════════════════ */
  function initReadiness() {
    var btn       = qs('#readinessBtn');
    var modal     = qs('#readinessModal');
    if (!btn || !modal) return;

    var submitBtn  = qs('#readinessSubmit', modal);
    var closeBtn   = qs('.readiness-close', modal);
    var questions  = qs('#readinessQuestions', modal);
    var resultDiv  = qs('#readinessResult', modal);
    var resultText = qs('#readinessResultText', modal);
    var resultCTA  = qs('#readinessResultCTA', modal);

    /* Gather slider / select references */
    var sliders = {};
    qsa('.readiness-slider', modal).forEach(function (s) {
      sliders[s.getAttribute('data-q')] = s;
    });
    var obstacleSelect = qs('.readiness-select', modal);

    /* Open / Close */
    function openModal() {
      modal.classList.add('active');
      modal.setAttribute('aria-hidden', 'false');
    }
    function closeModal() {
      modal.classList.remove('active');
      modal.setAttribute('aria-hidden', 'true');
    }

    btn.addEventListener('click', function () {
      /* Reset to form view on re-open */
      if (questions) questions.style.display = '';
      if (submitBtn) submitBtn.style.display = '';
      if (resultDiv) resultDiv.style.display = 'none';
      openModal();
    });

    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    /* Submit logic */
    if (submitBtn) {
      submitBtn.addEventListener('click', function () {
        var energy      = parseInt((sliders.energy      || {}).value || 3);
        var confidence  = parseInt((sliders.confidence  || {}).value || 3);
        var soreness    = parseInt((sliders.soreness    || {}).value || 3);
        var consistency = parseInt((sliders.consistency || {}).value || 3);
        var obstacle    = obstacleSelect ? obstacleSelect.value : '';

        var score = energy + confidence + (6 - soreness) + consistency; // 4-20 range

        var title, text, cta;
        if (score >= 16) {
          title = 'YOU\'RE READY TO PUSH';
          text  = 'Your readiness is high. Book a performance session and bring intensity. This is a green-light day.';
          cta   = 'Book a Session';
        } else if (score >= 11) {
          title = 'SOLID FOUNDATION DAY';
          text  = 'You\'re in a good spot for a structured session. Focus on quality movement and building consistency. Show up and hold the standard.';
          cta   = 'View the Schedule';
        } else if (score >= 7) {
          title = 'RECOVERY + MOVEMENT';
          text  = 'Today is a yellow-light day. A mobility session or light movement would serve you better than max effort. Protect the streak.';
          cta   = 'Learn About Recovery';
        } else {
          title = 'REST IS PART OF THE STANDARD';
          text  = 'Your body is telling you to recover. Hydrate, sleep, and come back stronger. The room will be here when you\'re ready.';
          cta   = 'Talk to a Coach';
        }

        if (obstacle === 'knowledge') {
          text += ' Start with a free assessment — we\'ll build the plan for you.';
          cta = 'Book Free Assessment';
        }

        /* Show result, hide form */
        if (questions) questions.style.display = 'none';
        submitBtn.style.display = 'none';
        if (resultDiv)  resultDiv.style.display = 'block';
        if (resultText) resultText.textContent = text;
        if (resultCTA)  resultCTA.textContent = cta;

        /* Prepend title into result area */
        var existingLabel = qs('.readiness-result-label', resultDiv);
        if (existingLabel) existingLabel.textContent = title;
      });
    }

    /* Close modal when CTA is clicked */
    if (resultCTA) {
      resultCTA.addEventListener('click', closeModal);
    }
  }


  /* ══════════════════════════════════════════════════════
     9. THE PPF LEGACY WALL
     Wires filter clicks and scroll-reveal into the
     existing .legacy-filter-btn / .legacy-card markup.
     ══════════════════════════════════════════════════════ */
  function initLegacyWall() {
    var section = qs('#legacyWall');
    if (!section) return;

    var filterBtns = qsa('.legacy-filter-btn', section);
    var cards      = qsa('.legacy-card', section);
    var grid       = qs('.legacy-grid', section);
    if (!filterBtns.length || !cards.length) return;

    function filterCards(filter) {
      filterBtns.forEach(function (b) {
        b.classList.toggle('active', b.getAttribute('data-filter') === filter);
      });

      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-path') === filter;
        card.classList.toggle('hidden', !match);
        if (match) card.classList.add('visible');
      });
    }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('.legacy-filter-btn');
      if (!btn) return;
      filterCards(btn.getAttribute('data-filter'));
    });

    /* Scroll-triggered reveal */
    if (grid) {
      onVisible(grid, function () {
        cards.forEach(function (card, i) {
          setTimeout(function () { card.classList.add('visible'); }, i * 80);
        });
      });
    }
  }


  /* ══════════════════════════════════════════════════════
     10. STANDARD STREAKS
     Wires count-up animation into the existing
     .streak-counter[data-target] elements.
     ══════════════════════════════════════════════════════ */
  function initStreaks() {
    var section = qs('#standardStreaks');
    if (!section) return;

    var grid     = qs('.streaks-grid', section);
    var counters = qsa('.streak-counter', section);
    if (!counters.length) return;

    function animateCount(el) {
      var target = parseInt(el.getAttribute('data-target')) || 0;
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1400;
      var start = performance.now();

      (function tick(now) {
        var elapsed = now - start;
        var progress = Math.min(elapsed / duration, 1);
        var eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(eased * target) + suffix;
        if (progress < 1) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = target + suffix;
        }
      })(start);
    }

    onVisible(grid || section, function () {
      counters.forEach(function (c, i) {
        setTimeout(function () { animateCount(c); }, i * 150);
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
     Wires tab filtering and bar animations into the
     existing .bench-tab / .bench-column markup.
     ══════════════════════════════════════════════════════ */
  function initBenchmarkBoard() {
    var section = qs('#benchmarkBoard');
    if (!section) return;

    var tabs    = qsa('.bench-tab', section);
    var board   = qs('.bench-board', section);
    var columns = qsa('.bench-column', section);
    if (!tabs.length || !columns.length) return;

    function filterColumns(key) {
      tabs.forEach(function (t) {
        t.classList.toggle('active', t.getAttribute('data-bench') === key);
      });

      columns.forEach(function (col) {
        var colKey = col.getAttribute('data-bench-col');
        col.classList.toggle('active', colKey === key);
      });
    }

    section.addEventListener('click', function (e) {
      var btn = e.target.closest('.bench-tab');
      if (!btn) return;
      filterColumns(btn.getAttribute('data-bench'));
    });

    /* Animate bar fills on scroll */
    if (board) {
      onVisible(board, function () {
        qsa('.bench-metric-fill', board).forEach(function (fill, i) {
          setTimeout(function () {
            var parent = fill.closest('.bench-metric');
            if (parent) parent.classList.add('filled');
          }, i * 60);
        });
      });
    }
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
