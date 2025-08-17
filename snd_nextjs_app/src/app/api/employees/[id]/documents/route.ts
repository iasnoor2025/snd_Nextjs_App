import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log('Starting GET /api/employees/[id]/documents');
    
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      console.log('Authentication failed - no session');
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log('Authentication successful for user:', session.user.email);
    
    const { id } = await params;
    const employeeId = parseInt(id);

    if (isNaN(employeeId)) {
      return NextResponse.json({ error: "Invalid employee ID" }, { status: 400 });
    }

    console.log('About to query database for employee:', employeeId);
    
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

    console.log('Query successful, found:', documentsRows.length, 'documents');

    // Format response to match what DocumentManager expects
    const formattedDocuments = documentsRows.map(doc => ({
      id: doc.id,
      name: doc.fileName || 'Unknown Document',
      file_name: doc.fileName || 'Unknown Document',
      file_type: doc.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
      size: doc.fileSize || 0,
      url: doc.filePath || '',
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
    }));

    return NextResponse.json(formattedDocuments);
    
  } catch (error) {
    console.error('Error in GET /api/employees/[id]/documents:', error);
    
    // More detailed error information
    let errorMessage = 'Internal server error';
    let errorDetails = '';
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack || '';
    }
    
    console.error('Error details:', { message: errorMessage, stack: errorDetails });
    
    return NextResponse.json(
      { 
        error: errorMessage,
        details: errorDetails,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
