/**
 * Project-specific crypto utilities for managing project keys
 */

import { importKeyFromString } from './crypto-utils';
import { getUserPrivateKey, storeProjectKey, getProjectKey, getUserEncryptionKeys } from './indexed-db-utils';
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
  try {
    const response = await axiosInstance.get(`/${workspaceId}/project-keys`);
    
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
  console.log('[ProjectCrypto] decryptProjectKey - Start');
  console.log(`[ProjectCrypto] Encrypted key length: ${encryptedKey?.length || 0}`);
  console.log(`[ProjectCrypto] Private key length: ${privateKeyBase64?.length || 0}`);
  
  try {
    // Import the user's private key
    console.log('[ProjectCrypto] Importing private key from string...');
    const privateKey = await importKeyFromString(privateKeyBase64, 'private', 'decrypt');
    console.log('[ProjectCrypto] Successfully imported private key');
    
    // Convert the base64 encrypted key to bytes
    console.log('[ProjectCrypto] Converting encrypted key from base64 to bytes...');
    try {
      const encryptedBytes = Uint8Array.from(atob(encryptedKey), c => c.charCodeAt(0));
      console.log(`[ProjectCrypto] Successfully converted encrypted key to bytes, length: ${encryptedBytes.length}`);
    
      // Decrypt using the private key
      console.log('[ProjectCrypto] Decrypting with RSA-OAEP...');
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        { name: "RSA-OAEP" },
        privateKey,
        encryptedBytes
      );
      console.log(`[ProjectCrypto] Successfully decrypted, buffer length: ${decryptedBuffer.byteLength}`);
      
      // Convert to string
      const result = new TextDecoder().decode(decryptedBuffer);
      console.log(`[ProjectCrypto] Decrypted result length: ${result.length}`);
      return result;
    } catch (atobError) {
      console.error('[ProjectCrypto] Error in base64 decoding or decryption:', atobError);
      throw new Error(`Failed to process encrypted key: ${atobError instanceof Error ? atobError.message : String(atobError)}`);
    }
  } catch (error) {
    console.error('[ProjectCrypto] Error in decryptProjectKey:', error);
    throw error;
  }
}

// Process and store project keys for a user
export async function processAndStoreProjectKeys(
  workspaceId: string,
  userId: string
): Promise<void> {
  try {
    // Get the user's private key from IndexedDB
    const privateKey = await getUserPrivateKey(userId);
    
    if (!privateKey) {
      throw new Error('User private key not found in IndexedDB');
    }

    // Log the key format to help with diagnosis
    console.log(`[ProjectCrypto] Got privateKey from IndexedDB, format check: ${privateKey.includes('.') ? 'Contains dots, might be encrypted' : 'No dots, might be base64'}`);
    
    // Check if the private key appears to be in the salt.iv.encryptedData format
    if (privateKey.includes('.') && privateKey.split('.').length === 3) {
      console.error('[ProjectCrypto] Private key from IndexedDB is still in encrypted format (salt.iv.data)');
      console.error('[ProjectCrypto] Need to decrypt the private key first using the master password');
      throw new Error('Private key is in encrypted format - user needs to unlock with master password first');
    }
    
    // Fetch project keys from API
    const projectKeys = await fetchProjectKeys(workspaceId);
    
    // Process each project key
    for (const projectKey of projectKeys) {
      try {
        // Check if this is for the current user
        if (projectKey.user_id !== userId) {
          continue;
        }
        
        // Decrypt the project key using the user's private key
        const decryptedKey = await decryptProjectKey(projectKey.project_key, privateKey);
        
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
  try {
    // Try to get from local storage first
    const localKey = await getProjectKey(projectId);
    
    if (localKey) {
      return localKey;
    }
    
    // If not found locally, fetch from API, process, and store
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
  try {
    // Get private key from IndexedDB
    const privateKey = await getUserPrivateKey(userId);

    if (!privateKey) {
      // If no private key is available, we need user input first
      // This will be handled by the encryption unlock modal
      return false;
    }
    
    // Process all available workspaces
    for (const workspaceId of workspaceIds) {
      try {
        await processAndStoreProjectKeys(workspaceId, userId);
        console.log('Project keys processed and stored for workspace:', workspaceId);
      } catch (workspaceError) {
        console.error(`Error processing keys for workspace ${workspaceId}:`, workspaceError);
        // Continue with other workspaces even if one fails
      }
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing project key system:', error);
    return false;
  }
} 