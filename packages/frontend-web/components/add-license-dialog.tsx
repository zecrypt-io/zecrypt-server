"use client";

import { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Eye, EyeOff, X, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddLicenseDialogProps {
  open: boolean;
  onClose: () => void;
  onLicenseAdded: () => void;
}

export function AddLicenseDialog({ open, onClose, onLicenseAdded }: AddLicenseDialogProps) {
  const { translate } = useTranslator();
  const [name, setName] = useState("");
  const [software, setSoftware] = useState("");
  const [licenseKey, setLicenseKey] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["Design", "Creative", "Productivity", "Office", "Development", "Game", "Subscription"];

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
  };

  const resetForm = () => {
    setName("");
    setSoftware("");
    setLicenseKey("");
    setExpiryDate("");
    setNotes("");
    setTags([]);
    setNewTag("");
    setShowLicenseKey(false);
    setError("");
    setIsSubmitting(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async () => {
    if (!name || !licenseKey) {
      setError(translate("please_fill_all_required_fields", "licenses", { default: "Please fill all required fields" }));
      return;
    }

    if (!selectedWorkspaceId || !selectedProjectId) {
      setError(translate("no_project_selected", "licenses", { default: "No project selected" }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Prepare the license data for the 'data' field
      const licenseDataForDataField = {
        license_key: licenseKey
      };

      // Prepare payload according to API specification
      const payload = {
        title: name,
        data: JSON.stringify(licenseDataForDataField),
        software: software || null,
        notes: notes || null,
        tags,
        expires_at: expiryDate || null
      };

      const response = await axiosInstance.post(
        `/${selectedWorkspaceId}/${selectedProjectId}/licenses`,
        payload
      );

      if (response.status === 200 || response.status === 201) {
        toast({
          title: translate("success", "common", { default: "Success" }),
          description: translate("license_added_successfully", "licenses", { default: "License added successfully" }),
        });
        onLicenseAdded();
        handleClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_add_license", "licenses", { default: "Failed to add license" }));
      }
    } catch (error: any) {
      console.error("Error adding license:", error);
      
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || translate("invalid_input", "licenses", { default: "Invalid input" }));
        } else if (error.response.status === 422) {
          const errorMessages = error.response.data?.detail?.map((err: any) => err.msg).join(", ");
          setError(errorMessages || translate("validation_error", "licenses", { default: "Validation error" }));
        } else {
          setError(error.response.data?.message || translate("failed_to_add_license", "licenses", { default: "Failed to add license" }));
        }
      } else if (error.request) {
        setError(translate("network_error", "licenses", { default: "Network error" }));
      } else {
        setError(`${translate("error_adding_license", "licenses", { default: "Error adding license" })}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translate("add_new_license", "licenses", { default: "Add New License" })}</DialogTitle>
          <DialogDescription>
            {translate("add_new_license_description", "licenses", { default: "Enter your software license details below" })}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="p-2 bg-red-50 border border-red-200 rounded-md flex items-center gap-2 text-red-600">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              {translate("name", "licenses", { default: "Name" })} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder={translate("enter_license_name", "licenses", { default: "Enter license name" })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="software">
              {translate("software", "licenses", { default: "Software" })}
            </Label>
            <Input
              id="software"
              placeholder={translate("enter_software_name", "licenses", { default: "Enter software name" })}
              value={software}
              onChange={(e) => setSoftware(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="license_key">
              {translate("license_key", "licenses", { default: "License Key" })} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="license_key"
                type={showLicenseKey ? "text" : "password"}
                placeholder={translate("enter_license_key", "licenses", { default: "Enter license key" })}
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="pr-8"
                required
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground"
                onClick={() => setShowLicenseKey(!showLicenseKey)}
                type="button"
              >
                {showLicenseKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiry_date">
              {translate("expiry_date", "licenses", { default: "Expiry Date" })}
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">
              {translate("notes", "licenses", { default: "Notes" })}
            </Label>
            <Textarea
              id="notes"
              placeholder={translate("enter_notes", "licenses", { default: "Enter notes" })}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>
              {translate("tags", "licenses", { default: "Tags" })}
            </Label>
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
                placeholder={translate("add_a_tag", "licenses", { default: "Add a tag" })}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            {translate("cancel", "licenses", { default: "Cancel" })}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? translate("adding", "licenses", { default: "Adding..." }) 
              : translate("add_license", "licenses", { default: "Add License" })
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 