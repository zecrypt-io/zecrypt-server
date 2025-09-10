use std::collections::HashMap;
use std::fs;
use std::io::{Read, Write};
use std::path::{PathBuf};
use tauri::{AppHandle, Manager};

pub struct SettingsStore;

impl SettingsStore {
    fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
        let dir = app.path().app_data_dir().map_err(|e| format!("Failed to get app data dir: {}", e))?;
        if !dir.exists() {
            fs::create_dir_all(&dir).map_err(|e| format!("Failed to create app data dir: {}", e))?;
        }
        Ok(dir.join("settings.json"))
    }

    fn read_all(app: &AppHandle) -> Result<HashMap<String, String>, String> {
        let path = Self::settings_path(app)?;
        if !path.exists() {
            return Ok(HashMap::new());
        }
        let mut file = fs::File::open(&path).map_err(|e| format!("Failed to open settings file: {}", e))?;
        let mut contents = String::new();
        file.read_to_string(&mut contents).map_err(|e| format!("Failed to read settings file: {}", e))?;
        if contents.trim().is_empty() {
            return Ok(HashMap::new());
        }
        let map: HashMap<String, String> = serde_json::from_str(&contents).map_err(|e| format!("Failed to parse settings JSON: {}", e))?;
        Ok(map)
    }

    fn write_all(app: &AppHandle, map: &HashMap<String, String>) -> Result<(), String> {
        let path = Self::settings_path(app)?;
        let tmp = path.with_extension("json.tmp");
        let data = serde_json::to_string_pretty(map).map_err(|e| format!("Failed to serialize settings: {}", e))?;
        let mut file = fs::File::create(&tmp).map_err(|e| format!("Failed to create temp settings file: {}", e))?;
        file.write_all(data.as_bytes()).map_err(|e| format!("Failed to write settings: {}", e))?;
        drop(file);
        fs::rename(tmp, path).map_err(|e| format!("Failed to finalize settings file: {}", e))?;
        Ok(())
    }

    pub fn get(app: &AppHandle, key: &str) -> Result<Option<String>, String> {
        let map = Self::read_all(app)?;
        Ok(map.get(key).cloned())
    }

    pub fn set(app: &AppHandle, key: &str, value: &str) -> Result<(), String> {
        let mut map = Self::read_all(app)?;
        map.insert(key.to_string(), value.to_string());
        Self::write_all(app, &map)
    }

    pub fn delete(app: &AppHandle, key: &str) -> Result<(), String> {
        let mut map = Self::read_all(app)?;
        map.remove(key);
        Self::write_all(app, &map)
    }

    pub fn clear(app: &AppHandle) -> Result<(), String> {
        let map: HashMap<String, String> = HashMap::new();
        Self::write_all(app, &map)
    }
}
