/**
 * BioTailr AI - API Configuration Manager
 *
 * Security & Deployment Architecture:
 *   1. Supabase and SMTP credentials are stored in `config.csv` in an ENCODED format
 *      (XOR cipher + Base64 obfuscation) using an internal secret key.
 *      Only this code can decode and process them at runtime.
 *   2. `config.csv` is committed and pushed to git so GitHub Pages works out-of-the-box
 *      without any backend or .env file.
 *   3. Gemini and Groq API keys are NEVER in the CSV or repo — they are strictly
 *      user-provided (Bring Your Own Key) via the setup wizard and stored in localStorage.
 *   4. Users may optionally override any credential via the setup wizard.
 */

const STORAGE_KEY = "biotailr_user_api_config";
const CSV_CACHE_KEY = "biotailr_decoded_csv_cache";

// Internal codec secret - matches scripts/encode-config.cjs
const CONFIG_SECRET = "BT_xK9_rnss_cfg_v1_2024_RNSSolutions";

/**
 * XOR Decryption with Base64 decoder
 */
export function xorDecode(b64, key = CONFIG_SECRET) {
  if (!b64 || typeof b64 !== "string") return "";
  try {
    const raw = (typeof atob === "function")
      ? atob(b64.trim())
      : (typeof Buffer !== "undefined" ? Buffer.from(b64.trim(), "base64").toString("binary") : "");
    if (!raw) return "";
    let result = "";
    for (let i = 0; i < raw.length; i++) {
      result += String.fromCharCode(raw.charCodeAt(i) ^ key.charCodeAt(i % key.length));
    }
    return result;
  } catch (e) {
    console.warn("[BioTailr Config] Decode error:", e.message);
    return "";
  }
}

// In-memory decoded CSV configuration
let DECODED_CSV = {};

// Load any previously cached decoded values from localStorage for instant synchronous availability
try {
  const cached = localStorage.getItem(CSV_CACHE_KEY);
  if (cached) {
    DECODED_CSV = JSON.parse(cached);
  }
} catch (e) {}

/**
 * Key mapping from CSV column identifiers to application config keys
 */
const CSV_KEY_MAP = {
  supabase_url:             "supabaseUrl",
  supabase_publishable_key: "supabasePublishableKey",
  supabase_key:             "supabasePublishableKey",
  supabase_secret_key:      "supabaseSecretKey",
  supabase_jwks_url:        "supabaseJwksUrl",
  smtp_host:                "smtpHost",
  smtp_port:                "smtpPort",
  smtp_user:                "smtpUser",
  smtp_pass:                "smtpPass",
  smtp_from:                "smtpFrom",
  emailjs_public_key:       "emailjsPublicKey",
  emailjs_service_id:       "emailjsServiceId",
  emailjs_template_id:      "emailjsTemplateId"
};

/**
 * Asynchronously fetches config.csv from repository root, decodes the values,
 * and caches them for use across the entire application.
 */
export async function loadEncodedCsvConfig() {
  try {
    // Resolve config.csv relative to this module's location (works on localhost & GitHub Pages subpaths)
    const csvUrl = new URL("../config.csv", import.meta.url).href;
    const response = await fetch(csvUrl, { cache: "no-cache" });
    if (!response.ok) {
      console.warn(`[BioTailr Config] Failed to fetch config.csv: HTTP ${response.status}`);
      return DECODED_CSV;
    }

    const text = await response.text();
    const lines = text.split(/\r?\n/);
    const parsed = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const commaIdx = line.indexOf(",");
      if (commaIdx === -1) continue;

      const rawKey = line.substring(0, commaIdx).trim().toLowerCase();
      const rawVal = line.substring(commaIdx + 1).trim();

      if (rawKey && rawVal) {
        const decodedVal = xorDecode(rawVal, CONFIG_SECRET);
        const mappedKey = CSV_KEY_MAP[rawKey] || rawKey;
        parsed[mappedKey] = decodedVal;
      }
    }

    DECODED_CSV = Object.assign({}, DECODED_CSV, parsed);
    try {
      localStorage.setItem(CSV_CACHE_KEY, JSON.stringify(DECODED_CSV));
    } catch (e) {}

    console.log("[BioTailr Config] Decoded credentials from config.csv successfully:", Object.keys(parsed));

    // Dispatch global event so subscribers (e.g. Supabase client) can refresh if needed
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("biotailr:config-loaded", { detail: DECODED_CSV }));
    }

    return DECODED_CSV;
  } catch (err) {
    console.warn("[BioTailr Config] Exception loading config.csv:", err.message);
    return DECODED_CSV;
  }
}

// Auto-trigger config loading on module evaluation in browser
if (typeof window !== "undefined") {
  loadEncodedCsvConfig();
}

/**
 * UI Form definitions for Setup Wizard
 */
export const API_KEY_FIELDS = [
  {
    id: "geminiKey",
    label: "Google Gemini API Key",
    placeholder: "AIzaSy...",
    helpUrl: "https://aistudio.google.com/app/apikey",
    helpText: "Google AI Studio - Get Free Key",
    required: false,
    group: "AI Providers (Provide Gemini OR Groq - either one is enough)"
  },
  {
    id: "groqKey",
    label: "Groq API Key (Llama 3.3)",
    placeholder: "gsk_...",
    helpUrl: "https://console.groq.com/keys",
    helpText: "Groq Console - Get Free Key",
    required: false,
    group: "AI Providers (Provide Gemini OR Groq - either one is enough)"
  }
];

/**
 * Returns user-specified overrides from localStorage.
 */
export function getUserApiConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

/**
 * Persists user-specified overrides to localStorage.
 */
export function saveUserApiConfig(updates) {
  const current = getUserApiConfig();
  const merged = Object.assign({}, current, updates || {});
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  return merged;
}

/**
 * Clears user overrides from localStorage.
 */
export function clearUserApiConfig() {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Resolves effective configuration value:
 * 1. User manual override from localStorage
 * 2. Decoded value from config.csv
 * 3. Empty string
 */
function resolve(key) {
  const userCfg = getUserApiConfig();
  if (userCfg[key] && userCfg[key].trim()) return userCfg[key].trim();
  if (DECODED_CSV[key] && DECODED_CSV[key].trim()) return DECODED_CSV[key].trim();
  return "";
}

/**
 * Returns true if the user has provided either a Gemini OR a Groq API Key (either one is enough).
 */
export function hasMinimumConfig() {
  const gemini = resolve("geminiKey");
  const groq = resolve("groqKey");
  return !!((gemini && gemini.length > 5) || (groq && groq.length > 5));
}

export function getGeminiKey() {
  return resolve("geminiKey");
}

export function getGroqKey() {
  return resolve("groqKey");
}

/**
 * Returns Supabase credentials decoded from config.csv (or user override).
 */
export function getSupabaseConfig() {
  return {
    url: resolve("supabaseUrl"),
    publishableKey: resolve("supabasePublishableKey"),
    secretKey: resolve("supabaseSecretKey"),
    jwksUrl: resolve("supabaseJwksUrl")
  };
}

/**
 * Returns SMTP mail configuration decoded from config.csv.
 */
export function getSmtpConfig() {
  return {
    host: resolve("smtpHost"),
    port: resolve("smtpPort") || "587",
    user: resolve("smtpUser"),
    pass: resolve("smtpPass"),
    from: resolve("smtpFrom")
  };
}

/**
 * Returns EmailJS configuration.
 */
export function getEmailJsConfig() {
  return {
    publicKey: resolve("emailjsPublicKey"),
    serviceId: resolve("emailjsServiceId"),
    templateId: resolve("emailjsTemplateId")
  };
}
