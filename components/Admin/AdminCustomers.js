import { formatPrice } from '../../utils/storage.js';

export function renderAdminCustomers(context) {
  if (context.selectedCustomerEmail) {
    return renderAdminCustomerProfile(context);
  }

  let list = [...context.customers];
  if (context.searchQuery) {
    const q = context.searchQuery.toLowerCase();
    list = list.filter(c => c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q));
  }

  const totalItems = list.length;
  const totalPages = Math.ceil(totalItems / context.itemsPerPage) || 1;
  const startIndex = (context.currentPageIndex - 1) * context.itemsPerPage;
  const paginatedList = list.slice(startIndex, startIndex + context.itemsPerPage);

  // Metrics calculations
  const totalCount = context.customers.length;
  const activeCount = context.customers.filter(c => c.ordersCount > 0).length;
  const totalSpentAll = context.customers.reduce((sum, c) => sum + (c.totalSpent || 0), 0);
  const avgSpent = totalCount > 0 ? Math.round(totalSpentAll / totalCount) : 0;
  const topSpent = totalCount > 0 ? Math.max(...context.customers.map(c => c.totalSpent || 0)) : 0;

  // Helper to generate initials for avatar
  const getInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'CU';
  };

  return `
    <!-- Top-Level Customer Overview Metrics -->
    <div class="customers-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Card 1: Total Registered -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">👥</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Registered Users</span>
          <strong style="font-size: 22px; font-weight: 850; color: var(--text-dark);">${totalCount} clients</strong>
        </div>
      </div>

      <!-- Card 2: Active Shoppers -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(54, 179, 126, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #36b37e;">🛒</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Active Buyers</span>
          <strong style="font-size: 22px; font-weight: 850; color: #36b37e;">${activeCount} shoppers</strong>
        </div>
      </div>

      <!-- Card 3: Average Spent (LTV) -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 180, 216, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #00b4d8;">📊</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Average LTV spent</span>
          <strong style="font-size: 22px; font-weight: 850; color: #00b4d8;">${formatPrice(avgSpent)}</strong>
        </div>
      </div>

      <!-- Card 4: Top customer record -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(255, 171, 0, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ffab00;">👑</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Highest Spend Limit</span>
          <strong style="font-size: 22px; font-weight: 850; color: #ffab00;">${formatPrice(topSpent)}</strong>
        </div>
      </div>
    </div>

    <!-- Search Controls -->
    <div class="admin-table-filters-bar" style="margin-bottom: 20px;">
      <div class="search-box">
        <input type="text" id="customer-search" placeholder="Search by name, email..." value="${context.searchQuery}">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; flex-shrink: 0;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>
    </div>

    <!-- Customers Data Table -->
    <div class="admin-table-panel glass-panel">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Customer Name</th>
              <th>Email Address</th>
              <th>Phone Number</th>
              <th>Orders Count</th>
              <th>Total Life Spend</th>
              <th>Joined Date</th>
              <th style="text-align: right;">Action</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedList.length === 0 ? `
              <tr>
                <td colspan="7" class="text-center py-6 text-slate-400">No customers registered yet.</td>
              </tr>
            ` : paginatedList.map(c => `
              <tr>
                <td>
                  <div style="display: flex; align-items: center; gap: 12px;">
                    <div style="
                      width: 36px;
                      height: 36px;
                      border-radius: 50%;
                      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-accent) 100%);
                      color: white;
                      font-weight: 800;
                      font-size: 13px;
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      box-shadow: 0 2px 6px rgba(0,82,204,0.15);
                    ">
                      ${getInitials(c.name)}
                    </div>
                    <strong style="color: var(--text-dark);">${c.name}</strong>
                  </div>
                </td>
                <td><code>${c.email}</code></td>
                <td><span style="font-weight:600; opacity:0.8;">${c.phone || 'N/A'}</span></td>
                <td>
                  <span class="status-badge ${c.ordersCount > 0 ? 'status-blue' : 'status-yellow'}" style="font-weight:750;">
                    ${c.ordersCount} orders
                  </span>
                </td>
                <td><strong class="text-primary">${formatPrice(c.totalSpent)}</strong></td>
                <td><span style="font-weight: 600; font-size:12.5px; opacity:0.75;">${c.registrationDate}</span></td>
                <td>
                  <div style="display:flex; justify-content: flex-end;">
                    <button class="view-customer-profile-btn admin-btn admin-btn-secondary" data-customer-email="${c.email}" style="padding: 6px 14px; font-weight:700;">View Profile</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination Footer -->
      <div class="pagination-footer">
        <span class="pagination-info">Showing ${startIndex + 1} to ${Math.min(startIndex + context.itemsPerPage, totalItems)} of ${totalItems} customers</span>
        <div class="pagination-buttons">
          <button class="pag-btn" id="prev-customer-page" ${context.currentPageIndex === 1 ? 'disabled' : ''}>Previous</button>
          <span class="page-num">${context.currentPageIndex} / ${totalPages}</span>
          <button class="pag-btn" id="next-customer-page" ${context.currentPageIndex === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    </div>
  `;
}

export function renderAdminCustomerProfile(context) {
  const customer = context.customers.find(c => c.email === context.selectedCustomerEmail);
  if (!customer) return `<div class="error-text">Customer not found.</div>`;

  const customerOrders = context.orders.filter(o => o.customerEmail.toLowerCase() === customer.email.toLowerCase());

  return `
    <div class="details-nav-row mb-4" style="margin-bottom: 20px;">
      <button class="back-to-list-btn" id="back-to-customers-list-btn" style="display:flex; align-items:center; gap:6px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="transform: rotate(180deg); width: 16px; height: 16px; flex-shrink: 0;"><polyline points="9 18 15 12 9 6"/></svg>
        <span>Back to customers directory</span>
      </button>
    </div>

    <div class="order-details-grid">
      
      <!-- Left Profile Biography Card -->
      <div class="order-details-left-col glass-panel" style="padding: 24px; display:flex; flex-direction:column; gap:16px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 850; color: var(--text-dark); border-bottom: 1px solid var(--border); padding-bottom:12px;">Customer Biography</h3>
        
        <div class="bio-block" style="display:flex; align-items:center; gap:14px; margin-top:8px;">
          <div style="
            width: 52px;
            height: 52px;
            border-radius: 50%;
            background: linear-gradient(135deg, var(--primary) 0%, var(--primary-accent) 100%);
            color: white;
            font-weight: 850;
            font-size: 18px;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 10px rgba(0,82,204,0.2);
          ">
            ${customer.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
          </div>
          <div>
            <h4 style="margin:0; font-weight:850; font-size:16px; color:var(--text-dark);">${customer.name}</h4>
            <p style="color:var(--text-light); font-size:12px; margin:2px 0 0 0; font-weight:600;">Member since: ${customer.registrationDate}</p>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:12px; margin-top:8px;">
          <div class="details-field" style="display:flex; justify-content:space-between; font-size:13px;">
            <span class="lbl" style="font-weight:750; color:var(--text-light);">Primary Email:</span>
            <span class="val" style="font-weight:750; color:var(--text-dark);"><code>${customer.email}</code></span>
          </div>
          <div class="details-field" style="display:flex; justify-content:space-between; font-size:13px;">
            <span class="lbl" style="font-weight:750; color:var(--text-light);">Primary Phone:</span>
            <span class="val" style="font-weight:750; color:var(--text-dark);">${customer.phone || 'N/A'}</span>
          </div>
          <div class="details-field" style="display:flex; justify-content:space-between; font-size:13px;">
            <span class="lbl" style="font-weight:750; color:var(--text-light);">Gross Total Spent:</span>
            <span class="val" style="font-weight:800; color:var(--primary);">${formatPrice(customer.totalSpent)}</span>
          </div>
        </div>
        
        <h4 style="margin:16px 0 6px 0; font-weight:800; font-size:13px; color:var(--text-dark); text-transform:uppercase; letter-spacing:0.5px;">Delivery Addresses on File</h4>
        <ul style="padding-left: 20px; margin:0; list-style-type: square; color:var(--text-light); font-size: 13px; display:flex; flex-direction:column; gap:8px;">
          ${customer.addresses.map(a => `<li style="line-height:1.4;">${a}</li>`).join('')}
          ${customer.addresses.length === 0 ? `<li>No addresses recorded yet.</li>` : ''}
        </ul>
      </div>

      <!-- Right Purchase History Table Card -->
      <div class="order-details-right-col glass-panel" style="flex:2; padding:24px;">
        <h3 style="margin: 0; font-size: 16px; font-weight: 850; color: var(--text-dark); border-bottom: 1px solid var(--border); padding-bottom:12px; margin-bottom:16px;">Purchase Orders History</h3>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Payment Total</th>
                <th>Fulfillment Status</th>
                <th style="text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${customerOrders.length === 0 ? `
                <tr>
                  <td colspan="5" class="text-center py-6 text-slate-400">No orders placed by this customer.</td>
                </tr>
              ` : customerOrders.map(o => `
                <tr>
                  <td><strong style="color:var(--primary)">${o.id}</strong></td>
                  <td><span style="font-weight:600; opacity:0.8;">${o.date}</span></td>
                  <td><strong>${formatPrice(o.total)}</strong></td>
                  <td>
                    <span class="status-badge status-${o.status === 'Livré' || o.status === 'Done' ? 'green' : (o.status === 'Cancelled' ? 'red' : 'blue')}" style="font-weight:750;">
                      ${o.status}
                    </span>
                  </td>
                  <td>
                    <div style="display:flex; justify-content: flex-end;">
                      <button class="view-order-details-btn admin-btn admin-btn-secondary" data-order-id="${o.id}" style="padding: 6px 12px; font-size: 12px; font-weight:700;">Details</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

export function attachAdminCustomersListeners(context, shadow) {
  // View Profile action click triggers
  shadow.querySelectorAll('.view-customer-profile-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      context.selectedCustomerEmail = btn.getAttribute('data-customer-email');
      context.render();
      context.attachListeners();
    });
  });

  // Back to list btn
  const backBtn = shadow.getElementById('back-to-customers-list-btn');
  if (backBtn) {
    backBtn.addEventListener('click', () => {
      context.selectedCustomerEmail = null;
      context.render();
      context.attachListeners();
    });
  }

  // Search input
  const search = shadow.getElementById('customer-search');
  if (search) {
    search.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
      
      const cS = shadow.getElementById('customer-search');
      if (cS) {
        cS.focus();
        cS.setSelectionRange(cS.value.length, cS.value.length);
      }
    });
  }

  // Pagination buttons
  const prev = shadow.getElementById('prev-customer-page');
  if (prev) {
    prev.addEventListener('click', () => {
      if (context.currentPageIndex > 1) {
        context.currentPageIndex--;
        context.render();
        context.attachListeners();
      }
    });
  }
  const next = shadow.getElementById('next-customer-page');
  if (next) {
    next.addEventListener('click', () => {
      const list = context.customers.filter(c => {
        if (context.searchQuery) {
          const q = context.searchQuery.toLowerCase();
          if (!c.name.toLowerCase().includes(q) && !c.email.toLowerCase().includes(q)) return false;
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

  // Redirect to order details inside profile
  shadow.querySelectorAll('.view-order-details-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const orderId = btn.getAttribute('data-order-id');
      context.selectedOrderId = orderId;
      context.currentTab = 'orders';
      context.render();
      context.attachListeners();
    });
  });
}
