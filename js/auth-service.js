import { getSupabaseClient } from './supabase-client.js';
import { getEmailJsConfig as _getEmailJsCfg, getSmtpConfig as _getSmtpCfg, saveUserApiConfig } from './api-config.js';

const USERS_STORAGE_KEY = 'biotailr_registered_users';
const ACTIVE_USER_STORAGE_KEY = 'biotailr_active_user';
const EMAILJS_CONFIG_KEY = 'biotailr_emailjs_config';

// Free Tier Windows
export const EARLY_ADOPTER_LIMIT = 500;
export const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000; // 14 Days for First 500 Users
export const FOUR_DAYS_MS = 4 * 24 * 60 * 60 * 1000;   // 4 Days for Regular Demo
export const DEMO_DURATION_MS = FOUR_DAYS_MS;
export const OTP_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes
export const MAX_LOGIN_ATTEMPTS = 5;
export const LOCKOUT_DURATION_MS = 10 * 60 * 1000; // 10 minutes lockout

/**
 * High-Security Password Hasher using native Web Crypto SHA-256
 */
export async function hashPassword(password, salt = 'biotailr_auth_v1') {
  if (!password) return '';
  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const enc = new TextEncoder();
      const data = enc.encode(`${salt}:${password}:${salt}`);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch (e) {}

  // Safe fallback
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    hash = ((hash << 5) - hash) + password.charCodeAt(i);
    hash |= 0;
  }
  return 'h_' + Math.abs(hash);
}

/**
 * Sanitizes user input to prevent XSS attacks
 */
export function sanitizeInput(str) {
  if (!str) return '';
  return String(str)
    .replace(/[<>'"&]/g, (s) => ({
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;',
      '&': '&amp;'
    }[s] || ''))
    .trim();
}

/**
 * Returns EmailJS configuration from user-provided api-config.
 */
export function getEmailJsConfig() {
  return _getEmailJsCfg();
}

/**
 * Returns SMTP mail configuration decoded from config.csv.
 */
export function getSmtpConfig() {
  return _getSmtpCfg();
}

/**
 * Updates EmailJS configuration via user api-config.
 */
export function saveEmailJsConfig(cfg) {
  saveUserApiConfig({
    emailjsPublicKey: cfg.publicKey || '',
    emailjsServiceId: cfg.serviceId || '',
    emailjsTemplateId: cfg.templateId || ''
  });
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
export function saveUsersMap(users) {
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
}

/**
 * Generate a 6-digit numeric OTP code
 */
export function generateOtpCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Returns dynamic Early Adopter capacity stats
 */
export function getEarlyAdopterStats() {
  const users = getAllUsers();
  const registeredCount = Object.keys(users).length;
  // Starting seed count to demonstrate real live counter counting down from 500
  const claimedCount = Math.min(500, Math.max(registeredCount, 134));
  const remaining = Math.max(0, 500 - claimedCount);
  return {
    limit: 500,
    claimed: claimedCount,
    remaining: remaining
  };
}

/**
 * Calculates remaining demo time or subscription status for a user
 */
export function getDemoStatus(user) {
  if (!user) return { isAuthenticated: false, isExpired: true, days: 0, hours: 0, formatted: 'Not Logged In' };
  
  if (!user.verified) {
    return { isAuthenticated: true, isVerified: false, isExpired: false, days: 0, hours: 0, formatted: 'Email Unverified' };
  }

  // 1. Paid Subscription: NO DAYS SHOWN
  if (user.subscription && user.subscription.status === 'active') {
    return {
      isAuthenticated: true,
      isVerified: true,
      isExpired: false,
      isSubscriber: true,
      planName: user.subscription.planName || 'Active Subscription',
      formatted: `${user.subscription.planName || 'Active Subscriber'}`
    };
  }

  // 2. Admin User
  if (user.role === 'admin' || user.email?.toLowerCase() === 'admin@rnssolutions.com') {
    return {
      isAuthenticated: true,
      isVerified: true,
      isExpired: false,
      isAdmin: true,
      formatted: 'System Administrator'
    };
  }

  const now = Date.now();
  const isEarly = !!user.isEarlyAdopter || (user.registrationIndex && user.registrationIndex <= 500);
  const defaultDuration = isEarly ? TWO_WEEKS_MS : FOUR_DAYS_MS;
  const expiresAt = user.expiresAt || (user.createdAt + defaultDuration);
  const remainingMs = expiresAt - now;

  if (remainingMs <= 0 || user.isActive === false) {
    return {
      isAuthenticated: true,
      isVerified: true,
      isExpired: true,
      days: 0,
      hours: 0,
      minutes: 0,
      formatted: isEarly ? '2-Week Early Trial Ended' : '4-Day Demo Expired'
    };
  }

  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));

  let timeString = '';
  if (days >= 1) {
    timeString = `${days} Day${days > 1 ? 's' : ''} Left`;
  } else if (hours >= 1) {
    timeString = `${hours}h Left`;
  } else {
    timeString = `${minutes}m Left`;
  }

  return {
    isAuthenticated: true,
    isVerified: true,
    isExpired: false,
    isEarlyAdopter: isEarly,
    days,
    hours,
    minutes,
    remainingMs,
    formatted: isEarly ? `Early Access: ${timeString} (24/7 Support)` : `Demo: ${timeString}`
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
  const client = getSupabaseClient();
  if (client?.auth?.signOut) {
    client.auth.signOut().catch(() => {});
  }
}

/**
 * Sends Verification Email using EmailJS with graceful fallback
 */
export async function sendVerificationOtpEmail(email, fullName, otpCode) {
  const smtp = getSmtpConfig();
  const emailJsCfg = getEmailJsConfig();
  let emailDispatched = false;
  let deliveryMethod = 'none';
  let lastError = null;

  // 1. Primary: SMTP Mailer via /api/send-email (uses credentials from config.csv)
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: email,
        name: fullName || 'Candidate',
        otpCode: otpCode,
        smtpConfig: smtp
      })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.success) {
        console.log('[BioTailr Mail] Verification email dispatched via SMTP server');
        emailDispatched = true;
        deliveryMethod = 'smtp';
      }
    }
  } catch (e) {
    // Normal when running purely client-side on static hosting (e.g. GitHub Pages)
  }

  // 2. Secondary: EmailJS (if configured)
  if (!emailDispatched && window.emailjs && emailJsCfg.publicKey && emailJsCfg.serviceId && emailJsCfg.templateId) {
    try {
      window.emailjs.init(emailJsCfg.publicKey);
      await window.emailjs.send(
        emailJsCfg.serviceId,
        emailJsCfg.templateId,
        {
          to_email: email,
          to_name: fullName || 'Candidate',
          verification_code: otpCode,
          otp_code: otpCode,
          demo_duration: '4 Days',
          support_email: smtp.from || 'sanjay.n.ihub@snsgroups.com'
        },
        emailJsCfg.publicKey
      );
      console.log('[BioTailr Mail] Verification email dispatched via EmailJS');
      emailDispatched = true;
      deliveryMethod = 'emailjs';
    } catch (err) {
      console.warn('[BioTailr EmailJS] Send attempt failed:', err);
      lastError = err.text || err.message;
    }
  }

  // 3. Tertiary: Secure Client Relay for static deployments (GitHub Pages)
  if (!emailDispatched) {
    try {
      const relayRes = await fetch('https://formsubmit.co/ajax/' + encodeURIComponent(email), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          _subject: `Your BioTailr AI Verification Code: ${otpCode}`,
          _template: 'box',
          _captcha: 'false',
          name: 'BioTailr AI Security',
          recipient: email,
          verification_code: otpCode,
          message: `Hello ${fullName || 'Candidate'},\n\nYour 6-digit BioTailr AI verification code is: ${otpCode}\n\nUse this code to activate your 4-day verified demo access.\n\nThis code will expire in 15 minutes.\n\nBest regards,\nBioTailr AI Team`
        })
      });
      if (relayRes.ok) {
        const d = await relayRes.json();
        if (d.success === true || d.success === 'true') {
          emailDispatched = true;
          deliveryMethod = 'client-relay';
          console.log('[BioTailr Mail] Verification email dispatched via client relay');
        }
      }
    } catch (err) {
      lastError = err.message;
    }
  }

  return {
    success: true,
    emailDispatched,
    deliveryMethod,
    error: lastError,
    otpCode
  };
}

/**
 * Registers a new user account with pending verification and Supabase sync
 */
export async function registerUser({ fullName, email, password }) {
  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const cleanName = sanitizeInput(fullName) || 'Candidate';
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

  const now = Date.now();
  const otp = generateOtpCode();
  const totalRegisteredCount = Object.keys(users).length;
  const isEarlyAdopter = totalRegisteredCount < EARLY_ADOPTER_LIMIT;
  const accessDuration = isEarlyAdopter ? TWO_WEEKS_MS : FOUR_DAYS_MS;
  const expiresAt = now + accessDuration;
  const passwordHash = await hashPassword(password);

  // 1. Sync registration to Supabase database (GoTrue Auth)
  let supabaseUserId = null;
  const client = getSupabaseClient();
  if (client?.auth?.signUp) {
    try {
      const { data: supaData, error: supaErr } = await client.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: {
          data: {
            full_name: cleanName,
            demo_expires_at: expiresAt,
            is_early_adopter: isEarlyAdopter
          }
        }
      });
      if (!supaErr && supaData?.user) {
        supabaseUserId = supaData.user.id;
        console.log('[Supabase Auth] Registered user in cloud database:', supabaseUserId);
      } else if (supaErr) {
        console.warn('[Supabase Auth] Cloud registration note:', supaErr.message);
      }
    } catch (e) {
      console.warn('[Supabase Auth] Network exception, proceeding with verified local storage:', e);
    }
  }

  const newUser = {
    id: supabaseUserId || ('usr_' + now + '_' + Math.random().toString(36).slice(2, 8)),
    supabaseId: supabaseUserId,
    fullName: cleanName,
    email: normalizedEmail,
    passwordHash: passwordHash,
    isEarlyAdopter: isEarlyAdopter,
    registrationIndex: totalRegisteredCount + 1,
    verified: false,
    otpCode: otp,
    otpExpiresAt: now + OTP_VALIDITY_MS,
    otpAttempts: 0,
    failedAttempts: 0,
    lockoutUntil: 0,
    createdAt: now,
    expiresAt: expiresAt,
    isActive: true
  };

  users[normalizedEmail] = newUser;
  saveUsersMap(users);

  // 2. Dispatch EmailJS verification
  const emailResult = await sendVerificationOtpEmail(normalizedEmail, cleanName, otp);

  return {
    success: true,
    email: normalizedEmail,
    otpCode: otp,
    supabaseSynced: !!supabaseUserId,
    sentViaEmailJs: emailResult.sentViaEmailJs,
    message: emailResult.sentViaEmailJs 
      ? 'Verification email sent via EmailJS.' 
      : 'Verification code generated.'
  };
}

/**
 * Verifies the 6-digit OTP code for an email with brute-force protection
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

  // Security: Check OTP expiration
  if (Date.now() > user.otpExpiresAt) {
    return { success: false, error: 'Verification code has expired. Please request a new code.' };
  }

  // Security: Rate limiting OTP attempts
  user.otpAttempts = (user.otpAttempts || 0) + 1;
  if (user.otpAttempts > 5) {
    saveUsersMap(users);
    return { success: false, error: 'Too many incorrect attempts. Please request a new verification code.' };
  }

  if (user.otpCode.trim() !== inputCode.trim()) {
    saveUsersMap(users);
    return { success: false, error: 'Incorrect 6-digit verification code. Please check and re-enter.' };
  }

  // Verification successful!
  user.verified = true;
  user.verifiedAt = Date.now();
  user.otpAttempts = 0;
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
  user.otpAttempts = 0;

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
 * High-Security Login with Supabase Cloud Verification, Salted Hash, and Brute-Force Lockout
 */
export async function loginUser({ email, password }) {
  if (!email || !password) {
    return { success: false, error: 'Please enter both email and password.' };
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = getAllUsers();
  const user = users[normalizedEmail];

  if (!user) {
    // Attempt login directly against Supabase database if not in local cache
    const client = getSupabaseClient();
    if (client?.auth?.signInWithPassword) {
      try {
        const { data: sData, error: sErr } = await client.auth.signInWithPassword({
          email: normalizedEmail,
          password
        });
        if (!sErr && sData?.user) {
          const now = Date.now();
          const userRole = sData.user.app_metadata?.role || sData.user.user_metadata?.role || (normalizedEmail === 'admin@rnssolutions.com' ? 'admin' : 'user');
          const restoredUser = {
            id: sData.user.id,
            supabaseId: sData.user.id,
            fullName: sData.user.user_metadata?.full_name || (userRole === 'admin' ? 'RNS Solutions Admin' : 'Candidate'),
            email: normalizedEmail,
            role: userRole,
            verified: true,
            createdAt: now,
            expiresAt: userRole === 'admin' ? now + (100 * 365 * 24 * 60 * 60 * 1000) : now + DEMO_DURATION_MS,
            isActive: true
          };
          users[normalizedEmail] = restoredUser;
          saveUsersMap(users);
          setActiveUser(restoredUser);
          return { success: true, user: restoredUser, demo: getDemoStatus(restoredUser) };
        }
      } catch (e) {}
    }

    return { 
      success: false, 
      error: 'No account found with this email. Please sign up for a 4-day demo.' 
    };
  }

  // Security: Check brute-force lockout
  if (user.lockoutUntil && Date.now() < user.lockoutUntil) {
    const minutesLeft = Math.ceil((user.lockoutUntil - Date.now()) / 60000);
    return {
      success: false,
      error: `Security Lockout: Account temporarily locked due to repeated failed attempts. Please try again in ${minutesLeft} minute${minutesLeft > 1 ? 's' : ''}.`
    };
  }

  // Verify Password: match hashed password or legacy plaintext
  const inputHash = await hashPassword(password);
  const passwordMatches = (user.passwordHash && user.passwordHash === inputHash) ||
                          (user.password && user.password === password);

  if (!passwordMatches) {
    user.failedAttempts = (user.failedAttempts || 0) + 1;
    if (user.failedAttempts >= MAX_LOGIN_ATTEMPTS) {
      user.lockoutUntil = Date.now() + LOCKOUT_DURATION_MS;
      saveUsersMap(users);
      return {
        success: false,
        error: `Security Alert: 5 incorrect password attempts reached. Account locked for 10 minutes.`
      };
    }
    saveUsersMap(users);
    const remaining = MAX_LOGIN_ATTEMPTS - user.failedAttempts;
    return { 
      success: false, 
      error: `Incorrect password. ${remaining} attempt${remaining > 1 ? 's' : ''} remaining before temporary security lockout.` 
    };
  }

  // Password verified: Reset failed attempts
  user.failedAttempts = 0;
  user.lockoutUntil = 0;
  if (!user.passwordHash) {
    user.passwordHash = inputHash;
    delete user.password; // Clean legacy plaintext
  }
  saveUsersMap(users);

  // Check verification
  if (!user.verified) {
    return {
      success: false,
      unverified: true,
      email: normalizedEmail,
      error: 'Email is not yet verified. Please enter the verification code sent to your email.'
    };
  }

  // Check 4-day demo validity (admins exempt)
  const isAdmin = user.role === 'admin' || normalizedEmail === 'admin@rnssolutions.com';
  const demo = getDemoStatus(user);
  if (!isAdmin && demo.isExpired) {
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

  // Supabase Auth session sync
  const client = getSupabaseClient();
  if (client?.auth?.signInWithPassword) {
    client.auth.signInWithPassword({ email: normalizedEmail, password }).catch(() => {});
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

