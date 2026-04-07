/* =====================================================
   PPF ATHLETICS — MEMBER IDENTITY LAYER
   Auth, Dashboard, Onboarding, Guest Mode
   ===================================================== */

var PPFMember = (function () {
  'use strict';

  /* ── CONFIGURATION ───────────────────────────────── */
  // Replace these with your real Supabase project credentials
  var SUPABASE_URL  = 'https://YOUR_PROJECT.supabase.co';
  var SUPABASE_ANON = 'YOUR_ANON_KEY';

  /* ── HELPERS ─────────────────────────────────────── */
  function qs(sel, ctx)  { return (ctx || document).querySelector(sel); }
  function qsa(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function getTimeOfDay() {
    var h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  }

  function getGreeting(name) {
    var tod = getTimeOfDay();
    var prefix = tod === 'morning' ? 'Good morning' :
                 tod === 'afternoon' ? 'Good afternoon' :
                 'Good evening';
    return name ? prefix + ', ' + name : prefix;
  }

  function getTimeMessage() {
    var tod = getTimeOfDay();
    if (tod === 'morning')   return 'Your training day starts now.';
    if (tod === 'afternoon') return 'Your training week is live.';
    return 'Recovery, nutrition, and tomorrow\'s work are ready.';
  }

  /* ── COACHING COMMANDS ───────────────────────────── */
  var coachCommands = [
    'Stay violent through the floor.',
    'Move clean before you move heavy.',
    'Speed holds when mechanics hold.',
    'Own today\'s rep standard.',
    'Attack the details.',
    'Fuel the standard.',
    'Consistency builds the profile.',
    'Lock in. The standard is live.',
    'Move with intent today.',
    'Every rep is a chance to prove it.',
    'The work is the proof.',
    'Control what you can. Execute the rest.'
  ];

  function randomCommand() {
    return coachCommands[Math.floor(Math.random() * coachCommands.length)];
  }

  /* ── LOCAL STORAGE PROFILE ───────────────────────── */
  var PROFILE_KEY = 'ppf_member_profile';

  function getProfile() {
    try {
      var data = localStorage.getItem(PROFILE_KEY);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      return null;
    }
  }

  function saveProfile(profile) {
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
    } catch (e) { /* storage unavailable */ }
  }

  function isGuest() {
    var p = getProfile();
    return !p || p.isGuest === true;
  }


  /* ══════════════════════════════════════════════════════
     ENTRY PAGE — "ENTER THE PPF SYSTEM"
     ══════════════════════════════════════════════════════ */

  function initEntry() {
    // Boot animation
    var boot = qs('#ppfBoot');
    var wrapper = qs('#entryWrapper');

    if (boot && wrapper) {
      setTimeout(function () {
        boot.classList.add('done');
        wrapper.classList.add('visible');
      }, 2800);
    }

    // Time-of-day greeting
    var greetEl = qs('#entryGreeting');
    if (greetEl) {
      var tod = getTimeOfDay();
      if (tod === 'morning')   greetEl.textContent = 'Good Morning. Welcome to PPF.';
      else if (tod === 'afternoon') greetEl.textContent = 'Good Afternoon. Welcome to PPF.';
      else greetEl.textContent = 'Good Evening. Welcome to PPF.';
    }

    // Rotating coach line
    var coachLine = qs('#entryCoachLine');
    if (coachLine) {
      coachLine.textContent = randomCommand();
      setInterval(function () {
        coachLine.style.opacity = '0';
        setTimeout(function () {
          coachLine.textContent = randomCommand();
          coachLine.style.opacity = '1';
        }, 400);
      }, 6000);
    }

    // Email form toggle
    var emailForm = qs('#emailForm');
    var emailInput = qs('#emailInput');
    var pwField = qs('#passwordField');
    var magicLink = qs('#btnMagicLink');

    if (emailForm) {
      emailForm.addEventListener('submit', function (e) {
        e.preventDefault();
        if (pwField && pwField.style.display === 'none') {
          pwField.style.display = 'block';
          if (magicLink) magicLink.style.display = 'block';
        } else {
          // Would trigger Supabase email/password sign-in
          handleEmailLogin();
        }
      });
    }

    // Magic link button
    if (magicLink) {
      magicLink.addEventListener('click', function () {
        handleMagicLink();
      });
    }

    // OAuth buttons
    bindAuthButton('#btnGoogle', 'google');
    bindAuthButton('#btnApple', 'apple');
    bindAuthButton('#btnMicrosoft', 'azure');

    // Guest button
    var guestBtn = qs('#btnGuest');
    if (guestBtn) {
      guestBtn.addEventListener('click', function () {
        handleGuestLogin();
      });
    }

    // If already logged in, redirect to dashboard
    var profile = getProfile();
    if (profile && profile.firstName) {
      window.location.href = 'dashboard.html';
    }
  }

  function bindAuthButton(selector, provider) {
    var btn = qs(selector);
    if (btn) {
      btn.addEventListener('click', function () {
        handleOAuthLogin(provider);
      });
    }
  }

  /* ── Auth Handlers ─── */

  function handleOAuthLogin(provider) {
    // In production, this would call:
    // supabase.auth.signInWithOAuth({ provider: provider })
    // For now, simulate with demo profile
    var demoProfile = {
      firstName: 'Jamal',
      email: 'jamal@ppfathletics.com',
      provider: provider,
      isGuest: false,
      joinDate: new Date().toISOString(),
      onboarded: false
    };
    saveProfile(demoProfile);
    window.location.href = 'onboarding.html';
  }

  function handleEmailLogin() {
    var email = qs('#emailInput');
    var pw = qs('#passwordInput');
    if (!email || !email.value) return;

    // In production: supabase.auth.signInWithPassword({ email, password })
    var name = email.value.split('@')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    var demoProfile = {
      firstName: name,
      email: email.value,
      provider: 'email',
      isGuest: false,
      joinDate: new Date().toISOString(),
      onboarded: false
    };
    saveProfile(demoProfile);
    window.location.href = 'onboarding.html';
  }

  function handleMagicLink() {
    var email = qs('#emailInput');
    if (!email || !email.value) return;

    // In production: supabase.auth.signInWithOtp({ email })
    alert('Magic link sent to ' + email.value + '! (Demo mode — redirecting to onboarding)');
    var name = email.value.split('@')[0];
    name = name.charAt(0).toUpperCase() + name.slice(1);
    var demoProfile = {
      firstName: name,
      email: email.value,
      provider: 'magic_link',
      isGuest: false,
      joinDate: new Date().toISOString(),
      onboarded: false
    };
    saveProfile(demoProfile);
    window.location.href = 'onboarding.html';
  }

  function handleGuestLogin() {
    // In production: supabase.auth.signInAnonymously()
    var guestProfile = {
      firstName: '',
      email: '',
      provider: 'guest',
      isGuest: true,
      joinDate: new Date().toISOString(),
      onboarded: true
    };
    saveProfile(guestProfile);
    window.location.href = 'dashboard.html';
  }


  /* ══════════════════════════════════════════════════════
     DASHBOARD — MEMBER HOME BASE
     ══════════════════════════════════════════════════════ */

  function initDashboard() {
    var profile = getProfile();

    // If no profile at all, redirect to login
    if (!profile) {
      window.location.href = 'index.html';
      return;
    }

    // If not yet onboarded (and not guest), redirect to onboarding
    if (!profile.onboarded && !profile.isGuest) {
      window.location.href = 'onboarding.html';
      return;
    }

    var firstName = profile.firstName || '';
    var isGuestMode = profile.isGuest;

    // ── Arrival Mode ──
    initArrivalMode(firstName, isGuestMode);

    // ── Guest Banner ──
    var guestBanner = qs('#guestBanner');
    if (guestBanner && isGuestMode) {
      guestBanner.style.display = 'block';
    }
    var guestClaimBtn = qs('#guestClaimBtn');
    if (guestClaimBtn) {
      guestClaimBtn.addEventListener('click', function () {
        window.location.href = 'index.html';
      });
    }

    // ── Welcome Header ──
    var welcomeGreeting = qs('#welcomeGreeting');
    var welcomeName = qs('#welcomeName');
    var welcomeStatus = qs('#welcomeStatus');

    if (welcomeGreeting) {
      welcomeGreeting.textContent = getGreeting(firstName);
    }
    if (welcomeName) {
      welcomeName.textContent = isGuestMode
        ? 'Welcome to PPF. Explore the standard.'
        : 'Welcome back to PPF Athletics';
    }
    if (welcomeStatus) {
      welcomeStatus.textContent = isGuestMode
        ? 'Create your profile to unlock full tracking.'
        : getTimeMessage();
    }

    // ── User Menu ──
    initUserMenu(profile);

    // ── Coach Command ──
    var ccText = qs('#coachCommandText');
    if (ccText) {
      ccText.textContent = randomCommand();
    }

    // ── Progress Ring ──
    initProgressRing(isGuestMode);

    // ── Standard Meter ──
    initStandardMeter(isGuestMode);

    // ── Readiness Check-In ──
    initReadiness();

    // ── Leaderboard Tabs ──
    initLeaderboardTabs();

    // ── Tile Hover Effects ──
    initTileEffects();

    // ── Daily Streak ──
    initDailyStreak();

    // ── Daily Challenges ──
    initDailyChallenges();

    // ── Win Recap ──
    updateWinRecap();

    // ── Quick Stats ──
    if (!isGuestMode) {
      animateQuickStats();
    }
  }

  /* ── Arrival Mode ─── */
  function initArrivalMode(firstName, isGuestMode) {
    var overlay = qs('#arrivalOverlay');
    if (!overlay) return;

    var nameEl = qs('#arrivalName');
    var greetEl = qs('#arrivalGreeting');
    var cmdEl = qs('#arrivalCommand');
    var metricEl = qs('#arrivalMetric');

    if (nameEl) {
      nameEl.textContent = isGuestMode ? 'WELCOME' : (firstName || 'MEMBER').toUpperCase();
    }
    if (greetEl) {
      greetEl.textContent = isGuestMode
        ? 'Welcome to PPF. Explore the standard.'
        : getGreeting(firstName) + '. Welcome back to PPF Athletics.';
    }
    if (cmdEl) {
      cmdEl.textContent = randomCommand();
    }
    if (metricEl) {
      metricEl.textContent = isGuestMode
        ? 'Guest Mode Active'
        : 'Next session in 3 hours';
    }

    // Dismiss after delay
    setTimeout(function () {
      overlay.classList.add('done');
    }, 3500);
  }

  /* ── User Menu ─── */
  function initUserMenu(profile) {
    var menuBtn = qs('#userMenuBtn');
    var dropdown = qs('#userDropdown');
    var initial = qs('#userInitial');
    var dName = qs('#dropdownName');
    var dEmail = qs('#dropdownEmail');
    var logoutBtn = qs('#btnLogout');

    if (initial && profile.firstName) {
      initial.textContent = profile.firstName.charAt(0).toUpperCase();
    }
    if (dName) {
      dName.textContent = profile.firstName || 'Guest';
    }
    if (dEmail) {
      dEmail.textContent = profile.email || '';
    }

    if (menuBtn && dropdown) {
      menuBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', function () {
        dropdown.style.display = 'none';
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        // In production: supabase.auth.signOut()
        localStorage.removeItem(PROFILE_KEY);
        window.location.href = 'index.html';
      });
    }
  }

  /* ── Progress Ring ─── */
  function initProgressRing(isGuestMode) {
    var trainingPct = isGuestMode ? 0.35 : 0.78;
    var nutritionPct = isGuestMode ? 0.2 : 0.65;
    var recoveryPct = isGuestMode ? 0.15 : 0.72;

    setTimeout(function () {
      setRingProgress('#ringTraining', 85, trainingPct);
      setRingProgress('#ringNutrition', 68, nutritionPct);
      setRingProgress('#ringRecovery', 51, recoveryPct);

      var overallPct = Math.round(((trainingPct + nutritionPct + recoveryPct) / 3) * 100);
      var pctEl = qs('#ringOverallPct');
      if (pctEl) {
        animateNumber(pctEl, 0, overallPct, '%');
      }
    }, 500);
  }

  function setRingProgress(selector, radius, pct) {
    var el = qs(selector);
    if (!el) return;
    var circumference = 2 * Math.PI * radius;
    el.style.strokeDasharray = circumference;
    el.style.strokeDashoffset = circumference * (1 - pct);
  }

  /* ── Standard Meter ─── */
  function initStandardMeter(isGuestMode) {
    var pct = isGuestMode ? 25 : 82;
    var fill = qs('#stdMeterFill');
    var label = qs('#stdMeterLabel');
    var momentum = qs('#momentumValue');

    setTimeout(function () {
      if (fill) fill.style.height = pct + '%';
      if (label) label.textContent = pct + '%';

      var momentumScore = isGuestMode ? '—' : Math.round(pct * 1.1);
      if (momentum) {
        if (isGuestMode) {
          momentum.textContent = '—';
        } else {
          animateNumber(momentum, 0, momentumScore, '');
        }
      }
    }, 800);
  }

  /* ── Readiness Check-In ─── */
  function initReadiness() {
    var sliders = qsa('.readiness-slider');
    sliders.forEach(function (slider) {
      var valEl = qs('#val' + slider.id.replace('slider', ''));
      if (valEl) {
        slider.addEventListener('input', function () {
          valEl.textContent = slider.value;
        });
      }
    });

    var btn = qs('#btnReadiness');
    var responseEl = qs('#readinessResponse');
    var responseText = qs('#readinessText');

    if (btn) {
      btn.addEventListener('click', function () {
        var sleep = parseInt(qs('#sliderSleep').value, 10) || 5;
        var soreness = parseInt(qs('#sliderSoreness').value, 10) || 5;
        var energy = parseInt(qs('#sliderEnergy').value, 10) || 5;
        var hydration = parseInt(qs('#sliderHydration').value, 10) || 5;
        var focus = parseInt(qs('#sliderFocus').value, 10) || 5;

        var avg = (sleep + (10 - soreness) + energy + hydration + focus) / 5;
        var message;

        if (avg >= 8) {
          message = 'You\'re primed today. Go attack your session.';
        } else if (avg >= 6) {
          message = 'Good readiness. Lock in and execute.';
        } else if (avg >= 4) {
          message = 'Recovery needs to lead today. Move with intent.';
        } else {
          message = 'Hydrate and rest up. The standard resets tomorrow.';
        }

        if (responseEl) responseEl.style.display = 'flex';
        if (responseText) responseText.textContent = message;
        btn.textContent = 'Logged ✓';
        btn.disabled = true;
        btn.style.opacity = '0.6';
      });
    }
  }

  /* ── Leaderboard Tabs ─── */
  function initLeaderboardTabs() {
    var tabs = qsa('.lb-tab');
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        tabs.forEach(function (t) { t.classList.remove('active'); });
        tab.classList.add('active');
        // In production, this would fetch board data from Supabase
      });
    });
  }

  /* ── Tile Effects ─── */
  function initTileEffects() {
    var tiles = qsa('.dash-tile');
    tiles.forEach(function (tile) {
      tile.addEventListener('mouseenter', function () {
        tile.style.borderColor = 'var(--orange)';
      });
      tile.addEventListener('mouseleave', function () {
        tile.style.borderColor = '';
      });
    });
  }

  /* ── Animate Quick Stats ─── */
  function animateQuickStats() {
    setTimeout(function () {
      var sessions = qs('#qstatSessions');
      var streak = qs('#qstatStreak');
      var prs = qs('#qstatPRs');
      if (sessions) animateNumber(sessions, 0, 3, '');
      if (streak) animateNumber(streak, 0, 12, '');
      if (prs) animateNumber(prs, 0, 2, '');
    }, 1000);
  }

  /* ── Number Animation ─── */
  function animateNumber(el, from, to, suffix) {
    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var elapsed = now - start;
      var progress = Math.min(elapsed / duration, 1);
      // Ease out
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = Math.round(from + (to - from) * eased);
      el.textContent = current + (suffix || '');
      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }
    requestAnimationFrame(tick);
  }


  /* ══════════════════════════════════════════════════════
     ONBOARDING — PREMIUM PROFILE SETUP
     ══════════════════════════════════════════════════════ */

  function initOnboarding() {
    var profile = getProfile();

    // If already onboarded, go to dashboard
    if (profile && profile.onboarded) {
      window.location.href = 'dashboard.html';
      return;
    }

    // If no profile, go to login
    if (!profile) {
      window.location.href = 'index.html';
      return;
    }

    var currentStep = 1;
    var totalSteps = 4;

    var progressFill = qs('#onboardProgressFill');
    var stepDots = qsa('.step-dot');

    function goToStep(n) {
      currentStep = n;

      // Hide all steps
      qsa('.onboard-step').forEach(function (s) {
        s.classList.remove('active');
        s.style.display = 'none';
      });

      // Show target step
      var target = qs('#step' + n);
      if (target) {
        target.style.display = 'block';
        // Force reflow before adding active class for animation
        void target.offsetWidth;
        target.classList.add('active');
      }

      // Update progress bar
      if (progressFill) {
        progressFill.style.width = (n / totalSteps * 100) + '%';
      }

      // Update dots
      stepDots.forEach(function (dot, i) {
        dot.classList.remove('active', 'done');
        if (i + 1 < n) dot.classList.add('done');
        if (i + 1 === n) dot.classList.add('active');
      });
    }

    // Step navigation
    var next1 = qs('#next1');
    var next2 = qs('#next2');
    var next3 = qs('#next3');
    var back2 = qs('#back2');
    var back3 = qs('#back3');
    var back4 = qs('#back4');
    var finish = qs('#finishOnboard');

    if (next1) next1.addEventListener('click', function () { goToStep(2); });
    if (next2) next2.addEventListener('click', function () { goToStep(3); });
    if (next3) next3.addEventListener('click', function () { goToStep(4); });
    if (back2) back2.addEventListener('click', function () { goToStep(1); });
    if (back3) back3.addEventListener('click', function () { goToStep(2); });
    if (back4) back4.addEventListener('click', function () { goToStep(3); });

    if (finish) {
      finish.addEventListener('click', function () {
        completeOnboarding(profile);
      });
    }

    // Pre-fill name if available
    var nameInput = qs('#onboardFirstName');
    if (nameInput && profile.firstName) {
      nameInput.value = profile.firstName;
    }
  }

  function completeOnboarding(profile) {
    // Gather selections
    var goals = [];
    qsa('input[name="goal"]:checked').forEach(function (cb) {
      goals.push(cb.value);
    });

    var tracking = [];
    qsa('input[name="track"]:checked').forEach(function (cb) {
      tracking.push(cb.value);
    });

    var pathEl = qs('input[name="path"]:checked');
    var path = pathEl ? pathEl.value : 'athlete';

    var firstName = (qs('#onboardFirstName') || {}).value || profile.firstName || '';
    var goalText = (qs('#onboardGoalText') || {}).value || '';
    var weight = parseFloat((qs('#onboardWeight') || {}).value) || 0;
    var height = parseFloat((qs('#onboardHeight') || {}).value) || 0;

    // Calculate BMI if height and weight provided
    var bmi = 0;
    if (weight > 0 && height > 0) {
      bmi = Math.round((weight / (height * height)) * 703 * 10) / 10;
    }

    // Update profile
    profile.firstName = firstName;
    profile.goals = goals;
    profile.tracking = tracking;
    profile.path = path;
    profile.goalText = goalText;
    profile.startWeight = weight;
    profile.startHeight = height;
    profile.startBMI = bmi;
    profile.onboarded = true;
    profile.onboardDate = new Date().toISOString();

    saveProfile(profile);

    // Show completion screen
    qsa('.onboard-step').forEach(function (s) {
      s.classList.remove('active');
      s.style.display = 'none';
    });

    var complete = qs('#stepComplete');
    if (complete) {
      complete.style.display = 'block';
      void complete.offsetWidth;
      complete.classList.add('active');
    }

    // Populate completion card
    var titleEl = qs('#completeTitle');
    if (titleEl) titleEl.textContent = 'Welcome, ' + firstName;

    var pathNames = {
      athlete: 'Athlete',
      adult: 'Adult Performance',
      integrated: 'Integrated Program',
      guest: 'Guest Exploration'
    };

    var pathEl2 = qs('#completePath');
    if (pathEl2) pathEl2.textContent = pathNames[path] || path;

    var goalEl = qs('#completeGoal');
    if (goalEl) goalEl.textContent = goalText || 'Not set';

    if (bmi > 0) {
      var bmiRow = qs('#completeBMIRow');
      var bmiVal = qs('#completeBMI');
      if (bmiRow) bmiRow.style.display = 'block';
      if (bmiVal) bmiVal.textContent = bmi;
    }

    // Hide progress indicators
    var progressBar = qs('.onboard-progress');
    var steps = qs('.onboard-steps');
    if (progressBar) progressBar.style.display = 'none';
    if (steps) steps.style.display = 'none';
  }


  /* ══════════════════════════════════════════════════════
     PROFILE PAGE — MEMBER IDENTITY CARD
     ══════════════════════════════════════════════════════ */

  function initProfile() {
    var profile = getProfile();

    // If no profile at all, redirect to login
    if (!profile) {
      window.location.href = 'index.html';
      return;
    }

    var firstName = profile.firstName || '';
    var isGuestMode = profile.isGuest;

    // ── Identity Card ──
    var cardName = qs('#idCardName');
    var cardPath = qs('#idCardPath');
    var cardTier = qs('#idCardTier');
    var cardSince = qs('#idCardSince');
    var cardGoal = qs('#idCardGoal');
    var cardMilestone = qs('#idCardMilestone');
    var cardMetric = qs('#idCardMetric');

    var pathNames = {
      athlete: 'ATHLETE',
      adult: 'ADULT PERFORMANCE',
      integrated: 'INTEGRATED',
      guest: 'GUEST EXPLORATION'
    };

    if (cardName) {
      cardName.textContent = isGuestMode ? 'GUEST' : (firstName || 'MEMBER').toUpperCase();
    }
    if (cardPath) {
      cardPath.textContent = pathNames[profile.path] || 'ATHLETE';
    }
    if (cardTier) {
      cardTier.textContent = isGuestMode ? 'PPF GUEST' : 'PPF MEMBER';
    }
    if (cardSince) {
      var joinDate = profile.joinDate ? new Date(profile.joinDate) : new Date();
      var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      cardSince.textContent = months[joinDate.getMonth()] + ' ' + joinDate.getDate() + ', ' + joinDate.getFullYear();
    }
    if (cardGoal) {
      cardGoal.textContent = profile.goalText || 'Not set';
    }
    if (cardMilestone) {
      cardMilestone.textContent = isGuestMode ? 'Explore first' : 'Standard Setter';
    }
    if (cardMetric) {
      cardMetric.textContent = isGuestMode ? '—' : 'Bench PR: 205 lb';
    }

    // ── Body Blueprint ──
    var startWeight = profile.startWeight || 0;
    var startBMI = profile.startBMI || 0;
    // Default goal: 3% weight reduction when no explicit goal is set
    var goalWeight = startWeight > 0 ? Math.round(startWeight * 0.97) : 0;

    var bw = qs('#bodyWeight');
    var bmi = qs('#bodyBMI');
    var gw = qs('#bodyGoalWeight');
    var bp = qs('#bodyProgress');
    var bt = qs('#bodyTrend');
    var bs = qs('#bodyStreak');
    var bc = qs('#bodyCoachNote');
    var bm = qs('#bodyMilestone');

    if (bw) bw.textContent = startWeight > 0 ? startWeight + ' lb' : '—';
    if (bmi) bmi.textContent = startBMI > 0 ? startBMI : '—';
    if (gw) gw.textContent = goalWeight > 0 ? (goalWeight - 2) + '–' + (goalWeight + 2) + ' lb' : '—';

    if (bp && startWeight > 0) {
      var diff = startWeight - goalWeight;
      var lost = Math.round(diff * 0.45);
      var pct = diff > 0 ? Math.min(Math.round((lost / diff) * 100), 100) : 0;
      bp.style.setProperty('--pct', pct + '%');
    }

    if (bt) bt.textContent = isGuestMode ? '—' : '↓ 0.8 lb this week';
    if (bs) bs.textContent = isGuestMode ? '—' : '12-day streak';
    if (bc) bc.textContent = isGuestMode ? '—' : '"Trending in the right direction. Stay consistent with protein targets."';
    if (bm) bm.textContent = isGuestMode ? '—' : 'Body Blueprint Builder — In Progress';

    // ── Performance Blueprint ──
    var perfData = {
      perfBench: isGuestMode ? '—' : '205 lb',
      perfSquat: isGuestMode ? '—' : '285 lb',
      perfVertical: isGuestMode ? '—' : '28.5"',
      perfBroad: isGuestMode ? '—' : '8\'4"',
      perfTenYard: isGuestMode ? '—' : '1.62s',
      perf40: isGuestMode ? '—' : '4.68s',
      perfShuttle: isGuestMode ? '—' : '4.31s',
      perfAttendance: isGuestMode ? '—' : '87%',
      perfRecovery: isGuestMode ? '—' : '82'
    };

    Object.keys(perfData).forEach(function (id) {
      var el = qs('#' + id);
      if (el) el.textContent = perfData[id];
    });

    // ── Momentum Score ──
    var mVal = qs('#profileMomentumValue');
    var mStatus = qs('#profileMomentumStatus');
    var momentumScore = isGuestMode ? 0 : 82;

    if (mVal) {
      if (isGuestMode) {
        mVal.textContent = '—';
      } else {
        animateNumber(mVal, 0, momentumScore, '');
      }
    }
    if (mStatus) {
      if (isGuestMode) {
        mStatus.textContent = 'Create your profile to start building momentum.';
      } else if (momentumScore >= 80) {
        mStatus.textContent = 'You are building momentum. Keep the standard locked in.';
      } else if (momentumScore >= 60) {
        mStatus.textContent = 'Good trajectory. Tighten the details this week.';
      } else {
        mStatus.textContent = 'Momentum is slipping. Get back to the standard.';
      }
    }

    // Momentum breakdown
    var breakdownData = {
      momentumAttendance: isGuestMode ? '—' : '87',
      momentumConsistency: isGuestMode ? '—' : '91',
      momentumNutrition: isGuestMode ? '—' : '72',
      momentumPerformance: isGuestMode ? '—' : '85',
      momentumRecovery: isGuestMode ? '—' : '78'
    };

    Object.keys(breakdownData).forEach(function (id) {
      var el = qs('#' + id);
      if (el) {
        if (isGuestMode) {
          el.textContent = '—';
        } else {
          animateNumber(el, 0, parseInt(breakdownData[id], 10), '');
        }
      }
    });

    // ── Journey Snapshot — update first node date ──
    if (profile.joinDate) {
      var firstNode = qs('#profileJourneyTimeline .journey-node.completed .journey-date');
      if (firstNode) {
        var jd = new Date(profile.joinDate);
        var months2 = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
        firstNode.textContent = months2[jd.getMonth()] + ' ' + jd.getDate() + ', ' + jd.getFullYear();
      }
    }
  }


  /* ══════════════════════════════════════════════════════
     DASHBOARD ENHANCEMENTS — Daily Streak, Challenges, Win Recap
     ══════════════════════════════════════════════════════ */

  function initDailyStreak() {
    var streakCards = qsa('.streak-card');
    var streakSummary = qs('#streakSummaryText');
    var activeCategories = 0;

    streakCards.forEach(function (card) {
      if (card.classList.contains('active')) activeCategories++;
    });

    if (streakSummary) {
      streakSummary.textContent = 'Current streak: ' + activeCategories + ' of ' + streakCards.length + ' categories active';
    }
  }

  function initDailyChallenges() {
    var items = qsa('.challenge-item');
    items.forEach(function (item) {
      item.addEventListener('click', function () {
        item.classList.toggle('completed');
        updateWinRecap();
      });
    });
  }

  function updateWinRecap() {
    var total = qsa('.challenge-item').length;
    var done = qsa('.challenge-item.completed').length;
    var headline = qs('#winRecapHeadline');
    var detail = qs('#winRecapDetail');
    var card = qs('.win-recap-card');

    if (headline) {
      headline.textContent = done + ' of ' + total + ' standards completed';
    }
    if (detail) {
      if (done === total) {
        detail.textContent = 'Full standard met today. That is how you build.';
      } else if (done >= total / 2) {
        detail.textContent = 'Solid effort. Close the day strong.';
      } else {
        detail.textContent = 'Still time to lock in. Attack the details.';
      }
    }
    if (card) {
      card.classList.toggle('strong', done >= total / 2);
    }
  }


  /* ══════════════════════════════════════════════════════
     PUBLIC API
     ══════════════════════════════════════════════════════ */

  return {
    initEntry: initEntry,
    initDashboard: initDashboard,
    initOnboarding: initOnboarding,
    initProfile: initProfile,
    getProfile: getProfile,
    saveProfile: saveProfile,
    isGuest: isGuest
  };

})();
