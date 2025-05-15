/**
 * Utility functions for client-side encryption using AES-GCM
 */

// Import a key from a hex string
export async function importKey(keyHex: string) {
  try {
    // Convert hex key to ArrayBuffer
    const keyArray = new Uint8Array(keyHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))

    return await window.crypto.subtle.importKey("raw", keyArray, { name: "AES-GCM" }, false, ["encrypt", "decrypt"])
  } catch (error) {
    console.error("Key import error:", error)
    throw new Error("Invalid encryption key format")
  }
}

// Encrypt data using AES-GCM
export async function encryptData(data: string, keyHex: string) {
  try {
    const encoder = new TextEncoder()
    const rawKey = await importKey(keyHex)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await window.crypto.subtle.encrypt({ name: "AES-GCM", iv }, rawKey, encoder.encode(data))

    // Convert encrypted data and IV to hex strings for storage
    const encryptedArray = Array.from(new Uint8Array(encrypted))
    const encryptedHex = encryptedArray.map((b) => b.toString(16).padStart(2, "0")).join("")
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")

    return { encryptedData: encryptedHex, iv: ivHex }
  } catch (error) {
    console.error("Encryption error:", error)
    throw new Error("Failed to encrypt data")
  }
}

// Decrypt data using AES-GCM
export async function decryptData(encryptedHex: string, ivHex: string, keyHex: string) {
  try {
    // Convert hex strings back to ArrayBuffers
    const encryptedArray = new Uint8Array(encryptedHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)))

    const rawKey = await importKey(keyHex)
    const decrypted = await window.crypto.subtle.decrypt({ name: "AES-GCM", iv }, rawKey, encryptedArray)

    return new TextDecoder().decode(decrypted)
  } catch (error) {
    console.error("Decryption error:", error)
    throw new Error("Failed to decrypt data. Invalid encryption key.")
  }
}

// Generate a new encryption key
export function generateEncryptionKey() {
  const array = new Uint8Array(32) // 256-bit key
  window.crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Helper function to get the current encryption key from session storage
export function getCurrentEncryptionKey() {
  return sessionStorage.getItem("encryptionKey") || ""
}

// Check if an encryption key exists in the current session
export function hasEncryptionKey() {
  return !!getCurrentEncryptionKey()
}

// Import RSA public key for encryption
export async function importRSAPublicKey(publicKeyPem: string) {
  try {
    // Remove header, footer, and newlines from PEM
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = publicKeyPem.replace(pemHeader, "").replace(pemFooter, "").replace(/\s/g, "");
    
    // Decode base64
    const binaryDer = window.atob(pemContents);
    const buffer = new ArrayBuffer(binaryDer.length);
    const bufView = new Uint8Array(buffer);
    for (let i = 0; i < binaryDer.length; i++) {
      bufView[i] = binaryDer.charCodeAt(i);
    }
    
    // Import key
    return await window.crypto.subtle.importKey(
      "spki",
      buffer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256"
      },
      false,
      ["encrypt"]
    );
  } catch (error) {
    console.error("Error importing RSA public key:", error);
    throw new Error("Failed to import RSA public key");
  }
}

// Encrypt AES key with RSA public key
export async function encryptAESKeyWithRSA(aesKeyHex: string, rsaPublicKey: CryptoKey) {
  try {
    // Convert hex AES key to ArrayBuffer
    const aesKeyArray = new Uint8Array(aesKeyHex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)));
    
    // Encrypt the AES key with RSA-OAEP
    const encryptedKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      rsaPublicKey,
      aesKeyArray
    );
    
    // Convert to base64 string for API transmission
    const encryptedKeyArray = Array.from(new Uint8Array(encryptedKey));
    const base64Key = btoa(String.fromCharCode.apply(null, encryptedKeyArray));
    
    return base64Key;
  } catch (error) {
    console.error("Error encrypting AES key with RSA:", error);
    throw new Error("Failed to encrypt AES key");
  }
}

// Generate and encrypt a new AES key for project creation
export async function generateEncryptedProjectKey(publicKeyPem: string) {
  // Generate a new AES key
  const aesKey = generateEncryptionKey();
  
  // Import the RSA public key
  const rsaPublicKey = await importRSAPublicKey(publicKeyPem);
  
  // Encrypt the AES key with the RSA public key
  const encryptedKey = await encryptAESKeyWithRSA(aesKey, rsaPublicKey);
  
  return {
    aesKey, // plain AES key to store in session storage for current use
    encryptedKey // encrypted key to send to the server
  };
}

