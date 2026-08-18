export function getCartStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_cart_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_cart_guest';
}

export function getProfileStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_user_profile_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_user_profile_guest';
}

export function getNotificationsStorageKey() {
  const userJson = localStorage.getItem('SWEETOS_logged_in_user');
  if (userJson) {
    try {
      const user = JSON.parse(userJson);
      if (user && user.email) {
        const safeKey = user.email.replace(/[^a-zA-Z0-9]/g, '_');
        return `SWEETOS_notifications_${safeKey}`;
      }
    } catch (e) {}
  }
  return 'SWEETOS_notifications_guest';
}

export function formatPrice(price) {
  return `${Math.round(price).toLocaleString()} CFA`;
}
