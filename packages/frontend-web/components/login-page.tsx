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
 
  const user = useUser(); // Check if the user is already signed in
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const authDetails = await user?.getAuthJson();
        const accessToken = authDetails?.accessToken;

        if (!accessToken) return;

        // 1. Try login
        const loginResponse = await stackAuthHandler(accessToken, "login");
        console.log("Login response:", loginResponse);

        if (loginResponse?.status_code === 200) {
          router.push(`/${locale}/dashboard`);
        } else if (
          loginResponse?.status_code === 400 &&
          loginResponse?.message?.toLowerCase().includes("user not found")
        ) {
          // 2. Fallback to signup if login fails with "User not found"
          const signupResponse = await stackAuthHandler(accessToken, "signup");
          console.log("Signup response:", signupResponse);

          if (signupResponse?.status_code === 200) {
            router.push(`/${locale}/dashboard`);
          } else {
            console.error("Signup failed:", signupResponse);
          }
        } else {
          console.error("Login failed:", loginResponse);
        }
      } catch (err) {
        console.error("Auth flow error:", err);
      }
    };

    if (user) {
      authenticateUser();
    }
  }, [user, router, locale]);

  // useEffect(() => {
  //   if (user) {
  //     // handleAccessToken
  //     router.push("/dashboard")
  //   }
  // }, [user, router])

  // async function handleAccessToken() {
  //   if (user) {
  //     const authDetails = await user.getAuthJson();
  //     const accessToken = authDetails.accessToken;
  //     console.log('Access Token:', accessToken);
  //     // You can now use the access token as needed
  //   } else {
  //     console.log('User is not authenticated');
  //   }
  // }
  

  // const handleLogin = () => {
  //   // Set a flag in sessionStorage to indicate we need to show the encryption key modal
  //   sessionStorage.setItem("showEncryptionKeyModal", "true")

  //   // Set a flag to indicate if this is a new user (for demo purposes, we'll use a random value)
  //   // In a real app, this would be determined by your authentication system
  //   const isNewUser = Math.random() > 0.7 // 30% chance of being a new user for demo
  //   sessionStorage.setItem("isNewUser", isNewUser ? "true" : "false")

  //   // Navigate to dashboard
  //   router.push("/dashboard")
  // }

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
  )
}

