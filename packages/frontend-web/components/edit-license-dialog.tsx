"use client";

import { useState, useEffect } from "react";
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

interface License {
  doc_id: string;
  title?: string;
  name?: string;
  license_key?: string;
  expiry_date?: string;
  software?: string;
  notes?: string | null;
  tags?: string[];
  data?: string | { license_key: string; expiry_date: string | null };
  created_at: string;
  updated_at: string;
}

interface EditLicenseDialogProps {
  license: License;
  open: boolean;
  onClose: () => void;
  onLicenseUpdated: () => void;
}

export function EditLicenseDialog({ license, open, onClose, onLicenseUpdated }: EditLicenseDialogProps) {
  const { translate } = useTranslator();

  // Parse the license_key and expiry_date from license.data if it's a JSON string
  const parseLicenseData = () => {
    try {
      if (license.data && typeof license.data === 'string') {
        try {
          const parsedData = JSON.parse(license.data);
          if (parsedData && typeof parsedData === 'object') {
            return parsedData;
          }
        } catch (e) {
          // If not parseable as JSON, just use as-is
        }
      } else if (license.data && typeof license.data === 'object') {
        return license.data;
      }
      return { 
        license_key: license.license_key || '', 
        expiry_date: license.expiry_date || '' 
      };
    } catch (e) {
      return { 
        license_key: license.license_key || '', 
        expiry_date: license.expiry_date || '' 
      };
    }
  };

  const licenseData = parseLicenseData();

  const [name, setName] = useState(license.title || license.name || "");
  const [software, setSoftware] = useState(license.software || "");
  const [licenseKey, setLicenseKey] = useState(licenseData.license_key || "");
  const [expiryDate, setExpiryDate] = useState(licenseData.expiry_date || "");
  const [notes, setNotes] = useState(license.notes || "");
  const [tags, setTags] = useState<string[]>(license.tags || []);
  const [newTag, setNewTag] = useState("");
  const [showLicenseKey, setShowLicenseKey] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);
  const selectedProjectId = useSelector((state: RootState) => state.workspace.selectedProjectId);

  const predefinedTags = ["Design", "Creative", "Productivity", "Office", "Development", "Game", "Subscription"];

  // Format the expiry date to YYYY-MM-DD for input[type="date"]
  useEffect(() => {
    if (expiryDate) {
      try {
        const date = new Date(expiryDate);
        if (!isNaN(date.getTime())) {
          setExpiryDate(date.toISOString().split('T')[0]);
        }
      } catch (e) {
        // Keep the original value if parsing fails
      }
    }
  }, []);

  const addTag = (tag: string) => {
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setTags(tags.filter((t) => t !== tag));
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

      const response = await axiosInstance.put(
        `/${selectedWorkspaceId}/${selectedProjectId}/licenses/${license.doc_id}`,
        payload
      );

      if (response.status === 200) {
        toast({
          title: translate("success", "common", { default: "Success" }),
          description: translate("license_updated_successfully", "licenses", { default: "License updated successfully" }),
        });
        onLicenseUpdated();
        onClose();
      } else {
        throw new Error(response.data?.message || translate("failed_to_update_license", "licenses", { default: "Failed to update license" }));
      }
    } catch (error: any) {
      console.error("Error updating license:", error);
      
      if (error.response) {
        if (error.response.status === 400) {
          setError(error.response.data?.message || translate("invalid_input", "licenses", { default: "Invalid input" }));
        } else if (error.response.status === 422) {
          const errorMessages = error.response.data?.detail?.map((err: any) => err.msg).join(", ");
          setError(errorMessages || translate("validation_error", "licenses", { default: "Validation error" }));
        } else if (error.response.status === 404) {
          setError(translate("license_not_found", "licenses", { default: "License not found" }));
        } else {
          setError(error.response.data?.message || translate("failed_to_update_license", "licenses", { default: "Failed to update license" }));
        }
      } else if (error.request) {
        setError(translate("network_error", "licenses", { default: "Network error" }));
      } else {
        setError(`${translate("error_updating_license", "licenses", { default: "Error updating license" })}: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{translate("edit_license", "licenses", { default: "Edit License" })}</DialogTitle>
          <DialogDescription>
            {translate("edit_license_description", "licenses", { default: "Update your software license details" })}
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
            <Label htmlFor="edit_name">
              {translate("software_name", "licenses", { default: "Software Name" })} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="edit_name"
              placeholder={translate("enter_software_name", "licenses", { default: "Enter software name" })}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_license_key">
              {translate("license_key", "licenses", { default: "License Key" })} <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="edit_license_key"
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
            <Label htmlFor="edit_expiry_date">
              {translate("expiry_date", "licenses", { default: "Expiry Date" })}
            </Label>
            <Input
              id="edit_expiry_date"
              type="date"
              value={expiryDate}
              onChange={(e) => setExpiryDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit_notes">
              {translate("notes", "licenses", { default: "Notes" })}
            </Label>
            <Textarea
              id="edit_notes"
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
                  className={`cursor-pointer ${tags.includes(tag) ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  onClick={() => !tags.includes(tag) && addTag(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            {translate("cancel", "licenses", { default: "Cancel" })}
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting 
              ? translate("updating", "licenses", { default: "Updating..." }) 
              : translate("update", "licenses", { default: "Update" })
            }
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 