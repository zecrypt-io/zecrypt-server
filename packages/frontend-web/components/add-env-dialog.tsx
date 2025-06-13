"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { encryptDataField } from "@/libs/encryption";
import { secureGetItem, decryptFromLocalStorage } from "@/libs/local-storage-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface AddEnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnvAdded: () => void;
}

export function AddEnvDialog({ open, onOpenChange, onEnvAdded }: AddEnvDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [data, setData] = useState("");
  const [notes, setNotes] = useState("");
  const [showEnvData, setShowEnvData] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const keyLoadAttemptedRef = useRef(false);

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

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setTitle("");
      setData("");
      setNotes("");
      setTags([]);
      setNewTag("");
      setError("");
      keyLoadAttemptedRef.current = false;
    }
  }, [open]);

  // Load the project key when the component opens or when project changes
  useEffect(() => {
    let isMounted = true;
    
    const loadProjectKey = async () => {
      if (!open || !selectedProjectName || keyLoadAttemptedRef.current) {
        return;
      }
      
      keyLoadAttemptedRef.current = true;
      
      try {
        // Try session storage first (faster)
        const sessionKey = sessionStorage.getItem(`projectKey_${selectedProjectName}`);
        let key = null;
        
        if (sessionKey) {
          key = sessionKey;
        } else {
          // If not in session storage, try secure storage
          key = await secureGetItem(`projectKey_${selectedProjectName}`);
          
          // Cache in session storage for faster access
          if (key) {
            sessionStorage.setItem(`projectKey_${selectedProjectName}`, key);
          }
        }
        
        if (isMounted) {
          setProjectKey(key);
        }
      } catch (error) {
        console.error("Error loading project key:", error);
        if (isMounted) {
          setProjectKey(null);
        }
      }
    };
    
    loadProjectKey();
    
    return () => {
      isMounted = false;
    };
  }, [open, selectedProjectName]);

  // Safely get translation with fallback
  const safeTranslate = (key: string, namespace: string, options?: any) => {
    try {
      return translate(key, namespace, options);
    } catch (error) {
      return options?.default || key;
    }
  };

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
      setError(safeTranslate("please_fill_all_required_fields", "env", { default: "Please fill all required fields" }));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      setError(safeTranslate("no_project_selected", "env", { default: "No project selected" }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Use the project key we already have in state if available
      let effectiveProjectKey = projectKey;
      
      // If not in state, try session storage (faster)
      if (!effectiveProjectKey && selectedProjectName) {
        const sessionKey = sessionStorage.getItem(`projectKey_${selectedProjectName}`);
        if (sessionKey) {
          effectiveProjectKey = sessionKey;
        } else {
          // Last resort: try localStorage
          try {
            const rawProjectKey = localStorage.getItem(`projectKey_${selectedProjectName}`);
            if (rawProjectKey) {
              effectiveProjectKey = await decryptFromLocalStorage(rawProjectKey);
              // Cache for future use
              if (effectiveProjectKey) {
                sessionStorage.setItem(`projectKey_${selectedProjectName}`, effectiveProjectKey);
              }
            }
          } catch (error) {
            console.error("Failed to get project key:", error);
          }
        }
      }
      
      let processedData = data;
      if (effectiveProjectKey) {
        try {
          // Encrypt the environment variables data
          processedData = await encryptDataField(data, effectiveProjectKey);
        } catch (encryptError) {
          console.error("Encryption failed:", encryptError);
          processedData = data; // Fallback to unencrypted data
        }
      }
      
      const payload = {
        title,
        data: processedData,
        notes: notes || null,
        tags,
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/env`,
        payload
      );

      if (response.status === 200 || response.status === 201 || (response.data && (response.data.status_code === 200 || response.data.status_code === 201))) {
        onEnvAdded();
        onOpenChange(false);
        toast({
          title: safeTranslate("env_added_successfully", "env", { default: "Environment variables added successfully" }),
          description: safeTranslate("env_added_description", "env", { default: "The environment variables have been added." }),
        });

        // Reset form
        setTitle("");
        setData("");
        setNotes("");
        setTags([]);
        setNewTag("");
        setError("");
      } else {
        throw new Error(response.data?.message || safeTranslate("failed_to_add_env", "env", { default: "Failed to add environment variables" }));
      }
    } catch (error: any) {
      console.error("Error adding environment variables:", error);
      if (error.response?.status === 400 && error.response.data?.message === "Environment variables already exists") {
        setError(safeTranslate("env_already_exists", "env", { default: "Environment variables already exists" }));
      } else if (error.response?.status === 422) {
        setError(safeTranslate("invalid_input_data", "env", { default: "Invalid input data" }));
      } else {
        setError(error.response?.data?.message || safeTranslate("failed_to_add_env", "env", { default: "Failed to add environment variables" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{safeTranslate("add_new_env", "env", { default: "Add New Environment Variables" })}</DialogTitle>
          <DialogDescription>
            {safeTranslate("add_new_env_description", "env", { default: "Enter your environment variables details below" })}
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
              {safeTranslate("env_name", "env", { default: "Environment Name" })}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder={safeTranslate("enter_env_name", "env", { default: "Enter environment name" })}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={error && !title ? "border-red-500" : ""}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="data">
              {safeTranslate("env_variables", "env", { default: "Environment Variables" })}
              <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="data"
                placeholder={safeTranslate("enter_env_variables", "env", { default: "KEY=value\nANOTHER_KEY=another_value" })}
                value={data}
                onChange={(e) => setData(e.target.value)}
                className={`min-h-[150px] ${error && !data ? "border-red-500" : ""}`}
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-10 px-3 text-muted-foreground"
                onClick={() => setShowEnvData(!showEnvData)}
                type="button"
              >
                {showEnvData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {safeTranslate("env_format_hint", "env", { default: "Enter your environment variables in KEY=value format, one per line" })}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">{safeTranslate("notes", "env", { default: "Notes" })}</Label>
            <Textarea
              id="notes"
              placeholder={safeTranslate("enter_notes", "env", { default: "Enter notes" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px]"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">{safeTranslate("tags", "env", { default: "Tags" })}</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="tags"
                placeholder={safeTranslate("add_tag", "env", { default: "Add tag" })}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                  {tag}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-4 w-4 p-0 hover:bg-transparent"
                    onClick={() => removeTag(tag)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {safeTranslate("cancel", "actions", { default: "Cancel" })}
          </Button>
          <Button type="button" onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? safeTranslate("saving", "actions", { default: "Saving..." })
              : safeTranslate("save", "actions", { default: "Save" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
