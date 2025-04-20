// libs/local-storage-utils.ts

// Safe localStorage wrapper to handle SSR
export const saveToLocalStorage = (key: string, value: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Save user data to localStorage
export const saveUserData = (userData: any) => {
  if (typeof window === 'undefined' || !userData) return;
  
  if (userData.access_token) {
    saveToLocalStorage('zecrypt_access_token', userData.access_token);
  }
  
  if (userData.user_id) {
    saveToLocalStorage('zecrypt_user_id', userData.user_id);
  }
  
  if (userData.name) {
    saveToLocalStorage('zecrypt_user_name', userData.name);
  }
  
  if (userData.profile_url) {
    saveToLocalStorage('zecrypt_profile_url', userData.profile_url);
  }
  
  if (userData.language) {
    saveToLocalStorage('zecrypt_language', userData.language);
  }
};

// Helper function to get stored user data
export const getStoredUserData = () => {
  if (typeof window === 'undefined') return null;
  
  try {
    return {
      access_token: localStorage.getItem('zecrypt_access_token'),
      user_id: localStorage.getItem('zecrypt_user_id'),
      name: localStorage.getItem('zecrypt_user_name'),
      profile_url: localStorage.getItem('zecrypt_profile_url'),
      language: localStorage.getItem('zecrypt_language')
    };
  } catch (err) {
    console.error('Error reading from localStorage:', err);
    return null;
  }
};

// Remove user data from localStorage (for logout)
export const clearUserData = () => {
  if (typeof window === 'undefined') return;
  
  localStorage.removeItem('zecrypt_access_token');
  localStorage.removeItem('zecrypt_user_id');
  localStorage.removeItem('zecrypt_user_name');
  localStorage.removeItem('zecrypt_profile_url');
  localStorage.removeItem('zecrypt_language');
}; 