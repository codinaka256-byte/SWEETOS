export function renderAdminSections(context) {
  const sections = context.homepageSections || [];
  const isEditing = context.editingSection !== null;
  const showModal = context.showSectionModal;

  // Make sure order field is initialized on all sections
  sections.forEach((s, idx) => {
    if (s.order === undefined) s.order = idx;
  });

  // Sort sections by their order parameter
  const sortedSections = [...sections].sort((a, b) => (a.order || 0) - (b.order || 0));

  return `
    <div class="admin-table-filters-bar mb-4" style="margin-bottom: 20px;">
      <div class="search-box">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
        <input type="text" id="section-search" placeholder="Search sections..." value="${context.searchQuery || ''}">
      </div>
      
      <button class="admin-btn admin-btn-primary" id="add-section-btn">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="width: 16px; height: 16px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
        <span>Add Section</span>
      </button>
    </div>

    <!-- Sections Table -->
    <div class="admin-table-panel glass-panel">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Order</th>
              <th>Section Name</th>
              <th>Layout Type</th>
              <th>Category Filter</th>
              <th>Status</th>
              <th>Actions & Re-ordering</th>
            </tr>
          </thead>
          <tbody>
            ${sortedSections.length === 0 ? `
              <tr>
                <td colspan="6" class="text-center py-6">No homepage sections created. Click "Add Section" to make one.</td>
              </tr>
            ` : sortedSections
                .filter(s => s.name.toLowerCase().includes((context.searchQuery || '').toLowerCase()))
                .map((s, index) => `
              <tr>
                <td><code style="font-weight:700; color:var(--primary); font-size:13.5px;"># ${index + 1}</code></td>
                <td><strong>${s.name}</strong></td>
                <td>
                  <span class="status-badge ${s.type.includes('grid') || s.type.includes('carousel') || s.type.includes('banner') ? 'status-blue' : 'status-green'}" style="text-transform: uppercase;">
                    ${s.type}
                  </span>
                </td>
                <td><code>${s.category || 'All'}</code></td>
                <td>
                  <span class="stock-status-badge ${s.active ? 'badge-success' : 'badge-danger'}">
                    ${s.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>
                  <div class="row-actions" style="gap: 6px;">
                    <!-- Reordering Arrow controls -->
                    <button class="move-up-section-btn admin-btn" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px; background: rgba(0,0,0,0.02); border: 1.5px solid var(--border);" ${index === 0 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Move Up">▲</button>
                    <button class="move-down-section-btn admin-btn" data-id="${s.id}" style="padding: 4px 8px; font-size: 11px; background: rgba(0,0,0,0.02); border: 1.5px solid var(--border);" ${index === sortedSections.length - 1 ? 'disabled style="opacity:0.3; cursor:not-allowed;"' : ''} title="Move Down">▼</button>
                    
                    <button class="edit-section-row-btn" data-id="${s.id}">Edit</button>
                    <button class="delete-section-row-btn delete-prod-action-btn" data-id="${s.id}">Delete</button>
                  </div>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Add/Edit Section Overlay Modal -->
    <div class="modal-backdrop ${showModal ? 'show' : ''}" id="section-modal-backdrop">
      <div class="modal-wrapper glass-panel animate-in" style="max-width: 480px; background: var(--white); box-shadow: 0 10px 40px rgba(0,0,0,0.15); border: 1px solid var(--border);">
        <div class="modal-header">
          <h3>${isEditing ? 'Edit Section Configuration' : 'Add New Homepage Section'}</h3>
          <button class="modal-close-btn" id="close-section-modal-btn">&times;</button>
        </div>
        
        <div class="modal-body">
          <form id="section-config-form" class="settings-form w-full" style="max-width: 100%;">
            <input type="hidden" id="edit-section-id" value="${isEditing ? context.editingSection.id : ''}">
            <input type="hidden" id="edit-section-order" value="${isEditing ? (context.editingSection.order || 0) : ''}">
            
            <div class="form-group">
              <label>Section Name</label>
              <input type="text" id="section-name" class="admin-input" required placeholder="e.g. Hot Deals / Custom Grid" value="${isEditing ? context.editingSection.name : ''}">
            </div>
            
            <div class="form-group mt-4" style="margin-top: 16px;">
              <label>Layout / Section Type</label>
              <select id="section-type" class="admin-input" style="padding: 10px 14px;">
                <option value="categories" ${isEditing && context.editingSection.type === 'categories' ? 'selected' : ''}>Shop by Category Grid</option>
                <option value="deals" ${isEditing && context.editingSection.type === 'deals' ? 'selected' : ''}>Hot Deals Showcase</option>
                <option value="new-arrivals" ${isEditing && context.editingSection.type === 'new-arrivals' ? 'selected' : ''}>New Arrivals Showcase</option>
                <option value="best-sellers" ${isEditing && context.editingSection.type === 'best-sellers' ? 'selected' : ''}>Best Sellers Showcase</option>
                <option value="grid" ${isEditing && context.editingSection.type === 'grid' ? 'selected' : ''}>Custom Product Grid</option>
                <option value="carousel" ${isEditing && context.editingSection.type === 'carousel' ? 'selected' : ''}>Custom Carousel Slider</option>
                <option value="banner" ${isEditing && context.editingSection.type === 'banner' ? 'selected' : ''}>Custom Promo Banner</option>
              </select>
            </div>

            <div class="form-group mt-4" style="margin-top: 16px;">
              <label>Category Filter (Only for Custom grids/carousels/banners)</label>
              <select id="section-category" class="admin-input" style="padding: 10px 14px;">
                <option value="All" ${isEditing && context.editingSection.category === 'All' ? 'selected' : ''}>All Products</option>
                <option value="Keyboards" ${isEditing && context.editingSection.category === 'Keyboards' ? 'selected' : ''}>Keyboards</option>
                <option value="Audio" ${isEditing && context.editingSection.category === 'Audio' ? 'selected' : ''}>Audio</option>
                <option value="Lighting" ${isEditing && context.editingSection.category === 'Lighting' ? 'selected' : ''}>Lighting</option>
                <option value="Desks" ${isEditing && context.editingSection.category === 'Desks' ? 'selected' : ''}>Desks</option>
                <option value="Apple" ${isEditing && context.editingSection.category === 'Apple' ? 'selected' : ''}>Apple</option>
              </select>
            </div>

            <div class="form-group mt-4" style="margin-top: 16px; flex-direction: row; align-items: center; gap: 8px;">
              <input type="checkbox" id="section-active" style="width: 16px; height: 16px;" ${!isEditing || context.editingSection.active ? 'checked' : ''}>
              <label for="section-active" style="cursor: pointer; font-size: 13.5px; font-weight: 600; margin: 0;">Mark as active section on homepage</label>
            </div>

            <div class="row-actions mt-6" style="margin-top: 24px; justify-content: flex-end; gap: 12px;">
              <button type="button" class="admin-btn admin-btn-secondary" id="cancel-section-form-btn" style="padding: 10px 20px;">Cancel</button>
              <button type="submit" class="admin-btn admin-btn-primary" style="padding: 10px 20px;">${isEditing ? 'Save Changes' : 'Create Section'}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `;
}

export function attachAdminSectionsListeners(context, shadow) {
  // Search input filtering
  const searchInput = shadow.getElementById('section-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.render();
      context.attachListeners();
      const s = shadow.getElementById('section-search');
      if (s) {
        s.focus();
        s.setSelectionRange(s.value.length, s.value.length);
      }
    });
  }

  // Open Modal to Add
  const addBtn = shadow.getElementById('add-section-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      context.showSectionModal = true;
      context.editingSection = null;
      context.render();
      context.attachListeners();
    });
  }

  // Close modal buttons
  const closeBtn = shadow.getElementById('close-section-modal-btn');
  const cancelBtn = shadow.getElementById('cancel-section-form-btn');
  const backdrop = shadow.getElementById('section-modal-backdrop');

  const closeModal = () => {
    context.showSectionModal = false;
    context.editingSection = null;
    context.render();
    context.attachListeners();
  };

  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);
  if (backdrop) {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  // Edit action trigger
  shadow.querySelectorAll('.edit-section-row-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sId = btn.getAttribute('data-id');
      const sectionObj = context.homepageSections.find(s => s.id === sId);
      if (sectionObj) {
        context.editingSection = { ...sectionObj };
        context.showSectionModal = true;
        context.render();
        context.attachListeners();
      }
    });
  });

  // Reordering: Move Up Action
  shadow.querySelectorAll('.move-up-section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sorted = [...context.homepageSections].sort((a, b) => (a.order || 0) - (b.order || 0));
      const idx = sorted.findIndex(s => s.id === id);
      if (idx > 0) {
        // Swap order values
        const temp = sorted[idx].order;
        sorted[idx].order = sorted[idx - 1].order;
        sorted[idx - 1].order = temp;

        context.homepageSections = sorted;
        context.saveDatabase('sections');
        context.render();
        context.attachListeners();
      }
    });
  });

  // Reordering: Move Down Action
  shadow.querySelectorAll('.move-down-section-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const sorted = [...context.homepageSections].sort((a, b) => (a.order || 0) - (b.order || 0));
      const idx = sorted.findIndex(s => s.id === id);
      if (idx !== -1 && idx < sorted.length - 1) {
        // Swap order values
        const temp = sorted[idx].order;
        sorted[idx].order = sorted[idx + 1].order;
        sorted[idx + 1].order = temp;

        context.homepageSections = sorted;
        context.saveDatabase('sections');
        context.render();
        context.attachListeners();
      }
    });
  });

  // Delete action trigger
  shadow.querySelectorAll('.delete-section-row-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const sId = btn.getAttribute('data-id');
      const sectionObj = context.homepageSections.find(s => s.id === sId);
      if (sectionObj) {
        if (confirm(`Are you sure you want to delete the homepage section "${sectionObj.name}"?`)) {
          context.homepageSections = context.homepageSections.filter(s => s.id !== sId);
          context.saveDatabase('sections');
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Section "${sectionObj.name}" has been deleted.` }));
          context.render();
          context.attachListeners();
        }
      }
    });
  });

  // Form submit handler
  const form = shadow.getElementById('section-config-form');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      
      const sId = shadow.getElementById('edit-section-id').value;
      const name = shadow.getElementById('section-name').value.trim();
      const type = shadow.getElementById('section-type').value;
      const category = shadow.getElementById('section-category').value;
      const active = shadow.getElementById('section-active').checked;
      
      if (!name) return;

      if (sId) {
        // Edit mode
        const index = context.homepageSections.findIndex(s => s.id === sId);
        if (index !== -1) {
          const originalOrder = parseInt(shadow.getElementById('edit-section-order').value) || 0;
          context.homepageSections[index] = { id: sId, name, type, category, active, order: originalOrder };
          window.dispatchEvent(new CustomEvent('toast:show', { detail: `Section changes saved successfully.` }));
        }
      } else {
        // Add mode
        const nextOrder = context.homepageSections.reduce((max, s) => (s.order !== undefined && s.order > max) ? s.order : max, -1) + 1;
        const newId = 'sec-' + Math.random().toString(36).substring(2, 7);
        context.homepageSections.push({ id: newId, name, type, category, active, order: nextOrder });
        window.dispatchEvent(new CustomEvent('toast:show', { detail: `Homepage section "${name}" created.` }));
      }

      context.saveDatabase('sections');
      context.showSectionModal = false;
      context.editingSection = null;
      context.render();
      context.attachListeners();
    });
  }
}
