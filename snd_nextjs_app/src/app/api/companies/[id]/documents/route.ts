import { db } from '@/lib/db';
import { companies } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

// Mock company documents table - in a real implementation, you would create this table
// For now, we'll use a simple in-memory store to demonstrate the functionality
const companyDocuments = new Map<number, any[]>();

export const GET = withPermission(async (_request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID',
        },
        { status: 400 }
      );
    }

    // Check if company exists
    const companyRows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (companyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    // Get documents for this company
    const documents = companyDocuments.get(id) || [];

    return NextResponse.json({
      success: true,
      data: documents,
      message: 'Company documents retrieved successfully',
    });
  } catch (error) {
    console.error('Error fetching company documents:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch company documents: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.read);

export const POST = withPermission(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  try {
    const { id: companyId } = await params;
    const id = parseInt(companyId);

    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid company ID',
        },
        { status: 400 }
      );
    }

    // Check if company exists
    const companyRows = await db.select().from(companies).where(eq(companies.id, id)).limit(1);
    if (companyRows.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Company not found',
        },
        { status: 404 }
      );
    }

    const formData = await request.formData();
    const documentType = formData.get('documentType') as string;
    const documentNumber = formData.get('documentNumber') as string;
    const expiryDate = formData.get('expiryDate') as string;
    const description = formData.get('description') as string;
    const file = formData.get('file') as File;

    if (!documentType || !documentNumber || !file) {
      return NextResponse.json(
        {
          success: false,
          message: 'Document type, number, and file are required',
        },
        { status: 400 }
      );
    }

    // In a real implementation, you would:
    // 1. Upload the file to S3/MinIO
    // 2. Store the file URL in the database
    // 3. Create a proper company_documents table
    
    // For now, we'll simulate the document creation
    const newDocument = {
      id: Date.now(), // Simple ID generation
      companyId: id,
      documentType,
      documentNumber,
      expiryDate: expiryDate || null,
      filePath: `/uploads/companies/${id}/${file.name}`, // Simulated file path
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      description: description || null,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Store in our mock storage
    const existingDocuments = companyDocuments.get(id) || [];
    existingDocuments.push(newDocument);
    companyDocuments.set(id, existingDocuments);

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: newDocument,
    });
  } catch (error) {
    console.error('Error uploading company document:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.update);
