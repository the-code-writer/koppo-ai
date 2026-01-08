// Storage API service for file uploads

export interface FileUploadRequest {
  fileName: string;
  mimeType: string;
  lastModified: string;
  fileSize: number;
  data: string; // Base64 encoded file data
  metadata: {
    category: string;
    tags: string[];
  };
}

export interface FileUploadResponse {
  success: boolean;
  fileId?: string;
  url?: string;
  error?: string;
}

export interface UploadedFile {
  fileName: string;
  mimeType: string;
  lastModified: string;
  fileSize: number;
  url: string;
  fileId: string;
  metadata: {
    category: string;
    tags: string[];
  };
}

class StorageService {
  private baseUrl: string;

  constructor() {
    // Use a default base URL for browser environment
    this.baseUrl = import.meta.env?.VITE_API_BASE_URL || 
                   (typeof window !== 'undefined' && (window as any).__API_BASE_URL__) ||
                   'http://localhost:3001/api';
  }

  /**
   * Convert file to base64 string
   */
  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64Data = result.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  }

  /**
   * Upload a file to the storage API
   */
  async uploadFile(file: File, category: string = 'profile', tags: string[] = []): Promise<FileUploadResponse> {
    try {
      const base64Data = await this.fileToBase64(file);
      
      const uploadRequest: FileUploadRequest = {
        fileName: file.name,
        mimeType: file.type,
        lastModified: new Date(file.lastModified).toISOString(),
        fileSize: file.size,
        data: base64Data,
        metadata: {
          category,
          tags
        }
      };

      const response = await fetch(`${this.baseUrl}/v1/storage/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        },
        body: JSON.stringify(uploadRequest)
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      return {
        success: true,
        fileId: result.fileId,
        url: result.url
      };
    } catch (error) {
      console.error('File upload error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get uploaded file information
   */
  async getFileInfo(fileId: string): Promise<UploadedFile | null> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/storage/files/${fileId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch file info');
      }

      return await response.json();
    } catch (error) {
      console.error('Get file info error:', error);
      return null;
    }
  }

  /**
   * Delete a file
   */
  async deleteFile(fileId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/v1/storage/files/${fileId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken') || ''}`
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Delete file error:', error);
      return false;
    }
  }

  /**
   * Validate file before upload
   */
  validateFile(file: File, maxSizeMB: number = 5, allowedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp']): { valid: boolean; error?: string } {
    // Check file size
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      return {
        valid: false,
        error: `File size must be less than ${maxSizeMB}MB`
      };
    }

    // Check file type
    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        error: `File type must be one of: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }
}

export const storageService = new StorageService();
