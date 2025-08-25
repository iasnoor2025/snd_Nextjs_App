import { supabase, STORAGE_BUCKETS, StorageBucket } from './client';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  type?: string;
  message: string;
  error?: string;
}

export interface FileMetadata {
  id: string;
  name: string;
  size: number;
  mime_type: string;
  created_at: string;
  updated_at: string;
  bucket_id: string;
  path: string;
}

export class SupabaseStorageService {
  /**
   * Upload a file to Supabase storage
   */
  static async uploadFile(
    file: File,
    bucket: StorageBucket | string = STORAGE_BUCKETS.GENERAL,
    path?: string,
    customFilename?: string
  ): Promise<UploadResult> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase is not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.',
          error: 'SUPABASE_NOT_CONFIGURED',
        };
      }

      // Validate file type
      if (!this.isValidFileType(file.name)) {
        return {
          success: false,
          message: 'Invalid file type. Allowed types: PDF, JPG, JPEG, PNG, DOC, DOCX',
          error: 'INVALID_FILE_TYPE',
        };
      }

      // Validate file size (10MB max)
      if (!this.isValidFileSize(file.size)) {
        return {
          success: false,
          message: 'File size too large. Maximum size is 10MB',
          error: 'FILE_TOO_LARGE',
        };
      }

      // Generate unique filename
      const uniqueFilename = customFilename 
        ? this.generateCustomFilename(customFilename, file.name)
        : this.generateUniqueFilename(file.name);
      const filePath = path ? `${path}/${uniqueFilename}` : uniqueFilename;

      // Upload file to Supabase storage
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          error: error.message,
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: urlData.publicUrl,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        message: 'File uploaded successfully to Supabase',
      };
    } catch (error) {
      console.error('Upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a file from Supabase storage
   */
  static async deleteFile(
    bucket: StorageBucket | string,
    path: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase is not configured. Please set environment variables.',
          error: 'SUPABASE_NOT_CONFIGURED',
        };
      }

      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) {
        return {
          success: false,
          message: `Delete failed: ${error.message}`,
          error: error.message,
        };
      }

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
      }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(
    bucket: StorageBucket | string,
    path: string
  ): Promise<{ success: boolean; metadata?: FileMetadata; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Please set environment variables.',
        };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path.split('/').slice(0, -1).join('/'), {
          limit: 1,
          offset: 0,
          search: path.split('/').pop() || '',
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (data && data.length > 0) {
        const file = data[0];
        if (file) {
          return {
            success: true,
            metadata: {
              id: file.id,
              name: file.name,
              size: file.metadata?.size || 0,
              mime_type: file.metadata?.mimetype || '',
              created_at: file.created_at,
              updated_at: file.updated_at,
              bucket_id: file.bucket_id,
              path: file.name,
            },
          };
        }
      }

      return {
        success: false,
        error: 'File not found',
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List files in a bucket/folder
   */
  static async listFiles(
    bucket: StorageBucket | string,
    path?: string
  ): Promise<{ success: boolean; files?: FileMetadata[]; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Please set environment variables.',
        };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path || '', {
          limit: 100,
          offset: 0,
        });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      const files: FileMetadata[] = (data || [])
        .filter(item => !item.name.endsWith('/')) // Filter out folders
        .map(item => ({
          id: item.id,
          name: item.name,
          size: item.metadata?.size || 0,
          mime_type: item.metadata?.mimetype || '',
          created_at: item.created_at,
          updated_at: item.updated_at,
          bucket_id: item.bucket_id,
          path: path ? `${path}/${item.name}` : item.name,
        }));

      return {
        success: true,
        files,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: StorageBucket | string, path: string): string {
    if (!supabase) {
      return '';
    }
    
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * Get public URL for a file with custom bucket name
   */
  static getPublicUrlForBucket(bucketName: string, path: string): string {
    if (!supabase) {
      return '';
    }
    
    const { data } = supabase.storage
      .from(bucketName)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }

  /**
   * List all available buckets
   */
  static async listBuckets(): Promise<{ success: boolean; buckets?: string[]; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Please set environment variables.',
        };
      }

      // Try to list buckets using the storage API
      // Note: listBuckets() might not be available in all Supabase versions
      // We'll try to get bucket info by attempting to list files from known buckets
      const knownBuckets = ['documents', 'employee-documents', 'equipment-documents', 'general'];
      const availableBuckets: string[] = [];

      for (const bucketName of knownBuckets) {
        try {
          const { data, error } = await supabase.storage
            .from(bucketName)
            .list('', { limit: 1 });
          
          if (!error) {
            availableBuckets.push(bucketName);
          }
        } catch (bucketError) {
          // Bucket doesn't exist or is not accessible
          console.log(`Bucket ${bucketName} not accessible:`, bucketError);
        }
      }

      return {
        success: true,
        buckets: availableBuckets,
      };
    } catch (error) {
      console.error('Error listing buckets:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Download a file as blob
   */
  static async downloadFile(
    bucket: StorageBucket | string,
    path: string
  ): Promise<{ success: boolean; blob?: Blob; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured. Please set environment variables.',
        };
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .download(path);

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      return {
        success: true,
        blob: data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  // Helper methods
  private static isValidFileType(filename: string): boolean {
    const allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const extension = filename.toLowerCase().split('.').pop();
    return allowedTypes.includes(`.${extension}`);
  }

  private static isValidFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }

  private static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalName.split('.').pop();
    return `${timestamp}-${randomString}.${extension}`;
  }

  private static generateCustomFilename(customName: string, originalName: string): string {
    const extension = originalName.split('.').pop();
    
    // Clean the custom name by removing any existing file extensions
    const cleanCustomName = customName
      .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
      .replace(/[^a-zA-Z0-9\-_]/g, '-') // Replace special chars with hyphens (keep hyphens and underscores)
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    const result = `${cleanCustomName}.${extension}`;
    
    return result;
  }

  /**
   * Generate a descriptive filename based on document type and context
   */
  static generateDescriptiveFilename(
    documentType: string,
    context: string,
    originalName: string,
    index?: number
  ): string {
    const extension = originalName.split('.').pop();
    
    // Clean and sanitize the document type and context
    // Remove any file extensions and special characters
    const cleanDocumentType = documentType
      .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with hyphens
      .toLowerCase()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    const cleanContext = context
      .replace(/\.(pdf|jpg|jpeg|png|doc|docx)$/i, '') // Remove common file extensions
      .replace(/[^a-zA-Z0-9]/g, '-') // Replace special chars with hyphens
      .toLowerCase()
      .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
    
    // Ensure we don't have empty strings
    const finalDocType = cleanDocumentType || 'document';
    const finalContext = cleanContext || 'file';
    
    if (index !== undefined) {
      return `${finalDocType}-${finalContext}-${index}.${extension}`;
    }
    
    return `${finalDocType}-${finalContext}.${extension}`;
  }
}
