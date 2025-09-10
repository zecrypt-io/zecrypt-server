'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { TauriVault, VaultStatus, VaultError, InvalidPasswordError, VaultNotInitializedError } from './tauri-vault';
import { settingsGet, settingsSet, settingsDelete } from './tauri-settings'

interface User {
  id: string;
  email: string;
  displayName?: string;
  getAuthJson?: () => Promise<{ accessToken: string | null }>;
}

interface TauriMasterPasswordAuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasPasswordSet: boolean;
  vaultStatus: VaultStatus | null;
  isVaultUnlocked: boolean;
  setupMasterPassword: (password: string) => Promise<void>;
  authenticateWithMasterPassword: (password: string) => Promise<void>;
  lockVault: () => Promise<void>;
  logout: () => Promise<void>;
  changeMasterPassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshVaultStatus: () => Promise<void>;
  clearExpiredSessions: () => Promise<void>;
}

const TauriMasterPasswordAuthContext = createContext<TauriMasterPasswordAuthContextType | undefined>(undefined);

export function TauriMasterPasswordAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasPasswordSet, setHasPasswordSet] = useState(false);
  const [vaultStatus, setVaultStatus] = useState<VaultStatus | null>(null);
  const [isVaultUnlocked, setIsVaultUnlocked] = useState(false);

  const refreshVaultStatus = useCallback(async () => {
    try {
      const status = await TauriVault.getStatus();
      setVaultStatus(status);
      setHasPasswordSet(status.is_initialized);
      setIsVaultUnlocked(status.state === 'Unlocked');
      if (status.state === 'Unlocked' && status.is_initialized) {
        await loadUserData();
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Error refreshing vault status:', error);
      setVaultStatus(null);
      setHasPasswordSet(false);
      setIsVaultUnlocked(false);
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  const loadUserData = async () => {
    try {
      const stored = await settingsGet('zecrypt_user')
      if (stored) {
        const userData = JSON.parse(stored)
        userData.getAuthJson = async () => ({ accessToken: null })
        setUser(userData)
      } else {
        const defaultUser: User = {
          id: 'offline-user-' + Date.now(),
          email: 'offline@user.local',
          displayName: 'Offline User',
          getAuthJson: async () => ({ accessToken: null })
        };
        setUser(defaultUser);
        await settingsSet('zecrypt_user', JSON.stringify(defaultUser))
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const clearExpiredSessions = async () => {
    try {
      const sessionValue = await settingsGet('auth_session')
      if (sessionValue) {
        const sessionTime = parseInt(sessionValue)
        const currentTime = Date.now()
        const sessionAge = currentTime - sessionTime
        const maxSessionAge = 24 * 60 * 60 * 1000
        if (sessionAge >= maxSessionAge) {
          await settingsDelete('auth_session')
          setUser(null)
          setIsAuthenticated(false)
          await TauriVault.lock()
        }
      }
    } catch (error) {
      console.error('Error clearing expired sessions:', error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      await clearExpiredSessions();
      await refreshVaultStatus();
      setIsLoading(false);
    };
    initializeAuth();
  }, [refreshVaultStatus]);

  const setupMasterPassword = async (password: string) => {
    try {
      setIsLoading(true);
      await TauriVault.initialize(password);
      await settingsSet('auth_session', Date.now().toString())
      await refreshVaultStatus();
    } catch (error) {
      console.error('Error setting up master password:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const authenticateWithMasterPassword = async (password: string) => {
    try {
      setIsLoading(true);
      await TauriVault.unlock(password);
      await settingsSet('auth_session', Date.now().toString())
      await refreshVaultStatus();
    } catch (error) {
      console.error('Error authenticating with master password:', error);
      if (error instanceof VaultError && error.message.includes('Invalid master password')) {
        throw new InvalidPasswordError('Incorrect master password');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const lockVault = async () => {
    try {
      setIsLoading(true);
      await TauriVault.lock();
      await settingsDelete('auth_session')
      setUser(null);
      setIsAuthenticated(false);
      await refreshVaultStatus();
    } catch (error) {
      console.error('Error locking vault:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      setIsLoading(true);
      await TauriVault.lock();
      await settingsDelete('auth_session')
      await settingsDelete('zecrypt_user')
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
      setUser(null);
      setIsAuthenticated(false);
      setHasPasswordSet(false);
      setVaultStatus(null);
      setIsVaultUnlocked(false);
    } catch (error) {
      console.error('Error during logout:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const changeMasterPassword = async (currentPassword: string, newPassword: string) => {
    try {
      setIsLoading(true);
      await TauriVault.changeMasterPassword(currentPassword, newPassword);
      console.log('Master password changed successfully');
    } catch (error) {
      console.error('Error changing master password:', error);
      if (error instanceof VaultError && error.message.includes('Invalid master password')) {
        throw new InvalidPasswordError('Current password is incorrect');
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const contextValue: TauriMasterPasswordAuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    hasPasswordSet,
    vaultStatus,
    isVaultUnlocked,
    setupMasterPassword,
    authenticateWithMasterPassword,
    lockVault,
    logout,
    changeMasterPassword,
    refreshVaultStatus,
    clearExpiredSessions,
  };

  return (
    <TauriMasterPasswordAuthContext.Provider value={contextValue}>
      {children}
    </TauriMasterPasswordAuthContext.Provider>
  );
}

export function useTauriMasterPasswordAuth() {
  const context = useContext(TauriMasterPasswordAuthContext);
  if (context === undefined) {
    throw new Error('useTauriMasterPasswordAuth must be used within a TauriMasterPasswordAuthProvider');
  }
  return context;
}

export function useMasterPasswordAuth() {
  const tauriAuth = useTauriMasterPasswordAuth();
  return {
    user: tauriAuth.user,
    isLoading: tauriAuth.isLoading,
    isAuthenticated: tauriAuth.isAuthenticated,
    hasPasswordSet: tauriAuth.hasPasswordSet,
    setupMasterPassword: tauriAuth.setupMasterPassword,
    authenticateWithMasterPassword: tauriAuth.authenticateWithMasterPassword,
    logout: tauriAuth.logout,
    clearExpiredSessions: tauriAuth.clearExpiredSessions,
  };
}
