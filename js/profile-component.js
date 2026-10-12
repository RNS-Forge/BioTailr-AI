/**
 * BioTailr AI - Universal Profile & Support Component
 * Pure Frontend • Zero Backend • Base64 Device Photo Upload • Supabase Sync
 */

import { getActiveUser, setActiveUser, logoutUser, getAllUsers, saveUsersMap, getDemoStatus } from './auth-service.js';
import { getSupabaseClient } from './supabase-client.js';

let modalElementsInjected = false;
let currentUploadedBase64 = null;

/**
 * Mounts the Profile UI to a navbar container element
 */
export function initProfileNavbar(containerId = 'nav-auth-status-container') {
  const container = document.getElementById(containerId) || document.getElementById('user-auth-badge');
  if (!container) return;

  injectModalsOnce();

  const user = getActiveUser();

  // Control navbar Extension button visibility (STRICTLY ONLY SHOWN AFTER LOGIN)
  const extButtons = document.querySelectorAll('.btn-extension-trigger, #btn-header-extension, #btn-header-extension-ats');
  extButtons.forEach(btn => {
    btn.style.display = user ? 'inline-flex' : 'none';
  });

  if (!user) {
    // Guest view: Clean Sign In button
    container.innerHTML = `
      <a href="login.html" class="btn btn-outline" id="btn-universal-signin" style="font-size: 0.85rem; padding: 7px 14px; text-decoration: none; display: inline-flex; align-items: center; gap: 6px;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Sign In</span>
      </a>
    `;
    return;
  }

  // Active User: Sync profile data with extension and StandBy
  syncPlatformDataToExtensionAndStandBy(user);

  const demo = getDemoStatus(user);
  const displayName = user.fullName || user.email.split('@')[0];
  const initials = getInitials(displayName);
  const tierBadgeText = user.subscription?.status === 'active' 
    ? (user.subscription.planName || 'Subscriber')
    : (demo.isEarlyAdopter ? '2-Wk Free' : '4-Day Demo');

  const avatarMarkup = user.avatar
    ? `<img src="${user.avatar}" alt="${escapeHtml(displayName)}" class="nav-avatar-img" id="nav-avatar-display-img">`
    : `<span id="nav-avatar-initials">${initials}</span>`;

  container.innerHTML = `
    <div style="position: relative;">
      <button type="button" class="nav-profile-trigger" id="btn-nav-profile-toggle" aria-expanded="false" title="Account Menu">
        <div class="nav-avatar-img-wrap" id="nav-avatar-wrap">
          ${avatarMarkup}
        </div>
        <div class="nav-profile-meta">
          <span class="nav-profile-name" id="nav-profile-name-text">${escapeHtml(displayName)}</span>
          <span class="nav-profile-badge">${tierBadgeText}</span>
        </div>
        <svg class="nav-profile-caret" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
      </button>

      <!-- Dropdown Menu -->
      <div class="profile-dropdown-menu" id="profile-dropdown-menu">
        <div class="dropdown-header-card">
          <div class="dropdown-header-avatar" id="dropdown-header-avatar">
            ${user.avatar ? `<img src="${user.avatar}" alt="${escapeHtml(displayName)}">` : initials}
          </div>
          <div class="dropdown-header-info">
            <div class="dropdown-header-name" id="dropdown-user-name">${escapeHtml(displayName)}</div>
            <div class="dropdown-header-email">${escapeHtml(user.email)}</div>
            <span class="dropdown-plan-pill">${demo.formatted}</span>
          </div>
        </div>

        <ul class="dropdown-menu-list">
          <li>
            <button type="button" class="dropdown-menu-item" id="menu-item-open-profile">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
              <span>My Profile &amp; Photo</span>
            </button>
          </li>
          <li>
            <a href="pricing.html" class="dropdown-menu-item" id="menu-item-open-pricing">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
              <span>Pricing Plans &amp; Passes</span>
            </a>
          </li>
          <li>
            <button type="button" class="dropdown-menu-item" id="menu-item-open-help">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>Help &amp; 24/7 Support</span>
            </button>
          </li>
          ${user.role === 'admin' || user.email?.toLowerCase() === 'admin@rnssolutions.com' ? `
            <li>
              <a href="admin/dashboard.html" class="dropdown-menu-item" style="color: #4338ca;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                <span>Admin Console</span>
              </a>
            </li>
          ` : ''}
          <div class="dropdown-menu-divider"></div>
          <li>
            <button type="button" class="dropdown-menu-item logout-item" id="menu-item-signout">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
              <span>Sign Out</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  `;

  bindDropdownEvents();
}

/**
 * Injects Profile & Help Modals into DOM
 */
function injectModalsOnce() {
  if (modalElementsInjected) return;
  modalElementsInjected = true;

  const modalHtml = `
    <!-- Profile Modal (Frontend Only Base64 Photo Upload) -->
    <div class="profile-modal-backdrop" id="profile-modal-backdrop">
      <div class="profile-modal-card">
        <div class="profile-modal-header">
          <h3>Candidate Profile &amp; Avatar</h3>
          <button type="button" class="btn-modal-close" id="btn-close-profile-modal" title="Close Modal">&times;</button>
        </div>
        <div class="profile-modal-body">
          <!-- Device Photo Upload Area -->
          <div class="profile-photo-uploader">
            <div class="avatar-preview-box" id="modal-avatar-preview">
              <span id="modal-avatar-initials-txt">U</span>
            </div>
            <div class="avatar-upload-cta">
              <h4>Profile Picture</h4>
              <p>Upload a crisp headshot from your device. Converted to instant Base64 (zero backend).</p>
              <div class="avatar-btn-row">
                <input type="file" id="input-device-photo" accept="image/*" style="display: none;">
                <button type="button" class="btn-upload-photo" id="btn-select-photo">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>
                  <span>Upload From Device</span>
                </button>
                <button type="button" class="btn-remove-photo" id="btn-remove-photo" style="display: none;">Remove</button>
              </div>
            </div>
          </div>

          <!-- Form Fields -->
          <div class="profile-field-group">
            <label for="prof-input-name">Full Name</label>
            <input type="text" id="prof-input-name" class="profile-field-input" placeholder="e.g. Sanjay N">
          </div>

          <div class="profile-field-group">
            <label for="prof-input-email">Registered Email</label>
            <input type="email" id="prof-input-email" class="profile-field-input" readonly>
          </div>

          <div class="profile-field-group">
            <label for="prof-input-phone">Phone / WhatsApp Number</label>
            <input type="tel" id="prof-input-phone" class="profile-field-input" placeholder="e.g. +91 98765 43210">
          </div>

          <div class="profile-field-group">
            <label for="prof-input-role">Target Job Role</label>
            <input type="text" id="prof-input-role" class="profile-field-input" placeholder="e.g. Senior Full-Stack Engineer">
          </div>

          <div class="profile-field-group">
            <label for="prof-input-location">Location (City, State, Country)</label>
            <input type="text" id="prof-input-location" class="profile-field-input" placeholder="e.g. Coimbatore, Tamil Nadu, India">
          </div>

          <div class="profile-field-group">
            <label for="prof-input-linkedin">LinkedIn Profile URL</label>
            <input type="url" id="prof-input-linkedin" class="profile-field-input" placeholder="e.g. https://www.linkedin.com/in/candidate">
          </div>

          <!-- Membership & Access Badge -->
          <div class="membership-tier-card" id="modal-membership-card">
            <div class="tier-title" id="modal-tier-title">First 500 Early Adopter Plan</div>
            <div class="tier-sub" id="modal-tier-sub">2 Weeks Full Studio Access Included &bull; 24/7 Dedicated Support</div>
          </div>
        </div>

        <div class="profile-modal-footer">
          <button type="button" class="btn-profile-cancel" id="btn-cancel-profile">Cancel</button>
          <button type="button" class="btn-profile-save" id="btn-save-profile">Save Changes</button>
        </div>
      </div>
    </div>

    <!-- Help & 24/7 Support Modal -->
    <div class="profile-modal-backdrop" id="help-modal-backdrop">
      <div class="profile-modal-card help-support-card">
        <div class="profile-modal-header">
          <h3>24/7 Priority Support &amp; Help</h3>
          <button type="button" class="btn-modal-close" id="btn-close-help-modal">&times;</button>
        </div>
        <div class="profile-modal-body">
          <p style="font-size: 0.86rem; color: #64748b; margin-bottom: 16px;">
            Every Early Adopter candidate and active subscriber receives 24/7 dedicated support for ATS resume tailoring, multi-platform applications, and account activation.
          </p>

          <div class="help-channel-box">
            <div class="help-channel-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
            </div>
            <div class="help-channel-content">
              <h5>Direct Executive Support Email</h5>
              <p>Guaranteed response in under 15 minutes for 100% ATS score assistance.</p>
              <a href="mailto:2005sanjaynrs@gmail.com?subject=BioTailr%20AI%20Support%20Request">2005sanjaynrs@gmail.com &rarr;</a>
            </div>
          </div>

          <div class="help-channel-box">
            <div class="help-channel-icon green">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
            </div>
            <div class="help-channel-content">
              <h5>Instant Candidate Booking</h5>
              <p>Book an interactive 1-on-1 walkthrough of the dual AI tailoring engine.</p>
              <a href="pricing.html">Browse Sprint Passes &amp; Book Call &rarr;</a>
            </div>
          </div>

          <div style="margin-top: 18px;">
            <label style="font-size: 0.8rem; font-weight: 700; color: #1e1b78; display: block; margin-bottom: 6px;">Need Assistance? Leave a Quick Message:</label>
            <textarea id="help-quick-msg" rows="3" class="profile-field-input" placeholder="Type your inquiry or issue here..."></textarea>
            <button type="button" class="btn-profile-save" id="btn-send-help-msg" style="width: 100%; margin-top: 10px;">Send Support Ticket</button>
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', modalHtml);
  bindModalActions();
}

/**
 * Event bindings for profile dropdown menu
 */
function bindDropdownEvents() {
  const trigger = document.getElementById('btn-nav-profile-toggle');
  const dropdown = document.getElementById('profile-dropdown-menu');

  if (!trigger || !dropdown) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    const isExpanded = dropdown.classList.toggle('show');
    trigger.classList.toggle('active', isExpanded);
    trigger.setAttribute('aria-expanded', isExpanded);
  });

  document.addEventListener('click', (e) => {
    if (!trigger.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.remove('show');
      trigger.classList.remove('active');
      trigger.setAttribute('aria-expanded', 'false');
    }
  });

  // Open Profile Modal
  document.getElementById('menu-item-open-profile')?.addEventListener('click', () => {
    dropdown.classList.remove('show');
    trigger.classList.remove('active');
    openProfileModal();
  });

  // Open Help Modal
  document.getElementById('menu-item-open-help')?.addEventListener('click', () => {
    dropdown.classList.remove('show');
    trigger.classList.remove('active');
    openHelpModal();
  });

  // Sign out
  document.getElementById('menu-item-signout')?.addEventListener('click', () => {
    logoutUser();
    window.location.reload();
  });
}

/**
 * Populates and opens Profile Modal
 */
function openProfileModal() {
  const user = getActiveUser();
  if (!user) return;

  const backdrop = document.getElementById('profile-modal-backdrop');
  const nameInput = document.getElementById('prof-input-name');
  const emailInput = document.getElementById('prof-input-email');
  const phoneInput = document.getElementById('prof-input-phone');
  const roleInput = document.getElementById('prof-input-role');
  const previewBox = document.getElementById('modal-avatar-preview');
  const removeBtn = document.getElementById('btn-remove-photo');
  const tierTitle = document.getElementById('modal-tier-title');
  const tierSub = document.getElementById('modal-tier-sub');

  if (nameInput) nameInput.value = user.fullName || '';
  if (emailInput) emailInput.value = user.email || '';
  if (phoneInput) phoneInput.value = user.phone || '';
  if (roleInput) roleInput.value = user.targetRole || '';
  const locInput = document.getElementById('prof-input-location');
  if (locInput) locInput.value = user.location || user.fullLocation || (user.city ? `${user.city}, ${user.state || 'Tamil Nadu'}, ${user.country || 'India'}` : 'Coimbatore, Tamil Nadu, India');
  const lkdInput = document.getElementById('prof-input-linkedin');
  if (lkdInput) lkdInput.value = user.linkedinUrl || user.linkedin || 'https://www.linkedin.com/in/candidate';

  const demo = getDemoStatus(user);
  if (tierTitle) {
    tierTitle.textContent = user.subscription?.status === 'active'
      ? `Active Pass: ${user.subscription.planName}`
      : (demo.isEarlyAdopter ? 'First 500 Early Adopter Privilege' : '4-Day Free Demo Tier');
  }
  if (tierSub) {
    tierSub.textContent = user.subscription?.status === 'active'
      ? 'Unlimited ATS Resume Tailoring • 24/7 Dedicated Support'
      : (demo.isEarlyAdopter 
          ? `${demo.formatted} • Complimentary 24/7 Dedicated Customer Support` 
          : `${demo.formatted} • Upgrade to Sprint Pass for uninterrupted access`);
  }

  // Avatar state
  currentUploadedBase64 = user.avatar || null;
  renderModalAvatar(user.avatar, user.fullName || user.email);
  if (removeBtn) removeBtn.style.display = user.avatar ? 'inline-block' : 'none';

  backdrop?.classList.add('show');
}

function renderModalAvatar(avatarUrl, name) {
  const previewBox = document.getElementById('modal-avatar-preview');
  if (!previewBox) return;

  if (avatarUrl) {
    previewBox.innerHTML = `<img src="${avatarUrl}" alt="Avatar">`;
  } else {
    previewBox.innerHTML = `<span>${getInitials(name || 'U')}</span>`;
  }
}

/**
 * Opens 24/7 Help Modal
 */
function openHelpModal() {
  const backdrop = document.getElementById('help-modal-backdrop');
  backdrop?.classList.add('show');
}

/**
 * Bind modal buttons and Base64 photo upload from device
 */
function bindModalActions() {
  const profileBackdrop = document.getElementById('profile-modal-backdrop');
  const helpBackdrop = document.getElementById('help-modal-backdrop');

  // Close Profile Modal
  document.getElementById('btn-close-profile-modal')?.addEventListener('click', () => {
    profileBackdrop?.classList.remove('show');
  });
  document.getElementById('btn-cancel-profile')?.addEventListener('click', () => {
    profileBackdrop?.classList.remove('show');
  });

  // Close Help Modal
  document.getElementById('btn-close-help-modal')?.addEventListener('click', () => {
    helpBackdrop?.classList.remove('show');
  });

  // Backdrop click to close
  [profileBackdrop, helpBackdrop].forEach(backdrop => {
    backdrop?.addEventListener('click', (e) => {
      if (e.target === backdrop) backdrop.classList.remove('show');
    });
  });

  // Photo Upload Trigger & File Handler (Pure Frontend Base64 Conversion)
  const fileInput = document.getElementById('input-device-photo');
  const selectPhotoBtn = document.getElementById('btn-select-photo');
  const removePhotoBtn = document.getElementById('btn-remove-photo');

  selectPhotoBtn?.addEventListener('click', () => fileInput?.click());

  fileInput?.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please select an image file (PNG, JPG, WEBP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image file size must be under 5MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      currentUploadedBase64 = uploadEvent.target.result;
      renderModalAvatar(currentUploadedBase64, 'Candidate');
      if (removePhotoBtn) removePhotoBtn.style.display = 'inline-block';
    };
    reader.readAsDataURL(file);
  });

  removePhotoBtn?.addEventListener('click', () => {
    currentUploadedBase64 = null;
    const user = getActiveUser();
    renderModalAvatar(null, user?.fullName || 'U');
    if (removePhotoBtn) removePhotoBtn.style.display = 'none';
    if (fileInput) fileInput.value = '';
  });

  // Save Profile Changes
  document.getElementById('btn-save-profile')?.addEventListener('click', async () => {
    const saveBtn = document.getElementById('btn-save-profile');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';

    const user = getActiveUser();
    if (!user) return;

    const newName = document.getElementById('prof-input-name')?.value.trim();
    const newPhone = document.getElementById('prof-input-phone')?.value.trim();
    const newRole = document.getElementById('prof-input-role')?.value.trim();
    const newLocation = document.getElementById('prof-input-location')?.value.trim();
    const newLinkedin = document.getElementById('prof-input-linkedin')?.value.trim();

    user.fullName = newName || user.fullName;
    user.phone = newPhone || user.phone;
    user.targetRole = newRole || user.targetRole;
    if (newLocation) {
      user.location = newLocation;
      user.fullLocation = newLocation;
      user.address = newLocation;
      const parts = newLocation.split(',').map(s => s.trim()).filter(Boolean);
      user.city = parts[0] || user.city;
      if (parts.length > 1) user.state = parts[1];
      if (parts.length > 2) user.country = parts[2];
    }
    if (newLinkedin) {
      user.linkedinUrl = newLinkedin;
    }
    user.avatar = currentUploadedBase64; // Base64 string or null

    // 1. Update in active user session & all registered users map
    setActiveUser(user);
    const allUsers = getAllUsers();
    if (allUsers[user.email.toLowerCase()]) {
      allUsers[user.email.toLowerCase()] = {
        ...allUsers[user.email.toLowerCase()],
        fullName: user.fullName,
        phone: user.phone,
        targetRole: user.targetRole,
        location: user.location,
        city: user.city,
        state: user.state,
        country: user.country,
        linkedinUrl: user.linkedinUrl,
        avatar: user.avatar
      };
      saveUsersMap(allUsers);
    }

    // 2. Direct Frontend Supabase Sync (Zero Backend required)
    try {
      const client = getSupabaseClient();
      if (client?.auth?.updateUser) {
        await client.auth.updateUser({
          data: {
            full_name: user.fullName,
            phone: user.phone,
            target_role: user.targetRole,
            avatar_url: user.avatar
          }
        });
      }
    } catch (e) {
      console.warn('[Profile] Supabase metadata sync note:', e.message);
    }

    // 3. Auto sync to Extension (via window postMessage / storage) and StandBy runner
    syncPlatformDataToExtensionAndStandBy(user);

    saveBtn.disabled = false;
    saveBtn.textContent = 'Saved!';
    setTimeout(() => {
      saveBtn.textContent = 'Save Changes';
      profileBackdrop?.classList.remove('show');
      // Refresh UI components
      initProfileNavbar();
    }, 600);
  });

  // Send Help Message
  document.getElementById('btn-send-help-msg')?.addEventListener('click', () => {
    const msgInput = document.getElementById('help-quick-msg');
    const msg = msgInput?.value.trim();
    if (!msg) {
      alert('Please enter your question or message before sending.');
      return;
    }

    const user = getActiveUser();
    const mailto = `mailto:2005sanjaynrs@gmail.com?subject=BioTailr%20AI%20Candidate%20Ticket%20(${encodeURIComponent(user?.email || 'Guest')})&body=${encodeURIComponent(msg)}`;
    window.location.href = mailto;

    msgInput.value = '';
    helpBackdrop?.classList.remove('show');
    alert('Thank you! Your inquiry has been forwarded to our 24/7 dedicated support team (2005sanjaynrs@gmail.com). We will reach out shortly.');
  });
}

function getInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0].substring(0, 2).toUpperCase();
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, s => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[s]));
}

/**
 * Universal Data Sync Bridge
 * Bridges candidate data from BioTailr-AI main platform into:
 * 1. Extension (via window.postMessage & localStorage chrome.storage bridge)
 * 2. StandBy runner (via /api/standby/profile server bridge)
 */
export function syncPlatformDataToExtensionAndStandBy(profile, resumeHtml = '') {
  if (!profile || typeof profile !== 'object') return;

  // Retrieve any existing parsed resume or candidate context from localStorage
  let cachedCandidate = {};
  let cachedDynamic = {};
  try {
    const rawCand = localStorage.getItem('biotailr_candidate_profile');
    if (rawCand) cachedCandidate = JSON.parse(rawCand);
    const rawDyn = localStorage.getItem('biotailr_dynamic_user_profile');
    if (rawDyn) cachedDynamic = JSON.parse(rawDyn);
  } catch (e) {}

  // Construct complete, deep candidate payload
  const p = profile.personal || profile;
  const fullName = p.fullName || cachedCandidate.personal?.fullName || profile.fullName || 'Candidate';
  const nameParts = fullName.trim().split(/\s+/);
  const firstName = p.firstName || nameParts[0] || cachedCandidate.personal?.firstName || 'Candidate';
  const lastName = p.lastName || (nameParts.length > 1 ? nameParts.slice(1).join(' ') : (cachedCandidate.personal?.lastName || ''));

  const fullPayload = {
    personal: {
      fullName,
      firstName,
      lastName,
      email: p.email || profile.email || cachedCandidate.personal?.email || '',
      phone: p.phone || profile.phone || cachedCandidate.personal?.phone || '',
      city: p.city || cachedCandidate.personal?.city || (p.location ? p.location.split(',')[0].trim() : 'Coimbatore'),
      state: p.state || cachedCandidate.personal?.state || 'Tamil Nadu',
      country: p.country || cachedCandidate.personal?.country || 'India',
      postalCode: p.postalCode || cachedCandidate.personal?.postalCode || '641001',
      location: p.location || cachedCandidate.personal?.location || 'Coimbatore, Tamil Nadu, India',
      fullLocation: p.fullLocation || p.location || cachedCandidate.personal?.fullLocation || 'Coimbatore, Tamil Nadu, India',
      address: p.address || p.location || cachedCandidate.personal?.address || 'Coimbatore, Tamil Nadu, India',
      linkedinUrl: p.linkedinUrl || p.linkedin || cachedCandidate.personal?.linkedinUrl || 'https://www.linkedin.com/in/candidate',
      githubUrl: p.githubUrl || p.github || cachedCandidate.personal?.githubUrl || 'https://github.com/candidate',
      portfolioUrl: p.portfolioUrl || p.portfolio || cachedCandidate.personal?.portfolioUrl || 'https://candidate.portfolio.dev',
      avatar: profile.avatar || cachedCandidate.personal?.avatar || null
    },
    workAuth: {
      authorizedInCountry: profile.workAuth?.authorizedInCountry || cachedCandidate.workAuth?.authorizedInCountry || 'Yes',
      needSponsorship: profile.workAuth?.needSponsorship || cachedCandidate.workAuth?.needSponsorship || 'No',
      currentVisaStatus: profile.workAuth?.currentVisaStatus || cachedCandidate.workAuth?.currentVisaStatus || 'Citizen'
    },
    experience: {
      totalYears: Number(profile.totalYears || profile.experience?.totalYears || cachedCandidate.experience?.totalYears || 2),
      noticePeriodDays: Number(profile.noticePeriodDays || profile.experience?.noticePeriodDays || cachedCandidate.experience?.noticePeriodDays || 15),
      currentTitle: profile.targetRole || profile.currentTitle || profile.experience?.currentTitle || cachedCandidate.experience?.currentTitle || 'Software Development Engineer',
      currentCompany: profile.currentCompany || profile.experience?.currentCompany || cachedCandidate.experience?.currentCompany || 'Technology Company',
      currentSalary: String(profile.currentSalary || profile.experience?.currentSalary || cachedCandidate.experience?.currentSalary || '600000'),
      expectedSalary: String(profile.expectedSalary || profile.experience?.expectedSalary || cachedCandidate.experience?.expectedSalary || '1000000'),
      currentSalaryLpa: String(profile.currentSalaryLpa || profile.experience?.currentSalaryLpa || cachedCandidate.experience?.currentSalaryLpa || '6'),
      expectedSalaryLpa: String(profile.expectedSalaryLpa || profile.experience?.expectedSalaryLpa || cachedCandidate.experience?.expectedSalaryLpa || '10')
    },
    education: {
      degree: profile.education?.degree || profile.degree || cachedCandidate.education?.degree || 'Bachelor of Technology - BTech',
      fieldOfStudy: profile.education?.fieldOfStudy || profile.fieldOfStudy || cachedCandidate.education?.fieldOfStudy || 'Computer Science and Engineering',
      institution: profile.education?.institution || profile.institution || cachedCandidate.education?.institution || 'University / Institute of Technology',
      gradYear: String(profile.education?.gradYear || profile.gradYear || cachedCandidate.education?.gradYear || '2024')
    },
    skills: profile.skills || cachedCandidate.skills || cachedDynamic.skills || ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'Git', 'REST APIs'],
    settings: {
      batchTarget: 0,
      cdpPort: 9222,
      scrollDelayMs: 750,
      actionDelayMs: 2000
    }
  };

  // 1. Web app localStorage caching
  try {
    localStorage.setItem('biotailr_candidate_profile', JSON.stringify(fullPayload));
    localStorage.setItem('biotailr_dynamic_user_profile', JSON.stringify(fullPayload));
    if (resumeHtml) {
      localStorage.setItem('biotailr_dynamic_resume_html', resumeHtml);
    }
  } catch (e) {}

  // 2. PostMessage to window: content-webapp.js catches this and relays to chrome.storage.local
  try {
    window.postMessage({
      type: 'BIOTAILR_DYNAMIC_PROFILE_UPDATED',
      profile: fullPayload,
      candidateProfile: fullPayload,
      resumeHtml: resumeHtml
    }, window.location.origin);
  } catch (e) {}

  // 3. Custom DOM Event for any connected extension HUD or scripts
  try {
    window.dispatchEvent(new CustomEvent('biotailr:profile-sync', {
      detail: { profile: fullPayload, resumeHtml }
    }));
  } catch (e) {}

  // 4. StandBy Desktop Runner Bridge: updates BioTailr-AI-StandBy/candidate-profile.json
  try {
    fetch('/api/standby/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fullPayload)
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          console.log('[BioTailr Bridge] Candidate profile completely synced to StandBy:', fullPayload.personal.fullName);
        }
      })
      .catch(() => {});
  } catch (e) {}
}

