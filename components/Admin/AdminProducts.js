import { formatPrice } from '../../utils/storage.js';

export function renderAdminProducts(context) {
  const query = context.searchQuery || '';
  const cat = context.categoryFilter || 'All';
  const stockF = context.stockFilter || 'All';
  
  // Filter products list
  const filteredProducts = context.products.filter(p => {
    if (query) {
      const q = query.toLowerCase();
      if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
    }
    if (cat !== 'All' && p.category !== cat) return false;
    if (stockF !== 'All') {
      if (stockF === 'Low Stock' && (p.stock === undefined || p.stock > (p.threshold || 5))) return false;
      if (stockF === 'Out of Stock' && p.stock !== 0) return false;
    }
    return true;
  });

  // Pagination bounds
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / context.itemsPerPage) || 1;
  const startIndex = (context.currentPageIndex - 1) * context.itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + context.itemsPerPage);

  const isEditing = context.editingProduct !== null;
  const showModal = context.showProductModal;
  
  // Pre-fill active status state if editing
  const productStatus = context.editingProduct ? (context.editingProduct.status || 'Active') : (context.productStatus || 'Active');

  return `
    <div class="admin-table-filters-bar mb-4" style="margin-bottom: 20px;">
      <div style="display:flex; gap:12px;">
        <div class="search-box">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          <input type="text" id="product-search" placeholder="Search by name, SKU..." value="${query}" autocomplete="off">
        </div>
        
        <div class="filters-actions">
          <select id="product-cat-filter">
            <option value="All" ${cat === 'All' ? 'selected' : ''}>All Categories</option>
            ${context.categories.map(c => `<option value="${c.name}" ${cat === c.name ? 'selected' : ''}>${c.name}</option>`).join('')}
          </select>
          <select id="product-stock-filter">
            <option value="All" ${stockF === 'All' ? 'selected' : ''}>All Stock Levels</option>
            <option value="Low Stock" ${stockF === 'Low Stock' ? 'selected' : ''}>Low Stock</option>
            <option value="Out of Stock" ${stockF === 'Out of Stock' ? 'selected' : ''}>Out of Stock</option>
          </select>
        </div>
      </div>
      
      <button class="admin-btn admin-btn-primary" id="add-product-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Product</span>
      </button>
    </div>

    <!-- Products Catalog Table -->
    <div class="admin-table-panel glass-panel">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Image</th>
              <th>Product Name</th>
              <th>SKU</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${paginatedProducts.length === 0 ? `
              <tr>
                <td colspan="8" class="text-center py-6">No matching products found in the catalog.</td>
              </tr>
            ` : paginatedProducts.map(p => {
              const isLowStock = p.stock !== undefined && p.stock <= (p.threshold || 5);
              const isOutOfStock = p.stock === 0;
              const stockClass = isOutOfStock ? 'badge-danger' : (isLowStock ? 'badge-warning' : 'badge-success');
              const stockLabel = isOutOfStock ? 'Out of Stock' : (isLowStock ? `${p.stock} Warning` : `${p.stock} Units`);
              
              return `
                <tr class="${isLowStock ? 'low-stock-tr' : ''}">
                  <td>
                    <img src="${p.image || './assets/keyboard_1786712380801.jpg'}" class="table-product-thumb" alt="${p.name}">
                  </td>
                  <td><strong>${p.name}</strong></td>
                  <td><code style="font-weight:700;">${p.sku || 'N/A'}</code></td>
                  <td>${p.category}</td>
                  <td><strong>${formatPrice(p.price)}</strong></td>
                  <td>
                    <span class="stock-status-badge ${stockClass}">
                      ${stockLabel}
                    </span>
                  </td>
                  <td>
                    <span class="status-badge ${p.status === 'Draft' ? 'status-yellow' : 'status-green'}">
                      ${p.status || 'Active'}
                    </span>
                  </td>
                  <td>
                    <div class="row-actions">
                      <button class="edit-prod-action-btn" data-product-id="${p.id}" title="Edit product settings">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                      </button>
                      <button class="delete-prod-action-btn" data-product-id="${p.id}" title="Delete product">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px; flex-shrink: 0;"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
      
      <!-- Pagination controls -->
      <div class="pagination-footer">
        <span class="pagination-info">Showing ${startIndex + 1} to ${Math.min(startIndex + context.itemsPerPage, totalItems)} of ${totalItems} products</span>
        <div class="pagination-buttons">
          <button class="pag-btn" id="prev-page-btn" ${context.currentPageIndex === 1 ? 'disabled' : ''}>Previous</button>
          <span class="page-num">${context.currentPageIndex} / ${totalPages}</span>
          <button class="pag-btn" id="next-page-btn" ${context.currentPageIndex === totalPages ? 'disabled' : ''}>Next</button>
        </div>
      </div>
    </div>

    <!-- Product CRUD Modal overlay (Modern dark-slate multi-column upload theme) -->
    <div class="modal-backdrop ${showModal ? 'show' : ''}" id="prod-crud-modal">
      <div class="modal-wrapper product-form-dark-wrapper glass-panel animate-in">
        <!-- Modal Header -->
        <div class="modal-header-modern">
          <button class="back-circle-btn" id="close-prod-modal-btn" title="Back to list">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px; display: block;">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div>
            <h3 style="text-transform: uppercase;">${isEditing ? 'Edit Product Details' : 'Add New Product'}</h3>
            <p>Fill in the details below</p>
          </div>
        </div>
        
        <!-- Modal Body with Two Columns -->
        <div class="modal-body-modern custom-scroll">
          <form id="prod-crud-form" class="product-modern-form">
            <!-- Left Column -->
            <div class="form-col-left">
              
              <div class="form-group-modern">
                <label>PRODUCT NAME *</label>
                <input type="text" id="prod-name" required placeholder="e.g. MacBook Pro M3 Max" autocomplete="off" value="${isEditing ? context.editingProduct.name : ''}">
              </div>

              <div style="display:flex; gap:20px;">
                <div class="form-group-modern flex-1">
                  <label>SALE PRICE *</label>
                  <div class="price-input-wrapper">
                    <span class="currency-prefix">$</span>
                    <input type="number" id="prod-price" required step="0.01" placeholder="0.00" min="0" value="${isEditing ? context.editingProduct.price : ''}">
                  </div>
                </div>
                <div class="form-group-modern flex-1">
                  <label>% ORIGINAL PRICE</label>
                  <input type="number" id="prod-compare-price" step="0.01" placeholder="0.00" value="${isEditing && context.editingProduct.comparePrice ? context.editingProduct.comparePrice : ''}">
                </div>
              </div>

              <div style="display:flex; gap:20px;">
                <div class="form-group-modern flex-1">
                  <label>CATEGORY *</label>
                  <select id="prod-cat" required style="padding: 12px 16px;">
                    <option value="" disabled ${!isEditing ? 'selected' : ''}>Select Category</option>
                    ${context.categories.map(c => `
                      <option value="${c.name}" ${isEditing && context.editingProduct.category === c.name ? 'selected' : ''}>${c.name}</option>
                    `).join('')}
                  </select>
                </div>
                <div class="form-group-modern flex-1">
                  <label>BRAND</label>
                  <select id="prod-brand" style="padding: 12px 16px;">
                    <option value="" disabled ${!isEditing || !context.editingProduct.brand ? 'selected' : ''}>Select Brand</option>
                    ${(() => {
                      const brands = JSON.parse(localStorage.getItem('SWEETOS_brands') || '[]');
                      return brands.map(b => `
                        <option value="${b.name}" ${isEditing && context.editingProduct.brand === b.name ? 'selected' : ''}>${b.name}</option>
                      `).join('');
                    })()}
                  </select>
                </div>
              </div>

              <div style="display:flex; gap:20px;">
                <div class="form-group-modern flex-1">
                  <label>STOCK QUANTITY</label>
                  <input type="number" id="prod-stock" required min="0" placeholder="10" value="${isEditing ? (context.editingProduct.stock !== undefined ? context.editingProduct.stock : 20) : '10'}">
                </div>
                <div class="form-group-modern flex-1">
                  <label>$ COST PRICE (BOUGHT PRICE)</label>
                  <input type="number" id="prod-cost-price" step="0.01" placeholder="0.00" value="${isEditing && context.editingProduct.costPrice ? context.editingProduct.costPrice : ''}">
                </div>
              </div>

              <div class="form-group-modern">
                <label>DESCRIPTION</label>
                <textarea id="prod-desc" required rows="4" placeholder="Tell customers about this product...">${isEditing ? (context.editingProduct.description || '') : ''}</textarea>
              </div>

              <div class="form-group-modern">
                <label>STATUS</label>
                <div class="status-button-toggle">
                  <button type="button" class="status-toggle-option ${productStatus === 'Active' ? 'active' : ''}" id="status-active-btn">Active</button>
                  <button type="button" class="status-toggle-option ${productStatus === 'Draft' ? 'active' : ''}" id="status-draft-btn">Draft</button>
                </div>
                <input type="hidden" id="prod-status-val" value="${productStatus}">
              </div>

              <!-- Helper inputs for validation compatibility -->
              <input type="hidden" id="prod-sku" value="${isEditing ? (context.editingProduct.sku || '') : ''}">
              <input type="hidden" id="prod-threshold" value="${isEditing ? (context.editingProduct.threshold || 5) : '5'}">
              <input type="hidden" id="prod-short-desc" value="${isEditing ? (context.editingProduct.shortDesc || '') : ''}">
            </div>

            <!-- Right Column -->
            <div class="form-col-right">
              
              <div class="form-group-modern">
                <label>PRIMARY PRODUCT IMAGE</label>
                <!-- File Dropzone -->
                <div class="image-upload-dropzone" id="primary-image-dropzone">
                  <input type="file" id="primary-image-file-input" accept="image/*" style="display:none;">
                  
                  <div class="dropzone-empty-state" id="dropzone-empty" style="${isEditing && context.editingProduct.image ? 'display:none;' : ''}">
                    <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="#64748b" stroke-width="2" style="width:24px; height:24px; margin-bottom:12px;">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                      <circle cx="8.5" cy="8.5" r="1.5"></circle>
                      <polyline points="21 15 16 10 5 21"></polyline>
                    </svg>
                    <span class="upload-title">CLICK TO UPLOAD</span>
                    <span class="upload-formats">JPEG · PNG · WEBP</span>
                  </div>
                  
                  <div class="dropzone-preview-state" id="dropzone-preview" style="${isEditing && context.editingProduct.image ? '' : 'display:none;'}">
                    <img id="primary-image-preview" src="${isEditing ? (context.editingProduct.image || '') : ''}" alt="Preview">
                    <button type="button" class="remove-preview-btn" id="remove-primary-image-btn" title="Remove image">&times;</button>
                  </div>
                </div>
                <!-- Hidden input storing text path for storage compatibility -->
                <input type="hidden" id="prod-image-url-val" value="${isEditing ? (context.editingProduct.image || '') : ''}">
              </div>

              <div class="form-group-modern mt-2">
                <label>PRODUCT GALLERY (3 - 5 IMAGES)</label>
                <div class="gallery-upload-container">
                  <div class="gallery-item-add" id="add-gallery-item-btn">
                    <span>+</span>
                    <span>ADD</span>
                  </div>
                  <input type="file" id="gallery-image-file-input" accept="image/*" multiple style="display:none;">
                  <div class="gallery-previews" id="gallery-previews-list" style="display:flex; gap:8px; flex-wrap:wrap;">
                    <!-- Prepopulated edits images -->
                  </div>
                </div>
                <div class="gallery-info-row">
                  <span>IMAGES COUNT</span>
                  <span id="gallery-limit-label">0 / 5 LIMIT</span>
                </div>
              </div>

              <div class="form-group-modern mt-4 variant-toggle-card">
                <div style="display:flex; justify-content:space-between; align-items:center; width:100%;">
                  <span>PRODUCT VARIANTS</span>
                  <label class="switch-toggle">
                    <input type="checkbox" id="variants-toggle" ${isEditing && context.editingProduct.hasVariants ? 'checked' : ''}>
                    <span class="switch-slider"></span>
                  </label>
                </div>
              </div>

              <!-- Homepage Sections checklist selection -->
              <div class="form-group-modern mt-4">
                <label>Show in Homepage Sections</label>
                <div class="sections-checkbox-grid" style="display:flex; flex-direction:column; gap:8px; background:#0c101b; padding:12px; border-radius:8px; border:1px solid rgba(255,255,255,0.08); max-height:160px; overflow-y:auto;">
                  ${(() => {
                    const secs = JSON.parse(localStorage.getItem('SWEETOS_homepage_sections') || '[]');
                    // Don't show 'categories' layout type since it doesn't display products directly
                    return secs.filter(s => s.type !== 'categories').map(sec => {
                      const isChecked = isEditing && context.editingProduct.homepageSections && context.editingProduct.homepageSections.includes(sec.id);
                      return `
                        <label style="display:flex; align-items:center; gap:8px; cursor:pointer; color:#ffffff; font-size:13px; text-transform:none; font-weight:600; margin:0;">
                          <input type="checkbox" class="product-section-checkbox" value="${sec.id}" ${isChecked ? 'checked' : ''} style="width:16px; height:16px; cursor:pointer; margin:0;">
                          <span>${sec.name}</span>
                        </label>
                      `;
                    }).join('');
                  })()}
                </div>
              </div>

              <div id="prod-error-msg" class="error-text"></div>
              
              <button type="submit" class="publish-submit-btn mt-6" id="publish-submit-btn">
                ${isEditing ? 'Save Product Details' : 'Publish Product to Store'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function attachAdminProductsListeners(context, shadow) {
  // Search input filtering
  const searchInput = shadow.getElementById('product-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.currentPageIndex = 1;
      context.updateProductsTable();
    });
  }

  // Category filter selection
  const catF = shadow.getElementById('product-cat-filter');
  if (catF) {
    catF.addEventListener('change', (e) => {
      context.categoryFilter = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
    });
  }

  // Stock warning filters
  const stockF = shadow.getElementById('product-stock-filter');
  if (stockF) {
    stockF.addEventListener('change', (e) => {
      context.stockFilter = e.target.value;
      context.currentPageIndex = 1;
      context.render();
      context.attachListeners();
    });
  }

  // Pagination navigations
  const prevBtn = shadow.getElementById('prev-page-btn');
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (context.currentPageIndex > 1) {
        context.currentPageIndex--;
        context.render();
        context.attachListeners();
      }
    });
  }
  const nextBtn = shadow.getElementById('next-page-btn');
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      // Re-calculate list length
      const filtered = context.products.filter(p => {
        if (context.searchQuery) {
          const q = context.searchQuery.toLowerCase();
          if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
        }
        if (context.categoryFilter !== 'All' && p.category !== context.categoryFilter) return false;
        if (context.stockFilter !== 'All') {
          if (context.stockFilter === 'Low Stock' && (p.stock === undefined || p.stock > (p.threshold || 5))) return false;
          if (context.stockFilter === 'Out of Stock' && p.stock !== 0) return false;
        }
        return true;
      });
      const totalPages = Math.ceil(filtered.length / context.itemsPerPage) || 1;
      if (context.currentPageIndex < totalPages) {
        context.currentPageIndex++;
        context.render();
        context.attachListeners();
      }
    });
  }

  // Add Product Button
  const addBtn = shadow.getElementById('add-product-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      context.editingProduct = null;
      context.productStatus = 'Active';
      context.showProductModal = true;
      context.render();
      context.attachListeners();
    });
  }

  // Close Product modal
  const closeBtn = shadow.getElementById('close-prod-modal-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      context.showProductModal = false;
      context.editingProduct = null;
      context.render();
      context.attachListeners();
    });
  }

  // Edit action
  shadow.querySelectorAll('.edit-prod-action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const prod = context.products.find(p => p.id === id);
      if (prod) {
        context.editingProduct = prod;
        context.productStatus = prod.status || 'Active';
        context.showProductModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Delete product action
  shadow.querySelectorAll('.delete-prod-action-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.getAttribute('data-product-id'));
      const index = context.products.findIndex(p => p.id === id);
      if (index > -1) {
        const prod = context.products[index];
        const hasActiveOrders = context.orders.some(o => 
          (o.status === 'Pending' || o.status === 'En cours' || o.status === 'Confirmé') && 
          o.products && o.products.some(item => item.id === id)
        );
        if (hasActiveOrders) {
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Error: Cannot delete "${prod.name}" because it has active pending customer orders!` }));
          return;
        }
        const confirmed = await window.showConfirm(`Are you sure you want to delete "${prod.name}" from the product catalog?`, 'Delete Product');
        if (confirmed) {
          context.products.splice(index, 1);
          context.saveDatabase('products');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Deleted product "${prod.name}" successfully.` }));
          context.render();
          context.attachListeners();
        }
      }
    });
  });

  // Image Upload Dropzone interactions
  const dropzone = shadow.getElementById('primary-image-dropzone');
  const fileInput = shadow.getElementById('primary-image-file-input');
  const removeImgBtn = shadow.getElementById('remove-primary-image-btn');
  const imgUrlVal = shadow.getElementById('prod-image-url-val');
  const dropzoneEmpty = shadow.getElementById('dropzone-empty');
  const dropzonePreview = shadow.getElementById('dropzone-preview');
  const previewImg = shadow.getElementById('primary-image-preview');

  if (dropzone && fileInput) {
    dropzone.addEventListener('click', (e) => {
      // Stop clicks from remove button bubbling
      if (e.target.closest('#remove-primary-image-btn')) return;
      fileInput.click();
    });

    fileInput.addEventListener('change', () => {
      const file = fileInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const dataUrl = e.target.result;
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
    removeImgBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      fileInput.value = '';
      imgUrlVal.value = '';
      previewImg.src = '';
      dropzoneEmpty.style.display = 'flex';
      dropzonePreview.style.display = 'none';
    });
  }

  // Product Gallery simulation trigger
  const addGalleryBtn = shadow.getElementById('add-gallery-item-btn');
  const galleryInput = shadow.getElementById('gallery-image-file-input');
  const galleryPreviews = shadow.getElementById('gallery-previews-list');
  const galleryLimitLabel = shadow.getElementById('gallery-limit-label');
  let galleryCount = 0;

  if (addGalleryBtn && galleryInput) {
    addGalleryBtn.addEventListener('click', () => {
      galleryInput.click();
    });

    galleryInput.addEventListener('change', () => {
      const files = Array.from(galleryInput.files);
      files.forEach(file => {
        if (galleryCount >= 5) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = document.createElement('img');
          img.src = e.target.result;
          img.style.width = '64px';
          img.style.height = '64px';
          img.style.borderRadius = '8px';
          img.style.objectFit = 'cover';
          img.style.border = '1px solid rgba(255, 255, 255, 0.08)';
          galleryPreviews.appendChild(img);
          galleryCount++;
          galleryLimitLabel.textContent = `${galleryCount} / 5 LIMIT`;
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Active/Draft status buttons toggle
  const activeBtn = shadow.getElementById('status-active-btn');
  const draftBtn = shadow.getElementById('status-draft-btn');
  const statusVal = shadow.getElementById('prod-status-val');

  if (activeBtn && draftBtn) {
    activeBtn.addEventListener('click', () => {
      context.productStatus = 'Active';
      statusVal.value = 'Active';
      activeBtn.classList.add('active');
      draftBtn.classList.remove('active');
    });

    draftBtn.addEventListener('click', () => {
      context.productStatus = 'Draft';
      statusVal.value = 'Draft';
      draftBtn.classList.add('active');
      activeBtn.classList.remove('active');
    });
  }

  // Modal Submit Action
  const form = shadow.getElementById('prod-crud-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const name = shadow.getElementById('prod-name').value.trim();
      const price = parseFloat(shadow.getElementById('prod-price').value);
      const comparePrice = parseFloat(shadow.getElementById('prod-compare-price').value) || null;
      const category = shadow.getElementById('prod-cat').value;
      const brand = shadow.getElementById('prod-brand').value || 'SWEETOS';
      const stock = parseInt(shadow.getElementById('prod-stock').value) || 0;
      const costPrice = parseFloat(shadow.getElementById('prod-cost-price').value) || null;
      const description = shadow.getElementById('prod-desc').value.trim();
      const status = statusVal.value || 'Active';
      const imageUrl = imgUrlVal.value || './assets/keyboard_1786712380801.jpg';
      const hasVariants = shadow.getElementById('variants-toggle').checked;
      const checkedSections = Array.from(shadow.querySelectorAll('.product-section-checkbox:checked')).map(cb => cb.value);
      
      const errorMsg = shadow.getElementById('prod-error-msg');
      errorMsg.textContent = '';

      if (!name || isNaN(price)) {
        errorMsg.textContent = 'Please fill out all required fields marked with *';
        return;
      }

      if (context.editingProduct) {
        // Edit mode saving
        const pId = context.editingProduct.id;
        const index = context.products.findIndex(p => p.id === pId);
        if (index > -1) {
          context.products[index] = {
            ...context.products[index],
            name,
            price,
            comparePrice,
            category,
            brand,
            stock,
            costPrice,
            description,
            status,
            image: imageUrl,
            hasVariants,
            homepageSections: checkedSections
          };
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Product "${name}" saved successfully!` }));
        }
      } else {
        // Create new product
        // Compute unique SKU
        const shortName = name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 5).toUpperCase();
        const randId = Math.floor(100 + Math.random() * 900);
        const sku = `${category.slice(0,2).toUpperCase()}-${shortName}-${randId}`;
        
        const newId = context.products.length > 0 ? (Math.max(...context.products.map(p => p.id)) + 1) : 1;
        context.products.push({
          id: newId,
          sku,
          name,
          price,
          comparePrice,
          category,
          brand,
          stock,
          costPrice,
          description,
          status,
          image: imageUrl,
          hasVariants,
          homepageSections: checkedSections,
          rating: 4.8,
          reviews: 0
        });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `New product "${name}" added to catalog!` }));
      }

      context.saveDatabase('products');
      context.showProductModal = false;
      context.editingProduct = null;
      context.render();
      context.attachListeners();
    });
  }
}
