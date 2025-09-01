'use client';

import { useCallback } from 'react';
import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PersonalPhotosSectionProps {
  employeeId: number;
}

export default function PersonalPhotosSection({ employeeId }: PersonalPhotosSectionProps) {
  const { hasPermission } = useRBAC();
  const { t } = useTranslation();

  // Helper function to get document type label
  const getDocumentTypeLabel = (documentType: string) => {
    if (!documentType) return 'Document';
    
    // Convert snake_case to Title Case
    return documentType
      .replace(/_/g, ' ')
      .replace(/\w\S*/g, (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());
  };

  // Helper function to get file type from filename
  const getFileTypeFromFileName = (fileName: string) => {
    if (!fileName) return 'UNKNOWN';
    const extension = fileName.split('.').pop()?.toLowerCase();
    return extension || 'UNKNOWN';
  };

  return (
    <div className="space-y-4">
      <div className="text-blue-600 text-xs bg-blue-50 p-2 rounded border border-blue-200">
        📸 <strong>{t('employee:personalInformation.note')}</strong> {t('employee:personalInformation.noteText')}
      </div>
      
      <DocumentManager
        title={t('employee:personalInformation.personalPhotosDocuments')}
        description={t('employee:personalInformation.employeePhotosDocuments')}
        loadDocuments={async () => {
          try {
            const response = await fetch(`/api/employees/${employeeId}/documents`);
            if (!response.ok) {
              throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            
            const data = await response.json();
            const list = Array.isArray(data) ? data : [];

            // Filter for personal documents (photos, iqama, passport) only
            const personalDocs = list.filter((d: any) => {
              const docName = (d.fileName || d.name || '').toLowerCase();
              const docType = (d.documentType || '').toLowerCase();
              
              // Include only personal documents
              return (
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
            });

            // Sort by priority: Photo, Iqama, Passport, then others
            const sortedDocs = personalDocs.sort((a: any, b: any) => {
              const getPriority = (doc: any) => {
                const name = (doc.fileName || doc.name || '').toLowerCase();
                const type = (doc.documentType || '').toLowerCase();
                if (name.includes('photo') || name.includes('picture') || name.includes('image') || type.includes('photo') || type === 'employee_photo') return 1;
                if (name.includes('iqama') || type.includes('iqama') || type === 'employee_iqama') return 2;
                if (name.includes('passport') || type.includes('passport') || type === 'employee_passport') return 3;
                return 4;
              };
              return getPriority(a) - getPriority(b);
            });

            return sortedDocs.map((d: any) => {
              // Map the API response fields to what DocumentManager expects
              const result = {
                id: d.id,
                name: d.fileName || d.name || getDocumentTypeLabel(d.documentType) || 'Document',
                file_name: d.fileName || d.file_name || 'Unknown Document',
                file_type: d.mimeType || d.file_type || getFileTypeFromFileName(d.fileName || d.file_name) || 'UNKNOWN',
                size: d.fileSize || d.size || 0,
                url: d.filePath || d.url || '',
                created_at: d.createdAt || d.created_at || new Date().toISOString(),
                typeLabel: getDocumentTypeLabel(d.documentType),
                employee_file_number: employeeId,
                document_type: d.documentType || '',
              };

              return result as DocumentItem;
            }) as DocumentItem[];
          } catch (error) {
            console.error('Error loading personal documents:', error);
            toast.error(t('employee:messages.loadingError'));
            return [] as DocumentItem[];
          }
        }}
        uploadDocument={async () => {
          // No upload functionality in Personal tab - redirect to Documents tab
          toast.info(t('employee:personalInformation.uploadNewDocuments'));
          return false;
        }}
        deleteDocument={async (id) => {
          try {
            const response = await fetch(`/api/employees/${employeeId}/documents/${id}`, {
              method: 'DELETE',
              credentials: 'include',
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Failed to delete document');
            }
            
            toast.success('Document deleted successfully');
            return true;
          } catch (error) {
            console.error('Delete error:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to delete document');
            return false;
          }
        }}
        // RBAC-controlled actions
        canUpload={false} // No upload in Personal tab
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
      />
    </div>
  );
}
