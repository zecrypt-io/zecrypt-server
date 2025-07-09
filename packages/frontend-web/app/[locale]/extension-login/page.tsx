"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { RootState } from "@/libs/Redux/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { secureGetItem } from "@/libs/local-storage-utils";

export default function ExtensionLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromExtension = searchParams.get("from") === "extension";

  const [status, setStatus] = useState<"initial" | "checking" | "sending" | "success" | "error" | "not_authenticated" | "logging_out">("initial");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Get user data from Redux store
  const userData = useSelector((state: RootState) => state.user.userData);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  // Check if user is authenticated (has access token)
  const isAuthenticated = userData && userData.access_token;

  useEffect(() => {
    // If not coming from extension, redirect to dashboard
    if (!fromExtension) {
      router.push("/dashboard");
      return;
    }

    setStatus("checking");

    // Check authentication status
    if (isAuthenticated && userData?.access_token) {
      // User is already logged in, send credentials to extension
      sendTokenToExtension();
    } else {
      // User is not authenticated, need to log in
      setStatus("not_authenticated");
    }
  }, [isAuthenticated, userData, fromExtension]);

  // Function to send token to extension
  const sendTokenToExtension = async () => {
    try {
      setStatus("sending");
      
      if (!userData?.access_token) {
        throw new Error("No access token available");
      }

      // Get the current project to retrieve the AES key
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        throw new Error("Current project not found");
      }

      // Get the decrypted project AES key from localStorage
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      
      if (!projectAesKey) {
        throw new Error("Project AES key not found. Please make sure you're logged in properly.");
      }

      // Method 1: Try to communicate with extension via localStorage
      // This is the most reliable method for extension communication
      const authData = {
        token: userData.access_token,
        workspaceId: selectedWorkspaceId,
        projectId: selectedProjectId,
        projectAesKey: projectAesKey, // Add the project AES key
        timestamp: Date.now()
      };

      localStorage.setItem('zecrypt_extension_auth', JSON.stringify(authData));
      
      // Method 2: Also try postMessage for immediate communication
      if (window.opener) {
        window.opener.postMessage({
          type: "ZECRYPT_LOGIN",
          ...authData
        }, "*");
      }

      // Method 3: Dispatch a custom event that the extension can listen for
      window.dispatchEvent(new CustomEvent('zecrypt_extension_login', {
        detail: authData
      }));

      setStatus("success");
      
      console.log("Authentication data sent to extension:", {
        hasToken: !!userData.access_token,
        workspaceId: selectedWorkspaceId,
        projectId: selectedProjectId,
        hasProjectAesKey: !!authData.projectAesKey,
        projectName: currentProject.name
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        window.close();
      }, 3000);

    } catch (error) {
      console.error("Error sending token to extension:", error);
      setStatus("error");
      setErrorMessage("Failed to communicate with the extension.");
    }
  };

  const handleLoginRedirect = async () => {
    try {
      setStatus("logging_out");
      
      // Store the current URL as return URL
      const currentUrl = window.location.href;
      localStorage.setItem('zecrypt_extension_return_url', currentUrl);
      
      // Force logout to clear any partial Stack Auth sessions
      // This ensures users go through the complete authentication flow
      
      // Clear access token cookie
      document.cookie = 'access_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=strict';
      
      // Clear all session storage to remove any cached auth state
      sessionStorage.clear();
      
      // Clear specific auth-related localStorage items that might interfere with full auth flow
      localStorage.removeItem('zecrypt_device_id');
      
      // Clear any Stack Auth related storage
      // This will force Stack to start fresh authentication
      const stackAuthKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('stack-') || key.includes('auth') || key.includes('session')
      );
      stackAuthKeys.forEach(key => localStorage.removeItem(key));
      
      // Add a slight delay to ensure cleanup is complete
      setTimeout(() => {
        // Redirect to login with a special parameter indicating this is from extension
        // and requires full authentication
        router.push(`/en/login?extension_auth=true&force_full_auth=true`);
      }, 500);
      
    } catch (error) {
      console.error("Error during logout:", error);
      // If logout fails, still redirect to login
      router.push(`/en/login?extension_auth=true&force_full_auth=true`);
    }
  };

  const handleClose = () => {
    window.close();
  };

  const handleRetry = () => {
    if (isAuthenticated && userData?.access_token) {
      sendTokenToExtension();
    } else {
      setStatus("not_authenticated");
    }
  };

  return (
    <div className="container flex items-center justify-center min-h-screen bg-gray-50">
      <Card className="w-[450px] max-w-full">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">Z</span>
            </div>
            Zecrypt Extension Login
          </CardTitle>
          <CardDescription>
            {status === "initial" && "Initializing..."}
            {status === "checking" && "Checking authentication status..."}
            {status === "sending" && "Connecting to extension..."}
            {status === "success" && "Successfully connected!"}
            {status === "error" && "Connection failed"}
            {status === "not_authenticated" && "Please log in to continue"}
            {status === "logging_out" && "Preparing secure login..."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "success" && (
            <Alert className="border-green-200 bg-green-50">
              <AlertTitle className="text-green-800">✓ Authentication successful</AlertTitle>
              <AlertDescription className="text-green-700">
                Your Zecrypt account is now connected to the browser extension.
                You can close this tab and start using the extension to autofill your cards and emails.
              </AlertDescription>
            </Alert>
          )}
          
          {status === "error" && (
            <Alert variant="destructive">
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>
                {errorMessage || "There was a problem connecting to the Zecrypt extension."}
              </AlertDescription>
            </Alert>
          )}

          {status === "not_authenticated" && (
            <Alert className="border-blue-200 bg-blue-50">
              <AlertTitle className="text-blue-800">Login Required</AlertTitle>
              <AlertDescription className="text-blue-700">
                You need to log in to your Zecrypt account first to connect the extension.
                You will be asked to verify your 2FA code and enter your master password.
              </AlertDescription>
            </Alert>
          )}

          {status === "checking" && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          )}

          {status === "sending" && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Connecting to extension...</span>
            </div>
          )}

          {status === "logging_out" && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-sm text-gray-600">Preparing secure authentication...</span>
            </div>
          )}
          
          <div className="flex gap-2">
            {status === "not_authenticated" && (
              <Button onClick={handleLoginRedirect} className="flex-1">
                Log in to Zecrypt
              </Button>
            )}
            
            {status === "error" && (
              <Button onClick={handleRetry} variant="outline" className="flex-1">
                Try Again
              </Button>
            )}
            
            {(status === "success" || status === "error") && (
              <Button 
                onClick={handleClose} 
                variant={status === "success" ? "default" : "outline"}
                className="flex-1"
              >
                Close Tab
              </Button>
            )}
          </div>

          {status === "success" && (
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">
                This tab will automatically close in a few seconds.
              </p>
              <Link 
                href="/en/dashboard" 
                className="text-sm text-blue-600 hover:underline"
              >
                Go to Dashboard
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 