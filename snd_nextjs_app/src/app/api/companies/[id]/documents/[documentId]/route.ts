import { db } from '@/lib/db';
import { companies } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Mock company documents table - in a real implementation, you would create this table
// For now, we'll use a simple in-memory store to demonstrate the functionality
const companyDocuments = new Map<number, any[]>();

export const DELETE = withPermission(PermissionConfigs.company.update)(async (_request: NextRequest, ...args: unknown[]) => {
  try {
    const { params } = args[0] as { params: Promise<{ id: string; documentId: string }> };
    const resolvedParams = await params;
    const { id: companyId, documentId } = resolvedParams;
    const companyIdNum = parseInt(companyId);
    const documentIdNum = parseInt(documentId);

    if (isNaN(companyIdNum) || isNaN(documentIdNum)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID or document ID',
        },
        { status: 400 }
      );
    }

    // Check if company exists
    const companyRows = await db.select().from(companies).where(eq(companies.id, companyIdNum)).limit(1);
    if (companyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    // Get existing documents for this company
    const existingDocuments = companyDocuments.get(companyIdNum) || [];
    
    // Find the document to delete
    const documentIndex = existingDocuments.findIndex(doc => doc.id === documentIdNum);
    
    if (documentIndex === -1) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document not found',
        },
        { status: 404 }
      );
    }

    // In a real implementation, you would:
    // 1. Delete the file from S3/MinIO
    // 2. Remove the record from the database
    
    // For now, we'll just remove it from our mock storage
    existingDocuments.splice(documentIndex, 1);
    companyDocuments.set(companyIdNum, existingDocuments);

    return NextResponse.json({
      success: true,
      message: 'Document deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting company document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to delete document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
});
