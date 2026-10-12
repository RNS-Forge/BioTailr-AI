/**
 * BioTailr AI - Admin Authentication Service
 * Strictly handles admin credentials and role validation
 */

const ADMIN_STORAGE_KEY = 'biotailr_admin_session';

export const ADMIN_CREDENTIALS = {
  email: 'admin@rnssolutions.com',
  password: 'passwordofrnssolution',
  role: 'admin'
};

/**
 * Log in admin via Supabase GoTrue Auth or verified credentials
 */
export async function loginAdmin(email, password) {
  const normEmail = (email || '').trim().toLowerCase();
  const inputPass = (password || '').trim();

  // Validate admin email
  if (normEmail !== ADMIN_CREDENTIALS.email.toLowerCase()) {
    return { success: false, error: 'Unauthorized: Access restricted to RNS Solutions Admin accounts.' };
  }

  // Validate admin password
  if (inputPass !== ADMIN_CREDENTIALS.password) {
    return { success: false, error: 'Incorrect admin password. Please re-enter.' };
  }

  // Authenticate against Supabase GoTrue Cloud Auth
  let supabaseToken = null;
  try {
    const res = await fetch('https://txgkwrealcochtwlokzk.supabase.co/auth/v1/token?grant_type=password', {
      method: 'POST',
      headers: {
        'apikey': 'sb_publishable_1UmMkEcFAb8fwV3wYf0I3w_GrY5exxI',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: normEmail,
        password: inputPass
      })
    });
    if (res.ok) {
      const supaData = await res.json();
      supabaseToken = supaData.access_token;
      console.log('[Admin Auth] Verified with Supabase GoTrue cloud role:', supaData.user?.app_metadata?.role);
    }
  } catch (err) {
    console.warn('[Admin Auth] Supabase cloud auth note:', err);
  }

  // Create Verified Admin Session
  const session = {
    email: normEmail,
    role: 'admin',
    name: 'RNS Solutions Admin',
    loginTime: Date.now(),
    supabaseToken: supabaseToken
  };

  localStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(session));
  return { success: true, session };
}

/**
 * Retrieve Active Admin Session
 */
export function getActiveAdminSession() {
  const raw = localStorage.getItem(ADMIN_STORAGE_KEY);
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (session && session.email === ADMIN_CREDENTIALS.email && session.role === 'admin') {
      return session;
    }
  } catch (e) {}
  return null;
}

/**
 * Guard page: Require admin authentication
 */
export function requireAdminAuth() {
  const session = getActiveAdminSession();
  if (!session) {
    window.location.href = 'index.html';
    return null;
  }
  return session;
}

/**
 * Admin Logout
 */
export function logoutAdmin() {
  localStorage.removeItem(ADMIN_STORAGE_KEY);
  window.location.href = 'index.html';
}
