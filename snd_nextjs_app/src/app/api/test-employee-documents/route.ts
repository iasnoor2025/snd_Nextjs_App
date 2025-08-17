import { NextResponse } from 'next/server';
import { db } from '@/lib/drizzle';
import { employeeDocuments } from '@/lib/drizzle/schema';
import { eq } from 'drizzle-orm';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-config";

export async function GET() {
  try {
    console.log('Testing employee documents API...');
    
    // Test 1: Check authentication
    console.log('Testing authentication...');
    const session = await getServerSession(authOptions);
    console.log('Session:', session ? 'exists' : 'none');
    console.log('User:', session?.user?.email);
    console.log('Role:', session?.user?.role);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Test 2: Check database connection
    console.log('Testing database connection...');
    const testQuery = await db
      .select({ count: employeeDocuments.id })
      .from(employeeDocuments)
      .limit(1);
    
    console.log('Database test result:', testQuery);
    
    // Test 3: Check if we can query by employee ID
    console.log('Testing employee ID query...');
    const employeeId = 284; // Use a known employee ID
    
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
    console.log('Sample document:', documentsRows[0]);
    
    // Test 4: Format response
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
    
    console.log('Formatted documents:', formattedDocuments);
    
    return NextResponse.json({
      success: true,
      session: {
        user: session.user.email,
        role: session.user.role,
        id: session.user.id
      },
      documents: formattedDocuments,
      count: documentsRows.length,
      message: 'Test completed successfully'
    });
    
  } catch (error) {
    console.error('Error in test employee documents API:', error);
    
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
