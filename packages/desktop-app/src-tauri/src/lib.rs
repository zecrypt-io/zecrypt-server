use tauri::{Manager, Emitter};
use tauri_plugin_deep_link::DeepLinkExt;
use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize, Deserialize)]
struct AuthCallbackData {
    code: Option<String>,
    state: Option<String>,
    access_token: Option<String>,
    error: Option<String>,
}

// Command to open browser for authentication
#[tauri::command]
async fn open_browser_auth() -> Result<(), String> {
    let auth_url = "http://localhost:3000/en/login?desktop_auth=true&return_url=zecrypt://auth/callback";
    
    // Use the opener plugin to open URL in default browser
    tauri_plugin_opener::open_url(auth_url, None::<&str>)
        .map_err(|e| format!("Failed to open browser: {}", e))?;
    
    Ok(())
}

// Command to handle auth success
#[tauri::command]
async fn handle_auth_success(app: tauri::AppHandle, auth_data: AuthCallbackData) -> Result<(), String> {
    log::info!("Authentication successful: {:?}", auth_data);
    
    // Store authentication data securely
    // For now, we'll just emit an event to the frontend
    app.emit("auth-success", &auth_data)
        .map_err(|e| format!("Failed to emit auth event: {}", e))?;
    
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .plugin(tauri_plugin_deep_link::init())
    .plugin(tauri_plugin_opener::init())
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Register deeplink handler
      app.deep_link().register_all()?;
      
      let app_handle = app.handle().clone();
      app.deep_link().on_open_url(move |event| {
        let urls = event.urls();
        log::info!("Received deeplink with {} URLs", urls.len());
        
        // Get the first URL from the event
        if let Some(tauri_url) = urls.first() {
          let url_str = tauri_url.as_str();
          log::info!("Processing URL: {}", url_str);
          
          if url_str.starts_with("zecrypt://auth/callback") {
            // Parse the URL to extract auth data
            if let Ok(parsed_url) = url::Url::parse(url_str) {
              let query_pairs: std::collections::HashMap<_, _> = parsed_url.query_pairs().collect();
              
              let auth_data = AuthCallbackData {
                code: query_pairs.get("code").map(|s| s.to_string()),
                state: query_pairs.get("state").map(|s| s.to_string()),
                access_token: query_pairs.get("access_token").map(|s| s.to_string()),
                error: query_pairs.get("error").map(|s| s.to_string()),
              };
              
              log::info!("Extracted auth data: {:?}", auth_data);
              
              // Send auth data to frontend
              if let Err(e) = app_handle.emit("auth-callback", &auth_data) {
                log::error!("Failed to emit auth callback: {}", e);
              }
            } else {
              log::error!("Failed to parse URL: {}", url_str);
            }
          }
        }
      });

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![
      open_browser_auth,
      handle_auth_success
    ])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
