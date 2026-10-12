const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

// Simple .env parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        process.env[key.trim()] = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
}
loadEnv();

const RECIPIENT = '2005sanjaynrs@gmail.com';

async function fetchSupabaseUsers() {
  const url = `${process.env.SUPABASE_URL || 'https://txgkwrealcochtwlokzk.supabase.co'}/auth/v1/admin/users`;
  const secretKey = process.env.SUPABASE_SECRET_KEY || '';

  try {
    const res = await fetch(url, {
      headers: {
        'apikey': secretKey,
        'Authorization': `Bearer ${secretKey}`
      }
    });
    if (res.ok) {
      const data = await res.json();
      return data.users || [];
    }
  } catch (e) {
    console.warn('[Boss Updater] Cloud users query note:', e.message);
  }
  return [];
}

function loadSubscriptions() {
  const subFile = path.join(__dirname, '..', 'subscriptions.json');
  try {
    if (fs.existsSync(subFile)) {
      return JSON.parse(fs.readFileSync(subFile, 'utf8'));
    }
  } catch (e) {}
  return [];
}

async function runBossUpdater() {
  console.log('[Boss Updater] Gathering user analytics and metrics...');
  const users = await fetchSupabaseUsers();
  const subscriptions = loadSubscriptions();

  const now = Date.now();
  const past24hCutoff = now - (24 * 60 * 60 * 1000);

  const totalUsers = users.length;
  const newUsers24h = users.filter(u => new Date(u.created_at).getTime() >= past24hCutoff).length;

  const activeSubs = subscriptions.filter(s => s.status === 'active').length;
  const pendingSubs = subscriptions.filter(s => s.status === 'pending').length;
  const totalRevenue = subscriptions.reduce((sum, s) => sum + (Number(s.amount) || 0), 0);

  // 7-Day Trend Calculation
  const daysTrend = [];
  for (let i = 6; i >= 0; i--) {
    const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
    const label = dayStart.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
    const count = users.filter(u => {
      const t = new Date(u.created_at).getTime();
      return t >= dayStart.getTime() && t < dayEnd.getTime();
    }).length;
    daysTrend.push({ label, count });
  }

  // Max for SVG chart scaling
  const maxTrend = Math.max(1, ...daysTrend.map(d => d.count));
  const chartBars = daysTrend.map(d => {
    const heightPercent = Math.max(12, Math.round((d.count / maxTrend) * 85));
    return `
      <td style="text-align: center; vertical-align: bottom; padding: 0 8px; width: 14%;">
        <div style="font-size: 11px; font-weight: 700; color: #1e1b78; margin-bottom: 6px;">${d.count}</div>
        <div style="background: linear-gradient(180deg, #00b49f 0%, #0d9488 100%); height: ${heightPercent}px; border-radius: 4px 4px 0 0; min-height: 8px;"></div>
        <div style="font-size: 10px; color: #64748b; margin-top: 6px; font-weight: 600;">${d.label}</div>
      </td>
    `;
  }).join('');

  // Executive Clean HTML Email Template (NO EMOJIS)
  const reportDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { margin: 0; padding: 0; background: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #0f172a; }
    .email-container { max-width: 620px; margin: 30px auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.05); }
    .header { background: #1e1b78; padding: 32px 36px; text-align: left; }
    .header h1 { margin: 0; color: #ffffff; font-size: 22px; font-weight: 800; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; color: #99e6dc; font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
    .body-content { padding: 32px 36px; }
    .kpi-grid { width: 100%; border-collapse: collapse; margin-bottom: 28px; }
    .kpi-cell { width: 50%; padding: 8px; }
    .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 18px 20px; }
    .kpi-label { font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 4px; }
    .kpi-val { font-size: 26px; font-weight: 800; color: #1e1b78; line-height: 1; }
    .kpi-sub { font-size: 12px; color: #009382; font-weight: 600; margin-top: 4px; }
    .chart-section { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 28px; }
    .section-title { font-size: 13px; font-weight: 800; color: #1e1b78; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 16px; }
    .chart-table { width: 100%; height: 130px; border-collapse: collapse; }
    .sub-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .sub-table th { background: #f1f5f9; padding: 10px 12px; text-align: left; font-weight: 700; color: #475569; border-bottom: 1px solid #e2e8f0; }
    .sub-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; color: #1e293b; }
    .footer { background: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 36px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>BioTailr AI - Executive Daily Briefing</h1>
      <p>Boss Updater Service &bull; ${reportDate}</p>
    </div>

    <div class="body-content">
      <table class="kpi-grid">
        <tr>
          <td class="kpi-cell">
            <div class="kpi-card">
              <div class="kpi-label">Total Users</div>
              <div class="kpi-val">${totalUsers}</div>
              <div class="kpi-sub">Verified Candidate Accounts</div>
            </div>
          </td>
          <td class="kpi-cell">
            <div class="kpi-card">
              <div class="kpi-label">New Users (Past 24h)</div>
              <div class="kpi-val" style="color: #00b49f;">+${newUsers24h}</div>
              <div class="kpi-sub">New Sign-ups Today</div>
            </div>
          </td>
        </tr>
        <tr>
          <td class="kpi-cell">
            <div class="kpi-card">
              <div class="kpi-label">Active Subscriptions</div>
              <div class="kpi-val" style="color: #10b981;">${activeSubs}</div>
              <div class="kpi-sub">${pendingSubs} Pending Call Verifications</div>
            </div>
          </td>
          <td class="kpi-cell">
            <div class="kpi-card">
              <div class="kpi-label">Revenue Pipeline</div>
              <div class="kpi-val">INR ${totalRevenue.toLocaleString('en-IN')}</div>
              <div class="kpi-sub">Total Plan Commitments</div>
            </div>
          </td>
        </tr>
      </table>

      <div class="chart-section">
        <div class="section-title">User Registration Trend (Past 7 Days)</div>
        <table class="chart-table">
          <tr>
            ${chartBars}
          </tr>
        </table>
      </div>

      <div class="section-title" style="margin-bottom: 10px;">Recent Subscription Requests</div>
      <table class="sub-table">
        <thead>
          <tr>
            <th>Candidate</th>
            <th>Phone</th>
            <th>Plan</th>
            <th>Amount</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptions.slice(0, 5).map(s => `
            <tr>
              <td><strong>${s.fullName || 'Candidate'}</strong></td>
              <td>${s.phone || 'N/A'}</td>
              <td>${s.planName || s.planId}</td>
              <td>INR ${s.amount}</td>
              <td style="font-weight: 700; color: ${s.status === 'active' ? '#16a34a' : (s.status === 'pending' ? '#d97706' : '#64748b')};">${s.status.toUpperCase()}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      Automated daily briefing generated at 01:00 AM by BioTailr AI Boss Updater.<br>
      Recipient: ${RECIPIENT} &bull; Confidential & Internal Only.
    </div>
  </div>
</body>
</html>
  `;

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER || 'sanjay.n.ihub@snsgroups.com',
      pass: process.env.SMTP_PASS || 'myiy typl poyy pnnj'
    }
  });

  const mailOptions = {
    from: `"BioTailr AI Boss Updater" <${process.env.SMTP_FROM || 'sanjay.n.ihub@snsgroups.com'}>`,
    to: RECIPIENT,
    subject: `BioTailr AI Executive Briefing — ${totalUsers} Users, +${newUsers24h} New (24h) — ${reportDate}`,
    html: htmlContent
  };

  const info = await transporter.sendMail(mailOptions);
  console.log(`[Boss Updater] Daily briefing successfully dispatched to ${RECIPIENT}! MessageId: ${info.messageId}`);
  return {
    success: true,
    messageId: info.messageId,
    recipient: RECIPIENT,
    metrics: {
      totalUsers,
      newUsers24h,
      activeSubs,
      pendingSubs,
      totalRevenue
    }
  };
}

// Allow direct CLI execution
if (require.main === module) {
  runBossUpdater()
    .then(res => {
      console.log('[Boss Updater] Execution result:', JSON.stringify(res, null, 2));
      process.exit(0);
    })
    .catch(err => {
      console.error('[Boss Updater] Execution failed:', err);
      process.exit(1);
    });
}

module.exports = { runBossUpdater };
