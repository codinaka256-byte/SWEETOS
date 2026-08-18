import products from '../../data/products.js';
import { getCartStorageKey, formatPrice } from '../../utils/storage.js';

class CartDrawer extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.cart = [];
    this.products = products;
  }

  connectedCallback() {
    this.loadCartFromStorage();
    this.render();
    this.setupEventListeners();
  }

  loadCartFromStorage() {
    const key = getCartStorageKey();
    const saved = localStorage.getItem(key);
    if (saved) {
      try {
        this.cart = JSON.parse(saved);
      } catch (e) {
        this.cart = [];
      }
    } else {
      this.cart = [];
    }
  }

  saveCartToStorage() {
    const key = getCartStorageKey();
    localStorage.setItem(key, JSON.stringify(this.cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: this.cart }));
  }

  render() {
    // 1. Ensure stylesheet links are injected exactly once to prevent layout style drops on re-renders
    if (!this.shadowRoot.querySelector('link[href*="CartDrawer.css"]')) {
      const fontLink = document.createElement('link');
      fontLink.rel = 'stylesheet';
      fontLink.href = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap';
      this.shadowRoot.appendChild(fontLink);

      const cssLink = document.createElement('link');
      cssLink.rel = 'stylesheet';
      cssLink.href = './components/Cart/CartDrawer.css';
      this.shadowRoot.appendChild(cssLink);
    }

    // 2. Ensure internal wrapper container exists
    let container = this.shadowRoot.querySelector('.drawer-container-wrapper');
    if (!container) {
      container = document.createElement('div');
      container.className = 'drawer-container-wrapper';
      container.style.height = '100%';
      this.shadowRoot.appendChild(container);
    }

    const totalItems = this.cart.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discount = subtotal * 0.1; // 10% discount simulation
    const total = subtotal - discount;

    container.innerHTML = `
      <div class="cart-wrapper">
        <!-- Swipe handle indicator for mobile -->
        <div class="drawer-swipe-handle"></div>
        <!-- Header -->
        <div class="cart-header">
          <div class="cart-header-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0052cc" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cart-bag-icon" style="width: 22px; height: 22px; flex-shrink: 0; display: inline-block;">
              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <path d="M16 10a4 4 0 0 1-8 0"></path>
            </svg>
            <h2>Votre panier</h2>
            <span class="cart-badge-count-pill">${totalItems} item${totalItems !== 1 ? 's' : ''}</span>
          </div>
          <button class="continue-shopping-top-btn" id="continueShoppingTopBtn">Continuer les achats</button>
        </div>

        <!-- Cart Items Area -->
        <div class="cart-items-area custom-scroll">
          ${this.cart.length === 0 ? `
            <div class="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#0052cc" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-icon" style="width: 48px; height: 48px; flex-shrink: 0; display: inline-block;">
                <circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
              </svg>
              <p class="empty-title">Votre panier est vide</p>
              <p class="empty-desc">Ajoutez des articles premium pour commencer !</p>
            </div>
          ` : this.cart.map((item, index) => {
            const firstWord = item.name.split(' ')[0] || 'Brand';
            const originalPrice = item.price * 1.333; // ~25% off calculations
            return `
              <div class="cart-item-card" data-index="${index}">
                <div class="cart-item-img-wrapper">
                  <img src="${item.image}" alt="${item.name}">
                </div>
                <div class="cart-item-info">
                  <div class="cart-item-text-details">
                    <h3 class="cart-item-title">${item.name}</h3>
                    <p class="cart-item-brand">${firstWord}</p>
                    <div class="cart-item-price-badges">
                      <span class="cart-item-price-current">${formatPrice(item.price)}</span>
                      <span class="cart-item-price-original">${formatPrice(originalPrice)}</span>
                      <span class="cart-item-discount-badge">-25%</span>
                      <span class="cart-item-deal-tag">DEAL</span>
                    </div>
                  </div>
                  <div class="cart-item-footer-row">
                    <div class="qty-container">
                      <button class="dec-btn" data-index="${index}">−</button>
                      <span class="qty-val">${item.quantity}</span>
                      <button class="inc-btn" data-index="${index}">+</button>
                    </div>
                    <button class="cart-item-delete" data-index="${index}" title="Remove Item">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 18px; height: 18px; flex-shrink: 0; display: inline-block;">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <!-- Footer / Checkout Section -->
        <div class="cart-footer-section">
          <div class="totals-summary-header">Récapitulatif de la commande</div>
          
          <!-- Totals -->
          <div class="totals-summary">
            <div class="totals-row">
              <span>Sous-total</span>
              <span class="val-white">${formatPrice(subtotal)}</span>
            </div>
            <div class="totals-row">
              <span>Livraison</span>
              <span class="val-cyan">Free</span>
            </div>
            <div class="totals-row discount-row">
              <span>Réduction</span>
              <span class="val-magenta">-${formatPrice(discount)}</span>
            </div>
            <div class="totals-row total-line">
              <span class="total-label">Total</span>
              <span class="total-val">${formatPrice(total)}</span>
            </div>
          </div>

          <!-- Promo Code -->
          <div class="promo-apply-row">
            <input type="text" placeholder="Code de réduction" id="promoInput">
            <button id="promoApply">Appliquer</button>
          </div>

          <!-- Checkout Button -->
          <button id="checkoutBtn" class="checkout-submit-btn">
            Procéder au paiement
          </button>

          <!-- Continue Shopping Button Bottom -->
          <button id="continueShoppingBottomBtn" class="continue-shopping-bottom-btn">
            Continuer les achats
          </button>
        </div>
      </div>
    `;

    this.attachDynamicListeners();
  }

  setupEventListeners() {
    window.addEventListener('cart:add', (e) => {
      const product = e.detail;
      const existing = this.cart.find(item => item.id === product.id);
      if (existing) {
        existing.quantity++;
      } else {
        this.cart.push({ ...product, quantity: 1 });
      }
      this.saveCartToStorage();
      this.render();
      window.dispatchEvent(new CustomEvent('toast:show', { detail: `Added ${product.name} to Cart! 🛒` }));
    });

    // Listen for auth state changes (login/logout) to reload user-specific cart
    window.addEventListener('auth:changed', () => {
      this.loadCartFromStorage();
      this.render();
    });
  }

  attachDynamicListeners() {
    const shadow = this.shadowRoot;

    const closeTriggers = [
      shadow.getElementById('continueShoppingTopBtn'),
      shadow.getElementById('continueShoppingBottomBtn')
    ];
    closeTriggers.forEach(el => {
      if (el) {
        el.addEventListener('click', () => {
          window.dispatchEvent(new CustomEvent('cart:toggle', { detail: { open: false } }));
        });
      }
    });

    shadow.querySelectorAll('.inc-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        this.cart[idx].quantity++;
        this.saveCartToStorage();
        this.render();
      });
    });

    shadow.querySelectorAll('.dec-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        if (this.cart[idx].quantity > 1) {
          this.cart[idx].quantity--;
        } else {
          this.cart.splice(idx, 1);
        }
        this.saveCartToStorage();
        this.render();
      });
    });

    shadow.querySelectorAll('.cart-item-delete').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const name = this.cart[idx].name;
        this.cart.splice(idx, 1);
        this.saveCartToStorage();
        this.render();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `${name} removed from Cart.` }));
      });
    });

    shadow.querySelectorAll('.cart-item-wishlist').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'));
        const name = this.cart[idx].name;
        this.cart.splice(idx, 1);
        this.saveCartToStorage();
        this.render();
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `${name} moved to Wishlist ❤️` }));
      });
    });

    shadow.getElementById('promoApply').addEventListener('click', () => {
      const code = shadow.getElementById('promoInput').value.trim();
      if (code) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Promo code "${code}" applied! 🎉` }));
        shadow.getElementById('promoInput').value = '';
      } else {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please enter a promo code.' }));
      }
    });

    shadow.getElementById('checkoutBtn').addEventListener('click', () => {
      if (this.cart.length === 0) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Your Cart is empty!' }));
        return;
      }
      window.dispatchEvent(new CustomEvent('checkout:start'));
    });

    // Recommendations section removed to unclutter the drawer
  }
}

customElements.define('cart-drawer', CartDrawer);
export default CartDrawer;
