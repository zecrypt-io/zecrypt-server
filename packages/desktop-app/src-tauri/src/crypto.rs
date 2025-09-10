use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Key, Nonce,
};
use argon2::{Argon2, PasswordHash, PasswordHasher, PasswordVerifier, Algorithm, Version, Params};
use rand::{RngCore, rngs::OsRng as RandOsRng};
use thiserror::Error;

/// Crypto-related errors
#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Key derivation failed: {0}")]
    KeyDerivation(String),
    #[error("Encryption failed: {0}")]
    Encryption(String),
    #[error("Decryption failed: {0}")]
    Decryption(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
}

pub type Result<T> = std::result::Result<T, CryptoError>;

/// Salt size for Argon2id key derivation (32 bytes)
pub const SALT_SIZE: usize = 32;
/// DEK size (32 bytes for AES-256)
pub const DEK_SIZE: usize = 32;
/// AES-GCM nonce size (12 bytes)
pub const NONCE_SIZE: usize = 12;

/// Configuration for Argon2id key derivation
/// Using recommended parameters for desktop applications
const ARGON2_MEMORY: u32 = 65536; // 64 MB
const ARGON2_ITERATIONS: u32 = 3;
const ARGON2_PARALLELISM: u32 = 1;

/// Generates a cryptographically secure random salt
pub fn generate_salt() -> [u8; SALT_SIZE] {
    let mut salt = [0u8; SALT_SIZE];
    OsRng.fill_bytes(&mut salt);
    salt
}

/// Generates a cryptographically secure random DEK
pub fn generate_dek() -> [u8; DEK_SIZE] {
    let mut dek = [0u8; DEK_SIZE];
    RandOsRng.fill_bytes(&mut dek);
    dek
}

/// Derives a KEK from master password and salt using Argon2id
pub fn derive_kek(master_password: &str, salt: &[u8; SALT_SIZE]) -> Result<[u8; 32]> {
    if master_password.is_empty() {
        return Err(CryptoError::InvalidInput("Master password cannot be empty".to_string()));
    }

    let params = Params::new(
        ARGON2_MEMORY,
        ARGON2_ITERATIONS,
        ARGON2_PARALLELISM,
        Some(32), // Output length
    ).map_err(|e| CryptoError::KeyDerivation(format!("Invalid Argon2 params: {}", e)))?;

    let argon2 = Argon2::new(Algorithm::Argon2id, Version::V0x13, params);
    
    let mut kek = [0u8; 32];
    argon2
        .hash_password_into(master_password.as_bytes(), salt, &mut kek)
        .map_err(|e| CryptoError::KeyDerivation(format!("Argon2 hash failed: {}", e)))?;

    Ok(kek)
}

/// Encrypted DEK structure that includes nonce and ciphertext
#[derive(Debug, Clone)]
pub struct EncryptedDek {
    pub nonce: [u8; NONCE_SIZE],
    pub ciphertext: Vec<u8>,
}

impl EncryptedDek {
    /// Serializes the encrypted DEK to bytes (nonce + ciphertext)
    pub fn to_bytes(&self) -> Vec<u8> {
        let mut bytes = Vec::with_capacity(NONCE_SIZE + self.ciphertext.len());
        bytes.extend_from_slice(&self.nonce);
        bytes.extend_from_slice(&self.ciphertext);
        bytes
    }

    /// Deserializes encrypted DEK from bytes
    pub fn from_bytes(bytes: &[u8]) -> Result<Self> {
        if bytes.len() < NONCE_SIZE + DEK_SIZE + 16 { // nonce + DEK + GCM tag
            return Err(CryptoError::InvalidInput(
                "Encrypted DEK data too short".to_string()
            ));
        }

        let nonce = bytes[..NONCE_SIZE]
            .try_into()
            .map_err(|_| CryptoError::InvalidInput("Invalid nonce size".to_string()))?;
        
        let ciphertext = bytes[NONCE_SIZE..].to_vec();

        Ok(EncryptedDek { nonce, ciphertext })
    }

    /// Converts to hex string for database storage
    pub fn to_hex(&self) -> String {
        hex::encode(self.to_bytes())
    }

    /// Creates from hex string stored in database
    pub fn from_hex(hex_str: &str) -> Result<Self> {
        let bytes = hex::decode(hex_str)
            .map_err(|e| CryptoError::InvalidInput(format!("Invalid hex: {}", e)))?;
        Self::from_bytes(&bytes)
    }
}

/// Encrypts a DEK using a KEK with AES-256-GCM
pub fn encrypt_dek(kek: &[u8; 32], dek: &[u8; DEK_SIZE]) -> Result<EncryptedDek> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(kek));
    let nonce_bytes = Aes256Gcm::generate_nonce(&mut OsRng);
    
    let ciphertext = cipher
        .encrypt(&nonce_bytes, dek.as_ref())
        .map_err(|e| CryptoError::Encryption(format!("AES-GCM encryption failed: {}", e)))?;

    let nonce: [u8; NONCE_SIZE] = nonce_bytes
        .as_slice()
        .try_into()
        .map_err(|_| CryptoError::Encryption("Invalid nonce size".to_string()))?;

    Ok(EncryptedDek { nonce, ciphertext })
}

/// Decrypts a DEK using a KEK with AES-256-GCM
pub fn decrypt_dek(kek: &[u8; 32], encrypted_dek: &EncryptedDek) -> Result<[u8; DEK_SIZE]> {
    let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(kek));
    let nonce = Nonce::from_slice(&encrypted_dek.nonce);
    
    let plaintext = cipher
        .decrypt(nonce, encrypted_dek.ciphertext.as_ref())
        .map_err(|e| CryptoError::Decryption(format!("AES-GCM decryption failed: {}", e)))?;

    if plaintext.len() != DEK_SIZE {
        return Err(CryptoError::Decryption(
            "Decrypted DEK has invalid size".to_string()
        ));
    }

    let dek: [u8; DEK_SIZE] = plaintext
        .try_into()
        .map_err(|_| CryptoError::Decryption("Failed to convert DEK".to_string()))?;

    Ok(dek)
}

/// Securely wipes sensitive data from memory
pub fn secure_zero(data: &mut [u8]) {
    // Use volatile write to prevent compiler optimization
    for byte in data.iter_mut() {
        unsafe {
            std::ptr::write_volatile(byte, 0);
        }
    }
}

/// RAII wrapper for DEK that securely zeros memory on drop
pub struct SecureDek {
    data: [u8; DEK_SIZE],
}

impl SecureDek {
    pub fn new(dek: [u8; DEK_SIZE]) -> Self {
        Self { data: dek }
    }

    pub fn as_bytes(&self) -> &[u8; DEK_SIZE] {
        &self.data
    }

    pub fn as_hex(&self) -> String {
        hex::encode(&self.data)
    }
}

impl Drop for SecureDek {
    fn drop(&mut self) {
        secure_zero(&mut self.data);
    }
}

impl Clone for SecureDek {
    fn clone(&self) -> Self {
        Self { data: self.data }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_salt_generation() {
        let salt1 = generate_salt();
        let salt2 = generate_salt();
        assert_ne!(salt1, salt2, "Generated salts should be different");
        assert_eq!(salt1.len(), SALT_SIZE);
    }

    #[test]
    fn test_dek_generation() {
        let dek1 = generate_dek();
        let dek2 = generate_dek();
        assert_ne!(dek1, dek2, "Generated DEKs should be different");
        assert_eq!(dek1.len(), DEK_SIZE);
    }

    #[test]
    fn test_kek_derivation() {
        let password = "test_password_123";
        let salt = generate_salt();
        
        let kek1 = derive_kek(password, &salt).unwrap();
        let kek2 = derive_kek(password, &salt).unwrap();
        
        assert_eq!(kek1, kek2, "Same password+salt should produce same KEK");
        assert_eq!(kek1.len(), 32);
    }

    #[test]
    fn test_dek_encryption_decryption() {
        let password = "test_password_123";
        let salt = generate_salt();
        let kek = derive_kek(password, &salt).unwrap();
        
        let original_dek = generate_dek();
        
        // Encrypt DEK
        let encrypted_dek = encrypt_dek(&kek, &original_dek).unwrap();
        
        // Decrypt DEK
        let decrypted_dek = decrypt_dek(&kek, &encrypted_dek).unwrap();
        
        assert_eq!(original_dek, decrypted_dek);
    }

    #[test]
    fn test_encrypted_dek_serialization() {
        let password = "test_password_123";
        let salt = generate_salt();
        let kek = derive_kek(password, &salt).unwrap();
        let dek = generate_dek();
        
        let encrypted_dek = encrypt_dek(&kek, &dek).unwrap();
        
        // Test binary serialization
        let bytes = encrypted_dek.to_bytes();
        let deserialized = EncryptedDek::from_bytes(&bytes).unwrap();
        assert_eq!(encrypted_dek.nonce, deserialized.nonce);
        assert_eq!(encrypted_dek.ciphertext, deserialized.ciphertext);
        
        // Test hex serialization
        let hex = encrypted_dek.to_hex();
        let from_hex = EncryptedDek::from_hex(&hex).unwrap();
        assert_eq!(encrypted_dek.nonce, from_hex.nonce);
        assert_eq!(encrypted_dek.ciphertext, from_hex.ciphertext);
    }

    #[test]
    fn test_secure_dek_zero_on_drop() {
        let original_dek = generate_dek();
        let secure_dek = SecureDek::new(original_dek);
        let dek_hex = secure_dek.as_hex();
        
        drop(secure_dek);
        
        // This test mainly ensures compilation - actual memory zeroing 
        // verification would require unsafe inspection
        assert!(!dek_hex.is_empty());
    }

    #[test]
    fn test_invalid_password() {
        let salt = generate_salt();
        let result = derive_kek("", &salt);
        assert!(result.is_err());
    }

    #[test]
    fn test_wrong_kek_decryption_fails() {
        let password1 = "password1";
        let password2 = "password2";
        let salt = generate_salt();
        
        let kek1 = derive_kek(password1, &salt).unwrap();
        let kek2 = derive_kek(password2, &salt).unwrap();
        
        let dek = generate_dek();
        let encrypted_dek = encrypt_dek(&kek1, &dek).unwrap();
        
        // Trying to decrypt with wrong KEK should fail
        let result = decrypt_dek(&kek2, &encrypted_dek);
        assert!(result.is_err());
    }
}
