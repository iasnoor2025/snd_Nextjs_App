import { NextRequest, NextResponse } from 'next/server';
import { SupabaseStorageService } from '@/lib/supabase/storage-service';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentType = formData.get('document_type') as string;

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
    const path = `company-documents/${documentType || 'general'}`;
    const descriptiveFilename = SupabaseStorageService.generateDescriptiveFilename(
      documentType || 'document',
      'company-document',
      file.name
    );
    const uploadResult = await SupabaseStorageService.uploadFile(
      file,
      'documents',
      path,
      descriptiveFilename
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: `Upload failed: ${uploadResult.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'File uploaded successfully',
      data: {
        url: uploadResult.url,
        filename: uploadResult.filename,
        originalName: uploadResult.originalName,
        size: uploadResult.size,
        type: uploadResult.type,
        filePath: uploadResult.url,
      },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}
