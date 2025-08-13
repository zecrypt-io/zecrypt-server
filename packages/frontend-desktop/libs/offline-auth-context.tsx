'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, displayName?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function OfflineAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    (async () => {
      try {
        const { getDb } = await import('./sqlite')
        const db = await getDb()
        const rows = await db.select('SELECT value FROM settings WHERE key = $1', ['zecrypt_user'])
        const stored = rows?.[0]?.value
        if (stored) setUser(JSON.parse(stored))
      } catch (error) {
        console.error('Error loading stored user from sqlite:', error);
      }
    })()
    setIsLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate authentication - in a real offline app, you'd validate against local storage
      const mockUser: User = {
        id: 'offline-user-' + Date.now(),
        email,
        displayName: email.split('@')[0]
      };
      
      setUser(mockUser);
      const { getDb } = await import('./sqlite')
      const db = await getDb()
      await db.execute('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', ['zecrypt_user', JSON.stringify(mockUser)])
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error('Failed to sign in');
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, displayName?: string) => {
    setIsLoading(true);
    try {
      // Simulate user creation
      const mockUser: User = {
        id: 'offline-user-' + Date.now(),
        email,
        displayName: displayName || email.split('@')[0]
      };
      
      setUser(mockUser);
      const { getDb } = await import('./sqlite')
      const db = await getDb()
      await db.execute('INSERT INTO settings (key, value) VALUES ($1,$2) ON CONFLICT(key) DO UPDATE SET value = excluded.value', ['zecrypt_user', JSON.stringify(mockUser)])
    } catch (error) {
      console.error('Sign up error:', error);
      throw new Error('Failed to sign up');
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    setUser(null);
    const { getDb } = await import('./sqlite')
    const db = await getDb()
    await db.execute('DELETE FROM settings WHERE key = $1', ['zecrypt_user'])
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an OfflineAuthProvider');
  }
  return context;
}

// Compatibility exports to replace Stack Auth
export const useUser = () => {
  const { user } = useAuth();
  return user;
};

export const useStackApp = () => {
  // Mock Stack app functionality
  return {
    signInWithCredential: () => Promise.resolve(),
    signOut: () => Promise.resolve(),
  };
};