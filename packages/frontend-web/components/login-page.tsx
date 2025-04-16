"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { useState, useEffect } from "react";
import { SignIn, useUser } from "@stackframe/stack";
import { stackAuthHandler } from "../libs/stack-auth-handler";
import { useDispatch } from "react-redux";
import { setUserData } from "../libs/Redux/userSlice";
import { AppDispatch } from "../libs/Redux/store";

export function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const user = useUser();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    const authenticateUser = async () => {
      if (isLoggingIn) return;
      setIsLoggingIn(true);

      try {
        const authDetails = await user?.getAuthJson();
        const accessToken = authDetails?.accessToken;
        if (!accessToken) return;

        const loginResponse = await stackAuthHandler(accessToken, "login");
        console.log("Login response:", loginResponse);

        if (loginResponse?.status_code === 200) {
          dispatch(
            setUserData({
              user_id: loginResponse.data.user_id,
              name: loginResponse.data.name,
              profile_url: loginResponse.data.profile_url,
              access_token: loginResponse.data.access_token,
              email: loginResponse.data.email, // Only if backend provides it
            })
          );
          router.push("/dashboard");
        } else if (
          loginResponse?.status_code === 400 &&
          loginResponse?.message?.toLowerCase().includes("user not found")
        ) {
          const signupResponse = await stackAuthHandler(accessToken, "signup");
          console.log("Signup response:", signupResponse);

          if (signupResponse?.status_code === 200) {
            dispatch(
              setUserData({
                user_id: signupResponse.data.user_id, // Fixed typo: loginResponse -> signupResponse
                name: signupResponse.data.name,
                profile_url: signupResponse.data.profile_url,
                access_token: signupResponse.data.access_token,
                email: signupResponse.data.email, // Only if backend provides it
              })
            );
            router.push("/dashboard");
          } else {
            console.error("Signup failed:", signupResponse);
          }
        } else {
          console.error("Login failed:", loginResponse);
        }
      } catch (err) {
        console.error("Auth flow error:", err);
      } finally {
        setIsLoggingIn(false);
      }
    };

    if (user) authenticateUser();
  }, [user, router, dispatch]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Try up to 3 Password Families free for 40 days</h1>
          </div>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="mt-1 rounded-full theme-accent-bg p-1">
                <Check className="h-4 w-4 text-white" />
              </div>
              <p className="text-sm text-muted-foreground">5 family members, unlimited devices</p>
            </div>
            {/* Add other checklist items here */}
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Looking for an individual, team, or business account?
            </p>
            <Link href="#" className="text-sm theme-accent-text hover:underline">
              See all account options
            </Link>
          </div>
        </div>
        <div className="bg-card rounded-lg p-1 flex flex-col border border-border shadow-md">
          <SignIn
            fullPage={true}
            automaticRedirect={false}
            firstTab="password"
            extraInfo={<>When signing in, you agree to our <a href="/terms">Terms</a></>}
          />
        </div>
      </div>
    </div>
  );
}