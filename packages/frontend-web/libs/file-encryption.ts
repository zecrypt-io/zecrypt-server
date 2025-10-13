/**
 * File encryption utilities for Drive feature
 * Encrypts/decrypts file blobs using AES-GCM with project keys
 */

import { importKey } from './encryption';

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

/**
 * Validate file size (max 50MB by default)
 */
export function validateFileSize(file: File, maxSizeMB: number = MAX_FILE_SIZE_MB): boolean {
  const maxBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxBytes;
}

/**
 * Read a file as ArrayBuffer using FileReader
 */
function readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file as ArrayBuffer'));
      }
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Encrypt a file blob using AES-GCM
 * @param file The file to encrypt
 * @param projectAesKey The project's AES key in hex format
 * @returns Object with encrypted blob, IV (hex string), and original size
 */
export async function encryptFileBlob(
  file: File,
  projectAesKey: string
): Promise<{ encryptedBlob: Blob; iv: string; originalSize: number }> {
  try {
    // 1. Read file as ArrayBuffer
    const fileBuffer = await readFileAsArrayBuffer(file);
    const originalSize = fileBuffer.byteLength;

    // 2. Import the AES key
    const rawKey = await importKey(projectAesKey);

    // 3. Generate random IV (12 bytes for AES-GCM)
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    // 4. Encrypt the file data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      rawKey,
      fileBuffer
    );

    // 5. Convert IV to hex string for storage
    const ivHex = Array.from(iv)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    // 6. Create blob from encrypted data
    const encryptedBlob = new Blob([encryptedBuffer], { type: 'application/octet-stream' });

    return {
      encryptedBlob,
      iv: ivHex,
      originalSize,
    };
  } catch (error) {
    console.error('Error encrypting file blob:', error);
    throw new Error('Failed to encrypt file');
  }
}

/**
 * Decrypt an encrypted file blob
 * @param encryptedBlob The encrypted blob to decrypt
 * @param ivHex The IV as hex string
 * @param projectAesKey The project's AES key in hex format
 * @returns Decrypted blob
 */
export async function decryptFileBlob(
  encryptedBlob: Blob,
  ivHex: string,
  projectAesKey: string
): Promise<Blob> {
  try {
    // 1. Read encrypted blob as ArrayBuffer
    const encryptedBuffer = await encryptedBlob.arrayBuffer();

    // 2. Convert hex IV to Uint8Array
    const iv = new Uint8Array(
      ivHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16))
    );

    // 3. Import the AES key
    const rawKey = await importKey(projectAesKey);

    // 4. Decrypt the data
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      rawKey,
      encryptedBuffer
    );

    // 5. Create blob from decrypted data
    const decryptedBlob = new Blob([decryptedBuffer]);

    return decryptedBlob;
  } catch (error) {
    console.error('Error decrypting file blob:', error);
    throw new Error('Failed to decrypt file');
  }
}

/**
 * Format file size in human-readable format
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Download file from URL
 */
export async function downloadFileFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  
  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('File not found in storage. The file may have been deleted or never uploaded.');
    }
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  
  const blob = await response.blob();
  return blob;
}

/**
 * Save decrypted blob as file download
 */
export function saveDecryptedFile(blob: Blob, fileName: string, mimeType: string): void {
  const blobWithType = new Blob([blob], { type: mimeType });
  const url = URL.createObjectURL(blobWithType);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download, decrypt and save a file
 */
export async function decryptAndDownloadFile(
  downloadUrl: string,
  fileName: string,
  mimeType: string,
  ivHex: string,
  projectAesKey: string
): Promise<void> {
  // 1. Download encrypted file
  const encryptedBlob = await downloadFileFromUrl(downloadUrl);
  
  // 2. Decrypt the file
  const decryptedBlob = await decryptFileBlob(encryptedBlob, ivHex, projectAesKey);
  
  // 3. Trigger download
  saveDecryptedFile(decryptedBlob, fileName, mimeType);
}

