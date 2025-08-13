"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
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
import { useTranslations } from "@/libs/intl-shim";
import { 
  importKeyFromString, 
  deriveKeyFromPassword,
  decryptWithDerivedKey,
  extractEncryptedComponents
} from "@/libs/crypto-utils";
import { toast } from "@/components/ui/use-toast";
import { clearUserData } from "@/libs/Redux/userSlice";
import { logout } from "@/libs/utils";
import { SignIn } from "@stackframe/stack";

interface EncryptionUnlockModalProps {
  isOpen: boolean;
  encryptedPrivateKey: string; // This is the combined salt.iv.encryptedKey string
  publicKey: string; // This is the raw Base64 public key string
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
  const router = useRouter();
  const dispatch = useDispatch();
  
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleCancel = () => {
    // Clear Redux state
    dispatch(clearUserData());
    
    // Clear settings in SQLite and sessionStorage
    ;(async () => {
      try {
        const { getDb } = await import('@/libs/sqlite')
        const db = await getDb()
        await db.execute('DELETE FROM settings')
      } catch {}
    })()
    sessionStorage.clear();
    
    // Clear cookies
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });

    // Force reload the page to reset Stack auth and show initial login
    window.location.href = "/login";
  };
  
  const handleUnlock = async () => {
    console.log("[UnlockModal] Attempting to unlock...");
    console.log("[UnlockModal] Received encryptedPrivateKey (combined):", encryptedPrivateKey);
    console.log("[UnlockModal] Received publicKey (raw Base64):", publicKey);

    if (!password) {
      setError(tAuth("enter_encryption_password"));
      console.warn("[UnlockModal] No password entered.");
      return;
    }
    
    setError(null);
    setIsUnlocking(true);
    
    try {
      console.log("[UnlockModal] Step 1: Extracting components from encryptedPrivateKey...");
      const { salt, iv, encryptedData } = extractEncryptedComponents(encryptedPrivateKey);
      console.log("[UnlockModal] Extracted salt (Base64):", salt);
      console.log("[UnlockModal] Extracted iv (Base64):", iv);
      console.log("[UnlockModal] Extracted encryptedData (Base64):", encryptedData);
      
      console.log("[UnlockModal] Step 2: Converting salt from Base64 to Uint8Array...");
      const saltBinaryString = atob(salt);
      const saltBytes = new Uint8Array(saltBinaryString.length);
      for (let i = 0; i < saltBinaryString.length; i++) {
        saltBytes[i] = saltBinaryString.charCodeAt(i);
      }
      console.log("[UnlockModal] Salt converted to Uint8Array (length):", saltBytes.length);
      
      console.log("[UnlockModal] Step 3: Deriving key from password with extracted salt...");
      const derivedKey = await deriveKeyFromPassword(password, saltBytes);
      console.log("[UnlockModal] Derived key from password successfully (CryptoKey object).", derivedKey);
      
      console.log("[UnlockModal] Step 4: Decrypting private key string...");
      const privateKeyString = await decryptWithDerivedKey(
        encryptedData,
        iv,
        derivedKey
      );
      console.log("[UnlockModal] Decrypted privateKeyString (should be Base64 PKCS8):", privateKeyString);
      
      console.log("[UnlockModal] Step 5: Importing public and private keys...");
      
      let publicKeyObj: CryptoKey;
      try {
        console.log("[UnlockModal] Importing publicKey (raw Base64):", publicKey);
        publicKeyObj = await importKeyFromString(publicKey, 'public', 'encrypt');
        console.log("[UnlockModal] Imported publicKey successfully (CryptoKey object).", publicKeyObj);
      } catch (pubKeyImportError: any) {
        console.error("[UnlockModal] Error importing public key:", pubKeyImportError);
        console.error("[UnlockModal] Public key string that failed import:", publicKey);
        throw new Error(`Public key import failed: ${pubKeyImportError.message}`);
      }
      
      let privateKeyObj: CryptoKey;
      try {
        console.log("[UnlockModal] Importing privateKeyString (Base64 PKCS8):", privateKeyString);
        privateKeyObj = await importKeyFromString(privateKeyString, 'private', 'decrypt');
        console.log("[UnlockModal] Imported privateKey successfully (CryptoKey object).", privateKeyObj);
      } catch (privKeyImportError: any) {
        console.error("[UnlockModal] Error importing private key:", privKeyImportError);
        console.error("[UnlockModal] Private key string that failed import:", privateKeyString);
        throw new Error(`Private key import failed: ${privKeyImportError.message}`);
      }
      
      console.log("[UnlockModal] Unlock successful, invoking onUnlock callback.");
      onUnlock(privateKeyObj, publicKeyObj);
      
      toast({
        title: tAuth("encryption_unlocked"),
        description: tAuth("encryption_key_decrypted"),
      });
    } catch (err: any) {
      console.error("[UnlockModal] Error during unlock process:", err);
      setError(tAuth("incorrect_encryption_password")); // Generic error for user
    } finally {
      setIsUnlocking(false);
      console.log("[UnlockModal] Unlock process finished.");
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={() => handleCancel()}>
      <DialogContent 
        className="sm:max-w-md [&>button]:hidden"
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
            <Button variant="outline" onClick={handleCancel} disabled={isUnlocking}>
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