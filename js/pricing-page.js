import { getActiveUser, logoutUser, getEarlyAdopterStats } from './auth-service.js';
import { initProfileNavbar } from './profile-component.js';

// Plan Definitions (Zero Emojis)
const PLANS = {
  'early_adopter': {
    id: 'early_adopter',
    name: '2-Week Early Access Pass',
    price: 0,
    period: '14 Days Free Access + 24/7 Support'
  },
  '1_day': {
    id: '1_day',
    name: 'Day Sprint',
    price: 5,
    period: '24 Hours Access'
  },
  '1_week': {
    id: '1_week',
    name: 'Week Sprint',
    price: 30,
    period: '7 Days Access'
  },
  '1_month': {
    id: '1_month',
    name: 'Month Campaign',
    price: 115,
    period: '30 Days Access'
  },
  '1_year': {
    id: '1_year',
    name: 'Year Career Pass',
    price: 1000,
    period: '365 Days Access'
  }
};

let selectedPlan = PLANS['1_month'];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = getActiveUser();
  initProfileNavbar('user-auth-badge');
  updateEarlyAdopterCounter();
  setupPlanTriggers();
  setupModals();
  checkUrlParams();
});

/**
 * Update dynamic spots remaining counter
 */
function updateEarlyAdopterCounter() {
  const stats = getEarlyAdopterStats();
  const counterEl = document.getElementById('early-adopter-remaining-spots');
  if (counterEl) {
    counterEl.textContent = stats.remaining;
  }
}

/**
 * Setup Plan Action Click Handlers
 */
function setupPlanTriggers() {
  const buttons = document.querySelectorAll('.btn-plan-trigger');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const planId = btn.getAttribute('data-plan-id');
      const plan = PLANS[planId] || PLANS['1_month'];
      handlePlanSelection(plan);
    });
  });
}

/**
 * Handle user choosing a subscription plan
 */
function handlePlanSelection(plan) {
  selectedPlan = plan;

  // STRICT REQUIREMENT: Only after login can they subscribe
  if (!currentUser || !currentUser.verified) {
    showAuthRequiredModal(plan);
    return;
  }

  showBookCallModal(plan);
}

/**
 * Open Login Required Modal
 */
function showAuthRequiredModal(plan) {
  const modal = document.getElementById('modal-auth-required');
  const titleEl = document.getElementById('auth-modal-plan-title');
  const priceEl = document.getElementById('auth-modal-plan-price');
  const loginLink = document.getElementById('btn-go-to-login');

  if (titleEl) titleEl.textContent = plan.name;
  if (priceEl) priceEl.textContent = plan.price === 0 ? 'Free (First 500 Only)' : `₹${plan.price}`;
  if (loginLink) loginLink.href = `login.html?redirect=pricing.html&plan=${plan.id}`;

  modal.classList.add('active');
}

/**
 * Open Book Subscription Call Modal
 */
function showBookCallModal(plan) {
  const modal = document.getElementById('modal-book-call');
  const nameEl = document.getElementById('summary-plan-name');
  const periodEl = document.getElementById('summary-plan-period');
  const priceEl = document.getElementById('summary-plan-price');
  
  const inputName = document.getElementById('input-book-name');
  const inputEmail = document.getElementById('input-book-email');
  const inputPhone = document.getElementById('input-book-phone');

  if (nameEl) nameEl.textContent = plan.name;
  if (periodEl) periodEl.textContent = plan.period;
  if (priceEl) priceEl.textContent = plan.price === 0 ? 'Free' : `₹${plan.price}`;

  if (inputName) inputName.value = currentUser?.fullName || '';
  if (inputEmail) inputEmail.value = currentUser?.email || '';

  // Prefill phone from candidate profile if saved previously
  try {
    const prof = JSON.parse(localStorage.getItem('biotailr_candidate_profile') || '{}');
    if (prof.phone && inputPhone) inputPhone.value = prof.phone;
  } catch (e) {}

  modal.classList.add('active');
}

/**
 * Setup Modal Events and Submit Handler
 */
function setupModals() {
  document.getElementById('btn-close-auth-modal')?.addEventListener('click', () => {
    document.getElementById('modal-auth-required')?.classList.remove('active');
  });

  document.getElementById('btn-close-book-modal')?.addEventListener('click', () => {
    document.getElementById('modal-book-call')?.classList.remove('active');
  });

  document.getElementById('btn-close-success-modal')?.addEventListener('click', () => {
    document.getElementById('modal-call-booked-success')?.classList.remove('active');
  });

  document.getElementById('btn-done-success')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });

  ['modal-auth-required', 'modal-book-call', 'modal-call-booked-success'].forEach(id => {
    const el = document.getElementById(id);
    el?.addEventListener('click', (e) => {
      if (e.target === el) el.classList.remove('active');
    });
  });

  // Handle Form Submission
  const form = document.getElementById('form-book-call');
  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('input-book-name').value.trim();
    const email = document.getElementById('input-book-email').value.trim();
    const phone = document.getElementById('input-book-phone').value.trim();
    const notes = document.getElementById('input-book-notes').value.trim();

    if (!phone) {
      alert('Please provide a phone number for the verification call.');
      return;
    }

    const submitBtn = document.getElementById('btn-submit-call-text');
    if (submitBtn) submitBtn.textContent = 'Scheduling Call...';

    const subRequest = {
      id: 'sub_' + Date.now(),
      fullName: name,
      email: email,
      phone: phone,
      planId: selectedPlan.id,
      planName: selectedPlan.name,
      amount: selectedPlan.price,
      status: 'pending',
      notes: notes || 'Booked via BioTailr Pricing Page',
      createdAt: Date.now(),
      createdFormatted: new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })
    };

    // 1. Save to local storage for immediate persistence
    try {
      const existing = JSON.parse(localStorage.getItem('biotailr_subscription_requests') || '[]');
      existing.unshift(subRequest);
      localStorage.setItem('biotailr_subscription_requests', JSON.stringify(existing));
    } catch (err) {}

    // 2. Synchronize to Backend Server API
    try {
      await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subRequest)
      });
    } catch (err) {
      console.warn('[Pricing] API sync note (stored locally):', err);
    }

    // Close booking modal
    document.getElementById('modal-book-call')?.classList.remove('active');
    if (submitBtn) submitBtn.textContent = 'Confirm & Book Subscription Call →';

    // Show SUCCESS NOTIFICATION MODAL
    showSuccessNotification(subRequest);
  });
}

/**
 * Display "Subscription call is booked!" Notification (No Emojis)
 */
function showSuccessNotification(sub) {
  const modal = document.getElementById('modal-call-booked-success');
  const detailsEl = document.getElementById('success-notification-text');
  const planInfoEl = document.getElementById('conf-plan-info');
  const contactInfoEl = document.getElementById('conf-contact-info');

  if (detailsEl) {
    detailsEl.textContent = `Your subscription activation call for the ${sub.planName} has been booked. Our executive will call ${sub.phone} within 15 minutes to verify payment and activate your access immediately.`;
  }

  if (planInfoEl) planInfoEl.textContent = `${sub.planName} — INR ${sub.amount}`;
  if (contactInfoEl) contactInfoEl.textContent = `Contact: ${sub.phone} (${sub.email})`;

  modal.classList.add('active');
}

/**
 * Handle auto-selection via URL param
 */
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan');
  if (planId && PLANS[planId]) {
    handlePlanSelection(PLANS[planId]);
  }
}
