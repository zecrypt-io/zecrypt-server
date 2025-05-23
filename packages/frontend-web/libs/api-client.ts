import { getStoredUserData } from './local-storage-utils';
import { store } from './Redux/store';
import { UserState } from './Redux/userSlice';
import { API_ROUTES } from '@/constants/routes';
import axiosInstance from './Middleware/axiosInstace';

// Define the response structure for get-key
export interface KeyData {
  key: string; // This is the encrypted private key
  public_key: string;
}

export interface GetKeyResponse {
  status_code: number;
  message: string;
  data: KeyData | null;
}

// Define the request body for update-key
export interface UpdateKeyPayload {
  public_key: string;
  private_key: string;
}

export interface UpdateKeyResponse {
  status_code: number;
  message: string;
  data: any;
}

// API call to get user's encryption keys
export async function getUserKeys(): Promise<GetKeyResponse> {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    // NEXT_PUBLIC_API_URL already contains /api/v1/web, so we only need to append the endpoint name
    const fullUrl = `${baseUrl.replace(/\/$/, '')}/get-key`;
    
    // axiosInstance will automatically add the access-token from Redux
    const response = await axiosInstance.get<GetKeyResponse>(fullUrl);
    return response.data;
  } catch (error) {
    console.error("Error fetching user keys:", error);
    throw error;
  }
}

// API call to update/set user's encryption keys
export async function updateUserKeys(payload: UpdateKeyPayload): Promise<UpdateKeyResponse> {
  try {
    // Save the public key to local storage
    if (typeof window !== 'undefined') {
      localStorage.setItem('userPublicKey', payload.public_key);
    }

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    // NEXT_PUBLIC_API_URL already contains /api/v1/web, so we only need to append the endpoint name
    const fullUrl = `${baseUrl.replace(/\/$/, '')}/update-key`;
    
    const response = await axiosInstance.post<UpdateKeyResponse>(fullUrl, payload);
    return response.data;
  } catch (error) {
    console.error("Error updating user keys:", error);
    throw error;
  }
}

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