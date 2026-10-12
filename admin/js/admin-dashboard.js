import { requireAdminAuth, logoutAdmin } from './admin-auth.js';

let allRecords = [];
let activeTab = 'all';
let globalSearchQuery = '';
let colFilters = {
  name: '',
  date: '',
  phone: '',
  tier: '',
  amount: '',
  validity: '',
  status: ''
};

let currentPage = 1;
let pageSize = 10;

document.addEventListener('DOMContentLoaded', async () => {
  // Security Gate: Ensure authenticated admin
  const adminSession = requireAdminAuth();
  if (!adminSession) return;

  const userDisplay = document.getElementById('admin-user-display');
  if (userDisplay) userDisplay.textContent = adminSession.email;

  document.getElementById('btn-admin-logout')?.addEventListener('click', logoutAdmin);

  // Boss Updater Manual Dispatch
  document.getElementById('btn-trigger-boss-updater')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-trigger-boss-updater');
    btn.disabled = true;
    btn.innerHTML = '<span>Dispatching Briefing...</span>';
    try {
      const res = await fetch('/api/admin/trigger-boss-updater');
      const data = await res.json();
      if (data.success) {
        showToast('Daily briefing sent to 2005sanjaynrs@gmail.com');
      } else {
        showToast(`Dispatch note: ${data.error || 'Server error'}`);
      }
    } catch (e) {
      showToast('Error dispatching briefing.');
    } finally {
      btn.disabled = false;
      btn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg> <span>Send Boss Briefing</span>`;
    }
  });

  // Setup UI controls
  setupTabs();
  setupColumnSearchToggle();
  setupFilterInputs();
  setupPaginationControls();
  setupToolbarButtons();

  // Load records
  await loadAllData();
});

/**
 * Load and merge subscriptions and registered users
 */
async function loadAllData() {
  let subscriptions = [];
  try {
    const res = await fetch('/api/subscriptions');
    if (res.ok) {
      subscriptions = await res.json();
    }
  } catch (e) {
    console.warn('[Admin] Server fetch note:', e);
  }

  if (!subscriptions || subscriptions.length === 0) {
    try {
      const stored = localStorage.getItem('biotailr_subscription_requests');
      if (stored) subscriptions = JSON.parse(stored);
    } catch (e) {}
  }

  // Also gather registered demo & early adopter users
  let registeredUsers = {};
  try {
    const storedUsers = localStorage.getItem('biotailr_registered_users');
    if (storedUsers) registeredUsers = JSON.parse(storedUsers);
  } catch (e) {}

  // Format subscription items
  const subRecords = (subscriptions || []).map(s => {
    let tierKey = s.planId;
    if (tierKey === '1_day') tierKey = 'day';
    if (tierKey === '1_week') tierKey = 'week';
    if (tierKey === '1_month') tierKey = 'month';
    if (tierKey === '1_year') tierKey = 'year';

    const dateObj = s.createdAt ? new Date(s.createdAt) : new Date();
    const formattedDate = formatDate(dateObj);

    return {
      id: s.id || `sub_${Math.random().toString(36).substring(2, 8)}`,
      name: s.fullName || 'Candidate',
      email: s.email || '',
      phone: s.phone || 'N/A',
      tierKey: tierKey,
      tierDisplay: s.planName || formatTierName(tierKey),
      amount: Number(s.amount) || getTierPrice(tierKey),
      createdAt: dateObj.getTime(),
      dateDisplay: formattedDate,
      validity: getValidityDuration(tierKey),
      status: s.status || 'pending', // active, pending, deactivated
      type: 'subscription'
    };
  });

  // Format user items (Free 1st 500 and Free Tier 4-day)
  const userRecords = Object.values(registeredUsers).map((u, idx) => {
    const isEarly = !!u.isEarlyAdopter || (u.registrationIndex && u.registrationIndex <= 500) || idx < 500;
    const tierKey = isEarly ? 'free' : 'free_tier';
    const tierDisplay = isEarly ? 'Free (1st 500 Early)' : 'Free Tier (4 Days)';
    const dateObj = u.createdAt ? new Date(u.createdAt) : new Date();
    const formattedDate = formatDate(dateObj);

    const now = Date.now();
    const duration = isEarly ? 14 * 24 * 60 * 60 * 1000 : 4 * 24 * 60 * 60 * 1000;
    const expiresAt = u.expiresAt || (dateObj.getTime() + duration);
    const isExpired = expiresAt < now || u.isActive === false;

    return {
      id: u.id || `usr_${Math.random().toString(36).substring(2, 8)}`,
      name: u.fullName || u.email.split('@')[0],
      email: u.email,
      phone: u.phone || 'N/A',
      tierKey: tierKey,
      tierDisplay: tierDisplay,
      amount: 0,
      createdAt: dateObj.getTime(),
      dateDisplay: formattedDate,
      validity: isExpired ? 'Expired' : (isEarly ? '14 Days Access' : '4 Days Demo'),
      status: isExpired ? 'expired' : 'active',
      type: 'user'
    };
  });

  // Seed sample demo data if completely empty so the enterprise table shines immediately
  if (subRecords.length === 0 && userRecords.length === 0) {
    userRecords.push(
      { id: 'usr_501', name: 'Sanjay N (Founder Early)', email: 'sanjay.n.ihub@snsgroups.com', phone: '+91 98401 23456', tierKey: 'free', tierDisplay: 'Free (1st 500 Early)', amount: 0, createdAt: Date.now() - 86400000, dateDisplay: formatDate(new Date(Date.now() - 86400000)), validity: '13 Days Remaining', status: 'active', type: 'user' },
      { id: 'usr_502', name: 'Priya Sharma (Frontend Eng)', email: 'priya.sharma@gmail.com', phone: '+91 97890 12345', tierKey: 'free', tierDisplay: 'Free (1st 500 Early)', amount: 0, createdAt: Date.now() - 172800000, dateDisplay: formatDate(new Date(Date.now() - 172800000)), validity: '12 Days Remaining', status: 'active', type: 'user' },
      { id: 'usr_503', name: 'Vikram Mehta (Demo User)', email: 'vikram.m@outlook.com', phone: '+91 94440 67890', tierKey: 'free_tier', tierDisplay: 'Free Tier (4 Days)', amount: 0, createdAt: Date.now() - 86400000, dateDisplay: formatDate(new Date(Date.now() - 86400000)), validity: '3 Days Remaining', status: 'active', type: 'user' }
    );
    subRecords.push(
      { id: 'sub_001', name: 'Advanced Tech Industries', email: 'careers@advtech.com', phone: '+91 98888 11111', tierKey: 'day', tierDisplay: 'Day Sprint', amount: 5, createdAt: Date.now() - 43200000, dateDisplay: formatDate(new Date(Date.now() - 43200000)), validity: '24 Hours Access', status: 'active', type: 'subscription' },
      { id: 'sub_002', name: 'Arun Kumar (Full Stack)', email: 'arun.k@gmail.com', phone: '+91 99999 22222', tierKey: 'week', tierDisplay: 'Week Sprint', amount: 30, createdAt: Date.now() - 86400000, dateDisplay: formatDate(new Date(Date.now() - 86400000)), validity: '7 Days Access', status: 'pending', type: 'subscription' },
      { id: 'sub_003', name: 'LGM Pharma Global', email: 'hr@lgmpharma.com', phone: '+91 97777 33333', tierKey: 'month', tierDisplay: 'Month Campaign', amount: 115, createdAt: Date.now() - 120000000, dateDisplay: formatDate(new Date(Date.now() - 120000000)), validity: '30 Days Access', status: 'active', type: 'subscription' },
      { id: 'sub_004', name: 'Reckitt Healthcare Talent', email: 'talent@reckitt.uk', phone: '+91 96666 44444', tierKey: 'year', tierDisplay: 'Year Career Pass', amount: 1000, createdAt: Date.now() - 240000000, dateDisplay: formatDate(new Date(Date.now() - 240000000)), validity: '365 Days Access', status: 'active', type: 'subscription' }
    );
  }

  // Combine all records (newest first)
  allRecords = [...subRecords, ...userRecords].sort((a, b) => b.createdAt - a.createdAt);

  updateTopStats();
  renderTable();
}

/**
 * Compute Stats Metrics Strip
 */
function updateTopStats() {
  const totalCount = allRecords.length;
  const free500Count = allRecords.filter(r => r.tierKey === 'free').length;
  const activeCount = allRecords.filter(r => r.status === 'active' || r.status === 'matched').length;
  const totalRevenue = allRecords.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  document.getElementById('stat-total-count').textContent = totalCount;
  document.getElementById('stat-free-500-count').textContent = free500Count;
  document.getElementById('stat-active-count').textContent = activeCount;
  document.getElementById('stat-revenue-total').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
}

/**
 * Setup Tabs: All, Free, Free Tier, Day, Week, Month, Year
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab-pill-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activeTab = tab.getAttribute('data-tab');
      currentPage = 1;
      renderTable();
    });
  });
}

/**
 * Toggle Column Search Input Row
 */
function setupColumnSearchToggle() {
  const toggle = document.getElementById('toggle-column-search');
  const searchRow = document.getElementById('column-search-row');
  if (!toggle || !searchRow) return;

  toggle.addEventListener('change', () => {
    searchRow.style.display = toggle.checked ? 'table-row' : 'none';
  });
}

/**
 * Setup Global and Per-Column Filter Listeners
 */
function setupFilterInputs() {
  // Global quick search
  const globalInput = document.getElementById('global-search-input');
  globalInput?.addEventListener('input', (e) => {
    globalSearchQuery = e.target.value.toLowerCase().trim();
    currentPage = 1;
    renderTable();
  });

  // Per-column filter inputs
  document.querySelectorAll('.col-filter-input').forEach(input => {
    input.addEventListener('input', (e) => {
      const colKey = input.getAttribute('data-col');
      colFilters[colKey] = e.target.value.toLowerCase().trim();
      currentPage = 1;
      renderTable();
    });
  });
}

/**
 * Setup Pagination Event Listeners
 */
function setupPaginationControls() {
  const rowsSelect = document.getElementById('select-rows-per-page');
  rowsSelect?.addEventListener('change', (e) => {
    pageSize = Number(e.target.value) || 10;
    currentPage = 1;
    renderTable();
  });
}

/**
 * Setup Toolbar Actions (Export, Refresh, Add)
 */
function setupToolbarButtons() {
  // Refresh button
  document.getElementById('btn-table-refresh')?.addEventListener('click', async () => {
    const btn = document.getElementById('btn-table-refresh');
    btn.style.transform = 'rotate(180deg)';
    await loadAllData();
    setTimeout(() => { btn.style.transform = ''; }, 300);
    showToast('Table data reloaded & synchronized.');
  });

  // Export to Excel / CSV
  document.getElementById('btn-export-excel')?.addEventListener('click', () => {
    exportTableToCsv();
  });
}

/**
 * Main Table Render Engine with Dynamic Slicing & Pagination
 */
function renderTable() {
  const tbody = document.getElementById('subscriptions-table-body');
  if (!tbody) return;

  // 1. Filter by Tab
  let filtered = allRecords.filter(item => {
    if (activeTab === 'all') return true;
    if (activeTab === 'free') return item.tierKey === 'free';
    if (activeTab === 'free_tier') return item.tierKey === 'free_tier';
    if (activeTab === 'day') return item.tierKey === 'day';
    if (activeTab === 'week') return item.tierKey === 'week';
    if (activeTab === 'month') return item.tierKey === 'month';
    if (activeTab === 'year') return item.tierKey === 'year';
    return true;
  });

  // 2. Filter by Global Query
  if (globalSearchQuery) {
    filtered = filtered.filter(item => {
      const fullStr = `${item.name} ${item.email} ${item.phone} ${item.tierDisplay} ${item.status}`.toLowerCase();
      return fullStr.includes(globalSearchQuery);
    });
  }

  // 3. Filter by Column Inputs
  if (colFilters.name) {
    filtered = filtered.filter(item => item.name.toLowerCase().includes(colFilters.name) || item.email.toLowerCase().includes(colFilters.name));
  }
  if (colFilters.date) {
    filtered = filtered.filter(item => item.dateDisplay.toLowerCase().includes(colFilters.date));
  }
  if (colFilters.phone) {
    filtered = filtered.filter(item => item.phone.toLowerCase().includes(colFilters.phone));
  }
  if (colFilters.tier) {
    filtered = filtered.filter(item => item.tierDisplay.toLowerCase().includes(colFilters.tier));
  }
  if (colFilters.amount) {
    filtered = filtered.filter(item => String(item.amount).includes(colFilters.amount));
  }
  if (colFilters.validity) {
    filtered = filtered.filter(item => item.validity.toLowerCase().includes(colFilters.validity));
  }
  if (colFilters.status) {
    filtered = filtered.filter(item => item.status.toLowerCase().includes(colFilters.status));
  }

  const totalFiltered = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  if (currentPage > totalPages) currentPage = totalPages;

  const startIndex = (currentPage - 1) * pageSize;
  const pagedRecords = filtered.slice(startIndex, startIndex + pageSize);

  // Render Rows
  if (pagedRecords.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="8" style="text-align: center; padding: 3rem; color: #64748b; font-weight: 600;">
          No candidates or passes match the active tab and search criteria.
        </td>
      </tr>
    `;
  } else {
    tbody.innerHTML = pagedRecords.map((item, idx) => {
      const statusClass = getStatusPillClass(item.status);
      const statusLabel = getStatusLabel(item.status);

      return `
        <tr data-record-id="${item.id}">
          <td class="candidate-name-cell">
            <div>${escapeHtml(item.name)}</div>
            <div style="font-size: 0.76rem; color: #64748b; font-weight: 500; text-transform: lowercase;">${escapeHtml(item.email)}</div>
          </td>
          <td class="candidate-date-cell">
            ${item.dateDisplay}
          </td>
          <td class="candidate-phone-cell">
            <a href="tel:${escapeHtml(item.phone)}" style="color: inherit; text-decoration: none;">${escapeHtml(item.phone)}</a>
          </td>
          <td>
            <span style="font-weight: 600; color: var(--brand-navy); font-size: 0.8rem;">${escapeHtml(item.tierDisplay)}</span>
          </td>
          <td class="candidate-amount-cell">
            ₹${item.amount.toLocaleString('en-IN')}.00
          </td>
          <td style="font-size: 0.82rem; color: #475569; font-weight: 600;">
            ${escapeHtml(item.validity)}
          </td>
          <td>
            <span class="status-pill ${statusClass}">
              ${statusLabel}
            </span>
          </td>
          <td class="action-cell-wrap">
            <button type="button" class="btn-row-action-pill" data-id="${item.id}" title="Toggle Actions">
              <span>Actions</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
            </button>
          </td>
        </tr>
      `;
    }).join('');
  }

  // Update Pagination Info
  const startDisplay = totalFiltered === 0 ? 0 : startIndex + 1;
  const endDisplay = Math.min(startIndex + pageSize, totalFiltered);
  document.getElementById('pagination-info-text').textContent = `Showing ${startDisplay} to ${endDisplay} of ${totalFiltered} entries`;

  // Render Page Buttons
  renderPaginationButtons(totalPages);
  attachRowDropdownListeners();
}

/**
 * Render Numeric Pagination Buttons
 */
function renderPaginationButtons(totalPages) {
  const container = document.getElementById('pagination-buttons-container');
  if (!container) return;

  let btnsHtml = `
    <button type="button" class="page-num-btn" id="btn-page-prev" ${currentPage <= 1 ? 'disabled' : ''}>&laquo;</button>
  `;

  for (let i = 1; i <= totalPages; i++) {
    // If many pages, show first few, current, and last
    if (totalPages > 7) {
      if (i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
        if (i === 3 || i === totalPages - 2) {
          btnsHtml += `<span style="padding: 0 4px; color: #94a3b8;">...</span>`;
        }
        continue;
      }
    }

    btnsHtml += `
      <button type="button" class="page-num-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>
    `;
  }

  btnsHtml += `
    <button type="button" class="page-num-btn" id="btn-page-next" ${currentPage >= totalPages ? 'disabled' : ''}>&raquo;</button>
  `;

  container.innerHTML = btnsHtml;

  // Event bindings
  document.getElementById('btn-page-prev')?.addEventListener('click', () => {
    if (currentPage > 1) {
      currentPage--;
      renderTable();
    }
  });

  document.getElementById('btn-page-next')?.addEventListener('click', () => {
    if (currentPage < totalPages) {
      currentPage++;
      renderTable();
    }
  });

  container.querySelectorAll('.page-num-btn[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      currentPage = Number(btn.getAttribute('data-page'));
      renderTable();
    });
  });
}

/**
 * Attach Row Actions Dropdown Toggle and Actions
 */
let currentActionRecordId = null;

function attachRowDropdownListeners() {
  const menu = document.getElementById('global-actions-menu');
  if (!menu) return;

  const closeMenu = () => {
    menu.classList.remove('show');
    menu.style.display = 'none';
    currentActionRecordId = null;
    document.querySelectorAll('.btn-row-action-pill').forEach(b => b.classList.remove('active'));
  };

  document.querySelectorAll('.btn-row-action-pill').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = btn.getAttribute('data-id');
      const record = allRecords.find(r => r.id === id);
      if (!record) return;

      const isAlreadyOpen = (currentActionRecordId === id && menu.classList.contains('show'));
      closeMenu();

      if (!isAlreadyOpen) {
        currentActionRecordId = id;
        btn.classList.add('active');

        // Dynamic candidate links
        const callBtn = document.getElementById('menu-action-call');
        if (callBtn) {
          const hasPhone = record.phone && record.phone !== 'N/A';
          callBtn.href = hasPhone ? `tel:${record.phone}` : '#';
          callBtn.style.opacity = hasPhone ? '1' : '0.4';
          callBtn.style.pointerEvents = hasPhone ? 'auto' : 'none';
        }

        const emailBtn = document.getElementById('menu-action-email');
        if (emailBtn) {
          emailBtn.href = record.email ? `mailto:${record.email}?subject=BioTailr%20AI%20Candidate%20Update` : '#';
          emailBtn.style.opacity = record.email ? '1' : '0.4';
          emailBtn.style.pointerEvents = record.email ? 'auto' : 'none';
        }

        // Measure and position globally relative to viewport
        menu.style.display = 'block';
        menu.style.visibility = 'hidden';

        const rect = btn.getBoundingClientRect();
        const menuHeight = menu.offsetHeight || 190;
        const menuWidth = menu.offsetWidth || 170;

        // Auto flip up if insufficient space below
        const spaceBelow = window.innerHeight - rect.bottom;
        const openUpward = spaceBelow < (menuHeight + 12) && rect.top > menuHeight;

        let top = openUpward ? (rect.top - menuHeight - 4) : (rect.bottom + 4);
        let left = rect.right - menuWidth;

        if (left < 10) left = 10;
        if (top < 10) top = 10;

        menu.style.top = `${Math.round(top)}px`;
        menu.style.left = `${Math.round(left)}px`;
        menu.style.visibility = 'visible';
        menu.classList.add('show');
      }
    });
  });

  // Global listeners to close open dropdown
  document.addEventListener('click', closeMenu);
  window.addEventListener('resize', closeMenu);
  window.addEventListener('scroll', closeMenu, { passive: true });
  document.querySelector('.enterprise-table-scroll')?.addEventListener('scroll', closeMenu, { passive: true });

  // Bind actions on the global menu once
  if (!menu._actionsBound) {
    menu._actionsBound = true;
    menu.querySelectorAll('.row-menu-btn[data-action]').forEach(actionBtn => {
      actionBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const action = actionBtn.getAttribute('data-action');
        const id = currentActionRecordId;
        const record = allRecords.find(r => r.id === id);
        closeMenu();
        if (!record) return;

        if (action === 'activate') {
          record.status = 'active';
          record.validity = 'Active Unrestricted';
          persistRecordChange(record);
          showToast(`Pass for "${record.name}" activated!`);
          renderTable();
        } else if (action === 'deactivate') {
          record.status = 'deactivated';
          record.validity = 'Deactivated by Admin';
          persistRecordChange(record);
          showToast(`Pass for "${record.name}" deactivated.`);
          renderTable();
        } else if (action === 'extend') {
          record.validity = 'Extended +7 Days Access';
          record.status = 'active';
          persistRecordChange(record);
          showToast(`Extended 7 days access for "${record.name}".`);
          renderTable();
        } else if (action === 'delete') {
          if (confirm(`Are you sure you want to delete record for "${record.name}"?`)) {
            allRecords = allRecords.filter(r => r.id !== id);
            deleteStoredRecord(id);
            showToast(`Deleted record "${record.name}".`);
            updateTopStats();
            renderTable();
          }
        }
      });
    });
  }
}

/**
 * Persist Updates to Storage & Server
 */
function persistRecordChange(record) {
  if (record.type === 'subscription') {
    let stored = [];
    try {
      stored = JSON.parse(localStorage.getItem('biotailr_subscription_requests') || '[]');
    } catch (e) {}
    const idx = stored.findIndex(s => s.id === record.id);
    if (idx !== -1) {
      stored[idx].status = record.status;
      localStorage.setItem('biotailr_subscription_requests', JSON.stringify(stored));
    }
    fetch('/api/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: record.id, status: record.status })
    }).catch(() => {});
  } else {
    // User record
    let users = {};
    try {
      users = JSON.parse(localStorage.getItem('biotailr_registered_users') || '{}');
      if (users[record.email.toLowerCase()]) {
        users[record.email.toLowerCase()].isActive = record.status === 'active';
        localStorage.setItem('biotailr_registered_users', JSON.stringify(users));
      }
    } catch (e) {}
  }
}

function deleteStoredRecord(id) {
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('biotailr_subscription_requests') || '[]');
    stored = stored.filter(s => s.id !== id);
    localStorage.setItem('biotailr_subscription_requests', JSON.stringify(stored));
  } catch (e) {}

  fetch('/api/subscriptions', {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id })
  }).catch(() => {});
}

/**
 * Export Visible Data to CSV
 */
function exportTableToCsv() {
  if (allRecords.length === 0) {
    showToast('No records available to export.');
    return;
  }

  const headers = ['Candidate Name', 'Email', 'Date', 'Phone', 'Plan Tier', 'Amount (INR)', 'Validity', 'Status'];
  const rows = allRecords.map(r => [
    `"${r.name.replace(/"/g, '""')}"`,
    `"${r.email.replace(/"/g, '""')}"`,
    `"${r.dateDisplay}"`,
    `"${r.phone}"`,
    `"${r.tierDisplay}"`,
    r.amount,
    `"${r.validity}"`,
    `"${r.status}"`
  ]);

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `biotailr_candidates_and_passes_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  showToast('Export completed! File downloaded.');
}

/**
 * Add Candidate Pass Dialog
 */
function promptAddCandidatePass() {
  const name = prompt('Candidate Name:');
  if (!name) return;
  const email = prompt('Candidate Email:');
  if (!email) return;
  const phone = prompt('Phone Number:') || '+91 90000 00000';
  const tier = prompt('Plan Tier (free, free_tier, day, week, month, year):', 'day') || 'day';

  const amount = getTierPrice(tier);
  const newRec = {
    id: `sub_${Date.now()}`,
    name,
    email,
    phone,
    tierKey: tier,
    tierDisplay: formatTierName(tier),
    amount,
    createdAt: Date.now(),
    dateDisplay: formatDate(new Date()),
    validity: getValidityDuration(tier),
    status: 'active',
    type: 'subscription'
  };

  allRecords.unshift(newRec);
  let stored = [];
  try {
    stored = JSON.parse(localStorage.getItem('biotailr_subscription_requests') || '[]');
  } catch (e) {}
  stored.unshift({
    id: newRec.id,
    fullName: newRec.name,
    email: newRec.email,
    phone: newRec.phone,
    planId: tier === 'day' ? '1_day' : (tier === 'week' ? '1_week' : (tier === 'month' ? '1_month' : (tier === 'year' ? '1_year' : tier))),
    planName: newRec.tierDisplay,
    amount: newRec.amount,
    status: 'active',
    createdAt: newRec.createdAt
  });
  localStorage.setItem('biotailr_subscription_requests', JSON.stringify(stored));

  updateTopStats();
  renderTable();
  showToast(`New ${newRec.tierDisplay} pass added for ${name}!`);
}

/**
 * Helpers
 */
function formatDate(d) {
  const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
  const day = String(d.getDate()).padStart(2, '0');
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

function formatTierName(key) {
  if (key === 'free') return 'Free (1st 500 Early)';
  if (key === 'free_tier') return 'Free Tier (4 Days)';
  if (key === 'day') return 'Day Sprint';
  if (key === 'week') return 'Week Sprint';
  if (key === 'month') return 'Month Campaign';
  if (key === 'year') return 'Year Career Pass';
  return key;
}

function getTierPrice(key) {
  if (key === 'day') return 5;
  if (key === 'week') return 30;
  if (key === 'month') return 115;
  if (key === 'year') return 1000;
  return 0;
}

function getValidityDuration(key) {
  if (key === 'free') return '14 Days Access';
  if (key === 'free_tier') return '4 Days Demo';
  if (key === 'day') return '24 Hours Access';
  if (key === 'week') return '7 Days Access';
  if (key === 'month') return '30 Days Access';
  if (key === 'year') return '365 Days Access';
  return 'Standard Access';
}

function getStatusPillClass(status) {
  if (status === 'active' || status === 'matched') return 'status-active';
  if (status === 'free' || status === 'received') return 'status-free';
  if (status === 'pending') return 'status-pending';
  return 'status-deactivated';
}

function getStatusLabel(status) {
  if (status === 'active') return 'Active';
  if (status === 'matched') return 'Matched';
  if (status === 'free') return '2-Wk Free';
  if (status === 'received') return 'Demo Access';
  if (status === 'pending') return 'Pending Call';
  if (status === 'expired') return 'Expired';
  return 'Deactivated';
}

function showToast(msg) {
  const toast = document.getElementById('admin-toast');
  const msgEl = document.getElementById('toast-message');
  if (!toast || !msgEl) return;

  msgEl.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => {
    toast.classList.remove('show');
  }, 2800);
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
