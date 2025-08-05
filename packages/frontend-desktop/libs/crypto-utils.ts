/**
 * Crypto utilities for RSA-OAEP key generation and password-based encryption
 */

/**
 * Generates an RSA-OAEP public/private key pair.
 */
export async function generateRsaKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
  return window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([0x01, 0x00, 0x01]), // 65537
      hash: "SHA-256",
    },
    true, // exportable
    ["encrypt", "decrypt"] // For RSA-OAEP
  );
}

/**
 * Exports a CryptoKey to a Base64 encoded string.
 * @param key The CryptoKey to export
 * @param type Whether it's a 'public' (SPKI) or 'private' (PKCS8) key
 */
export async function exportKeyToString(key: CryptoKey, type: 'public' | 'private'): Promise<string> {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const exported = await window.crypto.subtle.exportKey(format, key);
  
  // Convert ArrayBuffer to base64 string
  const byteArray = new Uint8Array(exported);
  let byteString = '';
  for (let i = 0; i < byteArray.byteLength; i++) {
    byteString += String.fromCharCode(byteArray[i]);
  }
  return btoa(byteString);
}

/**
 * Imports a CryptoKey from a Base64 encoded string.
 * @param keyString The Base64 encoded key string 
 * @param type Whether it's a 'public' (SPKI) or 'private' (PKCS8) key
 * @param usage Key usage ('encrypt' for public, 'decrypt' for private)
 */
export async function importKeyFromString(
  keyString: string, 
  type: 'public' | 'private', 
  usage: 'encrypt' | 'decrypt'
): Promise<CryptoKey> {
  const format = type === 'public' ? 'spki' : 'pkcs8';
  const usages = [usage];
  
  // Convert base64 string to ArrayBuffer
  const binaryString = atob(keyString);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return window.crypto.subtle.importKey(
    format,
    bytes,
    {
      name: "RSA-OAEP",
      hash: "SHA-256",
    },
    true,
    usages
  );
}

/**
 * Derives a symmetric encryption key from a password using PBKDF2.
 */
export async function deriveKeyFromPassword(
  password: string, 
  salt: Uint8Array
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  const importedPasswordKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000, // Recommended minimum
      hash: "SHA-256",
    },
    importedPasswordKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data using a derived AES-GCM key.
 */
export async function encryptWithDerivedKey(
  dataString: string,
  derivedKey: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const encoder = new TextEncoder();
  const iv = window.crypto.getRandomValues(new Uint8Array(12)); // AES-GCM recommended IV size

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    derivedKey,
    encoder.encode(dataString)
  );

  // Convert to base64 for storage
  const encryptedData = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
  const ivString = btoa(String.fromCharCode(...new Uint8Array(iv)));

  return { encryptedData, iv: ivString };
}

/**
 * Decrypts data using a derived AES-GCM key.
 */
export async function decryptWithDerivedKey(
  encryptedDataString: string,
  ivString: string,
  derivedKey: CryptoKey
): Promise<string> {
  // Convert from base64
  const encryptedBinaryString = atob(encryptedDataString);
  const encryptedBytes = new Uint8Array(encryptedBinaryString.length);
  for (let i = 0; i < encryptedBinaryString.length; i++) {
    encryptedBytes[i] = encryptedBinaryString.charCodeAt(i);
  }
  
  const ivBinaryString = atob(ivString);
  const iv = new Uint8Array(ivBinaryString.length);
  for (let i = 0; i < ivBinaryString.length; i++) {
    iv[i] = ivBinaryString.charCodeAt(i);
  }

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    derivedKey,
    encryptedBytes
  );

  // Convert from ArrayBuffer to string
  return new TextDecoder().decode(decryptedBuffer);
}

/**
 * Combines salt, iv, and encrypted data into a single string
 * Format: base64(salt).base64(iv).base64(encryptedData)
 */
export function combineEncryptedComponents(
  saltBase64: string, 
  ivBase64: string, 
  encryptedDataBase64: string
): string {
  return `${saltBase64}.${ivBase64}.${encryptedDataBase64}`;
}

/**
 * Extracts salt, iv, and encrypted data from a combined string
 * Expected format: base64(salt).base64(iv).base64(encryptedData)
 */
export function extractEncryptedComponents(combinedString: string): {
  salt: string;
  iv: string;
  encryptedData: string;
} {
  const parts = combinedString.split('.');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted key format');
  }
  
  return {
    salt: parts[0],
    iv: parts[1],
    encryptedData: parts[2],
  };
} 