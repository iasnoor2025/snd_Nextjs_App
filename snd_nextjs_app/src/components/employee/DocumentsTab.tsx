"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Trash2, RefreshCw, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRBAC } from "@/lib/rbac/rbac-context";
import { useDropzone } from "react-dropzone";
import DocumentManager, { type DocumentItem } from "@/components/shared/DocumentManager";

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
  const { hasPermission } = useRBAC();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null);

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_name: '',
    document_type: '',
    file: null as File | null,
    description: '',
  });

  const documentNameOptions = [
    { label: 'Iqama', value: 'iqama' },
    { label: 'Passport', value: 'passport' },
    { label: 'Driving License', value: 'driving_license' },
    { label: 'Operator License', value: 'operator_license' },
    { label: 'SPSP License', value: 'spsp_license' },
    { label: 'TUV Certification', value: 'tuv_certification' },
    { label: 'Employment Contract', value: 'contract' },
    { label: 'Medical Certificate', value: 'medical' },
    { label: 'General Document', value: 'general' },
  ];

  useEffect(() => {
    fetchDocuments();
  }, [employeeId]);

  const fetchDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents`);
      if (response.ok) {
        const data = await response.json();
        setDocuments(Array.isArray(data) ? data : []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to load documents');
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to load documents');
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
      toast.error('Please select a file and enter a document name');
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
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
        fetchDocuments(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  // Drag & drop handler (multiple files)
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!acceptedFiles.length) return;
    if (!uploadForm.document_name.trim() || !uploadForm.document_type.trim()) {
      setPendingFiles(acceptedFiles);
      setShowDetailsDialog(true);
      return;
    }

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_name', uploadForm.document_name.trim());
        if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
        formData.append('description', uploadForm.description);

        const response = await fetch(`/api/employees/${employeeId}/documents/upload`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');
      }

      toast.success('Document(s) uploaded successfully');
      setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
      fetchDocuments();
    } catch (error) {
      console.error('Error uploading documents:', error);
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }, [employeeId, uploadForm]);

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

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) {
      return;
    }

    setDeletingId(documentId);
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Document deleted successfully');
        fetchDocuments(); // Refresh the list
      } else {
        const errorData = await response.json();
        toast.error(errorData.error || 'Failed to delete document');
      }
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDownload = async (doc: Document) => {
    try {
      const response = await fetch(`/api/employees/${employeeId}/documents/${doc.id}/download`);
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
        toast.error('Failed to download document');
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error('Failed to download document');
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
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
      'iqama': 'bg-blue-100 text-blue-800',
      'passport': 'bg-green-100 text-green-800',
      'driving_license': 'bg-yellow-100 text-yellow-800',
      'contract': 'bg-purple-100 text-purple-800',
      'medical': 'bg-red-100 text-red-800',
      'general': 'bg-gray-100 text-gray-800',
    };

    return (
      <Badge className={typeColors[type] || typeColors.general}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const toTitleCase = (s: string) => s.replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

  const getDocumentTypeLabel = (type?: string) => {
    if (!type) return 'Document';
    return toTitleCase(type.replace(/_/g, ' '));
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
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <div className="text-center">
          <div className="font-medium text-red-600">Error Loading Documents</div>
          <div className="mt-1 text-sm text-red-600">{error}</div>
          <div className="mt-4 flex justify-center">
            <Button variant="outline" onClick={fetchDocuments} className="bg-white">
              <RefreshCw className="mr-2 h-4 w-4" /> Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
    <DocumentManager
      title="Employee Documents"
      description="Upload and manage employee documents"
      beforeUpload={(files) => {
        if (!uploadForm.document_name.trim() || !uploadForm.document_type.trim()) {
          setPendingFiles(files);
          setShowDetailsDialog(true);
          return false;
        }
        return true;
      }}
      loadDocuments={async () => {
        const response = await fetch(`/api/employees/${employeeId}/documents`);
        if (response.ok) {
          const data = await response.json();
          const list = Array.isArray(data) ? data : [];
          return list.map((d: any) => {
            const fileNum = d.employee?.file_number || d.file_number;
            const base = (d.name || getDocumentTypeLabel(d.document_type) || 'Document').toString();
            const displayName = fileNum ? `${base} (File ${fileNum})` : base;
            return {
              id: d.id,
              name: displayName,
              file_name: d.file_name,
              file_type: d.mime_type || d.file_type || '',
              size: d.size ?? 0,
              url: d.url,
              created_at: d.created_at,
              typeLabel: getDocumentTypeLabel(d.document_type),
              employee_file_number: fileNum,
              document_type: d.document_type,
            } as DocumentItem;
          }) as DocumentItem[];
        }
        return [] as DocumentItem[];
      }}
      uploadDocument={async (file, extra) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('document_name', uploadForm.document_name.trim());
        if (uploadForm.document_type) formData.append('document_type', uploadForm.document_type);
        formData.append('description', uploadForm.description);

        await fetch(`/api/employees/${employeeId}/documents/upload`, {
          method: 'POST',
          body: formData,
        });
      }}
      deleteDocument={async (id) => {
        await fetch(`/api/employees/${employeeId}/documents/${id}`, { method: 'DELETE' });
      }}
      // RBAC-controlled actions
      canUpload={hasPermission('create', 'employee-document')}
      canDownload={hasPermission('read', 'employee-document')}
      canPreview={hasPermission('read', 'employee-document')}
      canDelete={hasPermission('delete', 'employee-document')}
      downloadPrefix={(doc) => (doc.employee_file_number ? String(doc.employee_file_number) : String(employeeId))}
      singleLine={false}
      wrapItems
      showSize={false}
      showDate={false}
      // Extra controls for employee: description only (name/type asked in popup)
      renderExtraControls={(
        <div className="grid gap-3">
          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Input
              id="description"
              value={uploadForm.description}
              onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter document description..."
            />
          </div>
        </div>
      )}
    />

    <Dialog open={showDetailsDialog} onOpenChange={(open) => { if(!open) setPendingFiles(null); setShowDetailsDialog(open); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Document Details</DialogTitle>
          <DialogDescription>Provide a name and select document type before uploading.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="doc_name_popup">Document Name</Label>
            <Select
              value={uploadForm.document_type}
              onValueChange={(v) => {
                const opt = documentNameOptions.find(o => o.value === v);
                setUploadForm(prev => ({...prev, document_type: v, document_name: opt ? opt.label : v }));
              }}
            >
              <SelectTrigger id="doc_name_popup">
                <SelectValue placeholder="Select document name" />
              </SelectTrigger>
              <SelectContent>
                {documentNameOptions.map(o => (
                  <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setShowDetailsDialog(false); setPendingFiles(null); }}>Cancel</Button>
          <Button onClick={async () => {
            if (!uploadForm.document_name.trim() || !uploadForm.document_type.trim() || !pendingFiles) { return; }
            setUploading(true);
            try {
              for (const file of pendingFiles) {
                const formData = new FormData();
                formData.append('file', file);
                formData.append('document_name', uploadForm.document_name.trim());
                formData.append('document_type', uploadForm.document_type.trim());
                formData.append('description', uploadForm.description);
                const resp = await fetch(`/api/employees/${employeeId}/documents/upload`, { method: 'POST', body: formData });
                if (!resp.ok) throw new Error('Upload failed');
              }
              toast.success('Document(s) uploaded successfully');
              setPendingFiles(null);
              setShowDetailsDialog(false);
              setUploadForm({ document_name: '', document_type: '', file: null, description: '' });
              fetchDocuments();
            } catch (e) {
              toast.error('Failed to upload documents');
            } finally {
              setUploading(false);
            }
          }}>
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
} 