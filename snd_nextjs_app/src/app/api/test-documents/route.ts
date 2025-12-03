import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { ensureHttps } from '@/lib/utils/url-utils';

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const employeeId = url.searchParams.get('employeeId');
    
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 });
    }

    const id = parseInt(employeeId);
    if (isNaN(id)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }
    // Test database connection
    const documentsRows = await db
      .select({
        id: employeeDocuments.id,
        employeeId: employeeDocuments.employeeId,
        documentType: employeeDocuments.documentType,
        fileName: employeeDocuments.fileName,
        filePath: employeeDocuments.filePath,
        fileSize: employeeDocuments.fileSize,
        mimeType: employeeDocuments.mimeType,
        description: employeeDocuments.description,
        createdAt: employeeDocuments.createdAt,
        updatedAt: employeeDocuments.updatedAt,
      })
      .from(employeeDocuments)
      .where(eq(employeeDocuments.employeeId, id))
      .limit(5); // Limit to 5 documents for testing
    // Test ensureHttps function
    const testUrls = [
      'http://minio.snd-ksa.online/test.jpg',
      'https://minio.snd-ksa.online/test.jpg',
      null,
      undefined,
      '',
      'invalid-url'
    ];

    const httpsTests = testUrls.map(url => ({
      original: url,
      converted: ensureHttps(url)
    }));

    // Format documents with error handling
    const formattedDocuments = documentsRows.map(doc => {
      try {
        const displayName = doc.documentType
          ? doc.documentType.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          : 'Unknown Document';
        
        return {
          id: doc.id,
          name: displayName,
          file_name: doc.fileName || 'Unknown Document',
          file_type: doc.mimeType || 'application/octet-stream',
          size: doc.fileSize || 0,
          url: ensureHttps(doc.filePath),
          original_filePath: doc.filePath, // Include original for debugging
          mime_type: doc.mimeType || '',
          document_type: doc.documentType || '',
          description: doc.description || '',
          created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
          updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        };
      } catch (docError) {
        console.error('Error formatting document:', doc, docError);
        return {
          id: doc.id,
          name: 'Error Document',
          file_name: 'Error Document',
          file_type: 'application/octet-stream',
          size: 0,
          url: '',
          original_filePath: doc.filePath,
          mime_type: '',
          document_type: '',
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          error: docError instanceof Error ? docError.message : 'Unknown error'
        };
      }
    });

    return NextResponse.json({
      success: true,
      employeeId: id,
      documentCount: documentsRows.length,
      documents: formattedDocuments,
      httpsTests: httpsTests,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Test documents error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : 'Unknown error type',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
