/* ═══════════════════════════════════════════════════════════════════
   PPF STRIPE CONFIGURATION
   Central config for all Stripe-powered checkout, success, and billing.

   HOW TO SET UP:
   1. Create a Stripe account at https://stripe.com
   2. In the Stripe Dashboard, create Products and Prices for each plan
   3. Create Payment Links for each plan (Stripe Dashboard → Payment Links)
   4. Paste the Payment Link URLs below in PLANS[plan].stripePaymentLink
   5. For the billing portal, configure it at
      https://dashboard.stripe.com/settings/billing/portal
   6. Replace STRIPE_PORTAL_URL with your portal link

   PAYMENT LINK ADVANTAGES (for static / GitHub Pages sites):
   - No server required
   - Stripe hosts the entire checkout
   - Supports cards, ACH, Apple Pay, Google Pay, Link
   - Subscriptions + one-time payments
   - Customers can save payment methods

   IMPORTANT: Never put your Stripe SECRET key in client-side code.
   Payment Links and the publishable key are safe to expose.
   ═══════════════════════════════════════════════════════════════════ */

var PPF_STRIPE = (function () {
  'use strict';

  /* ── Stripe Keys ─────────────────────────────────────────────── */
  var PUBLISHABLE_KEY = 'pk_test_REPLACE_WITH_YOUR_KEY';

  /* ── Stripe Customer Portal URL ──────────────────────────────── */
  var STRIPE_PORTAL_URL = 'https://billing.stripe.com/p/login/REPLACE_WITH_YOUR_PORTAL_ID';

  /* ── Plan Definitions ────────────────────────────────────────── */
  var PLANS = {
    /* ═══ ADULT MEMBERSHIPS ═══ */
    'adult-monthly': {
      name: 'Adult Membership — Month to Month',
      price: '$150',
      period: '/month',
      mode: 'subscription',
      badge: 'FLEXIBLE',
      badgeColor: '#666',
      includes: [
        'Unlimited coached classes',
        'Full facility access during open gym hours',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment'
      ],
      terms: '30-day notice to cancel. No long-term commitment required.',
      checkoutIntro: 'Get immediate access to the PPF adult training environment with flexible month-to-month billing. This plan includes coached classes, open gym access, towel service, showers, locker room access, and a structure built around real consistency.',
      stripePaymentLink: '',
      successEyebrow: 'MEMBERSHIP ACTIVE',
      successHeadline: 'Welcome to Adult Performance',
      successBody: 'Your month-to-month membership is active. You now have access to coached classes, open gym, and the full adult training environment. Check your email for billing details and next steps.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW CLASS SCHEDULE', href: 'paths/adult.html' }
    },

    'adult-3-month': {
      name: 'Adult Membership — 3-Month Commitment',
      price: '$179',
      period: '/month',
      total: '$537 total',
      mode: 'subscription',
      badge: '',
      badgeColor: '',
      includes: [
        'Unlimited coached classes',
        'Full facility access during open gym hours',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment'
      ],
      terms: '3-month commitment. Full coaching access from day one.',
      checkoutIntro: 'Start a 90-day block designed to build momentum, structure, and accountability. This membership includes full adult access and a clearer runway for progress.',
      stripePaymentLink: '',
      successEyebrow: 'PLAN CONFIRMED',
      successHeadline: 'Your 3-Month Plan Is Locked In',
      successBody: 'Your 3-month adult membership is active. This is your starting block for building consistency, improving strength, and training inside a coached system with purpose.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW CLASS SCHEDULE', href: 'paths/adult.html' }
    },

    'adult-6-month': {
      name: 'Adult Membership — 6-Month Commitment',
      price: '$179',
      period: '/month',
      total: '$954 total',
      mode: 'subscription',
      badge: 'POPULAR',
      badgeColor: '#ff5500',
      includes: [
        'Unlimited coached classes',
        'Full facility access during open gym hours',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment'
      ],
      terms: '6-month commitment. The most chosen plan.',
      checkoutIntro: 'Commit to a longer runway for measurable change. This plan is designed for people who want enough time to train consistently, improve strength, and build lasting habits.',
      stripePaymentLink: '',
      successEyebrow: 'PLAN CONFIRMED',
      successHeadline: 'Your 6-Month Plan Is Active',
      successBody: 'Your 6-month adult membership is now active. This plan gives you the time, structure, and accountability to create visible progress and measurable change.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW CLASS SCHEDULE', href: 'paths/adult.html' }
    },

    'adult-12-month': {
      name: 'Adult Membership — 12-Month Commitment',
      price: '$159',
      period: '/month',
      total: '$1,908 total',
      mode: 'subscription',
      badge: 'BEST VALUE',
      badgeColor: '#ff5500',
      includes: [
        'Unlimited coached classes',
        'Full facility access during open gym hours',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment'
      ],
      terms: '12-month commitment. Lowest monthly rate.',
      checkoutIntro: 'Lock in your lowest monthly rate and commit to a full year of coached training, accountability, and long-term development.',
      stripePaymentLink: '',
      successEyebrow: 'LONG-TERM PLAN CONFIRMED',
      successHeadline: "You're Locked In for Long-Term Progress",
      successBody: 'Your 12-month adult membership is active. You secured your lowest monthly rate and committed to a longer runway for strength, health, consistency, and accountability.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW CLASS SCHEDULE', href: 'paths/adult.html' }
    },

    'adult-buddy': {
      name: 'Adult Membership — Buddy Plan',
      price: '$169',
      period: '/month per person',
      total: '6 Month Commitment',
      mode: 'subscription',
      badge: 'PARTNER',
      badgeColor: '#1a8a5a',
      includes: [
        'Unlimited coached classes',
        'Full facility access during open gym hours',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment',
        'Shared accountability with a partner'
      ],
      terms: '6-month commitment. Both members billed individually.',
      checkoutIntro: 'Join with a partner and build accountability into the process from day one. We\u2019ll confirm both members and get your setup aligned after checkout.',
      stripePaymentLink: '',
      successEyebrow: 'BUDDY PLAN STARTED',
      successHeadline: 'Your Buddy Plan Request Is In',
      successBody: 'Your membership request has been received. We\u2019ll confirm partner details, align billing, and get both members set up correctly inside the system.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'SUBMIT PARTNER DETAILS', href: 'member/index.html' }
    },

    'adult-family': {
      name: 'Adult Membership — Family Plan',
      price: '$349',
      period: '/month',
      total: '6 Month Commitment',
      mode: 'subscription',
      badge: 'FAMILY',
      badgeColor: '#1a8a5a',
      includes: [
        'Unlimited coached classes',
        'Full facility access for the household',
        'Towel service',
        'Shower access',
        'Locker room access',
        'Coaching-led training environment',
        'One plan for the entire household'
      ],
      terms: '6-month commitment. One plan covers the household.',
      checkoutIntro: 'Start a family membership designed to bring structure, support, and consistency under one plan. We\u2019ll confirm family details after checkout.',
      stripePaymentLink: '',
      successEyebrow: 'FAMILY PLAN STARTED',
      successHeadline: 'Your Family Plan Is Underway',
      successBody: 'Your family membership request has been received. We\u2019ll follow up to confirm household details, align access, and make sure everyone is set up correctly.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'SUBMIT FAMILY DETAILS', href: 'member/index.html' }
    },

    /* ═══ ATHLETE TRAINING ═══ */
    'athlete-monthly': {
      name: 'Athlete Training — Unlimited Monthly',
      price: '$175',
      period: '/month',
      mode: 'subscription',
      badge: 'CORE PLAN',
      badgeColor: '#ff5500',
      includes: [
        'Full access to every scheduled athlete session',
        'Periodized training program',
        'Benchmark testing and metrics tracking',
        'Coach-led development',
        'Consistent, structured sessions'
      ],
      terms: 'Month-to-month. Full access to every scheduled session.',
      checkoutIntro: 'Secure your athlete membership and enter a coached training system built around development, structure, and measurable performance improvement.',
      stripePaymentLink: '',
      successEyebrow: 'ATHLETE MEMBERSHIP ACTIVE',
      successHeadline: 'Your Training Spot Is Secured',
      successBody: 'Your athlete membership is active. A PPF coach will follow up with schedule details, baseline testing, and the best next step for entering the athlete system.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW ATHLETE PATH', href: 'paths/athlete.html' }
    },

    'athlete-3-month-pif': {
      name: 'Athlete Training — 3 Months Paid in Full',
      price: '$495',
      period: 'total',
      total: 'Discounted to $165/month',
      mode: 'payment',
      badge: '',
      badgeColor: '',
      includes: [
        'Full access to every scheduled athlete session',
        'Periodized training program',
        'Benchmark testing and metrics tracking',
        'Coach-led development',
        '3 months of structured training at a reduced rate'
      ],
      terms: 'One-time payment. 3-month training block.',
      checkoutIntro: 'Reserve a focused 3-month athlete training block built for consistency, progress, and a stronger return on every session.',
      stripePaymentLink: '',
      successEyebrow: 'TRAINING BLOCK CONFIRMED',
      successHeadline: 'Your 3-Month Athlete Block Is Paid In Full',
      successBody: 'Your payment has been received and your 3-month athlete block is secured. Watch for your intake, scheduling details, and next-step communication from the coaching staff.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW ATHLETE PATH', href: 'paths/athlete.html' }
    },

    'athlete-6-month-pif': {
      name: 'Athlete Training — 6 Months Paid in Full',
      price: '$930',
      period: 'total',
      total: 'Discounted to $155/month',
      mode: 'payment',
      badge: 'BEST VALUE',
      badgeColor: '#ff5500',
      includes: [
        'Full access to every scheduled athlete session',
        'Periodized training program',
        'Benchmark testing and metrics tracking',
        'Coach-led development',
        '6 months at the lowest athlete rate'
      ],
      terms: 'One-time payment. 6-month training block.',
      checkoutIntro: 'Lock in a longer training runway for deeper adaptation, better structure, and a more complete development cycle.',
      stripePaymentLink: '',
      successEyebrow: 'LONG-TERM TRAINING BLOCK CONFIRMED',
      successHeadline: 'Your 6-Month Athlete Plan Is Secured',
      successBody: 'Your payment has been received and your 6-month athlete training block is secured. A PPF coach will follow up with scheduling, entry point details, and next-step communication.',
      successPrimary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' },
      successSecondary: { text: 'VIEW ATHLETE PATH', href: 'paths/athlete.html' }
    },

    /* ═══ NUTRITION ═══ */
    'nutrition': {
      name: 'Nutrition Coaching',
      price: '$150',
      period: 'one-time investment',
      mode: 'payment',
      badge: '',
      badgeColor: '',
      includes: [
        'Consultation',
        'Personalized meal plan',
        'Four weeks of coaching support'
      ],
      terms: 'One-time payment. Coaching begins after intake.',
      checkoutIntro: 'Purchase your nutrition coaching package and secure your consultation, personalized meal plan, and four weeks of coaching support.',
      stripePaymentLink: '',
      successEyebrow: 'NUTRITION PACKAGE PURCHASED',
      successHeadline: 'Your Nutrition Coaching Is Secured',
      successBody: 'Your payment has been received. Your consultation, personalized meal plan, and four weeks of coaching are now reserved. Check your email for intake and next steps.',
      successPrimary: { text: 'COMPLETE NUTRITION INTAKE', href: 'member/index.html' },
      successSecondary: { text: 'GO TO MEMBER PORTAL', href: 'member/index.html' }
    }
  };

  /* ── Consultation / inquiry plans (no Stripe checkout) ─────── */
  var CONSULT_PLANS = {
    'integrated': {
      successEyebrow: 'CONSULTATION REQUEST RECEIVED',
      successHeadline: "We'll Help You Find the Right Starting Point",
      successBody: 'Your consultation request has been received. Rebecca will connect with you to learn more about your goals, support needs, and the right entry point for your family or individual situation.',
      successPrimary: { text: 'VIEW INTEGRATED PATH', href: 'paths/integrated.html' },
      successSecondary: { text: 'RETURN HOME', href: 'index.html' }
    },
    '1-on-1': {
      successEyebrow: 'INQUIRY RECEIVED',
      successHeadline: 'Your 1-on-1 Request Is In',
      successBody: 'We\u2019ve received your request for 1-on-1 coaching. Our team will review your goals, availability, and the best fit for individualized training before sending next steps.',
      successPrimary: { text: 'RETURN HOME', href: 'index.html' },
      successSecondary: { text: 'VIEW TRAINING OPTIONS', href: 'index.html#memberships' }
    },
    'intake-booked': {
      successEyebrow: 'PPF SYSTEM ENTRY CONFIRMED',
      successHeadline: "You're In the System",
      successBody: 'Your request has been received. A PPF coach will review your information and reach out with next steps. Your first three visits are designed to give you clarity fast: Day 1 is assessment, Day 2 is a coached session, and Day 3 is your roadmap with a recommended path.',
      successPrimary: { text: 'VIEW MEMBERSHIP OPTIONS', href: 'index.html#memberships' },
      successSecondary: { text: 'EXPLORE THE THREE PATHS', href: 'index.html#paths' }
    },
    'athlete-intake': {
      successEyebrow: 'ATHLETE REQUEST RECEIVED',
      successHeadline: 'Athlete Evaluation Requested',
      successBody: 'Your athlete intake is in. A PPF coach will follow up with scheduling, baseline testing details, and the best next opening in the athlete training flow.',
      successPrimary: { text: 'VIEW ATHLETE OPTIONS', href: 'paths/athlete.html' },
      successSecondary: { text: 'RETURN HOME', href: 'index.html' }
    },
    'adult-intake': {
      successEyebrow: 'ADULT REQUEST RECEIVED',
      successHeadline: 'Adult Assessment Requested',
      successBody: 'Your request is in. We\u2019ll reach out with your first coached visit, what to expect when you arrive, and how the adult membership structure works.',
      successPrimary: { text: 'VIEW ADULT MEMBERSHIP', href: 'paths/adult.html' },
      successSecondary: { text: 'RETURN HOME', href: 'index.html' }
    }
  };

  /* ── Public API ──────────────────────────────────────────────── */
  return {
    PUBLISHABLE_KEY: PUBLISHABLE_KEY,
    STRIPE_PORTAL_URL: STRIPE_PORTAL_URL,
    PLANS: PLANS,
    CONSULT_PLANS: CONSULT_PLANS,
    getPlan: function (id) { return PLANS[id] || null; },
    getConsultPlan: function (id) { return CONSULT_PLANS[id] || null; },
    getAllPlanIds: function () { return Object.keys(PLANS); }
  };
})();
