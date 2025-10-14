/**
 * File type detection utilities for file preview functionality
 */

/**
 * Get the file extension from a filename
 */
function getFileExtension(fileName: string): string {
  const match = fileName.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : '';
}

/**
 * Check if a file is a text file based on MIME type and extension
 */
export function isTextFile(mimeType: string, fileName: string): boolean {
  const extension = getFileExtension(fileName);
  
  // Check MIME type
  if (mimeType.startsWith('text/')) {
    return true;
  }
  
  // Check common text file extensions
  const textExtensions = [
    'txt', 'md', 'markdown', 'json', 'xml', 'csv', 'log',
    'yaml', 'yml', 'ini', 'conf', 'config', 'env',
    'js', 'jsx', 'ts', 'tsx', 'css', 'scss', 'html',
    'py', 'java', 'c', 'cpp', 'h', 'hpp', 'go', 'rs',
    'sh', 'bash', 'sql', 'gitignore', 'dockerfile'
  ];
  
  return textExtensions.includes(extension);
}

/**
 * Get the preview type for a file
 */
export function getPreviewType(
  mimeType: string,
  fileName: string
): 'image' | 'pdf' | 'video' | 'audio' | 'text' | 'unsupported' {
  // PDF
  if (mimeType === 'application/pdf') {
    return 'pdf';
  }
  
  // Image
  if (mimeType.startsWith('image/')) {
    return 'image';
  }
  
  // Video
  if (mimeType.startsWith('video/')) {
    return 'video';
  }
  
  // Audio
  if (mimeType.startsWith('audio/')) {
    return 'audio';
  }
  
  // Text
  if (isTextFile(mimeType, fileName)) {
    return 'text';
  }
  
  // Unsupported
  return 'unsupported';
}

/**
 * Check if a file can be previewed
 */
export function isPreviewable(mimeType: string, fileName: string): boolean {
  const previewType = getPreviewType(mimeType, fileName);
  return previewType !== 'unsupported';
}

/**
 * Get modal size class based on file type
 */
export function getModalSizeClass(previewType: string): string {
  switch (previewType) {
    case 'image':
      return 'max-w-5xl';
    case 'pdf':
      return 'max-w-7xl';
    case 'video':
      return 'max-w-6xl';
    case 'audio':
      return 'max-w-2xl';
    case 'text':
      return 'max-w-4xl';
    case 'unsupported':
      return 'max-w-lg';
    default:
      return 'max-w-lg';
  }
}

