export function showDeleteOrderModal(shadow, o, onConfirm) {
  let overlay = shadow.getElementById('delete-order-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'delete-order-overlay';
    overlay.className = 'delete-order-overlay';
    
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = './components/Modals/DeleteOrderModal.css';
    overlay.appendChild(styleLink);
    
    const content = document.createElement('div');
    content.className = 'delete-order-modal-container';
    overlay.appendChild(content);
    
    shadow.appendChild(overlay);
  }
  
  const container = overlay.querySelector('.delete-order-modal-container');

  container.innerHTML = `
    <div class="delete-order-modal glass-panel">
      <div class="delete-order-header">
        <h4>Remove Order Record</h4>
        <button class="delete-order-close" id="delete-order-close-btn">&times;</button>
      </div>

      <div class="delete-order-body">
        <p>Are you sure you want to remove the order record <strong>${o.id}</strong> from your history? This action is permanent and cannot be undone.</p>
      </div>

      <div class="delete-order-actions">
        <button class="delete-order-confirm-btn" id="delete-order-confirm-btn">Confirm Removal</button>
        <button class="delete-order-keep-btn" id="delete-order-keep-btn">Keep Record</button>
      </div>
    </div>
  `;

  overlay.classList.add('open');

  const closeBtn = container.querySelector('#delete-order-close-btn');
  const keepBtn = container.querySelector('#delete-order-keep-btn');
  const confirmBtn = container.querySelector('#delete-order-confirm-btn');

  const closeModal = () => {
    overlay.classList.remove('open');
  };

  closeBtn.addEventListener('click', closeModal);
  keepBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  confirmBtn.addEventListener('click', () => {
    closeModal();
    onConfirm();
  });
}
