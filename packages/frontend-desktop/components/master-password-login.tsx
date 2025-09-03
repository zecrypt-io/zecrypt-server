'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react';
import { useMasterPasswordAuth } from '@/libs/master-password-auth';

interface MasterPasswordLoginProps {
  onSuccess: () => void;
}

export function MasterPasswordLogin({ onSuccess }: MasterPasswordLoginProps) {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [attemptCount, setAttemptCount] = useState(0);

  const { authenticateWithPassword } = useMasterPasswordAuth();

  // Focus password input on mount
  useEffect(() => {
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
      passwordInput.focus();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setError('Please enter your master password');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const isValid = await authenticateWithPassword(password);
      
      if (isValid) {
        onSuccess();
      } else {
        setAttemptCount(prev => prev + 1);
        setError('Incorrect master password. Please try again.');
        setPassword(''); // Clear password field on failed attempt
        
        // Focus password input again
        setTimeout(() => {
          const passwordInput = document.getElementById('password');
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 100);
      }
    } catch (err) {
      console.error('Authentication error:', err);
      setError('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Enter key
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome Back</CardTitle>
          <CardDescription>
            Enter your master password to unlock Zecrypt Desktop
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                    {attemptCount >= 3 && (
                      <p className="text-xs text-red-600 dark:text-red-300 mt-1">
                        Multiple failed attempts detected. Make sure you're using the correct master password.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Master Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Enter your master password"
                  className="pr-10"
                  disabled={isLoading}
                  autoComplete="current-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!password.trim() || isLoading}
            >
              {isLoading ? 'Unlocking...' : 'Unlock Zecrypt'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Forgot your master password?{' '}
                <span className="text-gray-500 dark:text-gray-500">
                  You'll need to reset the app and lose all data.
                </span>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
