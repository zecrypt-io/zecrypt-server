"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { SignIn, useUser } from "@stackframe/stack";
import { stackAuthHandler } from "@/libs/stack-auth-handler";
import { useDispatch } from "react-redux";
import { setUserData } from "../libs/Redux/userSlice";
import { AppDispatch } from "../libs/Redux/store";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "@/components/ui/use-toast";
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

  // Generate or load device ID
  useEffect(() => {
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
      console.log("Keys response:", keysResponse);

      if (keysResponse.status_code === 200) {
        if (keysResponse.data.key === null) {
          // No keys found, show setup modal
          setShowKeySetupModal(true);
        } else {
          // Keys exist, proceed to dashboard
          proceedToDashboard();
        }
      } else {
        throw new Error(keysResponse.message || "Failed to check encryption keys");
      }
    } catch (err) {
      console.error("Error checking encryption keys:", err);
      // For security, DO NOT redirect to dashboard when key check fails
      // Instead, show an error to the user
      toast({
        title: t("encryption_key_check_failed"),
        description: t("encryption_key_check_failed_desc"),
        variant: "destructive"
      });
      
      // Set error state to display the error message to the user
      setError(t("encryption_security_error"));
      
      // Logout the user by clearing auth state
      // This is safer than bypassing encryption checks
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

  useEffect(() => {
    const authenticateUser = async () => {
      if (isLoggingIn || !deviceId) return;
      setIsLoggingIn(true);

      try {
        setError(null);
        const authDetails = await user?.getAuthJson();
        const accessToken = authDetails?.accessToken;
        if (!accessToken) {
          setIsAuthenticating(false);
          setIsLoggingIn(false);
          return;
        }

        try {
          const loginResponse = await stackAuthHandler(accessToken, "login", { device_id: deviceId });
          console.log("Login response:", loginResponse);

          if (loginResponse?.status_code === 200) {
            if (loginResponse.data.token) {
              // Store user data in Redux
              dispatch(
                setUserData({
                  user_id: loginResponse.data.user_id || null,
                  name: loginResponse.data.name || user?.displayName || null,
                  profile_url: loginResponse.data.profile_url || user?.profileImageUrl || null,
                  email: user?.primaryEmail || null,
                  access_token: loginResponse.data.token || null,
                  refresh_token: loginResponse.data.refresh_token || null,
                  locale: loginResponse.data.language || locale || "en", // Changed from language to locale
                  is_2fa_enabled: true,
                })
              );
              
              toast({
                title: t("login_successful"),
                description: t("checking_encryption_keys"),
              });
              
              // Check for encryption keys instead of redirecting immediately
              await checkForEncryptionKeys();
              return;
            }

            setUserId(loginResponse.data.user_id || null);
            setIsNewUser(loginResponse.data.is_new_user || false);
            setProvisioningUri(loginResponse.data.provisioning_uri || null);
            setShow2FAModal(true);
            setIsAuthenticating(false);
            setIsLoggingIn(false);
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
        }
      } catch (err) {
        console.error("Auth flow error:", err);
        setError(t("auth_process_failed"));
      } finally {
        setIsAuthenticating(false);
        setIsLoggingIn(false);
      }
    };

    if (user && deviceId) {
      authenticateUser();
    } else {
      setIsAuthenticating(false);
    }
  }, [user, dispatch, locale, deviceId, t]);

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
        // Store user data in Redux
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
        
        // Check for encryption keys instead of redirecting immediately
        await checkForEncryptionKeys();
      } else {
        setError(t("2fa_verification_failed", { message: response.message || t("invalid_code") }));
      }
    } catch (err) {
      console.error("2FA verification error:", err);
      setError(t("2fa_verification_error"));
    } finally {
      setVerifying2FA(false);
    }
  };

  const copyToClipboard = () => {
    if (provisioningUri) {
      navigator.clipboard.writeText(provisioningUri)
        .then(() => {
          toast({
            title: t("copied_to_clipboard"),
            description: t("paste_in_authenticator")
          });
        })
        .catch(err => {
          console.error("Failed to copy URI:", err);
        });
    }
  };

  if (isAuthenticating || isCheckingKeys) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">
          {isCheckingKeys ? t("checking_encryption_keys") : t("verifying_authentication")}
        </p>
      </div>
    );
  }

  if (error && !show2FAModal) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 max-w-md">
          <p className="font-semibold mb-2">{t("authentication_error")}</p>
          <p>{error}</p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setError(null);
            setIsAuthenticating(true);
            if (user) {
              window.location.reload();
            }
          }}
        >
          {t("try_again")}
        </Button>
      </div>
    );
  }

  // Render the encryption setup modal
  if (showKeySetupModal) {
    return (
      <EncryptionSetupModal
        isOpen={showKeySetupModal}
        onComplete={handleKeySetupComplete}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{features("trial_title")}</h1>
            </div>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features("unlimited_devices")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features("shared_vaults")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features("advanced_security")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features("security_alerts")}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features("multi_platform")}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{features("looking_for_options")}</p>
              <Link href="#" className="text-sm theme-accent-text hover:underline">
                {features("see_options")}
              </Link>
            </div>
          </div>
          <div className="bg-card rounded-lg p-1 flex flex-col border border-border shadow-md">
            <SignIn
              fullPage={true}
              automaticRedirect={false}
              firstTab="password"
              extraInfo={
                <>
                  {t("agreement")} <a href={`/${locale}/terms`}>{t("terms")}</a>
                </>
              }
            />
          </div>
        </div>
      </div>

      <Dialog open={show2FAModal} onOpenChange={(open) => {
        if (!open && !isNewUser) {
          setShow2FAModal(false);
        }
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{isNewUser ? t("2fa_setup") : t("2fa_verify")}</DialogTitle>
            <DialogDescription>
              {isNewUser ? t("2fa_scan") : t("2fa_enter_code")}
            </DialogDescription>
          </DialogHeader>
          {isNewUser && provisioningUri && (
            <div className="flex flex-col items-center">
              <div className="bg-white p-4 rounded-lg mb-4">
                <QRCodeSVG 
                  value={provisioningUri} 
                  size={qrSize} 
                  level="H" 
                  includeMargin={true}
                  className="mb-2" 
                />
              </div>
              <div className="text-center space-y-2 w-full">
                <p className="text-sm text-muted-foreground">{t("2fa_scan_difficulty")}</p>
                <Button 
                  variant="outline" 
                  onClick={copyToClipboard} 
                  className="w-full"
                >
                  {t("copy_setup_key")}
                </Button>
              </div>
            </div>
          )}
          <div className="grid gap-4 py-4">
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
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
          <DialogFooter>
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
              className="w-full"
            >
              {verifying2FA ? t("verifying") : t("verify")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}