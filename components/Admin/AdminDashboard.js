import { formatPrice } from '../../utils/storage.js';

export function renderAdminDashboard(context) {
  const totalSales = context.orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refusé').reduce((sum, o) => sum + o.total, 0);
  const completedOrdersCount = context.orders.length;
  const totalRegisteredCustomers = context.customers.length;
  const catalogCount = context.products.length;
  const outOfStockProducts = context.products.filter(p => p.stock !== undefined && Number(p.stock) === 0);
  const lowStockProducts = context.products.filter(p => p.stock !== undefined && Number(p.stock) > 0 && Number(p.stock) <= (p.threshold || 5));
  const recentOrders = context.orders.slice(0, 5);

  return `
    <!-- Statistics Row Grid -->
    <div class="admin-stats-grid">
      <div class="stats-card glass-panel">
        <div class="details">
          <span class="label">Total Revenue</span>
          <h2>$${totalSales.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h2>
          <div class="trend-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            <span>+100% from last month</span>
          </div>
        </div>
        <div class="icon-circle bg-primary-light">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
        </div>
      </div>
      <div class="stats-card glass-panel">
        <div class="details">
          <span class="label">Total Orders</span>
          <h2>${completedOrdersCount}</h2>
          <div class="trend-pill">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
            <span>+100% from last month</span>
          </div>
        </div>
        <div class="icon-circle bg-success-light">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        </div>
      </div>
      <div class="stats-card glass-panel">
        <div class="details">
          <span class="label">Total Customers</span>
          <h2>${totalRegisteredCustomers}</h2>
        </div>
        <div class="icon-circle bg-cyan-light">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>
        </div>
      </div>
      <div class="stats-card glass-panel">
        <div class="details">
          <span class="label">Total Products</span>
          <h2>${catalogCount}</h2>
        </div>
        <div class="icon-circle bg-warning-light">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" style="width:20px; height:20px;"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path></svg>
        </div>
      </div>
    </div>

    <!-- Middle columns: Revenue chart + low stock alert panel -->
    <div class="admin-columns-grid mt-6" style="margin-top: 24px;">
      
      <!-- Revenue Overview Chart Card -->
      <div class="dashboard-col-left glass-panel" style="padding:24px;">
        <div class="col-header">
          <h3>Revenue Overview</h3>
          <span class="sub">Last 30 days</span>
        </div>
        
        <div class="chart-box" style="margin-top: 16px;">
          <svg viewBox="0 0 500 200" style="width:100%; height:100%;">
            <!-- Grid lines -->
            <line x1="30" y1="20" x2="480" y2="20" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
            <line x1="30" y1="60" x2="480" y2="60" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
            <line x1="30" y1="100" x2="480" y2="100" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
            <line x1="30" y1="140" x2="480" y2="140" stroke="rgba(0,0,0,0.03)" stroke-width="1"/>
            <line x1="30" y1="170" x2="480" y2="170" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
            
            <!-- Flat blue line overlay -->
            <path d="M 30 170 L 480 170" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round"/>
            
            <!-- labels -->
            <text x="30" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Jul 19</text>
            <text x="80" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Jul 23</text>
            <text x="130" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Jul 27</text>
            <text x="180" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Jul 31</text>
            <text x="230" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Aug 4</text>
            <text x="280" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Aug 8</text>
            <text x="330" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Aug 12</text>
            <text x="380" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Aug 16</text>
            <text x="430" y="190" fill="#94A3B8" font-size="9" text-anchor="middle">Aug 17</text>
            
            <!-- Y-axis values -->
            <text x="20" y="24" fill="#94A3B8" font-size="9" text-anchor="end">$4</text>
            <text x="20" y="64" fill="#94A3B8" font-size="9" text-anchor="end">$3</text>
            <text x="20" y="104" fill="#94A3B8" font-size="9" text-anchor="end">$2</text>
            <text x="20" y="144" fill="#94A3B8" font-size="9" text-anchor="end">$1</text>
            <text x="20" y="174" fill="#94A3B8" font-size="9" text-anchor="end">$0</text>
          </svg>
        </div>
      </div>

      <!-- Low Stock Sidebar Widget Card -->
      <div class="dashboard-col-right flex flex-col gap-6" style="flex:1;">
        <div class="alerts-panel glass-panel" style="height:100%; padding:24px;">
          <div class="panel-header" style="margin-bottom:20px;">
            <h3 style="font-size:16px; font-weight:800; display:flex; align-items:center; gap:8px;">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="var(--yellow)" stroke-width="2.5" style="width:16px; height:16px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
              <span>Low Stock</span>
            </h3>
            <button class="quick-link-btn" data-target-tab="inventory" style="font-size:13px; font-weight:700; display:flex; align-items:center; gap:4px;">
              <span>View all</span>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </div>
          
          <div class="alerts-list custom-scroll" style="display:flex; flex-direction:column; gap:16px;">
            ${(outOfStockProducts.length === 0 && lowStockProducts.length === 0) ? `
              <div style="text-align: center; padding: 40px 16px; color: var(--text-gray); font-family: 'Outfit', sans-serif;">
                <span style="font-size: 32px; display: block; margin-bottom: 8px;">✅</span>
                <h4 style="font-size: 13.5px; font-weight: 700; color: var(--text-dark); margin: 0 0 4px 0;">Stock Impeccable</h4>
                <p style="font-size: 11px; margin: 0; color: var(--text-gray);">Tous les produits sont bien approvisionnés !</p>
              </div>
            ` : `
              ${outOfStockProducts.map(p => `
                <div class="alert-item" style="border:none; border-bottom:1px solid var(--border); border-radius:0; padding:0 0 12px 0; background:none; display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; flex-direction:column;">
                    <h4 style="font-size:14px; font-weight:700; color:var(--text-dark); margin:0;">${p.name}</h4>
                    <small style="color:var(--text-gray); font-size:11px; margin-top:2px;">${p.sku || 'SKU-NONE'}</small>
                  </div>
                  <span style="background:#ffe5e5; color:#ff5630; border:1px solid #ffb2b2; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:800; letter-spacing:0.5px;">RUPTURE</span>
                </div>
              `).join('')}
              ${lowStockProducts.map(p => `
                <div class="alert-item" style="border:none; border-bottom:1px solid var(--border); border-radius:0; padding:0 0 12px 0; background:none; display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; flex-direction:column;">
                    <h4 style="font-size:14px; font-weight:700; color:var(--text-dark); margin:0;">${p.name}</h4>
                    <small style="color:var(--text-gray); font-size:11px; margin-top:2px;">${p.sku || 'SKU-NONE'}</small>
                  </div>
                  <span style="background:#fff3e6; color:#ff9a3c; border:1px solid #ffd8b2; padding:4px 8px; border-radius:6px; font-size:10px; font-weight:800; letter-spacing:0.5px;">FAIBLE (${p.stock})</span>
                </div>
              `).join('')}
            `}
          </div>
        </div>
      </div>

    </div>

    <!-- Recent Orders Table Panel Card -->
    <div class="admin-table-panel glass-panel mt-6" style="padding:24px; margin-top:24px;">
      <div class="panel-header" style="margin-bottom:20px;">
        <h3 style="font-size:16px; font-weight:800;">Recent Orders</h3>
        <button class="quick-link-btn" data-target-tab="orders" style="font-size:13px; font-weight:700; display:flex; align-items:center; gap:4px;">
          <span>View all</span>
          <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="width:12px; height:12px;"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
        </button>
      </div>
      
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Status</th>
              <th>Payment</th>
            </tr>
          </thead>
          <tbody>
            ${recentOrders.length === 0 ? `
              <tr>
                <td colspan="4" class="text-center py-6 text-slate-400">No orders registered yet.</td>
              </tr>
            ` : recentOrders.map(o => `
              <tr>
                <td><strong style="color:var(--primary)">${o.id}</strong></td>
                <td>
                  <div class="customer-cell">
                    <span>${o.customerName}</span>
                    <small>${o.customerEmail}</small>
                  </div>
                </td>
                <td>
                  <span class="status-badge status-${o.status === 'En cours' ? 'blue' : (o.status === 'Livré' || o.status === 'Done' ? 'green' : 'yellow')}">
                    ${o.status}
                  </span>
                </td>
                <td><code style="text-transform: uppercase;">${o.paymentMethod || 'cod'}</code></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

export function attachAdminDashboardListeners(context, shadow) {
  // Navigation buttons inside alerts and orders redirects
  shadow.querySelectorAll('.quick-link-btn, [data-target-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      const target = btn.getAttribute('data-target-tab');
      if (target) {
        context.currentTab = target;
        sessionStorage.setItem('SWEETOS_admin_current_tab', target);
        context.render();
        context.attachListeners();
      }
    });
  });
}
