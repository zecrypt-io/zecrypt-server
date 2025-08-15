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
// encryption disabled for desktop local mode
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

interface EditSSHKeyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSSHKeyUpdated: () => void;
  existingSSHKeys: SSHKey[];
  sshKey: SSHKey;
}

export function EditSSHKeyDialog({
  open,
  onOpenChange,
  onSSHKeyUpdated,
  existingSSHKeys,
  sshKey,
}: EditSSHKeyDialogProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState(sshKey.name);
  const [sshKeyValue, setSshKeyValue] = useState(sshKey.ssh_key);
  const [notes, setNotes] = useState(sshKey.notes || "");
  const [tags, setTags] = useState<string[]>(sshKey.tags || []);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [nameExistsError, setNameExistsError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    // Check if name exists in other SSH keys (excluding current one)
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
    if (!name || !sshKeyValue) {
      setError(translate("please_fill_all_required_fields", "ssh_keys", {
        default: "Please fill name and SSH key",
      }));
      return false;
    }

    if (name !== sshKey.name && checkIfNameExists(name)) {
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
      console.error("Missing required data for updating SSH key:", {
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
        ssh_key: sshKeyValue
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(sshKeyData);
      
      const encryptedData = jsonData;

      // Send to API
      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/ssh-keys/${sshKey.doc_id}`,
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
        description: translate("ssh_key_updated_successfully", "ssh_keys", {
          default: "SSH key updated successfully",
        }),
      });

      // Close dialog and refresh data
      onSSHKeyUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error updating SSH key:", error);
      setError(
        translate("error_updating_ssh_key", "ssh_keys", {
          default: "Error updating SSH key. Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Update form fields when sshKey prop changes
  useEffect(() => {
    if (open && sshKey) {
      setName(sshKey.name);
      setSshKeyValue(sshKey.ssh_key);
      setNotes(sshKey.notes || "");
      setTags(sshKey.tags || []);
      setError("");
      setNameExistsError(null);
    }
  }, [open, sshKey]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {translate("edit_ssh_key", "ssh_keys", { default: "Edit SSH Key" })}
          </DialogTitle>
          <DialogDescription>
            {translate("edit_ssh_key_description", "ssh_keys", {
              default: "Update the details of your SSH key",
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
              onBlur={(e) => name !== sshKey.name && checkIfNameExists(e.target.value)}
              className={nameExistsError ? "border-destructive" : ""}
            />
            {nameExistsError && (
              <p className="text-sm text-destructive">{nameExistsError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sshKeyValue">
              {translate("ssh_key", "ssh_keys", { default: "SSH Key" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Textarea
              id="sshKeyValue"
              placeholder={translate("ssh_key_placeholder", "ssh_keys", { default: "Paste your SSH private key here" })}
              value={sshKeyValue}
              onChange={(e) => setSshKeyValue(e.target.value)}
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
              ? translate("saving", "ssh_keys", { default: "Saving..." })
              : translate("save_changes", "ssh_keys", { default: "Save Changes" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 