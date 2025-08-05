"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { encryptDataField, decryptDataField } from "@/libs/encryption";

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
  decryptSuccess: boolean; // Whether decryption was successful
}

/**
 * Convert a base64 string to hex string
 * @param base64 Base64 encoded string
 * @returns Hex string
 */
function base64ToHex(base64: string): string {
  // Decode base64 to binary string
  const binaryString = window.atob(base64);
  
  // Convert binary string to hex
  let hex = '';
  for (let i = 0; i < binaryString.length; i++) {
    const charCode = binaryString.charCodeAt(i);
    // Convert each character to hex and ensure it's two digits
    const hexByte = charCode.toString(16).padStart(2, '0');
    hex += hexByte;
  }
  
  return hex;
}

export function usePasswordHistory() {
  const { translate } = useTranslator();
  const [isLoading, setIsLoading] = useState(false);
  const [passwordHistory, setPasswordHistory] = useState<ProcessedPasswordHistoryItem[]>([]);
  const userData = useSelector((state: RootState) => state.user.userData);
  
  // Get static encryption key from env and convert it to hex
  const base64Key = process.env.NEXT_PUBLIC_INDEXED_DB_AES_KEY || "";
  // Remove any padding characters if present
  const cleanBase64Key = base64Key.replace(/=+$/, '');
  const encryptionKey = cleanBase64Key ? base64ToHex(cleanBase64Key) : "";
  
  // Helper function to attempt decryption with environment variable key
  const tryDecrypt = async (encryptedData: string): Promise<{success: boolean; data: string}> => {
    if (!encryptionKey) {
      console.log("No encryption key available in environment variables");
      return { success: false, data: "**No Encryption Key**" };
    }
    
    try {
      // If it looks like our encrypted format (contains a period separator for IV)
      if (encryptedData.includes('.')) {
        const decryptedValue = await decryptDataField(encryptedData, encryptionKey);
        return { success: true, data: decryptedValue };
      }
      // If it's not in encrypted format, return as is (plaintext)
      return { success: true, data: encryptedData };
    } catch (error) {
      console.error("Decryption error:", error);
      return { success: false, data: "**Decryption Error**" };
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
        
        // Process items - decrypt the data field with env key
        const processedItems = await Promise.all(
          historyItems.map(async (item) => {
            const decryptResult = await tryDecrypt(item.data);
            
            return {
              ...item,
              data: decryptResult.data,
              encryptedData: item.data,
              decryptSuccess: decryptResult.success
            };
          })
        );
        
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
  }, [translate, encryptionKey]);

  // Save password to history
  const savePasswordToHistory = useCallback(async (password: string): Promise<void> => {
    if (!password) {
      console.log("No password to save");
      return;
    }
    
    try {
      let dataToSave: string;
      
      if (encryptionKey) {
        console.log("Encrypting password before saving (using environment variable key)");
        dataToSave = await encryptDataField(password, encryptionKey);
      } else {
        console.log("No encryption key available in environment variables, saving password without encryption");
        dataToSave = password;
      }
      
      console.log("Sending POST request to /password-history");
      const response = await axiosInstance.post('/password-history', { 
        data: dataToSave 
      });
      
      console.log("Password saved to history:", response.status);
    } catch (error) {
      console.error("Error saving password to history:", error);
      toast({
        title: translate("error", "actions"),
        description: translate("error_saving_history", "password_generator", { default: "Failed to save password to history" }),
        variant: "destructive",
      });
      throw error;
    }
  }, [translate, encryptionKey]);

  return {
    passwordHistory,
    isLoading,
    fetchPasswordHistory,
    savePasswordToHistory
  };
} 