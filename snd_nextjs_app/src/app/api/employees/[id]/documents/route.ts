import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { withAuth } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis/cache-service';
import { ensureHttps } from '@/lib/utils/url-utils';

const getDocumentsHandler = async (_request: any, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Try to get from cache first
    const cacheKey = `employee:${employeeId}:documents`;
    const cachedDocuments = await cacheService.get(cacheKey, 'documents');
    
    if (cachedDocuments) {
      console.log(`Cache hit for employee ${employeeId} documents`);
      return NextResponse.json(cachedDocuments);
    }

    console.log(`Cache miss for employee ${employeeId} documents, fetching from database`);

    // Use the same approach as the working test endpoint
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
      .where(eq(employeeDocuments.employeeId, employeeId));

    // Format response to match what DocumentManager expects
    const formattedDocuments = documentsRows.map(doc => {
      // Create a user-friendly display name from the document type
      const displayName = doc.documentType
        .replace(/_/g, ' ')
        .replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
      
      return {
        id: doc.id,
        name: displayName, // Use the friendly display name instead of filename
        file_name: doc.fileName || 'Unknown Document',
        file_type: doc.mimeType || 'application/octet-stream',
        size: doc.fileSize || 0,
        url: ensureHttps(doc.filePath), // Force HTTPS to prevent Mixed Content errors
        mime_type: doc.mimeType || '',
        document_type: doc.documentType || '',
        description: doc.description || '',
        created_at: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
        updated_at: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : new Date().toISOString(),
        // Also include the original field names for backward compatibility
        fileName: doc.fileName,
        filePath: doc.filePath,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        documentType: doc.documentType,
        createdAt: doc.createdAt,
        updatedAt: doc.updatedAt,
        // Additional fields needed for DocumentManager
        typeLabel: displayName,
        employee_file_number: employeeId,
      };
    });

    // Cache the formatted documents for 5 minutes
    await cacheService.set(cacheKey, formattedDocuments, {
      ttl: 300, // 5 minutes
      prefix: 'documents',
      tags: [`employee:${employeeId}`, 'documents']
    });

    console.log(`Cached employee ${employeeId} documents for 5 minutes`);

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    // More detailed error information
    let errorMessage = 'Internal server error';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
};

export const GET = withAuth(getDocumentsHandler);
