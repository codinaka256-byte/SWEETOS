import { getProfileStorageKey, formatPrice } from '../../utils/storage.js';

class AccountModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.user = {
      name: "Guest User",
      email: "guest@SWEETOS.com",
      phone: "N/A",
      memberSince: "N/A",
      address: "N/A",
      avatar: "G"
    };
    this.orders = [];
  }

  connectedCallback() {
    this.loadUserData();
    this.render();
    this.setupEventListeners();
  }

  async loadUserData() {
    const loggedIn = localStorage.getItem('SWEETOS_logged_in_user');
    if (loggedIn) {
      try {
        const session = JSON.parse(loggedIn);
        const email = session.email;
        const profileKey = getProfileStorageKey();
        let profile = localStorage.getItem(profileKey);
        
        if (!profile) {
          profile = localStorage.getItem('SWEETOS_user_profile');
        }
        
        // First, try to fetch user's orders from server (for cross-device sync)
        let serverOrders = [];
        try {
          const response = await fetch(`/api/orders?email=${encodeURIComponent(email)}`);
          if (response.ok) {
            const allOrders = await response.json();
            // Filter orders for this specific user
            serverOrders = Array.isArray(allOrders) 
              ? allOrders.filter(o => o.customerEmail && o.customerEmail.toLowerCase() === email.toLowerCase())
              : [];
          }
        } catch (e) {
          console.error('Failed to fetch orders from server:', e);
        }
        
        if (profile) {
          const parsed = JSON.parse(profile);
          this.user = {
            name: `${parsed.firstName || ''} ${parsed.lastName || ''}`.trim() || 'SWEETOS Member',
            email: parsed.email || email,
            phone: parsed.phone || "+225 600 000 000",
            memberSince: "October 2025",
            address: parsed.address || "Ivory Coast",
            avatar: (parsed.firstName && parsed.lastName) ? `${parsed.firstName.charAt(0).toUpperCase()}${parsed.lastName.charAt(0).toUpperCase()}` : 'US'
          };
          
          // Merge local orders with server orders (server is source of truth for cross-device sync)
          const localOrders = parsed.orders || [];
          
          // Combine and deduplicate orders by ID, preferring server data
          const ordersMap = new Map();
          [...serverOrders, ...localOrders].forEach(order => {
            if (order && order.id) {
              ordersMap.set(order.id, order);
            }
          });
          
          this.orders = Array.from(ordersMap.values()).sort((a, b) => {
            // Sort by date (newest first)
            return new Date(b.date || 0) - new Date(a.date || 0);
          });
          
          return;
        } else if (serverOrders.length > 0) {
          // No local profile but have server orders (logged in on new device)
          this.user = {
            name: session.name || 'SWEETOS Member',
            email: email,
            phone: "+225 600 000 000",
            memberSince: "October 2025",
            address: "Ivory Coast",
            avatar: (session.name && session.name.length > 0) ? session.name.charAt(0).toUpperCase() : 'US'
          };
          this.orders = serverOrders;
          return;
        }
      } catch (e) {
        console.error(e);
      }
    }
    
    // Default fallback if not logged in
    this.user = {
      name: "Guest User",
      email: "guest@SWEETOS.com",
      phone: "N/A",
      memberSince: "N/A",
      address: "N/A",
      avatar: "G"
    };
    this.orders = [];
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/Account/AccountModal.css">
      <div class="modal-overlay ${this.isOpen ? 'open' : ''}" id="overlay">
        <div class="modal-container glass-panel">
          <button class="close-btn" id="close-btn" aria-label="Close Profile">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
          
          <div class="profile-layout">
            <!-- Left Panel: User Card -->
            <div class="user-card-panel">
              <div class="avatar-large">
                <span class="avatar-letters" style="color: #0052cc; font-size: 20px; font-weight: 800;">${this.user.avatar}</span>
              </div>
              <h3 class="user-fullname">${this.user.name}</h3>
              <p class="user-membership">Premium VIP Member</p>
              
              <div class="user-meta-details">
                <div class="meta-row">
                  <span class="label">Email</span>
                  <span class="value">${this.user.email}</span>
                </div>
                <div class="meta-row">
                  <span class="label">Phone</span>
                  <span class="value">${this.user.phone}</span>
                </div>
                <div class="meta-row">
                  <span class="label">Address</span>
                  <span class="value">${this.user.address}</span>
                </div>
              </div>
              
              <button class="logout-btn" id="logout-btn">Log Out</button>
            </div>
            
            <!-- Right Panel: Order History -->
            <div class="orders-panel">
              <h3 class="panel-title">Order History</h3>
              <div class="orders-list">
                ${this.orders.length === 0 ? `
                  <p class="no-orders">You haven't placed any orders yet.</p>
                ` : this.orders.map(order => `
                  <div class="order-item glass-panel">
                    <div class="order-header">
                      <span class="order-id">${order.id}</span>
                      <span class="order-status delivered">${order.status}</span>
                    </div>
                    <div class="order-details-row">
                      <span class="order-product">${order.items}</span>
                      <span class="order-price">${formatPrice(Number(order.total))}</span>
                    </div>
                    <div class="order-date">${order.date}</div>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.attachDynamicListeners();
  }

  setupEventListeners() {
    window.addEventListener('account:toggle', async () => {
      this.isOpen = !this.isOpen;
      await this.loadUserData();
      this.render();
      this.updateState();
    });

    window.addEventListener('orders:updated', async () => {
      await this.loadUserData();
      if (this.isOpen) {
        this.render();
      }
    });
    
    // Listen for auth changes to reload user data when logging in/out
    window.addEventListener('auth:changed', async () => {
      await this.loadUserData();
      if (this.isOpen) {
        this.render();
      }
    });
  }

  attachDynamicListeners() {
    const shadow = this.shadowRoot;
    
    // Close button
    const closeBtn = shadow.getElementById('close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.isOpen = false;
        this.updateState();
      });
    }

    // Overlay click close
    const overlay = shadow.getElementById('overlay');
    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.isOpen = false;
          this.updateState();
        }
      });
    }

    // Logout click trigger
    const logoutBtn = shadow.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        // Clear active session
        localStorage.removeItem('SWEETOS_logged_in_user');
        localStorage.removeItem('SWEETOS_user_profile');
        
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: false } }));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Logged out successfully.' }));
        
        this.isOpen = false;
        this.updateState();
      });
    }
  }

  updateState() {
    const overlay = this.shadowRoot.getElementById('overlay');
    if (overlay) {
      if (this.isOpen) {
        overlay.classList.add('open');
      } else {
        overlay.classList.remove('open');
      }
    }
  }
}

customElements.define('account-modal', AccountModal);
export default AccountModal;
