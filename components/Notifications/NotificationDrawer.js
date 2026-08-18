import { getNotificationsStorageKey } from '../../utils/storage.js';

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
          title: `Welcome, ${userName}! 🎉`,
          desc: 'Use coupon code WELCOME10 at checkout to save 10% on your first premium desk setup accessories order.',
          time: 'Just now',
          unread: true
        },
        {
          id: 2,
          type: 'shipping',
          icon: '📦',
          title: 'SWEETOS Order Tracker Active',
          desc: 'Get live shipping updates, packaging tracking codes, and delivery notifications right here in your dashboard.',
          time: '1 day ago',
          unread: false
        },
        {
          id: 3,
          type: 'system',
          icon: '🛡ï¸',
          title: 'Account Protected',
          desc: 'Your shipping address, orders database, and credentials are encrypted and isolated to keep your profile secure.',
          time: '3 days ago',
          unread: false
        }
      ];
      localStorage.setItem(key, JSON.stringify(this.notifications));
    }
    const totalUnread = this.notifications.filter(n => n.unread).length;
    window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: totalUnread }));
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
                <p class="notif-desc">${n.desc}</p>
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

    window.addEventListener('auth:changed', () => {
      this.loadNotifications();
      this.render();
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
        if (target && target.unread) {
          target.unread = false;
          this.saveNotifications();
          item.classList.remove('unread-flag');
          this.render(); 
          window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: this.notifications.filter(n => n.unread).length }));
        }
      });
    });
  }
}

customElements.define('notification-drawer', NotificationDrawer);
export default NotificationDrawer;
