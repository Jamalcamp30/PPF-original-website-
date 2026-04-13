/* ============================================================
   PPF EXPLORE — Interactive Feature Controller
   Powers: availability, comparisons, calculator, decision guide,
   commute selector, and smooth scrolling
   ============================================================ */
(function () {
  'use strict';

  /* ── UTILITIES ───────────────────────────────────── */
  var qs = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var qsa = function (sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); };

  /* ═══════════════════════════════════════════════════
     1. LIVE AVAILABILITY BOARD
     ═══════════════════════════════════════════════════ */
  function initAvailability() {
    var cards = qsa('[data-path]');
    if (!cards.length) return;

    var months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    function getNextDayOfWeek(dayOfWeek, startDate) {
      var d = new Date(startDate);
      var diff = (dayOfWeek - d.getDay() + 7) % 7;
      if (diff === 0) diff = 7; // always pick the *next* occurrence
      d.setDate(d.getDate() + diff);
      return d;
    }

    function getNextAvailableDate(path) {
      var now = new Date();
      var candidates = [];

      if (path === 'athlete') {
        // Next Tuesday (2) or Thursday (4)
        candidates.push(getNextDayOfWeek(2, now));
        candidates.push(getNextDayOfWeek(4, now));
      } else if (path === 'adult') {
        // Next Monday (1) or Wednesday (3)
        candidates.push(getNextDayOfWeek(1, now));
        candidates.push(getNextDayOfWeek(3, now));
      } else if (path === 'integrated') {
        // Next Friday (5)
        candidates.push(getNextDayOfWeek(5, now));
      }

      // Return the soonest date
      candidates.sort(function (a, b) { return a - b; });
      return candidates[0];
    }

    function formatDate(d) {
      return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    }

    function daysBetween(a, b) {
      var ms = b.getTime() - a.getTime();
      return Math.ceil(ms / (1000 * 60 * 60 * 24));
    }

    cards.forEach(function (card) {
      var path = card.getAttribute('data-path');
      if (!path) return;

      var dateEl = qs('[data-avail-date]', card);
      var urgencyEl = qs('[data-avail-urgency]', card);
      if (!dateEl) return;

      var nextDate = getNextAvailableDate(path);
      if (nextDate) {
        dateEl.textContent = formatDate(nextDate);

        var daysAway = daysBetween(new Date(), nextDate);
        if (urgencyEl && daysAway <= 3) {
          urgencyEl.textContent = '⚠ Spots filling fast — ' + daysAway + ' day' + (daysAway === 1 ? '' : 's') + ' away';
        }
      }
    });
  }

  /* ═══════════════════════════════════════════════════
     2. OPENINGS STATUS (structured for future API)
     ═══════════════════════════════════════════════════ */
  function initOpenings() {
    // Status data is set via data-status attributes in HTML.
    // This function is a placeholder for future API integration.
    var rows = qsa('.ppf-ex-opening-row');
    if (!rows.length) return;
    // Future: fetch('/api/openings').then(data => updateRows(data))
  }

  /* ═══════════════════════════════════════════════════
     3. COMPARISON TABS
     ═══════════════════════════════════════════════════ */
  function initCompareTabs() {
    var tabs = qsa('.ppf-ex-compare-tab');
    var panels = qsa('.ppf-ex-compare-panel');
    if (!tabs.length || !panels.length) return;

    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var target = tab.getAttribute('data-compare');
        if (!target) return;

        // Update tabs
        tabs.forEach(function (t) { t.classList.remove('ppf-ex-compare-tab--active'); });
        tab.classList.add('ppf-ex-compare-tab--active');

        // Update panels
        panels.forEach(function (p) { p.classList.remove('ppf-ex-compare-panel--active'); });
        var activePanel = qs('[data-compare-panel="' + target + '"]');
        if (activePanel) activePanel.classList.add('ppf-ex-compare-panel--active');
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     4. PLAN VALUE CALCULATOR
     ═══════════════════════════════════════════════════ */
  function initCalculator() {
    var freqBtns = qsa('.ppf-ex-calc__freq-btn');
    var goalSelect = qs('#calcGoal');
    var resultEl = qs('#calcResult');
    if (!freqBtns.length || !goalSelect || !resultEl) return;

    var planEl = qs('#calcPlan');
    var perSessionEl = qs('#calcPerSession');
    var monthlyEl = qs('#calcMonthly');
    var sessionsEl = qs('#calcSessions');
    var noteEl = qs('#calcNote');
    var badgeEl = qs('#calcBadge');

    // Pricing data
    var pricing = {
      general: {
        2: { name: 'Adult Group 2x/week', monthly: 200, sessions: 8 },
        3: { name: 'Adult Group 3x/week', monthly: 250, sessions: 12 },
        5: { name: 'Adult Group 5x/week', monthly: 350, sessions: 20 }
      },
      athletic: {
        2: { name: 'Athlete Group 2x/week', monthly: 225, sessions: 8 },
        3: { name: 'Athlete Group 3x/week', monthly: 275, sessions: 12 },
        5: { name: 'Athlete Group 5x/week', monthly: 400, sessions: 20 }
      },
      recovery: {
        2: { name: '1-on-1 Private Training', monthly: 960, sessions: 8, perSession: 120 },
        3: { name: '1-on-1 Private Training', monthly: 1440, sessions: 12, perSession: 120 },
        5: { name: '1-on-1 Private + Nutrition', monthly: 2550, sessions: 20, perSession: 120, note: 'Includes $150/mo Nutrition Plan' }
      },
      family: {
        2: { name: 'Adult Group 2x/week', monthly: 200, sessions: 8, note: 'Contact us for family bundle pricing' },
        3: { name: 'Adult Group 3x/week', monthly: 250, sessions: 12, note: 'Contact us for family bundle pricing' },
        5: { name: 'Adult Group 5x/week', monthly: 350, sessions: 20, note: 'Contact us for family bundle pricing' }
      }
    };

    var currentFreq = 3;
    var currentGoal = 'general';

    function calculate() {
      var goal = currentGoal;
      var freq = currentFreq;
      var actualFreq = freq;
      var extraNote = '';

      // For 4x/week, suggest the 5x plan as better value
      if (freq === 4) {
        actualFreq = 5;
        extraNote = '4x/week isn\'t available — the 5x plan is better value per session.';
      }

      var goalPricing = pricing[goal];
      if (!goalPricing) return;

      var plan = goalPricing[actualFreq];
      if (!plan) return;

      var perSession = plan.perSession || Math.round(plan.monthly / plan.sessions);
      var isBestValue = (actualFreq === 5) || (actualFreq === 3 && goal !== 'recovery');

      if (planEl) planEl.textContent = plan.name;
      if (perSessionEl) perSessionEl.textContent = '$' + perSession;
      if (monthlyEl) monthlyEl.textContent = '$' + plan.monthly;
      if (sessionsEl) sessionsEl.textContent = plan.sessions;

      var finalNote = extraNote || plan.note || '';
      if (noteEl) noteEl.textContent = finalNote;

      if (badgeEl) {
        badgeEl.style.display = isBestValue ? 'inline-block' : 'none';
      }

      // Animate result
      resultEl.classList.remove('ppf-ex-calc__result--animate');
      void resultEl.offsetWidth; // force reflow
      resultEl.classList.add('ppf-ex-calc__result--animate');
    }

    // Frequency buttons
    freqBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        freqBtns.forEach(function (b) { b.classList.remove('ppf-ex-calc__freq-btn--active'); });
        btn.classList.add('ppf-ex-calc__freq-btn--active');
        currentFreq = parseInt(btn.getAttribute('data-freq'), 10);
        calculate();
      });
    });

    // Goal select
    goalSelect.addEventListener('change', function () {
      currentGoal = goalSelect.value;
      calculate();
    });

    // Initial calculation
    calculate();
  }

  /* ═══════════════════════════════════════════════════
     5. DECISION GUIDE
     ═══════════════════════════════════════════════════ */
  function initDecisionGuide() {
    var questions = qsa('.ppf-ex-decision__q');
    var resultPanel = qs('#decisionResult');
    var titleEl = qs('#decisionTitle');
    var descEl = qs('#decisionDesc');
    var iconEl = qs('#decisionIcon');
    var ctaEl = qs('#decisionCta');
    if (!questions.length || !resultPanel) return;

    var answers = {};

    questions.forEach(function (q) {
      var qName = q.getAttribute('data-question');
      var opts = qsa('.ppf-ex-decision__opt', q);

      opts.forEach(function (opt) {
        opt.addEventListener('click', function () {
          // Deactivate siblings
          opts.forEach(function (o) { o.classList.remove('ppf-ex-decision__opt--active'); });
          opt.classList.add('ppf-ex-decision__opt--active');

          answers[qName] = opt.getAttribute('data-answer');
          evaluateDecision();
        });
      });
    });

    function evaluateDecision() {
      // Need all 4 answered
      if (!answers.consistency || !answers.injuries || !answers.timeline || !answers.who) return;

      var title, desc, icon, href, ctaText, resultClass;

      // Remove old result classes
      resultPanel.classList.remove('ppf-ex-decision__result--ready', 'ppf-ex-decision__result--consult', 'ppf-ex-decision__result--explore');

      // Integrated path always gets family consultation
      if (answers.who === 'integrated') {
        title = 'Schedule a Family Consultation';
        desc = 'The Integrated Path starts with a one-on-one family consultation so Richard and Rebecca can understand your needs and build the right plan.';
        icon = '🤝';
        href = 'start.html';
        ctaText = 'Schedule Consultation →';
        resultClass = 'ppf-ex-decision__result--consult';
      }
      // Injuries or unsure → consult first
      else if (answers.injuries === 'yes' || answers.injuries === 'unsure') {
        title = 'Book a Consultation First';
        desc = 'With current injuries or limitations, a quick consultation ensures your program is safe and effective from day one. No cost, no commitment.';
        icon = '💬';
        href = 'contact.html';
        ctaText = 'Book a Consultation →';
        resultClass = 'ppf-ex-decision__result--consult';
      }
      // Just exploring
      else if (answers.timeline === 'exploring') {
        title = 'Start Exploring Paths';
        desc = 'No rush — browse the three PPF paths, read the proof, and come back when you\'re ready. We\'ll be here.';
        icon = '🔍';
        href = 'paths/';
        ctaText = 'Explore Paths →';
        resultClass = 'ppf-ex-decision__result--explore';
      }
      // Ready + consistent or ready now / soon
      else {
        title = 'Start with the Free 3-Day Experience';
        desc = 'You\'re ready. The 3-day experience gives you full access to coached training — zero cost, zero obligation. Just show up.';
        icon = '🚀';
        href = 'start.html';
        ctaText = 'Start Your 3-Day Pass →';
        resultClass = 'ppf-ex-decision__result--ready';
      }

      if (titleEl) titleEl.textContent = title;
      if (descEl) descEl.textContent = desc;
      if (iconEl) iconEl.textContent = icon;
      if (ctaEl) {
        ctaEl.textContent = ctaText;
        ctaEl.href = href;
        ctaEl.style.display = 'inline-block';
      }
      resultPanel.classList.add(resultClass);
    }
  }

  /* ═══════════════════════════════════════════════════
     6. COMMUTE SELECTOR
     ═══════════════════════════════════════════════════ */
  function initCommute() {
    var cityBtns = qsa('.ppf-ex-commute__city');
    var resultEl = qs('#commuteResult');
    if (!cityBtns.length || !resultEl) return;

    var commuteData = {
      cumming: {
        city: 'Cumming',
        driveTime: '5–10 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Light traffic', best: false },
          { time: 'Evening (6–8 PM)', note: 'Easy commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Cumming — you\'re practically neighbors.'
      },
      alpharetta: {
        city: 'Alpharetta',
        driveTime: '15–20 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Moderate traffic', best: false },
          { time: 'Evening (6–8 PM)', note: 'Standard commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Alpharetta — straight shot up GA-400.'
      },
      johnscreek: {
        city: 'Johns Creek',
        driveTime: '20–25 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Plan extra time', best: false },
          { time: 'Evening (6–8 PM)', note: 'Standard commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Johns Creek — many of our athletes make this drive.'
      },
      milton: {
        city: 'Milton',
        driveTime: '15–20 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Moderate traffic', best: false },
          { time: 'Evening (6–8 PM)', note: 'Easy commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Milton — quick route via Bethany Bend.'
      },
      roswell: {
        city: 'Roswell',
        driveTime: '20–25 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Plan extra time', best: false },
          { time: 'Evening (6–8 PM)', note: 'Standard commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Roswell — worth the drive for coached training.'
      },
      suwanee: {
        city: 'Suwanee',
        driveTime: '15–20 min',
        windows: [
          { time: 'Morning (5–7 AM)', note: 'Least traffic', best: true },
          { time: 'After school (3–5 PM)', note: 'Moderate traffic', best: false },
          { time: 'Evening (6–8 PM)', note: 'Standard commute', best: false }
        ],
        verdict: 'PPF is a realistic daily fit from Suwanee — easy access via Peachtree Industrial.'
      }
    };

    cityBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cityKey = btn.getAttribute('data-city');
        if (!cityKey || !commuteData[cityKey]) return;

        // Update active state
        cityBtns.forEach(function (b) { b.classList.remove('ppf-ex-commute__city--active'); });
        btn.classList.add('ppf-ex-commute__city--active');

        var data = commuteData[cityKey];

        // Build result HTML
        var html = '<div class="ppf-ex-commute__data">';
        html += '<div class="ppf-ex-commute__drive">';
        html += '<span class="ppf-ex-commute__drive-icon">🚗</span>';
        html += '<span class="ppf-ex-commute__drive-time">' + data.driveTime + '</span>';
        html += '<span class="ppf-ex-commute__drive-label">estimated drive from ' + data.city + '</span>';
        html += '</div>';

        html += '<div class="ppf-ex-commute__windows">';
        html += '<div class="ppf-ex-commute__windows-title">Best Training Windows</div>';
        data.windows.forEach(function (w) {
          html += '<div class="ppf-ex-commute__window-row">';
          html += '<span>' + w.time + '</span>';
          if (w.best) {
            html += '<span class="ppf-ex-commute__window-badge">' + w.note + '</span>';
          } else {
            html += '<span style="color:rgba(255,255,255,0.35);font-size:0.8rem;">' + w.note + '</span>';
          }
          html += '</div>';
        });
        html += '</div>';

        html += '<div class="ppf-ex-commute__verdict">✓ ' + data.verdict + '</div>';
        html += '</div>';

        resultEl.innerHTML = html;
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     7. SMOOTH SCROLL FOR ANCHOR LINKS
     ═══════════════════════════════════════════════════ */
  function initSmoothScroll() {
    var links = qsa('a[href^="#"], a[href*="explore.html#"]');
    if (!links.length) return;

    links.forEach(function (link) {
      link.addEventListener('click', function (e) {
        var href = link.getAttribute('href');
        var hash = href.indexOf('#') !== -1 ? href.substring(href.indexOf('#')) : '';
        if (!hash || hash === '#') return;

        var target = qs(hash);
        if (!target) return;

        e.preventDefault();
        var navHeight = 80;
        var top = target.getBoundingClientRect().top + window.pageYOffset - navHeight;
        window.scrollTo({ top: top, behavior: 'smooth' });

        // Update URL without scroll
        if (history.pushState) {
          history.pushState(null, '', hash);
        }
      });
    });
  }

  /* ═══════════════════════════════════════════════════
     INIT
     ═══════════════════════════════════════════════════ */
  function init() {
    initAvailability();
    initOpenings();
    initCompareTabs();
    initCalculator();
    initDecisionGuide();
    initCommute();
    initSmoothScroll();
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
