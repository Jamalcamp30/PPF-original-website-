/* =====================================================
   PPF 30X ELITE ENGINE
   Animations, Personalization, Engagement, Conversion
   ===================================================== */
(function () {
  'use strict';

  /* ── Helpers ─────────────────────────────────────── */
  var qs  = function (s, p) { return (p || document).querySelector(s); };
  var qsa = function (s, p) { return [].slice.call((p || document).querySelectorAll(s)); };
  var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ══════════════════════════════════════════════════════
     1. SCROLL PROGRESS BAR
  ══════════════════════════════════════════════════════ */
  function initScrollProgress() {
    var bar = document.createElement('div');
    bar.className = 'x-scroll-progress';
    document.body.appendChild(bar);

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          var docH = document.documentElement.scrollHeight - window.innerHeight;
          var pct = docH > 0 ? (scrollTop / docH) * 100 : 0;
          bar.style.width = pct + '%';
          ticking = false;
        });
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     2. INTERSECTION OBSERVER — SCROLL REVEAL ENGINE
     Staggered, directional, parallax reveals
  ══════════════════════════════════════════════════════ */
  function initScrollReveals() {
    if (prefersReduced) {
      qsa('.x-reveal, .x-reveal-left, .x-reveal-right, .x-reveal-scale, .x-stagger').forEach(function (el) {
        el.classList.add('x-visible');
      });
      return;
    }

    /* Tag existing elements for reveal */
    qsa('.section-label, .section-title, .section-intro').forEach(function (el) {
      if (!el.classList.contains('x-reveal')) el.classList.add('x-reveal');
    });

    /* Add stagger indices to grid children */
    qsa('.x-stagger').forEach(function (parent) {
      var children = parent.children;
      for (var i = 0; i < children.length; i++) {
        children[i].style.setProperty('--x-i', i);
      }
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('x-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    qsa('.x-reveal, .x-reveal-left, .x-reveal-right, .x-reveal-scale, .x-stagger, .x-section-divider').forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ══════════════════════════════════════════════════════
     3. ANIMATED NUMBER COUNTERS
     Smooth count-up for stats visible in viewport
  ══════════════════════════════════════════════════════ */
  function initCounters() {
    var counters = qsa('.proof-wall__stat-num, .proof-num, .metric-num, [data-target]');
    if (!counters.length) return;

    var counted = new Set();
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting || counted.has(entry.target)) return;
        counted.add(entry.target);
        animateCounter(entry.target);
      });
    }, { threshold: 0.5 });

    counters.forEach(function (el) { observer.observe(el); });
  }

  function animateCounter(el) {
    var text = el.textContent.trim();
    var match = text.match(/([\d,.]+)/);
    if (!match) return;

    var raw = match[1].replace(/,/g, '');
    var target = parseFloat(raw);
    if (isNaN(target)) return;

    var hasDecimal = raw.indexOf('.') !== -1;
    var decimals = hasDecimal ? (raw.split('.')[1] || '').length : 0;
    var prefix = text.substring(0, text.indexOf(match[1]));
    var suffix = text.substring(text.indexOf(match[1]) + match[1].length);
    var duration = 1800;
    var startTime = null;

    function step(ts) {
      if (!startTime) startTime = ts;
      var progress = Math.min((ts - startTime) / duration, 1);
      /* Ease out cubic */
      var eased = 1 - Math.pow(1 - progress, 3);
      var current = target * eased;

      if (decimals > 0) {
        el.textContent = prefix + current.toFixed(decimals) + suffix;
      } else {
        el.textContent = prefix + Math.round(current).toLocaleString() + suffix;
      }

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        el.textContent = text; /* Restore original */
        el.classList.add('x-counting');
        setTimeout(function () { el.classList.remove('x-counting'); }, 400);
      }
    }

    el.textContent = prefix + '0' + suffix;
    requestAnimationFrame(step);
  }

  /* ══════════════════════════════════════════════════════
     4. ANIMATED BENCHMARK FILLS
     Bars animate width when visible
  ══════════════════════════════════════════════════════ */
  function initBenchmarkFills() {
    var fills = qsa('.bench-metric-fill');
    if (!fills.length) return;

    /* Reset widths */
    fills.forEach(function (f) {
      f.dataset.targetWidth = f.style.getPropertyValue('--fill') || '0%';
      f.style.width = '0';
    });

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        setTimeout(function () {
          el.style.width = el.dataset.targetWidth;
        }, 100);
        observer.unobserve(el);
      });
    }, { threshold: 0.3 });

    fills.forEach(function (f) { observer.observe(f); });
  }

  /* ══════════════════════════════════════════════════════
     5. RIPPLE EFFECT ON BUTTONS
  ══════════════════════════════════════════════════════ */
  function initRipple() {
    if (prefersReduced) return;

    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.cta-action, .cta-branch__card-btn, .passport-option, .bench-tab, .proof-tab, .proof-filter, .member-preview__cta-link');
      if (!btn) return;
      btn.classList.add('x-ripple');

      var wave = document.createElement('span');
      wave.className = 'x-ripple-wave';
      var rect = btn.getBoundingClientRect();
      var size = Math.max(rect.width, rect.height) * 2;
      wave.style.width = size + 'px';
      wave.style.height = size + 'px';
      wave.style.left = (e.clientX - rect.left - size / 2) + 'px';
      wave.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(wave);

      setTimeout(function () {
        if (wave.parentNode) wave.parentNode.removeChild(wave);
      }, 600);
    });
  }

  /* ══════════════════════════════════════════════════════
     6. MAGNETIC BUTTON EFFECT
  ══════════════════════════════════════════════════════ */
  function initMagnetic() {
    if (prefersReduced || !window.matchMedia('(hover: hover)').matches) return;

    qsa('.cta-action, .x-chatbot-trigger').forEach(function (btn) {
      btn.classList.add('x-magnetic');
      btn.addEventListener('mousemove', function (e) {
        var rect = btn.getBoundingClientRect();
        var x = e.clientX - rect.left - rect.width / 2;
        var y = e.clientY - rect.top - rect.height / 2;
        btn.style.transform = 'translate(' + (x * 0.15) + 'px, ' + (y * 0.15) + 'px)';
      });
      btn.addEventListener('mouseleave', function () {
        btn.style.transform = '';
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     7. SOCIAL PROOF TOAST NOTIFICATIONS
     Live activity feed showing recent achievements
  ══════════════════════════════════════════════════════ */
  var toastData = [
    { icon: '⚡', title: 'Derek W. just hit 4.48s 40-yard', sub: 'Athlete Path · New PR', time: '2 min ago' },
    { icon: '💪', title: 'Sarah K. completed 6-month transformation', sub: 'Adult Path · -10% body fat', time: '8 min ago' },
    { icon: '🏋️', title: 'Marcus T. hit 365 lb back squat', sub: 'Athlete Path · +80 lbs', time: '15 min ago' },
    { icon: '🤝', title: 'Emma C. achieved full independence', sub: 'Integrated Path · 5 exercises', time: '22 min ago' },
    { icon: '🔥', title: 'Kevin M. hit 14-month consistency streak', sub: 'Adult Path · 5x/week', time: '30 min ago' },
    { icon: '⚡', title: 'Jaylen W. dropped Pro Agility to 4.67s', sub: 'Athlete Path · -0.45s', time: '45 min ago' },
    { icon: '💪', title: 'Lina P. reached 22% body fat goal', sub: 'Adult Path · 9-month journey', time: '1 hr ago' },
    { icon: '🎯', title: 'New member just signed up for Athlete Path', sub: 'North Forsyth County', time: 'Just now' },
    { icon: '📞', title: 'Rebecca responded to an inquiry', sub: 'Average response: under 12 hrs', time: '3 min ago' },
    { icon: '🏆', title: 'Terrence H. set new deadlift PR: 315 lbs', sub: 'Adult Path · 6-month record', time: '1 hr ago' }
  ];

  function initSocialProofToasts() {
    var container = document.createElement('div');
    container.className = 'x-toast-container';
    document.body.appendChild(container);

    var currentIndex = 0;
    var toastCount = 0;
    var maxVisible = 2;
    var paused = false;

    /* Pause on page hidden */
    document.addEventListener('visibilitychange', function () {
      paused = document.hidden;
    });

    function showToast() {
      if (paused) { setTimeout(showToast, 5000); return; }

      var data = toastData[currentIndex % toastData.length];
      currentIndex++;
      toastCount++;

      var toast = document.createElement('div');
      toast.className = 'x-toast';
      toast.innerHTML =
        '<div class="x-toast-icon">' + data.icon + '</div>' +
        '<div class="x-toast-body">' +
          '<div class="x-toast-title">' + data.title + '</div>' +
          '<div class="x-toast-sub">' + data.sub + '</div>' +
          '<div class="x-toast-time">' + data.time + '</div>' +
        '</div>';

      container.appendChild(toast);

      /* Remove old toasts */
      var toasts = container.querySelectorAll('.x-toast:not(.x-toast-out)');
      if (toasts.length > maxVisible) {
        var old = toasts[0];
        old.classList.add('x-toast-out');
        setTimeout(function () {
          if (old.parentNode) old.parentNode.removeChild(old);
        }, 400);
      }

      /* Auto-remove */
      setTimeout(function () {
        if (toast.parentNode) {
          toast.classList.add('x-toast-out');
          setTimeout(function () {
            if (toast.parentNode) toast.parentNode.removeChild(toast);
          }, 400);
        }
      }, 5000);

      /* Schedule next with randomized delay */
      var delay = 8000 + Math.random() * 12000;
      setTimeout(showToast, delay);
    }

    /* First toast after 4 seconds */
    setTimeout(showToast, 4000);
  }

  /* ══════════════════════════════════════════════════════
     8. COACH AVAILABILITY INDICATOR
  ══════════════════════════════════════════════════════ */
  function initCoachStatus() {
    var now = new Date();
    var hour = now.getHours();
    var day = now.getDay();
    var isWeekday = day >= 1 && day <= 5;
    var isOpen = isWeekday && hour >= 5 && hour < 20;

    var richardStatus = isOpen ? 'available' : 'busy';
    var rebeccaStatus = isOpen ? 'available' : 'busy';
    var richardLabel = isOpen ? 'Coaching now' : 'Available Mon-Fri 5AM-8PM';
    var rebeccaLabel = isOpen ? 'Coaching now' : 'Available Mon-Fri 5AM-8PM';

    var html =
      '<div class="x-coach-badge" id="xCoachToggle" role="button" tabindex="0" aria-label="Coach availability">' +
        '<div class="x-coach-dot ' + (isOpen ? 'x-available' : 'x-busy') + '"></div>' +
        '<div>' +
          '<div class="x-coach-name">Coaches ' + (isOpen ? 'Online' : 'Offline') + '</div>' +
          '<div class="x-coach-label">' + (isOpen ? 'Tap to contact' : 'Leave a message') + '</div>' +
        '</div>' +
      '</div>' +
      '<div class="x-coach-expand" id="xCoachExpand">' +
        '<div class="x-coach-expand-title">PPF Coaches</div>' +
        '<div class="x-coach-expand-item">' +
          '<div class="x-coach-dot ' + (richardStatus === 'available' ? 'x-available' : 'x-busy') + '"></div>' +
          '<div class="x-coach-expand-info">' +
            '<div class="x-coach-expand-name">Coach Richard</div>' +
            '<div class="x-coach-expand-role">' + richardLabel + '</div>' +
          '</div>' +
          '<a href="tel:+16789103080" class="x-coach-expand-cta">Call</a>' +
        '</div>' +
        '<div class="x-coach-expand-item">' +
          '<div class="x-coach-dot ' + (rebeccaStatus === 'available' ? 'x-available' : 'x-busy') + '"></div>' +
          '<div class="x-coach-expand-info">' +
            '<div class="x-coach-expand-name">Coach Rebecca</div>' +
            '<div class="x-coach-expand-role">' + rebeccaLabel + '</div>' +
          '</div>' +
          '<a href="tel:+16789389668" class="x-coach-expand-cta">Call</a>' +
        '</div>' +
      '</div>';

    var wrapper = document.createElement('div');
    wrapper.className = 'x-coach-status';
    wrapper.innerHTML = html;
    document.body.appendChild(wrapper);

    var toggle = qs('#xCoachToggle');
    var expand = qs('#xCoachExpand');
    if (toggle && expand) {
      toggle.addEventListener('click', function () {
        expand.classList.toggle('x-open');
      });
      toggle.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          expand.classList.toggle('x-open');
        }
      });
      document.addEventListener('click', function (e) {
        if (!wrapper.contains(e.target)) expand.classList.remove('x-open');
      });
    }
  }

  /* ══════════════════════════════════════════════════════
     9. AI CHATBOT
     Smart pre-built responses
  ══════════════════════════════════════════════════════ */
  var chatResponses = {
    'pricing': 'PPF offers several membership tiers:\n\n• Adult 3x/week: $129/mo\n• Adult 5x/week: $159/mo\n• Athlete 3x/week: $149/mo\n• Athlete 5x/week: $179/mo\n• 1-on-1 Coaching: $85/session\n• Nutrition Add-On: $99/mo\n\nAll paths start with a free 3-Day Experience. Want me to help you choose?',
    'paths': 'PPF has three coaching paths:\n\n⚡ Athlete Path — Speed, power, sport performance for ages 12+\n💪 Adult Path — Coached strength, body composition, real accountability\n🤝 Integrated Path — Adaptive fitness with full dignity\n\nEach path is coached by the same two people who built PPF 20+ years ago.',
    'trial': 'The 3-Day Experience is completely free with zero obligation:\n\n• Day 1: Movement assessment + goal conversation\n• Day 2-3: Full coached sessions in your path\n\nA coach will contact you within 24 hours of signing up. Ready to start?',
    'location': 'PPF Athletics is located at:\n\n📍 7721 Majors Rd, Cumming, GA 30041\n\nWe serve Forsyth County, Alpharetta, Johns Creek, Milton, Roswell, and Suwanee.\n\nHours: Mon-Fri 5:00 AM - 8:00 PM',
    'coaches': 'PPF is coached by two people:\n\n🏋️ Coach Richard — CSCS certified, 20+ years experience, specializes in athlete development and strength\n\n❤️ Coach Rebecca — NCSF certified, specializes in adult performance and integrated/adaptive coaching\n\nBoth coaches hold nationally recognized certifications and have personally coached 500+ athletes.',
    'results': 'Here are some verified PPF results:\n\n⚡ Derek W: 40-yard 4.78s → 4.48s (8 weeks)\n💪 Marcus T: Squat 285 → 365 lbs (12 weeks)\n❤️ Sarah K: Body fat 32% → 22% (6 months)\n🤝 Emma C: Full independence (6 months)\n\nAll results are coach-verified and documented.',
    'default': 'I can help you with:\n\n• Pricing & membership options\n• Our three coaching paths\n• Free 3-Day Experience details\n• Location & hours\n• Coach credentials\n• Verified results\n\nWhat would you like to know?'
  };

  function initChatbot() {
    /* Trigger button */
    var trigger = document.createElement('button');
    trigger.className = 'x-chatbot-trigger';
    trigger.setAttribute('aria-label', 'Chat with PPF');
    trigger.innerHTML =
      '<svg class="x-chat-open" viewBox="0 0 24 24"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>' +
      '<svg class="x-chat-close" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    document.body.appendChild(trigger);

    /* Chat window */
    var chat = document.createElement('div');
    chat.className = 'x-chatbot';
    chat.innerHTML =
      '<div class="x-chatbot-header">' +
        '<div class="x-chatbot-avatar">PPF</div>' +
        '<div class="x-chatbot-header-info">' +
          '<h4>PPF Coach Assistant</h4>' +
          '<span>Typically replies instantly</span>' +
        '</div>' +
      '</div>' +
      '<div class="x-chatbot-messages" id="xChatMessages"></div>' +
      '<div class="x-chatbot-quick-replies" id="xChatQuick">' +
        '<button class="x-quick-reply" data-topic="pricing">💰 Pricing</button>' +
        '<button class="x-quick-reply" data-topic="paths">🛤️ Paths</button>' +
        '<button class="x-quick-reply" data-topic="trial">🎫 Free Trial</button>' +
        '<button class="x-quick-reply" data-topic="location">📍 Location</button>' +
        '<button class="x-quick-reply" data-topic="coaches">👨‍🏫 Coaches</button>' +
        '<button class="x-quick-reply" data-topic="results">📊 Results</button>' +
      '</div>' +
      '<div class="x-chatbot-input">' +
        '<input type="text" id="xChatInput" placeholder="Ask about PPF..." />' +
        '<button id="xChatSend" aria-label="Send message"><svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg></button>' +
      '</div>';
    document.body.appendChild(chat);

    var messages = qs('#xChatMessages');
    var input = qs('#xChatInput');
    var sendBtn = qs('#xChatSend');
    var quickReplies = qs('#xChatQuick');

    /* Toggle chat */
    trigger.addEventListener('click', function () {
      var isOpen = chat.classList.toggle('x-open');
      trigger.classList.toggle('x-active');
      if (isOpen && messages.children.length === 0) {
        addBotMessage('Welcome to PPF Athletics! 👋 I\'m here to help you learn about our coaching paths, pricing, and how to get started.\n\nWhat can I help you with?');
      }
    });

    /* Quick replies */
    quickReplies.addEventListener('click', function (e) {
      var btn = e.target.closest('.x-quick-reply');
      if (!btn) return;
      var topic = btn.dataset.topic;
      addUserMessage(btn.textContent.trim());
      setTimeout(function () {
        addBotMessage(chatResponses[topic] || chatResponses['default']);
      }, 600 + Math.random() * 400);
    });

    /* Send message */
    function sendMessage() {
      var text = input.value.trim();
      if (!text) return;
      addUserMessage(text);
      input.value = '';

      /* Show typing */
      var typing = document.createElement('div');
      typing.className = 'x-chat-msg x-bot';
      typing.innerHTML = '<div class="x-typing"><span></span><span></span><span></span></div>';
      messages.appendChild(typing);
      messages.scrollTop = messages.scrollHeight;

      setTimeout(function () {
        if (typing.parentNode) typing.parentNode.removeChild(typing);
        var response = matchResponse(text);
        addBotMessage(response);
      }, 800 + Math.random() * 600);
    }

    if (sendBtn) sendBtn.addEventListener('click', sendMessage);
    if (input) input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') sendMessage();
    });

    function addUserMessage(text) {
      var msg = document.createElement('div');
      msg.className = 'x-chat-msg x-user';
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function addBotMessage(text) {
      var msg = document.createElement('div');
      msg.className = 'x-chat-msg x-bot';
      msg.textContent = text;
      messages.appendChild(msg);
      messages.scrollTop = messages.scrollHeight;
    }

    function matchResponse(text) {
      var t = text.toLowerCase();
      if (t.indexOf('price') !== -1 || t.indexOf('cost') !== -1 || t.indexOf('member') !== -1 || t.indexOf('how much') !== -1) return chatResponses['pricing'];
      if (t.indexOf('path') !== -1 || t.indexOf('program') !== -1 || t.indexOf('which') !== -1) return chatResponses['paths'];
      if (t.indexOf('trial') !== -1 || t.indexOf('free') !== -1 || t.indexOf('3-day') !== -1 || t.indexOf('start') !== -1 || t.indexOf('try') !== -1) return chatResponses['trial'];
      if (t.indexOf('where') !== -1 || t.indexOf('location') !== -1 || t.indexOf('address') !== -1 || t.indexOf('hour') !== -1) return chatResponses['location'];
      if (t.indexOf('coach') !== -1 || t.indexOf('richard') !== -1 || t.indexOf('rebecca') !== -1 || t.indexOf('who') !== -1) return chatResponses['coaches'];
      if (t.indexOf('result') !== -1 || t.indexOf('proof') !== -1 || t.indexOf('success') !== -1) return chatResponses['results'];
      return chatResponses['default'];
    }
  }

  /* ══════════════════════════════════════════════════════
     10. EXIT-INTENT TECHNOLOGY
     Mouse tracking detects when user is about to leave
  ══════════════════════════════════════════════════════ */
  function initExitIntent() {
    var shown = false;
    var overlay = document.createElement('div');
    overlay.className = 'x-exit-overlay';
    overlay.innerHTML =
      '<div class="x-exit-card">' +
        '<button class="x-exit-close" aria-label="Close">&times;</button>' +
        '<div class="x-exit-icon">🏆</div>' +
        '<div class="x-exit-title">Wait — Don\'t Leave<br/>Without <span>This.</span></div>' +
        '<div class="x-exit-desc">Claim your free 3-Day Coaching Experience. Three coached sessions, zero obligation. See why 85% of people who try PPF become members.</div>' +
        '<div class="x-exit-timer">⏱ This offer is available for <span id="xExitCountdown">15:00</span></div>' +
        '<a href="#start" class="x-exit-cta">CLAIM MY FREE 3-DAY PASS</a>' +
        '<button class="x-exit-decline">No thanks, I\'ll pass on free coaching</button>' +
      '</div>';
    document.body.appendChild(overlay);

    var countdownEl = qs('#xExitCountdown');
    var remaining = 900; /* 15 minutes in seconds */
    var countdownTimer = null;

    function startCountdown() {
      countdownTimer = setInterval(function () {
        remaining--;
        if (remaining <= 0) {
          clearInterval(countdownTimer);
          remaining = 0;
        }
        var m = Math.floor(remaining / 60);
        var s = remaining % 60;
        if (countdownEl) countdownEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
      }, 1000);
    }

    function showExit() {
      if (shown) return;
      shown = true;
      overlay.classList.add('x-open');
      startCountdown();
    }

    function closeExit() {
      overlay.classList.remove('x-open');
      if (countdownTimer) clearInterval(countdownTimer);
    }

    /* Desktop: detect mouse leaving viewport top */
    document.addEventListener('mouseout', function (e) {
      if (e.clientY <= 0 && !shown) {
        /* Wait at least 15 seconds before showing */
        if (performance.now() > 15000) {
          showExit();
        }
      }
    });

    /* Mobile: detect scroll-up-fast near top or back button intent */
    var lastScrollY = 0;
    var scrollUpCount = 0;
    window.addEventListener('scroll', function () {
      var y = window.pageYOffset;
      if (y < lastScrollY && y < 200) {
        scrollUpCount++;
        if (scrollUpCount > 3 && !shown && performance.now() > 20000) {
          showExit();
        }
      } else {
        scrollUpCount = 0;
      }
      lastScrollY = y;
    }, { passive: true });

    /* Close handlers — use event delegation on overlay */
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target.closest('.x-exit-close') || e.target.closest('.x-exit-decline') || e.target.closest('.x-exit-cta')) {
        closeExit();
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     11. ENHANCED FORM EXPERIENCE
     Validation animations, confetti on success
  ══════════════════════════════════════════════════════ */
  function initFormEnhancements() {
    var form = qs('#startForm');
    if (!form) return;

    /* Add check icons to form groups */
    qsa('.form-group', form).forEach(function (group) {
      var check = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      check.setAttribute('viewBox', '0 0 24 24');
      check.setAttribute('fill', 'none');
      check.setAttribute('stroke', 'currentColor');
      check.setAttribute('stroke-width', '2');
      check.setAttribute('class', 'x-check-icon');
      var path = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      path.setAttribute('points', '20 6 9 17 4 12');
      check.appendChild(path);
      group.appendChild(check);
    });

    /* Real-time validation */
    qsa('.form-input', form).forEach(function (input) {
      input.addEventListener('blur', function () {
        validateField(input);
      });
      input.addEventListener('input', function () {
        if (input.classList.contains('x-invalid')) {
          validateField(input);
        }
      });
    });

    function validateField(input) {
      var group = input.closest('.form-group');
      var checkIcon = group ? group.querySelector('.x-check-icon') : null;
      var isValid = false;

      if (input.type === 'email') {
        isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
      } else if (input.tagName === 'SELECT') {
        isValid = input.value !== '';
      } else {
        isValid = input.value.trim().length > 1;
      }

      input.classList.toggle('x-valid', isValid);
      input.classList.toggle('x-invalid', !isValid && input.value.length > 0);

      if (checkIcon) {
        checkIcon.classList.toggle('x-show', isValid);
      }
    }

    /* Confetti on form submission success */
    var formSuccess = qs('#formSuccess');
    if (formSuccess) {
      var originalDisplay = formSuccess.style.display;
      var mo = new MutationObserver(function (mutations) {
        mutations.forEach(function (m) {
          if (m.type === 'attributes' && m.attributeName === 'style') {
            var isVisible = window.getComputedStyle(formSuccess).display !== 'none';
            if (isVisible) fireConfetti();
          }
        });
      });
      mo.observe(formSuccess, { attributes: true, attributeFilter: ['style'] });

      /* Also observe class changes */
      var mo2 = new MutationObserver(function () {
        var isVisible = window.getComputedStyle(formSuccess).display !== 'none';
        if (isVisible) fireConfetti();
      });
      mo2.observe(formSuccess, { attributes: true, attributeFilter: ['class'] });
    }
  }

  /* Simple confetti effect */
  function fireConfetti() {
    if (prefersReduced) return;
    var canvas = document.createElement('canvas');
    canvas.className = 'x-confetti-canvas';
    document.body.appendChild(canvas);
    var ctx = canvas.getContext('2d');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    var particles = [];
    var colors = ['#ff5500', '#ff8844', '#ffaa66', '#ffffff', '#50c878', '#6a8fff', '#d4a853'];

    for (var i = 0; i < 120; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 200,
        y: canvas.height / 2,
        vx: (Math.random() - 0.5) * 20,
        vy: -Math.random() * 18 - 5,
        w: Math.random() * 8 + 3,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 15,
        gravity: 0.3 + Math.random() * 0.2,
        life: 1
      });
    }

    var startTime = performance.now();

    function draw(now) {
      var elapsed = now - startTime;
      if (elapsed > 3000) {
        if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach(function (p) {
        p.x += p.vx;
        p.vy += p.gravity;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        p.life = Math.max(0, 1 - elapsed / 3000);

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  /* ══════════════════════════════════════════════════════
     12. ENHANCED PASSPORT QUIZ — Confidence Meter
  ══════════════════════════════════════════════════════ */
  function initPassportEnhancements() {
    var quizEl = qs('#passportQuiz');
    if (!quizEl) return;

    /* Add confidence meter below quiz */
    var confidence = document.createElement('div');
    confidence.className = 'x-confidence';
    confidence.style.display = 'none';
    confidence.innerHTML =
      '<div class="x-confidence-label">AI Confidence</div>' +
      '<div class="x-confidence-bar"><div class="x-confidence-fill" id="xConfFill"></div></div>' +
      '<div class="x-confidence-pct" id="xConfPct">0%</div>';
    quizEl.parentNode.insertBefore(confidence, quizEl.nextSibling);

    /* Track answers */
    var answered = 0;
    quizEl.addEventListener('click', function (e) {
      var opt = e.target.closest('.passport-option');
      if (!opt) return;

      /* Count unique steps answered */
      var step = opt.closest('.passport-step');
      if (step && !step.dataset.answered) {
        step.dataset.answered = '1';
        answered++;
      }

      confidence.style.display = 'flex';
      var pct = Math.min(Math.round((answered / 5) * 100), 100);
      var fill = qs('#xConfFill');
      var pctEl = qs('#xConfPct');
      if (fill) fill.style.width = pct + '%';
      if (pctEl) pctEl.textContent = pct + '%';

      /* Add prediction after 3 answers */
      if (answered >= 3) {
        var existing = qs('.x-prediction');
        if (!existing) {
          var prediction = document.createElement('div');
          prediction.className = 'x-prediction';
          prediction.innerHTML = '📊 <strong>Prediction:</strong> Based on your profile, members like you typically see measurable results within the first 8-12 weeks of consistent training.';
          confidence.parentNode.insertBefore(prediction, confidence.nextSibling);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     13. ACHIEVEMENT BADGE SYSTEM
     Unlockable badges based on site interaction
  ══════════════════════════════════════════════════════ */
  function initAchievements() {
    var popup = document.createElement('div');
    popup.className = 'x-achievement-popup';
    popup.innerHTML =
      '<div class="x-achievement-icon" id="xAchIcon">🏅</div>' +
      '<div class="x-achievement-body">' +
        '<h4 id="xAchTitle">Achievement Unlocked</h4>' +
        '<p id="xAchDesc">Description</p>' +
      '</div>';
    document.body.appendChild(popup);

    var achievements = {
      explorer: { icon: '🔍', title: 'Explorer', desc: 'You explored 3+ sections of PPF', shown: false },
      quiz_start: { icon: '📋', title: 'Assessment Started', desc: 'You began the Performance Passport', shown: false },
      scroll_master: { icon: '📜', title: 'Deep Diver', desc: 'You scrolled through 75% of the site', shown: false },
      engaged: { icon: '⚡', title: 'Engaged', desc: 'You spent 60+ seconds on the site', shown: false }
    };

    function showAchievement(key) {
      var ach = achievements[key];
      if (!ach || ach.shown) return;
      ach.shown = true;

      var iconEl = qs('#xAchIcon');
      var titleEl = qs('#xAchTitle');
      var descEl = qs('#xAchDesc');
      if (iconEl) iconEl.textContent = ach.icon;
      if (titleEl) titleEl.textContent = ach.title;
      if (descEl) descEl.textContent = ach.desc;
      popup.classList.add('x-show');

      setTimeout(function () {
        popup.classList.remove('x-show');
      }, 4000);
    }

    /* Explorer: visited 3+ sections */
    var visitedSections = new Set();
    var sectionObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          visitedSections.add(entry.target.id);
          if (visitedSections.size >= 3) showAchievement('explorer');
        }
      });
    }, { threshold: 0.3 });
    qsa('.section[id]').forEach(function (s) { sectionObserver.observe(s); });

    /* Quiz start */
    var quizEl = qs('#passportQuiz');
    if (quizEl) {
      quizEl.addEventListener('click', function (e) {
        if (e.target.closest('.passport-option')) showAchievement('quiz_start');
      });
    }

    /* Scroll master: 75% of page */
    var scrollChecked = false;
    window.addEventListener('scroll', function () {
      if (scrollChecked) return;
      var scrollPct = (window.pageYOffset + window.innerHeight) / document.documentElement.scrollHeight;
      if (scrollPct > 0.75) {
        scrollChecked = true;
        showAchievement('scroll_master');
      }
    }, { passive: true });

    /* Engaged: 60 seconds on site */
    setTimeout(function () {
      showAchievement('engaged');
    }, 60000);
  }

  /* ══════════════════════════════════════════════════════
     14. TRANSFORMATION CALCULATOR
     Interactive projection tool
  ══════════════════════════════════════════════════════ */
  function initTransformationCalc() {
    var section = qs('#xCalcSection');
    if (!section) return;

    var form = qs('#xCalcForm');
    var results = qs('#xCalcResults');
    if (!form || !results) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var path = qs('#xCalcPath', form).value;
      var goal = qs('#xCalcGoal', form).value;
      var days = parseInt(qs('#xCalcDays', form).value) || 3;
      var level = qs('#xCalcLevel', form).value;

      if (!path || !goal) return;

      /* Generate projections */
      var projections = generateProjections(path, goal, days, level);
      renderResults(projections);
      results.classList.add('x-active');
      results.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });

    function generateProjections(path, goal, days, level) {
      var multiplier = days >= 5 ? 1.4 : days >= 4 ? 1.2 : days >= 3 ? 1.0 : 0.8;
      var levelBoost = level === 'beginner' ? 1.2 : level === 'advanced' ? 0.8 : 1.0;
      var base = multiplier * levelBoost;

      var result = { milestones: [] };

      if (goal === 'speed') {
        result.stat1 = { label: 'Speed Improvement', value: Math.round(base * 8) + '%', change: '↓ faster splits' };
        result.stat2 = { label: '40-Yard Projection', value: '-' + (base * 0.25).toFixed(2) + 's', change: 'in 12 weeks' };
        result.stat3 = { label: 'Power Output', value: '+' + Math.round(base * 15) + '%', change: 'force production' };
        result.stat4 = { label: 'Agility Score', value: '+' + Math.round(base * 12) + '%', change: 'change of direction' };
        result.milestones = [
          { week: 'Week 4', pct: 25, text: 'Movement mechanics rebuilt' },
          { week: 'Week 8', pct: 50, text: 'First speed test improvement' },
          { week: 'Week 12', pct: 75, text: 'Measurable 40-yard drop' },
          { week: 'Week 24', pct: 100, text: 'Peak speed performance' }
        ];
      } else if (goal === 'strength') {
        result.stat1 = { label: 'Strength Gain', value: '+' + Math.round(base * 20) + '%', change: 'compound lifts' };
        result.stat2 = { label: 'Squat Projection', value: '+' + Math.round(base * 60) + ' lbs', change: 'in 12 weeks' };
        result.stat3 = { label: 'Deadlift Projection', value: '+' + Math.round(base * 70) + ' lbs', change: 'in 12 weeks' };
        result.stat4 = { label: 'Power Index', value: '+' + Math.round(base * 25) + '%', change: 'overall' };
        result.milestones = [
          { week: 'Week 4', pct: 25, text: 'Movement patterns established' },
          { week: 'Week 8', pct: 55, text: 'First strength PR' },
          { week: 'Week 12', pct: 75, text: 'Significant strength gains' },
          { week: 'Week 24', pct: 100, text: 'Major milestone lifts' }
        ];
      } else if (goal === 'health') {
        result.stat1 = { label: 'Body Fat Reduction', value: '-' + Math.round(base * 6) + '%', change: 'projected' };
        result.stat2 = { label: 'Lean Mass', value: '+' + Math.round(base * 5) + ' lbs', change: 'muscle gain' };
        result.stat3 = { label: 'Energy Level', value: '+' + Math.round(base * 40) + '%', change: 'daily energy' };
        result.stat4 = { label: 'Consistency', value: Math.round(85 + base * 5) + '%', change: 'attendance rate' };
        result.milestones = [
          { week: 'Week 4', pct: 20, text: 'Habits formed, energy up' },
          { week: 'Week 8', pct: 45, text: 'Visible body changes' },
          { week: 'Week 16', pct: 70, text: 'Major composition shift' },
          { week: 'Week 24', pct: 100, text: 'Full transformation' }
        ];
      } else {
        result.stat1 = { label: 'Coordination', value: '+' + Math.round(base * 50) + '%', change: 'improvement' };
        result.stat2 = { label: 'Independence', value: '+' + Math.round(base * 3) + ' tasks', change: 'self-managed' };
        result.stat3 = { label: 'Confidence', value: '+' + Math.round(base * 60) + '%', change: 'self-reported' };
        result.stat4 = { label: 'Engagement', value: Math.round(90 + base * 5) + '%', change: 'session rate' };
        result.milestones = [
          { week: 'Week 4', pct: 25, text: 'Comfort with routine' },
          { week: 'Week 8', pct: 50, text: 'New skills emerging' },
          { week: 'Week 16', pct: 75, text: 'Visible independence gains' },
          { week: 'Week 24', pct: 100, text: 'Milestone independence' }
        ];
      }

      return result;
    }

    function renderResults(p) {
      var stats = [p.stat1, p.stat2, p.stat3, p.stat4];
      var projHTML = stats.map(function (s) {
        return '<div class="x-calc-stat">' +
          '<div class="x-calc-stat-label">' + s.label + '</div>' +
          '<div class="x-calc-stat-value">' + s.value + '</div>' +
          '<div class="x-calc-stat-change">' + s.change + '</div>' +
        '</div>';
      }).join('');

      var msHTML = p.milestones.map(function (m) {
        return '<div class="x-calc-milestone">' +
          '<div class="x-calc-milestone-week">' + m.week + '</div>' +
          '<div class="x-calc-milestone-bar"><div class="x-calc-milestone-fill" data-width="' + m.pct + '%"></div></div>' +
          '<div class="x-calc-milestone-text">' + m.text + '</div>' +
        '</div>';
      }).join('');

      results.innerHTML =
        '<div class="x-calc-results-title">YOUR PROJECTED JOURNEY</div>' +
        '<div class="x-calc-projection">' + projHTML + '</div>' +
        '<div class="x-calc-timeline">' +
          '<div class="x-calc-timeline-title">Milestone Roadmap</div>' +
          msHTML +
        '</div>' +
        '<a href="#start" class="x-calc-cta">START YOUR 3-DAY EXPERIENCE →</a>';

      /* Animate milestone bars */
      setTimeout(function () {
        qsa('.x-calc-milestone-fill', results).forEach(function (bar) {
          bar.style.width = bar.dataset.width;
        });
      }, 200);
    }
  }

  /* ══════════════════════════════════════════════════════
     15. ROADMAP BUILDER
     Drag-and-drop 90-day planner
  ══════════════════════════════════════════════════════ */
  function initRoadmapBuilder() {
    var builder = qs('#xRoadmapBuilder');
    if (!builder) return;

    var palette = qs('.x-roadmap-palette', builder);
    var weeks = qsa('.x-roadmap-week-items', builder);
    var successEl = qs('.x-roadmap-success-rate', builder);
    var placedCount = 0;

    qsa('.x-roadmap-item', palette).forEach(function (item) {
      item.setAttribute('draggable', 'true');

      item.addEventListener('dragstart', function (e) {
        e.dataTransfer.setData('text/plain', item.dataset.activity);
        e.dataTransfer.setData('text/html', item.innerHTML);
        item.style.opacity = '0.5';
      });

      item.addEventListener('dragend', function () {
        item.style.opacity = '1';
      });

      /* Touch support */
      item.addEventListener('click', function () {
        /* Find first empty week */
        for (var i = 0; i < weeks.length; i++) {
          if (weeks[i].children.length < 3) {
            placeItem(weeks[i], item.dataset.activity, item.querySelector('.x-roadmap-item-icon').textContent);
            break;
          }
        }
      });
    });

    weeks.forEach(function (week) {
      var weekContainer = week.parentNode;

      weekContainer.addEventListener('dragover', function (e) {
        e.preventDefault();
        weekContainer.classList.add('x-drag-over');
      });

      weekContainer.addEventListener('dragleave', function () {
        weekContainer.classList.remove('x-drag-over');
      });

      weekContainer.addEventListener('drop', function (e) {
        e.preventDefault();
        weekContainer.classList.remove('x-drag-over');
        var activity = e.dataTransfer.getData('text/plain');
        if (activity && week.children.length < 3) {
          placeItem(week, activity, '');
        }
      });
    });

    function placeItem(container, activity, icon) {
      var placed = document.createElement('div');
      placed.className = 'x-roadmap-placed';
      placed.textContent = (icon ? icon + ' ' : '') + activity;
      container.appendChild(placed);
      placedCount++;

      /* Update success rate */
      var rate = Math.min(94, 60 + placedCount * 4);
      if (successEl) {
        successEl.textContent = '✓ This schedule has a ' + rate + '% success rate based on similar members';
        successEl.style.display = 'block';
      }
    }
  }

  /* ══════════════════════════════════════════════════════
     16. TRUST BADGES & SATISFACTION METER
  ══════════════════════════════════════════════════════ */
  function initTrustBadges() {
    var authority = qs('#authority');
    if (!authority) return;

    /* Add trust badges after authority section */
    var badgesHTML =
      '<div class="x-trust-badges x-stagger">' +
        '<div class="x-trust-badge">' +
          '<div class="x-trust-badge-icon">🏆</div>' +
          '<div><div class="x-trust-badge-text">CSCS Certified</div><div class="x-trust-badge-sub">Coach Richard</div></div>' +
        '</div>' +
        '<div class="x-trust-badge">' +
          '<div class="x-trust-badge-icon">🏅</div>' +
          '<div><div class="x-trust-badge-text">NCSF Certified</div><div class="x-trust-badge-sub">Coach Rebecca</div></div>' +
        '</div>' +
        '<div class="x-trust-badge">' +
          '<div class="x-trust-badge-icon">📊</div>' +
          '<div><div class="x-trust-badge-text">500+ Athletes</div><div class="x-trust-badge-sub">Trained &amp; Verified</div></div>' +
        '</div>' +
        '<div class="x-trust-badge">' +
          '<div class="x-trust-badge-icon">⭐</div>' +
          '<div><div class="x-trust-badge-text">20+ Years</div><div class="x-trust-badge-sub">Coaching Excellence</div></div>' +
        '</div>' +
      '</div>' +
      '<div class="x-satisfaction-meter">' +
        '<div class="x-meter-ring" id="xMeterRing">' +
          '<svg viewBox="0 0 64 64">' +
            '<circle class="x-meter-bg" cx="32" cy="32" r="30" />' +
            '<circle class="x-meter-fill" cx="32" cy="32" r="30" />' +
          '</svg>' +
          '<div class="x-meter-val">99.2%</div>' +
        '</div>' +
        '<div class="x-meter-label"><strong>99.2%</strong> member satisfaction rate</div>' +
      '</div>';

    var container = authority.querySelector('.ppf-authority__inner') || authority;
    var div = document.createElement('div');
    div.innerHTML = badgesHTML;
    container.appendChild(div);

    /* Animate meter when visible */
    var ring = qs('#xMeterRing');
    if (ring) {
      var meterObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          ring.classList.add('x-visible');
          meterObs.unobserve(ring);
        }
      }, { threshold: 0.5 });
      meterObs.observe(ring);
    }
  }

  /* ══════════════════════════════════════════════════════
     17. VERIFIED RESULT BADGES
     Add verification badges to proof entries
  ══════════════════════════════════════════════════════ */
  function initVerifiedBadges() {
    qsa('.ba-meta').forEach(function (meta) {
      var badge = document.createElement('span');
      badge.className = 'x-verified-badge';
      badge.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="x-verified-check"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> VERIFIED';
      meta.appendChild(document.createTextNode(' · '));
      meta.appendChild(badge);
    });

    qsa('.live-board__entry-badge').forEach(function (badge) {
      var verified = document.createElement('div');
      verified.className = 'x-verified-badge';
      verified.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="x-verified-check"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> Verified';
      badge.parentNode.insertBefore(verified, badge.nextSibling);
    });
  }

  /* ══════════════════════════════════════════════════════
     18. PARTICLE BACKGROUND
     Subtle floating particles for premium feel
  ══════════════════════════════════════════════════════ */
  function initParticles() {
    if (prefersReduced) return;

    var canvas = document.createElement('canvas');
    canvas.className = 'x-particles-canvas';
    document.body.insertBefore(canvas, document.body.firstChild);
    var ctx = canvas.getContext('2d');
    var particles = [];
    var w, h;

    function resize() {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    /* Create particles */
    var count = Math.min(40, Math.floor(w / 30));
    for (var i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 1.5 + 0.5,
        a: Math.random() * 0.3 + 0.05
      });
    }

    var running = true;
    var visObs = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    });
    visObs.observe(canvas);

    function draw() {
      if (!running) { requestAnimationFrame(draw); return; }

      ctx.clearRect(0, 0, w, h);

      particles.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 85, 0, ' + p.a + ')';
        ctx.fill();
      });

      /* Draw connections */
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = 'rgba(255, 85, 0, ' + (0.03 * (1 - dist / 150)) + ')';
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(draw);
    }

    requestAnimationFrame(draw);
  }

  /* ══════════════════════════════════════════════════════
     19. PARALLAX SCROLL EFFECT
     Subtle depth on backgrounds
  ══════════════════════════════════════════════════════ */
  function initParallax() {
    if (prefersReduced) return;

    var heroContent = qs('.hero-content');
    var heroMetrics = qs('.hero-metrics');
    var proofWall = qs('.proof-wall');
    var ticking = false;

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(function () {
          var y = window.pageYOffset;

          if (heroContent && y < window.innerHeight) {
            heroContent.style.transform = 'translateY(' + (y * 0.15) + 'px)';
            heroContent.style.opacity = 1 - (y / (window.innerHeight * 0.8));
          }
          if (heroMetrics && y < window.innerHeight) {
            heroMetrics.style.transform = 'translateY(' + (y * 0.08) + 'px)';
          }

          ticking = false;
        });
      }
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     20. MOBILE GESTURE SUPPORT
     Swipe navigation for path cards
  ══════════════════════════════════════════════════════ */
  function initGestures() {
    if (!('ontouchstart' in window)) return;

    var pathSelector = qs('#pathsSelector');
    if (!pathSelector) return;

    var startX, startY, pathCards = qsa('.path-card', pathSelector);
    var currentIndex = 0;

    pathSelector.addEventListener('touchstart', function (e) {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });

    pathSelector.addEventListener('touchend', function (e) {
      if (!startX) return;
      var dx = e.changedTouches[0].clientX - startX;
      var dy = e.changedTouches[0].clientY - startY;

      /* Only horizontal swipes */
      if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 50) {
        if (dx < 0 && currentIndex < pathCards.length - 1) {
          currentIndex++;
        } else if (dx > 0 && currentIndex > 0) {
          currentIndex--;
        }

        pathCards[currentIndex].scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center'
        });
      }

      startX = null;
    }, { passive: true });
  }

  /* ══════════════════════════════════════════════════════
     21. LIVE BOARD ENTRY ROTATION
     Periodically add "new" entries with animation
  ══════════════════════════════════════════════════════ */
  function initLiveBoardRotation() {
    var board = qs('.live-board__entries');
    if (!board) return;

    var entries = qsa('.live-board__entry', board);
    if (!entries.length) return;

    var running = true;
    var rotObs = new IntersectionObserver(function (e) {
      running = e[0].isIntersecting;
    });
    rotObs.observe(board);

    var rotationInterval = setInterval(function () {
      if (!running || document.hidden) return;

      /* Move last to first with animation */
      var last = board.lastElementChild;
      if (last) {
        board.insertBefore(last, board.firstChild);
        last.classList.add('x-new-entry');
        setTimeout(function () {
          last.classList.remove('x-new-entry');
        }, 600);
      }
    }, 6000);
  }

  /* ══════════════════════════════════════════════════════
     22. SMOOTH ANCHOR SCROLLING
     Override default anchor behavior
  ══════════════════════════════════════════════════════ */
  function initSmoothAnchors() {
    document.addEventListener('click', function (e) {
      var link = e.target.closest('a[href^="#"]');
      if (!link) return;
      var id = link.getAttribute('href').substring(1);
      var target = document.getElementById(id);
      if (!target) return;
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  /* ══════════════════════════════════════════════════════
     23. LAZY IMAGE LOADING WITH BLUR-UP
  ══════════════════════════════════════════════════════ */
  function initLazyImages() {
    qsa('img[loading="lazy"]').forEach(function (img) {
      img.classList.add('x-lazy-img');
      if (img.complete) {
        img.classList.add('x-loaded');
      } else {
        img.addEventListener('load', function () {
          img.classList.add('x-loaded');
        });
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     24. SECTION DIVIDERS
     Animated glow dividers between major sections
  ══════════════════════════════════════════════════════ */
  function initSectionDividers() {
    qsa('.env-transition').forEach(function (el) {
      el.classList.add('x-section-divider');
    });
  }

  /* ══════════════════════════════════════════════════════
     25. FAQ SMOOTH ANIMATIONS
     Enhanced accordion behavior
  ══════════════════════════════════════════════════════ */
  function initFaqAnimations() {
    qsa('.faq-answer').forEach(function (answer) {
      answer.style.maxHeight = '0';
      answer.style.overflow = 'hidden';
      answer.style.transition = 'max-height 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease';
      answer.style.opacity = '0';
    });

    qsa('.faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var answer = btn.nextElementSibling;
        if (!answer) return;
        var isOpen = btn.getAttribute('aria-expanded') === 'true';

        /* Close all others */
        qsa('.faq-question').forEach(function (other) {
          if (other !== btn) {
            other.setAttribute('aria-expanded', 'false');
            var otherAnswer = other.nextElementSibling;
            if (otherAnswer) {
              otherAnswer.style.maxHeight = '0';
              otherAnswer.style.opacity = '0';
            }
          }
        });

        btn.setAttribute('aria-expanded', !isOpen);
        if (!isOpen) {
          answer.style.maxHeight = answer.scrollHeight + 'px';
          answer.style.opacity = '1';
        } else {
          answer.style.maxHeight = '0';
          answer.style.opacity = '0';
        }
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     26. STAGGER-TAG EXISTING GRIDS
     Auto-apply stagger classes to grid containers
  ══════════════════════════════════════════════════════ */
  function initStaggerGrids() {
    var grids = [
      '.fm-grid',
      '.cta-branch__grid',
      '.member-preview__grid',
      '.proof-before-after',
      '.eco-social-links',
      '.x-trust-badges'
    ];
    grids.forEach(function (sel) {
      var el = qs(sel);
      if (el && !el.classList.contains('x-stagger')) {
        el.classList.add('x-stagger');
        var children = el.children;
        for (var i = 0; i < children.length; i++) {
          children[i].style.setProperty('--x-i', i);
        }
      }
    });
  }

  /* ══════════════════════════════════════════════════════
     27. INTERACTIVE FLOOR MAP HOTSPOTS (3D-STYLE TOUR)
     Click zones to see coach commentary + video hints
  ══════════════════════════════════════════════════════ */
  function initFloorMapTour() {
    var zones = qsa('.fm-zone');
    if (!zones.length) return;

    var activeZone = null;

    /* Add 360° tour badge to floor map header */
    var fmHeader = qs('.fm-header');
    if (fmHeader) {
      var tourBadge = document.createElement('div');
      tourBadge.className = 'x-tour-badge x-reveal';
      tourBadge.innerHTML = '<span class="x-tour-badge-dot"></span> INTERACTIVE FACILITY TOUR — Click any zone to explore';
      fmHeader.appendChild(tourBadge);
    }

    zones.forEach(function (zone) {
      /* Add hotspot indicator */
      var hotspot = document.createElement('div');
      hotspot.className = 'x-hotspot-indicator';
      hotspot.innerHTML = '<span class="x-hotspot-ring"></span><span class="x-hotspot-label">TAP TO EXPLORE</span>';
      zone.insertBefore(hotspot, zone.firstChild);

      zone.addEventListener('click', function () {
        var isActive = zone.classList.contains('x-zone-active');

        /* Close any open zone */
        zones.forEach(function (z) {
          z.classList.remove('x-zone-active');
        });

        if (!isActive) {
          zone.classList.add('x-zone-active');
          activeZone = zone;

          /* Add immersive zone overlay if not present */
          if (!zone.querySelector('.x-zone-overlay')) {
            var overlay = document.createElement('div');
            overlay.className = 'x-zone-overlay';
            var zoneName = zone.dataset.zone || '';
            var coachQuote = zone.querySelector('.fm-zone-coach');
            overlay.innerHTML =
              '<div class="x-zone-overlay-inner">' +
                '<div class="x-zone-360-badge">🔄 360° VIEW</div>' +
                '<div class="x-zone-energy">' +
                  '<span class="x-zone-energy-label">ENERGY LEVEL</span>' +
                  '<div class="x-zone-energy-bar"><div class="x-zone-energy-fill" data-energy="' + getZoneEnergy(zoneName) + '"></div></div>' +
                '</div>' +
                (coachQuote ? '<div class="x-zone-coach-clip">🎥 ' + coachQuote.textContent + '</div>' : '') +
              '</div>';
            zone.querySelector('.fm-zone-detail').appendChild(overlay);

            /* Animate energy bar */
            setTimeout(function () {
              var fill = overlay.querySelector('.x-zone-energy-fill');
              if (fill) fill.style.width = fill.dataset.energy;
            }, 100);
          }
        }
      });
    });

    function getZoneEnergy(zone) {
      var energies = {
        sprint: '95%', platform: '85%', agility: '90%',
        conditioning: '88%', movement: '75%', assessment: '60%'
      };
      return energies[zone] || '80%';
    }
  }

  /* ══════════════════════════════════════════════════════
     28. REAL-TIME LIVE LEADERBOARD DASHBOARD
     Animated scoreboard with live PR updates
  ══════════════════════════════════════════════════════ */
  function initLiveLeaderboard() {
    var board = qs('.live-board__inner');
    if (!board) return;

    /* Add live dashboard header with animated pulse */
    var header = qs('.live-board__header', board);
    if (header) {
      var dashboard = document.createElement('div');
      dashboard.className = 'x-live-dashboard';
      dashboard.innerHTML =
        '<div class="x-live-stats">' +
          '<div class="x-live-stat">' +
            '<div class="x-live-stat-num" id="xLivePRs">12</div>' +
            '<div class="x-live-stat-label">PRs This Week</div>' +
          '</div>' +
          '<div class="x-live-stat">' +
            '<div class="x-live-stat-num" id="xLiveActive">8</div>' +
            '<div class="x-live-stat-label">Members Active Today</div>' +
          '</div>' +
          '<div class="x-live-stat">' +
            '<div class="x-live-stat-num" id="xLiveStreak">47</div>' +
            '<div class="x-live-stat-label">Day Community Streak</div>' +
          '</div>' +
        '</div>';
      header.appendChild(dashboard);

      /* Periodically increment counters for live feel */
      var running = true;
      var dbObs = new IntersectionObserver(function (e) { running = e[0].isIntersecting; });
      dbObs.observe(board);

      var prEl = qs('#xLivePRs');
      var activeEl = qs('#xLiveActive');
      var streakEl = qs('#xLiveStreak');
      var prCount = 12;

      var liveInterval = setInterval(function () {
        if (!running || document.hidden) return;
        /* Randomly bump PRs */
        if (Math.random() > 0.7) {
          prCount++;
          if (prEl) {
            prEl.textContent = prCount;
            prEl.classList.add('x-counting');
            setTimeout(function () { prEl.classList.remove('x-counting'); }, 400);
          }
        }
        /* Fluctuate active members */
        if (activeEl) {
          var active = 6 + Math.floor(Math.random() * 6);
          activeEl.textContent = active;
        }
      }, 8000);
    }
  }

  /* ══════════════════════════════════════════════════════
     29. DYNAMIC PRICING & MEMBERSHIP COMPARISON
     Best value glow, savings calculator
  ══════════════════════════════════════════════════════ */
  function initDynamicPricing() {
    /* Find membership cards and highlight best value */
    var msSection = qs('#memberships');
    if (!msSection) return;

    /* Look for tab panels or pricing cards */
    var cards = qsa('.ppf-ms__plan, .ms-pc-card, [data-plan]', msSection);
    if (!cards.length) {
      /* Try finding CTA buttons or plan elements */
      var allBtns = qsa('a[href*="checkout"]', msSection);
      if (allBtns.length >= 2) {
        /* Mark the second button's parent as best value (typically the higher-usage plan) */
        var bestParent = allBtns[1].closest('.ppf-ms__plan, .ppf-ms__col, div');
        if (bestParent) bestParent.classList.add('x-best-value');
      }
    }

    /* Add savings calculator to membership section */
    var msInner = msSection.querySelector('.container') || msSection;
    var calcDiv = document.createElement('div');
    calcDiv.className = 'x-savings-calc x-reveal';
    calcDiv.innerHTML =
      '<div class="x-savings-inner">' +
        '<div class="x-savings-icon">💰</div>' +
        '<div class="x-savings-text">' +
          '<strong>Save up to $240/year</strong> with a 6-month commitment vs. month-to-month' +
        '</div>' +
        '<div class="x-savings-roi">' +
          'Your investment → <strong class="x-savings-highlight">Measurable results in 8-12 weeks</strong>' +
        '</div>' +
      '</div>';
    msInner.appendChild(calcDiv);
  }

  /* ══════════════════════════════════════════════════════
     30. PERSONALIZED VIDEO CONTENT FEED
     Enhanced media gallery with adaptive recommendations
  ══════════════════════════════════════════════════════ */
  function initVideoFeed() {
    var gallery = qs('#mediaGallery');
    if (!gallery) return;

    /* Add personalized recommendation bar */
    var inner = gallery.querySelector('.media-gallery__inner');
    if (!inner) return;

    var recBar = document.createElement('div');
    recBar.className = 'x-video-rec x-reveal';
    recBar.innerHTML =
      '<div class="x-video-rec-badge">🎯 RECOMMENDED FOR YOU</div>' +
      '<div class="x-video-rec-text">Based on your browsing, you might be interested in sprint mechanics content</div>';
    inner.insertBefore(recBar, inner.querySelector('.media-gallery__grid'));

    /* Add view counter and engagement tracking to each video */
    qsa('.media-gallery__item', gallery).forEach(function (item, i) {
      var engagement = document.createElement('div');
      engagement.className = 'x-video-engagement';
      var views = Math.floor(Math.random() * 500) + 100;
      engagement.innerHTML = '<span class="x-video-views">👁 ' + views + ' views</span>';
      item.appendChild(engagement);
    });

    /* Track which sections user has viewed for "personalization" */
    var viewedPaths = [];
    var sectionObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          if (id && viewedPaths.indexOf(id) === -1) {
            viewedPaths.push(id);
          }
          /* Update recommendation based on viewed sections */
          if (viewedPaths.indexOf('proof') !== -1 || viewedPaths.indexOf('benchmarkBoard') !== -1) {
            var recText = recBar.querySelector('.x-video-rec-text');
            if (recText) recText.textContent = 'You\'ve been exploring performance data — here are transformation videos matching your interests';
          }
        }
      });
    }, { threshold: 0.3 });
    qsa('#proof, #paths, #benchmarkBoard, #coachingWall').forEach(function (s) {
      if (s) sectionObs.observe(s);
    });
  }

  /* ══════════════════════════════════════════════════════
     31. LIVE SOCIAL FEED INTEGRATION
     Animated social proof with real-time feel
  ══════════════════════════════════════════════════════ */
  function initSocialFeed() {
    var social = qs('#social');
    if (!social) return;

    var container = social.querySelector('.container');
    if (!container) return;

    /* Add animated social metrics */
    var metrics = document.createElement('div');
    metrics.className = 'x-social-metrics x-stagger';
    metrics.innerHTML =
      '<div class="x-social-metric">' +
        '<div class="x-social-metric-icon">📸</div>' +
        '<div class="x-social-metric-num" data-target="2400">2,400+</div>' +
        '<div class="x-social-metric-label">Community Posts</div>' +
      '</div>' +
      '<div class="x-social-metric">' +
        '<div class="x-social-metric-icon">❤️</div>' +
        '<div class="x-social-metric-num" data-target="15000">15K+</div>' +
        '<div class="x-social-metric-label">Engagements</div>' +
      '</div>' +
      '<div class="x-social-metric">' +
        '<div class="x-social-metric-icon">🏆</div>' +
        '<div class="x-social-metric-num" data-target="340">340+</div>' +
        '<div class="x-social-metric-label">Transformations Shared</div>' +
      '</div>';

    var links = container.querySelector('.eco-social-bar');
    if (links) {
      container.insertBefore(metrics, links);
    } else {
      container.appendChild(metrics);
    }

    /* Add recent activity feed */
    var feed = document.createElement('div');
    feed.className = 'x-social-feed x-reveal';
    feed.innerHTML =
      '<div class="x-social-feed-title">RECENT COMMUNITY ACTIVITY</div>' +
      '<div class="x-social-feed-items" id="xSocialFeed">' +
        '<div class="x-social-feed-item">📸 @derek_speed just posted a sprint mechanics video</div>' +
        '<div class="x-social-feed-item">🏋️ @sarah_transform shared her 6-month progress</div>' +
        '<div class="x-social-feed-item">💪 @marcus_strong celebrated a new squat PR</div>' +
      '</div>';
    container.appendChild(feed);
  }

  /* ══════════════════════════════════════════════════════
     32. "DAY IN THE LIFE" INTERACTIVE EXPERIENCE
     Animated timeline of a member's day at PPF
  ══════════════════════════════════════════════════════ */
  function initDayInLife() {
    var expSection = qs('#experience');
    if (!expSection) return;

    /* Add interactive day-in-life timeline after experience days */
    var days = expSection.querySelector('.experience-days');
    if (!days) return;

    var timeline = document.createElement('div');
    timeline.className = 'x-day-timeline x-reveal';
    timeline.innerHTML =
      '<div class="x-day-timeline-title">A DAY AT PPF</div>' +
      '<div class="x-day-timeline-track">' +
        '<div class="x-day-moment x-day-moment--active" data-time="5:15 AM">' +
          '<div class="x-day-time">5:15 AM</div>' +
          '<div class="x-day-event">Early Bird Class</div>' +
          '<div class="x-day-desc">First athletes arrive. Warm-up protocol begins on the turf.</div>' +
        '</div>' +
        '<div class="x-day-moment" data-time="7:00 AM">' +
          '<div class="x-day-time">7:00 AM</div>' +
          '<div class="x-day-event">Adult Strength Session</div>' +
          '<div class="x-day-desc">Coach Rebecca leads the platform. Every rep coached and cued.</div>' +
        '</div>' +
        '<div class="x-day-moment" data-time="3:30 PM">' +
          '<div class="x-day-time">3:30 PM</div>' +
          '<div class="x-day-event">After-School Athletes</div>' +
          '<div class="x-day-desc">Sprint lane fires up. Timing gates set. Speed development in full swing.</div>' +
        '</div>' +
        '<div class="x-day-moment" data-time="5:00 PM">' +
          '<div class="x-day-time">5:00 PM</div>' +
          '<div class="x-day-event">Peak Hour Training</div>' +
          '<div class="x-day-desc">The floor is full. Athletes, adults, integrated — all coached to the same standard.</div>' +
        '</div>' +
        '<div class="x-day-moment" data-time="7:00 PM">' +
          '<div class="x-day-time">7:00 PM</div>' +
          '<div class="x-day-event">Evening Conditioning</div>' +
          '<div class="x-day-desc">Last session of the day. Sleds, rowers, structured intervals. The grind continues.</div>' +
        '</div>' +
      '</div>';

    days.parentNode.insertBefore(timeline, days.nextSibling);

    /* Make moments interactive */
    qsa('.x-day-moment', timeline).forEach(function (moment) {
      moment.addEventListener('click', function () {
        qsa('.x-day-moment', timeline).forEach(function (m) {
          m.classList.remove('x-day-moment--active');
        });
        moment.classList.add('x-day-moment--active');
      });
    });
  }

  /* ══════════════════════════════════════════════════════
     33. HEATMAP-DRIVEN CONTENT ANALYTICS
     Track user engagement for optimization insights
  ══════════════════════════════════════════════════════ */
  function initEngagementTracking() {
    var sectionTimes = {};
    var startTimes = {};

    /* Track time spent in each section */
    var trackObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.id;
        if (!id) return;

        if (entry.isIntersecting) {
          startTimes[id] = Date.now();
        } else if (startTimes[id]) {
          var elapsed = Date.now() - startTimes[id];
          sectionTimes[id] = (sectionTimes[id] || 0) + elapsed;
          delete startTimes[id];
        }
      });
    }, { threshold: 0.2 });

    qsa('.section[id]').forEach(function (s) { trackObs.observe(s); });

    /* Track click patterns */
    var clickCounts = {};
    document.addEventListener('click', function (e) {
      var section = e.target.closest('.section[id]');
      if (section) {
        clickCounts[section.id] = (clickCounts[section.id] || 0) + 1;
      }
    });

    /* Expose analytics for debugging (stored in sessionStorage for persistence) */
    window.PPF_ANALYTICS = {
      getSectionTimes: function () { return Object.assign({}, sectionTimes); },
      getClickCounts: function () { return Object.assign({}, clickCounts); },
      getMostEngaged: function () {
        var max = 0;
        var maxId = '';
        for (var id in sectionTimes) {
          if (sectionTimes[id] > max) { max = sectionTimes[id]; maxId = id; }
        }
        return { section: maxId, timeMs: max };
      }
    };
  }

  /* ══════════════════════════════════════════════════════
     34. REFERRAL PROGRAM GAMIFICATION
     Animated referral tracker in member preview
  ══════════════════════════════════════════════════════ */
  function initReferralProgram() {
    var memberPreview = qs('#memberPreview');
    if (!memberPreview) return;

    var grid = memberPreview.querySelector('.member-preview__grid');
    if (!grid) return;

    /* Add referral card to member preview */
    var referralCard = document.createElement('div');
    referralCard.className = 'member-preview__card x-referral-card';
    referralCard.innerHTML =
      '<div class="member-preview__card-icon">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
          '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>' +
          '<circle cx="9" cy="7" r="4"/>' +
          '<path d="M23 21v-2a4 4 0 0 0-3-3.87"/>' +
          '<path d="M16 3.13a4 4 0 0 1 0 7.75"/>' +
        '</svg>' +
      '</div>' +
      '<div class="member-preview__card-title">Referral Rewards</div>' +
      '<div class="member-preview__card-desc">Refer friends and earn rewards. 2 referrals = free month. Track your progress in the member portal.</div>' +
      '<div class="x-referral-progress">' +
        '<div class="x-referral-bar"><div class="x-referral-fill"></div></div>' +
        '<div class="x-referral-text">Share PPF with friends → unlock rewards</div>' +
      '</div>';
    grid.appendChild(referralCard);
  }

  /* ══════════════════════════════════════════════════════
     BOOT — Initialize all 30X systems
  ══════════════════════════════════════════════════════ */
  function boot() {
    initScrollProgress();
    initSectionDividers();
    initStaggerGrids();
    initScrollReveals();
    initCounters();
    initBenchmarkFills();
    initRipple();
    initMagnetic();
    initSocialProofToasts();
    initCoachStatus();
    initChatbot();
    initExitIntent();
    initFormEnhancements();
    initPassportEnhancements();
    initAchievements();
    initTransformationCalc();
    initRoadmapBuilder();
    initTrustBadges();
    initVerifiedBadges();
    initParticles();
    initParallax();
    initGestures();
    initLiveBoardRotation();
    initSmoothAnchors();
    initLazyImages();
    initFaqAnimations();
    initFloorMapTour();
    initLiveLeaderboard();
    initDynamicPricing();
    initVideoFeed();
    initSocialFeed();
    initDayInLife();
    initEngagementTracking();
    initReferralProgram();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

})();
