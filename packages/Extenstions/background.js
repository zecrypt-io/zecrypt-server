// Base API URL
const API_BASE_URL = 'https://preview.api.zecrypt.io/api/v1/web';

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
  emails: function(workspaceId, projectId) { 
    return `/${workspaceId}/${projectId}/emails`;
  }
};

// Get stored token and user data
function getAuthData() {
  return new Promise(function(resolve, reject) {
    chrome.storage.local.get(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId'], function(result) {
      if (result.zecryptToken) {
        resolve({
          token: result.zecryptToken,
          workspaceId: result.zecryptWorkspaceId,
          projectId: result.zecryptProjectId
        });
      } else {
        reject(new Error('No authentication token found'));
      }
    });
  });
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
        
        return fetch(API_BASE_URL + resolvedEndpoint, options);
      })
      .then(function(response) {
        if (!response.ok) {
          if (response.status === 401) {
            chrome.storage.local.remove(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId']);
            throw new Error('Authentication failed. Please log in again.');
          }
          
          throw new Error('API request failed with status ' + response.status);
        }
        
        return response.json();
      })
      .then(function(data) {
        resolve(data);
      })
      .catch(function(error) {
        console.error('API request error:', error);
        reject(error);
      });
  });
}

// Fetch all cards
function getCards() {
  return new Promise(function(resolve, reject) {
    apiRequest(ENDPOINTS.cards)
      .then(function(response) {
        resolve({
          success: true,
          data: response.data || []
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

// Fetch all emails
function getEmails() {
  return new Promise(function(resolve, reject) {
    apiRequest(ENDPOINTS.emails)
      .then(function(response) {
        resolve({
          success: true,
          data: response.data || []
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

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    console.log('External message received:', message);
    if (message.type === 'LOGIN' && message.token) {
      // Store the token and workspace/project IDs securely in chrome.storage.local
      chrome.storage.local.set({ 
        zecryptToken: message.token,
        zecryptWorkspaceId: message.workspaceId,
        zecryptProjectId: message.projectId
      }, () => {
        if (chrome.runtime.lastError) {
          console.error('Error storing tokens:', chrome.runtime.lastError);
          sendResponse({ success: false, error: chrome.runtime.lastError.message });
        } else {
          console.log('Token and workspace data stored successfully');
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
                if (authData) {
                  try {
                    const parsed = JSON.parse(authData);
                    // Remove the auth data after reading it
                    localStorage.removeItem('zecrypt_extension_auth');
                    return parsed;
                  } catch (e) {
                    console.error('Error parsing auth data:', e);
                    localStorage.removeItem('zecrypt_extension_auth');
                    return null;
                  }
                }
                return null;
              } catch (error) {
                console.error('Error accessing localStorage:', error);
                return null;
              }
            }
          }, (results) => {
            if (chrome.runtime.lastError) {
              console.log('Script execution failed:', chrome.runtime.lastError.message);
              resolve({ success: false, error: chrome.runtime.lastError.message });
              return;
            }
            
            if (results && results[0] && results[0].result) {
              const authData = results[0].result;
              // Store in extension storage
              chrome.storage.local.set({
                zecryptToken: authData.token,
                zecryptWorkspaceId: authData.workspaceId,
                zecryptProjectId: authData.projectId
              }, () => {
                if (chrome.runtime.lastError) {
                  console.error('Error storing auth data:', chrome.runtime.lastError);
                  resolve({ success: false, error: chrome.runtime.lastError.message });
                } else {
                  console.log('Auth data retrieved from localStorage and stored');
                  resolve({ success: true, authData });
                }
              });
            } else {
              resolve({ success: false, error: 'No auth data found' });
            }
          });        } else {
          console.log('No valid tab found for localStorage check. Current tab:', tabs[0]?.url || 'No tab');
          resolve({ success: false, error: 'No accessible tab found' });
        }
      });
    } catch (error) {
      console.error('Error checking localStorage:', error);
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
      console.log('Auth check timeout after', MAX_AUTH_CHECK_ATTEMPTS, 'attempts');
      stopAuthCheck();
      return;
    }
    
    try {
      const result = await checkLocalStorageAuth();
      if (result.success) {
        clearInterval(authCheckInterval);
        authCheckInterval = null;
        console.log('Authentication successful via localStorage polling');
        
        // Notify popup if it's open
        try {
          chrome.runtime.sendMessage({ type: 'AUTH_SUCCESS' });
        } catch (e) {
          // Popup might not be open, that's ok
          console.log('Could not notify popup:', e.message);
        }
      } else if (result.error && result.error.includes('Cannot access')) {
        // If we get access errors, reduce polling frequency
        console.log('Access error during auth check, slowing down polling');
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
  console.log('Internal message received:', message);
    if (message.type === 'CHECK_AUTH') {
    checkAuth().then(result => {
      console.log('Auth check result:', result);
      
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
            } else {
              console.log('Skipping periodic auth check due to access restrictions');
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
    chrome.storage.local.remove(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId'], () => {
      console.log('Tokens removed');
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
    }, () => {
      console.log('Token and workspace data stored successfully from popup');
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
    
    if (message.dataType === 'emails') {
      getEmails()
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
            // For simplicity, return the first card
            // In a real implementation, you would show a selector UI
            sendResponse({ success: true, data: response.data[0] });
          } else {
            sendResponse({ success: false, error: 'No cards available' });
          }
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (message.dataType === 'email') {
      getEmails()
        .then(response => {
          if (response.success && response.data && response.data.length > 0) {
            // For simplicity, return the first email
            // In a real implementation, you would show a selector UI
            sendResponse({ success: true, data: response.data[0] });
          } else {
            sendResponse({ success: false, error: 'No emails available' });
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
  console.log('Zecrypt extension installed');
});