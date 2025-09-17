use sqlx::{sqlite::{SqlitePool, SqliteConnectOptions, SqlitePoolOptions}, Row, SqliteConnection, Connection, Column};
use std::path::PathBuf;
use thiserror::Error;
use crate::crypto::{SecureDek, EncryptedDek, CryptoError};
use tauri::{AppHandle, Manager};
use std::str::FromStr;
use serde::{Serialize, Deserialize};
use serde_json::{Value, Map};

/// Database-related errors
#[derive(Error, Debug)]
pub enum DatabaseError {
    #[error("SQLite error: {0}")]
    Sqlite(#[from] sqlx::Error),
    #[error("Crypto error: {0}")]
    Crypto(#[from] CryptoError),
    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),
    #[error("Vault not initialized")]
    VaultNotInitialized,
    #[error("Vault already initialized")]
    VaultAlreadyInitialized,
    #[error("Invalid vault configuration: {0}")]
    InvalidConfig(String),
}

pub type Result<T> = std::result::Result<T, DatabaseError>;

/// Metadata for vault encryption stored in the database
#[derive(Debug, Clone)]
pub struct VaultMeta {
    pub salt: [u8; 32],
    pub encrypted_dek: EncryptedDek,
    pub created_at: i64,
    pub version: i32,
}

impl VaultMeta {
    pub fn new(salt: [u8; 32], encrypted_dek: EncryptedDek) -> Self {
        Self {
            salt,
            encrypted_dek,
            created_at: chrono::Utc::now().timestamp(),
            version: 1,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AccountRow {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: Option<String>,
    pub name: String,
    pub username: Option<String>,
    pub email: Option<String>,
    #[serde(rename = "encryptedPassword")]
    pub encrypted_password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub tags_json: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct AccountCreatePayload {
    #[serde(rename = "projectId")]
    pub project_id: Option<String>,
    pub name: String,
    pub username: Option<String>,
    pub email: Option<String>,
    #[serde(rename = "encryptedPassword")]
    pub encrypted_password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct AccountUpdatePayload {
    pub name: Option<String>,
    pub username: Option<String>,
    pub email: Option<String>,
    #[serde(rename = "encryptedPassword")]
    pub encrypted_password: Option<String>,
    pub url: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<serde_json::Value>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct IdentityRow {
    pub id: String,
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub title: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub country: Option<String>,
    pub date_of_birth: Option<String>,
    pub national_id: Option<String>,
    pub notes: Option<String>,
    pub tags_json: Option<String>,
    #[serde(rename = "createdAt")]
    pub created_at: String,
    #[serde(rename = "updatedAt")]
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct IdentityCreatePayload {
    #[serde(rename = "projectId")]
    pub project_id: String,
    pub title: String,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub country: Option<String>,
    pub date_of_birth: Option<String>,
    pub national_id: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize)]
pub struct IdentityUpdatePayload {
    pub title: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
    pub country: Option<String>,
    pub date_of_birth: Option<String>,
    pub national_id: Option<String>,
    pub notes: Option<String>,
    pub tags: Option<serde_json::Value>,
}

/// Thread-safe database manager with sqlx
/// Implements application-level encryption where the DEK encrypts sensitive fields
pub struct Database {
    pool: Option<SqlitePool>,
    db_path: PathBuf,
    dek: Option<SecureDek>, // Store DEK for application-level encryption
}

impl Database {
    /// Creates a new database manager using the app's data directory.
    pub fn new(app_handle: &AppHandle) -> Result<Self> {
        let app_dir = match app_handle.path().app_data_dir() {
            Ok(path) => path,
            Err(e) => return Err(DatabaseError::Io(std::io::Error::new(
                std::io::ErrorKind::Other,
                format!("Failed to get app data dir: {}", e)
            ))),
        };
        
        if !app_dir.exists() {
            std::fs::create_dir_all(&app_dir)?;
        }
        
        let db_path = app_dir.join("vault.db");
        
        Ok(Self {
            pool: None,
            db_path,
            dek: None,
        })
    }

    /// Creates a new database manager at a specific path for testing.
    #[cfg(test)]
    pub fn new_for_test(path: &PathBuf) -> Self {
        Self {
            pool: None,
            db_path: path.to_path_buf(),
            dek: None,
        }
    }

    /// Builds SqliteConnectOptions with a correct filename and flags
    fn connect_options(&self) -> SqliteConnectOptions {
        SqliteConnectOptions::from_str("sqlite://").unwrap_or_else(|_| SqliteConnectOptions::new())
            .filename(&self.db_path)
            .create_if_missing(true)
    }

    /// Checks if the vault is initialized (vault_meta table exists and has data)
    pub async fn is_initialized(&self) -> Result<bool> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;

        // Check if vault_meta table exists and has data
        let table_exists: i64 = sqlx::query_scalar(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='vault_meta'"
        )
        .fetch_one(&mut conn)
        .await
        .unwrap_or(0);
        
        if table_exists == 0 {
            conn.close().await?;
            return Ok(false);
        }

        // Check if table has data
        let row_count: i64 = sqlx::query_scalar("SELECT COUNT(*) FROM vault_meta")
            .fetch_one(&mut conn)
            .await
            .unwrap_or(0);
        
        conn.close().await?;
        Ok(row_count > 0)
    }

    /// Initializes a new vault with the given DEK
    pub async fn initialize_vault(&mut self, vault_meta: VaultMeta, dek: &SecureDek) -> Result<()> {
        if self.is_initialized().await? {
            return Err(DatabaseError::VaultAlreadyInitialized);
        }

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(self.connect_options())
            .await?;

        // Create vault_meta table
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS vault_meta (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                salt BLOB NOT NULL,
                encrypted_dek BLOB NOT NULL,
                created_at INTEGER NOT NULL,
                version INTEGER NOT NULL DEFAULT 1
            )
            "#
        )
        .execute(&pool)
        .await?;

        // Insert vault metadata
        sqlx::query(
            "INSERT INTO vault_meta (id, salt, encrypted_dek, created_at, version) VALUES (?, ?, ?, ?, ?)"
        )
        .bind(1)
        .bind(&vault_meta.salt[..])
        .bind(vault_meta.encrypted_dek.to_bytes())
        .bind(vault_meta.created_at)
        .bind(vault_meta.version)
        .execute(&pool)
        .await?;

        // Store pool and DEK
        self.pool = Some(pool);
        self.dek = Some(dek.clone());

        // Create encrypted tables for user data
        self.create_user_tables().await?;

        log::info!("Vault initialized successfully with sqlx and application-level encryption");
        Ok(())
    }

    /// Opens the vault using the provided DEK
    pub async fn open_with_dek(&mut self, dek: &SecureDek) -> Result<()> {
        if !self.is_initialized().await? {
            return Err(DatabaseError::VaultNotInitialized);
        }

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect_with(self.connect_options())
            .await?;
        
        // Test the connection by trying to read from a table
        match sqlx::query_scalar::<_, String>(
            "SELECT name FROM sqlite_master WHERE type='table' LIMIT 1"
        )
        .fetch_optional(&pool)
        .await
        {
            Ok(_) => {
                self.pool = Some(pool);
                self.dek = Some(dek.clone());
                log::info!("Vault opened successfully with DEK using sqlx");
                Ok(())
            }
            Err(e) => {
                pool.close().await;
                Err(DatabaseError::Crypto(CryptoError::Decryption(
                    format!("Failed to open vault: {}", e)
                )))
            }
        }
    }

    /// Loads vault metadata from the database
    pub async fn load_vault_meta(&self) -> Result<VaultMeta> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;

        let row = sqlx::query("SELECT salt, encrypted_dek, created_at, version FROM vault_meta WHERE id = 1")
            .fetch_one(&mut conn)
            .await?;

        let salt_bytes: Vec<u8> = row.get("salt");
        let encrypted_dek_bytes: Vec<u8> = row.get("encrypted_dek");
        let created_at: i64 = row.get("created_at");
        let version: i32 = row.get("version");

        conn.close().await?;

        if salt_bytes.len() != 32 {
            return Err(DatabaseError::InvalidConfig("Invalid salt size".to_string()));
        }

        let salt: [u8; 32] = salt_bytes.try_into()
            .map_err(|_| DatabaseError::InvalidConfig("Invalid salt format".to_string()))?;

        let encrypted_dek = EncryptedDek::from_bytes(&encrypted_dek_bytes)?;

        Ok(VaultMeta {
            salt,
            encrypted_dek,
            created_at,
            version,
        })
    }

    /// Creates tables for user data with application-level encryption support
    async fn create_user_tables(&mut self) -> Result<()> {
        let pool = self.pool.as_ref()
            .ok_or(DatabaseError::VaultNotInitialized)?;

        // IMPORTANT: Use dedicated 'vault_*' table names to avoid conflicts with
        // frontend datastore tables (e.g., 'cards', 'notes').

        // Create vault_passwords table - sensitive fields stored as encrypted BLOBs
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS vault_passwords (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                username TEXT,
                email TEXT,
                encrypted_password BLOB NOT NULL,  -- Application-level encrypted
                website TEXT,
                notes TEXT,
                folder_id TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_used_at INTEGER,
                tags TEXT,
                is_favorite INTEGER DEFAULT 0,
                FOREIGN KEY (folder_id) REFERENCES vault_folders(id)
            )
            "#
        )
        .execute(pool)
        .await?;

        // Create vault_cards table - sensitive fields stored as encrypted BLOBs
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS vault_cards (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                cardholder_name TEXT,
                encrypted_number BLOB NOT NULL,    -- Application-level encrypted
                encrypted_cvv BLOB,                -- Application-level encrypted
                expiry_month INTEGER,
                expiry_year INTEGER,
                brand TEXT,
                notes TEXT,
                folder_id TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                last_used_at INTEGER,
                tags TEXT,
                is_favorite INTEGER DEFAULT 0,
                FOREIGN KEY (folder_id) REFERENCES vault_folders(id)
            )
            "#
        )
        .execute(pool)
        .await?;

        // Create vault_notes table - content stored as encrypted BLOB
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS vault_notes (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                encrypted_content BLOB NOT NULL,   -- Application-level encrypted
                folder_id TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                tags TEXT,
                is_favorite INTEGER DEFAULT 0,
                FOREIGN KEY (folder_id) REFERENCES vault_folders(id)
            )
            "#
        )
        .execute(pool)
        .await?;

        // Create vault_folders table - no sensitive data, no encryption needed
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS vault_folders (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (parent_id) REFERENCES vault_folders(id)
            )
            "#
        )
        .execute(pool)
        .await?;

        // Create indexes for performance
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_vault_passwords_folder ON vault_passwords(folder_id)")
            .execute(pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_vault_cards_folder ON vault_cards(folder_id)")
            .execute(pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_vault_notes_folder ON vault_notes(folder_id)")
            .execute(pool)
            .await?;

        log::info!("User tables created successfully with application-level encryption support");
        Ok(())
    }

    // Migrate any conflicting legacy tables to non-conflicting names
    async fn migrate_conflicting_tables(&self, pool: &SqlitePool) -> Result<()> {
        // Helper to check if a table exists
        async fn table_exists(pool: &SqlitePool, name: &str) -> std::result::Result<bool, sqlx::Error> {
            let count: i64 = sqlx::query_scalar(
                "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name=?"
            ).bind(name).fetch_one(pool).await?;
            Ok(count > 0)
        }

        // If a 'cards' table exists but does not contain 'projectId', it is the legacy vault table. Rename it.
        if table_exists(pool, "cards").await.unwrap_or(false) {
            let cols = sqlx::query("PRAGMA table_info(cards)").fetch_all(pool).await.unwrap_or_default();
            let mut has_project_id = false;
            for c in cols {
                let cname: std::result::Result<String, _> = c.try_get("name");
                if let Ok(n) = cname { if n == "projectId" { has_project_id = true; break; } }
            }
            if !has_project_id {
                // Rename to vault_cards if not already present
                if !table_exists(pool, "vault_cards").await.unwrap_or(false) {
                    sqlx::query("ALTER TABLE cards RENAME TO vault_cards").execute(pool).await?;
                }
            }
        }

        // If a 'notes' table exists but does not contain 'projectId', it is the legacy vault table. Rename it.
        if table_exists(pool, "notes").await.unwrap_or(false) {
            let cols = sqlx::query("PRAGMA table_info(notes)").fetch_all(pool).await.unwrap_or_default();
            let mut has_project_id = false;
            for c in cols {
                let cname: std::result::Result<String, _> = c.try_get("name");
                if let Ok(n) = cname { if n == "projectId" { has_project_id = true; break; } }
            }
            if !has_project_id {
                if !table_exists(pool, "vault_notes").await.unwrap_or(false) {
                    sqlx::query("ALTER TABLE notes RENAME TO vault_notes").execute(pool).await?;
                }
            }
        }

        Ok(())
    }

    async fn create_frontend_tables(&self, pool: &SqlitePool) -> Result<()> {
        // Migrate any legacy/conflicting tables first
        self.migrate_conflicting_tables(pool).await?;
        // Accounts
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS accounts (
                id TEXT PRIMARY KEY,
                projectId TEXT,
                name TEXT NOT NULL,
                username TEXT,
                email TEXT,
                encryptedPassword TEXT,
                url TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Identities
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS identities (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                email TEXT,
                phone TEXT,
                address TEXT,
                country TEXT,
                date_of_birth TEXT,
                national_id TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Workspaces
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workspaces (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Projects
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS projects (
                id TEXT PRIMARY KEY,
                workspaceId TEXT NOT NULL,
                name TEXT NOT NULL,
                description TEXT,
                color TEXT,
                isDefault INTEGER,
                features_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Emails
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS emails (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                email_address TEXT,
                imap_server TEXT,
                smtp_server TEXT,
                username TEXT,
                password TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Cards
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS cards (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                brand TEXT,
                card_holder_name TEXT,
                number TEXT,
                expiry_month TEXT,
                expiry_year TEXT,
                cvv TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Notes
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS notes (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                data TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Wallet phrases
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS wallet_phrases (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                wallet_type TEXT,
                passphrase TEXT,
                wallet_address TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // SSH Keys
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS ssh_keys (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                ssh_key TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Licenses
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS licenses (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                license_key TEXT,
                expires_at TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Envs
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS envs (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                data TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Wifi networks
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS wifi_networks (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                security_type TEXT,
                password TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // API Keys
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                projectId TEXT NOT NULL,
                title TEXT NOT NULL,
                key TEXT,
                env TEXT,
                notes TEXT,
                tags_json TEXT,
                createdAt TEXT NOT NULL,
                updatedAt TEXT NOT NULL
            )
            "#
        ).execute(pool).await?;
        // Ensure required columns exist on legacy tables
        self.ensure_columns(pool).await.map_err(DatabaseError::Sqlite)?;
        Ok(())
    }

    async fn ensure_columns(&self, pool: &SqlitePool) -> std::result::Result<(), sqlx::Error> {
        // Helper list of tables that should have createdAt/updatedAt
        let time_tables = [
            "workspaces","projects","accounts","identities","emails","cards",
            "notes","wallet_phrases","ssh_keys","licenses","envs","wifi_networks","api_keys"
        ];
        for t in time_tables.iter() {
            self.ensure_column(pool, t, "createdAt", "TEXT").await?;
            self.ensure_column(pool, t, "updatedAt", "TEXT").await?;
        }
        // Tables that should have tags_json
        let tag_tables = [
            "accounts","identities","emails","cards","notes","wallet_phrases",
            "ssh_keys","licenses","envs","wifi_networks","api_keys"
        ];
        for t in tag_tables.iter() {
            self.ensure_column(pool, t, "tags_json", "TEXT").await?;
        }
        // Projects specific columns
        self.ensure_column(pool, "projects", "isDefault", "INTEGER").await?;
        self.ensure_column(pool, "projects", "features_json", "TEXT").await?;
        // Identities country column (desktop needs it)
        self.ensure_column(pool, "identities", "country", "TEXT").await?;
        Ok(())
    }

    async fn ensure_column(&self, pool: &SqlitePool, table: &str, column: &str, col_type: &str) -> std::result::Result<(), sqlx::Error> {
        // PRAGMA table_info cannot be parameterized; table names are internal/whitelisted
        let pragma = format!("PRAGMA table_info({})", table);
        let rows = sqlx::query(&pragma).fetch_all(pool).await?;
        let mut exists = false;
        for r in rows {
            let name: std::result::Result<String, _> = r.try_get("name");
            if let Ok(n) = name { if n == column { exists = true; break; } }
        }
        if !exists {
            let alter = format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, col_type);
            let _ = sqlx::query(&alter).execute(pool).await?;
        }
        Ok(())
    }

    fn whitelist_table(&self, table: &str) -> bool {
        matches!(table,
            "workspaces"|"projects"|"emails"|"cards"|"notes"|"wallet_phrases"|"ssh_keys"|"licenses"|"envs"|"wifi_networks"|"api_keys"
        )
    }

    pub async fn ds_list(&self, table: String, project_id: Option<String>) -> Result<Vec<Value>> {
        if !self.whitelist_table(&table) { return Err(DatabaseError::InvalidConfig("Invalid table".into())) }
        // Ensure tables exist and are migrated
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;
        let sql = if project_id.is_some() && table != "workspaces" && table != "projects" {
            format!("SELECT * FROM {} WHERE projectId = ? ORDER BY createdAt ASC", table)
        } else {
            format!("SELECT * FROM {} ORDER BY {} ASC", table, if table=="workspaces"||table=="projects" {"createdAt"} else {"createdAt"})
        };
        let rows = if let Some(pid) = project_id {
            if table=="workspaces"||table=="projects" { sqlx::query(&sql).fetch_all(&pool).await? } else { sqlx::query(&sql).bind(pid).fetch_all(&pool).await? }
        } else {
            sqlx::query(&sql).fetch_all(&pool).await?
        };
        let mut out = Vec::new();
        for row in rows {
            let cols = row.columns();
            let mut obj = Map::new();
            for c in cols {
                let name = c.name();
                let val_str: std::result::Result<String, sqlx::Error> = row.try_get(name);
                let v = match val_str {
                    Ok(s) => Value::String(s),
                    Err(_) => {
                        let val_i64: std::result::Result<i64, sqlx::Error> = row.try_get(name);
                        match val_i64 { Ok(i) => Value::from(i), Err(_) => Value::Null }
                    }
                };
                obj.insert(name.to_string(), v);
            }
            out.push(Value::Object(obj));
        }
        Ok(out)
    }

    pub async fn ds_create(&self, table: String, id_prefix: String, mut payload: Map<String, Value>) -> Result<Value> {
        if !self.whitelist_table(&table) { return Err(DatabaseError::InvalidConfig("Invalid table".into())) }
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;

        // Normalize common fields
        if let Some(tags_val) = payload.remove("tags") {
            // Store as JSON string in tags_json column
            payload.insert("tags_json".into(), Value::String(tags_val.to_string()));
        }

        // Table-specific normalization
        if table == "cards" {
            // Some callers send a combined 'data' JSON string/object with card fields
            if let Some(data_val) = payload.remove("data") {
                // Accept either stringified JSON or object
                let obj_opt: Option<Map<String, Value>> = match data_val {
                    Value::String(s) => serde_json::from_str::<Value>(&s).ok().and_then(|v| v.as_object().cloned()),
                    Value::Object(m) => Some(m),
                    _ => None,
                };
                if let Some(m) = obj_opt {
                    // Map known fields to columns
                    if let Some(v) = m.get("card_holder_name").cloned() { payload.insert("card_holder_name".into(), v); }
                    if let Some(v) = m.get("number").cloned() { payload.insert("number".into(), v); }
                    if let Some(v) = m.get("expiry_month").cloned() { payload.insert("expiry_month".into(), v); }
                    if let Some(v) = m.get("expiry_year").cloned() { payload.insert("expiry_year".into(), v); }
                    if let Some(v) = m.get("cvv").cloned() { payload.insert("cvv".into(), v); }
                }
            }
        }

        let id = format!("{}_{}", id_prefix, chrono::Utc::now().timestamp_millis());
        let now = chrono::Utc::now().to_rfc3339();
        let cols: Vec<String> = payload.keys().cloned().collect();
        let mut placeholders: Vec<String> = Vec::new();
        let mut binds: Vec<Value> = Vec::new();
        for k in &cols { placeholders.push("?".into()); binds.push(payload.get(k).cloned().unwrap_or(Value::Null)); }
        let sql = format!("INSERT INTO {} (id, {}, createdAt, updatedAt) VALUES (?, {}, ?, ?)", table, cols.join(","), placeholders.join(","));
        let mut q = sqlx::query(&sql).bind(&id);
        for b in &binds {
            match b {
                Value::String(s)=>{ q = q.bind(s); },
                Value::Number(n)=>{ if let Some(i)=n.as_i64(){ q=q.bind(i); } else { q=q.bind(n.to_string()); } },
                Value::Null=>{ q=q.bind::<Option<String>>(None); },
                _=>{ q=q.bind(b.to_string()); }
            }
        }
        q = q.bind(&now).bind(&now);
        q.execute(&pool).await?;
        // Return object
        let mut obj = Map::new();
        obj.insert("id".into(), Value::String(id));
        for (k,v) in payload { obj.insert(k, v); }
        obj.insert("createdAt".into(), Value::String(now.clone()));
        obj.insert("updatedAt".into(), Value::String(now));
        Ok(Value::Object(obj))
    }

    pub async fn ds_update(&self, table: String, id: String, updates_in: Map<String, Value>) -> Result<Value> {
        if !self.whitelist_table(&table) { return Err(DatabaseError::InvalidConfig("Invalid table".into())) }
        // Ensure tables exist and are migrated
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        let now = chrono::Utc::now().to_rfc3339();

        // Normalize common fields
        let mut updates = updates_in;
        if let Some(tags_val) = updates.remove("tags") {
            updates.insert("tags_json".into(), Value::String(tags_val.to_string()));
        }

        let mut set_parts: Vec<String> = Vec::new();
        for k in updates.keys() { set_parts.push(format!("{} = COALESCE(?, {} )", k, k)); }
        set_parts.push("updatedAt = ?".into());
        let sql = format!("UPDATE {} SET {} WHERE id = ?", table, set_parts.join(", "));
        let mut q = sqlx::query(&sql);
        for (_, v) in &updates {
            match v {
                Value::String(s)=>{ q = q.bind(s); },
                Value::Number(n)=>{ if let Some(i)=n.as_i64(){ q=q.bind(i); } else { q=q.bind(n.to_string()); } },
                Value::Null=>{ q = q.bind::<Option<String>>(None); },
                _=>{ q=q.bind(v.to_string()); }
            }
        }
        q = q.bind(&now).bind(&id);
        q.execute(&mut conn).await?;
        // Return latest row
        let sel = format!("SELECT * FROM {} WHERE id = ?", table);
        let row = sqlx::query(&sel).bind(&id).fetch_one(&mut conn).await?;
        let cols = row.columns();
        let mut obj = Map::new();
        for c in cols {
            let name = c.name();
            let val_str: std::result::Result<String, sqlx::Error> = row.try_get(name);
            let v = match val_str { Ok(s)=>Value::String(s), Err(_)=>{ let val_i64: std::result::Result<i64, sqlx::Error> = row.try_get(name); match val_i64 { Ok(i)=>Value::from(i), Err(_)=>Value::Null } } };
            obj.insert(name.to_string(), v);
        }
        Ok(Value::Object(obj))
    }

    pub async fn ds_delete(&self, table: String, id: String) -> Result<()> {
        if !self.whitelist_table(&table) { return Err(DatabaseError::InvalidConfig("Invalid table".into())) }
        // Ensure tables exist and are migrated
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        let sql = format!("DELETE FROM {} WHERE id = ?", table);
        sqlx::query(&sql).bind(&id).execute(&mut conn).await?;
        Ok(())
    }

    pub async fn accounts_list(&self, project_id: Option<String>) -> Result<Vec<AccountRow>> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        let rows = if let Some(pid) = project_id {
            sqlx::query("SELECT * FROM accounts WHERE projectId = ? ORDER BY createdAt ASC")
                .bind(pid)
                .fetch_all(&mut conn)
                .await?
        } else {
            sqlx::query("SELECT * FROM accounts ORDER BY createdAt ASC")
                .fetch_all(&mut conn)
                .await?
        };
        conn.close().await?;
        let mapped = rows.into_iter().map(|r| AccountRow {
            id: r.get("id"),
            project_id: r.try_get("projectId").ok(),
            name: r.get("name"),
            username: r.try_get("username").ok(),
            email: r.try_get("email").ok(),
            encrypted_password: r.try_get("encryptedPassword").ok(),
            url: r.try_get("url").ok(),
            notes: r.try_get("notes").ok(),
            tags_json: r.try_get("tags_json").ok(),
            created_at: r.get("createdAt"),
            updated_at: r.get("updatedAt"),
        }).collect();
        Ok(mapped)
    }

    pub async fn accounts_create(&self, payload: AccountCreatePayload) -> Result<AccountRow> {
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;
        let id = format!("acc_{}", chrono::Utc::now().timestamp_millis());
        let now = chrono::Utc::now().to_rfc3339();
        let tags_json = payload.tags.map(|t| t.to_string());
        sqlx::query(
            "INSERT INTO accounts (id, projectId, name, username, email, encryptedPassword, url, notes, tags_json, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?)"
        )
        .bind(&id)
        .bind(&payload.project_id)
        .bind(&payload.name)
        .bind(&payload.username)
        .bind(&payload.email)
        .bind(&payload.encrypted_password)
        .bind(&payload.url)
        .bind(&payload.notes)
        .bind(&tags_json)
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await?;
        let row = AccountRow {
            id,
            project_id: payload.project_id,
            name: payload.name,
            username: payload.username,
            email: payload.email,
            encrypted_password: payload.encrypted_password,
            url: payload.url,
            notes: payload.notes,
            tags_json,
            created_at: now.clone(),
            updated_at: now,
        };
        Ok(row)
    }

    pub async fn accounts_update(&self, id: String, updates: AccountUpdatePayload) -> Result<AccountRow> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        // Load existing
        let existing = sqlx::query("SELECT * FROM accounts WHERE id = ?")
            .bind(&id)
            .fetch_one(&mut conn)
            .await?;
        let now = chrono::Utc::now().to_rfc3339();
        let name: String = updates.name.unwrap_or_else(|| existing.get("name"));
        let username: Option<String> = updates.username.or_else(|| existing.try_get("username").ok());
        let email: Option<String> = updates.email.or_else(|| existing.try_get("email").ok());
        let enc: Option<String> = updates.encrypted_password.or_else(|| existing.try_get("encryptedPassword").ok());
        let url: Option<String> = updates.url.or_else(|| existing.try_get("url").ok());
        let notes: Option<String> = updates.notes.or_else(|| existing.try_get("notes").ok());
        let tags_json: Option<String> = match updates.tags {
            Some(v) => Some(v.to_string()),
            None => existing.try_get("tags_json").ok(),
        };
        sqlx::query(
            "UPDATE accounts SET name=?, username=?, email=?, encryptedPassword=?, url=?, notes=?, tags_json=?, updatedAt=? WHERE id=?"
        )
        .bind(&name)
        .bind(&username)
        .bind(&email)
        .bind(&enc)
        .bind(&url)
        .bind(&notes)
        .bind(&tags_json)
        .bind(&now)
        .bind(&id)
        .execute(&mut conn)
        .await?;
        let project_id: Option<String> = existing.try_get("projectId").ok();
        conn.close().await?;
        Ok(AccountRow { id, project_id: project_id, name, username, email, encrypted_password: enc, url, notes, tags_json, created_at: existing.get("createdAt"), updated_at: now })
    }

    pub async fn accounts_delete(&self, id: String) -> Result<()> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        sqlx::query("DELETE FROM accounts WHERE id = ?")
            .bind(&id)
            .execute(&mut conn)
            .await?;
        conn.close().await?;
        Ok(())
    }

    pub async fn identities_list(&self, project_id: Option<String>) -> Result<Vec<IdentityRow>> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        let rows = if let Some(pid) = project_id {
            sqlx::query("SELECT * FROM identities WHERE projectId = ? ORDER BY createdAt ASC")
                .bind(pid)
                .fetch_all(&mut conn)
                .await?
        } else {
            sqlx::query("SELECT * FROM identities ORDER BY createdAt ASC")
                .fetch_all(&mut conn)
                .await?
        };
        conn.close().await?;
        let mapped = rows.into_iter().map(|r| IdentityRow {
            id: r.get("id"),
            project_id: r.get("projectId"),
            title: r.get("title"),
            first_name: r.try_get("first_name").ok(),
            last_name: r.try_get("last_name").ok(),
            email: r.try_get("email").ok(),
            phone: r.try_get("phone").ok(),
            address: r.try_get("address").ok(),
            country: r.try_get("country").ok(),
            date_of_birth: r.try_get("date_of_birth").ok(),
            national_id: r.try_get("national_id").ok(),
            notes: r.try_get("notes").ok(),
            tags_json: r.try_get("tags_json").ok(),
            created_at: r.get("createdAt"),
            updated_at: r.get("updatedAt"),
        }).collect();
        Ok(mapped)
    }

    pub async fn identities_create(&self, payload: IdentityCreatePayload) -> Result<IdentityRow> {
        let pool = SqlitePoolOptions::new().max_connections(5).connect_with(self.connect_options()).await?;
        self.create_frontend_tables(&pool).await?;
        let id = format!("identity_{}", chrono::Utc::now().timestamp_millis());
        let now = chrono::Utc::now().to_rfc3339();
        let tags_json = payload.tags.map(|t| t.to_string());
        sqlx::query(
            "INSERT INTO identities (id, projectId, title, first_name, last_name, email, phone, address, country, date_of_birth, national_id, notes, tags_json, createdAt, updatedAt) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)"
        )
        .bind(&id)
        .bind(&payload.project_id)
        .bind(&payload.title)
        .bind(&payload.first_name)
        .bind(&payload.last_name)
        .bind(&payload.email)
        .bind(&payload.phone)
        .bind(&payload.address)
        .bind(&payload.country)
        .bind(&payload.date_of_birth)
        .bind(&payload.national_id)
        .bind(&payload.notes)
        .bind(&tags_json)
        .bind(&now)
        .bind(&now)
        .execute(&pool)
        .await?;
        Ok(IdentityRow { id, project_id: payload.project_id, title: payload.title, first_name: payload.first_name, last_name: payload.last_name, email: payload.email, phone: payload.phone, address: payload.address, country: payload.country, date_of_birth: payload.date_of_birth, national_id: payload.national_id, notes: payload.notes, tags_json, created_at: now.clone(), updated_at: now })
    }

    pub async fn identities_update(&self, id: String, updates: IdentityUpdatePayload) -> Result<IdentityRow> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        let existing = sqlx::query("SELECT * FROM identities WHERE id = ?")
            .bind(&id)
            .fetch_one(&mut conn)
            .await?;
        let now = chrono::Utc::now().to_rfc3339();
        let title: String = updates.title.unwrap_or_else(|| existing.get("title"));
        let first_name: Option<String> = updates.first_name.or_else(|| existing.try_get("first_name").ok());
        let last_name: Option<String> = updates.last_name.or_else(|| existing.try_get("last_name").ok());
        let email: Option<String> = updates.email.or_else(|| existing.try_get("email").ok());
        let phone: Option<String> = updates.phone.or_else(|| existing.try_get("phone").ok());
        let address: Option<String> = updates.address.or_else(|| existing.try_get("address").ok());
        let country: Option<String> = updates.country.or_else(|| existing.try_get("country").ok());
        let date_of_birth: Option<String> = updates.date_of_birth.or_else(|| existing.try_get("date_of_birth").ok());
        let national_id: Option<String> = updates.national_id.or_else(|| existing.try_get("national_id").ok());
        let notes: Option<String> = updates.notes.or_else(|| existing.try_get("notes").ok());
        let tags_json: Option<String> = match updates.tags {
            Some(v) => Some(v.to_string()),
            None => existing.try_get("tags_json").ok(),
        };
        sqlx::query(
            "UPDATE identities SET title=?, first_name=?, last_name=?, email=?, phone=?, address=?, country=?, date_of_birth=?, national_id=?, notes=?, tags_json=?, updatedAt=? WHERE id=?"
        )
        .bind(&title)
        .bind(&first_name)
        .bind(&last_name)
        .bind(&email)
        .bind(&phone)
        .bind(&address)
        .bind(&country)
        .bind(&date_of_birth)
        .bind(&national_id)
        .bind(&notes)
        .bind(&tags_json)
        .bind(&now)
        .bind(&id)
        .execute(&mut conn)
        .await?;
        let project_id: String = existing.get("projectId");
        conn.close().await?;
        Ok(IdentityRow { id, project_id: project_id, title, first_name, last_name, email, phone, address, country, date_of_birth, national_id, notes, tags_json, created_at: existing.get("createdAt"), updated_at: now })
    }

    pub async fn identities_delete(&self, id: String) -> Result<()> {
        let mut conn = SqliteConnection::connect_with(&self.connect_options()).await?;
        sqlx::query("DELETE FROM identities WHERE id = ?")
            .bind(&id)
            .execute(&mut conn)
            .await?;
        conn.close().await?;
        Ok(())
    }

    /// Encrypts data using the stored DEK
    #[allow(dead_code)]
    pub fn encrypt_data(&self, plaintext: &str) -> Result<Vec<u8>> {
        let dek = self.dek.as_ref()
            .ok_or(DatabaseError::VaultNotInitialized)?;
        
        use aes_gcm::{Aes256Gcm, Key, KeyInit, AeadCore};
        use aes_gcm::aead::{Aead, OsRng};
        
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(dek.as_bytes()));
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        
        let ciphertext = cipher.encrypt(&nonce, plaintext.as_bytes())
            .map_err(|e| DatabaseError::Crypto(CryptoError::Encryption(e.to_string())))?;
        
        // Prepend nonce to ciphertext
        let mut result = nonce.to_vec();
        result.extend_from_slice(&ciphertext);
        
        Ok(result)
    }

    /// Decrypts data using the stored DEK
    #[allow(dead_code)]
    pub fn decrypt_data(&self, encrypted_data: &[u8]) -> Result<String> {
        let dek = self.dek.as_ref()
            .ok_or(DatabaseError::VaultNotInitialized)?;
        
        if encrypted_data.len() < 12 { // nonce size
            return Err(DatabaseError::Crypto(CryptoError::Decryption(
                "Invalid encrypted data length".to_string()
            )));
        }
        
        use aes_gcm::{Aes256Gcm, Key, Nonce, KeyInit};
        use aes_gcm::aead::Aead;
        
        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(dek.as_bytes()));
        let nonce = Nonce::from_slice(&encrypted_data[..12]);
        let ciphertext = &encrypted_data[12..];
        
        let plaintext = cipher.decrypt(nonce, ciphertext)
            .map_err(|e| DatabaseError::Crypto(CryptoError::Decryption(e.to_string())))?;
        
        String::from_utf8(plaintext)
            .map_err(|e| DatabaseError::Crypto(CryptoError::Decryption(
                format!("Invalid UTF-8: {}", e)
            )))
    }

    /// Closes the database connection
    pub async fn close(&mut self) -> Result<()> {
        if let Some(pool) = self.pool.take() {
            pool.close().await;
            log::info!("Database pool closed");
        }
        
        // Clear DEK from memory
        self.dek = None;
        Ok(())
    }

    /// Returns a reference to the database pool
    pub fn pool(&self) -> Result<&SqlitePool> {
        self.pool.as_ref()
            .ok_or(DatabaseError::VaultNotInitialized)
    }

    /// Checks if the database is currently open
    #[allow(dead_code)]
    pub fn is_open(&self) -> bool {
        self.pool.is_some() && self.dek.is_some()
    }
}

impl Drop for Database {
    fn drop(&mut self) {
        if self.pool.is_some() {
            log::warn!("Database pool was not properly closed");
        }
        // DEK will be automatically dropped and memory zeroed by SecureDek
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::crypto::{generate_salt, generate_dek, derive_kek, encrypt_dek, SecureDek};
    use tempfile::TempDir;

    async fn create_test_database() -> (Database, TempDir) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test_vault.db");
        
        let db = Database::new_for_test(&db_path.to_path_buf());
        
        (db, temp_dir)
    }

    #[tokio::test]
    async fn test_vault_initialization() {
        let (mut db, _temp_dir) = create_test_database().await;
        
        // Should not be initialized initially
        assert!(!db.is_initialized().await.unwrap());
        
        // Create vault metadata
        let salt = generate_salt();
        let dek = generate_dek();
        let secure_dek = SecureDek::new(dek);
        
        let password = "test_password_123";
        let kek = derive_kek(password, &salt).unwrap();
        let encrypted_dek = encrypt_dek(&kek, &dek).unwrap();
        
        let vault_meta = VaultMeta::new(salt, encrypted_dek);
        
        // Initialize vault
        db.initialize_vault(vault_meta.clone(), &secure_dek).await.unwrap();
        
        // Should be initialized now
        assert!(db.is_initialized().await.unwrap());
        
        // Should be able to load metadata
        let loaded_meta = db.load_vault_meta().await.unwrap();
        assert_eq!(loaded_meta.salt, vault_meta.salt);
        assert_eq!(loaded_meta.version, vault_meta.version);
    }

    #[tokio::test]
    async fn test_application_level_encryption() {
        let (mut db, _temp_dir) = create_test_database().await;
        
        let salt = generate_salt();
        let dek = generate_dek();
        let secure_dek = SecureDek::new(dek);
        
        let password = "test_password_123";
        let kek = derive_kek(password, &salt).unwrap();
        let encrypted_dek = encrypt_dek(&kek, &dek).unwrap();
        
        let vault_meta = VaultMeta::new(salt, encrypted_dek);
        
        // Initialize vault
        db.initialize_vault(vault_meta, &secure_dek).await.unwrap();
        
        // Test encryption/decryption
        let test_data = "This is sensitive password data";
        let encrypted = db.encrypt_data(test_data).unwrap();
        let decrypted = db.decrypt_data(&encrypted).unwrap();
        
        assert_eq!(test_data, decrypted);
        assert_ne!(test_data.as_bytes(), &encrypted);
    }

    #[tokio::test]
    async fn test_vault_open_close_cycle() {
        let (mut db, _temp_dir) = create_test_database().await;
        
        let salt = generate_salt();
        let dek = generate_dek();
        let secure_dek = SecureDek::new(dek);
        
        let password = "test_password_123";
        let kek = derive_kek(password, &salt).unwrap();
        let encrypted_dek = encrypt_dek(&kek, &dek).unwrap();
        
        let vault_meta = VaultMeta::new(salt, encrypted_dek);
        
        // Initialize and close
        db.initialize_vault(vault_meta, &secure_dek).await.unwrap();
        assert!(db.is_open());
        
        db.close().await.unwrap();
        assert!(!db.is_open());
        
        // Should be able to open again with correct DEK
        let result = db.open_with_dek(&secure_dek).await;
        assert!(result.is_ok());
        assert!(db.is_open());
    }

    #[tokio::test]
    async fn test_double_initialization_fails() {
        let (mut db, _temp_dir) = create_test_database().await;
        
        let salt = generate_salt();
        let dek = generate_dek();
        let secure_dek = SecureDek::new(dek);
        
        let password = "test_password_123";
        let kek = derive_kek(password, &salt).unwrap();
        let encrypted_dek = encrypt_dek(&kek, &dek).unwrap();
        
        let vault_meta = VaultMeta::new(salt, encrypted_dek.clone());
        
        // First initialization should succeed
        db.initialize_vault(vault_meta.clone(), &secure_dek).await.unwrap();
        
        // Second initialization should fail
        let vault_meta2 = VaultMeta::new(salt, encrypted_dek);
        let result = db.initialize_vault(vault_meta2, &secure_dek).await;
        assert!(matches!(result, Err(DatabaseError::VaultAlreadyInitialized)));
    }
}