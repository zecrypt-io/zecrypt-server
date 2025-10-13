"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/libs/Redux/store";
import axiosInstance from "@/libs/Middleware/axiosInstace";
import { toast } from "@/components/ui/use-toast";
import { useTranslator } from "@/hooks/use-translations";
import { encryptFileBlob, validateFileSize, decryptAndDownloadFile, downloadFileFromUrl, decryptFileBlob, saveDecryptedFile } from "@/libs/file-encryption";
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
  download_url?: string; // presigned URL from Digital Ocean
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
  downloadFile: (fileId: string) => Promise<void>;
  downloadFolder: (folderId: string | null) => Promise<void>;
  isUploading: boolean;
  uploadProgress: number;
  isDownloading: boolean;
  downloadProgress: string;
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState('');
  
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
      // Fetch all folders (parent_id is optional, omitting it returns all folders)
      const response = await axiosInstance.get(`/drive/folder/list`);
      
      // The API returns folders at response.data.data.folders
      const apiFolders = response.data?.data?.folders || [];
      const rootLevelFiles = response.data?.data?.files || [];
      
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
      
      // Extract all files from both root level and inside folders
      const allApiFiles: any[] = [...rootLevelFiles];
      
      // Also extract files from inside each folder
      apiFolders.forEach((folder: any) => {
        if (folder.files && Array.isArray(folder.files)) {
          allApiFiles.push(...folder.files);
        }
      });
      
      // Map files from API response
      const mappedFiles: DriveFile[] = allApiFiles.map((file: any) => ({
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
        download_url: file.file_url, // file_url is directly the URL string
      }));
      
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
        console.log("Presigned response data:", presignedResponse.data);
        
        // Extract presigned URL from response
        // Backend might return either direct URL string or nested in data.data or data.url
        let presignedUrl: string;
        if (typeof presignedResponse.data === 'string') {
          presignedUrl = presignedResponse.data;
        } else if (presignedResponse.data?.data) {
          presignedUrl = typeof presignedResponse.data.data === 'string' 
            ? presignedResponse.data.data 
            : presignedResponse.data.data?.upload_url || presignedResponse.data.data?.url || presignedResponse.data.data?.presigned_url;
        } else if (presignedResponse.data?.upload_url) {
          presignedUrl = presignedResponse.data.upload_url;
        } else if (presignedResponse.data?.url) {
          presignedUrl = presignedResponse.data.url;
        } else if (presignedResponse.data?.presigned_url) {
          presignedUrl = presignedResponse.data.presigned_url;
        } else {
          console.error("Could not extract presigned URL from response:", presignedResponse.data);
          throw new Error("Invalid presigned URL response from server");
        }
        
        console.log("Extracted presigned URL:", presignedUrl);
        
        if (!presignedUrl || typeof presignedUrl !== 'string') {
          throw new Error("Invalid presigned URL received from server");
        }
        
        setUploadProgress(50);

        // 6. Upload encrypted blob to presigned URL
        console.log("Uploading encrypted file to presigned URL:", presignedUrl);
        console.log("Encrypted blob size:", encryptedBlob.size);
        
        const uploadResponse = await fetch(presignedUrl, {
          method: 'PUT',
          body: encryptedBlob,
          // Don't set Content-Type explicitly - let browser handle it to avoid CORS preflight
        });

        console.log("Upload response status:", uploadResponse.status, uploadResponse.statusText);

        // Critical: Check if upload was successful
        if (!uploadResponse.ok) {
          const errorText = await uploadResponse.text();
          console.error("Upload failed:", {
            status: uploadResponse.status,
            statusText: uploadResponse.statusText,
            error: errorText
          });
          throw new Error(`Failed to upload file to storage: ${uploadResponse.status} ${uploadResponse.statusText}`);
        }

        console.log("File successfully uploaded to Digital Ocean");
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
      fetchFolders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWorkspaceId, selectedProjectId]);

  // Helper function to get all files recursively in a folder
  const getAllFilesInFolder = useCallback((folderId: string | null): { file: DriveFile; path: string }[] => {
    const result: { file: DriveFile; path: string }[] = [];
    
    const traverse = (parentId: string | null, currentPath: string = '') => {
      // Get files in current folder
      const folderFiles = files.filter(f => f.parent_id === parentId);
      folderFiles.forEach(file => {
        result.push({
          file,
          path: currentPath ? `${currentPath}/${file.name}` : file.name
        });
      });
      
      // Get subfolders and recurse
      const subfolders = folders.filter(f => f.parent_id === parentId);
      subfolders.forEach(folder => {
        const newPath = currentPath ? `${currentPath}/${folder.name}` : folder.name;
        traverse(folder.folder_id, newPath);
      });
    };
    
    traverse(folderId);
    return result;
  }, [files, folders]);

  // Download single file
  const downloadFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.file_id === fileId);
    
    if (!file) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("file_not_found", "drive", { default: "File not found" }),
        variant: "destructive",
      });
      return;
    }

    if (!file.download_url) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("download_url_missing", "drive", { default: "Download URL not available" }),
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Get project info for key lookup
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        throw new Error("Project not found");
      }

      // Get project AES key using project name
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectKey = await secureGetItem(projectKeyName);
      
      if (!projectKey) {
        throw new Error("Project key not found");
      }

      toast({
        title: translate("downloading", "drive", { default: "Downloading..." }),
        description: file.name,
      });

      await decryptAndDownloadFile(
        file.download_url,
        file.name,
        file.type,
        file.iv,
        projectKey
      );

      toast({
        title: translate("download_success", "drive", { default: "Download completed" }),
        description: file.name,
      });
    } catch (error) {
      console.error("Error downloading file:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("download_error", "drive", { default: "Failed to download file" }),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [files, workspaces, selectedWorkspaceId, selectedProjectId, translate]);

  // Download folder as zip
  const downloadFolder = useCallback(async (folderId: string | null) => {
    const folderName = folderId 
      ? folders.find(f => f.folder_id === folderId)?.name || 'folder'
      : 'root';

    // Get all files in folder
    const allFiles = getAllFilesInFolder(folderId);
    
    if (allFiles.length === 0) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("no_files_in_folder", "drive", { default: "Folder is empty" }),
        variant: "destructive",
      });
      return;
    }

    setIsDownloading(true);
    try {
      // Get project info for key lookup
      const currentProject = workspaces
        .find(ws => ws.workspaceId === selectedWorkspaceId)
        ?.projects.find(p => p.project_id === selectedProjectId);
      
      if (!currentProject) {
        throw new Error("Project not found");
      }

      // Get project AES key using project name
      const projectKeyName = `projectKey_${currentProject.name}`;
      const projectKey = await secureGetItem(projectKeyName);
      if (!projectKey) {
        throw new Error("Project key not found");
      }

      // Import JSZip
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();

      // Download and decrypt each file
      for (let i = 0; i < allFiles.length; i++) {
        const { file, path } = allFiles[i];
        
        setDownloadProgress(`${i + 1} of ${allFiles.length}`);
        
        toast({
          title: translate("downloading_progress", "drive", { 
            default: "Downloading {current} of {total} files...",
            current: (i + 1).toString(),
            total: allFiles.length.toString()
          }),
        });

        try {
          if (!file.download_url) continue;
          
          // Download and decrypt
          const encryptedBlob = await downloadFileFromUrl(file.download_url);
          const decryptedBlob = await decryptFileBlob(encryptedBlob, file.iv, projectKey);
          
          // Add to zip with proper path
          zip.file(path, decryptedBlob);
        } catch (error) {
          console.error(`Error downloading file ${file.name}:`, error);
          // Continue with other files
        }
      }

      // Generate zip
      toast({
        title: translate("creating_zip", "drive", { default: "Creating zip archive..." }),
      });
      
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      // Download zip
      saveDecryptedFile(zipBlob, `${folderName}.zip`, 'application/zip');

      toast({
        title: translate("download_success", "drive", { default: "Download completed" }),
        description: `${allFiles.length} files downloaded`,
      });
    } catch (error) {
      console.error("Error downloading folder:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("download_error", "drive", { default: "Failed to download folder" }),
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
      setDownloadProgress('');
    }
  }, [folders, files, workspaces, getAllFilesInFolder, selectedWorkspaceId, selectedProjectId, translate]);

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
    downloadFile,
    downloadFolder,
    isUploading,
    uploadProgress,
    isDownloading,
    downloadProgress,
  };
}

