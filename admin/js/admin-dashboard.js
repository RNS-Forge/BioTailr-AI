import { requireAdminAuth, logoutAdmin } from './admin-auth.js';

let subscriptions = [];
let activePlanTab = 'all';
let searchQuery = '';
let statusFilter = 'all';

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
        showToast('Daily briefing successfully sent to 2005sanjaynrs@gmail.com');
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

  // Initialize UI controls
  setupTabs();
  setupSearchAndFilters();

  // Load subscriptions
  await loadSubscriptions();
});

/**
 * Fetch and synchronize subscriptions
 */
async function loadSubscriptions() {
  try {
    const res = await fetch('/api/subscriptions');
    if (res.ok) {
      subscriptions = await res.json();
    }
  } catch (e) {
    console.warn('[Admin] Server fetch error, using local fallback:', e);
  }

  // Fallback to localStorage if server list is empty
  if (!subscriptions || subscriptions.length === 0) {
    try {
      const stored = localStorage.getItem('biotailr_subscription_requests');
      if (stored) subscriptions = JSON.parse(stored);
    } catch (e) {}
  }

  // Always sync latest state to localStorage
  localStorage.setItem('biotailr_subscription_requests', JSON.stringify(subscriptions));

  updateStats();
  renderTable();
}

/**
 * Compute and update metric counters
 */
function updateStats() {
  const totalCount = subscriptions.length;
  const activeCount = subscriptions.filter(s => s.status === 'active').length;
  const pendingCount = subscriptions.filter(s => s.status === 'pending').length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  document.getElementById('stat-total-count').textContent = totalCount;
  document.getElementById('stat-active-count').textContent = activeCount;
  document.getElementById('stat-pending-count').textContent = pendingCount;
  document.getElementById('stat-revenue-total').textContent = `₹${totalRevenue.toLocaleString('en-IN')}`;
}

/**
 * Setup Plan Filter Tabs
 */
function setupTabs() {
  const tabs = document.querySelectorAll('.admin-tab-btn');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      activePlanTab = tab.getAttribute('data-tab');
      renderTable();
    });
  });
}

/**
 * Setup Live Search and Status Filter
 */
function setupSearchAndFilters() {
  const searchInput = document.getElementById('admin-search-input');
  const statusSelect = document.getElementById('admin-status-filter');

  searchInput?.addEventListener('input', (e) => {
    searchQuery = e.target.value.toLowerCase().trim();
    renderTable();
  });

  statusSelect?.addEventListener('change', (e) => {
    statusFilter = e.target.value;
    renderTable();
  });
}

/**
 * Render filtered table rows
 */
function renderTable() {
  const tbody = document.getElementById('subscriptions-table-body');
  if (!tbody) return;

  // 1. Filter by Plan Tab
  let filtered = subscriptions.filter(item => {
    if (activePlanTab === 'all') return true;
    return item.planId === activePlanTab;
  });

  // 2. Filter by Status
  if (statusFilter !== 'all') {
    filtered = filtered.filter(item => item.status === statusFilter);
  }

  // 3. Filter by Column Search Query (Name, Email, Phone, Plan)
  if (searchQuery) {
    filtered = filtered.filter(item => {
      const name = (item.fullName || '').toLowerCase();
      const email = (item.email || '').toLowerCase();
      const phone = (item.phone || '').toLowerCase();
      const plan = (item.planName || '').toLowerCase();
      return name.includes(searchQuery) || 
             email.includes(searchQuery) || 
             phone.includes(searchQuery) || 
             plan.includes(searchQuery);
    });
  }

  if (filtered.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="9" style="text-align: center; padding: 2.5rem; color: #64748b;">
          No subscription requests match the selected filters or search terms.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = filtered.map(item => {
    const planClass = getPlanBadgeClass(item.planId);
    const statusClass = getStatusBadgeClass(item.status);
    const statusLabel = item.status === 'active' ? 'Active' : (item.status === 'pending' ? 'Pending Call' : 'Deactivated');

    return `
      <tr data-sub-id="${item.id}">
        <td style="font-family: 'JetBrains Mono', monospace; font-size: 0.78rem; color: #64748b;">${item.id}</td>
        <td>
          <strong style="color: #1e1b78;">${escapeHtml(item.fullName || 'Candidate')}</strong>
        </td>
        <td>
          <a href="mailto:${escapeHtml(item.email)}" style="color: #0f172a; text-decoration: none;">${escapeHtml(item.email)}</a>
        </td>
        <td>
          <strong style="font-family: 'JetBrains Mono', monospace; font-size: 0.82rem; color: #0284c7;">
            <a href="tel:${escapeHtml(item.phone)}" style="color: inherit; text-decoration: none;">${escapeHtml(item.phone || 'N/A')}</a>
          </strong>
        </td>
        <td>
          <span class="badge-plan ${planClass}">${escapeHtml(item.planName || item.planId)}</span>
        </td>
        <td>
          <strong style="font-size: 0.95rem; color: #1e1b78;">₹${item.amount}</strong>
        </td>
        <td style="font-size: 0.8rem; color: #64748b; white-space: nowrap;">
          ${item.createdFormatted || new Date(item.createdAt).toLocaleDateString()}
        </td>
        <td>
          <span class="badge-status ${statusClass}">
            <span class="status-dot"></span>
            <span>${statusLabel}</span>
          </span>
        </td>
        <td style="text-align: center;">
          <div class="action-buttons-group">
            <button class="btn-action btn-activate btn-row-activate" data-id="${item.id}" title="Activate Subscription" ${item.status === 'active' ? 'disabled style="opacity: 0.45; cursor: default;"' : ''}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
              <span>Activate</span>
            </button>
            <button class="btn-action btn-deactivate btn-row-deactivate" data-id="${item.id}" title="Deactivate Access" ${item.status === 'deactivated' ? 'disabled style="opacity: 0.45; cursor: default;"' : ''}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
              <span>Deactivate</span>
            </button>
            <button class="btn-action btn-delete btn-row-delete" data-id="${item.id}" title="Delete Record">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              <span>Delete</span>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  attachRowActionListeners();
}

/**
 * Attach Event Listeners to 3-Mode Action Buttons
 */
function attachRowActionListeners() {
  // 1. Activate Button
  document.querySelectorAll('.btn-row-activate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await updateSubscriptionStatus(id, 'active', 'Subscription successfully activated!');
    });
  });

  // 2. Deactivate Button
  document.querySelectorAll('.btn-row-deactivate').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      await updateSubscriptionStatus(id, 'deactivated', 'Subscription access deactivated.');
    });
  });

  // 3. Delete Button
  document.querySelectorAll('.btn-row-delete').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-id');
      const item = subscriptions.find(s => s.id === id);
      const confirmDelete = confirm(`Are you sure you want to delete the subscription request for "${item?.fullName || id}"?`);
      if (confirmDelete) {
        await deleteSubscription(id);
      }
    });
  });
}

/**
 * Update Subscription Status via Server & Local Storage
 */
async function updateSubscriptionStatus(id, newStatus, message) {
  const target = subscriptions.find(s => s.id === id);
  if (!target) return;

  target.status = newStatus;
  localStorage.setItem('biotailr_subscription_requests', JSON.stringify(subscriptions));

  try {
    await fetch('/api/subscriptions', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: newStatus })
    });
  } catch (err) {
    console.warn('[Admin] Server update note:', err);
  }

  showToast(message);
  updateStats();
  renderTable();
}

/**
 * Delete Subscription Record
 */
async function deleteSubscription(id) {
  subscriptions = subscriptions.filter(s => s.id !== id);
  localStorage.setItem('biotailr_subscription_requests', JSON.stringify(subscriptions));

  try {
    await fetch('/api/subscriptions', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    });
  } catch (err) {
    console.warn('[Admin] Server delete note:', err);
  }

  showToast('Record deleted successfully.');
  updateStats();
  renderTable();
}

/**
 * Helpers
 */
function getPlanBadgeClass(planId) {
  if (planId === '1_day') return 'day';
  if (planId === '1_week') return 'week';
  if (planId === '1_month') return 'month';
  if (planId === '1_year') return 'year';
  return 'month';
}

function getStatusBadgeClass(status) {
  if (status === 'active') return 'active';
  if (status === 'pending') return 'pending';
  return 'deactivated';
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
