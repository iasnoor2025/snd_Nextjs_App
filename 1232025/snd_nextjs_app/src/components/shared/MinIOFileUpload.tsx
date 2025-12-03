'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { STORAGE_BUCKETS, StorageBucket } from '@/lib/minio/client';
import { useMinIOUpload } from '@/hooks/use-minio-upload';

interface MinIOFileUploadProps {
  bucket?: StorageBucket;
  path?: string;
  onUploadComplete?: (result: any) => void;
  onUploadError?: (error: string) => void;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
}

export default function MinIOFileUpload({
  bucket = STORAGE_BUCKETS.GENERAL,
  path,
  onUploadComplete,
  onUploadError,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB
  acceptedFileTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
  className = '',
}: MinIOFileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<any[]>([]);
  const [dragActive, setDragActive] = useState(false);
  
  const { uploadFileWithProgress, isUploading, progress, error, resetProgress } = useMinIOUpload();

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (!multiple && acceptedFiles.length > 1) {
        onUploadError?.('Only one file is allowed');
        return;
      }

      if (acceptedFiles.length > maxFiles) {
        onUploadError?.(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Check file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        onUploadError?.(`File size must be less than ${(maxSize / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      resetProgress();

      for (const file of acceptedFiles) {
        try {
          const result = await uploadFileWithProgress(file, bucket, path);
          
          if (result.success) {
            setUploadedFiles(prev => [...prev, result]);
            onUploadComplete?.(result);
          } else {
            onUploadError?.(result.message || 'Upload failed');
          }
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : 'Upload failed';
          onUploadError?.(errorMessage);
        }
      }
    },
    [bucket, path, multiple, maxFiles, maxSize, uploadFileWithProgress, onUploadComplete, onUploadError, resetProgress]
  );

  const { getRootProps, getInputProps, isDragReject } = useDropzone({
    onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple,
    maxFiles,
    disabled: isUploading,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
  });

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${dragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          ${isDragReject ? 'border-red-500 bg-red-50' : ''}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary hover:bg-primary/5'}
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center space-y-2">
          <Upload className="h-8 w-8 text-gray-400" />
          <div className="text-sm text-gray-600">
            {isUploading ? (
              'Uploading...'
            ) : (
              <>
                <span className="text-primary font-medium">Click to upload</span> or drag and drop
              </>
            )}
          </div>
          <div className="text-xs text-gray-500">
            {acceptedFileTypes.includes('application/pdf') && 'PDF, '}
            {acceptedFileTypes.includes('image/jpeg') && 'JPG, '}
            {acceptedFileTypes.includes('image/png') && 'PNG, '}
            {acceptedFileTypes.includes('application/msword') && 'DOC, '}
            {acceptedFileTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') && 'DOCX'}
            up to {formatFileSize(maxSize)}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      {isUploading && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uploading...</span>
            <span>{progress.percentage}%</span>
          </div>
          <Progress value={progress.percentage} className="w-full" />
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Uploaded Files */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Uploaded Files:</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="flex items-center space-x-2">
                      <File className="h-4 w-4 text-gray-500" />
                      <span className="text-sm font-medium">{file.originalName}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(file.size)} • {file.bucket}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  className="text-gray-500 hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
