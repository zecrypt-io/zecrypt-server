"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { encryptDataField, decryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/session-storage-utils";

// Raw data structure from API
export interface PasswordHistoryItem {
  data: string;
  doc_id: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Processed data with decrypted data
export interface ProcessedPasswordHistoryItem extends Omit<PasswordHistoryItem, 'data'> {
  data: string; // Decrypted data
  encryptedData: string; // Original encrypted data
}

export function usePasswordHistory() {
  const { translate } = useTranslator();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState<ProcessedPasswordHistoryItem[]>([]);
  const userData = useSelector((state: RootState) => state.user.userData);
  
  // Get workspaces from Redux store for project name lookup (like other hooks)
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  
  const [projectKey, setProjectKey] = useState<string | null>(null);

  // Load the project key when component mounts or project changes
  useEffect(() => {
    const loadProjectKey = async () => {
      if (!workspaces || !selectedWorkspaceId || !selectedProjectId) {
        console.log("Missing workspace or project information");
        setProjectKey(null);
        return;
      }
      
      try {
        // Find the current project using workspaces from the component scope (like account management hook)
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
          
        if (!currentProject) {
          console.log("Project not found in workspaces");
          setProjectKey(null);
          return;
        }

        // Get the project's AES key from session storage (standard pattern)
        const projectKeyName = `projectKey_${currentProject.name}`;
        console.log(`Looking for project key with name: ${projectKeyName}`);
        const key = await secureGetItem(projectKeyName);
        
        console.log("Project key lookup result:", {
          projectName: currentProject.name,
          projectId: selectedProjectId,
          keyFound: !!key
        });
        
        setProjectKey(key);
      } catch (error) {
        console.error("Error loading project key:", error);
        setProjectKey(null);
      }
    };
    
    loadProjectKey();
  }, [workspaces, selectedWorkspaceId, selectedProjectId]);

  // Helper function to attempt decryption with various strategies
  const tryDecrypt = async (encryptedData: string, projectKey: string): Promise<string> => {
    try {
      // If it looks like our encrypted format (contains a period separator for IV)
      if (encryptedData.includes('.')) {
        return await decryptDataField(encryptedData, projectKey);
      }
      // If it's not in encrypted format, return as is (plaintext)
      return encryptedData;
    } catch (error) {
      console.error("Decryption failed:", error);
      return "**Decryption Error**";
    }
  };

  // Fetch password history
  const fetchPasswordHistory = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use the correct API endpoint
      console.log("Fetching password history...");
      const response = await axiosInstance.get('/password-history');
      
      if (response.status === 200 && response.data?.data) {
        let historyItems: PasswordHistoryItem[] = response.data.data;
        console.log(`Received ${historyItems.length} password history items`);
        
        // Sort by creation date (newest first)
        historyItems = historyItems.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        // Process items - decrypt the data field if we have project key
        let processedItems: ProcessedPasswordHistoryItem[] = [];
        
        if (projectKey) {
          console.log("Project key available, attempting to decrypt items");
          processedItems = await Promise.all(
            historyItems.map(async (item) => {
              const decryptedData = await tryDecrypt(item.data, projectKey);
              
              return {
                ...item,
                data: decryptedData,
                encryptedData: item.data
              };
            })
          );
          console.log("Decryption completed");
        } else {
          console.log("No project key available, marking items as encrypted");
          // If no project key, just mark data as encrypted
          processedItems = historyItems.map(item => ({
            ...item,
            data: "**Encrypted**",
            encryptedData: item.data
          }));
        }
        
        // Limit to the last 10 items (they're already sorted by creation date)
        setPasswordHistory(processedItems.slice(0, 10));
      } else {
        console.error("Error in API response:", response);
        toast({
          title: translate("error", "actions"),
          description: translate("error_fetching_history", "password_generator", { default: "Error fetching password history" }),
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error fetching password history:", error);
      toast({
        title: translate("error", "actions"),
        description: translate("error_fetching_history", "password_generator", { default: "Error fetching password history" }),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [translate, projectKey]);

  // Save password to history
  const savePasswordToHistory = useCallback(async (password: string) => {
    if (!password) {
      console.log("No password to save");
      return;
    }
    
    try {
      // Determine what to save - encrypted or plaintext
      let dataToSave: string;
      
      if (projectKey) {
        console.log("Encrypting password before saving");
        // Encrypt the password
        dataToSave = await encryptDataField(password, projectKey);
      } else {
        console.log("No project key available, saving password without encryption");
        // If no project key, save in plaintext (backend should ideally have its own encryption)
        dataToSave = password;
      }
      
      // Save to API
      console.log("Sending POST request to /password-history");
      const response = await axiosInstance.post('/password-history', { 
        data: dataToSave 
      });
      
      console.log("Password saved to history:", response.status);
      
      // Don't automatically refresh to prevent potential loops
      // fetchPasswordHistory();
    } catch (error) {
      console.error("Error saving password to history:", error);
      // Show toast for error
      toast({
        title: translate("error", "actions"),
        description: translate("error_saving_history", "password_generator", { default: "Failed to save password to history" }),
        variant: "destructive",
      });
    }
  }, [projectKey, translate]); 

  return {
    passwordHistory,
    isLoading,
    fetchPasswordHistory,
    savePasswordToHistory
  };
} 