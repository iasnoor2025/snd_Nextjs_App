import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { STORAGE_BUCKETS, StorageBucket } from '@/lib/supabase/client';

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export interface UseSupabaseUploadReturn {
  uploadFile: (file: File, bucket?: StorageBucket, path?: string) => Promise<{
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }>;
  uploadMultipleFiles: (files: File[], bucket?: StorageBucket, path?: string) => Promise<{
    success: boolean;
    results: Array<{
      success: boolean;
      url?: string;
      filename?: string;
      error?: string;
    }>;
  }>;
  isUploading: boolean;
  progress: UploadProgress;
  resetProgress: () => void;
}

export const useSupabaseUpload = (): UseSupabaseUploadReturn => {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });

  const resetProgress = useCallback(() => {
    setProgress({
      loaded: 0,
      total: 0,
      percentage: 0,
    });
  }, []);

  const uploadFile = useCallback(
    async (
      file: File,
      bucket: StorageBucket = STORAGE_BUCKETS.GENERAL,
      path?: string
    ) => {
      setIsUploading(true);
      resetProgress();

      try {
        // Set initial progress
        setProgress({
          loaded: 0,
          total: file.size,
          percentage: 0,
        });

        // Simulate progress updates (Supabase doesn't provide real-time progress)
        const progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev.loaded >= file.size) {
              clearInterval(progressInterval);
              return prev;
            }
            const increment = Math.min(file.size * 0.1, file.size - prev.loaded);
            const newLoaded = prev.loaded + increment;
            return {
              loaded: newLoaded,
              total: file.size,
              percentage: Math.round((newLoaded / file.size) * 100),
            };
          });
        }, 100);

        // Upload file
        const result = await SupabaseStorageService.uploadFile(file, bucket, path);

        // Clear progress interval and set to 100%
        clearInterval(progressInterval);
        setProgress({
          loaded: file.size,
          total: file.size,
          percentage: 100,
        });

        if (result.success) {
          toast.success('File uploaded successfully');
        } else {
          toast.error(result.message);
        }

        return {
          success: result.success,
          url: result.url,
          filename: result.filename,
          error: result.error,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        toast.error(errorMessage);
        return {
          success: false,
          error: errorMessage,
        };
      } finally {
        setIsUploading(false);
      }
    },
    [resetProgress]
  );

  const uploadMultipleFiles = useCallback(
    async (
      files: File[],
      bucket: StorageBucket = STORAGE_BUCKETS.GENERAL,
      path?: string
    ) => {
      setIsUploading(true);
      resetProgress();

      const totalSize = files.reduce((sum, file) => sum + file.size, 0);
      let uploadedSize = 0;

      setProgress({
        loaded: 0,
        total: totalSize,
        percentage: 0,
      });

      const results = [];

      try {
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          
          // Update progress for current file
          setProgress(prev => ({
            loaded: uploadedSize,
            total: totalSize,
            percentage: Math.round((uploadedSize / totalSize) * 100),
          }));

          const result = await SupabaseStorageService.uploadFile(file, bucket, path);
          results.push({
            success: result.success,
            url: result.url,
            filename: result.filename,
            error: result.error,
          });

          uploadedSize += file.size;

          // Update progress after each file
          setProgress({
            loaded: uploadedSize,
            total: totalSize,
            percentage: Math.round((uploadedSize / totalSize) * 100),
          });

          // Small delay to show progress
          await new Promise(resolve => setTimeout(resolve, 100));
        }

        const successCount = results.filter(r => r.success).length;
        const failureCount = results.length - successCount;

        if (successCount > 0) {
          toast.success(`Successfully uploaded ${successCount} file(s)`);
        }
        if (failureCount > 0) {
          toast.error(`Failed to upload ${failureCount} file(s)`);
        }

        return {
          success: successCount > 0,
          results,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        toast.error(errorMessage);
        return {
          success: false,
          results: [],
        };
      } finally {
        setIsUploading(false);
      }
    },
    [resetProgress]
  );

  return {
    uploadFile,
    uploadMultipleFiles,
    isUploading,
    progress,
    resetProgress,
  };
};
