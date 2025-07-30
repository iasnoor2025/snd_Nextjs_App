'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  X, 
  File, 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive,
  Download,
  Eye,
  Trash2,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ToastService } from '@/lib/toast-service';

export interface FileUploadProps {
  // Basic props
  label?: string;
  placeholder?: string;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in bytes
  disabled?: boolean;
  
  // File types
  allowedTypes?: string[];
  showPreview?: boolean;
  
  // Upload behavior
  autoUpload?: boolean;
  uploadUrl?: string;
  onUpload?: (files: File[]) => Promise<void>;
  onFileSelect?: (files: File[]) => void;
  onFileRemove?: (file: File) => void;
  
  // Display
  className?: string;
  variant?: 'default' | 'compact' | 'drag-drop';
  
  // Validation
  required?: boolean;
  error?: string;
  
  // Custom render
  renderFile?: (file: FileItem, index: number) => React.ReactNode;
}

export interface FileItem {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  progress: number;
  error?: string;
  url?: string;
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label = 'Upload Files',
  placeholder = 'Choose files or drag and drop',
  accept = '*/*',
  multiple = false,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024, // 10MB default
  disabled = false,
  allowedTypes = [],
  showPreview = true,
  autoUpload = false,
  uploadUrl,
  onUpload,
  onFileSelect,
  onFileRemove,
  className,
  variant = 'default',
  required = false,
  error,
  renderFile,
}) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate unique ID for files
  const generateId = () => Math.random().toString(36).substr(2, 9);

  // Validate file
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds ${(maxSize / 1024 / 1024).toFixed(1)}MB limit`
      };
    }

    // Check file type
    if (allowedTypes.length > 0) {
      const fileType = file.type.toLowerCase();
      const isValidType = allowedTypes.some(type => {
        if (type.startsWith('.')) {
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        }
        return fileType.includes(type.toLowerCase());
      });

      if (!isValidType) {
        return {
          valid: false,
          error: `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`
        };
      }
    }

    return { valid: true };
  }, [maxSize, allowedTypes]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const newFiles: FileItem[] = [];
    const fileArray = Array.from(selectedFiles);

    // Check max files limit
    if (files.length + fileArray.length > maxFiles) {
      ToastService.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    fileArray.forEach(file => {
      const validation = validateFile(file);
      
      if (validation.valid) {
        const fileItem: FileItem = {
          file,
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending',
          progress: 0,
        };

        // Generate preview for images
        if (showPreview && file.type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (e) => {
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { ...f, preview: e.target?.result as string } : f
            ));
          };
          reader.readAsDataURL(file);
        }

        newFiles.push(fileItem);
      } else {
        ToastService.fileValidationError(validation.error!);
      }
    });

    if (newFiles.length > 0) {
      setFiles(prev => [...prev, ...newFiles]);
      onFileSelect?.(newFiles.map(f => f.file));

      if (autoUpload) {
        handleUpload(newFiles);
      }
    }
  }, [files, maxFiles, validateFile, showPreview, onFileSelect, autoUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  // Upload files
  const handleUpload = useCallback(async (filesToUpload: FileItem[] = files) => {
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      // Update status to uploading
      setFiles(prev => prev.map(f => 
        filesToUpload.some(uploadFile => uploadFile.id === f.id)
          ? { ...f, status: 'uploading', progress: 0 }
          : f
      ));

      if (onUpload) {
        await onUpload(filesToUpload.map(f => f.file));
        
        // Update status to success
        setFiles(prev => prev.map(f => 
          filesToUpload.some(uploadFile => uploadFile.id === f.id)
            ? { ...f, status: 'success', progress: 100 }
            : f
        ));

        ToastService.fileUploadSuccess(`${filesToUpload.length} file(s)`);
      } else if (uploadUrl) {
        // Upload to server
        for (const fileItem of filesToUpload) {
          const formData = new FormData();
          formData.append('file', fileItem.file);

          const xhr = new XMLHttpRequest();
          
          // Track upload progress
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = Math.round((e.loaded / e.total) * 100);
              setFiles(prev => prev.map(f => 
                f.id === fileItem.id ? { ...f, progress } : f
              ));
            }
          });

          // Handle response
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              setFiles(prev => prev.map(f => 
                f.id === fileItem.id ? { ...f, status: 'success', progress: 100 } : f
              ));
              ToastService.fileUploadSuccess(fileItem.name);
            } else {
              setFiles(prev => prev.map(f => 
                f.id === fileItem.id ? { 
                  ...f, 
                  status: 'error', 
                  error: 'Upload failed' 
                } : f
              ));
              ToastService.fileUploadError(fileItem.name, 'Upload failed');
            }
          });

          xhr.addEventListener('error', () => {
            setFiles(prev => prev.map(f => 
              f.id === fileItem.id ? { 
                ...f, 
                status: 'error', 
                error: 'Network error' 
              } : f
            ));
            ToastService.fileUploadError(fileItem.name, 'Network error');
          });

          xhr.open('POST', uploadUrl);
          xhr.send(formData);
        }
      }
    } catch (error) {
      console.error('Upload error:', error);
      ToastService.fileUploadError('files', 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [files, onUpload, uploadUrl]);

  // Remove file
  const handleRemoveFile = useCallback((fileItem: FileItem) => {
    setFiles(prev => prev.filter(f => f.id !== fileItem.id));
    onFileRemove?.(fileItem.file);
    ToastService.fileDeleteSuccess(fileItem.name);
  }, [onFileRemove]);

  // Get file icon
  const getFileIcon = (file: FileItem) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    if (file.type.startsWith('audio/')) return <Music className="w-4 h-4" />;
    if (file.type.includes('zip') || file.type.includes('rar')) return <Archive className="w-4 h-4" />;
    if (file.type.includes('text') || file.type.includes('document')) return <FileText className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render file item
  const renderFileItem = (fileItem: FileItem, index: number) => {
    if (renderFile) {
      return renderFile(fileItem, index);
    }

    return (
      <Card key={fileItem.id} className="relative">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {fileItem.preview && showPreview ? (
                <img 
                  src={fileItem.preview} 
                  alt={fileItem.name}
                  className="w-10 h-10 object-cover rounded"
                />
              ) : (
                <div className="w-10 h-10 bg-gray-100 rounded flex items-center justify-center">
                  {getFileIcon(fileItem)}
                </div>
              )}
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileItem.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(fileItem.size)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Badge 
                variant={
                  fileItem.status === 'success' ? 'default' :
                  fileItem.status === 'error' ? 'destructive' :
                  fileItem.status === 'uploading' ? 'secondary' : 'outline'
                }
                className="text-xs"
              >
                {fileItem.status === 'success' && <CheckCircle className="w-3 h-3 mr-1" />}
                {fileItem.status === 'error' && <AlertCircle className="w-3 h-3 mr-1" />}
                {fileItem.status === 'uploading' && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                {fileItem.status}
              </Badge>

              {fileItem.status === 'uploading' && (
                <Progress value={fileItem.progress} className="w-20" />
              )}

              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveFile(fileItem)}
                disabled={fileItem.status === 'uploading'}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {fileItem.error && (
            <p className="text-xs text-red-500 mt-2">{fileItem.error}</p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div
        className={cn(
          'border-2 border-dashed rounded-lg p-6 text-center transition-colors',
          isDragOver ? 'border-primary bg-primary/5' : 'border-gray-300',
          disabled && 'opacity-50 cursor-not-allowed'
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <Upload className="mx-auto h-12 w-12 text-gray-400" />
          
          <div>
            <p className="text-sm font-medium text-gray-900">
              {placeholder}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {allowedTypes.length > 0 && `Allowed types: ${allowedTypes.join(', ')}`}
              {maxSize && ` • Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`}
              {maxFiles && ` • Max files: ${maxFiles}`}
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
          >
            Choose Files
          </Button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Selected Files ({files.length})</h4>
            {!autoUpload && onUpload && (
              <Button
                onClick={() => handleUpload()}
                disabled={isUploading || files.every(f => f.status === 'success')}
                size="sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  'Upload All'
                )}
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {files.map((file, index) => renderFileItem(file, index))}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload; 