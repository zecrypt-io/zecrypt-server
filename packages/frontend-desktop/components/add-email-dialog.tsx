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
import { secureGetItem } from "@/libs/local-storage-utils";

interface Email {
  doc_id: string;
  title: string;
  lower_title: string;
  data: string;
  email_address: string;
  imap_server: string;
  smtp_server: string;
  username: string;
  password: string;
  notes?: string | null;
  tags?: string[];
  created_at: string;
  updated_at: string | null;
  created_by: string;
  project_id: string;
}

interface AddEmailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailAdded: () => void;
  existingEmails: Email[];
}

export function AddEmailDialog({
  open,
  onOpenChange,
  onEmailAdded,
  existingEmails,
}: AddEmailDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [imapServer, setImapServer] = useState("");
  const [smtpServer, setSmtpServer] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [error, setError] = useState("");
  const [titleExistsError, setTitleExistsError] = useState<string | null>(null);
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
          console.log("Loading project key for email:", selectedProjectName);
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

  const predefinedTags = ["personal", "work", "finance", "important"];

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

  const checkIfTitleExists = (title: string) => {
    if (!title.trim()) {
      setTitleExistsError(translate("please_fill_all_required_fields", "emails", {
        default: "Please fill all required fields",
      }));
      return false;
    }

    const exists = existingEmails.some(
      (email) => email.title.toLowerCase().trim() === title.toLowerCase().trim()
    );

    if (exists) {
      setTitleExistsError(translate("email_title_already_exists", "emails", {
        default: "Email with this title already exists",
      }));
      return true;
    } else {
      setTitleExistsError(null);
      return false;
    }
  };

  const validateForm = () => {
    if (!title || !emailAddress || !password) {
      setError(translate("please_fill_all_required_fields", "emails", {
        default: "Please fill title, email address and password",
      }));
      return false;
    }

    if (!/\S+@\S+\.\S+/.test(emailAddress)) {
      setError(translate("invalid_email_format", "emails", {
        default: "Invalid email format",
      }));
      return false;
    }

    if (checkIfTitleExists(title)) {
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
      console.error("Missing required data for adding email:", {
        selectedWorkspaceId,
        selectedProjectId,
      });
      setError(translate("missing_required_data", "emails", {
        default: "Missing required project data",
      }));
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data object
      const emailData = {
        email_address: emailAddress,
        imap_server: imapServer,
        smtp_server: smtpServer,
        username: username || emailAddress, // Use email as username if not provided
        password: password
      };

      // Convert to JSON string
      const jsonData = JSON.stringify(emailData);
      
      const encryptedData = jsonData;

      // Send to API
      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/emails`,
        {
          title,
          data: encryptedData,
          notes: notes || null,
          tags: tags.length > 0 ? tags : null,
        }
      );

      // Handle success
      toast({
        title: translate("success", "emails", { default: "Success" }),
        description: translate("email_added_successfully", "emails", {
          default: "Email account added successfully",
        }),
      });

      // Reset form and close dialog
      resetForm();
      onEmailAdded();
      onOpenChange(false);
    } catch (error) {
      console.error("Error adding email:", error);
      setError(
        translate("error_adding_email", "emails", {
          default: "Error adding email account. Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setEmailAddress("");
    setImapServer("");
    setSmtpServer("");
    setUsername("");
    setPassword("");
    setNotes("");
    setTags([]);
    setNewTag("");
    setError("");
    setTitleExistsError(null);
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
            {translate("add_email", "emails", { default: "Add Email Account" })}
          </DialogTitle>
          <DialogDescription>
            {translate("add_email_description", "emails", {
              default: "Add a new email account to your secure vault",
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
            <Label htmlFor="title">
              {translate("title", "emails", { default: "Title" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="title"
              placeholder={translate("title_placeholder", "emails", { default: "Work Email" })}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (titleExistsError) {
                  checkIfTitleExists(e.target.value);
                }
              }}
              onBlur={(e) => checkIfTitleExists(e.target.value)}
              className={titleExistsError ? "border-destructive" : ""}
            />
            {titleExistsError && (
              <p className="text-sm text-destructive">{titleExistsError}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailAddress">
              {translate("email_address", "emails", { default: "Email Address" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="emailAddress"
              placeholder={translate("email_address_placeholder", "emails", { default: "your.email@example.com" })}
              value={emailAddress}
              onChange={(e) => setEmailAddress(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="imapServer">
                {translate("imap_server", "emails", { default: "IMAP Server" })}
              </Label>
              <Input
                id="imapServer"
                placeholder={translate("imap_server_placeholder", "emails", { default: "imap.example.com" })}
                value={imapServer}
                onChange={(e) => setImapServer(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpServer">
                {translate("smtp_server", "emails", { default: "SMTP Server" })}
              </Label>
              <Input
                id="smtpServer"
                placeholder={translate("smtp_server_placeholder", "emails", { default: "smtp.example.com" })}
                value={smtpServer}
                onChange={(e) => setSmtpServer(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="username">
              {translate("username", "emails", { default: "Username" })}
            </Label>
            <Input
              id="username"
              placeholder={translate("username_placeholder", "emails", { default: "Optional, defaults to email address" })}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">
              {translate("password", "emails", { default: "Password" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="password"
              type="password"
              placeholder={translate("password_placeholder", "emails", { default: "Enter password" })}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {translate("notes", "emails", { default: "Notes (optional)" })}
            </Label>
            <Textarea
              id="notes"
              placeholder={translate("notes_placeholder", "emails", { default: "Additional information about this email account" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tags">
              {translate("tags", "emails", { default: "Tags (optional)" })}
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
                      {translate("remove", "emails", { default: "Remove" })}
                    </span>
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                id="tags"
                placeholder={translate("add_tag", "emails", { default: "Add tag" })}
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
                  {translate("add", "emails", { default: "Add" })}
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
            {translate("cancel", "emails", { default: "Cancel" })}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("adding", "emails", { default: "Adding..." })
              : translate("add", "emails", { default: "Add" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 