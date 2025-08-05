"use client";

import { useState, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { X, Plus, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { encryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SSHKey {
  doc_id: string;
  title: string;
  name: string;
  lower_title: string;
  data: string;
  ssh_key: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface AddSSHKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSSHKeyAdded: () => void;
  existingSSHKeys: SSHKey[];
}

export function AddSSHKeyDialog({
  open,
  onOpenChange,
  onSSHKeyAdded,
  existingSSHKeys,
}: AddSSHKeyDialogProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState("");
  const [sshKey, setSshKey] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [nameExistsError, setNameExistsError] = useState<string | null>(null);
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

  // Load the project key once when the dialog opens or project changes
  useEffect(() => {
    const loadProjectKey = async () => {
      if (open && selectedProjectName) {
        try {
          console.log("Loading project key for SSH key:", selectedProjectName);
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

  const predefinedTags = ["github", "gitlab", "server", "development"];

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

  const checkIfNameExists = (name: string) => {
    if (!name.trim()) {
      setNameExistsError(translate("please_fill_all_required_fields", "ssh_keys", {
        default: "Please fill all required fields",
      }));
      return false;
    }

    const exists = existingSSHKeys.some(
      (key) => key.name.toLowerCase().trim() === name.toLowerCase().trim()
    );

    if (exists) {
      setNameExistsError(translate("ssh_key_name_already_exists", "ssh_keys", {
        default: "SSH key with this name already exists",
      }));
      return true;
    } else {
      setNameExistsError(null);
      return false;
    }
  };

  const validateForm = () => {
    if (!name || !sshKey) {
      setError(translate("please_fill_all_required_fields", "ssh_keys", {
        default: "Please fill name and SSH key",
      }));
      return false;
    }

    if (checkIfNameExists(name)) {
      return false;
    }

    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      console.error("Missing required data for adding SSH key:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("missing_required_data", "ssh_keys", {
        default: "Missing required project data",
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data object
      const sshKeyData = {
        ssh_key: sshKey
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(sshKeyData);
      
      let encryptedData = jsonData;

      // Encrypt if we have a project key
      if (projectKey) {
        try {
          encryptedData = await encryptDataField(jsonData, projectKey);
          console.log("Data encrypted successfully");
        } catch (encryptError) {
          console.error("Error encrypting data:", encryptError);
          toast({
            title: translate("encryption_error", "ssh_keys", { default: "Encryption Error" }),
            description: translate("could_not_encrypt_data", "ssh_keys", {
              default: "Could not encrypt data. Please try again.",
            }),
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        }
      } else {
        console.warn("No project key available for encryption");
      }

      // Send to API
      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/ssh-keys`,
        {
          title: name, // Using name as title since the API expects title field
          data: encryptedData,
          notes: notes || null,
          tags: tags.length > 0 ? tags : null,
        }
      );

      // Handle success
      toast({
        title: translate("success", "ssh_keys", { default: "Success" }),
        description: translate("ssh_key_added_successfully", "ssh_keys", {
          default: "SSH key added successfully",
        }),
      });

      // Reset form and close dialog
      resetForm();
      onSSHKeyAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding SSH key:", error);
      setError(
        translate("error_adding_ssh_key", "ssh_keys", {
          default: "Error adding SSH key. Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setName("");
    setSshKey("");
    setNotes("");
    setTags([]);
    setNewTag("");
    setError("");
    setNameExistsError(null);
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {translate("add_ssh_key", "ssh_keys", { default: "Add SSH Key" })}
          </DialogTitle>
          <DialogDescription>
            {translate("add_ssh_key_description", "ssh_keys", {
              default: "Add a new SSH key to your secure vault",
            })}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 pb-4">
          {error && (
            <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
              <div>{error}</div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">
              {translate("name", "ssh_keys", { default: "Name" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="name"
              placeholder={translate("name_placeholder", "ssh_keys", { default: "GitHub SSH Key" })}
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameExistsError) {
                  checkIfNameExists(e.target.value);
                }
              }}
              onBlur={(e) => checkIfNameExists(e.target.value)}
              className={nameExistsError ? "border-destructive" : ""}
            />
            {nameExistsError && (
              <p className="text-sm text-destructive">{nameExistsError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sshKey">
              {translate("ssh_key", "ssh_keys", { default: "SSH Key" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Textarea
              id="sshKey"
              placeholder={translate("ssh_key_placeholder", "ssh_keys", { default: "Paste your SSH private key here" })}
              value={sshKey}
              onChange={(e) => setSshKey(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {translate("notes", "ssh_keys", { default: "Notes (optional)" })}
            </Label>
            <Textarea
              id="notes"
              placeholder={translate("notes_placeholder", "ssh_keys", { default: "Additional information about this SSH key" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              {translate("tags", "ssh_keys", { default: "Tags (optional)" })}
            </Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs py-1.5">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-1 text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                    <span className="sr-only">
                      {translate("remove", "ssh_keys", { default: "Remove" })}
                    </span>
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder={translate("add_tag", "ssh_keys", { default: "Add tag" })}
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newTag.trim()) {
                    e.preventDefault();
                    addTag(newTag);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => addTag(newTag)}
                disabled={!newTag.trim()}
              >
                <Plus className="h-4 w-4" />
                <span className="sr-only">
                  {translate("add", "ssh_keys", { default: "Add" })}
                </span>
              </Button>
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {predefinedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className="text-xs cursor-pointer hover:bg-muted"
                  onClick={() => addTag(tag)}
                >
                  + {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {translate("cancel", "ssh_keys", { default: "Cancel" })}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("adding", "ssh_keys", { default: "Adding..." })
              : translate("add", "ssh_keys", { default: "Add" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 