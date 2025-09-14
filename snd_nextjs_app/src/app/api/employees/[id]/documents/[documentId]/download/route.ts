import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { db } from '@/lib/drizzle';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ensureHttps } from '@/lib/utils/url-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; documentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: employeeId, documentId } = await params;
    
    // Get document record from database
    const documentResult = await db
      .select()
      .from(employeeDocuments)
      .where(eq(employeeDocuments.id, parseInt(documentId)))
      .limit(1);

    if (!documentResult[0]) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    const documentRecord = documentResult[0];

    // Get employee information from the document's employee_id (not URL parameter)
    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, documentRecord.employeeId))
      .limit(1);

    if (!employeeResult[0]) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 });
    }

    const employee = employeeResult[0];
    const fileNumber = employee.fileNumber || String(documentRecord.employeeId);
    
    // Debug logging
    console.log('Download debug:', {
      documentId: documentRecord.id,
      documentEmployeeId: documentRecord.employeeId,
      urlEmployeeId: employeeId,
      employeeFileNumber: employee.fileNumber,
      finalFileNumber: fileNumber,
      documentType: documentRecord.documentType,
      fileName: documentRecord.fileName
    });

    // Check if user has permission to access this document
    if (session.user.role !== 'SUPER_ADMIN' && 
        session.user.role !== 'ADMIN' && 
        session.user.role !== 'MANAGER' &&
        session.user.role !== 'SUPERVISOR' &&
        session.user.role !== 'OPERATOR' &&
        session.user.role !== 'EMPLOYEE') {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // If the document is stored in Supabase (URL starts with http/https)
    if (documentRecord.filePath && documentRecord.filePath.startsWith('http')) {
      // For Supabase URLs, redirect to the file or return the URL
      const url = new URL(request.url);
      const isPreview = !url.searchParams.has('download');
      
      if (isPreview) {
        // For preview, redirect to the HTTPS URL
        return NextResponse.redirect(ensureHttps(documentRecord.filePath));
      } else {
        // Generate filename with employee file number
        const fileExtension = documentRecord.fileName?.split('.').pop() || 'pdf';
        const documentType = documentRecord.documentType || 'document';
        const formattedDocumentType = documentType
          .replace(/_/g, '-')
          .replace(/\b\w/g, l => l.toUpperCase());
        
        const downloadFileName = `Employee-${fileNumber}-${formattedDocumentType}.${fileExtension}`;
        
        // For download, return the HTTPS URL for the client to handle
        return NextResponse.json({
          success: true,
          downloadUrl: ensureHttps(documentRecord.filePath),
          fileName: downloadFileName,
          originalFileName: documentRecord.fileName,
          mimeType: documentRecord.mimeType,
        });
      }
    }

    // Fallback for any remaining local files (shouldn't happen with Supabase)
    return NextResponse.json({ 
      error: 'Document not accessible',
      message: 'Document is not stored in the expected location'
    }, { status: 404 });

  } catch (error) {
    console.error('Error accessing document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to access document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}
