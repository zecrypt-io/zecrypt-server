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
  uploadFolder: (files: FileList, parentId?: string | null) => Promise<void>;
  renameFile: (fileId: string, newName: string) => Promise<void>;
  moveFile: (fileIds: string[], parentId: string) => Promise<void>;
  deleteFiles: (fileIds: string[]) => Promise<void>;
  downloadFile: (fileId: string) => Promise<void>;
  downloadFolder: (folderId: string | null) => Promise<void>;
  previewFile: (fileId: string) => Promise<{ blobUrl: string; file: DriveFile } | null>;
  isUploading: boolean;
  uploadProgress: number;
  uploadStatusMessage: string;
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
  const [uploadStatusMessage, setUploadStatusMessage] = useState('');
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
      
      // Remove duplicates based on doc_id (file_id)
      const uniqueApiFiles = allApiFiles.reduce((acc: any[], file: any) => {
        const exists = acc.find(f => f.doc_id === file.doc_id);
        if (!exists) {
          acc.push(file);
        }
        return acc;
      }, []);
      
      // Map files from API response
      const mappedFiles: DriveFile[] = uniqueApiFiles.map((file: any) => {
        // Log if IV is missing - critical for decryption
        if (!file.iv) {
          console.warn(`⚠️ File "${file.name}" is missing IV (initialization vector). This file cannot be decrypted!`, file);
        }
        
        return {
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
        };
      });
      
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
        
        console.log("✅ Encryption complete. IV generated:", iv);
        console.log("Original size:", originalSize, "Encrypted size:", encryptedBlob.size);
        
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
        console.error("Error response:", error?.response);
        console.error("Error response data:", error?.response?.data);
        
        // Re-throw error to be handled by the upload dialog
        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatusMessage('');
      }
    },
    [selectedWorkspaceId, selectedProjectId, workspaces, fetchFolders, translate]
  );

  // Folder structure parsing interface
  interface FolderNode {
    name: string;
    path: string;
    parentPath: string | null;
    files: File[];
  }

  // Parse folder structure from FileList
  const parseFolderStructure = useCallback((fileList: FileList): FolderNode[] => {
    const folderMap = new Map<string, FolderNode>();
    
    // Process all files
    Array.from(fileList).forEach(file => {
      // Get the relative path (e.g., "folder/subfolder/file.txt")
      const relativePath = (file as any).webkitRelativePath || file.name;
      const pathParts = relativePath.split('/');
      
      // Build folder hierarchy
      if (pathParts.length > 1) {
        // File is inside folders
        let currentPath = '';
        for (let i = 0; i < pathParts.length - 1; i++) {
          const folderName = pathParts[i];
          const parentPath = currentPath || null;
          currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
          
          if (!folderMap.has(currentPath)) {
            folderMap.set(currentPath, {
              name: folderName,
              path: currentPath,
              parentPath: parentPath,
              files: [],
            });
          }
        }
        
        // Add file to its parent folder
        const folderNode = folderMap.get(currentPath);
        if (folderNode) {
          folderNode.files.push(file);
        }
      }
    });
    
    // Convert map to array and sort by depth (parents first)
    return Array.from(folderMap.values()).sort((a, b) => {
      const depthA = a.path.split('/').length;
      const depthB = b.path.split('/').length;
      return depthA - depthB;
    });
  }, []);

  // Upload folder with all files
  const uploadFolder = useCallback(
    async (fileList: FileList, parentId: string | null = null) => {
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

      setIsUploading(true);
      setUploadProgress(0);
      setUploadStatusMessage('');

      try {
        // 1. Parse folder structure
        const folderNodes = parseFolderStructure(fileList);
        
        if (folderNodes.length === 0) {
          toast({
            title: translate("error", "drive", { default: "Error" }),
            description: "No folders found to upload",
            variant: "destructive",
          });
          return;
        }

        // 2. Get project info and key (reuse for all files)
        const currentProject = workspaces
          .find(ws => ws.workspaceId === selectedWorkspaceId)
          ?.projects.find(p => p.project_id === selectedProjectId);
        
        if (!currentProject) {
          throw new Error("Project not found");
        }

        const projectKeyName = `projectKey_${currentProject.name}`;
        const projectKey = await secureGetItem(projectKeyName);
        
        if (!projectKey) {
          throw new Error("Project encryption key not found");
        }

        // 3. Create folder structure level by level (to get IDs after each level)
        const folderIdMap = new Map<string, string>();
        setUploadStatusMessage('Creating folders...');
        
        console.log('📁 Creating folder structure:', folderNodes);
        
        // Group folders by depth level
        const foldersByLevel = new Map<number, typeof folderNodes>();
        folderNodes.forEach(node => {
          const depth = node.path.split('/').length;
          if (!foldersByLevel.has(depth)) {
            foldersByLevel.set(depth, []);
          }
          foldersByLevel.get(depth)!.push(node);
        });
        
        const maxDepth = Math.max(...Array.from(foldersByLevel.keys()));
        console.log(`📊 Folder structure has ${maxDepth} level(s)`);
        
        // Helper function to fetch and build folder ID map
        const updateFolderIdMap = async () => {
          const foldersResponse = await axiosInstance.get('/drive/folder/list');
          const apiFolders = foldersResponse.data?.data?.folders || [];
          
          // Recursively build folder paths from the API response
          const buildFolderPaths = (folders: any[], currentParentId: string | null, pathPrefix: string = '') => {
            folders
              .filter((f: any) => (f.parent_id || null) === currentParentId)
              .forEach((folder: any) => {
                const folderPath = pathPrefix ? `${pathPrefix}/${folder.name}` : folder.name;
                const folderId = folder.doc_id;
                
                folderIdMap.set(folderPath, folderId);
                console.log(`  📂 Mapped: ${folderPath} -> ${folderId}`);
                
                // Recursively map child folders
                buildFolderPaths(folders, folderId, folderPath);
              });
          };
          
          buildFolderPaths(apiFolders, parentId);
        };
        
        // Create folders level by level
        for (let level = 1; level <= maxDepth; level++) {
          const levelFolders = foldersByLevel.get(level) || [];
          console.log(`\n📁 Creating level ${level} (${levelFolders.length} folders)...`);
          
          // Create all folders at this level
          for (const folderNode of levelFolders) {
            try {
              // Determine parent folder ID from previous levels
              let folderParentId = parentId;
              if (folderNode.parentPath) {
                folderParentId = folderIdMap.get(folderNode.parentPath) || parentId;
              }

              console.log(`  Creating: ${folderNode.name} (parent: ${folderParentId || 'root'})`);

              // Create folder via API
              const payload: { name: string; parent_id?: string } = { name: folderNode.name };
              if (folderParentId) {
                payload.parent_id = folderParentId;
              }

              await axiosInstance.post('/drive/folder/create', payload);
              console.log(`  ✅ Created: ${folderNode.name}`);
            } catch (error: any) {
              console.error(`  ❌ Error creating folder ${folderNode.name}:`, error?.response?.data?.message || error.message);
              // Continue with other folders even if one fails
            }
          }
          
          // After creating this level, fetch folder list to get their IDs
          console.log(`📥 Fetching folder list to get IDs for level ${level}...`);
          await updateFolderIdMap();
        }
        
        console.log('\n📊 Final folder ID map:', Object.fromEntries(folderIdMap));

        // 4. Count total files to upload
        const allFiles = Array.from(fileList);
        let uploadedCount = 0;
        let skippedCount = 0;
        const skippedFiles: string[] = [];

        // 5. Upload all files with progress tracking
        for (const file of allFiles) {
          try {
            // Validate file size
            if (!validateFileSize(file, 50)) {
              skippedCount++;
              skippedFiles.push(file.name);
              console.warn(`Skipping ${file.name}: exceeds 50MB limit`);
              continue;
            }

            // Determine parent folder for this file
            const relativePath = (file as any).webkitRelativePath || file.name;
            const pathParts = relativePath.split('/');
            let fileParentId = parentId;
            
            if (pathParts.length > 1) {
              // File is inside a folder
              const folderPath = pathParts.slice(0, -1).join('/');
              fileParentId = folderIdMap.get(folderPath) || parentId;
              console.log(`📄 File: ${file.name}, folderPath: ${folderPath}, parent: ${fileParentId || 'root'}`);
            } else {
              console.log(`📄 File: ${file.name} (no folder), parent: ${fileParentId || 'root'}`);
            }

            // Update status
            const progress = Math.round(((uploadedCount + 1) / allFiles.length) * 100);
            setUploadProgress(progress);
            setUploadStatusMessage(`Uploading file ${uploadedCount + 1} of ${allFiles.length}`);

            // Encrypt file
            const { encryptedBlob, iv, originalSize } = await encryptFileBlob(file, projectKey);

            // Get presigned URL
            const payload: any = {
              file_type: file.type || 'application/octet-stream',
              name: file.name,
              file_path: file.name,
              size: encryptedBlob.size.toString(),
              iv: iv,
              parent_id: fileParentId || '',
            };

            const presignedResponse = await axiosInstance.post('/drive/file/get-presigned-url', payload);

            // Extract presigned URL
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
              throw new Error("Invalid presigned URL response from server");
            }

            if (!presignedUrl || typeof presignedUrl !== 'string') {
              throw new Error("Invalid presigned URL received from server");
            }

            // Upload to Digital Ocean
            const uploadResponse = await fetch(presignedUrl, {
              method: 'PUT',
              body: encryptedBlob,
            });

            if (!uploadResponse.ok) {
              throw new Error(`Failed to upload file to storage: ${uploadResponse.status}`);
            }

            uploadedCount++;
          } catch (error: any) {
            console.error(`Error uploading file ${file.name}:`, error);
            skippedCount++;
            skippedFiles.push(file.name);
            // Continue with other files
          }
        }

        // 6. Show completion message
        setUploadProgress(100);
        
        let successMessage = `${uploadedCount} file(s) uploaded successfully`;
        if (skippedCount > 0) {
          successMessage += `. ${skippedCount} file(s) skipped`;
        }

        toast({
          title: translate("success", "drive", { default: "Success" }),
          description: successMessage,
        });

        // Show detailed skipped files if any
        if (skippedFiles.length > 0 && skippedFiles.length <= 5) {
          toast({
            title: "Skipped files",
            description: skippedFiles.join(', '),
            variant: "destructive",
          });
        }

        // 7. Refresh folder list
        await fetchFolders();
      } catch (error: any) {
        console.error("Error uploading folder:", error);
        console.error("Error response:", error?.response);
        console.error("Error response data:", error?.response?.data);
        
        // Re-throw error to be handled by the upload dialog
        throw error;
      } finally {
        setIsUploading(false);
        setUploadProgress(0);
        setUploadStatusMessage('');
      }
    },
    [selectedWorkspaceId, selectedProjectId, workspaces, parseFolderStructure, fetchFolders, translate]
  );
  
  // Remove parseFolderStructure interface definition to avoid confusion
  // It's already defined above

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

  // Preview file
  const previewFile = useCallback(async (fileId: string): Promise<{ blobUrl: string; file: DriveFile } | null> => {
    const file = files.find(f => f.file_id === fileId);
    
    if (!file) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("file_not_found", "drive", { default: "File not found" }),
        variant: "destructive",
      });
      return null;
    }

    if (!file.download_url) {
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("download_url_missing", "drive", { default: "Download URL not available" }),
        variant: "destructive",
      });
      return null;
    }

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

      // Download encrypted file
      const encryptedBlob = await downloadFileFromUrl(file.download_url);
      
      // Decrypt the file
      const decryptedBlob = await decryptFileBlob(encryptedBlob, file.iv, projectKey);
      
      // Create blob with proper MIME type
      const blobWithType = new Blob([decryptedBlob], { type: file.type || 'application/octet-stream' });
      
      // Create object URL
      const blobUrl = URL.createObjectURL(blobWithType);

      return { blobUrl, file };
    } catch (error) {
      console.error("Error previewing file:", error);
      toast({
        title: translate("error", "drive", { default: "Error" }),
        description: translate("preview_error", "drive", { default: "Failed to preview file" }),
        variant: "destructive",
      });
      return null;
    }
  }, [files, workspaces, selectedWorkspaceId, selectedProjectId, translate]);

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
  };
}

