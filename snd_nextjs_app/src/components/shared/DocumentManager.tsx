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
    } catch (error) {
      console.error('Failed to load documents', error);
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
      await deleteDocument(id);
      toast.success('Document deleted successfully');
      await refresh();
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (doc: DocumentItem) => {
    const link = document.createElement('a');
    link.href = doc.url;
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
  };

  const isImageFile = (type: string) => type?.startsWith('image/');

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
                    <img
                      src={document.url}
                      alt={document.name}
                      className="w-12 h-12 object-cover rounded border cursor-pointer"
                      onClick={() => setPreviewImage(document)}
                      onError={e => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  ) : (
                    <div className="w-12 h-12 flex items-center justify-center bg-muted rounded border text-xl">
                      {getFileIcon(document.file_type)}
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
                    {isImageFile(document.file_type) && canPreview && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPreviewImage(document)}
                        className="h-8 w-8 p-0"
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

      {/* Image Preview Modal */}
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
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
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
