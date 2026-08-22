import { formatPrice } from '../../utils/storage.js';
import products from '../../data/products.js';
import categories from '../../data/categories.js';
import brands from '../../data/brands.js';
import orders from '../../data/orders.js';
import { renderAdminSidebar, attachAdminSidebarListeners } from './AdminSidebar.js';
import { renderAdminHeader, attachAdminHeaderListeners } from './AdminHeader.js';
import { renderAdminDashboard, attachAdminDashboardListeners } from './AdminDashboard.js';
import { renderAdminProducts, attachAdminProductsListeners } from './AdminProducts.js';
import { renderAdminOrders, attachAdminOrdersListeners } from './AdminOrders.js';
import { renderAdminCustomers, attachAdminCustomersListeners } from './AdminCustomers.js';
import { renderAdminInventory, attachAdminInventoryListeners } from './AdminInventory.js';
import { renderAdminCoupons, attachAdminCouponsListeners } from './AdminCoupons.js';
import { renderAdminAnalytics, attachAdminAnalyticsListeners } from './AdminAnalytics.js';
import { renderAdminSettings, attachAdminSettingsListeners } from './AdminSettings.js';
import { renderAdminSections, attachAdminSectionsListeners } from './AdminSections.js';
import { renderAdminReviews, attachAdminReviewsListeners } from './AdminReviews.js';

window.showConfirm = function(message, title = 'Confirm Action') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.webkitBackdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = "'Outfit', sans-serif";
    overlay.style.padding = '20px';
    overlay.style.animation = 'confirm-fade-in 0.25s ease';

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes confirm-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes confirm-scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .confirm-btn-primary {
        background: #ef4444;
        color: white;
        border: none;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .confirm-btn-primary:hover {
        background: #dc2626;
        box-shadow: 0 4px 12px rgba(239, 68, 68, 0.2);
        transform: translateY(-1px);
      }
      .confirm-btn-secondary {
        background: #f8fafc;
        color: #475569;
        border: 1.5px solid #e2e8f0;
        padding: 10px 20px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .confirm-btn-secondary:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        transform: translateY(-1px);
      }
    `;
    overlay.appendChild(styleTag);

    const dialog = document.createElement('div');
    dialog.style.background = 'rgba(255, 255, 255, 0.95)';
    dialog.style.border = '1.5px solid rgba(255, 255, 255, 0.8)';
    dialog.style.boxShadow = '0 25px 50px -12px rgba(15, 23, 42, 0.15)';
    dialog.style.borderRadius = '24px';
    dialog.style.padding = '32px';
    dialog.style.width = '100%';
    dialog.style.maxWidth = '420px';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.gap = '20px';
    dialog.style.animation = 'confirm-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    // Icon & Header
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.gap = '16px';

    const iconBox = document.createElement('div');
    iconBox.style.fontSize = '24px';
    iconBox.style.background = 'rgba(239, 68, 68, 0.08)';
    iconBox.style.color = '#ef4444';
    iconBox.style.width = '48px';
    iconBox.style.height = '48px';
    iconBox.style.borderRadius = '50%';
    iconBox.style.display = 'flex';
    iconBox.style.alignItems = 'center';
    iconBox.style.justifyContent = 'center';
    iconBox.textContent = '⚠️';

    const titleEl = document.createElement('h3');
    titleEl.style.margin = '0';
    titleEl.style.fontSize = '18.5px';
    titleEl.style.fontWeight = '800';
    titleEl.style.color = '#0f172a';
    titleEl.textContent = title;

    headerRow.appendChild(iconBox);
    headerRow.appendChild(titleEl);

    // Message
    const msgEl = document.createElement('p');
    msgEl.style.margin = '0';
    msgEl.style.fontSize = '14.5px';
    msgEl.style.color = '#64748b';
    msgEl.style.lineHeight = '1.6';
    msgEl.textContent = message;

    // Action buttons row
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.gap = '12px';
    btnRow.style.marginTop = '8px';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'confirm-btn-secondary';
    cancelBtn.textContent = 'Cancel';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'confirm-btn-primary';
    confirmBtn.textContent = 'Confirm';

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(confirmBtn);

    dialog.appendChild(headerRow);
    dialog.appendChild(msgEl);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);

    const cleanup = (value) => {
      overlay.style.animation = 'confirm-fade-in 0.2s ease reverse';
      dialog.style.animation = 'confirm-scale-in 0.2s ease reverse';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve(value);
      }, 180);
    };

    confirmBtn.addEventListener('click', () => cleanup(true));
    cancelBtn.addEventListener('click', () => cleanup(false));
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });

    document.body.appendChild(overlay);
  });
};

window.showAlert = function(message, title = 'Attention Required') {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(15, 23, 42, 0.45)';
    overlay.style.backdropFilter = 'blur(10px)';
    overlay.style.webkitBackdropFilter = 'blur(10px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = "'Outfit', sans-serif";
    overlay.style.padding = '20px';
    overlay.style.animation = 'confirm-fade-in 0.25s ease';

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes confirm-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes confirm-scale-in {
        from { transform: scale(0.95); opacity: 0; }
        to { transform: scale(1); opacity: 1; }
      }
      .alert-btn-primary {
        background: #0052cc;
        color: white;
        border: none;
        padding: 10px 24px;
        border-radius: 10px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .alert-btn-primary:hover {
        background: #0040a3;
        box-shadow: 0 4px 12px rgba(0, 82, 204, 0.2);
        transform: translateY(-1px);
      }
    `;
    overlay.appendChild(styleTag);

    const dialog = document.createElement('div');
    dialog.style.background = 'rgba(255, 255, 255, 0.95)';
    dialog.style.border = '1.5px solid rgba(255, 255, 255, 0.8)';
    dialog.style.boxShadow = '0 25px 50px -12px rgba(15, 23, 42, 0.15)';
    dialog.style.borderRadius = '24px';
    dialog.style.padding = '32px';
    dialog.style.width = '100%';
    dialog.style.maxWidth = '420px';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.gap = '20px';
    dialog.style.animation = 'confirm-scale-in 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';

    // Icon & Header
    const headerRow = document.createElement('div');
    headerRow.style.display = 'flex';
    headerRow.style.alignItems = 'center';
    headerRow.style.gap = '16px';

    const iconBox = document.createElement('div');
    iconBox.style.fontSize = '24px';
    iconBox.style.background = 'rgba(0, 82, 204, 0.08)';
    iconBox.style.color = '#0052cc';
    iconBox.style.width = '48px';
    iconBox.style.height = '48px';
    iconBox.style.borderRadius = '50%';
    iconBox.style.display = 'flex';
    iconBox.style.alignItems = 'center';
    iconBox.style.justifyContent = 'center';
    iconBox.textContent = 'ℹ️';

    const titleEl = document.createElement('h3');
    titleEl.style.margin = '0';
    titleEl.style.fontSize = '18.5px';
    titleEl.style.fontWeight = '800';
    titleEl.style.color = '#0f172a';
    titleEl.textContent = title;

    headerRow.appendChild(iconBox);
    headerRow.appendChild(titleEl);

    // Message
    const msgEl = document.createElement('p');
    msgEl.style.margin = '0';
    msgEl.style.fontSize = '14.5px';
    msgEl.style.color = '#64748b';
    msgEl.style.lineHeight = '1.6';
    msgEl.textContent = message;

    // Action buttons row
    const btnRow = document.createElement('div');
    btnRow.style.display = 'flex';
    btnRow.style.justifyContent = 'flex-end';
    btnRow.style.gap = '12px';
    btnRow.style.marginTop = '8px';

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'alert-btn-primary';
    confirmBtn.textContent = 'OK';

    btnRow.appendChild(confirmBtn);

    dialog.appendChild(headerRow);
    dialog.appendChild(msgEl);
    dialog.appendChild(btnRow);
    overlay.appendChild(dialog);

    const cleanup = () => {
      overlay.style.animation = 'confirm-fade-in 0.2s ease reverse';
      dialog.style.animation = 'confirm-scale-in 0.2s ease reverse';
      setTimeout(() => {
        if (overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
        resolve();
      }, 180);
    };

    confirmBtn.addEventListener('click', () => cleanup());
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup();
    });

    document.body.appendChild(overlay);
  });
};

class AdminPage extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Auth state
    this.isAuthenticated = sessionStorage.getItem('SWEETOS_admin_authenticated') === 'true';
    
    // View state
    this.currentTab = sessionStorage.getItem('SWEETOS_admin_current_tab') || 'dashboard';
    this.settingsSubTab = sessionStorage.getItem('SWEETOS_admin_settings_subtab') || 'general';
    this.sidebarCollapsed = sessionStorage.getItem('SWEETOS_admin_sidebar_collapsed') === 'true';
    
    // Filter & Search states
    this.searchQueries = {
      dashboard: '',
      products: '',
      orders: '',
      customers: '',
      reviews: '',
      inventory: '',
      sections: '',
      coupons: '',
      analytics: '',
      settings: ''
    };
    this.categoryFilter = 'All';
    this.statusFilter = 'All';
    this.stockFilter = 'All';
    this.currentPageIndex = 1;
    this.itemsPerPage = 10;
    
    // Order states
    this.selectedOrderId = null;
    
    // Customer states
    this.selectedCustomerEmail = null;
    
    // CRUD Modals
    this.showProductModal = false;
    this.editingProduct = null;
    this.showCouponModal = false;
    this.editingCoupon = null;
    this.showStockModal = false;
    this.stockProduct = null;
    this.showSectionModal = false;
    this.editingSection = null;
    
    // Data structures loaded dynamically
    this.products = [];
    this.orders = [];
    this.customers = [];
    this.coupons = [];
    this.categories = [];
    this.inventoryLogs = [];
    this.homepageSections = [];
    this.loadDatabase();
  }

  get searchQuery() {
    return this.searchQueries[this.currentTab] || '';
  }

  set searchQuery(val) {
    this.searchQueries[this.currentTab] = val;
  }

   checkSessionValidity() {
    const isAuth = sessionStorage.getItem('SWEETOS_admin_authenticated') === 'true';
    const globalVersion = localStorage.getItem('SWEETOS_admin_session_version');
    const deviceVersion = sessionStorage.getItem('SWEETOS_admin_device_session_version');

    if (isAuth && globalVersion && deviceVersion !== globalVersion) {
      sessionStorage.removeItem('SWEETOS_admin_authenticated');
      sessionStorage.removeItem('SWEETOS_admin_device_session_version');
      this.isAuthenticated = false;
    }
  }

  setupToastListener() {
    const shadow = this.shadowRoot;
    this._toastListener = (e) => {
      const container = shadow.getElementById('admin-toast-container');
      if (!container) return;
      
      const toast = document.createElement('div');
      
      let isError = false;
      let isAlert = false;
      let isKey = false;
      
      if (e.detail) {
        const detailLower = e.detail.toLowerCase();
        isError = detailLower.includes('error') || detailLower.includes('incorrect') || detailLower.includes('invalid');
        isAlert = detailLower.includes('bell') || detailLower.includes('live alert');
        isKey = detailLower.includes('key') || detailLower.includes('password');
      }

      toast.className = `admin-toast ${isError ? 'error' : 'success'}`;
      
      let icon = '✅';
      if (isError) icon = '❌';
      else if (isAlert) icon = '🔔';
      else if (isKey) icon = '🔑';
      
      toast.innerHTML = `<span>${icon}</span> <span>${e.detail || ''}</span>`;
      container.appendChild(toast);
      
      setTimeout(() => toast.classList.add('show'), 10);
      
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    };
    
    window.addEventListener('toast:show', this._toastListener);
  }

  disconnectedCallback() {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.eventSource) this.eventSource.close();
    if (this._storageEventListener) window.removeEventListener('storage', this._storageEventListener);
    if (this._toastListener) window.removeEventListener('toast:show', this._toastListener);
  }

  connectedCallback() {
    this.checkSessionValidity();
    this.render();
    this.attachListeners();
    this.setupToastListener();

    // Auto-poll orders from server every 6 seconds to ensure live sync across devices
    this.pollInterval = setInterval(() => {
      if (this.isAuthenticated) {
        fetch('/api/orders')
          .then(res => res.json())
          .then(serverOrders => {
            if (serverOrders && Array.isArray(serverOrders)) {
              const currentLength = this.orders ? this.orders.length : 0;
              const hasNew = serverOrders.length !== currentLength || 
                             (serverOrders.length > 0 && this.orders.length > 0 && serverOrders[0].id !== this.orders[0].id);
              if (hasNew) {
                this.orders = serverOrders;
                localStorage.setItem('SWEETOS_all_orders', JSON.stringify(serverOrders));
                this.render();
                this.attachListeners();
              }
            }
          }).catch(() => {});
      }
    }, 6000);

    this._storageEventListener = (e) => {
      if (e.key === 'SWEETOS_admin_session_version') {
        const isAuth = sessionStorage.getItem('SWEETOS_admin_authenticated') === 'true';
        const deviceVersion = sessionStorage.getItem('SWEETOS_admin_device_session_version');
        if (isAuth && e.newValue && deviceVersion !== e.newValue) {
          sessionStorage.removeItem('SWEETOS_admin_authenticated');
          sessionStorage.removeItem('SWEETOS_admin_device_session_version');
          this.isAuthenticated = false;
          this.render();
          this.attachListeners();
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Session expired: logged out from another device.' }));
        }
      } else if (e.key === 'SWEETOS_all_orders') {
        try {
          this.orders = JSON.parse(e.newValue || '[]');
          this.render();
          this.attachListeners();
        } catch(err) {}
      }
    };
    window.addEventListener('storage', this._storageEventListener);

    // Fetch all database sources concurrently on startup
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => null),
      fetch('/api/categories').then(res => res.json()).catch(() => null),
      fetch('/api/brands').then(res => res.json()).catch(() => null),
      fetch('/api/reviews').then(res => res.json()).catch(() => null),
      fetch('/api/orders').then(res => res.json()).catch(() => null),
      fetch('/api/coupons').then(res => res.json()).catch(() => null)
    ]).then(([products, categories, brands, reviews, orders, coupons]) => {
      let needsRender = false;
      if (products && products.length > 0) {
        this.products = products;
        localStorage.setItem('SWEETOS_products', JSON.stringify(products));
        needsRender = true;
      }
      if (categories && categories.length > 0) {
        this.categories = categories;
        localStorage.setItem('SWEETOS_categories', JSON.stringify(categories));
        needsRender = true;
      }
      if (brands && brands.length > 0) {
        this.brands = brands;
        localStorage.setItem('SWEETOS_brands', JSON.stringify(brands));
        needsRender = true;
      }
      if (reviews && reviews.length > 0) {
        this.reviews = reviews;
        localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(reviews));
        needsRender = true;
      }
      if (orders && orders.length > 0) {
        this.orders = orders;
        localStorage.setItem('SWEETOS_all_orders', JSON.stringify(orders));
        needsRender = true;
      }
      if (coupons && coupons.length > 0) {
        this.coupons = coupons;
        localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
        needsRender = true;
      }
      if (needsRender) {
        this.render();
        this.attachListeners();
      }

      // Establish real-time notification stream (SSE)
      this.initRealTimeNotificationStream();
    });
  }

  loadDatabase() {
    // 1. Products Catalog
    const storedProds = localStorage.getItem('SWEETOS_products');
    try {
      this.products = storedProds ? JSON.parse(storedProds) : [];
    } catch (e) {
      this.products = [];
    }
    if (this.products.length === 0) {
      this.products = products;
      localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
    }
    
    // 2. Orders Pipeline
    const storedOrders = localStorage.getItem('SWEETOS_all_orders');
    try {
      this.orders = storedOrders ? JSON.parse(storedOrders) : [];
    } catch (e) {
      this.orders = [];
    }
    if (this.orders.length === 0) {
      this.orders = orders;
      localStorage.setItem('SWEETOS_all_orders', JSON.stringify(this.orders));
    }
    
    // 3. Category Settings
    const storedCats = localStorage.getItem('SWEETOS_categories');
    try {
      this.categories = storedCats ? JSON.parse(storedCats) : [];
    } catch (e) {
      this.categories = [];
    }
    if (this.categories.length === 0) {
      this.categories = categories;
      localStorage.setItem('SWEETOS_categories', JSON.stringify(this.categories));
    }
    
    // 4. Coupon Database
    const storedCoupons = localStorage.getItem('SWEETOS_coupons');
    this.coupons = storedCoupons ? JSON.parse(storedCoupons) : [
      { code: "SWEETWELCOME", type: "percentage", value: 10, minOrder: 15000, limit: 100, used: 24, expiry: "2026-12-31", status: "active" },
      { code: "DESKSETUP", type: "fixed", value: 5000, minOrder: 45000, limit: 50, used: 12, expiry: "2026-10-15", status: "active" }
    ];
    if (!storedCoupons) {
      localStorage.setItem('SWEETOS_coupons', JSON.stringify(this.coupons));
    }

    // 5. Stock Adjustments logs
    const storedInvLogs = localStorage.getItem('SWEETOS_inventory_logs');
    this.inventoryLogs = storedInvLogs ? JSON.parse(storedInvLogs) : [
      { id: 1, date: "2026-08-16 10:14", sku: "KB-Q1PRO", action: "Restock", quantity: 15, user: "admin@sweetos.com" },
      { id: 2, date: "2026-08-15 14:22", sku: "AU-MX4", action: "Fulfillment", quantity: -2, user: "System checkout" }
    ];
    if (!storedInvLogs) {
      localStorage.setItem('SWEETOS_inventory_logs', JSON.stringify(this.inventoryLogs));
    }
    
    // 6. Registered Customers list derived dynamically from SWEETOS profile keys + checkouts
    this.customers = this.loadCustomers();

    // 7. Homepage Sections configuration with self-healing migration for default layouts
    const storedSections = localStorage.getItem('SWEETOS_homepage_sections');
    let parsedSections = [];
    try {
      parsedSections = storedSections ? JSON.parse(storedSections) : [];
    } catch(e) {}

    const defaultSecs = [
      { id: "sec-cat", name: "Shop by Category", type: "categories", category: "All", active: true, order: 0 },
      { id: "sec-deals", name: "Hot Deals", type: "deals", category: "All", active: true, order: 1 },
      { id: "sec-new", name: "New Arrivals", type: "new-arrivals", category: "All", active: true, order: 2 },
      { id: "sec-best", name: "Best Sellers", type: "best-sellers", category: "All", active: true, order: 3 },
      { id: "sec-1", name: "Apple Workspace Showcase", type: "grid", category: "Apple", active: true, order: 4 },
      { id: "sec-2", name: "Featured Keyboards", type: "carousel", category: "Keyboards", active: true, order: 5 },
      { id: "sec-3", name: "Trending Audio Accessories", type: "grid", category: "Audio", active: false, order: 6 }
    ];

    let needsSave = false;
    if (parsedSections.length === 0) {
      parsedSections = defaultSecs;
      needsSave = true;
    } else {
      // Ensure required default sections are present
      defaultSecs.forEach(ds => {
        if (!parsedSections.some(s => s.id === ds.id)) {
          parsedSections.push(ds);
          needsSave = true;
        }
      });
    }

    // Ensure order is defined on all sections
    parsedSections.forEach((s, idx) => {
      if (s.order === undefined) {
        s.order = idx;
        needsSave = true;
      }
    });

    this.homepageSections = parsedSections;
    if (needsSave || !storedSections) {
      localStorage.setItem('SWEETOS_homepage_sections', JSON.stringify(this.homepageSections));
    }

    // 8. Brand settings Directory
    const storedBrands = localStorage.getItem('SWEETOS_brands');
    try {
      this.brands = storedBrands ? JSON.parse(storedBrands) : [];
    } catch (e) {
      this.brands = [];
    }
    if (this.brands.length === 0) {
      this.brands = brands;
      localStorage.setItem('SWEETOS_brands', JSON.stringify(this.brands));
    }

    // 9. Review settings Directory
    const storedReviews = localStorage.getItem('SWEETOS_reviews_all');
    try {
      this.reviews = storedReviews ? JSON.parse(storedReviews) : [];
    } catch (e) {
      this.reviews = [];
    }
  }

  loadCustomers() {
    const customersMap = new Map();

    // Scan localStorage user profiles
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('SWEETOS_user_profile_') && !key.endsWith('_guest')) {
        try {
          const profile = JSON.parse(localStorage.getItem(key));
          if (profile && profile.email) {
            const orders = profile.orders || [];
            const spent = orders.reduce((sum, o) => sum + o.total, 0);
            customersMap.set(profile.email.toLowerCase(), {
              name: `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'SWEETOS Member',
              email: profile.email,
              phone: profile.phone || '',
              ordersCount: orders.length,
              totalSpent: spent,
              registrationDate: profile.registrationDate || "14 août, 2026",
              addresses: profile.addresses || []
            });
          }
        } catch(e) {}
      }
    }

    // Add values from checkout orders
    this.orders.forEach(order => {
      if (order.customerEmail) {
        const email = order.customerEmail.toLowerCase();
        if (customersMap.has(email)) {
          const exist = customersMap.get(email);
          exist.ordersCount = Math.max(exist.ordersCount, this.orders.filter(o => o.customerEmail.toLowerCase() === email).length);
          exist.totalSpent = this.orders.filter(o => o.customerEmail.toLowerCase() === email).reduce((sum, o) => sum + o.total, 0);
        } else {
          customersMap.set(email, {
            name: order.customerName || "Guest User",
            email: order.customerEmail,
            phone: order.customerPhone || "",
            ordersCount: 1,
            totalSpent: order.total,
            registrationDate: order.date,
            addresses: [order.customerAddress]
          });
        }
      }
    });

    return Array.from(customersMap.values());
  }

  saveDatabase(type) {
    if (type === 'products') {
      localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
      window.dispatchEvent(new CustomEvent('products:updated', { detail: this.products }));
      this.syncProductsToServer();
    } else if (type === 'orders') {
      localStorage.setItem('SWEETOS_all_orders', JSON.stringify(this.orders));
      this.syncOrdersToServer();
    } else if (type === 'coupons') {
      localStorage.setItem('SWEETOS_coupons', JSON.stringify(this.coupons));
      this.syncCouponsToServer();
    } else if (type === 'categories') {
      localStorage.setItem('SWEETOS_categories', JSON.stringify(this.categories));
      this.syncCategoriesToServer();
    } else if (type === 'inventory') {
      localStorage.setItem('SWEETOS_inventory_logs', JSON.stringify(this.inventoryLogs));
    } else if (type === 'sections') {
      localStorage.setItem('SWEETOS_homepage_sections', JSON.stringify(this.homepageSections));
    } else if (type === 'brands') {
      localStorage.setItem('SWEETOS_brands', JSON.stringify(this.brands));
      window.dispatchEvent(new CustomEvent('brands:updated', { detail: this.brands }));
      this.syncBrandsToServer();
    } else if (type === 'reviews') {
      localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(this.reviews));
      this.syncReviewsToServer();
    }
  }

  syncCouponsToServer() {
    fetch('/api/coupons', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.coupons)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Coupons synced to server successfully.');
      } else {
        console.error('Failed to sync coupons to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing coupons to server:', err));
  }

  syncProductsToServer() {
    fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.products)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Products synced to server successfully.');
      } else {
        console.error('Failed to sync products to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing products to server:', err));
  }

  syncCategoriesToServer() {
    fetch('/api/categories', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.categories)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Categories synced to server successfully.');
      } else {
        console.error('Failed to sync categories to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing categories to server:', err));
  }

  syncBrandsToServer() {
    fetch('/api/brands', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.brands)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Brands synced to server successfully.');
      } else {
        console.error('Failed to sync brands to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing brands to server:', err));
  }

  syncReviewsToServer() {
    fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.reviews)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Reviews synced to server successfully.');
      } else {
        console.error('Failed to sync reviews to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing reviews to server:', err));
  }

  syncOrdersToServer() {
    fetch('/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(this.orders)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Orders synced to server successfully.');
      } else {
        console.error('Failed to sync orders to server:', data.error);
      }
    })
    .catch(err => console.error('Error syncing orders to server:', err));
  }

  initRealTimeNotificationStream() {
    if (this.eventSource) {
      this.eventSource.close();
    }
    
    this.eventSource = new EventSource('/api/live-alerts');
    
    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Real-time notification alert received:', data);
        
        // Push desktop-like banner toast using storefront toast dispatcher
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `🔔 LIVE ALERT: ${data.message}` }));
        
        // Dynamically pull latest details
        this.syncAllDatabasesFromServer();
      } catch (e) {
        console.error('Failed to parse SSE event:', e);
      }
    };

    this.eventSource.onerror = (err) => {
      console.warn('Real-time notification stream lost. Reconnecting...', err);
    };
  }

  syncAllDatabasesFromServer() {
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => null),
      fetch('/api/categories').then(res => res.json()).catch(() => null),
      fetch('/api/brands').then(res => res.json()).catch(() => null),
      fetch('/api/reviews').then(res => res.json()).catch(() => null),
      fetch('/api/orders').then(res => res.json()).catch(() => null),
      fetch('/api/coupons').then(res => res.json()).catch(() => null)
    ]).then(([products, categories, brands, reviews, orders, coupons]) => {
      if (products) {
        this.products = products;
        localStorage.setItem('SWEETOS_products', JSON.stringify(products));
      }
      if (categories) {
        this.categories = categories;
        localStorage.setItem('SWEETOS_categories', JSON.stringify(categories));
      }
      if (brands) {
        this.brands = brands;
        localStorage.setItem('SWEETOS_brands', JSON.stringify(brands));
      }
      if (reviews) {
        this.reviews = reviews;
        localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(reviews));
      }
      if (orders) {
        this.orders = orders;
        localStorage.setItem('SWEETOS_all_orders', JSON.stringify(orders));
      }
      if (coupons) {
        this.coupons = coupons;
        localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
      }
      
      this.render();
      this.attachListeners();
    });
  }

  render() {
    // 1. Ensure stylesheet is injected exactly once to prevent FOUC on tab changes
    if (!this.shadowRoot.querySelector('link[href*="AdminPage.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = './components/Admin/AdminPage.css';
      this.shadowRoot.appendChild(link);
    }
    
    // 2. Ensure container exists
    let container = this.shadowRoot.querySelector('.admin-page-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.className = 'admin-page-wrapper';
      container.style.opacity = '0';
      container.style.transition = 'opacity 0.15s ease';
      this.shadowRoot.appendChild(container);
      
      const link = this.shadowRoot.querySelector('link[href*="AdminPage.css"]');
      if (link) {
        link.addEventListener('load', () => {
          container.style.opacity = '1';
        });
      }
      setTimeout(() => {
        container.style.opacity = '1';
      }, 50);
    }
    
    // 3. Render HTML content inside container
    container.innerHTML = `
      ${!this.isAuthenticated ? this.renderLogin() : this.renderDashboardLayout()}
      <div class="admin-toast-container" id="admin-toast-container"></div>
    `;
  }

  renderLogin() {
    return `
      <div class="admin-login-wrapper">
        <div class="admin-login-card">
          <!-- Sweeto Hub Logo Header -->
          <div class="logo-container">
            <div class="logo-box">
              <svg viewBox="0 0 100 100" class="logo-svg">
                <defs>
                  <linearGradient id="blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#00b4d8" />
                    <stop offset="100%" stop-color="#0052cc" />
                  </linearGradient>
                </defs>
                <circle cx="50" cy="50" r="45" fill="none" stroke="url(#blue-grad)" stroke-width="4"/>
                <path d="M50 20 C65 20, 75 30, 75 42 C75 55, 50 52, 50 62 C50 72, 60 78, 68 76" fill="none" stroke="#ffffff" stroke-width="6" stroke-linecap="round"/>
                <circle cx="50" cy="62" r="3" fill="#00b4d8"/>
              </svg>
            </div>
            <div class="logo-text">SWEETO HUB</div>
          </div>

          <!-- Security Terminal Subtitle -->
          <div class="security-terminal">
            <i class="ph ph-shield-check text-cyan"></i>
            <span>SECURITY TERMINAL</span>
          </div>

          <!-- Title Header -->
          <h2 class="terminal-title">CONTROL CENTER LOCKED</h2>
          <p class="terminal-desc">ENTER ADMINISTRATIVE CREDENTIALS TO GAIN DECRYPTION KEY.</p>

          <form id="admin-login-form" class="terminal-form">
            <!-- Username Input -->
            <div class="terminal-group">
              <label class="terminal-label">ADMIN USERNAME (EMAIL)</label>
              <div class="terminal-input-wrapper">
                <i class="ph ph-shield terminal-icon-left"></i>
                <input type="email" id="admin-email" value="sweeto@sweetohub.com" required placeholder="sweeto@sweetohub.com" autocomplete="email" class="terminal-input">
              </div>
            </div>

            <!-- Password Input -->
            <div class="terminal-group">
              <label class="terminal-label">MASTER DECRYPT KEY</label>
              <div class="terminal-input-wrapper">
                <i class="ph ph-lock-key terminal-icon-left"></i>
                <input type="password" id="admin-password" value="admin" required placeholder="••••••••" autocomplete="current-password" class="terminal-input">
                <button type="button" id="toggle-admin-pass" class="terminal-pass-toggle">
                  <i class="ph ph-eye text-lg"></i>
                </button>
              </div>
            </div>

            <div id="login-error-msg" class="error-text" style="color: #ef4444; font-size: 12px; margin-top: -8px; margin-bottom: 8px; font-weight: 600; font-family: 'Outfit', sans-serif;"></div>

            <!-- Action Buttons -->
            <div class="terminal-actions">
              <button type="button" id="exit-store-btn" class="terminal-btn-outline">EXIT TO STORE</button>
              <button type="submit" class="terminal-btn-primary">
                <i class="ph ph-key"></i>
                AUTHORIZE ACCESS
              </button>
            </div>
          </form>

          <!-- Footer Information -->
          <div class="terminal-footer">
            <span class="footer-left">TERMINAL V2.0.1</span>
            <span class="footer-right">
              <i class="ph ph-lock-key-open"></i>
              SECURE SOCKET LINK
            </span>
          </div>
        </div>
      </div>
    `;
  }

  renderDashboardLayout() {
    return `
      <div class="admin-dashboard-container animate-in">
        ${renderAdminSidebar(this)}
        <main class="admin-main">
          ${renderAdminHeader(this)}
          <div class="admin-viewport custom-scroll">
            ${this.renderTabContent()}
          </div>
        </main>
      </div>
    `;
  }

  renderTabContent() {
    if (this.lastTab !== this.currentTab) {
      this.currentPageIndex = 1;
      this.lastTab = this.currentTab;
    }
    switch (this.currentTab) {
      case 'dashboard':
        return renderAdminDashboard(this);
      case 'products':
        return renderAdminProducts(this);
      case 'orders':
        return renderAdminOrders(this);
      case 'customers':
        return renderAdminCustomers(this);
      case 'inventory':
        return renderAdminInventory(this);
      case 'coupons':
        return renderAdminCoupons(this);
      case 'analytics':
        return renderAdminAnalytics(this);
      case 'settings':
        return renderAdminSettings(this);
      case 'sections':
        return renderAdminSections(this);
      case 'reviews':
        return renderAdminReviews(this);
      default:
        return renderAdminDashboard(this);
    }
  }

  attachListeners() {
    const shadow = this.shadowRoot;
    
    // Check if authenticated
    if (!this.isAuthenticated) {
      const loginForm = shadow.getElementById('admin-login-form');
      
      // Bind eye toggle button
      const togglePassBtn = shadow.getElementById('toggle-admin-pass');
      const passInput = shadow.getElementById('admin-password');
      if (togglePassBtn && passInput) {
        togglePassBtn.addEventListener('click', () => {
          const icon = togglePassBtn.querySelector('i');
          if (passInput.type === 'password') {
            passInput.type = 'text';
            icon.classList.remove('ph-eye');
            icon.classList.add('ph-eye-slash');
          } else {
            passInput.type = 'password';
            icon.classList.remove('ph-eye-slash');
            icon.classList.add('ph-eye');
          }
        });
      }

      // Bind exit to store button
      const exitBtn = shadow.getElementById('exit-store-btn');
      if (exitBtn) {
        exitBtn.addEventListener('click', () => {
          window.location.href = '/';
        });
      }

      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = shadow.getElementById('admin-email').value.trim();
          const password = shadow.getElementById('admin-password').value.trim();
          const errorMsg = shadow.getElementById('login-error-msg');
          
          fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              this.isAuthenticated = true;
              sessionStorage.setItem('SWEETOS_admin_authenticated', 'true');
              const sessionVersion = localStorage.getItem('SWEETOS_admin_session_version') || Date.now().toString();
              localStorage.setItem('SWEETOS_admin_session_version', sessionVersion);
              sessionStorage.setItem('SWEETOS_admin_device_session_version', sessionVersion);
              this.render();
              this.attachListeners();
              window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Welcome back, Admin Manager!' }));
            } else {
              errorMsg.textContent = data.error || 'Invalid email address or decryption key.';
            }
          })
          .catch(err => {
            console.error('Admin authentication failure:', err);
            errorMsg.textContent = 'Server connection error. Please try again.';
          });
        });
      }
      return;
    }

    // Attach modular components listeners
    attachAdminSidebarListeners(this, shadow);
    attachAdminHeaderListeners(this, shadow);

    switch (this.currentTab) {
      case 'dashboard':
        attachAdminDashboardListeners(this, shadow);
        break;
      case 'products':
        attachAdminProductsListeners(this, shadow);
        break;
      case 'orders':
        attachAdminOrdersListeners(this, shadow);
        break;
      case 'customers':
        attachAdminCustomersListeners(this, shadow);
        break;
      case 'inventory':
        attachAdminInventoryListeners(this, shadow);
        break;
      case 'coupons':
        attachAdminCouponsListeners(this, shadow);
        break;
      case 'analytics':
        attachAdminAnalyticsListeners(this, shadow);
        break;
      case 'settings':
        attachAdminSettingsListeners(this, shadow);
        break;
      case 'sections':
        attachAdminSectionsListeners(this, shadow);
        break;
      case 'reviews':
        attachAdminReviewsListeners(this, shadow);
        break;
    }
  }

  disconnectedCallback() {
    if (this._storageEventListener) {
      window.removeEventListener('storage', this._storageEventListener);
    }
    if (this._toastListener) {
      window.removeEventListener('toast:show', this._toastListener);
    }
  }

  updateProductsTable() {
    this.render();
    this.attachListeners();
    const s = this.shadowRoot.getElementById('product-search');
    if (s) {
      s.focus();
      s.setSelectionRange(s.value.length, s.value.length);
    }
  }
}

customElements.define('admin-page', AdminPage);
export default AdminPage;
