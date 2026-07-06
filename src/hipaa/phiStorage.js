import {
  PHI_SESSION_STORAGE_KEYS,
  PHI_STORAGE_PREFIXES,
} from './config';

function storageKeyMatchesPrefix(key, prefix) {
  return key === prefix || key.startsWith(`${prefix}:`) || key.startsWith(`${prefix}.`);
}

/**
 * Remove PHI-bearing keys from browser storage on logout (addressable safeguard).
 */
export function purgePhiFromBrowser() {
  if (typeof window === 'undefined') return;

  try {
    const keysToRemove = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      if (PHI_STORAGE_PREFIXES.some((prefix) => storageKeyMatchesPrefix(key, prefix))) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }

  try {
    PHI_SESSION_STORAGE_KEYS.forEach((key) => sessionStorage.removeItem(key));
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('caresense.attendance')) {
        sessionStorage.removeItem(key);
      }
    }
  } catch {
    // ignore
  }
}

export function clearAuthStorage() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  purgePhiFromBrowser();
}
