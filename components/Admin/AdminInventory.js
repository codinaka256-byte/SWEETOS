import { formatPrice } from '../../utils/storage.js';

export function renderAdminInventory(context) {
  let list = [...context.products];
  if (context.searchQuery) {
    const q = context.searchQuery.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
  }
  if (context.stockFilter !== 'All') {
    if (context.stockFilter === 'Low Stock') {
      list = list.filter(p => p.stock !== undefined && p.stock <= (p.threshold || 5) && p.stock > 0);
    } else if (context.stockFilter === 'Out of Stock') {
      list = list.filter(p => p.stock === 0);
    }
  }

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / context.itemsPerPage) || 1;
  const startIndex = (context.currentPageIndex - 1) * context.itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + context.itemsPerPage);

  // Summary Metrics calculations
  const skuCount = context.products.length;
  const totalStockUnits = context.products.reduce((sum, p) => sum + (p.stock !== undefined ? p.stock : 0), 0);
  const lowStockCount = context.products.filter(p => p.stock !== undefined && p.stock <= (p.threshold || 5) && p.stock > 0).length;
  const outOfStockCount = context.products.filter(p => p.stock === 0).length;

  return `
    <style>
      .in-stock-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10.5px;
        font-weight: 800;
        color: #36b37e;
        background: rgba(54, 179, 126, 0.08);
        border: 1.5px solid rgba(54, 179, 126, 0.15);
        padding: 5px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .low-stock-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10.5px;
        font-weight: 800;
        color: #ffab00;
        background: rgba(255, 171, 0, 0.08);
        border: 1.5px solid rgba(255, 171, 0, 0.15);
        padding: 5px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .out-of-stock-badge {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 10.5px;
        font-weight: 800;
        color: #ff5630;
        background: rgba(255, 86, 48, 0.08);
        border: 1.5px solid rgba(255, 86, 48, 0.15);
        padding: 5px 12px;
        border-radius: 20px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .qty-adjuster {
        display: flex;
        align-items: center;
        gap: 10px;
      }
      .qty-adjust-btn {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        color: #94a3b8;
        font-size: 16px;
        font-weight: 800;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: all 0.2s;
        outline: none;
      }
      .qty-adjust-btn:hover {
        background: rgba(255,255,255,0.08);
        color: #ffffff;
        border-color: rgba(255,255,255,0.15);
      }
      .qty-val {
        font-size: 13.5px;
        font-weight: 800;
        color: #ffffff;
        width: 24px;
        text-align: center;
      }
      .margin-badge {
        display: inline-block;
        font-size: 10.5px;
        font-weight: 800;
        color: #36b37e;
        background: rgba(54, 179, 126, 0.08);
        padding: 3px 8px;
        border-radius: 4px;
        margin-bottom: 4px;
      }
      .profit-text {
        font-size: 9.5px;
        font-weight: 750;
        color: #64748b;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .quick-edit-btn {
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.08);
        color: #94a3b8;
        padding: 6px 14px;
        border-radius: 8px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
        transition: all 0.2s;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .quick-edit-btn:hover {
        background: rgba(255,255,255,0.08);
        color: #ffffff;
      }
      .stock-filter-pill-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.04) !important;
      }
    </style>

    <!-- Inventory Metrics Cards Grid -->
    <div class="inventory-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Card 1: Unique Catalog SKUs -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">📋</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Catalog SKUs</span>
          <strong style="font-size: 24px; font-weight: 850; color: var(--text-dark);">${skuCount} unique</strong>
        </div>
      </div>

      <!-- Card 2: Total Units Available -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(54, 179, 126, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #36b37e;">🪵</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Inventory Units</span>
          <strong style="font-size: 24px; font-weight: 850; color: #36b37e;">${totalStockUnits} items</strong>
        </div>
      </div>

      <!-- Card 3: Low Stock Warnings -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(255, 171, 0, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ffab00;">⚠️</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Low Stock Alerts</span>
          <strong style="font-size: 24px; font-weight: 850; color: #ffab00;">${lowStockCount} items</strong>
        </div>
      </div>

      <!-- Card 4: Out of Stock -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(255, 86, 48, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ff5630;">🚫</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Out of Stock</span>
          <strong style="font-size: 24px; font-weight: 850; color: #ff5630;">${outOfStockCount} items</strong>
        </div>
      </div>
    </div>

    <!-- Quick Level Filters Pill Tabs Row -->
    <div class="status-tabs-row" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
      ${['All', 'Low Stock', 'Out of Stock'].map(lvl => {
        const isActive = context.stockFilter === lvl;
        let count = 0;
        if (lvl === 'All') count = context.products.length;
        else if (lvl === 'Low Stock') count = lowStockCount;
        else if (lvl === 'Out of Stock') count = outOfStockCount;

        let pillColor = 'var(--text-dark)';
        let pillBackground = 'rgba(255,255,255,0.7)';
        let pillBorder = 'var(--border)';

        if (isActive) {
          pillBackground = 'var(--primary)';
          pillColor = 'white';
          pillBorder = 'var(--primary)';
        }

        return `
          <button class="stock-filter-pill-btn" data-level="${lvl}" style="
            background: ${pillBackground};
            color: ${pillColor};
            border: 1.5px solid ${pillBorder};
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 13px;
            font-weight: 750;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
            box-shadow: 0 2px 6px rgba(0,0,0,0.02);
          ">
            <span>${lvl === 'All' ? 'All Inventory' : lvl}</span>
            <span style="
              background: ${isActive ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.06)'};
              color: ${isActive ? 'white' : 'var(--primary)'};
              font-size: 11px;
              padding: 2px 8px;
              border-radius: 12px;
              font-weight: 800;
            ">${count}</span>
          </button>
        `;
      }).join('')}
    </div>

    <div class="admin-table-filters-bar" style="margin-bottom: 20px;">
      <div class="search-box">
        <input type="text" id="inventory-search" placeholder="Search SKU, product name..." value="${context.searchQuery}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
    </div>

    <div class="inventory-dashboard-grid">
      
      <!-- Interactive Custom Rows Inventory Table -->
      <div class="admin-table-panel glass-panel" style="flex: 2;">
        <div class="table-wrapper">
          <table class="inventory-table">
            <thead>
              <tr>
                <th>Product Info</th>
                <th>Stock Status</th>
                <th>Stock Units</th>
                <th>Cost Price</th>
                <th>Sale Price</th>
                <th>Margin & Profit</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${paginatedList.length === 0 ? `
                <tr>
                  <td colspan="7" class="text-center py-6 text-slate-400">No stock levels found matching the filters.</td>
                </tr>
              ` : paginatedList.map(p => {
                const stock = p.stock !== undefined ? p.stock : 0;
                const cost = p.costPrice || 0;
                const price = p.price || 0;
                const profit = price - cost;
                const margin = price > 0 ? Math.round((profit / price) * 100) : 100;

                const isLow = stock <= (p.threshold || 5) && stock > 0;
                const isOut = stock === 0;

                let badgeClass = 'in-stock-badge';
                let badgeText = 'IN STOCK';
                if (isOut) {
                  badgeClass = 'out-of-stock-badge';
                  badgeText = 'OUT OF STOCK';
                } else if (isLow) {
                  badgeClass = 'low-stock-badge';
                  badgeText = 'LOW STOCK';
                }

                return `
                  <tr>
                    <td>
                      <div style="display: flex; align-items: center; gap: 14px;">
                        <img src="${p.image || 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=200&auto=format&fit=crop'}" alt="${p.name}" style="width: 44px; height: 44px; border-radius: 8px; object-fit: cover; border: 1px solid rgba(255,255,255,0.06);">
                        <div style="display: flex; flex-direction: column; gap: 4px;">
                          <span style="font-weight: 750; color: #ffffff; font-size: 13.5px;">${p.name}</span>
                          <span style="font-size: 10px; font-weight: 750; color: #64748b; text-transform: uppercase; letter-spacing: 0.3px;">
                            ${(p.category || 'GENERAL').toUpperCase()} | SKU: ${p.sku || `SKU-${p.id}`}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span class="${badgeClass}">
                        ${badgeText}
                      </span>
                    </td>
                    <td>
                      <div class="qty-adjuster">
                        <button class="qty-adjust-btn qty-decrement-btn" data-product-id="${p.id}">−</button>
                        <span class="qty-val">${stock}</span>
                        <button class="qty-adjust-btn qty-increment-btn" data-product-id="${p.id}">+</button>
                      </div>
                    </td>
                    <td>
                      <span style="font-size: 13.5px; font-weight: 600; opacity: 0.7;">${cost.toLocaleString()}</span>
                    </td>
                    <td>
                      <strong style="font-size: 13.5px; font-weight: 800; color: #ffffff;">${price.toLocaleString()}</strong>
                    </td>
                    <td>
                      <div style="display: flex; flex-direction: column; align-items: flex-start;">
                        <span class="margin-badge">${margin}% Margin</span>
                        <span class="profit-text">Profit: ${Math.round(profit * stock).toLocaleString()} FCFA</span>
                      </div>
                    </td>
                    <td>
                      <div style="display: flex; justify-content: flex-end;">
                        <button class="quick-edit-btn" data-product-id="${p.id}">Quick Edit</button>
                      </div>
                    </td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="pagination-footer">
          <span class="pagination-info">Showing ${startIndex + 1} to ${Math.min(startIndex + context.itemsPerPage, totalItems)} of ${totalItems} listings</span>
          <div class="pagination-buttons">
            <button class="pag-btn" id="prev-inv-page" ${context.currentPageIndex === 1 ? 'disabled' : ''}>Previous</button>
            <span class="page-num">${context.currentPageIndex} / ${totalPages}</span>
            <button class="pag-btn" id="next-inv-page" ${context.currentPageIndex === totalPages ? 'disabled' : ''}>Next</button>
          </div>
        </div>
      </div>

      <!-- Inventory Log History -->
      <div class="glass-panel" style="flex: 1; min-width: 300px;">
        <h3 class="mb-3" style="font-weight:850; font-size:16px; color:var(--text-dark); margin-bottom:12px;">Stock Adjustment History</h3>
        <div class="history-logs-trail custom-scroll" style="max-height: 480px; overflow-y:auto; display:flex; flex-direction:column; gap:10px; padding-right:4px;">
          ${context.inventoryLogs.map(l => {
            const isRestock = l.quantity >= 0;
            return `
              <div class="history-log-item" style="padding: 12px; background: rgba(255,255,255,0.03); border: 1px solid var(--border); border-radius:12px; font-size:12.5px; line-height:1.4;">
                <div class="log-top flex justify-between" style="display:flex; justify-content:space-between; margin-bottom:6px;">
                  <code style="font-weight:700; color:var(--primary)">${l.sku}</code>
                  <small style="color:var(--text-light); font-weight:600;">${l.date}</small>
                </div>
                <div class="log-body">
                  <span>Action: <strong>${l.action}</strong></span>
                  <p style="margin:6px 0 0 0; font-weight: 750; color: ${isRestock ? '#36b37e' : '#ff5630'};">
                    ${isRestock ? '+' : ''}${l.quantity} units adjustment
                  </p>
                  <p style="color:var(--text-light); margin:6px 0 0 0; font-size:11px; font-weight:600;">Operator: ${l.user}</p>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

    </div>

    <!-- INLINE STOCK ADJUST MODAL -->
    <div class="modal-backdrop ${context.showStockModal ? 'show' : ''}" id="stock-adjust-modal" style="z-index:1100;">
      <div class="modal-wrapper product-form-dark-wrapper glass-panel animate-in" style="max-width:400px; background: var(--white); box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid var(--border); padding: 0;">
        <div class="modal-header" style="padding: 20px 24px; border-bottom: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin:0; font-size:16px; font-weight: 850; color: var(--text-dark);">Quick Stock Adjustment</h3>
          <button class="modal-close-btn" id="close-stock-modal-btn" style="background:none; border:none; font-size:24px; cursor:pointer; color:var(--text-light);">&times;</button>
        </div>
        <div class="modal-body" style="padding: 24px;">
          ${context.stockProduct ? `
            <h4 style="margin:0 0 4px 0; font-weight:850; color:var(--text-dark);">${context.stockProduct.name}</h4>
            <p style="color:var(--text-light); font-size:12.5px; margin: 0 0 20px 0; font-weight:600;">SKU Code: <code>${context.stockProduct.sku}</code></p>
            
            <form id="stock-adjust-form" style="display:flex; flex-direction:column; gap:16px;">
              <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:12.5px; font-weight:750; color:var(--text-dark);">Current Stock Units Available</label>
                <input type="number" id="stock-adjust-qty" required class="admin-input" value="${context.stockProduct.stock !== undefined ? context.stockProduct.stock : 0}" min="0" style="padding: 10px 14px; border-radius: 8px;">
              </div>
              <div class="form-group" style="display:flex; flex-direction:column; gap:6px;">
                <label style="font-size:12.5px; font-weight:750; color:var(--text-dark);">Adjustment Threshold Alert Level</label>
                <input type="number" id="stock-adjust-thresh" required class="admin-input" value="${context.stockProduct.threshold || 5}" min="1" style="padding: 10px 14px; border-radius: 8px;">
              </div>
              
              <button type="submit" class="admin-btn admin-btn-primary" style="padding:12px; font-weight:700; margin-top:8px;">Update Stock Units</button>
            </form>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

export function attachAdminInventoryListeners(context, shadow) {
  // Search input
  const search = shadow.getElementById('inventory-search');
  if (search) {
    search.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
      
      const iS = shadow.getElementById('inventory-search');
      if (iS) {
        iS.focus();
        iS.setSelectionRange(iS.value.length, iS.value.length);
      }
    });
  }

  // Stock filter tab pills
  shadow.querySelectorAll('.stock-filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      context.stockFilter = btn.getAttribute('data-level');
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
    });
  });

  // Quantity adjust decrement listener
  shadow.querySelectorAll('.qty-decrement-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const p = context.products.find(item => item.id === id);
      if (p && (p.stock || 0) > 0) {
        p.stock = (p.stock || 0) - 1;
        context.saveDatabase('products');

        context.inventoryLogs.unshift({
          id: Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0,16),
          sku: p.sku || `SKU-${p.id}`,
          action: "Quick stock decrement (−1)",
          quantity: -1,
          user: "admin@sweetos.com"
        });
        context.saveDatabase('inventory');

        context.render();
        context.attachListeners();
      }
    });
  });

  // Quantity adjust increment listener
  shadow.querySelectorAll('.qty-increment-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const p = context.products.find(item => item.id === id);
      if (p) {
        p.stock = (p.stock || 0) + 1;
        context.saveDatabase('products');

        context.inventoryLogs.unshift({
          id: Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0,16),
          sku: p.sku || `SKU-${p.id}`,
          action: "Quick stock increment (+1)",
          quantity: 1,
          user: "admin@sweetos.com"
        });
        context.saveDatabase('inventory');

        context.render();
        context.attachListeners();
      }
    });
  });

  // Quick Edit button triggers the threshold / stock adjustment modal
  shadow.querySelectorAll('.quick-edit-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const p = context.products.find(item => item.id === id);
      if (p) {
        context.stockProduct = p;
        context.showStockModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Inline adjust stock btn triggers
  shadow.querySelectorAll('.inline-adjust-stock-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const p = context.products.find(item => item.id === id);
      if (p) {
        context.stockProduct = p;
        context.showStockModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Close Stock modal
  const closeBtn = shadow.getElementById('close-stock-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      context.showStockModal = false;
      context.render();
      context.attachListeners();
    });
  }

  // Handle stock adjustments form submit
  const adjustForm = shadow.getElementById('stock-adjust-form');
  if (adjustForm) {
    adjustForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const nextQty = parseInt(shadow.getElementById('stock-adjust-qty').value);
      const nextThresh = parseInt(shadow.getElementById('stock-adjust-thresh').value);

      if (nextQty < 0) {
        window.showAlert('Stock quantity cannot be less than zero. Please enter a valid non-negative number.', 'Invalid Quantity');
        return;
      }

      const p = context.products.find(item => item.id === context.stockProduct.id);
      if (p) {
        const diff = nextQty - (p.stock || 0);
        p.stock = nextQty;
        p.threshold = nextThresh;
        context.saveDatabase('products');

        context.inventoryLogs.unshift({
          id: Date.now(),
          date: new Date().toISOString().replace('T', ' ').slice(0,16),
          sku: p.sku || `SKU-${p.id}`,
          action: diff >= 0 ? "Manual stock Restock" : "Manual stock Write-down",
          quantity: diff,
          user: "admin@sweetos.com"
        });
        context.saveDatabase('inventory');

        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Stock units adjusted for: ${p.sku}` }));
      }

      context.showStockModal = false;
      context.stockProduct = null;
      context.render();
      context.attachListeners();
    });
  }

  // Pagination buttons
  const prev = shadow.getElementById('prev-inv-page');
  if (prev) {
    prev.addEventListener('click', () => {
      if (context.currentPageIndex > 1) {
        context.currentPageIndex--;
        context.render();
        context.attachListeners();
      }
    });
  }
  const next = shadow.getElementById('next-inv-page');
  if (next) {
    next.addEventListener('click', () => {
      const list = context.products.filter(p => {
        if (context.searchQuery) {
          const q = context.searchQuery.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
        }
        if (context.stockFilter !== 'All') {
          if (context.stockFilter === 'Low Stock' && (p.stock === undefined || p.stock > (p.threshold || 5) || p.stock === 0)) return false;
          if (context.stockFilter === 'Out of Stock' && p.stock !== 0) return false;
        }
        return true;
      });
      const totalPages = Math.ceil(list.length / context.itemsPerPage) || 1;
      if (context.currentPageIndex < totalPages) {
        context.currentPageIndex++;
        context.render();
        context.attachListeners();
      }
    });
  }
}
