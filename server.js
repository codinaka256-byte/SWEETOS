const http = require('http');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('./utils/mailer');

const PORT = 8080;

let clients = [];

function broadcastAlert(type, message) {
  const data = JSON.stringify({ type, message });
  clients.forEach(c => {
    try {
      c.response.write(`data: ${data}\n\n`);
    } catch (e) {
      // Remove stale client
      clients = clients.filter(client => client.id !== c.id);
    }
  });
}

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
            broadcastAlert('products', 'Product catalog updated.');
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

  // 1b. API: POST /api/categories
  if (req.method === 'POST' && req.url === '/api/categories') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const list = JSON.parse(body);
        const filePath = path.join(__dirname, 'data', 'categories.js');
        const fileContent = `const categories = ${JSON.stringify(list, null, 2)};\n\nexport default categories;\n`;
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write categories to disk' }));
          } else {
            broadcastAlert('categories', 'Categories list updated.');
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

  // 2b. API: GET /api/categories
  if (req.method === 'GET' && req.url === '/api/categories') {
    const filePath = path.join(__dirname, 'data', 'categories.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read categories file' }));
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
        res.end(JSON.stringify({ error: 'Invalid categories structure on server' }));
      }
    });
    return;
  }

  // 1c. API: POST /api/brands
  if (req.method === 'POST' && req.url === '/api/brands') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const list = JSON.parse(body);
        const filePath = path.join(__dirname, 'data', 'brands.js');
        const fileContent = `const brands = ${JSON.stringify(list, null, 2)};\n\nexport default brands;\n`;
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write brands to disk' }));
          } else {
            broadcastAlert('brands', 'Brands list updated.');
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

  // 2c. API: GET /api/brands
  if (req.method === 'GET' && req.url === '/api/brands') {
    const filePath = path.join(__dirname, 'data', 'brands.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read brands file' }));
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
        res.end(JSON.stringify({ error: 'Invalid brands structure on server' }));
      }
    });
    return;
  }

  // 1d. API: POST /api/reviews
  if (req.method === 'POST' && req.url === '/api/reviews') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const list = JSON.parse(body);
        const filePath = path.join(__dirname, 'data', 'reviews.js');
        const fileContent = `const reviews = ${JSON.stringify(list, null, 2)};\n\nexport default reviews;\n`;
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write reviews to disk' }));
          } else {
            broadcastAlert('reviews', 'Product reviews updated.');
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

  // 2d. API: GET /api/reviews
  if (req.method === 'GET' && req.url === '/api/reviews') {
    const filePath = path.join(__dirname, 'data', 'reviews.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read reviews file' }));
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
        res.end(JSON.stringify({ error: 'Invalid reviews structure on server' }));
      }
    });
    return;
  }

  // 1e. SSE connection stream
  if (req.method === 'GET' && req.url === '/api/live-alerts') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*'
    });
    
    // Register client
    const clientId = Date.now();
    clients.push({ id: clientId, response: res });
    
    req.on('close', () => {
      clients = clients.filter(c => c.id !== clientId);
    });
    return;
  }

  // 1f. API: POST /api/orders
  if (req.method === 'POST' && req.url === '/api/orders') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const list = JSON.parse(body);
        
        // Enforce server-side email format regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const order of list) {
          const email = order.customerEmail || '';
          if (email && !emailRegex.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Adresse e-mail invalide : ${email}` }));
            return;
          }
        }
        
        // Load old orders list to compare
        let oldList = [];
        try {
          const oldFilePath = path.join(__dirname, 'data', 'orders.js');
          if (fs.existsSync(oldFilePath)) {
            const content = fs.readFileSync(oldFilePath, 'utf8');
            const start = content.indexOf('[');
            const end = content.lastIndexOf(']') + 1;
            if (start > -1 && end > -1) {
              oldList = JSON.parse(content.substring(start, end));
            }
          }
        } catch(e) {
          console.error('Failed to read previous orders list:', e);
        }

        const filePath = path.join(__dirname, 'data', 'orders.js');
        const fileContent = `const orders = ${JSON.stringify(list, null, 2)};\n\nexport default orders;\n`;
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write orders to disk' }));
          } else {
            broadcastAlert('orders', 'New order received!');
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true }));

            // Trigger asynchronous email delivery in the background
            try {
              list.forEach(newOrd => {
                const oldMatch = oldList.find(o => o.id === newOrd.id);
                if (!oldMatch) {
                  // This is a brand new order! Send confirmation email!
                  sendOrderConfirmationEmail(newOrd, req.headers.host);
                } else if (oldMatch && (oldMatch.status !== 'Done' && oldMatch.status !== 'Livré') && (newOrd.status === 'Done' || newOrd.status === 'Livré')) {
                  // Order was delivered! Send delivery notification + scratchcard instructions!
                  sendOrderDeliveryEmail(newOrd, req.headers.host);
                }
              });
            } catch(mailErr) {
              console.error('Email trigger handling failed:', mailErr);
            }
          }
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2f. API: GET /api/orders
  if (req.method === 'GET' && req.url === '/api/orders') {
    const filePath = path.join(__dirname, 'data', 'orders.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read orders file' }));
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
        res.end(JSON.stringify({ error: 'Invalid orders structure on server' }));
      }
    });
    return;
  }

  // 1g. API: POST /api/broadcast-alert
  if (req.method === 'POST' && req.url === '/api/broadcast-alert') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const { type, message } = payload;
        broadcastAlert(type || 'orders', message || 'Database updated');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));

        // Trigger real admin shortage email if coupon template is finished
        if (type === 'coupon' && message && message.includes('Rupture de stock')) {
          sendAdminShortageEmail(message);
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 1h. API: POST /api/coupons
  if (req.method === 'POST' && req.url === '/api/coupons') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const list = JSON.parse(body);
        const filePath = path.join(__dirname, 'data', 'coupons.js');
        const fileContent = `const coupons = ${JSON.stringify(list, null, 2)};\n\nexport default coupons;\n`;
        fs.writeFile(filePath, fileContent, 'utf8', (err) => {
          if (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Failed to write coupons to disk' }));
          } else {
            broadcastAlert('coupons', 'Coupons database updated.');
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

  // 2g. API: GET /api/coupons
  if (req.method === 'GET' && req.url === '/api/coupons') {
    const filePath = path.join(__dirname, 'data', 'coupons.js');
    fs.readFile(filePath, 'utf8', (err, content) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Failed to read coupons file' }));
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
        res.end(JSON.stringify({ error: 'Invalid coupons structure on server' }));
      }
    });
    return;
  }

  // 3. Static File Server with SPA Fallback
  let filePath = path.join(__dirname, req.url === '/' ? 'index.html' : req.url.split('?')[0]);
  
  // Automatically strip timestamp suffixes (e.g. _1786...) to prevent 404s
  if (filePath.includes('assets') && filePath.includes('_')) {
    const ext = path.extname(filePath);
    const baseWithoutExt = filePath.substring(0, filePath.lastIndexOf('_'));
    const fallbackPath = baseWithoutExt + ext;
    if (fs.existsSync(fallbackPath)) {
      filePath = fallbackPath;
    }
  }

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

async function sendOrderConfirmationEmail(order, host) {
  const customerEmail = order.customerEmail || 'guest@sweetos.com';
  const customerName = order.customerName || 'Client';
  const itemsHtml = (order.products || []).map(item => `
    <tr style="border-bottom: 1px solid #f1f5f9;">
      <td style="padding: 10px 0; text-align: left;">${item.name}</td>
      <td style="padding: 10px 0; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px 0; text-align: right; font-weight: 600;">${(item.price * item.quantity).toLocaleString()} FCFA</td>
    </tr>
  `).join('');

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #1e293b; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0052cc; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SWEETOS</h1>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Confirmation de commande</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800;">Merci pour votre achat !</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;">Bonjour <strong>${customerName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;">Nous avons bien reçu votre commande <strong>#${order.id}</strong>. Elle est actuellement en cours de préparation et nous vous contacterons sous peu pour la confirmation finale et la livraison.</p>
        
        <div style="background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #334155; line-height: 1.6; border: 1.5px solid #e2e8f0;">
          <strong>Méthode de paiement :</strong> ${order.paymentMethod === 'cod' ? 'Paiement à la livraison (Cash)' : order.paymentMethod === 'momo' ? 'Mobile Money' : 'Carte Bancaire'}<br>
          <strong>Adresse de livraison :</strong> ${order.customerAddress}
        </div>
      </div>
      
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <h3 style="font-size: 14px; margin: 0 0 12px 0; color: #0f172a; font-weight: 800; border-bottom: 1.5px solid #f1f5f9; padding-bottom: 8px;">Détails de la commande</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
          <thead>
            <tr style="color: #64748b; font-weight: 700; border-bottom: 1.5px solid #e2e8f0; text-align: left;">
              <th style="padding-bottom: 8px;">Article</th>
              <th style="padding-bottom: 8px; text-align: center; width: 40px;">Qté</th>
              <th style="padding-bottom: 8px; text-align: right; width: 100px;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
        
        <div style="margin-top: 16px; font-size: 13px; border-top: 1.5px solid #e2e8f0; padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
            <span>Sous-total</span>
            <span style="font-weight: 600; color: #0f172a;">${order.total.toLocaleString()} FCFA</span>
          </div>
          <div style="display: flex; justify-content: space-between; margin-bottom: 6px; color: #475569;">
            <span>Livraison</span>
            <span style="font-weight: 600; color: #10b981;">Gratuit</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: 800; color: #0f172a; margin-top: 10px; border-top: 1.5px dashed #e2e8f0; padding-top: 10px;">
            <span>Montant Total</span>
            <span style="color: #0052cc;">${order.total.toLocaleString()} FCFA</span>
          </div>
        </div>
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} SWEETOS Store. Tous droits réservés.</p>
        <p style="margin: 0;">Boutique d'Équipements et d'Accessoires Premium.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: customerEmail,
      subject: `SWEETOS - Confirmation de votre commande #${order.id} 📦`,
      html
    });
  } catch(e) {
    console.error(`Failed to send order confirmation email to ${customerEmail}:`, e);
  }
}

async function sendOrderDeliveryEmail(order, host) {
  const customerEmail = order.customerEmail || 'guest@sweetos.com';
  const customerName = order.customerName || 'Client';
  const storefrontOrigin = host ? `http://${host}` : 'http://localhost:8080';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #1e293b; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #36b37e; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SWEETOS</h1>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Commande Livrée 🎁</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px; text-align: center;">
        <span style="font-size: 48px; display: block; margin-bottom: 12px;">🎉</span>
        <h2 style="font-size: 20px; margin: 0 0 8px 0; color: #0f172a; font-weight: 800;">Félicitations, votre commande a été livrée !</h2>
        <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 20px 0;">Bonjour <strong>${customerName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.5; color: #475569; margin: 0 0 24px 0;">Votre commande <strong>#${order.id}</strong> a été marquée comme livrée par le livreur ! Pour vous remercier de votre confiance, une **Carte Mystère** exclusive de réduction vous attend sur notre boutique en ligne.</p>
        
        <div>
          <a href="${storefrontOrigin}" style="background-color: #36b37e; color: #ffffff; padding: 14px 28px; border-radius: 12px; font-weight: 800; text-decoration: none; display: inline-block; font-size: 14px; box-shadow: 0 4px 12px rgba(54, 179, 126, 0.25);">Débloquer mon Coupon Mystère 🎁</a>
        </div>
        
        <p style="font-size: 12px; color: #94a3b8; margin: 20px 0 0 0; line-height: 1.5;">Connectez-vous sur la boutique, accédez à l'onglet "Coupons" de votre profil, et grattez la carte pour remporter votre récompense !</p>
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} SWEETOS Store. Tous droits réservés.</p>
        <p style="margin: 0;">Boutique d'Équipements et d'Accessoires Premium.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: customerEmail,
      subject: `SWEETOS - Votre commande #${order.id} a été livrée ! 🎁`,
      html
    });
  } catch(e) {
    console.error(`Failed to send delivery email to ${customerEmail}:`, e);
  }
}

async function sendAdminShortageEmail(message) {
  const adminEmail = process.env.ADMIN_EMAIL || 'nextbigthin256@gmail.com';
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #fff1f2; border-radius: 16px; color: #9f1239; border: 1px solid #fecdd3;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #e11d48; font-size: 24px; margin: 0; font-weight: 800;">🔥 ALERTE ADMIN SWEETOS</h1>
        <p style="color: #be123c; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Rupture de Stock de Coupon</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 24px; border-radius: 12px; border: 1px solid #ffe4e6; margin-bottom: 20px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
        <h2 style="font-size: 16px; margin: 0 0 12px 0; color: #1e293b; font-weight: 800;">Alerte : Rupture de stock de coupon !</h2>
        <p style="font-size: 13.5px; line-height: 1.5; color: #475569; margin: 0 0 16px 0;">Le système de scratchcard a détecté une rupture de coupon template en stock sur le serveur :</p>
        
        <div style="background-color: #fff1f2; padding: 12px 16px; border-radius: 8px; font-size: 13px; color: #9f1239; line-height: 1.5; font-weight: 650; border: 1.5px solid #ffe4e6; margin-bottom: 16px;">
          ${message}
        </div>
        
        <p style="font-size: 13.5px; line-height: 1.5; color: #475569; margin: 0;">
          <strong>Action Recommandée :</strong><br>
          Veuillez vous rendre sur l'<strong>Admin Panel (onglet Marketing / Coupons)</strong>, puis réapprovisionner ou créer à nouveau le coupon demandé.<br><br>
          Une fois que vous l'aurez fait, la compensation s'activera automatiquement : lors du prochain achat du client d'un montant d'au moins <strong>5000 CFA</strong>, il recevra un <strong>coupon doublé</strong> en compensation de cette attente !
        </p>
      </div>
      
      <div style="text-align: center; color: #be123c; font-size: 11px; margin-top: 24px;">
        <p>&copy; ${new Date().getFullYear()} SWEETOS Administration Center.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: adminEmail,
      subject: `🚨 ALERTE SWEETOS - Rupture de coupon détectée`,
      html
    });
  } catch(e) {
    console.error(`Failed to send admin shortage email to ${adminEmail}:`, e);
  }
}

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = server;
