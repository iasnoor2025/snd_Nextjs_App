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
  User,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface Document {
  id: number;
  type: 'employee' | 'equipment';
  documentType: string;
  filePath: string;
  fileName: string;
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
  searchableText: string;
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
  const [selectedDocuments, setSelectedDocuments] = useState<Set<number>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 50,
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

  const fetchDocuments = useCallback(
    async (page = 1, search = '', type = 'all') => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
          type,
        });

        const response = await fetch(`/api/documents/all?${params}`);
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setDocuments(data.data.documents);
            setPagination(data.data.pagination);
            setCounts(data.data.counts);
          } else {
            toast.error('Failed to fetch documents');
          }
        } else {
          toast.error('Failed to fetch documents');
        }
      } catch (error) {
        
        toast.error('Failed to fetch documents');
      } finally {
        setLoading(false);
      }
    },
    [pagination.limit]
  );

  useEffect(() => {
    fetchDocuments(1, searchTerm, documentType);
  }, [fetchDocuments, searchTerm, documentType]);

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

  const handleDocumentSelect = (documentId: number, checked: boolean) => {
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

  const downloadDocument = async (document: Document) => {
    try {
      const response = await fetch(document.url);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = document.fileName;
        window.document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        window.document.body.removeChild(a);
        toast.success('Document downloaded successfully');
      } else {
        toast.error('Failed to download document');
      }
    } catch (error) {
      
      toast.error('Failed to download document');
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

      const response = await fetch('/api/documents/combine-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedDocIds,
          type: documentType,
        }),
      });

      if (response.ok) {
        // Get the PDF blob directly from the response
        const pdfBlob = await response.blob();

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
        window.document.body.appendChild(a);
        a.click();
        window.document.body.removeChild(a);

        // Clean up the blob URL
        window.URL.revokeObjectURL(downloadUrl);

        toast.success('Documents combined and downloaded successfully');

        // Clear selection after successful combination
        setSelectedDocuments(new Set());
      } else {
        // Try to get error message from response
        try {
          const errorData = await response.json();
          toast.error(errorData.message || 'Failed to combine documents');
        } catch {
          toast.error('Failed to combine documents');
        }
      }
    } catch (error) {
      
      toast.error('Failed to combine documents');
    } finally {
      setCombining(false);
    }
  };

  const clearSelection = () => {
    setSelectedDocuments(new Set());
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">
            Manage and search all employee and equipment documents
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
          <CardTitle>Search & Filters</CardTitle>
          <CardDescription>
            Search documents by employee name, equipment, or document details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search documents, employees, or equipment..."
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
                Showing {documents.length} of {pagination.total} documents
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
                      <span className="font-medium truncate">{document.fileName}</span>
                      <Badge variant={document.type === 'employee' ? 'default' : 'secondary'}>
                        {document.type}
                      </Badge>
                      {document.documentType && (
                        <Badge variant="outline" className="text-xs">
                          {document.documentType.replace(/_/g, ' ')}
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
                        <span>{formatFileSize(document.fileSize)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">Date:</span>
                        <span>{format(new Date(document.createdAt), 'PPP')}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(document.url, '_blank')}
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
    </div>
  );
}
