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
import { Eye, EyeOff, KeyRound, Unlock } from "lucide-react";
import { useTranslations } from "next-intl";
import { 
  importKeyFromString, 
  deriveKeyFromPassword,
  decryptWithDerivedKey,
  extractEncryptedComponents
} from "@/libs/crypto-utils";
import { toast } from "@/components/ui/use-toast";

interface EncryptionUnlockModalProps {
  isOpen: boolean;
  encryptedPrivateKey: string;
  publicKey: string;
  onUnlock: (privateKey: CryptoKey, publicKey: CryptoKey) => void;
  onCancel?: () => void;
}

export function EncryptionUnlockModal({
  isOpen,
  encryptedPrivateKey,
  publicKey,
  onUnlock,
  onCancel
}: EncryptionUnlockModalProps) {
  const tAuth = useTranslations("auth");
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleUnlock = async () => {
    if (!password) {
      setError(tAuth("enter_encryption_password"));
      return;
    }
    
    setError(null);
    setIsUnlocking(true);
    
    try {
      // 1. Extract components from the combined encrypted private key
      const { salt, iv, encryptedData } = extractEncryptedComponents(encryptedPrivateKey);
      
      // 2. Convert salt from base64 to Uint8Array
      const saltBinaryString = atob(salt);
      const saltBytes = new Uint8Array(saltBinaryString.length);
      for (let i = 0; i < saltBinaryString.length; i++) {
        saltBytes[i] = saltBinaryString.charCodeAt(i);
      }
      
      // 3. Derive key from password using the extracted salt
      const derivedKey = await deriveKeyFromPassword(password, saltBytes);
      
      // 4. Decrypt the private key string
      const privateKeyString = await decryptWithDerivedKey(
        encryptedData,
        iv,
        derivedKey
      );
      
      // 5. Import the public and private keys
      const publicKeyObj = await importKeyFromString(publicKey, 'public', 'encrypt');
      const privateKeyObj = await importKeyFromString(privateKeyString, 'private', 'decrypt');
      
      // Success - invoke the callback with both keys
      onUnlock(privateKeyObj, publicKeyObj);
      
      toast({
        title: tAuth("encryption_unlocked"),
        description: tAuth("encryption_key_decrypted"),
      });
    } catch (err: any) {
      console.error("Error unlocking encryption key:", err);
      setError(tAuth("incorrect_encryption_password"));
    } finally {
      setIsUnlocking(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => onCancel?.()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-primary" />
            {tAuth("unlock_encryption")}
          </DialogTitle>
          <DialogDescription>
            {tAuth("enter_encryption_password_desc")}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="unlockPassword" className="text-sm font-medium">
              {tAuth("encryption_password")}
            </Label>
            <div className="relative">
              <Input
                id="unlockPassword"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tAuth("enter_encryption_password")}
                className="pr-10"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleUnlock();
                  }
                }}
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
        </div>
        
        <DialogFooter>
          {onCancel && (
            <Button variant="outline" onClick={onCancel} disabled={isUnlocking}>
              {tAuth("cancel")}
            </Button>
          )}
          <Button onClick={handleUnlock} disabled={isUnlocking}>
            {isUnlocking ? (
              <>
                <Unlock className="mr-2 h-4 w-4 animate-pulse" />
                {tAuth("unlocking")}
              </>
            ) : (
              tAuth("unlock")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 