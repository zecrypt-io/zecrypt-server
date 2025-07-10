/**
 * Configuration loader for browser extension
 * Handles environment variables in browser context
 * 
 * SECURITY NOTE: 
 * - Create a .env file in this directory with: INDEXED_DB_AES_KEY="your_key_here"
 * - The .env file is ignored by git and should never be committed
 * - In production, use build-time injection or secure configuration management
 */

// This will hold our configuration
let CONFIG = null;

/**
 * Load configuration from environment file
 * Note: This is a simplified approach for browser extensions
 * In a real production setup, you'd want to use build-time injection
 */
async function loadConfigFromEnv() {
  try {
    // Try to fetch the .env file (this will only work in development)
    const response = await fetch(chrome.runtime.getURL('.env'));
    if (response.ok) {
      const envText = await response.text();
      const config = {};
      
      // Parse simple KEY="value" format
      const lines = envText.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          if (key && valueParts.length > 0) {
            // Remove quotes from value
            let value = valueParts.join('=').trim();
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
              value = value.slice(1, -1);
            }
            config[key] = value;
          }
        }
      }
      
      return config;
    }
  } catch (error) {
    console.warn('Could not load .env file:', error.message);
  }
  
  return null;
}

/**
 * Initialize configuration
 * This should be called when the extension starts
 */
async function initConfig() {
  // Try to load from .env file first
  CONFIG = await loadConfigFromEnv();
  
  // If no config loaded, check for injected config (build-time injection)
  if (!CONFIG && typeof window !== 'undefined' && window.INJECTED_CONFIG) {
    CONFIG = window.INJECTED_CONFIG;
  }
  
  // If still no config, throw an error
  if (!CONFIG || !CONFIG.INDEXED_DB_AES_KEY) {
    throw new Error(
      'Configuration not found! Please create a .env file in the extensions directory with:\n' +
      'INDEXED_DB_AES_KEY="your_key_here"\n\n' +
      'See README.md for setup instructions.'
    );
  }
  
  return CONFIG;
}

/**
 * Get a configuration value
 */
function getConfig(key) {
  if (!CONFIG) {
    throw new Error('Configuration not initialized. Call initConfig() first.');
  }
  
  const value = CONFIG[key];
  if (!value) {
    throw new Error(`Configuration key '${key}' not found.`);
  }
  
  return value;
}

/**
 * Get the AES encryption key for localStorage encryption
 */
function getIndexedDbAesKey() {
  return getConfig('INDEXED_DB_AES_KEY');
}

/**
 * Check if configuration is loaded
 */
function isConfigLoaded() {
  return CONFIG !== null;
}

// Export for browser extension context
const ExtensionConfig = {
  initConfig,
  getConfig,
  getIndexedDbAesKey,
  isConfigLoaded
};

// Make available globally
if (typeof globalThis !== 'undefined') {
  globalThis.ExtensionConfig = ExtensionConfig;
}

// Also support module exports for potential build tools
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExtensionConfig;
} 