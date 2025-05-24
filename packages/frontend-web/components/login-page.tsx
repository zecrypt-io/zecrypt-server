"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useTranslations } from "next-intl";
import { SignIn, useUser } from "@stackframe/stack";
import { QRCodeSVG } from "qrcode.react";
import Cookies from 'js-cookie';

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
  const [provisioningUri, setProvisioningUri] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifying2FA, setVerifying2FA] = useState(false);
  const [isCheckingKeys, setIsCheckingKeys] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [qrSize, setQrSize] = useState(200);
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

  // Function to check for encryption keys
  const checkForEncryptionKeys = async () => {
    setIsCheckingKeys(true);
    try {
      const keysResponse = await getUserKeys();
      
      if (keysResponse.status_code === 200) {
        if (keysResponse.data.key === null) {
          setShowKeySetupModal(true);
        } else {
          // Force navigation to dashboard
          window.location.href = `/${locale}/dashboard`;
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

  // Handle successful key setup
  const handleKeySetupComplete = () => {
    setShowKeySetupModal(false);
    // Force navigation to dashboard
    window.location.href = `/${locale}/dashboard`;
  };

  // Handle Stack Auth login flow
  const handleStackAuth = async (accessToken: string) => {
    if (!accessToken || !deviceId) return;
    
    try {
      setError(null);
      const loginResponse = await stackAuthHandler(accessToken, "login", { device_id: deviceId });

      if (loginResponse?.status_code === 200) {
        if (loginResponse.data.token) {
          // Store access token in cookie
          Cookies.set('access_token', loginResponse.data.token, { 
            expires: 7, // 7 days
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict'
          });

          dispatch(
            setUserData({
              user_id: loginResponse.data.user_id || null,
              name: loginResponse.data.name || user?.displayName || null,
              profile_url: loginResponse.data.profile_url || user?.profileImageUrl || null,
              email: user?.primaryEmail || null,
              access_token: loginResponse.data.token || null,
              refresh_token: loginResponse.data.refresh_token || null,
              locale: loginResponse.data.language || locale || "en",
              is_2fa_enabled: true,
            })
          );
          toast({
            title: t("login_successful"),
            description: t("checking_encryption_keys"),
          });
          await checkForEncryptionKeys();
          return;
        }

        setUserId(loginResponse.data.user_id || null);
        setIsNewUser(loginResponse.data.is_new_user || false);
        setProvisioningUri(loginResponse.data.provisioning_uri || null);
        setShow2FAModal(true);
        
        if (loginResponse.data.is_new_user) {
          toast({
            title: t("2fa_setup_required"),
            description: t("scan_qr_with_authenticator"),
          });
        }
        return;
      }

      setError(`${t("login_failed")}: ${loginResponse?.message || t("unknown_error")}`);
    } catch (authErr) {
      console.error("Auth request error:", authErr);
      setError(t("auth_network_error"));
    } finally {
      setIsProcessingAuth(false);
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
          }
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

      if (response.status_code === 200 && response.data.token) {
        // Store access token in cookie
        Cookies.set('access_token', response.data.token, { 
          expires: 7, // 7 days
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict'
        });

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
        onCancel={() => window.location.href = `/${locale}/dashboard`}
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
    <div className="min-h-screen flex items-center justify-center bg-background p-0">
      <div className="w-full max-w-6xl h-[90vh] bg-card shadow-md rounded-xl overflow-hidden flex flex-row">
        {/* Left side - Info and features */}
        <div className="flex flex-col justify-between w-[55%] p-12 border-r border-border/30">
          <div>
            <h1 className="text-3xl font-bold mb-4">{features("trial_title")}</h1>
            <p className="text-lg text-muted-foreground mb-8">{features("secure_password_manager")}</p>
            <div className="mb-8">
              <ul className="list-disc pl-5 space-y-2 text-base text-foreground">
                <li>{features("unlimited_devices")}</li>
                <li>{features("shared_vaults")}</li>
                <li>{features("advanced_security")}</li>
                <li>{features("security_alerts")}</li>
                <li>{features("multi_platform")}</li>
              </ul>
            </div>
          </div>
          <div className="flex flex-row gap-6 text-xs text-muted-foreground pt-8 border-t border-border/30">
            <Link href={`/${locale}/privacy-policy`} className="hover:underline">Privacy Policy</Link>
            <Link href={`/${locale}/terms`} className="hover:underline">Terms & Conditions</Link>
            <span className="text-green-600 font-medium">Service Status</span>
          </div>
        </div>
        {/* Right side - Login form */}
        <div className="flex flex-col justify-center items-center w-[45%] p-12">
          <div className="w-full max-w-md">
            {showLoginForm ? (
              <SignIn
                fullPage={false}
                automaticRedirect={false}
                firstTab="password"
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
  );
}