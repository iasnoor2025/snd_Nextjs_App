'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, FileText, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

export interface DocumentItem {
  id: number;
  name: string;
  file_name?: string;
  file_type: string;
  size: number;
  url: string;
  created_at: string;
  typeLabel?: string;
  employee_file_number?: string | number;
  document_type?: string;
}

interface DocumentManagerProps {
  title?: string;
  description?: string;
  // Data providers
  loadDocuments: () => Promise<DocumentItem[]>;
  uploadDocument: (file: File, extra?: Record<string, any>) => Promise<void> | Promise<any>;
  deleteDocument: (id: number) => Promise<void> | Promise<any>;
  // UI options
  showNameInput?: boolean;
  nameInputLabel?: string;
  renderExtraControls?: React.ReactNode; // Rendered above dropzone (e.g., type select)
  getExtraUploadData?: () => Record<string, any> | undefined; // Read extra fields on upload
  canUpload?: boolean;
  canDownload?: boolean;
  canPreview?: boolean;
  canDelete?: boolean;
  singleLine?: boolean; // render all items inline in one scrolling row
  // Optional custom download prefix (e.g., employee file number). Can be a string or factory.
  downloadPrefix?: string | ((doc: DocumentItem) => string | undefined);
  // Optional guard to validate state before upload (return false to block drop upload)
  beforeUpload?: (files: File[]) => Promise<boolean> | boolean;
  // Wrap items to multiple rows instead of scrolling horizontally
  wrapItems?: boolean;
  // Control display of metadata
  showSize?: boolean;
  showDate?: boolean;
}

export default function DocumentManager(props: DocumentManagerProps) {
  // Debug logging
  console.log('DocumentManager rendered with props:', {
    hasLoadDocuments: !!props.loadDocuments,
    hasUploadDocument: !!props.uploadDocument,
    hasDeleteDocument: !!props.deleteDocument,
    loadDocumentsType: typeof props.loadDocuments,
    uploadDocumentType: typeof props.uploadDocument,
    deleteDocumentType: typeof props.deleteDocument,
  });

  const {
    title = 'Documents',
    description = 'Upload and manage documents',
    loadDocuments,
    uploadDocument,
    deleteDocument,
    showNameInput = false,
    nameInputLabel = 'Document Name (Optional)',
    renderExtraControls,
    getExtraUploadData,
    canUpload = true,
    canDownload = true,
    canPreview = true,
    canDelete = true,
    singleLine = false,
    downloadPrefix,
    beforeUpload,
    wrapItems = false,
    showSize = true,
    showDate = true,
  } = props;

  // Validate required props
  if (!loadDocuments || typeof loadDocuments !== 'function') {
    console.error('DocumentManager: loadDocuments prop is required and must be a function');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p className="text-sm font-medium">Configuration Error</p>
            <p className="text-xs mt-1">DocumentManager is missing required props</p>
            <p className="text-xs mt-1">Please check the component implementation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!uploadDocument || typeof uploadDocument !== 'function') {
    console.error('DocumentManager: uploadDocument prop is required and must be a function');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p className="text-sm font-medium">Configuration Error</p>
            <p className="text-xs mt-1">DocumentManager is missing uploadDocument prop</p>
            <p className="text-xs mt-1">Please check the component implementation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!deleteDocument || typeof deleteDocument !== 'function') {
    console.error('DocumentManager: deleteDocument prop is required and must be a function');
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-500">
            <p className="text-sm font-medium">Configuration Error</p>
            <p className="text-xs mt-1">DocumentManager is missing deleteDocument prop</p>
            <p className="text-xs mt-1">Please check the component implementation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [previewImage, setPreviewImage] = useState<DocumentItem | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadDocuments();
      setDocuments(Array.isArray(list) ? list : []);
      
      // Debug: Log document URLs to help troubleshoot
      if (list && list.length > 0) {
        console.log('Documents loaded:', list.map(doc => ({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          file_type: doc.file_type
        })));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  }, [loadDocuments]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      // Guard
      if (beforeUpload) {
        try {
          const ok = await beforeUpload(acceptedFiles);
          if (!ok) return;
        } catch {
          return;
        }
      }
      setUploading(true);
      try {
        for (const file of acceptedFiles) {
          const extra = {
            ...(showNameInput ? { document_name: documentName || file.name } : {}),
            ...(getExtraUploadData ? getExtraUploadData() : {}),
          };
          await uploadDocument(file, extra);
        }
        toast.success('Documents uploaded successfully');
        setDocumentName('');
        await refresh();
      } catch (error) {
        toast.error('Failed to upload documents');
      } finally {
        setUploading(false);
      }
    },
    [beforeUpload, documentName, getExtraUploadData, refresh, showNameInput, uploadDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024,
  });

  const handleDelete = async (id: number) => {
    setDeleting(id);
    try {
      console.log('Attempting to delete document:', id);
      const result = await deleteDocument(id);
      console.log('Delete result:', result);
      toast.success('Document deleted successfully');
      await refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      console.log('Attempting to download document:', doc);
      
      // If the URL is a Supabase URL (starts with http), handle it directly
      if (doc.url.startsWith('http')) {
        console.log('Downloading from Supabase URL:', doc.url);
        
        // For Supabase URLs, we need to fetch the file and create a blob download
        const response = await fetch(doc.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = doc.file_name || doc.name;
        
        // Determine preferred prefix (employee file number)
        const prefixFromProp =
          typeof downloadPrefix === 'function' ? downloadPrefix(doc) : downloadPrefix;
        const fileNumber =
          prefixFromProp || (doc.employee_file_number ? String(doc.employee_file_number) : '');
        // Human-readable type label for display
        const printableType = (doc.typeLabel || 'Document').trim();
        // Determine extension from file_name or URL
        let ext = (doc.file_name || '').split('.').pop();
        if (!ext || ext.length > 5) {
          const urlMatch = doc.url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
          if (urlMatch) ext = urlMatch[1];
        }
        const fallback = doc.file_name || doc.name;
        // Desired pattern: "Type (File 123).ext"
        link.download = fileNumber && ext ? `${printableType} (File ${fileNumber}).${ext}` : fallback;
        
        console.log('Downloading file with name:', link.download);
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
        toast.success('Download started');
        return;
      }

      console.log('Downloading from legacy URL:', doc.url);
      
      // For legacy local file URLs, try to use the download API
      const link = document.createElement('a');
      // Append download parameter to force download instead of preview
      const downloadUrl = doc.url.includes('?') 
        ? `${doc.url}&download=true` 
        : `${doc.url}?download=true`;
      link.href = downloadUrl;
      // Determine preferred prefix (employee file number)
      const prefixFromProp =
        typeof downloadPrefix === 'function' ? downloadPrefix(doc) : downloadPrefix;
      const fileNumber =
        prefixFromProp || (doc.employee_file_number ? String(doc.employee_file_number) : '');
      // Human-readable type label for display
      const printableType = (doc.typeLabel || 'Document').trim();
      // Determine extension from file_name or URL
      let ext = (doc.file_name || '').split('.').pop();
      if (!ext || ext.length > 5) {
        const urlMatch = doc.url.match(/\.([a-zA-Z0-9]{2,5})(?:\?|#|$)/);
        if (urlMatch) ext = urlMatch[1];
      }
      const fallback = doc.file_name || doc.name;
      // Desired pattern: "Type (File 123).ext"
      link.download = fileNumber && ext ? `${printableType} (File ${fileNumber}).${ext}` : fallback;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Download started');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const isImageFile = (type: string) => type?.startsWith('image/');
  
  // Check if document is specifically a photo (employee photo, profile picture, etc.)
  const isPhotoDocument = (doc: DocumentItem) => {
    return doc.document_type === 'photo' || 
           doc.name.toLowerCase().includes('photo') || 
           doc.name.toLowerCase().includes('picture') ||
           doc.name.toLowerCase().includes('image');
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document') || fileType.includes('doc'))
      return '📝';
    if (
      fileType.includes('excel') ||
      fileType.includes('spreadsheet') ||
      fileType.includes('sheet') ||
      fileType.includes('xls')
    )
      return '📊';
    if (fileType.includes('image')) return '🖼️';
    if (fileType.includes('text') || fileType.includes('plain')) return '📃';
    if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('7z')) return '🗜️';
    if (fileType.includes('powerpoint') || fileType.includes('presentation') || fileType.includes('ppt')) return '📽️';
    if (fileType.includes('audio') || fileType.includes('mp3') || fileType.includes('wav')) return '🎵';
    if (fileType.includes('video') || fileType.includes('mp4') || fileType.includes('avi')) return '🎬';
    return '📄';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>{title}</span>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        {canUpload && (
          <div className="space-y-4">
            {showNameInput && (
              <div className="flex items-center space-x-2">
                <Label htmlFor="doc-name" className="text-sm font-medium">
                  {nameInputLabel}
                </Label>
                <Input
                  id="doc-name"
                  placeholder="Enter custom document name"
                  value={documentName}
                  onChange={e => setDocumentName(e.target.value)}
                  className="max-w-xs"
                />
              </div>
            )}

            {renderExtraControls}

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Uploading documents...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports PDF, Word, Excel, Images (max 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        <Separator />

        {/* Documents List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Uploaded Documents</h4>
            {documents.length > 0 && (
              <Badge variant="secondary">{documents.length} document(s)</Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">Loading documents...</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No documents uploaded yet</p>
              <p className="text-xs">Upload documents to get started</p>
            </div>
          ) : (
            <div
              className={
                singleLine
                  ? 'flex gap-2 overflow-x-auto'
                  : wrapItems
                    ? 'grid gap-2 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                    : 'space-y-2'
              }
            >
              {documents.map(document => (
                <div
                  key={document.id}
                  className={
                    singleLine
                      ? 'inline-flex shrink-0 items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-[520px]'
                      : wrapItems
                        ? 'flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                        : 'flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors'
                  }
                >
                  {isImageFile(document.file_type) ? (
                    <div className="relative">
                      <img
                        src={document.url}
                        alt={document.name}
                        className={`w-20 h-20 object-cover rounded border cursor-pointer hover:shadow-md transition-all duration-200 ${
                          isPhotoDocument(document) 
                            ? 'ring-2 ring-blue-300 hover:ring-blue-400 shadow-lg' 
                            : ''
                        }`}
                        onClick={() => setPreviewImage(document)}
                        onError={e => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          // Show fallback icon when image fails to load
                          const fallbackDiv = target.nextElementSibling as HTMLElement;
                          if (fallbackDiv) {
                            fallbackDiv.style.display = 'flex';
                          }
                        }}
                      />
                      {/* Photo indicator badge */}
                      {isPhotoDocument(document) && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs px-2 py-1 rounded-full font-medium shadow-md">
                          📸
                        </div>
                      )}
                      {/* Fallback icon when image fails to load */}
                      <div 
                        className="w-20 h-20 hidden items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 rounded border border-blue-200 cursor-pointer hover:from-blue-100 hover:to-indigo-200 transition-all duration-200"
                        onClick={() => setPreviewImage(document)}
                      >
                        <div className="text-center">
                          <div className="text-lg">🖼️</div>
                          <div className="text-xs text-blue-600 font-medium mt-1">
                            IMG
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className={`w-20 h-20 flex items-center justify-center rounded border cursor-pointer transition-all duration-200 ${
                        isPhotoDocument(document)
                          ? 'bg-gradient-to-br from-blue-100 to-indigo-200 border-blue-300 hover:from-blue-200 hover:to-indigo-300 shadow-lg'
                          : 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 hover:from-blue-100 hover:to-indigo-200'
                      }`}
                      onClick={() => setPreviewImage(document)}
                    >
                      <div className="text-center relative">
                        <div className="text-2xl">{getFileIcon(document.file_type)}</div>
                        <div className="text-sm font-medium mt-2">
                          {isPhotoDocument(document) ? (
                            <span className="text-blue-700">PHOTO</span>
                          ) : (
                            <span className="text-blue-600">
                              {document.file_name?.split('.').pop()?.toUpperCase() || 'DOC'}
                            </span>
                          )}
                        </div>
                        {/* Photo indicator for non-image photo documents */}
                        {isPhotoDocument(document) && (
                          <div className="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium">
                            📸
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{document.name}</p>
                  </div>

                  {showSize && (
                    <div
                      className={
                        singleLine || wrapItems
                          ? 'hidden md:block w-28 text-xs text-muted-foreground'
                          : 'hidden sm:block w-28 text-xs text-muted-foreground'
                      }
                    >
                      {formatFileSize(document.size)}
                    </div>
                  )}

                  {showDate && (
                    <div
                      className={
                        singleLine || wrapItems
                          ? 'hidden lg:block w-36 text-xs text-muted-foreground'
                          : 'hidden md:block w-36 text-xs text-muted-foreground'
                      }
                    >
                      {new Date(document.created_at).toLocaleDateString()}
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {(isImageFile(document.file_type) || document.file_type.includes('pdf') || document.file_type.includes('text')) && canPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          if (isImageFile(document.file_type)) {
                            setPreviewImage(document);
                          } else if (document.file_type.includes('pdf') || document.file_type.includes('text')) {
                            window.open(document.url, '_blank');
                          }
                        }}
                        className="h-8 w-8 p-0"
                        title={isImageFile(document.file_type) ? "Preview image" : "Open document"}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    {canDownload && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                        className="h-8 w-8 p-0"
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {canDelete && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
                        disabled={deleting === document.id}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        {deleting === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      {/* Document Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{previewImage.name}</h3>
                {previewImage.typeLabel && (
                  <Badge variant="secondary">{previewImage.typeLabel}</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              {isImageFile(previewImage.file_type) ? (
                <div className="relative">
                  <img
                    src={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                      // Show error message when image fails to load
                      const errorDiv = target.nextElementSibling as HTMLElement;
                      if (errorDiv) {
                        errorDiv.style.display = 'flex';
                      }
                    }}
                  />
                  {/* Error fallback when image fails to load */}
                  <div className="hidden w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                    <div className="text-6xl">🖼️</div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-600">{previewImage.name}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        Failed to load image preview. The image may not be accessible.
                      </p>
                      <Button
                        onClick={() => window.open(previewImage.url, '_blank')}
                        className="mt-4"
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                </div>
              ) : previewImage.file_type.includes('pdf') ? (
                <div className="w-full h-[70vh] flex items-center justify-center">
                  <iframe
                    src={previewImage.url}
                    className="w-full h-full border rounded"
                    title={previewImage.name}
                  />
                </div>
              ) : (
                <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                  <div className="text-6xl">{getFileIcon(previewImage.file_type)}</div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-600">{previewImage.name}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      This file type cannot be previewed directly.
                    </p>
                    <Button
                      onClick={() => window.open(previewImage.url, '_blank')}
                      className="mt-4"
                    >
                      Open in New Tab
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>Size: {formatFileSize(previewImage.size)}</p>
              <p>Uploaded: {new Date(previewImage.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
