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
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [documentName, setDocumentName] = useState("");
  const [previewImage, setPreviewImage] = useState<EquipmentDocument | null>(null);

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
    if (acceptedFiles.length === 0) return;

    setUploading(true);
    try {
      for (const file of acceptedFiles) {
        const name = documentName || file.name;
        await ApiService.uploadEquipmentDocument(equipmentId, file, name);
      }
      
      toast.success('Documents uploaded successfully');
      setDocumentName("");
      await loadDocuments();
      onDocumentsUpdated?.();
    } catch (error) {
      toast.error('Failed to upload documents');
    } finally {
      setUploading(false);
    }
  }, [equipmentId, documentName, onDocumentsUpdated]);

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

  const handleDeleteDocument = async (documentId: number) => {
    setDeleting(documentId);
    try {
      await ApiService.deleteEquipmentDocument(equipmentId, documentId);
      toast.success('Document deleted successfully');
      await loadDocuments();
      onDocumentsUpdated?.();
    } catch (error) {
      toast.error('Failed to delete document');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = (doc: EquipmentDocument) => {
    const link = document.createElement('a');
    link.href = doc.url;
    link.download = doc.file_name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImagePreview = (doc: EquipmentDocument) => {
    if (isImageFile(doc.file_type)) {
      setPreviewImage(doc);
    }
  };

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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Documents</span>
          </CardTitle>
          <CardDescription>
            Upload and manage equipment documents, manuals, and certificates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Label htmlFor="document-name" className="text-sm font-medium">
                Document Name (Optional)
              </Label>
              <Input
                id="document-name"
                placeholder="Enter custom document name"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                className="max-w-xs"
              />
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <div className="space-y-2">
                {uploading ? (
                  <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Uploading documents...</span>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">
                        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        or click to browse files
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Supports PDF, Word, Excel, Images (max 10MB)
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Documents List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium">Uploaded Documents</h4>
              {documents.length > 0 && (
                <Badge variant="secondary">{documents.length} document(s)</Badge>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Loading documents...</span>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No documents uploaded yet</p>
                <p className="text-xs">Upload documents to get started</p>
              </div>
                         ) : (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {documents.map((document) => (
                   <div
                     key={document.id}
                     className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                   >
                     <div className="flex flex-col items-center text-center mb-3">
                       {isImageFile(document.file_type) ? (
                         <div className="relative group">
                           <img
                             src={document.url}
                             alt={document.name}
                             className="w-32 h-32 object-cover rounded border shadow-sm hover:scale-105 transition-transform cursor-pointer"
                             onClick={() => handleImagePreview(document)}
                             onError={(e) => {
                               // Fallback to icon if image fails to load
                               const target = e.target as HTMLImageElement;
                               target.style.display = 'none';
                               target.nextElementSibling?.classList.remove('hidden');
                             }}
                             title="Click to preview image"
                           />
                           <span className="text-lg hidden">{getFileIcon(document.file_type)}</span>
                           <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors rounded border pointer-events-none"></div>
                         </div>
                       ) : (
                         <div className="w-32 h-32 flex items-center justify-center bg-muted rounded border">
                           <span className="text-4xl">{getFileIcon(document.file_type)}</span>
                         </div>
                                                )}
                         <div className="w-full mt-3">
                           <p className="text-sm font-medium truncate mb-1">{document.name}</p>
                           <div className="flex flex-col items-center space-y-1 text-xs text-muted-foreground">
                             <span>{formatFileSize(document.size)}</span>
                             <span>{new Date(document.created_at).toLocaleDateString()}</span>
                           </div>
                         </div>
                     </div>

                     <div className="flex items-center justify-center space-x-1">
                       {isImageFile(document.file_type) && (
                         <Button
                           variant="ghost"
                           size="sm"
                           onClick={() => handleImagePreview(document)}
                           className="h-8 w-8 p-0"
                         >
                           <Eye className="h-4 w-4" />
                         </Button>
                       )}
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDownload(document)}
                         className="h-8 w-8 p-0"
                       >
                         <Download className="h-4 w-4" />
                       </Button>
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => handleDeleteDocument(document.id)}
                         disabled={deleting === document.id}
                         className="h-8 w-8 p-0 text-destructive hover:text-destructive"
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
          </div>
        </CardContent>
      </Card>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{previewImage.name}</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setPreviewImage(null)}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center">
              <img
                src={previewImage.url}
                alt={previewImage.name}
                className="max-w-full max-h-[70vh] object-contain rounded"
              />
            </div>
            <div className="mt-4 text-sm text-muted-foreground text-center">
              <p>Size: {formatFileSize(previewImage.size)}</p>
              <p>Uploaded: {new Date(previewImage.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
