"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Github } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { MonochromeGoogleIcon } from "./monochrome-google-icon"
import { useState, useEffect } from "react"
import { SignIn,useUser } from '@stackframe/stack';
import { stackAuthHandler } from "@/libs/stack-auth-handler"
import { useTranslations } from 'next-intl';

export interface LoginPageProps {
  locale?: string;
}

export function LoginPage({ locale = 'en' }: LoginPageProps) {
  const router = useRouter()
  const t = useTranslations('auth');
  const features = useTranslations('features');
 
  const user = useUser();
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [shouldRedirect, setShouldRedirect] = useState(false);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/${locale}/dashboard`);
    }
  }, [shouldRedirect, router, locale]);

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const authDetails = await user?.getAuthJson();
        const accessToken = authDetails?.accessToken;

        if (!accessToken) {
          setIsAuthenticating(false);
          return;
        }

        // Try login first
        const loginResponse = await stackAuthHandler(accessToken, "login");
        
        if (loginResponse?.status_code === 200) {
          setShouldRedirect(true);
          return;
        }

        // If login fails with "user not found", try signup
        if (
          loginResponse?.status_code === 400 &&
          loginResponse?.message?.toLowerCase().includes("user not found")
        ) {
          const signupResponse = await stackAuthHandler(accessToken, "signup");
          
          if (signupResponse?.status_code === 200) {
            setShouldRedirect(true);
            return;
          }
        }
      } catch (err) {
        console.error("Auth flow error:", err);
      } finally {
        setIsAuthenticating(false);
      }
    };

    if (user) {
      authenticateUser();
    } else {
      setIsAuthenticating(false);
    }
  }, [user]);

  // Show loading screen while checking authentication status
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verifying authentication...</p>
      </div>
    );
  }

  // If we're not authenticating and there's no user, show the login page
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="absolute top-4 right-4">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold">{features('trial_title')}</h1>
            </div>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{features('unlimited_devices')}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {features('shared_vaults')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {features('advanced_security')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {features('security_alerts')}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="mt-1 rounded-full theme-accent-bg p-1">
                  <Check className="h-4 w-4 text-white" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    {features('multi_platform')}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{features('looking_for_options')}</p>
              <Link href="#" className="text-sm theme-accent-text hover:underline">
                {features('see_options')}
              </Link>
            </div>
          </div>

          <div className="bg-card rounded-lg p-1 flex flex-col border border-border shadow-md">
            <SignIn
              fullPage={true}
              automaticRedirect={false}
              firstTab='password'
              extraInfo={<>
                {t('agreement')} <a href={`/${locale}/terms`}>{t('terms')}</a>
              </>}
            />
          </div>
        </div>
      </div>
    );
  }

  // If we have a user but we're not redirecting yet, show loading
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  );
}

