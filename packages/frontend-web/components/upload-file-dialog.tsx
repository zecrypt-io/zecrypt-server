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
  uploadFolder: (files: FileList, parentId?: string | null) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  uploadStatusMessage: string;
}

export function UploadFileDialog({
  open,
  onOpenChange,
  onFileUploaded,
  currentFolder,
  uploadFile,
  uploadFolder,
  isUploading,
  uploadProgress,
  uploadStatusMessage,
}: UploadFileDialogProps) {
  const { translate } = useTranslator();
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [isFolder, setIsFolder] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string>("");

  const handleFilesSelect = useCallback((files: FileList | null) => {
    setError("");
    
    if (!files || files.length === 0) {
      setSelectedFiles(null);
      setIsFolder(false);
      return;
    }

    // Check if it's a folder upload (files have webkitRelativePath)
    const firstFile = files[0] as any;
    const hasRelativePath = firstFile.webkitRelativePath && firstFile.webkitRelativePath.includes('/');
    setIsFolder(hasRelativePath);

    // For individual file uploads, validate size
    if (!hasRelativePath && files.length === 1) {
      if (!validateFileSize(files[0], 50)) {
        setError(translate("file_too_large", "drive", {
          default: "File size exceeds 50MB limit",
        }));
        setSelectedFiles(null);
        return;
      }
    }

    setSelectedFiles(files);
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

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  }, [handleFilesSelect]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelect(e.target.files);
    }
  }, [handleFilesSelect]);

  const handleUpload = async () => {
    if (!selectedFiles) return;

    try {
      if (isFolder || selectedFiles.length > 1) {
        // Upload folder or multiple files
        await uploadFolder(selectedFiles, currentFolder?.folder_id || null);
      } else {
        // Upload single file
        await uploadFile(selectedFiles[0], currentFolder?.folder_id || null);
      }
      setSelectedFiles(null);
      setIsFolder(false);
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
      setSelectedFiles(null);
      setIsFolder(false);
      setError("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>
            {translate("upload_file", "drive", { default: "Upload Files or Folder" })}
          </DialogTitle>
          <DialogDescription className="space-y-1">
            <span className="block">
              {currentFolder
                ? translate("upload_to_folder", "drive", {
                    default: "Upload to {folderName}",
                    folderName: currentFolder.name,
                  })
                : translate("upload_to_root", "drive", {
                    default: "Upload files or folders to root",
                  })}
            </span>
            <span className="text-xs text-muted-foreground block">
              {translate("max_file_size", "drive", { default: "Maximum file size: 50MB per file" })}
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
              multiple
              {...({ webkitdirectory: "", directory: "" } as any)}
            />
            
            <div className="space-y-2">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div className="text-sm px-2">
                <label
                  htmlFor="file-upload"
                  className="font-medium text-primary cursor-pointer hover:underline"
                >
                  {translate("choose_file", "drive", { default: "Choose files or folder" })}
                </label>
                <span className="text-muted-foreground">
                  {" "}
                  {translate("or_drag_drop", "drive", { default: "or drag and drop" })}
                </span>
              </div>
            </div>
          </div>

          {/* Selected files display */}
          {selectedFiles && !isUploading && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg min-w-0">
              <FileIcon className="h-6 w-6 text-muted-foreground flex-shrink-0" />
              <div className="flex-1 min-w-0 overflow-hidden">
                {isFolder ? (
                  <>
                    <p className="text-sm font-medium">
                      Folder selected
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFiles.length} files
                    </p>
                  </>
                ) : selectedFiles.length === 1 ? (
                  <>
                    <p className="text-sm font-medium truncate" title={selectedFiles[0].name}>
                      {selectedFiles[0].name}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatBytes(selectedFiles[0].size)}</p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-medium">
                      {selectedFiles.length} files selected
                    </p>
                  </>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleFilesSelect(null)}
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
                  {uploadStatusMessage || translate("uploading", "drive", { default: "Uploading..." })}
                </span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="h-2" />
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
            disabled={!selectedFiles || isUploading}
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

