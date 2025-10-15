"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Folder as FolderIcon } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/libs/utils";

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
}

interface MoveFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFolderMoved: () => void;
  selectedFolders: Folder[];
  allFolders: Folder[];
  onMoveFolder: (folderIds: string[], parentId: string) => Promise<void>;
}

export function MoveFolderDialog({
  open,
  onOpenChange,
  onFolderMoved,
  selectedFolders,
  allFolders,
  onMoveFolder,
}: MoveFolderDialogProps) {
  const { translate } = useTranslator();
  const [selectedDestination, setSelectedDestination] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter out folders being moved and their descendants
  const availableDestinations = allFolders.filter(folder => {
    const selectedIds = selectedFolders.map(f => f.folder_id);
    if (selectedIds.includes(folder.folder_id)) return false;
    
    // Check if this folder is a descendant of any selected folder
    let current = folder;
    while (current.parent_id) {
      if (selectedIds.includes(current.parent_id)) return false;
      const parent = allFolders.find(f => f.folder_id === current.parent_id);
      if (!parent) break;
      current = parent;
    }
    return true;
  });

  const handleSubmit = async () => {
    if (!selectedDestination) {
      setError(
        translate("select_destination", "drive", {
          default: "Please select a destination folder",
        })
      );
      return;
    }

    setIsSubmitting(true);
    try {
      await onMoveFolder(
        selectedFolders.map(f => f.folder_id),
        selectedDestination
      );
      onFolderMoved();
      onOpenChange(false);
      setSelectedDestination(null);
    } catch (error) {
      console.error("Error moving folder:", error);
      setError(
        translate("error_moving_folder", "drive", {
          default: "Error moving folder(s). Please try again.",
        })
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      setSelectedDestination(null);
      setError("");
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {translate("move_folder", "drive", { default: "Move Folder" })}
          </DialogTitle>
          <DialogDescription>
            {translate("move_folder_description", "drive", {
              default: `Moving ${selectedFolders.length} folder(s)`,
              count: selectedFolders.length,
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
            <Label>
              {translate("destination_folder", "drive", {
                default: "Select destination folder",
              })}
            </Label>
            <ScrollArea className="h-[300px] rounded-md border p-4">
              <div className="space-y-1">
                <button
                  type="button"
                  className={cn(
                    "w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left",
                    selectedDestination === "root" && "bg-primary text-primary-foreground hover:bg-primary/90"
                  )}
                  onClick={() => setSelectedDestination("root")}
                >
                  <FolderIcon className="h-4 w-4" />
                  <span>{translate("root_folder", "drive", { default: "Root" })}</span>
                </button>
                
                {availableDestinations.map((folder) => (
                  <button
                    key={folder.folder_id}
                    type="button"
                    className={cn(
                      "w-full flex items-center gap-2 p-2 rounded hover:bg-muted transition-colors text-left",
                      selectedDestination === folder.folder_id && "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                    onClick={() => setSelectedDestination(folder.folder_id)}
                  >
                    <FolderIcon className="h-4 w-4" />
                    <span>{folder.name}</span>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {translate("cancel", "drive", { default: "Cancel" })}
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !selectedDestination}>
            {isSubmitting
              ? translate("moving", "drive", { default: "Moving..." })
              : translate("move", "drive", { default: "Move" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

