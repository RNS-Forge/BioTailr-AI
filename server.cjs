const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

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
  '.json': 'application/json'
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
      groqKey: process.env.GROQ_API_KEY || ''
    }));
    return;
  }

  if (reqPath === '/') reqPath = '/index.html';
  
  const filePath = path.join(__dirname, reqPath);
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

server.listen(PORT, () => {
  console.log(`BioTailr server running at http://localhost:${PORT}`);
});
