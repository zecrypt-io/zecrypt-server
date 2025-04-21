/**
 * Wallet Passphrase API functions
 * Contains all the API calls related to wallet passphrases management
 */

import { API_ROUTES } from '@/constants/routes';

// API Types
export interface WalletCreateData {
  name: string;
  phrase: string;
  wallet_address: string;
  wallet_type: string;
  tag: string[];
}

export interface WalletUpdateData extends WalletCreateData {}

// Add new wallet API endpoint
export const createWalletPassphrase = async (
  workspaceId: string,
  projectId: string,
  accessToken: string,
  data: WalletCreateData
) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    const baseWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Check if baseUrl already includes /api/v1/web
    const apiPrefix = baseWithoutTrailingSlash.includes('/api/v1/web') ? '' : '/api/v1/web';
    const url = `${baseWithoutTrailingSlash}${apiPrefix}${API_ROUTES.WALLET.PASSPHRASES.CREATE(workspaceId, projectId)}`;
    
    console.log('Request URL:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json();
    console.log('API Response:', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to create wallet passphrase');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error creating wallet passphrase:', error);
    throw error;
  }
};

// Update wallet API endpoint
export const updateWalletPassphrase = async (
  workspaceId: string,
  projectId: string,
  walletId: string,
  accessToken: string,
  data: WalletUpdateData
) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    const baseWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Check if baseUrl already includes /api/v1/web
    const apiPrefix = baseWithoutTrailingSlash.includes('/api/v1/web') ? '' : '/api/v1/web';
    const url = `${baseWithoutTrailingSlash}${apiPrefix}${API_ROUTES.WALLET.PASSPHRASES.UPDATE(workspaceId, projectId, walletId)}`;
    
    console.log('Request URL (Update):', url);
    
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken
      },
      body: JSON.stringify(data)
    });
    
    const responseData = await response.json();
    console.log('API Response (Update):', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to update wallet passphrase');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error updating wallet passphrase:', error);
    throw error;
  }
};

// Delete wallet API endpoint
export const deleteWalletPassphrase = async (
  workspaceId: string,
  projectId: string,
  walletId: string,
  accessToken: string
) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    const baseWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Check if baseUrl already includes /api/v1/web
    const apiPrefix = baseWithoutTrailingSlash.includes('/api/v1/web') ? '' : '/api/v1/web';
    const url = `${baseWithoutTrailingSlash}${apiPrefix}${API_ROUTES.WALLET.PASSPHRASES.DELETE(workspaceId, projectId, walletId)}`;
    
    console.log('Request URL (Delete):', url);
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken
      }
    });
    
    const responseData = await response.json();
    console.log('API Response (Delete):', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to delete wallet passphrase');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error deleting wallet passphrase:', error);
    throw error;
  }
};

// Get wallet passphrases API endpoint
export const getWalletPassphrases = async (
  workspaceId: string,
  projectId: string,
  accessToken: string
) => {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.zecrypt.io';
    const baseWithoutTrailingSlash = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
    
    // Check if baseUrl already includes /api/v1/web
    const apiPrefix = baseWithoutTrailingSlash.includes('/api/v1/web') ? '' : '/api/v1/web';
    const url = `${baseWithoutTrailingSlash}${apiPrefix}${API_ROUTES.WALLET.PASSPHRASES.LIST(workspaceId, projectId)}`;
    
    console.log('Request URL (Get Wallets):', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'access-token': accessToken
      }
    });
    
    const responseData = await response.json();
    console.log('API Response (Get Wallets):', responseData);
    
    if (!response.ok) {
      throw new Error(responseData.message || 'Failed to fetch wallet passphrases');
    }
    
    return responseData;
  } catch (error) {
    console.error('Error fetching wallet passphrases:', error);
    throw error;
  }
}; 