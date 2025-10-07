"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";

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

export function useDriveManagement({
  selectedWorkspaceId,
  selectedProjectId,
}: UseDriveManagementProps): UseDriveManagementReturn {
  const { translate } = useTranslator();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);

  // Fetch folders from API
  const fetchFolders = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      // TODO: Replace with actual GET endpoint when available
      // Recommended endpoint: GET /drive/folder/list
      // const response = await axiosInstance.get(
      //   `/drive/folder/list`,
      //   {
      //     params: {
      //       workspace_id: selectedWorkspaceId,
      //       project_id: selectedProjectId,
      //     },
      //   }
      // );
      // setFolders(response.data.data || []);
      
      console.log("Fetching folders for workspace", selectedWorkspaceId, "project", selectedProjectId);
      
      // For now, use empty array until API is ready
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
  }, [selectedWorkspaceId, selectedProjectId]);

  // Create folder
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
          `/drive/folder/create`,
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
    [selectedWorkspaceId, selectedProjectId, fetchFolders]
  );

  // Rename folder
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
          `/drive/folder/rename`,
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
    [fetchFolders]
  );

  // Move folder(s)
  const moveFolder = useCallback(
    async (folderIds: string[], parentId: string) => {
      try {
        await axiosInstance.post(
          `/drive/folder/move`,
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
    [fetchFolders]
  );

  // Delete folder(s)
  const deleteFolders = useCallback(
    async (folderIds: string[]) => {
      try {
        await axiosInstance.delete(
          `/drive/folder/delete`,
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
    [fetchFolders]
  );

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

  // Effect to fetch data when dependencies change
  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      console.log("Running fetchFolders effect");
      fetchFolders();
    }
  }, [selectedWorkspaceId, selectedProjectId, fetchFolders]);

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

