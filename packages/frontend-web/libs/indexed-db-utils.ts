/**
 * Utilities for working with IndexedDB, specifically for storing encryption keys
 */

const DB_NAME = 'zecrypt-db';
const DB_VERSION = 2; // Increased version for schema update
const ENCRYPTION_KEYS_STORE = 'encryption-keys';
const PROJECT_KEYS_STORE = 'project-keys';

// Opens the IndexedDB connection
async function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }
    
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = (event) => {
      console.error('IndexedDB error:', event);
      reject(new Error('Failed to open IndexedDB'));
    };
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains(ENCRYPTION_KEYS_STORE)) {
        const objectStore = db.createObjectStore(ENCRYPTION_KEYS_STORE, { keyPath: 'userId' });
        objectStore.createIndex('userId', 'userId', { unique: true });
      }
      
      // Create project keys store if it doesn't exist
      if (!db.objectStoreNames.contains(PROJECT_KEYS_STORE)) {
        const projectStore = db.createObjectStore(PROJECT_KEYS_STORE, { keyPath: 'projectId' });
        projectStore.createIndex('projectId', 'projectId', { unique: true });
        projectStore.createIndex('userId', 'userId', { unique: false });
      }
    };
  });
}

// Get the AES key for encrypting IndexedDB data
async function getIndexedDbEncryptionKey(): Promise<CryptoKey> {
  try {
    // In a real production environment, this should be loaded from a secure source
    // For now, we're using process.env (which should be populated in Next.js)
    const envKey = process.env.NEXT_PUBLIC_INDEXED_DB_AES_KEY;
    
    if (!envKey) {
      throw new Error('IndexedDB encryption key not found in environment variables');
    }
    
    // Convert base64 key to array buffer
    const keyData = Uint8Array.from(atob(envKey), c => c.charCodeAt(0));
    
    // Import the key for AES-GCM
    return await window.crypto.subtle.importKey(
      'raw',
      keyData,
      {
        name: 'AES-GCM',
        length: 256
      },
      false, // Not extractable
      ['encrypt', 'decrypt']
    );
  } catch (error) {
    console.error('Error getting IndexedDB encryption key:', error);
    throw new Error('Failed to get IndexedDB encryption key');
  }
}

// Encrypt data before storing in IndexedDB
async function encryptData(data: any): Promise<{ encryptedData: string, iv: string }> {
  try {
    const key = await getIndexedDbEncryptionKey();
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(JSON.stringify(data));
    
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv
      },
      key,
      dataBuffer
    );
    
    // Convert to base64 for storage
    const encryptedData = btoa(String.fromCharCode.apply(null, [...new Uint8Array(encryptedBuffer)]));
    const ivString = btoa(String.fromCharCode.apply(null, [...iv]));
    
    return { encryptedData, iv: ivString };
  } catch (error) {
    console.error('Error encrypting data for IndexedDB:', error);
    throw new Error('Failed to encrypt data');
  }
}

// Decrypt data retrieved from IndexedDB
async function decryptData(encryptedData: string, iv: string): Promise<any> {
  try {
    const key = await getIndexedDbEncryptionKey();
    
    // Convert from base64 to ArrayBuffer
    const encryptedBuffer = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const ivBuffer = Uint8Array.from(atob(iv), c => c.charCodeAt(0));
    
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: ivBuffer
      },
      key,
      encryptedBuffer
    );
    
    // Convert decrypted ArrayBuffer to string and parse as JSON
    const decryptedString = new TextDecoder().decode(decryptedBuffer);
    return JSON.parse(decryptedString);
  } catch (error) {
    console.error('Error decrypting data from IndexedDB:', error);
    throw new Error('Failed to decrypt data');
  }
}

// Retrieves the public and private key for a user
export async function getUserEncryptionKeys(userId: string): Promise<{ 
  publicKey: string | null; 
  privateKey: string | null; 
}> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ENCRYPTION_KEYS_STORE], 'readonly');
      const objectStore = transaction.objectStore(ENCRYPTION_KEYS_STORE);
      const request = objectStore.get(userId);
      
      request.onerror = () => {
        reject(new Error('Failed to get encryption keys from IndexedDB'));
      };
      
      request.onsuccess = async () => {
        if (request.result) {
          try {
            // Decrypt the stored data
            const decryptedData = await decryptData(
              request.result.encryptedData, 
              request.result.iv
            );
            
            resolve({
              publicKey: decryptedData.publicKey,
              privateKey: decryptedData.privateKey
            });
          } catch (error) {
            console.error('Error decrypting user keys:', error);
            resolve({ publicKey: null, privateKey: null });
          }
        } else {
          resolve({ publicKey: null, privateKey: null });
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error retrieving encryption keys:', error);
    return { publicKey: null, privateKey: null };
  }
}

// Stores the public and private key for a user
export async function storeUserEncryptionKeys(
  userId: string, 
  publicKey: string, 
  privateKey: string
): Promise<boolean> {
  try {
    const db = await openDatabase();
    
    // Encrypt the keys before storing
    const { encryptedData, iv } = await encryptData({
      publicKey,
      privateKey
    });
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ENCRYPTION_KEYS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(ENCRYPTION_KEYS_STORE);
      
      const dataToStore = {
        userId,
        encryptedData,
        iv,
        updatedAt: new Date().toISOString()
      };
      
      const request = objectStore.put(dataToStore);
      
      request.onerror = (event) => {
        console.error('Error storing in IndexedDB:', event);
        reject(new Error('Failed to store encryption keys in IndexedDB'));
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error storing encryption keys:', error);
    return false;
  }
}

// Store project AES key in IndexedDB (decrypted version)
export async function storeProjectKey(
  projectId: string,
  userId: string,
  projectKey: string
): Promise<boolean> {
  console.log('[IndexedDB] storeProjectKey - projectId:', projectId, 'userId:', userId, 'projectKey (length):', projectKey?.length);
  try {
    const db = await openDatabase();
    
    // Encrypt the project key before storing
    const { encryptedData, iv } = await encryptData({
      projectKey
    });
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_KEYS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(PROJECT_KEYS_STORE);
      
      const dataToStore = {
        projectId,
        userId,
        encryptedData,
        iv,
        updatedAt: new Date().toISOString()
      };
      console.log('[IndexedDB] storeProjectKey - dataToStore:', dataToStore);
      
      const request = objectStore.put(dataToStore);
      
      request.onerror = (event) => {
        console.error('Error storing project key in IndexedDB:', event);
        reject(new Error('Failed to store project key in IndexedDB'));
      };
      
      request.onsuccess = () => {
        console.log('[IndexedDB] storeProjectKey - Successfully stored project key for projectId:', projectId);
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error storing project key:', error);
    return false;
  }
}

// Get project AES key from IndexedDB
export async function getProjectKey(projectId: string): Promise<string | null> {
  console.log('[IndexedDB] getProjectKey - projectId:', projectId);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_KEYS_STORE], 'readonly');
      const objectStore = transaction.objectStore(PROJECT_KEYS_STORE);
      const request = objectStore.get(projectId);
      
      request.onerror = () => {
        reject(new Error('Failed to get project key from IndexedDB'));
      };
      
      request.onsuccess = async () => {
        console.log('[IndexedDB] getProjectKey - request.result for projectId:', projectId, 'is:', request.result);
        if (request.result) {
          try {
            // Decrypt the stored data
            const decryptedData = await decryptData(
              request.result.encryptedData, 
              request.result.iv
            );
            console.log('[IndexedDB] getProjectKey - decryptedData for projectId:', projectId, 'is:', decryptedData);
            resolve(decryptedData.projectKey);
          } catch (error) {
            console.error('Error decrypting project key:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error retrieving project key:', error);
    return null;
  }
}

// Get all project keys for a user
export async function getAllProjectKeys(userId: string): Promise<Record<string, string>> {
  console.log('[IndexedDB] getAllProjectKeys - userId:', userId);
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_KEYS_STORE], 'readonly');
      const objectStore = transaction.objectStore(PROJECT_KEYS_STORE);
      const index = objectStore.index('userId');
      const request = index.getAll(userId);
      
      request.onerror = () => {
        reject(new Error('Failed to get project keys from IndexedDB'));
      };
      
      request.onsuccess = async () => {
        console.log('[IndexedDB] getAllProjectKeys - request.result for userId:', userId, 'is:', request.result);
        if (request.result && request.result.length > 0) {
          try {
            const projectKeys: Record<string, string> = {};
            
            // Process each record
            for (const record of request.result) {
              const decryptedData = await decryptData(record.encryptedData, record.iv);
              projectKeys[record.projectId] = decryptedData.projectKey;
            }
            console.log('[IndexedDB] getAllProjectKeys - decrypted projectKeys for userId:', userId, 'are:', projectKeys);
            resolve(projectKeys);
          } catch (error) {
            console.error('Error decrypting project keys:', error);
            resolve({});
          }
        } else {
          resolve({});
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error retrieving project keys:', error);
    return {};
  }
}

// Retrieve just the public key for a user
export async function getUserPublicKey(userId: string): Promise<string | null> {
  const keys = await getUserEncryptionKeys(userId);
  return keys.publicKey;
}

// Retrieve just the private key for a user
export async function getUserPrivateKey(userId: string): Promise<string | null> {
  const keys = await getUserEncryptionKeys(userId);
  return keys.privateKey;
}

// Deletes encryption keys for a user
export async function deleteUserEncryptionKeys(userId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ENCRYPTION_KEYS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(ENCRYPTION_KEYS_STORE);
      
      const request = objectStore.delete(userId);
      
      request.onerror = () => {
        reject(new Error('Failed to delete encryption keys from IndexedDB'));
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error deleting encryption keys:', error);
    return false;
  }
}

// Deletes a project key
export async function deleteProjectKey(projectId: string): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([PROJECT_KEYS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(PROJECT_KEYS_STORE);
      
      const request = objectStore.delete(projectId);
      
      request.onerror = () => {
        reject(new Error('Failed to delete project key from IndexedDB'));
      };
      
      request.onsuccess = () => {
        resolve(true);
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error deleting project key:', error);
    return false;
  }
} 