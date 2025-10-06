"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AddFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderCreated: () => void;
  parentFolder: { folder_id: string; name: string } | null;
  onCreateFolder: (name: string, parentId: string | null) => Promise<void>;
}

export function AddFolderDialog({
  open,
  onOpenChange,
  onFolderCreated,
  parentFolder,
  onCreateFolder,
}: AddFolderDialogProps) {
  const { translate } = useTranslator();
  const [folderName, setFolderName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    if (!folderName.trim()) {
      setError(
        translate("folder_name_required", "drive", {
          default: "Folder name is required",
        })
      );
      return false;
    }
    setError("");
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await onCreateFolder(folderName, parentFolder?.folder_id || null);
      resetForm();
      onFolderCreated();
      onOpenChange(false);
    } catch (error) {
      console.error("Error creating folder:", error);
      setError(
        translate("error_creating_folder", "drive", {
          default: "Error creating folder. Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFolderName("");
    setError("");
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {translate("create_folder", "drive", { default: "Create Folder" })}
          </DialogTitle>
          <DialogDescription>
            {parentFolder
              ? translate("create_subfolder_in", "drive", {
                  default: `Create a new folder in "${parentFolder.name}"`,
                  folderName: parentFolder.name,
                })
              : translate("create_new_folder", "drive", {
                  default: "Create a new folder in root",
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
            <Label htmlFor="folderName">
              {translate("folder_name", "drive", { default: "Folder Name" })}
              <span className="text-destructive"> *</span>
            </Label>
            <Input
              id="folderName"
              placeholder={translate("folder_name_placeholder", "drive", {
                default: "My Folder",
              })}
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isSubmitting) {
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {translate("cancel", "drive", { default: "Cancel" })}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("creating", "drive", { default: "Creating..." })
              : translate("create", "drive", { default: "Create" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

