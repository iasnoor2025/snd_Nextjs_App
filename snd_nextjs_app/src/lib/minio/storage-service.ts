import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, HeadObjectCommand } from '@aws-sdk/client-s3';
import { s3Client, STORAGE_BUCKETS, StorageBucket, isMinIOConfigured } from './client';

export interface UploadResult {
  success: boolean;
  url?: string;
  filename?: string;
  originalName?: string;
  size?: number;
  type?: string;
  bucket?: string;
  message?: string;
  error?: string;
}

export interface FileMetadata {
  filename: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  bucket: string;
  uploadedAt: string;
}

export class MinIOStorageService {
  /**
   * Upload a file to MinIO storage
   */
  static async uploadFile(
    file: File,
    bucket: StorageBucket | string = STORAGE_BUCKETS.GENERAL,
    path?: string,
    customFilename?: string
  ): Promise<UploadResult> {
    try {
      // Check if MinIO is configured
      if (!isMinIOConfigured()) {
        return {
          success: false,
          message: 'MinIO is not configured. Please set S3_ENDPOINT, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.',
          error: 'MINIO_NOT_CONFIGURED',
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

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload file to MinIO
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      // Generate public URL
      const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
      const url = `${baseUrl}/${bucket}/${filePath}`;

      return {
        success: true,
        url,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        bucket,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Upload file with progress tracking
   */
  static async uploadFileWithProgress(
    file: File,
    bucket: StorageBucket | string = STORAGE_BUCKETS.GENERAL,
    path?: string,
    customFilename?: string,
    onProgress?: (progress: { loaded: number; total: number; percentage: number }) => void
  ): Promise<UploadResult> {
    try {
      // Check if MinIO is configured
      if (!isMinIOConfigured()) {
        return {
          success: false,
          message: 'MinIO is not configured. Please set S3_ENDPOINT, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY environment variables.',
          error: 'MINIO_NOT_CONFIGURED',
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

      // Simulate progress for smaller files
      let uploadedBytes = 0;
      const progressInterval = setInterval(() => {
        if (uploadedBytes < file.size) {
          uploadedBytes = Math.min(uploadedBytes + file.size * 0.1, file.size);
          onProgress?.({
            loaded: uploadedBytes,
            total: file.size,
            percentage: Math.round((uploadedBytes / file.size) * 100)
          });
        } else {
          clearInterval(progressInterval);
        }
      }, 100);

      // Convert File to Buffer
      const buffer = Buffer.from(await file.arrayBuffer());

      // Upload file to MinIO
      const command = new PutObjectCommand({
        Bucket: bucket,
        Key: filePath,
        Body: buffer,
        ContentType: file.type,
        Metadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      await s3Client.send(command);

      clearInterval(progressInterval);

      // Set progress to 100%
      onProgress?.({
        loaded: file.size,
        total: file.size,
        percentage: 100
      });

      // Generate public URL
      const baseUrl = process.env.S3_ENDPOINT?.replace(/\/$/, '');
      const url = `${baseUrl}/${bucket}/${filePath}`;

      return {
        success: true,
        url,
        filename: uniqueFilename,
        originalName: file.name,
        size: file.size,
        type: file.type,
        bucket,
        message: 'File uploaded successfully',
      };
    } catch (error) {
      console.error('MinIO upload error:', error);
      return {
        success: false,
        message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Delete a file from MinIO storage
   */
  static async deleteFile(bucket: string, filePath: string): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      if (!isMinIOConfigured()) {
        return {
          success: false,
          message: 'MinIO is not configured',
          error: 'MINIO_NOT_CONFIGURED',
        };
      }

      const command = new DeleteObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      await s3Client.send(command);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      console.error('MinIO delete error:', error);
      return {
        success: false,
        message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * List files in a bucket
   */
  static async listFiles(bucket: string, prefix?: string): Promise<{ success: boolean; files?: any[]; error?: string }> {
    try {
      if (!isMinIOConfigured()) {
        return {
          success: false,
          error: 'MINIO_NOT_CONFIGURED',
        };
      }

      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
      });

      const response = await s3Client.send(command);

      return {
        success: true,
        files: response.Contents || [],
      };
    } catch (error) {
      console.error('MinIO list error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get file metadata
   */
  static async getFileMetadata(bucket: string, filePath: string): Promise<{ success: boolean; metadata?: any; error?: string }> {
    try {
      if (!isMinIOConfigured()) {
        return {
          success: false,
          error: 'MINIO_NOT_CONFIGURED',
        };
      }

      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: filePath,
      });

      const response = await s3Client.send(command);

      return {
        success: true,
        metadata: response,
      };
    } catch (error) {
      console.error('MinIO metadata error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Generate unique filename
   */
  static generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}-${timestamp}-${randomString}.${extension}`;
  }

  /**
   * Generate custom filename
   */
  static generateCustomFilename(customName: string, originalName: string): string {
    const extension = originalName.split('.').pop();
    const timestamp = Date.now();
    return `${customName}-${timestamp}.${extension}`;
  }

  /**
   * Generate descriptive filename
   */
  static generateDescriptiveFilename(type: string, category: string, originalName: string): string {
    const timestamp = Date.now();
    const extension = originalName.split('.').pop();
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${type}-${category}-${nameWithoutExt}-${timestamp}.${extension}`;
  }

  /**
   * Validate file type
   */
  private static isValidFileType(filename: string): boolean {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];
    const extension = filename.toLowerCase().substring(filename.lastIndexOf('.'));
    return allowedExtensions.includes(extension);
  }

  /**
   * Validate file size
   */
  private static isValidFileSize(size: number): boolean {
    const maxSize = 10 * 1024 * 1024; // 10MB
    return size <= maxSize;
  }
}
