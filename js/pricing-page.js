import { getActiveUser, logoutUser } from './auth-service.js';

// Plan Definitions
const PLANS = {
  '1_day': {
    id: '1_day',
    name: '1 Day Sprint Pass',
    price: 5,
    period: '24-Hour Access'
  },
  '1_week': {
    id: '1_week',
    name: '1 Week Sprint Pass',
    price: 30,
    period: '7 Days Access'
  },
  '1_month': {
    id: '1_month',
    name: '1 Month Pro Campaign',
    price: 115,
    period: '30 Days Access'
  },
  '1_year': {
    id: '1_year',
    name: '1 Year Career Pass',
    price: 1000,
    period: '365 Days Access'
  }
};

let selectedPlan = PLANS['1_month'];
let currentUser = null;

document.addEventListener('DOMContentLoaded', () => {
  currentUser = getActiveUser();
  setupNavbarAuth();
  setupPlanTriggers();
  setupModals();
  checkUrlParams();
});

/**
 * Configure Navbar Auth Status
 */
function setupNavbarAuth() {
  const container = document.getElementById('user-auth-badge');
  if (!container) return;

  if (currentUser && currentUser.verified) {
    const isExpired = currentUser.isActive === false;
    const roleBadge = currentUser.role === 'admin' ? '<a href="admin/dashboard.html" style="margin-left: 8px; color: #6366f1; text-decoration: underline; font-weight: 700;">Admin Panel</a>' : '';

    container.innerHTML = `
      <div class="user-status-pill">
        <span style="width: 7px; height: 7px; border-radius: 50%; background: ${isExpired ? '#ef4444' : '#10b981'};"></span>
        <span>${currentUser.fullName || currentUser.email.split('@')[0]}</span>
        ${roleBadge}
        <button id="btn-pricing-logout" style="background: none; border: none; color: #64748b; cursor: pointer; padding: 0 4px; font-weight: 600; text-decoration: underline;">Logout</button>
      </div>
    `;

    document.getElementById('btn-pricing-logout')?.addEventListener('click', () => {
      logoutUser();
      window.location.reload();
    });
  } else {
    container.innerHTML = `
      <a href="login.html" class="btn-pill-outline">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Sign In</span>
      </a>
    `;
  }
}

/**
 * Setup Plan Action Click Handlers
 */
function setupPlanTriggers() {
  const buttons = document.querySelectorAll('.btn-plan-trigger');
  buttons.forEach(btn => {
    btn.addEventListener('click', (e) => {
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
  if (priceEl) priceEl.textContent = `₹${plan.price}`;
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
  if (priceEl) priceEl.textContent = `₹${plan.price}`;

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
  // Close buttons
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

  // Close upon overlay click
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
      alert('Please provide a phone number for the subscription verification call.');
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
 * Display "Subscription call is booked!" Notification
 */
function showSuccessNotification(sub) {
  const modal = document.getElementById('modal-call-booked-success');
  const detailsEl = document.getElementById('success-notification-text');
  const planInfoEl = document.getElementById('conf-plan-info');
  const contactInfoEl = document.getElementById('conf-contact-info');

  if (detailsEl) {
    detailsEl.textContent = `Your subscription activation call for the ${sub.planName} has been booked! Our executive will call ${sub.phone} within 15 minutes to verify payment and activate your account.`;
  }

  if (planInfoEl) planInfoEl.textContent = `${sub.planName} — ₹${sub.amount}`;
  if (contactInfoEl) contactInfoEl.textContent = `Contact: ${sub.phone} (${sub.email})`;

  modal.classList.add('active');
}

/**
 * Handle auto-selection via URL param (e.g., pricing.html?plan=1_month)
 */
function checkUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const planId = params.get('plan');
  if (planId && PLANS[planId]) {
    handlePlanSelection(PLANS[planId]);
  }
}
