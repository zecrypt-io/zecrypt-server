"use client";

import { useState, useCallback, useEffect } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import { Button } from "@/components/ui/button";
import {
  Folder as FolderIcon,
  Plus,
  MoreHorizontal,
  ArrowLeft,
  Home,
  Pencil,
  Move,
  Trash2,
  Upload as UploadIcon,
  Download,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { useDriveManagement } from "@/hooks/use-drive-management";
import { AddFolderDialog } from "./add-folder-dialog";
import { RenameFolderDialog } from "./rename-folder-dialog";
import { MoveFolderDialog } from "./move-folder-dialog";
import { UploadFileDialog } from "./upload-file-dialog";
import { FileCard } from "./file-card";
import { RenameFileDialog } from "./rename-file-dialog";
import { MoveFileDialog } from "./move-file-dialog";
import { DeleteFileDialog } from "./delete-file-dialog";
import { FilePreviewModal } from "./file-preview-modal";

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
}

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
  created_by: string;
  workspace_id: string;
  project_id: string;
}

export function DriveContent() {
  const { translate } = useTranslator();
  const selectedWorkspaceId = useSelector(
    (state: RootState) => state.workspace.selectedWorkspaceId
  );
  const selectedProjectId = useSelector(
    (state: RootState) => state.workspace.selectedProjectId
  );

  const {
    folders,
    files,
    isLoading,
    createFolder,
    renameFolder,
    moveFolder,
    deleteFolders,
    fetchFolders,
    currentFolder,
    setCurrentFolder,
    getFolderPath,
    getSubfolders,
    uploadFile,
    uploadFolder,
    renameFile,
    moveFile,
    deleteFiles,
    downloadFile,
    downloadFolder,
    previewFile,
    isUploading,
    uploadProgress,
    uploadStatusMessage,
    isDownloading,
    downloadProgress,
  } = useDriveManagement({
    selectedWorkspaceId,
    selectedProjectId,
  });

  const [showAddFolder, setShowAddFolder] = useState(false);
  const [showRenameFolder, setShowRenameFolder] = useState(false);
  const [showMoveFolder, setShowMoveFolder] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const [isProcessingDelete, setIsProcessingDelete] = useState(false);

  // File dialog states
  const [showUploadFile, setShowUploadFile] = useState(false);
  const [showRenameFile, setShowRenameFile] = useState(false);
  const [showMoveFile, setShowMoveFile] = useState(false);
  const [showDeleteFile, setShowDeleteFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<DriveFile | null>(null);
  
  // Preview states
  const [showPreviewFile, setShowPreviewFile] = useState(false);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewingFile, setPreviewingFile] = useState<DriveFile | null>(null);

  // Get current subfolders to display
  const currentSubfolders = getSubfolders(currentFolder?.folder_id || null);

  // Get current files to display
  const currentFiles = files.filter(f => f.parent_id === (currentFolder?.folder_id || null));

  // Breadcrumb path
  const breadcrumbPath = getFolderPath(currentFolder?.folder_id || null);

  const handleFolderClick = (folder: Folder) => {
    setCurrentFolder(folder);
  };

  const handleBackClick = () => {
    if (!currentFolder) return;
    
    if (currentFolder.parent_id) {
      const parentFolder = folders.find(f => f.folder_id === currentFolder.parent_id);
      setCurrentFolder(parentFolder || null);
    } else {
      setCurrentFolder(null);
    }
  };

  const handleHomeClick = () => {
    setCurrentFolder(null);
  };

  const handleCreateFolder = () => {
    setShowAddFolder(true);
  };

  const handleRenameFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowRenameFolder(true);
  };

  const handleMoveFolder = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowMoveFolder(true);
  };

  const confirmDelete = (folder: Folder) => {
    setSelectedFolder(folder);
    setShowDeleteConfirmation(true);
  };

  const handleDeleteFolder = async () => {
    if (!selectedFolder) return;

    setIsProcessingDelete(true);
    try {
      await deleteFolders([selectedFolder.folder_id]);
      setShowDeleteConfirmation(false);
      setSelectedFolder(null);
    } finally {
      setIsProcessingDelete(false);
    }
  };

  // File handlers
  const handleUploadFile = () => {
    setShowUploadFile(true);
  };

  const handleRenameFile = (file: DriveFile) => {
    setSelectedFile(file);
    setShowRenameFile(true);
  };

  const handleMoveFile = (file: DriveFile) => {
    setSelectedFile(file);
    setShowMoveFile(true);
  };

  const handleDeleteFile = (file: DriveFile) => {
    setSelectedFile(file);
    setShowDeleteFile(true);
  };

  const handleDownloadFile = async (file: DriveFile) => {
    await downloadFile(file.file_id);
  };

  const handleDownloadFolder = async (folder: Folder) => {
    await downloadFolder(folder.folder_id);
  };

  const handlePreviewFile = async (file: DriveFile) => {
    setPreviewingFile(file);
    setShowPreviewFile(true);
    const result = await previewFile(file.file_id);
    if (result) {
      setPreviewBlobUrl(result.blobUrl);
    }
  };

  const handlePreviewClose = (open: boolean) => {
    if (!open && previewBlobUrl) {
      URL.revokeObjectURL(previewBlobUrl);
      setPreviewBlobUrl(null);
    }
    setShowPreviewFile(open);
    if (!open) {
      setPreviewingFile(null);
    }
  };

  const handleDownloadFromPreview = () => {
    if (previewingFile) {
      downloadFile(previewingFile.file_id);
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if any dialog is open or input is focused
      const isDialogOpen = showAddFolder || showRenameFolder || showMoveFolder || showDeleteConfirmation;
      const isInputFocused = document.activeElement?.tagName === 'INPUT' || 
                           document.activeElement?.tagName === 'TEXTAREA';
      
      if (isDialogOpen || isInputFocused) return;

      // Cmd/Ctrl + N to create new folder
      if ((e.metaKey || e.ctrlKey) && e.key === "n") {
        e.preventDefault();
        setShowAddFolder(true);
      }
      
      // Backspace to go back
      if (e.key === "Backspace" && currentFolder) {
        e.preventDefault();
        handleBackClick();
      }
    };
    
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [currentFolder, showAddFolder, showRenameFolder, showMoveFolder, showDeleteConfirmation]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {translate("drive", "drive", { default: "Drive" })}
          </h1>
          <p className="text-muted-foreground">
            {translate("manage_your_folders", "drive", {
              default: "Organize and manage your folders",
            })}
          </p>
        </div>
      </div>

      {/* Breadcrumb and Actions */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            {translate("root", "drive", { default: "Root" })}
          </Button>
          
          {breadcrumbPath.map((folder) => (
            <div key={folder.folder_id} className="flex items-center gap-2">
              <span className="text-muted-foreground">/</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCurrentFolder(folder)}
              >
                {folder.name}
              </Button>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2">
          {currentFolder && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleBackClick}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              {translate("back", "drive", { default: "Back" })}
            </Button>
          )}
          <Button onClick={handleUploadFile} variant="outline" className="gap-2">
            <UploadIcon className="h-4 w-4" />
            {translate("upload", "drive", { default: "Upload" })}
          </Button>
          <Button onClick={handleCreateFolder} className="gap-2">
            <Plus className="h-4 w-4" />
            {translate("new_folder", "drive", { default: "New Folder" })}
          </Button>
        </div>
      </div>

      {/* Folders and Files Grid */}
      <div className="border border-border/30 rounded-md p-6">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {translate("loading", "drive", { default: "Loading..." })}
            </p>
          </div>
        ) : currentSubfolders.length > 0 || currentFiles.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {/* Folders */}
            {currentSubfolders.map((folder) => (
              <div
                key={folder.folder_id}
                className="group relative border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors cursor-pointer"
              >
                <div
                  className="flex flex-col items-center gap-2"
                  onDoubleClick={() => handleFolderClick(folder)}
                >
                  <FolderIcon className="h-12 w-12 text-primary" />
                  <span className="text-sm font-medium text-center line-clamp-2 w-full">
                    {folder.name}
                  </span>
                </div>

                {/* Context Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">
                        {translate("open_menu", "drive", { default: "Open menu" })}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleFolderClick(folder)}>
                      {translate("open", "drive", { default: "Open" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleRenameFolder(folder)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      {translate("rename", "drive", { default: "Rename" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleMoveFolder(folder)}>
                      <Move className="mr-2 h-4 w-4" />
                      {translate("move", "drive", { default: "Move" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownloadFolder(folder)}>
                      <Download className="mr-2 h-4 w-4" />
                      {translate("download", "drive", { default: "Download" })}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => confirmDelete(folder)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {translate("delete", "drive", { default: "Delete" })}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}

            {/* Files */}
            {currentFiles.map((file) => (
              <FileCard
                key={file.file_id}
                file={file}
                onRename={handleRenameFile}
                onMove={handleMoveFile}
                onDelete={handleDeleteFile}
                onDownload={handleDownloadFile}
                onPreview={handlePreviewFile}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {translate("no_items", "drive", {
                default: "No items in this location",
              })}
            </p>
            <div className="flex gap-2">
              <Button onClick={handleUploadFile} variant="outline" className="gap-2">
                <UploadIcon className="h-4 w-4" />
                {translate("upload", "drive", { default: "Upload" })}
              </Button>
              <Button onClick={handleCreateFolder} className="gap-2">
                <Plus className="h-4 w-4" />
                {translate("create_folder", "drive", { default: "Create Folder" })}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Folder Dialogs */}
      <AddFolderDialog
        open={showAddFolder}
        onOpenChange={setShowAddFolder}
        onFolderCreated={fetchFolders}
        parentFolder={currentFolder}
        onCreateFolder={createFolder}
      />

      {selectedFolder && (
        <>
          <RenameFolderDialog
            open={showRenameFolder}
            onOpenChange={setShowRenameFolder}
            onFolderRenamed={fetchFolders}
            folder={selectedFolder}
            onRenameFolder={renameFolder}
          />

          <MoveFolderDialog
            open={showMoveFolder}
            onOpenChange={setShowMoveFolder}
            onFolderMoved={fetchFolders}
            selectedFolders={[selectedFolder]}
            allFolders={folders}
            onMoveFolder={moveFolder}
          />
        </>
      )}

      {/* File Dialogs */}
      <UploadFileDialog
        open={showUploadFile}
        onOpenChange={setShowUploadFile}
        onFileUploaded={fetchFolders}
        currentFolder={currentFolder}
        uploadFile={uploadFile}
        uploadFolder={uploadFolder}
        isUploading={isUploading}
        uploadProgress={uploadProgress}
        uploadStatusMessage={uploadStatusMessage}
      />

      {selectedFile && (
        <>
          <RenameFileDialog
            open={showRenameFile}
            onOpenChange={setShowRenameFile}
            file={selectedFile}
            onRename={renameFile}
          />

          <MoveFileDialog
            open={showMoveFile}
            onOpenChange={setShowMoveFile}
            file={selectedFile}
            folders={folders}
            onMove={moveFile}
          />

          <DeleteFileDialog
            open={showDeleteFile}
            onOpenChange={setShowDeleteFile}
            file={selectedFile}
            onDelete={deleteFiles}
          />
        </>
      )}

      {/* File Preview Modal */}
      <FilePreviewModal
        open={showPreviewFile}
        onOpenChange={handlePreviewClose}
        file={previewingFile}
        blobUrl={previewBlobUrl}
        onDownload={handleDownloadFromPreview}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {translate("confirm_delete", "drive", { default: "Confirm deletion" })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {translate("delete_folder_confirmation", "drive", {
                default: `Are you sure you want to delete "${selectedFolder?.name}"? This action cannot be undone.`,
                folderName: selectedFolder?.name,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isProcessingDelete}>
              {translate("cancel", "drive", { default: "Cancel" })}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteFolder();
              }}
              disabled={isProcessingDelete}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isProcessingDelete
                ? translate("deleting", "drive", { default: "Deleting..." })
                : translate("delete", "drive", { default: "Delete" })}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

