/**
 * BioTailr AI - Pure Frontend Supabase Client Integration
 * Seamlessly backs up and syncs dynamic candidate profiles to Supabase.
 * Zero backend required: Runs 100% in the browser.
 */

export const SUPABASE_CONFIG = {
  url: 'https://txgkwrealcochtwlokzk.supabase.co',
  publishableKey: 'sb_publishable_1UmMkEcFAb8fwV3wYf0I3w_GrY5exxI',
  secretKey: (typeof window !== 'undefined' && window.__ENV__?.SUPABASE_SECRET_KEY) || ''
};

let supabaseClient = null;

/**
 * Initialize or get the Supabase Client instance from browser window.supabase
 */
export function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;

  if (typeof window !== 'undefined' && window.supabase && typeof window.supabase.createClient === 'function') {
    try {
      supabaseClient = window.supabase.createClient(
        SUPABASE_CONFIG.url,
        SUPABASE_CONFIG.publishableKey,
        {
          auth: {
            persistSession: true,
            autoRefreshToken: true
          }
        }
      );
      console.log('[Supabase] Initialized client for:', SUPABASE_CONFIG.url);
    } catch (e) {
      console.warn('[Supabase] Failed to initialize client:', e);
    }
  }
  return supabaseClient;
}

/**
 * Persist candidate profile and optional HTML resume to Supabase & local storage
 * @param {Object} profile - Extracted / edited candidate profile
 * @param {string} resumeHtml - Formatted ATS HTML resume string
 */
export async function saveProfileToSupabase(profile, resumeHtml = '') {
  if (!profile) return { success: false, error: 'No profile provided' };

  // 1. Always ensure local temporary storage is immediately updated
  try {
    localStorage.setItem('biotailr_candidate_profile', JSON.stringify(profile));
    localStorage.setItem('biotailr_dynamic_user_profile', JSON.stringify(profile));
    if (resumeHtml) {
      localStorage.setItem('biotailr_dynamic_resume_html', resumeHtml);
    }
  } catch (e) {
    console.warn('[Storage] Local storage save error:', e);
  }

  // 2. Synchronize to Supabase cloud database
  const client = getSupabaseClient();
  if (!client) {
    console.log('[Supabase] Client not initialized, profile stored locally.');
    return { success: true, localOnly: true };
  }

  try {
    const candidateId = profile.id || `cand_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const payload = {
      id: candidateId,
      full_name: profile.fullName || 'Candidate',
      email: profile.email || '',
      phone: profile.phone || '',
      title: profile.title || '',
      location: profile.location || '',
      profile_data: profile,
      resume_html: resumeHtml || '',
      updated_at: new Date().toISOString()
    };

    // Try upserting into candidate_profiles table
    const { data, error } = await client
      .from('candidate_profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      console.warn('[Supabase] Database upsert warning (fallback active):', error.message);
      // Try generic table fallback or log for graceful offline operation
      return { success: true, localOnly: true, cloudWarning: error.message };
    }

    console.log('[Supabase] Profile successfully synced to cloud:', candidateId);
    return { success: true, data };
  } catch (err) {
    console.warn('[Supabase] Sync encountered exception, safe local fallback preserved:', err);
    return { success: true, localOnly: true, cloudError: err.message };
  }
}

/**
 * Fetch candidate profile from Supabase or local storage fallback
 */
export async function fetchProfileFromSupabase(candidateId = null) {
  const client = getSupabaseClient();
  if (client && candidateId) {
    try {
      const { data, error } = await client
        .from('candidate_profiles')
        .select('*')
        .eq('id', candidateId)
        .single();

      if (!error && data && data.profile_data) {
        return data.profile_data;
      }
    } catch (e) {
      console.warn('[Supabase] Query error:', e);
    }
  }

  // Fallback to local storage
  try {
    const raw = localStorage.getItem('biotailr_candidate_profile') || localStorage.getItem('biotailr_dynamic_user_profile');
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return null;
}
