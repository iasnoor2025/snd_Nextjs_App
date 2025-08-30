'use client';

import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { useCallback, useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useRBAC } from '@/lib/rbac/rbac-context';

interface EquipmentDocument {
  id: number;
  name: string;
  file_name: string;
  file_type: string;
  size: number;
  url: string;
  created_at: string;
}

interface EquipmentDocumentUploadProps {
  equipmentId: number;
  onDocumentsUpdated?: () => void;
}

export default function EquipmentDocumentUpload({
  equipmentId,
  onDocumentsUpdated,
}: EquipmentDocumentUploadProps) {
  const { hasPermission } = useRBAC();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  
  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: '',
    description: '',
  });
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});

  // Helper function to format file sizes
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const documentTypeOptions = [
    { label: 'User Manual', value: 'user_manual' },
    { label: 'Service Manual', value: 'service_manual' },
    { label: 'Maintenance Manual', value: 'maintenance_manual' },
    { label: 'Safety Certificate', value: 'safety_certificate' },
    { label: 'Inspection Report', value: 'inspection_report' },
    { label: 'Warranty Document', value: 'warranty' },
    { label: 'Purchase Invoice', value: 'purchase_invoice' },
    { label: 'Equipment Registration', value: 'registration' },
    { label: 'Insurance Document', value: 'insurance' },
    { label: 'Other', value: 'other' },
  ];

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch documents from the equipment documents API
      const response = await fetch(`/api/equipment/${equipmentId}/documents`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.documents) {
          // Convert API response to DocumentItem format
          const docs = result.documents.map((doc: any) => ({
            id: doc.id,
            name: doc.name || doc.fileName,
            file_name: doc.fileName,
            file_type: doc.mimeType || 'application/octet-stream',
            size: doc.fileSize || 0,
            url: doc.url || doc.filePath,
            created_at: doc.createdAt || doc.created_at
          })) as DocumentItem[];
          
          setDocuments(docs);
          return docs;
        }
      }
      setDocuments([]);
      return [];
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  // Load documents when component mounts
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const uploadDocument = useCallback(
    async (file: File, extra?: Record<string, any>) => {
      try {
        // Use the equipment-specific document upload API
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_name', (extra?.document_name as string) || file.name);
        formData.append('document_type', (extra?.document_type as string) || 'general');
        formData.append('description', (extra?.description as string) || '');

        const response = await fetch(`/api/equipment/${equipmentId}/documents`, {
          method: 'POST',
          body: formData,
          headers: {
            // Don't set Content-Type for FormData, let the browser set it
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh the documents list
            await loadDocuments();
            onDocumentsUpdated?.();
            return { success: true, data: result };
          } else {
            // Return error instead of throwing
            return { success: false, error: result.message || 'Upload failed' };
          }
        } else {
          const errorData = await response.json();
          // Return error instead of throwing
          return { success: false, error: errorData.error || 'Upload failed' };
        }
      } catch (error) {
        console.error('Upload error:', error);
        // Return error instead of throwing
        return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
      }
    },
    [equipmentId, onDocumentsUpdated, loadDocuments]
  );

  const deleteDocument = useCallback(
    async (id: number) => {
      try {
        // Use the proper equipment document delete API endpoint
        const response = await fetch(`/api/equipment/${equipmentId}/documents/${id}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh the documents list
            await loadDocuments();
            onDocumentsUpdated?.();
            toast.success('Document deleted successfully');
          } else {
            throw new Error(result.message || 'Delete failed');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
        throw error;
      }
    },
    [equipmentId, onDocumentsUpdated, loadDocuments]
  );

  // Handle file drop - show popup for document details
  const handleBeforeUpload = useCallback(async (files: File[]) => {
    setPendingFiles(files);
    setShowUploadDialog(true);
    return false; // Prevent automatic upload
  }, []);

  const handleUpload = async () => {
    if (!uploadForm.document_name.trim()) {
      toast.error('Please enter a document name');
      return;
    }

    setUploading(true);
    setUploadProgress({});
    
    try {
      let hasErrors = false;
      
      for (const file of pendingFiles) {
        // Initialize progress for this file
        setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        
        const extra = {
          document_name: uploadForm.document_name.trim(),
          document_type: uploadForm.document_type,
          description: uploadForm.description
        };
        
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
        
        const result = await uploadDocument(file, extra);
        
        clearInterval(progressInterval);
        
        if (!result.success) {
          hasErrors = true;
          // Show error toast for this specific file
          toast.error(result.error || 'Failed to upload file');
          setUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
        } else {
          // Set progress to 100% for successful upload
          setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        }
      }
      
      if (!hasErrors) {
        toast.success('Documents uploaded successfully');
        setShowUploadDialog(false);
        setPendingFiles([]);
        setUploadForm({ document_name: '', document_type: '', description: '' });
        setUploadProgress({});
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      {/* Document Name Input Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Document Details</DialogTitle>
            <DialogDescription>
              Provide a name and select document type before uploading {pendingFiles.length > 1 ? `${pendingFiles.length} files` : 'this file'}.
              {pendingFiles.length > 0 && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Total size: {formatFileSize(pendingFiles.reduce((total, file) => total + file.size, 0))}
                  {pendingFiles.some(f => f.type.startsWith('image/')) && (
                    <span className="block text-green-600">
                      📸 Images will be automatically compressed for faster upload
                    </span>
                  )}
                </div>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="document_name">Document Name *</Label>
              <Input
                id="document_name"
                value={uploadForm.document_name}
                onChange={e => setUploadForm({ ...uploadForm, document_name: e.target.value })}
                placeholder="Enter document name"
                required
              />
              <p className="text-xs text-muted-foreground">
                Each document name must be unique. If a document with this name already exists, please choose a different name or delete the existing document first.
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_type">Document Type</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={value => setUploadForm({ ...uploadForm, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select document type" />
                </SelectTrigger>
                <SelectContent>
                  {documentTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_description">Description</Label>
              <Textarea
                id="document_description"
                value={uploadForm.description}
                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder="Describe the document (optional)"
              />
            </div>

            {/* Upload Progress Display */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-3">
                <Label>Upload Progress</Label>
                {pendingFiles.map((file) => (
                  <div key={file.name} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="truncate">{file.name}</span>
                      <span>{Math.round(uploadProgress[file.name] || 0)}%</span>
                    </div>
                    <Progress value={uploadProgress[file.name] || 0} className="h-2" />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowUploadDialog(false);
              setPendingFiles([]);
              setUploadForm({ document_name: '', document_type: '', description: '' });
            }}>
              Cancel
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? 'Uploading...' : `Upload ${pendingFiles.length > 1 ? `${pendingFiles.length} Files` : 'File'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Manager */}
      {!loadDocuments || !uploadDocument || !deleteDocument ? (
        <div className="text-center py-8 text-gray-500">
          <p>Loading document manager...</p>
        </div>
      ) : (
        <DocumentManager
          title="Documents"
          description="Upload and manage equipment documents, manuals, and certificates"
          loadDocuments={loadDocuments}
          uploadDocument={uploadDocument}
          deleteDocument={deleteDocument}
          showNameInput={false}
          beforeUpload={handleBeforeUpload}
          canUpload={hasPermission('upload', 'Document')}
          canDelete={hasPermission('delete', 'Document')}
        />
      )}
    </>
  );
}
