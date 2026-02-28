'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Download, Eye, FileText, FileSpreadsheet, Image as ImageIcon, FileArchive, Presentation, Music, FileVideo, Loader2, Trash2, Upload, X } from 'lucide-react';
import { useCallback, useEffect, useState, memo } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';
import PdfThumbnail from './PdfThumbnail';
import ImageThumbnail from './ImageThumbnail';
import PdfViewer from './PdfViewer';

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
  project_id?: number; // For project documents
  equipment_id?: number; // For equipment documents
}

interface DocumentManagerProps {
  title?: string;
  description?: string;
  // Data providers
  loadDocuments: () => Promise<DocumentItem[]>;
  uploadDocument: (file: File, extra?: Record<string, any>) => Promise<void> | Promise<any>;
  deleteDocument: (id: number) => Promise<void> | Promise<any>;
  downloadDocument?: (id: number) => Promise<void> | Promise<any>; // Optional custom download handler
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

const DocumentManagerComponent = function DocumentManager(props: DocumentManagerProps) {
  const { t } = useI18n();

  const {
    title = t('employee.documents.title'),
    description = t('employee.documents.description'),
    loadDocuments,
    uploadDocument,
    deleteDocument,
    downloadDocument,
    showNameInput = false,
    nameInputLabel = t('employee.documents.documentName'),
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

  // Memoized sorting function to prevent recreation on every render
  const sortDocuments = useCallback((list: DocumentItem[]) => {
    const sortedList = Array.isArray(list) ? [...list] : [];
    
    // Sort documents by priority: 1. Photo, 2. Iqama, 3. Passport, 4. Others
    return sortedList.sort((a, b) => {
      const aName = a.name.toLowerCase();
      const bName = b.name.toLowerCase();
      
      // Priority 1: Photos (highest priority)
      if (aName.includes('photo') || aName.includes('picture') || aName.includes('image')) return -1;
      if (bName.includes('photo') || bName.includes('picture') || bName.includes('image')) return 1;
      
      // Priority 2: Iqama
      if (aName.includes('iqama')) return -1;
      if (bName.includes('iqama')) return 1;
      
      // Priority 3: Passport
      if (aName.includes('passport')) return -1;
      if (bName.includes('passport')) return 1;
      
      // Priority 4: Others (lowest priority)
      return 0;
    });
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadDocuments();
      const sortedList = sortDocuments(list);
      
      setDocuments(sortedList);
      
      // Documents loaded and sorted (removed console logging for performance)
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error(t('employee.documents.errorLoadingDocuments'));
    } finally {
      setLoading(false);
    }
  }, [loadDocuments, sortDocuments]);

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
        toast.success(t('employee.documents.uploadSuccess'));
        setDocumentName('');
        await refresh();
      } catch (error) {
        toast.error(t('employee.documents.uploadFailed'));
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
      const result = await deleteDocument(id);
      toast.success(t('employee.documents.deleteSuccess'));
      await refresh();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error(t('employee.documents.deleteFailed'));
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = async (doc: DocumentItem) => {
    try {
      // If a custom download handler is provided, use it
      if (downloadDocument && typeof downloadDocument === 'function') {
        await downloadDocument(doc.id);
        toast.success(t('employee.documents.downloadStarted'));
        return;
      }

      // If the URL is a MinIO URL (starts with http), handle it directly
      if (doc.url.startsWith('http')) {
        // For project documents, try using the download endpoint first if available
        if (doc.project_id && doc.url.includes('/project-documents/')) {
          try {
            const downloadResponse = await fetch(`/api/projects/${doc.project_id}/documents/${doc.id}/download`, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (downloadResponse.ok) {
              const blob = await downloadResponse.blob();
              const url = window.URL.createObjectURL(blob);
              
              // Get filename from Content-Disposition header or use default
              const contentDisposition = downloadResponse.headers.get('Content-Disposition');
              let filename = doc.file_name || doc.name || 'document.pdf';
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                  filename = filenameMatch[1].replace(/['"]/g, '');
                  try {
                    filename = decodeURIComponent(filename);
                  } catch (e) {
                    // If decoding fails, use as is
                  }
                }
              }
              
              const link = document.createElement('a');
              link.href = url;
              link.download = filename;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              window.URL.revokeObjectURL(url);
              
              toast.success(t('employee.documents.downloadStarted'));
              return;
            }
          } catch (downloadError) {
            // Fall through to try direct fetch
            console.warn('Download endpoint failed, trying direct fetch:', downloadError);
          }
        }
        
        // For MinIO URLs, try using the PDF proxy for authenticated access
        if (doc.url.includes('minio') || doc.url.includes('s3')) {
          try {
            const proxyResponse = await fetch(`/api/pdf-proxy?url=${encodeURIComponent(doc.url)}`, {
              method: 'GET',
              credentials: 'include',
            });
            
            if (proxyResponse.ok) {
              const blob = await proxyResponse.blob();
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
              
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              
              // Clean up the blob URL
              window.URL.revokeObjectURL(url);
              toast.success(t('employee.documents.downloadStarted'));
              return;
            }
          } catch (proxyError) {
            // Fall through to try direct fetch
            console.warn('PDF proxy failed, trying direct fetch:', proxyError);
          }
        }
        
        // Fallback: For MinIO URLs, we need to fetch the file and create a blob download
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
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        window.URL.revokeObjectURL(url);
        toast.success(t('employee.documents.downloadStarted'));
        return;
      }

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
      toast.success(t('employee.documents.downloadStarted'));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('employee.documents.downloadFailed'));
    }
  };

  const isImageFile = (type: string) => {
    if (!type) return false;
    const lowerType = type.toLowerCase();
    // Check for mime types like "image/png", "image/jpeg"
    if (lowerType.startsWith('image/')) return true;
    // Check for image file extensions
    return ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(lowerType);
  };
  
  // Check if document is specifically a photo (employee photo, profile picture, etc.)
  const isPhotoDocument = (doc: DocumentItem) => {
    const docType = (doc.document_type || '').toLowerCase();
    const name = doc.name.toLowerCase();
    
    // Check for employee-specific photo types
    return docType === 'employee_photo' || 
           docType === 'employee_iqama' ||
           docType === 'employee_passport' ||
           (docType.includes('photo') && !docType.includes('equipment')) ||
           (name.includes('photo') && !name.includes('equipment')) ||
           (name.includes('picture') && !name.includes('equipment')) ||
           name.includes('passport') ||
           name.includes('iqama');
  };

  // Check if document is an equipment photo
  const isEquipmentPhoto = (doc: DocumentItem) => {
    const docType = (doc.document_type || '').toLowerCase();
    const name = doc.name.toLowerCase();
    
    return docType === 'equipment_photo' ||
           (docType.includes('photo') && docType.includes('equipment')) ||
           (name.includes('photo') && name.includes('equipment'));
  };

  // Check if document is likely landscape-oriented (ID cards, licenses, etc.)
  const isLandscapeDocument = (doc: DocumentItem) => {
    const name = doc.name.toLowerCase();
    return name.includes('id') || 
           name.includes('license') || 
           name.includes('card') ||
           name.includes('certificate');
  };

  // Get appropriate container dimensions based on document type
  const getContainerDimensions = (doc: DocumentItem) => {
    if (isPhotoDocument(doc)) {
      return 'min-h-72'; // Minimum height for photos, but can grow
    }
    if (isLandscapeDocument(doc)) {
      return 'min-h-40'; // Minimum height for landscape documents, but can grow
    }
    return 'min-h-56'; // Minimum height for other documents, but can grow
  };

  const getFileIcon = (fileType: string | undefined) => {
    const iconClass = 'h-10 w-10 text-muted-foreground';
    if (!fileType || typeof fileType !== 'string') {
      return <FileText className={iconClass} aria-hidden />;
    }
    const lowerFileType = fileType.toLowerCase();
    if (lowerFileType.includes('pdf')) return <FileText className={iconClass} aria-hidden />;
    if (lowerFileType.includes('word') || lowerFileType.includes('document') || lowerFileType.includes('doc'))
      return <FileText className={iconClass} aria-hidden />;
    if (lowerFileType.includes('excel') || lowerFileType.includes('spreadsheet') || lowerFileType.includes('sheet') || lowerFileType.includes('xls'))
      return <FileSpreadsheet className={iconClass} aria-hidden />;
    if (lowerFileType.includes('image')) return <ImageIcon className={iconClass} aria-hidden />;
    if (lowerFileType.includes('text') || lowerFileType.includes('plain')) return <FileText className={iconClass} aria-hidden />;
    if (lowerFileType.includes('zip') || lowerFileType.includes('rar') || lowerFileType.includes('7z')) return <FileArchive className={iconClass} aria-hidden />;
    if (lowerFileType.includes('powerpoint') || lowerFileType.includes('presentation') || lowerFileType.includes('ppt')) return <Presentation className={iconClass} aria-hidden />;
    if (lowerFileType.includes('audio') || lowerFileType.includes('mp3') || lowerFileType.includes('wav')) return <Music className={iconClass} aria-hidden />;
    if (lowerFileType.includes('video') || lowerFileType.includes('mp4') || lowerFileType.includes('avi')) return <FileVideo className={iconClass} aria-hidden />;
    return <FileText className={iconClass} aria-hidden />;
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
                    placeholder={t('employee.documents.descriptionPlaceholder')}
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
                    <span>{t('employee.documents.uploading')}</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive ? t('employee.documents.dropFilesHere') : t('employee.documents.dragAndDropFiles')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{t('employee.documents.orClickToBrowse')}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('employee.documents.supportedFileTypes')}
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
            <h4 className="text-sm font-medium">{t('employee.documents.uploadedDocuments')}</h4>
            {documents.length > 0 && (
              <Badge variant="secondary">{documents.length} {t('employee.documents.document')}</Badge>
            )}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">{t('employee.documents.loadingDocuments')}</span>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">{t('employee.documents.noDocumentsYet')}</p>
              <p className="text-xs">{t('employee.documents.uploadDocumentsToStart')}</p>
            </div>
          ) : (
                                                   <div
                className={
                  singleLine
                    ? 'flex gap-2 overflow-x-auto'
                    : wrapItems
                      ? 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                      : 'grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
                }
              >
               {documents.map(document => {
                 // Normalize property names for DocumentItem interface
                 const fileType = document.file_type || 'UNKNOWN';
                 const fileSize = document.size || 0;
                 const fileName = document.file_name || document.name;
                 const docUrl = document.url;
                 
                 return (
                 <div
                   key={document.id}
                                       className={
                      singleLine
                        ? 'inline-flex shrink-0 items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-[520px]'
                        : 'group relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer'
                    }
                   onClick={() => {
                    if (isImageFile(fileType) || fileType.includes('pdf')) {
                      // Show in modal for both images and PDFs
                      setPreviewImage(document);
                    } else if (fileType.includes('text')) {
                      // Text files still open in new tab
                      const previewUrl = document.project_id 
                        ? `/api/projects/${document.project_id}/documents/${document.id}/preview`
                        : docUrl;
                      window.open(previewUrl, '_blank');
                    }
                  }}
                 >
                                       {/* Card Layout - Image and Details in One Row */}
                                         <div className="flex flex-col h-full">
                                                 {/* Image/Icon Section - Simple and clean like preview */}
                         <div className="flex-1 flex items-center justify-center mb-3">
                           {isImageFile(fileType) ? (
                             <div className="relative w-full">
                               <ImageThumbnail
                                 url={docUrl}
                                 alt={fileName}
                                 className="w-full object-contain rounded border border-gray-200"
                                 downloadUrl={document.project_id ? `/api/projects/${document.project_id}/documents/${document.id}/download` : undefined}
                               />
                               {/* Simple fallback icon */}
                               <div 
                                 className="w-full h-full hidden items-center justify-center bg-gray-100 rounded border border-gray-200"
                               >
                                 <div className="text-center">
                                   <ImageIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                                   <div className="text-sm text-gray-600">IMG</div>
                                 </div>
                               </div>
                             </div>
                           ) : fileType.toLowerCase().includes('pdf') ? (
                             <PdfThumbnail 
                               url={docUrl} 
                               alt={fileName} 
                               className="w-full"
                               downloadUrl={document.project_id ? `/api/projects/${document.project_id}/documents/${document.id}/download` : undefined}
                             />
                           ) : (
                                                           <div 
                                className="w-full min-h-20 flex items-center justify-center rounded border border-gray-200 bg-gray-50"
                              >
                               <div className="text-center">
                                 <div className="text-4xl">{getFileIcon(fileType)}</div>
                                 <div className="text-sm text-gray-600 mt-2">
                                   {fileName?.split('.').pop()?.toUpperCase() || 'DOC'}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>

                                                                       {/* Document Details - With badges */}
                         <div className="w-full space-y-2">
                           <h3 className="text-sm font-medium text-gray-900 truncate text-center px-2">
                             {fileName}
                           </h3>
                           
                           {/* Badges for photo documents */}
                           {isPhotoDocument(document) && (
                             <div className="flex items-center justify-center gap-2 text-xs">
                               <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-md">
                                 {fileName.toLowerCase().includes('passport') ? t('employee.documents.employeePassport') : 
                                  fileName.toLowerCase().includes('iqama') ? t('employee.documents.employeeIqama') : t('employee.documents.employeePhoto')}
                               </span>
                               {fileName.toLowerCase().includes('passport') && (
                                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                   {t('employee.documents.travelDocument')}
                                 </span>
                               )}
                               {fileName.toLowerCase().includes('iqama') && (
                                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                   {t('employee.documents.idCard')}
                                 </span>
                               )}
                             </div>
                           )}
                          {isEquipmentPhoto(document) && (
                            <div className="flex items-center justify-center gap-2 text-xs">
                              <span className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-md">
                                Equipment Photo
                              </span>
                            </div>
                          )}
                         </div>
                     </div>

                   {/* Action Buttons - Overlay on Hover */}
                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <div className="flex items-center gap-2">
                       {(isImageFile(fileType) || fileType.includes('pdf') || fileType.includes('text')) && canPreview && (
                         <Button
                           variant="secondary"
                           size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isImageFile(fileType) || fileType.includes('pdf')) {
                              // Show in modal for both images and PDFs
                              setPreviewImage(document);
                            } else if (fileType.includes('text')) {
                              // Text files still open in new tab
                              const previewUrl = document.project_id 
                                ? `/api/projects/${document.project_id}/documents/${document.id}/preview`
                                : docUrl;
                              window.open(previewUrl, '_blank');
                            }
                          }}
                           className="h-8 w-8 p-0 shadow-lg"
                           title={isImageFile(fileType) ? t('employee.documents.previewImage') : t('employee.documents.openDocument')}
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                       )}
                       {canDownload && (
                         <Button
                           variant="secondary"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDownload(document);
                           }}
                           className="h-8 w-8 p-0 shadow-lg"
                         >
                           <Download className="h-4 w-4" />
                         </Button>
                       )}
                       {canDelete && (
                         <Button
                           variant="destructive"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             handleDelete(document.id);
                           }}
                           disabled={deleting === document.id}
                           className="h-8 w-8 p-0 shadow-lg"
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
                 </div>
                 );
               })}
             </div>
          )}
        </div>
      </CardContent>

      {/* Document Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className={`bg-white rounded-lg p-4 max-h-[90vh] overflow-auto ${previewImage.file_type.includes('pdf') ? 'w-[90vw] max-w-6xl' : 'max-w-4xl'}`}>
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
                  <ImageThumbnail
                    url={previewImage.url}
                    alt={previewImage.name}
                    className="max-w-full max-h-[70vh] object-contain rounded"
                    downloadUrl={previewImage.project_id ? `/api/projects/${previewImage.project_id}/documents/${previewImage.id}/download` : undefined}
                  />
                  {/* Error fallback when image fails to load */}
                  <div className="hidden w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                    <ImageIcon className="h-16 w-16 text-muted-foreground" aria-hidden />
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-600">{previewImage.name}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        {t('employee.documents.failedToLoadImage')}
                      </p>
                      <Button
                        onClick={() => {
                          const downloadUrl = previewImage.project_id 
                            ? `/api/projects/${previewImage.project_id}/documents/${previewImage.id}/download`
                            : previewImage.url;
                          window.open(downloadUrl, '_blank');
                        }}
                        className="mt-4"
                      >
                        {t('employee.documents.openInNewTab')}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : previewImage.file_type.includes('pdf') ? (
                <div className="w-full h-[70vh]">
                  <PdfViewer
                    url={previewImage.url}
                    downloadUrl={previewImage.project_id 
                      ? `/api/projects/${previewImage.project_id}/documents/${previewImage.id}/download`
                      : previewImage.equipment_id
                      ? `/api/equipment/${previewImage.equipment_id}/documents/${previewImage.id}/download`
                      : undefined}
                    openInNewTabUrl={previewImage.project_id 
                      ? `/api/projects/${previewImage.project_id}/documents/${previewImage.id}/preview`
                      : previewImage.url}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                  <div className="flex justify-center text-muted-foreground [&>svg]:h-16 [&>svg]:w-16">{getFileIcon(previewImage.file_type)}</div>
                  <div className="text-center">
                    <p className="text-lg font-medium text-gray-600">{previewImage.name}</p>
                    <p className="text-sm text-gray-500 mt-2">
                      {t('employee.documents.cannotPreviewFileType')}
                    </p>
                    <Button
                      onClick={() => {
                        const openUrl = previewImage.project_id 
                          ? `/api/projects/${previewImage.project_id}/documents/${previewImage.id}/preview`
                          : previewImage.url;
                        window.open(openUrl, '_blank');
                      }}
                      className="mt-4"
                    >
                      {t('employee.documents.openInNewTab')}
                    </Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>{t('employee.documents.size')}: {formatFileSize(previewImage.size)}</p>
              <p>{t('employee.documents.uploaded')}: {new Date(previewImage.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(DocumentManagerComponent);
