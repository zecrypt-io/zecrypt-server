"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useTranslator } from "@/hooks/use-translations";

interface DriveFile {
  file_id: string;
  name: string;
}

interface DeleteFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile | null;
  onDelete: (fileIds: string[]) => Promise<void>;
}

export function DeleteFileDialog({
  open,
  onOpenChange,
  file,
  onDelete,
}: DeleteFileDialogProps) {
  const { translate } = useTranslator();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!file) return;

    setIsDeleting(true);

    try {
      await onDelete([file.file_id]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error deleting file:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {translate("delete_file", "drive", { default: "Delete File" })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {file && (
              <>
                {translate("delete_file_confirmation", "drive", {
                  default: "Are you sure you want to delete this file? This action cannot be undone.",
                })}
                <br />
                <br />
                <strong>{file.name}</strong>
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {translate("cancel", "actions", { default: "Cancel" })}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive hover:bg-destructive/90"
          >
            {isDeleting
              ? translate("deleting", "drive", { default: "Deleting..." })
              : translate("delete", "actions", { default: "Delete" })}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

