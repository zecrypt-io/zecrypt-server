// Base API URL
const API_BASE_URL = 'https://preview.api.zecrypt.io/api/v1/web';

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
            'Authorization': 'Bearer ' + authData.token,
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
        console.log('Token and workspace data stored successfully');
        sendResponse({ success: true });
      });
      
      // Return true to indicate that sendResponse will be called asynchronously
      return true;
    }
  }
);

// Check authentication status and return result
function checkAuth() {
  return new Promise((resolve) => {
    chrome.storage.local.get(['zecryptToken'], (result) => {
      if (result.zecryptToken) {
        resolve({ isAuthenticated: true });
      } else {
        resolve({ isAuthenticated: false });
      }
    });
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Internal message received:', message);
  
  if (message.type === 'CHECK_AUTH') {
    checkAuth().then(result => {
      console.log('Auth check result:', result);
      sendResponse(result);
    });
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