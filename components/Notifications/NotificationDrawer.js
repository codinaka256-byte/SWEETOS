import { getNotificationsStorageKey, getScratchcardsStorageKey, syncDeliveredNotifications } from '../../utils/storage.js';

class NotificationDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.notifications = [];
  }

  connectedCallback() {
    this.loadNotifications();
    this.render();
    this.setupEventListeners();
    syncDeliveredNotifications();
  }

  loadNotifications() {
    const key = getNotificationsStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.notifications = JSON.parse(saved);
      } catch (e) {
        this.notifications = [];
      }
    } else {
      // Default Seed Notifications with personalization
      const loggedIn = localStorage.getItem('SWEETOS_logged_in_user');
      let userName = "Guest User";
      if (loggedIn) {
        try {
          const userObj = JSON.parse(loggedIn);
          const email = userObj.email;
          const safeKey = email.replace(/[^a-zA-Z0-9]/g, '_');
          const profileSaved = localStorage.getItem(`SWEETOS_user_profile_${safeKey}`);
          if (profileSaved) {
            const parsed = JSON.parse(profileSaved);
            userName = parsed.firstName || userName;
          }
        } catch (e) {}
      }

      this.notifications = [
        {
          id: 1,
          type: 'promo',
          icon: '🎁',
          title: `Welcome to SWEETOS! 🎉`,
          desc: `Welcome to SWEETOS!`,
          time: 'Just now',
          unread: true
        }
      ];
      localStorage.setItem(key, JSON.stringify(this.notifications));
    }
    this.generateExpiringReminders();
    const totalUnread = this.notifications.filter(n => n.unread).length;
    window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: totalUnread }));
  }

  generateExpiringReminders() {
    let scratchcards = [];
    try {
      const scKey = getScratchcardsStorageKey();
      scratchcards = JSON.parse(localStorage.getItem(scKey) || '[]');
    } catch(e) {}
    
    const now = Date.now();
    let updated = false;
    
    scratchcards.forEach(card => {
      if (!card.scratched && card.expiresAt) {
        const diffMs = card.expiresAt - now;
        const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        
        if (daysRemaining > 0 && daysRemaining <= 14) {
          const uniqueId = `reminder-mystery-${card.id}-${daysRemaining}`;
          if (!this.notifications.some(n => n.uniqueKey === uniqueId)) {
            this.notifications.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              uniqueKey: uniqueId,
              type: 'promo',
              icon: '⏰',
              title: `Rappel: Boîte Mystère expire dans ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''}! 🎁`,
              desc: `Votre boîte mystère de la commande #${card.orderId} va bientôt expirer. Grattez-la maintenant pour découvrir votre offre !`,
              time: 'Just now',
              unread: true
            });
            updated = true;
          }
        }
      }
    });

    let coupons = [];
    try {
      coupons = JSON.parse(localStorage.getItem('SWEETOS_coupons') || '[]');
    } catch(e) {}
    
    coupons.forEach(c => {
      const isWonCoupon = c.code.startsWith('LOYAL') || c.code.startsWith('SAVE');
      if (isWonCoupon && c.status === 'active' && c.expiry) {
        const expiryTime = new Date(c.expiry).getTime() + (24 * 60 * 60 * 1000) - 1000;
        const diffMs = expiryTime - now;
        const daysRemaining = Math.ceil(diffMs / (24 * 60 * 60 * 1000));
        
        if (daysRemaining > 0 && daysRemaining <= 7) {
          const uniqueId = `reminder-coupon-${c.code}-${daysRemaining}`;
          if (!this.notifications.some(n => n.uniqueKey === uniqueId)) {
            this.notifications.unshift({
              id: Date.now() + Math.floor(Math.random() * 1000),
              uniqueKey: uniqueId,
              type: 'promo',
              icon: '⏰',
              title: `Rappel Coupon: ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}! 🎟️`,
              desc: `Votre coupon de réduction exclusif ${c.code} (${c.value}% OFF) expire bientôt. Utilisez-le vite à la caisse !`,
              time: 'Just now',
              unread: true
            });
            updated = true;
          }
        }
      }
    });
    
    if (updated) {
      this.saveNotifications();
    }
  }

  saveNotifications() {
    const key = getNotificationsStorageKey();
    localStorage.setItem(key, JSON.stringify(this.notifications));
  }

  render() {
    // 1. Ensure stylesheet link is injected exactly once to prevent layout style drops on re-renders
    if (!this.shadowRoot.querySelector('link[href*="NotificationDrawer.css"]')) {
      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = './components/Notifications/NotificationDrawer.css';
      this.shadowRoot.appendChild(cssLink);
    }

    // 2. Ensure wrapper container exists
    let container = this.shadowRoot.querySelector('.drawer-container-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.className = 'drawer-container-wrapper';
      container.style.height = '100%';
      this.shadowRoot.appendChild(container);
    }

    const totalUnread = this.notifications.filter(n => n.unread).length;

    container.innerHTML = `
      <div class="notifications-wrapper">
        <!-- Swipe handle indicator for mobile -->
        <div class="drawer-swipe-handle"></div>
        <!-- Header -->
        <div class="notifications-header">
          <h3>Notifications Hub ${totalUnread > 0 ? `(<span class="unread-count">${totalUnread}</span>)` : ''}</h3>
          <button class="notif-close" id="notifCloseBtn" title="Close Hub">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 15px; height: 15px; flex-shrink: 0; display: inline-block;">
              <line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <!-- Scrollable Notifications Listing -->
        <div class="notifications-list" id="notifList">
          ${this.notifications.length === 0 ? `
            <div class="empty-state">
              <div class="empty-bell">🔔</div>
              <p class="empty-title">All quiet in the studio</p>
              <p class="empty-desc">You're completely up to date. We'll alert you here when new setup codes or delivery reports arrive.</p>
            </div>
          ` : this.notifications.map((n, idx) => `
            <div class="notif-item ${n.unread ? 'unread-flag' : ''}" data-id="${n.id}">
              <div class="notif-icon-circle ${n.type}">
                ${n.icon}
              </div>
              <div class="notif-info">
                <div class="notif-title-row">
                  <h4>${n.title}</h4>
                  <span class="notif-time">${n.time}</span>
                </div>
                <div class="notif-desc" style="font-size: 12px; color: var(--text-gray); line-height: 1.5; margin-top: 4px;">${n.desc}</div>
              </div>
              <button class="notif-delete-btn" data-id="${n.id}" title="Delete Alert">×</button>
            </div>
          `).join('')}
        </div>

        <!-- Footer actions -->
        ${this.notifications.length > 0 ? `
          <div class="notifications-footer">
            <button class="clear-all-btn" id="notifClearAllBtn">Clear All Notifications</button>
          </div>
        ` : ''}
      </div>
    `;

    this.attachDynamicListeners();
  }

  setupEventListeners() {
    window.addEventListener('notifications:updated', () => {
      this.loadNotifications();
      this.render();
    });

    window.addEventListener('notifications:toggle', () => {
      syncDeliveredNotifications();
    });

    window.addEventListener('auth:changed', () => {
      this.loadNotifications();
      this.render();
    });

    window.addEventListener('storage', (e) => {
      const key = getNotificationsStorageKey();
      if (e.key === key) {
        this.loadNotifications();
        this.render();
      }
    });
  }

  attachDynamicListeners() {
    const shadow = this.shadowRoot;

    shadow.getElementById('notifCloseBtn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('notifications:toggle', { detail: { open: false } }));
    });

    const clearBtn = shadow.getElementById('notifClearAllBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        this.notifications = [];
        this.saveNotifications();
        this.render();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Cleared all alerts.' }));
        window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: 0 }));
      });
    }

    shadow.querySelectorAll('.notif-delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.getAttribute('data-id'));
        this.notifications = this.notifications.filter(n => n.id !== id);
        this.saveNotifications();
        this.render();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Deleted alert.' }));
        window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: this.notifications.filter(n => n.unread).length }));
      });
    });

    shadow.querySelectorAll('.notif-item').forEach(item => {
      item.addEventListener('click', () => {
        const id = parseInt(item.getAttribute('data-id'));
        const target = this.notifications.find(n => n.id === id);
        if (!target) return;

        // 1. Mark as read
        if (target.unread) {
          target.unread = false;
          this.saveNotifications();
          item.classList.remove('unread-flag');
          window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: this.notifications.filter(n => n.unread).length }));
        }

        // 2. Close notification drawer
        window.dispatchEvent(new CustomEvent('notifications:toggle', { detail: { open: false } }));

        // 3. Handle page routing / actions
        if (target.type === 'promo') {
          if (target.uniqueKey && target.uniqueKey.startsWith('reminder-')) {
            window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'coupons' } }));
          } else {
            navigator.clipboard.writeText('WELCOME10').then(() => {
              window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Promo code WELCOME10 copied to clipboard! 🎟️' }));
            }).catch(() => {});
            window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'home' } }));
          }
        } else if (target.type === 'shipping') {
          window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'orders' } }));
        } else if (target.type === 'system') {
          window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'profile' } }));
        } else if (target.type === 'email') {
          const parts = target.desc.match(/#([a-zA-Z0-9_-]+)/);
          const orderId = parts ? parts[1] : '';
          this.handleOpenEmailModal(orderId);
        }

        this.render();
      });
    });

    // Custom Button Listeners inside notifications
    shadow.querySelectorAll('.download-receipt-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        this.downloadReceipt(orderId);
      });
    });

    shadow.querySelectorAll('.view-mystery-email-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('notifications:toggle', { detail: { open: false } }));
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'coupons' } }));
      });
    });

    shadow.querySelectorAll('.open-email-modal-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const orderId = btn.getAttribute('data-order-id');
        this.handleOpenEmailModal(orderId);
      });
    });
  }

  handleOpenEmailModal(orderId) {
    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem('SWEETOS_all_orders') || '[]');
    } catch(e) {}
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Order details not found!' }));
      return;
    }
    const currentHour = new Date().getHours();
    let greeting = 'Bonjour';
    if (currentHour >= 12 && currentHour < 18) {
      greeting = 'Bon après-midi';
    } else if (currentHour >= 18) {
      greeting = 'Bonsoir';
    }
    this.openMockEmailModal(order, greeting);
  }

  downloadReceipt(orderId) {
    let orders = [];
    try {
      orders = JSON.parse(localStorage.getItem('SWEETOS_all_orders') || '[]');
    } catch(e) {}
    const order = orders.find(o => o.id === orderId);
    if (!order) {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Commande introuvable / Order not found!' }));
      return;
    }
    
    const receiptContent = `
========================================
             RECEIPT / REÇU
                SWEETOS
========================================
ID Commande: ${order.id}
Date: ${order.date}
Client: ${order.customerName}
E-mail: ${order.customerEmail}
Téléphone: ${order.customerPhone}
Adresse: ${order.customerAddress}

Articles commandés:
${order.products ? order.products.map(p => `- ${p.name} (x${p.quantity}) : ${p.price * p.quantity} CFA`).join('\n') : order.items}

Total: ${order.total} CFA
Mode de paiement: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}
Statut de livraison: ${order.status}
========================================
Merci infiniment pour votre achat chez SWEETOS !
   `.trim();

    const blob = new Blob([receiptContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reçu-sweetos-${orderId}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Reçu téléchargé ! 📄' }));
  }

  openMockEmailModal(order, greeting) {
    const shadow = this.shadowRoot;
    let modal = shadow.getElementById('mock-email-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'mock-email-modal';
      modal.style.position = 'fixed';
      modal.style.top = '0';
      modal.style.left = '0';
      modal.style.width = '100%';
      modal.style.height = '100%';
      modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
      modal.style.zIndex = '9999';
      modal.style.display = 'flex';
      modal.style.alignItems = 'center';
      modal.style.justifyContent = 'center';
      modal.style.backdropFilter = 'blur(4px)';
      shadow.appendChild(modal);
    }
    
    modal.innerHTML = `
      <div style="background: white; border-radius: 24px; width: 90%; max-width: 500px; padding: 35px; box-shadow: 0 20px 50px rgba(0,0,0,0.15); font-family: 'Inter', sans-serif; position: relative; border: 1.5px solid var(--border); box-sizing: border-box; text-align: center;">
        <button id="close-email-modal" style="position: absolute; top: 20px; right: 20px; background: none; border: none; font-size: 28px; cursor: pointer; color: var(--text-gray); font-weight: bold; line-height: 1; transition: color 0.2s;">&times;</button>
        
        <div style="border-bottom: 1.5px solid var(--border); padding-bottom: 20px; margin-bottom: 24px; text-align: left; display: flex; justify-content: space-between; align-items: center; box-sizing: border-box;">
          <div>
            <span style="font-size: 11px; text-transform: uppercase; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Nouveau Message</span>
            <span style="font-size: 13.5px; color: var(--text-dark); font-weight: 600;">De: <strong>rewards@sweetos.com</strong></span>
          </div>
          <span style="font-size: 24px;">📧</span>
        </div>
        
        <div style="color: var(--text-dark); display: flex; flex-direction: column; gap: 16px; align-items: center; text-align: left;">
          <h2 style="font-size: 22px; font-weight: 900; margin: 0; color: var(--primary); letter-spacing: -0.5px; text-align: center; width: 100%;">🎁 Votre Boîte Mystère est prête !</h2>
          
          <p style="font-size: 14.5px; line-height: 1.6; margin: 0; color: var(--text-dark); width: 100%;">
            ${greeting} !<br><br>
            Merci infiniment pour votre commande <strong>#${order.id}</strong> sur <strong>SWEETOS</strong>.<br>
            Nous sommes ravis que vos articles aient été livrés avec succès.
          </p>
          
          <div style="font-size: 72px; margin: 15px 0; text-align: center; width: 100%;">🎁</div>
          
          <p style="font-size: 13.5px; color: var(--text-gray); margin: 0; font-weight: 600; text-align: center; width: 100%;">
            Pour vous remercier de votre fidélité, nous vous offrons une chance de gagner un coupon de réduction exclusif !
          </p>
          
          <button id="open-scratchcard-btn" style="background: var(--primary); color: white; border: none; padding: 14px 28px; border-radius: 12px; font-size: 14px; font-weight: 850; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px var(--primary-light); width: 100%; display: block; box-sizing: border-box; text-align: center;">
            Gratter ma Boîte Mystère →
          </button>
        </div>
      </div>
    `;
    
    modal.querySelector('#close-email-modal').addEventListener('click', () => {
      modal.remove();
    });
    
    modal.querySelector('#open-scratchcard-btn').addEventListener('click', () => {
      modal.remove();
      window.dispatchEvent(new CustomEvent('notifications:toggle', { detail: { open: false } }));
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'coupons' } }));
    });
  }
}

customElements.define('notification-drawer', NotificationDrawer);
export default NotificationDrawer;
