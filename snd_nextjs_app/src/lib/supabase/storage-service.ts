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

      // Upload file to Supabase storage with upsert enabled for faster overwrites
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Enable upsert for faster overwrites
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
        url: this.ensureHttps(urlData.publicUrl),
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
   * Compress image files to reduce upload size and improve speed
   */
  private static async compressImage(file: File, quality: number = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        resolve(file); // Return original file if not an image
        return;
      }

      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920x1080 for better performance)
        const maxWidth = 1920;
        const maxHeight = 1080;
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress image
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file); // Fallback to original file
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => resolve(file); // Fallback to original file
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Upload a file with progress tracking and chunked upload for large files
   */
  static async uploadFileWithProgress(
    file: File,
    bucket: StorageBucket | string = STORAGE_BUCKETS.GENERAL,
    path?: string,
    customFilename?: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
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

      // Compress images for faster upload
      let uploadFile = file;
      if (file.type.startsWith('image/')) {
        try {
          uploadFile = await this.compressImage(file, 0.8);
          console.log(`Image compressed: ${file.size} -> ${uploadFile.size} bytes (${Math.round((1 - uploadFile.size / file.size) * 100)}% reduction)`);
        } catch (error) {
          console.warn('Image compression failed, using original file:', error);
          uploadFile = file;
        }
      }

      // For large files (>5MB), use optimized upload
      const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
      const isLargeFile = uploadFile.size > CHUNK_SIZE;

      if (isLargeFile) {
        return await this.uploadLargeFile(uploadFile, bucket, filePath, onProgress);
      }

      // For smaller files, use regular upload with progress simulation
      let uploadedBytes = 0;
      const progressInterval = setInterval(() => {
        if (uploadedBytes < uploadFile.size) {
          uploadedBytes = Math.min(uploadedBytes + uploadFile.size * 0.1, uploadFile.size);
          onProgress?.({
            loaded: uploadedBytes,
            total: uploadFile.size,
            percentage: Math.round((uploadedBytes / uploadFile.size) * 100)
          });
        } else {
          clearInterval(progressInterval);
        }
      }, 100);

      // Upload file to Supabase storage with upsert enabled
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, uploadFile, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          error: error.message,
        };
      }

      // Set progress to 100%
      onProgress?.({
        loaded: uploadFile.size,
        total: uploadFile.size,
        percentage: 100
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: this.ensureHttps(urlData.publicUrl),
        filename: uniqueFilename,
        originalName: file.name,
        size: uploadFile.size,
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
   * Upload large files with better progress tracking
   */
  private static async uploadLargeFile(
    file: File,
    bucket: StorageBucket | string,
    filePath: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<UploadResult> {
    try {
      // For now, use regular upload but with better progress tracking
      // Chunked upload requires server-side processing which Supabase doesn't support natively
      
      let uploadedBytes = 0;
      const progressInterval = setInterval(() => {
        if (uploadedBytes < file.size) {
          uploadedBytes = Math.min(uploadedBytes + file.size * 0.05, file.size); // Faster progress updates
          onProgress?.({
            loaded: uploadedBytes,
            total: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100)
          });
        } else {
          clearInterval(progressInterval);
        }
      }, 50); // More frequent updates for large files

      // Upload file to Supabase storage with upsert enabled
      const { error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      clearInterval(progressInterval);

      if (error) {
        console.error('Supabase upload error:', error);
        return {
          success: false,
          message: `Upload failed: ${error.message}`,
          error: error.message,
        };
      }

      // Set progress to 100%
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100
      });

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return {
        success: true,
        url: this.ensureHttps(urlData.publicUrl),
        filename: filePath.split('/').pop() || file.name,
        originalName: file.name,
        size: file.size,
        type: file.type,
        message: 'Large file uploaded successfully to Supabase',
      };
    } catch (error) {
      console.error('Large file upload error:', error);
      return {
        success: false,
        message: `Large file upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
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
   * List files in a bucket with optimized performance
   * This method is specifically designed for document management with better caching
   */
  static async listFilesOptimized(
    bucket: StorageBucket | string,
    path?: string,
    options?: {
      limit?: number;
      offset?: number;
      sortBy?: 'name' | 'created_at' | 'updated_at' | 'size';
      sortOrder?: 'asc' | 'desc';
      search?: string;
    }
  ): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured',
        };
      }

      const {
        limit = 1000,
        offset = 0,
        sortBy = 'name',
        sortOrder = 'asc',
        search = '',
      } = options || {};

      let query = supabase!.storage.from(bucket).list(path || '', {
        limit,
        offset,
        sortBy: sortBy === 'name' ? 'name' : sortBy,
        sortOrder,
      });

      const { data, error } = await query;

      if (error) {
        console.error('Error listing files:', error);
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: true,
          files: [],
        };
      }

      // Filter files if search term is provided
      let files = data;
      if (search) {
        const searchLower = search.toLowerCase();
        files = data.filter(file => 
          file.name.toLowerCase().includes(searchLower) ||
          (file.metadata?.mimetype && file.metadata.mimetype.toLowerCase().includes(searchLower))
        );
      }

      // Transform files to include additional metadata
      const transformedFiles = files.map(file => ({
        name: file.name,
        size: file.metadata?.size || 0,
        mimeType: file.metadata?.mimetype || 'application/octet-stream',
        createdAt: file.created_at,
        updatedAt: file.updated_at,
        lastAccessedAt: file.last_accessed_at,
        etag: (file as any).etag || '',
        isFolder: file.name.endsWith('/'),
        fullPath: path ? `${path}/${file.name}` : file.name,
      }));

      return {
        success: true,
        files: transformedFiles,
      };
    } catch (error) {
      console.error('Error in listFilesOptimized:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get document statistics for a bucket
   * This provides quick overview of document counts and sizes
   */
  static async getDocumentStats(
    bucket: StorageBucket | string,
    path?: string
  ): Promise<{ success: boolean; stats?: any; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          error: 'Supabase is not configured',
        };
      }

      const { data, error } = await supabase!.storage
        .from(bucket)
        .list(path || '', { limit: 1000 });

      if (error) {
        return {
          success: false,
          error: error.message,
        };
      }

      if (!data) {
        return {
          success: true,
          stats: {
            totalFiles: 0,
            totalSize: 0,
            fileTypes: {},
            lastModified: null,
          },
        };
      }

      const stats = {
        totalFiles: data.filter(file => !file.name.endsWith('/')).length,
        totalSize: data.reduce((sum, file) => sum + (file.metadata?.size || 0), 0),
        fileTypes: data.reduce((acc, file) => {
          if (!file.name.endsWith('/')) {
            const ext = file.name.split('.').pop()?.toLowerCase() || 'unknown';
            acc[ext] = (acc[ext] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>),
        lastModified: data.length > 0 ? Math.max(...data.map(f => new Date(f.updated_at).getTime())) : null,
      };

      return {
        success: true,
        stats,
      };
    } catch (error) {
      console.error('Error getting document stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Ensure a URL is HTTPS to prevent Mixed Content errors
   */
  static ensureHttps(url: string): string {
    if (!url) return url;
    return url.replace(/^http:/, 'https:');
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
    
    // Force HTTPS to prevent Mixed Content errors
    return this.ensureHttps(data.publicUrl);
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
    
    // Force HTTPS to prevent Mixed Content errors
    return this.ensureHttps(data.publicUrl);
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

  /**
   * Ensure folder exists in Supabase storage
   * In Supabase, folders are created automatically when uploading files,
   * but this method can be used to validate folder structure
   */
  static async ensureFolderExists(
    bucket: StorageBucket | string,
    folderPath: string
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      if (!supabase) {
        return {
          success: false,
          message: 'Supabase is not configured',
          error: 'SUPABASE_NOT_CONFIGURED',
        };
      }

      // Clean the folder path
      const cleanPath = folderPath
        .replace(/^\/+|\/+$/g, '') // Remove leading/trailing slashes
        .replace(/[^a-zA-Z0-9\-_\/]/g, '-'); // Replace invalid chars with hyphens

      // Try to list the folder to check if it exists
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(cleanPath, { limit: 1 });

      if (error) {
        // Folder doesn't exist yet, but that's okay - it will be created on first upload
        console.log(`Folder ${cleanPath} will be created on first file upload`);
        return {
          success: true,
          message: `Folder ${cleanPath} will be created on first upload`,
        };
      }

      return {
        success: true,
        message: `Folder ${cleanPath} exists or will be created`,
      };
    } catch (error) {
      console.error('Error checking folder existence:', error);
      return {
        success: false,
        message: `Error checking folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a folder structure for employee documents based on file number
   */
  static async createEmployeeFolder(
    fileNumber: string,
    bucket: StorageBucket | string = STORAGE_BUCKETS.EMPLOYEE_DOCUMENTS
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const folderPath = `employee-${fileNumber}`;
      return await this.ensureFolderExists(bucket, folderPath);
    } catch (error) {
      return {
        success: false,
        message: `Error creating employee folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Create a folder structure for equipment documents based on door number
   */
  static async createEquipmentFolder(
    doorNumber: string,
    bucket: StorageBucket | string = STORAGE_BUCKETS.EQUIPMENT_DOCUMENTS
  ): Promise<{ success: boolean; message: string; error?: string }> {
    try {
      const folderPath = `equipment-${doorNumber}`;
      return await this.ensureFolderExists(bucket, folderPath);
    } catch (error) {
      return {
        success: false,
        message: `Error creating equipment folder: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
