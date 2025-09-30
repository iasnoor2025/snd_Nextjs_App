
'use client';


// Force dynamic rendering to prevent SSR issues
export const dynamic = 'force-dynamic';

import { ProtectedRoute } from '@/components/protected-route';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { useRBAC } from '@/lib/rbac/rbac-context';
import { useTranslations } from '@/hooks/use-translations';
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
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from 'lucide-react';
import { useCallback, useEffect, useState, useMemo } from 'react';
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
  equipmentDoorNumber?: string;
  url: string;
  viewUrl?: string;
  searchableText: string;
  fileSizeFormatted?: string;
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

type SortField = 'createdAt' | 'fileName' | 'fileSize' | 'documentType';
type SortOrder = 'asc' | 'desc';

export default function DocumentManagementPage() {
  const { user, hasPermission, getAllowedActions } = useRBAC();
  const { t } = useTranslations();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [documentType, setDocumentType] = useState('all');
  const [selectedDocuments, setSelectedDocuments] = useState<Set<string | number>>(new Set());
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 20, // Increased default limit
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
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Get allowed actions for document management
  const allowedActions = getAllowedActions('Document');

  const fetchDocuments = useCallback(
    async (page = 1, search = '', type = 'all', sortField = sortBy, sortDirection = sortOrder) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: pagination.limit.toString(),
          search,
          type,
          sortBy: sortField,
          sortOrder: sortDirection,
        });

        const response = await fetch(`/api/documents/all?${params}`);
        if (response.ok) {
          const data = await response.json();
          
          if (data.success) {
            // Transform documents to include proper viewing URLs
            const transformedDocuments = data.data.documents.map((doc: Document) => {
              // Use the actual MinIO URL directly instead of creating download API endpoints
              const directUrl = doc.url || doc.filePath;
              
              return {
                ...doc,
                // Use direct MinIO URL for both viewing and downloading
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
    [pagination.limit, sortBy, sortOrder]
  );

  useEffect(() => {
    fetchDocuments(1, searchTerm, documentType, sortBy, sortOrder);
  }, [searchTerm, documentType, sortBy, sortOrder]);

  // Debounced search
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setPagination(prev => ({ ...prev, page: 1 }));
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchDocuments(1, value, documentType, sortBy, sortOrder);
    }, 300);
    
    setSearchTimeout(timeout);
  };

  const handleTypeChange = (value: string) => {
    setDocumentType(value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleSort = (field: SortField) => {
    const newOrder = field === sortBy && sortOrder === 'asc' ? 'desc' : 'asc';
    setSortBy(field);
    setSortOrder(newOrder);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchDocuments(newPage, searchTerm, documentType, sortBy, sortOrder);
  };

  const handleRefresh = () => {
    fetchDocuments(pagination.page, searchTerm, documentType, sortBy, sortOrder);
  };

  const handleSelectAll = () => {
    if (selectedDocuments.size === filteredDocuments.length) {
      setSelectedDocuments(new Set());
    } else {
      setSelectedDocuments(new Set(filteredDocuments.map(doc => doc.id)));
    }
  };

  const handleSelectDocument = (id: string | number) => {
    const newSelected = new Set(selectedDocuments);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedDocuments(newSelected);
  };

  const handleDownload = async (doc: Document) => {
    try {
      // For direct MinIO URLs, we can download directly
      if (doc.url && doc.url.startsWith('http')) {
        const link = document.createElement('a');
        link.href = doc.url;
        link.download = doc.fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success(`Downloading ${doc.fileName}`);
      } else {
        // Fallback for other URL types
        window.open(doc.url, '_blank');
        toast.success(`Opening ${doc.fileName}`);
      }
    } catch (error) {
      console.error('Download error:', error);
      toast.error(`Failed to download ${doc.fileName}`);
    }
  };

  const handlePreview = (doc: Document) => {
    setPreviewDocument(doc);
  };

  const handleCombinePDFs = async () => {
    if (selectedDocuments.size === 0) {
      toast.error('Please select documents to combine');
      return;
    }

    // Get all selected document IDs
    const selectedIds = Array.from(selectedDocuments);
    
    // Debug: Log the selected document IDs
    console.log('Selected document IDs for combination:', selectedIds);
    
    // Allow combining any documents (PDFs, images, etc.)
    console.log(`Found ${selectedIds.length} documents selected for combination`);

    if (selectedIds.length === 0) {
      toast.error('Please select documents to combine');
      return;
    }

    if (selectedIds.length === 1) {
      toast.error('Please select multiple documents to combine');
      return;
    }

    setCombining(true);
    try {
      // Call the API to combine PDFs
      const response = await fetch('/api/documents/combine-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentIds: selectedIds,
          type: 'all'
        }),
      });

      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (parseError) {
          console.error('Failed to parse error response:', parseError);
          errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        }
        
        console.error('Combine PDF error response:', {
          status: response.status,
          statusText: response.statusText,
          errorData,
          url: response.url
        });
        
        const errorMessage = errorData?.message || errorData?.error || `HTTP ${response.status}: ${response.statusText}`;
        throw new Error(errorMessage);
      }

      // Get the PDF blob and download it
      const pdfBlob = await response.blob();
      const url = window.URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `combined_documents_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success(`Successfully combined ${selectedIds.length} documents`);
      setSelectedDocuments(new Set()); // Clear selection after successful combination
    } catch (error) {
      console.error('Error combining PDFs:', error);
      toast.error(`Failed to combine PDFs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setCombining(false);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-4 w-4" />;
    return sortOrder === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  // Helper function to check if a document is a PDF
  const isPDFDocument = (doc: Document): boolean => {
    return doc.mimeType === 'application/pdf' || 
           doc.mimeType === 'pdf' ||
           doc.documentType === 'PDF' ||
           doc.fileName.toLowerCase().endsWith('.pdf');
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return <FileImage className="h-5 w-5" />;
    if (mimeType === 'application/pdf' || mimeType === 'pdf') return <FileText className="h-5 w-5" />;
    return <FileText className="h-5 w-5" />;
  };

  // Use documents directly since API already filters by type
  const filteredDocuments = documents;

  return (
    <ProtectedRoute>
      <div className="w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
            <p className="text-muted-foreground">
              Manage and organize all company documents
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              {t('common.actions.settings') || 'Settings'}
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
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.equipment}</div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Document Controls</CardTitle>
            <CardDescription>
              Search, filter, and manage your documents
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by file number, door number, name, or document type..."
                    value={searchTerm}
                    onChange={(e) => handleSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={documentType} onValueChange={handleTypeChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Documents</SelectItem>
                  <SelectItem value="employee">Employee Documents</SelectItem>
                  <SelectItem value="equipment">Equipment Documents</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {selectedDocuments.size > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {selectedDocuments.size} document(s) selected
                </span>
                {(() => {
                  const selectedIds = Array.from(selectedDocuments);
                  const canCombine = selectedIds.length >= 2;
                  
                  return (
                    <>
                      <span className="text-xs text-muted-foreground">
                        ({selectedIds.length} document{selectedIds.length !== 1 ? 's' : ''} selected)
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCombinePDFs}
                        disabled={combining || !canCombine}
                        title={!canCombine ? 'Select at least 2 documents to combine' : ''}
                      >
                        <FileDown className="h-4 w-4 mr-2" />
                        {combining ? 'Combining...' : 'Combine Documents'}
                      </Button>
                    </>
                  );
                })()}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedDocuments(new Set())}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents Table */}
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>
              {loading ? 'Loading documents...' : `${filteredDocuments.length} of ${pagination.total} documents`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredDocuments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p>No documents found</p>
                {searchTerm && <p className="text-sm">Try adjusting your search terms</p>}
              </div>
            ) : (
              <div className="space-y-4">
                {/* Table Header */}
                <div className="grid grid-cols-12 gap-4 p-3 bg-muted rounded-lg font-medium text-sm">
                  <div className="col-span-1">
                    <Checkbox
                      checked={selectedDocuments.size === filteredDocuments.length && filteredDocuments.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </div>
                  <div className="col-span-3">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('fileName')}
                      className="h-auto p-0 font-medium"
                    >
                      File Name {getSortIcon('fileName')}
                    </Button>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('documentType')}
                      className="h-auto p-0 font-medium"
                    >
                      Type {getSortIcon('documentType')}
                    </Button>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('fileSize')}
                      className="h-auto p-0 font-medium"
                    >
                      Size {getSortIcon('fileSize')}
                    </Button>
                  </div>
                  <div className="col-span-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSort('createdAt')}
                      className="h-auto p-0 font-medium"
                    >
                      Date {getSortIcon('createdAt')}
                    </Button>
                  </div>
                  <div className="col-span-2">Actions</div>
                </div>

                {/* Documents List */}
                {filteredDocuments.map((document) => (
                  <div
                    key={document.id}
                    className="grid grid-cols-12 gap-4 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-1 flex items-center">
                      <Checkbox
                        checked={selectedDocuments.has(document.id)}
                        onCheckedChange={() => handleSelectDocument(document.id)}
                      />
                    </div>
                                         <div className="col-span-3 flex items-center space-x-2">
                       {getFileIcon(document.mimeType)}
                       <div className="min-w-0">
                         <p className="text-sm font-medium truncate" title={`${document.fileName} (${document.mimeType})`}>
                           {document.fileName}
                         </p>
                         <p className="text-xs text-muted-foreground truncate">
                           {document.type === 'employee' 
                             ? `${document.employeeName} (File #${document.employeeFileNumber})`
                             : `${document.equipmentName}${document.equipmentDoorNumber ? ` (Door #${document.equipmentDoorNumber})` : ''}`
                           }
                         </p>
                       </div>
                     </div>
                                         <div className="col-span-2 flex items-center">
                       <Badge 
                         variant={isPDFDocument(document) ? 'default' : 'secondary'}
                       >
                         {document.documentType}
                         {isPDFDocument(document) ? ' (PDF)' : ''}
                       </Badge>
                     </div>
                    <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                      {document.fileSizeFormatted || formatFileSize(document.fileSize)}
                    </div>
                    <div className="col-span-2 flex items-center text-sm text-muted-foreground">
                      {format(new Date(document.createdAt), 'MMM dd, yyyy')}
                    </div>
                    <div className="col-span-2 flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handlePreview(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <div className="text-sm text-muted-foreground">
                  Page {pagination.page} of {pagination.totalPages}
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
            )}
          </CardContent>
        </Card>

        {/* Document Preview Dialog */}
        <Dialog open={!!previewDocument} onOpenChange={() => setPreviewDocument(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {previewDocument && getFileIcon(previewDocument.mimeType)}
                {previewDocument?.fileName}
              </DialogTitle>
              <DialogDescription>
                {previewDocument?.type === 'employee' 
                  ? `Employee Document - ${previewDocument.employeeName} (File #${previewDocument.employeeFileNumber})`
                  : `Equipment Document - ${previewDocument?.equipmentName}${previewDocument?.equipmentDoorNumber ? ` (Door #${previewDocument.equipmentDoorNumber})` : ''}`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 overflow-auto max-h-[60vh]">
              {/* Document Metadata */}
              <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                <div>
                  <span className="font-medium">Type:</span> {previewDocument?.documentType}
                </div>
                <div>
                  <span className="font-medium">Size:</span> {previewDocument?.fileSizeFormatted || formatFileSize(previewDocument?.fileSize || 0)}
                </div>
                <div>
                  <span className="font-medium">Created:</span> {previewDocument?.createdAt ? format(new Date(previewDocument.createdAt), 'PPP') : 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">MIME Type:</span> {previewDocument?.mimeType}
                </div>
              </div>
              
              {previewDocument?.description && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <span className="font-medium">Description:</span>
                  <p className="mt-1 text-sm text-muted-foreground">{previewDocument.description}</p>
                </div>
              )}
              
              {/* Document Preview */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted p-2 text-sm font-medium">
                  Document Preview
                </div>
                <div className="p-4 bg-white min-h-[400px] flex items-center justify-center">
                  {previewDocument?.url ? (
                    <div className="w-full h-full">
                      {previewDocument.mimeType?.startsWith('image/') ? (
                        <img 
                          src={previewDocument.url} 
                          alt={previewDocument.fileName}
                          className="max-w-full max-h-[400px] object-contain mx-auto"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : previewDocument.mimeType === 'application/pdf' ? (
                        <iframe 
                          src={previewDocument.url} 
                          className="w-full h-[400px] border-0"
                          title={previewDocument.fileName}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : (
                        <div className="text-center text-muted-foreground">
                          <FileText className="h-16 w-16 mx-auto mb-4" />
                          <p className="text-lg font-medium">Preview not available</p>
                          <p className="text-sm">This file type cannot be previewed in the browser</p>
                          <p className="text-xs mt-2">MIME Type: {previewDocument.mimeType}</p>
                        </div>
                      )}
                      {/* Fallback for failed previews */}
                      <div className="hidden text-center text-muted-foreground">
                        <FileText className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-lg font-medium">Preview failed to load</p>
                        <p className="text-sm">The document could not be displayed</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => window.open(previewDocument.url, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Open in New Tab
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4" />
                      <p className="text-lg font-medium">No preview available</p>
                      <p className="text-sm">Document URL not found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex gap-2">
              <Button variant="outline" onClick={() => setPreviewDocument(null)}>
                Close
              </Button>
              <Button onClick={() => previewDocument && handleDownload(previewDocument)}>
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
              <Button 
                variant="outline" 
                onClick={() => previewDocument && window.open(previewDocument.url, '_blank')}
              >
                <Eye className="h-4 w-4 mr-2" />
                Open in New Tab
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
