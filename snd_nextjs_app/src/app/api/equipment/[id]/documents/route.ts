import { db } from '@/lib/drizzle';
import { equipmentDocuments, equipment } from '@/lib/drizzle/schema';
import { withAuth } from '@/lib/rbac/api-middleware';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

const uploadDocumentsHandler = async (
  request: NextRequest,
  { params }: { params: { id: string } }
) => {
  try {
    if (!params || !params.id) {
      return NextResponse.json({ error: 'Invalid route parameters' }, { status: 400 });
    }

    const { id } = params;
    const equipmentId = parseInt(id);

    if (!equipmentId) {
      return NextResponse.json({ error: 'Invalid equipment ID' }, { status: 400 });
    }

    // Check if equipment exists
    const equipmentResult = await db
      .select()
      .from(equipment)
      .where(eq(equipment.id, equipmentId))
      .limit(1);

    if (!equipmentResult[0]) {
      return NextResponse.json({ error: 'Equipment not found' }, { status: 404 });
    }

    const equipmentItem = equipmentResult[0];

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const rawDocumentType = (formData.get('document_type') as string) || 'general';
    const documentName = (formData.get('document_name') as string) || '';
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
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

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    // Generate path for Supabase storage
    const toTitleCase = (s: string) =>
      s.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());
    const baseLabel =
      documentName.trim() || toTitleCase((rawDocumentType || 'Document').replace(/_/g, ' '));
    const equipmentName = equipmentItem.name || `Equipment-${equipmentId}`;
    
    // Generate descriptive filename
    const descriptiveFilename = SupabaseStorageService.generateDescriptiveFilename(
      rawDocumentType || 'document',
      equipmentName,
      file.name
    );
    
    const path = `equipment-${equipmentId}`;

    // Upload file to Supabase storage
    const uploadResult = await SupabaseStorageService.uploadFile(
      file,
      'equipment-documents',
      path,
      descriptiveFilename
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.message}` },
        { status: 500 }
      );
    }

    // Save document record to database
    const documentResult = await db
      .insert(equipmentDocuments)
      .values({
        equipmentId: equipmentId,
        documentType: rawDocumentType,
        filePath: uploadResult.url || '',
        fileName: descriptiveFilename,
        fileSize: file.size,
        mimeType: file.type,
        description: description || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    const document = documentResult[0];

    if (!document) {
      throw new Error('Failed to insert document into database');
    }

    const responseData = {
      success: true,
      message: 'Document uploaded successfully',
      data: {
        id: document.id,
        name: baseLabel,
        fileName: document.fileName,
        fileType: document.mimeType?.split('/')[1]?.toUpperCase() || 'UNKNOWN',
        size: document.fileSize,
        url: document.filePath,
        mimeType: document.mimeType,
        documentType: document.documentType,
        description: document.description,
        createdAt: document.createdAt,
        updatedAt: document.updatedAt,
      },
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Error uploading document:', error);
    return NextResponse.json(
      { error: 'Failed to upload document' },
      { status: 500 }
    );
  }
};

export const POST = withAuth(uploadDocumentsHandler);
export const GET = withAuth(uploadDocumentsHandler);
