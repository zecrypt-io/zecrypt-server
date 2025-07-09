"use client";

import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useRouter, useSearchParams } from "next/navigation";
import { RootState } from "@/libs/Redux/store";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { secureGetItem, secureSetItem } from "@/libs/local-storage-utils";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { fetchProjectKeys } from "@/libs/getWorkspace";
import { importRSAPrivateKey, decryptAESKeyWithRSA } from "@/libs/encryption";

// Interface definitions for workspace data
interface Project {
  project_id: string;
  name: string;
  lower_name: string;
  description: string;
  color: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_default: boolean;
  workspace_id: string;
  features: { [key: string]: { enabled: boolean; is_client_side_encryption: boolean } };
}

interface Workspace {
  workspaceId: string;
  name: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  projects: Project[];
}

export default function ExtensionLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromExtension = searchParams.get("from") === "extension";

  const [status, setStatus] = useState<"initial" | "checking" | "loading_workspace" | "syncing_keys" | "sending" | "success" | "error" | "not_authenticated" | "logging_out">("initial");
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

  // Function to synchronize project keys
  const syncProjectKeys = async (workspaceId: string, projects: Project[]): Promise<boolean> => {
    if (!workspaceId || !projects.length) {
      return false;
    }
    
    try {
      const storedKeys: Record<string, string> = {};
      for (const project of projects) {
        const storedKey = await secureGetItem(`projectKey_${project.name}`);
        if (storedKey) {
          storedKeys[project.project_id] = storedKey;
        }
      }

      const missingKeyProjects = projects.filter(project => !storedKeys[project.project_id]);
      
      if (missingKeyProjects.length === 0) {
        return true; // All keys are already available
      }

      if (!userData?.access_token) {
        return false;
      }

      // Fetch encrypted project keys from API
      const projectKeys = await fetchProjectKeys(workspaceId, userData.access_token);
      
      if (!projectKeys) {
        return false;
      }

      // Get the user's private key for decryption
      const privateKeyPEM = await secureGetItem('privateKey');
      if (!privateKeyPEM) {
        console.error("Private key not found - user may not have completed master password unlock");
        return false;
      }

      const privateKey = await importRSAPrivateKey(privateKeyPEM);

      // Decrypt and store the missing project keys
      for (const projectKey of projectKeys) {
        if (missingKeyProjects.some(p => p.project_id === projectKey.project_id)) {
          try {
            const decryptedKey = await decryptAESKeyWithRSA(projectKey.project_key, privateKey);
            await secureSetItem(`projectKey_${projectKey.project_name}`, decryptedKey);
            console.log(`Successfully synced project key for: ${projectKey.project_name}`);
          } catch (error) {
            console.error(`Error decrypting project key for ${projectKey.project_name}:`, error);
          }
        }
      }
      
      return true;
    } catch (error) {
      console.error("Error syncing project keys:", error);
      return false;
    }
  };

  // Function to fetch workspace data directly if not available in Redux
  const fetchWorkspaceData = async (): Promise<{ workspace: Workspace; project: Project } | null> => {
    try {
      if (!userData?.access_token) {
        throw new Error("No access token available");
      }

      // Fetch workspaces using the correct endpoint
      const workspaceResponse = await axiosInstance.post('/load-initial-data');
      const workspacesData = workspaceResponse.data?.data;
      
      if (!workspacesData || workspacesData.length === 0) {
        throw new Error("No workspaces found");
      }

      // Transform workspace data to match the expected format
      const defaultWorkspace = {
        workspaceId: workspacesData[0].doc_id,
        name: workspacesData[0].name,
        created_by: workspacesData[0].created_by,
        created_at: workspacesData[0].created_at,
        updated_at: workspacesData[0].updated_at,
        projects: []
      };
      
      // Fetch projects for the workspace using the correct endpoint
      const projectResponse = await axiosInstance.get(`/${defaultWorkspace.workspaceId}/projects`);
      const projectsResponseData = projectResponse.data;
      
      if (projectsResponseData.status_code !== 200 || !projectsResponseData.data || projectsResponseData.data.length === 0) {
        throw new Error("No projects found in workspace");
      }

      // Transform project data to match the expected format
      const projectsData = projectsResponseData.data.map((project: any) => ({
        project_id: project.doc_id,
        name: project.name,
        lower_name: project.lower_name || project.name.toLowerCase(),
        description: project.description ?? "",
        color: project.color || "#4f46e5",
        created_by: project.created_by,
        created_at: project.created_at,
        updated_at: project.updated_at,
        is_default: project.is_default,
        workspace_id: project.workspace_id || defaultWorkspace.workspaceId,
        features: project.features || {},
      }));

      // Find default project or use first one
      const defaultProject = projectsData.find((p: Project) => p.is_default) || projectsData[0];
      
      return {
        workspace: {
          ...defaultWorkspace,
          projects: projectsData
        },
        project: defaultProject
      };
      
    } catch (error) {
      console.error("Error fetching workspace data:", error);
      return null;
    }
  };

  // Function to send token to extension
  const sendTokenToExtension = async () => {
    try {
      setStatus("sending");
      
      if (!userData?.access_token) {
        throw new Error("No access token available");
      }

      let currentProject: Project | null = null;
      let currentWorkspaceId: string | null = null;
      let currentProjectId: string | null = null;
      let allProjects: Project[] = [];

      // First, try to use data from Redux store
      if (selectedWorkspaceId && selectedProjectId && workspaces.length > 0) {
        const workspace = workspaces.find(ws => ws.workspaceId === selectedWorkspaceId);
        if (workspace) {
          currentProject = workspace.projects.find(p => p.project_id === selectedProjectId) || null;
          currentWorkspaceId = selectedWorkspaceId;
          currentProjectId = selectedProjectId;
          allProjects = workspace.projects;
        }
      }

      // If no data from Redux, fetch it directly
      if (!currentProject) {
        setStatus("loading_workspace");
        console.log("Workspace data not available in Redux, fetching directly...");
        
        const workspaceData = await fetchWorkspaceData();
        if (!workspaceData) {
          throw new Error("Failed to fetch workspace data");
        }
        
        currentProject = workspaceData.project;
        currentWorkspaceId = workspaceData.workspace.workspaceId;
        currentProjectId = workspaceData.project.project_id;
        allProjects = workspaceData.workspace.projects;
        
        console.log("Fetched workspace data:", {
          workspaceId: currentWorkspaceId,
          projectId: currentProjectId,
          projectName: currentProject.name
        });
      }

      if (!currentProject || !currentWorkspaceId || !currentProjectId) {
        throw new Error("Unable to determine current project");
      }

      // Check if project AES key is available, if not try to sync
      let projectAesKey = await secureGetItem(`projectKey_${currentProject.name}`);
      
      if (!projectAesKey) {
        setStatus("syncing_keys");
        console.log("Project AES key not found, attempting to sync project keys...");
        
        const syncSuccess = await syncProjectKeys(currentWorkspaceId, allProjects);
        if (!syncSuccess) {
          throw new Error("Failed to sync project keys. Please complete the full login process including master password unlock.");
        }
        
        // Try to get the key again after sync
        projectAesKey = await secureGetItem(`projectKey_${currentProject.name}`);
        
        if (!projectAesKey) {
          throw new Error("Project AES key still not available after sync. Please log in through the web app first to complete the encryption setup.");
        }
        
        console.log("Successfully synced and retrieved project AES key");
      }

      setStatus("sending");

      // Method 1: Try to communicate with extension via localStorage
      // This is the most reliable method for extension communication
      const authData = {
        token: userData.access_token,
        workspaceId: currentWorkspaceId,
        projectId: currentProjectId,
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
        workspaceId: currentWorkspaceId,
        projectId: currentProjectId,
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
      setErrorMessage(error instanceof Error ? error.message : "Failed to communicate with the extension.");
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
            {status === "loading_workspace" && "Loading workspace data..."}
            {status === "syncing_keys" && "Synchronizing project keys..."}
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

          {(status === "checking" || status === "loading_workspace" || status === "syncing_keys") && (
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