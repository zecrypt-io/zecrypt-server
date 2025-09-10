'use client';

import { TauriMasterPasswordAuthProvider, useTauriMasterPasswordAuth } from './tauri-master-password-auth'

export const MasterPasswordAuthProvider = TauriMasterPasswordAuthProvider

export function useMasterPasswordAuth() {
  return useTauriMasterPasswordAuth()
}

export const useUser = () => {
  const { user } = useTauriMasterPasswordAuth()
  return user
}

export const useAuth = () => {
  const ctx = useTauriMasterPasswordAuth()
  return {
    user: ctx.user,
    isLoading: ctx.isLoading,
    signIn: async (_email: string, password: string) => ctx.authenticateWithMasterPassword(password),
    signUp: async (_email: string, password: string, _displayName?: string) => ctx.setupMasterPassword(password),
    signOut: ctx.logout,
  }
}
