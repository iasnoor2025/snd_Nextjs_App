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
import { useTranslations } from '@/hooks/use-translations';

// EquipmentDocument interface removed as it's not used

interface EquipmentDocumentUploadProps {
  equipmentId: number;
  onDocumentsUpdated?: () => void;
}

export default function EquipmentDocumentUpload({
  equipmentId,
  onDocumentsUpdated,
}: EquipmentDocumentUploadProps) {
  console.log('🔧 EquipmentDocumentUpload component rendering with equipmentId:', equipmentId);
  console.log('🚨 COMPONENT IS RENDERING - CHECK THIS LOG');
  
  const { t } = useTranslations();
  const { hasPermission } = useRBAC();
  
  // Debug permission checks
  const canCreate = hasPermission('create', 'equipment-document');
  const canDelete = hasPermission('delete', 'equipment-document');
  const canRead = hasPermission('read', 'equipment-document');
  const canManage = hasPermission('manage', 'equipment-document');
  
  // Use manage permission as fallback for upload if create is not available
  const canUpload = canCreate || canManage;
  
  console.log('📋 Equipment Document Permissions:', {
    canCreate,
    canDelete,
    canRead,
    canManage,
    canUpload,
    equipmentId
  });
  
  // Additional debug info
  console.log('🔍 canUpload value:', canUpload);
  console.log('🔍 canCreate value:', canCreate);
  console.log('🔍 canManage value:', canManage);
  const [_documents, setDocuments] = useState<DocumentItem[]>([]);
  const [_isLoading, setIsLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  
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
    { label: t('equipment.documents.userManual'), value: 'user_manual' },
    { label: t('equipment.documents.serviceManual'), value: 'service_manual' },
    { label: t('equipment.documents.maintenanceManual'), value: 'maintenance_manual' },
    { label: t('equipment.documents.safetyCertificate'), value: 'safety_certificate' },
    { label: t('equipment.documents.inspectionReport'), value: 'inspection_report' },
    { label: t('equipment.documents.warrantyDocument'), value: 'warranty' },
    { label: t('equipment.documents.purchaseInvoice'), value: 'purchase_invoice' },
    { label: t('equipment.documents.equipmentRegistration'), value: 'registration' },
    { label: t('equipment.documents.insuranceDocument'), value: 'insurance' },
    { label: t('equipment.documents.other'), value: 'other' },
  ];

  const loadDocuments = useCallback(async () => {
    try {
      console.log('🔄 loadDocuments called for equipment:', equipmentId);
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
        console.log('📄 Documents API response:', result);
        if (result.success && result.documents) {
                     // Convert API response to DocumentItem format
           const docs = result.documents.map((doc: Record<string, unknown>) => ({
            id: doc.id,
            name: doc.name || doc.fileName,
            file_name: doc.fileName,
            file_type: doc.mimeType || 'application/octet-stream',
            size: doc.fileSize || 0,
            url: doc.url || doc.filePath,
            created_at: doc.createdAt || doc.created_at
          })) as DocumentItem[];
          
          console.log('📋 Processed documents:', docs);
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
    async (file: File, extra?: Record<string, unknown>) => {
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
            setRefreshTrigger(prev => prev + 1);
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
            setRefreshTrigger(prev => prev + 1);
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
        console.log('✅ All uploads successful, refreshing documents...');
        toast.success(t('equipment.documents.uploadSuccess'));
        setShowUploadDialog(false);
        setPendingFiles([]);
        setUploadForm({ document_name: '', document_type: '', description: '' });
        setUploadProgress({});
        // Refresh the documents list after all uploads are complete
        await loadDocuments();
        setRefreshTrigger(prev => prev + 1);
        console.log('🔄 Documents refresh completed');
      }
    } catch (error) {
      console.error('Upload error:', error);
              toast.error(t('equipment.documents.uploadError'));
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
              <Label htmlFor="document_name">{t('equipment.documents.documentName')} *</Label>
              <Input
                id="document_name"
                value={uploadForm.document_name}
                onChange={e => setUploadForm({ ...uploadForm, document_name: e.target.value })}
                placeholder={t('equipment.documents.enterDocumentName')}
                required
              />
              <p className="text-xs text-muted-foreground">
                {t('equipment.documents.uniqueNameWarning')}
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="document_type">{t('equipment.documents.documentType')}</Label>
              <Select
                value={uploadForm.document_type}
                onValueChange={value => setUploadForm({ ...uploadForm, document_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('equipment.documents.selectDocumentType')} />
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
              <Label htmlFor="document_description">{t('equipment.documents.description')}</Label>
              <Textarea
                id="document_description"
                value={uploadForm.description}
                onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })}
                placeholder={t('equipment.documents.describeDocumentOptional')}
              />
            </div>

            {/* Upload Progress Display */}
            {uploading && Object.keys(uploadProgress).length > 0 && (
              <div className="space-y-3">
                <Label>{t('equipment.documents.uploadProgress')}</Label>
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
              {t('equipment.actions.cancel')}
            </Button>
            <Button onClick={handleUpload} disabled={uploading}>
              {uploading ? t('equipment.documents.uploading') : `${t('equipment.documents.upload')} ${pendingFiles.length > 1 ? `${pendingFiles.length} ${t('equipment.documents.files')}` : t('equipment.documents.file')}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Document Manager */}
      {!loadDocuments || !uploadDocument || !deleteDocument ? (
        <div className="text-center py-8 text-gray-500">
          <p>{t('equipment.documents.loadingDocumentManager')}</p>
        </div>
      ) : (
        <DocumentManager
          key={`equipment-${equipmentId}-${refreshTrigger}`}
          title={t('equipment.documents.title')}
          description={t('equipment.documents.description')}
          loadDocuments={loadDocuments}
          uploadDocument={uploadDocument}
          deleteDocument={deleteDocument}
          showNameInput={false}
          beforeUpload={handleBeforeUpload}
          canUpload={canUpload}
          canDelete={canDelete}
          canDownload={canRead}
          canPreview={canRead}
        />
      )}
    </>
  );
}
