# Drive Feature Implementation Plan

## Overview
This document outlines the phase-wise implementation of the Drive feature in the Zecrypt web application. The Drive section will allow users to manage folders with create, rename, move, and delete operations.

## Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **UI Components**: Shadcn UI
- **Styling**: Tailwind CSS
- **State Management**: React Hooks + Redux (for workspace/project selection)
- **HTTP Client**: Axios (with automatic access-token header injection)

## Backend API Reference

All APIs require the `access-token` header (automatically added by `axiosInstance`):

### 1. Create Folder
- **Endpoint**: `POST /api/v1/web/drive/folder/create`
- **Request Body**:
  ```json
  {
    "name": "string",
    "parent_id": "string" (optional)
  }
  ```
- **Response**: `200 OK` with folder ID string

### 2. Delete Folder(s)
- **Endpoint**: `DELETE /api/v1/web/drive/folder/delete`
- **Request Body**:
  ```json
  {
    "folder_ids": ["string"]
  }
  ```
- **Response**: `200 OK`

### 3. Rename Folder
- **Endpoint**: `POST /api/v1/web/drive/folder/rename`
- **Request Body**:
  ```json
  {
    "name": "string",
    "folder_id": "string",
    "parent_id": "string" (optional)
  }
  ```
- **Response**: `200 OK`

### 4. Move Folder(s)
- **Endpoint**: `POST /api/v1/web/drive/folder/move`
- **Request Body**:
  ```json
  {
    "folder_ids": ["string"],
    "parent_id": "string"
  }
  ```
- **Response**: `200 OK`

---

## Phase 1: Core Data Structure & Hook Setup

### 1.1 Create TypeScript Interfaces
**File**: `hooks/use-drive-management.ts` (start of file)

Define the core data structures:

```typescript
interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  workspace_id: string;
  project_id: string;
}

interface UseDriveManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
}

interface UseDriveManagementReturn {
  folders: Folder[];
  isLoading: boolean;
  createFolder: (name: string, parentId?: string | null) => Promise<void>;
  renameFolder: (folderId: string, newName: string, parentId?: string | null) => Promise<void>;
  moveFolder: (folderIds: string[], parentId: string) => Promise<void>;
  deleteFolders: (folderIds: string[]) => Promise<void>;
  fetchFolders: () => Promise<void>;
  currentFolder: Folder | null;
  setCurrentFolder: (folder: Folder | null) => void;
  getFolderPath: (folderId: string | null) => Folder[];
  getSubfolders: (parentId: string | null) => Folder[];
}
```

### 1.2 Implement Base Hook Structure
**File**: `hooks/use-drive-management.ts`

Follow the pattern from `use-email-management.ts`:

```typescript
"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";

export function useDriveManagement({
  selectedWorkspaceId,
  selectedProjectId,
}: UseDriveManagementProps): UseDriveManagementReturn {
  const { translate } = useTranslator();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  // TODO: Implement fetchFolders
  // TODO: Implement createFolder
  // TODO: Implement renameFolder
  // TODO: Implement moveFolder
  // TODO: Implement deleteFolders
  // TODO: Implement helper functions (getFolderPath, getSubfolders)
  
  return {
    folders,
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
  };
}
```

### 1.3 Implement Folder Fetching
**File**: `hooks/use-drive-management.ts`

**Note**: Since no GET endpoint is provided yet, we'll use an empty array for now and add fetch logic when the API is ready.

```typescript
const fetchFolders = useCallback(async () => {
  if (!selectedWorkspaceId || !selectedProjectId) {
    setIsLoading(false);
    return;
  }

  setIsLoading(true);
  
  try {
    // TODO: Replace with actual GET endpoint when available
    // const response = await axiosInstance.get(
    //   `/api/v1/web/drive/${selectedWorkspaceId}/${selectedProjectId}/folders`
    // );
    // setFolders(response.data.data || []);
    
    // For now, use empty array or mock data
    setFolders([]);
  } catch (error) {
    console.error("Error fetching folders:", error);
    toast({
      title: translate("error", "drive", { default: "Error" }),
      description: translate("error_fetching_folders", "drive", {
        default: "Failed to fetch folders",
      }),
      variant: "destructive",
    });
    setFolders([]);
  } finally {
    setIsLoading(false);
  }
}, [selectedWorkspaceId, selectedProjectId, translate]);

useEffect(() => {
  if (selectedWorkspaceId && selectedProjectId) {
    fetchFolders();
  }
}, [selectedWorkspaceId, selectedProjectId, fetchFolders]);
```

### 1.4 Implement Helper Functions

```typescript
// Get breadcrumb path for a folder
const getFolderPath = useCallback((folderId: string | null): Folder[] => {
  if (!folderId) return [];
  
  const path: Folder[] = [];
  let currentId: string | null = folderId;
  
  while (currentId) {
    const folder = folders.find(f => f.folder_id === currentId);
    if (!folder) break;
    path.unshift(folder);
    currentId = folder.parent_id;
  }
  
  return path;
}, [folders]);

// Get subfolders of a parent
const getSubfolders = useCallback((parentId: string | null): Folder[] => {
  return folders.filter(f => f.parent_id === parentId);
}, [folders]);
```

**Deliverables**:
- ✅ `hooks/use-drive-management.ts` with TypeScript interfaces
- ✅ Base hook structure with state management
- ✅ Fetch folders logic (ready for API integration)
- ✅ Helper functions for folder hierarchy

---

## Phase 2: CRUD Operations Implementation

### 2.1 Create Folder Function
**File**: `hooks/use-drive-management.ts`

```typescript
const createFolder = useCallback(
  async (name: string, parentId: string | null = null) => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("missing_workspace_project", "drive", {
          default: "Missing workspace or project",
        }),
        variant: "destructive",
      });
      return;
    }

    try {
      const payload: any = { name };
      if (parentId) {
        payload.parent_id = parentId;
      }

      await axiosInstance.post(
        `/api/v1/web/drive/folder/create`,
        payload
      );

      toast({
        title: translate("success", "drive", { default: "Success" }),
        description: translate("folder_created", "drive", {
          default: "Folder created successfully",
        }),
      });

      // Refresh folders list
      await fetchFolders();
    } catch (error) {
      console.error("Error creating folder:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("error_creating_folder", "drive", {
          default: "Failed to create folder",
        }),
        variant: "destructive",
      });
      throw error;
    }
  },
  [selectedWorkspaceId, selectedProjectId, fetchFolders, translate]
);
```

### 2.2 Rename Folder Function

```typescript
const renameFolder = useCallback(
  async (folderId: string, newName: string, parentId: string | null = null) => {
    try {
      const payload: any = {
        name: newName,
        folder_id: folderId,
      };
      if (parentId) {
        payload.parent_id = parentId;
      }

      await axiosInstance.post(
        `/api/v1/web/drive/folder/rename`,
        payload
      );

      toast({
        title: translate("success", "drive", { default: "Success" }),
        description: translate("folder_renamed", "drive", {
          default: "Folder renamed successfully",
        }),
      });

      await fetchFolders();
    } catch (error) {
      console.error("Error renaming folder:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("error_renaming_folder", "drive", {
          default: "Failed to rename folder",
        }),
        variant: "destructive",
      });
      throw error;
    }
  },
  [fetchFolders, translate]
);
```

### 2.3 Move Folder Function

```typescript
const moveFolder = useCallback(
  async (folderIds: string[], parentId: string) => {
    try {
      await axiosInstance.post(
        `/api/v1/web/drive/folder/move`,
        {
          folder_ids: folderIds,
          parent_id: parentId,
        }
      );

      toast({
        title: translate("success", "drive", { default: "Success" }),
        description: translate("folder_moved", "drive", {
          default: `${folderIds.length} folder(s) moved successfully`,
        }),
      });

      await fetchFolders();
    } catch (error) {
      console.error("Error moving folder:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("error_moving_folder", "drive", {
          default: "Failed to move folder(s)",
        }),
        variant: "destructive",
      });
      throw error;
    }
  },
  [fetchFolders, translate]
);
```

### 2.4 Delete Folder Function

```typescript
const deleteFolders = useCallback(
  async (folderIds: string[]) => {
    try {
      await axiosInstance.delete(
        `/api/v1/web/drive/folder/delete`,
        {
          data: { folder_ids: folderIds }
        }
      );

      toast({
        title: translate("success", "drive", { default: "Success" }),
        description: translate("folder_deleted", "drive", {
          default: `${folderIds.length} folder(s) deleted successfully`,
        }),
      });

      await fetchFolders();
    } catch (error) {
      console.error("Error deleting folder:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("error_deleting_folder", "drive", {
          default: "Failed to delete folder(s)",
        }),
        variant: "destructive",
      });
      throw error;
    }
  },
  [fetchFolders, translate]
);
```

**Deliverables**:
- ✅ Create folder API integration
- ✅ Rename folder API integration
- ✅ Move folder API integration
- ✅ Delete folder API integration
- ✅ Toast notifications for all operations
- ✅ Error handling

---

## Phase 3: Dialog Components

### 3.1 Create Folder Dialog
**File**: `components/add-folder-dialog.tsx`

Follow the pattern from `add-email-dialog.tsx`:

```typescript
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
```

### 3.2 Rename Folder Dialog
**File**: `components/rename-folder-dialog.tsx`

```typescript
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
```

### 3.3 Move Folder Dialog
**File**: `components/move-folder-dialog.tsx`

```typescript
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle, Folder as FolderIcon, ChevronRight } from "lucide-react";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            onClick={() => onOpenChange(false)}
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
```

**Deliverables**:
- ✅ `components/add-folder-dialog.tsx` - Create folder UI
- ✅ `components/rename-folder-dialog.tsx` - Rename folder UI
- ✅ `components/move-folder-dialog.tsx` - Move folder UI with folder tree selection
- ✅ All dialogs follow Shadcn UI patterns
- ✅ Proper validation and error handling
- ✅ Translation support

---

## Phase 4: Main Drive Content Component

### 4.1 Create Drive Content Component
**File**: `components/drive-content.tsx`

This is the main UI component that displays the folder grid/list:

```typescript
"use client";

import { useState, useCallback } from "react";
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
import { cn } from "@/libs/utils";

interface Folder {
  folder_id: string;
  name: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
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

  // Get current subfolders to display
  const currentSubfolders = getSubfolders(currentFolder?.folder_id || null);

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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleHomeClick}
            className="gap-2"
          >
            <Home className="h-4 w-4" />
            {translate("root", "drive", { default: "Root" })}
          </Button>
          
          {breadcrumbPath.map((folder, index) => (
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
          <Button onClick={handleCreateFolder} className="gap-2">
            <Plus className="h-4 w-4" />
            {translate("new_folder", "drive", { default: "New Folder" })}
          </Button>
        </div>
      </div>

      {/* Folders Grid */}
      <div className="border border-border/30 rounded-md p-6">
        {isLoading ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground">
              {translate("loading_folders", "drive", { default: "Loading folders..." })}
            </p>
          </div>
        ) : currentSubfolders.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
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
                  <span className="text-sm font-medium text-center line-clamp-2">
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
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <FolderIcon className="h-16 w-16 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              {translate("no_folders", "drive", {
                default: "No folders in this location",
              })}
            </p>
            <Button onClick={handleCreateFolder} className="gap-2">
              <Plus className="h-4 w-4" />
              {translate("create_folder", "drive", { default: "Create Folder" })}
            </Button>
          </div>
        )}
      </div>

      {/* Dialogs */}
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
```

**Deliverables**:
- ✅ `components/drive-content.tsx` - Main drive UI component
- ✅ Folder grid/list view
- ✅ Breadcrumb navigation
- ✅ Context menu for folder actions
- ✅ Double-click to open folders
- ✅ Empty state handling
- ✅ Loading state

---

## Phase 5: Dashboard Page Integration

### 5.1 Create Drive Dashboard Page
**File**: `app/[locale]/dashboard/drive/page.tsx`

Follow the exact pattern from `emails/page.tsx`:

```typescript
import { DashboardLayout } from "@/components/dashboard-layout";
import { DriveContent } from "@/components/drive-content";

export default async function DrivePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  
  return (
    <DashboardLayout locale={locale}>
      <DriveContent />
    </DashboardLayout>
  );
}
```

### 5.2 Update Navigation (if needed)

Check if `components/sidebar-nav.tsx` needs to be updated to include the Drive link:

```typescript
// Add this to the navigation items
{
  name: translate("drive", "navigation", { default: "Drive" }),
  href: "/dashboard/drive",
  icon: <FolderIcon className="h-5 w-5" />,
}
```

**Deliverables**:
- ✅ `app/[locale]/dashboard/drive/page.tsx` - Drive dashboard page
- ✅ Integration with existing navigation (if applicable)
- ✅ Proper locale handling

---

## Phase 6: Polish & Enhancements

### 6.1 Add Keyboard Shortcuts

Update `components/drive-content.tsx` to add keyboard shortcuts:

```typescript
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    // Cmd/Ctrl + N to create new folder
    if ((e.metaKey || e.ctrlKey) && e.key === "n") {
      e.preventDefault();
      setShowAddFolder(true);
    }
    
    // Backspace to go back
    if (e.key === "Backspace" && currentFolder && !isDialogOpen()) {
      e.preventDefault();
      handleBackClick();
    }
  };
  
  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [currentFolder]);
```

### 6.2 Add Animations (Optional)

Install and use Framer Motion for smooth transitions:

```typescript
import { motion } from "framer-motion";

// Wrap folder grid items
<motion.div
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -10 }}
  transition={{ duration: 0.2 }}
>
  {/* Folder content */}
</motion.div>
```

### 6.3 Add Folder Count & Metadata

Show folder metadata (subfolder count, created date):

```typescript
<div className="text-xs text-muted-foreground mt-1">
  {getSubfolders(folder.folder_id).length} items
</div>
```

### 6.4 Add Search/Filter (Optional)

Add search functionality similar to emails:

```typescript
const [searchQuery, setSearchQuery] = useState("");

const filteredFolders = currentSubfolders.filter(folder =>
  folder.name.toLowerCase().includes(searchQuery.toLowerCase())
);
```

**Deliverables**:
- ✅ Keyboard shortcuts for common actions
- ✅ Smooth animations (optional)
- ✅ Folder metadata display
- ✅ Search/filter capability (optional)

---

## Testing Checklist

### Functional Testing
- [ ] Create folder in root
- [ ] Create subfolder inside another folder
- [ ] Rename folder
- [ ] Move folder to different parent
- [ ] Move folder to root
- [ ] Delete folder
- [ ] Navigate folder hierarchy with breadcrumbs
- [ ] Navigate back button
- [ ] Double-click to open folder
- [ ] Context menu actions work correctly

### Error Handling
- [ ] Network errors show proper toast notifications
- [ ] Validation errors prevent form submission
- [ ] Cannot move folder into itself
- [ ] Cannot move folder into its descendant
- [ ] Loading states display correctly

### UI/UX Testing
- [ ] Responsive design works on mobile
- [ ] Dialogs are accessible (keyboard navigation)
- [ ] Empty states display properly
- [ ] Loading states don't flicker
- [ ] Breadcrumb navigation is clear
- [ ] Folder grid scales properly

### Integration Testing
- [ ] Works with workspace/project selection from Redux
- [ ] Access token is sent with all requests
- [ ] Translations work in different locales
- [ ] Toast notifications appear correctly
- [ ] Navigation integrates with sidebar (if applicable)

---

## File Structure Summary

```
packages/frontend-web/
├── app/
│   └── [locale]/
│       └── dashboard/
│           └── drive/
│               └── page.tsx                    # Main page route
├── components/
│   ├── add-folder-dialog.tsx                  # Create folder dialog
│   ├── rename-folder-dialog.tsx               # Rename folder dialog
│   ├── move-folder-dialog.tsx                 # Move folder dialog
│   └── drive-content.tsx                      # Main drive UI component
└── hooks/
    └── use-drive-management.ts                # Drive state & API logic
```

---

## Translation Keys to Add

Add these keys to `messages/en.json` (and other locales):

```json
{
  "drive": {
    "drive": "Drive",
    "manage_your_folders": "Organize and manage your folders",
    "create_folder": "Create Folder",
    "new_folder": "New Folder",
    "folder_name": "Folder Name",
    "folder_name_placeholder": "My Folder",
    "folder_name_required": "Folder name is required",
    "rename_folder": "Rename Folder",
    "move_folder": "Move Folder",
    "delete_folder": "Delete Folder",
    "no_folders": "No folders in this location",
    "loading_folders": "Loading folders...",
    "root": "Root",
    "back": "Back",
    "open": "Open",
    "rename": "Rename",
    "move": "Move",
    "delete": "Delete",
    "cancel": "Cancel",
    "create": "Create",
    "creating": "Creating...",
    "renaming": "Renaming...",
    "moving": "Moving...",
    "deleting": "Deleting...",
    "success": "Success",
    "error": "Error",
    "folder_created": "Folder created successfully",
    "folder_renamed": "Folder renamed successfully",
    "folder_moved": "Folder(s) moved successfully",
    "folder_deleted": "Folder(s) deleted successfully",
    "error_creating_folder": "Failed to create folder",
    "error_renaming_folder": "Failed to rename folder",
    "error_moving_folder": "Failed to move folder(s)",
    "error_deleting_folder": "Failed to delete folder(s)",
    "error_fetching_folders": "Failed to fetch folders",
    "confirm_delete": "Confirm deletion",
    "delete_folder_confirmation": "Are you sure you want to delete this folder? This action cannot be undone.",
    "select_destination": "Please select a destination folder",
    "destination_folder": "Select destination folder",
    "root_folder": "Root",
    "create_new_folder": "Create a new folder in root",
    "create_subfolder_in": "Create a new folder in {folderName}",
    "rename_folder_description": "Rename {folderName}",
    "move_folder_description": "Moving {count} folder(s)",
    "missing_workspace_project": "Missing workspace or project"
  }
}
```

---

## API Integration Notes

### Missing GET Endpoint
Currently, there's no GET endpoint for fetching folders. The implementation assumes:

**Recommended endpoint**: `GET /api/v1/web/drive/folder/list`

**Query parameters**:
- `workspace_id`: string
- `project_id`: string

**Response**:
```json
{
  "data": [
    {
      "folder_id": "string",
      "name": "string",
      "parent_id": "string | null",
      "created_at": "string",
      "updated_at": "string",
      "created_by": "string",
      "workspace_id": "string",
      "project_id": "string"
    }
  ]
}
```

Once this endpoint is available, update `hooks/use-drive-management.ts` in the `fetchFolders` function.

---

## Next Steps & Future Enhancements

### Immediate Next Steps (After Phase 6)
1. Add file upload/download capabilities
2. Add file listing within folders
3. Add folder sharing/permissions
4. Add bulk operations (multi-select)

### Future Enhancements
1. **Drag & Drop**: Drag folders to move them
2. **Grid/List Toggle**: Switch between grid and list views
3. **Sorting**: Sort by name, date, size
4. **Favorites**: Star/favorite folders for quick access
5. **Recent Items**: Show recently accessed folders
6. **Folder Colors/Icons**: Customize folder appearance
7. **Breadcrumb Dropdown**: Click breadcrumb to see siblings
8. **Quick Actions**: Right-click context menu
9. **Keyboard Navigation**: Arrow keys to navigate grid
10. **Undo/Redo**: Undo delete/move operations

---

## Development Tips

1. **Start with Phase 1-2**: Get the hook working with API integration first
2. **Test with Mock Data**: Use mock folder data while developing UI
3. **Progressive Enhancement**: Build basic functionality first, add polish later
4. **Follow Patterns**: Stick closely to existing component patterns (emails, cards)
5. **Use Existing Components**: Leverage Shadcn UI components already in the project
6. **Translations**: Add translation keys as you build each component
7. **Error Handling**: Always handle loading and error states
8. **Responsive Design**: Test on different screen sizes as you build

---

## Known Limitations

1. **No File Support Yet**: This implementation only handles folders
2. **No Permissions**: No folder-level permissions or sharing
3. **No Search**: Search functionality is optional in Phase 6
4. **No Bulk Operations**: Can only operate on one folder at a time (except delete)
5. **No Drag & Drop**: Manual move operation required
6. **No Sorting**: Folders displayed in API order
7. **Single Selection**: Cannot select multiple folders for bulk operations

---

## Conclusion

This implementation plan provides a comprehensive, phase-by-phase approach to building the Drive feature. Each phase builds upon the previous one, following the established patterns in the codebase. The implementation prioritizes:

- **Consistency**: Follows existing code patterns
- **Maintainability**: Clean separation of concerns
- **User Experience**: Intuitive navigation and actions
- **Scalability**: Ready for future enhancements

Follow each phase sequentially, test thoroughly, and refer back to this document as your single source of truth for the Drive implementation.

