// utils/crypto.ts
// Utility: Convert string to Uint8Array
function encode(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

// Utility: Convert ArrayBuffer or Uint8Array to hex string
function toHex(buffer: ArrayBuffer | Uint8Array): string {
  const uint8Array = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(uint8Array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Load fixed salt and encryption key
const FIXED_SALT = process.env.NEXT_PUBLIC_HASH_SALT?.trim() || 'zecrypt';
// Default key as fallback, but prefer environment variable
const ENCRYPTION_KEY = process.env.NEXT_PUBLIC_ENCRYPTION_KEY?.trim() || '2b61777f7ff1b61aade14cd41a09ccd67a907da2b6e06c9a0e8020504658b009cc';

// Main hash function
async function hashData(
  data: string | object,
  salt: Uint8Array | string = FIXED_SALT
): Promise<{ hash: string; salt: string }> {
  let dataStr: string;

  if (typeof data === "object") {
    dataStr = JSON.stringify(data, Object.keys(data).sort());
  } else {
    dataStr = data;
  }

  let saltBytes: Uint8Array;
  if (typeof salt === "string") {
    saltBytes = encode(salt.trim());
  } else {
    saltBytes = salt;
  }

  const dataBytes = encode(dataStr);
  const inputBytes = new Uint8Array(saltBytes.length + dataBytes.length);
  inputBytes.set(saltBytes, 0);
  inputBytes.set(dataBytes, saltBytes.length);

  const hashBuffer = await crypto.subtle.digest("SHA-512", inputBytes);
  return {
    hash: toHex(hashBuffer),
    salt: toHex(saltBytes),
  };
}

// Utility: Decode Uint8Array to string
function decode(buffer: Uint8Array): string {
  return new TextDecoder().decode(buffer);
}

// Convert hex key string to CryptoKey
async function hexToCryptoKey(keyString: string = ENCRYPTION_KEY): Promise<CryptoKey> {
  // Trim the key to remove any whitespace
  const trimmedKey = keyString.trim();
  let keyBuffer: Uint8Array;

  // Try as hex string
  if (/^[0-9a-fA-F]{64}$/.test(trimmedKey)) {
    const hexMatches = trimmedKey.match(/.{1,2}/g);
    if (!hexMatches) {
      throw new Error("Invalid hex encryption key format");
    }
    keyBuffer = new Uint8Array(hexMatches.map(byte => parseInt(byte, 16)));
  } 
  // If the key looks like a Python byte string, try to convert it
  else if (trimmedKey.includes('\\x')) {
    try {
      // Extract hex bytes from strings like \x7f
      const hexBytes = trimmedKey.match(/\\x[0-9a-fA-F]{2}|./g) || [];
      keyBuffer = new Uint8Array(
        hexBytes.map(char => {
          if (char.startsWith('\\x')) {
            return parseInt(char.slice(2), 16);
          } else {
            return char.charCodeAt(0);
          }
        })
      );
    } catch (e) {
      throw new Error("Failed to parse encryption key with escape sequences");
    }
  } else {
    throw new Error("Invalid key format: expected 64-character hex string");
  }

  // Validate key length (32 bytes for AES-256-GCM)
  if (keyBuffer.length !== 32) {
    throw new Error(`Invalid encryption key length: must be 32 bytes`);
  }

  return await crypto.subtle.importKey(
    "raw",
    keyBuffer,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// Encrypt function
async function encrypt(data: string, key: CryptoKey): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    encode(data)
  );

  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);

  return btoa(String.fromCharCode(...combined));
}

// Decrypt function
async function decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
  const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: iv,
    },
    key,
    ciphertext
  );

  return decode(new Uint8Array(decryptedBuffer));
}

export { hashData, encrypt, decrypt, hexToCryptoKey, FIXED_SALT, ENCRYPTION_KEY };