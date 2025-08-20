import { PermissionConfigs, withPermission } from '@/lib/rbac/api-middleware';
import { NextRequest, NextResponse } from 'next/server';

export const POST = withPermission(async (request: NextRequest) => {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const documentTypeId = formData.get('documentTypeId') as string;
    const expiryDate = formData.get('expiryDate') as string;

    if (!file || !documentTypeId) {
      return NextResponse.json(
        {
          success: false,
          message: 'File and document type are required',
        },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Invalid file type. Only PDF, DOC, DOCX, PNG, JPG files are allowed.',
        },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size too large. Maximum size is 10MB.',
        },
        { status: 400 }
      );
    }

    // For now, return success with mock data
    // In a real implementation, you'd:
    // 1. Upload the file to S3/MinIO
    // 2. Store file metadata in the database
    // 3. Return the file information

    const mockUploadedFile = {
      id: Date.now(), // Mock ID
      documentTypeId: parseInt(documentTypeId),
      fileName: file.name,
      filePath: `/uploads/documents/${Date.now()}_${file.name}`,
      fileSize: file.size,
      mimeType: file.type,
      expiryDate: expiryDate || null,
      uploadedAt: new Date().toISOString(),
      uploadedBy: 'admin@example.com', // In real app, get from session
    };

    return NextResponse.json({
      success: true,
      data: mockUploadedFile,
      message: 'Document uploaded successfully',
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to upload document: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}, PermissionConfigs.company.manage);
