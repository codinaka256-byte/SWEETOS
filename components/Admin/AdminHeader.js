export function renderAdminHeader(context) {
  let tabTitle = context.currentTab.charAt(0).toUpperCase() + context.currentTab.slice(1);
  if (context.currentTab === 'coupons') {
    tabTitle = 'Marketing';
  }
  
  let subtitle = "Store Database Metrics & Operations Control Center";
  if (context.currentTab === 'dashboard') {
    subtitle = "Welcome back! Here's what's happening with your store.";
  }

  // Load alerts from low stock, coupon stock & active orders
  const lowStock = context.products.filter(p => p.stock !== undefined && p.stock <= (p.threshold || 5));
  const pendingOrders = context.orders.filter(o => o.status === 'Pending' || o.status === 'En cours');
  const lowCoupons = (context.coupons || []).filter(c => c.stock !== undefined && c.stock <= 2);
  
  const readAlertsStr = localStorage.getItem('SWEETOS_admin_read_alerts') || '[]';
  let readAlerts = [];
  try {
    readAlerts = JSON.parse(readAlertsStr);
  } catch(e) {}

  const alerts = [];
  
  // Load custom admin alerts (e.g. owed coupons from out of stock templates)
  const customAlertsStr = localStorage.getItem('SWEETOS_admin_custom_alerts') || '[]';
  let customAlerts = [];
  try {
    customAlerts = JSON.parse(customAlertsStr);
  } catch(e) {}
  
  customAlerts.forEach(ca => {
    const isRead = readAlerts.includes(ca.id);
    alerts.push({
      id: ca.id,
      type: ca.type || 'coupon',
      message: ca.message,
      time: ca.time || 'Alert',
      unread: !isRead
    });
  });
  
  // Coupon alerts first
  lowCoupons.forEach(c => {
    const alertId = `coupon-stock-${c.code}`;
    const isRead = readAlerts.includes(alertId);
    const message = c.stock === 0
      ? `Coupon Finished: Pool "${c.code}" (${c.value}% Off) is completely empty!`
      : `Low Coupon Stock: Pool "${c.code}" (${c.value}% Off) has only ${c.stock} left.`;
    alerts.push({
      id: alertId,
      type: 'coupon',
      message: message,
      time: 'Coupon Alert',
      unread: !isRead
    });
  });

  lowStock.forEach(p => {
    const alertId = `stock-${p.id || p.sku}`;
    const isRead = readAlerts.includes(alertId);
    alerts.push({
      id: alertId,
      type: 'stock',
      message: `Low Stock: "${p.name}" has only ${p.stock} units remaining.`,
      time: 'Stock Alert',
      unread: !isRead
    });
  });

  pendingOrders.forEach(o => {
    const alertId = `order-${o.id}`;
    const isRead = readAlerts.includes(alertId);
    alerts.push({
      id: alertId,
      type: 'order',
      message: `Pending fulfillment for order #${o.id} from ${o.customerName || 'Client'}.`,
      time: o.date || 'New Order',
      unread: !isRead
    });
  });

  const unreadAlertCount = alerts.filter(a => a.unread).length;
  const alertCount = alerts.length;

  return `
    <header class="admin-topbar">
      <div class="admin-title-panel">
        <h1>${tabTitle}</h1>
        <p>${subtitle}</p>
      </div>
      
      <div class="admin-actions-bar">
        <!-- Global Search Input -->
        <div class="header-search-bar">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="global-admin-search" placeholder="Search this tab..." value="${context.searchQuery || ''}" autocomplete="off">
        </div>

        <!-- Notification Bell & Dropdown -->
        <div class="header-notification-wrapper" style="position: relative;">
          <button class="header-icon-btn" id="admin-notif-bell-btn" title="View Notifications">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" style="width: 20px; height: 20px; display: block;"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>
            ${unreadAlertCount > 0 ? `<span class="notif-badge-dot">${unreadAlertCount}</span>` : ''}
          </button>
          
          <div class="admin-notif-dropdown" id="admin-notif-dropdown">
            <div class="notif-dropdown-header">
              <h4>Alerts & Notifications</h4>
              <span class="count">${unreadAlertCount} new</span>
            </div>
            <div class="notif-dropdown-body custom-scroll">
              ${alerts.length === 0 ? `
                <div class="empty-notif">No new alerts.</div>
              ` : alerts.map(a => `
                <div class="notif-item ${a.type} ${a.unread ? 'unread' : 'read'}" data-id="${a.id}" data-tab="${a.type === 'stock' ? 'inventory' : (a.type === 'coupon' ? 'coupons' : 'orders')}" style="cursor: pointer; opacity: ${a.unread ? '1' : '0.6'}; display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid var(--border); transition: background 0.2s;">
                  <div style="display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0;">
                    <div class="notif-icon-circle" style="flex-shrink: 0;">
                      ${a.type === 'stock' ? `
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 12px; height: 12px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                      ` : (a.type === 'coupon' ? `
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><path d="M21 12H3m0 0a9 9 0 1 1 18 0v0A9 9 0 0 1 3 12zm8-5h2m-2 10h2m-6-5h12"></path></svg>
                      ` : `
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="width: 12px; height: 12px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                      `)}
                    </div>
                    <div class="notif-details" style="min-width: 0; flex: 1;">
                      <p style="margin: 0; font-weight: ${a.unread ? '700' : '500'}; color: var(--text-dark); line-height: 1.4; font-size: 12.5px;">${a.message}</p>
                      <small style="font-size: 10.5px; color: var(--text-gray);">${a.time}</small>
                    </div>
                  </div>
                  ${a.unread ? `<span class="unread-dot" style="width: 8px; height: 8px; background: #2563eb; border-radius: 50%; flex-shrink: 0; margin-left: 10px;"></span>` : ''}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- View Storefront Link Button -->
        <button class="storefront-link-btn" id="view-storefront-btn">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; flex-shrink: 0; display: inline-block;"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10"/></svg>
          <span>View Store</span>
        </button>
      </div>
    </header>
  `;
}

export function attachAdminHeaderListeners(context, shadow) {
  // Storefront navigation change
  const storefrontBtn = shadow.getElementById('view-storefront-btn');
  if (storefrontBtn) {
    storefrontBtn.addEventListener('click', () => {
      window.dispatchEvent(new CustomEvent('navigation:changed', { detail: { page: 'home' } }));
    });
  }

  // Global Search input key listeners (shares state with all sub-tabs)
  const searchInput = shadow.getElementById('global-admin-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      
      // If they search, keep their page index reset to 1
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();

      // Refocus search box and set cursor to end
      const s = shadow.getElementById('global-admin-search');
      if (s) {
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      }
    });
  }

  // Notification panel toggle dropdown
  const bellBtn = shadow.getElementById('admin-notif-bell-btn');
  const dropdown = shadow.getElementById('admin-notif-dropdown');

  if (bellBtn && dropdown) {
    bellBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dropdown.classList.toggle('show');
    });

    // Close notifications if clicking outside
    document.addEventListener('click', () => {
      dropdown.classList.remove('show');
    }, { once: true });
  }

  // Handle notification item navigation click
  shadow.querySelectorAll('.admin-notif-dropdown .notif-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = item.getAttribute('data-tab');
      const alertId = item.getAttribute('data-id');
      
      if (alertId) {
        let readAlerts = [];
        try {
          readAlerts = JSON.parse(localStorage.getItem('SWEETOS_admin_read_alerts') || '[]');
        } catch(e) {}
        
        if (!readAlerts.includes(alertId)) {
          readAlerts.push(alertId);
          localStorage.setItem('SWEETOS_admin_read_alerts', JSON.stringify(readAlerts));
        }
      }
      
      if (tab) {
        context.currentTab = tab;
      }
      
      context.render();
      context.attachListeners();
      
      // Keep dropdown expanded on click to show marked-as-read state
      const dropdown = shadow.getElementById('admin-notif-dropdown');
      if (dropdown) {
        dropdown.classList.add('show');
      }
    });
  });
}
