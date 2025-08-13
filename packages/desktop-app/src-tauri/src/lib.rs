use tauri::{Emitter, Manager, Listener};
use tauri_plugin_deep_link::DeepLinkExt;

#[derive(Clone, serde::Serialize)]
struct AuthCallbackData {
    access_token: String,
    email: String,
    code: String,
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

#[tauri::command]
async fn handle_auth_success(
    app: tauri::AppHandle,
    access_token: String,
    email: String,
    code: String,
) -> Result<(), String> {
    let auth_data = AuthCallbackData {
        access_token,
        email,
        code,
    };
    
    app.emit("auth-callback", &auth_data)
        .map_err(|e| format!("Failed to emit auth callback: {}", e))?;
    
    Ok(())
}



#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let builder = tauri::Builder::default();

    // Temporarily disable single instance on Windows to avoid startup crash
    // Re-enable after investigating plugin null pointer deref on windows.rs:121
    #[cfg(all(desktop, not(target_os = "windows")))]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        log::info!("Single instance activated with args: {:?}", argv);
        for arg in &argv {
            if arg.starts_with("zecrypt://") {
                if let Err(e) = app.emit("deep-link-received", arg) {
                    log::error!("Failed to emit deep link event: {}", e);
                }
                break;
            }
        }
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
            let _ = window.show();
            let _ = window.unminimize();
        }
    }));

    // Register single-instance first (re-enabled with fixed version)
    #[cfg(desktop)]
    let builder = builder.plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
        log::info!("Single instance activated with args: {:?}", argv);
        for arg in &argv {
            if arg.starts_with("zecrypt://") {
                if let Err(e) = app.emit("deep-link-received", arg) {
                    log::error!("Failed to emit deep link event: {}", e);
                }
                break;
            }
        }
        if let Some(window) = app.get_webview_window("main") {
            let _ = window.set_focus();
            let _ = window.show();
            let _ = window.unminimize();
        }
    }));

    builder
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_deep_link::init())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }

            // Register deep link schemes for development
            #[cfg(any(target_os = "linux", all(debug_assertions, windows)))]
            {
                app.deep_link().register_all()?;
            }

            // Set up deep link listener
            let app_handle = app.handle().clone();
            app.deep_link().on_open_url(move |event| {
                let urls = event.urls();
                log::info!("Deep link received via on_open_url: {:?}", urls);
                for url in urls {
                    let url_str = url.as_str();
                    if url_str.starts_with("zecrypt://auth/callback") {
                        if let Err(e) = app_handle.emit("auth-callback", url_str) {
                            log::error!("Failed to emit auth callback: {}", e);
                        }
                    }
                }
            });

            // Listen for deep link events from single instance
            let app_handle2 = app.handle().clone();
            app.listen("deep-link-received", move |event| {
                if let Ok(url) = serde_json::from_str::<String>(event.payload()) {
                    log::info!("Deep link received via single instance: {}", url);
                    if url.starts_with("zecrypt://auth/callback") {
                        if let Err(e) = app_handle2.emit("auth-callback", &url) {
                            log::error!("Failed to emit auth callback from single instance: {}", e);
                        }
                    }
                }
            });

            log::info!("Zecrypt Desktop app initialized with stable single instance plugin v2.2.0");
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            open_browser_auth,
            handle_auth_success
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
