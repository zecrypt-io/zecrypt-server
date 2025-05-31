"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { SignIn, useUser } from "@stackframe/stack";
import { QRCodeSVG } from "qrcode.react";

// UI Components
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "./theme-toggle";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

// Icons
import { Check, Shield, Lock, Dices, Bell, Globe } from "lucide-react";

// Services & Utilities
import { stackAuthHandler } from "@/libs/stack-auth-handler";
import { setUserData } from "../libs/Redux/userSlice";
import { AppDispatch } from "../libs/Redux/store";
import { getUserKeys } from "@/libs/api-client";
import { EncryptionSetupModal } from "./encryption-setup-modal";
import { EncryptionUnlockModal } from "./encryption-unlock-modal";
import { exportKeyToString } from "@/libs/crypto-utils";
import { secureSetItem, secureGetItem } from '@/libs/session-storage-utils';

export interface LoginPageProps {
  locale?: string;
}

export function LoginPage({ locale = "en" }: LoginPageProps) {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const t = useTranslations("auth");
  const features = useTranslations("features");
  const user = useUser();
  
  // State management
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [showKeySetupModal, setShowKeySetupModal] = useState(false);
  const [showKeyUnlockModal, setShowKeyUnlockModal] = useState(false);
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(200);
  const [encryptedPrivateKey, setEncryptedPrivateKey] = useState<string>("");
  const [publicKeyString, setPublicKeyString] = useState<string>("");
  const [hasExistingKeys, setHasExistingKeys] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(true);
  const [isAuthFlowComplete, setIsAuthFlowComplete] = useState(false);
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  // Generate or load device ID
  useEffect(() => {
    // Get or create device ID
    const storedDeviceId = localStorage.getItem("zecrypt_device_id");
    if (storedDeviceId) {
      setDeviceId(storedDeviceId);
    } else {
      const newDeviceId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        const r = (Math.random() * 16) | 0,
          v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      });
      localStorage.setItem("zecrypt_device_id", newDeviceId);
      setDeviceId(newDeviceId);
    }

    // Adjust QR code size based on screen size
    const handleResize = () => {
      setQrSize(window.innerWidth < 768 ? 180 : 240);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Check for existing keys in session storage
  useEffect(() => {
    const checkExistingKeys = async () => {
      try {
        const privateKeyInSession = await secureGetItem("privateKey");
        const publicKeyInSession = await secureGetItem("publicKey");
        
        if (privateKeyInSession && publicKeyInSession) {
          console.log("Found existing encryption keys in session storage");
          setHasExistingKeys(true);
        } else {
          setHasExistingKeys(false);
        }
      } catch (error) {
        console.error("Error checking existing keys:", error);
        setHasExistingKeys(false);
      }
    };
    
    checkExistingKeys();
  }, []);

  // Function to check for encryption keys
  const checkForEncryptionKeys = async () => {
    setIsCheckingKeys(true);
    try {
      // Check if keys already exist in session storage
      const privateKeyInSession = await secureGetItem("privateKey");
      const publicKeyInSession = await secureGetItem("publicKey");
      
      // If both keys already exist in session storage, proceed to dashboard
      if (privateKeyInSession && publicKeyInSession) {
        console.log("Encryption keys found in session storage, proceeding to dashboard");
        proceedToDashboard();
        return;
      }
      
      // If keys aren't in session storage, check the API
      const keysResponse = await getUserKeys();
      
      if (keysResponse.status_code === 200) {
        if (!keysResponse.data || (!keysResponse.data.key && !keysResponse.data.public_key)) {
          // No keys found on server, show setup modal
          console.log("No encryption keys found on server, showing setup modal");
          setShowKeySetupModal(true);
        } else {
          // Keys exist on server
          const encryptedKey = keysResponse.data.key; // This is the encrypted private key
          const publicKey = keysResponse.data.public_key;
          
          // Store public key in localStorage for future use
          if (publicKey) {
            localStorage.setItem("userPublicKey", publicKey);
          }
          
          if (encryptedKey && publicKey) {
            // Need to decrypt the private key - show unlock modal
            setEncryptedPrivateKey(encryptedKey);
            setPublicKeyString(publicKey);
            setShowKeyUnlockModal(true);
          } else {
            // One or both keys are missing
            console.log("Incomplete key data received from server, showing setup modal");
            setShowKeySetupModal(true);
          }
        }
      } else {
        throw new Error(keysResponse.message || t("failed_encryption_keys"));
      }
    } catch (err) {
      console.error("Error checking encryption keys:", err);
      toast({
        title: t("encryption_key_check_failed"),
        description: t("encryption_key_check_failed_desc"),
        variant: "destructive",
      });
      setError(t("encryption_security_error"));
      dispatch(
        setUserData({
          user_id: null,
          name: null,
          profile_url: null,
          email: null,
          access_token: null,
          refresh_token: null,
          locale: locale || "en",
          is_2fa_enabled: false,
        })
      );
    } finally {
      setIsCheckingKeys(false);
    }
  };

  // Proceed to dashboard after all checks are complete
  const proceedToDashboard = () => {
    router.push(`/${locale}/dashboard`);
  };

  // Handle successful key setup
  const handleKeySetupComplete = () => {
    setShowKeySetupModal(false);
    proceedToDashboard();
  };

  // Handle successful key unlock
  const handleKeyUnlock = async (privateKeyObj: CryptoKey, publicKeyObj: CryptoKey) => {
    try {
      // Export keys to string format for storage
      const privateKeyString = await exportKeyToString(privateKeyObj, 'private');
      const publicKeyString = await exportKeyToString(publicKeyObj, 'public');
      
      // Store keys in session storage for use in this session
      await secureSetItem("privateKey", privateKeyString);
      await secureSetItem("publicKey", publicKeyString);
      
      setShowKeyUnlockModal(false);
      proceedToDashboard();
    } catch (error) {
      console.error("Error exporting keys:", error);
      toast({
        title: t("error"),
        description: t("encryption_security_error"),
        variant: "destructive"
      });
    }
  };

  const handleStackAuth = async (token: string) => {
    try {
      const response = await stackAuthHandler(token, "login", { device_id: deviceId ?? undefined });
      if (response.status_code === 200) {
        dispatch(
          setUserData({
            user_id: response.data.user_id || null,
            name: response.data.name || user?.displayName || null,
            profile_url: response.data.profile_url || user?.profileImageUrl || null,
            email: response.data.email || user?.primaryEmail || null,
            access_token: response.data.token || null,
            refresh_token: response.data.refresh_token || null,
            locale: response.data.language || locale || "en",
            is_2fa_enabled: response.data.is_new_user === false, // Assuming is_new_user false means 2FA might be setup
          })
        );

        if (response.data.is_new_user) {
          setUserId(response.data.user_id);
          setProvisioningUri(response.data.provisioning_uri || null);
          setShow2FAModal(true);
          setIsNewUser(true);
        } else if (response.data.user_id && !response.data.token) {
          // This case implies 2FA is enabled and needs verification
          setUserId(response.data.user_id);
          setShow2FAModal(true);
          setIsNewUser(false); // Existing user, needs 2FA
        } else {
          setIsAuthFlowComplete(true);
          toast({
            title: t("login_successful"),
            description: t("checking_encryption_keys"),
          });
          await checkForEncryptionKeys();
        }
      } else {
        setError(response.message || t("login_failed"));
        setShowLoginForm(true);
      }
    } catch (err: any) {
      console.error("Stack auth error:", err);
      setError(err.response?.data?.message || err.message || t("login_failed_unexpected"));
      setShowLoginForm(true);
    } finally {
      setIsProcessingAuth(false); // Ensure this is set regardless of outcome
    }
  };

  useEffect(() => {
    const authenticateUser = async () => {
      if (isLoggingIn || !deviceId) return;
      setIsLoggingIn(true);

      try {
        // Check if user is already authenticated
        if (user) {
          setShowLoginForm(false); // Hide the login form while processing
          setIsProcessingAuth(true); // Set processing state to true immediately
          
          // Get the auth details and handle the auth flow
          const authDetails = await user.getAuthJson();
          const accessToken = authDetails?.accessToken;
          
          if (accessToken) {
            await handleStackAuth(accessToken);
          } else {
            // If there's no access token even if user object exists,
            // it might mean the user is not fully logged in with Stack.
            // Show login form to allow them to initiate Stack login.
            setShowLoginForm(true);
            setIsProcessingAuth(false); // Not processing anymore
          }
        } else {
           // No user object from useUser(), so show the login form.
          setShowLoginForm(true);
          setIsProcessingAuth(false); // Ensure this is reset
        }
      } catch (err) {
        console.error("Auth flow error:", err);
        setError(t("auth_process_failed"));
        setShowLoginForm(true); // Show login form again on error
        setIsProcessingAuth(false);
      } finally {
        setIsAuthenticating(false);
        setIsLoggingIn(false);
      }
    };

    if (deviceId) {
      authenticateUser();
    } else {
      setIsAuthenticating(false);
    }
  }, [user, deviceId, t, dispatch, locale]);

  const handle2FAVerification = async () => {
    if (!userId || verificationCode.length !== 6) {
      setError(t("2fa_invalid_code"));
      return;
    }

    setVerifying2FA(true);
    setError(null);

    try {
      const response = await stackAuthHandler("", "two_factor_auth", {
        user_id: userId,
        code: verificationCode,
        device_id: deviceId ?? undefined,
      });

      if (response.status_code === 200) {
        // Set authentication as complete and update user data
        setIsAuthFlowComplete(true);
        dispatch(
          setUserData({
            user_id: response.data.user_id || null,
            name: user?.displayName || null,
            profile_url: user?.profileImageUrl || null,
            email: user?.primaryEmail || null,
            access_token: response.data.token || null,
            refresh_token: response.data.refresh_token || null,
            locale: response.data.language || locale || "en",
            is_2fa_enabled: true,
          })
        );
        toast({
          title: t("2fa_verified"),
          description: t("checking_encryption_keys"),
        });
        setShow2FAModal(false);
        // Proceed to check for encryption keys
        await checkForEncryptionKeys();
      } else {
        setError(t("2fa_verification_failed", { message: response.message || t("invalid_code") }));
        // Automatically clear the input field on error for better UX
        setVerificationCode("");
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(t("2fa_verification_error"));
      setVerificationCode("");
    } finally {
      setVerifying2FA(false);
    }
  };

  const copyToClipboard = () => {
    if (provisioningUri) {
      navigator.clipboard.writeText(provisioningUri).then(() => {
        toast({
          title: t("copied_to_clipboard"),
          description: t("paste_in_authenticator"),
        });
      }).catch((err) => {
        console.error("Failed to copy URI:", err);
      });
    }
  };

  // Loading state
  if (isAuthenticating || isCheckingKeys || isProcessingAuth || (user && !showLoginForm && !show2FAModal && !isAuthFlowComplete)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-3"></div>
        <p className="text-sm text-muted-foreground">
          {isCheckingKeys ? t("checking_encryption_keys") : t("verifying_authentication")}
        </p>
      </div>
    );
  }

  // Error state
  if (error && !show2FAModal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="w-full max-w-md bg-card shadow-md rounded-xl overflow-hidden">
          <div className="p-4 bg-destructive/10 text-destructive border-b border-destructive/20">
            <h3 className="font-medium">{t("authentication_error")}</h3>
          </div>
          <div className="p-4">
            <p>{error}</p>
          </div>
          <div className="p-4 flex justify-end border-t border-border/30">
            <Button
              onClick={() => {
                setError(null);
                setIsAuthenticating(true);
                setShowLoginForm(true);
                if (user) {
                  window.location.reload();
                }
              }}
            >
              {t("try_again")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Encryption setup modal
  if (showKeySetupModal) {
    return (
      <EncryptionSetupModal
        isOpen={showKeySetupModal}
        onComplete={handleKeySetupComplete}
        onCancel={() => {
          // Only allow canceling if not force required
          setShowKeySetupModal(false);
          setError(t("encryption_security_error"));
        }}
      />
    );
  }

  if (showKeyUnlockModal) {
    return (
      <EncryptionUnlockModal
        isOpen={showKeyUnlockModal}
        encryptedPrivateKey={encryptedPrivateKey}
        publicKey={publicKeyString}
        onUnlock={handleKeyUnlock}
        onCancel={() => {
          setShowKeyUnlockModal(false);
          setError(t("encryption_security_error"));
        }}
      />
    );
  }

  // 2FA modal
  if (show2FAModal) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Dialog open={show2FAModal} onOpenChange={(open) => {
          if (!open && !isNewUser) {
            setShow2FAModal(false);
          }
        }}>
          <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border/30">
              <DialogTitle>{isNewUser ? t("2fa_setup") : t("2fa_verify")}</DialogTitle>
              <DialogDescription>
                {isNewUser ? t("2fa_scan") : t("2fa_enter_code")}
              </DialogDescription>
            </DialogHeader>
            <div className="px-6 py-4">
              {isNewUser && provisioningUri && (
                <div className="flex flex-col items-center mb-4">
                  <div className="bg-white p-4 rounded-lg mb-2">
                    <QRCodeSVG
                      value={provisioningUri}
                      size={qrSize}
                      level="H"
                      includeMargin={true}
                    />
                  </div>
                  <div className="text-center space-y-2 w-full">
                    <p className="text-sm text-muted-foreground">{t("2fa_scan_difficulty")}</p>
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      className="w-full"
                      size="sm"
                    >
                      {t("copy_setup_key")}
                    </Button>
                  </div>
                </div>
              )}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="verification-code" className="text-sm font-medium">
                    {t("verification_code")}
                  </label>
                  <Input
                    id="verification-code"
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, "").substring(0, 6))}
                    placeholder={t("2fa_placeholder")}
                    maxLength={6}
                    inputMode="numeric"
                    autoFocus
                    className="text-center text-xl tracking-widest"
                  />
                </div>
                {error && (
                  <div className="bg-destructive/10 text-destructive rounded p-2 text-sm">
                    {error}
                  </div>
                )}
              </div>
            </div>
            <DialogFooter className="px-6 py-4 border-t border-border/30 bg-muted/30">
              {!isNewUser && (
                <Button
                  variant="outline"
                  onClick={() => setShow2FAModal(false)}
                >
                  {t("cancel")}
                </Button>
              )}
              <Button
                onClick={handle2FAVerification}
                disabled={verificationCode.length !== 6 || verifying2FA}
                className={!isNewUser ? "ml-2" : "w-full"}
              >
                {verifying2FA ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    {t("verifying")}
                  </>
                ) : t("verify")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // Main login page
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      {/* Increased max-w for a wider card, added shadow-lg for more depth and rounded corners */}
      <div className="w-full max-w-6xl bg-card shadow-lg rounded-xl overflow-hidden dark:shadow-[0_0_20px_rgba(255,255,255,0.15)]">
        {/* Used gap-10 for more horizontal spacing between columns, items-stretch for equal column height */}
        <div className="grid md:grid-cols-2 gap-10 items-stretch">
          {/* Left side - Feature highlights and footer links */}
          {/* Increased padding, used flex-col and justify-between to push footer to bottom */}
          <div className="p-8 md:p-12 lg:p-16 bg-gradient-to-br from-background to-background/95 flex flex-col justify-between">
            {/* Adjusted spacing within the feature section */}
            <div className="space-y-5 mb-8 md:mb-12">
              {/* Adjusted heading and text size for better visual hierarchy */}
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">

                {features("trial_title")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {features("secure_password_manager")}
              </p>
            </div>
            
            <div className="space-y-4 mb-8">
              <FeatureItem icon={<Dices size={16} />} text={features("unlimited_devices")} />
              <FeatureItem icon={<Lock size={16} />} text={features("shared_vaults")} />
              <FeatureItem icon={<Shield size={16} />} text={features("advanced_security")} />
              <FeatureItem icon={<Bell size={16} />} text={features("security_alerts")} />
              <FeatureItem icon={<Globe size={16} />} text={features("multi_platform")} />
            </div>

            {/* Moved footer links to left column, adjusted layout for responsiveness and spacing */}
            <div className="mt-auto pt-6 md:pt-8 border-t border-border/30 flex flex-col sm:flex-row justify-between text-xs text-muted-foreground space-y-2 sm:space-y-0 sm:space-x-4">
              <Link href={`/${locale}/legal/privacy`} className="hover:underline">
                {t("privacy_policy")}
              </Link>
              <Link href={`/${locale}/legal/terms`} className="hover:underline">
                {t("terms_and_conditions")}
              </Link>
              {/* Service status dot as seen in the image */}
              <a href="https://zecrypt.openstatus.dev/" target="_blank" rel="noopener noreferrer" className="flex items-center hover:underline">
                 <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                 {t("service_status")}
              </a>
            </div>

          </div>
          
          {/* Right side - Login component */}
          <div className="p-6 flex items-center justify-end bg-card">
            <div className="w-full max-w-sm">
              {showLoginForm ? (
                <SignIn
                  fullPage={false}
                  automaticRedirect={false}
                  firstTab="magic-link"
                  extraInfo={
                    <div className="text-center text-xs mt-3 text-muted-foreground">
                      {t("agreement")} <Link href={`/${locale}/terms`} className="theme-accent-text hover:underline">{t("terms")}</Link>
                    </div>
                  }
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
                  <p className="text-sm text-muted-foreground">{t("authenticating")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Extracted feature item component for cleaner code
interface FeatureItemProps {
  icon: React.ReactNode;
  text: string;
}

function FeatureItem({ icon, text }: FeatureItemProps) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5 rounded-full theme-accent-bg p-1">
        {icon || <Check className="h-3.5 w-3.5 text-white" />}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}