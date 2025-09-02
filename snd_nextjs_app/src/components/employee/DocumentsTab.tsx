'use client';

import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { Plus, RefreshCw, Trash2, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { useI18n } from '@/hooks/use-i18n';

interface Document {
  id: number;
  name: string;
  file_name: string;
  file_type: string;
  size: number;
  url: string;
  mime_type: string;
  document_type: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

interface DocumentsTabProps {
  employeeId: number;
}

export default function DocumentsTab({ employeeId }: DocumentsTabProps) {
  const { t } = useI18n();
  const { hasPermission } = useRBAC();
  const { data: session, status: sessionStatus } = useSession();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);
  const [hasError, setHasError] = useState(false);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: '',
    file: null as File | null,
    description: '',
  });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  const documentNameOptions = [
    { label: '📸 Employee Photo', value: 'employee_photo', priority: 'high' },
    { label: '🆔 Employee Iqama', value: 'employee_iqama', priority: 'high' },
    { label: '🛂 Employee Passport', value: 'employee_passport', priority: 'high' },
    { label: '🚗 Driving License', value: 'driving_license', priority: 'medium' },
    { label: '⚙️ Operator License', value: 'operator_license', priority: 'medium' },
    { label: '🔧 SPSP License', value: 'spsp_license', priority: 'medium' },
    { label: '🏆 TUV Certification', value: 'tuv_certification', priority: 'medium' },
    { label: '📄 Employment Contract', value: 'contract', priority: 'high' },
    { label: '🏥 Medical Certificate', value: 'medical', priority: 'high' },
    { label: '📁 General Document', value: 'general', priority: 'low' },
  ];

  // Debug session status
  useEffect(() => {

  }, [sessionStatus, session, employeeId]);

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('employee.documents.loadingSession')}</span>
      </div>
    );
  }

  // Show error if not authenticated
  if (sessionStatus === 'unauthenticated' || !session?.user) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">{t('employee.documents.authenticationRequired')}</div>
          <div className="mt-1 text-sm text-red-600">{t('employee.documents.pleaseLogin')}</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  // Error boundary effect
  useEffect(() => {
    if (error && !hasError) {
      setHasError(true);
      
    }
  }, [error, hasError]);

  // Reset error state when employeeId changes
  useEffect(() => {
    setError(null);
    setHasError(false);
  }, [employeeId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      
      const response = await fetch(`/api/employees/${employeeId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        // Add credentials to ensure cookies are sent
        credentials: 'include',
      });
      

      if (response.ok) {
        const data = await response.json();
        
        // Filter out personal documents (photos, iqama, passport) since they're shown in Personal tab
        const filteredData = Array.isArray(data) ? data.filter((doc: Document) => {
          const docName = doc.name.toLowerCase();
          const docType = doc.document_type.toLowerCase();
          
          // Exclude personal documents
          return !(
            docName.includes('photo') || 
            docName.includes('picture') || 
            docName.includes('image') ||
            docName.includes('passport') ||
            docName.includes('iqama') ||
            docType.includes('photo') ||
            docType.includes('passport') ||
            docType.includes('iqama') ||
            docType === 'employee_photo' ||
            docType === 'employee_iqama' ||
            docType === 'employee_passport'
          );
        }) : [];
        
        setDocuments(filteredData);
      } else {
        const errorText = await response.text();

        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: `HTTP ${response.status}: ${response.statusText}` };
        }

        const errorMessage = errorData.error || `Failed to load documents (${response.status})`;
        
        setError(errorMessage);
      }
    } catch (error) {
      
      const errorMessage = error instanceof Error ? error.message : 'Failed to load documents';
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadForm(prev => ({ ...prev, file }));
    }
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !uploadForm.document_name.trim()) {
      toast.error(t('employee.documents.selectFileAndName'));
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('document_name', uploadForm.document_name.trim());
      if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
      formData.append('description', uploadForm.description);

      const response = await fetch(`/api/employees/${employeeId}/documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(t('employee.documents.uploadSuccess'));
        setShowUploadDialog(false);
        setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
        fetchDocuments(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('employee.documents.uploadFailed'));
      }
    } catch (error) {
      
      toast.error(t('employee.documents.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm(t('employee.documents.confirmDelete'))) {
      return;
    }

    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success(t('employee.documents.deleteSuccess'));
        fetchDocuments(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || t('employee.documents.deleteFailed'));
      }
    } catch (error) {
      
      toast.error(t('employee.documents.deleteFailed'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents/${doc.id}/download`, {
        credentials: 'include',
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.file_name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        toast.error(t('employee.documents.downloadFailed'));
      }
    } catch (error) {
      
      toast.error(t('employee.documents.downloadFailed'));
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return `0 ${t('employee.documents.bytes')}`;
    const k = 1024;
    const sizes = [t('employee.documents.bytes'), t('employee.documents.kb'), t('employee.documents.mb'), t('employee.documents.gb')];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (type: string | undefined): boolean => {
    if (!type) return false;
    return type.startsWith('image/') || type.toLowerCase().includes('image');
  };

  const getFileIcon = (type: string | undefined): string => {
    const t = (type || '').toLowerCase();
    if (t.includes('pdf')) return '📄';
    if (t.includes('word') || t.includes('doc')) return '📝';
    if (t.includes('excel') || t.includes('sheet') || t.includes('xls')) return '📊';
    if (t.includes('image')) return '🖼️';
    return '📄';
  };

  const getDocumentTypeBadge = (type: string) => {
    const typeColors: { [key: string]: string } = {
      iqama: 'bg-blue-100 text-blue-800',
      passport: 'bg-green-100 text-green-800',
      driving_license: 'bg-yellow-100 text-yellow-800',
      contract: 'bg-purple-100 text-purple-800',
      medical: 'bg-red-100 text-red-800',
      general: 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={typeColors[type] || typeColors.general}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const toTitleCase = (s: string) =>
    s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const getDocumentTypeLabel = (type?: string) => {
    if (!type) return t('employee.documents.document');
    return toTitleCase(type.replace(/_/g, ' '));
  };

  const getFileTypeFromFileName = (fileName: string): string => {
    if (!fileName) return 'UNKNOWN';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    // Map common file extensions to MIME types
    const mimeTypeMap: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      txt: 'text/plain',
      rtf: 'application/rtf',
    };

    return mimeTypeMap[ext] || 'application/octet-stream';
  };

  const getDownloadFileName = (doc: any) => {
    const typeLabel = getDocumentTypeLabel(doc.document_type);
    const safeType = typeLabel.replace(/\s+/g, '_');
    const safeFile = (doc.file_number || doc.employee_file_number || employeeId).toString();
    const ext = (doc.file_name || '').split('.').pop() || 'file';
    return `${safeFile}_${safeType}.${ext}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">{t('employee.documents.loadingDocuments')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">{t('employee.documents.errorLoadingDocuments')}</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={fetchDocuments} className="bg-white">
              <RefreshCw className="mr-2 h-4 w-4" /> {t('employee.documents.tryAgain')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">{t('employee.documents.criticalError')}</div>
          <div className="mt-1 text-sm text-red-600">
                          {error || t('employee.documents.unexpectedError')}
          </div>
          <div className="mt-4 flex justify-center space-x-2">
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setHasError(false);
                fetchDocuments();
              }}
              className="bg-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {t('employee.documents.retry')}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setError(null);
                setHasError(false);
                setLoading(true);
                // Force a fresh reload
                setTimeout(() => fetchDocuments(), 100);
              }}
              className="bg-white"
            >
              <RefreshCw className="mr-2 h-4 w-4" /> {t('employee.documents.forceReload')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="w-full">
        <DocumentManager
          title={t('employee.documents.title')}
          description={t('employee.documents.description')}
          beforeUpload={files => {
            if (!uploadForm.document_name.trim() || !uploadForm.document_type.trim()) {
              setPendingFiles(files);
              setShowDetailsDialog(true);
              return false;
            }
            return true;
          }}
          loadDocuments={async () => {
            try {
              
              const response = await fetch(`/api/employees/${employeeId}/documents`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });

              if (response.ok) {
                const data = await response.json();

                const list = Array.isArray(data) ? data : [];

                // Filter out personal documents (photos, iqama, passport) since they're shown in Personal tab
                const filteredList = list.filter((d: any) => {
                  const docName = (d.fileName || d.name || '').toLowerCase();
                  const docType = (d.documentType || '').toLowerCase();
                  
                  // Exclude personal documents
                  return !(
                    docName.includes('photo') || 
                    docName.includes('picture') || 
                    docName.includes('image') ||
                    docName.includes('passport') ||
                    docName.includes('iqama') ||
                    docType.includes('photo') ||
                    docType.includes('passport') ||
                    docType.includes('iqama')
                  );
                });

                return filteredList.map((d: any) => {

                  // Map the API response fields to what DocumentManager expects
                  const result = {
                    id: d.id,
                    name:
                      d.fileName || d.name || getDocumentTypeLabel(d.documentType) || 'Document',
                    file_name: d.fileName || d.file_name || 'Unknown Document',
                    file_type:
                      d.mimeType ||
                      d.file_type ||
                      getFileTypeFromFileName(d.fileName || d.file_name) ||
                      'UNKNOWN',
                    size: d.fileSize || d.size || 0,
                    url: d.filePath || d.url || '', // Use actual file path instead of download API
                    created_at: d.createdAt || d.created_at || new Date().toISOString(),
                    typeLabel: getDocumentTypeLabel(d.documentType),
                    employee_file_number: employeeId,
                    document_type: d.documentType || '',
                  };

                  return result as DocumentItem;
                }) as DocumentItem[];
              } else {
                
                const errorText = await response.text();
                
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
              }
            } catch (error) {
              
              // Return empty array instead of throwing to prevent app crash
              return [] as DocumentItem[];
            }
          }}
          uploadDocument={async (file, extra) => {
            try {
              // Initialize progress for this file
              setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
              
              const formData = new FormData();
              formData.append('file', file);
              formData.append('document_name', uploadForm.document_name.trim());
              if (uploadForm.document_type)
                formData.append('document_type', uploadForm.document_type);
              formData.append('description', uploadForm.description);

              // Simulate progress updates for better UX
              const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                  const current = prev[file.name] || 0;
                  if (current < 90) {
                    return { ...prev, [file.name]: current + Math.random() * 10 };
                  }
                  return prev;
                });
              }, 200);

              const response = await fetch(`/api/employees/${employeeId}/documents/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              clearInterval(progressInterval);

              if (!response.ok) {
                const errorData = await response.json();
                // Show specific error messages
                if (errorData.error && errorData.error.includes('already exists')) {
                  toast.error(errorData.error);
                } else {
                  throw new Error(errorData.message || 'Upload failed');
                }
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                return false;
              }

              // Set progress to 100% for successful upload
              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));

              // Refresh documents after successful upload
              fetchDocuments();
              return true;
            } catch (error) {
              setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
              toast.error(error instanceof Error ? error.message : 'Failed to upload document');
              return false;
            }
          }}
          deleteDocument={async id => {
            try {
              const response = await fetch(`/api/employees/${employeeId}/documents/${id}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete document');
              }
              // Refresh documents after successful deletion
              fetchDocuments();
              return true;
            } catch (error) {
              
              toast.error(error instanceof Error ? error.message : 'Failed to delete document');
              return false;
            }
          }}
          // RBAC-controlled actions
          canUpload={hasPermission('create', 'employee-document')}
          canDownload={hasPermission('read', 'employee-document')}
          canPreview={hasPermission('read', 'employee-document')}
          canDelete={hasPermission('delete', 'employee-document')}
          downloadPrefix={doc =>
            doc.employee_file_number ? String(doc.employee_file_number) : String(employeeId)
          }
          singleLine={false}
          wrapItems
          showSize={true}
          showDate={true}
          // Extra controls for employee: description only (name/type asked in popup)
          renderExtraControls={
            <div className="grid gap-3">
              <div>
                <Label htmlFor="description">{t('employee.documents.description')}</Label>
                <Input
                  id="description"
                  value={uploadForm.description}
                  onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder={t('employee.documents.descriptionPlaceholder')}
                />
              </div>
            </div>
          }
        />
      </div>

      <Dialog
        open={showDetailsDialog}
        onOpenChange={open => {
          if (!open) setPendingFiles(null);
          setShowDetailsDialog(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('employee.documents.documentDetails')}</DialogTitle>
            <DialogDescription>
                              {t('employee.documents.provideNameAndType')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="doc_name_popup">{t('employee.documents.documentName')}</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={v => {
                  const opt = documentNameOptions.find(o => o.value === v);
                  setUploadForm(prev => ({
                    ...prev,
                    document_type: v,
                    document_name: opt ? opt.label : v,
                  }));
                }}
              >
                <SelectTrigger id="doc_name_popup">
                  <SelectValue placeholder={t('employee.documents.selectDocumentName')} />
                </SelectTrigger>
                <SelectContent>
                  {documentNameOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* File Information and Progress */}
            {pendingFiles && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="mb-2">
                    <strong>{t('employee.documents.filesToUpload')}:</strong> {pendingFiles.length} {t('employee.documents.file')}(s)
                  </div>
                  <div className="mb-2">
                    <strong>{t('employee.documents.totalSize')}:</strong> {formatFileSize(pendingFiles.reduce((total, file) => total + file.size, 0))}
                  </div>
                              {pendingFiles.some(f => f.type.startsWith('image/')) && (
              <div className="text-green-600 text-xs">
                📸 {t('employee.documents.imagesWillBeCompressed')}
              </div>
            )}
            
                </div>

                {/* Upload Progress Display */}
                {uploading && Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <Label>{t('employee.documents.uploadProgress')}</Label>
                    {pendingFiles.map((file) => (
                      <div key={file.name} className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="truncate">{file.name}</span>
                          <span>{Math.round(uploadProgress[file.name] || 0)}%</span>
                        </div>
                        <Progress value={uploadProgress[file.name] || 0} className="h-2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDetailsDialog(false);
                setPendingFiles(null);
                setUploadProgress({});
              }}
            >
              {t('employee.documents.cancel')}
            </Button>
            <Button
              onClick={async () => {
                if (
                  !uploadForm.document_name.trim() ||
                  !uploadForm.document_type.trim() ||
                  !pendingFiles
                ) {
                  return;
                }
                setUploading(true);
                setUploadProgress({});
                try {
                  let successCount = 0;
                  let errorCount = 0;

                  for (const file of pendingFiles) {
                    try {
                      // Initialize progress for this file
                      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                      
                      const formData = new FormData();
                      formData.append('file', file);
                      formData.append('document_name', uploadForm.document_name.trim());
                      formData.append('document_type', uploadForm.document_type.trim());
                      formData.append('description', uploadForm.description);

                      // Simulate progress updates for better UX
                      const progressInterval = setInterval(() => {
                        setUploadProgress(prev => {
                          const current = prev[file.name] || 0;
                          if (current < 90) {
                            return { ...prev, [file.name]: current + Math.random() * 10 };
                          }
                          return prev;
                        });
                      }, 200);

                      const resp = await fetch(`/api/employees/${employeeId}/documents/upload`, {
                        method: 'POST',
                        body: formData,
                        credentials: 'include',
                      });

                      clearInterval(progressInterval);

                      if (!resp.ok) {
                        const errorData = await resp.json();
                        // Show specific error messages
                        if (errorData.error && errorData.error.includes('already exists')) {
                          toast.error(errorData.error);
                        } else {
                          throw new Error(errorData.message || 'Upload failed');
                        }
                        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                        errorCount++;
                        continue;
                      }

                      // Set progress to 100% for successful upload
                      setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
                      successCount++;
                    } catch (fileError) {
                      setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                      errorCount++;
                    }
                  }

                  if (errorCount === 0) {
                    toast.success(t('employee.documents.uploadSuccessMultiple', { count: successCount }));
                    setPendingFiles(null);
                    setShowDetailsDialog(false);
                    setUploadForm({
                      document_name: '',
                      document_type: '',
                      file: null,
                      description: '',
                    });
                    setUploadProgress({});
                    fetchDocuments();
                  } else if (successCount > 0) {
                    toast.success(t('employee.documents.uploadPartialSuccess', { success: successCount, failed: errorCount }));
                    setPendingFiles(null);
                    setShowDetailsDialog(false);
                    setUploadForm({
                      document_name: '',
                      document_type: '',
                      file: null,
                      description: '',
                    });
                    setUploadProgress({});
                    fetchDocuments();
                  } else {
                    toast.error(t('employee.documents.uploadAllFailed'));
                  }
                } catch (e) {
                  
                  toast.error(t('employee.documents.uploadFailed'));
                } finally {
                  setUploading(false);
                }
              }}
            >
              {uploading ? t('employee.documents.uploading') : t('employee.documents.upload')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
