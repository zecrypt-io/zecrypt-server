"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, FileIcon } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { validateFileSize, formatBytes } from "@/libs/file-encryption";

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
}

interface UploadFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onFileUploaded: () => void;
  currentFolder: Folder | null;
  uploadFile: (file: File, parentId?: string | null) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function UploadFileDialog({
  open,
  onOpenChange,
  onFileUploaded,
  currentFolder,
  uploadFile,
  isUploading,
  uploadProgress,
}: UploadFileDialogProps) {
  const { translate } = useTranslator();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFileSelect = useCallback((file: File | null) => {
    setError("");
    
    if (!file) {
      setSelectedFile(null);
      return;
    }

    // Validate file size (50MB max)
    if (!validateFileSize(file, 50)) {
      setError(translate("file_too_large", "drive", {
        default: "File size exceeds 50MB limit",
      }));
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  }, [translate]);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  }, [handleFileSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      await uploadFile(selectedFile, currentFolder?.folder_id || null);
      setSelectedFile(null);
      setError("");
      onFileUploaded();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      // Error is handled in the hook with a toast
    }
  };

  const handleCancel = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {translate("upload_file", "drive", { default: "Upload File" })}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              {currentFolder
                ? translate("upload_to_folder", "drive", {
                    default: "Upload to {folderName}",
                    folderName: currentFolder.name,
                  })
                : translate("upload_to_root", "drive", {
                    default: "Upload a file to root",
                  })}
            </span>
            <span className="text-xs text-muted-foreground block">
              {translate("max_file_size", "drive", { default: "Maximum file size: 50MB" })}
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 overflow-y-auto flex-1">
          {/* Drag and drop zone */}
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              type="file"
              id="file-upload"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleInputChange}
              disabled={isUploading}
            />
            
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="text-sm px-2">
                <label
                  htmlFor="file-upload"
                  className="font-medium text-primary cursor-pointer hover:underline"
                >
                  {translate("choose_file", "drive", { default: "Choose a file" })}
                </label>
                <span className="text-muted-foreground">
                  {" "}
                  {translate("or_drag_drop", "drive", { default: "or drag and drop" })}
                </span>
              </div>
            </div>
          </div>

          {/* Selected file display */}
          {selectedFile && !isUploading && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg min-w-0">
              <FileIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                <p className="text-sm font-medium truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
                <p className="text-xs text-muted-foreground">{formatBytes(selectedFile.size)}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFileSelect(null)}
                className="flex-shrink-0 h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Upload progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {translate("uploading", "drive", { default: "Uploading..." })}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
              {selectedFile && (
                <p className="text-xs text-muted-foreground truncate" title={selectedFile.name}>
                  {selectedFile.name}
                </p>
              )}
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm text-destructive break-words">{error}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 flex-shrink-0">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isUploading}
          >
            {translate("cancel", "actions", { default: "Cancel" })}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
          >
            {isUploading
              ? translate("uploading", "drive", { default: "Uploading..." })
              : translate("upload", "drive", { default: "Upload" })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

