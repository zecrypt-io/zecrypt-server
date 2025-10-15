"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useTranslator } from "@/hooks/use-translations";

interface DriveFile {
  file_id: string;
  name: string;
}

interface RenameFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile | null;
  onRename: (fileId: string, newName: string) => Promise<void>;
}

export function RenameFileDialog({
  open,
  onOpenChange,
  file,
  onRename,
}: RenameFileDialogProps) {
  const { translate } = useTranslator();
  const [newName, setNewName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Initialize name when file changes
  useEffect(() => {
    if (file) {
      setNewName(file.name);
      setError("");
    }
  }, [file]);

  const handleSubmit = async () => {
    if (!file) return;

    // Validation
    if (!newName.trim()) {
      setError(translate("name_required", "drive", { default: "File name is required" }));
      return;
    }

    if (newName.trim() === file.name) {
      setError(translate("name_unchanged", "drive", { default: "Please enter a different name" }));
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      await onRename(file.file_id, newName.trim());
      onOpenChange(false);
      setNewName("");
    } catch (error) {
      console.error("Error renaming file:", error);
      setError(translate("rename_failed", "drive", { default: "Failed to rename file" }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {translate("rename_file", "drive", { default: "Rename File" })}
          </DialogTitle>
          <DialogDescription>
            {file && (
              <>
                {translate("renaming", "drive", { default: "Renaming" })}: <strong>{file.name}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="file-name">
              {translate("file_name", "drive", { default: "File Name" })}
            </Label>
            <Input
              id="file-name"
              value={newName}
              onChange={(e) => {
                setNewName(e.target.value);
                setError("");
              }}
              onKeyDown={handleKeyDown}
              placeholder={translate("enter_file_name", "drive", {
                default: "Enter file name",
              })}
              disabled={isSubmitting}
              autoFocus
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            {translate("cancel", "actions", { default: "Cancel" })}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting
              ? translate("renaming", "drive", { default: "Renaming..." })
              : translate("rename", "actions", { default: "Rename" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

