/**
 * BioTailr AI - Interactive Auth Page Controller
 * Manages split-panel animations, EmailJS verification, and 4-day demo access
 */

import { 
  registerUser, 
  loginUser, 
  verifyEmailOtp, 
  resendVerificationOtp, 
  getActiveUser,
  getDemoStatus,
  getEarlyAdopterStats 
} from './auth-service.js';
import { syncPlatformDataToExtensionAndStandBy } from './profile-component.js';
import { maybeShowSetupWizard } from './setup-wizard.js';

let currentPendingEmail = '';

document.addEventListener('DOMContentLoaded', () => {
  const stage = document.getElementById('auth-card-stage');
  const viewLogin = document.getElementById('view-login');
  const viewSignup = document.getElementById('view-signup');
  const viewVerify = document.getElementById('view-verify');
  const viewDeactivated = document.getElementById('view-deactivated');
  const alertContainer = document.getElementById('auth-alert-container');

  const btnGoSignup = document.getElementById('btn-go-signup');
  const btnGoLogin = document.getElementById('btn-go-login');
  const btnBackToSignup = document.getElementById('btn-back-to-signup');
  const btnReRegister = document.getElementById('btn-re-register');

  const formLogin = document.getElementById('form-login');
  const formSignup = document.getElementById('form-signup');
  const formVerify = document.getElementById('form-verify');
  const btnResendOtp = document.getElementById('btn-resend-otp');

  const showcaseTitle = document.getElementById('showcase-title');
  const showcaseDesc = document.getElementById('showcase-description');
  const showcaseBadgeText = document.getElementById('showcase-badge-text');

  // Check URL parameters (e.g. ?mode=signup, ?expired=1, ?redirect=...)
  const urlParams = new URLSearchParams(window.location.search);
  const redirectTarget = urlParams.get('redirect') || 'index.html#try-now';
  const initialMode = urlParams.get('mode') || 'login';
  const isExpiredNotice = urlParams.get('expired') === '1';

  // Check if already logged in with active demo
  const activeUser = getActiveUser();
  if (activeUser && !isExpiredNotice) {
    syncPlatformDataToExtensionAndStandBy(activeUser);
    const demo = getDemoStatus(activeUser);
    if (!demo.isExpired) {
      // Already authenticated, proceed to target
      showAlert(`Already signed in as ${activeUser.email} (${demo.formatted}). Redirecting...`, 'success');
      setTimeout(() => {
        window.location.href = redirectTarget;
      }, 1000);
      return;
    }
  }

  if (isExpiredNotice) {
    viewDeactivated.classList.add('active');
  }

  // Set initial mode
  if (initialMode === 'signup') {
    setSignupMode();
  } else {
    setLoginMode();
  }

  // Mode Switch Handlers
  btnGoSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    setSignupMode();
  });

  btnGoLogin?.addEventListener('click', (e) => {
    e.preventDefault();
    setLoginMode();
  });

  btnBackToSignup?.addEventListener('click', (e) => {
    e.preventDefault();
    setSignupMode();
  });

  btnReRegister?.addEventListener('click', (e) => {
    e.preventDefault();
    viewDeactivated.classList.remove('active');
    setSignupMode();
  });

  // Password Visibility Toggle
  document.querySelectorAll('.btn-toggle-pwd').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const input = document.getElementById(targetId);
      if (input) {
        input.type = input.type === 'password' ? 'text' : 'password';
      }
    });
  });

  // -----------------------------------------------------------
  // Sign In Form Submission
  // -----------------------------------------------------------
  formLogin?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;

    const btn = document.getElementById('btn-submit-login');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Verifying...</span>';
    btn.disabled = true;

    try {
      const result = await loginUser({ email, password });

      if (result.success) {
        syncPlatformDataToExtensionAndStandBy(result.user);
        showAlert(`Welcome back, ${result.user.fullName || 'Candidate'}! (${result.demo.formatted})`, 'success');
        maybeShowSetupWizard(() => {
          window.location.href = redirectTarget;
        });
      } else if (result.unverified) {
        currentPendingEmail = email;
        showAlert(result.error, 'warning');
        setVerifyMode(email, null);
      } else if (result.expired) {
        showAlert(result.error, 'error');
        viewDeactivated.classList.add('active');
      } else {
        showAlert(result.error, 'error');
      }
    } catch (err) {
      showAlert('An unexpected error occurred. Please try again.', 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });

  // -----------------------------------------------------------
  // Sign Up Form Submission
  // -----------------------------------------------------------
  formSignup?.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAlert();

    const name = document.getElementById('signup-name').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const password = document.getElementById('signup-password').value;
    const confirmPassword = document.getElementById('signup-confirm-password').value;

    if (password !== confirmPassword) {
      showAlert('Passwords do not match. Please re-enter your password.', 'error');
      return;
    }

    const btn = document.getElementById('btn-submit-signup');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Sending Verification Code...</span>';
    btn.disabled = true;

    try {
      const result = await registerUser({ fullName: name, email, password });

      if (result.success) {
        currentPendingEmail = email;
        setVerifyMode(email, result.otpCode);
        if (result.sentViaEmailJs) {
          showAlert('Verification email dispatched via EmailJS! Please check your inbox.', 'success');
        } else {
          showAlert('Demo verification code generated! Enter the code below to activate your 4-day demo.', 'success');
        }
      } else {
        showAlert(result.error, 'error');
      }
    } catch (err) {
      console.error('[Registration Error]', err);
      showAlert(err.message || 'Failed to create account. Please try again.', 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });

  // -----------------------------------------------------------
  // Verification OTP Form Submission
  // -----------------------------------------------------------
  formVerify?.addEventListener('submit', (e) => {
    e.preventDefault();
    clearAlert();

    const otpInput = document.getElementById('input-verify-otp').value.trim();
    if (!otpInput) {
      showAlert('Please enter the 6-digit verification code.', 'error');
      return;
    }

    const btn = document.getElementById('btn-submit-verify');
    const origText = btn.innerHTML;
    btn.innerHTML = '<span>Activating Demo...</span>';
    btn.disabled = true;

    try {
      const result = verifyEmailOtp(currentPendingEmail, otpInput);

      if (result.success) {
        if (result.user) {
          syncPlatformDataToExtensionAndStandBy(result.user);
        }
        showAlert('Email verified successfully! 4-Day Demo has been activated.', 'success');
        maybeShowSetupWizard(() => {
          window.location.href = redirectTarget;
        });
      } else {
        showAlert(result.error, 'error');
      }
    } catch (err) {
      showAlert('Verification error. Please try again.', 'error');
    } finally {
      btn.innerHTML = origText;
      btn.disabled = false;
    }
  });

  // -----------------------------------------------------------
  // Resend OTP Code
  // -----------------------------------------------------------
  btnResendOtp?.addEventListener('click', async (e) => {
    e.preventDefault();
    if (!currentPendingEmail) return;

    btnResendOtp.disabled = true;
    btnResendOtp.textContent = 'Sending...';

    const result = await resendVerificationOtp(currentPendingEmail);
    if (result.success) {
      document.getElementById('display-otp-code').textContent = result.otpCode;
      showAlert(
        result.sentViaEmailJs 
          ? 'New verification email dispatched via EmailJS.' 
          : 'New verification code generated below.', 
        'success'
      );
    } else {
      showAlert(result.error, 'error');
    }

    setTimeout(() => {
      btnResendOtp.disabled = false;
      btnResendOtp.textContent = 'Resend Code';
    }, 5000);
  });

  // -----------------------------------------------------------
  // Mode Switch Helpers
  // -----------------------------------------------------------
  function updateTopGateBadge() {
    const topBadge = document.querySelector('.top-nav-badge');
    const early = getEarlyAdopterStats();
    if (topBadge) {
      if (early.remaining > 0) {
        topBadge.innerHTML = `<span class="pulse-dot"></span> FIRST 500 USERS: 2 WEEKS FREE + 24/7 SUPPORT (${early.remaining} SPOTS LEFT)`;
      } else {
        topBadge.innerHTML = `<span class="pulse-dot"></span> 4-DAY DEMO SECURITY GATE`;
      }
    }
  }

  function setLoginMode() {
    clearAlert();
    stage.classList.remove('mode-signup');
    stage.classList.add('mode-login');

    viewLogin.style.display = 'block';
    viewSignup.style.display = 'none';
    viewVerify.style.display = 'none';
    viewVerify.classList.remove('active');

    updateTopGateBadge();
    const early = getEarlyAdopterStats();
    if (early.remaining > 0) {
      showcaseTitle.innerHTML = 'Tailor Your Career History with <span class="teal-text">100% ATS Score.</span>';
      showcaseDesc.textContent = `First 500 candidates unlock 2 full weeks of free access with 24/7 customer support. Only ${early.remaining} of 500 early spots remain.`;
      showcaseBadgeText.textContent = `2 Weeks Free Access • ${early.remaining} Spots Left`;
    } else {
      showcaseTitle.innerHTML = 'Tailor Your Career History with <span class="teal-text">100% ATS Score.</span>';
      showcaseDesc.textContent = 'Automated resume calibration and instant multi-platform solver across LinkedIn, Indeed, Naukri, YC, and Foundit.';
      showcaseBadgeText.textContent = '4-Day Verified Access';
    }
  }

  function setSignupMode() {
    clearAlert();
    stage.classList.remove('mode-login');
    stage.classList.add('mode-signup');

    viewLogin.style.display = 'none';
    viewSignup.style.display = 'block';
    viewVerify.style.display = 'none';
    viewVerify.classList.remove('active');

    updateTopGateBadge();
    const early = getEarlyAdopterStats();
    if (early.remaining > 0) {
      showcaseTitle.innerHTML = 'Start Your Free <span class="teal-text">2-Week Trial.</span>';
      showcaseDesc.textContent = `Claim 14 days of unrestricted ATS tailoring and automated solvers with 24/7 customer support. Only ${early.remaining} spots left!`;
      showcaseBadgeText.textContent = `First 500 Privilege • 2 Weeks Free`;
    } else {
      showcaseTitle.innerHTML = 'Start Your Free <span class="teal-text">4-Day Full Demo.</span>';
      showcaseDesc.textContent = 'Instant verified access to automated ATS tailoring and 1-click platform solvers with complete client-side privacy.';
      showcaseBadgeText.textContent = 'Instant 4-Day Trial';
    }
  }

  function setVerifyMode(email, otpCode) {
    viewLogin.style.display = 'none';
    viewSignup.style.display = 'none';
    viewVerify.style.display = 'block';
    viewVerify.classList.add('active');

    document.getElementById('verify-email-display').textContent = email;
    if (otpCode) {
      document.getElementById('display-otp-code').textContent = otpCode;
    }
    const input = document.getElementById('input-verify-otp');
    input.value = '';
    input.focus();
  }

  function showAlert(msg, type = 'error') {
    alertContainer.innerHTML = `
      <div class="auth-alert-box alert-${type}">
        <div>${msg}</div>
      </div>
    `;
  }

  function clearAlert() {
    alertContainer.innerHTML = '';
  }
});
