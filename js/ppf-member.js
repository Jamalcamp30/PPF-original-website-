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
    // Boot animation with staged status messages
    var boot = qs('#ppfBoot');
    var wrapper = qs('#entryWrapper');
    var bootStatus = qs('#bootStatus');

    if (boot && wrapper) {
      var bootMessages = [
        'INITIALIZING SYSTEM…',
        'LOADING PERFORMANCE DATA…',
        'CALIBRATING METRICS…',
        'SYSTEM READY.'
      ];
      var msgIndex = 0;
      if (bootStatus) {
        var bootInterval = setInterval(function () {
          msgIndex++;
          if (msgIndex < bootMessages.length) {
            bootStatus.textContent = bootMessages[msgIndex];
          } else {
            clearInterval(bootInterval);
          }
        }, 700);
      }

      setTimeout(function () {
        boot.classList.add('done');
        wrapper.classList.add('visible');
      }, 3200);
    }

    // Check for returning user
    var profile = getProfile();
    var returningSection = qs('#returningUser');
    var newUserSection = qs('#newUserSection');

    if (profile && profile.firstName && profile.onboarded) {
      // Returning user — show personalized welcome
      if (returningSection) {
        returningSection.style.display = 'block';
        var retGreeting = qs('#returningGreeting');
        if (retGreeting) {
          retGreeting.textContent = 'WELCOME BACK, ' + profile.firstName.toUpperCase() + '. SYSTEM READY.';
        }
      }
      // Hide new user auth if returning section is visible
      if (newUserSection && returningSection) {
        newUserSection.style.display = 'none';
      }
      // Set path-specific background
      if (profile.path) {
        document.body.setAttribute('data-path', profile.path);
      }
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

    var pathNames = {
      athlete: 'ATHLETE',
      adult: 'ADULT PERFORMANCE',
      integrated: 'INTEGRATED',
      guest: 'GUEST EXPLORATION'
    };

    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var joinDate = profile.joinDate ? new Date(profile.joinDate) : new Date();
    var joinStr = months[joinDate.getMonth()] + ' ' + joinDate.getDate() + ', ' + joinDate.getFullYear();

    // ── Today's Brief ──
    initProfileBrief(profile, isGuestMode);

    // ── Hero Identity Card ──
    setText('#heroAvatar', isGuestMode ? 'G' : (firstName.charAt(0) || 'M').toUpperCase());
    setText('#heroName', isGuestMode ? 'GUEST' : (firstName || 'MEMBER').toUpperCase());
    setText('#heroPath', pathNames[profile.path] || 'ATHLETE');
    setText('#heroPhase', isGuestMode ? '—' : 'Force Development');
    setText('#heroCoach', isGuestMode ? '—' : 'Coach Davis');
    setText('#heroGoal', profile.goalText || 'Not set');
    setText('#heroStreak', isGuestMode ? '—' : '🔥 12 days');
    setText('#heroLastUpdate', isGuestMode ? '—' : 'Apr 5, 2025');

    var statusTag = qs('#heroStatus');
    if (statusTag) {
      if (isGuestMode) {
        statusTag.textContent = 'EXPLORING';
        statusTag.setAttribute('data-status', 'returning');
      } else {
        statusTag.textContent = 'BUILDING';
        statusTag.setAttribute('data-status', 'building');
      }
    }

    // ── Hero Details ──
    setText('#heroSince', joinStr);
    setText('#heroMilestone', isGuestMode ? '—' : 'Standard Setter');
    setText('#heroMetric', isGuestMode ? '—' : 'Bench PR: 205 lb');

    // ── Readiness Ring ──
    initReadinessRing(isGuestMode);

    // ── Performance DNA ──
    initPerformanceDNA(isGuestMode);

    // ── Coach's Eye Toggle ──
    initCoachEye();

    // ── Personal Identity (Why I Train) ──
    initIdentitySection(profile);

    // ── Performance Blueprint ──
    var perfData = {
      perfBench: isGuestMode ? '—' : '205 lb ↑',
      perfSquat: isGuestMode ? '—' : '285 lb ↑',
      perfVertical: isGuestMode ? '—' : '28.5" →',
      perfBroad: isGuestMode ? '—' : '8\'4" ↑',
      perfTenYard: isGuestMode ? '—' : '1.62s ↑',
      perf40: isGuestMode ? '—' : '4.68s →',
      perfShuttle: isGuestMode ? '—' : '4.31s ↑',
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

    // ── AI Weekly Recap ──
    initWeeklyRecap(isGuestMode);

    // ── Journey Snapshot — update first node date ──
    if (profile.joinDate) {
      var firstNode = qs('#profileJourneyTimeline .journey-node.completed .journey-date');
      if (firstNode) {
        firstNode.textContent = joinStr;
      }
    }
  }

  /* ── Profile Sub-initializers ─── */

  function setText(sel, text) {
    var el = qs(sel);
    if (el) el.textContent = text;
  }

  function initProfileBrief(profile, isGuestMode) {
    setText('#briefReadiness', isGuestMode ? '—' : '78');
    setText('#briefObjective', isGuestMode ? 'Explore the system' : 'Force application + acceleration quality');
    setText('#briefCoachMsg', isGuestMode ? '—' : 'Stay aggressive through the floor today.');
    setText('#briefSchedule', isGuestMode ? '—' : 'Session at 4:30 PM');
    setText('#briefMilestone', isGuestMode ? '—' : '4 days to retest');
    setText('#briefFocus', isGuestMode
      ? 'Create your profile to receive personalized briefings.'
      : 'TODAY: Force application + short acceleration quality. You are 4 days from retest. Coach note waiting.');
  }

  function initReadinessRing(isGuestMode) {
    var segments = [
      { id: 'ringSleep', pct: isGuestMode ? 0 : 0.82 },
      { id: 'ringSoreness', pct: isGuestMode ? 0 : 0.75 },
      { id: 'ringAttendance', pct: isGuestMode ? 0 : 0.87 },
      { id: 'ringSession', pct: isGuestMode ? 0 : 0.90 },
      { id: 'ringRecoveryRing', pct: isGuestMode ? 0 : 0.72 }
    ];

    setTimeout(function () {
      segments.forEach(function (seg) {
        var el = qs('#' + seg.id);
        if (el) {
          var r = parseFloat(el.getAttribute('r')) || 90;
          var circ = 2 * Math.PI * r;
          // Each segment is ~60deg arc (1/6 of circumference) for visual separation
          var arcLen = circ * 0.167;
          el.style.strokeDasharray = (arcLen * seg.pct) + ' ' + circ;
        }
      });
    }, 600);

    var avg = isGuestMode ? 0 : Math.round((0.82 + 0.75 + 0.87 + 0.90 + 0.72) / 5 * 100);
    var scoreEl = qs('#readinessScore');
    if (scoreEl) {
      if (isGuestMode) {
        scoreEl.textContent = '—';
      } else {
        animateNumber(scoreEl, 0, avg, '');
      }
    }

    var statusEl = qs('#readinessStatus');
    if (statusEl) {
      if (isGuestMode) {
        statusEl.textContent = 'SYSTEM STATUS: INACTIVE';
      } else if (avg >= 80) {
        statusEl.textContent = 'SYSTEM STATUS: HIGH READINESS';
      } else if (avg >= 60) {
        statusEl.textContent = 'SYSTEM STATUS: MODERATE READINESS';
      } else {
        statusEl.textContent = 'SYSTEM STATUS: LOW READINESS';
      }
    }

    var recEl = qs('#readinessRec');
    if (recEl) {
      if (isGuestMode) {
        recEl.textContent = 'Create your profile to track readiness.';
      } else if (avg >= 80) {
        recEl.textContent = 'You are primed today. Attack your session with full intensity.';
      } else if (avg >= 60) {
        recEl.textContent = 'Moderate readiness. Maintain technical quality, reduce CNS volume by 10%.';
      } else {
        recEl.textContent = 'Prioritize recovery today. Hydrate, stretch, rest up.';
      }
    }
  }

  function initPerformanceDNA(isGuestMode) {
    var dnaData = [
      { id: 'dnaAcceleration', score: 78, trend: 'up', note: 'First 10 yards improving', focus: 'Shin angle + drive phase' },
      { id: 'dnaTopSpeed', score: 71, trend: 'flat', note: 'Top-end mechanics need work', focus: 'Front-side mechanics' },
      { id: 'dnaLowerPower', score: 85, trend: 'up', note: 'Jump output strong', focus: 'Maintain explosive volume' },
      { id: 'dnaRelStrength', score: 82, trend: 'up', note: 'Squat-to-BW ratio climbing', focus: 'Progressive overload' },
      { id: 'dnaMovement', score: 65, trend: 'down', note: 'Hip mobility flagged', focus: 'Daily mobility protocol' },
      { id: 'dnaRecovery', score: 72, trend: 'flat', note: 'Sleep consistency needed', focus: '8+ hours target' },
      { id: 'dnaConsistency', score: 91, trend: 'up', note: 'Attendance locked in', focus: 'Maintain standard' }
    ];

    dnaData.forEach(function (item) {
      var scoreEl = qs('#' + item.id + 'Score');
      var barEl = qs('#' + item.id + 'Bar');
      var trendEl = qs('#' + item.id + 'Trend');
      var noteEl = qs('#' + item.id + 'Note');
      var focusEl = qs('#' + item.id + 'Focus');

      if (scoreEl) {
        if (isGuestMode) {
          scoreEl.textContent = '—';
        } else {
          animateNumber(scoreEl, 0, item.score, '');
        }
      }
      if (barEl) {
        setTimeout(function () {
          barEl.style.width = (isGuestMode ? 0 : item.score) + '%';
        }, 400);
      }
      if (trendEl) {
        trendEl.textContent = isGuestMode ? '—' : (item.trend === 'up' ? '↑' : item.trend === 'down' ? '↓' : '→');
        trendEl.className = 'pos-dna-trend ' + (isGuestMode ? '' : item.trend);
      }
      if (noteEl) noteEl.textContent = isGuestMode ? '—' : item.note;
      if (focusEl) focusEl.textContent = isGuestMode ? '' : 'Focus: ' + item.focus;
    });
  }

  function initCoachEye() {
    var toggle = qs('#coachEyeToggle');
    var myViewBtn = qs('#btnMyView');
    var coachViewBtn = qs('#btnCoachView');
    var myPanel = qs('#myViewPanel');
    var coachPanel = qs('#coachEyePanel');

    if (coachViewBtn && coachPanel && myViewBtn) {
      coachViewBtn.addEventListener('click', function () {
        if (coachPanel) coachPanel.classList.add('visible');
        if (myPanel) myPanel.style.display = 'none';
        coachViewBtn.classList.add('active');
        myViewBtn.classList.remove('active');
      });

      myViewBtn.addEventListener('click', function () {
        if (coachPanel) coachPanel.classList.remove('visible');
        if (myPanel) myPanel.style.display = 'block';
        myViewBtn.classList.add('active');
        coachViewBtn.classList.remove('active');
      });
    }
  }

  function initIdentitySection(profile) {
    // Load saved identity data
    var whyEl = qs('#whyITrain');
    var chasingEl = qs('#whatImChasing');
    var whoEl = qs('#whoITrainFor');
    var saveBtn = qs('#saveIdentity');

    if (whyEl && profile.whyITrain) whyEl.value = profile.whyITrain;
    if (chasingEl && profile.whatImChasing) chasingEl.value = profile.whatImChasing;
    if (whoEl && profile.whoITrainFor) whoEl.value = profile.whoITrainFor;

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var p = getProfile() || {};
        if (whyEl) p.whyITrain = whyEl.value;
        if (chasingEl) p.whatImChasing = chasingEl.value;
        if (whoEl) p.whoITrainFor = whoEl.value;
        saveProfile(p);
        saveBtn.textContent = 'SAVED ✓';
        setTimeout(function () {
          saveBtn.textContent = 'SAVE IDENTITY';
        }, 2000);
      });
    }
  }

  function initWeeklyRecap(isGuestMode) {
    var recapItems = {
      recapSummary: isGuestMode ? '—' : '4 sessions completed, 2 PRs logged',
      recapConsistency: isGuestMode ? '—' : '91%',
      recapBest: isGuestMode ? '—' : 'Bench PR: 205 lb (+5)',
      recapEmphasis: isGuestMode ? '—' : 'Front-side sprint mechanics',
      recapRecoveryTrend: isGuestMode ? '—' : 'Improving (↑ 8%)',
      recapSlipping: isGuestMode ? '—' : 'Sleep consistency below target'
    };

    Object.keys(recapItems).forEach(function (id) {
      setText('#' + id, recapItems[id]);
    });
  }


  /* ══════════════════════════════════════════════════════
     SETTINGS PAGE — PERFORMANCE CONTROLS
     ══════════════════════════════════════════════════════ */

  var SETTINGS_KEY = 'ppf_member_settings';

  function getSettings() {
    try {
      var data = localStorage.getItem(SETTINGS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  function saveSettings(settings) {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) { /* storage unavailable */ }
  }

  function initSettings() {
    var profile = getProfile();

    if (!profile) {
      window.location.href = 'index.html';
      return;
    }

    var settings = getSettings();

    // ── Populate account info ──
    setText('#settingsEmail', profile.email || 'Not set');
    var joinDate = profile.joinDate ? new Date(profile.joinDate) : new Date();
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    setText('#settingsSince', months[joinDate.getMonth()] + ' ' + joinDate.getDate() + ', ' + joinDate.getFullYear());

    var pathNames = {
      athlete: 'Athlete Performance',
      adult: 'Adult Performance',
      integrated: 'Integrated Program',
      guest: 'Guest Exploration'
    };
    setText('#settingsPath', pathNames[profile.path] || 'Athlete Performance');

    // ── Accordion toggles ──
    var headers = qsa('.pos-settings-group-header');
    headers.forEach(function (header) {
      header.addEventListener('click', function () {
        var body = header.nextElementSibling;
        var isOpen = header.classList.contains('open');
        // Close all others
        headers.forEach(function (h) {
          h.classList.remove('open');
          if (h.nextElementSibling) h.nextElementSibling.style.display = 'none';
        });
        if (!isOpen) {
          header.classList.add('open');
          if (body) body.style.display = 'block';
        }
      });
    });

    // Open first group by default
    if (headers.length > 0) {
      headers[0].classList.add('open');
      var firstBody = headers[0].nextElementSibling;
      if (firstBody) firstBody.style.display = 'block';
    }

    // ── Restore saved settings ──
    restoreSettings(settings);

    // ── Auto-save on change ──
    var allInputs = qsa('.pos-settings-group-body input, .pos-settings-group-body select');
    allInputs.forEach(function (input) {
      var eventType = input.type === 'checkbox' || input.type === 'radio' ? 'change' : 'input';
      input.addEventListener(eventType, function () {
        autoSaveSettings();
        showAutoSaved();
      });
    });

    // ── Font scale slider ──
    var fontSlider = qs('#fontScale');
    var fontDisplay = qs('#fontScaleDisplay');
    if (fontSlider) {
      fontSlider.addEventListener('input', function () {
        if (fontDisplay) fontDisplay.textContent = fontSlider.value + '%';
      });
    }

    // ── Integration buttons (demo) ──
    qsa('.pos-setting-btn[data-connect]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        btn.textContent = 'Coming Soon';
        btn.disabled = true;
        btn.style.opacity = '0.5';
      });
    });

    // ── Export Data button ──
    var exportBtn = qs('#btnExportData');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        var data = JSON.stringify({ profile: getProfile(), settings: getSettings() }, null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'ppf-member-data.json';
        a.click();
        URL.revokeObjectURL(url);
        exportBtn.textContent = 'Exported ✓';
        setTimeout(function () { exportBtn.textContent = 'Export My Data'; }, 2000);
      });
    }

    // ── Logout button ──
    var logoutBtn = qs('#settingsLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', function () {
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem(SETTINGS_KEY);
        window.location.href = 'index.html';
      });
    }

    // ── Delete account ──
    var deleteBtn = qs('#btnDeleteAccount');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', function () {
        if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
          localStorage.removeItem(PROFILE_KEY);
          localStorage.removeItem(SETTINGS_KEY);
          window.location.href = 'index.html';
        }
      });
    }
  }

  function restoreSettings(settings) {
    Object.keys(settings).forEach(function (key) {
      var el = qs('#' + key);
      if (!el) return;
      if (el.type === 'checkbox') {
        el.checked = settings[key];
      } else if (el.type === 'radio') {
        // Find the right radio in the group
        var radios = qsa('input[name="' + el.name + '"]');
        radios.forEach(function (r) {
          r.checked = (r.value === settings[key]);
        });
      } else if (el.type === 'range') {
        el.value = settings[key];
        var display = qs('#' + key + 'Display');
        if (display) display.textContent = settings[key] + '%';
      }
    });
  }

  function autoSaveSettings() {
    var settings = {};
    var checkboxes = qsa('.pos-settings-group-body input[type="checkbox"]');
    checkboxes.forEach(function (cb) {
      if (cb.id) settings[cb.id] = cb.checked;
    });

    var radios = qsa('.pos-settings-group-body input[type="radio"]:checked');
    radios.forEach(function (r) {
      if (r.name) settings[r.name] = r.value;
    });

    var sliders = qsa('.pos-settings-group-body input[type="range"]');
    sliders.forEach(function (s) {
      if (s.id) settings[s.id] = s.value;
    });

    saveSettings(settings);
  }

  function showAutoSaved() {
    var indicator = qs('#autoSaveIndicator');
    if (indicator) {
      indicator.style.opacity = '1';
      setTimeout(function () {
        indicator.style.opacity = '0.6';
      }, 1500);
    }
  }


  /* ══════════════════════════════════════════════════════
     MEMBERSHIP PAGE — LIVE TIER SYSTEM
     ══════════════════════════════════════════════════════ */

  function initMembership() {
    var profile = getProfile();

    if (!profile) {
      window.location.href = 'index.html';
      return;
    }

    var firstName = profile.firstName || '';
    var isGuestMode = profile.isGuest;

    var pathNames = {
      athlete: 'PPF ATHLETE',
      adult: 'PPF ADULT PERFORMANCE',
      integrated: 'PPF INTEGRATED',
      guest: 'PPF GUEST'
    };

    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var joinDate = profile.joinDate ? new Date(profile.joinDate) : new Date();
    var joinStr = months[joinDate.getMonth()] + ' ' + joinDate.getDate() + ', ' + joinDate.getFullYear();

    // ── Membership Hero ──
    setText('#memTierBadge', pathNames[profile.path] || 'PPF ATHLETE');
    setText('#memName', isGuestMode ? 'GUEST' : (firstName || 'MEMBER').toUpperCase());
    setText('#memStatus', isGuestMode ? 'GUEST MODE' : 'ACTIVE');
    setText('#memCycle', isGuestMode ? '—' : 'Spring 2025 — Block 2');
    setText('#memCoach', isGuestMode ? '—' : 'Coach Davis');
    setText('#memBilling', isGuestMode ? '—' : 'Current');
    setText('#memRenewal', isGuestMode ? '—' : 'May 15, 2025');
    setText('#memSince', joinStr);

    // ── Path-specific styling on hero card ──
    var heroCard = qs('#membershipHero');
    if (heroCard && profile.path) {
      heroCard.setAttribute('data-path', profile.path);
    }

    // ── Pathway active state ──
    initPathway(profile);

    // ── Attendance bar ──
    var attBar = qs('#memAttBar');
    if (attBar) {
      setTimeout(function () {
        attBar.style.width = isGuestMode ? '0%' : '87%';
      }, 500);
    }

    // ── Unlock progress animations ──
    var unlockBars = qsa('.pos-unlock-bar');
    unlockBars.forEach(function (bar) {
      var pct = bar.style.getPropertyValue('--pct') || '0%';
      bar.style.width = '0%';
      setTimeout(function () {
        bar.style.width = pct;
        bar.style.transition = 'width 1s cubic-bezier(0.16, 1, 0.3, 1)';
      }, 800);
    });
  }

  function initPathway(profile) {
    var isGuestMode = profile.isGuest;
    var activePhase = isGuestMode ? '' : 'force';

    var nodes = qsa('.pos-path-node');
    var lines = qsa('.pos-path-line');
    var foundActive = false;

    nodes.forEach(function (node, i) {
      var phase = node.getAttribute('data-phase');
      if (foundActive) {
        node.classList.remove('completed', 'active');
        node.classList.add('locked');
        if (lines[i - 1]) {
          lines[i - 1].classList.remove('completed');
          lines[i - 1].classList.add('locked');
        }
      } else if (phase === activePhase) {
        node.classList.remove('completed', 'locked');
        node.classList.add('active');
        foundActive = true;
      }
    });
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
    initSettings: initSettings,
    initMembership: initMembership,
    getProfile: getProfile,
    saveProfile: saveProfile,
    isGuest: isGuest
  };

})();
