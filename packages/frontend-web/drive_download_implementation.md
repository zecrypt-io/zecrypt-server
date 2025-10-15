# Drive Download Implementation Plan

## **Implementation Plan: Download Functionality for Drive Files and Folders**

### **Overview**
Add download capability for individual files (with decryption) and folders (as zip archives) in the Drive section. Files will be fetched via their Digital Ocean download URLs, decrypted client-side, and saved to the user's device. Folders will recursively collect all files, decrypt them, and package them into a zip file.

---

### **Phase 1: Dependencies and Type Updates**

#### 1.1 Install JSZip for Zip Creation
**File**: `package.json`
- Add `jszip` and `@types/jszip` dependencies
- Required for client-side zip file creation

#### 1.2 Update DriveFile Interface
**File**: `hooks/use-drive-management.ts` (lines 23-37)
- Add `download_url?: string` field to DriveFile interface
- This will store the presigned URL from Digital Ocean

#### 1.3 Update API Response Mapping
**File**: `hooks/use-drive-management.ts` (lines 114-128)
- Update the file mapping to extract `file_url.download_url` from API response
- Store it in the `download_url` field

---

### **Phase 2: Download Utilities**

#### 2.1 Create Download Helper Functions
**File**: `libs/file-encryption.ts` (new functions at end)
- **`downloadFileFromUrl(url: string): Promise<Blob>`**
  - Fetches encrypted file from download URL
  - Returns blob for decryption
  
- **`saveDecryptedFile(blob: Blob, fileName: string, mimeType: string): void`**
  - Creates download link and triggers browser download
  - Handles proper file naming and MIME type

- **`decryptAndDownloadFile(downloadUrl: string, fileName: string, mimeType: string, ivHex: string, projectAesKey: string): Promise<void>`**
  - Orchestrates: fetch → decrypt → save
  - Main function for single file download

---

### **Phase 3: Drive Management Hook Updates**

#### 3.1 Add Download Functions to Hook
**File**: `hooks/use-drive-management.ts`

**New functions to add:**

- **`downloadFile(fileId: string): Promise<void>`**
  - Downloads and decrypts a single file
  - Gets project key from secure storage
  - Shows toast notifications for success/error
  - Uses loading state

- **`downloadFolder(folderId: string | null): Promise<void>`**
  - Recursively collects all files in folder and subfolders
  - Downloads and decrypts each file
  - Creates zip archive with proper folder structure
  - Shows progress (e.g., "Downloading 3 of 10 files...")
  - Handles errors gracefully (continues on file errors)

**Helper function:**
- **`getAllFilesInFolder(folderId: string | null): { file: DriveFile; path: string }[]`**
  - Recursively traverses folder tree
  - Returns array of files with their relative paths for zip structure
  - Path format: "folder1/subfolder2/file.txt"

#### 3.2 Update Hook Return Type
**File**: `hooks/use-drive-management.ts` (lines 44-63)
- Add `downloadFile: (fileId: string) => Promise<void>`
- Add `downloadFolder: (folderId: string | null) => Promise<void>`
- Add `isDownloading: boolean` state
- Add `downloadProgress: string` for progress messages

---

### **Phase 4: UI Component Updates**

#### 4.1 Update FileCard Component
**File**: `components/file-card.tsx`

- Add `onDownload: (file: DriveFile) => void` prop
- Add Download menu item in dropdown (after Move, before separator)
- Icon: `Download` from lucide-react
- Label: Translation key "download"

**Menu structure:**
```
- Rename
- Move  
- Download (NEW)
---
- Delete
```

#### 4.2 Update DriveContent Component (File Downloads)
**File**: `components/drive-content.tsx`

- Import `downloadFile` from hook
- Add handler: `handleDownloadFile(file: DriveFile)`
- Pass `onDownload={handleDownloadFile}` to FileCard
- Add loading state handling during download

#### 4.3 Update DriveContent Component (Folder Downloads)
**File**: `components/drive-content.tsx`

- Import `downloadFolder` from hook
- Add Download option to folder dropdown menu (lines 315-350)
- Add handler: `handleDownloadFolder(folder: Folder)`
- Add `Download` icon from lucide-react
- Show loading indicator during folder download

**Folder menu structure:**
```
- Open
- Rename
- Move
- Download (NEW)
---
- Delete
```

#### 4.4 Add Download Progress Indicator
**File**: `components/drive-content.tsx`

- Show toast or inline message when downloading folder
- Display: "Downloading folder: 3 of 10 files..."
- Use `downloadProgress` from hook

---

### **Phase 5: Translation Keys**

#### 5.1 Add Translation Keys
**File**: `messages/en/common.json`

Add to "drive" section:
```json
{
  "download": "Download",
  "downloading": "Downloading...",
  "download_file": "Download file",
  "download_folder": "Download folder",
  "downloading_file": "Downloading file...",
  "downloading_folder": "Downloading folder...",
  "download_success": "Download completed",
  "download_error": "Failed to download",
  "preparing_download": "Preparing download...",
  "downloading_progress": "Downloading {current} of {total} files...",
  "creating_zip": "Creating zip archive...",
  "no_files_in_folder": "Folder is empty",
  "decrypting_files": "Decrypting files..."
}
```

---

### **Phase 6: Error Handling and Edge Cases**

#### 6.1 Handle Missing download_url
- Check if `download_url` exists before attempting download
- Show error: "Download URL not available"

#### 6.2 Handle Decryption Errors
- Catch decryption failures
- Show specific error message
- Don't crash entire folder download on single file error

#### 6.3 Handle Empty Folders
- Check if folder has any files (recursively)
- Show toast: "Folder is empty"
- Don't create empty zip

#### 6.4 Handle Large Folder Downloads
- Show warning if folder has >50 files (optional)
- Implement cancellation (future enhancement)
- Show progress clearly

#### 6.5 Handle Missing Project Key
- Check for project AES key in secure storage
- Show error if not found
- Guide user to unlock project first

---

### **Detailed Implementation Code Snippets**

#### **File**: `libs/file-encryption.ts` (new functions)

```typescript
/**
 * Download file from URL
 */
export async function downloadFileFromUrl(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download file: ${response.statusText}`);
  }
  return await response.blob();
}

/**
 * Save decrypted blob as file download
 */
export function saveDecryptedFile(blob: Blob, fileName: string, mimeType: string): void {
  const blobWithType = new Blob([blob], { type: mimeType });
  const url = URL.createObjectURL(blobWithType);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download, decrypt and save a file
 */
export async function decryptAndDownloadFile(
  downloadUrl: string,
  fileName: string,
  mimeType: string,
  ivHex: string,
  projectAesKey: string
): Promise<void> {
  // 1. Download encrypted file
  const encryptedBlob = await downloadFileFromUrl(downloadUrl);
  
  // 2. Decrypt the file
  const decryptedBlob = await decryptFileBlob(encryptedBlob, ivHex, projectAesKey);
  
  // 3. Trigger download
  saveDecryptedFile(decryptedBlob, fileName, mimeType);
}
```

#### **File**: `hooks/use-drive-management.ts` (new state and functions)

```typescript
// Add to state (around line 75)
const [isDownloading, setIsDownloading] = useState(false);
const [downloadProgress, setDownloadProgress] = useState('');

// Add helper function to get all files recursively
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
    // Get project AES key
    const projectKey = secureGetItem(`project_${selectedProjectId}_aes_key`);
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
}, [files, selectedProjectId, translate]);

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
    // Get project AES key
    const projectKey = secureGetItem(`project_${selectedProjectId}_aes_key`);
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
}, [folders, files, getAllFilesInFolder, selectedProjectId, translate]);

// Update return statement to include new functions (around line 580)
return {
  // ... existing properties
  downloadFile,
  downloadFolder,
  isDownloading,
  downloadProgress,
};
```

#### **File**: `components/file-card.tsx` (update)

```typescript
// Add to props interface (line 28-33)
interface FileCardProps {
  file: DriveFile;
  onRename: (file: DriveFile) => void;
  onMove: (file: DriveFile) => void;
  onDelete: (file: DriveFile) => void;
  onDownload: (file: DriveFile) => void; // NEW
}

// Update component signature (line 35)
export function FileCard({ file, onRename, onMove, onDelete, onDownload }: FileCardProps) {

// Add Download import at top
import { MoreVertical, Edit2, Move, Trash2, Download } from "lucide-react";

// Add menu item in dropdown (after Move, before separator around line 89)
<DropdownMenuItem
  onClick={() => {
    onDownload(file);
    setShowMenu(false);
  }}
>
  <Download className="h-4 w-4 mr-2" />
  {translate("download", "actions", { default: "Download" })}
</DropdownMenuItem>
<DropdownMenuSeparator />
```

#### **File**: `components/drive-content.tsx` (update)

```typescript
// Add Download to imports (line 17)
import {
  // ... existing imports
  Download,
} from "lucide-react";

// Import download functions (around line 77-99)
const {
  // ... existing properties
  downloadFile,
  downloadFolder,
  isDownloading,
  downloadProgress,
} = useDriveManagement({
  selectedWorkspaceId,
  selectedProjectId,
});

// Add handlers (around line 200)
const handleDownloadFile = async (file: DriveFile) => {
  await downloadFile(file.file_id);
};

const handleDownloadFolder = async (folder: Folder) => {
  await downloadFolder(folder.folder_id);
};

// Update FileCard usage (around line 365)
<FileCard
  key={file.file_id}
  file={file}
  onRename={handleRenameFile}
  onMove={handleMoveFile}
  onDelete={handleDeleteFile}
  onDownload={handleDownloadFile} // NEW
/>

// Add Download option to folder dropdown (around line 340, after Move)
<DropdownMenuItem onClick={() => handleDownloadFolder(folder)}>
  <Download className="mr-2 h-4 w-4" />
  {translate("download", "drive", { default: "Download" })}
</DropdownMenuItem>
```

---

### **Testing Checklist**

- [ ] Download single file (small < 1MB)
- [ ] Download single file (large ~10MB)
- [ ] Download folder with single file
- [ ] Download folder with multiple files
- [ ] Download nested folder (folder with subfolders)
- [ ] Download folder preserves folder structure in zip
- [ ] Download root folder (all files)
- [ ] Error handling: missing download URL
- [ ] Error handling: decryption failure
- [ ] Error handling: missing project key
- [ ] Error handling: empty folder
- [ ] Progress indicators show correctly
- [ ] Toast notifications appear
- [ ] Downloaded files open correctly
- [ ] File MIME types preserved
- [ ] Large folder downloads (20+ files)
- [ ] Concurrent download prevention (disable UI during download)

---

### **File Summary**

**New Dependencies:**
- `jszip` (^3.10.1)
- `@types/jszip` (^3.4.1)

**Modified Files:**
1. `package.json` - Add JSZip dependency
2. `hooks/use-drive-management.ts` - Add download functions, update interface
3. `libs/file-encryption.ts` - Add download utility functions
4. `components/file-card.tsx` - Add download option
5. `components/drive-content.tsx` - Add folder download option and handlers
6. `messages/en/common.json` - Add translation keys

**Total Changes:** 6 files

---

This implementation provides a complete, production-ready download solution with proper encryption/decryption, folder zip support, progress indicators, and comprehensive error handling. The solution follows existing codebase patterns and conventions.
