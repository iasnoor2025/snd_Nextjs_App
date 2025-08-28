'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { format } from 'date-fns';
import {
  Download,
  Eye,
  FileDown,
  FileImage,
  FileText,
  RefreshCw,
  Search,
  Settings,
  Upload,
  User,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DocumentManagementPermission } from '@/components/shared/DocumentManagementPermission';

interface Document {
  id: string | number;
  type: 'employee' | 'equipment';
  documentType: string;
  filePath: string;
  fileName: string;
  originalFileName?: string;
  fileSize: number;
  mimeType: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  employeeId?: number;
  employeeName?: string;
  employeeFileNumber?: string;
  equipmentId?: number;
  equipmentName?: string;
  equipmentModel?: string;
  equipmentSerial?: string;
  url: string;
  viewUrl?: string;
  searchableText: string;
  fileSizeFormatted?: string; // Added for formatted size
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

interface CountsInfo {
  employee: number;
  equipment: number;
  total: number;
}

export default function DocumentManagementPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string | number>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10, // Fixed limit of 10 documents per page
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [counts, setCounts] = useState<CountsInfo>({
    employee: 0,
    equipment: 0,
    total: 0,
  });
  const [combining, setCombining] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null);

  const fetchDocuments = useCallback(
    async (page = 1, search = '', type = 'all') => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10', // Use fixed limit instead of pagination.limit
          search,
          type,
        });

        const response = await fetch(`/api/documents/supabase?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            // Transform documents to include proper viewing URLs
            const transformedDocuments = data.data.documents.map((doc: Document) => {
              // Use the actual Supabase URL directly instead of creating download API endpoints
              const directUrl = doc.url || doc.filePath;
              
              return {
                ...doc,
                // Use direct Supabase URL for both viewing and downloading
                url: directUrl,
                viewUrl: directUrl
              };
            });
            setDocuments(transformedDocuments);
            setPagination(data.data.pagination);
            setCounts(data.data.counts);
          } else {
            toast.error('Failed to fetch documents');
          }
        } else {
          toast.error('Failed to fetch documents');
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
        toast.error('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    },
    [searchTerm, documentType] // Add proper dependencies
  );

  useEffect(() => {
    fetchDocuments(1, searchTerm, documentType);
  }, [searchTerm, documentType]); // Remove fetchDocuments from dependencies

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleTypeChange = (value: string) => {
    setDocumentType(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedDocuments(new Set());
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchDocuments(newPage, searchTerm, documentType);
  };

  const handleDocumentSelect = (documentId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedDocuments);
    if (checked) {
      newSelected.add(documentId);
    } else {
      newSelected.delete(documentId);
    }
    setSelectedDocuments(newSelected);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(new Set(documents.map(doc => doc.id)));
    } else {
      setSelectedDocuments(new Set());
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return <FileText className="h-5 w-5 text-red-500" />;
    if (mimeType.includes('word') || mimeType.includes('document'))
      return <FileText className="h-5 w-5 text-blue-500" />;
    if (mimeType.includes('image')) return <FileImage className="h-5 w-5 text-green-500" />;
    return <FileText className="h-5 w-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isImageFile = (mimeType: string) => {
    return mimeType.includes('image');
  };

  const downloadDocument = async (document: Document) => {
    try {
      // For Supabase URLs, we can download directly
      if (document.url && document.url.startsWith('http')) {
        const response = await fetch(document.url);
        if (response.ok) {
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          const a = window.document.createElement('a');
          a.href = url;
          
          // Create a meaningful filename
          const fileExtension = document.fileName.split('.').pop() || '';
          const ownerInfo = document.type === 'employee' 
            ? `Employee_${document.employeeFileNumber || document.employeeId || 'Unknown'}`
            : `Equipment_${document.equipmentId || 'Unknown'}`;
          const documentType = document.documentType ? `_${document.documentType.replace(/_/g, '')}` : '';
          
          a.download = `${ownerInfo}${documentType}_${document.fileName}`;
          
          window.document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          window.document.body.removeChild(a);
          toast.success('Document downloaded successfully');
        } else {
          toast.error(`Failed to download document: ${response.status} ${response.statusText}`);
        }
      } else {
        toast.error('Document URL is not accessible');
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download document: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const combineDocumentsToPDF = async () => {
    if (selectedDocuments.size === 0) {
      toast.error('Please select documents to combine');
      return;
    }

    setCombining(true);
    try {
      const selectedDocIds = Array.from(selectedDocuments);
      
      // Get the actual documents for debugging
      const selectedDocs = documents.filter(doc => selectedDocuments.has(doc.id));
      console.log('Selected documents for combination:', selectedDocs);
      console.log('Document IDs being sent:', selectedDocIds);

      const response = await fetch('/api/documents/combine-pdf-supabase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for authentication
        body: JSON.stringify({
          documentIds: selectedDocIds,
          type: documentType,
        }),
      });

      console.log('Combine PDF response status:', response.status);
      console.log('Combine PDF response headers:', Object.fromEntries(response.headers.entries()));

      if (response.ok) {
        // Get the PDF blob directly from the response
        const pdfBlob = await response.blob();
        console.log('PDF blob size:', pdfBlob.size);

        // Get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `combined_documents_${Date.now()}.pdf`;

        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="(.+)"/);
          if (filenameMatch && filenameMatch[1]) {
            filename = filenameMatch[1];
          }
        }

        // Create download link
        const downloadUrl = window.URL.createObjectURL(pdfBlob);
        const a = window.document.createElement('a');
        a.href = downloadUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        // Clean up the blob URL
        window.URL.revokeObjectURL(downloadUrl);

        toast.success('Documents combined and downloaded successfully');

        // Clear selection after successful combination
        setSelectedDocuments(new Set());
      } else {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          console.error('Combine PDF error response:', errorData);
          
          // Handle different error response formats
          let errorMessage = 'Failed to combine documents';
          if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.error) {
            errorMessage = errorData.error;
          } else if (errorData.details) {
            errorMessage = errorData.details;
          }
          
          toast.error(errorMessage);
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          const errorText = await response.text();
          console.error('Raw error response:', errorText);
          toast.error(`Failed to combine documents (${response.status}): ${errorText}`);
        }
      }
    } catch (error) {
      console.error('Combine PDF error:', error);
      toast.error('Failed to combine documents: ' + (error as Error).message);
    } finally {
      setCombining(false);
    }
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  const handlePreviewDocument = (document: Document) => {
    setPreviewDocument(document);
  };

  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };

  const formatDescriptiveFilename = (filename: string) => {
    // Format descriptive filenames like "passport-employee-123.jpg" to "Passport - Employee 123"
    if (!filename) return filename;
    
    const nameWithoutExtension = filename.split('.')[0];
    if (!nameWithoutExtension) return filename;
    
    const parts = nameWithoutExtension.split('-');
    if (parts.length >= 2 && parts[0]) {
      const documentType = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      const context = parts.slice(1).join(' ').replace(/\b\w/g, l => l.toUpperCase());
      return `${documentType} - ${context}`;
    }
    
    return filename;
  };

  return (
    <DocumentManagementPermission>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
            <p className="text-muted-foreground">
              Manage and search all employee and equipment documents from Supabase storage
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => fetchDocuments(1, searchTerm, documentType)}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>

          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Employee Documents</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.employee}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Equipment Documents</CardTitle>
              <Settings className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.equipment}</div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Document Management</CardTitle>
            <CardDescription>
              Search and manage documents with descriptive filenames. Files are automatically named with document type and employee/equipment information for easy identification.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search by document type, employee name, file number, or filename..."
                    value={searchTerm}
                    onChange={e => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={documentType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="employee">Employee Only</SelectItem>
                  <SelectItem value="equipment">Equipment Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Actions Bar */}
        {selectedDocuments.size > 0 && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {selectedDocuments.size} document(s) selected
                  </span>
                  <Button variant="ghost" size="sm" onClick={clearSelection}>
                    Clear Selection
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={combineDocumentsToPDF}
                    disabled={combining}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {combining ? 'Combining Documents...' : 'Combine Documents to PDF'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  This will create a PDF containing all selected documents (images, PDFs, etc.)
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Documents List */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle>Documents</CardTitle>
                <CardDescription>
                  Showing {documents.length} of {pagination.total} documents with descriptive filenames
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="select-all"
                  checked={selectedDocuments.size === documents.length && documents.length > 0}
                  onCheckedChange={handleSelectAll}
                />
                <label htmlFor="select-all" className="text-sm text-muted-foreground">
                  Select All
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No documents found</div>
            ) : (
              <div className="space-y-4">
                {documents.map(document => (
                  <div
                    key={document.id}
                    className="flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <Checkbox
                      checked={selectedDocuments.has(document.id)}
                      onCheckedChange={checked =>
                        handleDocumentSelect(document.id, checked as boolean)
                      }
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        {getFileIcon(document.mimeType)}
                        <span className="font-medium truncate" title={document.fileName}>
                          {formatDescriptiveFilename(document.fileName)}
                        </span>
                        <Badge variant={document.type === 'employee' ? 'default' : 'secondary'}>
                          {document.type}
                        </Badge>
                        {document.documentType && (
                          <Badge variant="outline" className="text-xs">
                            {document.documentType}
                          </Badge>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Owner:</span>
                          <span>
                            {document.type === 'employee'
                              ? `${document.employeeName || 'Unknown'} (${document.employeeFileNumber || 'No File #'})`
                              : `${document.equipmentName || 'Unknown'} ${document.equipmentModel ? `(${document.equipmentModel})` : ''}`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Size:</span>
                          <span>{document.fileSizeFormatted || formatFileSize(document.fileSize || 0)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Date:</span>
                          <span>{formatDate(new Date(document.createdAt))}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePreviewDocument(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadDocument(document)}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={!pagination.hasPrev}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Document Preview Modal */}
        {previewDocument && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
              <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{previewDocument.fileName}</h3>
                {previewDocument.originalFileName && previewDocument.originalFileName !== previewDocument.fileName && (
                  <span className="text-sm text-muted-foreground">
                    ({previewDocument.originalFileName})
                  </span>
                )}
                <Badge variant={previewDocument.type === 'employee' ? 'default' : 'secondary'}>
                  {previewDocument.type}
                </Badge>
                {previewDocument.documentType && (
                  <Badge variant="outline" className="text-xs">
                    {previewDocument.documentType.replace(/_/g, ' ')}
                  </Badge>
                )}
              </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setPreviewDocument(null)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex justify-center">
                {isImageFile(previewDocument.mimeType) ? (
                  <div className="relative">
                    <img
                      src={previewDocument.url}
                      alt={previewDocument.fileName}
                      className="max-w-full max-h-[70vh] object-contain rounded"
                      onError={(e) => {
                        console.error('Image preview failed:', e);
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        // Show fallback message
                        const fallbackDiv = target.nextElementSibling as HTMLElement;
                        if (fallbackDiv) {
                          fallbackDiv.style.display = 'flex';
                        }
                      }}
                    />
                    {/* Fallback when image fails to load */}
                    <div className="hidden w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                      <div className="text-6xl">🖼️</div>
                      <div className="text-center">
                        <p className="text-lg font-medium text-gray-600">{previewDocument.fileName}</p>
                        <p className="text-sm text-gray-500 mt-2">
                          Failed to load image preview. The image may not be accessible.
                        </p>
                        <Button
                          onClick={() => window.open(previewDocument.url, '_blank')}
                          className="mt-4"
                        >
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : previewDocument.mimeType.includes('pdf') ? (
                  <div className="w-full h-[70vh] flex items-center justify-center">
                    <div className="flex flex-col items-center justify-center h-full gap-4 max-w-md text-center">
                      <div className="text-8xl text-red-500">📄</div>
                      <h3 className="text-xl font-semibold text-gray-800">PDF Document</h3>
                      <p className="text-sm text-gray-600">
                        {previewDocument.fileName}
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF files cannot be previewed inline for security reasons.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-3 mt-4">
                        <Button
                          onClick={() => window.open(previewDocument.url, '_blank')}
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Open in New Tab
                        </Button>
                        <Button
                          onClick={() => downloadDocument(previewDocument)}
                          variant="default"
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-[70vh] flex items-center justify-center flex-col gap-4">
                    <div className="text-6xl">{getFileIcon(previewDocument.mimeType)}</div>
                    <div className="text-center">
                      <p className="text-lg font-medium text-gray-600">{previewDocument.fileName}</p>
                      <p className="text-sm text-gray-500 mt-2">
                        This file type cannot be previewed directly.
                      </p>
                      <Button
                        onClick={() => window.open(previewDocument.url, '_blank')}
                        className="mt-4"
                      >
                        Open in New Tab
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              <div className="mt-4 text-sm text-muted-foreground text-center">
                <p>Size: {previewDocument.fileSizeFormatted || formatFileSize(previewDocument.fileSize || 0)}</p>
                <p>Uploaded: {formatDate(new Date(previewDocument.createdAt))}</p>
                {previewDocument.originalFileName && previewDocument.originalFileName !== previewDocument.fileName && (
                  <p>Original File: {previewDocument.originalFileName}</p>
                )}
                <p>Owner: {
                  previewDocument.type === 'employee'
                    ? `${previewDocument.employeeName || 'Unknown'} (${previewDocument.employeeFileNumber || 'No File #'})`
                    : `${previewDocument.equipmentName || 'Unknown'} ${previewDocument.equipmentModel ? `(${previewDocument.equipmentModel})` : ''}`
                }</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DocumentManagementPermission>
  );
}
