'use client';

import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Archive, FileText, Image, Loader2, Music, Upload, Video } from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface FileUploadProps {
  onFileUpload: (files: File[]) => void;
  maxFileSize?: number;
  acceptedFileTypes?: string[];
  maxFiles?: number;
  className?: string;
}

export function FileUpload({
  onFileUpload,
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  acceptedFileTypes = ['*/*'],
  maxFiles = 1,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(event.target.files || []);

      // Validate file size
      const validFiles = selectedFiles.filter(file => {
        if (file.size > maxFileSize) {
          alert(`File ${file.name} is too large. Maximum size is ${maxFileSize / (1024 * 1024)}MB`);
          return false;
        }
        return true;
      });

      // Limit number of files
      if (validFiles.length > maxFiles) {
        alert(`Maximum ${maxFiles} file(s) allowed`);
        return;
      }

      setFiles(validFiles);
    },
    [maxFileSize, maxFiles]
  );

  const handleUpload = useCallback(async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress({});

    try {
      // Initialize progress for each file
      const initialProgress: { [key: string]: number } = {};
      files.forEach(file => {
        initialProgress[file.name] = 0;
      });
      setUploadProgress(initialProgress);

      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        const newProgress: { [key: string]: number } = {};
        files.forEach(file => {
          newProgress[file.name] = i;
        });
        setUploadProgress(newProgress);
      }

      // Call the upload handler
      onFileUpload(files);

      // Reset state
      setFiles([]);
      setUploadProgress({});
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  }, [files, onFileUpload]);

  const removeFile = useCallback((index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (file.type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (file.type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    if (file.type.includes('zip') || file.type.includes('rar'))
      return <Archive className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
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
      <div className="flex items-center gap-4">
        <input
          type="file"
          multiple={maxFiles > 1}
          accept={acceptedFileTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button asChild variant="outline">
            <span className="flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Choose Files
            </span>
          </Button>
        </label>

        {files.length > 0 && (
          <Button onClick={handleUpload} disabled={uploading} className="flex items-center gap-2">
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Upload {files.length} File{files.length > 1 ? 's' : ''}
              </>
            )}
          </Button>
        )}
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map((file, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                {getFileIcon(file)}
                <div>
                  <p className="font-medium">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{formatFileSize(file.size)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {uploadProgress[file.name] !== undefined && (
                  <Progress value={uploadProgress[file.name]} className="w-20" />
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                  disabled={uploading}
                >
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
