export function showEditAddressModal(shadow, o, profile, onSave) {
  let overlay = shadow.getElementById('edit-address-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'edit-address-overlay';
    overlay.className = 'edit-address-overlay';
    
    const styleLink = document.createElement('link');
    styleLink.rel = 'stylesheet';
    styleLink.href = './components/Modals/EditAddressModal.css';
    overlay.appendChild(styleLink);
    
    const content = document.createElement('div');
    content.className = 'edit-address-modal-container';
    overlay.appendChild(content);
    
    shadow.appendChild(overlay);
  }
  
  const container = overlay.querySelector('.edit-address-modal-container');
  
  let currentAddress = o.address || 'Saved Address Studio Room 4B, Design House';
  let street = currentAddress;
  let city = 'Abidjan';
  
  if (currentAddress.includes(',')) {
    const parts = currentAddress.split(',');
    street = parts[0].trim();
    city = parts.slice(1).join(',').trim();
  }
  
  const fullName = `${profile.firstName} ${profile.lastName}`;

  container.innerHTML = `
    <div class="edit-address-modal glass-panel">
      <div class="edit-address-header">
        <h4>Edit Shipping Address</h4>
        <button class="edit-address-close" id="edit-address-close-btn">&times;</button>
      </div>
      
      <div class="edit-address-body">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" id="edit-address-fullname" value="${fullName}" placeholder="Full Name" autocomplete="name" />
        </div>
        <div class="form-group">
          <label>Street Address</label>
          <input type="text" id="edit-address-street" value="${street}" placeholder="Street Address" autocomplete="street-address" />
        </div>
        <div class="form-group">
          <label>City</label>
          <input type="text" id="edit-address-city" value="${city}" placeholder="City" style="max-width: 250px;" autocomplete="address-level2" />
        </div>
      </div>
      
      <div class="edit-address-actions">
        <button class="edit-address-save-btn" id="edit-address-save-btn">Save Changes to DB</button>
        <button class="edit-address-cancel-btn" id="edit-address-cancel-btn">Cancel</button>
      </div>
    </div>
  `;

  overlay.classList.add('open');

  const closeBtn = container.querySelector('#edit-address-close-btn');
  const cancelBtn = container.querySelector('#edit-address-cancel-btn');
  const saveBtn = container.querySelector('#edit-address-save-btn');

  const closeModal = () => {
    overlay.classList.remove('open');
  };

  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeModal();
    }
  });

  saveBtn.addEventListener('click', () => {
    const nameVal = container.querySelector('#edit-address-fullname').value.trim();
    const streetVal = container.querySelector('#edit-address-street').value.trim();
    const cityVal = container.querySelector('#edit-address-city').value.trim();
    
    if (!nameVal || !streetVal || !cityVal) {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Please fill in all address details.' }));
      return;
    }
    
    closeModal();
    onSave(nameVal, `${streetVal}, ${cityVal}`);
  });
}
