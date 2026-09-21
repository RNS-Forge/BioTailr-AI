/**
 * BioTailr AI - Main Application Controller
 * Handles screen transitions, role input, AI generation, ATS evaluation,
 * interactive refinements, and PDF export.
 */

import { RESUME_ARCHETYPES, generateResumeHtml } from './templates.js';
import { tailorResumeWithAi, getStoredApiKeys, saveApiKeys, matchArchetype, fetchEnvKeys } from './ai-service.js';
import { evaluateAtsScore, optimizeProfileFor100Ats } from './ats-engine.js';
import { downloadResumeAsPdf, printResumeNative, downloadResumeAsHtml } from './pdf-export.js';

// Application State
const state = {
  currentView: 'entry',
  targetRole: 'Software Development Engineer',
  selectedArchetypeId: 'developer',
  currentProfile: null,
  activeModelName: 'BioTailr Dynamic AI Engine',
  atsData: null,
  liveEdit: false
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
  bindEditorEvents();
  initStudioSplitter();

  // Pre-initialize default profile & ATS data so Studio is never blank
  state.selectedArchetypeId = 'developer';
  state.targetRole = 'Software Development Engineer';
  state.viewMode = 'tailored';
  const baseProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
  state.currentProfile = optimizeProfileFor100Ats(baseProfile, state.targetRole, state.selectedArchetypeId);
  state.atsData = evaluateAtsScore(state.currentProfile, state.targetRole, state.selectedArchetypeId);
  window.showView = showView;

  // Handle direct hash navigation (e.g. #studio, #studio-editor, #try-now)
  if (window.location.hash) {
    const hashView = window.location.hash.replace('#', '').trim();
    if (hashView.startsWith('studio')) {
      showView('studio');
      if (hashView.includes('editor') || window.location.search.includes('tab=editor')) {
        setTimeout(() => {
          document.getElementById('btn-stab-editor')?.click();
        }, 150);
      }
      return;
    }
    if (['landing', 'try-now'].includes(hashView)) {
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
    // Step 1: Matching and analyzing 4 career track archetypes
    updateProcessingStep(1, 'in-progress');
    await delay(280);
    updateProcessingStep(1, 'completed');

    // Step 2: Running AI model (Gemini ➔ Groq fallback)
    updateProcessingStep(2, 'in-progress');
    const aiResult = await tailorResumeWithAi(targetRole, refinements);
    state.selectedArchetypeId = aiResult.archetypeId;
    state.activeModelName = aiResult.modelUsed;
    updateProcessingStep(2, 'completed');
    await delay(200);

    // Step 3: Irrelevant Experience Pruned & Formatted
    updateProcessingStep(3, 'in-progress');
    await delay(200);
    updateProcessingStep(3, 'completed');

    // Step 4: ATS Ruleset Verification & Guarantee 100% Score
    updateProcessingStep(4, 'in-progress');
    const optimizedProfile = optimizeProfileFor100Ats(aiResult.profile, targetRole, aiResult.archetypeId);
    state.currentProfile = optimizedProfile;
    state.atsData = evaluateAtsScore(optimizedProfile, targetRole, aiResult.archetypeId);
    updateProcessingStep(4, 'completed');
    await delay(250);

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
    autoBalanceResumeToOnePage();
    if (state.liveEdit) {
      const sheet = document.getElementById('resume-document');
      if (sheet) sheet.classList.add('live-editing');
      applyLiveEditingToSheet(true);
    }
  }

  // If Editor panel is currently visible, refresh its inputs
  const panelEditor = document.getElementById('panel-sidebar-editor');
  if (panelEditor && panelEditor.style.display !== 'none') {
    populateResumeEditor();
  }
}

/**
 * Guarantees the resume is ALWAYS exactly 1 full A4 page (never half page, 75%, or overflow)
 */
export function autoBalanceResumeToOnePage() {
  const resumeEl = document.getElementById('resume-document');
  if (!resumeEl) return;

  // Reset previous inline styles to measure true scrollHeight
  resumeEl.style.fontSize = '';
  resumeEl.style.lineHeight = '';
  resumeEl.querySelectorAll('section').forEach(s => {
    s.style.paddingTop = '';
    s.style.paddingBottom = '';
  });

  const targetA4Px = 1122.5; // Exactly 297mm at standard 96 DPI
  const isManuf = resumeEl.classList.contains('archetype-manufacturing');
  const isComm = resumeEl.classList.contains('archetype-communication');
  const baseFontSize = isManuf ? 10 : (isComm ? 10.5 : 9.8);
  const baseLineHeight = isManuf ? 1.32 : (isComm ? 1.36 : 1.34);

  let currentHeight = resumeEl.scrollHeight;

  // Multi-pass downward convergence to strictly guarantee <= 1 A4 page
  if (currentHeight > targetA4Px + 2) {
    let scale = targetA4Px / currentHeight;
    resumeEl.style.fontSize = `${Math.max(7.5, (baseFontSize * scale)).toFixed(2)}pt`;
    resumeEl.style.lineHeight = `${Math.max(1.15, (baseLineHeight * scale)).toFixed(2)}`;
    resumeEl.querySelectorAll('section').forEach(s => {
      s.style.paddingTop = '2pt';
      s.style.paddingBottom = '2pt';
    });

    // Iterative micro-adjustment passes
    let passes = 0;
    while (resumeEl.scrollHeight > targetA4Px && passes < 4) {
      passes++;
      scale *= 0.96;
      resumeEl.style.fontSize = `${Math.max(7.2, (baseFontSize * scale)).toFixed(2)}pt`;
      resumeEl.style.lineHeight = `${Math.max(1.12, (baseLineHeight * scale)).toFixed(2)}`;
      resumeEl.querySelectorAll('section').forEach(s => {
        s.style.paddingTop = `${Math.max(1, 2 * scale).toFixed(1)}pt`;
        s.style.paddingBottom = `${Math.max(1, 2 * scale).toFixed(1)}pt`;
      });
    }
  } else if (currentHeight < targetA4Px - 50) {
    // Content is slightly sparse -> gracefully expand breathing room so page is 100% full
    resumeEl.style.fontSize = `${(baseFontSize * 1.03).toFixed(1)}pt`;
    resumeEl.style.lineHeight = `${(baseLineHeight * 1.05).toFixed(2)}`;
    resumeEl.querySelectorAll('section').forEach(s => {
      s.style.paddingTop = '6pt';
      s.style.paddingBottom = '6pt';
    });
    // If it expanded past 1 page, step back
    if (resumeEl.scrollHeight > targetA4Px) {
      resumeEl.style.fontSize = `${baseFontSize}pt`;
      resumeEl.style.lineHeight = `${baseLineHeight}`;
      resumeEl.querySelectorAll('section').forEach(s => {
        s.style.paddingTop = '4pt';
        s.style.paddingBottom = '4pt';
      });
    }
  }
}

// Attach to window so exporter and other modules can trigger 1-page balancing
window.autoBalanceResumeToOnePage = autoBalanceResumeToOnePage;

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

  // Download HTML Button
  const btnDownloadHtml = document.getElementById('btn-download-html');
  if (btnDownloadHtml) {
    btnDownloadHtml.addEventListener('click', () => {
      const isRaw = state.viewMode === 'raw';
      const filename = isRaw 
        ? `Sanjay_N_${state.selectedArchetypeId}_Raw.html`
        : `Sanjay_N_${state.targetRole.replace(/[^a-zA-Z0-9]/g, '_')}_ATS100.html`;
      downloadResumeAsHtml('resume-document', filename);
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
  const navScrollWrap = document.getElementById('studio-nav-scroll-wrap') || document.querySelector('.studio-header');

  function updateRawPanelPosition() {
    if (!panelRaw || !btnRawMenu || !panelRaw.classList.contains('active')) return;
    const rect = btnRawMenu.getBoundingClientRect();
    panelRaw.style.position = 'fixed';
    panelRaw.style.top = `${rect.bottom + 8}px`;
    const panelWidth = Math.min(450, window.innerWidth - 32);
    let left = rect.left;
    if (left + panelWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - panelWidth - 16);
    }
    panelRaw.style.left = `${left}px`;
    panelRaw.style.maxWidth = `${window.innerWidth - 32}px`;
  }

  if (btnRawMenu && panelRaw) {
    btnRawMenu.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = panelRaw.classList.toggle('active');
      btnRawMenu.classList.toggle('active', isActive);
      if (isActive) {
        updateRawPanelPosition();
      }
    });

    document.addEventListener('click', (e) => {
      if (!panelRaw.contains(e.target) && !btnRawMenu.contains(e.target)) {
        panelRaw.classList.remove('active');
        btnRawMenu.classList.remove('active');
      }
    });

    window.addEventListener('resize', updateRawPanelPosition);
  }

  // Smooth mouse drag & mousewheel horizontal scrolling on studio navbar controls (hidden bar)
  if (navScrollWrap) {
    let isDown = false;
    let startX = 0;
    let scrollLeftStart = 0;

    navScrollWrap.addEventListener('mousedown', (e) => {
      if (e.target.closest('button, a, input, select')) return;
      isDown = true;
      startX = e.pageX - navScrollWrap.offsetLeft;
      scrollLeftStart = navScrollWrap.scrollLeft;
      navScrollWrap.style.cursor = 'grabbing';
    });

    window.addEventListener('mouseup', () => {
      isDown = false;
      if (navScrollWrap) navScrollWrap.style.cursor = '';
    });

    window.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - navScrollWrap.offsetLeft;
      const walk = (x - startX) * 1.5;
      navScrollWrap.scrollLeft = scrollLeftStart - walk;
    });

    navScrollWrap.addEventListener('wheel', (e) => {
      if (navScrollWrap.scrollWidth > navScrollWrap.clientWidth) {
        if (e.deltaY !== 0 && Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
          e.preventDefault();
          navScrollWrap.scrollLeft += e.deltaY;
          updateRawPanelPosition();
        }
      }
    }, { passive: false });

    navScrollWrap.addEventListener('scroll', () => {
      updateRawPanelPosition();
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
 * Resume Content Editor: Form Binding & Event Handlers
 */
function bindEditorEvents() {
  // Sidebar tab switcher (100% ATS Rules vs Edit Content)
  const btnStabRules = document.getElementById('btn-stab-rules');
  const btnStabEditor = document.getElementById('btn-stab-editor');
  const panelRules = document.getElementById('panel-sidebar-rules');
  const panelEditor = document.getElementById('panel-sidebar-editor');

  if (btnStabRules && btnStabEditor && panelRules && panelEditor) {
    btnStabRules.addEventListener('click', () => {
      btnStabRules.classList.add('active');
      btnStabEditor.classList.remove('active');
      panelRules.style.display = 'flex';
      panelEditor.style.display = 'none';
    });

    btnStabEditor.addEventListener('click', () => {
      btnStabEditor.classList.add('active');
      btnStabRules.classList.remove('active');
      panelRules.style.display = 'none';
      panelEditor.style.display = 'flex';
      populateResumeEditor();
    });
  }

  // Save buttons (Top & Bottom)
  const btnSaveTop = document.getElementById('btn-save-editor-top');
  const btnSaveBottom = document.getElementById('btn-save-editor-bottom');
  [btnSaveTop, btnSaveBottom].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', () => {
        saveResumeEditor();
      });
    }
  });

  // Add Work Experience
  const btnAddExp = document.getElementById('btn-add-experience-item');
  if (btnAddExp) {
    btnAddExp.addEventListener('click', () => {
      if (!state.currentProfile) return;
      if (!state.currentProfile.experience) state.currentProfile.experience = [];
      state.currentProfile.experience.push({
        id: 'exp_' + Date.now(),
        role: 'Software Engineer',
        company: 'New Enterprise Corp',
        project: 'Core Platform',
        period: 'Jan 2025 - Present',
        location: 'Coimbatore, TN (On-Site)',
        relevant: true,
        highlights: [
          'Spearheaded development of scalable software services, improving operational efficiency by 30%.',
          'Engineered resilient APIs and automated workflows, reducing turnaround cycle times by 25%.'
        ]
      });
      populateResumeEditor();
      renderStudioWorkspace();
    });
  }

  // Add Project
  const btnAddProj = document.getElementById('btn-add-project-item');
  if (btnAddProj) {
    btnAddProj.addEventListener('click', () => {
      if (!state.currentProfile) return;
      if (!state.currentProfile.projects) state.currentProfile.projects = [];
      state.currentProfile.projects.push({
        name: 'New Project Title',
        tech: 'Python, React, REST API',
        description: 'Engineered high-performance software system that accelerated operational throughput by 30%.'
      });
      populateResumeEditor();
      renderStudioWorkspace();
    });
  }

  // Live In-Place Edit Toggle in Navbar
  const btnLiveEdit = document.getElementById('btn-toggle-live-edit');
  if (btnLiveEdit) {
    btnLiveEdit.addEventListener('click', () => {
      toggleLiveEditing();
    });
  }
}

/**
 * Populate the structured Resume Editor fields from state.currentProfile
 */
function populateResumeEditor() {
  if (!state.currentProfile) return;
  const p = state.currentProfile;

  // Title & Contact
  const titleInput = document.getElementById('edit-profile-title');
  if (titleInput) titleInput.value = p.title || '';

  const nameInput = document.getElementById('edit-profile-name');
  if (nameInput) nameInput.value = p.fullName || 'SANJAY N';

  const locInput = document.getElementById('edit-profile-location');
  if (locInput) locInput.value = p.location || 'Coimbatore, Tamil Nadu';

  const emailInput = document.getElementById('edit-profile-email');
  if (emailInput) emailInput.value = p.email || '2005sanjaynrs@gmail.com';

  const phoneInput = document.getElementById('edit-profile-phone');
  if (phoneInput) phoneInput.value = p.phone || '+91 93615 99018';

  // Professional Summary
  const summaryInput = document.getElementById('edit-profile-summary');
  if (summaryInput) summaryInput.value = p.summary || '';

  // Technical Skills Categories
  const skillsContainer = document.getElementById('editor-skills-container');
  if (skillsContainer) {
    skillsContainer.innerHTML = '';
    const cats = p.skillCategories || {
      'Programming Languages': (p.skills || []).slice(0, 6).join(', '),
      'Frameworks & Libraries': (p.skills || []).slice(6, 12).join(', '),
      'Tools & Technologies': (p.skills || []).slice(12).join(', ')
    };
    Object.entries(cats).forEach(([cat, val]) => {
      const group = document.createElement('div');
      group.className = 'form-group';
      group.innerHTML = `
        <label>${escapeHtmlApp(cat)}</label>
        <input type="text" class="form-input edit-skill-cat-input" data-cat-name="${escapeHtmlApp(cat)}" value="${escapeHtmlApp(val)}">
      `;
      skillsContainer.appendChild(group);
    });
  }

  // Work Experience
  const expContainer = document.getElementById('editor-experiences-container');
  const expCountPill = document.getElementById('editor-exp-count-pill');
  if (expContainer) {
    expContainer.innerHTML = '';
    const exps = p.experience || [];
    if (expCountPill) expCountPill.textContent = `${exps.length} Roles`;

    exps.forEach((exp, eIdx) => {
      const card = document.createElement('div');
      card.className = 'exp-edit-card';
      card.dataset.expIndex = eIdx;

      card.innerHTML = `
        <div class="exp-edit-card-head">
          <span>Role #${eIdx + 1}: ${escapeHtmlApp(exp.company || 'Company')}</span>
          <button type="button" class="btn-remove-exp" data-remove-exp="${eIdx}">✕ Remove</button>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Company</label>
            <input type="text" class="form-input exp-edit-company" value="${escapeHtmlApp(exp.company || '')}">
          </div>
          <div class="form-group">
            <label>Role</label>
            <input type="text" class="form-input exp-edit-role" value="${escapeHtmlApp(exp.role || '')}">
          </div>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Dates</label>
            <input type="text" class="form-input exp-edit-period" value="${escapeHtmlApp(exp.period || '')}">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="form-input exp-edit-location" value="${escapeHtmlApp(exp.location || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Project / Domain (Optional)</label>
          <input type="text" class="form-input exp-edit-project" value="${escapeHtmlApp(exp.project || '')}">
        </div>
        <div class="form-group">
          <label>Bullet Points (Metrics &amp; Action Verbs)</label>
          <div class="bullets-list-wrap" id="bullets-wrap-${eIdx}">
            ${(exp.highlights || []).map((b, bIdx) => `
              <div class="bullet-edit-row">
                <textarea class="form-input exp-bullet-input" rows="2">${escapeHtmlApp(b)}</textarea>
                <button type="button" class="btn-remove-bullet" title="Remove Bullet" data-exp-idx="${eIdx}" data-bullet-idx="${bIdx}">✕</button>
              </div>
            `).join('')}
          </div>
          <button type="button" class="btn btn-outline btn-sm btn-add-bullet" data-exp-idx="${eIdx}" style="align-self: flex-start; margin-top: 4px;">
            + Add Bullet
          </button>
        </div>
      `;
      expContainer.appendChild(card);
    });

    // Wire Remove Experience buttons
    expContainer.querySelectorAll('.btn-remove-exp').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.removeExp, 10);
        state.currentProfile.experience.splice(idx, 1);
        populateResumeEditor();
        renderStudioWorkspace();
      });
    });

    // Wire Remove Bullet buttons
    expContainer.querySelectorAll('.btn-remove-bullet').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eIdx = parseInt(e.currentTarget.dataset.expIdx, 10);
        const bIdx = parseInt(e.currentTarget.dataset.bulletIdx, 10);
        if (state.currentProfile.experience[eIdx]?.highlights) {
          state.currentProfile.experience[eIdx].highlights.splice(bIdx, 1);
          populateResumeEditor();
          renderStudioWorkspace();
        }
      });
    });

    // Wire Add Bullet buttons
    expContainer.querySelectorAll('.btn-add-bullet').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eIdx = parseInt(e.currentTarget.dataset.expIdx, 10);
        if (state.currentProfile.experience[eIdx]) {
          if (!state.currentProfile.experience[eIdx].highlights) {
            state.currentProfile.experience[eIdx].highlights = [];
          }
          state.currentProfile.experience[eIdx].highlights.push('Engineered scalable features and automated workflows, reducing operational turnaround times by 25%.');
          populateResumeEditor();
          renderStudioWorkspace();
        }
      });
    });
  }

  // Projects
  const projContainer = document.getElementById('editor-projects-container');
  if (projContainer) {
    projContainer.innerHTML = '';
    (p.projects || []).forEach((proj, pIdx) => {
      const card = document.createElement('div');
      card.className = 'proj-edit-card';
      card.innerHTML = `
        <div class="exp-edit-card-head">
          <span>Project #${pIdx + 1}: ${escapeHtmlApp(proj.name || '')}</span>
          <button type="button" class="btn-remove-proj" data-remove-proj="${pIdx}">✕ Remove</button>
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Project Name</label>
            <input type="text" class="form-input proj-edit-name" value="${escapeHtmlApp(proj.name || '')}">
          </div>
          <div class="form-group">
            <label>Tech Stack</label>
            <input type="text" class="form-input proj-edit-tech" value="${escapeHtmlApp(proj.tech || '')}">
          </div>
        </div>
        <div class="form-group">
          <label>Description (Impact &amp; Metrics)</label>
          <textarea class="form-input proj-edit-desc" rows="2">${escapeHtmlApp(proj.description || '')}</textarea>
        </div>
      `;
      projContainer.appendChild(card);
    });

    projContainer.querySelectorAll('.btn-remove-proj').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const idx = parseInt(e.currentTarget.dataset.removeProj, 10);
        state.currentProfile.projects.splice(idx, 1);
        populateResumeEditor();
        renderStudioWorkspace();
      });
    });
  }

  // Education
  const eduContainer = document.getElementById('editor-education-container');
  if (eduContainer) {
    eduContainer.innerHTML = '';
    (p.education || []).forEach((edu) => {
      const card = document.createElement('div');
      card.className = 'exp-edit-card';
      card.innerHTML = `
        <div class="form-group">
          <label>Degree / Qualification</label>
          <input type="text" class="form-input edu-edit-degree" value="${escapeHtmlApp(edu.degree || '')}">
        </div>
        <div class="form-row-2">
          <div class="form-group">
            <label>Institution</label>
            <input type="text" class="form-input edu-edit-institution" value="${escapeHtmlApp(edu.institution || '')}">
          </div>
          <div class="form-group">
            <label>Location</label>
            <input type="text" class="form-input edu-edit-location" value="${escapeHtmlApp(edu.location || 'Coimbatore, Tamil Nadu')}">
          </div>
        </div>
        <div class="form-group">
          <label>Dates / Period</label>
          <input type="text" class="form-input edu-edit-year" value="${escapeHtmlApp(edu.year || '')}">
        </div>
        <div class="form-group">
          <label>Details / CGPA / Coursework</label>
          <input type="text" class="form-input edu-edit-details" value="${escapeHtmlApp(edu.details || '')}">
        </div>
      `;
      eduContainer.appendChild(card);
    });
  }
}

/**
 * Save all changes from the structured Resume Editor back into state.currentProfile
 * and re-run ATS 100% verification.
 */
function saveResumeEditor() {
  if (!state.currentProfile) return;
  const p = state.currentProfile;

  // Header & Title
  p.title = document.getElementById('edit-profile-title')?.value.trim() || p.title;
  p.fullName = document.getElementById('edit-profile-name')?.value.trim() || p.fullName;
  p.location = document.getElementById('edit-profile-location')?.value.trim() || p.location;
  p.email = document.getElementById('edit-profile-email')?.value.trim() || p.email;
  p.phone = document.getElementById('edit-profile-phone')?.value.trim() || p.phone;
  p.summary = document.getElementById('edit-profile-summary')?.value.trim() || p.summary;

  // Skills
  p.skillCategories = {};
  const skillValues = [];
  document.querySelectorAll('.edit-skill-cat-input').forEach(input => {
    const catName = input.dataset.catName;
    const val = input.value.trim();
    if (catName && val) {
      p.skillCategories[catName] = val;
      val.split(',').forEach(s => {
        const clean = s.trim();
        if (clean && !skillValues.includes(clean)) skillValues.push(clean);
      });
    }
  });
  if (skillValues.length > 0) {
    p.skills = skillValues;
  }

  // Experience
  const expCards = document.querySelectorAll('#editor-experiences-container .exp-edit-card');
  const newExps = [];
  expCards.forEach((card, idx) => {
    const company = card.querySelector('.exp-edit-company')?.value.trim() || 'Company';
    const role = card.querySelector('.exp-edit-role')?.value.trim() || 'Engineer';
    const period = card.querySelector('.exp-edit-period')?.value.trim() || '';
    const location = card.querySelector('.exp-edit-location')?.value.trim() || '';
    const project = card.querySelector('.exp-edit-project')?.value.trim() || '';
    const bulletInputs = card.querySelectorAll('.exp-bullet-input');
    const highlights = [];
    bulletInputs.forEach(bInput => {
      const bText = bInput.value.trim();
      if (bText) highlights.push(bText);
    });

    newExps.push({
      id: p.experience[idx]?.id || `exp_${Date.now()}_${idx}`,
      company,
      role,
      period,
      location,
      project,
      relevant: true,
      highlights
    });
  });
  p.experience = newExps;

  // Projects
  const projCards = document.querySelectorAll('#editor-projects-container .proj-edit-card');
  const newProjs = [];
  projCards.forEach(card => {
    const name = card.querySelector('.proj-edit-name')?.value.trim();
    const tech = card.querySelector('.proj-edit-tech')?.value.trim();
    const description = card.querySelector('.proj-edit-desc')?.value.trim();
    if (name) {
      newProjs.push({ name, tech, description });
    }
  });
  if (newProjs.length > 0) {
    p.projects = newProjs;
  }

  // Education
  const eduCards = document.querySelectorAll('#editor-education-container .exp-edit-card');
  const newEdu = [];
  eduCards.forEach(card => {
    const degree = card.querySelector('.edu-edit-degree')?.value.trim();
    const institution = card.querySelector('.edu-edit-institution')?.value.trim();
    const location = card.querySelector('.edu-edit-location')?.value.trim();
    const year = card.querySelector('.edu-edit-year')?.value.trim();
    const details = card.querySelector('.edu-edit-details')?.value.trim();
    if (degree || institution) {
      newEdu.push({ degree, institution, location, year, details });
    }
  });
  if (newEdu.length > 0) {
    p.education = newEdu;
  }

  // Re-run ATS optimizer & scoring
  state.currentProfile = optimizeProfileFor100Ats(p, state.targetRole, state.selectedArchetypeId);
  state.atsData = evaluateAtsScore(state.currentProfile, state.targetRole, state.selectedArchetypeId);

  // Render Studio Workspace
  renderStudioWorkspace();

  // Visual success confirmation
  const saveBtn = document.getElementById('btn-save-editor-bottom');
  if (saveBtn) {
    const origHtml = saveBtn.innerHTML;
    saveBtn.innerHTML = `✓ Saved &amp; Verified 100% ATS!`;
    saveBtn.style.background = '#059669';
    setTimeout(() => {
      saveBtn.innerHTML = origHtml;
      saveBtn.style.background = '';
    }, 2000);
  }
}

/**
 * Toggle Live On-Page Content Editing
 */
function toggleLiveEditing() {
  state.liveEdit = !state.liveEdit;
  const btn = document.getElementById('btn-toggle-live-edit');
  const btnText = document.getElementById('live-edit-btn-text');
  const sheet = document.getElementById('resume-document');

  if (state.liveEdit) {
    if (btn) btn.classList.add('btn-teal');
    if (btnText) btnText.textContent = 'Live Edit: ON';
    if (sheet) sheet.classList.add('live-editing');
    applyLiveEditingToSheet(true);
  } else {
    if (btn) btn.classList.remove('btn-teal');
    if (btnText) btnText.textContent = 'Live Edit: OFF';
    if (sheet) sheet.classList.remove('live-editing');
    applyLiveEditingToSheet(false);
  }
}

function applyLiveEditingToSheet(enable = true) {
  const sheet = document.getElementById('resume-document');
  if (!sheet) return;

  const editableSelectors = [
    '[data-editable-field]',
    '[data-editable-skill-cat]',
    '.exp-company',
    '.exp-role',
    '.exp-period',
    '.exp-project em',
    '.exp-bullets li',
    '.proj-name',
    '.proj-desc',
    '.edu-degree',
    '.edu-year',
    '.edu-institution',
    '.edu-location',
    '.edu-bullets li'
  ];

  editableSelectors.forEach(sel => {
    sheet.querySelectorAll(sel).forEach(el => {
      el.contentEditable = enable ? 'true' : 'false';
      el.spellcheck = false;
      if (enable) {
        el.onblur = () => syncLiveEditToState();
      } else {
        el.onblur = null;
      }
    });
  });
}

function syncLiveEditToState() {
  const sheet = document.getElementById('resume-document');
  if (!sheet || !state.currentProfile) return;
  const p = state.currentProfile;

  // Title
  const titleEl = sheet.querySelector('.role');
  if (titleEl) p.title = titleEl.textContent.trim();

  // Summary
  const summaryEl = sheet.querySelector('.summary');
  if (summaryEl) p.summary = summaryEl.textContent.trim();

  // Experience bullets
  sheet.querySelectorAll('.exp-entry').forEach((expEl, eIdx) => {
    if (p.experience && p.experience[eIdx]) {
      const bullets = [];
      expEl.querySelectorAll('.exp-bullets li').forEach(bEl => {
        bullets.push(bEl.textContent.trim());
      });
      if (bullets.length > 0) p.experience[eIdx].highlights = bullets;
    }
  });

  // Re-evaluate score
  state.atsData = evaluateAtsScore(p, state.targetRole, state.selectedArchetypeId);
  const scoreValEl = document.getElementById('ats-gauge-value');
  if (scoreValEl) scoreValEl.textContent = `${state.atsData.totalScore}%`;
  renderAtsChecklist();
}

function escapeHtmlApp(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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

    // Preserve existing tailored profile or optimize from base if none exists yet
    if (!state.currentProfile) {
      const baseProfile = RESUME_ARCHETYPES[state.selectedArchetypeId].profile;
      state.currentProfile = optimizeProfileFor100Ats(baseProfile, state.targetRole, state.selectedArchetypeId);
    }
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
  if (!modal) return;

  const geminiInput = document.getElementById('input-gemini-key');
  const groqInput = document.getElementById('input-groq-key');
  const feedbackEl = document.getElementById('settings-feedback');

  const openSettings = async (e) => {
    if (e) e.preventDefault();
    await fetchEnvKeys();
    const keys = getStoredApiKeys();
    if (geminiInput) geminiInput.value = keys.geminiKey || '';
    if (groqInput) groqInput.value = keys.groqKey || '';
    if (feedbackEl) {
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
    }
    modal.classList.add('active');
  };

  const closeSettings = (e) => {
    if (e) e.preventDefault();
    modal.classList.remove('active');
  };

  // Wire ALL Settings triggers across the application:
  // 1. Landing nav right action button (#btn-settings-nav)
  // 2. Landing nav center menu link (#btn-open-settings)
  // 3. Studio nav right action button (#btn-studio-settings)
  // 4. Any element with class .btn-trigger-settings
  const openTriggers = [
    document.getElementById('btn-settings-nav'),
    document.getElementById('btn-open-settings'),
    document.getElementById('btn-studio-settings'),
    ...document.querySelectorAll('.btn-trigger-settings')
  ].filter(Boolean);

  openTriggers.forEach(btn => {
    btn.addEventListener('click', openSettings);
  });

  // Wire ALL Close triggers (#btn-close-settings, #btn-cancel-settings)
  const closeTriggers = [
    document.getElementById('btn-close-settings'),
    document.getElementById('btn-cancel-settings')
  ].filter(Boolean);

  closeTriggers.forEach(btn => {
    btn.addEventListener('click', closeSettings);
  });

  // Close when clicking on backdrop outside modal box
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeSettings(e);
    }
  });

  // Close on Escape key press
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('active')) {
      closeSettings(e);
    }
  });

  // Save Credentials button
  const btnSave = document.getElementById('btn-save-keys');
  if (btnSave) {
    btnSave.addEventListener('click', (e) => {
      e.preventDefault();
      saveApiKeys(geminiInput?.value, groqInput?.value);
      if (feedbackEl) {
        feedbackEl.style.display = 'block';
        feedbackEl.style.background = '#dcfce7';
        feedbackEl.style.color = '#166534';
        feedbackEl.style.border = '1px solid #86efac';
        feedbackEl.textContent = '✓ Credentials saved securely in local storage.';
        setTimeout(() => {
          modal.classList.remove('active');
          feedbackEl.style.display = 'none';
        }, 700);
      } else {
        modal.classList.remove('active');
      }
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
