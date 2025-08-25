import { db } from '@/lib/db';
import { companies } from '@/lib/drizzle/schema';
import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

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

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only PDF, DOC, DOCX, JPG, and PNG files are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Upload file to Supabase storage
    const path = `companies/${id}/${documentType || 'general'}`;
    const uploadResult = await SupabaseStorageService.uploadFile(
      file,
      'documents',
      path
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Document uploaded successfully',
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        type: uploadResult.type,
        filePath: uploadResult.url,
        documentType: documentType,
        description: description,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
}
