"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Check, Github } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "./theme-toggle"
import { MonochromeGoogleIcon } from "./monochrome-google-icon"
import { useState, useEffect } from "react"
import { SignIn,useUser } from '@stackframe/stack';


export function LoginPage() {
  const router = useRouter()

  const user = useUser(); // Check if the user is already signed in
  const [isLoggingIn, setIsLoggingIn] = useState(false)

  useEffect(() => {
    if (user) {
      handleAccessToken
      router.push("/dashboard")
    }
  }, [user, router])

  async function handleAccessToken() {
    if (user) {
      const authDetails = await user.getAuthJson();
      const accessToken = authDetails.accessToken;
      console.log('Access Token:', accessToken);
      // You can now use the access token as needed
    } else {
      console.log('User is not authenticated');
    }
  }
  

  

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
            <h1 className="text-3xl font-bold">Try upto 3Password Families free for 40 days</h1>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">5 family members, unlimited devices</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Shared vaults let family members choose what they want to share (or keep private)
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Advanced security with authenticated encryption, PAKE, and more
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Alerts for compromised websites and vulnerable passwords
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Available on Mac, iOS, Windows, Android, Chrome OS, and Linux
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Looking for an individual, team, or business account?</p>
            <Link href="#" className="text-sm theme-accent-text hover:underline">
              See all account options
            </Link>
          </div>
        </div>

        <div className="bg-card rounded-lg p-1 flex flex-col border border-border shadow-md">

        <SignIn
        fullPage={true}
        automaticRedirect={false}
        firstTab='password'
        extraInfo={<>When signing in, you agree to our <a href="/terms">Terms</a></>}
      />

          {/* <div className="text-center space-y-2 mb-8">
            <h2 className="text-2xl font-bold">Sign In</h2>
            <p className="text-sm text-muted-foreground">Your secure password manager</p>
          </div>

          <div className="space-y-4">
            <Button
              variant="outline"
              className="w-full flex items-center gap-2 h-12 hover:theme-accent-bg hover:text-white"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              <MonochromeGoogleIcon className="h-5 w-5" />
              Sign in with Google
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border"></span>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">OR</span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full flex items-center gap-2 h-12 hover:theme-accent-bg hover:text-white"
              onClick={handleLogin}
              disabled={isLoggingIn}
            >
              <Github className="h-5 w-5" />
              Sign in with GitHub
            </Button>
          </div>

          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>We've set your account name based on your social account.</p>
            <p>Don't worry, you can easily update it later on your profile page.</p>
          </div> */}
        </div>
      </div>
    </div>
  )
}

