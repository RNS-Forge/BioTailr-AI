/**
 * BioTailr AI - Pure Client-Side Authentication & 4-Day Demo Service
 * Features:
 * - 100% Client-Side with Zero Backend Required
 * - Email verification via EmailJS with graceful fallback
 * - 4-Day Demo trial window with automatic deactivation upon expiry
 * - LocalStorage state management with Supabase cloud sync
 */

const USERS_STORAGE_KEY = 'biotailr_registered_users';
const ACTIVE_USER_STORAGE_KEY = 'biotailr_active_user';
const EMAILJS_CONFIG_KEY = 'biotailr_emailjs_config';

// 4 Days in milliseconds: 4 * 24 * 60 * 60 * 1000 = 345,600,000 ms
export const DEMO_DURATION_MS = 4 * 24 * 60 * 60 * 1000;
export const OTP_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns EmailJS configuration
 */
export function getEmailJsConfig() {
  const saved = localStorage.getItem(EMAILJS_CONFIG_KEY);
  if (saved) {
    try { return JSON.parse(saved); } catch (e) {}
  }
  return {
    publicKey: '7rK9sX2mP0Lw-biotailr',
    serviceId: 'service_biotailr_auth',
    templateId: 'template_biotailr_otp'
  };
}

/**
 * Updates EmailJS configuration
 */
export function saveEmailJsConfig(cfg) {
  localStorage.setItem(EMAILJS_CONFIG_KEY, JSON.stringify(cfg));
  if (window.emailjs && cfg.publicKey) {
    try { window.emailjs.init(cfg.publicKey); } catch (e) {}
  }
}

/**
 * Retrieve all registered users map
 */
export function getAllUsers() {
  const data = localStorage.getItem(USERS_STORAGE_KEY);
  if (!data) return {};
  try {
    return JSON.parse(data);
  } catch (e) {
    return {};
  }
}

/**
 * Save users map to storage
 */
function saveUsersMap(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Generate a 6-digit numeric OTP code
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Calculates remaining demo time for a user
 */
export function getDemoStatus(user) {
  if (!user) return { isAuthenticated: false, isExpired: true, days: 0, hours: 0, formatted: 'Not Logged In' };
  
  if (!user.verified) {
    return { isAuthenticated: true, isVerified: false, isExpired: false, days: 0, hours: 0, formatted: 'Email Unverified' };
  }

  const now = Date.now();
  const expiresAt = user.expiresAt || (user.createdAt + DEMO_DURATION_MS);
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0 || user.isActive === false) {
    return {
      isAuthenticated: true,
      isVerified: true,
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      formatted: '4-Day Demo Expired (Deactivated)'
    };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let formatted = '';
  if (days >= 1) {
    formatted = `${days} Day${days > 1 ? 's' : ''} Left`;
  } else if (hours >= 1) {
    formatted = `${hours}h Left`;
  } else {
    formatted = `${minutes}m Left`;
  }

  return {
    isAuthenticated: true,
    isVerified: true,
    isExpired: false,
    days,
    hours,
    minutes,
    remainingMs,
    formatted: `Demo: ${formatted}`
  };
}

/**
 * Retrieves the currently active user session and validates 4-day expiry
 */
export function getActiveUser() {
  const data = localStorage.getItem(ACTIVE_USER_STORAGE_KEY);
  if (!data) return null;
  try {
    const user = JSON.parse(data);
    const users = getAllUsers();
    const latest = users[user.email.toLowerCase()] || user;

    // Check 4-day expiry
    const demo = getDemoStatus(latest);
    if (demo.isExpired) {
      latest.isActive = false;
      users[latest.email.toLowerCase()] = latest;
      saveUsersMap(users);
      localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(latest));
    }

    return latest;
  } catch (e) {
    return null;
  }
}

/**
 * Sets active user session
 */
export function setActiveUser(user) {
  if (!user) {
    localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
  } else {
    localStorage.setItem(ACTIVE_USER_STORAGE_KEY, JSON.stringify(user));
  }
}

/**
 * Logs out the active user
 */
export function logoutUser() {
  localStorage.removeItem(ACTIVE_USER_STORAGE_KEY);
}

/**
 * Sends Verification Email using EmailJS with graceful fallback
 */
export async function sendVerificationOtpEmail(email, fullName, otpCode) {
  const cfg = getEmailJsConfig();
  let sentViaEmailJs = false;
  let emailJsError = null;

  if (window.emailjs && cfg.publicKey && cfg.serviceId && cfg.templateId) {
    try {
      window.emailjs.init(cfg.publicKey);
      await window.emailjs.send(
        cfg.serviceId,
        cfg.templateId,
        {
          to_email: email,
          to_name: fullName || 'Candidate',
          verification_code: otpCode,
          otp_code: otpCode,
          demo_duration: '4 Days',
          support_email: 'sanjay.n.ihub@snsgroups.com'
        },
        cfg.publicKey
      );
      sentViaEmailJs = true;
    } catch (err) {
      console.warn('[BioTailr EmailJS] Send attempt failed:', err);
      emailJsError = err.text || err.message;
    }
  }

  return {
    success: true,
    sentViaEmailJs,
    emailJsError,
    otpCode
  };
}

/**
 * Registers a new user account with pending verification
 */
export async function registerUser({ fullName, email, password }) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = getAllUsers();

  // If user exists and is already verified, check expiry
  if (users[normalizedEmail] && users[normalizedEmail].verified) {
    const demo = getDemoStatus(users[normalizedEmail]);
    if (demo.isExpired) {
      return { 
        success: false, 
        error: 'This email account has already completed its 4-day demo and is deactivated.' 
      };
    }
    return { 
      success: false, 
      error: 'An account with this email already exists. Please sign in.' 
    };
  }

  const otp = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + DEMO_DURATION_MS; // Strict 4-Day Demo Window

  const newUser = {
    id: 'usr_' + now + '_' + Math.random().toString(36).slice(2, 8),
    fullName: fullName.trim() || 'Candidate',
    email: normalizedEmail,
    password: password, // client-side demo storage
    verified: false,
    otpCode: otp,
    otpExpiresAt: now + OTP_VALIDITY_MS,
    createdAt: now,
    expiresAt: expiresAt,
    isActive: true
  };

  users[normalizedEmail] = newUser;
  saveUsersMap(users);

  // Dispatch EmailJS verification
  const emailResult = await sendVerificationOtpEmail(normalizedEmail, newUser.fullName, otp);

  return {
    success: true,
    email: normalizedEmail,
    otpCode: otp,
    sentViaEmailJs: emailResult.sentViaEmailJs,
    message: emailResult.sentViaEmailJs 
      ? 'Verification email sent via EmailJS.' 
      : 'Verification code generated.'
  };
}

/**
 * Verifies the 6-digit OTP code for an email
 */
export function verifyEmailOtp(email, inputCode) {
  const normalizedEmail = email.toLowerCase().trim();
  const users = getAllUsers();
  const user = users[normalizedEmail];

  if (!user) {
    return { success: false, error: 'Account not found. Please register first.' };
  }

  if (user.verified) {
    setActiveUser(user);
    return { success: true, user, alreadyVerified: true };
  }

  if (Date.now() > user.otpExpiresAt) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  if (user.otpCode.trim() !== inputCode.trim()) {
    return { success: false, error: 'Incorrect 6-digit verification code. Please check and re-enter.' };
  }

  // Verification successful!
  user.verified = true;
  user.verifiedAt = Date.now();
  // Ensure demo window starts from verification if preferred or preserved
  if (!user.expiresAt) {
    user.expiresAt = Date.now() + DEMO_DURATION_MS;
  }
  user.isActive = true;

  users[normalizedEmail] = user;
  saveUsersMap(users);
  setActiveUser(user);

  return {
    success: true,
    user
  };
}

/**
 * Resends a new OTP code to the email
 */
export async function resendVerificationOtp(email) {
  const normalizedEmail = email.toLowerCase().trim();
  const users = getAllUsers();
  const user = users[normalizedEmail];

  if (!user) {
    return { success: false, error: 'User account not found.' };
  }

  const newOtp = generateOtpCode();
  user.otpCode = newOtp;
  user.otpExpiresAt = Date.now() + OTP_VALIDITY_MS;

  users[normalizedEmail] = user;
  saveUsersMap(users);

  const emailResult = await sendVerificationOtpEmail(normalizedEmail, user.fullName, newOtp);

  return {
    success: true,
    otpCode: newOtp,
    sentViaEmailJs: emailResult.sentViaEmailJs
  };
}

/**
 * Logs in with email and password
 */
export function loginUser({ email, password }) {
  if (!email || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = getAllUsers();
  const user = users[normalizedEmail];

  if (!user) {
    return { 
      success: false, 
      error: 'No account found with this email. Please sign up for a 4-day demo.' 
    };
  }

  if (user.password !== password) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  // Check verification
  if (!user.verified) {
    return {
      success: false,
      unverified: true,
      email: normalizedEmail,
      error: 'Email is not yet verified. Please enter the verification code sent to your email.'
    };
  }

  // Check 4-day demo validity
  const demo = getDemoStatus(user);
  if (demo.isExpired) {
    user.isActive = false;
    users[normalizedEmail] = user;
    saveUsersMap(users);
    logoutUser();
    return {
      success: false,
      expired: true,
      error: 'Your 4-day demo has expired. This account has been automatically deactivated.'
    };
  }

  // All checks pass
  setActiveUser(user);
  return {
    success: true,
    user,
    demo
  };
}

/**
 * Check if the current session is valid to access Try Now / Studio
 */
export function requireActiveDemo() {
  const user = getActiveUser();
  if (!user) {
    return { allowed: false, reason: 'unauthenticated' };
  }
  if (!user.verified) {
    return { allowed: false, reason: 'unverified', email: user.email };
  }
  const demo = getDemoStatus(user);
  if (demo.isExpired) {
    return { allowed: false, reason: 'expired', user };
  }
  return { allowed: true, user, demo };
}
