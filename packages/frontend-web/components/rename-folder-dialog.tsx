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

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
}

interface RenameFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderRenamed: () => void;
  folder: Folder;
  onRenameFolder: (folderId: string, newName: string, parentId: string | null) => Promise<void>;
}

export function RenameFolderDialog({
  open,
  onOpenChange,
  onFolderRenamed,
  folder,
  onRenameFolder,
}: RenameFolderDialogProps) {
  const { translate } = useTranslator();
  const [folderName, setFolderName] = useState(folder.name);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setFolderName(folder.name);
  }, [folder]);

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
      await onRenameFolder(folder.folder_id, folderName, folder.parent_id);
      onFolderRenamed();
      onOpenChange(false);
    } catch (error) {
      console.error("Error renaming folder:", error);
      setError(
        translate("error_renaming_folder", "drive", {
          default: "Error renaming folder. Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>
            {translate("rename_folder", "drive", { default: "Rename Folder" })}
          </DialogTitle>
          <DialogDescription>
            {translate("rename_folder_description", "drive", {
              default: `Rename "${folder.name}"`,
              folderName: folder.name,
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
              ? translate("renaming", "drive", { default: "Renaming..." })
              : translate("rename", "drive", { default: "Rename" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

