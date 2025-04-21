import { getStoredUserData } from './local-storage-utils';
import { store } from './Redux/store';
import { UserState } from './Redux/userSlice';
import { API_ROUTES } from '@/constants/routes';

export async function fetchLoginHistory() {
  try {
    // Get access token from Redux store instead of local storage
    const state = store.getState();
    const accessToken = state.user.userData?.access_token;
    
    if (!accessToken) {
      throw new Error('No access token found');
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    // Remove trailing slash from baseUrl if it exists
    const baseUrlNoTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Construct the full URL using the routes constant
    const fullUrl = `${baseUrlNoTrailingSlash}${API_ROUTES.USER.LOGIN_HISTORY}`;
    
    const res = await fetch(fullUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "access-token": accessToken
      },
      credentials: "include",
    });

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching login history:", error);
    throw error;
  }
}

// Format the date string from API
export function formatDate(dateString: string) {
  const date = new Date(dateString);
  
  // Format date: Apr 18, 2025
  const formattedDate = date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
  
  // Format time: 1:04 AM
  const formattedTime = date.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true
  });
  
  return `${formattedDate} at ${formattedTime}`;
}

// Get device info string
export function getDeviceInfo(entry: any) {
  if (entry.device?.is_mobile) {
    return entry.device.type !== 'Other' ? `${entry.device.type} (Mobile)` : 'Mobile device';
  } else if (entry.device?.is_tablet) {
    return entry.device.type !== 'Other' ? `${entry.device.type} (Tablet)` : 'Tablet';
  } else if (entry.device?.is_pc) {
    return 'Computer';
  }
  return 'Unknown device';
} 