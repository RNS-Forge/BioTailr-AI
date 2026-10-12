/**
 * BioTailr AI - Config Encoder
 * 
 * Reads Supabase, SMTP, and EmailJS credentials from .env or preset values,
 * explicitly EXCLUDES Gemini and Groq API keys (which remain user-provided),
 * and encodes all values into config.csv using XOR cipher + Base64.
 *
 * Usage: node scripts/encode-config.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");
const ENV_PATH = path.join(ROOT_DIR, ".env");
const CSV_OUT_PATH = path.join(ROOT_DIR, "config.csv");

// Internal secret for XOR encoding - matches js/api-config.js
const SECRET = "BT_xK9_rnss_cfg_v1_2024_RNSSolutions";

function xorEncode(str, key) {
  if (!str) return "";
  let result = "";
  for (let i = 0; i < str.length; i++) {
    result += String.fromCharCode(
      str.charCodeAt(i) ^ key.charCodeAt(i % key.length)
    );
  }
  return Buffer.from(result, "binary").toString("base64");
}

function parseEnv(filePath) {
  const env = {};
  if (!fs.existsSync(filePath)) return env;
  const content = fs.readFileSync(filePath, "utf8");
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();
      // Remove surrounding quotes if any
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      env[key] = val;
    }
  }
  return env;
}

const envValues = parseEnv(ENV_PATH);

// Build dictionary of credentials EXCEPT Gemini and Groq
const credentials = {
  // Supabase Database & Auth (Client-safe anon key and project URL)
  supabase_url:             envValues.SUPABASE_URL || "https://txgkwrealcochtwlokzk.supabase.co",
  supabase_publishable_key: envValues.SUPABASE_PUBLISHABLE_KEY || "",
  supabase_jwks_url:        envValues.SUPABASE_JWKS_URL || "",

  // SMTP Mail Server Configuration
  smtp_host:                envValues.SMTP_HOST || "smtp.gmail.com",
  smtp_port:                envValues.SMTP_PORT || "587",
  smtp_user:                envValues.SMTP_USER || "sanjay.n.ihub@snsgroups.com",
  smtp_pass:                envValues.SMTP_PASS || "myiy typl poyy pnnj",
  smtp_from:                envValues.SMTP_FROM || "sanjay.n.ihub@snsgroups.com",

  // EmailJS configuration (if any)
  emailjs_public_key:       envValues.EMAILJS_PUBLIC_KEY || "",
  emailjs_service_id:       envValues.EMAILJS_SERVICE_ID || "",
  emailjs_template_id:      envValues.EMAILJS_TEMPLATE_ID || ""
};

// Build CSV lines
const lines = ["KEY,VALUE"];
for (const [key, rawVal] of Object.entries(credentials)) {
  const encoded = rawVal ? xorEncode(rawVal, SECRET) : "";
  lines.push(`${key},${encoded}`);
}

fs.writeFileSync(CSV_OUT_PATH, lines.join("\n"), "utf8");

console.log("Successfully generated config.csv at:", CSV_OUT_PATH);
console.log("------------------------------------------------------------");
console.log("Encoded keys included:");
lines.forEach((line) => {
  const parts = line.split(",");
  if (parts[0] === "KEY") return;
  const valPreview = parts[1] ? (parts[1].substring(0, 16) + "...") : "(empty)";
  console.log(`  ${parts[0].padEnd(26)} -> [ENCODED: ${valPreview}]`);
});
console.log("------------------------------------------------------------");
console.log("Notice: GEMINI and GROQ keys were EXCLUDED as requested (users provide their own).");
