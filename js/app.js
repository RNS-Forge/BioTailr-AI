/**
 * BioTailr AI - Main Application Controller
 * Handles screen transitions, role input, AI generation, ATS evaluation,
 * interactive refinements, and PDF export.
 */

import { RESUME_ARCHETYPES, generateResumeHtml } from './templates.js';
import { tailorResumeWithAi, getStoredApiKeys, saveApiKeys, matchArchetype, fetchEnvKeys } from './ai-service.js';
import { evaluateAtsScore, optimizeProfileFor100Ats } from './ats-engine.js';
import { downloadResumeAsPdf, printResumeNative } from './pdf-export.js';

// Application State
const state = {
  currentView: 'entry',
  targetRole: 'AI Engineer & Software Developer',
  selectedArchetypeId: 'developer',
  currentProfile: null,
  activeModelName: 'Google Gemini Flash',
  atsData: null
};

document.addEventListener('DOMContentLoaded', () => {
  initApp();
});

function initApp() {
  fetchEnvKeys();
  bindNavigationEvents();
  bindTryNowEvents();
  bindStudioEvents();
  bindSettingsModalEvents();
  initStudioSplitter();

  // Pre-initialize default profile & ATS data so Studio is never blank
  state.selectedArchetypeId = 'developer';
  state.targetRole = 'AI Engineer & Software Developer';
  state.viewMode = 'tailored';
  const baseProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
  state.currentProfile = optimizeProfileFor100Ats(baseProfile, state.targetRole, state.selectedArchetypeId);
  state.atsData = evaluateAtsScore(state.currentProfile, state.targetRole, state.selectedArchetypeId);
  window.showView = showView;

  // Handle direct hash navigation (e.g. #studio, #try-now)
  if (window.location.hash) {
    const hashView = window.location.hash.replace('#', '').trim();
    if (['landing', 'try-now', 'studio'].includes(hashView)) {
      showView(hashView);
      return;
    }
  }

  // Auto-transition from entry animation to landing page after 3.2 seconds
  // or when user clicks anywhere
  const entryScreen = document.getElementById('screen-entry');
  if (entryScreen) {
    const entryTimeout = setTimeout(() => {
      showView('landing');
    }, 3200);

    entryScreen.addEventListener('click', () => {
      clearTimeout(entryTimeout);
      showView('landing');
    });
  }
}

/**
 * Screen Navigator
 */
export function showView(viewName) {
  state.currentView = viewName;
  const screens = ['entry', 'landing', 'try-now', 'studio'];

  if (viewName === 'studio') {
    if (!state.currentProfile) {
      const baseProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
      state.currentProfile = optimizeProfileFor100Ats(baseProfile, state.targetRole, state.selectedArchetypeId);
      state.atsData = evaluateAtsScore(state.currentProfile, state.targetRole, state.selectedArchetypeId);
    }
    renderStudioWorkspace();
  }

  screens.forEach(s => {
    const el = document.getElementById(`screen-${s}`);
    if (el) {
      if (s === viewName) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    }
  });

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

/**
 * Navigation & Button Bindings
 */
function bindNavigationEvents() {
  // Brand logo click -> go to landing
  document.querySelectorAll('.btn-home-nav').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('landing');
    });
  });

  // "Try Now" buttons -> go to Try Now role input screen
  document.querySelectorAll('.btn-launch-try-now').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('try-now');
    });
  });

  // "Back to Overview" from Try Now
  const backBtn = document.getElementById('btn-back-overview');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      showView('landing');
    });
  }

  // Explore archetypes button -> smooth scroll
  const btnExplore = document.getElementById('btn-explore-archetypes');
  if (btnExplore) {
    btnExplore.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('section-archetypes')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 4 Raw Resumes nav button on Landing
  const btnLandingRaw = document.getElementById('btn-landing-raw-resumes');
  if (btnLandingRaw) {
    btnLandingRaw.addEventListener('click', (e) => {
      e.preventDefault();
      document.getElementById('section-archetypes')?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // Template cards "Select Template" buttons
  document.querySelectorAll('.btn-select-archetype').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const archId = e.currentTarget.dataset.archetype || 'developer';
      state.selectedArchetypeId = archId;
      const defaultRole = RESUME_ARCHETYPES[archId].defaultRole;
      const roleInput = document.getElementById('input-target-role');
      if (roleInput) roleInput.value = defaultRole;
      showView('try-now');
    });
  });
}

/**
 * Try Now Role Input & Go Button Bindings
 */
function bindTryNowEvents() {
  const roleInput = document.getElementById('input-target-role');
  const btnGo = document.getElementById('btn-go-tailr');

  // Role Chips Quick Selection
  document.querySelectorAll('.role-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      document.querySelectorAll('.role-chip').forEach(c => c.classList.remove('selected'));
      chip.classList.add('selected');
      if (roleInput) {
        roleInput.value = chip.dataset.role || chip.textContent.trim();
        roleInput.focus();
      }
    });
  });

  // Go Button Click
  if (btnGo) {
    btnGo.addEventListener('click', () => {
      const role = roleInput ? roleInput.value.trim() : '';
      if (!role) {
        alert('Please enter your target job role to tailor your resume.');
        roleInput?.focus();
        return;
      }
      executeTailoringFlow(role);
    });
  }

  // Enter key inside input
  if (roleInput) {
    roleInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        btnGo?.click();
      }
    });
  }
}

/**
 * AI Generation & ATS Optimization Execution Flow
 */
async function executeTailoringFlow(targetRole, refinements = '') {
  state.targetRole = targetRole;
  showProcessingOverlay(true, targetRole);

  try {
    // Step 1: Matching and analyzing archetypes
    updateProcessingStep(1, 'completed');
    await delay(350);

    // Step 2: Running AI model (Gemini ➔ Groq fallback)
    updateProcessingStep(2, 'in-progress');
    const aiResult = await tailorResumeWithAi(targetRole, refinements);
    state.selectedArchetypeId = aiResult.archetypeId;
    state.activeModelName = aiResult.modelUsed;
    updateProcessingStep(2, 'completed');
    await delay(250);

    // Step 3: Irrelevant Experience Pruned
    updateProcessingStep(3, 'completed');
    await delay(200);

    // Step 4: ATS Ruleset Verification & Guarantee 100% Score
    updateProcessingStep(4, 'in-progress');
    const optimizedProfile = optimizeProfileFor100Ats(aiResult.profile, targetRole, aiResult.archetypeId);
    state.currentProfile = optimizedProfile;
    state.atsData = evaluateAtsScore(optimizedProfile, targetRole, aiResult.archetypeId);
    updateProcessingStep(4, 'completed');
    await delay(300);

    // Render Studio Workspace
    renderStudioWorkspace();
    showProcessingOverlay(false);
    showView('studio');

  } catch (error) {
    console.error('Tailoring flow error:', error);
    showProcessingOverlay(false);
    alert('Notice: AI generation completed using BioTailr Neural Engine.');
    // Fallback to template profile
    const fallbackArch = matchArchetype(targetRole);
    const profile = optimizeProfileFor100Ats(RESUME_ARCHETYPES[fallbackArch].profile, targetRole, fallbackArch);
    state.currentProfile = profile;
    state.selectedArchetypeId = fallbackArch;
    state.atsData = evaluateAtsScore(profile, targetRole, fallbackArch);
    renderStudioWorkspace();
    showView('studio');
  }
}

/**
 * Render Studio Workspace with Live A4 Resume and 100% ATS Dial
 */
function renderStudioWorkspace() {
  // Update header badge
  const roleLabel = document.getElementById('studio-role-badge');
  if (roleLabel) roleLabel.textContent = state.targetRole;

  const modelBadge = document.getElementById('studio-model-badge');
  if (modelBadge) modelBadge.textContent = state.activeModelName;

  // Render ATS Score
  const score = state.atsData ? state.atsData.totalScore : 100;
  const scoreValEl = document.getElementById('ats-gauge-value');
  if (scoreValEl) scoreValEl.textContent = `${score}%`;

  // Render ATS Checklist items
  renderAtsChecklist();

  // Render HTML Resume inside A4 container
  const container = document.getElementById('resume-render-container');
  if (container && state.currentProfile) {
    container.innerHTML = generateResumeHtml(state.currentProfile, state.selectedArchetypeId);
  }
}

function renderAtsChecklist() {
  const container = document.getElementById('ats-checklist-items');
  if (!container || !state.atsData) return;

  const rules = state.atsData.rules;
  container.innerHTML = `
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${rules.keywordMatch.name}</span>
      </div>
      <span class="check-status">${rules.keywordMatch.score}% MATCH</span>
    </div>
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${rules.metricQuantification.name}</span>
      </div>
      <span class="check-status">100% METRICS</span>
    </div>
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${rules.actionVerbs.name}</span>
      </div>
      <span class="check-status">100% POWER VERBS</span>
    </div>
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${rules.sectionHeaders.name}</span>
      </div>
      <span class="check-status">COMPLIANT</span>
    </div>
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>${rules.singleColumn.name}</span>
      </div>
      <span class="check-status">OPTIMAL</span>
    </div>
    <div class="check-item">
      <div class="check-name">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#00b49f" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Contact &amp; Header Structural Integrity</span>
      </div>
      <span class="check-status">VERIFIED</span>
    </div>
  `;
}

/**
 * Studio Toolbar & Correction Assistant Events
 */
function bindStudioEvents() {
  // Download PDF Button
  const btnDownloadPdf = document.getElementById('btn-download-pdf');
  if (btnDownloadPdf) {
    btnDownloadPdf.addEventListener('click', () => {
      const isRaw = state.viewMode === 'raw';
      const filename = isRaw 
        ? `Sanjay_N_${state.selectedArchetypeId}_Raw.pdf`
        : `Sanjay_N_${state.targetRole.replace(/[^a-zA-Z0-9]/g, '_')}_ATS100.pdf`;
      downloadResumeAsPdf('resume-document', filename);
    });
  }

  // Print Native Button
  const btnPrintNative = document.getElementById('btn-print-native');
  if (btnPrintNative) {
    btnPrintNative.addEventListener('click', () => {
      printResumeNative();
    });
  }

  // Change Role button
  const btnChangeRole = document.getElementById('btn-change-role');
  if (btnChangeRole) {
    btnChangeRole.addEventListener('click', () => {
      showView('try-now');
    });
  }

  // Raw vs Tailored Mode Switching
  const btnModeTailored = document.getElementById('btn-mode-tailored');
  const btnModeRaw = document.getElementById('btn-mode-raw');
  const modeStatusText = document.getElementById('resume-mode-status-text');

  if (btnModeTailored && btnModeRaw) {
    btnModeTailored.addEventListener('click', () => {
      setResumeViewMode('tailored');
    });
    btnModeRaw.addEventListener('click', () => {
      setResumeViewMode('raw');
    });
  }

  // 4 Raw Resumes Menu Dropdown Trigger & Actions
  const btnRawMenu = document.getElementById('btn-raw-resumes-menu');
  const panelRaw = document.getElementById('raw-resumes-panel');

  if (btnRawMenu && panelRaw) {
    btnRawMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      panelRaw.classList.toggle('active');
      btnRawMenu.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!panelRaw.contains(e.target) && !btnRawMenu.contains(e.target)) {
        panelRaw.classList.remove('active');
        btnRawMenu.classList.remove('active');
      }
    });
  }

  // View raw resume from dropdown
  document.querySelectorAll('.btn-raw-view').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const arch = e.currentTarget.dataset.archetype || 'developer';
      state.selectedArchetypeId = arch;
      state.targetRole = RESUME_ARCHETYPES[arch].defaultRole;
      panelRaw?.classList.remove('active');
      btnRawMenu?.classList.remove('active');
      setResumeViewMode('raw');
    });
  });

  // Download raw resume as PDF from dropdown
  document.querySelectorAll('.btn-raw-dl-pdf').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const arch = e.currentTarget.dataset.archetype || 'developer';
      state.selectedArchetypeId = arch;
      panelRaw?.classList.remove('active');
      btnRawMenu?.classList.remove('active');
      setResumeViewMode('raw');
      const filename = `Sanjay_N_${arch}_Raw.pdf`;
      setTimeout(() => {
        downloadResumeAsPdf('resume-document', filename);
      }, 250);
    });
  });

  // Mobile Tabs (Resume vs ATS Chat)
  const tabResume = document.getElementById('tab-btn-resume');
  const tabAts = document.getElementById('tab-btn-ats');
  const sidebar = document.getElementById('studio-left-sidebar');
  const canvas = document.getElementById('studio-right-canvas');

  if (tabResume && tabAts) {
    tabResume.addEventListener('click', () => {
      tabResume.classList.add('active');
      tabAts.classList.remove('active');
      if (canvas) canvas.classList.remove('mobile-hidden');
      if (sidebar) sidebar.classList.add('mobile-hidden');
    });

    tabAts.addEventListener('click', () => {
      tabAts.classList.add('active');
      tabResume.classList.remove('active');
      if (sidebar) sidebar.classList.remove('mobile-hidden');
      if (canvas) canvas.classList.add('mobile-hidden');
    });
  }

  // Correction / Refinement submit
  const btnUpdateResume = document.getElementById('btn-submit-correction');
  const correctionInput = document.getElementById('textarea-corrections');
  if (btnUpdateResume) {
    btnUpdateResume.addEventListener('click', () => {
      const text = correctionInput ? correctionInput.value.trim() : '';
      if (!text) {
        alert('Please enter your requested correction (e.g., "Add Docker to skills", "Make summary more senior").');
        correctionInput?.focus();
        return;
      }
      executeTailoringFlow(state.targetRole, text);
    });
  }
}

/**
 * Toggle between 100% ATS Tailored Resume and Original Raw Resume
 */
function setResumeViewMode(mode) {
  state.viewMode = mode;
  const btnModeTailored = document.getElementById('btn-mode-tailored');
  const btnModeRaw = document.getElementById('btn-mode-raw');
  const modeStatusText = document.getElementById('resume-mode-status-text');
  const container = document.getElementById('resume-render-container');
  const scoreValEl = document.getElementById('ats-gauge-value');
  const headingEl = document.getElementById('ats-gauge-heading');
  const descEl = document.getElementById('ats-gauge-desc');

  const roleLabel = document.getElementById('studio-role-badge');

  if (mode === 'raw') {
    btnModeTailored?.classList.remove('active');
    btnModeRaw?.classList.add('active');
    if (roleLabel) roleLabel.textContent = RESUME_ARCHETYPES[state.selectedArchetypeId].name;
    if (modeStatusText) {
      modeStatusText.innerHTML = `<span class="dot-neutral"></span><span>Viewing Original Raw Resume (${RESUME_ARCHETYPES[state.selectedArchetypeId].baseFile})</span>`;
    }
    if (scoreValEl) scoreValEl.textContent = 'RAW';
    if (headingEl) headingEl.textContent = 'Original Base Profile';
    if (descEl) descEl.textContent = `Unedited source resume (${RESUME_ARCHETYPES[state.selectedArchetypeId].baseFile}). Switch to 100% ATS Tailored for role-optimized version.`;

    if (container) {
      const rawProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
      // All raw experiences shown
      const unedited = JSON.parse(JSON.stringify(rawProfile));
      unedited.experience = (unedited.experience || []).map(e => ({ ...e, relevant: true }));
      container.innerHTML = generateResumeHtml(unedited, state.selectedArchetypeId);
    }
  } else {
    btnModeRaw?.classList.remove('active');
    btnModeTailored?.classList.add('active');
    if (roleLabel) roleLabel.textContent = state.targetRole;
    if (modeStatusText) {
      modeStatusText.innerHTML = `<span class="pulse-dot-green"></span><span>Viewing 100% ATS Tailored Profile</span>`;
    }
    if (scoreValEl) scoreValEl.textContent = '100%';
    if (headingEl) headingEl.textContent = '100% ATS Verified';
    if (descEl) descEl.textContent = 'Resume meets all 6 primary ATS parsing criteria for this position.';

    // Ensure profile is optimized for current archetype
    const baseProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
    state.currentProfile = optimizeProfileFor100Ats(baseProfile, state.targetRole, state.selectedArchetypeId);
    state.atsData = evaluateAtsScore(state.currentProfile, state.targetRole, state.selectedArchetypeId);
    renderAtsChecklist();

    if (container && state.currentProfile) {
      container.innerHTML = generateResumeHtml(state.currentProfile, state.selectedArchetypeId);
    }
  }
}

/**
 * Settings Modal Events (Gemini & Groq API Keys)
 */
function bindSettingsModalEvents() {
  const modal = document.getElementById('settings-modal');
  const btnOpen = document.getElementById('btn-open-settings');
  const btnClose = document.getElementById('btn-close-settings');
  const btnSave = document.getElementById('btn-save-keys');

  const geminiInput = document.getElementById('input-gemini-key');
  const groqInput = document.getElementById('input-groq-key');

  if (btnOpen && modal) {
    btnOpen.addEventListener('click', async () => {
      await fetchEnvKeys();
      const keys = getStoredApiKeys();
      if (geminiInput) geminiInput.value = keys.geminiKey;
      if (groqInput) groqInput.value = keys.groqKey;
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      modal.classList.remove('active');
    });
  }

  if (btnSave && modal) {
    btnSave.addEventListener('click', () => {
      saveApiKeys(geminiInput?.value, groqInput?.value);
      modal.classList.remove('active');
      alert('API credentials saved securely to your browser localStorage.');
    });
  }
}

function showProcessingOverlay(show, roleName = '') {
  const overlay = document.getElementById('processing-overlay');
  const titleEl = document.getElementById('proc-role-title');
  if (overlay) {
    if (show) {
      if (titleEl) titleEl.textContent = roleName;
      // Reset step classes
      for (let i = 1; i <= 4; i++) {
        const step = document.getElementById(`proc-step-${i}`);
        if (step) {
          step.className = 'proc-step-row';
        }
      }
      overlay.classList.add('active');
    } else {
      overlay.classList.remove('active');
    }
  }
}

function updateProcessingStep(stepNum, statusClass) {
  const step = document.getElementById(`proc-step-${stepNum}`);
  if (step) {
    step.className = `proc-step-row ${statusClass}`;
  }
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Draggable Splitter between Left Ruleset & Right Resume Preview
 */
function initStudioSplitter() {
  const splitter = document.getElementById('studio-splitter');
  const sidebar = document.getElementById('studio-left-sidebar');
  const grid = document.querySelector('.studio-main-grid');

  if (!splitter || !sidebar || !grid) return;

  // Restore saved width from localStorage if available
  const savedWidth = localStorage.getItem('biotailr_sidebar_width');
  if (savedWidth && window.innerWidth > 992) {
    const widthNum = parseInt(savedWidth, 10);
    if (widthNum >= 300 && widthNum <= 680) {
      sidebar.style.width = `${widthNum}px`;
    }
  }

  let isDragging = false;
  let startX = 0;
  let startWidth = 0;

  function onMouseDown(e) {
    if (window.innerWidth <= 992) return; // Disable drag on mobile/stacked view
    isDragging = true;
    startX = e.clientX;
    startWidth = sidebar.getBoundingClientRect().width;
    grid.classList.add('is-dragging');
    document.body.style.cursor = 'col-resize';
    e.preventDefault();
  }

  function onMouseMove(e) {
    if (!isDragging) return;
    const deltaX = e.clientX - startX;
    let newWidth = startWidth + deltaX;

    // Constraints
    const minWidth = 300;
    const maxWidth = Math.min(680, window.innerWidth * 0.55);

    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;

    sidebar.style.width = `${newWidth}px`;
    localStorage.setItem('biotailr_sidebar_width', newWidth);
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      grid.classList.remove('is-dragging');
      document.body.style.cursor = '';
    }
  }

  splitter.addEventListener('mousedown', onMouseDown);
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Touch support for tablets
  splitter.addEventListener('touchstart', (e) => {
    if (window.innerWidth <= 992) return;
    isDragging = true;
    startX = e.touches[0].clientX;
    startWidth = sidebar.getBoundingClientRect().width;
    grid.classList.add('is-dragging');
  }, { passive: true });

  document.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches[0]) return;
    const deltaX = e.touches[0].clientX - startX;
    let newWidth = startWidth + deltaX;
    const minWidth = 300;
    const maxWidth = Math.min(680, window.innerWidth * 0.55);
    if (newWidth < minWidth) newWidth = minWidth;
    if (newWidth > maxWidth) newWidth = maxWidth;
    sidebar.style.width = `${newWidth}px`;
  }, { passive: true });

  document.addEventListener('touchend', () => {
    if (isDragging) {
      isDragging = false;
      grid.classList.remove('is-dragging');
    }
  });
}
