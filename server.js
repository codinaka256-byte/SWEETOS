const http = require('http');
const fs = require('fs');
const path = require('path');
const { sendMail } = require('./utils/mailer');
const db = require('./utils/db');
const webpush = require('web-push');

let vapidKeys = null;
let vapidInitPromise = null;

async function ensureVapidKeys() {
  if (vapidKeys) return vapidKeys;
  if (vapidInitPromise) return vapidInitPromise;
  
  vapidInitPromise = (async () => {
    try {
      if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
        vapidKeys = {
          publicKey: process.env.VAPID_PUBLIC_KEY,
          privateKey: process.env.VAPID_PRIVATE_KEY
        };
        console.log('Loaded Web Push VAPID keys from Environment Variables! 🔑');
      } else {
        const keys = await db.getSetting('vapid_keys', null, 'vapid_keys.js');
        if (keys && keys.publicKey && keys.privateKey) {
          vapidKeys = keys;
        } else {
          vapidKeys = webpush.generateVAPIDKeys();
          await db.saveSetting('vapid_keys', vapidKeys, 'vapid_keys.js', 'vapid_keys');
          console.log('Generated and stored new VAPID keys for Web Push Notifications!');
        }
      }
      
      webpush.setVapidDetails(
        'mailto:support@sweetos.store',
        vapidKeys.publicKey,
        vapidKeys.privateKey
      );
      return vapidKeys;
    } catch(e) {
      console.error('Failed to initialize VAPID keys:', e);
      return null;
    }
  })();
  
  return vapidInitPromise;
}

ensureVapidKeys();

const PORT = 8080;

let clients = [];
const notifiedEvents = new Set();

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

const requestHandler = (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // 1. API: POST /api/products (Save products permanently)
  if (req.method === 'POST' && req.url === '/api/products') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const productsList = JSON.parse(body);
        const success = await db.saveProducts(productsList);
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write products' }));
        } else {
          broadcastAlert('products', 'Product catalog updated.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2z. API: GET /api/config
  if (req.method === 'GET' && req.url === '/api/config') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      googleClientId: process.env.GOOGLE_CLIENT_ID || '181467475891-9q29nqb1g46g51m58b5kbh0j9g5kbh0j.apps.googleusercontent.com'
    }));
    return;
  }

  // 2x. API: POST /api/admin/login (Verify admin credentials securely against Supabase/local settings)
  if (req.method === 'POST' && req.url === '/api/admin/login') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { email, password } = JSON.parse(body);
        if (!email || !password) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing credentials' }));
          return;
        }

        // Get admin credentials from Supabase/local settings
        const creds = await db.getSetting('admin_credentials', {
          email: 'sweeto@sweetohub.com',
          password: 'admin'
        }, 'admin_credentials.js');

        const inputEmail = email.trim().toLowerCase();
        const inputPass = password.trim();

        // Support both plaintext password and secure SHA-256 password hash comparison
        const crypto = require('crypto');
        const inputHash = crypto.createHash('sha256').update(inputPass).digest('hex');
        
        const matchesEmail = inputEmail === creds.email.trim().toLowerCase();
        const matchesPassword = (creds.password && inputPass === creds.password.trim()) ||
                                (creds.passwordHash && inputHash === creds.passwordHash.trim());

        if (matchesEmail && matchesPassword) {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Invalid email address or decryption key' }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2w. API: GET /api/profile
  if (req.method === 'GET' && req.url.startsWith('/api/profile')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const email = urlObj.searchParams.get('email');
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing email parameter' }));
      return;
    }

    db.getProfiles().then(profiles => {
      const profile = profiles[email.toLowerCase()] || null;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ profile }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to retrieve profile' }));
    });
    return;
  }

  // 2u. API: GET /api/vapid-public-key
  if (req.method === 'GET' && req.url === '/api/vapid-public-key') {
    ensureVapidKeys().then(keys => {
      if (keys && keys.publicKey) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ publicKey: keys.publicKey }));
      } else {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'VAPID keys not configured' }));
      }
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error' }));
    });
    return;
  }

  // 2t. API: POST /api/push-subscribe
  if (req.method === 'POST' && req.url === '/api/push-subscribe') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { email, subscription } = JSON.parse(body);
        if (!email || !subscription) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing email or subscription details' }));
          return;
        }

        const subscriptions = await db.getSetting('push_subscriptions', {}, 'push_subscriptions.js');
        const userEmail = email.toLowerCase();
        if (!subscriptions[userEmail]) {
          subscriptions[userEmail] = [];
        }

        const exists = subscriptions[userEmail].some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
          subscriptions[userEmail].push(subscription);
          await db.saveSetting('push_subscriptions', subscriptions, 'push_subscriptions.js', 'push_subscriptions');
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2v. API: POST /api/profile
  if (req.method === 'POST' && req.url === '/api/profile') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        const { email, profileData } = JSON.parse(body);
        if (!email || !profileData) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing email or profileData' }));
          return;
        }

        db.saveProfile(email, profileData).then(() => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }).catch(err => {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to save profile' }));
        });
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2x. API: GET /api/user-sync?email=...
  if (req.method === 'GET' && req.url.startsWith('/api/user-sync')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const email = urlObj.searchParams.get('email');
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing email' }));
      return;
    }
    db.getProfiles().then(profiles => {
      const profile = profiles[email.toLowerCase()] || {};
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        cart: profile.cart || [],
        wishlist: profile.wishlist || [],
        notifications: profile.notifications || null,
        scratchcards: profile.scratchcards || [],
        profile: profile
      }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to retrieve user sync data' }));
    });
    return;
  }

  // 2z. API: POST /api/user-sync
  if (req.method === 'POST' && req.url === '/api/user-sync') {
    let body = '';
    req.on('data', chunk => body += chunk.toString());
    req.on('end', async () => {
      try {
        const { email, type, data } = JSON.parse(body);
        if (!email || !type) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing email or type' }));
          return;
        }
        const profiles = await db.getProfiles();
        const userEmail = email.toLowerCase();
        const profile = profiles[userEmail] || { email: userEmail };
        
        profile[type] = data;
        
        await db.saveProfile(userEmail, profile);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid payload' }));
      }
    });
    return;
  }

  // 2y. API: POST /api/send-notification-email
  if (req.method === 'POST' && req.url === '/api/send-notification-email') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const { email, title, desc } = JSON.parse(body);
        if (!email || !title || !desc) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing required fields' }));
          return;
        }
        await sendNotificationEmail(email, title, desc);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2. API: GET /api/products (Load products directly)
  if (req.method === 'GET' && req.url === '/api/products') {
    db.getProducts().then(products => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(products));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read products' }));
    });
    return;
  }

  // 1b. API: POST /api/categories
  if (req.method === 'POST' && req.url === '/api/categories') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const list = JSON.parse(body);
        const success = await db.saveSetting('categories', list, 'categories.js', 'categories');
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write categories' }));
        } else {
          broadcastAlert('categories', 'Categories list updated.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2b. API: GET /api/categories
  if (req.method === 'GET' && req.url === '/api/categories') {
    db.getSetting('categories', [], 'categories.js').then(categories => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(categories));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read categories' }));
    });
    return;
  }

  // 1c. API: POST /api/brands
  if (req.method === 'POST' && req.url === '/api/brands') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const list = JSON.parse(body);
        const success = await db.saveSetting('brands', list, 'brands.js', 'brands');
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write brands' }));
        } else {
          broadcastAlert('brands', 'Brands list updated.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2c. API: GET /api/brands
  if (req.method === 'GET' && req.url === '/api/brands') {
    db.getSetting('brands', [], 'brands.js').then(brands => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(brands));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read brands' }));
    });
    return;
  }

  // 1d. API: POST /api/reviews
  if (req.method === 'POST' && req.url === '/api/reviews') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const list = JSON.parse(body);
        const success = await db.saveSetting('reviews', list, 'reviews.js', 'reviews');
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write reviews' }));
        } else {
          broadcastAlert('reviews', 'Product reviews updated.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2d. API: GET /api/reviews
  if (req.method === 'GET' && req.url === '/api/reviews') {
    db.getSetting('reviews', [], 'reviews.js').then(reviews => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(reviews));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read reviews' }));
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

  // Secure internal endpoint called by Supabase Edge Functions or Webhooks
  if (req.method === 'POST' && req.url === '/api/internal/webhook-notification') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const secret = req.headers['x-webhook-secret'];
        if (secret !== process.env.WEBHOOK_SECRET) {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Unauthorized' }));
          return;
        }

        const payload = JSON.parse(body);
        
        // Handle orders inserts dynamically from database webhook triggers
        if (payload.table === 'orders' && payload.type === 'INSERT') {
          const newOrd = payload.record ? payload.record.data : null;
          if (newOrd) {
            const eventKey = `placed_${newOrd.id}`;
            if (!notifiedEvents.has(eventKey)) {
              notifiedEvents.add(eventKey);
              // Trigger confirmation email
              sendOrderConfirmationEmail(newOrd, req.headers.host);
              
              // Trigger admin email + push notification
              const adminTitle = `Nouvelle Commande Reçue : #${newOrd.id}`;
              const adminDesc = `Un client vient de passer une commande.<br><br>
                <strong>ID Commande:</strong> #${newOrd.id}<br>
                <strong>Nom:</strong> ${newOrd.customerName || 'Client'}<br>
                <strong>Email:</strong> ${newOrd.customerEmail || ''}<br>
                <strong>Montant Total:</strong> ${parseFloat(newOrd.total).toLocaleString()} CFA<br>
                <strong>Adresse de livraison:</strong> ${newOrd.customerAddress || newOrd.address || 'Non spécifiée'}`;
              sendAdminNotification(adminTitle, adminDesc);
            }
          }
        }
        
        // Handle orders updates dynamically from database webhook triggers (e.g. delivery state transition)
        if (payload.table === 'orders' && payload.type === 'UPDATE') {
          const oldOrd = payload.old_record ? payload.old_record.data : null;
          const newOrd = payload.record ? payload.record.data : null;
          if (newOrd && oldOrd) {
            const oldStatus = oldOrd.status;
            const newStatus = newOrd.status;
            if ((oldStatus !== 'Done' && oldStatus !== 'Livré') && (newStatus === 'Done' || newStatus === 'Livré')) {
              const deliveryKey = `delivered_${newOrd.id}`;
              if (!notifiedEvents.has(deliveryKey)) {
                notifiedEvents.add(deliveryKey);
                sendOrderDeliveryEmail(newOrd, req.headers.host);
              }
            }
          }
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: e.message }));
      }
    });
    return;
  }

  // 1f. API: POST /api/orders
  if (req.method === 'POST' && req.url === '/api/orders') {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', async () => {
      try {
        const input = JSON.parse(body);
        const list = Array.isArray(input) ? input : [input];
        
        // Enforce server-side email format regex validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        for (const order of list) {
          const email = (order.customerEmail || '').trim();
          if (email && !emailRegex.test(email)) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Adresse e-mail invalide : ${email}` }));
            return;
          }
        }
        
        // Load old orders list to compare & merge
        const oldList = await db.getOrders();
        const oldOrders = Array.isArray(oldList) ? oldList : [];

        // Merge orders preserving existing records
        const mergedMap = new Map();
        list.forEach(o => { if (o && o.id) mergedMap.set(String(o.id), o); });
        oldOrders.forEach(o => { if (o && o.id && !mergedMap.has(String(o.id))) mergedMap.set(String(o.id), o); });
        const finalList = Array.from(mergedMap.values());

        const success = await db.saveOrders(finalList);
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write orders' }));
        } else {
          broadcastAlert('orders', 'New order received!');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, count: finalList.length }));

          // Always trigger email & admin push notification (with deduplication)
          try {
            list.forEach(newOrd => {
              const oldMatch = oldList.find(o => o.id === newOrd.id);
              const eventKey = `placed_${newOrd.id}`;
              if (!oldMatch && !notifiedEvents.has(eventKey)) {
                notifiedEvents.add(eventKey);
                // This is a brand new order! Send confirmation email!
                sendOrderConfirmationEmail(newOrd, req.headers.host);
                
                // ALSO notify the admin!
                const adminTitle = `Nouvelle Commande Reçue : #${newOrd.id}`;
                const adminDesc = `Un client vient de passer une commande.<br><br>
                  <strong>ID Commande:</strong> #${newOrd.id}<br>
                  <strong>Nom:</strong> ${newOrd.customerName || 'Client'}<br>
                  <strong>Email:</strong> ${newOrd.customerEmail || ''}<br>
                  <strong>Montant Total:</strong> ${parseFloat(newOrd.total).toLocaleString()} CFA<br>
                  <strong>Adresse de livraison:</strong> ${newOrd.customerAddress || newOrd.address || 'Non spécifiée'}`;
                sendAdminNotification(adminTitle, adminDesc);
              } else if (oldMatch && (oldMatch.status !== 'Done' && oldMatch.status !== 'Livré') && (newOrd.status === 'Done' || newOrd.status === 'Livré')) {
                const deliveryKey = `delivered_${newOrd.id}`;
                if (!notifiedEvents.has(deliveryKey)) {
                  notifiedEvents.add(deliveryKey);
                  sendOrderDeliveryEmail(newOrd, req.headers.host);
                }
              }
            });
          } catch(mailErr) {
            console.error('Email trigger handling failed:', mailErr);
          }
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2f. API: GET /api/orders (optionally filter by email query param)
  if (req.method === 'GET' && req.url.startsWith('/api/orders')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const emailFilter = urlObj.searchParams.get('email');
    
    db.getOrders().then(orders => {
      let result = orders;
      // If email filter is provided, only return orders for that user
      if (emailFilter) {
        const normalizedEmail = emailFilter.toLowerCase();
        result = orders.filter(o => 
          o.customerEmail && o.customerEmail.toLowerCase() === normalizedEmail
        );
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read orders' }));
    });
    return;
  }

  // 2f-user. API: GET /api/user-orders?email=...
  if (req.method === 'GET' && req.url.startsWith('/api/user-orders')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const email = (urlObj.searchParams.get('email') || '').trim().toLowerCase();
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing email parameter', orders: [] }));
      return;
    }

    Promise.all([db.getOrders(), db.getProfiles()]).then(([allOrders, profiles]) => {
      const userOrdersMap = new Map();
      
      // 1. Check all global orders in database matching this email
      if (Array.isArray(allOrders)) {
        allOrders.forEach(o => {
          if (o && o.id && (o.customerEmail || '').trim().toLowerCase() === email) {
            userOrdersMap.set(String(o.id), o);
          }
        });
      }

      // 2. Check user's profile in database
      const profile = profiles[email] || {};
      if (Array.isArray(profile.orders)) {
        profile.orders.forEach(o => {
          if (o && o.id) {
            userOrdersMap.set(String(o.id), o);
          }
        });
      }

      const userOrders = Array.from(userOrdersMap.values());
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ orders: userOrders }));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to fetch user orders', orders: [] }));
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
    req.on('end', async () => {
      try {
        const list = JSON.parse(body);
        const success = await db.saveCoupons(list);
        if (!success) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Failed to write coupons' }));
        } else {
          broadcastAlert('coupons', 'Coupons database updated.');
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true }));
        }
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
      }
    });
    return;
  }

  // 2g. API: GET /api/coupons
  if (req.method === 'GET' && req.url === '/api/coupons') {
    db.getCoupons().then(coupons => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(coupons));
    }).catch(err => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read coupons' }));
    });
    return;
  }

  // 2h. API: GET /api/scratchcards?email=xxx  — fetch user's scratchcards from server
  if (req.method === 'GET' && req.url.startsWith('/api/scratchcards')) {
    const urlObj = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const email = urlObj.searchParams.get('email');
    if (!email) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Missing email' }));
      return;
    }
    db.getProfiles().then(profiles => {
      const profile = profiles[email.toLowerCase()] || {};
      const scratchcards = profile.scratchcards || [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(scratchcards));
    }).catch(() => {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Failed to read scratchcards' }));
    });
    return;
  }

  // 2i. API: POST /api/scratchcards  — save user's scratchcards to server
  if (req.method === 'POST' && req.url === '/api/scratchcards') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const { email, scratchcards } = JSON.parse(body);
        if (!email || !Array.isArray(scratchcards)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Missing email or scratchcards' }));
          return;
        }
        const profiles = await db.getProfiles();
        const key = email.toLowerCase();
        if (!profiles[key]) profiles[key] = {};
        profiles[key].scratchcards = scratchcards;
        await db.saveProfile(key, profiles[key]);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true }));
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Invalid JSON body' }));
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

    fs.readFile(filePath, async (err, data) => {
      if (err) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Server Error');
      } else {
        let responseData = data;
        
        // Dynamic Open Graph tags for product link sharing previews
        if (filePath.endsWith('index.html')) {
          try {
            const queryStr = req.url.split('?')[1];
            const productId = queryStr ? new URLSearchParams(queryStr).get('product') : null;
            if (productId) {
              const products = await db.getProducts();
              const product = products.find(p => p.id === parseInt(productId));
              if (product) {
                let html = data.toString('utf8');
                const dynamicTitle = `${product.name} | SWEETOS`;
                const dynamicDesc = `${parseFloat(product.price).toLocaleString()} CFA - ${product.shortDesc || 'Découvrez ce produit premium sur SWEETOS'}`;
                
                // Get absolute URL components for sharing card
                const protocol = (req.headers['x-forwarded-proto'] || 'https');
                const host = req.headers.host || 'sweeto.store';
                const cleanImgPath = product.image.replace(/^\.\//, '/');
                const ogImage = `${protocol}://${host}${cleanImgPath}`;
                const ogUrl = `${protocol}://${host}/?product=${product.id}`;
                
                const ogTags = `
  <!-- Dynamic Open Graph meta tags for product preview cards -->
  <meta property="og:type" content="product" />
  <meta property="og:title" content="${dynamicTitle}" />
  <meta property="og:description" content="${dynamicDesc}" />
  <meta property="og:image" content="${ogImage}" />
  <meta property="og:url" content="${ogUrl}" />
  <meta property="og:site_name" content="SWEETOS" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${dynamicTitle}" />
  <meta name="twitter:description" content="${dynamicDesc}" />
  <meta name="twitter:image" content="${ogImage}" />
`;
                
                html = html.replace(/<title>.*?<\/title>/i, `<title>${dynamicTitle}</title>`);
                html = html.replace(/<meta name="description" content=".*?">/i, `<meta name="description" content="${dynamicDesc}">`);
                html = html.replace('<head>', `<head>${ogTags}`);
                
                responseData = Buffer.from(html, 'utf8');
              }
            }
          } catch(ogErr) {
            console.error('Failed to inject dynamic OG tags on request:', ogErr);
          }
        }
        
        res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
        res.end(responseData);
      }
    });
  });
}

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

async function sendAdminNotification(title, desc) {
  const adminEmail = process.env.ADMIN_EMAIL || 'nextbigthin256@gmail.com';
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #1e293b; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0052cc; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SWEETOS</h1>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">🚨 ALERTE ADMINISTRATION</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin: 0 0 16px 0; color: #0f172a; font-weight: 800; border-left: 4px solid #0052cc; padding-left: 12px; line-height: 1.2;">
          ${title}
        </h2>
        <div style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
          ${desc}
        </div>
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} SWEETOS Administration Center.</p>
      </div>
    </div>
  `;

  // 1. Email admin
  try {
    await sendMail({
      to: adminEmail,
      subject: `🚨 SWEETOS ADMIN - ${title.replace(/<[^>]*>/g, '')}`,
      html
    });
  } catch (err) {
    console.error(`Failed to send admin email:`, err);
  }

  // 2. Web Push admin
  try {
    const subscriptions = await db.getSetting('push_subscriptions', {}, 'push_subscriptions.js');
    const userEmail = adminEmail.toLowerCase();
    const userSubs = subscriptions[userEmail] || [];
    
    if (userSubs.length > 0) {
      await ensureVapidKeys();
      const payload = JSON.stringify({
        title: `SWEETOS Admin: ${title.replace(/<[^>]*>/g, '')}`,
        body: desc.replace(/<[^>]*>/g, ''),
        url: '/#/admin'
      });
      
      const pushPromises = userSubs.map(sub => 
        webpush.sendNotification(sub, payload)
          .catch(err => {
            console.error('Failed to send web push to admin:', err);
            if (err.statusCode === 410 || err.statusCode === 404) {
              sub.invalid = true;
            }
          })
      );
      
      await Promise.all(pushPromises);
      
      const hasInvalid = userSubs.some(s => s.invalid);
      if (hasInvalid) {
        subscriptions[userEmail] = userSubs.filter(s => !s.invalid);
        await db.saveSetting('push_subscriptions', subscriptions, 'push_subscriptions.js', 'push_subscriptions');
      }
    }
  } catch (err) {
    console.error('Failed to dispatch admin Web Push:', err);
  }
}

async function sendAdminShortageEmail(message) {
  const title = "Rupture de Stock de Coupon";
  const desc = `Le système de scratchcard a détecté une rupture de coupon template en stock sur le serveur :<br><br>${message}`;
  await sendAdminNotification(title, desc);
}

async function sendNotificationEmail(email, title, desc) {
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background-color: #f8fafc; border-radius: 16px; color: #1e293b; border: 1px solid #e2e8f0;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #0052cc; font-size: 28px; margin: 0; font-weight: 800; letter-spacing: -0.5px;">SWEETOS</h1>
        <p style="color: #64748b; font-size: 12px; margin: 4px 0 0 0; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">🔔 Nouvelle Notification</p>
      </div>
      
      <div style="background-color: #ffffff; padding: 32px 24px; border-radius: 12px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
        <h2 style="font-size: 18px; margin: 0 0 16px 0; color: #0f172a; font-weight: 800; border-left: 4px solid #0052cc; padding-left: 12px; line-height: 1.2;">
          ${title}
        </h2>
        <div style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0;">
          ${desc}
        </div>
      </div>
      
      <div style="text-align: center; color: #94a3b8; font-size: 11px; margin-top: 24px;">
        <p style="margin: 0 0 4px 0;">&copy; ${new Date().getFullYear()} SWEETOS Store. Tous droits réservés.</p>
        <p style="margin: 0;">Ce message vous a été envoyé automatiquement suite à une activité sur votre compte.</p>
      </div>
    </div>
  `;

  try {
    await sendMail({
      to: email,
      subject: `🔔 SWEETOS - ${title.replace(/<[^>]*>/g, '')}`,
      html
    });
  } catch (err) {
    console.error(`Failed to send notification email to ${email}:`, err);
  }

  // Asynchronously dispatch Web Push Notification
  try {
    const subscriptions = await db.getSetting('push_subscriptions', {}, 'push_subscriptions.js');
    const userEmail = email.toLowerCase();
    const userSubs = subscriptions[userEmail] || [];
    
    if (userSubs.length > 0) {
      await ensureVapidKeys();
      const payload = JSON.stringify({
        title: title.replace(/<[^>]*>/g, ''), // strip HTML tags
        body: desc.replace(/<[^>]*>/g, ''),
        url: '/#/profile'
      });
      
      const pushPromises = userSubs.map(sub => 
        webpush.sendNotification(sub, payload)
          .catch(err => {
            console.error('Failed to send web push notification:', err);
            // If subscription is expired or unsubscribed, flag for deletion
            if (err.statusCode === 410 || err.statusCode === 404) {
              sub.invalid = true;
            }
          })
      );
      
      await Promise.all(pushPromises);
      
      const hasInvalid = userSubs.some(s => s.invalid);
      if (hasInvalid) {
        subscriptions[userEmail] = userSubs.filter(s => !s.invalid);
        await db.saveSetting('push_subscriptions', subscriptions, 'push_subscriptions.js', 'push_subscriptions');
      }
    }
  } catch (err) {
    console.error('Failed to dispatch Web Push notifications:', err);
  }
}

const server = http.createServer(requestHandler);

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  server.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}

module.exports = requestHandler;
