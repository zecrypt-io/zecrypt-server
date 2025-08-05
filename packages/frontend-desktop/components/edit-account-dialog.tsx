"use client";

import { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ChevronDown, Eye, EyeOff, X, Plus, AlertCircle, CheckCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "../libs/Middleware/axiosInstace";
import { encryptAccountData, decryptAccountData } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";

interface Account {
  doc_id: string;
  name?: string;
  title?: string;
  lower_name: string;
  user_name?: string;
  username?: string;
  password?: string;
  data?: string | { username: string; password: string };
  website?: string | null;
  url?: string | null;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string;
  created_by: string;
  project_id: string;
}

interface EditAccountDialogProps {
  account: Account;
  onClose: () => void;
  onAccountUpdated: () => void;
}

export function EditAccountDialog({ account, onClose, onAccountUpdated }: EditAccountDialogProps) {
  const { translate } = useTranslator();
  
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  
  // Parse the username and password from account.data if it's a JSON string
  const parseAccountData = async () => {
    try {
      if (account.data && typeof account.data === 'string') {
        // Use workspaces from component scope
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
        
        if (!currentProject) {
          throw new Error("Project not found");
        }

        // Get the project's AES key from session storage
        const projectKeyName = `projectKey_${currentProject.name}`;
        const projectAesKey = await secureGetItem(projectKeyName);
        
        if (!projectAesKey) {
          throw new Error("Project encryption key not found");
        }

        // Try to decrypt the data field using the project's AES key
        try {
          const decryptedData = await decryptAccountData(account.data, projectAesKey);
          // If decryption succeeds, parse the JSON
          const parsedData = JSON.parse(decryptedData);
          if (parsedData && typeof parsedData === 'object' && 'username' in parsedData && 'password' in parsedData) {
            return parsedData;
          }
        } catch (decryptError) {
          console.error("Decryption failed, trying legacy JSON parse:", decryptError);
          
          // Legacy fallback: Try to parse as unencrypted JSON
          try {
            const parsedData = JSON.parse(account.data);
            if (parsedData && typeof parsedData === 'object' && 'username' in parsedData && 'password' in parsedData) {
              return parsedData;
            }
          } catch (parseError) {
            // If not JSON, it might be an old format or a new hash (masked)
            console.log("Error parsing data:", parseError);
          }
        }
      } else if (account.data && typeof account.data === 'object' && 'username' in account.data && 'password' in account.data) {
        return account.data;
      }
      return { username: account.username || account.user_name || '', password: account.password || '' };
    } catch (e) {
      console.error("Error in parseAccountData:", e);
      return { username: account.username || account.user_name || '', password: account.password || '' };
    }
  };

  const [accountData, setAccountData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(true);
  
  // Load account data on component mount
  useEffect(() => {
    const loadAccountData = async () => {
      try {
        const data = await parseAccountData();
        setAccountData(data);
      } catch (error) {
        console.error("Error loading account data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadAccountData();
  }, [account]);
  
  const [name, setName] = useState(account.title || account.name || "");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState(account.url || account.website || "");
  const [notes, setNotes] = useState(account.notes || "");
  const [tags, setTags] = useState<string[]>(account.tags || []);
  const [newTag, setNewTag] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const predefinedTags = ["Personal", "Work", "Finance", "Social", "Shopping", "Entertainment", "Favorite"];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name || !password) {
      setError(translate("please_fill_all_required_fields", "accounts"));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for updating account:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "accounts"));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Get the current project from workspaces in component scope
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        throw new Error(translate("project_not_found", "accounts"));
      }

      // Create credentials object with username and password
      const credentials = {
        username: username || "",
        password: password
      };

      // Convert credentials object to JSON string
      const credentialsString = JSON.stringify(credentials);

      // Get the project's AES key from session storage
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      
      if (!projectAesKey) {
        throw new Error(translate("encryption_key_not_found", "accounts"));
      }

      // Encrypt the credentials string using the project's AES key
      const encryptedDataString = await encryptAccountData(credentialsString, projectAesKey);

      // Create payload with encrypted data
      const payload = {
        title: name,
        data: encryptedDataString,
        url: website || null,
        tags: tags,
        notes: notes || null
      };

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/accounts/${account.doc_id}`, 
        payload
      );

      if (response.status === 200) {
        toast({
          title: "Success",
          description: translate("account_updated_successfully", "accounts"),
        });

        onAccountUpdated();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_account", "accounts"));
      }
    } catch (error: any) {
      console.error("Error updating account:", error);
      console.error("Error details:", error.response?.data);
      
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || translate("invalid_input", "accounts"));
        } else if (error.response.status === 422) {
          const errorMessages = error.response.data?.detail?.map((err: any) => err.msg).join(", ");
          setError(errorMessages || translate("validation_error", "accounts"));
        } else if (error.response.status === 404) {
          setError(translate("account_not_found", "accounts"));
        } else if (error.response.status === 500) {
          setError(translate("error_updating_account", "accounts"));
        } else {
          setError(error.response.data?.message || translate("failed_to_update_account", "accounts"));
        }
      } else if (error.request) {
        setError(translate("network_error", "accounts"));
      } else {
        setError(`${translate("error_updating_account", "accounts")}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form fields when accountData is loaded
  useEffect(() => {
    if (!isLoading) {
      setUsername(accountData.username || "");
      setPassword(accountData.password || "");
    }
  }, [accountData, isLoading]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm overflow-y-auto py-6">
      <div className="w-full max-w-md rounded-lg bg-card p-6 border border-border shadow-lg relative my-auto">
        <div className="mb-6 text-center">
          <h2 className="text-xl font-bold">{translate("edit_account", "accounts")}</h2>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
        </div>

        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("account_name", "accounts")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                placeholder={translate("enter_account_name", "accounts")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pr-8"
                required
              />
              <ChevronDown className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("username", "accounts")}
            </label>
            <Input
              placeholder={translate("enter_username", "accounts")}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {translate("password", "accounts")} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={translate("enter_password", "accounts")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-8"
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
                type="button"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("website", "accounts")}</label>
            <Input
              placeholder={translate("enter_website_url", "accounts")}
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("notes", "accounts")}</label>
            <Input
              placeholder={translate("enter_notes", "accounts")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{translate("tags", "accounts")}</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                </Badge>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder={translate("add_a_tag", "accounts")}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={() => addTag(newTag)}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="cursor-pointer hover:bg-muted"
                  onClick={() => addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4">
            <Button variant="outline" className="w-full" onClick={onClose} disabled={isSubmitting}>
              {translate("cancel", "accounts")}
            </Button>
            <Button
              variant="default"
              className="w-full bg-primary text-primary-foreground"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? `${translate("updating", "accounts")}...` : translate("update_account", "accounts")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}