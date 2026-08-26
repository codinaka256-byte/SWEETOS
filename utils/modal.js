/**
 * utils/modal.js
 * Universal, high-end custom confirmation and alert modal system.
 * Replaces native browser window.confirm() and window.alert() with luxury glassmorphic dialogs.
 */

export function showConfirmModal({
  title = 'Confirmation Required',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  type = 'danger', // 'danger' | 'primary' | 'warning'
  icon = '⚠️'
} = {}) {
  return new Promise((resolve) => {
    // Remove any existing confirm dialogs
    document.querySelectorAll('.sweetos-confirm-overlay').forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'sweetos-confirm-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(10, 37, 64, 0.5)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';
    overlay.style.animation = 'sweetos-fade-in 0.25s ease';

    const isDanger = type === 'danger' || type === 'critical';
    const primaryBg = isDanger ? '#ef4444' : (type === 'warning' ? '#f59e0b' : '#0052cc');
    const primaryHover = isDanger ? '#dc2626' : (type === 'warning' ? '#d97706' : '#0040a3');
    const iconBg = isDanger ? '#fef2f2' : (type === 'warning' ? '#fffbeb' : '#eff6ff');
    const iconBorder = isDanger ? '#fee2e2' : (type === 'warning' ? '#fde68a' : '#dbeafe');
    const iconColor = primaryBg;

    const styleTag = document.createElement('style');
    styleTag.textContent = `
      @keyframes sweetos-fade-in {
        from { opacity: 0; }
        to { opacity: 1; }
      }
      @keyframes sweetos-scale-in {
        from { transform: scale(0.92) translateY(10px); opacity: 0; }
        to { transform: scale(1) translateY(0); opacity: 1; }
      }
      .sweetos-confirm-btn-primary {
        background: ${primaryBg};
        color: white;
        border: none;
        padding: 12px 22px;
        border-radius: 12px;
        font-weight: 750;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        box-shadow: 0 4px 14px ${isDanger ? 'rgba(239, 68, 68, 0.25)' : 'rgba(0, 82, 204, 0.2)'};
        display: flex;
        align-items: center;
        gap: 6px;
      }
      .sweetos-confirm-btn-primary:hover {
        background: ${primaryHover};
        transform: translateY(-1.5px);
        box-shadow: 0 6px 18px ${isDanger ? 'rgba(239, 68, 68, 0.35)' : 'rgba(0, 82, 204, 0.3)'};
      }
      .sweetos-confirm-btn-secondary {
        background: #f8fafc;
        color: #475569;
        border: 1.5px solid #e2e8f0;
        padding: 12px 20px;
        border-radius: 12px;
        font-weight: 700;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .sweetos-confirm-btn-secondary:hover {
        background: #f1f5f9;
        border-color: #cbd5e1;
        color: #0f172a;
        transform: translateY(-1px);
      }
    `;
    overlay.appendChild(styleTag);

    const dialog = document.createElement('div');
    dialog.style.background = 'white';
    dialog.style.border = '1px solid rgba(226, 232, 240, 0.9)';
    dialog.style.boxShadow = '0 25px 60px -12px rgba(10, 37, 64, 0.25), 0 0 1px rgba(0,0,0,0.1)';
    dialog.style.borderRadius = '24px';
    dialog.style.padding = '28px 30px';
    dialog.style.width = '100%';
    dialog.style.maxWidth = '440px';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.gap = '20px';
    dialog.style.animation = 'sweetos-scale-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)';

    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: ${iconBg}; border: 1.5px solid ${iconBorder}; color: ${iconColor}; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          ${icon}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 6px 0; font-size: 17.5px; font-weight: 850; color: #0f172a; line-height: 1.3;">${title}</h3>
          <p style="margin: 0; font-size: 13.8px; color: #64748b; line-height: 1.55;">${message}</p>
        </div>
      </div>
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 4px;">
        <button class="sweetos-confirm-btn-secondary" id="sweetos-confirm-cancel">${cancelText}</button>
        <button class="sweetos-confirm-btn-primary" id="sweetos-confirm-ok">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(dialog);

    const cleanup = (val) => {
      overlay.style.animation = 'sweetos-fade-in 0.18s ease reverse';
      dialog.style.animation = 'sweetos-scale-in 0.18s ease reverse';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(val);
      }, 160);
    };

    dialog.querySelector('#sweetos-confirm-ok').addEventListener('click', () => cleanup(true));
    dialog.querySelector('#sweetos-confirm-cancel').addEventListener('click', () => cleanup(false));
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(false);
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(false);
      } else if (e.key === 'Enter') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(true);
      }
    };
    document.addEventListener('keydown', keyHandler);

    document.body.appendChild(overlay);
  });
}

/**
 * Universal custom input prompt modal.
 * Replaces native browser window.prompt() with a luxury modern input card.
 */
export function showPromptModal({
  title = 'Input Required',
  message = 'Please enter a value:',
  defaultValue = '',
  placeholder = 'Type here...',
  confirmText = 'Save',
  cancelText = 'Cancel',
  icon = '🏷️'
} = {}) {
  return new Promise((resolve) => {
    document.querySelectorAll('.sweetos-confirm-overlay').forEach(el => el.remove());

    const overlay = document.createElement('div');
    overlay.className = 'sweetos-confirm-overlay';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.backgroundColor = 'rgba(10, 37, 64, 0.5)';
    overlay.style.backdropFilter = 'blur(12px)';
    overlay.style.webkitBackdropFilter = 'blur(12px)';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';
    overlay.style.zIndex = '999999';
    overlay.style.fontFamily = "'Outfit', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    overlay.style.padding = '20px';
    overlay.style.boxSizing = 'border-box';
    overlay.style.animation = 'sweetos-fade-in 0.25s ease';

    const dialog = document.createElement('div');
    dialog.style.background = 'white';
    dialog.style.border = '1px solid rgba(226, 232, 240, 0.9)';
    dialog.style.boxShadow = '0 25px 60px -12px rgba(10, 37, 64, 0.25), 0 0 1px rgba(0,0,0,0.1)';
    dialog.style.borderRadius = '24px';
    dialog.style.padding = '28px 30px';
    dialog.style.width = '100%';
    dialog.style.maxWidth = '460px';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.gap = '20px';
    dialog.style.animation = 'sweetos-scale-in 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)';

    dialog.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 16px;">
        <div style="width: 48px; height: 48px; border-radius: 14px; background: #eff6ff; border: 1.5px solid #dbeafe; color: #0052cc; display: flex; align-items: center; justify-content: center; font-size: 22px; flex-shrink: 0; box-shadow: 0 2px 8px rgba(0,0,0,0.04);">
          ${icon}
        </div>
        <div style="flex: 1;">
          <h3 style="margin: 0 0 6px 0; font-size: 18px; font-weight: 850; color: #0f172a; line-height: 1.3;">${title}</h3>
          <p style="margin: 0; font-size: 13.8px; color: #64748b; line-height: 1.55;">${message}</p>
        </div>
      </div>
      <div>
        <input type="text" id="sweetos-prompt-input" value="${defaultValue}" placeholder="${placeholder}" style="width: 100%; box-sizing: border-box; padding: 12px 16px; border: 1.5px solid #cbd5e1; border-radius: 12px; font-size: 14.5px; font-family: inherit; color: #0f172a; outline: none; transition: border-color 0.2s, box-shadow 0.2s; background: #f8fafc;">
      </div>
      <div style="display: flex; justify-content: flex-end; align-items: center; gap: 10px; margin-top: 4px;">
        <button class="sweetos-confirm-btn-secondary" id="sweetos-prompt-cancel">${cancelText}</button>
        <button class="sweetos-confirm-btn-primary" id="sweetos-prompt-ok">${confirmText}</button>
      </div>
    `;

    overlay.appendChild(dialog);

    const input = dialog.querySelector('#sweetos-prompt-input');
    input.addEventListener('focus', () => {
      input.style.borderColor = '#0052cc';
      input.style.boxShadow = '0 0 0 3px rgba(0, 82, 204, 0.12)';
      input.style.background = 'white';
    });
    input.addEventListener('blur', () => {
      input.style.borderColor = '#cbd5e1';
      input.style.boxShadow = 'none';
      input.style.background = '#f8fafc';
    });

    const cleanup = (val) => {
      overlay.style.animation = 'sweetos-fade-in 0.18s ease reverse';
      dialog.style.animation = 'sweetos-scale-in 0.18s ease reverse';
      setTimeout(() => {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        resolve(val);
      }, 160);
    };

    dialog.querySelector('#sweetos-prompt-ok').addEventListener('click', () => {
      cleanup(input.value.trim());
    });
    dialog.querySelector('#sweetos-prompt-cancel').addEventListener('click', () => cleanup(null));
    
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cleanup(null);
    });

    const keyHandler = (e) => {
      if (e.key === 'Escape') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(null);
      } else if (e.key === 'Enter') {
        document.removeEventListener('keydown', keyHandler);
        cleanup(input.value.trim());
      }
    };
    document.addEventListener('keydown', keyHandler);

    document.body.appendChild(overlay);
    setTimeout(() => {
      input.focus();
      input.select();
    }, 50);
  });
}

// Global window registration
if (typeof window !== 'undefined') {
  window.showConfirmModal = showConfirmModal;
  window.showConfirm = (msg, title, confirmText, cancelText) => {
    if (typeof msg === 'object' && msg !== null) {
      return showConfirmModal(msg);
    }
    return showConfirmModal({
      title: title || 'Confirmation Required',
      message: msg || 'Are you sure you want to proceed?',
      confirmText: confirmText || 'Confirm',
      cancelText: cancelText || 'Cancel'
    });
  };

  window.showPromptModal = showPromptModal;
  window.showPrompt = (message, title, defaultValue, placeholder) => {
    if (typeof message === 'object' && message !== null) {
      return showPromptModal(message);
    }
    return showPromptModal({
      title: title || 'Input Required',
      message: message || 'Please enter a value:',
      defaultValue: defaultValue || '',
      placeholder: placeholder || 'Type here...'
    });
  };
}
