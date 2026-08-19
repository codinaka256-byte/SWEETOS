export function renderAdminSettings(context) {
  const currentSubTab = context.settingsSubTab || 'general';

  return `
    <div class="settings-grid">
      
      <!-- Settings Nav Sidebar (10 tabs) -->
      <nav class="settings-nav">
        <a href="#" class="settings-nav-item ${currentSubTab === 'general' ? 'active' : ''}" data-subtab="general">
          <span>General Store Info</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'brand' ? 'active' : ''}" data-subtab="brand">
          <span>Brand Colors & SEO</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'categories' ? 'active' : ''}" data-subtab="categories">
          <span>Category Settings</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'brands_list' ? 'active' : ''}" data-subtab="brands_list">
          <span>Brand Directory</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'notifications' ? 'active' : ''}" data-subtab="notifications">
          <span>Notification Rules</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'localization' ? 'active' : ''}" data-subtab="localization">
          <span>Localization (Currency)</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'user' ? 'active' : ''}" data-subtab="user">
          <span>Security & Passwords</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'shipping' ? 'active' : ''}" data-subtab="shipping">
          <span>Shipping Settings</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'tax' ? 'active' : ''}" data-subtab="tax">
          <span>Tax Settings</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'payment' ? 'active' : ''}" data-subtab="payment">
          <span>Payment Gateways</span>
        </a>
        <a href="#" class="settings-nav-item ${currentSubTab === 'appearance' ? 'active' : ''}" data-subtab="appearance">
          <span>Appearance Settings</span>
        </a>
      </nav>

      <!-- Subtab Content viewport -->
      <div class="settings-content-pane glass-panel">
        ${renderSettingsSubtabContent(context, currentSubTab)}
      </div>

    </div>
  `;
}

function renderSettingsSubtabContent(context, subtab) {
  // Read current saved values or defaults
  const storeName = localStorage.getItem('SWEETOS_store_name') || 'SWEETOS';
  const storeDesc = localStorage.getItem('SWEETOS_store_desc') || 'Discover SWEETOS, a high-end dashboard-style showcase of minimalist tech and desk gear with premium white and ice-blue aesthetics.';
  const storeEmail = localStorage.getItem('SWEETOS_store_email') || 'support@sweetos.com';
  const storeAddr = localStorage.getItem('SWEETOS_store_addr') || 'Abidjan, Cocody Mermoz';

  const brandTagline = localStorage.getItem('SWEETOS_brand_tagline') || 'Premium Tech & Workspace Accessories';
  const primaryColor = localStorage.getItem('SWEETOS_brand_color_primary') || '#0052cc';
  const accentColor = localStorage.getItem('SWEETOS_brand_color_accent') || '#00b4d8';
  const seoDesc = localStorage.getItem('SWEETOS_seo_desc') || 'Discover SWEETOS, premium minimal layout gear.';
  const fbUrl = localStorage.getItem('SWEETOS_fb_url') || 'https://facebook.com/sweetos';
  const igUrl = localStorage.getItem('SWEETOS_ig_url') || 'https://instagram.com/sweetos';

  const notifEmail = localStorage.getItem('SWEETOS_notif_email') !== 'false';
  const notifStock = localStorage.getItem('SWEETOS_notif_stock') !== 'false';
  const notifThreshold = localStorage.getItem('SWEETOS_notif_threshold') || '5';

  const currency = localStorage.getItem('SWEETOS_currency') || 'CFA';
  const timezone = localStorage.getItem('SWEETOS_timezone') || 'GMT';

  const shippingRate = localStorage.getItem('SWEETOS_shipping_rate') || '2000';
  const freeShippingThreshold = localStorage.getItem('SWEETOS_free_shipping_threshold') || '100000';
  const shippingProvider = localStorage.getItem('SWEETOS_shipping_provider') || 'Standard Post';

  const vatRate = localStorage.getItem('SWEETOS_vat_rate') || '18';
  const taxMode = localStorage.getItem('SWEETOS_tax_mode') || 'inclusive';

  const codEnabled = localStorage.getItem('SWEETOS_payment_cod_enabled') !== 'false';
  const momoEnabled = localStorage.getItem('SWEETOS_payment_momo_enabled') !== 'false';
  const cardEnabled = localStorage.getItem('SWEETOS_payment_card_enabled') === 'true';
  const momoInstructions = localStorage.getItem('SWEETOS_payment_momo_instructions') || 'Veuillez transférer au +225 0700000000 puis soumettre.';

  const themeMode = localStorage.getItem('SWEETOS_theme_mode') || 'dark';
  const fontFamily = localStorage.getItem('SWEETOS_font_family') || 'Outfit';
  const heroTitle = localStorage.getItem('SWEETOS_hero_title') || 'SWEETOS Layouts';
  const heroSubtitle = localStorage.getItem('SWEETOS_hero_subtitle') || 'Uncompromising aesthetics for developers & creators';

  switch (subtab) {
    case 'general':
      const storePhone = localStorage.getItem('SWEETOS_store_phone') || '+225 05 00 61 99 23';
      const storeHours = localStorage.getItem('SWEETOS_store_hours') || 'Mon - Fri: 7:00 AM - 8:00 PM | Sun: Closed';
      const storeAboutStory = localStorage.getItem('SWEETOS_store_about_story') || 'SWEETOS was founded to rescue professionals from cluttered, generic desks. By sourcing only the finest premium materials — including solid oak, CNC-milled aluminum, and artisan felt wool — we deliver functional luxury that is made to last a lifetime.';
      const storeEntranceImage = localStorage.getItem('SWEETOS_store_entrance_image') || './assets/succes_technology_store_1786799642676.jpg';

      return `
        <h3>General Store Info</h3>
        <p class="section-desc">Manage store name, descriptors, contact numbers, physical addresses, and storefront banner.</p>
        
        <form class="settings-form" id="settings-general-form">
          <div class="form-group">
            <label>Store Name</label>
            <input type="text" id="set-store-name" value="${storeName}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Store Description</label>
            <textarea id="set-store-desc" class="admin-input" rows="3">${storeDesc}</textarea>
          </div>
          <div class="form-group">
            <label>Contact Email</label>
            <input type="email" id="set-store-email" value="${storeEmail}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Contact Phone Number</label>
            <input type="text" id="set-store-phone" value="${storePhone}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Physical Store Address</label>
            <input type="text" id="set-store-addr" value="${storeAddr}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Opening Hours</label>
            <input type="text" id="set-store-hours" value="${storeHours}" class="admin-input">
          </div>
          <div class="form-group">
            <label>About Us / Brand Story</label>
            <textarea id="set-store-about-story" class="admin-input" rows="4">${storeAboutStory}</textarea>
          </div>
          
          <div class="form-group">
            <label>Shop Entrance Image</label>
            <div class="image-upload-dropzone" id="entrance-image-dropzone" style="height: 180px; margin-top: 6px;">
              <input type="file" id="entrance-image-file-input" accept="image/*" style="display:none;">
              
              <div class="dropzone-empty-state" id="entrance-dropzone-empty" style="${storeEntranceImage ? 'display:none;' : ''}">
                <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" stroke-width="2" style="width:24px; height:24px; margin-bottom:8px;">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
                <span class="upload-title">CLICK TO UPLOAD SHOP IMAGE</span>
                <span class="upload-formats">JPEG · PNG · WEBP</span>
              </div>
              
              <div class="dropzone-preview-state" id="entrance-dropzone-preview" style="${storeEntranceImage ? '' : 'display:none;'}">
                <img id="entrance-image-preview" src="${storeEntranceImage}" alt="Entrance Preview" style="width:100%; height:100%; object-fit:cover;">
                <button type="button" class="remove-preview-btn" id="remove-entrance-image-btn" title="Remove image">&times;</button>
              </div>
            </div>
            <input type="hidden" id="set-store-entrance-img" value="${storeEntranceImage}">
          </div>
          
          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save General Changes</button>
        </form>
      `;
    case 'brand':
      return `
        <h3>Brand Colors & SEO Configuration</h3>
        <p class="section-desc">Custom brand tagline, logos, specific hex color accents, and social links.</p>
        
        <form class="settings-form" id="settings-brand-form">
          <div class="form-group">
            <label>Brand Tagline</label>
            <input type="text" id="set-brand-tagline" value="${brandTagline}" class="admin-input">
          </div>
          
          <div class="colors-row" style="display:flex; gap:16px;">
            <div class="form-group flex-1">
              <label>Primary Brand Color</label>
              <div class="flex gap-2" style="display:flex; gap:8px;">
                <input type="color" id="set-color-primary" value="${primaryColor}" class="admin-color-picker">
                <input type="text" id="set-color-primary-hex" value="${primaryColor.toUpperCase()}" class="admin-input" style="width: 100px;">
              </div>
            </div>
            <div class="form-group flex-1">
              <label>Accent Brand Color</label>
              <div class="flex gap-2" style="display:flex; gap:8px;">
                <input type="color" id="set-color-accent" value="${accentColor}" class="admin-color-picker">
                <input type="text" id="set-color-accent-hex" value="${accentColor.toUpperCase()}" class="admin-input" style="width: 100px;">
              </div>
            </div>
          </div>
          
          <div class="form-group">
            <label>SEO Meta Description</label>
            <input type="text" id="set-seo-desc" value="${seoDesc}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Facebook Page Link</label>
            <input type="url" id="set-fb-url" value="${fbUrl}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Instagram Page Link</label>
            <input type="url" id="set-ig-url" value="${igUrl}" class="admin-input">
          </div>

          <button type="submit" class="admin-btn admin-btn-primary mt-4">Apply Branding Settings</button>
        </form>
      `;
    case 'categories':
      if (context.showCategoryModal === undefined) context.showCategoryModal = false;
      if (context.editingCategory === undefined) context.editingCategory = null;

      return `
        <style>
          .cat-type-option-card:hover {
            border-color: rgba(16, 185, 129, 0.4) !important;
          }
          .save-cat-gradient-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5) !important;
          }
          .switch-modern input:checked + .slider-modern {
            background-color: #10b981 !important;
          }
          .switch-modern input:checked + .slider-modern:before {
            transform: translateX(20px) !important;
          }
          .slider-modern:before {
            position: absolute;
            content: "";
            height: 16px;
            width: 16px;
            left: 3px;
            bottom: 3px;
            background-color: white;
            transition: .3s;
            border-radius: 50%;
          }
        </style>

        <div class="flex justify-between items-center mb-4" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div style="background: rgba(16, 185, 129, 0.1); width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 10px; font-size: 20px; color: #10b981;">📁</div>
            <div style="display: flex; flex-direction: column; gap: 4px;">
              <h3 style="margin: 0; font-size: 18px; font-weight: 850; color: var(--text-dark); text-transform: uppercase;">Category Management</h3>
              <p class="section-desc" style="margin: 0; font-size: 13px; color: var(--text-light);">${context.categories.length} categories in your store</p>
            </div>
          </div>
          <button class="admin-btn admin-btn-primary" id="add-cat-btn" style="font-size:12.5px; height:38px; padding:0 16px; display:flex; align-items:center; gap:6px; font-weight: 800;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Category</span>
          </button>
        </div>
        
        <!-- Categories Table Grid -->
        <div class="admin-table-panel glass-panel" style="margin-top: 16px;">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 80px;">Icon</th>
                  <th>Category Name</th>
                  <th>Slug Path</th>
                  <th>Total Products</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${context.categories.map(c => {
                  const prodCount = context.products.filter(p => p.category === c.name).length;
                  return `
                    <tr>
                      <td style="font-size: 20px; text-align: center;">${c.icon || '📁'}</td>
                      <td><strong>${c.name}</strong></td>
                      <td><code>/category/${c.slug}</code></td>
                      <td>
                        <span class="status-badge ${prodCount > 0 ? 'status-blue' : 'status-yellow'}" style="font-weight:750;">
                          ${prodCount} products
                        </span>
                      </td>
                      <td>
                        <div class="row-actions" style="justify-content: flex-end; gap: 8px;">
                          <button class="edit-cat-action-btn admin-btn admin-btn-secondary" data-cat-id="${c.id}" style="padding: 6px 12px; font-size: 12px; font-weight:700;">Edit</button>
                          <button class="delete-cat-action-btn delete-prod-action-btn" data-cat-id="${c.id}" style="padding: 6px 12px; font-size: 12px; font-weight:700;">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Category Modal Overlay -->
        <div class="modal-backdrop ${context.showCategoryModal ? 'show' : ''}" id="cat-modal-backdrop" style="z-index: 1100;">
          <div class="modal-wrapper product-form-dark-wrapper glass-panel animate-in" style="max-width: 900px; background: #090d16 !important; color: #f8fafc !important; padding: 32px; border: 1px solid rgba(255,255,255,0.05) !important; border-radius: 20px;">
            
            <div class="modal-header-modern" style="margin-bottom: 28px; display: flex; align-items: center; justify-content: space-between;">
              <div style="display: flex; align-items: center; gap: 12px;">
                <div style="background: rgba(16, 185, 129, 0.1); width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 18px; color: #10b981; font-weight: bold; display: flex; align-items: center; justify-content: center;">+</div>
                <h3 style="text-transform: uppercase; font-size: 16px; font-weight: 850; color: #ffffff; margin:0; letter-spacing: 0.5px;">${context.editingCategory ? 'Edit Category' : 'Add New Category'}</h3>
              </div>
              <button class="back-circle-btn" id="close-cat-modal-btn" title="Close" style="width: 32px; height: 32px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px; display: block;">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>
            
            <div class="modal-body-modern" style="padding: 0; max-height: unset; overflow: unset;">
              <form id="cat-config-form" class="product-modern-form" style="display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 32px; max-width: 100%;">
                <input type="hidden" id="edit-cat-id" value="${context.editingCategory ? context.editingCategory.id : ''}">
                
                <!-- Left Column -->
                <div class="form-col-left" style="display: flex; flex-direction: column; gap: 20px;">
                  
                  <div class="form-group-modern">
                    <label>Category Name *</label>
                    <input type="text" id="cat-form-name" required placeholder="e.g. Workspace Accessories" value="${context.editingCategory ? context.editingCategory.name : ''}">
                  </div>
                  
                  <div class="form-group-modern">
                    <label>Category Slug (URL path) *</label>
                    <input type="text" id="cat-form-slug" required placeholder="e.g. workspace-accessories" value="${context.editingCategory ? context.editingCategory.slug : ''}">
                  </div>

                  <div class="form-group-modern">
                    <label>Category Type</label>
                    <div style="display: flex; gap: 12px; width: 100%;">
                      ${['L1', 'L2', 'L3'].map(lvl => {
                        const curLvl = context.editingCategory ? (context.editingCategory.type || 'L1') : (context.tempCategoryType || 'L1');
                        const isActive = curLvl === lvl;
                        const labelText = lvl === 'L1' ? 'PARENT (L1)' : (lvl === 'L2' ? 'SUBCAT (L2)' : 'MIDSUB (L3)');
                        const icon = lvl === 'L1' ? '📁' : (lvl === 'L2' ? '➔' : '⏹️');
                        return `
                          <div class="cat-type-option-card ${isActive ? 'active' : ''}" data-type="${lvl}" style="
                            flex: 1;
                            border: 1px solid ${isActive ? '#10b981' : 'rgba(255,255,255,0.08)'};
                            background: ${isActive ? 'rgba(16, 185, 129, 0.05)' : '#0c101b'};
                            padding: 12px;
                            border-radius: 8px;
                            cursor: pointer;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            gap: 8px;
                            transition: all 0.2s;
                          ">
                            <span style="font-size: 16px; color: ${isActive ? '#10b981' : '#64748b'};">${icon}</span>
                            <span style="font-size: 10px; font-weight: 800; color: ${isActive ? '#10b981' : '#94a3b8'}; letter-spacing: 0.5px; text-transform: uppercase;">${labelText}</span>
                          </div>
                        `;
                      }).join('')}
                    </div>
                    <input type="hidden" id="cat-form-type" value="${context.editingCategory ? (context.editingCategory.type || 'L1') : (context.tempCategoryType || 'L1')}">
                  </div>

                  <div class="form-group-modern" style="border: 1px solid rgba(255,255,255,0.08); background: #0c101b; padding: 14px 16px; border-radius: 12px; display: flex; flex-direction: row; align-items: center; justify-content: space-between; gap: 16px;">
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                      <span style="font-size: 12.5px; font-weight: 800; color: #ffffff;">Show Daily Deals Section</span>
                      <span style="font-size: 10px; font-weight: 600; color: #64748b; line-height: 1.3;">Enable or disable the daily deals list on this category landing page</span>
                    </div>
                    <div>
                      <label class="switch-modern" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                        <input type="checkbox" id="cat-form-daily-deals" ${(!context.editingCategory || context.editingCategory.showDailyDeals !== false) ? 'checked' : ''} style="opacity: 0; width: 0; height: 0;">
                        <span class="slider-modern" style="
                          position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
                          background-color: rgba(255,255,255,0.08); transition: .3s; border-radius: 24px;
                          border: 1px solid rgba(255,255,255,0.1);
                        "></span>
                      </label>
                    </div>
                  </div>

                  <div class="form-group-modern">
                    <label>Description</label>
                    <textarea id="cat-form-desc" rows="4" placeholder="Short description for this category..." style="resize: none;">${context.editingCategory ? (context.editingCategory.description || '') : ''}</textarea>
                  </div>
                </div>

                <!-- Right Column -->
                <div class="form-col-right" style="display: flex; flex-direction: column; gap: 20px;">
                  <div class="form-group-modern" style="height: 100%; display: flex; flex-direction: column;">
                    <label>Category Image</label>
                    <div class="image-upload-dropzone" id="cat-image-dropzone" style="
                      flex: 1;
                      border: 2px dashed rgba(255,255,255,0.08);
                      border-radius: 12px;
                      background: #0c101b;
                      display: flex;
                      flex-direction: column;
                      align-items: center;
                      justify-content: center;
                      gap: 12px;
                      padding: 24px;
                      cursor: pointer;
                      position: relative;
                      transition: border-color 0.2s;
                      min-height: 220px;
                    ">
                      <div id="cat-image-preview-wrapper" style="width: 100%; height: 100%; display: ${context.editingCategory && context.editingCategory.image ? 'block' : 'none'}; position: absolute; top:0; left:0; border-radius:10px; overflow:hidden;">
                        <img id="cat-image-preview" src="${context.editingCategory ? (context.editingCategory.image || '') : ''}" style="width: 100%; height: 100%; object-fit: cover;">
                        <button type="button" id="remove-cat-image-btn" style="position: absolute; top: 12px; right: 12px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center;">&times;</button>
                      </div>
                      <div id="cat-image-placeholder" style="display: ${context.editingCategory && context.editingCategory.image ? 'none' : 'flex'}; flex-direction: column; align-items: center; justify-content: center; gap: 10px;">
                        <span style="font-size: 32px; color: #64748b;">🖼️</span>
                        <span style="font-size: 12px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">CLICK TO UPLOAD</span>
                        <span style="font-size: 9.5px; font-weight: 600; color: #64748b;">JPEG - PNG - WEBP</span>
                      </div>
                      <input type="hidden" id="cat-form-image-val" value="${context.editingCategory ? (context.editingCategory.image || '') : ''}">
                      <input type="file" id="cat-image-file-input" accept="image/*" style="display:none;">
                    </div>
                  </div>

                  <div class="form-group-modern" style="margin-top: auto;">
                    <button type="submit" class="save-cat-gradient-btn" style="
                      width: 100%;
                      padding: 16px;
                      border-radius: 12px;
                      background: linear-gradient(135deg, #059669 0%, #10b981 100%);
                      color: #ffffff;
                      border: none;
                      font-size: 14px;
                      font-weight: 850;
                      cursor: pointer;
                      text-transform: uppercase;
                      letter-spacing: 0.5px;
                      transition: all 0.2s;
                      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.35);
                    ">Save Category</button>
                  </div>
                </div>

              </form>
            </div>
          </div>
        </div>
      `;
    case 'brands_list':
      if (context.showBrandModal === undefined) context.showBrandModal = false;
      if (context.editingBrand === undefined) context.editingBrand = null;

      return `
        <div class="flex justify-between items-center mb-4" style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 20px;">
          <div>
            <h3 style="margin: 0; font-size: 18px; font-weight: 850; color: var(--text-dark);">Brand Directory</h3>
            <p class="section-desc" style="margin: 4px 0 0 0; font-size: 13px; color: var(--text-light);">Manage your store product manufacturers, logos, and custom slugs.</p>
          </div>
          <button class="admin-btn admin-btn-primary" id="add-brand-btn" style="font-size:12.5px; height:36px; padding:0 16px; display:flex; align-items:center; gap:6px;">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width:16px; height:16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
            <span>Add Brand</span>
          </button>
        </div>
        
        <!-- Brands Table -->
        <div class="admin-table-panel glass-panel" style="margin-top: 16px;">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th style="width: 80px;">Logo</th>
                  <th>Brand Name</th>
                  <th>Slug Path</th>
                  <th>Total Products</th>
                  <th style="text-align: right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${context.brands.map(b => {
                  const prodCount = context.products.filter(p => {
                    if (p.brand && p.brand.toLowerCase() === b.name.toLowerCase()) return true;
                    return p.name.toLowerCase().startsWith(b.name.toLowerCase());
                  }).length;
                  return `
                    <tr>
                      <td style="font-size: 20px; text-align: center;">${b.logo || '🍭'}</td>
                      <td><strong>${b.name}</strong></td>
                      <td><code>/brand/${b.slug}</code></td>
                      <td>
                        <span class="status-badge ${prodCount > 0 ? 'status-blue' : 'status-yellow'}" style="font-weight:750;">
                          ${prodCount} products
                        </span>
                      </td>
                      <td>
                        <div class="row-actions" style="justify-content: flex-end; gap: 8px;">
                          <button class="edit-brand-action-btn admin-btn admin-btn-secondary" data-brand-id="${b.id}" style="padding: 6px 12px; font-size: 12px; font-weight:700;">Edit</button>
                          <button class="delete-brand-action-btn delete-prod-action-btn" data-brand-id="${b.id}" style="padding: 6px 12px; font-size: 12px; font-weight:700;">Delete</button>
                        </div>
                      </td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- Add/Edit Brand Modal Overlay -->
        <div class="modal-backdrop ${context.showBrandModal ? 'show' : ''}" id="brand-modal-backdrop" style="z-index: 1100;">
          <div class="modal-wrapper product-form-dark-wrapper glass-panel animate-in" style="max-width: 440px; background: #090d16 !important; color: #f8fafc !important; padding: 24px; border: 1px solid rgba(255,255,255,0.05) !important;">
            <div class="modal-header-modern" style="margin-bottom: 20px; display: flex; align-items: center; gap: 16px;">
              <button class="back-circle-btn" id="close-brand-modal-btn" title="Back to list" style="width: 32px; height: 32px;">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 14px; height: 14px; display: block;">
                  <line x1="19" y1="12" x2="5" y2="12"></line>
                  <polyline points="12 19 5 12 12 5"></polyline>
                </svg>
              </button>
              <div>
                <h3 style="text-transform: uppercase; font-size:15px; color: #ffffff; margin:0;">${context.editingBrand ? 'Edit Brand' : 'Create Brand'}</h3>
                <p style="font-size:12px; color: #64748b; margin:2px 0 0 0;">Configure manufacturer details below</p>
              </div>
            </div>
            
            <div class="modal-body-modern" style="padding: 0; max-height: unset; overflow: unset;">
              <form id="brand-config-form" class="product-modern-form" style="display: flex; flex-direction: column; gap: 16px; max-width: 100%;">
                <input type="hidden" id="edit-brand-id" value="${context.editingBrand ? context.editingBrand.id : ''}">
                
                <div class="form-group-modern">
                  <label>Brand Name *</label>
                  <input type="text" id="brand-form-name" required placeholder="e.g. Keychron Keyboard" value="${context.editingBrand ? context.editingBrand.name : ''}">
                </div>
                
                <div class="form-group-modern">
                  <label>Brand Slug (URL path) *</label>
                  <input type="text" id="brand-form-slug" required placeholder="e.g. keychron" value="${context.editingBrand ? context.editingBrand.slug : ''}">
                </div>

                <div class="form-group-modern">
                  <label>Brand Logo / Emoji *</label>
                  <input type="text" id="brand-form-logo" required placeholder="e.g. 🍏 or 🍭" value="${context.editingBrand ? (context.editingBrand.logo || '🍭') : '🍭'}" style="font-size: 18px;">
                </div>

                <div class="row-actions" style="margin-top: 12px; display:flex; justify-content: flex-end; gap: 12px;">
                  <button type="button" class="admin-btn admin-btn-secondary" id="cancel-brand-form-btn" style="padding: 10px 20px; font-weight:700;">Cancel</button>
                  <button type="submit" class="admin-btn admin-btn-primary" style="padding: 10px 20px; font-weight:700;">${context.editingBrand ? 'Save Changes' : 'Create Brand'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      `;
    case 'notifications':
      return `
        <h3>Notification Prefs & Stock Thresholds</h3>
        <p class="section-desc">Manage system alert preferences and low-stock warning limits.</p>
        
        <form class="settings-form" id="settings-notifications-form">
          <div class="checkbox-group mb-4" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="set-notif-email" ${notifEmail ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="set-notif-email">Send email notifications for new orders</label>
          </div>
          
          <div class="checkbox-group mb-4" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="set-notif-stock" ${notifStock ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="set-notif-stock">Enable real-time dashboard stock alerts</label>
          </div>

          <div class="form-group mt-4">
            <label>Low Stock Warning Threshold Level</label>
            <input type="number" id="set-threshold-num" value="${notifThreshold}" class="admin-input" min="1" max="100">
            <span class="form-help-text" style="color:var(--text-gray); font-size:11px; display:block; margin-top:4px;">Products with stock equal or lower than this level will show as low stock.</span>
          </div>

          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Threshold Settings</button>
        </form>
      `;
    case 'localization':
      return `
        <h3>Localization & Currency Preferences</h3>
        <p class="section-desc">Set active currency formatting, date/time zones, and display language.</p>
        
        <form class="settings-form" id="settings-localization-form">
          <div class="form-group">
            <label>Currency Symbol / Name</label>
            <select id="set-currency-select" class="admin-input">
              <option value="CFA" ${currency === 'CFA' ? 'selected' : ''}>FCFA - Franc CFA (West African CFA)</option>
              <option value="EUR" ${currency === 'EUR' ? 'selected' : ''}>EUR - Euro (€)</option>
              <option value="USD" ${currency === 'USD' ? 'selected' : ''}>USD - US Dollar ($)</option>
            </select>
          </div>
          
          <div class="form-group">
            <label>Timezone</label>
            <select id="set-timezone-select" class="admin-input">
              <option value="GMT" ${timezone === 'GMT' ? 'selected' : ''}>GMT (Greenwich Mean Time - Abidjan)</option>
              <option value="GMT+1" ${timezone === 'GMT+1' ? 'selected' : ''}>GMT+1 (Paris, Central European Time)</option>
              <option value="GMT+3" ${timezone === 'GMT+3' ? 'selected' : ''}>GMT+3 (East African Time)</option>
            </select>
          </div>

          <button type="submit" class="admin-btn admin-btn-primary mt-4">Apply Localization Changes</button>
        </form>
      `;
    case 'user':
      return `
        <h3>Security & Passwords</h3>
        <p class="section-desc">Change password credentials and inspect active browser sessions logs.</p>
        
        <div class="order-details-grid">
          <form class="settings-form" id="settings-password-form" style="flex:1;">
            <div class="form-group">
              <label>Current Password</label>
              <input type="password" id="set-pass-curr" required autocomplete="current-password" class="admin-input">
            </div>
            <div class="form-group">
              <label>New Password</label>
              <input type="password" id="set-pass-new" required autocomplete="new-password" class="admin-input">
            </div>
            <div class="form-group">
              <label>Confirm Password</label>
              <input type="password" id="set-pass-conf" required autocomplete="new-password" class="admin-input">
            </div>
            <div id="pass-change-msg" style="font-size:12.5px; margin-top:4px;"></div>
            
            <button type="submit" class="admin-btn admin-btn-danger mt-4">Change Admin Password</button>
          </form>

          <div class="sessions-history" style="flex:1; border-left:1px solid var(--border); padding-left:20px;">
            <h4 style="font-weight:800; font-size:14px; margin:0 0 10px 0;">Active Login Sessions</h4>
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div style="padding:10px; background:rgba(0, 82, 204, 0.05); border: 1px solid rgba(0, 82, 204, 0.1); border-radius:10px; font-size:12px; line-height:1.4;">
                <div style="display:flex; justify-content:space-between; margin-bottom:4px;">
                  <strong>Windows PC - Chrome Browser</strong>
                  <span style="color:#10b981; font-weight:700;">Active Session</span>
                </div>
                <span>IP: 197.234.34.12 • Location: Abidjan, CI</span>
                <p style="color:var(--text-gray); margin:4px 0 0 0; font-size:11px;">Authenticated: Today 09:48</p>
              </div>
            </div>
          </div>
        </div>
      `;
    case 'shipping':
      return `
        <h3>Shipping Settings</h3>
        <p class="section-desc">Configure order shipping rates, regional delivery rules, and providers.</p>
        
        <form class="settings-form" id="settings-shipping-form">
          <div class="form-group">
            <label>Standard Shipping Rate (CFA)</label>
            <input type="number" id="set-shipping-rate" value="${shippingRate}" class="admin-input" min="0">
          </div>
          <div class="form-group">
            <label>Free Shipping Threshold (CFA)</label>
            <input type="number" id="set-shipping-free-thresh" value="${freeShippingThreshold}" class="admin-input" min="0">
          </div>
          <div class="form-group">
            <label>Default Shipping Provider</label>
            <select id="set-shipping-provider" class="admin-input">
              <option value="Standard Post" ${shippingProvider === 'Standard Post' ? 'selected' : ''}>Standard Post (PosteCI)</option>
              <option value="Express Courier" ${shippingProvider === 'Express Courier' ? 'selected' : ''}>Express Courier (Abidjan Delivery)</option>
              <option value="DHL Express" ${shippingProvider === 'DHL Express' ? 'selected' : ''}>DHL Express International</option>
            </select>
          </div>
          
          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Shipping Settings</button>
        </form>
      `;
    case 'tax':
      return `
        <h3>Tax Configuration</h3>
        <p class="section-desc">Manage regional VAT rules and sales tax calculation modes.</p>
        
        <form class="settings-form" id="settings-tax-form">
          <div class="form-group">
            <label>Value Added Tax (VAT) Rate (%)</label>
            <input type="number" id="set-tax-vat" value="${vatRate}" class="admin-input" min="0" max="100">
          </div>
          <div class="form-group">
            <label>Tax Calculation Mode</label>
            <select id="set-tax-mode" class="admin-input">
              <option value="inclusive" ${taxMode === 'inclusive' ? 'selected' : ''}>Prices Displayed Are Inclusive of Tax</option>
              <option value="exclusive" ${taxMode === 'exclusive' ? 'selected' : ''}>Add Tax Separately at Checkout Page</option>
            </select>
          </div>
          
          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Tax Settings</button>
        </form>
      `;
    case 'payment':
      return `
        <h3>Payment Gateways</h3>
        <p class="section-desc">Toggle payment modes and specify merchant payment setup rules.</p>
        
        <form class="settings-form" id="settings-payment-form">
          <div class="checkbox-group mb-4" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="set-pay-cod" ${codEnabled ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="set-pay-cod">Enable Cash on Delivery (COD)</label>
          </div>
          
          <div class="checkbox-group mb-4" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="set-pay-momo" ${momoEnabled ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="set-pay-momo">Enable Mobile Money Transfer (Orange, Wave, MTN)</label>
          </div>

          <div class="form-group" id="pay-momo-instructions-group" style="display: ${momoEnabled ? 'block' : 'none'};">
            <label>Mobile Money Payment Checkout Instructions</label>
            <textarea id="set-pay-momo-instructions" class="admin-input" rows="2">${momoInstructions}</textarea>
          </div>

          <div class="checkbox-group mb-4 mt-4" style="display:flex; align-items:center; gap:10px;">
            <input type="checkbox" id="set-pay-card" ${cardEnabled ? 'checked' : ''} style="width:18px; height:18px; cursor:pointer;">
            <label for="set-pay-card">Enable Credit/Debit Card Payments (Stripe/Paystack Demo)</label>
          </div>
          
          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Payment Gateways</button>
        </form>
      `;
    case 'appearance':
      return `
        <h3>Appearance Settings</h3>
        <p class="section-desc">Customize store theme mode, font typography, and homepage banner.</p>
        
        <form class="settings-form" id="settings-appearance-form">
          <div class="form-group">
            <label>Color Theme Mode</label>
            <select id="set-appearance-theme" class="admin-input">
              <option value="dark" ${themeMode === 'dark' ? 'selected' : ''}>Dark Premium Mode (Default)</option>
              <option value="light" ${themeMode === 'light' ? 'selected' : ''}>Light Clean Mode</option>
              <option value="system" ${themeMode === 'system' ? 'selected' : ''}>Sync with System/Device Mode</option>
            </select>
          </div>
          <div class="form-group">
            <label>Brand Display Font Family</label>
            <select id="set-appearance-font" class="admin-input">
              <option value="Outfit" ${fontFamily === 'Outfit' ? 'selected' : ''}>Outfit (Modern Geometric Sans)</option>
              <option value="Inter" ${fontFamily === 'Inter' ? 'selected' : ''}>Inter (Functional UI Sans)</option>
              <option value="Roboto" ${fontFamily === 'Roboto' ? 'selected' : ''}>Roboto (Classic Clean Sans)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Store Hero Banner Title</label>
            <input type="text" id="set-appearance-hero-title" value="${heroTitle}" class="admin-input">
          </div>
          <div class="form-group">
            <label>Store Hero Banner Subtitle</label>
            <input type="text" id="set-appearance-hero-subtitle" value="${heroSubtitle}" class="admin-input">
          </div>
          
          <button type="submit" class="admin-btn admin-btn-primary mt-4">Save Appearance Settings</button>
        </form>
      `;
    default:
      return '';
  }
}

export function attachAdminSettingsListeners(context, shadow) {
  // Settings subtab click
  shadow.querySelectorAll('.settings-nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const subtab = item.getAttribute('data-subtab');
      context.settingsSubTab = subtab;
      sessionStorage.setItem('SWEETOS_admin_settings_subtab', subtab);
      context.render();
      context.attachListeners();
    });
  });

  // General form submit
  const genForm = shadow.getElementById('settings-general-form');
  if (genForm) {
    genForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const storeName = shadow.getElementById('set-store-name').value.trim();
      const storeDesc = shadow.getElementById('set-store-desc').value.trim();
      const storeEmail = shadow.getElementById('set-store-email').value.trim();
      const storePhone = shadow.getElementById('set-store-phone').value.trim();
      const storeAddr = shadow.getElementById('set-store-addr').value.trim();
      const storeHours = shadow.getElementById('set-store-hours').value.trim();
      const storeAboutStory = shadow.getElementById('set-store-about-story').value.trim();
      const storeEntranceImg = shadow.getElementById('set-store-entrance-img').value;

      localStorage.setItem('SWEETOS_store_name', storeName);
      localStorage.setItem('SWEETOS_store_desc', storeDesc);
      localStorage.setItem('SWEETOS_store_email', storeEmail);
      localStorage.setItem('SWEETOS_store_phone', storePhone);
      localStorage.setItem('SWEETOS_store_addr', storeAddr);
      localStorage.setItem('SWEETOS_store_hours', storeHours);
      localStorage.setItem('SWEETOS_store_about_story', storeAboutStory);
      localStorage.setItem('SWEETOS_store_entrance_image', storeEntranceImg);

      window.dispatchEvent(new CustomEvent('branding:updated'));
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'General store information saved successfully.' }));
    });

    // Image Upload Dropzone listeners for Shop Entrance image
    const dropzone = shadow.getElementById('entrance-image-dropzone');
    const fileInput = shadow.getElementById('entrance-image-file-input');
    const removeImgBtn = shadow.getElementById('remove-entrance-image-btn');
    const imgUrlVal = shadow.getElementById('set-store-entrance-img');
    const dropzoneEmpty = shadow.getElementById('entrance-dropzone-empty');
    const dropzonePreview = shadow.getElementById('entrance-dropzone-preview');
    const previewImg = shadow.getElementById('entrance-image-preview');

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (ev) => {
        if (ev.target.closest('#remove-entrance-image-btn')) return;
        fileInput.click();
      });

      fileInput.addEventListener('change', () => {
        const file = fileInput.files[0];
        if (file) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const dataUrl = ev.target.result;
            imgUrlVal.value = dataUrl;
            previewImg.src = dataUrl;
            dropzoneEmpty.style.display = 'none';
            dropzonePreview.style.display = 'block';
          };
          reader.readAsDataURL(file);
        }
      });
    }

    if (removeImgBtn) {
      removeImgBtn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        fileInput.value = '';
        imgUrlVal.value = '';
        previewImg.src = '';
        dropzoneEmpty.style.display = 'flex';
        dropzonePreview.style.display = 'none';
      });
    }
  }

  // Brand form submit & interactive hex syncing
  const brandForm = shadow.getElementById('settings-brand-form');
  if (brandForm) {
    brandForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const primary = shadow.getElementById('set-color-primary').value;
      const accent = shadow.getElementById('set-color-accent').value;
      const tagline = shadow.getElementById('set-brand-tagline').value.trim();
      const seo = shadow.getElementById('set-seo-desc').value.trim();
      const fb = shadow.getElementById('set-fb-url').value.trim();
      const ig = shadow.getElementById('set-ig-url').value.trim();

      localStorage.setItem('SWEETOS_brand_color_primary', primary);
      localStorage.setItem('SWEETOS_brand_color_accent', accent);
      localStorage.setItem('SWEETOS_brand_tagline', tagline);
      localStorage.setItem('SWEETOS_seo_desc', seo);
      localStorage.setItem('SWEETOS_fb_url', fb);
      localStorage.setItem('SWEETOS_ig_url', ig);
      window.dispatchEvent(new CustomEvent('branding:updated'));
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Branding options updated successfully!' }));
    });

    const primaryPick = shadow.getElementById('set-color-primary');
    const primaryHex = shadow.getElementById('set-color-primary-hex');
    const accentPick = shadow.getElementById('set-color-accent');
    const accentHex = shadow.getElementById('set-color-accent-hex');
    
    if (primaryPick && primaryHex) {
      primaryPick.addEventListener('input', (ev) => { primaryHex.value = ev.target.value.toUpperCase(); });
      primaryHex.addEventListener('input', (ev) => { if (/^#[0-9A-F]{6}$/i.test(ev.target.value)) { primaryPick.value = ev.target.value; } });
    }
    if (accentPick && accentHex) {
      accentPick.addEventListener('input', (ev) => { accentHex.value = ev.target.value.toUpperCase(); });
      accentHex.addEventListener('input', (ev) => { if (/^#[0-9A-F]{6}$/i.test(ev.target.value)) { accentPick.value = ev.target.value; } });
    }
  }

  // Open Add Category Modal
  const addCat = shadow.getElementById('add-cat-btn');
  if (addCat) {
    addCat.addEventListener('click', () => {
      context.showCategoryModal = true;
      context.editingCategory = null;
      context.render();
      context.attachListeners();
    });
  }

  // Edit Category button
  shadow.querySelectorAll('.edit-cat-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-cat-id'));
      const cat = context.categories.find(c => c.id === id);
      if (cat) {
        context.editingCategory = { ...cat };
        context.showCategoryModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Modal Close/Cancel
  const closeCatModal = shadow.getElementById('close-cat-modal-btn');
  const cancelCatForm = shadow.getElementById('cancel-cat-form-btn');
  const catBackdrop = shadow.getElementById('cat-modal-backdrop');

  const closeCategoryModal = () => {
    context.showCategoryModal = false;
    context.editingCategory = null;
    context.render();
    context.attachListeners();
  };

  if (closeCatModal) closeCatModal.addEventListener('click', closeCategoryModal);
  if (cancelCatForm) cancelCatForm.addEventListener('click', closeCategoryModal);
  if (catBackdrop) {
    catBackdrop.addEventListener('click', (e) => {
      if (e.target === catBackdrop) closeCategoryModal();
    });
  }

  // Category type selection card toggles
  shadow.querySelectorAll('.cat-type-option-card').forEach(card => {
    card.addEventListener('click', () => {
      const type = card.getAttribute('data-type');
      shadow.getElementById('cat-form-type').value = type;
      context.tempCategoryType = type;
      
      // Update active state visual styles
      shadow.querySelectorAll('.cat-type-option-card').forEach(c => {
        c.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        c.style.background = '#0c101b';
        const label = c.querySelector('span:last-child');
        const iconElement = c.querySelector('span:first-child');
        if (label) label.style.color = '#94a3b8';
        if (iconElement) iconElement.style.color = '#64748b';
      });
      
      card.style.borderColor = '#10b981';
      card.style.background = 'rgba(16, 185, 129, 0.05)';
      const activeLabel = card.querySelector('span:last-child');
      const activeIconElement = card.querySelector('span:first-child');
      if (activeLabel) activeLabel.style.color = '#10b981';
      if (activeIconElement) activeIconElement.style.color = '#10b981';
    });
  });

  // Category image upload click
  const catImageDropzone = shadow.getElementById('cat-image-dropzone');
  const catFileInput = shadow.getElementById('cat-image-file-input');
  if (catImageDropzone && catFileInput) {
    catImageDropzone.addEventListener('click', (e) => {
      if (e.target.id === 'remove-cat-image-btn') {
        e.stopPropagation();
        shadow.getElementById('cat-form-image-val').value = '';
        shadow.getElementById('cat-image-preview-wrapper').style.display = 'none';
        shadow.getElementById('cat-image-placeholder').style.display = 'flex';
        catFileInput.value = '';
        if (context.editingCategory) context.editingCategory.image = '';
        return;
      }
      
      // Open file browser selector
      catFileInput.click();
    });

    catFileInput.addEventListener('change', () => {
      const file = catFileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const dataUrl = ev.target.result;
          shadow.getElementById('cat-form-image-val').value = dataUrl;
          shadow.getElementById('cat-image-preview').src = dataUrl;
          shadow.getElementById('cat-image-preview-wrapper').style.display = 'block';
          shadow.getElementById('cat-image-placeholder').style.display = 'none';
          if (context.editingCategory) context.editingCategory.image = dataUrl;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Auto-generate Category Slug as user types name
  const catNameInput = shadow.getElementById('cat-form-name');
  const catSlugInput = shadow.getElementById('cat-form-slug');
  if (catNameInput && catSlugInput) {
    catNameInput.addEventListener('input', (e) => {
      const name = e.target.value;
      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      catSlugInput.value = autoSlug;
    });
  }

  // Category Configuration Form Submit
  const catForm = shadow.getElementById('cat-config-form');
  if (catForm) {
    catForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const cId = shadow.getElementById('edit-cat-id').value;
      const name = shadow.getElementById('cat-form-name').value.trim();
      const slug = shadow.getElementById('cat-form-slug').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const type = shadow.getElementById('cat-form-type').value;
      const showDailyDeals = shadow.getElementById('cat-form-daily-deals').checked;
      const description = shadow.getElementById('cat-form-desc').value.trim();
      const image = shadow.getElementById('cat-form-image-val').value.trim();
      
      const icon = type === 'L1' ? '📁' : (type === 'L2' ? '➔' : '⏹️');

      if (!name || !slug) return;

      if (cId) {
        // Edit mode
        const index = context.categories.findIndex(c => c.id === parseInt(cId));
        if (index !== -1) {
          // If category name changed, update category values of existing products
          const oldName = context.categories[index].name;
          if (oldName !== name) {
            context.products.forEach(p => {
              if (p.category === oldName) {
                p.category = name;
              }
            });
            context.saveDatabase('products');
          }
          
          context.categories[index] = { ...context.categories[index], name, slug, icon, type, showDailyDeals, description, image };
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Category "${name}" updated successfully.` }));
        }
      } else {
        // Add mode
        const dup = context.categories.some(c => c.slug === slug);
        if (dup) {
          window.showAlert('A category with this URL slug already exists. Please choose a different slug.', 'Duplicate Slug');
          return;
        }
        const nextId = context.categories.reduce((max, c) => c.id > max ? c.id : max, 0) + 1;
        context.categories.push({ id: nextId, name, slug, icon, type, showDailyDeals, description, image, parent: null, featured: false });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Category "${name}" created.` }));
      }

      context.saveDatabase('categories');
      context.showCategoryModal = false;
      context.editingCategory = null;
      context.tempCategoryType = null;
      context.render();
      context.attachListeners();
    });
  }

  // Delete category button action
  shadow.querySelectorAll('.delete-cat-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-cat-id'));
      const cat = context.categories.find(c => c.id === id);
      if (cat) {
        const hasProducts = context.products.some(p => p.category === cat.name);
        if (hasProducts) {
          window.showAlert(`Cannot delete category "${cat.name}" because it still has assigned catalog products!`, 'Action Blocked');
          return;
        }

        const confirmed = await window.showConfirm(`Are you sure you want to delete category "${cat.name}"?`, 'Delete Category');
        if (confirmed) {
          const idx = context.categories.findIndex(c => c.id === id);
          context.categories.splice(idx, 1);
          context.saveDatabase('categories');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Category "${cat.name}" deleted.` }));
          context.render();
          context.attachListeners();
        }
      }
    });
  });

  // Open Add Brand Modal
  const addBrand = shadow.getElementById('add-brand-btn');
  if (addBrand) {
    addBrand.addEventListener('click', () => {
      context.showBrandModal = true;
      context.editingBrand = null;
      context.render();
      context.attachListeners();
    });
  }

  // Edit Brand button
  shadow.querySelectorAll('.edit-brand-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-brand-id'));
      const brand = context.brands.find(b => b.id === id);
      if (brand) {
        context.editingBrand = { ...brand };
        context.showBrandModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Modal Close/Cancel
  const closeBrandModal = shadow.getElementById('close-brand-modal-btn');
  const cancelBrandForm = shadow.getElementById('cancel-brand-form-btn');
  const brandBackdrop = shadow.getElementById('brand-modal-backdrop');

  const closeBrandModalFn = () => {
    context.showBrandModal = false;
    context.editingBrand = null;
    context.render();
    context.attachListeners();
  };

  if (closeBrandModal) closeBrandModal.addEventListener('click', closeBrandModalFn);
  if (cancelBrandForm) cancelBrandForm.addEventListener('click', closeBrandModalFn);
  if (brandBackdrop) {
    brandBackdrop.addEventListener('click', (e) => {
      if (e.target === brandBackdrop) closeBrandModalFn();
    });
  }

  // Auto-generate Brand Slug as user types name
  const brandNameInput = shadow.getElementById('brand-form-name');
  const brandSlugInput = shadow.getElementById('brand-form-slug');
  if (brandNameInput && brandSlugInput) {
    brandNameInput.addEventListener('input', (e) => {
      const name = e.target.value;
      const autoSlug = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      brandSlugInput.value = autoSlug;
    });
  }

  // Brand Configuration Form Submit
  const brandConfigForm = shadow.getElementById('brand-config-form');
  if (brandConfigForm) {
    brandConfigForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const bId = shadow.getElementById('edit-brand-id').value;
      const name = shadow.getElementById('brand-form-name').value.trim();
      const slug = shadow.getElementById('brand-form-slug').value.trim().toLowerCase().replace(/[^a-z0-9]/g, '-');
      const logo = shadow.getElementById('brand-form-logo').value.trim() || '🍭';

      if (!name || !slug) return;

      if (bId) {
        // Edit mode
        const index = context.brands.findIndex(b => b.id === parseInt(bId));
        if (index !== -1) {
          // If brand name changed, update brand values of existing products
          const oldName = context.brands[index].name;
          if (oldName !== name) {
            context.products.forEach(p => {
              if (p.brand === oldName) {
                p.brand = name;
              }
            });
            context.saveDatabase('products');
          }
          
          context.brands[index] = { ...context.brands[index], name, slug, logo };
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Brand "${name}" updated successfully.` }));
        }
      } else {
        // Add mode
        const dup = context.brands.some(b => b.slug === slug);
        if (dup) {
          window.showAlert('A brand with this URL slug already exists. Please choose a different slug.', 'Duplicate Slug');
          return;
        }
        const nextId = context.brands.reduce((max, b) => b.id > max ? b.id : max, 0) + 1;
        context.brands.push({ id: nextId, name, slug, logo });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Brand "${name}" created.` }));
      }

      context.saveDatabase('brands');
      context.showBrandModal = false;
      context.editingBrand = null;
      context.render();
      context.attachListeners();
    });
  }

  // Delete brand button action
  shadow.querySelectorAll('.delete-brand-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-brand-id'));
      const brand = context.brands.find(b => b.id === id);
      if (brand) {
        const hasProducts = context.products.some(p => p.brand === brand.name);
        if (hasProducts) {
          window.showAlert(`Cannot delete brand "${brand.name}" because it still has assigned catalog products!`, 'Action Blocked');
          return;
        }

        const confirmed = await window.showConfirm(`Are you sure you want to delete brand "${brand.name}"?`, 'Delete Brand');
        if (confirmed) {
          const idx = context.brands.findIndex(b => b.id === id);
          context.brands.splice(idx, 1);
          context.saveDatabase('brands');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Brand "${brand.name}" deleted.` }));
          context.render();
          context.attachListeners();
        }
      }
    });
  });

  // Notification Rules submit
  const notForm = shadow.getElementById('settings-notifications-form');
  if (notForm) {
    notForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = shadow.getElementById('set-notif-email').checked;
      const stock = shadow.getElementById('set-notif-stock').checked;
      const threshold = parseInt(shadow.getElementById('set-threshold-num').value) || 5;
      
      localStorage.setItem('SWEETOS_notif_email', email ? 'true' : 'false');
      localStorage.setItem('SWEETOS_notif_stock', stock ? 'true' : 'false');
      localStorage.setItem('SWEETOS_notif_threshold', threshold.toString());

      context.products.forEach(p => {
        p.threshold = threshold;
      });
      context.saveDatabase('products');
      
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'System alert thresholds updated.' }));
    });
  }

  // Localization form submit
  const locForm = shadow.getElementById('settings-localization-form');
  if (locForm) {
    locForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const currency = shadow.getElementById('set-currency-select').value;
      const timezone = shadow.getElementById('set-timezone-select').value;

      localStorage.setItem('SWEETOS_currency', currency);
      localStorage.setItem('SWEETOS_timezone', timezone);

      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Localization settings applied.' }));
    });
  }

  // Password Security form submit
  const passForm = shadow.getElementById('settings-password-form');
  if (passForm) {
    passForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const curr = shadow.getElementById('set-pass-curr').value;
      const next = shadow.getElementById('set-pass-new').value;
      const conf = shadow.getElementById('set-pass-conf').value;
      const msgEl = shadow.getElementById('pass-change-msg');

      if (curr !== 'admin') {
        msgEl.style.color = '#ff4d4d';
        msgEl.textContent = 'Error: Current password is incorrect.';
        return;
      }
      if (next !== conf) {
        msgEl.style.color = '#ff4d4d';
        msgEl.textContent = 'Error: New passwords do not match.';
        return;
      }

      msgEl.style.color = '#10b981';
      msgEl.textContent = 'Password changed successfully.';
      shadow.getElementById('set-pass-curr').value = '';
      shadow.getElementById('set-pass-new').value = '';
      shadow.getElementById('set-pass-conf').value = '';
    });
  }

  // Shipping form submit (NEW)
  const shippingForm = shadow.getElementById('settings-shipping-form');
  if (shippingForm) {
    shippingForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const rate = shadow.getElementById('set-shipping-rate').value;
      const thresh = shadow.getElementById('set-shipping-free-thresh').value;
      const provider = shadow.getElementById('set-shipping-provider').value;

      localStorage.setItem('SWEETOS_shipping_rate', rate);
      localStorage.setItem('SWEETOS_free_shipping_threshold', thresh);
      localStorage.setItem('SWEETOS_shipping_provider', provider);

      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Shipping settings saved.' }));
    });
  }

  // Tax form submit (NEW)
  const taxForm = shadow.getElementById('settings-tax-form');
  if (taxForm) {
    taxForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const vat = shadow.getElementById('set-tax-vat').value;
      const mode = shadow.getElementById('set-tax-mode').value;

      localStorage.setItem('SWEETOS_vat_rate', vat);
      localStorage.setItem('SWEETOS_tax_mode', mode);

      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Tax configuration saved.' }));
    });
  }

  // Payment form submit & mommy visibility toggle (NEW)
  const paymentForm = shadow.getElementById('settings-payment-form');
  if (paymentForm) {
    const momoCheck = shadow.getElementById('set-pay-momo');
    const momoGroup = shadow.getElementById('pay-momo-instructions-group');

    if (momoCheck && momoGroup) {
      momoCheck.addEventListener('change', (ev) => {
        momoGroup.style.display = ev.target.checked ? 'block' : 'none';
      });
    }

    paymentForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const cod = shadow.getElementById('set-pay-cod').checked;
      const momo = shadow.getElementById('set-pay-momo').checked;
      const momoInst = shadow.getElementById('set-pay-momo-instructions').value;
      const card = shadow.getElementById('set-pay-card').checked;

      localStorage.setItem('SWEETOS_payment_cod_enabled', cod ? 'true' : 'false');
      localStorage.setItem('SWEETOS_payment_momo_enabled', momo ? 'true' : 'false');
      localStorage.setItem('SWEETOS_payment_momo_instructions', momoInst);
      localStorage.setItem('SWEETOS_payment_card_enabled', card ? 'true' : 'false');

      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Payment gateway configuration updated.' }));
    });
  }

  // Appearance form submit (NEW)
  const appearanceForm = shadow.getElementById('settings-appearance-form');
  if (appearanceForm) {
    appearanceForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const theme = shadow.getElementById('set-appearance-theme').value;
      const font = shadow.getElementById('set-appearance-font').value;
      const title = shadow.getElementById('set-appearance-hero-title').value.trim();
      const subtitle = shadow.getElementById('set-appearance-hero-subtitle').value.trim();

      localStorage.setItem('SWEETOS_theme_mode', theme);
      localStorage.setItem('SWEETOS_font_family', font);
      localStorage.setItem('SWEETOS_hero_title', title);
      localStorage.setItem('SWEETOS_hero_subtitle', subtitle);

      // Reactively apply theme settings
      document.body.className = theme === 'dark' ? 'dark-theme' : (theme === 'light' ? 'light-theme' : '');
      
      window.dispatchEvent(new CustomEvent('branding:updated'));
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Appearance options saved successfully.' }));
    });
  }
}
