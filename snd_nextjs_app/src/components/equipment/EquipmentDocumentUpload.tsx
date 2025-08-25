'use client';

import DocumentManager, { type DocumentItem } from '@/components/shared/DocumentManager';
import ApiService from '@/lib/api-service';
import { useCallback, useState, useEffect } from 'react';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';
import { toast } from 'sonner';

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
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadDocuments = useCallback(async () => {
    try {
      setIsLoading(true);
      // Fetch documents from Supabase storage
      const response = await fetch('/api/supabase/list-files', {
        method: 'POST',
        body: JSON.stringify({
          bucket: 'equipment-documents',
          path: `equipment-${equipmentId}`
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success && result.files) {
          // Convert Supabase files to DocumentItem format
          const docs = result.files.map((file: any) => {
            // The file path in Supabase is just the path, not bucket/path
            // So if we uploaded to 'equipment-123/file.png', the path is 'equipment-123/file.png'
            const filePath = `equipment-${equipmentId}/${file.name}`;
            
            // IMPORTANT: Use the URL returned from the upload, not manually constructed
            // The upload API returns the correct public URL
            // For now, let's use the SupabaseStorageService to get the correct URL
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://supabasekong.snd-ksa.online';
            const publicUrl = `${supabaseUrl}/storage/v1/object/public/equipment-documents/${filePath}`;
            
            console.log('Generated URL for file:', file.name, 'Path:', filePath, 'URL:', publicUrl);
            
            return {
              id: file.id || file.name, // Use name as ID if no ID
              name: file.name,
              file_name: file.name,
              file_type: file.mime_type || 'application/octet-stream',
              size: file.size || 0,
              url: publicUrl,
              created_at: file.created_at || new Date().toISOString()
            };
          }) as DocumentItem[];
          
          setDocuments(docs);
          return docs;
        }
      }
      setDocuments([]);
      return [];
    } catch (error) {
      console.error('Error loading documents:', error);
      setDocuments([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [equipmentId]);

  // Load documents when component mounts
  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const uploadDocument = useCallback(
    async (file: File, extra?: Record<string, any>) => {
      try {
        // Use Supabase upload instead of old API
        const response = await fetch('/api/upload-supabase', {
          method: 'POST',
          body: JSON.stringify({
            file: {
              name: file.name,
              size: file.size,
              type: file.type,
              content: await fileToBase64(file)
            },
            bucket: 'equipment-documents',
            path: `equipment-${equipmentId}`,
            document_name: (extra?.document_name as string) || file.name
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh the documents list
            await loadDocuments();
            // Store the document info in your database if needed
            // For now, just call the callback
            onDocumentsUpdated?.();
          } else {
            throw new Error(result.message || 'Upload failed');
          }
        } else {
          throw new Error('Upload failed');
        }
      } catch (error) {
        console.error('Upload error:', error);
        throw error;
      }
    },
    [equipmentId, onDocumentsUpdated]
  );

  // Helper function to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/jpeg;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = error => reject(error);
    });
  };

  const deleteDocument = useCallback(
    async (id: number) => {
      try {
        // Find the document to get its filename
        const documents = await loadDocuments();
        const document = documents.find(doc => doc.id === id);
        
        if (!document) {
          throw new Error('Document not found');
        }

        // Extract the file path from the Supabase URL
        // URL format: https://domain.com/storage/v1/object/public/bucket-name/path/to/file
        let filePath = '';
        
        if (document.url.startsWith('http')) {
          // Parse the URL to extract the file path
          const urlParts = document.url.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const bucketAndPath = urlParts[1];
            const pathParts = bucketAndPath.split('/');
            if (pathParts.length > 1) {
              // Remove the bucket name from the path
              const bucketName = pathParts[0];
              const filePathParts = pathParts.slice(1);
              filePath = filePathParts.join('/');
            }
          }
        }
        
        // Fallback: construct path from equipment ID and filename
        if (!filePath) {
          filePath = `equipment-${equipmentId}/${document.file_name}`;
        }

        console.log('Deleting file from Supabase:', {
          bucket: 'equipment-documents',
          path: filePath,
          document: document
        });

        // Delete document from Supabase storage
        const response = await fetch('/api/supabase/delete-file', {
          method: 'POST',
          body: JSON.stringify({
            bucket: 'equipment-documents',
            path: filePath
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            // Refresh the documents list
            await loadDocuments();
            onDocumentsUpdated?.();
            toast.success('Document deleted successfully');
          } else {
            throw new Error(result.message || 'Delete failed');
          }
        } else {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Delete failed');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('Failed to delete document: ' + (error instanceof Error ? error.message : 'Unknown error'));
        throw error;
      }
    },
    [equipmentId, onDocumentsUpdated, loadDocuments]
  );

  return (
    <>
      {!loadDocuments || !uploadDocument || !deleteDocument ? (
        <div className="text-center py-8 text-gray-500">
          <p>Loading document manager...</p>
        </div>
      ) : (
        <DocumentManager
          title="Documents"
          description="Upload and manage equipment documents, manuals, and certificates"
          loadDocuments={loadDocuments}
          uploadDocument={uploadDocument}
          deleteDocument={deleteDocument}
          showNameInput
          nameInputLabel="Document Name (Optional)"
        />
      )}
    </>
  );
}
