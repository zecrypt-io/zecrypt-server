'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { hashPassword, verifyPassword } from './password-security';

interface User {
  id: string;
  email: string;
  displayName: string;
  // Stack Auth compatibility properties
  primaryEmail?: string;
  profileImageUrl?: string;
  // Stack Auth compatibility methods
  getAuthJson?: () => Promise<{ accessToken: string | null }>;
}

interface MasterPasswordAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPasswordSet: boolean;
  setupMasterPassword: (password: string) => Promise<void>;
  authenticateWithPassword: (password: string) => Promise<boolean>;
  changeMasterPassword: (currentPassword: string, newPassword: string) => Promise<boolean>;
  signOut: () => Promise<void>;
  clearAllSessions: () => Promise<void>;
  clearExpiredSessions: () => Promise<void>;
}

const MasterPasswordAuthContext = createContext<MasterPasswordAuthContextType | undefined>(undefined);

export function MasterPasswordAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);

  const clearExpiredSessions = async () => {
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();
      
      // Only clear expired sessions, not all sessions
      const sessionRows = await db.select('SELECT value FROM settings WHERE key = $1', ['auth_session']);
      if (sessionRows && sessionRows.length > 0) {
        const sessionTime = parseInt(sessionRows[0].value);
        const currentTime = Date.now();
        const sessionAge = currentTime - sessionTime;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        
        if (sessionAge >= maxSessionAge) {
          await db.execute('DELETE FROM settings WHERE key = $1', ['auth_session']);
          setUser(null);
          setIsAuthenticated(false);
        }
      }
    } catch (error) {
      console.error('Error clearing expired sessions:', error);
    }
  };

  useEffect(() => {
    // Check if master password is set and if user is authenticated
    const initializeAuth = async () => {
      await clearExpiredSessions(); // Clear expired sessions first
      await checkAuthStatus(); // Then check auth status
    };
    initializeAuth();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();
      
      // Check if master password is set
      const passwordRows = await db.select('SELECT value FROM settings WHERE key = $1', ['master_password_hash']);
      const passwordExists = passwordRows && passwordRows.length > 0;
      setHasPasswordSet(passwordExists);

      // Check if user is authenticated (session) - session should be recent (within 24 hours)
      const sessionRows = await db.select('SELECT value FROM settings WHERE key = $1', ['auth_session']);
      const hasActiveSession = sessionRows && sessionRows.length > 0;
      let sessionValid = false;
      
      if (hasActiveSession) {
        const sessionTime = parseInt(sessionRows[0].value);
        const currentTime = Date.now();
        const sessionAge = currentTime - sessionTime;
        const maxSessionAge = 24 * 60 * 60 * 1000; // 24 hours
        sessionValid = sessionAge < maxSessionAge;
        
        // If session is expired, clean it up
        if (!sessionValid) {
          await db.execute('DELETE FROM settings WHERE key = $1', ['auth_session']);
        }
      }

      if (passwordExists && sessionValid) {
        // Load user data
        const userRows = await db.select('SELECT value FROM settings WHERE key = $1', ['zecrypt_user']);
        if (userRows && userRows.length > 0) {
          const userData = JSON.parse(userRows[0].value);
          // Add compatibility method if not present
          userData.getAuthJson = async () => ({ accessToken: null });
          setUser(userData);
          setIsAuthenticated(true);
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const setupMasterPassword = async (password: string) => {
    setIsLoading(true);
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();

      // Hash the password
      const hashedPassword = await hashPassword(password);

      // Store the hashed password
      await db.execute(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['master_password_hash', hashedPassword]
      );

      // Create default user with Stack Auth compatibility
      const defaultUser: User = {
        id: 'local-user-' + Date.now(),
        email: 'user@zecrypt.local',
        displayName: 'Zecrypt User',
        primaryEmail: 'user@zecrypt.local',
        profileImageUrl: '/placeholder.svg?height=128&width=128',
        getAuthJson: async () => ({ accessToken: null })
      };

      // Store user data
      await db.execute(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['zecrypt_user', JSON.stringify(defaultUser)]
      );

      // Create active session
      await db.execute(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['auth_session', Date.now().toString()]
      );

      setUser(defaultUser);
      setIsAuthenticated(true);
      setHasPasswordSet(true);
    } catch (error) {
      console.error('Error setting up master password:', error);
      throw new Error('Failed to setup master password');
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithPassword = async (password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();

      // Get stored password hash
      const passwordRows = await db.select('SELECT value FROM settings WHERE key = $1', ['master_password_hash']);
      if (!passwordRows || passwordRows.length === 0) {
        throw new Error('No master password set');
      }

      const storedHash = passwordRows[0].value;

      // Verify password
      const isValid = await verifyPassword(password, storedHash);
      
      if (isValid) {
        // Load user data
        const userRows = await db.select('SELECT value FROM settings WHERE key = $1', ['zecrypt_user']);
        if (userRows && userRows.length > 0) {
          const userData = JSON.parse(userRows[0].value);
          // Add compatibility method if not present
          userData.getAuthJson = async () => ({ accessToken: null });
          setUser(userData);
          setIsAuthenticated(true);

          // Create active session
          await db.execute(
            'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
            ['auth_session', Date.now().toString()]
          );
        }
      }

      return isValid;
    } catch (error) {
      console.error('Error authenticating:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const changeMasterPassword = async (currentPassword: string, newPassword: string): Promise<boolean> => {
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();

      // Get current password hash
      const passwordRows = await db.select('SELECT value FROM settings WHERE key = $1', ['master_password_hash']);
      if (!passwordRows || passwordRows.length === 0) {
        return false;
      }

      const currentHash = passwordRows[0].value;

      // Verify current password
      const isCurrentValid = await verifyPassword(currentPassword, currentHash);
      if (!isCurrentValid) {
        return false;
      }

      // Hash new password
      const newHash = await hashPassword(newPassword);

      // Update password hash
      await db.execute(
        'INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
        ['master_password_hash', newHash]
      );

      return true;
    } catch (error) {
      console.error('Error changing master password:', error);
      return false;
    }
  };

  const signOut = async () => {
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();
      
      // Remove active session
      await db.execute('DELETE FROM settings WHERE key = $1', ['auth_session']);
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const clearAllSessions = async () => {
    try {
      const { getDb } = await import('./sqlite');
      const db = await getDb();
      
      // Remove all authentication-related data except password hash
      await db.execute('DELETE FROM settings WHERE key IN ($1, $2)', ['auth_session', 'zecrypt_user']);
      
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error clearing sessions:', error);
    }
  };

  return (
    <MasterPasswordAuthContext.Provider 
      value={{ 
        user, 
        isLoading, 
        isAuthenticated, 
        hasPasswordSet, 
        setupMasterPassword, 
        authenticateWithPassword, 
        changeMasterPassword, 
        signOut,
        clearAllSessions,
        clearExpiredSessions 
      }}
    >
      {children}
    </MasterPasswordAuthContext.Provider>
  );
}

export function useMasterPasswordAuth() {
  const context = useContext(MasterPasswordAuthContext);
  if (context === undefined) {
    throw new Error('useMasterPasswordAuth must be used within a MasterPasswordAuthProvider');
  }
  return context;
}

// Compatibility exports to replace existing auth
export const useUser = () => {
  const { user } = useMasterPasswordAuth();
  return user;
};

export const useAuth = () => {
  const context = useMasterPasswordAuth();
  return {
    user: context.user,
    isLoading: context.isLoading,
    signIn: async (email: string, password: string) => {
      // For compatibility - this will be handled by the master password flow
      return context.authenticateWithPassword(password);
    },
    signUp: async (email: string, password: string, displayName?: string) => {
      // For compatibility - setup master password
      await context.setupMasterPassword(password);
    },
    signOut: context.signOut
  };
};
