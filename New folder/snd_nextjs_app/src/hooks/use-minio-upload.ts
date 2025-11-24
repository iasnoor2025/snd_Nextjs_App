import { useState, useCallback } from 'react';
import { MinIOStorageService } from '@/lib/minio/storage-service';
import { STORAGE_BUCKETS, StorageBucket } from '@/lib/minio/client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseMinIOUploadReturn {
  uploadFile: (
    file: File,
    bucket?: StorageBucket,
    path?: string,
    customFilename?: string
  ) => Promise<any>;
  uploadFileWithProgress: (
    file: File,
    bucket?: StorageBucket,
    path?: string,
    customFilename?: string,
    onProgress?: (progress: UploadProgress) => void
  ) => Promise<any>;
  isUploading: boolean;
  progress: UploadProgress;
  error: string | null;
  resetProgress: () => void;
}

export function useMinIOUpload(): UseMinIOUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(
    async (
      file: File,
      bucket: StorageBucket = STORAGE_BUCKETS.GENERAL,
      path?: string,
      customFilename?: string
    ) => {
      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        const result = await MinIOStorageService.uploadFile(file, bucket, path, customFilename);
        
        if (result.success) {
          setProgress({ loaded: file.size, total: file.size, percentage: 100 });
        } else {
          setError(result.message || 'Upload failed');
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const uploadFileWithProgress = useCallback(
    async (
      file: File,
      bucket: StorageBucket = STORAGE_BUCKETS.GENERAL,
      path?: string,
      customFilename?: string,
      onProgress?: (progress: UploadProgress) => void
    ) => {
      setIsUploading(true);
      setError(null);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      try {
        const result = await MinIOStorageService.uploadFileWithProgress(
          file,
          bucket,
          path,
          customFilename,
          (progressData) => {
            setProgress(progressData);
            onProgress?.(progressData);
          }
        );
        
        if (!result.success) {
          setError(result.message || 'Upload failed');
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        return { success: false, message: errorMessage };
      } finally {
        setIsUploading(false);
      }
    },
    []
  );

  const resetProgress = useCallback(() => {
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
  }, []);

  return {
    uploadFile,
    uploadFileWithProgress,
    isUploading,
    progress,
    error,
    resetProgress,
  };
}
