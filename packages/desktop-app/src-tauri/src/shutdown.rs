use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use tokio::sync::Notify;

use crate::vault::shutdown_vault_manager;

/// Global shutdown signal to coordinate clean shutdown
static SHUTDOWN_REQUESTED: AtomicBool = AtomicBool::new(false);

/// Shutdown handler for graceful application exit
pub struct ShutdownHandler {
    shutdown_notify: Arc<Notify>,
    is_shutdown: Arc<AtomicBool>,
}

impl ShutdownHandler {
    pub fn new() -> Self {
        Self {
            shutdown_notify: Arc::new(Notify::new()),
            is_shutdown: Arc::new(AtomicBool::new(false)),
        }
    }

    /// Initiates a graceful shutdown sequence
    pub async fn shutdown(&self) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        if self.is_shutdown.load(Ordering::Acquire) {
            return Ok(()); // Already shutdown
        }

        log::info!("Initiating graceful shutdown sequence");
        
        // Set global shutdown flag
        SHUTDOWN_REQUESTED.store(true, Ordering::Release);
        
        // Shutdown vault manager (this will lock vault and wipe DEK)
        if let Err(e) = shutdown_vault_manager().await {
            log::error!("Error during vault shutdown: {}", e);
            // Continue with shutdown even if vault cleanup fails
        }
        
        // Mark as shutdown complete
        self.is_shutdown.store(true, Ordering::Release);
        self.shutdown_notify.notify_waiters();
        
        log::info!("Graceful shutdown completed");
        Ok(())
    }

    /// Waits for shutdown to complete
    pub async fn wait_for_shutdown(&self) {
        if !self.is_shutdown.load(Ordering::Acquire) {
            self.shutdown_notify.notified().await;
        }
    }

    /// Checks if shutdown has been requested
    pub fn is_shutdown_requested(&self) -> bool {
        SHUTDOWN_REQUESTED.load(Ordering::Acquire)
    }
}

impl Default for ShutdownHandler {
    fn default() -> Self {
        Self::new()
    }
}

/// Signal handler for graceful shutdown on SIGINT/SIGTERM
pub fn setup_signal_handlers() -> Arc<ShutdownHandler> {
    let shutdown_handler = Arc::new(ShutdownHandler::new());
    
    #[cfg(unix)]
    {
        use tokio::signal::unix::{signal, SignalKind};
        
        let handler_clone = Arc::clone(&shutdown_handler);
        tokio::spawn(async move {
            let mut sigint = signal(SignalKind::interrupt())
                .expect("Failed to create SIGINT handler");
            let mut sigterm = signal(SignalKind::terminate())
                .expect("Failed to create SIGTERM handler");
            
            tokio::select! {
                _ = sigint.recv() => {
                    log::info!("Received SIGINT, initiating shutdown");
                }
                _ = sigterm.recv() => {
                    log::info!("Received SIGTERM, initiating shutdown");
                }
            }
            
            if let Err(e) = handler_clone.shutdown().await {
                log::error!("Error during signal-triggered shutdown: {}", e);
            }
        });
    }
    
    #[cfg(windows)]
    {
        use tokio::signal::windows;
        
        let handler_clone = Arc::clone(&shutdown_handler);
        tokio::spawn(async move {
            let mut ctrl_c = windows::ctrl_c()
                .expect("Failed to create Ctrl+C handler");
            let mut ctrl_break = windows::ctrl_break()
                .expect("Failed to create Ctrl+Break handler");
            let mut ctrl_close = windows::ctrl_close()
                .expect("Failed to create Ctrl+Close handler");
            let mut ctrl_shutdown = windows::ctrl_shutdown()
                .expect("Failed to create Ctrl+Shutdown handler");
            
            tokio::select! {
                _ = ctrl_c.recv() => {
                    log::info!("Received Ctrl+C, initiating shutdown");
                }
                _ = ctrl_break.recv() => {
                    log::info!("Received Ctrl+Break, initiating shutdown");
                }
                _ = ctrl_close.recv() => {
                    log::info!("Received Ctrl+Close, initiating shutdown");
                }
                _ = ctrl_shutdown.recv() => {
                    log::info!("Received Ctrl+Shutdown, initiating shutdown");
                }
            }
            
            if let Err(e) = handler_clone.shutdown().await {
                log::error!("Error during signal-triggered shutdown: {}", e);
            }
        });
    }
    
    shutdown_handler
}

/// Emergency shutdown function that can be called from anywhere
pub async fn emergency_shutdown() {
    log::warn!("Emergency shutdown initiated");
    
    // Set shutdown flag
    SHUTDOWN_REQUESTED.store(true, Ordering::Release);
    
    // Force vault shutdown
    if let Err(e) = shutdown_vault_manager().await {
        log::error!("Error during emergency vault shutdown: {}", e);
    }
    
    log::warn!("Emergency shutdown completed");
}

/// Check if shutdown has been requested (for use in loops)
pub fn is_shutdown_requested() -> bool {
    SHUTDOWN_REQUESTED.load(Ordering::Acquire)
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::time::Duration;
    use tokio::time::timeout;

    #[tokio::test]
    async fn test_shutdown_handler() {
        let handler = ShutdownHandler::new();
        
        assert!(!handler.is_shutdown_requested());
        
        // Test shutdown
        handler.shutdown().await.unwrap();
        
        assert!(handler.is_shutdown_requested());
        
        // Should be able to wait for shutdown immediately
        timeout(Duration::from_millis(100), handler.wait_for_shutdown())
            .await
            .expect("Should complete immediately");
    }

    #[tokio::test]
    async fn test_emergency_shutdown() {
        // Reset global state
        SHUTDOWN_REQUESTED.store(false, Ordering::Release);
        
        assert!(!is_shutdown_requested());
        
        emergency_shutdown().await;
        
        assert!(is_shutdown_requested());
    }
}
