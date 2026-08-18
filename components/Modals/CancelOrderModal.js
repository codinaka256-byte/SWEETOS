export function showCancelOrderModal(shadow, o, onConfirm) {
  let overlay = shadow.getElementById('cancel-order-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'cancel-order-overlay';
    overlay.className = 'cancel-order-overlay';
    
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = './components/Modals/CancelOrderModal.css';
    overlay.appendChild(styleLink);
    
    const content = document.createElement('div');
    content.className = 'cancel-order-modal-container';
    overlay.appendChild(content);
    
    shadow.appendChild(overlay);
  }
  
  const container = overlay.querySelector('.cancel-order-modal-container');

  container.innerHTML = `
    <div class="cancel-order-modal glass-panel">
      <div class="cancel-order-header">
        <h4>Cancel Order ${o.id}</h4>
        <button class="cancel-order-close" id="cancel-order-close-btn">&times;</button>
      </div>

      <div class="cancel-order-body">
        <p>Are you sure you want to cancel this order? Cancelling will update your live order status in real time and initiate a full refund of <strong>$${o.total.toFixed(2)}</strong>.</p>

        <div class="form-group">
          <label>REASON FOR CANCELLATION</label>
          <select id="cancel-order-reason">
            <option value="Changed my mind">Changed my mind</option>
            <option value="Order taking too long">Order taking too long</option>
            <option value="Found a better deal">Found a better deal</option>
            <option value="Incorrect shipping address">Incorrect shipping address</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>

      <div class="cancel-order-actions">
        <button class="cancel-order-confirm-btn" id="cancel-order-confirm-btn">Confirm Realtime Cancellation</button>
        <button class="cancel-order-keep-btn" id="cancel-order-keep-btn">Keep Order</button>
      </div>
    </div>
  `;

  overlay.classList.add('open');

  const closeBtn = container.querySelector('#cancel-order-close-btn');
  const keepBtn = container.querySelector('#cancel-order-keep-btn');
  const confirmBtn = container.querySelector('#cancel-order-confirm-btn');

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
