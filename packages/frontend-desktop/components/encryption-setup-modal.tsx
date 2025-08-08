"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, KeyRound, Eye, EyeOff, Lock, Download, RefreshCw } from "lucide-react";
import { useTranslations } from "@/libs/intl-shim";
import { 
  generateRsaKeyPair, 
  exportKeyToString, 
  deriveKeyFromPassword,
  encryptWithDerivedKey,
  combineEncryptedComponents
} from "@/libs/crypto-utils";
import { updateUserKeys } from "@/libs/api-client";
import { toast } from "@/components/ui/use-toast";
import { secureSetItem } from '@/libs/local-storage-utils';
import { generateStrongPassword } from "@/libs/password-utils";

interface EncryptionSetupModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onCancel?: () => void;
}

export function EncryptionSetupModal({ 
  isOpen, 
  onComplete, 
  onCancel 
}: EncryptionSetupModalProps) {
  // Use English translations as fallback if no locale is available
  const tAuth = useTranslations("auth");
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const handleGeneratePassword = () => {
    const generatedPassword = generateStrongPassword();
    setPassword(generatedPassword);
    setConfirmPassword(generatedPassword);
  };

  const handleDownloadPassword = () => {
    const element = document.createElement("a");
    const file = new Blob([`Your Zecrypt Encryption Password:\n\n${password}\n\nIMPORTANT: Keep this password safe. You will need it to access your encrypted data.`], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = "zecrypt-encryption-password.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSubmit = async () => {
    // Validate password
    if (password.length < 8) {
      setError(tAuth("password_too_short"));
      return;
    }
    
    if (password !== confirmPassword) {
      setError(tAuth("passwords_dont_match"));
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    try {
      // 1. Generate RSA key pair
      const keyPair = await generateRsaKeyPair();
      const publicKeyString = await exportKeyToString(keyPair.publicKey, 'public');
      const privateKeyString = await exportKeyToString(keyPair.privateKey, 'private');
      
      // Store raw keys in session storage
      await secureSetItem("publicKey", publicKeyString);
      await secureSetItem("privateKey", privateKeyString);
      console.log("Public and private keys stored in session storage (encrypted).");
      
      // 2. Derive encryption key from password
      const salt = window.crypto.getRandomValues(new Uint8Array(16));
      const derivedEncryptionKey = await deriveKeyFromPassword(password, salt);
      
      // 3. Encrypt the private key with the derived key
      const { encryptedData: encryptedPrivateKey, iv } = await encryptWithDerivedKey(
        privateKeyString,
        derivedEncryptionKey
      );
      
      // 4. Prepare the combined string (salt.iv.encryptedPrivateKey)
      const saltString = btoa(String.fromCharCode(...salt));
      const combinedEncryptedPrivateKey = combineEncryptedComponents(
        saltString,
        iv,
        encryptedPrivateKey
      );
      
      // 5. Send to backend and check response
      const response = await updateUserKeys({
        public_key: publicKeyString,
        private_key: combinedEncryptedPrivateKey,
      });

      if (response && response.status_code === 200) {
        toast({
          title: tAuth("encryption_setup_success"),
          description: tAuth("encryption_keys_created"),
        });
        onComplete(); // Only call onComplete if API call was successful
      } else {
        // Handle unsuccessful API response
        throw new Error(response?.message || tAuth("encryption_setup_failed"));
      }
    } catch (err: any) {
      console.error("Error setting up encryption keys:", err);
      let errorMessage = tAuth("encryption_setup_failed");
      if (err.response && err.response.data && err.response.data.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      // Do NOT call onComplete() here
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={onCancel ? () => onCancel?.() : undefined}
    >
      <DialogContent 
        className="sm:max-w-md" 
        onInteractOutside={(e: Event) => {
          // Prevent closing by clicking outside
          e.preventDefault();
        }}
        onEscapeKeyDown={(e: Event) => {
          // Prevent closing with escape key
          e.preventDefault();
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {tAuth("setup_encryption_keys")}
          </DialogTitle>
          <DialogDescription>
            {tAuth("encryption_setup_description")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <Alert className="bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900 dark:text-amber-200">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {tAuth("encryption_password_warning")}
            </AlertDescription>
          </Alert>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password" className="text-sm font-medium">
                {tAuth("encryption_password")}
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={handleGeneratePassword}
              >
                <RefreshCw className="h-4 w-4" />
                {tAuth("generate_password")}
              </Button>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth("enter_strong_password")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium">
              {tAuth("confirm_encryption_password")}
            </Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={tAuth("confirm_password")}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          {error && (
            <p className="text-sm font-medium text-destructive">{error}</p>
          )}
          
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {tAuth("encryption_password_requirements")}
            </p>
            {password && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-2"
                onClick={handleDownloadPassword}
              >
                <Download className="h-4 w-4" />
                {tAuth("download_password")}
              </Button>
            )}
          </div>
        </div>
        
        <DialogFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
              {tAuth("cancel")}
            </Button>
          )}
          <Button onClick={handleSubmit} disabled={isGenerating}>
            {isGenerating ? (
              <>
                <Lock className="mr-2 h-4 w-4 animate-pulse" />
                {tAuth("generating_keys")}
              </>
            ) : (
              tAuth("setup_encryption")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 