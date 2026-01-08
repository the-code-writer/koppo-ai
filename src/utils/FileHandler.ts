/**
 * FileHandler class for handling file uploads and base64 conversion
 */
export class FileHandler {
  /**
   * Convert a file to base64 encoded string
   * @param file - The file to convert
   * @returns Promise<string> - Base64 encoded string
   */
  static async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data URL prefix to get pure base64
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to convert file to base64'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Handle file upload and return base64 encoded result
   * @param file - The uploaded file
   * @returns Promise<{base64: string, fileName: string, fileType: string}>
   */
  static async handleFileUpload(file: File): Promise<{
    base64: string;
    fileName: string;
    fileType: string;
  }> {
    try {
      const base64 = await this.fileToBase64(file);
      
      return {
        base64,
        fileName: file.name,
        fileType: file.type
      };
    } catch (error) {
      throw new Error(`File upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Validate image file
   * @param file - The file to validate
   * @returns boolean - True if valid image file
   */
  static validateImageFile(file: File): boolean {
    // Check file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      return false;
    }

    // Check file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB in bytes
    if (file.size > maxSize) {
      return false;
    }

    return true;
  }

  /**
   * Get image dimensions
   * @param file - The image file
   * @returns Promise<{width: number, height: number}>
   */
  static async getImageDimensions(file: File): Promise<{width: number, height: number}> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        resolve({
          width: img.width,
          height: img.height
        });
      };
      
      img.onerror = () => {
        reject(new Error('Failed to load image for dimension check'));
      };
      
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Create data URL from base64
   * @param base64 - Base64 string
   * @param fileType - File type (mime type)
   * @returns string - Data URL
   */
  static createDataUrl(base64: string, fileType: string): string {
    return `data:${fileType};base64,${base64}`;
  }
}
