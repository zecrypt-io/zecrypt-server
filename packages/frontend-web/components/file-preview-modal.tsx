"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, FileX, Loader2 } from "lucide-react";
import { useTranslator } from "@/hooks/use-translations";
import { getPreviewType, getModalSizeClass } from "@/libs/file-type-utils";
import { formatBytes } from "@/libs/utils";
import { cn } from "@/libs/utils";

interface DriveFile {
  file_id: string;
  name: string;
  size: number;
  original_size: number;
  type: string;
  iv: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

interface FilePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: DriveFile | null;
  blobUrl: string | null;
  onDownload: () => void;
}

export function FilePreviewModal({
  open,
  onOpenChange,
  file,
  blobUrl,
  onDownload,
}: FilePreviewModalProps) {
  const { translate } = useTranslator();
  const [textContent, setTextContent] = useState<string>("");
  const [isLoadingText, setIsLoadingText] = useState(false);

  const previewType = file ? getPreviewType(file.type, file.name) : 'unsupported';
  const modalSizeClass = getModalSizeClass(previewType);

  // Load text content for text files
  useEffect(() => {
    if (previewType === 'text' && blobUrl && open) {
      setIsLoadingText(true);
      fetch(blobUrl)
        .then(response => response.text())
        .then(text => {
          setTextContent(text);
          setIsLoadingText(false);
        })
        .catch(error => {
          console.error("Error loading text content:", error);
          setTextContent("Error loading file content");
          setIsLoadingText(false);
        });
    }
  }, [previewType, blobUrl, open]);

  // Cleanup: revoke blob URL when modal closes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  const renderPreview = () => {
    if (!blobUrl || !file) {
      return (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      );
    }

    switch (previewType) {
      case 'image':
        return (
          <div className="flex items-center justify-center bg-muted/20 rounded-lg p-4">
            <img
              src={blobUrl}
              alt={file.name}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="w-full h-[85vh] bg-muted/20 rounded-lg overflow-hidden">
            <iframe
              src={blobUrl}
              title={file.name}
              className="w-full h-full border-0"
            />
          </div>
        );

      case 'video':
        return (
          <div className="flex items-center justify-center bg-black rounded-lg">
            <video
              src={blobUrl}
              controls
              className="max-w-full max-h-[70vh] rounded"
            >
              Your browser does not support video playback.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center p-8 gap-4">
            <div className="text-center">
              <p className="text-lg font-medium mb-2">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {formatBytes(file.original_size)}
              </p>
            </div>
            <audio
              src={blobUrl}
              controls
              className="w-full max-w-md"
            >
              Your browser does not support audio playback.
            </audio>
          </div>
        );

      case 'text':
        return (
          <div className="w-full max-h-[70vh] overflow-auto bg-muted/20 rounded-lg p-4">
            {isLoadingText ? (
              <div className="flex items-center justify-center h-32">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <pre className="text-sm font-mono whitespace-pre-wrap break-words">
                {textContent}
              </pre>
            )}
          </div>
        );

      case 'unsupported':
        return (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <FileX className="h-16 w-16 text-muted-foreground" />
            <div className="text-center">
              <p className="text-lg font-medium mb-2">
                {translate("preview_not_available", "drive", {
                  default: "Preview not available",
                })}
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                {translate("preview_unsupported_type", "drive", {
                  default: "This file type cannot be previewed in the browser",
                })}
              </p>
              <div className="text-sm">
                <p className="font-medium">{file.name}</p>
                <p className="text-muted-foreground">
                  {formatBytes(file.original_size)}
                </p>
              </div>
            </div>
            <Button onClick={onDownload} className="gap-2">
              <Download className="h-4 w-4" />
              {translate("download", "actions", { default: "Download" })}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn("max-h-[95vh] overflow-hidden flex flex-col", modalSizeClass)}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold truncate pr-8">
            {file?.name}
          </DialogTitle>
          {file && (
            <p className="text-sm text-muted-foreground">
              {formatBytes(file.original_size)} • {file.type || 'Unknown type'}
            </p>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-auto">
          {renderPreview()}
        </div>

        {previewType !== 'unsupported' && (
          <DialogFooter className="pt-4">
            <Button onClick={onDownload} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              {translate("download", "actions", { default: "Download" })}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

