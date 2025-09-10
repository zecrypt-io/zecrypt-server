'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Eye, EyeOff, Lock, Shield, Check, X } from 'lucide-react';
import { validatePasswordStrength, getPasswordStrengthScore, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/libs/password-security';
import { useTauriMasterPasswordAuth } from '@/libs/tauri-master-password-auth';

interface MasterPasswordSetupProps {
  onComplete: () => void;
}

export function MasterPasswordSetup({ onComplete }: MasterPasswordSetupProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const { setupMasterPassword } = useTauriMasterPasswordAuth();

  const passwordValidation = validatePasswordStrength(password);
  const strengthScore = getPasswordStrengthScore(password);
  const strengthLabel = getPasswordStrengthLabel(strengthScore);
  const strengthColor = getPasswordStrengthColor(strengthScore);

  const passwordsMatch = password === confirmPassword;
  const canSubmit = passwordValidation.isValid && passwordsMatch && password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await setupMasterPassword(password);
      onComplete();
    } catch (err) {
      setError('Failed to setup master password. Please try again.');
      console.error('Setup error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Shield className="h-8 w-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-2xl font-bold">Welcome to Zecrypt Desktop</CardTitle>
          <CardDescription className="text-base">
            Create a master password to secure your password vault. This password will be required each time you open the app.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
                <div className="flex">
                  <X className="h-4 w-4 text-red-400 mt-0.5" />
                  <div className="ml-2">
                    <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
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
                  placeholder="Create a strong master password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              
              {password && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Password strength:</span>
                    <span className={`font-medium ${strengthColor}`}>{strengthLabel}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        strengthScore <= 1 ? 'bg-red-500' :
                        strengthScore === 2 ? 'bg-yellow-500' :
                        strengthScore === 3 ? 'bg-blue-500' : 'bg-green-500'
                      }`}
                      style={{ width: `${(strengthScore / 4) * 100}%` }}
                    />
                  </div>
                </div>
              )}

              {password && !passwordValidation.isValid && (
                <div className="space-y-1">
                  {passwordValidation.errors.map((error, index) => (
                    <div key={index} className="flex items-center text-sm text-red-600 dark:text-red-400">
                      <X className="h-3 w-3 mr-1" />
                      {error}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your master password"
                  className="pr-10"
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isLoading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </Button>
              </div>
              
              {confirmPassword && (
                <div className="flex items-center text-sm">
                  {passwordsMatch ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <Check className="h-3 w-3 mr-1" />
                      Passwords match
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <X className="h-3 w-3 mr-1" />
                      Passwords do not match
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
              <div className="flex">
                <Lock className="h-4 w-4 text-blue-400 mt-0.5" />
                <div className="ml-2">
                  <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">Important Security Note</h4>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Your master password cannot be recovered if forgotten. Make sure to choose a password you'll remember or store it in a secure location.
                  </p>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? 'Setting up...' : 'Create Master Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
