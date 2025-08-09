"use client";

import { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileText,
  Download,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  Plus,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { ApiService } from "@/lib/api-service";
import DocumentManager, { type DocumentItem } from "@/components/shared/DocumentManager";

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
  onDocumentsUpdated 
}: EquipmentDocumentUploadProps) {
  const [documents, setDocuments] = useState<EquipmentDocument[]>([]);
  const [loading, setLoading] = useState(false);

  // Load documents on component mount
  useEffect(() => {
    loadDocuments();
  }, [equipmentId]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await ApiService.getEquipmentDocuments(equipmentId);
      if (response.success && response.data) {
        setDocuments(response.data.documents || []);
      }
    } catch (error) {
      console.error('Failed to load documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    // kept for backward compatibility if needed by other logic
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif'],
      'text/plain': ['.txt'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  // Legacy handlers not used anymore (kept to avoid breaking imports)
  const handleDeleteDocument = async (_documentId: number) => {};

  const handleDownload = (doc: EquipmentDocument) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImagePreview = (_doc: EquipmentDocument) => {};

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('image')) return '🖼️';
    return '📄';
  };

  const isImageFile = (fileType: string) => {
    return fileType.startsWith('image/');
  };

  return (
    <DocumentManager
      title="Documents"
      description="Upload and manage equipment documents, manuals, and certificates"
      loadDocuments={async () => {
        setLoading(true);
        try {
          const response = await ApiService.getEquipmentDocuments(equipmentId);
          if (response.success && response.data) {
            const items = (response.data.documents || []) as any[];
            return items as unknown as DocumentItem[];
          }
          return [];
        } finally {
          setLoading(false);
        }
      }}
      uploadDocument={async (file, extra) => {
        await ApiService.uploadEquipmentDocument(
          equipmentId,
          file,
          (extra?.document_name as string) || file.name
        );
        onDocumentsUpdated?.();
      }}
      deleteDocument={async (id) => {
        await ApiService.deleteEquipmentDocument(equipmentId, id);
        onDocumentsUpdated?.();
      }}
      showNameInput
      nameInputLabel="Document Name (Optional)"
    />
  );
}
