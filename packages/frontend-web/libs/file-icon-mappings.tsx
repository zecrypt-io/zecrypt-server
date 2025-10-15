/**
 * File type icon mappings for Drive feature
 * Maps MIME types to appropriate Lucide icons
 */

import { 
  FileIcon, 
  FileText, 
  Image, 
  Film, 
  Music, 
  Archive,
  FileCode,
  FileSpreadsheet,
  FileType,
  File
} from 'lucide-react';

/**
 * Get the appropriate icon for a file based on its MIME type
 */
export function getFileIcon(mimeType: string) {
  // Images
  if (mimeType.startsWith('image/')) return Image;
  
  // Videos
  if (mimeType.startsWith('video/')) return Film;
  
  // Audio
  if (mimeType.startsWith('audio/')) return Music;
  
  // Documents
  if (mimeType.includes('pdf')) return FileText;
  if (mimeType.includes('word') || mimeType.includes('document')) return FileText;
  if (mimeType.includes('text/')) return FileType;
  
  // Spreadsheets
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet;
  
  // Code files
  if (
    mimeType.includes('javascript') ||
    mimeType.includes('typescript') ||
    mimeType.includes('json') ||
    mimeType.includes('html') ||
    mimeType.includes('css') ||
    mimeType.includes('python') ||
    mimeType.includes('java')
  ) {
    return FileCode;
  }
  
  // Archives
  if (
    mimeType.includes('zip') ||
    mimeType.includes('compressed') ||
    mimeType.includes('tar') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z')
  ) {
    return Archive;
  }
  
  // Default
  return FileIcon;
}

/**
 * Get color class for file icon based on MIME type
 */
export function getFileIconColor(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'text-purple-500';
  if (mimeType.startsWith('video/')) return 'text-red-500';
  if (mimeType.startsWith('audio/')) return 'text-green-500';
  if (mimeType.includes('pdf')) return 'text-red-600';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600';
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'text-green-600';
  if (mimeType.includes('zip') || mimeType.includes('compressed')) return 'text-yellow-600';
  
  return 'text-gray-500';
}

