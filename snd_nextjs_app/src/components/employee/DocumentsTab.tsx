"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Upload, Trash2, RefreshCw, Plus, Eye } from "lucide-react";
import { toast } from "sonner";
import { useRBAC } from "@/lib/rbac/rbac-context";

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

  // Upload form state
  const [uploadForm, setUploadForm] = useState({
    document_type: '',
    file: null as File | null,
    description: '',
  });

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
    if (!uploadForm.file || !uploadForm.document_type) {
      toast.error('Please select a file and document type');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('document_type', uploadForm.document_type);
      formData.append('description', uploadForm.description);

      const response = await fetch(`/api/employees/${employeeId}/documents/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        toast.success('Document uploaded successfully');
        setShowUploadDialog(false);
        setUploadForm({ document_type: '', file: null, description: '' });
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Employee Documents</h3>
          <p className="text-sm text-muted-foreground">
            Manage and view employee documents
          </p>
        </div>
        {hasPermission('create', 'employee-document') && (
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Upload Document
              </Button>
            </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a new document for this employee
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="document_type">Document Type</Label>
                <Select
                  value={uploadForm.document_type}
                  onValueChange={(value) => setUploadForm(prev => ({ ...prev, document_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select document type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iqama">Iqama</SelectItem>
                    <SelectItem value="passport">Passport</SelectItem>
                    <SelectItem value="driving_license">Driving License</SelectItem>
                    <SelectItem value="operator_license">Operator License</SelectItem>
                    <SelectItem value="spsp_license">SPSP License</SelectItem>
                    <SelectItem value="tuv_certification">TUV Certification</SelectItem>                  
                    <SelectItem value="contract">Employment Contract</SelectItem>
                    <SelectItem value="medical">Medical Certificate</SelectItem>
                    <SelectItem value="general">General Document</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="file">File</Label>
                <Input
                  id="file"
                  type="file"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                />
              </div>
              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter document description..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={uploading || !uploadForm.file || !uploadForm.document_type}>
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
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className="rounded-lg bg-muted/30 p-8 text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
          <h3 className="mb-2 text-lg font-medium">No Documents</h3>
          <p className="mb-6 text-sm text-muted-foreground">
            This employee doesn't have any documents uploaded yet.
          </p>
          {hasPermission('create', 'employee-document') && (
            <Button onClick={() => setShowUploadDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload First Document
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {documents.map((doc) => (
            <Card key={doc.id} className="overflow-hidden">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="truncate text-base" title={doc.name}>
                      {doc.name}
                    </CardTitle>
                    <CardDescription className="text-xs">
                      {doc.file_type} • {formatFileSize(doc.size)}
                    </CardDescription>
                  </div>
                  {getDocumentTypeBadge(doc.document_type)}
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                {doc.description && (
                  <p className="mb-3 text-sm text-muted-foreground">
                    {doc.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    {hasPermission('read', 'employee-document') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownload(doc)}
                      >
                        <Download className="mr-1 h-3.5 w-3.5" />
                        Download
                      </Button>
                    )}
                    {hasPermission('read', 'employee-document') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                  {hasPermission('delete', 'employee-document') && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(doc.id)}
                      disabled={deletingId === doc.id}
                    >
                      {deletingId === doc.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Uploaded: {new Date(doc.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 