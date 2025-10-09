"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Folder as FolderIcon, Home } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
}

interface DriveFile {
  file_id: string;
  name: string;
  parent_id: string | null;
}

interface MoveFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile | null;
  folders: Folder[];
  onMove: (fileIds: string[], parentId: string) => Promise<void>;
}

export function MoveFileDialog({
  open,
  onOpenChange,
  file,
  folders,
  onMove,
}: MoveFileDialogProps) {
  const { translate } = useTranslator();
  const [selectedFolderId, setSelectedFolderId] = useState<string>("root");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out folders that would create circular references
  const availableFolders = folders.filter(folder => {
    // Don't show the file's current parent
    if (file && folder.folder_id === file.parent_id) return false;
    return true;
  });

  const handleSubmit = async () => {
    if (!file) return;

    setIsSubmitting(true);

    try {
      const targetParentId = selectedFolderId === "root" ? "null" : selectedFolderId;
      await onMove([file.file_id], targetParentId);
      onOpenChange(false);
      setSelectedFolderId("root");
    } catch (error) {
      console.error("Error moving file:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {translate("move_file", "drive", { default: "Move File" })}
          </DialogTitle>
          <DialogDescription>
            {file && (
              <>
                {translate("moving", "drive", { default: "Moving" })}: <strong>{file.name}</strong>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <Label>
            {translate("select_destination", "drive", {
              default: "Select destination folder",
            })}
          </Label>
          
          <RadioGroup
            value={selectedFolderId}
            onValueChange={setSelectedFolderId}
            className="space-y-2 max-h-[300px] overflow-y-auto"
          >
            {/* Root option */}
            <div className="flex items-center space-x-2 p-2 rounded hover:bg-accent">
              <RadioGroupItem value="root" id="folder-root" />
              <Label htmlFor="folder-root" className="flex items-center gap-2 cursor-pointer flex-1">
                <Home className="h-4 w-4 text-muted-foreground" />
                <span>{translate("root", "drive", { default: "Root" })}</span>
              </Label>
            </div>

            {/* Folder options */}
            {availableFolders.map((folder) => (
              <div
                key={folder.folder_id}
                className="flex items-center space-x-2 p-2 rounded hover:bg-accent"
              >
                <RadioGroupItem value={folder.folder_id} id={`folder-${folder.folder_id}`} />
                <Label
                  htmlFor={`folder-${folder.folder_id}`}
                  className="flex items-center gap-2 cursor-pointer flex-1"
                >
                  <FolderIcon className="h-4 w-4 text-blue-500" />
                  <span>{folder.name}</span>
                </Label>
              </div>
            ))}
          </RadioGroup>

          {availableFolders.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              {translate("no_folders_available", "drive", {
                default: "No folders available",
              })}
            </p>
          )}
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
              ? translate("moving", "drive", { default: "Moving..." })
              : translate("move", "actions", { default: "Move" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

