const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8181;

// Simple .env parser without external dependencies
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf8');
    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
        const [key, ...rest] = trimmed.split('=');
        const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key.trim()] = val;
      }
    });
  }
}

loadEnv();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.zip': 'application/zip',
  '.pdf': 'application/pdf'
};

const server = http.createServer((req, res) => {
  let reqPath = decodeURIComponent(req.url.split('?')[0]);

  // API endpoint to serve keys loaded from .env
  if (reqPath === '/api/keys') {
    res.writeHead(200, { 
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    });
    res.end(JSON.stringify({
      geminiKey: process.env.GEMINI_API_KEY || '',
      groqKey: process.env.GROQ_API_KEY || '',
      supabaseUrl: process.env.SUPABASE_URL || 'https://txgkwrealcochtwlokzk.supabase.co',
      supabasePublishableKey: process.env.SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_1UmMkEcFAb8fwV3wYf0I3w_GrY5exxI',
      supabaseSecretKey: process.env.SUPABASE_SECRET_KEY || ''
    }));
    return;
  }

  // API endpoints for subscriptions
  if (reqPath === '/api/subscriptions') {
    const subFilePath = path.join(__dirname, 'subscriptions.json');

    const readSubs = () => {
      try {
        if (fs.existsSync(subFilePath)) {
          return JSON.parse(fs.readFileSync(subFilePath, 'utf8'));
        }
      } catch (e) {}
      return [];
    };

    const writeSubs = (data) => {
      fs.writeFileSync(subFilePath, JSON.stringify(data, null, 2), 'utf8');
    };

    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify(readSubs()));
      return;
    }

    if (req.method === 'POST') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const newSub = JSON.parse(body);
          const list = readSubs();
          newSub.id = newSub.id || ('sub_' + Date.now());
          newSub.createdAt = newSub.createdAt || Date.now();
          newSub.createdFormatted = newSub.createdFormatted || new Date().toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
          newSub.status = newSub.status || 'pending';
          list.unshift(newSub);
          writeSubs(list);
          res.writeHead(201, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true, subscription: newSub }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'PUT') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const update = JSON.parse(body);
          const list = readSubs();
          const idx = list.findIndex(item => item.id === update.id);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...update };
            writeSubs(list);
            res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: true, subscription: list[idx] }));
          } else {
            res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
            res.end(JSON.stringify({ success: false, error: 'Subscription not found' }));
          }
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE') {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        try {
          const { id } = JSON.parse(body);
          let list = readSubs();
          list = list.filter(item => item.id !== id);
          writeSubs(list);
          res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: true }));
        } catch (err) {
          res.writeHead(400, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      });
      res.end();
      return;
    }
  }

  // Trigger Boss Updater manually or on demand
  if (reqPath === '/api/admin/trigger-boss-updater') {
    const { runBossUpdater } = require('./scripts/boss-updater.cjs');
    runBossUpdater()
      .then(result => {
        res.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        res.writeHead(500, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
        res.end(JSON.stringify({ success: false, error: err.message }));
      });
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  
  let filePath;
  if (reqPath.startsWith('/ext/')) {
    filePath = path.join(__dirname, '..', 'BioTailr-AI-Extension', reqPath.replace('/ext/', ''));
  } else {
    filePath = path.join(__dirname, reqPath);
  }
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    }
  });
});

// Scheduler: Boss Updater at 1:00 AM daily
function initBossUpdaterScheduler() {
  const { runBossUpdater } = require('./scripts/boss-updater.cjs');
  let lastRunDate = '';

  setInterval(() => {
    const now = new Date();
    const currentDateStr = now.toISOString().split('T')[0];
    // Check if it's 1:00 AM (hour === 1 && minute === 0) and not yet run today
    if (now.getHours() === 1 && now.getMinutes() === 0 && lastRunDate !== currentDateStr) {
      lastRunDate = currentDateStr;
      console.log(`[Scheduler] 1:00 AM reached. Dispatching Boss Updater briefing for ${currentDateStr}...`);
      runBossUpdater().catch(e => console.error('[Scheduler] Boss Updater error:', e.message));
    }
  }, 30000); // Check every 30 seconds
}

server.listen(PORT, () => {
  console.log(`BioTailr server running at http://localhost:${PORT}`);
  initBossUpdaterScheduler();
});
