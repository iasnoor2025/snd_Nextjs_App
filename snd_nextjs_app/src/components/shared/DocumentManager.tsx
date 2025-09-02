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
import { useI18n } from '@/hooks/use-i18n';

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
  const { t } = useI18n();
  
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
    title = t('employee.documents.title'),
    description = t('employee.documents.description'),
    loadDocuments,
    uploadDocument,
    deleteDocument,
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

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await loadDocuments();
      const sortedList = Array.isArray(list) ? list : [];
      
      // Sort documents by priority: 1. Photo, 2. Iqama, 3. Passport, 4. Others
      sortedList.sort((a, b) => {
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
      
      setDocuments(sortedList);
      
      // Debug: Log document URLs to help troubleshoot
      if (sortedList && sortedList.length > 0) {
        console.log('Documents loaded and sorted:', sortedList.map(doc => ({
          id: doc.id,
          name: doc.name,
          url: doc.url,
          file_type: doc.file_type
        })));
      }
    } catch (error) {
      console.error('Error loading documents:', error);
      toast.error(t('employee.documents.errorLoadingDocuments'));
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
      console.log('Attempting to delete document:', id);
      const result = await deleteDocument(id);
      console.log('Delete result:', result);
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
        toast.success(t('employee.documents.downloadStarted'));
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
      toast.success(t('employee.documents.downloadStarted'));
    } catch (error) {
      console.error('Download error:', error);
      toast.error(t('employee.documents.downloadFailed'));
    }
  };

  const isImageFile = (type: string) => type?.startsWith('image/');
  
  // Check if document is specifically a photo (employee photo, profile picture, etc.)
  const isPhotoDocument = (doc: DocumentItem) => {
    return doc.document_type === 'photo' || 
           doc.name.toLowerCase().includes('photo') || 
           doc.name.toLowerCase().includes('picture') ||
           doc.name.toLowerCase().includes('image') ||
           doc.name.toLowerCase().includes('passport') ||
           doc.name.toLowerCase().includes('iqama');
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
               {documents.map(document => (
                 <div
                   key={document.id}
                                       className={
                      singleLine
                        ? 'inline-flex shrink-0 items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors min-w-[520px]'
                        : 'group relative bg-white border border-gray-200 rounded-lg p-3 hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer'
                    }
                   onClick={() => {
                     if (isImageFile(document.file_type)) {
                       setPreviewImage(document);
                     } else if (document.file_type.includes('pdf') || document.file_type.includes('text')) {
                       window.open(document.url, '_blank');
                     }
                   }}
                 >
                                       {/* Card Layout - Image and Details in One Row */}
                                         <div className="flex flex-col h-full">
                                                 {/* Image/Icon Section - Simple and clean like preview */}
                         <div className="flex-1 flex items-center justify-center mb-3">
                           {isImageFile(document.file_type) ? (
                                                           <div className="relative w-full">
                                <img
                                  src={document.url}
                                  alt={document.name}
                                  className="w-full object-contain rounded border border-gray-200"
                                  style={{ transformOrigin: 'center center' }}
                                  onLoad={(e) => {
                                    const img = e.target as HTMLImageElement;
                                    
                                    // Auto-size to fit image naturally - no rotation
                                    img.style.transform = 'rotate(0deg)';
                                    img.style.objectFit = 'contain';
                                    
                                    // Ensure smooth transitions
                                    img.style.transition = 'all 0.3s ease-in-out';
                                  }}
                                 onError={e => {
                                   const target = e.target as HTMLImageElement;
                                   target.style.display = 'none';
                                   const fallbackDiv = target.nextElementSibling as HTMLElement;
                                   if (fallbackDiv) {
                                     fallbackDiv.style.display = 'flex';
                                   }
                                 }}
                               />
                               {/* Simple fallback icon */}
                               <div 
                                 className="w-full h-full hidden items-center justify-center bg-gray-100 rounded border border-gray-200"
                               >
                                 <div className="text-center">
                                   <div className="text-3xl">🖼️</div>
                                   <div className="text-sm text-gray-600">IMG</div>
                                 </div>
                               </div>
                             </div>
                           ) : (
                                                           <div 
                                className="w-full min-h-20 flex items-center justify-center rounded border border-gray-200 bg-gray-50"
                              >
                               <div className="text-center">
                                 <div className="text-4xl">{getFileIcon(document.file_type)}</div>
                                 <div className="text-sm text-gray-600 mt-2">
                                   {document.file_name?.split('.').pop()?.toUpperCase() || 'DOC'}
                                 </div>
                               </div>
                             </div>
                           )}
                         </div>

                                                                       {/* Document Details - With badges */}
                         <div className="w-full space-y-2">
                           <h3 className="text-sm font-medium text-gray-900 truncate text-center px-2">
                             {document.name}
                           </h3>
                           
                           {/* Badges for photo documents */}
                           {isPhotoDocument(document) && (
                             <div className="flex items-center justify-center gap-2 text-xs">
                               <span className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-full font-semibold shadow-md">
                                 {document.name.toLowerCase().includes('passport') ? t('employee.documents.employeePassport') : 
                                  document.name.toLowerCase().includes('iqama') ? t('employee.documents.employeeIqama') : t('employee.documents.employeePhoto')}
                               </span>
                               {document.name.toLowerCase().includes('passport') && (
                                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                   {t('employee.documents.travelDocument')}
                                 </span>
                               )}
                               {document.name.toLowerCase().includes('iqama') && (
                                 <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium">
                                   {t('employee.documents.idCard')}
                                 </span>
                               )}
                             </div>
                           )}
                         </div>
                     </div>

                   {/* Action Buttons - Overlay on Hover */}
                   <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100">
                     <div className="flex items-center gap-2">
                       {(isImageFile(document.file_type) || document.file_type.includes('pdf') || document.file_type.includes('text')) && canPreview && (
                         <Button
                           variant="secondary"
                           size="sm"
                           onClick={(e) => {
                             e.stopPropagation();
                             if (isImageFile(document.file_type)) {
                               setPreviewImage(document);
                             } else if (document.file_type.includes('pdf') || document.file_type.includes('text')) {
                               window.open(document.url, '_blank');
                             }
                           }}
                           className="h-8 w-8 p-0 shadow-lg"
                           title={isImageFile(document.file_type) ? t('employee.documents.previewImage') : t('employee.documents.openDocument')}
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
                         {t('employee.documents.failedToLoadImage')}
                       </p>
                      <Button
                        onClick={() => window.open(previewImage.url, '_blank')}
                        className="mt-4"
                      >
                        {t('employee.documents.openInNewTab')}
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
                      {t('employee.documents.cannotPreviewFileType')}
                    </p>
                    <Button
                      onClick={() => window.open(previewImage.url, '_blank')}
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
}
