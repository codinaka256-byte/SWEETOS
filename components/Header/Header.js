import products from '../../data/products.js';
import { getCartStorageKey, getProfileStorageKey, getNotificationsStorageKey, getWishlistStorageKey, formatPrice } from '../../utils/storage.js';

class Header extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
    this.setupEventListeners();
    this.updateUserPill();
    this.syncCartBadge();
    this.syncNotificationBadge();
    this.syncWishlistBadge();
  }

  updateUserPill() {
    const shadow = this.shadowRoot;
    const profilePill = shadow.getElementById('profile-pill');
    if (!profilePill) return;
    
    const loggedInUser = localStorage.getItem('SWEETOS_logged_in_user');
    if (loggedInUser) {
      const profileKey = getProfileStorageKey();
      let profileSaved = localStorage.getItem(profileKey);
      if (!profileSaved) {
        profileSaved = localStorage.getItem('SWEETOS_user_profile');
      }
      let profile = { firstName: 'Guest', lastName: 'User' };
      if (profileSaved) {
        try {
          profile = JSON.parse(profileSaved);
        } catch (e) {}
      }
      
      const initials = ((profile.firstName || '')[0] || '') + ((profile.lastName || '')[0] || '');
      const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'User';
      
      profilePill.innerHTML = `
        <div class="user-avatar" style="background: var(--primary); color: white;">${initials.toUpperCase() || '👤'}</div>
        <span class="user-name">${fullName}</span>
        <svg class="chevron-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      `;
    } else {
      profilePill.innerHTML = `
        <div class="user-avatar" style="background: #cbd5e1; color: #475569;">👤</div>
        <span class="user-name" style="font-weight: 750;">Sign In</span>
      `;
    }
  }

  syncCartBadge() {
    const saved = localStorage.getItem(getCartStorageKey());
    let count = 0; // default empty cart count
    if (saved) {
      try {
        const cart = JSON.parse(saved);
        count = cart.reduce((acc, item) => acc + item.quantity, 0);
      } catch(e) {}
    }
    const badge = this.shadowRoot.getElementById('cartBadge');
    if (badge) {
      badge.textContent = count;
    }
  }

  syncNotificationBadge() {
    const key = getNotificationsStorageKey();
    const saved = localStorage.getItem(key);
    let count = 0;
    if (saved) {
      try {
        const notifs = JSON.parse(saved);
        count = notifs.filter(n => n.unread).length;
      } catch (e) {}
    } else {
      count = 1; // Default welcome alert counts as 1 unread if key uninitialized
    }
    const badge = this.shadowRoot.getElementById('notificationBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  syncWishlistBadge() {
    const wlKey = getWishlistStorageKey();
    const saved = localStorage.getItem(wlKey);
    let count = 0;
    if (saved) {
      try {
        const wishlist = JSON.parse(saved);
        count = wishlist.length;
      } catch (e) {}
    }
    const badge = this.shadowRoot.getElementById('wishlistBadge');
    if (badge) {
      if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
      } else {
        badge.style.display = 'none';
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/Header/Header.css">
      <header class="top-nav">
        <!-- Logo -->
        <div class="logo" id="logo-btn">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 01-8 0"/>
          </svg>
          ${localStorage.getItem('SWEETOS_store_name') || 'SWEETOS'}
        </div>
        
        <!-- Search bar (NovaShop premium style matching mockup image) -->
        <div class="search-bar">
          <input type="text" id="header-search-input" placeholder="Search for products, brands and more..." autocomplete="off">
          
          <!-- Image search button mockup -->
          <button class="icon-input-btn camera-search-btn" id="camera-btn" title="Search by image">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
              <circle cx="12" cy="13" r="4"></circle>
            </svg>
          </button>
          
          <!-- Voice search button mockup -->
          <button class="icon-input-btn voice-search-btn" id="voice-btn" title="Search by voice">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
              <path d="M19 10v1a7 7 0 0 1-14 0v-1M12 19v4M8 23h8"></path>
            </svg>
          </button>

          <!-- Royal blue flush search action button -->
          <button id="header-search-btn" class="search-action-btn" title="Search">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
            </svg>
            Search
          </button>

          <!-- Live Search Suggestions Dropdown -->
          <div class="search-suggestions-dropdown" id="search-suggestions-dropdown"></div>
        </div>
        
        <!-- Nav actions -->
        <div class="nav-actions">
          <button class="nav-btn" id="wishlist-btn" title="My Wishlist" style="position: relative;">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
            Wishlist
            <span class="badge" id="wishlistBadge" style="display: none;">0</span>
          </button>
          
          <!-- Notification Bell Icon (Routes to Notification Page) -->
          <button class="nav-btn" id="notification-bell-btn" title="Notifications">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
            <span class="badge" id="notificationBadge">3</span>
          </button>

          <!-- Shopping Cart Icon (Toggles Cart Drawer) -->
          <button class="nav-btn" id="cart-btn" title="My Cart">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span class="badge" id="cartBadge">0</span>
          </button>
          
          <div class="user-profile" id="profile-pill">
            <div class="user-avatar" style="background: #cbd5e1; color: #475569;">👤</div>
            <span class="user-name" style="font-weight: 750;">Sign In</span>
          </div>
        </div>
      </header>
    `;
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;
    const searchInput = shadow.getElementById('header-search-input');
    const searchBtn = shadow.getElementById('header-search-btn');

    const triggerSearch = () => {
      const query = searchInput.value;
      window.dispatchEvent(new CustomEvent('search:query', {
        detail: { query, category: 'All' }
      }));
    };

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const dropdown = shadow.getElementById('search-suggestions-dropdown');
        if (dropdown) dropdown.classList.remove('visible');
        triggerSearch();
      }
    });

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value;
      this.showSuggestions(query);
      triggerSearch();
    });

    searchBtn.addEventListener('click', () => {
      const dropdown = shadow.getElementById('search-suggestions-dropdown');
      if (dropdown) dropdown.classList.remove('visible');
      triggerSearch();
    });

    // Close suggestions dropdown when clicking outside
    document.addEventListener('click', (e) => {
      const dropdown = shadow.getElementById('search-suggestions-dropdown');
      if (dropdown && !this.contains(e.target)) {
        dropdown.classList.remove('visible');
      }
    });

    const cameraBtn = shadow.getElementById('camera-btn');
    const voiceBtn = shadow.getElementById('voice-btn');

    // Create file input for camera search
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.display = 'none';
    shadow.appendChild(fileInput);

    cameraBtn.addEventListener('click', () => {
      fileInput.click();
    });

    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;

      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Analyzing image with AI...' }));
      cameraBtn.classList.add('active');

      setTimeout(() => {
        cameraBtn.classList.remove('active');
        const name = file.name.toLowerCase();
        let query = 'Keyboards'; // default
        let detected = 'Mechanical Keyboard';

        if (name.includes('head') || name.includes('audio') || name.includes('sound') || name.includes('ear') || name.includes('music')) {
          query = 'Audio';
          detected = 'Studio Headphones';
        } else if (name.includes('light') || name.includes('lamp') || name.includes('led') || name.includes('glow')) {
          query = 'Lighting';
          detected = 'Ambient Lighting';
        } else if (name.includes('desk') || name.includes('table') || name.includes('wood') || name.includes('stand')) {
          query = 'Desks';
          detected = 'Solid Wood Desk';
        }

        searchInput.value = detected;
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Visual Search matched: ${detected}` }));
        
        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { query: detected, category: 'All' }
        }));
      }, 1500);
    });

    // Voice search logic using Web Speech API with fallback
    let recognition;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        voiceBtn.classList.add('active');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Listening... Speak now 🎙' }));
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        searchInput.value = transcript;
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Voice Search: "${transcript}"` }));
        window.dispatchEvent(new CustomEvent('search:query', {
          detail: { query: transcript, category: 'All' }
        }));
      };

      recognition.onerror = (event) => {
        voiceBtn.classList.remove('active');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Voice search error: ${event.error}` }));
      };

      recognition.onend = () => {
        voiceBtn.classList.remove('active');
      };
    }

    voiceBtn.addEventListener('click', () => {
      if (recognition) {
        try {
          recognition.start();
        } catch (err) {
          recognition.stop();
        }
      } else {
        // Fallback mockup dictation
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Simulating Voice Search... 🎙' }));
        voiceBtn.classList.add('active');
        
        setTimeout(() => {
          voiceBtn.classList.remove('active');
          const queries = ['Tactile Keyboard', 'Studio Headphones', 'Screenbar Light', 'Oak Desk Riser'];
          const randomQuery = queries[Math.floor(Math.random() * queries.length)];
          
          searchInput.value = randomQuery;
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Voice recognized: "${randomQuery}"` }));
          window.dispatchEvent(new CustomEvent('search:query', {
            detail: { query: randomQuery, category: 'All' }
          }));
        }, 2000);
      }
    });

    // Notification bell click (toggles notification drawer)
    shadow.getElementById('notification-bell-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('notifications:toggle'));
    });

    // Cart drawer toggle
    shadow.getElementById('cart-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('cart:toggle'));
    });

    // Profile page navigation
    shadow.getElementById('profile-pill').addEventListener('click', () => {
      const loggedInUser = localStorage.getItem('SWEETOS_logged_in_user');
      const targetPage = loggedInUser ? 'profile' : 'auth';
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: targetPage } }));
    });

    // Wishlist click
    shadow.getElementById('wishlist-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigation:changed', {
        detail: { page: 'wishlist' }
      }));
    });

    // Logo click home
    shadow.getElementById('logo-btn').addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigation:changed', {
        detail: { page: 'home' }
      }));
    });

    // Sync count on Cart badge
    window.addEventListener('cart:updated', (e) => {
      const cart = e.detail || [];
      const count = cart.reduce((acc, item) => acc + item.quantity, 0);
      const badge = shadow.getElementById('cartBadge');
      if (badge) {
        badge.textContent = count;
      }
    });

    // Sync notifications unread badge
    window.addEventListener('notifications:badge-sync', (e) => {
      const count = e.detail;
      const badge = shadow.getElementById('notificationBadge');
      if (badge) {
        if (count > 0) {
          badge.textContent = count;
          badge.style.display = 'flex';
        } else {
          badge.style.display = 'none';
        }
      }
    });

    // Sync search input
    window.addEventListener('search:query', (e) => {
      const { query } = e.detail;
      if (query !== undefined && query !== searchInput.value) {
        searchInput.value = query;
      }
    });

    // Real-time Event listeners for user status and notifications updates
    window.addEventListener('auth:changed', () => {
      this.updateUserPill();
    });

    window.addEventListener('profile:updated', () => {
      this.updateUserPill();
    });

    window.addEventListener('notifications:updated', () => {
      this.syncNotificationBadge();
    });

    window.addEventListener('storage', (e) => {
      const key = getNotificationsStorageKey();
      if (e.key === key) {
        this.syncNotificationBadge();
      }
    });

    window.addEventListener('wishlist:updated', () => {
      this.syncWishlistBadge();
    });
    
    window.addEventListener('branding:updated', () => {
      this.render();
      this.setupEventListeners();
      this.updateUserPill();
      this.syncCartBadge();
      this.syncNotificationBadge();
      this.syncWishlistBadge();
    });
  }

  showSuggestions(query) {
    const dropdown = this.shadowRoot.getElementById('search-suggestions-dropdown');
    if (!dropdown) return;

    if (!query.trim()) {
      dropdown.innerHTML = '';
      dropdown.classList.remove('visible');
      return;
    }

    const matches = products.filter(p => 
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.category.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5);

    if (matches.length === 0) {
      dropdown.innerHTML = `
        <div class="no-suggestions-item">
          No matching products found
        </div>
      `;
      dropdown.classList.add('visible');
      return;
    }

    dropdown.innerHTML = matches.map(p => `
      <div class="suggestion-item" data-id="${p.id}">
        <img class="suggestion-img" src="${p.image}" alt="${p.name}">
        <div class="suggestion-info">
          <span class="suggestion-name">${p.name}</span>
          <span class="suggestion-meta">${p.category} • ${formatPrice(p.price)}</span>
        </div>
      </div>
    `).join('');

    dropdown.classList.add('visible');

    // Add click listeners to items
    dropdown.querySelectorAll('.suggestion-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(item.getAttribute('data-id'));
        dropdown.classList.remove('visible');
        
        // Auto-fill input
        const input = this.shadowRoot.getElementById('header-search-input');
        const matchProduct = products.find(p => p.id === id);
        if (matchProduct && input) {
          input.value = matchProduct.name;
        }

        // Trigger viewing product modal
        window.dispatchEvent(new CustomEvent('product:view', { detail: id }));
      });
    });
  }
}

customElements.define('app-header', Header);
export default Header;
