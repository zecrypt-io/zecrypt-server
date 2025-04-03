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

