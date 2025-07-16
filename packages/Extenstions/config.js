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
 * Default configuration values
 */
const DEFAULT_CONFIG = {
  // Development environment
  DEVELOPMENT: {
    API_BASE_URL: 'http://localhost:8000/api/v1/web',
    WEB_APP_BASE_URL: 'http://localhost:3000',
    IS_DEVELOPMENT: true
  },
  // Production environment  
  PRODUCTION: {
    API_BASE_URL: 'https://api.zecrypt.io/api/v1/web',
    WEB_APP_BASE_URL: 'https://app.zecrypt.io',
    IS_DEVELOPMENT: false
  },
  // Preview environment
  PREVIEW: {
    API_BASE_URL: 'https://preview.api.zecrypt.io/api/v1/web',
    WEB_APP_BASE_URL: 'https://preview.app.zecrypt.io',
    IS_DEVELOPMENT: false
  }
};

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
  let envConfig = await loadConfigFromEnv();
  
  // If no config loaded, check for injected config (build-time injection)
  if (!envConfig && typeof window !== 'undefined' && window.INJECTED_CONFIG) {
    envConfig = window.INJECTED_CONFIG;
  }
  
  // Determine environment
  const environment = envConfig?.ENVIRONMENT || 'PRODUCTION';
  
  // Merge default config with environment-specific config and .env overrides
  CONFIG = {
    ...DEFAULT_CONFIG[environment],
    ...envConfig
  };
  
  // If still no encryption key, throw an error
  if (!CONFIG.INDEXED_DB_AES_KEY) {
    throw new Error(
      'Configuration not found! Please create a .env file in the extensions directory with:\n' +
      'INDEXED_DB_AES_KEY="your_key_here"\n' +
      'ENVIRONMENT="PRODUCTION" # or DEVELOPMENT or PREVIEW\n\n' +
      'See README.md for setup instructions.'
    );
  }
  
  console.log('Extension configuration loaded:', {
    environment,
    apiBaseUrl: CONFIG.API_BASE_URL,
    webAppBaseUrl: CONFIG.WEB_APP_BASE_URL,
    isDevelopment: CONFIG.IS_DEVELOPMENT
  });
  
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
  if (value === undefined) {
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
 * Get the API base URL
 */
function getApiBaseUrl() {
  return getConfig('API_BASE_URL');
}

/**
 * Get the web app base URL
 */
function getWebAppBaseUrl() {
  return getConfig('WEB_APP_BASE_URL');
}

/**
 * Check if running in development mode
 */
function isDevelopment() {
  return getConfig('IS_DEVELOPMENT');
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
  getApiBaseUrl,
  getWebAppBaseUrl,
  isDevelopment,
  isConfigLoaded
};

// Make available globally
if (typeof globalThis !== 'undefined') {
  globalThis.ExtensionConfig = ExtensionConfig;
}

if (typeof self !== 'undefined') {
  self.ExtensionConfig = ExtensionConfig;
} 