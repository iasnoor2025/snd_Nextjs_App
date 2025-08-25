'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Upload, FileText, FileImage, File } from 'lucide-react';
import { useSupabaseUpload, StorageBucket } from '@/hooks/use-supabase-upload';
import { STORAGE_BUCKETS } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface SupabaseFileUploadProps {
  onUploadComplete?: (result: {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }) => void;
  onMultipleUploadComplete?: (results: Array<{
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
  }>) => void;
  bucket?: StorageBucket;
  path?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  acceptedFileTypes?: string[];
  className?: string;
  title?: string;
  description?: string;
  disabled?: boolean;
}

export const SupabaseFileUpload: React.FC<SupabaseFileUploadProps> = ({
  onUploadComplete,
  onMultipleUploadComplete,
  bucket = STORAGE_BUCKETS.GENERAL,
  path,
  multiple = false,
  maxFiles = 5,
  maxSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'],
  className = '',
  title = 'Upload Files',
  description = 'Drag and drop files here, or click to select files',
  disabled = false,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { uploadFile, uploadMultipleFiles, isUploading, progress } = useSupabaseUpload();

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Validate file count
      if (acceptedFiles.length > maxFiles) {
        toast.error(`Maximum ${maxFiles} files allowed`);
        return;
      }

      // Validate file sizes
      const oversizedFiles = acceptedFiles.filter(file => file.size > maxSize);
      if (oversizedFiles.length > 0) {
        toast.error(`Some files exceed the maximum size of ${formatFileSize(maxSize)}`);
        return;
      }

      setSelectedFiles(acceptedFiles);
    },
    [maxFiles, maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: disabled ? () => {} : onDrop,
    accept: acceptedFileTypes.reduce((acc, type) => {
      acc[type] = [];
      return acc;
    }, {} as Record<string, string[]>),
    multiple,
    maxFiles,
    maxSize,
    disabled,
  });

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    if (multiple) {
      const result = await uploadMultipleFiles(selectedFiles, bucket, path);
      if (onMultipleUploadComplete) {
        onMultipleUploadComplete(result.results);
      }
      if (result.success) {
        setSelectedFiles([]);
      }
    } else {
      const file = selectedFiles[0];
      const result = await uploadFile(file, bucket, path);
      if (onUploadComplete) {
        onUploadComplete(result);
      }
      if (result.success) {
        setSelectedFiles([]);
      }
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllFiles = () => {
    setSelectedFiles([]);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return <FileText className="h-4 w-4 text-red-500" />;
    if (file.type.includes('image')) return <FileImage className="h-4 w-4 text-green-500" />;
    return <File className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {disabled ? 'Supabase is not configured. Please set environment variables.' : description}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            disabled
              ? 'border-muted-foreground/25 bg-muted/50 cursor-not-allowed opacity-50'
              : isDragActive
              ? 'border-primary bg-primary/5 cursor-pointer'
              : 'border-muted-foreground/25 hover:border-primary/50 cursor-pointer'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            {isDragActive ? 'Drop files here' : 'Drag and drop files here, or click to select'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Accepted types: {acceptedFileTypes.join(', ')} | Max size: {formatFileSize(maxSize)}
          </p>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Selected Files ({selectedFiles.length})</h4>
              <Button variant="ghost" size="sm" onClick={clearAllFiles}>
                Clear All
              </Button>
            </div>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 border rounded-lg bg-muted/50"
                >
                  {getFileIcon(file)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeFile(index)}
                    className="h-6 w-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Progress */}
        {isUploading && progress.total > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Uploading...</span>
              <span>{progress.percentage}%</span>
            </div>
            <Progress value={progress.percentage} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {formatFileSize(progress.loaded)} / {formatFileSize(progress.total)}
            </p>
          </div>
        )}

        {/* Upload Button */}
        {selectedFiles.length > 0 && (
          <Button
            onClick={handleUpload}
            disabled={isUploading || disabled}
            className="w-full"
          >
            {isUploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-pulse" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}

        {/* Bucket Info */}
        <div className="text-xs text-muted-foreground text-center">
          Files will be uploaded to: <Badge variant="outline">{bucket}</Badge>
          {path && (
            <>
              {' '}in folder: <Badge variant="outline">{path}</Badge>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
