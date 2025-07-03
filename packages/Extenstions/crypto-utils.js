/**
 * Crypto utilities for the browser extension
 * Simplified version of the frontend-web crypto functions
 * Works in both service worker and regular browser contexts
 */

// Environment variable equivalent - this should be the same as NEXT_PUBLIC_INDEXED_DB_AES_KEY
const INDEXED_DB_AES_KEY = "HxmfPmPwqQZ3gHKwfHXi6TmPwVDppr0oDKyPwCdopDI=";

// Get the appropriate global context (self for service workers, window for regular contexts)
const globalContext = (function() {
  if (typeof self !== 'undefined') {
    return self;
  } else if (typeof window !== 'undefined') {
    return window;
  } else {
    throw new Error('Unable to locate global object');
  }
})();

/**
 * Gets the AES encryption key for localStorage encryption
 */
function getStorageEncryptionKey() {
  try {
    const binaryString = atob(INDEXED_DB_AES_KEY);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    if (bytes.length !== 32) {
      throw new Error("Invalid storage encryption key length");
    }

    const hexKey = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    return hexKey;
  } catch (error) {
    console.error("Error processing storage encryption key:", error);
    throw new Error("Failed to process storage encryption key");
  }
}

/**
 * Import a key from a hex string
 */
async function importKey(keyHex) {
  try {
    const keyArray = new Uint8Array(keyHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    return await globalContext.crypto.subtle.importKey("raw", keyArray, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
  } catch (error) {
    console.error("Key import error:", error);
    throw new Error("Invalid encryption key format");
  }
}

/**
 * Encrypt data for localStorage storage
 */
async function encryptForLocalStorage(value) {
  try {
    const key = getStorageEncryptionKey();
    const rawKey = await importKey(key);
    const encoder = new TextEncoder();
    const iv = globalContext.crypto.getRandomValues(new Uint8Array(12));
    const encrypted = await globalContext.crypto.subtle.encrypt(
      { name: "AES-GCM", iv },
      rawKey,
      encoder.encode(value)
    );

    const encryptedArray = new Uint8Array(encrypted);
    const encryptedBase64 = btoa(String.fromCharCode(...encryptedArray));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return `${ivBase64}.${encryptedBase64}`;
  } catch (error) {
    console.error("Error encrypting for local storage:", error);
    throw new Error("Failed to encrypt data for local storage");
  }
}

/**
 * Decrypt data from localStorage
 */
async function decryptFromLocalStorage(encryptedValue) {
  if (!encryptedValue) {
    return null;
  }
  
  try {
    const key = getStorageEncryptionKey();
    const rawKey = await importKey(key);
    
    const [ivBase64, encryptedBase64] = encryptedValue.split('.');
    
    if (!ivBase64 || !encryptedBase64) {
      throw new Error("Invalid encrypted data format");
    }
    
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
    
    const decrypted = await globalContext.crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      rawKey,
      encryptedArray
    );
    
    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Error decrypting from local storage:", error);
    return null;
  }
}

/**
 * Decrypt data using AES-GCM
 */
async function decryptData(encryptedHex, ivHex, keyHex) {
  try {
    const encryptedArray = new Uint8Array(encryptedHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

    const rawKey = await importKey(keyHex);
    const decrypted = await globalContext.crypto.subtle.decrypt({ name: "AES-GCM", iv }, rawKey, encryptedArray);

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    console.error("Decryption error:", error);
    throw new Error("Failed to decrypt data");
  }
}

/**
 * Decrypt data field using the project's AES key
 */
async function decryptDataField(encryptedString, projectAesKey) {
  try {
    const [ivHex, encryptedHex] = encryptedString.split('.');
    
    if (!ivHex || !encryptedHex) {
      throw new Error("Invalid encrypted data format");
    }
    
    return await decryptData(encryptedHex, ivHex, projectAesKey);
  } catch (error) {
    console.error("Error decrypting data field:", error);
    throw new Error("Failed to decrypt data field");
  }
}

// Export functions for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    encryptForLocalStorage,
    decryptFromLocalStorage,
    decryptDataField,
    importKey,
    decryptData
  };
} else {
  // For browser environments (both service workers and regular contexts)
  globalContext.CryptoUtils = {
    encryptForLocalStorage,
    decryptFromLocalStorage,
    decryptDataField,
    importKey,
    decryptData
  };
} 