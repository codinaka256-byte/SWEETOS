export function getCartStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_cart_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_cart_guest';
}

export function getProfileStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_user_profile_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_user_profile_guest';
}

export function getNotificationsStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_notifications_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_notifications_guest';
}

export function getWishlistStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_wishlist_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_wishlist_guest';
}

export function getScratchcardsStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_user_scratchcards_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_user_scratchcards_guest';
}

export function getProcessedDeliveriesStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_processed_deliveries_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_processed_deliveries_guest';
}

export function getActivityLogsStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_activity_logs_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_activity_logs_guest';
}

export function formatPrice(price) {
  const currency = localStorage.getItem('SWEETOS_currency') || 'CFA';
  let symbol = currency;
  if (currency === 'USD') symbol = '$';
  else if (currency === 'EUR') symbol = '€';
  else if (currency === 'CFA' || currency === 'XOF' || currency === 'FCFA') symbol = 'FCFA';
  
  if (symbol === '$' || symbol === '€') {
    return `${symbol}${Math.round(price).toLocaleString()}`;
  }
  return `${Math.round(price).toLocaleString()} ${symbol}`;
}

export function syncDeliveredNotifications() {
  const profileKey = getProfileStorageKey();
  const profileJson = localStorage.getItem(profileKey) || localStorage.getItem('SWEETOS_user_profile');
  if (!profileJson) return;
  
  let profile = {};
  try {
    profile = JSON.parse(profileJson);
  } catch(e) {
    return;
  }
  
  const userEmail = profile.email;
  if (!userEmail) return;
  
  fetch('/api/orders')
    .then(res => res.json())
    .then(serverOrders => {
      if (!Array.isArray(serverOrders)) return;
      
      let processedDeliveries = [];
      const procKey = getProcessedDeliveriesStorageKey();
      try {
        processedDeliveries = JSON.parse(localStorage.getItem(procKey) || '[]');
      } catch(e) {}
      
      const notifKey = getNotificationsStorageKey();
      let customerNotifs = [];
      try {
        customerNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
      } catch(e) {}
      
      let changed = false;
      
      serverOrders.forEach(order => {
        // Only process orders belonging to this customer that are completed (Done/Livré)
        const isCompleted = order.status === 'Done' || order.status === 'Livré';
        if (order.customerEmail === userEmail && isCompleted) {
          if (!processedDeliveries.includes(order.id)) {
            processedDeliveries.push(order.id);
            
            const currentHour = new Date().getHours();
            let greeting = 'Bonjour';
            if (currentHour >= 12 && currentHour < 18) {
              greeting = 'Bon après-midi';
            } else if (currentHour >= 18) {
              greeting = 'Bonsoir';
            }
            
            const totalCFA = parseFloat(order.total) || 0;
            
            // 1. Generate Delivered Notification
            const notifTitle = `Commande #${order.id} livrée !`;
            const notifDesc = `${greeting} ! Merci infiniment pour votre achat chez SWEETOS. Votre commande #${order.id} a été livrée avec succès.<br>
              <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                <button class="download-receipt-btn" data-order-id="${order.id}" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Reçu 📄</button>
                ${totalCFA >= 2000 ? `<button class="view-mystery-email-btn" data-order-id="${order.id}" style="background:#ff5630; color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Mystery Box 🎁</button>` : ''}
              </div>`;
            addCustomerNotification('shipping', '✅', notifTitle, notifDesc);
            
            // 2. Generate Scratchcard and Email notification if total >= 2000 CFA
            if (totalCFA >= 2000) {
              // Add a scratch card to storage
              try {
                const scKey = getScratchcardsStorageKey();
                let scratchcards = JSON.parse(localStorage.getItem(scKey) || '[]');
                if (!scratchcards.some(sc => sc.orderId === order.id)) {
                  scratchcards.push({
                    id: Date.now() + Math.floor(Math.random() * 1000) + 1,
                    orderId: order.id,
                    amount: totalCFA,
                    scratched: false,
                    couponWon: null,
                    createdAt: Date.now(),
                    expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
                  });
                  localStorage.setItem(scKey, JSON.stringify(scratchcards));
                }
              } catch(e) {
                console.error('Failed to create scratchcard during sync:', e);
              }
              
              // Push simulated email notification
              const emailTitle = `Nouveau Message: Votre Boîte Mystère`;
              const emailDesc = `Vous avez reçu un e-mail concernant votre Boîte Mystère de la commande #${order.id}.<br>
                <div style="margin-top:8px;">
                  <button class="open-email-modal-btn" data-order-id="${order.id}" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Ouvrir l'E-mail 📩</button>
                </div>`;
              addCustomerNotification('email', '📧', emailTitle, emailDesc);
            }
            
            changed = true;
          }
        }
      });
      
      if (changed) {
        localStorage.setItem(procKey, JSON.stringify(processedDeliveries));
      }
    })
    .catch(err => console.error('Failed to sync completed notifications from server:', err));
}

export function addCustomerNotification(type, icon, title, desc) {
  const loggedInJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (!loggedInJson) return;
  
  let email = '';
  try {
    const userObj = JSON.parse(loggedInJson);
    email = userObj.email;
  } catch(e) {
    return;
  }
  if (!email) return;

  const key = getNotificationsStorageKey();
  let notifs = [];
  try {
    notifs = JSON.parse(localStorage.getItem(key) || '[]');
  } catch(e) {}

  // Check for duplicate triggers in last 5 seconds to prevent spam
  const isDuplicate = notifs.some(n => n.title === title && n.desc === desc && (Date.now() - n.id < 5000));
  if (isDuplicate) return;

  notifs.unshift({
    id: Date.now() + Math.floor(Math.random() * 1000),
    type,
    icon,
    title,
    desc,
    time: 'Just now',
    unread: true
  });
  localStorage.setItem(key, JSON.stringify(notifs));
  
  window.dispatchEvent(new CustomEvent('notifications:updated'));
  const totalUnread = notifs.filter(n => n.unread).length;
  window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: totalUnread }));

  // Send real email in the background!
  fetch('/api/send-notification-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, title, desc })
  }).catch(err => console.error('Failed to send notification email:', err));
}
