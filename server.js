const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8080;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. API: POST /api/products (Save products permanently to disk)
  if (req.method === 'POST' && req.url === '/api/products') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const productsList = JSON.parse(body);
        const filePath = path.join(__dirname, 'data', 'products.js');
        const fileContent = `const products = ${JSON.stringify(productsList, null, 2)};\n\nexport default products;\n`;
        
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write products to disk' }));
          } else {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));
          }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2. API: GET /api/products (Load products directly from disk)
  if (req.method === 'GET' && req.url === '/api/products') {
    const filePath = path.join(__dirname, 'data', 'products.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read products file' }));
        return;
      }
      
      const startIdx = content.indexOf('[');
      const endIdx = content.lastIndexOf(']');
      if (startIdx !== -1 && endIdx !== -1) {
        const jsonStr = content.substring(startIdx, endIdx + 1);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(jsonStr);
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid products structure on server' }));
      }
    });
    return;
  }

  // 3. Static File Server with SPA Fallback
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  let ext = path.extname(filePath);

  // If request has no extension (routing path e.g. /terms or /auth), fallback to index.html
  if (!ext) {
    filePath = path.join(__dirname, 'index.html');
    ext = '.html';
  }

  fs.exists(filePath, (exists) => {
    if (!exists) {
      // If it's a specific static file request with extension, 404 it. Otherwise redirect to index.html
      if (path.extname(req.url)) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }
      filePath = path.join(__dirname, 'index.html');
      ext = '.html';
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(data);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
