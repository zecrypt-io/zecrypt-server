'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Check, X, AlertCircle } from 'lucide-react';
import { validatePasswordStrength, getPasswordStrengthScore, getPasswordStrengthLabel, getPasswordStrengthColor } from '@/libs/password-security';
import { useMasterPasswordAuth } from '@/libs/master-password-auth';

interface ChangeMasterPasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ChangeMasterPasswordDialog({ isOpen, onClose }: ChangeMasterPasswordDialogProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { changeMasterPassword } = useMasterPasswordAuth();

  const passwordValidation = validatePasswordStrength(newPassword);
  const strengthScore = getPasswordStrengthScore(newPassword);
  const strengthLabel = getPasswordStrengthLabel(strengthScore);
  const strengthColor = getPasswordStrengthColor(strengthScore);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword && passwordValidation.isValid && passwordsMatch && newPassword.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canSubmit) {
      return;
    }

    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      const result = await changeMasterPassword(currentPassword, newPassword);
      
      if (result) {
        setSuccess(true);
        // Clear form
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setSuccess(false);
          onClose();
        }, 2000);
      } else {
        setError('Current password is incorrect. Please try again.');
      }
    } catch (err) {
      setError('Failed to change master password. Please try again.');
      console.error('Password change error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess(false);
      onClose();
    }
  };

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Password Changed Successfully</DialogTitle>
            <DialogDescription>
              Your master password has been updated successfully.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-8">
            <div className="rounded-full bg-green-100 dark:bg-green-900/20 p-4">
              <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Change Master Password</DialogTitle>
          <DialogDescription>
            Enter your current password and choose a new master password.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3 border border-red-200 dark:border-red-800">
              <div className="flex">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <div className="ml-2">
                  <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="currentPassword">Current Password</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Enter your current master password"
                className="pr-10"
                disabled={isLoading}
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                disabled={isLoading}
              >
                {showCurrentPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPassword">New Password</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter your new master password"
                className="pr-10"
                disabled={isLoading}
                autoComplete="new-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
                disabled={isLoading}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
            
            {newPassword && (
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

            {newPassword && !passwordValidation.isValid && (
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your new master password"
                className="pr-10"
                disabled={isLoading}
                autoComplete="new-password"
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

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
