export function renderAdminSidebar(context) {
  const pendingOrdersCount = context.orders.filter(o => o.status === 'Pending' || o.status === 'En cours').length;
  const lowStockCount = context.products.filter(p => p.stock !== undefined && p.stock <= (p.threshold || 5)).length;
  const isCollapsed = context.sidebarCollapsed;

  return `
    <aside class="admin-sidebar ${isCollapsed ? 'collapsed' : ''}" style="position: relative;">
      <!-- Toggle Expand/Collapse Button -->
      <button class="sidebar-toggle-btn" id="sidebar-toggle-btn" title="${isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}">
        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px; display: block;">
          ${isCollapsed ? `
            <polyline points="9 18 15 12 9 6"></polyline>
          ` : `
            <polyline points="15 18 9 12 15 6"></polyline>
          `}
        </svg>
      </button>

      <div class="admin-brand">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="var(--primary)" stroke-width="2.5" style="width: 22px; height: 22px; flex-shrink: 0; display: inline-block;">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
          <line x1="3" y1="6" x2="21" y2="6"></line>
          <path d="M16 10a4 4 0 0 1-8 0"></path>
        </svg>
        ${!isCollapsed ? `
          <div style="display:flex; flex-direction:column;">
            <h2 style="font-size:15px; font-weight:800; color:white; line-height:1.2; margin:0;">AdminPanel</h2>
            <small style="font-size:11px; color:#64748b; font-weight:600;">Ecommerce</small>
          </div>
        ` : ''}
      </div>
      
      <nav class="admin-sidebar-nav">
        <a href="#" class="admin-nav-item ${context.currentTab === 'dashboard' ? 'active' : ''}" data-tab="dashboard" title="Dashboard">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>
          ${!isCollapsed ? '<span>Dashboard</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'products' ? 'active' : ''}" data-tab="products" title="Products">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
          ${!isCollapsed ? '<span>Products</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'orders' ? 'active' : ''}" data-tab="orders" title="Orders" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
          ${!isCollapsed ? `
            <span>Orders</span>
            ${pendingOrdersCount > 0 ? `<span class="badge badge-warning" style="margin-left:auto">${pendingOrdersCount}</span>` : ''}
          ` : (pendingOrdersCount > 0 ? `<span class="badge badge-warning" style="position: absolute; top: 4px; right: 4px; padding: 2px 4px; font-size: 8px;">${pendingOrdersCount}</span>` : '')}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'customers' ? 'active' : ''}" data-tab="customers" title="Customers">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          ${!isCollapsed ? '<span>Customers</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'reviews' ? 'active' : ''}" data-tab="reviews" title="Reviews">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
          ${!isCollapsed ? '<span>Reviews</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'inventory' ? 'active' : ''}" data-tab="inventory" title="Inventory" style="position: relative;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"></path></svg>
          ${!isCollapsed ? `
            <span>Inventory</span>
            ${lowStockCount > 0 ? `<span class="badge badge-danger" style="margin-left:auto; font-size: 10px;">Alert</span>` : ''}
          ` : (lowStockCount > 0 ? `<span class="badge badge-danger" style="position: absolute; top: 4px; right: 4px; padding: 2px 4px; font-size: 8px;">!</span>` : '')}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'sections' ? 'active' : ''}" data-tab="sections" title="Sections">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
          ${!isCollapsed ? '<span>Sections</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'coupons' ? 'active' : ''}" data-tab="coupons" title="Marketing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>
          ${!isCollapsed ? '<span>Marketing</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'analytics' ? 'active' : ''}" data-tab="analytics" title="Analytics">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
          ${!isCollapsed ? '<span>Analytics</span>' : ''}
        </a>
        <a href="#" class="admin-nav-item ${context.currentTab === 'settings' ? 'active' : ''}" data-tab="settings" title="Settings">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
          ${!isCollapsed ? '<span>Settings</span>' : ''}
        </a>
      </nav>

      <div class="admin-sidebar-footer" style="${isCollapsed ? 'flex-direction: column; gap: 12px;' : ''}">
        <div class="admin-profile-badge" title="Admin - nextbigthin256@gmail.com">
          <div class="avatar">S</div>
          ${!isCollapsed ? `
            <div class="info">
              <h3>Admin</h3>
              <small>nextbigthin256@gmail.com</small>
            </div>
          ` : ''}
        </div>
        <button class="logout-btn" id="admin-logout-btn" title="Sign Out">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0; display: inline-block;"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
        </button>
      </div>
    </aside>
  `;
}

export function attachAdminSidebarListeners(context, shadow) {
  // Sidebar tab navigation
  shadow.querySelectorAll('.admin-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tab = item.getAttribute('data-tab');
      context.currentTab = tab;
      sessionStorage.setItem('SWEETOS_admin_current_tab', tab);
      
      // Reset filter pagination
      context.currentPageIndex = 1;
      context.selectedOrderId = null;
      context.selectedCustomerEmail = null;

      context.render();
      context.attachListeners();
      if (typeof context.syncAllDatabasesFromServer === 'function') {
        context.syncAllDatabasesFromServer();
      }
    });
  });

  // Sidebar expand/collapse toggle
  const toggleBtn = shadow.getElementById('sidebar-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      context.sidebarCollapsed = !context.sidebarCollapsed;
      sessionStorage.setItem('SWEETOS_admin_sidebar_collapsed', context.sidebarCollapsed.toString());
      context.render();
      context.attachListeners();
    });
  }

  // Logout button
  const logoutBtn = shadow.getElementById('admin-logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      context.isAuthenticated = false;
      sessionStorage.removeItem('SWEETOS_admin_authenticated');
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Logged out successfully.' }));
      context.render();
      context.attachListeners();
    });
  }
}
