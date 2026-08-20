import { formatPrice } from '../../utils/storage.js';

export function renderAdminOrders(context) {
  if (context.selectedOrderId) {
    return renderAdminOrderDetails(context);
  }

  let list = [...context.orders];
  if (context.searchQuery) {
    const q = context.searchQuery.toLowerCase();
    list = list.filter(o => o.id.toLowerCase().includes(q) || o.customerName.toLowerCase().includes(q));
  }
  if (context.statusFilter !== 'All') {
    list = list.filter(o => o.status === context.statusFilter);
  }

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / context.itemsPerPage) || 1;
  const startIndex = (context.currentPageIndex - 1) * context.itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + context.itemsPerPage);

  // Summary Metrics calculations
  const totalCount = context.orders.length;
  const pendingCount = context.orders.filter(o => o.status === 'Pending').length;
  const activeCount = context.orders.filter(o => o.status === 'Confirmé' || o.status === 'En cours' || o.status === 'Shipped').length;
  const completedCount = context.orders.filter(o => o.status === 'Livré').length;

  return `
    <style>
      @keyframes pulse-yellow {
        0% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 171, 0, 0.8); }
        70% { transform: scale(1.1); box-shadow: 0 0 0 6px rgba(255, 171, 0, 0); }
        100% { transform: scale(0.9); box-shadow: 0 0 0 0 rgba(255, 171, 0, 0); }
      }
      .pulse-indicator {
        display: inline-block;
        width: 8px;
        height: 8px;
        background: #ffab00;
        border-radius: 50%;
        animation: pulse-yellow 1.8s infinite;
      }
      .status-filter-pill-btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 4px 10px rgba(0,0,0,0.04) !important;
      }
      .status-filter-pill-btn:active {
        transform: translateY(0);
      }
    </style>

    <!-- Orders Metrics Cards Grid -->
    <div class="orders-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Card 1: Total Orders -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">📦</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Orders</span>
          <strong style="font-size: 24px; font-weight: 850; color: var(--text-dark);">${totalCount}</strong>
        </div>
      </div>

      <!-- Card 2: Pending (Needs Confirmation) -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(255, 171, 0, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ffab00;">⏳</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Pending Confirmation</span>
          <strong style="font-size: 24px; font-weight: 850; color: #ffab00;">${pendingCount}</strong>
        </div>
      </div>

      <!-- Card 3: Confirmed / Active -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">⚙️</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Confirmed & Active</span>
          <strong style="font-size: 24px; font-weight: 850; color: var(--primary);">${activeCount}</strong>
        </div>
      </div>

      <!-- Card 4: Delivered / Completed -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(54, 179, 126, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #36b37e;">✅</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Delivered / Done</span>
          <strong style="font-size: 24px; font-weight: 850; color: #36b37e;">${completedCount}</strong>
        </div>
      </div>
    </div>

    <!-- Quick Status Filters Pill Tabs Row -->
    <div class="status-tabs-row" style="display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 20px;">
      ${['All', 'Pending', 'Confirmé', 'En cours', 'Shipped', 'Livré', 'Cancelled'].map(status => {
        const isActive = context.statusFilter === status;
        const count = status === 'All' ? context.orders.length : context.orders.filter(o => o.status === status).length;
        
        let pillColor = 'var(--text-dark)';
        let pillBackground = 'rgba(255,255,255,0.7)';
        let pillBorder = 'var(--border)';
        
        if (isActive) {
          pillBackground = 'var(--primary)';
          pillColor = 'white';
          pillBorder = 'var(--primary)';
        }

        return `
          <button class="status-filter-pill-btn" data-status="${status}" style="
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
            <span>${status === 'All' ? 'All Orders' : status}</span>
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
        <input type="text" id="order-search" placeholder="Search by order ID, customer name..." value="${context.searchQuery}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
    </div>

    <div class="admin-table-panel glass-panel">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Date</th>
              <th>Customer</th>
              <th>Items Summary</th>
              <th>Total</th>
              <th>Fulfillment Status</th>
              <th>Payment</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedList.length === 0 ? `
              <tr>
                <td colspan="8" class="text-center py-6 text-slate-400">No orders found matching the filters.</td>
              </tr>
            ` : paginatedList.map(o => {
              let badgeHTML = '';
              if (o.status === 'Pending') {
                badgeHTML = `
                  <span class="status-badge status-yellow" style="display: inline-flex; align-items: center; gap: 8px; font-weight: 800; padding: 6px 12px; border-radius: 8px;">
                    <span class="pulse-indicator"></span>
                    Pending
                  </span>
                `;
              } else if (o.status === 'Confirmé') {
                badgeHTML = `
                  <span class="status-badge status-blue" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 6px 12px; border-radius: 8px; border: 1px solid rgba(0, 82, 204, 0.15);">
                    <span>✓</span>
                    Confirmed
                  </span>
                `;
              } else if (o.status === 'En cours') {
                badgeHTML = `
                  <span class="status-badge status-blue" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 6px 12px; border-radius: 8px; background: #e3f2fd; color: #0052cc;">
                    <span>⚡</span>
                    In Progress
                  </span>
                `;
              } else if (o.status === 'Shipped') {
                badgeHTML = `
                  <span class="status-badge status-blue" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 6px 12px; border-radius: 8px; background: #ede7f6; color: #5e35b1;">
                    <span>🚚</span>
                    Shipped
                  </span>
                `;
              } else if (o.status === 'Livré' || o.status === 'Done') {
                badgeHTML = `
                  <span class="status-badge status-green" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 6px 12px; border-radius: 8px;">
                    <span>✅</span>
                    Delivered
                  </span>
                `;
              } else {
                badgeHTML = `
                  <span class="status-badge status-red" style="display: inline-flex; align-items: center; gap: 6px; font-weight: 800; padding: 6px 12px; border-radius: 8px;">
                    <span>✕</span>
                    Cancelled
                  </span>
                `;
              }

              return `
                <tr>
                  <td><strong style="color:var(--primary)">${o.id}</strong></td>
                  <td>${o.date}</td>
                  <td>
                    <div class="customer-cell">
                      <span>${o.customerName}</span>
                      <small style="opacity: 0.7;">${o.customerEmail}</small>
                    </div>
                  </td>
                  <td><span class="truncate-items" style="max-width: 250px; font-weight: 600;">${o.items}</span></td>
                  <td><strong>${formatPrice(o.total)}</strong></td>
                  <td>${badgeHTML}</td>
                  <td><code style="text-transform: uppercase; font-weight: 700; color: var(--text-dark); background: rgba(0,0,0,0.04); padding: 4px 8px; border-radius: 6px;">${o.paymentMethod || 'cod'}</code></td>
                  <td>
                    <button class="view-order-details-btn" data-order-id="${o.id}">Details</button>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination controls -->
      <div class="pagination-footer">
        <span class="pagination-info">Showing ${startIndex + 1} to ${Math.min(startIndex + context.itemsPerPage, totalItems)} of ${totalItems} orders</span>
        <div class="pagination-buttons">
          <button class="pag-btn" id="prev-order-page" ${context.currentPageIndex === 1 ? 'disabled' : ''}>Previous</button>
          <span class="page-num">${context.currentPageIndex} / ${totalPages}</span>
          <button class="pag-btn" id="next-order-page" ${context.currentPageIndex === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    </div>
  `;
}

export function renderAdminOrderDetails(context) {
  const order = context.orders.find(o => o.id === context.selectedOrderId);
  if (!order) return `<div class="error-text">Order not found.</div>`;

  return `
    <div class="details-nav-row mb-4">
      <button class="back-to-list-btn" id="back-to-orders-list-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(180deg); width: 16px; height: 16px; flex-shrink: 0;"><polyline points="9 18 15 12 9 6"/></svg>
        Back to list
      </button>
    </div>

    <div class="order-details-grid">
      
      <!-- Details left: order summary info -->
      <div class="order-details-left-col flex flex-col gap-6">
        
        <div class="details-panel glass-panel">
          <div class="panel-header" style="flex-direction:row; justify-content:space-between; align-items:center;">
            <div>
              <span class="order-tag">Order ID: <strong style="color:var(--primary)">${order.id}</strong></span>
              <p class="order-date-text">Submitted: ${order.date}</p>
            </div>
            <span class="status-badge status-${order.status === 'En cours' ? 'blue' : (order.status === 'Livré' || order.status === 'Done' ? 'green' : (order.status === 'Cancelled' ? 'red' : 'yellow'))}">
              Status: ${order.status}
            </span>
          </div>
          
          <div class="order-items-grid">
            ${order.products.map(p => `
              <div class="order-item-row">
                <img src="${p.image}" class="item-thumb" alt="${p.name}">
                <div class="item-details">
                  <h4>${p.name}</h4>
                  <p>Price: ${formatPrice(p.price)} x ${p.quantity}</p>
                </div>
                <strong class="item-subtotal-price">${formatPrice(p.price * p.quantity)}</strong>
              </div>
            `).join('')}
          </div>
          
          <div class="order-cost-breakdown">
            <div class="cost-line">
              <span>Subtotal</span>
              <span>${formatPrice(order.total - 2000)}</span>
            </div>
            <div class="cost-line">
              <span>Shipping Fee</span>
              <span>2,000 CFA</span>
            </div>
            <div class="cost-divider"></div>
            <div class="cost-line total-line">
              <span>Total Amount Paid</span>
              <span class="text-primary font-bold">${formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <!-- Timeline -->
        <div class="timeline-panel glass-panel">
          <h3>Fulfillment Tracking Timeline</h3>
          <div class="timeline-trail">
            <div class="timeline-node active">
              <div class="node-circle"></div>
              <div class="node-label">Order Submitted - ${order.date}</div>
            </div>
            <div class="timeline-node ${order.status !== 'Pending' ? 'active' : ''}">
              <div class="node-circle"></div>
              <div class="node-label">Payment Confirmed & Verified</div>
            </div>
            <div class="timeline-node ${order.status === 'Shipped' || order.status === 'Livré' || order.status === 'Done' ? 'active' : ''}">
              <div class="node-circle"></div>
              <div class="node-label">Package Handled to Courier ${order.trackingNumber ? `(${order.trackingNumber})` : ''}</div>
            </div>
            <div class="timeline-node ${order.status === 'Livré' || order.status === 'Done' ? 'active' : ''}">
              <div class="node-circle"></div>
              <div class="node-label">Delivered Successfully</div>
            </div>
          </div>
        </div>

      </div>

      <!-- Details right: Client details + settings -->
      <div class="order-details-right-col flex flex-col gap-6">
        
        <div class="customer-info-panel glass-panel">
          <h3>Customer Contact Details</h3>
          <div class="details-field">
            <span class="lbl">Name:</span>
            <span class="val">${order.customerName}</span>
          </div>
          <div class="details-field">
            <span class="lbl">Email Address:</span>
            <span class="val">${order.customerEmail}</span>
          </div>
          <div class="details-field">
            <span class="lbl">Phone Number:</span>
            <span class="val">${order.customerPhone}</span>
          </div>
          <div class="details-field">
            <span class="lbl">Shipping Address:</span>
            <span class="val">${order.customerAddress}</span>
          </div>
          <div class="details-field">
            <span class="lbl">Payment Method:</span>
            <span class="val" style="text-transform: uppercase;">${order.paymentMethod || 'cod'}</span>
          </div>
        </div>

        <div class="management-controls-panel glass-panel">
          <h3>Fulfillment Actions</h3>
          
          <div class="form-group">
            <label>Update Order Status</label>
            <select id="order-status-dropdown" class="admin-input">
              <option value="Pending" ${order.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="En cours" ${order.status === 'En cours' ? 'selected' : ''}>En cours</option>
              <option value="Confirmé" ${order.status === 'Confirmé' ? 'selected' : ''}>Confirmé</option>
              <option value="Shipped" ${order.status === 'Shipped' ? 'selected' : ''}>Shipped (In transit)</option>
              <option value="Livré" ${order.status === 'Livré' ? 'selected' : ''}>Livré (Delivered)</option>
              <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
            </select>
          </div>
          
          <div class="form-group" id="tracking-num-group" style="display: ${order.status === 'Shipped' ? 'block' : 'none'};">
            <label>Tracking Number</label>
            <input type="text" id="order-tracking-num" class="admin-input" placeholder="e.g. WV-ABJ-89234" value="${order.trackingNumber || ''}">
          </div>

          <div class="actions-row mt-4">
            <button class="admin-btn admin-btn-success w-full" id="save-order-status-btn">Apply Status Changes</button>
            <button class="admin-btn admin-btn-secondary w-full mt-2" id="print-order-invoice-btn">Print Commercial Invoice</button>
          </div>
        </div>

      </div>

    </div>
  `;
}

export function attachAdminOrdersListeners(context, shadow) {
  // View Details click triggers
  shadow.querySelectorAll('.view-order-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      context.selectedOrderId = btn.getAttribute('data-order-id');
      context.currentTab = 'orders';
      context.render();
      context.attachListeners();
    });
  });

  // Back to list btn
  const backBtn = shadow.getElementById('back-to-orders-list-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      context.selectedOrderId = null;
      context.render();
      context.attachListeners();
    });
  }

  // Search input
  const search = shadow.getElementById('order-search');
  if (search) {
    search.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
      const oS = shadow.getElementById('order-search');
      if (oS) {
        oS.focus();
        oS.setSelectionRange(oS.value.length, oS.value.length);
      }
    });
  }

  // Quick Status Filter pill buttons
  shadow.querySelectorAll('.status-filter-pill-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      context.statusFilter = btn.getAttribute('data-status');
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
    });
  });

  // Pagination buttons
  const prev = shadow.getElementById('prev-order-page');
  if (prev) {
    prev.addEventListener('click', () => {
      if (context.currentPageIndex > 1) {
        context.currentPageIndex--;
        context.render();
        context.attachListeners();
      }
    });
  }
  const next = shadow.getElementById('next-order-page');
  if (next) {
    next.addEventListener('click', () => {
      const list = context.orders.filter(o => {
        if (context.searchQuery) {
          const q = context.searchQuery.toLowerCase();
          if (!o.id.toLowerCase().includes(q) && !o.customerName.toLowerCase().includes(q)) return false;
        }
        if (context.statusFilter !== 'All' && o.status !== context.statusFilter) return false;
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

  // Dropdown showing/hiding tracking num group
  const statusDrop = shadow.getElementById('order-status-dropdown');
  const trackGroup = shadow.getElementById('tracking-num-group');
  if (statusDrop && trackGroup) {
    statusDrop.addEventListener('change', (e) => {
      if (e.target.value === 'Shipped') {
        trackGroup.style.display = 'block';
      } else {
        trackGroup.style.display = 'none';
      }
    });
  }

  // Save order status btn
  const saveOrderBtn = shadow.getElementById('save-order-status-btn');
  if (saveOrderBtn) {
    saveOrderBtn.addEventListener('click', () => {
      const order = context.orders.find(o => o.id === context.selectedOrderId);
      if (order) {
        const nextStatus = statusDrop.value;
        const trackingNum = shadow.getElementById('order-tracking-num').value.trim();

        if (nextStatus === 'Shipped' && !trackingNum) {
          window.showAlert('A tracking number is required to update this order status to Shipped.', 'Tracking Required');
          return;
        }

        const originalStatus = order.status;
        order.status = nextStatus;
        order.trackingNumber = trackingNum;
        context.saveDatabase('orders');

        // Create customer notification
        if (order.email) {
          const safeKey = order.email.replace(/[^a-zA-Z0-9]/g, '_');
          const notifKey = `SWEETOS_notifications_${safeKey}`;
          
          let customerNotifs = [];
          const savedNotifs = localStorage.getItem(notifKey);
          if (savedNotifs) {
            try {
              customerNotifs = JSON.parse(savedNotifs);
            } catch(e) {}
          }
          
          // Generate status-specific emojis and message
          let icon = '📦';
          let title = `Mise à jour commande #${order.id}`;
          let desc = `Le statut de votre commande #${order.id} a été mis à jour : ${nextStatus}.`;
          
          if (nextStatus === 'Shipped') {
            icon = '🚚';
            title = `Commande #${order.id} expédiée !`;
            desc = `Votre commande #${order.id} a été expédiée. Numéro de suivi : ${trackingNum || 'N/A'}`;
          } else if (nextStatus === 'Livr' || nextStatus === 'Done' || nextStatus === 'Livre' || nextStatus.includes('Livr')) {
            icon = '✅';
            title = `Commande #${order.id} livrée !`;
            desc = `Félicitations, votre commande #${order.id} a été livrée avec succès.`;
          } else if (nextStatus === 'Cancelled') {
            icon = '❌';
            title = `Commande #${order.id} annulée`;
            desc = `Votre commande #${order.id} a été annulée.`;
          } else if (nextStatus === 'Confirm' || nextStatus.includes('Confirm')) {
            icon = '👍';
            title = `Commande #${order.id} confirmée`;
            desc = `Votre commande #${order.id} a été confirmée et est en cours de traitement.`;
          }
          
          customerNotifs.unshift({
            id: Date.now(),
            type: 'shipping',
            icon: icon,
            title: title,
            desc: desc,
            time: 'Just now',
            unread: true
          });
          
          localStorage.setItem(notifKey, JSON.stringify(customerNotifs));
          
          // If the customer is currently logged in, trigger badge sync instantly
          const loggedInUserStr = localStorage.getItem('SWEETOS_logged_in_user');
          if (loggedInUserStr) {
            try {
              const loggedIn = JSON.parse(loggedInUserStr);
              if (loggedIn.email === order.email) {
                const totalUnread = customerNotifs.filter(n => n.unread).length;
                window.dispatchEvent(new CustomEvent('notifications:badge-sync', { detail: totalUnread }));
              }
            } catch(e) {}
          }
        }

        // If order status is set to Cancelled, restock catalog products quantity
        if (nextStatus === 'Cancelled' && originalStatus !== 'Cancelled') {
          order.products.forEach(item => {
            const catalogProd = context.products.find(p => p.id === item.id);
            if (catalogProd) {
              catalogProd.stock = (catalogProd.stock || 0) + item.quantity;
              
              context.inventoryLogs.unshift({
                id: Date.now(),
                date: new Date().toISOString().replace('T', ' ').slice(0,16),
                sku: catalogProd.sku,
                action: "Order Cancelled restock",
                quantity: item.quantity,
                user: "System return"
              });
            }
          });
          context.saveDatabase('products');
          context.saveDatabase('inventory');
        }

        // Sync order status back to custom profile localStorage keys if they exist
        if (order.userProfileKey) {
          const customerProfileStr = localStorage.getItem(order.userProfileKey);
          if (customerProfileStr) {
            try {
              const customerProfile = JSON.parse(customerProfileStr);
              if (customerProfile.orders) {
                const clientOrder = customerProfile.orders.find(co => co.id === order.id);
                if (clientOrder) {
                  clientOrder.status = nextStatus;
                  localStorage.setItem(order.userProfileKey, JSON.stringify(customerProfile));
                  
                  const loggedInUserStr = localStorage.getItem('SWEETOS_logged_in_user');
                  if (loggedInUserStr) {
                    const loggedIn = JSON.parse(loggedInUserStr);
                    if (loggedIn.email === customerProfile.email) {
                      localStorage.setItem('SWEETOS_user_profile', JSON.stringify(customerProfile));
                    }
                  }
                }
              }
            } catch(e) {}
          }
        }

        window.dispatchEvent(new CustomEvent('orders:updated'));
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Order ${order.id} status updated to: ${nextStatus}` }));
        context.render();
        context.attachListeners();
      }
    });
  }

  // Print invoice helper and event handler
  const printBtn = shadow.getElementById('print-order-invoice-btn');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      const order = context.orders.find(o => o.id === context.selectedOrderId);
      if (order) {
        printOrderReceipt(order);
      }
    });
  }
}

// Global styled receipt generator
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
