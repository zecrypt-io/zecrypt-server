'use client';

import { offlineDataStore } from './offline-data-store';

// Mock API responses to replace server calls
export const mockApiResponse = <T>(data: T, delay: number = 100): Promise<{ data: T }> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ data });
    }, delay);
  });
};

// Replace axios instance with offline implementations
export const offlineAxiosInstance = {
  get: async (url: string) => {
    console.log('Offline GET request to:', url);
    
    // Parse the URL to determine what data to return
    if (url.includes('/workspaces')) {
      return mockApiResponse(offlineDataStore.getWorkspaces());
    }
    
    if (url.includes('/projects')) {
      const workspaceId = extractWorkspaceId(url);
      return mockApiResponse(offlineDataStore.getProjects(workspaceId));
    }
    
    if (url.includes('/accounts') || url.includes('/wallet-phrases')) {
      const projectId = extractProjectId(url);
      if (url.includes('/wallet-phrases')) {
        return mockApiResponse(offlineDataStore.getWalletPhrases(projectId));
      } else {
        return mockApiResponse(offlineDataStore.getAccounts(projectId));
      }
    }
    
    return mockApiResponse([]);
  },
  
  post: async (url: string, data: any) => {
    console.log('Offline POST request to:', url, data);
    
    if (url.includes('/workspaces')) {
      const newWorkspace = offlineDataStore.createWorkspace(data);
      return mockApiResponse(newWorkspace);
    }
    
    if (url.includes('/projects')) {
      const newProject = offlineDataStore.createProject(data);
      return mockApiResponse(newProject);
    }
    
    if (url.includes('/accounts')) {
      const newAccount = offlineDataStore.createAccount(data);
      return mockApiResponse(newAccount);
    }
    
    if (url.includes('/wallet-phrases')) {
      const newPhrase = offlineDataStore.createWalletPhrase(data);
      return mockApiResponse(newPhrase);
    }
    
    return mockApiResponse(data);
  },
  
  put: async (url: string, data: any) => {
    console.log('Offline PUT request to:', url, data);
    
    const id = extractIdFromUrl(url);
    
    if (url.includes('/workspaces')) {
      const updated = offlineDataStore.updateWorkspace(id, data);
      return mockApiResponse(updated);
    }
    
    if (url.includes('/projects')) {
      const updated = offlineDataStore.updateProject(id, data);
      return mockApiResponse(updated);
    }
    
    if (url.includes('/accounts')) {
      const updated = offlineDataStore.updateAccount(id, data);
      return mockApiResponse(updated);
    }
    
    if (url.includes('/wallet-phrases')) {
      const updated = offlineDataStore.updateWalletPhrase(id, data);
      return mockApiResponse(updated);
    }
    
    return mockApiResponse(data);
  },
  
  delete: async (url: string) => {
    console.log('Offline DELETE request to:', url);
    
    const id = extractIdFromUrl(url);
    
    if (url.includes('/workspaces')) {
      const success = offlineDataStore.deleteWorkspace(id);
      return mockApiResponse({ success });
    }
    
    if (url.includes('/projects')) {
      const success = offlineDataStore.deleteProject(id);
      return mockApiResponse({ success });
    }
    
    if (url.includes('/accounts')) {
      const success = offlineDataStore.deleteAccount(id);
      return mockApiResponse({ success });
    }
    
    if (url.includes('/wallet-phrases')) {
      const success = offlineDataStore.deleteWalletPhrase(id);
      return mockApiResponse({ success });
    }
    
    return mockApiResponse({ success: true });
  }
};

// Helper functions to extract IDs from URLs
function extractIdFromUrl(url: string): string {
  const parts = url.split('/');
  return parts[parts.length - 1];
}

function extractWorkspaceId(url: string): string | undefined {
  const match = url.match(/\/([^\/]+)\/projects/);
  return match ? match[1] : undefined;
}

function extractProjectId(url: string): string | undefined {
  const match = url.match(/\/([^\/]+)\/(accounts|wallet-phrases)/);
  return match ? match[1] : undefined;
}

// Mock authentication responses
export const mockAuthResponse = (success: boolean = true, user?: any) => {
  if (success) {
    return mockApiResponse({
      success: true,
      user: user || {
        id: 'offline-user',
        email: 'offline@example.com',
        displayName: 'Offline User'
      },
      token: 'offline-token-' + Date.now()
    });
  } else {
    throw new Error('Authentication failed');
  }
};