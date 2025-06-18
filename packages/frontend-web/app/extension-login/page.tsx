"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { RootState } from "@/libs/Redux/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function ExtensionLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromExtension = searchParams.get("from") === "extension";
  const [status, setStatus] = useState<"initial" | "sending" | "success" | "error">("initial");
  const [errorMessage, setErrorMessage] = useState("");
  
  // Get access token and workspace/project info from Redux store
  const accessToken = useSelector((state: RootState) => state.user.userData?.access_token);
  const isAuthenticated = useSelector((state: RootState) => state.user.isAuthenticated);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  useEffect(() => {
    // If not coming from extension, redirect to dashboard
    if (!fromExtension) {
      router.push("/dashboard");
      return;
    }

    // If user is authenticated and we have a token, send it to the extension
    if (isAuthenticated && accessToken && fromExtension) {
      sendTokenToExtension();
    }
  }, [isAuthenticated, accessToken, fromExtension]);

  // Function to send token to extension
  const sendTokenToExtension = async () => {
    try {
      setStatus("sending");
      
      // The extension ID will need to be updated with your actual extension ID
      // For development, you can use the ID Chrome assigns temporarily
      // For production, you'll need to use your published extension ID
      const EXTENSION_ID = "YOUR_EXTENSION_ID"; // Replace with actual ID
      
      // Check if chrome is available (we're in a browser)
      if (typeof chrome !== "undefined" && chrome.runtime) {
        chrome.runtime.sendMessage(
          EXTENSION_ID, 
          {
            type: "LOGIN",
            token: accessToken,
            workspaceId: selectedWorkspaceId,
            projectId: selectedProjectId
          },
          (response) => {
            if (response && response.success) {
              setStatus("success");
            } else {
              setStatus("error");
              setErrorMessage("Extension did not confirm receipt of the token.");
            }
          }
        );
      } else {
        // For development environments where chrome.runtime might not be available
        console.log("Chrome runtime not available. Token would be sent to extension:", accessToken);
        setStatus("success");
      }
    } catch (error) {
      console.error("Error sending token to extension:", error);
      setStatus("error");
      setErrorMessage("Failed to communicate with the extension.");
    }
  };

  // If not authenticated, redirect to login
  useEffect(() => {
    if (!isAuthenticated && fromExtension) {
      // Store the return URL so we can come back after login
      const returnUrl = `/extension-login?from=extension`;
      router.push(`/login?returnUrl=${encodeURIComponent(returnUrl)}`);
    }
  }, [isAuthenticated, fromExtension]);

  const handleClose = () => {
    window.close();
  };

  return (
    <div className="container flex items-center justify-center min-h-screen">
      <Card className="w-[400px] max-w-full">
        <CardHeader>
          <CardTitle>Zecrypt Extension Authentication</CardTitle>
          <CardDescription>
            {status === "initial" && "Preparing to connect your Zecrypt account to the browser extension..."}
            {status === "sending" && "Connecting to extension..."}
            {status === "success" && "Successfully connected to Zecrypt extension!"}
            {status === "error" && "Connection error"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === "success" && (
            <Alert className="mb-4">
              <AlertTitle>Authentication successful</AlertTitle>
              <AlertDescription>
                Your Zecrypt account is now connected to the browser extension.
                You can close this tab and start using the extension.
              </AlertDescription>
            </Alert>
          )}
          
          {status === "error" && (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Authentication failed</AlertTitle>
              <AlertDescription>
                {errorMessage || "There was a problem connecting to the Zecrypt extension."}
              </AlertDescription>
            </Alert>
          )}
          
          <Button 
            onClick={handleClose} 
            className="w-full"
            disabled={status === "sending" || status === "initial"}
          >
            {status === "success" ? "Close Tab" : "Cancel"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 