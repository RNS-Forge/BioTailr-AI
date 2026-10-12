/**
 * BioTailr AI - First-Time Setup Wizard
 * Renders a modal overlay prompting new users to enter their own API keys.
 * Triggered after first login if hasMinimumConfig() returns false.
 * Keys are saved to localStorage via api-config.js.
 */

import {
  API_KEY_FIELDS,
  getUserApiConfig,
  saveUserApiConfig,
  hasMinimumConfig
} from "./api-config.js";

const WIZARD_SHOWN_KEY = "biotailr_setup_wizard_shown";

/**
 * Inject the wizard CSS into <head> if not already present.
 */
function injectStyles() {
  if (document.getElementById("bt-wizard-styles")) return;
  const style = document.createElement("style");
  style.id = "bt-wizard-styles";
  style.textContent = `
    #bt-wizard-overlay {
      position: fixed;
      inset: 0;
      background: rgba(5, 15, 35, 0.85);
      z-index: 99999;
      display: flex;
      align-items: center;
      justify-content: center;
      animation: btFadeIn 0.25s ease;
      overflow-y: auto;
      padding: 24px;
    }
    @keyframes btFadeIn { from { opacity: 0; } to { opacity: 1; } }
    #bt-wizard-box {
      background: #0b1426;
      border: 1px solid #1e3a5f;
      width: 100%;
      max-width: 640px;
      padding: 40px 44px;
      animation: btSlideUp 0.3s ease;
      position: relative;
    }
    @keyframes btSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: none; opacity: 1; } }
    #bt-wizard-box h2 {
      font-family: "Plus Jakarta Sans", sans-serif;
      font-size: 1.45rem;
      font-weight: 700;
      color: #e8f0fe;
      margin: 0 0 6px;
    }
    #bt-wizard-box p.bt-wizard-sub {
      font-size: 0.875rem;
      color: #8baed4;
      margin: 0 0 28px;
      line-height: 1.6;
    }
    .bt-wizard-group-label {
      font-size: 0.7rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #00b4ab;
      padding: 16px 0 8px;
      border-top: 1px solid #1e3a5f;
      margin-top: 12px;
    }
    .bt-wizard-group-label:first-of-type {
      border-top: none;
      padding-top: 0;
      margin-top: 0;
    }
    .bt-wizard-field {
      margin-bottom: 14px;
    }
    .bt-wizard-field label {
      display: block;
      font-size: 0.8rem;
      font-weight: 600;
      color: #c5d8f0;
      margin-bottom: 5px;
    }
    .bt-wizard-field label .bt-req {
      color: #ef4444;
      margin-left: 3px;
    }
    .bt-wizard-field input {
      width: 100%;
      padding: 9px 12px;
      background: #0f1e3a;
      border: 1px solid #1e3a5f;
      color: #e8f0fe;
      font-size: 0.83rem;
      font-family: "JetBrains Mono", monospace;
      outline: none;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }
    .bt-wizard-field input:focus {
      border-color: #00b4ab;
    }
    .bt-wizard-field .bt-field-hint {
      font-size: 0.75rem;
      color: #5a7fa8;
      margin-top: 4px;
    }
    .bt-wizard-field .bt-field-hint a {
      color: #00b4ab;
      text-decoration: none;
    }
    .bt-wizard-field .bt-field-hint a:hover { text-decoration: underline; }
    .bt-wizard-actions {
      display: flex;
      gap: 12px;
      margin-top: 28px;
      align-items: center;
    }
    #bt-wizard-save {
      background: #00b4ab;
      color: #05162e;
      border: none;
      padding: 10px 28px;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      font-family: "Plus Jakarta Sans", sans-serif;
      letter-spacing: 0.02em;
      transition: background 0.2s;
    }
    #bt-wizard-save:hover { background: #009d96; }
    #bt-wizard-skip {
      background: transparent;
      border: none;
      color: #5a7fa8;
      font-size: 0.8rem;
      cursor: pointer;
      padding: 4px;
      font-family: "Plus Jakarta Sans", sans-serif;
    }
    #bt-wizard-skip:hover { color: #8baed4; }
    .bt-wizard-notice {
      background: #0f1e3a;
      border-left: 3px solid #1e3a5f;
      padding: 10px 14px;
      font-size: 0.77rem;
      color: #5a7fa8;
      line-height: 1.55;
      margin-bottom: 22px;
    }
    .bt-wizard-error {
      color: #ef4444;
      font-size: 0.8rem;
      margin-top: 8px;
      display: none;
    }
  `;
  document.head.appendChild(style);
}

/**
 * Build and show the wizard overlay.
 * @param {Object} options
 * @param {boolean} options.force - Show even if config already set
 * @param {function} options.onComplete - Callback after save/skip
 */
export function showSetupWizard({ force = false, onComplete } = {}) {
  if (!force && hasMinimumConfig()) {
    if (typeof onComplete === "function") onComplete({ skipped: false });
    return;
  }

  injectStyles();

  // Remove existing instance
  const existing = document.getElementById("bt-wizard-overlay");
  if (existing) existing.remove();

  const saved = getUserApiConfig();

  // Group fields
  const groups = {};
  API_KEY_FIELDS.forEach((f) => {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  });

  let fieldsHtml = "";
  Object.keys(groups).forEach((groupName) => {
    fieldsHtml += `<div class="bt-wizard-group-label">${groupName}</div>`;
    groups[groupName].forEach((f) => {
      const val = saved[f.id] || "";
      fieldsHtml += `
        <div class="bt-wizard-field">
          <label for="btw-${f.id}">${f.label}${f.required ? '<span class="bt-req">*</span>' : ""}</label>
          <input type="text" id="btw-${f.id}" placeholder="${f.placeholder}" value="${val}" autocomplete="off" spellcheck="false" />
          <div class="bt-field-hint"><a href="${f.helpUrl}" target="_blank" rel="noopener">${f.helpText}</a></div>
        </div>
      `;
    });
  });

  const overlay = document.createElement("div");
  overlay.id = "bt-wizard-overlay";
  overlay.innerHTML = `
    <div id="bt-wizard-box" role="dialog" aria-modal="true" aria-labelledby="bt-wizard-title">
      <h2 id="bt-wizard-title">Configure Your API Keys</h2>
      <p class="bt-wizard-sub">
        BioTailr AI runs entirely with your own API accounts.<br>
        Enter your keys below. They are saved locally in your browser and never shared.
      </p>
      <div class="bt-wizard-notice">
        Your keys are stored only in this browser's localStorage. They are not transmitted to any server.
        You can update them anytime from your profile settings.
      </div>
      ${fieldsHtml}
      <div class="bt-wizard-error" id="bt-wizard-error">Please enter your Gemini API Key to continue.</div>
      <div class="bt-wizard-actions">
        <button id="bt-wizard-save">Save and Continue</button>
        <button id="bt-wizard-skip" type="button">Skip for now</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("bt-wizard-save").addEventListener("click", () => {
    const updates = {};
    let hasGemini = false;
    API_KEY_FIELDS.forEach((f) => {
      const el = document.getElementById(`btw-${f.id}`);
      if (el) {
        const v = el.value.trim();
        if (v) {
          updates[f.id] = v;
          if (f.id === "geminiKey") hasGemini = true;
        }
      }
    });

    const errEl = document.getElementById("bt-wizard-error");
    if (!hasGemini) {
      errEl.style.display = "block";
      return;
    }
    errEl.style.display = "none";

    saveUserApiConfig(updates);
    localStorage.setItem(WIZARD_SHOWN_KEY, "1");
    overlay.remove();

    if (typeof onComplete === "function") onComplete({ skipped: false, config: updates });
  });

  document.getElementById("bt-wizard-skip").addEventListener("click", () => {
    localStorage.setItem(WIZARD_SHOWN_KEY, "1");
    overlay.remove();
    if (typeof onComplete === "function") onComplete({ skipped: true });
  });
}

/**
 * Show the wizard if it has never been shown yet (first-time login).
 */
export function maybeShowSetupWizard(onComplete) {
  const alreadyShown = localStorage.getItem(WIZARD_SHOWN_KEY);
  if (alreadyShown && hasMinimumConfig()) {
    if (typeof onComplete === "function") onComplete({ skipped: false });
    return;
  }
  showSetupWizard({ force: !hasMinimumConfig(), onComplete });
}
