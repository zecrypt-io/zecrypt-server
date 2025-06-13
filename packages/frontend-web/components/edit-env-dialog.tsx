"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, X, Plus, AlertCircle, Code } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { encryptDataField, decryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EnvCodeEditor } from "@/components/ui/env-code-editor";

interface EditEnvDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnvUpdated: () => void;
  env: {
    id: string;
    title: string;
    data: string;
    notes: string | null;
    tags: string[];
    created_at: string;
    updated_at: string;
  };
}

export function EditEnvDialog({ open, onOpenChange, onEnvUpdated, env }: EditEnvDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState(env.title || "");
  const [data, setData] = useState("");
  const [notes, setNotes] = useState(env.notes || "");
  const [showEnvData, setShowEnvData] = useState(false);
  const [tags, setTags] = useState<string[]>(env.tags || []);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [projectKey, setProjectKey] = useState<string | null>(null);
  const decryptionAttemptedRef = useRef(false);
  const [codeEditorOpen, setCodeEditorOpen] = useState(false);

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

  // Reset state when dialog opens or env changes
  useEffect(() => {
    if (open) {
      setTitle(env.title || "");
      setNotes(env.notes || "");
      setTags(env.tags || []);
      setError("");
      // Don't reset data here as it will be set after decryption
      decryptionAttemptedRef.current = false;
    }
  }, [open, env]);

  // Load the project key and decrypt environment variables when the component opens
  useEffect(() => {
    let isMounted = true;
    let decryptionTimeout: NodeJS.Timeout | null = null;
    
    const loadProjectKeyAndDecrypt = async () => {
      if (!open || !selectedProjectName || decryptionAttemptedRef.current) {
        return;
      }
      
      decryptionAttemptedRef.current = true;
      setIsDecrypting(true);
      
      // Set a timeout to prevent infinite loading
      decryptionTimeout = setTimeout(() => {
        if (isMounted) {
          setIsDecrypting(false);
          setData(env.data || "");
          toast({
            title: "Error",
            description: "Decryption timed out. Showing raw data.",
            variant: "destructive",
          });
        }
      }, 5000); // 5 second timeout
      
      try {
        // Try to get the key from session storage first (faster)
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
        
        if (!isMounted) {
          return;
        }
        
        if (key) {
          setProjectKey(key);
          
          // Only attempt decryption if data appears to be encrypted
          if (env.data && env.data.includes('.')) {
            try {
              const decrypted = await decryptDataField(env.data, key);
              if (!isMounted) return;
              
              setData(decrypted);
            } catch (error) {
              console.error("Failed to decrypt environment variables:", error);
              if (!isMounted) return;
              
              toast({
                title: "Error",
                description: "Failed to decrypt environment variables",
                variant: "destructive",
              });
              setData(env.data);
            }
          } else {
            // Data is not encrypted
            setData(env.data || "");
          }
        } else {
          // No key found
          setData(env.data || "");
        }
      } catch (error) {
        console.error("Error loading project key:", error);
        if (!isMounted) return;
        
        setProjectKey(null);
        setData(env.data || "");
      } finally {
        if (isMounted) {
          setIsDecrypting(false);
          if (decryptionTimeout) {
            clearTimeout(decryptionTimeout);
          }
        }
      }
    };
    
    loadProjectKeyAndDecrypt();
    
    return () => {
      isMounted = false;
      if (decryptionTimeout) {
        clearTimeout(decryptionTimeout);
      }
    };
  }, [open, selectedProjectName, env.data]);

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
      let processedData = data;
      if (projectKey) {
        try {
          // Encrypt the environment variables data
          processedData = await encryptDataField(data, projectKey);
        } catch (encryptError) {
          console.error("Failed to encrypt environment variables:", encryptError);
          // Fallback to unencrypted data
          processedData = data;
        }
      }

      const payload = {
        title,
        data: processedData,
        notes: notes || null,
        tags,
      };

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/env/${env.id}`,
        payload
      );

      if (response.status === 200 || response.status === 201 || (response.data && (response.data.status_code === 200 || response.data.status_code === 201))) {
        onEnvUpdated();
        onOpenChange(false);
        toast({
          title: safeTranslate("env_updated_successfully", "env", { default: "Environment variables updated successfully" }),
          description: safeTranslate("env_updated_description", "env", { default: "The environment variables have been updated." }),
        });
      } else {
        throw new Error(response.data?.message || safeTranslate("failed_to_update_env", "env", { default: "Failed to update environment variables" }));
      }
    } catch (error: any) {
      console.error("Error updating environment variables:", error);
      if (error.response?.status === 422) {
        setError(safeTranslate("invalid_input_data", "env", { default: "Invalid input data" }));
      } else {
        setError(error.response?.data?.message || safeTranslate("failed_to_update_env", "env", { default: "Failed to update environment variables" }));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{safeTranslate("edit_env", "env", { default: "Edit Environment Variables" })}</DialogTitle>
            <DialogDescription>
              {safeTranslate("edit_env_description", "env", { default: "Update your environment variables details below" })}
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
                {isDecrypting ? (
                  <div className="flex items-center justify-center p-4 border rounded-md min-h-[150px]">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-sm text-muted-foreground">
                        {safeTranslate("decrypting", "env", { default: "Decrypting environment variables..." })}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <Textarea
                      id="data"
                      placeholder={safeTranslate("enter_env_variables", "env", { default: "KEY=value\nANOTHER_KEY=another_value" })}
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                      className={`min-h-[150px] ${error && !data ? "border-red-500" : ""}`}
                      onClick={() => setCodeEditorOpen(true)}
                      readOnly
                    />
                    <div className="absolute top-0 right-0 flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 px-3 text-muted-foreground"
                        onClick={() => setShowEnvData(!showEnvData)}
                        type="button"
                      >
                        {showEnvData ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-10 px-3 text-muted-foreground"
                        onClick={() => setCodeEditorOpen(true)}
                        type="button"
                      >
                        <Code className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
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
              disabled={isSubmitting || isDecrypting}
            >
              {safeTranslate("cancel", "actions", { default: "Cancel" })}
            </Button>
            <Button 
              type="button" 
              onClick={handleSubmit} 
              disabled={isSubmitting || isDecrypting}
            >
              {isSubmitting
                ? safeTranslate("saving", "actions", { default: "Saving..." })
                : safeTranslate("save", "actions", { default: "Save" })}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <EnvCodeEditor
        value={data}
        onChange={setData}
        open={codeEditorOpen}
        onOpenChange={setCodeEditorOpen}
        title={safeTranslate("edit_env", "env", { default: "Edit Environment Variables" })}
      />
    </>
  );
}
