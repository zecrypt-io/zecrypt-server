"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useTranslator } from "@/hooks/use-translations";
import { toast } from "@/components/ui/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { encryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";

interface AddIdentityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onIdentityAdded: () => void;
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
}

export function AddIdentityDialog({
  open,
  onOpenChange,
  onIdentityAdded,
  selectedWorkspaceId,
  selectedProjectId,
}: AddIdentityDialogProps) {
  const { translate } = useTranslator();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [title, setTitle] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [nationalId, setNationalId] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [currentTag, setCurrentTag] = useState("");
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  const handleAddTag = () => {
    if (currentTag.trim() && !tags.includes(currentTag.trim())) {
      setTags([...tags, currentTag.trim()]);
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    if (!title.trim()) {
      errors.title = translate("title_required", "identity", { default: "Title is required" });
    }

    if (!nationalId.trim()) {
      errors.nationalId = translate("national_id_required", "identity", { default: "National ID is required" });
    }

    // Email validation only if provided
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = translate("invalid_email", "identity", { default: "Invalid email format" });
    }

    // Date validation for date of birth if provided
    if (dateOfBirth && !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
      errors.dateOfBirth = translate("invalid_date_format", "identity", { default: "Invalid date format (YYYY-MM-DD)" });
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({
        title: translate("error", "actions"),
        description: translate("missing_workspace_project", "identity", { default: "Missing workspace or project" }),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare the data field as a JSON string with fields to be encrypted
      const dataToEncrypt = {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: phone,
        address: address,
        date_of_birth: dateOfBirth,
        national_id: nationalId
      };

      // Find the current project to get its name
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        toast({
          title: translate("error", "actions"),
          description: translate("project_not_found", "identity", { default: "Project not found" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Get the project's AES key from session storage
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      
      if (!projectAesKey) {
        toast({
          title: translate("error", "actions"),
          description: translate("encryption_key_not_found", "identity", { default: "Encryption key not found" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Encrypt the data
      let encryptedData;
      try {
        encryptedData = await encryptDataField(JSON.stringify(dataToEncrypt), projectAesKey);
      } catch (encryptError) {
        console.error("Failed to encrypt identity data:", encryptError);
        toast({
          title: translate("error", "actions"),
          description: translate("encryption_failed", "identity", { default: "Failed to encrypt identity data" }),
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const payload = {
        title,
        data: encryptedData,
        notes: notes || null,
        tags: tags.length > 0 ? tags : undefined,
      };

      await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/identity`,
        payload
      );

      toast({
        title: translate("success", "actions"),
        description: translate("identity_added_successfully", "identity", { default: "Identity added successfully" }),
      });

      // Reset form
      setTitle("");
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setAddress("");
      setDateOfBirth("");
      setNationalId("");
      setNotes("");
      setTags([]);
      setCurrentTag("");
      setValidationErrors({});

      onIdentityAdded();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error adding identity:", error);
      let errorMessage = translate("error_adding_identity", "identity", { default: "Error adding identity" });
      if (error.response?.data?.message) {
        errorMessage = `${errorMessage}: ${error.response.data.message}`;
      }
      toast({
        title: translate("error", "actions"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{translate("add_new_identity", "identity", { default: "Add New Identity" })}</DialogTitle>
          <DialogDescription>
            {translate("add_new_identity_description", "identity", { default: "Enter your identity details below" })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <div className="space-y-1">
            <Label htmlFor="title" className="text-sm">{translate("title", "identity", { default: "Title" })}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={translate("title_placeholder", "identity", { default: "Personal Identity" })}
              className={`h-8 ${validationErrors.title ? "border-red-500" : ""}`}
            />
            {validationErrors.title && (
              <p className="text-red-500 text-xs">{validationErrors.title}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="first_name" className="text-sm">{translate("first_name", "identity", { default: "First Name" })}</Label>
              <Input
                id="first_name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder={translate("first_name_placeholder", "identity", { default: "John" })}
                className={`h-8 ${validationErrors.firstName ? "border-red-500" : ""}`}
              />
              {validationErrors.firstName && (
                <p className="text-red-500 text-xs">{validationErrors.firstName}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="last_name" className="text-sm">{translate("last_name", "identity", { default: "Last Name" })}</Label>
              <Input
                id="last_name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder={translate("last_name_placeholder", "identity", { default: "Doe" })}
                className={`h-8 ${validationErrors.lastName ? "border-red-500" : ""}`}
              />
              {validationErrors.lastName && (
                <p className="text-red-500 text-xs">{validationErrors.lastName}</p>
              )}
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="email" className="text-sm">{translate("email", "identity", { default: "Email" })}</Label>
            <Input
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={translate("email_placeholder", "identity", { default: "john.doe@example.com" })}
              className={`h-8 ${validationErrors.email ? "border-red-500" : ""}`}
            />
            {validationErrors.email && (
              <p className="text-red-500 text-xs">{validationErrors.email}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="phone" className="text-sm">{translate("phone", "identity", { default: "Phone" })}</Label>
            <Input
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={translate("phone_placeholder", "identity", { default: "+1 (555) 123-4567" })}
              className="h-8"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="address" className="text-sm">{translate("address", "identity", { default: "Address" })}</Label>
            <Textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder={translate("address_placeholder", "identity", { default: "123 Main St, Anytown, CA 94001" })}
              rows={2}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="date_of_birth" className="text-sm">{translate("date_of_birth", "identity", { default: "Date of Birth" })}</Label>
            <Input
              id="date_of_birth"
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className={`h-8 ${validationErrors.dateOfBirth ? "border-red-500" : ""}`}
            />
            {validationErrors.dateOfBirth && (
              <p className="text-red-500 text-xs">{validationErrors.dateOfBirth}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="national_id" className="flex items-center gap-1 text-sm">
              {translate("national_id", "identity", { default: "National ID" })}
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="national_id"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder={translate("national_id_placeholder", "identity", { default: "123-45-6789" })}
              className={`h-8 ${validationErrors.nationalId ? "border-red-500" : ""}`}
            />
            {validationErrors.nationalId && (
              <p className="text-red-500 text-xs">{validationErrors.nationalId}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="notes" className="text-sm">{translate("notes", "identity", { default: "Notes" })}</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={translate("notes_placeholder", "identity", { default: "Additional information" })}
              rows={2}
              className="min-h-[60px]"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="tags" className="text-sm">{translate("tags", "identity", { default: "Tags" })}</Label>
            <div className="flex gap-2">
              <Input
                id="tags"
                value={currentTag}
                onChange={(e) => setCurrentTag(e.target.value)}
                placeholder={translate("tags_placeholder", "identity", { default: "Add tags" })}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                className="h-8"
              />
              <Button type="button" onClick={handleAddTag} className="h-8">
                {translate("add", "identity", { default: "Add" })}
              </Button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="flex items-center gap-1 text-xs">
                    {tag}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => handleRemoveTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button
            type="button"
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
            className="h-8"
          >
            {translate("cancel", "identity", { default: "Cancel" })}
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={isSubmitting} className="h-8">
            {isSubmitting
              ? translate("adding", "identity", { default: "Adding..." })
              : translate("add_identity", "identity", { default: "Add Identity" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 