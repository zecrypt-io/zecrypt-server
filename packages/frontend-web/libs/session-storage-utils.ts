/**
 * Utility functions for encrypting and decrypting session storage values
 * using AES-GCM 256 with the key from NEXT_PUBLIC_INDEXED_DB_AES_KEY
 */

import { importKey } from './encryption';

/**
 * Gets the AES encryption key from environment variable
 */
export function getStorageEncryptionKey(): string {
  const base64Key = process.env.NEXT_PUBLIC_INDEXED_DB_AES_KEY;
  if (!base64Key) {
    console.error("Missing NEXT_PUBLIC_INDEXED_DB_AES_KEY environment variable");
    throw new Error("Storage encryption key not available");
  }

  try {
    // 1. Decode Base64 to a binary string
    const binaryString = atob(base64Key);

    // 2. Convert binary string to a Uint8Array
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 3. IMPORTANT: Validate key length (AES-256 needs 32 bytes)
    if (bytes.length !== 32) {
        console.error(`Decoded key length is ${bytes.length} bytes. Expected 32 bytes for AES-256.`);
        throw new Error("Invalid storage encryption key length after Base64 decoding. Must be 32 bytes.");
    }

    // 4. Convert Uint8Array to a hexadecimal string
    const hexKey = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hexKey;

  } catch (error) {
    console.error("Error processing storage encryption key (likely Base64 decoding or Hex conversion failed):", error);
    // Check if it's a Base64 decoding error specifically
    if (error instanceof DOMException && error.name === 'InvalidCharacterError') {
        throw new Error("The NEXT_PUBLIC_INDEXED_DB_AES_KEY environment variable is not a valid Base64 string.");
    }
    throw new Error("Failed to process storage encryption key.");
  }
}

/**
 * Encrypts a value before storing it in session storage
 */
export async function encryptForSessionStorage(value: string): Promise<string> {
  try {
    const key = getStorageEncryptionKey();
    const rawKey = await importKey(key);
    const encoder = new TextEncoder();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      rawKey,
      encoder.encode(value)
    );

    // Convert encrypted data and IV to base64 strings
    const encryptedArray = new Uint8Array(encrypted);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    // Combine IV and encrypted data with a separator for storage
    return `${ivBase64}.${encryptedBase64}`;
  } catch (error) {
    console.error("Error encrypting for session storage:", error);
    throw new Error("Failed to encrypt data for session storage");
  }
}

/**
 * Decrypts a value retrieved from session storage
 */
export async function decryptFromSessionStorage(encryptedValue: string | null): Promise<string | null> {
  if (!encryptedValue) {
    return null;
  }
  
  try {
    const key = getStorageEncryptionKey();
    const rawKey = await importKey(key);
    
    // Split the IV and encrypted data
    const [ivBase64, encryptedBase64] = encryptedValue.split('.');
    
    if (!ivBase64 || !encryptedBase64) {
      throw new Error("Invalid encrypted data format");
    }
    
    // Convert base64 strings back to ArrayBuffers
    const ivBinaryString = atob(ivBase64);
    const iv = new Uint8Array(ivBinaryString.length);
    for (let i = 0; i < ivBinaryString.length; i++) {
      iv[i] = ivBinaryString.charCodeAt(i);
    }
    
    const encryptedBinaryString = atob(encryptedBase64);
    const encryptedArray = new Uint8Array(encryptedBinaryString.length);
    for (let i = 0; i < encryptedBinaryString.length; i++) {
      encryptedArray[i] = encryptedBinaryString.charCodeAt(i);
    }
    
    // Decrypt the data
    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      rawKey,
      encryptedArray
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Error decrypting from session storage:", error);
    return null;
  }
}

/**
 * Enhanced version of sessionStorage.setItem that encrypts the value before storing
 */
export async function secureSetItem(key: string, value: string): Promise<void> {
  try {
    const encryptedValue = await encryptForSessionStorage(value);
    sessionStorage.setItem(key, encryptedValue);
  } catch (error) {
    console.error(`Error in secureSetItem for key ${key}:`, error);
    throw error;
  }
}

/**
 * Enhanced version of sessionStorage.getItem that decrypts the value after retrieving
 */
export async function secureGetItem(key: string): Promise<string | null> {
  try {
    const encryptedValue = sessionStorage.getItem(key);
    return await decryptFromSessionStorage(encryptedValue);
  } catch (error) {
    console.error(`Error in secureGetItem for key ${key}:`, error);
    return null;
  }
}

/**
 * Gets the raw project AES key directly from session storage
 * This function explicitly logs the presence/absence of the key
 * to help diagnose encryption issues
 */
export function getProjectKey(projectId: string): string | null {
  if (!projectId) {
    console.warn("getProjectKey called with empty projectId");
    return null;
  }
  
  // NOTE: The key format is projectKey_[projectId] not project_[projectId]_key
  const key = sessionStorage.getItem(`projectKey_${projectId}`);
  
  if (key) {
    console.log(`Found project key for project ${projectId}`);
    return key;
  } else {
    console.warn(`No project key found for project ${projectId}`);
    return null;
  }
} 