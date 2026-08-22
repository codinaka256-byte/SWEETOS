import { getCartStorageKey, getProfileStorageKey, getNotificationsStorageKey, formatPrice } from '../../utils/storage.js';

class CheckoutModal extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.isOpen = false;
    this.step = 1; // 1: Shipping, 2: Payment, 3: Success
    this.latestOrderId = '';
    this.latestOrderTotal = 0;
    this.selectedPaymentMethod = '';
    this.orderedItems = [];
    this.formData = {
      name: '',
      email: '',
      phone: '',
      address: '',
      zip: '',
      cardNum: '',
      cardExpiry: '',
      cardCvv: ''
    };
  }

  getShippingFee(subtotal) {
    if (subtotal === 0) return 0;
    const shippingRate = parseFloat(localStorage.getItem('SWEETOS_shipping_rate') || '2000');
    const freeThreshold = parseFloat(localStorage.getItem('SWEETOS_free_shipping_threshold') || '15000');
    return subtotal >= freeThreshold ? 0 : shippingRate;
  }

  getOrderTotal() {
    const cartSaved = localStorage.getItem(getCartStorageKey());
    let cartItems = [];
    if (cartSaved) {
      try {
        cartItems = JSON.parse(cartSaved);
      } catch (e) {}
    }
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = this.getShippingFee(subtotal);
    
    let discount = 0;
    try {
      const savedCoupon = sessionStorage.getItem('SWEETOS_applied_coupon');
      if (savedCoupon) {
        const applied = JSON.parse(savedCoupon);
        if (!applied.minOrder || subtotal >= applied.minOrder) {
          discount = applied.type === 'percentage' ? subtotal * (applied.value / 100) : applied.value;
        }
      }
    } catch(e) {}

    return subtotal + shippingFee - discount;
  }

  connectedCallback() {
    this.setupEventListeners();
    const isCheckoutOpen = sessionStorage.getItem('SWEETOS_checkout_open') === 'true';
    if (isCheckoutOpen) {
      this.isOpen = true;
      this.step = parseInt(sessionStorage.getItem('SWEETOS_checkout_step') || '1');
      this.selectedPaymentMethod = sessionStorage.getItem('SWEETOS_checkout_payment_method') || '';
      this.latestOrderId = sessionStorage.getItem('SWEETOS_checkout_order_id') || '';
      this.latestOrderTotal = parseFloat(sessionStorage.getItem('SWEETOS_checkout_order_total') || '0');
      
      // Auto-fill from active user profile if available
      const profileKey = getProfileStorageKey();
      let profileSaved = localStorage.getItem(profileKey);
      if (!profileSaved) {
        profileSaved = localStorage.getItem('SWEETOS_user_profile');
      }
      if (profileSaved) {
        try {
          const prof = JSON.parse(profileSaved);
          this.formData.name = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
          this.formData.email = prof.email || '';
          this.formData.phone = prof.phone || '';
          if (prof.addresses && prof.addresses.length > 0) {
            const addr = prof.addresses[0];
            this.formData.address = typeof addr === 'string' ? addr : (addr.street || '');
          } else if (prof.address) {
            this.formData.address = prof.address;
          }
        } catch (e) {}
      }

      this.render();
      this.updateState();
      if (this.step === 3) {
        setTimeout(() => this.triggerConfetti(), 400);
      }
    }
  }

  open() {
    this.isOpen = true;
    this.step = 1;
    sessionStorage.setItem('SWEETOS_checkout_open', 'true');
    sessionStorage.setItem('SWEETOS_checkout_step', this.step.toString());
    
    // Auto-fill from active user profile if available
    const profileKey = getProfileStorageKey();
    let profileSaved = localStorage.getItem(profileKey);
    if (!profileSaved) {
      profileSaved = localStorage.getItem('SWEETOS_user_profile');
    }
    if (profileSaved) {
      try {
        const prof = JSON.parse(profileSaved);
        this.formData.name = `${prof.firstName || ''} ${prof.lastName || ''}`.trim();
        this.formData.email = prof.email || '';
        this.formData.phone = prof.phone || '';
        if (prof.addresses && prof.addresses.length > 0) {
          const addr = prof.addresses[0];
          this.formData.address = typeof addr === 'string' ? addr : (addr.street || '');
        } else if (prof.address) {
          this.formData.address = prof.address;
        }
      } catch (e) {}
    }

    this.render();
    this.updateState();
  }

  close() {
    this.isOpen = false;
    sessionStorage.removeItem('SWEETOS_checkout_open');
    sessionStorage.removeItem('SWEETOS_checkout_step');
    sessionStorage.removeItem('SWEETOS_checkout_payment_method');
    sessionStorage.removeItem('SWEETOS_checkout_order_id');
    sessionStorage.removeItem('SWEETOS_checkout_order_total');
    this.updateState();
  }

  triggerConfetti() {
    if (typeof window.confetti === 'function') {
      try {
        const duration = 3000;
        const end = Date.now() + duration;
        const colors = ['#0052cc', '#00b4d8', '#10b981', '#f59e0b'];

        (function frame() {
          window.confetti({
            particleCount: 5,
            angle: 60,
            spread: 55,
            origin: { x: 0 },
            colors: colors
          });
          window.confetti({
            particleCount: 5,
            angle: 120,
            spread: 55,
            origin: { x: 1 },
            colors: colors
          });

          if (Date.now() < end) {
            requestAnimationFrame(frame);
          }
        }());
        
        setTimeout(() => {
          window.confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: colors
          });
        }, 300);
      } catch (e) {
        console.error("Confetti trigger failed:", e);
      }
    }
  }

  render() {
    this.shadowRoot.innerHTML = `
      <link rel="stylesheet" href="./components/Checkout/CheckoutModal.css">
      <div class="modal-overlay ${this.isOpen ? 'open' : ''}" id="overlay">
        <div class="modal-container glass-panel">
          
          <!-- Checkout Header (Only for step 1 and 2) -->
          ${this.step < 3 ? `
            <div class="checkout-header-bar">
              <div class="checkout-header-title">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" class="paiement-icon">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                <h2>Checkout</h2>
              </div>
              <button class="btn-retour-panier" id="close-btn-retour">Retour au panier</button>
            </div>
          ` : ''}

          <!-- Checkout Two-Column Grid -->
          <div class="checkout-layout-grid ${this.step === 3 ? 'success-layout' : ''}">
            <div class="checkout-main-panel">
              <!-- Forms / Success Content -->
              <div class="checkout-content">
                ${this.renderStepContent()}
              </div>
            </div>

            <!-- Order Summary Column -->
            ${this.step < 3 ? `
              <div class="checkout-summary-panel">
                ${this.renderOrderSummary()}
              </div>
            ` : ''}
          </div>

        </div>
      </div>
    `;

    this.attachDynamicListeners();
  }

  renderStepContent() {
    if (this.step < 3) {
      return `
        <form id="shipping-form" class="checkout-form">
          <div class="form-section-header">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="#0052cc" stroke-width="2.5" class="user-icon">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            <h3 class="form-title">Informations de livraison</h3>
          </div>
          
          <div class="form-group">
            <label for="name">Nom complet</label>
            <input type="text" id="name" required autocomplete="name" value="${this.formData.name}" placeholder="Ex: Jean Dupont">
          </div>
          
          <div class="form-group">
            <label for="email">Adresse e-mail</label>
            <input type="email" id="email" required autocomplete="email" value="${this.formData.email}" placeholder="Ex: jean.dupont@email.com">
          </div>
          
          <div class="form-group">
            <label for="phone">Numéro de téléphone</label>
            <input type="text" id="phone" required autocomplete="tel" placeholder="Ex: +225 07 00 00 00 00" value="${this.formData.phone || ''}">
            <span class="form-help-text">Nous l'utiliserons pour vous contacter concernant vos commandes</span>
          </div>

          <div class="form-group">
            <label for="address">Adresse de livraison</label>
            <input type="text" id="address" required autocomplete="street-address" value="${this.formData.address}" placeholder="Ex: Abidjan, Cocody Mermoz">
          </div>

          <div class="form-group">
            <label style="font-weight: 750; font-size: 13px; color: #102a43; margin-bottom: 2px;">Méthode de paiement</label>
            <div class="payment-methods-grid">
              ${localStorage.getItem('SWEETOS_payment_cod_enabled') !== 'false' ? `
                <div class="payment-method-card" data-value="cod">
                  <span class="payment-method-icon">📦</span>
                  <span class="payment-method-title">Livraison</span>
                </div>
              ` : ''}
              ${localStorage.getItem('SWEETOS_payment_momo_enabled') !== 'false' ? `
                <div class="payment-method-card" data-value="wave">
                  <span class="payment-method-icon">🌊</span>
                  <span class="payment-method-title">Wave</span>
                </div>
                <div class="payment-method-card" data-value="orange">
                  <span class="payment-method-icon">🍊</span>
                  <span class="payment-method-title">Orange</span>
                </div>
                <div class="payment-method-card" data-value="mtn">
                  <span class="payment-method-icon">💛</span>
                  <span class="payment-method-title">MTN</span>
                </div>
              ` : ''}
              ${localStorage.getItem('SWEETOS_payment_card_enabled') === 'true' ? `
                <div class="payment-method-card" data-value="card">
                  <span class="payment-method-icon">💳</span>
                  <span class="payment-method-title">Carte</span>
                </div>
              ` : ''}
            </div>
            ${(() => {
              const cod = localStorage.getItem('SWEETOS_payment_cod_enabled') !== 'false';
              const momo = localStorage.getItem('SWEETOS_payment_momo_enabled') !== 'false';
              const card = localStorage.getItem('SWEETOS_payment_card_enabled') === 'true';
              let fallback = 'cod';
              if (!cod) {
                if (momo) fallback = 'wave';
                else if (card) fallback = 'card';
              }
              if (!this.selectedPaymentMethod) {
                this.selectedPaymentMethod = fallback;
              }
              return `<input type="hidden" id="payment-method" value="${this.selectedPaymentMethod}" required>`;
            })()}
          </div>

          <!-- Dynamic payment instruction preview -->
          <div id="dynamic-payment-fields"></div>

          <div class="form-group checkbox-group">
            <input type="checkbox" id="accept-terms" required>
            <label for="accept-terms">J'accepte les conditions d'utilisation et la politique de confidentialité.</label>
          </div>

          <div class="form-group">
            <label for="notes">Notes de commande (Optionnel)</label>
            <textarea id="notes" placeholder="Instructions spéciales pour la livraison..."></textarea>
          </div>

          <button type="submit" class="submit-btn btn-primary" id="checkout-submit-btn-french">
            Passer la commande
          </button>
        </form>
      `;
    } else {
      let paymentInstructions = '';
      let paymentTitle = 'Commande passée ! 🎉';
      let paymentSub = 'Merci pour votre achat. Nous allons la confirmer sous peu.';

      const customMomo = localStorage.getItem('SWEETOS_payment_momo_instructions') || 'Veuillez effectuer le transfert puis envoyer la capture WhatsApp.';

      if (this.selectedPaymentMethod === 'wave') {
        paymentTitle = 'Attente de paiement Wave 🌊';
        paymentSub = 'Votre commande a bien été enregistrée. Pour la finaliser, veuillez effectuer le transfert Wave.';
        paymentInstructions = `
          <div class="success-payment-instructions" style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-radius: 16px; border: 1.5px solid #bbf7d0; text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #166534; margin: 0 0 10px 0; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">🌊</span> Instructions de paiement Wave:
            </h4>
            <p style="font-size: 12.5px; color: #166534; margin: 0; line-height: 1.6; font-weight: 700;">
              ${customMomo}
            </p>
            <p style="font-size: 12.5px; color: #166534; margin: 8px 0 0 0;">Montant total à régler : <strong>${formatPrice(this.latestOrderTotal)}</strong></p>
          </div>
        `;
      } else if (this.selectedPaymentMethod === 'orange') {
        paymentTitle = 'Attente de paiement Orange 🍊';
        paymentSub = 'Votre commande a bien été enregistrée. Veuillez effectuer le transfert Orange Money.';
        paymentInstructions = `
          <div class="success-payment-instructions" style="margin: 20px 0; padding: 20px; background: #fff7ed; border-radius: 16px; border: 1px solid #ffedd5; text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #7c2d12; margin: 0 0 10px 0; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">🍊</span> Instructions Orange Money:
            </h4>
            <p style="font-size: 12.5px; color: #9a3412; margin: 0; line-height: 1.6; font-weight: 700;">
              ${customMomo}
            </p>
            <p style="font-size: 12.5px; color: #9a3412; margin: 8px 0 0 0;">Montant total à régler : <strong>${formatPrice(this.latestOrderTotal)}</strong></p>
          </div>
        `;
      } else if (this.selectedPaymentMethod === 'mtn') {
        paymentTitle = 'Attente de paiement MTN 💛';
        paymentSub = 'Votre commande a bien été enregistrée. Veuillez effectuer le transfert MTN MoMo.';
        paymentInstructions = `
          <div class="success-payment-instructions" style="margin: 20px 0; padding: 20px; background: #fefce8; border-radius: 16px; border: 1px solid #fef08a; text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #713f12; margin: 0 0 10px 0; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">💛</span> Instructions MTN MoMo:
            </h4>
            <p style="font-size: 12.5px; color: #854d0e; margin: 0; line-height: 1.6; font-weight: 700;">
              ${customMomo}
            </p>
            <p style="font-size: 12.5px; color: #854d0e; margin: 8px 0 0 0;">Montant total à régler : <strong>${formatPrice(this.latestOrderTotal)}</strong></p>
          </div>
        `;
      } else if (this.selectedPaymentMethod === 'cod') {
        paymentTitle = 'Commande reçue ! 📦';
        paymentSub = 'Votre commande a été reçue et est en attente de confirmation par l\'administrateur.';
        paymentInstructions = `
          <div class="success-payment-instructions" style="margin: 20px 0; padding: 20px; background: #f0fdf4; border-radius: 16px; border: 1px solid #bbf7d0; text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #14532d; margin: 0 0 6px 0; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">📦</span> Paiement à la livraison:
            </h4>
            <p style="font-size: 12.5px; color: #166534; margin: 0; line-height: 1.5;">Veuillez préparer la somme de <strong>${formatPrice(this.latestOrderTotal)}</strong> en espèces (CFA) pour la remettre directement au livreur lors du dépôt à votre domicile.</p>
          </div>
        `;
      } else if (this.selectedPaymentMethod === 'card') {
        paymentTitle = 'Paiement carte validé ! 💳';
        paymentSub = 'Votre paiement par carte bancaire a été traité avec succès.';
        paymentInstructions = `
          <div class="success-payment-instructions" style="margin: 20px 0; padding: 20px; background: #f8fafc; border-radius: 16px; border: 1px solid #e2e8f0; text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #102a43; margin: 0 0 6px 0; display:flex; align-items:center; gap:8px;">
              <span style="font-size:18px;">💳</span> Transaction Carte de Crédit:
            </h4>
            <p style="font-size: 12.5px; color: #486581; margin: 0; line-height: 1.5;">Le montant de <strong>${formatPrice(this.latestOrderTotal)}</strong> a été débité. La commande est validée et sera expédiée sous peu.</p>
          </div>
        `;
      }

      return `
        <div class="success-screen animate-in">
          <!-- Animated Success Icon -->
          <div class="success-icon-wrapper">
            <svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>

          <h1>Commande enregistrée ! 📦</h1>
          <p class="subtitle">Merci pour votre achat chez SWEETOS. Votre commande a été bien reçue et est en attente de confirmation par l'administrateur.</p>

          <div class="order-badge">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; display:inline-block; margin-right:4px;">
              <line x1="4" y1="9" x2="20" y2="9"></line>
              <line x1="4" y1="15" x2="20" y2="15"></line>
              <line x1="10" y1="3" x2="8" y2="21"></line>
              <line x1="16" y1="3" x2="14" y2="21"></line>
            </svg>
            Commande #${this.latestOrderId}
          </div>

          <!-- Payment Information -->
          ${paymentInstructions}

          <!-- Email Notice -->
          <div class="email-notice">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10b981" stroke-width="2.5" style="vertical-align:middle; display:inline-block; margin-right:4px;">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
            <span>Confirmation envoyée à <strong>${this.formData.email}</strong></span>
          </div>

          <!-- Action Buttons -->
          <div class="actions">
            <button class="btn btn-secondary" id="return-shop-btn">
              Continuer les achats
            </button>
            <button class="btn btn-primary" id="success-view-orders-btn">
              Voir mes commandes
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" style="vertical-align:middle; display:inline-block; margin-left:4px;">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>
        </div>
      `;
    }
  }

  renderOrderSummary() {
    const cartSaved = localStorage.getItem(getCartStorageKey());
    let cartItems = [];
    if (cartSaved) {
      try {
        cartItems = JSON.parse(cartSaved);
      } catch (e) {}
    }

    if (this.step === 3 && this.orderedItems.length > 0) {
      cartItems = this.orderedItems;
    }

    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const shippingFee = this.getShippingFee(subtotal);

    let discount = 0;
    let appliedCoupon = null;
    try {
      const savedCoupon = sessionStorage.getItem('SWEETOS_applied_coupon');
      if (savedCoupon) {
        appliedCoupon = JSON.parse(savedCoupon);
        if (!appliedCoupon.minOrder || subtotal >= appliedCoupon.minOrder) {
          discount = appliedCoupon.type === 'percentage' ? subtotal * (appliedCoupon.value / 100) : appliedCoupon.value;
        } else {
          appliedCoupon = null;
        }
      }
    } catch(e) {}

    const total = subtotal + shippingFee - discount;

    // Prefill WhatsApp text with order details
    const itemsDesc = cartItems.map(item => `- ${item.name} (x${item.quantity})`).join('%0A');
    let waText = `Bonjour, je souhaite finaliser ma commande sur SWEETOS:%0A%0A*Articles:*%0A${itemsDesc}%0A%0A*Sous-total:* ${formatPrice(subtotal)}`;
    if (discount > 0) {
      waText += `%0A*Réduction (${appliedCoupon.code}):* -${formatPrice(discount)}`;
    }
    waText += `%0A*Frais de livraison:* ${formatPrice(shippingFee)}%0A*Total:* ${formatPrice(total)}`;
    const waLink = `https://api.whatsapp.com/send?phone=2250500619923&text=${waText}`;

    return `
      <div class="summary-header">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#102a43" stroke-width="2.5" class="lock-icon">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
        <h3>Récapitulatif de la commande</h3>
      </div>

      <div class="summary-items-list custom-scroll">
        ${cartItems.map(item => `
          <div class="summary-item-card">
            <div class="summary-item-img">
              <img src="${item.image}" alt="${item.name}">
            </div>
            <div class="summary-item-details">
              <h4>${item.name}</h4>
              <span class="summary-item-qty">Qty: ${item.quantity}</span>
            </div>
            <div class="summary-item-price">${formatPrice(item.price * item.quantity)}</div>
          </div>
        `).join('')}
      </div>

      <div class="summary-pricing-breakdown">
        <div class="pricing-line">
          <span>Sous-total</span>
          <span>${formatPrice(subtotal)}</span>
        </div>
        ${discount > 0 ? `
          <div class="pricing-line discount-row" style="color: #ff5630; font-weight: 750;">
            <span>Réduction (${appliedCoupon.code})</span>
            <span>-${formatPrice(discount)}</span>
          </div>
        ` : ''}
        <div class="pricing-line">
          <span>Frais de livraison</span>
          <span>${formatPrice(shippingFee)}</span>
        </div>
        <div class="pricing-divider"></div>
        <div class="pricing-line total-row">
          <span>Total</span>
          <span style="color: #0052cc; font-size: 18px; font-weight: 850; display: flex; flex-direction: column; align-items: flex-end;">
            ${discount > 0 ? `<span style="text-decoration: line-through; font-size: 12px; opacity: 0.65; font-weight: 500; color: #486581; margin-bottom: 2px;">${formatPrice(subtotal + shippingFee)}</span>` : ''}
            <span style="${discount > 0 ? 'color: #36b37e; font-size: 20px;' : ''}">${formatPrice(total)}</span>
          </span>
        </div>
      </div>

      ${this.step < 3 ? `
        <a href="${waLink}" target="_blank" class="whatsapp-contact-btn" id="wa-summary-btn">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" style="margin-right: 8px; vertical-align: middle;">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.003 5.324 5.328 0 11.859 0c3.166.001 6.141 1.233 8.377 3.469 2.235 2.237 3.465 5.212 3.464 8.377-.003 6.534-5.328 11.858-11.86 11.858-2.004-.001-3.973-.508-5.729-1.48L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.725 1.45 5.347 0 9.7-4.351 9.702-9.7.001-2.592-1.007-5.029-2.839-6.861-1.83-1.83-4.27-2.839-6.864-2.84C6.01 1.153 1.66 5.5 1.657 10.9c-.002 1.61.488 3.197 1.45 4.82L2.09 20.35l4.557-1.196zm12.385-6.304c-.318-.16-1.883-.93-2.175-1.038-.293-.108-.507-.16-.722.16-.215.32-.83.1.038-1.037.108-.293.108-.507.054-.615-.054-.108-.215-.162-.534-.32-.318-.16-1.883-.93-2.585-1.542-.544-.484-.913-1.08-1.02-1.296-.108-.216-.012-.332.096-.44.098-.097.215-.25.322-.375.108-.125.144-.216.216-.36.072-.144.036-.27-.018-.378-.054-.108-.507-1.224-.695-1.677-.184-.442-.365-.38-.507-.387-.13-.006-.278-.007-.427-.007-.148 0-.39.055-.594.275-.205.22-.78.762-.78 1.857s.796 2.15 1.0 2.428c.204.278 1.565 2.39 3.79 3.352.53.228.941.365 1.265.467.532.17 1.018.146 1.4.089.426-.062 1.883-.77 2.15-1.48.267-.71.267-1.317.188-1.43-.079-.114-.293-.162-.61-.322z"/>
          </svg>
          Contacter le vendeur sur WhatsApp
        </a>
      ` : ''}
    `;
  }

  setupEventListeners() {
    window.addEventListener('checkout:start', () => {
      this.open();
    });
  }

  attachDynamicListeners() {
    const shadow = this.shadowRoot;

    // Selectable payment method cards logic
    const cards = shadow.querySelectorAll('.payment-method-card');
    const payHidden = shadow.getElementById('payment-method');
    const dynamicFields = shadow.getElementById('dynamic-payment-fields');

    const updatePaymentDisplay = (val) => {
      cards.forEach(c => c.classList.remove('active'));
      const selectedCard = shadow.querySelector(`.payment-method-card[data-value="${val}"]`);
      if (selectedCard) {
        selectedCard.classList.add('active');
      }
      if (payHidden) {
        payHidden.value = val;
      }
      this.selectedPaymentMethod = val;
      sessionStorage.setItem('SWEETOS_checkout_payment_method', val);

      if (val === 'card') {
        dynamicFields.innerHTML = `
          <div class="card-details-panel animate-in" style="margin-top: 16px; padding: 20px; background: #ffffff; border-radius: 12px; border: 1.5px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.01); text-align: left;">
            <h4 style="font-size: 14px; font-weight: 800; color: #102a43; margin: 0 0 12px 0; display: flex; align-items: center; gap: 8px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#0052cc" stroke-width="2.5" style="vertical-align:middle;">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                <line x1="1" y1="10" x2="23" y2="10"></line>
              </svg>
              Détails de la carte de crédit
            </h4>
            <div class="form-group" style="margin-bottom: 12px;">
              <label for="cardNum" style="font-size: 11px; margin-bottom: 4px; display:block; text-align:left;">Numéro de carte</label>
              <input type="text" id="cardNum" placeholder="4242 4242 4242 4242" required autocomplete="cc-number" style="height: 40px; font-size: 13.5px; width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; box-sizing: border-box;">
            </div>
            <div class="form-row" style="grid-template-columns: 1fr 1fr; gap: 12px; display: grid;">
              <div class="form-group">
                <label for="cardExpiry" style="font-size: 11px; margin-bottom: 4px; display:block; text-align:left;">Expiration (MM/AA)</label>
                <input type="text" id="cardExpiry" placeholder="MM/AA" required autocomplete="cc-exp" style="height: 40px; font-size: 13.5px; width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; box-sizing: border-box;">
              </div>
              <div class="form-group">
                <label for="cardCvv" style="font-size: 11px; margin-bottom: 4px; display:block; text-align:left;">Code CVV</label>
                <input type="password" id="cardCvv" placeholder="123" maxlength="3" required autocomplete="cc-csc" style="height: 40px; font-size: 13.5px; width: 100%; border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 0 12px; box-sizing: border-box;">
              </div>
            </div>
          </div>
        `;
        const cardInput = shadow.getElementById('cardNum');
        const expInput = shadow.getElementById('cardExpiry');
        const cvvInput = shadow.getElementById('cardCvv');
        
        if (cardInput && expInput && cvvInput) {
          cardInput.addEventListener('input', (ev) => {
            let valStr = ev.target.value.replace(/\D/g, '');
            let formatted = valStr.replace(/(\d{4})/g, '$1 ').trim();
            ev.target.value = formatted.substring(0, 19);
          });
          expInput.addEventListener('input', (ev) => {
            let valStr = ev.target.value.replace(/\D/g, '');
            if (valStr.length >= 2) {
              valStr = valStr.substring(0, 2) + '/' + valStr.substring(2, 4);
            }
            ev.target.value = valStr.substring(0, 5);
          });
          cvvInput.addEventListener('input', (ev) => {
            ev.target.value = ev.target.value.replace(/\D/g, '');
          });
        }
      } else if (val === 'wave') {
        dynamicFields.innerHTML = `
          <div class="payment-notice-panel animate-in" style="margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 12px; border: 1.5px solid #bbf7d0; display: flex; gap: 12px; align-items: flex-start; text-align: left;">
            <span style="font-size: 20px;">🌊</span>
            <div>
              <h5 style="font-size: 13.5px; font-weight: 800; color: #166534; margin: 0 0 4px 0;">Paiement via Wave Mobile Money</h5>
              <p style="font-size: 12px; color: #166534; margin: 0; line-height: 1.4;">Un transfert Wave de <strong>${formatPrice(this.getOrderTotal())}</strong> devra être envoyé au numéro Wave du vendeur après validation de la commande.</p>
            </div>
          </div>
        `;
      } else if (val === 'orange') {
        dynamicFields.innerHTML = `
          <div class="payment-notice-panel animate-in" style="margin-top: 16px; padding: 16px; background: #fff7ed; border-radius: 12px; border: 1.5px solid #ffedd5; display: flex; gap: 12px; align-items: flex-start; text-align: left;">
            <span style="font-size: 20px;">🍊</span>
            <div>
              <h5 style="font-size: 13.5px; font-weight: 800; color: #7c2d12; margin: 0 0 4px 0;">Paiement via Orange Money</h5>
              <p style="font-size: 12px; color: #9a3412; margin: 0; line-height: 1.4;">Un transfert Orange Money de <strong>${formatPrice(this.getOrderTotal())}</strong> devra être effectué vers notre numéro Orange Money.</p>
            </div>
          </div>
        `;
      } else if (val === 'mtn') {
        dynamicFields.innerHTML = `
          <div class="payment-notice-panel animate-in" style="margin-top: 16px; padding: 16px; background: #fefce8; border-radius: 12px; border: 1.5px solid #fef08a; display: flex; gap: 12px; align-items: flex-start; text-align: left;">
            <span style="font-size: 20px;">💛</span>
            <div>
              <h5 style="font-size: 13.5px; font-weight: 800; color: #713f12; margin: 0 0 4px 0;">Paiement via MTN Mobile Money</h5>
              <p style="font-size: 12px; color: #854d0e; margin: 0; line-height: 1.4;">Un transfert MTN MoMo de <strong>${formatPrice(this.getOrderTotal())}</strong> devra être envoyé à notre numéro MoMo.</p>
            </div>
          </div>
        `;
      } else if (val === 'cod') {
        dynamicFields.innerHTML = `
          <div class="payment-notice-panel animate-in" style="margin-top: 16px; padding: 16px; background: #f0fdf4; border-radius: 12px; border: 1.5px solid #bbf7d0; display: flex; gap: 12px; align-items: flex-start; text-align: left;">
            <span style="font-size: 20px;">📦</span>
            <div>
              <h5 style="font-size: 13.5px; font-weight: 800; color: #14532d; margin: 0 0 4px 0;">Paiement à la livraison</h5>
              <p style="font-size: 12px; color: #166534; margin: 0; line-height: 1.4;">Vous paierez le total de <strong>${formatPrice(this.getOrderTotal())}</strong> en espèces directement au livreur lors de la remise.</p>
            </div>
          </div>
        `;
      }
    };

    cards.forEach(card => {
      card.addEventListener('click', () => {
        const val = card.getAttribute('data-value');
        updatePaymentDisplay(val);
      });
    });

    if (payHidden) {
      updatePaymentDisplay(payHidden.value || 'cod');
    }

    // Close button click
    const closeBtn = shadow.getElementById('close-btn-retour');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // Modal background overlay close
    const overlay = shadow.getElementById('overlay');
    if (overlay && this.step < 3) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close();
        }
      });
    }

    // Unified Form Submission
    const shippingForm = shadow.getElementById('shipping-form');
    if (shippingForm) {
      shippingForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.formData.name = shadow.getElementById('name').value;
        this.formData.email = shadow.getElementById('email').value;
        this.formData.phone = shadow.getElementById('phone').value;
        this.formData.address = shadow.getElementById('address').value;
        this.selectedPaymentMethod = shadow.getElementById('payment-method').value;
        
        const submitBtn = shadow.getElementById('checkout-submit-btn-french');
        if (submitBtn) {
          submitBtn.textContent = "Traitement...";
          submitBtn.disabled = true;
        }

        const orderId = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
        this.latestOrderId = orderId;

        const cartSaved = localStorage.getItem(getCartStorageKey());
        let itemsLabel = "Workspace Hardware";
        let orderTotal = 0;
        let cartItems = [];
        if (cartSaved) {
          try {
            cartItems = JSON.parse(cartSaved);
            if (cartItems.length > 0) {
              itemsLabel = cartItems.map(item => `${item.name} (x${item.quantity})`).join(', ');
              const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
              const shippingFee = this.getShippingFee(subtotal);
              
              let discount = 0;
              try {
                const savedCoupon = sessionStorage.getItem('SWEETOS_applied_coupon');
                if (savedCoupon) {
                  const applied = JSON.parse(savedCoupon);
                  if (!applied.minOrder || subtotal >= applied.minOrder) {
                    discount = applied.type === 'percentage' ? subtotal * (applied.value / 100) : applied.value;
                  }
                }
              } catch(e) {}
              
              orderTotal = subtotal + shippingFee - discount;
              this.latestOrderTotal = orderTotal;
            }
          } catch (err) {}
        }

        const profileKey = getProfileStorageKey();
        const profileSaved = localStorage.getItem(profileKey);
        let profile = null;
        if (profileSaved) {
          try {
            profile = JSON.parse(profileSaved);
          } catch (err) {}
        }
        if (!profile) {
          profile = {
            firstName: this.formData.name.split(' ')[0] || "",
            lastName: this.formData.name.split(' ').slice(1).join(' ') || "",
            email: this.formData.email || "",
            phone: this.formData.phone || "",
            bio: "Guest Customer",
            addresses: [this.formData.address || ""],
            orders: []
          };
        }

        const sanitizedProducts = cartItems.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image && item.image.startsWith('data:') ? (item.image.length > 200 ? item.image.substring(0, 100) : item.image) : (item.image || ''),
          category: item.category || '',
          sku: item.sku || ''
        }));

        const loggedInUserEmail = (() => {
          try {
            const u = JSON.parse(localStorage.getItem('SWEETOS_logged_in_user') || '{}');
            return u.email || '';
          } catch(e) { return ''; }
        })();

        const finalEmail = (this.formData.email || loggedInUserEmail || profile.email || '').trim().toLowerCase();

        const orderRecord = {
          id: orderId,
          date: new Date().toLocaleDateString('fr-FR', { month: 'short', day: 'numeric', year: 'numeric' }),
          status: "Placed",
          total: orderTotal || 0,
          items: itemsLabel,
          products: sanitizedProducts,
          customerName: (this.formData.name || `${profile.firstName || ''} ${profile.lastName || ''}`).trim() || "Client",
          customerEmail: finalEmail,
          customerPhone: (this.formData.phone || profile.phone || "").trim(),
          customerAddress: (this.formData.address || profile.address || "").trim(),
          customerZip: this.formData.zip || "",
          paymentMethod: this.selectedPaymentMethod || "cod",
          userProfileKey: profileKey
        };

        if (!profile.orders) profile.orders = [];
        profile.orders.unshift(orderRecord);
        localStorage.setItem(profileKey, JSON.stringify(profile));
        localStorage.setItem('SWEETOS_user_profile', JSON.stringify(profile));

        // Update local orders list immediately
        let localOrders = [];
        try {
          localOrders = JSON.parse(localStorage.getItem('SWEETOS_all_orders') || '[]');
        } catch(e) {}
        localOrders = localOrders.filter(o => o.id !== orderId);
        localOrders.unshift(orderRecord);
        localStorage.setItem('SWEETOS_all_orders', JSON.stringify(localOrders));
        window.dispatchEvent(new CustomEvent('orders:updated'));

        // Sync directly to user cloud profile (for cross-device sync via Supabase/local DB)
        if (finalEmail) {
          fetch('/api/user-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: finalEmail, type: 'orders', data: profile.orders })
          }).catch(() => {});
        }

        // Sync ALL orders to server (server merges and stores centrally for cross-device access)
        fetch('/api/orders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(localOrders)
        })
          .then(res => res.json())
          .then(data => {
            if (data.success) {
              console.log('Order registered on server.');
              // Broadcast custom alert to admin panel
              fetch('/api/broadcast-alert', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'orders',
                  message: `New Order ${orderId} placed by ${this.formData.name || 'Guest User'} (${formatPrice(orderTotal)})!`
                })
              }).catch(e => console.error('Failed to broadcast new order alert:', e));

              // Check for Owed Coupons to double!
              try {
                let owedList = JSON.parse(localStorage.getItem('SWEETOS_owed_coupons') || '[]');
                const email = this.formData.email || 'guest@sweetos.com';
                const owedIdx = owedList.findIndex(item => item.email === email && !item.resolved);
                
                if (owedIdx > -1 && orderTotal >= 5000) {
                  let coupons = JSON.parse(localStorage.getItem('SWEETOS_coupons') || '[]');
                  const owedVal = owedList[owedIdx].value;
                  
                  // Check if admin has created/stocked the original coupon value
                  const templateIndex = coupons.findIndex(c => 
                    c.status === 'active' && 
                    c.type === 'percentage' && 
                    c.value === owedVal &&
                    c.stock !== undefined &&
                    c.stock > 0
                  );
                  
                  if (templateIndex > -1) {
                    const template = coupons[templateIndex];
                    template.stock = Math.max(0, template.stock - 1);
                    if (template.stock === 0) {
                      template.status = 'expired';
                    }
                    
                    const doubleVal = owedVal * 2;
                    const doubleCode = `DOUBLE${doubleVal}-${Math.floor(1000 + Math.random() * 9000)}`;
                    
                    const doubleCoupon = {
                      code: doubleCode,
                      type: 'percentage',
                      value: doubleVal,
                      minOrder: 5000,
                      limit: 1,
                      used: 0,
                      expiry: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                      status: 'active'
                    };
                    
                    coupons.unshift(doubleCoupon);
                    localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
                    
                    fetch('/api/coupons', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(coupons)
                    }).catch(e => console.error('Failed to sync double coupon:', e));
                    
                    owedList[owedIdx].resolved = true;
                    owedList[owedIdx].resolvedDate = Date.now();
                    localStorage.setItem('SWEETOS_owed_coupons', JSON.stringify(owedList));
                    
                    // Award notification to customer
                    const notifKey = getNotificationsStorageKey();
                    let customerNotifs = [];
                    try {
                      customerNotifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
                    } catch(e) {}
                    
                    const now = Date.now();
                    customerNotifs.unshift({
                      id: now,
                      timestamp: now,
                      type: 'promo',
                      icon: '🎁',
                      title: `Coupon Doublé Reçu ! 🎉`,
                      desc: `En compensation de la rupture de stock précédente, vous avez reçu un coupon doublé de **${doubleVal}%** : **${doubleCode}** (valide pour tout achat dès 5000 CFA) !`,
                      time: 'Just now',
                      unread: true
                    });
                    localStorage.setItem(notifKey, JSON.stringify(customerNotifs));
                    window.dispatchEvent(new CustomEvent('notifications:updated'));
                    
                    // Send real email to customer inbox!
                    fetch('/api/send-notification-email', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        email: email,
                        title: 'Coupon Doublé Reçu ! 🎉',
                        desc: `En compensation de la rupture de stock précédente, vous avez reçu un coupon doublé de ${doubleVal}% : <strong>${doubleCode}</strong> (valide pour tout achat dès 5000 CFA) !`
                      })
                    }).catch(err => console.error('Failed to send double coupon notification email:', err));
                    
                    setTimeout(() => {
                      window.dispatchEvent(new CustomEvent('toast:show', { detail: `Compensation : Coupon doublé de ${doubleVal}% accordé ! Code : ${doubleCode} 🎁` }));
                    }, 2000);
                  }
                }
              } catch(e) {
                console.error('Owed coupon check error:', e);
              }
            }
          })
          .catch(err => console.error('Failed to register order on server:', err));

        // Mark applied coupon as used/expired
        try {
          const savedCoupon = sessionStorage.getItem('SWEETOS_applied_coupon');
          if (savedCoupon) {
            const applied = JSON.parse(savedCoupon);
            let coupons = JSON.parse(localStorage.getItem('SWEETOS_coupons') || '[]');
            const cIndex = coupons.findIndex(c => c.code.toUpperCase() === applied.code.toUpperCase());
            if (cIndex > -1) {
              coupons[cIndex].used = (coupons[cIndex].used || 0) + 1;
              coupons[cIndex].status = 'expired'; // mark as expired/inactive so it can only be used once
              localStorage.setItem('SWEETOS_coupons', JSON.stringify(coupons));
              
              // Sync updated coupons to server
              fetch('/api/coupons', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify(coupons)
              }).catch(e => console.error('Failed to sync coupons on use:', e));
            }
            sessionStorage.removeItem('SWEETOS_applied_coupon');
          }
        } catch(e) {
          console.error('Failed to update used coupon status:', e);
        }

        window.dispatchEvent(new CustomEvent('orders:updated'));

        const sessionId = sessionStorage.getItem('SWEETOS_session_id');
        if (sessionId) {
          try {
            const logs = JSON.parse(localStorage.getItem('SWEETOS_activity_logs') || '[]');
            const sess = logs.find(log => log.id === sessionId);
            if (sess) {
              sess.bought = true;
              localStorage.setItem('SWEETOS_activity_logs', JSON.stringify(logs));
            }
          } catch (err) {}
        }

        setTimeout(() => {
          this.step = 3;
          this.orderedItems = cartItems;
          sessionStorage.setItem('SWEETOS_checkout_step', '3');
          sessionStorage.setItem('SWEETOS_checkout_payment_method', this.selectedPaymentMethod);
          sessionStorage.setItem('SWEETOS_checkout_order_id', orderId);
          sessionStorage.setItem('SWEETOS_checkout_order_total', orderTotal.toString());
          
          const notifKey = getNotificationsStorageKey();
          const savedNotif = localStorage.getItem(notifKey);
          let currentNotifications = [];
          if (savedNotif) {
            try {
              currentNotifications = JSON.parse(savedNotif);
            } catch (e) {
              currentNotifications = [];
            }
          }
          
          const now = Date.now();
          const newNotif = {
            id: now,
            timestamp: now,
            type: 'shipping',
            icon: '📦',
            title: `Commande ${orderId} passée`,
            desc: `Merci ${this.formData.name || 'Cher client'} ! Votre commande ${orderId} d'un montant de ${formatPrice(orderTotal)} a été reçue et est en attente de confirmation.`,
            time: 'À l\'instant',
            unread: true
          };
          
          currentNotifications.unshift(newNotif);
          localStorage.setItem(notifKey, JSON.stringify(currentNotifications));
          window.dispatchEvent(new CustomEvent('notifications:updated'));

          window.dispatchEvent(new CustomEvent('toast:order-placed', {
            detail: {
              orderId: orderId,
              name: this.formData.name || 'Cher client',
              total: orderTotal
            }
          }));

          localStorage.removeItem(getCartStorageKey());
          window.dispatchEvent(new CustomEvent('cart:updated', { detail: [] }));
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Commande ${orderId} passée avec succès ! 📦` }));
          this.render();
          this.triggerConfetti();
        }, 1500);
      });
    }

    // Step 3: Success Screen Return Shop
    const returnShopBtn = shadow.getElementById('return-shop-btn');
    if (returnShopBtn) {
      returnShopBtn.addEventListener('click', () => {
        this.close();
      });
    }

    // View Orders button trigger
    const viewOrdersBtn = shadow.getElementById('success-view-orders-btn');
    if (viewOrdersBtn) {
      viewOrdersBtn.addEventListener('click', () => {
        this.close();
        window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'orders' } }));
      });
    }

    // WhatsApp Contact Button
    const waBtn = shadow.getElementById('wa-summary-btn');
    if (waBtn) {
      waBtn.addEventListener('click', () => {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Ouverture de WhatsApp pour finaliser avec le vendeur... 📱' }));
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

customElements.define('checkout-modal', CheckoutModal);
export default CheckoutModal;
