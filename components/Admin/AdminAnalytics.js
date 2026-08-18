import { formatPrice } from '../../utils/storage.js';

export function renderAdminAnalytics(context) {
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
