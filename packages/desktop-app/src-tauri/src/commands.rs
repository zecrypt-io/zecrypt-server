use serde::{Deserialize, Serialize};
use tauri::command;

use crate::vault::{get_vault_manager, VaultStatus, VaultError};
use crate::settings::SettingsStore;
use tauri::AppHandle;
use crate::database::{AccountCreatePayload, AccountUpdatePayload};
use crate::database::{IdentityCreatePayload, IdentityUpdatePayload};
use serde_json::Value;
use serde_json::Map as JsonMap;

#[derive(Deserialize)]
pub struct DsCreateArgs { pub table: String, pub id_prefix: String, pub payload: JsonMap<String, Value> }
#[derive(Deserialize)]
pub struct DsUpdateArgs { pub table: String, pub id: String, pub updates: JsonMap<String, Value> }

/// Command result wrapper for consistent error handling
#[derive(Debug, Serialize, Deserialize)]
pub struct CommandResult<T> {
    pub success: bool,
    pub data: Option<T>,
    pub error: Option<String>,
}

impl<T> CommandResult<T> {
    pub fn success(data: T) -> Self {
        Self { success: true, data: Some(data), error: None }
    }
    pub fn error(error: String) -> Self {
        Self { success: false, data: None, error: Some(error) }
    }
}

impl<T> From<Result<T, VaultError>> for CommandResult<T> {
    fn from(result: Result<T, VaultError>) -> Self {
        match result { Ok(data) => CommandResult::success(data), Err(error) => CommandResult::error(error.to_string()) }
    }
}

/// Request structure for vault initialization
#[derive(Debug, Deserialize)]
pub struct InitializeVaultRequest {
    pub master_password: String,
}

/// Request structure for vault unlock
#[derive(Debug, Deserialize)]
pub struct UnlockVaultRequest {
    pub master_password: String,
}

/// Request structure for changing master password
#[derive(Debug, Deserialize)]
pub struct ChangeMasterPasswordRequest {
    pub current_password: String,
    pub new_password: String,
}

/// Settings commands (replacement for any SQL plugin based settings)
#[command]
pub async fn settings_get(app: tauri::AppHandle, key: String) -> CommandResult<Option<String>> {
    match SettingsStore::get(&app, &key) {
        Ok(v) => CommandResult::success(v),
        Err(e) => CommandResult::error(e),
    }
}

#[command]
pub async fn settings_set(app: tauri::AppHandle, key: String, value: String) -> CommandResult<()> {
    match SettingsStore::set(&app, &key, &value) {
        Ok(_) => CommandResult::success(()),
        Err(e) => CommandResult::error(e),
    }
}

#[command]
pub async fn settings_delete(app: tauri::AppHandle, key: String) -> CommandResult<()> {
    match SettingsStore::delete(&app, &key) {
        Ok(_) => CommandResult::success(()),
        Err(e) => CommandResult::error(e),
    }
}

#[command]
pub async fn settings_clear(app: AppHandle) -> CommandResult<()> {
    match SettingsStore::clear(&app) {
        Ok(_) => CommandResult::success(()),
        Err(e) => CommandResult::error(e),
    }
}

/// Gets the current vault status
#[command]
pub async fn get_vault_status() -> CommandResult<VaultStatus> {
    log::info!("Getting vault status");
    
    match get_vault_manager().await {
        Ok(manager) => manager.get_status().await.into(),
        Err(error) => CommandResult::error(error.to_string()),
    }
}

/// Initializes a new vault with the given master password
#[command]
pub async fn initialize_vault(request: InitializeVaultRequest) -> CommandResult<VaultStatus> {
    log::info!("Initializing vault");
    
    let manager = match get_vault_manager().await {
        Ok(manager) => manager,
        Err(error) => return CommandResult::error(error.to_string()),
    };

    // Initialize vault
    match manager.initialize_vault(&request.master_password).await {
        Ok(()) => {
            log::info!("Vault initialized successfully");
            // Return updated status
            manager.get_status().await.into()
        }
        Err(error) => {
            log::error!("Failed to initialize vault: {}", error);
            CommandResult::error(error.to_string())
        }
    }
}

/// Unlocks the vault with the given master password
#[command]
pub async fn unlock_vault(request: UnlockVaultRequest) -> CommandResult<VaultStatus> {
    log::info!("Unlocking vault");
    
    let manager = match get_vault_manager().await {
        Ok(manager) => manager,
        Err(error) => return CommandResult::error(error.to_string()),
    };

    match manager.unlock_vault(&request.master_password).await {
        Ok(()) => {
            log::info!("Vault unlocked successfully");
            // Return updated status
            manager.get_status().await.into()
        }
        Err(error) => {
            log::error!("Failed to unlock vault: {}", error);
            CommandResult::error(error.to_string())
        }
    }
}

/// Locks the vault and securely wipes sensitive data from memory
#[command]
pub async fn lock_vault() -> CommandResult<VaultStatus> {
    log::info!("Locking vault");
    
    let manager = match get_vault_manager().await {
        Ok(manager) => manager,
        Err(error) => return CommandResult::error(error.to_string()),
    };

    match manager.lock_vault().await {
        Ok(()) => {
            log::info!("Vault locked successfully");
            // Return updated status
            manager.get_status().await.into()
        }
        Err(error) => {
            log::error!("Failed to lock vault: {}", error);
            CommandResult::error(error.to_string())
        }
    }
}

/// Changes the master password
#[command]
pub async fn change_master_password(request: ChangeMasterPasswordRequest) -> CommandResult<()> {
    log::info!("Changing master password");
    
    let manager = match get_vault_manager().await {
        Ok(manager) => manager,
        Err(error) => return CommandResult::error(error.to_string()),
    };

    match manager.change_master_password(&request.current_password, &request.new_password).await {
        Ok(()) => {
            log::info!("Master password changed successfully");
            CommandResult::success(())
        }
        Err(error) => {
            log::error!("Failed to change master password: {}", error);
            CommandResult::error(error.to_string())
        }
    }
}

/// Checks if the vault is unlocked
#[command]
pub async fn is_vault_unlocked() -> CommandResult<bool> {
    let manager = match get_vault_manager().await {
        Ok(manager) => manager,
        Err(error) => return CommandResult::error(error.to_string()),
    };

    CommandResult::success(manager.is_unlocked().await)
}

/// Validates a master password without changing anything
#[command]
pub async fn validate_master_password(password: String) -> CommandResult<bool> {
    // Basic validation - could be enhanced with more sophisticated checks
    let is_valid = !password.is_empty() && password.len() >= 8;
    CommandResult::success(is_valid)
}

/// Health check command to verify the vault system is working
#[command]
pub async fn vault_health_check() -> CommandResult<String> {
    log::info!("Performing vault health check");
    
    match get_vault_manager().await {
        Ok(manager) => {
            match manager.get_status().await {
                Ok(status) => {
                    let health_info = format!(
                        "Vault system healthy - State: {:?}, Initialized: {}",
                        status.state, status.is_initialized
                    );
                    CommandResult::success(health_info)
                }
                Err(error) => CommandResult::error(format!("Health check failed: {}", error)),
            }
        }
        Err(error) => CommandResult::error(format!("Vault manager not available: {}", error)),
    }
}

/// Emergency vault shutdown command
#[command]
pub async fn emergency_vault_shutdown() -> CommandResult<()> {
    log::warn!("Emergency vault shutdown requested");
    
    match get_vault_manager().await {
        Ok(manager) => {
            match manager.shutdown().await {
                Ok(()) => {
                    log::info!("Emergency shutdown completed");
                    CommandResult::success(())
                }
                Err(error) => {
                    log::error!("Emergency shutdown failed: {}", error);
                    CommandResult::error(error.to_string())
                }
            }
        }
        Err(error) => CommandResult::error(format!("Vault manager not available: {}", error)),
    }
}

// Additional utility commands for development and debugging

/// Gets detailed vault information (for debugging)
#[command]
pub async fn get_vault_debug_info() -> CommandResult<serde_json::Value> {
    #[cfg(debug_assertions)]
    {
        let manager = match get_vault_manager().await {
            Ok(manager) => manager,
            Err(error) => return CommandResult::error(error.to_string()),
        };

        match manager.get_status().await {
            Ok(status) => {
                let debug_info = serde_json::json!({
                    "vault_status": status,
                    "is_unlocked": manager.is_unlocked().await,
                    "timestamp": chrono::Utc::now().timestamp(),
                    "debug_mode": true
                });
                CommandResult::success(debug_info)
            }
            Err(error) => CommandResult::error(error.to_string()),
        }
    }

    #[cfg(not(debug_assertions))]
    {
        CommandResult::error("Debug info only available in debug builds".to_string())
    }
}

/// Test command to verify encryption/decryption is working
#[command]
pub async fn test_encryption() -> CommandResult<String> {
    #[cfg(debug_assertions)]
    {
        use crate::crypto::{generate_salt, generate_dek, derive_kek, encrypt_dek, decrypt_dek};
        
        log::info!("Testing encryption system");
        
        // Test the crypto pipeline
        let password = "test_password_for_crypto_check";
        let salt = generate_salt();
        let dek_bytes = generate_dek();
        
        match derive_kek(password, &salt) {
            Ok(kek) => {
                match encrypt_dek(&kek, &dek_bytes) {
                    Ok(encrypted_dek) => {
                        match decrypt_dek(&kek, &encrypted_dek) {
                            Ok(decrypted_dek) => {
                                if decrypted_dek == dek_bytes {
                                    CommandResult::success("Encryption test passed".to_string())
                                } else {
                                    CommandResult::error("Encryption test failed: decrypted data mismatch".to_string())
                                }
                            }
                            Err(error) => CommandResult::error(format!("Decryption failed: {}", error)),
                        }
                    }
                    Err(error) => CommandResult::error(format!("Encryption failed: {}", error)),
                }
            }
            Err(error) => CommandResult::error(format!("Key derivation failed: {}", error)),
        }
    }

    #[cfg(not(debug_assertions))]
    {
        CommandResult::error("Encryption test only available in debug builds".to_string())
    }
}

#[command]
pub async fn accounts_list(project_id: Option<String>) -> CommandResult<Vec<crate::database::AccountRow>> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.accounts_list(project_id).await {
                        Ok(rows) => CommandResult::success(rows),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn accounts_create(payload: AccountCreatePayload) -> CommandResult<crate::database::AccountRow> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.accounts_create(payload).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn accounts_update(id: String, updates: AccountUpdatePayload) -> CommandResult<crate::database::AccountRow> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.accounts_update(id, updates).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn accounts_delete(id: String) -> CommandResult<()> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.accounts_delete(id).await {
                        Ok(()) => CommandResult::success(()),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn identities_list(project_id: Option<String>) -> CommandResult<Vec<crate::database::IdentityRow>> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.identities_list(project_id).await {
                        Ok(rows) => CommandResult::success(rows),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn identities_create(payload: IdentityCreatePayload) -> CommandResult<crate::database::IdentityRow> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.identities_create(payload).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn identities_update(id: String, updates: IdentityUpdatePayload) -> CommandResult<crate::database::IdentityRow> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.identities_update(id, updates).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn identities_delete(id: String) -> CommandResult<()> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.identities_delete(id).await {
                        Ok(()) => CommandResult::success(()),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn ds_list(table: String, project_id: Option<String>) -> CommandResult<Vec<Value>> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.ds_list(table, project_id).await {
                        Ok(rows) => CommandResult::success(rows),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn ds_create(args: DsCreateArgs) -> CommandResult<Value> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.ds_create(args.table, args.id_prefix, args.payload).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn ds_update(args: DsUpdateArgs) -> CommandResult<Value> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.ds_update(args.table, args.id, args.updates).await {
                        Ok(row) => CommandResult::success(row),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

#[command]
pub async fn ds_delete(table: String, id: String) -> CommandResult<()> {
    match crate::vault::get_vault_manager().await {
        Ok(manager) => {
            if !manager.is_unlocked().await { return CommandResult::error("Vault is locked".into()) }
            let db = manager.get_database().await.map_err(|e| e.to_string());
            match db {
                Ok(db_lock) => {
                    let db = db_lock.read().await;
                    match db.ds_delete(table, id).await {
                        Ok(()) => CommandResult::success(()),
                        Err(e) => CommandResult::error(e.to_string()),
                    }
                }
                Err(e) => CommandResult::error(e),
            }
        }
        Err(e) => CommandResult::error(e.to_string()),
    }
}

// Commands will be registered directly in lib.rs

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_command_result_success() {
        let result: CommandResult<String> = CommandResult::success("test".to_string());
        assert!(result.success);
        assert_eq!(result.data, Some("test".to_string()));
        assert!(result.error.is_none());
    }

    #[test]
    fn test_command_result_error() {
        let result: CommandResult<String> = CommandResult::error("test error".to_string());
        assert!(!result.success);
        assert!(result.data.is_none());
        assert_eq!(result.error, Some("test error".to_string()));
    }

    #[test]
    fn test_master_password_validation() {
        // This would be expanded with actual validation logic
        assert!(true); // Placeholder
    }
}
