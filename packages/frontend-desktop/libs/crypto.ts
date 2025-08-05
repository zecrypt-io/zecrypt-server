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

// Load fixed salt
const FIXED_SALT = process.env.NEXT_PUBLIC_HASH_SALT?.trim() || 'zecrypt';

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

export { hashData, FIXED_SALT };