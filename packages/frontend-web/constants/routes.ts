/**
 * Application routes and API endpoints
 * 
 * This file centralizes all routes used in the application for easier maintenance
 */

// Auth routes
export const AUTH_ROUTES = {
  LOGIN: '/login',
  SIGNUP: '/signup',
  LOGOUT: '/logout',
  TWO_FACTOR_AUTH: "/2fa/verify"
};

// Dashboard routes
export const DASHBOARD_ROUTES = {
  ROOT: '/dashboard',
  ACCOUNTS: '/dashboard/accounts',
  FILES: '/dashboard/files',
  NOTIFICATIONS: '/dashboard/notifications',
  USER_SETTINGS: '/dashboard/user-settings',
  API_KEYS: '/dashboard/api-keys',
  WORKSPACE_MANAGEMENT: '/dashboard/workspace-management',
  FAVOURITES: '/dashboard/favourites',
  SHARED: '/dashboard/shared',
  RECENT: '/dashboard/recent',
  STORAGE: '/dashboard/storage',
  TEAM_MEMBERS: '/dashboard/team-members',
  SHARED_VAULTS: '/dashboard/shared-vaults',
};

// Settings routes
export const SETTINGS_ROUTES = {
  ROOT: '/settings',
};

// Other app routes
export const APP_ROUTES = {
  HOME: '/',
  SHORTCUTS: '/shortcuts',
  TERMS: '/terms',
};

// API routes
export const API_ROUTES = {
  // Auth API endpoints
  AUTH: {
    LOGIN: '/login',
    SIGNUP: '/signup',
    LOAD_INITIAL_DATA: '/load-initial-data',
  },
  
  // User API endpoints
  USER: {
    LOGIN_HISTORY: '/login-history',
    PROFILE: '/profile',
  },
  
  // Workspace API endpoints
  WORKSPACE: {
    PROJECTS: (workspaceId: string) => `/${workspaceId}/projects`,
    PROJECT_DETAILS: (workspaceId: string, projectId: string) => `/${workspaceId}/projects/${projectId}`,
  },

  // Wallet API endpoints
  WALLET: {
    PASSPHRASES: {
      LIST: (workspaceId: string, projectId: string) => `/${workspaceId}/${projectId}/wallet-phrases`,
      CREATE: (workspaceId: string, projectId: string) => `/${workspaceId}/${projectId}/wallet-phrases`,
      UPDATE: (workspaceId: string, projectId: string, walletId: string) => 
        `/${workspaceId}/${projectId}/wallet-phrases/${walletId}`,
      DELETE: (workspaceId: string, projectId: string, walletId: string) => 
        `/${workspaceId}/${projectId}/wallet-phrases/${walletId}`,
    }
  },
};

// Function to get a localized route path
export const getLocalizedRoute = (locale: string, route: string): string => {
  // Remove leading slash if it exists for consistent formatting
  const formattedRoute = route.startsWith('/') ? route : `/${route}`;
  return `/${locale}${formattedRoute}`;
};
