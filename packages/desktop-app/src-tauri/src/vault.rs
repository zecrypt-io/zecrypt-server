use std::sync::Arc;
use tokio::sync::RwLock;
use thiserror::Error;
use serde::{Deserialize, Serialize};
use tauri::AppHandle;

use crate::crypto::{
    derive_kek, decrypt_dek, generate_salt, generate_dek, encrypt_dek, 
    SecureDek, CryptoError
};
use crate::database::{Database, VaultMeta, DatabaseError};

/// Vault-related errors
#[derive(Error, Debug)]
pub enum VaultError {
    #[error("Database error: {0}")]
    Database(#[from] DatabaseError),
    #[error("Crypto error: {0}")]
    Crypto(#[from] CryptoError),
    #[error("SQLx error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("Vault is locked")]
    VaultLocked,
    #[error("Vault is already unlocked")]
    VaultAlreadyUnlocked,
    #[error("Invalid master password")]
    InvalidMasterPassword,
    #[error("Vault not initialized")]
    VaultNotInitialized,
    #[error("Master password validation failed: {0}")]
    PasswordValidation(String),
}

pub type Result<T> = std::result::Result<T, VaultError>;

/// Vault state enumeration
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum VaultState {
    Uninitialized,
    Locked,
    Unlocked,
}

/// Vault status information for the frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VaultStatus {
    pub state: VaultState,
    pub is_initialized: bool,
    pub created_at: Option<i64>,
    pub version: Option<i32>,
}

/// Thread-safe vault manager that handles all vault operations
pub struct VaultManager {
    database: Arc<RwLock<Database>>,
    dek: Arc<RwLock<Option<SecureDek>>>,
    state: Arc<RwLock<VaultState>>,
}

impl VaultManager {
    /// Creates a new vault manager with a given database instance.
    pub async fn new(database: Database) -> Result<Self> {
        // Defer initialization check until an operation is performed
        Ok(Self {
            database: Arc::new(RwLock::new(database)),
            dek: Arc::new(RwLock::new(None)),
            state: Arc::new(RwLock::new(VaultState::Uninitialized)), // Start as uninitialized
        })
    }

    /// Creates a new vault manager for the application using the app handle.
    pub async fn new_with_app_handle(app_handle: &AppHandle) -> Result<Self> {
        let database = Database::new(app_handle)?;
        Self::new(database).await
    }

    /// Gets the current vault status
    pub async fn get_status(&self) -> Result<VaultStatus> {
        let mut state_guard = self.state.write().await;
        
        let db_guard = self.database.read().await;
        let is_initialized = db_guard.is_initialized().await?;
        
        if *state_guard == VaultState::Uninitialized {
            if is_initialized {
                *state_guard = VaultState::Locked;
            }
        }

        let (created_at, version) = if is_initialized {
            let meta = db_guard.load_vault_meta().await?;
            (Some(meta.created_at), Some(meta.version))
        } else {
            (None, None)
        };

        Ok(VaultStatus {
            state: state_guard.clone(),
            is_initialized,
            created_at,
            version,
        })
    }

    /// Initializes a new vault with the given master password
    pub async fn initialize_vault(&self, master_password: &str) -> Result<()> {
        // Validate master password
        Self::validate_master_password(master_password)?;

        let mut state_guard = self.state.write().await;
        if *state_guard != VaultState::Uninitialized {
            return Err(VaultError::Database(DatabaseError::VaultAlreadyInitialized));
        }

        // Generate cryptographic materials
        let salt = generate_salt();
        let dek_bytes = generate_dek();
        let dek = SecureDek::new(dek_bytes);
        
        // Derive KEK from master password and salt
        let kek = derive_kek(master_password, &salt)?;
        
        // Encrypt DEK with KEK
        let encrypted_dek = encrypt_dek(&kek, dek.as_bytes())?;
        
        // Create vault metadata
        let vault_meta = VaultMeta::new(salt, encrypted_dek);
        
        // Initialize database
        let mut db_guard = self.database.write().await;
        db_guard.initialize_vault(vault_meta, &dek).await?;
        
        // Store DEK in memory and update state
        {
            let mut dek_guard = self.dek.write().await;
            *dek_guard = Some(dek);
        }
        
        *state_guard = VaultState::Unlocked;
        
        log::info!("Vault initialized successfully");
        Ok(())
    }

    /// Unlocks the vault with the given master password
    pub async fn unlock_vault(&self, master_password: &str) -> Result<()> {
        let mut state_guard = self.state.write().await;
        
        match *state_guard {
            VaultState::Uninitialized => return Err(VaultError::VaultNotInitialized),
            VaultState::Unlocked => return Err(VaultError::VaultAlreadyUnlocked),
            VaultState::Locked => {}
        }

        // Load vault metadata
        let db_guard = self.database.read().await;
        let vault_meta = db_guard.load_vault_meta().await?;
        drop(db_guard);

        // Derive KEK from master password and stored salt
        let kek = derive_kek(master_password, &vault_meta.salt)?;
        
        // Try to decrypt DEK with KEK
        let dek_bytes = decrypt_dek(&kek, &vault_meta.encrypted_dek)
            .map_err(|_| VaultError::InvalidMasterPassword)?;
        
        let dek = SecureDek::new(dek_bytes);
        
        // Try to open database with decrypted DEK
        let mut db_guard = self.database.write().await;
        db_guard.open_with_dek(&dek).await
            .map_err(|_| VaultError::InvalidMasterPassword)?;
        drop(db_guard);

        // Store DEK in memory and update state
        {
            let mut dek_guard = self.dek.write().await;
            *dek_guard = Some(dek);
        }
        
        *state_guard = VaultState::Unlocked;
        
        log::info!("Vault unlocked successfully");
        Ok(())
    }

    /// Locks the vault and securely wipes the DEK from memory
    pub async fn lock_vault(&self) -> Result<()> {
        let mut state_guard = self.state.write().await;
        
        if *state_guard != VaultState::Unlocked {
            return Ok(()); // Already locked or uninitialized
        }

        // Close database connection
        let mut db_guard = self.database.write().await;
        db_guard.close().await?;
        drop(db_guard);

        // Securely wipe DEK from memory
        {
            let mut dek_guard = self.dek.write().await;
            *dek_guard = None; // SecureDek's Drop implementation will zero the memory
        }

        *state_guard = VaultState::Locked;
        
        log::info!("Vault locked successfully");
        Ok(())
    }

    /// Changes the master password
    pub async fn change_master_password(
        &self,
        current_password: &str,
        new_password: &str,
    ) -> Result<()> {
        // Validate new password
        Self::validate_master_password(new_password)?;

        let state_guard = self.state.read().await;
        if *state_guard != VaultState::Unlocked {
            return Err(VaultError::VaultLocked);
        }
        drop(state_guard);

        // Verify current password by attempting to unlock
        let db_guard = self.database.read().await;
        let vault_meta = db_guard.load_vault_meta().await?;
        drop(db_guard);

        let current_kek = derive_kek(current_password, &vault_meta.salt)?;
        let _dek_bytes = decrypt_dek(&current_kek, &vault_meta.encrypted_dek)
            .map_err(|_| VaultError::InvalidMasterPassword)?;

        // Get current DEK from memory
        let dek = {
            let dek_guard = self.dek.read().await;
            dek_guard.as_ref()
                .ok_or(VaultError::VaultLocked)?
                .clone()
        };

        // Generate new salt and derive new KEK
        let new_salt = generate_salt();
        let new_kek = derive_kek(new_password, &new_salt)?;
        
        // Encrypt DEK with new KEK
        let new_encrypted_dek = encrypt_dek(&new_kek, dek.as_bytes())?;
        
        // Update vault metadata in database
        let db_guard = self.database.write().await;
        let pool = db_guard.pool()?;
        
        sqlx::query(
            "UPDATE vault_meta SET salt = ?1, encrypted_dek = ?2, updated_at = ?3 WHERE id = 1"
        )
        .bind(&new_salt[..])
        .bind(new_encrypted_dek.to_bytes())
        .bind(chrono::Utc::now().timestamp())
        .execute(pool)
        .await?;

        log::info!("Master password changed successfully");
        Ok(())
    }

    /// Gets a reference to the database for performing operations
    pub async fn get_database(&self) -> Result<Arc<RwLock<Database>>> {
        let state_guard = self.state.read().await;
        if *state_guard != VaultState::Unlocked {
            return Err(VaultError::VaultLocked);
        }
        
        Ok(Arc::clone(&self.database))
    }

    /// Checks if the vault is unlocked
    pub async fn is_unlocked(&self) -> bool {
        let state_guard = self.state.read().await;
        *state_guard == VaultState::Unlocked
    }

    /// Validates master password requirements
    fn validate_master_password(password: &str) -> Result<()> {
        if password.is_empty() {
            return Err(VaultError::PasswordValidation(
                "Master password cannot be empty".to_string()
            ));
        }

        if password.len() < 8 {
            return Err(VaultError::PasswordValidation(
                "Master password must be at least 8 characters long".to_string()
            ));
        }

        // Additional password requirements can be added here
        // For now, we keep it simple but secure

        Ok(())
    }

    /// Securely shuts down the vault manager
    pub async fn shutdown(&self) -> Result<()> {
        log::info!("Shutting down vault manager");
        self.lock_vault().await?;
        Ok(())
    }
}

impl Drop for VaultManager {
    fn drop(&mut self) {
        log::info!("VaultManager dropped");
    }
}

/// Global vault manager instance
static VAULT_MANAGER: tokio::sync::OnceCell<Arc<VaultManager>> = tokio::sync::OnceCell::const_new();

/// Initializes the global vault manager
pub async fn initialize_vault_manager(app_handle: AppHandle) -> Result<()> {
    let manager = VaultManager::new_with_app_handle(&app_handle).await?;
    VAULT_MANAGER.set(Arc::new(manager))
        .map_err(|_| VaultError::Database(DatabaseError::InvalidConfig(
            "Vault manager already initialized".to_string()
        )))?;
    
    log::info!("Global vault manager initialized");
    Ok(())
}

/// Gets the global vault manager instance
pub async fn get_vault_manager() -> Result<Arc<VaultManager>> {
    VAULT_MANAGER.get()
        .ok_or(VaultError::Database(DatabaseError::InvalidConfig(
            "Vault manager not initialized".to_string()
        )))
        .map(Arc::clone)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::database::Database;
    use tempfile::TempDir;

    async fn create_test_vault_manager() -> (VaultManager, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test_vault.db");
        let database = Database::new_for_test(&db_path);
        
        let manager = VaultManager::new(database).await.unwrap();
        (manager, temp_dir)
    }

    #[tokio::test]
    async fn test_vault_initialization() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        let status = manager.get_status().await.unwrap();
        assert_eq!(status.state, VaultState::Uninitialized);
        assert!(!status.is_initialized);
        
        let password = "test_password_123";
        manager.initialize_vault(password).await.unwrap();
        
        let status = manager.get_status().await.unwrap();
        assert_eq!(status.state, VaultState::Unlocked);
        assert!(status.is_initialized);
        assert!(manager.is_unlocked().await);
    }

    #[tokio::test]
    async fn test_vault_unlock_lock_cycle() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        let password = "test_password_123";
        manager.initialize_vault(password).await.unwrap();
        
        // Lock the vault
        manager.lock_vault().await.unwrap();
        assert!(!manager.is_unlocked().await);
        
        let status = manager.get_status().await.unwrap();
        assert_eq!(status.state, VaultState::Locked);
        
        // Unlock with correct password
        manager.unlock_vault(password).await.unwrap();
        assert!(manager.is_unlocked().await);
        
        let status = manager.get_status().await.unwrap();
        assert_eq!(status.state, VaultState::Unlocked);
    }

    #[tokio::test]
    async fn test_wrong_password_fails() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        let password = "test_password_123";
        manager.initialize_vault(password).await.unwrap();
        manager.lock_vault().await.unwrap();
        
        // Try to unlock with wrong password
        let result = manager.unlock_vault("wrong_password").await;
        assert!(matches!(result, Err(VaultError::InvalidMasterPassword)));
        assert!(!manager.is_unlocked().await);
    }

    #[tokio::test]
    async fn test_password_validation() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        // Empty password should fail
        let result = manager.initialize_vault("").await;
        assert!(result.is_err());
        
        // Too short password should fail
        let result = manager.initialize_vault("123").await;
        assert!(result.is_err());
        
        // Valid password should succeed
        let result = manager.initialize_vault("valid_password_123").await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn test_change_master_password() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        let old_password = "old_password_123";
        let new_password = "new_password_456";
        
        manager.initialize_vault(old_password).await.unwrap();
        
        // Change password
        manager.change_master_password(old_password, new_password).await.unwrap();
        
        // Lock and unlock with new password
        manager.lock_vault().await.unwrap();
        manager.unlock_vault(new_password).await.unwrap();
        assert!(manager.is_unlocked().await);
        
        // Old password should no longer work
        manager.lock_vault().await.unwrap();
        let result = manager.unlock_vault(old_password).await;
        assert!(matches!(result, Err(VaultError::InvalidMasterPassword)));
    }

    #[tokio::test]
    async fn test_double_initialization_fails() {
        let (manager, _temp_dir) = create_test_vault_manager().await;
        
        let password = "test_password_123";
        manager.initialize_vault(password).await.unwrap();
        
        // Second initialization should fail
        let result = manager.initialize_vault("another_password").await;
        assert!(result.is_err());
    }
}
