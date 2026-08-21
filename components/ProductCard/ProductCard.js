import { formatPrice, getWishlistStorageKey } from '../../utils/storage.js';

class ProductCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this._product = null;
  }

  set product(value) {
    this._product = value;
    this.render();
  }

  get isHotDeal() {
    return this._isHotDeal || false;
  }

  set isHotDeal(value) {
    this._isHotDeal = !!value;
    if (this._product) {
      this.render();
    }
  }

  get product() {
    return this._product;
  }

  connectedCallback() {
    if (this._product) {
      this.render();
    }
  }

  render() {
    const p = this._product;
    if (!p) return;

    const isOutOfStock = p.stock === 0;

    // Load actual reviews from localStorage to eliminate mock reviews on card list
    const key = `SWEETOS_reviews_${p.id}`;
    const saved = localStorage.getItem(key);
    let reviewsList = [];
    if (saved) {
      try {
        reviewsList = JSON.parse(saved);
      } catch (e) {}
    }
    const totalReviewsCount = reviewsList.length;
    const averageRating = totalReviewsCount > 0 
      ? (reviewsList.reduce((sum, r) => sum + r.rating, 0) / totalReviewsCount).toFixed(1)
      : "0.0";

    // Dynamically calculate status signs using real review counts
    const isNew = p.id > 38; // Last 12 items are new arrivals
    const isBestSeller = parseFloat(averageRating) >= 4.8 && totalReviewsCount >= 5; // Best Seller requires >=5 real 4.8+ ratings

    const wlKey = getWishlistStorageKey();
    const wishlistSaved = localStorage.getItem(wlKey);
    let isWishlisted = false;
    if (wishlistSaved) {
      try {
        const wishlist = JSON.parse(wishlistSaved);
        isWishlisted = wishlist.some(item => item.id === p.id);
      } catch (e) {}
    }

    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/ProductCard/ProductCard.css">
      <div class="card glass-panel">
        <div class="image-container">
          <img src="${p.image}" alt="${p.name}" class="product-img">
          
          <!-- Category badge removed -->
          
          <!-- Status Signs on right -->
          <div class="status-badge-container">
            ${isBestSeller ? `<span class="status-badge bestseller">Best Seller</span>` : ''}
            ${isNew && !isBestSeller ? `<span class="status-badge new">New</span>` : ''}
          </div>
          
          <div class="overlay-actions">
            <button class="action-btn" id="quick-view-btn" title="Quick View">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                <circle cx="12" cy="12" r="3"></circle>
              </svg>
            </button>
            <button class="action-btn ${isWishlisted ? 'wishlisted' : ''}" id="wishlist-add-btn" title="${isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="${isWishlisted ? 'var(--red)' : 'none'}" stroke="${isWishlisted ? 'var(--red)' : 'currentColor'}" stroke-width="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
            <button class="action-btn" id="add-to-cart-btn" title="${isOutOfStock ? 'Rupture de Stock / Out of Stock' : 'Add to Cart'}" ${isOutOfStock ? 'disabled style="opacity: 0.45; cursor: not-allowed; pointer-events: none;"' : ''}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <path d="M16 10a4 4 0 0 1-8 0"></path>
              </svg>
            </button>
          </div>
        </div>
        
        <div class="info-container">
          <div class="rating-row">
            <span class="stars" style="color: ${totalReviewsCount > 0 ? '#00b4d8' : '#94a3b8'};">
              <svg class="star-icon" viewBox="0 0 24 24" width="14" height="14" fill="${totalReviewsCount > 0 ? '#00b4d8' : '#94a3b8'}" stroke="${totalReviewsCount > 0 ? '#00b4d8' : '#94a3b8'}"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
              ${averageRating}
            </span>
            <span class="reviews">(${totalReviewsCount})</span>
          </div>
          
          <h3 class="product-title" id="title-click">${p.name}</h3>
          <p class="product-desc">${p.shortDesc}</p>
          
          <div class="price-row">
            <div class="price-box">
              <span class="price">${formatPrice(p.price)}</span>
              ${this.isHotDeal ? `<span class="original-price">${formatPrice(p.price / 0.8)}</span>` : ''}
            </div>
            <button class="buy-btn" id="buy-btn" ${isOutOfStock ? 'disabled style="background: #475569; border-color: #475569; opacity: 0.55; cursor: not-allowed; pointer-events: none;"' : ''}>
              ${isOutOfStock ? 'Out' : 'Add +'}
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners();
  }

  setupEventListeners() {
    const shadow = this.shadowRoot;
    const p = this._product;

    const addBtn = shadow.getElementById('add-to-cart-btn');
    const buyBtn = shadow.getElementById('buy-btn');
    const triggerAddToCart = (e) => {
      e.stopPropagation();
      if (p.stock === 0) return;
      window.dispatchEvent(new CustomEvent('cart:add', { detail: p }));
    };
    addBtn.addEventListener('click', triggerAddToCart);
    buyBtn.addEventListener('click', triggerAddToCart);

    const wishBtn = shadow.getElementById('wishlist-add-btn');
    if (wishBtn) {
      wishBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        window.dispatchEvent(new CustomEvent('wishlist:add', { detail: p }));
      });
    }

    const updateCardWishlistState = (wishlist) => {
      const isCurrentlyWishlisted = wishlist.some(item => item.id === p.id);
      if (wishBtn) {
        wishBtn.title = isCurrentlyWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist';
        wishBtn.classList.toggle('wishlisted', isCurrentlyWishlisted);
        const svg = wishBtn.querySelector('svg');
        if (svg) {
          svg.setAttribute('fill', isCurrentlyWishlisted ? 'var(--red)' : 'none');
          svg.setAttribute('stroke', isCurrentlyWishlisted ? 'var(--red)' : 'currentColor');
        }
      }
    };

    window.addEventListener('wishlist:updated', (e) => {
      updateCardWishlistState(e.detail || []);
    });

    const qvBtn = shadow.getElementById('quick-view-btn');
    const titleClick = shadow.getElementById('title-click');
    const cardEl = shadow.querySelector('.card');
    
    const triggerViewDetails = (e) => {
      e.stopPropagation();
      window.dispatchEvent(new CustomEvent('product:view', { detail: p.id }));
    };

    qvBtn.addEventListener('click', triggerViewDetails);
    titleClick.addEventListener('click', triggerViewDetails);
    cardEl.addEventListener('click', (e) => {
      if (e.target.closest('#add-to-cart-btn') || e.target.closest('#buy-btn') || e.target.closest('#quick-view-btn') || e.target.closest('#wishlist-add-btn')) {
        return;
      }
      triggerViewDetails(e);
    });
  }
}

customElements.define('product-card', ProductCard);
export default ProductCard;
