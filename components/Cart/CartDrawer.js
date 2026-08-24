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

    // Cloud sync: fetch latest cart from server if logged in
    const userJson = localStorage.getItem('SWEETOS_logged_in_user');
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u && u.email) {
          fetch(`/api/user-sync?email=${encodeURIComponent(u.email)}`)
            .then(r => r.json())
            .then(cloudData => {
              if (cloudData && Array.isArray(cloudData.cart)) {
                this.cart = cloudData.cart;
                localStorage.setItem(key, JSON.stringify(this.cart));
                this.render();
                window.dispatchEvent(new CustomEvent('cart:updated', { detail: this.cart }));
              }
            }).catch(() => {});
        }
      } catch(e) {}
    }
  }

  saveCartToStorage() {
    const key = getCartStorageKey();
    localStorage.setItem(key, JSON.stringify(this.cart));
    window.dispatchEvent(new CustomEvent('cart:updated', { detail: this.cart }));

    // Cloud sync: push updated cart to server if logged in
    const userJson = localStorage.getItem('SWEETOS_logged_in_user');
    if (userJson) {
      try {
        const u = JSON.parse(userJson);
        if (u && u.email) {
          fetch('/api/user-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: u.email, type: 'cart', data: this.cart })
          }).catch(() => {});
        }
      } catch(e) {}
    }
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
    
    let discount = 0;
    let appliedCoupon = null;
    try {
      const savedCoupon = sessionStorage.getItem('SWEETOS_applied_coupon');
      if (savedCoupon) {
        appliedCoupon = JSON.parse(savedCoupon);
        if (appliedCoupon.minOrder && subtotal < appliedCoupon.minOrder) {
          sessionStorage.removeItem('SWEETOS_applied_coupon');
          appliedCoupon = null;
        } else {
          if (appliedCoupon.type === 'percentage') {
            discount = subtotal * (appliedCoupon.value / 100);
          } else {
            discount = appliedCoupon.value;
          }
        }
      }
    } catch(e) {}

    const total = subtotal - discount;

    // Load coupons from storage
    let couponsList = [];
    try {
      const stored = localStorage.getItem('SWEETOS_coupons');
      couponsList = stored ? JSON.parse(stored) : [];
    } catch(e) {}
    // Filter to only display coupons that are active and won by scratching a mystery box
    const activeCoupons = couponsList.filter(c => 
      c.status === 'active' && 
      (c.code.startsWith('LOYAL') || c.code.startsWith('SAVE'))
    );

    container.innerHTML = `
      <div class="cart-wrapper">
        <!-- Swipe handle indicator for mobile -->
        <div class="drawer-swipe-handle"></div>
        <!-- Header -->
        <div class="cart-header">
          <div class="cart-header-left">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="cart-bag-icon" style="width: 22px; height: 22px; flex-shrink: 0; display: inline-block;">
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="empty-icon" style="width: 48px; height: 48px; flex-shrink: 0; display: inline-block;">
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
            ${discount > 0 ? `
              <div class="totals-row discount-row" style="color: var(--magenta); font-weight: 700;">
                <span>Réduction (${appliedCoupon ? appliedCoupon.value : 0}%)</span>
                <span class="val-magenta">-${formatPrice(discount)}</span>
              </div>
            ` : ''}
            <div class="totals-row total-line">
              <span class="total-label">Total</span>
              <span class="total-val" style="display: flex; flex-direction: column; align-items: flex-end;">
                ${discount > 0 ? `<span style="text-decoration: line-through; font-size: 11px; opacity: 0.6; font-weight: 500; margin-bottom: 2px;">${formatPrice(subtotal)}</span>` : ''}
                <span style="${discount > 0 ? 'color: var(--cyan); font-size: 19px; font-weight: 800;' : ''}">${formatPrice(total)}</span>
              </span>
            </div>
          </div>

          <!-- Applied Coupon Info -->
          ${appliedCoupon ? `
            <div class="applied-coupon-badge" style="display: flex; align-items: center; justify-content: space-between; background: var(--primary-light); border: 1.5px solid var(--primary); padding: 8px 12px; border-radius: 12px; margin-bottom: 12px; font-size: 12.5px;">
              <div style="display: flex; align-items: center; gap: 8px;">
                <span style="font-size: 15px;">🎟️</span>
                <span style="font-weight: 800; color: var(--primary);">${appliedCoupon.code}</span>
                <span style="font-size: 10px; color: var(--text-gray); font-weight: 600;">(Appliqué)</span>
              </div>
              <button id="removeCouponBtn" style="background: none; border: none; font-size: 20px; font-weight: bold; cursor: pointer; color: var(--red); padding: 0 4px; line-height: 1; margin: 0; height: auto; width: auto;">&times;</button>
            </div>
          ` : ''}

          <!-- Promo Code -->
          <div class="promo-apply-row">
            <input type="text" placeholder="Code de réduction" id="promoInput">
            <button id="promoApply">Appliquer</button>
          </div>

          <!-- Active Coupons list -->
          ${activeCoupons.length > 0 ? `
            <div class="available-coupons-section" style="margin-top: 16px; margin-bottom: 16px;">
              <span style="font-size: 11px; font-weight: 800; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">🎫 Offres & Coupons / Offers & Coupons</span>
              <div style="display: flex; flex-direction: column; gap: 8px;">
                ${activeCoupons.map(c => {
                  const discountText = c.type === 'percentage' ? `${c.value}% OFF` : `${formatPrice(c.value)} OFF`;
                  return `
                    <div class="coupon-item-card" style="display: flex; align-items: center; justify-content: space-between; background: rgba(255, 255, 255, 0.4); border: 1.5px dashed var(--border); padding: 8px 12px; border-radius: 12px; font-size: 12px; backdrop-filter: blur(4px);">
                      <div style="display: flex; flex-direction: column; gap: 2px;">
                        <code style="font-weight: 800; font-size: 12.5px; color: var(--primary);">${c.code}</code>
                        <span style="font-size: 10px; color: var(--text-gray); font-weight: 600;">${discountText} (Exp: ${c.expiry})</span>
                      </div>
                      <div style="display: flex; gap: 6px; align-items: center;">
                        <button class="apply-available-coupon-btn" data-coupon-code="${c.code}" style="background: var(--primary-light); color: var(--primary); border: none; font-weight: 800; font-size: 11px; padding: 6px 12px; border-radius: 8px; cursor: pointer; transition: all 0.2s; height: auto; margin: 0;">
                          Appliquer
                        </button>
                        <button class="share-coupon-whatsapp-btn" data-coupon-code="${c.code}" data-coupon-desc="${discountText}" data-coupon-expiry="${c.expiry}" style="background: #25d366; color: white; border: none; border-radius: 8px; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s; margin: 0; padding: 0;" title="Partager sur WhatsApp">
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="width: 14px; height: 14px; flex-shrink: 0;"><path d="M17.472 14.382c-.022-.08-.124-.184-.282-.232-.078-.024-.464-.232-.536-.252-.072-.02-.124-.03-.178.05-.054.082-.21.26-.258.312-.048.052-.096.06-.178.02a1.866 1.866 0 0 1-.502-.308c-.287-.25-.482-.56-.538-.65-.056-.092-.006-.142.04-.188.04-.04.096-.11.144-.168.048-.058.064-.1.096-.168.032-.068.016-.128-.008-.178-.024-.05-.178-.436-.244-.594-.064-.158-.13-.136-.178-.138-.046-.002-.098-.002-.15-.002a.287.287 0 0 0-.208.098c-.072.078-.276.27-.276.658 0 .388.282.764.32.816.04.052.556.85 1.348 1.192.188.082.336.13.45.166.19.06.362.052.498.032.152-.022.464-.19.53-.374.066-.184.066-.342.046-.374-.022-.03-.078-.05-.156-.088zm-5.467 1.162a6.3 6.3 0 0 1-3.237-.893l-.233-.14-2.404.63 2.443-2.38-.152-.243a6.262 6.262 0 0 1-.958-3.326c0-3.468 2.82-6.29 6.29-6.29 3.47 0 6.29 2.822 6.29 6.29 0 3.47-2.82 6.29-6.29 6.29zm0-13.82c-4.148 0-7.527 3.38-7.527 7.527 0 1.326.347 2.62 1.006 3.766L4 19.5l4.636-1.216a7.487 7.487 0 0 0 3.37.804c4.148 0 7.527-3.378 7.527-7.527 0-4.15-3.38-7.527-7.527-7.527z"/></svg>
                        </button>
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          ` : ''}

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

    // Listen to real-time live cart updates (e.g. added from phone or cleared on checkout)
    window.addEventListener('cart:updated', (e) => {
      if (Array.isArray(e.detail)) {
        this.cart = e.detail;
      } else {
        this.loadCartFromStorage();
      }
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
        // Load coupons list
        let coupons = [];
        try {
          const stored = localStorage.getItem('SWEETOS_coupons');
          coupons = stored ? JSON.parse(stored) : [];
        } catch(e) {}

        const coupon = coupons.find(c => c.code.toUpperCase() === code.toUpperCase());
        const isWonCoupon = coupon && (coupon.code.startsWith('LOYAL') || coupon.code.startsWith('SAVE'));
        
        if (!coupon || !isWonCoupon) {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Code promo invalide / Invalid code.' }));
          return;
        }

        if (coupon.status !== 'active') {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Ce coupon est déjà expiré ou utilisé / Coupon expired.' }));
          return;
        }

        // Validate expiration date
        const today = new Date().toISOString().split('T')[0];
        if (coupon.expiry && coupon.expiry < today) {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Ce coupon a expiré / Coupon expired.' }));
          return;
        }

        // Validate minimum order
        const subtotal = this.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        if (coupon.minOrder && subtotal < coupon.minOrder) {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Minimum d'achat requis : ${formatPrice(coupon.minOrder)} / Min order required.` }));
          return;
        }

        // Apply!
        sessionStorage.setItem('SWEETOS_applied_coupon', JSON.stringify(coupon));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Coupon "${coupon.code}" appliqué ! 🎉` }));
        shadow.getElementById('promoInput').value = '';
        this.render();
      } else {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please enter a promo code.' }));
      }
    });

    const removeBtn = shadow.getElementById('removeCouponBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        sessionStorage.removeItem('SWEETOS_applied_coupon');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Coupon retiré.' }));
        this.render();
      });
    }

    shadow.getElementById('checkoutBtn').addEventListener('click', () => {
      if (this.cart.length === 0) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Your Cart is empty!' }));
        return;
      }
      window.dispatchEvent(new CustomEvent('checkout:start'));
    });

    // Available Coupons listeners
    shadow.querySelectorAll('.apply-available-coupon-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const code = btn.getAttribute('data-coupon-code');
        const input = shadow.getElementById('promoInput');
        if (input) {
          input.value = code;
          shadow.getElementById('promoApply').click();
        }
      });
    });

    shadow.querySelectorAll('.share-coupon-whatsapp-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = btn.getAttribute('data-coupon-code');
        const desc = btn.getAttribute('data-coupon-desc');
        const expiry = btn.getAttribute('data-coupon-expiry');
        
        const message = `🌟 OFFRE SPÉCIALE SWEETOS ! 🌟\nProfitez d'une réduction exclusive sur notre boutique en ligne !\n\nCode Promo : *${code}*\nRéduction : *${desc}*\nDate d'expiration : *${expiry}*\n\nFaites vos achats ici : ${window.location.origin}`;
        const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      });
    });

    // Listen to global cart update events (e.g. checkout completion clearing cart)
    window.addEventListener('cart:updated', (e) => {
      this.cart = e.detail || [];
      this.render();
    });
  }
}

customElements.define('cart-drawer', CartDrawer);
export default CartDrawer;
