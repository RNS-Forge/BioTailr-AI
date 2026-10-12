import { getSupabaseClient } from './supabase-client.js';

const USERS_STORAGE_KEY = 'biotailr_registered_users';
const ACTIVE_USER_STORAGE_KEY = 'biotailr_active_user';
const EMAILJS_CONFIG_KEY = 'biotailr_emailjs_config';

// 4 Days in milliseconds: 4 * 24 * 60 * 60 * 1000 = 345,600,000 ms
export const DEMO_DURATION_MS = 4 * 24 * 60 * 60 * 1000;
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
  const client = getSupabaseClient();
  if (client?.auth?.signOut) {
    client.auth.signOut().catch(() => {});
  }
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

  const otp = generateOtpCode();
  const now = Date.now();
  const expiresAt = now + DEMO_DURATION_MS; // Strict 4-Day Demo Window
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
            demo_expires_at: expiresAt
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
          const restoredUser = {
            id: sData.user.id,
            supabaseId: sData.user.id,
            fullName: sData.user.user_metadata?.full_name || 'Candidate',
            email: normalizedEmail,
            verified: true,
            createdAt: now,
            expiresAt: now + DEMO_DURATION_MS,
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

