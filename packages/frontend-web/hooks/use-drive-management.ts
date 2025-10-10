"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { encryptFileBlob, validateFileSize } from "@/libs/file-encryption";
import { secureGetItem } from "@/libs/local-storage-utils";

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

interface DriveFile {
  file_id: string;
  name: string;
  size: number; // encrypted size
  original_size: number; // original file size before encryption
  type: string; // MIME type
  iv: string; // hex string for decryption
  parent_id: string | null;
  created_at: string;
  updated_at: string | null;
  created_by: string;
  workspace_id: string;
  project_id: string;
  encrypted_data?: string; // base64 encoded encrypted blob (from API)
}

interface UseDriveManagementProps {
  selectedWorkspaceId: string | null;
  selectedProjectId: string | null;
}

interface UseDriveManagementReturn {
  folders: Folder[];
  files: DriveFile[];
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
  uploadFile: (file: File, parentId?: string | null) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileIds: string[], parentId: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
}

export function useDriveManagement({
  selectedWorkspaceId,
  selectedProjectId,
}: UseDriveManagementProps): UseDriveManagementReturn {
  const { translate } = useTranslator();
  const [folders, setFolders] = useState<Folder[]>([]);
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState<Folder | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Get workspaces from Redux store for project name lookup
  const workspaces = useSelector((state: RootState) => state.workspace.workspaces);

  // Fetch folders and files from API
  const fetchFolders = useCallback(async () => {
    if (!selectedWorkspaceId || !selectedProjectId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    
    try {
      console.log("Fetching folders for workspace", selectedWorkspaceId, "project", selectedProjectId);
      
      // Fetch all folders (parent_id is optional, omitting it returns all folders)
      const response = await axiosInstance.get(`/drive/folder/list`);
      
      console.log("API Response:", response.data);
      
      // The API returns folders at response.data.data.folders
      const apiFolders = response.data?.data?.folders || [];
      const apiFiles = response.data?.data?.files || [];
      
      // Map API response to match our Folder interface (doc_id -> folder_id)
      const mappedFolders: Folder[] = apiFolders.map((folder: any) => ({
        folder_id: folder.doc_id,
        name: folder.name,
        parent_id: folder.parent_id || null, // Normalize empty string to null
        created_at: folder.created_at,
        updated_at: folder.updated_at,
        created_by: folder.created_by,
        workspace_id: folder.workspace_id || selectedWorkspaceId,
        project_id: folder.project_id || selectedProjectId,
      }));
      
      // Map files from API response
      const mappedFiles: DriveFile[] = apiFiles.map((file: any) => ({
        file_id: file.doc_id,
        name: file.name,
        size: file.size,
        original_size: file.original_size || file.size,
        type: file.type || 'application/octet-stream',
        iv: file.iv || '',
        parent_id: file.parent_id || null, // Normalize empty string to null
        created_at: file.created_at,
        updated_at: file.updated_at,
        created_by: file.created_by,
        workspace_id: file.workspace_id || selectedWorkspaceId,
        project_id: file.project_id || selectedProjectId,
        encrypted_data: file.data,
      }));
      
      console.log("Mapped folders:", mappedFolders);
      console.log("Mapped files:", mappedFiles);
      setFolders(mappedFolders);
      setFiles(mappedFiles);
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
      setFiles([]);
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
        const payload: { name: string; parent_id?: string } = { name };
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
    [selectedWorkspaceId, selectedProjectId, fetchFolders, translate]
  );

  // Rename folder
  const renameFolder = useCallback(
    async (folderId: string, newName: string, parentId: string | null = null) => {
      try {
        const payload: { name: string; folder_id: string; parent_id?: string } = {
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
    [fetchFolders, translate]
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
    [fetchFolders, translate]
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
    [fetchFolders, translate]
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

  // Upload file with encryption
  const uploadFile = useCallback(
    async (file: File, parentId: string | null = null) => {
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

      // 1. Validate file size (max 50MB)
      if (!validateFileSize(file, 50)) {
        toast({
          title: translate("error", "drive", { default: "Error" }),
          description: translate("file_too_large", "drive", {
            default: "File size exceeds 50MB limit",
          }),
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      setUploadProgress(0);

      try {
        // 2. Get project info for key lookup
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
        
        if (!currentProject) {
          throw new Error("Project not found");
        }

        // 3. Get project AES key
        const projectKeyName = `projectKey_${currentProject.name}`;
        const projectKey = await secureGetItem(projectKeyName);
        
        if (!projectKey) {
          throw new Error("Project encryption key not found");
        }

        setUploadProgress(10);

        // 4. Encrypt file blob
        console.log("Encrypting file:", file.name);
        const { encryptedBlob, iv, originalSize } = await encryptFileBlob(file, projectKey);
        
        setUploadProgress(40);

        // 5. Get presigned URL
        console.log("Getting presigned URL");
        console.log("Payload data:", {
          file_type: file.type,
          name: file.name,
          size: encryptedBlob.size,
          original_size: originalSize,
          iv: iv,
          parent_id: parentId || undefined
        });
        
        const payload: any = {
          file_type: file.type || 'application/octet-stream',
          name: file.name,
          file_path: file.name, // Use filename as file path
          size: encryptedBlob.size.toString(),
          iv: iv, // Critical: IV needed for backend to store for future decryption
          parent_id: parentId || '', // Send empty string if null (backend may require it)
        };
        
        console.log("Sending payload:", payload);
        const presignedResponse = await axiosInstance.post('/drive/file/get-presigned-url', payload);

        console.log("Presigned response:", presignedResponse);
        const presignedUrl = presignedResponse.data;
        
        setUploadProgress(50);

        // 6. Upload encrypted blob to presigned URL
        console.log("Uploading encrypted file to presigned URL");
        await fetch(presignedUrl, {
          method: 'PUT',
          body: encryptedBlob,
          headers: { 'Content-Type': 'application/octet-stream' },
        });

        setUploadProgress(90);

        toast({
          title: translate("success", "drive", { default: "Success" }),
          description: translate("file_uploaded", "drive", {
            default: "File uploaded successfully",
          }),
        });

        // 7. Refresh file list
        await fetchFolders();
        setUploadProgress(100);
      } catch (error: any) {
        console.error("Error uploading file:", error);
        
        // Check if it's a "file already exists" error
        const isFileExistsError = 
          error?.response?.data?.status_code === 400 &&
          error?.response?.data?.message?.toLowerCase().includes("file already exists");
        
        toast({
          title: translate("error", "drive", { default: "Error" }),
          description: isFileExistsError
            ? translate("file_already_exists", "drive", {
                default: "A file with this name already exists in this location",
              })
            : translate("error_uploading_file", "drive", {
                default: "Failed to upload file",
              }),
          variant: "destructive",
        });
        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
      }
    },
    [selectedWorkspaceId, selectedProjectId, workspaces, fetchFolders, translate]
  );

  // Rename file
  const renameFile = useCallback(
    async (fileId: string, newName: string) => {
      try {
        await axiosInstance.post('/drive/file/rename', {
          name: newName,
          file_id: fileId,
        });

        toast({
          title: translate("success", "drive", { default: "Success" }),
          description: translate("file_renamed", "drive", {
            default: "File renamed successfully",
          }),
        });

        await fetchFolders();
      } catch (error) {
        console.error("Error renaming file:", error);
        toast({
          title: translate("error", "drive", { default: "Error" }),
          description: translate("error_renaming_file", "drive", {
            default: "Failed to rename file",
          }),
          variant: "destructive",
        });
        throw error;
      }
    },
    [fetchFolders, translate]
  );

  // Move file(s)
  const moveFile = useCallback(
    async (fileIds: string[], parentId: string) => {
      try {
        await axiosInstance.post('/drive/file/move', {
          file_ids: fileIds,
          parent_id: parentId,
        });

        toast({
          title: translate("success", "drive", { default: "Success" }),
          description: translate("file_moved", "drive", {
            default: `${fileIds.length} file(s) moved successfully`,
          }),
        });

        await fetchFolders();
      } catch (error) {
        console.error("Error moving file:", error);
        toast({
          title: translate("error", "drive", { default: "Error" }),
          description: translate("error_moving_file", "drive", {
            default: "Failed to move file(s)",
          }),
          variant: "destructive",
        });
        throw error;
      }
    },
    [fetchFolders, translate]
  );

  // Delete file(s)
  const deleteFiles = useCallback(
    async (fileIds: string[]) => {
      try {
        await axiosInstance.delete('/drive/file/delete', {
          data: { file_ids: fileIds }
        });

        toast({
          title: translate("success", "drive", { default: "Success" }),
          description: translate("file_deleted", "drive", {
            default: `${fileIds.length} file(s) deleted successfully`,
          }),
        });

        await fetchFolders();
      } catch (error) {
        console.error("Error deleting file:", error);
        toast({
          title: translate("error", "drive", { default: "Error" }),
          description: translate("error_deleting_file", "drive", {
            default: "Failed to delete file(s)",
          }),
          variant: "destructive",
        });
        throw error;
      }
    },
    [fetchFolders, translate]
  );

  // Effect to fetch data when dependencies change
  useEffect(() => {
    if (selectedWorkspaceId && selectedProjectId) {
      console.log("Running fetchFolders effect");
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId]);

  return {
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
    renameFile,
    moveFile,
    deleteFiles,
    isUploading,
    uploadProgress,
  };
}

