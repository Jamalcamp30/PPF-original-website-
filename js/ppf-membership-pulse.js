/* ═══════════════════════════════════════════════════════════════════
   MEMBERSHIP PULSE SYSTEM — JS
   Premium billing/membership animation controller for PPF portal.
   Exposes: window.PPFPulse
   ═══════════════════════════════════════════════════════════════════ */
;(function () {
  'use strict';

  /* ── Helpers ──────────────────────────────────────────────────── */
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function ce(tag, cls, html) {
    var el = document.createElement(tag);
    if (cls) el.className = cls;
    if (html) el.innerHTML = html;
    return el;
  }

  var checkSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>';
  var shieldSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
  var alertSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
  var cardSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>';
  var bellSvg = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>';

  /* ── State Management ────────────────────────────────────────── */
  var PULSE_KEY = 'ppf_membership_pulse';

  function getState() {
    try {
      var raw = localStorage.getItem(PULSE_KEY);
      return raw ? JSON.parse(raw) : getDefaultState();
    } catch (e) { return getDefaultState(); }
  }

  function saveState(s) {
    try { localStorage.setItem(PULSE_KEY, JSON.stringify(s)); } catch (e) { /* noop */ }
  }

  function getDefaultState() {
    return {
      plan: 'Adult Membership — Month to Month',
      status: 'active',           // active | renewing | renewed | action-needed | failed
      paymentStatus: 'healthy',   // healthy | expiring | failed
      nextRenewal: getDateInDays(28),
      paymentMethod: 'Visa ending in ••••',
      memberSince: new Date().toISOString().split('T')[0],
      lastPayment: new Date().toISOString().split('T')[0],
      amount: '$150',
      cardExpiry: '',
      dismissedToasts: []
    };
  }

  function getDateInDays(n) {
    var d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setTime(d.getTime() + n * 86400000);
    return d.toISOString().split('T')[0];
  }

  function daysUntil(dateStr) {
    if (!dateStr) return 999;
    var now = new Date();
    now.setHours(0, 0, 0, 0);
    var target = new Date(dateStr + 'T00:00:00');
    return Math.max(0, Math.round((target - now) / 86400000));
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var d = new Date(dateStr + 'T00:00:00');
    return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
  }

  /* ── Number roll-up ──────────────────────────────────────────── */
  function animateNumber(el, from, to, suffix) {
    suffix = suffix || '';
    var duration = 800;
    var start = performance.now();
    function tick(now) {
      var pct = Math.min((now - start) / duration, 1);
      var ease = 1 - Math.pow(1 - pct, 3);
      el.textContent = Math.round(from + (to - from) * ease) + suffix;
      if (pct < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ═════════════════════════════════════════════════════════════════
     1. MEMBERSHIP STATUS HERO CARD
     ═════════════════════════════════════════════════════════════════ */
  function buildHeroCard(container) {
    var state = getState();
    var days = daysUntil(state.nextRenewal);

    var html =
      '<div class="mp-perim-glow" id="mpPerimGlow"></div>' +
      '<div class="mp-perim-run">' +
        '<span class="mp-perim-run__edge mp-perim-run__edge--top"></span>' +
        '<span class="mp-perim-run__edge mp-perim-run__edge--right"></span>' +
        '<span class="mp-perim-run__edge mp-perim-run__edge--bottom"></span>' +
        '<span class="mp-perim-run__edge mp-perim-run__edge--left"></span>' +
      '</div>' +
      '<div class="mp-hero__top">' +
        '<div>' +
          '<div class="mp-hero__plan-label">CURRENT PLAN</div>' +
          '<div class="mp-hero__plan-name">' + state.plan + '</div>' +
        '</div>' +
        '<div class="mp-status-pill" data-status="' + state.status + '" id="mpStatusPill">' +
          '<span class="mp-status-pill__dot"></span>' +
          '<span class="mp-status-pill__text">' + statusLabel(state.status) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="mp-hero__metrics">' +
        '<div class="mp-hero__metric">' +
          '<div class="mp-hero__metric-label">NEXT RENEWAL</div>' +
          '<div class="mp-hero__metric-value" id="mpRenewalDate">' + formatDate(state.nextRenewal) + '</div>' +
        '</div>' +
        '<div class="mp-hero__metric">' +
          '<div class="mp-hero__metric-label">AMOUNT</div>' +
          '<div class="mp-hero__metric-value">' + state.amount + '</div>' +
        '</div>' +
        '<div class="mp-hero__metric">' +
          '<div class="mp-hero__metric-label">PAYMENT METHOD</div>' +
          '<div class="mp-hero__metric-value' + (state.paymentMethod.indexOf('••••') !== -1 ? ' mp-hero__metric-value--masked' : '') + '">' + state.paymentMethod + '</div>' +
        '</div>' +
        '<div class="mp-hero__metric">' +
          '<div class="mp-hero__metric-label">DAYS UNTIL RENEWAL</div>' +
          '<div class="mp-hero__metric-value" id="mpDaysLeft">' + days + '</div>' +
        '</div>' +
      '</div>' +
      '<a href="billing.html" class="mp-hero__cta">MANAGE BILLING</a>';

    container.innerHTML = html;
    container.className = 'mp-hero';

    // Animate days number roll-up
    var daysEl = qs('#mpDaysLeft', container);
    if (daysEl) animateNumber(daysEl, 0, days, '');
  }

  function statusLabel(status) {
    var map = {
      'active': 'ACTIVE',
      'renewing': 'RENEWING',
      'renewed': 'RENEWED',
      'action-needed': 'ACTION NEEDED',
      'failed': 'PAYMENT FAILED'
    };
    return map[status] || 'ACTIVE';
  }

  /* ═════════════════════════════════════════════════════════════════
     2. RENEWAL COUNTDOWN CARD
     ═════════════════════════════════════════════════════════════════ */
  function buildRenewalCard(container) {
    var state = getState();
    var days = daysUntil(state.nextRenewal);
    var urgency = getUrgency(days);
    var ringPct = Math.min(1, Math.max(0, 1 - (days / 30)));
    var circumference = 2 * Math.PI * 36; // r=36 in the SVG
    var offset = circumference * (1 - ringPct);

    var isHealthy = state.paymentStatus === 'healthy';
    var safeHtml = isHealthy
      ? '<div class="mp-renewal__safe">' + shieldSvg + '<span>You\u2019re Set \u2014 No action needed</span></div>'
      : '';

    var title, body;
    if (days === 0) {
      title = 'RENEWAL TODAY';
      body = 'Your membership renews today. Payment will be processed automatically.';
    } else if (days <= 3) {
      title = 'RENEWAL IN ' + days + ' DAY' + (days === 1 ? '' : 'S');
      body = 'Your ' + state.plan + ' renews ' + (days === 1 ? 'tomorrow' : 'in ' + days + ' days') + '.';
    } else if (days <= 14) {
      title = 'RENEWAL COMING UP';
      body = 'Your membership renews in ' + days + ' days. No action needed unless you want to update your payment method.';
    } else {
      title = 'NEXT RENEWAL';
      body = 'Your ' + state.plan + ' renews on ' + formatDate(state.nextRenewal) + '.';
    }

    container.innerHTML =
      '<div class="mp-renewal__ring-wrap">' +
        '<svg class="mp-renewal__ring" viewBox="0 0 80 80">' +
          '<circle class="mp-renewal__ring-bg" cx="40" cy="40" r="36"/>' +
          '<circle class="mp-renewal__ring-fill" cx="40" cy="40" r="36" id="mpRingFill" style="stroke-dasharray:' + circumference + ';stroke-dashoffset:' + circumference + '"/>' +
        '</svg>' +
        '<div class="mp-renewal__ring-days">' +
          '<span class="mp-renewal__ring-num" id="mpRingNum">0</span>' +
          '<span class="mp-renewal__ring-unit">DAYS</span>' +
        '</div>' +
      '</div>' +
      '<div class="mp-renewal__info">' +
        '<div class="mp-renewal__title">' + title + '</div>' +
        '<div class="mp-renewal__body">' + body + '</div>' +
        safeHtml +
      '</div>';

    container.className = 'mp-renewal';
    container.setAttribute('data-urgency', urgency);

    // Animate ring fill
    setTimeout(function () {
      var ringEl = qs('#mpRingFill', container);
      if (ringEl) ringEl.style.strokeDashoffset = offset;
      var numEl = qs('#mpRingNum', container);
      if (numEl) animateNumber(numEl, 0, days, '');
    }, 200);
  }

  function getUrgency(days) {
    if (days <= 1) return 'critical';
    if (days <= 3) return 'high';
    if (days <= 7) return 'medium';
    return 'low';
  }

  /* ═════════════════════════════════════════════════════════════════
     3. TOAST NOTIFICATION SYSTEM
     ═════════════════════════════════════════════════════════════════ */
  var toastContainer = null;

  function ensureToastContainer() {
    if (toastContainer && toastContainer.parentNode) return;
    toastContainer = ce('div', 'mp-toast-container');
    document.body.appendChild(toastContainer);
  }

  /**
   * Show a toast notification.
   * @param {Object} opts
   * @param {string} opts.type    - success | warning | error | info
   * @param {string} opts.title
   * @param {string} opts.body
   * @param {number} [opts.duration] - ms before auto-dismiss (0 = manual)
   * @param {string} [opts.id]       - unique ID to prevent duplicates
   */
  function showToast(opts) {
    ensureToastContainer();

    // Skip if already dismissed this session
    var state = getState();
    if (opts.id && state.dismissedToasts && state.dismissedToasts.indexOf(opts.id) !== -1) return;

    // Prevent duplicate toasts
    if (opts.id && qs('[data-toast-id="' + opts.id + '"]', toastContainer)) return;

    var iconMap = {
      success: '<div class="mp-toast__icon mp-toast__icon--success">' + checkSvg + '</div>',
      warning: '<div class="mp-toast__icon mp-toast__icon--warning">' + alertSvg + '</div>',
      error: '<div class="mp-toast__icon mp-toast__icon--error">' + alertSvg + '</div>',
      info: '<div class="mp-toast__icon mp-toast__icon--info">' + bellSvg + '</div>'
    };

    var toast = ce('div', 'mp-toast mp-toast--' + (opts.type || 'info'));
    if (opts.id) toast.setAttribute('data-toast-id', opts.id);
    toast.innerHTML =
      (iconMap[opts.type] || iconMap.info) +
      '<div class="mp-toast__content">' +
        '<div class="mp-toast__title">' + opts.title + '</div>' +
        '<div class="mp-toast__body">' + opts.body + '</div>' +
      '</div>' +
      '<button class="mp-toast__close" aria-label="Dismiss">&times;</button>';

    toastContainer.appendChild(toast);

    // Animate in with double-rAF to guarantee the browser has painted
    // the initial off-screen position before transitioning
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        toast.classList.add('mp-toast--visible');

        // Settle older toasts (skip any that are already dismissing)
        var children = toastContainer.children;
        for (var i = 0; i < children.length - 1; i++) {
          if (!children[i].classList.contains('mp-toast--dismissing')) {
            children[i].classList.add('mp-toast--settling');
          }
        }
        setTimeout(function () {
          for (var j = 0; j < children.length; j++) {
            children[j].classList.remove('mp-toast--settling');
          }
        }, 500);
      });
    });

    // Dismiss handler with guard against double-fire
    var dismissed = false;
    function dismiss() {
      if (dismissed) return;
      dismissed = true;

      toast.classList.remove('mp-toast--visible');
      toast.classList.add('mp-toast--dismissing');
      if (opts.id) {
        var s = getState();
        if (!s.dismissedToasts) s.dismissedToasts = [];
        s.dismissedToasts.push(opts.id);
        saveState(s);
      }
      setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 500);
    }

    // Close button click — use contains() so child SVG/span clicks
    // also register as close-button clicks
    var closeBtn = qs('.mp-toast__close', toast);
    if (closeBtn) {
      closeBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        dismiss();
      });
    }
    toast.addEventListener('click', dismiss);

    // Auto-dismiss
    var dur = opts.duration !== undefined ? opts.duration : 8000;
    if (dur > 0) setTimeout(dismiss, dur);
  }

  /* ═════════════════════════════════════════════════════════════════
     4. ACTIVATION SEQUENCE (for success pages)
     ═════════════════════════════════════════════════════════════════ */
  function buildActivationSequence(container, planName) {
    var steps = [
      'MEMBER PROFILE CREATED',
      'BILLING ACTIVE',
      'TRAINING ACCESS UNLOCKED'
    ];

    var stepsHtml = '';
    for (var i = 0; i < steps.length; i++) {
      stepsHtml +=
        '<div class="mp-activation__step" id="mpActStep' + i + '">' +
          '<div class="mp-activation__step-icon">' + checkSvg + '</div>' +
          '<div class="mp-activation__step-text">' + steps[i] + '</div>' +
        '</div>';
    }

    container.innerHTML =
      '<div class="mp-activation__scan"></div>' +
      stepsHtml;
    container.className = 'mp-activation';

    // Trigger boot sequence
    setTimeout(function () {
      container.classList.add('mp-activation--booting');

      // Reveal steps sequentially after the scan line completes
      // Scan starts at 600ms delay and runs 800ms, so steps begin at ~1500ms
      for (var j = 0; j < steps.length; j++) {
        (function (idx) {
          setTimeout(function () {
            var step = qs('#mpActStep' + idx, container);
            if (step) step.classList.add('mp-activation__step--revealed');
          }, 1500 + (idx * 500));
        })(j);
      }
    }, 100);
  }

  /* ═════════════════════════════════════════════════════════════════
     5. PAYMENT STATUS CARDS (for billing page)
     ═════════════════════════════════════════════════════════════════ */
  function buildPaymentStatus(container) {
    var state = getState();

    if (state.paymentStatus === 'failed') {
      container.innerHTML =
        '<div class="mp-pay-failed">' +
          '<div class="mp-pay-failed__header">' +
            '<div class="mp-pay-failed__icon">' + alertSvg + '</div>' +
            '<div class="mp-pay-failed__title">ACTION NEEDED</div>' +
          '</div>' +
          '<div class="mp-pay-failed__body">We couldn\u2019t process your renewal. Update your billing information to keep your membership active and your training uninterrupted.</div>' +
          '<a href="billing.html" class="mp-pay-failed__cta">UPDATE PAYMENT METHOD</a>' +
        '</div>';
    } else if (state.paymentStatus === 'expiring') {
      container.innerHTML =
        '<div class="mp-pay-expiring">' +
          '<div class="mp-pay-expiring__icon">' + cardSvg + '</div>' +
          '<div class="mp-pay-expiring__text">' +
            '<div class="mp-pay-expiring__title">UPDATE BILLING SOON</div>' +
            '<div class="mp-pay-expiring__body">Your current card expires before your next renewal' +
              (state.cardExpiry ? ' (' + state.cardExpiry + ')' : '') +
              '. Update your payment method to avoid interruption.</div>' +
          '</div>' +
        '</div>';
    } else {
      var days = daysUntil(state.nextRenewal);
      container.innerHTML =
        '<div class="mp-pay-healthy">' +
          '<div class="mp-pay-healthy__shield">' + shieldSvg + '</div>' +
          '<div class="mp-pay-healthy__text">' +
            '<div class="mp-pay-healthy__title">YOU\u2019RE SET</div>' +
            '<div class="mp-pay-healthy__body">Your membership renews automatically on ' + formatDate(state.nextRenewal) + '. No action needed.</div>' +
          '</div>' +
        '</div>';
    }
  }

  /* ═════════════════════════════════════════════════════════════════
     6. PERIMETER RUN / GLOW (trigger manually)
     ═════════════════════════════════════════════════════════════════ */
  function triggerPerimeterGlow(selector) {
    var el = typeof selector === 'string' ? qs(selector) : selector;
    if (!el) return;

    /* ── Conic sweep glow ── */
    var glow = qs('.mp-perim-glow', el);
    if (glow) {
      glow.classList.remove('mp-perim-glow--active');
      void glow.offsetWidth; // reflow to restart animation
      glow.classList.add('mp-perim-glow--active');
    }

    /* ── 4-edge perimeter run ── */
    var run = qs('.mp-perim-run', el);
    if (run) {
      run.classList.remove('mp-perim-run--active');
      void run.offsetWidth; // reflow to restart animation
      run.classList.add('mp-perim-run--active');
    }
  }

  /* ═════════════════════════════════════════════════════════════════
     7. STATUS PILL MORPH
     ═════════════════════════════════════════════════════════════════ */
  function morphStatus(newStatus) {
    var pill = qs('#mpStatusPill');
    if (!pill) return;
    var text = qs('.mp-status-pill__text', pill);
    if (text) text.textContent = statusLabel(newStatus);
    pill.setAttribute('data-status', newStatus);

    // Save
    var state = getState();
    state.status = newStatus;
    saveState(state);
  }

  /* ═════════════════════════════════════════════════════════════════
     8. SMART NOTIFICATION LOGIC
     ═════════════════════════════════════════════════════════════════ */
  function fireSmartNotifications() {
    var state = getState();
    var days = daysUntil(state.nextRenewal);

    // Payment failed
    if (state.paymentStatus === 'failed') {
      showToast({
        type: 'error',
        title: 'Action Needed',
        body: 'We couldn\u2019t process your renewal. Update billing to keep your membership active.',
        duration: 0,
        id: 'payment-failed'
      });
      return; // Don't stack more alerts on top of a failed payment
    }

    // Card expiring
    if (state.paymentStatus === 'expiring') {
      showToast({
        type: 'warning',
        title: 'Update Billing Soon',
        body: 'Your current card expires before your next renewal.',
        duration: 12000,
        id: 'card-expiring'
      });
    }

    // Renewal countdown
    if (days <= 1) {
      showToast({
        type: 'info',
        title: 'Renewal ' + (days === 0 ? 'Today' : 'Tomorrow'),
        body: 'Your membership renews ' + (days === 0 ? 'today' : 'tomorrow') + '. No action needed.',
        duration: 10000,
        id: 'renewal-' + days
      });
    } else if (days <= 3) {
      showToast({
        type: 'info',
        title: 'Renewal in ' + days + ' Days',
        body: 'Your membership renews soon. Your billing is all set.',
        duration: 8000,
        id: 'renewal-soon'
      });
    } else if (days <= 7) {
      showToast({
        type: 'info',
        title: 'Renewal Coming Up',
        body: 'Your membership renews in ' + days + ' days.',
        duration: 6000,
        id: 'renewal-week'
      });
    }

    // Healthy confirmation (only if nothing else fired)
    if (state.paymentStatus === 'healthy' && days > 14) {
      // No toast — clean state needs no notification
    }
  }

  /* ═════════════════════════════════════════════════════════════════
     9. PUBLIC API
     ═════════════════════════════════════════════════════════════════ */
  window.PPFPulse = {
    /* Mount components into containers */
    mountHero: buildHeroCard,
    mountRenewal: buildRenewalCard,
    mountActivation: buildActivationSequence,
    mountPaymentStatus: buildPaymentStatus,

    /* Actions */
    showToast: showToast,
    fireSmartNotifications: fireSmartNotifications,
    triggerPerimeterGlow: triggerPerimeterGlow,
    morphStatus: morphStatus,

    /* State */
    getState: getState,
    saveState: saveState,
    getDefaultState: getDefaultState,

    /**
     * Initialize Pulse on the dashboard page.
     * Call with the container elements where hero and renewal cards should mount.
     */
    initDashboard: function (heroEl, renewalEl) {
      if (heroEl) buildHeroCard(heroEl);
      if (renewalEl) buildRenewalCard(renewalEl);
      setTimeout(fireSmartNotifications, 1200);
    },

    /**
     * Play the activation sequence on a success page.
     * @param {HTMLElement} container
     * @param {string} planName
     */
    initActivation: function (container, planName) {
      if (container) buildActivationSequence(container, planName);
    },

    /**
     * Initialize billing page with payment status card.
     * @param {HTMLElement} container
     */
    initBilling: function (container) {
      if (container) buildPaymentStatus(container);
      setTimeout(fireSmartNotifications, 800);
    },

    /**
     * Simulate a renewal success animation on the hero card.
     */
    simulateRenewalSuccess: function () {
      morphStatus('renewed');
      triggerPerimeterGlow('.mp-hero');
      var hero = qs('.mp-hero');
      if (hero) hero.classList.add('mp-hero--confirmed');
      showToast({
        type: 'success',
        title: 'Renewal Complete',
        body: 'Your access continues without interruption.',
        duration: 8000,
        id: 'renewal-success'
      });
    },

    /**
     * Simulate a failed payment state.
     */
    simulatePaymentFailed: function () {
      var state = getState();
      state.paymentStatus = 'failed';
      state.status = 'failed';
      saveState(state);
      morphStatus('failed');
      var hero = qs('.mp-hero');
      if (hero) buildHeroCard(hero);
      fireSmartNotifications();
    }
  };

})();
