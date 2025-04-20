"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Github } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { MonochromeGoogleIcon } from "./monochrome-google-icon"
import { useState, useEffect } from "react"
import { SignIn, useUser } from '@stackframe/stack'
import { stackAuthHandler } from "@/libs/stack-auth-handler"
import { useDispatch } from "react-redux"
import { setUserData } from "../libs/Redux/userSlice"
import { AppDispatch } from "../libs/Redux/store"
import { useTranslations } from 'next-intl'
// import { useTranslations } from 'next-intl';
// import { saveUserData } from "@/libs/local-storage-utils"

export interface LoginPageProps {
  locale?: string;
}

export function LoginPage({ locale = 'en' }: LoginPageProps) {
  const router = useRouter()
  const dispatch = useDispatch<AppDispatch>()
  const t = useTranslations('auth')
  const features = useTranslations('features')
 
  const user = useUser()
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [isAuthenticating, setIsAuthenticating] = useState(true)
  const [shouldRedirect, setShouldRedirect] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (shouldRedirect) {
      router.replace(`/${locale}/dashboard`)
    }
  }, [shouldRedirect, router, locale])

  useEffect(() => {
    const authenticateUser = async () => {
      if (isLoggingIn) return
      setIsLoggingIn(true)

      try {
        setError(null)
        const authDetails = await user?.getAuthJson()
        const accessToken = authDetails?.accessToken
        if (!accessToken) {
          setIsAuthenticating(false)
          setIsLoggingIn(false)
          return
        }

        try {
          const loginResponse = await stackAuthHandler(accessToken, "login")
          console.log("Login response:", loginResponse)
          // // Try login first
          // const loginResponse = await stackAuthHandler(accessToken, "login");
          
          // if (loginResponse?.status_code === 200) {
          //   // Store user data in localStorage
          //   if (loginResponse.data) {
          //     saveUserData(loginResponse.data);
          //   }
          //   setShouldRedirect(true);
          //   return;
          // }

          if (loginResponse?.status_code === 200) {
            dispatch(
              setUserData({
                user_id: loginResponse.data.user_id,
                name: loginResponse.data.name,
                profile_url: loginResponse.data.profile_url,
                access_token: loginResponse.data.access_token,
                email: loginResponse.data.email,
              })
            )
            // setShouldRedirect(true)
            router.push(`/${locale}/dashboard`)
            return
          } 
          
          // If login fails with "user not found", try signup
          if (
            loginResponse?.status_code === 400 &&
            loginResponse?.message?.toLowerCase().includes("user not found")
          ) {
            try {
              const signupResponse = await stackAuthHandler(accessToken, "signup")
              console.log("Signup response:", signupResponse)
              
              if (signupResponse?.status_code === 200) {
                dispatch(
                  setUserData({
                    user_id: signupResponse.data.user_id,
                    name: signupResponse.data.name,
                    profile_url: signupResponse.data.profile_url,
                    access_token: signupResponse.data.access_token,
                    email: signupResponse.data.email,
                  })
                )
                setShouldRedirect(true)
                return
                // Store user data in localStorage
                // if (signupResponse.data) {
                //   saveUserData(signupResponse.data);
                // }
                // setShouldRedirect(true);
                // return;
              } else {
                setError(`Signup failed: ${signupResponse?.message || 'Unknown error'}`)
              }
            } catch (signupErr) {
              console.error("Signup error:", signupErr)
              setError("Failed to sign up. Please check your network connection and try again.")
            }
          } else {
            setError(`Login failed: ${loginResponse?.message || 'Unknown error'}`)
          }
        } catch (authErr) {
          console.error("Auth request error:", authErr)
          setError("Failed to authenticate. Please check your network connection and try again.")
        }
      } catch (err) {
        console.error("Auth flow error:", err)
        setError("Authentication process failed. Please try again later.")
      } finally {
        setIsAuthenticating(false)
        setIsLoggingIn(false)
      }
    }

    if (user) {
      authenticateUser()
    } else {
      setIsAuthenticating(false)
    }
  }, [user, router, dispatch])

  // Show loading screen while checking authentication status
  if (isAuthenticating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <p className="text-muted-foreground">Verifying authentication...</p>
      </div>
    )
  }

  // Show error message if authentication failed
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
        <div className="bg-destructive/10 text-destructive rounded-lg p-4 mb-6 max-w-md">
          <p className="font-semibold mb-2">Authentication Error</p>
          <p>{error}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => {
            setError(null)
            setIsAuthenticating(true)
            // Try to re-authenticate
            if (user) {
              // This will trigger the useEffect again
              window.location.reload()
            }
          }}
        >
          Try Again
        </Button>
      </div>
    )
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
    )
  }

  // If we have a user but we're not redirecting yet, show loading
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-muted-foreground">Redirecting to dashboard...</p>
    </div>
  )
}