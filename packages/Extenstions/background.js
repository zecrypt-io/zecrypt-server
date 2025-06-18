// Import API service
importScripts('api-service.js');

// Listen for messages from the web app
chrome.runtime.onMessageExternal.addListener(
  (message, sender, sendResponse) => {
    if (message.type === 'LOGIN' && message.token) {
      // Store the token securely in chrome.storage.local
      chrome.storage.local.set({ 
        zecryptToken: message.token,
        // If workspace and project IDs are provided, store them too
        ...(message.workspaceId && { zecryptWorkspaceId: message.workspaceId }),
        ...(message.projectId && { zecryptProjectId: message.projectId })
      }, () => {
        console.log('Token stored successfully');
        
        // If workspace and project IDs weren't provided, try to fetch them
        if (!message.workspaceId || !message.projectId) {
          // Use the imported ApiService to fetch and store user data
          ApiService.fetchAndStoreUserData(message.token)
            .then(() => {
              console.log('User data fetched and stored successfully');
              sendResponse({ success: true });
            })
            .catch(error => {
              console.error('Error fetching user data:', error);
              sendResponse({ success: true }); // Still return success as token was saved
            });
        } else {
          sendResponse({ success: true });
        }
      });
      
      // Return true to indicate that sendResponse will be called asynchronously
      return true;
    }
  }
);

// Check authentication status and fetch user data if authenticated
function checkAuth() {
  chrome.storage.local.get(['zecryptToken'], (result) => {
    if (result.zecryptToken) {
      // Token exists, update UI state or notify popup
      chrome.runtime.sendMessage({ type: 'AUTH_STATUS', isAuthenticated: true });
    } else {
      // No token, user needs to log in
      chrome.runtime.sendMessage({ type: 'AUTH_STATUS', isAuthenticated: false });
    }
  });
}

// Listen for messages from popup or content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CHECK_AUTH') {
    checkAuth();
    return true;
  }
  
  // Handle logout request
  if (message.type === 'LOGOUT') {
    chrome.storage.local.remove('zecryptToken', () => {
      console.log('Token removed');
      sendResponse({ success: true });
    });
    return true;
  }
  
  // Handle data fetching requests
  if (message.type === 'FETCH_DATA') {
    if (message.dataType === 'cards') {
      ApiService.getCards()
        .then(response => {
          sendResponse(response);
        })
        .catch(error => {
          sendResponse({ success: false, error: error.message });
        });
      return true;
    }
    
    if (message.dataType === 'emails') {
      ApiService.getEmails()
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
      ApiService.getCards()
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
      ApiService.getEmails()
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
  checkAuth();
}); 