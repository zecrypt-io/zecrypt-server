/**
 * Utilities for working with IndexedDB, specifically for storing encryption keys
 */

const DB_NAME = 'zecrypt-db';
const DB_VERSION = 1;
const ENCRYPTION_KEYS_STORE = 'encryption-keys';

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
    };
  });
}

// Retrieves the public and private key for a user
export async function getUserEncryptionKeys(userId: string): Promise<{ 
  publicKey: string | null; 
  privateKey: string | null; 
  masterPassword?: string | null;
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
      
      request.onsuccess = () => {
        if (request.result) {
          resolve({
            publicKey: request.result.publicKey,
            privateKey: request.result.privateKey,
            masterPassword: request.result.masterPassword || null
          });
        } else {
          resolve({ publicKey: null, privateKey: null, masterPassword: null });
        }
      };
      
      transaction.oncomplete = () => {
        db.close();
      };
    });
  } catch (error) {
    console.error('Error retrieving encryption keys:', error);
    return { publicKey: null, privateKey: null, masterPassword: null };
  }
}

// Stores the public and private key for a user
export async function storeUserEncryptionKeys(
  userId: string, 
  publicKey: string, 
  privateKey: string,
  masterPassword?: string
): Promise<boolean> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([ENCRYPTION_KEYS_STORE], 'readwrite');
      const objectStore = transaction.objectStore(ENCRYPTION_KEYS_STORE);
      
      const dataToStore = {
        userId,
        publicKey,
        privateKey,
        masterPassword,
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

// Retrieves just the public key for a user
export async function getUserPublicKey(userId: string): Promise<string | null> {
  const keys = await getUserEncryptionKeys(userId);
  return keys.publicKey;
}

// Retrieves the master password for a user
export async function getUserMasterPassword(userId: string): Promise<string | null> {
  const keys = await getUserEncryptionKeys(userId);
  return keys.masterPassword || null;
}

// Updates just the master password for a user
export async function updateUserMasterPassword(
  userId: string,
  masterPassword: string
): Promise<boolean> {
  try {
    // First get the existing keys
    const existingData = await getUserEncryptionKeys(userId);
    
    if (!existingData.publicKey || !existingData.privateKey) {
      throw new Error('No existing encryption keys found for this user');
    }
    
    // Then update with the new master password
    const result = await storeUserEncryptionKeys(
      userId,
      existingData.publicKey,
      existingData.privateKey,
      masterPassword
    );
    
    return result;
  } catch (error) {
    console.error('Error updating master password:', error);
    return false;
  }
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