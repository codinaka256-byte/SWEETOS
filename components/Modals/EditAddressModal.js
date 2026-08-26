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
  
  let currentAddress = o.address || 'Abidjan Cocody Angré 8ème Tranche';
  let street = currentAddress;
  let city = 'Abidjan';
  
  if (currentAddress.includes(',')) {
    const parts = currentAddress.split(',');
    street = parts[0].trim();
    city = parts.slice(1).join(',').trim();
  }
  
  const fullName = `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || 'Client SWEETOS';
  const phone = profile.phone || '+225 05 00 61 99 23';

  container.innerHTML = `
    <div class="edit-address-modal glass-panel">
      <div class="edit-address-header">
        <h4>Modifier l'adresse de livraison (Côte d'Ivoire 🇨🇮)</h4>
        <button class="edit-address-close" id="edit-address-close-btn">&times;</button>
      </div>
      
      <div class="edit-address-body">
        <div class="form-group">
          <label>Nom complet du destinataire *</label>
          <input type="text" id="edit-address-fullname" value="${fullName}" placeholder="Ex: Marc Aurele" autocomplete="name" />
        </div>
        <div class="form-group">
          <label>Numéro WhatsApp / Téléphone de contact *</label>
          <input type="tel" id="edit-address-phone" value="${phone}" placeholder="Ex: +225 05 00 61 99 23" />
        </div>
        <div class="form-group">
          <label>Ville / Région *</label>
          <select id="edit-address-city" style="width: 100%; padding: 10px 14px; border-radius: 10px; border: 1.5px solid var(--border); font-size: 13.5px; background: white;">
            <option value="Abidjan" ${city.includes('Abidjan') ? 'selected' : ''}>Abidjan</option>
            <option value="Yamoussoukro" ${city.includes('Yamoussoukro') ? 'selected' : ''}>Yamoussoukro</option>
            <option value="Bouaké" ${city.includes('Bouaké') ? 'selected' : ''}>Bouaké</option>
            <option value="San-Pédro" ${city.includes('San-Pédro') ? 'selected' : ''}>San-Pédro</option>
            <option value="Grand-Bassam" ${city.includes('Bassam') ? 'selected' : ''}>Grand-Bassam</option>
            <option value="Autre Ville" ${!['Abidjan', 'Yamoussoukro', 'Bouaké', 'San-Pédro', 'Grand-Bassam'].some(c => city.includes(c)) ? 'selected' : ''}>Autre Ville</option>
          </select>
        </div>
        <div class="form-group">
          <label>Commune / Quartier & Repère précis *</label>
          <input type="text" id="edit-address-street" value="${street}" placeholder="Ex: Cocody Angré, près de la pharmacie des Grâces" autocomplete="street-address" />
        </div>
      </div>
      
      <div class="edit-address-actions">
        <button class="edit-address-save-btn" id="edit-address-save-btn">Enregistrer les Modifications</button>
        <button class="edit-address-cancel-btn" id="edit-address-cancel-btn">Annuler</button>
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
    const phoneVal = container.querySelector('#edit-address-phone').value.trim();
    const cityVal = container.querySelector('#edit-address-city').value.trim();
    const streetVal = container.querySelector('#edit-address-street').value.trim();
    
    if (!nameVal || !streetVal || !cityVal) {
      window.dispatchEvent(new CustomEvent('toast:show', { detail: 'Veuillez remplir tous les champs obligatoires.' }));
      return;
    }
    
    closeModal();
    onSave(nameVal, `${streetVal}, ${cityVal} (${phoneVal})`);
  });
}
