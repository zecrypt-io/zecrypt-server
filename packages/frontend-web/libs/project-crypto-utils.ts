/**
 * Project-specific crypto utilities for managing project keys
 */

import { importKeyFromString } from './crypto-utils';
import { getUserPrivateKey, storeProjectKey, getProjectKey } from './indexed-db-utils';
import axiosInstance from './Middleware/axiosInstace';

// Project key API interface
interface ProjectKeyResponse {
  doc_id: string;
  project_id: string;
  user_id: string;
  project_key: string;  // This is RSA-encrypted
  workspace_id: string;
  created_at: string;
  updated_at: string;
}

// Fetch project keys from API
export async function fetchProjectKeys(workspaceId: string): Promise<ProjectKeyResponse[]> {
  console.log('[ProjectCrypto] fetchProjectKeys - workspaceId:', workspaceId);
  try {
    const response = await axiosInstance.get(`/${workspaceId}/project-keys`);
    console.log('[ProjectCrypto] fetchProjectKeys - API response.data:', response.data);
    
    if (response.data?.status_code === 200 && Array.isArray(response.data.data)) {
      return response.data.data;
    } else {
      throw new Error(response.data?.message || 'Failed to fetch project keys');
    }
  } catch (error) {
    console.error('Error fetching project keys:', error);
    throw error;
  }
}

// Decrypt a project key with the user's private key
export async function decryptProjectKey(
  encryptedKey: string,
  privateKeyBase64: string
): Promise<string> {
  console.log('[ProjectCrypto] decryptProjectKey - encryptedKey (length):', encryptedKey?.length, 'privateKeyBase64 (length):', privateKeyBase64?.length);
  try {
    // Import the user's private key
    const privateKey = await importKeyFromString(privateKeyBase64, 'private', 'decrypt');
    
    // Convert the base64 encrypted key to bytes
    const encryptedBytes = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
    
    // Decrypt using the private key
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: "RSA-OAEP" },
      privateKey,
      encryptedBytes
    );
    console.log('[ProjectCrypto] decryptProjectKey - decryptedBuffer (byteLength):', decryptedBuffer?.byteLength);
    
    // Convert to string
    return new TextDecoder().decode(decryptedBuffer);
    
  } catch (error) {
    console.error('Error decrypting project key:', error);
    throw error;
  }
}

// Process and store project keys for a user
export async function processAndStoreProjectKeys(
  workspaceId: string,
  userId: string
): Promise<void> {
  console.log('[ProjectCrypto] processAndStoreProjectKeys - workspaceId:', workspaceId, 'userId:', userId);
  try {
    // Get the user's private key from IndexedDB
    const privateKey = await getUserPrivateKey(userId);
    console.log('[ProjectCrypto] processAndStoreProjectKeys - privateKey (length from DB):', privateKey?.length);
    
    if (!privateKey) {
      throw new Error('User private key not found in IndexedDB');
    }
    
    // Fetch project keys from API
    const projectKeys = await fetchProjectKeys(workspaceId);
    console.log('[ProjectCrypto] processAndStoreProjectKeys - projectKeys from API:', projectKeys);
    
    // Process each project key
    for (const projectKey of projectKeys) {
      console.log('[ProjectCrypto] processAndStoreProjectKeys - processing projectKey from API:', projectKey);
      try {
        // Check if this is for the current user
        if (projectKey.user_id !== userId) {
          console.log('[ProjectCrypto] processAndStoreProjectKeys - Skipping project key, user ID mismatch. API user_id:', projectKey.user_id, 'Current userId:', userId);
          continue;
        }
        
        // Decrypt the project key using the user's private key
        const decryptedKey = await decryptProjectKey(projectKey.project_key, privateKey);
        console.log('[ProjectCrypto] processAndStoreProjectKeys - Decrypted project key (length) for projectId', projectKey.project_id, ':', decryptedKey?.length);
        
        // Store the decrypted key in IndexedDB
        await storeProjectKey(projectKey.project_id, userId, decryptedKey);
        
      } catch (decryptError) {
        console.error(`Error processing project key ${projectKey.project_id}:`, decryptError);
        // Continue with other keys even if one fails
      }
    }
  } catch (error) {
    console.error('Error processing and storing project keys:', error);
    throw error;
  }
}

// Get a project key - tries local IndexedDB first, falls back to API if needed
export async function getAndDecryptProjectKey(
  projectId: string,
  workspaceId: string,
  userId: string
): Promise<string | null> {
  console.log('[ProjectCrypto] getAndDecryptProjectKey - projectId:', projectId, 'workspaceId:', workspaceId, 'userId:', userId);
  try {
    // Try to get from local storage first
    const localKey = await getProjectKey(projectId);
    console.log('[ProjectCrypto] getAndDecryptProjectKey - localKey from IndexedDB (length):', localKey?.length);
    
    if (localKey) {
      return localKey;
    }
    
    // If not found locally, fetch from API, process, and store
    console.log('[ProjectCrypto] getAndDecryptProjectKey - localKey not found, fetching from API...');
    await processAndStoreProjectKeys(workspaceId, userId);
    
    // Try to get from local storage again after processing
    return await getProjectKey(projectId);
    
  } catch (error) {
    console.error('Error getting project key:', error);
    return null;
  }
}

// Initialize project keys when the app loads or user logs in
export async function initializeProjectKeySystem(
  userId: string,
  workspaceIds: string[]
): Promise<boolean> {
  console.log('[ProjectCrypto] initializeProjectKeySystem - userId:', userId, 'workspaceIds:', workspaceIds);
  try {
    // Get private key from IndexedDB
    const privateKey = await getUserPrivateKey(userId);
    console.log('[ProjectCrypto] initializeProjectKeySystem - privateKey (length from DB):', privateKey?.length);
    
    if (!privateKey) {
      // If no private key is available, we need user input first
      // This will be handled by the encryption unlock modal
      console.log('[ProjectCrypto] initializeProjectKeySystem - No private key in DB, exiting.');
      return false;
    }
    
    // Process all available workspaces
    for (const workspaceId of workspaceIds) {
      console.log('[ProjectCrypto] initializeProjectKeySystem - Processing workspaceId:', workspaceId);
      try {
        await processAndStoreProjectKeys(workspaceId, userId);
      } catch (workspaceError) {
        console.error(`Error processing keys for workspace ${workspaceId}:`, workspaceError);
        // Continue with other workspaces even if one fails
      }
    }
    
    console.log('[ProjectCrypto] initializeProjectKeySystem - Completed successfully.');
    return true;
  } catch (error) {
    console.error('Error initializing project key system:', error);
    return false;
  }
} 