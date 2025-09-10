import { invoke } from '@tauri-apps/api/core';
import { useState, useEffect, useCallback } from 'react';

/// Types for Tauri vault operations
export interface VaultStatus {
  state: 'Uninitialized' | 'Locked' | 'Unlocked';
  is_initialized: boolean;
  created_at?: number;
  version?: number;
}

export interface CommandResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface InitializeVaultRequest {
  master_password: string;
}

export interface UnlockVaultRequest {
  master_password: string;
}

export interface ChangeMasterPasswordRequest {
  current_password: string;
  new_password: string;
}

/// Tauri Vault API client
export class TauriVault {
  /// Gets the current vault status
  static async getStatus(): Promise<VaultStatus> {
    const result: CommandResult<VaultStatus> = await invoke('get_vault_status');
    if (!result.success) {
      throw new Error(result.error || 'Failed to get vault status');
    }
    return result.data!;
  }

  /// Initializes a new vault with the given master password
  static async initialize(masterPassword: string): Promise<VaultStatus> {
    const result: CommandResult<VaultStatus> = await invoke('initialize_vault', {
      request: { master_password: masterPassword }
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to initialize vault');
    }
    return result.data!;
  }

  /// Unlocks the vault with the given master password
  static async unlock(masterPassword: string): Promise<VaultStatus> {
    const result: CommandResult<VaultStatus> = await invoke('unlock_vault', {
      request: { master_password: masterPassword }
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to unlock vault');
    }
    return result.data!;
  }

  /// Locks the vault
  static async lock(): Promise<VaultStatus> {
    const result: CommandResult<VaultStatus> = await invoke('lock_vault');
    if (!result.success) {
      throw new Error(result.error || 'Failed to lock vault');
    }
    return result.data!;
  }

  /// Changes the master password
  static async changeMasterPassword(currentPassword: string, newPassword: string): Promise<void> {
    const result: CommandResult<void> = await invoke('change_master_password', {
      request: {
        current_password: currentPassword,
        new_password: newPassword
      }
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to change master password');
    }
  }

  /// Checks if the vault is unlocked
  static async isUnlocked(): Promise<boolean> {
    const result: CommandResult<boolean> = await invoke('is_vault_unlocked');
    if (!result.success) {
      throw new Error(result.error || 'Failed to check vault status');
    }
    return result.data!;
  }

  /// Validates a master password (client-side validation)
  static async validateMasterPassword(password: string): Promise<boolean> {
    const result: CommandResult<boolean> = await invoke('validate_master_password', {
      password
    });
    if (!result.success) {
      throw new Error(result.error || 'Failed to validate password');
    }
    return result.data!;
  }

  /// Performs a health check on the vault system
  static async healthCheck(): Promise<string> {
    const result: CommandResult<string> = await invoke('vault_health_check');
    if (!result.success) {
      throw new Error(result.error || 'Health check failed');
    }
    return result.data!;
  }

  /// Emergency vault shutdown
  static async emergencyShutdown(): Promise<void> {
    const result: CommandResult<void> = await invoke('emergency_vault_shutdown');
    if (!result.success) {
      throw new Error(result.error || 'Emergency shutdown failed');
    }
  }

  /// Test encryption system (debug only)
  static async testEncryption(): Promise<string> {
    const result: CommandResult<string> = await invoke('test_encryption');
    if (!result.success) {
      throw new Error(result.error || 'Encryption test failed');
    }
    return result.data!;
  }

  /// Gets debug information about the vault (debug only)
  static async getDebugInfo(): Promise<any> {
    const result: CommandResult<any> = await invoke('get_vault_debug_info');
    if (!result.success) {
      throw new Error(result.error || 'Failed to get debug info');
    }
    return result.data!;
  }
}

/// Error types for vault operations
export class VaultError extends Error {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'VaultError';
  }
}

export class VaultLockError extends VaultError {
  constructor(message: string = 'Vault is locked') {
    super(message, 'VAULT_LOCKED');
    this.name = 'VaultLockError';
  }
}

export class InvalidPasswordError extends VaultError {
  constructor(message: string = 'Invalid master password') {
    super(message, 'INVALID_PASSWORD');
    this.name = 'InvalidPasswordError';
  }
}

export class VaultNotInitializedError extends VaultError {
  constructor(message: string = 'Vault is not initialized') {
    super(message, 'VAULT_NOT_INITIALIZED');
    this.name = 'VaultNotInitializedError';
  }
}

/// Utility functions for vault operations
export const VaultUtils = {
  /// Wraps vault operations with proper error handling
  async withErrorHandling<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (error instanceof Error) {
        // Map common error messages to specific error types
        if (error.message.includes('Invalid master password')) {
          throw new InvalidPasswordError(error.message);
        }
        if (error.message.includes('Vault is locked')) {
          throw new VaultLockError(error.message);
        }
        if (error.message.includes('Vault not initialized')) {
          throw new VaultNotInitializedError(error.message);
        }
      }
      throw error;
    }
  },

  /// Validates master password strength
  validatePasswordStrength(password: string): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('Password must contain at least one special character');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /// Estimates password strength
  estimatePasswordStrength(password: string): 'weak' | 'medium' | 'strong' | 'very-strong' {
    let score = 0;

    // Length score
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character diversity score
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    // Avoid common patterns
    if (!/(.)\1{2,}/.test(password)) score += 1; // No repeated characters
    if (!/123|abc|qwerty/i.test(password)) score += 1; // No common sequences

    if (score <= 2) return 'weak';
    if (score <= 4) return 'medium';
    if (score <= 6) return 'strong';
    return 'very-strong';
  }
};

/// Hook for vault status monitoring (React import needed separately)
export function useVaultStatus() {
  const [status, setStatus] = useState<VaultStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshStatus = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const vaultStatus = await TauriVault.getStatus();
      setStatus(vaultStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  return {
    status,
    loading,
    error,
    refreshStatus
  };
}

// Re-export for convenience
export { invoke } from '@tauri-apps/api/core';
