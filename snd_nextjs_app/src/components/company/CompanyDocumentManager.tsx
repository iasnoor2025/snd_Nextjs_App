'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Download, Eye, FileText, Loader2, Trash2, Upload, X, AlertTriangle, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';

export interface CompanyDocument {
  id: number;
  companyId: number;
  documentType: string;
  documentNumber: string;
  expiryDate: string | null;
  filePath: string | null;
  fileName: string | null;
  fileSize: number | null;
  mimeType: string | null;
  description: string | null;
  status: 'active' | 'expired' | 'expiring_soon' | 'missing';
  createdAt: string;
  updatedAt: string;
}

interface CompanyDocumentManagerProps {
  companyId: number;
  companyName: string;
  onDocumentsChange?: (documents: CompanyDocument[]) => void;
}

const SAUDI_LAW_DOCUMENT_TYPES = [
  {
    key: 'commercial_registration',
    label: 'Commercial Registration',
    required: true,
    description: 'Required by Saudi law for all commercial entities'
  },
  {
    key: 'tax_registration',
    label: 'Tax Registration',
    required: true,
    description: 'Required by Saudi law for tax compliance'
  },
  {
    key: 'municipality_license',
    label: 'Municipality License',
    required: false,
    description: 'Required for certain business activities'
  },
  {
    key: 'chamber_of_commerce',
    label: 'Chamber of Commerce',
    required: false,
    description: 'Business association registration'
  },
  {
    key: 'labor_office_license',
    label: 'Labor Office License',
    required: false,
    description: 'Required for hiring employees'
  },
  {
    key: 'gosi_registration',
    label: 'GOSI Registration',
    required: false,
    description: 'Social insurance registration'
  },
  {
    key: 'saudi_standards_license',
    label: 'Saudi Standards License',
    required: false,
    description: 'Quality standards compliance'
  },
  {
    key: 'environmental_license',
    label: 'Environmental License',
    required: false,
    description: 'Environmental compliance permit'
  }
];

export default function CompanyDocumentManager({ 
  companyId, 
  companyName,
  onDocumentsChange 
}: CompanyDocumentManagerProps) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [uploadForm, setUploadForm] = useState({
    documentNumber: '',
    expiryDate: '',
    description: '',
    file: null as File | null,
  });

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/companies/${companyId}/documents`);
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocuments(result.data);
          onDocumentsChange?.(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setLoading(false);
    }
  }, [companyId, onDocumentsChange]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setUploadForm(prev => ({ ...prev, file: acceptedFiles[0] }));
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleUpload = async () => {
    if (!uploadForm.file || !selectedDocumentType || !uploadForm.documentNumber) {
      toast.error('Please fill in all required fields and select a file');
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('documentType', selectedDocumentType);
      formData.append('documentNumber', uploadForm.documentNumber);
      formData.append('expiryDate', uploadForm.expiryDate);
      formData.append('description', uploadForm.description);

      const response = await fetch(`/api/companies/${companyId}/documents`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Document uploaded successfully');
          setShowUploadDialog(false);
          setUploadForm({
            documentNumber: '',
            expiryDate: '',
            description: '',
            file: null,
          });
          setSelectedDocumentType('');
          refresh();
        } else {
          toast.error(result.message || 'Failed to upload document');
        }
      } else {
        toast.error('Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (documentId: number) => {
    if (!confirm('Are you sure you want to delete this document?')) return;

    try {
      setDeleting(documentId);
      const response = await fetch(`/api/companies/${companyId}/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success('Document deleted successfully');
          refresh();
        } else {
          toast.error(result.message || 'Failed to delete document');
        }
      } else {
        toast.error('Failed to delete document');
      }
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const getDocumentStatus = (document: CompanyDocument) => {
    if (!document.expiryDate) return 'missing';
    
    const expiryDate = new Date(document.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) return 'expired';
    if (daysUntilExpiry <= 30) return 'expiring_soon';
    return 'active';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'expiring_soon':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Expiring Soon</Badge>;
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'missing':
        return <Badge variant="outline">Missing</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const getDocumentByType = (type: string) => {
    return documents.find(doc => doc.documentType === type);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Document Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-red-600" />
            Saudi Law Compliance Status
          </CardTitle>
          <CardDescription>
            Track compliance with Saudi Arabian legal requirements
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {SAUDI_LAW_DOCUMENT_TYPES.map((docType) => {
              const document = getDocumentByType(docType.key);
              const status = document ? getDocumentStatus(document) : 'missing';
              
              return (
                <div key={docType.key} className="text-center p-3 border rounded-lg">
                  <div className="text-sm font-medium text-gray-600">{docType.label}</div>
                  <div className="mt-2">{getStatusBadge(status)}</div>
                  {document?.expiryDate && (
                    <div className="text-xs text-gray-500 mt-1">
                      Expires: {new Date(document.expiryDate).toLocaleDateString()}
                    </div>
                  )}
                  {docType.required && (
                    <div className="text-xs text-red-600 mt-1">Required</div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Document Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Document Management</CardTitle>
              <CardDescription>
                Upload and manage company documents for {companyName}
              </CardDescription>
            </div>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Document
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No documents uploaded yet</p>
              <p className="text-sm">Click "Upload Document" to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((document) => (
                <div key={document.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <FileText className="h-8 w-8 text-blue-500" />
                    <div>
                      <div className="font-medium">
                        {SAUDI_LAW_DOCUMENT_TYPES.find(t => t.key === document.documentType)?.label || document.documentType}
                      </div>
                      <div className="text-sm text-gray-600">
                        Number: {document.documentNumber}
                      </div>
                      {document.expiryDate && (
                        <div className="text-sm text-gray-600">
                          Expires: {new Date(document.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                      {document.description && (
                        <div className="text-sm text-gray-600">{document.description}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(getDocumentStatus(document))}
                    {document.filePath && (
                      <>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(document.id)}
                      disabled={deleting === document.id}
                    >
                      {deleting === document.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      {showUploadDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Upload Document</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowUploadDialog(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="documentType">Document Type *</Label>
                <select
                  id="documentType"
                  value={selectedDocumentType}
                  onChange={(e) => setSelectedDocumentType(e.target.value)}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">Select document type</option>
                  {SAUDI_LAW_DOCUMENT_TYPES.map((docType) => (
                    <option key={docType.key} value={docType.key}>
                      {docType.label} {docType.required ? '(Required)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="documentNumber">Document Number *</Label>
                <Input
                  id="documentNumber"
                  value={uploadForm.documentNumber}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, documentNumber: e.target.value }))}
                  placeholder="Enter document number"
                  required
                />
              </div>

              <div>
                <Label htmlFor="expiryDate">Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={uploadForm.expiryDate}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description"
                  rows={3}
                />
              </div>

              <div>
                <Label>File Upload *</Label>
                <div
                  {...getRootProps()}
                  className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                    isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  <input {...getInputProps()} />
                  {uploadForm.file ? (
                    <div>
                      <FileText className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                      <p className="font-medium">{uploadForm.file.name}</p>
                      <p className="text-sm text-gray-500">
                        {(uploadForm.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">
                        {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        PDF, DOC, DOCX, PNG, JPG up to 10MB
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowUploadDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpload}
                  disabled={uploading || !uploadForm.file || !selectedDocumentType || !uploadForm.documentNumber}
                  className="flex-1"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    'Upload Document'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
