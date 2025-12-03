import { db } from '@/lib/drizzle';
import { employeeDocuments, employees } from '@/lib/drizzle/schema';
import { withPermission, PermissionConfigs } from '@/lib/rbac/api-middleware';
import { eq, desc, inArray } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { cacheService } from '@/lib/redis/cache-service';
import { ensureHttps } from '@/lib/utils/url-utils';

export const GET = withPermission(PermissionConfigs.employee.read)(async (_request: NextRequest, ...args: unknown[]) => {
  const { params } = args[0] as { params: Promise<{ id: string }> };
  let employeeId: number | null = null;
  
  try {
    const resolvedParams = await params;

    if (!resolvedParams || !resolvedParams.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = resolvedParams;
    employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: 'Invalid employee ID' }, { status: 400 });
    }

    // Try to get from cache first
    const cacheKey = `employee:${employeeId}:documents`;
    const cachedDocuments = await cacheService.get(cacheKey, 'documents');
    
    if (cachedDocuments) {
      return NextResponse.json(cachedDocuments);
    }

    // Get employee information to include file number
    const employeeResult = await db
      .select()
      .from(employees)
      .where(eq(employees.id, employeeId))
      .limit(1);

    const employee = employeeResult[0];
    const fileNumber = employee?.fileNumber || String(employeeId);

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
      .where(eq(employeeDocuments.employeeId, employeeId))
      .orderBy(desc(employeeDocuments.createdAt));

    // Get all unique employee IDs from the documents
    const uniqueEmployeeIds = [...new Set(documentsRows.map(doc => doc.employeeId))];
    
    // Fetch file numbers for all employees
    const employeesResult = await db
      .select()
      .from(employees)
      .where(inArray(employees.id, uniqueEmployeeIds));
    
    // Create a map of employee ID to file number
    const employeeFileNumberMap = new Map();
    employeesResult.forEach(emp => {
      employeeFileNumberMap.set(emp.id, emp.fileNumber || String(emp.id));
    });

    // Format response to match what DocumentManager expects
    const formattedDocuments = documentsRows.map(doc => {
      try {
        // Create a user-friendly display name from the document type
        const displayName = doc.documentType
          ? doc.documentType.replace(/_/g, ' ').replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          : 'Unknown Document';
        
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
          employee_file_number: (() => {
            // Extract employee ID from file path if it's a MinIO URL
            const filePath = doc.filePath || '';
            const minioMatch = filePath.match(/employee-documents\/employee-(\d+)\//);
            if (minioMatch) {
              const pathEmployeeId = parseInt(minioMatch[1]);
              return employeeFileNumberMap.get(pathEmployeeId) || String(pathEmployeeId);
            }
            // Fallback to document's employee ID
            return employeeFileNumberMap.get(doc.employeeId) || String(doc.employeeId);
          })(),
          // Add image detection properties for profile page
          isImage: doc.mimeType?.startsWith('image/') || false,
          isPhoto: doc.documentType?.toLowerCase().includes('photo') || 
                   doc.documentType?.toLowerCase().includes('picture') ||
                   doc.documentType?.toLowerCase().includes('image') ||
                   doc.fileName?.toLowerCase().includes('photo') ||
                   doc.fileName?.toLowerCase().includes('picture') ||
                   doc.fileName?.toLowerCase().includes('image'),
        };
      } catch (docError) {
        console.error('Error formatting document:', doc, docError);
        // Return a safe fallback document
        return {
          id: doc.id,
          name: 'Unknown Document',
          file_name: 'Unknown Document',
          file_type: 'application/octet-stream',
          size: 0,
          url: '',
          mime_type: '',
          document_type: '',
          description: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          fileName: doc.fileName,
          filePath: doc.filePath,
          fileSize: doc.fileSize,
          mimeType: doc.mimeType,
          documentType: doc.documentType,
          createdAt: doc.createdAt,
          updatedAt: doc.updatedAt,
          typeLabel: 'Unknown Document',
          employee_file_number: (() => {
            // Extract employee ID from file path if it's a MinIO URL
            const filePath = doc.filePath || '';
            const minioMatch = filePath.match(/employee-documents\/employee-(\d+)\//);
            if (minioMatch) {
              const pathEmployeeId = parseInt(minioMatch[1]);
              return employeeFileNumberMap.get(pathEmployeeId) || String(pathEmployeeId);
            }
            // Fallback to document's employee ID
            return employeeFileNumberMap.get(doc.employeeId) || String(doc.employeeId);
          })(),
          isImage: false,
          isPhoto: false,
        };
      }
    });

    // Cache the formatted documents for 5 minutes
    await cacheService.set(cacheKey, formattedDocuments, {
      ttl: 300, // 5 minutes
      prefix: 'documents',
      tags: [`employee:${employeeId}`, 'documents']
    });

    return NextResponse.json(formattedDocuments);
  } catch (error) {
    // More detailed error information
    let errorMessage = 'Internal server error';
    let errorDetails = '';

    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }

    console.error('Error in getDocumentsHandler:', {
      error: errorMessage,
      details: errorDetails,
      timestamp: new Date().toISOString(),
      employeeId: employeeId
    });

    return NextResponse.json(
      {
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString(),
        employeeId: employeeId
      },
      { status: 500 }
    );
  }
});
