import { formatPrice } from '../../utils/storage.js';
import products from '../../data/products.js';
import categories from '../../data/categories.js';
import brands from '../../data/brands.js';
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
    this.searchQuery = '';
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

  connectedCallback() {
    this.render();
    this.attachListeners();
    // Fetch products from server on load
    fetch('/api/products')
      .then(res => res.json())
      .then(serverProds => {
        if (serverProds && serverProds.length > 0) {
          this.products = serverProds;
          localStorage.setItem('SWEETOS_products', JSON.stringify(serverProds));
          this.render();
        }
      })
      .catch(err => console.warn('Could not load products from server:', err));

    // Fetch categories from server on load
    fetch('/api/categories')
      .then(res => res.json())
      .then(serverCats => {
        if (serverCats && serverCats.length > 0) {
          this.categories = serverCats;
          localStorage.setItem('SWEETOS_categories', JSON.stringify(serverCats));
          this.render();
        }
      })
      .catch(err => console.warn('Could not load categories from server:', err));

    // Fetch brands from server on load
    fetch('/api/brands')
      .then(res => res.json())
      .then(serverBrands => {
        if (serverBrands && serverBrands.length > 0) {
          this.brands = serverBrands;
          localStorage.setItem('SWEETOS_brands', JSON.stringify(serverBrands));
          this.render();
        }
      })
      .catch(err => console.warn('Could not load brands from server:', err));

    // Fetch reviews from server on load
    fetch('/api/reviews')
      .then(res => res.json())
      .then(serverReviews => {
        if (serverReviews && serverReviews.length > 0) {
          this.reviews = serverReviews;
          localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(serverReviews));
          this.render();
        }
      })
      .catch(err => console.warn('Could not load reviews from server:', err));
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
    this.orders = storedOrders ? JSON.parse(storedOrders) : this.generateMockOrders();
    if (!storedOrders) {
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

  generateMockOrders() {
    return [
      {
        id: "SW-8947A",
        date: "14 août, 2026",
        status: "Livré",
        total: 125000,
        items: "Keychron Q1 Pro Mechanical Keyboard x1",
        products: [{ id: 1, name: "Keychron Q1 Pro Mechanical Keyboard", price: 125000, quantity: 1, image: "./assets/keyboard_1786712380801.jpg" }],
        customerName: "Odinaka Chibuike",
        customerEmail: "codinak256@gmail.com",
        customerPhone: "+225 05 00 61 99 23",
        customerAddress: "Abidjan, Cocody Mermoz Villa 12",
        customerZip: "225",
        paymentMethod: "wave",
        trackingNumber: "WV-ABJ-98273"
      },
      {
        id: "SW-9812C",
        date: "15 août, 2026",
        status: "En cours",
        total: 78000,
        items: "Aero Silent Switches x1, Nebula Light Ring Dial x1",
        products: [
          { id: 13, name: "Aero Silent Switches", price: 33000, quantity: 1, image: "./assets/keyboard_1786712380801.jpg" },
          { id: 37, name: "Nebula Light Ring Dial", price: 45000, quantity: 1, image: "./assets/desk_lamp_1786712407372.jpg" }
        ],
        customerName: "Alassane Koné",
        customerEmail: "alassane@orange.ci",
        customerPhone: "+225 07 00 00 00 01",
        customerAddress: "Plateau, Boulevard de la République Imb. 4",
        customerZip: "01",
        paymentMethod: "orange",
        trackingNumber: ""
      },
      {
        id: "SW-1082K",
        date: "16 août, 2026",
        status: "Pending",
        total: 147000,
        items: "Sennheiser HD 600 Open Back Cans x1, Solid Oak Riser Shelf x1",
        products: [
          { id: 26, name: "Sennheiser HD 600 Open Back Cans", price: 110000, quantity: 1, image: "./assets/headphones_1786712393413.jpg" },
          { id: 40, name: "Solid Oak Riser Shelf", price: 37000, quantity: 1, image: "./assets/monitor_stand_1786712418743.jpg" }
        ],
        customerName: "Marie Dupont",
        customerEmail: "marie@yahoo.fr",
        customerPhone: "+225 05 05 00 00 01",
        customerAddress: "Zone 4, Rue du Canal Rés. Prestige",
        customerZip: "04",
        paymentMethod: "cod",
        trackingNumber: ""
      }
    ];
  }

  loadCustomers() {
    const customersMap = new Map();
    
    // Add defaults
    customersMap.set("codinak256@gmail.com", {
      name: "Odinaka Chibuike",
      email: "codinak256@gmail.com",
      phone: "+225 05 00 61 99 23",
      ordersCount: 1,
      totalSpent: 125000,
      registrationDate: "12 juil., 2026",
      addresses: ["Abidjan, Cocody Mermoz Villa 12"]
    });
    
    customersMap.set("alassane@orange.ci", {
      name: "Alassane Koné",
      email: "alassane@orange.ci",
      phone: "+225 07 00 00 00 01",
      ordersCount: 1,
      totalSpent: 78000,
      registrationDate: "1 août, 2026",
      addresses: ["Plateau, Boulevard de la République Imb. 4"]
    });

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
    } else if (type === 'coupons') {
      localStorage.setItem('SWEETOS_coupons', JSON.stringify(this.coupons));
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
    container.innerHTML = !this.isAuthenticated ? this.renderLogin() : this.renderDashboardLayout();
  }

  renderLogin() {
    return `
      <div class="admin-login-wrapper">
        <div class="admin-login-card glass-panel animate-in">
          <div class="brand-logo-glow"></div>
          <div class="login-header">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="var(--primary)" stroke-width="2.5" style="width: 36px; height: 36px; flex-shrink: 0; display: inline-block;">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path>
            </svg>
            <h2>SWEETOS Admin Panel</h2>
            <p>Authorized personnel access only</p>
          </div>
          <form id="admin-login-form">
            <div class="form-group">
              <label>Email Address</label>
              <input type="email" id="admin-email" value="admin@sweetos.com" required placeholder="admin@sweetos.com" autocomplete="email">
            </div>
            <div class="form-group">
              <label>Password</label>
              <input type="password" id="admin-password" value="admin" required placeholder="••••••••" autocomplete="current-password">
            </div>
            <div id="login-error-msg" class="error-text"></div>
            <button type="submit" class="admin-btn admin-btn-primary">Authenticate</button>
          </form>
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
          <div class="admin-viewport">
            ${this.renderTabContent()}
          </div>
        </main>
      </div>
    `;
  }

  renderTabContent() {
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
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          const email = shadow.getElementById('admin-email').value.trim();
          const pass = shadow.getElementById('admin-password').value.trim();
          const errorMsg = shadow.getElementById('login-error-msg');
          
          if (email === 'admin@sweetos.com' && pass === 'admin') {
            this.isAuthenticated = true;
            sessionStorage.setItem('SWEETOS_admin_authenticated', 'true');
            this.render();
            this.attachListeners();
            window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Welcome back, Admin Manager!' }));
          } else {
            errorMsg.textContent = 'Invalid email address or password credentials.';
          }
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
