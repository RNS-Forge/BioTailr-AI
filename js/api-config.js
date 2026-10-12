/**
 * BioTailr AI - User API Configuration Manager
 * Allows each user to bring their own API keys.
 * Keys are stored in localStorage only - never sent to any server.
 *
 * Keys managed:
 *   - Gemini API Key (Google AI Studio)
 *   - Groq API Key (console.groq.com)
 *   - Supabase URL + Publishable Key (app.supabase.com)
 *   - EmailJS Public Key + Service ID + Template ID (emailjs.com)
 */

const STORAGE_KEY = "biotailr_user_api_config";

export const API_KEY_FIELDS = [
  {
    id: "geminiKey",
    label: "Gemini API Key",
    placeholder: "AIza...",
    helpUrl: "https://aistudio.google.com/app/apikey",
    helpText: "Google AI Studio - Get API Key",
    required: true,
    group: "AI Models"
  },
  {
    id: "groqKey",
    label: "Groq API Key",
    placeholder: "gsk_...",
    helpUrl: "https://console.groq.com/keys",
    helpText: "Groq Console - API Keys",
    required: false,
    group: "AI Models"
  },
  {
    id: "supabaseUrl",
    label: "Supabase Project URL",
    placeholder: "https://xxxxx.supabase.co",
    helpUrl: "https://supabase.com/dashboard/project/_/settings/api",
    helpText: "Supabase Dashboard - Project Settings - API",
    required: false,
    group: "Database"
  },
  {
    id: "supabasePublishableKey",
    label: "Supabase Publishable (anon) Key",
    placeholder: "sb_publishable_...",
    helpUrl: "https://supabase.com/dashboard/project/_/settings/api",
    helpText: "Supabase Dashboard - Project Settings - API",
    required: false,
    group: "Database"
  },
  {
    id: "emailjsPublicKey",
    label: "EmailJS Public Key",
    placeholder: "Your EmailJS Public Key",
    helpUrl: "https://dashboard.emailjs.com/admin/account",
    helpText: "EmailJS Dashboard - Account",
    required: false,
    group: "Email"
  },
  {
    id: "emailjsServiceId",
    label: "EmailJS Service ID",
    placeholder: "service_...",
    helpUrl: "https://dashboard.emailjs.com/admin",
    helpText: "EmailJS Dashboard - Email Services",
    required: false,
    group: "Email"
  },
  {
    id: "emailjsTemplateId",
    label: "EmailJS Template ID",
    placeholder: "template_...",
    helpUrl: "https://dashboard.emailjs.com/admin/templates",
    helpText: "EmailJS Dashboard - Email Templates",
    required: false,
    group: "Email"
  }
];

/**
 * Returns the currently saved user API config object from localStorage.
 */
export function getUserApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

/**
 * Persists a partial or full config update to localStorage.
 */
export function saveUserApiConfig(updates) {
  const current = getUserApiConfig();
  const merged = Object.assign({}, current, updates || {});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/**
 * Clears all saved user API config from localStorage.
 */
export function clearUserApiConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Returns true if at minimum the Gemini API Key is saved.
 */
export function hasMinimumConfig() {
  const cfg = getUserApiConfig();
  return !!(cfg.geminiKey && cfg.geminiKey.trim().length > 10);
}

export function getGeminiKey() {
  return getUserApiConfig().geminiKey || "";
}

export function getGroqKey() {
  return getUserApiConfig().groqKey || "";
}

export function getSupabaseConfig() {
  const cfg = getUserApiConfig();
  return {
    url: cfg.supabaseUrl || "",
    publishableKey: cfg.supabasePublishableKey || ""
  };
}

export function getEmailJsConfig() {
  const cfg = getUserApiConfig();
  return {
    publicKey: cfg.emailjsPublicKey || "",
    serviceId: cfg.emailjsServiceId || "",
    templateId: cfg.emailjsTemplateId || ""
  };
}
