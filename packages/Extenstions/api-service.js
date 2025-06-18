// Base API URL
const API_BASE_URL = 'https://preview.api.zecrypt.io';

// API endpoints
const ENDPOINTS = {
  cards: (workspaceId, projectId) => `/api/v1/web/${workspaceId}/${projectId}/cards`,
  emails: (workspaceId, projectId) => `/api/v1/web/${workspaceId}/${projectId}/emails`,
  userData: '/api/v1/web/user/me' // Endpoint to get user data including workspace and project info
};

// Get stored token and user data
async function getAuthData() {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId'], (result) => {
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

// Fetch and store user data (workspace and project info)
async function fetchAndStoreUserData(token) {
  try {
    const response = await fetch(`${API_BASE_URL}${ENDPOINTS.userData}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.status}`);
    }
    
    const userData = await response.json();
    
    // Store default workspace and project IDs
    // Assuming the API returns active workspace and project information
    if (userData.active_workspace && userData.active_project) {
      chrome.storage.local.set({
        zecryptWorkspaceId: userData.active_workspace.id,
        zecryptProjectId: userData.active_project.id
      });
      
      return {
        workspaceId: userData.active_workspace.id,
        projectId: userData.active_project.id
      };
    } else {
      throw new Error('User data does not contain workspace or project information');
    }
  } catch (error) {
    console.error('Error fetching user data:', error);
    throw error;
  }
}

// Make authenticated API request
async function apiRequest(endpoint, method = 'GET', data = null) {
  try {
    const authData = await getAuthData();
    
    if (!authData.workspaceId || !authData.projectId) {
      // If we don't have workspace or project IDs, try to fetch them
      const userData = await fetchAndStoreUserData(authData.token);
      authData.workspaceId = userData.workspaceId;
      authData.projectId = userData.projectId;
    }
    
    // If endpoint is a function (for parameterized endpoints), call it with workspace and project IDs
    const resolvedEndpoint = typeof endpoint === 'function' 
      ? endpoint(authData.workspaceId, authData.projectId)
      : endpoint;
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${authData.token}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE_URL}${resolvedEndpoint}`, options);
    
    if (!response.ok) {
      // Handle token expiration or other auth errors
      if (response.status === 401) {
        chrome.storage.local.remove(['zecryptToken', 'zecryptWorkspaceId', 'zecryptProjectId']);
        chrome.runtime.sendMessage({ type: 'AUTH_STATUS', isAuthenticated: false });
        throw new Error('Authentication failed. Please log in again.');
      }
      
      throw new Error(`API request failed with status ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Fetch all cards
async function getCards() {
  try {
    const response = await apiRequest(ENDPOINTS.cards);
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Fetch all emails
async function getEmails() {
  try {
    const response = await apiRequest(ENDPOINTS.emails);
    return {
      success: true,
      data: response.data || []
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// Export API functions for use in background script
const ApiService = {
  getCards,
  getEmails,
  fetchAndStoreUserData
};

// Make it accessible to other scripts
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
} else {
  // For service workers/background scripts
  self.ApiService = ApiService;
}

// Export for module usage
export default ApiService; 