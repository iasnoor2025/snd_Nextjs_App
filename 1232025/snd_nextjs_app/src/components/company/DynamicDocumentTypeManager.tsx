'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Shield,
  Loader2,
  FileText,
  ArrowLeft,
  Upload,
  Download,
  Eye
} from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface DocumentType {
  id: number;
  key: string;
  label: string;
  description: string;
  required: boolean;
  category: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface DocumentFile {
  id: number;
  documentTypeId: number;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  expiryDate: string | null;
  uploadedAt: string;
  uploadedBy: string;
}

interface DocumentTypeForm {
  key: string;
  label: string;
  description: string;
  required: boolean;
  category: string;
  sortOrder: number;
}

const CATEGORIES = [
  'general',
  'legal',
  'financial',
  'healthcare',
  'construction',
  'transportation',
  'technology',
  'education',
  'tourism',
  'mining',
  'energy',
  'real_estate',
  'consulting',
  'media',
  'security',
  'maintenance',
  'logistics',
  'research',
  'innovation'
];

export default function DynamicDocumentTypeManager({ companyId }: { companyId?: number }) {
  const params = useParams();
  const locale = params?.locale as string || 'en';
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);
  const [documentFiles, setDocumentFiles] = useState<DocumentFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewFile, setPreviewFile] = useState<DocumentFile | null>(null);
  const [previewZoom, setPreviewZoom] = useState<number>(1);
  const [showForm, setShowForm] = useState(false);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | null>(null);
  const [uploadForm, setUploadForm] = useState({
    expiryDate: '',
    file: null as File | null,
  });
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState<DocumentTypeForm>({
    key: '',
    label: '',
    description: '',
    required: false,
    category: 'general',
    sortOrder: 0,
  });

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filePendingDelete, setFilePendingDelete] = useState<DocumentFile | null>(null);
  const [deletingFile, setDeletingFile] = useState(false);

  useEffect(() => {
    fetchDocumentTypes();
    fetchDocumentFiles();
  }, []);

  const fetchDocumentTypes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/company-document-types', { cache: 'no-store' });
      
      // Check if response is ok
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('API error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText,
        });
        
        let errorMessage;
        try {
          const errorJson = JSON.parse(errorText);
          errorMessage = errorJson.error || errorJson.message || `HTTP error! status: ${response.status}`;
        } catch {
          errorMessage = errorText || `HTTP error! status: ${response.status}`;
        }
        
        console.error('API error message:', errorMessage);
        toast.error(`Failed to load document types: ${errorMessage}`);
        setDocumentTypes([]);
        return;
      }
      
      // Check if response has content and is JSON
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (!text) {
        console.error('Empty response from server');
        toast.error('Empty response from server');
        setDocumentTypes([]);
        return;
      }
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response from server:', text.slice(0, 200));
        toast.error('Server returned invalid response');
        setDocumentTypes([]);
        return;
      }
      
      // Try to parse JSON
      let result;
      try {
        result = JSON.parse(text);
      } catch (parseError) {
        console.error('Failed to parse response:', parseError);
        console.error('Response text:', text);
        toast.error('Invalid response from server');
        setDocumentTypes([]);
        return;
      }
      
      if (result.success) {
        setDocumentTypes(result.data || []);
        if (!result.data || result.data.length === 0) {
          console.log('No document types found in database');
        }
      } else {
        toast.error(result.message || 'Failed to fetch document types');
        setDocumentTypes([]);
      }
    } catch (error) {
      console.error('Error fetching document types:', error);
      toast.error('Failed to fetch document types: ' + (error as Error).message);
      setDocumentTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentFiles = async () => {
    try {
      const url = companyId
        ? `/api/company-document-types/files?companyId=${companyId}`
        : '/api/company-document-types/files';
      const response = await fetch(url, { cache: 'no-store' });
      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error('Failed to fetch document files:', errText);
        return;
      }
      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (!contentType.includes('application/json')) {
        console.error('Non-JSON response for files:', text.slice(0, 200));
        return;
      }
      const result = JSON.parse(text);
      if (result.success) {
        setDocumentFiles(result.data);
      }
    } catch (error) {
      console.error('Error fetching document files:', error);
    }
  };

  const detectMimeFromName = (name: string): string => {
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return `image/${ext === 'jpg' ? 'jpeg' : ext}`;
    if (ext === 'pdf') return 'application/pdf';
    return '';
  };

  const handleViewFile = (file: DocumentFile) => {
    if (!file.filePath) return;
    setPreviewFile({ ...file, mimeType: file.mimeType || detectMimeFromName(file.fileName) });
    setPreviewZoom(1);
    setPreviewOpen(true);
  };

  const handleDownloadFile = (file: DocumentFile) => {
    if (!file.filePath) return;
    const link = document.createElement('a');
    link.href = file.filePath;
    link.download = file.fileName || 'document';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data || '');
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleUpload = async () => {
    if (!uploadForm.file || !selectedDocumentType) {
      toast.error('Please select a file and document type');
      return;
    }

    try {
      setUploading(true);
      
      // Use Supabase upload instead of old API
      const response = await fetch('/api/upload-supabase', {
        method: 'POST',
        body: JSON.stringify({
          file: {
            name: uploadForm.file.name,
            size: uploadForm.file.size,
            type: uploadForm.file.type,
            content: await fileToBase64(uploadForm.file)
          },
          bucket: 'company-documents',
          path: companyId ? `company-${companyId}-${selectedDocumentType.id}` : `company-${selectedDocumentType.id}`,
          documentTypeId: selectedDocumentType.id,
          expiryDate: uploadForm.expiryDate
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errText = await response.text().catch(() => 'Unknown error');
        console.error('Upload failed:', errText);
        try {
          const errJson = JSON.parse(errText);
          toast.error(errJson.message || 'Failed to upload document');
        } catch {
          toast.error(errText || 'Failed to upload document');
        }
        return;
      }

      const contentType = response.headers.get('content-type') || '';
      const text = await response.text();
      if (!contentType.includes('application/json')) {
        console.error('Upload non-JSON response:', text.slice(0, 200));
        toast.error('Upload returned invalid response');
        return;
      }
      const result = JSON.parse(text);

      if (result.success) {
        toast.success('Document uploaded successfully');
        setShowUploadForm(false);
        setUploadForm({ expiryDate: '', file: null });
        setSelectedDocumentType(null);
        fetchDocumentFiles();
      } else {
        toast.error(result.message || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload document');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = (fileId: number) => {
    const file = documentFiles.find(f => f.id === fileId) || null;
    setFilePendingDelete(file);
    setDeleteDialogOpen(!!file);
  };

  const performDeleteFile = async () => {
    if (!filePendingDelete) return;
    try {
      setDeletingFile(true);
      const response = await fetch(filePendingDelete.filePath, { method: 'DELETE' });
      const contentType = response.headers.get('content-type') || '';
      let ok = response.ok;
      let message = '';
      if (contentType.includes('application/json')) {
        try {
          const json = await response.json();
          ok = ok && !!json.success;
          message = json.message || '';
        } catch { /* noop */ }
      }
      if (ok) {
        toast.success(message || 'File deleted successfully');
        setDeleteDialogOpen(false);
        setFilePendingDelete(null);
        fetchDocumentFiles();
      } else {
        toast.error(message || 'Failed to delete file');
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      toast.error('Failed to delete file');
    } finally {
      setDeletingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.key.trim() || !formData.label.trim()) {
      toast.error('Key and label are required');
      return;
    }

    try {
      const response = await fetch('/api/company-document-types', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Document type created successfully');
        setShowForm(false);
        resetForm();
        fetchDocumentTypes();
      } else {
        toast.error(result.message || 'Failed to create document type');
      }
    } catch (error) {
      console.error('Error creating document type:', error);
      toast.error('Failed to create document type');
    }
  };

  const resetForm = () => {
    setFormData({
      key: '',
      label: '',
      description: '',
      required: false,
      category: 'general',
      sortOrder: 0,
    });
    setEditingId(null);
  };

  const handleEdit = (docType: DocumentType) => {
    setFormData({
      key: docType.key,
      label: docType.label,
      description: docType.description,
      required: docType.required,
      category: docType.category,
      sortOrder: docType.sortOrder,
    });
    setEditingId(docType.id);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this document type?')) return;

    try {
      const response = await fetch(`/api/company-document-types/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Document type deleted successfully');
        fetchDocumentTypes();
      } else {
        toast.error(result.message || 'Failed to delete document type');
      }
    } catch (error) {
      console.error('Error deleting document type:', error);
      toast.error('Failed to delete document type');
    }
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'general': 'bg-gray-100 text-gray-800',
      'legal': 'bg-blue-100 text-blue-800',
      'financial': 'bg-green-100 text-green-800',
      'healthcare': 'bg-red-100 text-red-800',
      'construction': 'bg-orange-100 text-orange-800',
      'transportation': 'bg-purple-100 text-purple-800',
      'technology': 'bg-indigo-100 text-indigo-800',
      'education': 'bg-pink-100 text-pink-800',
      'tourism': 'bg-yellow-100 text-yellow-800',
      'mining': 'bg-amber-100 text-amber-800',
      'energy': 'bg-cyan-100 text-cyan-800',
      'real_estate': 'bg-emerald-100 text-emerald-800',
      'consulting': 'bg-violet-100 text-violet-800',
      'media': 'bg-rose-100 text-rose-800',
      'security': 'bg-slate-100 text-slate-800',
      'maintenance': 'bg-zinc-100 text-zinc-800',
      'logistics': 'bg-stone-100 text-stone-800',
      'research': 'bg-neutral-100 text-neutral-800',
      'innovation': 'bg-fuchsia-100 text-fuchsia-800',
    };
    
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading document types...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">Dynamic Document Types</h2>
            <p className="text-muted-foreground">
              Manage Saudi law document types dynamically
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href={`/${locale}/company-management`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Button 
            variant="outline" 
            onClick={() => setShowUploadForm(true)}
            disabled={documentTypes.length === 0}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
          <Button onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Document Type
          </Button>
        </div>
      </div>

             {/* Document Types Grid - Futuristic Design */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
         {documentTypes.map((docType) => {
           const typeFiles = documentFiles.filter(file => file.documentTypeId === docType.id);
           return (
             <Card key={docType.id} className="hover:shadow-xl transition-all duration-300 border border-gray-200/50 bg-gradient-to-br from-white via-gray-50/50 to-white dark:from-gray-900 dark:via-gray-800/50 dark:to-gray-900 backdrop-blur-sm overflow-hidden group">
               <CardHeader className="pb-3">
                 <div className="flex items-start justify-between relative">
                   <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-2xl -z-10 group-hover:from-blue-500/20 group-hover:to-purple-500/20 transition-all" />
                   <div className="flex-1">
                     <CardTitle className="text-lg flex items-center gap-2 font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                       <div className="p-1.5 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-sm border border-blue-300/30">
                         <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                       </div>
                       {docType.label}
                     </CardTitle>
                     <div className="flex items-center gap-2 mt-3">
                       <Badge className={`${getCategoryColor(docType.category)} border border-gray-200/50 shadow-sm font-medium`}>
                         {docType.category}
                       </Badge>
                       {docType.required && (
                         <Badge variant="destructive" className="text-xs shadow-sm border border-red-300/30 font-semibold">
                           Required
                         </Badge>
                       )}
                     </div>
                   </div>
                   <div className="flex items-center gap-1.5 ml-2">
                     <Button
                       variant="ghost"
                       size="sm"
                       className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-lg"
                       onClick={() => {
                         setSelectedDocumentType(docType);
                         setShowUploadForm(true);
                       }}
                       title="Upload document for this type"
                     >
                       <Upload className="h-4 w-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="hover:bg-purple-500/10 hover:text-purple-600 dark:hover:text-purple-400 transition-all rounded-lg"
                       onClick={() => handleEdit(docType)}
                     >
                       <Edit className="h-4 w-4" />
                     </Button>
                     <Button
                       variant="ghost"
                       size="sm"
                       className="hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-lg"
                       onClick={() => handleDelete(docType.id)}
                     >
                       <Trash2 className="h-4 w-4" />
                     </Button>
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <p className="text-sm text-muted-foreground mb-4 leading-relaxed italic">
                   {docType.description || 'No description provided'}
                 </p>
                 
                 {/* Uploaded Files Section */}
                 {typeFiles.length > 0 && (
                   <div className="mb-4 rounded-lg bg-gradient-to-br from-gray-50/80 to-white dark:from-gray-800/50 dark:to-gray-900/50 border border-gray-200/50 p-3 backdrop-blur-sm">
                     <div className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                       Uploaded Files ({typeFiles.length})
                     </div>
                     <div className="space-y-2">
                       {typeFiles.map((file) => (
                          <div key={file.id} className="flex items-center justify-between p-2.5 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-lg border border-gray-200/50 hover:border-blue-300/50 dark:hover:border-blue-600/30 transition-all group/file shadow-sm hover:shadow-md">
                            <div className="flex-1 min-w-0">
                              <div className="font-medium truncate text-gray-800 dark:text-gray-200 text-xs group-hover/file:text-blue-600 dark:group-hover/file:text-blue-400 transition-colors">
                                {file.fileName}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-[10px] mt-0.5 flex items-center gap-2">
                                {(file.fileSize / 1024 / 1024).toFixed(2)} MB • {new Date(file.uploadedAt).toLocaleDateString()}
                                {file.expiryDate && (
                                  <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-medium shadow-sm ${
                                    new Date(file.expiryDate) < new Date() 
                                      ? 'bg-red-100 text-red-800 border border-red-200/50' 
                                      : new Date(file.expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                                      ? 'bg-yellow-100 text-yellow-800 border border-yellow-200/50'
                                      : 'bg-green-100 text-green-800 border border-green-200/50'
                                  }`}>
                                    Expires: {new Date(file.expiryDate).toLocaleDateString()}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center gap-1 ml-2">
                              <Button variant="ghost" size="sm" title="View file" onClick={() => handleViewFile(file)} className="hover:bg-blue-500/10 hover:text-blue-600 dark:hover:text-blue-400 transition-all rounded-md">
                                <Eye className="h-3.5 w-3.5" />
                              </Button>
                              <Button variant="ghost" size="sm" title="Download file" onClick={() => handleDownloadFile(file)} className="hover:bg-green-500/10 hover:text-green-600 dark:hover:text-green-400 transition-all rounded-md">
                                <Download className="h-3.5 w-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400 transition-all rounded-md"
                                onClick={() => handleDeleteFile(file.id)}
                                title="Delete file"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                     </div>
                   </div>
                 )}
                 
                 <div className="text-xs text-muted-foreground pt-3 border-t border-gray-200/50 dark:border-gray-700/50 space-y-1">
                   <div>Key: <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded font-mono text-[10px] border border-gray-200/50">{docType.key}</code></div>
                   <div>Order: {docType.sortOrder}</div>
                   <div>Created: {new Date(docType.createdAt).toLocaleDateString()}</div>
                 </div>
               </CardContent>
             </Card>
           );
         })}
       </div>

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">
                {editingId ? 'Edit Document Type' : 'Add New Document Type'}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowForm(false);
                  resetForm();
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="key">Document Key *</Label>
                <Input
                  id="key"
                  value={formData.key}
                  onChange={(e) => setFormData(prev => ({ ...prev, key: e.target.value }))}
                  placeholder="e.g., commercial_registration"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Unique identifier (lowercase, underscores)
                </p>
              </div>

              <div>
                <Label htmlFor="label">Display Label *</Label>
                <Input
                  id="label"
                  value={formData.label}
                  onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Commercial Registration"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Brief description of this document type"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="sortOrder">Sort Order</Label>
                <Input
                  id="sortOrder"
                  type="number"
                  value={formData.sortOrder}
                  onChange={(e) => setFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                  placeholder="0"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="required"
                  checked={formData.required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, required: checked }))}
                />
                <Label htmlFor="required">Required by Saudi Law</Label>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewOpen && previewFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={(e) => e.key === 'Escape' && setPreviewOpen(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPreviewOpen(false)} />
          <div className="relative w-[95vw] md:w-[85vw] lg:w-[70vw] h-[85vh] rounded-2xl border border-white/20 bg-white/10 dark:bg-black/20 backdrop-blur-xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-white/30 dark:bg-black/30 backdrop-blur-md border-b border-white/20">
              <div className="min-w-0">
                <div className="text-sm font-semibold truncate text-white">{previewFile.fileName}</div>
                <div className="text-[11px] text-white/80">{(previewFile.fileSize / 1024 / 1024).toFixed(2)} MB</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom((z) => Math.min(3, z + 0.1))} className="bg-white/60 hover:bg-white/80">+</Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom((z) => Math.max(0.25, z - 0.1))} className="bg-white/60 hover:bg-white/80">-</Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewZoom(1)} className="bg-white/60 hover:bg-white/80">100%</Button>
                <Button variant="outline" size="sm" onClick={() => handleDownloadFile(previewFile)} className="bg-white/60 hover:bg-white/80" title="Download">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreviewOpen(false)} className="bg-white/60 hover:bg-white/80">Close</Button>
              </div>
            </div>
            <div className="w-full h-[calc(85vh-56px)] bg-black/10 dark:bg-black/50 flex items-center justify-center overflow-auto">
              {previewFile.mimeType?.startsWith('image/') ? (
                <img src={previewFile.filePath} alt={previewFile.fileName} style={{ transform: `scale(${previewZoom})`, transformOrigin: 'center center' }} className="max-w-none select-none" />
              ) : (
                <iframe src={previewFile.filePath} className="w-full h-full bg-white" />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The file will be permanently removed from storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deletingFile}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performDeleteFile} disabled={deletingFile}>
              {deletingFile ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

             {/* Upload Form Modal */}
       {showUploadForm && (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
           <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
             <div className="flex items-center justify-between mb-4">
               <h3 className="text-lg font-semibold">
                 Upload Document
                 {selectedDocumentType && ` - ${selectedDocumentType.label}`}
               </h3>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => {
                   setShowUploadForm(false);
                   setUploadForm({ expiryDate: '', file: null });
                   setSelectedDocumentType(null);
                 }}
               >
                 <X className="h-4 w-4" />
               </Button>
             </div>

             <div className="space-y-4">
               {!selectedDocumentType && (
                 <div>
                   <Label htmlFor="documentType">Document Type *</Label>
                   <Select
                     value=""
                     onValueChange={(value) => {
                       const docType = documentTypes.find(dt => dt.id.toString() === value);
                       setSelectedDocumentType(docType || null);
                     }}
                   >
                     <SelectTrigger>
                       <SelectValue placeholder="Select document type" />
                     </SelectTrigger>
                     <SelectContent>
                       {documentTypes.map((docType) => (
                         <SelectItem key={docType.id} value={docType.id.toString()}>
                           {docType.label} {docType.required ? '(Required)' : ''}
                         </SelectItem>
                       ))}
                     </SelectContent>
                   </Select>
                 </div>
               )}

                               <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={uploadForm.expiryDate}
                    onChange={(e) => setUploadForm(prev => ({ ...prev, expiryDate: e.target.value }))}
                    placeholder="Select expiry date"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    When this document expires (optional)
                  </p>
                </div>

               <div>
                 <Label>File Upload *</Label>
                 <div className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors border-gray-300 hover:border-gray-400">
                   <input
                     type="file"
                     onChange={(e) => setUploadForm(prev => ({ ...prev, file: e.target.files?.[0] || null }))}
                     accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                     className="hidden"
                     id="fileUpload"
                   />
                   <label htmlFor="fileUpload" className="cursor-pointer">
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
                         <p className="text-gray-600">Click to select a file</p>
                         <p className="text-sm text-gray-500 mt-1">
                           PDF, DOC, DOCX, PNG, JPG up to 10MB
                         </p>
                       </div>
                     )}
                   </label>
                 </div>
               </div>

               <div className="flex gap-2 pt-4">
                 <Button
                   type="button"
                   variant="outline"
                   onClick={() => {
                     setShowUploadForm(false);
                     setUploadForm({ expiryDate: '', file: null });
                     setSelectedDocumentType(null);
                   }}
                   className="flex-1"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={handleUpload}
                   disabled={uploading || !uploadForm.file || !selectedDocumentType}
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

       {/* Empty State */}
       {documentTypes.length === 0 && !loading && (
         <Card>
           <CardContent className="text-center py-12">
             <FileText className="h-16 w-16 mx-auto mb-4 text-gray-300" />
             <h3 className="text-lg font-semibold mb-2">No Document Types Yet</h3>
             <p className="text-muted-foreground mb-4">
               Start by adding your first Saudi law document type
             </p>
             <Button onClick={() => setShowForm(true)}>
               <Plus className="h-4 w-4 mr-2" />
               Add First Document Type
             </Button>
           </CardContent>
         </Card>
       )}
     </div>
   );
 }
