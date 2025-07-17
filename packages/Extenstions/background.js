// Import configuration and crypto utilities
importScripts('config.js');
importScripts('crypto-utils.js');

// API Base URL will be set after configuration is loaded
let API_BASE_URL = null;

// Initialize configuration when extension starts
(async function initializeExtension() {
  try {
    await ExtensionConfig.initConfig();
    API_BASE_URL = ExtensionConfig.getApiBaseUrl();
    console.log('Extension initialized with API Base URL:', API_BASE_URL);
  } catch (error) {
    console.error('Failed to initialize extension configuration:', error);
    // Fallback to production URL if config fails
    API_BASE_URL = 'https://api.zecrypt.io/api/v1/web';
  }
})();

// Function to ensure configuration is loaded
function ensureConfigLoaded() {
  if (!API_BASE_URL) {
    throw new Error('Extension configuration not loaded. Please reload the extension.');
  }
  return API_BASE_URL;
}

// Helper function to check if URL is accessible for script injection
function isValidUrl(url) {
  // Exclude chrome:// URLs, chrome-extension:// URLs, and other restricted schemes
  if (!url) return false;
  
  const restrictedProtocols = ['chrome:', 'chrome-extension:', 'moz-extension:', 'about:', 'edge:', 'opera:'];
  
  for (const protocol of restrictedProtocols) {
    if (url.startsWith(protocol)) {
      return false;
    }
  }
  
  // Only allow http and https
  return url.startsWith('http://') || url.startsWith('https://');
}

const ENDPOINTS = {
  cards: function(workspaceId, projectId) { 
    return `/${workspaceId}/${projectId}/cards`;
  },
  accounts: function(workspaceId, projectId) { 
    return `/${workspaceId}/${projectId}/accounts`;
  }
};

// Get stored token and user data
function getAuthData() {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId', 'zecryptProjectAesKey'], function(result) {
      if (result.zecryptToken) {
        resolve({
          token: result.zecryptToken,
          workspaceId: result.zecryptWorkspaceId,
          projectId: result.zecryptProjectId,
          projectAesKey: result.zecryptProjectAesKey // Add project AES key
        });
      } else {
        reject(new Error('No authentication token found'));
      }
    });
  });
}

// Enhanced function to store project AES key securely
async function storeProjectAesKey(projectAesKey) {
  try {
    // Encrypt the project AES key before storing using CryptoUtils
    const encryptedKey = await CryptoUtils.encryptForLocalStorage(projectAesKey);
    chrome.storage.local.set({ 
      zecryptProjectAesKey: encryptedKey
    });
  } catch (error) {
    console.error('Error storing project AES key:', error);
  }
}

// Enhanced function to get decrypted project AES key
async function getDecryptedProjectAesKey() {
  return new Promise(async (resolve) => {
    chrome.storage.local.get(['zecryptProjectAesKey'], async (result) => {
      if (result.zecryptProjectAesKey) {
        try {
          const decryptedKey = await CryptoUtils.decryptFromLocalStorage(result.zecryptProjectAesKey);
          resolve(decryptedKey);
        } catch (error) {
          console.error('Error decrypting project AES key:', error);
          resolve(null);
        }
      } else {
        console.warn('No project AES key found in storage');
        resolve(null);
      }
    });
  });
}

// Enhanced function to process and decrypt card data
async function processCardData(cardRaw) {
  try {
    const projectAesKey = await getDecryptedProjectAesKey();
    
    if (!projectAesKey) {
      console.error("Project AES key not found for decryption");
      return {
        ...cardRaw,
        cardNumber: 'Key missing',
        name: 'Key missing',
        expiry: 'Key missing',
        cvv: 'Key missing',
        last4: 'Key missing',
        expMonth: 'Key missing',
        expYear: 'Key missing'
      };
    }

    if (cardRaw.data && cardRaw.data.includes('.')) {
      try {
        const decryptedData = await CryptoUtils.decryptDataField(cardRaw.data, projectAesKey);
        const parsedData = JSON.parse(decryptedData);
        
        return {
          ...cardRaw,
          cardNumber: parsedData.number || 'undefined',
          name: parsedData.card_holder_name || 'undefined',
          expiry: `${parsedData.expiry_month || ''}/${parsedData.expiry_year || ''}`,
          cvv: parsedData.cvv || 'undefined',
          last4: parsedData.number ? parsedData.number.slice(-4) : 'undefined',
          expMonth: parsedData.expiry_month || 'undefined',
          expYear: parsedData.expiry_year || 'undefined'
        };
      } catch (decryptError) {
        console.error("Failed to decrypt card data:", decryptError);
        return {
          ...cardRaw,
          cardNumber: 'Decrypt failed',
          name: 'Decrypt failed',
          expiry: 'Decrypt failed',
          cvv: 'Decrypt failed',
          last4: 'Decrypt failed',
          expMonth: 'Decrypt failed',
          expYear: 'Decrypt failed'
        };
      }
    } else {
      // Data might not be encrypted (legacy format)
      try {
        const parsedData = JSON.parse(cardRaw.data);
        return {
          ...cardRaw,
          cardNumber: parsedData.number || 'undefined',
          name: parsedData.card_holder_name || 'undefined',
          expiry: `${parsedData.expiry_month || ''}/${parsedData.expiry_year || ''}`,
          cvv: parsedData.cvv || 'undefined',
          last4: parsedData.number ? parsedData.number.slice(-4) : 'undefined',
          expMonth: parsedData.expiry_month || 'undefined',
          expYear: parsedData.expiry_year || 'undefined'
        };
      } catch (parseError) {
        console.error("Error parsing card data:", parseError);
        return cardRaw;
      }
    }
  } catch (error) {
    console.error("Error processing card data:", error);
    return cardRaw;
  }
}

// Enhanced function to process and decrypt account data
async function processAccountData(accountRaw) {
  try {
    const projectAesKey = await getDecryptedProjectAesKey();
    
    if (!projectAesKey) {
      console.error("Project AES key not found for decryption");
      return {
        ...accountRaw,
        username: 'Key missing',
        password: 'Key missing',
        website: accountRaw.url || accountRaw.website || 'undefined'
      };
    }

    if (accountRaw.data && accountRaw.data.includes('.')) {
      try {
        const decryptedData = await CryptoUtils.decryptDataField(accountRaw.data, projectAesKey);
        const parsedData = JSON.parse(decryptedData);
        
        return {
          ...accountRaw,
          username: parsedData.username || 'undefined',
          password: parsedData.password || 'undefined',
          website: accountRaw.url || accountRaw.website || 'undefined'
        };
      } catch (decryptError) {
        console.error("Failed to decrypt account data:", decryptError);
        return {
          ...accountRaw,
          username: 'Decrypt failed',
          password: 'Decrypt failed',
          website: accountRaw.url || accountRaw.website || 'undefined'
        };
      }
    } else {
      // Data might not be encrypted (legacy format)
      try {
        const parsedData = JSON.parse(accountRaw.data);
        return {
          ...accountRaw,
          username: parsedData.username || 'undefined',
          password: parsedData.password || 'undefined',
          website: accountRaw.url || accountRaw.website || 'undefined'
        };
      } catch (parseError) {
        console.error("Error parsing account data:", parseError);
        return accountRaw;
      }
    }
  } catch (error) {
    console.error("Error processing account data:", error);
    return accountRaw;
  }
}

// Make authenticated API request
function apiRequest(endpoint, method, data) {
  method = method || 'GET';
  
  return new Promise(function(resolve, reject) {
    getAuthData()
      .then(function(authData) {
        // Check if we have required workspace and project IDs
        if (!authData.workspaceId || !authData.projectId) {
          throw new Error('Missing workspace or project ID. Please log in through the web app.');
        }
        
        // Resolve endpoint if it's a function
        var resolvedEndpoint = typeof endpoint === 'function' 
          ? endpoint(authData.workspaceId, authData.projectId)
          : endpoint;
        
        var options = {
          method: method,
          headers: {
            'access-token': authData.token,
            'Content-Type': 'application/json'
          }
        };
        
        if (data && (method === 'POST' || method === 'PUT')) {
          options.body = JSON.stringify(data);
        }
        
        const apiUrl = ensureConfigLoaded() + resolvedEndpoint;
        console.log('Making API request:', {
          url: apiUrl,
          method: method,
          hasToken: !!authData.token,
          tokenPrefix: authData.token ? authData.token.substring(0, 10) + '...' : 'none',
          workspaceId: authData.workspaceId,
          projectId: authData.projectId
        });
        
        return fetch(apiUrl, options);
      })
      .then(function(response) {
        console.log('API response status:', response.status, response.statusText);
        
        if (!response.ok) {
          if (response.status === 401) {
            console.error('401 Unauthorized - clearing stored tokens');
            chrome.storage.local.remove(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId']);
            throw new Error('Authentication failed. Please log in again.');
          }
          
          // Try to get response text for better error details
          return response.text().then(errorText => {
            console.error('API request failed:', {
              status: response.status,
              statusText: response.statusText,
              errorText: errorText
            });
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
          });
        }
        
        return response.json();
      })
      .then(function(data) {
        console.log('API request successful');
        resolve(data);
      })
      .catch(function(error) {
        console.error('API request error:', error);
        reject(error);
      });
  });
}

// Enhanced getCards function with decryption
function getCards() {
  return new Promise(function(resolve, reject) {
    apiRequest(ENDPOINTS.cards)
      .then(async function(response) {
        const cards = response.data || [];
        const processedCards = await Promise.all(cards.map(processCardData));
        
        resolve({
          success: true,
          data: processedCards
        });
      })
      .catch(function(error) {
        resolve({
          success: false,
          error: error.message
        });
      });
  });
}

// Enhanced getAccounts function with decryption
function getAccounts() {
  return new Promise(function(resolve, reject) {
    apiRequest(ENDPOINTS.accounts)
      .then(async function(response) {
        const accounts = response.data || [];
        const processedAccounts = await Promise.all(accounts.map(processAccountData));
        
        resolve({
          success: true,
          data: processedAccounts
        });
      })
      .catch(function(error) {
        resolve({
          success: false,
          error: error.message
        });
      });
  });
}

// Enhanced external message listener to handle project AES key
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'LOGIN' && message.token) {
      // Store the token and workspace/project IDs securely in chrome.storage.local
      chrome.storage.local.set({ 
        zecryptToken: message.token,
        zecryptWorkspaceId: message.workspaceId,
        zecryptProjectId: message.projectId
      }, async () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing tokens:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          // Store project AES key securely if provided
          if (message.projectAesKey) {
            await storeProjectAesKey(message.projectAesKey);
          }
          
          sendResponse({ success: true });
        }
      });
      
      // Return true to indicate that sendResponse will be called asynchronously
      return true;
    }
  }
);

// Function to check localStorage for auth data (fallback method)
function checkLocalStorageAuth() {
  return new Promise((resolve) => {
    try {
      // Execute script in the active tab to check localStorage
      chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        if (tabs[0] && tabs[0].url && isValidUrl(tabs[0].url) && (tabs[0].url.includes('localhost') || tabs[0].url.includes('zecrypt'))) {          chrome.scripting.executeScript({
            target: {tabId: tabs[0].id},
            func: () => {
              try {
                const authData = localStorage.getItem('zecrypt_extension_auth');
                console.log('Extension: Checking localStorage for auth data:', !!authData);
                
                if (authData) {
                  try {
                    const parsed = JSON.parse(authData);
                    console.log('Extension: Found auth data:', {
                      hasToken: !!parsed.token,
                      hasWorkspaceId: !!parsed.workspaceId,
                      hasProjectId: !!parsed.projectId,
                      hasProjectAesKey: !!parsed.projectAesKey,
                      timestamp: parsed.timestamp
                    });
                    
                    // Remove the auth data after reading it
                    localStorage.removeItem('zecrypt_extension_auth');
                    return parsed;
                  } catch (e) {
                    console.error('Extension: Error parsing auth data:', e);
                    localStorage.removeItem('zecrypt_extension_auth');
                    return null;
                  }
                }
                return null;
              } catch (error) {
                console.error('Extension: Error accessing localStorage:', error);
                return null;
              }
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.error('Extension: Script execution failed:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            
            if (results && results[0] && results[0].result) {
              const authData = results[0].result;
              console.log('Extension: Processing auth data from localStorage');
              
              // Store in extension storage
              chrome.storage.local.set({
                zecryptToken: authData.token,
                zecryptWorkspaceId: authData.workspaceId,
                zecryptProjectId: authData.projectId
              }, async () => {
                if (chrome.runtime.lastError) {
                  console.error('Extension: Error storing auth data:', chrome.runtime.lastError);
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  console.log('Extension: Successfully stored auth data in chrome.storage.local');
                  
                  // Store project AES key securely if provided
                  if (authData.projectAesKey) {
                    await storeProjectAesKey(authData.projectAesKey);
                    console.log('Extension: Successfully stored project AES key');
                  }
                  
                  resolve({ success: true, authData });
                }
              });
            } else {
              console.log('Extension: No auth data found in localStorage');
              resolve({ success: false, error: 'No auth data found' });
            }
          });        } else {
          console.log('Extension: No accessible tab found for localStorage check');
          resolve({ success: false, error: 'No accessible tab found' });
        }
      });
    } catch (error) {
      console.error('Extension: Error in checkLocalStorageAuth:', error);
      resolve({ success: false, error: error.message });
    }
  });
}

// Periodically check for auth data when login is pending
let authCheckInterval = null;
let authCheckAttempts = 0;
const MAX_AUTH_CHECK_ATTEMPTS = 30; // Stop after 1 minute (30 * 2 seconds)

function startAuthCheck() {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
  }
  
  authCheckAttempts = 0;
  
  authCheckInterval = setInterval(async () => {
    authCheckAttempts++;
    
    // Stop checking after max attempts
    if (authCheckAttempts > MAX_AUTH_CHECK_ATTEMPTS) {
      stopAuthCheck();
      return;
    }
    
    try {
      const result = await checkLocalStorageAuth();
      if (result.success) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
        
        // Notify popup if it's open
        try {
          chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS' });
        } catch (e) {
          // Popup might not be open, that's ok
        }
      } else if (result.error && result.error.includes('Cannot access')) {
        // If we get access errors, reduce polling frequency
      }
    } catch (error) {
      console.error('Error during auth check:', error);
    }
  }, 2000); // Check every 2 seconds
}

function stopAuthCheck() {
  if (authCheckInterval) {
    clearInterval(authCheckInterval);
    authCheckInterval = null;
  }
}

// Check authentication status and return result
function checkAuth() {
  return new Promise((resolve) => {
    try {
      chrome.storage.local.get(['zecryptToken'], (result) => {
        if (chrome.runtime.lastError) {
          console.error('Error accessing storage:', chrome.runtime.lastError);
          resolve({ isAuthenticated: false, error: chrome.runtime.lastError.message });
        } else if (result.zecryptToken) {
          resolve({ isAuthenticated: true });
        } else {
          resolve({ isAuthenticated: false });
        }
      });
    } catch (error) {
      console.error('Error in checkAuth:', error);
      resolve({ isAuthenticated: false, error: error.message });
    }
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CHECK_AUTH') {
    checkAuth().then(result => {
      
      // If not authenticated, try checking localStorage as fallback
      if (!result.isAuthenticated) {
        checkLocalStorageAuth().then(localResult => {
          if (localResult.success) {
            // Re-check auth after localStorage data is stored
            checkAuth().then(newResult => {
              sendResponse(newResult);
            });
          } else {
            sendResponse(result);
            // Only start periodic checking if we don't have access errors
            if (!localResult.error || !localResult.error.includes('Cannot access')) {
              startAuthCheck();
            }
          }
        });
      } else {
        sendResponse(result);
        // Stop any ongoing auth check
        stopAuthCheck();
      }
    }).catch(error => {
      console.error('Error in CHECK_AUTH:', error);
      sendResponse({ isAuthenticated: false, error: error.message });
    });
    return true;
  }

  // Handle start auth check request
  if (message.type === 'START_AUTH_CHECK') {
    startAuthCheck();
    sendResponse({ success: true });
    return true;
  }

  // Handle stop auth check request  
  if (message.type === 'STOP_AUTH_CHECK') {
    stopAuthCheck();
    sendResponse({ success: true });
    return true;
  }
  // Handle logout request
  if (message.type === 'LOGOUT') {
          chrome.storage.local.remove(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId', 'zecryptProjectAesKey'], () => {
        sendResponse({ success: true });
      });
    return true;
  }

  // Handle login request from popup (when receiving auth data)
  if (message.type === 'LOGIN' && message.token) {
    chrome.storage.local.set({ 
      zecryptToken: message.token,
      zecryptWorkspaceId: message.workspaceId,
      zecryptProjectId: message.projectId
    }, async () => {
      // Store project AES key securely if provided
      if (message.projectAesKey) {
        await storeProjectAesKey(message.projectAesKey);
      }
      
      sendResponse({ success: true });
    });
    return true;
  }
    // Handle data fetching requests
  if (message.type === 'FETCH_DATA') {
    if (message.dataType === 'cards') {
      getCards()
        .then(response => {
          sendResponse(response);
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (message.dataType === 'accounts') {
      getAccounts()
        .then(response => {
          sendResponse(response);
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  }
  
  // Handle form filling requests from popup
  if (message.type === 'GET_DATA') {
    if (message.dataType === 'card') {
      getCards()
        .then(response => {
          if (response.success && response.data && response.data.length > 0) {
            // Return all cards - for now use first one, but structure allows for future selector UI
            sendResponse({ success: true, data: response.data, multiple: response.data.length > 1 });
          } else {
            sendResponse({ success: false, error: 'No cards available' });
          }
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (message.dataType === 'account') {
      getAccounts()
        .then(response => {
          if (response.success && response.data && response.data.length > 0) {
            // Return all accounts so the content script can show a selector UI
            sendResponse({ success: true, data: response.data, multiple: response.data.length > 1 });
          } else {
            sendResponse({ success: false, error: 'No accounts available' });
          }
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
  }
});

// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(() => {
  // Extension installed
});