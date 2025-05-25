"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { hashData } from "@/libs/crypto";
import { encryptDataField } from "@/libs/encryption";
import { secureGetItem, decryptFromSessionStorage } from "@/libs/session-storage-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddApiKeyProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApiKeyAdded: () => void;
}

export function AddApiKey({ open, onOpenChange, onApiKeyAdded }: AddApiKeyProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [notes, setNotes] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [env, setEnv] = useState<"Development" | "Staging" | "Production" | "Testing" | "Local" | "UAT">("Development");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectKey, setProjectKey] = useState<string | null>(null);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedProjectName = useMemo(() => {
    if (!workspaces || !selectedWorkspaceId || !selectedProjectId) return null;
    const workspace = workspaces.find(w => w.workspaceId === selectedWorkspaceId);
    if (!workspace) return null;
    const project = workspace.projects.find(p => p.project_id === selectedProjectId);
    return project?.name || null;
  }, [workspaces, selectedWorkspaceId, selectedProjectId]);

  // Load the project key when the component opens or when project changes
  useEffect(() => {
    const loadProjectKey = async () => {
      if (open && selectedProjectName) {
        try {
          console.log("Loading project key for project:", selectedProjectName);
          // Use project name instead of ID to get the key
          const key = await secureGetItem(`projectKey_${selectedProjectName}`);
          console.log("Project key loaded:", key ? "Found" : "Not found");
          setProjectKey(key);
        } catch (error) {
          console.error("Error loading project key:", error);
          setProjectKey(null);
        }
      }
    };
    
    loadProjectKey();
  }, [open, selectedProjectName]);

  const predefinedTags = ["admin", "public", "read", "write", "delete"];

  const addTag = (tag: string) => {
    const normalizedTag = tag.toLowerCase().trim();
    if (normalizedTag && !tags.includes(normalizedTag)) {
      setTags([...tags, normalizedTag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const handleSubmit = async () => {
    if (!title || !data) {
      setError(translate("please_fill_all_required_fields", "api_keys", { default: "Please fill all required fields" }));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding API key:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("no_project_selected", "api_keys", { default: "No project selected" }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Create a JSON object for the API key
      const apiKeyObject = { key: data };
      const apiKeyJson = JSON.stringify(apiKeyObject);
      console.log("API key JSON prepared:", apiKeyJson);
      
      // Get the current project keys from storage
      console.log("All sessionStorage keys:", Object.keys(sessionStorage));
      
      // Direct access to session storage key - using project name
      let effectiveProjectKey = projectKey;
      if (!effectiveProjectKey && selectedProjectName) {
        console.log("Project key not found in state, trying to load directly");
        const rawProjectKey = sessionStorage.getItem(`projectKey_${selectedProjectName}`);
        console.log("Raw project key from session storage:", rawProjectKey ? `Found (${rawProjectKey.length} chars)` : "Not found");
        
        // Try to decrypt it if found
        if (rawProjectKey) {
          effectiveProjectKey = await decryptFromSessionStorage(rawProjectKey);
          console.log("Decrypted project key:", effectiveProjectKey ? "Found" : "Failed to decrypt");
        }
      }
      
      let processedData = data;
      if (effectiveProjectKey) {
        console.log("Encrypting API key data with project key");
        try {
          // Encrypt the API key data
          processedData = await encryptDataField(apiKeyJson, effectiveProjectKey);
          console.log("Data encrypted successfully:", processedData);
        } catch (encryptError) {
          console.error("Encryption failed:", encryptError);
          processedData = data; // Fallback to unencrypted data
        }
      } else {
        console.warn("No encryption key found for project, storing API key unencrypted");
      }

      console.log("Sending data to server:", processedData);
      
      const payload = {
        title,
        data: processedData,
        notes: notes || null,
        env,
        tags,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/api-keys`,
        payload
      );

      if (response.status === 201 || (response.data && response.data.status_code === 201)) {
        onApiKeyAdded();
        onOpenChange(false);
        toast({
          title: translate("api_key_added_successfully", "api_keys", { default: "API key added successfully" }),
          description: translate("api_key_added_description", "api_keys", { default: "The API key has been added." }),
        });

        // Reset form
        setTitle("");
        setData("");
        setNotes("");
        setEnv("Development");
        setTags([]);
        setNewTag("");
        setError("");
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_api_key", "api_keys", { default: "Failed to add API key" }));
      }
    } catch (error: any) {
      console.error("Error adding API key:", error);
      if (error.response?.status === 400 && error.response.data?.message === "API key already exists") {
        setError(translate("api_key_already_exists", "api_keys", { default: "API key already exists" }));
      } else if (error.response?.status === 422) {
        setError(translate("invalid_input_data", "api_keys", { default: "Invalid input data" }));
      } else {
        setError(error.response?.data?.message || translate("failed_to_add_api_key", "api_keys", { default: "Failed to add API key" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translate("add_new_api_key", "api_keys", { default: "Add New API Key" })}</DialogTitle>
          <DialogDescription>
            {translate("add_new_api_key_description", "api_keys", { default: "Enter your API key details below" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {error && (
            <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="title">
              {translate("api_key_name", "api_keys", { default: "API Key Name" })}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={translate("enter_api_key_name", "api_keys", { default: "Enter API key name" })}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={error && !title ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">
              {translate("api_key", "api_keys", { default: "API Key" })}
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="data"
                type={showApiKey ? "text" : "password"}
                placeholder={translate("enter_api_key", "api_keys", { default: "Enter API key" })}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={error && !data ? "border-red-500" : ""}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                onClick={() => setShowApiKey(!showApiKey)}
                type="button"
              >
                {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{translate("notes", "api_keys", { default: "Notes" })}</Label>
            <Input
              id="notes"
              placeholder={translate("enter_notes", "api_keys", { default: "Enter notes" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="env">
              {translate("environment", "api_keys", { default: "Environment" })}
              <span className="text-red-500">*</span>
            </Label>
            <Select value={env} onValueChange={(value) => setEnv(value as "Development" | "Staging" | "Production" | "Testing" | "Local" | "UAT")}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={translate("select_environment", "api_keys", { default: "Select environment" })} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Development">{translate("development", "api_keys", { default: "Development" })}</SelectItem>
                <SelectItem value="Staging">{translate("staging", "api_keys", { default: "Staging" })}</SelectItem>
                <SelectItem value="Production">{translate("production", "api_keys", { default: "Production" })}</SelectItem>
                <SelectItem value="Testing">{translate("testing", "api_keys", { default: "Testing" })}</SelectItem>
                <SelectItem value="Local">{translate("local", "api_keys", { default: "Local" })}</SelectItem>
                <SelectItem value="UAT">{translate("uat", "api_keys", { default: "UAT" })}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{translate("tags", "api_keys", { default: "Tags" })}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder={translate("add_a_tag", "api_keys", { default: "Add a tag" })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag(newTag))}
              />
              <Button type="button" onClick={() => addTag(newTag)}>
                {translate("add", "api_keys", { default: "Add" })}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                  </Badge>
                ))}
              </div>
            )}
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
        </div>
        <DialogFooter>
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {translate("cancel", "api_keys", { default: "Cancel" })}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("adding", "api_keys", { default: "Adding..." })
              : translate("add_api_key", "api_keys", { default: "Add API Key" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}