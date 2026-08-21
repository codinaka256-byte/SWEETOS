import products from '../../data/products.js';
import { showEditAddressModal } from '../Modals/EditAddressModal.js';
import { showCancelOrderModal } from '../Modals/CancelOrderModal.js';
import { showDeleteOrderModal } from '../Modals/DeleteOrderModal.js';
import { getAuthPageHTML, attachAuthListeners } from '../Auth/AuthPage.js';
import { getCartStorageKey, getProfileStorageKey, getNotificationsStorageKey, formatPrice, syncDeliveredNotifications } from '../../utils/storage.js';
import '../Admin/AdminPage.js';

class ProductList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    
    // Initialize products database from localStorage to enable Admin Panel synchronization
    const storedProds = localStorage.getItem('SWEETOS_products');
    if (storedProds) {
      try {
        this.products = JSON.parse(storedProds);
        // Sync any new products from the source data/products.js that are missing from localStorage
        let hasNew = false;
        products.forEach(p => {
          if (!this.products.some(existing => existing.id === p.id)) {
            this.products.push(p);
            hasNew = true;
          }
        });
        const hasMigrated = this.initializeHomepageSectionsForProducts(this.products);
        if (hasNew || hasMigrated) {
          localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
        }
      } catch (e) {
        this.products = products;
        this.initializeHomepageSectionsForProducts(this.products);
        localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
      }
    } else {
      this.products = products;
      this.initializeHomepageSectionsForProducts(this.products);
      localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
    }
    
    // Page state
    this.currentPage = sessionStorage.getItem('SWEETOS_current_page') || 'home';
    this.currentCategory = sessionStorage.getItem('SWEETOS_current_category') || 'All';
    this.currentQuery = sessionStorage.getItem('SWEETOS_current_query') || '';
    this.currentBrand = sessionStorage.getItem('SWEETOS_current_brand') || '';
    this.currentBrandFilter = sessionStorage.getItem('SWEETOS_current_brand_filter') || 'All';
    const savedProdId = sessionStorage.getItem('SWEETOS_current_product_id');
    this.currentProductId = savedProdId ? parseInt(savedProdId) : null;
    
    // PDP states
    this.pdpQuantity = 1;
    this.selectedColor = '';
    this.activeThumbnailIdx = 0;
    this.openAccordions = {
      description: true,
      specs: false,
      shipping: false
    };
    this.activeReviewFilter = 'All';
    this.visibleReviewsCount = 5; 
    
    // Review form states
    this.showReviewForm = false;
    this.formRating = 5;
    
    // Timer state
    this.timerInterval = null;
    this.countdownTime = 2 * 3600 + 45 * 60 + 18; 
    
    // Profile active tab state
    this.activeProfileTab = sessionStorage.getItem('SWEETOS_active_profile_tab') || 'overview';
    this.activeAboutTab = 'about-us';

    // Infinite scroll "For You" states
    this.forYouIndex = 0;
    this.forYouLoading = false;
    
    // Interactive category carousel active state
    this.activeFeaturedIndex = 0;
  }

  parseHashRoute() {
    const hash = window.location.hash || '';
    if (hash.startsWith('#/')) {
      const route = hash.substring(2);
      if (route.startsWith('product/')) {
        const idStr = route.split('/')[1];
        const pId = parseInt(idStr);
        if (!isNaN(pId)) {
          this.currentPage = 'pdp';
          this.currentProductId = pId;
        }
      } else if (route.startsWith('coupons/')) {
        this.currentPage = 'coupons';
        this.currentCouponCode = route.split('/')[1];
      } else if (route === 'coupons') {
        this.currentPage = 'coupons';
        this.currentCouponCode = null;
      } else if (route === 'terms') {
        this.currentPage = 'terms';
      } else if (route === 'about-us' || route === 'about') {
        this.currentPage = 'about-us';
      } else if (route === 'refund') {
        this.currentPage = 'refund';
      } else if (route === 'contact') {
        this.currentPage = 'contact';
      } else if (route.startsWith('catalog/')) {
        const cat = decodeURIComponent(route.split('/')[1]);
        this.currentPage = 'catalog';
        this.currentCategory = cat;
        this.currentBrand = '';
      } else {
        this.currentPage = route || 'home';
        if (this.currentPage === 'catalog') {
          this.currentCategory = 'All';
        }
      }
    } else {
      this.currentPage = 'home';
    }
  }

  updateHashURL() {
    let hash = '#/';
    if (this.currentPage === 'pdp' && this.currentProductId) {
      hash += 'product/' + this.currentProductId;
    } else if (this.currentPage === 'coupons') {
      hash += 'coupons' + (this.currentCouponCode ? '/' + this.currentCouponCode : '');
    } else if (this.currentPage === 'catalog' && this.currentCategory && this.currentCategory !== 'All') {
      hash += 'catalog/' + encodeURIComponent(this.currentCategory);
    } else if (this.currentPage === 'home') {
      hash = '#/';
    } else {
      hash += this.currentPage;
    }
    
    if (window.location.hash !== hash) {
      history.pushState(null, '', hash);
    }
  }

  connectedCallback() {
    this.parseHashRoute();

    // Fetch all database resources concurrently on startup
    Promise.all([
      fetch('/api/products').then(res => res.json()).catch(() => null),
      fetch('/api/categories').then(res => res.json()).catch(() => null),
      fetch('/api/brands').then(res => res.json()).catch(() => null),
      fetch('/api/reviews').then(res => res.json()).catch(() => null),
      fetch('/api/coupons').then(res => res.json()).catch(() => null)
    ]).then(([products, categories, brands, reviews, coupons]) => {
      let needsRender = false;
      if (products && products.length > 0) {
        this.products = products;
        localStorage.setItem('SWEETOS_products', JSON.stringify(products));
        needsRender = true;
      }
      if (categories && categories.length > 0) {
        localStorage.setItem('SWEETOS_categories', JSON.stringify(categories));
        needsRender = true;
      }
      if (brands && brands.length > 0) {
        localStorage.setItem('SWEETOS_brands', JSON.stringify(brands));
        needsRender = true;
      }
      if (reviews && reviews.length > 0) {
        localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(reviews));
        needsRender = true;
      }
      if (coupons && coupons.length > 0) {
        localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
        needsRender = true;
      }
      if (needsRender) {
        this.renderPageContent();
      }
    });

    // Check if product ID is passed in URL query params (e.g. from share button)
    const urlParams = new URLSearchParams(window.location.search);
    const sharedProductId = urlParams.get('product');
    if (sharedProductId) {
      const pId = parseInt(sharedProductId);
      const product = this.products.find(p => p.id === pId);
      if (product) {
        this.currentPage = 'pdp';
        this.currentProductId = pId;
      }
    }

    this.render();
    this.renderPageContent();
    this.setupEventListeners();

    // Listen to URL hash routing updates
    window.addEventListener('hashchange', () => {
      this.parseHashRoute();
      this.renderPageContent();
      
      // Dispatch sync event for other navigation elements (Sidebar, MobileNav, Header)
      window.dispatchEvent(new CustomEvent('navigation:changed', {
        detail: {
          page: this.currentPage,
          category: this.currentCategory,
          brand: this.currentBrand
        }
      }));
    });
    // Listen to cross-tab updates to sync products, categories, and brands reactively
    this._storageListener = (e) => {
      if (e.key === 'SWEETOS_products') {
        try {
          this.products = JSON.parse(e.newValue || '[]');
          this.renderPageContent();
        } catch (err) {}
      } else if (e.key === 'SWEETOS_categories' || e.key === 'SWEETOS_brands') {
        this.renderPageContent();
      }
    };
    window.addEventListener('storage', this._storageListener);
  }

  disconnectedCallback() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
    if (this._storageListener) {
      window.removeEventListener('storage', this._storageListener);
    }
  }

  // --- Functional Wishlist Utility Methods ---
  loadWishlistFromStorage() {
    const saved = localStorage.getItem('SWEETOS_wishlist');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  saveWishlistToStorage(wishlist) {
    localStorage.setItem('SWEETOS_wishlist', JSON.stringify(wishlist));
    window.dispatchEvent(new CustomEvent('wishlist:updated', { detail: wishlist }));
  }

  addToWishlist(product) {
    const wishlist = this.loadWishlistFromStorage();
    const existingIdx = wishlist.findIndex(item => item.id === product.id);
    if (existingIdx === -1) {
      wishlist.push(product);
      this.saveWishlistToStorage(wishlist);
      window.dispatchEvent(new CustomEvent('toast:show', { detail: `Added ${product.name} to Wishlist! ❤️` }));
    } else {
      wishlist.splice(existingIdx, 1);
      this.saveWishlistToStorage(wishlist);
      window.dispatchEvent(new CustomEvent('toast:show', { detail: `Removed ${product.name} from Wishlist.` }));
    }
    if (this.currentPage === 'wishlist') {
      this.renderPageContent();
    }
  }

  removeFromWishlist(productId) {
    let wishlist = this.loadWishlistFromStorage();
    wishlist = wishlist.filter(item => item.id !== productId);
    this.saveWishlistToStorage(wishlist);
    window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Removed from Wishlist.' }));
    if (this.currentPage === 'wishlist') {
      this.renderPageContent();
    }
  }

  // --- Functional User Profile Utility Methods ---
  loadUserProfile() {
    const profileKey = getProfileStorageKey();
    const saved = localStorage.getItem(profileKey);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback below
      }
    }
    const defaultProfile = {
      firstName: "Alina",
      lastName: "Putri",
      email: "alina.putri@designstudio.com",
      phone: "+1 (555) 019-2834",
      bio: "Workspace Designer & Minimalism Enthusiast. Building clean setups since 2024.",
      address: "123 Blue Way, Sky City, NY 10001",
      theme: "Ice Blue",
      twoFactor: false,
      marketingEmails: true,
      smsUpdates: false,
      addresses: [
        { id: 1, label: "Home (Default)", street: "123 Blue Way", city: "Sky City", state: "NY", zip: "10001" },
        { id: 2, label: "Office", street: "500 High Street, Floor 12", city: "Manhattan", state: "NY", zip: "10018" }
      ],
      orders: [
        { id: "AET-582910", date: "Aug 10, 2026", status: "Delivered", total: 228.00, items: "Aero-75 Mech Keyboard" },
        { id: "AET-394012", date: "Jul 24, 2026", status: "Processing", total: 39.00, items: "Aero-Mat Desk Pad" },
        { id: "AET-918237", date: "Aug 12, 2026", status: "Shipped", total: 119.00, items: "Nebula Soundwave Pillar" }
      ]
    };
    localStorage.setItem('SWEETOS_user_profile', JSON.stringify(defaultProfile));
    return defaultProfile;
  }

  saveUserProfile(profile) {
    localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
  }

  // --- Wishlist utilities finish ---

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/ProductList/ProductList.css">
      <section class="shop-section">


        <!-- Dynamic Content Area -->
        <div id="page-content">
          <!-- Injected via JS -->
        </div>

        <!-- Custom Creation Modal Dialog Overlay -->
        <div class="custom-modal-overlay" id="create-col-modal">
          <div class="custom-modal-content glass-panel">
            <h4>Create Custom Collection</h4>
            <p>Give your curated workspace setup folder a name.</p>
            <input type="text" id="new-col-name-input" placeholder="e.g. Dream Setup v2, Coding Corner..." />
            <div class="custom-modal-actions">
              <button class="btn-secondary" id="cancel-col-modal-btn" style="border:1px solid var(--border); background:white;">Cancel</button>
              <button class="btn-primary" id="confirm-col-modal-btn">Create Folder</button>
            </div>
          </div>
        </div>

      </section>
    `;
  }

  loadProductReviews(productId, targetRating, defaultCount) {
    const allSaved = localStorage.getItem('SWEETOS_reviews_all');
    let allReviews = [];
    if (allSaved) {
      try {
        allReviews = JSON.parse(allSaved);
      } catch (e) {}
    }
    // Filter reviews belonging to this product and that are approved
    return allReviews.filter(r => r.productId === productId && (r.status || 'approved') === 'approved');
  }

  saveProductReviews(productId, newReviewsForProduct) {
    const allSaved = localStorage.getItem('SWEETOS_reviews_all');
    let allReviews = [];
    if (allSaved) {
      try {
        allReviews = JSON.parse(allSaved);
      } catch (e) {}
    }

    // Keep reviews for other products
    allReviews = allReviews.filter(r => r.productId !== productId);

    // Map storefront new reviews to include standard metadata and go to 'pending' moderation
    const mapped = newReviewsForProduct.map((r, index) => {
      return {
        id: r.id || Date.now() + index,
        productId: productId,
        user: r.user,
        rating: r.rating,
        comment: r.comment,
        date: r.date || new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
        status: r.status || 'pending'
      };
    });

    allReviews = [...mapped, ...allReviews];
    localStorage.setItem('SWEETOS_reviews_all', JSON.stringify(allReviews));

    // Sync to server disk
    fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(allReviews)
    })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        console.log('Product reviews updated on server successfully.');
      }
    })
    .catch(err => console.error('Error posting updated reviews list:', err));
  }

  renderPageContent() {
    window.scrollTo(0, 0);
    
    // Log user activity
    let pageLabel = this.currentPage;
    if (this.currentPage === 'home') pageLabel = 'Home';
    else if (this.currentPage === 'catalog') pageLabel = `Catalog: ${this.currentCategory}`;
    else if (this.currentPage === 'pdp' && this.currentProductId) {
      const p = this.products.find(item => item.id === this.currentProductId);
      pageLabel = p ? `Product: ${p.name}` : 'Product Detail';
    } else if (this.currentPage === 'auth') pageLabel = 'Authentication';
    else if (this.currentPage === 'profile') pageLabel = 'Profile Settings';
    else if (this.currentPage === 'wishlist') pageLabel = 'Wishlist';
    else if (this.currentPage === 'about-us') pageLabel = 'About Us';
    else if (this.currentPage === 'terms') pageLabel = 'Terms & Conditions';
    else if (this.currentPage === 'refund') pageLabel = 'Refund Policy';
    else if (this.currentPage === 'contact') pageLabel = 'Contact Us';
    else if (this.currentPage === 'checkout') pageLabel = 'Checkout Form';
    else if (this.currentPage === 'coupons') pageLabel = 'Coupons & Offers';
    
    try {
      this.logCustomerActivity(pageLabel);
    } catch(err) {}

    // Reload products database to reflect Admin changes dynamically
    const storedProds = localStorage.getItem('SWEETOS_products');
    if (storedProds) {
      try {
        this.products = JSON.parse(storedProds);
        const hasMigrated = this.initializeHomepageSectionsForProducts(this.products);
        if (hasMigrated) {
          localStorage.setItem('SWEETOS_products', JSON.stringify(this.products));
        }
      } catch (e) {}
    }

    const isLoggedIn = localStorage.getItem('SWEETOS_logged_in_user') !== null;
    if (!isLoggedIn && (this.currentPage === 'profile' || this.currentPage === 'orders')) {
      this.currentPage = 'auth';
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: "Please sign in to access this page." }));
      }, 50);
    }

    // Persist current navigation state
    sessionStorage.setItem('SWEETOS_current_page', this.currentPage);
    sessionStorage.setItem('SWEETOS_current_category', this.currentCategory);
    sessionStorage.setItem('SWEETOS_current_query', this.currentQuery);
    sessionStorage.setItem('SWEETOS_current_brand', this.currentBrand || '');
    sessionStorage.setItem('SWEETOS_current_brand_filter', this.currentBrandFilter || 'All');
    if (this.currentProductId !== null) {
      sessionStorage.setItem('SWEETOS_current_product_id', this.currentProductId);
    } else {
      sessionStorage.removeItem('SWEETOS_current_product_id');
    }
    sessionStorage.setItem('SWEETOS_active_profile_tab', this.activeProfileTab);
    this.updateHashURL();

    const contentArea = this.shadowRoot.getElementById('page-content');
    const catRow = this.shadowRoot.getElementById('quick-category-row');
    
    const hero = document.getElementById('main-hero');
    if (hero) {
      hero.style.display = (this.currentPage === 'home') ? 'block' : 'none';
    }

    if (catRow) {
      catRow.style.display = (this.currentPage === 'home' || this.currentPage === 'catalog') ? 'block' : 'none';
    }
    if (this.currentPage === 'home') {
      let sectionsList = [];
      try {
        const storedSecs = localStorage.getItem('SWEETOS_homepage_sections');
        sectionsList = storedSecs ? JSON.parse(storedSecs) : [];
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
      if (sectionsList.length === 0) {
        sectionsList = defaultSecs;
        needsSave = true;
      } else {
        defaultSecs.forEach(ds => {
          if (!sectionsList.some(s => s.id === ds.id)) {
            sectionsList.push(ds);
            needsSave = true;
          }
        });
      }

      // Ensure order index is initialized
      sectionsList.forEach((s, idx) => {
        if (s.order === undefined) {
          s.order = idx;
          needsSave = true;
        }
      });

      if (needsSave) {
        localStorage.setItem('SWEETOS_homepage_sections', JSON.stringify(sectionsList));
      }

      // Sort active sections by order
      const activeSortedSections = sectionsList.filter(s => s.active).sort((a, b) => (a.order || 0) - (b.order || 0));

      let homepageSectionsHTML = '';
      activeSortedSections.forEach(s => {
        if (s.type === 'categories') {
          homepageSectionsHTML += `
            <!-- Shop by Category Section -->
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header">
                <h3 class="section-title">${s.name}</h3>
                <button class="view-all-btn" data-target-page="catalog">View All →</button>
              </div>
              <div class="home-category-grid">
                ${(() => {
                  const storedCats = JSON.parse(localStorage.getItem('SWEETOS_categories') || '[]');
                  return storedCats.map(c => {
                    const descMap = {
                      "Keyboards": "Mechanical layouts & switches",
                      "Audio": "Hi-fi monitors & studio cans",
                      "Lighting": "Ambient screenbars & lightbars",
                      "Desks": "Oak desk risers & shelving"
                    };
                    return `
                      <div class="home-category-card" data-category="${c.name}">
                        <div class="category-marquee-container" id="marquee-${(c.slug || c.name.toLowerCase())}"></div>
                        <div class="cat-glow-circle card-glow-${(c.slug || c.name.toLowerCase())}"></div>
                        <div class="home-category-card-content">
                          <span class="cat-icon">${c.icon || '📁'}</span>
                          <h4>${c.name}</h4>
                          <p>${c.description || descMap[c.name] || 'Premium workspace hardware'}</p>
                          <span class="cat-explore-link">Explore →</span>
                        </div>
                      </div>
                    `;
                  }).join('');
                })()}
              </div>
            </div>
          `;
        } else if (s.type === 'deals') {
          homepageSectionsHTML += `
            <!-- Hot Deals Section -->
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header">
                <h3 class="section-title">${s.name}</h3>
                <button class="view-all-btn" data-target-page="deals">View All →</button>
              </div>
              <div class="home-grid-4" id="grid-hot-deals"></div>
            </div>
          `;
        } else if (s.type === 'new-arrivals') {
          homepageSectionsHTML += `
            <!-- New Arrivals Section -->
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header">
                <h3 class="section-title">${s.name}</h3>
                <button class="view-all-btn" data-target-page="new-arrivals">View All →</button>
              </div>
              <div class="home-grid-4" id="grid-new-arrivals"></div>
            </div>
          `;
        } else if (s.type === 'best-sellers') {
          homepageSectionsHTML += `
            <!-- Best Sellers Section -->
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header">
                <h3 class="section-title">${s.name}</h3>
                <button class="view-all-btn" data-target-page="best-sellers">View All →</button>
              </div>
              <div class="home-grid-4" id="grid-best-sellers"></div>
            </div>
          `;
        } else if (s.type === 'grid') {
          homepageSectionsHTML += `
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header" style="margin-bottom: 24px;">
                <h3 class="section-title" style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin: 0; display: flex; align-items: center; gap: 8px; text-transform: none; letter-spacing: -0.5px;">
                  <span>${s.name}</span>
                  ${s.category ? `<span style="font-size: 11px; font-weight: 700; color: var(--primary); background: var(--primary-light); padding: 3px 8px; border-radius: 6px; text-transform: uppercase; letter-spacing: 0.5px; margin-left: 4px;">${s.category}</span>` : ''}
                </h3>
              </div>
              <div class="home-grid-4" id="grid-dynamic-${s.id}"></div>
            </div>
          `;
        } else if (s.type === 'carousel') {
          homepageSectionsHTML += `
            <div class="home-section" style="margin-bottom: 40px;">
              <div class="section-header" style="margin-bottom: 24px;">
                <h3 class="section-title" style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin:0;">${s.name}</h3>
                <div style="display: flex; gap: 8px;">
                  <button class="carousel-control-btn prev-btn" id="btn-prev-${s.id}" style="border: 1px solid var(--border); border-radius: 8px; width: 36px; height: 36px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: all 0.2s;">←</button>
                  <button class="carousel-control-btn next-btn" id="btn-next-${s.id}" style="border: 1px solid var(--border); border-radius: 8px; width: 36px; height: 36px; background: white; cursor: pointer; display: flex; align-items: center; justify-content: center; font-weight: bold; transition: all 0.2s;">→</button>
                </div>
              </div>
              <div class="carousel-scroll-wrapper" id="carousel-${s.id}" style="overflow-x: auto; scroll-behavior: smooth; display: flex; gap: 20px; padding-bottom: 12px;">
                <!-- Appended dynamically -->
              </div>
            </div>
          `;
        } else if (s.type === 'banner') {
          homepageSectionsHTML += `
            <div class="hero-banner-promo" style="
              background: linear-gradient(135deg, var(--primary) 0%, var(--primary-accent) 100%);
              border-radius: 24px;
              padding: 48px;
              color: white;
              margin-bottom: 40px;
              position: relative;
              overflow: hidden;
              box-shadow: 0 10px 30px rgba(0, 82, 204, 0.1);
              border: 1px solid rgba(255, 255, 255, 0.1);
            ">
              <div style="position: absolute; right: -50px; bottom: -50px; width: 300px; height: 300px; background: rgba(255, 255, 255, 0.1); filter: blur(60px); border-radius: 50%;"></div>
              <div style="max-width: 550px; position: relative; z-index: 2; display: flex; flex-direction: column; gap: 16px;">
                <span style="font-size: 11px; font-weight: 800; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; width: fit-content; text-transform: uppercase; letter-spacing: 0.5px;">PROMOTION</span>
                <h2 style="font-size: 32px; font-weight: 850; margin: 0; color: white; line-height: 1.2;">${s.name}</h2>
                <p style="font-size: 15px; color: rgba(255, 255, 255, 0.85); margin: 0; line-height: 1.6;">Discover our limited release custom collections filtered by ${s.category}. Save up to 20% today.</p>
                <button class="shop-now-btn" style="background: white; color: var(--primary); border: none; padding: 12px 28px; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; width: fit-content; box-shadow: 0 4px 12px rgba(0,0,0,0.1); margin-top: 8px;" data-category="${s.category}">Shop ${s.category} Now</button>
              </div>
            </div>
          `;
        }
      });

      contentArea.innerHTML = `
        ${homepageSectionsHTML}

        <div class="home-section" id="for-you-section" style="margin-bottom: 40px;">
          <div class="section-header" style="margin-bottom: 24px;">
            <h3 class="section-title" style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin:0;">For You</h3>
          </div>
          <div class="home-grid-4" id="grid-for-you"></div>
          
          <div id="for-you-loading" style="display: flex; justify-content: center; align-items: center; padding: 40px; font-weight: 750; color: #ff2e93; gap: 10px; font-size: 14px; opacity: 0; transition: opacity 0.2s ease;">
            <svg width="20" height="20" viewBox="0 0 50 50" style="animation: rotate 1s linear infinite; fill: none; stroke: #ff2e93; stroke-width: 5; stroke-linecap: round;">
              <circle cx="25" cy="25" r="20" stroke-dasharray="80, 200" stroke-dashoffset="0"></circle>
            </svg>
            Loading more premium gear...
          </div>
        </div>
      `;

      this.injectHomeProducts();
      this.startCountdownTimer();
      this.attachHomeCarouselListeners(activeSortedSections);

    } else if (this.currentPage === 'catalog') {
      const breadcrumb = this.currentBrand 
        ? `Home / Brands / ${this.currentBrand}` 
        : `Home / Categories / ${this.currentCategory}`;

      contentArea.innerHTML = `
        <!-- Breadcrumbs Navigation -->
        <nav style="display: flex; gap: 6px; font-size: 12px; color: var(--text-gray); font-weight: 600; margin-bottom: 20px;">
          <span>Home</span>
          <span>/</span>
          <span style="color: var(--text-dark);">${this.currentBrand ? 'Brands' : 'Categories'}</span>
          <span>/</span>
          <span style="color: var(--primary); font-weight: 750;">${this.currentBrand || this.currentCategory}</span>
        </nav>

        <!-- Interactive Category Carousel Hero Banner -->
        <div class="category-carousel-banner animate-in" id="category-carousel-banner">
          <!-- Dynamically populated in injectCatalogCarousel() -->
        </div>

        <!-- Category Title and Item Count -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 36px 0 20px 0; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <h3 style="font-size: 26px; font-weight: 900; color: var(--text-dark); margin: 0; text-transform: uppercase; letter-spacing: -0.5px;" id="catalog-title-header">
            Category: All
          </h3>
          <span style="font-size: 12.5px; font-weight: 700; color: var(--primary); background: rgba(0, 82, 204, 0.08); padding: 6px 14px; border-radius: 20px;" id="catalog-count-badge">
            0 Items Found
          </span>
        </div>

        <!-- Horizontal Subcategory Pills Grid -->
        <div class="category-pills-row" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px;">
          <button class="category-pill-btn ${this.currentCategory === 'All' ? 'active' : ''}" data-category="All">
            <span class="pill-icon">💙</span> Tout
          </button>
          ${(() => {
            const categories = JSON.parse(localStorage.getItem('SWEETOS_categories') || '[]');
            return categories.map(c => `
              <button class="category-pill-btn ${this.currentCategory === c.name ? 'active' : ''}" data-category="${c.name}">
                <span class="pill-icon">${c.icon || '📁'}</span> ${c.name}
              </button>
            `).join('');
          })()}
        </div>

        <div id="catalog-grouped-sections"></div>
        <div class="no-results" id="no-results" style="display: none;">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"></circle>
            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            <line x1="8" y1="11" x2="14" y2="11"></line>
          </svg>
          <h3>No products match your search</h3>
          <p>Try checking your spelling or adjusting your filters.</p>
          <button class="btn-primary" id="reset-filter-btn">Reset Search</button>
        </div>
      `;
      this.injectCatalogCarousel();
      this.injectCatalogProducts();

    } else if (this.currentPage === 'deals') {
      contentArea.innerHTML = `
        <!-- Sleek Samsung Count Down Hero Banner -->
        <div class="deals-hero-banner animate-in">
          <!-- Background oval glow shape in banner -->
          <div class="deals-hero-glow"></div>
          
          <div class="deals-hero-content">
            <span class="deals-hero-badge">🔥 LIMITED TIME OFFER</span>
            <h2>Smartphones & Tablets</h2>
            <p>Hurry! Take advantage of discounts of up to 50% on our collection.</p>
            
            <!-- Countdown Columns Row -->
            <div class="deals-countdown-row">
              <div class="deals-countdown-block">
                <span class="time-num" id="deals-days">06</span>
                <span class="time-lbl">DAYS</span>
              </div>
              <div class="deals-countdown-block">
                <span class="time-num" id="deals-hours">23</span>
                <span class="time-lbl">HOURS</span>
              </div>
              <div class="deals-countdown-block">
                <span class="time-num" id="deals-mins">59</span>
                <span class="time-lbl">MINS</span>
              </div>
              <div class="deals-countdown-block">
                <span class="time-num" id="deals-secs">00</span>
                <span class="time-lbl">SECS</span>
              </div>
            </div>
            <!-- Countdown Columns Row Ends -->
          </div>
        </div>

        <div class="shop-header" style="margin-top: 10px;">
          <h3 class="shop-title">Hot Deals & Promos</h3>
          <p class="shop-subtitle">Save on premium desk pads, mechanical modules, and DAC hardware.</p>
        </div>
        <div class="product-grid" id="grid-deals"></div>
      `;
      this.injectCategorizedProducts('deals');
      this.startDealsCountdownTimer();
      this.attachDealsHeroListeners();

    } else if (this.currentPage === 'new-arrivals') {
      contentArea.innerHTML = `
        <div class="page-hero-banner page-new-arrivals animate-in">
          <div class="page-hero-glow"></div>
          <div class="page-hero-content">
            <span class="page-hero-badge">✨ FRESH ARRIVALS</span>
            <h2>New Arrivals</h2>
            <p>The absolute latest additions in keycaps, wall hexagon tiles, and accent shelves.</p>
          </div>
        </div>
        <div class="product-grid" id="grid-new"></div>
      `;
      this.injectCategorizedProducts('new');

    } else if (this.currentPage === 'best-sellers') {
      contentArea.innerHTML = `
        <div class="page-hero-banner page-best-sellers animate-in">
          <div class="page-hero-glow"></div>
          <div class="page-hero-content">
            <span class="page-hero-badge">🏆 POPULAR SELECTIONS</span>
            <h2>Best Sellers</h2>
            <p>Our most popular community choices in dynamic audio, mechanical switches, and premium layouts.</p>
          </div>
        </div>
        <div class="product-grid" id="grid-best"></div>
      `;
      this.injectCategorizedProducts('best');

    } else if (this.currentPage === 'brands') {
      contentArea.innerHTML = `
        <!-- Breadcrumbs Navigation -->
        <nav style="display: flex; gap: 6px; font-size: 12px; color: var(--text-gray); font-weight: 600; margin-bottom: 20px;">
          <span>Home</span>
          <span>/</span>
          <span style="color: var(--text-dark);">Creator Houses</span>
          <span>/</span>
          <span style="color: var(--primary); font-weight: 750;">${this.currentBrandFilter}</span>
        </nav>

        <!-- Interactive Brand Carousel Hero Banner -->
        <div class="category-carousel-banner animate-in" id="brand-carousel-banner">
          <!-- Dynamically populated in injectBrandCarousel() -->
        </div>

        <!-- Brand Title and Item Count -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin: 36px 0 20px 0; flex-wrap: wrap; gap: 12px; border-bottom: 1px solid var(--border); padding-bottom: 16px;">
          <h3 style="font-size: 26px; font-weight: 900; color: var(--text-dark); margin: 0; text-transform: uppercase; letter-spacing: -0.5px;" id="brand-title-header">
            Brand: All
          </h3>
          <span style="font-size: 12.5px; font-weight: 700; color: var(--primary); background: rgba(0, 82, 204, 0.08); padding: 6px 14px; border-radius: 20px;" id="brand-count-badge">
            0 Items Found
          </span>
        </div>

        <!-- Horizontal Brand Pills Row -->
        <div class="category-pills-row" style="display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 36px;">
          <button class="brand-pill-btn ${this.currentBrandFilter === 'All' ? 'active' : ''}" data-brand="All">
            <span class="pill-icon">💙</span> Tout
          </button>
          ${(() => {
            const brands = JSON.parse(localStorage.getItem('SWEETOS_brands') || '[]');
            return brands.map(b => `
              <button class="brand-pill-btn ${this.currentBrandFilter === b.name ? 'active' : ''}" data-brand="${b.name}">
                <span class="pill-icon">${b.logo || '🏷️'}</span> ${b.name}
              </button>
            `).join('');
          })()}
        </div>

        <div id="brands-grouped-container"></div>
      `;
      this.injectBrandCarousel();
      this.injectBrandsGrouped();

    } else if (this.currentPage === 'collections') {
      contentArea.innerHTML = `
        <div class="page-hero-banner page-collections animate-in">
          <div class="page-hero-glow"></div>
          <div class="page-hero-content-wrapper">
            <div class="page-hero-content">
              <span class="page-hero-badge">🎒 DESIGN BLUEPRINTS</span>
              <h2>Curated Workspace Collections</h2>
              <p>Pre-packaged theme setups designed by workspace specialists. Elevate your focus in one click.</p>
            </div>
            <button class="btn-primary" id="col-header-create-btn" style="height: 40px; padding: 0 20px; font-weight: 750; border-radius: 10px; background: white; color: var(--primary); border: none; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              + Create Collection
            </button>
          </div>
        </div>
        <div class="collections-dashboard-grid" id="collections-dashboard-grid"></div>
      `;
      this.injectCuratedCollections();
      this.attachCollectionsHeaderListeners();

    } else if (this.currentPage === 'wishlist') {
      const wishlist = this.loadWishlistFromStorage();

      contentArea.innerHTML = `
        <div class="wishlist-container animate-in">
          <div class="page-hero-banner page-wishlist animate-in">
            <div class="page-hero-glow"></div>
            <div class="page-hero-content">
              <span class="page-hero-badge">💖 DREAM BLUEPRINTS</span>
              <h2>Your Curated Wishlist</h2>
              <p>High-end layouts and accessories saved for your dream workspace blueprint.</p>
            </div>
          </div>

          ${wishlist.length === 0 ? `
            <div class="wishlist-empty-card glass-panel" style="margin-top: 24px;">
              <div class="wishlist-floating-heart">💖</div>
              <h4>Your workspace collections await.</h4>
              <p>Save your favorite mechanical keyboards, active audio arrays, and ambient lights to curate your layout blueprint.</p>
              <button class="btn-primary wishlist-browse-btn" id="wishlist-explore-btn">Browse Catalog</button>
            </div>
          ` : `
            <div class="home-grid-4" style="margin-top: 24px;">
              ${wishlist.map(p => `
                <div class="wishlist-item-card glass-panel" data-id="${p.id}">
                  <button class="wishlist-item-remove-btn" data-id="${p.id}" title="Remove from Wishlist">×</button>
                  
                  <div class="wishlist-item-image">
                    <img src="${p.image}" alt="${p.name}">
                  </div>
                  
                  <div class="wishlist-item-details">
                    <span class="wishlist-item-cat">${p.category === 'Keyboards' ? '⌨️' : p.category === 'Audio' ? '🎧' : p.category === 'Lighting' ? '🌌' : '🪵'} ${p.category}</span>
                    <h4 class="wishlist-item-title">${p.name}</h4>
                    <div class="wishlist-item-price">${formatPrice(p.price)}</div>
                  </div>

                  <div class="wishlist-item-actions">
                    <button class="wishlist-add-to-cart-btn btn-primary" data-id="${p.id}">
                      Add to Cart
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          `}
        </div>
      `;

      this.attachWishlistListeners();

    } else if (['about-us', 'terms', 'refund', 'contact'].includes(this.currentPage)) {
      contentArea.innerHTML = `
        <div class="about-page-container animate-in" style="padding-bottom: 40px;">
          <div class="page-hero-banner page-about animate-in" style="margin-bottom: 24px;">
            <div class="page-hero-glow"></div>
            <div class="page-hero-content">
              <span class="page-hero-badge">🌿 KNOWLEDGE BASE</span>
              <h2>SWEETOS Information Desk</h2>
              <p>Explore our company story, design standards, policies, or contact our support concierge.</p>
            </div>
          </div>

          <!-- Dynamic Page Navigation Tabs -->
          <div class="profile-sidebar-tabs" style="display: flex; flex-direction: row; gap: 12px; margin-bottom: 24px; width: 100%; border-bottom: 1.5px solid var(--border); padding-bottom: 16px; justify-content: flex-start; flex-wrap: wrap;">
            <button class="profile-tab-btn ${this.currentPage === 'about-us' ? 'active' : ''}" data-nav-page="about-us" style="margin: 0; padding: 10px 20px; border-radius: 10px; height: auto;">
              🌿 About Us
            </button>
            <button class="profile-tab-btn ${this.currentPage === 'terms' ? 'active' : ''}" data-nav-page="terms" style="margin: 0; padding: 10px 20px; border-radius: 10px; height: auto;">
              📄 Terms & Conditions
            </button>
            <button class="profile-tab-btn ${this.currentPage === 'refund' ? 'active' : ''}" data-nav-page="refund" style="margin: 0; padding: 10px 20px; border-radius: 10px; height: auto;">
              🔄 Refund Policy
            </button>
            <button class="profile-tab-btn ${this.currentPage === 'contact' ? 'active' : ''}" data-nav-page="contact" style="margin: 0; padding: 10px 20px; border-radius: 10px; height: auto;">
              ✉️  Contact Us
            </button>
          </div>

          <!-- Tab Content Panel -->
          <div class="about-content-panel" id="about-tab-content" style="background: rgba(255,255,255,0.7); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border: 1.5px solid var(--border); border-radius: 20px; padding: 40px; box-shadow: 0 10px 30px rgba(0, 82, 204, 0.02);">
            <!-- Swapped tab content dynamically injected -->
          </div>
        </div>
      `;

      this.activeAboutTab = this.currentPage;
      this.injectAboutTabContent();
      this.attachAboutPageListeners();

    } else if (this.currentPage === 'coupons') {
      let scratchcardsList = [];
      try {
        const stored = localStorage.getItem('SWEETOS_user_scratchcards');
        let rawList = stored ? JSON.parse(stored) : [];
        const now = Date.now();
        // Exclude scratchcards that are unscratched and past their 14-day expiry date
        scratchcardsList = rawList.filter(card => {
          if (!card.scratched && card.expiresAt && now > card.expiresAt) {
            return false;
          }
          return true;
        });
      } catch(e) {}
      
      if (this.currentCouponCode) {
        let couponsList = [];
        try {
          couponsList = JSON.parse(localStorage.getItem('SWEETOS_coupons') || '[]');
        } catch(e) {}
        const c = couponsList.find(item => item.code === this.currentCouponCode);
        if (c) {
          const discountText = c.type === 'percentage' ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`;
          contentArea.innerHTML = `
            <div class="pdp-container animate-in" style="max-width: 600px; margin: 0 auto; padding-top: 20px;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 30px; flex-wrap: wrap; gap: 12px;">
                <button class="pdp-back-btn" id="coupon-back-btn">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; transform: scaleX(-1);"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                  Retour / Back
                </button>
                <div class="pdp-breadcrumb" style="margin: 0;">
                  <span class="pdp-crumb-item" id="coupon-crumb-home">Home</span>
                  <span class="pdp-crumb-sep">›</span>
                  <span class="pdp-crumb-item" id="coupon-crumb-list">Coupons</span>
                  <span class="pdp-crumb-sep">›</span>
                  <span class="pdp-crumb-current">${c.code}</span>
                </div>
              </div>

              <div class="glass-panel" style="border: 2px dashed var(--primary); padding: 40px; border-radius: 24px; text-align: center; background: rgba(255, 255, 255, 0.4); box-shadow: 0 10px 30px rgba(0,0,0,0.05); position: relative; overflow: hidden; display: flex; flex-direction: column; align-items: center; gap: 24px;">
                <div style="position: absolute; top: -50px; right: -50px; width: 150px; height: 150px; background: var(--primary-light); filter: blur(50px); border-radius: 50%; z-index: 1;"></div>
                
                <div style="font-size: 48px; position: relative; z-index: 2;">🎫</div>
                
                <div style="position: relative; z-index: 2;">
                  <h2 style="font-size: 28px; font-weight: 850; color: var(--text-dark); margin: 0 0 8px 0;">${discountText}</h2>
                  <p style="font-size: 14px; color: var(--text-gray); font-weight: 600; margin: 0;">Promo Code Voucher</p>
                </div>

                <div style="background: white; border: 1.5px solid var(--border); padding: 16px 32px; border-radius: 16px; font-size: 24px; font-weight: 900; letter-spacing: 2px; color: var(--primary); display: inline-block; cursor: pointer; position: relative; z-index: 2; box-shadow: 0 4px 12px rgba(0,0,0,0.03);" id="detail-coupon-code-box" title="Click to copy code">
                  ${c.code}
                </div>

                <div style="width: 100%; border-top: 1.5px solid var(--border); margin: 10px 0; position: relative; z-index: 2;"></div>

                <div style="text-align: left; width: 100%; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; color: var(--text-dark); position: relative; z-index: 2;">
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-light); font-weight: 600;">Minimum Order:</span>
                    <strong style="font-weight: 750;">${c.minOrder ? `${formatPrice(c.minOrder)}` : 'No minimum order'}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-light); font-weight: 600;">Expires On:</span>
                    <strong style="font-weight: 750;">${c.expiry}</strong>
                  </div>
                  <div style="display: flex; justify-content: space-between;">
                    <span style="color: var(--text-light); font-weight: 600;">Status:</span>
                    <span style="font-weight: 800; color: #36b37e; text-transform: uppercase;">Active</span>
                  </div>
                </div>

                <div style="display: flex; gap: 12px; width: 100%; margin-top: 16px; position: relative; z-index: 2;">
                  <button id="detail-coupon-apply-btn" style="flex: 1; background: var(--primary); color: white; border: none; padding: 14px; border-radius: 12px; font-weight: 800; font-size: 14px; cursor: pointer; transition: all 0.2s; box-shadow: 0 4px 12px var(--primary-light);">
                    Apply to Cart
                  </button>
                  <button id="detail-coupon-share-btn" style="background: #25d366; color: white; border: none; padding: 14px 20px; border-radius: 12px; font-weight: 850; font-size: 14px; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 8px;" title="Partager sur WhatsApp">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" style="width: 18px; height: 18px;"><path d="M17.472 14.382c-.022-.08-.124-.184-.282-.232-.078-.024-.464-.232-.536-.252-.072-.02-.124-.03-.178.05-.054.082-.21.26-.258.312-.048.052-.096.06-.178.02a1.866 1.866 0 0 1-.502-.308c-.287-.25-.482-.56-.538-.65-.056-.092-.006-.142.04-.188.04-.04.096-.11.144-.168.048-.058.064-.1.096-.168.032-.068.016-.128-.008-.178-.024-.05-.178-.436-.244-.594-.064-.158-.13-.136-.178-.138-.046-.002-.098-.002-.15-.002a.287.287 0 0 0-.208.098c-.072.078-.276.27-.276.658 0 .388.282.764.32.816.04.052.556.85 1.348 1.192.188.082.336.13.45.166.19.06.362.052.498.032.152-.022.464-.19.53-.374.066-.184.066-.342.046-.374-.022-.03-.078-.05-.156-.088zm-5.467 1.162a6.3 6.3 0 0 1-3.237-.893l-.233-.14-2.404.63 2.443-2.38-.152-.243a6.262 6.262 0 0 1-.958-3.326c0-3.468 2.82-6.29 6.29-6.29 3.47 0 6.29 2.822 6.29 6.29 0 3.47-2.82 6.29-6.29 6.29zm0-13.82c-4.148 0-7.527 3.38-7.527 7.527 0 1.326.347 2.62 1.006 3.766L4 19.5l4.636-1.216a7.487 7.487 0 0 0 3.37.804c4.148 0 7.527-3.378 7.527-7.527 0-4.15-3.38-7.527-7.527-7.527z"/></svg>
                    Partager / Share
                  </button>
                </div>
              </div>
            </div>
          `;
          this.attachCouponDetailListeners(c);
        } else {
          this.currentCouponCode = null;
          this.renderPageContent();
        }
      } else {
        let scratchCardsGridHtml = '';
        if (scratchcardsList.length === 0) {
          scratchCardsGridHtml = `
            <div class="glass-panel text-center animate-in" style="padding: 50px; border-radius: 16px; border: 1.5px solid var(--border); background: rgba(255, 255, 255, 0.4); text-align: center; width: 100%;">
              <span style="font-size: 36px; display: block; margin-bottom: 12px;">🎁</span>
              <h4 style="font-size: 16px; font-weight: 800; color: var(--text-dark); margin: 0 0 6px 0;">Aucune Boîte Mystère / No Mystery Boxes</h4>
              <p style="font-size: 13.5px; color: var(--text-gray); margin: 0;">Faites des achats sur notre boutique pour débloquer des boîtes mystères !</p>
            </div>
          `;
        } else {
          scratchCardsGridHtml = `
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;" class="animate-in">
              ${scratchcardsList.map(card => {
                if (!card.scratched) {
                  return `
                    <div style="position: relative; width: 280px; height: 180px; border-radius: 16px; overflow: hidden; border: 1.5px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                      <canvas class="scratch-canvas" data-scratchcard-id="${card.id}" width="280" height="180" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; cursor: crosshair; z-index: 10;"></canvas>
                      <div class="scratch-revealed-content" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; text-align: center; background: white; z-index: 5;">
                        <!-- Decided dynamically when scratching completes -->
                      </div>
                    </div>
                  `;
                } else {
                  if (card.couponWon === 'lost') {
                    return `
                      <div style="width: 280px; height: 180px; border-radius: 16px; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 16px; box-sizing: border-box; text-align: center; background: rgba(255,255,255,0.5); border: 1.5px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.02);">
                        <span style="font-size: 32px; display: block; margin-bottom: 8px;">😢</span>
                        <h4 style="font-size: 15px; font-weight: 850; color: var(--text-dark); margin: 0 0 4px 0;">Bonne chance la prochaine fois !</h4>
                        <p style="font-size: 12.5px; color: var(--text-gray); margin: 0;">Oops! Good luck next time!</p>
                      </div>
                    `;
                  } else {
                    const c = card.couponWon;
                    const discountText = c.type === 'percentage' ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`;
                    return `
                      <div class="unlocked-coupon-card" data-coupon-code="${c.code}" style="width: 280px; height: 180px; border-radius: 16px; display: flex; flex-direction: column; justify-content: space-between; padding: 20px; box-sizing: border-box; background: white; border: 2px dashed var(--primary); box-shadow: 0 4px 15px rgba(0,0,0,0.03); cursor: pointer; transition: all 0.2s;">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                          <span style="font-size: 20px;">🎉 GAGNÉ !</span>
                          <span style="font-size: 10px; font-weight: 800; color: var(--primary); background: var(--primary-light); padding: 3px 8px; border-radius: 6px; text-transform: uppercase;">Won</span>
                        </div>
                        <div>
                          <h4 style="font-size: 16px; font-weight: 850; color: var(--text-dark); margin: 0 0 4px 0;">${discountText}</h4>
                          <code style="font-size: 13px; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; background: var(--primary-light); padding: 3px 8px; border-radius: 4px; display: inline-block;">${c.code}</code>
                        </div>
                        <div style="border-top: 1px solid var(--border); padding-top: 8px; font-size: 11px; color: var(--text-gray); font-weight: 600; display: flex; justify-content: space-between; align-items: center; width: 100%;">
                          <span>Exp: ${c.expiry}</span>
                          <span style="color: var(--primary); font-weight: 800;">Détails →</span>
                        </div>
                      </div>
                    `;
                  }
                }
              }).join('')}
            </div>
          `;
        }
        
        const wonCoupons = scratchcardsList.filter(sc => sc.scratched && sc.couponWon !== 'lost').map(sc => sc.couponWon);
        let unlockedCouponsHtml = '';
        if (wonCoupons.length > 0) {
          unlockedCouponsHtml = `
            <div style="margin-top: 40px; width: 100%;">
              <h3 style="font-size: 18px; font-weight: 850; color: var(--text-dark); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                <span>🎫</span> Mes Coupons Débloqués / My Unlocked Coupons
              </h3>
              <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 20px;" class="animate-in">
                ${wonCoupons.map(c => {
                  const discountText = c.type === 'percentage' ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`;
                  return `
                    <div class="unlocked-coupon-card" data-coupon-code="${c.code}" style="position: relative; background: rgba(255, 255, 255, 0.4); border: 2px dashed var(--border); border-radius: 16px; padding: 24px; display: flex; flex-direction: column; justify-content: space-between; gap: 16px; box-shadow: 0 4px 15px rgba(0,0,0,0.02); transition: all 0.2s ease; min-height: 180px; cursor: pointer;">
                      <div style="display: flex; justify-content: space-between; align-items: flex-start; width: 100%;">
                        <span style="font-size: 24px;">🎟️</span>
                        <span style="font-size: 11px; font-weight: 800; color: var(--primary); background: var(--primary-light); padding: 4px 10px; border-radius: 8px; text-transform: uppercase;">Actif</span>
                      </div>
                      
                      <div>
                        <h4 style="font-size: 18px; font-weight: 850; color: var(--text-dark); margin: 0 0 6px 0;">${discountText}</h4>
                        <code style="font-size: 14px; font-weight: 800; color: var(--primary); letter-spacing: 0.5px; background: white; padding: 4px 10px; border-radius: 6px; border: 1.5px solid var(--border); display: inline-block;">${c.code}</code>
                      </div>

                      <div style="border-top: 1px solid var(--border); padding-top: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 11.5px; color: var(--text-gray); font-weight: 600;">
                        <span>Exp: ${c.expiry}</span>
                        <span style="color: var(--primary); font-weight: 800; display: flex; align-items: center; gap: 4px;">Détails →</span>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }

        contentArea.innerHTML = `
          <div class="about-page-container animate-in" style="padding-bottom: 40px;">
            <div class="page-hero-banner page-about animate-in" style="margin-bottom: 30px;">
              <div class="page-hero-glow"></div>
              <div class="page-hero-content">
                <span class="page-hero-badge">🎁 BOÎTES MYSTÈRES</span>
                <h2>Boîtes Mystères & Récompenses / Mystery Boxes & Rewards</h2>
                <p>Débloquez et grattez des boîtes mystères après la livraison de vos commandes pour gagner des coupons.</p>
              </div>
            </div>
            
            <h3 style="font-size: 18px; font-weight: 850; color: var(--text-dark); margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
              <span>🎁</span> Mes Boîtes Mystères / My Mystery Boxes
            </h3>
            
            ${scratchCardsGridHtml}
            ${unlockedCouponsHtml}
          </div>
        `;
        
        this.attachCouponsListListeners();
      }

    } else if (this.currentPage === 'profile') {
      contentArea.innerHTML = `
        <div class="page-hero-banner page-profile animate-in" style="margin-bottom: 24px;">
          <div class="page-hero-glow"></div>
          <div class="page-hero-content">
            <span class="page-hero-badge">👤 USER DASHBOARD</span>
            <h2>Profile Settings</h2>
            <p>Manage your account credentials, security access protocols, and cloud shipping addresses.</p>
          </div>
        </div>

        <div class="profile-page-container">
          <div class="profile-sidebar-tabs">
            <button class="profile-tab-btn ${this.activeProfileTab === 'overview' ? 'active' : ''}" data-tab="overview">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect>
                <rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect>
              </svg>
              Overview Dashboard
            </button>
            <button class="profile-tab-btn ${this.activeProfileTab === 'settings' ? 'active' : ''}" data-tab="settings">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>
              </svg>
              Edit Profile Info
            </button>
            <button class="profile-tab-btn ${this.activeProfileTab === 'addresses' ? 'active' : ''}" data-tab="addresses">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle>
              </svg>
              Saved Addresses
            </button>
            <button class="profile-tab-btn ${this.activeProfileTab === 'security' ? 'active' : ''}" data-tab="security">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              Security & Safety
            </button>
            <button class="profile-tab-btn" id="profile-sign-out-btn" style="color: var(--red); margin-top: auto; border: 1px solid rgba(255, 86, 48, 0.15);">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: var(--red);">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                <polyline points="16 17 21 12 16 7"></polyline>
                <line x1="21" y1="12" x2="9" y2="12"></line>
              </svg>
              Sign Out
            </button>
          </div>
          <div class="profile-content-panel glass-panel" id="profile-tab-content">
            <!-- Swapped tab content dynamically injected -->
          </div>
        </div>
      `;
      
      this.injectProfileTabContent();
      this.attachProfileTabListeners();

    } else if (this.currentPage === 'orders') {
      contentArea.innerHTML = `
        <div class="orders-page-container animate-in">
          <!-- Top Title Banner -->
          <div class="page-hero-banner page-orders animate-in" style="margin-bottom: 24px;">
            <div class="page-hero-glow"></div>
            <div class="page-hero-content-wrapper">
              <div class="page-hero-content">
                <span class="page-hero-badge">📦 LIVE TRACKING</span>
                <h2>Your Real-time Orders</h2>
                <p>Live tracking, real-time status sync, and cloud-persisted order management.</p>
              </div>
              <div class="header-action-block">
                <button class="orders-action-nav-btn btn-primary" id="orders-continue-shopping-btn" style="background: white; color: var(--primary); border: none; border-radius: 10px; height: 40px; padding: 0 20px; font-weight:750; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px; vertical-align:middle;">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                    <line x1="3" y1="6" x2="21" y2="6"></line>
                    <path d="M16 10a4 4 0 0 1-8 0"></path>
                  </svg>
                  Continue Shopping
                </button>
                <button class="orders-action-nav-btn btn-secondary" id="orders-export-btn" style="background: rgba(255,255,255,0.12); color: white; border: 1.5px solid rgba(255,255,255,0.25); border-radius: 10px; height: 40px; padding: 0 20px; font-weight:750;">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:6px; vertical-align:middle;">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="7 10 12 15 17 10"></polyline>
                    <line x1="12" y1="15" x2="12" y2="3"></line>
                  </svg>
                  Export Order History
                </button>
              </div>
            </div>
          </div>

          <!-- Stats Cards Grid -->
          <div class="orders-stats-grid">
            <div class="order-stat-card glass-panel">
              <div class="stat-left">
                <span class="stat-label">TOTAL ORDERS</span>
                <span class="stat-value text-blue" id="stat-total-orders">0</span>
              </div>
              <div class="stat-icon-wrapper blue-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
                  <polyline points="2 17 12 22 22 17"></polyline>
                  <polyline points="2 12 12 17 22 12"></polyline>
                </svg>
              </div>
            </div>

            <div class="order-stat-card glass-panel">
              <div class="stat-left">
                <span class="stat-label">IN TRANSIT</span>
                <span class="stat-value text-blue" id="stat-in-transit">0</span>
              </div>
              <div class="stat-icon-wrapper truck-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="1" y="3" width="15" height="13"></rect>
                  <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                  <circle cx="5.5" cy="18.5" r="2.5"></circle>
                  <circle cx="18.5" cy="18.5" r="2.5"></circle>
                </svg>
              </div>
            </div>

            <div class="order-stat-card glass-panel">
              <div class="stat-left">
                <span class="stat-label">PROCESSING</span>
                <span class="stat-value text-orange" id="stat-processing">0</span>
              </div>
              <div class="stat-icon-wrapper orange-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <circle cx="12" cy="12" r="10"></circle>
                  <polyline points="12 6 12 12 16 14"></polyline>
                </svg>
              </div>
            </div>

            <div class="order-stat-card glass-panel">
              <div class="stat-left">
                <span class="stat-label">TOTAL SPENT</span>
                <span class="stat-value text-green" id="stat-total-spent">0 F CFA</span>
              </div>
              <div class="stat-icon-wrapper green-box">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5">
                  <rect x="2" y="4" width="20" height="16" rx="2" ry="2"></rect>
                  <line x1="2" y1="10" x2="22" y2="10"></line>
                </svg>
              </div>
            </div>
          </div>

          <!-- Filters & Search Panel -->
          <div class="orders-filter-control-panel glass-panel">
            <div class="filter-top-row">
              <div class="search-input-box">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" class="search-icon">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" id="orders-search-input" placeholder="Search live by Order ID or item name...">
              </div>
              <div class="timeframe-box">
                <span class="timeframe-label">TIMEFRAME:</span>
                <select id="orders-timeframe-selector">
                  <option value="All Time">All Time</option>
                  <option value="Last 30 Days">Last 30 Days</option>
                  <option value="Last 6 Months">Last 6 Months</option>
                  <option value="This Year">This Year</option>
                </select>
              </div>
            </div>

            <!-- Tab pills -->
            <div class="orders-tab-pills-row" style="gap: 8px; flex-wrap: wrap;">
              <button class="order-pill-btn active" data-filter="All">All <span class="pill-badge" id="badge-all">0</span></button>
              <button class="order-pill-btn" data-filter="Placed">Placed <span class="pill-badge" id="badge-placed">0</span></button>
              <button class="order-pill-btn" data-filter="Confirm">Confirm <span class="pill-badge" id="badge-confirm">0</span></button>
              <button class="order-pill-btn" data-filter="Processing">Processing <span class="pill-badge" id="badge-processing">0</span></button>
              <button class="order-pill-btn" data-filter="Shipping">Shipping <span class="pill-badge" id="badge-shipping">0</span></button>
              <button class="order-pill-btn" data-filter="Done">Done <span class="pill-badge" id="badge-done">0</span></button>
              <button class="order-pill-btn" data-filter="Cancelled">Cancelled <span class="pill-badge" id="badge-cancelled">0</span></button>
            </div>
          </div>

          <!-- Active orders list -->
          <div class="orders-dashboard-list" id="orders-dashboard-list"></div>
        </div>
      `;
      
      this.ordersSearchQuery = '';
      this.ordersTimeframe = 'All Time';
      this.activeOrdersFilter = 'All';
      
      this.injectOrdersDashboardList();
      this.attachOrdersDashboardListeners();

    } else if (this.currentPage === 'product-details') {
      const p = this.products.find(item => item.id === this.currentProductId) || this.products[0];
      
      const originalPrice = p.price / 0.8;
      const savingsVal = originalPrice - p.price;
      const discountPercentage = 20;

      const colorsMap = {
        Keyboards: [
          { name: 'Opal White', code: '#f0f4f8' },
          { name: 'Cobalt Blue', code: '#0052cc' },
          { name: 'Felt Brown', code: '#92400e' },
          { name: 'Light Gold', code: '#fef3c7' }
        ],
        Audio: [
          { name: 'Studio Black', code: '#102a43' },
          { name: 'Ice Blue', code: '#00b4d8' },
          { name: 'Sunset Bronze', code: '#ff9a3c' },
          { name: 'Pure White', code: '#ffffff' }
        ],
        Lighting: [
          { name: 'Aurora RGB', code: '#ff2e93' },
          { name: 'Warm Amber', code: '#ff9a3c' },
          { name: 'Ice White', code: '#f0f4f8' }
        ],
        Desks: [
          { name: 'Space Grey', code: '#486581' },
          { name: 'Natural Oak', code: '#d9b48f' },
          { name: 'White Felt', code: '#ffffff' }
        ]
      };

      const categoryColors = colorsMap[p.category] || colorsMap['Keyboards'];
      if (!this.selectedColor) {
        this.selectedColor = categoryColors[0].name;
      }

      const reviews = this.loadProductReviews(p.id, p.rating, p.reviews);
      
      const totalReviewsCount = reviews.length;
      const averageRating = totalReviewsCount > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1) : "0.0";
      
      const starCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
      reviews.forEach(r => {
        if (starCounts[r.rating] !== undefined) {
          starCounts[r.rating]++;
        }
      });
      
      const starPercentages = {};
      Object.keys(starCounts).forEach(star => {
        starPercentages[star] = totalReviewsCount > 0 
          ? Math.round((starCounts[star] / totalReviewsCount) * 100) 
          : 0;
      });

      const filteredReviews = reviews.filter(r => {
        if (this.activeReviewFilter === 'All') return true;
        return r.rating.toString() === this.activeReviewFilter;
      });

      const reviewsToShow = filteredReviews.slice(0, this.visibleReviewsCount);
      const hasMoreReviews = filteredReviews.length > this.visibleReviewsCount;

      const wishlist = this.loadWishlistFromStorage();
      const isWishlisted = wishlist.some(item => item.id === p.id);
      const stockVal = p.stock !== undefined ? p.stock : 34;
      const thresholdVal = p.threshold || 5;
      const isOutOfStock = stockVal === 0;
      const isLowStock = stockVal <= thresholdVal && stockVal > 0;
      
      let stockLineHtml = '';
      if (isOutOfStock) {
        stockLineHtml = `<span class="pdp-stock-status-line" style="color: #ff5630; font-weight: 750; margin-top: 12px; display: block;">✕ Rupture de Stock / Out of Stock</span>`;
      } else if (isLowStock) {
        stockLineHtml = `<span class="pdp-stock-status-line" style="color: #ffab00; font-weight: 750; margin-top: 12px; display: block;">⚠️ Stock Faible / Low Stock (Only ${stockVal} left!)</span>`;
      } else {
        stockLineHtml = `<span class="pdp-stock-status-line" style="color: #36b37e; font-weight: 750; margin-top: 12px; display: block;">✓ En Stock / In Stock (${stockVal} available)</span>`;
      }

      contentArea.innerHTML = `
        <div class="pdp-container">
          <!-- Back button & Breadcrumbs Row -->
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; gap: 16px; flex-wrap: wrap;">
            <button class="pdp-back-btn" id="pdp-back-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; transform: scaleX(-1);"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
              Retour / Back
            </button>
            
            <div class="pdp-breadcrumb" style="margin-bottom: 0;">
              <span class="pdp-crumb-item" id="crumb-home">Home</span>
              <span class="pdp-crumb-sep">›</span>
              <span class="pdp-crumb-item" id="crumb-catalog">Catalog</span>
              <span class="pdp-crumb-sep">›</span>
              <span class="pdp-crumb-item" id="crumb-cat-name">${p.category}</span>
              <span class="pdp-crumb-sep">›</span>
              <span class="pdp-crumb-current">${p.name}</span>
            </div>
          </div>

          <div class="pdp-grid">
            <!-- Left media showcase with Hover to Zoom -->
            <div class="pdp-media-column">
              <div class="pdp-media-panel glass-panel">
                <span class="pdp-discount-badge">-${discountPercentage}%</span>
                <button class="pdp-wishlist-heart-btn ${isWishlisted ? 'wishlisted' : ''}" id="pdp-wish-btn" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="${isWishlisted ? 'var(--red)' : 'none'}" stroke="${isWishlisted ? 'var(--red)' : 'currentColor'}" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>
                <img src="${p.image}" alt="${p.name}" class="pdp-main-image">
                <span class="pdp-zoom-badge">Hover to Zoom</span>
              </div>

              <!-- Thumbnails row -->
              <div class="pdp-thumbnails-row">
                <div class="pdp-thumb-card active" data-index="0">
                  <img src="${p.image}" alt="Thumb 1">
                </div>
                <div class="pdp-thumb-card" data-index="1">
                  <img src="${p.image}" alt="Thumb 2">
                </div>
                <div class="pdp-thumb-card" data-index="2">
                  <img src="${p.image}" alt="Thumb 3">
                </div>
                <div class="pdp-thumb-card" data-index="3">
                  <img src="${p.image}" alt="Thumb 4">
                </div>
              </div>
            </div>

            <!-- Right details column -->
            <div class="pdp-info-column">
              <span class="pdp-label-brand">${p.category === 'Keyboards' ? '⌨️' : p.category === 'Audio' ? '🎧' : p.category === 'Lighting' ? '🌌' : '🪵'} NOVASHOP ACCESSORIES — ${p.category.toUpperCase()}</span>
              <h1 class="pdp-title">${p.name}</h1>
              <p class="pdp-subtitle">${p.shortDesc}</p>

              <!-- Ratings Row -->
              <div class="pdp-meta-ratings">
                <div class="pdp-stars">★ ★ ★ ★ ★</div>
                <span class="pdp-rating-num">${averageRating} / 5.0</span>
                <a href="#" class="pdp-reviews-link" id="reviews-jump-btn">${totalReviewsCount} reviews</a>
              </div>

              <!-- Price Box card container -->
              <div class="pdp-price-container">
                <span class="pdp-price-current">${formatPrice(p.price)}</span>
                <span class="pdp-price-original">${formatPrice(originalPrice)}</span>
                <span class="pdp-price-savings">Save ${discountPercentage}% (${formatPrice(savingsVal)})</span>
              </div>

              <!-- Color selectors -->
              <div class="pdp-colors-section">
                <div class="pdp-selector-label">COLOR — <span class="selected-color-text" id="color-label">${this.selectedColor.toUpperCase()}</span></div>
                <div class="pdp-color-dots">
                  ${categoryColors.map(color => `
                    <div class="pdp-color-dot ${this.selectedColor === color.name ? 'active' : ''}" 
                         style="background: ${color.code};" 
                         data-color-name="${color.name}" 
                         title="${color.name}">
                      ${this.selectedColor === color.name ? `
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="3">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                      ` : ''}
                    </div>
                  `).join('')}
                </div>
              </div>

              <!-- Buttons Grid Row -->
              <div class="pdp-actions-container-row">
                <!-- Quantity Selector Pill -->
                <div class="pdp-quantity-pill-box">
                  <button class="qty-adjust-btn" id="pdp-qty-dec">−</button>
                  <span class="qty-adjust-val" id="pdp-qty-val">${this.pdpQuantity}</span>
                  <button class="qty-adjust-btn" id="pdp-qty-inc">+</button>
                </div>

                <!-- Add to Cart Pill Button -->
                <button class="pdp-action-add-to-cart-pill" id="pdp-add-cart-btn" ${isOutOfStock ? 'disabled style="opacity: 0.55; cursor: not-allowed; pointer-events: none;"' : ''}>
                  ${isOutOfStock ? 'OUT OF STOCK' : 'ADD TO CART →'}
                </button>

                <!-- Circle Wishlist Button -->
                <button class="pdp-action-circle-btn ${isWishlisted ? 'wishlisted' : ''}" id="pdp-wish-side-btn" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="${isWishlisted ? 'var(--red)' : 'none'}" stroke="${isWishlisted ? 'var(--red)' : 'currentColor'}" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </button>

                <!-- Add to Collection Button -->
                <button class="pdp-action-circle-btn" id="pdp-add-col-btn" title="Add to Collection">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                </button>

                <!-- Floating Dropdown Overlay -->
                <div class="col-dropdown-menu" id="pdp-col-dropdown">
                  <div class="col-dropdown-header">Add to Collection</div>
                  <div class="col-dropdown-list" id="pdp-col-dropdown-list"></div>
                  <div class="col-dropdown-divider"></div>
                  <button class="col-dropdown-create-btn" id="pdp-col-create-btn">ï¼‹ Create New Collection</button>
                </div>
 
                <!-- Circle Share Button -->
                <button class="pdp-action-circle-btn" id="pdp-share-btn" title="Share Product">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                </button>
              </div>

              <!-- Full Width Buy It Now Button -->
              <button class="pdp-action-buy-it-now-pill" id="pdp-buy-now-btn" ${isOutOfStock ? 'disabled style="opacity: 0.55; cursor: not-allowed; pointer-events: none;"' : ''}>
                ${isOutOfStock ? 'OUT OF STOCK' : 'BUY IT NOW'}
              </button>

              ${stockLineHtml}

              <!-- Trust Benefits row -->
              <div class="pdp-trust-benefits">
                <div class="pdp-benefit-item benefit-shipping">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon>
                    <circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle>
                  </svg>
                  Free Shipping
                </div>
                <div class="pdp-benefit-item benefit-returns">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  30-Day Returns
                </div>
                <div class="pdp-benefit-item benefit-security">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                  Secure Payment
                </div>
              </div>

              <!-- Expandable Vertical Accordions -->
              <div class="pdp-accordion-group">
                <!-- Item 1: Description -->
                <div class="pdp-accordion-item ${this.openAccordions.description ? 'expanded' : ''}">
                  <div class="pdp-accordion-header" data-section="description">
                    <span>DESCRIPTION</span>
                    <span class="accordion-icon">${this.openAccordions.description ? '×' : '+'}</span>
                  </div>
                  <div class="pdp-accordion-content">
                    <p>${p.description}</p>
                  </div>
                </div>

                <!-- Item 2: Specifications -->
                <div class="pdp-accordion-item ${this.openAccordions.specs ? 'expanded' : ''}">
                  <div class="pdp-accordion-header" data-section="specs">
                    <span>SPECIFICATIONS</span>
                    <span class="accordion-icon">${this.openAccordions.specs ? '×' : '+'}</span>
                  </div>
                  <div class="pdp-accordion-content">
                    <table class="pdp-accordion-specs-table">
                      <tbody>
                        ${Object.entries(p.specs || {}).map(([key, val]) => `
                          <tr>
                            <th>${key}</th>
                            <td>${val}</td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Item 3: Shipping & Returns -->
                <div class="pdp-accordion-item ${this.openAccordions.shipping ? 'expanded' : ''}">
                  <div class="pdp-accordion-header" data-section="shipping">
                    <span>SHIPPING & RETURNS</span>
                    <span class="accordion-icon">${this.openAccordions.shipping ? '×' : '+'}</span>
                  </div>
                  <div class="pdp-accordion-content">
                    <p>Orders placed before 4 pm ship the same day. Express delivery (1-3 business days) is free over $150. Try the premium accessories at home for 30 days — if it isn't the one, returns are free and refunded in full within 48 hours of arrival.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom: Reviews Dashboard Layout -->
          <div class="pdp-reviews-dashboard-section">
            <div class="reviews-dashboard-header">
              <div class="reviews-tag-label-line">
                <span class="blue-line"></span>
                <span class="uppercase-tag-label">FROM THE LISTENING ROOM</span>
              </div>
              <div class="reviews-count-write-row">
                <h3 class="reviews-honest-title">${totalReviewsCount} honest reviews.</h3>
                <button class="write-review-badge-btn" id="pdp-write-review-btn">
                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 4px;">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path>
                  </svg>
                  Write a review
                </button>
              </div>
            </div>

            <!-- Expandable Submission Form Card -->
            <div class="review-submission-form-container ${this.showReviewForm ? 'open' : ''}" id="review-form-box">
              <h4>Write a customer review</h4>
              
              <div class="form-stars-row">
                <label>Rating:</label>
                <div class="interactive-stars-selector">
                  ${[1, 2, 3, 4, 5].map(num => `
                    <span class="interactive-star-icon ${this.formRating >= num ? 'active' : ''}" data-value="${num}">★</span>
                  `).join('')}
                </div>
              </div>

              <div class="form-input-group">
                <label for="review-author-name">Your Name</label>
                <input type="text" id="review-author-name" placeholder="Enter your name" autocomplete="name">
              </div>

              <div class="form-input-group">
                <label for="review-comment-body">Review Details</label>
                <textarea id="review-comment-body" placeholder="Share your experience with this product..."></textarea>
              </div>

              <!-- Live Preview Card Section -->
              <div class="review-live-preview-box" style="margin: 16px 0; padding: 16px; border: 1.5px dashed var(--border); border-radius: 12px; background: rgba(0,0,0,0.015);">
                <span class="page-hero-badge" style="font-size: 9px; padding: 3px 8px; margin-bottom: 8px; display: inline-block;">✨ LIVE REVIEW PREVIEW</span>
                <div class="preview-card" style="opacity: 0.85;">
                  <div class="preview-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                    <strong id="preview-user-display" style="font-size: 13px; color: var(--text-dark);">Your Name</strong>
                    <span id="preview-stars-display" style="color: #ffb800; font-size: 14px;">★ ★ ★ ★ ★</span>
                  </div>
                  <p id="preview-body-display" style="font-size: 12px; color: var(--text-gray); line-height: 1.45; margin: 0; font-style: italic;">"Share your experience with this product..."</p>
                </div>
              </div>

              <div class="form-actions-row">
                <button class="form-submit-btn" id="review-submit-btn">Submit Review</button>
                <button class="form-cancel-btn" id="review-cancel-btn">Cancel</button>
              </div>
            </div>

            <!-- Reviews body split -->
            <div class="reviews-dashboard-body">
              <!-- Left stats card block -->
              <div class="reviews-stats-summary-card">
                <div class="average-rating-number">${averageRating}</div>
                <div class="rating-stars-full">★ ★ ★ ★ ★</div>
                <div class="based-on-subtext">Based on ${totalReviewsCount} reviews</div>
                
                <div class="rating-progress-list">
                  <div class="progress-bar-row">
                    <span class="stars-label">5 ★</span>
                    <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${starPercentages[5]}%;"></div></div>
                    <span class="pct-val">${starPercentages[5]}%</span>
                  </div>
                  <div class="progress-bar-row">
                    <span class="stars-label">4 ★</span>
                    <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${starPercentages[4]}%;"></div></div>
                    <span class="pct-val">${starPercentages[4]}%</span>
                  </div>
                  <div class="progress-bar-row">
                    <span class="stars-label">3 ★</span>
                    <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${starPercentages[3]}%;"></div></div>
                    <span class="pct-val">${starPercentages[3]}%</span>
                  </div>
                  <div class="progress-bar-row">
                    <span class="stars-label">2 ★</span>
                    <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${starPercentages[2]}%;"></div></div>
                    <span class="pct-val">${starPercentages[2]}%</span>
                  </div>
                  <div class="progress-bar-row">
                    <span class="stars-label">1 ★</span>
                    <div class="progress-bar-track"><div class="progress-bar-fill" style="width: ${starPercentages[1]}%;"></div></div>
                    <span class="pct-val">${starPercentages[1]}%</span>
                  </div>
                </div>
              </div>

              <!-- Right comments listing with See More button pagination -->
              <div class="reviews-list-pills-panel">
                <div class="reviews-filter-pills-row">
                  <button class="filter-pill-btn ${this.activeReviewFilter === 'All' ? 'active' : ''}" data-filter="All">All</button>
                  <button class="filter-pill-btn ${this.activeReviewFilter === '5' ? 'active' : ''}" data-filter="5">5 ★</button>
                  <button class="filter-pill-btn ${this.activeReviewFilter === '4' ? 'active' : ''}" data-filter="4">4 ★</button>
                  <button class="filter-pill-btn ${this.activeReviewFilter === '3' ? 'active' : ''}" data-filter="3">3 ★</button>
                </div>

                <div class="reviews-filtered-content-area">
                  ${reviewsToShow.length > 0 ? reviewsToShow.map(r => `
                    <div class="review-item-card animate-in">
                      <div class="review-comment-user-row">
                        <strong>${r.user}</strong>
                        <span class="stars-gold-mini">${"★".repeat(r.rating) + "☆".repeat(5 - r.rating)}</span>
                      </div>
                      <p class="review-comment-body">"${r.comment}"</p>
                    </div>
                  `).join('') : `
                    <div class="reviews-empty-state-dashboard">
                      No reviews in this category yet. Be the first to share your thoughts!
                    </div>
                  `}
                </div>

                <!-- See More button panel -->
                ${hasMoreReviews ? `
                  <div class="see-more-reviews-row">
                    <button class="see-more-reviews-btn" id="pdp-see-more-reviews-btn">See More</button>
                  </div>
                ` : ''}
              </div>
            </div>
          </div>

          <!-- Related accessories (4-in-a-row) -->
          <div class="pdp-similar-section">
            <h3 class="similar-title">Complete Your Setup</h3>
            <div class="home-grid-4" id="pdp-similar-grid"></div>
          </div>
        </div>
      `;

      // Populate related products (4-in-a-row)
      const similarGrid = this.shadowRoot.getElementById('pdp-similar-grid');
      if (similarGrid) {
        similarGrid.innerHTML = '';
        const related = this.products
          .filter(item => item.id !== p.id && item.category === p.category)
          .slice(0, 4);
          
        if (related.length < 4) {
          const fallback = this.products
            .filter(item => item.id !== p.id && item.category !== p.category)
            .slice(0, 4 - related.length);
          related.push(...fallback);
        }

        related.forEach(item => {
          const card = document.createElement('product-card');
          card.product = item;
          similarGrid.appendChild(card);
        });
      }

      this.attachPdpListeners(p);
    } else if (this.currentPage === 'auth') {
      contentArea.innerHTML = this.getAuthPageHTML();
      this.attachAuthListeners();
    } else if (this.currentPage === 'admin') {
      contentArea.innerHTML = `<div style="padding: 100px 40px; text-align: center; color: var(--text-dark);"><h4 style="font-size: 20px; font-weight: 800; margin-bottom: 12px;">Redirecting to Standalone Admin Portal...</h4><a href="./admin.html" target="_blank" style="color: var(--primary); text-decoration: underline; font-weight: 750; font-size: 14px;">Open Admin Panel in New Tab ↗</a></div>`;
      window.open('./admin.html', '_blank');
      this.currentPage = 'home';
      setTimeout(() => this.renderPageContent(), 1000);
    }

    if (this.currentPage !== 'home') {
      this.injectGlobalMoreToLove();
    }

    this.attachDynamicUIListeners();
  }

  startCountdownTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }

    const shadow = this.shadowRoot;
    const formatTime = (time) => {
      const hrs = Math.floor(time / 3600).toString().padStart(2, '0');
      const mins = Math.floor((time % 3600) / 60).toString().padStart(2, '0');
      const secs = (time % 60).toString().padStart(2, '0');
      return `${hrs} : ${mins} : ${secs}`;
    };

    const timerDisplay = shadow.getElementById('countdown-display');
    if (timerDisplay) {
      timerDisplay.textContent = formatTime(this.countdownTime);
    }

    this.timerInterval = setInterval(() => {
      if (this.countdownTime > 0) {
        this.countdownTime--;
        const display = shadow.getElementById('countdown-display');
        if (display) {
          display.textContent = formatTime(this.countdownTime);
        }
      } else {
        clearInterval(this.timerInterval);
      }
    }, 1000);
  }

  injectHomeProducts() {
    let sectionsList = [];
    try {
      const storedSecs = localStorage.getItem('SWEETOS_homepage_sections');
      sectionsList = storedSecs ? JSON.parse(storedSecs) : [];
    } catch(e) {}

    // Sort active sections by order
    sectionsList.forEach((s, idx) => {
      if (s.order === undefined) s.order = idx;
    });

    sectionsList.filter(s => s.active).forEach(s => {
      // Check if any product has explicitly been assigned to this section
      const assignedProducts = this.products.filter(p => p.homepageSections && p.homepageSections.includes(s.id));
      const hasAssigned = assignedProducts.length > 0;

      if (s.type === 'deals') {
        const gridHot = this.shadowRoot.getElementById('grid-hot-deals');
        if (gridHot) {
          gridHot.innerHTML = '';
          const displayProducts = hasAssigned ? assignedProducts : this.products.filter(p => [5, 14, 28, 40].includes(p.id));
          displayProducts.forEach(p => {
            const card = document.createElement('product-card');
            card.product = p;
            card.isHotDeal = true;
            gridHot.appendChild(card);
          });
        }
      } else if (s.type === 'new-arrivals') {
        const gridNew = this.shadowRoot.getElementById('grid-new-arrivals');
        if (gridNew) {
          gridNew.innerHTML = '';
          const displayProducts = hasAssigned ? assignedProducts : this.products.slice(46, 50);
          displayProducts.forEach(p => {
            const card = document.createElement('product-card');
            card.product = p;
            gridNew.appendChild(card);
          });
        }
      } else if (s.type === 'best-sellers') {
        const gridBest = this.shadowRoot.getElementById('grid-best-sellers');
        if (gridBest) {
          gridBest.innerHTML = '';
          const displayProducts = hasAssigned ? assignedProducts : this.products.filter(p => [1, 13, 26, 39].includes(p.id));
          displayProducts.forEach(p => {
            const card = document.createElement('product-card');
            card.product = p;
            gridBest.appendChild(card);
          });
        }
      } else if (s.type === 'grid') {
        const gridDynamic = this.shadowRoot.getElementById(`grid-dynamic-${s.id}`);
        if (gridDynamic) {
          gridDynamic.innerHTML = '';
          let displayProducts = [];
          if (hasAssigned) {
            displayProducts = assignedProducts;
          } else {
            if (s.category === 'All' || !s.category) {
              displayProducts = this.products.slice(0, 4);
            } else if (s.category === 'Apple') {
              displayProducts = this.products.filter(p => p.name.toLowerCase().startsWith('apple')).slice(0, 4);
            } else {
              displayProducts = this.products.filter(p => p.category === s.category).slice(0, 4);
            }
          }
          displayProducts.forEach(p => {
            const card = document.createElement('product-card');
            card.product = p;
            gridDynamic.appendChild(card);
          });
        }
      } else if (s.type === 'carousel') {
        const carousel = this.shadowRoot.getElementById(`carousel-${s.id}`);
        if (carousel) {
          carousel.innerHTML = '';
          let displayProducts = [];
          if (hasAssigned) {
            displayProducts = assignedProducts;
          } else {
            if (s.category === 'All' || !s.category) {
              displayProducts = this.products.slice(0, 8);
            } else if (s.category === 'Apple') {
              displayProducts = this.products.filter(p => p.name.toLowerCase().startsWith('apple')).slice(0, 8);
            } else {
              displayProducts = this.products.filter(p => p.category === s.category).slice(0, 8);
            }
          }
          displayProducts.forEach(p => {
            const card = document.createElement('product-card');
            card.product = p;
            carousel.appendChild(card);
          });
        }
      }
    });

    // Initial For You products load
    this.forYouIndex = 0;
    this.forYouLoading = false;
    
    const gridForYou = this.shadowRoot.getElementById('grid-for-you');
    if (gridForYou) {
      gridForYou.innerHTML = '';
      const batchSize = 8;
      for (let i = 0; i < batchSize; i++) {
        const p = this.products[i % this.products.length];
        const card = document.createElement('product-card');
        card.product = p;
        gridForYou.appendChild(card);
      }
      this.forYouIndex = batchSize;
    }

    // Inject dynamic category marquee backgrounds
    const storedCats = JSON.parse(localStorage.getItem('SWEETOS_categories') || '[]');
    storedCats.forEach(cat => {
      const slug = cat.slug || cat.name.toLowerCase();
      const container = this.shadowRoot.getElementById(`marquee-${slug}`);
      if (container) {
        const catProducts = this.products.filter(p => p.category === cat.name);
        if (catProducts.length > 0) {
          const images = catProducts.map(p => `<img src="${p.image}" alt="${p.name}">`);
          const repeated = [...images, ...images, ...images];
          container.innerHTML = `
            <div class="category-marquee-track">
              ${repeated.join('')}
            </div>
          `;
        }
      }
    });

    const catCards = this.shadowRoot.querySelectorAll('.home-category-card');
    catCards.forEach(card => {
      card.addEventListener('click', () => {
        const cat = card.getAttribute('data-category');
        this.currentPage = 'catalog';
        this.currentCategory = cat;
        this.renderPageContent();

        setTimeout(() => {
          const sec = this.shadowRoot.getElementById(`cat-sec-${cat.toLowerCase()}`);
          if (sec) {
            sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);

        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { category: cat, query: '' }
        }));
      });
    });
  }

  attachHomeCarouselListeners(activeSections) {
    const shadow = this.shadowRoot;
    activeSections.forEach(s => {
      if (s.type === 'carousel') {
        const prev = shadow.getElementById(`btn-prev-${s.id}`);
        const next = shadow.getElementById(`btn-next-${s.id}`);
        const carouselEl = shadow.getElementById(`carousel-${s.id}`);
        if (prev && next && carouselEl) {
          prev.addEventListener('click', () => {
            carouselEl.scrollBy({ left: -320, behavior: 'smooth' });
          });
          next.addEventListener('click', () => {
            carouselEl.scrollBy({ left: 320, behavior: 'smooth' });
          });
        }
      } else if (s.type === 'banner') {
        const btn = shadow.querySelector(`.shop-now-btn[data-category="${s.category}"]`);
        if (btn) {
          btn.addEventListener('click', () => {
            this.currentCategory = s.category;
            this.currentPage = 'catalog';
            this.renderPageContent();
            this.shadowRoot.host.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: s.category } }));
          });
        }
      }
    });
  }

  initializeHomepageSectionsForProducts(productsArray) {
    let migrated = false;
    productsArray.forEach(p => {
      if (!p.homepageSections) {
        p.homepageSections = [];
        const hotDealsIds = [5, 14, 28, 40];
        const bestSellersIds = [1, 13, 26, 39];
        if (hotDealsIds.includes(p.id)) p.homepageSections.push('sec-deals');
        if (bestSellersIds.includes(p.id)) p.homepageSections.push('sec-best');
        if (p.id >= 47 && p.id <= 50) p.homepageSections.push('sec-new');
        if (p.name.toLowerCase().startsWith('apple')) p.homepageSections.push('sec-1');
        if (p.category === 'Keyboards') p.homepageSections.push('sec-2');
        if (p.category === 'Audio') p.homepageSections.push('sec-3');
        migrated = true;
      }
    });
    return migrated;
  }

  loadMoreForYouProducts() {
    if (this.forYouLoading) return;
    this.forYouLoading = true;

    const shadow = this.shadowRoot;
    const grid = shadow.getElementById('grid-for-you');
    const loadingEl = shadow.getElementById('for-you-loading');
    if (!grid) {
      this.forYouLoading = false;
      return;
    }

    if (loadingEl) {
      loadingEl.style.opacity = '1';
    }

    // Simulate premium async loading delay
    setTimeout(() => {
      const batchSize = 8;
      for (let i = 0; i < batchSize; i++) {
        // Wrap around index to make it truly endless!
        const prodIndex = (this.forYouIndex + i) % this.products.length;
        const p = this.products[prodIndex];
        
        const card = document.createElement('product-card');
        card.product = p;
        grid.appendChild(card);
      }
      this.forYouIndex += batchSize;
      this.forYouLoading = false;
      if (loadingEl) {
        loadingEl.style.opacity = '0';
      }
    }, 600);
  }

  injectCatalogCarousel() {
    const banner = this.shadowRoot.getElementById('category-carousel-banner');
    if (!banner) return;

    // Filter featured products for the active category
    const categoryProds = this.products.filter(p => 
      this.currentCategory === 'All' || p.category === this.currentCategory
    );

    // Filter by rating >= 4.7, or just slice the first 5 products as fallback
    let featured = categoryProds.filter(p => p.rating >= 4.7);
    if (featured.length === 0) {
      featured = categoryProds.slice(0, 5);
    }

    if (featured.length === 0) {
      banner.style.display = 'none';
      return;
    } else {
      banner.style.display = 'block';
    }

    // Ensure active index is within bounds
    if (this.activeFeaturedIndex >= featured.length) {
      this.activeFeaturedIndex = 0;
    }

    const p = featured[this.activeFeaturedIndex];
    // Calculate save percentage
    const discount = 15; // 15% discount for showcase
    const originalPrice = Math.round(p.price / (1 - discount / 100));
    
    banner.innerHTML = `
      <div class="carousel-glow"></div>
      
      <!-- Left arrow button -->
      <button class="carousel-nav-btn prev" id="carousel-prev-btn" aria-label="Previous Featured Product" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <div class="carousel-content-wrapper">
        <div class="carousel-details">
          <span class="carousel-badge-pill">
            <span class="star-sparkle">✦</span> CATEGORY FEATURE
            <span style="opacity: 0.6; margin-left: 8px;">Item ${this.activeFeaturedIndex + 1} of ${featured.length}</span>
          </span>
          
          <h2 class="carousel-title">${p.name}</h2>
          <p class="carousel-description">${p.shortDesc || p.description.slice(0, 120) + '...'}</p>
          
          <div class="carousel-price-card">
            <span class="price-label">SPECIAL OFFER PRICE</span>
            <div class="price-values">
              <span class="current-price">$${p.price.toFixed(2)}</span>
              <span class="original-price">$${originalPrice.toFixed(2)}</span>
              <span class="save-badge">SAVE ${discount}%</span>
            </div>
          </div>

          <div class="carousel-actions">
            <button class="btn-primary carousel-explore-btn" id="carousel-explore-btn">EXPLORE DETAILS →</button>
            <button class="btn-secondary carousel-cart-btn" id="carousel-cart-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              ADD TO CART
            </button>
          </div>
        </div>

        <div class="carousel-visual-container">
          <div class="carousel-image-card">
            <img src="${p.image}" alt="${p.name}">
            <div class="carousel-inspect-caption">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Click to inspect specs & views
            </div>
          </div>
        </div>
      </div>

      <!-- Right arrow button -->
      <button class="carousel-nav-btn next" id="carousel-next-btn" aria-label="Next Featured Product" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%);">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>

      <!-- Dots Indicators -->
      <div class="carousel-indicators">
        ${featured.map((item, index) => `
          <div class="carousel-indicator-dot ${index === this.activeFeaturedIndex ? 'active' : ''}" data-index="${index}"></div>
        `).join('')}
      </div>
    `;

    // Wire up events
    const prevBtn = this.shadowRoot.getElementById('carousel-prev-btn');
    const nextBtn = this.shadowRoot.getElementById('carousel-next-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = (this.activeFeaturedIndex - 1 + featured.length) % featured.length;
        this.injectCatalogCarousel();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = (this.activeFeaturedIndex + 1) % featured.length;
        this.injectCatalogCarousel();
      });
    }

    // Explore details event
    const exploreBtn = this.shadowRoot.getElementById('carousel-explore-btn');
    const imgCard = this.shadowRoot.querySelector('.carousel-image-card');
    [exploreBtn, imgCard].forEach(el => {
      if (el) {
        el.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('product:view', { detail: p.id }));
        });
      }
    });

    // Add to cart event
    const cartBtn = this.shadowRoot.getElementById('carousel-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('cart:add', {
          detail: { productId: p.id, quantity: 1, color: p.colors ? p.colors[0]?.name : '' }
        }));
      });
    }

    // Dots clicks
    this.shadowRoot.querySelectorAll('.carousel-indicator-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = parseInt(dot.getAttribute('data-index'));
        this.injectCatalogCarousel();
      });
    });
  }

  injectCatalogProducts() {
    const container = this.shadowRoot.getElementById('catalog-grouped-sections');
    const noResults = this.shadowRoot.getElementById('no-results');
    if (!container) return;
    container.innerHTML = '';

    // First filter products by query
    const textFiltered = this.products.filter(product => {
      return this.currentQuery === '' || 
        product.name.toLowerCase().includes(this.currentQuery.toLowerCase()) || 
        product.shortDesc.toLowerCase().includes(this.currentQuery.toLowerCase());
    });

    // Calculate final counts for headers
    let finalCount = 0;
    if (this.currentBrand) {
      const brandProducts = textFiltered.filter(p => p.name.toLowerCase().startsWith(this.currentBrand.toLowerCase()));
      const finalProducts = brandProducts.filter(p => this.currentCategory === 'All' || p.category === this.currentCategory);
      finalCount = finalProducts.length;
    } else if (this.currentCategory === 'All') {
      finalCount = textFiltered.length;
    } else {
      finalCount = textFiltered.filter(p => p.category === this.currentCategory).length;
    }

    if (finalCount === 0 && this.currentQuery && this.currentQuery.trim() !== '') {
      let failed = [];
      try {
        failed = JSON.parse(localStorage.getItem('SWEETOS_failed_searches') || '[]');
      } catch (err) {}
      
      const queryNormal = this.currentQuery.trim().toLowerCase();
      if (!failed.some(item => item.query.toLowerCase() === queryNormal)) {
        failed.push({
          query: this.currentQuery.trim(),
          timestamp: new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
        });
        localStorage.setItem('SWEETOS_failed_searches', JSON.stringify(failed));
      }
    }

    const titleHeader = this.shadowRoot.getElementById('catalog-title-header');
    const countBadge = this.shadowRoot.getElementById('catalog-count-badge');
    if (titleHeader) {
      titleHeader.textContent = this.currentBrand 
        ? `Brand: ${this.currentBrand}` 
        : `Category: ${this.currentCategory}`;
    }
    if (countBadge) {
      countBadge.textContent = `${finalCount} Items Found`;
    }

    // If a brand filter is active (e.g. Apple), render a dedicated brand page layout
    if (this.currentBrand) {
      noResults.style.display = 'none';
      container.style.display = 'block';

      const brandProducts = textFiltered.filter(p => p.name.toLowerCase().startsWith(this.currentBrand.toLowerCase()));
      const finalProducts = brandProducts.filter(p => this.currentCategory === 'All' || p.category === this.currentCategory);

      const brandBanner = document.createElement('div');
      brandBanner.className = 'brand-grouped-header-banner animate-in';
      brandBanner.setAttribute('style', `
        background: linear-gradient(135deg, #1c1c1e 0%, #3a3a43 100%);
        border-radius: 24px;
        padding: 36px 40px;
        color: white;
        margin-bottom: 28px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.06);
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 28px;
        border: 1px solid rgba(255, 255, 255, 0.08);
      `);
      brandBanner.innerHTML = `
        <div style="position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: rgba(0, 82, 204, 0.12); filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 1;"></div>
        
        <div style="display: flex; align-items: center; gap: 24px; z-index: 2;">
          <div style="background: rgba(255,255,255,0.08); width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 20px; font-size: 32px; flex-shrink: 0; border: 1px solid rgba(255,255,255,0.1);">🍏</div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <h2 style="font-size: 28px; font-weight: 850; margin: 0; color: white; letter-spacing: -0.5px;">${this.currentBrand} Workspace Collection</h2>
              <span style="font-size: 11px; font-weight: 700; color: #00b4d8; background: rgba(255, 255, 255, 0.15); padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">Brand Store</span>
            </div>
            <p style="font-size: 14px; color: #cbd5e1; margin: 0; max-width: 600px; line-height: 1.4;">Designed in California. Full ecosystem integration of premium workspace displays, input accessories, and audio gear.</p>
          </div>
        </div>

        <button id="clear-brand-filter-btn" style="background: rgba(255,255,255,0.1); color: white; border: 1px solid rgba(255,255,255,0.15); padding: 10px 18px; border-radius: 12px; font-weight: 700; font-size: 13px; cursor: pointer; z-index: 2; transition: all 0.2s ease; display: flex; align-items: center; gap: 6px;">✕ Close Brand</button>
      `;
      container.appendChild(brandBanner);

      if (finalProducts.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'no-results';
        empty.style.display = 'flex';
        empty.style.padding = '40px 0';
        empty.innerHTML = `<h3>No products match category "${this.currentCategory}"</h3>`;
        container.appendChild(empty);
      } else {
        const grid = document.createElement('div');
        grid.className = 'product-grid';
        finalProducts.forEach(p => {
          const card = document.createElement('product-card');
          card.product = p;
          grid.appendChild(card);
        });
        container.appendChild(grid);
      }
      return;
    }

    // If query was entered, just show search results in a single grid
    if (this.currentQuery !== '') {
      const filtered = textFiltered.filter(p => this.currentCategory === 'All' || p.category === this.currentCategory);
      if (filtered.length === 0) {
        container.style.display = 'none';
        noResults.style.display = 'flex';
        return;
      }
      noResults.style.display = 'none';
      container.style.display = 'block';

      // Render search results header
      const searchTitle = document.createElement('h4');
      searchTitle.className = 'search-results-header';
      searchTitle.textContent = `Search Results for "${this.currentQuery}" (${filtered.length} products found)`;
      container.appendChild(searchTitle);

      const grid = document.createElement('div');
      grid.className = 'product-grid';
      filtered.forEach(p => {
        const card = document.createElement('product-card');
        card.product = p;
        grid.appendChild(card);
      });
      container.appendChild(grid);
      return;
    }

    // No search query: standard category grouping or filtered category listing
    noResults.style.display = 'none';
    container.style.display = 'block';

    const storedCats = JSON.parse(localStorage.getItem('SWEETOS_categories') || '[]');
    const categories = this.currentCategory === 'All'
      ? storedCats.map(c => c.name)
      : [this.currentCategory];
    
    let hasProducts = false;
    categories.forEach(cat => {
      const catProducts = textFiltered.filter(p => p.category === cat);
      if (catProducts.length === 0) return;
      hasProducts = true;

      // Create Section element
      const section = document.createElement('div');
      section.className = 'catalog-category-section';
      section.id = `cat-sec-${cat.toLowerCase()}`;
      section.style.scrollMarginTop = '120px';
      section.style.marginBottom = '40px';

      // Header (only show header if they are in "All" view)
      if (this.currentCategory === 'All') {
        const header = document.createElement('div');
        header.className = 'category-section-header';
        header.style.borderBottom = '1.5px solid var(--border)';
        header.style.paddingBottom = '12px';
        header.style.marginBottom = '24px';
        header.innerHTML = `
          <h4 class="category-section-title" style="font-size: 20px; font-weight: 850; color: var(--text-dark); margin:0;">
            ${cat} <span class="cat-count" style="font-size: 13px; font-weight: 550; color: var(--text-light); margin-left: 6px;">(${catProducts.length} items)</span>
          </h4>
        `;
        section.appendChild(header);
      }

      // Grid - lists all products inside the category!
      const grid = document.createElement('div');
      grid.className = 'product-grid';
      
      catProducts.forEach(p => {
        const card = document.createElement('product-card');
        card.product = p;
        grid.appendChild(card);
      });
      section.appendChild(grid);
      container.appendChild(section);
    });

    if (!hasProducts) {
      container.style.display = 'none';
      noResults.style.display = 'flex';
    }
  }

  injectCategorizedProducts(type) {
    let gridElementId = '';
    let filteredList = [];

    if (type === 'deals') {
      gridElementId = 'grid-deals';
      filteredList = this.products.filter(p => p.price < 100);
    } else if (type === 'new') {
      gridElementId = 'grid-new';
      filteredList = this.products.slice(38, 50);
    } else if (type === 'best') {
      gridElementId = 'grid-best';
      filteredList = this.products.filter(p => p.rating >= 4.8 && p.reviews >= 90);
    }

    const grid = this.shadowRoot.getElementById(gridElementId);
    if (!grid) return;

    filteredList.forEach(p => {
      const card = document.createElement('product-card');
      card.product = p;
      if (type === 'deals') {
        card.isHotDeal = true;
      }
      grid.appendChild(card);
    });
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;
    
    const cards = shadow.querySelectorAll('.quick-cat-card');
    cards.forEach(card => {
      if (card.getAttribute('data-category') === this.currentCategory) {
        card.classList.add('active');
      } else {
        card.classList.remove('active');
      }
      card.addEventListener('click', () => {
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        
        const cat = card.getAttribute('data-category');
        this.currentCategory = cat;
        
        this.activeFeaturedIndex = 0; // Reset active featured index

        if (this.currentPage !== 'catalog') {
          this.currentPage = 'catalog';
          this.renderPageContent();
        } else {
          // Update pills active states
          shadow.querySelectorAll('.category-pill-btn').forEach(btn => {
            btn.classList.toggle('active', btn.getAttribute('data-category') === cat);
          });
          this.injectCatalogCarousel();
          this.injectCatalogProducts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }

        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { category: cat, query: '' }
        }));
      });
    });

    window.addEventListener('navigation:changed', (e) => {
      const { page, category, brand } = e.detail;
      let targetPage = page || 'home';
      if (targetPage === 'about') targetPage = 'about-us';
      this.currentPage = targetPage;
      this.currentCategory = category || 'All';
      this.currentBrand = brand || '';
      this.currentBrandFilter = 'All'; // Reset active brand filter on navigation change
      this.activeFeaturedIndex = 0; // Reset active featured index on navigation changes
      
      cards.forEach(c => {
        if (c.getAttribute('data-category') === this.currentCategory) {
          c.classList.add('active');
        } else {
          c.classList.remove('active');
        }
      });

      this.renderPageContent();
    });

    window.addEventListener('search:query', (e) => {
      const { query, category } = e.detail;
      this.currentQuery = query || '';
      
      if (query && this.currentPage !== 'catalog') {
        this.currentPage = 'catalog';
      }

      if (category) {
        this.currentCategory = category;
        cards.forEach(c => {
          if (c.getAttribute('data-category') === category) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });
      }

      this.renderPageContent();
    });

    window.addEventListener('product:view', (e) => {
      this.currentPage = 'product-details';
      this.currentProductId = e.detail;
      this.pdpQuantity = 1;
      this.selectedColor = '';
      this.activeThumbnailIdx = 0;
      this.showReviewForm = false;
      this.formRating = 5;
      this.openAccordions = {
        description: true,
        specs: false,
        shipping: false
      };
      this.activeReviewFilter = 'All';
      this.visibleReviewsCount = 5; 
      this.renderPageContent();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('wishlist:add', (e) => {
      this.addToWishlist(e.detail);
    });

    window.addEventListener('wishlist:updated', (e) => {
      if (this.currentPage === 'product-details' && this.currentProductId) {
        const wishlist = e.detail || [];
        const isCurrentlyWishlisted = wishlist.some(item => item.id === this.currentProductId);
        
        const wishBtn = this.shadowRoot.getElementById('pdp-wish-btn');
        const wishSideBtn = this.shadowRoot.getElementById('pdp-wish-side-btn');
        
        [wishBtn, wishSideBtn].forEach(btn => {
          if (btn) {
            btn.title = isCurrentlyWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist';
            btn.classList.toggle('wishlisted', isCurrentlyWishlisted);
            const svg = btn.querySelector('svg');
            if (svg) {
              svg.setAttribute('fill', isCurrentlyWishlisted ? 'var(--red)' : 'none');
              svg.setAttribute('stroke', isCurrentlyWishlisted ? 'var(--red)' : 'currentColor');
            }
          }
        });
      }
    });

    window.addEventListener('orders:updated', () => {
      if (this.currentPage === 'orders') {
        this.injectOrdersDashboardList();
      }
    });

    // Infinite scroll window listener for "For You"
    window.addEventListener('scroll', () => {
      if (this.currentPage !== 'home') return;
      
      const threshold = 250; // px from bottom
      const position = window.scrollY + window.innerHeight;
      const height = document.documentElement.scrollHeight;
      
      if (height - position < threshold) {
        this.loadMoreForYouProducts();
      }
    });
  }

  attachDynamicUIListeners() {
    const shadow = this.shadowRoot;

    shadow.querySelectorAll('.view-all-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = btn.getAttribute('data-target-page');
        this.currentPage = targetPage;
        this.renderPageContent();

        window.dispatchEvent(new CustomEvent('navigation:changed', {
          detail: { page: targetPage }
        }));
      });
    });

    const resetBtn = shadow.getElementById('reset-filter-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.currentQuery = '';
        this.currentCategory = 'All';
        
        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { query: '', category: 'All' }
        }));

        this.renderPageContent();
      });
    }

    shadow.querySelectorAll('.scroll-shop').forEach(btn => {
      btn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.currentBrand = '';
        this.renderPageContent();
        
        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { category: 'All', query: '' }
        }));
      });
    });

    const viewAllAppleBtn = shadow.getElementById('view-all-apple-btn');
    if (viewAllAppleBtn) {
      viewAllAppleBtn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentBrand = 'Apple';
        this.currentCategory = 'All';
        this.renderPageContent();

        window.dispatchEvent(new CustomEvent('navigation:changed', {
          detail: { page: 'catalog', category: 'All', brand: 'Apple' }
        }));
      });
    }

    const clearBrandBtn = shadow.getElementById('clear-brand-filter-btn');
    if (clearBrandBtn) {
      clearBrandBtn.addEventListener('click', () => {
        this.currentBrand = '';
        this.currentPage = 'catalog';
        this.renderPageContent();

        window.dispatchEvent(new CustomEvent('navigation:changed', {
          detail: { page: 'catalog', category: this.currentCategory, brand: '' }
        }));
      });
    }

    shadow.querySelectorAll('.category-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('.category-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const cat = btn.getAttribute('data-category');
        this.currentCategory = cat;
        this.activeFeaturedIndex = 0; // Reset active featured carousel item
        
        // Sync quick selector active states if any
        shadow.querySelectorAll('.quick-cat-card').forEach(c => {
          if (c.getAttribute('data-category') === cat) {
            c.classList.add('active');
          } else {
            c.classList.remove('active');
          }
        });

        // Trigger updates
        this.injectCatalogCarousel();
        this.injectCatalogProducts();
      });
    });

    shadow.querySelectorAll('.brand-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('.brand-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const brand = btn.getAttribute('data-brand');
        this.currentBrandFilter = brand;
        this.activeFeaturedIndex = 0; // Reset active featured carousel item
        
        // Trigger updates
        this.injectBrandCarousel();
        this.injectBrandsGrouped();
      });
    });
  }

  injectBrandCarousel() {
    const banner = this.shadowRoot.getElementById('brand-carousel-banner');
    if (!banner) return;

    const brandList = JSON.parse(localStorage.getItem('SWEETOS_brands') || '[]');
    const brands = brandList.map(b => b.name);

    const isProductOfBrand = (product, brandName) => {
      if (product.brand && product.brand.toLowerCase() === brandName.toLowerCase()) return true;
      return product.name.toLowerCase().startsWith(brandName.toLowerCase());
    };

    // Filter products by active brand filter
    let brandProducts = [];
    if (this.currentBrandFilter === 'All') {
      brandProducts = this.products.filter(p => 
        brands.some(b => isProductOfBrand(p, b))
      );
    } else {
      brandProducts = this.products.filter(p => 
        isProductOfBrand(p, this.currentBrandFilter)
      );
    }

    // Filter by rating >= 4.7, or just slice first 5
    let featured = brandProducts.filter(p => p.rating >= 4.7);
    if (featured.length === 0) {
      featured = brandProducts.slice(0, 5);
    }

    if (featured.length === 0) {
      banner.style.display = 'none';
      return;
    } else {
      banner.style.display = 'block';
    }

    // Ensure active index is within bounds
    if (this.activeFeaturedIndex >= featured.length) {
      this.activeFeaturedIndex = 0;
    }

    const p = featured[this.activeFeaturedIndex];
    
    // Determine brand styling based on the product
    let bgGradient = 'linear-gradient(135deg, #0b0f19 0%, #151b2d 100%)';
    let textColor = 'white';
    let descColor = '#cbd5e1';
    let dotColor = '#00b4d8';
    let navColor = 'white';
    let shadowColor = 'rgba(0,0,0,0.3)';
    let isLight = false;
    let badgeColor = 'rgba(147, 51, 234, 0.15)';
    let badgeText = '#c084fc';
    let badgeBorder = 'rgba(147, 51, 234, 0.25)';

    if (p.name.toLowerCase().startsWith('aero')) {
      bgGradient = 'linear-gradient(135deg, #0b1220 0%, #17223b 100%)';
    } else if (p.name.toLowerCase().startsWith('sweetos')) {
      bgGradient = 'linear-gradient(135deg, #ffffff 0%, #f1f5f9 100%)';
      textColor = 'var(--text-dark)';
      descColor = 'var(--text-gray)';
      dotColor = 'var(--primary)';
      navColor = 'var(--text-dark)';
      shadowColor = 'rgba(0,0,0,0.1)';
      isLight = true;
      badgeColor = 'rgba(0, 82, 204, 0.08)';
      badgeText = 'var(--primary)';
      badgeBorder = 'rgba(0, 82, 204, 0.15)';
    } else if (p.name.toLowerCase().startsWith('apex')) {
      bgGradient = 'linear-gradient(135deg, #0c1c38 0%, #1a325a 100%)';
    } else if (p.name.toLowerCase().startsWith('nebula')) {
      bgGradient = 'linear-gradient(135deg, #09090b 0%, #18181b 100%)';
      badgeColor = 'rgba(244, 63, 94, 0.15)';
      badgeText = '#fb7185';
      badgeBorder = 'rgba(244, 63, 94, 0.25)';
    } else if (p.name.toLowerCase().startsWith('apple')) {
      bgGradient = 'linear-gradient(135deg, #1c1c1e 0%, #3a3a43 100%)';
      badgeColor = 'rgba(255, 255, 255, 0.15)';
      badgeText = '#cbd5e1';
      badgeBorder = 'rgba(255, 255, 255, 0.25)';
    }

    const discount = 15;
    const originalPrice = Math.round(p.price / (1 - discount / 100));

    banner.setAttribute('style', `
      background: ${bgGradient};
      border-radius: 24px;
      color: ${textColor};
      padding: 40px 60px;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: space-between;
      min-height: 380px;
      border: ${isLight ? '1px solid var(--border)' : '1px solid rgba(255, 255, 255, 0.08)'};
      box-shadow: 0 16px 40px ${isLight ? 'rgba(0,0,0,0.06)' : 'rgba(0,0,0,0.18)'};
      box-sizing: border-box;
      transition: all 0.5s ease;
    `);

    banner.innerHTML = `
      <div class="carousel-glow" style="background: ${isLight ? 'transparent' : 'radial-gradient(circle, rgba(0, 82, 204, 0.15) 0%, rgba(0, 0, 0, 0) 70%)'};"></div>
      
      <!-- Left arrow button -->
      <button class="carousel-nav-btn prev" id="brand-carousel-prev-btn" aria-label="Previous Featured Product" style="position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: ${navColor}; border-color: ${isLight ? 'var(--border)' : 'rgba(255,255,255,0.1)'}; background: ${isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <div class="carousel-content-wrapper">
        <div class="carousel-details">
          <span class="carousel-badge-pill" style="background: ${badgeColor}; color: ${badgeText}; border-color: ${badgeBorder};">
            <span class="star-sparkle" style="color: ${badgeText};">✦</span> BRAND FEATURE
            <span style="opacity: 0.6; margin-left: 8px;">Item ${this.activeFeaturedIndex + 1} of ${featured.length}</span>
          </span>
          
          <h2 class="carousel-title" style="color: ${textColor};">${p.name}</h2>
          <p class="carousel-description" style="color: ${descColor};">${p.shortDesc || p.description.slice(0, 120) + '...'}</p>
          
          <div class="carousel-price-card" style="border-color: ${isLight ? 'var(--border)' : 'rgba(255,255,255,0.06)'}; background: ${isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.04)'};">
            <span class="price-label" style="color: ${isLight ? 'var(--text-gray)' : '#94a3b8'};">SPECIAL OFFER PRICE</span>
            <div class="price-values">
              <span class="current-price" style="color: ${isLight ? 'var(--primary)' : '#00b4d8'};">$${p.price.toFixed(2)}</span>
              <span class="original-price" style="color: ${isLight ? '#94a3b8' : '#64748b'};">$${originalPrice.toFixed(2)}</span>
              <span class="save-badge">SAVE ${discount}%</span>
            </div>
          </div>

          <div class="carousel-actions">
            <button class="btn-primary carousel-explore-btn" id="brand-carousel-explore-btn" style="background: ${isLight ? 'var(--primary)' : '#0052cc'} !important;">EXPLORE DETAILS →</button>
            <button class="btn-secondary carousel-cart-btn" id="brand-carousel-cart-btn" style="color: ${textColor} !important; border-color: ${isLight ? 'var(--border)' : 'rgba(255,255,255,0.12)'} !important; background: ${isLight ? 'white' : 'rgba(255,255,255,0.06)'} !important;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
              ADD TO CART
            </button>
          </div>
        </div>

        <div class="carousel-visual-container">
          <div class="carousel-image-card" style="border-color: ${isLight ? 'var(--border)' : 'rgba(255,255,255,0.08)'}; background: ${isLight ? 'white' : 'rgba(255,255,255,0.03)'}; box-shadow: 0 20px 40px ${shadowColor};">
            <img src="${p.image}" alt="${p.name}">
            <div class="carousel-inspect-caption" style="color: ${isLight ? 'var(--text-gray)' : '#94a3b8'};">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
              Click to inspect specs & views
            </div>
          </div>
        </div>
      </div>

      <!-- Right arrow button -->
      <button class="carousel-nav-btn next" id="brand-carousel-next-btn" aria-label="Next Featured Product" style="position: absolute; right: 16px; top: 50%; transform: translateY(-50%); color: ${navColor}; border-color: ${isLight ? 'var(--border)' : 'rgba(255,255,255,0.1)'}; background: ${isLight ? 'rgba(0,0,0,0.02)' : 'rgba(255,255,255,0.05)'};">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="20" height="20"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>

      <!-- Dots Indicators -->
      <div class="carousel-indicators">
        ${featured.map((item, index) => `
          <div class="carousel-indicator-dot ${index === this.activeFeaturedIndex ? 'active' : ''}" data-index="${index}" style="background: ${index === this.activeFeaturedIndex ? dotColor : (isLight ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.2)')};"></div>
        `).join('')}
      </div>
    `;

    // Wire up events
    const prevBtn = this.shadowRoot.getElementById('brand-carousel-prev-btn');
    const nextBtn = this.shadowRoot.getElementById('brand-carousel-next-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = (this.activeFeaturedIndex - 1 + featured.length) % featured.length;
        this.injectBrandCarousel();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = (this.activeFeaturedIndex + 1) % featured.length;
        this.injectBrandCarousel();
      });
    }

    // Explore details event
    const exploreBtn = this.shadowRoot.getElementById('brand-carousel-explore-btn');
    const imgCard = this.shadowRoot.querySelector('.carousel-image-card');
    [exploreBtn, imgCard].forEach(el => {
      if (el) {
        el.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('product:view', { detail: p.id }));
        });
      }
    });

    // Add to cart event
    const cartBtn = this.shadowRoot.getElementById('brand-carousel-cart-btn');
    if (cartBtn) {
      cartBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('cart:add', {
          detail: { productId: p.id, quantity: 1, color: p.colors ? p.colors[0]?.name : '' }
        }));
      });
    }

    // Dots clicks
    this.shadowRoot.querySelectorAll('.carousel-indicators .carousel-indicator-dot').forEach(dot => {
      dot.addEventListener('click', (e) => {
        e.stopPropagation();
        this.activeFeaturedIndex = parseInt(dot.getAttribute('data-index'));
        this.injectBrandCarousel();
      });
    });
  }

  injectBrandsGrouped() {
    const container = this.shadowRoot.getElementById('brands-grouped-container');
    if (!container) return;
    container.innerHTML = '';

    const storedBrands = JSON.parse(localStorage.getItem('SWEETOS_brands') || '[]');
    const brandsData = storedBrands.map(b => {
      const descriptionMap = {
        "Aero": "High-performance mechanical layouts, pre-lubed silent switches, coiled aviator links, and custom macropad decks.",
        "SWEETOS": "Solid oak monitor stands, riser shelves, and minimalist structural workspace woods built for ergonomics.",
        "Apex": "Professional audio converters, high-impedance headphones, sound-reactive towers, and acoustic speaker cones.",
        "Nebula": "Immersive smart monitor screenbars, active ambient LED lights, and acoustic visualization pillars.",
        "Apple": "Designed in California. Minimalist ecosystem hardware, ultra-thin aluminum designs, and reference 5K Retina displays."
      };
      
      const bannersMap = {
        "Aero": "linear-gradient(135deg, #0b1220 0%, #17223b 100%)",
        "SWEETOS": "linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",
        "Apex": "linear-gradient(135deg, #0c1c38 0%, #1a325a 100%)",
        "Nebula": "linear-gradient(135deg, #09090b 0%, #18181b 100%)",
        "Apple": "linear-gradient(135deg, #1c1c1e 0%, #3a3a43 100%)"
      };

      const isLight = b.name === 'SWEETOS';

      return {
        name: b.name === 'SWEETOS' ? "SWEETOS Handcrafted" : (b.name === 'Apple' ? "Apple Workspace" : (b.name === 'Apex' ? "Apex Studio" : (b.name === 'Nebula' ? "Nebula Ambient" : `${b.name} Series`))),
        query: b.name,
        description: descriptionMap[b.name] || `Explore curated ${b.name} setups, adapters, and accessories optimized for high workspace efficiency.`,
        icon: b.logo || "🏷️",
        bannerStyle: bannersMap[b.name] || "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
        textColor: isLight ? "var(--text-dark)" : "white",
        badgeColor: isLight ? "rgba(0, 82, 204, 0.08)" : "rgba(255, 255, 255, 0.12)",
        descColor: isLight ? "var(--text-gray)" : "#cbd5e1",
        border: isLight ? "1px solid var(--border)" : "1px solid rgba(255, 255, 255, 0.06)"
      };
    });

    const isProductOfBrand = (product, brandName) => {
      if (product.brand && product.brand.toLowerCase() === brandName.toLowerCase()) return true;
      return product.name.toLowerCase().startsWith(brandName.toLowerCase());
    };

    // Filter brand list based on active filter
    const activeBrands = this.currentBrandFilter === 'All'
      ? brandsData
      : brandsData.filter(b => b.query.toLowerCase() === this.currentBrandFilter.toLowerCase());

    // Calculate total count
    let totalItems = 0;
    activeBrands.forEach(brand => {
      const brandProducts = this.products.filter(p => isProductOfBrand(p, brand.query));
      totalItems += brandProducts.length;
    });

    // Update Header texts
    const titleHeader = this.shadowRoot.getElementById('brand-title-header');
    const countBadge = this.shadowRoot.getElementById('brand-count-badge');
    if (titleHeader) {
      titleHeader.textContent = `Brand: ${this.currentBrandFilter}`;
    }
    if (countBadge) {
      countBadge.textContent = `${totalItems} Items Found`;
    }

    activeBrands.forEach(brand => {
      const brandProducts = this.products.filter(p => isProductOfBrand(p, brand.query));

      if (brandProducts.length === 0) return;

      const section = document.createElement('div');
      section.className = 'brand-grouped-section';
      section.style.marginBottom = '48px';

      // Header (only show header if they are in "All" view)
      if (this.currentBrandFilter === 'All') {
        const header = document.createElement('div');
        header.className = 'brand-grouped-header-banner animate-in';
        header.setAttribute('style', `
          background: ${brand.bannerStyle};
          border-radius: 24px;
          padding: 36px 40px;
          color: ${brand.textColor};
          margin-bottom: 28px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.06);
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          gap: 28px;
          border: ${brand.border || 'none'};
        `);

        const glowColor = brand.textColor === 'white' ? 'rgba(0, 82, 204, 0.12)' : 'rgba(0, 0, 0, 0.02)';
        header.innerHTML = `
          <div style="position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: ${glowColor}; filter: blur(80px); border-radius: 50%; pointer-events: none; z-index: 1;"></div>
          
          <div style="background: ${brand.textColor === 'white' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}; width: 64px; height: 64px; display: flex; align-items: center; justify-content: center; border-radius: 20px; font-size: 32px; flex-shrink: 0; position: relative; z-index: 2; border: 1px solid ${brand.textColor === 'white' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'};">
            ${brand.icon}
          </div>
          
          <div style="display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 2; flex: 1;">
            <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
              <h4 style="font-size: 24px; font-weight: 850; margin: 0; letter-spacing: -0.5px;">${brand.name}</h4>
              <span style="font-size: 12px; font-weight: 700; color: ${brand.textColor === 'white' ? '#00b4d8' : 'var(--primary)'}; background: ${brand.badgeColor}; padding: 4px 10px; border-radius: 8px; text-transform: uppercase; letter-spacing: 0.5px;">
                ${brandProducts.length} Products Available
              </span>
            </div>
            <p style="font-size: 14px; color: ${brand.descColor}; margin: 0; line-height: 1.5; max-width: 750px;">${brand.description}</p>
          </div>
        `;
        section.appendChild(header);
      }

      const grid = document.createElement('div');
      grid.className = 'product-grid';
      brandProducts.forEach(p => {
        const card = document.createElement('product-card');
        card.product = p;
        grid.appendChild(card);
      });
      section.appendChild(grid);
      container.appendChild(section);
    });
  }

  injectCuratedCollections() {
    const container = this.shadowRoot.getElementById('collections-dashboard-grid');
    if (!container) return;
    container.innerHTML = '';

    const defaultCollections = [
      {
        id: "col-minimalist",
        name: "Ice Obsidian Minimalist",
        subtitle: "Tactile Keyboard, Sound Isolation, & Desk Shelf",
        description: "A clean, tactile workspace designed to eliminate clutter. Combines our premium double-shot mechanical layout, dense felt desk mat, and high-fidelity studio headphones.",
        badge: "FOCUSED TYPING",
        price: 349,
        originalPrice: 387,
        themeColor: "#0052cc",
        productIds: [1, 38, 13]
      },
      {
        id: "col-audio",
        name: "Acoustic Studio Suite",
        subtitle: "Active Monitors, Studio Cans, & Woodcut Riser",
        description: "Engineered for sound developers, audio mixers, and music lovers. Features high-fidelity speaker response, active isolation, and solid wood monitor risers.",
        badge: "HI-FI ACOUSTICS",
        price: 429,
        originalPrice: 497,
        themeColor: "#36b37e",
        productIds: [14, 13, 37]
      },
      {
        id: "col-neon",
        name: "Nebula Cyberpunk Rig",
        subtitle: "Ergonomic Board, Screenbars, & Ambient Pillars",
        description: "Vibrant lighting synchronization for coding after hours. Combines an ergonomic split-board setup, active ambient LED backlighting, and soundwave visualization towers.",
        badge: "AMBIENT FOCUS",
        price: 329,
        originalPrice: 378,
        themeColor: "#ff9a3c",
        productIds: [3, 25, 26]
      }
    ];

    const customCollections = this.loadCustomCollections();

    const allCollections = [
      ...customCollections.map(col => {
        const colProducts = this.products.filter(p => col.productIds.includes(p.id));
        const originalPrice = colProducts.reduce((sum, p) => sum + p.price, 0);
        const price = Math.round(originalPrice * 0.9);
        return {
          ...col,
          price,
          originalPrice,
          isCustom: true
        };
      }),
      ...defaultCollections
    ];

    allCollections.forEach(col => {
      const colProducts = this.products.filter(p => col.productIds.includes(p.id));

      const card = document.createElement('div');
      card.className = 'curated-collection-card glass-panel animate-in';
      card.innerHTML = `
        <div class="col-card-header" style="border-left: 4px solid ${col.themeColor}">
          <div class="header-left">
            <span class="col-badge" style="color: ${col.themeColor}; background: ${col.themeColor}12">
              ${col.badge} ${col.isCustom ? '• CUSTOM' : ''}
            </span>
            <h4>${col.name}</h4>
            <p class="subtitle">${col.subtitle}</p>
          </div>
          <div class="header-price">
            ${col.originalPrice > 0 ? `
              <span class="old-price">${formatPrice(col.originalPrice)}</span>
              <span class="new-price">${formatPrice(col.price)}</span>
            ` : `<span class="new-price">Empty</span>`}
          </div>
        </div>
        
        <p class="col-description">${col.description}</p>
        
        <div class="col-products-preview">
          <h6>INCLUDED GEAR</h6>
          <div class="preview-thumbnails">
            ${colProducts.length === 0 ? `
              <span style="font-size:12px;color:var(--text-light);padding: 10px 0;">No items inside. Open a product page and click "+ Add to Collection"!</span>
            ` : colProducts.map(p => `
              <div class="thumb-item" data-id="${p.id}" title="${p.name}">
                <img src="${p.image}" alt="${p.name}">
                <div class="thumb-hover-overlay">
                  <span>View Details</span>
                </div>
                ${col.isCustom ? `
                  <button class="remove-from-col-btn" data-col-id="${col.id}" data-prod-id="${p.id}" title="Remove Item">×</button>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="col-actions" style="justify-content: space-between; align-items: center; display: flex;">
          <div>
            ${col.isCustom ? `
              <button class="delete-col-btn btn-secondary" data-id="${col.id}" style="color: var(--red); border-color: var(--red); height: 40px; padding: 0 16px; font-weight:750; border-radius:10px; cursor:pointer; background:white; border:1px solid var(--red);">
                Delete Collection
              </button>
            ` : ''}
          </div>
          <button class="btn-primary buy-col-btn" data-id="${col.id}" ${colProducts.length === 0 ? 'disabled' : ''}>
            Add Entire Bundle to Cart
          </button>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll('.thumb-item img').forEach(img => {
      img.addEventListener('click', () => {
        const id = parseInt(img.closest('[data-id]').getAttribute('data-id'));
        window.dispatchEvent(new CustomEvent('product:view', { detail: id }));
      });
    });

    container.querySelectorAll('.remove-from-col-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const colId = btn.getAttribute('data-col-id');
        const prodId = parseInt(btn.getAttribute('data-prod-id'));
        const collections = this.loadCustomCollections();
        const col = collections.find(c => c.id === colId);
        if (col) {
          col.productIds = col.productIds.filter(id => id !== prodId);
          this.saveCustomCollections(collections);
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Item removed from collection.' }));
          this.injectCuratedCollections();
        }
      });
    });

    container.querySelectorAll('.delete-col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-id');
        let collections = this.loadCustomCollections();
        collections = collections.filter(c => c.id !== id);
        this.saveCustomCollections(collections);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Collection deleted.' }));
        this.injectCuratedCollections();
      });
    });

    container.querySelectorAll('.buy-col-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const colId = btn.getAttribute('data-id');
        let col = customCollections.find(c => c.id === colId);
        if (!col) col = defaultCollections.find(c => c.id === colId);
        if (col) {
          const colProducts = this.products.filter(p => col.productIds.includes(p.id));
          colProducts.forEach(p => {
            window.dispatchEvent(new CustomEvent('cart:add', { detail: p }));
          });
          window.dispatchEvent(new CustomEvent('toast:show', { 
            detail: `Added "${col.name}" bundle to your cart! 🛒` 
          }));
        }
      });
    });
  }

  attachPdpListeners(product) {
    const shadow = this.shadowRoot;

    // Back button
    const backBtn = shadow.getElementById('pdp-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (document.referrer || window.history.length > 1) {
          window.history.back();
        } else {
          this.currentPage = 'catalog';
          this.currentCategory = 'All';
          this.renderPageContent();
          window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
        }
      });
    }

    // Breadcrumbs
    shadow.getElementById('crumb-home').addEventListener('click', () => {
      this.currentPage = 'home';
      this.renderPageContent();
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'home' } }));
    });

    shadow.getElementById('crumb-catalog').addEventListener('click', () => {
      this.currentPage = 'catalog';
      this.currentCategory = 'All';
      this.renderPageContent();
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
    });

    shadow.getElementById('crumb-cat-name').addEventListener('click', () => {
      this.currentPage = 'catalog';
      this.currentCategory = product.category;
      this.renderPageContent();
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: product.category } }));
    });

    // Thumbnails
    shadow.querySelectorAll('.pdp-thumb-card').forEach(thumb => {
      thumb.addEventListener('click', () => {
        shadow.querySelectorAll('.pdp-thumb-card').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');
        this.activeThumbnailIdx = parseInt(thumb.getAttribute('data-index'));
      });
    });

    // Wishlist
    shadow.getElementById('pdp-wish-btn').addEventListener('click', () => {
      this.addToWishlist(product);
    });
    shadow.getElementById('pdp-wish-side-btn').addEventListener('click', () => {
      this.addToWishlist(product);
    });

    // Share
    shadow.getElementById('pdp-share-btn').addEventListener('click', () => {
      const shareUrl = `${window.location.origin}${window.location.pathname}?product=${product.id}`;
      
      if (navigator.share) {
        navigator.share({
          title: product.name,
          text: `Check out the ${product.name} on SWEETOS!`,
          url: shareUrl
        }).catch(() => {
          // Fallback if browser share fails/is cancelled
          navigator.clipboard.writeText(shareUrl).then(() => {
            window.dispatchEvent(new CustomEvent('toast:show', { detail: `Link to "${product.name}" copied to clipboard! 🔗` }));
          });
        });
      } else {
        // Clipboard fallback
        navigator.clipboard.writeText(shareUrl).then(() => {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Link to "${product.name}" copied to clipboard! 🔗` }));
        });
      }
    });

    // Quantity selectors
    const qtyValEl = shadow.getElementById('pdp-qty-val');
    shadow.getElementById('pdp-qty-dec').addEventListener('click', () => {
      if (this.pdpQuantity > 1) {
        this.pdpQuantity--;
        qtyValEl.textContent = this.pdpQuantity;
      }
    });
    shadow.getElementById('pdp-qty-inc').addEventListener('click', () => {
      if (this.pdpQuantity < 34) {
        this.pdpQuantity++;
        qtyValEl.textContent = this.pdpQuantity;
      }
    });

    // Colors
    shadow.querySelectorAll('.pdp-color-dot').forEach(dot => {
      dot.addEventListener('click', () => {
        shadow.querySelectorAll('.pdp-color-dot').forEach(d => d.classList.remove('active'));
        shadow.querySelectorAll('.pdp-color-dot').forEach(d => d.innerHTML = '');
        
        dot.classList.add('active');
        this.selectedColor = dot.getAttribute('data-color-name');
        shadow.getElementById('color-label').textContent = this.selectedColor.toUpperCase();
        
        dot.innerHTML = `
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="white" stroke-width="3">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        `;
      });
    });

    // Add to Cart
    shadow.getElementById('pdp-add-cart-btn').addEventListener('click', () => {
      const addedProduct = { ...product };
      for (let i = 0; i < this.pdpQuantity; i++) {
        window.dispatchEvent(new CustomEvent('cart:add', { detail: addedProduct }));
      }
    });

    // Buy Now
    shadow.getElementById('pdp-buy-now-btn').addEventListener('click', () => {
      const addedProduct = { ...product };
      window.dispatchEvent(new CustomEvent('cart:add', { detail: addedProduct }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('checkout:start'));
      }, 100);
    });

    // Accordions
    shadow.querySelectorAll('.pdp-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const section = header.getAttribute('data-section');
        this.openAccordions[section] = !this.openAccordions[section];
        
        const itemEl = header.closest('.pdp-accordion-item');
        const iconEl = header.querySelector('.accordion-icon');
        
        if (this.openAccordions[section]) {
          itemEl.classList.add('expanded');
          iconEl.textContent = '×';
        } else {
          itemEl.classList.remove('expanded');
          iconEl.textContent = '+';
        }
      });
    });

    // Toggle Review Form
    shadow.getElementById('pdp-write-review-btn').addEventListener('click', () => {
      this.showReviewForm = !this.showReviewForm;
      const formBox = shadow.getElementById('review-form-box');
      if (this.showReviewForm) {
        formBox.classList.add('open');
        formBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        formBox.classList.remove('open');
      }
    });

    // Cancel Review Form
    shadow.getElementById('review-cancel-btn').addEventListener('click', () => {
      this.showReviewForm = false;
      shadow.getElementById('review-form-box').classList.remove('open');
    });

    // Stars selection
    const previewStars = shadow.getElementById('preview-stars-display');
    shadow.querySelectorAll('.interactive-star-icon').forEach(star => {
      star.addEventListener('click', () => {
        const value = parseInt(star.getAttribute('data-value'));
        this.formRating = value;
        
        shadow.querySelectorAll('.interactive-star-icon').forEach((s, idx) => {
          if (idx < value) {
            s.classList.add('active');
          } else {
            s.classList.remove('active');
          }
        });

        if (previewStars) {
          previewStars.textContent = '★ '.repeat(value) + '☆ '.repeat(5 - value);
        }
      });
    });

    // Real-time live review preview input listeners
    const authorInput = shadow.getElementById('review-author-name');
    const commentTextarea = shadow.getElementById('review-comment-body');
    const previewUser = shadow.getElementById('preview-user-display');
    const previewBody = shadow.getElementById('preview-body-display');

    if (authorInput) {
      authorInput.addEventListener('input', (e) => {
        if (previewUser) {
          previewUser.textContent = e.target.value.trim() || 'Your Name';
        }
      });
    }

    if (commentTextarea) {
      commentTextarea.addEventListener('input', (e) => {
        if (previewBody) {
          previewBody.textContent = e.target.value.trim() ? `"${e.target.value.trim()}"` : '"Share your experience with this product..."';
        }
      });
    }

    // Submit Review
    shadow.getElementById('review-submit-btn').addEventListener('click', () => {
      const nameInput = shadow.getElementById('review-author-name');
      const commentTextarea = shadow.getElementById('review-comment-body');
      
      const author = nameInput.value.trim();
      const body = commentTextarea.value.trim();
      
      if (!author) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please enter your name.' }));
        nameInput.focus();
        return;
      }
      if (!body) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please write some review details.' }));
        commentTextarea.focus();
        return;
      }

      const reviews = this.loadProductReviews(product.id, product.rating, product.reviews);
      reviews.unshift({
        user: author,
        rating: this.formRating,
        comment: body
      });

      this.saveProductReviews(product.id, reviews);
      
      this.showReviewForm = false;
      this.formRating = 5;
      
      this.visibleReviewsCount = Math.max(this.visibleReviewsCount, 5);
      
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Review submitted successfully! Thank you ⭐' }));
      this.renderPageContent();
      
      setTimeout(() => {
        const dashboard = this.shadowRoot.querySelector('.pdp-reviews-dashboard-section');
        if (dashboard) {
          dashboard.scrollIntoView({ behavior: 'smooth' });
        }
      }, 300);
    });

    // See More reviews click
    const seeMoreReviewsBtn = shadow.getElementById('pdp-see-more-reviews-btn');
    if (seeMoreReviewsBtn) {
      seeMoreReviewsBtn.addEventListener('click', () => {
        this.visibleReviewsCount += 5;
        this.renderPageContent();
        
        setTimeout(() => {
          const listArea = this.shadowRoot.querySelector('.reviews-filtered-content-area');
          if (listArea) {
            listArea.scrollIntoView({ behavior: 'smooth', block: 'end' });
          }
        }, 50);
      });
    }

    // Review Filters
    shadow.querySelectorAll('.filter-pill-btn').forEach(pill => {
      pill.addEventListener('click', () => {
        shadow.querySelectorAll('.filter-pill-btn').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeReviewFilter = pill.getAttribute('data-filter');
        this.visibleReviewsCount = 5; 
        this.renderPageContent();
        
        const dashboardEl = this.shadowRoot.querySelector('.pdp-reviews-dashboard-section');
        if (dashboardEl) {
          dashboardEl.scrollIntoView({ behavior: 'auto' });
        }
      });
    });

    // Scroll to reviews
    const revLink = shadow.getElementById('reviews-jump-btn');
    if (revLink) {
      revLink.addEventListener('click', (e) => {
        e.preventDefault();
        const dashboardEl = this.shadowRoot.querySelector('.pdp-reviews-dashboard-section');
      });
    }

    // Curated Collections Dropdown & Create handlers
    const colBtn = shadow.getElementById('pdp-add-col-btn');
    const colDropdown = shadow.getElementById('pdp-col-dropdown');
    
    if (colBtn && colDropdown) {
      colBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        colDropdown.classList.toggle('open');
        this.populatePdpColDropdown(product.id);
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', () => {
        colDropdown.classList.remove('open');
      });
      
      colDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    }

    const createBtn = shadow.getElementById('pdp-col-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (colDropdown) colDropdown.classList.remove('open');
        this.openCustomCreateModal((name) => {
          const collections = this.loadCustomCollections();
          const newCol = {
            id: 'col-' + Date.now(),
            name: name,
            subtitle: "User Curated Gear Setup",
            description: "A custom curated collection of hardware items tailored for your workspace layout.",
            badge: "MY GEAR",
            price: 0,
            originalPrice: 0,
            themeColor: "#0052cc",
            productIds: [product.id] // seed with current product!
          };
          collections.push(newCol);
          this.saveCustomCollections(collections);
          window.dispatchEvent(new CustomEvent('toast:show', { 
            detail: `Created "${name}" and added ${product.name}! 📁` 
          }));
        });
      });
    }
  }

  // --- Functional Wishlist Event Handlers ---
  attachWishlistListeners() {
    const shadow = this.shadowRoot;

    const exploreBtn = shadow.getElementById('wishlist-explore-btn');
    if (exploreBtn) {
      exploreBtn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
      });
    }

    shadow.querySelectorAll('.wishlist-item-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        this.removeFromWishlist(id);
      });
    });

    shadow.querySelectorAll('.wishlist-add-to-cart-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        const product = this.products.find(p => p.id === id);
        if (product) {
          window.dispatchEvent(new CustomEvent('cart:add', { detail: product }));
          this.removeFromWishlist(id); 
        }
      });
    });

    shadow.querySelectorAll('.wishlist-item-image img, .wishlist-item-title').forEach(el => {
      el.addEventListener('click', () => {
        const card = el.closest('[data-id]');
        const id = parseInt(card.getAttribute('data-id'));
        window.dispatchEvent(new CustomEvent('product:view', { detail: id }));
      });
    });
  }

  // --- Functional About Tabs Handlers ---
  injectAboutTabContent() {
    const tabArea = this.shadowRoot.getElementById('about-tab-content');
    if (!tabArea) return;

    if (this.activeAboutTab === 'about-us') {
      const storeName = localStorage.getItem('SWEETOS_store_name') || 'SWEETOS';
      const storeAboutStory = localStorage.getItem('SWEETOS_store_about_story') || 'We believe that your physical workspace is a direct reflection of your mind. Every tactile keystroke on our mechanical layouts, every frequency shift in our custom studio audio monitors, and every ambient ray of smart lighting is calibrated to enhance focus, creativity, and deep flow.\n\nSWEETOS was founded to rescue professionals from cluttered, generic desks. By sourcing only the finest premium materials — including solid oak, CNC-milled aluminum, and artisan felt wool — we deliver functional luxury that is made to last a lifetime.';
      const storeEntranceImage = localStorage.getItem('SWEETOS_store_entrance_image') || './assets/desk_mat_1786712444512.jpg';
      
      const s1Val = localStorage.getItem('SWEETOS_about_stat_1_val') || '15,000+';
      const s1Lbl = localStorage.getItem('SWEETOS_about_stat_1_lbl') || 'Workspace upgrades';
      const s2Val = localStorage.getItem('SWEETOS_about_stat_2_val') || '50+';
      const s2Lbl = localStorage.getItem('SWEETOS_about_stat_2_lbl') || 'Countries shipped';
      const s3Val = localStorage.getItem('SWEETOS_about_stat_3_val') || '99.4%';
      const s3Lbl = localStorage.getItem('SWEETOS_about_stat_3_lbl') || 'Satisfaction Rate';
      const s4Val = localStorage.getItem('SWEETOS_about_stat_4_val') || '24/7';
      const s4Lbl = localStorage.getItem('SWEETOS_about_stat_4_lbl') || 'Concierge support';

      const p1Title = localStorage.getItem('SWEETOS_about_p1_title') || 'Authentic Sourcing';
      const p1Desc = localStorage.getItem('SWEETOS_about_p1_desc') || 'Solid wood, premium wool felt, and genuine electronic components sourced ethically from certified sustainable forestry and fabricators.';
      const p2Title = localStorage.getItem('SWEETOS_about_p2_title') || 'Ergonomic Tactility';
      const p2Desc = localStorage.getItem('SWEETOS_about_p2_desc') || 'Designed to optimize hand postures, wrist health, and auditory acoustics for high-productivity workspace layouts and mechanical switches.';
      const p3Title = localStorage.getItem('SWEETOS_about_p3_title') || 'Global Shipping';
      const p3Desc = localStorage.getItem('SWEETOS_about_p3_desc') || 'Swift shipping to over 50 African countries and globally with secure tracking and reliable express courier partners.';

      const storyParagraphs = storeAboutStory.split('\n\n').map(p => `
        <p style="font-size: 15.5px; color: var(--text-gray); line-height: 1.8; margin: 0;">${p.trim()}</p>
      `).join('');

      tabArea.innerHTML = `
        <div class="about-us-tab animate-in" style="display: flex; flex-direction: column; gap: 48px;">
          
          <!-- Section 1: Philosophy Row -->
          <div class="about-section" style="display: flex; gap: 40px; align-items: center; flex-wrap: wrap;">
            <div style="flex: 1.2; min-width: 300px; display: flex; flex-direction: column; gap: 16px;">
              <h3 style="font-size: 26px; font-weight: 850; color: var(--text-dark); margin: 0; letter-spacing: -0.5px;">The ${storeName} Design Philosophy</h3>
              ${storyParagraphs}
            </div>
            <div style="flex: 1; min-width: 300px; display: flex; justify-content: center;">
              <img src="${storeEntranceImage}" alt="${storeName} Workspace Layout" style="width: 100%; max-width: 440px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.06); border: 1.5px solid var(--border); max-height: 300px; object-fit: cover;">
            </div>
          </div>

          <!-- Section 2: Key Sourcing / Impact Numbers -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 24px;">
            <div class="glass-panel" style="padding: 24px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
              <div style="font-size: 32px; font-weight: 850; color: var(--primary); margin-bottom: 4px;">${s1Val}</div>
              <span style="font-size: 13px; font-weight: 750; color: var(--text-dark); text-transform: uppercase; letter-spacing: 0.5px;">${s1Lbl}</span>
            </div>
            <div class="glass-panel" style="padding: 24px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
              <div style="font-size: 32px; font-weight: 850; color: var(--primary); margin-bottom: 4px;">${s2Val}</div>
              <span style="font-size: 13px; font-weight: 750; color: var(--text-dark); text-transform: uppercase; letter-spacing: 0.5px;">${s2Lbl}</span>
            </div>
            <div class="glass-panel" style="padding: 24px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
              <div style="font-size: 32px; font-weight: 850; color: var(--primary); margin-bottom: 4px;">${s3Val}</div>
              <span style="font-size: 13px; font-weight: 750; color: var(--text-dark); text-transform: uppercase; letter-spacing: 0.5px;">${s3Lbl}</span>
            </div>
            <div class="glass-panel" style="padding: 24px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
              <div style="font-size: 32px; font-weight: 850; color: var(--primary); margin-bottom: 4px;">${s4Val}</div>
              <span style="font-size: 13px; font-weight: 750; color: var(--text-dark); text-transform: uppercase; letter-spacing: 0.5px;">${s4Lbl}</span>
            </div>
          </div>

          <!-- Section 3: Premium Sourcing Principles -->
          <div>
            <h3 style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin: 0 0 24px 0; text-align: center;">Our Design Principles</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px;">
              
              <div class="glass-panel" style="padding: 24px; border-radius: 16px; background: rgba(0, 82, 204, 0.015); border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 28px; background: rgba(0, 82, 204, 0.05); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">🪵</div>
                <h4 style="font-size: 16px; font-weight: 750; color: var(--text-dark); margin: 0;">${p1Title}</h4>
                <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.6; margin: 0;">${p1Desc}</p>
              </div>

              <div class="glass-panel" style="padding: 24px; border-radius: 16px; background: rgba(0, 82, 204, 0.015); border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 28px; background: rgba(0, 82, 204, 0.05); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">⌨️</div>
                <h4 style="font-size: 16px; font-weight: 750; color: var(--text-dark); margin: 0;">${p2Title}</h4>
                <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.6; margin: 0;">${p2Desc}</p>
              </div>

              <div class="glass-panel" style="padding: 24px; border-radius: 16px; background: rgba(0, 82, 204, 0.015); border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px;">
                <div style="font-size: 28px; background: rgba(0, 82, 204, 0.05); width: 50px; height: 50px; display: flex; align-items: center; justify-content: center; border-radius: 12px;">🌍</div>
                <h4 style="font-size: 16px; font-weight: 750; color: var(--text-dark); margin: 0;">${p3Title}</h4>
                <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.6; margin: 0;">${p3Desc}</p>
              </div>

            </div>
          </div>

          <!-- Section 4: Behind the Scenes Gallery Grid -->
          <div>
            <h3 style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin: 0 0 8px 0; text-align: center;">Behind The Scenes</h3>
            <p style="font-size: 14px; color: var(--text-gray); text-align: center; margin: 0 0 28px 0; max-width: 500px; margin-left: auto; margin-right: auto;">Explore the custom raw materials and hardware prototypes that define the SWEETOS ecosystem.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px;">
              
              <!-- Gallery Card 1: Keyboards -->
              <div class="glass-panel" style="border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                <img src="./assets/keyboard.jpg" alt="SWEETOS Custom Switches" style="width: 100%; height: 150px; object-fit: cover;">
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
                  <strong style="font-size: 14.5px; color: var(--text-dark);">⌨️ Keyboard Mechanics</strong>
                  <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">CNC aluminum keycaps and customizable mechanical switch housings.</span>
                </div>
              </div>

              <!-- Gallery Card 2: Monitor Stands -->
              <div class="glass-panel" style="border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                <img src="./assets/monitor_stand.jpg" alt="Solid Oak Shelving" style="width: 100%; height: 150px; object-fit: cover;">
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
                  <strong style="font-size: 14.5px; color: var(--text-dark);">🪵 Solid Oak Woodcuts</strong>
                  <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Hand-sanded solid oak timber logs shaped into monitor risers.</span>
                </div>
              </div>

              <!-- Gallery Card 3: Headphones -->
              <div class="glass-panel" style="border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                <img src="./assets/headphones.jpg" alt="High Fidelity Headphones" style="width: 100%; height: 150px; object-fit: cover;">
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
                  <strong style="font-size: 14.5px; color: var(--text-dark);">🎧 Acoustic Engineering</strong>
                  <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Beryllium drivers calibrated for true spatial frequency response.</span>
                </div>
              </div>

              <!-- Gallery Card 4: Lighting -->
              <div class="glass-panel" style="border: 1.5px solid var(--border); border-radius: 16px; overflow: hidden; display: flex; flex-direction: column; transition: transform 0.2s;" onmouseover="this.style.transform='scale(1.02)'" onmouseout="this.style.transform='none'">
                <img src="./assets/desk_lamp.jpg" alt="Intelligent Ambient Lights" style="width: 100%; height: 150px; object-fit: cover;">
                <div style="padding: 16px; display: flex; flex-direction: column; gap: 6px;">
                  <strong style="font-size: 14.5px; color: var(--text-dark);">💡 Ambient Raytracing</strong>
                  <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Intelligent smart LED strips reflecting warm daylight ambiance.</span>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 5: The SWEETOS Timeline Journey -->
          <div>
            <h3 style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin: 0 0 24px 0; text-align: center;">Notre Parcours (Our Journey)</h3>
            <div style="display: flex; flex-direction: column; gap: 20px; max-width: 700px; margin: 0 auto; position: relative;">
              <!-- Central line connector -->
              <div style="position: absolute; left: 19px; top: 8px; bottom: 8px; width: 3px; background: rgba(0, 82, 204, 0.15); z-index: 1;"></div>
              
              <!-- Timeline Point 1 -->
              <div style="display: flex; gap: 20px; align-items: flex-start; position: relative; z-index: 2;">
                <div style="background: var(--primary); color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 16px; font-weight: 800; flex-shrink: 0; box-shadow: 0 0 0 6px rgba(0, 82, 204, 0.1);">24</div>
                <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white; flex: 1;">
                  <strong style="font-size: 15px; color: var(--text-dark); display: block; margin-bottom: 6px;">2024: Custom Mechanical Core</strong>
                  <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.5; margin: 0;">Started in a tiny workshop in Abidjan, Côte d'Ivoire, hand-wiring custom mechanical keyboard keycap sets and premium desk mats for digital creators.</p>
                </div>
              </div>

              <!-- Timeline Point 2 -->
              <div style="display: flex; gap: 20px; align-items: flex-start; position: relative; z-index: 2;">
                <div style="background: var(--primary); color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 16px; font-weight: 800; flex-shrink: 0; box-shadow: 0 0 0 6px rgba(0, 82, 204, 0.1);">25</div>
                <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white; flex: 1;">
                  <strong style="font-size: 15px; color: var(--text-dark); display: block; margin-bottom: 6px;">2025: Sustainable Oak Ecosystems</strong>
                  <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.5; margin: 0;">Introduced custom-crafted monitor stands and risers shaped from solid oak timber and premium acoustic spatial panels.</p>
                </div>
              </div>

              <!-- Timeline Point 3 -->
              <div style="display: flex; gap: 20px; align-items: flex-start; position: relative; z-index: 2;">
                <div style="background: var(--primary); color: white; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 16px; font-weight: 800; flex-shrink: 0; box-shadow: 0 0 0 6px rgba(0, 82, 204, 0.1);">26</div>
                <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white; flex: 1;">
                  <strong style="font-size: 15px; color: var(--text-dark); display: block; margin-bottom: 6px;">2026: Workspace Masterworks & Logistics</strong>
                  <p style="font-size: 13.5px; color: var(--text-gray); line-height: 1.5; margin: 0;">Launched smart ambient lighting, custom audio DACs, and secure express shipping network links serving over 50 African countries and worldwide.</p>
                </div>
              </div>

            </div>
          </div>

          <!-- Section 6: Our Team (Les Artisans) -->
          <div>
            <h3 style="font-size: 22px; font-weight: 850; color: var(--text-dark); margin: 0 0 8px 0; text-align: center;">Our Creative Team</h3>
            <p style="font-size: 14px; color: var(--text-gray); text-align: center; margin: 0 0 28px 0; max-width: 500px; margin-left: auto; margin-right: auto;">The workspace architects, technical engineers, and woodcut artists driving the SWEETOS standard.</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 24px;">
              
              <!-- Team Card 1 -->
              <div class="glass-panel" style="padding: 28px 20px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; display: flex; flex-direction: column; align-items: center; gap: 14px;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #0052cc, #00b4d8); color: white; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(0, 82, 204, 0.15);">AP</div>
                <div>
                  <strong style="font-size: 15.5px; color: var(--text-dark); display: block;">Alina Putri</strong>
                  <span style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">Chief Workspace Designer</span>
                </div>
                <p style="font-size: 13px; color: var(--text-gray); line-height: 1.5; margin: 0;">Specializes in ergonomic keycap profiles, aesthetic workspace blueprints, and wool felt layout styling.</p>
              </div>

              <!-- Team Card 2 -->
              <div class="glass-panel" style="padding: 28px 20px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; display: flex; flex-direction: column; align-items: center; gap: 14px;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #a78bfa); color: white; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(124, 58, 237, 0.15);">AL</div>
                <div>
                  <strong style="font-size: 15.5px; color: var(--text-dark); display: block;">Austin Lebechi</strong>
                  <span style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">Technical Audio Architect</span>
                </div>
                <p style="font-size: 13px; color: var(--text-gray); line-height: 1.5; margin: 0;">Calibrates beryllium drivers, custom mechanical switch response timings, and intelligent light sync programs.</p>
              </div>

              <!-- Team Card 3 -->
              <div class="glass-panel" style="padding: 28px 20px; border-radius: 16px; border: 1.5px solid var(--border); text-align: center; background: white; display: flex; flex-direction: column; align-items: center; gap: 14px;">
                <div style="width: 64px; height: 64px; border-radius: 50%; background: linear-gradient(135deg, #36b37e, #85e3b2); color: white; font-size: 22px; font-weight: 800; display: flex; align-items: center; justify-content: center; box-shadow: 0 8px 16px rgba(54, 179, 126, 0.15);">MG</div>
                <div>
                  <strong style="font-size: 15.5px; color: var(--text-dark); display: block;">Marc Gboho</strong>
                  <span style="font-size: 12px; font-weight: 700; color: var(--primary); text-transform: uppercase;">Master Timber Carpenter</span>
                </div>
                <p style="font-size: 13px; color: var(--text-gray); line-height: 1.5; margin: 0;">Oversees premium solid oak timber cutting, manual sanding, and ethical sourcing standards from sustainable forests.</p>
              </div>

            </div>
          </div>

        </div>
      `;

    } else if (this.activeAboutTab === 'terms') {
      const profile = this.loadUserProfile();
      tabArea.innerHTML = `
        <div class="about-terms-tab animate-in" style="display: flex; flex-direction: column; gap: 32px; color: var(--text-dark); line-height: 1.7;">
          
          <!-- Title Banner -->
          <div style="background: linear-gradient(135deg, #0b1a30 0%, #15305b 100%); border-radius: 20px; padding: 36px; display: flex; gap: 24px; align-items: center; box-shadow: 0 10px 30px rgba(11,26,48,0.15); color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; right: -10%; top: -10%; width: 250px; height: 250px; background: rgba(0, 180, 216, 0.12); filter: blur(60px); border-radius: 50%;"></div>
            <div style="background: rgba(255,255,255,0.1); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 16px; font-size: 26px; flex-shrink: 0; position: relative; z-index: 1;">📄</div>
            <div style="display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 1;">
              <h2 style="font-size: 32px; font-weight: 850; margin: 0; color: white; letter-spacing: -0.5px;">Terms & Conditions · SWEETOS</h2>
              <p style="font-size: 14.5px; color: rgba(255,255,255,0.75); margin: 0; max-width: 680px; line-height: 1.5;">Please read these terms and conditions carefully before using our platform. By accessing or using our services, you agree to be bound by these terms.</p>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.08); padding: 5px 12px; border-radius: 8px; font-size: 12px; width: fit-content; border: 1px solid rgba(255,255,255,0.1); font-weight: 700; margin-top: 4px;">
                ✓ Effective April 2026
              </div>
            </div>
          </div>

          <!-- Last Updated Alert Box -->
          <div class="glass-panel" style="padding: 14px 20px; border-radius: 12px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 10px; font-size: 13.5px; font-weight: 700; color: var(--text-gray); background: rgba(255,255,255,0.4);">
            <span>🕒</span> Last Updated: April 15, 2026
          </div>

          <!-- Table of Contents -->
          <div class="glass-panel" style="padding: 28px; border-radius: 20px; border: 1.5px solid var(--border); background: white;">
            <h4 style="font-size: 16px; font-weight: 850; margin: 0 0 20px 0; display: flex; align-items: center; gap: 8px; color: var(--text-dark);">
              <span>📋</span> Table of Contents
            </h4>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 12px 24px;">
              <a href="#" data-scroll-sec="1" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">1. Acceptance of Terms</a>
              <a href="#" data-scroll-sec="2" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">2. User Accounts</a>
              <a href="#" data-scroll-sec="3" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">3. Orders & Payments</a>
              <a href="#" data-scroll-sec="4" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">4. Shipping & Delivery</a>
              <a href="#" data-scroll-sec="5" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">5. Returns & Refunds</a>
              <a href="#" data-scroll-sec="6" style="font-size: 13.5px; font-weight: 650; color: var(--primary); text-decoration: none; display: flex; gap: 6px; align-items: center;">6. Intellectual Property</a>
            </div>
          </div>

          <!-- Section 1 -->
          <div id="terms-section-1" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">1</span>
              Acceptance of Terms <span style="color: #36b37e; font-size: 15px;">✓</span>
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">By accessing and using the SWEETOS platform, you agree to comply with and be bound by these terms. If you do not agree, please do not use our services.</p>
            <ul style="margin: 0; padding-left: 20px; list-style-type: none; display: flex; flex-direction: column; gap: 8px; font-size: 14px; color: var(--text-gray);">
              <li>🔸 You must be at least 18 years old to order setup products.</li>
              <li>🔸 You agree to provide accurate and complete registration info.</li>
              <li>🔸 You are responsible for maintaining account credential confidentiality.</li>
            </ul>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 2 -->
          <div id="terms-section-2" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">2</span>
              User Accounts 👤
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">To place orders and track delivery details, user accounts are securely created and stored on our server database. You are responsible for all activities under your credentials.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 3 -->
          <div id="terms-section-3" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">3</span>
              Orders & Payments 💳
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">Prices are subject to change without notice. All submitted orders are processed securely on the server and broadcasted directly to the admin moderation queue.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 4 -->
          <div id="terms-section-4" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">4</span>
              Shipping & Delivery 🚚
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">We aim to package and deliver your setup components promptly. Delivery estimates may fluctuate based on customs, logistics dispatch, and regional couriers.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 5 -->
          <div id="terms-section-5" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">5</span>
              Returns & Refunds 🔄
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">Unopened mechanical desk setup hardware items are eligible for refund requests inside 7 business days from receipt. Return shipping costs are born by the customer.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 6 -->
          <div id="terms-section-6" style="display: flex; flex-direction: column; gap: 12px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">6</span>
              Intellectual Property ©
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">All digital assets, photographs, code segments, logos, and layouts are the exclusive property of SWEETOS and protected under copyright laws.</p>
          </div>

          <hr style="border: 0; border-top: 1px solid var(--border); margin: 8px 0;">

          <!-- Section 7 -->
          <div id="terms-section-7" style="display: flex; flex-direction: column; gap: 20px; scroll-margin-top: 100px;">
            <h4 style="font-size: 18px; font-weight: 850; margin: 0; display: flex; align-items: center; gap: 8px;">
              <span style="background: var(--primary); color: white; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px;">7</span>
              Contact Us ✉️
            </h4>
            <p style="font-size: 14.5px; color: var(--text-gray); margin: 0;">If you have questions regarding these terms, contact our support team:</p>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 20px;">
              <div class="glass-panel" style="padding: 20px; border-radius: 12px; border: 1.5px solid var(--border); display: flex; gap: 16px; align-items: center;">
                <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">✉️</div>
                <div>
                  <span style="font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase;">Support Email</span>
                  <span style="font-size: 13.5px; font-weight: 600; color: var(--text-dark); display: block;">support@SWEETOSdesigns.com</span>
                </div>
              </div>

              <div class="glass-panel" style="padding: 20px; border-radius: 12px; border: 1.5px solid var(--border); display: flex; gap: 16px; align-items: center;">
                <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">📞</div>
                <div>
                  <span style="font-size: 10px; font-weight: 800; color: var(--text-light); text-transform: uppercase;">Support Hotline</span>
                  <span style="font-size: 13.5px; font-weight: 600; color: var(--text-dark); display: block;">+225 07-00-00-00-00</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom sticky acceptance bar -->
          <div class="glass-panel animate-in" style="margin-top: 16px; padding: 24px 32px; border-radius: 20px; border: 1.5px solid var(--border); background: white; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 20px; box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div style="font-size: 20px; color: #36b37e; background: rgba(54, 179, 126, 0.08); width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">✓</div>
              <span style="font-size: 14px; font-weight: 750; color: var(--text-gray);">By continuing to use our services, you accept these terms.</span>
            </div>
            <div style="display: flex; gap: 12px;">
              <button id="terms-accept-btn" class="btn-primary" style="height: 42px; padding: 0 24px; font-size: 13.5px; font-weight: 750; border: none; border-radius: 10px; cursor: pointer; background: #10b981; color: white;">I Agree</button>
              <button id="terms-decline-btn" class="btn-secondary" style="height: 42px; padding: 0 24px; font-size: 13.5px; font-weight: 750; background: white; border: 1.5px solid var(--border); border-radius: 10px; cursor: pointer; color: var(--text-gray);">Decline</button>
            </div>
          </div>

        </div>
      `;

      // Programmatic event listeners inside Terms & Conditions page
      const shadow = this.shadowRoot;

      // Acceptance Actions
      shadow.getElementById('terms-accept-btn').addEventListener('click', () => {
        localStorage.setItem('SWEETOS_terms_accepted', 'true');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Conditions générales acceptées ! Merci de faire confiance à SWEETOS. 📄' }));
      });

      shadow.getElementById('terms-decline-btn').addEventListener('click', () => {
        localStorage.setItem('SWEETOS_terms_accepted', 'false');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Vous avez refusé les conditions générales.' }));
      });

      // Smooth scroll triggers for Table of Contents items
      shadow.querySelectorAll('[data-scroll-sec]').forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const secNum = link.getAttribute('data-scroll-sec');
          const target = shadow.getElementById(`terms-section-${secNum}`);
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });

    } else if (this.activeAboutTab === 'refund') {
      tabArea.innerHTML = `
        <div class="about-refund-tab animate-in" style="display: flex; flex-direction: column; gap: 32px; color: var(--text-dark); line-height: 1.7;">
          
          <!-- Policy Hero Banner -->
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); border-radius: 20px; padding: 36px; display: flex; gap: 24px; align-items: center; box-shadow: 0 10px 30px rgba(0,0,0,0.08); color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; right: -10%; top: -10%; width: 250px; height: 250px; background: rgba(0, 180, 216, 0.1); filter: blur(60px); border-radius: 50%;"></div>
            <div style="background: rgba(255,255,255,0.08); width: 56px; height: 56px; display: flex; align-items: center; justify-content: center; border-radius: 16px; font-size: 26px; flex-shrink: 0; position: relative; z-index: 1;">🔄</div>
            <div style="display: flex; flex-direction: column; gap: 8px; position: relative; z-index: 1;">
              <h2 style="font-size: 28px; font-weight: 850; margin: 0; color: white; letter-spacing: -0.5px;">Politique de Retour & Remboursement</h2>
              <p style="font-size: 14.5px; color: rgba(255,255,255,0.75); margin: 0; max-width: 680px; line-height: 1.5;">Nous nous engageons à vous offrir un processus de retour transparent et équitable. Découvrez ci-dessous nos conditions et délais d'éligibilité pour vos produits.</p>
            </div>
          </div>

          <!-- Refund Step-by-Step Flow -->
          <div>
            <h3 style="font-size: 18px; font-weight: 850; color: var(--text-dark); margin: 0 0 20px 0;">Comment effectuer un retour ?</h3>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px;">
              
              <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white;">
                <div style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 8px; text-transform: uppercase;">Étape 1</div>
                <strong style="font-size: 14px; color: var(--text-dark); display: block; margin-bottom: 6px;">Création de la demande</strong>
                <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Initiez votre demande de retour en ligne depuis votre historique de commande ou contactez notre support.</span>
              </div>

              <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white;">
                <div style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 8px; text-transform: uppercase;">Étape 2</div>
                <strong style="font-size: 14px; color: var(--text-dark); display: block; margin-bottom: 6px;">Dépôt ou Collecte</strong>
                <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Déposez le colis dans un point relais partenaire ou planifiez un retrait à domicile avec nos transporteurs.</span>
              </div>

              <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white;">
                <div style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 8px; text-transform: uppercase;">Étape 3</div>
                <strong style="font-size: 14px; color: var(--text-dark); display: block; margin-bottom: 6px;">Contrôle Qualité</strong>
                <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">À l'arrivée dans nos entrepôts, nos techniciens vérifient l'état général et la présence des accessoires sous 2 à 4 jours ouvrés.</span>
              </div>

              <div class="glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); background: white;">
                <div style="font-size: 12px; font-weight: 800; color: var(--primary); margin-bottom: 8px; text-transform: uppercase;">Étape 4</div>
                <strong style="font-size: 14px; color: var(--text-dark); display: block; margin-bottom: 6px;">Remboursement</strong>
                <span style="font-size: 12.5px; color: var(--text-gray); line-height: 1.4;">Dès approbation, les fonds sont crédités selon votre mode de paiement choisi sous 3 à 10 jours ouvrés.</span>
              </div>

            </div>
          </div>

          <!-- Mid Section Grid: Conditions & Modes -->
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(290px, 1fr)); gap: 24px;">
            
            <!-- Left Card: Conditions d'éligibilité -->
            <div class="glass-panel" style="padding: 24px; border-radius: 20px; border: 1.5px solid var(--border); background: white; display: flex; flex-direction: column; gap: 16px;">
              <h4 style="font-size: 16px; font-weight: 850; margin: 0; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
                <span>📋</span> Conditions d'éligibilité
              </h4>
              <ul style="margin: 0; padding-left: 20px; list-style-type: none; display: flex; flex-direction: column; gap: 10px; font-size: 13.5px; color: var(--text-gray);">
                <li>🔹 <strong>Délai de réflexion</strong> : Les demandes de retour doivent être faites sous <strong>7 jours</strong> (ou <strong>15 jours</strong> pour les produits VIP Platinum) après réception.</li>
                <li>🔹 <strong>État du produit</strong> : L'article doit être inutilisé, scellé dans son emballage d'origine et exempt de toute rayure ou trace de montage.</li>
                <li>🔹 <strong>Composants complets</strong> : Tous les accessoires originaux (câbles, touches de rechange, manuels d'utilisation) doivent être présents dans la boîte.</li>
                <li>🔹 <strong>Preuves de condition</strong> : Il est recommandé de photographier votre colis avant de le remettre au coursier de livraison.</li>
              </ul>
            </div>

            <!-- Right Card: Modes de Remboursement -->
            <div class="glass-panel" style="padding: 24px; border-radius: 20px; border: 1.5px solid var(--border); background: white; display: flex; flex-direction: column; gap: 16px;">
              <h4 style="font-size: 16px; font-weight: 850; margin: 0; color: var(--text-dark); display: flex; align-items: center; gap: 8px;">
                <span>💳</span> Modes de Remboursement
              </h4>
              <p style="font-size: 13.5px; color: var(--text-gray); margin: 0; line-height: 1.5;">Une fois votre retour approuvé suite au contrôle de qualité, vous disposez des options de versement suivantes :</p>
              
              <div style="display: flex; flex-direction: column; gap: 10px; margin-top: 4px;">
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-dark); font-weight: 700;">
                  <span style="font-size: 18px;">📱</span> Mobile Money (Wave, Orange Money, MTN MoMo) <span style="font-size: 11px; font-weight: 800; background: #e3f2fd; color: #0052cc; padding: 2px 8px; border-radius: 6px; margin-left: auto;">Rapide</span>
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-dark); font-weight: 700;">
                  <span style="font-size: 18px;">🏦</span> Virement bancaire (IBAN local)
                </div>
                <div style="display: flex; align-items: center; gap: 10px; font-size: 13px; color: var(--text-dark); font-weight: 700;">
                  <span style="font-size: 18px;">🎫</span> Bon d'achat SWEETOS (Crédit portefeuille instantané)
                </div>
              </div>
            </div>

          </div>

          <!-- Caution Box: Exceptions -->
          <div style="border-left: 4px solid #ff5630; padding: 18px 24px; background: rgba(255, 86, 48, 0.02); border-radius: 0 16px 16px 0; display: flex; flex-direction: column; gap: 6px;">
            <strong style="font-size: 14.5px; color: #ff5630; display: flex; align-items: center; gap: 8px;">
              <span>⚠️</span> Produits exclus du droit de retour
            </strong>
            <p style="font-size: 13px; color: var(--text-gray); line-height: 1.5; margin: 0;">
              Certains articles ne sont pas éligibles aux retours pour des raisons d'hygiène ou de personnalisation logicielle : touches de claviers personnalisées gravées à la demande, licences logicielles activées, et articles en promotion de déstockage final.
            </p>
          </div>

        </div>
      `;

    } else if (this.activeAboutTab === 'contact') {
      const storeName = localStorage.getItem('SWEETOS_store_name') || 'SWEETOS';
      const storeAddress = localStorage.getItem('SWEETOS_store_addr') || 'Abidjan, Cocody Mermoz';
      const storePhone = localStorage.getItem('SWEETOS_store_phone') || '+225 05 00 61 99 23';
      const storeEmail = localStorage.getItem('SWEETOS_store_email') || 'support@sweetos.com';
      const storeHours = localStorage.getItem('SWEETOS_store_hours') || 'Mon - Fri: 7:00 AM - 8:00 PM | Sun: Closed';
      const storeEntranceImage = localStorage.getItem('SWEETOS_store_entrance_image') || './assets/succes_technology_store_1786799642676.jpg';

      tabArea.innerHTML = `
        <div class="about-contact-tab animate-in" style="display: flex; flex-direction: column; gap: 32px;">
          
          <!-- Top Header Banner -->
          <div style="background: linear-gradient(135deg, #0b1a30 0%, #15305b 100%); border-radius: 20px; padding: 32px; display: flex; gap: 32px; align-items: center; justify-content: space-between; flex-wrap: wrap; box-shadow: 0 10px 30px rgba(11,26,48,0.15); color: white; position: relative; overflow: hidden;">
            <div style="position: absolute; right: -10%; top: -10%; width: 200px; height: 200px; background: rgba(0, 180, 216, 0.15); filter: blur(50px); border-radius: 50%;"></div>
            <div style="flex: 1.5; min-width: 280px; display: flex; flex-direction: column; gap: 14px; position: relative; z-index: 1;">
              <div style="background: rgba(255,255,255,0.1); width: 42px; height: 42px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 20px;">📍</div>
              <h3 id="contact-banner-title" style="font-size: 28px; font-weight: 850; margin: 0; color: white; letter-spacing: -0.5px;">Contact ${storeName}</h3>
              <p style="font-size: 14.5px; color: rgba(255,255,255,0.75); margin: 0; line-height: 1.5; max-width: 500px;">Your trusted partner for premium technology products and exceptional service.</p>
              <div style="font-size: 13.5px; color: rgba(255,255,255,0.65); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span>📍</span> <span id="contact-banner-address">${storeAddress}</span>
              </div>
              <div style="display: inline-flex; align-items: center; gap: 6px; background: rgba(255,255,255,0.08); padding: 6px 12px; border-radius: 8px; font-size: 12.5px; width: fit-content; border: 1px solid rgba(255,255,255,0.12);">
                <span>🕒</span> ${storeHours}
              </div>
            </div>
            <div style="flex: 1; min-width: 260px; max-width: 380px; position: relative; z-index: 1;">
              <img src="${storeEntranceImage}" alt="Storefront" style="width: 100%; border-radius: 16px; height: 180px; object-fit: cover; border: 2px solid rgba(255,255,255,0.15); box-shadow: 0 10px 20px rgba(0,0,0,0.2);">
            </div>
          </div>

          <!-- Mid Section Grid: Info Rows & Map simulation -->
          <div style="display: flex; gap: 32px; flex-wrap: wrap;">
            
            <!-- Left Side: List of Rows -->
            <div style="flex: 1.2; min-width: 300px; display: flex; flex-direction: column; gap: 16px;">
              
              <!-- Card 1: Magasin Name -->
              <div class="glass-panel" style="padding: 16px 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s;">
                <div style="display: flex; gap: 16px; align-items: center; justify-content: space-between; width: 100%;">
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">🏪</div>
                    <div>
                      <span style="font-size: 9.5px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Store Name</span>
                      <span style="font-size: 13px; font-weight: 600; color: var(--text-dark);">Business display name:</span>
                    </div>
                  </div>
                </div>
                <input type="text" id="contact-store-input" value="${storeName}" readonly style="width: 100%; border: 1.5px solid var(--border); border-radius: 10px; height: 40px; padding: 0 16px; font-size: 13px; outline: none; background: #f8fafc; color: var(--text-dark); font-weight: 600; pointer-events: none;">
              </div>

              <!-- Card 2: Emplacement -->
              <div class="glass-panel" style="padding: 16px 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s;">
                <div style="display: flex; gap: 16px; align-items: center; justify-content: space-between; width: 100%;">
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">📍</div>
                    <div>
                      <span style="font-size: 9.5px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Location</span>
                      <span style="font-size: 13px; font-weight: 600; color: var(--text-dark);">Physical address coordinates:</span>
                    </div>
                  </div>
                  <button id="contact-map-btn" style="height: 30px; padding: 0 14px; font-size: 11.5px; border-radius: 8px; border: none; cursor: pointer; flex-shrink: 0; background: var(--primary); color: white; font-weight: 750;">Carte</button>
                </div>
                <input type="text" id="contact-address-input" value="${storeAddress}" readonly style="width: 100%; border: 1.5px solid var(--border); border-radius: 10px; height: 40px; padding: 0 16px; font-size: 13px; outline: none; background: #f8fafc; color: var(--text-dark); font-weight: 600; pointer-events: none;">
              </div>

              <!-- Card 3: Phone contact -->
              <div class="glass-panel" style="padding: 16px 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s;">
                <div style="display: flex; gap: 16px; align-items: center; justify-content: space-between; width: 100%;">
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">📞</div>
                    <div>
                      <span style="font-size: 9.5px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Phone / Contact</span>
                      <span style="font-size: 13px; font-weight: 600; color: var(--text-dark);">Cellular Dial / WhatsApp text number:</span>
                    </div>
                  </div>
                  <div style="display: flex; gap: 6px; flex-shrink: 0;">
                    <button id="contact-wa-btn" style="height: 30px; padding: 0 12px; font-size: 11px; border-radius: 8px; border: none; cursor: pointer; background: #25d366; color: white; font-weight: 750;">WhatsApp</button>
                    <button id="contact-call-btn" style="height: 30px; padding: 0 12px; font-size: 11px; border-radius: 8px; border: 1.5px solid var(--border); cursor: pointer; background: white; color: var(--text-gray); font-weight: 750;">Appeler</button>
                  </div>
                </div>
                <input type="text" id="contact-phone-input" value="${storePhone}" readonly style="width: 100%; border: 1.5px solid var(--border); border-radius: 10px; height: 40px; padding: 0 16px; font-size: 13px; outline: none; background: #f8fafc; color: var(--text-dark); font-weight: 600; pointer-events: none;">
              </div>

              <!-- Card 4: Email contact -->
              <div class="glass-panel" style="padding: 16px 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; flex-direction: column; gap: 12px; transition: transform 0.2s;">
                <div style="display: flex; gap: 16px; align-items: center; justify-content: space-between; width: 100%;">
                  <div style="display: flex; gap: 16px; align-items: center;">
                    <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">✉️ </div>
                    <div>
                      <span style="font-size: 9.5px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block;">E-mail Support</span>
                      <span style="font-size: 13px; font-weight: 600; color: var(--text-dark);">Official support dispatch address:</span>
                    </div>
                  </div>
                  <button id="contact-email-btn" style="height: 30px; padding: 0 14px; font-size: 11.5px; border-radius: 8px; border: none; cursor: pointer; flex-shrink: 0; background: #0052cc; color: white; font-weight: 750;">Envoyer</button>
                </div>
                <input type="email" id="contact-email-input" value="${storeEmail}" readonly style="width: 100%; border: 1.5px solid var(--border); border-radius: 10px; height: 40px; padding: 0 16px; font-size: 13px; outline: none; background: #f8fafc; color: var(--text-dark); font-weight: 600; pointer-events: none;">
              </div>

              <!-- Card 5: Hours -->
              <div class="glass-panel" style="padding: 16px 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; justify-content: space-between; gap: 16px; transition: transform 0.2s;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                <div style="display: flex; gap: 16px; align-items: center;">
                  <div style="font-size: 20px; background: rgba(0, 82, 204, 0.05); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 50%;">🕒</div>
                  <div>
                    <span style="font-size: 9.5px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block;">Horaires d'ouverture</span>
                    <span style="font-size: 13px; font-weight: 600; color: var(--text-dark);">${storeHours}</span>
                  </div>
                </div>
                <span style="font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 8px; background: #e3f2fd; color: #0052cc; border: 1px solid rgba(0, 82, 204, 0.15);">Open</span>
              </div>

            </div>

            <!-- Right Side: Simulated Map Card -->
            <div class="glass-panel" style="flex: 1; min-width: 300px; padding: 32px; border-radius: 20px; border: 1.5px solid var(--border); display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; gap: 20px; background: rgba(255,255,255,0.85);">
              <div style="width: 72px; height: 72px; border-radius: 20px; background: rgba(0, 82, 204, 0.06); display: flex; align-items: center; justify-content: center; font-size: 36px; color: #0052cc;">🗺ï¸</div>
              <div>
                <h4 style="font-size: 18px; font-weight: 850; color: var(--text-dark); margin-bottom: 8px;">Trouvez-nous ici</h4>
                <p id="contact-map-address" style="font-size: 13px; color: var(--text-gray); line-height: 1.5; max-width: 260px; margin: 0 auto 10px;">${storeAddress}</p>
                <div id="contact-map-store" style="font-size: 14.5px; font-weight: 800; color: var(--primary); margin-top: 4px;">Store: ${storeName}</div>
              </div>
              <button id="contact-gmaps-btn" class="btn-primary" style="height: 42px; padding: 0 24px; border-radius: 10px; font-weight: 750; border: none; cursor: pointer;">Ouvrir dans Google Maps</button>
            </div>

          </div>

          <!-- Quick Action Buttons -->
          <div style="display: flex; gap: 12px; flex-wrap: wrap; justify-content: space-between; margin-top: 8px;">
            <button id="contact-itinerary-btn" class="btn-secondary" style="flex: 1; min-width: 140px; height: 44px; border-radius: 10px; font-size: 13px; font-weight: 750; background: white; cursor: pointer; border: 1.5px solid var(--border); width: 100%;">Itinéraire / Directions</button>
            <button id="contact-share-btn" class="btn-secondary" style="flex: 1; min-width: 140px; height: 44px; border-radius: 10px; font-size: 13px; font-weight: 750; background: white; cursor: pointer; border: 1.5px solid var(--border);">Partager l'emplacement</button>
            <button id="contact-browse-btn" class="btn-secondary" style="flex: 1; min-width: 140px; height: 44px; border-radius: 10px; font-size: 13px; font-weight: 750; background: white; cursor: pointer; border: 1.5px solid var(--border);">Parcourir les produits</button>
          </div>

          <!-- Social Connect Row -->
          <div class="glass-panel" style="padding: 16px 24px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-top: 8px;">
            <span style="font-size: 13.5px; font-weight: 750; color: var(--text-dark);">Connectez-vous avec nous sur les réseaux sociaux</span>
            <div style="display: flex; gap: 12px;">
              <span style="font-size: 12px; color: var(--text-light);">No social links available</span>
            </div>
          </div>

          <!-- Footer Visite Banner -->
          <div style="background: linear-gradient(135deg, #0b1a30 0%, #15305b 100%); border-radius: 20px; padding: 40px; text-align: center; color: white; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; box-shadow: 0 10px 30px rgba(11,26,48,0.15); margin-top: 16px;">
            <h3 style="font-size: 24px; font-weight: 850; margin: 0; color: white;">Prêt à nous rendre visite ?</h3>
            <p style="font-size: 14px; color: rgba(255,255,255,0.75); margin: 0; max-width: 440px; line-height: 1.5;">Venez découvrir nos produits en personne. Nous sommes ravis de vous servir !</p>
            <div style="display: flex; gap: 16px; width: 100%; max-width: 360px; justify-content: center;">
              <button id="contact-footer-itinerary-btn" class="btn-primary" style="flex: 1; height: 42px; border-radius: 10px; font-weight: 750; font-size: 13.5px; border: none; cursor: pointer;">Itinéraire</button>
              <button id="contact-footer-browse-btn" style="flex: 1; height: 42px; border-radius: 10px; font-weight: 750; font-size: 13.5px; background: rgba(255,255,255,0.08); border: 1.5px solid rgba(255,255,255,0.25); color: white; cursor: pointer;">Visiter le catalogue</button>
            </div>
          </div>

        </div>
      `;

      // Programmatic listeners
      const shadow = this.shadowRoot;

      const triggerMap = () => {
        const addr = shadow.getElementById('contact-address-input').value.trim();
        if (addr) {
          window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`);
        } else {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please enter a valid address to search! 📍' }));
        }
      };

      const triggerCall = () => {
        const phone = shadow.getElementById('contact-phone-input').value.trim();
        if (phone) {
          window.open(`tel:${phone}`);
        } else {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'No phone number entered!' }));
        }
      };

      const triggerWhatsApp = () => {
        const phone = shadow.getElementById('contact-phone-input').value.trim().replace(/[^0-9]/g, '');
        if (phone) {
          window.open(`https://wa.me/${phone}`);
        } else {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'No phone number entered for WhatsApp!' }));
        }
      };

      const triggerEmail = () => {
        const email = shadow.getElementById('contact-email-input').value.trim();
        if (email) {
          window.open(`mailto:${email}`);
        } else {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'No email address entered!' }));
        }
      };

      const triggerBrowse = () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
      };

      // Address input sync
      shadow.getElementById('contact-address-input').addEventListener('input', (e) => {
        const val = e.target.value;
        shadow.getElementById('contact-banner-address').textContent = val || 'No address specified';
        shadow.getElementById('contact-map-address').textContent = val || 'No address specified';
        
        const profileObj = this.loadUserProfile();
        profileObj.address = val;
        this.saveUserProfile(profileObj);
        localStorage.setItem('SWEETOS_store_addr', val);
      });

      // Phone input sync
      shadow.getElementById('contact-phone-input').addEventListener('input', (e) => {
        const val = e.target.value;
        const profileObj = this.loadUserProfile();
        profileObj.phone = val;
        this.saveUserProfile(profileObj);
        localStorage.setItem('SWEETOS_store_phone', val);
      });

      // Email input sync
      shadow.getElementById('contact-email-input').addEventListener('input', (e) => {
        const val = e.target.value;
        const profileObj = this.loadUserProfile();
        profileObj.email = val;
        this.saveUserProfile(profileObj);
        localStorage.setItem('SWEETOS_store_email', val);
      });

      // Store name input sync
      shadow.getElementById('contact-store-input').addEventListener('input', (e) => {
        const val = e.target.value;
        shadow.getElementById('contact-banner-title').textContent = `Contact ${val || 'Store'}`;
        shadow.getElementById('contact-map-store').textContent = `Store: ${val || 'Store'}`;
        localStorage.setItem('SWEETOS_store_name', val);
      });

      shadow.getElementById('contact-map-btn').addEventListener('click', triggerMap);
      shadow.getElementById('contact-gmaps-btn').addEventListener('click', triggerMap);
      shadow.getElementById('contact-itinerary-btn').addEventListener('click', triggerMap);
      shadow.getElementById('contact-footer-itinerary-btn').addEventListener('click', triggerMap);
      
      shadow.getElementById('contact-wa-btn').addEventListener('click', triggerWhatsApp);
      shadow.getElementById('contact-call-btn').addEventListener('click', triggerCall);
      shadow.getElementById('contact-email-btn').addEventListener('click', triggerEmail);

      shadow.getElementById('contact-browse-btn').addEventListener('click', triggerBrowse);
      shadow.getElementById('contact-footer-browse-btn').addEventListener('click', triggerBrowse);

      shadow.getElementById('contact-share-btn').addEventListener('click', () => {
        const addr = shadow.getElementById('contact-address-input').value.trim();
        if (addr) {
          navigator.clipboard.writeText(addr).then(() => {
            window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Address copied to clipboard! 📋' }));
          });
        }
      });
    }
  }

  attachAboutTabListeners() {
    const shadow = this.shadowRoot;
    shadow.querySelectorAll('[data-about-tab]').forEach(btn => {
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('[data-about-tab]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.getAttribute('data-about-tab');
        this.activeAboutTab = tab;
        this.injectAboutTabContent();
      });
    });
  }

  attachAboutPageListeners() {
    const shadow = this.shadowRoot;
    shadow.querySelectorAll('[data-nav-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        const targetPage = btn.getAttribute('data-nav-page');
        this.currentPage = targetPage;
        this.updateHashURL();
        this.renderPageContent();
      });
    });

    this.attachAboutTabListeners();
  }

  attachCouponsListListeners() {
    const shadow = this.shadowRoot;
    
    shadow.querySelectorAll('.unlocked-coupon-card').forEach(card => {
      card.addEventListener('click', () => {
        const code = card.getAttribute('data-coupon-code');
        this.currentCouponCode = code;
        this.renderPageContent();
      });
    });

    shadow.querySelectorAll('.scratch-canvas').forEach(canvas => {
      const cardId = parseInt(canvas.getAttribute('data-scratchcard-id'));
      const ctx = canvas.getContext('2d');
      
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#cfd8dc');
      grad.addColorStop(0.5, '#eceff1');
      grad.addColorStop(1, '#b0bec5');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      ctx.fillStyle = '#37474f';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GRATTEZ ICI / SCRATCH HERE', canvas.width / 2, canvas.height / 2 - 10);
      ctx.font = '11px sans-serif';
      ctx.fillText('🎁 Boîte Mystère 🎁', canvas.width / 2, canvas.height / 2 + 15);
      
      let isDrawing = false;
      
      const getMousePos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;
        return {
          x: (clientX - rect.left) * (canvas.width / rect.width),
          y: (clientY - rect.top) * (canvas.height / rect.height)
        };
      };
      
      const scratch = (pos) => {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 20, 0, Math.PI * 2);
        ctx.fill();
        checkProgress();
      };
      
      const checkProgress = () => {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const pixels = imgData.data;
        let transparent = 0;
        for (let i = 3; i < pixels.length; i += 4) {
          if (pixels[i] === 0) {
            transparent++;
          }
        }
        const pct = (transparent / (pixels.length / 4)) * 100;
        if (pct > 40) {
          canvas.style.opacity = '0';
          canvas.style.pointerEvents = 'none';
          
          try {
            let scratchcards = JSON.parse(localStorage.getItem('SWEETOS_user_scratchcards') || '[]');
            const idx = scratchcards.findIndex(sc => sc.id === cardId);
            if (idx > -1 && !scratchcards[idx].scratched) {
              scratchcards[idx].scratched = true;
              
              const totalCFA = scratchcards[idx].amount;
              
              const loggedInUserStr = localStorage.getItem('SWEETOS_logged_in_user');
              let userEmail = 'guest@sweetos.com';
              if (loggedInUserStr) {
                try {
                  userEmail = JSON.parse(loggedInUserStr).email;
                } catch(e) {}
              }
              let allOrders = [];
              try {
                allOrders = JSON.parse(localStorage.getItem('SWEETOS_all_orders') || '[]');
              } catch(e) {}
              
              // Count all orders placed by this user (including deleted or active ones for loyalty purchase count)
              const customerOrdersCount = allOrders.filter(o => 
                o.customerEmail === userEmail && 
                (o.status || '').toLowerCase() !== 'deleted'
              ).length;
              
              let couponValue = 0;
              let couponCodePrefix = 'OFF';
              
              if (totalCFA >= 10000 && totalCFA <= 20000 && customerOrdersCount >= 3) {
                // From 10000-20000, if they buy up to 3 times, they receive a 5% off coupon
                couponValue = 5;
                couponCodePrefix = 'LOYAL5';
              } else if (totalCFA >= 2000 && totalCFA <= 20000) {
                // From 2000-20000 gets the Oops / Good luck next time
                couponValue = 0;
              } else if (totalCFA >= 30000 && totalCFA <= 50000) {
                // From 30000-50000 receives a 5% off coupon
                couponValue = 5;
                couponCodePrefix = 'SAVE5';
              } else if (totalCFA >= 50000 && totalCFA <= 100000) {
                couponValue = 10;
                couponCodePrefix = 'SAVE10';
              } else if (totalCFA > 100000 && totalCFA <= 150000) {
                couponValue = 20;
                couponCodePrefix = 'SAVE20';
              } else if (totalCFA > 150000) {
                couponValue = 30;
                couponCodePrefix = 'SAVE30';
              }
              
              if (couponValue === 0) {
                scratchcards[idx].couponWon = 'lost';
                window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Oops! Good luck next time! 😢' }));
              } else {
                const code = `${couponCodePrefix}-${Math.floor(1000 + Math.random() * 9000)}`;
                const newCoupon = {
                  code: code,
                  type: 'percentage',
                  value: couponValue,
                  minOrder: 5000,
                  limit: 1,
                  used: 0,
                  expiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days expiry
                  status: 'active'
                };
                
                let coupons = JSON.parse(localStorage.getItem('SWEETOS_coupons') || '[]');
                const parentCoupon = coupons.find(c => 
                  c.status === 'active' && 
                  c.type === 'percentage' && 
                  c.value === couponValue &&
                  c.stock !== undefined
                );
                if (parentCoupon) {
                  parentCoupon.stock = Math.max(0, parentCoupon.stock - 1);
                  if (parentCoupon.stock === 0) {
                    parentCoupon.status = 'expired';
                  }
                }
                coupons.unshift(newCoupon);
                localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
                
                fetch('/api/coupons', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(coupons)
                }).catch(e => console.error('Failed to sync won coupon:', e));

                scratchcards[idx].couponWon = newCoupon;
                window.dispatchEvent(new CustomEvent('toast:show', { detail: `Félicitations ! Vous avez gagné un coupon de ${couponValue}% : ${code} ! 🎉` }));
              }
              localStorage.setItem('SWEETOS_user_scratchcards', JSON.stringify(scratchcards));
              
              setTimeout(() => {
                this.renderPageContent();
              }, 600);
            }
          } catch(e) {
            console.error('Scratching error:', e);
          }
        }
      };
      
      const startDrawing = (e) => {
        isDrawing = true;
        scratch(getMousePos(e));
      };
      
      const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        scratch(getMousePos(e));
      };
      
      const stopDrawing = () => {
        isDrawing = false;
      };
      
      canvas.addEventListener('mousedown', startDrawing);
      canvas.addEventListener('mousemove', draw);
      window.addEventListener('mouseup', stopDrawing);
      
      canvas.addEventListener('touchstart', startDrawing);
      canvas.addEventListener('touchmove', draw, { passive: false });
      window.addEventListener('touchend', stopDrawing);
    });
  }

  attachCouponDetailListeners(coupon) {
    const shadow = this.shadowRoot;
    
    // Back to Coupons list
    const backBtn = shadow.getElementById('coupon-back-btn');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.currentCouponCode = null;
        this.renderPageContent();
      });
    }

    // Breadcrumbs home
    const crumbHome = shadow.getElementById('coupon-crumb-home');
    if (crumbHome) {
      crumbHome.addEventListener('click', () => {
        this.currentPage = 'home';
        this.currentCouponCode = null;
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'home' } }));
      });
    }

    // Breadcrumbs list
    const crumbList = shadow.getElementById('coupon-crumb-list');
    if (crumbList) {
      crumbList.addEventListener('click', () => {
        this.currentCouponCode = null;
        this.renderPageContent();
      });
    }

    // Copy to clipboard
    const codeBox = shadow.getElementById('detail-coupon-code-box');
    if (codeBox) {
      codeBox.addEventListener('click', () => {
        navigator.clipboard.writeText(coupon.code).then(() => {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Code promo "${coupon.code}" copié ! 📋` }));
        });
      });
    }

    // Apply coupon
    const applyBtn = shadow.getElementById('detail-coupon-apply-btn');
    if (applyBtn) {
      applyBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('cart:toggle', { detail: { open: true } }));
        setTimeout(() => {
          const drawer = document.querySelector('cart-drawer');
          if (drawer && drawer.shadowRoot) {
            const input = drawer.shadowRoot.getElementById('promoInput');
            const apply = drawer.shadowRoot.getElementById('promoApply');
            if (input && apply) {
              input.value = coupon.code;
              apply.click();
            }
          }
        }, 150);
      });
    }

    // Share to WhatsApp
    const shareBtn = shadow.getElementById('detail-coupon-share-btn');
    if (shareBtn) {
      shareBtn.addEventListener('click', () => {
        const discountText = coupon.type === 'percentage' ? `${coupon.value}% OFF` : `${coupon.value} OFF`;
        const message = `🌟 OFFRE SPÉCIALE SWEETOS ! 🌟\nProfitez d'une réduction exclusive sur notre boutique en ligne !\n\nCode Promo : *${coupon.code}*\nRéduction : *${discountText}*\nDate d'expiration : *${coupon.expiry}*\n\nFaites vos achats ici : ${window.location.origin}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
    }
  }

  logCustomerActivity(pageName) {
    let sessionId = sessionStorage.getItem('SWEETOS_session_id');
    if (!sessionId) {
      sessionId = 'sess_' + Date.now();
      sessionStorage.setItem('SWEETOS_session_id', sessionId);
    }
    
    let logs = [];
    try {
      logs = JSON.parse(localStorage.getItem('SWEETOS_activity_logs') || '[]');
    } catch (err) {}
    
    let userName = 'Guest User';
    let loginType = 'Not Logged In';
    
    const loggedIn = localStorage.getItem('SWEETOS_logged_in_user');
    if (loggedIn) {
      try {
        const userObj = JSON.parse(loggedIn);
        userName = userObj.email;
        const creds = JSON.parse(localStorage.getItem('SWEETOS_customer_credentials') || '[]');
        const userCred = creds.find(c => c.email.toLowerCase() === userObj.email.toLowerCase());
        if (userCred) {
          userName = userCred.fullname || userCred.email;
          loginType = userCred.password === 'google_oauth_bypass' ? 'Google OAuth' : 'Email & Password';
        } else {
          loginType = 'Email & Password';
        }
      } catch (e) {}
    }
    
    let sessionRecord = logs.find(log => log.id === sessionId);
    const dateStr = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
    
    if (!sessionRecord) {
      const ua = navigator.userAgent;
      let browser = "Chrome"; // fallback default
      if (ua.includes("Firefox")) browser = "Firefox";
      else if (ua.includes("SamsungBrowser")) browser = "Samsung";
      else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";
      else if (ua.includes("Trident")) browser = "IE";
      else if (ua.includes("Edge") || ua.includes("Edg")) browser = "Edge";
      else if (ua.includes("Chrome")) browser = "Chrome";
      else if (ua.includes("Safari")) browser = "Safari";

      let device = "Desktop";
      if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
        device = "Tablet";
      } else if (/Mobile|iP(hone|od)|Android|BlackBerry|IEMobile|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(ua)) {
        device = "Mobile";
      }

      let source = "Direct";
      if (document.referrer) {
        try {
          const url = new URL(document.referrer);
          source = url.hostname.replace('www.', '') || "Referral";
        } catch (e) {
          source = "Referral";
        }
      }

      sessionRecord = {
        id: sessionId,
        user: userName,
        loginType: loginType,
        visits: [],
        bought: false,
        timestamp: dateStr,
        browser: browser,
        device: device,
        source: source
      };
      logs.push(sessionRecord);
    }
    
    if (userName !== 'Guest User') {
      sessionRecord.user = userName;
      sessionRecord.loginType = loginType;
    }
    
    const lastVisit = sessionRecord.visits[sessionRecord.visits.length - 1];
    if (lastVisit !== pageName) {
      sessionRecord.visits.push(pageName);
    }
    
    localStorage.setItem('SWEETOS_activity_logs', JSON.stringify(logs));
  }

  // --- Functional Notifications Event Handlers ---
  // --- Functional Profile Tab Handlers ---
  injectProfileTabContent() {
    const tabArea = this.shadowRoot.getElementById('profile-tab-content');
    if (!tabArea) return;
    const profile = this.loadUserProfile();
    
    if (this.activeProfileTab === 'overview') {
      const wishlist = this.loadWishlistFromStorage();
      
      const notifKey = 'SWEETOS_notifications';
      const savedNotif = localStorage.getItem(notifKey);
      let notifCount = 3;
      if (savedNotif) {
        try {
          notifCount = JSON.parse(savedNotif).filter(n => n.unread).length;
        } catch (e) {}
      }

      tabArea.innerHTML = `
        <div class="profile-overview-tab animate-in">
          <div class="profile-overview-hero">
            <div class="profile-avatar-circle">
              ${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}
            </div>
            <div class="profile-hero-info">
              <div class="profile-hero-name-row">
                <h3>${profile.firstName} ${profile.lastName}</h3>
                <span class="vip-member-badge">VIP Premium</span>
              </div>
              <p class="profile-hero-email">${profile.email}</p>
              <p class="profile-hero-bio">"${profile.bio}"</p>
            </div>
          </div>

          <div class="profile-stats-grid">
            <div class="stat-card">
              <div class="stat-icon cart">🛒</div>
              <div class="stat-nums">
                <span class="stat-value">${profile.orders.length}</span>
                <span class="stat-label">Orders Placed</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon dollar">💵</div>
              <div class="stat-nums">
                <span class="stat-value">$${profile.orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}</span>
                <span class="stat-label">Total Spent</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon heart">❤️</div>
              <div class="stat-nums">
                <span class="stat-value" id="profile-wish-count">${wishlist.length}</span>
                <span class="stat-label">Wishlist Items</span>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon bell">🔔</div>
              <div class="stat-nums">
                <span class="stat-value">${notifCount}</span>
                <span class="stat-label">Unread Alerts</span>
              </div>
            </div>
          </div>

          <div class="profile-orders-list-panel">
            <h4 class="profile-section-title">Order History & Tracking</h4>
            <div class="orders-list-wrapper">
              ${profile.orders.map(o => `
                <div class="profile-order-row">
                  <div class="order-info-block">
                    <span class="order-id-label">${o.id}</span>
                    <span class="order-item-desc">${o.items}</span>
                  </div>
                  <div class="order-delivery-progress">
                    <div class="progress-bar-track">
                      <div class="progress-bar-fill delivered"></div>
                    </div>
                    <span class="progress-status-text">Delivered on ${o.date}</span>
                  </div>
                  <div class="order-price-block">
                    <span class="order-total-price">$${o.total.toFixed(2)}</span>
                    <button class="order-invoice-btn" data-id="${o.id}">Invoice PDF</button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      `;

      tabArea.querySelectorAll('.order-invoice-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Downloading invoice receipt ${id}.pdf... 📄` }));
        });
      });

    } else if (this.activeProfileTab === 'settings') {
      tabArea.innerHTML = `
        <div class="profile-settings-tab animate-in">
          <h4 class="profile-section-title">Edit Profile Information</h4>
          <p class="profile-section-subtitle">Update your personal account credentials and details stored on SWEETOS.</p>
          
          <form class="profile-settings-form" id="profile-edit-form">
            <div class="form-row-2">
              <div class="form-group">
                <label for="prof-fname">First Name</label>
                <input type="text" id="prof-fname" value="${profile.firstName}" required autocomplete="given-name">
              </div>
              <div class="form-group">
                <label for="prof-lname">Last Name</label>
                <input type="text" id="prof-lname" value="${profile.lastName}" required autocomplete="family-name">
              </div>
            </div>

            <div class="form-row-2">
              <div class="form-group">
                <label for="prof-email">Email Address</label>
                <input type="email" id="prof-email" value="${profile.email}" required autocomplete="email">
              </div>
              <div class="form-group">
                <label for="prof-phone">Phone Number</label>
                <input type="text" id="prof-phone" value="${profile.phone}" required autocomplete="tel">
              </div>
            </div>

            <div class="form-group">
              <label for="prof-bio">Short Biography</label>
              <textarea id="prof-bio" rows="4" placeholder="Brief info about your desk setup preferences...">${profile.bio}</textarea>
            </div>

            <button type="submit" class="btn-primary profile-save-submit-btn">Save Changes</button>
          </form>
        </div>
      `;

      tabArea.getElementById('profile-edit-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const fname = tabArea.getElementById('prof-fname').value.trim();
        const lname = tabArea.getElementById('prof-lname').value.trim();
        const email = tabArea.getElementById('prof-email').value.trim();
        const phone = tabArea.getElementById('prof-phone').value.trim();
        const bio = tabArea.getElementById('prof-bio').value.trim();

        profile.firstName = fname;
        profile.lastName = lname;
        profile.email = email;
        profile.phone = phone;
        profile.bio = bio;

        this.saveUserProfile(profile);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Profile updated successfully! ✨' }));
        
        window.dispatchEvent(new CustomEvent('profile:updated'));

        this.injectProfileTabContent();
      });

    } else if (this.activeProfileTab === 'addresses') {
      tabArea.innerHTML = `
        <div class="profile-addresses-tab animate-in">
          <h4 class="profile-section-title">Saved Shipping Addresses</h4>
          <p class="profile-section-subtitle">Manage delivery locations and workspace delivery dropoffs.</p>

          <div class="addresses-grid">
            ${profile.addresses.map(a => `
              <div class="address-item-card glass-panel" data-id="${a.id}">
                <div class="address-card-header">
                  <h5>${a.label}</h5>
                  <button class="address-delete-btn" data-id="${a.id}">Delete</button>
                </div>
                <p class="address-street">${a.street}</p>
                <p class="address-city-zip">${a.city}, ${a.state} ${a.zip}</p>
              </div>
            `).join('')}
          </div>

          <div class="add-address-form-box glass-panel">
            <h5>Add Shipping Location</h5>
            <form class="profile-address-form" id="profile-address-form">
              <div class="form-row-2">
                <div class="form-group">
                  <label for="addr-label">Label (e.g. Home, Office)</label>
                  <input type="text" id="addr-label" placeholder="e.g. Office Layout" autocomplete="off" required>
                </div>
                <div class="form-group">
                  <label for="addr-street">Street Address</label>
                  <input type="text" id="addr-street" placeholder="e.g. 500 High St" autocomplete="street-address" required>
                </div>
              </div>
              <div class="form-row-3">
                <div class="form-group">
                  <label for="addr-city">City</label>
                  <input type="text" id="addr-city" placeholder="Sky City" autocomplete="address-level2" required>
                </div>
                <div class="form-group">
                  <label for="addr-state">State</label>
                  <input type="text" id="addr-state" placeholder="NY" autocomplete="address-level1" required>
                </div>
                <div class="form-group">
                  <label for="addr-zip">ZIP Code</label>
                  <input type="text" id="addr-zip" placeholder="10001" autocomplete="postal-code" required>
                </div>
              </div>
              <button type="submit" class="btn-primary address-save-btn">Add Address</button>
            </form>
          </div>
        </div>
      `;

      tabArea.querySelectorAll('.address-delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          profile.addresses = profile.addresses.filter(a => a.id !== id);
          this.saveUserProfile(profile);
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Address removed.' }));
          this.injectProfileTabContent();
        });
      });

      tabArea.getElementById('profile-address-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const label = tabArea.getElementById('addr-label').value.trim();
        const street = tabArea.getElementById('addr-street').value.trim();
        const city = tabArea.getElementById('addr-city').value.trim();
        const state = tabArea.getElementById('addr-state').value.trim();
        const zip = tabArea.getElementById('addr-zip').value.trim();

        const newAddr = {
          id: Date.now(),
          label,
          street,
          city,
          state,
          zip
        };

        profile.addresses.push(newAddr);
        this.saveUserProfile(profile);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Address "${label}" added! 📍` }));
        this.injectProfileTabContent();
      });

    } else if (this.activeProfileTab === 'security') {
      tabArea.innerHTML = `
        <div class="profile-security-tab animate-in">
          <h4 class="profile-section-title">Security & Preferences</h4>
          <p class="profile-section-subtitle">Fine-tune two-factor safety, alert update settings, and active color layout modes.</p>

          <div class="preferences-toggles-box">
            <h5>Notification Preferences</h5>
            
            <div class="toggle-option-row">
              <div class="toggle-info">
                <h6>Email Newsletter Codes</h6>
                <p>Receive coupon schedules, early access drops, and mechanical kit alerts.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="pref-email" ${profile.marketingEmails ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-option-row">
              <div class="toggle-info">
                <h6>SMS Delivery Updates</h6>
                <p>Get instant tracking updates text directly to your verification phone number.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="pref-sms" ${profile.smsUpdates ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>

            <div class="toggle-option-row">
              <div class="toggle-info">
                <h6>Two-Factor Account Safety</h6>
                <p>Prompt security verification codes on profile details editing or invoice checking.</p>
              </div>
              <label class="toggle-switch">
                <input type="checkbox" id="pref-2fa" ${profile.twoFactor ? 'checked' : ''}>
                <span class="toggle-slider"></span>
              </label>
            </div>
          </div>

          <div class="theme-preference-box glass-panel">
            <h5>Color Palette Profile</h5>
            <p>Select your active dashboard layout palette color accent.</p>
            <div class="theme-dropdown-row">
              <select class="theme-select-menu" id="theme-selector">
                <option value="Ice Blue" ${profile.theme === 'Ice Blue' ? 'selected' : ''}>Classic Ice Blue (Default)</option>
                <option value="Velvet Obsidian" ${profile.theme === 'Velvet Obsidian' ? 'selected' : ''}>Velvet Obsidian</option>
                <option value="Pure White" ${profile.theme === 'Pure White' ? 'selected' : ''}>Pure White Minimalist</option>
              </select>
              <button class="btn-primary" id="theme-apply-btn" style="height:40px;padding:0 20px;">Apply Theme</button>
            </div>
          </div>

          <div class="password-change-box glass-panel">
            <h5>Change Account Password</h5>
            <form id="password-change-form">
              <div class="form-group">
                <label for="pass-current">Current Password</label>
                <input type="password" id="pass-current" autocomplete="current-password" required>
              </div>
              <div class="form-group">
                <label for="pass-new">New Password</label>
                <input type="password" id="pass-new" autocomplete="new-password" required>
              </div>
              <button type="submit" class="btn-primary" style="margin-top:12px;">Update Password</button>
            </form>
          </div>
        </div>
      `;

      const emailCheck = tabArea.getElementById('pref-email');
      const smsCheck = tabArea.getElementById('pref-sms');
      const twoFaCheck = tabArea.getElementById('pref-2fa');

      const savePrefs = () => {
        profile.marketingEmails = emailCheck.checked;
        profile.smsUpdates = smsCheck.checked;
        profile.twoFactor = twoFaCheck.checked;
        this.saveUserProfile(profile);
      };

      emailCheck.addEventListener('change', () => {
        savePrefs();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Notification preferences saved.' }));
      });
      smsCheck.addEventListener('change', () => {
        savePrefs();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'SMS alert settings updated.' }));
      });
      twoFaCheck.addEventListener('change', () => {
        savePrefs();
        const msg = profile.twoFactor ? 'Two-Factor verification activated! 🛡ï¸' : 'Two-Factor verification deactivated.';
        window.dispatchEvent(new CustomEvent('toast:show', { detail: msg }));
      });

      tabArea.getElementById('theme-apply-btn').addEventListener('click', () => {
        const theme = tabArea.getElementById('theme-selector').value;
        profile.theme = theme;
        this.saveUserProfile(profile);
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Accent palette shifted to "${theme}"!` }));
      });

      tabArea.getElementById('password-change-form').addEventListener('submit', (e) => {
        e.preventDefault();
        tabArea.getElementById('pass-current').value = '';
        tabArea.getElementById('pass-new').value = '';
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Password updated successfully! Key secured. 🔑' }));
      });
    }
  }

  attachProfileTabListeners() {
    const shadow = this.shadowRoot;
    
    shadow.querySelectorAll('.profile-tab-btn').forEach(btn => {
      if (btn.id === 'profile-sign-out-btn') return;
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('.profile-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const tab = btn.getAttribute('data-tab');
        this.activeProfileTab = tab;
        this.injectProfileTabContent();
      });
    });

    const signOutBtn = shadow.getElementById('profile-sign-out-btn');
    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        localStorage.removeItem('SWEETOS_logged_in_user');
        window.dispatchEvent(new CustomEvent('auth:changed', { detail: { loggedIn: false } }));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Signed out successfully. 🔓' }));
        this.currentPage = 'home';
        this.renderPageContent();
      });
    }
  }

  // --- Functional Orders Dashboard Handlers ---
  injectOrdersDashboardList() {
    syncDeliveredNotifications();
    const loggedIn = localStorage.getItem('SWEETOS_logged_in_user');
    if (!loggedIn) {
      this.renderOrdersDashboardList();
      return;
    }
    
    let userEmail = "";
    try {
      userEmail = JSON.parse(loggedIn).email;
    } catch(e) {}
    
    if (!userEmail) {
      this.renderOrdersDashboardList();
      return;
    }

    // Fetch latest orders from server to synchronize status
    fetch('/api/orders')
      .then(res => res.json())
      .then(serverOrders => {
        if (Array.isArray(serverOrders)) {
          const profile = this.loadUserProfile();
          let profileChanged = false;
          
          if (!profile.orders) profile.orders = [];
          
          // 1. Update existing orders in profile with latest status from server
          profile.orders.forEach(po => {
            const latest = serverOrders.find(so => so.id === po.id);
            if (latest) {
              if (po.status !== latest.status || po.trackingNumber !== latest.trackingNumber) {
                po.status = latest.status;
                po.trackingNumber = latest.trackingNumber;
                profileChanged = true;
              }
            }
          });
          
          // 2. Fetch missing orders that belong to this customer
          serverOrders.forEach(so => {
            if (so.customerEmail === userEmail && (so.status || '').toLowerCase() !== 'deleted') {
              if (!profile.orders.some(po => po.id === so.id)) {
                profile.orders.unshift(so);
                profileChanged = true;
              }
            }
          });
          
          if (profileChanged) {
            const profileKey = getProfileStorageKey();
            localStorage.setItem(profileKey, JSON.stringify(profile));
            localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
          }
        }
        this.renderOrdersDashboardList();
      })
      .catch(err => {
        console.error('Failed to sync orders from server on dashboard open:', err);
        this.renderOrdersDashboardList();
      });
  }

  renderOrdersDashboardList() {
    const container = this.shadowRoot.getElementById('orders-dashboard-list');
    if (!container) return;
    container.innerHTML = '';

    const profile = this.loadUserProfile();
    const orders = profile.orders || [];

    // Filter by timeframe
    const now = new Date();
    const filteredByTime = orders.filter(o => {
      const orderDate = new Date(o.date);
      if (isNaN(orderDate.getTime())) return true;
      
      if (this.ordersTimeframe === 'Last 30 Days') {
        const diffTime = Math.abs(now - orderDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30;
      }
      if (this.ordersTimeframe === 'Last 6 Months') {
        const diffTime = Math.abs(now - orderDate);
        const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.43);
        return diffMonths <= 6;
      }
      if (this.ordersTimeframe === 'This Year') {
        return orderDate.getFullYear() === now.getFullYear();
      }
      return true; // All Time
    });

    // Calculate badge stats based on time-filtered orders with status normalization
    const allCount = filteredByTime.length;
    const placedCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'placed' || s === 'pending';
    }).length;
    const confirmCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'confirmé' || s === 'confirmed';
    }).length;
    const processingCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'en cours' || s === 'processing';
    }).length;
    const shippingCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'shipped' || s.includes('transit');
    }).length;
    const doneCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'livré' || s === 'delivered' || s === 'done' || s === 'livre';
    }).length;
    const cancelledCount = filteredByTime.filter(o => {
      const s = (o.status || '').toLowerCase();
      return s === 'cancelled';
    }).length;

    // Format Total Spent
    const totalSpent = filteredByTime.reduce((sum, o) => sum + o.total, 0);

    // Update stats boxes in UI
    const statOrders = this.shadowRoot.getElementById('stat-total-orders');
    const statTransit = this.shadowRoot.getElementById('stat-in-transit');
    const statProc = this.shadowRoot.getElementById('stat-processing');
    const statSpent = this.shadowRoot.getElementById('stat-total-spent');

    if (statOrders) statOrders.textContent = allCount;
    if (statTransit) statTransit.textContent = shippingCount;
    if (statProc) statProc.textContent = processingCount;
    if (statSpent) statSpent.textContent = formatPrice(totalSpent);

    // Update badge values on tab buttons
    const badgeAll = this.shadowRoot.getElementById('badge-all');
    const badgePlaced = this.shadowRoot.getElementById('badge-placed');
    const badgeConfirm = this.shadowRoot.getElementById('badge-confirm');
    const badgeProc = this.shadowRoot.getElementById('badge-processing');
    const badgeShip = this.shadowRoot.getElementById('badge-shipping');
    const badgeDone = this.shadowRoot.getElementById('badge-done');
    const badgeCancel = this.shadowRoot.getElementById('badge-cancelled');

    if (badgeAll) badgeAll.textContent = allCount;
    if (badgePlaced) badgePlaced.textContent = placedCount;
    if (badgeConfirm) badgeConfirm.textContent = confirmCount;
    if (badgeProc) badgeProc.textContent = processingCount;
    if (badgeShip) badgeShip.textContent = shippingCount;
    if (badgeDone) badgeDone.textContent = doneCount;
    if (badgeCancel) badgeCancel.textContent = cancelledCount;

    // Filter by search query & tab select with status mapping
    let finalFiltered = filteredByTime.filter(o => {
      // Tab filter mapping
      if (this.activeOrdersFilter !== 'All') {
        const s = (o.status || '').toLowerCase();
        if (this.activeOrdersFilter === 'Placed') {
          if (s !== 'placed' && s !== 'pending') return false;
        } else if (this.activeOrdersFilter === 'Confirm') {
          if (s !== 'confirmé' && s !== 'confirmed') return false;
        } else if (this.activeOrdersFilter === 'Processing') {
          if (s !== 'en cours' && s !== 'processing') return false;
        } else if (this.activeOrdersFilter === 'Shipping') {
          if (s !== 'shipped' && !s.includes('transit')) return false;
        } else if (this.activeOrdersFilter === 'Done') {
          if (s !== 'livré' && s !== 'delivered' && s !== 'done' && s !== 'livre') return false;
        } else if (this.activeOrdersFilter === 'Cancelled') {
          if (s !== 'cancelled') return false;
        }
      }
      // Search input matching
      if (this.ordersSearchQuery) {
        const query = this.ordersSearchQuery.toLowerCase();
        const idMatch = o.id.toLowerCase().includes(query);
        const itemMatch = o.items.toLowerCase().includes(query);
        return idMatch || itemMatch;
      }
      return true;
    });

    if (finalFiltered.length === 0) {
      container.innerHTML = `
        <div class="orders-empty-state glass-panel animate-in">
          <div class="orders-empty-icon-circle">
            <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="#627d98" stroke-width="2">
              <polygon points="12 2 2 7 12 12 22 7 12 2"></polygon>
              <polyline points="2 17 12 22 22 17"></polyline>
              <polyline points="2 12 17 22 12"></polyline>
            </svg>
          </div>
          <h4>No live orders match criteria</h4>
          <p>No real-time orders found. You can place a new order right now!</p>
          <button class="btn-secondary clear-filters-btn" id="orders-clear-filters-btn">Clear Filters</button>
        </div>
      `;
      
      const clearBtn = this.shadowRoot.getElementById('orders-clear-filters-btn');
      if (clearBtn) {
        clearBtn.addEventListener('click', () => {
          this.ordersSearchQuery = '';
          const searchInput = this.shadowRoot.getElementById('orders-search-input');
          if (searchInput) searchInput.value = '';
          
          this.ordersTimeframe = 'All Time';
          const timeframeSelect = this.shadowRoot.getElementById('orders-timeframe-selector');
          if (timeframeSelect) timeframeSelect.value = 'All Time';
          
          this.activeOrdersFilter = 'All';
          const pills = this.shadowRoot.querySelectorAll('.order-pill-btn');
          pills.forEach(p => {
            if (p.getAttribute('data-filter') === 'All') p.classList.add('active');
            else p.classList.remove('active');
          });

          this.injectOrdersDashboardList();
        });
      }
      return;
    }

    finalFiltered.forEach(o => {
      const card = document.createElement('div');
      card.className = 'order-card-compact glass-panel animate-in';
      
      const statusClass = o.status.toLowerCase();
      const itemCount = o.products ? o.products.reduce((acc, p) => acc + p.quantity, 0) : 1;

      card.innerHTML = `
        <div class="order-compact-top">
          <span class="order-compact-id">${o.id}</span>
          <span class="order-compact-status ${statusClass}">
            <span class="status-dot"></span>${o.status}
          </span>
        </div>
        
        <div class="order-compact-meta">
          <span class="meta-item">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            ${o.date}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            ${itemCount} ${itemCount === 1 ? 'item' : 'items'}
          </span>
          <span class="meta-item">
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            ${profile.firstName} ${profile.lastName}
          </span>
        </div>

        <div class="order-compact-bottom">
          <span class="order-compact-items-text">${o.items}</span>
          <div class="order-compact-right-side">
            <span class="order-compact-total">${formatPrice(o.total)}</span>
            <svg class="order-compact-chevron" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        this.showOrderDetailsModal(o);
      });

      container.appendChild(card);
    });
  }

  showOrderDetailsModal(o) {
    const profile = this.loadUserProfile();
    
    // Create detailed modal elements overlay
    let overlay = this.shadowRoot.getElementById('order-details-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'order-details-overlay';
      overlay.className = 'order-details-overlay';
      this.shadowRoot.appendChild(overlay);
    }
    
    // Build products list HTML
    let productsHtml = '';
    if (o.products && o.products.length > 0) {
      productsHtml = o.products.map(item => `
        <div class="order-item-row" data-product-id="${item.id}">
          <img class="order-item-img" src="${item.image}" alt="${item.name}">
          <div class="order-item-info">
            <span class="order-item-name">${item.name}</span>
            <span class="order-item-meta">Category: ${item.category || 'Gear'} • Qty: ${item.quantity}</span>
            <span class="order-item-sku">SKU: AET-${item.id}</span>
          </div>
          <div class="order-item-actions">
            <span class="order-item-price">${formatPrice(item.price * item.quantity)}</span>
            <button class="order-buy-again-btn btn-secondary modal-buy-btn" data-id="${item.id}">Buy Again</button>
          </div>
        </div>
      `).join('');
    } else {
      productsHtml = `
        <div class="order-item-row">
          <div class="order-item-fallback-icon" style="font-size:24px; padding:10px; background:#eff6ff; border-radius:10px; margin-right:12px;">📦</div>
          <div class="order-item-info">
            <span class="order-item-name">Premium Workspace Gear</span>
            <span class="order-item-meta">${o.items}</span>
          </div>
          <div class="order-item-actions">
            <span class="order-item-price">${formatPrice(o.total)}</span>
            <button class="order-buy-again-btn btn-secondary modal-buy-btn">Buy Again</button>
          </div>
        </div>
      `;
    }

    const canModify = (o.status === 'Processing' || o.status === 'Pending' || o.status === 'En cours');

    let statusText = '';
    let progressWidth = '0%';
    let step1Class = '';
    let step2Class = '';
    let step3Class = '';
    let step4Class = '';
    let step5Class = '';
    
    let step1Content = '1';
    let step2Content = '2';
    let step3Content = '3';
    let step4Content = '4';
    let step5Content = '5';

    const checkIcon = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: middle;"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

    const statusLower = (o.status || '').toLowerCase();

    if (statusLower === 'pending' || statusLower === 'placed') {
      statusText = 'En attente';
      progressWidth = '0%';
      step1Class = 'active';
      step1Content = '1';
    } else if (statusLower === 'confirmé' || statusLower === 'confirmed') {
      statusText = 'Confirmé';
      progressWidth = '25%';
      step1Class = 'completed';
      step1Content = checkIcon;
      step2Class = 'active';
      step2Content = '2';
    } else if (statusLower === 'en cours' || statusLower === 'processing') {
      statusText = 'En cours';
      progressWidth = '50%';
      step1Class = 'completed';
      step1Content = checkIcon;
      step2Class = 'completed';
      step2Content = checkIcon;
      step3Class = 'active';
      step3Content = '3';
    } else if (statusLower === 'shipped') {
      statusText = 'Expédié';
      progressWidth = '75%';
      step1Class = 'completed';
      step1Content = checkIcon;
      step2Class = 'completed';
      step2Content = checkIcon;
      step3Class = 'completed';
      step3Content = checkIcon;
      step4Class = 'active';
      step4Content = '4';
    } else if (statusLower === 'livré' || statusLower === 'delivered' || statusLower === 'done' || statusLower === 'livre') {
      statusText = 'Livré';
      progressWidth = '100%';
      step1Class = 'completed';
      step1Content = checkIcon;
      step2Class = 'completed';
      step2Content = checkIcon;
      step3Class = 'completed';
      step3Content = checkIcon;
      step4Class = 'completed';
      step4Content = checkIcon;
      step5Class = 'completed';
      step5Content = checkIcon;
    } else {
      statusText = o.status;
      progressWidth = '0%';
    }

    overlay.innerHTML = `
      <style>
        #order-details-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            background: rgba(15, 23, 42, 0.6) !important;
            backdrop-filter: blur(8px);
            z-index: 10000 !important;
            display: none;
            align-items: center;
            justify-content: center;
            padding: 1rem;
            box-sizing: border-box;
        }
        #order-details-overlay.open {
            display: flex !important;
        }
        
        .invoice-modal {
            background: #ffffff;
            width: 100%;
            max-width: 600px;
            max-height: 90vh;
            border-radius: 24px;
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
            display: flex;
            flex-direction: column;
            overflow: hidden;
            position: relative;
            animation: modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            text-align: left;
        }

        @keyframes modalSlideUp {
            from { opacity: 0; transform: translateY(20px) scale(0.98); }
            to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .modal-header {
            padding: 1.5rem 2rem;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: white;
            z-index: 10;
        }

        .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #0f172a;
            letter-spacing: -0.025em;
            margin: 0;
        }

        .close-btn {
            background: #f1f5f9;
            border: none;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            color: #64748b;
            transition: all 0.2s;
        }

        .close-btn:hover {
            background: #e2e8f0;
            color: #0f172a;
        }

        .modal-body {
            padding: 2rem;
            overflow-y: auto;
            flex: 1;
            box-sizing: border-box;
        }

        .modal-body::-webkit-scrollbar {
            width: 6px;
        }
        .modal-body::-webkit-scrollbar-track {
            background: transparent;
        }
        .modal-body::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
        }
        .modal-body::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
        }

        .section {
            margin-bottom: 2.5rem;
        }

        .section:last-child {
            margin-bottom: 0;
        }

        .section-label {
            font-size: 0.75rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.05em;
            color: #0052cc;
            margin-bottom: 0.75rem;
            display: block;
        }

        .order-id {
            font-size: 1.5rem;
            font-weight: 800;
            color: #0f172a;
            letter-spacing: -0.025em;
        }

        .status-container {
            margin-top: 1rem;
        }

        .current-status {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 1.5rem;
            font-size: 1rem;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background-color: #0052cc;
            border-radius: 50%;
            box-shadow: 0 0 0 4px rgba(0, 82, 204, 0.1);
        }

        .timeline {
            display: flex;
            justify-content: space-between;
            position: relative;
            padding: 0 10px;
        }

        .timeline::before {
            content: '';
            position: absolute;
            top: 20px;
            left: 30px;
            right: 30px;
            height: 2px;
            background: #e2e8f0;
            z-index: 0;
        }

        .timeline-progress {
            position: absolute;
            top: 20px;
            left: 30px;
            height: 2px;
            background: #0052cc;
            z-index: 1;
            transition: width 0.5s ease;
        }

        .step {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.75rem;
            flex: 1;
        }

        .step-circle {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            background: white;
            border: 2px solid #e2e8f0;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 600;
            color: #94a3b8;
            font-size: 0.9rem;
            transition: all 0.3s;
        }

        .step.active .step-circle {
            border-color: #0052cc;
            background: #0052cc;
            color: white;
            box-shadow: 0 4px 12px rgba(0, 82, 204, 0.3);
        }

        .step.completed .step-circle {
            border-color: #0052cc;
            background: rgba(0, 82, 204, 0.05);
            color: #0052cc;
        }

        .step-label {
            font-size: 0.75rem;
            font-weight: 600;
            color: #94a3b8;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }

        .step.active .step-label,
        .step.completed .step-label {
            color: #0f172a;
        }

        .address-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 1.25rem;
            display: flex;
            gap: 1rem;
            align-items: flex-start;
        }

        .address-icon {
            color: #64748b;
            margin-top: 2px;
            flex-shrink: 0;
        }

        .address-details h4 {
            font-size: 1rem;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 0.25rem;
            margin-top: 0;
        }

        .address-details p {
            font-size: 0.9rem;
            color: #64748b;
            line-height: 1.5;
            margin: 0;
        }

        .items-list {
            display: flex;
            flex-direction: column;
            gap: 1rem;
        }

        .item-row {
            display: flex;
            align-items: center;
            padding: 1rem;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            background: white;
            transition: box-shadow 0.2s;
            box-sizing: border-box;
        }

        .item-row:hover {
            box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1);
            border-color: #cbd5e1;
        }

        .item-image {
            width: 64px;
            height: 64px;
            border-radius: 12px;
            background: #f1f5f9;
            overflow: hidden;
            flex-shrink: 0;
            margin-right: 1rem;
        }

        .item-image img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        .item-info {
            flex: 1;
            min-width: 0;
        }

        .item-name {
            font-weight: 600;
            color: #0f172a;
            font-size: 0.95rem;
            margin-bottom: 0.25rem;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .item-meta {
            font-size: 0.8rem;
            color: #64748b;
        }

        .item-price {
            text-align: right;
            flex-shrink: 0;
        }

        .price-amount {
            font-weight: 700;
            color: #0f172a;
            font-size: 1rem;
            display: block;
        }

        .price-unit {
            font-size: 0.75rem;
            color: #64748b;
            display: block;
        }

        .modal-footer {
            padding: 1.25rem 2rem;
            border-top: 1px solid #e2e8f0;
            background: #f8fafc;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-sizing: border-box;
        }

        .footer-code {
            font-size: 0.85rem;
            color: #64748b;
            font-weight: 500;
        }

        .footer-code span {
            color: #0f172a;
            font-weight: 600;
        }

        .action-btn {
            background: white;
            border: 1px solid #e2e8f0;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.85rem;
            font-weight: 500;
            color: #0f172a;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            transition: all 0.2s;
        }

        .action-btn:hover {
            background: #f1f5f9;
            border-color: #cbd5e1;
        }

        .action-btn.delete {
            color: #ef4444;
            border-color: #fecaca;
            background: #fef2f2;
        }
        
        .action-btn.delete:hover {
            background: #fee2e2;
            border-color: #fca5a5;
        }

        @media (max-width: 600px) {
            .modal-body { padding: 1.5rem; }
            .timeline::before { left: 20px; right: 20px; }
            .timeline-progress { left: 20px; }
            .step-circle { width: 32px; height: 32px; font-size: 0.8rem; }
            .step-label { font-size: 0.65rem; }
            .item-row { flex-direction: column; align-items: flex-start; gap: 1rem; }
            .item-image { margin-right: 0; margin-bottom: 0.5rem; }
            .item-price { text-align: left; width: 100%; display: flex; justify-content: space-between; align-items: center; border-top: 1px solid #e2e8f0; padding-top: 0.75rem; margin-top: 0.5rem; }
        }
      </style>

      <div class="invoice-modal">
        <!-- Header -->
        <div class="modal-header">
            <h2 class="modal-title">Order Invoice Details</h2>
            <button class="close-btn" id="details-modal-close-btn">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
            </button>
        </div>

        <!-- Body -->
        <div class="modal-body">
            
            <!-- Order ID Section -->
            <div class="section">
                <span class="section-label">Order ID</span>
                <div class="order-id">${o.id}</div>
            </div>

            <!-- Timeline Section -->
            <div class="section">
                <span class="section-label">Timeline & Status</span>
                
                <div class="status-container">
                    <div class="current-status">
                        <div class="status-dot"></div>
                        ${statusText}
                    </div>

                    <div class="timeline">
                        <div class="timeline-progress" style="width: ${progressWidth};"></div>
                        
                        <div class="step ${step1Class}">
                            <div class="step-circle">${step1Content}</div>
                            <span class="step-label">PLACED</span>
                        </div>
                        
                        <div class="step ${step2Class}">
                            <div class="step-circle">${step2Content}</div>
                            <span class="step-label">CONFIRM</span>
                        </div>
                        
                        <div class="step ${step3Class}">
                            <div class="step-circle">${step3Content}</div>
                            <span class="step-label">PROCESSING</span>
                        </div>
                        
                        <div class="step ${step4Class}">
                            <div class="step-circle">${step4Content}</div>
                            <span class="step-label">SHIPPING</span>
                        </div>

                        <div class="step ${step5Class}">
                            <div class="step-circle">${step5Content}</div>
                            <span class="step-label">DONE</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Shipping Address Section -->
            <div class="section">
                <span class="section-label">Shipping Address</span>
                <div class="address-card">
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" class="address-icon">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                      <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <div class="address-details">
                        <h4>${profile.firstName} ${profile.lastName}</h4>
                        <p>${o.address || 'Saved Address Studio Room 4B, Design House'}</p>
                        <p style="margin-top: 4px; font-weight: 500; color: var(--text-main);">${profile.phone || '+1 (555) 019-2834'}</p>
                    </div>
                </div>
            </div>

            <!-- Purchased Items Section -->
            <div class="section">
                <span class="section-label">Purchased Items</span>
                <div class="items-list">
                    ${productsHtml}
                </div>
            </div>

            <!-- Summary Totals -->
            <div class="section" style="background: #f8fafc; padding: 1.5rem; border-radius: 16px; border: 1.5px dashed #e2e8f0; box-sizing: border-box;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #64748b;">
                    <span>Subtotal</span>
                    <span>${formatPrice(o.total - 2000 > 0 ? o.total - 2000 : o.total)}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; font-size: 0.9rem; color: #64748b;">
                    <span>Shipping</span>
                    <span>2 000 CFA</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e2e8f0; font-weight: 700; font-size: 1.1rem; color: #0f172a;">
                    <span>Total Paid</span>
                    <span>${formatPrice(o.total)}</span>
                </div>
            </div>

        </div>

        <!-- Footer -->
        <div class="modal-footer">
            <div class="footer-code">
                Code: <span>#${o.id.substring(o.id.indexOf('-') + 1)}</span>
            </div>
            <div style="display: flex; gap: 0.75rem;">
                <button class="action-btn" id="invoice-print-btn">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                      <polyline points="6 9 6 2 18 2 18 9"></polyline>
                      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                      <rect x="6" y="14" width="12" height="8"></rect>
                    </svg>
                    Print
                </button>
                ${canModify ? `
                  <button class="action-btn modal-change-addr-btn">Change Address</button>
                  <button class="action-btn delete modal-cancel-order-btn cancel-order-btn">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                      Cancel
                  </button>
                ` : ''}
                ${(o.status === 'Shipping' || o.status === 'Shipped') ? `
                  <button class="action-btn modal-confirm-delivery-btn" style="background:var(--primary); color:white; border-color:var(--primary);">
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                      Mark as Received
                  </button>
                ` : ''}
                ${(o.status !== 'Done' && o.status !== 'Livré') ? `
                  <button class="action-btn delete modal-delete-btn" style="background:#fff; color:#ef4444; border-color:#fecaca;" title="Remove Record">Remove</button>
                ` : ''}
            </div>
        </div>
      </div>
    `;

    overlay.classList.add('open');

    // Close button click
    const closeBtn = overlay.querySelector('#details-modal-close-btn');
    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('open');
    });

    // Close on overlay background click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('open');
      }
    });

    // Buy again button click
    overlay.querySelectorAll('.modal-buy-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const productId = parseInt(btn.getAttribute('data-id'));
        if (!productId) return;
        
        const targetProduct = this.products.find(p => p.id === productId);
        if (targetProduct) {
          const cartSaved = localStorage.getItem(getCartStorageKey());
          let cart = [];
          if (cartSaved) {
            try {
              cart = JSON.parse(cartSaved);
            } catch (err) {}
          }
          
          const existing = cart.find(item => item.id === productId);
          if (existing) {
            existing.quantity += 1;
          } else {
            cart.push({ ...targetProduct, quantity: 1 });
          }
          
          localStorage.setItem(getCartStorageKey(), JSON.stringify(cart));
          window.dispatchEvent(new CustomEvent('cart:updated', { detail: cart }));
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Added ${targetProduct.name} to cart!` }));
          overlay.classList.remove('open');
        }
      });
    });

    // Print button click
    const printBtn = overlay.querySelector('#invoice-print-btn');
    if (printBtn) {
      printBtn.addEventListener('click', () => {
        printOrderReceipt(o);
      });
    }

    // Change Address click
    const changeAddrBtn = overlay.querySelector('.modal-change-addr-btn');
    if (changeAddrBtn) {
      changeAddrBtn.addEventListener('click', () => {
        const profile = this.loadUserProfile();
        showEditAddressModal(this.shadowRoot, o, profile, (newName, newAddress) => {
          const targetOrder = profile.orders.find(order => order.id === o.id);
          if (targetOrder) {
            targetOrder.address = newAddress;
            
            // 1. Save customer profile to correct key
            const profileKey = getProfileStorageKey();
            localStorage.setItem(profileKey, JSON.stringify(profile));
            localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
            
            // 2. Fetch latest orders from server, update and POST back
            fetch('/api/orders')
              .then(res => res.json())
              .then(serverOrders => {
                let allOrders = Array.isArray(serverOrders) ? serverOrders : [];
                const globalOrder = allOrders.find(go => go.id === o.id);
                if (globalOrder) {
                  globalOrder.customerAddress = newAddress;
                }
                localStorage.setItem('SWEETOS_all_orders', JSON.stringify(allOrders));

                return fetch('/api/orders', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(allOrders)
                });
              })
              .catch(e => console.error('Failed to sync updated order address:', e));

            window.dispatchEvent(new CustomEvent('toast:show', { detail: `Address updated for Order ${o.id}!` }));
            overlay.classList.remove('open');
            this.injectOrdersDashboardList();
          }
        });
      });
    }

    // Cancel Order click
    const cancelBtn = overlay.querySelector('.modal-cancel-order-btn');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        showCancelOrderModal(this.shadowRoot, o, () => {
          const profile = this.loadUserProfile();
          const targetOrder = profile.orders.find(order => order.id === o.id);
          if (targetOrder) {
            targetOrder.status = 'Cancelled';
            
            // 1. Save customer profile to correct key
            const profileKey = getProfileStorageKey();
            localStorage.setItem(profileKey, JSON.stringify(profile));
            localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
            
            // 2. Fetch latest orders from server, update and POST back
            fetch('/api/orders')
              .then(res => res.json())
              .then(serverOrders => {
                let allOrders = Array.isArray(serverOrders) ? serverOrders : [];
                const globalOrder = allOrders.find(go => go.id === o.id);
                if (globalOrder) {
                  globalOrder.status = 'Cancelled';
                }
                localStorage.setItem('SWEETOS_all_orders', JSON.stringify(allOrders));

                return fetch('/api/orders', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(allOrders)
                });
              })
              .catch(e => console.error('Failed to sync cancelled order status:', e));

            window.dispatchEvent(new CustomEvent('toast:show', { detail: `Order ${o.id} cancelled successfully.` }));
            overlay.classList.remove('open');
            this.injectOrdersDashboardList();
          }
        });
      });
    }

    // Delete click
    const deleteBtn = overlay.querySelector('.modal-delete-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        showDeleteOrderModal(this.shadowRoot, o, () => {
          // 1. Remove from customer profile view
          const profile = this.loadUserProfile();
          profile.orders = profile.orders.filter(order => order.id !== o.id);
          const profileKey = getProfileStorageKey();
          localStorage.setItem(profileKey, JSON.stringify(profile));
          localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
          
           // 2. Fetch latest orders from server, update and POST back
           fetch('/api/orders')
             .then(res => res.json())
             .then(serverOrders => {
               let allOrders = Array.isArray(serverOrders) ? serverOrders : [];
               const globalOrder = allOrders.find(go => go.id === o.id);
               if (globalOrder) {
                 globalOrder.status = 'Deleted';
               }
               localStorage.setItem('SWEETOS_all_orders', JSON.stringify(allOrders));

               return fetch('/api/orders', {
                 method: 'POST',
                 headers: {
                   'Content-Type': 'application/json'
                 },
                 body: JSON.stringify(allOrders)
               });
             })
             .catch(e => console.error('Failed to sync deleted order status:', e));

          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Order record deleted.' }));
          overlay.classList.remove('open');
          this.injectOrdersDashboardList();
        });
      });
    }

    // Confirm Delivery click
    const confirmDeliveryBtn = overlay.querySelector('.modal-confirm-delivery-btn');
    if (confirmDeliveryBtn) {
      confirmDeliveryBtn.addEventListener('click', () => {
        // 1. Update customer profile status to 'Done'
        const profile = this.loadUserProfile();
        const targetOrder = profile.orders.find(order => order.id === o.id);
        if (targetOrder) {
          targetOrder.status = 'Done';
          const profileKey = getProfileStorageKey();
          localStorage.setItem(profileKey, JSON.stringify(profile));
          localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));
          
          // 2. Fetch latest orders from server, update and POST back
          fetch('/api/orders')
            .then(res => res.json())
            .then(serverOrders => {
              let allOrders = Array.isArray(serverOrders) ? serverOrders : [];
              const globalOrder = allOrders.find(go => go.id === o.id);
              if (globalOrder) {
                globalOrder.status = 'Done';
              }
              localStorage.setItem('SWEETOS_all_orders', JSON.stringify(allOrders));

              return fetch('/api/orders', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(allOrders)
              });
            })
            .then(() => {
              // 3. Broadcast custom alert to admin panel
              fetch('/api/broadcast-alert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'orders',
                  message: `Order ${o.id} has been marked as Received (Done) by the customer!`
                })
              }).catch(e => console.error('Failed to broadcast received order alert:', e));
            })
            .catch(e => console.error('Failed to sync received order status:', e));

          // 5. Generate Mystery Box scratchcard if total >= 2000 CFA
          const totalCFA = parseFloat(targetOrder.total) || 0;
          if (totalCFA >= 2000) {
            try {
              let scratchcards = JSON.parse(localStorage.getItem('SWEETOS_user_scratchcards') || '[]');
              if (!scratchcards.some(sc => sc.orderId === targetOrder.id)) {
                scratchcards.push({
                  id: Date.now() + 1,
                  orderId: targetOrder.id,
                  amount: totalCFA,
                  scratched: false,
                  couponWon: null,
                  createdAt: Date.now(),
                  expiresAt: Date.now() + 14 * 24 * 60 * 60 * 1000
                });
                localStorage.setItem('SWEETOS_user_scratchcards', JSON.stringify(scratchcards));
              }
            } catch(e) {
              console.error('Failed to create scratchcard on customer side:', e);
            }
            
            // Add customer notifications
            const notifKey = getNotificationsStorageKey();
            let customerNotifs = [];
            try {
              customerNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
            } catch(e) {}
            
            const currentHour = new Date().getHours();
            let greeting = 'Bonjour';
            if (currentHour >= 12 && currentHour < 18) {
              greeting = 'Bon après-midi';
            } else if (currentHour >= 18) {
              greeting = 'Bonsoir';
            }
            
            // Push delivered notification
            customerNotifs.unshift({
              id: Date.now(),
              type: 'shipping',
              icon: '✅',
              title: `Commande #${targetOrder.id} livrée !`,
              desc: `${greeting} ! Merci infiniment pour votre achat chez SWEETOS. Votre commande #${targetOrder.id} a été livrée avec succès.<br>
                <div style="display:flex; gap:8px; margin-top:8px; flex-wrap:wrap;">
                  <button class="download-receipt-btn" data-order-id="${targetOrder.id}" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Reçu 📄</button>
                  <button class="view-mystery-email-btn" data-order-id="${targetOrder.id}" style="background:#ff5630; color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Mystery Box 🎁</button>
                </div>`,
              time: 'Just now',
              unread: true
            });
            
            // Push simulated email notification
            customerNotifs.unshift({
              id: Date.now() + 2,
              type: 'email',
              icon: '📧',
              title: `Nouveau Message: Votre Boîte Mystère`,
              desc: `Vous avez reçu un e-mail concernant votre Boîte Mystère de la commande #${targetOrder.id}.<br>
                <div style="margin-top:8px;">
                  <button class="open-email-modal-btn" data-order-id="${targetOrder.id}" style="background:var(--primary); color:white; border:none; padding:6px 12px; border-radius:8px; font-size:11px; font-weight:800; cursor:pointer;">Ouvrir l'E-mail 📩</button>
                </div>`,
              time: 'Just now',
              unread: true
            });
            
            localStorage.setItem(notifKey, JSON.stringify(customerNotifs));
            window.dispatchEvent(new CustomEvent('notifications:updated'));
          }

          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Order marked as Received! Thank you! 🎁' }));
          overlay.classList.remove('open');
          this.injectOrdersDashboardList();
        }
      });
    }
  }


  isTimelineStepActive(status, step) {
    if (status === 'Processing') {
      if (step === 'placed' || step === 'processing') return true;
    }
    if (status === 'Shipped') {
      if (step === 'placed' || step === 'processing' || step === 'shipped') return true;
    }
    if (status === 'Delivered') {
      return true;
    }
    return step === 'placed';
  }

  attachOrdersDashboardListeners() {
    const shadow = this.shadowRoot;
    
    // Search input
    const searchInput = shadow.getElementById('orders-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.ordersSearchQuery = e.target.value.trim();
        this.injectOrdersDashboardList();
      });
    }

    // Timeframe selector
    const timeframeSelect = shadow.getElementById('orders-timeframe-selector');
    if (timeframeSelect) {
      timeframeSelect.addEventListener('change', (e) => {
        this.ordersTimeframe = e.target.value;
        this.injectOrdersDashboardList();
      });
    }

    // Tab pills
    shadow.querySelectorAll('.order-pill-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        shadow.querySelectorAll('.order-pill-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        const filter = btn.getAttribute('data-filter');
        this.activeOrdersFilter = filter;
        this.injectOrdersDashboardList();
      });
    });

    // Header buttons
    const continueBtn = shadow.getElementById('orders-continue-shopping-btn');
    if (continueBtn) {
      continueBtn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
      });
    }

    const exportBtn = shadow.getElementById('orders-export-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Order history spreadsheet exported successfully! 📊' }));
      });
    }
  }

  loadCustomCollections() {
    const saved = localStorage.getItem('SWEETOS_custom_collections');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    // Pre-seed a default collection so the list is never empty!
    const defaults = [
      {
        id: "col-default-user",
        name: "My Dream Setup",
        subtitle: "Personalized workspace theme",
        description: "Your own curated list of switches, lighting arrays, and studio hardware layouts.",
        badge: "MY DESIGN",
        price: 0,
        originalPrice: 0,
        themeColor: "#0052cc",
        productIds: []
      }
    ];
    this.saveCustomCollections(defaults);
    return defaults;
  }

  openCustomCreateModal(onConfirm) {
    const shadow = this.shadowRoot;
    const modal = shadow.getElementById('create-col-modal');
    const input = shadow.getElementById('new-col-name-input');
    const cancelBtn = shadow.getElementById('cancel-col-modal-btn');
    const confirmBtn = shadow.getElementById('confirm-col-modal-btn');

    if (!modal || !input) return;

    input.value = '';
    modal.classList.add('open');
    input.focus();

    const newCancel = cancelBtn.cloneNode(true);
    const newConfirm = confirmBtn.cloneNode(true);
    cancelBtn.parentNode.replaceChild(newCancel, cancelBtn);
    confirmBtn.parentNode.replaceChild(newConfirm, confirmBtn);

    newCancel.addEventListener('click', () => {
      modal.classList.remove('open');
    });

    newConfirm.addEventListener('click', () => {
      const name = input.value.trim();
      if (!name) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please enter a name.' }));
        input.focus();
        return;
      }
      modal.classList.remove('open');
      onConfirm(name);
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  }

  saveCustomCollections(collections) {
    localStorage.setItem('SWEETOS_custom_collections', JSON.stringify(collections));
  }

  populatePdpColDropdown(productId) {
    const list = this.shadowRoot.getElementById('pdp-col-dropdown-list');
    if (!list) return;
    list.innerHTML = '';

    const collections = this.loadCustomCollections();
    if (collections.length === 0) {
      list.innerHTML = `<div style="padding: 10px 14px; font-size: 12px; color: var(--text-light); text-align: center;">No collections yet.</div>`;
      return;
    }

    collections.forEach(col => {
      const btn = document.createElement('button');
      btn.className = 'col-dropdown-item';
      btn.textContent = col.name;
      btn.addEventListener('click', () => {
        if (!col.productIds.includes(productId)) {
          col.productIds.push(productId);
          this.saveCustomCollections(collections);
          window.dispatchEvent(new CustomEvent('toast:show', { 
            detail: `Added to "${col.name}"! 📁` 
          }));
        } else {
          window.dispatchEvent(new CustomEvent('toast:show', { 
            detail: `Already in "${col.name}"!` 
          }));
        }
        const dropdown = this.shadowRoot.getElementById('pdp-col-dropdown');
        if (dropdown) dropdown.classList.remove('open');
      });
      list.appendChild(btn);
    });
  }

  startDealsCountdownTimer() {
    if (this.dealsTimerInterval) {
      clearInterval(this.dealsTimerInterval);
    }

    const shadow = this.shadowRoot;
    let secondsLeft = 6 * 86400 + 23 * 3600 + 59 * 60;

    const updateDisplay = () => {
      const d = Math.floor(secondsLeft / 86400).toString().padStart(2, '0');
      const h = Math.floor((secondsLeft % 86400) / 3600).toString().padStart(2, '0');
      const m = Math.floor((secondsLeft % 3600) / 60).toString().padStart(2, '0');
      const s = (secondsLeft % 60).toString().padStart(2, '0');

      const elDays = shadow.getElementById('deals-days');
      const elHours = shadow.getElementById('deals-hours');
      const elMins = shadow.getElementById('deals-mins');
      const elSecs = shadow.getElementById('deals-secs');

      if (elDays) elDays.textContent = d;
      if (elHours) elHours.textContent = h;
      if (elMins) elMins.textContent = m;
      if (elSecs) elSecs.textContent = s;
    };

    updateDisplay();

    this.dealsTimerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
        updateDisplay();
      } else {
        clearInterval(this.dealsTimerInterval);
      }
    }, 1000);
  }

  attachDealsHeroListeners() {
    const shadow = this.shadowRoot;
    const shopNowBtn = shadow.getElementById('deals-shop-now-btn');
    if (shopNowBtn) {
      shopNowBtn.addEventListener('click', () => {
        const grid = shadow.getElementById('grid-deals');
        if (grid) {
          grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    const viewAllBtn = shadow.getElementById('deals-view-all-btn');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
      });
    }
  }

  attachCollectionsHeaderListeners() {
    const shadow = this.shadowRoot;
    const colHeaderCreate = shadow.getElementById('col-header-create-btn');
    if (colHeaderCreate) {
      colHeaderCreate.addEventListener('click', () => {
        this.openCustomCreateModal((name) => {
          const collections = this.loadCustomCollections();
          const newCol = {
            id: 'col-' + Date.now(),
            name: name,
            subtitle: "User Curated Gear Setup",
            description: "A custom curated collection of hardware items tailored for your workspace layout.",
            badge: "MY GEAR",
            price: 0,
            originalPrice: 0,
            themeColor: "#0052cc",
            productIds: [] // starts empty!
          };
          collections.push(newCol);
          this.saveCustomCollections(collections);
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Created collection "${name}"! 📁` }));
          this.injectCuratedCollections();
        });
      });
    }
  }

  injectGlobalMoreToLove() {
    const contentArea = this.shadowRoot.getElementById('page-content');
    if (!contentArea) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'more-to-love-recommendations-section animate-in';
    wrapper.style.marginTop = '60px';
    wrapper.style.borderTop = '1.5px solid var(--border)';
    wrapper.style.paddingTop = '40px';
    wrapper.style.marginBottom = '20px';
    
    wrapper.innerHTML = `
      <div class="section-header" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
        <h3 class="section-title" style="font-size: 20px; font-weight: 800; color: var(--text-dark); margin: 0;">More to Love</h3>
        <button class="view-all-btn" id="global-more-love-view-all" style="font-size: 13px; font-weight: 700; color: var(--primary); background: none; border: none; cursor: pointer;">View All →</button>
      </div>
      <div class="home-grid-4" id="global-more-to-love-grid"></div>
    `;
    
    contentArea.appendChild(wrapper);

    const moreToLoveIds = [7, 8, 11, 12, 17, 18, 23, 24];
    const moreToLove = this.products.filter(p => moreToLoveIds.includes(p.id));
    const gridMore = this.shadowRoot.getElementById('global-more-to-love-grid');
    if (gridMore) {
      moreToLove.forEach(p => {
        const card = document.createElement('product-card');
        card.product = p;
        gridMore.appendChild(card);
      });
    }

    const viewAllBtn = this.shadowRoot.getElementById('global-more-love-view-all');
    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', () => {
        this.currentPage = 'catalog';
        this.currentCategory = 'All';
        this.renderPageContent();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'catalog', category: 'All' } }));
      });
    }
  }

  getAuthPageHTML() {
    return getAuthPageHTML();
  }

  attachAuthListeners() {
    attachAuthListeners(this.shadowRoot, () => {
      this.currentPage = 'profile';
      this.renderPageContent();
    });
  }
}

customElements.define('product-list', ProductList);
export default ProductList;

// Global styled receipt generator for storefront
function printOrderReceipt(order) {
  const storeName = localStorage.getItem('SWEETOS_store_name') || 'SWEETOS';
  const storePhone = localStorage.getItem('SWEETOS_store_phone') || '+225 05 00 61 99 23';
  const storeEmail = localStorage.getItem('SWEETOS_store_email') || 'support@sweetos.com';
  const storeAddress = localStorage.getItem('SWEETOS_store_addr') || 'Abidjan, Cocody Mermoz';
  const currency = localStorage.getItem('SWEETOS_currency') || 'CFA';
  
  let clientName = order.customerName || order.name;
  let clientPhone = order.customerPhone || order.phone;
  let clientEmail = order.email || order.customerEmail;
  let clientAddress = order.customerAddress || order.address;

  // Let's try to resolve from profile key if present
  let resolvedProfile = null;
  const emailKey = clientEmail || (order.email ? order.email : '');
  if (emailKey) {
    const safeKey = emailKey.replace(/[^a-zA-Z0-9]/g, '_');
    const profileSaved = localStorage.getItem(`SWEETOS_user_profile_${safeKey}`) || localStorage.getItem(`SWEETOS_user_profile`);
    if (profileSaved) {
      try {
        resolvedProfile = JSON.parse(profileSaved);
      } catch(e) {}
    }
  } else {
    const profileSaved = localStorage.getItem(`SWEETOS_user_profile`);
    if (profileSaved) {
      try {
        resolvedProfile = JSON.parse(profileSaved);
      } catch(e) {}
    }
  }

  if (resolvedProfile) {
    if (!clientName) {
      clientName = `${resolvedProfile.firstName || ''} ${resolvedProfile.lastName || ''}`.trim();
    }
    if (!clientPhone) {
      clientPhone = resolvedProfile.phone;
    }
    if (!clientEmail) {
      clientEmail = resolvedProfile.email;
    }
    if (!clientAddress) {
      clientAddress = resolvedProfile.address;
    }
  }

  clientName = clientName || 'Client Invité';
  clientPhone = clientPhone || 'N/A';
  clientEmail = clientEmail || 'N/A';
  clientAddress = clientAddress || 'N/A';

  const localFormatPrice = (price) => {
    let symbol = currency;
    if (currency === 'USD') symbol = '$';
    else if (currency === 'EUR') symbol = '€';
    else if (currency === 'CFA' || currency === 'XOF' || currency === 'FCFA') symbol = 'FCFA';
    
    if (symbol === '$' || symbol === '€') {
      return `${symbol}${Math.round(price).toLocaleString()}`;
    }
    return `${Math.round(price).toLocaleString()} ${symbol}`;
  };

  const printWindow = window.open('', '_blank', 'width=800,height=900');
  if (!printWindow) return;
  
  let itemsHtml = '';
  let subtotal = 0;
  
  const products = order.products || [];
  products.forEach(p => {
    const itemTotal = p.price * p.quantity;
    subtotal += itemTotal;
    itemsHtml += `
      <tr>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; font-weight: 600; color: #1e293b;">
          ${p.name}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">
          ${localFormatPrice(p.price)}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13px; text-align: center; color: #64748b;">
          ${p.quantity}
        </td>
        <td style="padding: 12px 8px; border-bottom: 1px solid #e2e8f0; font-size: 13.5px; font-weight: 700; text-align: right; color: #0052cc;">
          ${localFormatPrice(itemTotal)}
        </td>
      </tr>
    `;
  });

  const shippingRate = parseFloat(localStorage.getItem('SWEETOS_shipping_rate') || '2000');
  const freeThreshold = parseFloat(localStorage.getItem('SWEETOS_free_shipping_threshold') || '15000');
  const shippingFee = subtotal >= freeThreshold ? 0 : shippingRate;
  
  const vatRate = parseFloat(localStorage.getItem('SWEETOS_vat_rate') || '18');
  const taxMode = localStorage.getItem('SWEETOS_tax_mode') || 'inclusive';
  
  let taxAmount = 0;
  if (taxMode === 'exclusive') {
    taxAmount = subtotal * (vatRate / 100);
  } else {
    taxAmount = (subtotal / (1 + vatRate / 100)) * (vatRate / 100);
  }
  
  const total = subtotal + shippingFee + (taxMode === 'exclusive' ? taxAmount : 0);
  const formattedDate = order.date || new Date().toISOString().replace('T', ' ').slice(0, 16);

  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Facture de Commande #${order.id}</title>
      <meta charset="utf-8">
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap');
        body {
          font-family: 'Outfit', sans-serif;
          margin: 0;
          padding: 40px;
          color: #334155;
          background: #ffffff;
        }
        .receipt-card {
          max-width: 700px;
          margin: 0 auto;
          padding: 24px;
          border: 1.5px solid #e2e8f0;
          border-radius: 20px;
        }
        .header-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .header-left {
          text-align: left;
        }
        .header-right {
          text-align: right;
        }
        .store-logo {
          font-size: 28px;
          font-weight: 900;
          color: #0052cc;
          margin-bottom: 6px;
        }
        .meta-label {
          font-size: 11px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .meta-val {
          font-size: 13.5px;
          font-weight: 600;
          color: #1e293b;
        }
        .details-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
          margin-bottom: 30px;
          padding-bottom: 24px;
          border-bottom: 1.5px dashed #e2e8f0;
        }
        .info-block {
          background: #f8fafc;
          padding: 16px;
          border-radius: 12px;
          border: 1px solid #f1f5f9;
        }
        .info-title {
          font-size: 12px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 8px;
        }
        .table-items {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 30px;
        }
        .table-items th {
          background: #f1f5f9;
          padding: 10px 8px;
          font-size: 11px;
          font-weight: 800;
          color: #475569;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1.5px solid #cbd5e1;
        }
        .summary-block {
          width: 300px;
          margin-left: auto;
          display: flex;
          flex-direction: column;
          gap: 10px;
          font-size: 13.5px;
        }
        .summary-row {
          display: flex;
          justify-content: space-between;
          color: #64748b;
        }
        .summary-row.total {
          font-size: 18px;
          font-weight: 900;
          color: #0052cc;
          border-top: 1.5px solid #e2e8f0;
          padding-top: 10px;
          margin-top: 5px;
        }
        .footer-note {
          text-align: center;
          margin-top: 50px;
          font-size: 12.5px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 20px;
        }
        @media print {
          body {
            padding: 0;
          }
          .receipt-card {
            border: none;
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="receipt-card">
        <table class="header-table">
          <tr>
            <td class="header-left">
              <div class="store-logo">${storeName}</div>
              <div style="font-size: 13px; color: #64748b; line-height: 1.4;">
                ${storeAddress}<br>
                Tél: ${storePhone}<br>
                Email: ${storeEmail}
              </div>
            </td>
            <td class="header-right" valign="top">
              <div style="font-size: 20px; font-weight: 800; color: #1e293b; margin-bottom: 6px;">FACTURE / REÇU</div>
              <div>
                <span class="meta-label">Numéro de Commande:</span><br>
                <span class="meta-val" style="color: #0052cc;">#${order.id}</span>
              </div>
              <div style="margin-top: 8px;">
                <span class="meta-label">Date d'Émission:</span><br>
                <span class="meta-val">${formattedDate}</span>
              </div>
            </td>
          </tr>
        </table>

        <div class="details-grid">
          <div class="info-block">
            <div class="info-title">Facturé à (Client)</div>
            <div style="font-size: 14px; font-weight: 700; color: #1e293b; margin-bottom: 4px;">
              ${clientName}
            </div>
            <div style="font-size: 13px; color: #64748b; line-height: 1.4;">
              Téléphone: ${clientPhone}<br>
              Email: ${clientEmail}<br>
              Adresse: ${clientAddress}
            </div>
          </div>
          <div class="info-block">
            <div class="info-title">Mode & Options de Livraison</div>
            <div style="font-size: 13.5px; font-weight: 600; color: #1e293b; margin-bottom: 4px;">
              Status: <span style="color:#0052cc;">${order.status}</span>
            </div>
            <div style="font-size: 13px; color: #64748b; line-height: 1.4;">
              Paiement: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'COD'}<br>
              Suivi #: ${order.trackingNumber || 'En attente'}<br>
              Notes: ${order.notes || 'Aucune note.'}
            </div>
          </div>
        </div>

        <table class="table-items">
          <thead>
            <tr>
              <th align="left">Désignation</th>
              <th align="center">Prix Unitaire</th>
              <th align="center">Quantité</th>
              <th align="right">Montant Total</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="summary-block">
          <div class="summary-row">
            <span>Sous-total:</span>
            <strong>${localFormatPrice(subtotal)}</strong>
          </div>
          <div class="summary-row">
            <span>Frais de port:</span>
            <strong>${shippingFee === 0 ? 'Gratuit' : localFormatPrice(shippingFee)}</strong>
          </div>
          <div class="summary-row">
            <span>TVA (${vatRate}% - ${taxMode === 'inclusive' ? 'incluse' : 'non-incluse'}):</span>
            <strong>${localFormatPrice(taxAmount)}</strong>
          </div>
          <div class="summary-row total">
            <span>Total Général:</span>
            <span>${localFormatPrice(total)}</span>
          </div>
        </div>

        <div class="footer-note">
          Merci pour votre confiance et votre commande chez <strong>${storeName}</strong> !<br>
          <span style="font-size:11px; margin-top:6px; display:block;">Ceci est un reçu de commande officiel. Pour toute réclamation, veuillez contacter le support client.</span>
        </div>
      </div>
      
      <script>
        window.onload = function() {
          setTimeout(function() {
            window.print();
          }, 300);
        };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}
