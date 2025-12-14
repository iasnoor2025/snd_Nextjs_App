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
import { toast } from 'sonner';

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

interface ProjectDocumentsTabProps {
  projectId: number;
}

export default function ProjectDocumentsTab({ projectId }: ProjectDocumentsTabProps) {
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

  const documentTypeOptions = [
    { label: '📄 Contract', value: 'contract' },
    { label: '📋 Proposal', value: 'proposal' },
    { label: '📊 Report', value: 'report' },
    { label: '📝 Meeting Notes', value: 'meeting_notes' },
    { label: '📐 Blueprint', value: 'blueprint' },
    { label: '📸 Photo', value: 'photo' },
    { label: '📑 Invoice', value: 'invoice' },
    { label: '📋 Specification', value: 'specification' },
    { label: '📄 General Document', value: 'general' },
  ];

  // Show loading while session is loading
  if (sessionStatus === 'loading') {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading...</span>
      </div>
    );
  }

  // Show error if not authenticated
  if (sessionStatus === 'unauthenticated' || !session?.user) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">Authentication Required</div>
          <div className="mt-1 text-sm text-red-600">Please log in to view project documents.</div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Error boundary effect
  useEffect(() => {
    if (error && !hasError) {
      setHasError(true);
    }
  }, [error, hasError]);

  // Reset error state when projectId changes
  useEffect(() => {
    setError(null);
    setHasError(false);
  }, [projectId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/projects/${projectId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'max-age=300',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
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

  const handleUpload = async (fileOverride?: File) => {
    const fileToUpload = fileOverride || uploadForm.file;
    
    if (!fileToUpload || !uploadForm.document_name.trim()) {
      toast.error('Please select a file and provide a document name');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('document_name', uploadForm.document_name.trim());
      if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
      formData.append('description', uploadForm.description);

      const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
        setTimeout(() => {
          fetchDocuments();
        }, 500);
        setTimeout(() => {
          fetchDocuments();
        }, 2000);
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload document');
      }
    } catch (error) {
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/projects/${projectId}/documents/${documentId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments();
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeFromFileName = (fileName: string): string => {
    if (!fileName) return 'UNKNOWN';
    const ext = fileName.split('.').pop()?.toUpperCase();
    return ext || 'UNKNOWN';
  };

  const getDocumentTypeLabel = (type?: string) => {
    if (!type) return 'Document';
    return type.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">Error Loading Documents</div>
          <div className="mt-1 text-sm text-red-600">{error || 'An unexpected error occurred'}</div>
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
              <RefreshCw className="mr-2 h-4 w-4" /> Retry
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
          title="Project Documents"
          description="Upload and manage project-related documents"
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
              const response = await fetch(`/api/projects/${projectId}/documents`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
                credentials: 'include',
              });

              if (response.ok) {
                const data = await response.json();
                const list = Array.isArray(data) ? data : [];

                return list.map((d: any) => {
                  return {
                    id: d.id,
                    name: d.fileName || d.name || getDocumentTypeLabel(d.documentType) || 'Document',
                    file_name: d.fileName || d.file_name || 'Unknown Document',
                    file_type:
                      d.mimeType ||
                      d.file_type ||
                      getFileTypeFromFileName(d.fileName || d.file_name) ||
                      'UNKNOWN',
                    size: d.fileSize || d.size || 0,
                    url: d.filePath || d.url || '',
                    created_at: d.createdAt || d.created_at || new Date().toISOString(),
                    typeLabel: getDocumentTypeLabel(d.documentType),
                    document_type: d.documentType || '',
                    project_id: projectId, // Add project ID for download endpoint
                  } as DocumentItem;
                }) as DocumentItem[];
              } else {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
              }
            } catch (error) {
              return [] as DocumentItem[];
            }
          }}
          uploadDocument={async (file, extra) => {
            try {
              setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));

              const formData = new FormData();
              formData.append('file', file);
              formData.append('document_name', uploadForm.document_name.trim());
              if (uploadForm.document_type)
                formData.append('document_type', uploadForm.document_type);
              formData.append('description', uploadForm.description);

              const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                  const current = prev[file.name] || 0;
                  if (current < 90) {
                    return { ...prev, [file.name]: current + Math.random() * 10 };
                  }
                  return prev;
                });
              }, 200);

              const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
                method: 'POST',
                body: formData,
                credentials: 'include',
              });

              clearInterval(progressInterval);

              if (!response.ok) {
                const errorData = await response.json();
                if (errorData.error && errorData.error.includes('already exists')) {
                  toast.error(errorData.error);
                } else {
                  throw new Error(errorData.message || 'Upload failed');
                }
                setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
                return false;
              }

              setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
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
              const response = await fetch(`/api/projects/${projectId}/documents/${id}`, {
                method: 'DELETE',
                credentials: 'include',
              });
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to delete document');
              }
              fetchDocuments();
              return true;
            } catch (error) {
              toast.error(error instanceof Error ? error.message : 'Failed to delete document');
              return false;
            }
          }}
          downloadDocument={async id => {
            try {
              // Use the download endpoint which handles S3 authentication
              const response = await fetch(`/api/projects/${projectId}/documents/${id}/download`, {
                method: 'GET',
                credentials: 'include',
              });
              
              if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to download document');
              }
              
              const blob = await response.blob();
              const url = window.URL.createObjectURL(blob);
              
              // Get filename from Content-Disposition header or use default
              const contentDisposition = response.headers.get('Content-Disposition');
              let filename = 'document.pdf';
              if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
                if (filenameMatch && filenameMatch[1]) {
                  filename = filenameMatch[1].replace(/['"]/g, '');
                  // Decode URI-encoded filename
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
              
              toast.success('Document downloaded successfully');
            } catch (error) {
              console.error('Download error:', error);
              toast.error(error instanceof Error ? error.message : 'Failed to download document');
            }
          }}
          canUpload={hasPermission('create', 'Project')}
          canDownload={hasPermission('read', 'Project')}
          canPreview={hasPermission('read', 'Project')}
          canDelete={hasPermission('delete', 'Project')}
          singleLine={false}
          wrapItems
          showSize={true}
          showDate={true}
          renderExtraControls={
            <div className="grid gap-3">
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={uploadForm.description}
                  onChange={e => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description for this document"
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
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Please provide a name and type for the document(s) you're uploading.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label htmlFor="doc_name_popup">Document Name</Label>
              <Input
                id="doc_name_popup"
                value={uploadForm.document_name}
                onChange={e => setUploadForm(prev => ({ ...prev, document_name: e.target.value }))}
                placeholder="Enter document name"
              />
            </div>
            <div>
              <Label htmlFor="doc_type_popup">Document Type</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={v => {
                  const opt = documentTypeOptions.find(o => o.value === v);
                  setUploadForm(prev => ({
                    ...prev,
                    document_type: v,
                    document_name: opt ? opt.label.replace(/^[^\s]+\s/, '') : v,
                  }));
                }}
              >
                <SelectTrigger id="doc_type_popup">
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map(o => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {pendingFiles && (
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">
                  <div className="mb-2">
                    <strong>Files to upload:</strong> {pendingFiles.length} file(s)
                  </div>
                  <div className="mb-2">
                    <strong>Total size:</strong>{' '}
                    {formatFileSize(pendingFiles.reduce((total, file) => total + file.size, 0))}
                  </div>
                </div>
                {uploading && Object.keys(uploadProgress).length > 0 && (
                  <div className="space-y-2">
                    <Label>Upload Progress</Label>
                    {pendingFiles.map(file => (
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
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                if (!pendingFiles || pendingFiles.length === 0) {
                  toast.error('No files selected');
                  return;
                }
                
                if (!uploadForm.document_name.trim() || !uploadForm.document_type) {
                  toast.error('Please provide a document name and type');
                  return;
                }
                
                setShowDetailsDialog(false);
                setUploading(true);
                
                try {
                  // Upload all pending files
                  for (const file of pendingFiles) {
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('document_name', uploadForm.document_name.trim());
                    if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
                    formData.append('description', uploadForm.description);

                    const response = await fetch(`/api/projects/${projectId}/documents/upload`, {
                      method: 'POST',
                      body: formData,
                      credentials: 'include',
                    });

                    if (!response.ok) {
                      const errorData = await response.json();
                      throw new Error(errorData.error || `Failed to upload ${file.name}`);
                    }
                  }
                  
                  toast.success(`Successfully uploaded ${pendingFiles.length} file(s)`);
                  setPendingFiles(null);
                  setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
                  fetchDocuments();
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Failed to upload document');
                } finally {
                  setUploading(false);
                }
              }}
              disabled={!uploadForm.document_name.trim() || !uploadForm.document_type || uploading}
            >
              {uploading ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
