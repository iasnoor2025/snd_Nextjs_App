'use client';

import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
import ApiService from '@/lib/api-service';
import { useCallback } from 'react';

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
  const loadDocuments = useCallback(async () => {
    const response = await ApiService.getEquipmentDocuments(equipmentId);
    if (response.success && response.data) {
      const items = (response.data.documents || []) as any[];
      return items as unknown as DocumentItem[];
    }
    return [];
  }, [equipmentId]);

  const uploadDocument = useCallback(
    async (file: File, extra?: Record<string, any>) => {
      await ApiService.uploadEquipmentDocument(
        equipmentId,
        file,
        (extra?.document_name as string) || file.name
      );
      onDocumentsUpdated?.();
    },
    [equipmentId, onDocumentsUpdated]
  );

  const deleteDocument = useCallback(
    async (id: number) => {
      await ApiService.deleteEquipmentDocument(equipmentId, id);
      onDocumentsUpdated?.();
    },
    [equipmentId, onDocumentsUpdated]
  );

  return (
    <DocumentManager
      title="Documents"
      description="Upload and manage equipment documents, manuals, and certificates"
      loadDocuments={loadDocuments}
      uploadDocument={uploadDocument}
      deleteDocument={deleteDocument}
      showNameInput
      nameInputLabel="Document Name (Optional)"
    />
  );
}
