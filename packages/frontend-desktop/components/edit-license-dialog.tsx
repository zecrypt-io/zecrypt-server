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
import { encryptDataField, decryptDataField } from "@/libs/encryption";
import { secureGetItem } from "@/libs/local-storage-utils";

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
  isOpen: boolean;
  onClose: () => void;
  license: {
    doc_id: string;
    title: string;
    data: string;
    license_key: string;
    notes?: string;
    expires_at?: string;
    tags?: string[];
    project_id: string;
  };
  refetchLicenses: () => Promise<void>;
}

export function EditLicenseDialog({ isOpen, onClose, license, refetchLicenses }: EditLicenseDialogProps) {
  const { translate } = useTranslator();
  const [title, setTitle] = useState(license?.title || "");
  const [licenseKey, setLicenseKey] = useState(license?.license_key || "");
  const [expiryDate, setExpiryDate] = useState(license?.expires_at || "");
  const [notes, setNotes] = useState(license?.notes || "");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>(license?.tags || []);
  const [submitting, setSubmitting] = useState(false);
  
  // Get project info for encryption
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);
  const selectedWorkspaceId = useSelector((state: RootState) => state.workspace.selectedWorkspaceId);

  useEffect(() => {
    if (license) {
      setTitle(license.title || "");
      setLicenseKey(license.license_key || "");
      setExpiryDate(license.expires_at || "");
      setNotes(license.notes || "");
      setTags(license.tags || []);
    }
  }, [license]);

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // Find current project for encryption
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === license.project_id);
      
      if (!currentProject) {
        toast({
          title: translate("common.error"),
          description: translate("licenses.project_not_found"),
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      // Get project encryption key
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectAesKey = await secureGetItem(projectKeyName);
      
      if (!projectAesKey) {
        toast({
          title: translate("common.error"),
          description: translate("licenses.encryption_key_not_found"),
          variant: "destructive"
        });
        setSubmitting(false);
        return;
      }

      // Prepare data field with sensitive information and encrypt it
      const licenseData = JSON.stringify({ license_key: licenseKey });
      const encryptedData = await encryptDataField(licenseData, projectAesKey);

      // Create license payload with encrypted data
      const payload = {
        title,
        data: encryptedData,
        notes: notes.trim() || null,
        tags: tags.length ? tags : null,
        expires_at: expiryDate || null,
      };

      await axiosInstance.put(`/${selectedWorkspaceId}/${license.project_id}/licenses/${license.doc_id}`, payload);
      
      toast({
        title: translate("common.success"),
        description: translate("licenses.license_updated_successfully")
      });
      
      onClose();
      refetchLicenses();
    } catch (error) {
      console.error("Error updating license:", error);
      toast({
        title: translate("common.error"),
        description: translate("licenses.encryption_failed"),
        variant: "destructive"
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{translate("licenses.edit_license")}</DialogTitle>
          <DialogDescription>
            {translate("licenses.edit_license_description")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                {translate("licenses.software_name")}
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="license-key" className="text-right">
                {translate("licenses.license_key")}
              </Label>
              <Input
                id="license-key"
                value={licenseKey}
                onChange={(e) => setLicenseKey(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="expiry-date" className="text-right">
                {translate("licenses.expiry_date")}
              </Label>
              <Input
                id="expiry-date"
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="col-span-3"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right">
                {translate("licenses.notes")}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="tag" className="text-right">
                {translate("licenses.tags")}
              </Label>
              <div className="col-span-3 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="flex items-center gap-1">
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTag(t)}
                      className="rounded-full h-4 w-4 inline-flex items-center justify-center text-xs hover:bg-primary/20"
                    >
                      <X size={12} />
                    </button>
                  </Badge>
                ))}
                <div className="flex gap-2 items-center w-full">
                  <Input
                    id="tag"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    placeholder={translate("licenses.add_a_tag")}
                    className="flex-1"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    {translate("common.add")}
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              {translate("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? translate("common.saving") : translate("common.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 