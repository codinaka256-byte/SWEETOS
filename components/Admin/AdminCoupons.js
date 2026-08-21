import { formatPrice } from '../../utils/storage.js';

export function renderAdminCoupons(context) {
  context.couponValueFilter = context.couponValueFilter || 'All';
  let list = [...context.coupons];
  if (context.searchQuery) {
    const q = context.searchQuery.toLowerCase();
    list = list.filter(c => c.code.toLowerCase().includes(q));
  }
  
  const originalList = [...list];
  if (context.couponValueFilter !== 'All') {
    const targetVal = parseInt(context.couponValueFilter);
    list = list.filter(c => c.type === 'percentage' && c.value === targetVal);
  }

  return `
    <div class="admin-table-filters-bar" style="margin-bottom: 16px;">
      <div class="search-box">
        <input type="text" id="coupon-search" placeholder="Search coupon code..." value="${context.searchQuery}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
      
      <button class="admin-btn admin-btn-primary" id="add-coupon-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; flex-shrink: 0;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Coupon</span>
      </button>
    </div>

    <!-- Category sub-tabs to view different coupon groups (5%, 10%, 20%, 30%) -->
    <div class="coupon-category-tabs-row" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
      ${['All', '5%', '10%', '20%', '30%'].map(filterVal => {
        const isActive = context.couponValueFilter === filterVal;
        return `
          <button class="coupon-filter-pill-btn" data-filter="${filterVal}" style="
            background: ${isActive ? 'var(--primary)' : 'rgba(255, 255, 255, 0.4)'};
            color: ${isActive ? 'white' : 'var(--text-dark)'};
            border: 1.5px solid ${isActive ? 'var(--primary)' : 'var(--border)'};
            padding: 8px 16px;
            border-radius: 10px;
            font-size: 13px;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: ${isActive ? '0 4px 12px var(--primary-light)' : 'none'};
          ">
            <span>${filterVal === 'All' ? 'All Coupons' : filterVal + ' Off'}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div class="admin-table-panel glass-panel mt-4">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Coupon Code</th>
              <th>Discount Type</th>
              <th>Discount Value</th>
              <th>Min. Order Requirement</th>
              <th>Usage limits</th>
              <th>Stock Remaining</th>
              <th>Expiration</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${list.length === 0 ? `
              <tr>
                <td colspan="9" class="text-center py-6 text-slate-400">No coupons registered yet.</td>
              </tr>
            ` : list.map(c => `
              <tr>
                <td><code style="font-weight:800; font-size:14px; color:var(--primary);">${c.code}</code></td>
                <td><span style="text-transform: capitalize;">${c.type}</span></td>
                <td><strong>${c.type === 'percentage' ? `${c.value}% Off` : formatPrice(c.value)}</strong></td>
                <td><span>${formatPrice(c.minOrder || 0)}</span></td>
                <td><span>${c.used || 0} / ${c.limit || '∞'} uses</span></td>
                <td>
                  <strong style="color: ${c.stock !== undefined && c.stock <= 2 ? 'var(--red)' : 'var(--primary)'};">
                    ${c.stock !== undefined ? `${c.stock} left` : '∞'}
                  </strong>
                </td>
                <td><span>${c.expiry}</span></td>
                <td>
                  <span class="status-badge status-${c.status === 'active' ? 'green' : 'yellow'}">
                    ${c.status}
                  </span>
                </td>
                <td>
                  <div class="row-actions">
                    <button class="share-coupon-whatsapp-btn" data-coupon-code="${c.code}" data-coupon-type="${c.type}" data-coupon-value="${c.value}" data-coupon-min="${c.minOrder || 0}" data-coupon-expiry="${c.expiry}" style="background: rgba(37, 211, 102, 0.1); border-color: rgba(37, 211, 102, 0.2); color: #25d366;" title="Share to WhatsApp">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" style="width: 14px; height: 14px; flex-shrink: 0;"><path d="M17.472 14.382c-.022-.08-.124-.184-.282-.232-.078-.024-.464-.232-.536-.252-.072-.02-.124-.03-.178.05-.054.082-.21.26-.258.312-.048.052-.096.06-.178.02a1.866 1.866 0 0 1-.502-.308c-.287-.25-.482-.56-.538-.65-.056-.092-.006-.142.04-.188.04-.04.096-.11.144-.168.048-.058.064-.1.096-.168.032-.068.016-.128-.008-.178-.024-.05-.178-.436-.244-.594-.064-.158-.13-.136-.178-.138-.046-.002-.098-.002-.15-.002a.287.287 0 0 0-.208.098c-.072.078-.276.27-.276.658 0 .388.282.764.32.816.04.052.556.85 1.348 1.192.188.082.336.13.45.166.19.06.362.052.498.032.152-.022.464-.19.53-.374.066-.184.066-.342.046-.374-.022-.03-.078-.05-.156-.088zm-5.467 1.162a6.3 6.3 0 0 1-3.237-.893l-.233-.14-2.404.63 2.443-2.38-.152-.243a6.262 6.262 0 0 1-.958-3.326c0-3.468 2.82-6.29 6.29-6.29 3.47 0 6.29 2.822 6.29 6.29 0 3.47-2.82 6.29-6.29 6.29zm0-13.82c-4.148 0-7.527 3.38-7.527 7.527 0 1.326.347 2.62 1.006 3.766L4 19.5l4.636-1.216a7.487 7.487 0 0 0 3.37.804c4.148 0 7.527-3.378 7.527-7.527 0-4.15-3.38-7.527-7.527-7.527z"/></svg>
                    </button>
                    <button class="edit-coupon-action-btn" data-coupon-code="${c.code}">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
                    </button>
                    <button class="delete-coupon-action-btn" data-coupon-code="${c.code}">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- COUPON CRUD MODAL -->
    <div class="modal-backdrop ${context.showCouponModal ? 'show' : ''}" id="coupon-crud-modal-backdrop">
      <div class="modal-wrapper glass-panel">
        <div class="modal-header">
          <h3>${context.editingCoupon ? 'Edit Marketing Coupon' : 'Add New Marketing Coupon'}</h3>
          <button class="modal-close-btn" id="close-coupon-modal-btn">×</button>
        </div>
        <div class="modal-body">
          <form id="coupon-crud-form" style="display:flex; flex-direction:column; gap:12px;">
            <div class="form-group">
              <label>Coupon Code (Unique, uppercase)</label>
              <div style="display:flex; gap:8px;">
                <input type="text" id="coup-code" required class="admin-input" placeholder="e.g. PROMO25" autocomplete="off" style="flex:1;">
                <button type="button" id="auto-gen-coupon-btn" class="admin-btn admin-btn-secondary" style="margin:0; font-size:12px; font-weight:800; padding:10px 14px; white-space:nowrap;">Générer / Auto Gen</button>
              </div>
            </div>
            <div class="form-group">
              <label>Discount Type</label>
              <select id="coup-type" class="admin-input">
                <option value="percentage" selected>Percentage Off (%)</option>
                <option value="fixed">Fixed Amount Off (CFA)</option>
              </select>
            </div>
            <div class="form-group">
              <label>Discount Value</label>
              <input type="number" id="coup-val" required class="admin-input" min="1" placeholder="10">
            </div>
            <div class="form-group">
              <label>Min. Order Requirement (CFA)</label>
              <input type="number" id="coup-min" class="admin-input" value="0">
            </div>
            <div class="form-group">
              <label>Usage limits per customer</label>
              <input type="number" id="coup-limit" class="admin-input" value="1">
            </div>
            <div class="form-group">
              <label>Coupon Stock / Available Quantity</label>
              <input type="number" id="coup-stock" required class="admin-input" value="10">
            </div>
            <div class="form-group">
              <label>Valid date expiry (YYYY-MM-DD)</label>
              <input type="date" id="coup-expiry" required class="admin-input" value="2026-12-31">
            </div>

            <div id="coup-error-msg" class="error-text"></div>
            <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Marketing Coupon</button>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function attachAdminCouponsListeners(context, shadow) {
  // Pill Filters Listeners
  shadow.querySelectorAll('.coupon-filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      context.couponValueFilter = btn.getAttribute('data-filter');
      context.render();
      context.attachListeners();
    });
  });

  // Auto Gen Coupon Code button listener
  const autoGenBtn = shadow.getElementById('auto-gen-coupon-btn');
  if (autoGenBtn) {
    autoGenBtn.addEventListener('click', () => {
      const codeInput = shadow.getElementById('coup-code');
      if (codeInput) {
        const randomCode = 'SWEET-' + Math.floor(100000 + Math.random() * 900000);
        codeInput.value = randomCode;
      }
    });
  }

  // Add Coupon open modal btn
  const addBtn = shadow.getElementById('add-coupon-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      context.editingCoupon = null;
      context.showCouponModal = true;
      context.render();
      context.attachListeners();
    });
  }

  // Edit action
  shadow.querySelectorAll('.edit-coupon-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const code = btn.getAttribute('data-coupon-code');
      const coup = context.coupons.find(c => c.code === code);
      if (coup) {
        context.editingCoupon = coup;
        context.showCouponModal = true;
        context.render();
        context.attachListeners();
        
        shadow.getElementById('coup-code').value = coup.code;
        shadow.getElementById('coup-type').value = coup.type;
        shadow.getElementById('coup-val').value = coup.value;
        shadow.getElementById('coup-min').value = coup.minOrder || 0;
        shadow.getElementById('coup-limit').value = coup.limit !== undefined ? coup.limit : 1;
        shadow.getElementById('coup-stock').value = coup.stock !== undefined ? coup.stock : 10;
        shadow.getElementById('coup-expiry').value = coup.expiry;
      }
    });
  });


  // WhatsApp Share action
  shadow.querySelectorAll('.share-coupon-whatsapp-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const code = btn.getAttribute('data-coupon-code');
      const type = btn.getAttribute('data-coupon-type');
      const val = btn.getAttribute('data-coupon-value');
      const min = btn.getAttribute('data-coupon-min');
      const expiry = btn.getAttribute('data-coupon-expiry');

      const discountText = type === 'percentage' ? `${val}% OFF` : `${val} FCFA OFF`;
      
      const message = `🌟 OFFRE SPÉCIALE SWEETOS ! 🌟\nProfitez d'une réduction exclusive sur notre boutique en ligne !\n\nCode Promo : *${code}*\nRéduction : *${discountText}*\n${parseInt(min) > 0 ? `Minimum d'achat : *${min} FCFA*\n` : ''}Date d'expiration : *${expiry}*\n\nFaites vos achats ici : ${window.location.origin}`;
      
      // Detect mobile vs desktop for optimal WhatsApp experience
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      // Open WhatsApp directly with pre-filled message
      const whatsappUrl = isMobile
        ? `https://wa.me/?text=${encodeURIComponent(message)}`
        : `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;

      window.open(whatsappUrl, '_blank');
    });
  });

  // Delete action
  shadow.querySelectorAll('.delete-coupon-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const code = btn.getAttribute('data-coupon-code');
      const index = context.coupons.findIndex(c => c.code === code);
      if (index > -1) {
        const confirmed = await window.showConfirm(`Are you sure you want to delete coupon code ${code}?`, 'Delete Coupon');
        if (confirmed) {
          context.coupons.splice(index, 1);
          context.saveDatabase('coupons');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Coupon ${code} deleted.` }));
          context.render();
          context.attachListeners();
        }
      }
    });
  });

  // Close Coupon Modal btn
  const closeBtn = shadow.getElementById('close-coupon-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      context.showCouponModal = false;
      context.render();
      context.attachListeners();
    });
  }

  // Search input
  const search = shadow.getElementById('coupon-search');
  if (search) {
    search.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
      const cS = shadow.getElementById('coupon-search');
      if (cS) {
        cS.focus();
        cS.setSelectionRange(cS.value.length, cS.value.length);
      }
    });
  }

  // Coupon form submit handler
  const coupForm = shadow.getElementById('coupon-crud-form');
  if (coupForm) {
    coupForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const code = shadow.getElementById('coup-code').value.trim().toUpperCase();
      const type = shadow.getElementById('coup-type').value;
      const value = parseFloat(shadow.getElementById('coup-val').value);
      const minOrder = parseFloat(shadow.getElementById('coup-min').value) || 0;
      const limit = parseInt(shadow.getElementById('coup-limit').value) || 1;
      const stock = parseInt(shadow.getElementById('coup-stock').value) || 10;
      const expiry = shadow.getElementById('coup-expiry').value;
      const errorMsg = shadow.getElementById('coup-error-msg');

      const duplicate = context.coupons.some(c => c.code === code && (!context.editingCoupon || c.code !== context.editingCoupon.code));
      if (duplicate) {
        errorMsg.textContent = 'Error: Coupon code must be unique!';
        return;
      }

      if (context.editingCoupon) {
        const c = context.coupons.find(item => item.code === context.editingCoupon.code);
        if (c) {
          c.code = code;
          c.type = type;
          c.value = value;
          c.minOrder = minOrder;
          c.limit = limit;
          c.stock = stock;
          c.expiry = expiry;
          context.saveDatabase('coupons');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Coupon ${code} updated.` }));
        }
      } else {
        context.coupons.unshift({
          code, type, value, minOrder, limit, stock, used: 0, expiry, status: "active"
        });
        context.saveDatabase('coupons');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Coupon ${code} created successfully!` }));
      }

      context.showCouponModal = false;
      context.editingCoupon = null;
      context.render();
      context.attachListeners();
    });
  }
}
