import { formatPrice } from '../../utils/storage.js';

export function renderAdminAnalytics(context) {
  // Pre-seed mock customer activity logs if empty
  let sessionLogs = [];
  try {
    const rawLogs = localStorage.getItem('SWEETOS_activity_logs');
    if (!rawLogs) {
      sessionLogs = [
        { id: "mock_1", user: "Alina Putri", loginType: "Google OAuth", visits: ["Home", "Product: Keyboard Q1 Pro", "Cart", "Checkout Form"], bought: true, timestamp: "18 Aug, 02:32 PM", browser: "Chrome", device: "Desktop", source: "google.com" },
        { id: "mock_2", user: "Odinaka Chibuike", loginType: "Email & Password", visits: ["Home", "Catalog: Audio", "Product: Sennheiser HD 600"], bought: false, timestamp: "18 Aug, 03:10 PM", browser: "Safari", device: "Mobile", source: "Direct" },
        { id: "mock_3", user: "Guest User", loginType: "Guest Checkout", visits: ["Home", "Product: Solid Oak Riser Shelf", "Checkout Form"], bought: true, timestamp: "19 Aug, 09:15 AM", browser: "Firefox", device: "Desktop", source: "facebook.com" },
        { id: "mock_4", user: "Alex Johnson", loginType: "Not Logged In", visits: ["Home", "Product: Nebula Light Ring Dial"], bought: false, timestamp: "19 Aug, 10:44 AM", browser: "Chrome", device: "Mobile", source: "twitter.com" }
      ];
      localStorage.setItem('SWEETOS_activity_logs', JSON.stringify(sessionLogs));
    } else {
      sessionLogs = JSON.parse(rawLogs);
    }
  } catch (err) {
    sessionLogs = [];
  }

  // Pre-seed mock failed searches if empty
  let failedSearches = [];
  try {
    const rawSearches = localStorage.getItem('SWEETOS_failed_searches');
    if (!rawSearches) {
      failedSearches = [
        { query: "wood wrist rest", timestamp: "18 Aug, 04:05 PM" },
        { query: "mx master 3s mouse", timestamp: "19 Aug, 08:22 AM" },
        { query: "type-c braided cable", timestamp: "19 Aug, 11:05 AM" }
      ];
      localStorage.setItem('SWEETOS_failed_searches', JSON.stringify(failedSearches));
    } else {
      failedSearches = JSON.parse(rawSearches);
    }
  } catch (err) {
    failedSearches = [];
  }

  // Sort logs by time (newest first)
  const sortedSessionLogs = [...sessionLogs].reverse();
  const sortedFailedSearches = [...failedSearches].reverse();

  // Sales computations
  const totalSales = context.orders.filter(o => o.status !== 'Cancelled' && o.status !== 'Refusé').reduce((sum, o) => sum + o.total, 0);
  const completedOrders = context.orders.filter(o => o.status !== 'Cancelled').length;
  const avgOrderVal = completedOrders > 0 ? Math.round(totalSales / completedOrders) : 0;
  
  const totalFulfillable = context.orders.filter(o => o.status !== 'Cancelled').length;
  const fulfilledCount = context.orders.filter(o => o.status === 'Livré' || o.status === 'Done').length;
  const fulfillmentRate = totalFulfillable > 0 ? ((fulfilledCount / totalFulfillable) * 100).toFixed(1) : "100.0";

  // Best selling products calculations
  const bestSellersMap = new Map();
  context.orders.forEach(o => {
    if (o.status !== 'Cancelled' && o.status !== 'Refusé' && o.products) {
      o.products.forEach(item => {
        const count = bestSellersMap.get(item.id) || { name: item.name, price: item.price, sold: 0 };
        count.sold += (item.quantity || 1);
        bestSellersMap.set(item.id, count);
      });
    }
  });

  const bestSellers = Array.from(bestSellersMap.values())
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 5);

  // Category breakdown sales
  const catSales = {};
  context.orders.forEach(o => {
    if (o.status !== 'Cancelled' && o.status !== 'Refusé' && o.products) {
      o.products.forEach(item => {
        const cat = item.category || 'Uncategorized';
        catSales[cat] = (catSales[cat] || 0) + (item.price * (item.quantity || 1));
      });
    }
  });

  const catSalesList = Object.entries(catSales).map(([name, sales]) => ({
    name,
    sales,
    percentage: totalSales > 0 ? Math.round((sales / totalSales) * 100) : 0
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  return `
    <!-- Top-Level Performance Overview Cards -->
    <div class="orders-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <!-- Total Sales Gross -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">📈</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Gross Revenue</span>
          <strong style="font-size: 22px; font-weight: 850; color: var(--text-dark);">${formatPrice(totalSales)}</strong>
        </div>
      </div>

      <!-- Average Order Value -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(54, 179, 126, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #36b37e;">💳</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Average Order Spent</span>
          <strong style="font-size: 22px; font-weight: 850; color: #36b37e;">${formatPrice(avgOrderVal)}</strong>
        </div>
      </div>

      <!-- Fulfillment Success Rate -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(0, 180, 216, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #00b4d8;">⚡</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Fulfillment Success</span>
          <strong style="font-size: 22px; font-weight: 850; color: #00b4d8;">${fulfillmentRate}%</strong>
        </div>
      </div>

      <!-- Conversions -->
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4); box-shadow: 0 4px 20px rgba(0,0,0,0.02);">
        <div style="background: rgba(255, 86, 48, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ff5630;">🎯</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Conversion Rate</span>
          <strong style="font-size: 22px; font-weight: 850; color: #ff5630;">3.45%</strong>
        </div>
      </div>
    </div>

    <!-- Charts Panels Grid -->
    <div class="admin-columns-grid" style="margin-bottom: 24px;">
      
      <!-- Premium Area Chart: Monthly Turnover -->
      <div class="glass-panel" style="flex: 2; min-width: 320px;">
        <div class="col-header flex justify-between" style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <div>
            <h3 style="margin:0; font-size:16px; font-weight:850; color:var(--text-dark);">Monthly Store Performance</h3>
            <span class="sub" style="font-size:12.5px; color:var(--text-light);">Gross turnover path trend (CFA)</span>
          </div>
          <button class="admin-btn admin-btn-secondary" id="csv-export-btn" style="font-size:12px; height:34px; padding: 0 14px; font-weight:700;">Export Report</button>
        </div>
        
        <div class="chart-box" style="margin-top:24px; height: 200px; position:relative;">
          <svg viewBox="0 0 500 200" style="width:100%; height:100%; display:block;">
            <defs>
              <linearGradient id="area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.3"/>
                <stop offset="100%" stop-color="var(--primary)" stop-opacity="0"/>
              </linearGradient>
            </defs>

            <!-- Horizontal Grid Lines -->
            <line x1="40" y1="30" x2="460" y2="30" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="40" y1="80" x2="460" y2="80" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="40" y1="130" x2="460" y2="130" stroke="rgba(0,0,0,0.03)" stroke-width="1.5" stroke-dasharray="4"/>
            <line x1="40" y1="170" x2="460" y2="170" stroke="rgba(0,0,0,0.08)" stroke-width="1.5"/>

            <!-- Area Path with linear gradient -->
            <path d="M 50,170 L 50,130 L 130,90 L 210,140 L 290,70 L 370,40 L 450,55 L 450,170 Z" fill="url(#area-grad)" stroke="none"/>
            
            <!-- Stroke path on top -->
            <path d="M 50,130 L 130,90 L 210,140 L 290,70 L 370,40 L 450,55" fill="none" stroke="var(--primary)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
            
            <!-- Glow dot indicators on chart nodes -->
            <circle cx="50" cy="130" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="130" cy="90" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="210" cy="140" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="290" cy="70" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="370" cy="40" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>
            <circle cx="450" cy="55" r="4" fill="white" stroke="var(--primary)" stroke-width="3"/>

            <!-- Monthly labels -->
            <text x="50" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">Mar</text>
            <text x="130" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">Apr</text>
            <text x="210" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">May</text>
            <text x="290" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">Jun</text>
            <text x="370" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">Jul</text>
            <text x="450" y="190" fill="var(--text-light)" font-size="9.5" font-weight="700" text-anchor="middle">Aug</text>
          </svg>
        </div>
      </div>

      <!-- Category Sales Share Breakdown -->
      <div class="glass-panel" style="flex: 1; min-width: 280px; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <h3 style="margin:0; font-size:16px; font-weight:850; color:var(--text-dark);">Category Share</h3>
          <span class="sub" style="font-size:12.5px; color:var(--text-light); display:block; margin-bottom:16px;">Sales distribution by department</span>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:16px;">
          ${catSalesList.length === 0 ? `
            <p style="font-size:13px; color:var(--text-light); text-align:center; padding:20px 0;">No category sales data yet.</p>
          ` : catSalesList.map(c => `
            <div>
              <div style="display:flex; justify-content:space-between; font-size:13px; font-weight:700; color:var(--text-dark); margin-bottom:6px;">
                <span>${c.name}</span>
                <span style="color:var(--primary);">${formatPrice(c.sales)} (${c.percentage}%)</span>
              </div>
              <div style="width: 100%; height: 8px; background: rgba(0,0,0,0.04); border-radius: 4px; overflow: hidden;">
                <div style="width: ${c.percentage}%; height: 100%; background: linear-gradient(90deg, var(--primary) 0%, var(--primary-accent) 100%); border-radius: 4px;"></div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

    </div>

    <!-- Top-Selling Products list table -->
    <div class="admin-table-panel glass-panel">
      <div class="panel-header" style="margin-bottom: 16px;">
        <h3 style="margin:0; font-size:16px; font-weight:850; color:var(--text-dark);">Top-Selling Products</h3>
        <span class="sub" style="font-size:12.5px; color:var(--text-light);">Performances sorted by product quantities sold</span>
      </div>
      
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Product Name</th>
              <th>Unit Price</th>
              <th>Units Sold</th>
              <th style="text-align: right;">Gross Turnover</th>
            </tr>
          </thead>
          <tbody>
            ${bestSellers.length === 0 ? `
              <tr>
                <td colspan="5" class="text-center py-6 text-slate-400">No items sold yet. Run mock customer checkouts in the storefront to build data!</td>
              </tr>
            ` : bestSellers.map((b, index) => `
              <tr>
                <td><code style="font-weight:800; color:var(--primary); font-size:13.5px;"># ${index + 1}</code></td>
                <td><strong>${b.name}</strong></td>
                <td><strong>${formatPrice(b.price)}</strong></td>
                <td>
                  <span class="status-badge status-blue" style="font-weight:800;">
                    ${b.sold} units
                  </span>
                </td>
                <td style="text-align: right;"><strong class="text-success">${formatPrice(b.price * b.sold)}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Real-Time Customer Session & Search Insights (Two Columns) -->
    <div class="admin-columns-grid" style="margin-top: 24px; display: flex; gap: 24px; flex-wrap: wrap;">
      
      <!-- Session Activity Log Table -->
      <div class="glass-panel" style="flex: 2; min-width: 320px; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border); background: white;">
        <div style="margin-bottom: 16px;">
          <h3 style="margin:0; font-size:16px; font-weight:850; color:var(--text-dark);">Customer Sessions & Visits</h3>
          <span class="sub" style="font-size:12.5px; color:var(--text-light);">Real-time tracking of active store visitors, logins, and purchases</span>
        </div>
        <div class="table-wrapper" style="max-height: 300px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1.5px solid var(--border); text-align: left;">
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Customer</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Method</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Device / Browser</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Traffic Source</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Pages Visited</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Purchased</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light); text-align: right;">Time</th>
              </tr>
            </thead>
            <tbody>
              ${sortedSessionLogs.length === 0 ? `
                <tr>
                  <td colspan="7" style="text-align: center; padding: 20px; color: var(--text-light); font-size: 13px;">No active customer sessions recorded.</td>
                </tr>
              ` : sortedSessionLogs.map(s => `
                <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                  <td style="padding: 12px 10px; color: var(--text-dark);"><strong>${s.user}</strong></td>
                  <td style="padding: 12px 10px;"><span style="font-size: 11px; font-weight: 750; background: #e2e8f0; color: #475569; padding: 4px 8px; border-radius: 12px;">${s.loginType}</span></td>
                  <td style="padding: 12px 10px;">
                    <span style="font-size: 12px; font-weight: 700; color: var(--text-dark); display: inline-flex; align-items: center; gap: 4px;">
                      ${s.device === 'Mobile' ? '📱 Mobile' : s.device === 'Tablet' ? '📟 Tablet' : '💻 Desktop'}
                      <span style="font-size: 11px; font-weight: 600; color: var(--text-light);">(${s.browser || 'Chrome'})</span>
                    </span>
                  </td>
                  <td style="padding: 12px 10px;">
                    <span style="font-size: 11px; font-weight: 750; background: rgba(54, 179, 126, 0.08); color: #36b37e; padding: 4px 8px; border-radius: 6px; display: inline-block;">
                      🔗 ${s.source || 'Direct'}
                    </span>
                  </td>
                  <td style="padding: 12px 10px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${s.visits.join(' → ')}">
                    ${s.visits.map(v => `<span style="display: inline-block; background: rgba(0, 82, 204, 0.05); color: var(--primary); padding: 2px 6px; border-radius: 6px; font-size: 11px; margin-right: 4px; font-weight: 600;">${v}</span>`).join('')}
                  </td>
                  <td style="padding: 12px 10px;">
                    <span class="status-badge ${s.bought ? 'status-green' : 'status-yellow'}" style="font-weight: 800;">
                      ${s.bought ? 'Yes ✓' : 'No'}
                    </span>
                  </td>
                  <td style="padding: 12px 10px; text-align: right; color: var(--text-gray); font-size: 11.5px;">${s.timestamp}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Failed Searches Table -->
      <div class="glass-panel" style="flex: 1; min-width: 280px; padding: 24px; border-radius: 20px; border: 1.5px solid var(--border); background: white;">
        <div style="margin-bottom: 16px;">
          <h3 style="margin:0; font-size:16px; font-weight:850; color:var(--text-dark);">Unresolved Searches</h3>
          <span class="sub" style="font-size:12.5px; color:var(--text-light);">Customer search queries that returned 0 matches</span>
        </div>
        <div class="table-wrapper" style="max-height: 300px; overflow-y: auto;">
          <table style="width: 100%; border-collapse: collapse;">
            <thead>
              <tr style="border-bottom: 1.5px solid var(--border); text-align: left;">
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light);">Search Query</th>
                <th style="padding: 10px; font-size: 12px; font-weight: 750; color: var(--text-light); text-align: right;">Date</th>
              </tr>
            </thead>
            <tbody>
              ${sortedFailedSearches.length === 0 ? `
                <tr>
                  <td colspan="2" style="text-align: center; padding: 20px; color: var(--text-light); font-size: 13px;">No failed searches recorded.</td>
                </tr>
              ` : sortedFailedSearches.map(f => `
                <tr style="border-bottom: 1px solid var(--border); font-size: 13px;">
                  <td style="padding: 12px 10px;"><code style="font-size: 13px; font-weight: 750; color: #ef4444; background: rgba(239, 68, 68, 0.05); padding: 4px 8px; border-radius: 6px;">"${f.query}"</code></td>
                  <td style="padding: 12px 10px; text-align: right; color: var(--text-gray); font-size: 11.5px;">${f.timestamp || f.date || ''}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  `;
}

export function attachAdminAnalyticsListeners(context, shadow) {
  const csvBtn = shadow.getElementById('csv-export-btn');
  if (csvBtn) {
    csvBtn.addEventListener('click', () => {
      const csvContent = "data:text/csv;charset=utf-8," 
        + "Month,Turnover CFA,Orders Count\n"
        + "March,3200000,45\n"
        + "April,4500000,58\n"
        + "May,2900000,38\n"
        + "June,5100000,64\n"
        + "July,6200000,72\n"
        + "August,5800000,69\n";
        
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "SWEETOS_Monthly_Sales_Report.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'CSV sales report downloaded!' }));
    });
  }
}
