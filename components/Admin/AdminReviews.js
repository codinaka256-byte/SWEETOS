export function renderAdminReviews(context) {
  // Initialize filter state if not present
  if (context.reviewRatingFilter === undefined) context.reviewRatingFilter = 'All';
  if (context.reviewStatusFilter === undefined) context.reviewStatusFilter = 'All';
  if (context.editingReviewId === undefined) context.editingReviewId = null;

  let list = [...(context.reviews || [])];

  // Apply filters
  if (context.searchQuery) {
    const q = context.searchQuery.toLowerCase();
    list = list.filter(r => 
      r.user.toLowerCase().includes(q) || 
      r.comment.toLowerCase().includes(q)
    );
  }

  if (context.reviewRatingFilter !== 'All') {
    const rVal = parseInt(context.reviewRatingFilter);
    list = list.filter(r => r.rating === rVal);
  }

  if (context.reviewStatusFilter !== 'All') {
    const sVal = context.reviewStatusFilter.toLowerCase();
    list = list.filter(r => (r.status || 'approved').toLowerCase() === sVal);
  }

  const totalReviews = (context.reviews || []).length;
  const avgRating = totalReviews > 0 
    ? (context.reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) 
    : '0.0';
  const pendingCount = (context.reviews || []).filter(r => r.status === 'pending').length;
  const topReviews = (context.reviews || []).filter(r => r.rating === 5).length;

  return `
    <!-- Metrics Header Cards -->
    <div class="reviews-metrics-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; margin-bottom: 24px;">
      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4);">
        <div style="background: rgba(0, 82, 204, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: var(--primary);">📝</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Total Reviews</span>
          <strong style="font-size: 22px; font-weight: 850; color: var(--text-dark);">${totalReviews} reviews</strong>
        </div>
      </div>

      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4);">
        <div style="background: rgba(255, 171, 0, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #ffab00;">⭐</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Average Rating</span>
          <strong style="font-size: 22px; font-weight: 850; color: var(--text-dark);">${avgRating} / 5.0</strong>
        </div>
      </div>

      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4);">
        <div style="background: rgba(245, 158, 11, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #f59e0b;">⏳</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">Pending Audits</span>
          <strong style="font-size: 22px; font-weight: 850; color: #f59e0b;">${pendingCount} pending</strong>
        </div>
      </div>

      <div class="metric-card glass-panel" style="padding: 20px; border-radius: 16px; border: 1.5px solid var(--border); display: flex; align-items: center; gap: 16px; background: rgba(255, 255, 255, 0.4);">
        <div style="background: rgba(16, 185, 129, 0.08); width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; border-radius: 12px; font-size: 24px; color: #10b981;">🥇</div>
        <div>
          <span style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 4px;">5-Star Reviews</span>
          <strong style="font-size: 22px; font-weight: 850; color: #10b981;">${topReviews} count</strong>
        </div>
      </div>
    </div>

    <!-- Search Controls & Filters Grid -->
    <div class="admin-table-filters-row" style="display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; align-items: center;">
      <div class="search-box" style="flex: 1; min-width: 250px; position: relative;">
        <input type="text" id="review-search" placeholder="Search comments, authors..." value="${context.searchQuery || ''}" style="width: 100%; padding: 10px 14px 10px 40px; border-radius: 12px; border: 1.5px solid var(--border); background: white; outline: none; font-size: 13.5px;">
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" style="position: absolute; left: 14px; top: 13px; color: var(--text-light);"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      </div>

      <div style="display: flex; gap: 12px;">
        <select id="review-rating-filter" style="padding: 10px 16px; border-radius: 12px; border: 1.5px solid var(--border); background: white; font-size: 13.5px; outline: none; font-weight: 600;">
          <option value="All" ${context.reviewRatingFilter === 'All' ? 'selected' : ''}>Rating: All</option>
          <option value="5" ${context.reviewRatingFilter === '5' ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
          <option value="4" ${context.reviewRatingFilter === '4' ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
          <option value="3" ${context.reviewRatingFilter === '3' ? 'selected' : ''}>⭐⭐⭐ (3)</option>
          <option value="2" ${context.reviewRatingFilter === '2' ? 'selected' : ''}>⭐⭐ (2)</option>
          <option value="1" ${context.reviewRatingFilter === '1' ? 'selected' : ''}>⭐ (1)</option>
        </select>

        <select id="review-status-filter" style="padding: 10px 16px; border-radius: 12px; border: 1.5px solid var(--border); background: white; font-size: 13.5px; outline: none; font-weight: 600;">
          <option value="All" ${context.reviewStatusFilter === 'All' ? 'selected' : ''}>Status: All</option>
          <option value="approved" ${context.reviewStatusFilter === 'approved' ? 'selected' : ''}>Approved</option>
          <option value="pending" ${context.reviewStatusFilter === 'pending' ? 'selected' : ''}>Pending</option>
        </select>
      </div>
    </div>

    <!-- Data Moderation Table -->
    <div class="admin-table-panel glass-panel">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th style="width: 25%;">Product Name</th>
              <th style="width: 15%;">Author</th>
              <th style="width: 15%;">Rating</th>
              <th style="width: 25%;">Commentary Details</th>
              <th style="width: 10%;">Status</th>
              <th style="text-align: right; width: 10%;">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${list.length === 0 ? `
              <tr>
                <td colspan="6" style="text-align: center; padding: 40px; color: var(--text-light); font-weight: 600;">No product reviews found matching active filters.</td>
              </tr>
            ` : list.map(r => {
              const product = context.products.find(p => p.id === r.productId) || { name: 'Unknown Product', image: './assets/keyboard.jpg' };
              const status = r.status || 'approved';
              return `
                <tr>
                  <td>
                    <div style="display: flex; align-items: center; gap: 12px;">
                      <img src="${product.image}" alt="${product.name}" style="width: 40px; height: 40px; border-radius: 8px; object-cover: cover; border: 1px solid var(--border); flex-shrink: 0;">
                      <span style="font-weight: 750; color: var(--text-dark); font-size: 13.5px;">${product.name}</span>
                    </div>
                  </td>
                  <td>
                    <strong style="font-size: 13.5px; color: var(--text-dark);">${r.user}</strong>
                    <span style="display: block; font-size: 11px; color: var(--text-light);">${r.date || 'Auto-generated'}</span>
                  </td>
                  <td>
                    <div style="color: #ffab00; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 4px;">
                      ${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}
                      <span style="color: var(--text-light); font-size: 11px;">(${r.rating})</span>
                    </div>
                  </td>
                  <td>
                    <p style="font-size: 13px; line-height: 1.4; color: var(--text-dark); margin: 0; max-width: 320px; white-space: normal; word-break: break-word;">"${r.comment}"</p>
                  </td>
                  <td>
                    <span class="status-pill status-${status === 'approved' ? 'completed' : 'pending'}" style="text-transform: uppercase; font-size: 10.5px; font-weight: 750; padding: 4px 10px; border-radius: 20px;">
                      ${status}
                    </span>
                  </td>
                  <td style="text-align: right;">
                    <div style="display: flex; gap: 8px; justify-content: flex-end;">
                      ${status === 'pending' ? `
                        <button class="action-btn-circle btn-approve" data-approve-id="${r.id}" title="Approve Review" style="background: rgba(16, 185, 129, 0.1); color: #10b981; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                      ` : ''}
                      <button class="action-btn-circle btn-edit-review" data-edit-id="${r.id}" title="Edit Review Content" style="background: rgba(0, 82, 204, 0.08); color: var(--primary); border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                      </button>
                      <button class="action-btn-circle btn-delete-review" data-delete-id="${r.id}" title="Delete Review" style="background: rgba(255, 73, 73, 0.1); color: #ff4949; border: none; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: all 0.2s;">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Review Editing Backdrop Modal -->
    ${context.editingReviewId ? (() => {
      const rev = context.reviews.find(r => r.id === context.editingReviewId);
      if (!rev) return '';
      return `
        <div class="admin-modal-overlay" style="position: fixed; inset: 0; background: rgba(9, 13, 22, 0.7); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 11000; animation: fadeInModal 0.3s ease;">
          <div style="background: #090d16; width: 500px; border-radius: 20px; border: 1.5px solid rgba(255,255,255,0.08); box-shadow: 0 25px 60px rgba(0,0,0,0.6); padding: 32px; font-family: 'Outfit', sans-serif; color: white;">
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
              <h3 style="font-size: 20px; font-weight: 850; letter-spacing: -0.5px; text-transform: uppercase; margin: 0; background: linear-gradient(135deg, #00b4d8 0%, #0052cc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Edit Customer Review</h3>
              <button id="close-review-modal-btn" style="background: rgba(255,255,255,0.08); border: none; width: 32px; height: 32px; border-radius: 50%; color: white; display: flex; align-items: center; justify-content: center; cursor: pointer;">✕</button>
            </div>

            <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px;">
              <div>
                <label style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Reviewer Name</label>
                <input type="text" id="edit-review-author" value="${rev.user}" style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; outline: none; font-size: 13.5px;" readonly>
              </div>

              <div>
                <label style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Rating Score (1-5)</label>
                <select id="edit-review-rating" style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: #090d16; color: white; outline: none; font-size: 13.5px; font-weight: 600;">
                  <option value="5" ${rev.rating === 5 ? 'selected' : ''}>⭐⭐⭐⭐⭐ (5)</option>
                  <option value="4" ${rev.rating === 4 ? 'selected' : ''}>⭐⭐⭐⭐ (4)</option>
                  <option value="3" ${rev.rating === 3 ? 'selected' : ''}>⭐⭐⭐ (3)</option>
                  <option value="2" ${rev.rating === 2 ? 'selected' : ''}>⭐⭐ (2)</option>
                  <option value="1" ${rev.rating === 1 ? 'selected' : ''}>⭐ (1)</option>
                </select>
              </div>

              <div>
                <label style="font-size: 11.5px; font-weight: 750; color: var(--text-light); text-transform: uppercase; letter-spacing: 0.5px; display: block; margin-bottom: 8px;">Comment Text</label>
                <textarea id="edit-review-comment" rows="4" style="width: 100%; padding: 12px; border-radius: 12px; border: 1.5px solid rgba(255,255,255,0.1); background: rgba(255,255,255,0.03); color: white; outline: none; font-size: 13.5px; line-height: 1.5; resize: none;">${rev.comment}</textarea>
              </div>
            </div>

            <div style="display: flex; gap: 12px; justify-content: flex-end;">
              <button id="cancel-edit-review-btn" class="admin-btn" style="background: rgba(255,255,255,0.08); color: white; border: none; padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;">Cancel</button>
              <button id="save-edit-review-btn" class="admin-btn admin-btn-primary" style="padding: 12px 24px; border-radius: 12px; font-weight: 700; cursor: pointer;">Apply Changes</button>
            </div>

          </div>
        </div>
      `;
    })() : ''}
  `;
}

export function attachAdminReviewsListeners(context, shadow) {
  // 1. Search Box input listener
  const searchInput = shadow.getElementById('review-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      context.searchQuery = e.target.value;
      context.updateProductsTable();
    });
  }

  // 2. Rating Filter dropdown
  const ratingFilter = shadow.getElementById('review-rating-filter');
  if (ratingFilter) {
    ratingFilter.addEventListener('change', (e) => {
      context.reviewRatingFilter = e.target.value;
      context.render();
      context.attachListeners();
    });
  }

  // 3. Status Filter dropdown
  const statusFilter = shadow.getElementById('review-status-filter');
  if (statusFilter) {
    statusFilter.addEventListener('change', (e) => {
      context.reviewStatusFilter = e.target.value;
      context.render();
      context.attachListeners();
    });
  }

  // 4. Moderation approval actions
  shadow.querySelectorAll('.btn-approve').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-approve-id'));
      const idx = context.reviews.findIndex(r => r.id === id);
      if (idx !== -1) {
        context.reviews[idx].status = 'approved';
        context.saveDatabase('reviews');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Review approved and published! ⭐' }));
        context.render();
        context.attachListeners();
      }
    });
  });

  // 5. Delete review actions
  shadow.querySelectorAll('.btn-delete-review').forEach(btn => {
    btn.addEventListener('click', async () => {
      const confirmed = await window.showConfirm('Are you sure you want to permanently delete this review?', 'Delete Review');
      if (confirmed) {
        const id = parseInt(btn.getAttribute('data-delete-id'));
        context.reviews = context.reviews.filter(r => r.id !== id);
        context.saveDatabase('reviews');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Review deleted successfully.' }));
        context.render();
        context.attachListeners();
      }
    });
  });

  // 6. Open edit review modal
  shadow.querySelectorAll('.btn-edit-review').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = parseInt(btn.getAttribute('data-edit-id'));
      context.editingReviewId = id;
      context.render();
      context.attachListeners();
    });
  });

  // 7. Close review modal
  const closeModalBtn = shadow.getElementById('close-review-modal-btn');
  const cancelModalBtn = shadow.getElementById('cancel-edit-review-btn');
  const handleCloseModal = () => {
    context.editingReviewId = null;
    context.render();
    context.attachListeners();
  };
  if (closeModalBtn) closeModalBtn.addEventListener('click', handleCloseModal);
  if (cancelModalBtn) cancelModalBtn.addEventListener('click', handleCloseModal);

  // 8. Save edited review changes
  const saveEditBtn = shadow.getElementById('save-edit-review-btn');
  if (saveEditBtn) {
    saveEditBtn.addEventListener('click', () => {
      const rating = parseInt(shadow.getElementById('edit-review-rating').value);
      const comment = shadow.getElementById('edit-review-comment').value.trim();

      if (!comment) {
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Comment details cannot be empty!' }));
        return;
      }

      const idx = context.reviews.findIndex(r => r.id === context.editingReviewId);
      if (idx !== -1) {
        context.reviews[idx].rating = rating;
        context.reviews[idx].comment = comment;
        context.saveDatabase('reviews');
        window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Review edits saved successfully.' }));
        
        context.editingReviewId = null;
        context.render();
        context.attachListeners();
      }
    });
  }
}
