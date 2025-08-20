'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Loader2, Shield } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';

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

// Default document types (fallback if API fails)
const DEFAULT_DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 1,
    key: 'commercial_registration',
    label: 'Commercial Registration',
    description: 'Required by Saudi law for all commercial entities',
    required: true,
    category: 'legal',
    isActive: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 2,
    key: 'tax_registration',
    label: 'Tax Registration',
    description: 'Required by Saudi law for tax compliance',
    required: true,
    category: 'financial',
    isActive: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export default function CompanyDocumentManager({ 
  companyId, 
  companyName,
  onDocumentsChange 
}: CompanyDocumentManagerProps) {
  const [documents, setDocuments] = useState<CompanyDocument[]>([]);
  const [documentTypes, setDocumentTypes] = useState<DocumentType[]>(DEFAULT_DOCUMENT_TYPES);
  const [loading, setLoading] = useState(false);

  const fetchDocumentTypes = useCallback(async () => {
    try {
      const response = await fetch('/api/company-document-types');
      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          setDocumentTypes(result.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch document types:', error);
      // Use default types if API fails
      setDocumentTypes(DEFAULT_DOCUMENT_TYPES);
    }
  }, []);

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
    fetchDocumentTypes();
    refresh();
  }, [fetchDocumentTypes, refresh]);





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
             {documentTypes.map((docType) => (
               <div key={docType.key} className="text-center p-3 border rounded-lg">
                 <div className="text-sm font-medium text-gray-600">{docType.label}</div>
                 <div className="mt-2">
                   <Badge variant="outline" className="bg-gray-100 text-gray-800">
                     {docType.required ? 'Required' : 'Optional'}
                   </Badge>
                 </div>
                 {docType.required && (
                   <div className="text-xs text-red-600 mt-1">Required by Saudi Law</div>
                 )}
               </div>
             ))}
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
                 View document status and manage document types for {companyName}
               </CardDescription>
             </div>
             <div className="flex gap-2">
               <Link href="/modules/company-management/document-types">
                 <Button variant="outline" size="sm">
                   <Shield className="h-4 w-4 mr-2" />
                   Manage Document Types
                 </Button>
               </Link>
             </div>
           </div>
         </CardHeader>
         <CardContent>
           <div className="text-center py-8 text-gray-500">
             <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
             <p>Document management has been moved to the centralized system</p>
             <p className="text-sm">Use "Manage Document Types" to upload and manage documents</p>
           </div>
         </CardContent>
       </Card>

    </div>
  );
}
